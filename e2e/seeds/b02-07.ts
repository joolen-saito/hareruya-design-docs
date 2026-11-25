/**
 * B02-07 ヘッダの商品検索（キーワード）のうち、検索サービスの索引に載せた商品が要るシード。正本: cases/B02-07_seed_data.tsv
 * 011（タグ）・012（カードセット名 日）・013（カードセット名 英）・016（商品コード）・023（商品名）の索引用のシードを作る。
 *
 * 作り方は F03-03 の索引用のシードと同じ（seeds/f03_index_common.ts）。商品はグッズ商品CSV登録で作り、公開・在庫1（入庫して別の管理者が承認）にし、
 * 商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で検索サービスへ送り、公開側の検索に出るまで待つ（組をまとめて1回送る）。
 * 決め打ちの識別の値（商品コード・商品名・タグ名・カードセット名・カード名）には実行ごとの印（rc）を付ける。ケースも同じ印の値で検索する。
 * 「キーワードを上記以外の項目に持つ商品=0件」は、印つきのキーワードがこの実行だけのものであることで満たす。
 *
 * - S-B02-07-SEARCH-ENV: 正本の投入方法は店舗設定とユニサーチ接続設定の書き換え（共有の設定）。書き換えず、本店 /ja/ が開き、ヘッダの商品検索の入力欄があることを確かめる。
 * - 在庫の「B02-07試験用」の理由・販売価格100円は索引の商品の作り方の既定（価格は 100 を指定）。
 * - 012・013: カードセットはカードセット詳細（登録）で登録し（リリース日は当日）、カード詳細（登録）のカードセットで選ぶ（正本の手順どおり）。
 *   カードの詳細情報のレアリティ・レイアウト・プロモ種別・Foil・フレームは選択肢の先頭（既定）。
 */
import { Page } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { CardsetDetailPage } from "../pages/admin/m14_08_cardset_detail";
import { 索引の商品, Issue } from "../pages/admin/f03_index_seed";
import { TagPage } from "../pages/admin/m03_13_tag";
import { allTagRows, unusedSortNo } from "../pages/admin/m03_28_seed_ops";
import { defineSeed } from "./current_seed";
import { 索引のまとめ } from "./f03_index_common";

type 定め = {
  seedId: string;
  前の準備?: (page: Page, issue: Issue) => Promise<Record<string, string>>;
  /** 正本の商品コードの並び（A・B）と、それぞれの商品名・属性 */
  商品: { 正本の商品コード: string; 正本の商品名: string; 作り方?: (前: Record<string, string>) => Partial<索引の商品> }[];
};

const 今日 = () => new Date().toISOString().slice(0, 10);
const 略称 = (s: string) => `B07${RUN_MARK}`.slice(0, 11) + s;

async function セットを作る(page: Page, 日: string, 英: string, 略: string, what: string): Promise<string> {
  const p = new CardsetDetailPage(page);
  await p.登録画面を開く();
  await p.入力する({ 名日: 日, 名英: 英, 略称: 略, リリース日: 今日() });
  return p.登録して控える(what);
}

const 定めの一覧: 定め[] = [
  {
    seedId: "S-B02-07-KW-011",
    前の準備: async (page) => {
      const rows = await allTagRows(page);
      const tag = new TagPage(page);
      const mk = async (日: string, 英: string, 順: string) => { await tag.openNew(); return tag.register({ 名称日: 日, 名称英: 英, 並び順: 順 }, `S-B02-07-KW-011: タグ ${日} の登録`); };
      const a = await mk(rc("B0207-011-TAGKW"), rc("B0207-011-TAG-EN-A"), unusedSortNo(rows));
      const b = await mk(rc("B0207-011-OTHER"), rc("B0207-011-OTHER"), unusedSortNo(await allTagRows(page)));
      return { タグA: a, タグB: b };
    },
    商品: [
      { 正本の商品コード: "B0207-011-A", 正本の商品名: "B0207-011-NAME-A", 作り方: (前) => ({ タグID: 前.タグA }) },
      { 正本の商品コード: "B0207-011-B", 正本の商品名: "B0207-011-NAME-B", 作り方: (前) => ({ タグID: 前.タグB }) },
    ],
  },
  ...(["012", "013"] as const).map((n): 定め => ({
    seedId: `S-B02-07-KW-${n}`,
    前の準備: async (page) => {
      const 日 = n === "012" ? rc("B0207-012-SETJPKW") : rc("B0207-013-SETJP-A");
      const 英 = n === "012" ? rc("B0207-012-SET-EN-A") : rc("B0207-013-SETENKW");
      const a = await セットを作る(page, 日, 英, 略称("A"), `S-B02-07-KW-${n}: カードセットA の登録`);
      const b = await セットを作る(page, rc(`B0207-${n}-OTHER`), rc(`B0207-${n}-OTHER-EN`), 略称("B"), `S-B02-07-KW-${n}: カードセットB の登録`);
      return { セットA: a, セットB: b };
    },
    商品: ["A", "B"].map((x) => ({
      正本の商品コード: `B0207-${n}-${x}`, 正本の商品名: `B0207-${n}-NAME-${x}`,
      作り方: (前: Record<string, string>) => ({ カード: { カード名: rc(`B0207-${n}-CARD-${x}`), カードセットID: x === "A" ? 前.セットA : 前.セットB } }),
    })),
  })),
  { seedId: "S-B02-07-KW-016", 商品: [{ 正本の商品コード: "B0207-016-CODEKW", 正本の商品名: "B0207-016-NAME-A" }, { 正本の商品コード: "B0207-016-B", 正本の商品名: "B0207-016-NAME-B" }] },
  { seedId: "S-B02-07-FGNAME-023", 商品: [{ 正本の商品コード: "B0207-FG023-A", 正本の商品名: "B0207-FG023-NAMEKW" }, { 正本の商品コード: "B0207-FG023-B", 正本の商品名: "B0207-FG023-OTHER" }] },
];

export const B0207索引 = new 索引のまとめ("B02-07", 定めの一覧.map((d) => ({
  名前: d.seedId,
  前の準備: d.前の準備,
  商品: (前: Record<string, string>): 索引の商品[] => d.商品.map((i) => ({
    商品コード: rc(i.正本の商品コード), 商品名: rc(i.正本の商品名), 価格: "100", 在庫: { 本店: 1 },
    ...(i.作り方 ? i.作り方(前) : {}),
  })),
})));

/** 正本の商品コード（A=1件目・B=2件目）の商品の商品ID */
export function B0207の商品ID(seedId: string, 正本の商品コード: string): string {
  return B0207索引.作った(seedId, rc(正本の商品コード)).商品ID;
}

defineSeed("S-B02-07-SEARCH-ENV", async ({ browser, seed }) => {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    const res = await page.goto(`${BASE_URL}/ja/`, { waitUntil: "load", timeout: 60_000 });
    if ((res?.status() ?? 0) >= 400) throw new Error(`${seed.シードID}: 本店 /ja/ が開けない（${res?.status()}）`);
    if ((await page.locator("header input[data-search-keyword-input]").count()) === 0) throw new Error(`${seed.シードID}: ヘッダの商品検索の入力欄が無い`);
  } finally { await ctx.close(); }
  reportSeedIssue(seed.シードID, "正本の投入方法は店舗設定・ユニサーチ接続設定の書き換え（共有の設定）。書き換えず、本店 /ja/ が開きヘッダの商品検索の入力欄があることを確かめた（検索接続先が試験環境かは、索引の反映の待ちで確かめる）");
});

function 控える(seedId: string, notes: Notes, n: string): void {
  const d = 定めの一覧.find((x) => x.seedId === seedId)!;
  d.商品.forEach((i, k) => {
    const p = B0207索引.作った(seedId, rc(i.正本の商品コード));
    const l = String.fromCharCode(65 + k);
    notes.set(`〔商品ID-B0207-${n}${l}〕`, p.商品ID);
    notes.set(`〔商品規格ID-B0207-${n}${l}〕`, p.商品規格ID);
  });
}

for (const d of 定めの一覧) {
  const n = d.seedId.endsWith("FGNAME-023") ? "FG023" : d.seedId.slice(-3);
  defineSeed(d.seedId, { needs: ["S-B02-07-SEARCH-ENV"] }, async ({ browser, seed, notes }) => {
    await B0207索引.用意する(browser, seed.シードID);
    控える(seed.シードID, notes, n);
    reportSeedIssue(seed.シードID, "シード作成時の問題（読み替え）: 「試験用索引で商品コードを検索して反映完了を確認する」は、商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で検索サービスへ送り、公開側の検索に出るまで待つことにした（B02-07 の索引用の組をまとめて1回送る）。商品コード・商品名・タグ名・カードセット名・カード名には実行の印を付けた");
  });
}
