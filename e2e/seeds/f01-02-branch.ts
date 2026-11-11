/**
 * F01-02 支店ECTOP のシード（支店・支店トップページ・会員だけで足りるもの）。正本: cases/F01-02_seed_data.tsv
 *
 * シード作成時の読み替え（依頼者 2026-11-10「既存データ または 自分で画面から作ったデータ」に読み替えてよい）:
 * - 支店識別子（例「f0102-001」）はハイフン入りで店舗登録の支店URL欄に入らず、シード表は DB で設定するとしている。
 *   ケースは識別子の書式を確かめないので、ほかと同じく半角英数字の支店URL（f0102c<番号><実行の印>）で画面から登録する。
 * - 店名（「テスト支店A」など）は、同じ実行の中でほかのケースの支店と重ならないように「F0102-<番号>支店-<実行の印>」にする。
 * - 会員はフロントの会員登録で作り、本登録のメールの代わりに管理画面で本会員にする（開発環境にメールの受信箱が無い）。
 *   メールアドレスの前半には実行の印を付ける。
 * - 顧客グループ「支店店内アカウント」は共有のマスタなので足さない。既にあるもの（支店店内注文専用アカウントの印つき）を使い、無ければ止める。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { タグを用意する, 支店トップページを設定する, 支店トップページのレイアウトのブロック } from "../pages/admin/f01_02_setup";
import { imageFile } from "../pages/admin/f03_06_products";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { M08CustomerGroupPage } from "../pages/admin/m08_customer_group";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { 支店名 } from "./f01-02";
import { 支店を用意する } from "./f01-02-tile";
import { markedMail } from "./f06-member";
import { Browser } from "@playwright/test";

const ピックアップだけ = [{ 属性: "ピックアップ商品" as const }, { 属性: "ピックアップ商品" as const }, { 属性: "ピックアップ商品" as const }, { 属性: "ピックアップ商品" as const }];
const 支店IDを控える = (notes: { set(k: string, v: string): void }, n: string, id: string) => notes.set(`〔支店ID-F0102-${n}〕`, id);
const 読み替えの注記 = (seedId: string, n: string) => reportSeedIssue(seedId,
  `シード作成時の問題: 支店識別子（ハイフン入り）はDBで設定する定めだが、半角英数字の支店URLで画面から登録した（ケースは識別子の書式を確かめない）。店名は「${支店名(n)}」`);

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

/** 034 のバナーリンクタグ（同じ実行の中で、シードが作ったタグのID） */
const バナーリンクタグID = new Map<string, string>();
export function バナーリンクタグのID(n: string): string {
  const id = バナーリンクタグID.get(n);
  if (!id) throw new Error(`支店 ${n} のバナーリンクタグはまだ作っていない`);
  return id;
}
export const バナーリンクタグの名前 = (n: string): string => rc(`支店テストバナー-${n}`);

defineSeed("S-F01-02-CASE-034", async ({ browser, notes, seed }) => {
  const tagId = await withAdminSession(browser, SETUP_ADMIN, (page) => タグを用意する(page, バナーリンクタグの名前("034"), seed.シードID));
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

/** 顧客グループ管理で、既にある「支店店内アカウント」（支店店内注文専用アカウントの印つき）の顧客グループIDを読む。無ければ止める（共有のマスタに足さない） */
async function 支店店内アカウントのID(browser: Browser): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const g = new M08CustomerGroupPage(page);
    await g.open();
    const n = await g.rowByName("支店店内アカウント").count();
    if (n !== 1) throw new Error(`顧客グループ「支店店内アカウント」が顧客グループ管理に ${n} 件（1件のはず）。共有のマスタなので足さずに止める（判断待ち）`);
    const id = await g.名称リンクを押してIDを読む("支店店内アカウント");
    if (!(await g.branchFront.isChecked())) throw new Error(`顧客グループ「支店店内アカウント」（ID ${id}）に支店店内注文専用アカウントの印が無い。共有のマスタなので書き換えずに止める`);
    return id;
  });
}

async function 会員つきの支店(browser: Browser, seedId: string, n: string, notes: { set(k: string, v: string): void }, 店内: boolean, トップページ: boolean): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  if (トップページ) await 支店トップページつきの支店(browser, seedId, n, notes);
  else {
    支店IDを控える(notes, n, await withAdminSession(browser, SETUP_ADMIN, (page) => 支店を用意する(page, n, issue)));
    読み替えの注記(seedId, n);
  }
  const groupId = 店内 ? await 支店店内アカウントのID(browser) : "";
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
      if (now === "支店店内アカウント") throw new Error(`会員ID ${id} の顧客グループが「支店店内アカウント」になっている（登録直後の既定の値）`);
      issue(`会員 ${m.メール}（会員ID ${id}）の顧客グループは登録直後のまま「${now || "未選択"}」（支店店内アカウント以外）`);
    }
  });
  issue("シード作成時の問題: 本登録のメールの代わりに管理画面で本会員にした（開発環境にメールの受信箱が無い）。メールアドレスの前半に実行の印を付けた");
}

defineSeed("S-F01-02-CASE-001", async ({ browser, notes, seed }) => { await 会員つきの支店(browser, seed.シードID, "001", notes, true, true); });
defineSeed("S-F01-02-CASE-002", async ({ browser, notes, seed }) => { await 会員つきの支店(browser, seed.シードID, "002", notes, false, true); });
defineSeed("S-F01-02-QRHOME-082", async ({ browser, notes, seed }) => { await 会員つきの支店(browser, seed.シードID, "082", notes, true, false); });
