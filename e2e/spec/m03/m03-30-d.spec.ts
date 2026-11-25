/**
 * M03-30 基準価格変更CSV登録（その2）。正本: cases/M03-30_test_cases.tsv
 * 実装したのは 025（引用符外の改行が5010個のファイルのアップロード）。
 * 正本の「CSVファイルのアップロードボタン」は、画面の「CSVファイルをアップロード」ボタン。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { PriceCsvUploadPage, priceCsvUploadPath, SubmitResult, 画面上部のメッセージ, 画面の見出し } from "../../pages/admin/m03_30_price_csv";
import { M0330_ADMIN, m0330FilePath } from "../../seeds/m03-30";
import "../../seeds/m03-30-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<PriceCsvUploadPage> {
  await loginAdmin(page, M0330_ADMIN);
  return new PriceCsvUploadPage(page, "基準価格変更");
}

caseTest("IT-M03-30-025", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(m0330FilePath("025", "rows_5010-025.tsv")); });
  await step(3, async () => {
    r = await upload.submit();
    if (!r.sent) note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（${r.止めた項目.join(" / ")}）`);
    else {
      note(`取込の要求の応答: ${r.status}。移った画面: ${new URL(page.url()).pathname}`);
      const m = await 画面上部のメッセージ(page);
      note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」/ エラー「${m.エラー.join("」「") || "なし"}」/ 警告「${m.警告.join("」「") || "なし"}」`);
    }
  });
  await expected(async () => {
    expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
    expect.soft(new URL(page.url()).pathname, "送信のあとの画面がセール用価格変更CSVアップロード画面").toBe(priceCsvUploadPath("セール用価格変更"));
    await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(new RegExp(`^\\s*${画面の見出し("セール用価格変更")}\\s*$`));
  });
});
