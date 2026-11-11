// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-17 大会デッキ登録確認～完了（フロントのマイページ）の画面部品。セレクタ・アドレスはここだけに書く。正本: cases/F06-17_test_cases.tsv
 *
 * 画面の作り（アプリの Twig: Mypage/deck_entry_check.twig・deck_entry_edit.twig、breadcrumb_nav.twig で確かめたもの）:
 * - デッキ登録完了画面のアドレスは /ja/deckentry/<デッキID>/check。見出しは「デッキ登録完了」。
 *   大会名の見出しの後ろに括弧つきでフォーマット名が付く。開催店舗・お名前の欄、フォーマットの単独項目（デッキにフォーマットがあるとき）、
 *   ボードごとの見出し（「メインボード(合計枚数)」）・内容エラー・登録内容、カード画像の一覧（画像と枚数）、「大会一覧に戻る」「デッキ編集に戻る」。
 * - パンくずリストはホーム（アイコン）・マイページ・現在表示中ページ（リンクでない見出し）。
 * - 大会デッキ登録編集画面のフォームは /ja/deckentry/<イベント詳細ID>/update へ送る。選択フォーマットは「format」（ラジオか隠し項目）。
 *   入力形式に誤りがあると、編集画面のまま入力内容と誤りの表示を返す。
 * 編集画面の操作（ログイン・開く・入力・提出・トークンの書き換え）は F06-16 の部品（f06_16_deck_entry.ts）を使う。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { DeckEntryEditPage } from "./f06_16_deck_entry_k";

const T = 30_000;
const 文 = (s: string) => s.replace(/\s+/g, " ").trim();

/** デッキ登録完了画面のアドレス */
export const デッキ登録完了のパス = (デッキID: string, 言語: "ja" | "en" = "ja") => `/${言語}/deckentry/${デッキID}/check`;

export type ボード = "メインボード" | "統率領域" | "サイドボード";
export type 画像のカード = { 名前: string; 画像: string; 読み込めた: boolean; 枚数: string };

export class DeckEntryCheckPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  /** デッキIDのデッキ登録完了画面を開く。応答のHTTPステータスを返す */
  async 開く(デッキID: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${デッキ登録完了のパス(デッキID)}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get 本体(): Locator { return this.page.locator(".p-hareruya-deckentry-check"); }
  get 見出し(): Locator { return this.本体.locator("h1.c-hareruya-heading--lev1"); }
  /** デッキ登録完了画面が表示されているか（画面の本体と見出しがある） */
  async 完了画面である(): Promise<boolean> {
    return (await this.本体.count()) > 0 && (await this.見出し.count()) > 0 && /\/deckentry\/\d+\/check$/.test(this.path);
  }
  get 大会名(): Locator { return this.page.locator(".p-hareruya-deckentry-check__event-title"); }
  /** 大会情報の欄（「開催店舗」「お名前」など。末尾の「：」を除く）→ 値 */
  async 大会情報(): Promise<Record<string, string>> {
    return this.page.locator(".p-hareruya-deckentry-check__event-row").evaluateAll((rows) => {
      const out: Record<string, string> = {};
      for (const r of rows) {
        const k = (r.querySelector("dt")?.textContent ?? "").replace(/[：:]\s*$/, "").trim();
        if (k) out[k] = ((r.querySelector("dd") as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();
      }
      return out;
    });
  }
  /** 画面の本文（見えている文字） */
  async 本文(): Promise<string> { return 文(await this.page.locator("body").innerText()); }
  /** 大会情報・プレイヤー情報の表示領域（大会名から下の、ボードの前まで）の文 */
  async 情報欄の文(): Promise<string> { return 文(await this.page.locator(".p-hareruya-deckentry-check__header").innerText()); }

  // ---- フォーマットの単独項目 ----
  get フォーマット項目(): Locator { return this.page.locator(".p-hareruya-deckentry-check__format"); }
  get フォーマット項目の値(): Locator { return this.page.locator(".p-hareruya-deckentry-check__format-value"); }

  // ---- ボード ----
  ボード(名: ボード): Locator {
    return this.page.locator(".p-hareruya-deckentry-check__board").filter({ has: this.page.locator(".p-hareruya-deckentry-check__board-title", { hasText: new RegExp(`^\\s*${名}`) }) });
  }
  /** ボードの見出しの合計枚数（「メインボード(2)」の 2） */
  async 合計枚数(名: ボード): Promise<string> {
    const t = 文(await this.ボード(名).locator(".p-hareruya-deckentry-check__board-count").innerText());
    return t.replace(/[()（）]/g, "");
  }
  /** ボードの登録内容（行ごと。空行は除く） */
  async 登録内容(名: ボード): Promise<string[]> {
    const t = (await this.ボード(名).locator(".p-hareruya-deckentry-check__board-list").textContent()) ?? "";
    return t.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean);
  }
  /** ボードの内容エラーの表示（1件1行） */
  async エラー(名: ボード): Promise<string[]> {
    const e = this.ボード(名).locator(".p-hareruya-deckentry-check__board-error");
    if ((await e.count()) === 0) return [];
    return ((await e.innerText()) ?? "").split("\n").map((l) => 文(l)).filter(Boolean);
  }

  // ---- カード画像 ----
  画像の欄(名: "メインボード" | "統率領域" | "サイドボード"): Locator {
    return this.page.locator(".p-hareruya-deckentry-check__visualize-card").filter({ has: this.page.locator(".p-hareruya-deckentry-check__visualize-title", { hasText: new RegExp(`^\\s*${名}`) }) });
  }
  /** 画像の欄のカード（画像の代替文字＝カード名・画像の参照先・画像が読み込めたか・枚数） */
  async 画像のカード(名: ボード): Promise<画像のカード[]> {
    const items = this.画像の欄(名).locator(".p-hareruya-deckentry-check__card-item");
    for (const img of await items.locator("img").all()) {
      await img.scrollIntoViewIfNeeded().catch(() => {});
      await img.evaluate((e) => (e as HTMLImageElement).complete ? null : new Promise((r) => { e.addEventListener("load", r, { once: true }); e.addEventListener("error", r, { once: true }); setTimeout(r, 10_000); }));
    }
    return items.evaluateAll((es) => es.map((e) => {
      const img = e.querySelector("img") as HTMLImageElement | null;
      return {
        名前: img?.getAttribute("alt") ?? "", 画像: img?.getAttribute("src") ?? "", 読み込めた: !!img && img.complete && img.naturalWidth > 0,
        枚数: (e.querySelector(".p-hareruya-deckentry-check__card-count")?.textContent ?? "").trim(),
      };
    }));
  }

  // ---- パンくず・ボタン ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  get 大会一覧に戻る(): Locator { return this.page.locator("a.p-hareruya-deckentry-check__btn").filter({ hasText: /^\s*大会一覧に戻る\s*$/ }); }
  get デッキ編集に戻る(): Locator { return this.page.locator("a.p-hareruya-deckentry-check__btn").filter({ hasText: /^\s*デッキ編集に戻る\s*$/ }); }

  /** リンクを押して次の画面の読み込みを待つ */
  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click()]);
    await this.page.waitForLoadState("load");
  }
  /** 押しても画面が移らないかもしれない要素を押す。移ったら true */
  async 押す_移るかもしれない(l: Locator): Promise<boolean> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5_000 }).then(() => true, () => false);
    await l.click();
    const moved = await nav;
    await this.page.waitForLoadState("load");
    return moved;
  }
}

// ---- 大会デッキ登録編集画面の「開発者ツールで…」（送信先・選択フォーマットの書き換え） ----

/** 編集画面のフォームの送信先（イベント詳細ID）を書き換える。書き換えた後の送信先のパスを返す */
export async function 送信先のイベント詳細IDを書き換える(d: DeckEntryEditPage, イベント詳細ID: string): Promise<string> {
  return d.入力フォーム.evaluate((f, id) => {
    const form = f as HTMLFormElement;
    form.setAttribute("action", form.getAttribute("action")!.replace(/\/deckentry\/\d+\/update/, `/deckentry/${id}/update`));
    return new URL(form.action).pathname;
  }, イベント詳細ID);
}

/** 編集画面のフォームの選択フォーマットを、指定のフォーマットIDにする（送信項目の値を書き換える。項目が無ければ隠し項目を足す）。送られる値を返す */
export async function 選択フォーマットを設定する(d: DeckEntryEditPage, フォーマットID: string): Promise<string[]> {
  return d.入力フォーム.evaluate((f, id) => {
    const form = f as HTMLFormElement;
    const inputs = Array.from(form.querySelectorAll('input[name="format"]')) as HTMLInputElement[];
    if (inputs.length === 0) {
      const h = document.createElement("input");
      h.type = "hidden"; h.name = "format"; h.value = id;
      form.appendChild(h);
    }
    for (const i of inputs) if (i.type !== "radio" || i.checked) i.value = id;
    return Array.from(new FormData(form).getAll("format")).map(String);
  }, フォーマットID);
}

/** なりすまし対策トークンの入力要素をフォームから取り除く。取り除いた数を返す */
export async function トークンの入力要素を削除する(d: DeckEntryEditPage): Promise<number> {
  return d.入力フォーム.locator('input[name="_token"]').evaluateAll((es) => { es.forEach((e) => e.remove()); return es.length; });
}
