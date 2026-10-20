/**
 * M03-23 のシードで使う、商品まわりの画面操作。
 * - 商品マスター(検索入力)で商品コードを入れて検索し、検索結果の行から商品登録編集画面を開く。
 * - 商品登録編集画面の「規格設定」から商品規格一覧を開き、取り込みで作られた商品規格を、部門は選択肢の先頭、公開ステータスは「公開」にして登録する。
 * - 商品登録編集画面のショップ用メモ欄に入れ、割引率を選んで「商品を登録」する。
 * - カード詳細(登録・編集・削除)画面でカードと、その詳細情報を1件登録する。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { CategoryPage } from "./category";
import { chooseByLabel, expectSaved } from "./common";
import { openClassListFromProductEdit, readLanguageChoicesFromClassForm } from "./m03_01_product_class";
import { ProductSearchPage } from "./product_search";

type Issue = (m: string) => void;

/** 商品マスター(検索結果)の行（商品の行。先頭の商品規格の商品コード・言語・状態を出す） */
const productRows = (page: Page) => page.locator('tr[id^="ex-product-"]');

/** カテゴリ登録/編集画面の最上位の一覧で、「サプライ・グッズ」の行のID欄に表示された値 */
export async function readGoodsRootCategoryId(page: Page): Promise<string> {
  const category = new CategoryPage(page);
  await category.openTop();
  const id = await category.idOf("サプライ・グッズ");
  if (!/^\d+$/.test(id)) throw new Error(`最上位の一覧の「サプライ・グッズ」の行のIDを読めない: ${id}`);
  return id;
}

/**
 * 商品マスター(検索入力)のエキスパンションの選択肢で、名称がちょうど一致するカードセットのID。
 * 共通の部品（カードセットをあれば照合・無ければ登録する処理）の中の、同名のカードセットを探す読み方と同じ。その処理は外から使えないので、ここに置いた。
 * シードがカードセットを登録したのか、前の実行のものを照合して使ったのかを、注記で書き分けるために使う（DB確認の接続先が無いとき）。
 */
export async function 同名のカードセットのID(page: Page, nameJp: string): Promise<string[]> {
  await page.goto(adminUrl("/product"));
  return page.locator("#admin_search_product_cardset option").evaluateAll((options, name) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.textContent?.trim() === name)
    .map((option) => option.value), nameJp);
}

/** 商品マスター(検索入力)の、既定でチェックされている絞り込み（公開状態・状態・高額商品）を外す */
async function clearDefaultFilters(search: ProductSearchPage): Promise<void> {
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
}

/** 検索結果の行のうち、商品コードがちょうど code の行の商品ID */
async function productIdsWithCode(page: Page, code: string): Promise<string[]> {
  const ids: string[] = [];
  for (const row of await productRows(page).all()) {
    const shown = ((await row.locator("td:nth-child(4)").textContent()) ?? "").trim();
    if (shown !== code) continue;
    const id = ((await row.locator("td:nth-child(2)").textContent()) ?? "").trim();
    if (!/^\d+$/.test(id)) throw new Error(`商品コード ${code} の行の商品IDを読めない: ${id}`);
    ids.push(id);
  }
  return ids;
}

/**
 * 前の実行で作った商品が残っているかを見るために、商品マスターを既定の絞り込みを外して商品コードで検索し、
 * 商品コードがちょうど code の商品の商品IDを返す（画面の商品コードの検索は部分一致なので、行の商品コードで絞る）。
 */
export async function productIdsByCode(page: Page, code: string): Promise<string[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await clearDefaultFilters(search);
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  return productIdsWithCode(page, code);
}

/**
 * 正本「商品マスター(検索入力)で商品コードを入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面を開く」。
 * 検索の条件は商品コードのほかは画面の既定のまま。商品コードがちょうど code の行が1件であることを確かめ、商品名のリンクを押す。
 * 開いた商品の商品IDを返す。
 */
export async function openProductEditByCode(page: Page, code: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  const ids = await productIdsWithCode(page, code);
  if (ids.length !== 1) throw new Error(`商品マスター(検索結果)に、商品コード ${code} の行が ${ids.length} 件ある（1件のはず）`);
  const link = page.locator(`tr#ex-product-${ids[0]} td:nth-child(3) a`);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${ids[0]}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `商品コード ${code} の商品登録編集画面`).toBeVisible();
  return ids[0];
}

/** 商品規格一覧の、廃止でない商品規格の行 */
const activeClassRows = (page: Page) => page.locator("#ex-product_class tbody tr");

export type 商品規格の行 = { 商品規格ID: string; 公開状態: string; 言語: string; 状態: string; 商品コード: string };

/** 商品規格一覧の行（上から順） */
async function classRows(page: Page): Promise<商品規格の行[]> {
  const out: 商品規格の行[] = [];
  for (const tr of await activeClassRows(page).all()) {
    const id = ((await tr.getAttribute("id")) ?? "").replace("ex-product_class-", "");
    const cell = async (n: number) => ((await tr.locator(`td:nth-child(${n})`).textContent()) ?? "").replace(/\s+/g, " ").trim();
    out.push({ 商品規格ID: id, 公開状態: await cell(1), 言語: await cell(2), 状態: await cell(3), 商品コード: await cell(5) });
  }
  return out;
}

/**
 * 商品登録編集画面（未変更）から「規格設定」で商品規格一覧を開き、その行を返す。
 * 移動の確認のあと、アドレスが変わった時点ではまだ画面が描かれていないことがある（2026-10-20 の010で、白い画面のまま行を読んで0件になった）。
 * 読み込みの完了と、廃止でない商品規格の表が出るのを待ってから読み、行の数が表の上の「検索結果 N件」と合うことを確かめる。
 */
export async function classRowsFromProductEdit(page: Page, productId: string): Promise<商品規格の行[]> {
  await openClassListFromProductEdit(page, productId);
  await page.waitForLoadState("load");
  const table = page.locator("#ex-product_class table");
  await expect(table, `商品ID ${productId} の商品規格一覧の表`).toBeVisible();
  const countText = page.locator("#ex-product_class").locator("xpath=preceding-sibling::div[contains(@class,'card-header')]");
  const shown = ((await countText.textContent()) ?? "").replace(/\s+/g, " ").trim();
  const m = /検索結果：?\s*(\d+)\s*件/.exec(shown);
  if (!m) throw new Error(`商品ID ${productId} の商品規格一覧: 表の上の件数を読めない（「${shown}」）`);
  const rows = await classRows(page);
  if (Number(m[1]) !== rows.length) {
    throw new Error(`商品ID ${productId} の商品規格一覧: 読んだ行の数 ${rows.length} が、表の上の件数 ${m[1]} と合わない`);
  }
  return rows;
}

/** 商品規格登録編集画面の「商品規格ID」の表示値 */
async function displayedProductClassId(page: Page): Promise<string> {
  const row = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品規格ID\s*$/ }) });
  await expect(row, "商品規格登録編集画面の商品規格IDの行").toHaveCount(1);
  return ((await row.locator(".col").first().textContent()) ?? "").trim();
}

/**
 * 正本「「規格設定」ボタンから商品規格一覧を開き、取り込みで作られたニアミント（・言語）の規格の行から商品規格登録編集画面を開き、
 * 部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す」。
 * 商品登録編集画面（未変更）を開いた状態から始める。登録後の画面に表示された商品規格IDを返す。
 */
export async function publishImportedClass(
  page: Page, productId: string, want: { 商品コード: string; 言語: string }, what: string, onIssue: Issue,
): Promise<string> {
  const rows = await classRowsFromProductEdit(page, productId);
  if (rows.length !== 1) throw new Error(`${what}: 商品規格一覧の行が ${rows.length} 件ある（取り込みで作られた1件のはず）: ${JSON.stringify(rows)}`);
  const r = rows[0];
  if (r.商品コード !== want.商品コード || r.状態 !== "NM" || r.言語 !== want.言語) {
    throw new Error(`${what}: 取り込みで作られた商品規格が、商品コード ${want.商品コード}・NM・${want.言語} でない: ${JSON.stringify(r)}`);
  }
  const edit = page.locator(`#ex-product_class-${r.商品規格ID}`).getByRole("link", { name: "編集", exact: true });
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${productId}/edit/${r.商品規格ID}$`)), edit.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  // スマレジ連携フラグが「連携する」の商品規格を保存すると、外部のスマレジへ送られる。試験では外部のサービスを使わないので止める
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: 取り込みで作られた商品規格のスマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  const section = form.locator("#admin_product_class_Section");
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
  if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
  await section.selectOption(first.value);
  onIssue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ`);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(w);
  const id = await displayedProductClassId(page);
  if (id !== r.商品規格ID) throw new Error(`${what}: 登録後の商品規格ID ${id} が、一覧の行の ${r.商品規格ID} と違う`);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(/^\s*公開\s*$/);
  return id;
}

/** 必須の選択欄（割引率）で選択肢の先頭を選び、販売制限が選ばれていることを確かめて「商品を登録」する（商品登録編集画面を開いた状態から） */
async function pressRegisterProduct(page: Page, productId: string, what: string, onIssue: Issue): Promise<void> {
  const form = page.locator("form#form1");
  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, `${what}: 割引率の欄`).toHaveCount(1);
  if (!(await discount.inputValue())) {
    const options = await discount.locator("option").evaluateAll((nodes) => nodes
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
    if (options.length === 0) throw new Error(`${what}: 割引率に選べる値が無い`);
    await discount.selectOption(options[0].value);
    onIssue(`${what}: 割引率は販売割引率に登録済みのもの（選択肢の先頭の「${options[0].label}」）を選んだ`);
  }
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), `${what}: 販売制限が選ばれている`).toHaveCount(1);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品ID ${productId} の「商品を登録」`)) onIssue(w);
  await expect(page, `${what}: 保存後は商品登録編集画面`).toHaveURL(new RegExp(`/product/product/${productId}/edit$`));
}

/** 商品登録編集画面（開いた状態）のショップ用メモ欄に memo を入れ、割引率を選んで「商品を登録」する */
export async function saveShopMemo(page: Page, productId: string, memo: string, what: string, onIssue: Issue): Promise<void> {
  const note = page.locator('form#form1 textarea[name="admin_product[note]"]');
  await expect(note, `${what}: ショップ用メモ欄`).toBeVisible();
  await note.fill(memo);
  await pressRegisterProduct(page, productId, what, onIssue);
  await expect(page.locator('form#form1 textarea[name="admin_product[note]"]'), `${what}: 保存後のショップ用メモ欄`).toHaveValue(memo);
}

/** 商品登録編集画面（開いた状態）のショップ用メモ欄の値 */
export async function shopMemoOf(page: Page): Promise<string> {
  return page.locator('form#form1 textarea[name="admin_product[note]"]').inputValue();
}

/** 商品マスター(検索入力)の言語の選択肢で、表示名が label の値 */
async function searchLanguageValue(page: Page, label: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  const hit = (await search.choiceOptions("language")).filter((c) => c.label === label);
  if (hit.length !== 1 || !/^\d+$/.test(hit[0].value)) throw new Error(`商品マスターの言語の選択肢「${label}」の値を一意に読めない`);
  return hit[0].value;
}

/**
 * 言語のID（日本語・英語・その他言語）。日本語・英語は商品マスター(検索入力)の言語の選択肢の値、
 * その他言語（日本語と英語以外の言語）は商品規格の登録画面の言語の欄の選択肢のうち、日本語・英語の次に並ぶもの。
 * 商品規格の登録画面は既存の商品から開くので、商品が1件以上あるときに呼ぶ（保存はしない）。
 */
export async function readLanguageIds(page: Page): Promise<{ 日本語: string; 英語: string; その他言語: { id: string; label: string } }> {
  const jp = await searchLanguageValue(page, "日本語");
  const en = await searchLanguageValue(page, "英語");
  const all = await readLanguageChoicesFromClassForm(page);
  const byLabel = (l: string) => all.find((c) => c.label === l)?.id;
  if (byLabel("日本語") !== jp || byLabel("英語") !== en) {
    throw new Error(`言語のIDが画面によって違う（商品マスター: 日本語=${jp}・英語=${en}、商品規格: ${JSON.stringify(all)}）`);
  }
  const other = all.find((c) => c.label !== "日本語" && c.label !== "英語");
  if (!other) throw new Error("商品規格の言語の欄に、日本語・英語以外の言語が無い");
  return { 日本語: jp, 英語: en, その他言語: other };
}

/** カード詳細(登録・編集・削除)で入れる値。詳細情報は1件 */
export type カードの入力 = {
  カード名日: string; カード名英: string;
  /** 点数で見たマナ・コスト */
  点数で見たマナ: string;
  /** コスト（マナ・コスト） */
  コスト: string;
  /** 詳細情報のカードセット（選択肢の値＝カードセットID） */
  カードセットID: string;
};

/** 選択欄で、値が空でない選択肢の先頭を選ぶ。選んだ表示名を返す */
async function chooseFirst(select: Locator, what: string): Promise<string> {
  await expect(select, what).toHaveCount(1);
  const first = await select.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
  if (!first) throw new Error(`${what}に選べる値が無い`);
  await select.selectOption(first.value);
  return first.label;
}

/**
 * 正本「カード詳細(登録・編集・削除)でカード名(日)・カード名(英)・点数で見たマナ・コストを入れ、
 * 詳細情報にカードセット・レアリティ・レイアウト・プロモ種別・Foil・フレームを選んで「登録」を押す」。
 * 詳細情報は「詳細情報を追加」で1件足す。カードセット以外は正本が値を定めないので、選択肢の先頭を選ぶ（選んだ値は onIssue に渡す）。
 * 登録後に開くカードの編集画面のアドレスのカードIDと、詳細情報の見出しのカード詳細IDを返す。
 */
export async function registerCard(page: Page, v: カードの入力, what: string, onIssue: Issue): Promise<{ カードID: string; カード詳細ID: string }> {
  await page.goto(adminUrl("/card/new"));
  // 「詳細情報を追加」は画面のスクリプトが動かすので、読み込みを待ってから押す
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(登録・編集・削除)画面`).toBeVisible();
  await form.locator("#admin_card_nameJp").fill(v.カード名日);
  await form.locator("#admin_card_nameEn").fill(v.カード名英);
  await form.locator("#admin_card_cmc").fill(v.点数で見たマナ);
  await form.locator("#admin_card_manaCost").fill(v.コスト);
  const details = page.locator("#card-details-container .detail-card");
  const before = await details.count();
  await page.locator("#add-detail").click();
  await expect(details, `${what}: 「詳細情報を追加」で詳細情報の欄が増える`).toHaveCount(before + 1);
  const d = details.last();
  const cardset = d.locator('select[name$="[cardset]"]');
  await expect(cardset, `${what}: 詳細情報のカードセットの欄`).toHaveCount(1);
  await cardset.selectOption(v.カードセットID);
  const chosen: string[] = [];
  for (const [field, 項目] of [["rarity", "レアリティ"], ["cardLayout", "レイアウト"], ["promotion", "プロモ種別"], ["foilFlg", "Foil"], ["frameFlg", "フレーム"]] as const) {
    chosen.push(`${項目}「${await chooseFirst(d.locator(`select[name$="[${field}]"]`), `${what}: 詳細情報の${項目}の欄`)}」`);
  }
  onIssue(`${what}: 詳細情報の ${chosen.join("・")} は選択肢の先頭を選んだ（正本は値を定めない）`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) onIssue(w);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: カードを登録したあと、カードの編集画面へ移らない（${page.url()}）`);
  const headers = (await page.locator("#card-details-container .detail-card .detail-header strong").allInnerTexts()).map((t) => t.trim());
  const ids = headers.map((t) => /カード詳細ID:\s*(\d+)/.exec(t)?.[1]).filter((x): x is string => !!x);
  if (ids.length !== 1) throw new Error(`${what}: 登録したカードの詳細情報のカード詳細IDを1つに決められない（見出し: ${headers.join(" / ")}）`);
  await expect(page.locator("#admin_card_nameJp"), `${what}: 登録後のカード名(日)`).toHaveValue(v.カード名日);
  return { カードID: m[1], カード詳細ID: ids[0] };
}
