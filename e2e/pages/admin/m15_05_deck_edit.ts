/**
 * M15-05 デッキ編集（管理画面）の画面部品。セレクタはここだけに置く。
 * デッキ一覧（検索）は M15-01 の部品（pages/admin/m15_deck.ts の デッキ一覧）をそのまま使う。
 *
 * 画面の表示名（アプリの翻訳ファイルと画面の作りで確かめたもの）:
 * - 操作ボタン: 新規登録 / 更新 / 削除 / 複製 / 戻る（正本の「複製 >」は画面では「複製」）
 * - 代表カードの検索を開くボタンは「代表カード選択」（開いた画面の題名が「代表カード検索」）。検索ボタンは「検索」、行のボタンは「決定」
 * - プレイヤー・イベントの横の検索ボタンは「検索する」、イベントのクリアは「クリア」
 * - タグの自動設定ボタンは「自動設定」
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { デッキ一覧 } from "./m15_deck";
import { buildCardCsv, CardListPage, downloadCardCsvTemplate, uploadCardCsv } from "./card_csv";
import { findFormatId } from "./m12_09_used_card";
import { フォーマットコード } from "./f09_01_setup";

type Issue = (m: string) => void;

/** 日時欄（datetime-local）の値「2026-05-10T13:30」を、画面の表記「2026/05/10 13:30」にそろえる */
export const 日時の表記 = (v: string) => v.replace("T", " ").replace(/-/g, "/").replace(/^(\S+ \d\d:\d\d):\d\d(\.\d+)?$/, "$1");
/** 「2026/05/10 13:30」→ 日時欄に入れる値「2026-05-10T13:30」 */
export const 日時欄の値 = (v: string) => v.replace(/\//g, "-").replace(" ", "T");

export type デッキ内容 = {
  デッキ名?: string;
  /** デッキリスト公開状態の「非公開(採用カード情報を公開しない)」 */
  デッキリスト非公開?: boolean;
  /** 画面の選択肢の表示（「event」「user」） */
  デッキ種別?: string;
  フォーマット?: string;
  アーキタイプ?: string;
  タグ?: string[];
  公開状態?: "公開" | "非公開" | "限定公開";
  /** 代表カードの検索で選ぶカード名（完全一致で検索して、そのカードの行の「決定」を押す） */
  代表カード?: string;
  プレイヤー名?: string;
  /** プレイヤー検索の画面でこの語を検索して、ID が最大の行（いま作った会員のプレイヤー）を選ぶ。デッキの持ち主にするとき */
  プレイヤー検索?: string;
  イベント名日?: string; イベント名英?: string;
  /** 「2026/05/10 13:30」の形 */
  開催日?: string;
  順位?: string; 成績?: string; 引用元URL?: string; 参加人数?: string;
  統率?: string; メイン?: string; サイド?: string;
};

/** デッキ新規登録画面・デッキ編集画面 */
export class デッキ編集画面 {
  constructor(readonly page: Page) {}

  f(name: string): Locator { return this.page.locator(`[name="admin_deck[${name}]"], [name="admin_deck[${name}][]"]`).first(); }
  get デッキ名() { return this.f("deckName"); }
  get デッキリスト非公開() { return this.f("privateFlg"); }
  get デッキ種別() { return this.f("DeckType"); }
  get フォーマット() { return this.f("Format"); }
  get アーキタイプ() { return this.f("Archetype"); }
  get タグ() { return this.f("DeckTags"); }
  get 公開状態() { return this.f("Disp"); }
  get プレイヤー名() { return this.f("playerName"); }
  get イベント名日() { return this.f("eventNameJp"); }
  get イベント名英() { return this.f("eventNameEn"); }
  get 開催日() { return this.f("eventDate"); }
  get 順位() { return this.f("ranking"); }
  get 成績() { return this.f("result"); }
  get 引用元URL() { return this.f("sourceUrl"); }
  get 参加人数() { return this.f("participants"); }
  get 統率() { return this.f("textCommand"); }
  get メイン() { return this.f("textMain"); }
  get サイド() { return this.f("textSide"); }

  /** 右側の操作ボタンの欄 */
  get 操作欄() { return this.page.locator(".c-contentsArea__cols .col-md-2 .card-body"); }
  get 新規登録ボタン() { return this.操作欄.locator('button[type="submit"][form="admin_deck"]').filter({ hasText: /^\s*新規登録\s*$/ }); }
  get 更新ボタン() { return this.操作欄.locator('button[type="submit"][form="admin_deck"]').filter({ hasText: /^\s*更新\s*$/ }); }
  get 削除ボタン() { return this.page.locator("#btn_delete"); }
  get 複製ボタン() { return this.操作欄.locator('[data-bs-target="#copyModal"]'); }
  get 戻るボタン() { return this.操作欄.locator("a").filter({ hasText: /^\s*戻る\s*$/ }); }
  get 自動設定ボタン() { return this.page.locator("#btn_tag_auto_set"); }
  get 代表カード選択ボタン() { return this.page.locator('[data-bs-target="#searchCardImageModal"]'); }
  get プレイヤー検索ボタン() { return this.page.locator('[data-bs-target="#searchPlayerModal"]'); }
  get イベント検索ボタン() { return this.page.locator('[data-bs-target="#searchEventModal"]'); }
  get イベントクリアボタン() { return this.page.locator("#clear_event"); }
  get 代表カード画像() { return this.page.locator("#cardImagePreview"); }
  get 代表カード名() { return this.page.locator("#selectedCardImageName"); }
  get 代表カード検索画面() { return this.page.locator("#searchCardImageModal"); }
  get プレイヤー検索画面() { return this.page.locator("#searchPlayerModal"); }
  get イベント検索画面() { return this.page.locator("#searchEventModal"); }
  get 複製画面() { return this.page.locator("#copyModal"); }
  get 複製回数() { return this.複製画面.locator('input[name$="[copy]"]'); }
  get 複製保存ボタン() { return this.複製画面.locator('button[type="submit"]').filter({ hasText: /^\s*複製保存\s*$/ }); }
  get 複製新規ボタン() { return this.複製画面.locator("a").filter({ hasText: /^\s*複製新規\s*$/ }); }

  /** 画面が読み込まれ、画面の仕掛け（選択欄の表示の切り替え）が動いた状態まで待つ */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.デッキ名, "デッキ新規登録・編集画面のデッキ名").toBeAttached();
    await expect(this.page.locator(".select2-container").first(), "選択欄の表示（画面の仕掛け）").toBeAttached();
  }

  /** 右側の操作欄に表示されているボタン・リンクの名前 */
  async 操作ボタンの名前(): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.操作欄.locator("button, a").all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out;
  }

  /** 選択欄で選ばれている選択肢の表示（複数のときは全部） */
  async 選択中(sel: Locator): Promise<string[]> {
    return (await sel.locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter((t) => t !== "" && t !== "単一選択");
  }
  async 選択肢(sel: Locator): Promise<string[]> {
    return (await sel.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** 代表カードの表示（名前の欄の文字と、画像の参照先。表示されていなければ空） */
  async 代表カード(): Promise<{ 名前: string; 画像: string }> {
    const 名前 = (await this.代表カード名.isVisible()) ? (await this.代表カード名.innerText()).trim() : "";
    const 画像 = (await this.代表カード画像.isVisible()) ? ((await this.代表カード画像.getAttribute("src")) ?? "") : "";
    return { 名前, 画像 };
  }

  /** 画面上部の警告（黄色の帯）の文 */
  async 警告(): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(".alert-warning").all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out;
  }
  /** 画面上部の成功・エラーの帯の文 */
  async 成功の帯(): Promise<string[]> { return this.帯(".alert-success"); }
  async エラーの帯(): Promise<string[]> { return this.帯(".alert-danger"); }
  private async 帯(sel: string): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(sel).all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out;
  }

  async フォーマットを選ぶ(名: string): Promise<void> { await chooseByLabel(this.フォーマット, 名); }
  /**
   * アーキタイプを選ぶ。代表カードが未設定なら、画面はアーキタイプの代表カードを読みに行く。その応答を待ってから戻る
   * （待たずに代表カードを選ぶと、遅れて返った応答が選んだ代表カードを上書きしうる）。代表カードが設定済みなら要求は出ない（5秒で諦める）。
   */
  async アーキタイプを選ぶ(名: string): Promise<void> {
    const res = this.page.waitForResponse((r) => r.url().includes("/deck/archetype_card_image/"), { timeout: 5_000 }).catch(() => null);
    await chooseByLabel(this.アーキタイプ, 名);
    await res;
  }

  /** 選択欄（select2）に語を入力し、表示された候補から選ぶ。候補の表示を返す */
  async 候補から選ぶ(sel: Locator, 語: string): Promise<string[]> {
    const box = sel.locator("xpath=following-sibling::span[contains(@class,'select2-container')][1]");
    await box.locator(".select2-selection").click();
    const search = this.page.locator(".select2-container--open .select2-search__field");
    if (await search.count()) await search.last().fill(語);
    else await this.page.keyboard.type(語);
    const options = this.page.locator(".select2-container--open .select2-results__option");
    await expect(options.first(), `「${語}」の候補`).toBeVisible();
    const 候補 = (await options.allInnerTexts()).map((t) => t.trim());
    const hit = options.filter({ hasText: new RegExp(`^\\s*${語.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
    if (await hit.count()) await hit.first().click();
    return 候補;
  }

  /**
   * プレイヤー検索の画面を開き、語で検索して、語を名前に含む行のうち ID が最大のものの「決定」を押す（画面が閉じるまで待つ）。
   * 選んだプレイヤーの ID を返す。決定すると、プレイヤー名の欄にプレイヤーの英語表記が入る。
   */
  async プレイヤーを選ぶ(語: string): Promise<string> {
    await this.プレイヤー検索ボタン.click();
    await expect(this.プレイヤー検索画面, "プレイヤー検索の画面").toBeVisible();
    await this.プレイヤー検索画面.locator("#player_search_word").fill(語);
    await this.プレイヤー検索画面.locator("#btn_search_player").click();
    const 行 = this.プレイヤー検索画面.locator("#player_search_results tbody tr").filter({ hasText: 語 });
    await expect(行.first(), `プレイヤー検索の結果に「${語}」の行`).toBeVisible({ timeout: 30_000 });
    const ids = await 行.evaluateAll((trs) => trs.map((tr) => Number(tr.querySelector("td")?.textContent?.trim() ?? "0")));
    const i = ids.indexOf(Math.max(...ids));
    await 行.nth(i).locator("button.select-player").click();
    await expect(this.プレイヤー検索画面, "「決定」を押すとプレイヤー検索の画面が閉じる").toBeHidden();
    return String(ids[i]);
  }

  /** 代表カード検索の画面を開き、カード名で検索して、そのカードの行の「決定」を押す（画面が閉じるまで待つ） */
  async 代表カードを選ぶ(カード名: string, opt: { 完全一致?: boolean } = {}): Promise<void> {
    await this.代表カード選択ボタン.click();
    await expect(this.代表カード検索画面, "代表カード検索の画面").toBeVisible();
    await this.代表カード検索画面.locator("#card_image_search_word").fill(カード名);
    if (opt.完全一致) await this.代表カード検索画面.locator("#card_image_exact_match").check();
    await this.代表カード検索画面.locator("#btn_search_card_image").click();
    const 行 = this.代表カード検索画面.locator(`button.select-card-image[data-name="${カード名}"]`);
    await expect(行.first(), `代表カード検索の結果に「${カード名}」の行`).toBeVisible({ timeout: 30_000 });
    await 行.first().click();
    await expect(this.代表カード検索画面, "「決定」を押すと代表カード検索の画面が閉じる").toBeHidden();
  }

  /** イベント検索の画面で条件を入れて「検索」を押し、結果の表示を待つ */
  async イベントを検索する(v: { イベント名?: string; 店舗?: string; 開催日From?: string; 開催日To?: string }): Promise<void> {
    const m = this.イベント検索画面;
    if (!(await m.isVisible())) { await this.イベント検索ボタン.click(); await expect(m, "イベント検索の画面").toBeVisible(); }
    await m.locator("#event_search_word").fill(v.イベント名 ?? "");
    if (v.店舗 !== undefined) await chooseByLabel(m.locator("#event_search_shop"), v.店舗);
    if (v.開催日From !== undefined) await m.locator("#event_search_from").fill(v.開催日From.replace(/\//g, "-"));
    if (v.開催日To !== undefined) await m.locator("#event_search_to").fill(v.開催日To.replace(/\//g, "-"));
    const res = this.page.waitForResponse((r) => r.url().includes("/deck/search_event"));
    await m.locator("#btn_search_event").click();
    await res;
    await expect(m.locator("#event_search_results table, #event_search_results p").first(), "イベント検索の結果").toBeVisible();
  }
  /** イベント検索の結果の行（日程ごと）: イベントID・イベント名(日)・(英)・開催日 */
  async イベント検索の結果(): Promise<{ イベントID: string; 名日: string; 名英: string; 開催日: string; 日程ID: string }[]> {
    return this.イベント検索画面.locator("button.select-event").evaluateAll((bs) => bs.map((b) => {
      const tr = b.closest("tr")!;
      let head: Element | null = tr;
      while (head && !head.querySelector("td[rowspan]")) head = head.previousElementSibling;
      const tds = head ? head.querySelectorAll("td[rowspan]") : [];
      return {
        イベントID: (tds[0]?.textContent ?? "").trim(),
        名日: (b as HTMLElement).dataset.nameJp ?? "", 名英: (b as HTMLElement).dataset.nameEn ?? "",
        開催日: (b as HTMLElement).dataset.date ?? "", 日程ID: (b as HTMLElement).dataset.id ?? "",
      };
    }));
  }
  /** イベント検索の結果で、イベントIDごとにまとめた表示（1つのイベントの行に並ぶ開催日） */
  async イベント検索のまとまり(): Promise<{ イベントID: string; 名: string; 開催日: string[] }[]> {
    return this.イベント検索画面.locator("#event_search_results tbody tr").evaluateAll((trs) => {
      const out: { イベントID: string; 名: string; 開催日: string[] }[] = [];
      for (const tr of trs) {
        const tds = Array.from(tr.querySelectorAll("td"));
        // 開催日の欄は「日付<br><small>時刻</small>」。改行を空白にして「2026/04/01 10:00」の形で読む
        const date = ((tds.find((td) => !td.hasAttribute("rowspan") && !td.querySelector("button")) as HTMLElement | undefined)?.innerText ?? "").replace(/\s+/g, " ").trim();
        if (tds[0]?.hasAttribute("rowspan")) out.push({ イベントID: (tds[0].textContent ?? "").trim(), 名: ((tds[1] as HTMLElement | undefined)?.innerText ?? "").replace(/\s+/g, " ").trim(), 開催日: [] });
        if (out.length) out[out.length - 1].開催日.push(date);
      }
      return out;
    });
  }
  /** イベント検索の画面の「店舗」の欄 */
  get イベント検索の店舗() { return this.イベント検索画面.locator("#event_search_shop"); }
  /** イベント検索の画面の「店舗」の選択肢（未選択の「単一選択」を除く表示名） */
  async 店舗の選択肢(): Promise<string[]> {
    return this.イベント検索の店舗.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }
  /** イベント検索の画面の「店舗」で選ばれている表示名 */
  async 選ばれた店舗(): Promise<string> {
    return ((await this.イベント検索の店舗.locator("option:checked").textContent()) ?? "").trim();
  }
  /** 入力補助（select2）の欄が「店舗」に付いているか */
  async 店舗に入力補助がある(): Promise<boolean> {
    return (await this.イベント検索の店舗.locator("xpath=following-sibling::span[contains(@class,'select2-container')][1]").count()) > 0;
  }
  /**
   * 「店舗」の欄に語を打つ。入力補助（select2）があれば、その入力欄に打って出た候補の表示を返す。
   * 入力補助が無い（ふつうの選択欄）なら、欄に手を置いてキーボードで打つ（候補の一覧は出ないので空を返す）。
   */
  async 店舗に打つ(語: string): Promise<{ 入力補助: boolean; 候補: string[] }> {
    if (await this.店舗に入力補助がある()) {
      const box = this.イベント検索の店舗.locator("xpath=following-sibling::span[contains(@class,'select2-container')][1]");
      await box.locator(".select2-selection").click();
      const search = this.page.locator(".select2-container--open .select2-search__field");
      if (await search.count()) await search.last().fill(語);
      else await this.page.keyboard.type(語);
      const options = this.page.locator(".select2-container--open .select2-results__option");
      await options.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
      return { 入力補助: true, 候補: (await options.allInnerTexts()).map((t) => t.trim()) };
    }
    await this.イベント検索の店舗.focus();
    await this.page.keyboard.type(語);
    return { 入力補助: false, 候補: [] };
  }
  /** 打ったあとに表示された候補（select2）の中から、表示が語と一致するものを押す。押せたかを返す */
  async 店舗の候補を押す(語: string): Promise<boolean> {
    const hit = this.page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${語.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
    if ((await hit.count()) === 0) return false;
    await hit.first().click();
    return true;
  }

  /** イベント検索の結果の、指定の日程の「決定」を押す */
  async イベントを決定する(日程ID: string): Promise<void> {
    await this.イベント検索画面.locator(`button.select-event[data-id="${日程ID}"]`).click();
  }
  async イベント検索のページ(): Promise<{ 現在: string; 番号: string[] }> {
    const items = this.イベント検索画面.locator("#event_search_results .pagination .page-link");
    const 番号 = (await items.allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d+$/.test(t));
    const 現在 = ((await this.イベント検索画面.locator("#event_search_results .pagination .page-item.active").innerText().catch(() => "")) ?? "").trim();
    return { 現在, 番号 };
  }

  /** 送信ボタン（新規登録・更新）を押して、次の画面の読み込みを待つ */
  async 送信する(button: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  }

  /** 「削除」を押し、確認ダイアログで OK（または キャンセル）を押す。ダイアログの文を返す */
  async 削除する(ok = true): Promise<string> {
    let 文 = "";
    this.page.once("dialog", (d) => { 文 = d.message(); void (ok ? d.accept() : d.dismiss()); });
    if (ok) await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.削除ボタン.click()]);
    else { await this.削除ボタン.click(); await expect.poll(() => 文, "確認ダイアログが出る").not.toBe(""); }
    return 文;
  }

  /** 「複製」を押して複製の画面を開く */
  async 複製の画面を開く(): Promise<void> {
    await this.複製ボタン.click();
    await expect(this.複製画面, "デッキ情報複製の画面").toBeVisible();
  }

  /** 入力（指定の項目だけ）。フォーマット→アーキタイプの順に選ぶ（アーキタイプの選択肢はフォーマットで絞られる） */
  async 入力する(v: デッキ内容, issue: Issue = () => {}): Promise<void> {
    if (v.デッキ名 !== undefined) await this.デッキ名.fill(v.デッキ名);
    if (v.デッキリスト非公開 !== undefined) await this.デッキリスト非公開.setChecked(v.デッキリスト非公開);
    if (v.デッキ種別 !== undefined) await chooseByLabel(this.デッキ種別, v.デッキ種別);
    if (v.フォーマット !== undefined) await this.フォーマットを選ぶ(v.フォーマット);
    if (v.アーキタイプ !== undefined) await this.アーキタイプを選ぶ(v.アーキタイプ);
    if (v.タグ !== undefined) await chooseByLabel(this.タグ, v.タグ);
    if (v.公開状態 !== undefined) await chooseByLabel(this.公開状態, v.公開状態);
    if (v.代表カード !== undefined) await this.代表カードを選ぶ(v.代表カード, { 完全一致: true });
    if (v.プレイヤー名 !== undefined) await this.プレイヤー名.fill(v.プレイヤー名);
    if (v.プレイヤー検索 !== undefined) await this.プレイヤーを選ぶ(v.プレイヤー検索);
    if (v.イベント名日 !== undefined) await this.イベント名日.fill(v.イベント名日);
    if (v.イベント名英 !== undefined) await this.イベント名英.fill(v.イベント名英);
    if (v.開催日 !== undefined) await this.開催日.fill(v.開催日 === "" ? "" : 日時欄の値(v.開催日));
    if (v.順位 !== undefined) await this.順位.fill(v.順位);
    if (v.成績 !== undefined) await this.成績.fill(v.成績);
    if (v.引用元URL !== undefined) await this.引用元URL.fill(v.引用元URL);
    if (v.参加人数 !== undefined) await this.参加人数.fill(v.参加人数);
    if (v.統率 !== undefined) await this.統率.fill(v.統率);
    if (v.メイン !== undefined) await this.メイン.fill(v.メイン);
    if (v.サイド !== undefined) await this.サイド.fill(v.サイド);
    void issue;
  }

  /** 入力欄の最大文字数の属性を外す（正本の「開発者ツールで…外してから入力する」） */
  async 最大文字数を外す(欄: Locator): Promise<void> {
    await 欄.evaluate((e) => e.removeAttribute("maxlength"));
  }
  /** 入力欄の種類を文字入力に変える（正本の「開発者ツールで…文字入力に変えて」） */
  async 文字入力に変える(欄: Locator): Promise<void> {
    await 欄.evaluate((e) => { (e as HTMLInputElement).type = "text"; });
  }
  /** 削除の送信に使われる隠し項目のトークンを書き換える（正本の「開発者ツールで…別の文字列に書き換える」） */
  async 削除のトークンを書き換える(値: string): Promise<void> {
    await this.page.locator('#delete_form input[name="_token"]').evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /** 開いているデッキ編集画面のデッキID（アドレスの番号） */
  デッキID(): string {
    const m = /\/deck\/(\d+)\/edit/.exec(this.page.url());
    if (!m) throw new Error(`デッキ編集画面のアドレスでない（${this.page.url()}）`);
    return m[1];
  }
}

/** デッキ一覧を開き、デッキ名を入れて「日付クリア」「検索する」を押す */
export async function デッキ名で検索する(page: Page, デッキ名: string): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.f("deck_name").fill(デッキ名);
  await l.日付クリア.click();
  await l.検索する();
  return l;
}

/** 検索結果のデッキ情報の行（デッキ名が完全に一致する行）の、デッキ情報のリンク */
export function デッキ情報のリンク(page: Page, デッキ名: string): Locator {
  const 行 = page.locator(".deck-result-table tbody tr").filter({
    has: page.locator(".row.mb-1").filter({ has: page.locator(".text-muted", { hasText: /^\s*デッキ名\s*$/ }) })
      .filter({ has: page.locator("div:not(.text-muted)", { hasText: new RegExp(`^\\s*${デッキ名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }),
  });
  return 行.locator("td").nth(1).locator("a").first();
}

/** 検索結果のデッキ情報をクリックしてデッキ編集画面を開く */
export async function デッキ情報を開く(page: Page, デッキ名: string): Promise<デッキ編集画面> {
  const link = デッキ情報のリンク(page, デッキ名);
  await expect(link, `検索結果に「${デッキ名}」の行がある`).toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  return e;
}

/** デッキ一覧の「新規登録」を押してデッキ新規登録画面を開く */
export async function 新規登録画面を開く(page: Page, l?: デッキ一覧): Promise<デッキ編集画面> {
  const list = l ?? new デッキ一覧(page);
  await Promise.all([page.waitForURL(/\/deck\/new$/, { waitUntil: "load" }), list.新規登録.click()]);
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  return e;
}

/** シード用: デッキ新規登録画面で入力して「新規登録」を押し、振られたデッキIDを返す */
export async function デッキを登録する(page: Page, v: デッキ内容, issue: Issue = () => {}): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.入力する(v, issue);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `デッキ「${v.デッキ名 ?? ""}」の登録`)) issue(`デッキ「${v.デッキ名 ?? ""}」の登録時の警告「${w}」`);
  return e.デッキID();
}

/** シード用: デッキ名（部分一致）で検索し、出たデッキを1件ずつ編集画面の「削除」で消す。消した件数を返す */
export async function デッキ名で消す(page: Page, 語: string, issue: Issue = () => {}): Promise<number> {
  let n = 0;
  for (let i = 0; i < 50; i++) {
    const l = await デッキ名で検索する(page, 語);
    const ids = await l.表示されたID();
    if (ids.length === 0) return n;
    await page.goto(adminUrl(`/deck/${ids[0]}/edit`));
    const e = new デッキ編集画面(page);
    await e.読み込みを待つ();
    await e.削除する(true);
    const 帯 = await e.エラーの帯();
    if (帯.length) { issue(`残っていたデッキ（ID ${ids[0]}）を削除できなかった: ${帯.join(" / ")}`); throw new Error(`デッキ（ID ${ids[0]}）を削除できない: ${帯.join(" / ")}`); }
    n++;
  }
  throw new Error(`デッキ名「${語}」のデッキを50件消しても0件にならない`);
}

// ---- フォーマット（シード用） ----

/** フォーマット名(英)。半角英数字だけ入る欄なので、名がそうでなければ名から決まる値（カードCSVの使用可能・使用禁止フォーマットもこの名で書く） */
export function フォーマット英名(名: string): string {
  return /^[A-Za-z0-9_\- ]+$/.test(名) ? 名 : フォーマットコード(名);
}

export type フォーマット設定 = {
  名: string; 並び順: string;
  メイン上限?: string; メイン下限?: string;
  統率を使う: boolean; ハイランダー: boolean;
  /** 省略はフォーマット名(日)と同じ */
  名英?: string;
  /** 省略は、空なら 30 */
  メタ日数?: string;
  /** 省略は変えない */
  ランキング表示?: boolean; メタ分布簡易化?: boolean;
};

/**
 * フォーマットを、あれば編集画面で記載の値へ戻して保存し、無ければ新規登録する。フォーマットIDを返す。
 * フォーマット名(日)・(英)は同じ値。記載の無い上限枚数・下限枚数は空。メタゲーム分析日数は必須の欄なので、空なら 30 を入れる。
 */
export async function フォーマットを用意する(page: Page, v: フォーマット設定, issue: Issue): Promise<string> {
  const found = await findFormatId(page, v.名);
  await page.goto(adminUrl(found ? `/format/${found}/edit` : "/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名);
  // フォーマット名(英)は画面の入力規則（半角英数字と _ - 空白）がある。正本の名（日本語）が入らないときは、名から決まる規則に合う値を入れる
  const 英 = v.名英 ?? フォーマット英名(v.名);
  await f("nameEn").fill(英);
  if (英 !== v.名 && v.名英 === undefined) issue(`フォーマット「${v.名}」: フォーマット名(英)は半角英数字だけ入る欄のため「${英}」を入れた（正本はフォーマット名(英)を定めない）`);
  if (!found) await f("rank").fill(v.並び順);
  // フォーマットコードは画面の入力規則（10文字以内・半角英数字と _ - 空白）があり、正本のフォーマット名（日本語）は入らない。
  // 正本はコードを定めないので、名から決まる規則に合う値を入れる（F09-01 と同じ作り）
  const code = f("code");
  if (await code.count()) {
    const now = await code.inputValue();
    if (!/^[A-Za-z0-9_\- ]{1,10}$/.test(now)) await code.fill(フォーマットコード(v.名));
  }
  if (v.メタ日数 !== undefined) await f("MetaRange").fill(v.メタ日数);
  else if ((await f("MetaRange").inputValue()) === "") { await f("MetaRange").fill("30"); issue(`フォーマット「${v.名}」: メタゲーム分析日数は必須の欄のため 30 を入れた（正本は値を定めない）`); }
  if (v.ランキング表示 !== undefined) await f("rankingFlg").setChecked(v.ランキング表示);
  if (v.メタ分布簡易化 !== undefined) await f("OtherMetaFlg").setChecked(v.メタ分布簡易化);
  await f("mainMaxCardCount").fill(v.メイン上限 ?? "");
  await f("mainMinCardCount").fill(v.メイン下限 ?? "");
  await f("sideMaxCardCount").fill("");
  await f("sideMinCardCount").fill("");
  await f("useCommandFlg").setChecked(v.統率を使う);
  for (const n of ["commandMaxCardCount", "commandMinCardCount"]) if (await f(n).isEnabled()) await f(n).fill("");
  await f("HighlanderFlg").setChecked(v.ハイランダー);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録|更新)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の${found ? "保存" : "登録"}`)) issue(`フォーマット「${v.名}」の警告「${w}」`);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  return m ? m[1] : (found ?? "");
}

// ---- アーキタイプ（シード用） ----

export type アーキタイプ設定 = { 名日: string; 名英: string; フォーマット: string; 代表カード?: string; タグ?: string[] };

/** アーキタイプ管理で、アーキタイプ名で検索した結果の行（名称・登録デッキ数・編集画面のID） */
export async function アーキタイプを検索する(page: Page, 語: string): Promise<{ ID: string; 名日: string; 登録デッキ数: string }[]> {
  await page.goto(adminUrl("/archetype"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_archetype[multi]"]').fill(語);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form button[type="submit"]').filter({ hasText: /検索する/ }).first().click()]);
  return アーキタイプ検索の結果(page);
}
export async function アーキタイプ検索の結果(page: Page): Promise<{ ID: string; 名日: string; 登録デッキ数: string }[]> {
  return page.locator(".archetype-result-table tbody tr").evaluateAll((trs) => trs.filter((tr) => tr.querySelectorAll("td").length >= 6).map((tr) => {
    const tds = tr.querySelectorAll("td");
    const name = (tds[2].textContent ?? "").trim();
    return { ID: (tds[1].textContent ?? "").trim(), 名日: name.split(" / ")[0].trim(), 登録デッキ数: (tds[5].textContent ?? "").trim() };
  }));
}

/** アーキタイプを、あれば編集画面で記載の値へ戻して保存し、無ければ新規登録する */
export async function アーキタイプを用意する(page: Page, v: アーキタイプ設定, issue: Issue): Promise<string> {
  const hit = (await アーキタイプを検索する(page, v.名日)).filter((r) => r.名日 === v.名日);
  if (hit.length > 1) throw new Error(`アーキタイプ「${v.名日}」が複数ある`);
  await page.goto(adminUrl(hit.length ? `/archetype/${hit[0].ID}/edit` : "/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"], [name="admin_archetype[${n}][]"]`).first();
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), v.フォーマット);
  await f("DeckTags").selectOption((v.タグ ?? []).map((label) => ({ label })));
  if (v.代表カード) {
    await page.locator('[data-bs-target="#searchCardImageModal"]').click();
    const m = page.locator("#searchCardImageModal");
    await expect(m, "代表カード検索の画面").toBeVisible();
    await m.locator("#card_image_search_word").fill(v.代表カード);
    await m.locator("#card_image_exact_match").check();
    await m.locator("#btn_search_card_image").click();
    const b = m.locator("button.select-card-image");
    await expect(b.first(), `代表カード検索の結果に「${v.代表カード}」`).toBeVisible({ timeout: 30_000 });
    await b.first().click();
    await expect(m).toBeHidden();
  } else if (hit.length) {
    await page.locator("#admin_archetype_cardImageId").evaluate((e) => { (e as HTMLInputElement).value = ""; });
    issue(`アーキタイプ「${v.名日}」は前回の残りを使った。代表カードは未設定に戻した`);
  }
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${v.名日}」の${hit.length ? "保存" : "登録"}`)) issue(`アーキタイプ「${v.名日}」の警告「${w}」`);
  const m = /\/archetype\/(\d+)\/edit/.exec(page.url());
  return m ? m[1] : hit[0]?.ID ?? "";
}

// ---- カード（シード用。カードCSVアップロード） ----

export type カード設定 = {
  名英: string; 名日?: string; テキスト日?: string; テキスト英?: string;
  使用可?: string[]; 禁止?: string[];
};

/** カード一覧をキーワードで検索し、表示された行をCSV出力して返す */
async function カードをCSVで読む(page: Page, 語: string): Promise<Record<string, string>[]> {
  const list = new CardListPage(page);
  await list.open();
  await page.locator("#admin_search_card_multi").fill(語);
  await list.search();
  if ((await list.rows.count()) === 0) return [];
  return list.exportFirst(20);
}

/** 画像のある既存のカードから、互いに違う画像URL・カードセット・レアリティ・レイアウトを n 件読む（古いカードから） */
async function 既存の画像を読む(page: Page, n: number): Promise<{ set: string; rarity: string; layout: string; image: string }[]> {
  const list = new CardListPage(page);
  await list.open();
  await list.search();
  await list.sortBy("id:ASC");
  const rows = await list.exportFirst(40);
  const out: { set: string; rarity: string; layout: string; image: string }[] = [];
  for (const r of rows) {
    if (!(r.set && r.rarity && r.layout && r.image_en)) continue;
    if (out.some((o) => o.image === r.image_en)) continue;
    out.push({ set: r.set, rarity: r.rarity, layout: r.layout, image: r.image_en });
    if (out.length === n) return out;
  }
  throw new Error(`画像のある既存のカードから、違う画像を${n}件読めない（${out.length}件）`);
}

/**
 * カードを、カードCSVアップロードで登録（あれば同じカード詳細を更新）する。
 * 画像は、既存のカードにある画像URLを、カードごとに違うものを使う。カード名(英)→画像URL を返す。
 */
export async function カードを用意する(page: Page, defs: カード設定[], what: string, issue: Issue): Promise<Map<string, string>> {
  const imgs = await 既存の画像を読む(page, defs.length);
  const headers = await downloadCardCsvTemplate(page);
  const rows: Record<string, string>[] = [];
  const out = new Map<string, string>();
  for (const [i, d] of defs.entries()) {
    const have = (await カードをCSVで読む(page, d.名英)).filter((r) => r.name_en === d.名英);
    const detailIds = [...new Set(have.map((r) => r.card_detail_id).filter(Boolean))];
    if (detailIds.length > 1) issue(`${what}: カード「${d.名英}」には詳細が${detailIds.length}件ある。先頭（ID ${detailIds[0]}）を記載の値に戻した`);
    const image = have.find((r) => r.card_detail_id === detailIds[0])?.image_en || imgs[i].image;
    rows.push({
      name_en: d.名英, name_jp: d.名日 ?? d.名英, cmc: "0", text_jp: d.テキスト日 ?? "", text_en: d.テキスト英 ?? "",
      format: (d.使用可 ?? []).map(フォーマット英名).join(","), ban_format: (d.禁止 ?? []).map(フォーマット英名).join(","),
      set: imgs[i].set, rarity: imgs[i].rarity, layout: imgs[i].layout, image_en: image, card_detail_id: detailIds[0] ?? "",
    });
    out.set(d.名英, image);
  }
  const known = new Set(headers);
  for (const r of rows) for (const k of Object.keys(r)) if (!known.has(k)) delete r[k];
  await uploadCardCsv(page, buildCardCsv(headers, rows), `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, `${what} のカードCSVアップロード`, (w) => issue(`${what}: カードCSVの警告「${w}」`));
  return out;
}

/** カード一覧をキーワードで検索して、カード名(英)が一致するカードがあるか（CSV出力の行で確かめる） */
export async function カードがあるか(page: Page, 名英: string): Promise<boolean> {
  return (await カードをCSVで読む(page, 名英)).some((r) => r.name_en === 名英);
}
