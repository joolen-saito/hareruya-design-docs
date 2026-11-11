/**
 * 公開側のネット買取商品一覧と、そこから開くネット買取商品検索モーダル（F05-02）。
 * 販売側の商品詳細検索モーダル（F03-03 の部品）と項目の作りは同じだが、モーダル・フォーム・開閉の印が別なので、別の部品にする。
 * - 一覧のアドレスは /ja/purchase/search。モーダルは #purchase-detailed-search-modal（開くと is-visible が付く）
 * - 開く: [data-modal-open="purchase-search"]（一覧の左の欄の「詳細検索」・絞り込みの並びの「詳細検索」・画面上部の「詳細検索」）
 * - 閉じる: [data-modal-close="purchase-search"]。クリア: [data-search-clear]（type=reset。押すと選ばれている選択肢をすべて外す）
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** ネット買取商品一覧のアドレス（本店・日本語） */
export const ネット買取商品一覧のパス = "/ja/purchase/search";

export type 検索モーダルの入力 = {
  商品名: string; カテゴリ: string; 色: string; 固有色: string; マナコスト: string; カードタイプ: string; サブタイプ: string;
  フォーマット: string; 禁止カードも表示する: boolean; 言語: string; レアリティ: string; Foil: string; フレーム: string; イラストレーター: string;
};

export class PurchaseSearchPage {
  readonly モーダル: Locator;
  readonly フォーム: Locator;
  readonly 閉じるボタン: Locator;
  readonly クリアボタン: Locator;
  /** 一覧上部の商品数（「商品数: N点」） */
  readonly 商品数: Locator;
  /** 一覧本文（検索結果の並び） */
  readonly 一覧本文: Locator;

  constructor(readonly page: Page) {
    this.モーダル = page.locator("#purchase-detailed-search-modal");
    this.フォーム = page.locator("#purchase-detailed-search-form");
    this.閉じるボタン = this.モーダル.locator('[data-modal-close="purchase-search"]');
    this.クリアボタン = this.フォーム.locator("[data-search-clear]");
    this.商品数 = page.locator("#purchase-list-unisearch-hit-count");
    this.一覧本文 = page.locator("#purchase-list-unisearch-shelf");
  }

  /** ネット買取商品一覧の画面の印 */
  get 一覧の印(): Locator { return this.page.locator("body.purchase_search"); }

  /** アドレス（/ja/purchase/search と、その後ろの検索条件）を開き、応答のHTTPステータスを返す。階層カテゴリの選択欄が組み立つまで待つ */
  async 開く(pathAndQuery = ネット買取商品一覧のパス): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${pathAndQuery}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await this.フォーム.locator("[data-product-search-category-selects] select").first().waitFor({ state: "attached", timeout: 30_000 }).catch(() => undefined);
    return res?.status() ?? 0;
  }

  /** 一覧左の欄の「詳細検索」ボタン（PC版） */
  一覧の詳細検索ボタン(): Locator { return this.page.locator("#purchase-search-detailed-search:visible"); }

  /**
   * 一覧の「詳細検索」を押す。固定のヘッダーが一覧左の欄のボタンに重なって押せないときは、
   * 絞り込みの並びの「詳細検索」、それでも押せなければ画面上部の「詳細検索」を押す。押したのがどれかを返す（記録の注記に使う）。
   */
  async 詳細検索を押す(): Promise<string> {
    await this.page.mouse.move(640, 400);
    const 候補: [string, Locator][] = [
      ["一覧左の欄の詳細検索ボタン", this.一覧の詳細検索ボタン().first()],
      ["絞り込みの並びの詳細検索ボタン", this.page.locator('[data-filter="detail-search"][data-modal-open="purchase-search"]:visible').first()],
      ["画面上部の詳細検索ボタン", this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="purchase-search"]:visible').first()],
    ];
    for (const [名, button] of 候補) {
      if ((await button.count()) === 0) continue;
      try {
        await button.evaluate((e) => e.scrollIntoView({ block: "center" }));
        await button.click({ timeout: 8_000 });
        return 名;
      } catch {
        await this.page.evaluate(() => window.scrollTo(0, 0));
      }
    }
    throw new Error("ネット買取商品一覧で「詳細検索」ボタンを押せない（どの入口も見えない・押せない）");
  }

  async モーダルが開いている(): Promise<boolean> {
    if ((await this.モーダル.count()) === 0) return false;
    return this.モーダル.evaluate((e) => e.classList.contains("is-visible"));
  }

  /** 開閉の動きが終わるのを待ってから、モーダルが開いているかを返す */
  async 開閉後のモーダル(): Promise<boolean> {
    await this.page.waitForTimeout(700);
    return this.モーダルが開いている();
  }

  /** モーダルの外（背景）を押す。モーダルの本体に重ならない端を押す */
  async モーダル外を押す(): Promise<void> {
    const box = await this.モーダル.boundingBox();
    const vp = this.page.viewportSize() ?? { width: 1280, height: 720 };
    if (box && box.x > 8) { await this.page.mouse.click(Math.max(2, box.x / 2), Math.max(2, box.y + 20)); return; }
    if (box && box.y > 8) { await this.page.mouse.click(vp.width / 2, Math.max(2, box.y / 2)); return; }
    await this.page.mouse.click(2, vp.height - 2);
  }

  // ---- 入力欄 ----

  private ブロック(cls: string): Locator { return this.フォーム.locator(`.p-hareruya-search-form__${cls}`); }
  get 商品名欄(): Locator { return this.ブロック("card-name").locator('input[type="text"]'); }
  get カテゴリの選択欄(): Locator { return this.フォーム.locator("[data-product-search-category-selects] select"); }
  /** カテゴリの選んだ値を送る隠しの欄 */
  get カテゴリの送る値(): Locator { return this.フォーム.locator("[data-product-search-category-value]"); }
  /** カードセットの入力欄（設計書では削除された項目。モーダルにあるかを数える） */
  get カードセット欄(): Locator { return this.フォーム.locator('[name$="[cardset]"], [name="cardset"]'); }
  /** 色（1つ目）・固有色（2つ目）のブロック */
  色のブロック(欄: "色" | "固有色"): Locator { return this.ブロック("color").nth(欄 === "色" ? 0 : 1); }
  get サブタイプ欄(): Locator { return this.ブロック("subtype").locator("select"); }
  get イラストレーター欄(): Locator { return this.ブロック("illustrator").locator("select"); }
  get フォーマットの並び(): Locator { return this.フォーム.locator("[data-search-format-radios]"); }

  /** 色・固有色の選択肢（aria-label の色名）の入力 */
  色の入力(欄: "色" | "固有色", 色名: string): Locator {
    return this.色のブロック(欄).locator(`input.p-hareruya-search-form__checkbox-input[aria-label="${色名}"]`);
  }

  /** チェックボックスのブロックで、表示名が一致する選択肢の入力 */
  チェックの入力(cls: "mana-cost" | "card-type" | "language" | "rarity" | "foil" | "frame" | "format", 表示名: string): Locator {
    return this.ブロック(cls).locator("label.p-hareruya-search-form__checkbox")
      .filter({ has: this.page.locator(".p-hareruya-search-form__checkbox-inner", { hasText: new RegExp(`^\\s*${表示名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) })
      .locator("input");
  }

  /** フォーマットのラジオで、表示名が一致する選択肢の入力 */
  フォーマットの入力(表示名: string): Locator {
    return this.フォーマットの並び.locator("label.c-hareruya-radio").filter({ has: this.page.locator(".c-hareruya-radio__label", { hasText: new RegExp(`^\\s*${表示名}\\s*$`) }) }).locator("input");
  }

  /** フォーマットの選択肢の表示名（先頭の「指定なし」を含む。上からの順） */
  async フォーマットの選択肢(): Promise<string[]> {
    return (await this.フォーマットの並び.locator(".c-hareruya-radio__label").allInnerTexts()).map((t) => t.trim());
  }

  /** 色・カードタイプの論理演算子で選ばれている選択肢の表示名（選ばれていなければ空） */
  async 論理演算子の選択(欄: "色" | "カードタイプ"): Promise<string[]> {
    const block = 欄 === "色" ? this.色のブロック("色") : this.ブロック("card-type");
    const labels = block.locator("label.c-hareruya-radio").filter({ has: this.page.locator("input:checked") });
    return (await labels.locator(".c-hareruya-radio__label").allInnerTexts()).map((t) => t.trim());
  }

  /** 入力の label を押して選ぶ（入力そのものは画像の下に隠れている）。選ばれたかを確かめる */
  private async 押して選ぶ(input: Locator, what: string): Promise<void> {
    if ((await input.count()) !== 1) throw new Error(`ネット買取商品検索モーダルに「${what}」の選択肢が ${await input.count()} 件（1件のはず）`);
    if (await input.isChecked()) return;
    await input.locator("xpath=ancestor::label[1]").click();
    if (!(await input.isChecked())) await input.check({ force: true });
    if (!(await input.isChecked())) throw new Error(`「${what}」を選べない`);
  }

  /** 選択欄で、表示名が一致する選択肢を選ぶ */
  private async 選択欄で選ぶ(select: Locator, 表示名: string, what: string): Promise<void> {
    const values = await select.locator("option").evaluateAll((os, name) => (os as HTMLOptionElement[])
      .filter((o) => (o.textContent ?? "").trim() === name).map((o) => o.value), 表示名);
    if (values.length !== 1) throw new Error(`${what}の選択肢に「${表示名}」が ${values.length} 件（1件のはず）`);
    await select.selectOption(values[0]);
  }

  /** 最上位のカテゴリの選択欄で選ぶ */
  async カテゴリを選ぶ(名称: string): Promise<void> {
    await this.選択欄で選ぶ(this.カテゴリの選択欄.first(), 名称, "カテゴリ");
    await this.page.waitForTimeout(300);
  }

  /** モーダルの各項目に値を入れる（項目ごとに失敗を返す。止めずに続け、入らなかった項目は呼び出し側が注記に残す） */
  async 入れる(v: 検索モーダルの入力): Promise<string[]> {
    const 失敗: string[] = [];
    const 試す = async (項目: string, fn: () => Promise<void>) => { try { await fn(); } catch (e) { 失敗.push(`${項目}: ${(e as Error).message.split("\n")[0]}`); } };
    await 試す("商品名", () => this.商品名欄.fill(v.商品名));
    await 試す("カテゴリ", () => this.カテゴリを選ぶ(v.カテゴリ));
    await 試す("色", () => this.押して選ぶ(this.色の入力("色", v.色), `色 ${v.色}`));
    await 試す("固有色", () => this.押して選ぶ(this.色の入力("固有色", v.固有色), `固有色 ${v.固有色}`));
    await 試す("マナ・コスト", () => this.押して選ぶ(this.チェックの入力("mana-cost", v.マナコスト), `マナ・コスト ${v.マナコスト}`));
    await 試す("カードタイプ", () => this.押して選ぶ(this.チェックの入力("card-type", v.カードタイプ), `カードタイプ ${v.カードタイプ}`));
    await 試す("サブタイプ", () => this.選択欄で選ぶ(this.サブタイプ欄, v.サブタイプ, "サブタイプ"));
    await 試す("フォーマット", () => this.押して選ぶ(this.フォーマットの入力(v.フォーマット), `フォーマット ${v.フォーマット}`));
    if (v.禁止カードも表示する) await 試す("禁止カードも表示する", () => this.押して選ぶ(this.チェックの入力("format", "禁止カードも表示する"), "禁止カードも表示する"));
    await 試す("言語", () => this.押して選ぶ(this.チェックの入力("language", v.言語), `言語 ${v.言語}`));
    await 試す("レアリティ", () => this.押して選ぶ(this.チェックの入力("rarity", v.レアリティ), `レアリティ ${v.レアリティ}`));
    await 試す("Foil", () => this.押して選ぶ(this.チェックの入力("foil", v.Foil), `Foil ${v.Foil}`));
    await 試す("フレーム", () => this.押して選ぶ(this.チェックの入力("frame", v.フレーム), `フレーム ${v.フレーム}`));
    await 試す("イラストレーター", () => this.選択欄で選ぶ(this.イラストレーター欄, v.イラストレーター, "イラストレーター"));
    return 失敗;
  }

  /** チェックボックスの選択肢（マナ・コスト・カードタイプ・言語・レアリティ・Foil・フレーム・フォーマット）を表示名で選ぶ */
  async チェックを選ぶ(cls: "mana-cost" | "card-type" | "language" | "rarity" | "foil" | "frame" | "format", 表示名: string): Promise<void> {
    await this.押して選ぶ(this.チェックの入力(cls, 表示名), `${cls} ${表示名}`);
  }

  /** 「検索」を押し、画面が移るのを待つ。押す前のアドレスと、移った先の画面の応答のHTTPステータス（リダイレクトのあとの最後のもの）を返す */
  async 検索する(): Promise<{ 前: string; 応答: number }> {
    const 前 = this.page.url();
    let 応答 = 0;
    const on = (r: import("@playwright/test").Response) => {
      const q = r.request();
      if (q.isNavigationRequest() && q.frame() === this.page.mainFrame()) 応答 = r.status();
    };
    this.page.on("response", on);
    try {
      await Promise.all([
        this.page.waitForURL((u) => u.toString() !== 前, { waitUntil: "domcontentloaded", timeout: 30_000 }),
        this.フォーム.locator("[data-search-submit]").click(),
      ]);
      await this.page.waitForLoadState("load");
    } finally {
      this.page.off("response", on);
    }
    return { 前, 応答 };
  }

  /** いまのアドレス（パスは符号化のまま・ロケールの接頭辞 /ja を除いたもの、引数の名前と値の組。値は復号したもの） */
  アドレス(): { パス: string; 引数: [string, string][] } {
    const u = new URL(this.page.url());
    return { パス: u.pathname.replace(/^\/ja(?=\/)/, ""), 引数: [...u.searchParams.entries()] };
  }

  /** 一覧の上の説明の欄（タグ・カテゴリに登録した説明文） */
  get 説明の欄(): Locator { return this.page.locator(".p-hareruya-product-list__free-content"); }

  /** 選択欄で選ばれている選択肢の値（空なら未選択） */
  async 選択欄の値(select: Locator): Promise<string> {
    if ((await select.count()) === 0) return "";
    return select.first().inputValue();
  }

  /** 一覧本文の読み込み中の表示が消えるまで待つ */
  async 一覧の読み込みを待つ(): Promise<void> {
    await this.一覧本文.locator(".purchase-list-unisearch-loading").first().waitFor({ state: "detached", timeout: 60_000 });
  }

  /** 一覧本文に表示された商品の数（案内・読み込み中の枠を除いた要素） */
  async 一覧の商品数(): Promise<number> {
    return this.一覧本文.locator(":scope > *:not(.ec-purchaseSearch__results-status)").count();
  }
}
