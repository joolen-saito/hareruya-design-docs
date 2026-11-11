/**
 * M13-08 デッキ表示（イベント管理）のシード（画面操作）。正本: cases/M13-08_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。シード表と違えたところ（解釈）:
 * - 店舗（S-M13-08-REF）: 新宿店・池袋店。あればそれを使い、無ければ店舗登録画面で登録する（M13-06 と同じ値。店舗一覧のIDを控える）。
 * - カード（S-M13-08-REF）: 「稲妻 / Lightning Bolt」（インスタント）・「島 / Island」（土地）・「否認 / Negate」（インスタント）。共有可なので、
 *   カード一覧にカード名欄が「日本語名 / 英語名」の行があれば、そのカードタイプを編集画面で確かめて使い（違えば止める。共有のマスタは直さない）、
 *   無ければカード新規登録画面で登録する（点数で見たマナ・コストは 1）。デッキ表示はカード名でカードを引くので、名前には実行の印を付けない。
 * - 管理者（S-M13-08-ADM）: 管理者ID 130800021 は画面では決められないので、画面が振る番号のまま使う。権限は「モールオペレーター」で代える
 *   （「店舗オーナー」「店舗オペレーター」は所属店舗しか見えない。M13-06・M13-11・M13-12 と同じ）。所属店舗・既定表示店舗・編集可能店舗は新宿店だけ。
 * - 池袋店のイベント・申込・デッキ（002・003）は、池袋店だけに編集権限を持つ別の管理者 m1308_admin_ikebukuro で作る
 *   （新宿店だけの管理者はイベント登録で池袋店を選べない。シード表に行が無いので、要るときに画面から作る。M13-06 と同じ）。
 * - 会員: フロントの会員情報登録画面で登録する。本登録のメールを読めない環境では、共通の部品が管理画面で本会員にする（シードの注記に残る）。
 *   メールアドレスの前半と、お名前(姓)（申込・デッキのプレイヤー検索に入れる語）には実行の印を付ける。名・フリガナは試験用の固定の値。
 * - 決め打ちの識別の値（イベント名(日)・(英)、デッキのプレイヤー名）には実行の印を付ける（依頼者決定 2026-10-28）。
 *   003 の検索語「M1308-003権限」は、印を付けた「M1308-003-印」のあとに「権限内大会」「権限外大会」を付けて、部分一致の関係を保つ。
 * - イベント: フォーマット「スタンダード」・ルール適用度「初心者歓迎」・公開状態「公開」・定員16・参加費0（任意の値）。
 *   日程: 開始時間はシード表の開催日の10:00、受付あり（09:00〜09:30）、デッキ登録なし、参加費0、
 *   オンライン受付ありで開始 開催日の00:00・終了 開催日の08:00（開始時間より前）。
 * - デッキのプレイヤー検索: シード表は「検索語を空のまま検索し、ID欄が〔プレイヤーID〕の行を選ぶ」。共有の環境では空の検索は結果が多く
 *   ページをまたぐので、会員のお名前(姓)で検索して、ID欄がそのプレイヤーIDの行を選ぶ。デッキ名は入れない（シード表に値が無い）。
 * - 申込選手ID（画面に出ない番号）は、DB の参照（SELECT）で控える（F07-04 の前例。依頼者決定 2026-11-03）。
 * - DB への直接の設定は行わない: 005・008・010・011 のデッキのプレイヤー名の前後の空白は付けない（各ケースはプレイヤー名を確かめない）。
 *   シードの注記に残し、条件付きとする。
 *
 * 作らないシード（ケースを実装しない）:
 * - DB への直接の設定がケースの確かめに要るもの: S-M13-08-DISPLAY-006（プレイヤー名の前後の空白。006 は空白を除いて表示するかを見る）、
 *   S-M13-08-FALLBACK-007（会員のカナ姓「アメミヤ-007」）、S-M13-08-DISPLAY-009（プレイヤーのDCI番号）。
 * - 共有の環境のカードのマスタに大量のカードを残すもの: S-M13-08-PAGE40-012・PAGE41-013・CBNOSIDE2P-019（41〜43件のカードを毎回登録する）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 申込の申込選手ID } from "../db/f07_04";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { registerEvent } from "../pages/admin/event";
import { 会員IDをメールから } from "../pages/admin/f07_04_setup";
import { EntryNewPage } from "../pages/admin/m13_12_entry_new";
import { カードを用意する, 大会デッキを登録する } from "../pages/admin/m13_08_deck_display";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";
import { registerFrontMember } from "../pages/front/member_entry";

export const M1308_ADMIN: Account = { loginId: "m1308_admin", password: "Passw0rd!M1308" };
/** 池袋店に編集権限を持つ別の管理者（シード表に行が無い。池袋店のイベントを作るときだけ画面から用意する） */
const M1308_IKEBUKURO_ADMIN: Account = { loginId: "m1308_admin_ikebukuro", password: "Passw0rd!M1308I" };
const 試験管理者の権限 = "モールオペレーター";
const 会員のパスワード = "Passw0rd!M1308M";

type 店舗 = "新宿店" | "池袋店";

// ---- 共通参照データ・管理者 ----

defineSeed("S-M13-08-REF", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    notes.set("〔店舗ID-M1308-共有A〕", await ensureTenant(page, { 店名: "新宿店", 店名カナ: "シンジュクテン", 店名英語: "Shinjuku", 支店URL: "m1306shinjuku", 店名略称3文字: "新宿店", ショップ名略称: "新宿店" }, issue));
    notes.set("〔店舗ID-M1308-共有B〕", await ensureTenant(page, { 店名: "池袋店", 店名カナ: "イケブクロテン", 店名英語: "Ikebukuro", 支店URL: "m1306ikebukuro", 店名略称3文字: "池袋店", ショップ名略称: "池袋店" }, issue));
    notes.set("〔カードID-M1308-共有A〕", await カードを用意する(page, { 日本語名: "稲妻", 英語名: "Lightning Bolt", カードタイプ: "インスタント" }, issue));
    notes.set("〔カードID-M1308-共有B〕", await カードを用意する(page, { 日本語名: "島", 英語名: "Island", カードタイプ: "土地" }, issue));
    notes.set("〔カードID-M1308-共有C〕", await カードを用意する(page, { 日本語名: "否認", 英語名: "Negate", カードタイプ: "インスタント" }, issue));
  });
});

defineSeed("S-M13-08-ADM", { needs: ["S-M13-08-REF"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-08試験管理者", 所属店舗: "新宿店", ログインID: M1308_ADMIN.loginId, メールアドレス: "m1308_admin@example.test",
      パスワード: M1308_ADMIN.password, 権限: 試験管理者の権限, デフォルト検索表示店舗: "新宿店", 編集可能店舗: ["新宿店"],
    });
  });
  reportSeedIssue(seed.シードID, "管理者ID 130800021 は画面で決められないので、画面が振った番号のまま使う。権限は「モールオペレーター」で代えた（所属店舗・既定表示店舗・編集可能店舗は新宿店だけ）");
  // ログインできる（稼働中）ことを、別のセッションで確かめる
  await withAdminSession(browser, M1308_ADMIN, async () => {});
});

async function 池袋店の管理者を用意する(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-08池袋店管理者", 所属店舗: "池袋店", ログインID: M1308_IKEBUKURO_ADMIN.loginId, メールアドレス: "m1308_admin_ikebukuro@example.test",
      パスワード: M1308_IKEBUKURO_ADMIN.password, 権限: 試験管理者の権限, デフォルト検索表示店舗: "池袋店", 編集可能店舗: ["池袋店"],
    });
  });
}

// ---- 部品 ----

/** 正本の値に実行の印を付けた値（イベント名・プレイヤー名）。ケースも同じ値で読む */
export const 印 = (正本の値: string): string => rc(正本の値);
/** 003 の検索語と、その語を部分一致で含む2つのイベント名 */
export const 権限003 = { 検索語: () => `${rc("M1308-003")}権限`, 権限内: () => `${rc("M1308-003")}権限内大会`, 権限外: () => `${rc("M1308-003")}権限外大会` };

/** シード表の1人ぶん（会員・イベント・日程・申込・デッキ） */
export type 側 = {
  /** 呼び名の末尾（例: 001A・005・CB018） */
  記号: string;
  店舗: 店舗;
  イベント名日: string; イベント名英: string;
  /** 「2026-10-01」の形 */
  開催日: string;
  /** デッキのプレイヤー名 */
  プレイヤー名: string;
  /** メールアドレスの前半（シード表の値。実行の印を付ける） */
  メールの前半: string;
  メイン: string; サイド?: string;
};

/** フロントの会員情報登録画面で会員を登録する（プレイヤーは会員と同時に作られる） */
async function 会員を登録する(browser: Browser, 姓: string, メール: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓, 名: "一郎", セイ: "ケンショウ", メイ: "イチロウ", メール, パスワード: 会員のパスワード });
  } finally {
    await context.close();
  }
}

/** 会員を登録し、イベント・日程・申込・大会デッキを作って、呼び名を控える */
async function 側を作る(browser: Browser, notes: Notes, v: 側, issue: (m: string) => void): Promise<void> {
  const 姓 = rc(`M1308検証${v.記号}`);
  const メール = `${v.メールの前半}-${RUN_MARK}@example.test`.toLowerCase();
  await 会員を登録する(browser, 姓, メール);
  notes.set(`〔会員ID-M1308-${v.記号}〕`, await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDをメールから(page, メール)));
  if (v.店舗 === "池袋店") await 池袋店の管理者を用意する(browser);
  await withAdminSession(browser, v.店舗 === "池袋店" ? M1308_IKEBUKURO_ADMIN : M1308_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    const イベントID = await registerEvent(page, {
      イベント名日: v.イベント名日, イベント名英: v.イベント名英, 店舗: v.店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "0",
    });
    notes.set(`〔イベントID-M1308-${v.記号}〕`, イベントID);
    const 日程ID = await registerSchedule(page, イベントID, {
      開始時間: `${v.開催日} 10:00`, 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false,
      オンライン受付: { 開始: `${v.開催日} 00:00`, 終了: `${v.開催日} 08:00` }, 参加費: "0",
    });
    notes.set(`〔日程ID-M1308-${v.記号}〕`, 日程ID);
    // 申込: イベント申込登録で日程の「新規登録」→ プレイヤーを会員のお名前で検索 → ID を控えて決定 → 登録
    const f = new EntryNewPage(page);
    await f.検索結果から開く(v.イベント名日, 日程ID);
    await f.ポップアップを開く();
    await f.プレイヤーを検索する(姓);
    const rows = (await f.結果の行の中身()).filter((r) => r.名前.startsWith(姓));
    if (rows.length !== 1) throw new Error(`申込のプレイヤー検索「${姓}」で、お名前がその語で始まる行が ${rows.length} 行ある（1行のはず）`);
    const プレイヤーID = rows[0].ID;
    notes.set(`〔プレイヤーID-M1308-${v.記号}〕`, プレイヤーID);
    await f.決定する(プレイヤーID);
    const 申込ID = await f.登録して申込IDを読む(`イベント申込（${v.イベント名日}・${姓}）の登録`);
    notes.set(`〔申込ID-M1308-${v.記号}〕`, 申込ID);
    notes.set(`〔申込選手ID-M1308-${v.記号}〕`, 申込の申込選手ID(申込ID));
    // 大会デッキ
    notes.set(`〔デッキID-M1308-${v.記号}〕`, await 大会デッキを登録する(page, {
      プレイヤー検索語: 姓, プレイヤーID, プレイヤー名: v.プレイヤー名, イベント名: v.イベント名日, 店舗: v.店舗, 日程ID, 開催日: v.開催日.replace(/-/g, "/"),
      メイン: v.メイン, サイド: v.サイド,
    }, issue));
  });
}

function defineSideSeed(seedId: string, sides: 側[], 注記?: string): void {
  defineSeed(seedId, { needs: ["S-M13-08-ADM"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    for (const s of sides) await 側を作る(browser, notes, s, issue);
    issue("デッキのプレイヤー検索は、検索語を空にせず会員のお名前(姓)で検索し、ID欄がそのプレイヤーIDの行を選んだ（共有の環境では空の検索の結果がページをまたぐ）");
    if (注記) issue(注記);
  });
}

const 稲妻1 = "1 稲妻";
const 側 = (記号: string, 店舗: 店舗, 名日: string, 開催日: string, プレイヤー名: string, メールの前半: string, over: Partial<側> = {}): 側 => ({
  記号, 店舗, イベント名日: 名日, イベント名英: 名日, 開催日, プレイヤー名, メールの前半, メイン: 稲妻1, ...over,
});

// 001: 検索対象と比較のイベント（新宿店）
defineSideSeed("S-M13-08-FILTER-001", [
  側("001A", "新宿店", 印("M1308-001検索対象大会"), "2026-10-01", 印("検索対象太郎-001"), "m1308-001-a"),
  側("001B", "新宿店", 印("M1308-001比較大会"), "2026-10-02", 印("比較花子-001"), "m1308-001-b"),
]);
// 002: 権限内（新宿店）・権限外（池袋店）・検索対象・比較
defineSideSeed("S-M13-08-DATA-002", [
  側("002A", "新宿店", 印("M1308-002権限内大会"), "2026-10-03", 印("権限内太郎-002"), "m1308-002-a"),
  側("002B", "池袋店", 印("M1308-002権限外大会"), "2026-10-04", 印("権限外次郎-002"), "m1308-002-b"),
  側("002C", "新宿店", 印("M1308-002検索対象大会"), "2026-10-05", 印("検索対象太郎-002"), "m1308-002-c"),
  側("002D", "新宿店", 印("M1308-002比較大会"), "2026-10-06", 印("比較花子-002"), "m1308-002-d"),
]);
// 003: 権限内（新宿店）・権限外（池袋店）
defineSideSeed("S-M13-08-AUTH-003", [
  側("003A", "新宿店", 権限003.権限内(), "2026-10-07", 印("権限内太郎-003"), "m1308-003-a"),
  側("003B", "池袋店", 権限003.権限外(), "2026-10-08", 印("権限外次郎-003"), "m1308-003-b"),
]);
// 004: 検索対象と比較
defineSideSeed("S-M13-08-FILTER-004", [
  側("004A", "新宿店", 印("M1308-004検索対象大会"), "2026-10-09", 印("検索対象太郎-004"), "m1308-004-a"),
  側("004B", "新宿店", 印("M1308-004比較大会"), "2026-10-10", 印("比較花子-004"), "m1308-004-b"),
]);

// 005・008・010・011: メインは稲妻4枚と島20枚、サイドは否認3枚。プレイヤー名の前後の空白（DB への直接の設定）は付けない
const 表示デッキ = { メイン: "4 稲妻\n20 島", サイド: "3 否認" };
const 空白の注記 = (n: string) => `シード表はデッキのプレイヤー名の前後に空白を付けて「 晴屋 太郎-${n} 」とするが、画面で指定できず DB への直接の設定になるので行わず、「晴屋 太郎-${n}」（実行の印つき）のまま登録した（条件付き。このケースはプレイヤー名を確かめない）`;
export const 表示大会名 = (n: string) => 印(`M1308-${n}表示大会`);
export const 表示プレイヤー名 = (n: string) => 印(`晴屋 太郎-${n}`);
const 表示側 = (n: string): 側[] => [
  側(n, "新宿店", 表示大会名(n), "2026-10-15", 表示プレイヤー名(n), `m1308-${n}`, { イベント名英: 印(`M1308-${n} Display Tournament`), ...表示デッキ }),
];
defineSideSeed("S-M13-08-DISPLAY-005", 表示側("005"), 空白の注記("005"));
defineSideSeed("S-M13-08-DISPLAY-008", 表示側("008"), 空白の注記("008"));
defineSideSeed("S-M13-08-DISPLAY-010", 表示側("010"), 空白の注記("010"));
defineSideSeed("S-M13-08-DISPLAY-011", 表示側("011"), 空白の注記("011"));

// 018: メインは稲妻4枚と島20枚、サイドは空
export const 大会018 = () => 印("M1308-CB018無サイド一頁大会");
export const プレイヤー018 = () => 印("一頁無サイド 太郎 M1308-CB018");
defineSideSeed("S-M13-08-CBNOSIDE1P-018", [
  側("CB018", "新宿店", 大会018(), "2026-12-01", プレイヤー018(), "m1308-cb018", { イベント名英: 印("M1308-CB018-EN"), メイン: "4 稲妻\n20 島", サイド: "" }),
]);
