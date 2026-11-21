/**
 * A06-07 買取用カード一覧取得（商品ID指定）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 * 書いたのは 001・002・008・011 が使うシードだけ。ほかのシード（カードセット・プロモーション・保管コード・部門の指定、同じ組の規格の重複、
 * 関連の欠けた商品、店舗Bの在庫、小数の価格、複数の言語・状態）は、共通の部品で作れる形がまだ無く、書いていない（記録に書く）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";
import { 試験支店の管理者を用意する } from "./a06-branch";
import { カード詳細の関連を外す, 規格の関連を外す, 商品の保管コードを外す, 在庫数を書く, 在庫場所 } from "../db/a06_rel";
import { 本店ID, 試験支店ID } from "../pages/admin/test_store";

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

// 004: 4商品（A=有効・B=商品の削除済み・C=商品規格の削除済み・D=高額商品コード HIGH-004（シード表の値））。シード表は「削除」、刷新後の画面では公開状態「廃止」で表すので、B・C は廃止にする（削除しない）
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

// ---- 2026-11-21 追加（005・006・009）。店舗B は試験支店に読み替え、画面で作れない状態は E2E の行にだけ DB で書く（seeds/a06-branch.ts・db/a06_rel.ts） ----
export const A0607_ADM_B = 買取の管理者の("a0607_admin_b", "Passw0rd!A0607B", "A0607管理者B");

defineSeed("S-A06-07-ADM-B", async ({ browser, notes, seed }) => {
  const r = await 試験支店の管理者を用意する(browser, seed.シードID, A0607_ADM_B, "A0607店舗B");
  notes.set("〔店舗ID-A0607-共有B〕", r.店舗ID);
});

// 005: A=必須の関連がそろう・B=商品画像なし・C=カードとの紐付けなし・D=カード詳細との紐付けなし・E=レアリティなし・F=言語なし・G=状態なし
defineSeed("S-A06-07-FILTER-RELATIONS-005", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  for (const x of ["A", "B", "C", "D", "E", "F", "G"] as const) {
    const n = "ABCDEFG".indexOf(x) + 1;
    const カードあり = x !== "C" && x !== "D";
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0607-REL-005${x}`, 商品名日: `A0607関連商品005-${n}`, 商品名英: `A0607 REL Product 005 ${n}`,
      ...(カードあり ? { カード名日: `A0607関連005-${n}`, カード名英: `A0607 REL 005 ${n}` } : {}),
      基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 0, ...(x === "B" ? {} : { 画像: `a0607-005${x.toLowerCase()}.jpg` }),
    });
    notes.set(`〔商品ID-A0607-005${x}〕`, p.商品ID);
    if (x === "E" && p.カード詳細ID) カード詳細の関連を外す(`${seed.シードID}: E のレアリティを外す`, p.カード詳細ID, ["レアリティ"]);
    if (x === "F") 規格の関連を外す(`${seed.シードID}: F の言語を外す`, p.規格ID, ["言語"]);
    if (x === "G") 規格の関連を外す(`${seed.シードID}: G の状態を外す`, p.規格ID, ["状態"]);
  }
  issue("C（カードとの紐付けなし）と D（カード詳細との紐付けなし）は、刷新後は商品がカード詳細にだけ紐付くので、どちらもカード指定をしない商品で作った");
  issue("E のレアリティ・F の言語・G の状態は画面で空にできないので、E2E のカード詳細・商品規格にだけ DB で空（null）にした（依頼者決定 2026-11-10）");
  issue("在庫は入れていない（在庫の行が無い・0 でも取得の条件を外れない。アプリは在庫を外部結合で読む）");
});

// 006: カードセット・プロモーション・保管コード・買取価格・部門が未設定（レアリティR・言語JP・状態NM・商品画像あり）
defineSeed("S-A06-07-OPTIONAL-006", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0607-OPT-006", 商品名日: "A0607任意商品006", 商品名英: "A0607 OPT Product 006", カード名日: "A0607任意006", カード名英: "A0607 OPT 006",
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 0, 画像: "a0607-006.jpg",
  });
  if (!p.カード詳細ID) throw new Error(`${seed.シードID}: カード詳細ID が控えられていない`);
  カード詳細の関連を外す(`${seed.シードID}: カードセット・プロモーションを外す`, p.カード詳細ID, ["カードセット", "プロモーション"]);
  規格の関連を外す(`${seed.シードID}: 買取価格・部門を外す`, p.規格ID, ["買取価格", "部門"]);
  商品の保管コードを外す(`${seed.シードID}: 保管コードを外す`, p.商品ID);
  issue("試験用のカードの作り（共通の部品）はカードセット・プロモ種別を付けるので、E2E のカード詳細のカードセット・プロモーション、E2E の商品の保管コード、商品規格の買取価格・部門を、DB で空（null）にした（画面で空にできない。依頼者決定 2026-11-10）");
  notes.set("〔商品ID-A0607-006〕", p.商品ID);
  notes.set("〔カードID-A0607-006〕", p.カードID ?? "");
  notes.set("〔カード詳細ID-A0607-006〕", p.カード詳細ID);
});

// 009: 店舗A（本店）の EC 在庫7・EC以外の在庫70、店舗B（試験支店）の EC 在庫9
defineSeed("S-A06-07-STOCK-009", { needs: ["S-A06-07-ADM-A", "S-A06-07-ADM-B"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0607-STOCK-009", 商品名日: "A0607在庫商品009", 商品名英: "A0607 STOCK Product 009", カード名日: "A0607在庫009", カード名英: "A0607 STOCK 009",
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: "a0607-009.jpg",
  });
  在庫数を書く(`${seed.シードID}: 本店の EC 以外の在庫`, p.規格ID, 本店ID, 在庫場所.EC以外, 70);
  在庫数を書く(`${seed.シードID}: 試験支店の EC 在庫`, p.規格ID, 試験支店ID, 在庫場所.EC, 9);
  issue("本店の EC 在庫7は入庫と承認で入れた。本店の EC 以外（スマレジ）の在庫70と、試験支店の EC 在庫9は、入庫の部品が本店・EC にしか入れられないので、E2E の商品規格の在庫の行にだけ DB で書いた（依頼者決定 2026-11-10）");
  notes.set("〔商品ID-A0607-009〕", p.商品ID);
  notes.set("〔商品規格ID-A0607-009〕", p.規格ID);
});
