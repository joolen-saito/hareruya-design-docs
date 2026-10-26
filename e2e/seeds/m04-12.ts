/**
 * M04-12 在庫分割結合検索/一覧の画面シード。正本: cases/M04-12_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（001・002・003）が使う S-M04-12-ADM だけ。
 * - S-M04-12-ADM: メンバー管理で「M04-12試験管理者」（ログインID m0412_admin）を登録する。あれば内容を確かめて使う。
 *   管理者ID 412000001 は画面が振るので指定できない（ケースの手順・期待結果には出てこない）。
 *   シード表は「在庫管理権限を付与する」とだけ書く。権限は、在庫管理を含むすべての画面を操作できる「システム管理者」にした。
 *   所属店舗・デフォルト検索表示店舗・編集可能店舗はシード表に無いが、メンバー登録画面で必須なので、本店（店舗ID 1。アプリが親店舗として扱う店舗）にした。
 * - BASE・STATUS・PAGING・JOINCHK・SPLITDST・MIXED は、登録日・在庫数などをDBへ直接設定し、ほかの在庫分割結合データをDBで退避するので作らない
 *   （それらを使うケースは実装しない）。PAGE-MASTER も、それを使うケース（031〜033）が BASE・PAGING を使うので作らない。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { SplitJoinListPage } from "../pages/admin/m04_13_split_join";

export const M0412_ADMIN: Account = { loginId: "m0412_admin", password: "Passw0rd!M0412" };
const ADMIN_NAME = "M04-12試験管理者";
/** アプリが親店舗（本店）として扱う店舗ID */
const MAIN_SHOP_ID = "1";

defineSeed("S-M04-12-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: ADMIN_NAME, ログインID: M0412_ADMIN.loginId, メールアドレス: "m0412_admin@example.test", パスワード: M0412_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: MAIN_SHOP_ID, デフォルト検索表示店舗ID: MAIN_SHOP_ID, 編集可能店舗ID: [MAIN_SHOP_ID],
  }));
  // ログインでき（ロックされていない）、在庫分割結合検索/一覧画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0412_ADMIN, async (page) => {
    await new SplitJoinListPage(page).open();
  });
});
