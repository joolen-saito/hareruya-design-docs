/**
 * M11-01 メンバー管理一覧の操作。セレクタはここだけに書く。正本: cases/M11-01_test_cases.tsv
 * 一覧は全メンバーを表示順の降順で出す。各行に編集・上へ・下へ・削除のアイコンがあり、押すと確認のモーダルが開く。
 * 上へ・下へ・削除の実行のリンクは、画面のスクリプトがリンクの属性（なりすまし対策のトークン）を読んで送信のフォームを作る作り。
 */
import { Locator, Page, Response, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 60_000;
export type 操作 = "上へ" | "下へ" | "削除";
const 送り先: Record<操作, string> = { 上へ: "up", 下へ: "down", 削除: "delete" };
const アイコン: Record<操作, string> = { 上へ: "a.action-up", 下へ: "a.action-down", 削除: "a.action-delete" };
const 文 = (t: string): string => t.replace(/\s+/g, " ").trim();

export type 行の表示 = { 名前: string; 所属: string; 権限: string; デフォルト検索表示店舗: string; 編集可能店舗: string; 自動ログアウト: string; 二段階認証: string; 二段階認証の設定: string };

export class MemberListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  get パス(): string { return new URL(this.page.url()).pathname; }
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/setting/system/member"), { timeout: 120_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("table tbody tr[id^='ex-member-']").first(), "メンバー管理一覧の行").toBeVisible();
  }
  一覧画面か(): boolean { return /\/setting\/system\/member\/?$/.test(this.パス); }

  行(ID: string): Locator { return this.page.locator(`tr#ex-member-${ID}`); }
  /** 一覧の行のメンバーIDを、上から順に（max 件まで） */
  async 上からのID(max: number): Promise<string[]> {
    return this.page.locator("table tbody tr[id^='ex-member-']").evaluateAll((rs, n) => rs.slice(0, n as number).map((r) => r.id.replace("ex-member-", "")), max);
  }
  /** 一覧の最後の行のメンバーID */
  async 最後の行のID(): Promise<string> {
    return this.page.locator("table tbody tr[id^='ex-member-']").evaluateAll((rs) => (rs[rs.length - 1]?.id ?? "").replace("ex-member-", ""));
  }

  /** 行の各列の表示（名前・所属・権限・デフォルト検索表示店舗・編集可能店舗・自動ログアウト・2段階認証） */
  async 行の表示(ID: string): Promise<行の表示> {
    const tds = (await this.行(ID).locator("td").allInnerTexts()).map(文);
    // 2段階認証の設定済み・未設定は、印（チェックの色）と吹き出しの文で出る。吹き出しの文は、画面のスクリプトが title から別の属性へ移すことがある
    const 設定 = await this.行(ID).locator("td").nth(6).locator("span[data-bs-toggle='tooltip']").first()
      .evaluate((s) => s.getAttribute("data-bs-original-title") || s.getAttribute("title") || s.getAttribute("aria-label") || "").catch(() => "");
    return { 名前: tds[0] ?? "", 所属: tds[1] ?? "", 権限: tds[2] ?? "", デフォルト検索表示店舗: tds[3] ?? "", 編集可能店舗: tds[4] ?? "", 自動ログアウト: tds[5] ?? "", 二段階認証: tds[6] ?? "", 二段階認証の設定: 設定 ?? "" };
  }

  /** 行のアイコン（押せないものは disabled の印が付く） */
  アイコン(ID: string, 何: 操作 | "編集"): Locator {
    return this.行(ID).locator(何 === "編集" ? "a.action-edit, span.btn-ec-actionIcon" : アイコン[何]).first();
  }
  async 押せるか(ID: string, 何: 操作 | "編集"): Promise<boolean> {
    const l = this.アイコン(ID, 何);
    if ((await l.count()) === 0) return false;
    const cls = (await l.getAttribute("class")) ?? "";
    return !/\bdisabled\b/.test(cls) && !!(await l.getAttribute("data-bs-target"));
  }

  private モーダル(ID: string, 何: 操作 | "編集"): Locator {
    const id = { 上へ: "member_up_", 下へ: "member_down_", 削除: "member_delete_", 編集: "member_edit_" }[何] + ID;
    return this.page.locator(`#${id}`);
  }
  /** 実行のリンク（モーダルの中） */
  実行のリンク(ID: string, 何: 操作 | "編集"): Locator {
    if (何 === "編集") return this.モーダル(ID, 何).locator(`a[href$="/setting/system/member/${ID}/edit"]`);
    return this.モーダル(ID, 何).locator(`a[href$="/setting/system/member/${ID}/${送り先[何]}"]`);
  }

  /** アイコンを押して確認のモーダルを開く */
  async 確認を開く(ID: string, 何: 操作 | "編集"): Promise<void> {
    const icon = this.アイコン(ID, 何);
    await expect(icon, `「${何}」のアイコン`).toBeVisible();
    await icon.scrollIntoViewIfNeeded();
    await icon.click();
    await expect(this.モーダル(ID, 何), `「${何}」の確認の画面`).toBeVisible();
  }
  /** 確認の画面でキャンセルを押す */
  async キャンセルする(ID: string, 何: 操作 | "編集"): Promise<void> {
    const m = this.モーダル(ID, 何);
    await m.locator("button.btn-ec-sub", { hasText: "キャンセル" }).first().click();
    await expect(m, "確認の画面が閉じた").toBeHidden();
  }
  /** 確認の画面で実行し、移った先の応答を返す */
  async 実行する(ID: string, 何: 操作 | "編集"): Promise<Response | null> {
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
      this.実行のリンク(ID, 何).click(),
    ]);
    return res;
  }

  /** 実行のリンクから、なりすまし対策のトークン（リンクの属性）を取り除く（開発者ツールで消すのと同じ）。取り除いた数を返す */
  async トークンを取り除く(ID: string, 何: 操作): Promise<number> {
    return this.実行のリンク(ID, 何).evaluate((a) => {
      const had = a.hasAttribute("token-for-anchor") ? 1 : 0;
      a.removeAttribute("token-for-anchor");
      return had;
    });
  }

  /** 画面上部の帯（成功・警告・誤り） */
  async 帯(): Promise<{ 成功: string[]; 警告: string[]; 誤り: string[] }> {
    const t = async (sel: string) => (await this.page.locator(sel).allInnerTexts()).map(文).filter((x) => x && !/デバッグモード/.test(x));
    return { 成功: await t(".alert-success"), 警告: await t(".alert-warning"), 誤り: await t(".alert-danger") };
  }

  /** 絞り込みの選択欄（所属・権限）の選択肢（空の「選択してください」は除く） */
  async 絞り込みの選択肢(何: "所属" | "権限"): Promise<string[]> {
    const sel = this.page.locator(何 === "所属" ? "#filter_department" : "#filter_authority");
    return sel.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }
  /** 絞り込みの選択欄を開く（選択欄を押す） */
  async 絞り込みを開く(何: "所属" | "権限"): Promise<void> {
    const sel = this.page.locator(何 === "所属" ? "#filter_department" : "#filter_authority");
    await expect(sel, `${何}の選択欄`).toBeVisible();
    await sel.focus();
  }

  get 新規登録ボタン(): Locator { return this.page.getByRole("link", { name: "新規登録" }).first(); }
  async 新規登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: T }), this.新規登録ボタン.click()]);
  }
}
