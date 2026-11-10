/**
 * M11-02 メンバー管理（メンバー管理画面＝新規登録・編集）の操作。セレクタはここだけに書く。正本: cases/M11-02_test_cases.tsv
 * 既存の pages/admin/member.ts（ensureMember など）は変えず、ケースが見る項目（2段階認証・自動ログアウト・スマレジ用アカウント・稼働・パスワード欄）を足す。
 * 開発環境には同じ店名（東京店・大阪店など）の店舗が複数あるので、店舗の選択欄は番号（店舗ID）で選ぶ。
 */
import { Locator, Page, Response, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;

export type メンバーの入力 = {
  名前?: string; 所属店舗ID?: string; 所属?: string; ログインID?: string; メールアドレス?: string; パスワード?: string; パスワード確認?: string;
  権限?: string; デフォルト検索表示店舗ID?: string | ""; 編集可能店舗ID?: string[]; 稼働?: "稼働" | "非稼働";
  二段階認証?: boolean; 自動ログアウト?: boolean; スマレジ用アカウント?: boolean;
};

export class MemberEditPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  private f(name: string): Locator { return this.page.locator(`[name="admin_member[${name}]"]`); }
  get 名前欄(): Locator { return this.f("name"); }
  get ログインID欄(): Locator { return this.f("login_id"); }
  get メール欄(): Locator { return this.f("email"); }
  get パスワード欄(): Locator { return this.page.locator('[name="admin_member[plain_password][first]"]'); }
  get パスワード確認欄(): Locator { return this.page.locator('[name="admin_member[plain_password][second]"]'); }
  get 所属欄(): Locator { return this.f("department"); }
  get 権限欄(): Locator { return this.f("Authority"); }
  get 所属店舗欄(): Locator { return this.f("baseInfo"); }
  get デフォルト検索表示店舗欄(): Locator { return this.f("defaultSearchBaseInfo"); }
  get 編集可能店舗欄(): Locator { return this.page.locator('[name="admin_member[editableBaseInfos][]"]'); }
  get 二段階認証欄(): Locator { return this.f("two_factor_auth_enabled"); }
  get 自動ログアウト欄(): Locator { return this.f("isAutoLogout"); }
  get スマレジ用アカウント欄(): Locator { return this.f("smaregiMemberFlg"); }
  get 登録ボタン(): Locator { return this.page.locator('#member_form button[type="submit"], button[type="submit"][form="member_form"]').first(); }
  稼働の選択(名前: "稼働" | "非稼働"): Locator { return this.page.getByLabel(名前, { exact: true }); }
  get メンバー管理リンク(): Locator { return this.page.locator('a.c-baseLink[href$="/setting/system/member"]').first(); }

  async 新規登録を開く(): Promise<void> {
    await this.page.goto(adminUrl("/setting/system/member/new"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** メンバー一覧の「新規登録」ボタンから開く */
  async 一覧から新規登録を開く(): Promise<void> {
    await this.page.goto(adminUrl("/setting/system/member"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.page.getByRole("link", { name: "新規登録" }).first().click()]);
  }
  async 編集を開く(メンバーID: string): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/setting/system/member/${メンバーID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  path(): string { return new URL(this.page.url()).pathname; }

  /** 選択欄の選択肢の文字（空の「選択してください」は除く） */
  async 選択肢(l: Locator): Promise<string[]> {
    return (await l.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim())));
  }
  /** 選択中の値（番号）と文字 */
  async 選択中(l: Locator): Promise<{ 値: string[]; 文字: string[] }> {
    const r = await l.locator("option:checked").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })));
    return { 値: r.map((x) => x.v).filter(Boolean), 文字: r.filter((x) => x.v).map((x) => x.t) };
  }

  private async 番号で選ぶ(l: Locator, 番号: string[] | string): Promise<void> {
    const want = Array.isArray(番号) ? 番号 : [番号];
    const have = await l.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    for (const w of want) if (w && !have.includes(w)) throw new Error(`選択欄に番号 ${w} の選択肢が無い`);
    await l.selectOption(want.filter(Boolean).map((value) => ({ value })), { force: true });
  }
  private async 名前で選ぶ(l: Locator, 名前: string): Promise<void> {
    const have = await this.選択肢(l);
    if (!have.includes(名前)) throw new Error(`選択肢「${名前}」が無い（ある選択肢: ${have.join("、")}）`);
    await l.selectOption({ label: 名前 });
  }
  private async チェック(l: Locator, on: boolean): Promise<void> {
    if ((await l.isChecked()) === on) return;
    const id = await l.getAttribute("id");
    const label = id ? this.page.locator(`label[for="${id}"]`) : null;
    if (label && (await label.count()) > 0 && (await label.first().isVisible())) await label.first().click();
    else await l.setChecked(on, { force: true });
    if ((await l.isChecked()) !== on) await l.setChecked(on, { force: true });
  }

  /** 渡した項目だけを入れる（渡さない項目は触らない）。空の文字列は空にする */
  async 入れる(v: メンバーの入力): Promise<void> {
    if (v.名前 !== undefined) await this.名前欄.fill(v.名前);
    if (v.所属店舗ID !== undefined) await this.番号で選ぶ(this.所属店舗欄, v.所属店舗ID ? [v.所属店舗ID] : [""]);
    if (v.所属 !== undefined) { if (v.所属) await this.名前で選ぶ(this.所属欄, v.所属); else await this.所属欄.selectOption({ value: "" }); }
    if (v.ログインID !== undefined) await this.ログインID欄.fill(v.ログインID);
    if (v.メールアドレス !== undefined) await this.メール欄.fill(v.メールアドレス);
    if (v.パスワード !== undefined) await this.パスワード欄.fill(v.パスワード);
    if (v.パスワード確認 !== undefined) await this.パスワード確認欄.fill(v.パスワード確認);
    else if (v.パスワード !== undefined) await this.パスワード確認欄.fill(v.パスワード);
    if (v.権限 !== undefined) { if (v.権限) await this.名前で選ぶ(this.権限欄, v.権限); else await this.権限欄.selectOption({ value: "" }); }
    // デフォルト検索表示店舗の選択肢は、編集可能店舗の選択に連動して変わる。編集可能店舗を先に入れる
    if (v.編集可能店舗ID !== undefined) await this.番号で選ぶ(this.編集可能店舗欄, v.編集可能店舗ID);
    if (v.デフォルト検索表示店舗ID !== undefined) {
      if (v.デフォルト検索表示店舗ID) await this.番号で選ぶ(this.デフォルト検索表示店舗欄, v.デフォルト検索表示店舗ID);
      else await this.デフォルト検索表示店舗欄.selectOption({ value: "" });
    }
    if (v.稼働) await this.稼働の選択(v.稼働).check({ force: true });
    if (v.二段階認証 !== undefined) await this.チェック(this.二段階認証欄, v.二段階認証);
    if (v.自動ログアウト !== undefined) await this.チェック(this.自動ログアウト欄, v.自動ログアウト);
    if (v.スマレジ用アカウント !== undefined) await this.チェック(this.スマレジ用アカウント欄, v.スマレジ用アカウント);
  }

  /** 登録ボタンを押し、送信の応答と移った先を返す（ブラウザの入力チェックで送信が止まったときは 送った=false） */
  async 登録を押す(): Promise<{ 送った: boolean; 状態: number; path: string; 成功: string[]; 誤り: string[] }> {
    const before = this.page.url();
    const req = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/setting\/system\/member/.test(r.url()), { timeout: 30_000 }).catch(() => null);
    await this.登録ボタン.click({ timeout: T });
    const res = await req;
    if (res) { await this.page.waitForLoadState("load"); await this.page.waitForTimeout(300); }
    const texts = async (sel: string) => (await this.page.locator(sel).allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    const 誤り = (await texts(".alert-danger, .invalid-feedback, .form-error-message")).filter((t) => !/デバッグモード/.test(t));
    return { 送った: !!res, 状態: res?.status() ?? 0, path: res ? this.path() : new URL(before).pathname, 成功: await texts(".alert-success"), 誤り };
  }

  /** 画面上部・項目の下に出た誤りの文 */
  async 誤りの文(): Promise<string[]> {
    return (await this.page.locator(".alert-danger, .invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
  }
}

/** 管理画面からログアウトする */
export async function 管理画面からログアウトする(page: Page): Promise<void> {
  await page.goto(adminUrl("/logout"), { timeout: 60_000 }).catch(() => undefined);
  await page.waitForLoadState("load");
}

/** 追加システム設定の「管理画面自動ログアウト時間(分)」（共有の設定） */
const ADD_SYSTEM = "/setting/shop/additional_system";
export async function 自動ログアウト時間を読む(page: Page): Promise<string> {
  await page.goto(adminUrl(ADD_SYSTEM), { timeout: 60_000 });
  await page.waitForLoadState("load");
  return page.locator('[name="add_system[auto_logout_time]"]').inputValue();
}
export async function 自動ログアウト時間を設定する(page: Page, 分: string): Promise<void> {
  await page.goto(adminUrl(ADD_SYSTEM), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const input = page.locator('[name="add_system[auto_logout_time]"]');
  await input.fill(分);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator('form#point_form button[type="submit"]').click()]);
  await expect(page.locator(".alert-success").first(), `追加システム設定の自動ログアウト時間を ${分} 分にした`).toBeVisible({ timeout: T });
  expect(await input.inputValue(), "登録後の自動ログアウト時間").toBe(分);
}
