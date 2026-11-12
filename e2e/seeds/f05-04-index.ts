/**
 * F05-04 ネット買取商品詳細（フロント）の、検索サービス（ユニサーチ）の索引に載せる商品のシード。正本: cases/F05-04_seed_data.tsv
 * （最初の分は seeds/f05-04.ts。依頼者の決定 2026-11-11 夜「ユニサーチのフィード連携はしてもいい」）
 *
 * 作り方（シード表の投入方法の型）: カード新規登録でカードを登録し（同じカードIDの商品は、1枚のカードに詳細情報を商品の数だけ足す）、
 * カード商品CSV登録で商品を取り込み、商品マスター(検索結果)で商品名から商品IDを控える。言語ENもある商品は続けてENの行を取り込む。
 * この機能の索引用のシードの商品を1回の起動でまとめて作り、ユニサーチフィード作成で1回だけ送って、公開側に出るまで待つ（seeds/f05_index_batch.ts）。
 * SEARCH-ENV（検索サービスの接続先・商品フィードの連携先＝共有の設定）は書き換えず、環境に設定済みの値を使う。
 * 商品名・カード名・カードセット名には実行の印を付ける（rc）。
 *
 * シード表から読み替えたこと（各シードの報告にも出す）:
 * - 商品規格の商品コード: カード商品CSVが自動で振った商品コードのまま（シード表は VER-001-024 などを入れ直すとする）。ケースは商品名で見分ける。
 * - 試験画像: 画像を確かめる 026（VER-001-026）と 042（9商品）にだけ追加し、代表画像に選ぶ。ほかの VERSIONS の商品には追加しない（ケースが画像を見ない）。
 * - カテゴリ「タルキール：龍嵐録」: S-F05-04-CATEGORY と同じく、実行の印つきのカテゴリで代える。004 は単体カード配下（シングルカードの下）、
 *   054 はカテゴリ一覧（サイドバー）から押せる最新セットの下の子のカテゴリ（055 と同じ）。
 * - 021 のカードセット「タルキール：龍嵐録」: 共有のカードセットを使わず、実行の印つきのカードセットを作る。
 * - VERSIONS-025〜030・042 の言語・Foil・買取価格: シード表が定めないものは 024 と同じ（言語は1・4・7がJP・2・5・8がEN・3・6・9がその他、
 *   Foilは3・6・9が特殊）。買取価格はシード表の値（029・030 は900円から100円刻みで下がる。026 は VER-001-026 が900円で、ほかは800円から100円刻み）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { imageFile, saveProductWithImages } from "../pages/admin/f03_06_products";
import { カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 商品規格を削除する, 商品規格を登録する, 単体カード配下のカテゴリID, 登録済みの割引率ID, 規格IDを選ぶ } from "../pages/admin/f05_04_products";
import { 索引用カード, 索引用カードの詳細, 索引用カードを登録する } from "../pages/admin/f05_index_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { ensureCardset } from "../pages/admin/product_masters";
import { defineSeed } from "./current_seed";
import { F0504カテゴリ, f0504カテゴリID } from "./f05-04";
import { 索引のまとめ, まとめの結果 } from "./f05_index_batch";

export const F0504索引 = new 索引のまとめ("F05-04 ネット買取商品詳細");
type C = { browser: Browser; notes: Notes; issue: (m: string) => void };
type 言語 = "JP" | "EN" | "その他";

/** シードが作った商品（正本の商品名 → 商品ID・商品規格（「JP-NM」の形 → 商品規格ID）・言語・代表画像） */
const 作った = new Map<string, { 商品ID: string; 規格: Record<string, string>; 言語: 言語[]; 画像?: string }>();
export function f0504索引の商品(正本の名: string): { 商品ID: string; 規格: Record<string, string>; 言語: 言語[]; 画像?: string } {
  const p = 作った.get(正本の名);
  if (!p) throw new Error(`商品 ${正本の名} はまだ作っていない`);
  return p;
}
/** 021 のカードセット（正本の名前「タルキール：龍嵐録」に印を付けた名前） */
export const F0504セット021 = rc("タルキール：龍嵐録-F0504-021");

type 共通 = { 見出し: string[]; JP: string; EN: string; その他: string; 単体: string; 購入グループ: string; 割引率: string; カードセット: string };
let common: Promise<共通> | null = null;
const CARD_NO_BASE = String(Date.now()).slice(-8);
let seq = 0;
const カード番号 = () => `${CARD_NO_BASE}${String(++seq).padStart(3, "0")}`;

function 共通の値(c: C): Promise<共通> {
  if (!common) {
    common = withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const lang = await readLanguageIds(page);
      const cat = await 単体カード配下のカテゴリID(page);
      const discount = await 登録済みの割引率ID(page);
      const sellGroup = await readExistingSellGroupName(page);
      const cardset = await ensureCardset(page, "F0504試験カードセット", "F0504 Test Set", "F0504S", c.issue);
      const 見出し = await カード商品CSVの見出し(page);
      c.issue(`単体カード配下のカテゴリは「${cat.名称}」（ID ${cat.id}）、購入グループ名称は「${sellGroup}」、割引率は「${discount.名称}」、その他の言語は「${lang.その他言語.label}」を使った`);
      return { 見出し, JP: lang.日本語, EN: lang.英語, その他: lang.その他言語.id, 単体: cat.id, 購入グループ: sellGroup, 割引率: discount.id, カードセット: cardset };
    });
  }
  return common;
}

type 商品の定義 = {
  名: string; 言語: 言語[]; 買取: number;
  /** カードの詳細情報の番号（0から） */
  詳細: number;
  カテゴリID?: string;
  /** 残す状態（指定したときは、ほかの状態の規格を削除する） */
  残す状態?: string[];
  画像?: boolean;
};

/** 1枚のカード（詳細情報を複数持てる）と、その詳細情報を指定した商品を作る */
async function カードと商品を作る(c: C, seedId: string, card: Omit<索引用カード, "名" | "詳細"> & { 名: string; 詳細: 索引用カードの詳細[]; カードセットID?: string }, defs: 商品の定義[]): Promise<{ カードID: string; 商品ID: string[] }> {
  const k = await 共通の値(c);
  return withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 詳細 = card.詳細.map((d) => ({ カードセットID: card.カードセットID ?? k.カードセット, カード番号: カード番号(), ...d }));
    const reg = await 索引用カードを登録する(page, { ...card, 名: rc(card.名), 詳細 }, `${seedId}: カード ${rc(card.名)}`, c.issue);
    const ids: string[] = [];
    for (const d of defs) {
      const name = rc(d.名);
      const p = String(Math.max(d.買取, 100));
      const row = (言語ID: string, 商品ID: string): Record<string, string> => ({
        "商品ID": 商品ID, "言語(ID)": 言語ID, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
        "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": d.カテゴリID ?? k.単体,
        "購入グループ名称": k.購入グループ, "割引率(ID)": k.割引率, "基準価格": p, "販売価格": p, "買取価格": String(d.買取),
        "カード詳細(ID)": reg.詳細IDs[d.詳細],
      });
      const idOf = (l: 言語) => (l === "JP" ? k.JP : l === "EN" ? k.EN : k.その他);
      await カード商品CSVを登録する(page, k.見出し, [row(idOf(d.言語[0]), "")], `${seedId}-${d.名}-1.csv`, `${seedId}: ${d.名} のカード商品CSV登録`, c.issue);
      const 商品ID = await 商品名で商品IDを読む(page, name);
      for (const l of d.言語.slice(1)) {
        await カード商品CSVを登録する(page, k.見出し, [row(idOf(l), 商品ID)], `${seedId}-${d.名}-${l}.csv`, `${seedId}: ${d.名}（${l}）のカード商品CSV登録`, c.issue);
      }
      let rows = await 商品規格一覧を読む(page, 商品ID);
      if (d.残す状態) {
        for (const r of rows.filter((x) => !d.残す状態!.includes(x.状態))) await 商品規格を削除する(page, 商品ID, r.商品規格ID, `${seedId}: ${d.名} の ${r.言語}-${r.状態}`, c.issue);
        rows = await 商品規格一覧を読む(page, 商品ID);
      }
      let 画像: string | undefined;
      if (d.画像) {
        const src = await saveProductWithImages(page, 商品ID, [imageFile(`${d.名}-${RUN_MARK}`)], `${seedId}: ${d.名} の画像`, c.issue);
        if (src.length !== 1) throw new Error(`${seedId}: ${d.名} の画像を追加できない（画像を確かめるケースなので止める）`);
        const 先頭 = d.言語[0] === "その他" ? null : d.言語[0];
        const classId = 先頭 ? 規格IDを選ぶ(rows, 先頭, "NM") : rows.find((r) => r.状態 === "NM")?.商品規格ID;
        if (!classId) throw new Error(`${seedId}: ${d.名} のNMの規格が無い`);
        await 商品規格を登録する(page, 商品ID, classId, { 代表画像: [src[0]] }, `${seedId}: ${d.名} の代表画像`, c.issue);
        画像 = src[0];
      }
      const 規格: Record<string, string> = {};
      for (const r of rows) 規格[`${r.言語 === "日本語" ? "JP" : r.言語 === "英語" ? "EN" : r.言語}-${r.状態}`] = r.商品規格ID;
      作った.set(d.名, { 商品ID, 規格, 言語: d.言語, 画像 });
      ids.push(商品ID);
    }
    c.issue(`${seedId}: カード「${rc(card.名)}」（カードID ${reg.カードID}・詳細情報 ${reg.詳細IDs.length}件）と、商品 ${defs.map((d, i) => `${rc(d.名)}（商品ID ${ids[i]}）`).join("、")} を作った。商品規格の商品コードはカード商品CSVが振ったまま`);
    return { カードID: reg.カードID, 商品ID: ids };
  });
}

const 詳細の目印 = (商品ID: string, 名: string) => ({ パス: `/ja/purchase/search?product=${encodeURIComponent(rc(名))}`, 商品名: rc(名) });

function defineIndexSeed(seedId: string, needs: string[], f: (c: C) => Promise<まとめの結果>): void {
  F0504索引.足す(seedId, f);
  // まとめて作るときは、この機能の索引用のシードを全部作るので、どれかが使う共有のシード（CATEGORY）をどのシードでも先に作る
  defineSeed(seedId, { needs: [...new Set(["S-F05-04-CATEGORY", ...needs])] }, async ({ browser, notes }) => { await F0504索引.用意する(seedId, browser, notes); });
}

// ---- 004・054（カテゴリの商品2件。カードは2枚） ----
async function カテゴリの2商品(c: C, seedId: string, no: string, カテゴリID: string, 名: [string, string], カード名: [string, string]): Promise<まとめの結果> {
  const a = await カードと商品を作る(c, seedId, { 名: カード名[0], 詳細: [{}] }, [{ 名: 名[0], 言語: ["JP"], 買取: 100, 詳細: 0, カテゴリID }]);
  const b = await カードと商品を作る(c, seedId, { 名: カード名[1], 詳細: [{}] }, [{ 名: 名[1], 言語: ["JP"], 買取: 100, 詳細: 0, カテゴリID }]);
  return {
    控え: [[`〔商品ID-F0504-${no}A〕`, a.商品ID[0]], [`〔商品ID-F0504-${no}B〕`, b.商品ID[0]], [`〔カードID-F0504-${no}A〕`, a.カードID], [`〔カードID-F0504-${no}B〕`, b.カードID]],
    目印: 詳細の目印(b.商品ID[0], 名[1]),
  };
}
defineIndexSeed("S-F05-04-CARD-004", ["S-F05-04-CATEGORY"], async (c) => {
  const r = await カテゴリの2商品(c, "S-F05-04-CARD-004", "004", f0504カテゴリID(F0504カテゴリ.単体), ["F0504-CARD-001-004", "F0504-CARD-002-004"], ["F0504-CARD-A-004", "F0504-CARD-B-004"]);
  c.issue(`S-F05-04-CARD-004: 両商品のカテゴリは、共有のカテゴリ「タルキール：龍嵐録」の代わりに、S-F05-04-CATEGORY が作った「${rc(F0504カテゴリ.単体)}」（シングルカードの下）にした`);
  return r;
});
defineIndexSeed("S-F05-04-CATLINK-054", ["S-F05-04-CATEGORY"], async (c) => {
  const r = await カテゴリの2商品(c, "S-F05-04-CATLINK-054", "054", f0504カテゴリID(F0504カテゴリ.最新セットの子), ["F0504-CATLINK-054-A", "F0504-CATLINK-054-B"], ["F0504-054-CARD-A", "F0504-054-CARD-B"]);
  c.issue(`S-F05-04-CATLINK-054: 両商品のカテゴリは、カテゴリ一覧から押せる「${rc(F0504カテゴリ.最新セットの子)}」（最新セットの下の「${rc(F0504カテゴリ.最新セットの親)}」の子。055 と同じ）にした`);
  return r;
});

// ---- 021（セット名） ----
defineIndexSeed("S-F05-04-CARD-021", ["S-F05-04-CATEGORY"], async (c) => {
  const seedId = "S-F05-04-CARD-021";
  const set = await withAdminSession(c.browser, SETUP_ADMIN, (page) => ensureCardset(page, F0504セット021, `F0504 Tarkir ${RUN_MARK}`, `F21${RUN_MARK}`.slice(0, 10), c.issue));
  const cat = f0504カテゴリID(F0504カテゴリ.単体);
  const a = await カードと商品を作る(c, seedId, { 名: "F0504-CARD-A-021", カードセットID: set, 詳細: [{}] }, [{ 名: "F0504-CARD-001-021", 言語: ["JP"], 買取: 100, 詳細: 0, カテゴリID: cat }]);
  const b = await カードと商品を作る(c, seedId, { 名: "F0504-CARD-B-021", カードセットID: set, 詳細: [{}] }, [{ 名: "F0504-CARD-SET-021", 言語: ["JP"], 買取: 100, 詳細: 0, カテゴリID: cat }]);
  c.issue(`${seedId}: カードセットは、共有の「タルキール：龍嵐録」の代わりに「${F0504セット021}」（カードセットID ${set}）を作った。カテゴリは「${rc(F0504カテゴリ.単体)}」`);
  return {
    控え: [["〔商品ID-F0504-021A〕", a.商品ID[0]], ["〔商品ID-F0504-021B〕", b.商品ID[0]], ["〔カードID-F0504-021A〕", a.カードID], ["〔カードID-F0504-021B〕", b.カードID]],
    目印: 詳細の目印(b.商品ID[0], "F0504-CARD-SET-021"),
  };
});

// ---- 022（同じカードの2商品） ----
defineIndexSeed("S-F05-04-CARD-022", [], async (c) => {
  const r = await カードと商品を作る(c, "S-F05-04-CARD-022", { 名: "F0504-CARD-A-022", 詳細: [{}, {}] }, [
    { 名: "F0504-CARD-001-022", 言語: ["JP"], 買取: 100, 詳細: 0 },
    { 名: "F0504-CARD-002-022", 言語: ["JP"], 買取: 100, 詳細: 1 },
  ]);
  return { 控え: [["〔商品ID-F0504-022A〕", r.商品ID[0]], ["〔商品ID-F0504-022B〕", r.商品ID[1]], ["〔カードID-F0504-022〕", r.カードID]], 目印: 詳細の目印(r.商品ID[1], "F0504-CARD-002-022") };
});

// ---- 024〜030・042（同じカードの9商品） ----
const 九つの言語: 言語[] = ["JP", "EN", "その他", "JP", "EN", "その他", "JP", "EN", "その他"];
function 九商品(no: string, 買取: number[], 画像: (i: number) => boolean) {
  const seedId = `S-F05-04-VERSIONS-${no}`;
  return async (c: C): Promise<まとめの結果> => {
    const r = await カードと商品を作る(c, seedId, {
      名: `F0504-VERSIONS-CARD-${no}`, 詳細: Array.from({ length: 9 }, (_, i) => ({ Foil: [2, 5, 8].includes(i) ? "特殊" : "なし" })),
    }, Array.from({ length: 9 }, (_, i) => ({ 名: `VER-${String(i + 1).padStart(3, "0")}-${no}`, 言語: [九つの言語[i]], 買取: 買取[i], 詳細: i, 画像: 画像(i) })));
    c.issue(`${seedId}: 9商品の言語は1・4・7がJP、2・5・8がEN、3・6・9がその他の言語、Foilは3・6・9が特殊、買取価格は ${買取.join("・")} 円`);
    return { 控え: [[`〔商品ID-F0504-${no}〕`, r.商品ID[0]], [`〔カードID-F0504-${no}〕`, r.カードID]], 目印: 詳細の目印(r.商品ID[8], `VER-009-${no}`) };
  };
}
const 上がる = Array.from({ length: 9 }, (_, i) => (i + 1) * 100);
const 下がる = [...上がる].reverse();
defineIndexSeed("S-F05-04-VERSIONS-024", [], 九商品("024", 上がる, () => false));
defineIndexSeed("S-F05-04-VERSIONS-025", [], 九商品("025", 上がる, () => false));
defineIndexSeed("S-F05-04-VERSIONS-026", [], 九商品("026", 下がる, (i) => i === 0));
defineIndexSeed("S-F05-04-VERSIONS-027", [], 九商品("027", 上がる, () => false));
defineIndexSeed("S-F05-04-VERSIONS-028", [], 九商品("028", 上がる, () => false));
defineIndexSeed("S-F05-04-VERSIONS-029", [], 九商品("029", 下がる, () => false));
defineIndexSeed("S-F05-04-VERSIONS-030", [], 九商品("030", 下がる, () => false));
defineIndexSeed("S-F05-04-VERSIONS-042", [], 九商品("042", 上がる, () => true));

// ---- 050・051（Foil区分の6商品） ----
function 六商品(no: "050" | "051") {
  const seedId = `S-F05-04-FOIL-${no}`;
  return async (c: C): Promise<まとめの結果> => {
    const r = await カードと商品を作る(c, seedId, {
      名: `F0504-${no}-CARD`, 詳細: ["なし", "なし", "通常", "通常", "特殊", "特殊"].map((Foil) => ({ Foil })),
    }, Array.from({ length: 6 }, (_, i) => ({ 名: `F0504-${no}-V${i + 1}`, 言語: ["JP"] as 言語[], 買取: 100, 詳細: i })));
    c.issue(`${seedId}: カードの詳細情報の Foil は V1・V2 が「なし」（Foil区分=通常）、V3・V4 が「通常」（Foil区分=Foil）、V5・V6 が「特殊」`);
    return { 控え: [[`〔商品ID-F0504-${no}〕`, r.商品ID[0]], [`〔カードID-F0504-${no}〕`, r.カードID]], 目印: 詳細の目印(r.商品ID[5], `F0504-${no}-V6`) };
  };
}
defineIndexSeed("S-F05-04-FOIL-050", [], 六商品("050"));
defineIndexSeed("S-F05-04-FOIL-051", [], 六商品("051"));

// ---- 062・065（組合せ。JP・EN の NM・EX、買取価格499円、比較商品は同じカード） ----
function 組合せ(no: "062" | "065", card: Partial<索引用カード>) {
  const seedId = `S-F05-04-${no === "062" ? "CBCARDZZ" : "CBCARDEN"}-${no}`;
  return async (c: C): Promise<まとめの結果> => {
    const r = await カードと商品を作る(c, seedId, { 名: `F0504-CB${no}-CARD`, ルールテキスト日: "結合試験", ...card, 詳細: [{}, {}] }, [
      { 名: `F0504-CB${no}-A`, 言語: ["JP", "EN"], 買取: 499, 詳細: 0, 残す状態: ["NM", "EX"] },
      { 名: `F0504-CB${no}-B`, 言語: ["JP"], 買取: 499, 詳細: 1 },
    ]);
    c.issue(`${seedId}: カード名(日)・(英)は「${rc(`F0504-CB${no}-CARD`)}」（シード表の「結合試験カード」は、実行ごとに重ならない名前にした）。各規格の買取価格はカード商品CSVの499円（規格は編集していない）`);
    return { 控え: [[`〔商品ID-F0504-${no}A〕`, r.商品ID[0]], [`〔商品ID-F0504-${no}B〕`, r.商品ID[1]], [`〔カードID-F0504-${no}〕`, r.カードID]], 目印: 詳細の目印(r.商品ID[1], `F0504-CB${no}-B`) };
  };
}
defineIndexSeed("S-F05-04-CBCARDZZ-062", [], 組合せ("062", { 忠誠度: "5", カードタイプ: [{ 名: "プレインズウォーカー" }] }));
defineIndexSeed("S-F05-04-CBCARDEN-065", [], 組合せ("065", { パワー: "3", タフネス: "4", 忠誠度: "5", カードタイプ: [{ 名: "クリーチャー" }, { 名: "プレインズウォーカー" }] }));
