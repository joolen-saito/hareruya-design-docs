/**
 * M14-05 カード登録CSVアップロード のシードの作り方（画面操作）その5。正本: cases/M14-05_seed_data.tsv（IT-M14-05-073 の分だけ）
 *
 * 読み替え（シードの注記に残す）:
 *  - 名前・商品コード（RJ1405-001-旧名・RJ1405-001-CardEn・RJ1405-001-商品・M1405RJ-001）は、正本の値に実行の印を付けた。
 *    前の実行で名前を変えたカードと取り違えないため。
 *  - カード詳細ID 9140501 は固定せず、カードCSVの取込で画面が振った番号を使う（前の実行のカードが商品に紐づいたまま残り、固定の番号では取り込めないため）。
 *    カード更新用ファイルのカード詳細IDも、その番号で書く。
 *  - 画像URL(英語)は、画像が1枚あれば足りるので、試験用の値にした。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { カード名でカード, カードの詳細 } from "../db/m14_05_card_csv";
import { buildCardCsv, uploadCardCsv } from "../pages/admin/card_csv";
import { 雛形の見出し } from "../pages/admin/m14_05_csv";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { 該当件数 } from "../pages/admin/m03_04_x";
import { ProductSearchPage } from "../pages/admin/product_search";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1405_RJ_ADMIN: Account = { loginId: "m1405rj-adm", password: "Passw0rd-M1405RJ" };
export const RJ名 = {
  旧名: () => rc("RJ1405-001-旧名"), 新名: () => rc("RJ1405-001-新名"), 英名: () => rc("RJ1405-001-CardEn"),
  商品名: () => rc("RJ1405-001-商品"), コード: () => rc("M1405RJ-001"),
};

defineSeed("S-M14-05-RJ-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-05RJ試験管理者", account: M1405_RJ_ADMIN, メール: "m1405rj-adm@example.test" });
});

async function 商品を作る(page: Page, what: string, issue: (m: string) => void): Promise<string> {
  const categoryId = await readExistingGoodsChildCategoryId(page);
  await registerGoodsCsv(page, {
    what: `${what} のグッズ商品CSV登録`, fileName: "m1405-rj-001.csv", categoryId,
    lines: [{ code: RJ名.コード(), nameJp: RJ名.商品名(), nameEn: RJ名.商品名(), values: { "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0" } }],
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
    uploadWaitMs: 120_000,
  });
  return openProductEditByCode(page, RJ名.コード());
}

defineSeed("S-M14-05-RJ-CARD-073", { needs: ["S-M14-05-MASTERS"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 登録の前に、カード名に「RJ1405-001-」（実行の印つき）を含む商品が無いことを確かめる
    const s = new ProductSearchPage(page);
    await s.open();
    await s.ensureDetailVisible();
    await s.field("card_name").fill(rc("RJ1405-001-"));
    await s.submitAndWaitForResult();
    if ((await 該当件数(page)) !== 0) throw new Error(`${seed.シードID}: カード名に「${rc("RJ1405-001-")}」を含む商品が既にある`);
    const 商品ID = await 商品を作る(page, seed.シードID, issue);
    // カード登録CSVアップロード（35項目の見出し・1行）。カードセット Aether Revolt・レアリティ Uncommon・レイアウト Normal・プロモ種別 Non Promotion は参照マスタ
    const csv = buildCardCsv(await 雛形の見出し(page), [{
      name_jp: RJ名.旧名(), name_en: RJ名.英名(), set: "Aether Revolt", rarity: "Uncommon", layout: "Normal", promotion_type: "Non Promotion", foil: "0", cmc: "1", frame: "Normal",
      image_en: "img/m1405/rj-001-en.jpg",
    }]);
    await uploadCardCsv(page, csv, "m1405-rj-001-card.csv", `${seed.シードID} のカード登録CSV`, issue);
    const カード = カード名でカード(RJ名.英名());
    if (カード.length !== 1) throw new Error(`${seed.シードID}: 取り込んだカードが ${カード.length} 件（1件のはず）`);
    const 詳細 = カードの詳細(カード[0].カードID);
    if (詳細.length !== 1) throw new Error(`${seed.シードID}: カード詳細が ${詳細.length} 件（1件のはず）`);
    await assignCardOnProductEdit(page, { productId: 商品ID, cardNameJp: RJ名.旧名(), cardDetailId: 詳細[0].詳細ID, productNameJp: RJ名.商品名(), productNameEn: RJ名.商品名() }, (m) => issue(m));
    notes.set("〔商品ID-M1405-RJ001〕", 商品ID);
    issue(`カード名・商品名・商品コードは正本の値に実行の印を付けた（${RJ名.旧名()}・${RJ名.英名()}・${RJ名.商品名()}・${RJ名.コード()}）`);
    issue(`カード詳細ID 9140501 は固定せず、取込で画面が振った番号（${詳細[0].詳細ID}）を使った。カード更新用ファイルも同じ番号で書く`);
  });
});
