/**
 * F01-02 支店ECTOP のうち、共有の設定（レイアウト管理のブロックの並び）を書き換えて戻すケースが使う、管理画面の操作。セレクタはここだけに書く。
 *
 * アプリの作り（実ソースで確かめた）:
 * - 支店ECTOP（全支店で同じページ「支店トップページ」）は、ページに割り当てたレイアウトのメイン上部・メイン下部のブロックを上から並べて描く。
 *   レイアウトは全支店で共通の1件なので、ブロックの並びを変えると、どの支店の支店ECTOPも変わる（共有の設定）。
 * - レイアウト管理(編集)の画面は、ブロックごとの「…」のメニュー（上へ・下へ・移動）で並びを変え、「登録」で全部の並びを送る。
 *   送られた並びで、そのレイアウトのブロックの配置を全部入れ替える。並びの番号は、画面を開いたときに置き場ごとに 0 から振り直される。
 * - ブロック管理で登録したブロックは、テンプレートのファイルをファイル置き場へ送り、ほかのサーバへは少し遅れて届く
 *   （届く前にレイアウトへ置くと、その画面が描けなくなる）。そのため、登録してから置くまでに間を置き、置いたあとは支店ECTOPに出るまで待つ。
 *
 * 戻し方（lib/shared_restore.ts に登録する）:
 * - 書き換える直前に、レイアウト管理(編集)の画面から全部の置き場の並び（ブロックIDと名前、上からの順）を読んで控える。
 * - 戻すときは、同じ画面の「…」のメニューで控えた並びにそろえて「登録」し、開き直して、全部の置き場の並びが控えと全部同じかを確かめる。
 */
import { Browser, Locator, Page, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { FIXED_MARK, rcFixed } from "../../lib/run_marker";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../../lib/session";
import { expectSaved } from "./common";
import { 支店の管理者を用意する, 管理者 } from "./f01_02_setup";
import { ブロック管理 } from "./m09_07_block";
import { searchStockByCode } from "./m04_02_rc_stock";
import { storeNameById } from "./m04_19_masters";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "./stock_edit";
import { findTenantId } from "./tenant_k";
import { 店舗の実際を読む, 読み替えの文 } from "../../lib/store_pick";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// 決まった印の試験支店（店舗は1度だけ作って使い回す。依頼者決定 2026-11-11）
// ---------------------------------------------------------------------------

/**
 * F01-02 の共有の設定を書き換えるケースと F03-07-004 が使う試験支店。店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止」）。
 * 使い回す店舗の表から、公開・開店・支店の E2E の店舗（店舗ID 5006）を使う。店名・支店URLは、その店舗のいまの値を読む。
 */
export const F0102試験支店ID = "5006";
export const F0102試験支店 = {
  get 店名(): string { return 店舗の実際を読む(F0102試験支店ID).店名; },
  get 支店URL(): string { return 店舗の実際を読む(F0102試験支店ID).支店URL; },
};

/** 試験支店（店舗ID 5006）を使う。作らない。店舗一覧に出ることを確かめ、店舗IDを返す */
export async function F0102試験支店を用意する(page: Page, issue: Issue): Promise<string> {
  const { 店名, 支店URL } = F0102試験支店;
  const id = await findTenantId(page, 店名);
  if (id !== F0102試験支店ID) throw new Error(`試験支店（店舗ID ${F0102試験支店ID}）が店舗一覧に無い（店名「${店名}」で探して ${id ?? "なし"}）`);
  issue(読み替えの文("F0102試験支店-E2E", { id, 店名 }, `公開・開店の支店。支店URL ${支店URL}`));
  return id;
}

/** 試験支店の在庫を申請する管理者と承認する管理者（決まった印で1度だけ作り、使い回す） */
export async function 試験支店の管理者(page: Page): Promise<{ 登録者: 管理者; 承認者: 管理者 }> {
  const 本店名 = await storeNameById(page, "1");
  return 支店の管理者を用意する(page, `sh${F0102試験支店ID}`, FIXED_MARK, F0102試験支店.店名, 本店名);
}

/**
 * 在庫一覧で、商品規格の試験支店・在庫場所EC-CUBEの行の在庫編集を開き、入庫の区分・在庫増減数・承認通知先を入れて登録し、
 * 承認する管理者で在庫編集承認一覧から「一括承認」→「承認する」を押す。
 */
export async function 試験支店に在庫を入れる(browser: Browser, seedId: string, items: { 商品コード: string; 数: number }[], issue: Issue): Promise<void> {
  if (items.length === 0) return;
  const 店名 = F0102試験支店.店名;
  const 管 = await withAdminSession(browser, SETUP_ADMIN, (page) => 試験支店の管理者(page));
  let registrant = "";
  await withAdminSession(browser, 管.登録者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const it of items) {
      const stock = await searchStockByCode(page, { 商品コード: it.商品コード, 店舗: 店名, 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(it.商品コード, 店名, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "F01-02試験データ", quantity: String(it.数), purchasePrice: "1", approverName: 管.承認者.名前 }, `${seedId}: ${it.商品コード} の在庫編集`, issue);
    }
    registrant = await loggedInMemberName(page);
  });
  await withAdminSession(browser, 管.承認者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(店名);
    // 申請した管理者は試験支店だけの E2E の管理者なので、その管理者の未承認の行（前の実行の残りを含む。どれも E2E の商品）を承認する
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant);
    if (rows.length < items.length) throw new Error(`${seedId}: 在庫編集承認一覧に、登録者「${registrant}」の未承認の行が ${rows.length} 件（${items.length} 件はあるはず）`);
    try {
      await list.approve(rows.map((r) => r.id), `${seedId}: 在庫編集の一括承認`, issue);
    } catch (e) {
      await list.open(店名);
      const after = (await list.rowValues()).filter((r) => rows.some((x) => x.id === r.id));
      if (after.some((r) => r.status === "未承認")) throw e;
      issue(`在庫編集の承認で、成功の表示は出なかったが、承認の一覧から未承認の行が無くなっていた（${(e as Error).message.split("\n")[0]}）`);
    }
    if (rows.length > items.length) issue(`在庫編集承認一覧に、同じ登録者の前の実行の未承認の行が ${rows.length - items.length} 件あり、合わせて承認した（どれも E2E の商品）`);
  });
}

// ---------------------------------------------------------------------------
// レイアウト管理（ブロックの並び）
// ---------------------------------------------------------------------------

export type ブロック位置 = { id: string; 名前: string };
/** 置き場（画面の置き場の番号）→ 上からのブロックの並び。未使用ブロック（0）は含めない */
export type レイアウトの並び = Record<string, ブロック位置[]>;

/** 並びを、比べられる文にする（置き場の番号順） */
export function 並びの文(v: レイアウトの並び): string {
  return JSON.stringify(Object.keys(v).filter((k) => k !== "0" && v[k].length > 0).sort((a, b) => Number(a) - Number(b)).map((k) => [k, v[k].map((b) => `${b.id}:${b.名前}`)]));
}

/** ページ管理で、ページ名がちょうど ページ名 のページを開き、PCのレイアウトのIDと名前を読む（読むだけ） */
export async function ページのレイアウト(page: Page, ページ名: string): Promise<{ id: string; 名前: string }> {
  await page.goto(adminUrl("/content/page"));
  await page.waitForLoadState("load");
  const link = page.getByRole("link", { name: ページ名, exact: true });
  await expect(link, `ページ管理の「${ページ名}」のページ`).toHaveCount(1, { timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), link.click({ noWaitAfter: true })]);
  const pc = page.locator('select[name="main_edit[PcLayout]"]');
  await expect(pc, `ページ「${ページ名}」のPCのレイアウトの欄`).toHaveCount(1, { timeout: 30_000 });
  const id = await pc.inputValue();
  if (!id) throw new Error(`ページ「${ページ名}」にPCのレイアウトが割り当てられていない`);
  return { id, 名前: ((await pc.locator("option:checked").textContent()) ?? "").trim() };
}

async function 編集を開く(page: Page, layoutId: string): Promise<void> {
  await page.goto(adminUrl(`/content/layout/${layoutId}/edit`), { waitUntil: "load", timeout: 120_000 });
  await expect(page.locator("#position_0"), "レイアウト管理(編集)の未使用ブロック").toBeAttached({ timeout: 60_000 });
  // 並びを動かす部品（画面のスクリプト）が読み込まれてから操作する
  await page.waitForFunction(() => typeof (window as unknown as { updateUpDown?: unknown }).updateUpDown === "function", undefined, { timeout: 60_000 });
}

/** いま開いているレイアウト管理(編集)の画面の並び（未使用ブロック 0 を含む） */
async function 画面の並び(page: Page): Promise<Record<string, ブロック位置[]>> {
  return page.locator('[id^="position_"]').evaluateAll((ns) => Object.fromEntries(ns.map((n) => [
    n.id.replace("position_", ""),
    Array.from(n.children).filter((c) => /^detail_box__layout_item--\d+$/.test(c.id)).map((c) => ({
      id: c.id.replace("detail_box__layout_item--", ""),
      名前: (c.querySelector(".view_readme")?.textContent ?? "").trim(),
    })),
  ])));
}

/** レイアウト管理(編集)を開いて、全部の置き場の並びを読む（未使用ブロックは除く）。読むだけ */
export async function レイアウトの並びを読む(page: Page, layoutId: string): Promise<レイアウトの並び> {
  await 編集を開く(page, layoutId);
  const all = await 画面の並び(page);
  delete all["0"];
  return all;
}

/** ブロックの「…」のメニューを開く */
async function メニューを開く(page: Page, blockId: string): Promise<Locator> {
  const item = page.locator(`#detail_box__layout_item--${blockId}`);
  await expect(item, `レイアウト管理(編集)のブロックID ${blockId}`).toHaveCount(1);
  const menu = item.locator(".block-context-menu").first();
  await menu.scrollIntoViewIfNeeded();
  const pop = page.locator(".popover:visible").last();
  // メニューは押すたびに開く・閉じるが切り替わる。開かなければ押し直す
  for (let i = 0; i < 3; i++) {
    await menu.click();
    if (await pop.locator(".context-movesection").isVisible().catch(() => false)) break;
    await pop.locator(".context-movesection").waitFor({ state: "visible", timeout: 3_000 }).catch(() => undefined);
    if (await pop.locator(".context-movesection").isVisible().catch(() => false)) break;
  }
  await expect(pop.locator(".context-movesection"), `ブロックID ${blockId} の「…」のメニュー`).toBeVisible({ timeout: 10_000 });
  return pop;
}

/** 「…」→「移動」で、ブロックを置き場（番号）の末尾へ移す */
async function ブロックを移す(page: Page, blockId: string, 置き場: string): Promise<void> {
  const modal = page.locator("#clickStreamConfirm");
  // 「…」のメニューは出てすぐ押すと、画面の側の「移動」の押下の処理がまだ付いておらず、移動先の選択が開かないことがある。開かなければメニューから押し直す
  for (let i = 0; i < 4; i++) {
    const pop = await メニューを開く(page, blockId);
    await pop.locator(".context-movesection").click();
    if (await modal.waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false)) break;
  }
  await expect(modal, "移動先の選択").toBeVisible({ timeout: 20_000 });
  await modal.locator("#move-section").selectOption(置き場);
  await modal.locator("#move-to-section").click();
  await expect(modal, "移動先の選択が閉じた").toBeHidden({ timeout: 20_000 });
  await expect(page.locator(`#position_${置き場} > #detail_box__layout_item--${blockId}`), `ブロックID ${blockId} が置き場 ${置き場} へ移った`).toHaveCount(1);
}

/** 「…」→「上へ」で、ブロックを1つ上へ */
async function ブロックを上へ(page: Page, 置き場: string, blockId: string): Promise<void> {
  const index = async () => (await 画面の並び(page))[置き場].findIndex((b) => b.id === blockId);
  const before = await index();
  const pop = await メニューを開く(page, blockId);
  await pop.locator(".context-moveup").click();
  await expect.poll(index, { message: `ブロックID ${blockId} を1つ上へ`, timeout: 20_000 }).toBe(before - 1);
}

/**
 * レイアウト管理(編集)の画面の「…」のメニュー（移動・上へ）で、全部の置き場の並びを 目標 にそろえ、「登録」する。
 * 目標に無いブロックは未使用ブロックへ移す。登録のあと開き直して、並びが目標と全部同じかを確かめる（違えば投げる）。
 */
export async function レイアウトを並びにそろえる(page: Page, layoutId: string, 目標: レイアウトの並び, what: string, issue: Issue): Promise<void> {
  await 編集を開く(page, layoutId);
  const 行き先 = new Map<string, string>();
  for (const [s, items] of Object.entries(目標)) for (const b of items) 行き先.set(b.id, s);
  // 1. 置き場が違うブロックを、行き先（目標に無ければ未使用ブロック）へ
  for (const [s, items] of Object.entries(await 画面の並び(page))) {
    if (s === "0") continue;
    for (const b of items) {
      const to = 行き先.get(b.id) ?? "0";
      if (to !== s) await ブロックを移す(page, b.id, to);
    }
  }
  // 2. 目標の置き場に無いブロック（未使用ブロックにあるもの）を、その置き場へ
  for (const [s, items] of Object.entries(目標)) {
    for (const b of items) {
      const now = await 画面の並び(page);
      if (!(now[s] ?? []).some((x) => x.id === b.id)) await ブロックを移す(page, b.id, s);
    }
  }
  // 3. 置き場の中の順を、上から目標に合わせる
  for (const [s, items] of Object.entries(目標)) {
    for (let i = 0; i < items.length; i++) {
      let idx = (await 画面の並び(page))[s].findIndex((x) => x.id === items[i].id);
      while (idx > i) { await ブロックを上へ(page, s, items[i].id); idx--; }
    }
  }
  const 送る前 = await 画面の並び(page);
  delete 送る前["0"];
  if (並びの文(送る前) !== 並びの文(目標)) throw new Error(`${what}: 画面の並びが目標にそろわない（いま ${並びの文(送る前)}／目標 ${並びの文(目標)}）`);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator("#ex-conversion-action button[type=submit]").click({ noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: レイアウト管理の登録`)) issue(w);
  const 後 = await レイアウトの並びを読む(page, layoutId);
  if (並びの文(後) !== 並びの文(目標)) throw new Error(`${what}: 登録したあとの並びが目標と違う（いま ${並びの文(後)}／目標 ${並びの文(目標)}）`);
}

/** 並び 元 の、名前が 基準 のブロックの「代わりに」（基準は未使用へ）か「後ろに」、ブロック 置く を差し込んだ並び */
export function 差し込んだ並び(元: レイアウトの並び, 置く: ブロック位置, 基準: string, how: "代わりに" | "後ろに"): レイアウトの並び {
  const hit = Object.entries(元).filter(([, items]) => items.some((b) => b.名前 === 基準));
  const 件数 = hit.reduce((n, [, items]) => n + items.filter((b) => b.名前 === 基準).length, 0);
  if (件数 !== 1) throw new Error(`レイアウトに名前が「${基準}」のブロックが ${件数} 件ある（1件のはず）。置かれているブロック: ${並びの文(元)}`);
  const out: レイアウトの並び = JSON.parse(JSON.stringify(元));
  const [s] = hit[0];
  const i = out[s].findIndex((b) => b.名前 === 基準);
  if (how === "代わりに") out[s].splice(i, 1, 置く);
  else out[s].splice(i + 1, 0, 置く);
  return out;
}

/**
 * 共有のレイアウトの並びを控え、戻すことを lib/shared_restore.ts に登録してから、目標 の並びにする。
 * 戻すときは、控えた並びにそろえて登録し、開き直して全部の置き場の並びが控えと全部同じかを確かめる。
 */
export async function 共有のレイアウトを書き換える(
  browser: Browser, レイアウト: { id: string; 名前: string }, 作る: (元: レイアウトの並び) => レイアウトの並び, what: string, issue: Issue,
  registerRestore: (label: string, before: unknown, restore: () => Promise<void>, verify?: () => Promise<boolean>) => void,
): Promise<{ 元: レイアウトの並び; 後: レイアウトの並び }> {
  const 元 = await withAdminSession(browser, SETUP_ADMIN, (page) => レイアウトの並びを読む(page, レイアウト.id));
  const 目標 = 作る(元);
  registerRestore(
    `共有のレイアウト「${レイアウト.名前}」（ID ${レイアウト.id}）のブロックの並び`,
    { 並び: 並びの文(元) },
    async () => { await withAdminSession(browser, SETUP_ADMIN, (page) => レイアウトを並びにそろえる(page, レイアウト.id, 元, `${what}: 元に戻す`, issue)); },
    async () => withAdminSession(browser, SETUP_ADMIN, async (page) => 並びの文(await レイアウトの並びを読む(page, レイアウト.id)) === 並びの文(元)),
  );
  issue(`共有のレイアウト「${レイアウト.名前}」（ID ${レイアウト.id}）のブロックの並びを全部控えた（${並びの文(元)}）。ケースの終わりに画面で戻し、開き直して全部の並びが控えと同じかを確かめる`);
  await withAdminSession(browser, SETUP_ADMIN, (page) => レイアウトを並びにそろえる(page, レイアウト.id, 目標, what, issue));
  return { 元, 後: 目標 };
}

// ---------------------------------------------------------------------------
// ブロック管理（E2E が作るブロック。ケースの終わりに消す）
// ---------------------------------------------------------------------------

/** ブロック管理で新規登録し、登録後のブロック編集画面のアドレスのブロックIDを返す */
export async function ブロックを作る(page: Page, v: { ブロック名: string; ファイル名: string; コード: string }): Promise<string> {
  return new ブロック管理(page).作る({ ...v, 言語: "ja" });
}

/** ブロック編集画面を開き、保存されたコードが入力どおりかを確かめる（違えば投げる） */
export async function ブロックのコードを確かめる(page: Page, id: string, コード: string, what: string): Promise<void> {
  const block = new ブロック管理(page);
  await block.編集を開く(id, "ja");
  const saved = await block.コードを読む();
  if (saved.trim() !== コード.trim()) throw new Error(`${what}: 登録したブロック（ID ${id}）のコードが入力と違う`);
}

/** ブロック管理(一覧)で、ブロックIDの行の削除を押して確定する */
export async function ブロックを消す(page: Page, id: string): Promise<void> {
  const block = new ブロック管理(page);
  await block.一覧を開く();
  if ((await block.行(id).count()) === 0) return;
  await block.削除確認を開く(id);
  await block.モーダルで削除する(id);
}

/** ブロック管理(一覧)に、ブロックIDの行があるか */
export async function ブロックがあるか(page: Page, id: string): Promise<boolean> {
  const block = new ブロック管理(page);
  await block.一覧を開く();
  return (await block.行(id).count()) > 0;
}

/**
 * 登録したブロックのテンプレートがほかのサーバへ届くのを待つ（ファイル置き場の同期。アプリの案内は「1分ほど待ってから」）。
 * 登録した時刻（作った時刻）から90秒たつまで待つ。
 */
export async function ブロックが届くのを待つ(作った時刻: number): Promise<void> {
  const rest = 作った時刻 + 90_000 - Date.now();
  if (rest > 0) await new Promise((r) => setTimeout(r, rest));
}

// ---------------------------------------------------------------------------
// ファイル管理（E2E が上げる画像。ケースの終わりに消す）
// ---------------------------------------------------------------------------

const ファイルの行 = (page: Page, 名前: string): Locator =>
  page.locator("#fileList table tr[id]").filter({ has: page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${名前.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });

async function ファイル管理を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/content/file_manager"), { waitUntil: "load", timeout: 120_000 });
  await expect(page.locator("form#form1 input[type=file]"), "ファイル管理のファイルの欄").toHaveCount(1, { timeout: 30_000 });
}

/** ファイル管理の最上位（user_data）にファイルがあるか */
export async function ファイルがあるか(page: Page, 名前: string): Promise<boolean> {
  await ファイル管理を開く(page);
  return (await ファイルの行(page, 名前).count()) > 0;
}

/**
 * ファイル管理の最上位にファイルを上げ、一覧の行の「パスのコピー」の欄の値（公開側のパス）を返す。
 * 同じ名前のファイルがあれば上書きになるので、上げずに止める。
 */
export async function ファイルを上げる(page: Page, file: { name: string; mimeType: string; buffer: Buffer }, what: string, issue: Issue): Promise<string> {
  await ファイル管理を開く(page);
  if ((await ファイルの行(page, file.name).count()) > 0) throw new Error(`${what}: ファイル管理に同じ名前のファイル「${file.name}」が既にある（上書きしないよう止めた）`);
  await page.locator("form#form1 input[type=file]").setInputFiles(file);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.locator("a.js-upload-trigger").click({ noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: ファイル管理のアップロード`)) issue(w);
  const row = ファイルの行(page, file.name);
  await expect(row, `${what}: ファイル管理の一覧の「${file.name}」`).toHaveCount(1);
  const path = (await row.locator(".copy-file-path input").getAttribute("value")) ?? "";
  if (!path.endsWith(file.name)) throw new Error(`${what}: 「${file.name}」の公開側のパスを読めない（${path}）`);
  return path;
}

/** ファイル管理の最上位のファイルを、行の削除→確認の「削除」で消す（無ければ何もしない） */
export async function ファイルを消す(page: Page, 名前: string): Promise<void> {
  await ファイル管理を開く(page);
  const row = ファイルの行(page, 名前);
  if ((await row.count()) === 0) return;
  const rowId = await row.getAttribute("id");
  await row.locator("a.action-delete").click();
  const modal = page.locator(`#confirmModal-${rowId}`);
  await expect(modal, `「${名前}」の削除の確認`).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), modal.locator('a.btn-ec-delete[data-method="delete"]').click({ noWaitAfter: true })]);
}

// ---------------------------------------------------------------------------
// 商品・カードセット
// ---------------------------------------------------------------------------

/** 商品登録編集で、商品カテゴリのチェックを指定のカテゴリだけにし（割引率が未選択なら先頭）、「商品を登録」する */
export async function 商品のカテゴリを選ぶ(page: Page, 商品ID: string, カテゴリID: string[], what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集`).toBeVisible();
  const boxes = form.locator('input[name="admin_product[Category][]"]');
  for (const v of await boxes.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value))) {
    if (!カテゴリID.includes(v)) await form.locator(`input[name="admin_product[Category][]"][value="${v}"]`).setChecked(false, { force: true });
  }
  for (const id of カテゴリID) {
    const box = form.locator(`input[name="admin_product[Category][]"][value="${id}"]`);
    await expect(box, `${what}: 商品カテゴリの選択肢にカテゴリID ${id} がある`).toHaveCount(1);
    await box.setChecked(true, { force: true });
  }
  const checked = await boxes.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value));
  expect([...checked].sort(), `${what}: 商品カテゴリのチェック`).toEqual([...カテゴリID].sort());
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x !== ""));
    if (first) { await discount.selectOption(first); issue(`${what}: 割引率が未選択だったので、登録済みの割引率の先頭を選んだ`); }
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) issue(w);
}

/** カードセット管理の新規登録で、名称（日英）・略称・発売日（今日）を入れ、特殊セットフラグ（通常盤以外）にチェックして登録する。カードセットIDを返す */
export async function 通常盤以外のカードセットを登録する(page: Page, v: { 名称: string; 略称: string }, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(v.名称);
  await page.locator("#admin_cardset_nameEn").fill(v.名称);
  await page.locator("#admin_cardset_code").fill(v.略称);
  const d = new Date();
  const single = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await single.count()) {
    await single.fill(d.toISOString().slice(0, 10));
  } else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(String(d.getFullYear()));
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(d.getMonth() + 1));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(d.getDate()));
  }
  await page.locator("#admin_cardset_specialFlg").check();
  await page.getByRole("button", { name: "登録", exact: true }).click();
  for (const w of await expectSaved(page, `${what}: カードセット「${v.名称}」の登録`)) issue(w);
  const m = /\/cardset\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: カードセット「${v.名称}」の登録後のアドレスからカードセットIDを読めない（${page.url()}）`);
  await expect(page.locator("#admin_cardset_specialFlg"), `${what}: 登録したカードセットの特殊セットフラグ`).toBeChecked();
  return m[1];
}

// ---------------------------------------------------------------------------
// 公開側への反映を待つ
// ---------------------------------------------------------------------------

/** 新しいブラウザで公開側のアドレスを開き、cond が真になるまで間を置いて確かめる（上限を超えたら最後の様子つきで投げる） */
export async function 公開側に出るまで待つ(browser: Browser, url: string, cond: (page: Page) => Promise<{ ok: boolean; 様子: string }>, what: string, 上限ミリ秒 = 6 * 60_000): Promise<void> {
  const t0 = Date.now();
  let last = "";
  for (;;) {
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const page = await ctx.newPage();
      const res = await page.goto(url, { waitUntil: "load", timeout: 120_000 }).catch(() => null);
      const r = res && res.status() < 400 ? await cond(page) : { ok: false, 様子: `応答 ${res?.status() ?? "なし"}` };
      if (r.ok) return;
      last = r.様子;
    } finally {
      await ctx.close();
    }
    if (Date.now() - t0 > 上限ミリ秒) throw new Error(`${what}が ${Math.round(上限ミリ秒 / 60000)} 分たっても確かめられない（最後の様子: ${last}）`);
    await new Promise((r) => setTimeout(r, 20_000));
  }
}
