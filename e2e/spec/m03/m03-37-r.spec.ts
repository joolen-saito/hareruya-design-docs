/**
 * M03-37 略称タグ更新CSV（追加分: 024）。正本: cases/M03-37_test_cases.tsv
 * 正本の「取込履歴は0件」は、開発環境の履歴をほかの方のぶんまで消さない決まりなので、DBで記録した件数が、取込の前後で増えないことで確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 略称タグ更新の取込履歴の件数, 略称タグ更新の同名の取込履歴の件数 } from "../../db/m03_37_short_tag_update";
import { 商品IDの件数 } from "../../db/m03_37_r";
import { ShortTagUpdateCsvPage } from "../../pages/admin/m03_37_short_tag_update_csv";
import { M0337_ADMIN, m0337File } from "../../seeds/m03-37";
import "../../seeds/m03-37-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-M03-37-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M0337_ADMIN);
  const u = new ShortTagUpdateCsvPage(page);
  const ファイル名 = "m0337_missing_product-024.csv";
  expect(商品IDの件数("999999024"), "商品ID 999999024 の商品が無い").toBe(0);
  let 前 = -1, 後 = -1, 同名前 = -1, 同名後 = -1;
  await step(1, async () => { await u.openFromMenu(); });
  await step(2, async () => { 前 = 略称タグ更新の取込履歴の件数(); 同名前 = 略称タグ更新の同名の取込履歴の件数(ファイル名); note(`取込前の略称タグ更新の取込履歴: 全体 ${前} 件・${ファイル名} ${同名前} 件`); });
  await step(3, async () => {
    const f = m0337File(ファイル名);
    await u.choose(f);
    const r = await u.pressUpload();
    note(`${ファイル名} を選んでアップロードを押した結果: ${r.sent ? `送った（応答 ${r.応答}）` : "ブラウザの入力チェックで止まった"}`);
    if (!r.sent) throw new Error(`${ファイル名}: ブラウザの入力チェックで送信が止まった`);
  });
  await step(4, async () => { 後 = 略称タグ更新の取込履歴の件数(); 同名後 = 略称タグ更新の同名の取込履歴の件数(ファイル名); note(`取込後の略称タグ更新の取込履歴: 全体 ${後} 件・${ファイル名} ${同名後} 件`); });
  await expected(async () => {
    supplement("正本の「取込履歴は0件」の前提は、開発環境の取込履歴を消さずに、取込の前後の件数が同じであること（ファイル名が同じ履歴も増えない）で確かめた");
    expect.soft(後, "取込履歴が追加されない（全体の件数が取込前と同じ）").toBe(前);
    expect.soft(同名後, `${ファイル名} の取込履歴が追加されない`).toBe(同名前);
  });
});
