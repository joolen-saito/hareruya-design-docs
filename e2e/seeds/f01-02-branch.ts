/**
 * F01-02 支店ECTOP のシード（支店・支店トップページ・会員だけで足りるもの）。正本: cases/F01-02_seed_data.tsv
 *
 * シード作成時の読み替え（依頼者 2026-11-10「既存データ または 自分で画面から作ったデータ」に読み替えてよい）:
 * - 支店識別子（例「f0102-001」）はハイフン入りで店舗登録の支店URL欄に入らず、シード表は DB で設定するとしている。
 *   ケースは識別子の書式を確かめないので、半角英数字の支店URLの試験支店（seeds/f01-02.ts）を使う。
 * - 店名（「テスト支店A」など）は、全部のケースで同じ試験支店「F0102試験支店-E2E」（006 だけは非公開の支店「F0102非公開支店-E2E」）を使い回す
 *   （依頼者の指示 2026-11-12「毎回作らずに1個でいけるやつは使い回す」）。ケースの初めに、前のケース・前の回の商品を外してそろえる。
 * - 会員はフロントの会員登録で作り、本登録のメールの代わりに管理画面で本会員にする（開発環境にメールの受信箱が無い）。
 *   メールアドレスの前半には実行の印を付ける。
 * - 顧客グループ「支店店内アカウント」は共有のマスタなので足さない。既にあるもの（支店店内注文専用アカウントの印つき）を使い、無ければ止める。
 */
import { SETUP_ADMIN } from "../config/env";
import { rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { 支店トップページを設定する, 支店トップページのレイアウトのブロック } from "../pages/admin/f01_02_setup";
import { 決まったタグを用意する } from "../pages/admin/f01_02_branch_reset";
import { imageFile } from "../pages/admin/f03_06_products";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { 接続元IPを読む, 店頭用アカウントIPアドレスを入れて登録する, 店頭用アカウントIPアドレスを読む } from "../pages/admin/f06_26_setup";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { 支店名 } from "./f01-02";
import { 支店を用意する } from "./f01-02-tile";
import { markedMail } from "./f06-member";
import { Browser } from "@playwright/test";

const ピックアップだけ = [{ 属性: "ピックアップ商品" as const }, { 属性: "ピックアップ商品" as const }, { 属性: "ピックアップ商品" as const }, { 属性: "ピックアップ商品" as const }];
const 支店IDを控える = (notes: { set(k: string, v: string): void }, n: string, id: string) => notes.set(`〔支店ID-F0102-${n}〕`, id);
const 読み替えの注記 = (seedId: string, n: string) => reportSeedIssue(seedId,
  `シード作成時の問題: 支店識別子（ハイフン入り）はDBで設定する定めだが、半角英数字の支店URLの支店を使った（ケースは識別子の書式を確かめない）。支店はケースごとに作らず、決まった名前の「${支店名(n)}」を使い回した`);

/** 支店だけ（公開・非公開・X公式アカウントURL） */
for (const [seedId, n, 他] of [
  ["S-F01-02-CASE-005", "005", {}],
  ["S-F01-02-CASE-006", "006", { 公開: "非公開" }],
  ["S-F01-02-CASE-067", "067", { X公式アカウントURL: "https://x.com/hareruya_test_branch-067" }],
  ["S-F01-02-RECRUITPC-078", "078", {}],
  ["S-F01-02-RECRUITSP-079", "079", {}],
  ["S-F01-02-RECRUITLINK-080", "080", {}],
] as const) {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    支店IDを控える(notes, n, await withAdminSession(browser, SETUP_ADMIN, (page) => 支店を用意する(page, n, issue, 他)));
    読み替えの注記(seed.シードID, n);
  });
}

/** 支店と、支店固有のトップページ設定（タイル4行はピックアップ商品、バナー画像は任意） */
async function 支店トップページつきの支店(browser: Browser, seedId: string, n: string, notes: { set(k: string, v: string): void }, v: { 画像?: { name: string; mimeType: string; buffer: Buffer }; バナーリンクタグ?: string } = {}): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  支店IDを控える(notes, n, await withAdminSession(browser, SETUP_ADMIN, (page) => 支店を用意する(page, n, issue)));
  await withAdminSession(browser, SETUP_ADMIN, (page) => 支店トップページを設定する(page, 支店名(n), { ...v, タイル: ピックアップだけ }, seedId, issue));
  読み替えの注記(seedId, n);
}

defineSeed("S-F01-02-QRGUEST-088", async ({ browser, notes, seed }) => { await 支店トップページつきの支店(browser, seed.シードID, "088", notes); });

/** 004: 支店トップページのレイアウト（共有の設定）は書き換えない。商品人気ランキングのブロックが置かれていないことを確かめて使い、置かれていれば止める */
defineSeed("S-F01-02-CASE-004", async ({ browser, notes, seed }) => {
  const r = await withAdminSession(browser, SETUP_ADMIN, (page) => 支店トップページのレイアウトのブロック(page, seed.シードID));
  const hit = r.ブロック.filter((b) => b === "ランキング" || /人気.*ランキング|商品ランキング/.test(b));
  if (hit.length) throw new Error(`支店トップページのレイアウト ${r.レイアウト} に「${hit.join("、")}」のブロックが置かれている。共有の設定なので書き換えずに止める`);
  reportSeedIssue(seed.シードID, `支店トップページのレイアウト ${r.レイアウト} は共有の設定なので登録せず、商品人気ランキング（ブロック名「ランキング」）が置かれていないことを画面で確かめた（置かれているブロック: ${r.ブロック.join("、")}）`);
  await 支店トップページつきの支店(browser, seed.シードID, "004", notes);
});

// ---- バナー（033・034） ----

/** 033 のバナー画像（名前は正本のファイル名、中身は 32x32 の PNG。手元に WebP を作る道具が無いため） */
export const バナー画像 = (n: string): { name: string; mimeType: string; buffer: Buffer } => ({ name: `branch-banner-${n}.webp`, mimeType: "image/png", buffer: imageFile(`branch-banner-${n}`).buffer });

defineSeed("S-F01-02-CASE-033", async ({ browser, notes, seed }) => {
  await 支店トップページつきの支店(browser, seed.シードID, "033", notes, { 画像: バナー画像("033") });
  reportSeedIssue(seed.シードID, "シード作成時の問題: バナー名・リンクURLは支店トップページ管理に入力欄が無くDBで設定する定めだが、ケースは画像だけを確かめるので入れていない。画像「branch-banner-033.webp」は中身が 32x32 の PNG（WebP を作る道具が無い）");
  notes.set("〔トップページ設定ID-F0102-033〕", "支店トップページ管理で、この支店に登録した設定（番号は画面に出ない）");
});

/** 034 のバナーリンクタグ（同じ実行の中で、シードが用意したタグのID） */
const バナーリンクタグID = new Map<string, string>();
export function バナーリンクタグのID(n: string): string {
  const id = バナーリンクタグID.get(n);
  if (!id) throw new Error(`支店 ${n} のバナーリンクタグはまだ作っていない`);
  return id;
}
/** バナーリンクタグの名称（決まった印。タグは共有のマスタなので、実行ごとに足さず使い回す） */
export const バナーリンクタグの名前 = (n: string): string => rcFixed(`支店テストバナー-${n}`);

defineSeed("S-F01-02-CASE-034", async ({ browser, notes, seed }) => {
  const tagId = await withAdminSession(browser, SETUP_ADMIN, (page) => 決まったタグを用意する(page, バナーリンクタグの名前("034"), seed.シードID, (m) => reportSeedIssue(seed.シードID, m)));
  バナーリンクタグID.set("034", tagId);
  await 支店トップページつきの支店(browser, seed.シードID, "034", notes, { 画像: バナー画像("034"), バナーリンクタグ: バナーリンクタグの名前("034") });
  reportSeedIssue(seed.シードID, `シード作成時の問題: バナーのリンクURL（https://replace-dev.hareruyamtg.com:8443/f0102c034/banner-034）は支店トップページ管理に入力欄が無くDBで設定する定め。画面で付けられるバナーリンクタグに、タグ管理で作ったタグ「${バナーリンクタグの名前("034")}」（タグID ${tagId}）を選び、その商品一覧（タグ）のURLを「設定したURL」と読み替えた`);
  notes.set("〔トップページ設定ID-F0102-034〕", "支店トップページ管理で、この支店に登録した設定（番号は画面に出ない）");
});

// ---- 会員（001・002・082） ----

export type 試験会員 = { メール: string; パスワード: string };
export const 会員: Record<string, 試験会員> = {
  "001": { メール: markedMail("instore-f0102-001"), パスワード: "F0102Store001!" },
  "002": { メール: markedMail("general-f0102-002"), パスワード: "F0102General002!" },
  "082": { メール: markedMail("instore-f0102-082"), パスワード: "F0102Store082!" },
};

/**
 * 正本の顧客グループ「支店店内アカウント」に当たる名前。アプリの初期データの名前は「支店用店内アカウント」（支店店内注文専用アカウントの印つき）で、
 * 開発環境には正本の名前の顧客グループが無い（2026-11-11 F01-02-082 が0件で止まっていた）。正本の名前が無ければ初期データの名前で読み替える。
 */
const 支店店内アカウントの名前 = ["支店店内アカウント", "支店用店内アカウント"];

/** 顧客グループ管理で、既にある支店店内アカウント（支店店内注文専用アカウントの印つき）の顧客グループIDを読む。無ければ止める（共有のマスタに足さない） */
async function 支店店内アカウントのID(browser: Browser, issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const g = new M08CustomerGroupPage(page);
    await g.open();
    const counts: string[] = [];
    for (const name of 支店店内アカウントの名前) {
      const n = await g.rowByName(name).count();
      counts.push(`「${name}」${n}件`);
      if (n === 0) continue;
      if (n !== 1) throw new Error(`顧客グループ「${name}」が顧客グループ管理に ${n} 件（1件のはず）。共有のマスタなので足さずに止める（判断待ち）`);
      const id = await g.名称リンクを押してIDを読む(name);
      if (!(await g.branchFront.isChecked())) throw new Error(`顧客グループ「${name}」（ID ${id}）に支店店内注文専用アカウントの印が無い。共有のマスタなので書き換えずに止める`);
      if (name !== 支店店内アカウントの名前[0]) issue(`正本の顧客グループ「支店店内アカウント」は開発環境に無いので、アプリの初期データの「${name}」（ID ${id}・支店店内注文専用アカウントの印つき）に読み替えた`);
      return id;
    }
    throw new Error(`顧客グループ管理に支店店内アカウントが無い（${counts.join("・")}）。共有のマスタなので足さずに止める（判断待ち）`);
  });
}

/**
 * 店内アカウント・支店店内アカウントの会員は、店舗の「店頭用アカウントIPアドレス」に接続元のIPが無いとログインのあとログアウトへ移される。
 * 正本は店内PCからの利用が前提なので、この端末の接続元IP（管理画面のログイン履歴で読む）を、E2E専用の試験支店の店頭用アカウントIPアドレスへ足す（既にあれば足さない）。
 */
async function 支店の店頭用IPに接続元を入れる(browser: Browser, 支店ID: string, issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const { IP } = await 接続元IPを読む(page, SETUP_ADMIN.loginId);
    const 今 = await 店頭用アカウントIPアドレスを読む(page, 支店ID);
    const 一覧 = 今.split(",").map((x) => x.trim()).filter(Boolean);
    if (一覧.includes(IP)) { issue(`支店（店舗ID ${支店ID}）の店頭用アカウントIPアドレスには、この端末の接続元IP「${IP}」が既にあった`); return; }
    await 店頭用アカウントIPアドレスを入れて登録する(page, 支店ID, [...一覧, IP].join(","));
    issue(`正本の「店内PCからの利用」の前提として、E2E専用の試験支店（店舗ID ${支店ID}）の店頭用アカウントIPアドレスに、この端末の接続元IP「${IP}」を足した（管理画面のログイン履歴で読んだ値。元の値「${今}」）。公開側も同じ経路で接続する前提`);
  });
}

async function 会員つきの支店(browser: Browser, seedId: string, n: string, notes: { set(k: string, v: string): void; get(k: string): string }, 店内: boolean, トップページ: boolean): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  if (トップページ) await 支店トップページつきの支店(browser, seedId, n, notes);
  else {
    支店IDを控える(notes, n, await withAdminSession(browser, SETUP_ADMIN, (page) => 支店を用意する(page, n, issue)));
    読み替えの注記(seedId, n);
  }
  const groupId = 店内 ? await 支店店内アカウントのID(browser, issue) : "";
  if (店内) await 支店の店頭用IPに接続元を入れる(browser, notes.get(`〔支店ID-F0102-${n}〕`), issue);
  const m = 会員[n];
  const id = await 会員を登録して本会員にする(browser, { 姓: "F0102", 名: `会員${n}`, セイ: "シケン", メイ: "カイイン", メール: m.メール, パスワード: m.パスワード }, issue);
  notes.set(`〔会員ID-F0102-${n}〕`, id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const ed = new M08CustomerEditPage(page);
    const s = await ed.open(id);
    if (s !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面が開けない（応答 ${s}）`);
    if (店内) {
      await ed.値で選ぶ("Player][CustomerGroup", groupId);
      await ed.登録する();
      if (!(await ed.成功メッセージ())) throw new Error(`会員ID ${id} の顧客グループの保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
      issue(`会員 ${m.メール}（会員ID ${id}）の顧客グループを既存の「支店店内アカウント」（ID ${groupId}）にして登録した`);
    } else {
      const now = await ed.選択中("Player][CustomerGroup");
      if (支店店内アカウントの名前.includes(now)) throw new Error(`会員ID ${id} の顧客グループが「支店店内アカウント」になっている（登録直後の既定の値）`);
      issue(`会員 ${m.メール}（会員ID ${id}）の顧客グループは登録直後のまま「${now || "未選択"}」（支店店内アカウント以外）`);
    }
  });
  issue("シード作成時の問題: 本登録のメールの代わりに管理画面で本会員にした（開発環境にメールの受信箱が無い）。メールアドレスの前半に実行の印を付けた");
}

defineSeed("S-F01-02-CASE-001", async ({ browser, notes, seed }) => { await 会員つきの支店(browser, seed.シードID, "001", notes, true, true); });
defineSeed("S-F01-02-CASE-002", async ({ browser, notes, seed }) => { await 会員つきの支店(browser, seed.シードID, "002", notes, false, true); });
defineSeed("S-F01-02-QRHOME-082", async ({ browser, notes, seed }) => { await 会員つきの支店(browser, seed.シードID, "082", notes, true, false); });
