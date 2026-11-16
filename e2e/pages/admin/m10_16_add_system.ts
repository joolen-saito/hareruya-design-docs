/**
 * M10-16 追加システム設定画面（メニュー「設定」→「基本設定」→「追加システム設定」）。セレクタ・アドレスはここだけに書く。
 *
 * 画面の作り（アプリの AdditionalSystemController・AdditionalSystemFormType・additional_system.twig で確かめた）:
 * - 1つのフォームに全項目が並び、「登録」で全項目を送る。保存するのは、今の値と違う項目だけ（同じ値の項目は、更新者・更新日時も変わらない）。
 * - 設定の行が無い項目は、画面に既定値を出す。保存しても行は足さない（行がある項目だけを更新する）。
 * - 整数の項目は数値の入力欄（ブラウザの入力チェックが、小数などの送信を止めることがある）。
 * - 保存できたら同じ画面へ戻り、上部に「保存しました」が出る。入力の誤りは各欄の下に出る。
 * - 正本の「ピッキングリスト分割しきい値価格」「タイトルを変更する商品ID( , 区切り)」は、画面に入力欄が無い。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const PATH = "/setting/shop/additional_system";
const FORM = "form#point_form";

/** 正本の項目名 → 画面の入力欄（名前の add_system[…] の中）。画面に無い項目は null */
export const 追加システム設定の項目: Record<string, string | null> = {
  入荷通知最大数: "arrival_alert_max",
  買取専用メールアドレス: "purchase_mail_address",
  "レコメンドの検索期間（日数）": "recommend_search_days",
  買取査定申込み完了画面の自動遷移秒数: "otcbuy_order_return_seconds",
  スマレジ契約ID: "smaregi_store_id",
  スマレジアクセストークン: "smaregi_access_token",
  スマレジへの送信URL: "smaregi_request_url",
  "配送日指定が繰上る時刻(hh:mm)": "order_timing_border",
  入荷通知メールの許可: "send_notification_arrival_mail",
  まとめて買取商品ID: "bulk_purchase_id",
  固定価格商品部門ID: "fixed_price_section",
  識別ID12のメールアドレス: "otc_summary_mail_address",
  識別ID13のメールアドレス: "check_bric_mail_address",
  識別ID14のメールアドレス: "check_nrpu_mail_address",
  識別ID15のメールアドレス: "adjust_point_variance_mail_addr",
  識別ID16のメールアドレス: "shopping_error_mail_address",
  識別ID17のメールアドレス: "check_payment_error_mail_address",
  識別ID18のメールアドレス: "check_id_expired_mail_address",
  Small_packetが選択可能な合計金額の閾値: "small_packet_max_price",
  英語サイト専用タグID: "slider_en_only_tag_id",
  "管理画面自動ログアウト時間（分）": "auto_logout_time",
  スマレジ通信エラー送信メールアドレス: "smaregi_error_mail_address",
  ピッキングリスト分割しきい値価格: null,
  "タイトルを変更する商品ID( , 区切り)": null,
};
/** 識別ID12〜18のメールアドレス（設計書の識別ID 12〜18 の7項目） */
export const 識別ID12から18 = [12, 13, 14, 15, 16, 17, 18].map((n) => `識別ID${n}のメールアドレス`);

/** 画面の全項目の値（入力欄の名前 → 値）。元へ戻すための控え */
export type 追加システム設定の控え = Record<string, string>;

export type 登録の結果 = { 送った: boolean; 応答: number | null; 止めた項目: string[] };

export class AddSystemPage {
  constructor(private page: Page) {}

  /** メニューの大項目（設定）を開く（手順1の「データ管理」にあたる） */
  async 大項目を開く(): Promise<void> {
    const group = this.page.locator('.c-mainNavArea a.c-mainNavArea__navItemTitle[href="#nav-setting"]');
    await expect(group, "メニューの「設定」").toBeVisible();
    if ((await group.getAttribute("aria-expanded")) !== "true") await group.click();
    await expect(this.page.locator("#nav-setting"), "「設定」の下のメニュー").toBeVisible();
  }

  /** 「基本設定」を開き、「追加システム設定」を押す */
  async 追加システム設定を押す(): Promise<void> {
    const sub = this.page.locator('#nav-setting a.c-mainNavArea__navItemSubTitle[href="#nav-basic_info"]');
    if ((await sub.count()) > 0 && (await sub.getAttribute("aria-expanded")) === "false") await sub.click();
    const link = this.page.locator("#nav-setting").getByRole("link", { name: "追加システム設定", exact: true });
    await expect(link, "メニューの「追加システム設定」").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname.endsWith(PATH), { waitUntil: "load", timeout: 120_000 }), link.click({ noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
  }

  /** 追加システム設定画面が開いているか */
  async 開いているか(): Promise<boolean> {
    return new URL(this.page.url()).pathname.endsWith(PATH) && (await this.page.locator(FORM).count()) > 0;
  }

  /** アドレスで追加システム設定画面を開く（管理画面のホストで開く） */
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl(PATH), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator(FORM), "追加システム設定の入力欄").toBeVisible({ timeout: 30_000 });
  }

  private 名前(項目: string): string | null {
    if (!(項目 in 追加システム設定の項目)) throw new Error(`追加システム設定に「${項目}」という正本の項目は無い（部品の対応表に無い）`);
    return 追加システム設定の項目[項目];
  }

  欄(項目: string): Locator {
    const n = this.名前(項目);
    return this.page.locator(`${FORM} [name="add_system[${n ?? "__画面に無い項目__"}]"]`);
  }

  /** 画面に入力欄があるか */
  async 欄がある(項目: string): Promise<boolean> {
    if (this.名前(項目) === null) return false;
    return (await this.欄(項目).count()) > 0;
  }

  /** 項目に値を入れる。入力欄が無ければ落とす（手順が画面で実行できない） */
  async 入れる(項目: string, 値: string): Promise<void> {
    if (!(await this.欄がある(項目))) throw new Error(`追加システム設定画面に「${項目}」の入力欄が無い`);
    const l = this.欄(項目);
    if ((await l.evaluate((e) => e.tagName)) === "SELECT") await l.selectOption({ label: 値 }, { timeout: 30_000 });
    else await l.fill(値, { timeout: 30_000 });
  }

  /** 項目の表示値（選択肢は選ばれている表示名）。入力欄が無ければ null */
  async 値(項目: string): Promise<string | null> {
    if (!(await this.欄がある(項目))) return null;
    const l = this.欄(項目);
    if ((await l.evaluate((e) => e.tagName)) === "SELECT") return ((await l.locator("option:checked").first().textContent()) ?? "").trim();
    return l.inputValue();
  }

  get 登録ボタン(): Locator { return this.page.locator(`${FORM} button[type=submit]`).first(); }

  /** なりすまし対策トークンの欄の値を書き換える（開発者ツールでの書き換えにあたる） */
  async トークンを書き換える(値: string): Promise<void> {
    await this.page.locator(`${FORM} [name="add_system[_token]"]`).evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /**
   * 「登録」を押す。送信されたら、保存の応答のあとに移った画面の読み込みまで待つ。
   * ブラウザの入力チェックが送信を止めたら、送らずに止めた項目を返す（止まったこと自体が結果）。
   */
  async 登録する(): Promise<登録の結果> {
    const req = this.page.waitForRequest((r) => r.method() === "POST" && new URL(r.url()).pathname.endsWith(`${PATH}/update`), { timeout: 15_000 }).catch(() => null);
    await this.登録ボタン.click({ timeout: 30_000 });
    const sent = await req;
    if (!sent) {
      const 止めた項目 = await this.page.locator(`${FORM} input:invalid, ${FORM} select:invalid`).evaluateAll((es) => es.map((e) => `${(e as HTMLInputElement).name}（${(e as HTMLInputElement).validationMessage}）`));
      return { 送った: false, 応答: null, 止めた項目 };
    }
    const res = await sent.response();
    const status = res ? res.status() : null;
    // 保存できたときは同じ画面へ移し直される。移った先の読み込みを待つ（保存の結果の表示を拾うため）
    if (status !== null && status >= 300 && status < 400) {
      await this.page.waitForURL((u) => u.pathname.endsWith(PATH), { timeout: 60_000, waitUntil: "load" }).catch(() => undefined);
    } else {
      await this.page.waitForURL((u) => u.pathname.endsWith(`${PATH}/update`), { timeout: 60_000, waitUntil: "load" }).catch(() => undefined);
    }
    await this.page.waitForLoadState("load");
    return { 送った: true, 応答: status, 止めた項目: [] };
  }

  /**
   * 「登録」を押し、送信されたときは応答の画面への移動まで待つ（ケースの手順用）。
   * 登録する は、保存できて同じアドレスへ移し直されるとき、押す前の画面のアドレスで待ちが済んでしまう（画面の移動を待たない）ので、
   * 押す前から画面の移動を待ち受けておく。送られなかったとき（ブラウザの入力チェック）は待たない。
   */
  async 登録して移るまで待つ(): Promise<登録の結果> {
    const 移動 = this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).then(() => true, () => false);
    const r = await this.登録する();
    if (r.送った) await 移動;
    await this.page.waitForLoadState("load");
    return r;
  }

  /** 「登録」を押して、保存できたこと（「保存しました」）を確かめる */
  async 登録して保存を確かめる(what: string): Promise<void> {
    const r = await this.登録する();
    if (!r.送った) throw new Error(`${what}: ブラウザの入力チェックが送信を止めた（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
  }

  get 完了メッセージ(): Locator { return this.page.locator(".alert-success").filter({ hasText: "保存しました" }); }

  /** 画面上部の入力の誤りの表示（各欄の下の誤り） */
  get 入力の誤り(): Locator { return this.page.locator(`${FORM} .invalid-feedback, ${FORM} .form-error-message`); }

  /** 画面の全項目の値（入力欄の名前 → 値。トークンは除く） */
  async 全部読む(): Promise<追加システム設定の控え> {
    return this.page.locator(FORM).evaluate((form) => {
      const out: Record<string, string> = {};
      for (const e of Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"))) {
        if (!e.name || e.name.endsWith("[_token]") || (e as HTMLInputElement).type === "submit") continue;
        out[e.name] = e.value;
      }
      return out;
    });
  }

  /** 控えた全項目の値を入れる */
  async 全部書く(v: 追加システム設定の控え): Promise<void> {
    for (const [name, val] of Object.entries(v)) {
      const l = this.page.locator(`${FORM} [name="${name}"]`);
      if ((await l.evaluate((e) => e.tagName)) === "SELECT") await l.selectOption(val, { timeout: 30_000 });
      else await l.fill(val, { timeout: 30_000 });
    }
  }
}
