/**
 * M04-21 在庫変更CSV登録の画面操作（メニュー「在庫管理」の在庫変更CSV登録）。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリの在庫変更CSV登録のテンプレートで確かめたこと）:
 * - 「雛形ファイルダウンロード」で、見出し行だけの雛形（アプリの設定のCSVの文字コード）をダウンロードする。
 * - 店舗を選ぶと、承認通知先（メンバー選択）の選択肢が、その店舗を承認できるメンバーに入れ替わる（画面のスクリプトが問い合わせる）。
 *   承認通知先（所属選択）は選択肢を絞るだけの欄ではなく、それ自体が送る値（必須）。
 * - 「ファイルを選択」を押してファイルを選ぶと「一括登録を実行」が押せるようになる。押すと画面のスクリプトがファイルの形と
 *   在庫の上限を確かめてから送る。誤りがあれば画面上に一覧で出して送らない。増減数が100点以上の行があるときは確認の窓が出る。
 * - 下の「在庫変更CSV登録履歴」に、登録したファイル名の行が出る（承認対象が在庫変更CSV登録の行だけ）。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { chooseMembers } from "./m04_19_stock_change_csv";
import { findMemberId } from "./member";

const form = (page: Page) => page.locator("form#upload-form");

/** 在庫変更CSV登録画面を開く（メニューから開くのと同じ画面） */
export async function openStockChangeCsv(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/change/new"));
  expect(res?.status(), "在庫変更CSV登録画面の応答").toBe(200);
  await expect(form(page), "在庫変更CSV登録画面").toBeVisible();
  await page.waitForLoadState("load");
}

/** 「雛形ファイルダウンロード」を押してダウンロードを待つ */
export async function downloadStockChangeTemplate(page: Page): Promise<Download> {
  const link = page.locator("#download-button");
  await expect(link, "雛形をダウンロードするボタン").toHaveText(/雛形/);
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  return download;
}

export async function downloadBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/** 在庫変更CSV登録履歴で、ファイル名が一致する行の数（1ページ目） */
export async function historyRowsOfFile(page: Page, fileName: string): Promise<number> {
  const links = page.locator('tr[id^="ex-stock-"] a').filter({ hasText: new RegExp(`^\\s*${fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
  return links.count();
}

export type StockChangeCsvForm = {
  /** 店舗の選択肢の値（店舗ID）。表示名は店名 */
  店舗ID: string;
  店名: string;
  在庫区分: "EC-CUBE" | "スマレジ";
  /** 在庫変動区分の表示名から先頭の印を除いたもの（例: 廃棄/廃棄(破損)） */
  在庫変動区分: string;
  在庫変動理由: string;
  /** 承認通知先（所属選択） */
  所属: string;
  /** 承認通知先（メンバー選択）に選ぶメンバーの名前 */
  承認者: string;
};

/** 選択肢の表示名の先頭の印（入庫・廃棄を表す絵文字）を除く */
const withoutMark = (label: string) => label.replace(/^[^\p{L}\p{N}]+/u, "").trim();

/** 在庫変更CSV登録画面の、店舗・在庫区分・在庫変動区分・在庫変動理由・承認通知先（所属選択・メンバー選択）を指定する */
export async function fillStockChangeCsvForm(page: Page, v: StockChangeCsvForm): Promise<void> {
  const f = form(page);
  const store = f.locator("#admin_stock_change_csv_list_change_base_info");
  const option = store.locator(`option[value="${v.店舗ID}"]`);
  await expect(option, `店舗の選択肢に店舗ID ${v.店舗ID} がある`).toHaveCount(1);
  expect(((await option.textContent()) ?? "").trim(), `店舗ID ${v.店舗ID} の表示名`).toBe(v.店名);
  await store.selectOption(v.店舗ID);
  const members = f.locator("#admin_stock_change_csv_list_approval_notification_target_members");
  await expect(members.locator("option").filter({ hasText: new RegExp(`^\\s*${v.承認者}\\s*$`) }),
    `店舗「${v.店名}」の承認通知先の候補に「${v.承認者}」が出る`).toHaveCount(1, { timeout: 30_000 });

  const zones = f.locator('input[name="admin_stock_change_csv_list[change_stock_location_id]"]');
  const labels = await zones.evaluateAll((nodes) => nodes.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  const zi = labels.indexOf(v.在庫区分);
  if (zi < 0) throw new Error(`在庫区分「${v.在庫区分}」の選択肢が無い（ある選択肢: ${labels.join("、")}）`);
  await zones.nth(zi).check();

  const type = f.locator("#admin_stock_change_csv_list_stock_change_type_detail");
  const options = await type.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value));
  const hit = options.filter((o) => withoutMark(o.label) === v.在庫変動区分);
  if (hit.length !== 1) throw new Error(`在庫変動区分「${v.在庫変動区分}」が1つではない（ある選択肢: ${options.map((o) => withoutMark(o.label)).join("、")}）`);
  await type.selectOption(hit[0].value);
  await f.locator("#admin_stock_change_csv_list_stock_change_reason").fill(v.在庫変動理由);
  await chooseByLabel(f.locator("#admin_stock_change_csv_list_approval_department"), v.所属);
  await chooseMembers(members, [v.承認者]);
}

/**
 * 「ファイルを選択」を押してファイルを選び、「一括登録を実行」を押す。画面の結果（送信して保存できた／画面が誤りを出して送らなかった）を返す。
 * 100点以上の確認の窓が出たら、出たことを返して OK は押さない（呼ぶ側が決める）。
 */
export async function chooseFileAndRegister(page: Page, filePath: string): Promise<{ 結果: "送信"; 警告: string[] } | { 結果: "誤り"; 誤り: string[] } | { 結果: "確認の窓" }> {
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator("#file-select").click()]);
  await chooser.setFiles(filePath);
  const upload = page.locator("#upload-button");
  await expect(upload, "ファイルを選ぶと「一括登録を実行」が押せる").toBeEnabled();
  await expect(upload).toHaveText(/^\s*一括登録を実行\s*$/);
  const navigated = page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }).then(() => "送信" as const, () => "時間切れ" as const);
  const shownErrors = page.locator("#csv-validate-errors").waitFor({ state: "visible", timeout: 180_000 }).then(() => "誤り" as const, () => "時間切れ" as const);
  const shownModal = page.locator("#largeChangeConfirmModal #large-change-confirm-ok").waitFor({ state: "visible", timeout: 180_000 })
    .then(() => "確認の窓" as const, () => "時間切れ" as const);
  await upload.click();
  const outcome = await Promise.race([navigated, shownErrors, shownModal]);
  if (outcome === "時間切れ") throw new Error("「一括登録を実行」を押しても画面が移らない");
  if (outcome === "確認の窓") return { 結果: "確認の窓" };
  if (outcome === "誤り") return { 結果: "誤り", 誤り: (await page.locator("#csv-validate-error-list li").allTextContents()).map((t) => t.trim()) };
  return { 結果: "送信", 警告: await expectSaved(page, "在庫変更CSV登録の一括登録") };
}

// ---- メンバー登録（所属店舗を店舗IDで、所属を名称で選ぶ） ----

export type MemberWithDept = {
  名前: string; ログインID: string; メールアドレス: string; パスワード: string; 権限: string;
  所属店舗ID: string; 所属: string; デフォルト検索表示店舗ID: string; 編集可能店舗ID: string[];
};

const mf = (page: Page, name: string): Locator => page.locator(`[name="admin_member[${name}]"]`);

async function selectedValues(page: Page, selector: string): Promise<string> {
  return (await page.locator(selector).evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value))).sort().join("・");
}

/**
 * メンバー管理で、あれば内容を確かめて使い、無ければ登録する。管理者IDを返す。
 * 共通の部品（member.ts・m04_24_member.ts）は所属を選択肢の先頭に決めているので、所属を名称で選ぶ版を作った。
 * 店舗は店舗IDで選ぶ（「本店」は店舗ID 1 で、同じ店名の別の店舗があるため名前で選べない）。
 */
export async function ensureMemberWithDept(page: Page, v: MemberWithDept): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (!found) {
    await page.goto(adminUrl("/setting/system/member"));
    await page.getByRole("link", { name: "新規登録" }).click();
    await page.waitForLoadState("load");
    await mf(page, "name").fill(v.名前);
    await mf(page, "baseInfo").selectOption(v.所属店舗ID);
    await chooseByLabel(mf(page, "department"), v.所属);
    await mf(page, "login_id").fill(v.ログインID);
    await mf(page, "email").fill(v.メールアドレス);
    await page.locator('[name="admin_member[plain_password][first]"]').fill(v.パスワード);
    await page.locator('[name="admin_member[plain_password][second]"]').fill(v.パスワード);
    await chooseByLabel(mf(page, "Authority"), v.権限);
    await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption(v.編集可能店舗ID);
    await mf(page, "defaultSearchBaseInfo").selectOption(v.デフォルト検索表示店舗ID);
    await page.getByLabel("稼働", { exact: true }).check();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "登録", exact: true }).click()]);
    await expectSaved(page, `メンバー「${v.名前}」の登録`);
    const m = /\/member\/(\d+)\/edit/.exec(page.url());
    if (!m) throw new Error(`メンバー「${v.名前}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  }
  const id = found ?? (await findMemberId(page, v.名前));
  if (!id) throw new Error(`メンバー「${v.名前}」がメンバー管理の一覧にいない`);
  await page.goto(adminUrl(`/setting/system/member/${id}/edit`));
  await page.waitForLoadState("load");
  const got: Record<string, string> = {
    名前: await mf(page, "name").inputValue(),
    ログインID: await mf(page, "login_id").inputValue(),
    メールアドレス: await mf(page, "email").inputValue(),
    権限: ((await mf(page, "Authority").locator("option:checked").textContent()) ?? "").trim(),
    所属: ((await mf(page, "department").locator("option:checked").textContent()) ?? "").trim(),
    所属店舗ID: await selectedValues(page, '[name="admin_member[baseInfo]"]'),
    デフォルト検索表示店舗ID: await selectedValues(page, '[name="admin_member[defaultSearchBaseInfo]"]'),
    編集可能店舗ID: await selectedValues(page, '[name="admin_member[editableBaseInfos][]"]'),
    稼働: (await page.getByLabel("稼働", { exact: true }).isChecked()) ? "稼働" : "非稼働",
  };
  const want: Record<string, string> = {
    名前: v.名前, ログインID: v.ログインID, メールアドレス: v.メールアドレス, 権限: v.権限, 所属: v.所属, 所属店舗ID: v.所属店舗ID,
    デフォルト検索表示店舗ID: v.デフォルト検索表示店舗ID, 編集可能店舗ID: [...v.編集可能店舗ID].sort().join("・"), 稼働: "稼働",
  };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`メンバー「${v.名前}」（管理者ID ${id}）は登録済みだが、内容が違う: ${diff.join(" / ")}`);
  return id;
}
