/**
 * F09-04 採用枚数ランキング のシードの作り方（画面操作）。正本: cases/F09-04_seed_data.tsv
 *
 * - 操作する管理者: 全権限の管理者（SETUP_ADMIN）。シード表は管理者を定めない。フォーマット・アーキタイプ・カード・デッキは店舗に属さないので、
 *   編集可能店舗を持たない全権限の管理者で足りる（F09-01〜F09-03 と同じ）。
 * - 決め打ちの識別の値（フォーマット名・カード名・デッキ名・大会名・アーキタイプ名）は、「F0904-001」のようなケースの前半に
 *   実行の印を付けて作る（例: F0904-001-カードA → F0904-001-<印>-カードA）。英語カード名の並び（012 の APPLE・BANANA・CHERRY、
 *   010 の T01〜T19）は、印がどれも同じ位置に入るので変わらない。
 * - 採用枚数の集計はフォーマットの番号ごと（設計書 L0009）。各シードは実行のたびに新しいフォーマットを作るので、ほかのデッキ
 *   （ほかのケース・ほかの回）の有無は集計に入らない。集計結果のキャッシュもフォーマットの番号ごとなので、新しいフォーマットでは
 *   キャッシュは空（S-F09-04-ENV の (1)(2) を満たす）。シード表の「やり直すときは同じ名前のデータを消す」は、印で名前が毎回変わるので
 *   消す対象が無く、行わない。
 * - 並び順は任意の数値（必須）なので 9000 を入れる。
 * - デッキの「アーキタイプ=登録済みの任意の1件」: デッキ登録画面のアーキタイプの選択肢はフォーマットで絞られ、新しいフォーマットには
 *   アーキタイプが無いので、フォーマットごとにアーキタイプ「F0904-<ケース>-ARCHETYPE」（公開）を1件登録して選ぶ
 *   （CSV で登録する 006〜008 のシード表と同じ名前。2つ目のフォーマットは「…-ARCHETYPE-2」）。
 * - デッキの「時刻は任意」は 12:00。プレイヤー名はシード表に無いので、画面で入れる欄は空のまま（CSV は必須なので「F0904-<ケース>-PLAYER」）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { アーキタイプを登録する, 日付, 表示日付 } from "../pages/admin/f09_01_setup";
import { デッキを登録する } from "../pages/admin/m15_05_deck_edit";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, readExistingPromotionNameEn, uploadCardCsv } from "../pages/admin/card_csv";
import { カードセットを登録する, カード一覧のカードID, 画像の言語を日本語にする } from "../pages/admin/f09_06_setup";
import { 在庫承認の最大ID } from "../db/f03_08";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { カードを登録する as m14カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";
import { ensureMember } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { Account, withAdminSession } from "../lib/session";
import { F0904CSVデッキ, サプライ・グッズのカテゴリID, カードを登録する, デッキをCSVで登録する, フォーマットを登録する, フォーマット登録画面の応答, マスターの行を読む } from "../pages/admin/f09_04_setup";

/** 正本の値「F0904-<ケース>-<名>」を、実行の印つきの値にする（印はケースの前半に付ける） */
export const N = (ケース: string, 名: string) => `${rc(`F0904-${ケース}`)}-${名}`;

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

// ---------------------------------------------------------------------------
// 計画の型
// ---------------------------------------------------------------------------

type F = {
  /** フォーマット名(日)の、ケースの後ろの部分（「フォーマット」） */
  名日: string;
  /** フォーマット名(英)の、ケースの後ろの部分（「FORMAT」） */
  名英: string;
  /** 控える呼び名 */
  控え: string;
  /** メタゲーム分析日数（省略は初期値のまま触らない） */
  メタ日数?: string;
  基本土地?: boolean;
};
type C = {
  /** カード名(日)の、ケースの後ろの部分 */
  名: string;
  /** カード名(英)の、ケースの後ろの部分（省略はカード名(日)と同じ） */
  名英?: string;
  タイプ: string[];
  特殊?: string[];
  /** 色順の並び順（MTGマスターデータ管理の色順の行の並び順） */
  色順の並び?: string;
  /** カードIDを控える呼び名 */
  控え?: string;
};
type D = {
  名: string; 大会: string;
  /** 当日の N 日前 */
  日前: number;
  ユーザー?: boolean; 非公開?: boolean; リスト非公開?: boolean;
  /** フォーマットの添字（省略は先頭） */
  フォーマット?: number;
  メイン: [number, string][];
};
type CSVD = {
  名: string; 大会: string;
  /** 「yyyy-mm-dd hh:mm:ss」 */
  開催日時: string;
  メイン: [number, string][];
};
/** カードCSV登録で作るカード詳細（画像の候補）1件 */
type 詳細 = {
  /** 画像URL(英語)に入れるファイル名（「F0904-026-IMG-1.jpg」） */
  画像: string;
  /** カードセットの記号（「1」→ F0904-<ケース>-SET-1） */
  セット: string;
  /** シード表のカード詳細ID（大小の順だけを使う） */
  番号: number;
  プロモ?: boolean; Foil?: boolean;
  /** 画像の言語を日本語にする */
  日本語?: boolean;
};
type 画像カード = { 名: string; 詳細: 詳細[] };
type セット = { 記号: string; 発売日: string; 特殊: boolean };
type 計画 = {
  ケース: string; フォーマット: F[]; カード: C[]; セット?: セット[]; 画像カード?: 画像カード[]; デッキ?: D[]; CSV?: CSVD[];
  /** カードのあと・デッキの前に行う準備（038 の商品・規格） */
  デッキの前?: (page: Page, issue: (m: string) => void, browser: Browser) => Promise<void>;
};

const F標準 = (ケース: string, o: Partial<F> = {}): F => ({ 名日: "フォーマット", 名英: "FORMAT", 控え: `〔フォーマットID-F0904-${ケース}〕`, メタ日数: "30", 基本土地: false, ...o });
const クリーチャー = (名: string, o: Partial<C> = {}): C => ({ 名, タイプ: ["クリーチャー"], ...o });
const 土地 = (名: string, o: Partial<C> = {}): C => ({ 名, タイプ: ["土地"], ...o });
const 大会デッキ = (名: string, メイン: [number, string][], o: Partial<D> = {}): D => ({ 名, 大会: "大会1", 日前: 5, メイン, ...o });

/** 実行の印の末尾6文字（カードセットの略称に付ける） */
const 印の末尾 = RUN_MARK.slice(-6).toUpperCase();

/**
 * カードセットを登録し、カードCSV登録で画像の候補つきのカード詳細を作り、言語を日本語にする画像を変える。
 * カード詳細ID: シード表の決め打ちの番号（8904…）は、2回目の実行で前の実行のカード詳細に当たる。カード一覧のCSV出力から
 * 未使用の番号を読み、シード表の番号と同じ大小の順で振る（F09-06 と同じ。依頼者 PM の決定 2026-11-10）。
 */
async function 画像カードを登録する(page: Page, seedId: string, p: 計画, issue: (m: string) => void): Promise<void> {
  const n = (名: string) => N(p.ケース, 名);
  const 略称の番号 = p.ケース.replace(/^CB/, "");
  for (const st of p.セット ?? []) {
    await カードセットを登録する(page, { 名: n(`SET-${st.記号}`), 略称: `F4${略称の番号}${st.記号}${印の末尾}`, リリース日: st.発売日, 特殊: st.特殊 }, issue);
  }
  const 既存 = await readExistingCardValues(page);
  const すべて = p.画像カード!.flatMap((c) => c.詳細.map((d) => ({ c, d })));
  const promo = すべて.some((x) => x.d.プロモ) ? await readExistingPromotionNameEn(page) : "";
  const 順 = [...すべて].sort((a, b) => a.d.番号 - b.d.番号);
  const 振る = new Map(順.map((x, i) => [x.d, 既存.nextUnusedDetailId + i]));
  const headers = await downloadCardCsvTemplate(page);
  const rows = すべて.map(({ c, d }) => ({
    name_jp: n(c.名), name_en: n(c.名), cmc: "0", cardtype: "Creature",
    set: n(`SET-${d.セット}`), rarity: 既存.rarity, layout: 既存.layout,
    promotion_type: d.プロモ ? promo : "", foil: d.Foil ? "1" : "0",
    image_en: d.画像, card_detail_id: String(振る.get(d)),
  }));
  issue(`カード詳細IDは、シード表の決め打ちの番号（${順.map((x) => x.d.番号).join("・")}）の代わりに、未使用の番号（${順.map((x) => 振る.get(x.d)).join("・")}）を同じ大小の順で振った（2回目の実行で前の実行のカード詳細に当たらないようにするため。判定は条件付き）`);
  issue(`カードCSVのレアリティ・レイアウトは既存のカードの値（${既存.rarity}・${既存.layout}）${promo ? `、プロモ種別は既存の「${promo}」` : ""}を使った`);
  await uploadCardCsv(page, buildCardCsv(headers, rows), `f0904_${p.ケース}_cards.csv`, `${seedId}: カードCSVアップロード`, (w) => issue(`カードCSVの警告「${w}」`));
  for (const c of p.画像カード!) {
    const jp = c.詳細.filter((d) => d.日本語).map((d) => d.画像.replace(/\.[A-Za-z0-9]+$/, ""));
    if (jp.length) await 画像の言語を日本語にする(page, await カード一覧のカードID(page, n(c.名)), jp, issue);
  }
}

function definePlanSeed(seedId: string, p: 計画): void {
  defineSeed(seedId, async (ctx) => { await 作る(seedId, p, ctx); });
}

/** 計画どおりに、フォーマット→カード→アーキタイプ→デッキの順に画面で登録する */
async function 作る(seedId: string, p: 計画, { browser, notes }: SeedCtx): Promise<void> {
  {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const n = (名: string) => N(p.ケース, 名);
    await 管理画面(browser, async (page) => {
      // 【フォーマット】
      const アーキタイプ: string[] = [];
      for (const [i, f] of p.フォーマット.entries()) {
        const id = await フォーマットを登録する(page, { 名日: n(f.名日), 名英: n(f.名英), 並び順: "9000", メタ日数: f.メタ日数, 基本土地を含める: !!f.基本土地 }, issue);
        notes.set(f.控え, id);
        アーキタイプ.push(n(i === 0 ? "ARCHETYPE" : `ARCHETYPE-${i + 1}`));
      }
      // 【カード】
      const 色順 = p.カード.some((c) => c.色順の並び !== undefined) ? await マスターの行を読む(page, "色順") : [];
      for (const c of p.カード) {
        let 色順の番号: string | undefined;
        if (c.色順の並び !== undefined) {
          const hit = 色順.filter((r) => r.並び順 === c.色順の並び);
          if (hit.length !== 1) throw new Error(`${seedId}: 色順の並び順が ${c.色順の並び} の行が1件でない（${hit.length}件）`);
          色順の番号 = hit[0].番号;
          issue(`カード ${n(c.名)} の色順は、並び順が ${c.色順の並び} の行（${hit[0].名称}）を選んだ`);
        }
        const id = await カードを登録する(page, { 名日: n(c.名), 名英: n(c.名英 ?? c.名), カードタイプ: c.タイプ, 特殊タイプ: c.特殊 ?? [], 色順: 色順の番号 }, `${seedId} カード ${n(c.名)}`, issue);
        if (c.控え) notes.set(c.控え, id);
      }
      // 【カードセット】【カード・カード詳細・画像】【画像の言語を日本語にする】
      if (p.画像カード?.length) await 画像カードを登録する(page, seedId, p, issue);
      if (p.デッキの前) await p.デッキの前(page, issue, browser);
      // 【アーキタイプ】（デッキのアーキタイプの必須の選択肢）
      for (const [i, f] of p.フォーマット.entries()) {
        await アーキタイプを登録する(page, { 名: アーキタイプ[i], フォーマット: n(f.名日) }, issue);
      }
      // 【デッキ】
      for (const d of p.デッキ ?? []) {
        const fi = d.フォーマット ?? 0;
        await デッキを登録する(page, {
          デッキ名: n(d.名), デッキ種別: d.ユーザー ? "user" : "event", フォーマット: n(p.フォーマット[fi].名日), アーキタイプ: アーキタイプ[fi],
          公開状態: d.非公開 ? "非公開" : "公開", デッキリスト非公開: !!d.リスト非公開,
          イベント名日: n(d.大会), イベント名英: n(d.大会), 開催日: `${表示日付(日付(-d.日前))} 12:00`,
          メイン: d.メイン.map(([k, c]) => `${k} ${n(c)}`).join("\n"),
        }, issue);
      }
      if (p.CSV?.length) {
        const rows: F0904CSVデッキ[] = p.CSV.map((d) => ({
          プレイヤー名: n("PLAYER"), フォーマット: n(p.フォーマット[0].名英), アーキタイプ: アーキタイプ[0], デッキ名: n(d.名),
          イベント名英: n(d.大会), イベント名日: n(d.大会), 開催日時: d.開催日時, 表示: true, リスト非公開: false,
          メインリスト: d.メイン.map(([k, c]) => `${k} ${n(c)}`),
        }));
        await デッキをCSVで登録する(page, rows, seedId, issue);
        issue("開催日を秒まで指定するデッキは、デッキ登録CSVアップロードで登録した。列の並びはCSV登録画面に出ている列見出しに合わせ、プレイヤー名（必須）は「F0904-<ケース>-PLAYER」にした");
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 試験の環境・マスタ
// ---------------------------------------------------------------------------

defineSeed("S-F09-04-ENV", async () => {
  /* 試験の環境。ブラウザは日本語表示（設定の locale）で、ログインしない新しいブラウザで開く。集計結果のキャッシュは、
     各ケースのシードが実行のたびに新しいフォーマットを作るので空（このファイルの先頭の説明） */
});

defineSeed("S-F09-04-MASTER", async ({ browser }) => {
  const seedId = "S-F09-04-MASTER";
  await 管理画面(browser, async (page) => {
    // 画面で登録できる行は、無ければ新規の行に入れて登録する（既にある場合は何もしない）
    for (const [名, 英] of [["クリーチャー", "Creature"], ["アーティファクト", "Artifact"]] as const) {
      if (await 行を用意する(page, "カードタイプ", 名, 英, seedId)) reportSeedIssue(seedId, `カードタイプ「${名}」が無かったので登録した`);
    }
    for (const [名, 英] of [["伝説", "Legendary"], ["雪", "Snow"]] as const) {
      if (await 行を用意する(page, "特殊タイプ", 名, 英, seedId)) reportSeedIssue(seedId, `特殊タイプ「${名}」が無かったので登録した`);
    }
    // 『土地』『基本土地』は DB へ直接設定する定め（画面では番号を指定できない）。この E2E では DB へ書かないので、あることを確かめるだけ
    const 種別 = await マスターの行を読む(page, "カードタイプ");
    const 特殊 = await マスターの行を読む(page, "特殊タイプ");
    if (!種別.some((r) => r.日本語名 === "土地")) throw new Error(`${seedId}: カードタイプ「土地」の行が無い（DB への直接の設定が要る。この E2E では行わない）`);
    if (!特殊.some((r) => r.日本語名 === "基本土地")) throw new Error(`${seedId}: 特殊タイプ「基本土地」の行が無い（DB への直接の設定が要る。この E2E では行わない）`);
    for (const 名 of ["クリーチャー", "アーティファクト"]) if (!種別.some((r) => r.日本語名 === 名)) throw new Error(`${seedId}: カードタイプ「${名}」の行が無い`);
    for (const 名 of ["伝説", "雪"]) if (!特殊.some((r) => r.日本語名 === 名)) throw new Error(`${seedId}: 特殊タイプ「${名}」の行が無い`);
  });
});

// ---------------------------------------------------------------------------
// 集計の対象（001〜005）
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-04-SUM-001", {
  ケース: "001", フォーマット: [F標準("001")], カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  デッキ: [大会デッキ("デッキ1", [[4, "カードA"], [2, "カードB"]]), 大会デッキ("デッキ2", [[3, "カードA"]])],
});
definePlanSeed("S-F09-04-USERDECK-002", {
  ケース: "002", フォーマット: [F標準("002")], カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  デッキ: [大会デッキ("デッキ1", [[2, "カードA"]]), 大会デッキ("デッキ2", [[4, "カードA"], [3, "カードB"]], { ユーザー: true })],
});
definePlanSeed("S-F09-04-PRIVATE-003", {
  ケース: "003", フォーマット: [F標準("003")], カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  デッキ: [大会デッキ("デッキ1", [[2, "カードA"]]), 大会デッキ("デッキ2", [[4, "カードA"], [3, "カードB"]], { 非公開: true })],
});
definePlanSeed("S-F09-04-LISTPRIV-004", {
  ケース: "004", フォーマット: [F標準("004")], カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  デッキ: [大会デッキ("デッキ1", [[2, "カードA"]]), 大会デッキ("デッキ2", [[4, "カードA"], [3, "カードB"]], { リスト非公開: true })],
});
definePlanSeed("S-F09-04-OTHERFMT-005", {
  ケース: "005",
  フォーマット: [F標準("005", { 控え: "〔フォーマットID-F0904-005A〕" }), F標準("005", { 名日: "別フォーマット", 名英: "FORMAT-OTHER", 控え: "〔フォーマットID-F0904-005B〕" })],
  カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  デッキ: [大会デッキ("デッキ1", [[2, "カードA"]]), 大会デッキ("デッキ2", [[4, "カードA"], [3, "カードB"]], { フォーマット: 1 })],
});

// ---------------------------------------------------------------------------
// 集計期間（006〜008。開催日を秒まで指定するので、デッキ登録CSVで登録する）
// ---------------------------------------------------------------------------

const 秒 = (日後: number, 時刻: string) => `${日付(日後)} ${時刻}`;

definePlanSeed("S-F09-04-FROM-006", {
  ケース: "006", フォーマット: [F標準("006")], カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  CSV: [
    { 名: "デッキ1", 大会: "大会1", 開催日時: 秒(-30, "00:00:00"), メイン: [[3, "カードA"]] },
    { 名: "デッキ2", 大会: "大会2", 開催日時: 秒(-31, "23:59:59"), メイン: [[4, "カードB"]] },
  ],
});
definePlanSeed("S-F09-04-TO-007", {
  ケース: "007", フォーマット: [F標準("007")], カード: [クリーチャー("カードA"), クリーチャー("カードB")],
  CSV: [
    { 名: "デッキ1", 大会: "大会1", 開催日時: 秒(0, "23:59:59"), メイン: [[3, "カードA"]] },
    { 名: "デッキ2", 大会: "大会2", 開催日時: 秒(1, "00:00:00"), メイン: [[4, "カードB"]] },
  ],
});
definePlanSeed("S-F09-04-NOTOURNEY-008", {
  ケース: "008", フォーマット: [F標準("008")], カード: [クリーチャー("カードA"), 土地("カードL"), クリーチャー("カードB")],
  CSV: [
    { 名: "デッキ1", 大会: "大会1", 開催日時: 秒(-31, "23:59:59"), メイン: [[3, "カードA"], [2, "カードL"]] },
    { 名: "デッキ2", 大会: "大会2", 開催日時: 秒(1, "00:00:00"), メイン: [[4, "カードB"]] },
  ],
});

// ---------------------------------------------------------------------------
// 表示件数・並び順（009〜012）
// ---------------------------------------------------------------------------

const 二桁 = (i: number) => String(i).padStart(2, "0");
const 二十 = Array.from({ length: 20 }, (_, i) => i + 1);

definePlanSeed("S-F09-04-TOP18-009", {
  ケース: "009", フォーマット: [F標準("009")],
  カード: [...二十.map((i) => クリーチャー(`カードS${二桁(i)}`)), ...二十.map((i) => 土地(`カードL${二桁(i)}`))],
  デッキ: [大会デッキ("デッキ1", [
    ...二十.map((i) => [21 - i, `カードS${二桁(i)}`] as [number, string]),
    ...二十.map((i) => [21 - i, `カードL${二桁(i)}`] as [number, string]),
  ])],
});

const 十九 = Array.from({ length: 19 }, (_, i) => i + 1);
definePlanSeed("S-F09-04-TIE18-010", {
  ケース: "010", フォーマット: [F標準("010")],
  カード: 十九.map((i) => クリーチャー(`カードF0904-010-T${二桁(i)}`, { 名英: `CARD-T${二桁(i)}` })),
  デッキ: [大会デッキ("デッキ1", 十九.map((i) => [i <= 17 ? 23 - i : 5, `カードF0904-010-T${二桁(i)}`] as [number, string]))],
});

definePlanSeed("S-F09-04-COLORORDER-011", {
  ケース: "011", フォーマット: [F標準("011")],
  カード: [
    クリーチャー("カードA", { 名英: "CARD-A", 色順の並び: "3" }),
    クリーチャー("カードB", { 名英: "CARD-B", 色順の並び: "1" }),
    クリーチャー("カードC", { 名英: "CARD-C", 色順の並び: "2" }),
  ],
  デッキ: [大会デッキ("デッキ1", [[4, "カードA"], [4, "カードB"], [4, "カードC"]])],
});

definePlanSeed("S-F09-04-ENNAME-012", {
  ケース: "012", フォーマット: [F標準("012")],
  カード: [クリーチャー("カードX", { 名英: "CHERRY-X" }), クリーチャー("カードY", { 名英: "APPLE-Y" }), クリーチャー("カードZ", { 名英: "BANANA-Z" })],
  デッキ: [大会デッキ("デッキ1", [[4, "カードX"], [4, "カードY"], [4, "カードZ"]])],
});

// ---------------------------------------------------------------------------
// スペルと土地・基本土地・複数の種別（013〜020）
// ---------------------------------------------------------------------------

definePlanSeed("S-F09-04-SPLIT-013", {
  ケース: "013", フォーマット: [F標準("013")],
  カード: [クリーチャー("カードS"), 土地("カードL"), { 名: "カードAL", タイプ: ["アーティファクト", "土地"] }],
  デッキ: [大会デッキ("デッキ1", [[3, "カードS"], [4, "カードL"], [2, "カードAL"]])],
});
definePlanSeed("S-F09-04-BASICOFF-014", {
  ケース: "014", フォーマット: [F標準("014")],
  カード: [土地("カードBL", { 特殊: ["基本土地"] }), 土地("カードOL", { 特殊: ["伝説"] })],
  デッキ: [大会デッキ("デッキ1", [[8, "カードBL"], [3, "カードOL"]])],
});
definePlanSeed("S-F09-04-NOSPECIAL-015", {
  ケース: "015", フォーマット: [F標準("015")],
  カード: [土地("カードBL", { 特殊: ["基本土地"] }), 土地("カードNL")],
  デッキ: [大会デッキ("デッキ1", [[8, "カードBL"], [5, "カードNL"]])],
});
definePlanSeed("S-F09-04-BASICON-016", {
  ケース: "016", フォーマット: [F標準("016", { 基本土地: true })],
  カード: [土地("カードBL", { 特殊: ["基本土地"] }), 土地("カードNL")],
  デッキ: [大会デッキ("デッキ1", [[8, "カードBL"], [5, "カードNL"]])],
});
definePlanSeed("S-F09-04-MULTITYPE-017", {
  ケース: "017", フォーマット: [F標準("017")],
  カード: [{ 名: "カードM", タイプ: ["クリーチャー", "アーティファクト"] }],
  デッキ: [大会デッキ("デッキ1", [[4, "カードM"]]), 大会デッキ("デッキ2", [[3, "カードM"]])],
});
definePlanSeed("S-F09-04-MULTISPECIAL-018", {
  ケース: "018", フォーマット: [F標準("018")],
  カード: [クリーチャー("カードM", { 特殊: ["伝説", "雪"] })],
  デッキ: [大会デッキ("デッキ1", [[4, "カードM"]]), 大会デッキ("デッキ2", [[3, "カードM"]])],
});
definePlanSeed("S-F09-04-MULTIBOTH-019", {
  ケース: "019", フォーマット: [F標準("019")],
  カード: [{ 名: "カードM", タイプ: ["クリーチャー", "アーティファクト"], 特殊: ["伝説", "雪"] }],
  デッキ: [大会デッキ("デッキ1", [[4, "カードM"]]), 大会デッキ("デッキ2", [[3, "カードM"]])],
});
definePlanSeed("S-F09-04-NOLAND-020", {
  ケース: "020", フォーマット: [F標準("020")], カード: [クリーチャー("カードA"), 土地("カードL")],
  デッキ: [大会デッキ("デッキ1", [[3, "カードA"]])],
});

// ---------------------------------------------------------------------------
// 見出し・集計期間の表示・切替（021〜025）と、画面の導線（032〜037）
// ---------------------------------------------------------------------------

/** フォーマット1つ・カードA（クリーチャー）4枚のデッキ1件 */
const カードAだけ = (ケース: string, o: Partial<C> = {}): 計画 => ({
  ケース, フォーマット: [F標準(ケース)], カード: [クリーチャー("カードA", o)], デッキ: [大会デッキ("デッキ1", [[4, "カードA"]])],
});
/** スペルのカードA 4枚と土地のカードL 3枚 */
const AとL = (ケース: string): 計画 => ({
  ケース, フォーマット: [F標準(ケース)], カード: [クリーチャー("カードA"), 土地("カードL")], デッキ: [大会デッキ("デッキ1", [[4, "カードA"], [3, "カードL"]])],
});

definePlanSeed("S-F09-04-TITLEJA-021", カードAだけ("021"));
definePlanSeed("S-F09-04-TITLEEN-022", カードAだけ("022"));
definePlanSeed("S-F09-04-PERIODVIEW-023", カードAだけ("023"));
definePlanSeed("S-F09-04-TABLAND-024", AとL("024"));
definePlanSeed("S-F09-04-TABSPELL-025", AとL("025"));

definePlanSeed("S-F09-04-NOIMAGE-032", {
  ケース: "032", フォーマット: [F標準("032")], カード: [クリーチャー("カードX")], デッキ: [大会デッキ("デッキ1", [[4, "カードX"]])],
});

defineSeed("S-F09-04-NOFORMAT-033", { needs: [] }, async (ctx) => {
  // フォーマット・カード・デッキは他のケースと同じ作り。続けて、番号 89040339 のフォーマット登録画面が開けないことを確かめる
  await 作る("S-F09-04-NOFORMAT-033", カードAだけ("033"), ctx);
  await 管理画面(ctx.browser, async (page) => {
    const r = await フォーマット登録画面の応答(page, "89040339");
    if (r.画面がある) throw new Error(`S-F09-04-NOFORMAT-033: 番号 89040339 のフォーマット登録画面が表示された（応答 ${r.状態}）。その番号のフォーマットがある`);
    reportSeedIssue("S-F09-04-NOFORMAT-033", `番号 89040339 のフォーマット登録画面は表示されない（応答 ${r.状態}）ことを確かめた`);
  });
});

definePlanSeed("S-F09-04-BACK-035", カードAだけ("035"));
definePlanSeed("S-F09-04-TOPLINK-036", カードAだけ("036"));
definePlanSeed("S-F09-04-TOPRODUCT-037", カードAだけ("037", { 控え: "〔カードID-F0904-037〕" }));
definePlanSeed("S-F09-04-READONLY-039", カードAだけ("039"));

definePlanSeed("S-F09-04-CACHEFMT-046", {
  ケース: "046",
  フォーマット: [
    F標準("046", { 名日: "フォーマットP", 名英: "FORMAT-P", 控え: "〔フォーマットID-F0904-046A〕" }),
    F標準("046", { 名日: "フォーマットQ", 名英: "FORMAT-Q", 控え: "〔フォーマットID-F0904-046B〕" }),
  ],
  カード: [クリーチャー("カードP"), クリーチャー("カードQ")],
  デッキ: [大会デッキ("デッキ1", [[4, "カードP"]]), 大会デッキ("デッキ2", [[6, "カードQ"]], { フォーマット: 1 })],
});

// ---------------------------------------------------------------------------
// 組み合わせ（049〜054。メタゲーム分析日数は初期値のまま）
// ---------------------------------------------------------------------------

const CB = (ケース: string, 基本土地: boolean, c: C, 日前 = 5, 枚数 = 4): 計画 => ({
  ケース: `CB${ケース}`, フォーマット: [F標準(`CB${ケース}`, { 控え: `〔フォーマットID-F0904-${ケース}〕`, メタ日数: undefined, 基本土地 })],
  カード: [c], デッキ: [大会デッキ("デッキ1", [[枚数, c.名]], { 日前 })],
});
definePlanSeed("S-F09-04-CBLANDON-049", CB("049", true, 土地("カードBL", { 特殊: ["基本土地"] }), 5, 6));
definePlanSeed("S-F09-04-CBOUT14-050", CB("050", false, クリーチャー("カードA"), 15, 3));
definePlanSeed("S-F09-04-CBLEGEND-051", CB("051", true, クリーチャー("カードLG", { 特殊: ["伝説"] }), 5, 4));
definePlanSeed("S-F09-04-CBNOSPEC-052", CB("052", true, 土地("カードNL"), 5, 5));
definePlanSeed("S-F09-04-CBLEGOFF-053", CB("053", false, 土地("カードOL", { 特殊: ["伝説"] }), 5, 3));
definePlanSeed("S-F09-04-CBBASICCR-054", CB("054", true, クリーチャー("カードBC", { 特殊: ["基本土地"] }), 5, 4));

// ---------------------------------------------------------------------------
// 商品ポップアップからカートへ（038）
//
// - 在庫の申請者: シード表に行の無い、申請者とは別の管理者が要る（依頼者 PM の決定 2026-11-10: 画面から作ってよい）。
//   全権限の管理者（SETUP_ADMIN）は編集可能店舗を持たず在庫一覧に店舗の行が出ないので、在庫編集を申請する管理者
//   「F0904在庫申請者」（権限 システム管理者・所属店舗と編集可能店舗は店舗ID 1 の店舗）を作り、承認は SETUP_ADMIN が行う
//   （M05-11 と同じ組み合わせ）。
// - 在庫変動区分の「入庫の区分」は「入庫/その他」、仕入単価は 100。
// - 商品コード・商品名は実行の印を付ける（F0904-038-<印>-SKU・F0904-038-<印>-商品）。
// ---------------------------------------------------------------------------

export const F0904_STOCK_ADMIN: Account = { loginId: "f0904_stock_applicant", password: "Passw0rd!F0904Stock" };
const STOCK_ADMIN_NAME = "F0904在庫申請者";

async function 商品と在庫を用意する(page: Page, issue: (m: string) => void, browser: Browser): Promise<void> {
  const n = (名: string) => N("038", 名);
  // 【カード】詳細情報1件（レアリティ・レイアウト・プロモ種別は選択肢の先頭、Foil=なし・フレーム=通常）
  await m14カードを登録する(page, { カード名日: n("カードA"), カード名英: n("カードA"), 点数で見たマナ: "0", カードタイプ: ["クリーチャー"], 詳細: {} }, "S-F09-04-CART-038 カード", issue);
  const 詳細 = await カード詳細IDs(page);
  if (詳細.length !== 1) throw new Error(`S-F09-04-CART-038: カード ${n("カードA")} の詳細情報が1件でない（${詳細.length}件）`);
  issue("カードの詳細情報の必須項目（レアリティ・レイアウト・プロモ種別）は選択肢の先頭、Foil はなし・フレームは通常にした");
  // 【カードに紐づく商品】グッズ商品CSV登録
  const code = n("SKU");
  const categoryId = await サプライ・グッズのカテゴリID(page);
  const headers = (await downloadGoodsCsvTemplate(page)).headers;
  const extra = Object.fromEntries(headers.filter((h) => h.includes("地域") || h === "スマレジ連携フラグ").map((h) => [h, "0"]));
  issue(`グッズ商品CSVの地域別販売制限・スマレジ連携フラグの列（${Object.keys(extra).join("・") || "雛形に無い"}）を 0 にした`);
  await registerGoodsCsv(page, {
    what: "S-F09-04-CART-038 のグッズ商品CSV登録", fileName: `f0904_038_goods.csv`, categoryId,
    common: extra,
    lines: [{ code, nameJp: n("商品"), nameEn: n("PRODUCT"), values: { "基準価格": "1000", "販売価格": "1000", "買取価格": "100", "原価単価": "10" } }],
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
  });
  const productId = await openProductEditByCode(page, code);
  // 【カード指定】カード詳細を選び、商品名を入れ直して「商品を登録」
  await assignCardOnProductEdit(page, { productId, cardNameJp: n("カードA"), cardDetailId: 詳細[0], productNameJp: n("商品"), productNameEn: n("PRODUCT") }, issue);
  // 【規格】取り込みで作られた規格（日本語・ニアミント）を公開・連携しないで登録する
  const rows = await classRowsFromProductEdit(page, productId);
  if (rows.length !== 1) throw new Error(`S-F09-04-CART-038: 取り込みで作られた商品規格が1件でない（${rows.length}件）`);
  if (rows[0].言語 !== "日本語") issue(`取り込みで作られた規格の言語が「${rows[0].言語}」（シード表は日本語）`);
  if (!/ニアミント|NM/.test(rows[0].状態)) issue(`取り込みで作られた規格の状態が「${rows[0].状態}」（シード表はニアミント）`);
  await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, "S-F09-04-CART-038 規格", issue);
  // 【在庫10】申請者が在庫編集で入庫を申請し、SETUP_ADMIN が承認する
  const shop = await storeNameById(page, "1");
  await ensureMember(page, {
    名前: STOCK_ADMIN_NAME, 所属店舗: shop, ログインID: F0904_STOCK_ADMIN.loginId, メールアドレス: "f0904_stock_applicant@example.test",
    パスワード: F0904_STOCK_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
  });
  const approverName = await loggedInMemberName(page);
  const baseline = 在庫承認の最大ID();
  await withAdminSession(browser, F0904_STOCK_ADMIN, async (p2) => {
    if ((await loggedInMemberName(p2)) === approverName) throw new Error("S-F09-04-CART-038: 申請者と承認者が同じ管理者");
    const stock = new StockListPage(p2);
    await stock.searchByProductCode(code);
    await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
    await registerStockEdit(p2, { changeType: "入庫/その他", reason: "F09-04結合テスト", quantity: "10", purchasePrice: "100", approverName }, `S-F09-04-CART-038: ${code} の在庫編集（10）`, issue);
  });
  const list = new StockApprovalListPage(page);
  await list.open(shop);
  const mine = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === STOCK_ADMIN_NAME && Number(r.id) > baseline);
  if (mine.length !== 1) throw new Error(`S-F09-04-CART-038: 在庫編集の未承認の行が ${mine.length} 件（1件のはず）`);
  await list.approve([mine[0].id], "S-F09-04-CART-038: 在庫編集の承認", issue);
  issue(`在庫は、申請者「${STOCK_ADMIN_NAME}」（この E2E で作った管理者）が在庫編集で入庫10を申請し、「${approverName}」が承認した`);
}

definePlanSeed("S-F09-04-CART-038", {
  ケース: "038", フォーマット: [F標準("038")], カード: [], デッキの前: 商品と在庫を用意する,
  デッキ: [大会デッキ("デッキ1", [[4, "カードA"]])],
});

// ---------------------------------------------------------------------------
// カード画像の選び方（026〜031・047・048・055〜060。カードCSV登録で画像の候補を作る）
// 画像URL(英語)はシード表どおりファイル名だけ（「F0904-026-IMG-1.jpg」。画像のファイル自体は置かない）
// ---------------------------------------------------------------------------

/** カードXだけの1デッキ（4枚）と、画像の候補 */
const 画像2件 = (ケース: string, セット: セット[], 詳細: 詳細[]): 計画 => ({
  ケース, フォーマット: [F標準(ケース, ケース.startsWith("CB") ? { 控え: `〔フォーマットID-F0904-${ケース.slice(2)}〕` } : {})],
  カード: [], セット, 画像カード: [{ 名: "カードX", 詳細 }], デッキ: [大会デッキ("デッキ1", [[4, "カードX"]])],
});
const 画 = (ケース: string, i: string) => `F0904-${ケース}-IMG-${i}.jpg`;
const S = (記号: string, 発売日: string, 特殊 = false): セット => ({ 記号, 発売日, 特殊 });

definePlanSeed("S-F09-04-IMGSPECIAL-026", 画像2件("026", [S("1", "2025-04-01", true), S("2", "2020-04-01")], [
  { 画像: 画("026", "1"), セット: "1", 番号: 890402611, 日本語: true },
  { 画像: 画("026", "2"), セット: "2", 番号: 890402612, プロモ: true, Foil: true },
]));
definePlanSeed("S-F09-04-IMGPROMO-027", 画像2件("027", [S("1", "2025-04-01"), S("2", "2020-04-01")], [
  { 画像: 画("027", "1"), セット: "1", 番号: 890402711, プロモ: true, 日本語: true },
  { 画像: 画("027", "2"), セット: "2", 番号: 890402712, Foil: true },
]));
definePlanSeed("S-F09-04-IMGDATE-028", 画像2件("028", [S("1", "2020-04-01"), S("2", "2025-04-01")], [
  { 画像: 画("028", "1"), セット: "1", 番号: 890402811, 日本語: true },
  { 画像: 画("028", "2"), セット: "2", 番号: 890402812, Foil: true },
]));
definePlanSeed("S-F09-04-IMGFOIL-029", 画像2件("029", [S("1", "2025-04-01")], [
  { 画像: 画("029", "1"), セット: "1", 番号: 890402911, Foil: true, 日本語: true },
  { 画像: 画("029", "2"), セット: "1", 番号: 890402912 },
]));
definePlanSeed("S-F09-04-IMGLANG-030", 画像2件("030", [S("1", "2025-04-01")], [
  { 画像: 画("030", "1"), セット: "1", 番号: 890403011 },
  { 画像: 画("030", "2"), セット: "1", 番号: 890403012, 日本語: true },
]));
definePlanSeed("S-F09-04-IMGID-031", 画像2件("031", [S("1", "2025-04-01")], [
  { 画像: 画("031", "1"), セット: "1", 番号: 890403112, 日本語: true },
  { 画像: 画("031", "2"), セット: "1", 番号: 890403111, 日本語: true },
]));

definePlanSeed("S-F09-04-IMGKEY-047", {
  ケース: "047",
  フォーマット: [
    F標準("047", { 名日: "フォーマット1", 名英: "FORMAT-1", 控え: "〔フォーマットID-F0904-047A〕" }),
    F標準("047", { 名日: "フォーマット2", 名英: "FORMAT-2", 控え: "〔フォーマットID-F0904-047B〕" }),
  ],
  カード: [], セット: [S("1", "2020-04-01")],
  画像カード: (["X", "Y", "Z", "W"] as const).map((k, i) => ({ 名: `カード${k}`, 詳細: [{ 画像: 画("047", k), セット: "1", 番号: 890404711 + i * 10, 日本語: true }] })),
  デッキ: [
    大会デッキ("デッキ1", [[4, "カードX"], [3, "カードY"]]),
    大会デッキ("デッキ2", [[5, "カードZ"], [2, "カードW"]], { 大会: "大会2", フォーマット: 1 }),
  ],
});
definePlanSeed("S-F09-04-IMGLANG-048", 画像2件("048", [S("1", "2020-04-01")], [
  { 画像: 画("048", "JA"), セット: "1", 番号: 890404811, 日本語: true },
  { 画像: 画("048", "EN"), セット: "1", 番号: 890404812 },
]));

definePlanSeed("S-F09-04-CBIMGSET-055", 画像2件("CB055", [S("1", "2025-04-01"), S("2", "2025-04-01", true)], [
  { 画像: 画("CB055", "1"), セット: "1", 番号: 890410551, 日本語: true },
  { 画像: 画("CB055", "2"), セット: "2", 番号: 890410552 },
]));
definePlanSeed("S-F09-04-CBIMGPROMO-056", 画像2件("CB056", [S("1", "2025-04-01")], [
  { 画像: 画("CB056", "1"), セット: "1", 番号: 890410561, 日本語: true },
  { 画像: 画("CB056", "2"), セット: "1", 番号: 890410562, プロモ: true },
]));
definePlanSeed("S-F09-04-CBIMGDATE-057", 画像2件("CB057", [S("1", "2025-04-01"), S("2", "2020-04-01")], [
  { 画像: 画("CB057", "1"), セット: "1", 番号: 890410571, 日本語: true },
  { 画像: 画("CB057", "2"), セット: "2", 番号: 890410572 },
]));
definePlanSeed("S-F09-04-CBIMGFOIL-058", 画像2件("CB058", [S("1", "2025-04-01")], [
  { 画像: 画("CB058", "1"), セット: "1", 番号: 890410581, 日本語: true },
  { 画像: 画("CB058", "2"), セット: "1", 番号: 890410582, Foil: true },
]));
definePlanSeed("S-F09-04-CBIMGLANG-059", 画像2件("CB059", [S("1", "2025-04-01")], [
  { 画像: 画("CB059", "1"), セット: "1", 番号: 890410592 },
  { 画像: 画("CB059", "2"), セット: "1", 番号: 890410591, 日本語: true },
]));
definePlanSeed("S-F09-04-CBIMGID-060", 画像2件("CB060", [S("1", "2025-04-01")], [
  { 画像: 画("CB060", "1"), セット: "1", 番号: 890410602 },
  { 画像: 画("CB060", "2"), セット: "1", 番号: 890410601 },
]));
