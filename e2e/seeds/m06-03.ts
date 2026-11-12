/**
 * M06-03 買取詳細 の画面シード＋画面で作れない部分のDB書き込み。正本: cases/M06-03_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）で、次のように作る。
 * - 管理者（ITチーム・経理・在庫入庫・他店舗）: メンバー管理で登録する。権限は「システム管理者」（店頭買取のステータス変更・経理払い出し済・入庫済みを許可している既存の権限）。
 *   東京店舗は、買取店舗A（M06-01 の試験店舗）に読み替えた。他店舗担当者は買取店舗Bだけを所属・編集可能店舗にする。
 *   「権限なし担当者（NONPRIV）」は、権限のマスターに足す・既存の権限の設定を変えるのが共有の設定の変更になるので作らない（そのシードを使うケースは実装しない）。
 * - ステータスマスター（STATUS）: 共有のマスターは書き換えない。アプリの定数のIDで使うだけ。
 * - 商品: グッズ商品CSV登録で作った実行の印つきのサプライ品（商品コード・商品名に実行の印）。基準価格・販売価格・言語・状態はDBで整える。
 *   通常商品のNM・SP・MPの3規格は、1商品に3規格を画面で作れないので、規格ごとに別の商品（同じ商品名）にした。高額商品コード・カテゴリー・検索対象商品は作らない。
 * - 買取: フロントの店頭買取査定申込（会員登録なし）で申込み、申込者の姓・名に実行の印を付ける。査定番号・注文IDは画面が振った値になる。
 *   ステータス・実在庫・買取明細・個別入力商品・ステータス履歴・更新前コメント・最終更新者・更新日時・基本情報は画面で作れないので、DBで足す（db/m06_03.ts・db/m06_05.ts）。
 *   最終更新者のseed_adminは、この環境の全権限の管理者（SETUP_ADMIN）に読み替えた。端末取引IDは整数の列なので「TX-6301」ではなく 6301 にした。
 *   ダブルチェック者（check01）は作らない（メンバー check01 の指定が無い）。ECCUBE在庫（店舗在庫）の数量は、画面・窓口で作れない共有のマスタ側の値なので指定しない。
 * - 共有のBASEは読み取り専用で、基本情報の氏名で実行の印が消えるため最後にまとめて書く。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 買取を整える, 状態の番号 } from "../db/m06_04_prep";
import { 受注ID, 買取明細を足す, 実在庫に紐づく個別入力商品を足す, 実在庫と履歴を足す, 実在庫履歴を消す, 商品規格を整える, 会員を設定する } from "../db/m06_05";
import { 棚戻し済みにする } from "../db/m06_01";
import {
  ステータス履歴を日時つきで足す, ステータス履歴のIDを調べる, 基本情報を設定する, 実在庫IDを調べる, 店舗在庫IDを調べる, 更新前の状態にする,
  未登録の個別入力商品を足す, 規格と商品のID, 個別入力商品のIDを調べる,
} from "../db/m06_03";
import { 一件ずつ申込む } from "./m06-01";
import { 本会員を作る } from "./f06-member";

export const M0603_IT: Account = { loginId: "m0603_it", password: "Passw0rd!M0603IT" };
export const M0603_ACCOUNTING: Account = { loginId: "m0603_accounting", password: "Passw0rd!M0603AC" };
export const M0603_STOCK: Account = { loginId: "m0603_stock", password: "Passw0rd!M0603ST" };
export const M0603_OSAKA: Account = { loginId: "m0603_osaka", password: "Passw0rd!M0603OS" };
export const 在庫入庫担当者 = "M06-03 在庫入庫担当者";
export const 経理担当者 = "M06-03 経理担当者";
/** 更新前の最終更新者（正本の seed_admin）に読み替えたメンバーのログインID */
export const 更新前の最終更新者 = SETUP_ADMIN.loginId;

const L_A = "〔店舗ID-M0601-共有A〕";
const L_B = "〔店舗ID-M0601-共有B〕";
const SHOPS = ["S-M06-01-SHOPS"];

const メンバー = (seedId: string, 名前: string, a: Account, 店: "A" | "B") => defineSeed(seedId, { needs: SHOPS }, async ({ browser, notes }) => {
  const s = notes.get(店 === "A" ? L_A : L_B);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
    権限: "システム管理者", 所属店舗ID: s, デフォルト検索表示店舗ID: s, 編集可能店舗ID: [s],
  }));
});
メンバー("S-M06-03-IT", "M06-03 IT担当者", M0603_IT, "A");
メンバー("S-M06-03-ACCOUNTING", 経理担当者, M0603_ACCOUNTING, "A");
メンバー("S-M06-03-STOCK", 在庫入庫担当者, M0603_STOCK, "A");
メンバー("S-M06-03-OTHERSTORE", "M06-03 他店舗担当者", M0603_OSAKA, "B");

defineSeed("S-M06-03-STATUS", async () => {
  // 店頭買取ステータスのマスターは共有の設定。書き換えず、アプリの定数のID（1・10・11・12・13・14）をそのまま使う
});

// ---------------------------------------------------------------- 商品

export type 品 = { コード: string; 名前?: string; 基準価格: number; 販売価格?: number; 買取価格?: number; 状態?: string };

/** サプライ品を作る。コード・名前は実行の印を付けた値を渡す */
async function 商品を作る(browser: Browser, 商品: 品[], issue: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, 商品.map((p) => ({ コード: p.コード, 名前: p.名前 ?? p.コード, 基準価格: String(p.基準価格), 買取価格: String(p.買取価格 ?? 500) })), issue);
  });
  for (const p of 商品) 商品規格を整える(p.コード, { 基準価格: p.基準価格, 販売価格: p.販売価格 ?? p.基準価格, 言語: "日本語", 状態: p.状態 ?? "NM" });
}

export const 共通商品 = {
  A: "BASE-A-NM", B: "BASE-B-NM", C: "BASE-C-SP", D: "M0603-ORD-D-NM",
} as const;

defineSeed("S-M06-03-PRODUCTS", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 商品を作る(browser, [
    { コード: rc(共通商品.A), 基準価格: 2200, 販売価格: 2500, 買取価格: 1400 },
    { コード: rc(共通商品.B), 基準価格: 5000 },
    { コード: rc(共通商品.C), 基準価格: 2000, 状態: "SP" },
    { コード: rc(共通商品.D), 基準価格: 2000 },
  ], issue);
  issue("商品は実行の印つきのサプライ品で作った。BASE-A は NM のみ（SP・MP の規格は作っていない）、BASE-B は高額商品コードを設定していない通常のサプライ品。商品ID・規格IDは画面が振る値。検索対象商品（ID 7001・カテゴリーなど）と原価試験用の商品は作らない");
});

// ---------------------------------------------------------------- 買取

type 在庫 = { コード: string; 数量: number; 単価: number };
type 注文 = {
  姓: string; 店?: "A" | "B"; 状態: string; 在庫?: 在庫[]; 明細?: { コード: string; 数量: number; 単価: number }[];
  未登録の個別?: { 名前: string; 数量: number; 単価: number }[]; 紐づく個別?: { コード: string; 名前: string; 数量: number; 単価: number }[];
  更新前?: boolean; 合計金額?: number; 履歴?: { 状態: string; 者: string; 日時: string }[]; 棚戻し済み?: boolean;
  基本?: { 会員ID: string };
};

type 作った = { 査定ID: string; 受注ID: string; 在庫IDs: string[] };

async function 注文を作る(browser: Browser, p: 注文): Promise<作った> {
  const 査定ID = await 一件ずつ申込む(browser, p.店 ?? "A", rc(p.姓), rc("M0603太郎"), "カイトリシケン", "イチロウ");
  const id = 受注ID(査定ID);
  買取を整える(id, RUN_MARK, { 状態: p.状態, 成立日: "2026-09-01 09:30:00", 合計金額: p.合計金額 ?? null });
  for (const s of p.在庫 ?? []) {
    const h = 実在庫と履歴を足す(査定ID, s.コード, { 数量: s.数量, 小計: s.数量 * s.単価, 変更前: null, 変更後: s.数量, 作業者: 在庫入庫担当者 });
    実在庫履歴を消す(h); // 各在庫履歴0件
  }
  for (const m of p.明細 ?? []) 買取明細を足す(査定ID, m.コード, m.数量, m.単価);
  for (const x of p.未登録の個別 ?? []) 未登録の個別入力商品を足す(id, x.名前, x.数量, x.単価, x.単価 * 3);
  for (const x of p.紐づく個別 ?? []) 実在庫に紐づく個別入力商品を足す(査定ID, x.コード, x.名前, x.数量, x.単価);
  for (const h of p.履歴 ?? []) ステータス履歴を日時つきで足す(id, 状態の番号[h.状態], h.者, h.日時);
  if (p.棚戻し済み) 棚戻し済みにする(査定ID);
  if (p.更新前) 更新前の状態にする(id, { コメント: "更新前コメント", 最終更新者のログインID: 更新前の最終更新者, 更新日時: "2026-09-01 09:00:00" });
  if (p.基本) {
    会員を設定する(査定ID, p.基本.会員ID);
    // 氏名は最後（実行の印が消える）
    基本情報を設定する(id, {
      姓: "試験買取", 名: "太郎", セイ: "シケンカイトリ", メイ: "タロウ", 電話番号: "03-6301-0001", 職業: "会社員", 生年月日: "1990-01-01", 返却サプライ: "なし",
      端末取引ID: 6301, 適格請求書: true, 申込日時: "2026-09-01 09:00:00", 成立日時: "2026-09-01 09:30:00",
    });
  }
  return { 査定ID, 受注ID: id, 在庫IDs: (p.在庫 ?? []).map((s) => 実在庫IDを調べる(id, s.コード)) };
}

type 控える値 = {
  作った: 作った; 商品コード?: string[]; 個別?: boolean; 会員ID?: string; 履歴?: boolean;
};

/** シード表の〔…〕の呼び名を、作った行の番号で控える。英字の末尾（A〜D）は並びの順、無ければ先頭 */
function 控える(seedId: string, notes: Notes, 状態属性と投入方法: string, v: 控える値): void {
  const idx = (l: string): number => { const m = /[-\d]([A-D])〕$/.exec(l); return m ? "ABCD".indexOf(m[1]) : 0; };
  const 規格 = (l: string) => {
    const code = v.商品コード?.[idx(l)];
    if (!code) throw new Error(`${seedId}: ${l} に対応する商品コードが無い`);
    return 規格と商品のID(code);
  };
  for (const l of Notes.labelsIn(状態属性と投入方法).filter((x) => !x.includes("…"))) {
    const pick = (x: string | undefined): string => { if (!x) throw new Error(`${seedId}: ${l} の番号を求められない`); return x; };
    if (l.startsWith("〔注文ID-")) notes.set(l, v.作った.受注ID);
    else if (l.startsWith("〔査定番号-")) notes.set(l, v.作った.査定ID);
    else if (l.startsWith("〔実在庫ID-")) notes.set(l, pick(v.作った.在庫IDs[idx(l)]));
    else if (l.startsWith("〔商品ID-")) notes.set(l, 規格(l).商品ID);
    else if (l.startsWith("〔規格ID-")) notes.set(l, 規格(l).規格ID);
    else if (l.startsWith("〔店舗在庫ID-")) notes.set(l, 店舗在庫IDを調べる(pick(v.商品コード?.[idx(l)])));
    else if (l.startsWith("〔個別入力商品ID-")) notes.set(l, pick(個別入力商品のIDを調べる(v.作った.受注ID)[idx(l)]));
    else if (l.startsWith("〔ステータス履歴ID-")) notes.set(l, pick(ステータス履歴のIDを調べる(v.作った.受注ID)[idx(l)]));
    else if (l.startsWith("〔会員ID-")) notes.set(l, pick(v.会員ID));
    else if (l.startsWith("〔明細ID-")) notes.set(l, pick(明細のIDを調べる(v.作った.受注ID)[idx(l)]));
    else throw new Error(`${seedId}: 呼び名 ${l} の控え方を知らない`);
  }
}

import { query } from "../lib/db";
function 明細のIDを調べる(受注ID: string): string[] {
  return query("select id from dtb_otc_buy_order_detail where otc_buy_order_id = $1::int order by id", [受注ID]).map((r) => String(r.id));
}

const 共通の注記 = [
  "買取は買取店舗A（M06-01 の試験店舗。正本の東京店舗）で申込み、申込者の姓・名に実行の印を付けた。査定番号・注文IDは画面が振った値",
  "ステータス・実在庫・買取明細・個別入力商品・更新前コメント・最終更新者（seed_admin は全権限の管理者に読み替え）・更新日時はDBで実行の印つきの買取にだけ設定した",
];

const NEEDS = ["S-M06-01-SHOPS", "S-M06-03-STOCK", "S-M06-03-PRODUCTS"];
const NEEDS_ONLY_STOCK = ["S-M06-01-SHOPS", "S-M06-03-STOCK"];

type シード定義 = { id: string; needs?: string[]; 作る: (browser: Browser, issue: (m: string) => void, notes: Notes) => Promise<控える値>; 注記?: string[] };

function 定義(d: シード定義): void {
  defineSeed(d.id, { needs: d.needs ?? NEEDS }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const v = await d.作る(browser, issue, notes);
    控える(seed.シードID, notes, seed["状態・属性"] + seed.投入方法, v);
    for (const m of [...共通の注記, ...(d.注記 ?? [])]) issue(m);
  });
}

const A = () => rc(共通商品.A);
const B = () => rc(共通商品.B);
const C = () => rc(共通商品.C);
const D = () => rc(共通商品.D);

/** 更新前コメントつきの入庫待ちの買取（A=5・B=3・C=1。指定した商品だけ） */
const 基本の入庫待ち = (姓: string, 商品: ("A" | "B" | "C")[], 追加: Partial<注文> = {}): 注文 => ({
  姓, 状態: "入庫待ち", 更新前: true,
  在庫: 商品.map((k) => k === "A" ? { コード: A(), 数量: 5, 単価: 1000 } : k === "B" ? { コード: B(), 数量: 3, 単価: 800 } : { コード: C(), 数量: 1, 単価: 500 }),
  ...追加,
});

定義({
  id: "S-M06-03-BASE", 注記: ["会員は本会員を画面で登録して紐づけた（会員IDは画面が振った値）。ダブルチェック者・ステータス履歴の内容（買取成立・経理払い出し待ち・入庫待ちを、10:00・11:00・12:00に）は読み替え、端末取引IDは 6301"],
  async 作る(browser) {
    const 会員ID = await 本会員を作る(browser, { 姓: "M0603試験", 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: "m0603-base", パスワード: "Passw0rd!M0603K" });
    const 作った = await 注文を作る(browser, {
      ...基本の入庫待ち("M0603-BASE", ["A", "B", "C"], { 履歴: [
        { 状態: "買取成立", 者: 在庫入庫担当者, 日時: "2026-09-01 10:00:00" },
        { 状態: "経理払い出し待ち", 者: 経理担当者, 日時: "2026-09-01 11:00:00" },
        { 状態: "入庫待ち", 者: 在庫入庫担当者, 日時: "2026-09-01 12:00:00" },
      ], 基本: { 会員ID } }),
      在庫: [{ コード: A(), 数量: 5, 単価: 1000 }, { コード: B(), 数量: 3, 単価: 800 }, { コード: C(), 数量: 1, 単価: 500 }, { コード: D(), 数量: 1, 単価: 800 }],
    });
    return { 作った, 会員ID };
  },
  needs: [...NEEDS, "S-M06-03-ACCOUNTING"],
});

for (const [no, 商品] of [["012", ["A", "B", "C"]], ["013", []], ["014", ["A", "B", "C"]], ["015", ["A", "B"]], ["016", ["A"]], ["087", ["A", "B", "C"]], ["088", ["A"]]] as [string, ("A" | "B" | "C")[]][]) {
  const id = no === "087" ? "S-M06-03-DP-MIXLOG-087" : no === "088" ? "S-M06-03-DP-UPDINC-088" : `S-M06-03-BASE-${no}`;
  定義({
    id,
    async 作る(browser, issue) {
      const 作った = await 注文を作る(browser, 基本の入庫待ち(`M0603-${no}`, 商品, no === "015" || no === "016" || no === "087" ? { 更新前: false } : {}));
      if (no === "015" || no === "016" || no === "087") issue("フリーコメント・最終更新者・更新日時の指定がないので、更新前の値は設定していない");
      return { 作った };
    },
  });
}

定義({
  id: "S-M06-03-ACCOUNTING-NONE", needs: ["S-M06-01-SHOPS"],
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-ACC-NONE", 状態: "経理払い出し待ち" }) }; },
});
定義({
  id: "S-M06-03-ACCOUNTING-NONE-050", needs: ["S-M06-01-SHOPS"],
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-050", 状態: "経理払い出し待ち" }) }; },
});
定義({
  id: "S-M06-03-ACCOUNTING-NONE-057", needs: ["S-M06-01-SHOPS"],
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-057", 状態: "経理払い出し待ち" }) }; },
});
定義({
  id: "S-M06-03-ACCOUNTING-WITH-051", needs: ["S-M06-01-SHOPS"],
  async 作る(browser) {
    return { 作った: await 注文を作る(browser, { 姓: "M0603-051", 状態: "経理払い出し待ち", 未登録の個別: [{ 名前: rc("M0603-051-個別商品"), 数量: 1, 単価: 1000 }] }) };
  },
});
定義({
  id: "S-M06-03-INVALID", needs: ["S-M06-01-SHOPS", "S-M06-03-STOCK"],
  async 作る(browser) {
    const code = rc("INVALID-A-NM");
    await 商品を作る(browser, [{ コード: code, 基準価格: 1000 }], () => {});
    return { 作った: await 注文を作る(browser, { 姓: "M0603-INVALID", 状態: "入庫済み", 在庫: [{ コード: code, 数量: 2, 単価: 1000 }], 未登録の個別: [{ 名前: rc("M0603-INVALID-個別商品"), 数量: 1, 単価: 1000 }] }) };
  },
});
定義({
  id: "S-M06-03-DP-SHELVED-084", needs: NEEDS,
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-084", 状態: "入庫済み", 棚戻し済み: true, 在庫: [{ コード: A(), 数量: 5, 単価: 1000 }] }) }; },
});

// ---- 専用商品つきの買取 ----

/** 規格ごとに別の商品（同じ商品名）を作り、買取を作る */
function 専用商品の定義(id: string, no: string, 商品: { コード: string; 名前: string; 状態?: string; 在庫?: { 数量: number; 単価: number }; 明細?: { 数量: number; 単価: number }; 基準価格?: number }[], 追加: Partial<注文> = {}, 注記: string[] = []): void {
  定義({
    id, needs: NEEDS_ONLY_STOCK, 注記,
    async 作る(browser, issue) {
      await 商品を作る(browser, 商品.map((p) => ({ コード: rc(p.コード), 名前: rc(p.名前), 基準価格: p.基準価格 ?? 1000, 状態: p.状態 ?? "NM" })), issue);
      const 作った = await 注文を作る(browser, {
        姓: `M0603-${no}`, 状態: "入庫待ち",
        在庫: 商品.filter((p) => p.在庫).map((p) => ({ コード: rc(p.コード), 数量: p.在庫!.数量, 単価: p.在庫!.単価 })),
        明細: 商品.filter((p) => p.明細).map((p) => ({ コード: rc(p.コード), 数量: p.明細!.数量, 単価: p.明細!.単価 })),
        ...追加,
      });
      return { 作った, 商品コード: 商品.map((p) => rc(p.コード)) };
    },
  });
}
const 別商品の注記 = ["商品IDは規格ごとに別の商品（同じ商品名）にしたので、〔商品ID-…〕は規格に対応する商品の番号を控えた"];
専用商品の定義("S-M06-03-BASE-058", "058", [
  { コード: "BASE-A-NM-058", 名前: "M0603-058-商品A", 在庫: { 数量: 5, 単価: 1000 } },
  { コード: "BASE-B-NM-058", 名前: "M0603-058-商品B", 在庫: { 数量: 3, 単価: 800 } },
  { コード: "BASE-C-SP-058", 名前: "M0603-058-商品C", 状態: "SP", 在庫: { 数量: 1, 単価: 500 } },
], {}, [...別商品の注記, "店舗在庫（ECCUBE在庫 10・20・0）の数量は指定できないので、商品登録時の値のまま"]);
専用商品の定義("S-M06-03-BASE-066", "066", [{ コード: "BASE-A-NM-066", 名前: "M0603-066-商品", 在庫: { 数量: 5, 単価: 1000 } }], {}, ["店舗在庫（ECCUBE在庫 10）の数量は指定できないので、商品登録時の値のまま"]);
専用商品の定義("S-M06-03-DETAIL-076", "076", [
  { コード: "M0603-076-A-NM", 名前: "M0603-076-商品A", 明細: { 数量: 3, 単価: 1200 } },
  { コード: "M0603-076-B-SP", 名前: "M0603-076-商品B", 状態: "SP", 明細: { 数量: 2, 単価: 700 } },
], { 合計金額: 5000 }, 別商品の注記);
専用商品の定義("S-M06-03-DETAIL-081", "081", [
  { コード: "M0603-081-A-NM", 名前: "M0603-081-商品A", 明細: { 数量: 3, 単価: 1200 } },
  { コード: "M0603-081-B-SP", 名前: "M0603-081-商品B", 状態: "SP", 明細: { 数量: 2, 単価: 700 } },
], { 合計金額: 5000 }, 別商品の注記);
専用商品の定義("S-M06-03-STOCKROW-078", "078", [
  { コード: "M0603-078-A-NM", 名前: "M0603-078-商品", 在庫: { 数量: 4, 単価: 1000 } },
  { コード: "M0603-078-A-SP", 名前: "M0603-078-商品", 状態: "SP", 在庫: { 数量: 2, 単価: 800 } },
], {}, 別商品の注記);
専用商品の定義("S-M06-03-EDITQTY-079", "079", [
  { コード: "M0603-079-A-NM", 名前: "M0603-079-商品", 在庫: { 数量: 4, 単価: 1000 } },
  { コード: "M0603-079-A-SP", 名前: "M0603-079-商品", 状態: "SP", 在庫: { 数量: 2, 単価: 800 } },
  { コード: "M0603-079-A-MP", 名前: "M0603-079-商品", 状態: "MP", 在庫: { 数量: 3, 単価: 600 } },
], {}, 別商品の注記);

定義({
  id: "S-M06-03-INDIV-077", needs: ["S-M06-01-SHOPS"],
  async 作る(browser) {
    return { 作った: await 注文を作る(browser, { 姓: "M0603-077", 状態: "未登録在庫あり", 未登録の個別: [{ 名前: rc("M0603-077-個別商品"), 数量: 2, 単価: 1500 }] }) };
  },
});
