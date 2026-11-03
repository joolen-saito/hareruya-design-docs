/**
 * M10-13 カスタムCSV出力設定 の削除系シード（IT-M10-13-016・017・019〜023）。正本: cases/M10-13_seed_data.tsv
 * 定義の名称「削除試験CSV-0NN」には実行の印を付ける。出力項目は、正本の「CSV商品コード」「CSV商品名」（出力項目をDBで揃えるシードが付ける名前で画面に無い）の代わりに、
 * 画面にある「商品コード」「商品名」にする（ケースは項目の名前を確かめない）。
 * 作らないシード: NOTFOUND の事前確認（999999 が未登録であること）は、ケースの手順そのものが確かめるので、ここでは何もしない。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { CustomCsvPage } from "../pages/admin/m10_13_custom_csv";
import "./m10-13";

export const 削除試験名 = (n: string) => rc(`削除試験CSV-${n}`);

defineSeed("S-M10-13-NOTFOUND", async () => {});
for (const n of ["016", "019", "020", "021", "022", "023"]) {
  defineSeed(`S-M10-13-DELETE-${n}`, { needs: ["S-M10-13-ADM", "S-M10-13-MASTER"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const p = new CustomCsvPage(page);
      await p.open("1");
      await p.定義を選ぶ("新規作成");
      await p.名前.fill(削除試験名(n));
      await p.項目を出力へ移す("商品コード");
      await p.項目を出力へ移す("商品名(日)");
      reportSeedIssue(seed.シードID, "出力項目は、正本の「CSV商品コード」「CSV商品名」の代わりに、画面にある「商品コード」「商品名(日)」にした");
      notes.set(`〔カスタム定義ID-M1013-${n}〕`, await p.設定する("カスタム定義の登録"));
    });
  });
}
