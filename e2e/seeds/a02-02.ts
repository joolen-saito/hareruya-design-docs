/**
 * A02-02 ポップアップ用カード情報取得（カードID）のシード。正本: cases/A02-02_seed_data.tsv。商品・商品規格の作り方は seeds/a02-builder.ts（A02-01 と共通）。
 *
 * 1つのシードで、カードを1枚（カードCSV登録で、商品ごとにカード詳細を1件）取り込み、その詳細ごとに商品を作る（カード詳細に商品を紐付ける）。
 * 正本の外の補い（記録にも書く）:
 * - カードセットは、シード表の「シードごとに登録」でなく、条件（通常/特殊 × 発売日2026-01-01/2025-01-01）ごとに決まった印で1度だけ作って使い回す
 *   （ケースが使う並び順の条件は同じ。依頼者決定 2026-11-14「マスタは作ってよい」）。
 * - 商品・商品規格は A02-01 と同じ作り方（グッズ商品CSV登録＋カード指定。カード商品CSV登録はスマレジ連携を決めるので使わない）。
 * - 店舗ID 1（シード表の「TC東京」）は、開発環境の店舗ID 1（本店）。画像は決まったファイル名で画面から置けないので、画像の行だけを DB に足す。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { カードを取り込む, セット } from "../pages/admin/a02_02_setup";
import { 商品の定め, 商品を作る, 規格の定め, 控える } from "./a02-builder";

const JP = "日本語" as const;
const EN = "英語" as const;

type 商品 = {
  印: string;
  セット: セット;
  プロモ?: boolean;
  Foil?: boolean;
  規格: 規格の定め[];
  商品名日?: string;
  商品名英?: string;
  商品画像?: string[];
};
const 規格 = (印: string, o: { 言語?: "日本語" | "英語"; 状態?: 規格の定め["状態"]; 価格?: string; 在庫?: number; 週?: number; 画像?: string } = {}): 規格の定め =>
  ({
    印, 言語: o.言語 ?? JP, 状態: o.状態 ?? "NM", 価格: o.価格 ?? "500", 在庫: o.在庫 ?? 1,
    ...(o.週 !== undefined ? { 週間販売数量: o.週 } : {}),
    ...(o.画像 ? { 規格画像: [{ ファイル名: o.画像, 順位: 1 }] } : {}),
  });
/** 規格1件の商品（規格の印は商品の印と同じ） */
const 単 = (印: string, セット: セット, o: { プロモ?: boolean; Foil?: boolean; 言語?: "日本語" | "英語"; 状態?: 規格の定め["状態"]; 価格?: string; 在庫?: number } = {}): 商品 =>
  ({ 印, セット, プロモ: o.プロモ, Foil: o.Foil, 規格: [規格(印, o)] });

function defineA0202Seed(seedId: string, 番号: string, 商品: 商品[]): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await 作る(browser, seedId, 番号, 商品, notes);
  });
}

async function 作る(browser: Browser, seedId: string, 番号: string, 商品: 商品[], notes: import("../lib/notes").Notes): Promise<void> {
  let カード: { カードID: string; カード詳細IDs: string[] } | undefined;
  const カード名日 = rc(`A02-02試験カード-${番号}`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    カード = await カードを取り込む(page, seedId, {
      カード名日, カード名英: rc(`A0202 Card ${番号}`),
      詳細: 商品.map((p) => ({ セット: p.セット, プロモ: !!p.プロモ, Foil: !!p.Foil })),
    }, (m) => reportSeedIssue(seedId, m));
  });
  if (!カード) throw new Error(`${seedId}: カードを取り込めなかった`);
  const 頭 = `A0202-${番号}`;
  for (const [i, p] of 商品.entries()) {
    const d: 商品の定め = {
      印: p.印, 商品名日: p.商品名日 ?? `A02-02試験商品-${番号}${p.印}`, 商品名英: p.商品名英 ?? `A02-02 Test Product ${番号}${p.印}`,
      カード: { カードID: カード.カードID, カード詳細ID: カード.カード詳細IDs[i], カード名: カード名日 },
      商品画像: p.商品画像, 規格: p.規格,
    };
    await 商品を作る(browser, seedId, 頭, d, notes);
  }
  控える(notes, seedId, `〔カードID-${頭}〕`, カード.カードID);
  reportSeedIssue(seedId, "カードは、カードCSV登録で商品ごとにカード詳細を1件ずつ取り込んだ（プロモのフラグはカード詳細(登録)画面では立てられないため）。カードセットは条件ごとに決まった印で1度だけ作って使い回した（依頼者決定 2026-11-14「マスタは作ってよい」）");
}

// ---- 環境・マスタ（画面から作るものは無い） ----
defineSeed("S-A02-02-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "APIベースURL・EC-CUBEベースURLは開発環境のもの（EC-CUBE の /api）。日本語サイトの jp 指定・デッキ詳細のカードポップアップの有効は環境の設定で、画面から確かめていない");
});
defineSeed("S-A02-02-MASTER", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗・在庫場所・言語・カード状態のマスタは DB シードで登録せず、開発環境に既にある店舗ID 1（本店。シード表の「TC東京」）・在庫場所 EC-CUBE・言語 JP・EN・カード状態 NM・SP を使った");
});

// ---- 基本（画像は商品画像と規格画像の同じファイル） ----
const 基本 = (番号: string, 商品名英: string): 商品[] => [{
  印: "", セット: "N26", 商品名日: `A02-02商品-${番号}`, 商品名英, 商品画像: [`img/goods/L/A02/jp/202001${番号}.jpg`],
  規格: [規格("", { 価格: "500", 在庫: 7, 画像: `img/goods/L/A02/jp/202001${番号}.jpg` })],
}];
defineA0202Seed("S-A02-02-BASE-001", "001", 基本("001", "A02-02 Product-A0202-001"));
defineA0202Seed("S-A02-02-BASE-002", "002", 基本("002", "A02-02 Product-002"));
defineA0202Seed("S-A02-02-BASE-003", "003", 基本("003", "A02-02 Product-A0202-003"));

// ---- 優先順位（販売価格・特殊・プロモ・発売日・Foil・在庫・言語・状態） ----
const 特プロ古フォイル100 = (印: string) => 単(印, "S25", { プロモ: true, Foil: true, 価格: "100" });
const 通常新非フォイル = (印: string, 価格: string) => 単(印, "N26", { 価格 });
defineA0202Seed("S-A02-02-PRICE-LOW-006", "006", [特プロ古フォイル100("A"), 通常新非フォイル("B", "900")]);
defineA0202Seed("S-A02-02-PRICE-HIGH-007", "007", [通常新非フォイル("A", "100"), 単("B", "S25", { プロモ: true, Foil: true, 価格: "900" })]);
defineA0202Seed("S-A02-02-PRICE-LOW-008", "008", [特プロ古フォイル100("A"), 通常新非フォイル("B", "900")]);
defineA0202Seed("S-A02-02-SPECIAL-009", "009", [単("A", "N26"), 単("B", "S26")]);
defineA0202Seed("S-A02-02-PROMOTION-010", "010", [単("A", "N26"), 単("B", "N26", { プロモ: true })]);
defineA0202Seed("S-A02-02-RELEASE-011", "011", [単("A", "N25"), 単("B", "N26")]);
defineA0202Seed("S-A02-02-NOFOIL-012", "012", [単("A", "N26"), 単("B", "N26", { Foil: true })]);
defineA0202Seed("S-A02-02-STOCK-013", "013", [単("A", "N26", { 在庫: 1 }), 単("B", "N26", { 在庫: 0 })]);
defineA0202Seed("S-A02-02-LANGUAGE-014", "014", [単("A", "N26", { 言語: JP }), 単("B", "N26", { 言語: EN })]);
defineA0202Seed("S-A02-02-CONDITION-015", "015", [単("A", "N26", { 状態: "NM" }), 単("B", "N26", { 状態: "SP" })]);
defineA0202Seed("S-A02-02-NOFOIL-SPECIAL-018", "018", [単("A", "N26", { Foil: true }), 単("B", "S26")]);
defineA0202Seed("S-A02-02-NOFOIL-PROMOTION-019", "019", [単("A", "N26", { Foil: true }), 単("B", "N26", { プロモ: true })]);
defineA0202Seed("S-A02-02-NOFOIL-RELEASE-020", "020", [単("A", "N26", { Foil: true }), 単("B", "N25")]);
defineA0202Seed("S-A02-02-WEEKLY-021", "021", [
  { 印: "A", セット: "N26", 規格: [規格("A", { 在庫: 1, 週: 2 }), 規格("B", { 状態: "SP", 在庫: 0, 週: 3 }), 規格("C", { 言語: EN, 在庫: 0, 週: 7 })] },
  { 印: "B", セット: "N26", 規格: [規格("D", { 在庫: 0, 週: 11 })] },
]);
defineA0202Seed("S-A02-02-RAW-022", "022", [{ 印: "", セット: "N26", 規格: [規格("", { 価格: "1234", 在庫: 7 })] }]);
defineA0202Seed("S-A02-02-NULL-023", "023", [{ 印: "", セット: "N26", 規格: [規格("", { 在庫: 1 })] }]);
defineA0202Seed("S-A02-02-LANG-JP-029", "029", [単("A", "N26", { 言語: EN }), 単("B", "N26", { 言語: JP })]);
defineA0202Seed("S-A02-02-LANG-EN-030", "030", [単("A", "N26", { 言語: JP }), 単("B", "N26", { 言語: EN })]);
defineA0202Seed("S-A02-02-RANK3-4-031", "031", [単("A", "S26"), 単("B", "N26", { プロモ: true })]);
defineA0202Seed("S-A02-02-RANK4-5-032", "032", [単("A", "N26", { プロモ: true }), 単("B", "N25")]);
defineA0202Seed("S-A02-02-RANK6-7-033", "033", [単("A", "N26", { Foil: true, 在庫: 1 }), 単("B", "N26", { 在庫: 0 })]);
defineA0202Seed("S-A02-02-RANK7-8-034", "034", [単("A", "N26", { 在庫: 0, 言語: JP }), 単("B", "N26", { 在庫: 1, 言語: EN })]);
defineA0202Seed("S-A02-02-RANK8-9-035", "035", [単("A", "N26", { 言語: EN, 状態: "NM" }), 単("B", "N26", { 言語: JP, 状態: "SP" })]);
defineA0202Seed("S-A02-02-FOILFALSE-SET-038", "038", [単("A", "S25", { プロモ: true }), 単("B", "N26", { Foil: true })]);
defineA0202Seed("S-A02-02-FOILFALSE-PRICE-039", "039", [通常新非フォイル("A", "100"), 単("B", "S25", { プロモ: true, Foil: true, 価格: "900" })]);

// ---- 1つの要因だけが違う組（言語・販売価格・Foilなどの絞り込みを個別に確かめる） ----
type 組 = { A: Parameters<typeof 単>[2] & { セット?: セット }; B: Parameters<typeof 単>[2] & { セット?: セット } };
function 組(seedId: string, 番号: string, x: 組): void {
  defineA0202Seed(seedId, 番号, [単("A", x.A.セット ?? "N26", x.A), 単("B", x.B.セット ?? "N26", x.B)]);
}
組("S-A02-02-CBFOIL-040", "040", { A: { 言語: EN, 価格: "300" }, B: { 言語: EN, Foil: true, 価格: "500" } });
組("S-A02-02-CBPRICEHIGH-041", "041", { A: { 言語: EN, Foil: true, 価格: "300" }, B: { 言語: EN, Foil: true, 価格: "500" } });
組("S-A02-02-CBPRICELOW-042", "042", { A: { 言語: EN, 価格: "500" }, B: { 言語: EN, 価格: "300" } });
組("S-A02-02-CBSPECIALFOIL-043", "043", { A: { 言語: EN, Foil: true, セット: "S26" }, B: { 言語: EN, Foil: true } });
組("S-A02-02-CBSPECIALNOFOIL-044", "044", { A: { セット: "S26" }, B: {} });
組("S-A02-02-CBPROMOFOIL-045", "045", { A: { 言語: EN, Foil: true, プロモ: true }, B: { 言語: EN, Foil: true } });
組("S-A02-02-CBPROMONOFOIL-046", "046", { A: { プロモ: true }, B: {} });
組("S-A02-02-CBRELEASEFOIL-047", "047", { A: { 言語: EN, Foil: true, セット: "N25" }, B: { 言語: EN, Foil: true } });
組("S-A02-02-CBRELEASENOFOIL-048", "048", { A: { セット: "N25" }, B: {} });
組("S-A02-02-CBNOFOILHIGH-049", "049", { A: { 言語: EN, Foil: true }, B: { 言語: EN } });
組("S-A02-02-CBNOFOILLOW-050", "050", { A: { Foil: true }, B: {} });
組("S-A02-02-CBSTOCKFOIL-051", "051", { A: { 言語: EN, Foil: true, 在庫: 0 }, B: { 言語: EN, Foil: true, 在庫: 1 } });
組("S-A02-02-CBSTOCKNOFOIL-052", "052", { A: { 在庫: 0 }, B: { 在庫: 1 } });
組("S-A02-02-CBLANGFOIL-053", "053", { A: { 言語: EN, Foil: true }, B: { 言語: JP, Foil: true } });
組("S-A02-02-CBLANGNOFOIL-054", "054", { A: { 言語: EN }, B: { 言語: JP } });
組("S-A02-02-CBCONDFOIL-055", "055", { A: { 言語: EN, Foil: true, 状態: "SP" }, B: { 言語: EN, Foil: true, 状態: "NM" } });
組("S-A02-02-CBCONDNOFOIL-056", "056", { A: { 状態: "SP" }, B: { 状態: "NM" } });
