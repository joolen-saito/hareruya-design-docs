/**
 * M07-08 戻しリストCSV出力 の画面シード。正本: cases/M07-08_seed_data.tsv
 *
 * 作るシード: サプライ品だけで準備できるもの（棚番号・グッズ商品CSV登録・商品規格・会員・ネット買取の申込・買取状況・実在庫）。
 * - 会員は、正本は管理画面の会員登録だが、フロントの会員登録で作る（依頼者決定 2026-10-31）。
 * - MASTER（言語・状態・色・レアリティの並び順をDBへ直接設定するもの）を使うケースは実装していない。
 * - CONFIG: 本店の高額商品閾値を 100／500／未設定にする。共有の設定なので、書き換える前の値を控え、ケースが終わるたびに戻す（閾値を戻す）。
 * 決め打ちの商品コード・商品名には実行ごとの印を付ける。注文者名は、ケースが検索欄へそのまま入れる正本の値のまま使い、前の実行の残りは先に一覧から削除する。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 高額商品閾値 } from "../db/m07";
import { defineSeed } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { 閾値, 閾値を設定する, 閾値を読む } from "../pages/admin/m07_config";
import { サプライ } from "../pages/admin/m07_supply";
import { 試験管理者を用意する } from "./m07-common";
import { 戻し買取, 戻しの試験データを作る } from "./m07-stock";

export const M0708_ADMIN: Account = { loginId: "m0708_admin", password: "Passw0rd!M0708" };

defineSeed("S-M07-08-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0708_ADMIN, "M07-08試験管理者");
});

/** 書き換える前の値（共有の設定。ケースが終わるたびに戻す） */
let 前の閾値: 閾値 | null = null;

defineSeed("S-M07-08-CONFIG", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (!前の閾値) 前の閾値 = await 閾値を読む(page);
    await 閾値を設定する(page, ["100", "500", ""]);
  });
});

/** 控えた値へ戻し、戻った値をDBで確かめた結果を返す（戻せなかったときは文を返す） */
export async function 閾値を戻す(browser: Browser): Promise<string> {
  if (!前の閾値) return "";
  const 値 = 前の閾値;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 閾値を設定する(page, 値);
  });
  const now = 高額商品閾値().join("/");
  return now === 値.join("/") ? "" : `高額商品閾値を ${値.join("/")} に戻したが、DBの値は ${now}`;
}

const NEEDS = ["S-M07-08-ADM"];
const sup = (コード: string, 名前: string, 基準価格: string, 棚: string, 買取価格 = "1"): サプライ => ({ コード: rc(コード), 名前: rc(名前), 基準価格, 棚, 買取価格 });

/** 1件の買取（サプライ品の実在庫）を作る */
function 一件(seedId: string, 注文者: string, 品: サプライ, 数: string, 状況: string[], label: string, 申込数量?: string, needsConfig = false): void {
  defineSeed(seedId, { needs: needsConfig ? [...NEEDS, "S-M07-08-CONFIG"] : NEEDS }, async ({ browser, notes }) => {
    const [n] = await 戻しの試験データを作る(browser, seedId, {
      注文者名: 注文者, 棚: 品.棚 ?? "S01", 品: [品],
      買取: [{ ラベル: label, 申込: { コード: 品.コード, 数量: 申込数量 }, 状況, 実在庫: [{ コード: 品.コード, 数 }] }],
    });
    notes.set(label, n);
  });
}

export const カードスリーブ名 = (): string => rc("カードスリーブ");
export const スリーブ016名 = (): string => rc("戻しスリーブM0708-CB016");

一件("S-M07-08-BASIC-004", "戻しCSV基本試験-004", sup("M0708-SUP-004", "カードスリーブ", "50", "S01"), "3", ["入庫待ち"], "〔買取番号-M0708-004〕", "3", true);
一件("S-M07-08-BASIC-007", "戻しCSV基本試験-007", sup("M0708-NOSEL-007", "M0708-NOSEL-007", "50", "S01"), "1", ["入庫待ち"], "〔買取番号-M0708-007〕");
一件("S-M07-08-BASIC-008", "戻しCSV基本試験-008", sup("M0708-INVALID-BASE-008", "M0708-INVALID-BASE-008", "50", "S01"), "1", ["入庫待ち"], "〔買取番号-M0708-008〕");
一件("S-M07-08-CBSUPPLY-016", "戻しリスト組合せ試験-M0708-CB016", sup("M0708-CB016-A", "戻しスリーブM0708-CB016", "50", "S01", "30"), "3", ["入庫待ち", "入庫済み"], "〔買取番号-M0708-CB016〕", "3", true);

/** 2件の買取（A・B）を作る */
function 二件(seedId: string, 注文者: string, a: サプライ, b: サプライ, 状況A: string[], 状況B: string[], la: string, lb: string, needsConfig = false): void {
  defineSeed(seedId, { needs: needsConfig ? [...NEEDS, "S-M07-08-CONFIG"] : NEEDS }, async ({ browser, notes }) => {
    const 買取: 戻し買取[] = [
      { ラベル: la, 申込: { コード: a.コード }, 状況: 状況A, 実在庫: [{ コード: a.コード, 数: "1" }] },
      { ラベル: lb, 申込: { コード: b.コード }, 状況: 状況B, 実在庫: [{ コード: b.コード, 数: "1" }] },
    ];
    const nums = await 戻しの試験データを作る(browser, seedId, { 注文者名: 注文者, 棚: "S01", 品: [a, b], 買取 });
    notes.set(la, nums[0]);
    notes.set(lb, nums[1]);
  });
}
二件("S-M07-08-BASIC-006", "戻しCSV基本試験-006", sup("M0708-FLAG-A-006", "M0708-FLAG-A-006", "50", "S01"), sup("M0708-FLAG-B-006", "M0708-FLAG-B-006", "60", "S02"), ["入庫待ち"], ["入庫待ち", "入庫済み"], "〔買取番号-M0708-006A〕", "〔買取番号-M0708-006B〕", true);
二件("S-M07-08-BASIC-009", "戻しCSV基本試験-009", sup("M0708-PART-A-009", "M0708-PART-A-009", "50", "S01"), sup("M0708-PART-B-009", "M0708-PART-B-009", "60", "S02"), ["入庫待ち"], ["入庫待ち", "入庫済み"], "〔買取番号-M0708-009A〕", "〔買取番号-M0708-009B〕");
二件("S-M07-08-CBMIXED-019", "戻しリスト組合せ試験-M0708-CB019", sup("M0708-CB019-A", "戻しスリーブM0708-CB019-A", "50", "S01", "30"), sup("M0708-CB019-B", "戻しスリーブM0708-CB019-B", "60", "S01", "30"), ["入庫待ち"], ["入庫待ち", "キャンセル済み"], "〔買取番号-M0708-CB019A〕", "〔買取番号-M0708-CB019B〕");
