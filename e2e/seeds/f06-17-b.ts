/**
 * F06-17 大会デッキ登録確認〜完了 の続き（-b）のシード（画面操作）。正本: cases/F06-17_seed_data.tsv
 * 既存の seeds/f06-17.ts は変えない（前の担当の判定の前提が変わるため）。共有シード S-F06-17-REF（店舗・フォーマット・カード）はそちらのものを使う。
 *
 * - 国内の会員は、フロントの新規会員登録で作る。海外住所の会員は米国の住所で新規会員登録する。英字名は管理画面の会員編集で入れる（空の指定は入れない）。
 * - 日程は、開始 2099-12-20 10:00・デッキ登録あり・締切 2099-12-31 23:59・終了しない・受付なし・公開。フォーマットは「スタンダード試験」だけ。
 * - 「旧カード」の大会デッキは、会員でログインして画面から提出し、管理画面のデッキ編集画面で更新して作る（編集者の設定・プレイヤー名の変更）。
 */
import { 会員の選手ID, 編集者ID } from "../db/f06_16";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { SETUP_ADMIN } from "../config/env";
import { アーキタイプを用意する, 会員の指定, 会員を用意する, 試験会員, 大会を登録する, 日程の指定 } from "../pages/admin/f06_16_setup";
import { デッキを管理画面で更新する, 海外会員を用意する } from "../pages/admin/f06_16_b_setup";
import { カード名, 店名17 } from "../pages/admin/f06_17_setup";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../pages/front/f06_16_deck_entry";
import { 管理者 } from "./f06-17";
import "./f06-17";

export const 会員一覧B = new Map<string, 試験会員 & { 選手ID: string }>();
export const 大会一覧B = new Map<string, { 大会名: string; イベントID: string; 日程ID: string }>();
export const 提出したデッキB = new Map<string, string>();
export const 保持するプレイヤー名 = (n: string): string => rc(`F0617-CB${n}-KEEP`);

const label = (項目: string, 呼び名: string): string => `〔${項目}-F0617-${呼び名}〕`;
const 既定の日程: 日程の指定 = { 開始: "2099-12-20 10:00", デッキ登録: true, 締切: "2099-12-31 23:59", 終了する: false };
const 英TT = { 姓: "TEST", 名: "TARO" };

type 作り方 = {
  n: string; 呼び名?: string; 大会名: string;
  国内?: Partial<会員の指定>; 海外?: { 姓: string; 名: string; 英字名?: { 姓?: string; 名?: string } };
  /** 「1 旧カード」を提出し、管理画面で更新しておく。プレイヤー名を渡すと入れ替える */
  旧デッキ?: { プレイヤー名?: string };
};

async function 提出する(ctx: SeedCtx, 会員: 試験会員, 日程ID: string, メイン: string): Promise<string> {
  const context = await ctx.browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(120_000);
    await frontLogin(page, 会員);
    const e = new DeckEditPage(page);
    await e.開く(日程ID);
    if ((await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ("スタンダード試験");
    await e.入力する("メイン", メイン);
    await e.入力する("サイド", "");
    const r = await e.提出する();
    if (!r.送信) throw new Error("大会デッキの提出が送信されない");
    const id = /\/deckentry\/(\d+)\/check/.exec(page.url())?.[1];
    if (!id) throw new Error(`大会デッキを提出したが完了画面へ移らない（${page.url()}）`);
    return id;
  } finally {
    await context.close();
  }
}

async function 作る(ctx: SeedCtx, p: 作り方): Promise<void> {
  const { browser, notes } = ctx;
  const 会員 = p.海外
    ? await 海外会員を用意する(browser, { ベース: `f0617-${p.n}`, ...p.海外 })
    : await 会員を用意する(browser, { ベース: `f0617-${p.n}`, ...p.国内 });
  const 選手ID = 会員の選手ID(会員.会員ID);
  if (!選手ID) throw new Error(`会員 ${会員.メール} の選手が見つからない`);
  会員一覧B.set(p.n, { ...会員, 選手ID });
  const 呼 = p.呼び名 ?? p.n;
  notes.set(label("会員ID", 呼), 会員.会員ID);
  notes.set(label("選手ID", 呼), 選手ID);
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名: rc(p.大会名), 店舗: 店名17, フォーマット: ["スタンダード試験"], 日程: 既定の日程 });
  });
  大会一覧B.set(p.n, { 大会名: rc(p.大会名), ...大 });
  notes.set(label("イベントID", 呼), 大.イベントID);
  notes.set(label("イベント詳細ID", 呼), 大.日程ID);
  if (p.旧デッキ) {
    // 管理画面のデッキ編集画面はアーキタイプが必須。共有のフォーマット「スタンダード試験」にはアーキタイプが無いので、ケースのシードの中で（実行の印つきで）1件作る
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(120_000);
      page.setDefaultNavigationTimeout(180_000);
      await アーキタイプを用意する(page, { 名日: `F0617-${p.n}-アーキタイプ-${RUN_MARK}`, 名英: `F0617 ${p.n} Archetype ${RUN_MARK}`, フォーマット: "スタンダード試験" });
    });
    const id = await 提出する(ctx, 会員, 大.日程ID, `1 ${カード名.旧()}`);
    提出したデッキB.set(p.n, id);
    notes.set(label("デッキID", 呼), id);
    await withAdminSession(browser, 管理者, async (page) => {
      page.setDefaultTimeout(120_000);
      page.setDefaultNavigationTimeout(180_000);
      const 補った = await デッキを管理画面で更新する(page, id, p.旧デッキ?.プレイヤー名);
      if (補った.length) reportSeedIssue(ctx.seed.シードID, `管理画面のデッキ編集画面で、空の必須の選択欄（${補った.join("、")}）の先頭の選択肢を選んで更新した（正本の外の補い）`);
      reportSeedIssue(ctx.seed.シードID, "シード表は「管理画面のデッキ一覧でイベント詳細IDを入れて検索し、1件であることを確かめて編集画面を開く」だが、デッキ一覧は大会開始前（開始 2099-12-20）のデッキを表示しないため、提出時に控えたデッキIDで編集画面を直接開いて更新した（正本の外の補い）");
      if (p.n === "005") notes.set(label("編集者ID", 呼), 編集者ID(id));
    });
  }
}

const def = (seedId: string, p: 作り方): void => { defineSeed(seedId, { needs: ["S-F06-17-REF"] }, (ctx) => 作る(ctx, p)); };

def("S-F06-17-CASE-005", { n: "005", 大会名: "F06-17単一形式大会-005", 国内: { 英字名: 英TT }, 旧デッキ: {} });
def("S-F06-17-CASE-006", { n: "006", 大会名: "F06-17単一形式大会-006", 海外: { 姓: "Alex", 名: "Smith" } });
def("S-F06-17-CBNEW-044", { n: "044", 呼び名: "CB044", 大会名: "F06-17単一形式大会-CB044", 海外: { 姓: "F0617CB044", 名: "Ab", 英字名: 英TT } });
def("S-F06-17-CBUPD-045", { n: "045", 呼び名: "CB045", 大会名: "F06-17単一形式大会-CB045", 海外: { 姓: "F0617CB045", 名: "Ab", 英字名: 英TT }, 旧デッキ: { プレイヤー名: 保持するプレイヤー名("045") } });
def("S-F06-17-CBUPD-046", { n: "046", 呼び名: "CB046", 大会名: "F06-17単一形式大会-CB046", 国内: { 姓: "F0617CB046", 名: "Ab", セイ: "サトウ", メイ: "ジロウ", 英字名: 英TT }, 旧デッキ: { プレイヤー名: 保持するプレイヤー名("046") } });
def("S-F06-17-CBUPD-047", { n: "047", 呼び名: "CB047", 大会名: "F06-17単一形式大会-CB047", 海外: { 姓: "F0617CB047", 名: "Ab" }, 旧デッキ: { プレイヤー名: 保持するプレイヤー名("047") } });
def("S-F06-17-CBUPD-048", { n: "048", 呼び名: "CB048", 大会名: "F06-17単一形式大会-CB048", 国内: { 姓: "F0617CB048", 名: "Ab", セイ: "スズキ", メイ: "サブロウ" }, 旧デッキ: { プレイヤー名: 保持するプレイヤー名("048") } });
