/**
 * M06（店頭買取管理）のシードが共通で使う操作。
 * - 店頭買取の申込は、フロントの店頭買取査定申込（会員登録なし）で行い、査定IDは管理画面の買取一覧の行から読む（正本の作り方）。
 * - 決め打ちの申込者名には実行ごとの印（run_marker）を付ける。同じDBで流し直しても、前の実行の申込と混ざらない。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { OtcListPage } from "../pages/admin/m06_otc_list";
import { M0424StoreInput } from "../pages/admin/m04_24_store";
import { applyAsGuest, 申込者 } from "../pages/front/m06_otc_buy";

const COMPANY = "株式会社晴れる屋";
const COMPANY_KANA = "カブシキガイシャハレルヤ";

/** 試験店舗の入力。会社名・住所などの「任意の有効な値」は固定の値にした（正本が値を決めていない） */
export function storeInput(店名: string, 店名カナ: string, 店名英語: string, 支店URL: string, 略称: string, 郵便番号 = "160-0023", 都道府県 = "東京都", 住所1 = "新宿区西新宿1-1-1", 住所2 = "晴ビル1F", 電話番号 = "03-1111-1111"): M0424StoreInput {
  return { 店名, 店名カナ, 店名英語, 支店URL, 店名略称3文字: 略称, ショップ名略称: 店名.slice(0, 8), 会社名: COMPANY, 会社名カナ: COMPANY_KANA, 郵便番号, 都道府県, 住所1, 住所2, 電話番号 };
}

/** 申込者（姓・名・フリガナ）。フリガナは正本の値（姓「カイトリシケン」など）を使う */
export function 申込者の(姓: string, 名: string, セイ: string, メイ: string): 申込者 {
  return { 姓, 名, セイ, メイ };
}

/** フロントで未ログインの新しいブラウザセッションを開き、申込を順に行う。完了画面の査定番号（申込の順）を返す */
export async function 申込を行う(browser: Browser, 支店URL: string, 申込: 申込者[]): Promise<string[]> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  const out: string[] = [];
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    for (const a of 申込) out.push(await applyAsGuest(page, 支店URL, a));
  } finally {
    await context.close();
  }
  return out;
}

/**
 * 管理画面の買取一覧で申込者名を検索し、一覧の査定IDを「登録の古い順」で返す
 * （一覧は新しい順なので、最も下の行から上へ読む。正本の作り方と同じ）。期待の件数と違えば止める。
 */
export async function 査定IDを読む(browser: Browser, 申込者名: string, 件数: number): Promise<string[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new OtcListPage(page);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.申込者名を入れる(申込者名);
    await list.検索する();
    await list.表示件数を最大にする();
    const rows = await list.行();
    expect(rows.length, `申込者名「${申込者名}」の買取の件数`).toBe(件数);
    return rows.map((r) => r.査定ID).reverse();
  });
}
