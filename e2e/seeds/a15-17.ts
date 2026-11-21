/**
 * A15-17 デッキ登録インポート（デッキビルダーの API の POST /api/deck/import）のシード。正本: cases/A15-17_seed_data.tsv
 *
 * 型は A15-01・A15-02 と同じ: 会員はフロントの新規会員登録で作る（seeds/a15-01.ts の 会員を作る。MTG Companion登録名を入れて選手を作る。
 * メールアドレスは @ の前に実行の印）。フォーマット・カード・アーキタイプ・キャンペーンタグは管理画面で「あれば使い、無ければ作る」。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-17_progress_2026-11-21_dev.md にも書く）:
 * - AUTH-CONFIG（署名方式・署名シークレットの設定）は、共有の開発環境では設定済みの値をそのまま使う（何もしない）。
 * - SCOPES・DECK-MASTERS（公開区分・ユーザーデッキ種別・採用領域のマスタ）は、登録済みであることを DB で読んで確かめるだけにする（書き込まない）。
 * - 「デッキ名のデッキがあれば関連データとともに DB から削除する」「カードX・Y があれば削除する」は行わない。ほかの方のデータは消さない。
 *   会員は毎回新しく登録するので、会員が所有するデッキ名のデッキは 0 件で始まる。持ち主を問わないデッキ名の件数を見るケース（012・013・028）は、
 *   送信の前後の差で見るため、事前の 0 件に頼らない。「存在しないカード」は DB で 0 件であることを読んで確かめ、あれば止める。
 * - アクセストークンは、シード表のログインフォームの操作の代わりに、ケースの中でログインの API から受け取る（署名鍵は使わない）。
 * - EXISTING-002 の既存同名デッキは、デッキビルダーの画面操作の代わりに、同じ会員のアクセストークンでデッキ登録インポートの API を呼んで作る
 *   （画面が送る要求と同じ。公開区分は非公開、採用カードは結合試験カードAが1枚）。
 * - カード画像は、カード登録CSVの画像URL(英語)に設計書の入力例の形式の値を入れて取り込む。カードの番号・キャンペーンタグの番号は、
 *   カード一覧・デッキビルダー API のマスタ検索の代わりに DB を名前で引いて控える（読むだけ）。
 */
import { SETUP_ADMIN } from "../config/env";
import {
  アーキタイプの番号, カード画像の数, カードの数, カードの番号, キャンペーンタグの番号, フォーマットを探す, 名前のカードの数, 参照マスタの不足,
  プレイヤーのデッキ,
} from "../db/a15_17";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { インポートする, ログインする } from "../pages/api/a15_17_deck_import";
import { アーキタイプを新規登録する, カードをCSVで登録する, キャンペーンタグを登録する, フォーマットを新規登録する } from "../pages/admin/a15_17_setup";
import { A1501のメール, 会員を作る, 印の注記 } from "./a15-01";

const 結合試験フォーマット = "結合試験フォーマット";
const 統率者試験フォーマット = "統率者試験フォーマット";
const カードA = { 日: "結合試験カードA", 英: "IT A1517 Card A" };
const カードB = { 日: "結合試験カードB", 英: "IT A1517 Card B" };
const カードC = { 日: "結合試験カードC", 英: "IT A1517 Card C" };

// --- 設定・マスタ（書き込まない） ---

defineSeed("S-A15-17-AUTH-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の署名方式・署名シークレットを書き換えず、設定済みの値をそのまま使った（アクセストークンはログインの API で受け取る）");
});

for (const id of ["S-A15-17-SCOPES", "S-A15-17-DECK-MASTERS"]) {
  defineSeed(id, async ({ seed }) => {
    const 不足 = 参照マスタの不足();
    if (不足.length) throw new Error(`${seed.シードID}: 登録済みのはずのマスタが足りない（${不足.join("、")}）。マスタは書き換えずに止める`);
    reportSeedIssue(seed.シードID, "公開区分（公開・非公開・限定公開）・ユーザーデッキの種別・採用領域（メインボード・サイドボード・統率領域）が登録済みであることを DB で読んで確かめた（書き込んでいない）");
  });
}

// --- フォーマット・カード・アーキタイプ・キャンペーンタグ（共有可: あれば使い、無ければ作る） ---

/** フォーマットを、あれば内容を確かめて使い、無ければ管理画面で登録する。番号を返す */
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

/** カードを、無いものだけカード登録CSVで登録し、番号を返す（名前の順） */
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

defineSeed("S-A15-17-FORMAT", async (ctx) => {
  const id = await フォーマットを用意する(ctx, 結合試験フォーマット, "IT Format A1517", "9001", "A1517FMT-A", false);
  ctx.notes.set("〔フォーマットID-A1517-共有A〕", id);
});

defineSeed("S-A15-17-CARDS", async (ctx) => {
  const [a, b] = await カードを用意する(ctx, [カードA, カードB], "a1517_cards_ab.csv");
  ctx.notes.set("〔カードID-A1517-共有A〕", a);
  ctx.notes.set("〔カードID-A1517-共有B〕", b);
});

defineSeed("S-A15-17-COMMANDER", async (ctx) => {
  const id = await フォーマットを用意する(ctx, 統率者試験フォーマット, "IT Commander Format A1517", "9002", "A1517FMT-B", true);
  ctx.notes.set("〔フォーマットID-A1517-共有B〕", id);
  const [c] = await カードを用意する(ctx, [カードC], "a1517_card_c.csv");
  ctx.notes.set("〔カードID-A1517-共有C〕", c);
});

defineSeed("S-A15-17-RELATED", { needs: ["S-A15-17-FORMAT", "S-A15-17-CARDS"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 型 = notes.get("〔フォーマットID-A1517-共有A〕");
  if (カード画像の数(notes.get("〔カードID-A1517-共有A〕")) === 0) throw new Error(`${seed.シードID}: 結合試験カードAのカード画像が無い（カード登録CSVの画像URL(英語)で付けるはず）`);
  issue("結合試験カードAの画像は、カード登録CSVの画像URL(英語)で取り込み済みであることを DB で読んで確かめた");
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
  notes.set("〔アーキタイプID-A1517-共有〕", 種);
  notes.set("〔キャンペーンタグID-A1517-共有A〕", 甲);
  notes.set("〔キャンペーンタグID-A1517-共有B〕", 乙);
  issue("アーキタイプの番号・キャンペーンタグの番号は、アーキタイプ管理の一覧・マスタ検索の応答の代わりに、DB を名前で引いて控えた（読むだけ）");
});

// --- 件数の上限・解読できない行（共有可。カードの追加は500件のカード登録CSVだけ） ---

const 上限の枚数 = 500;
const 上限のカード = (i: number) => ({ 日: `上限試験カード${String(i).padStart(3, "0")}`, 英: `IT A1517 Limit Card ${String(i).padStart(3, "0")}` });

defineSeed("S-A15-17-LIMIT-500", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 既存 = カードの数("上限試験カード");
  if (既存 === 上限の枚数) { issue(`カード「上限試験カード001〜500」は登録済み（${既存}件）なので、そのまま使った`); return; }
  if (既存 !== 0) throw new Error(`${seed.シードID}: 「上限試験カード」で始まるカードが ${既存} 件ある（0件か${上限の枚数}件のはず）。書き換えずに止める`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await カードをCSVで登録する(page, Array.from({ length: 上限の枚数 }, (_, i) => 上限のカード(i + 1)), "a1517_cards_limit500.csv", `${seed.シードID}: カード登録CSV（500行）`, issue);
  });
  const 後 = カードの数("上限試験カード");
  if (後 !== 上限の枚数) throw new Error(`${seed.シードID}: カード登録CSVを取り込んだが、「上限試験カード」で始まるカードが ${後} 件（${上限の枚数}件のはず）`);
  issue(`カード「上限試験カード001〜500」を ${上限の枚数} 行のカード登録CSVで登録し、DB で ${後} 件あることを確かめた（カード一覧の検索の代わり）`);
});

/** 「存在しないカード」の名前が、カードとして 0 件であること（あれば止める。消さない） */
function 存在しないカード(id: string, 名: string[]): void {
  defineSeed(id, async ({ seed }) => {
    for (const n of 名) {
      const c = 名前のカードの数(n);
      if (c !== 0) throw new Error(`${seed.シードID}: 「${n}」というカードが ${c} 件ある（シード表は存在しないカード。ほかの方のカードかもしれないので消さずに止める）`);
    }
    reportSeedIssue(seed.シードID, `「${名.join("」「")}」というカードが 0 件であることを DB で読んで確かめた（シード表の「あれば削除」は行わない）`);
  });
}
存在しないカード("S-A15-17-PARTIAL", ["存在しないカードX", "存在しないカードY"]);
存在しないカード("S-A15-17-ONEBAD-030", ["存在しないカードA1517-030Z"]);
存在しないカード("S-A15-17-CBLIST-031", ["存在しないカードA1517-CB031Z"]);

defineSeed("S-A15-17-NOAUTH-012", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "認証トークンを持たない要求はケースの中で作る。デッキ名「トークン欠落デッキ」のデッキを DB から消す操作は行わない（ほかの方のデータは消さない）。件数は送信の前後の差で確かめる");
});

// --- 会員（フロントの新規会員登録・選手あり） ---

/** 試験会員を登録する（メールアドレスは @ の前に実行の印） */
function 会員のシード(id: string, 番号: string, メール: string, パスワード: string, 名: string, needs: string[] = []) {
  defineSeed(id, { needs }, async (ctx) => {
    await 会員を作る(ctx, { メール, パスワード, 名, 選手: true, 呼び名: 番号, 機能: "A1517", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
    reportSeedIssue(ctx.seed.シードID, `${印の注記}。アクセストークンはケースの中でログインの API から受け取る`);
  });
}

/** ケースで使う会員のメールアドレス（実行の印つき）とパスワード */
export const 会員の定め: Record<string, { メール: string; パスワード: string }> = {};
function 登録(番号: string, メール: string, パスワード: string): void { 会員の定め[番号] = { メール: A1501のメール(メール), パスワード }; }

for (const n of ["001", "003", "004", "005", "008", "009", "010", "011", "013", "017", "024", "025", "026", "027", "028", "029", "030"]) {
  登録(n, `a1517-${n}@example.test`, `ItA1517-Pass${n}`);
  会員のシード(`S-A15-17-AUTH-A-${n}`, n, `a1517-${n}@example.test`, `ItA1517-Pass${n}`, `A1517-${n}`);
}
// 002 の登録者（A）と、既存同名デッキの持ち主（B）
登録("002A", "a1517-002a@example.test", "ItA1517-Pass002A");
会員のシード("S-A15-17-AUTH-B-002", "002A", "a1517-002a@example.test", "ItA1517-Pass002A", "A1517-002A");
登録("002B", "a1517-002b@example.test", "ItA1517-Pass002B");
defineSeed("S-A15-17-EXISTING-002", { needs: ["S-A15-17-FORMAT", "S-A15-17-CARDS"] }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  await 会員を作る(ctx, { メール: "a1517-002b@example.test", パスワード: "ItA1517-Pass002B", 名: "A1517-002B", 選手: true, 呼び名: "002B", 機能: "A1517", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
  const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(c);
    const page = await c.newPage();
    const 定め = 会員の定め["002B"];
    const { token, 応答 } = await ログインする(page, 定め.メール, 定め.パスワード);
    if (!token) throw new Error(`${seed.シードID}: 既存同名デッキの持ち主のログインでアクセストークンを受け取れない（HTTP ${応答.ステータス} ${応答.本文}）`);
    const r = await インポートする(page, token, {
      フォーマット: notes.get("〔フォーマットID-A1517-共有A〕"), デッキ名: "既存同名デッキ", 公開区分: "2", カードリスト: ["1 結合試験カードA"],
    });
    const id = r.json?.deck_id;
    if (r.ステータス !== 200 || (typeof id !== "number" && typeof id !== "string")) throw new Error(`${seed.シードID}: 既存同名デッキの登録に失敗（HTTP ${r.ステータス} ${r.本文.slice(0, 200)}）`);
    notes.set("〔デッキID-A1517-002〕", String(id));
  } finally { await c.close(); }
  const 件数 = プレイヤーのデッキ(notes.get("〔プレイヤーID-A1517-002B〕"), "既存同名デッキ").length;
  if (件数 !== 1) throw new Error(`${seed.シードID}: 既存同名デッキの持ち主のデッキ「既存同名デッキ」が ${件数} 件（1件のはず）`);
  reportSeedIssue(seed.シードID, `${印の注記}。既存同名デッキは、デッキビルダーの画面操作の代わりに、持ち主のアクセストークンでデッキ登録インポートの API を呼んで作った（非公開・結合試験カードAが1枚）。デッキ名のデッキの削除は行わない`);
});

// 統率者試験フォーマットのケース用の会員（CBAUTH）
for (const n of ["031", "032", "033", "034", "035", "036", "037", "038", "039"]) {
  登録(n, `cba1517-${n}@example.test`, `ItA1517-CB${n}-Pass`);
  会員のシード(`S-A15-17-CBAUTH-${n}`, n, `cba1517-${n}@example.test`, `ItA1517-CB${n}-Pass`, `A1517-CB${n}`);
}
