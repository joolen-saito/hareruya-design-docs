/**
 * タグ登録/編集画面（メニュー「商品管理」→「タグ管理」）。入力欄と、タグの一覧が同じ画面にある。
 * - 編集対象を指定しない画面が新規登録、一覧の編集ボタン・ID・名称・並び順のリンクで開く画面がそのタグの編集。
 * - 入力欄は基本の3項目（名称(日)・名称(英)・並び順）と、「その他の設定 (クリックで展開)」を押すと開く7項目。
 * - 一覧は並び順の昇順。表示件数と表示ページは、ログイン中のセッションが覚える。一覧に削除ボタンは無い。
 * - 登録ボタンは入力欄のフォームの外にあり、フォームを指して送信する。必須の欄が空のときは、ブラウザの入力チェックが送信を止める。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export const tagNewUrl = () => adminUrl("/product/tag");
export const tagEditUrl = (id: string) => adminUrl(`/product/tag/${id}`);
export const tagNewPath = () => new URL(tagNewUrl()).pathname;
export const tagEditPath = (id: string) => new URL(tagEditUrl(id)).pathname;
/** 登録の要求の送り先（入力の不備で同じ画面を返すときも、このアドレスのまま表示される） */
export const tagRegisterRequestPath = (id?: string) => new URL(adminUrl(id ? `/product/tag/store/${id}` : "/product/tag/store")).pathname;

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 入力欄の値。書いた項目だけを入れる（undefined の項目は触らない） */
export type TagInput = {
  名称日?: string; 名称英?: string; 並び順?: string;
  フリーエリア日?: string; フリーエリア英?: string; 優先表示商品?: string;
  タイトル日?: string; 説明日?: string; タイトル英?: string; 説明英?: string;
};
export type TagRow = { ID: string; 名称日: string; 名称英: string; 並び順: string };

/** 「その他の設定」の中の7項目。画面の並びの順 */
export const その他の設定の項目 = ["フリーエリア日", "フリーエリア英", "優先表示商品", "タイトル日", "説明日", "タイトル英", "説明英"] as const;
export type その他の設定の項目名 = typeof その他の設定の項目[number];
/** 画面の項目名（ラベルの文） */
export const 項目の表示名: Record<keyof TagInput, string> = {
  名称日: "名称(日)", 名称英: "名称(英)", 並び順: "並び順",
  フリーエリア日: "フリーエリア(日)", フリーエリア英: "フリーエリア(英)", 優先表示商品: "優先表示商品",
  タイトル日: "タイトル(日)", 説明日: "説明(日)", タイトル英: "タイトル(英)", 説明英: "説明(英)",
};

/** 登録ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

export class TagPage {
  readonly form: Locator;
  readonly 欄: Record<keyof TagInput, Locator>;
  /** 正本の識別ID 4（削除された項目）。画面に出ていないことを確かめるためだけに使う */
  readonly 優先表示商品のみを表示: Locator;
  readonly 優先表示商品のみを表示の項目名: Locator;
  readonly その他の設定: Locator;
  readonly その他の設定の中: Locator;
  readonly 登録ボタン: Locator;
  readonly 入力欄の見出し: Locator;
  readonly 編集中のID: Locator;
  readonly 件数: Locator;
  readonly rows: Locator;
  /** 画面上部の成功の表示 */
  readonly 成功の表示: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#add_new_product_tag");
    const f = (name: string) => this.form.locator(`[name="tag[${name}]"]`);
    this.欄 = {
      名称日: f("name"), 名称英: f("nameEn"), 並び順: f("sortNo"),
      フリーエリア日: f("freeAreaJp"), フリーエリア英: f("freeAreaEn"), 優先表示商品: f("priorityProducts"),
      タイトル日: f("titleJp"), 説明日: f("descriptionJp"), タイトル英: f("titleEn"), 説明英: f("descriptionEn"),
    };
    this.優先表示商品のみを表示 = f("hideNormalProductsFlg");
    this.優先表示商品のみを表示の項目名 = this.form.getByText("優先表示商品のみを表示");
    this.その他の設定 = this.form.locator('[data-bs-target="#collapseOne"]');
    this.その他の設定の中 = this.form.locator("#collapseOne");
    this.登録ボタン = page.locator('button[type="submit"][form="add_new_product_tag"]');
    this.入力欄の見出し = this.form.locator(".card-header .card-title").first();
    this.編集中のID = this.form.locator('input[type="hidden"][name="tag[id]"]');
    this.件数 = page.locator("select.js-page-count");
    this.rows = page.locator("tbody.sortable-container tr");
    this.成功の表示 = page.locator(".alert-success");
  }

  /** 画面の読み込みを終え、入力欄が出るまで待つ（「その他の設定」の開閉と件数欄は、スクリプトの読み込み後でないと動かない） */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.欄.名称日, "タグ登録/編集画面の名称(日)の欄").toBeVisible();
  }

  /** 編集対象を指定せずに開く（新規登録） */
  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(tagNewUrl());
    await this.ready();
    return res;
  }

  /** タグIDを指定して、そのタグの編集画面をアドレスで開く */
  async openEdit(id: string): Promise<Response | null> {
    const res = await this.page.goto(tagEditUrl(id));
    await this.ready();
    expect(await this.editingId(), `タグID ${id} の編集画面`).toBe(id);
    return res;
  }

  /** 一覧の表示ページを1にし、件数欄で表示件数を選ぶ（セッションが覚える） */
  async showFirstPageWith(count: string): Promise<void> {
    await this.page.goto(adminUrl("/product/tag/page/1"));
    await this.ready();
    if ((await this.件数.inputValue()) !== count) await this.chooseCount(count);
    await expect(this.件数, "一覧の表示件数").toHaveValue(count);
  }

  /** 件数欄で表示件数を選ぶ（選ぶと画面を開き直す） */
  async chooseCount(count: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL((u) => u.searchParams.get("page_count") === count),
      this.件数.selectOption(count),
    ]);
    await this.ready();
  }

  /** 入力欄が編集しているタグのID（新規登録の画面では空） */
  async editingId(): Promise<string> {
    if ((await this.編集中のID.count()) === 0) return "";
    return (await this.編集中のID.inputValue()).trim();
  }

  rowById(id: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(1)", { hasText: exact(id) }) });
  }

  /** 一覧に表示された行（上から順） */
  async allRows(): Promise<TagRow[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").trim();
      return { ID: td(1), 名称日: td(2), 名称英: td(3), 並び順: td(4) };
    }));
  }

  /** 一覧の行の編集ボタンを押し、そのタグの編集画面へ移る */
  async pressEdit(id: string): Promise<void> {
    const row = this.rowById(id);
    await expect(row, `一覧にID ${id} の行が1件`).toHaveCount(1);
    const button = row.getByRole("link", { name: "編集", exact: true });
    await expect(button, `ID ${id} の行の編集ボタン`).toHaveCount(1);
    await Promise.all([this.page.waitForURL((u) => u.pathname === tagEditPath(id)), button.click()]);
    await this.ready();
  }

  /**
   * 「その他の設定 (クリックで展開)」を押し、中の項目が開くまで待つ。押す前から開いていたときは押さずに止める
   * （押すと閉じてしまう。画面を開き直した直後は閉じている）。
   */
  async openOtherSettings(): Promise<void> {
    await expect(this.その他の設定, "「その他の設定」の見出し").toBeVisible();
    await expect(this.その他の設定, "「その他の設定」の見出しの文").toContainText("その他の設定");
    if (await this.その他の設定の中.isVisible()) throw new Error("「その他の設定」を押す前から、中の項目が開いている");
    await this.その他の設定.click();
    await expect(this.その他の設定の中, "「その他の設定」の中の項目").toBeVisible();
    await expect(this.その他の設定の中, "「その他の設定」の中の項目（開き終わり）").not.toHaveClass(/collapsing/);
  }

  /** 項目のラベルの文（画面の label の文） */
  async labelOf(項目: keyof TagInput): Promise<string> {
    const id = await this.欄[項目].getAttribute("id");
    if (!id) throw new Error(`${項目の表示名[項目]}の欄に id が無く、ラベルを引けない`);
    const label = this.form.locator(`label[for="${id}"]`);
    if ((await label.count()) !== 1) return "";
    return ((await label.textContent()) ?? "").replace(/\s+/g, " ").trim();
  }

  async fill(v: TagInput): Promise<void> {
    for (const k of Object.keys(v) as (keyof TagInput)[]) {
      const value = v[k];
      if (value !== undefined) await this.欄[k].fill(value);
    }
  }

  /**
   * 数値の欄（並び順）へ、画面からは入れられない文字を書く。M13-02 の024と同じく、開発者ツールで行うのと同じに欄を文字の欄に変えて値を書く。
   * 書く前に、画面のとおりに打ったとき欄に入った値を返す（数値の欄は文字を受け付けない）。
   */
  async 並び順に文字を書く(value: string): Promise<string> {
    const input = this.欄.並び順;
    await input.fill("");
    await input.pressSequentially(value);
    const typed = await input.inputValue();
    await input.evaluate((e, v) => { (e as HTMLInputElement).type = "text"; (e as HTMLInputElement).value = v; }, value);
    return typed;
  }

  /** 入力欄に読み込まれている値 */
  async inputValues(): Promise<Required<TagInput>> {
    const out = {} as Required<TagInput>;
    for (const k of Object.keys(this.欄) as (keyof TagInput)[]) out[k] = await this.欄[k].inputValue();
    return out;
  }

  /**
   * 登録ボタンを押す。必須の欄が空のときは、ブラウザが送信を止める（要求を送らない）。
   * そのときは止めた項目（項目名と、ブラウザの案内の文）を返す。
   */
  async pressRegister(): Promise<SubmitResult> {
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => {
        const id = (e as HTMLElement).id;
        const label = id ? f.querySelector(`label[for="${id}"]`)?.textContent?.trim() : "";
        return `${label || "（項目名なし）"}: ${(e as HTMLInputElement).validationMessage}`;
      }));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.登録ボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/product\/tag\/store(\/\d+)?$/.test(new URL(r.url()).pathname));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return { sent: true, status: (await response).status() };
  }

  /** 入力して登録し、成功の表示を確かめる。登録後の画面（そのタグの編集画面）のアドレスの末尾からタグIDを読む */
  async register(v: TagInput, what: string): Promise<string> {
    await this.fill(v);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
    const m = new URL(this.page.url()).pathname.match(/\/product\/tag\/(\d+)$/);
    if (!m) throw new Error(`${what}: 登録後に、タグの編集画面へ移らない（${this.page.url()}）`);
    await this.ready();
    return m[1];
  }

  /** 画面上部に出たメッセージ（開発用の設定のときの帯を除く） */
  async messages(): Promise<string[]> {
    return (await this.page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t && !t.includes("デバッグモードが有効"));
  }
}
