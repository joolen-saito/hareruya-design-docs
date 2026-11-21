/**
 * B16-09 サイトマップ生成処理のシード（2026-11-21 に書いたケースの分）。正本: cases/B16-09_seed_data.tsv
 * 記録 review/B16-09_progress_2026-11-20_dev.md。
 *
 * シードでの解釈（正本の外の補い。エビデンスの注記に出す）:
 * - 商品・ページ・デッキ・フォーマットの名前とページの URL 欄には実行の印を付ける（流し直しで前の実行の行とぶつからないように。案A）。
 *   ページの URL 欄・ファイル名は小文字（b1609-039-a-<印の小文字>）。ケースが探す URL の末尾も同じ値で読む。
 * - 商品は、グッズ商品CSV登録（seeds/a06-buying.ts の部品）で作る。カードは紐付けない（買取の対象の条件はカードを見ない）。入庫はしない。
 *   シード表の「商品CSV登録（公開ステータス・販売種別・在庫数の列）」で作る商品（067・068・085）も、同じ部品で作る（公開の商品1件という状態は同じ）。
 * - デッキの「フォーマット・アーキタイプは任意」は、シードごとにフォーマット（ランキング表示・メタ分布簡易化を外す。デッキ一覧のサイトマップに出ない）と
 *   アーキタイプを登録して選ぶ。
 * - 支店（店舗コード b1609031s など）を追加するシードは、2026-11-13 の依頼者決定（店舗は作らない）で、試験支店（店舗ID 1574）に読み替える。
 *   支店の店舗コード（URL の店舗の部分）は、試験支店の値（DB の基本情報を読む）を使う。
 * - 「公開中の商品・カテゴリ・買取の対象の商品・デッキが1件ある」だけのシード（014・031・035・067）は、期待結果がその行を見ないので作らず、
 *   開発環境にすでにあることを DB で確かめる（ほかの方のデータは読むだけ）。
 * - ケースの手順が「管理画面の一覧・編集画面で控える」と書く番号は、シードで登録したときに画面が返した番号を控えて、ケースが引く（setExtra）。
 * - 057 のデッキの更新日時（2030-12-01 など）は書き込まない（期待結果は掲載の有無だけを見る。並びは見ない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { カード商品を作る } from "./a06-buying";
import { カテゴリの数, デッキ詳細の対象の数, 買取の対象の商品の数 } from "../db/b16_09_b";
import { 公開中の商品の数 } from "../db/b16_09";
import { ユーザーページを作る, フォーマットを旗つきで登録する, デッキ用の型を用意する, デッキを登録する, 登録したデッキを削除する, 置くデッキ } from "../pages/admin/b16_09_setup";
import { アーキタイプを登録する } from "../pages/admin/a15_14_metagame";
import { 試験支店ID } from "../pages/admin/test_store";

const 小文字の印 = RUN_MARK.toLowerCase();
/** ページの URL 欄の値（実行の印つき・小文字） */
export const ページURL = (v: string): string => `${v}-${小文字の印}`;

/** 商品を1件作る（グッズ商品CSV登録・カードなし・入庫なし）。商品IDを返す */
async function 商品を作る(browser: import("@playwright/test").Browser, seedId: string, 名: string, 買取価格: string): Promise<string> {
  const r = await カード商品を作る(browser, seedId, { 商品コード: 名, 商品名日: 名, 商品名英: 名, 基準価格: "2000", 販売価格: "2000", 買取価格, 在庫: 0 });
  return r.商品ID;
}

// --- 開発環境にあるデータを使うシード（作らない） ---
function 有ることを確かめる(seedId: string, 何: { 名: string; 数: () => number }[], 支店に読み替え = false) {
  defineSeed(seedId, async ({ seed }) => {
    const 数 = 何.map((x) => ({ 名: x.名, n: x.数() }));
    const 無い = 数.filter((x) => x.n < 1);
    if (無い.length) throw new Error(`${seed.シードID}: ${無い.map((x) => x.名).join("・")}が開発環境に1件も無い`);
    reportSeedIssue(seed.シードID, `シード表の行は作らず、${数.map((x) => `${x.名}（${x.n}件）`).join("・")}が開発環境にすでにあることを DB で確かめた。このケースの期待結果は、それらの行そのものを見ない`);
    if (支店に読み替え) reportSeedIssue(seed.シードID, `支店の追加は、店舗を作らない決まり（2026-11-13 依頼者決定）で、試験支店（店舗ID ${試験支店ID}）に読み替えた。店舗コードは試験支店の値を使う`);
  });
}
const 公開中の商品 = { 名: "公開中の商品", 数: 公開中の商品の数 };
const 買取の対象 = { 名: "買取商品のサイトマップの条件に合う商品", 数: 買取の対象の商品の数 };
const デッキ詳細の対象 = { 名: "デッキ詳細のサイトマップの条件に合うデッキ", 数: デッキ詳細の対象の数 };
有ることを確かめる("S-B16-09-ROUTES-014", [公開中の商品, { 名: "カテゴリ", 数: カテゴリの数 }, 買取の対象, デッキ詳細の対象]);
有ることを確かめる("S-B16-09-BRIDX-031", [公開中の商品, 買取の対象, デッキ詳細の対象], true);
有ることを確かめる("S-B16-09-BR404-035", [買取の対象, デッキ詳細の対象], true);
有ることを確かめる("S-B16-09-SHOPIDX-067", [公開中の商品], true);

// --- 商品 ---
defineSeed("S-B16-09-PURCH0-032", async ({ browser, notes, seed }) => {
  const K = await 商品を作る(browser, seed.シードID, "B1609-032-K", "0");
  const L = await 商品を作る(browser, seed.シードID, "B1609-032-L", "1000");
  notes.setExtra("〔商品ID-B1609-032K〕", K);
  notes.setExtra("〔商品ID-B1609-032L〕", L);
  reportSeedIssue(seed.シードID, "手順1の「管理画面の商品一覧で ID 欄を控える」は、シードの取込のあとに商品登録編集画面で読んだ商品IDを控えて使う");
});
for (const [id, 名] of [["S-B16-09-LANGPROD-085", "B1609-085-P"], ["S-B16-09-SHOPPROD-068", "B1609-068-P"]] as const) {
  defineSeed(id, async ({ browser, notes, seed }) => {
    const p = await 商品を作る(browser, seed.シードID, 名, "0");
    notes.setExtra(`〔商品ID-${名.replace(/-P$/, "P")}〕`, p);
    reportSeedIssue(seed.シードID, "シード表の「商品CSV登録（公開ステータス・販売種別・在庫数の列）」は、グッズ商品CSV登録（公開の商品1件・入庫なし）で代えた。手順1の「商品一覧で商品IDを控える」は、取込のあとに読んだ商品IDを使う");
    if (id === "S-B16-09-SHOPPROD-068") reportSeedIssue(seed.シードID, `支店の追加は、店舗を作らない決まり（2026-11-13 依頼者決定）で、試験支店（店舗ID ${試験支店ID}）に読み替えた。支店での公開可否は設定しない（シード表のとおり）`);
  });
}

// --- ユーザーページ ---
function ページを置く(seedId: string, ページ: { 名: string; URL: string; 検索避け?: string; 控える?: string }[], 支店に読み替え = false) {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const p of ページ) {
        const id = await ユーザーページを作る(page, { ページ名: rc(p.名), URL: ページURL(p.URL), 検索避け: p.検索避け });
        if (p.控える) notes.set(p.控える, id);
      }
    });
    reportSeedIssue(seed.シードID, `ページ名・URL 欄・ファイル名に実行の印を付けた（URL 欄とファイル名は「${ページURL("b1609-…")}」の形・小文字）。コードは本文にページ名を書いた`);
    if (支店に読み替え) reportSeedIssue(seed.シードID, `支店の追加は、店舗を作らない決まり（2026-11-13 依頼者決定）で、試験支店（店舗ID ${試験支店ID}）に読み替えた。ユーザーページは店舗ごとでない`);
  });
}
ページを置く("S-B16-09-PAGEROBOT-039", [
  { 名: "B1609-039-A", URL: "b1609-039-a" }, { 名: "B1609-039-B", URL: "b1609-039-b", 検索避け: "noindex" }, { 名: "B1609-039-C", URL: "b1609-039-c", 検索避け: "none" },
]);
ページを置く("S-B16-09-PAGEORDER-041", [
  { 名: "B1609-041-C", URL: "b1609-041-c", 控える: "〔識別番号-B1609-041C〕" },
  { 名: "B1609-041-A", URL: "b1609-041-a", 控える: "〔識別番号-B1609-041A〕" },
  { 名: "B1609-041-B", URL: "b1609-041-b", 控える: "〔識別番号-B1609-041B〕" },
]);
ページを置く("S-B16-09-USERURL-042", [{ 名: "B1609-042-U", URL: "b1609-042-u" }]);
ページを置く("S-B16-09-PAGEDEF-043", [{ 名: "B1609-043-U", URL: "b1609-043-u" }]);
ページを置く("S-B16-09-LANGPAGE-083", [{ 名: "B1609-083-U", URL: "b1609-083-u" }]);
ページを置く("S-B16-09-SHOPPAGE-084", [{ 名: "B1609-084-U", URL: "b1609-084-u" }], true);

// --- デッキ ---
function デッキを置く(seedId: string, 記号: string, デッキ群: (置くデッキ & { 呼び名: string; 削除?: boolean })[]) {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const 型 = await デッキ用の型を用意する(page, 記号, issue);
      for (const d of デッキ群) {
        const id = await デッキを登録する(page, 型, { ...d, デッキ名: rc(d.デッキ名) }, issue);
        notes.setExtra(d.呼び名, id);
        if (d.削除) {
          await 登録したデッキを削除する(page, id);
          issue(`デッキ「${rc(d.デッキ名)}」（ID ${id}）は、登録のあとデッキ編集画面の「削除」で削除した（E2E が登録したデッキだけ。削除の前に番号を控えた）`);
        }
      }
    });
    issue("ケースの手順の「デッキ一覧から編集画面を開き、アドレスのデッキの番号を控える」は、シードで登録したときの編集画面のアドレスの番号を控えて使う");
  });
}
const 公開イベント = (名: string, 呼び名: string): 置くデッキ & { 呼び名: string } => ({ デッキ名: 名, 種類: "event", 公開: true, 採用カードを非公開: false, 呼び名 });
デッキを置く("S-B16-09-DECKD0-034", "034", [
  公開イベント("B1609-034-D1", "〔デッキID-B1609-034D1〕"),
  { デッキ名: "B1609-034-D2", 種類: "user", 公開: true, 採用カードを非公開: false, 呼び名: "〔デッキID-B1609-034D2〕" },
]);
デッキを置く("S-B16-09-DECKCOND-057", "057", [
  公開イベント("B1609-057-D1", "〔デッキID-B1609-057D1〕"),
  { デッキ名: "B1609-057-D2", 種類: "user", 公開: true, 採用カードを非公開: false, 呼び名: "〔デッキID-B1609-057D2〕" },
  { デッキ名: "B1609-057-D3", 種類: "event", 公開: true, 採用カードを非公開: true, 呼び名: "〔デッキID-B1609-057D3〕" },
  { ...公開イベント("B1609-057-D4", "〔デッキID-B1609-057D4〕"), 削除: true },
]);
デッキを置く("S-B16-09-LANGDECKD-088", "088", [公開イベント("B1609-088-D", "〔デッキID-B1609-088D〕")]);

// --- フォーマット（デッキ一覧のサイトマップ） ---
function フォーマットを置く(seedId: string, 記号: string, 型: { 名: string; 並び順: string; ランキング表示: boolean; メタ分布簡易化: boolean; 呼び名: string }[]) {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const 番号: string[] = [];
      for (const f of 型) {
        const id = await フォーマットを旗つきで登録する(page, { ...f, 名: rc(f.名) }, issue);
        notes.setExtra(f.呼び名, id);
        番号.push(id);
      }
      // デッキは、ランキング表示のフォーマット（先頭に登録したもの以外も同じ）の1つ目に付ける。アーキタイプはこのシード用に登録する
      const fid = 番号[型.findIndex((f) => f.ランキング表示)];
      const aid = await アーキタイプを登録する(page, { 名日: rc(`B1609-${記号}-A`), 名英: rc(`B1609-${記号}-A`), フォーマット番号: fid }, issue);
      await デッキを登録する(page, { フォーマット: fid, アーキタイプ: aid }, { デッキ名: rc(`B1609-${記号}-D`), 種類: "event", 公開: true, 採用カードを非公開: false }, issue);
    });
    issue("フォーマット名(日)・(英)とフォーマットコードに実行の印を付けた。デッキのフォーマットは、ランキング表示のフォーマットを選んだ（シード表は「登録済みのものから選ぶ」）");
    issue("ケースの手順の「フォーマット一覧から編集画面を開き、アドレスのフォーマットの番号を控える」は、シードで登録したときの編集画面のアドレスの番号を控えて使う");
  });
}
フォーマットを置く("S-B16-09-DECKLCNT-059", "059", [
  { 名: "B1609-059-F1", 並び順: "9591", ランキング表示: true, メタ分布簡易化: false, 呼び名: "〔フォーマットID-B1609-059F1〕" },
  { 名: "B1609-059-F2", 並び順: "9592", ランキング表示: false, メタ分布簡易化: true, 呼び名: "〔フォーマットID-B1609-059F2〕" },
  { 名: "B1609-059-F3", 並び順: "9593", ランキング表示: false, メタ分布簡易化: false, 呼び名: "〔フォーマットID-B1609-059F3〕" },
]);
フォーマットを置く("S-B16-09-DECKLORDER-081", "081", [
  { 名: "B1609-081-F2", 並び順: "9812", ランキング表示: false, メタ分布簡易化: true, 呼び名: "〔フォーマットID-B1609-081F2〕" },
  { 名: "B1609-081-F1", 並び順: "9811", ランキング表示: true, メタ分布簡易化: false, 呼び名: "〔フォーマットID-B1609-081F1〕" },
  { 名: "B1609-081-F3", 並び順: "9813", ランキング表示: false, メタ分布簡易化: false, 呼び名: "〔フォーマットID-B1609-081F3〕" },
]);
