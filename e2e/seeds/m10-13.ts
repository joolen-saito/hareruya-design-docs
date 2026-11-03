/**
 * M10-13 カスタムCSV出力設定 のシード（IT-M10-13-001・002・003・005 が使うもの）。正本: cases/M10-13_seed_data.tsv
 * - 試験管理者: メンバー管理で登録（権限はシステム管理者）。
 * - CSV種別: マスタデータ管理でCSV種別のマスタを開き、ID 1・3・4・10・11・12 の6行があることを確かめる（無い行があれば空き行へ足す）。
 * - BASE-005: 商品CSVに、名称「既存商品CSV-005」（実行の印つき）・出力順「公開状態、商品コード」の定義を登録する。
 *   正本の出力項目名「CSV公開状態」「CSV商品コード」は、出力項目をDBで揃えるシード（FIELDS。DBでの準備なので作らない）が付ける名前で、
 *   手元の画面には無い。同じ位置づけの画面の項目「公開ステータス名称」「商品コード」で代えた（ケースは項目の名前を確かめない）。
 * 作らないシード: BASE-004（商品CSV・受注CSVの既存の定義を全部削除する手順で、手元の開発用の定義を消すことになる。判断待ち）。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { CustomCsvPage } from "../pages/admin/m10_13_custom_csv";
import { ensureAnalysisAdmin } from "./m12-common";
import { 保存する } from "../pages/admin/m11_05_master";

export const M1013_ADMIN: Account = { loginId: "m1013_admin", password: "Passw0rd!M1013" };

defineSeed("S-M10-13-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-13試験管理者", account: M1013_ADMIN, メール: "m1013_admin@example.test" });
});

defineSeed("S-M10-13-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl("/setting/system/masterdata"));
    await page.locator("#admin_system_masterdata_masterdata").selectOption({ label: "mtb_csv_type" });
    await page.locator("form#form1 button[type=submit]").click();
    await expect(page.locator("form#form2")).toBeVisible();
    const rows = page.locator("form#form2 tbody tr");
    const got = new Map<string, string>();
    for (let i = 0; i < (await rows.count()); i++) got.set(await rows.nth(i).locator('input[name$="[id]"]').inputValue(), await rows.nth(i).locator('input[name$="[name]"]').inputValue());
    const want: [string, string][] = [["1", "商品CSV"], ["3", "受注CSV"], ["4", "配送CSV"], ["10", "在庫CSV"], ["11", "在庫移動・振替CSV"], ["12", "在庫分割結合CSV"]];
    const missing = want.filter(([id]) => !got.has(id));
    for (const [id, name] of want) if (got.has(id) && got.get(id) !== name) reportSeedIssue(seed.シードID, `CSV種別のID ${id} の名称が「${got.get(id)}」（正本は「${name}」）`);
    if (missing.length) {
      for (const [id, name] of missing) {
        let blank = -1;
        for (let i = 0; i < (await rows.count()); i++) if ((await rows.nth(i).locator('input[name$="[id]"]').inputValue()) === "" && (await rows.nth(i).locator('input[name$="[name]"]').inputValue()) === "") { blank = i; break; }
        if (blank < 0) throw new Error("CSV種別のマスタに空の入力行が無い");
        await rows.nth(blank).locator('input[name$="[id]"]').fill(id);
        await rows.nth(blank).locator('input[name$="[name]"]').fill(name);
      }
      await 保存する(page, "CSV種別マスタへの追加");
    }
  });
});

defineSeed("S-M10-13-BASE-005", { needs: ["S-M10-13-ADM", "S-M10-13-MASTER"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new CustomCsvPage(page);
    await p.open("1");
    await p.定義を選ぶ("新規作成"); // 新規作成の状態（すでに選ばれていれば何もしない）
    await p.名前.fill(rc("既存商品CSV-005"));
    await p.項目を出力へ移す("公開ステータス名称");
    await p.項目を出力へ移す("商品コード");
    reportSeedIssue(seed.シードID, "出力順の項目は、正本の「CSV公開状態」「CSV商品コード」の代わりに、画面にある「公開ステータス名称」「商品コード」にした");
    notes.set("〔カスタム定義ID-M1013-005〕", await p.設定する("カスタム定義の登録"));
  });
});
