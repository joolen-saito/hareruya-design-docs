/**
 * M04-23 在庫分割結合CSV登録。正本: cases/M04-23_test_cases.tsv
 *
 * テストデータは、既存データか画面から作ったデータに読み替えた（依頼者の方針 2026-11-10。読み替えは seeds/m04-23.ts の先頭と、
 * 各ケースのエビデンスの「シード作成時の問題」）。主な読み替え: ケースごとの店舗→共有の試験店舗A（M04-23）、
 * 商品コード→ケース・実行ごとの商品、所属→所属のマスタの既存の名称、在庫の入庫→在庫編集と在庫編集承認一覧。
 *
 * 実装しないケース（実施不可の候補）:
 * - 016・082: 承認通知先の試験用の受信箱を開いて通知メールを確かめる。開発環境に受信箱が無い（S-M04-23-CASE-016・S-M04-23-DPS-082）。
 * - 074: 公開側のブラウザがユニサーチ試験環境へ接続できること（S-M04-23-QE-ENV。外部の試験環境）。
 *
 * 046・051 の在庫数 999999999 は、シードが実行の印つきの商品の在庫の行だけをDBで書き換えて作る（依頼者の承認 2026-11-10）。
 *
 * 画面の作りから決めたこと（手順の注記に残す）:
 * - モーダルの送信のボタンの表示名は「CSVから登録」。正本の「登録」ボタンはこれとして押す。
 * - 開発者ツールで値を設定する手順は、画面の選択欄・ラジオの値をその場で書き換えて行う（画面のスクリプトの連動は起こさない）。
 * - 在庫履歴検索一覧の一覧の見出しは、正本の「在庫区分」が「在庫場所」、「在庫増減数」が「在庫変動数」。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { Account, loginAdmin } from "../../lib/session";
import { 商品コードに関わる在庫分割結合, 店舗の在庫数 } from "../../db/m04_23_split_join_csv";
import { searchStockList, stockRow, stockRowValues } from "../../pages/admin/m04_13_setup";
import { numberOf, StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import {
  chooseHistoryShopAndSource, logoutAdmin, onSplitJoinList, openSplitJoinList, pageAlerts, pressSplitJoinCsvButton, searchSplitJoinByStore,
  SplitJoinCsvKind, splitJoinCsvModal, SplitJoinCsvModal, splitJoinListRows, SPLIT_JOIN_LIST_PATH,
} from "../../pages/admin/m04_23_split_join_csv";
import {
  m0423Admin, m0423Case, M0423CaseData, m0423Master, M0423L_ADMIN, RD_APR, RD_OP, 一般三郎, 承認一郎, 承認次郎,
} from "../../seeds/m04-23";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const SPLIT: SplitJoinCsvKind = "在庫分割CSV登録";
const JOIN: SplitJoinCsvKind = "在庫結合CSV登録";
type Zone = "EC-CUBE" | "スマレジ";

// ================================================================ 001・002（モーダルが開く）

/** 事前準備①のログインのあと、一覧を開いてボタンを押し、押したボタンのモーダルが表示されることを確かめる */
function opensModal(kind: SplitJoinCsvKind): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, m0423Admin());
    await step(1, () => openSplitJoinList(page));
    const { modal, title } = splitJoinCsvModal(page, kind);
    await step(2, async () => {
      await expect(modal, "ボタンを押す前はモーダルが表示されていない").toBeHidden();
      await pressSplitJoinCsvButton(page, kind);
    });
    await expected(async () => {
      await expect(modal, `${kind}モーダルが表示される`).toBeVisible();
      await expect(title, `モーダルの見出しが「${kind}」`).toHaveText(kind);
    });
  };
}

caseTest("IT-M04-23-001", opensModal("在庫分割CSV登録"));
caseTest("IT-M04-23-002", opensModal("在庫結合CSV登録"));

// ================================================================ 003〜006（モーダルの選択肢）

caseTest("IT-M04-23-003", async ({ page, step, expected }) => {
  await loginAdmin(page, m0423Admin());
  const split = new SplitJoinCsvModal(page, SPLIT);
  const join = new SplitJoinCsvModal(page, JOIN);
  let splitZones: { 名前: string; 選べる: boolean }[] = [];
  await step(1, async () => { await split.open(); splitZones = await split.zoneChoices(); });
  await step(2, () => split.close());
  await step(3, async () => { await join.openOnList(); });
  await expected(async () => {
    const want = [{ 名前: "EC-CUBE", 選べる: true }, { 名前: "スマレジ", 選べる: true }];
    expect.soft(splitZones, "在庫分割CSV登録モーダルの在庫区分（手順1で見たもの）").toEqual(want);
    expect.soft(await join.zoneChoices(), "在庫結合CSV登録モーダルの在庫区分").toEqual(want);
  });
});

caseTest("IT-M04-23-004", async ({ page, step, expected }) => {
  await loginAdmin(page, m0423Admin());
  const m = m0423Master();
  const modal = new SplitJoinCsvModal(page, SPLIT);
  note(`在庫部・承認部・他店舗部は、所属のマスタの既存の「${m.在庫部}」「${m.承認部}」「${m.他店舗部}」に読み替えた（マスタの並び順はこの順）`);
  let depts: string[] = [];
  await step(1, () => modal.open());
  await step(2, () => modal.chooseStore(m.A.店名));
  await step(3, async () => { depts = await modal.departmentChoices(); });
  await expected(async () => {
    expect.soft(depts, `承認通知先（所属選択）に「${m.在庫部}」（在庫部）がある`).toContain(m.在庫部);
    expect.soft(depts, `承認通知先（所属選択）に「${m.承認部}」（承認部）がある`).toContain(m.承認部);
    expect.soft(depts.filter((d) => d === m.在庫部 || d === m.承認部), "在庫部・承認部の並びが所属のマスタの並び順の昇順").toEqual([m.在庫部, m.承認部]);
    expect.soft(depts, `承認通知先（所属選択）に「${m.他店舗部}」（他店舗部）が無い`).not.toContain(m.他店舗部);
  });
});

caseTest("IT-M04-23-005", async ({ page, step, expected }) => {
  await loginAdmin(page, m0423Admin());
  const m = m0423Master();
  const modal = new SplitJoinCsvModal(page, SPLIT);
  let names: string[] = [];
  await step(1, () => modal.open());
  await step(2, () => modal.chooseStore(m.A.店名));
  await step(3, async () => { names = (await modal.memberChoices()).map((o) => o.名前); });
  await expected(async () => {
    expect.soft(names, "承認通知先（メンバー選択）に承認一郎がある").toContain(承認一郎);
    expect.soft(names, "承認通知先（メンバー選択）に承認次郎がある").toContain(承認次郎);
    expect.soft(names.filter((n) => n === 承認一郎 || n === 承認次郎), "承認一郎・承認次郎が名前の昇順に並ぶ").toEqual([承認一郎, 承認次郎]);
    expect.soft(names, "承認通知先（メンバー選択）に一般三郎（承認権限なし）が無い").not.toContain(一般三郎);
  });
});

caseTest("IT-M04-23-006", async ({ page, step, expected }) => {
  await loginAdmin(page, m0423Admin());
  const m = m0423Master();
  const modal = new SplitJoinCsvModal(page, SPLIT);
  note(`承認部は所属のマスタの既存の「${m.承認部}」、在庫部は「${m.在庫部}」に読み替えた`);
  await step(1, () => modal.open());
  await step(2, () => modal.chooseStore(m.A.店名));
  await step(3, () => modal.chooseMembers([承認一郎]));
  await step(4, () => modal.chooseDepartment(m.承認部));
  await expected(async () => {
    const options = await modal.memberChoices();
    const selectable = options.filter((o) => o.選べる).map((o) => o.名前);
    expect.soft(options.filter((o) => o.選択).map((o) => o.名前), "承認一郎の選択が保持されている").toContain(承認一郎);
    expect.soft(selectable, "メンバー選択の選べる選択肢に承認部の承認次郎がある").toContain(承認次郎);
    expect.soft(selectable, "メンバー選択の選べる選択肢から在庫部の承認一郎が外れている（承認部の選択肢に差し替わる）").not.toContain(承認一郎);
  });
});

// ================================================================ CSV登録の共通の操作

/** モーダルの店舗・在庫区分・承認通知先・ファイルを指定する（店舗を選び直すと承認通知先が入れ替わるので、店舗を先に選ぶ） */
async function fill(modal: SplitJoinCsvModal, d: M0423CaseData, v: { store?: boolean; zone?: Zone; approver?: string; dept?: string }): Promise<void> {
  if (v.store !== false) await modal.chooseStore(d.store.店名);
  if (v.zone) await modal.chooseZone(v.zone);
  if (v.dept) await modal.chooseDepartment(v.dept);
  if (v.approver) await modal.chooseMembers([v.approver]);
  await modal.chooseFile(d.csvPath);
}

/** 「登録」（表示名「CSVから登録」）を押し、移った先の画面のメッセージを注記に残す */
async function register(page: Page, modal: SplitJoinCsvModal): Promise<void> {
  note("モーダルの送信のボタンの表示名は「CSVから登録」。正本の「登録」ボタンとして押した");
  await modal.pressRegister();
  const alerts = await pageAlerts(page);
  note(`「登録」を押したあとの画面: ${new URL(page.url()).pathname}／メッセージ: ${alerts.join(" / ") || "（なし）"}`);
}

/** 確かめる項目（何を・実際の状態・期待）。DB確認は手順の中で読み、期待結果でまとめて確かめる */
type Obs = { 何: string; 実際: unknown; 期待: unknown };

/** 在庫分割結合検索/一覧が表示されていること（アドレスと、一覧の上部のボタン） */
async function listObs(page: Page, what: string): Promise<Obs[]> {
  const v = await onSplitJoinList(page);
  return [
    { 何: `${what}: 在庫分割結合検索/一覧の画面のアドレス`, 実際: v.アドレス, 期待: SPLIT_JOIN_LIST_PATH },
    { 何: `${what}: 在庫分割結合検索/一覧の画面の「在庫分割CSV登録」ボタンの数`, 実際: v.一覧のボタン, 期待: 1 },
  ];
}

type DbCheck = (d: M0423CaseData) => Obs[];
type Kind = "在庫分割" | "在庫結合";

/** 店舗で商品コードに関わる在庫分割結合が0件 */
const none = (kind: Kind, ...codes: string[]): DbCheck => (d) => codes.map((c) => ({
  何: `${d.store.店名}の、商品コード ${d.code(c)} に関わる${kind}データの件数`, 実際: 商品コードに関わる在庫分割結合(d.code(c), d.store.id, kind).length, 期待: 0,
}));

/** 1件登録され、元（分割元・結合先）・明細（分割先・結合元の商品コード・数量・在庫区分）・ステータス・数・在庫区分 */
const one = (kind: Kind, head: string, want: { 明細: [string, number, number?][]; 数?: number; ステータス?: string; 在庫区分?: number }): DbCheck => (d) => {
  const rows = 商品コードに関わる在庫分割結合(d.code(head), d.store.id, kind).filter((x) => x.商品コード === d.code(head));
  const e = rows[0];
  const side = kind === "在庫分割" ? "分割先" : "結合元";
  const out: Obs[] = [
    { 何: `${d.store.店名}の、${d.code(head)} を${kind === "在庫分割" ? "分割元" : "結合先"}とする${kind}データの件数`, 実際: rows.length, 期待: 1 },
    { 何: `${kind}データの${side}の商品コードと数量`, 実際: e?.明細.map((x) => [x.商品コード, x.数量]), 期待: want.明細.map(([c, q]) => [d.code(c), q]) },
  ];
  for (const [c, , loc] of want.明細) {
    if (loc !== undefined) out.push({ 何: `${side} ${d.code(c)} の在庫区分（1=EC-CUBE、2=スマレジ）`, 実際: e?.明細.find((x) => x.商品コード === d.code(c))?.在庫区分番号, 期待: loc });
  }
  if (want.数 !== undefined) out.push({ 何: kind === "在庫分割" ? "分割数" : "結合数", 実際: e?.分割結合数, 期待: want.数 });
  if (want.ステータス) out.push({ 何: "ステータス", 実際: e?.ステータス, 期待: want.ステータス });
  if (want.在庫区分 !== undefined) out.push({ 何: `${kind}データの在庫区分（1=EC-CUBE、2=スマレジ）`, 実際: e?.在庫区分番号, 期待: want.在庫区分 });
  return out;
};

/** 在庫数 */
const stocks = (...want: [string, Zone, number][]): DbCheck => (d) => want.map(([c, z, n]) => ({
  何: `${d.store.店名}の ${d.code(c)} の${z}在庫数`, 実際: 店舗の在庫数(d.code(c), d.store.id, z === "EC-CUBE" ? 1 : 2), 期待: n,
}));

const both = (...checks: DbCheck[]): DbCheck => (d) => checks.flatMap((c) => c(d));

type Approver = "case" | "master" | undefined;
const approverOf = (a: Approver, d: M0423CaseData) => (a === "case" ? d.approver : a === "master" ? 承認一郎 : undefined);

/**
 * 1. モーダルを開く／2. 店舗・在庫区分・承認通知先・ファイルを指定／3. 「登録」／4. DB確認（あれば）の形のケース。
 * DB確認の無いケースの期待結果は、在庫分割結合検索/一覧へ遷移すること。
 */
function standard(kind: SplitJoinCsvKind, caseNo: string, zone: Zone, approver: Approver, db?: DbCheck): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, m0423Admin());
    const d = m0423Case(caseNo);
    const modal = new SplitJoinCsvModal(page, kind);
    await step(1, () => modal.open());
    await step(2, () => fill(modal, d, { zone, approver: approverOf(approver, d) }));
    await step(3, () => register(page, modal));
    let obs: Obs[] = [];
    if (db) await step(4, async () => { obs = db(d); });
    await expected(async () => {
      if (!db) obs = await listObs(page, "「登録」のあと");
      for (const o of obs) expect.soft(o.実際, o.何).toEqual(o.期待);
    });
  };
}

// ---- 009・010: 開発者ツールで編集権限の無い店舗を指定 ----
function otherStore(kind: SplitJoinCsvKind, caseNo: string, approver: Approver, db: DbCheck): CaseBody {
  return async ({ page, step, expected, notes }) => {
    await loginAdmin(page, m0423Admin());
    const d = m0423Case(caseNo);
    const modal = new SplitJoinCsvModal(page, kind);
    await step(1, () => modal.open());
    await step(2, () => modal.overwriteStoreValue(notes.get(`〔店舗ID-M0423-${caseNo}〕`)));
    await step(3, async () => {
      await fill(modal, d, { store: false, zone: "EC-CUBE", approver: approverOf(approver, d) });
      await register(page, modal);
    });
    let obs: Obs[] = [];
    await step(4, async () => { obs = db(d); });
    await expected(async () => { for (const o of obs) expect.soft(o.実際, o.何).toEqual(o.期待); });
  };
}
caseTest("IT-M04-23-009", otherStore(SPLIT, "009", "master", none("在庫分割", "410001", "410002")));
caseTest("IT-M04-23-010", otherStore(JOIN, "010", undefined, none("在庫結合", "420001", "420002")));

// ---- 正常な分割・結合 ----
caseTest("IT-M04-23-013", standard(SPLIT, "013", "EC-CUBE", "case", one("在庫分割", "410001", { 明細: [["410002", 10]], ステータス: "分割承認待ち" })));
caseTest("IT-M04-23-014", standard(SPLIT, "014", "EC-CUBE", "case", stocks(["410001", "EC-CUBE", 90])));
caseTest("IT-M04-23-015", standard(SPLIT, "015", "EC-CUBE", "case"));
caseTest("IT-M04-23-017", standard(JOIN, "017", "EC-CUBE", undefined, one("在庫結合", "420001", { 明細: [["420002", 10]], ステータス: "結合元登録" })));
caseTest("IT-M04-23-018", standard(JOIN, "018", "EC-CUBE", undefined, stocks(["420002", "スマレジ", 90])));
caseTest("IT-M04-23-019", standard(JOIN, "019", "EC-CUBE", undefined));

// ---- 存在しない商品・在庫不足 ----
caseTest("IT-M04-23-025", standard(SPLIT, "025", "EC-CUBE", "master", none("在庫分割", "999991")));
caseTest("IT-M04-23-026", standard(SPLIT, "026", "EC-CUBE", "master", none("在庫分割", "999992")));
caseTest("IT-M04-23-028", standard(SPLIT, "028", "EC-CUBE", "master", none("在庫分割", "410005")));
caseTest("IT-M04-23-029", standard(JOIN, "029", "EC-CUBE", undefined, none("在庫結合", "999993")));
caseTest("IT-M04-23-030", standard(JOIN, "030", "EC-CUBE", undefined, none("在庫結合", "999994")));
caseTest("IT-M04-23-033", standard(JOIN, "033", "EC-CUBE", undefined, none("在庫結合", "420005")));

// ---- 036・037: 開発者ツールで未登録の店舗ID／038: 開発者ツールで在庫区分9 ----
function devStore(kind: SplitJoinCsvKind, caseNo: string, approver: Approver): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, m0423Admin());
    const d = m0423Case(caseNo);
    const modal = new SplitJoinCsvModal(page, kind);
    await step(1, () => modal.open());
    await step(2, () => modal.overwriteStoreValue("999999"));
    await step(3, async () => {
      await fill(modal, d, { store: false, zone: "EC-CUBE", approver: approverOf(approver, d) });
      await register(page, modal);
    });
    await expected(async () => { for (const o of await listObs(page, "「登録」のあと")) expect.soft(o.実際, o.何).toEqual(o.期待); });
  };
}
caseTest("IT-M04-23-036", devStore(SPLIT, "036", "master"));
caseTest("IT-M04-23-037", devStore(JOIN, "037", undefined));

caseTest("IT-M04-23-038", async ({ page, step, expected }) => {
  await loginAdmin(page, m0423Admin());
  const d = m0423Case("038");
  const modal = new SplitJoinCsvModal(page, SPLIT);
  await step(1, () => modal.open());
  await step(2, () => modal.overwriteZoneValue("9"));
  await step(3, async () => {
    await fill(modal, d, { approver: 承認一郎 });
    await register(page, modal);
  });
  await expected(async () => { for (const o of await listObs(page, "「登録」のあと")) expect.soft(o.実際, o.何).toEqual(o.期待); });
});

// ---- 255文字の商品コード・数量の下限 ----
const L041S = `423041${"1".repeat(249)}`;
const L041D = `423041${"2".repeat(249)}`;
const L043D = `423043${"2".repeat(249)}`;
const L043S = `423043${"4".repeat(249)}`;
const longCodes = (kind: Kind, head: string, detail: string): DbCheck => (d) => [
  { 何: "登録に使った商品コードの文字数", 実際: [d.code(head).length, d.code(detail).length], 期待: [255, 255] },
  ...one(kind, head, { 明細: [[detail, 1]] })(d),
];
caseTest("IT-M04-23-041", standard(SPLIT, "041", "EC-CUBE", "case", longCodes("在庫分割", L041S, L041D)));
caseTest("IT-M04-23-043", standard(JOIN, "043", "EC-CUBE", undefined, longCodes("在庫結合", L043D, L043S)));
caseTest("IT-M04-23-045", standard(SPLIT, "045", "EC-CUBE", "case", one("在庫分割", "410001", { 明細: [["410002", 0]], 数: 0 })));
caseTest("IT-M04-23-046", standard(SPLIT, "046", "EC-CUBE", "case", one("在庫分割", "410010", { 明細: [["410011", 999999999]], 数: 999999999 })));
caseTest("IT-M04-23-051", standard(JOIN, "051", "EC-CUBE", undefined, one("在庫結合", "420010", { 明細: [["420011", 999999999]], 数: 999999999 })));
caseTest("IT-M04-23-050", standard(JOIN, "050", "EC-CUBE", undefined, one("在庫結合", "420001", { 明細: [["420002", 1]], 数: 1 })));

// ---- 060・061: 同じログインのセッションを別のウィンドウでログアウトしてから送る ----
function loggedOut(kind: SplitJoinCsvKind, caseNo: string, approver: Approver): CaseBody {
  return async ({ page, step, expected }) => {
    const d = m0423Case(caseNo);
    if (!d.admin) throw new Error(`ケース ${caseNo} の専用管理者がシードで作られていない`);
    const admin: Account = d.admin;
    // 事前準備③: 同じブラウザプロファイルの2ウィンドウ（同じログインのセッション）
    await loginAdmin(page, admin);
    const pageB = await page.context().newPage();
    await openSplitJoinList(pageB);
    note("ブラウザA・Bは、同じブラウザのコンテキスト（同じログインのセッション）の2つのページにした");
    const modal = new SplitJoinCsvModal(page, kind);
    await step(1, () => modal.open());
    await step(2, () => fill(modal, d, { zone: "EC-CUBE", approver: approverOf(approver, d) }));
    await step(3, () => logoutAdmin(pageB));
    await step(4, async () => { await page.bringToFront(); await register(page, modal); });
    await expected(async () => { for (const o of await listObs(page, "ブラウザAで「登録」を押したあと")) expect.soft(o.実際, o.何).toEqual(o.期待); });
  };
}
caseTest("IT-M04-23-060", loggedOut(SPLIT, "060", "master"));
caseTest("IT-M04-23-061", loggedOut(JOIN, "061", undefined));

// ---- 063・064: 登録から一覧での確認 ----
function listAfterRegister(kind: SplitJoinCsvKind, caseNo: string, head: string, want: { 種別: string; 点数: string; ステータス: string }): CaseBody {
  return async ({ page, step, expected }) => {
    const d = m0423Case(caseNo);
    const modal = new SplitJoinCsvModal(page, kind);
    note(`店舗は ${d.store.店名} に読み替え、商品名は正本の値に実行の印を付けた「${d.name(head)}」で作った。一覧の商品名の欄は、商品名のあとに規格・状態が付くことがあるので、商品名で始まる行を探す`);
    let rows: Awaited<ReturnType<typeof splitJoinListRows>> = [];
    await step(1, async () => { await loginAdmin(page, M0423L_ADMIN); await openSplitJoinList(page); });
    await step(2, () => modal.openOnList());
    await step(3, async () => {
      await fill(modal, d, { zone: "EC-CUBE", approver: kind === SPLIT ? d.approver : undefined });
      await register(page, modal);
    });
    let returned: Obs[] = [];
    await step(4, async () => {
      returned = await listObs(page, "手順4: 「登録」のあと");
      await searchSplitJoinByStore(page, d.store.店名);
    });
    await step(5, async () => { rows = await splitJoinListRows(page); });
    await expected(async () => {
      for (const o of returned) expect.soft(o.実際, o.何).toEqual(o.期待);
      const hit = rows.filter((r) => r.商品名.startsWith(d.name(head)));
      expect.soft(hit.length, `検索結果一覧の、商品名が「${d.name(head)}」の行の数`).toBe(1);
      expect.soft(hit[0] && { 種別: hit[0].種別, 店舗: hit[0].店舗, 在庫区分: hit[0].在庫区分, 点数: hit[0].点数, ステータス: hit[0].ステータス }, "その行の種別・店舗・在庫区分・点数・ステータス")
        .toEqual({ 種別: want.種別, 店舗: d.store.店名, 在庫区分: "EC-CUBE", 点数: want.点数, ステータス: want.ステータス });
    });
  };
}
caseTest("IT-M04-23-063", listAfterRegister(SPLIT, "063", "分割元連携カードA", { 種別: "在庫分割", 点数: "10", ステータス: "分割承認待ち" }));
caseTest("IT-M04-23-064", listAfterRegister(JOIN, "064", "結合先連携カードC", { 種別: "在庫結合", 点数: "10", ステータス: "結合元登録" }));

// ---- 069・075〜081・085・086 ----
caseTest("IT-M04-23-069", standard(JOIN, "069", "EC-CUBE", undefined, one("在庫結合", "M0423-069-A", { 明細: [["M0423-069-B", 10, 1]], 数: 10 })));
caseTest("IT-M04-23-075", standard(SPLIT, "075", "EC-CUBE", "case", one("在庫分割", "M0423-075-A", { 明細: [["M0423-075-B", 10], ["M0423-075-C", 10]] })));
caseTest("IT-M04-23-076", standard(JOIN, "076", "EC-CUBE", undefined, stocks(["M0423-076-B", "スマレジ", 90], ["M0423-076-C", "スマレジ", 30])));
caseTest("IT-M04-23-077", standard(JOIN, "077", "EC-CUBE", undefined, one("在庫結合", "M0423-077-A", { 明細: [["M0423-077-B", 10], ["M0423-077-C", 20]] })));
caseTest("IT-M04-23-078", standard(SPLIT, "078", "EC-CUBE", "case", stocks(["M0423-078-A", "EC-CUBE", 0])));
caseTest("IT-M04-23-079", standard(JOIN, "079", "EC-CUBE", undefined, stocks(["M0423-079-B", "スマレジ", 0])));
caseTest("IT-M04-23-080", standard(JOIN, "080", "EC-CUBE", undefined, stocks(["M0423-080-B", "EC-CUBE", 90])));
caseTest("IT-M04-23-081", standard(SPLIT, "081", "スマレジ", "case", stocks(["M0423-081-A", "スマレジ", 90])));
caseTest("IT-M04-23-085", standard(JOIN, "085", "スマレジ", undefined, both(
  one("在庫結合", "M0423-CB085-A", { 明細: [["M0423-CB085-B", 10, 1]], ステータス: "結合元登録", 在庫区分: 2 }),
  stocks(["M0423-CB085-B", "EC-CUBE", 90], ["M0423-CB085-B", "スマレジ", 50]),
)));
caseTest("IT-M04-23-086", standard(JOIN, "086", "スマレジ", undefined, both(
  one("在庫結合", "M0423-CB086-A", { 明細: [["M0423-CB086-B", 10, 2]], ステータス: "結合元登録", 在庫区分: 2 }),
  stocks(["M0423-CB086-B", "スマレジ", 90], ["M0423-CB086-B", "EC-CUBE", 50]),
)));

// ================================================================ 083・084（他機能への反映）

/** 在庫履歴検索一覧をメニューから開き、検索条件をクリアし、キーワード・店舗・登録元「在庫分割」で検索する */
async function searchHistory(page: Page, code: string, shop: string): Promise<StockHistoryPage> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(code);
  await chooseHistoryShopAndSource(page, shop, "在庫分割");
  const status = await h.submit();
  expect(status, "在庫履歴検索一覧の検索の応答").toBeLessThan(400);
  return h;
}

caseTest("IT-M04-23-083", async ({ page, step, expected }) => {
  const d = m0423Case("083");
  const m = m0423Master();
  const code = d.code("M0423RD-001-S");
  const modal = new SplitJoinCsvModal(page, SPLIT);
  note(`M04-23 RD店舗A は ${d.store.店名}、M04-23 RD所属A は「${m.在庫部}」に読み替えた。商品コードは ${code}`);
  note("一覧の見出しは、正本の「在庫区分」が「在庫場所」、「在庫増減数」が「在庫変動数」");
  let before: { 件数: number | null; 行: number } = { 件数: null, 行: -1 };
  let after: Record<string, string>[] = [];
  await step(1, () => loginAdmin(page, RD_OP.account));
  await step(2, async () => {
    const h = await searchHistory(page, code, d.store.店名);
    before = { 件数: await h.resultCount(), 行: (await h.rows()).length };
    note(`手順2の検索結果: 件数の表示 ${before.件数 ?? "（なし）"}・行 ${before.行}・メッセージ ${(await h.messages()).join(" / ") || "（なし）"}`);
  });
  await step(3, () => modal.open());
  await step(4, () => fill(modal, d, { zone: "EC-CUBE", dept: m.在庫部, approver: RD_APR.名前 }).then(() => register(page, modal)));
  let h: StockHistoryPage | null = null;
  await step(5, async () => { h = await searchHistory(page, code, d.store.店名); });
  await step(6, async () => { after = (await (h as unknown as StockHistoryPage).rows()).filter((r) => r["商品コード"] === code); });
  await expected(async () => {
    expect.soft(before.行, "手順2: 分割元の在庫分割の履歴の行の数").toBe(0);
    expect.soft(after.length, "手順5: 検索結果の分割元の行の数").toBe(1);
    const r = after[0];
    if (!r) return;
    expect.soft({
      店舗: r["店舗"], 在庫区分: r["在庫場所"], 登録元: r["登録元"], 変更前在庫: numberOf(r["変更前在庫"] ?? ""), 変更後在庫: numberOf(r["変更後在庫"] ?? ""),
      在庫増減数: numberOf(r["在庫変動数"] ?? ""), 変更前総原価: numberOf(r["変更前総原価"] ?? ""), 変更後総原価: numberOf(r["変更後総原価"] ?? ""),
      在庫変動理由区分: r["在庫変動理由区分"],
    }, "手順5: 分割元の行の店舗・在庫区分・登録元・変更前後の在庫・在庫増減数・変更前後の総原価・在庫変動理由区分").toEqual({
      店舗: d.store.店名, 在庫区分: "EC-CUBE", 登録元: "在庫分割", 変更前在庫: 10, 変更後在庫: 6, 在庫増減数: -4, 変更前総原価: 1000, 変更後総原価: 600,
      在庫変動理由区分: "分割(減算)",
    });
  });
});

caseTest("IT-M04-23-084", async ({ page, step, expected }) => {
  const d = m0423Case("084");
  const m = m0423Master();
  const code = d.code("M0423RD-002-S");
  const modal = new SplitJoinCsvModal(page, SPLIT);
  note(`M04-23 RD店舗A は ${d.store.店名}、M04-23 RD所属A は「${m.在庫部}」に読み替えた。商品コードは ${code}`);
  type V = Awaited<ReturnType<typeof stockRowValues>>;
  let before: V | null = null;
  let after: V | null = null;
  await step(1, async () => {
    await loginAdmin(page, RD_OP.account);
    await searchStockList(page, { store: d.store.店名, zone: "EC-CUBE", code });
    before = await stockRowValues(stockRow(page, code, d.store.店名, "EC-CUBE"));
  });
  await step(2, () => modal.open());
  await step(3, () => fill(modal, d, { zone: "EC-CUBE", dept: m.在庫部, approver: RD_APR.名前 }).then(() => register(page, modal)));
  await step(4, () => searchStockList(page, { store: d.store.店名, zone: "EC-CUBE", code }));
  await step(5, async () => { after = await stockRowValues(stockRow(page, code, d.store.店名, "EC-CUBE")); });
  await expected(async () => {
    const b = before as V | null;
    const a = after as V | null;
    expect.soft(b && { 在庫: numberOf(b.在庫), 総原価: numberOf(b.総原価) }, "手順1: 分割元の行の在庫と総原価").toEqual({ 在庫: 10, 総原価: 1000 });
    expect.soft(a && { 店舗: a.店舗, 在庫区分: a.在庫区分, 在庫: numberOf(a.在庫), 総原価: numberOf(a.総原価) }, "手順4: 分割元の行の店舗・在庫区分・在庫・総原価")
      .toEqual({ 店舗: d.store.店名, 在庫区分: "EC-CUBE", 在庫: 6, 総原価: 600 });
  });
});
