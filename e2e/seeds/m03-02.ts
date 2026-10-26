/**
 * M03-02 商品登録編集の画面シード。正本: cases/M03-02_seed_data.tsv
 *
 * 作るシード: ADM・NOTFOUND-003・READ-DISCONTINUED（ケース 003・031・036 が使う）。
 *
 * 作らないシード（実装しないケースだけが使う）:
 * - DBへの直接設定が要る: S-M03-02-MASTERS（販売割引率・買取減額率）・QA-MASTERS（販売割引率）・RA-MASTER、
 *   READ-BASE・READ-NOVARIANT（画像・登録日・更新日など）・CARDS・DATE-026・MISSING-IMAGE-029・L-GOODS-048・L-SALE-049・
 *   L-DETAIL-050・CBKEEP-093 と、これらに頼るケース専用のシード
 *
 * READ-DISCONTINUED は、正本の作り方が共有マスタ（S-M03-02-MASTERS）の「旧カテゴリ」「購入グループA」「割引率A」を使う。
 * MASTERS は割引率AをDBへ直接設定するので作らない。代わりに、画面にある値で作る（シードの問題として報告に出す）:
 * - 商品カテゴリ(ID): 正本の「旧カテゴリ」は MASTERS で最上位に作るカテゴリで、グッズ商品CSVは「サプライ・グッズ」等の配下しか
 *   受け付けない（設計書 M03-27・アプリの取込の検証）ので、正本どおりでも取り込めない。「サプライ・グッズ」のIDを使い、
 *   〔カテゴリID-M0302-共有D〕にそのIDを控える（シード表が控えると定めた呼び名なので、控えないと基盤が止める）
 * - 購入グループ名称: 既存の購入グループの名称（画面の一覧の先頭）
 * - 割引率: 選択肢の先頭
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ProductEditForm, searchByCodeWithoutFilters, searchWithAllStatuses, statusValue } from "../pages/admin/m03_02_product";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ensureMember } from "../pages/admin/member";
import { ProductSearchPage } from "../pages/admin/product_search";

export const M0302_ADMIN: Account = { loginId: "m0302_admin", password: "Passw0rd!M0302" };

/** アプリが本店（親店舗）として扱う店舗ID。正本は所属店舗を指定しないので本店にする */
const MAIN_SHOP_ID = "1";

defineSeed("S-M03-02-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const shop = await storeNameById(page, MAIN_SHOP_ID);
    await ensureMember(page, {
      名前: "M03-02試験管理者", 所属店舗: shop, ログインID: M0302_ADMIN.loginId, メールアドレス: "m0302_admin@example.test",
      パスワード: M0302_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
  // ログインでき、商品管理（商品マスター）を操作できること
  await withAdminSession(browser, M0302_ADMIN, async (page) => {
    const search = new ProductSearchPage(page);
    await search.open();
  });
});

defineSeed("S-M03-02-NOTFOUND-003", { needs: ["S-M03-02-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, M0302_ADMIN, async (page) => {
    const rows = await searchWithAllStatuses(page, "product_id", "999999");
    // 正本は該当があれば完全削除するが、該当は無い前提で作っている（無ければ削除の操作は要らない）。あれば消さずに止める
    if (rows.length > 0) throw new Error(`商品ID 999999 が商品マスターに ${rows.length} 件ある（${JSON.stringify(rows)}）。完全削除の操作は実装していないので止めた`);
    await expect(page.getByText("検索条件に合致するデータが見つかりませんでした"), "商品ID 999999 の検索結果が0件").toBeVisible();
  });
});

const DISCONTINUED = { code: "M0302-READ-DISCONTINUED", nameJp: "廃止済み商品", nameEn: "Discontinued Product" };

defineSeed("S-M03-02-READ-DISCONTINUED", { needs: ["S-M03-02-ADM"] }, async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, M0302_ADMIN, async (page) => {
    const categoryId = await goodsCsvCategoryId(page, issue);
    notes.set("〔カテゴリID-M0302-共有D〕", categoryId);
    issue(`正本の「旧カテゴリ」（S-M03-02-MASTERS。最上位のカテゴリ）は作らず、グッズ商品CSVが受け付ける「サプライ・グッズ」（ID ${categoryId}）を商品カテゴリ(ID)に使い、〔カテゴリID-M0302-共有D〕に控えた`);

    // 共有可: あれば使う（同じ商品コードの商品が1件で、商品名が正本どおりなら）
    let rows = await searchByCodeWithoutFilters(page, DISCONTINUED.code);
    if (rows.length > 1) throw new Error(`商品コード ${DISCONTINUED.code} の商品が ${rows.length} 件ある`);
    const edit = new ProductEditForm(page);
    if (rows.length === 1) {
      expect(rows[0].商品名, "既存の廃止済み商品の商品名").toBe(DISCONTINUED.nameJp);
      notes.set("〔商品ID-M0302-共有D〕", rows[0].商品ID);
      // 廃止済みなら、商品公開ステータスの欄と「商品を登録」が画面に無い（作りは product.twig）。廃止になっていなければ廃止にする
      await edit.open(rows[0].商品ID);
      if (await edit.商品を登録.count() === 0) {
        issue(`前の実行で作った商品ID ${rows[0].商品ID} を使った（廃止済み）`);
        return;
      }
      issue(`前の実行で作った商品ID ${rows[0].商品ID} が廃止になっていなかったので、廃止にした`);
    } else {
      const template = await downloadGoodsCsvTemplate(page);
      const 非公開 = statusValue(template, "商品公開ステータス", "非公開");
      const 支店非公開 = statusValue(template, "支店の商品公開ステータス", "非公開");
      await registerGoodsCsv(page, {
        what: `${seed.シードID}: グッズ商品CSV登録`,
        fileName: "m0302-read-discontinued.csv",
        categoryId,
        lines: [{ code: DISCONTINUED.code, nameJp: DISCONTINUED.nameJp, nameEn: DISCONTINUED.nameEn }],
        common: {
          "商品公開ステータス": 非公開, "支店の商品公開ステータス": 支店非公開,
          "サイズ": "10", "重量": "20", "販売制限数": "5", "基準価格": "100", "販売価格": "100", "買取価格": "10",
          "スマレジ連携フラグ": "0",
        },
        onWarning: issue,
      });
      issue("購入グループ名称は、正本の「購入グループA」（S-M03-02-MASTERS）でなく、画面の一覧の先頭の既存の購入グループを使った");
      rows = await searchWithAllStatuses(page, "product_code", DISCONTINUED.code);
      expect(rows.length, `取り込んだ商品コード ${DISCONTINUED.code} の商品が1件`).toBe(1);
      expect(rows[0].商品名, "取り込んだ商品の商品名").toBe(DISCONTINUED.nameJp);
      notes.set("〔商品ID-M0302-共有D〕", rows[0].商品ID);
      await edit.open(rows[0].商品ID);
    }
    const discounts = await edit.割引率の選択肢();
    if (discounts.length === 0) throw new Error("割引率に選べる値が無い");
    await edit.割引率.selectOption({ label: discounts[0] });
    issue(`割引率は、正本の「割引率A」（S-M03-02-MASTERS。DBへ直接設定する）でなく、選択肢の先頭「${discounts[0]}」を選んだ`);
    // 販売制限は商品編集画面の必須項目（ProductType の地域別販売制限）。正本の作り方はグッズ商品CSVの地域別販売制限を書かず、
    // 取り込んだ商品は未選択のまま（そのまま保存すると「入力されていません。」で保存できない）。未選択なら「制限なし」を選ぶ
    if (!(await edit.販売制限の選択())) {
      await edit.販売制限を選ぶ("制限なし");
      issue("販売制限が未選択（グッズ商品CSVの地域別販売制限を正本が書いていない）で保存できないので、商品編集画面で「制限なし」を選んだ（正本の作り方の外）");
    }
    await edit.商品公開ステータスを選ぶ("廃止");
    for (const w of await edit.登録(`${seed.シードID}: 商品公開ステータスを廃止にして「商品を登録」`)) issue(`保存のときの警告: ${w}`);
    // 保存のあと、廃止済みの画面（商品公開ステータスの欄と「商品を登録」が無い）になったこと
    await edit.open(notes.get("〔商品ID-M0302-共有D〕"));
    await expect(edit.商品を登録, "廃止にしたあと、「商品を登録」ボタンが無い").toHaveCount(0);
  });
});
