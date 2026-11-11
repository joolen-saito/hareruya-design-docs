/**
 * M10-15 店舗登録 のシード。正本: cases/M10-15_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）による読み替え:
 * - 店舗のシード（BASE・CLOSED・L-SHOP・GFBASE・QJ-SHOP・CBBASE）は、ケースごとに店舗を新規登録せず、M10-15 専用の試験用店舗
 *   （2店。pages/admin/m10_15_tenant.ts）を画面で開き、全項目をシード表の値へ入れ直して登録する。店名には試験用店舗の印
 *   （「-M1015P1」「-M1015P2」）を末尾に付ける（店舗一覧で見つけるため）。店名略称（3文字）がもう一方の試験用店舗と重なるときは、
 *   そちらの略称を控えの値へどかす。試験用でない店舗が使っているときは止める（共有の店舗を書き換えない）。
 * - 画面に入力欄が無い項目（ショップカラー・管理者情報のログインID/パスワード）は入れられないので、シード作成時の問題として残す。
 * - DB で作る・消す前提は、画面で確かめられることに読み替える（店名の店舗が無いことは店舗一覧の検索で、店舗ID 999999 が無いことは
 *   店舗一覧の検索で確かめる）。在庫・採番の値を DB で決める前提は、ケースが登録の前の値を DB で読んで比べることに読み替える
 *   （spec の注記に書く）。基準店舗の在庫（TC東京の SKU-INIT-A・B）は、開発環境に既にある基準店舗の在庫を使う。
 * - 新規登録のケースの入力値（S-M10-15-NEW・REQINPUT）は、店名・支店URL に実行ごとの印、店名略称（3文字）に実行とケースで
 *   決まる3文字を使う（同じ環境で何度でも流せるように。spec の注記に書く）。
 * 試験管理者は「システム管理者」の権限（店舗の登録・編集、在庫検索一覧、分析・集計管理を操作できる）。
 * 参照の管理者（店舗の登録・編集権限なし）と、店舗の管理者情報に使うメンバーは「店舗オペレーター」（店舗設定の画面を使えない権限）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { 店名で探す, 店舗一覧を検索する, 店舗の値, 整える指定, 試験店舗, 試験店舗を整える } from "../pages/admin/m10_15_tenant";
import { 画像ファイル } from "../fixtures/m10-15/images";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1015_ADMIN: Account = { loginId: "m1015_admin", password: "Passw0rd!M1015Admin" };
export const M1015_VIEW: Account = { loginId: "m1015_view", password: "Passw0rd!M1015View" };
export const M1015_OWNER: Account = { loginId: "m1015_owner", password: "Passw0rd!M1015" };
export const M1015_L_ADMIN: Account = { loginId: "m1015l_admin", password: "Passw0rd!M1015L" };
export const M1015_L_OWNER: Account = { loginId: "m1015l_owner", password: "Passw0rd!M1015LO" };
export const M1015_AGG: Account = { loginId: "m1015_aggadmin", password: "Passw0rd!M1015Agg" };
export const M1015_QJ_ADMIN: Account = { loginId: "m1015qjadmin", password: "Passw0rd-M1015QJ" };
export const M1015_QJ_OWNER: Account = { loginId: "m1015qjowner", password: "Passw0rd-M1015QJO" };

// ---- 管理者・メンバー ----

defineSeed("S-M10-15-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-15試験管理者", account: M1015_ADMIN, メール: "m1015_admin@example.test" });
});
defineSeed("S-M10-15-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-15連携確認管理者", account: M1015_L_ADMIN, メール: "m1015l_admin@example.test" });
});
defineSeed("S-M10-15-GFAGG", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-15集計確認管理者", account: M1015_AGG, メール: "m1015_aggadmin@example.test" });
});
defineSeed("S-M10-15-QJ-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-15連携試験管理者", account: M1015_QJ_ADMIN, メール: "m1015qjadmin@example.test" });
});

/** 店舗設定の画面を使えない権限（店舗オペレーター）のメンバー。所属店舗は本店 */
async function ensureOperator(browser: Browser, 名前: string, account: Account, メール: string): Promise<void> {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前, 所属店舗: shop, ログインID: account.loginId, メールアドレス: メール, パスワード: account.password,
      権限: "店舗オペレーター", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
}
defineSeed("S-M10-15-VIEW", async ({ browser }) => { await ensureOperator(browser, "M10-15参照管理者", M1015_VIEW, "m1015_view@example.test"); });
defineSeed("S-M10-15-OWNER", async ({ browser }) => { await ensureOperator(browser, "M10-15店舗システム管理者候補", M1015_OWNER, "m1015_owner@example.test"); });
defineSeed("S-M10-15-L-OWNER", async ({ browser }) => { await ensureOperator(browser, "M10-15店舗システム管理者メンバー", M1015_L_OWNER, "m1015l_owner@example.test"); });
defineSeed("S-M10-15-QJ-OWNER", async ({ browser }) => { await ensureOperator(browser, "M10-15連携試験管理者情報メンバー", M1015_QJ_OWNER, "m1015qjowner@example.test"); });

// ---- 入力値・ファイル・マスタ（投入不要） ----

// 試験者が手元に用意する入力値。ケースが入力する（spec の 新規の値・必須の値）
defineSeed("S-M10-15-NEW", async () => {});
defineSeed("S-M10-15-REQINPUT", async () => {});
// 画像はケース（とシード）が、シード表の形式・バイト数・色・寸法で作る（fixtures/m10-15/images.ts）
defineSeed("S-M10-15-JPEG", async () => {});
defineSeed("S-M10-15-GIF", async () => {});
defineSeed("S-M10-15-PNG", async () => {});
defineSeed("S-M10-15-QJ-IMG", async () => {});
// 都道府県は標準のマスタ。ケースが東京都を選ぶ（選択肢に無ければケースが止まる）
defineSeed("S-M10-15-PREF", async () => {});
defineSeed("S-M10-15-STOCK-SOURCE", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "基準店舗の在庫（TC東京の SKU-INIT-A=7・SKU-INIT-B=3）は DB で入れる前提。開発環境に既にある基準店舗の在庫をそのまま使う（在庫の値は変えない・確かめない）");
});
defineSeed("S-M10-15-GFINIT-077", async () => {});

// ---- 新規登録先が無いこと（DB での除去を、店舗一覧の検索で無いことを確かめる、に読み替え） ----

/** 新規登録のケースの店名（実行の印・ケース番号つき）。spec と共有する */
export const 新規の店名 = (正本の店名: string, 番号: string): string => `${rc(正本の店名)}-${番号}`;

function defineAbsentSeed(seedId: string, 正本の店名: string, 番号: string): void {
  defineSeed(seedId, { needs: ["S-M10-15-ADM"] }, async ({ browser }) => {
    const 店名 = 新規の店名(正本の店名, 番号);
    const found = await withAdminSession(browser, M1015_ADMIN, (page) => 店名で探す(page, 店名));
    if (found.some((f) => f.店名 === 店名)) throw new Error(`${seedId}: 店名「${店名}」の店舗がもうある（${found.map((f) => f.店舗ID).join("、")}）`);
    reportSeedIssue(seedId, `DB での除去を、店舗一覧の検索で店名「${店名}」の店舗が無いことを確かめる、に読み替えた（店名は実行の印つきなので、採番・在庫も無い）`);
  });
}
defineAbsentSeed("S-M10-15-NEW-008", "結合試験店舗", "008");
defineAbsentSeed("S-M10-15-NEW-063", "結合試験店舗", "063");
defineAbsentSeed("S-M10-15-NEW-064", "結合試験店舗", "064");
defineAbsentSeed("S-M10-15-NEW-066", "結合試験店舗", "066");
defineAbsentSeed("S-M10-15-REQINPUT-012", "必須項目店舗", "012");
defineAbsentSeed("S-M10-15-REQINPUT-068", "必須項目店舗", "068");

defineSeed("S-M10-15-NOMEMBER-069", { needs: ["S-M10-15-ADM"] }, async ({ browser, seed }) => {
  const 店名 = 新規の店名("必須項目店舗", "069");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const found = await 店名で探す(page, 店名);
    if (found.some((f) => f.店名 === 店名)) throw new Error(`店名「${店名}」の店舗がもうある`);
    const res = await page.goto(adminUrl("/setting/system/member"));
    if (!res || !res.ok()) throw new Error("メンバー一覧を開けない");
    const n = await page.locator('tr[id^="ex-member-"]').filter({ hasText: "missing_m1015" }).count();
    if (n > 0) throw new Error("ログインID missing_m1015 のメンバーがいる");
  });
  reportSeedIssue(seed.シードID, `DB での除去を、店舗一覧・メンバー一覧で店名「${店名}」の店舗とログインID missing_m1015 のメンバーが無いことを確かめる、に読み替えた`);
});

// ---- 試験用店舗（共通の試験データ）をシードの値へ入れ直す ----

const 読み替え = "ケースごとの店舗の新規登録を、M10-15 の試験用店舗を開いて全項目をシード表の値へ入れ直して登録する、に読み替えた（共有の環境に店舗を増やさないため。店名の末尾に試験用店舗の印を付けた）";
const 管理者情報 = "管理者情報（ログインID・パスワード・パスワード（確認））の入力欄は店舗登録画面に無いので入れていない";

type 店舗シード = { slot: 試験店舗; 呼び名?: string; 指定: 整える指定 };
function defineTenantSeed(seedId: string, account: Account, needs: string[], 店舗たち: () => 店舗シード[]): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    issue(読み替え);
    issue(管理者情報);
    await withAdminSession(browser, account, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const s of 店舗たち()) {
        const id = await 試験店舗を整える(page, s.slot, s.指定, issue);
        if (s.呼び名) notes.set(s.呼び名, id);
      }
    });
  });
}
const 基本 = ["S-M10-15-ADM"];
/** 更新前店舗（S-M10-15-004 の具体値）。上書きの値を足す */
const 更新前 = (v: 店舗の値 = {}): 店舗の値 => ({
  会社名: "更新前会社", "会社名(カナ)": "コウシンマエガイシャ", 店名: "更新前店舗", "店名(カナ)": "コウシンマエテンポ", "店名(英語表記)": "Before Shop",
  支店URL: "before", 店舗種別: "支店", 公開: "非公開", 開店: "開店", 都道府県: "東京都", 住所: "千代田区一丁目", "住所(英語表記)": "1 Chiyoda Tokyo",
  電話番号: "0312345678", 送信元メールアドレス: "before-from@example.com", 返信先メールアドレス: "before-reply@example.com",
  送信エラー通知メールアドレス: "before-error@example.com", 問い合わせ専用メールアドレス: "before-contact@example.com",
  "店名略称（3文字）": "OLD", ショップ名略称: "更新前略称", "ショップ名略称（英語表記）": "BeforeShop", 表示順: "20", ...v,
});
const defineOneShopSeed = (seedId: string, 番号: string, v: 店舗の値, extra: Partial<整える指定> = {}) =>
  defineTenantSeed(seedId, M1015_ADMIN, 基本, () => [{ slot: "P1", 呼び名: `〔店舗ID-M1015-${番号}〕`, 指定: { 値: v, ...extra } }]);

defineOneShopSeed("S-M10-15-BASE-004", "004", 更新前({ ショップカラー: "#112233", 表示順: "15004" }), { アイコン: 画像ファイル["old-icon.png"]() });
defineTenantSeed("S-M10-15-BASE-005", M1015_ADMIN, 基本, () => [
  { slot: "P1", 呼び名: "〔店舗ID-M1015-005A〕", 指定: { 値: 更新前({ 開店: "開店" }) } },
  { slot: "P2", 呼び名: "〔店舗ID-M1015-005B〕", 指定: { 値: 更新前({ 会社名: "重複確認会社", 店名: "重複確認店舗", "店名略称（3文字）": "ABC", ショップ名略称: "東京店", 表示順: "21", 開店: "開店", 支店URL: "m1015poolb" }) } },
]);
defineSeed("S-M10-15-BASE-006", { needs: 基本 }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  issue(読み替え); issue(管理者情報);
  await withAdminSession(browser, M1015_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-M1015-006〕", await 試験店舗を整える(page, "P1", { 値: 更新前() }, issue));
    // 店舗ID 999999 が無いこと（DB での除去を、店舗一覧の検索で無いことを確かめる、に読み替え）
    const rows = await 店舗一覧を検索する(page, "999999");
    const hit = await rows.filter({ has: page.locator("td:nth-child(2)", { hasText: /^\s*999999\s*$/ }) }).count();
    if (hit > 0) throw new Error("店舗ID 999999 の店舗がある");
    issue("店舗ID 999999 の店舗が無いことを、DB でなく店舗一覧の検索（店舗ID 999999）で確かめた");
  });
});
defineOneShopSeed("S-M10-15-BASE-007", "007", 更新前());
defineOneShopSeed("S-M10-15-BASE-009", "009", 更新前());
defineOneShopSeed("S-M10-15-BASE-010", "010", 更新前());
defineOneShopSeed("S-M10-15-BASE-011", "011", 更新前());
defineOneShopSeed("S-M10-15-BASE-013", "013", 更新前());
defineOneShopSeed("S-M10-15-BASE-014", "014", 更新前());
defineOneShopSeed("S-M10-15-BASE-015", "015", 更新前());
defineOneShopSeed("S-M10-15-CLOSED-016", "016", 更新前({
  会社名: "閉店確認会社", "会社名(カナ)": "ヘイテンカクニンガイシャ", 店名: "閉店店舗", "店名(カナ)": "ヘイテンテンポ", "店名(英語表記)": "Closed Shop",
  支店URL: "closed", "店名略称（3文字）": "CLS", ショップ名略称: "閉店確認支店", 表示順: "22", 公開: "非公開", 開店: "閉店",
}));
defineOneShopSeed("S-M10-15-BASE-020", "020", 更新前({ ショップカラー: "#112233" }));
const 九項目 = { "Google map埋め込みURL": "https://maps.example.com/before", 店舗営業時間: "十時から二十時", "店舗営業時間(英語表記)": "ten to twenty" };
defineOneShopSeed("S-M10-15-BASE-023", "023", 更新前(九項目));
defineOneShopSeed("S-M10-15-BASE-024", "024", 更新前(九項目));
defineOneShopSeed("S-M10-15-BASE-025", "025", 更新前());
defineOneShopSeed("S-M10-15-BASE-026", "026", 更新前());
defineOneShopSeed("S-M10-15-BASE-027", "027", 更新前());
defineOneShopSeed("S-M10-15-BASE-029", "029", 更新前());
defineOneShopSeed("S-M10-15-BASE-031", "031", 更新前());
defineOneShopSeed("S-M10-15-BASE-032", "032", 更新前());
defineOneShopSeed("S-M10-15-BASE-033", "033", 更新前({ スマレジ店舗ID: "1234567890", スマレジ店舗コード: "OLD" }));
defineOneShopSeed("S-M10-15-BASE-034", "034", 更新前({ スマレジ店舗ID: "1234567890", スマレジ店舗コード: "OLD" }));
const 閾値 = { 高額商品閾値1: "100000", 高額商品閾値2: "200000", 高額商品閾値3: "300000", ピッキングリスト分割しきい値価格: "10000", スタック用紙高額商品しきい値価格: "50000" };
defineOneShopSeed("S-M10-15-BASE-035", "035", 更新前(閾値));
defineOneShopSeed("S-M10-15-BASE-036", "036", 更新前(閾値));
defineOneShopSeed("S-M10-15-BASE-037", "037", 更新前({ 取り扱い商品説明文: "更新前取扱商品", 店舗からのメッセージ: "更新前メッセージ" }));
defineOneShopSeed("S-M10-15-BASE-038", "038", 更新前({ 取り扱い商品説明文: "更新前取扱商品", 店舗からのメッセージ: "更新前メッセージ" }));
defineOneShopSeed("S-M10-15-BASE-039", "039", 更新前());
defineOneShopSeed("S-M10-15-BASE-041", "041", 更新前());
defineOneShopSeed("S-M10-15-BASE-043", "043", 更新前({ 店頭用アカウントIPアドレス: "192.0.2.20" }));
defineOneShopSeed("S-M10-15-BASE-045", "045", 更新前());
defineOneShopSeed("S-M10-15-BASE-046", "046", 更新前({ スマレジ店舗コード: "OLD" }));
defineOneShopSeed("S-M10-15-BASE-047", "047", 更新前({ スマレジ店舗ID: "1234567890", ...閾値 }));
defineOneShopSeed("S-M10-15-BASE-048", "048", 更新前());
const 重複の二店 = (n: string) => (): 店舗シード[] => [
  { slot: "P1", 呼び名: `〔店舗ID-M1015-${n}A〕`, 指定: { 値: 更新前() } },
  { slot: "P2", 呼び名: `〔店舗ID-M1015-${n}B〕`, 指定: { 値: 更新前({ 店名: "重複確認店舗", "店名略称（3文字）": "ABC", ショップ名略称: "東京店", 表示順: "21", 支店URL: "m1015poolb" }) } },
];
defineTenantSeed("S-M10-15-BASE-050", M1015_ADMIN, 基本, 重複の二店("050"));
defineTenantSeed("S-M10-15-BASE-051", M1015_ADMIN, 基本, 重複の二店("051"));
defineOneShopSeed("S-M10-15-BASE-052", "052", 更新前());
const 旧アイコン = () => ({ アイコン: 画像ファイル["old-icon.png"]() });
defineOneShopSeed("S-M10-15-BASE-053", "053", 更新前(), 旧アイコン());
defineOneShopSeed("S-M10-15-BASE-054", "054", 更新前(), 旧アイコン());
defineOneShopSeed("S-M10-15-BASE-058", "058", 更新前(), 旧アイコン());
defineOneShopSeed("S-M10-15-BASE-059", "059", 更新前(), 旧アイコン());
defineOneShopSeed("S-M10-15-BASE-065", "065", 更新前());
defineOneShopSeed("S-M10-15-BASE-067", "067", 更新前());
defineOneShopSeed("S-M10-15-BASE-070", "070", 更新前());
defineOneShopSeed("S-M10-15-BASE-095", "095", 更新前({
  会社名: "登録会社M1015-095-A", 店名: "画像未設定店舗M1015-095-A", "店名略称（3文字）": "Q95", 表示順: "095", "会社名(カナ)": "トウロクガイシャ",
  "店名(カナ)": "トウロクテンポ", "店名(英語表記)": "Register Shop", 支店URL: "m1015095shop", 送信元メールアドレス: "m1015-095-from@example.com",
  返信先メールアドレス: "m1015-095-reply@example.com", 送信エラー通知メールアドレス: "m1015-095-error@example.com", 問い合わせ専用メールアドレス: "m1015-095-contact@example.com",
  ショップ名略称: "登録略称", ショップカラー: "#112233",
}), { アイコン: "なし" });
defineOneShopSeed("S-M10-15-BASE-096", "096", 更新前({
  会社名: "登録会社M1015-096-A", 店名: "採番更新店舗M1015-096-A", "店名略称（3文字）": "Q96", 表示順: "096", "会社名(カナ)": "トウロクガイシャ",
  "店名(カナ)": "トウロクテンポ", "店名(英語表記)": "Register Shop", 支店URL: "m1015096shop", 送信元メールアドレス: "m1015-096-from@example.com",
  返信先メールアドレス: "m1015-096-reply@example.com", 送信エラー通知メールアドレス: "m1015-096-error@example.com", 問い合わせ専用メールアドレス: "m1015-096-contact@example.com",
  ショップ名略称: "登録略称", ショップカラー: "#112233",
}));
defineOneShopSeed("S-M10-15-CBBASE-098", "098", 更新前({ 店名: "画像未設定店舗", "店名略称（3文字）": "C98", 表示順: "15098" }), { アイコン: "なし" });

// 連携確認（お問い合わせの店舗選択・在庫検索一覧の店舗の選択肢）
const defineLinkSeed = (seedId: string, n: string, 店名: string, 略称: string, url: string, 公開: string, 開店: string) =>
  defineTenantSeed(seedId, M1015_L_ADMIN, ["S-M10-15-L-ADM"], () => [{
    slot: "P1", 呼び名: `〔店舗ID-M1015-${n}〕`, 指定: { 値: {
      店名, "店名略称（3文字）": 略称, 支店URL: url, 公開, 開店, 会社名: "連携会社", "会社名(カナ)": "レンケイガイシャ", "店名(カナ)": "レンケイテンポ",
      "店名(英語表記)": "Link Shop", 店舗種別: "支店", 都道府県: "東京都", 住所: "千代田区一丁目", 電話番号: "0312345678",
      送信元メールアドレス: "from-l@example.com", 返信先メールアドレス: "reply-l@example.com", 送信エラー通知メールアドレス: "error-l@example.com",
      問い合わせ専用メールアドレス: "contact-l@example.com", ショップカラー: "#112233", ショップ名略称: "連携略称", 表示順: "910",
    } },
  }]);
defineLinkSeed("S-M10-15-L-SHOP-072", "072", "連携店L001M1015n072", "L01", "linkl001", "非公開", "開店");
defineLinkSeed("S-M10-15-L-SHOP-073", "073", "連携店L002M1015n073", "L02", "linkl002", "公開", "開店");
defineLinkSeed("S-M10-15-L-SHOP-074", "074", "連携店L003M1015n074", "L03", "linkl003", "公開", "開店");
defineLinkSeed("S-M10-15-L-SHOP-075", "075", "連携店L004M1015n075", "L04", "linkl004", "公開", "閉店");
defineLinkSeed("S-M10-15-L-SHOP-076", "076", "連携店L005", "L05", "linkl005", "公開", "開店");

// 売上集計の検索項目・席数・X公式アカウントURL
const defineGfSeed = (seedId: string, n: string, 店名: string, v: 店舗の値, account = M1015_ADMIN, needs = 基本) => defineTenantSeed(seedId, account, needs, () => [{
  slot: "P1", 呼び名: `〔店舗ID-M1015-${n}〕`, 指定: { 値: {
    会社名: `更新前会社M1015-${n}-A`, 店名, "店名略称（3文字）": `G${n.slice(1)}`, 表示順: String(Number(n)), 開店: "開店",
    "会社名(カナ)": "コウシンマエガイシャ", "店名(カナ)": "コウシンマエテンポ", "店名(英語表記)": "Before Shop", 支店URL: `m1015${n}shop`,
    都道府県: "東京都", 住所: "千代田区一丁目", 電話番号: "0312345678", 送信元メールアドレス: `m1015-${n}-from@example.com`,
    返信先メールアドレス: `m1015-${n}-reply@example.com`, 送信エラー通知メールアドレス: `m1015-${n}-error@example.com`,
    問い合わせ専用メールアドレス: `m1015-${n}-contact@example.com`, ショップ名略称: "更新前略称", ショップカラー: "#112233", ...v,
  } },
}]);
const 集計 = ["S-M10-15-GFAGG"];
defineGfSeed("S-M10-15-GFBASE-078", "078", "売上集計保存店舗M1015-078-A", { 公開: "公開", 売上集計の検索項目: "表示しない" });
defineGfSeed("S-M10-15-GFBASE-079", "079", "集計反映店舗M1015-079-A", { 公開: "公開", 売上集計の検索項目: "表示しない" }, M1015_AGG, 集計);
defineGfSeed("S-M10-15-GFBASE-080", "080", "集計非表示店舗M1015-080-A", { 公開: "公開", 売上集計の検索項目: "表示する" }, M1015_AGG, 集計);
defineGfSeed("S-M10-15-GFBASE-081", "081", "席数確認店舗M1015-081-A", { 席数: "" });
defineGfSeed("S-M10-15-GFBASE-082", "082", "X確認店舗M1015-082-A", { X公式アカウントURL: "https://x.example.com/M1015-082-BEFORE" });
defineGfSeed("S-M10-15-GFBASE-089", "089", "月別集計反映店舗M1015-089-A", { 公開: "公開", 売上集計の検索項目: "表示しない" }, M1015_AGG, 集計);
defineGfSeed("S-M10-15-GFBASE-090", "090", "月別集計非表示店舗M1015-090-A", { 公開: "公開", 売上集計の検索項目: "表示する" }, M1015_AGG, 集計);
defineGfSeed("S-M10-15-GFBASE-097", "097", "閉店集計店舗M1015-097-A", {
  会社名: "登録会社M1015-097-A", "店名略称（3文字）": "Q97", 公開: "公開", 売上集計の検索項目: "表示する", "会社名(カナ)": "トウロクガイシャ",
  "店名(カナ)": "トウロクテンポ", "店名(英語表記)": "Register Shop", ショップ名略称: "登録略称",
}, M1015_AGG, 集計);

// 支店サイトとの連携（QJ）。シード表は店舗IDを控えない
const defineQjSeed = (seedId: string, n: string, v: 店舗の値, extra: Partial<整える指定> = {}) => defineTenantSeed(seedId, M1015_QJ_ADMIN, ["S-M10-15-QJ-ADM"], () => [{
  slot: "P1", 指定: { 値: {
    店名: `M1015QJ00${n.slice(2)}連携支店`, "店名略称（3文字）": `Q0${n.slice(2)}`, 支店URL: `qjbr00${n.slice(2)}`, 店舗種別: "支店", 開店: "開店", 公開: "公開",
    会社名: "連携会社", "会社名(カナ)": "レンケイガイシャ", "店名(カナ)": "レンケイテンポ", "店名(英語表記)": "Link Shop", 都道府県: "東京都", 住所: "千代田区一丁目",
    送信元メールアドレス: "from-qj@example.com", 返信先メールアドレス: "reply-qj@example.com", 送信エラー通知メールアドレス: "error-qj@example.com",
    問い合わせ専用メールアドレス: "contact-qj@example.com", ショップカラー: "#112233", ショップ名略称: `QJ略称00${n.slice(2)}`, 表示順: `92${n.slice(2)}`, ...v,
  }, ...extra },
}]);
defineQjSeed("S-M10-15-QJ-SHOP-091", "091", { 電話番号: "0312345601", 店舗営業時間: "10:00-20:00" }, { 晴れる屋くん: 画像ファイル["qj001-before.png"]() });
defineQjSeed("S-M10-15-QJ-SHOP-092", "092", { 電話番号: "0312345602", 店舗営業時間: "9:00-19:00" });
defineQjSeed("S-M10-15-QJ-SHOP-093", "093", { 電話番号: "0312345603" });
defineQjSeed("S-M10-15-QJ-SHOP-094", "094", { 電話番号: "0312345604", X公式アカウントURL: "https://x.com/hareruyaqj004a" });
