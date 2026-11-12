/**
 * M03-04 グッズ商品CSV出力の続き（-x）の画面操作。セレクタはここ（と既存の m03_04_goods_csv_export.ts・product_search.ts）だけに書く。
 * 商品一覧の検索（商品名・状態・表示件数）、一覧の商品の選択、「グッズ商品CSV出力」の押下とダウンロードの受け取り、
 * 開発者ツールで行う送信項目の書き換え（選択済み商品IDを足す・変える）、別の画面からの送信。
 */
import { Download, expect, Page } from "@playwright/test";
import { goodsCsvExportButton, topErrors } from "./m03_04_goods_csv_export";
import { ProductSearchPage } from "./product_search";

export type 出力の結果 = {
  /** ダウンロードされたファイル（無ければ null） */
  ファイル: { 名前: string; 中身: Buffer } | null;
  /** 出力の要求への応答の状態と型（応答が無ければ 0・空） */
  状態: number; 型: string;
  /** 押したあとの画面のアドレスと上部の誤り */
  移った先: string; 誤り: string[];
};

async function 中身(d: Download): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of await d.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

/** 商品一覧で商品名（と状態）を入れて検索する。件数を渡すと、検索結果の表示件数をその件数にする */
export async function 商品名で検索する(page: Page, 商品名: string, opt: { 状態?: string[]; 件数?: string } = {}): Promise<void> {
  const s = new ProductSearchPage(page);
  await s.open();
  await s.field("product_name").fill(商品名);
  if (opt.状態?.length) {
    await s.ensureDetailVisible();
    const choices = await s.choiceOptions("card_condition");
    for (const name of opt.状態) {
      // 開発環境の商品一覧の状態の選択肢は略称（NM・SP・MP など）で出る（2026-11-12）。正式名で渡されたら略称でも探す
      const 略称 = ({ ニアミント: "NM", スライトリープレイド: "SP", モデレトリープレイド: "MP", ヘビリープレイド: "HP" } as Record<string, string>)[name];
      const hit = choices.filter((c) => c.label === name || c.label.startsWith(name) || (略称 !== undefined && c.label.trim() === 略称));
      if (hit.length !== 1) throw new Error(`状態の選択肢「${name}」が1件でない（${choices.map((c) => c.label).join("、")}）`);
      await s.setChecked("card_condition", hit[0].value, true);
    }
  }
  await s.submitAndWaitForResult();
  if (opt.件数) {
    const pulldown = page.locator("#page_count_pulldown");
    await expect(pulldown, "検索結果の表示件数の欄").toBeVisible();
    const value = await pulldown.locator("option").evaluateAll((os, want) => (os as HTMLOptionElement[]).find((o) => (o.textContent ?? "").trim() === `${want}件`)?.value ?? "", opt.件数);
    if (!value) throw new Error(`表示件数に「${opt.件数}件」が無い`);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), pulldown.selectOption(value)]);
  }
}

/** 検索結果の件数（「検索結果：N件が該当しました」の N。該当なしは 0） */
export async function 該当件数(page: Page): Promise<number> {
  const t = (await page.locator("body").innerText()).match(/検索結果：(\d+)件が該当しました/);
  return t ? Number(t[1]) : 0;
}

/** 一覧の商品ID（上から順） */
export async function 一覧の商品ID(page: Page): Promise<string[]> {
  return page.locator('#form_bulk input[name="ids[]"]').evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).value));
}

/** 一覧のページの番号のリンクを押して、そのページを開く */
export async function ページを開く(page: Page, n: number): Promise<void> {
  const link = page.locator(".pagination a.page-link, ul.pagination a").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).first();
  await expect(link, `一覧の ${n} ページ目のリンク`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
}

/** 一覧の商品を選ぶ（チェックを付ける） */
export async function 商品を選ぶ(page: Page, 商品ID: string): Promise<void> {
  const box = page.locator(`#form_bulk input[name="ids[]"][value="${商品ID}"]`);
  await expect(box, `一覧に商品ID ${商品ID} の行がある`).toHaveCount(1);
  if (!(await box.isChecked())) {
    const id = await box.getAttribute("id");
    const label = id ? page.locator(`label[for="${id}"]`) : null;
    if (label && (await label.count()) && (await label.first().isVisible())) await label.first().click();
    else await box.check();
  }
  await expect(box, `商品ID ${商品ID} を選んだ`).toBeChecked();
}

/** 開発者ツールの代わり: 一覧のフォームに、選択済みの商品IDを1つ足す */
export async function 選択済みの商品IDを足す(page: Page, 商品ID: string): Promise<void> {
  await page.locator("#form_bulk").evaluate((f, v) => {
    const i = document.createElement("input");
    i.type = "checkbox"; i.name = "ids[]"; i.value = v as string; i.checked = true; i.style.display = "none";
    (f as HTMLFormElement).appendChild(i);
  }, 商品ID);
}
/** 開発者ツールの代わり: 選んだ商品の選択済みの商品IDを、別の値に変える */
export async function 選択済みの商品IDを変える(page: Page, 元: string, 新: string): Promise<void> {
  const n = await page.locator(`#form_bulk input[name="ids[]"][value="${元}"]`).evaluate((i, v) => { (i as HTMLInputElement).value = v as string; return 1; }, 新);
  if (n !== 1) throw new Error(`選択済みの商品ID ${元} を変えられない`);
}

/** 「グッズ商品CSV出力」を押し、ダウンロードと応答を受け取る（ダウンロードにならなければ、移った画面まで待つ） */
export async function 出力を押す(page: Page): Promise<出力の結果> {
  return 押して受け取る(page, () => goodsCsvExportButton(page).click());
}

/** いまの画面（参照元になる）から、送信先へ ids[] を送る（開発者ツールで確かめた送信先へ直接要求する） */
export async function この画面から送る(page: Page, 送信先: string, ids: string[]): Promise<出力の結果> {
  return 押して受け取る(page, () => page.evaluate(([to, values]) => {
    const form = document.createElement("form");
    form.method = "post"; form.action = to as string;
    for (const v of values as string[]) { const i = document.createElement("input"); i.type = "hidden"; i.name = "ids[]"; i.value = v; form.appendChild(i); }
    document.body.appendChild(form);
    form.submit();
  }, [送信先, ids] as const));
}

async function 押して受け取る(page: Page, 押す: () => Promise<unknown>): Promise<出力の結果> {
  const resP = page.waitForResponse((r) => r.request().method() === "POST" && /product_goods_csv_export/.test(r.url()), { timeout: 120_000 }).catch(() => null);
  const dlP = page.waitForEvent("download", { timeout: 120_000 }).catch(() => null);
  await 押す();
  const res = await resP;
  const 状態 = res?.status() ?? 0;
  const headers = res ? await res.allHeaders() : {};
  const 型 = headers["content-type"] ?? "";
  let ファイル: 出力の結果["ファイル"] = null;
  if (状態 === 200 && /attachment|csv/i.test(`${headers["content-disposition"] ?? ""} ${型}`)) {
    const d = await dlP;
    if (d) ファイル = { 名前: d.suggestedFilename(), 中身: await 中身(d) };
  } else {
    await page.waitForLoadState("load");
  }
  return { ファイル, 状態, 型, 移った先: page.url(), 誤り: await topErrors(page) };
}
