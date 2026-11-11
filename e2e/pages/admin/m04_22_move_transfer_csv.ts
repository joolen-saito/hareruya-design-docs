/**
 * M04-22 在庫移動・振替CSV登録の画面操作と、試験用の権限（承認権限なし）の用意。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 在庫移動・振替検索一覧の上部に「在庫移動CSV登録」「在庫振替CSV登録」のボタンがあり、押すとそれぞれのモーダルが開く
 *   （画面のスクリプト（Bootstrap のモーダル）で開くので、読み込みを待ってから押す）。
 * - 権限管理は、権限（行）ごとに「承認権限」の列のチェック欄を持つ表。チェックが付いている＝許可、外す＝拒否。
 *   新しい権限は拒否の設定を持たないので、はじめは承認権限を含めてすべて許可になる。
 *   画面には承認権限のほかの列（在庫管理の機能ごとの列）は無い。
 * - マスタデータ管理で権限のマスター（mtb_authority）を選ぶと、ID・名称の入力欄の行と、追加用の空の行が出る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

/** マスタデータ管理でマスターを選んで開く。行は「ID」「名称」の2つの入力欄 */
async function openMaster(page: Page, table: string): Promise<Locator> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const select = page.locator("form#form1 select").first();
  await expect(select, "マスタデータ管理のマスタの選択欄").toBeVisible();
  await chooseByLabel(select, table);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#form1 button[type=submit]").click()]);
  const rows = page.locator("form#form2 tbody tr");
  await expect(rows.first(), `マスター ${table} の行`).toBeVisible();
  return rows;
}

async function masterRows(rows: Locator): Promise<{ id: string; name: string; row: Locator }[]> {
  const out: { id: string; name: string; row: Locator }[] = [];
  for (const row of await rows.all()) {
    const inputs = row.locator("input[type=text], input:not([type])");
    if ((await inputs.count()) < 2) continue;
    out.push({ id: (await inputs.nth(0).inputValue()).trim(), name: (await inputs.nth(1).inputValue()).trim(), row });
  }
  return out;
}

/**
 * マスタデータ管理で、権限のマスターに名称の行が無ければ、空の行に「いまの最大のID＋1」と名称を入れて登録する。
 * あればそのまま使う。権限のIDを返す。
 */
export async function ensureAuthorityMasterRow(page: Page, name: string): Promise<string> {
  const table = "mtb_authority";
  let rows = await openMaster(page, table);
  const all = await masterRows(rows);
  const found = all.filter((r) => r.name === name);
  if (found.length > 1) throw new Error(`権限のマスターに名称「${name}」の行が複数ある`);
  if (found.length === 1) return found[0].id;
  const empty = all.filter((r) => r.id === "" && r.name === "");
  if (empty.length !== 1) throw new Error(`権限のマスターに、追加用の空の行が1行ではない（${empty.length}行）`);
  const next = String(Math.max(0, ...all.map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0)) + 1);
  const inputs = empty[0].row.locator("input[type=text], input:not([type])");
  await inputs.nth(0).fill(next);
  await inputs.nth(1).fill(name);
  await page.locator("form#form2 button[type=submit]").click();
  await expectSaved(page, `権限のマスターへの「${name}」の登録`);
  rows = await openMaster(page, table);
  const saved = (await masterRows(rows)).filter((r) => r.name === name);
  if (saved.length !== 1) throw new Error(`権限「${name}」を登録したが、マスターに1行として出ない`);
  return saved[0].id;
}

/** 権限管理の表で、権限の名前の行の「承認権限」のチェック欄 */
function approvalBox(page: Page, authorityName: string): Locator {
  const row = page.locator("#table-authority tbody tr").filter({
    has: page.locator("th:first-child", { hasText: new RegExp(`^\\s*${authorityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }),
  });
  return row.locator('input.permission-checkbox[data-url="/approval_authority"]');
}

/** 権限管理を開き、見出しに「承認権限」の列があることを確かめる */
async function openAuthorityMatrix(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/setting/system/authority"));
  expect(res?.status(), "権限管理の応答").toBe(200);
  await expect(page.locator("#table-authority"), "権限管理の表").toBeVisible();
  await page.waitForLoadState("load");
  const heads = (await page.locator("#table-authority thead tr").nth(1).locator("th").allInnerTexts()).map((t) => t.trim());
  if (!heads.includes("承認権限")) throw new Error(`権限管理の表に「承認権限」の列が無い（列: ${heads.join("、")}）`);
}

/**
 * 権限管理で、権限の名前の行の「承認権限」のチェックを外して「登録」を押す（外れていれば何もしない）。
 * 開き直して外れていることを確かめる。
 */
export async function denyApprovalForAuthority(page: Page, authorityName: string): Promise<void> {
  await openAuthorityMatrix(page);
  const box = approvalBox(page, authorityName);
  await expect(box, `権限管理に権限「${authorityName}」の承認権限のチェック欄が1つ`).toHaveCount(1);
  if (await box.isChecked()) {
    await box.uncheck();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.locator('button[type="submit"][form="form1"]').click(),
    ]);
    await expectSaved(page, `権限「${authorityName}」の承認権限を外す登録`);
    await openAuthorityMatrix(page);
  }
  await expect(approvalBox(page, authorityName), `権限「${authorityName}」の承認権限のチェックは外れている`).not.toBeChecked();
}

// ---- 在庫移動・振替検索一覧 ----

export type CsvModalKind = "在庫移動CSV登録" | "在庫振替CSV登録";
export const MODAL_ID: Record<CsvModalKind, string> = { 在庫移動CSV登録: "#stockMoveCsvRegisterModal", 在庫振替CSV登録: "#stockTransferCsvRegisterModal" };

/** 在庫移動・振替検索一覧を開く（メニューから開くのと同じ画面） */
export async function openMoveTransferList(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/move_transfer"));
  expect(res?.status(), "在庫移動・振替検索一覧の応答").toBe(200);
  await expect(page.locator("form#form_search_stock_move_transfer"), "在庫移動・振替検索一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
}

/** 「在庫移動CSV登録」「在庫振替CSV登録」のボタンを押す */
export async function pressCsvRegisterButton(page: Page, kind: CsvModalKind): Promise<void> {
  const button = page.getByRole("button", { name: kind, exact: true });
  await expect(button, `「${kind}」ボタンは1つ`).toHaveCount(1);
  await button.click();
}

/** モーダル（いま表示されているもの）と、その見出し */
export function csvModal(page: Page, kind: CsvModalKind): { modal: Locator; title: Locator } {
  const modal = page.locator(MODAL_ID[kind]);
  return { modal, title: modal.locator(".modal-title") };
}

// ---- 在庫移動・振替CSV登録のモーダルの入力と登録（見直し分 -x のケース） ----
//
// 画面の作り（アプリの在庫移動・振替検索一覧のテンプレートとフォームの型で確かめた）:
// - 在庫移動CSV登録: 出庫元店舗・入庫先店舗（選択欄。値は店舗ID。開発環境には同じ店名の店舗があるので店舗IDで選ぶ）、
//   出庫元在庫区分・入庫先在庫区分（ラジオ。EC-CUBE・スマレジ）、ファイル（「ファイルを選択」で選ぶ）、「登録」。
// - 在庫振替CSV登録: 店舗（選択欄）、在庫区分（ラジオ）、承認通知先の所属（選択欄）・メンバー（複数選択。select2）、ファイル、「登録」。
//   メンバーの選択肢は、画面のスクリプトが店舗の選択に合わせて「その店舗に所属する承認権限のあるメンバー」に入れ替え、
//   所属の選択肢もそのメンバーの所属に入れ替える。所属を選ぶとメンバーをさらに絞る（選んでいたメンバーは選んだまま残す）。
//   メンバーの表示名は、同じ名前の承認者がほかにいると「名前(ID:管理者ID)」になる（アプリの StockTransferCsvImportType）。
// - 「登録」を押すと一覧（または登録した在庫移動のピック・出庫承認申請画面／在庫振替の画面）へ移り、画面上部に結果のメッセージが出る。
// - モーダルを閉じると、画面のスクリプトが入力をリセットする。

export type 在庫区分 = "EC-CUBE" | "スマレジ";
export type CSVファイル = { 名前: string; 中身: string };

const moveField = (page: Page, name: string) => page.locator(`#stockMoveCsvRegisterForm [name="stock_move_csv_import[${name}]"]`);
const transferField = (page: Page, name: string) => page.locator(`#stockTransferCsvRegisterForm [name="stock_transfer_csv_import[${name}]"]`);
const MEMBERS = "#stock_transfer_csv_import_approval_notification_target_members";
const DEPARTMENT = "#stock_transfer_csv_import_approval_department";
const FILE_BUTTON: Record<CsvModalKind, string> = { 在庫移動CSV登録: "#stockMoveCsvModalFileSelectBtn", 在庫振替CSV登録: "#stockTransferCsvModalFileSelectBtn" };
const FILE_NAME: Record<CsvModalKind, string> = { 在庫移動CSV登録: "#stockMoveCsvModalFileName", 在庫振替CSV登録: "#stockTransferCsvModalFileName" };
const SUBMIT: Record<CsvModalKind, string> = { 在庫移動CSV登録: "#stockMoveCsvModalSubmitBtn", 在庫振替CSV登録: "#stockTransferCsvModalSubmitBtn" };
const FORM: Record<CsvModalKind, string> = { 在庫移動CSV登録: "#stockMoveCsvRegisterForm", 在庫振替CSV登録: "#stockTransferCsvRegisterForm" };
const exactText = (t: string) => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 在庫移動・振替検索一覧を開き、ボタンを押してモーダルを表示する */
export async function openCsvModal(page: Page, kind: CsvModalKind): Promise<Locator> {
  await openMoveTransferList(page);
  await pressCsvRegisterButton(page, kind);
  const { modal } = csvModal(page, kind);
  await expect(modal, `${kind}モーダルが表示される`).toBeVisible();
  return modal;
}

/** 店舗の選択欄で、店舗IDの選択肢を選ぶ（選択肢が無ければ止める） */
async function chooseStoreById(select: Locator, 店舗ID: string, what: string): Promise<void> {
  const values = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  if (!values.includes(店舗ID)) throw new Error(`${what}に店舗ID ${店舗ID} の選択肢が無い`);
  await select.selectOption(店舗ID);
  await expect(select, `${what}に店舗ID ${店舗ID} を選んだ`).toHaveValue(店舗ID);
}

/** ラジオの組から、ラベルが一致するものを選ぶ（force を付けずに選び、選べたかを確かめる） */
async function chooseRadio(group: Locator, label: 在庫区分, what: string): Promise<void> {
  const labels = await group.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  const i = labels.indexOf(label);
  if (i < 0) throw new Error(`${what}に「${label}」の選択肢が無い（${labels.join("、")}）`);
  await group.nth(i).check();
  await expect(group.nth(i), `${what}に「${label}」を選んだ`).toBeChecked();
}

/** 在庫移動CSV登録モーダルで、出庫元・入庫先の店舗（店舗ID）と在庫区分を選ぶ */
export async function chooseMoveTargets(page: Page, v: { 出庫元店舗ID: string; 出庫元在庫区分: 在庫区分; 入庫先店舗ID: string; 入庫先在庫区分: 在庫区分 }): Promise<void> {
  await chooseStoreById(moveField(page, "move_from_base_info"), v.出庫元店舗ID, "出庫元店舗");
  await chooseStoreById(moveField(page, "move_to_base_info"), v.入庫先店舗ID, "入庫先店舗");
  await chooseRadio(page.locator('#stockMoveCsvRegisterForm input[type="radio"][name="stock_move_csv_import[move_from_stock_location_id]"]'), v.出庫元在庫区分, "出庫元在庫区分");
  await chooseRadio(page.locator('#stockMoveCsvRegisterForm input[type="radio"][name="stock_move_csv_import[move_to_stock_location_id]"]'), v.入庫先在庫区分, "入庫先在庫区分");
}

/** 在庫振替CSV登録モーダルで、店舗（店舗ID）と在庫区分を選ぶ。選ぶと承認通知先の選択肢が入れ替わる */
export async function chooseTransferTarget(page: Page, v: { 店舗ID: string; 在庫区分: 在庫区分 }): Promise<void> {
  await chooseStoreById(transferField(page, "transfer_base_info"), v.店舗ID, "店舗");
  await chooseRadio(page.locator('#stockTransferCsvRegisterForm input[type="radio"][name="stock_transfer_csv_import[transfer_stock_location_id]"]'), v.在庫区分, "在庫区分");
}

export type 承認通知先の選択肢 = { 管理者ID: string; 表示名: string; 名前: string; 選択中: boolean };

/** 承認通知先（メンバー選択）の選択肢。表示名の「(ID:管理者ID)」（同じ名前の承認者がほかにいるとき）を外した名前も返す */
export async function approverOptions(page: Page): Promise<承認通知先の選択肢[]> {
  const rows = await page.locator(`${MEMBERS} option`).evaluateAll((os) => os
    .map((o) => ({ value: (o as HTMLOptionElement).value, text: (o.textContent ?? "").trim(), selected: (o as HTMLOptionElement).selected }))
    .filter((o) => o.value !== ""));
  return rows.map((r) => ({ 管理者ID: r.value, 表示名: r.text, 名前: r.text.replace(/\(ID:\d+\)$/, ""), 選択中: r.selected }));
}

/** 承認通知先（所属選択）の選択肢の名前（「指定なし」を除く） */
export async function approverDepartmentOptions(page: Page): Promise<string[]> {
  return page.locator(`${DEPARTMENT} option`).evaluateAll((os) => os
    .filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
}

/** 承認通知先（所属選択）を名前で選ぶ（空なら「指定なし」）。選ぶと画面のスクリプトがメンバーの選択肢を絞る */
export async function chooseApproverDepartment(page: Page, 名前: string): Promise<void> {
  const select = page.locator(DEPARTMENT);
  if (!名前) { await select.selectOption(""); return; }
  const names = await approverDepartmentOptions(page);
  if (!names.includes(名前)) throw new Error(`承認通知先（所属選択）に「${名前}」が無い（${names.join("、") || "選択肢なし"}）`);
  await select.selectOption({ label: 名前 });
}

/** 承認通知先（メンバー選択）で、管理者IDのメンバーを選ぶ（ほかの選択は外す）。画面のスクリプトに知らせる */
export async function chooseApprovers(page: Page, 管理者IDs: string[], what: string): Promise<void> {
  const have = (await approverOptions(page)).map((o) => o.管理者ID);
  const missing = 管理者IDs.filter((id) => !have.includes(id));
  if (missing.length) throw new Error(`${what}: 承認通知先（メンバー選択）に管理者ID ${missing.join("・")} の選択肢が無い`);
  await page.locator(MEMBERS).evaluate((node, want) => {
    const s = node as HTMLSelectElement;
    for (const o of Array.from(s.options)) o.selected = want.includes(o.value);
    const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
    if (w.jQuery) w.jQuery(s).trigger("change"); else s.dispatchEvent(new Event("change", { bubbles: true }));
  }, 管理者IDs);
  const chosen = (await approverOptions(page)).filter((o) => o.選択中).map((o) => o.管理者ID).sort();
  expect(chosen, `${what}: 承認通知先に選んだメンバー`).toEqual([...管理者IDs].sort());
}

/** モーダルの「ファイルを選択」でファイルを選ぶ（中身は UTF-8） */
export async function chooseCsvFile(page: Page, kind: CsvModalKind, file: CSVファイル): Promise<void> {
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator(FILE_BUTTON[kind]).click()]);
  await chooser.setFiles({ name: file.名前, mimeType: file.名前.endsWith(".txt") ? "text/plain" : "text/csv", buffer: Buffer.from(file.中身, "utf8") });
  await expect(page.locator(FILE_NAME[kind]), `選んだファイル名「${file.名前}」が表示される`).toHaveText(exactText(file.名前));
}

export type 登録の結果 = { パス: string; 見出し: string; エラー: string[]; 成功: string[] };

/** モーダルの「登録」を押し、移った先の画面のパス・見出しと、画面上部のメッセージを返す */
export async function submitCsvModal(page: Page, kind: CsvModalKind): Promise<登録の結果> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.locator(SUBMIT[kind]).click(),
  ]);
  await page.waitForLoadState("load");
  const visibleTexts = async (sel: string) => {
    const out: string[] = [];
    for (const e of await page.locator(sel).all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out.filter(Boolean).filter((t) => t !== "デバッグモードが有効になっています。");
  };
  return {
    パス: new URL(page.url()).pathname,
    見出し: ((await page.locator(".c-pageTitle__titles, .c-pageTitle").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim(),
    エラー: await visibleTexts(".alert-danger"),
    成功: await visibleTexts(".alert-success"),
  };
}

/** 在庫移動・振替検索一覧のアドレスか */
export const isMoveTransferList = (パス: string): boolean => /\/product\/stock\/move_transfer\/?$/.test(パス);
/** ピック・出庫承認申請画面のアドレスなら、その在庫移動・振替ID */
export const outboundApprovalRequestId = (パス: string): string | null => /\/product\/stock\/move\/outbound_approval_request\/(\d+)$/.exec(パス)?.[1] ?? null;

export type 移動モーダルの入力 = { 出庫元店舗: string; 入庫先店舗: string; 出庫元在庫区分: string; 入庫先在庫区分: string; ファイルの数: number; ファイル名の表示: string };

/** 在庫移動CSV登録モーダルの入力の状態（選択欄の値・選ばれているラジオのラベル・選んだファイル） */
export async function moveModalInputs(page: Page): Promise<移動モーダルの入力> {
  const radio = async (name: string) => page.locator(`#stockMoveCsvRegisterForm input[type="radio"][name="stock_move_csv_import[${name}]"]`)
    .evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "").join("、"));
  return {
    出庫元店舗: await moveField(page, "move_from_base_info").inputValue(),
    入庫先店舗: await moveField(page, "move_to_base_info").inputValue(),
    出庫元在庫区分: await radio("move_from_stock_location_id"),
    入庫先在庫区分: await radio("move_to_stock_location_id"),
    ファイルの数: await page.locator(`${FORM.在庫移動CSV登録} input[type="file"]`).evaluate((n) => (n as HTMLInputElement).files?.length ?? 0),
    ファイル名の表示: ((await page.locator(FILE_NAME.在庫移動CSV登録).textContent()) ?? "").trim(),
  };
}

export type 振替モーダルの入力 = { 店舗: string; 在庫区分: string; 承認通知先の所属: string; 承認通知先のメンバー: string[]; ファイルの数: number; ファイル名の表示: string };

/** 在庫振替CSV登録モーダルの入力の状態 */
export async function transferModalInputs(page: Page): Promise<振替モーダルの入力> {
  return {
    店舗: await transferField(page, "transfer_base_info").inputValue(),
    在庫区分: await page.locator('#stockTransferCsvRegisterForm input[type="radio"][name="stock_transfer_csv_import[transfer_stock_location_id]"]')
      .evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "").join("、")),
    承認通知先の所属: await page.locator(DEPARTMENT).inputValue(),
    承認通知先のメンバー: (await approverOptions(page)).filter((o) => o.選択中).map((o) => o.表示名),
    ファイルの数: await page.locator(`${FORM.在庫振替CSV登録} input[type="file"]`).evaluate((n) => (n as HTMLInputElement).files?.length ?? 0),
    ファイル名の表示: ((await page.locator(FILE_NAME.在庫振替CSV登録).textContent()) ?? "").trim(),
  };
}

// ---- 所属つきのメンバー（承認通知先の候補。S-M04-22-APPROVERS） ----

export type 所属つきメンバー = {
  名前: string; ログインID: string; パスワード: string; メールアドレス: string; 権限: string; 所属店舗ID: string; 所属: string; 編集可能店舗ID: string[];
};

const memberField = (page: Page, name: string) => page.locator(`[name="admin_member[${name}]"]`);

/** メンバー登録画面で、所属を名前で選んで登録する。遷移したメンバー編集画面のアドレスから管理者IDを読んで返す */
export async function createMemberWithDepartment(page: Page, v: 所属つきメンバー): Promise<string> {
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  await page.waitForLoadState("load");
  await memberField(page, "name").fill(v.名前);
  await memberField(page, "baseInfo").selectOption(v.所属店舗ID);
  await chooseByLabel(memberField(page, "department"), v.所属);
  await memberField(page, "login_id").fill(v.ログインID);
  await memberField(page, "email").fill(v.メールアドレス);
  await page.locator('[name="admin_member[plain_password][first]"]').fill(v.パスワード);
  await page.locator('[name="admin_member[plain_password][second]"]').fill(v.パスワード);
  await chooseByLabel(memberField(page, "Authority"), v.権限);
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption(v.編集可能店舗ID);
  // デフォルト検索表示店舗の選択肢は、画面のスクリプトが所属店舗に合わせて作り直す（所属店舗と同じ店舗を選ぶ）
  await expect(memberField(page, "defaultSearchBaseInfo").locator(`option[value="${v.所属店舗ID}"]`), "デフォルト検索表示店舗に所属店舗の選択肢").toHaveCount(1);
  await memberField(page, "defaultSearchBaseInfo").selectOption(v.所属店舗ID);
  await page.getByLabel("稼働", { exact: true }).check();
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `メンバー「${v.名前}」の登録`);
  const m = /\/member\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`メンバー「${v.名前}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/** 登録済みのメンバーが求める内容（名前・ログインID・権限・所属店舗・所属・編集可能店舗・稼働）と同じかを、メンバー編集画面で確かめる */
export async function expectMemberWithDepartment(page: Page, 管理者ID: string, v: 所属つきメンバー): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${管理者ID}/edit`));
  await page.waitForLoadState("load");
  await expect(memberField(page, "name"), `メンバー編集画面（管理者ID ${管理者ID}）`).toBeVisible();
  const selected = async (sel: string) => (await page.locator(sel).evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value))).sort().join("・");
  const label = async (name: string) => ((await memberField(page, name).locator("option:checked").textContent()) ?? "").trim();
  const got: Record<string, string> = {
    名前: await memberField(page, "name").inputValue(), ログインID: await memberField(page, "login_id").inputValue(),
    権限: await label("Authority"), 所属: await label("department"), 所属店舗ID: await selected('[name="admin_member[baseInfo]"]'),
    編集可能店舗ID: await selected('[name="admin_member[editableBaseInfos][]"]'),
    稼働: (await page.getByLabel("稼働", { exact: true }).isChecked()) ? "稼働" : "非稼働",
  };
  const want: Record<string, string> = {
    名前: v.名前, ログインID: v.ログインID, 権限: v.権限, 所属: v.所属, 所属店舗ID: v.所属店舗ID, 編集可能店舗ID: [...v.編集可能店舗ID].sort().join("・"), 稼働: "稼働",
  };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`メンバー「${v.名前}」（管理者ID ${管理者ID}）は登録済みだが、内容が違う: ${diff.join(" / ")}`);
}

/** 権限管理の表で、権限の「承認権限」のチェックが外れている（承認できない）ことを確かめる（書き換えない） */
export async function expectApprovalDenied(page: Page, authorityName: string): Promise<void> {
  await openAuthorityMatrix(page);
  const box = approvalBox(page, authorityName);
  await expect(box, `権限管理に権限「${authorityName}」の承認権限のチェック欄が1つ`).toHaveCount(1);
  await expect(box, `権限「${authorityName}」の承認権限のチェックは外れている`).not.toBeChecked();
}

/** 権限管理の表で、権限の「承認権限」にチェックが付いている（承認できる）ことを確かめる（書き換えない） */
export async function expectApprovalAllowed(page: Page, authorityName: string): Promise<void> {
  await openAuthorityMatrix(page);
  const box = approvalBox(page, authorityName);
  await expect(box, `権限管理に権限「${authorityName}」の承認権限のチェック欄が1つ`).toHaveCount(1);
  await expect(box, `権限「${authorityName}」の承認権限にチェックが付いている`).toBeChecked();
}
