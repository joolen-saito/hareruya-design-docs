/**
 * F08-05（店頭買取の申込履歴）の画面シード。正本: cases/F08-05_seed_data.tsv
 *
 * 作るシード（画面だけで準備できる 074 が使うもの）:
 * - S-F08-05-PD-STORE-074: 店舗「店頭買取PD0805-003」（支店URL itf0805pd003）。店舗一覧に同じ店名の開店の店舗があれば登録せず使う
 *   （店名略称が重ならない値は固定。再実行で同じ店舗に当たるため、正本の「申込みが0件」は新規に作った実行でだけ成り立つ）。
 *   支店URLには、実行の印を付けない（印のハイフンは店舗識別名に使えず、同じ店舗を使うため）。
 * - S-F08-05-PD-MEMBER-074: 会員。フロントの新規会員登録で作り、仮会員なら本登録のメールのURLを開いて本会員にする（依頼者決定 2026-10-31）。
 *   メールの前半には実行の印を付ける。会員IDは管理画面の会員一覧で控える。
 * - S-F08-05-PD-ADM: メンバー管理で登録する管理者（f0805pdadmin）。権限は正本が定める細かな権限の代わりに、システム管理者にした。
 *
 * DBでの準備が要るシードは作らない。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { registerFrontMember } from "../pages/front/member_entry";
import { storeInput } from "./m06-common";

export const F0805_ADMIN: Account = { loginId: "f0805pdadmin", password: "Passw0rd-PD0805" };
export const PD_STORE = storeInput("店頭買取PD0805-003", "テントウカイトリピーディー", "Otc Buy PD Store", "itf0805pd003", "F5P");
export const PD_MEMBER_PASSWORD = "Pw-F0805-PD-003";
/** 会員のメールアドレス（正本の pd0805-003@example.test の前半に実行の印を付けた値） */
export const pdMemberEmail = () => `${rc("pd0805-003")}@example.test`;

defineSeed("S-F08-05-PD-STORE-074", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-F0805-003〕", await ensureStore(page, PD_STORE, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-F08-05-PD-MEMBER-074", async ({ browser, notes }) => {
  const email = pdMemberEmail();
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, {
      姓: "履歴丙", 名: "三郎", セイ: "レキシヘイ", メイ: "サブロウ", メール: email, パスワード: PD_MEMBER_PASSWORD,
      詳細: { 郵便番号1: "160", 郵便番号2: "0023", 都道府県: "東京都", 住所1: "新宿区西新宿1-1-1", 住所2: "履歴ビル003", 電話: ["03", "1234", "5678"] },
    });
  } finally {
    await context.close();
  }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const id = await customerIdByEmail(page, email);
    if (!id) throw new Error(`会員 ${email} が会員一覧に出ない`);
    notes.set("〔会員ID-F0805-003〕", id);
  });
});

defineSeed("S-F08-05-PD-ADM", { needs: ["S-F08-05-PD-STORE-074"] }, async ({ browser, notes }) => {
  const id = notes.get("〔店舗ID-F0805-003〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "F0805 PD確認用管理者", ログインID: F0805_ADMIN.loginId, メールアドレス: "f0805pdadmin@example.test", パスワード: F0805_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [id],
  }));
});
