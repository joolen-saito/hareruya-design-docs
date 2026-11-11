/**
 * M13-12 イベント新規申込登録（イベント申込登録（検索結果）の「新規登録」から開く画面）と、プレイヤー検索ポップアップの操作。
 * セレクタはここだけに書く。正本: cases/M13-12_test_cases.tsv
 */
import { Locator, Page, Response, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { EntrySearchPage } from "./m13_11_entry_search";

const T = 30_000;
const 整える = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

export class EntryNewPage {
  constructor(readonly page: Page) {}

  // ---- 新規申込登録画面 ----
  get フォーム(): Locator { return this.page.locator("#event_form"); }
  get 申込情報(): Locator { return this.page.locator("#entryApplicationInfo"); }
  get 申込状況(): Locator { return this.page.locator('[name="admin_event_entry_detail[EntryStatus]"]'); }
  get 支払方法(): Locator { return this.page.locator('[name="admin_event_entry_detail[Payment]"]'); }
  get 支払金額(): Locator { return this.page.locator('[name="admin_event_entry_detail[price]"]'); }
  get 検索ボタン(): Locator { return this.page.locator("#search_button--1"); }
  get 削除ボタン(): Locator { return this.page.locator("#clear_button--1"); }
  get 登録ボタン(): Locator { return this.page.locator("#submit_entry"); }
  /** プレイヤー情報欄（1行目）のプレイヤー名 */
  get プレイヤー名(): Locator { return this.page.locator("#detail_player__name_jp--1"); }
  /** プレイヤー情報欄（1行目）のMTG Companion登録本名 */
  get MTG本名(): Locator { return this.page.locator("#detail_player__name_en--1"); }
  /** プレイヤー情報欄（1行目）に選ばれているプレイヤーID（画面に見えない欄） */
  get 選んだプレイヤーID(): Locator { return this.page.locator("#player_id--1"); }
  /** 登録で送る「参加者として選んだプレイヤーID」（画面に見えない欄） */
  get 送るプレイヤーID(): Locator { return this.page.locator('[name="admin_event_entry_detail[entryPlayer]"]'); }
  /** 画面下部の「イベント申込登録」リンク（イベント申込登録（検索結果）へ戻る） */
  get イベント申込登録リンク(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink").filter({ hasText: "イベント申込登録" }); }
  /** なりすまし対策トークンを持つフォーム */
  get 送信フォーム(): Locator { return this.フォーム; }

  /** 日程IDを指定して開く（アドレスを直接開く）。応答を返す */
  async 開く(日程ID: string): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/entry_registration/new/${日程ID}`));
    await this.page.waitForLoadState("load");
    return res;
  }

  /** イベント申込登録（検索結果）でイベント名を検索し、日程の行の「新規登録」から開く（店舗・開催日は指定しない） */
  async 検索結果から開く(イベント名: string, 日程ID: string): Promise<void> {
    const s = new EntrySearchPage(this.page);
    const row = s.日程の行(日程ID);
    // 共有の開発環境では、登録した直後の日程が検索結果にすぐ出ないことがある（同じ作りのシードが、続けて流した中で通ったり通らなかったりした。
    // 2026-11-10 の開発環境の実行）。0件のときは間をおいて検索し直す（最大で約1分）
    for (let i = 0; ; i++) {
      await s.開く();
      await s.条件を入れて検索する([], イベント名);
      if ((await row.count()) === 1 || i >= 5) break;
      await this.page.waitForTimeout(10_000);
    }
    if ((await row.count()) !== 1) throw new Error(`イベント申込登録の検索結果に、「${イベント名}」の日程（日程ID ${日程ID}）の新規登録の行が ${await row.count()} 件ある（1件のはず。約1分おいて検索し直しても同じ）`);
    await Promise.all([this.page.waitForURL(new RegExp(`/entry_registration/new/${日程ID}$`), { waitUntil: "load" }), row.getByRole("link", { name: "新規登録" }).click()]);
    await this.読み込みを待つ();
  }

  /** 画面のスクリプトが動き終わるまで待つ（登録ボタンの有効・無効が決まる） */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.フォーム, "イベント新規申込登録画面の入力フォーム").toBeVisible({ timeout: T });
  }

  /** いまの画面が、その日程のイベント新規申込登録画面か（アドレスと、申込IDの欄が無いこと） */
  async 新規申込登録画面である(日程ID: string): Promise<boolean> {
    const path = new URL(this.page.url()).pathname;
    if (!new RegExp(`/entry_registration/new/${日程ID}$`).test(path)) return false;
    return (await this.フォーム.count()) === 1 && (await this.欄のラベル一覧()).every((l) => l !== "申込ID");
  }

  /** イベント申込情報の欄の見出し（ラベル）。プレイヤー情報の表の見出しは含まない */
  async 欄のラベル一覧(): Promise<string[]> {
    return (await this.申込情報.locator("label.col-form-label").allInnerTexts()).map(整える).filter(Boolean);
  }
  /** プレイヤー情報の表の見出し */
  async プレイヤー表の見出し(): Promise<string[]> {
    return (await this.page.locator("#table_detail_other_info thead th").allInnerTexts()).map(整える).filter(Boolean);
  }
  /** 見出しが「ラベル」の欄に表示されている文字（イベント名・店舗・フォーマット・支払会員など。入力欄でないもの） */
  async 欄の表示(ラベル: string): Promise<string> {
    const row = this.申込情報.locator("div.row").filter({ has: this.page.locator("label.col-form-label", { hasText: new RegExp(`^\\s*${ラベル}\\s*$`) }) });
    if ((await row.count()) !== 1) throw new Error(`イベント新規申込登録画面に「${ラベル}」の欄が ${await row.count()} 個ある（1個のはず）`);
    return 整える(await row.locator(".col-form-plain").innerText());
  }
  /** 選択欄で選ばれている選択肢の表示名 */
  async 選ばれている(select: Locator): Promise<string> {
    return 整える((await select.locator("option:checked").allInnerTexts()).join(" "));
  }
  /** 選択欄の選択肢の表示名 */
  async 選択肢(select: Locator): Promise<string[]> {
    return (await select.locator("option").allInnerTexts()).map(整える).filter(Boolean);
  }
  /** 画面の本文（見えている文字） */
  async 本文(): Promise<string> { return 整える(await this.page.locator("body").innerText()); }

  /** 登録ボタンを押し、送信の結果の画面が出るまで待つ。送信されなかったら false */
  async 登録を押す(): Promise<boolean> {
    const sent = this.page.waitForRequest((r) => r.method() === "POST" && r.isNavigationRequest(), { timeout: 10_000 }).then(() => true, () => false);
    await this.登録ボタン.click({ timeout: T });
    if (!(await sent)) return false;
    await this.page.waitForLoadState("load");
    return true;
  }

  /**
   * 開発者ツールで行うのと同じに、参加者として選んだプレイヤーIDを書き換える。
   * 画面に見えないプレイヤーIDの欄（送る欄と、1行目の欄）に値を入れ、プレイヤーを選ぶまで押せない登録ボタンも押せるようにする。
   */
  async プレイヤーIDを書き換える(プレイヤーID: string): Promise<void> {
    await this.送るプレイヤーID.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, プレイヤーID);
    await this.選んだプレイヤーID.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, プレイヤーID);
    await this.登録ボタン.evaluate((e) => { (e as HTMLButtonElement).disabled = false; });
  }

  /** 登録後に遷移したイベント申込詳細・編集画面に表示された申込ID */
  async 登録後の申込ID(): Promise<string> {
    const id = await this.欄の表示("申込ID");
    if (!/^\d+$/.test(id)) throw new Error(`イベント申込詳細・編集画面の「申込ID」が読めない（${id}）`);
    return id;
  }

  // ---- プレイヤー検索ポップアップ ----
  get ポップアップ(): Locator { return this.page.locator("#searchPlayerModal"); }
  get ポップアップのプレイヤー名(): Locator { return this.ポップアップ.locator('[name="admin_event_entry_detail[search]"]'); }
  get ポップアップの検索するボタン(): Locator { return this.ポップアップ.locator("#searchPlayerModalButton"); }
  get ポップアップの閉じるボタン(): Locator { return this.ポップアップ.locator(".modal-header .btn-close"); }
  get 結果の一覧(): Locator { return this.ポップアップ.locator("table.search-player-modal-table"); }
  get 結果の行(): Locator { return this.結果の一覧.locator("tbody tr"); }
  /** 該当データが無いときの案内 */
  get 該当なしの案内(): Locator { return this.ポップアップ.locator("#searchPlayerModalList p.text-center"); }
  get 結果の件数の文(): Locator { return this.ポップアップ.locator("#searchPlayerModalList p.small"); }
  get ページング(): Locator { return this.ポップアップ.locator(".pagination"); }

  /** プレイヤー情報欄の検索ボタンを押してポップアップを開く */
  async ポップアップを開く(): Promise<void> {
    await this.検索ボタン.click({ timeout: T });
    await expect(this.ポップアップ, "プレイヤー検索ポップアップ画面").toBeVisible({ timeout: T });
  }
  async ポップアップを閉じる(): Promise<void> {
    await this.ポップアップの閉じるボタン.click({ timeout: T });
    await expect(this.ポップアップ, "プレイヤー検索ポップアップ画面が閉じる").toBeHidden({ timeout: T });
  }
  /** 結果の一覧か、該当なしの案内が出るまで待つ（検索中は「検索...」とだけ出る） */
  private async 結果を待つ(): Promise<void> {
    await expect(this.結果の一覧.or(this.ポップアップ.locator("#searchPlayerModalList p.text-center:not(:has-text('...'))")).first(), "プレイヤー検索の結果").toBeVisible({ timeout: T });
  }
  /** プレイヤー名に語を入れて「検索する」を押し、結果が出るまで待つ */
  async プレイヤーを検索する(語: string): Promise<void> {
    await this.ポップアップのプレイヤー名.fill(語);
    await this.ポップアップの検索するボタン.click();
    await this.結果を待つ();
  }
  /** 結果の一覧の、ID欄がプレイヤーIDの行 */
  結果の行のID(プレイヤーID: string): Locator {
    return this.結果の行.filter({ has: this.page.locator("td:first-child", { hasText: new RegExp(`^\\s*${プレイヤーID}\\s*$`) }) });
  }
  /** 行の「決定」ボタン（押せる状態のもの） */
  決定ボタン(行: Locator): Locator { return 行.locator(".js-entry-player-select"); }
  /** 行の操作欄のボタン（押せる・押せないを問わない） */
  操作欄のボタン(行: Locator): Locator { return 行.locator("td:last-child button"); }
  /** 結果の一覧の行の [ID, プレイヤー名] */
  async 結果の行の中身(): Promise<{ ID: string; 名前: string }[]> {
    const out: { ID: string; 名前: string }[] = [];
    for (const r of await this.結果の行.all()) {
      out.push({ ID: 整える(await r.locator("td").nth(0).innerText()), 名前: 整える(await r.locator("td").nth(1).innerText()) });
    }
    return out;
  }
  /** いま表示しているページ番号（ページングが無ければ 1） */
  async 表示中のページ(): Promise<number> {
    if ((await this.ページング.count()) === 0) return 1;
    return Number(整える(await this.ページング.locator(".page-item.active").innerText()));
  }
  /** ページングで n ページ目を選び、そのページの結果が出るまで待つ */
  async ページを選ぶ(n: number): Promise<void> {
    await this.ページング.locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).click({ timeout: T });
    await expect(this.ページング.locator(".page-item.active"), `プレイヤー検索の結果の ${n} ページ目`).toHaveText(new RegExp(`^\\s*${n}\\s*$`), { timeout: T });
    await this.結果を待つ();
  }
  /** すべてのページの結果の行を読む（読み終えたら1ページ目へ戻さない） */
  async 全ページの結果(): Promise<{ ID: string; 名前: string }[]> {
    const out = await this.結果の行の中身();
    for (let p = 2; ; p++) {
      if ((await this.ページング.locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${p}\\s*$`) }).count()) === 0) break;
      await this.ページを選ぶ(p);
      out.push(...(await this.結果の行の中身()));
    }
    return out;
  }

  /** ID欄がプレイヤーIDの行が出ているページまで、ページングで進む（無ければ落とす） */
  async IDの行のページへ(プレイヤーID: string): Promise<void> {
    for (let p = (await this.表示中のページ()) + 1; (await this.結果の行のID(プレイヤーID).count()) === 0; p++) {
      if ((await this.ページング.locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${p}\\s*$`) }).count()) === 0) {
        throw new Error(`プレイヤー検索の結果に、ID ${プレイヤーID} の行が無い（${(await this.ポップアップ.locator(".modal-body").innerText()).replace(/\s+/g, " ").slice(0, 200)}）`);
      }
      await this.ページを選ぶ(p);
    }
  }

  /** 決定ボタンを押し、ポップアップが閉じるまで待つ */
  async 決定する(プレイヤーID: string): Promise<void> {
    const b = this.決定ボタン(this.結果の行のID(プレイヤーID));
    await expect(b, `ID ${プレイヤーID} の行の決定ボタン`).toHaveCount(1, { timeout: T });
    await b.click();
    await expect(this.ポップアップ, "決定でプレイヤー検索ポップアップ画面が閉じる").toBeHidden({ timeout: T });
  }

  /** 決定のあと登録を押し、遷移したイベント申込詳細・編集画面の申込IDを返す（シードが申込を作るときに使う） */
  async 登録して申込IDを読む(what: string): Promise<string> {
    await expect(this.登録ボタン, "プレイヤーを選ぶと登録を押せる").toBeEnabled({ timeout: T });
    await this.登録ボタン.click();
    await expectSaved(this.page, what);
    return this.登録後の申込ID();
  }
}

/**
 * 会員登録/編集画面で会員種別が「本会員」であることを確かめ、そうでなければ「本会員」にして登録する。
 * もう本会員なら登録は押さない（変える値が無い）。押したかどうかを返す。
 */
export async function 会員を本会員にする(page: Page, 会員ID: string): Promise<boolean> {
  await page.goto(adminUrl(`/customer/${会員ID}/edit`));
  await page.waitForLoadState("load");
  const sel = page.locator('[name="admin_customer[status]"]');
  await expect(sel, `会員ID ${会員ID} の会員登録/編集画面の会員種別`).toBeVisible({ timeout: T });
  const now = 整える((await sel.locator("option:checked").allInnerTexts()).join(""));
  if (now === "本会員") return false;
  await sel.selectOption({ label: "本会員" });
  await page.locator("#register_btn").click();
  await expectSaved(page, `会員ID ${会員ID} の会員種別を本会員にする`);
  return true;
}

/** 金額の表示（「2,500」など）を数字だけにする */
export const 金額 = (s: string): string => s.replace(/[,，円¥\s]/g, "");
