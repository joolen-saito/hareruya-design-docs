/**
 * A15-18 デッキ更新インポート（デッキビルダーの API の PUT /api/deck/import/{デッキID}）のシード。正本: cases/A15-18_seed_data.tsv
 *
 * 型は A15-17 と同じ: 会員はフロントの新規会員登録で作る（seeds/a15-01.ts の 会員を作る。MTG Companion登録名を入れて選手を作る。
 * メールアドレスは @ の前に実行の印）。フォーマット・カード・アーキタイプ・キャンペーンタグは管理画面で「あれば使い、無ければ作る」
 * （A15-17 と同じ名前のマスタは同じものを使い回す）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-18_progress_2026-11-21_dev.md にも書く）:
 * - 更新の対象デッキ（シード表は「DB シードで同じデッキ ID の試験データを入れ直す」）は、DB へ書かずに、デッキビルダーの登録の API
 *   （POST /api/deck。画面が送る要求と同じ）で、シード表と同じ内容（所有者・デッキ名・フォーマット・非公開・4区分の明細各1件）に作る。
 *   デッキの識別子は固定の値にできず、API が振った番号になる（ケースの文の固定の識別子は、控えた番号に読み替える）。
 * - デッキの一時保存（下書き）は、シード表どおりデッキビルダーの更新の API を「即時保存」なしで呼んで作り、取得の API で下書きがあることを確かめる。
 * - AUTH-CONFIG 相当（署名方式・署名シークレット）は共有の設定なので書き換えない。アクセストークンはログインの API から受け取る（署名鍵は使わない）。
 * - 「デッキ・カードがあれば削除する」「未登録のデッキ・カードを 0 件にする」は行わない。ほかの方のデータは消さない。
 *   未登録のカード名・デッキの識別子は、DB を読んで 0 件であることを確かめ、あれば止める。会員は毎回新しく登録するので所有デッキは無い。
 * - 対象のデッキ・会員は実行の印つきの会員のものなので、シード表の固定のデッキ識別子・プレイヤー識別子は使わない。
 */
import { SETUP_ADMIN, BASE_URL } from "../config/env";
import {
  アーキタイプの番号, カード画像の数, カードの数, カードの番号, カードの最新の画像の番号, キャンペーンタグの番号, デッキがある, フォーマットを探す, 公開区分の番号,
  名前のカードの数, 参照マスタの不足,
} from "../db/a15_18";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 下書きを作る, 取得したデッキ名, 対象デッキを作る, ログインする } from "../pages/api/a15_18_deck_update_import";
import { アーキタイプを新規登録する, カードをCSVで登録する, キャンペーンタグを登録する, フォーマットを新規登録する } from "../pages/admin/a15_17_setup";
import { A1501のメール, 会員を作る, 印の注記 } from "./a15-01";

const 結合試験フォーマット = "結合試験フォーマット";
const 統率者試験フォーマット = "統率者試験フォーマット";
/** 更新の対象デッキの番号（呼び名ごと）。シード表に無い呼び名は notes に控えられないので、ワーカーの中のこの表に持つ（ケースのシードがケースの直前に作る） */
export const 対象デッキの番号 = new Map<string, string>();
export const カード定義 = {
  A: { 日: "結合試験カードA", 英: "IT A1517 Card A" },
  B: { 日: "結合試験カードB", 英: "IT A1517 Card B" },
  C: { 日: "更新前デッキカード用", 英: "IT A1518 Pre Deck Card" },
  D: { 日: "更新前メイビー用", 英: "IT A1518 Pre Maybe Card" },
  E: { 日: "更新前アトラクション用", 英: "IT A1518 Pre Attraction Card" },
  F: { 日: "更新前ステッカー用", 英: "IT A1518 Pre Sticker Card" },
};

// --- 共有可: フォーマット・カード・アーキタイプ・キャンペーンタグ（あれば使い、無ければ作る） ---

async function フォーマットを用意する({ browser, seed }: SeedCtx, 名日: string, 名英: string, 並び順: string, コード: string, 統率: boolean): Promise<string> {
  const 既存 = フォーマットを探す(名日);
  if (既存) {
    if (既存.統率を使う !== 統率 || !既存.デッキビルダーで利用) throw new Error(`${seed.シードID}: フォーマット「${名日}」が既にあるが、内容がシード表と違う（統率でカードを使用する=${既存.統率を使う}、デッキビルダーで利用=${既存.デッキビルダーで利用}）。書き換えずに止める`);
    reportSeedIssue(seed.シードID, `フォーマット「${名日}」は登録済みで、統率でカードを使用する設定=${統率 ? "有効" : "無効"}・デッキビルダーで利用=有効であることを確かめて使った`);
    return 既存.番号;
  }
  let 番号 = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    番号 = await フォーマットを新規登録する(page, { 名日, 名英, 並び順, コード, 統率を使う: 統率 }, (m) => reportSeedIssue(seed.シードID, m));
  });
  return 番号;
}

async function カードを用意する({ browser, seed }: SeedCtx, 行: { 日: string; 英: string }[], ファイル名: string): Promise<string[]> {
  const 無い = 行.filter((c) => カードの番号(c.日) === null);
  if (無い.length) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await カードをCSVで登録する(page, 無い, ファイル名, `${seed.シードID}: カード登録CSV`, (m) => reportSeedIssue(seed.シードID, m));
    });
  } else {
    reportSeedIssue(seed.シードID, `カード「${行.map((c) => c.日).join("」「")}」は登録済みなので、そのまま使った`);
  }
  return 行.map((c) => {
    const id = カードの番号(c.日);
    if (id === null) throw new Error(`${seed.シードID}: カード「${c.日}」をカード登録CSVで登録したが、見つからない`);
    return id;
  });
}

defineSeed("S-A15-18-SCOPES", async ({ seed }) => {
  const 不足 = 参照マスタの不足();
  if (不足.length) throw new Error(`${seed.シードID}: 登録済みのはずのマスタが足りない（${不足.join("、")}）。マスタは書き換えずに止める`);
  reportSeedIssue(seed.シードID, "公開区分（公開・非公開・限定公開）・採用領域などが登録済みであることを DB で読んで確かめた（書き込んでいない）");
});

defineSeed("S-A15-18-FORMATS", async (ctx) => {
  const 前 = await フォーマットを用意する(ctx, "更新前フォーマット", "IT Pre Format A1518", "9003", "A1518FMT-A", false);
  ctx.notes.set("〔フォーマットID-A1518-共有A〕", 前);
  const 後 = await フォーマットを用意する(ctx, 結合試験フォーマット, "IT Format A1517", "9001", "A1517FMT-A", false);
  ctx.notes.set("〔フォーマットID-A1518-共有B〕", 後);
});

defineSeed("S-A15-18-COMMANDER", async (ctx) => {
  const id = await フォーマットを用意する(ctx, 統率者試験フォーマット, "IT Commander Format A1517", "9002", "A1517FMT-B", true);
  ctx.notes.set("〔フォーマットID-A1518-共有C〕", id);
});

defineSeed("S-A15-18-CARDS", async (ctx) => {
  const 順 = ["A", "B", "C", "D", "E", "F"] as const;
  const ids = await カードを用意する(ctx, 順.map((k) => カード定義[k]), "a1518_cards.csv");
  順.forEach((k, i) => ctx.notes.set(`〔カードID-A1518-共有${k}〕`, ids[i]));
});

defineSeed("S-A15-18-RELATED", { needs: ["S-A15-18-FORMATS", "S-A15-18-CARDS"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 型 = notes.get("〔フォーマットID-A1518-共有B〕");
  const カードA = notes.get("〔カードID-A1518-共有A〕");
  if (カード画像の数(カードA) === 0) throw new Error(`${seed.シードID}: 結合試験カードAのカード画像が無い（カード登録CSVの画像URL(英語)で付けるはず）`);
  issue("結合試験カードAの画像は、カード登録CSVの画像URL(英語)で取り込み済みであることを DB で読んで確かめた。カード画像の番号は、デッキビルダーのカード取得 API の代わりに DB で読んで控えた");
  const 作る = async (page: import("@playwright/test").Page) => {
    if (アーキタイプの番号("結合試験アーキタイプ", 型) === null) await アーキタイプを新規登録する(page, { 名日: "結合試験アーキタイプ", 名英: "IT Archetype A1517", フォーマット番号: 型 }, issue);
    for (const [日, 英, 順] of [["結合試験キャンペーンA", "IT Campaign A1517 A", "9001"], ["結合試験キャンペーンB", "IT Campaign A1517 B", "9002"]] as const) {
      if (キャンペーンタグの番号(日) === null) await キャンペーンタグを登録する(page, { 名日: 日, 名英: 英, 開始: "2026-01-01T00:00", 終了: "2030-12-31T23:59", 並び順: 順 }, issue);
    }
  };
  await withAdminSession(browser, SETUP_ADMIN, 作る);
  const 種 = アーキタイプの番号("結合試験アーキタイプ", 型);
  const 甲 = キャンペーンタグの番号("結合試験キャンペーンA");
  const 乙 = キャンペーンタグの番号("結合試験キャンペーンB");
  if (!種 || !甲 || !乙) throw new Error(`${seed.シードID}: アーキタイプ・キャンペーンタグが登録後に見つからない（${種}/${甲}/${乙}）`);
  notes.set("〔アーキタイプID-A1518-共有〕", 種);
  notes.set("〔カード画像ID-A1518-共有〕", カードの最新の画像の番号(カードA));
  notes.set("〔キャンペーンタグID-A1518-共有A〕", 甲);
  notes.set("〔キャンペーンタグID-A1518-共有B〕", 乙);
  issue("アーキタイプの番号・キャンペーンタグの番号は、アーキタイプ管理の一覧・マスタ検索の応答の代わりに、DB を名前で引いて控えた（読むだけ）");
});

const 上限の枚数 = 500;
const 上限のカード = (i: number) => ({ 日: `上限試験カード${String(i).padStart(3, "0")}`, 英: `IT A1517 Limit Card ${String(i).padStart(3, "0")}` });

defineSeed("S-A15-18-LIMIT-500", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 既存 = カードの数("上限試験カード");
  if (既存 === 上限の枚数) { issue(`カード「上限試験カード001〜500」は登録済み（${既存}件）なので、そのまま使った`); return; }
  if (既存 !== 0) throw new Error(`${seed.シードID}: 「上限試験カード」で始まるカードが ${既存} 件ある（0件か${上限の枚数}件のはず）。書き換えずに止める`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await カードをCSVで登録する(page, Array.from({ length: 上限の枚数 }, (_, i) => 上限のカード(i + 1)), "a1518_cards_limit500.csv", `${seed.シードID}: カード登録CSV（500行）`, issue);
  });
  const 後 = カードの数("上限試験カード");
  if (後 !== 上限の枚数) throw new Error(`${seed.シードID}: カード登録CSVを取り込んだが、「上限試験カード」で始まるカードが ${後} 件（${上限の枚数}件のはず）`);
  issue(`カード「上限試験カード001〜500」を ${上限の枚数} 行のカード登録CSVで登録し、DB で ${後} 件あることを確かめた（カード一覧の検索の代わり）`);
});

/** 「未登録のカード」の名前が、カードとして 0 件であること（あれば止める。消さない） */
function 未登録のカードを確かめる(seedId: string, 名: string[]): void {
  for (const n of 名) {
    const c = 名前のカードの数(n);
    if (c !== 0) throw new Error(`${seedId}: 「${n}」というカードが ${c} 件ある（シード表は未登録のカード。ほかの方のカードかもしれないので消さずに止める）`);
  }
  reportSeedIssue(seedId, `「${名.join("」「")}」というカードが 0 件であることを DB で読んで確かめた（シード表の「あれば削除」は行わない）`);
}
for (const [id, 名] of [
  ["S-A15-18-PARTIAL", ["存在しないカードX", "存在しないカードY"]],
  ["S-A15-18-PARTIAL-035", ["A1518-035-未登録カード"]],
  ["S-A15-18-PARTIAL-036", ["A1518-036-未登録カード"]],
] as [string, string[]][]) {
  defineSeed(id, async ({ seed }) => 未登録のカードを確かめる(seed.シードID, 名));
}

defineSeed("S-A15-18-NOTFOUND", async ({ seed }) => {
  if (デッキがある("999999")) throw new Error(`${seed.シードID}: デッキ 999999 が登録されている（シード表は未登録。ほかの方のデッキかもしれないので消さずに止める）`);
  reportSeedIssue(seed.シードID, "デッキ 999999 が未登録であることを DB で読んで確かめた（シード表の「あれば削除」は行わない）");
});

defineSeed("S-A15-18-AUTH-MISSING-013", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "認証トークンを持たない要求はケースの中で作る（システムへ登録するデータは無い）");
});

// --- 会員（フロントの新規会員登録・選手あり） ---

/** ケースで使う会員のメールアドレス（実行の印つき）とパスワード */
export const 会員の定め: Record<string, { メール: string; パスワード: string }> = {};

function 会員のシード(id: string, 呼び名: string, メール: string, パスワード: string, 名: string, needs: string[] = []) {
  会員の定め[呼び名] = { メール: A1501のメール(メール), パスワード };
  defineSeed(id, { needs }, async (ctx) => {
    await 会員を作る(ctx, { メール, パスワード, 名, 選手: true, 呼び名, 機能: "A1518", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
    reportSeedIssue(ctx.seed.シードID, `${印の注記}。アクセストークンは、シード表の「テスト環境の認証機能で発行する」の代わりに、ログインの API から受け取る（署名鍵は使わない）`);
  });
}
会員のシード("S-A15-18-AUTH-A", "共有A", "a1518-shared-a@example.test", "ItA1518-Pass-A1!", "A1518SharedA");
会員のシード("S-A15-18-AUTH-B", "共有B", "a1518-shared-b@example.test", "ItA1518-Pass-B1!", "A1518SharedB");
会員のシード("S-A15-18-AUTH-A-016", "016", "a1518-016@example.test", "ItA1518-Pass-016!", "A1518016");
会員のシード("S-A15-18-AUTH-A-019", "019", "a1518-019@example.test", "ItA1518-Pass-019!", "A1518019");
会員のシード("S-A15-18-AUTH-A-020", "020", "a1518-020@example.test", "ItA1518-Pass-020!", "A1518020");

/** 会員（呼び名）でログインしてアクセストークンを受け取る（コンテキストはこの関数の中で閉じる） */
async function 会員のトークン(ctx: SeedCtx, 会員: string): Promise<string> {
  const 定め = 会員の定め[会員];
  const c = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(c);
    const page = await c.newPage();
    const { token, 応答 } = await ログインする(page, 定め.メール, 定め.パスワード);
    if (!token) throw new Error(`${ctx.seed.シードID}: 会員 ${会員} のログインでアクセストークンを受け取れない（HTTP ${応答.ステータス} ${応答.本文}）`);
    return token;
  } finally { await c.close(); }
}

// --- 更新の対象デッキ（ケース専用。デッキビルダーの登録の API で作る） ---

type 対象の定め = {
  会員?: string;
  デッキ名: string;
  アーキタイプ?: boolean;
  タグ?: boolean;
  /** デッキ画像を更新前デッキカード用のカードの画像にする */
  画像?: boolean;
  /** 一時保存（下書き）を作る / 作らない（undefined は触れない） */
  下書き?: boolean;
  /** 4区分の明細を持たせる（既定 true）。017 のように デッキカード1件だけにするときは false */
  四区分?: boolean;
  /** 先にカード登録CSVで作るカード */
  先に作るカード?: { 日: string; 英: string }[];
  /** 未登録であることを確かめるカード名 */
  未登録のカード?: string[];
  needs?: string[];
};

function 対象のシード(seedId: string, 呼び名: string, o: 対象の定め) {
  const 会員 = o.会員 ?? "共有A";
  const 会員のシードID = ({ 共有A: "S-A15-18-AUTH-A", 共有B: "S-A15-18-AUTH-B", "020": "S-A15-18-AUTH-A-020" } as Record<string, string>)[会員];
  const needs = ["S-A15-18-FORMATS", "S-A15-18-CARDS", "S-A15-18-SCOPES", 会員のシードID, ...(o.アーキタイプ || o.タグ ? ["S-A15-18-RELATED"] : []), ...(o.needs ?? [])];
  defineSeed(seedId, { needs }, async (ctx) => {
    const { browser, notes, seed } = ctx;
    if (o.未登録のカード) 未登録のカードを確かめる(seed.シードID, o.未登録のカード);
    if (o.先に作るカード) {
      await カードを用意する(ctx, o.先に作るカード, `a1518_${呼び名}_cards.csv`);
    }
    const token = await 会員のトークン(ctx, 会員);
    const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(c);
      const page = await c.newPage();
      const 型A = notes.get("〔フォーマットID-A1518-共有A〕");
      const 非公開 = 公開区分の番号("非公開");
      const k = (x: string) => notes.get(`〔カードID-A1518-共有${x}〕`);
      const 四 = o.四区分 !== false;
      const id = await 対象デッキを作る(page, token, {
        デッキ名: o.デッキ名, フォーマット: 型A, 公開区分: 非公開,
        ...(o.アーキタイプ ? { アーキタイプ: notes.get("〔アーキタイプID-A1518-共有〕") } : {}),
        ...(o.タグ ? { キャンペーンタグ: [notes.get("〔キャンペーンタグID-A1518-共有A〕"), notes.get("〔キャンペーンタグID-A1518-共有B〕")] } : {}),
        ...(o.画像 ? { 画像カード: k("C") } : {}),
        デッキカード: [[k("C"), 1]],
        ...(四 ? { メイビー: [[k("D"), 1]] as [string, number][], アトラクション: [[k("E"), 1]] as [string, number][], ステッカー: [[k("F"), 1]] as [string, number][] } : {}),
      });
      対象デッキの番号.set(呼び名, id);
      if (o.下書き !== undefined) {
        if (o.下書き) await 下書きを作る(page, token, id, { フォーマット: 型A, 公開区分: 非公開, デッキ名: "下書き" });
        const 取得 = await 取得したデッキ名(page, token, id);
        if ((取得.デッキ名 === "下書き") !== o.下書き) throw new Error(`${seed.シードID}: デッキ ${id} の一時保存（下書き）が${o.下書き ? "あるはずが、無い" : "無いはずが、ある"}（取得の API のデッキ名「${取得.デッキ名}」・HTTP ${取得.ステータス}）`);
      }
    } finally { await c.close(); }
    reportSeedIssue(seed.シードID, `更新の対象デッキ（デッキ名「${o.デッキ名}」・非公開・${o.四区分 === false ? "デッキカード1件" : "4区分の明細各1件"}）は、DB への書き込みの代わりに、デッキビルダーの登録の API で作った。デッキの識別子は API が振った番号を控えた`
      + (o.下書き === undefined ? "" : o.下書き ? "。一時保存（下書き）は、更新の API を即時保存なしで呼んで作り、取得の API で下書きの名前が返ることを確かめた（Redis の代わり）" : "。一時保存が無いことは、取得の API が保存済みのデッキの名前を返すことで確かめた（Redis の代わり）"));
  });
}

for (const n of ["001", "002", "004", "005", "006", "009", "010", "011", "012", "014", "022", "027", "035", "036", "037", "038"]) {
  対象のシード(`S-A15-18-TARGET-A-${n}`, n, { デッキ名: `更新前デッキ-${n}` });
}
対象のシード("S-A15-18-TARGET-A-028", "028", { デッキ名: "A1518-028-更新前" });
対象のシード("S-A15-18-TARGET-A-029", "029", { デッキ名: "A1518-029-更新前", アーキタイプ: true });
対象のシード("S-A15-18-TARGET-A-033", "033", { デッキ名: "更新前デッキ-033", タグ: true });
対象のシード("S-A15-18-TARGET-A-032", "032", { デッキ名: "更新前デッキ-032", 画像: true });
対象のシード("S-A15-18-TARGET-A-031", "031", { デッキ名: "更新前デッキ-031", 画像: true, 先に作るカード: [{ 日: "A1518-031-統率者", 英: "IT A1518 Commander 031" }] });
対象のシード("S-A15-18-TARGET-A-020", "020", { 会員: "020", デッキ名: "更新前デッキ" });
defineSeed("S-A15-18-TARGET-B-017", { needs: ["S-A15-18-FORMATS", "S-A15-18-CARDS", "S-A15-18-SCOPES", "S-A15-18-AUTH-B"] }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const token = await 会員のトークン(ctx, "共有B");
  const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(c);
    const page = await c.newPage();
    const id = await 対象デッキを作る(page, token, {
      デッキ名: "他者所有デッキ-017", フォーマット: notes.get("〔フォーマットID-A1518-共有A〕"), 公開区分: 公開区分の番号("非公開"),
      デッキカード: [[notes.get("〔カードID-A1518-共有C〕"), 1]],
    });
    対象デッキの番号.set("017", id);
  } finally { await c.close(); }
  reportSeedIssue(seed.シードID, "プレイヤーB所有の更新対象デッキ（デッキ名「他者所有デッキ-017」・非公開・デッキカード1件だけ）は、DB への書き込みの代わりに、プレイヤーBのアクセストークンでデッキビルダーの登録の API を呼んで作った。デッキの識別子は API が振った番号を控えた");
});

// --- 組合せ確認用の更新対象（一時保存あり・なし） ---
const 組合せ: [string, boolean, string[], { 日: string; 英: string }[]][] = [
  ["041", true, [], []],
  ["042", false, [], []],
  ["043", true, [], []],
  ["044", false, ["A1518-CB044-未登録カード"], []],
  ["046", false, [], []],
  ["047", true, ["A1518-CB047-未登録カード"], [{ 日: "A1518-CB047-統率者", 英: "IT A1518 Commander CB047" }]],
  ["050", false, ["A1518-CB050-未登録カード"], [{ 日: "A1518-CB050-統率者", 英: "IT A1518 Commander CB050" }]],
  ["051", true, ["A1518-CB051-未登録カード"], []],
];
for (const [n, 下書き, 未登録, 先に作る] of 組合せ) {
  対象のシード(`S-A15-18-CBTARGET-${n}`, `CB${n}`, {
    デッキ名: `A1518-CB${n}-更新前`, 画像: true, 下書き, 未登録のカード: 未登録, 先に作るカード: 先に作る, needs: n === "043" || n === "044" || n === "047" || n === "050" || n === "051" ? ["S-A15-18-COMMANDER"] : [],
  });
}
