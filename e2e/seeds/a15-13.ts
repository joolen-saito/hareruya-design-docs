/**
 * A15-13 デッキ情報検索（デッキビルダーの API の GET /api/decks）のシード。正本: cases/A15-13_seed_data.tsv
 *
 * 型は A15-12 と同じ。会員はフロントの新規会員登録で作り、マスタ（フォーマット・アーキタイプ・デッキタグ・キャンペーンタグ・カード）は
 * 管理画面で「あれば使い、無ければ作る」（決まった名前。依頼者決定 2026-11-14）、デッキは管理画面のデッキ新規登録で作る。
 * 画面で指定できない項目（作成日時・更新日時・限定公開トークン・レギュレーション違反・キャンペーンタグの関連・デッキ利用者ID）だけ、
 * E2E の試験会員（実行の印つき）が所有するデッキ・選手に DB で書く（lib/db_write.ts）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-13_progress_2026-11-24_dev.md にも書く）:
 * - 会員は、実行ごとに新しく登録する（メールアドレスの @ の前に実行の印。前の実行のデッキが user_id の絞り込みに混ざらないように）。
 *   パスワードは会員登録の規則（12文字以上）に合わせた値。
 * - デッキ利用者ID は8文字までの列で、シード表の値（deck-user-alpha・A1513-032-U など）は入らない。実行の印から作った8文字までの値に読み替える。
 *   完全一致を確かめる011の「deck-user-alpha」と「deck-user-alpha-extra」の関係（前者は後者の前方一致）は、「a<印>」と「a<印>x」で保つ。
 * - フォーマット13101〜13103・アーキタイプ13201・13202・デッキタグ13301・13302・キャンペーンタグ13401〜13403・カード13501・13502は、
 *   シード表の名前（無い所は A1513 付きの名前）で作り、画面が振った番号に読み替える。フォーマット 13999 は、登録が0件かを DB で読んで確かめるだけ。
 * - 共有デッキ7件のうち、プレイヤーを指定しない2件（共有B・共有G）は、DB で書き足せるように（持ち主の確かめ）、プレイヤーDの所有にした。
 * - jwt-token は、テスト用認証データ作成機構の代わりに、ログインの API でケースの中から受け取る。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 会員を読む } from "../db/a15_01";
import { デッキタグの番号, ニックネームを設定する, キャンペーンタグを付ける, 作成日時と更新日時を設定する, 限定公開トークンを設定する, 英語名のカード } from "../db/a15_12";
import { デッキ利用者IDを設定する, フォーマットの登録件数, レギュレーション違反にする } from "../db/a15_13";
import { アーキタイプの番号, キャンペーンタグの番号, フォーマットを探す } from "../db/a15_17";
import { RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { デッキタグを登録する, 試験カードをCSVで登録する } from "../pages/admin/a15_12_setup";
import { アーキタイプを新規登録する, キャンペーンタグを登録する, フォーマットを新規登録する } from "../pages/admin/a15_17_setup";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { デッキ編集画面 } from "../pages/admin/m15_05_deck_edit";
import { registerFrontMember } from "../pages/front/member_entry";
import { markedMail } from "./f06-member";

// ---- 名前（シード表のまま。シード表に名前が無いものは A1513 付き） ----
export const 型A = { 名日: "結合試験フォーマットA", 名英: "Integration Format A", コード: "A1513FMT-A", 並び順: "9531" };
export const 型B = { 名日: "結合試験フォーマットB", 名英: "Integration Format B", コード: "A1513FMT-B", 並び順: "9532" };
export const 型C = { 名日: "所有者検索用フォーマット", 名英: "Owner Search Format", コード: "A1513FMT-C", 並び順: "9533" };
export const 種A = { 名日: "結合試験アーキタイプA", 名英: "Integration Archetype A" };
export const 種B = { 名日: "結合試験アーキタイプB", 名英: "Integration Archetype B" };
export const タグA = { 名日: "検索タグA", 名英: "Search Tag A", 並び順: "9531" };
export const タグB = { 名日: "検索タグB", 名英: "Search Tag B", 並び順: "9532" };
export const キャンペーン = [
  { 名日: "開催前タグ", 名英: "A1513 Before", 開始: "2099-01-01T00:00", 終了: "2099-12-31T23:59", 並び順: "9531" },
  { 名日: "開催中タグ", 名英: "A1513 During", 開始: "2000-01-01T00:00", 終了: "2099-12-31T23:59", 並び順: "9532" },
  { 名日: "開催後タグ", 名英: "A1513 After", 開始: "2000-01-01T00:00", 終了: "2000-12-31T23:59", 並び順: "9533" },
];
export const カード = {
  "13501": { 名日: `A1513カード13501-${RUN_MARK}`, 名英: `A1513 Card 13501-${RUN_MARK}`, マナ: "1", カードタイプ: "Creature", 色: "Red", 画像日: "", 画像英: "https://example.invalid/cards/13501.jpg" },
  "13502": { 名日: `A1513カード13502-${RUN_MARK}`, 名英: `A1513 Card 13502-${RUN_MARK}`, マナ: "1", カードタイプ: "Creature", 色: "Blue", 画像日: "", 画像英: "https://example.invalid/cards/13502.jpg" },
};
export function カードの実番号(表: "13501" | "13502"): string {
  const r = 英語名のカード(カード[表].名英);
  if (!r) throw new Error(`カード ${表}（${カード[表].名英}）が登録されていない`);
  return r.番号;
}
export const 型の番号 = (f: { 名日: string }): string => {
  const r = フォーマットを探す(f.名日);
  if (!r) throw new Error(`フォーマット「${f.名日}」が登録されていない`);
  return r.番号;
};
export const 種の番号 = (a: { 名日: string }, f: { 名日: string }): string => {
  const r = アーキタイプの番号(a.名日, 型の番号(f));
  if (!r) throw new Error(`アーキタイプ「${a.名日}」が登録されていない`);
  return r;
};

const iss = (id: string) => (m: string) => reportSeedIssue(id, m);

// ---- マスタ ----
defineSeed("S-A15-13-MASTERS", async ({ browser, seed }) => {
  const n = フォーマットの登録件数("13999");
  if (n !== 0) throw new Error(`${seed.シードID}: フォーマットID 13999 の登録が ${n} 件ある（0件のはず）。共有のマスタなので消さずに止める`);
  const i = iss(seed.シードID);
  await withAdminSession(browser, SETUP_ADMIN, async (page: Page) => {
    for (const f of [型A, 型B, 型C]) if (!フォーマットを探す(f.名日)) await フォーマットを新規登録する(page, { ...f, 統率を使う: false }, i);
    for (const a of [種A, 種B]) if (!アーキタイプの番号(a.名日, 型の番号(型A))) await アーキタイプを新規登録する(page, { ...a, フォーマット番号: 型の番号(型A) }, i);
    for (const t of [タグA, タグB]) if (!デッキタグの番号(t.名日)) await デッキタグを登録する(page, t, i);
    for (const c of キャンペーン) if (!キャンペーンタグの番号(c.名日)) await キャンペーンタグを登録する(page, c, i);
    const 無い = Object.values(カード).filter((c) => !英語名のカード(c.名英));
    if (無い.length) await 試験カードをCSVで登録する(page, 無い, "a1513_cards.csv", `${seed.シードID}: カード登録CSV`, i);
  });
  reportSeedIssue(seed.シードID, "フォーマットID 13999 の登録が0件であることを DB の参照で確かめた。フォーマット・アーキタイプ・デッキタグ・キャンペーンタグ・カードは、シード表の固定の番号（13101 など）のかわりに、決まった名前で作った画面が振った番号を使う（番号は DB を名前で引いて読む）");
});

// ---- 会員 ----
const 印6 = RUN_MARK.slice(-6).toLowerCase();
export type 会員の定め = { キー: string; 前半: string; MTG名: string; パスワード: string; 利用者ID: string; ニックネーム?: string };
export type 作った会員 = { 顧客ID: string; 選手ID: string; メール: string; パスワード: string; 利用者ID: string; MTG名: string };
const 会員の控え = new Map<string, 作った会員>();
export const 会員の控えを読む = (キー: string): 作った会員 => {
  const m = 会員の控え.get(キー);
  if (!m) throw new Error(`会員 ${キー} はまだ作っていない`);
  return m;
};

async function 会員を作る(browser: Browser, seedId: string, d: 会員の定め): Promise<作った会員> {
  const メール = markedMail(d.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: "結合A1513", 名: d.MTG名, セイ: "ケツゴウ", メイ: "エー", メール, パスワード: d.パスワード, MTG姓: "Ketsugo", MTG名: d.MTG名 });
  } finally { await context.close(); }
  let m = 会員を読む(メール);
  for (let i = 0; (!m || !m.選手ID) && i < 8; i++) { await new Promise((r) => setTimeout(r, 5_000)); m = 会員を読む(メール); }
  if (!m || !m.選手ID) throw new Error(`${seedId}: 会員 ${メール} の選手が DB に無い`);
  デッキ利用者IDを設定する(seedId, m.選手ID, メール, d.利用者ID);
  if (d.ニックネーム) ニックネームを設定する(seedId, m.選手ID, メール, d.ニックネーム);
  const r = { 顧客ID: m.会員ID, 選手ID: m.選手ID, メール, パスワード: d.パスワード, 利用者ID: d.利用者ID, MTG名: d.MTG名 };
  会員の控え.set(d.キー, r);
  return r;
}

const 共有会員: (会員の定め & { 呼び名: string })[] = [
  { 呼び名: "共有A", キー: "A", 前半: "a1513-player-a", MTG名: `A1513PLA${RUN_MARK}`, パスワード: "PlayerA1513!E2E", 利用者ID: `a${印6}`, ニックネーム: "プレイヤーA" },
  { 呼び名: "共有B", キー: "B", 前半: "a1513-player-b", MTG名: `A1513PLB${RUN_MARK}`, パスワード: "PlayerB1513!E2E", 利用者ID: `b${印6}`, ニックネーム: "プレイヤーB" },
  { 呼び名: "共有C", キー: "C", 前半: "a1513-player-c", MTG名: `A1513PLC${RUN_MARK}`, パスワード: "PlayerC1513!E2E", 利用者ID: `c${印6}` },
  { 呼び名: "共有D", キー: "D", 前半: "a1513-player-d", MTG名: `A1513PLD${RUN_MARK}`, パスワード: "PlayerD1513!E2E", 利用者ID: `d${印6}` },
  { 呼び名: "共有E", キー: "E", 前半: "a1513-player-e", MTG名: `A1513PLE${RUN_MARK}`, パスワード: "PlayerE1513!E2E", 利用者ID: `a${印6}x` },
  { 呼び名: "共有F", キー: "F", 前半: "a1513-player-f", MTG名: `A1513PLF${RUN_MARK}`, パスワード: "PlayerF1513!E2E", 利用者ID: `f${印6}` },
];
export const 共有会員の定め = 共有会員;

defineSeed("S-A15-13-PLAYERS", async ({ browser, notes, seed }) => {
  for (const d of 共有会員) {
    const m = await 会員を作る(browser, seed.シードID, d);
    if (d.キー === "A" || d.キー === "B") notes.set(`〔顧客ID-A1513-${d.呼び名}〕`, m.顧客ID);
    notes.set(`〔プレイヤーID-A1513-${d.呼び名}〕`, m.選手ID);
  }
  reportSeedIssue(seed.シードID, "会員6人は、実行ごとに新しく登録した（メールアドレスの @ の前に実行の印）。デッキ利用者ID は8文字までの列でシード表の値が入らないので、実行の印から作った8文字までの値（プレイヤーEはプレイヤーAの値に x を足した値）に読み替えた。ニックネーム（プレイヤーA・B）は DB に書いた。jwt-token はケースの中でログインの API から受け取る");
});

// ---- デッキ ----
type 公開名 = "公開" | "非公開" | "限定公開";
export type デッキの定め = {
  キー: string; 名?: string; 種別: "user" | "event"; 公開: 公開名; 所有者: string;
  型: typeof 型A; 種: typeof 種A; 種の型?: typeof 型A;
  タグ?: string[]; 代表カード?: "13501" | "13502"; メイン?: string; サイド?: string; リスト非公開?: boolean;
  大会?: { 名日: string; 名英: string; 開催日: string }; 順位?: string; 成績?: string; 参加人数?: string; プレイヤー名?: string;
  作成?: string; 更新?: string; 違反?: boolean; トークン?: string; キャンペーン?: boolean;
};
const 日時 = (s: string) => `${s}+09`;
const 任意の大会 = { 名日: "A1513大会", 名英: "A1513 Open", 開催日: "2026-05-05T00:00" };

async function 登録する(page: Page, d: デッキの定め, i: (m: string) => void): Promise<string> {
  const 所有 = 会員の控えを読む(d.所有者);
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  if (d.名 !== undefined) await e.デッキ名.fill(d.名);
  await chooseByLabel(e.デッキ種別, d.種別);
  await e.フォーマットを選ぶ(d.種の型 ? d.種の型.名日 : d.型.名日);
  await e.アーキタイプを選ぶ(d.種.名日);
  if (d.種の型) {
    // アーキタイプは選んだフォーマットのものしか出ないので、先にそのフォーマットで選び、変更の通知を出さずにフォーマットの値だけ戻す
    await e.フォーマット.evaluate((el, label) => {
      const sel = el as HTMLSelectElement;
      const o = Array.from(sel.options).find((x) => (x.textContent ?? "").trim() === label);
      if (!o) throw new Error(`フォーマットの選択肢「${label}」が無い`);
      sel.value = o.value;
    }, d.型.名日);
  }
  if (d.タグ?.length) await chooseByLabel(e.タグ, d.タグ);
  await chooseByLabel(e.公開状態, d.公開);
  if (d.リスト非公開) await e.デッキリスト非公開.setChecked(true);
  if (d.代表カード) await e.代表カードを選ぶ(カード[d.代表カード].名日, { 完全一致: true });
  await e.プレイヤーを選ぶ(所有.MTG名);
  if (d.種別 === "event") {
    const 大会 = d.大会 ?? 任意の大会;
    await e.イベント名日.fill(大会.名日);
    await e.イベント名英.fill(大会.名英);
    await e.開催日.fill(大会.開催日);
  }
  await e.プレイヤー名.fill(d.プレイヤー名 ?? "");
  if (d.順位 !== undefined) await e.順位.fill(d.順位);
  if (d.成績 !== undefined) await e.成績.fill(d.成績);
  if (d.参加人数 !== undefined) await e.参加人数.fill(d.参加人数);
  if (d.メイン !== undefined) await e.メイン.fill(d.メイン);
  if (d.サイド !== undefined) await e.サイド.fill(d.サイド);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `デッキ「${d.名 ?? d.キー}」の登録`)) i(`デッキ「${d.名 ?? d.キー}」の登録時の警告「${w}」`);
  return e.デッキID();
}

/** デッキを順に登録し、番号を控え、画面で指定できない項目を DB に書く。呼び名の頭（〔デッキID-A1513-<頭><キー>〕）は prefix で付ける */
async function デッキを作る({ browser, notes, seed }: SeedCtx, ds: デッキの定め[], prefix: string): Promise<Record<string, string>> {
  const i = iss(seed.シードID);
  const ids: Record<string, string> = {};
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const d of ds) {
      ids[d.キー] = await 登録する(page, d, i);
      notes.set(`〔デッキID-A1513-${prefix}${d.キー}〕`, ids[d.キー]);
    }
  });
  for (const d of ds) {
    const id = ids[d.キー], mail = 会員の控えを読む(d.所有者).メール;
    if (d.作成) 作成日時と更新日時を設定する(seed.シードID, id, mail, 日時(d.作成), 日時(d.更新 ?? d.作成));
    if (d.違反) レギュレーション違反にする(seed.シードID, id, mail);
    if (d.トークン) 限定公開トークンを設定する(seed.シードID, id, mail, d.トークン.replace("{id}", id));
    if (d.キャンペーン) キャンペーンタグを付ける(seed.シードID, id, mail, キャンペーン.map((c) => キャンペーンタグの番号(c.名日)!));
  }
  return ids;
}

const 共有デッキ: デッキの定め[] = [
  { キー: "A", 名: "東京優勝デッキ", 種別: "event", 公開: "公開", 所有者: "C", 型: 型A, 種: 種A, タグ: [タグA.名日, タグB.名日], 代表カード: "13501",
    大会: { 名日: "結合試験大会東京", 名英: "Integration Open Tokyo", 開催日: "2026-06-15T00:00" }, 順位: "1", 成績: "優勝", 参加人数: "64", プレイヤー名: "山田太郎",
    メイン: `1 ${カード["13501"].名英}`, サイド: `1 ${カード["13502"].名英}`, 作成: "2026-06-01 10:00:00", 更新: "2026-06-10 10:00:00", キャンペーン: true },
  { キー: "B", 種別: "event", 公開: "公開", 所有者: "D", 型: 型A, 種: 種B, 大会: { 名日: "結合試験大会大阪", 名英: "Integration Open Osaka", 開催日: "2026-05-05T00:00" }, 順位: "8", 参加人数: "32",
    作成: "2026-06-02 10:00:00", 更新: "2026-06-11 10:00:00", 違反: true },
  { キー: "C", 名: "プレイヤーA公開デッキ", 種別: "user", 公開: "公開", 所有者: "A", 型: 型B, 種: 種A, 種の型: 型A, タグ: [タグA.名日],
    作成: "2026-06-03 10:00:00", 更新: "2026-06-12 10:00:00", トークン: "display-{id}" },
  { キー: "D", 種別: "user", 公開: "非公開", 所有者: "A", 型: 型C, 種: 種A, 種の型: 型A, リスト非公開: true,
    作成: "2026-06-04 10:00:00", 更新: "2026-06-13 10:00:00", トークン: "display-{id}" },
  { キー: "E", 種別: "user", 公開: "非公開", 所有者: "B", 型: 型A, 種: 種A, リスト非公開: true, 作成: "2026-06-05 10:00:00", トークン: "display-{id}" },
  { キー: "F", 種別: "event", 公開: "公開", 所有者: "E", 型: 型A, 種: 種A, タグ: [タグB.名日], 順位: "9", 参加人数: "63", メイン: `1 ${カード["13501"].名英}`, 作成: "2026-06-06 10:00:00" },
  { キー: "G", 種別: "event", 公開: "公開", 所有者: "D", 型: 型A, 種: 種B, 順位: "2", 参加人数: "65", 作成: "2026-06-07 10:00:00" },
];

defineSeed("S-A15-13-DECKS", { needs: ["S-A15-13-PLAYERS", "S-A15-13-MASTERS"] }, async (ctx) => {
  await デッキを作る(ctx, 共有デッキ, "共有");
  reportSeedIssue(ctx.seed.シードID, "共有デッキ7件は、シード表の順に登録した（後に登録したほどデッキIDが大きい）。プレイヤーを指定しない共有B・共有G はプレイヤーD の所有にした。限定公開トークンは display-<控えたデッキID>");
});

// ---- ケース専用（会員を1人作り、その会員のデッキを登録する） ----
type 個別 = { 会員: 会員の定め; 顧客IDを控える?: boolean; 呼び名: string; デッキ: デッキの定め[]; 注?: string };
const 個別シード: Record<string, 個別> = {};
const 個別の会員 = (番号: string, 利用者: string): 会員の定め => ({ キー: 番号, 前半: `a1513-${番号.toLowerCase()}`, MTG名: `A1513S${番号.replace(/[^0-9A-Z]/gi, "")}${RUN_MARK}`, パスワード: `Pw1513!${番号.replace(/[^0-9A-Z]/gi, "")}E2E`, 利用者ID: 利用者 });
const 公ユーザー = (キー: string, 名: string, 公開: 公開名 = "公開", 追加: Partial<デッキの定め> = {}): デッキの定め =>
  ({ キー, 名, 種別: "user", 公開, 所有者: "", 型: 型A, 種: 種A, ...追加 });
const 大会デッキ = (キー: string, 順位: string, 作成: string, 追加: Partial<デッキの定め> = {}): デッキの定め =>
  ({ キー, 種別: "event", 公開: "公開", 所有者: "", 型: 型A, 種: 種A, 順位, 作成, ...追加 });
const 登録順: [string, 個別][] = [
  ["S-A15-13-REGVIOL-032", { 会員: 個別の会員("032", `u${印6}32`), 呼び名: "032", デッキ: [
    大会デッキ("A", "1", "2026-07-01 10:00:00", { 名: "A1513-032-OK" }), 大会デッキ("B", "1", "2026-07-02 10:00:00", { 名: "A1513-032-NG", 違反: true })] }],
  ["S-A15-13-FLAGOFF-033", { 会員: 個別の会員("033", `u${印6}33`), 呼び名: "033", デッキ: [
    大会デッキ("A", "1", "2026-07-01 10:00:00"), 大会デッキ("B", "5", "2026-07-02 10:00:00"), 大会デッキ("C", "9", "2026-07-03 10:00:00")] }],
  ["S-A15-13-EVTOFF-034", { 会員: 個別の会員("034", `u${印6}34`), 呼び名: "034", デッキ: [
    大会デッキ("A", "1", "2026-07-01 10:00:00", { プレイヤー名: "A1513-034-Taro" }), { ...公ユーザー("B", "A1513-034-USER"), 作成: "2026-07-02 10:00:00" }] }],
  ["S-A15-13-TOP8EDGE-037", { 会員: 個別の会員("037", `u${印6}37`), 呼び名: "037", デッキ: [
    大会デッキ("A", "8", "2026-07-01 10:00:00"), 大会デッキ("B", "9", "2026-07-02 10:00:00")] }],
  ["S-A15-13-CBPUBOTH-038", { 会員: 個別の会員("CB038", `u${印6}38`), 呼び名: "CB038", デッキ: [公ユーザー("", "A1513-CB038-PUB")] }],
  ["S-A15-13-CBINVOWN-039", { 会員: 個別の会員("CB039", `u${印6}39`), 呼び名: "CB039", 顧客IDを控える: true, デッキ: [公ユーザー("", "A1513-CB039-PUB")] }],
  ["S-A15-13-CBHIDDEN-040", { 会員: 個別の会員("CB040", `u${印6}40`), 呼び名: "CB040", デッキ: [
    公ユーザー("A", "A1513-CB040-PUB"), 公ユーザー("B", "A1513-CB040-PRIV", "非公開"), 公ユーザー("C", "A1513-CB040-UNL", "限定公開")] }],
  ["S-A15-13-CBPRIVPUB-041", { 会員: 個別の会員("CB041", `u${印6}41`), 呼び名: "CB041", 顧客IDを控える: true, デッキ: [公ユーザー("", "A1513-CB041-PUB")] }],
  ["S-A15-13-CBPRIVHID-042", { 会員: 個別の会員("CB042", `u${印6}42`), 呼び名: "CB042", 顧客IDを控える: true, デッキ: [
    公ユーザー("A", "A1513-CB042-PRIV", "非公開"), 公ユーザー("B", "A1513-CB042-UNL", "限定公開", { トークン: "A1513-CB042-VIEW" })] }],
  ["S-A15-13-CBPRIVOTH-043", { 会員: 個別の会員("CB043", `u${印6}43`), 呼び名: "CB043", デッキ: [公ユーザー("", "A1513-CB043-PUB")] }],
  ["S-A15-13-CBINVOTH-044", { 会員: 個別の会員("CB044", `u${印6}44`), 呼び名: "CB044", デッキ: [公ユーザー("", "A1513-CB044-PUB")] }],
];
for (const [id, s] of 登録順) {
  defineSeed(id, { needs: ["S-A15-13-MASTERS"] }, async (ctx) => {
    const m = await 会員を作る(ctx.browser, id, s.会員);
    ctx.notes.set(`〔プレイヤーID-A1513-${s.呼び名}〕`, m.選手ID);
    if (s.顧客IDを控える) ctx.notes.set(`〔顧客ID-A1513-${s.呼び名}〕`, m.顧客ID);
    const ds = s.デッキ.map((d) => ({ ...d, 所有者: s.会員.キー }));
    await デッキを作る(ctx, ds, s.呼び名);
    reportSeedIssue(id, `会員は実行ごとに新しく登録した。デッキ利用者ID（${m.利用者ID}）はシード表の値のかわりの8文字までの値。ケース終了後の削除は行わない（実行ごとに新しい会員なので、次の実行の結果に混ざらない）`);
  });
}
