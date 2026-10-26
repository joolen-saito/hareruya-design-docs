/** M04-13 在庫分割結合登録編集（分割）。正本: cases/M04-13_test_cases.tsv */
import fs from "node:fs";
import { Page, test } from "@playwright/test";
import {
  DBの時刻, ステータス履歴, 在庫, 在庫IDの在庫, 在庫分割結合, 在庫変動履歴, 商品コードの在庫分割結合, 明細, 明細の登録更新, 登録時の商品名,
} from "../../db/m04_13_split_join";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { アプリの時刻帯 } from "../../lib/app_config";
import { Account, loginAdmin } from "../../lib/session";
import { searchStockList, 作業者名, 承認者名, 試験所属A, 試験店舗A, 連携作業者名 } from "../../pages/admin/m04_13_setup";
import {
  alerts, basicInfo, DASHES, openSplitNew, pressStockListAction, SplitApprovalPage, splitEditPath, SplitEditPage,
  SplitJoinListPage, splitJoinListPath, SplitNewPage, splitNewPathRe, statusHistoryRows, stockListPath, stockListState, SubmitResult,
} from "../../pages/admin/m04_13_split_join";
import { M0413_APP, M0413_NOAUTH, M0413_OP, M0413L_OP, readSplitCsv } from "../../seeds/m04-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;
const isDash = (v: string | undefined) => v !== undefined && DASHES.includes(v.trim());
const pathOf = (page: Page) => new URL(page.url()).pathname;
const EC = 1;
const SMAREGI = 2;

async function signIn(page: Page, account: Account = M0413_OP): Promise<void> {
  await loginAdmin(page, account);
}

function noteSubmit(r: SubmitResult, what: string): void {
  if (r.sent) note(`${what}の応答: ${r.status}`);
  else note(`${what}: ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

async function noteAlerts(page: Page, when: string): Promise<void> {
  const a = await alerts(page);
  note(`${when}の画面上部のメッセージ: ${a.length ? a.join(" / ") : "なし"}`);
}

/** アプリの時刻帯での「年月日」「年月日 時:分」（区切りは画面に合わせて渡す） */
let tzCache = "";
function appTime(ms: number): { ymd: string; ymdhm: string } {
  if (!tzCache) tzCache = アプリの時刻帯();
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: tzCache, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return { ymd: `${parts.year}/${parts.month}/${parts.day}`, ymdhm: `${parts.year}/${parts.month}/${parts.day} ${hour}:${parts.minute}` };
}
/** 区切り（/ と -）をそろえる */
const normDate = (s: string) => s.replace(/-/g, "/");

/** 時刻（秒）が、操作の前後の時刻の間にあること（DBとの時計のずれを数秒みる） */
function within(t: number | null, from: number, to: number): boolean {
  return t !== null && t >= from - 5 && t <= to + 5;
}

/** 期待結果の「XからY」の X（操作の前の在庫数・総原価）を確かめる。操作の前にDBで読んだ在庫を渡す */
function expectFrom(before: { 在庫数?: number; 総原価?: number } | null | undefined, from: [number, number], what: string): void {
  expect.soft([before?.在庫数, before?.総原価], `${what}（期待結果の「…から」）`).toEqual(from);
}

/** 在庫分割結合の、ケースが「更新されない」ことを確かめる項目のひとかたまり */
function splitSnapshot(id: string) {
  const head = 在庫分割結合(id);
  if (!head) throw new Error(`在庫分割結合ID ${id} が DB に無い`);
  const details = 明細(id);
  const stocks = [head.在庫ID, ...details.map((d) => d.在庫ID)].map((sid) => ({ sid, s: 在庫IDの在庫(sid) }));
  return {
    ステータス: head.ステータス, 却下理由: head.却下理由, 承認日時: head.承認日時, 承認者: head.承認者, 更新日時: head.更新日時,
    明細: details.map((d) => ({ 商品コード: d.商品コード, 数量: d.数量, 仕入総価格: d.仕入総価格 })),
    ステータス履歴の件数: ステータス履歴(id).length,
    在庫: stocks.map((x) => ({ 在庫ID: x.sid, 在庫数: x.s?.在庫数, 総原価: x.s?.総原価 })),
    在庫変動履歴の件数: stocks.map((x) => 在庫変動履歴(x.sid).length),
  };
}

// ---------------------------------------------------------------- 新規登録画面

caseTest("IT-M04-13-001", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-SRC-001";
  await step(1, async () => { await searchStockList(page, { store: 試験店舗A, zone: "EC-CUBE", code }); });
  await step(2, async () => { await pressStockListAction(page, code, "EC-CUBE", "在庫分割登録"); });
  await expected(async () => {
    expect(pathOf(page), "在庫分割新規登録画面").toMatch(splitNewPathRe);
    const split = new SplitNewPage(page);
    const info = await basicInfo(page);
    const src = await split.source();
    expect.soft(src["商品名"], "分割元商品の商品名").toBe("M04-13分割元-001");
    expect.soft(src["商品コード"], "分割元商品の商品コード").toBe(code);
    // 「商品情報」には、事前準備が値を決めている基準価格（200）も含めて確かめる
    expect.soft(src["基準価格"], "分割元商品の基準価格").toBe(yen(200));
    expect.soft(info["店舗"], "店舗").toBe(試験店舗A);
    expect.soft(info["在庫場所"], "在庫区分（画面の項目名は「在庫場所」）").toBe("EC-CUBE");
    expect.soft(src["在庫数"], "在庫数").toBe("10");
    expect.soft(src["総原価"], "総原価").toBe(yen(1000));
    expect.soft(info["処理タイプ"], "処理タイプ").toBe("在庫分割");
    for (const [項目, 画面の項目名] of [["在庫分割結合ID", "在庫分割結合ID"], ["登録日", "登録日"], ["登録者", "登録者"], ["更新日", "更新日"],
      ["更新者", "更新者"], ["承認日", "承認日"], ["承認者", "承認・却下者"]] as const) {
      expect.soft(isDash(info[画面の項目名]), `${項目}（画面の項目名「${画面の項目名}」）が「-」: 表示は「${info[画面の項目名]}」`).toBe(true);
    }
  });
});

caseTest("IT-M04-13-002", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-SRC-002";
  await step(1, async () => { await searchStockList(page, { store: 試験店舗A, zone: "EC-CUBE", code }); });
  await step(2, async () => { await pressStockListAction(page, code, "EC-CUBE", "在庫分割登録"); });
  await step(3, async () => { await new SplitNewPage(page).pressBackToStockList(); });
  await expected(async () => {
    expect(pathOf(page), "在庫検索一覧画面").toBe(stockListPath);
    const s = await stockListState(page, code, "EC-CUBE");
    expect.soft(s.店舗, "店舗").toEqual([試験店舗A]);
    expect.soft(s.在庫区分, "在庫区分").toEqual(["EC-CUBE"]);
    expect.soft(s.商品コード, "商品コード").toBe(code);
    expect.soft(s.選択, `${code} の行の選択状態`).toBe(true);
  });
});

caseTest("IT-M04-13-003", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-SRC-003";
  let split!: SplitNewPage;
  let t0 = 0, t1 = 0;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  await step(1, async () => { split = await openSplitNew(page, code); });
  await step(2, async () => { await split.分割数.fill("4"); await split.メモ.fill("分割登録試験"); });
  await step(3, async () => { t0 = DBの時刻(); noteSubmit(await split.pressRegister(), "登録ボタン"); t1 = DBの時刻(); await noteAlerts(page, "登録のあと"); });
  await step(4, async () => { rows = 商品コードの在庫分割結合(code, 試験店舗A, "在庫分割"); });
  await expected(async () => {
    expect(rows, `${code} の在庫分割が1件`).toHaveLength(1);
    const r = rows[0];
    expect.soft(r.ID, "自動採番された在庫分割結合ID").toMatch(/^\d+$/);
    expect.soft(r.処理タイプ, "処理タイプ").toBe("在庫分割");
    expect.soft(r.ステータス, "ステータス").toBe("新規登録");
    expect.soft(within(r.登録日時, t0, t1), `登録日時（${r.登録日時}）が登録の操作の時刻`).toBe(true);
    expect.soft(within(r.更新日時, t0, t1), `更新日時（${r.更新日時}）が登録の操作の時刻`).toBe(true);
    expect.soft(r.登録者, "登録者").toBe(作業者名);
    expect.soft(r.更新者, "更新者").toBe(作業者名);
    expect.soft(r.店舗, "店舗").toBe(試験店舗A);
    expect.soft(r.在庫区分番号, "在庫区分（1=EC-CUBE）").toBe(EC);
    expect.soft(r.メモ, "メモ").toBe("分割登録試験");
    expect.soft(r.商品コード, "分割元商品の商品コード").toBe(code);
    // 分割元商品の商品名: 設計書 4-7-2 は分割元商品の「商品名」を「在庫分割作成時の商品名」として保存すると定める。
    // 基本情報の照会の商品名は在庫から商品マスターをたどって読む今の名前で、保存の有無にかかわらずシードの名前と一致するので使わない（参考の注記だけ）。
    // 在庫分割結合に作成時の商品名の保存先があるかを見て、あれば値を比べ、無ければ落とす（2026-10-20 のレビューの指摘で改めた。042 と同じ）
    note(`参考: 在庫分割の在庫が指す商品の今の商品名: ${r.商品名}（期待結果の確かめには使わない）`);
    const 名 = 登録時の商品名(r.ID);
    expect.soft(名.保存先, "分割元商品の商品名（在庫分割作成時の商品名）を保存する項目が在庫分割結合にある").toBe(true);
    if (名.保存先) expect.soft(名.値, "分割元商品の商品名（在庫分割作成時の商品名）").toBe("M04-13分割元-003");
    // 「商品情報」は、設計書 4-7-2 の分割元商品の項目（基準価格・総原価は在庫分割作成時の値）も含めて確かめる
    expect.soft(r.基準価格, "分割元商品の基準価格").toBe(200);
    expect.soft(r.総原価, "分割元商品の総原価（在庫分割作成時）").toBe(1000);
    expect.soft(r.在庫数, "登録時在庫数").toBe(10);
    expect.soft(r.分割結合数, "分割数").toBe(4);
    expect.soft(r.出庫総原価, "出庫総原価").toBe(400);
  });
});

caseTest("IT-M04-13-004", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-SRC-004";
  let split!: SplitNewPage;
  // 期待結果の「10から」「1000から」を確かめるため、登録ボタンを押す前の在庫を読んでおく（手順1は画面を開いて入力するだけで、在庫を変えない）
  const before = 在庫(code, 試験店舗A, EC);
  let stock: ReturnType<typeof 在庫> = null;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  await step(1, async () => { split = await openSplitNew(page, code); await split.分割数.fill("4"); });
  await step(2, async () => { noteSubmit(await split.pressRegister(), "登録ボタン"); await noteAlerts(page, "登録のあと"); });
  await step(3, async () => { stock = 在庫(code, 試験店舗A, EC); rows = 商品コードの在庫分割結合(code, 試験店舗A, "在庫分割"); });
  await expected(async () => {
    expectFrom(before, [10, 1000], `${code} の登録前の在庫数と総原価`);
    expect.soft(stock?.在庫数, "在庫数（10から）").toBe(6);
    expect.soft(stock?.総原価, "総原価（1000から）").toBe(600);
    expect(rows, `${code} の在庫分割が1件`).toHaveLength(1);
    expect.soft(rows[0].出庫総原価, "在庫分割に保存された出庫総原価").toBe(400);
  });
});

caseTest("IT-M04-13-005", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-SRC-005";
  let t0 = 0, t1 = 0;
  let id = "";
  let hist: ReturnType<typeof 在庫変動履歴> = [];
  let status: ReturnType<typeof ステータス履歴> = [];
  await step(1, async () => {
    const split = await openSplitNew(page, code);
    t0 = DBの時刻();
    id = await split.register("4", null, "分割数4の登録");
    t1 = DBの時刻();
  });
  await step(2, async () => {
    const s = 在庫(code, 試験店舗A, EC);
    hist = s ? 在庫変動履歴(s.在庫ID).filter((h) => within(h.作成日時, t0, t1)) : [];
    status = ステータス履歴(id);
  });
  await expected(async () => {
    expect.soft(hist.map((h) => h.在庫変動区分), `${code} の、登録の操作の時刻の在庫変動履歴（分割減算）`).toEqual(["分割(減算)"]);
    expect.soft(hist[0]?.増減数, "在庫変動履歴の増減数").toBe(-4);
    expect(status, "ステータス変更履歴が1件").toHaveLength(1);
    expect.soft(status[0].ステータス, "ステータス変更履歴のステータス").toBe("新規登録");
    expect.soft(status[0].更新者, "ステータス変更履歴の変更者").toBe(作業者名);
    expect.soft(within(status[0].更新日時, t0, t1), `ステータス変更履歴の変更日時（${status[0].更新日時}）`).toBe(true);
  });
});

caseTest("IT-M04-13-006", async ({ page, step, expected }) => {
  await signIn(page);
  let split!: SplitNewPage;
  let stamps: string[] = [];
  await step(1, async () => { split = await openSplitNew(page, "M0413-SRC-006"); await split.分割数.fill("4"); });
  await step(2, async () => {
    // 登録の操作の日時（アプリの時刻帯の年月日 時:分）。押す前と押したあとで分が変われば2つ
    const before = appTime(Date.now()).ymdhm;
    noteSubmit(await split.pressRegister(), "登録ボタン");
    stamps = [...new Set([before, appTime(Date.now()).ymdhm])];
    note(`登録を行った日時（分まで）: ${stamps.join(" または ")}`);
  });
  await expected(async () => {
    const m = /\/product\/stock\/split\/(\d+)\/edit$/.exec(pathOf(page));
    expect(m, `分割先登録画面へ遷移する（いまの画面: ${page.url()}）`).not.toBeNull();
    const info = await basicInfo(page);
    expect.soft(info["在庫分割結合ID"], "自動採番された在庫分割結合ID").toBe(m![1]);
    expect.soft(info["ステータス"], "ステータス").toBe("新規登録");
    expect.soft(info["登録日"], "登録日時").toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    expect.soft(info["更新日"], "更新日時").toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    expect.soft(stamps, `登録日時（表示「${info["登録日"]}」）が登録の操作の日時`).toContain(info["登録日"]);
    expect.soft(stamps, `更新日時（表示「${info["更新日"]}」）が登録の操作の日時`).toContain(info["更新日"]);
    expect.soft(info["登録者"], "登録者").toBe(作業者名);
    expect.soft(info["更新者"], "更新者").toBe(作業者名);
  });
});

caseTest("IT-M04-13-007", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-SRC-007";
  let split!: SplitNewPage;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  let stock: ReturnType<typeof 在庫> = null;
  await step(1, async () => { split = await openSplitNew(page, code); });
  await step(2, async () => { await split.分割数.fill(""); noteSubmit(await split.pressRegister(), "分割数を空にした登録ボタン"); await noteAlerts(page, "登録ボタンのあと"); });
  await step(3, async () => { rows = 商品コードの在庫分割結合(code, 試験店舗A, "在庫分割"); stock = 在庫(code, 試験店舗A, EC); });
  await expected(async () => {
    expect.soft(rows, `${code} の在庫分割が追加されない`).toEqual([]);
    expect.soft(stock?.在庫数, "在庫数").toBe(10);
    expect.soft(stock?.総原価, "総原価").toBe(1000);
  });
});

// ---------------------------------------------------------------- 分割先登録画面（新規登録の在庫分割）

caseTest("IT-M04-13-010", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new SplitEditPage(page, notes.get("〔在庫分割結合ID-M0413-010〕"));
  await step(1, async () => { await edit.open(); await edit.pressAddDestination(); });
  await step(2, async () => { await edit.searchAndSelect("M0413-DST-A-010"); });
  await step(3, async () => { await edit.decide("M0413-DST-A-010"); await noteAlerts(page, "決定のあと"); });
  await expected(async () => {
    expect((await edit.destinations()).map((r) => r["商品コード"]), "分割先商品一覧の商品コード").toEqual(["M0413-DST-A-010"]);
  });
});

caseTest("IT-M04-13-011", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-011〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.addDestination("M0413-DST-A-011"); });
  await step(2, async () => { details = 明細(id); });
  await expected(async () => {
    expect.soft((await edit.destinations()).map((r) => r["商品コード"]), "画面の分割先商品").toEqual(["M0413-DST-A-011"]);
    expect.soft(details.map((d) => d.商品コード), `ID ${id} の分割先商品（DB）`).toEqual([]);
  });
});

caseTest("IT-M04-13-014", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-014〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  let decided = false;
  let listAfter: string[] = [];
  await step(1, async () => { await edit.open(); await edit.pressAddDestination(); });
  await step(2, async () => {
    // 検索の失敗（要求の応答の異常・失敗の表示）は握りつぶさずに落とす
    await edit.modal.searchAllowingNone("M0413-UNKNOWN");
    if ((await edit.modal.resultCount("M0413-UNKNOWN")) === 0) {
      note("商品コード M0413-UNKNOWN で検索すると、該当する商品の行が出ない。選ぶ行が無いので「決定」ボタンは押せない。"
        + "期待結果のうち「分割先商品一覧へ追加されず」は決定の操作の結果を見るものなので、不合格とする（DBの確かめは行う）");
    } else {
      await edit.modal.select("M0413-UNKNOWN");
      await edit.decide("M0413-UNKNOWN");
      decided = true;
      listAfter = (await edit.destinations()).map((r) => r["商品コード"]);
      note(`決定のあとの分割先商品一覧: ${listAfter.join(" / ") || "なし"}`);
      await noteAlerts(page, "決定のあと");
    }
  });
  await step(3, async () => { details = 明細(id); });
  await expected(async () => {
    expect.soft(decided, "手順2の「決定」ボタンを押せた（押せなければ、一覧へ追加されないことを操作の結果として確かめられない）").toBe(true);
    if (decided) expect.soft(listAfter, "決定のあとの分割先商品一覧").not.toContain("M0413-UNKNOWN");
    expect.soft(details, `ID ${id} の分割先商品（DB）`).toEqual([]);
  });
});

caseTest("IT-M04-13-015", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-015〕");
  const edit = new SplitEditPage(page, id);
  const before = splitSnapshot(id);
  let after!: ReturnType<typeof splitSnapshot>;
  await step(1, async () => {
    await edit.open();
    await edit.addDestination("M0413-SRC-015");
    await noteAlerts(page, "分割元と同じ商品を追加したあと");
    if ((await edit.destRow("M0413-SRC-015").count()) === 1) await edit.setDestinationQuantity("M0413-SRC-015", "1");
    else note("分割元と同じ M0413-SRC-015 は分割先商品一覧に入らず、分割先在庫数の欄が無いので1を入力できない");
  });
  await step(2, async () => { await edit.chooseApprovalTargets(試験所属A, 承認者名); });
  await step(3, async () => {
    if (await edit.pressApplyApproval()) { await edit.confirmApplyApproval(); await noteAlerts(page, "承認申請のあと"); }
    else note("分割先が0件のため、フッターに承認申請ボタンが表示されない。押せない（期待結果はDBで確かめる）");
  });
  await step(4, async () => { after = splitSnapshot(id); });
  await expected(async () => {
    expect.soft(after.ステータス, "ステータス").toBe(before.ステータス);
    expect.soft(after.明細, "分割先商品").toEqual(before.明細);
    expect.soft(after.ステータス履歴の件数, "ステータス変更履歴の件数").toBe(before.ステータス履歴の件数);
  });
});

caseTest("IT-M04-13-016", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-016〕");
  const edit = new SplitEditPage(page, id);
  const before = 明細(id);
  let after: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.addDestination("M0413-DST-A-016"); });
  await step(2, async () => { await edit.pressDelete("M0413-DST-A-016"); });
  await step(3, async () => { await edit.confirmDelete(); await noteAlerts(page, "削除のあと"); });
  await step(4, async () => { after = 明細(id); });
  await expected(async () => {
    expect.soft((await edit.destinations()).map((r) => r["商品コード"]), "画面の分割先商品").not.toContain("M0413-DST-A-016");
    expect.soft(after, "DBの分割先商品（更新されない）").toEqual(before);
  });
});

caseTest("IT-M04-13-017", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new SplitEditPage(page, notes.get("〔在庫分割結合ID-M0413-017〕"));
  await step(1, async () => {
    await edit.open();
    await edit.addDestination("M0413-DST-A-017");
    await edit.setDestinationQuantity("M0413-DST-A-017", "2");
  });
  await step(2, async () => { await edit.addDestination("M0413-DST-B-017"); });
  await expected(async () => {
    const rows = await edit.destinations();
    expect(rows.map((r) => r["商品コード"]), "分割先商品一覧の並び（B が先頭、A がその後）").toEqual(["M0413-DST-B-017", "M0413-DST-A-017"]);
    expect.soft(rows[1]?.["分割先在庫数"], "数量入力済みの M0413-DST-A-017 の分割先在庫数").toBe("2");
  });
});

caseTest("IT-M04-13-018", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new SplitEditPage(page, notes.get("〔在庫分割結合ID-M0413-018〕"));
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  let header: string[] = [];
  let file: import("@playwright/test").Download;
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); });
  await step(2, async () => { file = await edit.downloadTemplate(); });
  await step(3, async () => {
    const p = await file.path();
    const rows = parseCsv(decodeCsvBytes(fs.readFileSync(p)));
    header = rows[0] ?? [];
    note(`ダウンロードしたCSV（${file.suggestedFilename()}）の見出し: ${header.join(",")}`);
  });
  await expected(async () => {
    expect.soft(downloads, "ダウンロードされたCSVは1件").toHaveLength(1);
    expect.soft(header, "見出しに「商品コード」").toContain("商品コード");
    expect.soft(header, "見出しに「分割先分割在庫数」").toContain("分割先分割在庫数");
  });
});

/** 分割先商品CSV登録モーダルで、シードが作ったCSVを選んで「商品登録」を押す */
async function uploadSplitCsv(edit: SplitEditPage, name: string): Promise<{ ok: boolean; errors: string[] }> {
  await edit.chooseCsv(name, readSplitCsv(name));
  const r = await edit.pressCsvRegister();
  note(`CSV登録（${name}）の結果: ${r.ok ? "成功" : `失敗（${r.errors.join(" / ")}）`}`);
  return r;
}

caseTest("IT-M04-13-019", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-019〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); });
  await step(2, async () => { await edit.chooseCsv("split_valid-019.csv", readSplitCsv("split_valid-019.csv")); });
  await step(3, async () => {
    const r = await edit.pressCsvRegister();
    note(`CSV登録の結果: ${r.ok ? "成功" : `失敗（${r.errors.join(" / ")}）`}`);
  });
  await step(4, async () => { details = 明細(id); });
  await expected(async () => {
    // 開き直さずに、商品登録ボタンのあとの画面の一覧を読む（取込に成功したのに画面が読み込み直されなければ、手順3で落ちる）
    const rows = await edit.destinations();
    expect.soft(rows.map((r) => [r["商品コード"], r["分割先在庫数"]]), "分割先商品一覧（CSVの数量2）").toEqual([["M0413-DST-A-019", "2"], ["M0413-DST-B-019", "2"]]);
    expect.soft(details, "DBの分割先商品").toEqual([]);
  });
});

caseTest("IT-M04-13-023", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-023〕");
  const edit = new SplitEditPage(page, id);
  let errors: string[] = [];
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); await edit.chooseCsv("split_21_errors-023.csv", readSplitCsv("split_21_errors-023.csv")); });
  await step(2, async () => { const r = await edit.pressCsvRegister(); note(`CSV登録の応答: ${r.ok ? "成功" : `失敗（${r.errors.length}件）`}`); });
  await step(3, async () => { errors = await edit.csvErrors(); details = 明細(id); });
  await expected(async () => {
    note(`画面のエラー: ${errors.join(" / ")}`);
    expect.soft(errors, "エラーが20件").toHaveLength(20);
    errors.forEach((e, i) => {
      expect.soft(e, `エラー ${i + 1} 件目に行番号`).toMatch(/\d+行目/);
      expect.soft(e, `エラー ${i + 1} 件目に商品コード`).toMatch(/M0413-UNKNOWN-023-\d{2}/);
    });
    expect.soft(details, "DBの分割先商品").toEqual([]);
  });
});

caseTest("IT-M04-13-024", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new SplitEditPage(page, notes.get("〔在庫分割結合ID-M0413-024〕"));
  await step(1, async () => { await edit.open(); await edit.addDestination("M0413-DST-A-024"); });
  await step(2, async () => { await edit.openCsvModal(); await uploadSplitCsv(edit, "split_replace-024.csv"); });
  await expected(async () => {
    // 開き直さずに、CSV登録のあとの画面の一覧を読む
    expect((await edit.destinations()).map((r) => r["商品コード"]), "分割先商品一覧（A が消え、C だけ）").toEqual(["M0413-DST-C-024"]);
  });
});

caseTest("IT-M04-13-025", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-025〕");
  const edit = new SplitEditPage(page, id);
  const before = splitSnapshot(id);
  let after!: ReturnType<typeof splitSnapshot>;
  await step(1, async () => { await edit.open(); await edit.chooseApprovalTargets(試験所属A, 承認者名); });
  await step(2, async () => {
    if (await edit.pressApplyApproval()) { await edit.confirmApplyApproval(); await noteAlerts(page, "承認申請のあと"); }
    else note("分割先が0件のため、フッターに承認申請ボタンが表示されない。押せない（期待結果はDBで確かめる）");
  });
  await step(3, async () => { after = splitSnapshot(id); });
  await expected(async () => {
    expect.soft(after.ステータス, "ステータス").toBe(before.ステータス);
    expect.soft(after.明細, "分割先商品").toEqual(before.明細);
    expect.soft(after.ステータス履歴の件数, "ステータス変更履歴の件数").toBe(before.ステータス履歴の件数);
  });
});

caseTest("IT-M04-13-026", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-026〕");
  const edit = new SplitEditPage(page, id);
  const before = splitSnapshot(id);
  let after!: ReturnType<typeof splitSnapshot>;
  await step(1, async () => {
    await edit.open();
    await edit.addDestination("M0413-DST-A-026");
    await edit.setDestinationQuantity("M0413-DST-A-026", "2");
  });
  await step(2, async () => {
    await edit.chooseApprovalTargets(試験所属A, null);
    note("承認通知先は所属だけ試験所属Aを選び、メンバーは選ばない。承認申請は確認のモーダルの「承認申請」で送られるので、それも押した");
    if (await edit.pressApplyApproval()) { await edit.confirmApplyApproval(); await noteAlerts(page, "承認申請のあと"); }
    else note("フッターに承認申請ボタンが表示されない");
  });
  await step(3, async () => { after = splitSnapshot(id); });
  await expected(async () => {
    expect.soft(after.ステータス, "ステータス").toBe(before.ステータス);
    expect.soft(after.明細, "分割先商品").toEqual(before.明細);
    expect.soft(after.ステータス履歴の件数, "ステータス変更履歴の件数").toBe(before.ステータス履歴の件数);
  });
});

caseTest("IT-M04-13-027", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-027〕");
  const edit = new SplitEditPage(page, id);
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let details: ReturnType<typeof 明細> = [];
  let history: ReturnType<typeof ステータス履歴> = [];
  let audit!: ReturnType<typeof 明細の登録更新>;
  let s0 = 0;
  await step(1, async () => {
    s0 = DBの時刻();
    await edit.open();
    for (const c of ["M0413-DST-A-027", "M0413-DST-B-027"]) { await edit.addDestination(c); await edit.setDestinationQuantity(c, "2"); }
  });
  await step(2, async () => { await edit.メモ.fill("分割承認申請"); });
  await step(3, async () => { await edit.chooseApprovalTargets(試験所属A, 承認者名); });
  await step(4, async () => {
    if (!(await edit.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
    t0 = DBの時刻(); await edit.confirmApplyApproval(); t1 = DBの時刻();
    await noteAlerts(page, "承認申請のあと");
  });
  await step(5, async () => { head = 在庫分割結合(id); details = 明細(id); history = ステータス履歴(id); audit = 明細の登録更新(id); });
  await expected(async () => {
    expect.soft(details.map((d) => [d.商品コード, d.在庫数, d.数量]), "分割先2件（商品・登録時在庫数・数量）").toEqual([["M0413-DST-A-027", 5, 2], ["M0413-DST-B-027", 8, 2]]);
    expect.soft(details.map((d) => d.商品名), "分割先の商品情報（商品名）").toEqual(["M04-13 M0413-DST-A-027", "M04-13 M0413-DST-B-027"]);
    for (const k of ["登録日時", "更新日時", "登録者", "更新者"] as const) {
      if (!audit.保存先[k]) {
        note(`分割先商品（在庫分割結合の明細）の表に${k}を保存する項目が無い。保存先が無いので保存されない`);
        expect.soft(audit.保存先[k], `分割先商品の${k}の保存先（DBの明細の項目）`).toBe(true);
      }
    }
    // 登録・更新日時は、この操作（手順1の分割先の追加〜手順4の承認申請の確定）の時刻の間にあること。登録・更新者は M04-13作業者
    for (const r of audit.行) {
      if (audit.保存先.登録日時) expect.soft(within(r.登録日時, s0, t1), `${r.商品コード} の登録日時が操作（手順1〜4）の時刻`).toBe(true);
      if (audit.保存先.更新日時) expect.soft(within(r.更新日時, s0, t1), `${r.商品コード} の更新日時が操作（手順1〜4）の時刻`).toBe(true);
      if (audit.保存先.登録者) expect.soft(r.登録者, `${r.商品コード} の登録者`).toBe(作業者名);
      if (audit.保存先.更新者) expect.soft(r.更新者, `${r.商品コード} の更新者`).toBe(作業者名);
    }
    expect.soft(head?.ステータス, "基本情報のステータス").toBe("分割承認待ち");
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時が承認申請の時刻").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(作業者名);
    expect.soft(head?.メモ, "メモ").toBe("分割承認申請");
    const last = history[history.length - 1];
    expect.soft(last?.ステータス, "ステータス変更履歴（最新）").toBe("分割承認待ち");
    expect.soft(last?.更新者, "ステータス変更履歴の変更者").toBe(作業者名);
    expect.soft(within(last?.更新日時 ?? null, t0, t1), "ステータス変更履歴の変更日時").toBe(true);
  });
});

/** 分割先登録画面で分割先を追加・数量を入れて、承認通知先を選んで承認申請を確定する */
async function applyWith(edit: SplitEditPage, dests: [string, string][]): Promise<void> {
  await edit.open();
  for (const [c, q] of dests) { await edit.addDestination(c); await edit.setDestinationQuantity(c, q); }
}
async function confirmApply(edit: SplitEditPage): Promise<void> {
  await edit.chooseApprovalTargets(試験所属A, 承認者名);
  if (!(await edit.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
  await edit.confirmApplyApproval();
  await noteAlerts(edit.page, "承認申請のあと");
}

caseTest("IT-M04-13-028", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-028〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  let head: ReturnType<typeof 在庫分割結合> = null;
  await step(1, async () => { await applyWith(edit, [["M0413-DST-A-028", "2"], ["M0413-DST-B-028", "2"]]); });
  await step(2, async () => { await confirmApply(edit); });
  await step(3, async () => { details = 明細(id); head = 在庫分割結合(id); });
  await expected(async () => {
    const byCode = Object.fromEntries(details.map((d) => [d.商品コード, d.仕入総価格]));
    expect.soft(byCode["M0413-DST-A-028"], "M0413-DST-A-028 の仕入総価格").toBe(160);
    expect.soft(byCode["M0413-DST-B-028"], "M0413-DST-B-028 の仕入総価格").toBe(240);
    expect.soft(details.reduce((s, d) => s + (d.仕入総価格 ?? 0), 0), "仕入総価格の合計と分割元の出庫総原価").toBe(head?.出庫総原価);
  });
});

// ---------------------------------------------------------------- 分割承認画面

caseTest("IT-M04-13-030", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const approval = new SplitApprovalPage(page, notes.get("〔在庫分割結合ID-M0413-030〕"));
  await step(1, async () => { await approval.open(); });
  await expected(async () => {
    for (const [name, b] of [["却下ボタン", approval.却下ボタン], ["承認ボタン", approval.承認ボタン]] as const) {
      await expect.soft(b, `${name}が表示される`).toBeVisible();
      await expect.soft(b, `${name}が押せる`).toBeEnabled();
    }
  });
});

caseTest("IT-M04-13-031", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-031〕");
  const approval = new SplitApprovalPage(page, id);
  const before = { A: 在庫("M0413-DST-A-031", 試験店舗A, EC), B: 在庫("M0413-DST-B-031", 試験店舗A, EC) };
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let history: ReturnType<typeof ステータス履歴> = [];
  let after = { A: null as ReturnType<typeof 在庫>, B: null as ReturnType<typeof 在庫> };
  let histA: ReturnType<typeof 在庫変動履歴> = [], histB: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.メモ.fill("分割承認完了"); });
  await step(3, async () => { await approval.pressApprove(); t0 = DBの時刻(); await approval.confirm("approve"); t1 = DBの時刻(); await noteAlerts(page, "承認のあと"); });
  await step(4, async () => {
    head = 在庫分割結合(id); history = ステータス履歴(id);
    after = { A: 在庫("M0413-DST-A-031", 試験店舗A, EC), B: 在庫("M0413-DST-B-031", 試験店舗A, EC) };
    histA = before.A ? 在庫変動履歴(before.A.在庫ID).filter((h) => within(h.作成日時, t0, t1)) : [];
    histB = before.B ? 在庫変動履歴(before.B.在庫ID).filter((h) => within(h.作成日時, t0, t1)) : [];
  });
  await expected(async () => {
    expect.soft(head?.ステータス, "ステータス").toBe("入庫完了");
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時が承認の時刻").toBe(true);
    expect.soft(within(head?.承認日時 ?? null, t0, t1), "承認日時が承認の時刻").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(承認者名);
    expect.soft(head?.承認者, "承認者").toBe(承認者名);
    expect.soft(head?.メモ, "メモ").toBe("分割承認完了");
    const last = history[history.length - 1];
    expect.soft([last?.ステータス, last?.更新者], "ステータス変更履歴（最新）").toEqual(["入庫完了", 承認者名]);
    expectFrom(before.A, [5, 500], "M0413-DST-A-031 の承認前の在庫数と総原価");
    expectFrom(before.B, [8, 800], "M0413-DST-B-031 の承認前の在庫数と総原価");
    expect.soft([after.A?.在庫数, after.A?.総原価], "M0413-DST-A-031 の在庫数（5から）と総原価（500から）").toEqual([7, 660]);
    expect.soft([after.B?.在庫数, after.B?.総原価], "M0413-DST-B-031 の在庫数（8から）と総原価（800から）").toEqual([10, 1040]);
    expect.soft(histA.length, "M0413-DST-A-031 の在庫変動履歴（承認の時刻）").toBeGreaterThan(0);
    expect.soft(histB.length, "M0413-DST-B-031 の在庫変動履歴（承認の時刻）").toBeGreaterThan(0);
    expect.soft(pathOf(page), "入庫済状態の登録画面（分割先登録画面）へ遷移").toBe(splitEditPath(id));
  });
});

caseTest("IT-M04-13-032", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-032〕");
  const approval = new SplitApprovalPage(page, id);
  const before = splitSnapshot(id);
  let after!: ReturnType<typeof splitSnapshot>;
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.却下理由.fill(""); await approval.pressReject(); });
  await step(3, async () => { await approval.confirm("reject"); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => { after = splitSnapshot(id); });
  await expected(async () => {
    expect.soft(after.ステータス, "ステータス").toBe(before.ステータス);
    expect.soft(after.却下理由, "却下理由").toBe(before.却下理由);
    expect.soft(after.在庫, "在庫と総原価（分割元・分割先）").toEqual(before.在庫);
    expect.soft(after.ステータス履歴の件数, "ステータス変更履歴の件数").toBe(before.ステータス履歴の件数);
    expect.soft(after.在庫変動履歴の件数, "在庫変動履歴の件数").toEqual(before.在庫変動履歴の件数);
  });
});

caseTest("IT-M04-13-033", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-033〕");
  const approval = new SplitApprovalPage(page, id);
  const before = splitSnapshot(id);
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let after!: ReturnType<typeof splitSnapshot>;
  let history: ReturnType<typeof ステータス履歴> = [];
  let srcHist: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.却下理由.fill("分割内容不一致"); await approval.メモ.fill("分割却下"); });
  await step(3, async () => { await approval.pressReject(); t0 = DBの時刻(); await approval.confirm("reject"); t1 = DBの時刻(); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => {
    head = 在庫分割結合(id); after = splitSnapshot(id); history = ステータス履歴(id);
    srcHist = head ? 在庫変動履歴(head.在庫ID).filter((h) => within(h.作成日時, t0, t1)) : [];
  });
  await expected(async () => {
    expect.soft(head?.ステータス, "ステータス").toBe("却下");
    expect.soft(head?.却下理由, "却下理由").toBe("分割内容不一致");
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時").toBe(true);
    expect.soft(within(head?.承認日時 ?? null, t0, t1), "承認日時").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(承認者名);
    expect.soft(head?.承認者, "承認者").toBe(承認者名);
    expect.soft(head?.メモ, "メモ").toBe("分割却下");
    const last = history[history.length - 1];
    expect.soft([last?.ステータス, last?.更新者], "ステータス変更履歴（最新）").toEqual(["却下", 承認者名]);
    expectFrom(before.在庫[0], [6, 600], "分割元 M0413-SRC-033 の却下前の在庫数と総原価");
    expect.soft([after.在庫[0].在庫数, after.在庫[0].総原価], "分割元 M0413-SRC-033 の在庫数（6から）と総原価（600から）").toEqual([10, 1000]);
    expect.soft(srcHist.map((h) => h.在庫変動区分), "分割元の、分割棄却による加算の在庫変動履歴").toEqual(["分割(棄却)"]);
    expect.soft(after.在庫.slice(1), "分割先の在庫（更新されない）").toEqual(before.在庫.slice(1));
    expect.soft(pathOf(page), "却下済状態の登録画面（分割先登録画面）へ遷移").toBe(splitEditPath(id));
  });
});

caseTest("IT-M04-13-034", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_NOAUTH);
  const a = notes.get("〔在庫分割結合ID-M0413-034A〕");
  const b = notes.get("〔在庫分割結合ID-M0413-034B〕");
  const before = { a: splitSnapshot(a), b: splitSnapshot(b) };
  let after!: typeof before;
  await step(1, async () => {
    const p = new SplitApprovalPage(page, a);
    const res = await p.open();
    note(`ID ${a} の分割承認画面の応答: ${res?.status()}`);
    if ((await p.承認ボタン.count()) === 0) note(`ID ${a} の分割承認画面に承認ボタンが表示されない。承認を実行できない（期待結果はDBで確かめる）`);
    else { await p.pressApprove(); await p.confirm("approve"); await noteAlerts(page, "承認のあと"); }
  });
  await step(2, async () => {
    const p = new SplitApprovalPage(page, b);
    await p.open();
    if ((await p.却下ボタン.count()) === 0) note(`ID ${b} の分割承認画面に却下理由の入力欄と却下ボタンが表示されない。却下を実行できない（期待結果はDBで確かめる）`);
    else { await p.却下理由.fill("権限なし却下"); await p.pressReject(); await p.confirm("reject"); await noteAlerts(page, "却下のあと"); }
  });
  await step(3, async () => { after = { a: splitSnapshot(a), b: splitSnapshot(b) }; });
  await expected(async () => {
    for (const k of ["a", "b"] as const) {
      const id = k === "a" ? a : b;
      expect.soft(after[k].ステータス, `ID ${id} のステータス`).toBe(before[k].ステータス);
      expect.soft([after[k].承認日時, after[k].承認者], `ID ${id} の承認情報`).toEqual([before[k].承認日時, before[k].承認者]);
      expect.soft(after[k].却下理由, `ID ${id} の却下理由`).toBe(before[k].却下理由);
      expect.soft(after[k].在庫, `ID ${id} の在庫と総原価`).toEqual(before[k].在庫);
      expect.soft(after[k].ステータス履歴の件数, `ID ${id} のステータス変更履歴の件数`).toBe(before[k].ステータス履歴の件数);
      expect.soft(after[k].在庫変動履歴の件数, `ID ${id} の在庫変動履歴の件数`).toEqual(before[k].在庫変動履歴の件数);
    }
  });
});

caseTest("IT-M04-13-035", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_OP);
  const approval = new SplitApprovalPage(page, notes.get("〔在庫分割結合ID-M0413-035〕"));
  await step(1, async () => { await approval.open(); });
  await expected(async () => {
    for (const [name, b] of [["却下ボタン", approval.却下ボタン], ["承認ボタン", approval.承認ボタン]] as const) {
      const operable = (await b.count()) > 0 && (await b.isVisible()) && (await b.isEnabled());
      expect.soft(operable, `${name}が操作可能な状態で表示されない`).toBe(false);
    }
  });
});

caseTest("IT-M04-13-036", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_OP);
  const ids = { A: notes.get("〔在庫分割結合ID-M0413-036A〕"), B: notes.get("〔在庫分割結合ID-M0413-036B〕") };
  const seen: Record<string, { path: string; 状態: string; 操作: Record<string, number>; 却下理由: string | null }> = {};
  await step(1, async () => {
    for (const k of ["A", "B"] as const) {
      const edit = new SplitEditPage(page, ids[k]);
      await edit.open();
      const reason = page.locator(".card").filter({ has: page.locator(".card-header", { hasText: "却下理由" }) }).locator("textarea");
      seen[k] = {
        path: pathOf(page), 状態: (await basicInfo(page))["ステータス"],
        操作: {
          分割先商品追加ボタン: await edit.分割先登録ボタン.count(), 分割先商品CSV登録ボタン: await edit.CSV登録ボタン.count(),
          承認申請ボタン: await edit.承認申請ボタン.count(), 分割先在庫数の入力欄: await page.locator("input.js-split-dest-qty").count(),
          削除ボタン: await page.locator("button.js-stock-delete-detail").count(),
        },
        却下理由: (await reason.count()) ? await reason.inputValue() : null,
      };
    }
  });
  await expected(async () => {
    for (const k of ["A", "B"] as const) {
      note(`ID ${ids[k]}: ステータス表示「${seen[k].状態}」`);
      for (const [name, n] of Object.entries(seen[k].操作)) expect.soft(n, `ID ${ids[k]} は編集不可（${name}が無い）`).toBe(0);
    }
    expect.soft(seen.B.却下理由, `ID ${ids.B} の却下理由`).toBe("分割内容不一致");
  });
});

// ---------------------------------------------------------------- 連携・表示・履歴

caseTest("IT-M04-13-080", async ({ page, step, expected }) => {
  await signIn(page, M0413L_OP);
  const code = "M0413L-SRC-001";
  let split!: SplitNewPage;
  let dates: string[] = [];
  let list!: SplitJoinListPage;
  await step(1, async () => { await searchStockList(page, { store: 試験店舗A, zone: "EC-CUBE", code }); });
  await step(2, async () => { await pressStockListAction(page, code, "EC-CUBE", "在庫分割登録"); split = new SplitNewPage(page); });
  await step(3, async () => { await split.分割数.fill("4"); });
  await step(4, async () => {
    const before = appTime(Date.now()).ymd;
    noteSubmit(await split.pressRegister(), "登録ボタン");
    dates = [...new Set([before, appTime(Date.now()).ymd])];
    note(`手順4を行った日付: ${dates.join(" または ")}`);
  });
  await step(5, async () => { list = new SplitJoinListPage(page); await list.open(); });
  await step(6, async () => { await list.search(code); });
  await expected(async () => {
    const rows = await list.rows();
    expect(rows, `${code} を分割元とする行がちょうど1件`).toHaveLength(1);
    const r = rows[0];
    expect.soft(r.種別, "タイプ").toBe("在庫分割");
    expect.soft(r.矢印, "タイプの矢印（右矢印）").toBe("→");
    expect.soft(r.店舗, "店舗").toBe(試験店舗A);
    expect.soft(r.在庫区分, "在庫区分").toBe("EC-CUBE");
    // 設計書（在庫分割結合検索一覧の 5-5 と画面イメージ）は、この欄に商品名だけを出すと定める（状態は別の項目）。欄の文字全体を比べる
    note(`分割元商品名の欄の表示: 「${r.商品名}」（欄の文字全体を正本の商品名と比べる）`);
    expect.soft(r.商品名, "分割元商品名（欄の文字全体）").toBe("M04-13連携分割元-001");
    expect.soft(r.元点数, "分割元点数").toMatch(/^4点(\s|$)/);
    expect.soft(r.ステータス, "ステータス").toBe("新規登録");
    expect.soft(r.登録者, "登録者").toBe(連携作業者名);
    expect.soft(dates, `登録日（表示「${r.登録日}」）が手順4で控えた日付`).toContain(r.登録日.slice(0, 10));
  });
});

caseTest("IT-M04-13-082", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-082〕");
  const approval = new SplitApprovalPage(page, id);
  let stamps: string[] = [];
  let info: Record<string, string> = {};
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.pressApprove(); });
  await step(3, async () => {
    const before = appTime(Date.now()).ymdhm;
    await approval.confirm("approve");
    stamps = [...new Set([before, appTime(Date.now()).ymdhm])];
    note(`承認を行った日時（分まで）: ${stamps.join(" または ")}`);
  });
  await step(4, async () => {
    expect(pathOf(page), "入庫済状態の登録画面（分割先登録画面）").toBe(splitEditPath(id));
    info = await basicInfo(page);
  });
  await expected(async () => {
    expect.soft(stamps, `承認日（表示「${info["承認日"]}」）が手順3で控えた日時`).toContain(info["承認日"]);
    expect.soft(info["承認日"], "承認日が YYYY/MM/DD HH:mm 形式").toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    expect.soft(info["承認・却下者"], "承認者（画面の項目名「承認・却下者」）").toBe(承認者名);
    expect.soft(isDash(info["承認日"]) || isDash(info["承認・却下者"]), "承認日・承認者が「-」ではない").toBe(false);
  });
});

caseTest("IT-M04-13-084", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new SplitEditPage(page, notes.get("〔在庫分割結合ID-M0413-084〕"));
  let errors: string[] = [];
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); });
  await step(2, async () => { await edit.chooseCsv("split_noqty-084.csv", readSplitCsv("split_noqty-084.csv")); });
  await step(3, async () => { await edit.pressCsvRegister(); });
  await step(4, async () => { errors = await edit.csvErrors(); note(`画面のエラー: ${errors.join(" / ")}`); });
  await expected(async () => {
    expect(errors, "エラーが1件").toHaveLength(1);
    note("「CSVの該当行の行番号」は、CSVファイル上の行番号（見出しを1行目と数える）とした。M0413-DST-A-084 の行は2行目");
    expect.soft(errors[0], "エラーにCSVの該当行の行番号（2行目）").toMatch(/(^|\D)2\s*行目/);
    expect.soft(errors[0], "エラーに商品コード").toContain("M0413-DST-A-084");
    expect.soft(errors[0], "エラーに商品名").toContain("M04-13分割先-084");
  });
});

caseTest("IT-M04-13-086", async ({ page, step, expected }) => {
  await signIn(page);
  let split!: SplitNewPage;
  let dates: string[] = [];
  let rows: Record<string, string>[] = [];
  await step(1, async () => { split = await openSplitNew(page, "M0413-SRC-086"); await split.分割数.fill("4"); });
  await step(2, async () => {
    const before = appTime(Date.now()).ymd;
    noteSubmit(await split.pressRegister(), "登録ボタン");
    dates = [...new Set([before, appTime(Date.now()).ymd])];
  });
  await step(3, async () => { rows = await statusHistoryRows(page); });
  await expected(async () => {
    expect(rows, "ステータス変更履歴が1件").toHaveLength(1);
    expect.soft(dates, `更新日（表示「${rows[0]["更新日"]}」）が手順2で控えた日付`).toContain(normDate(rows[0]["更新日"] ?? "").slice(0, 10));
    expect.soft(rows[0]["ステータス"], "ステータス").toBe("新規登録");
    expect.soft(rows[0]["更新者"], "更新者").toBe(作業者名);
  });
});

caseTest("IT-M04-13-087", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-087〕");
  const list = new SplitJoinListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.search("M0413-SRC-087"); });
  await step(3, async () => { await list.openById(id); expect(pathOf(page), "分割先登録画面").toBe(splitEditPath(id)); });
  await step(4, async () => { await new SplitEditPage(page, id).pressListLink(); });
  await expected(async () => {
    expect(pathOf(page), "在庫分割結合検索一覧画面").toBe(splitJoinListPath);
    expect.soft(await list.商品コード.inputValue(), "商品コード欄").toBe("M0413-SRC-087");
    expect.soft(await list.checkedTargets(), "商品名・商品コード検索対象").toEqual(["分割元・結合先"]);
    expect.soft((await list.rows()).map((r) => r.ID), "検索結果の行").toContain(id);
  });
});

/** 在庫IDの、操作の時刻の在庫変動履歴 */
function historiesBetween(stockId: string | undefined, t0: number, t1: number): ReturnType<typeof 在庫変動履歴> {
  return stockId ? 在庫変動履歴(stockId).filter((h) => within(h.作成日時, t0, t1)) : [];
}

caseTest("IT-M04-13-094", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-094〕");
  const approval = new SplitApprovalPage(page, id);
  const sA = 在庫("M0413-DST-A-094", 試験店舗A, EC), sB = 在庫("M0413-DST-B-094", 試験店舗A, EC);
  let t0 = 0, t1 = 0;
  let hA: ReturnType<typeof 在庫変動履歴> = [], hB: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.pressApprove(); });
  await step(3, async () => { t0 = DBの時刻(); await approval.confirm("approve"); t1 = DBの時刻(); await noteAlerts(page, "承認のあと"); });
  await step(4, async () => { hA = historiesBetween(sA?.在庫ID, t0, t1); hB = historiesBetween(sB?.在庫ID, t0, t1); });
  await expected(async () => {
    for (const [code, h] of [["M0413-DST-A-094", hA], ["M0413-DST-B-094", hB]] as const) {
      expect.soft(h.length, `${code} の在庫変動履歴が1件`).toBe(1);
      const r = h[0];
      expect.soft(r?.在庫変動区分, `${code} の在庫変動区分`).toBe("分割(加算)");
      expect.soft(r?.在庫変動理由 ?? "", `${code} の在庫変動理由の書き出し`).toMatch(/^在庫分割による加算/);
      for (const part of ["M0413-SRC-094", "M0413-DST-A-094", "M0413-DST-B-094", id]) expect.soft(r?.在庫変動理由 ?? "", `${code} の在庫変動理由に「${part}」`).toContain(part);
    }
  });
});

caseTest("IT-M04-13-095", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-095〕");
  const approval = new SplitApprovalPage(page, id);
  const s = 在庫("M0413-SRC-095", 試験店舗A, EC);
  let t0 = 0, t1 = 0;
  let h: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.却下理由.fill("分割棄却履歴試験"); });
  await step(3, async () => { await approval.pressReject(); t0 = DBの時刻(); await approval.confirm("reject"); t1 = DBの時刻(); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => { h = historiesBetween(s?.在庫ID, t0, t1); });
  await expected(async () => {
    expect.soft(h.length, "M0413-SRC-095 の在庫変動履歴が1件").toBe(1);
    expect.soft(h[0]?.在庫変動区分, "在庫変動区分").toBe("分割(棄却)");
    expect.soft(h[0]?.在庫変動理由 ?? "", "在庫変動理由の書き出し").toMatch(/^在庫分割棄却による戻し/);
    for (const part of ["M0413-SRC-095", "M0413-DST-A-095", "M0413-DST-B-095", id]) expect.soft(h[0]?.在庫変動理由 ?? "", `在庫変動理由に「${part}」`).toContain(part);
  });
});

caseTest("IT-M04-13-096", async ({ page, step, expected }) => {
  await signIn(page);
  let id = "";
  let h: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { id = await (await openSplitNew(page, "M0413-SUB-096")).register("4", null, "分割数4の登録"); });
  await step(2, async () => {
    const s = 在庫("M0413-SUB-096", 試験店舗A, EC);
    h = s ? 在庫変動履歴(s.在庫ID).filter((x) => x.登録元ID === id) : [];
  });
  await expected(async () => {
    expect.soft(h.length, `登録で採番された在庫結合分割番号 ${id} に紐づく在庫変動履歴が1件`).toBe(1);
    expect.soft(h[0]?.在庫変動区分, "在庫変動区分").toBe("分割(減算)");
    expect.soft(h[0]?.在庫変動理由 ?? "", "在庫変動理由の書き出し").toMatch(/^在庫分割による減算/);
    for (const part of ["M0413-SUB-096", id]) expect.soft(h[0]?.在庫変動理由 ?? "", `在庫変動理由に「${part}」`).toContain(part);
  });
});

caseTest("IT-M04-13-098", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-098〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  let head: ReturnType<typeof 在庫分割結合> = null;
  await step(1, async () => { await applyWith(edit, [["M0413-DST-A-098", "1"]]); });
  await step(2, async () => { await confirmApply(edit); });
  await step(3, async () => { details = 明細(id); head = 在庫分割結合(id); });
  await expected(async () => {
    expect.soft(details.map((d) => [d.商品コード, d.仕入総価格]), "M0413-DST-A-098 の仕入総価格").toEqual([["M0413-DST-A-098", 400]]);
    expect.soft(head?.ステータス, "ステータス").toBe("分割承認待ち");
  });
});

caseTest("IT-M04-13-100", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-100〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); });
  await step(2, async () => { await edit.chooseCsv("split_one-100.csv", readSplitCsv("split_one-100.csv")); });
  await step(3, async () => { const r = await edit.pressCsvRegister(); note(`CSV登録の結果: ${r.ok ? "成功" : `失敗（${r.errors.join(" / ")}）`}`); });
  await step(4, async () => { details = 明細(id); });
  await expected(async () => {
    // 開き直さずに、商品登録ボタンのあとの画面の一覧を読む
    expect.soft((await edit.destinations()).map((r) => [r["商品コード"], r["分割先在庫数"]]), "分割先商品一覧（数量2の1件だけ）").toEqual([["M0413-DST-A-100", "2"]]);
    expect.soft(details, "DBの分割先商品").toEqual([]);
  });
});

/** 在庫検索一覧で検索し、行を選んで在庫分割登録を押し、分割数を入れて登録する（手順1〜3） */
async function splitFromList(page: Page, step: (n: number, body: () => Promise<void>) => Promise<void>, code: string, zone: "EC-CUBE" | "スマレジ", qty: string): Promise<void> {
  await step(1, async () => { await searchStockList(page, { store: 試験店舗A, zone, code }); });
  await step(2, async () => { await pressStockListAction(page, code, zone, "在庫分割登録"); });
  await step(3, async () => {
    const split = new SplitNewPage(page);
    await split.分割数.fill(qty);
    noteSubmit(await split.pressRegister(), "登録ボタン");
    await noteAlerts(page, "登録のあと");
  });
}

caseTest("IT-M04-13-101", async ({ page, step, expected }) => {
  await signIn(page);
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  let stock: ReturnType<typeof 在庫> = null;
  const before = 在庫("M0413-SRC-101", 試験店舗A, EC);
  await splitFromList(page, step, "M0413-SRC-101", "EC-CUBE", "10");
  await step(4, async () => { rows = 商品コードの在庫分割結合("M0413-SRC-101", 試験店舗A, "在庫分割"); stock = 在庫("M0413-SRC-101", 試験店舗A, EC); });
  await expected(async () => {
    expect.soft(rows.length, "在庫分割が登録される").toBe(1);
    expectFrom(before, [10, 1000], "M0413-SRC-101 の登録前の在庫数と総原価");
    expect.soft([stock?.在庫数, stock?.総原価], "在庫数（10から）と総原価（1000から）").toEqual([0, 0]);
  });
});

caseTest("IT-M04-13-103", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-103〕");
  const edit = new SplitEditPage(page, id);
  let errors: string[] = [];
  let rows: Record<string, string>[] = [];
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); });
  await step(2, async () => { await edit.chooseCsv("split_mixed-103.csv", readSplitCsv("split_mixed-103.csv")); });
  await step(3, async () => { await edit.pressCsvRegister(); });
  await step(4, async () => {
    errors = await edit.csvErrors();
    note(`画面のエラー: ${errors.join(" / ")}`);
    rows = await edit.destinations();
  });
  await step(5, async () => { details = 明細(id); });
  await expected(async () => {
    expect(errors, "エラーが1件").toHaveLength(1);
    note("「CSVの該当行の行番号」は、CSVファイル上の行番号（見出しを1行目と数える）とした。M0413-DST-C-103 の行は3行目（2行目は正しい M0413-DST-A-103 の行）");
    expect.soft(errors[0], "エラーにCSVの該当行の行番号（3行目）").toMatch(/(^|\D)3\s*行目/);
    expect.soft(errors[0], "エラーに商品コード").toContain("M0413-DST-C-103");
    expect.soft(errors[0], "エラーに商品名").toContain("M04-13分割先-103");
    expect.soft(rows, "分割先商品一覧は0件のまま").toEqual([]);
    expect.soft(details, "DBの分割先商品は0件のまま").toEqual([]);
  });
});

caseTest("IT-M04-13-105", async ({ page, step, expected }) => {
  await signIn(page);
  let sm: ReturnType<typeof 在庫> = null, ec: ReturnType<typeof 在庫> = null;
  const before = { sm: 在庫("M0413-SRC-105", 試験店舗A, SMAREGI), ec: 在庫("M0413-SRC-105", 試験店舗A, EC) };
  await splitFromList(page, step, "M0413-SRC-105", "スマレジ", "3");
  await step(4, async () => { sm = 在庫("M0413-SRC-105", 試験店舗A, SMAREGI); ec = 在庫("M0413-SRC-105", 試験店舗A, EC); });
  await expected(async () => {
    expectFrom(before.sm, [7, 840], "スマレジ在庫の登録前の在庫数と総原価");
    expectFrom(before.ec, [10, 1000], "EC-CUBE在庫の登録前の在庫数と総原価（「のまま」の前）");
    expect.soft([sm?.在庫数, sm?.総原価], "スマレジ在庫の在庫数（7から）と総原価（840から）").toEqual([4, 480]);
    expect.soft([ec?.在庫数, ec?.総原価], "EC-CUBE在庫の在庫数と総原価（そのまま）").toEqual([10, 1000]);
  });
});

caseTest("IT-M04-13-106", async ({ page, step, expected }) => {
  await signIn(page);
  let stock: ReturnType<typeof 在庫> = null;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  const before = 在庫("M0413-SRC-106", 試験店舗A, EC);
  await splitFromList(page, step, "M0413-SRC-106", "EC-CUBE", "1");
  await step(4, async () => { stock = 在庫("M0413-SRC-106", 試験店舗A, EC); rows = 商品コードの在庫分割結合("M0413-SRC-106", 試験店舗A, "在庫分割"); });
  await expected(async () => {
    expectFrom(before, [3, 1000], "M0413-SRC-106 の登録前の在庫数と総原価");
    expect.soft([stock?.在庫数, stock?.総原価], "在庫数（3から）と総原価（1000から）").toEqual([2, 667]);
    expect.soft(rows.map((r) => r.出庫総原価), "在庫分割の出庫総原価").toEqual([333]);
  });
});

caseTest("IT-M04-13-107", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-107〕");
  const edit = new SplitEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  let head: ReturnType<typeof 在庫分割結合> = null;
  await step(1, async () => { await applyWith(edit, [["M0413-DST-A-107", "1"], ["M0413-DST-B-107", "1"], ["M0413-DST-C-107", "1"]]); });
  await step(2, async () => { await confirmApply(edit); });
  await step(3, async () => { details = 明細(id); head = 在庫分割結合(id); });
  await expected(async () => {
    const byCode = Object.fromEntries(details.map((d) => [d.商品コード, d.仕入総価格]));
    expect.soft([byCode["M0413-DST-A-107"], byCode["M0413-DST-B-107"], byCode["M0413-DST-C-107"]], "仕入総価格（A・B・C）").toEqual([34, 33, 33]);
    expect.soft(details.reduce((s, d) => s + (d.仕入総価格 ?? 0), 0), "仕入総価格の合計と出庫総原価").toBe(head?.出庫総原価);
    expect.soft(head?.出庫総原価, "出庫総原価").toBe(100);
  });
});

caseTest("IT-M04-13-108", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const approval = new SplitApprovalPage(page, notes.get("〔在庫分割結合ID-M0413-108〕"));
  let totals: (number | undefined)[] = [];
  const beforeTotals = ["A", "B", "C"].map((x) => 在庫(`M0413-DST-${x}-108`, 試験店舗A, EC)?.総原価);
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.pressApprove(); await approval.confirm("approve"); await noteAlerts(page, "承認のあと"); });
  await step(3, async () => { totals = ["A", "B", "C"].map((x) => 在庫(`M0413-DST-${x}-108`, 試験店舗A, EC)?.総原価); });
  await expected(async () => {
    expect.soft(beforeTotals, "承認前の総原価（期待結果の「A は500から・B は800から・C は300から」）").toEqual([500, 800, 300]);
    expect.soft(totals, "総原価（A は500から・B は800から・C は300から）").toEqual([534, 833, 333]);
  });
});

caseTest("IT-M04-13-109", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const approval = new SplitApprovalPage(page, notes.get("〔在庫分割結合ID-M0413-109〕"));
  let total: number | undefined;
  const beforeTotal = 在庫("M0413-SRC-109", 試験店舗A, EC)?.総原価;
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.却下理由.fill("分割内容不一致"); });
  await step(3, async () => { await approval.pressReject(); await approval.confirm("reject"); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => { total = 在庫("M0413-SRC-109", 試験店舗A, EC)?.総原価; });
  await expected(async () => {
    expect.soft(beforeTotal, "M0413-SRC-109 の却下前の総原価（期待結果の「667から」）").toBe(667);
    expect.soft(total, "M0413-SRC-109 の総原価（667から）").toBe(1000);
  });
});

caseTest("IT-M04-13-110", async ({ page, step, expected }) => {
  await signIn(page);
  let stock: ReturnType<typeof 在庫> = null;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  const before = 在庫("M0413-SRC-110", 試験店舗A, EC);
  await splitFromList(page, step, "M0413-SRC-110", "EC-CUBE", "4");
  await step(4, async () => { stock = 在庫("M0413-SRC-110", 試験店舗A, EC); rows = 商品コードの在庫分割結合("M0413-SRC-110", 試験店舗A, "在庫分割"); });
  await expected(async () => {
    expectFrom(before, [6, 600], "M0413-SRC-110 の登録前の在庫数と総原価");
    expect.soft([stock?.在庫数, stock?.総原価], "在庫数（6から）と総原価（600から）").toEqual([2, 200]);
    expect.soft(rows.length, "M0413-SRC-110 の在庫分割が計2件").toBe(2);
    const added = rows[rows.length - 1];
    expect.soft([added?.分割結合数, added?.出庫総原価], "新たに保存された在庫分割の分割数と出庫総原価").toEqual([4, 400]);
  });
});

caseTest("IT-M04-13-111", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new SplitEditPage(page, notes.get("〔在庫分割結合ID-M0413-111〕"));
  let rows: Record<string, string>[] = [];
  await step(1, async () => { await edit.open(); await edit.openCsvModal(); await uploadSplitCsv(edit, "split_dup-111.csv"); });
  await step(2, async () => {
    // 取込が成功すれば画面は読み込み直してモーダルは閉じている。拒まれたときはモーダルが開いたままなので、閉じてから開き直す（画面は開き直さない）
    await edit.closeCsvModalIfOpen();
    await edit.openCsvModal();
    await uploadSplitCsv(edit, "split_dup-111.csv");
  });
  await step(3, async () => { rows = await edit.destinations(); });
  await expected(async () => {
    expect(rows.map((r) => [r["商品コード"], r["分割先在庫数"]]), "分割先商品一覧（各数量2で1行ずつ、計2件）")
      .toEqual([["M0413-DST-A-111", "2"], ["M0413-DST-B-111", "2"]]);
  });
});
