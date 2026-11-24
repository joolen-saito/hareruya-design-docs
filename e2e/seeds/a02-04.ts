/**
 * A02-04 ポップアップ用カード情報取得（旧商品ID・言語の指定なし）のシード。正本: cases/A02-04_seed_data.tsv。作り方は seeds/a02-builder.ts（A02-03 と同じ）。
 *
 * 正本の外の補い（記録にも書く）:
 * - カードのマスタは、依頼者決定 2026-11-14「マスタは作ってよい」で、シードごとに試験用のカードをカード詳細(登録)画面で1枚登録する
 *   （カード名に実行の印。商品の数だけカード詳細を足す）。カード名(英)はシード表の名称に実行の印を付ける。
 * - 旧商品ID・旧英語商品ID（AER000022JN-001 など）は画面に欄が無いので、この実行で作ったカードの行にだけ DB で書く（lib/db_write.ts）。
 *   列が20文字までで実行の印を付けられないので、シード表の値のまま書く。前の実行の試験用カードが同じ値を持っていれば先に外す
 *   （ほかの方のカードが持っていれば止める）。ケースはシード表の値で開く。
 * - 2つの商品を付けるシード（010・016・017）は、同じカードの別のカード詳細に1つずつ紐付ける。
 * - 007 は、カードを登録するが、商品にはカード詳細を紐付けない。
 * - 005 の商品の廃止は、在庫があると画面で廃止にできないので、入庫のあと E2E の商品にだけ DB で書く。
 * - 006・016B の商品規格の廃止・非表示は、唯一の商品規格を画面で削除できないので、E2E の商品規格にだけ DB で書く。
 * - 009 の「そのカードを削除する」は、前の実行の試験用カードが持っていればその値を外すだけにする（カードは消さない）。
 *   ほかの方のカードが持っていれば止める。
 * - 商品画像・規格画像は、決まったファイル名で画面から置けないので、画像の行だけを DB に足す（実体は置かない）。
 *   「商品画像と商品規格画像=X」は、1つの商品画像 X を商品規格に紐付ける（順位は日本語の商品が2・英語の商品が1。アプリの決まり）。
 */
import { SETUP_ADMIN } from "../config/env";
import { A0204の参照マスタの違い, 前の試験用カードの旧商品IDを外す, 旧商品IDのカードの数, 試験用カードに旧商品IDを書く } from "../db/a02_popup";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 試験用のカードを作る } from "../pages/admin/a02_setup";
import { 商品の定め, 商品を作る, 規格の定め, 控える } from "./a02-builder";

const 頭 = (番号: string) => `A0204-${番号}`;
const JP = "日本語" as const;
const EN = "英語" as const;
const 補充兵 = { 商品名日: "《生真面目な補充兵/Solemn Recruit》[AER] 白R", 商品名英: "《Solemn Recruit》 [AER]" };
const 名前 = (番号: string, 印 = "") => ({ 商品名日: `A02-04試験カード商品-${番号}${印}`, 商品名英: `A02-04 Test Card Product ${番号}${印}` });
const 画像 = (ファイル名: string, 言語: "日本語" | "英語") => [{ ファイル名, 順位: 言語 === EN ? 1 : 2 }];
const 規格 = (印: string, 言語: "日本語" | "英語", 在庫: number, extra: Partial<規格の定め> = {}): 規格の定め =>
  ({ 印, 言語, 状態: "NM", 価格: "500", 在庫, ...extra });

/** 商品の定め（カード詳細を紐付けない商品は カードなし: true） */
type 定め = Omit<商品の定め, "カード"> & { カードなし?: boolean };

function defineA0204Seed(seedId: string, 番号: string, 商品: 定め[]): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const attr = seed["状態・属性"];
    const 旧 = /旧商品ID=([A-Za-z0-9-]+)/.exec(attr)?.[1];
    const 旧英 = /旧英語商品ID=([A-Za-z0-9-]+)/.exec(attr)?.[1] ?? null;
    if (!旧) throw new Error(`${seedId}: シード表に旧商品IDの値が無い`);
    const 詳細数 = Math.max(1, 商品.filter((p) => !p.カードなし).length);
    let made: { カードID: string; カード詳細IDs: string[]; カード名: string } | undefined;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      made = await 試験用のカードを作る(page, { カード名日: rc(`A02-04試験カード-${番号}`), カード名英: rc(`A0204 CARD ${番号}`), 詳細数 },
        `${seedId}: 試験用のカード`, (m) => reportSeedIssue(seedId, m));
    });
    if (!made) throw new Error(`${seedId}: 試験用のカードを作れなかった`);
    const 外した = 前の試験用カードの旧商品IDを外す(seedId, [旧, ...(旧英 ? [旧英] : [])]);
    試験用カードに旧商品IDを書く(seedId, made.カードID, 旧, 旧英);
    reportSeedIssue(seedId, `試験用のカード（カードID ${made.カードID}「${made.カード名}」・カード詳細 ${made.カード詳細IDs.length} 件）をカード詳細(登録)画面で登録した（依頼者決定 2026-11-14「マスタは作ってよい」）。` +
      `カード詳細IDは画面が振った番号を控えた。カードセットは試験用の通常カードセット、レアリティ・レイアウト・プロモ種別は選択肢の先頭。` +
      `旧商品ID「${旧}」${旧英 ? `・旧英語商品ID「${旧英}」` : ""}は、画面に欄が無いので、この実行で作ったカードの行にだけ DB で書いた（列が20文字までで実行の印を付けられないのでシード表の値のまま）` +
      (外した ? `。同じ値を持っていた前の実行の試験用カード ${外した} 件の旧商品IDは外した` : ""));
    控える(notes, seedId, `〔カードID-${頭(番号)}〕`, made.カードID);
    let i = 0;
    for (const p of 商品) {
      const { カードなし, ...rest } = p;
      const カード = カードなし ? null : { カードID: made.カードID, カード詳細ID: made.カード詳細IDs[i++], カード名: made.カード名 };
      await 商品を作る(browser, seedId, 頭(番号), { ...rest, カード }, notes);
    }
    if (商品.some((p) => p.カードなし)) reportSeedIssue(seedId, "商品にはカード詳細を紐付けなかった（シード表のとおり）。カードのカード詳細は、画面の必須のため1件登録した");
  });
}

// ---- 参照のマスタ・環境（画面から作るものは無い） ----
defineSeed("S-A02-04-REF", async ({ seed }) => {
  const 違い = A0204の参照マスタの違い();
  if (違い.length) throw new Error(`${seed.シードID}: 開発環境のマスタがシード表の値と違う（書き換えない）: ${違い.join("・")}`);
  reportSeedIssue(seed.シードID, "店舗ID 1（本店）・商品状態（1=公開・3=廃止）・言語（1=JP・2=EN）・カード状態（1=NM・2=SP）は、DB シードで登録せず、開発環境に既にある値がシード表のとおりであることを DB の参照で確かめた（書き換えていない）。在庫場所は EC-CUBE（アプリの決まりの在庫場所）");
});
defineSeed("S-A02-04-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "APIベースURLは開発環境の EC-CUBE の /api（アプリの経路 /api/popup/old/{旧商品ID}）。未認証のブラウザ（ケースのブラウザ。Cookie なし）から開く");
});

// ---- 1商品 ----
defineA0204Seed("S-A02-04-BASE-001", "001", [{ 印: "", ...補充兵, 規格: [規格("", JP, 17, { 価格: "50", 規格画像: 画像("img/goods/L/AER/jp/22_jpn-001.jpg", JP) })] }]);
defineA0204Seed("S-A02-04-BASE-002", "002", [{ 印: "", ...補充兵, 規格: [規格("", JP, 17, { 価格: "50", 規格画像: 画像("img/goods/L/AER/jp/22_jpn-002.jpg", JP) })] }]);
defineA0204Seed("S-A02-04-OLD-EN-004", "004", [{ 印: "", ...名前("004"), 規格: [規格("", EN, 1, { 規格画像: 画像("img/goods/A02-04/A0204-004.jpg", EN) })] }]);
defineA0204Seed("S-A02-04-DELETED-PRODUCT-005", "005", [{ 印: "", ...名前("005"), DBで廃止: true, 規格: [規格("", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-005.jpg", JP) })] }]);
defineA0204Seed("S-A02-04-DELETED-CLASS-006", "006", [{ 印: "", ...名前("006"), 規格: [規格("", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-006.jpg", JP), DBで削除済み: true })] }]);
defineA0204Seed("S-A02-04-NO-CARD-007", "007", [{ 印: "", ...名前("007"), カードなし: true, 規格: [規格("", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-007.jpg", JP) })] }]);
defineA0204Seed("S-A02-04-NO-IMAGE-008", "008", [{ 印: "", ...名前("008"), 規格: [規格("", JP, 1)] }]);
defineA0204Seed("S-A02-04-VALUE-011", "011", [{ 印: "", ...名前("011"), 規格: [規格("", JP, 17, { 価格: "1501", 通常価格: 2000, 規格画像: 画像("img/goods/A02-04/A0204-011.jpg", JP) })] }]);
defineA0204Seed("S-A02-04-STOCK0-018", "018", [{ 印: "", ...名前("018"), 規格: [規格("", JP, 0, { 規格画像: 画像("img/goods/L/A0204-018/stock0.jpg", JP) })] }]);
defineA0204Seed("S-A02-04-LANG-EN-019", "019", [{ 印: "", ...名前("019"), 規格: [規格("", EN, 0, { 規格画像: 画像("img/goods/L/A0204-019/en.jpg", EN) })] }]);
defineA0204Seed("S-A02-04-COND-SP-020", "020", [{ 印: "", ...名前("020"), 規格: [規格("", JP, 0, { 状態: "SP", 規格画像: 画像("img/goods/L/A0204-020/sp.jpg", JP) })] }]);

// ---- 2商品（同じカードの別のカード詳細） ----
defineA0204Seed("S-A02-04-MULTI-010", "010", [
  { 印: "A", ...名前("010", "A"), 規格: [規格("A", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-010A.jpg", JP) })] },
  { 印: "B", ...名前("010", "B"), 規格: [規格("B", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-010B.jpg", JP) })] },
]);
defineA0204Seed("S-A02-04-MIX-DELETED-016", "016", [
  { 印: "A", ...名前("016", "A"), 規格: [規格("A", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-016A.jpg", JP) })] },
  { 印: "B", ...名前("016", "B"), 規格: [規格("B", JP, 1, { 規格画像: 画像("img/goods/A02-04/A0204-016B.jpg", JP), DBで削除済み: true })] },
]);
defineA0204Seed("S-A02-04-MIX-IMAGE-017", "017", [
  { 印: "A", ...名前("017", "A"), 規格: [規格("A", JP, 1, { 規格画像: 画像("img/goods/L/A0204-017/a.jpg", JP) })] },
  { 印: "B", ...名前("017", "B"), 規格: [規格("B", JP, 1)] },
]);

// ---- 該当なし ----
/** 009 で開く旧商品ID（シード表の値） */
export const 該当なしの旧商品ID = "A02NOTFOUND1-009";
defineSeed("S-A02-04-NOTFOUND-009", async ({ seed }) => {
  const 外した = 前の試験用カードの旧商品IDを外す(seed.シードID, [該当なしの旧商品ID]);
  const n = 旧商品IDのカードの数(該当なしの旧商品ID);
  if (n !== 0) throw new Error(`${seed.シードID}: 旧商品ID「${該当なしの旧商品ID}」を持つカードが ${n} 件ある`);
  reportSeedIssue(seed.シードID, `旧商品ID・旧英語商品IDに「${該当なしの旧商品ID}」を持つカードが0件であることを DB の参照で確かめた。` +
    (外した ? `前の実行の試験用カード ${外した} 件が持っていた値は外した（カードは消していない）` : "持つカードは初めから0件だった（何も消していない）"));
});
