/**
 * A06-06 買取用カード一覧取得（カード詳細ID指定）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 * 書いたのは 001・008・011 が使うシードだけ。シード表の「状態NM以外の商品規格を削除する」は、取込で状態NMの1規格だけを作るので行わない（消さない）。
 * 部門は、シード表の部門名「A06-06部門001」に決まった印を付けて部門登録画面で1度だけ登録し、使い回す（seeds/a06-buying.ts の 試験部門を用意する）。
 *   取込の部門IDの列に入れて商品規格に付け、〔部門ID-A0606-001〕を控える（2026-11-17。控えていなかったので buildSeeds の確かめで落ちていた）。
 * カードセット・プロモーション・略称タグ（保管コード）の指定は、共通の部品で作れる形がまだ無く入れていない（001・008 は確かめない）。
 */
import { カード詳細の数 } from "../db/a06";
import { defineSeed } from "../lib/seeds";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";

export const A0606_ADM_A = 買取の管理者の("a0606_admin_a", "Passw0rd!A0606A", "店舗A試験管理者");

defineSeed("S-A06-06-ADM-A", async ({ browser, notes, seed }) => {
  const r = await 本店の管理者を用意する(browser, seed.シードID, A0606_ADM_A, "A06-06店舗A");
  notes.set("〔店舗ID-A0606-共有A〕", r.店舗ID);
});

defineSeed("S-A06-06-BASE-001", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  // 部門を先に用意する（商品を作ってから控えの確かめで落ちて、残りが増えないように）
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-06部門001");
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0606-BASE-001", 商品名日: "A06-06商品", 商品名英: "A06-06 Product", カード名日: "A06-06カード", カード名英: "A06-06 Card",
    基準価格: "2345", 販売価格: "2345", 買取価格: "1234", 在庫: 7, 画像: "a0606-001.jpg", 部門ID,
  });
  notes.set("〔部門ID-A0606-001〕", 部門ID);
  notes.set("〔商品ID-A0606-001〕", p.商品ID);
  notes.set("〔商品規格ID-A0606-001〕", p.規格ID);
  notes.set("〔カードID-A0606-001〕", p.カードID ?? "");
  notes.set("〔カード詳細ID-A0606-001〕", p.カード詳細ID ?? "");
});

defineSeed("S-A06-06-PRICE-008", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0606-PRICE-008", 商品名日: "A06-06価格商品008", 商品名英: "A06-06 PRICE Product 008", カード名日: "A06-06価格008", カード名英: "A06-06 PRICE 008",
    基準価格: "2345", 販売価格: "3456", 買取価格: "10", 在庫: 1, 画像: "a0606-008.jpg",
  });
  notes.set("〔商品ID-A0606-008〕", p.商品ID);
  notes.set("〔商品規格ID-A0606-008〕", p.規格ID);
  notes.set("〔カードID-A0606-008〕", p.カードID ?? "");
  notes.set("〔カード詳細ID-A0606-008〕", p.カード詳細ID ?? "");
});

defineSeed("S-A06-06-NOTFOUND-011", async ({ seed }) => {
  if (カード詳細の数("699999011") !== 0) throw new Error(`${seed.シードID}: カード詳細ID 699999011 がある（未登録の前提を満たせない。消さない）`);
});

// 003: 同じカードにカード詳細2件、それぞれに商品（状態NM・在庫1）
defineSeed("S-A06-06-OTHER-DETAILS-003", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A06-06他詳細003", カード名英: "A06-06 OTHER 003", 詳細数: 2 });
  notes.set("〔カードID-A0606-003〕", card.カードID);
  for (const [i, x] of [[0, "A"], [1, "B"]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0606-OTHER-003${x}`, 商品名日: `A06-06他詳細商品003${x}`, 商品名英: `A06-06 OTHER Product 003${x}`,
      カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[i], カード名: card.カード名 },
      基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 1, 画像: `a0606-003${x.toLowerCase()}.jpg`,
    });
    notes.set(`〔カード詳細ID-A0606-003${x}〕`, card.カード詳細IDs[i]);
    notes.set(`〔商品ID-A0606-003${x}〕`, p.商品ID);
    notes.set(`〔商品規格ID-A0606-003${x}〕`, p.規格ID);
  }
});

// 004: 同じカードにカード詳細4件（A=有効・B=商品の削除済み・C=商品規格の削除済み・D=高額商品コード HIGH（シード表の値））。シード表は「削除」、刷新後の画面では公開状態「廃止」で表すので、B・C は廃止にする（削除しない）
defineSeed("S-A06-06-FILTER-STATUS-004", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A06-06状態004", カード名英: "A06-06 STATUS 004", 詳細数: 4 });
  notes.set("〔カードID-A0606-004〕", card.カードID);
  for (const [i, x, 追加] of [[0, "A", {}], [1, "B", { 商品を廃止: true }], [2, "C", { 規格を廃止: true }], [3, "D", { 高額商品コード: "HIGH" }]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0606-STATUS-004${x}`, 商品名日: `A06-06状態商品004${x}`, 商品名英: `A06-06 STATUS Product 004${x}`,
      カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[i], カード名: card.カード名 },
      基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 1, 画像: `a0606-004${x.toLowerCase()}.jpg`, ...追加,
    });
    notes.set(`〔カード詳細ID-A0606-004${x}〕`, card.カード詳細IDs[i]);
    if (x === "A" || x === "B") notes.set(`〔商品ID-A0606-004${x}〕`, p.商品ID);
    if (x !== "B") notes.set(`〔商品規格ID-A0606-004${x}〕`, p.規格ID);
  }
});
