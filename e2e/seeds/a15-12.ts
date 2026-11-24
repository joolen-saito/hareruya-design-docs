/**
 * A15-12 デッキ情報参照（デッキビルダーの API の GET /api/deck/{デッキID}）のシード。正本: cases/A15-12_seed_data.tsv
 *
 * 型: 会員はフロントの新規会員登録で作り（MTG Companion登録名を入れて選手を作る）、フォーマット・アーキタイプ・デッキタグ・キャンペーンタグ・
 * カードは管理画面で「あれば使い、無ければ作る」（全員が使うマスタ。依頼者決定 2026-11-14「マスタは作ってよい」。名前は A1512 付きの決まった名前で1度だけ作る）。
 * デッキは管理画面のデッキ新規登録で作る。画面で指定できない項目だけ、E2E の会員が所有するデッキに DB で書く（db/a15_12.ts・lib/db_write.ts）。
 * 下書きは、デッキ更新の API（即時保存の指定を偽）で作る。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-12_progress_2026-11-24_dev.md にも書く）:
 * - ENV（試験用署名鍵・一時保存先）は、共有の開発環境では設定済みの値をそのまま使う（何もしない）。署名鍵はケースで使わない（署名不正のトークンは署名の部分を置き換えて作る）。
 * * - 試験会員は、メールアドレスを「a1512-owner-E2E@example.test」「a1512-other-E2E@example.test」の決まった名前にして1度だけ登録し、使い回す
 *   （シード表の a1512-owner@example.test の @ の前に「-E2E」を付けた）。パスワードは会員登録の規則（12文字以上）に合わせ、シード表の値の末尾に「E2E」を付けた値（OwnerA1512!E2E・OtherB1512!E2E）にした。
 * - デッキ利用者ID は8文字までの列で、シード表の「a1512-user-a」（12文字）は入らないので、画面の登録で振られた値をそのまま使う。ニックネームだけ DB に書く。
 * - カードの番号 1512921〜1512924・15120391・15120401 とタグの番号 1512931・1512932・1512941〜1512943 は画面が振る番号に読み替える（作ったあとに DB を名前で引いて読む）。
 * - デッキID 91512015・91512016 は、あれば止める（ほかの方のデータは消さない）。
 */
import { Browser, BrowserContext, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import {
  アーキタイプを空にする, カードのステッカー可否を設定する, カードタイプの番号, キャンペーンタグを付ける, デッキタグの番号, デッキの数, ニックネームを設定する,
  限定公開トークンを設定する, 作成日時と更新日時を設定する, 英語名のカード, 選手の公開情報,
} from "../db/a15_12";
import { 会員を読む } from "../db/a15_01";
import { アーキタイプの番号, キャンペーンタグの番号, フォーマットを探す } from "../db/a15_17";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { 下書きを保存する, 下書き } from "../pages/api/a15_12_deck_info";
import { ログインする } from "../pages/api/a15_17_deck_import";
import { アーキタイプを新規登録する, キャンペーンタグを登録する, フォーマットを新規登録する } from "../pages/admin/a15_17_setup";
import { カードタイプを登録する, デッキタグを登録する, 試験カード, 試験カードをCSVで登録する } from "../pages/admin/a15_12_setup";
import { デッキ編集画面, デッキ内容 } from "../pages/admin/m15_05_deck_edit";
import { expectSaved } from "../pages/admin/common";
import { registerFrontMember } from "../pages/front/member_entry";

// ---- 名前と値（シード表のまま） ----
export const 所有者 = { メール: "a1512-owner-E2E@example.test", パスワード: "OwnerA1512!E2E", ニックネーム: "A1512所有者", MTG名: "A1512OwnerE2E", 呼び名: "共有A" };
export const 他者 = { メール: "a1512-other-E2E@example.test", パスワード: "OtherB1512!E2E", ニックネーム: "A1512他者", MTG名: "A1512OtherE2E", 呼び名: "共有B" };

export const フォーマットα = { 名日: "A1512フォーマットα", 名英: "A1512 Format Alpha", コード: "A1512FMT-A", 並び順: "9512" };
export const フォーマットβ = { 名日: "A1512フォーマットβ", 名英: "A1512 Format Beta", コード: "A1512FMT-B", 並び順: "9513" };
export const アーキタイプα = { 名日: "A1512アーキタイプα", 名英: "A1512 Archetype Alpha" };
export const アーキタイプβ = { 名日: "A1512アーキタイプβ", 名英: "A1512 Archetype Beta" };
export const デッキタグ甲 = { 名日: "A1512タグ甲", 名英: "A1512 Tag Alpha", 並び順: "9512" };
export const デッキタグ乙 = { 名日: "A1512タグ乙", 名英: "A1512 Tag Beta", 並び順: "9513" };
export const キャンペーン = [
  { 名日: "A1512開催前", 名英: "A1512 Before", 開始: "2099-01-01T00:00", 終了: "2099-12-31T23:59", 並び順: "9512" },
  { 名日: "A1512開催中", 名英: "A1512 During", 開始: "2000-01-01T00:00", 終了: "2099-12-31T23:59", 並び順: "9513" },
  { 名日: "A1512開催後", 名英: "A1512 After", 開始: "2000-01-01T00:00", 終了: "2000-12-31T23:59", 並び順: "9514" },
];
const 呪文 = { 名日: "呪文", 名英: "A1512 Spell" };

/** シード表のカード（番号は画面が振る） */
export const カード定義: Record<string, 試験カード & { 表: string; ステッカー: boolean }> = {
  "1512921": { 表: "1512921", 名日: "A1512カード壱", 名英: "A1512 Card One", マナ: "3", カードタイプ: "Creature", 色: "Red", 画像日: "img/goods/a1512-card1-ja.jpg", 画像英: "img/goods/a1512-card1-en.jpg", ステッカー: true },
  "1512922": { 表: "1512922", 名日: "A1512カード弐", 名英: "A1512 Card Two", マナ: "5", カードタイプ: 呪文.名英, 色: "Blue", サブタイプ: "Attraction", 画像日: "img/goods/a1512-card2-ja.jpg", 画像英: "img/goods/a1512-card2-en.jpg", ステッカー: false },
  "1512923": { 表: "1512923", 名日: "A1512カード参", 名英: "A1512 Card Three", マナ: "1", カードタイプ: "Creature", 色: "Green", 画像日: "", 画像英: "img/goods/a1512-card3-latest.jpg", ステッカー: false },
  "1512924": { 表: "1512924", 名日: "A1512カード肆", 名英: "A1512 Card Four", マナ: "2", カードタイプ: 呪文.名英, 色: "White", 画像日: "", 画像英: "img/goods/a1512-card4-latest.jpg", ステッカー: false },
  "15120391": { 表: "15120391", 名日: "A1512-039-カード", 名英: "A1512-039-Card", マナ: "3", カードタイプ: "Creature", 色: "Red", 画像日: "img/goods/a1512-039-ja.jpg", 画像英: "img/goods/a1512-039-en.jpg", ステッカー: false },
  "15120401": { 表: "15120401", 名日: "A1512-040-カード", 名英: "A1512-040-Card", マナ: "3", カードタイプ: "Creature", 色: "Red", 画像日: "img/goods/a1512-040-ja.jpg", 画像英: "img/goods/a1512-040-en.jpg", ステッカー: false },
};

/** シード表のカード番号に対する、画面が振った番号 */
export function カードの実番号(表: string): string {
  const c = カード定義[表];
  const r = c && 英語名のカード(c.名英);
  if (!r) throw new Error(`シード表のカード ${表}（${c?.名英}）が登録されていない`);
  return r.番号;
}

const issue = (シードID: string) => (m: string) => reportSeedIssue(シードID, m);

// ---- 環境 ----
defineSeed("S-A15-12-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の署名鍵・署名方式・一時保存先を書き換えず、設定済みの値をそのまま使った（署名鍵はケースで使わない。署名不正のトークンは署名の部分を置き換えて作る）");
});

// ---- 会員・選手 ----
async function 会員を用意する(ctx: SeedCtx, m: typeof 所有者): Promise<void> {
  const { browser, notes, seed } = ctx;
  let 会員 = 会員を読む(m.メール);
  if (!会員) {
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      await registerFrontMember(page, { 姓: "試験", 名: m.MTG名, セイ: "シケン", メイ: "エー", メール: m.メール, パスワード: m.パスワード, MTG姓: "Shiken", MTG名: m.MTG名 });
    } finally { await context.close(); }
    for (let i = 0; (!会員 || !会員.選手ID) && i < 8; i++) { await new Promise((r) => setTimeout(r, 5_000)); 会員 = 会員を読む(m.メール); }
    reportSeedIssue(seed.シードID, `試験会員 ${m.メール} を新しく登録した（フロントの新規会員登録・MTG Companion登録名あり）`);
  } else {
    reportSeedIssue(seed.シードID, `試験会員 ${m.メール} は登録済みなので使い回した（決まった名前で1度だけ作る）`);
  }
  if (!会員 || !会員.選手ID) throw new Error(`${seed.シードID}: 会員 ${m.メール} の選手が DB に無い`);
  const 公開 = 選手の公開情報(会員.選手ID);
  if (公開?.ニックネーム !== m.ニックネーム) ニックネームを設定する(seed.シードID, 会員.選手ID, m.メール, m.ニックネーム);
  notes.set(`〔会員ID-A1512-${m.呼び名}〕`, 会員.会員ID);
  notes.set(`〔プレイヤーID-A1512-${m.呼び名}〕`, 会員.選手ID);
}

defineSeed("S-A15-12-PLAYERS", async (ctx) => {
  await 会員を用意する(ctx, 所有者);
  await 会員を用意する(ctx, 他者);
  reportSeedIssue(ctx.seed.シードID, "シード表のメールアドレス a1512-owner@example.test・a1512-other@example.test は、@ の前に「-E2E」を付けた値で登録・使い回した。デッキ利用者ID は8文字までの列でシード表の値（12文字）が入らないので、画面の登録で振られた値を使った。ニックネームはシード表のとおり DB に書いた");
});

// ---- マスタ ----
defineSeed("S-A15-12-MASTERS", async (ctx) => {
  const { browser, notes, seed } = ctx;
  const iss = issue(seed.シードID);
  await withAdminSession(browser, SETUP_ADMIN, async (page: Page) => {
    for (const [表, f] of [["共有A", フォーマットα], ["共有B", フォーマットβ]] as const) {
      if (!フォーマットを探す(f.名日)) await フォーマットを新規登録する(page, { ...f, 統率を使う: false }, iss);
      else iss(`フォーマット「${f.名日}」は登録済みなので使い回した`);
      void 表;
    }
    const 型α = フォーマットを探す(フォーマットα.名日)!.番号, 型β = フォーマットを探す(フォーマットβ.名日)!.番号;
    if (!アーキタイプの番号(アーキタイプα.名日, 型α)) await アーキタイプを新規登録する(page, { ...アーキタイプα, フォーマット番号: 型α }, iss);
    if (!アーキタイプの番号(アーキタイプβ.名日, 型β)) await アーキタイプを新規登録する(page, { ...アーキタイプβ, フォーマット番号: 型β }, iss);
    for (const t of [デッキタグ甲, デッキタグ乙]) if (!デッキタグの番号(t.名日)) await デッキタグを登録する(page, t, iss);
    for (const c of キャンペーン) if (!キャンペーンタグの番号(c.名日)) await キャンペーンタグを登録する(page, c, iss);
    if (!カードタイプの番号(呪文.名日)) await カードタイプを登録する(page, 呪文, iss);
    const 無い = Object.values(カード定義).filter((c) => !英語名のカード(c.名英));
    if (無い.length) await 試験カードをCSVで登録する(page, 無い, "a1512_cards.csv", `${seed.シードID}: カード登録CSV`, iss);
  });
  for (const c of Object.values(カード定義)) {
    const r = 英語名のカード(c.名英);
    if (!r) throw new Error(`${seed.シードID}: カード「${c.名英}」をカード登録CSVで登録したが、見つからない`);
    if (r.ステッカー !== c.ステッカー) カードのステッカー可否を設定する(seed.シードID, r.番号, c.ステッカー);
  }
  notes.set("〔フォーマットID-A1512-共有A〕", フォーマットを探す(フォーマットα.名日)!.番号);
  notes.set("〔フォーマットID-A1512-共有B〕", フォーマットを探す(フォーマットβ.名日)!.番号);
  notes.set("〔アーキタイプID-A1512-共有A〕", アーキタイプの番号(アーキタイプα.名日, notes.get("〔フォーマットID-A1512-共有A〕"))!);
  notes.set("〔アーキタイプID-A1512-共有B〕", アーキタイプの番号(アーキタイプβ.名日, notes.get("〔フォーマットID-A1512-共有B〕"))!);
  iss("カード 1512921〜1512924・15120391・15120401、デッキタグ 1512931・1512932、キャンペーンタグ 1512941〜1512943 は、シード表の番号のかわりに画面が振った番号で作った（番号は DB を名前で引いて読む）。カードの画像・タイプ・色・マナは、カード登録CSVで登録した");
});

// ---- デッキ ----
type 公開名 = "公開" | "非公開" | "限定公開";
type デッキ定義 = {
  /** 控える呼び名の末尾（〔デッキID-A1512-<末尾>〕） */
  末尾: string;
  名?: string; 種別?: "user" | "event"; 公開: 公開名;
  代表カード?: string; メイン?: string; サイド?: string; リスト非公開?: boolean; プレイヤー名を空にする?: boolean;
  タグ?: string[]; イベント?: { 名日: string; 名英: string; 開催日: string; 順位: string; 成績: string; URL: string; 選手名: string };
  トークン?: string; 作成?: string; 更新?: string; キャンペーン?: boolean; アーキタイプ空?: boolean;
  下書き?: { 名: string; 公開範囲: number; フォーマット: "共有A" | "共有B"; アーキタイプ?: "共有A" | "共有B"; 代表カード?: string };
};

const 公開範囲の番号: Record<公開名, number> = { 公開: 1, 非公開: 2, 限定公開: 3 };

async function ログインして下書きを作る(browser: Browser, メール: string, パスワード: string, デッキID: string, d: 下書き): Promise<void> {
  const context: BrowserContext = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    const { token, 応答 } = await ログインする(page, メール, パスワード);
    if (!token) throw new Error(`下書きを作るためのログインの API がアクセストークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
    const r = await 下書きを保存する(context.request, token, デッキID, d);
    if (r.ステータス !== 200) throw new Error(`デッキ更新の API（即時保存の指定は偽）が HTTP ${r.ステータス}: ${r.本文.slice(0, 300)}`);
  } finally { await context.close(); }
}

/** デッキを管理画面で登録し、デッキ編集画面のアドレスの番号を返す */
async function 管理画面でデッキを登録する(page: Page, d: デッキ定義, 検索語: string, iss: (m: string) => void): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  const v: デッキ内容 = {
    デッキ名: d.名, デッキ種別: d.種別 ?? "user", フォーマット: フォーマットα.名日, アーキタイプ: アーキタイプα.名日, 公開状態: d.公開,
    プレイヤー検索: 検索語, ...(d.リスト非公開 ? { デッキリスト非公開: true } : {}), ...(d.タグ ? { タグ: d.タグ } : {}),
    ...(d.メイン !== undefined ? { メイン: d.メイン } : {}), ...(d.サイド !== undefined ? { サイド: d.サイド } : {}),
    ...(d.代表カード ? { 代表カード: d.代表カード } : {}),
    ...(d.イベント ? { イベント名日: d.イベント.名日, イベント名英: d.イベント.名英, 開催日: d.イベント.開催日, 順位: d.イベント.順位, 成績: d.イベント.成績, 引用元URL: d.イベント.URL } : {}),
  };
  await e.入力する(v, iss);
  if (d.イベント) await e.プレイヤー名.fill(d.イベント.選手名); // プレイヤーを選ぶと入る英語表記を、シード表のプレイヤー名に直す
  if (d.プレイヤー名を空にする) await e.プレイヤー名.fill(""); // シード表「プレイヤーを選んだときプレイヤー名に値が入ったら消す」
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `デッキ「${d.名 ?? "（名前なし）"}」の登録`)) iss(`デッキ「${d.名 ?? ""}」の登録時の警告「${w}」`);
  return e.デッキID();
}

async function デッキを作る(ctx: SeedCtx, ds: デッキ定義[]): Promise<void> {
  const { browser, notes, seed } = ctx;
  const iss = issue(seed.シードID);
  const 検索語 = 所有者.MTG名;
  const ids: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const d of ds) {
      const id = await 管理画面でデッキを登録する(page, { ...d, 代表カード: d.代表カード }, 検索語, iss);
      notes.set(`〔デッキID-A1512-${d.末尾}〕`, id);
      ids.push(id);
    }
  });
  for (const [i, d] of ds.entries()) {
    const id = ids[i];
    if (d.トークン) 限定公開トークンを設定する(seed.シードID, id, 所有者.メール, d.トークン);
    if (d.作成 || d.更新) 作成日時と更新日時を設定する(seed.シードID, id, 所有者.メール, d.作成 ?? null, d.更新 ?? d.作成!);
    if (d.アーキタイプ空) アーキタイプを空にする(seed.シードID, id, 所有者.メール);
    if (d.キャンペーン) キャンペーンタグを付ける(seed.シードID, id, 所有者.メール, キャンペーン.map((c) => キャンペーンタグの番号(c.名日)!));
  }
  // 下書きは一時保存が30分で消えるので、いちばん最後（ケースの直前）に作る
  for (const [i, d] of ds.entries()) {
    if (!d.下書き) continue;
    const 型 = notes.get(`〔フォーマットID-A1512-${d.下書き.フォーマット}〕`);
    const 種 = d.下書き.アーキタイプ ? notes.get(`〔アーキタイプID-A1512-${d.下書き.アーキタイプ}〕`) : undefined;
    await ログインして下書きを作る(browser, 所有者.メール, 所有者.パスワード, ids[i], {
      デッキ名: d.下書き.名, 公開範囲: d.下書き.公開範囲, フォーマット: 型, ...(種 ? { アーキタイプ: 種 } : {}),
      ...(d.下書き.代表カード ? { 代表カード: カードの実番号(d.下書き.代表カード) } : {}),
    });
  }
}

const 日時 = (s: string) => `${s}+09`;
const 大会 = (n: string) => ({ 名日: `A1512-${n}-大会`, 名英: `A1512-${n}-Open`, 開催日: "2026-05-05T00:00", 順位: "1", 成績: `A1512-${n}-優勝`, URL: `https://replace-dev.hareruyamtg.com:8443/source/a1512-${n}`, 選手名: `A1512-${n}-選手` });

const 単純: Record<string, デッキ定義> = {
  "S-A15-12-SAVED-001": { 末尾: "001", 名: "A1512-001-SAVED", 公開: "公開" },
  "S-A15-12-PUBLIC-004": { 末尾: "004", 名: "A1512-004-PUBLIC", 公開: "公開" },
  "S-A15-12-PUBLICBAD-005": { 末尾: "005", 名: "A1512-005-PUBLICBAD", 公開: "公開" },
  "S-A15-12-PRIVOWN-006": { 末尾: "006", 名: "A1512-006-PRIVOWN", 公開: "非公開" },
  "S-A15-12-PRIVOTH-007": { 末尾: "007", 名: "A1512-007-PRIVOTH", 公開: "非公開" },
  "S-A15-12-PRIVNOTOK-008": { 末尾: "008", 名: "A1512-008-PRIVNOTOK", 公開: "非公開" },
  "S-A15-12-PRIVBAD-009": { 末尾: "009", 名: "A1512-009-PRIVBAD", 公開: "非公開" },
  "S-A15-12-UNLMATCH-010": { 末尾: "010", 名: "A1512-010-UNLMATCH", 公開: "限定公開", トークン: "A1512-010-VIEW" },
  "S-A15-12-UNLOWN-011": { 末尾: "011", 名: "A1512-011-UNLOWN", 公開: "限定公開", トークン: "A1512-011-VIEW" },
  "S-A15-12-UNLNONE-013": { 末尾: "013", 名: "A1512-013-UNLNONE", 公開: "限定公開", トークン: "A1512-013-VIEW" },
  "S-A15-12-UNLOTH-014": { 末尾: "014", 名: "A1512-014-UNLOTH", 公開: "限定公開", トークン: "A1512-014-VIEW" },
  "S-A15-12-DRAFT-002": { 末尾: "002", 名: "A1512-002-SAVED", 公開: "公開", 下書き: { 名: "A1512-002-DRAFT", 公開範囲: 1, フォーマット: "共有A" } },
  "S-A15-12-DRAFTFILL-003": {
    末尾: "003", 公開: "公開", アーキタイプ空: true,
    下書き: { 名: "A1512-003-DRAFT", 公開範囲: 1, フォーマット: "共有B", アーキタイプ: "共有B", 代表カード: "1512923" },
  },
  "S-A15-12-HIDE-016": { 末尾: "016", 名: "A1512-016-HIDE", 公開: "非公開" },
  "S-A15-12-DRAFTPRIVOTH-017": { 末尾: "017", 名: "A1512-017-SAVED", 公開: "公開", 下書き: { 名: "A1512-017-DRAFT", 公開範囲: 2, フォーマット: "共有A" } },
  "S-A15-12-DRAFTPRIVOWN-018": { 末尾: "018", 名: "A1512-018-SAVED", 公開: "公開", 下書き: { 名: "A1512-018-DRAFT", 公開範囲: 2, フォーマット: "共有A" } },
  "S-A15-12-DRAFTUNLWRONG-019": { 末尾: "019", 名: "A1512-019-SAVED", 公開: "公開", トークン: "A1512-019-VIEW", 下書き: { 名: "A1512-019-DRAFT", 公開範囲: 3, フォーマット: "共有A" } },
  "S-A15-12-DRAFTUNLMATCH-020": { 末尾: "020", 名: "A1512-020-SAVED", 公開: "公開", トークン: "A1512-020-VIEW", 下書き: { 名: "A1512-020-DRAFT", 公開範囲: 3, フォーマット: "共有A" } },
  "S-A15-12-FIELDS-021": { 末尾: "021", 名: "A1512-021-DECK", 公開: "公開", 作成: 日時("2026-06-01 10:20:30"), 更新: 日時("2026-06-10 11:22:33") },
  "S-A15-12-FMTARC-022": { 末尾: "022", 名: "A1512-022-DECK", 公開: "公開", 代表カード: カード定義["1512924"].名日 },
  "S-A15-12-OWNER-023": { 末尾: "023", 名: "A1512-023-OWNER", 公開: "公開" },
  "S-A15-12-EVENT-024": { 末尾: "024", 名: "A1512-024-EVENT", 種別: "event", 公開: "公開", イベント: 大会("024") },
  "S-A15-12-NOEVENT-025": { 末尾: "025", 名: "A1512-025-NOEVENT", 公開: "公開", プレイヤー名を空にする: true },
  "S-A15-12-TOKENFIELD-026": { 末尾: "026", 名: "A1512-026-TOKENFIELD", 公開: "限定公開", トークン: "A1512-026-VIEW" },
  "S-A15-12-TAGS-027": { 末尾: "027", 名: "A1512-027-TAGS", 公開: "公開", タグ: [デッキタグ甲.名日, デッキタグ乙.名日] },
  "S-A15-12-NOTAG-028": { 末尾: "028", 名: "A1512-028-NOTAG", 公開: "公開" },
  "S-A15-12-CAMP-029": { 末尾: "029", 名: "A1512-029-CAMP", 公開: "公開", キャンペーン: true },
  "S-A15-12-CARDS-030": { 末尾: "030", 名: "A1512-030-CARDS", 公開: "公開", メイン: "4 A1512 Card One", サイド: "2 A1512 Card Two" },
  "S-A15-12-CARDFLAGS-031": { 末尾: "031", 名: "A1512-031-CARDFLAGS", 公開: "公開", メイン: "1 A1512 Card One\n1 A1512 Card Two" },
  "S-A15-12-READONLY-033": { 末尾: "033", 名: "A1512-033-SAVED", 公開: "公開", 更新: 日時("2026-07-07 07:07:07"), 下書き: { 名: "A1512-033-DRAFT", 公開範囲: 1, フォーマット: "共有A" } },
  "S-A15-12-RESP-034": { 末尾: "034", 名: "A1512-034-PUBLIC", 公開: "公開" },
  "S-A15-12-RANGE2-035": { 末尾: "035", 名: "A1512-035-RANGE2", 公開: "非公開" },
  "S-A15-12-RANGE3-036": { 末尾: "036", 名: "A1512-036-RANGE3", 公開: "限定公開", トークン: "A1512-036-VIEW" },
  "S-A15-12-FLAGON-037": { 末尾: "037", 名: "A1512-037-FLAGON", 公開: "非公開", リスト非公開: true },
  "S-A15-12-EVTOWNER-038": { 末尾: "038", 名: "A1512-038-EVENT", 種別: "event", 公開: "公開", イベント: 大会("038") },
  "S-A15-12-UNKYES-039": { 末尾: "039", 名: "A1512-039-UNKYES", 公開: "公開", メイン: "1 A1512-039-Card" },
  "S-A15-12-UNKNO-040": { 末尾: "040", 名: "A1512-040-UNKNO", 公開: "公開", メイン: "1 A1512-040-Card" },
  "S-A15-12-CBDRAFTPUBOWN-041": { 末尾: "CB041", 名: "A1512-CB041-SAVED", 公開: "公開", 下書き: { 名: "A1512-CB041-DRAFT", 公開範囲: 1, フォーマット: "共有A", アーキタイプ: "共有A" } },
};

for (const [id, d] of Object.entries(単純)) {
  defineSeed(id, { needs: ["S-A15-12-PLAYERS", "S-A15-12-MASTERS"] }, async (ctx) => {
    if (id === "S-A15-12-HIDE-016" && デッキの数("91512016") > 0) throw new Error(`${id}: デッキID 91512016 のデッキが既にある（消さずに止める）`);
    await デッキを作る(ctx, [d]);
  });
}

defineSeed("S-A15-12-ONE-032", { needs: ["S-A15-12-PLAYERS", "S-A15-12-MASTERS"] }, async (ctx) => {
  await デッキを作る(ctx, [{ 末尾: "032A", 名: "A1512-032-ONE", 公開: "公開" }, { 末尾: "032B", 名: "A1512-032-OTHER", 公開: "公開" }]);
});

defineSeed("S-A15-12-NODECK-015", async ({ seed }) => {
  const n = デッキの数("91512015");
  if (n > 0) throw new Error(`${seed.シードID}: デッキID 91512015 のデッキが ${n} 件ある（消さずに止める）`);
  reportSeedIssue(seed.シードID, "デッキID 91512015 のデッキが0件であることを DB の参照で確かめた（消す・書き換えるはしていない）");
});
