/**
 * M04-09 在庫移動・振替登録/編集の続き（2026-11-23 依頼者「残りの齋藤分を進めて終わらせて」）。正本: cases/M04-09_test_cases.tsv
 * 判定済みのケース（spec/m04/m04-09.spec.ts）の指紋を変えないため、別のファイルにした。シードは seeds/m04-09-c.ts。
 *
 * - 163〜169: 在庫移動・在庫振替の登録・承認・却下と、在庫履歴検索一覧・在庫検索一覧の表示の連携。
 *   正本の M04-09 RD店舗A・RD店舗B は試験支店・本店、RD所属A・RD所属B は試験所属A・試験所属B で読み替える（試験店舗の使い回し・2026-11-13）。
 *   RD作業者・RD承認者・RD入庫先承認者は、名前・ログインIDに決まった印（-E2E）を付けた管理者（seeds/m04-09-c.ts）。
 *   商品コードは実行の印つき。在庫履歴検索一覧の商品名(日/英）・カード名・商品コードの欄には、印つきの商品コードを入れる
 *   （165 は正本の語「M0409RD-003」のまま入れ、結果の行を今回の商品コードの行に絞って見る。前の実行の商品の行は数えない）。
 * - 105: 入庫完了の移動のステータス変更履歴の表示（在庫移動・振替IDは画面が振った番号で読み替え。履歴の4件はシードが DB でそろえる）。
 * - 書かなかったもの: 029・137（DB の行ロックを掛けた状態を作る部品が要る）と、CB の22件（171〜177・180〜194。TC東京2F の店舗、
 *   共有の入荷通知メールの設定、メールの受け取りが前提）。理由は e2e/review/M04_rest_progress_2026-11-23_dev.md。
 * - 正本の手順・期待結果の文はコードに写さない（報告には正本の文が出る）。
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, expect } from "../../lib/case";
import { 別のブラウザの画面を撮る, scene } from "../../lib/evidence_other";
import { rc } from "../../lib/run_marker";
import { Account, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { expectSaved } from "../../pages/admin/common";
import {
  chooseApprovalTarget, checkStockRows, inboundApprovalPath, inboundRequestPath, moveCompletePath, MoveNewPage, moveNewPath, MoveTransferList,
  outboundApprovalPath, pressApprove, pressReject, pressStockListAction, requestInbound, requestOutbound, searchStock, shownMoveId,
  transferApprovalPath, TransferNewPage, transferNewPath, 店A, 店B, 所属A, 所属B, 承認者名, 作業者名, 入庫担当者名,
} from "../../pages/admin/m04_09_move";
import { 在庫検索の行, 在庫の行 } from "../../pages/admin/m06_03_links";
import { ステータス変更履歴の表, 列の値, 在庫履歴を検索する, 数, 状態の履歴 } from "../../pages/admin/m04_09_c";
import { HistoryRow } from "../../pages/admin/m04_17_stock_history";
import { 試験支店の店舗ID, 本店の店舗ID } from "../../pages/admin/reuse_store";
import { M0409_OP } from "../../seeds/m04-09";
import { L105, RD_APR, RD_APRB, RD_OP, RD作業者名, RD承認者名, RD入庫先承認者名 } from "../../seeds/m04-09-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const EC = "EC-CUBE" as const;
const 店AのID = () => 試験支店の店舗ID();

/** ログインし、1つの操作の待ちを3分までにする */
async function login(page: Page, account: Account): Promise<void> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, account);
}

/** 正本の「ブラウザB」: 別のブラウザセッションでログインする（ケースの画面のセッションと分ける） */
async function openBrowserB(browser: Browser, account: Account): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const page = await context.newPage();
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, account);
  return { page, close: () => context.close() };
}

function rdLoginNote(account: Account, 正本: string): void {
  supplement(`正本のログインID「${正本}」は、決まった印つきの「${account.loginId}」で読み替えた（管理者は1度だけ作り使い回す。seeds/m04-09-c.ts）`);
}

/** 在庫移動・振替検索一覧で ID を入れて検索し、行を選んで開く。開いた画面が求める画面であること */
async function openViaList(page: Page, id: string, want: RegExp, what: string): Promise<void> {
  const list = new MoveTransferList(page);
  await list.searchById(id);
  await list.openFromRow(id);
  expect(want.test(new URL(page.url()).pathname), `${what}が開く（${page.url()}）`).toBe(true);
}

/** 在庫検索一覧で出庫元の行にチェックを入れて「在庫移動登録」（または「在庫振替登録」）を押す */
async function pressFromStockList(page: Page, code: string, which: "在庫移動登録" | "在庫振替登録"): Promise<void> {
  await searchStock(page, 店A, EC, code);
  await checkStockRows(page, [code], 店A, EC);
  const r = await pressStockListAction(page, which, which === "在庫移動登録" ? moveNewPath : transferNewPath);
  expect(r.moved, `「${which}」で登録画面へ移る（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`).toBe(true);
}

/** 在庫移動初期登録画面で入庫先（店舗B・EC-CUBE）・移動点数を入れて「登録」→ 確認モーダルの「登録する」 */
async function registerMoveOnForm(page: Page, code: string, qty: number): Promise<void> {
  const form = new MoveNewPage(page);
  await form.ready();
  await form.chooseToStore(店B);
  await form.chooseToZone(EC);
  await form.quantity(code).fill(String(qty));
  const p = await form.pressRegister();
  expect(p.modal, `「登録」で確認モーダルが出る（入力チェック: ${p.invalid.join(" / ") || "なし"}）`).toBe(true);
  await form.confirmRegister();
  for (const w of await expectSaved(page, "在庫移動の登録")) note(`在庫移動の登録: ${w}`);
}

/** 遷移した画面の在庫移動・振替IDを控える（アドレスの番号と画面の表示が同じこと） */
async function noteShownId(page: Page, notes: { set: (l: string, v: string) => void }, label: string, path: RegExp): Promise<string> {
  const m = path.exec(new URL(page.url()).pathname);
  expect(m, `登録のあと、求める画面へ移る（${page.url()}）`).not.toBeNull();
  const shown = await shownMoveId(page);
  expect(shown, "画面の在庫移動・振替ID").toBe(m![1]);
  notes.set(label, shown!);
  return shown!;
}
const outboundRequestId = /\/product\/stock\/move\/outbound_approval_request\/(\d+)$/;
const transferApprovalId = /\/product\/stock\/transfer\/(\d+)\/approval$/;

/** 在庫振替初期登録画面で振替先・振替点数・承認通知先（試験所属A・RD承認者）を入れて「登録」 */
async function registerTransferOnForm(page: Page, code: string, dest: string, qty: number): Promise<void> {
  const form = new TransferNewPage(page);
  await form.ready();
  await form.dest(code).fill(dest);
  await form.dest(code).blur();
  await form.qty(code).fill(String(qty));
  await chooseApprovalTarget(page, "admin_stock_transfer_new", 所属A, [RD承認者名]);
  const p = await form.pressRegister();
  expect(p.moved, `「登録」で画面が移る（入力チェック: ${p.invalid.join(" / ") || "なし"}）`).toBe(true);
  for (const w of await expectSaved(page, "在庫振替の登録")) note(`在庫振替の登録: ${w}`);
}

/** 在庫検索一覧の、商品コード・店舗・在庫区分の行（1件であること） */
async function stockRowOf(page: Page, code: string, store: string): Promise<在庫の行> {
  await searchStock(page, store, EC, code);
  const rows = (await 在庫検索の行(page)).filter((r) => r.商品コード === code && r.店舗 === store && r.在庫区分 === EC);
  note(`在庫検索一覧（${store}・${EC}・${code}）: ${JSON.stringify(rows)}`);
  expect(rows.length, `在庫検索一覧の ${code}（${store}・${EC}）の行が1件`).toBe(1);
  return rows[0];
}

/** 在庫履歴の行の確かめ（期待結果の値）。総原価は表示（¥1,000）を数で比べる */
function expectHistoryRow(r: HistoryRow, want: {
  店舗?: string; 在庫区分?: string; 登録元: string; 登録元ID: string; 変更前在庫: number; 変更後在庫: number; 在庫増減数?: number;
  変更前総原価: number; 変更後総原価: number; 区分?: string; 登録者?: string;
}, what: string): void {
  const v = (k: string) => 列の値(r, k);
  if (want.店舗 !== undefined) expect.soft(v("店舗"), `${what}の店舗`).toBe(want.店舗);
  if (want.在庫区分 !== undefined) expect.soft(v("在庫場所"), `${what}の在庫区分（一覧の見出しは「在庫場所」）`).toBe(want.在庫区分);
  expect.soft(v("登録元"), `${what}の登録元`).toBe(want.登録元);
  expect.soft(v("登録元ID"), `${what}の登録元ID`).toBe(want.登録元ID);
  expect.soft(数(v("変更前在庫")), `${what}の変更前在庫`).toBe(want.変更前在庫);
  expect.soft(数(v("変更後在庫")), `${what}の変更後在庫`).toBe(want.変更後在庫);
  if (want.在庫増減数 !== undefined) expect.soft(数(v("在庫変動数")), `${what}の在庫増減数（一覧の見出しは「在庫変動数」）`).toBe(want.在庫増減数);
  expect.soft(数(v("変更前総原価")), `${what}の変更前総原価`).toBe(want.変更前総原価);
  expect.soft(数(v("変更後総原価")), `${what}の変更後総原価`).toBe(want.変更後総原価);
  // 一覧の在庫変動理由区分は「区分/区分の詳細」の形で出る。正本の値は区分の詳細の名前
  if (want.区分 !== undefined) expect.soft(v("在庫変動理由区分").split("/").pop(), `${what}の在庫変動理由区分（表示「${v("在庫変動理由区分")}」）`).toBe(want.区分);
  if (want.登録者 !== undefined) expect.soft(v("登録者"), `${what}の登録者`).toBe(want.登録者);
}

const codeOf = (r: HistoryRow) => 列の値(r, "商品コード");

// ---------------------------------------------------------------- 163: 在庫移動の登録 → 在庫履歴

caseTest("IT-M04-09-163", async ({ page, notes, step, expected }) => {
  const code = rc("M0409RD-001");
  let first: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  let id = "";
  rdLoginNote(RD_OP, "m0409rd-op");
  await step(1, async () => { await login(page, RD_OP); });
  await step(2, async () => {
    const r = await 在庫履歴を検索する(page, { キーワード: code, 店舗ID: 店AのID(), 登録元: "在庫移動" });
    first = r.rows;
    note(`手順2の検索結果: 応答 ${r.status}・行 ${JSON.stringify(r.rows)}・メッセージ「${r.messages.join(" / ")}」`);
  });
  await step(3, async () => { await pressFromStockList(page, code, "在庫移動登録"); });
  // 画面が振った番号は、登録で移った画面に出た時点で控える（手順5の題に控えた番号を当てるため）
  await step(4, async () => {
    await registerMoveOnForm(page, code, 3);
    id = await noteShownId(page, notes, "〔在庫移動ID-M0409-RD001〕", outboundRequestId);
  });
  await step(5, async () => { note(`控えた在庫移動・振替ID: ${id}（${page.url()}）`); });
  await step(6, async () => {
    const r = await 在庫履歴を検索する(page, { キーワード: code, 店舗ID: 店AのID(), 登録元: "在庫移動" });
    after = r.rows;
  });
  await step(7, async () => { note(`手順6の検索結果: ${JSON.stringify(after)}`); });
  await expected(async () => {
    expect.soft(first.filter((r) => codeOf(r) === code), `手順2: ${code} の在庫移動の履歴が無い`).toEqual([]);
    const rows = after.filter((r) => codeOf(r) === code);
    expect(rows.length, `手順6: ${code} の行が1件`).toBe(1);
    expectHistoryRow(rows[0], {
      店舗: 店A, 在庫区分: EC, 登録元: "在庫移動", 登録元ID: id, 変更前在庫: 10, 変更後在庫: 7, 在庫増減数: -3, 変更前総原価: 1000, 変更後総原価: 700,
      区分: "在庫移動(減算)", 登録者: RD作業者名,
    }, `${code} の行`);
  });
});

// ---------------------------------------------------------------- 164: 在庫移動の登録 → 在庫検索一覧

caseTest("IT-M04-09-164", async ({ page, step, expected }) => {
  const code = rc("M0409RD-002");
  let before: 在庫の行 | undefined;
  let after: 在庫の行 | undefined;
  rdLoginNote(RD_OP, "m0409rd-op");
  await step(1, async () => { await login(page, RD_OP); });
  await step(2, async () => { before = await stockRowOf(page, code, 店A); });
  await step(3, async () => {
    await checkStockRows(page, [code], 店A, EC);
    const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
    expect(r.moved, `「在庫移動登録」で登録画面へ移る（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`).toBe(true);
  });
  await step(4, async () => { await registerMoveOnForm(page, code, 3); });
  await step(5, async () => { after = await stockRowOf(page, code, 店A); });
  await step(6, async () => { note(`手順6の行: ${JSON.stringify(after)}`); });
  await expected(async () => {
    expect.soft([数(before!.在庫), 数(before!.総原価)], "手順2の在庫・総原価").toEqual([10, 1000]);
    expect.soft([after!.店舗, after!.在庫区分], "手順6の店舗・在庫区分").toEqual([店A, EC]);
    expect.soft([数(after!.在庫), 数(after!.総原価)], "手順6の在庫・総原価").toEqual([7, 700]);
  });
});

// ---------------------------------------------------------------- 165: 在庫振替の登録・承認 → 在庫履歴

caseTest("IT-M04-09-165", async ({ page, browser, notes, step, expected }) => {
  const src = rc("M0409RD-003-A");
  const dest = rc("M0409RD-003-B");
  const 語 = "M0409RD-003";
  let first: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  let id = "";
  let B: Awaited<ReturnType<typeof openBrowserB>> | undefined;
  rdLoginNote(RD_OP, "m0409rd-op");
  rdLoginNote(RD_APR, "m0409rd-apr");
  supplement(`在庫履歴検索一覧の商品名(日/英）・カード名・商品コードの欄には正本の語「${語}」を入れ、結果の行を今回の商品コード（${src}・${dest}）の行に絞って見た（前の実行の商品の行は数えない）`);
  try {
    await step(1, async () => { await login(page, RD_OP); });
    await step(2, async () => {
      const r = await 在庫履歴を検索する(page, { キーワード: 語, 店舗ID: 店AのID(), 登録元: "在庫振替" });
      first = r.rows;
      note(`手順2の検索結果: 応答 ${r.status}・行 ${JSON.stringify(r.rows)}・メッセージ「${r.messages.join(" / ")}」`);
    });
    await step(3, async () => { await pressFromStockList(page, src, "在庫振替登録"); });
    await step(4, async () => {
      await registerTransferOnForm(page, src, dest, 2);
      id = await noteShownId(page, notes, "〔在庫振替ID-M0409-RD003〕", transferApprovalId);
    });
    await step(5, async () => { note(`控えた在庫移動・振替ID: ${id}（${page.url()}）`); });
    await step(6, async () => {
      B = await openBrowserB(browser, RD_APR);
      await openViaList(B.page, id, transferApprovalPath(id), "ブラウザBの在庫振替承認画面");
      await 別のブラウザの画面を撮る(B.page, scene.stepLabel(6, "ブラウザB（RD承認者）の在庫振替承認画面"));
    });
    await step(7, async () => {
      await pressApprove(B!.page, "transfer_approval_approve_btn");
      for (const w of await expectSaved(B!.page, "在庫振替の承認")) note(`在庫振替の承認: ${w}`);
      await 別のブラウザの画面を撮る(B!.page, scene.stepLabel(7, "ブラウザB（RD承認者）の承認のあと"));
    });
    await step(8, async () => {
      const r = await 在庫履歴を検索する(page, { キーワード: 語, 店舗ID: 店AのID(), 登録元: "在庫振替" });
      after = r.rows;
    });
    await step(9, async () => { note(`手順8の検索結果: ${JSON.stringify(after)}`); });
    await expected(async () => {
      expect.soft(first.filter((r) => [src, dest].includes(codeOf(r))), `手順2: ${src}・${dest} の在庫振替の履歴が無い`).toEqual([]);
      const a = after.filter((r) => codeOf(r) === src);
      const b = after.filter((r) => codeOf(r) === dest);
      expect.soft(a.length, `手順8: ${src} の行が1件`).toBe(1);
      expect.soft(b.length, `手順8: ${dest} の行が1件`).toBe(1);
      if (a[0]) expectHistoryRow(a[0], { 登録元: "在庫振替", 登録元ID: id, 変更前在庫: 10, 変更後在庫: 8, 在庫増減数: -2, 変更前総原価: 1000, 変更後総原価: 800, 区分: "在庫振替(減算)" }, `${src} の行`);
      if (b[0]) expectHistoryRow(b[0], { 登録元: "在庫振替", 登録元ID: id, 変更前在庫: 4, 変更後在庫: 6, 在庫増減数: 2, 変更前総原価: 600, 変更後総原価: 800, 区分: "在庫振替(加算)" }, `${dest} の行`);
    });
  } finally {
    await B?.close();
  }
});

// ---------------------------------------------------------------- 166: 在庫移動の却下 → 在庫履歴（戻しの行）

caseTest("IT-M04-09-166", async ({ page, browser, notes, step, expected }) => {
  const code = rc("M0409RD-004");
  let mid: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  let id = "";
  let B: Awaited<ReturnType<typeof openBrowserB>> | undefined;
  rdLoginNote(RD_OP, "m0409rd-op");
  rdLoginNote(RD_APR, "m0409rd-apr");
  const positive = (rows: HistoryRow[]) => rows.filter((r) => codeOf(r) === code && 数(列の値(r, "在庫変動数")) > 0);
  try {
    await step(1, async () => { await login(page, RD_OP); });
    await step(2, async () => { await pressFromStockList(page, code, "在庫移動登録"); });
    await step(3, async () => {
      await registerMoveOnForm(page, code, 3);
      id = await noteShownId(page, notes, "〔在庫移動ID-M0409-RD004〕", outboundRequestId);
    });
    await step(4, async () => { note(`控えた在庫移動・振替ID: ${id}（${page.url()}）`); });
    await step(5, async () => {
      await requestOutbound(page, id, { 所属: 所属A, メンバー: RD承認者名 }, "出庫承認申請", (w) => note(`出庫承認申請: ${w}`));
    });
    await step(6, async () => {
      const r = await 在庫履歴を検索する(page, { キーワード: code, 店舗ID: 店AのID(), 登録元: "在庫移動" });
      mid = r.rows;
      note(`手順6の検索結果: ${JSON.stringify(r.rows)}`);
    });
    await step(7, async () => {
      B = await openBrowserB(browser, RD_APR);
      await openViaList(B.page, id, outboundApprovalPath(id), "ブラウザBの移動出庫承認画面");
      await 別のブラウザの画面を撮る(B.page, scene.stepLabel(7, "ブラウザB（RD承認者）の移動出庫承認画面"));
    });
    await step(8, async () => {
      const r = await pressReject(B!.page, "outbound_approval_reject_btn", "M04-09 RD却下");
      expect(r.modal, `「却下」で確認モーダルが出る（${r.invalid.join(" / ") || "入力チェックなし"}）`).toBe(true);
      for (const w of await expectSaved(B!.page, "出庫の却下")) note(`出庫の却下: ${w}`);
      await 別のブラウザの画面を撮る(B!.page, scene.stepLabel(8, "ブラウザB（RD承認者）の却下のあと"));
    });
    await step(9, async () => {
      const r = await 在庫履歴を検索する(page, { キーワード: code, 店舗ID: 店AのID(), 登録元: "在庫移動" });
      after = r.rows;
    });
    await step(10, async () => { note(`手順9の検索結果: ${JSON.stringify(after)}`); });
    await expected(async () => {
      expect.soft(positive(mid), `手順6: ${code} の在庫増減数が正の値の行が無い`).toEqual([]);
      const rows = after.filter((r) => codeOf(r) === code && 数(列の値(r, "在庫変動数")) === 3);
      expect(rows.length, `手順9: ${code} の在庫増減数が3の行が1件`).toBe(1);
      expectHistoryRow(rows[0], { 登録元: "在庫移動", 登録元ID: id, 変更前在庫: 7, 変更後在庫: 10, 変更前総原価: 700, 変更後総原価: 1000 }, `${code} の在庫増減数が3の行`);
    });
  } finally {
    await B?.close();
  }
});

// ---------------------------------------------------------------- 167・169: 入庫承認申請・入庫承認 → 入庫先の在庫・在庫履歴

/** 手順2〜5: 一覧から入庫承認申請画面 → 承認通知先（試験所属B・RD入庫先承認者）で承認申請 → ブラウザBで入庫承認画面 → 承認 */
async function inboundFlow(page: Page, browser: Browser, id: string, step: (n: number, body: () => Promise<void>) => Promise<void>,
  hold: { B?: Awaited<ReturnType<typeof openBrowserB>> }): Promise<void> {
  await step(2, async () => { await openViaList(page, id, inboundRequestPath(id), "入庫承認申請画面"); });
  await step(3, async () => {
    await requestInbound(page, id, { 所属: 所属B, メンバー: RD入庫先承認者名 }, "入庫承認申請", (w) => note(`入庫承認申請: ${w}`));
  });
  await step(4, async () => {
    hold.B = await openBrowserB(browser, RD_APRB);
    await openViaList(hold.B.page, id, inboundApprovalPath(id), "ブラウザBの入庫承認画面");
    await 別のブラウザの画面を撮る(hold.B.page, scene.stepLabel(4, "ブラウザB（RD入庫先承認者）の入庫承認画面"));
  });
  await step(5, async () => {
    await pressApprove(hold.B!.page, "inbound_approval_approve_btn");
    for (const w of await expectSaved(hold.B!.page, "入庫承認")) note(`入庫承認: ${w}`);
    await 別のブラウザの画面を撮る(hold.B!.page, scene.stepLabel(5, "ブラウザB（RD入庫先承認者）の承認のあと"));
  });
}

caseTest("IT-M04-09-167", async ({ page, browser, notes, step, expected }) => {
  const code = rc("M0409RD-005");
  const id = notes.get("〔在庫移動ID-M0409-RD005〕");
  let before: 在庫の行 | undefined;
  let after: 在庫の行 | undefined;
  const hold: { B?: Awaited<ReturnType<typeof openBrowserB>> } = {};
  rdLoginNote(RD_OP, "m0409rd-op");
  rdLoginNote(RD_APRB, "m0409rd-aprb");
  try {
    await step(1, async () => {
      await login(page, RD_OP);
      before = await stockRowOf(page, code, 店B);
    });
    await inboundFlow(page, browser, id, step, hold);
    await step(6, async () => { after = await stockRowOf(page, code, 店B); });
    await step(7, async () => { note(`手順7の行: ${JSON.stringify(after)}`); });
    await expected(async () => {
      expect.soft([数(before!.在庫), 数(before!.総原価)], "手順1の在庫・総原価").toEqual([0, 0]);
      expect.soft([after!.店舗, after!.在庫区分], "手順6の店舗・在庫区分").toEqual([店B, EC]);
      expect.soft([数(after!.在庫), 数(after!.総原価)], "手順6の在庫・総原価").toEqual([3, 300]);
    });
  } finally {
    await hold.B?.close();
  }
});

caseTest("IT-M04-09-169", async ({ page, browser, notes, step, expected }) => {
  const code = rc("M0409RD-007");
  const id = notes.get("〔在庫移動ID-M0409-RD007〕");
  let first: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  const hold: { B?: Awaited<ReturnType<typeof openBrowserB>> } = {};
  rdLoginNote(RD_OP, "m0409rd-op");
  rdLoginNote(RD_APRB, "m0409rd-aprb");
  try {
    await step(1, async () => {
      await login(page, RD_OP);
      const r = await 在庫履歴を検索する(page, { キーワード: code, 店舗ID: 本店の店舗ID, 登録元: "在庫移動" });
      first = r.rows;
      note(`手順1の検索結果: 応答 ${r.status}・行 ${JSON.stringify(r.rows)}・メッセージ「${r.messages.join(" / ")}」`);
    });
    await inboundFlow(page, browser, id, step, hold);
    await step(6, async () => {
      const r = await 在庫履歴を検索する(page, { キーワード: code, 店舗ID: 本店の店舗ID, 登録元: "在庫移動" });
      after = r.rows;
    });
    await step(7, async () => { note(`手順6の検索結果: ${JSON.stringify(after)}`); });
    await expected(async () => {
      expect.soft(first.filter((r) => codeOf(r) === code), `手順1: ${店B} の ${code} の在庫移動の履歴が無い`).toEqual([]);
      const rows = after.filter((r) => codeOf(r) === code);
      expect(rows.length, `手順6: ${code} の行が1件`).toBe(1);
      expectHistoryRow(rows[0], {
        店舗: 店B, 在庫区分: EC, 登録元: "在庫移動", 登録元ID: id, 変更前在庫: 0, 変更後在庫: 3, 在庫増減数: 3, 変更前総原価: 0, 変更後総原価: 300,
      }, `${code} の行`);
    });
  } finally {
    await hold.B?.close();
  }
});

// ---------------------------------------------------------------- 168: 在庫振替の登録 → 在庫検索一覧

caseTest("IT-M04-09-168", async ({ page, step, expected }) => {
  const src = rc("M0409RD-006-A");
  const dest = rc("M0409RD-006-B");
  let before: 在庫の行 | undefined;
  let after: 在庫の行 | undefined;
  rdLoginNote(RD_OP, "m0409rd-op");
  await step(1, async () => {
    await login(page, RD_OP);
    before = await stockRowOf(page, src, 店A);
  });
  await step(2, async () => {
    await checkStockRows(page, [src], 店A, EC);
    const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
    expect(r.moved, `「在庫振替登録」で登録画面へ移る（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`).toBe(true);
  });
  await step(3, async () => { await registerTransferOnForm(page, src, dest, 2); });
  await step(4, async () => { after = await stockRowOf(page, src, 店A); });
  await step(5, async () => { note(`手順5の行: ${JSON.stringify(after)}`); });
  await expected(async () => {
    expect.soft([数(before!.在庫), 数(before!.総原価)], "手順1の在庫・総原価").toEqual([10, 1000]);
    expect.soft([after!.店舗, after!.在庫区分], "手順5の店舗・在庫区分").toEqual([店A, EC]);
    expect.soft([数(after!.在庫), 数(after!.総原価)], "手順5の在庫・総原価").toEqual([8, 800]);
  });
});

// ---------------------------------------------------------------- 105: 入庫完了の移動のステータス変更履歴

caseTest("IT-M04-09-105", async ({ page, notes, step, expected }) => {
  const id = notes.get(L105);
  let rows: 状態の履歴[] = [];
  supplement(`正本の在庫移動・振替ID 409510501 は、シードが画面で作った移動の番号 ${id} で読み替えた`);
  await login(page, M0409_OP);
  await step(1, async () => {
    const list = new MoveTransferList(page);
    await list.searchById(id);
  });
  await step(2, async () => {
    await new MoveTransferList(page).openFromRow(id);
    expect(moveCompletePath(id).test(new URL(page.url()).pathname), `在庫移動完了画面が開く（${page.url()}）`).toBe(true);
  });
  await step(3, async () => {
    rows = await ステータス変更履歴の表(page);
    note(`ステータス変更履歴: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    const want: [RegExp, string, string][] = [
      [/^2026[/-]0?3[/-]0?1 09:00(:00)?$/, "新規登録", 作業者名],
      [/^2026[/-]0?3[/-]0?1 09:30(:00)?$/, "出庫承認待ち", 作業者名],
      [/^2026[/-]0?3[/-]0?1 10:00(:00)?$/, "出庫承認済み", 承認者名],
      [/^2026[/-]0?3[/-]0?1 11:00(:00)?$/, "入庫完了", 入庫担当者名],
    ];
    expect.soft(rows.length, "ステータス変更履歴の件数").toBe(4);
    // 表の並び（新しい順か古い順か）は期待結果が決めていないので、更新日の順に並べて照らす
    const sorted = [...rows].sort((a, b) => a.更新日.localeCompare(b.更新日));
    want.forEach(([at, st, who], i) => {
      const r = sorted[i];
      expect.soft(r?.更新日 ?? "（行が無い）", `${i + 1}件目の更新日`).toMatch(at);
      expect.soft(r?.ステータス ?? "（行が無い）", `${i + 1}件目のステータス`).toBe(st);
      expect.soft(r?.更新者 ?? "（行が無い）", `${i + 1}件目の更新者`).toBe(who);
    });
  });
});
