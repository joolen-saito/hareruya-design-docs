/** M04-13 在庫分割結合登録編集（結合）。正本: cases/M04-13_test_cases.tsv */
import fs from "node:fs";
import { expect, Page, test } from "@playwright/test";
import {
  DBの時刻, ステータス履歴, 在庫, 在庫IDの在庫, 在庫分割結合, 在庫変動履歴, 商品コードの在庫分割結合, 明細, 明細の登録時の商品名, 明細の登録更新, 登録時の商品名,
} from "../../db/m04_13_split_join";
import { caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { アプリの時刻帯 } from "../../lib/app_config";
import { Account, loginAdmin } from "../../lib/session";
import { searchStockList, 作業者名, 承認者名, 試験所属A, 試験店舗A, 連携作業者名 } from "../../pages/admin/m04_13_setup";
import {
  alerts, basicInfo, card, DASHES, JoinApprovalPage, joinApprovalPath, JoinEditPage, joinEditPath, JoinNewPage, joinShortagePath,
  openJoinNew, pressStockListAction, SplitJoinListPage, statusHistoryRows, stockListPath, stockListState, SubmitResult, tableRecords, 今の結合の画面,
} from "../../pages/admin/m04_13_split_join";
import { anyCode, M0413_APP, M0413_NOAUTH, M0413_OP, M0413L_OP } from "../../seeds/m04-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;
const isDash = (v: string | undefined) => v !== undefined && DASHES.includes(v.trim());
const pathOf = (page: Page) => new URL(page.url()).pathname;
const EC = 1;
const toNum = (s: string | undefined) => Number((s ?? "").replace(/[¥,\s]/g, ""));

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

let tzCache = "";
function appYmd(ms: number): string {
  if (!tzCache) tzCache = アプリの時刻帯();
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tzCache, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}/${p.month}/${p.day}`;
}
/** アプリの時刻帯での「年月日 時:分」（画面の表示の形） */
function appYmdhm(ms: number): string {
  if (!tzCache) tzCache = アプリの時刻帯();
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: tzCache, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}
const normDate = (s: string) => s.replace(/-/g, "/");

function within(t: number | null, from: number, to: number): boolean {
  return t !== null && t >= from - 5 && t <= to + 5;
}

/** 在庫結合の、ケースが「更新されない」ことを確かめる項目のひとかたまり */
function joinSnapshot(id: string) {
  const head = 在庫分割結合(id);
  if (!head) throw new Error(`在庫分割結合ID ${id} が DB に無い`);
  const details = 明細(id);
  const stockIds = [head.在庫ID, ...details.map((d) => d.在庫ID)];
  return {
    ステータス: head.ステータス, 却下理由: head.却下理由, 承認日時: head.承認日時, 承認者: head.承認者,
    結合元: details.map((d) => ({ 商品コード: d.商品コード, 数量: d.数量, 欠品点数: d.欠品点数 })),
    ステータス履歴の件数: ステータス履歴(id).length,
    在庫: stockIds.map((sid) => { const s = 在庫IDの在庫(sid); return { 在庫ID: sid, 在庫数: s?.在庫数, 総原価: s?.総原価 }; }),
    在庫変動履歴の件数: stockIds.map((sid) => 在庫変動履歴(sid).length),
  };
}

/** 結合計画承認画面で「却下」を押したあと、却下理由（と結合登録メモ）を入れる。
 * 画面の却下理由の欄は確認のモーダルの外にあるので、モーダルを「キャンセル」で閉じて入力し、もう一度「却下」を押してモーダルを出す */
async function fillReasonAfterRejectButton(page: Page, approval: JoinApprovalPage, reason: string, memo?: string): Promise<void> {
  note("画面の却下理由の入力欄は、却下の確認のモーダルの外にある。モーダルを「キャンセル」で閉じて入力し、もう一度「却下」を押して確認のモーダルを出した");
  await page.locator("#joinRejectConfirmModal").getByRole("button", { name: "キャンセル" }).click();
  await expect(page.locator("#joinRejectConfirmModal"), "却下の確認モーダルが閉じる").toBeHidden();
  await approval.却下理由.fill(reason);
  if (memo !== undefined) await approval.メモ.fill(memo);
  await approval.pressReject();
}

// ---------------------------------------------------------------- 新規登録画面

caseTest("IT-M04-13-040", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-JOIN-DST-040";
  await step(1, async () => { await searchStockList(page, { store: 試験店舗A, zone: "EC-CUBE", code }); });
  await step(2, async () => { await pressStockListAction(page, code, "EC-CUBE", "在庫結合登録"); });
  await step(3, async () => { await new JoinNewPage(page).pressBackToStockList(); });
  await expected(async () => {
    expect(pathOf(page), "在庫検索一覧画面").toBe(stockListPath);
    const s = await stockListState(page, code, "EC-CUBE");
    expect.soft(s.店舗, "店舗").toEqual([試験店舗A]);
    expect.soft(s.在庫区分, "在庫区分").toEqual(["EC-CUBE"]);
    expect.soft(s.商品コード, "商品コード").toBe(code);
    expect.soft(s.選択, `${code} の行の選択状態`).toBe(true);
  });
});

caseTest("IT-M04-13-041", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-JOIN-DST-041";
  let join!: JoinNewPage;
  await step(1, async () => { join = await openJoinNew(page, code); });
  await expected(async () => {
    const info = await basicInfo(page);
    const target = await join.target();
    expect.soft(info["処理タイプ"], "処理タイプ").toBe("在庫結合");
    expect.soft(info["店舗"], "店舗").toBe(試験店舗A);
    expect.soft(target["在庫区分"], "在庫区分").toBe("EC-CUBE");
    expect.soft(target["商品名"], "商品名").toBe("M04-13結合対象-041");
    expect.soft(target["商品コード"], "商品コード").toBe(code);
    // 「商品情報」は、事前準備が値を決めている在庫数3・総原価300・基準価格500（と、シードの仕入単価100から決まる原価単価100）も含めて確かめる
    // （001 の分割元商品の表と同じ扱い。2026-10-20 のレビューの指摘で足した）
    expect.soft(target["基準価格"], "結合先商品の基準価格").toBe(yen(500));
    expect.soft(target["原価単価"], "結合先商品の原価単価（シードの仕入単価100）").toBe(yen(100));
    expect.soft(target["総原価"], "結合先商品の総原価").toBe(yen(300));
    expect.soft(target["在庫数"], "結合先商品の在庫数").toBe("3");
    for (const [項目, 画面の項目名] of [["在庫分割結合ID", "在庫分割結合ID"], ["ステータス", "ステータス"], ["登録日", "登録日"], ["更新日", "更新日"],
      ["登録者", "登録者"], ["更新者", "更新者"], ["結合承認日", "承認日"], ["結合承認者", "承認・却下者"]] as const) {
      expect.soft(isDash(info[画面の項目名]), `${項目}（画面の項目名「${画面の項目名}」）が「-」: 表示は「${info[画面の項目名]}」`).toBe(true);
    }
  });
});

caseTest("IT-M04-13-042", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-JOIN-DST-042";
  let join!: JoinNewPage;
  let t0 = 0, t1 = 0;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  let history: ReturnType<typeof ステータス履歴> = [];
  await step(1, async () => { join = await openJoinNew(page, code); await join.結合数.fill("2"); await join.メモ.fill("結合登録試験"); });
  await step(2, async () => { t0 = DBの時刻(); noteSubmit(await join.pressRegister(), "登録ボタン"); t1 = DBの時刻(); await noteAlerts(page, "登録のあと"); });
  await step(3, async () => { rows = 商品コードの在庫分割結合(code, 試験店舗A, "在庫結合"); history = rows[0] ? ステータス履歴(rows[0].ID) : []; });
  await expected(async () => {
    expect(rows, `${code} の在庫結合が1件`).toHaveLength(1);
    const r = rows[0];
    expect.soft(r.ID, "自動採番された在庫分割結合ID").toMatch(/^\d+$/);
    expect.soft(r.処理タイプ, "処理タイプ").toBe("在庫結合");
    expect.soft(r.ステータス, "ステータス").toBe("新規登録");
    expect.soft(within(r.登録日時, t0, t1) && within(r.更新日時, t0, t1), "登録・更新日時が登録の時刻").toBe(true);
    expect.soft([r.登録者, r.更新者], "登録・更新者").toEqual([作業者名, 作業者名]);
    expect.soft(r.メモ, "メモ").toBe("結合登録試験");
    // 選択商品の商品名: 設計書は結合先商品の「商品名」を「在庫結合登録時の商品名」として保存すると定める。
    // 基本情報の照会の商品名は在庫から商品マスターをたどって読む今の名前で、保存の有無にかかわらずシードの名前と一致するので使わない（参考の注記だけ）。
    // 在庫分割結合に登録時の商品名の保存先があるかを見て、あれば値を比べ、無ければ落とす（2026-10-20 のレビューの指摘で改めた）
    note(`参考: 在庫結合の在庫が指す商品の今の商品名: ${r.商品名}（期待結果の確かめには使わない）`);
    const 名 = 登録時の商品名(r.ID);
    expect.soft(名.保存先, "選択商品の商品名（在庫結合登録時の商品名）を保存する項目が在庫分割結合にある").toBe(true);
    if (名.保存先) expect.soft(名.値, "選択商品の商品名（在庫結合登録時の商品名）").toBe(`M04-13 ${code}`);
    expect.soft(r.基準価格, "基準価格").toBe(500);
    expect.soft(r.原価単価, "原価単価").toBe(100);
    expect.soft(r.総原価, "総原価").toBe(300);
    expect.soft(r.在庫数, "在庫数").toBe(3);
    expect.soft(r.分割結合数, "結合数").toBe(2);
    expect.soft(history.map((h) => [h.ステータス, h.更新者]), "ステータス変更履歴").toEqual([["新規登録", 作業者名]]);
  });
});

caseTest("IT-M04-13-043", async ({ page, step, expected }) => {
  await signIn(page);
  let join!: JoinNewPage;
  let stamps: string[] = [];
  await step(1, async () => { join = await openJoinNew(page, "M0413-JOIN-DST-043"); await join.結合数.fill("2"); });
  await step(2, async () => {
    // 登録の操作の日時（アプリの時刻帯の年月日 時:分）。押す前と押したあとで分が変われば2つ。006 と同じ確かめ方（2026-10-20 に、形だけの確かめから直した）
    const before = appYmdhm(Date.now());
    noteSubmit(await join.pressRegister(), "登録ボタン");
    stamps = [...new Set([before, appYmdhm(Date.now())])];
    note(`登録を行った日時（分まで）: ${stamps.join(" または ")}`);
  });
  await expected(async () => {
    const m = /\/product\/stock\/join\/(\d+)\/edit$/.exec(pathOf(page));
    expect(m, `結合元登録画面へ遷移する（いまの画面: ${page.url()}）`).not.toBeNull();
    const info = await basicInfo(page);
    expect.soft(info["在庫分割結合ID"], "自動採番された在庫分割結合ID").toBe(m![1]);
    expect.soft(info["登録日"], "登録日時").toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    expect.soft(info["更新日"], "更新日時").toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    expect.soft(stamps, `登録日時（表示「${info["登録日"]}」）が登録の操作の日時`).toContain(info["登録日"]);
    expect.soft(stamps, `更新日時（表示「${info["更新日"]}」）が登録の操作の日時`).toContain(info["更新日"]);
    expect.soft([info["登録者"], info["更新者"]], "登録者・更新者").toEqual([作業者名, 作業者名]);
  });
});

caseTest("IT-M04-13-044", async ({ page, step, expected }) => {
  await signIn(page);
  const code = "M0413-JOIN-DST-044";
  let join!: JoinNewPage;
  let rows: ReturnType<typeof 商品コードの在庫分割結合> = [];
  await step(1, async () => { join = await openJoinNew(page, code); });
  await step(2, async () => { await join.結合数.fill(""); noteSubmit(await join.pressRegister(), "結合数を空にした登録ボタン"); await noteAlerts(page, "登録ボタンのあと"); });
  await step(3, async () => { rows = 商品コードの在庫分割結合(code, 試験店舗A, "在庫結合"); });
  await expected(async () => {
    expect(rows, `${code} の在庫結合が追加されない`).toEqual([]);
  });
});

caseTest("IT-M04-13-047", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-047〕");
  const list = new SplitJoinListPage(page);
  let fromList = "", afterNew = "", newId = "", afterNewName = "";
  await step(1, async () => { await list.open(); await list.search("M0413-JOIN-DST-047"); await list.openById(id); });
  await step(2, async () => {
    fromList = pathOf(page);
    const 画面 = await 今の結合の画面(page);
    note(`一覧から選んで移った画面: ${画面.名前 ?? "結合の画面のどれでもない"}（題名「${画面.題名}」）`);
  });
  await step(3, async () => {
    const join = await openJoinNew(page, "M0413-JOIN-DST-047");
    await join.結合数.fill("2");
    noteSubmit(await join.pressRegister(), "登録ボタン");
    await noteAlerts(page, "登録のあと");
    afterNew = pathOf(page);
    newId = /\/product\/stock\/join\/(\d+)\/edit$/.exec(afterNew)?.[1] ?? "";
    const 画面 = await 今の結合の画面(page);
    afterNewName = `${画面.名前 ?? "結合の画面のどれでもない"}（題名「${画面.題名}」）`;
  });
  await expected(async () => {
    expect.soft(fromList, "一覧からの選択で結合元登録画面へ遷移").toBe(joinEditPath(id));
    expect.soft(newId, `新規登録完了で結合元登録画面へ遷移（いまの画面: ${afterNewName}）`).toMatch(/^\d+$/);
  });
});

// ---------------------------------------------------------------- 結合元登録画面

caseTest("IT-M04-13-048", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-048〕");
  const edit = new JoinEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.pressAddSource(); });
  await step(2, async () => { await edit.searchAndSelect("M0413-JOIN-A-048"); });
  await step(3, async () => { await edit.decide("M0413-JOIN-A-048"); await noteAlerts(page, "決定のあと"); });
  await step(4, async () => { details = 明細(id); });
  await expected(async () => {
    expect.soft(details.map((d) => d.商品コード), "DBの結合元商品（即時登録）").toEqual(["M0413-JOIN-A-048"]);
    await edit.open();
    expect.soft((await edit.sources()).map((r) => r["商品コード"]), "再読み込み後の一覧").toEqual(["M0413-JOIN-A-048"]);
  });
});

caseTest("IT-M04-13-050", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-050〕");
  const edit = new JoinEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  let summary!: Awaited<ReturnType<JoinEditPage["summary"]>>;
  let rows: Record<string, string>[] = [];
  await step(1, async () => { await edit.open(); await edit.addSource("M0413-JOIN-A-050"); await edit.addSource("M0413-JOIN-B-050"); });
  await step(2, async () => {
    note(`A の保存の応答: ${JSON.stringify(await edit.setSourceQuantity("M0413-JOIN-A-050", "4"))}`);
    note(`B の保存の応答: ${JSON.stringify(await edit.setSourceQuantity("M0413-JOIN-B-050", "2"))}`);
  });
  await step(3, async () => { details = 明細(id); summary = await edit.summary(); rows = await edit.sources(); note(`画面の合計欄: ${JSON.stringify(summary)}`); });
  await expected(async () => {
    expect.soft(details.map((d) => [d.商品コード, d.数量]), "DBの結合元在庫数").toEqual([["M0413-JOIN-A-050", 4], ["M0413-JOIN-B-050", 2]]);
    expect.soft(summary.点数, "結合元商品合計").toBe("6");
    const std = rows.reduce((s, r) => s + toNum(r["基準価格"]) * toNum(r["結合元在庫数"]), 0);
    const cost = rows.reduce((s, r) => s + toNum(r["原価単価"]) * toNum(r["結合元在庫数"]), 0);
    expect.soft(summary.基準価格合計, "基準価格合計（各行の基準価格×結合元在庫数の合計）が再表示").toBe(yen(std));
    expect.soft(summary.総原価合計, "総原価合計（各行の原価単価×結合元在庫数の合計）が再表示").toBe(yen(cost));
  });
});

caseTest("IT-M04-13-058", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-058〕");
  const edit = new JoinEditPage(page, id);
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => {
    await edit.open();
    await edit.addSource("M0413-JOIN-A-058"); await edit.setSourceQuantity("M0413-JOIN-A-058", "4");
    await edit.addSource("M0413-JOIN-B-058"); await edit.setSourceQuantity("M0413-JOIN-B-058", "2");
  });
  await step(2, async () => { await edit.メモ.fill("結合元登録完了"); });
  await step(3, async () => { t0 = DBの時刻(); await edit.pressFooterSourceRegister(); t1 = DBの時刻(); await noteAlerts(page, "結合元商品登録のあと"); });
  await step(4, async () => { head = 在庫分割結合(id); details = 明細(id); });
  await expected(async () => {
    const byCode = Object.fromEntries(details.map((d) => [d.商品コード, d.仕入総価格]));
    expect.soft(byCode["M0413-JOIN-A-058"], "M0413-JOIN-A-058 の仕入総価格").toBe(400);
    expect.soft(byCode["M0413-JOIN-B-058"], "M0413-JOIN-B-058 の仕入総価格").toBe(200);
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(作業者名);
    expect.soft(head?.メモ, "メモ").toBe("結合元登録完了");
    expect.soft(pathOf(page), "結合計画承認申請画面へ遷移").toBe(joinShortagePath(id));
  });
});

caseTest("IT-M04-13-060", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const a = notes.get("〔在庫分割結合ID-M0413-060A〕");
  const b = notes.get("〔在庫分割結合ID-M0413-060B〕");
  let first = "", second = "";
  await step(1, async () => {
    const list = new SplitJoinListPage(page);
    await list.open();
    await list.search(anyCode("060", "TA"));
    await list.openById(a);
    first = pathOf(page);
  });
  await step(2, async () => {
    const edit = new JoinEditPage(page, b);
    await edit.open();
    if ((await edit.フッターの結合元商品登録ボタン.count()) === 0) {
      note(`ID ${b} の結合元登録画面に、フッターの結合元商品登録ボタンが無い（結合元が表示されない: ${(await edit.sources()).length}件）。押せない`);
    } else {
      await edit.pressFooterSourceRegister();
      await noteAlerts(page, "結合元商品登録のあと");
    }
    second = pathOf(page);
  });
  await expected(async () => {
    expect.soft(first, `ID ${a}: 一覧からの選択で結合計画承認申請画面へ遷移`).toBe(joinShortagePath(a));
    expect.soft(second, `ID ${b}: 結合元登録完了で結合計画承認申請画面へ遷移`).toBe(joinShortagePath(b));
  });
});

// ---------------------------------------------------------------- 結合計画承認申請画面（欠品入力）

caseTest("IT-M04-13-061", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new JoinEditPage(page, notes.get("〔在庫分割結合ID-M0413-061〕"));
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  let rows: string[][] = [];
  await step(1, async () => { await edit.openShortageEntry(); });
  await step(2, async () => {
    const [d] = await Promise.all([page.waitForEvent("download"), edit.CSV出力.click()]);
    rows = parseCsv(decodeCsvBytes(fs.readFileSync(await d.path())));
    note(`ダウンロードしたCSV: ${rows.map((r) => r.join(",")).join(" / ")}`);
    // 参考: アプリの検品CSV登録のモーダルに出る書式の表。モーダルの書式もCSV出力も同じアプリが作り、モーダルの雛形のリンクは
    // CSV出力と同じ出力先を指すので、比べれば必ず一致する。期待結果の正には使わない（2026-10-20 のレビューの指摘で改めた）
    const modal = await page.locator("#joinShortageCsvModal table td.table-light").evaluateAll((tds) => tds.map((td) =>
      Array.from(td.childNodes).filter((n) => !(n instanceof HTMLElement && n.classList.contains("badge"))).map((n) => n.textContent ?? "").join("").trim()));
    note(`参考: アプリの検品CSV登録のモーダルに出る書式の項目: ${modal.join("・")}（期待結果の正には使わない）`);
  });
  await expected(async () => {
    // 検品CSV登録の書式の正は設計書から取る。設計書 0202「在庫分割結合登録編集（結合)」の「各種出力について」は、検品CSV登録を
    // 「結合元商品の欠品点数および担当者をCSVで登録する」「CSVの内容に応じて欠品点数および担当者が仮登録状態となり」と定める（列は一つずつ挙げていない）。
    // そこで、結合元商品を指す列（各行に結合元商品の商品コード）と、欠品点数・担当者の列があることを確かめる
    const head = rows[0] ?? [];
    expect.soft(downloads, "ダウンロードされたCSVは1件").toHaveLength(1);
    for (const 項目 of ["欠品点数", "担当者"]) {
      expect.soft(head, `見出しに、設計書の検品CSV登録が登録する項目「${項目}」の列がある（見出し: ${head.join(",")}）`).toContain(項目);
    }
    const sources = [anyCode("061", "A"), anyCode("061", "B")];
    expect.soft(rows.slice(1).map((r) => r.find((v) => sources.includes(v)) ?? `（結合元商品の商品コードが無い行: ${r.join(",")}）`),
      "結合元商品が対象（各行が結合元A・Bを指す）").toEqual(sources);
  });
});

caseTest("IT-M04-13-063", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new JoinEditPage(page, notes.get("〔在庫分割結合ID-M0413-063〕"));
  const c = "M0413-JOIN-A-063";
  let saved!: Awaited<ReturnType<JoinEditPage["pressShortageButton"]>>;
  await step(1, async () => { await edit.openShortageEntry(); await edit.fillShortage(c, "1"); });
  await step(2, async () => {
    saved = await edit.pressShortageButton(c);
    note(`欠品登録の保存の要求の応答: ${saved.status}・本文 ${JSON.stringify(saved.body)}`);
  });
  await expected(async () => {
    // 画面のスクリプトは保存の応答を待たずに、成否に関係なく入力欄を読み取り専用にしてボタンの文字を変える。
    // 仮登録（ログイン中のセッションへの保存）は、保存が成功したときだけ行われる（失敗も応答の状態は200で、本文で失敗を返す）。
    // そこで、保存の応答の本文が成功であることを確かめ、同じセッションで結合計画承認申請画面を開き直して、
    // セッションの仮登録から作られた画面に欠品点数1と取り消しボタンが出ることを確かめる（押した直後の画面は見ない）
    expect.soft(saved.body?.ok, `欠品点数の保存の応答が成功（応答 ${saved.status}・本文 ${JSON.stringify(saved.body)}）`).toBe(true);
    await edit.openShortageEntry();
    await expect.soft(edit.shortageInput(c), "開き直した画面で、欠品点数1が仮登録されている（入力欄の値が1）").toHaveValue("1");
    await expect.soft(edit.shortageInput(c), "開き直した画面で、仮登録された欠品点数の入力欄が読み取り専用").toHaveAttribute("readonly", "");
    await expect.soft(edit.shortageButton(c), "開き直した画面で、欠品登録ボタンが取り消しボタンへ変わっている").toHaveText(/^\s*取り消し\s*$/);
  });
});

caseTest("IT-M04-13-064", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new JoinEditPage(page, notes.get("〔在庫分割結合ID-M0413-064〕"));
  const c = "M0413-JOIN-A-064";
  let screen = { 値: "", ボタン: "" };
  let cancel!: Awaited<ReturnType<JoinEditPage["pressShortageButton"]>>;
  await step(1, async () => {
    await edit.openShortageEntry(); await edit.fillShortage(c, "1");
    const saved = await edit.pressShortageButton(c);
    note(`欠品登録の保存の要求の応答: ${saved.status}・本文 ${JSON.stringify(saved.body)}`);
    // 画面のスクリプトは保存の応答を待たずにボタンの文字を変えるので、仮登録できたかは、応答の本文と、同じセッションで開き直した画面で確かめる（063 と同じ）
    if (saved.body?.ok !== true) throw new Error(`欠品点数1の仮登録が成功しない（応答 ${saved.status}・本文 ${JSON.stringify(saved.body)}）`);
    await edit.openShortageEntry();
    await expect(edit.shortageInput(c), "開き直した画面で、欠品点数1が仮登録されている").toHaveValue("1");
    await expect(edit.shortageButton(c), "開き直した画面で、取り消しボタンが出ている").toHaveText(/^\s*取り消し\s*$/);
  });
  await step(2, async () => {
    cancel = await edit.pressShortageButton(c);
    note(`取り消しの保存の要求の応答: ${cancel.status}・本文 ${JSON.stringify(cancel.body)}`);
    screen = { 値: await edit.shortageInput(c).inputValue(), ボタン: ((await edit.shortageButton(c).textContent()) ?? "").trim() };
  });
  await expected(async () => {
    // 画面のスクリプトは、取り消しの保存の応答を待たずに、入力欄を空にしてボタンの文字を変える。
    // 仮登録が取り消されたか（ログイン中のセッションから外れたか）は、押した直後の画面に加えて、応答の本文と、同じセッションで開き直した画面で確かめる
    expect.soft(screen.値, "押した直後の画面: 欠品点数の入力欄が空").toBe("");
    expect.soft(screen.ボタン, "押した直後の画面: 欠品登録ボタンへ変わる").toBe("欠品登録");
    expect.soft(cancel.body?.ok, `取り消しの保存の応答が成功（応答 ${cancel.status}・本文 ${JSON.stringify(cancel.body)}）`).toBe(true);
    await edit.openShortageEntry();
    await expect.soft(edit.shortageInput(c), "開き直した画面で、仮登録された欠品点数が削除されている（入力欄が空）").toHaveValue("");
    expect.soft(await edit.shortageInput(c).evaluate((e) => e.hasAttribute("readonly")), "開き直した画面で、欠品点数の入力欄が読み取り専用でない").toBe(false);
    await expect.soft(edit.shortageButton(c), "開き直した画面で、取り消しボタンが欠品登録ボタンへ変わっている").toHaveText(/^\s*欠品登録\s*$/);
  });
});

caseTest("IT-M04-13-065", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new JoinEditPage(page, notes.get("〔在庫分割結合ID-M0413-065〕"));
  const c = "M0413-JOIN-A-065";
  await edit.openShortageEntry();
  const enabled: Record<string, boolean> = {};
  for (const [n, v] of [[1, "0"], [2, "4"], [3, "5"]] as const) {
    await step(n, async () => { await edit.fillShortage(c, v); enabled[v] = await edit.shortageButton(c).isEnabled(); });
  }
  await expected(async () => {
    for (const v of ["0", "4", "5"]) expect.soft(enabled[v], `欠品点数${v}で欠品登録ボタンが押下可能にならない`).toBe(false);
  });
});

caseTest("IT-M04-13-066", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new JoinEditPage(page, notes.get("〔在庫分割結合ID-M0413-066〕"));
  const c = "M0413-JOIN-SHORT-MAX-066";
  await edit.openShortageEntry();
  let at1000000 = false, at1000001 = true;
  await step(1, async () => { await edit.fillShortage(c, "1000000"); });
  await step(2, async () => { at1000000 = await edit.shortageButton(c).isEnabled(); });
  await step(3, async () => { await edit.fillShortage(c, "1000001"); });
  await step(4, async () => { at1000001 = await edit.shortageButton(c).isEnabled(); });
  await expected(async () => {
    expect.soft(at1000000, "欠品点数1000000で欠品登録ボタンが押下可能").toBe(true);
    expect.soft(at1000001, "欠品点数1000001で欠品登録ボタンが押下可能にならない").toBe(false);
  });
});

caseTest("IT-M04-13-068", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-068〕");
  const edit = new JoinEditPage(page, id);
  const c = "M0413-JOIN-A-068";
  const stockA = 在庫(c, 試験店舗A, EC);
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let details: ReturnType<typeof 明細> = [];
  let history: ReturnType<typeof ステータス履歴> = [];
  let shortHist: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { t0 = DBの時刻(); await edit.openShortageEntry(); await edit.fillShortage(c, "1"); await edit.pressShortageButton(c); });
  await step(2, async () => { await edit.メモ.fill("結合承認申請"); });
  await step(3, async () => { await edit.chooseApprovalTargets(試験所属A, 承認者名); });
  await step(4, async () => {
    if (!(await edit.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
    await edit.confirmApplyApproval(); t1 = DBの時刻(); await noteAlerts(page, "承認申請のあと");
  });
  await step(5, async () => {
    head = 在庫分割結合(id); details = 明細(id); history = ステータス履歴(id);
    shortHist = stockA ? 在庫変動履歴(stockA.在庫ID).filter((h) => within(h.作成日時, t0, t1) && h.在庫変動区分.includes("欠品")) : [];
  });
  await expected(async () => {
    expect.soft(head?.ステータス, "ステータス").toBe("結合計画承認待ち");
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(作業者名);
    expect.soft(head?.メモ, "メモ").toBe("結合承認申請");
    const last = history[history.length - 1];
    expect.soft(within(last?.更新日時 ?? null, t0, t1) && last?.更新者 === 作業者名, `ステータス変更履歴（最新: ${last?.ステータス}・${last?.更新者}）`).toBe(true);
    const a = details.find((d) => d.商品コード === c);
    expect.soft([a?.欠品点数, a?.欠品登録者], `${c} の欠品点数と欠品登録者`).toEqual([1, 作業者名]);
    expect.soft(shortHist.length, `${c} の欠品の在庫変動履歴`).toBeGreaterThan(0);
  });
});

caseTest("IT-M04-13-069", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-069〕");
  const edit = new JoinEditPage(page, id);
  await edit.openShortageEntry();
  await edit.chooseApprovalTargets(試験所属A, 承認者名);
  await step(1, async () => {
    if (!(await edit.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
    await edit.confirmApplyApproval();
    await noteAlerts(page, "承認申請のあと");
  });
  await expected(async () => {
    expect(pathOf(page), "結合計画承認画面へ遷移").toBe(joinApprovalPath(id));
    expect.soft((await basicInfo(page))["ステータス"], "ステータス").toBe("結合計画承認待ち");
  });
});

caseTest("IT-M04-13-070", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const ids = { A: notes.get("〔在庫分割結合ID-M0413-070A〕"), B: notes.get("〔在庫分割結合ID-M0413-070B〕") };
  const seen: Record<"A" | "B", { path: string; 状態: string; 結合先: Record<string, string>[]; 結合元: Record<string, string>[] }> = {} as never;
  const read = async (k: "A" | "B") => {
    seen[k] = {
      path: pathOf(page), 状態: (await basicInfo(page))["ステータス"],
      結合先: await tableRecords(card(page, "結合先商品").first().locator("table")), 結合元: await new JoinApprovalPage(page, ids[k]).sources(),
    };
  };
  await step(1, async () => {
    const list = new SplitJoinListPage(page);
    await list.open(); await list.search(anyCode("070", "TA")); await list.openById(ids.A);
    await read("A");
  });
  await step(2, async () => {
    const edit = new JoinEditPage(page, ids.B);
    await edit.openShortageEntry();
    note("承認申請を確定するには承認通知先が要る。所属に試験所属A、メンバーに M04-13承認者 を選んだ");
    await edit.chooseApprovalTargets(試験所属A, 承認者名);
    if (!(await edit.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
    await edit.confirmApplyApproval();
    await noteAlerts(page, "承認申請のあと");
    await read("B");
  });
  await expected(async () => {
    note("シード表は、欠品1を入れる結合元（A1・B1）を先に追加する。追加の順と「欠品点数が入力された商品から」の順が同じなので、"
      + "先頭が欠品の商品であっても、画面が欠品で並べ替えたかは判別できない（記録の裁定案18）");
    for (const k of ["A", "B"] as const) {
      const id = ids[k];
      const t = k === "A" ? "TA" : "TB";
      expect.soft(seen[k].path, `ID ${id} の結合計画承認画面`).toBe(joinApprovalPath(id));
      expect.soft(seen[k].状態, `ID ${id} のステータス`).toBe("結合計画承認待ち");
      expect.soft(JSON.stringify(seen[k].結合先), `ID ${id} の結合先商品`).toContain(anyCode("070", t));
      const src = seen[k].結合元;
      const name = (r: Record<string, string>) => r["商品名 / 商品コード"] ?? "";
      expect.soft(src.length, `ID ${id} の結合元商品が2件`).toBe(2);
      expect.soft(src.every((r) => "欠品点数" in r && "欠品登録者" in r), `ID ${id} に欠品点数と欠品登録者の欄`).toBe(true);
      expect.soft(toNum(src[0]?.["欠品点数"]), `ID ${id}: 欠品点数が入力された商品（${anyCode("070", `${k}1`)}）が先頭`).toBe(1);
      expect.soft(name(src[0] ?? {}), `ID ${id}: 先頭の結合元`).toContain(anyCode("070", `${k}1`));
      expect.soft(isDash(src[0]?.["欠品登録者"]), `ID ${id}: 欠品登録者が表示される（「${src[0]?.["欠品登録者"]}」）`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------- 結合計画承認画面

caseTest("IT-M04-13-071", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-071〕");
  const approval = new JoinApprovalPage(page, id);
  const before = joinSnapshot(id);
  let after!: ReturnType<typeof joinSnapshot>;
  await step(1, async () => { await approval.open(); await approval.pressReject(); });
  await step(2, async () => { await approval.confirm("reject"); await noteAlerts(page, "却下のあと"); });
  await step(3, async () => { after = joinSnapshot(id); });
  await expected(async () => {
    expect.soft(after.ステータス, "ステータス").toBe(before.ステータス);
    expect.soft(after.却下理由, "却下理由").toBe(before.却下理由);
    expect.soft(after.在庫, "在庫と総原価（結合先・結合元）").toEqual(before.在庫);
    expect.soft(after.ステータス履歴の件数, "ステータス変更履歴の件数").toBe(before.ステータス履歴の件数);
    expect.soft(after.在庫変動履歴の件数, "在庫変動履歴の件数").toEqual(before.在庫変動履歴の件数);
  });
});

caseTest("IT-M04-13-072", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-072〕");
  const approval = new JoinApprovalPage(page, id);
  let head: ReturnType<typeof 在庫分割結合> = null;
  await step(1, async () => { await approval.open(); await approval.pressReject(); });
  await step(2, async () => { await fillReasonAfterRejectButton(page, approval, "A".repeat(65535)); });
  await step(3, async () => { await approval.confirm("reject"); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => { head = 在庫分割結合(id); });
  await expected(async () => {
    expect.soft(head?.却下理由?.length, "却下理由の長さ（半角英字なので byte 数と同じ）").toBe(65535);
    expect.soft(/^A+$/.test(head?.却下理由 ?? ""), "却下理由が半角英字Aだけ").toBe(true);
  });
});

caseTest("IT-M04-13-073", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-073〕");
  const approval = new JoinApprovalPage(page, id);
  const before = joinSnapshot(id);
  let after!: ReturnType<typeof joinSnapshot>;
  await step(1, async () => { await approval.open(); await approval.pressReject(); });
  await step(2, async () => { await fillReasonAfterRejectButton(page, approval, "A".repeat(65536)); });
  await step(3, async () => { await approval.confirm("reject"); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => { after = joinSnapshot(id); });
  await expected(async () => {
    expect.soft(after.ステータス, "ステータス").toBe(before.ステータス);
    expect.soft(after.却下理由, "却下理由").toBe(before.却下理由);
    expect.soft(after.在庫, "在庫と総原価").toEqual(before.在庫);
    expect.soft(after.ステータス履歴の件数, "ステータス変更履歴の件数").toBe(before.ステータス履歴の件数);
    expect.soft(after.在庫変動履歴の件数, "在庫変動履歴の件数").toEqual(before.在庫変動履歴の件数);
  });
});

caseTest("IT-M04-13-074", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-074〕");
  const approval = new JoinApprovalPage(page, id);
  const sA = 在庫("M0413-JOIN-A-074", 試験店舗A, EC), sB = 在庫("M0413-JOIN-B-074", 試験店舗A, EC);
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let history: ReturnType<typeof ステータス履歴> = [];
  let a: ReturnType<typeof 在庫> = null, b: ReturnType<typeof 在庫> = null;
  let hA = 0, hB = 0;
  await step(1, async () => { await approval.open(); await approval.pressReject(); });
  await step(2, async () => { await fillReasonAfterRejectButton(page, approval, "結合内容不一致", "結合計画却下"); });
  await step(3, async () => { t0 = DBの時刻(); await approval.confirm("reject"); t1 = DBの時刻(); await noteAlerts(page, "却下のあと"); });
  await step(4, async () => {
    head = 在庫分割結合(id); history = ステータス履歴(id);
    a = 在庫("M0413-JOIN-A-074", 試験店舗A, EC); b = 在庫("M0413-JOIN-B-074", 試験店舗A, EC);
    hA = sA ? 在庫変動履歴(sA.在庫ID).filter((h) => within(h.作成日時, t0, t1)).length : 0;
    hB = sB ? 在庫変動履歴(sB.在庫ID).filter((h) => within(h.作成日時, t0, t1)).length : 0;
  });
  await expected(async () => {
    expect.soft(head?.ステータス, "ステータス").toBe("却下");
    expect.soft(head?.却下理由, "却下理由").toBe("結合内容不一致");
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(承認者名);
    expect.soft(head?.メモ, "メモ").toBe("結合計画却下");
    const last = history[history.length - 1];
    expect.soft([last?.ステータス, last?.更新者], "ステータス変更履歴（最新）").toEqual(["却下", 承認者名]);
    expect.soft([sA?.在庫数, sA?.総原価], "M0413-JOIN-A-074 の却下前の在庫数と総原価（期待結果の「6から」「600から」）").toEqual([6, 600]);
    expect.soft([sB?.在庫数, sB?.総原価], "M0413-JOIN-B-074 の却下前の在庫数と総原価（期待結果の「6から」「600から」）").toEqual([6, 600]);
    expect.soft([a?.在庫数, a?.総原価], "M0413-JOIN-A-074（欠品1）の在庫数（6から）と総原価（600から）").toEqual([9, 900]);
    expect.soft([b?.在庫数, b?.総原価], "M0413-JOIN-B-074 の在庫数（6から）と総原価（600から）").toEqual([8, 800]);
    expect.soft(hA, "M0413-JOIN-A-074 の在庫変動履歴").toBeGreaterThan(0);
    expect.soft(hB, "M0413-JOIN-B-074 の在庫変動履歴").toBeGreaterThan(0);
    expect.soft(pathOf(page), "在庫結合完了画面（却下済みの結合の画面）へ遷移").toBe(joinEditPath(id));
  });
});

caseTest("IT-M04-13-075", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-075〕");
  const approval = new JoinApprovalPage(page, id);
  let t0 = 0, t1 = 0;
  let head: ReturnType<typeof 在庫分割結合> = null;
  let history: ReturnType<typeof ステータス履歴> = [];
  let landed = "", landedStatus = "";
  await step(1, async () => { await approval.open(); await approval.メモ.fill("結合計画承認"); });
  await step(2, async () => { await approval.pressApprove(); });
  await step(3, async () => {
    t0 = DBの時刻(); await approval.confirm("approve"); t1 = DBの時刻(); await noteAlerts(page, "承認のあと");
    landed = pathOf(page); landedStatus = (await basicInfo(page))["ステータス"];
    note(`承認のあとの画面: ${landed}（ステータス表示「${landedStatus}」）`);
  });
  await step(4, async () => { head = 在庫分割結合(id); history = ステータス履歴(id); });
  await expected(async () => {
    expect.soft(head?.ステータス, "ステータス").toBe("結合計画承認済み");
    expect.soft(within(head?.更新日時 ?? null, t0, t1), "更新日時").toBe(true);
    expect.soft(head?.更新者, "更新者").toBe(承認者名);
    expect.soft(within(head?.承認日時 ?? null, t0, t1), "結合計画承認日時").toBe(true);
    expect.soft(head?.承認者, "結合計画承認者").toBe(承認者名);
    expect.soft(head?.メモ, "メモ").toBe("結合計画承認");
    const last = history[history.length - 1];
    expect.soft([last?.ステータス, last?.更新者], "ステータス変更履歴（最新）").toEqual(["結合計画承認済み", 承認者名]);
    expect.soft(landedStatus, "結合完了承認申請画面（ステータスが結合計画承認済みの画面）へ遷移").toBe("結合計画承認済み");
  });
});

caseTest("IT-M04-13-076", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const ids = { A: notes.get("〔在庫分割結合ID-M0413-076A〕"), B: notes.get("〔在庫分割結合ID-M0413-076B〕") };
  const seen: Record<string, { path: string; 状態: string }> = {};
  for (const [n, k, t] of [[1, "A", "TA"], [2, "B", "TB"]] as const) {
    await step(n, async () => {
      const list = new SplitJoinListPage(page);
      await list.open(); await list.search(anyCode("076", t)); await list.openById(ids[k]);
      seen[k] = { path: pathOf(page), 状態: (await basicInfo(page))["ステータス"] };
    });
  }
  await expected(async () => {
    expect.soft(seen.A.path, `ID ${ids.A} は在庫結合完了画面（結合の画面）`).toBe(joinEditPath(ids.A));
    expect.soft(seen.A.状態, `ID ${ids.A} のステータス`).toBe("入庫完了");
    expect.soft(seen.B.path, `ID ${ids.B} は在庫結合完了画面（結合の画面）`).toBe(joinEditPath(ids.B));
    expect.soft(seen.B.状態, `ID ${ids.B} のステータス`).toBe("却下");
  });
});

caseTest("IT-M04-13-077", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_NOAUTH);
  const ids = { A: notes.get("〔在庫分割結合ID-M0413-077A〕"), B: notes.get("〔在庫分割結合ID-M0413-077B〕"), C: notes.get("〔在庫分割結合ID-M0413-077C〕") };
  const dst = "M0413-JOIN-DST-077";
  const beforeJoins = 商品コードの在庫分割結合(dst, 試験店舗A, "在庫結合").length;
  const beforeDst = 在庫(dst, 試験店舗A, EC);
  if (!beforeDst) throw new Error(`${dst} の在庫（試験店舗A・EC-CUBE）が DB に無い`);
  // 手順2は M0413-JOIN-DST-077 の履歴も確かめると定める。077A の結合先は別の商品なので、各IDの確かめ（各IDの結合先と結合元の在庫）には入らない。ここで別に数える
  const beforeDstHistory = 在庫変動履歴(beforeDst.在庫ID).length;
  const before = { A: joinSnapshot(ids.A), B: joinSnapshot(ids.B), C: joinSnapshot(ids.C) };
  let after!: typeof before;
  let afterJoins = 0;
  let afterDst: ReturnType<typeof 在庫> = null;
  let afterDstHistory = 0;
  const tryOp = async (what: string, op: () => Promise<void>) => {
    try { await op(); await noteAlerts(page, `${what}のあと`); } catch (e) { note(`${what}: 実行できなかった（${(e as Error).message.split("\n")[0]}）`); }
  };
  // 結合元登録画面で追加した結合元は、ログイン中のセッションにだけ置かれ、フッターの結合元商品登録ボタンを押すまでDBに入らない。
  // そのため、077A への結合元追加はDBの前後の比較では確かめられない。追加の操作をしたあと、同じセッションで結合元登録画面を開き直し、
  // 結合元の一覧に M0413-JOIN-B-077 が無いことを画面で確かめる。追加の操作ができなかったときは、この部分を合格にしない。
  let addA: { 操作できた: boolean; 一覧: string[] } = { 操作できた: false, 一覧: [] };
  await step(1, async () => {
    await tryOp(`${dst} の在庫結合新規登録`, async () => { const j = await openJoinNew(page, dst); await j.register("2", null, "在庫結合新規登録"); });
    await tryOp(`ID ${ids.A} への M0413-JOIN-B-077 の結合元追加`, async () => {
      const e = new JoinEditPage(page, ids.A);
      await e.open();
      note(`ID ${ids.A} の結合元登録画面の結合元（追加の前）: ${(await e.sources()).map((r) => r["商品コード"]).join(" / ") || "なし"}`);
      await e.addSource("M0413-JOIN-B-077");
      await noteAlerts(page, `ID ${ids.A} への結合元追加の決定の直後`);
      await e.open();
      addA = { 操作できた: true, 一覧: (await e.sources()).map((r) => r["商品コード"]) };
      note(`ID ${ids.A} の結合元登録画面の結合元（追加の操作のあと、開き直して）: ${addA.一覧.join(" / ") || "なし"}`);
    });
    await tryOp(`ID ${ids.B} の承認申請`, async () => {
      const e = new JoinEditPage(page, ids.B); await e.openShortageEntry(); await e.chooseApprovalTargets(試験所属A, 承認者名);
      if (!(await e.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
      await e.confirmApplyApproval();
    });
    await tryOp(`ID ${ids.C} の承認`, async () => { const p = new JoinApprovalPage(page, ids.C); await p.open(); await p.pressApprove(); await p.confirm("approve"); });
  });
  await step(2, async () => {
    afterJoins = 商品コードの在庫分割結合(dst, 試験店舗A, "在庫結合").length;
    afterDst = 在庫(dst, 試験店舗A, EC);
    afterDstHistory = 在庫変動履歴(beforeDst.在庫ID).length;
    after = { A: joinSnapshot(ids.A), B: joinSnapshot(ids.B), C: joinSnapshot(ids.C) };
  });
  await expected(async () => {
    expect.soft(addA.操作できた, `ID ${ids.A} への結合元追加を画面で行い、結合元の一覧を画面で確かめられた（DBには結合元追加が入らないので、画面で確かめられなければこの部分は合格にしない）`).toBe(true);
    if (addA.操作できた) expect.soft(addA.一覧, `ID ${ids.A} の結合元の一覧（画面。M0413-JOIN-B-077 が追加されない）`).not.toContain("M0413-JOIN-B-077");
    expect.soft(afterJoins, `${dst} の在庫結合（追加されない）`).toBe(beforeJoins);
    expect.soft([afterDst?.在庫数, afterDst?.総原価], `${dst} の在庫と総原価`).toEqual([beforeDst.在庫数, beforeDst.総原価]);
    expect.soft(afterDstHistory, `${dst} の在庫変動履歴の件数`).toBe(beforeDstHistory);
    for (const k of ["A", "B", "C"] as const) {
      expect.soft(after[k].ステータス, `ID ${ids[k]} のステータス`).toBe(before[k].ステータス);
      expect.soft(after[k].結合元, `ID ${ids[k]} の結合元商品`).toEqual(before[k].結合元);
      expect.soft(after[k].在庫, `ID ${ids[k]} の在庫と総原価`).toEqual(before[k].在庫);
      expect.soft(after[k].ステータス履歴の件数, `ID ${ids[k]} のステータス変更履歴の件数`).toBe(before[k].ステータス履歴の件数);
      expect.soft(after[k].在庫変動履歴の件数, `ID ${ids[k]} の在庫変動履歴の件数`).toEqual(before[k].在庫変動履歴の件数);
    }
  });
});

// ---------------------------------------------------------------- 連携・表示・履歴

caseTest("IT-M04-13-081", async ({ page, step, expected }) => {
  await signIn(page, M0413L_OP);
  const code = "M0413L-DST-002";
  let join!: JoinNewPage;
  let dates: string[] = [];
  let list!: SplitJoinListPage;
  await step(1, async () => { await searchStockList(page, { store: 試験店舗A, zone: "EC-CUBE", code }); });
  await step(2, async () => { await pressStockListAction(page, code, "EC-CUBE", "在庫結合登録"); join = new JoinNewPage(page); });
  await step(3, async () => { await join.結合数.fill("3"); });
  await step(4, async () => {
    const before = appYmd(Date.now());
    noteSubmit(await join.pressRegister(), "登録ボタン");
    dates = [...new Set([before, appYmd(Date.now())])];
    note(`手順4を行った日付: ${dates.join(" または ")}`);
  });
  await step(5, async () => { list = new SplitJoinListPage(page); await list.open(); });
  await step(6, async () => { await list.search(code); });
  await expected(async () => {
    const rows = await list.rows();
    expect(rows, `${code} を結合先とする行がちょうど1件`).toHaveLength(1);
    const r = rows[0];
    expect.soft(r.種別, "タイプ").toBe("在庫結合");
    expect.soft(r.矢印, "タイプの矢印（左矢印）").toBe("←");
    expect.soft(r.店舗, "店舗").toBe(試験店舗A);
    expect.soft(r.在庫区分, "在庫区分").toBe("EC-CUBE");
    // 設計書（在庫分割結合検索一覧の 5-5 と画面イメージ）は、この欄に商品名だけを出すと定める（状態は別の項目）。欄の文字全体を比べる
    note(`結合先商品名の欄の表示: 「${r.商品名}」（欄の文字全体を正本の商品名と比べる）`);
    expect.soft(r.商品名, "結合先商品名（欄の文字全体）").toBe("M04-13連携結合先-002");
    expect.soft(r.元点数, "結合先点数").toMatch(/^3点(\s|$)/);
    expect.soft(r.ステータス, "ステータス").toBe("新規登録");
    expect.soft(r.登録者, "登録者").toBe(連携作業者名);
    expect.soft(dates, `登録日（表示「${r.登録日}」）が手順4で控えた日付`).toContain(r.登録日.slice(0, 10));
  });
});

caseTest("IT-M04-13-088", async ({ page, step, expected }) => {
  await signIn(page);
  let target: Record<string, string> = {};
  let join!: JoinNewPage;
  await step(1, async () => { join = await openJoinNew(page, "M0413-JOIN-DST-088"); });
  await step(2, async () => { target = await join.target(); note(`結合先商品: ${JSON.stringify(target)}`); });
  await expected(async () => {
    expect.soft(target["基準価格"], "基準価格").toBe(yen(500));
    expect.soft(target["原価単価"], "原価単価").toBe(yen(100));
    expect.soft(target["総原価"], "総原価").toBe(yen(300));
    expect.soft(target["在庫数"], "在庫数").toBe("3");
  });
});

caseTest("IT-M04-13-089", async ({ page, step, expected }) => {
  await signIn(page);
  let join!: JoinNewPage;
  let dates: string[] = [];
  let rows: Record<string, string>[] = [];
  await step(1, async () => { join = await openJoinNew(page, "M0413-JOIN-DST-089"); await join.結合数.fill("2"); });
  await step(2, async () => {
    const before = appYmd(Date.now());
    noteSubmit(await join.pressRegister(), "登録ボタン");
    dates = [...new Set([before, appYmd(Date.now())])];
  });
  await step(3, async () => {
    // 手順3は「遷移した結合元登録画面」を見る。移った先がその画面であることを、アドレスと題名で確かめてから読む
    const 画面 = await 今の結合の画面(page);
    note(`登録のあとに移った画面: ${画面.名前 ?? "結合の画面のどれでもない"}（題名「${画面.題名}」${画面.番号 ? `、在庫分割結合ID ${画面.番号}` : ""}）`);
    if (画面.名前 !== "結合元登録画面") throw new Error(`登録のあと結合元登録画面へ移らない（${画面.名前 ?? `題名「${画面.題名}」`}）`);
    rows = await statusHistoryRows(page);
  });
  await expected(async () => {
    expect(rows, "ステータス変更履歴が1件").toHaveLength(1);
    expect.soft(dates, `更新日（表示「${rows[0]["更新日"]}」）が手順2で控えた日付`).toContain(normDate(rows[0]["更新日"] ?? "").slice(0, 10));
    expect.soft(rows[0]["ステータス"], "ステータス").toBe("新規登録");
    expect.soft(rows[0]["更新者"], "更新者").toBe(作業者名);
  });
});

caseTest("IT-M04-13-090", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-090〕");
  const edit = new JoinEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  let audit!: ReturnType<typeof 明細の登録更新>;
  let savedName!: ReturnType<typeof 明細の登録時の商品名>;
  let dates: string[] = [];
  await step(1, async () => { await edit.open(); await edit.pressAddSource(); });
  await step(2, async () => { await edit.searchAndSelect("M0413-JOIN-A-090"); });
  await step(3, async () => {
    const before = appYmd(Date.now());
    await edit.decide("M0413-JOIN-A-090");
    dates = [...new Set([before, appYmd(Date.now())])];
    note(`操作を行った日付（控えた日付）: ${dates.join(" または ")}`);
  });
  await step(4, async () => { details = 明細(id); audit = 明細の登録更新(id); savedName = 明細の登録時の商品名(id); });
  await expected(async () => {
    // 項目ごとに結果を出す（1件目が無くても、ほかの項目の結果を報告に残す）
    expect.soft(details.map((d) => d.商品コード), "結合元商品が1件").toEqual(["M0413-JOIN-A-090"]);
    // 商品名は、明細に保存された「登録時の商品名」と比べる（設計書: [結合元]商品名 在庫先登録時の商品名）。商品マスターの今の名前は参考
    if (details[0]) note(`参考: 商品マスターの今の商品名「${details[0].商品名}」（保存された値ではない）`);
    if (!savedName.保存先) note("結合元商品（在庫分割結合の明細）の表に、登録時の商品名を保存する項目が無い。保存先が無いので保存されない");
    expect.soft(savedName.保存先, "結合元商品の登録時の商品名の保存先（DBの明細の項目）").toBe(true);
    if (savedName.保存先) expect.soft(savedName.行.find((r) => r.商品コード === "M0413-JOIN-A-090")?.値, "商品名").toBe("M04-13結合元-090");
    expect.soft(details[0]?.在庫数, "登録時の在庫数").toBe(10);
    const row = audit.行.find((r) => r.商品コード === "M0413-JOIN-A-090");
    const ymd = (t: number | null | undefined) => (t === null || t === undefined ? "（空）" : appYmd(t * 1000));
    for (const k of ["登録日時", "更新日時", "登録者", "更新者"] as const) {
      if (!audit.保存先[k]) {
        note(`結合元商品（在庫分割結合の明細）の表に${k}を保存する項目が無い。保存先が無いので保存されない`);
        expect.soft(audit.保存先[k], `結合元商品の${k}の保存先（DBの明細の項目）`).toBe(true);
      }
    }
    if (audit.保存先.登録日時) expect.soft(dates, `登録日（DB「${ymd(row?.登録日時)}」）が手順3で控えた日付`).toContain(ymd(row?.登録日時));
    if (audit.保存先.更新日時) expect.soft(dates, `更新日（DB「${ymd(row?.更新日時)}」）が手順3で控えた日付`).toContain(ymd(row?.更新日時));
    if (audit.保存先.登録者) expect.soft(row?.登録者, "登録者").toBe(作業者名);
    if (audit.保存先.更新者) expect.soft(row?.更新者, "更新者").toBe(作業者名);
  });
});

caseTest("IT-M04-13-092", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-092〕");
  let rows: Record<string, string>[] = [];
  let 画面: Awaited<ReturnType<typeof 今の結合の画面>> = { 名前: null, 番号: null, 題名: "" };
  await step(1, async () => {
    const list = new SplitJoinListPage(page);
    await list.open(); await list.search("M0413-JOIN-DST-092"); await list.openById(id);
    // どの画面に移ったかを、アドレスと題名で確かめる。設計書 sheet-19 は、状態が「結合元登録」のものを一覧から選ぶと
    // 結合計画承認申請画面へ移ると定める。手順2の画面名「結合元登録画面」とは食い違う（裁定案23）
    画面 = await 今の結合の画面(page);
    note(`一覧から選んで移った画面: ${画面.名前 ?? "結合の画面のどれでもない"}（題名「${画面.題名}」${画面.番号 ? `、在庫分割結合ID ${画面.番号}` : ""}）`);
    if (画面.番号 !== id || (画面.名前 !== "結合元登録画面" && 画面.名前 !== "結合計画承認申請画面")) {
      throw new Error(`一覧から ID ${id} を選んで、その結合元商品を出す画面へ移らない（${画面.名前 ?? `題名「${画面.題名}」`}）`);
    }
  });
  await step(2, async () => {
    if (画面.名前 !== "結合元登録画面") note(`手順2は「結合元登録画面」の行を見るが、手順1で移ったのは${画面.名前}。その画面の結合元商品の行を読んだ（裁定案23。条件付き）`);
    rows = await new JoinEditPage(page, id).sources(); note(`結合元商品: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    const price = Object.fromEntries(rows.map((r) => [r["商品コード"], r["基準価格"]]));
    expect.soft(price["M0413-JOIN-A-092"], "M0413-JOIN-A-092 の基準価格").toBe(yen(200));
    expect.soft(price["M0413-JOIN-B-092"], "M0413-JOIN-B-092 の基準価格").toBe(yen(300));
  });
});

caseTest("IT-M04-13-093", async ({ page, notes, step, expected }) => {
  await signIn(page, M0413_APP);
  const id = notes.get("〔在庫分割結合ID-M0413-093〕");
  const approval = new JoinApprovalPage(page, id);
  const sA = 在庫("M0413-JOIN-A-093", 試験店舗A, EC), sB = 在庫("M0413-JOIN-B-093", 試験店舗A, EC);
  let t0 = 0, t1 = 0;
  let hA: ReturnType<typeof 在庫変動履歴> = [], hB: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { await approval.open(); });
  await step(2, async () => { await approval.pressReject(); });
  await step(3, async () => {
    await fillReasonAfterRejectButton(page, approval, "結合棄却試験");
    t0 = DBの時刻(); await approval.confirm("reject"); t1 = DBの時刻(); await noteAlerts(page, "却下のあと");
  });
  await step(4, async () => {
    hA = sA ? 在庫変動履歴(sA.在庫ID).filter((h) => within(h.作成日時, t0, t1)) : [];
    hB = sB ? 在庫変動履歴(sB.在庫ID).filter((h) => within(h.作成日時, t0, t1)) : [];
  });
  await expected(async () => {
    for (const [code, h] of [["M0413-JOIN-A-093", hA], ["M0413-JOIN-B-093", hB]] as const) {
      expect.soft(h.length, `${code} の在庫変動履歴が1件`).toBe(1);
      expect.soft(h[0]?.在庫変動区分, `${code} の在庫変動区分`).toBe("結合(棄却)");
      expect.soft(h[0]?.在庫変動理由 ?? "", `${code} の在庫変動理由の書き出し`).toMatch(/^在庫結合棄却による戻し/);
      for (const part of ["M0413-JOIN-A-093", "M0413-JOIN-B-093", "M0413-JOIN-DST-093", id]) expect.soft(h[0]?.在庫変動理由 ?? "", `${code} の在庫変動理由に「${part}」`).toContain(part);
    }
  });
});

caseTest("IT-M04-13-099", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-099〕");
  const edit = new JoinEditPage(page, id);
  let details: ReturnType<typeof 明細> = [];
  await step(1, async () => { await edit.open(); await edit.addSource("M0413-JOIN-A-099"); await edit.setSourceQuantity("M0413-JOIN-A-099", "4"); });
  await step(2, async () => { await edit.メモ.fill("結合元登録完了"); });
  await step(3, async () => { await edit.pressFooterSourceRegister(); await noteAlerts(page, "結合元商品登録のあと"); });
  await step(4, async () => { details = 明細(id); });
  await expected(async () => {
    expect.soft(details.map((d) => [d.商品コード, d.仕入総価格]), "M0413-JOIN-A-099 の仕入総価格").toEqual([["M0413-JOIN-A-099", 400]]);
  });
});

caseTest("IT-M04-13-102", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const id = notes.get("〔在庫分割結合ID-M0413-102〕");
  const edit = new JoinEditPage(page, id);
  const stocks = ["M0413-JOIN-A-102", "M0413-JOIN-B-102"].map((c) => ({ c, s: 在庫(c, 試験店舗A, EC) }));
  let details: ReturnType<typeof 明細> = [];
  let shortHist: number[] = [];
  await step(1, async () => { await edit.openShortageEntry(); await edit.chooseApprovalTargets(試験所属A, 承認者名); });
  await step(2, async () => {
    if (!(await edit.pressApplyApproval())) throw new Error("承認申請ボタンが無い");
    await edit.confirmApplyApproval(); await noteAlerts(page, "承認申請のあと");
  });
  await step(3, async () => {
    details = 明細(id);
    shortHist = stocks.map((x) => (x.s ? 在庫変動履歴(x.s.在庫ID).filter((h) => h.在庫変動区分.includes("欠品")).length : -1));
  });
  await expected(async () => {
    // 「欠品点数が保存されず」は、欠品点数が空のままであること（0 も値の保存なので認めない。2026-10-21 のレビューの指摘で改めた。裁定案24）
    note("「欠品点数が保存されず」は、欠品点数が空のままであることとして確かめる（0 は保存された値として扱う）");
    for (const d of details) {
      expect.soft(d.欠品点数, `${d.商品コード} の欠品点数が保存されない（空のまま）`).toBeNull();
      expect.soft(d.欠品登録者, `${d.商品コード} の欠品登録者が保存されない`).toBeNull();
    }
    expect.soft(details.length, "結合元商品が2件").toBe(2);
    expect.soft(shortHist, "欠品の在庫変動履歴が両商品とも0件のまま").toEqual([0, 0]);
  });
});
