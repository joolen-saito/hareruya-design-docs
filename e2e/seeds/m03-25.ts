/**
 * M03-25 重複商品コード確認の画面シード。正本: cases/M03-25_seed_data.tsv
 *
 * 作るシード: ADM・DBACCESS（ケース 002 が使う）。
 * - ADM: 正本の「管理者ID=325000000」は、管理画面のメンバー登録では指定できない（画面が振る）。ほかの属性はメンバー登録で作る。
 *   ケースの文は管理者IDを確かめに使わないので、画面が振った管理者IDのまま進め、報告に出す
 * - DBACCESS: 正本は「データベース権限管理で参照権限を許可または一時停止する」。権限の変更はDBの変更なのでしない。
 *   「許可」の状態は試験環境の既定の状態なので、いまの権限を読んで確かめるだけにする（条件付き）。一時停止（ケース 001）は作らない
 *
 * 作らないシード（実装しないケースだけが使う）: UNIT-003・UNIT-005・NONE-006・NONE-007・UNIT-011・CBDEL-012
 * （どれも「既存の商品関連データの退避」をDBへ直接設定する）
 */
import { SETUP_ADMIN } from "../config/env";
import { アプリの接続利用者, 商品サブ情報の表がある, 商品関連の参照権限 } from "../db/m03_25_product_access";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ensureMember, findMemberId } from "../pages/admin/member";
import { ProductSearchPage } from "../pages/admin/product_search";

export const M0325_ADMIN: Account = { loginId: "m0325_admin", password: "Passw0rd!M0325" };
const NAME = "M03-25試験管理者";

/** アプリが本店（親店舗）として扱う店舗ID。正本は所属店舗を指定しないので本店にする */
const MAIN_SHOP_ID = "1";

defineSeed("S-M03-25-ADM", async ({ browser, seed }) => {
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const shop = await storeNameById(page, MAIN_SHOP_ID);
    await ensureMember(page, {
      名前: NAME, 所属店舗: shop, ログインID: M0325_ADMIN.loginId, メールアドレス: "m0325_admin@example.test",
      パスワード: M0325_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
    return findMemberId(page, NAME);
  });
  reportSeedIssue(seed.シードID, `正本の管理者ID 325000000 は画面で指定できないので、画面が振った管理者ID ${id} のまま使った`);
  // ログインでき（ロックされていない）、商品管理を操作できること
  await withAdminSession(browser, M0325_ADMIN, async (page) => {
    await new ProductSearchPage(page).open();
  });
});

defineSeed("S-M03-25-DBACCESS", async ({ seed }) => {
  const user = アプリの接続利用者();
  const r = 商品関連の参照権限(user);
  if (!r.商品 || !r.商品規格) throw new Error(`アプリの接続利用者 ${user} に参照権限が無い（商品: ${r.商品}・商品規格: ${r.商品規格}）。権限は変えない決まりなので止めた`);
  reportSeedIssue(seed.シードID, `権限は変えず、アプリの接続利用者 ${user} が商品・商品規格を参照できる（許可の状態）ことを確かめただけ`
    + (商品サブ情報の表がある() ? "" : "。商品サブ情報に当たる表はこのアプリのデータベースに無い（重複商品コード確認も商品・商品規格だけを読む）"));
});
