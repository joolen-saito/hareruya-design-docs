/**
 * 高額商品価格変更CSVアップロード画面（M03-32）と、セール用高額商品価格変更CSVアップロード画面（M03-33）。
 * メニュー「商品管理」→「CSV管理」。どちらも同じ画面の作り（取込ファイルの欄・「CSVファイルをアップロード」ボタン・
 * CSVのフォーマットの表と「雛形ファイルダウンロード」ボタン・CSVインポート履歴の一覧）。
 * - 取込の要求は、成功・失敗とも、アップロード画面へ戻す（画面上部に完了・警告・エラーのメッセージ）。
 * - なりすまし対策トークンは、アップロードのフォームの中の隠し項目にある。
 * - 取込ファイルの欄は必須（ブラウザの入力チェックが空の送信を止める）。
 *
 * あわせて、両機能のシードで使う商品規格登録編集画面の操作（高額商品コード・セールフラグ・価格・帯URLを入れて登録）を持つ。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved, chooseByLabel } from "./common";
import { tamperToken } from "./devtools";
import { classRowsFromProductEdit } from "./m03_23_seed_products";

export type 取込画面の種類 = "高額商品価格変更" | "セール用高額商品価格変更";

const PATHS: Record<取込画面の種類, { base: string; 見出し: string }> = {
  "高額商品価格変更": { base: "/product/simple_high_price", 見出し: "高額商品価格変更CSVアップロード" },
  "セール用高額商品価格変更": { base: "/product/sale_high_price", 見出し: "セール用高額商品価格変更CSVアップロード" },
};

export const uploadUrl = (kind: 取込画面の種類) => adminUrl(`${PATHS[kind].base}/csv_upload`);
export const uploadPath = (kind: 取込画面の種類) => new URL(uploadUrl(kind)).pathname;
export const pathOf = (url: string) => new URL(url).pathname;

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

export type 画面上部のメッセージ = { 成功: string[]; 警告: string[]; エラー: string[] };

/** 開発用の設定のときに、どの画面にも常に出る帯（取込の結果ではない） */
const ENV_BANNER = "デバッグモードが有効";

/** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
async function invalidFields(form: Locator): Promise<string[]> {
  return form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
    .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
    .map((e) => {
      const input = e as HTMLInputElement;
      const label = input.type === "file" ? "取込ファイル" : (input.name || "（項目名なし）");
      return `${label}: ${input.validationMessage}`;
    }));
}

export class HighPriceCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ダウンロード: Locator;
  readonly トークン: Locator;
  readonly 見出し: Locator;
  readonly 履歴の行: Locator;

  constructor(readonly page: Page, readonly kind: 取込画面の種類) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ダウンロード = page.locator("#download-template-button");
    this.トークン = this.form.locator('input[name$="[_token]"], input[name="_token"]');
    this.見出し = page.locator(".c-pageTitle__subTitle");
    this.履歴の行 = page.locator("#csv_import_history_table tbody tr");
  }

  get 画面の見出し(): string { return PATHS[this.kind].見出し; }
  private get importRequest(): RegExp { return new RegExp(`${PATHS[this.kind].base.replace(/\//g, "\\/")}\\/import$`); }

  /** 画面の読み込み（画面のスクリプトを含む）を待ち、取込ファイルの欄があることを確かめる */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, `${this.画面の見出し}画面の取込ファイルの欄`).toHaveCount(1);
  }

  /** 画面を開く */
  async open(): Promise<void> {
    const res = await this.page.goto(uploadUrl(this.kind));
    expect(res?.status() ?? 0, `${this.画面の見出し}画面の応答`).toBe(200);
    await this.ready();
  }

  /** 取込ファイルの欄でファイルを選ぶ（「ファイルを選択」でファイルを指定するのと同じ） */
  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
  }

  /** 取込ファイルの欄で選ばれているファイルの名前 */
  async chosenNames(): Promise<string[]> {
    return this.取込ファイル.evaluate((e) => Array.from((e as HTMLInputElement).files ?? []).map((f) => f.name));
  }

  /** フォームの中のなりすまし対策トークンを、消すか別の値に変える（開発者ツールで書き換えるのと同じ） */
  async changeToken(value: "なし" | string): Promise<void> {
    await tamperToken(this.form, value);
  }

  /** フォームの中のなりすまし対策トークンの数と値 */
  async tokenValues(): Promise<string[]> {
    return this.トークン.evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
  }

  /** フォームの中の項目の名前（なりすまし対策トークンの項目名から、フォームの項目名の前置きを読む） */
  async formName(): Promise<string> {
    const name = await this.取込ファイル.getAttribute("name");
    const m = /^([^[]+)\[/.exec(name ?? "");
    if (!m) throw new Error(`取込ファイルの欄の項目名からフォームの名前を読めない（${name}）`);
    return m[1];
  }

  /** 送信フォームに隠し項目を足す（開発者ツールで項目を追加するのと同じ） */
  async addField(name: string, value: string): Promise<void> {
    await this.form.evaluate((f, [n, v]) => {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = n; i.value = v;
      f.appendChild(i);
    }, [name, value] as const);
    await expect(this.form.locator(`input[name="${name}"]`), `送信フォームに足した項目 ${name}`).toHaveCount(1);
  }

  /**
   * 「CSVファイルをアップロード」ボタンを押す。ブラウザの入力チェックに通らない項目があれば、
   * 送信が止まったこと（要求が出ないこと）を確かめて、止めた項目を返す。通るときは、取込の要求の応答と、移った画面の読み込みを待つ。
   */
  async submit(timeoutMs = 120_000): Promise<SubmitResult> {
    await expect(this.アップロードボタン, "「CSVファイルをアップロード」ボタン").toBeVisible();
    const blocked = await invalidFields(this.form);
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && this.importRequest.test(r.url()), { timeout: timeoutMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: timeoutMs }), this.アップロードボタン.click()]);
    const status = (await response).status();
    await this.page.waitForLoadState("load");
    return { sent: true, status };
  }

  /** 「雛形ファイルダウンロード」ボタンを押し、始まったダウンロードを返す */
  async downloadTemplate(): Promise<Download> {
    await expect(this.雛形ダウンロード, "「雛形ファイルダウンロード」ボタン").toHaveText(/^\s*雛形ファイルダウンロード\s*$/);
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ダウンロード.click()]);
    return download;
  }

  /** 画面のCSVのフォーマットの表の項目名（上から順。「必須」の印は除く） */
  async formatItemNames(): Promise<string[]> {
    return this.page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr").evaluateAll((trs) => trs.map((tr) => {
      const cell = tr.querySelector("td");
      return cell ? [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim() : "";
    }));
  }

  /** 画面上部のメッセージ（成功・警告・エラー）。見えているものだけ。開発用の設定の帯は除く */
  async messages(): Promise<画面上部のメッセージ> {
    const read = async (l: Locator) => {
      const out: string[] = [];
      for (const e of await l.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
      return out.filter((t) => t && !t.includes(ENV_BANNER));
    };
    return {
      成功: await read(this.page.locator(".alert-success")),
      警告: await read(this.page.locator(".alert-warning")),
      エラー: await read(this.page.locator(".alert-danger")),
    };
  }

  /**
   * CSVインポート履歴のファイル名（全件）。件数の選択肢の最大の件数で開き直して読む（画面の件数の選択を使う）。
   * 1ページに収まらないときは止める（全件を見ていないのに「無い」と言わない）。
   */
  async allHistoryFileNames(): Promise<string[]> {
    await this.open();
    const pulldown = this.page.locator("#page_count_pulldown");
    if ((await pulldown.count()) === 1) {
      const options = await pulldown.locator("option").evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? "").trim() })));
      const largest = options.reduce((a, b) => (Number(b.label.replace(/\D/g, "")) > Number(a.label.replace(/\D/g, "")) ? b : a));
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), pulldown.selectOption(largest.value)]);
      await this.ready();
    }
    const pager = this.page.locator("#csv_import_history_table").locator("xpath=ancestor::div[contains(@class,'card-body')]").locator(".pagination");
    if ((await pager.count()) > 0 && (await pager.locator("li").count()) > 1) {
      throw new Error("CSVインポート履歴が1ページに収まらない。全件を画面で確かめられない");
    }
    const names: string[] = [];
    for (const tr of await this.履歴の行.all()) {
      const cells = tr.locator("td");
      if ((await cells.count()) < 2) continue; // 「データがありません」の行
      names.push(((await cells.first().textContent()) ?? "").trim());
    }
    return names;
  }
}

/** 商品規格登録編集画面で入れる値（正本の作り方の値） */
export type 高額商品規格の入力 = {
  高額商品コード: string;
  セール: boolean;
  基準価格: string;
  販売価格: string;
  買取価格: string;
  /** 正本が帯URLを入れると定めたときだけ */
  帯URL?: string;
};

/**
 * 正本「商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で言語日本語・状態NMの規格
 * （取り込みで作られた規格）の行を開き、商品規格登録編集画面で高額商品コード・セールフラグ・基準価格・販売価格・買取価格（・帯URL）を入れ、
 * スマレジ連携フラグは既定の「連携しない」のまま、部門は選択肢の先頭を選び、公開状態（公開ステータス）に「公開」を選んで「商品規格を登録」を押す。
 * 商品規格登録編集画面の商品規格ID欄に表示された番号を控える」。
 * 商品登録編集画面（未変更）を開いた状態から始める。登録後の商品規格IDと、選んだ部門の名前を返す。
 */
export async function registerHighPriceClass(
  page: Page, productId: string, 商品コード: string, v: 高額商品規格の入力, what: string, onIssue: (m: string) => void,
): Promise<string> {
  const rows = await classRowsFromProductEdit(page, productId);
  if (rows.length !== 1) throw new Error(`${what}: 商品規格一覧の行が ${rows.length} 件ある（取り込みで作られた1件のはず）: ${JSON.stringify(rows)}`);
  const r = rows[0];
  if (r.商品コード !== 商品コード || r.状態 !== "NM" || r.言語 !== "日本語") {
    throw new Error(`${what}: 取り込みで作られた商品規格が、商品コード ${商品コード}・NM・日本語 でない: ${JSON.stringify(r)}`);
  }
  const edit = page.locator(`#ex-product_class-${r.商品規格ID}`).getByRole("link", { name: "編集", exact: true });
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${productId}/edit/${r.商品規格ID}$`)), edit.click()]);
  // セールフラグの切り替えで販売価格を書き換えるのは画面のスクリプトなので、読み込みを待ってから入れる
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) !== 1 || (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグの既定が「連携しない」でない。保存すると外部のスマレジへ送られうるので止める`);
  }
  await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  await form.locator("#admin_product_class_standard_price").fill(v.基準価格);
  const sale = form.locator("#admin_product_class_sale_flg");
  if ((await sale.isChecked()) !== v.セール) await sale.click();
  await expect(sale, `${what}: セールフラグ`).toBeChecked({ checked: v.セール });
  await form.locator("#admin_product_class_price02").fill(v.販売価格);
  await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  if (v.帯URL !== undefined) await form.locator("#admin_product_class_belt_url").fill(v.帯URL);
  const section = form.locator("#admin_product_class_Section");
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim(), disabled: (n as HTMLOptionElement).disabled }))
    .find((o) => o.value !== "" && !o.disabled));
  if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
  await section.selectOption(first.value);
  onIssue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ`);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(`${what}: 商品規格の登録で出た警告「${w}」`);
  const idRow = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品規格ID\s*$/ }) });
  await expect(idRow, `${what}: 商品規格登録編集画面の商品規格IDの行`).toHaveCount(1);
  const id = ((await idRow.locator(".col").first().textContent()) ?? "").trim();
  if (id !== r.商品規格ID) throw new Error(`${what}: 登録後の商品規格ID ${id} が、一覧の行の ${r.商品規格ID} と違う`);
  // 登録後の画面に、入れた値が保存されて出ていること
  const f = page.locator("form#form");
  const num = async (sel: string) => ((await f.locator(sel).inputValue()) ?? "").replace(/[,\s]/g, "");
  const saved = {
    高額商品コード: await f.locator("#admin_product_class_high_price_code").inputValue(),
    セール: await f.locator("#admin_product_class_sale_flg").isChecked(),
    基準価格: await num("#admin_product_class_standard_price"),
    販売価格: await num("#admin_product_class_price02"),
    買取価格: await num("#admin_product_class_buy_price"),
    帯URL: await f.locator("#admin_product_class_belt_url").inputValue(),
  };
  const want = { ...v, 帯URL: v.帯URL ?? saved.帯URL };
  const diff = (Object.keys(want) as (keyof typeof want)[]).filter((k) => String(saved[k]) !== String(want[k]));
  if (diff.length) throw new Error(`${what}: 登録後の商品規格の値が入れた値と違う: ${diff.map((k) => `${k}=${saved[k]}（入れた値 ${want[k]}）`).join("・")}`);
  await expect(f.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開状態`).toHaveText(/^\s*公開\s*$/);
  return id;
}
