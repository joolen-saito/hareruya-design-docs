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
import { 在庫の店舗, 店舗の在庫を入れる, 本店の在庫を入れる } from "./f02_02_setup";

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
/**
 * 在庫の店舗（省略すると本店）。支店の商品詳細は、その支店の在庫を見て数量の欄を出すので、支店の画面でカートへ入れるときは支店を渡す
 * （2026-11-12: 本店にだけ在庫を入れていたので、支店Aの商品詳細に数量の欄が出ず S-F02-03-CART-BASE が止まっていた）
 */
export async function カート用商品を作る(browser: Browser, seedId: string, defs: カート商品の定義[], issue: Issue, 在庫の店?: 在庫の店舗): Promise<作った商品[]> {
  const made: 作った商品[] = [];
  const cards = new Map<number, { 名: string; 詳細ID: string; カードID: string }>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, d] of defs.entries()) {
      if (!d.カード) continue;
      const 名 = `F0203カード-${d.商品コード}`;
      const c = await カードを登録する(page, { カード名: 名, コレクターNo: コレクターNo(), Foil: d.カード.Foil }, `${seedId}: ${d.商品名} のカード`, issue);
      cards.set(i, { 名, 詳細ID: c.カード詳細ID, カードID: c.カードID });
    }
    if (在庫の店) await 在庫の店.登録者を用意する(page);
  });
  /*
   * グッズ商品CSV登録は、取り込んだ管理者の所属店舗の EC-CUBE 在庫の行だけを作る（アプリ origin/develop:
   * Controller/Admin/Product/Csv/CsvImportController.php の TenantInfo = ログイン中の管理者の店舗・persistProductStock）。
   * 店舗の登録より後に作った商品には、ほかの店舗の在庫の行が無く、在庫編集（在庫の行が要る）で支店の在庫を入れられない。
   * 支店の在庫を入れるときは、その支店に所属する在庫の登録者で取り込み、支店の在庫の行を作る。
   */
  await withAdminSession(browser, 在庫の店 ? 在庫の店.登録者 : SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
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
    if (在庫の店) issue(`${seedId}: グッズ商品CSV登録は、在庫を入れる店舗（店舗ID ${在庫の店.店舗ID}）に所属する管理者 ${在庫の店.登録者.loginId} で行った（取り込みはその管理者の店舗の在庫の行だけを作るため）`);
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
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
    const codes = defs.filter((d) => (d.在庫 ?? 0) === n).map((d) => d.商品コード);
    if (在庫の店) await 店舗の在庫を入れる(browser, seedId, codes, n, issue, 在庫の店);
    else await 本店の在庫を入れる(browser, seedId, codes, n, issue);
  }
  return made;
}

/**
 * 印つき（実行の印を含む商品コード）の商品の在庫を0にする。シード表の「在庫変更CSV登録で出庫（在庫増減数=-1）→ 承認」の代わり
 * （カートへ入れたあとに在庫を0にする作業。在庫の出庫を承認する画面の流れは、承認一覧の絞り込みが複雑になるので DB で書く）。
 * 対象はこの実行で作った商品の規格（規格ID）の、在庫を入れた店舗（店舗ID）の在庫の行だけ（在庫区分 EC-CUBE・スマレジの2行まで）。
 * 在庫の行は店舗ごとにあるので、規格だけで絞ると全店舗の行（2026-11-13 の開発環境で 268 行）になり、上限で止まっていた（IT-F02-03-053）。
 * 店舗・規格で絞っても、在庫区分（stock_location_id。アプリ origin/develop: Entity/ProductStock.php の STOCK_LOCATION_ECCUBE=1・
 * STOCK_LOCATION_SMAREGI=2）ごとに行があり、2行で上限1に当たった（2026-11-13 12:53）。在庫を入れたのは EC-CUBE の行だが、
 * 「在庫なし」にするのが目的なので、その店舗・規格の行をすべて（在庫区分の数＝2行まで）0にする。EC-CUBE の行があることは先に確かめる。
 * 確かめの SELECT は、書き換える在庫の行と商品コードを返し、どの行も印を含むこと。
 */
export function 印つきの商品の在庫を0にする(商品: 作った商品, 店舗ID: string, issue: Issue, what: string): void {
  const 在庫区分の数 = 2;
  const n = writeTestData({
    理由: `${what}: カートへ入れたあとに、この実行で作った商品の在庫（店舗ID ${店舗ID}・規格ID ${商品.規格ID}）を0にする`,
    sql: `update dtb_product_stock set stock = 0
           where base_info_id = $1::int
             and product_class_id = (select id from dtb_product_class where id = $2::int and product_code = $3)`,
    params: [店舗ID, 商品.規格ID, 商品.商品コード],
    // 在庫を入れた EC-CUBE の在庫区分の行がある規格・店舗であること（行が無ければ確かめの行が空で書かない）
    対象の確かめ: `select ps.id, ps.base_info_id, ps.stock_location_id, pc.product_code, p.name
                    from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id join dtb_product p on p.id = pc.product_id
                   where ps.base_info_id = $1::int and pc.id = $2::int and pc.product_code = $3
                     and exists (select 1 from dtb_product_stock e where e.base_info_id = $1::int and e.product_class_id = pc.id and e.stock_location_id = 1)`,
    確かめのparams: [店舗ID, 商品.規格ID, 商品.商品コード],
    印: RUN_MARK,
    最大行数: 在庫区分の数,
  });
  if (n < 1) throw new Error(`${what}: 在庫を0にした行が無い（店舗ID ${店舗ID}・規格ID ${商品.規格ID} の在庫の行があるはず）`);
  issue(`${what}: DBで、この実行で作った商品 ${商品.商品コード}（規格ID ${商品.規格ID}）の店舗ID ${店舗ID} の在庫の行 ${n} 行（在庫区分ごとの行。在庫を入れたのは EC-CUBE の行）の在庫数を0にした（シード表は在庫変更CSVの出庫＝-1の承認。在庫を0にするだけなので DB の書き込みで代えた）`);
}

/** 商品マスター（検索入力）のカードセットの選択肢＝カードセット管理に登録されたカードセットの名前（読むだけ） */
export async function 登録済みのカードセットの名前(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/product"));
  await page.waitForLoadState("load");
  return page.locator("#admin_search_product_cardset option").evaluateAll((os) => os
    .map((o) => (o.textContent ?? "").replace(/\s+/g, " ").trim()).filter((t) => t !== ""));
}
