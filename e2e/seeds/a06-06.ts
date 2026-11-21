/**
 * A06-06 買取用カード一覧取得（カード詳細ID指定）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 * 書いたのは 001・008・011 が使うシードだけ。シード表の「状態NM以外の商品規格を削除する」は、取込で状態NMの1規格だけを作るので行わない（消さない）。
 * 部門は、シード表の部門名「A06-06部門001」に決まった印を付けて部門登録画面で1度だけ登録し、使い回す（seeds/a06-buying.ts の 試験部門を用意する）。
 *   取込の部門IDの列に入れて商品規格に付け、〔部門ID-A0606-001〕を控える（2026-11-17。控えていなかったので buildSeeds の確かめで落ちていた）。
 * カードセット・プロモーション・略称タグ（保管コード）の指定は、共通の部品で作れる形がまだ無く入れていない（001・008 は確かめない）。
 */
import { カード詳細の数 } from "../db/a06";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";
import { 試験支店の管理者を用意する } from "./a06-branch";
import { カード詳細の関連を外す, 規格の関連を外す, 規格の状態を変える, 商品の保管コードを外す, 在庫数を書く, 在庫場所 } from "../db/a06_rel";
import { 本店ID, 試験支店ID } from "../pages/admin/test_store";

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

// ---- 2026-11-21 追加（005・009・012・018）。店舗B は試験支店に読み替え、画面で作れない状態は E2E の行にだけ DB で書く（seeds/a06-branch.ts・db/a06_rel.ts）。
// シード表の「状態NM以外の商品規格を削除する」は、取込で状態NMの1規格だけを作るので行わない（消さない） ----
export const A0606_ADM_B = 買取の管理者の("a0606_admin_b", "Passw0rd!A0606B", "店舗B試験管理者");

defineSeed("S-A06-06-ADM-B", async ({ browser, notes, seed }) => {
  const r = await 試験支店の管理者を用意する(browser, seed.シードID, A0606_ADM_B, "A06-06店舗B");
  notes.set("〔店舗ID-A0606-共有B〕", r.店舗ID);
});

// 005: 1枚のカードにカード詳細6件。A=必須の関連がそろう・B=商品画像0件・C=レアリティなし・D=付随情報なし・E=付随情報の言語なし・F=付随情報の状態なし
defineSeed("S-A06-06-FILTER-RELATIONS-005", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A06-06関連005", カード名英: "A06-06 REL 005", 詳細数: 6 });
  notes.set("〔カードID-A0606-005〕", card.カードID);
  for (const [i, x] of ["A", "B", "C", "D", "E", "F"].entries()) {
    notes.set(`〔カード詳細ID-A0606-005${x}〕`, card.カード詳細IDs[i]);
    if (x === "D") continue; // 付随情報なし: 商品を紐付けない（下の注記）
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0606-REL-005${x}`, 商品名日: `A06-06関連商品005${x}`, 商品名英: `A06-06 REL Product 005${x}`,
      カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[i], カード名: card.カード名 },
      基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 0, ...(x === "B" ? {} : { 画像: `a0606-005${x.toLowerCase()}.jpg` }),
    });
    if (x === "A") { notes.set("〔商品ID-A0606-005A〕", p.商品ID); notes.set("〔商品規格ID-A0606-005A〕", p.規格ID); }
    if (x === "C") カード詳細の関連を外す(`${seed.シードID}: C のレアリティを外す`, card.カード詳細IDs[i], ["レアリティ"]);
    if (x === "E") 規格の関連を外す(`${seed.シードID}: E の言語を外す`, p.規格ID, ["言語"]);
    if (x === "F") 規格の関連を外す(`${seed.シードID}: F の状態を外す`, p.規格ID, ["状態"]);
  }
  issue("D（買取価格と部門IDを保持する付随情報なし）: 刷新後は買取価格・部門を商品規格が持ち、別の付随情報の行が無い。そのため、カード詳細 D には商品を紐付けない形で作った（応答の元になる商品の情報が無い）");
  issue("C のレアリティ・E の言語・F の状態は画面で空にできないので、E2E のカード詳細・商品規格にだけ DB で空（null）にした（依頼者決定 2026-11-10）。在庫は入れていない（アプリは在庫を外部結合で読む）");
});

// 009: 店舗A（本店）の EC 在庫7・EC以外の在庫70、店舗B（試験支店）の EC 在庫9
defineSeed("S-A06-06-STOCK-009", { needs: ["S-A06-06-ADM-A", "S-A06-06-ADM-B"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0606-STOCK-009", 商品名日: "A06-06在庫商品009", 商品名英: "A06-06 STOCK Product 009", カード名日: "A06-06在庫009", カード名英: "A06-06 STOCK 009",
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: "a0606-009.jpg",
  });
  在庫数を書く(`${seed.シードID}: 本店の EC 以外の在庫`, p.規格ID, 本店ID, 在庫場所.EC以外, 70);
  在庫数を書く(`${seed.シードID}: 試験支店の EC 在庫`, p.規格ID, 試験支店ID, 在庫場所.EC, 9);
  issue("本店の EC 在庫7は入庫と承認で入れた。本店の EC 以外（スマレジ）の在庫70と、試験支店の EC 在庫9は、入庫の部品が本店・EC にしか入れられないので、E2E の商品規格の在庫の行にだけ DB で書いた（依頼者決定 2026-11-10）");
  notes.set("〔カードID-A0606-009〕", p.カードID ?? "");
  notes.set("〔カード詳細ID-A0606-009〕", p.カード詳細ID ?? "");
  notes.set("〔商品ID-A0606-009〕", p.商品ID);
  notes.set("〔商品規格ID-A0606-009〕", p.規格ID);
});

// 012: カードセット・プロモーション・略称タグ・買取価格・部門IDが未設定（基準価格2345・EC在庫7）
defineSeed("S-A06-06-OPTIONAL-012", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0606-OPT-012", 商品名日: "A06-06任意商品012", 商品名英: "A06-06 OPT Product 012", カード名日: "A06-06任意012", カード名英: "A06-06 OPT 012",
    基準価格: "2345", 販売価格: "2345", 買取価格: "10", 在庫: 7, 画像: "a0606-012.jpg",
  });
  if (!p.カード詳細ID) throw new Error(`${seed.シードID}: カード詳細ID が控えられていない`);
  カード詳細の関連を外す(`${seed.シードID}: カードセット・プロモーションを外す`, p.カード詳細ID, ["カードセット", "プロモーション"]);
  規格の関連を外す(`${seed.シードID}: 買取価格・部門を外す`, p.規格ID, ["買取価格", "部門"]);
  商品の保管コードを外す(`${seed.シードID}: 略称タグを外す`, p.商品ID);
  issue("試験用のカードの作り（共通の部品）はカードセット・プロモ種別を付けるので、E2E のカード詳細のカードセット・プロモーション、E2E の商品の略称タグ（保管コード）、商品規格の買取価格・部門を、DB で空（null）にした（画面で空にできない。依頼者決定 2026-11-10）");
  notes.set("〔カードID-A0606-012〕", p.カードID ?? "");
  notes.set("〔カード詳細ID-A0606-012〕", p.カード詳細ID);
  notes.set("〔商品ID-A0606-012〕", p.商品ID);
  notes.set("〔商品規格ID-A0606-012〕", p.規格ID);
});

// 018: 1つのカード詳細に、言語JP・状態NMの商品（買取1111・基準3333・在庫5）と言語EN・状態SPの商品（買取2222・基準4444・在庫8）。部門は共通
defineSeed("S-A06-06-LANGCOND-018", { needs: ["S-A06-06-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A0606-018部門");
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A0606-018カード", カード名英: "A0606-018-Card", 詳細数: 1 });
  const カード = { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 };
  for (const [言語, 印, 買取, 基準, 在庫] of [["日本語", "JP", "1111", "3333", 5], ["英語", "EN", "2222", "4444", 8]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0606-018-${印}`, 商品名日: `A0606-018-${印}商品`, 商品名英: `A0606-018-${印}-Product`, カード, 言語,
      基準価格: 基準, 販売価格: 基準, 買取価格: 買取, 在庫, 画像: "a0606-018.jpg", 部門ID,
    });
    if (印 === "EN") 規格の状態を変える(`${seed.シードID}: EN の商品規格を状態SPにする`, p.規格ID, "SP");
    notes.set(`〔商品ID-A0606-018-${印}〕`, p.商品ID);
    notes.set(`〔商品規格ID-A0606-018-${印}〕`, p.規格ID);
  }
  issue("取込の部品（seeds/a06-buying.ts）は状態NMの商品規格だけを作る。EN の商品規格だけ、状態のマスタにある SP を DB で選んだ（E2E の商品規格だけ。マスタは書き換えない。依頼者決定 2026-11-10）");
  notes.set("〔カードID-A0606-018〕", カード.カードID);
  notes.set("〔カード詳細ID-A0606-018〕", カード.カード詳細ID);
  notes.set("〔部門ID-A0606-018〕", 部門ID);
});
