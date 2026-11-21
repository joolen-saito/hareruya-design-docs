/**
 * M05-14 対応状況設定の連携ケース 001 のシード。正本: cases/M05-14_seed_data.tsv
 * 実装するケースは 001（記録 review/M05-14_progress_2026-11-21_dev.md）。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - 店舗A（店舗ID 20514）は店舗を作らない決まりなので、本店（店舗ID 1）で表す（M05-01 と同じ読み替え）。
 * - 受注ステータスの「新規受付」は、新しいアプリの「注文受領」（注文の直後の対応状況）で表す。
 * - S-M05-14-L-ENV（マスタの参照のみ）: 本店の店名・受注ステータス「注文受領」「入金済み」が画面の選択肢にあることを、受注情報編集画面で確かめる代わりに、
 *   S-M05-14-L-ORDER-001 の受注を作った後の受注情報編集画面の変更後のステータスの選択肢で確かめる（ケースの手順3でも選ぶ）。ここでは何も書き換えない。
 * - 管理者はメンバー管理で登録する。ログインID・名前に使い回す決まった印を付けて1度だけ作る（パスワード・権限はシード表のとおり。権限は受注管理を操作できるシステム管理者）。
 * - 受注（S-M05-14-L-ORDER-001）は画面で作る。会員は M05 の共通の試験用の会員（フロントの会員登録で作ってある1人）。
 *   商品は、この実行で1件だけ作る試験商品（グッズ商品CSV登録＋在庫変更CSVの入庫を、在庫変更の番号で承認一覧を開いて承認する（本店の承認一覧は未承認が1,000件を超え、表示に今回の行が出ないため）。商品コード・商品名は M0514L002-A に実行の印を付けた値。価格100円。
 *   シード表の価格 3000 は、ケースの期待結果（入金日）に効かないので揃えない）。注文は本店の画面で、支払方法は銀行振込以外で外部の画面へ移らないもの。
 *   シード表の注文者情報・お届け日などの値（試験姓・住所・お届け日 2026-10-20 など）と、手順6の保存（支払方法・ポイント還元率の入力）は、
 *   入金日の結果に効かないので行わない。
 * - 発生ポイント=0 の DB での設定は行わない（画面で指定できず、DB は E2E が作った行にしか書かない決まり。ケースは入金日だけを確かめる）。
 * - 受注が「新規受付（注文受領）で入金日が無い」ことは、受注を作ったあとの受注情報編集画面で確かめ、そうでなければ止める。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { M05_BUYER } from "../pages/front/m05_front_order";
import { 会員IDを一覧から読む, OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 注文番号から受注IDを読む, 会員が商品を注文する } from "../pages/admin/m05_01_orders";
import { 試験商品を用意する } from "../pages/admin/m05_14_order_seed";
import { ensureM05Admin, M05管理者 } from "../pages/admin/m05_admin_member";
import { 入金日を読む } from "../pages/admin/m05_14_order_status";

/** 正本のログインID m0514_l_admin に、決まった印を付けた値（小文字） */
export const M0514_ADMIN: M05管理者 = {
  名前: rcFixed("M05-14連携試験管理者"),
  account: { loginId: rcFixed("m0514_l_admin").toLowerCase(), password: "Passw0rd!M0514L" },
  メール: `${rcFixed("m0514_l_admin").toLowerCase()}@example.test`,
};
export const M0514_ACCOUNT: Account = M0514_ADMIN.account;

defineSeed("S-M05-14-L-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗A（店舗ID 20514）は店舗を作らないので本店（店舗ID 1）で、受注ステータスの「新規受付」は新しいアプリの「注文受領」で表す。マスタは参照だけで、書き換えていない（受注ステータスの選択肢は、受注を作ったあとの受注情報編集画面で確かめる）");
});

defineSeed("S-M05-14-L-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, M0514_ADMIN);
});

defineSeed("S-M05-14-L-ORDER-001", { needs: ["S-M05-14-L-ENV", "S-M05-14-L-ADM"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const item = await 試験商品を用意する(browser, { 名前: M0514_ADMIN.名前, account: M0514_ACCOUNT }, rc("M0514L002-A"), rc("M0514L002-A"), issue);
  const 注文 = await 会員が商品を注文する(browser, M05_BUYER, item.商品ID, `${seed.シードID} の注文`);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, M05_BUYER.メール));
  const 受注ID = await withAdminSession(browser, M0514_ACCOUNT, async (page) => {
    const id = await 注文番号から受注IDを読む(page, 注文.注文番号, issue);
    await page.goto(adminUrl(`/order/${id}/edit`));
    await page.waitForLoadState("load");
    const edit = new OrderEditPage(page);
    const 状態 = await edit.現在のステータス();
    const 入金日 = await 入金日を読む(page);
    if (状態 !== "注文受領" || 入金日 !== "") throw new Error(`${seed.シードID}: 作った受注の対応状況が「${状態}」・入金日が「${入金日}」（注文受領で入金日が無いはず）`);
    const 選択肢 = (await edit.status.locator("option").allInnerTexts()).map((t) => t.trim());
    for (const 必要 of ["注文受領", "入金済み"]) if (!選択肢.includes(必要)) throw new Error(`${seed.シードID}: 受注情報編集画面の変更後のステータスに「${必要}」が無い（${選択肢.join("、")}）`);
    return id;
  });
  notes.set("〔受注番号-M0514-001〕", 注文.注文番号);
  notes.set("〔受注ID-M0514-001〕", 受注ID);
  notes.set("〔会員ID-M0514-001〕", 会員ID);
  issue(`読み替え: 会員は M05 の共通の試験用の会員（${M05_BUYER.メール}）、商品は実行の印つきの試験商品（${item.商品コード}）、注文は本店の画面での注文。作った受注の対応状況は注文受領・入金日なし`);
});
