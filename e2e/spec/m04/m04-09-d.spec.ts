/**
 * M04-09 在庫移動・振替登録/編集の続き（2026-11-26 依頼者「結合試験項目表で実施結果が空の行を E2E で進める」）。正本: cases/M04-09_test_cases.tsv
 * 判定済みのケース（spec/m04/m04-09.spec.ts）の指紋を変えないため、別のファイルにした。シードは seeds/m04-09-d.ts。
 *
 * - 036・037・111・152: 新規登録の移動の「ピック・出庫承認申請」（欠品登録・承認通知先・承認申請）。
 * - 051・057・154: 移動中の移動の「入庫承認申請」（差分登録・承認通知先・承認申請）。入庫担当者で行う。
 * - 書かなかったもの: 029・137・138（DB の行ロックを掛けたまま画面を操作する部品が要る）、148（ユニサーチ試験環境・専用の支店が前提）、
 *   171〜177・180〜194（TC東京2F の店舗・共有の入荷通知メールの設定・メールの受け取りが前提）。理由は報告のとおり。
 * - 正本の手順・期待結果の文はコードに写さない（報告には正本の文が出る）。
 */
import { Page, test } from "@playwright/test";
import * as dbm from "../../db/m04_09_move";
import * as dbd from "../../db/m04_09_d";
import * as dbx from "../../db/m04_09_x";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { Account, loginAdmin } from "../../lib/session";
import {
  chooseApprovalTarget, InboundRequestPage, inboundApprovalPath, inboundRequestPath, MoveTransferList, OutboundRequestPage, outboundApprovalPath,
  outboundRequestPath, topMessages, 承認者名, 作業者名, 入庫担当者名, 所属A,
} from "../../pages/admin/m04_09_move";
import { M0409_OP, M0409_RCV } from "../../seeds/m04-09";
import "../../seeds/m04-09-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** ログインし、1つの操作の待ちを3分までにする */
async function login(page: Page, account: Account): Promise<void> {
  page.setDefaultTimeout(180_000);
  await loginAdmin(page, account);
}

/** 在庫移動・振替検索一覧で ID を入れて検索し、行を選んで開く。開いた画面が求める画面であること */
async function openViaList(page: Page, id: string, want: RegExp): Promise<void> {
  const list = new MoveTransferList(page);
  await list.searchById(id);
  await list.openFromRow(id);
  expect(want.test(new URL(page.url()).pathname), `在庫移動・振替検索一覧の行から開いた画面（${page.url()}）`).toBe(true);
}

/** DBの日時（「2026-10-22 07:22:31.65+00」の形）を時刻の数にする。読めなければ NaN */
function dbTime(v: string | null | undefined): number {
  if (!v) return NaN;
  return Date.parse(v.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00"));
}

/** 期待結果の「操作日時が保存される」: 操作の前の値から変わり、操作を挟んだ時刻（前後1分のゆとり）に入っていること */
function expectOperationTime(label: string, before: string | null | undefined, after: string | null | undefined, t0: number, t1: number): void {
  note(`${label}: 操作の前「${before ?? "なし"}」→ 後「${after ?? "なし"}」（操作 ${new Date(t0).toISOString()}〜${new Date(t1).toISOString()}）`);
  const t = dbTime(after);
  expect.soft(after !== before && t >= t0 - 60_000 && t <= t1 + 60_000, `${label}が操作の時刻で保存される（${after}）`).toBe(true);
}

/** ピック・出庫承認申請画面で「承認申請」を押し、確認モーダルの「承認申請する」を押す。押したあとの時刻の組を返す */
async function submitOutbound(page: Page, req: OutboundRequestPage): Promise<{ t0: number; t1: number }> {
  const t0 = Date.now();
  await expect(req.submit, "「承認申請」").toHaveText(/^\s*承認申請\s*$/);
  await req.submit.click();
  const modal = page.locator("#stockMoveConfirmModalInterStore");
  await expect(modal, "承認申請の確認モーダル").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
  const m = await topMessages(page);
  note(`承認申請の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  return { t0, t1: Date.now() };
}

/** 移動入庫承認申請画面で「承認申請」を押し、確認モーダルの「承認申請する」を押す */
async function submitInbound(page: Page, req: InboundRequestPage): Promise<{ t0: number; t1: number }> {
  const t0 = Date.now();
  await req.submit.click();
  const modal = page.locator("#stockMoveInboundConfirmModal");
  await expect(modal, "承認申請の確認モーダル").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
  const m = await topMessages(page);
  note(`承認申請の結果: ${page.url()} 成功「${m.成功.join(" / ")}」 エラー「${m.エラー.join(" / ")}」`);
  return { t0, t1: Date.now() };
}

const OUT_FORM = "admin_stock_move_outbound_approval_request";
const IN_FORM = "admin_stock_move_inbound_approval_request";

// ---------------------------------------------------------------- ピック・出庫承認申請

caseTest("IT-M04-09-036", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-036〕");
  const code = rc("M409-MOV-A-036");
  const req = new OutboundRequestPage(page);
  const before = dbm.在庫移動振替(id);
  const histBefore = dbm.ステータス変更履歴(id);
  let t = { t0: 0, t1: 0 };
  await step(1, async () => {
    await openViaList(page, id, outboundRequestPath(id));
    await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible();
    await req.registerShortageAsWritten(code, 1, supplement);
  });
  await step(2, async () => { await chooseApprovalTarget(page, OUT_FORM, 所属A, [承認者名]); });
  await step(3, async () => { t = await submitOutbound(page, req); });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))} 明細 ${JSON.stringify(dbd.明細の担当者(id))} 履歴 ${JSON.stringify(dbm.ステータス変更履歴(id))}`); });
  await expected(async () => {
    const after = dbm.在庫移動振替(id)!;
    expect.soft(after.ステータス, "ステータスが出庫承認待ち").toBe("出庫承認待ち");
    expect.soft(after.更新者, "更新情報の更新者").toBe(作業者名);
    expectOperationTime("更新情報の操作日時", before?.更新日, after.更新日, t.t0, t.t1);
    const hist = dbm.ステータス変更履歴(id);
    const last = hist[hist.length - 1];
    expect.soft(hist.length, "ステータス変更履歴が1件増える").toBe(histBefore.length + 1);
    expect.soft([last?.ステータス, last?.更新者], "ステータス変更履歴（出庫承認待ち・更新者）").toEqual(["出庫承認待ち", 作業者名]);
    expectOperationTime("ステータス変更履歴の日時", histBefore[histBefore.length - 1]?.更新日, last?.更新日, t.t0, t.t1);
    const d = dbd.明細の担当者(id).find((r) => r.商品コード === code);
    expect.soft([d?.欠品点数, d?.欠品登録者], `${code} の欠品点数と欠品登録者`).toEqual([1, 作業者名]);
  });
});

caseTest("IT-M04-09-037", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-037〕");
  const req = new OutboundRequestPage(page);
  await step(1, async () => {
    await openViaList(page, id, outboundRequestPath(id));
    await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible();
    await chooseApprovalTarget(page, OUT_FORM, 所属A, [承認者名]);
  });
  await step(2, async () => { await submitOutbound(page, req); });
  await expected(async () => {
    expect(outboundApprovalPath(id).test(new URL(page.url()).pathname), `移動出庫承認画面へ遷移する（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-111", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-111〕");
  const req = new OutboundRequestPage(page);
  await step(1, async () => {
    await openViaList(page, id, outboundRequestPath(id));
    await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible();
  });
  await step(2, async () => { await chooseApprovalTarget(page, OUT_FORM, 所属A, [承認者名]); });
  await step(3, async () => { await submitOutbound(page, req); });
  await step(4, async () => {
    note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))} 明細 ${JSON.stringify(dbd.明細の担当者(id))} 履歴 ${JSON.stringify(dbm.ステータス変更履歴(id))} メンバーの番号 ${JSON.stringify(dbd.保存されたメンバーの番号(id))}`);
  });
  await expected(async () => {
    expect.soft(dbm.在庫移動振替(id)?.ステータス, "ステータスが出庫承認待ち").toBe("出庫承認待ち");
    // 承認通知先の所属・メンバーは、在庫移動情報・明細・ステータス変更履歴のどの項目にも保存されない。
    // 所属を持つ欄はこの3つに無い。メンバーを持つ欄の番号が、選んだ M04-09承認者 のものでないことで確かめる
    const approverId = dbx.メンバーID(承認者名);
    const saved = dbd.保存されたメンバーの番号(id);
    note(`選んだ承認通知先のメンバーの番号: ${approverId}`);
    expect.soft(saved.filter((s) => s.番号 === approverId).map((s) => s.場所), "選んだ承認通知先のメンバーが保存されている欄").toEqual([]);
  });
});

caseTest("IT-M04-09-152", async ({ page, notes, step, expected }) => {
  await login(page, M0409_OP);
  const id = notes.get("〔在庫移動ID-M0409-152〕");
  const a = rc("M0409-152-A");
  const b = rc("M0409-152-B");
  const req = new OutboundRequestPage(page);
  await step(1, async () => {
    await openViaList(page, id, outboundRequestPath(id));
    await expect(req.form, "移動ピック・出庫承認申請画面").toBeVisible();
    await req.registerShortageAsWritten(a, 1, supplement);
  });
  await step(2, async () => { await chooseApprovalTarget(page, OUT_FORM, 所属A, [承認者名]); });
  await step(3, async () => { await submitOutbound(page, req); });
  await step(4, async () => { note(`DB: 明細 ${JSON.stringify(dbd.明細の担当者(id))}`); });
  await expected(async () => {
    const rows = dbd.明細の担当者(id);
    const da = rows.find((r) => r.商品コード === a);
    const db = rows.find((r) => r.商品コード === b);
    expect.soft(rows.length, "明細が2件").toBe(2);
    expect.soft([da?.欠品点数, da?.欠品登録者], `${a} の欠品点数と欠品登録者`).toEqual([1, 作業者名]);
    expect.soft([db?.欠品点数, db?.欠品登録者], `${b} の欠品点数（保存されない）と欠品登録者（保存されない）`).toEqual([0, null]);
  });
});

// ---------------------------------------------------------------- 入庫承認申請

caseTest("IT-M04-09-051", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-051〕");
  const a = rc("M409-MOV-A-051");
  const b = rc("M409-MOV-B-051");
  const req = new InboundRequestPage(page);
  await step(1, async () => {
    await openViaList(page, id, inboundRequestPath(id));
    await expect(req.form, "移動入庫承認申請画面").toBeVisible();
    await req.registerDiffAsWritten(a, -999999, supplement);
    await req.registerDiffAsWritten(b, 999999, supplement);
  });
  await step(2, async () => { await chooseApprovalTarget(page, IN_FORM, "", [承認者名]); });
  await step(3, async () => { await submitInbound(page, req); });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))} 明細 ${JSON.stringify(dbd.明細の担当者(id))}`); });
  await expected(async () => {
    const rows = dbd.明細の担当者(id);
    expect.soft(rows.find((r) => r.商品コード === a)?.差分点数, `${a} の差分点数`).toBe(-999999);
    expect.soft(rows.find((r) => r.商品コード === b)?.差分点数, `${b} の差分点数`).toBe(999999);
  });
});

caseTest("IT-M04-09-057", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-057〕");
  const a = rc("M409-MOV-A-057");
  const req = new InboundRequestPage(page);
  const before = dbm.在庫移動振替(id);
  const histBefore = dbm.ステータス変更履歴(id);
  let t = { t0: 0, t1: 0 };
  await step(1, async () => {
    await openViaList(page, id, inboundRequestPath(id));
    await expect(req.form, "移動入庫承認申請画面").toBeVisible();
    await req.registerDiffAsWritten(a, 1, supplement);
  });
  await step(2, async () => { await chooseApprovalTarget(page, IN_FORM, "", [承認者名]); });
  await step(3, async () => { t = await submitInbound(page, req); });
  await step(4, async () => { note(`DB: ${JSON.stringify(dbm.在庫移動振替(id))} 明細 ${JSON.stringify(dbd.明細の担当者(id))} 履歴 ${JSON.stringify(dbm.ステータス変更履歴(id))}`); });
  await expected(async () => {
    const after = dbm.在庫移動振替(id)!;
    expect.soft(after.ステータス, "ステータスが入庫承認待ち").toBe("入庫承認待ち");
    // 差分商品コード・商品名は、明細の商品（差分を登録した明細の商品）の値として保存される。差分商品だけの別の保存先は無い
    const d = dbd.明細の担当者(id).find((r) => r.商品コード === a);
    expect.soft([d?.商品コード, d?.商品名, d?.差分点数, d?.差分登録者], "差分商品コード・商品名・差分点数・差分登録者").toEqual([a, a, 1, 入庫担当者名]);
    expect.soft(after.更新者, "更新者").toBe(入庫担当者名);
    expectOperationTime("更新情報の操作日時", before?.更新日, after.更新日, t.t0, t.t1);
    const hist = dbm.ステータス変更履歴(id);
    const last = hist[hist.length - 1];
    expect.soft(hist.length, "ステータス変更履歴が1件増える").toBe(histBefore.length + 1);
    expect.soft([last?.ステータス, last?.更新者], "ステータス変更履歴（入庫承認待ち・更新者）").toEqual(["入庫承認待ち", 入庫担当者名]);
    expect.soft(inboundApprovalPath(id).test(new URL(page.url()).pathname), `移動入庫承認画面へ遷移する（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M04-09-154", async ({ page, notes, step, expected }) => {
  await login(page, M0409_RCV);
  const id = notes.get("〔在庫移動ID-M0409-154〕");
  const a = rc("M0409-154-A");
  const b = rc("M0409-154-B");
  const req = new InboundRequestPage(page);
  await step(1, async () => {
    await openViaList(page, id, inboundRequestPath(id));
    await expect(req.form, "移動入庫承認申請画面").toBeVisible();
    await req.registerDiffAsWritten(a, 1, supplement);
  });
  await step(2, async () => { await chooseApprovalTarget(page, IN_FORM, "", [承認者名]); });
  await step(3, async () => { await submitInbound(page, req); });
  await step(4, async () => { note(`DB: 明細 ${JSON.stringify(dbd.明細の担当者(id))}`); });
  await expected(async () => {
    const rows = dbd.明細の担当者(id);
    const da = rows.find((r) => r.商品コード === a);
    const db = rows.find((r) => r.商品コード === b);
    expect.soft(rows.length, "明細が2件").toBe(2);
    // 差分商品コード・商品名は、差分を登録した明細の商品の値。差分を登録しなかった明細は、差分点数が0・差分登録者が空
    expect.soft([da?.商品コード, da?.商品名, da?.差分点数, da?.差分登録者], `${a} の差分商品コード・商品名・差分点数・差分登録者`).toEqual([a, a, 1, 入庫担当者名]);
    expect.soft([db?.差分点数, db?.差分登録者], `${b} の差分点数（保存されない）と差分登録者（保存されない）`).toEqual([0, null]);
  });
});
