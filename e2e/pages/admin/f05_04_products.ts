/**
 * F05-04 ネット買取商品詳細のシードで使う、管理画面の商品まわりの操作。セレクタはここだけに書く。
 *
 * - カード新規登録（カード名(英)・点数で見たマナ・コスト・詳細情報。詳細情報には商品コードが重ならないようにカードセットとカード番号も入れる）
 * - カード商品CSV登録（画面の雛形の見出しで行を組み、「CSVファイルをアップロード」→確認モーダルの「確定」）
 * - 商品マスター(検索結果)で商品名から商品IDを読む／商品IDで検索して0件を確かめる
 * - 商品規格登録編集（商品コード・買取価格・代表画像を入れて「商品規格を登録」／「商品規格を削除」）
 * - 単体カード（管理画面の最上位カテゴリ「シングルカード」）配下のカテゴリのID、登録済みの割引率のID
 * - ページ管理で査定例ページがあることの確かめ
 *
 * 画面の作り（アプリの実ソースで確かめた）:
 * - カード商品CSVは、新しい商品の行で、その言語のすべての状態の商品規格を作り、商品コードを
 *   「プロモ種別のコード＋カードセットのコード＋カード番号(5桁)＋言語のコード＋状態のコード」で自動で振る。
 *   同じ商品コードがあると取り込めない（ProductCardImportHandler::isNewProductDuplicateCode）。
 * - 基準価格が300円以上の商品規格は、NM以外の状態でスマレジ連携フラグが「連携する」になる。
 *   その商品規格を保存・更新すると外部のスマレジへ送られるので、ここでは保存せずに止める（試験では外部のサービスを使わない）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { csvLine, decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { CategoryPage } from "./category";
import { expectSaved } from "./common";
import { CsvUploadPage } from "./m03_26_card_csv_upload";
import { classRowsFromProductEdit, 商品規格の行 } from "./m03_23_seed_products";
import { ページ管理 } from "./m09_04_page";
import { カード詳細IDs } from "./m14_card";
import { ProductSearchPage } from "./product_search";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// カード新規登録
// ---------------------------------------------------------------------------

export type F0504カードの入力 = {
  カード名英: string;
  /** シード表が値を定めずに「入れる」とした項目（007）。カード名(日)・ルールテキスト(日)は与えた値、カードタイプ・カラーは選択肢の先頭 */
  任意の説明?: { カード名日: string; ルールテキスト日: string };
  /** 詳細情報（1件ずつ）。カードセットはこのシード専用のカードセット、カード番号は重ならない番号 */
  詳細: { カードセットID: string; カード番号: string; Foil?: string; /** 省略すると基本土地以外の先頭。与えるとそのレアリティ（マスタのID）を選ぶ */ レアリティID?: string }[];
  /**
   * 基本土地の組合せシード（060・061・063）の入力。カードタイプ（選択肢の表示名。「英語名 / 日本語名」の末尾一致も許す）、
   * パワー・タフネス（登録ありのとき。カードと詳細情報の両方の欄に入れる）、忠誠度（登録ありのとき）。
   * これを与えたとき、詳細情報のレアリティは「基本土地」を選ぶ（与えないときは基本土地以外）。
   */
  基本土地?: { カード名日: string; ルールテキスト日: string; カードタイプ: string; パワー?: string; タフネス?: string; 忠誠度?: string };
};

/** 選択欄の、値が空でない選択肢（表示名つき） */
async function options(select: Locator): Promise<{ value: string; label: string }[]> {
  return select.locator("option").evaluateAll((ns) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
}

/**
 * カード新規登録画面で、カード名(英)・点数で見たマナ・コスト「0」を入れ、詳細情報を追加して、
 * レアリティ（基本土地以外の先頭）・レイアウト（先頭）・プロモ種別（先頭）・Foil・フレーム（通常）を選んで「登録」を押す。
 * 登録後のカード編集画面のアドレスのカードIDと、詳細情報の見出しのカード詳細ID（上から順）を返す。
 */
export async function F0504カードを登録する(page: Page, v: F0504カードの入力, what: string, issue: Issue): Promise<{ カードID: string; カード詳細IDs: string[] }> {
  await page.goto(adminUrl("/card/new"));
  // 「詳細情報を追加」は画面のスクリプトが動かすので、読み込みを待ってから押す
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード新規登録画面`).toBeVisible();
  await form.locator("#admin_card_nameEn").fill(v.カード名英);
  await form.locator("#admin_card_cmc").fill("0");
  if (v.任意の説明) {
    await form.locator("#admin_card_nameJp").fill(v.任意の説明.カード名日);
    await form.locator("#admin_card_textJp").fill(v.任意の説明.ルールテキスト日);
    const types = form.locator('select[name="admin_card[cardtypes][]"]');
    const type = (await options(types))[0];
    if (!type) throw new Error(`${what}: カードタイプに選べる値が無い`);
    await types.selectOption([type.value]);
    const color = page.locator('label[for^="admin_card_colors_"]').first();
    const colorName = ((await color.innerText()) ?? "").trim();
    const colorFor = await color.getAttribute("for");
    if (!colorFor) throw new Error(`${what}: カラーの選択肢が無い`);
    await page.locator(`#${colorFor}`).check();
    issue(`${what}: カード名(日)「${v.任意の説明.カード名日}」・ルールテキスト(日)「${v.任意の説明.ルールテキスト日}」を入れ、カードタイプは選択肢の先頭「${type.label}」、カラーは先頭「${colorName}」を選んだ（シード表は値を定めない）`);
  }
  if (v.基本土地) {
    const b = v.基本土地;
    await form.locator("#admin_card_nameJp").fill(b.カード名日);
    await form.locator("#admin_card_textJp").fill(b.ルールテキスト日);
    const types = form.locator('select[name="admin_card[cardtypes][]"]');
    const all = await options(types);
    const hit = all.find((o) => o.label === b.カードタイプ) ?? all.find((o) => o.label.endsWith(` / ${b.カードタイプ}`));
    if (!hit) throw new Error(`${what}: カードタイプに「${b.カードタイプ}」の選択肢が無い`);
    await types.selectOption([hit.value]);
    if (b.パワー !== undefined && (await form.locator("#admin_card_power").count()) > 0) await form.locator("#admin_card_power").fill(b.パワー);
    if (b.タフネス !== undefined && (await form.locator("#admin_card_toughness").count()) > 0) await form.locator("#admin_card_toughness").fill(b.タフネス);
    if (b.忠誠度 !== undefined) await form.locator("#admin_card_loyalty").fill(b.忠誠度);
    issue(`${what}: カード名(日)「${b.カード名日}」・ルールテキスト(日)「${b.ルールテキスト日}」・カードタイプ「${hit.label}」${b.パワー !== undefined ? `・パワー${b.パワー}・タフネス${b.タフネス}` : ""}${b.忠誠度 !== undefined ? `・忠誠度${b.忠誠度}` : ""}を入れた`);
  }
  const chosen: string[] = [];
  for (const d of v.詳細) {
    const details = page.locator("#card-details-container .detail-card");
    const before = await details.count();
    await page.locator("#add-detail").click();
    await expect(details, `${what}: 「詳細情報を追加」で詳細情報が増える`).toHaveCount(before + 1);
    const det = details.last();
    const sel = (f: string) => det.locator(`select[name$="[${f}]"]`);
    await sel("cardset").selectOption(d.カードセットID);
    await det.locator('input[name$="[cardNo]"]').fill(d.カード番号);
    // 基本土地は同名カード（他のバージョン）を出さない作りなので、基本土地の組合せシード以外は、レアリティを基本土地以外にする
    const rarity = (await options(sel("rarity"))).find((o) => d.レアリティID ? o.value === d.レアリティID : v.基本土地 ? /基本土地|Basic Land/i.test(o.label) : !/基本土地|Basic Land/i.test(o.label));
    if (!rarity) throw new Error(`${what}: レアリティに${v.基本土地 ? "基本土地" : "基本土地以外"}の選択肢が無い`);
    if (v.基本土地?.パワー !== undefined) {
      await det.locator('input[name$="[power]"]').fill(v.基本土地.パワー);
      await det.locator('input[name$="[toughness]"]').fill(v.基本土地.タフネス ?? "");
    }
    await sel("rarity").selectOption(rarity.value);
    const layout = (await options(sel("cardLayout")))[0];
    const promo = (await options(sel("promotion")))[0];
    if (!layout || !promo) throw new Error(`${what}: 詳細情報のレイアウト・プロモ種別に選べる値が無い`);
    await sel("cardLayout").selectOption(layout.value);
    await sel("promotion").selectOption(promo.value);
    await sel("foilFlg").selectOption({ label: d.Foil ?? "なし" });
    await sel("frameFlg").selectOption({ label: "通常" });
    chosen.push(`レアリティ「${rarity.label}」・レイアウト「${layout.label}」・プロモ種別「${promo.label}」・Foil「${d.Foil ?? "なし"}」・フレーム「通常」・カード番号「${d.カード番号}」`);
  }
  issue(`${what}: 詳細情報は ${chosen.join(" ／ ")} を選んだ（シード表は値を定めない。カードセットとカード番号は、カード商品CSVが振る商品コードを重ならせないために入れた）`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue(`${what}: 警告「${w}」`);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録後にカード編集画面へ移らない（${page.url()}）`);
  const ids = await カード詳細IDs(page);
  if (ids.length !== v.詳細.length) throw new Error(`${what}: 詳細情報のカード詳細IDが ${ids.length} 件（${v.詳細.length} 件のはず）`);
  return { カードID: m[1], カード詳細IDs: ids };
}

// ---------------------------------------------------------------------------
// カード商品CSV登録
// ---------------------------------------------------------------------------

/** カード商品CSV登録画面の「雛形ファイルダウンロード」で取った雛形の見出し */
export async function カード商品CSVの見出し(page: Page): Promise<string[]> {
  const up = new CsvUploadPage(page, "カード商品");
  await up.open();
  const download = await up.downloadTemplate();
  const chunks: Buffer[] = [];
  for await (const c of await download.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const [headers] = parseCsv(decodeCsvBytes(Buffer.concat(chunks)));
  if (!headers || !headers.includes("カード詳細(ID)") || !headers.includes("買取価格")) throw new Error(`カード商品CSVの雛形の見出しを読めない: ${headers?.join(",")}`);
  return headers;
}

/** 見出しの列だけ値を入れ（ほかの列は空）、カード商品CSV登録画面でアップロードして確認モーダルの「確定」を押す */
export async function カード商品CSVを登録する(page: Page, headers: string[], rows: Record<string, string>[], fileName: string, what: string, issue: Issue): Promise<void> {
  const known = new Set(headers);
  for (const r of rows) for (const k of Object.keys(r)) if (!known.has(k)) throw new Error(`${what}: カード商品CSVの雛形に列「${k}」が無い`);
  const csv = Buffer.from(`${[csvLine(headers), ...rows.map((r) => csvLine(headers.map((h) => r[h] ?? "")))].join("\n")}\n`, "utf8");
  const up = new CsvUploadPage(page, "カード商品");
  await up.open();
  await up.取込ファイル.setInputFiles({ name: fileName, mimeType: "text/csv", buffer: csv });
  const pressed = await up.pressUpload();
  if (pressed !== null) throw new Error(`${what}: 「CSVファイルをアップロード」で確認モーダルが開かない（${JSON.stringify(pressed)}）`);
  const r = await up.confirm();
  if (!r.sent) throw new Error(`${what}: 確認モーダルの「確定」で送られない`);
  for (const w of await expectSaved(page, what)) issue(`${what}: 警告「${w}」`);
}

// ---------------------------------------------------------------------------
// 商品マスター
// ---------------------------------------------------------------------------

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

/** 商品マスター(検索入力)で商品名を入れて検索し、商品名がちょうど name の行の商品ID（1件のはず）を返す */
export async function 商品名で商品IDを読む(page: Page, name: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await clearDefaultFilters(search);
  await search.field("product_name").fill(name);
  await search.submitAndWaitForResult();
  const ids: string[] = [];
  for (const row of await page.locator('tr[id^="ex-product-"]').all()) {
    if ((((await row.locator("td:nth-child(3) a").first().textContent()) ?? "").trim()) !== name) continue;
    ids.push((((await row.locator("td:nth-child(2)").textContent()) ?? "").trim()));
  }
  if (ids.length !== 1 || !/^\d+$/.test(ids[0])) throw new Error(`商品マスター(検索結果)に、商品名「${name}」の行が ${ids.length} 件ある（1件のはず）`);
  return ids[0];
}

/** 商品マスター(検索入力)で、IDに id を入れ、公開状態のチェックをすべて付けて検索し、該当の件数を返す */
export async function 商品IDで公開状態すべてを検索した件数(page: Page, id: string): Promise<number> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const option of await search.choiceOptions("status")) if (!option.checked) await search.setChecked("status", option.value, true);
  await search.field("product_id").fill(id);
  await search.submitAndWaitForResult();
  const shown = await page.getByText(/^(検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした)$/).first().innerText();
  const m = /検索結果：(\d+)件/.exec(shown);
  return m ? Number(m[1]) : 0;
}

/** 管理画面の最上位カテゴリ「シングルカード」（シード表の「単体カード」）の配下の、先頭のカテゴリのID */
export async function 単体カード配下のカテゴリID(page: Page): Promise<{ id: string; 名称: string }> {
  const category = new CategoryPage(page);
  await category.openTop();
  const top = await category.idOf("シングルカード");
  await category.openChildrenOf(top);
  const rows = await category.rowValues();
  if (rows.length === 0 || !/^\d+$/.test(rows[0].id)) throw new Error("「シングルカード」の配下にカテゴリが無い");
  return { id: rows[0].id, 名称: rows[0].nameJp };
}

/** 登録済みの割引率のID。既存の商品（初期条件で検索した結果の先頭）の商品登録編集画面の割引率の選択肢の先頭（保存はしない） */
export async function 登録済みの割引率ID(page: Page): Promise<{ id: string; 名称: string }> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.submitAndWaitForResult();
  const first = page.locator('tr[id^="ex-product-"] td:nth-child(3) a').first();
  await expect(first, "商品マスター(検索結果)の先頭の商品").toBeVisible();
  await Promise.all([page.waitForURL(/\/product\/product\/\d+\/edit$/), first.click()]);
  const o = (await options(page.locator('form#form1 select[name="admin_product[Discount]"]')))[0];
  if (!o) throw new Error("商品登録編集画面の割引率に選べる値が無い");
  return { id: o.value, 名称: o.label };
}

// ---------------------------------------------------------------------------
// 商品規格
// ---------------------------------------------------------------------------

/** 商品登録編集画面を開き、「規格設定」で商品規格一覧を開いて行を読む */
export async function 商品規格一覧を読む(page: Page, productId: string): Promise<商品規格の行[]> {
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  return classRowsFromProductEdit(page, productId);
}

/** 商品規格一覧の行のうち、言語（日本語／英語）と状態の行の商品規格ID */
export function 規格IDを選ぶ(rows: 商品規格の行[], 言語: "JP" | "EN", 状態: string): string {
  const name = 言語 === "JP" ? "日本語" : "英語";
  const hit = rows.filter((r) => r.言語 === name && r.状態 === 状態);
  if (hit.length !== 1) throw new Error(`商品規格一覧に言語「${name}」・状態「${状態}」の行が ${hit.length} 件ある（1件のはず）: ${JSON.stringify(rows)}`);
  return hit[0].商品規格ID;
}

async function openClassEdit(page: Page, productId: string, classId: string, what: string): Promise<Locator> {
  await page.goto(adminUrl(`/product/product/class/${productId}/edit/${classId}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  return form;
}

/**
 * 商品規格登録編集画面で、商品コード・買取価格・代表画像（商品画像のファイル名）を入れて「商品規格を登録」を押す。
 * スマレジ連携フラグが「連携する」の商品規格は、保存すると外部のスマレジへ送られるので、保存せずに止める。
 */
export async function 商品規格を登録する(
  page: Page, productId: string, classId: string, v: { 商品コード?: string; 買取価格?: string; 代表画像?: string[] }, what: string, issue: Issue,
): Promise<void> {
  const form = await openClassEdit(page, productId, classId, what);
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: 商品規格ID ${classId} のスマレジ連携フラグが「連携する」になっている（カード商品CSVが基準価格から決めた）。保存すると外部のスマレジへ送られるので止める`);
  }
  if (v.商品コード !== undefined) await form.locator("#admin_product_class_code").fill(v.商品コード);
  if (v.買取価格 !== undefined) await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
  if (v.代表画像?.length) {
    const select = form.locator("#admin_product_class_ProductClassImages");
    const opts = await select.locator("option").evaluateAll((ns) => ns.map((n) => ({
      value: (n as HTMLOptionElement).value, text: (n.textContent ?? "").trim(), url: n.getAttribute("data-url") ?? "",
    })));
    const values = v.代表画像.map((file) => {
      const o = opts.find((x) => x.value !== "" && (x.url.endsWith(file) || x.text === file || x.text.endsWith(file)));
      if (!o) throw new Error(`${what}: 代表画像の選択肢に画像「${file}」が無い（${opts.map((x) => x.text || x.url).join("、")}）`);
      return o.value;
    });
    await select.selectOption(values, { force: true });
  }
  const section = form.locator("#admin_product_class_Section");
  if ((await section.count()) === 1 && !(await section.inputValue())) {
    const first = (await options(section))[0];
    if (first) {
      await section.selectOption(first.value);
      issue(`${what}: 部門が空だったので選択肢の先頭「${first.label}」を選んだ（シード表は値を定めない）`);
    }
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格ID ${classId} の登録`)) issue(`${what}: 警告「${w}」`);
}

/** 商品規格登録編集画面で「商品規格を削除」を押し、確認のモーダルで削除する */
export async function 商品規格を削除する(page: Page, productId: string, classId: string, what: string, issue: Issue): Promise<void> {
  await openClassEdit(page, productId, classId, what);
  await page.locator('a[data-bs-target="#deleteConfirmModal"]').click();
  const modal = page.locator("#deleteConfirmModal");
  await expect(modal, `${what}: 削除の確認モーダル`).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    modal.locator("a.btn-ec-delete").click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格ID ${classId} の削除`)) issue(`${what}: 警告「${w}」`);
}

// ---------------------------------------------------------------------------
// ページ管理
// ---------------------------------------------------------------------------

/** ページ管理の一覧で、査定例ページ（フロントの user_data/purchase_example）の行が見えている件数 */
export async function 査定例ページの行数(page: Page): Promise<number> {
  const p = new ページ管理(page);
  await p.一覧を開く();
  await p.検索する("purchase_example");
  return p.見えている行.count();
}
