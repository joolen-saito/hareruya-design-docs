/**
 * F05-04 ネット買取商品詳細のシードで使う、管理画面の商品まわりの操作。セレクタはここだけに書く。
 *
 * - カード新規登録（カード名(英)・点数で見たマナ・コスト・詳細情報。詳細情報には商品コードが重ならないようにカードセットとカード番号も入れる）
 * - カード商品CSV登録（画面の雛形の見出しで行を組み、「CSVファイルをアップロード」→確認モーダルの「確定」）
 * - 商品マスター(検索結果)で商品名から商品IDを読む／商品IDで検索して0件を確かめる
 * - 商品規格登録編集（商品コード・買取価格・代表画像を入れて「商品規格を登録」／「商品規格を削除」）
 * - 単体カード（カテゴリ「シングルカード」。手元は最上位、開発環境はセットの下）配下のカテゴリのID、登録済みの割引率のID
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
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click({ noWaitAfter: true }),
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

/**
 * カード商品CSV登録画面のCSVの形式の表の説明（「1:公開 2:非公開 3:廃止」・「0:非公開 1:公開」）から、
 * 商品公開ステータス・支店の商品公開ステータスの「公開」に当たる値を読む。
 * 正本（シード表）は「商品公開ステータスに「2」（公開）」と書くが、アプリの説明では 2 は非公開で、2 を入れると商品が非公開になり
 * ネット買取商品詳細が 404 になった（2026-11-13）。正本の意味（公開）に当たる値を画面の説明から読んで入れる（f03_02_seed_ops・m03-23 と同じ読み替え）
 */
export async function カード商品CSVの公開の値(page: Page): Promise<{ 商品公開ステータス: string; 支店の商品公開ステータス: string }> {
  const up = new CsvUploadPage(page, "カード商品");
  await up.open();
  const rows = await up.formatRows();
  const 値 = (項目名: string): string => {
    const desc = rows.find((r) => r.項目名 === 項目名)?.説明 ?? "";
    const hit = [...desc.matchAll(/(\d+)\s*:\s*([^\d\s:]+)/g)].filter((m) => m[2].trim() === "公開");
    if (hit.length !== 1) throw new Error(`カード商品CSVの「${項目名}」の説明から「公開」の値を一意に読めない（${desc}）`);
    return hit[0][1];
  };
  return { 商品公開ステータス: 値("商品公開ステータス"), 支店の商品公開ステータス: 値("支店の商品公開ステータス") };
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

/**
 * シード表の「単体カード」にあたる、名称（日）が「シングルカード」のカテゴリ。
 * 手元（アプリの初期データ）は最上位に「シングルカード」（ID 1）があるが、開発環境のカテゴリツリーは最上位が「最新セット」「スタンダード」…
 * （セット別）で、「シングルカード」は各セットの下にある（2026-11-13 の F05-04 の事前準備で、最上位に0件だった）。
 * 最上位に1件あればそれを、無ければ商品マスターの検索欄のカテゴリの選択肢で、先頭の「シングルカード」を使う（読むだけ。カテゴリは書き換えない）。
 */
export async function シングルカードのカテゴリ(page: Page): Promise<{ id: string; 名称: string; 最上位: boolean }> {
  const category = new CategoryPage(page);
  await category.openTop();
  const top = (await category.rowValues()).filter((r) => r.nameJp === "シングルカード");
  if (top.length > 1) throw new Error(`最上位のカテゴリに「シングルカード」が ${top.length} 件ある（1件のはず）`);
  if (top.length === 1) return { id: top[0].id, 名称: "シングルカード", 最上位: true };
  const search = new ProductSearchPage(page);
  await search.open();
  const opts = await page.locator("select#admin_search_product_category_id option").evaluateAll((os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? "" })));
  const depth = (label: string): number => (/^[\s　]*/.exec(label)?.[0].length ?? 0);
  const i = opts.findIndex((o) => /^\d+$/.test(o.value) && o.label.trim() === "シングルカード");
  if (i < 0) throw new Error("カテゴリに「シングルカード」が無い（最上位にも、商品マスターの検索欄のカテゴリの選択肢にも無い）");
  const parent = opts.slice(0, i).reverse().find((o) => depth(o.label) < depth(opts[i].label));
  return { id: opts[i].value, 名称: parent ? `${parent.label.trim()}＞シングルカード` : "シングルカード", 最上位: false };
}

/**
 * シード表の「単体カード配下のカテゴリ」のID。
 * 最上位に「シングルカード」があれば（手元）その配下の先頭のカテゴリ、無ければ（開発環境）セットの下の「シングルカード」そのもの。
 */
export async function 単体カード配下のカテゴリID(page: Page): Promise<{ id: string; 名称: string }> {
  const single = await シングルカードのカテゴリ(page);
  if (!single.最上位) return { id: single.id, 名称: single.名称 };
  const category = new CategoryPage(page);
  await category.openChildrenOf(single.id);
  const rows = await category.rowValues();
  if (rows.length === 0 || !/^\d+$/.test(rows[0].id)) throw new Error("「シングルカード」の配下にカテゴリが無い");
  return { id: rows[0].id, 名称: rows[0].nameJp };
}

/**
 * グッズ商品CSV登録が「商品カテゴリ(ID)」に受け付ける範囲（アプリの決め打ちのカテゴリID 2・4・5 とその子孫。
 * Service/Csv/Importer/Event/ProductGoodsImportHandler.php の初期化）の中で、名称（日）が「シングルカード」のカテゴリ。無ければ 2・4・5 のうち最初にあるもの。
 * 開発環境のカテゴリIDは本番と同じで、2 は「スタンダード」・4 は「モダン」・5 は「レガシー」（Entity/Category.php の NAV_ の定数）。
 * 「単体カード配下のカテゴリID」が返す、セットの下の「シングルカード」（例: コマンダーの下）は範囲の外で、取込が
 * 「商品カテゴリ(ID)の値が異常です」で止まった（2026-11-13〜14 の F05-01 の21件）。読むだけ。カテゴリは書き換えない。
 */
export async function グッズCSVが受け付けるカードのカテゴリID(page: Page): Promise<{ id: string; 名称: string }> {
  const 根 = ["2", "4", "5"];
  const search = new ProductSearchPage(page);
  await search.open();
  const opts = await page.locator("select#admin_search_product_category_id option").evaluateAll((os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? "" })));
  const depth = (label: string): number => (/^[\s　]*/.exec(label)?.[0].length ?? 0);
  /** 選択肢 i の自身と祖先（字下げの浅い前の選択肢をたどる） */
  const 系統 = (i: number): { value: string; label: string }[] => {
    const out = [opts[i]];
    let d = depth(opts[i].label);
    for (let j = i - 1; j >= 0 && d > 0; j--) {
      const dj = depth(opts[j].label);
      if (/^\d+$/.test(opts[j].value) && dj < d) { out.push(opts[j]); d = dj; }
    }
    return out;
  };
  for (let i = 0; i < opts.length; i++) {
    if (!/^\d+$/.test(opts[i].value) || opts[i].label.trim() !== "シングルカード") continue;
    const line = 系統(i);
    if (line.some((o) => 根.includes(o.value))) return { id: opts[i].value, 名称: line.map((o) => o.label.trim()).reverse().join("＞") };
  }
  for (const r of 根) {
    const o = opts.find((x) => x.value === r);
    if (o) return { id: r, 名称: o.label.trim() };
  }
  throw new Error(`グッズ商品CSV登録が受け付けるカテゴリ（ID ${根.join("・")} とその子孫）が、商品マスターの検索欄のカテゴリの選択肢に無い`);
}

/** 同じ流し（同じプロセス）で一度読んだ割引率を使い回す。割引率の選択肢（MtbDiscount の id 順）は流しの間に変わらない */
let 割引率の控え: { id: string; 名称: string } | null = null;

/**
 * 登録済みの割引率のID。既存の商品の商品登録編集画面（保存はしない）の割引率の選択肢の先頭。
 * - 商品マスターを絞り込みなしで検索すると、開発環境では商品が多く POST /admin/product が120秒たっても応答しない（2026-11-13 の F05-04 の7件）。
 * - 商品登録画面（新規）/admin/product/product/new は、アプリの初期データ（dtb_authority_role）で権限1〜3のすべてに閉じられていて
 *   404「お探しのページが見つかりません」を返す（2026-11-13 11:2x〜11:4x の F05-04 の29件。画面は真っ白で form#form1 が出なかった）。
 * - 割引率の選択肢を出す画面はアプリに商品登録編集画面しかない（販売割引率一覧 /admin/data/discount は名称だけで ID を出さない）。
 * そこで、番号の小さい既存の商品の編集画面を商品IDで直接開いて読む（m03_01_product_class.ts の言語の読み方と同じ）。
 * 割引率の選択肢は ProductType の Discount（全件・id 順）で、商品によらない。
 */
export async function 登録済みの割引率ID(page: Page): Promise<{ id: string; 名称: string }> {
  if (割引率の控え) return 割引率の控え;
  const select = page.locator('form#form1 select[name="admin_product[Discount]"]');
  const tried: string[] = [];
  for (const id of ["1", "2", "3", "4", "5", "10", "100", "1000"]) {
    const res = await page.goto(adminUrl(`/product/product/${id}/edit`), { waitUntil: "load", timeout: 120_000 }).catch(() => null);
    tried.push(`${id}=${res ? res.status() : "応答なし"}`);
    if (!res || !res.ok() || !new URL(page.url()).pathname.endsWith(`/product/product/${id}/edit`)) continue;
    await expect(page.locator("form#form1"), `商品登録編集画面（商品ID ${id}）`).toBeVisible({ timeout: 120_000 });
    const o = (await options(select))[0];
    if (!o) throw new Error(`商品登録編集画面（商品ID ${id}）の割引率に選べる値が無い`);
    割引率の控え = { id: o.value, 名称: o.label };
    return 割引率の控え;
  }
  throw new Error(`割引率を読むための既存の商品の編集画面を開けない（商品IDと状態コード: ${tried.join("、")}）`);
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
/**
 * 正本（シード表・ケース）の状態「EX」は、アプリの状態のマスタ（mtb_card_condition: NM・SP・MP・HP・OT。Entity MtbCardCondition）に無く、
 * カード商品CSVの取り込みも NM・SP・MP・HP・OT の規格だけを作る（2026-11-13 の開発環境で 001・014 が止まった）。
 * 正本の「NM の次の状態」の意味で、並びの2番目の SP に読み替える。
 */
export const 画面の状態 = (正本の状態: string): string => (正本の状態 === "EX" ? "SP" : 正本の状態);
export const 状態EXの読み替えの注記 = "正本の状態「EX」は、アプリの状態のマスタ（NM・SP・MP・HP・OT）に無く、カード商品CSVの取り込みでも作られない。NM の次の状態 SP に読み替えた（JP-EX→JP-SP、EN-EX→EN-SP）";

/** 規格の表（「言語-状態」→ 商品規格ID）に、SP の規格を正本の EX の名前でも引けるように足す */
export function EXの名前でも引けるようにする(規格: Record<string, string>): Record<string, string> {
  for (const lang of ["JP", "EN"]) if (規格[`${lang}-SP`] && !規格[`${lang}-EX`]) 規格[`${lang}-EX`] = 規格[`${lang}-SP`];
  return 規格;
}

export function 規格IDを選ぶ(rows: 商品規格の行[], 言語: "JP" | "EN", 正本の状態: string): string {
  const name = 言語 === "JP" ? "日本語" : "英語";
  const 状態 = 画面の状態(正本の状態);
  const hit = rows.filter((r) => r.言語 === name && r.状態 === 状態);
  if (hit.length !== 1) throw new Error(`商品規格一覧に言語「${name}」・状態「${状態}」${状態 !== 正本の状態 ? `（正本の${正本の状態}）` : ""}の行が ${hit.length} 件ある（1件のはず）: ${JSON.stringify(rows)}`);
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
    // 保存すると外部のスマレジへ送られる。この商品規格は E2E が作った印つきなので、保存の前に「連携しない」へ切り替える（スマレジへは送らない）。切り替えて保存するので、切り替わったことを確かめてから進む
    const 連携しない = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"][value="0"]');
    if ((await 連携しない.count()) !== 1) throw new Error(`${what}: 商品規格ID ${classId} のスマレジ連携フラグが「連携する」になっていて、「連携しない」の選択肢も見つからない。保存すると外部のスマレジへ送られるので止める`);
    await 連携しない.check({ force: true });
    await expect(smaregi, `${what}: 商品規格ID ${classId} のスマレジ連携フラグが「連携しない」になる`).toHaveAttribute("value", "0");
    issue(`${what}: 商品規格ID ${classId} のスマレジ連携フラグはカード商品CSVが基準価格から「連携する」にしていたので、保存の前に「連携しない」へ切り替えた（保存すると外部のスマレジへ送られるため）`);
  }
  if (v.商品コード !== undefined) await form.locator("#admin_product_class_code").fill(v.商品コード);
  if (v.買取価格 !== undefined) {
    await form.locator("#admin_product_class_buy_price").fill(v.買取価格);
    // アプリは「販売価格は買取価格以上」でないと保存させない。言語・状態ごとに買取価格が違う規格（英語NM 900 など）は、取り込んだ規格の販売価格（日本語NMの買取価格と同じ）が足りない。
    // シード表は販売価格を買取価格と同じとしているので、足りないときは買取価格と同じ値にする
    const 販売 = form.locator("#admin_product_class_price02");
    const 今の販売 = Number((await 販売.inputValue()).replace(/[^\d.]/g, "") || "0");
    if (今の販売 < Number(v.買取価格)) {
      await 販売.fill(v.買取価格);
      issue(`${what}: 商品規格ID ${classId} の販売価格が ${今の販売} 円で買取価格 ${v.買取価格} 円より低く保存できないので、買取価格と同じ ${v.買取価格} 円にした（アプリは販売価格が買取価格以上であることを求める）`);
    }
  }
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
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click({ noWaitAfter: true }),
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
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    modal.locator("a.btn-ec-delete").click({ noWaitAfter: true }),
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
