/**
 * A06-07 買取用カード一覧取得（商品ID指定）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 * 書いたのは 001・002・008・011 が使うシードだけ。ほかのシード（カードセット・プロモーション・保管コード・部門の指定、同じ組の規格の重複、
 * 関連の欠けた商品、店舗Bの在庫、小数の価格、複数の言語・状態）は、共通の部品で作れる形がまだ無く、書いていない（記録に書く）。
 */
import { defineSeed } from "../lib/seeds";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";

export const A0607_ADM_A = 買取の管理者の("a0607_admin_a", "Passw0rd!A0607A", "A0607管理者A");

defineSeed("S-A06-07-ADM-A", async ({ browser, notes, seed }) => {
  const r = await 本店の管理者を用意する(browser, seed.シードID, A0607_ADM_A, "A0607店舗A");
  notes.set("〔店舗ID-A0607-共有A〕", r.店舗ID);
});

defineSeed("S-A06-07-BASE", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  for (const [n, 印] of [["1", "A"], ["2", "B"], ["3", "C"]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0607-REF-${n}`, 商品名日: `A0607参照商品${n}`, 商品名英: `A0607 REF Product ${n}`, カード名日: `A0607参照${n}`, カード名英: `A0607 REF ${n}`,
      基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: `a0607-ref-${n}.jpg`,
    });
    notes.set(`〔商品ID-A0607-共有${印}〕`, p.商品ID);
  }
});

defineSeed("S-A06-07-PRICE-008", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0607-PRICE-008", 商品名日: "A0607価格商品008", 商品名英: "A0607 PRICE Product 008", カード名日: "A0607価格008", カード名英: "A0607 PRICE 008",
    基準価格: "2345", 販売価格: "3456", 買取価格: "10", 在庫: 1, 画像: "a0607-008.jpg",
  });
  notes.set("〔商品ID-A0607-008〕", p.商品ID);
  notes.set("〔商品規格ID-A0607-008〕", p.規格ID);
  if (p.カードID) notes.set("〔カードID-A0607-008〕", p.カードID);
  if (p.カード詳細ID) notes.set("〔カード詳細ID-A0607-008〕", p.カード詳細ID);
});

defineSeed("S-A06-07-NONCARD-011", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0607-NONCARD-011", 商品名日: "A0607非カード商品011", 商品名英: "A0607 NONCARD Product 011", 基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 0,
  });
  notes.set("〔商品ID-A0607-011〕", p.商品ID);
  notes.set("〔商品規格ID-A0607-011〕", p.規格ID);
});

// 004: 4商品（A=有効・B=商品の公開状態を廃止・C=商品規格の公開状態を廃止・D=高額商品コード HIGH-004）。刷新後の画面では、削除済みを公開状態「廃止」で表す（シード表のとおり。削除しない）
defineSeed("S-A06-07-FILTER-STATUS-004", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  for (const [n, x, 追加] of [["1", "A", {}], ["2", "B", { 商品を廃止: true }], ["3", "C", { 規格を廃止: true }], ["4", "D", { 高額商品コード: "HIGH-004" }]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0607-STATUS-004-${n}`, 商品名日: `A0607状態商品004-${n}`, 商品名英: `A0607 STATUS Product 004 ${n}`, カード名日: `A0607状態004-${n}`, カード名英: `A0607 STATUS 004 ${n}`,
      基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: `a0607-004-${n}.jpg`, ...追加,
    });
    notes.set(`〔商品ID-A0607-004${x}〕`, p.商品ID);
  }
});

// 017: 1つのカード詳細に、言語JPの商品（NM・買取価格1111・基準価格3333・在庫5）と言語ENの商品（NM・買取価格2222・基準価格4444・在庫8）。部門は試験部門を1つ
defineSeed("S-A06-07-LANG-017", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A0607-017部門");
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A0607-017-カード", カード名英: "A0607-017-Card", 詳細数: 1 });
  const カード = { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 };
  for (const [言語, 印, 買取, 基準, 在庫] of [["日本語", "JP", "1111", "3333", 5], ["英語", "EN", "2222", "4444", 8]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0607-017-${印}`, 商品名日: `A0607-017-${印}商品`, 商品名英: `A0607-017-${印}-Product`, カード, 言語,
      基準価格: 基準, 販売価格: 基準, 買取価格: 買取, 在庫, 画像: "a0607-017.jpg", 部門ID,
    });
    notes.set(`〔商品ID-A0607-017-${印}〕`, p.商品ID);
    notes.set(`〔商品規格ID-A0607-017-${印}〕`, p.規格ID);
  }
  notes.set("〔カードID-A0607-017〕", カード.カードID);
  notes.set("〔カード詳細ID-A0607-017〕", カード.カード詳細ID);
  notes.set("〔部門ID-A0607-017〕", 部門ID);
});
