/**
 * M05-10 納品書印刷（英語）の画面シード。正本: cases/M05-10_seed_data.tsv
 * 作り方は M05-09（seeds/m05-09.ts）と同じ。1つの作り方 作る() を、シードごとの定め（下の 定めの表）で動かす。
 * 1. 会員: 受注ごとに別の会員を、フロントの新規会員登録で本会員として作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。
 *    受注情報検索を、ケースの会員のメールアドレスに共通する先頭（m0510-<番号>-）で絞ると、そのケースの受注だけが出る。
 * 2. 商品: グッズ商品CSV登録で作り、本店・EC-CUBE に入庫して別のメンバーが承認する（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *    商品コード・商品名に実行の印を付ける（ケースの文の同じ値も印つきで読む）。
 * 3. 受注: 会員でフロントにログインし、商品をカートに入れて注文する（pages/front/m05_front_order.ts の 会員が商品を注文する）。
 * 4. 受注情報編集: 配送方法・注文者・お届け先・送料・手数料・値引きを画面で入れて「受注情報を登録」を押す。
 * 5. DB での書き足し（E2E の行だけ。db/m05_09.ts・db/m05_10.ts）: 受注日時、注文者の都道府県・配送先の国の未設定、プレイヤーの切り離し、
 *    受注から会員を外す（006）、配送先を受注から外す（035）、消費税額（015）・利用ポイント（015・016）。どれも画面で指定できない値。
 *
 * シードでの解釈（正本の外の補い。記録 review/M05-10_progress_2026-11-11_dev.md にも書く）:
 * - 配送方法の新規登録（国外配送の「Global Express」・国内配送の任意の配送方法）はしない。配送方法のマスタは全員が使い、フロントの選択肢にも出るため。
 *   国外配送区分の配送方法は開発環境の「EMS」（国外配送）、国内配送区分の配送方法は「ゆうパック」で読み替えた。
 * - 対応状況「新規受付」は、注文したときの対応状況のまま（納品書の抽出は対応状況を見ない）。
 * - 受注の作成で会員の住所・電話・氏名はシード表が値を定めないので、登録できる任意の値（会員登録の部品の既定）。
 * - ポイント使用（015・016 の 99）は、受注情報編集に利用ポイントの入力欄が無い（画面の部品がコメントで外されている）ので DB で書き足した。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 受注IDの, 受注の配送先ID, 受注の配送方法, 受注日時を書き足す, 注文者の都道府県を空にする, 配送先の項目を空にする, 会員のプレイヤーID, プレイヤーを会員から外す, 配送方法 } from "../db/m05_09";
import { 受注の明細ID, 受注の金額を書き足す, 受注から会員を外す, 配送先を受注から外す } from "../db/m05_10";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { OrderEditPage, OrderItemsEdit } from "../pages/admin/m05_11_order_edit";
import { 住所の入力, 住所を入れる, 受注情報編集を開く, 商品名を変える } from "../pages/admin/m05_09_delivery_slips";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがある（M03-26・M03-27 で起きた）ので、実行の印つきで作る */
export const M0510_ADMIN: Account = { loginId: rc("m0510_admin").toLowerCase(), password: "Passw0rd!M0510" };
const PW = "Passw0rd!M0510C";

/** 国外配送区分・国内配送区分の配送方法（開発環境の既存のもので読み替える） */
export const 国外の配送方法 = "EMS";
export const 国内の配送方法 = "ゆうパック";

defineSeed("S-M05-10-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: rc("M05-10管理者"), account: M0510_ADMIN, メール: `${M0510_ADMIN.loginId}@example.test` });
  reportSeedIssue("S-M05-10-ADM", "権限は受注管理を操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

defineSeed("S-M05-10-DOC-FIXED", async () => {
  reportSeedIssue("S-M05-10-DOC-FIXED", "英語の納品書の会社情報はアプリの英語納品書の画面に書かれた固定の値。用意する操作は無い");
});

// ---- ケース専用のシード ----

type 明細の定め = { コード: string; 名前: string; 価格?: number; 数量?: number };
type 受注の定め = {
  明細: 明細の定め[];
  注文者?: 住所の入力; お届け先?: 住所の入力;
  /** 既定は国外配送区分の配送方法 */
  配送方法?: string;
  送料?: string; 手数料?: string; 値引き?: string;
  /** DB で書き足すもの（画面で指定できない状態） */
  注文者の都道府県なし?: true; 配送先の国なし?: true; プレイヤーなし?: true; 会員なし?: true; 配送先なし?: true;
  消費税額?: number; 利用ポイント?: number;
};
type 定め = { 受注日: string; 受注: 受注の定め[]; 商品名の変更?: { コード: string; 名前: string } };

const P = (番号: string, n = 1, 価格 = 1000): 明細の定め[] => Array.from({ length: n }, (_, i) => {
  const s = n > 1 ? `-P${String(i + 1).padStart(2, "0")}` : "-P1";
  return { コード: `M0510-${番号}${s}`, 名前: `M0510-${番号}${s}`, 価格 };
});
const 国外 = (国: string, 郵便番号: string, 住所: { 住所1?: string; 住所2?: string; 住所3?: string } = {}): 住所の入力 => ({ 国, 都道府県: "日本国外", 海外郵便番号: 郵便番号, ...住所 });
const 金額 = { 送料: "1200", 手数料: "300", 値引き: "1234" };
const ゼロ = { 送料: "0", 手数料: "0", 値引き: "0" };

const 定めの表: Record<string, 定め> = {
  "METHODS-002": { 受注日: "2026-09-02", 受注: [
    { 明細: P("002A"), お届け先: { 国: "Japan", 都道府県: "東京都" } },
    { 明細: P("002B"), お届け先: 国外("United States", "10001"), 配送方法: 国内の配送方法 },
  ] },
  "DUPLICATE-005": { 受注日: "2026-09-05", 受注: [{ 明細: P("005") }] },
  "ORDER-RELATIONS-006": { 受注日: "2026-09-06", 受注: [
    { 明細: P("006A") }, { 明細: P("006B"), 会員なし: true }, { 明細: P("006C"), プレイヤーなし: true }, { 明細: P("006D"), 注文者の都道府県なし: true },
  ] },
  "NOCOUNTRY-009": { 受注日: "2026-09-09", 受注: [{ 明細: P("009"), お届け先: 国外("United States", "10009"), 配送先の国なし: true }] },
  "MAPPING-010": { 受注日: "2026-09-10", 受注: [
    { 明細: P("010A"), 注文者: 国外("Canada", "A1B2C3", { 住所1: "Sender-A1", 住所2: "Sender-A2", 住所3: "Sender-A3" }), お届け先: 国外("United States", "10010", { 住所1: "Shipping-A1", 住所2: "Shipping-A2", 住所3: "Shipping-A3" }) },
    { 明細: P("010B"), 注文者: 国外("Australia", "2000", { 住所1: "Sender-B1", 住所2: "Sender-B2", 住所3: "Sender-B3" }), お届け先: 国外("United Kingdom", "SW1A1AA", { 住所1: "Shipping-B1", 住所2: "Shipping-B2", 住所3: "Shipping-B3" }) },
  ] },
  "AMOUNTS-015": { 受注日: "2026-09-15", 受注: [{ 明細: P("015", 1, 123456), ...金額, 利用ポイント: 99, 消費税額: 11247 }] },
  "AMOUNTS-016": { 受注日: "2026-09-16", 受注: [{ 明細: P("016", 1, 123456), ...金額, 利用ポイント: 99 }] },
  "AMOUNTS-017": { 受注日: "2026-09-17", 受注: [{ 明細: P("017"), ...ゼロ }] },
  "DETAIL-020": { 受注日: "2026-09-20", 受注: [{ 明細: [{ コード: "M0510-020-P1", 名前: "注文時商品A", 価格: 1234, 数量: 2 }] }], 商品名の変更: { コード: "M0510-020-P1", 名前: "変更後商品A" } },
  "PAGE30-022": { 受注日: "2026-09-22", 受注: [{ 明細: P("022", 30, 100), ...ゼロ }] },
  "PAGE31-023": { 受注日: "2026-09-23", 受注: [{ 明細: P("023", 31, 100), ...ゼロ }] },
  "CBSHIPTO-035": { 受注日: "2026-11-05", 受注: [{ 明細: P("CB035A") }, { 明細: P("CB035B"), 配送先なし: true }] },
};

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 会員メール: string[]; 受注ID: string[]; 注文番号: string[]; 配送先ID: string[][]; 商品名: Record<string, string>; 商品ID: Record<string, string> };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
/** ケースの会員（受注ごとに別の会員。a・b・c・d） */
export const 会員の前半 = (番号: string, i = 0) => `m0510-${番号}-${"abcd"[i]}`;
export const 会員のメール = (番号: string, i = 0) => markedMail(会員の前半(番号, i));
/** ケースの会員のメールアドレスに共通する先頭（受注情報検索をこれで絞る） */
export const 会員の検索語 = (番号: string) => `m0510-${番号}-`;

async function 作る(browser: Browser, seedId: string, notes: Notes, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-((?:CB)?\d{3})$/.exec(seedId)?.[1]?.replace(/^CB/, "") ?? "";
  for (const [id, name, abroad] of [[8, 国外の配送方法, true], [3, 国内の配送方法, false]] as [number, string, boolean][]) {
    const x = 配送方法(id);
    if (!x || x.名前 !== name || x.国外 !== abroad) throw new Error(`${seedId}: 開発環境の配送方法ID ${id} が「${name}」（${abroad ? "国外配送" : "国内配送"}）でない（マスタは共有なので書き換えない）`);
  }

  // 1. 会員（受注ごとに別の会員）
  const メール: string[] = [];
  for (const [i] of d.受注.entries()) {
    await 本会員を作る(browser, { 姓: "納品書英語", 名: `${番号}${"ABCD"[i]}`, セイ: "ノウヒンショエイゴ", メイ: "カイイン", 前半: 会員の前半(番号, i), パスワード: PW });
    メール.push(会員のメール(番号, i));
  }

  // 2. 商品
  const 明細の一覧 = d.受注.flatMap((o) => o.明細);
  const made = await 商品を作って入庫する(browser, seedId, 明細の一覧.map((x) => ({
    商品コード: rc(x.コード), 商品名: rc(x.名前), 価格: String(x.価格 ?? 1000), 入庫数: (x.数量 ?? 1) + 2,
  })), issue);
  const 商品ID = new Map(made.map((m, i) => [明細の一覧[i].コード, m.productId]));

  // 3. 受注（会員ごとに1件）
  const 注文番号: string[] = [];
  const 受注ID: string[] = [];
  for (const [i, o] of d.受注.entries()) {
    const n = await 会員が商品を注文する(browser, { メール: メール[i], パスワード: PW }, o.明細.map((x) => ({ 商品ID: 商品ID.get(x.コード)!, 数量: x.数量 ?? 1 })), `${seedId}: ${i + 1}件目の受注`);
    注文番号.push(n); 受注ID.push(受注IDの(n, メール[i]));
  }

  // 4. 受注情報編集（配送方法・注文者・お届け先・金額）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, o] of d.受注.entries()) {
      const 配送 = o.配送方法 ?? 国外の配送方法;
      await 受注情報編集を開く(page, 受注ID[i]);
      if (受注の配送方法(受注ID[i]).some((x) => x !== 配送)) {
        await page.locator("#order_Shipping_Delivery").selectOption({ label: 配送 }, { timeout: 20_000 });
        await page.waitForTimeout(1500);
      }
      if (o.注文者) await 住所を入れる(page, "注文者", o.注文者);
      if (o.お届け先) await 住所を入れる(page, "お届け先", o.お届け先);
      if (o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined) await new OrderItemsEdit(page).金額欄({ 値引き: o.値引き, 送料: o.送料, 手数料: o.手数料 });
      const warnings = await new OrderEditPage(page).受注情報を登録する((m) => issue(`${注文番号[i]}: 受注情報の登録の確認「${m}」`));
      for (const w of warnings) issue(`${注文番号[i]}: 受注情報の登録の警告「${w}」`);
      const now = 受注の配送方法(受注ID[i]);
      if (now.some((x) => x !== 配送)) throw new Error(`${seedId}: ${注文番号[i]} の配送方法が ${now.join("・")}（${配送} のはず）`);
    }
  });

  // 商品名を変える（020）
  if (d.商品名の変更) {
    const ch = d.商品名の変更;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 商品名を変える(page, 商品ID.get(ch.コード)!, rc(ch.名前), issue); });
  }

  // 5. DB での書き足し（E2E の行だけ。持ち主を確かめられなくなる書き足し＝会員・配送先を外すものは最後）
  const 書いた: string[] = [];
  const 配送先ID = 受注ID.map((id) => 受注の配送先ID(id));
  for (const [i, o] of d.受注.entries()) {
    受注日時を書き足す(seedId, [受注ID[i]], メール[i], `${d.受注日} 10:00:00`);
    if (o.注文者の都道府県なし) { 注文者の都道府県を空にする(seedId, 受注ID[i], メール[i]); 書いた.push(`${注文番号[i]} の注文者の都道府県を未設定`); }
    if (o.配送先の国なし) { 配送先の項目を空にする(seedId, 配送先ID[i], メール[i], "国"); 書いた.push(`${注文番号[i]} の配送先の国を未設定`); }
    if (o.消費税額 !== undefined || o.利用ポイント !== undefined) {
      受注の金額を書き足す(seedId, 受注ID[i], メール[i], { 消費税額: o.消費税額, 利用ポイント: o.利用ポイント });
      書いた.push(`${注文番号[i]} の${o.消費税額 !== undefined ? `消費税額を ${o.消費税額}・` : ""}利用ポイントを ${o.利用ポイント}`);
    }
    if (o.プレイヤーなし) {
      const ps = 会員のプレイヤーID(メール[i]);
      if (ps.length !== 1) throw new Error(`${seedId}: 会員 ${メール[i]} のプレイヤーが ${ps.length} 件（1件のはず）`);
      プレイヤーを会員から外す(seedId, ps, メール[i]); 書いた.push(`${注文番号[i]} の会員からプレイヤーを外した`);
    }
  }
  for (const [i, o] of d.受注.entries()) {
    if (o.配送先なし) { 配送先を受注から外す(seedId, 配送先ID[i], メール[i]); 書いた.push(`${注文番号[i]} の受注から配送先（${配送先ID[i].join("・")}）を外した`); }
    if (o.会員なし) { 受注から会員を外す(seedId, 受注ID[i], メール[i]); 書いた.push(`${注文番号[i]} の受注から会員を外した`); }
  }
  issue(`DB で書き足した（E2E の行だけ）: 受注 ${受注ID.join("・")} の受注日時を ${d.受注日} 10:00:00${書いた.length ? `・${書いた.join("・")}` : ""}`);

  作った.set(seedId, {
    会員メール: メール, 受注ID, 注文番号, 配送先ID,
    商品名: Object.fromEntries(明細の一覧.map((x) => [x.コード, rc(x.名前)])), 商品ID: Object.fromEntries(商品ID),
  });

  // 呼び名を控える（シード表の文に出る呼び名だけ）
  const 文字 = (i: number, n: number) => (n > 1 ? "ABCD"[i] : "");
  const cb = seedId.includes("-CB") ? "CB" : "";
  const v: Record<string, string> = {};
  注文番号.forEach((n, i) => { v[`〔注文番号-M0510-${cb}${番号}${文字(i, 注文番号.length)}〕`] = n; });
  if (受注ID.length === 1) v[`〔受注ID-M0510-${番号}〕`] = 受注ID[0];
  if (d.商品名の変更) v[`〔商品ID-M0510-${番号}〕`] = 商品ID.get(d.商品名の変更.コード)!;
  if (受注ID.length === 1) {
    const ids = 受注の明細ID(受注ID[0]);
    if (ids.length > 0) { v[`〔受注明細ID-M0510-${番号}A〕`] = ids[0]; v[`〔受注明細ID-M0510-${番号}B〕`] = ids[ids.length - 1]; }
  }
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-10-${k}`;
  defineSeed(seedId, { needs: ["S-M05-10-ADM"] }, async ({ browser, notes }) => 作る(browser, seedId, notes, d));
}
