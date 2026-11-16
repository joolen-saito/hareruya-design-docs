/**
 * 公開側の商品一覧と、そこから開く商品詳細検索モーダル（F03-03）。
 * 公開側の部品は機能ごとにファイルを分けている（F03-07 など別の担当と二重に作らない）。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { トップのパスか, トップを開く } from "./open_top";

/**
 * 商品詳細検索モーダルとその背景が閉じ切る（開いた印が無く、見た目が透明・非表示になる）まで待つ。
 * 閉じる動き（0.3秒で薄くなる）の途中や、開いた印が残ったまま撮ると、画像でモーダルが半透明に重なる
 * （2026-11-12 の IT-F02-03-033・034、IT-F03-03-016 の画像）。期待結果を撮る前に呼ぶ。閉じ切らなければ落とす。
 */
export async function 詳細検索モーダルが閉じ切るのを待つ(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(() => {
    const els = [document.querySelector("#product-detailed-search-modal"), ...Array.from(document.querySelectorAll(".p-hareruya-search-modal__overlay"))];
    return els.every((e) => {
      if (!e) return true;
      if (e.classList.contains("is-visible")) return false;
      const cs = getComputedStyle(e);
      return cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0;
    });
  }, null, { timeout });
}

export class FrontDetailSearch {
  readonly モーダル: Locator;
  readonly フォーム: Locator;
  readonly 閉じるボタン: Locator;
  constructor(readonly page: Page) {
    this.モーダル = page.locator("#product-detailed-search-modal");
    this.フォーム = page.locator("#product-detailed-search-form");
    this.閉じるボタン = page.locator('[data-modal-close="search"]');
  }

  /** 商品一覧を開く。shop は本店なら "/ja"、支店なら "/ja/<支店URL>"。階層カテゴリの選択欄が組み立つまで待つ */
  async openProductList(shop = "/ja"): Promise<void> {
    const res = await this.page.goto(`${BASE_URL}${shop}/products/search`, { waitUntil: "domcontentloaded" });
    if (!res || res.status() >= 400) throw new Error(`公開側の商品一覧（${shop}）を開けない（応答 ${res?.status()}）`);
    await this.page.locator('#product-detailed-search-form [data-product-search-category-selects] select').first().waitFor({ state: "attached" });
  }

  /** 画面で見えている「詳細検索」の入口（画面の幅で見えるものが変わる） */
  詳細検索の入口(): Locator {
    return this.page.locator('[data-modal-open="search"]:visible');
  }

  /** 商品一覧の中の「詳細検索」ボタン（PC版は左の欄、SP版は絞り込みの並び） */
  商品一覧の詳細検索ボタン(): Locator {
    return this.page.locator('#product-list-detailed-search:visible, .js-product-detailed-search-open:visible').first();
  }

  /**
   * 商品一覧の「詳細検索」を押す。固定のヘッダー（PC版）が商品一覧の左の欄のボタンに重なって押せないことがあるので、
   * 画面の中ほどへスクロールし、まず商品一覧の中のボタンを押す。それでも押せなければ、画面上部のナビゲーションの「詳細検索」を押す。
   * 押したのがどちらかを返す（記録の注記に使う）。
   */
  async 詳細検索を押す(): Promise<"商品一覧の詳細検索ボタン" | "画面上部の詳細検索ボタン"> {
    await this.page.mouse.move(640, 400);
    const button = this.商品一覧の詳細検索ボタン();
    await button.waitFor({ state: "visible", timeout: 30_000 });
    await button.evaluate((e) => e.scrollIntoView({ block: "center" }));
    try {
      await button.click({ timeout: 8_000 });
      return "商品一覧の詳細検索ボタン";
    } catch {
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="search"]:visible').first().click({ timeout: 30_000 });
      return "画面上部の詳細検索ボタン";
    }
  }

  /** 画面の下端（SP版のフッター）の詳細検索ボタン */
  フッターの詳細検索ボタン(): Locator {
    return this.page.locator('.p-hareruya-bottom-nav__search-btn[data-modal-open="search"]');
  }

  async モーダルが開いている(): Promise<boolean> {
    return this.モーダル.evaluate((e) => e.classList.contains("is-visible"));
  }

  /** 開閉の動きが終わるのを待ってから、モーダルが開いているかを返す */
  async 開閉後のモーダル(): Promise<boolean> {
    await this.page.waitForTimeout(700);
    return this.モーダルが開いている();
  }

  /** モーダルの外（背景）を押す。モーダルの本体に重ならない左上の端を押す */
  async モーダル外を押す(): Promise<void> {
    const box = await this.フォーム.boundingBox();
    const vp = this.page.viewportSize() ?? { width: 1280, height: 720 };
    const x = box && box.x > 8 ? Math.max(2, box.x / 2) : 2;
    const y = box && box.y > 8 ? Math.max(2, box.y / 2) : vp.height - 2;
    await this.page.mouse.click(x, y);
  }

  // ---- カテゴリの階層 ----

  カテゴリ選択欄(階層: number): Locator {
    return this.フォーム.locator(`[data-product-search-category-selects] select[data-category-level="${階層}"]`);
  }

  /** いま表示されているカテゴリ選択欄の数（階層の数） */
  async カテゴリ選択欄の数(): Promise<number> {
    return this.フォーム.locator("[data-product-search-category-selects] select").count();
  }

  /** その階層の選択肢の表示名（先頭の「指定しない」相当を除く） */
  async カテゴリの選択肢(階層: number): Promise<string[]> {
    const select = this.カテゴリ選択欄(階層);
    if ((await select.count()) === 0) return [];
    const options = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
    const values = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    return options.filter((_, i) => values[i] !== "");
  }

  async カテゴリを選ぶ(階層: number, 名称: string): Promise<void> {
    await this.カテゴリ選択欄(階層).selectOption({ label: 名称 });
    await this.page.waitForTimeout(300);
  }

  // ---- 入力欄 ----

  /** モーダルの項目の見出し（カテゴリ・カラー・カードタイプなど） */
  async 項目の見出し(): Promise<string[]> {
    return (await this.フォーム.locator("legend, label.c-hareruya-heading--lev3").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** カードタイプの選択肢の表示名 */
  async カードタイプの選択肢(): Promise<string[]> {
    return (await this.フォーム.locator(".p-hareruya-search-form__card-type .p-hareruya-search-form__checkbox-inner").allInnerTexts()).map((t) => t.trim());
  }

  /** フォーマットの選択肢の表示名（先頭の「指定しない」を含む。上からの順） */
  async フォーマットの選択肢(): Promise<string[]> {
    return (await this.フォーム.locator("[data-search-format-radios] .c-hareruya-radio__label").allInnerTexts()).map((t) => t.trim());
  }

  /** イラストレーターの選択肢の表示名（上からの順。先頭の「指定しない」を除く） */
  async イラストレーターの選択肢(): Promise<string[]> {
    return this.選択肢(this.フォーム.locator(".p-hareruya-search-form__illustrator select"));
  }

  /** サブタイプの選択肢の表示名（上からの順。先頭の「指定しない」を除く） */
  async サブタイプの選択肢(): Promise<string[]> {
    return this.選択肢(this.フォーム.locator(".p-hareruya-search-form__subtype select"));
  }

  private async 選択肢(select: Locator): Promise<string[]> {
    const texts = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
    const values = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    return texts.filter((_, i) => values[i] !== "");
  }

  /** 価格(From)・価格(To)の選択欄 */
  価格の選択欄(): { from: Locator; to: Locator } {
    const selects = this.フォーム.locator(".p-hareruya-search-form__price select");
    return { from: selects.nth(0), to: selects.nth(1) };
  }

  /** 選択欄で選ばれている選択肢の表示名 */
  async 選ばれている表示名(select: Locator): Promise<string> {
    return (await select.locator("option:checked").first().innerText()).trim();
  }

  // ---- 追加分（F03-03 の表示元・検索の実行・アドレスの確認） ----

  /**
   * 公開側の任意の画面（店舗の入口からのパス）を開き、モーダルのカテゴリ選択欄が組み立つまで待つ。応答の番号を返す。
   * TOP画面（/ja・/ja/osaka）は開発環境で重く、ときに 504 を返すので、待ちを120秒にし、504 なら開き直す（pages/front/open_top.ts）
   */
  async 画面を開く(path: string): Promise<number> {
    const url = `${BASE_URL}${path}`;
    const res = トップのパスか(path)
      ? await トップを開く(this.page, url, "domcontentloaded")
      : await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load", トップのパスか(path) ? { timeout: 120_000 } : undefined);
    await this.page.locator('#product-detailed-search-form [data-product-search-category-selects] select').first().waitFor({ state: "attached" });
    return res?.status() ?? 0;
  }

  /** PC版ナビゲーション（画面上部）の「詳細検索」ボタン */
  PC版ナビの詳細検索ボタン(): Locator {
    return this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="search"]:visible').first();
  }

  /** SP版ナビゲーション（画面下端）の「詳細検索」ボタン */
  SP版ナビの詳細検索ボタン(): Locator {
    return this.page.locator('.p-hareruya-bottom-nav__search-btn[data-modal-open="search"]:visible').first();
  }

  /** 見えている「詳細検索」の入口を押し、モーダルが開くのを待つ */
  async 入口を押す(button: Locator): Promise<void> {
    await button.waitFor({ state: "visible", timeout: 30_000 });
    await button.click({ timeout: 30_000 });
    await this.モーダル.waitFor({ state: "attached" });
    await this.page.waitForFunction(() => document.querySelector("#product-detailed-search-modal")?.classList.contains("is-visible") === true, null, { timeout: 15_000 });
  }

  /** モーダルの「商品名」の入力欄 */
  get 商品名の入力欄(): Locator {
    return this.フォーム.locator("[data-search-keyword-input]");
  }

  /** モーダルの検索ボタン */
  get 検索ボタン(): Locator {
    return this.フォーム.locator("[data-search-submit]");
  }

  /** Foil の選択肢（通常・Foil・特殊）を名前で選ぶ（チェックを付ける） */
  /** Foil の選択肢（表示名）が送る値（チェック欄の value） */
  async Foilの値(名称: string): Promise<string> {
    const label = this.フォーム.locator(".p-hareruya-search-form__foil label.p-hareruya-search-form__checkbox")
      .filter({ has: this.page.locator("span", { hasText: new RegExp(`^\\s*${名称}\\s*$`) }) }).first();
    return (await label.locator("input").getAttribute("value")) ?? "";
  }

  async Foilを選ぶ(名称: string): Promise<void> {
    const label = this.フォーム.locator(".p-hareruya-search-form__foil label.p-hareruya-search-form__checkbox")
      .filter({ has: this.page.locator("span", { hasText: new RegExp(`^\\s*${名称}\\s*$`) }) }).first();
    await label.scrollIntoViewIfNeeded();
    await label.click();
    await this.page.waitForTimeout(200);
  }

  /** 検索ボタンを押し、アドレスが変わる（検索の送信後の画面になる）のを待つ。送信前のアドレスを返す */
  async 検索する(): Promise<string> {
    const before = this.page.url();
    await Promise.all([
      this.page.waitForURL((u) => u.toString() !== before, { waitUntil: "domcontentloaded", timeout: 30_000 }),
      this.検索ボタン.click({ noWaitAfter: true }),
    ]);
    await this.page.waitForLoadState("load");
    return before;
  }

  /** いまのアドレス（パスと、引数の名前・値の組。読みやすく復号したもの） */
  アドレス(): { パス: string; 引数: [string, string][]; 文: string } {
    const u = new URL(this.page.url());
    return { パス: decodeURIComponent(u.pathname), 引数: [...u.searchParams.entries()], 文: decodeURIComponent(u.pathname + u.search) };
  }

  // ---- 追加分（2026-11-11 索引に載せた商品で検索結果を確かめるケース） ----

  /** 見出し（legend・見出しの label）がちょうど 見出し の項目の囲み */
  項目(見出し: string): Locator {
    const re = new RegExp(`^\\s*${見出し.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
    return this.フォーム.locator(".p-hareruya-form-block").filter({ has: this.page.locator("legend .c-hareruya-heading--lev3, label.c-hareruya-heading--lev3").filter({ hasText: re }) }).first();
  }

  /**
   * 項目の中のチェック欄・ラジオの選択肢を、表示名（色はアイコンの名前）で選ぶ。既に選ばれていれば何もしない。
   * 選んだ欄の名前と値を返す（記録の注記に使う）。
   */
  async 選択肢を選ぶ(見出し: string, 表示名: string): Promise<{ name: string; value: string }> {
    const block = this.項目(見出し);
    await block.waitFor({ state: "attached", timeout: 15_000 });
    const labels = block.locator("label");
    const n = await labels.count();
    for (let i = 0; i < n; i++) {
      const l = labels.nth(i);
      const input = l.locator("input").first();
      if ((await input.count()) === 0) continue;
      const aria = ((await input.getAttribute("aria-label")) ?? "").trim();
      const text = ((await l.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
      if (aria !== 表示名 && text !== 表示名) continue;
      if (!(await input.isChecked())) {
        await l.scrollIntoViewIfNeeded();
        await l.click();
        await this.page.waitForTimeout(200);
      }
      if (!(await input.isChecked())) throw new Error(`商品詳細検索の「${見出し}」の「${表示名}」を押しても選ばれない`);
      return { name: (await input.getAttribute("name")) ?? "", value: (await input.getAttribute("value")) ?? "" };
    }
    throw new Error(`商品詳細検索の「${見出し}」に「${表示名}」の選択肢が無い`);
  }

  /** 項目の中で選ばれているチェック欄の選択を外す（前の検索の条件がモーダルに残っているとき）。外した選択肢の表示名を返す */
  async 選択を外す(見出し: string): Promise<string[]> {
    const block = this.項目(見出し);
    const 外した: string[] = [];
    for (const l of await block.locator("label").all()) {
      const input = l.locator('input[type="checkbox"]').first();
      if ((await input.count()) === 0 || !(await input.isChecked())) continue;
      外した.push(((await input.getAttribute("aria-label")) ?? "").trim() || ((await l.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim());
      await l.scrollIntoViewIfNeeded();
      await l.click();
      await this.page.waitForTimeout(200);
    }
    return 外した;
  }

  /** 項目の中の選択欄（サブタイプ・イラストレーター・価格など）で、表示名がちょうど 表示名 の選択肢を選ぶ */
  async 選択欄で選ぶ(select: Locator, 表示名: string, what: string): Promise<void> {
    const opts = await select.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").replace(/\s+/g, " ").trim() })));
    const hit = opts.filter((o) => o.t === 表示名);
    if (hit.length !== 1) throw new Error(`商品詳細検索の${what}に「${表示名}」の選択肢が ${hit.length} 件（選択肢: ${opts.map((o) => o.t).slice(0, 30).join("、")}）`);
    await select.selectOption(hit[0].v);
  }

  get サブタイプの選択欄(): Locator { return this.フォーム.locator(".p-hareruya-search-form__subtype select").first(); }
  get イラストレーターの選択欄(): Locator { return this.フォーム.locator(".p-hareruya-search-form__illustrator select").first(); }

  /** 「禁止カードも表示する」のチェック欄 */
  get 禁止カードも表示する(): Locator {
    return this.フォーム.locator(".p-hareruya-search-form__format label.p-hareruya-search-form__checkbox").filter({ hasText: /^\s*禁止カードも表示する\s*$/ }).first();
  }

  // ---- 追加分（2026-11-14 エビデンスの画像で選択肢を読めるようにする） ----

  /**
   * 撮影のために、閉じた選択欄（プルダウン）を、選択肢が並んで見える一覧の形に広げる。ブラウザのプルダウンは開いても画像に写らない
   * （画面の外の部品として描かれる）ので、選択欄そのものを複数行の一覧にする。選んでいる値・選択肢は変えない。
   * 選択欄のすぐ下に「E2E の注記」の枠を置き、選択肢の数と、見せたい選択肢が上から何番目かを書く（全部を書く なら選択肢をすべて書く）。
   * 選択欄をモーダルの見える所へ動かす。戻すときは返した関数を呼ぶ（次の操作の前に戻す）。
   */
  async 選択肢を広げて見せる(select: Locator, o: { 見出し: string; 見せる?: string; 行?: number; 全部を書く?: boolean }): Promise<() => Promise<void>> {
    await select.waitFor({ state: "attached", timeout: 15_000 });
    await select.evaluate((el, o) => {
      const sel = el as HTMLSelectElement;
      const texts = Array.from(sel.options).map((x) => (x.textContent ?? "").replace(/\s+/g, " ").trim());
      const k = o.見せる === undefined ? -1 : texts.indexOf(o.見せる);
      const rows = Math.max(2, Math.min(texts.length, o.行 ?? 12));
      (sel as unknown as { __e2eSaved?: { size: string | null; style: string | null } }).__e2eSaved = { size: sel.getAttribute("size"), style: sel.getAttribute("style") };
      sel.setAttribute("size", String(rows));
      for (const [prop, v] of [["height", "auto"], ["max-height", "none"], ["appearance", "auto"], ["-webkit-appearance", "listbox"], ["background-image", "none"], ["overflow-y", "auto"], ["padding", "4px"]]) {
        sel.style.setProperty(prop, v, "important");
      }
      if (k >= 0) {
        const opt = sel.options[k];
        const rowH = sel.scrollHeight / Math.max(1, texts.length);
        const top = opt && opt.offsetTop > 0 ? opt.offsetTop : k * rowH;
        sel.scrollTop = Math.max(0, top - sel.clientHeight / 2 + rowH / 2);
      }
      const note = document.createElement("div");
      note.setAttribute("data-e2e-note", "1");
      note.style.cssText = "border:2px dashed #d00;color:#d00;background:#fff;font-size:12px;line-height:1.5;padding:4px 8px;margin:4px 0;white-space:normal;word-break:break-all;";
      const 本文 = [`E2E の注記：「${o.見出し}」の選択欄を、選択肢が見える一覧の形に広げて撮った（選択肢は${texts.length}件。先頭の「${texts[0] ?? ""}」を含む）。`];
      if (o.見せる !== undefined) 本文.push(k >= 0 ? `「${o.見せる}」は上から ${k + 1} 番目。` : `「${o.見せる}」は選択肢に無い。`);
      if (o.全部を書く) 本文.push(`選択肢（上から）：${texts.map((t, i) => `${i + 1}. ${t}`).join("／")}`);
      note.textContent = 本文.join("");
      sel.insertAdjacentElement("afterend", note);
      sel.scrollIntoView({ block: "center" });
    }, o);
    await this.page.waitForTimeout(300);
    return async () => {
      await select.evaluate((el) => {
        const sel = el as HTMLSelectElement & { __e2eSaved?: { size: string | null; style: string | null } };
        const sv = sel.__e2eSaved;
        if (sv) {
          if (sv.size === null) sel.removeAttribute("size"); else sel.setAttribute("size", sv.size);
          if (sv.style === null) sel.removeAttribute("style"); else sel.setAttribute("style", sv.style);
          sel.__e2eSaved = undefined;
        }
        const next = sel.nextElementSibling;
        if (next && next.getAttribute("data-e2e-note") === "1") next.remove();
      }).catch(() => undefined);
    };
  }

  /** フォーマットの選択肢（ラジオの表示名）の要素。表示名がちょうど 名称 のもの */
  フォーマットの選択肢の要素(名称: string): Locator {
    const re = new RegExp(`^\\s*${名称.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
    return this.フォーム.locator("[data-search-format-radios] .c-hareruya-radio__label").filter({ hasText: re }).first();
  }

  /** 商品名の入力欄の下に出る候補（ユニサジェスト）の文 */
  async 候補の文(): Promise<string[]> {
    return (await this.フォーム.locator("[data-search-keyword-suggest] li").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

}
