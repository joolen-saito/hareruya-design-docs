/**
 * M15 デッキ管理 共通の画面部品: デッキの登録・イベントと日程の用意・デッキ一覧の検索。
 * セレクタはここだけに置く。シード（seeds/m15-*.ts）とテスト（spec/m15/*.spec.ts）が使う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { rc } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { registerEvent } from "./event";
import { registerSchedule } from "./schedule";

type Issue = (m: string) => void;

/** 実行の印は、検索の語として使える前半に付ける（例: 「M1501-095」→「M1501-095-印」。デッキ名は「M1501-095-印-A」） */
export const 語 = (stem: string) => rc(stem);
export const 名 = (stem: string, suffix: string) => `${rc(stem)}-${suffix}`;

export type デッキ登録内容 = {
  デッキ名?: string;
  /** 画面の選択肢の表示（「event」「user」）。省略は event（管理者作成） */
  デッキタイプ?: string;
  /** 省略は、アーキタイプのあるフォーマットのうち先頭（任意の値） */
  フォーマット?: string;
  アーキタイプ?: string;
  公開状態?: "公開" | "非公開" | "限定公開";
  イベント名日?: string; イベント名英?: string;
  /** 「2025-07-31T23:59」の形（日時欄の値） */
  開催日?: string;
  順位?: string; 成績?: string; プレイヤー名?: string; 引用元URL?: string;
  タグ?: string[];
  メイン?: string; サイド?: string; 統率?: string;
  /** M15-05 追加: 参加人数、デッキリスト公開状態（非公開）のチェック、代表カードの検索語（検索結果の先頭を選ぶ） */
  参加人数?: string; リスト非公開?: boolean; 代表カード検索語?: string;
  /** イベントを選んだあとで、自動入力されたイベント名(日)・(英)・開催日を空にする */
  選択後に空にする?: boolean;
  /** イベント検索でイベント名を検索し、この日程の「選択」を押す */
  イベント?: { 検索語: string; 日程ID: string };
};

let 基線: { フォーマット: string; アーキタイプ: string } | null = null;

/** 登録画面で、アーキタイプの選択肢があるフォーマットの先頭を探す（任意の値。開発用のマスタをそのまま使う） */
async function 基線を決める(page: Page): Promise<{ フォーマット: string; アーキタイプ: string }> {
  if (基線) return 基線;
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const fmt = page.locator('[name="admin_deck[Format]"]');
  const labels = (await fmt.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  for (const l of labels) {
    await fmt.selectOption({ label: l });
    const arch = page.locator('[name="admin_deck[Archetype]"]');
    const opts = (await arch.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })))).filter((o) => o.v);
    if (opts.length) return (基線 = { フォーマット: l, アーキタイプ: opts[0].t });
  }
  throw new Error("アーキタイプのあるフォーマットが1件も無い（デッキを登録できない）");
}

/** デッキ新規登録画面で登録し、デッキIDを返す */
export async function デッキを登録する(page: Page, v: デッキ登録内容, issue: Issue = () => {}): Promise<string> {
  const base = (v.フォーマット && v.アーキタイプ) ? null : await 基線を決める(page);
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  if (v.デッキ名 !== undefined) await f("deckName").fill(v.デッキ名);
  await chooseByLabel(f("DeckType"), v.デッキタイプ ?? "event");
  await chooseByLabel(f("Format"), v.フォーマット ?? base!.フォーマット);
  await chooseByLabel(f("Archetype"), v.アーキタイプ ?? base!.アーキタイプ);
  await chooseByLabel(f("Disp"), v.公開状態 ?? "非公開");
  if (v.タグ?.length) await chooseByLabel(page.locator('[name="admin_deck[DeckTags][]"]'), v.タグ);
  if (v.イベント) {
    await page.locator('[data-bs-target="#searchEventModal"]').click();
    const modal = page.locator("#searchEventModal");
    await expect(modal, "イベント検索の画面").toBeVisible();
    await modal.locator("#event_search_word").fill(v.イベント.検索語);
    await modal.locator("#btn_search_event").click();
    const 選択 = modal.locator(`button.select-event[data-id="${v.イベント.日程ID}"]`);
    await expect(選択, `イベント検索の結果に日程 ${v.イベント.日程ID} の行が出る`).toBeVisible({ timeout: 30_000 });
    await 選択.click();
    await expect(f("eventDetailId"), "イベントを選ぶと日程が設定される").toHaveValue(v.イベント.日程ID);
    await expect(modal).toBeHidden();
    if (v.選択後に空にする) { for (const n of ["eventNameJp", "eventNameEn", "eventDate"]) await f(n).fill(""); }
  }
  if (v.イベント名日 !== undefined) await f("eventNameJp").fill(v.イベント名日);
  if (v.イベント名英 !== undefined) await f("eventNameEn").fill(v.イベント名英);
  if (v.開催日 !== undefined) await f("eventDate").fill(v.開催日);
  if (v.順位 !== undefined) await f("ranking").fill(v.順位);
  if (v.成績 !== undefined) await f("result").fill(v.成績);
  if (v.プレイヤー名 !== undefined) await f("playerName").fill(v.プレイヤー名);
  if (v.引用元URL !== undefined) await f("sourceUrl").fill(v.引用元URL);
  if (v.参加人数 !== undefined) await f("participants").fill(v.参加人数);
  if (v.リスト非公開 !== undefined) await f("privateFlg").setChecked(v.リスト非公開);
  if (v.代表カード検索語) {
    await page.locator('[data-bs-target="#searchCardImageModal"]').click();
    const m = page.locator("#searchCardImageModal");
    await expect(m, "代表カード検索の画面").toBeVisible();
    await m.locator("#card_image_search_word").fill(v.代表カード検索語);
    await m.locator("#btn_search_card_image").click();
    const 決定 = m.locator("button.select-card-image").first();
    await expect(決定, `代表カード検索の結果に「${v.代表カード検索語}」が出る`).toBeVisible({ timeout: 30_000 });
    await 決定.click();
    await expect(m).toBeHidden();
  }
  if (v.メイン !== undefined) await f("textMain").fill(v.メイン);
  if (v.サイド !== undefined) await f("textSide").fill(v.サイド);
  if (v.統率 !== undefined) await f("textCommand").fill(v.統率);
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  for (const w of await expectSaved(page, `デッキ「${v.デッキ名 ?? ""}」の登録`)) issue(w);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`デッキを登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** 公開のデッキに必要な、イベント名・開催日の既定値 */
export function 公開用(stem: string): Pick<デッキ登録内容, "公開状態" | "イベント名日" | "イベント名英" | "開催日"> {
  return { 公開状態: "公開", イベント名日: `${rc(stem)}大会`, イベント名英: `${rc(stem)} Event`, 開催日: "2026-01-15T10:00" };
}

/** 店舗の選択肢から、「大阪店」があればそれ、無ければ先頭を選ぶ（共有マスタの店舗の代わり。注記に残す） */
async function 店舗を決める(page: Page): Promise<string> {
  await page.goto(adminUrl("/event/create"));
  await page.waitForLoadState("load");
  const labels = (await page.locator('[name="admin_event[baseInfo]"] option').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  if (!labels.length) throw new Error("イベントの店舗の選択肢が無い");
  return labels.find((l) => l.includes("大阪")) ?? labels[0];
}

let 店舗: string | null = null;
let 適用度: string | null = null;
let フォーマット: string | null = null;

/** イベントを登録し、日程（過去または指定の開始時間）を足す。イベントIDと日程IDを返す */
export async function イベントと日程を用意する(page: Page, v: { 名日: string; 名英: string; 開始時間?: string }, issue: Issue = () => {}): Promise<{ イベントID: string; 日程ID: string }> {
  if (!店舗) {
    店舗 = await 店舗を決める(page);
    if (!店舗.includes("大阪")) issue(`共有マスタの大阪店が無いため、店舗は「${店舗}」を選んだ（このケースは店舗の中身を確かめない）`);
  }
  if (!適用度) 適用度 = await 先頭の選択肢(page, "rel");
  if (!フォーマット) フォーマット = await 先頭の選択肢(page, "formats");
  const イベントID = await registerEvent(page, { イベント名日: v.名日, イベント名英: v.名英, 店舗, フォーマット: [フォーマット], ルール適用度: 適用度, 公開状態: "公開", 定員: "16", 参加費: "500" });
  const 日程ID = await registerSchedule(page, イベントID, { 開始時間: v.開始時間 ?? "2025-01-01 10:00", 受付あり: false, デッキ登録あり: false });
  return { イベントID, 日程ID };
}

async function 先頭の選択肢(page: Page, name: string): Promise<string> {
  await page.goto(adminUrl("/event/create"));
  await page.waitForLoadState("load");
  const labels = (await page.locator(`[name="admin_event[${name}]"] option, [name="admin_event[${name}][]"] option`).allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  if (!labels.length) throw new Error(`イベント登録の ${name} の選択肢が無い`);
  return labels[0];
}

/** デッキ一覧（検索・一括操作） */
export class デッキ一覧 {
  constructor(readonly page: Page) {}
  f(name: string): Locator { return this.page.locator(`[name="admin_search_deck[${name}]"], [name="admin_search_deck[${name}][]"]`); }
  get 日付クリア() { return this.page.locator("#date_clear"); }
  get 検索ボタン() { return this.page.locator('#admin_search_deck button[type="submit"]'); }
  get 全選択() { return this.page.locator("#allCheck"); }
  get 一括削除() { return this.page.locator("#bulk_delete"); }
  get CSV出力() { return this.page.locator("#csv_export"); }
  get 一括編集() { return this.page.locator("#toggle_bulk_edit"); }
  get 一括編集パネル() { return this.page.locator("#bulk_edit_panel"); }
  get 新規登録() { return this.page.getByRole("link", { name: "新規登録", exact: true }); }
  get 件数選択() { return this.page.locator("#page_count_pulldown"); }
  get 並べ替え項目() { return this.page.locator("#sort_key_pulldown"); }
  get 並び順() { return this.page.locator("#sort_order_pulldown"); }

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/deck"));
    await this.page.waitForLoadState("load");
    await expect(this.検索ボタン, "デッキ検索・一覧画面").toBeVisible();
  }

  async 結果を待つ(): Promise<void> {
    await expect(this.page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした/).first(), "検索結果の表示").toBeVisible({ timeout: 60_000 });
  }

  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索ボタン.click()]);
    await this.結果を待つ();
  }

  /** 検索条件のクリア（リンク）。入力欄を空にする */
  async 条件をクリアする(): Promise<void> {
    await this.page.locator(".search-clear").click();
  }

  async 件数(): Promise<number> {
    const t = (await this.page.getByText(/検索結果：\d+件が該当しました/).first().innerText().catch(() => "")) ?? "";
    const m = /(\d+)件/.exec(t);
    return m ? Number(m[1]) : 0;
  }

  /** 画面に表示されているデッキID（上から順） */
  async 表示されたID(): Promise<string[]> {
    return this.page.locator("input.searched_deck_id").evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
  }

  行(デッキID: string): Locator { return this.page.locator("tr", { has: this.page.locator(`input.searched_deck_id[value="${デッキID}"]`) }); }
  選択(デッキID: string): Locator { return this.page.locator(`input.searched_deck_id[value="${デッキID}"]`); }
  メニュー(デッキID: string): Locator { return this.行(デッキID).locator(".dropdown-menu-toggle"); }

  /** 表示された各行のデッキ名（上から順。名前が無い行は「-」） */
  async 表示されたデッキ名(): Promise<string[]> {
    return this.page.locator(".deck-result-table tbody tr").evaluateAll((trs) => trs.map((tr) => {
      const rows = Array.from(tr.querySelectorAll(".row.mb-1"));
      for (const r of rows) {
        const k = r.querySelector(".text-muted")?.textContent?.trim();
        if (k === "デッキ名") return (r.children[1]?.textContent ?? "").trim();
      }
      return "";
    }));
  }
}
