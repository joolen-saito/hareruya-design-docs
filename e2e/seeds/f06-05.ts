/**
 * F06-05 マイページのシード（画面操作）。正本: cases/F06-05_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）に沿った読み替え。読み替えは各シードの注記（エビデンスの「シード作成時の問題」）に残す。
 * - 会員: フロントの会員情報登録画面で登録し本会員にする（本登録のメールを読めない環境は管理画面で本会員にする。pages/front/m08_member.ts）。
 *   メールアドレスの前半には実行の印を付ける。パスワードには付けない。会員ID・スマレジ側会員番号は管理画面の会員登録/編集で、
 *   プレイヤーIDはDBの参照（読むだけ）で控える（イベント申込登録のプレイヤー検索の代わり。F03-07・F06-08 と同じ扱い）。
 * - ポイント: 会員登録/編集の「ポイント管理・履歴一覧」から「ポイント付与（キャンペーン、特別対応）」で付ける。
 *   「有効期限が2026-09-30になる日」は、試験実施日からの相対の日付に読み替える（有効日数183日。実施日が変わっても期限切れにならない）。
 *   「保有ポイント500」は画面で指定できないので、E2E が作った印つきの会員に限り DB で設定する（db/f06_05_prep.ts）。
 * - 環境（S-F06-05-ENV）: バーコード接頭番号・桁数・スマレジ接続先・店頭受取連携・非同期処理は共有の設定なので書き換えない。
 *   環境に設定済みの値のまま使い、書き換えも確認の操作もしない。
 * - 実装しないシード: 店頭受取（018・019。スマレジ試験環境での読取）、外部問い合わせなしの確認（043。受信サーバーを共有のスマレジ接続先に設定する）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { プレイヤーID, 有効な依頼件数 } from "../db/f03_07";
import { 保有ポイント } from "../db/f06_05";
import { 保有ポイントを設定する } from "../db/f06_05_prep";
import { available } from "../lib/db";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { スマレジIDを読む } from "../pages/admin/f06_18_setup";
import { ポイント履歴の行, ポイント履歴を読む, ポイントを付与する, 今日から, 日付の文字列 } from "../pages/admin/f06_05_setup";
import { 在庫を入れて在庫IDを読む } from "../pages/admin/f06_09_setup";
import { フロントで会員登録する } from "../pages/front/m08_member";
import { createProducts } from "./f03-07";
import { markedMail } from "./f06-member";

export type 作った会員 = { 会員ID: string; メール: string; パスワード: string; スマレジ番号: string };
const 会員一覧 = new Map<string, 作った会員>();
/** この実行のシードが作った会員（キーはシードID） */
export function 会員(seedId: string): 作った会員 {
  const m = 会員一覧.get(seedId);
  if (!m) throw new Error(`${seedId} の会員を、この実行のシードが作っていない`);
  return m;
}
/** 失効期限・ポイント履歴ID の控え以外に、ケースが使う値（キーはシードID） */
const 履歴の控え = new Map<string, ポイント履歴の行[]>();
export function ポイント履歴(seedId: string): ポイント履歴の行[] {
  return 履歴の控え.get(seedId) ?? [];
}

const 管理画面 = <T>(browser: Browser, fn: (page: import("@playwright/test").Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 管理画面の会員一覧でメールアドレスを検索して会員IDを読む（登録直後は検索に出るまで遅れることがあるので、間をおいて検索し直す） */
async function 会員IDを探す(browser: Browser, メール: string): Promise<string> {
  return 管理画面(browser, async (page) => {
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      const id = await resultCustomerId(page, メール);
      if (id) return id;
      if (i >= 5) throw new Error(`登録した会員 ${メール} を会員一覧で探せない（約1分おいて検索し直しても同じ）`);
      await page.waitForTimeout(10_000);
    }
  });
}

/** シードIDから、呼び名の語（共有BASIC は「共有-BASIC」、それ以外は末尾の番号3桁）を決める */
const 呼び名の語 = (seedId: string): string => (seedId === "S-F06-05-BASIC" ? "共有-BASIC" : /(\d{3})$/.exec(seedId)![1]);

type 会員の作り方 = { 前半: string; パスワード: string; 姓?: string; 名?: string };

/** 会員を登録して本会員にし、会員ID・スマレジ側会員番号・プレイヤーIDを控える */
async function 会員を作る(ctx: SeedCtx, o: 会員の作り方): Promise<作った会員> {
  const seedId = ctx.seed.シードID;
  const メール = markedMail(o.前半);
  await フロントで会員登録する(ctx.browser, { 姓: o.姓 ?? "結合試験", 名: o.名 ?? "マイページ", セイ: "ケツゴウシケン", メイ: "マイページ", メール, パスワード: o.パスワード });
  const 会員ID = await 会員IDを探す(ctx.browser, メール);
  let スマレジ = "";
  for (let i = 0; i < 3 && !スマレジ; i++) {
    スマレジ = await 管理画面(ctx.browser, (page) => スマレジIDを読む(page, 会員ID));
    if (!スマレジ && i < 2) await new Promise((r) => setTimeout(r, 10_000));
  }
  const 語 = 呼び名の語(seedId);
  ctx.notes.set(`〔会員ID-F0605-${語}〕`, 会員ID);
  ctx.notes.set(`〔スマレジ側会員番号-F0605-${語}〕`, スマレジ || "（空）");
  const pid = available ? プレイヤーID(会員ID) : "（DB確認なし）";
  if (!pid) throw new Error(`${seedId}: 会員ID ${会員ID} のプレイヤーが見つからない`);
  ctx.notes.set(`〔プレイヤーID-F0605-${語}〕`, pid);
  const m: 作った会員 = { 会員ID, メール, パスワード: o.パスワード, スマレジ番号: スマレジ };
  会員一覧.set(seedId, m);
  reportSeedIssue(seedId, `会員 ${メール}（会員ID ${会員ID}）を登録して本会員にした。プレイヤーIDはイベント申込登録のプレイヤー検索の代わりに、DBの参照（読むだけ）で控えた`);
  if (!スマレジ) reportSeedIssue(seedId, "会員登録/編集画面のスマレジIDが空だった（スマレジ側の会員番号が割り当てられていない）。呼び名には「（空）」を控えた");
  return m;
}

/** ポイントを付与し（増減量, 発行日）、履歴一覧を読み直して返す */
async function ポイントを付ける(ctx: SeedCtx, 会員ID: string, 付与: [number, string][]): Promise<ポイント履歴の行[]> {
  const rows = await 管理画面(ctx.browser, async (page) => {
    for (const [量, 日] of 付与) await ポイントを付与する(page, 会員ID, 量, 日);
    return ポイント履歴を読む(page, 会員ID);
  });
  if (rows.length !== 付与.length) throw new Error(`${ctx.seed.シードID}: 会員ID ${会員ID} のポイント履歴が ${rows.length} 件（${付与.length} 件のはず）`);
  履歴の控え.set(ctx.seed.シードID, rows);
  return rows;
}
function 履歴の行(rows: ポイント履歴の行[], 増減量: number): ポイント履歴の行 {
  const hit = rows.filter((r) => r.増減量 === 増減量);
  if (hit.length !== 1) throw new Error(`ポイント履歴に増減量 ${増減量} の行が ${hit.length} 件（1件のはず）`);
  return hit[0];
}
const 期限の読み替え = "シード表の「有効期限が2026-09-30になる日」「失効期限は試験実施日から183日後」は、試験実施日からの相対の日付で付与した（有効日数183日の設定。ポイント発行日を指定して付与し、履歴一覧の有効期限を控えた）";

// ---------------------------------------------------------------------------
// 環境
// ---------------------------------------------------------------------------
defineSeed("S-F06-05-ENV", async () => {
  reportSeedIssue("S-F06-05-ENV", "バーコード接頭番号・全体桁数・スマレジ接続先・店頭受取連携の店舗ID／店舗コード／部門ID・非同期処理は、共有の設定なので書き換えず、環境に設定済みの値のまま使った（書き換えも確認の操作もしていない）。本店EC日本語版は既に利用可能な環境を使った");
});

// ---------------------------------------------------------------------------
// 共有の基本会員（保有ポイント500・ポイント履歴3件）
// ---------------------------------------------------------------------------
defineSeed("S-F06-05-BASIC", async (ctx) => {
  const id = "S-F06-05-BASIC";
  const m = await 会員を作る(ctx, { 前半: "f0605", パスワード: "Passw0rd!F0605" });
  // A・B は同じ失効期限、C はその31日後（シード表の 2026-09-30 と 2026-10-31 の間隔）。発行日は A・B が今日の150日前、C が119日前
  const A = 日付の文字列(今日から(-150));
  const C = 日付の文字列(今日から(-119));
  const rows = await ポイントを付ける(ctx, m.会員ID, [[100, A], [150, A], [300, C]]);
  ctx.notes.set("〔ポイント履歴ID-F0605-共有-BASIC-A〕", 履歴の行(rows, 100).ID);
  ctx.notes.set("〔ポイント履歴ID-F0605-共有-BASIC-B〕", 履歴の行(rows, 150).ID);
  ctx.notes.set("〔ポイント履歴ID-F0605-共有-BASIC-C〕", 履歴の行(rows, 300).ID);
  reportSeedIssue(id, `${期限の読み替え}。〔ポイント履歴ID-F0605-共有-BASIC-A〕〔…-B〕は失効期限が同じ（${履歴の行(rows, 100).有効期限}）、〔…-C〕は${履歴の行(rows, 300).有効期限}`);
  if (!available) throw new Error(`${id}: 保有ポイント500はDBで設定する（画面で指定できない）が、この環境はDBの接続先が無い`);
  保有ポイントを設定する(m.会員ID, 500, RUN_MARK);
  const 値 = 保有ポイント(m.会員ID);
  if (値 !== 500) throw new Error(`${id}: 保有ポイントを500に設定したのに ${値} になっている`);
  reportSeedIssue(id, "保有ポイント500は画面で指定できない（ポイント付与の画面で3件を登録した時点は合計550）ので、DBで、この会員（印つき）の保有ポイントを500に設定した");
});

// ---------------------------------------------------------------------------
// 戻り先確認（003・004）: 会員と、在庫0・本店公開の商品
// ---------------------------------------------------------------------------
export const 戻り先の商品 = (n: "003" | "004") => `戻り先確認商品-${n}`;
function defineReturnSeed(seedId: string, n: "003" | "004"): void {
  defineSeed(seedId, async (ctx) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const m = await 会員を作る(ctx, { 前半: `f0605_return-${n}`, パスワード: "Passw0rd!F0605R", 名: `戻り先-${n}` });
    const code = `F0605-RETURN-${n}`;
    const [p] = await createProducts(ctx.browser, seedId, [{ name: 戻り先の商品(n), classes: [{ code }] }], issue);
    ctx.notes.set(`〔商品ID-F0605-${n}〕`, p.productId);
    ctx.notes.set(`〔商品規格ID-F0605-${n}〕`, p.classIds[0]);
    const 在庫 = await 在庫を入れて在庫IDを読む(ctx.browser, seedId, [{ 商品コード: rc(code), 商品規格ID: p.classIds[0], 数: 0 }], issue);
    const z = 在庫.get(p.classIds[0]);
    if (!z) throw new Error(`${seedId}: 商品規格ID ${p.classIds[0]} の在庫が在庫検索一覧に無い`);
    if (z.在庫数 !== 0) throw new Error(`${seedId}: 本店の在庫数が ${z.在庫数}（0のはず）`);
    ctx.notes.set(`〔在庫ID-F0605-${n}〕`, z.在庫ID);
    if (available && 有効な依頼件数(m.会員ID) !== 0) throw new Error(`${seedId}: 会員の有効な入荷通知依頼が0件でない`);
    issue(`商品名は「${戻り先の商品(n)}」に実行の印を付けた名前で登録し、商品コード（${rc(code)}）はほかの商品と重ならない値にした。ケースの商品詳細は、控えた商品IDで開く`);
  });
}
defineReturnSeed("S-F06-05-RETURN-003", "003");
defineReturnSeed("S-F06-05-RETURN-004", "004");

// ---------------------------------------------------------------------------
// ポイント表示（044・046〜051）
// ---------------------------------------------------------------------------
defineSeed("S-F06-05-POINT-ONE-044", async (ctx) => {
  const seedId = "S-F06-05-POINT-ONE-044";
  const m = await 会員を作る(ctx, { 前半: "f0605-044-a", パスワード: "Passw0rd-F0605044" });
  const rows = await ポイントを付ける(ctx, m.会員ID, [[100, 日付の文字列(今日から(0))]]);
  const r = 履歴の行(rows, 100);
  ctx.notes.set("〔ポイント履歴ID-F0605-044〕", r.ID);
  ctx.notes.set("〔失効期限-F0605-044〕", r.有効期限);
  reportSeedIssue(seedId, `${期限の読み替え}。失効期限は履歴一覧の有効期限「${r.有効期限}」を控えた`);
});

type 表示の作り方 = { 付与: number[]; 英語?: boolean };
function defineCbptSeed(seedId: string, o: 表示の作り方): void {
  const n = seedId.slice(-3);
  defineSeed(seedId, async (ctx) => {
    const m = await 会員を作る(ctx, { 前半: `cbf0605-${n}`, パスワード: `Passw0rd-CBF0605${n}` });
    if (o.付与.length === 0) { reportSeedIssue(seedId, "登録した直後の会員（保有ポイント0・ポイント履歴0件）のまま使った。ポイントの操作はしていない"); return; }
    const 今日 = 日付の文字列(今日から(0));
    const rows = await ポイントを付ける(ctx, m.会員ID, o.付与.map((量) => [量, 今日] as [number, string]));
    const a = 履歴の行(rows, 60);
    const b = 履歴の行(rows, 40);
    ctx.notes.set(`〔ポイント履歴ID-F0605-${n}-A〕`, a.ID);
    ctx.notes.set(`〔ポイント履歴ID-F0605-${n}-B〕`, b.ID);
    ctx.notes.set(`〔失効期限-F0605-${n}〕`, a.有効期限);
    reportSeedIssue(seedId, `${期限の読み替え}。失効期限は増減量60の行の有効期限「${a.有効期限}」を控えた`);
  });
}
defineCbptSeed("S-F06-05-CBPT-046", { 付与: [60, 40, -50] });
defineCbptSeed("S-F06-05-CBPT-047", { 付与: [] });
defineCbptSeed("S-F06-05-CBPT-048", { 付与: [60, 40] });
defineCbptSeed("S-F06-05-CBPT-049", { 付与: [] });
defineCbptSeed("S-F06-05-CBPT-050", { 付与: [60, 40] });
defineCbptSeed("S-F06-05-CBPT-051", { 付与: [60, 40, -50] });
