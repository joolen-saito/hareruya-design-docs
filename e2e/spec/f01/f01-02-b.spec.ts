/** F01-02 支店ECTOP（SALE中の商品）。正本: cases/F01-02_test_cases.tsv */
import { CaseBody, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";

/** 支店ECTOPのSALE中の商品に、見えるはずの商品が出て、見えないはずの商品が出ないことを確かめる */
function SALE(n: string, 出る: string[], 出ない: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    let 区画 = -1;
    const 表示: Record<string, number> = {};
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      区画 = await top.SALE中.count();
      for (const name of [...出る, ...出ない]) 表示[name] = await top.SALE中.getByText(rc(name), { exact: false }).count();
    });
    await expected(async () => {
      if (出る.length) expect.soft(区画, "SALE中の商品の区画の数（1つ）").toBe(1);
      for (const name of 出る) expect.soft(表示[name] > 0, `「${name}」の表示`).toBe(true);
      for (const name of 出ない) expect.soft(表示[name], `「${name}」の表示数`).toBe(0);
    });
  };
}
caseTest("IT-F01-02-011", SALE("011", ["セール基準商品-011"], []));
caseTest("IT-F01-02-012", SALE("012", [], ["セール非公開商品-012"]));
caseTest("IT-F01-02-013", SALE("013", [], ["セール廃止商品-013"]));
caseTest("IT-F01-02-014", SALE("014", [], ["セール在庫なし商品-014"]));
caseTest("IT-F01-02-015", SALE("015", [], ["セールタグなし商品-015"]));
caseTest("IT-F01-02-016", SALE("016", [], ["セールフラグOFF商品-016"]));
caseTest("IT-F01-02-017", SALE("017", ["セール価格1円商品-017"], ["セール価格0円商品-017"]));
