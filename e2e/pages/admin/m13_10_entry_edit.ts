/**
 * M13-10 イベント申込詳細・編集（イベント申込一覧の申込IDから開く画面）の操作。セレクタ・アドレスはここだけに書く。
 * 画面の作りはイベント新規申込登録画面と同じ（同じ画面の作り）なので、M13-12 の部品（EntryNewPage）を引き継いで、編集の画面にだけある操作を足す。
 * 正本: cases/M13-10_test_cases.tsv
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { EntryNewPage } from "./m13_12_entry_new";

const T = 30_000;
const 整える = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

export class EntryEditPage extends EntryNewPage {
  constructor(page: Page) { super(page); }

  /** 画面下部の「イベント申込一覧」リンク */
  get イベント申込一覧リンク(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink").filter({ hasText: "イベント申込一覧" }); }
  /** 画面下部の「同日程の新規申込へ」 */
  get 同日程の新規申込へ(): Locator { return this.page.locator(".c-conversionArea").getByRole("link", { name: "同日程の新規申込へ", exact: true }); }
  /** プレイヤー情報の表の行 */
  get プレイヤーの行(): Locator { return this.page.locator("#table_detail_other_info tbody tr"); }
  /** 送るイベント申込ID（画面に見えない欄） */
  get 送るイベント申込ID(): Locator { return this.page.locator('[name="admin_event_entry_detail[eventEntryId]"]'); }
  get 成功のメッセージ(): Locator { return this.page.locator(".alert-success"); }
  get 失敗のメッセージ(): Locator { return this.page.locator(".alert-danger"); }

  // ---- 参加プレイヤーの行（n 行目。画面の作りは 1 行だけのことがある） ----
  async 行の数(): Promise<number> { return this.プレイヤーの行.count(); }
  行の検索ボタン(n: number): Locator { return this.page.locator(`#search_button--${n}`).filter({ visible: true }); }
  行の削除ボタン(n: number): Locator { return this.page.locator(`#clear_button--${n}`).filter({ visible: true }); }
  行の選ばれたプレイヤーID(n: number): Locator { return this.page.locator(`#player_id--${n}`); }
  行のプレイヤー名(n: number): Locator { return this.page.locator(`#detail_player__name_jp--${n}`); }
  /** n 行目の検索ボタンがあれば押してプレイヤー検索モーダルを開く。無ければ false（押さない） */
  async 行の検索を押す(n: number): Promise<boolean> {
    if ((await this.行の検索ボタン(n).count()) === 0) return false;
    await this.行の検索ボタン(n).click({ timeout: T });
    await expect(this.ポップアップ, "プレイヤー検索ポップアップ画面").toBeVisible({ timeout: T });
    return true;
  }
  /** 検索結果の、ID 欄がプレイヤーIDの行に押せる決定ボタンがあるか */
  async 決定できる(プレイヤーID: string): Promise<boolean> {
    return (await this.決定ボタン(this.結果の行のID(プレイヤーID)).count()) > 0;
  }

  /** 画面の中の、表示名が名前のボタン（押せる・押せないを問わない。表示されているものだけ） */
  表示されたボタン(名前: string): Locator {
    return this.フォーム.getByRole("button", { name: 名前, exact: true }).filter({ visible: true });
  }
  表示されたリンク(名前: string): Locator {
    return this.page.locator(".c-conversionArea").getByRole("link", { name: 名前, exact: true }).filter({ visible: true });
  }

  /** 申込IDを指定してイベント申込詳細・編集画面を開く（アドレスを直接開く）。応答を返す */
  async 申込を開く(申込ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/event/entry/${申込ID}/edit`));
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 画面のスクリプトが動き終わるまで待つ（登録ボタンの有効・無効が決まる） */
  async 編集画面の読み込みを待つ(): Promise<void> {
    await this.読み込みを待つ();
    await expect(this.申込情報, "イベント申込情報の欄").toBeVisible({ timeout: T });
  }

  /** いまの画面が、その申込のイベント申込詳細・編集画面か（アドレスと、画面の申込ID） */
  async 編集画面である(申込ID: string): Promise<boolean> {
    if (!new RegExp(`/event/entry/${申込ID}/edit$`).test(new URL(this.page.url()).pathname)) return false;
    if ((await this.フォーム.count()) !== 1) return false;
    return (await this.欄の表示("申込ID").catch(() => "")) === 申込ID;
  }

  /** 1行目のプレイヤー名（会員の氏名）の表示 */
  async プレイヤー名の表示(): Promise<string> { return 整える(await this.プレイヤー名.innerText()); }

  async 申込状況を選ぶ(状況: string): Promise<void> { await chooseByLabel(this.申込状況, 状況); }

  /** 開発者ツールで行うのと同じに、フォームの送信先とイベント申込IDを、別の申込IDのものに書き換える */
  async 送信先を書き換える(申込ID: string): Promise<void> {
    const action = adminUrl(`/event/entry/${申込ID}/edit`);
    await this.フォーム.evaluate((f, a) => { (f as HTMLFormElement).action = a; }, action);
    await this.送るイベント申込ID.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 申込ID);
  }
  /** 開発者ツールで行うのと同じに、フォームの送信先だけを別の申込IDのものに書き換える */
  async 送信先のアドレスを書き換える(申込ID: string): Promise<void> {
    const action = adminUrl(`/event/entry/${申込ID}/edit`);
    await this.フォーム.evaluate((f, a) => { (f as HTMLFormElement).action = a; }, action);
  }
  async 送信先(): Promise<string> { return this.フォーム.evaluate((f) => (f as HTMLFormElement).action); }

  /** 開発者ツールで行うのと同じに、申込状況の選ばれている選択肢の値を書き換える */
  async 申込状況の値を書き換える(値: string): Promise<void> {
    await this.申込状況.evaluate((s, v) => { const o = (s as HTMLSelectElement).selectedOptions[0]; if (o) o.value = v; }, 値);
  }
  async 申込状況の値(): Promise<string> { return this.申込状況.inputValue(); }

  /** 登録ボタンを押し、送信の応答を待つ。送信されなかったら null、送信されたら応答の状態の番号 */
  async 登録を押して応答を待つ(): Promise<number | null> {
    const resp = this.page.waitForResponse((r) => r.request().method() === "POST" && r.request().isNavigationRequest(), { timeout: 60_000 }).then((r) => r, () => null);
    await this.登録ボタン.click({ timeout: T });
    const r = await resp;
    if (!r) return null;
    await this.page.waitForLoadState("load");
    return r.status();
  }

  /** 画面上部のメッセージ（成功・失敗）の文 */
  async メッセージ(): Promise<string[]> {
    return (await this.page.locator(".alert-success, .alert-danger").allInnerTexts()).map(整える).filter(Boolean);
  }
}

/** 会員一覧を氏名（「姓 名」）で検索し、氏名が一致する会員の会員IDを返す（1人でなければ落とす） */
export async function 会員IDを氏名から(page: Page, 氏名: string): Promise<string> {
  await page.goto(adminUrl("/customer"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(氏名);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click()]);
  await page.waitForLoadState("load");
  const ids: string[] = [];
  for (const r of await page.locator('tr[id^="ex-customer-"]').all()) {
    const names = (await r.locator("td a").allInnerTexts()).map(整える);
    if (names.includes(整える(氏名))) ids.push(/ex-customer-(\d+)/.exec((await r.getAttribute("id")) ?? "")?.[1] ?? "");
  }
  if (ids.length !== 1) throw new Error(`会員一覧で氏名「${氏名}」の会員が ${ids.length} 人いる（1人のはず）`);
  return ids[0];
}

/**
 * イベント申込登録（検索結果）の日程の行の「新規登録」からイベント新規申込登録画面を開き、プレイヤー検索で会員の氏名を検索して、
 * 氏名が一致する行（1行のはず）のID欄のプレイヤーIDを読む。申込するなら、その行の決定を押して登録し、申込IDも返す。
 * 申込しないなら、決定を押さずに閉じるボタンで閉じ、登録を押さずに画面を離れる。
 */
export async function プレイヤーIDを読んで申込する(page: Page, イベント名: string, 日程ID: string, 氏名: string, 申込する: boolean): Promise<{ プレイヤーID: string; 申込ID?: string }> {
  const f = new EntryNewPage(page);
  await f.検索結果から開く(イベント名, 日程ID);
  await f.ポップアップを開く();
  await f.プレイヤーを検索する(氏名);
  const rows = (await f.全ページの結果()).filter((r) => r.名前 === 氏名 || r.名前.startsWith(`${氏名} `));
  if (rows.length !== 1) throw new Error(`プレイヤー検索「${氏名}」の結果に、氏名「${氏名}」の行が ${rows.length} 行ある（1行のはず）`);
  const プレイヤーID = rows[0].ID;
  if (!申込する) {
    await f.ポップアップを閉じる();
    await page.goto(adminUrl(""));
    return { プレイヤーID };
  }
  // 全ページを読んだあとは最後のページにいる。検索し直して1ページ目から、その行のページへ進む
  await f.プレイヤーを検索する(氏名);
  await f.IDの行のページへ(プレイヤーID);
  await f.決定する(プレイヤーID);
  return { プレイヤーID, 申込ID: await f.登録して申込IDを読む(`イベント申込（${イベント名}・${氏名}）の登録`) };
}

/** イベント申込詳細・編集画面で、何も変えずに登録ボタンを押す（保存の成功を確かめる） */
export async function 何も変えずに登録する(page: Page, 申込ID: string): Promise<void> {
  const e = new EntryEditPage(page);
  await e.申込を開く(申込ID);
  await e.編集画面の読み込みを待つ();
  await expect(e.登録ボタン, "イベント申込詳細・編集画面の登録ボタン").toBeEnabled({ timeout: T });
  await e.登録ボタン.click();
  await expectSaved(page, `申込ID ${申込ID} を何も変えずに登録`);
}

/** イベント申込一覧の検索結果で、申込IDの行のリンクからイベント申込詳細・編集画面を開く */
export async function 申込一覧の行から開く(page: Page, 申込ID: string): Promise<void> {
  const link = page.locator(`table:has(#check_all) a[href$="/event/entry/${申込ID}/edit"]`).first();
  if ((await link.count()) === 0) throw new Error(`イベント申込一覧の検索結果に、申込ID ${申込ID} の行が無い`);
  await Promise.all([page.waitForURL(new RegExp(`/event/entry/${申込ID}/edit$`), { waitUntil: "load" }), link.click()]);
}
