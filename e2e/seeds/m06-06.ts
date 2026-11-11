/**
 * M06-06 買取商品履歴CSV出力 の画面シード。正本: cases/M06-06_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）で、次のように作る。
 * - 管理者: メンバー管理で登録する（権限はシステム管理者、デフォルト検索表示店舗は全店、所属・編集可能店舗は買取店舗A）。
 * - 買取: フロントの店頭買取査定申込（会員登録なし）で買取店舗Aに申込み、申込者の姓・名に実行の印を付ける。査定IDは画面が振った値に読み替える。
 * - 会員: 本会員を画面で登録し、DBでその会員を買取に紐づける。会員IDは画面が振った値に読み替える。
 * - 商品: グッズ商品CSVを使わず、サプライ品の登録で作る（商品コード・商品名に実行の印）。
 * - 買取日時・ステータス・買取明細・実在庫・実在庫履歴（変更前後の個数・作業者・作成日時）は画面で作れないので、実行の印つきの買取にだけDBで設定する／足す（db/m06_05.ts・db/m06_04_prep.ts）。
 * - 買取店舗・作業者は、買取店舗Aと試験管理者で代える（店舗・メンバーを新しく作らない）。
 * 作らないシード: HIST-010（買取日時の範囲検索は、共有の環境の他の買取が混ざる）、HIST-012〜014（削除済みの商品・規格・作業者は作れない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 買取を整える } from "../db/m06_04_prep";
import { 会員を設定する, 実在庫と履歴を足す, 買取明細を足す, 受注ID, 商品規格を整える } from "../db/m06_05";
import { 在庫数量を設定する } from "../db/m06_06";
import { 一件ずつ申込む } from "./m06-01";
import { 本会員を作る } from "./f06-member";

export const M0606_ADMIN: Account = { loginId: "m0606_admin", password: "Passw0rd!M0606" };
const 管理者名 = "M06-06試験管理者";
const L_A = "〔店舗ID-M0601-共有A〕";
const 買取日時 = "2026-08-01 10:00:00";
const 履歴の作成日時 = "2026-08-02 11:30:00";

defineSeed("S-M06-06-ADM", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔管理者ID-M0606-共有〕", await ensureMemberByStoreIds(page, {
      名前: 管理者名, ログインID: M0606_ADMIN.loginId, メールアドレス: "m0606_admin@example.com", パスワード: M0606_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [a],
    }));
  });
});

/** 履歴1件ぶんの指定（実在庫・実在庫履歴・買取明細は同じ商品に1件ずつ） */
export type 履歴 = {
  /** 商品コードの元（実行の印を付ける） */
  コード: string;
  商品名?: string;
  基準価格?: number;
  /** 商品に設定する買取価格（履歴の買取価格には使われない） */
  設定の買取価格?: number;
  数量: number;
  単価: number;
  変更前: number;
  変更後: number;
};

export type 買取の指定 = {
  /** 申込者の姓の元（実行の印を付ける） */
  姓: string;
  履歴: 履歴[];
};

export type 作った買取 = { 査定ID: string; 会員ID: string; コード: string[] };

const 共通の注記 = [
  "買取はフロントの店頭買取査定申込（会員登録なし）で買取店舗Aに申込み、申込者の姓・名に実行の印を付けた。査定IDは画面が振った値に読み替えた（正本は決め打ち）",
  "会員は本会員を画面で登録して、DBでその買取に紐づけた。会員ID・店舗ID・作業者・商品ID・明細ID・履歴IDは画面が振る値で、買取店舗は買取店舗A、作業者はM06-06試験管理者で代えた",
  "商品はサプライ品の登録で作った（商品コード・商品名に実行の印）。ステータス（買取成立）・買取日時・買取明細・実在庫・実在庫履歴の変更前後の個数と作成日時（日本時間）は、実行の印つきの買取にだけDBで設定した／足した",
  "買取価格は実在庫の小計÷数量で出るので、小計を数量×単価にした",
];

/** 会員・商品を作り、買取を申込んでDBで整える */
export async function 買取を作る(browser: Browser, no: string, p: 買取の指定, issue: (m: string) => void): Promise<作った買取> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, p.履歴.map((h) => ({
      コード: rc(h.コード), 名前: rc(h.商品名 ?? `${h.コード}-商品`), 基準価格: String(h.基準価格 ?? 3000), 買取価格: String(h.設定の買取価格 ?? 500),
    })), issue);
  });
  for (const h of p.履歴) 商品規格を整える(rc(h.コード), { 基準価格: h.基準価格 ?? 3000, 販売価格: h.基準価格 ?? 3000 });
  const 会員ID = await 本会員を作る(browser, { 姓: `M0606${no}試験`, 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: `m0606-${no}`, パスワード: "Passw0rd!M0606K" });
  const 査定ID = await 一件ずつ申込む(browser, "A", rc(p.姓), rc(`M0606-${no}名`), "カイトリシケン", "イチロウ");
  買取を整える(受注ID(査定ID), RUN_MARK, { 状態: "買取成立", 成立日: 買取日時, 合計金額: null, キャンセル日: null });
  会員を設定する(査定ID, 会員ID);
  for (const h of p.履歴) {
    買取明細を足す(査定ID, rc(h.コード), h.数量, h.単価);
    実在庫と履歴を足す(査定ID, rc(h.コード), { 数量: h.数量, 小計: h.数量 * h.単価, 変更前: h.変更前, 変更後: h.変更後, 作業者: 管理者名, 作成日時: 履歴の作成日時 });
  }
  return { 査定ID, 会員ID, コード: p.履歴.map((h) => rc(h.コード)) };
}

const NEEDS = { needs: ["S-M06-06-ADM"] };
type Build = Parameters<typeof defineSeed>[2];

/** 1商品・1買取の基本のデータ（数量2・単価1200・変更前10・変更後12）を、指定で変えて作るシード */
function 基本のシード(no: string, 変える: Partial<履歴> = {}, 追加の注記: string[] = [], 後処理?: (r: 作った買取) => void): Build {
  return async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const r = await 買取を作る(browser, no, {
      姓: `M0606-${no}姓`,
      履歴: [{ コード: `M0606-${no}-P`, 商品名: `M0606-${no}-商品`, 数量: 2, 単価: 1200, 変更前: 10, 変更後: 12, ...変える }],
    }, issue);
    notes.set(`〔査定ID-M0606-${no}〕`, r.査定ID);
    notes.set(`〔会員ID-M0606-${no}〕`, r.会員ID);
    後処理?.(r);
    for (const m of [...共通の注記, ...追加の注記]) issue(m);
  };
}

defineSeed("S-M06-06-HIST-001", NEEDS, 基本のシード("001"));
defineSeed("S-M06-06-HIST-005", NEEDS, 基本のシード("005", { 変更前: 5, 変更後: 9 }));
defineSeed("S-M06-06-HIST-007", NEEDS, 基本のシード("007", {}, ["商品の在庫数量12は、DBで実行の印つきの商品の在庫数量に設定した"], (r) => 在庫数量を設定する(r.コード[0], 12)));
defineSeed("S-M06-06-HIST-016", NEEDS, 基本のシード("016", { 変更後: 13 }));
defineSeed("S-M06-06-HIST-017", NEEDS, 基本のシード("017", { 数量: 4, 変更前: 7, 変更後: 12 }));

// 008: 1つの買取に実在庫履歴12件（商品12件）
defineSeed("S-M06-06-HIST-008", NEEDS, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const r = await 買取を作る(browser, "008", {
    姓: "M0606-008姓",
    履歴: Array.from({ length: 12 }, (_, i) => ({ コード: `M0606-008-P${String(i + 1).padStart(2, "0")}`, 商品名: "M0606-008-商品", 数量: 1, 単価: 1200, 変更前: 10, 変更後: 11 })),
  }, issue);
  notes.set("〔査定ID-M0606-008〕", r.査定ID);
  for (const m of [...共通の注記, "12件の履歴は、商品12件（商品名は共通）に1件ずつ足した。ほかの買取は、査定IDで絞って確かめる（共有の環境の他の買取は消さない）"]) issue(m);
});

// 009: 別の買取（会員・商品が別）も作る
defineSeed("S-M06-06-HIST-009", NEEDS, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const a = await 買取を作る(browser, "009", { 姓: "M0606-009姓", 履歴: [{ コード: "M0606-009-P", 商品名: "M0606-009-商品", 数量: 2, 単価: 1200, 変更前: 10, 変更後: 12 }] }, issue);
  await 買取を作る(browser, "009B", { 姓: "M0606-009B姓", 履歴: [{ コード: "M0606-009-PB", 商品名: "M0606-009-商品B", 数量: 1, 単価: 1200, 変更前: 10, 変更後: 11 }] }, issue);
  notes.set("〔査定ID-M0606-009〕", a.査定ID);
  for (const m of [...共通の注記, "別の買取（商品コード M0606-009-PB）は、別の会員・別の商品で作り、実在庫履歴を1件足した"]) issue(m);
});

// 018: 買取価格は単価（小計・商品設定の買取価格でない）
defineSeed("S-M06-06-HIST-018", NEEDS, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const r = await 買取を作る(browser, "018", {
    姓: "M0606-018姓",
    履歴: [
      { コード: "M0606-018-P1", 商品名: "M0606-018-商品1", 設定の買取価格: 1500, 数量: 2, 単価: 1200, 変更前: 10, 変更後: 12 },
      { コード: "M0606-018-P2", 商品名: "M0606-018-商品2", 設定の買取価格: 1000, 数量: 4, 単価: 800, 変更前: 10, 変更後: 14 },
    ],
  }, issue);
  notes.set("〔査定ID-M0606-018〕", r.査定ID);
  for (const m of [...共通の注記, "商品に設定する買取価格は、商品1が1500・商品2が1000（サプライ品の登録で設定した）"]) issue(m);
});
