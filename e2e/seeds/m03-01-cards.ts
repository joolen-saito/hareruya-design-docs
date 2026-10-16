/**
 * S-M03-01-TEXT-008・011・052、S-M03-01-FLAGS-015〜018: グッズ商品をCSV登録し、カードCSVで作ったカードを
 * 商品登録編集の「カード指定 >」で1件ずつ紐づける。正本: cases/M03-01_seed_data.tsv
 */
import { expect } from "@playwright/test";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import {
  buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, readExistingPromotionNameEn, uploadCardCsv,
} from "../pages/admin/card_csv";
import { goodsCategoryFromSharedMaster, registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import {
  readGoodsProductId, readGoodsProductIdsByNameAllLanguages, removeProductsMatchingName,
} from "../pages/admin/m03_01_goods_list_seed";
import { readLanguageChoicesFromClassForm } from "../pages/admin/m03_01_product_class";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ProductSearchPage } from "../pages/admin/product_search";
import { M0301_ADMIN } from "./m03-01";

type Language = "日本語" | "英語" | "その他言語";
type Goods = { code: string; nameJp: string; nameEn: string; language?: Language; idNote: string };
/** promo: Non Promotion 以外の既存の種別か。foil: 0（ノーマル）か 1（Foil） */
type Card = { nameJp: string; nameEn: string; promo: boolean; foil: "0" | "1" };
type CardGoodsSeed = {
  /** 登録前に商品名(日/英)で検索し、あれば完全に削除する語（008） */
  cleanupProductName?: string;
  /** 登録前にカード名で検索し、該当する商品が無いことを確かめる語（052。削除の指示は無い） */
  expectNoCardNameMatch?: string;
  goods: Goods[];
  /** 商品IDを、商品名で検索し言語の3項目をすべてチェックして控える（015〜018）。無ければ商品コードで控える */
  idsByNameAllLanguages?: string;
  /** goods[i] に cards[i] を紐づける */
  cards: Card[];
};

function defineCardGoodsSeed(seedId: string, s: CardGoodsSeed): void {
  defineSeed(seedId, { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
    if (s.cards.length !== s.goods.length) throw new Error(`${seedId}: 商品とカードの数が合わない`);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const categoryId = goodsCategoryFromSharedMaster(notes, seed.シードID);
    await withAdminSession(browser, M0301_ADMIN, async (page) => {
      if (s.cleanupProductName) await removeProductsMatchingName(page, s.cleanupProductName, true);
      if (s.expectNoCardNameMatch) {
        const search = new ProductSearchPage(page);
        await search.open();
        await search.ensureDetailVisible();
        await search.field("card_name").fill(s.expectNoCardNameMatch);
        await search.submitAndWaitForResult();
        await expect(page.locator('tr[id^="ex-product-"]'), `カード名「${s.expectNoCardNameMatch}」に該当する商品は無い`).toHaveCount(0);
      }

      // 言語(ID): 日本語は商品検索画面の値、英語・その他言語は商品規格の登録画面の言語欄から読む
      const languageIds = new Map<Language, string>();
      if (s.goods.some((g) => g.language && g.language !== "日本語")) {
        const choices = await readLanguageChoicesFromClassForm(page);
        const en = choices.find((c) => c.label === "英語");
        const other = choices.find((c) => c.label !== "日本語" && c.label !== "英語");
        if (!en || !other) throw new Error(`${seedId}: 言語欄に英語・日本語と英語以外の言語が無い: ${JSON.stringify(choices)}`);
        languageIds.set("英語", en.id);
        languageIds.set("その他言語", other.id);
        issue(`その他言語には、商品規格の登録画面の言語欄で日本語・英語以外の最初の言語「${other.label}」（${other.id}）を使った`);
      }
      const { japaneseLanguageId } = await registerGoodsCsv(page, {
        what: `${seed.シードID} の${s.goods.length}行グッズ商品CSV登録`,
        fileName: `${seedId.toLowerCase()}-goods.csv`,
        categoryId,
        lines: s.goods.map((g) => ({
          code: g.code, nameJp: g.nameJp, nameEn: g.nameEn,
          values: g.language && g.language !== "日本語" ? { "言語(ID)": languageIds.get(g.language)! } : undefined,
        })),
        onWarning: issue,
      });
      if (languageIds.size) expect(languageIds.get("英語"), "英語の番号は日本語と違う").not.toBe(japaneseLanguageId);

      const productIds: string[] = [];
      if (s.idsByNameAllLanguages) {
        const byCode = await readGoodsProductIdsByNameAllLanguages(page, s.idsByNameAllLanguages, s.goods.map((g) => g.code));
        for (const g of s.goods) productIds.push(byCode.get(g.code)!);
      } else {
        for (const g of s.goods) productIds.push(await readGoodsProductId(page, g.code, g.nameJp));
      }
      s.goods.forEach((g, i) => notes.set(g.idNote, productIds[i]));

      // カードCSV: 既存のカードの値と未使用のカード詳細IDを、カード一覧のCSV出力から決める
      const existing = await readExistingCardValues(page);
      const promotion = s.cards.some((c) => c.promo) ? await readExistingPromotionNameEn(page) : "";
      const detailIds = s.cards.map((_, i) => String(existing.nextUnusedDetailId + i));
      const headers = await downloadCardCsvTemplate(page);
      const csv = buildCardCsv(headers, s.cards.map((c, i) => ({
        name_jp: c.nameJp, name_en: c.nameEn,
        set: existing.set, rarity: existing.rarity, layout: existing.layout, image_en: existing.imageEn,
        promotion_type: c.promo ? promotion : "Non Promotion", foil: c.foil, card_detail_id: detailIds[i],
      })));
      await uploadCardCsv(page, csv, `${seedId.toLowerCase()}-cards.csv`, `${seed.シードID} の${s.cards.length}行カードCSV登録`, issue);

      for (let i = 0; i < s.goods.length; i++) {
        await assignCardOnProductEdit(page, {
          productId: productIds[i], cardNameJp: s.cards[i].nameJp, cardDetailId: detailIds[i],
          productNameJp: s.goods[i].nameJp, productNameEn: s.goods[i].nameEn,
        }, issue);
      }
    });
  });
}

defineCardGoodsSeed("S-M03-01-TEXT-008", {
  cleanupProductName: "青空テスト商品-008",
  goods: [{ code: "M03ALPHABETA-008", nameJp: "青空テスト商品-008", nameEn: "AzureTestProduct-008", idNote: "〔商品ID-M0301-008〕" }],
  cards: [{ nameJp: "稲妻魔法カード-008", nameEn: "M0301 Card 008", promo: false, foil: "0" }],
});

defineCardGoodsSeed("S-M03-01-TEXT-011", {
  goods: [
    { code: "M0301S-011A", nameJp: "カード検索商品甲011", nameEn: "カード検索商品甲011", idNote: "〔商品ID-M0301-011A〕" },
    { code: "M0301S-011B", nameJp: "カード検索商品乙011", nameEn: "カード検索商品乙011", idNote: "〔商品ID-M0301-011B〕" },
  ],
  cards: [
    { nameJp: "稲妻魔法カード-011", nameEn: "M0301 Name 011A", promo: false, foil: "0" },
    { nameJp: "稲妻魔法のみ-011", nameEn: "M0301 Name 011B", promo: false, foil: "0" },
  ],
});

/** 015〜018 は同じ形。A=日本語・プロモ・Foil、B=英語・プロモ・ノーマル、C=その他言語・ノーマル・Foil */
function flagsSeed(n: string): CardGoodsSeed {
  const name = `区分商品-${n}`;
  return {
    idsByNameAllLanguages: name,
    goods: [
      { code: `M0301S-${n}A`, nameJp: name, nameEn: name, language: "日本語", idNote: `〔商品ID-M0301-${n}A〕` },
      { code: `M0301S-${n}B`, nameJp: name, nameEn: name, language: "英語", idNote: `〔商品ID-M0301-${n}B〕` },
      { code: `M0301S-${n}C`, nameJp: name, nameEn: name, language: "その他言語", idNote: `〔商品ID-M0301-${n}C〕` },
    ],
    cards: [
      { nameJp: `区分カード甲${n}`, nameEn: `M0301 Flag ${n}A`, promo: true, foil: "1" },
      { nameJp: `区分カード乙${n}`, nameEn: `M0301 Flag ${n}B`, promo: true, foil: "0" },
      { nameJp: `区分カード丙${n}`, nameEn: `M0301 Flag ${n}C`, promo: false, foil: "1" },
    ],
  };
}
defineCardGoodsSeed("S-M03-01-FLAGS-015", flagsSeed("015"));
defineCardGoodsSeed("S-M03-01-FLAGS-016", flagsSeed("016"));
defineCardGoodsSeed("S-M03-01-FLAGS-017", flagsSeed("017"));
defineCardGoodsSeed("S-M03-01-FLAGS-018", flagsSeed("018"));

defineCardGoodsSeed("S-M03-01-TEXT-052", {
  expectNoCardNameMatch: "M0301-052-ThunderCard",
  goods: [
    { code: "M0301S-052A", nameJp: "カード英名甲-052", nameEn: "カード英名甲-052", idNote: "〔商品ID-M0301-052A〕" },
    { code: "M0301S-052B", nameJp: "カード英名乙-052", nameEn: "カード英名乙-052", idNote: "〔商品ID-M0301-052B〕" },
  ],
  cards: [
    { nameJp: "雷鳴の札甲-052", nameEn: "M0301-052-ThunderCard", promo: false, foil: "0" },
    { nameJp: "炎熱の札乙-052", nameEn: "M0301-052-FlameCard", promo: false, foil: "0" },
  ],
});
