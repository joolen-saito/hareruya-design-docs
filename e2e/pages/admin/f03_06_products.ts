/**
 * F03-06 最近チェックした商品の試験で使う、管理画面の商品まわりの操作。
 * - 商品登録編集画面の商品画像への画像追加（画像ファイルは正本の画像名ごとに実行時に作る小さな画像）
 * - カードを指定しない商品の「商品を登録」（割引率を選び、画像を追加）
 * - 商品規格の登録（部門は先頭・公開ステータスは公開。セールフラグの指定）と、代表画像欄の選択肢の読み取り
 */
import { expect, Page } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { classRowsFromProductEdit } from "./m03_23_seed_products";
import { ProductSearchPage } from "./product_search";

type Issue = (m: string) => void;

// ---- 画像ファイル（正本は中身を定めない。画像名ごとに色の違う小さな画像を作る） ----

const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** 画像名から色を決めた 32x32 の PNG 画像のファイル（名前は「画像名.png」） */
export function imageFile(画像名: string): { name: string; buffer: Buffer } {
  let h = 0;
  for (const ch of 画像名) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rgb = [(h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff];
  const size = 32;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8bit
  ihdr[9] = 2; // RGB
  const buffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
  return { name: `${画像名}.png`, buffer };
}

const thumbs = (page: Page) => page.locator("#product-image-thumb li.product-image-thumb-item");

/**
 * 商品登録編集画面の商品画像へ、画像ファイルを順に1件ずつ追加する（追加するたびにサムネイルが増えるのを待つ）。
 * この環境のアプリは、追加欄にファイルを渡しても画像を取り込む処理が動かず、サムネイルが増えない（記録に書く）。
 * 増えなければ、追加できなかったとして 0 を返す（落とさない。呼び出し側が、画像が要るケースだけ止める）。
 */
export async function uploadProductImages(page: Page, files: { name: string; buffer: Buffer }[]): Promise<number> {
  const input = page.locator("#admin_product_product_image");
  await expect(input, "商品画像の追加欄").toHaveCount(1);
  let added = 0;
  for (const f of files) {
    const before = await thumbs(page).count();
    await input.setInputFiles({ name: f.name, mimeType: "image/png", buffer: f.buffer });
    // 増えるのを待つ（expect の待ちは、落ちると手順の失敗として記録されるので、数え直して確かめる）
    let grown = false;
    for (let t = 0; t < 16 && !grown; t++) {
      grown = (await thumbs(page).count()) === before + 1;
      if (!grown) await page.waitForTimeout(500);
    }
    if (!grown) break;
    added++;
  }
  return added;
}

/** 商品登録編集画面に並ぶ商品画像のファイル名（登録済みのもの・表示順） */
export async function productImageSources(page: Page): Promise<string[]> {
  return page.locator('#product-image-thumb li.product-image-thumb-item[data-iscopy="0"]').evaluateAll((ns) => ns.map((n) => n.getAttribute("data-source") ?? ""));
}

/**
 * カードを指定しない商品の商品登録編集画面で、画像を追加し、割引率は販売割引率に登録済みのもの（先頭）を選んで「商品を登録」する。
 * 保存後の画像のファイル名（表示順）を返す。
 */
export async function saveProductWithImages(page: Page, productId: string, images: { name: string; buffer: Buffer }[], what: string, onIssue: Issue): Promise<string[]> {
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集画面`).toBeVisible();
  const added = await uploadProductImages(page, images);
  if (added < images.length) onIssue(`${what}: 商品画像の追加欄に画像ファイルを渡しても、サムネイルが増えず画像を追加できなかった（${added}/${images.length}件）。画像なしで登録した`);
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
  for (const w of await expectSaved(page, `${what}: 商品ID ${productId} の「商品を登録」`)) onIssue(`${what}: 警告「${w}」`);
  await expect(page, `${what}: 保存後は商品登録編集画面`).toHaveURL(new RegExp(`/product/product/${productId}/edit$`));
  return productImageSources(page);
}

/** 商品規格登録編集画面の「商品規格ID」の表示値 */
async function displayedClassId(page: Page): Promise<string> {
  const row = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品規格ID\s*$/ }) });
  await expect(row, "商品規格登録編集画面の商品規格IDの行").toHaveCount(1);
  return ((await row.locator(".col").first().textContent()) ?? "").trim();
}

/**
 * 商品登録編集画面から商品規格一覧を開き、取り込みで作られた規格（1件）の行から商品規格登録編集画面を開き、
 * （sale を渡したときは）セールフラグにチェックを入れて販売価格を入れ、部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」する。
 * 登録後の商品規格ID、代表画像欄の選択肢の値（商品画像ID・表示順）と、選ばれている値を返す。
 */
export async function publishClass(
  page: Page, productId: string, a: { sale?: string }, what: string, onIssue: Issue,
): Promise<{ classId: string; imageOptionIds: string[]; imageSelectedIds: string[] }> {
  const rows = await classRowsFromProductEdit(page, productId);
  if (rows.length !== 1) throw new Error(`${what}: 商品規格一覧の行が ${rows.length} 件ある（取り込みで作られた1件のはず）`);
  const r = rows[0];
  const edit = page.locator(`#ex-product_class-${r.商品規格ID}`).getByRole("link", { name: "編集", exact: true });
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${productId}/edit/${r.商品規格ID}$`)), edit.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  if (a.sale !== undefined) {
    await form.locator("#admin_product_class_sale_flg").check();
    await form.locator("#admin_product_class_price02").fill(a.sale);
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
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(`${what}: 警告「${w}」`);
  const classId = await displayedClassId(page);
  if (classId !== r.商品規格ID) throw new Error(`${what}: 登録後の商品規格ID ${classId} が、一覧の行の ${r.商品規格ID} と違う`);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(/^\s*公開\s*$/);
  if (a.sale !== undefined) await expect(form.locator("#admin_product_class_sale_flg"), `${what}: 登録後のセールフラグ`).toBeChecked();
  const select = form.locator("#admin_product_class_ProductClassImages");
  const imageOptionIds = await select.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).filter((v) => v !== ""));
  const imageSelectedIds = await select.locator("option:checked").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value));
  return { classId, imageOptionIds, imageSelectedIds };
}

/**
 * 商品マスター(検索入力)で、既定の絞り込み（公開状態など）を外し、商品コードを入れて検索し、商品名のリンクから商品登録編集画面を開く。
 * 商品公開ステータスが非公開の商品は、既定の公開状態の絞り込みでは検索結果に出ないので、その絞り込みを外す。商品IDを返す。
 */
export async function openProductEditByCodeAnyStatus(page: Page, code: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  const ids: string[] = [];
  for (const row of await page.locator('tr[id^="ex-product-"]').all()) {
    if ((((await row.locator("td:nth-child(4)").textContent()) ?? "").trim()) !== code) continue;
    ids.push((((await row.locator("td:nth-child(2)").textContent()) ?? "").trim()));
  }
  if (ids.length !== 1) throw new Error(`商品マスター(検索結果)に、商品コード ${code} の行が ${ids.length} 件ある（1件のはず）`);
  const link = page.locator(`tr#ex-product-${ids[0]} td:nth-child(3) a`);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${ids[0]}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `商品コード ${code} の商品登録編集画面`).toBeVisible();
  return ids[0];
}
