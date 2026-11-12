/**
 * 検索サービス（ユニサーチ）の索引に載せる試験の商品を、管理画面で作る操作と、タグの対象商品を読む操作。
 *
 * アプリの作り（UniSearchExportService・ProductClassRepository のフィードの元の照会で確かめた）:
 * - 索引の「カードセット」「発売日」は、商品に指定したカードの詳細情報のカードセット（とその発売日）から作る。商品登録編集の「カードセット」の欄は使わない。
 *   カードを指定しないグッズの商品は、索引のカードセット・発売日が空になる。
 * - ネット買取トップの目玉買取商品（60件）・買取特集コーナー（タグごとに3件）は、索引をタグで絞り、発売日の新しい順に並べて出す。
 * そのため、検索やコーナーに出したい商品は「印つきのカードセット（発売日つき）に詳細情報を持つカードを登録し、グッズ商品CSV登録で作った商品にそのカードを指定する」形で作る。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { F0504カードを登録する, 単体カード配下のカテゴリID, 商品規格を削除する } from "./f05_04_products";
import { 言語IDの一覧, 規格を足す } from "./f03_02_seed_ops";
import { savePublishedClass } from "./f03_07_restock";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, productIdsByCode, readGoodsRootCategoryId } from "./m03_23_seed_products";
import { assignCardOnProductEdit } from "./product_card_assign";
import { ProductSearchPage } from "./product_search";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// カードセット（発売日つき）
// ---------------------------------------------------------------------------

/** カードセット登録の発売日の欄に入れられる、いちばん先の日付（年の選ぶ欄があればその最大の年の12月31日。日付の欄なら 2099-12-31） */
export async function カードセットのいちばん先の日付(page: Page): Promise<Date> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  const single = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await single.count()) return new Date(Date.UTC(2099, 11, 31));
  const years = await page.locator('[name="admin_cardset[releaseDate][year]"] option').evaluateAll((os) => os.map((o) => Number((o as HTMLOptionElement).value)).filter((n) => n > 0));
  if (years.length === 0) throw new Error("カードセット登録の発売日の年の選択肢が無い");
  return new Date(Date.UTC(Math.max(...years), 11, 31));
}

/** 日付を「YYYY-MM-DD」で */
export const 日付の文 = (d: Date): string => d.toISOString().slice(0, 10);
/** n 日前の日付 */
export const 日前 = (d: Date, n: number): Date => new Date(d.getTime() - n * 86_400_000);

/** カードセットを新しく登録する（名称・略称に実行の印を付けるのは呼ぶ側）。カードセットIDを返す */
export async function 発売日つきのカードセットを登録する(page: Page, v: { 名称: string; 略称: string; 発売日: Date }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(v.名称);
  await page.locator("#admin_cardset_nameEn").fill(v.名称);
  await page.locator("#admin_cardset_code").fill(v.略称);
  const single = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await single.count()) {
    await single.fill(日付の文(v.発売日));
  } else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(String(v.発売日.getUTCFullYear()));
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(v.発売日.getUTCMonth() + 1));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(v.発売日.getUTCDate()));
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  for (const w of await expectSaved(page, `カードセット「${v.名称}」の登録`)) issue(w);
  const m = /\/cardset\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`カードセット「${v.名称}」の登録後のアドレスからカードセットIDを読めない`);
  return m[1];
}

// ---------------------------------------------------------------------------
// 商品
// ---------------------------------------------------------------------------

export type 索引の商品の定義 = {
  記号: string;
  /** 実際の商品コード・商品名（印つき。呼ぶ側が決める） */
  商品コード: string; 商品名: string;
  言語?: "日本語" | "英語" | "フランス語";
  基準価格: string; 販売価格: string; 買取価格: string;
  公開?: "公開" | "非公開";
  /** 付けるタグ（タグID）。グッズ商品CSVのタグ(ID)の列で付ける */
  タグ?: string[];
  /** カードの詳細情報のカードセット（ID）。null ならカードを指定しない（カード以外の商品） */
  カードセットID: string | null;
  /** 同じカードにしたい商品は、同じ値を入れる（無ければ商品ごとに別のカード） */
  カードの組?: string;
  /** 取り込みで作られた NM の規格の代わりに、この状態の規格だけにする（状態の表示名か略号。例 "SP"） */
  NM以外の状態?: string;
  高額商品コード?: string;
};
export type 作った索引の商品 = { 記号: string; 商品ID: string; 規格ID: string; カードID: string | null; 商品コード: string; 商品名: string };

let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-8);

/**
 * 1. カードの組ごとに、カードセットの詳細情報を持つカードを登録する（カード名に商品名を使う）
 * 2. グッズ商品CSV登録でまとめて取り込む（カードの商品は「シングルカード」配下の先頭のカテゴリ、カード以外は「サプライ・グッズ」）
 * 3. 商品ごとに、カードの指定（商品名は入れ直す）→ 取り込みで作られた規格を公開（高額商品コード）、NM以外の状態なら規格を足して NM の規格を削除する
 */
export async function 索引の商品を作る(page: Page, defs: 索引の商品の定義[], what: string, fileName: string, issue: Issue): Promise<作った索引の商品[]> {
  const langs = defs.some((d) => d.言語) ? await 言語IDの一覧(page) : new Map<string, string>();
  const cards = new Map<string, { カード名: string; 詳細ID: string; カードID: string }>();
  for (const d of defs) {
    if (!d.カードセットID) continue;
    const key = d.カードの組 ?? d.記号;
    if (cards.has(key)) continue;
    const カード名 = `${d.商品名}-カード`;
    const r = await F0504カードを登録する(page, {
      カード名英: カード名, 任意の説明: { カード名日: カード名, ルールテキスト日: "結合試験" },
      詳細: [{ カードセットID: d.カードセットID, カード番号: `${CARD_NO_BASE}${String(++cardSeq).padStart(3, "0")}` }],
    }, `${what}: カード「${カード名}」`, issue);
    cards.set(key, { カード名, 詳細ID: r.カード詳細IDs[0], カードID: r.カードID });
  }
  const goodsCat = await readGoodsRootCategoryId(page);
  const cardCat = defs.some((d) => d.カードセットID) ? (await 単体カード配下のカテゴリID(page)).id : goodsCat;
  await registerGoodsCsv(page, {
    what: `${what}: グッズ商品CSV登録`, fileName, categoryId: goodsCat,
    common: { "地域別販売制限": "0", "スマレジ連携フラグ": "0", "原価単価": "10" },
    lines: defs.map((d) => ({
      code: d.商品コード, nameJp: d.商品名, nameEn: d.商品名, productStatus: d.公開 ?? "公開",
      values: {
        "基準価格": d.基準価格, "販売価格": d.販売価格, "買取価格": d.買取価格,
        "商品カテゴリ(ID)": d.カードセットID ? cardCat : goodsCat,
        ...(d.タグ?.length ? { "タグ(ID)": d.タグ.join(",") } : {}),
        ...(d.言語 ? { "言語(ID)": langs.get(d.言語) ?? (() => { throw new Error(`${what}: 言語「${d.言語}」のIDを画面から読めない`); })() } : {}),
      },
    })),
    onWarning: (w) => issue(`${what}: グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
  });
  const out: 作った索引の商品[] = [];
  for (const d of defs) {
    const w = `${what}: ${d.商品名}（${d.商品コード}）`;
    const ids = await productIdsByCode(page, d.商品コード);
    if (ids.length !== 1) throw new Error(`${w}: 商品コードの商品が ${ids.length} 件（1件のはず）`);
    const 商品ID = ids[0];
    const card = d.カードセットID ? cards.get(d.カードの組 ?? d.記号)! : null;
    if (card) {
      await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: card.カード名, cardDetailId: card.詳細ID, productNameJp: d.商品名, productNameEn: d.商品名 }, (m) => issue(`${w}: ${m}`));
    }
    const rows = await classRowsFromProductEdit(page, 商品ID);
    if (rows.length !== 1) throw new Error(`${w}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
    let 規格ID = rows[0].商品規格ID;
    if (d.NM以外の状態) {
      const lang = d.言語 === "英語" ? "EN" : d.言語 === "フランス語" ? "FR" : "JP";
      規格ID = await 規格を足す(page, 商品ID, { 言語: lang, 状態: d.NM以外の状態, 商品コード: `${d.商品コード}-${d.NM以外の状態}`, 基準価格: d.基準価格, 買取価格: d.買取価格, 高額商品コード: d.高額商品コード }, `${w}: ${d.NM以外の状態} の規格`, issue);
      await 商品規格を削除する(page, 商品ID, rows[0].商品規格ID, `${w}: 取り込みで作られた NM の規格`, issue);
    } else {
      await savePublishedClass(page, { productId: 商品ID, classId: 規格ID, ...(d.高額商品コード ? { highPriceCode: d.高額商品コード } : {}) }, `${w}: 取り込みで作られた規格`, issue);
    }
    out.push({ 記号: d.記号, 商品ID, 規格ID, カードID: card?.カードID ?? null, 商品コード: d.商品コード, 商品名: d.商品名 });
  }
  return out;
}

// ---------------------------------------------------------------------------
// タグの対象商品（商品マスターのタグの絞り込み）
// ---------------------------------------------------------------------------

/**
 * 商品マスター(検索入力)を、既定の絞り込み（公開状態・状態・高額商品）を外し、タグ（と商品コードの一部）で検索して、
 * 該当した商品の商品IDを全ページ読む（表示件数はいちばん多いもの）。
 */
export async function タグの商品IDを読む(page: Page, タグID: string, 商品コードの一部 = ""): Promise<string[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
  const tag = search.field("tag_id");
  await expect(tag.locator(`option[value="${タグID}"]`), `商品マスターのタグの選択肢にタグID ${タグID} がある`).toHaveCount(1);
  await tag.evaluate((el, id) => {
    const s = el as HTMLSelectElement;
    for (const o of Array.from(s.options)) o.selected = o.value === id;
    s.dispatchEvent(new Event("change", { bubbles: true }));
  }, タグID);
  if (商品コードの一部) await search.field("product_code").fill(商品コードの一部);
  await search.submitAndWaitForResult();
  const totalText = (await page.getByText(/^検索結果：\d+件が該当しました$/).first().textContent().catch(() => "")) ?? "";
  const total = Number(/(\d+)件/.exec(totalText)?.[1] ?? "0");
  if (total === 0) return [];
  const max = await page.locator("#page_count_pulldown option").evaluateAll((os) => Math.max(...os.map((o) => Number(/page_count=(\d+)/.exec((o as HTMLOptionElement).value)?.[1] ?? "0"))));
  const ids: string[] = [];
  for (let n = 1; ids.length < total && n <= 1000; n++) {
    await page.goto(adminUrl(`/product/page/${n}${max > 0 ? `?page_count=${max}` : ""}`));
    await page.waitForLoadState("load");
    const got = await page.locator('tr[id^="ex-product-"]').evaluateAll((trs) => trs.map((tr) => tr.id.replace("ex-product-", "")));
    if (got.length === 0) break;
    ids.push(...got.filter((x) => !ids.includes(x)));
  }
  if (ids.length !== total) throw new Error(`タグID ${タグID} の商品を ${ids.length} 件しか読めない（検索結果は ${total} 件）`);
  return ids.sort((a, b) => Number(a) - Number(b));
}
