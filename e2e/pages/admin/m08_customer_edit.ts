/**
 * M08-04 会員登録/編集の画面操作。セレクタはここにだけ書く。
 * - 登録ボタンを押すと、本人確認用情報（お名前・フリガナ・生年月日・住所）が変わったとき（本人確認済みの会員）は、ブラウザの確認ダイアログが出る。
 * - オンライン本人確認は、ボタンで開くポップアップ（身分証有効期限の欄と「確認済に変更する」ボタン）で行う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;

export type 本人確認 = "未確認" | "確認中" | "オンライン本人確認済み" | "簡易書留確認済み";
export type ダイアログ応答 = "続行" | "取り消し";

export class M08CustomerEditPage {
  readonly form: Locator;
  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.form = page.locator("form#customer_form");
  }

  f(name: string): Locator { return this.page.locator(`[name="admin_customer[${name}]"]`); }

  /** 会員登録/編集画面を開く。開けなかった（404 など）ときは応答の状態を返す */
  async open(会員ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/customer/${会員ID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    if (res?.status() === 200) await expect(this.f("email"), "会員登録/編集画面").toBeVisible({ timeout: T });
    return res?.status() ?? 0;
  }

  async set(name: string, 値: string): Promise<void> { await this.f(name).fill(値, { timeout: T }); }
  async get(name: string): Promise<string> { return this.f(name).inputValue({ timeout: T }); }

  /** メールアドレスなど、入力欄の値（フォームの項目名で指定） */
  async 選ぶ(name: string, 表示: string): Promise<void> {
    const sel = this.f(name);
    const have = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
    const hit = have.find((t) => t === 表示) ?? have.find((t) => t.startsWith(表示));
    if (hit === undefined) throw new Error(`選択肢「${表示}」が無い（${name}: ${have.join("、")}）`);
    await sel.selectOption({ label: hit }, { timeout: T });
  }
  /** 選択欄を、選択肢の値（value）で選ぶ（生年月日の年・月・日など） */
  async 値で選ぶ(name: string, 値: string): Promise<void> { await this.f(name).selectOption(値, { timeout: T }); }
  async 選択中(name: string): Promise<string> {
    return ((await this.f(name).locator("option:checked").first().innerText({ timeout: T }).catch(() => "")) ?? "").trim();
  }

  /** ラジオ（性別・本人確認ステータス・メールマガジン配信フラグ）を、ラベルで選ぶ */
  async ラジオを選ぶ(name: string, ラベル: string): Promise<void> {
    const label = this.page.locator(`label[for^="admin_customer_${name.replace(/\]\[/g, "_").replace(/\]/g, "")}_"]`).filter({ hasText: new RegExp(`^\\s*${ラベル}\\s*$`) });
    await expect(label, `${name} の選択肢「${ラベル}」`).toHaveCount(1, { timeout: T });
    await label.click({ timeout: T });
  }
  async ラジオ選択中(name: string): Promise<string> {
    const checked = this.page.locator(`input[name="admin_customer[${name}]"]:checked`).first();
    if ((await checked.count()) === 0) return "";
    const id = await checked.getAttribute("id");
    return ((await this.page.locator(`label[for="${id}"]`).first().innerText().catch(() => "")) ?? "").trim();
  }
  async 全選択肢(name: string): Promise<string[]> {
    return (await this.page.locator(`input[name="admin_customer[${name}]"]`).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).id)))
      .length ? (await this.page.locator(`label[for^="admin_customer_${name.replace(/\]\[/g, "_").replace(/\]/g, "")}_"]`).allInnerTexts()).map((t) => t.trim()) : [];
  }

  /** ラジオを、選んでいない状態にする（ブラウザの操作では選びを外せないので、画面のスクリプトで外す。正本の外の補い） */
  async ラジオの選びを外す(name: string): Promise<void> {
    await this.page.locator(`input[name="admin_customer[${name}]"]`).evaluateAll((els) => els.forEach((e) => { (e as HTMLInputElement).checked = false; }));
  }

  get 会員ステータス(): Locator { return this.f("status"); }
  get 登録ボタン(): Locator { return this.page.locator("#register_btn"); }

  /**
   * 会員情報を登録ボタンを押す。本人確認ステータス変更の確認ダイアログが出たら、応答のとおりに答える（出た文を返す。出なければ null）。
   * 保存された（成功メッセージ）か、取り消してそのままか、入力エラーかは呼び出し側が画面で確かめる。
   */
  async 登録する(応答: ダイアログ応答 = "続行"): Promise<{ ダイアログ: string | null }> {
    const p = await this.登録を押す();
    const 文 = p.ダイアログの文;
    await p.答える(応答);
    return { ダイアログ: 文 };
  }

  /**
   * 登録ボタンを押す（手順の「押す」と「確認で続行／取り消しを選ぶ」を分けられる）。確認ダイアログが開けば開いたまま返し、答える() で応答する。
   * ダイアログが出なければ、押した結果の画面まで待ってから返す。
   */
  async 登録を押す(): Promise<{ ダイアログの文: string | null; 答える: (応答?: ダイアログ応答) => Promise<void> }> {
    const navP = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 }).then(() => true, () => false);
    const dialogP = this.page.waitForEvent("dialog", { timeout: 4_000 }).catch(() => null);
    const clickP = this.登録ボタン.click({ timeout: T });
    clickP.catch(() => {});
    const d = await dialogP;
    const settle = async () => { await this.page.waitForLoadState("load"); await this.page.waitForTimeout(300); };
    if (!d) {
      await clickP;
      await navP;
      await settle();
      return { ダイアログの文: null, 答える: async () => undefined };
    }
    return {
      ダイアログの文: d.message(),
      答える: async (応答: ダイアログ応答 = "続行") => {
        await (応答 === "続行" ? d.accept() : d.dismiss());
        await clickP;
        if (応答 === "続行") await navP;
        await settle();
      },
    };
  }

  /** 成功メッセージ（保存した）の文。出ていなければ null */
  async 成功メッセージ(): Promise<string | null> {
    const ok = this.page.locator(".alert-success");
    if ((await ok.count()) === 0) return null;
    return (await ok.first().innerText()).replace(/\s+/g, " ").trim();
  }
  async エラー文(): Promise<string[]> {
    return (await this.page.locator(".alert-danger, .invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
  }

  // ---- オンライン本人確認 ----
  get オンライン本人確認ボタン(): Locator { return this.page.locator('a[data-bs-target="#online_identification_detail"]'); }
  get オンライン本人確認ポップアップ(): Locator { return this.page.locator("#online_identification_detail"); }
  /** オンライン本人確認ボタンを押し、ポップアップで身分証有効期限（空なら入れない）を入れて「確認済に変更する」を押す */
  async オンライン本人確認済みにする(身分証有効期限?: string): Promise<void> {
    await this.オンライン本人確認ボタン.click({ timeout: T });
    const pop = this.オンライン本人確認ポップアップ;
    await expect(pop, "オンライン本人確認のポップアップ").toBeVisible({ timeout: T });
    if (身分証有効期限) await this.f("Player][id_expiration_date").fill(身分証有効期限, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      pop.locator("#submit_confirm").click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
}
