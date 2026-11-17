/**
 * A06-08 カード名検索（MTGBuyer の API）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 * 書いたのは 001・012 が使うシードだけ。
 * - S-A06-08-AUTH: 署名の鍵・送信元IPの許可は書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。
 * - S-A06-08-SHOPS: 店舗A・B は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店・試験支店に読み替えた（店舗は作らない）。
 * - S-A06-08-MASTERS: 言語 JP・状態 NM・レアリティ R は、マスタを書き換えず、試験用のカードと取込の値を使う（ケース 001・012 は値を確かめない）。
 * - S-A06-08-BASE: 状態ごとの規格の削除は、取込で状態NMの1規格だけを作るので行わない（消さない）。カードセット・プロモーション・略称タグの指定は入れていない。
 *   部門は、シード表が部門名を定めないので「A06-08部門」に決まった印を付けて部門登録画面で1度だけ登録し、使い回す（seeds/a06-buying.ts の 試験部門を用意する）。
 *   取込の部門IDの列に入れて商品規格に付け、〔部門ID-A0608-共有〕を控える（2026-11-17。控えていなかったので buildSeeds の確かめで落ちていた）。
 * - S-A06-08-NOTFOUND-012: 商品名が「A06-08不存在」で始まる商品は、数えるだけ（あれば止める。消さない）。
 */
import { 名前で始まる商品の数 } from "../db/a06";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 本店ID, 試験支店ID } from "../pages/admin/test_store";
import { カード商品を作る, 試験部門を用意する, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";

export const A0608_ADM_A = 買取の管理者の("a0608_admin_a", "Passw0rd!A0608A", "A0608管理者A");

defineSeed("S-A06-08-AUTH", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "署名の鍵・送信元IPの許可は書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。トークンは管理者のログイン API で受け取る");
});
defineSeed("S-A06-08-SHOPS", async ({ notes, seed }) => {
  notes.set("〔店舗ID-A0608-共有A〕", 本店ID);
  notes.set("〔店舗ID-A0608-共有B〕", 試験支店ID);
  reportSeedIssue(seed.シードID, "店舗A・B は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店（店舗ID 1）・試験支店（店舗ID 1574）に読み替えた");
});
defineSeed("S-A06-08-MASTERS", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "言語 JP・状態 NM・レアリティ R のマスタは書き換えず、既にある値を使う");
});
defineSeed("S-A06-08-ADM-A", { needs: ["S-A06-08-SHOPS"] }, async ({ browser, seed }) => {
  await 本店の管理者を用意する(browser, seed.シードID, A0608_ADM_A, "店舗A（店舗ID 608501）");
});
defineSeed("S-A06-08-BASE", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  // 部門を先に用意する（商品を作ってから控えの確かめで落ちて、残りが増えないように）
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-08部門");
  reportSeedIssue(seed.シードID, "シード表は部門名を定めないので「A06-08部門」（決まった印つき）とした");
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0608-BASE", 商品名日: "A06-08基本商品", 商品名英: "A06-08 Product", カード名日: "A06-08カード", カード名英: "A06-08 Card",
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: "a0608.jpg", 部門ID,
  });
  notes.set("〔部門ID-A0608-共有〕", 部門ID);
  for (const [k, v] of [["〔商品ID-A0608-共有〕", p.商品ID], ["〔商品規格ID-A0608-共有〕", p.規格ID], ["〔カードID-A0608-共有〕", p.カードID], ["〔カード詳細ID-A0608-共有〕", p.カード詳細ID]] as const) {
    if (v) notes.set(k, v);
  }
});
defineSeed("S-A06-08-NOTFOUND-012", async ({ seed }) => {
  const n = 名前で始まる商品の数("A06-08不存在");
  if (n !== 0) throw new Error(`${seed.シードID}: 商品名が「A06-08不存在」で始まる商品が ${n} 件ある（0件の前提を満たせない。消さない）`);
});
