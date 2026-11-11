/**
 * M09-07 ブロック管理 のシード（実装したケースが使うもの）。正本: cases/M09-07_seed_data.tsv
 * - ブロック名・ファイル名は決め打ちの識別の値なので、実行の印を付ける（依頼者決定 2026-10-28）。値はシード表の「投入方法」の入力値から読む。
 *   ブロックのファイル名は半角英数字・スラッシュ・アンダースコアだけが使えるので、印はアンダースコアで付け、値の「-」もアンダースコアにした
 *   （シードの値「user_data/m0907-045-en」などは、そのままでは登録できない）。
 * - 「DBへ直接設定」（削除不可・SP向け）を作り方とするシード、「DBで一時退避」「DBで削除」を要するシードを使うケースは実装しない。
 * - 「ブロック管理機能の有効化・利用可能言語」（ENV）は設定画面が無い。ブロック管理が開けて、日本語・英語の切り替えが出ることを確かめるだけにした。
 * - 「あれば画面から削除して0件にする」シードのうち、値そのものを確かめるもの（最大255文字・使用可能文字）だけ、画面から削除する。
 */
import { expect } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { SETUP_ADMIN } from "../config/env";
import { Account, withAdminSession } from "../lib/session";
import { ブロック管理 } from "../pages/admin/m09_07_block";
import { ensureAnalysisAdmin } from "./m12-common";

export const M0907_ADMIN: Account = { loginId: "m0907_admin", password: "Passw0rd!M0907" };

export const ブロック名の識別 = (v: string) => rc(v);
/** ファイル名に実行の印を付ける（使える文字だけにする）。正本の値の「-」はアンダースコアにする */
export const ファイル名の識別 = (v: string) => rc(v).replace(/-/g, "_");

export type シードのブロック = { ラベル: string; ブロック名: string; ファイル名: string; 日本語コード: string; 英語コード?: string };

/** シード表の投入方法から、作るブロック（作る順）を読む。値には実行の印を付ける */
export function シードのブロック群(seedId: string): シードのブロック[] {
  const s = getSeed(seedId);
  const triples = [...s.投入方法.matchAll(/ブロック名に「([^」]+)」、ファイル名に「([^」]+)」、コードに「([^」]*)」/g)];
  const labels = [...s.投入方法.matchAll(/控える（(〔[^〕]+〕)）/g)].map((m) => m[1]);
  const en = s["状態・属性"].split("／").find((x) => x.startsWith("英語コード="))?.slice("英語コード=".length);
  if (!triples.length || triples.length !== labels.length) throw new Error(`${seedId} の作り方から、作るブロックと控える番号を読めない`);
  return triples.map((t, i) => ({ ラベル: labels[i], ブロック名: ブロック名の識別(t[1]), ファイル名: ファイル名の識別(t[2]), 日本語コード: t[3], 英語コード: triples.length === 1 ? en : undefined }));
}

export async function ブロックを作る(browser: import("@playwright/test").Browser, notes: { set(l: string, v: string): void }, seedId: string): Promise<void> {
  const list = シードのブロック群(seedId);
  await withAdminSession(browser, M0907_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ba = new ブロック管理(page);
    for (const b of list) {
      const id = await ba.作る({ ブロック名: b.ブロック名, ファイル名: b.ファイル名, コード: b.日本語コード, 言語: "ja" });
      notes.set(b.ラベル, id);
      if (b.英語コード !== undefined) {
        // 続けてその編集画面で言語の英語を選び、コードを書き換えて登録する
        await ba.言語を選ぶ("英語");
        await ba.コードを入れる(b.英語コード);
        const r = await ba.登録して結果を読む();
        if (!r.成功) throw new Error(`${seedId}: 英語のコードを登録できない: ${r.入力エラー.join(" / ")}`);
      }
    }
  });
}

defineSeed("S-M09-07-ENV", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const ba = new ブロック管理(page);
    await ba.一覧を開く();
    expect(await page.locator("li.list-group-item[id^='ex-block-']").count(), "ブロック管理(一覧)が開け、ブロックが読み込まれている").toBeGreaterThan(0);
    await ba.新規画面を開く("ja");
    await expect(page.locator("label[for='locale-ja']"), "日本語の言語切り替え").toBeVisible();
    await expect(page.locator("label[for='locale-en']"), "英語の言語切り替え").toBeVisible();
  });
  reportSeedIssue("S-M09-07-ENV", "ブロック管理機能の有効化・利用可能言語の設定画面が無いので、ブロック管理が開けて日本語・英語の切り替えが出ることを確かめるだけにした（初期の設定のまま）");
});
defineSeed("S-M09-07-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M09-07試験管理者", account: M0907_ADMIN, メール: "m0907_admin@example.test" });
});

/** 画面から作る、ブロックのシード */
const 作る = "LIST-005 LIST-006 LIST-008 LIST-009 DELETE-011 DELETE-012 MISSING-015 EDIT-016 EDIT-018 EDIT-019 EDIT-020 DUPLICATE-032 DUPLICATE-034 EDIT-036 EDIT-037 OUTSIDE-042 OUTSIDE-043 DPEN-045 CBCANCEL-048".split(" ");
for (const key of 作る) {
  defineSeed(`S-M09-07-${key}`, { needs: ["S-M09-07-ADM"] }, async ({ browser, notes }) => { await ブロックを作る(browser, notes, `S-M09-07-${key}`); });
}

/** 登録前状態。値そのものを確かめる2つ（最大255文字・使用可能文字）は印を付けないので、前回の残りがあれば画面から削除する（シード表のとおり） */
async function 画面から削除して0件にする(browser: import("@playwright/test").Browser, 語: string[]): Promise<void> {
  await withAdminSession(browser, M0907_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ba = new ブロック管理(page);
    for (const w of 語) {
      for (let i = 0; i < 5; i++) {
        await ba.一覧を開く();
        await ba.検索する(w);
        const n = await ba.見えている行.count();
        if (n === 0) break;
        const id = ((await ba.見えている行.first().getAttribute("id")) ?? "").replace("ex-block-", "");
        await ba.削除確認を開く(id);
        await ba.モーダルで削除する(id);
      }
      await ba.一覧を開く();
      await ba.検索する(w);
      expect(await ba.見えている行.count(), `一覧に「${w.slice(0, 20)}…」を含む行が無い`).toBe(0);
    }
  });
}
async function 印つきが0件(browser: import("@playwright/test").Browser, 語: string[]): Promise<void> {
  await withAdminSession(browser, M0907_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ba = new ブロック管理(page);
    await ba.一覧を開く();
    expect(await ba.全行.count(), "ブロック管理(一覧)が読み込まれている").toBeGreaterThan(0);
    for (const w of 語) {
      await ba.検索する(w);
      expect(await ba.見えている行.count(), `一覧に「${w}」を含む行が無い`).toBe(0);
    }
  });
}
defineSeed("S-M09-07-NEW-022", { needs: ["S-M09-07-ADM"] }, async ({ browser }) => { await 画面から削除して0件にする(browser, ["a".repeat(255), "あ".repeat(255)]); });
defineSeed("S-M09-07-NEW-024", { needs: ["S-M09-07-ADM"] }, async ({ browser }) => { await 画面から削除して0件にする(browser, ["使用可能文字ブロック", "user_data/test_123/ABC"]); });
defineSeed("S-M09-07-NEW-028", { needs: ["S-M09-07-ADM"] }, async ({ browser }) => { await 印つきが0件(browser, [ブロック名の識別("遷移確認ブロック"), ファイル名の識別("user_data/transition_block")]); });
defineSeed("S-M09-07-CBNEW-046", { needs: ["S-M09-07-ADM"] }, async ({ browser }) => { await 印つきが0件(browser, [ブロック名の識別("新規登録日本語-M0907-CB046"), ファイル名の識別("user_data/m0907_cb046_file")]); });
defineSeed("S-M09-07-CBNEW-047", { needs: ["S-M09-07-ADM"] }, async ({ browser }) => { await 印つきが0件(browser, [ブロック名の識別("新規登録英語-M0907-CB047"), ファイル名の識別("user_data/m0907_cb047_file")]); });
