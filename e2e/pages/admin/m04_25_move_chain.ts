/**
 * M04-25 在庫移動指示詳細・M04-28 送り状CSV出力のシードが、在庫移動指示を画面から作るための操作。
 * 共通の部品（pages/admin の既存のファイル）は変えず、足りない操作だけをここに置く。
 * - 店舗: 店舗登録画面で、高額商品閾値1〜3も入れて登録する（M04-24 の店舗の部品は閾値を入れない）。
 * - 在庫移動CSV登録（在庫移動・振替検索一覧の「在庫移動CSV登録」のモーダル）: 出庫元・入庫先の店舗（店舗IDで選ぶ）と在庫区分を選び、
 *   「商品コード,移動点数」のCSVを選んで「登録」。取込が成功するとピック・出庫承認申請画面へ移る（アプリの在庫移動CSV登録の処理）。
 * - 在庫移動指示検索: 出庫元・入庫先の店舗（必須）と、在庫移動指示ID または在庫移動・振替IDで検索し、行を読む。
 * - 在庫移動指示詳細: 画面の値の読み取り・送り状No.と備考の入力・「登録」・削除ボタンの状態。
 * - 移動入庫承認申請・入庫承認: 承認通知先のメンバー（名前で選ぶ）を選んで「承認申請」、承認者のセッションで「承認」。
 * 画面のスクリプトが読み込まれる前に押すと、モーダルや確認が働かないので、読み込みを待ってから押す。
 */
import { expect, Locator, Page } from "@playwright/test";
import { csvLine } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { pressApprove } from "./m04_09_move";
import { MoveInstructionSearchPage, pathOf } from "./m04_24_move_instruction";
import { expectStore, findOpenStoreId, M0424StoreInput } from "./m04_24_store";

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------- 店舗（高額商品閾値つき）

export type ThresholdStoreInput = M0424StoreInput & { 高額商品閾値: [string, string, string] };

const storeField = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);

/** 店舗編集画面の高額商品閾値1〜3（空は ""） */
async function readThresholds(page: Page, id: string): Promise<string[]> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${id}`));
  if (!res || !res.ok()) throw new Error(`店舗ID ${id} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  const out: string[] = [];
  for (const n of [1, 2, 3]) out.push((await storeField(page, `expensive_threshold${n}`).inputValue()).replace(/,/g, "").trim());
  return out;
}

/** 店舗登録画面で、M04-24 の部品と同じ値に高額商品閾値1〜3を足して登録する（M04-24 の部品は閾値を入れない） */
async function createStoreWithThresholds(page: Page, v: ThresholdStoreInput): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"));
  await page.waitForLoadState("load");
  await storeField(page, "company_name").fill(v.会社名);
  await storeField(page, "company_kana").fill(v.会社名カナ);
  await storeField(page, "shop_name").fill(v.店名);
  await storeField(page, "shop_kana").fill(v.店名カナ);
  await storeField(page, "shop_name_eng").fill(v.店名英語);
  await storeField(page, "html_class_name").fill(v.支店URL);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel("公開", { exact: true }).check();
  await page.getByLabel("開店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await storeField(page, "postal_code").fill(v.郵便番号);
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), v.都道府県);
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill(v.住所1);
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill(v.住所2);
  await storeField(page, "phone_number").fill(v.電話番号);
  for (const m of ["email01", "email02", "email03", "email04"]) await storeField(page, m).fill(`${v.支店URL}@example.test`);
  await storeField(page, "shop_digit").fill(v.店名略称3文字);
  await storeField(page, "short_name_jp").fill(v.ショップ名略称);
  await storeField(page, "rank").fill("0");
  for (const [i, n] of [1, 2, 3].entries()) await storeField(page, `expensive_threshold${n}`).fill(v.高額商品閾値[i]);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${v.店名}」の登録`);
}

/**
 * 店名・会社名が一致する開店の店舗があれば、内容（M04-24 の部品が確かめる項目と高額商品閾値）を確かめて使い、無ければ登録する。
 * 登録済みで高額商品閾値が違えば止める（ほかのケースが使っている店舗を書き換えない）。
 */
export async function ensureStoreWithThresholds(page: Page, v: ThresholdStoreInput, onIssue: (m: string) => void): Promise<string> {
  let id = await findOpenStoreId(page, v.店名, v.会社名);
  if (!id) {
    let failure = "";
    try {
      await createStoreWithThresholds(page, v);
    } catch (e) {
      failure = (e as Error).message.split("\n")[0];
    }
    id = await findOpenStoreId(page, v.店名, v.会社名);
    if (!id) throw new Error(`店舗「${v.店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
    if (failure) onIssue(`店舗登録画面で「${v.店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
  }
  await expectStore(page, id, v);
  const got = await readThresholds(page, id);
  if (got.join("/") !== v.高額商品閾値.join("/")) {
    throw new Error(`店舗「${v.店名}」（店舗ID ${id}）の高額商品閾値が「${got.join("/")}」（求めるのは「${v.高額商品閾値.join("/")}」）`);
  }
  return id;
}

// ---------------------------------------------------------------- 在庫移動CSV登録

export type MoveCsvInput = {
  出庫元店舗ID: string; 入庫先店舗ID: string; 出庫元在庫区分: "EC-CUBE" | "スマレジ"; 入庫先在庫区分: "EC-CUBE" | "スマレジ";
  行: { 商品コード: string; 移動点数: number }[];
  ファイル名: string;
};

/** 在庫移動・振替検索一覧の「在庫移動CSV登録」で登録する。移ったピック・出庫承認申請画面のアドレスの在庫移動・振替IDを返す */
export async function registerMoveByCsv(page: Page, v: MoveCsvInput, what: string): Promise<string> {
  await page.goto(adminUrl("/product/stock/move_transfer"));
  await page.waitForLoadState("load");
  const open = page.locator('button[data-bs-target="#stockMoveCsvRegisterModal"]');
  await expect(open, `${what}: 「在庫移動CSV登録」ボタン`).toHaveText(exact("在庫移動CSV登録"));
  await open.click();
  const modal = page.locator("#stockMoveCsvRegisterModal");
  await expect(modal, `${what}: 在庫移動CSV登録のモーダル`).toBeVisible();
  const form = modal.locator("form#stockMoveCsvRegisterForm");
  for (const [field, id] of [["move_from_base_info", v.出庫元店舗ID], ["move_to_base_info", v.入庫先店舗ID]] as const) {
    const select = form.locator(`[name="stock_move_csv_import[${field}]"]`);
    const values = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    if (!values.includes(id)) throw new Error(`${what}: ${field === "move_from_base_info" ? "出庫元店舗" : "入庫先店舗"}に店舗ID ${id} の選択肢が無い`);
    await select.selectOption(id);
  }
  for (const [field, label] of [["move_from_stock_location_id", v.出庫元在庫区分], ["move_to_stock_location_id", v.入庫先在庫区分]] as const) {
    const radios = form.locator(`input[type="radio"][name="stock_move_csv_import[${field}]"]`);
    const labels = await radios.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
    const i = labels.indexOf(label);
    if (i < 0) throw new Error(`${what}: 在庫区分「${label}」の選択肢が無い（${labels.join("、")}）`);
    await radios.nth(i).check();
  }
  const csv = Buffer.from([csvLine(["商品コード", "移動点数"]), ...v.行.map((r) => csvLine([r.商品コード, String(r.移動点数)]))].join("\n") + "\n", "utf8");
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), modal.locator("#stockMoveCsvModalFileSelectBtn").click()]);
  await chooser.setFiles({ name: v.ファイル名, mimeType: "text/csv", buffer: csv });
  await expect(modal.locator("#stockMoveCsvModalFileName"), `${what}: 選んだファイル名`).toHaveText(exact(v.ファイル名));
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), modal.locator("#stockMoveCsvModalSubmitBtn").click()]);
  await expectSaved(page, what);
  const m = /\/product\/stock\/move\/outbound_approval_request\/(\d+)/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録のあと、ピック・出庫承認申請画面へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------- 在庫移動指示検索

/** 在庫移動指示検索画面で、出庫元・入庫先の店舗（必須）と在庫移動・振替IDで検索する。検索が送られなければ止める */
export async function searchInstructionByMoveId(page: Page, v: { 出庫元店舗ID: string; 入庫先店舗ID: string; 在庫移動ID: string }): Promise<MoveInstructionSearchPage> {
  const search = new MoveInstructionSearchPage(page);
  await search.open();
  await search.出庫元店舗.selectOption(v.出庫元店舗ID);
  await search.入庫先店舗.selectOption(v.入庫先店舗ID);
  await search.form.locator('[name="admin_search_stock_move_instruction[stock_move_transfer_id]"]').fill(v.在庫移動ID);
  const r = await search.pressSearch();
  if (!r.sent) throw new Error(`在庫移動指示検索画面の検索が、ブラウザの入力チェックで止まった: ${r.止めた項目.join(" / ")}`);
  return search;
}

/** 在庫移動指示検索画面で、出庫元・入庫先の店舗（必須）と在庫移動指示IDで検索する。検索が送られなければ止める */
export async function searchInstructionById(page: Page, v: { 出庫元店舗ID: string; 入庫先店舗ID: string; 在庫移動指示ID: string }): Promise<MoveInstructionSearchPage> {
  const search = new MoveInstructionSearchPage(page);
  await search.open();
  const r = await search.searchById(v.在庫移動指示ID, { 出庫元店舗ID: v.出庫元店舗ID, 入庫先店舗ID: v.入庫先店舗ID });
  if (!r.sent) throw new Error(`在庫移動指示検索画面の検索が、ブラウザの入力チェックで止まった: ${r.止めた項目.join(" / ")}`);
  return search;
}

// ---------------------------------------------------------------- 在庫移動指示詳細

export const instructionDetailUrl = (id: string) => adminUrl(`/product/stock/move-instruction/${id}`);

export type DetailMoveRow = {
  在庫移動ID: string; 出庫元店舗: string; 入庫先店舗: string; 在庫区分: string; 基準価格合計: string; 移動原価合計: string;
  高額商品合計: string; 通常商品合計: string; 移動点数: string; 登録日: string;
};

export class InstructionDetailPage {
  readonly form: Locator;
  readonly 送り状Noの欄: Locator;
  readonly 備考の欄: Locator;
  readonly 登録ボタン: Locator;
  readonly 削除ボタン: Locator;
  readonly 削除確認モーダル: Locator;
  readonly 在庫移動の表: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator('form[name="admin_stock_move_instruction_detail"]');
    this.送り状Noの欄 = page.locator('[name="admin_stock_move_instruction_detail[trackingNo]"]');
    this.備考の欄 = page.locator('[name="admin_stock_move_instruction_detail[memo]"]');
    this.登録ボタン = page.locator("#stockMoveInstructionRegisterButton");
    this.削除ボタン = this.form.locator("button.btn-ec-delete", { hasText: exact("削除") });
    this.削除確認モーダル = page.locator("#deleteInstructionModal");
    this.在庫移動の表 = page.locator(".card", { has: page.locator(".card-title", { hasText: exact("在庫移動一覧") }) }).locator("table tbody tr");
  }

  /** アドレスで在庫移動指示詳細画面を開き、画面のスクリプトの読み込みを待つ */
  async open(id: string): Promise<void> {
    const res = await this.page.goto(instructionDetailUrl(id));
    if (!res || !res.ok()) throw new Error(`在庫移動指示 ${id} の詳細画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.ready();
  }

  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.form, "在庫移動指示詳細画面の入力欄").toBeVisible();
  }

  /** 「在庫移動指示情報」の欄の値（ラベル → 表示）。閾値のラベルは表示のまま */
  async infoValues(): Promise<Record<string, string>> {
    return this.form.evaluate((f) => {
      const out: Record<string, string> = {};
      for (const label of Array.from(f.querySelectorAll("label.form-label"))) {
        const p = label.parentElement?.querySelector("p");
        if (p) out[(label.textContent ?? "").replace(/\s+/g, " ").trim()] = (p.textContent ?? "").replace(/\s+/g, " ").trim();
      }
      return out;
    });
  }

  /** 「在庫移動一覧」の表の見出し */
  async moveHeaders(): Promise<string[]> {
    return (await this.page.locator(".card", { has: this.page.locator(".card-title", { hasText: exact("在庫移動一覧") }) }).locator("table thead th").allInnerTexts()).map(clean);
  }

  /** 「在庫移動一覧」の表の行（上から） */
  async moveRows(): Promise<DetailMoveRow[]> {
    return this.在庫移動の表.evaluateAll((trs) => trs.map((tr) => {
      const t = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        在庫移動ID: t(0), 出庫元店舗: t(1), 入庫先店舗: t(2), 在庫区分: t(3), 基準価格合計: t(4), 移動原価合計: t(5),
        高額商品合計: t(6), 通常商品合計: t(7), 移動点数: t(8), 登録日: t(9),
      };
    }));
  }

  /** 送り状No.・備考の欄に値を入れる（利用者の入力と同じく input・change の通知が画面のスクリプトに届く） */
  async fillTrackingNo(value: string): Promise<void> {
    await expect(this.送り状Noの欄, "送り状No.の欄").toBeEditable();
    await this.送り状Noの欄.fill(value);
  }

  async fillMemo(value: string): Promise<void> {
    await expect(this.備考の欄, "備考の欄").toBeEditable();
    await this.備考の欄.fill(value);
  }

  /** 「登録」を押す。押せなければ止める。送信の応答と、移った画面の読み込みを待ち、応答の状態を返す */
  async pressRegister(id: string): Promise<number> {
    await expect(this.登録ボタン, "「登録」が押せる").toBeEnabled();
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === pathOf(instructionDetailUrl(id)));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return (await response).status();
  }

  /** 備考の欄が編集できるか（無効・読み取り専用でない） */
  async memoEditable(): Promise<{ 無効: boolean; 読み取り専用: boolean; 編集できる: boolean }> {
    const disabled = await this.備考の欄.isDisabled();
    const readonly = (await this.備考の欄.getAttribute("readonly")) !== null;
    return { 無効: disabled, 読み取り専用: readonly, 編集できる: await this.備考の欄.isEditable() };
  }
}

/** 在庫移動指示検索の結果から移動指示IDのリンクで詳細画面を開き、備考を入れて「登録」する（シードの「備考に…を入れて登録ボタンを押す」） */
export async function saveMemoFromSearch(page: Page, search: MoveInstructionSearchPage, id: string, memo: string, what: string): Promise<void> {
  await search.pressInstructionId(id);
  const detail = new InstructionDetailPage(page);
  await detail.ready();
  if (pathOf(page.url()) !== pathOf(instructionDetailUrl(id))) throw new Error(`${what}: 移動指示IDを押しても詳細画面へ移らない（${page.url()}）`);
  await detail.fillMemo(memo);
  await detail.pressRegister(id);
  await expectSaved(page, what);
  await expect(detail.備考の欄, `${what}: 保存のあとの備考`).toHaveValue(memo);
}

// ---------------------------------------------------------------- 移動入庫承認申請・入庫承認

/** 移動入庫承認申請画面で、承認通知先のメンバーを名前で選び「承認申請」→ 確認の「承認申請」。入庫承認画面へ移ること */
export async function requestInboundApproval(page: Page, 在庫移動ID: string, 承認者名: string, what: string): Promise<void> {
  if (!new RegExp(`/product/stock/move/inbound_approval_request/${在庫移動ID}$`).test(pathOf(page.url()))) {
    throw new Error(`${what}: 移動入庫承認申請画面ではない（${page.url()}）。在庫移動のステータスが移動中でない`);
  }
  await page.waitForLoadState("load");
  const members = page.locator("#admin_stock_move_inbound_approval_request_approval_notification_target_members");
  const options = await members.locator("option").evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() ?? "" })));
  const hit = options.filter((o) => o.value && o.label === 承認者名);
  if (hit.length !== 1) throw new Error(`${what}: 承認通知先のメンバーに「${承認者名}」が${hit.length}件（選択肢: ${options.map((o) => o.label).filter(Boolean).join("、")}）`);
  await members.selectOption([hit[0].value]);
  const chosen = await members.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, `${what}: 承認通知先に選んだメンバー`).toEqual([承認者名]);
  await page.locator("#stock_move_inbound_approval_request_submit_btn").click();
  const modal = page.locator("#stockMoveInboundConfirmModal");
  await expect(modal, `${what}: 承認申請の確認`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
  await expectSaved(page, what);
  if (!new RegExp(`/product/stock/move/inbound_approval/${在庫移動ID}$`).test(pathOf(page.url()))) {
    throw new Error(`${what}: 承認申請のあと、入庫承認画面へ移らない（${page.url()}）`);
  }
}

/** 入庫承認画面で「承認」→ 確認の「承認する」（承認者のセッションで） */
export async function approveInbound(page: Page, 在庫移動ID: string, what: string): Promise<void> {
  if (!new RegExp(`/product/stock/move/inbound_approval/${在庫移動ID}$`).test(pathOf(page.url()))) {
    throw new Error(`${what}: 入庫承認画面ではない（${page.url()}）。在庫移動のステータスが入庫承認待ちでない`);
  }
  await pressApprove(page, "inbound_approval_approve_btn");
  await expectSaved(page, what);
}
