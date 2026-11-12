/**
 * F03-03 商品詳細検索の、検索サービスの索引に載せた商品が要るシード。正本: cases/F03-03_seed_data.tsv
 *
 * 依頼者の決定（2026-11-11 夜）で開発環境のフィード連携ができるようになったので、前回まで見送っていた
 * STORE-006・DETAIL-007・FOIL-FRAME-008/009・COLOR-TYPE-010・SUGGEST-018・MANA-LANG-019/020・STOCK-RULE-021/023・CARRY-024・PRICE-031・COLOR-MULTI-035 を作る。
 * 13 個の組をまとめて作り、フィードを1回だけ送り、公開側の検索に出るまで待つ（seeds/f03_index_common.ts）。
 *
 * 作り方: シード表の投入方法のとおり、カードの属性が要る商品はカード詳細(登録)でカードを登録し、グッズ商品CSV登録で取り込み、
 * 商品登録編集の「カード指定 >」でカードを紐づけ、取込で作られたニアミントの規格を公開にし、在庫編集で入庫して別の管理者が承認する。
 * シード表の「商品検索用試験索引へ直接反映する」は、商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で送ることに読み替えた。
 *
 * 決め打ちの識別の値（商品コード・商品名・カード名・タグ名）には実行ごとの印を付ける（rc）。ケースも同じ印の値で検索する。
 * 「同じ商品名の他商品を0件にする」は、印つきの商品名がこの実行だけのものであることで満たす（前の実行の商品は名前の印が違う）。
 *
 * 正本の外で補ったこと（シードの注記に出す）:
 * - 試験用の値: カードの点数で見たマナ・コスト（指定の無いものは1）、詳細情報のレアリティ・レイアウト・プロモ種別（指定の無いものは選択肢の先頭）、コレクターNo（実行ごとの値）。
 * - DETAIL-007 の DETAIL-DIFF-01-007「カテゴリなし」は、商品カテゴリが必須なので表示対象カテゴリでない「サプライ・グッズ」にした。
 *   表示対象カテゴリ・カードタイプ・サブタイプ・フォーマット・イラストレーターは S-F03-03-MASTERS の共通マスタを名前で選ぶ（DETAIL-007 は MASTERS を先に作る）。
 * - MANA-LANG-020 のフランス語は、商品規格の言語の選択肢のうち日本語・英語の次の言語（画面から読む）にした。
 */
import { Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { defineSeed } from "./current_seed";
import { CategoryPage } from "../pages/admin/category";
import { Issue, カードの属性, 索引の商品 } from "../pages/admin/f03_index_seed";
import { TagPage } from "../pages/admin/m03_13_tag";
import { allTagRows, unusedSortNo } from "../pages/admin/m03_28_seed_ops";
import { 共有マスタ } from "./f03-03";
import { 呼び名を控える, 索引のまとめ, 索引の組 } from "./f03_index_common";

/** 組の定め（正本の商品コードの並び＝控える呼び名の A・B・C… の順） */
type 定め = {
  seedId: string;
  /** 正本の商品名（実行の印を付けて使う） */
  商品名: string;
  商品: (Omit<索引の商品, "商品コード" | "商品名" | "カード"> & { 商品コード: string; カード?: Omit<カードの属性, "カード名"> })[];
  needs?: string[];
  前の準備?: 索引の組["前の準備"];
  /** 前の準備の結果で商品の値を変える（カテゴリID・タグIDなど） */
  前の結果で?: (前: Record<string, string>, 商品: 索引の商品[]) => 索引の商品[];
  /** 控える呼び名のうち、商品以外のもの（前の準備の結果から） */
  ほかの呼び名?: (前: Record<string, string>) => Record<string, string>;
  /** 反映を確かめる店（省略は本店） */
};

const 在庫1 = { 在庫: { 本店: 1 } } as const;

const 定めの一覧: 定め[] = [
  {
    seedId: "S-F03-03-STORE-006", 商品名: "F0303店舗確認-006",
    商品: [
      { 商品コード: "HQ-001-006", 本店: "公開", 支店: "非公開", 在庫: { 本店: 1 } },
      { 商品コード: "OSA-001-006", 本店: "非公開", 支店: "公開", 在庫: { 大阪: 1 } },
    ],
  },
  {
    seedId: "S-F03-03-DETAIL-007", 商品名: "F0303-ALL-007", needs: ["S-F03-03-MASTERS"],
    前の準備: async (page) => {
      // S-F03-03-MASTERS が作る（あれば使う）表示対象カテゴリのカテゴリIDを、カテゴリ登録/編集画面で読む（書き換えない）
      const cat = new CategoryPage(page);
      await cat.openTop();
      const 親 = (await cat.rowValues()).filter((r) => r.nameJp === 共有マスタ.表示対象親カテゴリ);
      if (親.length !== 1) throw new Error(`最上位に「${共有マスタ.表示対象親カテゴリ}」が ${親.length} 件（S-F03-03-MASTERS が作る共通マスタ。1件のはず）`);
      await cat.openChildrenOf(親[0].id);
      const 子 = (await cat.rowValues()).filter((r) => r.nameJp === 共有マスタ.表示対象カテゴリ);
      if (子.length !== 1) throw new Error(`「${共有マスタ.表示対象親カテゴリ}」の下に「${共有マスタ.表示対象カテゴリ}」が ${子.length} 件（1件のはず）`);
      return { 表示対象カテゴリ: 子[0].id };
    },
    商品: (() => {
      const 基本: Omit<カードの属性, "カード名"> = {
        点数で見たマナ: "3", カラー: ["赤"], カードタイプ: [共有マスタ.クリーチャー], サブタイプ: [共有マスタ.サブタイプA日],
        リーガリティ: [{ フォーマット: 共有マスタ.フォーマット10, 制限: "使用可" }], レアリティ: "神話レア", Foil: "特殊", フレーム: "特殊",
        イラストレーター: 共有マスタ.イラストレーターA,
      };
      const 差: (Partial<Omit<カードの属性, "カード名">> & { カテゴリなし?: true; 言語?: "英語"; 在庫?: 0; 価格?: string })[] = [
        { カテゴリなし: true }, { カラー: ["青"] }, { 点数で見たマナ: "4" }, { カードタイプ: [共有マスタ.アーティファクト] }, { サブタイプ: [共有マスタ.サブタイプB日] },
        { リーガリティ: [{ フォーマット: 共有マスタ.フォーマット20, 制限: "使用可" }] }, { リーガリティ: [{ フォーマット: 共有マスタ.フォーマット10, 制限: "禁止" }] },
        { 言語: "英語" }, { レアリティ: "レア" }, { Foil: "なし" }, { フレーム: "通常" }, { イラストレーター: 共有マスタ.イラストレーターB },
        { 在庫: 0 }, { 価格: "300" },
      ];
      const one = (code: string, d: (typeof 差)[number]) => {
        const { カテゴリなし, 言語, 在庫, 価格, ...card } = d;
        return { 商品コード: code, 価格: 価格 ?? "150", ...(言語 ? { 言語 } : {}), 在庫: { 本店: 在庫 ?? 5 }, カード: { ...基本, ...card }, カテゴリID: カテゴリなし ? "" : "表示対象カテゴリ" };
      };
      return [one("DETAIL-ALL-007", {}), ...差.map((d, i) => one(`DETAIL-DIFF-${String(i + 1).padStart(2, "0")}-007`, d))];
    })(),
    前の結果で: (前, items) => items.map((i) => ({ ...i, カテゴリID: i.カテゴリID === "表示対象カテゴリ" ? 前.表示対象カテゴリ : undefined })),
  },
  {
    seedId: "S-F03-03-FOIL-FRAME-008", 商品名: "F0303-FOIL-008",
    商品: [
      { 商品コード: "FOIL-NORMAL-008", カード: { Foil: "なし" }, ...在庫1 },
      { 商品コード: "FOIL-FOIL-008", カード: { Foil: "通常" }, ...在庫1 },
      { 商品コード: "FOIL-SPECIAL-008", カード: { Foil: "特殊" }, ...在庫1 },
    ],
  },
  {
    seedId: "S-F03-03-FOIL-FRAME-009", 商品名: "F0303-FRAME-009",
    商品: [
      { 商品コード: "FRAME-NORMAL-009", カード: { フレーム: "通常" }, ...在庫1 },
      { 商品コード: "FRAME-SPECIAL-009", カード: { フレーム: "特殊" }, ...在庫1 },
    ],
  },
  {
    seedId: "S-F03-03-COLOR-TYPE-010", 商品名: "F0303-IDENTITY-010",
    商品: [
      { 商品コード: "IDENTITY-W-010", カード: { 固有色: ["白"] }, ...在庫1 },
      { 商品コード: "IDENTITY-WU-010", カード: { 固有色: ["白", "青"] }, ...在庫1 },
      { 商品コード: "IDENTITY-U-010", カード: { 固有色: ["青"] }, ...在庫1 },
    ],
  },
  { seedId: "S-F03-03-SUGGEST-018", 商品名: "F0303-SUGGEST-ALPHA-018", 商品: [{ 商品コード: "SUGGEST-001-018", ...在庫1 }] },
  {
    seedId: "S-F03-03-MANA-LANG-019", 商品名: "F0303-MANA-019",
    商品: Array.from({ length: 9 }, (_, n) => ({ 商品コード: `MANA-${n}-019`, カード: { 点数で見たマナ: String(n) }, ...在庫1 })),
  },
  {
    seedId: "S-F03-03-MANA-LANG-020", 商品名: "F0303-LANG-020",
    商品: [
      { 商品コード: "LANG-JP-020", 言語: "日本語", ...在庫1 },
      { 商品コード: "LANG-EN-020", 言語: "英語", ...在庫1 },
      { 商品コード: "LANG-FR-020", 言語: "その他", ...在庫1 },
    ],
  },
  {
    seedId: "S-F03-03-STOCK-RULE-021", 商品名: "F0303-STOCK-021",
    商品: [{ 商品コード: "STOCK-IN-021", ...在庫1 }, { 商品コード: "STOCK-OUT-021" }],
  },
  {
    seedId: "S-F03-03-STOCK-RULE-023", 商品名: "F0303-BAN-023",
    商品: [
      { 商品コード: "BAN-REGULAR-023", カード: {}, ...在庫1 },
      { 商品コード: "BAN-PROHIBITED-023", カード: { リーガリティ: [{ フォーマット: "", 制限: "禁止" }] }, ...在庫1 },
    ],
  },
  {
    seedId: "S-F03-03-CARRY-024", 商品名: "F0303-PRESERVE-024",
    前の準備: async (page) => {
      const name = rc("T-F0303-024");
      const rows = await allTagRows(page);
      const tag = new TagPage(page);
      await tag.openNew();
      return { タグID: await tag.register({ 名称日: name, 名称英: "Tag F0303 Preserve", 並び順: unusedSortNo(rows) }, "S-F03-03-CARRY-024: タグの登録"), タグ名: name };
    },
    商品: [
      { 商品コード: "PRESERVE-BOTH-024", タグID: "タグ", セール: true, ...在庫1 },
      { 商品コード: "PRESERVE-TAG-024", タグID: "タグ", ...在庫1 },
      { 商品コード: "PRESERVE-SALE-024", セール: true, ...在庫1 },
    ],
    前の結果で: (前, items) => items.map((i) => ({ ...i, タグID: i.タグID ? 前.タグID : undefined })),
    ほかの呼び名: (前) => ({ "〔タグID-F0303-024〕": 前.タグID }),
  },
  {
    seedId: "S-F03-03-PRICE-031", 商品名: "F0303-031-PRICE",
    商品: [
      { 商品コード: "F0303-031-LOW", 価格: "50", ...在庫1 },
      { 商品コード: "F0303-031-MID", 価格: "150", ...在庫1 },
      { 商品コード: "F0303-031-HIGH", 価格: "300", ...在庫1 },
    ],
  },
  {
    seedId: "S-F03-03-COLOR-MULTI-035", 商品名: "F0303-035-MULTI",
    商品: [
      { 商品コード: "F0303-035-W", カード: { 固有色: ["白"] }, ...在庫1 },
      { 商品コード: "F0303-035-WU", カード: { 固有色: ["白", "青"] }, ...在庫1 },
      { 商品コード: "F0303-035-U", カード: { 固有色: ["青"] }, ...在庫1 },
      { 商品コード: "F0303-035-WR", カード: { 固有色: ["白", "赤"] }, ...在庫1 },
    ],
  },
];

/** 定めの商品を、実際に入れる値（印つきの商品コード・商品名・カード名）にする */
function 実際の商品(d: 定め, 前: Record<string, string>): 索引の商品[] {
  const items: 索引の商品[] = d.商品.map((i) => {
    const code = rc(i.商品コード);
    return { ...i, 商品コード: code, 商品名: rc(d.商品名), ...(i.カード ? { カード: { ...i.カード, カード名: code } } : {}) } as 索引の商品;
  });
  return d.前の結果で ? d.前の結果で(前, items) : items;
}

export const F0303索引 = new 索引のまとめ("F03-03", 定めの一覧.map((d) => ({
  名前: d.seedId,
  前の準備: d.前の準備 as ((page: Page, issue: Issue) => Promise<Record<string, string>>) | undefined,
  商品: (前: Record<string, string>) => 実際の商品(d, 前),
})));

/** ケースから: 正本の商品コードの商品の商品ID */
export function F0303の商品ID(seedId: string, 正本の商品コード: string): string {
  return F0303索引.作った(seedId, rc(正本の商品コード)).商品ID;
}

/** 索引用のシード1つ（作り方は、まとめて作った組から呼び名を控えるだけ） */
function defineF0303IndexSeed(seedId: string): void {
  const d = 定めの一覧.find((x) => x.seedId === seedId);
  if (!d) throw new Error(`${seedId} の定めが無い`);
  defineSeed(seedId, { needs: d.needs ?? [] }, async ({ browser, notes }) => {
    const r = await F0303索引.用意する(browser, seedId);
    呼び名を控える(seedId, notes, r, d.商品.map((i) => rc(i.商品コード)), d.ほかの呼び名 ? d.ほかの呼び名(r.前) : {});
    reportSeedIssue(seedId, "シード作成時の問題（読み替え）: 「商品検索用試験索引へ直接反映する」は、商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で検索サービスへ送り、公開側の検索に出るまで待つことにした（F03-03 の索引用の組をまとめて1回送る）。商品コード・商品名・カード名・タグ名には実行の印を付けた");
  });
}

defineF0303IndexSeed("S-F03-03-STORE-006");
defineF0303IndexSeed("S-F03-03-DETAIL-007");
defineF0303IndexSeed("S-F03-03-FOIL-FRAME-008");
defineF0303IndexSeed("S-F03-03-FOIL-FRAME-009");
defineF0303IndexSeed("S-F03-03-COLOR-TYPE-010");
defineF0303IndexSeed("S-F03-03-SUGGEST-018");
defineF0303IndexSeed("S-F03-03-MANA-LANG-019");
defineF0303IndexSeed("S-F03-03-MANA-LANG-020");
defineF0303IndexSeed("S-F03-03-STOCK-RULE-021");
defineF0303IndexSeed("S-F03-03-STOCK-RULE-023");
defineF0303IndexSeed("S-F03-03-CARRY-024");
defineF0303IndexSeed("S-F03-03-PRICE-031");
defineF0303IndexSeed("S-F03-03-COLOR-MULTI-035");
