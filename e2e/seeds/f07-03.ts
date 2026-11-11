/**
 * F07-03 大会詳細（フロント）のシード（画面操作）。正本: cases/F07-03_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。シード表から一意に決まらなかった値と、代えたもの:
 * - S-F07-03-REF（投入方法は DB フィクスチャ）: 参照マスタは既にあるものを使うだけなので登録しない（PM 方針 2026-11-10）。
 *   開催店舗を編集できる試験管理者でイベント登録画面を開き、店舗「トーナメントセンター東京」が番号1、フォーマット「スタンダード」が番号1で
 *   選択肢に出ることを確かめる（無ければ止める）。ルール適用度「初心者向け」（番号6）は、使うケース（003）を書いていないので、無ければ報告に残すだけ。
 *   「申込済みは定員に数える／取消済みと入金期限切れは数えない」はアプリの決まりで、画面で用意するものは無い。
 *   イベント登録画面の「店舗」には編集できる店舗だけが並ぶので、開催店舗を編集できる試験管理者（システム管理者）を用意する（シード表に無い。前例 F07-01）。
 * - イベント名・会員の氏名とメールアドレスは、実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * - 「状態・属性に指定の無い必須項目」は任意の値: ルール適用度は「初心者歓迎」（無ければ先頭の選択肢）、定員16・参加費0（シード表が決めていないとき）。
 *   「開始時間に任意の日時」は、2026-10-10 09:00 にした（シード表のほかの行と同じ日時）。
 * - 「オンライン受付あり」にチェックを入れ、参加費1000円の日程（050・051・053〜058・063〜067）は、大会に支払方法が無いと
 *   日程を登録できない（アプリの入力規則）。シード表は「支払方法はチェックを入れず」だが、ケースは支払方法を確かめないので、
 *   支払方法「クレジットカード決済」にチェックを入れた（前例 F07-04 の054）。
 * - 会員は、フロントの新規会員登録で作る（本登録のメールは手元の受け口で読む。開発環境では読めないので止まる見込み）。
 * - 申込（051・054）は、管理画面のイベント申込登録で、プレイヤー検索の「決定」を押して申込状況は初期値のまま登録する（F07-04 の部品）。
 * - デッキ（057・058・061・062）は、会員でログインした日本語のブラウザで大会詳細画面の「デッキ登録」を押し、メインボードを入れて提出する。
 * - 締切後のデッキ登録締切（065）は、登録後に日程編集画面で締切を直す（F07-04 の部品）。
 * - 専用ブラウザプロファイル（言語・クリップボード・外部サービスのセッション無し）は、ケースの側が新しいブラウザとして用意する。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { ScheduleInput } from "../pages/admin/schedule";
import { F0703_ADMIN, 大会と日程を登録する, 大会の入力, 試験管理者を用意する, 参照マスタを確かめる } from "../pages/admin/f07_03_setup";
import { デッキ登録締切を直す, 会員を作る, 申込登録で選手を読む, 試験会員 } from "../pages/admin/f07_04_setup";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";
import { DeckEntryEditPage } from "../pages/front/f06_16_deck_entry_k";
import { EventDetailPage } from "../pages/front/f07_03_event_detail";

/** この実行で作った会員（ケースがログインに使う）。キーはシード番号（例: 050） */
export const 会員一覧 = new Map<string, Omit<試験会員, "会員ID">>();
/** この実行で作った大会のイベント名(日)・(英)（ケースが表示を確かめる）。キーはシード番号 */
export const 大会名一覧 = new Map<string, { 日: string; 英: string }>();

const REF = "S-F07-03-REF";

defineSeed("S-F07-03-REF", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 試験管理者を用意する(page);
  });
  await withAdminSession(browser, F0703_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const r = await 参照マスタを確かめる(page);
    if (r.店舗とフォーマット.length) throw new Error(`${seed.シードID}: 参照マスタがシード表と違う: ${r.店舗とフォーマット.join(" / ")}`);
    for (const m of r.参加対象者層) reportSeedIssue(seed.シードID, m);
    reportSeedIssue(seed.シードID, "参照マスタは登録せず、イベント登録画面の選択肢に、店舗「トーナメントセンター東京」（番号1）・フォーマット「スタンダード」（番号1）があることを確かめた（シード表の投入方法は DB フィクスチャ）");
  });
});

const 呼び名 = (項目: string, n: string) => `〔${項目}-F0703-${n}〕`;

/** 大会と日程を、開催店舗を編集できる試験管理者で登録し、イベントIDとイベント詳細IDを控える */
async function 大会を作る(ctx: SeedCtx, n: string, v: 大会の入力): Promise<{ イベントID: string; 日程ID: string }> {
  const r = await withAdminSession(ctx.browser, F0703_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return 大会と日程を登録する(page, v);
  });
  for (const m of r.直したこと) reportSeedIssue(ctx.seed.シードID, m);
  ctx.notes.set(呼び名("イベントID", n), r.イベントID);
  ctx.notes.set(呼び名("イベント詳細ID", n), r.日程ID);
  大会名一覧.set(n, { 日: v.イベント名日, 英: v.イベント名英 ?? v.イベント名日 });
  return r;
}

/** 受付あり・デッキ登録あり・オンライン受付ありのチェックを外した、公開の日程 */
const 受付なしの日程 = (開始時間 = "2026-10-10 09:00", 定員?: string): ScheduleInput => ({
  開始時間, 受付あり: false, デッキ登録あり: false, 公開状態: "公開", ...(定員 ? { 定員 } : {}),
});

// ---- 基本情報・パンくず・バナー・フリーエリア・共有ボタン（ブラウザのみ） ----
/** 開始時間 2026-10-10 09:00・受付なしの日程を1つ持つ大会 */
function defineBasicSeed(seedId: string, n: string, 名: string): void {
  defineSeed(seedId, { needs: [REF] }, async (ctx) => { await 大会を作る(ctx, n, { イベント名日: rc(名), 日程: 受付なしの日程() }); });
}
defineBasicSeed("S-F07-03-CASE-004", "004", "F07-03基本大会-004");
defineBasicSeed("S-F07-03-CASE-005", "005", "F07-03基本大会-005");
defineBasicSeed("S-F07-03-CASE-006", "006", "F07-03基本大会-006");
defineBasicSeed("S-F07-03-CASE-018", "018", "F07-03基本大会-018");
defineBasicSeed("S-F07-03-CASE-033", "033", "F07-03基本大会-033");
defineBasicSeed("S-F07-03-CASE-034", "034", "F07-03基本大会-034");

defineSeed("S-F07-03-CASE-008", { needs: [REF] }, async (ctx) => {
  await 大会を作る(ctx, "008", { イベント名日: rc("F07-03バナーなし大会-008"), バナーなし: true, 日程: 受付なしの日程() });
});

/** フリー入力エリア1〜3の項目名(日)と内容(日)に任意のタイトルと内容を入れ、アコーディオンの「初期表示は閉じる」を指定の状態にする */
function defineFreeAreaSeed(seedId: string, n: string, 名: string, 閉じる: boolean): void {
  defineSeed(seedId, { needs: [REF] }, async (ctx) => {
    const area = (i: number) => ({ 項目名日: `F0703-${n}-見出し${i}`, 内容日: `<p>F0703-${n}-内容${i}</p>`, 初期表示は閉じる: 閉じる });
    await 大会を作る(ctx, n, { イベント名日: rc(名), フリー入力エリア: [area(1), area(2), area(3)], 日程: 受付なしの日程() });
  });
}
defineFreeAreaSeed("S-F07-03-CASE-012", "012", "F07-03基本大会-012", false);
defineFreeAreaSeed("S-F07-03-CASE-013", "013", "F07-03フリーエリア初期閉大会-013", true);

defineSeed("S-F07-03-LANG-041", { needs: [REF] }, async (ctx) => {
  await 大会を作る(ctx, "041", { イベント名日: rc("F0703-041-日本語名大会"), イベント名英: rc("F0703-041-EnglishName-Event"), 日程: 受付なしの日程() });
});

// イベント詳細ID 99999999 は未登録のはず。シード表の投入方法は「DBで、あれば削除する」だが、E2E は削除しない。
// 未登録であることは、画面からはケースの手順（その番号で大会詳細画面を開く）でしか分からないので、ここでは何も作らない。
defineSeed("S-F07-03-CASE-036", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "イベント詳細ID 99999999 は削除も確認もしていない（シード表の投入方法は DB での削除。E2E は DB を書き換えない）。登録されていれば、ケースの期待結果（404）が満たされず不合格に出る");
});

// ---- 申込・キャンセル申込・デッキ登録のボタンと事前予約欄（CB） ----

const クレカ = ["クレジットカード決済"];
const 期間内 = { 開始: "2020-01-01 00:00", 終了: "2099-12-20 09:00" };
const 期間外 = { 開始: "2020-01-01 00:00", 終了: "2020-12-31 23:59" };
const 締切前 = "2099-12-19 23:59";

type CBの設定 = {
  n: string;
  /** 会員を作る（フロントの新規会員登録） */
  会員?: boolean;
  /** オンライン受付時間（書かなければ「オンライン受付あり」のチェックを外す） */
  オンライン受付?: { 開始: string; 終了: string };
  定員?: string;
  デッキ?: { 終了する: boolean; 登録後の締切?: string };
  /** 会員の申込を、管理画面のイベント申込登録で1件登録する */
  申込?: boolean;
  /** 会員で大会詳細画面から「デッキ登録」を押し、メインボードを入れて提出する */
  デッキを提出?: boolean;
};

async function 会員を用意する(browser: Browser, n: string): Promise<Omit<試験会員, "会員ID">> {
  // お名前「試験 F0703-CBnnn」・メール cbf0703-nnn@example.test・パスワード Passw0rd-CBF0703nnn（メールと名に実行の印）
  const m = await 会員を作る(browser, `cbf0703-${n}`, "", { 姓: "試験", 名: rc(`F0703-CB${n}`) }, `Passw0rd-CBF0703${n}`);
  会員一覧.set(n, m);
  return m;
}

/** 会員でログインした日本語のブラウザで、大会詳細画面の「デッキ登録」を押し、メインボードを入れて提出する */
async function 大会デッキを提出する(browser: Browser, seedId: string, m: { メール: string; パスワード: string }, 日程ID: string, メイン: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await frontLogin(page, m);
    const detail = new EventDetailPage(page);
    await detail.開く(日程ID);
    const button = detail.デッキ登録ボタン(日程ID);
    if ((await button.count()) !== 1) throw new Error(`${seedId}: 大会詳細画面に「デッキ登録」のボタンが無い（${await button.count()} 個）`);
    await detail.押して移る(button);
    const d = new DeckEntryEditPage(page);
    if (!(await d.編集画面である())) throw new Error(`${seedId}: 「デッキ登録」を押しても大会デッキ登録編集画面にならない（${d.path}）`);
    await d.メインボード.fill(メイン);
    const r = await d.提出する();
    if (!r.sent || !d.完了画面のデッキID()) throw new Error(`${seedId}: デッキを提出してもデッキ登録完了画面へ移らない（${d.path}・${(await d.入力形式の誤りの表示()).join(" / ")}）`);
  } finally { await context.close(); }
}

function defineCBSeed(seedId: string, s: CBの設定): void {
  defineSeed(seedId, { needs: [REF] }, async (ctx) => {
    const m = s.会員 ? await 会員を用意する(ctx.browser, s.n) : null;
    const 定員 = s.定員 ?? "10";
    const 名 = rc(`F0703-CB${s.n}-大会`);
    const r = await 大会を作る(ctx, s.n, {
      イベント名日: 名, イベント名英: rc(`F0703-CB${s.n}-Event`), 定員, 参加費: "1000", 支払方法: s.オンライン受付 ? クレカ : [],
      日程: {
        開始時間: "2099-12-20 10:00", 受付あり: false, 公開状態: "公開", 定員, 参加費: "1000",
        デッキ登録あり: !!s.デッキ, ...(s.デッキ ? { デッキ登録締切: 締切前, デッキ登録を終了する: s.デッキ.終了する } : {}),
        ...(s.オンライン受付 ? { オンライン受付: s.オンライン受付 } : {}),
      },
    });
    if (s.デッキ?.登録後の締切) {
      const 締切 = s.デッキ.登録後の締切;
      await withAdminSession(ctx.browser, F0703_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await デッキ登録締切を直す(page, r.イベントID, r.日程ID, 締切); });
    }
    if (s.申込 && m) {
      await withAdminSession(ctx.browser, F0703_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await 申込登録で選手を読む(page, { イベント名: 名, イベントID: r.イベントID, 日程ID: [r.日程ID], 開催日: ["2099-12-20"] }, 0, m.氏名, true);
      });
    }
    if (s.デッキを提出 && m) await 大会デッキを提出する(ctx.browser, ctx.seed.シードID, m, r.日程ID, `4 F0703-CB${s.n}-Card`);
  });
}

defineCBSeed("S-F07-03-CBBTN-050", { n: "050", 会員: true, オンライン受付: 期間内 });
defineCBSeed("S-F07-03-CBBTN-051", { n: "051", 会員: true, オンライン受付: 期間内, 申込: true });
defineCBSeed("S-F07-03-CBBTN-052", { n: "052" });
defineCBSeed("S-F07-03-CBBTN-053", { n: "053", オンライン受付: 期間外 });
defineCBSeed("S-F07-03-CBBTN-054", { n: "054", 会員: true, オンライン受付: 期間内, 定員: "1", 申込: true });
defineCBSeed("S-F07-03-CBDECK-055", { n: "055", 会員: true, オンライン受付: 期間内, デッキ: { 終了する: false } });
defineCBSeed("S-F07-03-CBDECK-056", { n: "056", 会員: true, オンライン受付: 期間内, デッキ: { 終了する: false } });
defineCBSeed("S-F07-03-CBDECK-057", { n: "057", 会員: true, オンライン受付: 期間内, デッキ: { 終了する: false }, デッキを提出: true });
defineCBSeed("S-F07-03-CBDECK-058", { n: "058", 会員: true, オンライン受付: 期間内, デッキ: { 終了する: false }, デッキを提出: true });
defineCBSeed("S-F07-03-CBDECK-059", { n: "059", 会員: true, デッキ: { 終了する: false } });
defineCBSeed("S-F07-03-CBDECK-060", { n: "060", 会員: true, デッキ: { 終了する: false } });
defineCBSeed("S-F07-03-CBDECK-061", { n: "061", 会員: true, デッキ: { 終了する: false }, デッキを提出: true });
defineCBSeed("S-F07-03-CBDECK-062", { n: "062", 会員: true, デッキ: { 終了する: false }, デッキを提出: true });
defineCBSeed("S-F07-03-CBDECK-063", { n: "063", 会員: true, オンライン受付: 期間内 });
defineCBSeed("S-F07-03-CBDECK-064", { n: "064", 会員: true, オンライン受付: 期間内, デッキ: { 終了する: true } });
defineCBSeed("S-F07-03-CBDECK-065", { n: "065", 会員: true, オンライン受付: 期間内, デッキ: { 終了する: false, 登録後の締切: "2020-12-31 23:59" } });
defineCBSeed("S-F07-03-CBPRE-066", { n: "066", オンライン受付: 期間内 });
defineCBSeed("S-F07-03-CBPRE-067", { n: "067", オンライン受付: 期間外 });
defineCBSeed("S-F07-03-CBPRE-068", { n: "068" });
