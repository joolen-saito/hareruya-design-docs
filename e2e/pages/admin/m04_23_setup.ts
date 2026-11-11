/**
 * M04-23 在庫分割結合CSV登録のシードが使う、前提データの画面操作。
 * 店舗（店舗登録）・メンバー（メンバー管理）・グッズ商品（グッズ商品CSV登録）・在庫の入庫（在庫変更CSV登録と、別のメンバーの在庫編集承認一覧での一括承認）を、
 * すべて管理画面から行う。部品はほかの機能のもの（tenant.ts・m04_24_member.ts・m11_02_member.ts・m03_01_goods_register.ts・m04_19_stock_change_csv.ts）を使う。
 */
import { Browser, expect, Page } from "@playwright/test";
import { Account, withAdminSession } from "../../lib/session";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { openProductEditByCode } from "./m03_23_seed_products";
import { registerStockChangeCsv } from "./m04_19_stock_change_csv";
import { openStockApprovalListForStore } from "./m04_24_stock_move";
import { ensureMemberByStoreIds, M0424MemberInput } from "./m04_24_member";
import { MemberEditPage } from "./m11_02_member";
import { ensureTenant, TenantInput } from "./tenant";

// ---------------------------------------------------------------- 店舗

const 漢数字 = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const 英字 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

/** ケース番号（3桁）の店舗「在庫分割結合試験店舗甲〇一三」などの登録の値。店名英語は半角英字とスペースだけ（数字不可）なので、番号を英字に置き換える */
export function ケースの店舗(番号: string, 組: "甲" | "乙"): TenantInput {
  const kanji = [...番号].map((d) => 漢数字[Number(d)]).join("");
  const eng = [...番号].map((d) => 英字[Number(d)]).join("");
  return {
    店名: `在庫分割結合試験店舗${組}${kanji}`, 店名カナ: "ザイコブンカツケツゴウシケンテンポ", 店名英語: `Split Join Case ${eng}`,
    支店URL: `m0423c${番号}`, 店名略称3文字: `Y${番号.slice(1)}`, ショップ名略称: `在庫分割結合試験店舗${組}${kanji}`,
  };
}

export const 試験店舗A: TenantInput = {
  店名: "試験店舗A（M04-23）", 店名カナ: "シケンテンポエー", 店名英語: "Test Store A", 支店URL: "m0423a", 店名略称3文字: "Q3A", ショップ名略称: "試験店舗A（M04-23）",
};
export const 試験店舗B: TenantInput = {
  店名: "試験店舗B（M04-23）", 店名カナ: "シケンテンポビー", 店名英語: "Test Store B", 支店URL: "m0423b", 店名略称3文字: "Q3B", ショップ名略称: "試験店舗B（M04-23）",
};
export const 連携分割店舗001: TenantInput = {
  店名: "連携分割店舗001", 店名カナ: "レンケイブンカツテンポ", 店名英語: "Link Split Store", 支店URL: "m0423l001", 店名略称3文字: "YL1", ショップ名略称: "連携分割店舗001",
};

/** 店舗を、あれば使い、無ければ店舗登録で登録する。店舗IDを返す（同じ店名の店舗が複数あれば ensureTenant が止める） */
export async function 店舗を用意する(page: Page, v: TenantInput, issue: (m: string) => void): Promise<string> {
  return ensureTenant(page, v, issue);
}

// ---------------------------------------------------------------- メンバー

export type 管理者 = { 名前: string; account: Account; email: string };

/**
 * メンバー登録画面で、あれば内容を確かめて使い、無ければ登録する（所属は選択肢の先頭。所属のマスタは足さない）。管理者IDを返す。
 * 権限は「システム管理者」（承認権限あり）か、承認権限の無い「店舗オペレーター」。
 */
export async function メンバーを用意する(page: Page, m: 管理者, v: { 所属店舗ID: string; 編集可能店舗ID: string[]; 権限?: string }): Promise<string> {
  const input: M0424MemberInput = {
    名前: m.名前, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password, 権限: v.権限 ?? "システム管理者",
    所属店舗ID: v.所属店舗ID, デフォルト検索表示店舗ID: v.所属店舗ID, 編集可能店舗ID: v.編集可能店舗ID,
  };
  return ensureMemberByStoreIds(page, input);
}

/** メンバー編集画面で、編集可能店舗に店舗を足して登録する（足し終わっていれば何もしない） */
export async function 編集可能店舗を足す(page: Page, 管理者ID: string, 店舗IDs: string[], what: string): Promise<void> {
  const edit = new MemberEditPage(page);
  await edit.編集を開く(管理者ID);
  const now = (await edit.選択中(edit.編集可能店舗欄)).値;
  const missing = 店舗IDs.filter((id) => !now.includes(id));
  if (missing.length === 0) return;
  await edit.入れる({ 編集可能店舗ID: [...now, ...missing] });
  const r = await edit.登録を押す();
  if (r.誤り.length) throw new Error(`${what}: メンバー編集の登録で誤りが出た（${r.誤り.join(" / ")}）`);
  await edit.編集を開く(管理者ID);
  const after = (await edit.選択中(edit.編集可能店舗欄)).値;
  const still = 店舗IDs.filter((id) => !after.includes(id));
  if (still.length) throw new Error(`${what}: 編集可能店舗に店舗ID ${still.join("・")} を足せていない`);
}

// ---------------------------------------------------------------- 商品と在庫

export type 在庫区分 = "EC-CUBE" | "スマレジ";
export type 商品の定め = { 商品コード: string; 商品名: string };
export type 入庫の定め = { 商品コード: string; 在庫区分: 在庫区分; 在庫増減数: number };

/**
 * 商品マスターに無い商品コードだけを、グッズ商品CSV登録で登録する（シード表①。購入グループは既存の「通常商品」・地域別販売制限0・スマレジ連携フラグ0）。
 * 商品カテゴリは、グッズ（番号2）の下の既存のカテゴリ（開発環境の決まり。依頼者 2026-11-10「開発環境に登録されているカテゴリが正」）。
 * 登録済みだった商品コードを返す（流し直しで、印を付けない商品コードが前の実行の商品に当たったとき）。
 * 「無いもの」の見分けは、商品マスターの検索の代わりに商品規格の商品コードを DB で読む（検索画面の一時的な誤りを「無い」と取り違えて二重に登録しない）。
 */
export async function 無い商品を登録する(page: Page, seedId: string, defs: 商品の定め[], ある: (商品コード: string) => boolean, issue: (m: string) => void): Promise<string[]> {
  const already = defs.filter((d) => ある(d.商品コード)).map((d) => d.商品コード);
  const todo = defs.filter((d) => !already.includes(d.商品コード));
  if (todo.length === 0) return already;
  const categoryId = await readExistingGoodsChildCategoryId(page);
  const flags = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
    common: { "購入グループ名称": "通常商品", ...flags },
    lines: todo.map((d) => ({ code: d.商品コード, nameJp: d.商品名, nameEn: d.商品名 })),
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
  });
  for (const d of todo) await openProductEditByCode(page, d.商品コード);
  return already;
}

let fileSeq = 0;

/**
 * 店舗・在庫区分ごとに、在庫変更CSV登録（入庫/その他・在庫変動理由「試験データ準備」・仕入単価0）で入庫し、
 * 別のメンバー（承認者）が在庫編集承認一覧で一括承認する（シード表③）。在庫数0の商品は入庫しない。
 */
export async function 入庫して承認する(browser: Browser, seedId: string, v: {
  登録者: 管理者; 承認者: 管理者; 店舗ID: string; 店名: string; 入庫: 入庫の定め[];
}, issue: (m: string) => void): Promise<void> {
  for (const zone of ["EC-CUBE", "スマレジ"] as const) {
    const rows = v.入庫.filter((r) => r.在庫区分 === zone && r.在庫増減数 > 0);
    if (rows.length === 0) continue;
    await withAdminSession(browser, v.登録者.account, (page) => registerStockChangeCsv(page, {
      店舗: v.店名, 在庫区分: zone, 在庫変動区分: "入庫/その他", 在庫変動理由: "試験データ準備", 承認者: v.承認者.名前,
      行: rows.map((r) => ({ 商品コード: r.商品コード, 在庫増減数: String(r.在庫増減数), 仕入単価: "0" })),
      ファイル名: `${seedId.toLowerCase()}-stock-${Date.now()}-${++fileSeq}.csv`,
    }, `${seedId}: 在庫変更CSV登録（${zone}・${rows.length}行）`, issue));
    const total = String(rows.reduce((s, r) => s + r.在庫増減数, 0));
    await withAdminSession(browser, v.承認者.account, async (page) => {
      page.setDefaultTimeout(60_000);
      const list = await openStockApprovalListForStore(page, v.店舗ID);
      const hit = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === v.登録者.名前
        && r.changeType.endsWith("入庫/その他") && r.quantity.replace(/[^\d-]/g, "") === total);
      if (hit.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、${v.登録者.名前} の在庫変更CSV登録（${zone}・合計 ${total}）の未承認の行が無い`);
      if (hit.length > 1) issue(`在庫編集承認一覧に、合計 ${total} の未承認の行が ${hit.length} 件あり、一覧の先頭を承認した`);
      await list.approve([hit[0].id], `${seedId}: 在庫変更CSV登録（${zone}）の承認`, issue);
    });
  }
}

/** 期待した在庫数になっているか（シード表④。在庫の行を読む関数を渡す） */
export function 在庫を確かめる(seedId: string, 読む: (商品コード: string, 在庫区分: 在庫区分) => number | null, want: 入庫の定め[]): void {
  const diff = want.map((w) => ({ w, got: 読む(w.商品コード, w.在庫区分) })).filter(({ w, got }) => got !== w.在庫増減数);
  if (diff.length) {
    throw new Error(`${seedId}: 入庫後の在庫が求める値でない（${diff.map(({ w, got }) => `${w.商品コード}の${w.在庫区分}在庫: ${got ?? "行が無い"}（求めるのは ${w.在庫増減数}）`).join(" / ")}）`);
  }
}

export { expect };
