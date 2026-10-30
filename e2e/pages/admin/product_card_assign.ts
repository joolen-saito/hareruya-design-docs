/** 商品登録編集の「カード指定 >」で、商品にカードを紐づけて「商品を登録」する。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { uploadProductImages } from "./f03_06_products";

export type CardAssignment = {
  productId: string;
  /** カード検索で入力するカード名（日本語） */
  cardNameJp: string;
  /** 選ぶカード詳細のID（カードCSVで指定した番号） */
  cardDetailId: string;
  /** シード表の「状態・属性」の商品名。カードを選んで書き換わったら、この値に入力し直す */
  productNameJp: string;
  productNameEn: string;
  /** 「商品を登録」の前に商品画像へ追加する画像ファイル（順に追加する。F03-06 が使う） */
  images?: { name: string; buffer: Buffer }[];
};

/**
 * 画面の流れ: 商品登録編集を開く → 「カード指定 >」 → カード検索でカード名を入れて「検索」 → 該当のカード詳細の「決定」
 * → 必須項目で未選択のもの（割引率など）に任意の値（先頭の選択肢）を選ぶ → 「商品を登録」。
 * 選んだ必須項目と、商品名の入力し直しは onIssue に渡す（報告に出す）。
 */
export async function assignCardOnProductEdit(page: Page, a: CardAssignment, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${a.productId}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  const open = page.locator('button[data-bs-target="#searchCardDetailModal"]');
  await expect(open, "「カード指定 >」ボタン").toHaveCount(1);
  await expect(open).toContainText("カード指定");
  await expect(open, "「カード指定 >」を押せる（カード未指定の商品）").toBeEnabled();
  await open.click();
  const modal = page.locator("#searchCardDetailModal");
  await expect(modal, "カード検索").toBeVisible();
  await modal.locator("#admin_search_card_detail_card_name").fill(a.cardNameJp);
  await modal.locator("#searchCardDetailModalButton").click();
  const row = modal.locator("#searchCardDetailModalList tbody tr")
    .filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^\\s*${a.cardDetailId}\\s*$`) }) });
  await expect(row, `カード検索の結果に、カード詳細ID ${a.cardDetailId} の「${a.cardNameJp}」がある`).toHaveCount(1);
  await row.getByRole("button", { name: "決定", exact: true }).click();
  await expect(modal, "カードを決定するとカード検索が閉じる").toBeHidden();
  await expect(form.locator("#admin_product_CardDetail"), "選んだカード詳細が商品に入る").toHaveValue(a.cardDetailId);

  const nameJp = form.locator('input[name="admin_product[name]"]');
  const nameEn = form.locator('input[name="admin_product[name_en]"]');
  for (const [field, want, label] of [[nameJp, a.productNameJp, "商品名(日)"], [nameEn, a.productNameEn, "商品名(英)"]] as const) {
    await expect(field, `${label}の欄`).toHaveCount(1);
    const now = await field.inputValue();
    if (now !== want) {
      onIssue(`カードを選ぶと${label}が「${now}」に書き換わったので、シード表の状態・属性の「${want}」に入力し直した`);
      await field.fill(want);
    }
  }

  if (a.images?.length) {
    const added = await uploadProductImages(page, a.images);
    if (added < a.images.length) onIssue(`商品画像の追加欄に画像ファイルを渡しても、サムネイルが増えず画像を追加できなかった（${added}/${a.images.length}件）。画像なしで登録した`);
  }

  // 必須（「必須」の印がある行）で未選択の選択欄に、先頭の選択肢を選ぶ。未入力の必須の入力欄は値を推測しない
  const requiredRows = form.locator(".row").filter({ has: page.locator(":scope > .col-3 .badge", { hasText: "必須" }) });
  for (const r of await requiredRows.all()) {
    const label = ((await r.locator(":scope > .col-3 span").first().textContent()) ?? "").trim();
    for (const select of await r.locator(":scope > .col select").all()) {
      if (await select.inputValue()) continue;
      const options = await select.locator("option").evaluateAll((nodes) => nodes
        .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" }))
        .filter((o) => o.value !== ""));
      if (options.length === 0) throw new Error(`必須の「${label}」に選べる値が無い`);
      await select.selectOption(options[0].value);
      onIssue(`必須で未選択の「${label}」に「${options[0].label}」を選んだ（正本: 任意の値）`);
    }
    // 選択肢を並べて表示する必須項目（地域制限など）は、どれも選ばれていなければ先頭を選ぶ
    const radios = r.locator(':scope > .col input[type="radio"]');
    if (await radios.count() > 0 && await r.locator(':scope > .col input[type="radio"]:checked').count() === 0) {
      const first = radios.first();
      const choice = (await first.evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "")) || await first.inputValue();
      await first.check();
      onIssue(`必須で未選択の「${label}」に「${choice}」を選んだ（正本: 任意の値）`);
    }
    for (const input of await r.locator(':scope > .col input[type="text"], :scope > .col input[type="number"], :scope > .col textarea').all()) {
      if (!(await input.isVisible())) continue;
      if (!(await input.inputValue())) throw new Error(`必須の「${label}」が未入力で、正本に値が無い`);
    }
  }

  await form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click();
  await page.waitForLoadState("domcontentloaded");
  // 入力エラーが出たら、どの項目かを報告に出す（項目の行の名前とエラーの文）
  // エラー要素ごとに、いちばん近い項目の行の名前と文を集める
  const errorDetails = await page.locator(".invalid-feedback, .form-error-message, .alert-danger").evaluateAll((nodes) => nodes
    // 画面には、画像エラー用の非表示のひな形が最初から置かれている。表示されているものだけを見る
    .filter((n) => (n as HTMLElement).offsetParent !== null && (n.textContent ?? "").trim() !== "")
    .map((n) => {
      const row = n.closest(".row");
      const label = row?.querySelector(":scope > .col-3 span")?.textContent?.trim() ?? "";
      const text = (n.textContent ?? "").replace(/\s+/g, " ").trim();
      return `${label || "（項目名なし）"}: ${text}`;
    })
    .filter((t) => !t.endsWith(": ") && !t.includes("デバッグモードが有効")));
  if (errorDetails.length)
    throw new Error(`商品ID ${a.productId} へのカード「${a.cardNameJp}」の指定: 「商品を登録」で入力エラー: ${errorDetails.join(" / ")}`);
  for (const warning of await expectSaved(page, `商品ID ${a.productId} へのカード「${a.cardNameJp}」の指定`)) onIssue(warning);
  // 保存後の画面は、紐づいたカードを表示名で出す（隠し欄の値の出し方は保存前と違う）
  await expect(page.locator("#admin_product_cardDetailId_name"), "保存後、紐づいたカードが表示される").toContainText(a.cardNameJp);
  await expect(nameJp, "保存後の商品名(日)").toHaveValue(a.productNameJp);
  await expect(nameEn, "保存後の商品名(英)").toHaveValue(a.productNameEn);
}
