/** M03-02 商品登録編集。正本: cases/M03-02_test_cases.tsv（画面だけで準備できる 003・031・036） */
import { expect, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ErrorScreen, ProductEditForm, openAndReadErrorScreen } from "../../pages/admin/m03_02_product";
import { displayedProductId } from "../../pages/admin/product_edit";
import { M0302_ADMIN } from "../../seeds/m03-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 開いた画面の応答・見出し・文を注記に残す */
const noteErrorScreen = (r: ErrorScreen, what: string) =>
  note(`${what}: 応答 ${r.status}・画面の見出し「${r.見出し}」・文「${r.文}」・タイトル「${r.タイトル}」`);

caseTest("IT-M03-02-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M0302_ADMIN);
  let r: ErrorScreen | null = null;
  await step(1, async () => {
    r = await openAndReadErrorScreen(page, "/product/product/999999/edit");
  });
  await expected(async () => {
    noteErrorScreen(r!, "商品ID 999999 の商品編集画面");
    // 期待結果「HTTP404のPage Not Found画面が表示されること」
    expect.soft(r!.status, "応答の状態がHTTP404").toBe(404);
    await expect.soft(page.locator("body#error-page h3"), "Page Not Found の画面の見出し").toContainText("Page Not Found");
  });
});

caseTest("IT-M03-02-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M0302_ADMIN);
  let r: ErrorScreen | null = null;
  await step(1, async () => {
    r = await openAndReadErrorScreen(page, "/product/product/new");
  });
  await expected(async () => {
    noteErrorScreen(r!, "商品新規登録のアドレス");
    // 期待結果「HTTP404のPage Not Found画面が表示されること」
    expect.soft(r!.status, "応答の状態がHTTP404").toBe(404);
    await expect.soft(page.locator("body#error-page h3"), "Page Not Found の画面の見出し").toContainText("Page Not Found");
  });
});

caseTest("IT-M03-02-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0302_ADMIN);
  const id = notes.get("〔商品ID-M0302-共有D〕");
  const edit = new ProductEditForm(page);
  const 変更後の商品名 = "廃止後に変えようとした商品名-036";
  let 開いた画面の商品ID = "";
  let 開いた画面の商品名 = "";
  let 登録の要求 = 0;
  page.on("request", (req) => { if (req.method() === "POST" && req.url().includes(`/product/product/${id}/edit`)) 登録の要求 += 1; });

  await step(1, async () => {
    await edit.open(id);
    開いた画面の商品ID = await displayedProductId(page);
    開いた画面の商品名 = await edit.商品名.inputValue();
  });
  await step(2, async () => {
    // 商品名: 入力欄に新しい値を入れ、保存の手段（「商品を登録」ボタン）を探す。無ければ Enter で送信を試みる
    await expect(edit.商品名, "商品名の入力欄").toBeVisible();
    await edit.商品名.fill(変更後の商品名);
    const 登録ボタン = await edit.商品を登録.count();
    note(`商品名の入力欄に「${変更後の商品名}」を入れた。「商品を登録」ボタンの数: ${登録ボタン}`);
    if (登録ボタン > 0) {
      await Promise.all([page.waitForEvent("load"), edit.商品を登録.click()]);
    } else {
      await edit.商品名.press("Enter");
      await page.waitForTimeout(1500);
    }
    // 商品公開ステータス: 欄を探して「公開」を選ぼうとする
    const 欄 = await edit.商品公開ステータス.count();
    note(`商品公開ステータスの欄の数: ${欄}`);
    if (欄 > 0 && await edit.商品公開ステータス.first().isVisible()) {
      await edit.商品公開ステータスを選ぶ("公開");
      if (await edit.商品を登録.count() > 0) await Promise.all([page.waitForEvent("load"), edit.商品を登録.click()]);
    }
    note(`商品編集画面から送った保存の要求の数: ${登録の要求}`);
  });
  await expected(async () => {
    // 参照できる: 商品ID・商品名（変更前の値）が表示された
    expect.soft(開いた画面の商品ID, "商品編集画面に表示された商品ID").toBe(id);
    expect.soft(開いた画面の商品名, "商品編集画面に表示された商品名").toBe("廃止済み商品");
    // 変更できない: 商品公開ステータスの欄と「商品を登録」ボタンが無く、開き直すと商品名は元のまま
    await edit.open(id);
    await expect.soft(edit.商品を登録, "「商品を登録」ボタンが無い（商品情報を保存できない）").toHaveCount(0);
    await expect.soft(edit.商品公開ステータス, "商品公開ステータスの欄が無い（変更できない）").toHaveCount(0);
    expect.soft(await edit.商品名.inputValue(), "開き直した商品編集画面の商品名が変わっていない").toBe("廃止済み商品");
  });
});
