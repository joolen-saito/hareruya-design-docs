// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-20 配送先新規登録・変更（フロントのマイページの配送先一覧・入力・確認・削除）の操作。セレクタはここだけに書く。正本: cases/F06-20_test_cases.tsv
 * 一覧 → 「新しい住所を追加」／「編集」 → 入力 → 「確認画面へ」 → 確認 →「登録する」、一覧の「削除」は確認のダイアログ（OK で削除）。
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const 一覧のパス = "/ja/mypage/delivery";
export const 新規のパス = "/ja/mypage/delivery/new/edit";
export const 編集のパス = (id: string, 言語 = "ja") => `/${言語}/mypage/delivery/${id}/edit`;

export type 配送先の入力 = {
  配送先名称: string; 姓: string; 名: string; セイ?: string; メイ?: string;
  国?: "Japan" | "United States";
  郵便番号?: string; 海外郵便番号?: string; 都道府県?: string;
  住所1: string; 住所2: string; 住所3?: string;
  /** 「03-1234-5678」（ハイフンあり）か数字だけ */
  電話: string; 会社名?: string;
};

export function 電話を分ける(n: string): [string, string, string] {
  if (n.includes("-")) { const p = n.split("-"); return [p[0], p[1], p[2]]; }
  const d = n.replace(/\D/g, "");
  return d.length >= 11 ? [d.slice(0, 3), d.slice(3, 7), d.slice(7)] : [d.slice(0, 2), d.slice(2, 6), d.slice(6)];
}

export class DeliveryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  // ---- 画面を開く ----
  async 開く(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async 一覧を開く(): Promise<void> {
    await this.開く(一覧のパス);
    await expect(this.page.locator(".p-hareruya-delivery-list__container"), "配送先一覧画面").toBeVisible({ timeout: T });
  }
  async 入力画面を開く(path: string): Promise<void> {
    await this.開く(path);
    await expect(this.フォーム, "配送先新規登録・変更画面の入力フォーム").toBeVisible({ timeout: T });
  }
  get 一覧画面である(): Promise<boolean> { return this.page.locator(".p-hareruya-delivery-list__container").isVisible(); }
  get 入力画面である(): Promise<boolean> { return this.フォーム.isVisible(); }

  // ---- 一覧 ----
  get カード一覧(): Locator { return this.page.locator("li.p-hareruya-shipping-address__item"); }
  /** 会員情報住所の枠（先頭） */
  get 会員情報住所の枠(): Locator { return this.カード一覧.first(); }
  /** 登録配送先の枠（配送先名称が一致するもの） */
  カード(名称: string): Locator {
    return this.カード一覧.filter({ has: this.page.locator(".p-hareruya-shipping-address__title", { hasText: new RegExp(`^\\s*${esc(名称)}\\s*$`) }) });
  }
  async 枠の文(card: Locator): Promise<string> { return ((await card.innerText()) ?? "").replace(/\s+/g, " ").trim(); }
  /** 登録配送先の枠の数（会員情報住所の枠を除く） */
  async 登録配送先の数(): Promise<number> { return (await this.カード一覧.count()) - 1; }
  /** 一覧の編集リンクにある配送先の番号（上から順） */
  async 編集リンクの番号(): Promise<string[]> {
    const hrefs = await this.page.locator('li.p-hareruya-shipping-address__item a[href$="/edit"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
    return hrefs.map((h) => /\/delivery\/(\d+)\/edit/.exec(h)?.[1] ?? "").filter(Boolean);
  }
  async 番号(card: Locator): Promise<string> {
    const href = (await card.locator('a[href$="/edit"]').first().getAttribute("href")) ?? "";
    const id = /\/delivery\/(\d+)\/edit/.exec(href)?.[1];
    if (!id) throw new Error("枠の編集リンクから配送先の番号を読めない");
    return id;
  }
  get 新しい住所を追加(): Locator { return this.page.locator('.p-hareruya-delivery-list__new-address a[href$="/mypage/delivery/new/edit"]'); }
  get 上限のエラー(): Locator { return this.page.locator(".p-hareruya-delivery-list__new-address .ec-errorMessage"); }
  /** 画面上部のエラー枠（上限を超えたときに一覧へ戻される表示）の文 */
  async 上部のエラー文(): Promise<string> {
    const l = this.page.locator(".p-hareruya-delivery-list__flash, .ec-errorMessage, .alert-danger");
    return [...new Set((await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").replace(/×/g, "").trim()).filter(Boolean))].join(" / ");
  }
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-delivery-list__btn a", { hasText: "マイページ" }); }
  async 編集ボタンを押す(card: Locator): Promise<void> { await this.押して遷移する(card.locator('a[href$="/edit"]').first()); }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  /** 現在地は押せない表示。押しても移らないことを確かめるため、押す操作そのものは送る（押せないので force で送る） */
  async 現在地を押す(): Promise<void> {
    await this.パンくず現在地.click({ timeout: 10_000, force: true }).catch(() => undefined);
    await this.page.waitForTimeout(1_500);
    await this.page.waitForLoadState("load");
  }
  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      // 固定ヘッダーが要素の上に重なって普通に押せないとき。押す操作そのものを要素へ直接送って続け、注記を残す
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }

  // ---- 入力画面 ----
  get フォーム(): Locator { return this.page.locator("form#customer_address_form"); }
  f(name: string): Locator { return this.フォーム.locator(`[name$="[${name}]"]`).first(); }
  get 戻るボタン(): Locator { return this.page.locator(".p-hareruya-entry__form-actions a", { hasText: "戻る" }); }
  get 確認画面へボタン(): Locator { return this.page.locator("#submit_button"); }
  /** 入力項目の見出し（ラベル・凡例）の文 */
  async 見出し一覧(): Promise<string[]> {
    const l = this.フォーム.locator(".p-hareruya-form-block__label");
    return (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  async 表示中(name: string): Promise<boolean> { return (await this.f(name).count()) > 0 && (await this.f(name).isVisible()); }
  async 選択中の表示(name: string): Promise<string> {
    return ((await this.f(name).locator("option:checked").first().innerText({ timeout: T }).catch(() => "")) ?? "").trim();
  }
  async 値(name: string): Promise<string> { return this.f(name).inputValue({ timeout: T }); }
  async 国を選ぶ(国: string): Promise<void> {
    if ((await this.選択中の表示("country")) === 国) return;
    // 国を変えると、画面のスクリプトがフォームを送り直して入力欄を国ごとに入れ替える
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.f("country").selectOption({ label: 国 }, { timeout: T })]);
    await this.page.waitForLoadState("load");
    await expect(this.f("country").locator("option:checked"), "国の選択").toHaveText(国, { timeout: T });
  }
  /** 郵便番号の欄に利用者が打つのと同じに1文字ずつ入れる（住所の補完は入力のキー操作を見ている）。補完の結果が入るのを少し待つ */
  async 郵便番号を打つ(欄: string, 値: string): Promise<void> {
    await this.f(欄).click({ timeout: T });
    await this.f(欄).pressSequentially(値, { delay: 80, timeout: T });
  }
  async 補完を待つ(): Promise<void> {
    // 郵便番号から住所を引くのは外部の郵便番号検索のスクリプト。結果が入るのを少し待つ
    await this.page.waitForTimeout(5_000);
  }
  /** 全項目を入力する（国を先に選ぶ。まとめて入れるので、郵便番号の補完は働かない） */
  async 入力する(v: 配送先の入力): Promise<void> {
    const country = v.国 ?? "Japan";
    await this.国を選ぶ(country);
    await this.f("address_name").fill(v.配送先名称, { timeout: T });
    await this.f("name01").fill(v.姓, { timeout: T });
    await this.f("name02").fill(v.名, { timeout: T });
    if (v.セイ !== undefined && (await this.f("kana01").count()) > 0) await this.f("kana01").fill(v.セイ, { timeout: T });
    if (v.メイ !== undefined && (await this.f("kana02").count()) > 0) await this.f("kana02").fill(v.メイ, { timeout: T });
    if (country === "Japan") {
      const z = (v.郵便番号 ?? "").replace(/\D/g, "");
      await this.f("postalCode01").fill(z.slice(0, 3), { timeout: T });
      await this.f("postalCode02").fill(z.slice(3), { timeout: T });
      await this.f("pref").selectOption({ label: v.都道府県 ?? "東京都" }, { timeout: T });
    } else {
      await this.f("abroadPostalCode").fill(v.海外郵便番号 ?? "", { timeout: T });
    }
    await this.f("addr01").fill(v.住所1, { timeout: T });
    await this.f("addr02").fill(v.住所2, { timeout: T });
    if (v.住所3 !== undefined && (await this.f("addr03").count()) > 0) await this.f("addr03").fill(v.住所3, { timeout: T });
    const [a, b, c] = 電話を分ける(v.電話);
    await this.f("tel01").fill(a, { timeout: T });
    await this.f("tel02").fill(b, { timeout: T });
    await this.f("tel03").fill(c, { timeout: T });
    if (v.会社名 !== undefined) await this.f("company_name").fill(v.会社名, { timeout: T });
  }
  /** 入力画面に表示されている値（編集画面の確認用） */
  async 入力値を読む(): Promise<Record<string, string>> {
    const sel = (n: string) => this.選択中の表示(n);
    return {
      配送先名称: await this.値("address_name"), 姓: await this.値("name01"), 名: await this.値("name02"),
      セイ: await this.値("kana01"), メイ: await this.値("kana02"),
      国: await sel("country"), 郵便番号: `${await this.値("postalCode01")}-${await this.値("postalCode02")}`, 都道府県: await sel("pref"),
      住所1: await this.値("addr01"), 住所2: await this.値("addr02"), 住所3: (await this.f("addr03").count()) > 0 ? await this.値("addr03") : "",
      電話番号: `${await this.値("tel01")}-${await this.値("tel02")}-${await this.値("tel03")}`, 会社名: await this.値("company_name"),
    };
  }
  /** 「確認画面へ」を押す。ブラウザの入力チェックで止まったら sent=false */
  async 確認画面へ(): Promise<{ sent: boolean }> {
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }).then(() => true, () => false);
    await this.確認画面へボタン.click({ timeout: T });
    const sent = await nav;
    if (sent) await this.page.waitForLoadState("load");
    return { sent };
  }
  get 登録するボタン(): Locator { return this.page.getByRole("button", { name: "登録する" }); }
  async 確認画面である(): Promise<boolean> { return (await this.登録するボタン.count()) > 0; }
  async 登録する(): Promise<void> {
    await expect(this.登録するボタン, "確認画面の「登録する」").toBeVisible({ timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.登録するボタン.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  /** 入力画面のサーバー側の入力エラーの文 */
  async エラー文(): Promise<string[]> {
    const l = this.page.locator(".c-hareruya-form-input__field-error, .c-hareruya-form-input__field-error--server, .ec-errorMessage");
    return [...new Set((await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean))];
  }
  get 登録エラー画面である(): boolean { return /\/entry\/regist_error/.test(this.path); }

  // ---- 新規登録（シードが使う。一覧 → 「新しい住所を追加」→ 入力 → 確認 → 登録）。登録した配送先の番号を返す ----
  async 配送先を登録する(v: 配送先の入力, what: string): Promise<string> {
    await this.一覧を開く();
    const before = new Set(await this.編集リンクの番号());
    await expect(this.新しい住所を追加, `${what}: 配送先一覧の「新しい住所を追加」`).toBeVisible({ timeout: T });
    await this.押して遷移する(this.新しい住所を追加);
    await expect(this.フォーム, `${what}: 配送先新規登録・変更画面`).toBeVisible({ timeout: T });
    await this.入力する(v);
    const r = await this.確認画面へ();
    if (!r.sent || !(await this.確認画面である())) throw new Error(`${what}: 配送先の入力が確認画面へ進まない（${this.page.url()}）: ${(await this.エラー文()).join(" / ") || "入力エラーの表示なし"}`);
    await this.登録する();
    if (this.path !== 一覧のパス) throw new Error(`${what}: 登録後に配送先一覧へ戻らない（${this.page.url()}）`);
    const added = (await this.編集リンクの番号()).filter((id) => !before.has(id));
    if (added.length !== 1) throw new Error(`${what}: 登録した配送先の番号が1つに定まらない（増えた編集リンク ${added.length} 件）`);
    return added[0];
  }

  // ---- 削除 ----
  削除ボタン(card: Locator): Locator { return card.locator('a[data-method="delete"]').first(); }
  /**
   * 削除ボタンを押し、確認のダイアログ（JavaScript の確認）が出たところで止める。ダイアログの文と、応える操作を返す。
   * 応える操作は、正本の「削除確認で「OK」／「キャンセル」を押す」の手順で呼ぶ（それまでダイアログは開いたまま）。
   */
  async 削除ボタンを押す(card: Locator): Promise<{ 文: string; 応える: (応答: "OK" | "キャンセル") => Promise<void> }> {
    const btn = this.削除ボタン(card);
    await btn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const dp = this.page.waitForEvent("dialog", { timeout: T });
    const clicking = btn.click({ timeout: 60_000 }).catch(() => undefined);
    const d = await dp;
    return {
      文: d.message(),
      応える: async (応答) => {
        if (応答 === "OK") {
          await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null), d.accept()]);
          await clicking;
          await this.page.waitForLoadState("load");
        } else {
          await d.dismiss();
          await clicking;
          await this.page.waitForTimeout(1_500);
        }
      },
    };
  }
  /**
   * 削除のリクエスト（削除ボタンの確認で OK を押すと送られる）を、送る途中で書き換える仕掛けを先に用意する（確認のダイアログが開いている間は
   * 画面の中の処理もブラウザへの新しい指示も止まるため、仕掛けはダイアログが出る前に置き、書き換え方は返す関数で後から決める）。
   * 開発者ツールで送信前になりすまし対策トークンを消す・別の値にするのと同じ。方法が決まるまでは何も書き換えない。
   */
  async 削除リクエストの書き換えを用意する(): Promise<(方法: "消す" | string) => void> {
    let 方法: "消す" | string | null = null;
    await this.page.route(/\/mypage\/delivery\/\d+\/delete/, async (route) => {
      if (方法 === null) { await route.continue(); return; }
      const body = new URLSearchParams(route.request().postData() ?? "");
      if (方法 === "消す") body.delete("_token"); else body.set("_token", 方法);
      await route.continue({ postData: body.toString() });
    });
    return (m) => { 方法 = m; };
  }
  async トークンを読む(card: Locator): Promise<string> { return (await this.削除ボタン(card).getAttribute("data-csrf-token")) ?? ""; }
  async 削除のアドレス(card: Locator): Promise<string> { return this.削除ボタン(card).evaluate((el) => (el as HTMLAnchorElement).href); }

  // ---- リクエストを直接送る（開発者ツールで書き換えて送るのと同じ。ログイン済みのセッションのまま） ----
  async 削除リクエストを送る(url: string, token: string): Promise<number> {
    const res = await this.page.request.fetch(url, { method: "DELETE", form: { _token: token }, maxRedirects: 0, failOnStatusCode: false });
    return res.status();
  }
  /** 編集画面のフォームの送信内容（隠し項目を含む）をそのまま読む */
  async フォームの送信内容(): Promise<Record<string, string>> {
    return this.フォーム.evaluate((f) => Object.fromEntries([...new FormData(f as HTMLFormElement).entries()].map(([k, v]) => [k, String(v)])));
  }
  async 編集リクエストを送る(path: string, form: Record<string, string>): Promise<number> {
    const res = await this.page.request.post(`${BASE_URL}${path}`, { form, maxRedirects: 0, failOnStatusCode: false });
    return res.status();
  }
}
