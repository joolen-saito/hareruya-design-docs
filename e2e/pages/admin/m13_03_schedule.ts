/**
 * M13-03 日程登録/編集（イベント編集画面の「日程追加」・日程一覧の編集から開く日程の画面）。
 * 入力欄は開始時間・受付あり・受付時間・デッキ登録あり・デッキ登録締切・デッキ登録を終了する・オンライン受付あり・
 * オンライン受付時間・定員・参加費・公開状態・賞品（日）・賞品（英）。
 * 受付時間などの条件付き入力欄は、親のチェックを外すと隠れて入力できなくなる。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";
import { openEventEdit } from "./event";

const OPEN = 30_000;
const dt = (v: string) => v.replace(/\//g, "-").replace(" ", "T");

export type 日程の入力 = {
  開始時間?: string;
  受付あり?: boolean; 受付時間?: { 開始: string; 終了: string };
  デッキ登録あり?: boolean; デッキ登録締切?: string; デッキ登録を終了する?: boolean;
  オンライン受付あり?: boolean; オンライン受付?: { 開始: string; 終了: string };
  定員?: string; 参加費?: string; 公開状態?: string; 賞品日?: string; 賞品英?: string;
};

export class ScheduleFormPage {
  constructor(readonly page: Page) {}

  private f(name: string): Locator { return this.page.locator(`[name="admin_event_detail[${name}]"]`); }
  get 開始時間() { return this.f("startDate"); }
  get 受付あり() { return this.f("offlineEntryFlg"); }
  get 受付開始() { return this.f("entryStartDate"); }
  get 受付終了() { return this.f("entryEndDate"); }
  get デッキ登録あり() { return this.f("deckRegistFlg"); }
  get デッキ登録締切() { return this.f("deckRegistDeadline"); }
  get デッキ登録を終了する() { return this.f("deadlineFlg"); }
  get オンライン受付あり() { return this.f("entryFlg"); }
  get オンライン受付開始() { return this.f("onlineEntryStartDate"); }
  get オンライン受付終了() { return this.f("onlineEntryEndDate"); }
  get 定員() { return this.f("capacity"); }
  get 参加費() { return this.f("entryFee"); }
  get 公開状態() { return this.f("disp"); }
  get 賞品日() { return this.f("prizeJp"); }
  get 賞品英() { return this.f("prizeEn"); }
  get 登録ボタン() { return this.page.getByRole("button", { name: "登録", exact: true }); }
  get 更新ボタン() { return this.page.getByRole("button", { name: "更新", exact: true }); }
  get 保存ボタン() { return this.page.getByRole("button", { name: "保存", exact: true }); }
  get 削除ボタン() { return this.page.locator("a.btn-ec-delete[data-bs-target^='#schedule_delete_']"); }
  get イベント編集リンク() { return this.page.locator(".c-conversionArea").getByRole("link", { name: "イベント編集", exact: true }); }
  get イベントページURLのリンク() { return this.page.locator("a[target='_blank'][href*='/events/']").first(); }
  /** 定員の右の単位の文字（人・組） */
  get 定員の接尾辞() { return this.page.locator(".col-1 .text-muted").first(); }
  get 画面エラー() { return this.page.locator(".alert-danger"); }

  /** 画面上部のラベル（「イベントID」「イベント詳細ID」「イベント名（日）」）の値 */
  async ラベルの値(ラベル: string): Promise<string> {
    const row = this.page.locator("#scheduleInfo .row.mb-2").filter({ has: this.page.locator(".col-2 span", { hasText: new RegExp(`^\\s*${ラベル.replace(/[（(]/g, "[（(]").replace(/[）)]/g, "[）)]")}\\s*$`) }) }).first();
    await expect(row, `画面上部の「${ラベル}」の行`).toBeVisible({ timeout: OPEN });
    return (await row.locator(".col").last().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }

  /** イベント編集画面の「日程追加」を押して日程登録画面を開く（イベント編集画面を開くところから） */
  async 日程追加画面を開く(イベントID: string): Promise<void> {
    const form = await openEventEdit(this.page, イベントID);
    await form.日程追加ボタン.click({ timeout: OPEN });
    await this.page.waitForURL(/\/schedule\/create$/, { waitUntil: "load" });
    await expect(this.開始時間, "日程登録画面の開始時間の欄").toBeVisible({ timeout: OPEN });
  }

  /** イベント編集画面の日程一覧の編集から日程編集画面を開く */
  async 日程編集画面を開く(イベントID: string, 日程ID: string): Promise<void> {
    const form = await openEventEdit(this.page, イベントID);
    await form.日程の編集ボタン(日程ID).click({ timeout: OPEN });
    await form.日程メニューの編集(日程ID).click({ timeout: OPEN });
    await this.page.waitForURL(new RegExp(`/schedule/${日程ID}/edit$`), { waitUntil: "load" });
    await expect(this.開始時間, "日程編集画面の開始時間の欄").toBeVisible({ timeout: OPEN });
  }

  /** 入力する。開始時間を先に入れ、チェック、条件付きの日時の順に入れる（開始時間の欄を離れると画面がデッキ登録締切を自動で入れるため、締切は最後に入れる） */
  async 入力する(v: 日程の入力): Promise<void> {
    if (v.開始時間 !== undefined) {
      await this.開始時間.fill(v.開始時間 === "" ? "" : dt(v.開始時間), { timeout: OPEN });
      await this.開始時間.blur({ timeout: OPEN });
    }
    if (v.受付あり !== undefined) await setChecked(this.受付あり, v.受付あり);
    if (v.デッキ登録あり !== undefined) await setChecked(this.デッキ登録あり, v.デッキ登録あり);
    if (v.オンライン受付あり !== undefined) await setChecked(this.オンライン受付あり, v.オンライン受付あり);
    if (v.デッキ登録を終了する !== undefined && (v.デッキ登録を終了する || (await this.デッキ登録を終了する.isVisible()))) await setChecked(this.デッキ登録を終了する, v.デッキ登録を終了する);
    if (v.受付時間) { await this.受付開始.fill(v.受付時間.開始, { timeout: OPEN }); await this.受付終了.fill(v.受付時間.終了, { timeout: OPEN }); }
    if (v.デッキ登録締切 !== undefined) await this.デッキ登録締切.fill(dt(v.デッキ登録締切), { timeout: OPEN });
    if (v.オンライン受付) {
      await this.オンライン受付開始.fill(dt(v.オンライン受付.開始), { timeout: OPEN });
      await this.オンライン受付終了.fill(dt(v.オンライン受付.終了), { timeout: OPEN });
    }
    if (v.定員 !== undefined) await this.定員.fill(v.定員, { timeout: OPEN });
    if (v.参加費 !== undefined) await this.参加費.fill(v.参加費, { timeout: OPEN });
    if (v.公開状態 !== undefined) await chooseByLabel(this.公開状態, v.公開状態);
    if (v.賞品日 !== undefined) await this.賞品日.fill(v.賞品日, { timeout: OPEN });
    if (v.賞品英 !== undefined) await this.賞品英.fill(v.賞品英, { timeout: OPEN });
  }

  /** ボタンを押して送信し、応答の画面が出るまで待つ。ブラウザの入力チェックが送信を止めたときは sent=false と止めた項目を返す */
  async 押して送信する(ボタン: Locator): Promise<{ sent: boolean; 止めた項目: string[] }> {
    const req = this.page.waitForRequest((r) => r.method() === "POST" && /\/schedule\//.test(r.url()), { timeout: 8_000 }).then(() => true, () => false);
    await ボタン.click({ timeout: OPEN });
    const sent = await req;
    if (!sent) {
      const bad = await this.page.locator("form#schedule_form :invalid").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
      return { sent: false, 止めた項目: bad };
    }
    await this.page.waitForLoadState("load");
    return { sent: true, 止めた項目: [] };
  }

  /** 登録・保存の送信の結果が成功であることを確かめる（成功メッセージ） */
  async 保存できたことを確かめる(what: string): Promise<void> { await expectSaved(this.page, what); }

  /** 確認画面（モーダル）の削除ボタンを押す（削除ボタンを押したあと） */
  async 確認画面の削除を押す(日程ID: string): Promise<void> {
    const modal = this.page.locator(`#schedule_delete_${日程ID}`);
    await expect(modal, "日程削除の確認画面").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), modal.locator("a.btn-ec-delete").click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 日程の削除: 削除ボタン → 確認の削除ボタン */
  async 削除を確定する(日程ID: string): Promise<void> {
    await this.削除ボタン.click({ timeout: OPEN });
    const modal = this.page.locator(`#schedule_delete_${日程ID}`);
    await expect(modal, "日程削除の確認画面").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), modal.locator("a.btn-ec-delete").click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 条件付きの日時の欄（受付時間・デッキ登録締切・オンライン受付時間）を、入力できる状態のものだけ空にする */
  async 条件付きの欄を空にする(): Promise<void> {
    for (const l of [this.受付開始, this.受付終了, this.デッキ登録締切, this.オンライン受付開始, this.オンライン受付終了]) {
      if (await l.isEnabled()) await l.fill("", { timeout: OPEN });
    }
  }

  /** 開発者ツールで行うのと同じに、なりすまし対策トークンの値を書き換える */
  async なりすまし対策トークンを書き換える(値: string): Promise<void> {
    await this.page.locator('form#schedule_form input[name$="[_token]"]').evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /** 日程の画面をアドレスで直接開き、応答の状態コードを返す（画面の操作では開けないアドレス用） */
  async アドレスで開く(path: string): Promise<number> {
    const res = await this.page.goto(adminUrl(path), { waitUntil: "load" });
    return res?.status() ?? 0;
  }

  /** 開発者ツールで行うのと同じに、フォームの送信先を書き換える */
  async 送信先のアドレスを書き換える(path: string): Promise<void> {
    await this.page.locator("form#schedule_form").evaluate((f, a) => { (f as HTMLFormElement).action = a; }, adminUrl(path));
  }

  /** 開発者ツールで行うのと同じに、送信ボタンの無効状態を解除する */
  async 送信ボタンの無効状態を解除する(ボタン: Locator): Promise<boolean> {
    const wasDisabled = await ボタン.isDisabled();
    await ボタン.evaluate((b) => { b.removeAttribute("disabled"); });
    return wasDisabled;
  }

  /** ボタンを押して送信し、日程の画面への送信の応答の状態コードを返す */
  async 押して応答の状態を読む(ボタン: Locator): Promise<number> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === "POST" && /\/schedule\//.test(r.url()), { timeout: 30_000 }),
      ボタン.click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
    return res.status();
  }

  /** 開発者ツールで行うのと同じに、管理画面の画面が持つなりすまし対策の値を付けて日程の削除要求を送り、応答の状態コードを返す */
  async 日程削除の要求を送る(イベントID: string, 日程ID: string): Promise<number> {
    await this.page.goto(adminUrl("/"), { waitUntil: "load" });
    const token = await this.page.locator('meta[name="eccube-csrf-token"]').getAttribute("content");
    return this.page.evaluate(async ([url, t]) => {
      const r = await fetch(url!, { method: "DELETE", headers: { "ECCUBE-CSRF-TOKEN": t ?? "", "X-Requested-With": "XMLHttpRequest" }, redirect: "manual", credentials: "same-origin" });
      return r.status;
    }, [adminUrl(`/event/${イベントID}/schedule/${日程ID}/delete`), token] as const);
  }

  /** 日程の編集画面のアドレスから日程IDを読む */
  日程IDを画面のアドレスから読む(): string | null {
    return /\/schedule\/(\d+)\/edit/.exec(this.page.url())?.[1] ?? null;
  }
}

export const イベント編集画面のアドレス = (イベントID: string) => adminUrl(`/event/${イベントID}/edit`);
