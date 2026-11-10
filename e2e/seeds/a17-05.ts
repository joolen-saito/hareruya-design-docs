/**
 * A17-05 [任意門]商品名から商品詳細の情報を取得（商品名検索API）の画面シード。正本: cases/A17-05_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）: グッズ商品CSV登録で1行（002 は101行）を取り込む → 商品マスターで商品IDを控える →
 * 商品規格一覧で取込の商品規格IDを控え、必要なら商品規格登録編集で高額商品コード・状態別称を入れる → 商品規格一覧の「新規作成」で商品規格を足す →
 * 在庫編集で本店・EC-CUBE へ入庫し、別の管理者が在庫編集承認一覧で承認する → （008 だけ）足した商品規格を1件削除する。
 * 001・003 は、最上位カテゴリ「試験カテゴリA」「試験カテゴリB」をあれば使い、無ければ作って、商品のカテゴリをその2つだけにする。
 *
 * 実行の印（依頼者決定 2026-10-28）: 商品コード・商品名(日)に印を付ける（rc）。ケースのクエリの商品名も同じ印を付けて読む。
 * 002 の「全件検索商品-002-001〜101」は、検索語「全件検索商品-002」に印を付けた値の後ろに「-001」〜「-101」を足した名前で作る
 * （検索語を含み、前の実行の商品を拾わないため）。商品名(英)・高額商品コード・状態別称・画像ファイル名・カテゴリ名は印を付けない
 * （ケースの検索語に当たらない、または期待結果が値そのものを見る）。
 *
 * 環境の設定（LIMIT＝商品規格の表示下限100、IMAGE-BASE＝商品画像の配信基点）は画面から変えられないので、何もしない（注記に残す）。
 * 実装しないケースのシード（007・011・025 は DB での準備、012・013 はカードのマスタの登録）は作らない。
 *
 * 正本の外で補ったこと（記録にも書く）:
 * - 商品IDは、商品マスターで商品名でなく商品コードで検索して読んだ（同じ商品。印つきの商品コードは1件に決まる）。
 * - 部門・割引率が未選択なら選択肢の先頭を選んだ（正本: 部門=選択肢の先頭／割引率=未選択なら先頭）。
 * - スマレジ連携の列は0にした（外部のスマレジへ送らない。正本は値を定めない）。
 */
import { getSeed } from "../lib/catalog";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import {
  グッズ商品を取り込む, 入庫して承認する, 取込の商品と規格を読む, 商品のカテゴリを付け替える, 商品名で0件を確かめる,
  規格を削除する, 規格を書き換える, 規格を足す, 試験カテゴリを用意する,
} from "../pages/admin/a17_05_setup";

const SP = "スライトリープレイド";
const MP = "モデレトリープレイド";

/** 取込の商品規格への書き換え */
type 書き換え = { 高額商品コード?: string; 状態別称?: string };
/** 足す商品規格（印は作るときに付ける） */
type 足す = { 末尾: string; 状態: string; 価格: string; 高額商品コード?: string };
type 定め = {
  番号: string;           // 呼び名の番号（001 など）
  商品コード: string;     // 取込の行の商品コード（正本の値）
  商品名: string;         // 商品名(日)（正本の値）
  商品名英: string;
  価格: string;
  規格画像?: string;
  カテゴリ?: boolean;     // 試験カテゴリA・B に付け替える
  取込の書き換え?: 書き換え;
  足す?: 足す[];
  入庫?: Record<string, number>;   // 規格の印（A＝取込・B〜）→ 入庫数
  削除?: string;                   // 削除する規格の印
};

/** 呼び名の印（A・B・C・D）。規格が1件だけのシードは印なし */
const 印 = ["A", "B", "C", "D"];

function 作る(seedId: string, d: 定め): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 規格 = new Map<string, { id: string; code: string }>();
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const cats = d.カテゴリ ? await 試験カテゴリを用意する(page, issue) : [];
      const code = rc(d.商品コード);
      await グッズ商品を取り込む(page, seedId, [{ 商品コード: code, 商品名日: rc(d.商品名), 商品名英: d.商品名英, 価格: d.価格, 規格画像: d.規格画像 }], issue);
      const { 商品ID, 規格ID } = await 取込の商品と規格を読む(page, code, issue);
      notes.set(`〔商品ID-A1705-${d.番号}〕`, 商品ID);
      規格.set("A", { id: 規格ID, code });
      if (d.カテゴリ) await 商品のカテゴリを付け替える(page, 商品ID, cats, `${seedId}: 商品のカテゴリ`, issue);
      if (d.取込の書き換え) await 規格を書き換える(page, 商品ID, 規格ID, d.取込の書き換え, `${seedId}: ${code}`, issue);
      for (const [i, a] of (d.足す ?? []).entries()) {
        const c = rc(`${d.商品コード.replace(/-1$/, "")}-${a.末尾}`);
        const id = await 規格を足す(page, 商品ID, { 言語: "日本語", 状態: a.状態, 商品コード: c, 価格: a.価格, 高額商品コード: a.高額商品コード }, `${seedId}: ${c}`, issue);
        規格.set(印[i + 1], { id, code: c });
      }
      const n = 規格.size;
      // シード表が定める呼び名だけを控える（014 のように規格IDを控えないシードもある）
      const 定め = getSeed(seedId).状態・属性;
      for (const [k, v] of 規格) {
        const 呼び名 = n === 1 ? `〔規格ID-A1705-${d.番号}〕` : `〔規格ID-A1705-${d.番号}${k}〕`;
        if (定め.includes(呼び名)) notes.set(呼び名, v.id);
      }
    });
    await 入庫して承認する(browser, seedId, Object.entries(d.入庫 ?? {}).map(([k, q]) => ({ 商品コード: 規格.get(k)!.code, 数量: q })), issue);
    if (d.削除) {
      const del = 規格.get(d.削除)!;
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        await 規格を削除する(page, notes.get(`〔商品ID-A1705-${d.番号}〕`), del.id, `${seedId}: ${del.code} の削除`, issue);
      });
    }
  });
}

// ---- 環境（画面から作るものは無い） ----
defineSeed("S-A17-05-ENV", async () => { /* 接続先は最初の手順の応答で確かめる */ });
defineSeed("S-A17-05-LIMIT", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "商品規格の表示下限（100）は環境の設定で、画面から変えられない。確かめていない。結果が期待どおりなら前提も成り立っていた");
});
defineSeed("S-A17-05-IMAGE-BASE", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "商品画像の配信基点は環境の設定で、画面から変えられない。確かめていない。結果が期待どおりなら前提も成り立っていた");
});

// ---- 1商品のシード ----
作る("S-A17-05-BASE-001", { 番号: "001", 商品コード: "A1705-BASE-NM-001", 商品名: "結合基本商品-001", 商品名英: "Integration Basic Product-001", 価格: "100", カテゴリ: true, 入庫: { A: 3 } });
作る("S-A17-05-BASE-003", { 番号: "003", 商品コード: "A1705-BASE-NM-003", 商品名: "結合基本商品-003", 商品名英: "Integration Basic Product-003", 価格: "100", カテゴリ: true, 入庫: { A: 3 } });
作る("S-A17-05-CLASS-FILTER-008", {
  番号: "008", 商品コード: "A1705-CF-008-1", 商品名: "規格選別商品-008", 商品名英: "Class Filter Product-008", 価格: "1",
  足す: [{ 末尾: "2", 状態: SP, 価格: "100" }, { 末尾: "3", 状態: SP, 価格: "100" }, { 末尾: "4", 状態: "ニアミント", 価格: "0" }],
  入庫: { B: 1, C: 1, D: 1 }, 削除: "C",
});
作る("S-A17-05-NONCARD-014", { 番号: "014", 商品コード: "A1705-NC-014-1", 商品名: "非カード商品-014", 商品名英: "Noncard Product-014", 価格: "100", 入庫: { A: 1 } });
作る("S-A17-05-CONDITION-BOUNDARY-015", {
  番号: "015", 商品コード: "A1705-CB-015-1", 商品名: "状態境界商品-015", 商品名英: "Condition Boundary Product-015", 価格: "1",
  足す: [{ 末尾: "2", 状態: SP, 価格: "100" }, { 末尾: "3", 状態: MP, 価格: "99" }], 入庫: { B: 1, C: 1 },
});
作る("S-A17-05-NM-ONLY-017", {
  番号: "017", 商品コード: "A1705-NMO-017-1", 商品名: "NM限定商品-017", 商品名英: "NM Only Product-017", 価格: "100",
  足す: [{ 末尾: "2", 状態: SP, 価格: "100" }, { 末尾: "3", 状態: MP, 価格: "99" }], 入庫: { C: 5 },
});
作る("S-A17-05-HIGH-PRICE-018", {
  番号: "018", 商品コード: "A1705-HP-018-1", 商品名: "高額商品条件-018", 商品名英: "High Price Product-018", 価格: "100",
  取込の書き換え: { 高額商品コード: "HIGH-A-018" }, 足す: [{ 末尾: "2", 状態: SP, 価格: "100", 高額商品コード: "HIGH-A-018" }],
});
作る("S-A17-05-CONDITION-CODE-019", {
  番号: "019", 商品コード: "A1705-CC-019-1", 商品名: "状態コード商品-019", 商品名英: "Condition Code Product-019", 価格: "100",
  取込の書き換え: { 高額商品コード: "HIGH-CODE-019", 状態別称: "鑑定済NM" }, 足す: [{ 末尾: "2", 状態: SP, 価格: "100", 高額商品コード: "HIGH-CODE-019" }],
  入庫: { A: 1, B: 1 },
});
作る("S-A17-05-IMAGE-020", { 番号: "020", 商品コード: "A1705-IMG-020-1", 商品名: "画像変換商品-020", 商品名英: "Image Product-020", 価格: "100", 規格画像: "M21/JP/0204-020.jpg", 入庫: { A: 1 } });
作る("S-A17-05-CBNMLOW-026", { 番号: "026", 商品コード: "A1705-CB026-1", 商品名: "組合せ商品A1705-CB026", 商品名英: "Combo Product A1705-CB026", 価格: "99" });
作る("S-A17-05-CBBOTH-027", {
  番号: "027", 商品コード: "A1705-CB027-1", 商品名: "組合せ商品A1705-CB027", 商品名英: "Combo Product A1705-CB027", 価格: "150",
  足す: [{ 末尾: "2", 状態: SP, 価格: "150" }], 入庫: { B: 1 },
});
作る("S-A17-05-CBHIGH-028", {
  番号: "028", 商品コード: "A1705-CB028-1", 商品名: "組合せ商品A1705-CB028", 商品名英: "Combo Product A1705-CB028", 価格: "99",
  取込の書き換え: { 高額商品コード: "HIGH-A1705-CB028" }, 足す: [{ 末尾: "2", 状態: SP, 価格: "150", 高額商品コード: "HIGH-A1705-CB028" }], 入庫: { B: 1 },
});
作る("S-A17-05-CBSTOCK-029", {
  番号: "029", 商品コード: "A1705-CB029-1", 商品名: "組合せ商品A1705-CB029", 商品名英: "Combo Product A1705-CB029", 価格: "120",
  足す: [{ 末尾: "2", 状態: SP, 価格: "180" }], 入庫: { B: 2 },
});

// ---- 010: 検索に当たらないことを確かめる対照の商品 ----
defineSeed("S-A17-05-NOTFOUND-010", async ({ browser }) => {
  const seedId = "S-A17-05-NOTFOUND-010";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await グッズ商品を取り込む(page, seedId, [{ 商品コード: rc("A1705-NF-010-1"), 商品名日: rc("検索不一致確認商品-010"), 商品名英: "Search Control Product-010", 価格: "100" }], issue);
    await 商品名で0件を確かめる(page, "存在しない商品名A1705");
  });
});

// ---- 002: 101件 ----
/** 002 の101件の商品ID（控えた順）。シード表は「101件ぶん控える」と定める */
export const 全件の商品ID: string[] = [];
/** 002 の検索語（印つき） */
export const 全件の検索語 = (): string => rc("全件検索商品-002");
defineSeed("S-A17-05-ALL-002", async ({ browser, notes }) => {
  const seedId = "S-A17-05-ALL-002";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  全件の商品ID.length = 0;
  const nnn = Array.from({ length: 101 }, (_, i) => String(i + 1).padStart(3, "0"));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await グッズ商品を取り込む(page, seedId, nnn.map((n) => ({
      商品コード: rc(`A1705-ALL-002-${n}`), 商品名日: `${全件の検索語()}-${n}`, 商品名英: `All Search Product-002-${n}`, 価格: "100",
    })), issue);
    for (const n of nnn) {
      const { 商品ID } = await 取込の商品と規格を読む(page, rc(`A1705-ALL-002-${n}`), issue);
      全件の商品ID.push(商品ID);
    }
  });
  notes.set("〔商品ID-A1705-002〕", 全件の商品ID.join(","));
});
