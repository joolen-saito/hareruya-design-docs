/**
 * F06-02 本会員登録の画面シード。正本: cases/F06-02_seed_data.tsv
 *
 * - 「この秘密鍵を持つ会員は0件」（NOUSER）: シード表は「DBで0件を確認し、存在すれば試験データを削除する」と定める。DBへは書き込まない決まりのため、
 *   DBの参照で0件であることを確かめるだけにする（残っていれば止める）。秘密鍵は英数字だけの書式を確かめる値なので実行の印は付けない（正本の外の補い）。
 * - 本会員（REGULAR-004）: 仮会員機能（共有の設定）を有効にして、フロントの会員登録で仮会員を作り、届いた本登録のメールのURLは開かずに秘密鍵を控え、
 *   管理画面で会員ステータスを本会員にして保存する。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 仮会員でスマレジIDを持つ会員（LINKED-005・006）は、スマレジIDを画面で指定できずDBへ直接設定する作り方のため、実装しない。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { プレイヤーID } from "../db/f03_07";
import { 秘密鍵を持つ会員数 } from "../db/f06_02";
import { 仮会員機能が有効か } from "../db/f06_01";
import { available } from "../lib/db";
import { mailIds, waitForMailTo } from "../lib/mail";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { openEditFromResult, resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { readTempMember, setTempMember } from "../pages/admin/f06_masters";
import { EntryPage } from "../pages/front/f06_01_entry";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

// ---- 共有の設定: 仮会員機能（書き換える前の値を控え、ケースが終わるたびに戻す） ----
let 前の仮会員機能: boolean | null = null;
export async function 仮会員機能を戻す(browser: Browser): Promise<string> {
  if (前の仮会員機能 === null) return "";
  const 値 = 前の仮会員機能;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await setTempMember(page, 値); });
  if (!available) return "";
  const now = 仮会員機能が有効か();
  return now === 値 ? "" : `仮会員機能を ${値 ? "有効" : "無効"} に戻したが、DBの値は ${now ? "有効" : "無効"}`;
}

for (const [id, key] of [["S-F06-02-NOUSER-003", "F0602NOUSER003"], ["S-F06-02-NOUSER-022", "F0602NOUSER022"]] as const) {
  defineSeed(id, async () => {
    if (!available) { reportSeedIssue(id, "この環境はDB確認ができないため、秘密鍵の会員が0件であることを確かめていない"); return; }
    const n = 秘密鍵を持つ会員数(key);
    if (n !== 0) throw new Error(`秘密鍵 ${key} を持つ会員が開始時に ${n} 件ある`);
  });
}

defineSeed("S-F06-02-REGULAR-004", async ({ browser, notes }) => {
  const mail = mailOf("it-f0602-regular-004");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (前の仮会員機能 === null) 前の仮会員機能 = await readTempMember(page);
    await setTempMember(page, true);
  });
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 秘密鍵 = "";
  try {
    await hideDebugToolbar(context);
    const e = new EntryPage(await context.newPage());
    await e.open();
    await e.fill({
      姓: "結合", 名: "試験004", セイ: "ケツゴウ", メイ: "シケン", 生年月日: ["1990", "1", "1"], メール: mail, パスワード: "Passw0rd!F0602",
      国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "09062020004",
    });
    const before = await mailIds();
    const r = await e.同意する();
    if (!r.sent) throw new Error(`会員 ${mail} の登録: 「同意する」を押しても確認画面へ進めない`);
    await e.登録する();
    if (!e.完了画面か) throw new Error(`会員 ${mail} の登録が仮会員登録完了画面にならない（${e.path}）`);
    const m = await waitForMailTo(mail, before);
    const url = /https?:\/\/[^\s"'<>]+\/entry\/activate\/([0-9A-Za-z]+)/.exec(m.text);
    if (!url) throw new Error(`会員 ${mail} の仮会員登録のメール（${m.subject}）にアクティベート用URLが無い`);
    秘密鍵 = url[1];
  } finally { await context.close(); }
  notes.set("〔秘密鍵-F0602-004〕", 秘密鍵);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, mail);
    const id = await resultCustomerId(page, mail);
    if (!id) throw new Error(`会員 ${mail} が管理画面の会員検索一覧で1件に定まらない`);
    notes.set("〔会員ID-F0602-004〕", id);
    if (available) {
      const pid = プレイヤーID(id);
      if (!pid) throw new Error(`会員 ${mail} に選手情報が無い`);
      notes.set("〔選手情報ID-F0602-004〕", pid);
    } else { notes.set("〔選手情報ID-F0602-004〕", "（DB確認なし）"); }
    await openEditFromResult(page, mail);
    const ed = new M08CustomerEditPage(page);
    await ed.選ぶ("status", "本会員");
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${mail} を本会員にする保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
  });
});
