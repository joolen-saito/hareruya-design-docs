/**
 * M08（会員管理）のシードが共通で使う操作。
 * - 会員は、フロントの新規会員登録で作り（本登録のメールは手元の受け口で読む）、管理画面の会員一覧のメールアドレス検索で会員IDを控える。
 * - メールアドレスの前半には実行の印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。パスワードには付けない。
 * - 会員住所ID・本人確認情報IDは、画面に表示されない（正本もそう書く）ので、DBの参照（SELECT）で控える。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { フロントで会員登録する, M08登録値 } from "../pages/front/m08_member";

export const M08PW = "Passw0rd!M0804";
export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

export async function 会員IDを探す(browser: Browser, メール: string): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    return resultCustomerId(page, メール);
  });
  if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
  return id;
}

/** フロントで会員登録し、管理画面の会員一覧で会員IDを控える（呼び名は〔会員ID-…〕）。会員IDを返す */
export async function 会員を登録する(browser: Browser, notes: { set: (k: string, v: string) => void }, 前半: string, v: Omit<M08登録値, "メール" | "パスワード"> & { パスワード?: string }, 会員IDの呼び名?: string, 本登録しない = false): Promise<{ 会員ID: string; メール: string }> {
  const メール = mailOf(前半);
  await フロントで会員登録する(browser, { ...v, メール, パスワード: v.パスワード ?? M08PW }, 本登録しない);
  const 会員ID = await 会員IDを探す(browser, メール);
  if (会員IDの呼び名) notes.set(会員IDの呼び名, 会員ID);
  return { 会員ID, メール };
}

/** 管理画面（全権限のシード用の管理者）で、会員の会員登録/編集画面を開いて整える */
export async function 管理画面で会員を整える(browser: Browser, 会員ID: string, fn: (edit: M08CustomerEditPage) => Promise<void>): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const edit = new M08CustomerEditPage(page);
    const status = await edit.open(会員ID);
    if (status !== 200) throw new Error(`会員ID ${会員ID} の会員登録/編集画面を開けない（応答 ${status}）`);
    await fn(edit);
  });
}

// ---- M08-04 など: 会員を整える共通の流れ ----
import { 会員住所ID, 会員の保存内容, 本人確認情報ID } from "../db/m08_04";
import { Notes } from "../lib/notes";
import { SeedCtx } from "../lib/seeds";

export type 会員の用意 = {
  /** メールアドレスの前半（実行の印を付ける）。印を付けないメールアドレスを使うときは メール を与える */
  前半?: string;
  メール?: string;
  姓: string; 名: string; セイ: string; メイ: string;
  生年月日?: [string, string, string];
  会社名?: string; 住所1?: string; 住所2?: string; パスワード?: string;
  /** 管理画面の会員登録/編集画面で入れる項目（フォーム項目名 → 値） */
  文字?: Record<string, string>;
  /** 管理画面で選ぶ選択欄（フォーム項目名 → 表示） */
  選択?: Record<string, string>;
  /** 控える呼び名を絞る（シード表の文に別の会員の呼び名が出てくるとき） */
  控える呼び名?: (呼び名: string) => boolean;
  /** 会員ステータス（既定は本会員） */
  会員ステータス?: string;
  /** 管理画面で選ぶラジオ（フォーム項目名 → ラベル） */
  ラジオ?: Record<string, string>;
  本人確認?: { オンライン: true; 期限?: string; 簡易書留?: boolean; 確認中?: boolean } | { 確認中: true };
};

async function 保存を確かめる(edit: M08CustomerEditPage, 何: string): Promise<void> {
  const err = await edit.エラー文();
  if (err.length) throw new Error(`${何}: 保存できなかった: ${err.join(" / ")}`);
  if ((await edit.成功メッセージ()) === null) throw new Error(`${何}: 成功メッセージが表示されない`);
}

/** フロントで登録 → 管理画面で整える（本会員を選んで登録）→ 本人確認 → 呼び名を控える。会員IDを返す */
export async function 会員を用意する(ctx: SeedCtx, o: 会員の用意): Promise<{ 会員ID: string; メール: string }> {
  const { browser, seed, notes } = ctx;
  const メール = o.メール ?? mailOf(o.前半!);
  await フロントで会員登録する(browser, {
    姓: o.姓, 名: o.名, セイ: o.セイ, メイ: o.メイ, メール, パスワード: o.パスワード ?? M08PW,
    生年月日: o.生年月日 ?? ["1990", "1", "2"], 会社名: o.会社名,
    ...(o.住所1 ? { 住所1: o.住所1 } : {}), ...(o.住所2 ? { 住所2: o.住所2 } : {}),
  });
  const 会員ID = await 会員IDを探す(browser, メール);
  await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
    for (const [k, v] of Object.entries(o.文字 ?? {})) await edit.set(k, v);
    for (const [k, v] of Object.entries(o.選択 ?? {})) await edit.選ぶ(k, v);
    for (const [k, v] of Object.entries(o.ラジオ ?? {})) await edit.ラジオを選ぶ(k, v);
    await edit.選ぶ("status", o.会員ステータス ?? "本会員");
    await edit.登録する();
    await 保存を確かめる(edit, `${seed.シードID} 会員 ${メール} の登録`);
  });
  const 本人 = o.本人確認;
  if (本人 && "オンライン" in 本人) {
    await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
      await edit.オンライン本人確認済みにする(本人.期限);
    });
  }
  if (本人 && (("簡易書留" in 本人 && 本人.簡易書留) || ("確認中" in 本人 && 本人.確認中))) {
    const 値 = "簡易書留" in 本人 && 本人.簡易書留 ? "簡易書留確認済み" : "確認中";
    await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
      await edit.ラジオを選ぶ("Player][IdentityConfirmStatus", 値);
      await edit.登録する();
      await 保存を確かめる(edit, `${seed.シードID} 本人確認ステータスを${値}にする`);
    });
  }
  if (本人) {
    const 期待 = "簡易書留" in 本人 && 本人.簡易書留 ? "簡易書留確認済み" : "確認中" in 本人 && 本人.確認中 ? "確認中" : "オンライン本人確認済み";
    const 実際 = 会員の保存内容(会員ID)?.本人確認ステータス;
    if (実際 !== 期待) throw new Error(`${seed.シードID} 会員 ${メール} の本人確認ステータスが「${実際}」（求めるのは「${期待}」）`);
  }
  呼び名を控える(seed, notes, 会員ID, o.控える呼び名);
  return { 会員ID, メール };
}

/** シード表の状態・属性・投入方法にある呼び名を控える。会員ID・本人確認情報ID・会員住所ID（後の2つは画面に表示されないので、DBの参照で控える） */
export function 呼び名を控える(seed: { 状態・属性: string; 投入方法: string }, notes: Notes, 会員ID: string, 絞り?: (l: string) => boolean): void {
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    if (絞り && !絞り(l)) continue;
    if (/^〔会員ID-/.test(l)) notes.set(l, 会員ID);
    else if (/^〔本人確認情報ID-/.test(l)) {
      const v = 本人確認情報ID(会員ID);
      if (!v) throw new Error(`会員ID ${会員ID} の本人確認情報IDをDBの参照で控えられない`);
      notes.set(l, v);
    } else if (/^〔会員住所ID-/.test(l)) {
      const v = 会員住所ID(会員ID);
      if (!v) throw new Error(`会員ID ${会員ID} の会員住所IDをDBの参照で控えられない`);
      notes.set(l, v);
    }
  }
}
