/**
 * F02-03 支店ナビのカート表示のシードで使う画面操作（カード・グッズ商品・在庫）と、印つきの商品の在庫を0にする DB の書き込み。
 *
 * 商品の作り方はシード表の投入方法どおり:
 * カード商品（カード指定あり）= カード詳細(登録)でカードを登録（Foil は「通常」か「なし」）→ グッズ商品CSV登録で1行取り込み →
 *   商品登録編集で「カード指定」→ 商品名を入れ直して登録 → 取り込みで作られた規格を公開。
 * カード以外の商品 = グッズ商品CSV登録で1行取り込み → 取り込みで作られた規格を公開。
 * 在庫は、在庫を入れる管理者が在庫編集で入庫し、別の管理者が承認する（pages/admin/f02_02_setup.ts の「本店の在庫を入れる」）。
 *
 * 商品コード・カード名には実行の印を付ける（呼び出し側が付けた値をそのまま使う）。商品名はシード表の値のまま（カートの中の表示を正本の値と比べるため。
 * 商品の取り違えは商品コードで防ぐ）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { writeTestData } from "../../db/write_adapter";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl, withAdminSession } from "../../lib/session";
import { savePublishedClass } from "./f03_07_restock";
import { カードを登録する, 言語IDの一覧 } from "./f03_02_seed_ops";
import { downloadGoodsCsvTemplate } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId } from "./m03_23_seed_products";
import { assignCardOnProductEdit } from "./product_card_assign";
import { 本店の在庫を入れる } from "./f02_02_setup";

type Issue = (m: string) => void;

export type カート商品の定義 = {
  /** 実行の印を付けた商品コード */
  商品コード: string;
  /** 画面に出る商品名（シード表の値のまま） */
  商品名: string;
  価格: string;
  /** カード商品のとき。Foil は「通常」（シード表の「Foilで通常を選ぶ」）か「なし」 */
  カード?: { Foil: string };
  /** 商品の言語の表示名（「日本語」「英語」。省略すると取込の既定の言語） */
  言語?: string;
  /** 本店の在庫数（省略すると0＝入庫しない） */
  在庫?: number;
};
export type 作った商品 = { 商品ID: string; 規格ID: string; 商品コード: string; 商品名: string; カードID?: string };

let cardSeq = 0;
/** 実行ごとに重ならないコレクターNo（16文字まで） */
const コレクターNo = () => `${RUN_MARK}${String(++cardSeq).padStart(2, "0")}`.slice(-16);

/** 商品を作る（カード・グッズ商品CSV・カード指定・規格の公開）。そのあと在庫を入れる */
export async function カート用商品を作る(browser: Browser, seedId: string, defs: カート商品の定義[], issue: Issue): Promise<作った商品[]> {
  const made: 作った商品[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const cards = new Map<number, { 名: string; 詳細ID: string; カードID: string }>();
    for (const [i, d] of defs.entries()) {
      if (!d.カード) continue;
      const 名 = `F0203カード-${d.商品コード}`;
      const c = await カードを登録する(page, { カード名: 名, コレクターNo: コレクターNo(), Foil: d.カード.Foil }, `${seedId}: ${d.商品名} のカード`, issue);
      cards.set(i, { 名, 詳細ID: c.カード詳細ID, カードID: c.カードID });
    }
    const categoryId = await readGoodsRootCategoryId(page);
    const 言語ID = defs.some((d) => d.言語) ? await 言語IDの一覧(page) : new Map<string, string>();
    const template = await downloadGoodsCsvTemplate(page);
    const region = Object.fromEntries(template.headers.filter((h) => h.includes("地域")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { ...region, "スマレジ連携フラグ": "0", "原価単価": "10" },
      lines: defs.map((d) => ({
        code: d.商品コード, nameJp: d.商品名, nameEn: d.商品名,
        values: { "基準価格": d.価格, "販売価格": d.価格, "買取価格": "100", ...(d.言語 ? { "言語(ID)": 言語ID.get(d.言語) ?? (() => { throw new Error(`言語「${d.言語}」のIDを画面から読めない`); })() } : {}) },
      })),
      onWarning: (w) => issue(`${seedId}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    for (const [i, d] of defs.entries()) {
      const what = `${seedId}: ${d.商品名}（${d.商品コード}）`;
      const 商品ID = await openProductEditByCode(page, d.商品コード);
      const card = cards.get(i);
      if (card) {
        await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: card.名, cardDetailId: card.詳細ID, productNameJp: d.商品名, productNameEn: d.商品名 }, (m) => issue(`${what}: ${m}`));
        issue(`${what}: カードを指定した。商品カテゴリの「サプライ・グッズ」の付け替えは行っていない（ケースはカテゴリを見ない）`);
      }
      const rows = await classRowsFromProductEdit(page, 商品ID);
      if (rows.length !== 1 || rows[0].商品コード !== d.商品コード) throw new Error(`${what}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, what, issue);
      made.push({ 商品ID, 規格ID: rows[0].商品規格ID, 商品コード: d.商品コード, 商品名: d.商品名, カードID: card?.カードID });
    }
  });
  // 在庫: 数ごとにまとめて入庫する
  const 数 = [...new Set(defs.map((d) => d.在庫 ?? 0).filter((n) => n > 0))];
  for (const n of 数) {
    await 本店の在庫を入れる(browser, seedId, defs.filter((d) => (d.在庫 ?? 0) === n).map((d) => d.商品コード), n, issue);
  }
  return made;
}

/**
 * 印つき（実行の印を含む商品コード）の商品の在庫を0にする。シード表の「在庫変更CSV登録で出庫（在庫増減数=-1）→ 承認」の代わり
 * （カートへ入れたあとに在庫を0にする作業。在庫の出庫を承認する画面の流れは、承認一覧の絞り込みが複雑になるので DB で書く）。
 * 対象はこの実行で作った商品の規格の在庫の行だけ（確かめの SELECT が返す行がすべて印を含むこと）。
 */
export function 印つきの商品の在庫を0にする(商品コード: string, issue: Issue, what: string): void {
  const n = writeTestData({
    理由: `${what}: カートへ入れたあとに、この実行で作った商品の在庫を0にする`,
    sql: "update dtb_product_stock set stock = 0 where product_class_id in (select id from dtb_product_class where product_code = $1)",
    params: [商品コード],
    対象の確かめ: "select pc.product_code, p.name from dtb_product_class pc join dtb_product p on p.id = pc.product_id where pc.product_code = $1",
    確かめのparams: [商品コード],
    印: RUN_MARK,
    最大行数: 10,
  });
  issue(`${what}: DBで、この実行で作った商品 ${商品コード} の在庫の行 ${n} 行の在庫数を0にした（シード表は在庫変更CSVの出庫＝-1の承認。在庫を0にするだけなので DB の書き込みで代えた）`);
}

/** 商品マスター（検索入力）のカードセットの選択肢＝カードセット管理に登録されたカードセットの名前（読むだけ） */
export async function 登録済みのカードセットの名前(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/product"));
  await page.waitForLoadState("load");
  return page.locator("#admin_search_product_cardset option").evaluateAll((os) => os
    .map((o) => (o.textContent ?? "").replace(/\s+/g, " ").trim()).filter((t) => t !== ""));
}
