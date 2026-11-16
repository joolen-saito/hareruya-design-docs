/**
 * M10-05 送料無料条件 の画面シード。正本: cases/M10-05_seed_data.tsv
 *
 * ≪共有の設定を書き換える≫ 本店（店舗ID 1）の店舗基本設定を書き換える（店名・住所・各メールアドレス・送料無料条件・7つのスイッチなど）。
 *   書き換える前に画面の全項目の値を控え、lib/shared_restore.ts の registerRestore に登録する。ケースの終わり（成否によらず）に
 *   基盤が画面から控えた全項目の値へ戻し、戻したあとの画面の全項目が控えと同じことを確かめる。
 *   書き換えている時間を短くするため、会員・商品・在庫・カートを先に作ってから、最後に店舗基本設定を書き換える（SHOP のシードは CASE のシードに依存させる）。
 * 作るシード: ADM、L-CASE-001〜005、L-SHOP-001〜005（保存済みの店舗基本情報）、CBCART-015〜019（会員・商品・カート・店舗基本設定）。
 * 作らないシード: CBORD-006〜014（受注の送料。宅配便の都道府県別の送料表を47都道府県ぶん作り直す必要があり、共有の配送方法を元の行のとおりには戻せないため見送り）。
 *
 * シードでの解釈:
 * - 経度・緯度は画面に入力欄が無いので入れない。
 * - 店名(英語表記)は半角英字とスペースだけが入力できるので、数字入りの値は使わず「Saved Shop」にする（ケースは確かめない）。
 * - 会員Aのパスワードは正本が「任意の有効な値」とするケースは「Passw0rd-M1005L-<番号>」、組合せは正本の「Passw0rd-CBM1005<番号>」。
 * - 会員・商品のメールアドレス・商品コードには実行の印を付ける。商品名は商品コードと同じ値。
 * - スマレジ店舗コードは、アプリが10文字以下（半角英数字）しか保存しない。正本の組合せの値「SHOP105CB0nn」は12文字で保存できないので、
 *   「SHOP5CB0nn」（10文字）にする（ケースはスマレジ店舗コードを確かめない）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, hideDebugToolbar } from "../lib/session";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { 本店の基本設定を控えて書き換える } from "./shop-restore";
import { カートに入れる } from "../pages/front/f04_shopping";
import { ensureAnalysisAdmin } from "./m12-common";
import { markedMail, 本会員を作る } from "./f06-member";

export const M1005L_ADMIN: Account = { loginId: "m1005ladmin", password: "Passw0rd!M1005L" };

defineSeed("S-M10-05-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-05連携試験管理者", account: M1005L_ADMIN, メール: "m1005ladmin@example.test" });
});

// ---- 本店の店舗基本設定（共有の設定。書き換える前に控え、基盤が終わりに戻す） ----
type 値 = Record<string, string>;
const 保存済み = (店名: string, コード: string, 金額: string, 数量: string): 値 => ({
  会社名: "保存済み会社", "会社名(フリガナ)": "ホゾンズミガイシャ", 店名, "店名(フリガナ)": "ホゾンズミテンポ", "店名(英語表記)": "Saved Shop",
  郵便番号: "123-4567", 都道府県: "東京都", 市区町村名: "千代田区", "番地・ビル名": "丸の内1-1", "住所(英語表記)": "SavedAddress",
  電話番号: "03-1234-5678", FAX番号: "03-2345-6789", 店舗営業時間: "10:00-20:00",
  送信元メールアドレス: "from-old@example.com", 返信先メールアドレス: "reply-old@example.com", 送信エラー通知メールアドレス: "error-old@example.com", 問い合わせ専用メールアドレス: "contact-old@example.com",
  取扱商品: "保存済み商品", メッセージ: "保存済みメッセージ", "ショップ名略称(英語表記)": "Saved", スマレジ店舗ID: "100", スマレジ店舗コード: コード,
  "送料無料条件(金額)": 金額, "送料無料条件(数量)": 数量,
});

/** 本店の店舗基本設定を正本の値にする（トグルはすべて無効）。書き換える前に全項目を控えて、戻す手続きを基盤へ登録する */
export async function 本店の基本設定を書き換える(browser: Browser, seedId: string, v: 値): Promise<void> {
  await 本店の基本設定を控えて書き換える(browser, seedId, v, false);
}

// ---- 会員・商品・在庫・カート ----
export type 会員 = { メール: string; パスワード: string };
const 作った = new Map<string, 会員>();
export function 会員の(番号: string): 会員 {
  const m = 作った.get(番号);
  if (!m) throw new Error(`M10-05 の ${番号} の会員をまだ作っていない`);
  return m;
}

async function 会員と商品とカートを作る(browser: Browser, seedId: string, a: { 番号: string; 前半: string; パスワード: string; 商品コード: string; 数量: number }): Promise<{ 会員ID: string; 商品ID: string }> {
  const 会員ID = await 本会員を作る(browser, { 姓: "M1005試験", 名: a.番号, セイ: "シケン", メイ: "カイイン", 前半: a.前半, パスワード: a.パスワード });
  const [商品] = await 商品を作って入庫する(browser, seedId, [{
    商品コード: rc(a.商品コード), 商品名: rc(a.商品コード), 価格: "1000", 入庫数: 10, 入庫方法: "在庫編集", 在庫変動理由: "結合テスト用", CSVの値: { 販売制限数: "10" },
  }], () => undefined);
  const m: 会員 = { メール: markedMail(a.前半), パスワード: a.パスワード };
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    await frontLogin(page, m);
    await カートに入れる(page, "", 商品.productId, a.数量, `${seedId}: 本店の商品Aをカートへ`);
  } finally { await ctx.close(); }
  作った.set(a.番号, m);
  return { 会員ID, 商品ID: 商品.productId };
}

// 連携ケース 001〜005（店舗基本情報は SHOP のシード、会員・商品・カートは CASE のシード）
const 連携の数量: Record<string, number> = { "001": 4, "002": 4, "003": 3, "004": 4, "005": 4 };
const 連携の保存値: Record<string, [string, string]> = { "001": ["5000", ""], "002": ["3000", ""], "003": ["100000", "10"], "004": ["5000", "10"], "005": ["10000", ""] };
for (const n of Object.keys(連携の数量)) {
  defineSeed(`S-M10-05-L-CASE-${n}`, async ({ browser, seed, notes }) => {
    const x = await 会員と商品とカートを作る(browser, seed.シードID, {
      番号: n, 前半: `m1005l-${n}`, パスワード: `Passw0rd-M1005L-${n}`, 商品コード: `M1005L-A-${n}`, 数量: 連携の数量[n],
    });
    notes.set(`〔会員ID-M1005-${n}〕`, x.会員ID);
    notes.set(`〔商品ID-M1005-${n}〕`, x.商品ID);
  });
  defineSeed(`S-M10-05-L-SHOP-${n}`, { needs: [`S-M10-05-L-CASE-${n}`] }, async ({ browser, seed }) => {
    const [金額, 数量] = 連携の保存値[n];
    await 本店の基本設定を書き換える(browser, seed.シードID, 保存済み(`保存済み店舗${n}`, `SHOP105${n}`, 金額, 数量));
  });
}

// 組合せ（買い物かご）015〜019
const 組合せ: Record<string, [string, string]> = { "015": ["", "10"], "016": ["", "3"], "017": ["10000", "10"], "018": ["3000", "10"], "019": ["3000", "3"] };
for (const [n, [金額, 数量]] of Object.entries(組合せ)) {
  const 種類 = { "015": "CBCART-015", "016": "CBCART-016", "017": "CBCART-017", "018": "CBCART-018", "019": "CBCART-019" }[n]!;
  defineSeed(`S-M10-05-${種類}`, async ({ browser, seed, notes }) => {
    const x = await 会員と商品とカートを作る(browser, seed.シードID, {
      番号: n, 前半: `cbm1005-${n}`, パスワード: `Passw0rd-CBM1005${n}`, 商品コード: `M1005CB-A-${n}`, 数量: 4,
    });
    notes.set(`〔会員ID-M1005-${n}〕`, x.会員ID);
    notes.set(`〔商品ID-M1005-${n}〕`, x.商品ID);
    await 本店の基本設定を書き換える(browser, seed.シードID, 保存済み(`組合せ店舗${n}`, `SHOP5CB${n}`, 金額, 数量));
  });
}
