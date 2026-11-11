/**
 * M04-22 在庫移動・振替CSV登録モーダルの入力と、登録のあとの画面の読み取り。セレクタはここにだけ書く。
 * 一覧を開く・ボタンを押す・モーダルを見つける部品は m04_22_move_transfer_csv.ts にある。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 在庫移動CSV登録モーダル: 出庫元店舗・入庫先店舗（選択欄）、出庫元在庫区分・入庫先在庫区分（EC-CUBE／スマレジのラジオ。はじめは未選択）、
 *   ファイルを選択（隠れたファイルの欄を、見えているボタンが開く）、登録のボタン。
 * - 在庫振替CSV登録モーダル: 店舗（選択欄）、在庫区分（ラジオ）、承認通知先の所属（選択欄）とメンバー（複数選択。select2 の付いた欄）、
 *   ファイルを選択、登録のボタン。店舗を選ぶと、画面のスクリプトが、その店舗に所属する承認権限のあるメンバーだけを選択肢にし、
 *   所属の選択肢もそのメンバーの所属から作り直す。所属を選ぶと、その所属のメンバーだけに絞り、選んでいたメンバーは選択のまま残す。
 * - 登録に成功すると、移動は出庫の承認申請の画面、振替は在庫振替の画面へ移る。誤りのときは在庫移動・振替検索一覧へ戻り、上部に赤い帯が出る。
 * - 閉じる（またはページの再読み込み）と、モーダルの入力は初期状態に戻り、ファイル名の表示は「選択されていません」になる。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { CsvModalKind, MODAL_ID, openMoveTransferList, pressCsvRegisterButton } from "./m04_22_move_transfer_csv";

export type Zone = "EC-CUBE" | "スマレジ";
const ZONE_VALUE: Record<Zone, string> = { "EC-CUBE": "1", "スマレジ": "2" };
/** ファイルを選んでいないときの表示 */
export const FILE_EMPTY_TEXT = "選択されていません";
export const MOVE_TRANSFER_LIST_PATH = "/product/stock/move_transfer";

const exactText = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

// ---- 登録のあとの画面 ----

/** 画面上部の誤り（赤い帯）のメッセージ。開発環境のデバッグモードの帯は数えない */
export async function errorAlerts(page: Page): Promise<string[]> {
  const texts = await page.locator(".alert-danger").allInnerTexts();
  return [...new Set(texts.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効")))];
}

/** 画面上部のメッセージ（成功・誤り・注意。デバッグモードの帯を除く） */
export async function pageMessages(page: Page): Promise<string[]> {
  const texts = await page.locator(".alert").allInnerTexts();
  return [...new Set(texts.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効")))];
}

/** いまの画面が在庫移動・振替検索一覧か（アドレスと、検索欄の数で見る） */
export async function onMoveTransferList(page: Page): Promise<{ アドレス: string; 検索欄: number }> {
  return {
    アドレス: new URL(page.url()).pathname.replace(/^\/[^/]+/, ""),
    検索欄: await page.locator("form#form_search_stock_move_transfer").count(),
  };
}

/** いまのアドレスの、管理画面の入口を除いたパスの前半と、末尾の番号 */
export function pathAndTailId(page: Page): { パス: string; 番号: string } {
  const path = new URL(page.url()).pathname.replace(/^\/[^/]+/, "");
  const m = /(\d+)\/?$/.exec(path);
  return { パス: path.replace(/\d+\/?$/, ""), 番号: m ? m[1] : "" };
}

// ---- CSV登録モーダル（在庫移動・在庫振替） ----

type ModalDef = { form: string; prefix: string; fileButton: string; fileName: string; submit: string };
const DEF: Record<CsvModalKind, ModalDef> = {
  在庫移動CSV登録: { form: "#stockMoveCsvRegisterForm", prefix: "stock_move_csv_import", fileButton: "#stockMoveCsvModalFileSelectBtn", fileName: "#stockMoveCsvModalFileName", submit: "#stockMoveCsvModalSubmitBtn" },
  在庫振替CSV登録: { form: "#stockTransferCsvRegisterForm", prefix: "stock_transfer_csv_import", fileButton: "#stockTransferCsvModalFileSelectBtn", fileName: "#stockTransferCsvModalFileName", submit: "#stockTransferCsvModalSubmitBtn" },
};

/** 在庫移動CSV登録モーダル・在庫振替CSV登録モーダルの操作 */
export class CsvRegisterModal {
  readonly modal: Locator;
  readonly form: Locator;
  private readonly def: ModalDef;

  constructor(readonly page: Page, readonly kind: CsvModalKind) {
    this.def = DEF[kind];
    this.modal = page.locator(MODAL_ID[kind]);
    this.form = page.locator(this.def.form);
  }

  private field(name: string): Locator {
    return this.page.locator(`#${this.def.prefix}_${name}`);
  }
  private radios(name: string): Locator {
    return this.form.locator(`input[name="${this.def.prefix}[${name}]"]`);
  }

  /** 在庫移動・振替検索一覧を開いてボタンを押し、モーダルが開くのを待つ */
  async open(): Promise<void> {
    await openMoveTransferList(this.page);
    await this.openOnList();
  }

  /** いま開いている在庫移動・振替検索一覧で、ボタンを押してモーダルを開く */
  async openOnList(): Promise<void> {
    await pressCsvRegisterButton(this.page, this.kind);
    await expect(this.modal, `${this.kind}モーダル`).toBeVisible();
    await expect(this.form, `${this.kind}モーダルの入力欄`).toBeVisible();
  }

  get 出庫元店舗(): Locator { return this.field("move_from_base_info"); }
  get 入庫先店舗(): Locator { return this.field("move_to_base_info"); }
  get 出庫元在庫区分(): Locator { return this.radios("move_from_stock_location_id"); }
  get 入庫先在庫区分(): Locator { return this.radios("move_to_stock_location_id"); }
  get 振替店舗(): Locator { return this.field("transfer_base_info"); }
  get 振替在庫区分(): Locator { return this.radios("transfer_stock_location_id"); }
  get 所属(): Locator { return this.field("approval_department"); }
  get メンバー(): Locator { return this.field("approval_notification_target_members"); }
  get ファイル名の表示(): Locator { return this.page.locator(this.def.fileName); }

  private async chooseStoreIn(select: Locator, name: string): Promise<void> {
    const option = select.locator("option").filter({ hasText: exactText(name) });
    await expect(option, `店舗の選択肢「${name}」は1つ`).toHaveCount(1);
    await select.selectOption((await option.getAttribute("value")) ?? "");
  }
  private async chooseZoneIn(radios: Locator, zone: Zone): Promise<void> {
    const radio = radios.and(this.page.locator(`[value="${ZONE_VALUE[zone]}"]`));
    await expect(radio, `在庫区分「${zone}」の選択肢は1つ`).toHaveCount(1);
    await radio.check();
  }

  async chooseMoveFrom(store: string, zone: Zone): Promise<void> {
    await this.chooseStoreIn(this.出庫元店舗, store);
    await this.chooseZoneIn(this.出庫元在庫区分, zone);
  }
  async chooseMoveTo(store: string, zone: Zone): Promise<void> {
    await this.chooseStoreIn(this.入庫先店舗, store);
    await this.chooseZoneIn(this.入庫先在庫区分, zone);
  }
  /** 在庫振替の店舗を選ぶ（画面のスクリプトが、その店舗の承認通知先の所属・メンバーの選択肢に入れ替える） */
  async chooseTransferStore(store: string): Promise<void> {
    await this.chooseStoreIn(this.振替店舗, store);
    await this.page.waitForTimeout(300);
  }
  async chooseTransferZone(zone: Zone): Promise<void> {
    await this.chooseZoneIn(this.振替在庫区分, zone);
  }

  /** 承認通知先（所属選択）の選択肢の表示名（「指定なし」を除く。並びは画面のまま） */
  async departmentChoices(): Promise<string[]> {
    return this.所属.locator("option").evaluateAll((os) => os
      .filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }
  async chooseDepartment(name: string): Promise<void> {
    await chooseByLabel(this.所属, name);
    await this.page.waitForTimeout(300);
  }
  /** 承認通知先（メンバー選択）の選択肢（並びは画面のまま） */
  async memberChoices(): Promise<{ 名前: string; 選べる: boolean; 選択: boolean }[]> {
    return this.メンバー.locator("option").evaluateAll((os) => os
      .filter((o) => (o as HTMLOptionElement).value !== "")
      .map((o) => ({ 名前: (o.textContent ?? "").trim(), 選べる: !(o as HTMLOptionElement).disabled, 選択: (o as HTMLOptionElement).selected })));
  }
  /** 承認通知先（メンバー選択）で、名前の候補を1つずつ選ぶ（select2 の欄を開いて候補を押す） */
  async chooseMembers(names: string[]): Promise<void> {
    const box = this.メンバー.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
    await expect(box, "承認通知先（メンバー選択）の欄").toBeVisible();
    for (const name of names) {
      await box.locator(".select2-selection").click();
      const option = this.page.locator(".select2-container--open .select2-results__option").filter({ hasText: exactText(name) });
      await expect(option, `承認通知先（メンバー選択）の候補「${name}」は1件`).toHaveCount(1);
      await option.click();
      await this.page.keyboard.press("Escape");
    }
    const chosen = (await this.memberChoices()).filter((o) => o.選択).map((o) => o.名前);
    for (const name of names) expect(chosen, `承認通知先（メンバー選択）に「${name}」を選んだ`).toContain(name);
  }

  /** 「ファイルを選択」を押して、ファイルを選ぶ */
  async chooseFile(filePath: string): Promise<void> {
    const button = this.page.locator(this.def.fileButton);
    await expect(button, "「ファイルを選択」").toBeVisible();
    const [chooser] = await Promise.all([this.page.waitForEvent("filechooser"), button.click()]);
    await chooser.setFiles(filePath);
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
    await expect(this.ファイル名の表示, "選んだファイルの名前の表示").toHaveText(fileName);
  }

  /** 送信のボタン（表示名「登録」） */
  get 登録(): Locator { return this.page.locator(this.def.submit); }

  /** 「登録」を押し、移った先の画面の読み込みを待つ */
  async pressRegister(): Promise<void> {
    await expect(this.登録, `${this.kind}モーダルの「登録」ボタンは1つ`).toHaveCount(1);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 300_000 }),
      this.登録.click(),
    ]);
  }

  /** モーダルの入力の状態（開き直したときに、リセットされているかを見る） */
  async inputState(): Promise<Record<string, string>> {
    const selected = async (select: Locator) => select.evaluate((n) => (n as HTMLSelectElement).value);
    const checked = async (radios: Locator) => radios.evaluateAll((rs) => rs.filter((r) => (r as HTMLInputElement).checked).map((r) => (r as HTMLInputElement).value).join("・"));
    const file = ((await this.ファイル名の表示.textContent()) ?? "").trim();
    if (this.kind === "在庫移動CSV登録") {
      return {
        出庫元店舗: await selected(this.出庫元店舗), 出庫元在庫区分: await checked(this.出庫元在庫区分),
        入庫先店舗: await selected(this.入庫先店舗), 入庫先在庫区分: await checked(this.入庫先在庫区分), ファイル: file,
      };
    }
    const members = (await this.memberChoices()).filter((o) => o.選択).map((o) => o.名前).join("・");
    return { 店舗: await selected(this.振替店舗), 在庫区分: await checked(this.振替在庫区分), 承認通知先所属: await selected(this.所属), 承認通知先メンバー: members, ファイル: file };
  }
}

// ---- メンバーの店舗の付け替え（試験管理者を、試験店舗の編集者にそろえる） ----

/**
 * 登録済みのメンバーの所属店舗・デフォルト検索表示店舗・編集可能店舗を、求める店舗IDにそろえる（そろっていれば何もしない）。
 * 画面（メンバー編集）で付け替えて「登録」を押す。権限・パスワードなどは変えない。付け替えたら true。
 */
export async function syncMemberStores(page: Page, memberId: string, v: { 所属店舗ID: string; デフォルト検索表示店舗ID: string; 編集可能店舗ID: string[] }): Promise<boolean> {
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  const selected = async (selector: string) => (await page.locator(selector).evaluate((n) =>
    Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value))).sort().join("・");
  const open = async () => {
    await page.goto(adminUrl(`/setting/system/member/${memberId}/edit`));
    await page.waitForLoadState("load");
    await expect(f("name"), `メンバー編集画面（管理者ID ${memberId}）`).toBeVisible();
  };
  const current = async () => ({
    所属店舗: await selected('[name="admin_member[baseInfo]"]'),
    既定: await selected('[name="admin_member[defaultSearchBaseInfo]"]'),
    編集可能: await selected('[name="admin_member[editableBaseInfos][]"]'),
  });
  const want = { 所属店舗: v.所属店舗ID, 既定: v.デフォルト検索表示店舗ID, 編集可能: [...v.編集可能店舗ID].sort().join("・") };
  await open();
  const now = await current();
  if (now.所属店舗 === want.所属店舗 && now.既定 === want.既定 && now.編集可能 === want.編集可能) return false;
  await f("baseInfo").selectOption(v.所属店舗ID);
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption(v.編集可能店舗ID);
  await f("defaultSearchBaseInfo").selectOption(v.デフォルト検索表示店舗ID);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "登録", exact: true }).click()]);
  await expectSaved(page, `メンバー（管理者ID ${memberId}）の店舗の付け替え`);
  await open();
  const after = await current();
  if (after.所属店舗 !== want.所属店舗 || after.既定 !== want.既定 || after.編集可能 !== want.編集可能) {
    throw new Error(`メンバー（管理者ID ${memberId}）の店舗を付け替えたが、そろわない（所属店舗 ${after.所属店舗}・既定 ${after.既定}・編集可能 ${after.編集可能}）`);
  }
  return true;
}
