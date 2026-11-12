/**
 * F03-01 商品一覧の、検索サービスの索引に載せた商品が要るシード。正本: cases/F03-01_seed_data.tsv
 *
 * 依頼者の決定（2026-11-11 夜）で開発環境のフィード連携ができるようになったので、前回まで見送っていた
 * FILTER-013・STORE-001・STORE-014・CBSTORE-089〜103・CBCATEGORY-104 を作る。19 個の組をまとめて作り、フィードを1回だけ送り、
 * 公開側の検索に出るまで待つ（seeds/f03_index_common.ts）。
 *
 * 作り方（シード表の投入方法のとおり）: グッズ商品CSV登録で、商品公開ステータス・支店の商品公開ステータス・検索ワードを行ごとに入れて取り込み、
 * 取込で作られたニアミントの規格を公開にし、店舗（本店・TC大阪支店）ごとに在庫編集で入庫して別の管理者が承認する。
 * 前回「DBへ直接設定」として見送った店舗別の公開状態は、グッズ商品CSVの商品公開ステータス・支店の商品公開ステータスで作れる。
 * 店舗別の在庫は、本店と大阪を編集できる管理者（F04 の部品と同じ）が店舗ごとの在庫編集で入れる。
 *
 * 決め打ちの識別の値（商品コード・商品名・検索ワード・カテゴリ名）には実行ごとの印を付ける（rc）。ケースも同じ印の値で検索する。
 * 「この検索語に一致する商品はこの2件だけ」は、印つきの検索ワードがこの実行だけのものであることで満たす。
 *
 * 正本の外で補ったこと（シードの注記に出す）:
 * - FILTER-013・CBCATEGORY-104 のカテゴリは、共有の左メニューの最上位に項目を増やさないため、サプライ・グッズの下に作った（F03-01 の 004・005・087 と同じ）。
 */
import { rc, RUN_MARK } from "../lib/run_marker";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { 規格を足す } from "../pages/admin/f03_02_seed_ops";
import { FrontProductList, 店舗の入口 } from "../pages/front/f03_01_product_list";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { CategoryPage } from "../pages/admin/category";
import { Issue, カードセットを登録する, カードの属性, 属性つきカードを登録する, 索引の商品 } from "../pages/admin/f03_index_seed";
import { Page } from "@playwright/test";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { 呼び名を控える, 索引のまとめ, 索引の組 } from "./f03_index_common";

type 公開 = "公開" | "非公開";
type 定め = {
  seedId: string;
  検索ワード: string;
  /** 正本の商品コード（＝商品名）と、本店・支店の公開、本店・大阪の在庫 */
  商品: { 商品コード: string; 商品名?: string; 本店: 公開; 支店: 公開; 在庫: [number, number]; カテゴリ?: true; 言語?: "英語"; カード?: Omit<カードの属性, "カード名"> }[];
  前の準備?: 索引の組["前の準備"];
  /** 前の準備の結果で、商品の値（カードセット・既存のカード・高額商品コードなど）を足す。i は正本の商品の並びの番号 */
  加工?: (前: Record<string, string>, item: 索引の商品, i: number) => 索引の商品;
  後の準備?: 索引の組["後の準備"];
  ほかの呼び名?: (前: Record<string, string>) => Record<string, string>;
};

const 公 = "公開" as const;
const 非 = "非公開" as const;
const cb = (n: string, ...items: [公開, 公開, number, number][]): 定め => ({
  seedId: `S-F03-01-CBSTORE-${n}`, 検索ワード: `組合せ確認商品-F0301-CB${n}`,
  商品: items.map(([本店, 支店, h, o], i) => ({ 商品コード: `F0301-CB${n}-${"AB"[i]}`, 本店, 支店, 在庫: [h, o] })),
});

/** サプライ・グッズの下にカテゴリを作る（共有の左メニューの最上位に項目を増やさない。F03-01 の 004・005・087 と同じ） */
async function グッズの下にカテゴリを作る(page: Page, 名: string, issue: Issue): Promise<Record<string, string>> {
  const 親 = await readGoodsRootCategoryId(page);
  const id = await new CategoryPage(page).createChild(親, { nameJp: rc(名), nameEn: "F0301 Index Category" }, (w) => issue(`カテゴリの登録の警告「${w}」`));
  issue(`シード作成時の問題（読み替え）: カテゴリ「${名}」（カテゴリID ${id}）は、共有の左メニューの最上位に項目を増やさないため、サプライ・グッズ（カテゴリID ${親}）の下に作った。検索パラメータは入れていない`);
  return { カテゴリID: id };
}

/** 013 の全条件（カード言語JP・Foil特殊・神話レア・赤・クリーチャー） */
const 全条件013: Omit<カードの属性, "カード名"> = { カードタイプ: ["クリーチャー"], カラー: ["赤"], レアリティ: "神話レア", Foil: "特殊" };

/** 今日（東京）の日付 YYYY-MM-DD（正本がリリース日を「任意の日付」とするカードセット） */
function 今日(): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p;
}

/** カードセットの略称（半角だけ。長さの上限に収まるよう、短い頭と実行の印で作る） */
const 略称 = (頭: string) => `${頭}${RUN_MARK}`.slice(0, 16);

/** 009 の全条件（カード言語JP・Foil特殊・神話レア・赤・クリーチャー・在庫あり） */
const 全条件009: Omit<カードの属性, "カード名"> = { カードタイプ: ["クリーチャー"], カラー: ["赤"], レアリティ: "神話レア", Foil: "特殊" };

const 追加の定め: 定め[] = [
  {
    seedId: "S-F03-01-FILTER-009", 検索ワード: "絞り込み確認商品-F0301-009",
    商品: [
      { 商品コード: "FILTER-ALL-009", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: 全条件009 },
      { 商品コード: "FILTER-ALL-009-C1", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: { ...全条件009, カードタイプ: ["アーティファクト"] } },
      { 商品コード: "FILTER-ALL-009-C2", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: { ...全条件009, カラー: ["青"] } },
      { 商品コード: "FILTER-ALL-009-C3", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: { ...全条件009, レアリティ: "レア" } },
      { 商品コード: "FILTER-ALL-009-C4", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: { ...全条件009, Foil: "なし" } },
      { 商品コード: "FILTER-ALL-009-C5", 本店: "公開", 支店: "公開", 在庫: [0, 0], カード: 全条件009 },
      { 商品コード: "FILTER-ALL-009-C6", 本店: "公開", 支店: "公開", 在庫: [3, 0], 言語: "英語", カード: 全条件009 },
      { 商品コード: "FILTER-ALL-009-C7", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: { ...全条件009, Foil: "通常" } },
      { 商品コード: "FILTER-ALL-009-C8", 本店: "公開", 支店: "公開", 在庫: [3, 0], カード: { ...全条件009, レアリティ: "アンコモン" } },
    ],
    前の準備: async (page, issue) => {
      const 名 = rc("SET-F0301-009");
      const id = await カードセットを登録する(page, { 名, 略称: 略称("S009"), リリース日: 今日() }, "S-F03-01-FILTER-009");
      issue(`シード作成時の問題（読み替え）: カードセット「SET-F0301-009」は、名前を印つきの「${名}」、略称を半角の「${略称("S009")}」、リリース日を今日にして登録した（カードセットID ${id}）。比較商品C1〜C8が満たさない1条件は正本が定めない（C6の英語だけ定める）ので、C1カードタイプ（アーティファクト）・C2カラー（青）・C3レアリティ（レア）・C4 Foil（なし）・C5在庫（0）・C7 Foil（通常）・C8レアリティ（アンコモン）とした。商品の検索ワードは反映の確かめのために足した`);
      return { カードセットID: id };
    },
    加工: (前, it) => ({ ...it, カード: { ...it.カード!, カードセットID: 前.カードセットID } }),
  },
  {
    seedId: "S-F03-01-FILTER-015", 検索ワード: "絞り込み確認商品-F0301-015",
    商品: [
      { 商品コード: "FILTER-ALL-015", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
      { 商品コード: "FILTER-ALL-015-C1", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
      { 商品コード: "FILTER-ALL-015-C2", 本店: "公開", 支店: "公開", 在庫: [0, 0] },
    ],
    前の準備: async (page, issue) => {
      // 神話レアで絞り込む検索パラメータは、公開側の商品一覧の絞り込み「神話レア」が送る欄の名前と値（画面から読む）
      const front = await page.context().newPage();
      let 欄: { name: string; value: string };
      try {
        const list = new FrontProductList(front);
        await list.open(店舗の入口.本店);
        欄 = await list.絞り込みの欄(list.絞り込みボタン("rarity", "神話レア"));
      } finally {
        await front.close();
      }
      if (!欄.name || !欄.value) throw new Error("公開側の商品一覧の絞り込み「神話レア」の欄を読めない");
      const 親 = await グッズの下にカテゴリを作る(page, "SET-F0301-015", issue);
      const 子 = await new CategoryPage(page).createChild(親.カテゴリID, { nameJp: rc("神話レア"), nameEn: "Mythic Rare", searchParameters: `${欄.name}=${欄.value}` }, (w) => issue(`カテゴリの登録の警告「${w}」`));
      const 神話 = await 属性つきカードを登録する(page, { カード名: rc("FILTER-015-MYTHIC"), レアリティ: "神話レア" }, "S-F03-01-FILTER-015: 神話レアのカード", issue);
      const 他 = await 属性つきカードを登録する(page, { カード名: rc("FILTER-015-RARE"), レアリティ: "レア" }, "S-F03-01-FILTER-015: 神話レアでないカード", issue);
      issue(`シード作成時の問題（読み替え）: 「神話レア」カテゴリ（カテゴリID ${子}）は「SET-F0301-015」（カテゴリID ${親.カテゴリID}）の下に、印つきの名前・検索パラメータ「${欄.name}=${欄.value}」（公開側の絞り込み「神話レア」が送る欄）で作った。神話レアでないカードはレアにした。在庫は正本に無いので入れていない。商品の検索ワードは反映の確かめのために足した`);
      return { カテゴリID: 親.カテゴリID, 子カテゴリID: 子, 神話詳細: 神話.カード詳細ID, 神話カード: 神話.カードID, 他詳細: 他.カード詳細ID, 他カード: 他.カードID };
    },
    加工: (前, it, i) => ({
      ...it,
      既存のカード: i === 1
        ? { カード名: rc("FILTER-015-RARE"), カード詳細ID: 前.他詳細, カードID: 前.他カード }
        : { カード名: rc("FILTER-015-MYTHIC"), カード詳細ID: 前.神話詳細, カードID: 前.神話カード },
    }),
    ほかの呼び名: (前) => ({ "〔カテゴリレコードID-F0301-015A〕": 前.カテゴリID, "〔カテゴリレコードID-F0301-015B〕": 前.子カテゴリID }),
  },
  {
    seedId: "S-F03-01-SORT-030", 検索ワード: "発売日順確認商品-F0301-030",
    商品: [
      { 商品コード: "F0301-030-NEW", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
      { 商品コード: "F0301-030-OLD1", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
      { 商品コード: "F0301-030-OLD2", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
      { 商品コード: "F0301-030-NONE", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
    ],
    前の準備: async (page, issue) => {
      const cat = await グッズの下にカテゴリを作る(page, "発売日順確認カテゴリ", issue);
      const 新 = await カードセットを登録する(page, { 名: rc("F0301-030-新カードセット"), 略称: 略称("N030"), リリース日: "2026-01-03" }, "S-F03-01-SORT-030: 新カードセット");
      const 旧 = await カードセットを登録する(page, { 名: rc("F0301-030-旧カードセット"), 略称: 略称("O030"), リリース日: "2026-01-02" }, "S-F03-01-SORT-030: 旧カードセット");
      issue(`シード作成時の問題（読み替え）: 新カードセット（リリース日 2026-01-03・カードセットID ${新}）・旧カードセット（2026-01-02・${旧}）は、名前に実行の印を付け、略称を半角の短い値にして登録した。商品の検索ワードは反映の確かめのために足した`);
      return { ...cat, 新: 新, 旧: 旧 };
    },
    加工: (前, it, i) => (i === 3 ? it : { ...it, カードセットID: i === 0 ? 前.新 : 前.旧 }),
    後の準備: async (browser, made, _前, issue) => {
      const p = made.get(rc("F0301-030-OLD1"))!;
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await 規格を足す(page, p.商品ID, { 言語: "EN", 状態: "NM", 商品コード: rc("F0301-030-OLD1-EN"), 基準価格: "1000", 買取価格: "100" }, "S-F03-01-SORT-030: OLD1 の英語の規格", issue);
      });
    },
    ほかの呼び名: (前) => ({ "〔カテゴリレコードID-F0301-030〕": 前.カテゴリID }),
  },
  {
    seedId: "S-F03-01-GROUP-049", 検索ワード: "グルーピング確認商品-F0301-049",
    商品: [
      { 商品コード: "F0301-049-P1-NM", 商品名: "F0301-049-P1", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
      { 商品コード: "F0301-049-P2-NM", 商品名: "F0301-049-P2", 本店: "公開", 支店: "公開", 在庫: [0, 0], カテゴリ: true },
    ],
    前の準備: async (page, issue) => {
      issue("シード作成時の問題（読み替え）: 状態EXは手元の環境に無いので、P1 の EX の規格は2番目の状態 SP にし、価格は200円にした（NM以外の状態の価格を300円以上にすると外部のスマレジへ送られるため）。高額商品コードには実行の印を付けた。商品の検索ワードは反映の確かめのために足した");
      return グッズの下にカテゴリを作る(page, "グルーピング確認カテゴリ", issue);
    },
    加工: (_前, it) => ({ ...it, 高額商品コード: rc("F0301-049-HA") }),
    後の準備: async (browser, made, _前, issue) => {
      const p1 = made.get(rc("F0301-049-P1-NM"))!;
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        for (const v of [
          { 言語: "JP", 状態: "SP", 商品コード: rc("F0301-049-P1-EX"), 基準価格: "200", 買取価格: "100", 高額商品コード: rc("F0301-049-HA") },
          { 言語: "EN", 状態: "NM", 商品コード: rc("F0301-049-P1-EN"), 基準価格: "1000", 買取価格: "100", 高額商品コード: rc("F0301-049-HA") },
          { 言語: "JP", 状態: "NM", 商品コード: rc("F0301-049-P1-HB"), 基準価格: "1000", 買取価格: "100", 高額商品コード: rc("F0301-049-HB") },
        ]) await 規格を足す(page, p1.商品ID, v, `S-F03-01-GROUP-049: P1 の ${v.商品コード}`, issue);
      });
    },
    ほかの呼び名: (前) => ({ "〔カテゴリレコードID-F0301-049〕": 前.カテゴリID }),
  },
];

const 定めの一覧: 定め[] = [
  ...追加の定め,
  {
    seedId: "S-F03-01-FILTER-013", 検索ワード: "絞り込み確認商品-F0301-013",
    商品: [
      { 商品コード: "FILTER-ALL-013", 本店: "公開", 支店: "公開", 在庫: [3, 0], カテゴリ: true, カード: 全条件013 },
      { 商品コード: "FILTER-ALL-013-C1", 本店: "公開", 支店: "公開", 在庫: [3, 0], カテゴリ: true, カード: { ...全条件013, カードタイプ: ["アーティファクト"] } },
      { 商品コード: "FILTER-ALL-013-C2", 本店: "公開", 支店: "公開", 在庫: [3, 0], カテゴリ: true, カード: { ...全条件013, カラー: ["青"] } },
      { 商品コード: "FILTER-ALL-013-C3", 本店: "公開", 支店: "公開", 在庫: [3, 0], カテゴリ: true, カード: { ...全条件013, レアリティ: "レア" } },
      { 商品コード: "FILTER-ALL-013-C4", 本店: "公開", 支店: "公開", 在庫: [3, 0], カテゴリ: true, カード: { ...全条件013, Foil: "なし" } },
      { 商品コード: "FILTER-ALL-013-C5", 本店: "公開", 支店: "公開", 在庫: [3, 0], カテゴリ: true, 言語: "英語", カード: 全条件013 },
    ],
    前の準備: async (page, issue) => {
      issue("シード作成時の問題（読み替え）: 比較商品C1〜C4が満たさない1条件は正本が定めないので、C1はカードタイプ（アーティファクト）・C2はカラー（青）・C3はレアリティ（レア）・C4はFoil（なし）とした（C5は正本どおり言語が英語）。比較商品の在庫も正本が定めないので、FILTER-ALL-013と同じ本店3にした。商品の検索ワードは正本に無いので、反映の確かめのために印つきの「絞り込み確認商品-F0301-013」を入れた");
      return グッズの下にカテゴリを作る(page, "絞り込み確認カテゴリ-013", issue);
    },
    ほかの呼び名: (前) => ({ "〔カテゴリレコードID-F0301-013〕": 前.カテゴリID }),
  },
  {
    seedId: "S-F03-01-STORE-001", 検索ワード: "店舗確認商品-001",
    商品: [{ 商品コード: "HQ-001-F0301-001", 本店: 公, 支店: 非, 在庫: [5, 0] }, { 商品コード: "OSA-001-001", 本店: 非, 支店: 公, 在庫: [0, 4] }],
  },
  {
    seedId: "S-F03-01-STORE-014", 検索ワード: "店舗確認商品-014",
    商品: [{ 商品コード: "HQ-001-014", 本店: 公, 支店: 非, 在庫: [5, 0] }, { 商品コード: "OSA-001-014", 本店: 非, 支店: 公, 在庫: [0, 4] }],
  },
  cb("089", [公, 公, 0, 4], [公, 公, 5, 4]),
  cb("090", [公, 公, 5, 0], [公, 公, 5, 4]),
  cb("091", [公, 非, 5, 0]),
  cb("092", [公, 公, 0, 4]),
  cb("093", [公, 公, 5, 4]),
  cb("094", [公, 公, 0, 0]),
  cb("095", [公, 公, 0, 4]),
  cb("096", [公, 非, 5, 4], [公, 公, 5, 4]),
  cb("097", [公, 公, 5, 0]),
  cb("098", [公, 公, 5, 4]),
  cb("099", [公, 公, 0, 0]),
  cb("100", [公, 非, 0, 4]),
  cb("101", [公, 非, 5, 4]),
  cb("102", [公, 非, 0, 0]),
  cb("103", [公, 公, 0, 0], [公, 公, 5, 4]),
  {
    seedId: "S-F03-01-CBCATEGORY-104", 検索ワード: "組合せ確認カテゴリ商品-F0301-CB104",
    商品: [{ 商品コード: "F0301-CB104-A", 本店: 公, 支店: 公, 在庫: [5, 0], カテゴリ: true }, { 商品コード: "F0301-CB104-B", 本店: 公, 支店: 公, 在庫: [5, 0] }],
    前の準備: (page, issue) => グッズの下にカテゴリを作る(page, "組合せ確認カテゴリ-F0301-CB104", issue),
    ほかの呼び名: (前) => ({ "〔カテゴリレコードID-F0301-CB104〕": 前.カテゴリID }),
  },
];

function 実際の商品(d: 定め, 前: Record<string, string>): 索引の商品[] {
  return d.商品.map((i) => ({
    商品コード: rc(i.商品コード), 商品名: rc(i.商品名 ?? i.商品コード), 検索ワード: rc(d.検索ワード), 本店: i.本店, 支店: i.支店,
    在庫: { 本店: i.在庫[0], 大阪: i.在庫[1] }, ...(i.カテゴリ ? { カテゴリID: 前.カテゴリID } : {}),
    ...(i.言語 ? { 言語: i.言語 } : {}), ...(i.カード ? { カード: { ...i.カード, カード名: rc(i.商品コード) } } : {}),
  })).map((it, n) => (d.加工 ? d.加工(前, it, n) : it));
}

export const F0301索引 = new 索引のまとめ("F03-01", 定めの一覧.map((d) => ({
  名前: d.seedId,
  前の準備: d.前の準備,
  後の準備: d.後の準備,
  商品: (前: Record<string, string>) => 実際の商品(d, 前),
  // 反映の目印: 組の1件目（どの組も本店公開）を、検索ワードで本店の検索
  確かめ: (前: Record<string, string>) => [{ 店: "/ja" as const, 検索語: rc(d.検索ワード), 商品コード: [実際の商品(d, 前)[0].商品コード] }],
})));

/** ケースから: 正本の商品コードの商品の商品ID */
export function F0301の商品ID(seedId: string, 正本の商品コード: string): string {
  return F0301索引.作った(seedId, rc(正本の商品コード)).商品ID;
}

function defineF0301IndexSeed(seedId: string): void {
  const d = 定めの一覧.find((x) => x.seedId === seedId);
  if (!d) throw new Error(`${seedId} の定めが無い`);
  defineSeed(seedId, { needs: ["S-F03-01-ENV"] }, async ({ browser, notes }) => {
    const r = await F0301索引.用意する(browser, seedId);
    呼び名を控える(seedId, notes, r, d.商品.map((i) => rc(i.商品コード)), d.ほかの呼び名 ? d.ほかの呼び名(r.前) : {});
    reportSeedIssue(seedId, "シード作成時の問題（読み替え）: 作った商品は、商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で検索サービスへ送り、公開側の検索に出るまで待った（F03-01 の索引用の組をまとめて1回送る）。商品コード・商品名・検索ワードには実行の印を付けた");
  });
}

defineF0301IndexSeed("S-F03-01-FILTER-009");
defineF0301IndexSeed("S-F03-01-FILTER-013");
defineF0301IndexSeed("S-F03-01-FILTER-015");
defineF0301IndexSeed("S-F03-01-SORT-030");
defineF0301IndexSeed("S-F03-01-GROUP-049");
defineF0301IndexSeed("S-F03-01-STORE-001");
defineF0301IndexSeed("S-F03-01-STORE-014");
defineF0301IndexSeed("S-F03-01-CBSTORE-089");
defineF0301IndexSeed("S-F03-01-CBSTORE-090");
defineF0301IndexSeed("S-F03-01-CBSTORE-091");
defineF0301IndexSeed("S-F03-01-CBSTORE-092");
defineF0301IndexSeed("S-F03-01-CBSTORE-093");
defineF0301IndexSeed("S-F03-01-CBSTORE-094");
defineF0301IndexSeed("S-F03-01-CBSTORE-095");
defineF0301IndexSeed("S-F03-01-CBSTORE-096");
defineF0301IndexSeed("S-F03-01-CBSTORE-097");
defineF0301IndexSeed("S-F03-01-CBSTORE-098");
defineF0301IndexSeed("S-F03-01-CBSTORE-099");
defineF0301IndexSeed("S-F03-01-CBSTORE-100");
defineF0301IndexSeed("S-F03-01-CBSTORE-101");
defineF0301IndexSeed("S-F03-01-CBSTORE-102");
defineF0301IndexSeed("S-F03-01-CBSTORE-103");
defineF0301IndexSeed("S-F03-01-CBCATEGORY-104");
