/**
 * M06-09 買取集計データCSV出力 の画面シード。正本: cases/M06-09_seed_data.tsv
 *
 * 作るシード（画面だけで準備できる 002 が使うもの）:
 * - S-M06-09-EMPTY-002: 店舗「M06-09試験店舗002」（公開・開店）を店舗登録画面で登録し、店舗一覧の行のIDを控える。この店舗では店頭買取を行わない（買取集計データは0件）。
 *   あれば内容を確かめて使う。
 * - S-M06-09-ADM-002: メンバー管理で登録する試験管理者。正本は管理者内部ID 60900290・店舗ID 60900201 と定めるが、画面が振る番号は指定できない。
 *   デフォルト検索表示店舗と編集可能店舗は、画面が振った店舗ID（EMPTY-002 が控えたもの）にした。権限は正本が定めないのでシステム管理者にした。
 *
 * DBでの準備が要るシード（MASTER・DATA-*・PRICE-007・NO-SECTION-*・ADM-014/015）は作らない。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { storeInput } from "./m06-common";

export const M0609_ADMIN_002: Account = { loginId: "m0609_admin_002", password: "Passw0rd!M0609-002" };
const STORE = storeInput("M06-09試験店舗002", "エムゼロロクゼロキュウシケンテンポゼロゼロニ", "Kaitori Summary Test Store", "m0609s002", "K9B");
const LABEL = "〔店舗ID-M0609-002〕";

defineSeed("S-M06-09-EMPTY-002", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set(LABEL, await ensureStore(page, STORE, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-M06-09-ADM-002", { needs: ["S-M06-09-EMPTY-002"] }, async ({ browser, notes, seed }) => {
  const id = notes.get(LABEL);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-09試験管理者002", ログインID: M0609_ADMIN_002.loginId, メールアドレス: "m0609_admin_002@example.test", パスワード: M0609_ADMIN_002.password,
    権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: id, 編集可能店舗ID: [id],
  }));
  reportSeedIssue(seed.シードID, `管理者内部ID 60900290・店舗ID 60900201 は画面から指定できないので、画面が振った店舗ID ${id} で作った`);
});
