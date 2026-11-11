/**
 * M07-09 戻しリストPDF出力 の画面シード。正本: cases/M07-09_seed_data.tsv
 *
 * 作るシード: サプライ品だけで準備できるもの（棚番号・グッズ商品CSV登録・商品規格・会員登録・ネット買取の申込・買取状況・実在庫）。
 * カード商品（カード登録・カード詳細・略称タグ・色・レアリティ）を使うシードは作らない。
 * - ENV: ポップアップの許可は、Playwright のブラウザが標準で許可しているので何もしない。
 * - MASTER: 言語・状態・色・レアリティの並び順と略称タグは書き換えず、いまの値を読んで控える（カード商品のシードが確かめる）。
 * - CONFIG: 本店の高額商品閾値は書き換えず、いまの値を読んで控える（依頼者の方針 2026-11-10。カード商品のシードが 300/3000 を読み替える）。
 * 決め打ちの商品コード・商品名には実行ごとの印を付ける。注文者名は、ケースが検索欄へそのまま入れる正本の値のまま使い、前の実行の残りは先に一覧から削除する。
 */
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { Account } from "../lib/session";
import { 閾値を控える, マスタを控える } from "./m07-09-card";
import { 試験管理者を用意する } from "./m07-common";
import { 戻し買取, 戻しの試験データを作る } from "./m07-stock";
import { サプライ } from "../pages/admin/m07_supply";

export const M0709_ADMIN: Account = { loginId: "m0709_admin", password: "Passw0rd!M0709" };

defineSeed("S-M07-09-ENV", async () => { /* ポップアップはブラウザが標準で許可している */ });

defineSeed("S-M07-09-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0709_ADMIN, "M07-09試験管理者");
});

// CONFIG・MASTER は共有の設定・共有のマスタ。依頼者の方針（2026-11-10）で書き換えず、いまの値を画面で読んで控える（seeds/m07-09-card.ts）。
// サプライ品だけのケースは閾値・並びを使わないので、読んだ値が前提と合わなくても止めない（カード商品のシードが、要るものを確かめて止める）。
defineSeed("S-M07-09-CONFIG", async ({ browser, seed }) => {
  await 閾値を控える(browser, seed.シードID);
});

defineSeed("S-M07-09-MASTER", async ({ browser, seed }) => {
  await マスタを控える(browser, seed.シードID);
});

/** 商品の呼び名（印つき）。品の商品名は商品コードと同じ値 */
export const 品名 = (n: string, 枝: string): string => rc(`M0709-${n}-${枝}`);
const 品 = (n: string, 枝: string, 買取価格 = "1"): サプライ => ({ コード: 品名(n, 枝), 名前: 品名(n, 枝), 基準価格: "50", 買取価格 });

function 注文者名の(n: string): string { return `戻しPDF試験M0709-${n}`; }

/** 1件の買取（入庫待ち or 入庫済み）に実在庫1点 */
function 単一(seedId: string, n: string, label: string, 状況: string[], 実在庫の数 = "1"): void {
  defineSeed(seedId, { needs: ["S-M07-09-ENV", "S-M07-09-ADM", "S-M07-09-CONFIG", "S-M07-09-MASTER"] }, async ({ browser, notes }) => {
    const a = 品(n, "A");
    const [num] = await 戻しの試験データを作る(browser, seedId, {
      注文者名: 注文者名の(n), 棚: `M0709-${n}-S`, 品: [a],
      買取: [{ ラベル: label, 申込: { コード: a.コード }, 状況, 実在庫: [{ コード: a.コード, 数: 実在庫の数 }] }],
    });
    notes.set(label, num);
  });
}
単一("S-M07-09-LAUNCH-001", "001", "〔買取番号-M0709-001〕", ["入庫待ち"]);
単一("S-M07-09-STATUS-003", "003", "〔買取番号-M0709-003〕", ["入庫待ち", "入庫済み"]);
単一("S-M07-09-QTY-007", "007", "〔買取番号-M0709-007〕", ["入庫待ち"], "10");
単一("S-M07-09-SUPLANG-012", "012", "〔買取番号-M0709-012〕", ["入庫待ち"]);
単一("S-M07-09-DATETIME-014", "014", "〔買取番号-M0709-014〕", ["入庫待ち"]);
単一("S-M07-09-NOSELECT-035", "035", "〔買取番号-M0709-035〕", ["入庫待ち"]);

/** 2件の買取（A・B）。それぞれに実在庫1点 */
function 二件(seedId: string, n: string, la: string, lb: string, 状況A: string[], 状況B: string[]): void {
  defineSeed(seedId, { needs: ["S-M07-09-ENV", "S-M07-09-ADM", "S-M07-09-CONFIG", "S-M07-09-MASTER"] }, async ({ browser, notes }) => {
    const a = 品(n, "A"), b = 品(n, "B");
    const 買取: 戻し買取[] = [
      { ラベル: la, 申込: { コード: a.コード }, 状況: 状況A, 実在庫: [{ コード: a.コード, 数: "1" }] },
      { ラベル: lb, 申込: { コード: b.コード }, 状況: 状況B, 実在庫: [{ コード: b.コード, 数: "1" }] },
    ];
    const nums = await 戻しの試験データを作る(browser, seedId, { 注文者名: 注文者名の(n), 棚: `M0709-${n}-S`, 品: [a, b], 買取 });
    notes.set(la, nums[0]);
    notes.set(lb, nums[1]);
  });
}
二件("S-M07-09-SELECT-002", "002", "〔買取番号-M0709-002A〕", "〔買取番号-M0709-002B〕", ["入庫待ち"], ["入庫待ち"]);
二件("S-M07-09-ERROR-005", "005", "〔買取番号-M0709-005A〕", "〔買取番号-M0709-005B〕", ["入庫待ち"], ["入庫待ち", "キャンセル済み"]);
二件("S-M07-09-FLAG-006", "006", "〔買取番号-M0709-006A〕", "〔買取番号-M0709-006B〕", ["入庫待ち"], ["入庫待ち"]);
二件("S-M07-09-DP-MULTI-038", "038", "〔買取番号-M0709-038A〕", "〔買取番号-M0709-038B〕", ["入庫待ち"], ["入庫待ち", "入庫済み"]);

// 買取明細だけに商品D（数量9）を登録し、実在庫には登録しない（申込に使う商品がDで、実在庫はAだけ）
defineSeed("S-M07-09-STOCK-004", { needs: ["S-M07-09-ENV", "S-M07-09-ADM", "S-M07-09-CONFIG", "S-M07-09-MASTER"] }, async ({ browser, notes }) => {
  const a = 品("004", "A"), d = 品("004", "D");
  const [num] = await 戻しの試験データを作る(browser, "S-M07-09-STOCK-004", {
    注文者名: 注文者名の("004"), 棚: "M0709-004-S", 品: [a, d],
    買取: [{ ラベル: "〔買取番号-M0709-004〕", 申込: { コード: d.コード, 数量: "9" }, 状況: ["入庫待ち"], 実在庫: [{ コード: a.コード, 数: "1" }] }],
  });
  notes.set("〔買取番号-M0709-004〕", num);
});

// 039: サプライ品の商品名が「M0709-039-A[AAA]【JP/NM】赤M」（印は商品コード部分に付ける）
defineSeed("S-M07-09-DP-SUPNAME-039", { needs: ["S-M07-09-ENV", "S-M07-09-ADM", "S-M07-09-CONFIG", "S-M07-09-MASTER"] }, async ({ browser, notes }) => {
  const コード = 品名("039", "A");
  const a: サプライ = { コード, 名前: `${コード}[AAA]【JP/NM】赤M`, 基準価格: "50", 買取価格: "1" };
  const [num] = await 戻しの試験データを作る(browser, "S-M07-09-DP-SUPNAME-039", {
    注文者名: 注文者名の("039"), 棚: "M0709-039-S", 品: [a],
    買取: [{ ラベル: "〔買取番号-M0709-039〕", 申込: { コード }, 状況: ["入庫待ち"], 実在庫: [{ コード, 数: "1" }] }],
  });
  notes.set("〔買取番号-M0709-039〕", num);
});

// 036: この注文者名に一致する買取情報は登録しない（前の実行の残りがあれば一覧から削除する）
defineSeed("S-M07-09-ZEROHIT-036", { needs: ["S-M07-09-ENV", "S-M07-09-ADM", "S-M07-09-CONFIG", "S-M07-09-MASTER"] }, async ({ browser, seed }) => {
  await 戻しの試験データを作る(browser, seed.シードID, { 注文者名: 注文者名の("036"), 棚: "M0709-036-S", 品: [], 買取: [] });
});
