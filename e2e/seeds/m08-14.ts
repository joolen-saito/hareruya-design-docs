/**
 * M08-14 仮会員メール再送の画面シード。正本: cases/M08-14_seed_data.tsv
 * - 会員: フロントの会員登録で作る。仮会員は本登録のメールのURLを開かずに残す。メールアドレスの前半には実行の印を付ける。
 * - 本会員（ACTIVE-READ）: 登録後に本登録し、管理画面の会員編集で会員ステータス「本会員」を選んで登録する（正本の手順）。
 * 作らないシード: 本登録用シークレットなどをDBで設定するもの（PROVISIONAL-READ）、店舗基本設定・メールテンプレート・試験用メール受信環境（SHOP・TEMPLATE・MAILBOX）、環境（ENV。画面で確かめる）。
 */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { 管理画面で会員を整える, 会員を登録する } from "./m08-common";

export const M0814_ADMIN: Account = { loginId: "m0814_admin", password: "Passw0rd!M0814" };
defineSeed("S-M08-14-ENV", async () => { /* 環境。仮会員の登録が画面で通ることで確かめる */ });
defineSeed("S-M08-14-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-14試験管理者", M0814_ADMIN); });

const 共通 = { セイ: "ホントウロク", メイ: "タロウ", パスワード: "Passw0rd!M0814" };
defineSeed("S-M08-14-ACTIVE-READ", async ({ browser, notes }) => {
  const { 会員ID } = await 会員を登録する(browser, notes, "active-m0814", { 姓: "本登録", 名: "太郎", ...共通 }, "〔会員ID-M0814-共有本会員〕");
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    await edit.選ぶ("status", "本会員");
    await edit.登録する();
  });
});
