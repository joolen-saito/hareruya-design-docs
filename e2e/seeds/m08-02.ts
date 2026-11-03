/**
 * M08-02 メール一括送信の画面シード。正本: cases/M08-02_seed_data.tsv
 * - 会員: フロントの会員登録で作り、管理画面の会員一覧のメールアドレス検索で会員IDを控える。メールアドレスの前半には実行の印を付ける。
 *   3人組（001・012）は、正本どおり会員IDが A＜B＜C の順になるよう、この順に登録する。会員ID 999999は未登録であること（あれば開発用のデータの恐れがあるので消さずに止める）。
 * 作らないシード: 更新日時をDBで設定するもの（005〜009）、メール文字コード・店舗基本設定を書き換える環境（BASE-DEFAULT・BASE-ISO）、試験用メールサーバの受信設定（MAIL-CAPTURE）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { 会員を登録する } from "./m08-common";

export const M0802_ADMIN: Account = { loginId: "m0802_admin", password: "Passw0rd!M0802" };
defineSeed("S-M08-02-ADM", async ({ browser }) => { await ensureM08Admin(browser, "M08-02試験管理者", M0802_ADMIN); });

/** 会員ID 999999が未登録であること */
async function 未登録を確かめる(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const st = await new M08CustomerEditPage(page).open("999999");
    if (st === 200) throw new Error("会員ID 999999の会員がいる（開発用のデータの恐れがあるので消さずに止める）");
  });
}

/** 検索語（実行の印を含む）。会員検索一覧でこの語を検索すると、この組の会員だけが出る（会員のメールアドレスに含まれる） */
export const 検索語 = (k: string): string => rc(`m0802-${k}`);

const 姓名 = [
  { 姓: "青山", 名: "一郎", セイ: "アオヤマ", メイ: "イチロウ", 銀行: "customer100" },
  { 姓: "井上", 名: "二郎", セイ: "イノウエ", メイ: "ジロウ", 銀行: "customer200" },
  { 姓: "上田", 名: "三郎", セイ: "ウエダ", メイ: "サブロウ", 銀行: "customer300" },
] as const;

/** 3人組を A・B・C の順に登録する */
function 三人組(k: string, 名の後ろ: string) {
  return async ({ browser, notes }: { browser: Browser; notes: { set: (a: string, b: string) => void } }): Promise<void> => {
    for (let i = 0; i < 3; i++) {
      const p = 姓名[i];
      await 会員を登録する(browser, notes, `${p.銀行}-m0802-${k}`, { 姓: p.姓, 名: `${p.名}${名の後ろ}`, セイ: p.セイ, メイ: p.メイ }, `〔会員ID-M0802-${k}${"ABC"[i]}〕`);
    }
    await 未登録を確かめる(browser);
  };
}
defineSeed("S-M08-02-MEMBERS-001", 三人組("001", ""));
defineSeed("S-M08-02-MEMBERS-012", 三人組("012", "-012"));

function 一人(k: string, 名の後ろ: string) {
  defineSeed(`S-M08-02-MEMBERS-${k}`, async ({ browser, notes }) => {
    await 会員を登録する(browser, notes, `customer100-m0802-${k}`, { 姓: "青山", 名: `一郎${名の後ろ}`, セイ: "アオヤマ", メイ: "イチロウ" }, `〔会員ID-M0802-${k}〕`);
  });
}
一人("002", "-002");
一人("003", "-003");
一人("004", "");
