/**
 * M15-11 直近の大会管理（管理画面）の操作。セレクタはここだけに置く。
 * 直近の大会の行は全体で1組の固定の行（行の追加・削除は無い）。1行＝イベント開催日・フォーマット・イベント名(日)・(英)・イベント参加人数の5項目と「消去」。
 * F09-01 の部品（f09_01_setup.ts の 直近の大会を設定し直す）は消去と入力を1回の保存でまとめて行うため、
 * 手順ごとに押す・読む・なりすまし対策トークンを書き換えるための部品をここに置く。
 * あわせて、名(日)と名(英)が違うフォーマットの新規登録（シードの手順どおりの項目だけを入れる）を置く。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";

type Issue = (m: string) => void;

/** 直近の大会の1行。開催日時は画面の入力のとおり「yyyy-mm-dd hh:mm」（空なら ""） */
export type 大会の行 = { 開催日時: string; フォーマット: string; 大会名日: string; 大会名英: string; 参加人数: string };

/** 「yyyy-mm-dd hh:mm」を日時の入力欄の値「yyyy-mm-ddThh:mm」にする */
const 入力値 = (v: string) => v.trim().replace(" ", "T");
/** 日時の入力欄の値「yyyy-mm-ddThh:mm(:ss)」を「yyyy-mm-dd hh:mm」にする */
const 表示値 = (v: string) => v.replace("T", " ").replace(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2}$/, "$1");

export const 直近の大会管理のパス = (): string => new URL(adminUrl("/deck/latest_event_deck")).pathname;

export type 押した結果 = { 送った: boolean; 応答: number | null; 止めた項目: string[] };

export class LatestEventDeckPage {
  constructor(readonly page: Page) {}

  get フォーム(): Locator { return this.page.locator("form#admin_latest_event_deck"); }
  get 行の表(): Locator { return this.page.locator("table.latest-event-deck-table"); }
  行(i: number): Locator { return this.行の表.nth(i); }
  private 欄(i: number, n: "eventDate" | "Format" | "eventNameJp" | "eventNameEn" | "participants"): Locator {
    return this.行(i).locator(`[name="admin_latest_event_deck[rows][${i}][${n}]"]`);
  }
  get 設定ボタン(): Locator { return this.フォーム.locator('button[type="submit"]').first(); }
  get トークン(): Locator { return this.フォーム.locator('input[name="admin_latest_event_deck[_token]"]'); }
  get 成功メッセージ(): Locator { return this.page.locator(".alert-success"); }
  get エラーメッセージ(): Locator { return this.page.locator(".alert-danger"); }

  /** デッキ管理＞直近の大会管理を開く（画面のスクリプトの読み込みまで待つ） */
  async 開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/deck/latest_event_deck"), { waitUntil: "load" });
    if (!res || res.status() >= 400) throw new Error(`直近の大会管理を開けない（応答 ${res?.status() ?? "なし"}）`);
    await expect(this.フォーム, "直近の大会管理の入力欄").toBeVisible({ timeout: 30_000 });
  }

  async 行数(): Promise<number> { return this.行の表.count(); }

  /** i 行目（0始まり）の「消去」を押す */
  async 消去を押す(i: number): Promise<void> {
    const b = this.行(i).locator("button.latest-event-deck-clear");
    await expect(b, `${i + 1}行目の「消去」ボタンの表示`).toHaveText(/^\s*消去\s*$/);
    await b.click();
  }

  /** i 行目（0始まり）に、与えた項目だけを入れる（与えない項目は触らない） */
  async 入れる(i: number, v: Partial<大会の行>): Promise<void> {
    if (v.開催日時 !== undefined) await this.欄(i, "eventDate").fill(入力値(v.開催日時));
    if (v.フォーマット !== undefined) await chooseByLabel(this.欄(i, "Format"), v.フォーマット);
    if (v.大会名日 !== undefined) await this.欄(i, "eventNameJp").fill(v.大会名日);
    if (v.大会名英 !== undefined) await this.欄(i, "eventNameEn").fill(v.大会名英);
    if (v.参加人数 !== undefined) await this.欄(i, "participants").fill(v.参加人数);
  }

  /** i 行目（0始まり）の5項目を読む。フォーマットは選ばれている選択肢の表示名（未選択なら ""） */
  async 読む(i: number): Promise<大会の行> {
    const sel = this.欄(i, "Format");
    const v = await sel.inputValue();
    const label = v === "" ? "" : ((await sel.locator("option:checked").textContent()) ?? "").trim();
    return {
      開催日時: 表示値(await this.欄(i, "eventDate").inputValue()),
      フォーマット: label,
      大会名日: await this.欄(i, "eventNameJp").inputValue(),
      大会名英: await this.欄(i, "eventNameEn").inputValue(),
      参加人数: await this.欄(i, "participants").inputValue(),
    };
  }

  async すべて読む(): Promise<大会の行[]> {
    const out: 大会の行[] = [];
    const n = await this.行数();
    for (let i = 0; i < n; i++) out.push(await this.読む(i));
    return out;
  }

  /** フォームに含まれるなりすまし対策トークンの隠し項目の値を書き換える（開発者ツールでの書き換えに当たる） */
  async トークンを書き換える(値: string): Promise<void> {
    await expect(this.トークン, "なりすまし対策トークンの隠し項目").toHaveCount(1);
    await this.トークン.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
    await expect(this.トークン, "書き換えたなりすまし対策トークンの値").toHaveValue(値);
  }

  /**
   * 「直近の大会設定」を押す。送信の要求が出たか・その応答の状態を返す。
   * ブラウザの入力チェック（入力のある行の項目は必須になる）が送信を止めたときは、送らずに止めた項目を返す。
   */
  async 設定を押す(): Promise<押した結果> {
    await expect(this.設定ボタン, "「直近の大会設定」ボタンの表示").toHaveText(/^\s*直近の大会設定\s*$/);
    const path = 直近の大会管理のパス();
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === path, { timeout: 15_000 })
      .then((r) => r).catch(() => null);
    await this.設定ボタン.click();
    const res = await resP;
    if (!res) {
      const 止めた項目 = await this.フォーム.locator("input, select").evaluateAll((es) => es
        .filter((e) => !(e as HTMLInputElement).checkValidity())
        .map((e) => `${(e as HTMLInputElement).name}: ${(e as HTMLInputElement).validationMessage}`));
      return { 送った: false, 応答: null, 止めた項目 };
    }
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("body"), "送信のあとの画面").toBeVisible();
    return { 送った: true, 応答: res.status(), 止めた項目: [] };
  }

  /** 画面上部のメッセージ（開発用の設定のときに常に出る帯は除く） */
  async 上部のメッセージ(): Promise<string[]> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
    return [...await read(this.成功メッセージ), ...await read(this.エラーメッセージ)];
  }
}

/**
 * シード: 直近の大会管理を開き、5行すべての「消去」を押してから「直近の大会設定」を押して保存する。
 * 続けて rows があれば、開き直して上の行から入れ、「直近の大会設定」を押して保存する。
 */
export async function 直近の大会を空にしてから入れる(page: Page, rows: 大会の行[], what: string, issue: Issue): Promise<void> {
  const p = new LatestEventDeckPage(page);
  await p.開く();
  const n = await p.行数();
  if (n !== 5) throw new Error(`${what}: 直近の大会管理の行が ${n} 行ある（シード表は5行を前提にする）`);
  for (let i = 0; i < n; i++) await p.消去を押す(i);
  const r1 = await p.設定を押す();
  if (!r1.送った) throw new Error(`${what}: 5行を消去して「直近の大会設定」を押したが送信されない（${r1.止めた項目.join(" / ")}）`);
  for (const w of await expectSaved(page, `${what}: 5行を空にする保存`)) issue(w);
  const empty = await p.すべて読む();
  empty.forEach((r, i) => {
    if (Object.values(r).some((x) => x !== "")) throw new Error(`${what}: 5行を空にして保存したが、${i + 1}行目が空でない（${JSON.stringify(r)}）`);
  });
  if (rows.length === 0) return;
  await p.開く();
  for (let i = 0; i < rows.length; i++) await p.入れる(i, rows[i]);
  const r2 = await p.設定を押す();
  if (!r2.送った) throw new Error(`${what}: 行を入れて「直近の大会設定」を押したが送信されない（${r2.止めた項目.join(" / ")}）`);
  for (const w of await expectSaved(page, `${what}: 行を入れる保存`)) issue(w);
  await p.開く();
  for (let i = 0; i < rows.length; i++) {
    const got = await p.読む(i);
    if (JSON.stringify(got) !== JSON.stringify(rows[i])) throw new Error(`${what}: ${i + 1}行目が入れた値と違う（入れた ${JSON.stringify(rows[i])} / 画面 ${JSON.stringify(got)}）`);
  }
}

/** シード: フォーマット管理の新規登録（名(日)・名(英)・並び順・メタゲーム分析日数を入れ、ランキング表示・メタ分布簡易化は付けない）。番号を返す */
export async function フォーマットを新規登録する(page: Page, v: { 名日: string; 名英: string; 並び順: string; メタ日数: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("rank").fill(v.並び順);
  await f("MetaRange").fill(v.メタ日数);
  await setChecked(f("rankingFlg"), false);
  await setChecked(f("OtherMetaFlg"), false);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}
