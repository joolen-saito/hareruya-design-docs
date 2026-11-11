/**
 * A02-03 ポップアップ用商品情報取得（旧商品ID）のシード。正本: cases/A02-03_seed_data.tsv。作り方は seeds/a02-builder.ts（正本の外の補いもそこに書く）。
 *
 * 正本の外の補い（記録にも書く）:
 * - 旧商品ID・旧英語商品ID（A0203BASEJN-001 など）はカードのマスタの値で、決め打ちの値に書き換えられない（カードのマスタは作らない・書き換えない）。
 *   開発環境に既にある、旧商品ID・旧英語商品IDが入っていて同じ値の別のカードが無く、カード詳細が1件で商品が1つも付いていないカードを1シードに1枚選び、
 *   ケースの旧商品ID・旧英語商品IDはそのカードの値で読み替える（旧商品IDの(シードID) で読む）。〔カードID-…〕はそのカードの番号。
 * - 1つのカードに商品を2つ付けるシード（010・011・022・029）は、2つの商品をそのカードの同じカード詳細に紐付ける
 *   （開発環境に、商品の付いていないカード詳細を2件以上持つカードが無い）。カードセット・プロモ・リリース日・Foil は2商品で同じになる。
 * - 014・015 の「その値を旧商品IDに持つカードを0件にする」は、DB の参照で0件であることを確かめるだけ（消さない。値には実行の印を付ける）。
 */
import { 商品の無い旧商品IDのカード, 旧商品IDのカードの数 } from "../db/a02_popup";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 商品の定め, 商品を作る, 規格の定め, 控える } from "./a02-builder";

type カード = ReturnType<typeof 商品の無い旧商品IDのカード>;
const 選んだ = new Map<string, カード>();
/** シードで選んだカード（旧商品ID・旧英語商品ID の読み替えに使う） */
export function 旧商品IDの(seedId: string): カード {
  const c = 選んだ.get(seedId);
  if (!c) throw new Error(`${seedId} のカードをまだ選んでいない`);
  return c;
}

const 頭 = (番号: string) => `A0203-${番号}`;
const 名前 = (番号: string, 印 = "") => ({ 商品名日: `A02-03試験カード商品-${番号}${印}`, 商品名英: `A02-03 Test Card Product ${番号}${印}` });
const JP = "日本語" as const;
const EN = "英語" as const;
const 規格 = (印: string, 言語: "日本語" | "英語", 在庫: number, extra: Partial<規格の定め> = {}): 規格の定め =>
  ({ 印, 言語, 状態: "NM", 価格: "500", 在庫, ...extra });
const 画像 = (番号: string, 印: string, 順位: number) => [{ ファイル名: `img/goods/A02-03/A0203-${番号}-${印}-rank${順位}.jpg`, 順位 }];

function defineA0203Seed(seedId: string, 番号: string, 商品: Omit<商品の定め, "カード">[]): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const card = 商品の無い旧商品IDのカード();
    選んだ.set(seedId, card);
    reportSeedIssue(seedId, `カードのマスタは作らず、開発環境に既にある商品の付いていないカード（カードID ${card.カードID}「${card.カード名}」）を使った。旧商品ID・旧英語商品IDはそのカードの値（${card.旧商品ID}・${card.旧英語商品ID}）で読み替えた`);
    if (商品.length > 1) reportSeedIssue(seedId, `${商品.length}つの商品を同じカード詳細（${card.カード詳細ID}）に紐付けた（商品の付いていないカード詳細を2件以上持つカードが開発環境に無い）。カードセット・プロモ・リリース日・Foil は商品で同じ`);
    控える(notes, seedId, `〔カードID-${頭(番号)}〕`, card.カードID);
    for (const p of 商品) await 商品を作る(browser, seedId, 頭(番号), { ...p, カード: card }, notes);
  });
}

// ---- 環境・マスタ（画面から作るものは無い） ----
defineSeed("S-A02-03-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "APIベースURLは開発環境の EC-CUBE の /api（アプリの経路 /api/popup/old/...）");
});
defineSeed("S-A02-03-MASTER", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗・在庫場所・商品状態・言語・カード状態・画像優先度のマスタは DB シードで登録せず、開発環境に既にある店舗ID 1（本店。シード表の「TC東京」）・在庫場所 EC-CUBE・言語 JP・EN・カード状態 NM などを使った。画像優先度（1=英語・2=日本語）はアプリの決まり（ja→2・en→1）");
});

// ---- 1商品 ----
const 基本 = (番号: string, 名: { 商品名日: string; 商品名英: string } = 名前(番号), extra: Partial<商品の定め> = {}, 規extra: Partial<規格の定め> = {}): Omit<商品の定め, "カード">[] =>
  [{ 印: "", ...名, ...extra, 規格: [規格("", JP, 7, 規extra)] }];
defineA0203Seed("S-A02-03-BASE-001", "001", 基本("001"));
defineA0203Seed("S-A02-03-BASE-002", "002", 基本("002"));
defineA0203Seed("S-A02-03-BASE-003", "003", 基本("003", { 商品名日: "A02-03基本カード商品-003", 商品名英: "A02-03 Basic Card Product-A0203-003" },
  { 商品画像: ["img/goods/L/A02/jp/20301003.jpg"] }, { 規格画像: [{ ファイル名: "img/goods/L/A02/jp/20301003_sub.jpg", 順位: 1 }] }));
defineA0203Seed("S-A02-03-BASE-004", "004", 基本("004"));
defineA0203Seed("S-A02-03-RAW-013", "013", [{ 印: "", ...名前("013"), 規格: [規格("", JP, 1234, { 価格: "1234567" })] }]);
defineA0203Seed("S-A02-03-WEEKLY-012", "012", [{
  印: "", ...名前("012"),
  規格: [規格("A", JP, 1, { 週間販売数量: 2 }), 規格("B", JP, 1, { 週間販売数量: 5 }), 規格("C", EN, 1, { 週間販売数量: 11 })],
}]);
defineA0203Seed("S-A02-03-WEEKLY1-024", "024", [{ 印: "", ...名前("024"), 規格: [規格("", JP, 1, { 週間販売数量: 3 })] }]);
defineA0203Seed("S-A02-03-CBPASS-030", "030", [{ 印: "", ...名前("030"), 規格: [規格("", JP, 1)] }]);

// ---- 2商品（同じカード詳細） ----
defineA0203Seed("S-A02-03-PRIORITY-010", "010", [
  { 印: "A", ...名前("010", "A"), 規格: [規格("A", JP, 1, { 規格画像: 画像("010", "A", 1) })] },
  { 印: "B", ...名前("010", "B"), 規格: [規格("B", EN, 1, { 規格画像: 画像("010", "B", 2) })] },
]);
defineA0203Seed("S-A02-03-PRIORITY-011", "011", [
  { 印: "A", ...名前("011", "A"), 規格: [規格("A", JP, 1, { 規格画像: 画像("011", "A", 2) })] },
  { 印: "B", ...名前("011", "B"), 規格: [規格("B", JP, 1, { 規格画像: 画像("011", "B", 1) })] },
]);
defineA0203Seed("S-A02-03-MIXED-022", "022", [
  { 印: "A", ...名前("022", "A"), 非公開: true, 規格: [規格("A", JP, 1)] },
  { 印: "B", ...名前("022", "B"), 規格: [規格("B", JP, 1)] },
]);
defineA0203Seed("S-A02-03-CBIMAGEPRIO-029", "029", [
  { 印: "A", ...名前("029", "A"), 規格: [規格("A", EN, 1, { 規格画像: 画像("029", "A", 2) })] },
  { 印: "B", ...名前("029", "B"), 規格: [規格("B", EN, 1, { 規格画像: 画像("029", "B", 1) })] },
]);

// ---- 該当なし ----
/** 014 で開く旧商品ID（実行の印つき。カードは0件） */
export const 該当なしの旧商品ID = (): string => rc("A0203NOTFOUND-014");
defineSeed("S-A02-03-NONE-014", async ({ seed }) => {
  const n = 旧商品IDのカードの数(該当なしの旧商品ID());
  if (n !== 0) throw new Error(`${seed.シードID}: 旧商品ID「${該当なしの旧商品ID()}」を持つカードが ${n} 件ある（消さない）`);
  reportSeedIssue(seed.シードID, `旧商品ID・旧英語商品IDに「${該当なしの旧商品ID()}」（正本の値に実行の印）を持つカードが0件であることを DB の参照で確かめた（何も消していない）`);
});
/** 015 のグッズ商品の商品コード（正本の A0203GOODS-015 に、組み立ての部品の決まりで「-1」と実行の印が付く。旧商品IDとしてもこの値で開く） */
export const グッズの商品コード = (): string => rc("A0203GOODS-015-1");
defineSeed("S-A02-03-GOODS-015", async ({ browser, notes, seed }) => {
  const n = 旧商品IDのカードの数(グッズの商品コード());
  if (n !== 0) throw new Error(`${seed.シードID}: 旧商品ID「${グッズの商品コード()}」を持つカードが ${n} 件ある（消さない）`);
  // 商品コードの頭を正本の商品コードにそろえる（rc("A0203GOODS-015-1") になる）
  const r = await 商品を作る(browser, seed.シードID, "A0203GOODS-015", { 印: "", ...名前("015"), カード: null, 規格: [規格("", JP, 1)] }, notes);
  控える(notes, seed.シードID, "〔商品ID-A0203-015〕", r.商品ID);
  控える(notes, seed.シードID, "〔商品規格ID-A0203-015〕", r.規格ID[""]);
  reportSeedIssue(seed.シードID, "旧商品ID・旧英語商品IDに商品コードを持つカードが0件であることを DB の参照で確かめた（何も消していない）。カード詳細は紐付けない");
});
