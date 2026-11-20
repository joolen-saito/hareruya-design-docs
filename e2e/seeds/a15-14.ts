/**
 * A15-14 メタゲーム情報参照（デッキビルダーの API）のシード。正本: cases/A15-14_seed_data.tsv
 *
 * 読み替え（エビデンスの「正本の外の補い」に出す）:
 * - フォーマット名・アーキタイプ名は、シード表の値のまま入れる（ケースが応答の名前をそのまま見るため）。2回目の実行で同じ名前の行が
 *   前の回にもあるので、選択欄は名前でなく登録で控えた番号で選ぶ。フォーマットコード（重複不可）だけは実行の印を足した値から作る。
 *   集計はフォーマットの番号ごとなので、前の回の行は結果に入らない。
 * - シード表の「登録後のデッキ編集画面で複製を押し、指定回数に N を入れて複製保存」は、デッキ一覧の新規登録を同じ値で N+1 回行う
 *   （できあがる大会デッキの件数・フォーマット・アーキタイプ・公開状態・開催日は同じ）。
 * - ユーザーデッキの「プレイヤーの検索するボタンから任意のプレイヤーを選択」は、プレイヤー名の欄に名前を入れる形にする
 *   （ユーザーデッキは集計の対象外で、どのプレイヤーかは期待結果に効かない）。
 * - 「登録件数0件」の確かめは、フォーマット編集画面を開く代わりに DB の行を数える（読むだけ）。行があれば消さずに止める
 *   （シード表の「編集画面が開いた場合は…削除」は行わない。ほかの方のフォーマットかもしれないため）。
 * - 「メタゲーム集計の一時保存結果なし」は、新しく登録したフォーマットの番号には一時保存の結果がまだ無いので、そのまま満たす。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { アーキタイプを登録する, デッキ, デッキを登録する, フォーマットを登録する } from "../pages/admin/a15_14_metagame";
import { フォーマットのデッキの件数, フォーマットの行の件数 } from "../db/a15_14";

/** 日本時間の今日から「日前」の日の 12:00（「yyyy-mm-ddThh:mm」） */
export function 開催日時(日前: number): string {
  const d = new Date(Date.now() - 日前 * 86_400_000);
  return `${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(d)}T12:00`;
}

/** 日本時間の今日から「日前」の日付（「yyyy/mm/dd」） */
export function 日付(日前: number): string {
  return 開催日時(日前).slice(0, 10).replace(/-/g, "/");
}

/** 番号のフォーマットが1行も無いことを DB で確かめる（あれば消さずに止める） */
function 未登録を確かめる(seedId: string, 番号: number[]): void {
  for (const n of 番号) {
    const c = フォーマットの行の件数(n);
    if (c !== 0) throw new Error(`${seedId}: フォーマットの番号 ${n} の行が ${c} 件ある（シード表は0件。ほかの方の行かもしれないので消さずに止める）`);
  }
  reportSeedIssue(seedId, `フォーマットの番号 ${番号.join("・")} の行が0件であることを、フォーマット編集画面を開く代わりに DB を数えて確かめた（読むだけ）`);
}

type 型 = {
  /** 控える呼び名の記号（〔フォーマット識別子-A1514-<記号>〕） */
  記号: string;
  名日: string; 名英: string; メタ日数: string;
  /** アーキタイプ（記号は〔アーキタイプ識別子-A1514-<記号>〕） */
  アーキタイプ: { 記号: string; 名日: string; 名英: string }[];
};
type 置くデッキ = { アーキタイプ記号: string; 件数: number; 種類: "event" | "user"; 公開: boolean; 日前?: number };

/** フォーマット・アーキタイプ・デッキを登録し、番号を控える */
function 集計データ(seedId: string, 型: 型[], デッキ群: 置くデッキ[], 未登録?: number[]) {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    if (未登録) 未登録を確かめる(seedId, 未登録);
    const 番号: Record<string, { フォーマット: string; アーキタイプ: string }> = {};
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const f of 型) {
        const fid = await フォーマットを登録する(page, { 名日: f.名日, 名英: f.名英, 並び順: "9000", メタ日数: f.メタ日数 }, issue);
        notes.set(`〔フォーマット識別子-A1514-${f.記号}〕`, fid);
        for (const a of f.アーキタイプ) {
          const aid = await アーキタイプを登録する(page, { 名日: a.名日, 名英: a.名英, フォーマット番号: fid }, issue);
          notes.set(`〔アーキタイプ識別子-A1514-${a.記号}〕`, aid);
          番号[a.記号] = { フォーマット: fid, アーキタイプ: aid };
        }
      }
      for (const d of デッキ群) {
        const n = 番号[d.アーキタイプ記号];
        const v: デッキ = {
          種類: d.種類, 公開: d.公開, フォーマット番号: n.フォーマット, アーキタイプ番号: n.アーキタイプ,
          開催日時: d.種類 === "event" ? 開催日時(d.日前 ?? 0) : undefined,
          プレイヤー名: d.種類 === "user" ? "結合試験A1514プレイヤー" : undefined,
        };
        for (let i = 1; i <= d.件数; i++) {
          await デッキを登録する(page, v, `${seedId} のデッキ（アーキタイプ ${d.アーキタイプ記号}・${d.種類}・${d.公開 ? "公開" : "非公開"}${d.種類 === "event" ? `・${d.日前 ?? 0}日前` : ""}・${i}/${d.件数}件目）`, issue);
        }
      }
    });
    issue("デッキの「複製」で件数を増やす代わりに、デッキ一覧の新規登録を同じ値で件数分行った（できあがるデッキの値は同じ）");
    for (const f of 型) {
      const fid = notes.get(`〔フォーマット識別子-A1514-${f.記号}〕`)!;
      const want = デッキ群.filter((d) => f.アーキタイプ.some((a) => a.記号 === d.アーキタイプ記号)).reduce((s, d) => s + d.件数, 0);
      const have = フォーマットのデッキの件数(fid);
      if (have !== want) throw new Error(`${seedId}: フォーマット ${fid} のデッキが ${have} 件（登録したのは ${want} 件。ほかのデッキが紐付いている）`);
    }
  });
}

// --- 未登録の確かめだけ（データを登録しない） ---
defineSeed("S-A15-14-NO-FORMAT", async () => { 未登録を確かめる("S-A15-14-NO-FORMAT", [15999]); });
defineSeed("S-A15-14-NOFMTS-021", async () => { 未登録を確かめる("S-A15-14-NOFMTS-021", [15140211, 15140212]); });

// --- 名前の確かめ（017） ---
集計データ("S-A15-14-NAMES-017", [
  { 記号: "017", 名日: "結合試験A1514-017フォーマット", 名英: "Integration A1514-017 Format", メタ日数: "7", アーキタイプ: [
    { 記号: "017A", 名日: "結合試験A1514-017アグロ", 名英: "Integration A1514-017 Aggro" },
    { 記号: "017B", 名日: "結合試験A1514-017コントロール", 名英: "Integration A1514-017 Control" },
  ] },
], [
  { アーキタイプ記号: "017A", 件数: 4, 種類: "event", 公開: true },
  { アーキタイプ記号: "017B", 件数: 1, 種類: "event", 公開: true },
]);

// --- 登録済みと未登録の混在（019・020） ---
for (const [n, 無い] of [["019", 15140199], ["020", 15140209]] as const) {
  集計データ(`S-A15-14-MIXED-${n}`, [
    { 記号: n, 名日: `結合試験A1514-${n}フォーマット`, 名英: `Integration A1514-${n} Format`, メタ日数: "7", アーキタイプ: [
      { 記号: `${n}A`, 名日: `結合試験A1514-${n}アーキタイプ1`, 名英: `Integration A1514-${n} Archetype 1` },
      { 記号: `${n}B`, 名日: `結合試験A1514-${n}アーキタイプ2`, 名英: `Integration A1514-${n} Archetype 2` },
    ] },
  ], [
    { アーキタイプ記号: `${n}A`, 件数: 3, 種類: "event", 公開: true },
    { アーキタイプ記号: `${n}B`, 件数: 1, 種類: "event", 公開: true },
  ], [無い]);
}

// --- メタ範囲の違う2フォーマット（022） ---
集計データ("S-A15-14-METARANGE-022", [
  { 記号: "022A", 名日: "結合試験A1514-022フォーマット7日", 名英: "Integration A1514-022 Format 7d", メタ日数: "7", アーキタイプ: [
    { 記号: "022A", 名日: "結合試験A1514-022アーキタイプ1", 名英: "Integration A1514-022 Archetype 1" },
    { 記号: "022B", 名日: "結合試験A1514-022アーキタイプ2", 名英: "Integration A1514-022 Archetype 2" },
  ] },
  { 記号: "022B", 名日: "結合試験A1514-022フォーマット14日", 名英: "Integration A1514-022 Format 14d", メタ日数: "14", アーキタイプ: [
    { 記号: "022C", 名日: "結合試験A1514-022アーキタイプ3", 名英: "Integration A1514-022 Archetype 3" },
    { 記号: "022D", 名日: "結合試験A1514-022アーキタイプ4", 名英: "Integration A1514-022 Archetype 4" },
  ] },
], [
  { アーキタイプ記号: "022A", 件数: 3, 種類: "event", 公開: true },
  { アーキタイプ記号: "022B", 件数: 1, 種類: "event", 公開: true },
  { アーキタイプ記号: "022C", 件数: 3, 種類: "event", 公開: true },
  { アーキタイプ記号: "022D", 件数: 1, 種類: "event", 公開: true },
  { アーキタイプ記号: "022A", 件数: 2, 種類: "event", 公開: true, 日前: 10 },
  { アーキタイプ記号: "022C", 件数: 2, 種類: "event", 公開: true, 日前: 10 },
]);

// --- count の指定（023） ---
集計データ("S-A15-14-CBCOUNT-023", [
  { 記号: "CB023", 名日: "結合試験A1514-CB023フォーマット", 名英: "Integration A1514-CB023 Format", メタ日数: "7", アーキタイプ: [
    { 記号: "CB023A", 名日: "結合試験A1514-CB023アーキタイプA", 名英: "Integration A1514-CB023 Archetype A" },
    { 記号: "CB023B", 名日: "結合試験A1514-CB023アーキタイプB", 名英: "Integration A1514-CB023 Archetype B" },
    { 記号: "CB023C", 名日: "結合試験A1514-CB023アーキタイプC", 名英: "Integration A1514-CB023 Archetype C" },
  ] },
], [
  { アーキタイプ記号: "CB023A", 件数: 5, 種類: "event", 公開: true },
  { アーキタイプ記号: "CB023B", 件数: 3, 種類: "event", 公開: true },
  { アーキタイプ記号: "CB023C", 件数: 1, 種類: "event", 公開: true },
]);

// --- 非公開のデッキを含む（024） ---
集計データ("S-A15-14-CBPRIV-024", [
  { 記号: "CB024", 名日: "結合試験A1514-CB024フォーマット", 名英: "Integration A1514-CB024 Format", メタ日数: "7", アーキタイプ: [
    { 記号: "CB024A", 名日: "結合試験A1514-CB024アーキタイプA", 名英: "Integration A1514-CB024 Archetype A" },
  ] },
], [
  { アーキタイプ記号: "CB024A", 件数: 3, 種類: "event", 公開: true },
  { アーキタイプ記号: "CB024A", 件数: 2, 種類: "event", 公開: false },
]);

// --- 範囲外の大会デッキとユーザーデッキを含む（025） ---
集計データ("S-A15-14-CBEXCL-025", [
  { 記号: "CB025", 名日: "結合試験A1514-CB025フォーマット", 名英: "Integration A1514-CB025 Format", メタ日数: "7", アーキタイプ: [
    { 記号: "CB025A", 名日: "結合試験A1514-CB025アーキタイプA", 名英: "Integration A1514-CB025 Archetype A" },
  ] },
], [
  { アーキタイプ記号: "CB025A", 件数: 3, 種類: "event", 公開: true },
  { アーキタイプ記号: "CB025A", 件数: 2, 種類: "event", 公開: true, 日前: 10 },
  { アーキタイプ記号: "CB025A", 件数: 2, 種類: "user", 公開: true },
]);
