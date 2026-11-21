/**
 * M14-08 カードセット詳細(登録・編集・削除) のシードの作り方（画面操作）その5。正本: cases/M14-08_seed_data.tsv（IT-M14-08-048・049 の分だけ）
 * 商品編集画面のカードセット欄の選択肢の確認用。管理者（S-M14-08-L-ADM）は seeds/m14-08-c.ts にある。
 *
 * 読み替え（シードの注記に残す）:
 *  - 商品は、シード表の「DBシードで商品ID=20814900 を登録する」の代わりに、グッズ商品CSV登録で画面から1件登録した
 *    （商品コード・商品名は実行の印つき。商品ID は画面が振った番号を控えた。商品公開ステータス・支店の商品公開ステータスは非公開にした）。
 *    商品種別（パック）・サイズ10・重量20・販売制限5・在庫20 は、グッズ商品CSVの取込の値（サイズ1・重量1など）のままにした。
 *    ケースが確かめるのは商品編集画面のカードセット欄の選択肢だけで、この値には依らない。
 *  - カードセット名・略称は実行の印を付けた。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { カードセットを登録する } from "../pages/admin/m14_08_cardset";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";

export const 連携商品名 = () => rc("連携パック商品");
export const 連携商品コード = () => rc("M1408-L-PACK");

defineSeed("S-M14-08-L-PRODUCT", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: "m1408-l-pack.csv", categoryId,
      lines: [{ code: 連携商品コード(), nameJp: 連携商品名(), nameEn: 連携商品名(), productStatus: "非公開", branchStatus: "非公開",
        values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "10", "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0" } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const id = await openProductEditByCode(page, 連携商品コード());
    issue(`商品はグッズ商品CSV登録で画面から登録した（商品コード ${連携商品コード()}・商品名 ${連携商品名()}・商品ID ${id}。シード表に控える呼び名が無いので、ケースは商品コードで商品を開く）。商品種別・サイズ・重量・販売制限・在庫の値はシード表と同じにはしていない（ケースは商品編集画面のカードセット欄の選択肢だけを見る）`);
  });
});

defineSeed("S-M14-08-L-NEW-048", async () => { /* 同じ名称のカードセットは0件（印つきの名称で登録する） */ });

defineSeed("S-M14-08-L-DEL-049", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔カードセットID-M1408-049〕", await カードセットを登録する(page, { 名日: rc("LinkDelSet004"), 名英: rc("LinkDelSet004"), 略称: rc("LNKDEL004"), リリース日: "2026-10-01" }, seed.シードID));
    reportSeedIssue(seed.シードID, "カードセット名・略称は実行の印を付けた。リリース日は日付入力欄の形式（2026-10-01）で入れた");
  });
});
