// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * F02-02 スマホ版ナビゲーションの画面シード。正本: cases/F02-02_seed_data.tsv
 *
 * 作るシード:
 * - S-F02-02-ENV: 共通表示環境。E2E は本店の基本設定・ページ管理・ユニサーチの接続設定を書き換えず、本店の日本語版・英語版の ECTOP が開けることを確かめるだけ
 *   （共有の開発環境では、ある設定をそのまま使う。config/parallel_ok_seeds.tsv）。
 * - 商品・カート（CART-009・010・065・066）: グッズ商品CSV登録 → 在庫10（登録者とは別の管理者が承認）→ ブラウザ保存状態の無いブラウザで、ログインせずに
 *   商品詳細から数量1で「カートに追加」。066 はカート画面で削除して空にする。そのブラウザの状態（クッキー）をケースのブラウザへ移して使う。
 * - 会員（MEMBER-011・012・015・017・021・063・067・068・069、CBMEMBER-070）: フロントの会員登録 → 管理画面で本会員 →（ポイント500）→（お気に入り）→ ログインの確かめ。
 * - お気に入りの商品（PRODUCTS-011・012・067）: グッズ商品CSV登録 → 在庫10。
 *
 * 決め打ちの識別の値（会員のメールアドレスの前半・商品コード・商品名）には、実行ごとの印を付ける（lib/run_marker.ts。依頼者決定 2026-10-28）。パスワードには付けない。
 *
 * 正本の外で補ったこと・代えたこと（ケースの注記にも出す）:
 * - 「会員識別子 F0202-MEMBER-… は画面で指定できないためDBへ直接設定する」は行わない。ケースの手順・期待結果は会員識別子を使わない（PM 方針: DB の作業は画面で代えられる範囲で代え、条件付きとする）。
 * - 「ポイント残高が0であることを確かめてから…500であることを確かめる」は、付与のあとログインして画面上部の保有ポイントが500であることで確かめる。
 * - ブラウザ識別子は画面に出ないので、カートへ入れたブラウザのセッションのクッキーの名前で控える。ゲストカートIDも画面に出ないので「画面に出ない」と控える。
 *
 * 作らないシード（ケースを実装していない）: カードセット（002・003・004・005〜008・062）・カテゴリ（036〜039）・ユニサーチ（004・005・007・008・062）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar } from "../lib/session";
import {
  お気に入りに追加する, カートのブラウザ, グッズ商品を登録する, ゲストカートを作る, ポイントを付ける, ログインできることを確かめる, 会員を登録して本会員にする, 本店の在庫を入れる,
} from "../pages/admin/f02_02_setup";

// ---- 実行中に持ち回す値（ケースが使う） ----

/** カートのシードが作ったブラウザの状態（シードID → クッキーなど）。ケースは自分のブラウザへクッキーを移す */
export const カートのブラウザたち = new Map<string, カートのブラウザ>();

export type 試験会員 = { メール: string; パスワード: string };
/** 会員のシードの値（メールアドレスの前半に実行の印を付ける） */
export const 会員: Record<string, 試験会員> = {
  "011": { メール: `${rc("f0202_member-011")}@example.test`, パスワード: "Passw0rd-F0202-011!" },
  "012": { メール: `${rc("f0202_member-012")}@example.test`, パスワード: "Passw0rd-F0202-012!" },
  "015": { メール: `${rc("f0202_member-015")}@example.test`, パスワード: "Passw0rd-F0202-015!" },
  "017": { メール: `${rc("f0202_member-017")}@example.test`, パスワード: "Passw0rd-F0202-017!" },
  "021": { メール: `${rc("f0202_member-021")}@example.test`, パスワード: "Passw0rd-F0202-021!" },
  "063": { メール: `${rc("f0202_member-063")}@example.test`, パスワード: "Passw0rd-F0202-063!" },
  "067": { メール: `${rc("f0202_member-067")}@example.test`, パスワード: "Passw0rd-F0202067" },
  "068": { メール: `${rc("f0202_member-068")}@example.test`, パスワード: "Passw0rd-F0202068" },
  "069": { メール: `${rc("f0202_member-069")}@example.test`, パスワード: "Passw0rd-F0202069" },
  "070": { メール: `${rc("cbf0202-070")}@example.test`, パスワード: "Passw0rd-CBF0202070" },
};

/** 会員識別子をDBへ直接設定する作業を行わないことの説明（ケースの注記にも使う） */
export const 会員識別子の注記 = (n: string): string =>
  `シード S-F02-02-MEMBER-${n} の「会員識別子 F0202-MEMBER-${n} は画面で指定できないためDBへ直接設定する」は行っていない。ケースの手順・期待結果は会員識別子を使わないため、画面で作れる範囲（会員登録・本会員・ポイント・お気に入り）で代えた（条件付き）`;

// ---- 呼び名の控え ----

/** シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから控える。シード表が定めた呼び名だけを控え、足りなければ落とす */
function 控える(seedId: string, notes: Notes, 値: Record<string, string>): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (notes.has(label)) continue; // 先に作ったシード（needs）が控えたもの
    const v = 値[label];
    if (v === undefined) throw new Error(`${seedId}: 呼び名 ${label} の値を作っていない`);
    notes.set(label, v);
  }
}

// ---- 商品 ----

type 商品定義 = { 商品コード: string; 商品名?: string };
const 実際の商品 = (d: 商品定義) => ({ 商品コード: rc(d.商品コード), 商品名: rc(d.商品名 ?? d.商品コード) });

async function 商品と在庫を作る(browser: Browser, seedId: string, defs: 商品定義[]): Promise<{ ids: string[]; 名前: string[]; コード: string[] }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const real = defs.map(実際の商品);
  const ids = await グッズ商品を登録する(browser, seedId, real, issue);
  await 本店の在庫を入れる(browser, seedId, real.map((r) => r.商品コード), 10, issue);
  return { ids, 名前: real.map((r) => r.商品名), コード: real.map((r) => r.商品コード) };
}

const 商品の呼び名 = (n: string, ids: string[], 文字: boolean): Record<string, string> =>
  Object.fromEntries(ids.map((id, i) => [`〔商品ID-F0202-${n}${文字 ? String.fromCharCode(65 + i) : ""}〕`, id]));

// ---- カート ----

function defineCartSeed(seedId: string, n: string, defs: 商品定義[], 空にする: boolean): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const made = await 商品と在庫を作る(browser, seedId, defs);
    const cart = await ゲストカートを作る(browser, seedId, made.ids, 空にする ? made.名前[0] : undefined);
    const 期待 = 空にする ? [] : made.名前;
    const 入った = cart.中身.filter((c) => 期待.some((name) => c.商品名.includes(name)) && c.数量 === "1");
    if (cart.中身.length !== 期待.length || 入った.length !== 期待.length) {
      throw new Error(`${seedId}: カート画面の中身が想定と違う（${JSON.stringify(cart.中身)}。期待: ${期待.join("、") || "空"}を数量1ずつ）`);
    }
    カートのブラウザたち.set(seedId, cart);
    reportSeedIssue(seedId, `カート画面で${空にする ? "カートが空になった" : `${期待.length}商品が数量1ずつ入っている`}ことを確かめた。このブラウザの状態（クッキー）をケースのブラウザへ移して使う`);
    控える(seedId, notes, {
      ...商品の呼び名(n, made.ids, true),
      [`〔ブラウザ識別子-F0202-${n}〕`]: cart.識別子,
      [`〔ゲストカートID-F0202-${n}〕`]: "画面に出ない（カートへ入れたブラウザのカート）",
    });
  });
}
defineCartSeed("S-F02-02-CART-009", "009", [{ 商品コード: "F0202-P-009-1" }, { 商品コード: "F0202-P-009-3" }], false);
defineCartSeed("S-F02-02-CART-010", "010", [{ 商品コード: "F0202-P-010-1" }, { 商品コード: "F0202-P-010-3" }], false);
defineCartSeed("S-F02-02-CART-065", "065", [{ 商品コード: "F0202-P-065-1" }], false);
defineCartSeed("S-F02-02-CART-066", "066", [{ 商品コード: "F0202-P-066-1" }], true);

// ---- お気に入りの商品 ----

const お気に入り商品: Record<string, 商品定義[]> = {
  "011": [{ 商品コード: "F0202-P-011-1", 商品名: "火の試験カード-011" }, { 商品コード: "F0202-P-011-2", 商品名: "火の別セットカード-011" }],
  "012": [{ 商品コード: "F0202-P-012-1", 商品名: "火の試験カード-012" }, { 商品コード: "F0202-P-012-2", 商品名: "火の別セットカード-012" }],
  "067": [{ 商品コード: "F0202-P-067-1" }],
};
/** お気に入りの商品のシードが作った商品（会員のシードが使う） */
const 作った商品 = new Map<string, { ids: string[]; 名前: string[] }>();
function defineProductSeed(seedId: string, n: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const made = await 商品と在庫を作る(browser, seedId, お気に入り商品[n]);
    作った商品.set(n, made);
    控える(seedId, notes, 商品の呼び名(n, made.ids, true));
  });
}
defineProductSeed("S-F02-02-PRODUCTS-011", "011");
defineProductSeed("S-F02-02-PRODUCTS-012", "012");
defineProductSeed("S-F02-02-PRODUCTS-067", "067");

// ---- 会員 ----

type 会員定義 = { 姓: string; 名: string; ポイント?: number; お気に入り?: string };

function defineMemberSeed(seedId: string, n: string, d: 会員定義, needs: string[] = []): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const m = 会員[n];
    const id = await 会員を登録して本会員にする(browser, { 姓: d.姓, 名: d.名, セイ: "シケン", メイ: "カイイン", メール: m.メール, パスワード: m.パスワード }, issue);
    if (d.ポイント) await ポイントを付ける(browser, id, d.ポイント);
    const 商品 = d.お気に入り ? 作った商品.get(d.お気に入り) : undefined;
    if (d.お気に入り && !商品) throw new Error(`${seedId}: お気に入りにする商品（S-F02-02-PRODUCTS-${d.お気に入り}）を先に作っていない`);
    const 一覧 = await お気に入りに追加する(browser, m.メール, m.パスワード, 商品?.ids ?? [], issue);
    const 期待 = 商品?.名前 ?? [];
    if (一覧.length !== 期待.length || !期待.every((name) => 一覧.some((t) => t.includes(name)))) {
      throw new Error(`${seedId}: お気に入り商品一覧に出た商品が想定と違う（${JSON.stringify(一覧)}。期待: ${期待.join("、") || "0件"}）`);
    }
    issue(`お気に入り商品一覧に${期待.length ? `この${期待.length}件だけ` : "商品が1件も"}出ることを確かめた`);
    const point = await ログインできることを確かめる(browser, m.メール, m.パスワード);
    if (d.ポイント && point.replace(/,/g, "") !== String(d.ポイント)) throw new Error(`${seedId}: ログイン中の画面上部の保有ポイントが ${point}（${d.ポイント} のはず）`);
    issue(`本店のログイン画面でログインできることを確かめた${d.ポイント ? `（画面上部の保有ポイント ${point}）` : ""}`);
    if (seedId.startsWith("S-F02-02-MEMBER-")) issue(会員識別子の注記(n));
    控える(seedId, notes, { [`〔会員レコードID-F0202-${n}〕`]: id });
  });
}
const 標準 = (n: string, extra: Partial<会員定義> = {}): 会員定義 => ({ 姓: "F0202試験", 名: `会員${n}`, ...extra });
defineMemberSeed("S-F02-02-MEMBER-011", "011", 標準("011", { ポイント: 500, お気に入り: "011" }), ["S-F02-02-PRODUCTS-011"]);
defineMemberSeed("S-F02-02-MEMBER-012", "012", 標準("012", { ポイント: 500, お気に入り: "012" }), ["S-F02-02-PRODUCTS-012"]);
defineMemberSeed("S-F02-02-MEMBER-015", "015", 標準("015", { ポイント: 500 }));
defineMemberSeed("S-F02-02-MEMBER-017", "017", 標準("017", { ポイント: 500 }));
defineMemberSeed("S-F02-02-MEMBER-021", "021", 標準("021", { ポイント: 500 }));
defineMemberSeed("S-F02-02-MEMBER-063", "063", 標準("063"));
defineMemberSeed("S-F02-02-MEMBER-067", "067", 標準("067", { お気に入り: "067" }), ["S-F02-02-PRODUCTS-067"]);
defineMemberSeed("S-F02-02-MEMBER-068", "068", 標準("068"));
defineMemberSeed("S-F02-02-MEMBER-069", "069", 標準("069"));
