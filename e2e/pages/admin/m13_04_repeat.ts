/**
 * M13-04 繰返日程追加（イベント編集画面の「繰返日程追加」から開く画面）。
 * 期間（From〜To）・曜日・開始時間と、受付あり・デッキ登録あり（開始日の何日前の何時まで）・オンライン受付あり（開始・終了が開始日の何日前の何時）を入れて登録すると、
 * 期間内の選んだ曜日ごとに日程が作られる。
 */
import { Locator, Page, expect } from "@playwright/test";
import { chooseByLabel, setChecked } from "./common";
import { openEventEdit } from "./event";

const OPEN = 30_000;
const iso = (v: string) => v.replace(/\//g, "-");
const 曜日の値: Record<string, string> = { 月曜日: "1", 火曜日: "2", 水曜日: "3", 木曜日: "4", 金曜日: "5", 土曜日: "6", 日曜日: "0" };

export type 繰返の入力 = {
  期間From?: string; 期間To?: string; 曜日?: string[]; 開始時間?: string;
  受付あり?: boolean; 受付時間?: { 開始: string; 終了: string };
  デッキ登録あり?: boolean; デッキ登録締切?: { 前日数: string; 時刻: string };
  オンライン受付あり?: boolean; オンライン受付?: { 開始前日数: string; 開始時刻: string; 終了前日数: string; 終了時刻: string };
};

export class RepeatScheduleFormPage {
  constructor(readonly page: Page) {}

  private f(name: string): Locator { return this.page.locator(`[name="admin_repeat_schedule[${name}]"]`); }
  get 期間From() { return this.f("repeatStartDate"); }
  get 期間To() { return this.f("repeatEndDate"); }
  曜日(名: string): Locator { return this.page.locator(`input[name="admin_repeat_schedule[week][]"][value="${曜日の値[名]}"]`); }
  get 開始時間() { return this.f("startTime"); }
  get 受付あり() { return this.f("offlineEntryFlg"); }
  get 受付開始() { return this.f("entryStartTime"); }
  get 受付終了() { return this.f("entryEndTime"); }
  get デッキ登録あり() { return this.f("deckRegistFlg"); }
  get デッキ登録前日数() { return this.f("deckRegistDeadlineDays"); }
  get デッキ登録時刻() { return this.f("deckRegistDeadlineTime"); }
  get オンライン受付あり() { return this.f("entryFlg"); }
  get オンライン開始前日数() { return this.f("onlineEntryStartDays"); }
  get オンライン開始時刻() { return this.f("onlineEntryStartTime"); }
  get オンライン終了前日数() { return this.f("onlineEntryEndDateDays"); }
  get オンライン終了時刻() { return this.f("onlineEntryEndTime"); }
  get 登録ボタン() { return this.page.getByRole("button", { name: "登録", exact: true }); }
  get イベント編集リンク() { return this.page.locator(".c-conversionArea").getByRole("link", { name: "イベント編集", exact: true }); }
  get 画面エラー() { return this.page.locator(".alert-danger"); }

  /** 画面上部のラベル（「イベントID」「イベント名（日）」）の値 */
  async ラベルの値(ラベル: string): Promise<string> {
    const row = this.page.locator("form#repeat_schedule_form .row.mb-2").filter({ has: this.page.locator(".col-2 span", { hasText: new RegExp(`^\\s*${ラベル.replace(/[（(]/g, "[（(]").replace(/[）)]/g, "[）)]")}\\s*$`) }) }).first();
    await expect(row, `画面上部の「${ラベル}」の行`).toBeVisible({ timeout: OPEN });
    return (await row.locator(".col").last().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }

  /** イベント編集画面の「繰返日程追加」を押して開く */
  async 開く(イベントID: string): Promise<void> {
    const form = await openEventEdit(this.page, イベントID);
    await form.繰返日程追加ボタン.click({ timeout: OPEN });
    await this.page.waitForURL(/\/repeatSchedule\/create$/, { waitUntil: "load" });
    await expect(this.期間From, "繰返日程追加画面の期間Fromの欄").toBeVisible({ timeout: OPEN });
  }

  async 入力する(v: 繰返の入力): Promise<void> {
    if (v.期間From !== undefined) await this.期間From.fill(iso(v.期間From), { timeout: OPEN });
    if (v.期間To !== undefined) await this.期間To.fill(iso(v.期間To), { timeout: OPEN });
    if (v.曜日) for (const w of v.曜日) await setChecked(this.曜日(w), true);
    if (v.開始時間 !== undefined) await this.開始時間.fill(v.開始時間, { timeout: OPEN });
    if (v.受付あり !== undefined) await setChecked(this.受付あり, v.受付あり);
    if (v.デッキ登録あり !== undefined) await setChecked(this.デッキ登録あり, v.デッキ登録あり);
    if (v.オンライン受付あり !== undefined) await setChecked(this.オンライン受付あり, v.オンライン受付あり);
    if (v.受付時間) { await this.受付開始.fill(v.受付時間.開始, { timeout: OPEN }); await this.受付終了.fill(v.受付時間.終了, { timeout: OPEN }); }
    if (v.デッキ登録締切) { await this.デッキ登録前日数.fill(v.デッキ登録締切.前日数, { timeout: OPEN }); await this.デッキ登録時刻.fill(v.デッキ登録締切.時刻, { timeout: OPEN }); }
    if (v.オンライン受付) {
      await this.オンライン開始前日数.fill(v.オンライン受付.開始前日数, { timeout: OPEN });
      await this.オンライン開始時刻.fill(v.オンライン受付.開始時刻, { timeout: OPEN });
      await this.オンライン終了前日数.fill(v.オンライン受付.終了前日数, { timeout: OPEN });
      await this.オンライン終了時刻.fill(v.オンライン受付.終了時刻, { timeout: OPEN });
    }
  }

  /** 登録ボタンを押す。ブラウザの入力チェックが送信を止めたら sent=false と止めた項目 */
  async 登録を押す(): Promise<{ sent: boolean; 止めた項目: string[] }> {
    const req = this.page.waitForRequest((r) => r.method() === "POST" && /repeatSchedule/.test(r.url()), { timeout: 8_000 }).then(() => true, () => false);
    await this.登録ボタン.click({ timeout: OPEN });
    const sent = await req;
    if (!sent) return { sent, 止めた項目: await this.page.locator("form#repeat_schedule_form :invalid").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name)) };
    await this.page.waitForLoadState("load");
    return { sent, 止めた項目: [] };
  }

  async なりすまし対策トークンを書き換える(値: string): Promise<void> {
    await this.page.locator('form#repeat_schedule_form input[name$="[_token]"]').evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }
}

export { chooseByLabel };
