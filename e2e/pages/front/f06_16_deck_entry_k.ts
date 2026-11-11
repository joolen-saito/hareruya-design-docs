// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-16 大会デッキ登録編集（フロントのマイページ）の画面部品。セレクタ・アドレスはここだけに書く。正本: cases/F06-16_test_cases.tsv
 *
 * 画面の作り（アプリの Twig: Mypage/deck_entry_edit.twig・_deck_entry_format_sync.twig で確かめたもの）:
 * - アドレスは /ja/deckentry/<イベント詳細ID>/edit。画面の見出し（h1）とパンくずの現在地は「登録デッキ編集」。
 * - フォーマット選択エリア（「1.フォーマット選択」）は、イベントのフォーマットのうち「ランキング表示」か「メタ分布簡易化」が付いたものが
 *   2つ以上のときだけ出る。選択肢はラジオで、表示はフォーマット名(日)。
 * - 「インポート」「マイデッキを取得」ボタンは、それぞれポップアップ（デッキリストインポート・マイデッキを取得）を開く。
 * - ボード選択（メインボード・統率領域・サイドボード）はラジオ。選んだボードの入力欄に強調の印（--active）が付く。入力欄にフォーカスしても切り替わる。
 * - 枚数ボタン（1〜4）・枚数入力と「枚追加」は、カード名入力の値を「枚数 カード名」の行として選んだボードの末尾に足す。
 * - 「デッキリストを提出する」は送信ボタン、「キャンセル」はマイイベント・デッキ登録画面へのリンク。
 * - 提出に成功すると /ja/deckentry/<デッキID>/check（デッキ登録完了画面。見出し「デッキ登録完了」）へ移る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 大会デッキ登録編集画面のアドレス（イベント詳細IDで開く） */
export const デッキ登録編集のパス = (イベント詳細ID: string) => `/ja/deckentry/${イベント詳細ID}/edit`;

export type マイデッキの行 = { デッキID: string; フォーマット: string; デッキ名: string; プレイヤー: string; 作成日: string; 更新日: string };

export class DeckEntryEditPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  // ---- ログイン（会員ログイン画面） ----
  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール);
    await form.locator("#login_pass").fill(パスワード);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click()]);
    await this.page.waitForLoadState("load");
    if ((await this.page.locator("form#login_mypage").count()) > 0) throw new Error(`会員 ${メール} でログインできない（ログイン画面のまま）`);
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }

  // ---- 開く ----
  /** イベント詳細IDの大会デッキ登録編集画面を開く。応答のHTTPステータスを返す */
  async 開く(イベント詳細ID: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${デッキ登録編集のパス(イベント詳細ID)}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get 見出し(): Locator { return this.page.locator("h1").first(); }
  get 入力フォーム(): Locator { return this.page.locator("form#decklist_submit"); }
  /** 大会デッキ登録編集画面が表示されているか（入力フォームと送信ボタンがある） */
  async 編集画面である(): Promise<boolean> {
    return (await this.入力フォーム.count()) > 0 && (await this.提出ボタン.count()) > 0 && /\/deckentry\/\d+\/edit$/.test(this.path);
  }
  /** 画面の本文（見えている文字） */
  async 本文(): Promise<string> { return (await this.page.locator("body").innerText()).replace(/\s+/g, " "); }

  // ---- パンくず・リンク ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  get 利用ガイド(): Locator { return this.page.locator("a.p-hareruya-deckentry-edit__guide-link"); }
  get キャンセル(): Locator { return this.page.locator(".p-hareruya-deckentry-edit__submit-buttons a").filter({ hasText: /^\s*キャンセル\s*$/ }); }
  get 提出ボタン(): Locator { return this.page.locator('form#decklist_submit button[type="submit"][name="order"]').filter({ hasText: /^\s*デッキリストを提出する\s*$/ }); }

  /** リンク・ボタンを押して次の画面の読み込みを待つ（固定ヘッダーに重ならないよう画面の中ほどへ動かしてから押す） */
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

  // ---- 大会情報 ----
  get 大会名(): Locator { return this.page.locator(".p-hareruya-deckentry-edit__event-title"); }
  /** 大会情報欄の見出し（「開催店舗」など、末尾の「：」を除く）→ 値 */
  async 大会情報(): Promise<Record<string, string>> {
    return this.page.locator(".p-hareruya-deckentry-edit__event-row").evaluateAll((rows) => {
      const out: Record<string, string> = {};
      for (const r of rows) {
        const k = (r.querySelector("dt")?.textContent ?? "").replace(/[：:]\s*$/, "").trim();
        if (k) out[k] = ((r.querySelector("dd") as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();
      }
      return out;
    });
  }
  /** 大会情報欄（見出しから開催日時まで）の文 */
  async 大会情報欄の文(): Promise<string> {
    return (await this.page.locator(".p-hareruya-deckentry-edit__event-section").innerText()).replace(/\s+/g, " ").trim();
  }
  /** 説明欄（画面下部のブロックの欄）の文 */
  get 説明欄(): Locator { return this.page.locator("#how-to-import"); }

  // ---- フォーマット ----
  get フォーマット選択エリア(): Locator { return this.page.locator(".p-hareruya-deckentry-edit__format-select"); }
  /** フォーマット選択エリアの選択肢（表示名） */
  async フォーマットの選択肢(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-deckentry-edit__format-item .p-hareruya-deckentry-edit__format-label").allInnerTexts()).map((t) => t.trim());
  }
  フォーマットの選択肢の要素(名: string): Locator {
    return this.page.locator("label.p-hareruya-deckentry-edit__format-item").filter({ has: this.page.locator(".p-hareruya-deckentry-edit__format-label", { hasText: new RegExp(`^\\s*${esc(名)}\\s*$`) }) });
  }
  /** フォーマット選択エリアで、表示名のフォーマットを選ぶ */
  async フォーマットを選ぶ(名: string): Promise<void> {
    const l = this.フォーマットの選択肢の要素(名);
    await expect(l, `フォーマット選択エリアの「${名}」`).toHaveCount(1);
    await l.click();
    await expect(l.locator("input[type=radio]"), `フォーマット「${名}」が選択された`).toBeChecked();
  }
  /** フォーマット選択エリアで選ばれているフォーマットの表示名（選択エリアが無ければ null） */
  async 選択中のフォーマット(): Promise<string | null> {
    const checked = this.page.locator("label.p-hareruya-deckentry-edit__format-item").filter({ has: this.page.locator("input[type=radio]:checked") });
    if ((await checked.count()) === 0) return null;
    return ((await checked.first().locator(".p-hareruya-deckentry-edit__format-label").innerText()) ?? "").trim();
  }
  /** 送信されるフォーマットの項目（ラジオ・隠し項目） */
  get 選択フォーマットの送信項目(): Locator { return this.page.locator('form#decklist_submit input[name="format"]'); }

  // ---- 入力欄 ----
  get メインボード(): Locator { return this.page.locator("#deckMain"); }
  get サイドボード(): Locator { return this.page.locator("#deckSide"); }
  get 統率領域(): Locator { return this.page.locator("#deckCommand"); }
  get カード名入力(): Locator { return this.page.locator("#cardNameInput"); }
  get 枚数入力(): Locator { return this.page.locator("#cardNumInput"); }
  get 枚追加ボタン(): Locator { return this.page.locator("button.p-hareruya-deckentry-edit__num-submit"); }
  枚数ボタン(n: 1 | 2 | 3 | 4): Locator { return this.page.locator(`button.p-hareruya-deckentry-edit__num-btn[data-value="${n}"]`); }
  ボード選択ボタン(ボード: "メインボード" | "サイドボード" | "統率領域"): Locator {
    return this.page.locator("label.p-hareruya-deckentry-edit__board-item").filter({ has: this.page.locator(".p-hareruya-deckentry-edit__board-label", { hasText: new RegExp(`^\\s*${ボード}\\s*$`) }) });
  }
  async ボードが選択状態か(ボード: "メインボード" | "サイドボード" | "統率領域"): Promise<boolean> {
    return this.ボード選択ボタン(ボード).locator("input[type=radio]").isChecked();
  }
  /** 入力欄に強調表示の印が付いているか */
  async 入力欄が強調表示か(欄: Locator): Promise<boolean> {
    return 欄.evaluate((e) => e.classList.contains("p-hareruya-deckentry-edit__deck-textarea--active"));
  }
  /** 入力欄の値（改行は \n にそろえる） */
  async 値(欄: Locator): Promise<string> { return (await 欄.inputValue()).replace(/\r\n/g, "\n"); }
  /** 入力欄の値を行に分ける（空行は除く） */
  async 行(欄: Locator): Promise<string[]> { return (await this.値(欄)).split("\n").map((l) => l.trim()).filter(Boolean); }

  // ---- カード名のサジェスト ----
  get サジェスト(): Locator { return this.page.locator("[data-deckentry-card-suggest]"); }
  get サジェスト候補(): Locator { return this.page.locator("[data-deckentry-card-suggest-item]"); }
  /** カード名入力に語を入れる（入力の度にサジェストが更新される） */
  async カード名を入れる(語: string): Promise<void> {
    await this.カード名入力.click();
    // 前に入れた語のサジェストが残っていると、新しい候補と取り違える。いったん空にして（サジェストが閉じる）から入れる
    await this.カード名入力.fill("");
    await expect(this.サジェスト, "カード名入力を空にするとサジェストが閉じる").not.toHaveClass(/is-active/);
    await this.カード名入力.fill(語);
  }
  /** サジェストの候補が出るのを待って、表示名を返す（timeout の間に出なければ空） */
  async サジェストの候補(timeout = 10_000): Promise<string[]> {
    const shown = await this.サジェスト.and(this.page.locator(".is-active")).waitFor({ state: "visible", timeout }).then(() => true, () => false);
    if (!shown) return [];
    return (await this.サジェスト候補.allInnerTexts()).map((t) => t.trim());
  }
  async サジェストが表示されているか(): Promise<boolean> {
    return this.サジェスト.evaluate((e) => e.classList.contains("is-active") && e.getAttribute("aria-hidden") === "false");
  }

  // ---- ポップアップ ----
  get インポートボタン(): Locator { return this.page.locator('button[data-js-modal-trigger="deckentry-import"]'); }
  get マイデッキを取得ボタン(): Locator { return this.page.locator('button[data-js-modal-trigger="deckentry-mydeck"]'); }
  get インポート画面(): Locator { return this.page.locator("#deckentry-import"); }
  get マイデッキ画面(): Locator { return this.page.locator("#deckentry-mydeck"); }
  get デッキリスト入力欄(): Locator { return this.page.locator("#arenaDeckList"); }
  get ポップアップ内のインポートボタン(): Locator { return this.page.locator("#copyArenaListButton"); }
  get ポップアップの閉じるボタン(): Locator { return this.page.locator("#closeDeckImportButton"); }

  /** ポップアップが開いているか（画面に見えている） */
  async 開いているか(ポップアップ: Locator): Promise<boolean> {
    if (!(await ポップアップ.isVisible())) return false;
    return (await ポップアップ.getAttribute("aria-hidden")) !== "true";
  }
  async インポート画面を開く(): Promise<void> {
    await this.インポートボタン.click();
    await expect(this.インポート画面, "インポート用ポップアップ画面").toBeVisible();
  }
  async マイデッキ画面を開く(): Promise<void> {
    await this.マイデッキを取得ボタン.click();
    await expect(this.マイデッキ画面, "マイデッキ取得用ポップアップ画面").toBeVisible();
  }
  /**
   * ポップアップの外の領域（画面の左上の隅。ポップアップの枠の外）を押す。
   * 押した位置の要素がポップアップの枠の中でないことを確かめてから押す。
   */
  async ポップアップの外を押す(ポップアップ: Locator): Promise<void> {
    const box = await ポップアップ.locator(".p-hareruya-modal__container").boundingBox();
    if (!box) throw new Error("ポップアップの枠の位置が読めない");
    const vp = this.page.viewportSize() ?? { width: 1280, height: 720 };
    const candidates: [number, number][] = [[5, Math.round(vp.height / 2)], [Math.round(vp.width / 2), vp.height - 5], [vp.width - 5, Math.round(vp.height / 2)], [5, 5]];
    const pt = candidates.find(([x, y]) => x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height);
    if (!pt) throw new Error("ポップアップの枠の外に押せる位置が無い");
    await this.page.mouse.click(pt[0], pt[1]);
  }

  // ---- マイデッキ取得ポップアップ ----
  get マイデッキの行(): Locator { return this.マイデッキ画面.locator("button.p-hareruya-deckentry-edit__mydeck-item"); }
  get マイデッキの件数(): Locator { return this.page.locator("#myDeck_modal_total_count"); }
  get マイデッキが無い表示(): Locator { return this.マイデッキ画面.locator(".p-hareruya-deckentry-edit__mydeck-empty"); }
  get ポップアップのフォーマット選択(): Locator { return this.page.locator("#select_format"); }
  /** マイデッキの一覧のうち、いま見えている行（ページ送り・フォーマットの絞り込みで隠れた行を除く） */
  async 見えているマイデッキ(): Promise<マイデッキの行[]> {
    return this.マイデッキの行.evaluateAll((bs) => bs.filter((b) => !(b as HTMLElement).hidden && (b as HTMLElement).offsetParent !== null).map((b) => {
      const info: Record<string, string> = {};
      for (const row of Array.from(b.querySelectorAll(".p-hareruya-deckentry-edit__mydeck-item-info-row"))) {
        const k = (row.querySelector(".p-hareruya-deckentry-edit__mydeck-item-info-label")?.textContent ?? "").trim();
        info[k] = (row.querySelector(".p-hareruya-deckentry-edit__mydeck-item-info-value")?.textContent ?? "").trim();
      }
      return {
        デッキID: (b as HTMLElement).dataset.deck_id ?? "",
        フォーマット: (b.querySelector(".p-hareruya-deckentry-edit__mydeck-tag")?.textContent ?? "").trim(),
        デッキ名: (b.querySelector(".p-hareruya-deckentry-edit__mydeck-item-name")?.textContent ?? "").trim(),
        プレイヤー: info["プレイヤー"] ?? "", 作成日: info["作成日"] ?? "", 更新日: info["更新日"] ?? "",
      };
    }));
  }
  マイデッキ(デッキ名: string): Locator {
    return this.マイデッキの行.filter({ has: this.page.locator(".p-hareruya-deckentry-edit__mydeck-item-name", { hasText: new RegExp(`^\\s*${esc(デッキ名)}\\s*$`) }) });
  }
  /** マイデッキの一覧で、デッキ名の行を押す（見えている行が1つであること） */
  async マイデッキを選ぶ(デッキ名: string): Promise<void> {
    const l = this.マイデッキ(デッキ名).filter({ visible: true });
    await expect(l, `マイデッキの一覧に「${デッキ名}」の行が1つ見えている`).toHaveCount(1);
    await l.click();
  }
  /** ポップアップ内のフォーマット選択で、表示名のフォーマットを選ぶ */
  async ポップアップでフォーマットを選ぶ(名: string): Promise<void> {
    const have = (await this.ポップアップのフォーマット選択.locator("option").allInnerTexts()).map((t) => t.trim());
    if (!have.includes(名)) throw new Error(`ポップアップ内のフォーマット選択に「${名}」が無い（${have.join("、")}）`);
    await this.ポップアップのフォーマット選択.selectOption({ label: 名 });
  }
  /** マイデッキ取得ポップアップのページ送りで、ページ番号のボタンを押す */
  async マイデッキのページを開く(n: number): Promise<void> {
    const b = this.マイデッキ画面.locator(`button[name="pagination_button"][aria-label="ページ${n}へ"]`).filter({ visible: true }).first();
    await expect(b, `マイデッキ取得ポップアップのページ送りの「${n}」`).toBeVisible();
    await b.click();
    await expect(this.マイデッキ画面.locator(".p-hareruya-pagination__item--current").first(), `ページ ${n} が現在のページになる`).toHaveText(String(n));
  }

  // ---- 提出 ----
  /** 「デッキリストを提出する」を押し、次の画面の読み込みを待つ（ブラウザの入力チェックなどで送られなければ sent=false） */
  async 提出する(): Promise<{ sent: boolean }> {
    await this.提出ボタン.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).then(() => true, () => false);
    await this.提出ボタン.click();
    const sent = await nav;
    await this.page.waitForLoadState("load");
    return { sent };
  }
  /** デッキ登録完了画面か（/deckentry/<デッキID>/check） */
  完了画面のデッキID(): string | null { return /\/deckentry\/(\d+)\/check$/.exec(this.path)?.[1] ?? null; }
  /** 入力形式の誤りの表示（メインボード・サイドボード）が見えているもの */
  async 入力形式の誤りの表示(): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(".p-hareruya-deckentry-edit__deck-list-error").all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out;
  }

  // ---- 開発者ツールでの書き換え（正本の手順「開発者ツールで…」） ----
  /** なりすまし対策トークンの入力要素の値を書き換える */
  async トークンを書き換える(値: string): Promise<void> {
    await this.入力フォーム.locator('input[name="_token"]').evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }
  /** なりすまし対策トークンの入力要素を、フォームから取り除く。取り除いた数を返す */
  async トークンを削除する(): Promise<number> {
    return this.入力フォーム.locator('input[name="_token"]').evaluateAll((es) => { es.forEach((e) => e.remove()); return es.length; });
  }
  /** 選択フォーマットの送信項目を、フォームから取り除く */
  async 選択フォーマットの送信項目を削除する(): Promise<number> {
    return this.選択フォーマットの送信項目.evaluateAll((es) => { es.forEach((e) => e.remove()); return es.length; });
  }
  /** 選択フォーマットの送信項目（選ばれているラジオ・隠し項目）の値を書き換える */
  async 選択フォーマットの値を書き換える(値: string): Promise<number> {
    return this.選択フォーマットの送信項目.evaluateAll((es, v) => {
      const targets = es.filter((e) => (e as HTMLInputElement).type !== "radio" || (e as HTMLInputElement).checked);
      targets.forEach((e) => { (e as HTMLInputElement).value = v; });
      return targets.length;
    }, 値);
  }
  /** マイデッキの一覧の行（デッキ名）の、対象デッキIDの属性を書き換える */
  async マイデッキの対象デッキIDを書き換える(デッキ名: string, デッキID: string): Promise<void> {
    const l = this.マイデッキ(デッキ名);
    await expect(l, `マイデッキの一覧に「${デッキ名}」の行が1つある`).toHaveCount(1);
    await l.evaluate((e, id) => { e.setAttribute("data-deck_id", id); }, デッキID);
  }
}

/** デッキ登録完了画面の見出し */
export async function 完了画面の見出し(page: Page): Promise<string> {
  return ((await page.locator("h1").first().innerText().catch(() => "")) ?? "").trim();
}
