/**
 * A06-08 カード名検索（MTGBuyer の API）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 * 001・012 が使うシードと、11/20 に足した 002・004・009・011・022・024 のシード（下の「11/20 に足したシード」）。
 * - S-A06-08-AUTH: 署名の鍵・送信元IPの許可は書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。
 * - S-A06-08-SHOPS: 店舗A・B は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店・試験支店に読み替えた（店舗は作らない）。
 * - S-A06-08-MASTERS: 言語 JP・状態 NM・レアリティ R は、マスタを書き換えず、試験用のカードと取込の値を使う（ケース 001・012 は値を確かめない）。
 * - S-A06-08-BASE: 状態ごとの規格の削除は、取込で状態NMの1規格だけを作るので行わない（消さない）。カードセット・プロモーション・略称タグの指定は入れていない。
 *   部門は、シード表が部門名を定めないので「A06-08部門」に決まった印を付けて部門登録画面で1度だけ登録し、使い回す（seeds/a06-buying.ts の 試験部門を用意する）。
 *   取込の部門IDの列に入れて商品規格に付け、〔部門ID-A0608-共有〕を控える（2026-11-17。控えていなかったので buildSeeds の確かめで落ちていた）。
 * - S-A06-08-NOTFOUND-012: 商品名が「A06-08不存在」で始まる商品は、数えるだけ（あれば止める。消さない）。
 */
import { 名前で始まる商品の数 } from "../db/a06";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 本店ID, 試験支店ID } from "../pages/admin/test_store";
import { カード商品を作る, 試験部門を用意する, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";

export const A0608_ADM_A = 買取の管理者の("a0608_admin_a", "Passw0rd!A0608A", "A0608管理者A");

defineSeed("S-A06-08-AUTH", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "署名の鍵・送信元IPの許可は書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。トークンは管理者のログイン API で受け取る");
});
defineSeed("S-A06-08-SHOPS", async ({ notes, seed }) => {
  notes.set("〔店舗ID-A0608-共有A〕", 本店ID);
  notes.set("〔店舗ID-A0608-共有B〕", 試験支店ID);
  reportSeedIssue(seed.シードID, "店舗A・B は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店（店舗ID 1）・試験支店（店舗ID 1574）に読み替えた");
});
defineSeed("S-A06-08-MASTERS", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "言語 JP・状態 NM・レアリティ R のマスタは書き換えず、既にある値を使う");
});
defineSeed("S-A06-08-ADM-A", { needs: ["S-A06-08-SHOPS"] }, async ({ browser, seed }) => {
  await 本店の管理者を用意する(browser, seed.シードID, A0608_ADM_A, "店舗A（店舗ID 608501）");
});
defineSeed("S-A06-08-BASE", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  // 部門を先に用意する（商品を作ってから控えの確かめで落ちて、残りが増えないように）
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-08部門");
  reportSeedIssue(seed.シードID, "シード表は部門名を定めないので「A06-08部門」（決まった印つき）とした");
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0608-BASE", 商品名日: "A06-08基本商品", 商品名英: "A06-08 Product", カード名日: "A06-08カード", カード名英: "A06-08 Card",
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: "a0608.jpg", 部門ID,
  });
  notes.set("〔部門ID-A0608-共有〕", 部門ID);
  for (const [k, v] of [["〔商品ID-A0608-共有〕", p.商品ID], ["〔商品規格ID-A0608-共有〕", p.規格ID], ["〔カードID-A0608-共有〕", p.カードID], ["〔カード詳細ID-A0608-共有〕", p.カード詳細ID]] as const) {
    if (v) notes.set(k, v);
  }
});
defineSeed("S-A06-08-NOTFOUND-012", async ({ seed }) => {
  const n = 名前で始まる商品の数("A06-08不存在");
  if (n !== 0) throw new Error(`${seed.シードID}: 商品名が「A06-08不存在」で始まる商品が ${n} 件ある（0件の前提を満たせない。消さない）`);
});

// ---- 11/20 に足したシード（002・004・009・011・022・024） ----
// 共通の読み替え（記録 review/A06-08_progress_2026-11-17_dev.md の 11/20 の節にも書く）:
// - 作り方の「状態ごとの規格の削除」は、取込で状態NMの1規格だけを作るので行わない（消さない）。
// - 部門は、シード表は商品1件につき部門を1件登録するとするが、ケースは部門IDを確かめないので、S-A06-08-BASE と同じ「A06-08部門」（決まった印つき）を使い回す。
// - 販売価格は、シード表が定めない商品では基準価格と同じ値にする。
// - 前方一致・記号の検索（002・004・022・024）は、検索語の直後に実行の印を入れた名前で作る（例「A06-08前方-<印>アルファ」）。
//   前の実行の商品と混ざらないようにするため（印を名前の末尾に付けると、前方一致の検索語に印が入らない）。ケースの検索語も同じ印つきの値にする。

/** 名前の途中に入れる印つきの前置き（ケースの検索語。spec と同じ値になる） */
export const A0608の前置き = {
  前方002: () => rc("A06-08前方"),
  状態除外004: () => rc("A06-08状態除外"),
  記号022: () => `${rc("A0608-CB022")}-A`,
  記号なし024: () => rc("A0608-CB024"),
};

async function 部門(browser: Parameters<typeof 試験部門を用意する>[0], seedId: string): Promise<string> {
  const id = await 試験部門を用意する(browser, seedId, "A06-08部門");
  reportSeedIssue(seedId, "シード表は商品1件につき部門を1件登録するとするが、ケースは部門IDを確かめないので「A06-08部門」（決まった印つき）を使い回した");
  return id;
}

// 002: 前方一致。「A06-08前方」で始まる2商品と、途中に含む1商品
defineSeed("S-A06-08-PREFIX-002", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 部門(browser, seed.シードID);
  const 前 = A0608の前置き.前方002();
  for (const [n, x, 名日, 名英] of [
    ["1", "A", `${前}アルファ`, `${前} Alpha`], ["2", "B", `${前}ベータ`, `${前} Beta`], ["3", "C", `中間${前}`, `Middle ${前}`],
  ] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0608-002-${n}`, 商品名日: 名日, 商品名英: 名英, 名前はそのまま: true, カード名日: `A06-08前方カード-${n}`, カード名英: `A06-08 Prefix Card ${n}`,
      基準価格: "1000", 販売価格: "1000", 買取価格: "500", 在庫: 1, 画像: `a0608-002-${n}.jpg`, 部門ID,
    });
    for (const [k, v] of [[`〔部門ID-A0608-002${x}〕`, 部門ID], [`〔商品ID-A0608-002${x}〕`, p.商品ID], [`〔商品規格ID-A0608-002${x}〕`, p.規格ID], [`〔カードID-A0608-002${x}〕`, p.カードID], [`〔カード詳細ID-A0608-002${x}〕`, p.カード詳細ID]] as const) {
      if (v) notes.set(k, v);
    }
  }
  const n = 名前で始まる商品の数(前);
  if (n !== 2) throw new Error(`${seed.シードID}: 商品名が「${前}」で始まる商品が ${n} 件（シード表は 2 件）`);
});

// 004: 有効・商品削除済み・商品規格削除済み・高額商品コードありの4商品
// シード表の「削除済み」は、刷新後の画面では公開状態「廃止」で表すので、入庫のあとで廃止にする（削除しない。A06-07 の 004 と同じ）
defineSeed("S-A06-08-FILTER-STATUS-004", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 部門(browser, seed.シードID);
  const 前 = A0608の前置き.状態除外004();
  for (const [n, x, 追加] of [["1", "A", {}], ["2", "B", { 商品を廃止: true }], ["3", "C", { 規格を廃止: true }], ["4", "D", { 高額商品コード: "HIGH" }]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0608-004-${n}`, 商品名日: `${前}-${n}`, 商品名英: `${前} ${n}`, 名前はそのまま: true, カード名日: `A06-08状態除外カード-${n}`, カード名英: `A06-08 Status Card ${n}`,
      基準価格: "1000", 販売価格: "1000", 買取価格: "500", 在庫: 1, 画像: `a0608-004-${n}.jpg`, 部門ID, ...追加,
    });
    for (const [k, v] of [[`〔部門ID-A0608-004${x}〕`, 部門ID], [`〔商品ID-A0608-004${x}〕`, p.商品ID], [`〔商品規格ID-A0608-004${x}〕`, p.規格ID], [`〔カードID-A0608-004${x}〕`, p.カードID], [`〔カード詳細ID-A0608-004${x}〕`, p.カード詳細ID]] as const) {
      if (v) notes.set(k, v);
    }
  }
  reportSeedIssue(seed.シードID, "シード表の「商品削除済み」「商品規格削除済み」は、刷新後の画面では公開状態「廃止」で表すので、入庫のあとで廃止にした（削除しない）");
});

/** 1商品のシード（名前は末尾に実行の印。ケースの検索語も同じ値） */
async function 一商品(browser: Parameters<typeof カード商品を作る>[0], notes: { set(k: string, v: string): void }, seedId: string, no: string,
  v: { 名日: string; 名英: string; 基準: string; 販売: string; 買取: string; 在庫: number }): Promise<void> {
  const 部門ID = await 部門(browser, seedId);
  const p = await カード商品を作る(browser, seedId, {
    商品コード: `A0608-${no}`, 商品名日: v.名日, 商品名英: v.名英, カード名日: `A06-08カード-${no}`, カード名英: `A06-08 Card ${no}`,
    基準価格: v.基準, 販売価格: v.販売, 買取価格: v.買取, 在庫: v.在庫, 画像: `a0608-${no}.jpg`, 部門ID,
  });
  for (const [k, val] of [[`〔商品ID-A0608-${no}〕`, p.商品ID], [`〔商品規格ID-A0608-${no}〕`, p.規格ID], [`〔カードID-A0608-${no}〕`, p.カードID], [`〔カード詳細ID-A0608-${no}〕`, p.カード詳細ID]] as const) {
    if (val) notes.set(k, val);
  }
  notes.set(`〔部門ID-A0608-${no}〕`, 部門ID);
}

// 009: 販売価格3456・基準価格2345・買取価格1200・本店の EC 在庫9
defineSeed("S-A06-08-PRICE-009", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  await 一商品(browser, notes, seed.シードID, "009", { 名日: "A06-08価格商品", 名英: "A06-08 Price Product", 基準: "2345", 販売: "3456", 買取: "1200", 在庫: 9 });
});

// 011: 買取価格1203・販売価格3405・基準価格2304・本店の EC 在庫17
defineSeed("S-A06-08-RAW-VALUES-011", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  await 一商品(browser, notes, seed.シードID, "011", { 名日: "A06-08無加工商品", 名英: "A06-08 Raw Product", 基準: "2304", 販売: "3405", 買取: "1203", 在庫: 17 });
});

// 022: 名前に「%」を含む商品Aと、「%」の位置が別の文字の商品B（検索語「…-A%」）
defineSeed("S-A06-08-CBSYMBOL-022", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 部門(browser, seed.シードID);
  const 前 = A0608の前置き.記号022();
  for (const [x, c, 名日, 画像] of [["A", "C1", `${前}%記号商品`, "a0608-cb022-a.jpg"], ["B", "C2", `${前}X記号商品`, "a0608-cb022-b.jpg"]] as const) {
    const p = await カード商品を作る(browser, seed.シードID, {
      商品コード: `A0608-CB022-${c}`, 商品名日: 名日, 商品名英: `${前} Symbol ${x}`, 名前はそのまま: true, カード名日: `A06-08記号カード-022${x}`, カード名英: `A06-08 Symbol Card 022${x}`,
      基準価格: "1000", 販売価格: "1000", 買取価格: "500", 在庫: 1, 画像, 部門ID,
    });
    for (const [k, v] of [[`〔部門ID-A0608-022${x}〕`, 部門ID], [`〔商品ID-A0608-022${x}〕`, p.商品ID], [`〔商品規格ID-A0608-022${x}〕`, p.規格ID], [`〔カードID-A0608-022${x}〕`, p.カードID], [`〔カード詳細ID-A0608-022${x}〕`, p.カード詳細ID]] as const) {
      if (v) notes.set(k, v);
    }
  }
});

// 024: 名前に「%」「_」を含まない1商品（検索語「A0608-CB024」）
defineSeed("S-A06-08-CBPLAIN-024", { needs: ["S-A06-08-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 部門ID = await 部門(browser, seed.シードID);
  const 前 = A0608の前置き.記号なし024();
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0608-CB024-C1", 商品名日: `${前}-記号なし商品`, 商品名英: `${前} Plain`, 名前はそのまま: true, カード名日: "A06-08記号なしカード-024", カード名英: "A06-08 Plain Card 024",
    基準価格: "1000", 販売価格: "1000", 買取価格: "500", 在庫: 1, 画像: "a0608-cb024-a.jpg", 部門ID,
  });
  for (const [k, v] of [["〔部門ID-A0608-024A〕", 部門ID], ["〔商品ID-A0608-024A〕", p.商品ID], ["〔商品規格ID-A0608-024A〕", p.規格ID], ["〔カードID-A0608-024A〕", p.カードID], ["〔カード詳細ID-A0608-024A〕", p.カード詳細ID]] as const) {
    if (v) notes.set(k, v);
  }
});
