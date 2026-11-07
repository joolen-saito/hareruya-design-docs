/**
 * F06-16 大会デッキ登録編集 の続き（-b）のシード（画面操作）。正本: cases/F06-16_seed_data.tsv
 * 既存の seeds/f06-16.ts は変えない（前の担当の判定の前提が変わるため）。共有シード S-F06-16-REF はそちらのものを使う。
 *
 * - 会員は、フロントの新規会員登録で作る（国内は山田太郎などの任意の氏名、海外は米国の住所）。英字名は管理画面の会員編集で入れる。
 * - 日程は、開始 2099-12-20 10:00・デッキ登録あり・締切 2099-12-19 23:59・終了しない・受付なし・公開。
 * - カード（統率者・島・Opt など、シード表が作ると定めたもの）は、名前に実行の印を付けてカード新規登録画面で作る。
 *   マイデッキの文に入れるカード名も、同じ印つきの名前にする。
 * - 統率者フォーマットのマイデッキに要るアーキタイプは、ケースのシードの中で（実行の印つきで）1件作る。
 */
import { SETUP_ADMIN } from "../config/env";
import { カードID, 会員の選手ID } from "../db/f06_16";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { アーキタイプを用意する, マイデッキを登録する, 会員の指定, 会員を用意する, 試験会員, 大会を登録する, 日程の指定 } from "../pages/admin/f06_16_setup";
import { 海外会員を用意する } from "../pages/admin/f06_16_b_setup";
import { カードを登録する } from "../pages/admin/m14_card";
import { 管理者 } from "./f06-16";
import "./f06-16";

export const 会員一覧B = new Map<string, 試験会員 & { 選手ID: string }>();
export const 大会一覧B = new Map<string, { 大会名: string; イベントID: string; 日程ID: string }>();

const label = (項目: string, 呼び名: string): string => `〔${項目}-F0616-${呼び名}〕`;
const SM = ["Standard", "Modern"];
const SML = ["Standard", "Modern", "Legacy"];
const 既定の日程: 日程の指定 = { 開始: "2099-12-20 10:00", デッキ登録: true, 締切: "2099-12-19 23:59", 終了する: false };
const 英YT = { 英字名: { 姓: "YAMADA", 名: "TARO" } };

type 会員の作り方 = { 呼び名?: string; 国内?: Partial<会員の指定>; 海外?: { 姓: string; 名: string; 英字名?: { 姓?: string; 名?: string } } };

/** 会員と大会（日程）を作って控える。会員を作らないときは 会員 を省略 */
async function 会員と大会を作る(ctx: SeedCtx, n: string, 大会名: string, フォーマット: string[], 会員: 会員の作り方): Promise<{ 会員: 試験会員 & { 選手ID: string }; 日程ID: string }> {
  const { browser, notes } = ctx;
  const m = 会員.海外
    ? await 海外会員を用意する(browser, { ベース: `cbf0616-${n}`, ...会員.海外 })
    : await 会員を用意する(browser, { ベース: `cbf0616-${n}`, ...会員.国内 });
  const 選手ID = 会員の選手ID(m.会員ID);
  if (!選手ID) throw new Error(`会員 ${m.メール} の選手が見つからない`);
  const 会員情報 = { ...m, 選手ID };
  会員一覧B.set(n, 会員情報);
  notes.set(label("会員ID", 会員.呼び名 ?? n), m.会員ID);
  notes.set(label("選手ID", 会員.呼び名 ?? n), 選手ID);
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名: rc(大会名), フォーマット, 日程: 既定の日程 });
  });
  大会一覧B.set(n, { 大会名: rc(大会名), ...大 });
  notes.set(label("イベントID", n), 大.イベントID);
  notes.set(label("イベント詳細ID", n), 大.日程ID);
  return { 会員: 会員情報, 日程ID: 大.日程ID };
}

const 設定管理画面 = <T>(ctx: SeedCtx, f: (page: import("@playwright/test").Page) => Promise<T>): Promise<T> =>
  withAdminSession(ctx.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return f(page);
  });

// ---- 017: 本人所有のマイデッキ21件（PageDeck01〜21。あとから登録したものほど作成日が新しい） ----
defineSeed("S-F06-16-CASE-017", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  const { 会員 } = await 会員と大会を作る(ctx, "017", "F06-16結合大会-017", SML, { 国内: 英YT });
  await 設定管理画面(ctx, async (page) => {
    for (let i = 1; i <= 21; i++) {
      const nn = String(i).padStart(2, "0");
      const id = await マイデッキを登録する(page, { 名: `PageDeck${nn}`, フォーマット: "Standard", メイン: "1 Island", 選手ID: 会員.選手ID, 選手名: "YAMADA TARO" });
      // シード表が呼び名を定めているのは先頭（A）と末尾（U）だけ
      if (i === 1) ctx.notes.set(label("マイデッキID", "017A"), id);
      if (i === 21) ctx.notes.set(label("マイデッキID", "017U"), id);
    }
  });
});

// ---- 019: 本人所有 Own New と、他会員所有 Other Deck ----
defineSeed("S-F06-16-CASE-019", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  const { 会員 } = await 会員と大会を作る(ctx, "019", "F06-16結合大会-019", SM, { 呼び名: "019A", 国内: 英YT });
  const 他 = await 会員を用意する(ctx.browser, { ベース: "cbf0616-019-b", 英字名: { 姓: "OTHER", 名: "PLAYER" } });
  const 他選手 = 会員の選手ID(他.会員ID);
  if (!他選手) throw new Error("他会員の選手が見つからない");
  ctx.notes.set(label("会員ID", "019B"), 他.会員ID);
  ctx.notes.set(label("選手ID", "019B"), 他選手);
  await 設定管理画面(ctx, async (page) => {
    ctx.notes.set(label("マイデッキID", "019A"), await マイデッキを登録する(page, { 名: "Own New", フォーマット: "Standard", メイン: "1 Island", 選手ID: 会員.選手ID, 選手名: "YAMADA TARO" }));
    ctx.notes.set(label("マイデッキID", "019B"), await マイデッキを登録する(page, { 名: "Other Deck", フォーマット: "Standard", メイン: "1 Island", 選手ID: 他選手, 選手名: "OTHER PLAYER" }));
  });
});

// ---- 統率者フォーマットのマイデッキ（020・074・075） ----
export const 統率カード名 = {
  "020": { 統率: () => rc("統率者"), 島: () => rc("島"), Opt: () => rc("Opt") },
  "074": { 統率: () => rc("統率者-F0616-CB074"), 島: () => rc("島-F0616-CB074") },
  "075": { 統率: () => rc("統率者-F0616-CB075"), 島: () => rc("島-F0616-CB075") },
};

async function 統率デッキを作る(ctx: SeedCtx, n: string, 選手ID: string, デッキ名: string, 統率: string, メイン: string, カード: { 日?: string; 英: string }[]): Promise<void> {
  const 符号 = "ABC";
  await 設定管理画面(ctx, async (page) => {
    for (const c of カード) {
      await カードを登録する(page, { カード名日: c.日, カード名英: c.英, 点数で見たマナ: "0", リーガリティ: [{ フォーマット: "Commander", リーガリティ: "使用可" }] }, `F06-16-${n} 統率者カード ${c.日 ?? c.英}`, (m) => reportSeedIssue(ctx.seed.シードID, m));
    }
    カード.forEach((c, i) => ctx.notes.set(label("カードID", `${n}${符号[i]}`), カードID(c.英)));
    await アーキタイプを用意する(page, { 名日: `F0616-${n}-Commander-アーキタイプ-${RUN_MARK}`, 名英: `F0616 ${n} Commander Archetype ${RUN_MARK}`, フォーマット: "Commander" });
    ctx.notes.set(label("マイデッキID", n), await マイデッキを登録する(page, { 名: デッキ名, フォーマット: "Commander", メイン, 統率, 選手ID, 選手名: "YAMADA TARO" }));
  });
}

defineSeed("S-F06-16-CASE-020", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  const { 会員 } = await 会員と大会を作る(ctx, "020", "統率者フォーマット大会-020", ["Commander"], { 国内: 英YT });
  const N = 統率カード名["020"];
  await 統率デッキを作る(ctx, "020", 会員.選手ID, "Commander Import", `1 ${N.統率()}`, `4 ${N.島()}\n2 ${N.Opt()}`, [
    { 日: N.統率(), 英: rc("F0616-020 Commander") }, { 日: N.島(), 英: rc("F0616-020 Island") }, { 英: N.Opt() },
  ]);
});

defineSeed("S-F06-16-CBDECKCMD-074", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  const { 会員 } = await 会員と大会を作る(ctx, "074", "F06-16組合せ大会-074", ["Standard", "Commander"], { 国内: 英YT });
  const N = 統率カード名["074"];
  await 統率デッキを作る(ctx, "074", 会員.選手ID, "F0616-CB074-Commander", `1 ${N.統率()}`, `4 ${N.島()}`, [
    { 日: N.統率(), 英: rc("F0616-074 Commander") }, { 日: N.島(), 英: rc("F0616-074 Island") },
  ]);
});

defineSeed("S-F06-16-CBDECKCMDNG-075", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  const { 会員 } = await 会員と大会を作る(ctx, "075", "F06-16組合せ大会-075", SM, { 国内: 英YT });
  const N = 統率カード名["075"];
  await 統率デッキを作る(ctx, "075", 会員.選手ID, "F0616-CB075-Commander", `1 ${N.統率()}`, `4 ${N.島()}`, [
    { 日: N.統率(), 英: rc("F0616-075 Commander") }, { 日: N.島(), 英: rc("F0616-075 Island") },
  ]);
});

// ---- 044・070: 海外住所の会員 ----
defineSeed("S-F06-16-CASE-044", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  await 会員と大会を作る(ctx, "044", "F06-16結合大会-044", SM, { 海外: { 姓: "John", 名: "Smith" } });
});
defineSeed("S-F06-16-CBNWGIVUNM-070", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  await 会員と大会を作る(ctx, "070", "F06-16組合せ大会-070", SM, { 海外: { 姓: "John", 名: "Smith", 英字名: { 姓: "YAMADA" } } });
});

// ---- 069: 国内会員で英字姓が空・英字名が TARO ----
defineSeed("S-F06-16-CBNWFAMALL-069", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  await 会員と大会を作る(ctx, "069", "F06-16組合せ大会-069", SM, { 国内: { 英字名: { 姓: "", 名: "TARO" } } });
});

// ---- 052: Standard の禁止カードを登録しておく ----
export const 禁止カード名 = () => rc("Forbidden Card");
defineSeed("S-F06-16-CASE-052", { needs: ["S-F06-16-REF"] }, async (ctx) => {
  await 会員と大会を作る(ctx, "052", "F06-16結合大会-052", SM, { 国内: 英YT });
  await 設定管理画面(ctx, async (page) => {
    await カードを登録する(page, { カード名英: 禁止カード名(), 点数で見たマナ: "0", リーガリティ: [{ フォーマット: "Standard", リーガリティ: "禁止" }] }, "F06-16-052 禁止カード", (m) => reportSeedIssue(ctx.seed.シードID, m));
    ctx.notes.set(label("カードID", "052"), カードID(禁止カード名()));
  });
});
