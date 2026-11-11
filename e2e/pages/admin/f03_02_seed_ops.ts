/**
 * F03-02 商品詳細（フロント）のシードで使う、管理画面の操作。セレクタはここだけに書く。
 * - カード詳細(登録)画面でカードを登録する（パワー・タフネス・忠誠度・ルールテキスト・リーガリティ）
 * - カード商品CSV登録（雛形を画面から取り、1行のCSVを組んでアップロードし、確認モーダルで確定する）
 * - 商品マスターで商品名から商品IDを読む（既定の絞り込みを外す）
 * - 商品規格の価格・買取価格・高額商品コードの登録、削除、新規登録
 * - 在庫編集（入庫）と、登録者とは別の管理者による在庫編集承認一覧の一括承認
 * - 商品登録編集画面の商品カテゴリ・販売制限・割引率
 * - 最上位カテゴリの登録、デッキ登録で使うアーキタイプの用意
 * 画面の作りはアプリのテンプレートで確かめた。期待値はここに書かない。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 在庫承認の最大ID } from "../../db/f03_08";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl, withAdminSession } from "../../lib/session";
import { CategoryPage } from "./category";
import { chooseByLabel, expectSaved } from "./common";
import { ensureStockAdmin, STOCK_ADMIN } from "./f03_08_masters";
import { searchStockByCode, stockInRow } from "./m04_02_rc_stock";
import { CsvUploadPage } from "./m03_26_card_csv_upload";
import { downloadedBytes } from "./m03_21_shelf_number";
import { classRowsFromProductEdit, 商品規格の行 } from "./m03_23_seed_products";
import { ProductSearchPage } from "./product_search";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "./stock_edit";

export type Issue = (m: string) => void;

const firstOption = async (page: Page, selector: string, what: string): Promise<{ value: string; label: string }> => {
  const opt = await page.locator(`${selector} option`).evaluateAll((ns) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
  if (!opt) throw new Error(`${what}に選べる値が無い`);
  return opt;
};

// ---------------------------------------------------------------------------
// カード登録
// ---------------------------------------------------------------------------

export type カードの定義 = {
  カード名: string;
  /** ルールテキスト(日) */
  ルールテキスト?: string;
  パワー?: string; タフネス?: string; 忠誠度?: string;
  /** リーガリティ「使用可」で足すフォーマットの名前（並び順どおり） */
  フォーマット?: string[];
  /** 詳細情報のコレクターNo（商品コードの重なりを避けるため、実行ごとに違う値） */
  コレクターNo: string;
  /** 詳細情報の Foil の選択肢の表示名（省略すると「なし」。Foil ありは「通常」） */
  Foil?: string;
};

/**
 * カード詳細(登録)画面で、カード名(日)・(英)・点数で見たマナ・コストと、指定の項目を入れ、「詳細情報を追加」で詳細情報を1件足して「登録」を押す。
 * 詳細情報のレアリティ・レイアウト・プロモ種別は選択肢の先頭、Foil は「なし」、フレームは「通常」を選ぶ（正本: 試験環境にある値）。
 * パワー・タフネスは、カードの欄と詳細情報の欄の両方に入れる（商品詳細は詳細情報の値を出す）。忠誠度はカードの欄だけにある。
 * 登録後の編集画面のアドレスのカードIDと、詳細情報の見出しのカード詳細IDを返す。
 */
export async function カードを登録する(page: Page, v: カードの定義, what: string, issue: Issue): Promise<{ カードID: string; カード詳細ID: string }> {
  await page.goto(adminUrl("/card/new"));
  // 「詳細情報を追加」「リーガリティ追加」は画面のスクリプトが動かすので、読み込みを待ってから押す
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(登録)画面`).toBeVisible();
  const card = (id: string) => form.locator(`#admin_card_${id}`);
  await card("nameJp").fill(v.カード名);
  await card("nameEn").fill(v.カード名);
  await card("cmc").fill("1");
  if (v.ルールテキスト !== undefined) await card("textJp").fill(v.ルールテキスト);
  if (v.パワー !== undefined) await card("power").fill(v.パワー);
  if (v.タフネス !== undefined) await card("toughness").fill(v.タフネス);
  if (v.忠誠度 !== undefined) await card("loyalty").fill(v.忠誠度);
  for (const fmt of v.フォーマット ?? []) {
    const rows = page.locator("#card-formats-container .removable-item");
    const before = await rows.count();
    await page.locator("#add-format").click();
    await expect(rows, `${what}: 「リーガリティ追加」で行が増える`).toHaveCount(before + 1);
    const row = rows.last();
    await row.locator('select[name$="[format]"]').selectOption({ label: fmt });
    await row.locator("label").filter({ hasText: /^\s*使用可\s*$/ }).click();
  }
  const details = page.locator("#card-details-container .detail-card");
  const before = await details.count();
  await page.locator("#add-detail").click();
  await expect(details, `${what}: 「詳細情報を追加」で詳細情報の欄が増える`).toHaveCount(before + 1);
  const det = details.last();
  const text = (f: string) => det.locator(`[name$="[${f}]"]:not(select)`).first();
  await text("cardNo").fill(v.コレクターNo);
  if (v.ルールテキスト !== undefined) await text("textJp").fill(v.ルールテキスト);
  if (v.パワー !== undefined) await text("power").fill(v.パワー);
  if (v.タフネス !== undefined) await text("toughness").fill(v.タフネス);
  const chosen: string[] = [];
  for (const [f, 項目] of [["rarity", "レアリティ"], ["cardLayout", "レイアウト"], ["promotion", "プロモ種別"]] as const) {
    const sel = det.locator(`select[name$="[${f}]"]`);
    const first = await sel.locator("option").evaluateAll((ns) => ns
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (!first) throw new Error(`${what}: 詳細情報の${項目}に選べる値が無い`);
    await sel.selectOption(first.value);
    chosen.push(`${項目}「${first.label}」`);
  }
  await det.locator('select[name$="[foilFlg]"]').selectOption({ label: v.Foil ?? "なし" });
  await det.locator('select[name$="[frameFlg]"]').selectOption({ label: "通常" });
  issue(`${what}: 詳細情報の ${chosen.join("・")}・Foil「${v.Foil ?? "なし"}」・フレーム「通常」を選んだ（正本: 試験環境にある値）。コレクターNoは ${v.コレクターNo}`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue(`${what}: 警告「${w}」`);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: カードを登録したあと、カードの編集画面へ移らない（${page.url()}）`);
  const headers = (await page.locator("#card-details-container .detail-card .detail-header strong").allInnerTexts()).map((t) => t.trim());
  const ids = headers.map((t) => /カード詳細ID:\s*(\d+)/.exec(t)?.[1]).filter((x): x is string => !!x);
  if (ids.length !== 1) throw new Error(`${what}: カード詳細IDを1つに決められない（見出し: ${headers.join(" / ")}）`);
  return { カードID: m[1], カード詳細ID: ids[0] };
}

// ---------------------------------------------------------------------------
// 試験環境にある値（言語・割引率・購入グループ・グッズのカテゴリ）
// ---------------------------------------------------------------------------

/** 商品マスター(検索入力)の言語の選択肢（表示名 → 言語ID） */
export async function 言語IDの一覧(page: Page): Promise<Map<string, string>> {
  await page.goto(adminUrl("/product"));
  const choices = await page.locator('input[name^="admin_search_product[language]"]').evaluateAll((inputs) => inputs.map((node) => {
    const input = node as HTMLInputElement;
    return { id: input.value, label: input.labels?.item(0)?.textContent?.trim() ?? "" };
  }));
  return new Map(choices.filter((c) => /^\d+$/.test(c.id)).map((c) => [c.label, c.id]));
}

/**
 * 割引率の選択肢の先頭（値＝割引率ID と表示名）。商品登録編集画面の割引率の欄から読む（保存はしない）。
 * 画面を開くために、商品マスターの検索結果の先頭の商品を使う。
 */
export async function 割引率の先頭(page: Page): Promise<{ value: string; label: string }> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.submitAndWaitForResult();
  const first = page.locator('tr[id^="ex-product-"]').first();
  await expect(first, "商品マスター(検索結果)に商品が1件以上ある").toHaveCount(1);
  const id = ((await first.getAttribute("id")) ?? "").replace("ex-product-", "");
  await page.goto(adminUrl(`/product/product/${id}/edit`));
  await page.waitForLoadState("load");
  return firstOption(page, 'form#form1 select[name="admin_product[Discount]"]', "割引率");
}

// ---------------------------------------------------------------------------
// カード商品CSV登録
// ---------------------------------------------------------------------------

export type カード商品CSVの行 = {
  言語ID: string;
  商品公開ステータス: "公開" | "非公開";
  支店の商品公開ステータス: "公開" | "非公開";
  商品名: string;
  商品カテゴリID: string;
  購入グループ名称: string;
  割引率ID: string;
  基準価格: string; 販売価格: string; 買取価格: string;
  カード詳細ID: string;
  /** 0=日本語英語両サイト・1=日本語サイト・2=英語サイト */
  地域別販売制限: "0" | "1" | "2";
};

/** CSVの形式の表の説明（「1:公開 2:非公開 3:廃止」など）から、表示名に当たる値を読む */
function 説明の値(rows: { 項目名: string; 説明: string }[], 項目名: string, 表示名: string): string {
  const desc = rows.find((r) => r.項目名 === 項目名)?.説明 ?? "";
  const hit = [...desc.matchAll(/(\d+)\s*:\s*([^\d\s:]+)/g)].filter((m) => m[2].trim() === 表示名);
  if (hit.length !== 1) throw new Error(`カード商品CSVの「${項目名}」の説明から「${表示名}」の値を一意に読めない（${desc}）`);
  return hit[0][1];
}

const csvCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * カード商品CSVアップロード画面で雛形を取り、見出しの列順で1行を組み、取込ファイルに選んで「CSVファイルをアップロード」を押し、
 * 確認モーダルの「確定」で取り込む。サイズ・重量は1（試験環境にある値）。完了の表示を確かめる。
 */
export async function カード商品CSVを登録する(page: Page, row: カード商品CSVの行, fileName: string, what: string, issue: Issue): Promise<void> {
  const upload = new CsvUploadPage(page, "カード商品");
  await upload.open();
  const format = await upload.formatRows();
  const headers = parseCsv(decodeCsvBytes(await downloadedBytes(await upload.downloadTemplate())))[0];
  if (!headers?.length) throw new Error(`${what}: カード商品CSVの雛形の見出しを読めない`);
  const values: Record<string, string> = {
    "商品ID": "", "言語(ID)": row.言語ID,
    "商品公開ステータス": 説明の値(format, "商品公開ステータス", row.商品公開ステータス),
    "支店の商品公開ステータス": 説明の値(format, "支店の商品公開ステータス", row.支店の商品公開ステータス),
    "商品名(日)": row.商品名, "商品名(英)": row.商品名, "サイズ": "1", "重量": "1",
    "商品カテゴリ(ID)": row.商品カテゴリID, "購入グループ名称": row.購入グループ名称, "割引率(ID)": row.割引率ID,
    "基準価格": row.基準価格, "販売価格": row.販売価格, "買取価格": row.買取価格,
    "カード詳細(ID)": row.カード詳細ID, "地域別販売制限": row.地域別販売制限,
  };
  for (const k of Object.keys(values)) if (!headers.includes(k)) throw new Error(`${what}: カード商品CSVの雛形に「${k}」の列が無い`);
  const csv = `${headers.map(csvCell).join(",")}\n${headers.map((h) => csvCell(values[h] ?? "")).join(",")}\n`;
  await upload.取込ファイル.setInputFiles({ name: fileName, mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
  const r = await upload.pressUpload();
  if (r !== null) throw new Error(`${what}: 取込ファイルを選んだのに、ブラウザの入力チェックで止まった（${JSON.stringify(r)}）`);
  const done = await upload.confirm(180_000);
  if (!done.sent || done.status >= 400) throw new Error(`${what}: カード商品CSVの取込の応答が ${JSON.stringify(done)}`);
  for (const w of await expectSaved(page, `${what}: カード商品CSVの取込`)) issue(`${what}: 警告「${w}」`);
}

// ---------------------------------------------------------------------------
// 商品マスターで商品名から商品IDを読む
// ---------------------------------------------------------------------------

/**
 * 商品マスター(検索入力)で既定の絞り込み（公開状態・状態・高額商品）を外し、商品名を入れて検索し、
 * 商品名の欄がその商品名（高額商品コードが続くことがある）の行の商品IDを返す。ちょうど1件でなければ落とす。
 */
export async function 商品名で商品IDを読む(page: Page, 商品名: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
  await search.field("product_name").fill(商品名);
  await search.submitAndWaitForResult();
  const ids: string[] = [];
  for (const row of await page.locator('tr[id^="ex-product-"]').all()) {
    const name = ((await row.locator("td:nth-child(3)").textContent()) ?? "").replace(/\s+/g, " ").trim();
    if (name !== 商品名 && !name.startsWith(`${商品名} `)) continue;
    ids.push(((await row.locator("td:nth-child(2)").textContent()) ?? "").trim());
  }
  if (ids.length !== 1 || !/^\d+$/.test(ids[0])) throw new Error(`商品マスター(検索結果)に、商品名「${商品名}」の行が ${ids.length} 件ある（1件のはず）`);
  return ids[0];
}

// ---------------------------------------------------------------------------
// 商品規格
// ---------------------------------------------------------------------------

export type 規格 = { 商品規格ID: string; 言語: string; 状態: string; 商品コード: string };

const LANG_NAME: Record<string, string> = { JP: "日本語", EN: "英語", FR: "フランス語" };
const COND_NAME: Record<string, string> = { NM: "ニアミント", SP: "スライトリープレイド", MP: "モデレトリープレイド", HP: "ヘビープレイド", OT: "その他" };

/** 商品規格一覧の行の言語・状態の表示が、言語コード（JP など）・状態コード（NM など）に当たるか */
export function 行が当たる(r: 商品規格の行, 言語: string, 状態: string): boolean {
  const lang = r.言語 === 言語 || r.言語 === LANG_NAME[言語];
  const cond = r.状態 === 状態 || r.状態 === COND_NAME[状態];
  return lang && cond;
}

/** 商品規格一覧（商品登録編集画面の「規格設定」から開く）の行を読む */
export async function 規格の一覧(page: Page, productId: string): Promise<規格[]> {
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  return (await classRowsFromProductEdit(page, productId)).map((r) => ({ 商品規格ID: r.商品規格ID, 言語: r.言語, 状態: r.状態, 商品コード: r.商品コード }));
}

/** スマレジ連携フラグが「連携しない」であること（保存すると外部のスマレジへ送られる設定にしない） */
async function スマレジ連携しない(page: Page, what: string): Promise<void> {
  const checked = page.locator('form#form input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await checked.count()) === 1 && (await checked.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
}

/** 部門が未選択なら、選択肢の先頭を選ぶ（正本: 試験環境にある値） */
async function 部門を選ぶ(page: Page, what: string, issue: Issue): Promise<void> {
  const section = page.locator("form#form #admin_product_class_Section");
  if (await section.inputValue()) return;
  const first = await firstOption(page, "form#form #admin_product_class_Section", `${what}: 部門`);
  await section.selectOption(first.value);
  issue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ（正本: 試験環境にある値）`);
}

async function 商品規格を登録を押す(page: Page, what: string, issue: Issue): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
}

export type 規格の値 = { 基準価格?: string; 販売価格?: string; 買取価格?: string; 高額商品コード?: string };

/** 商品規格登録編集画面を開き、価格・買取価格・高額商品コードを入れて「商品規格を登録」を押す。入れた値が保存されたことを確かめる */
export async function 規格を登録する(page: Page, productId: string, classId: string, v: 規格の値, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${productId}/edit/${classId}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  if (v.基準価格 !== undefined) await form.locator("#admin_product_class_standard_price").fill(v.基準価格);
  if (v.販売価格 !== undefined) await form.locator("#admin_product_class_price02").fill(v.販売価格);
  if (v.買取価格 !== undefined) await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  if (v.高額商品コード !== undefined) await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  await 部門を選ぶ(page, what, issue);
  await スマレジ連携しない(page, what);
  await 商品規格を登録を押す(page, what, issue);
  const num = async (id: string) => (await form.locator(id).inputValue()).replace(/,/g, "");
  if (v.基準価格 !== undefined) expect(await num("#admin_product_class_standard_price"), `${what}: 登録後の基準価格`).toBe(v.基準価格);
  if (v.買取価格 !== undefined) expect(await num("#admin_product_class_buy_price"), `${what}: 登録後の買取価格`).toBe(v.買取価格);
  if (v.高額商品コード !== undefined) await expect(form.locator("#admin_product_class_high_price_code"), `${what}: 登録後の高額商品コード`).toHaveValue(v.高額商品コード);
}

/** 商品規格登録編集画面を開き、「商品規格を削除」を押して確認で削除する */
export async function 規格を削除する(page: Page, productId: string, classId: string, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${productId}/edit/${classId}`));
  // 画面のスクリプトの読み込み前に削除を確定すると、削除の要求にならない（M03-01 の009で起きた）
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "商品規格を削除" }).click();
  const modal = page.locator("#deleteConfirmModal");
  await expect(modal, `${what}: 削除の確認`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), modal.locator('a[data-method="delete"]').click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の削除`)) issue(`${what}: 警告「${w}」`);
}

export type 新しい規格 = { 言語: string; 状態: string; 商品コード: string; 基準価格: string; 買取価格: string; 高額商品コード?: string };

/**
 * 商品規格一覧の「新規作成」で、言語・状態・商品コード・基準価格（販売価格も同じ値）・買取価格を入れ、部門は選択肢の先頭、
 * 公開ステータスは公開にして「商品規格を登録」を押す。登録後の画面の商品規格IDを返す。
 */
export async function 規格を足す(page: Page, productId: string, v: 新しい規格, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl(`/product/product/class/${productId}/new`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面（新規）`).toBeVisible();
  await chooseByLabel(form.locator("#admin_product_class_Language"), LANG_NAME[v.言語] ?? v.言語);
  await chooseByLabel(form.locator("#admin_product_class_CardCondition"), COND_NAME[v.状態] ?? v.状態);
  await form.locator("#admin_product_class_code").fill(v.商品コード);
  await form.locator("#admin_product_class_standard_price").fill(v.基準価格);
  await form.locator("#admin_product_class_price02").fill(v.基準価格);
  await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  if (v.高額商品コード !== undefined) await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  if (!(await form.locator("#admin_product_class_sale_type").inputValue())) throw new Error(`${what}: 販売種別が未選択（正本に指定が無く補えない）`);
  await 部門を選ぶ(page, what, issue);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await スマレジ連携しない(page, what);
  await 商品規格を登録を押す(page, what, issue);
  await expect(page, `${what}: 登録後は商品規格登録編集画面`).toHaveURL(new RegExp(`/product/product/class/${productId}/edit/\\d+$`));
  const m = /\/edit\/(\d+)$/.exec(new URL(page.url()).pathname);
  if (!m) throw new Error(`${what}: 登録した商品規格のIDを読めない`);
  return m[1];
}

// ---------------------------------------------------------------------------
// 在庫（入庫と、登録者とは別の管理者の承認）
// ---------------------------------------------------------------------------

/**
 * 在庫検索一覧から商品規格の在庫編集を開き、在庫変動区分「入庫/その他」・在庫変動理由「結合試験」・在庫増減数・仕入単価0・承認通知先を入れて登録する
 * （登録者は在庫を入れる管理者）。そのあと承認する管理者（全権限の管理者）が在庫編集承認一覧で該当の行を選んで「一括承認」を押す。
 * 承認後の本店のEC-CUBE在庫が、指定の数になったことを確かめる。
 */
export async function 入庫して承認する(browser: Browser, items: { 商品コード: string; 数: number }[], what: string, issue: Issue): Promise<void> {
  if (items.length === 0) return;
  const approverName = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureStockAdmin(page);
    return loggedInMemberName(page);
  });
  const shop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById("1"));
  const baseline = 在庫承認の最大ID();
  const registeredBy = await withAdminSession(browser, STOCK_ADMIN, async (page) => {
    const registrant = await loggedInMemberName(page);
    if (registrant === approverName) throw new Error(`${what}: 在庫の登録者と承認者が同じ管理者になっている`);
    const stock = new StockListPage(page);
    for (const it of items) {
      await stock.searchByProductCode(it.商品コード);
      await stock.openEdit(stock.row(it.商品コード, shop, "EC-CUBE"));
      await registerStockEdit(page, {
        changeType: "入庫/その他", reason: "結合試験", quantity: String(it.数), purchasePrice: "0", approverName,
      }, `${what}: ${it.商品コード} の在庫編集（${it.数}）`, issue);
    }
    return registrant;
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registeredBy && r.shop.startsWith(shop)
      && r.changeType.endsWith("入庫/その他") && Number(r.id) > baseline);
    if (rows.length !== items.length) throw new Error(`${what}: 在庫編集の未承認の行が ${rows.length} 件（${items.length} 件のはず）`);
    await list.approve(rows.map((r) => r.id), `${what}: 在庫編集の一括承認（${items.length}件）`, issue);
    for (const it of items) {
      const after = await searchStockByCode(page, { 商品コード: it.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      const n = await stockInRow(after.row(it.商品コード, shop, "EC-CUBE"));
      if (n !== it.数) throw new Error(`${what}: ${it.商品コード} の在庫が ${n}（${it.数} のはず）`);
    }
  });
}

// ---------------------------------------------------------------------------
// 商品登録編集（商品カテゴリ・販売制限・割引率）
// ---------------------------------------------------------------------------

/**
 * 商品登録編集画面を開き、割引率が未選択なら選択肢の先頭を選び（正本: 販売割引率に登録済みのもの）、
 * 商品カテゴリを指定のカテゴリだけにし、販売制限を指定の表示名にして「商品を登録」を押す。
 */
export async function 商品を登録する(page: Page, productId: string, v: { カテゴリID?: string; 販売制限?: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集画面`).toBeVisible();
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await firstOption(page, 'form#form1 select[name="admin_product[Discount]"]', `${what}: 割引率`);
    await discount.selectOption(first.value);
    issue(`${what}: 割引率は販売割引率に登録済みのもの（選択肢の先頭の「${first.label}」）を選んだ`);
  }
  if (v.カテゴリID !== undefined) {
    const boxes = form.locator('input[type="checkbox"][name="admin_product[Category][]"]');
    for (const id of await boxes.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value))) {
      if (id !== v.カテゴリID) await form.locator(`#admin_product_category_${id}`).setChecked(false);
    }
    await form.locator(`#admin_product_category_${v.カテゴリID}`).setChecked(true);
    const after = await boxes.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value));
    if (after.join(",") !== v.カテゴリID) throw new Error(`${what}: 商品カテゴリをカテゴリID ${v.カテゴリID} だけにできない（${after.join("、")}）`);
  }
  if (v.販売制限 !== undefined) {
    const radio = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
    const labels = await radio.evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()));
    const i = labels.indexOf(v.販売制限);
    if (i < 0) throw new Error(`${what}: 販売制限に「${v.販売制限}」が無い（${labels.join("、")}）`);
    await radio.nth(i).check();
  }
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), `${what}: 販売制限が選ばれている`).toHaveCount(1);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品ID ${productId} の「商品を登録」`)) issue(`${what}: 警告「${w}」`);
}

// ---------------------------------------------------------------------------
// カテゴリ・アーキタイプ
// ---------------------------------------------------------------------------

/** 最上位のカテゴリ登録/編集画面でカテゴリ名(日)・(英)を入れて登録し、一覧で増えた行のカテゴリIDを返す */
export async function 最上位のカテゴリを登録する(page: Page, 名: string, what: string, issue: Issue): Promise<string> {
  const category = new CategoryPage(page);
  await category.openTop();
  const before = (await category.rowValues()).filter((r) => r.nameJp === 名).map((r) => r.id);
  await category.fill({ nameJp: 名, nameEn: 名 });
  await category.submitAndWait();
  for (const w of await expectSaved(page, `${what}: カテゴリ「${名}」の登録`)) issue(`${what}: 警告「${w}」`);
  await category.openTop();
  const added = (await category.rowValues()).filter((r) => r.nameJp === 名 && !before.includes(r.id));
  if (added.length !== 1) throw new Error(`${what}: カテゴリ「${名}」の登録で増えた最上位の行が ${added.length} 件`);
  return added[0].id;
}

/** その親の下に子カテゴリを登録し、カテゴリIDを返す */
export async function 子カテゴリを登録する(page: Page, 親ID: string, 名: string, what: string, issue: Issue): Promise<string> {
  return new CategoryPage(page).createChild(親ID, { nameJp: 名, nameEn: 名 }, (w) => issue(`${what}: ${w}`));
}

/**
 * デッキ編集の新規登録画面でフォーマットを選んだときのアーキタイプの選択肢の先頭（正本: 試験環境にある値）。
 * 選択肢が無ければ、アーキタイプ登録画面でこの試験用のアーキタイプを1件登録する（次からはそれを使う）。表示名を返す。
 */
export async function アーキタイプを用意する(page: Page, フォーマット: string, what: string, issue: Issue): Promise<string> {
  const read = async (): Promise<string | null> => {
    await page.goto(adminUrl("/deck/new"));
    await page.waitForLoadState("load");
    await chooseByLabel(page.locator('[name="admin_deck[Format]"]'), フォーマット);
    const opts = await page.locator('[name="admin_deck[Archetype]"] option').evaluateAll((os) => os
      .map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })).filter((o) => o.v));
    return opts[0]?.t ?? null;
  };
  const found = await read();
  if (found) { issue(`${what}: アーキタイプは、フォーマット「${フォーマット}」の選択肢の先頭の「${found}」を選んだ`); return found; }
  const name = "F0302試験アーキタイプ";
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(name);
  await f("nameEn").fill("F0302 Test Archetype");
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), フォーマット);
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `${what}: アーキタイプ「${name}」の登録`)) issue(`${what}: 警告「${w}」`);
  issue(`${what}: フォーマット「${フォーマット}」のアーキタイプが試験環境に無かったので、アーキタイプ「${name}」を登録した（デッキの登録に必須）`);
  const again = await read();
  if (!again) throw new Error(`${what}: アーキタイプを登録したのに、デッキ登録の選択肢に出ない`);
  return again;
}
