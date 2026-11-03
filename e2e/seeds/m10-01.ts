/**
 * M10-01 店舗基本設定 のシード。正本: cases/M10-01_seed_data.tsv
 * - 店舗基本設定は共有の設定（店舗ID 1）。各シードが書き換える前に全項目の値を控え、ケースが終わったら 戻す() で画面から元へ戻す。
 * - シードの書き込みは、全権限のセットアップ用管理者で行う（正本は試験管理者で行うと書くが、画面の操作は同じ）。
 * - 正本の値のうち、画面に入力欄が無い「経度」「緯度」は入れられない（シードの問題として注記に残す）。
 * 作らないシード: DEFAULT-049・050（DBを作り直して初期状態にする手順。DBの作り直しはしない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ShopBasicPage, 七つのトグル, 元の値を控える, 控えを読む, 控えがある } from "../pages/admin/m10_01_shop";
import { 店舗基本情報を読む } from "../db/m10_01_shop";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1001_ADMIN: Account = { loginId: "m1001_admin", password: "Passw0rd!M1001" };
export const M1001L_ADMIN: Account = { loginId: "m1001l_admin", password: "Passw0rd!M1001L" };

defineSeed("S-M10-01-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-01試験管理者", account: M1001_ADMIN, メール: "m1001_admin@example.test" });
});
defineSeed("S-M10-01-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-01連携試験管理者", account: M1001L_ADMIN, メール: "m1001l_admin@example.test" });
});
// 入力値の取り決め（投入不要）
defineSeed("S-M10-01-BASE-VALUE", async () => {});
defineSeed("S-M10-01-ENABLED-VALUE", async () => {});
// 本店の公開設定は手元の環境で済んでいる。ケースが本店のログイン画面を開いて確かめる
defineSeed("S-M10-01-L-ENV", async () => {});

const 任意項目 = ["会社名", "会社名(フリガナ)", "店名(フリガナ)", "店名(英語表記)", "郵便番号", "市区町村名", "番地・ビル名", "住所(英語表記)", "電話番号", "FAX番号", "店舗営業時間",
  "取扱商品", "メッセージ", "X公式アカウントURL", "ショップ名略称(英語表記)", "スマレジ店舗ID", "スマレジ店舗コード", "送料無料条件(金額)", "送料無料条件(数量)"];

type 値 = Record<string, string>;
const 保存済み = (コード: string): 値 => ({
  会社名: "保存済み会社", "会社名(フリガナ)": "ホゾンズミガイシャ", 店名: "保存済み店舗", "店名(フリガナ)": "ホゾンズミテンポ", "店名(英語表記)": "SavedShop",
  郵便番号: "123-4567", 都道府県: "東京都", 市区町村名: "千代田区", "番地・ビル名": "丸の内1-1", "住所(英語表記)": "SavedAddress",
  電話番号: "03-1234-5678", FAX番号: "03-2345-6789", 店舗営業時間: "10:00-20:00",
  送信元メールアドレス: "from-old@example.com", 返信先メールアドレス: "reply-old@example.com", 送信エラー通知メールアドレス: "error-old@example.com", 問い合わせ専用メールアドレス: "contact-old@example.com",
  取扱商品: "保存済み商品", メッセージ: "保存済みメッセージ", "ショップ名略称(英語表記)": "Saved", スマレジ店舗ID: "100", スマレジ店舗コード: コード,
  "送料無料条件(金額)": "5000", "送料無料条件(数量)": "10",
});

async function 書く(browser: Browser, seedId: string, 値: 値, トグル: boolean, 空にする: string[] = []): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 元の値を控える(page);
    const p = new ShopBasicPage(page);
    await p.open();
    for (const k of 空にする) await p.入れる(k, "");
    for (const [k, v] of Object.entries(値)) await p.入れる(k, v);
    for (const t of 七つのトグル) await p.トグルを(t, トグル);
    await p.押して保存を確かめる(`${seedId} 店舗基本設定の保存`);
  });
  reportSeedIssue(seedId, "経度・緯度は画面に入力欄が無いので入れていない");
}

const pad = (n: string) => `SHOP01${n}`;
for (const n of ["001", "002", "003", "004", "007", "008", "010", "012", "014", "016", "019", "023", "026", "027", "030", "032", "035", "039", "043"]) {
  defineSeed(`S-M10-01-BASE-${n}`, async ({ browser, seed }) => { await 書く(browser, seed.シードID, 保存済み(pad(n)), false); });
}
for (const n of ["051", "052", "053", "054"]) {
  defineSeed(`S-M10-01-TOKEN-${n}`, async ({ browser, seed }) => { await 書く(browser, seed.シードID, 保存済み(pad(n)), false); });
}
for (const n of ["046", "047", "048"]) {
  defineSeed(`S-M10-01-XURL-${n}`, async ({ browser, seed }) => {
    await 書く(browser, seed.シードID, { ...保存済み(pad(n)), X公式アカウントURL: `https://x.com/m1001-${n}-saved` }, false);
  });
}
for (const n of ["040", "041"]) {
  defineSeed(`S-M10-01-ENABLED-${n}`, async ({ browser, seed }) => {
    await 書く(browser, seed.シードID, {
      店名: "有効設定店舗", 送信元メールアドレス: "from-enabled@example.com", 返信先メールアドレス: "reply-enabled@example.com",
      送信エラー通知メールアドレス: "error-enabled@example.com", 問い合わせ専用メールアドレス: "contact-enabled@example.com",
    }, true, 任意項目);
  });
}

// 連携ケース（自動ログイン機能の有効・無効と本店のログイン画面）
const 連携の値: 値 = {
  店名: "M10-01連携試験店", 送信元メールアドレス: "m1001l-shop@example.test", 返信先メールアドレス: "m1001l-shop@example.test",
  送信エラー通知メールアドレス: "m1001l-shop@example.test", 問い合わせ専用メールアドレス: "m1001l-shop@example.test",
};
defineSeed("S-M10-01-L-SHOP", async () => {}); // 値は L-BASE が入れる（自動ログイン機能の設定が各ケースで違うため）
for (const [n, 有効] of [["044", false], ["045", true]] as const) {
  defineSeed(`S-M10-01-L-BASE-${n}`, { needs: ["S-M10-01-L-SHOP"] }, async ({ browser, seed }) => {
    await 書く(browser, seed.シードID, 連携の値, false, 任意項目);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const p = new ShopBasicPage(page);
      await p.open();
      await p.トグルを("自動ログイン", 有効);
      await p.押して保存を確かめる(`${seed.シードID} 自動ログイン機能の設定`);
    });
  });
}

/** 控えた元の値へ画面から戻し、戻ったことを画面とDBで確かめた結果を返す（戻せなかったときは文を返す） */
export async function 戻す(browser: Browser): Promise<string> {
  if (!控えがある()) return "";
  const 元 = 控えを読む();
  let 結果 = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ShopBasicPage(page);
    await p.open();
    await p.全部書く(元);
    await p.押して保存を確かめる("店舗基本設定を元の値へ戻す");
    await p.open();
    const 今 = await p.全部読む();
    const 違い = Object.keys(元).filter((k) => 元[k] !== 今[k]);
    if (違い.length) 結果 = `戻したあとの画面の値が元と違う項目: ${違い.join("、")}`;
  });
  const db = 店舗基本情報を読む();
  if (!結果 && (db["店名"] ?? "") !== String(元["shop_master[shop_name]"])) 結果 = `戻したあとのDBの店名が元と違う: ${db["店名"]}`;
  return 結果;
}
