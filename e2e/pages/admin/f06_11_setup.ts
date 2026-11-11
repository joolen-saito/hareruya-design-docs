/**
 * F06-11 買取履歴一覧のシードが使う管理画面の操作（参照と、店頭買取のステータスの読み取り）。セレクタはここだけに書く。
 *
 * - 表示件数のマスタ: マスタデータ管理で表示件数のマスタを選んで「選択」を押し、行（ID・名称）を読むだけ（書き換えない。共有の設定のため）。
 *   画面の作り（M03-01 の部品 m03_01_page_count.ts と同じ画面）。
 * - 店頭買取の買取一覧: 申込者名・買取店舗で検索し、1件の行のステータスを読む（M06-01 の部品を使う）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OtcListPage } from "./m06_otc_list";

export type マスタの行 = { ID: string; 名称: string };

/** マスタデータ管理で表示件数のマスタを開き、空でない行（ID・名称）を上から読む */
export async function 表示件数のマスタを読む(page: Page): Promise<マスタの行[]> {
  await page.goto(adminUrl("/setting/system/masterdata"), { timeout: 60_000 });
  const master = page.locator("#admin_system_masterdata_masterdata");
  await expect(master.locator("option", { hasText: "mtb_page_max" }), "マスタデータ管理に表示件数のマスタがある").toHaveCount(1, { timeout: 30_000 });
  await master.selectOption({ label: "mtb_page_max" });
  await page.locator("form#form1 button[type=submit]").click();
  await expect(page.locator("form#form2"), "表示件数のマスタの行の表").toBeVisible({ timeout: 30_000 });
  const out: マスタの行[] = [];
  for (const tr of await page.locator("form#form2 tbody tr").all()) {
    const ID = (await tr.locator('input[name$="[id]"]').inputValue()).trim();
    const 名称 = (await tr.locator('input[name$="[name]"]').inputValue()).trim();
    if (ID || 名称) out.push({ ID, 名称 });
  }
  return out;
}

/** 店頭買取の買取一覧で申込者名・買取店舗を検索し、1件の行のステータスを返す（登録直後は検索に出るまで遅れることがあるので数回検索し直す） */
export async function 店頭買取のステータスを読む(page: Page, 申込者名: string, 店名: string): Promise<string> {
  const list = new OtcListPage(page);
  let last = "";
  for (let i = 0; i < 6; i++) {
    if (i > 0) await page.waitForTimeout(5_000);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ(店名);
    await list.申込者名を入れる(申込者名);
    await list.検索する();
    const rows = (await list.結果の表().count()) === 0 ? [] : await list.行();
    if (rows.length === 1) return rows[0].ステータス;
    last = JSON.stringify(rows);
    if (rows.length > 1) break;
  }
  throw new Error(`買取一覧で申込者名「${申込者名}」（買取店舗「${店名}」）の買取が1件にならない（${last}）`);
}
