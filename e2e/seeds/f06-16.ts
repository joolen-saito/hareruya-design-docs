/**
 * F06-16 大会デッキ登録編集 のシード（画面操作）。正本: cases/F06-16_seed_data.tsv
 *
 * - 店舗「晴れる屋2」・フォーマット Standard / Modern / Legacy / Commander は共有シード S-F06-16-REF が「あれば使い、無ければ作る」。
 *   店舗は編集できる管理者でないとイベント登録画面の「店舗」に並ばないので、晴れる屋2を編集できる管理者を共有シードで用意し、大会と日程はその管理者で登録する。
 * - 会員は、フロントの新規会員登録で作る（依頼者決定 2026-10-31）。メールの前半・大会名には実行の印を付ける。選手IDは会員の選手を DB の参照（SELECT）で控える。
 * - 日程は、開始 2099-12-20 10:00・デッキ登録あり・締切 2099-12-19 23:59・終了しない・受付なし・公開。
 * - 「現行カード情報」の Island・Negate は開発用の既存カードのまま使い、使用可能フォーマットへの追加はしない（開発用データを書き換えない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { カードID, カードの件数, 会員の選手ID } from "../db/f06_16";
import { カードを登録する } from "../pages/admin/m14_card";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 試験店舗を登録する, 試験店舗の管理者を用意する } from "../pages/admin/f07_01_setup";
import {
  アーキタイプを用意する, カード名リストを作る, マイデッキを登録する, 会員を用意する, 会員の指定, 試験会員, 参照フォーマット, 大会を登録する, 日程の指定, 店名, フォーマットを用意する,
} from "../pages/admin/f06_16_setup";
import { DeckEditPage } from "../pages/front/f06_16_deck_entry";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";

export const 会員一覧 = new Map<string, 試験会員 & { 選手ID: string }>();
export const 大会一覧 = new Map<string, { 大会名: string; イベントID: string; 日程ID: string }>();
export let 管理者: Account = { loginId: "", password: "" };

const label = (項目: string, 呼び名: string): string => `〔${項目}-F0616-${呼び名}〕`;

defineSeed("S-F06-16-REF", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    notes.set("〔店舗ID-F0616-共有〕", await 試験店舗を登録する(page, 店名, "f0616", (m) => reportSeedIssue(seed.シードID, m)));
    管理者 = await 試験店舗の管理者を用意する(page, "F0616", [店名]);
    for (const [i, f] of 参照フォーマット.entries()) notes.set(`〔フォーマットID-F0616-共有${"ABCD"[i]}〕`, await フォーマットを用意する(page, f));
    // マイデッキ（デッキタイプ user）の登録に要るアーキタイプを、フォーマットごとに1件ずつ作る（デッキ登録で必須の項目。名称は任意）
    for (const f of ["Standard", "Modern", "Legacy"]) await アーキタイプを用意する(page, { 名日: `F0616-${f}-アーキタイプ-${RUN_MARK}`, 名英: `F0616 ${f} Archetype ${RUN_MARK}`, フォーマット: f });
    // Island・Negate は開発用の既存カードをそのまま使う。Alpha Wolf（Standard）・Alpha Strike（Modern）は無ければ登録する
    for (const [名, フォーマット] of [["Alpha Wolf", "Standard"], ["Alpha Strike", "Modern"]] as const) {
      if (カードの件数(名) === 0) await カードを登録する(page, { カード名英: 名, 点数で見たマナ: "0", リーガリティ: [{ フォーマット, リーガリティ: "使用可" }] }, `F06-16 参照カード ${名}`, (m) => reportSeedIssue(seed.シードID, m));
    }
    const msg = await カード名リストを作る(page);
    if (!/成功|完了|作成/.test(msg)) reportSeedIssue(seed.シードID, `カード名リスト作成の結果の表示: ${msg}`);
    notes.set("〔カードID-F0616-共有A〕", カードID("Island"));
    notes.set("〔カードID-F0616-共有B〕", カードID("Negate"));
    notes.set("〔カードID-F0616-共有C〕", カードID("Alpha Wolf"));
    notes.set("〔カードID-F0616-共有D〕", カードID("Alpha Strike"));
  });
});

const SML = ["Standard", "Modern", "Legacy"];
const SM = ["Standard", "Modern"];
const 既定の日程: 日程の指定 = { 開始: "2099-12-20 10:00", デッキ登録: true, 締切: "2099-12-19 23:59", 終了する: false };

type 作り方 = {
  n: string; 大会名: string; フォーマット?: string[]; 日程?: Partial<日程の指定>;
  /** false で会員を作らない（イベント詳細の無いケース用に会員だけ作る場合は 大会なし） */
  大会なし?: boolean; 会員なし?: boolean;
  /** 本人のマイデッキ（デッキタイプ user）。他人のデッキは別の会員の所有 */
  マイデッキ?: { 符号?: string; 名: string; フォーマット: string; メイン: string; サイド?: string }[]; 他人のデッキ?: string; 会員?: Partial<会員の指定>;
  /** 会員でログインして、Standardに指定の内容を提出しておく */
  提出済み?: { メイン: string; サイド: string; 呼び名?: string };
};

async function 作る(ctx: SeedCtx, p: 作り方): Promise<void> {
  const { browser, notes } = ctx;
  let 会員!: 試験会員;
  if (!p.会員なし) {
    会員 = await 会員を用意する(browser, { ベース: `cbf0616-${p.n}`, ...p.会員 });
    const 選手ID = 会員の選手ID(会員.会員ID);
    if (!選手ID) throw new Error(`会員 ${会員.メール} の選手が見つからない`);
    会員一覧.set(p.n, { ...会員, 選手ID });
    notes.set(label("会員ID", p.n), 会員.会員ID);
    notes.set(label("選手ID", p.他人のデッキ ? `${p.n}A` : p.n), 選手ID);
  }
  if (p.大会なし) return;
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名: rc(p.大会名), フォーマット: p.フォーマット ?? SML, 日程: { ...既定の日程, ...p.日程 } });
  });
  大会一覧.set(p.n, { 大会名: rc(p.大会名), ...大 });
  notes.set(label("イベントID", p.n), 大.イベントID);
  notes.set(label("イベント詳細ID", p.n), 大.日程ID);
  if (p.マイデッキ?.length || p.他人のデッキ) {
    const 他 = p.他人のデッキ ? await 会員を用意する(browser, { ベース: `cbf0616-${p.n}-b`, 英字名: { 姓: "OTHER", 名: "PLAYER" } }) : undefined;
    const 他選手 = 他 ? 会員の選手ID(他.会員ID) : null;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(120_000);
      page.setDefaultNavigationTimeout(180_000);
      for (const d of p.マイデッキ ?? []) notes.set(label("マイデッキID", `${p.n}${d.符号 ?? ""}`), await マイデッキを登録する(page, { ...d, 選手ID: 会員一覧.get(p.n)!.選手ID, 選手名: "YAMADA TARO" }));
      if (他選手) notes.set(label("選手ID", `${p.n}B`), 他選手);
      if (p.他人のデッキ && 他選手) notes.set(label("マイデッキID", `${p.n}D`), await マイデッキを登録する(page, { 名: p.他人のデッキ, フォーマット: "Standard", メイン: "1 Island", 選手ID: 他選手, 選手名: "OTHER PLAYER" }));
    });
  }
  if (p.提出済み) {
    const context = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      page.setDefaultNavigationTimeout(120_000);
      await frontLogin(page, 会員);
      const e = new DeckEditPage(page);
      await e.開く(大.日程ID);
      if ((await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ("Standard");
      await e.入力する("メイン", p.提出済み.メイン);
      await e.入力する("サイド", p.提出済み.サイド);
      const r = await e.提出する();
      if (!r.送信) throw new Error(`ケース${p.n}: 大会デッキの提出が送信されない`);
      const デッキID = /\/deckentry\/(\d+)\/check/.exec(page.url())?.[1];
      if (!デッキID) throw new Error(`ケース${p.n}: 大会デッキを提出したが完了画面へ移らない（${page.url()}）`);
      notes.set(label("大会デッキID", p.提出済み.呼び名 ?? `${p.n}A`), デッキID);
    } finally {
      await context.close();
    }
  }
}

const defineCaseSeed = (seedId: string, n: string, 大会名 = `F06-16結合大会-${n}`, 追加: Partial<作り方> = {}): void => {
  defineSeed(seedId, { needs: ["S-F06-16-REF"] }, (ctx) => 作る(ctx, { n, 大会名, ...追加 }));
};
const 英字 = { 英字名: { 姓: "YAMADA", 名: "TARO" } };

defineCaseSeed("S-F06-16-CASE-002", "002");
defineCaseSeed("S-F06-16-CASE-003", "003", undefined, { 会員: 英字 });
defineCaseSeed("S-F06-16-CASE-004", "004");
defineCaseSeed("S-F06-16-CASE-005", "005");
defineCaseSeed("S-F06-16-CASE-006", "006");
defineCaseSeed("S-F06-16-CASE-007", "007", "単一フォーマット大会-007", { フォーマット: ["Standard"] });
defineCaseSeed("S-F06-16-CASE-008", "008");
defineCaseSeed("S-F06-16-CASE-011", "011");
defineCaseSeed("S-F06-16-CASE-012", "012");
defineCaseSeed("S-F06-16-CASE-013", "013");
defineCaseSeed("S-F06-16-CASE-014", "014");
defineCaseSeed("S-F06-16-CASE-021", "021");
defineCaseSeed("S-F06-16-CASE-022", "022");
defineCaseSeed("S-F06-16-CASE-023", "023", undefined, { 会員: 英字 });
defineCaseSeed("S-F06-16-CASE-024", "024");
defineCaseSeed("S-F06-16-CASE-025", "025");
defineCaseSeed("S-F06-16-CASE-029", "029");
defineCaseSeed("S-F06-16-CASE-036", "036", undefined, { 会員なし: true });
defineCaseSeed("S-F06-16-CASE-038", "038", undefined, { 大会なし: true });
defineCaseSeed("S-F06-16-CASE-039", "039", "登録無効大会-039", { フォーマット: ["Standard"], 日程: { デッキ登録: false } });
defineCaseSeed("S-F06-16-CASE-040", "040", "締切済み大会-040", { フォーマット: ["Standard"], 日程: { 締切: "2026-09-03 23:59" } });
defineCaseSeed("S-F06-16-CASE-041", "041", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-CASE-042", "042", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-CASE-043", "043", undefined, { 会員: 英字 });
defineCaseSeed("S-F06-16-CASE-045", "045", undefined, { 会員: { 姓: "佐藤", 名: "花子", セイ: "サトウ", メイ: "ハナコ" } });
defineCaseSeed("S-F06-16-NOCARD-056", "056", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-BOARDLINK-057", "057", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-BOARDADD-058", "058", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-BOARDHL-059", "059", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-CASE-064", "064", undefined, { フォーマット: SM, 提出済み: { メイン: "1 F0616-064-Std-Main", サイド: "1 F0616-064-Std-Side" } });
defineCaseSeed("S-F06-16-CBSHOWOK-072", "072", "F06-16組合せ大会-072", { フォーマット: SM });

const 英YT = { 英字名: { 姓: "YAMADA", 名: "TARO" } };
defineCaseSeed("S-F06-16-CASE-010", "010", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-SUGGEST-055", "055", undefined, { フォーマット: SM });
defineCaseSeed("S-F06-16-CASE-016", "016");
defineCaseSeed("S-F06-16-MYDECKCLOSE-060", "060", undefined, { フォーマット: SM, 会員: 英YT, マイデッキ: [{ 名: rc("F0616-060-Deck"), フォーマット: "Standard", メイン: "1 Island" }] });
defineCaseSeed("S-F06-16-MYDECKCOUNT-061", "061", undefined, {
  フォーマット: SM, 会員: 英YT, 他人のデッキ: rc("F0616-061-Other"),
  マイデッキ: ["A", "B", "C"].map((x) => ({ 符号: x, 名: rc(`F0616-061-${x}`), フォーマット: "Standard", メイン: "1 Island" })),
});
defineCaseSeed("S-F06-16-MYDECKFMT-062", "062", undefined, {
  フォーマット: SM, 会員: 英YT, 提出済み: { メイン: "1 Old Standard Main", サイド: "1 Old Standard Side", 呼び名: "062" },
  マイデッキ: [{ 名: rc("F0616-062-Legacy"), フォーマット: "Legacy", メイン: "3 Island", サイド: "2 Negate" }],
});
defineCaseSeed("S-F06-16-CBDECKMOD-073", "073", "F06-16組合せ大会-073", {
  フォーマット: SM, 会員: 英YT, マイデッキ: [{ 名: rc("F0616-CB073-Modern"), フォーマット: "Modern", メイン: "3 Alpha Strike", サイド: "2 Negate" }],
});
