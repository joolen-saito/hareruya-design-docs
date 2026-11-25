/**
 * M11-02 メンバー管理（追加分: 007・025）。正本: cases/M11-02_test_cases.tsv
 * 007: メンバー編集を断る権限は、E2E が足した権限グループにメンバーの新規登録画面の拒否URLだけを足して作った（seeds/m11-02-r.ts）。
 * 025: ログインID「A」×255文字は、023 と同じ値になるので、前のケースのメンバーは先に消す（シードの注記）。終わったあとも消して、023 を流せる状態に戻す。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { メンバーIDのメンバー } from "../../db/m11_02";
import { 管理画面のパスを開く } from "../../pages/admin/m11_03_authority";
import { MemberEditPage } from "../../pages/admin/m11_02_member";
import { 試験管理者 } from "../../seeds/m11-02";
import { M1103のアカウント } from "../../seeds/m11-03";
import { 長いログインID, 長い名前, 長いメール, 長いログインIDのメンバーを片付ける } from "../../seeds/m11-02-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-M11-02-007", async ({ page, step, expected }) => {
  let 応答 = 0, 操作できる = true, 登録ボタンの数 = -1;
  await step(1, async () => {
    await loginAdmin(page, M1103のアカウント("S-M11-02-NOEDIT"));
    const r = await 管理画面のパスを開く(page, "/setting/system/member/new");
    応答 = r.応答;
    note(`メンバーの新規登録画面（/setting/system/member/new）の応答: ${r.応答}・移った先 ${r.パス}`);
  });
  await step(2, async () => {
    const e = new MemberEditPage(page);
    登録ボタンの数 = await e.登録ボタン.count();
    操作できる = 登録ボタンの数 > 0 && (await e.登録ボタン.first().isVisible()) && (await e.登録ボタン.first().isEnabled());
    note(`登録ボタンの数: ${登録ボタンの数}・操作できる状態か: ${操作できる}`);
  });
  await expected(async () => {
    supplement("「メンバー編集権限なし」は、権限グループに、メンバー管理の新規登録画面の拒否URL（/setting/system/member/new）を足して作った（開発環境にメンバー編集だけを断る権限が無いため）。画面が拒否されて開かないときも、登録ボタンが操作可能な状態で表示されない");
    expect.soft(操作できる, "登録ボタンが操作可能な状態で表示されない").toBe(false);
  });
});

caseTest("IT-M11-02-025", async ({ page, notes, browser, step, expected }) => {
  await loginAdmin(page, 試験管理者);
  const p = new MemberEditPage(page);
  const id = notes.get("〔メンバーID-M1102-025〕");
  const 前 = メンバーIDのメンバー(id);
  if (!前) throw new Error(`メンバーID ${id} が DB に無い`);
  const pw = "Ab12".repeat(63) + "Ab1";
  let 後 = null as ReturnType<typeof メンバーIDのメンバー>;
  await step(1, async () => { await p.編集を開く(id); });
  await step(2, async () => { await p.入れる({ 名前: 長い名前, ログインID: 長いログインID, メールアドレス: 長いメール, パスワード: pw }); });
  await step(3, async () => {
    const r = await p.登録を押す();
    note(`登録を押した結果: 要求 ${r.送った ? `送った（応答 ${r.状態}）` : "送られなかった"}・移った先 ${r.path}${r.誤り.length ? `・誤り ${r.誤り.join(" / ")}` : ""}`);
  });
  await step(4, async () => { 後 = メンバーIDのメンバー(id); });
  await expected(async () => {
    expect.soft(後?.名前.length, "名前の文字数（255）").toBe(255);
    expect.soft(後?.名前, "名前が 255文字の値で更新される").toBe(長い名前);
    expect.soft(後?.ログインID, "ログインIDが 255文字の値で更新される").toBe(長いログインID);
    expect.soft(後?.メール, "メールアドレスが 255文字の値で更新される").toBe(長いメール);
    expect.soft(!!後 && 後.パスワード !== 前.パスワード && 後.パスワード !== pw && 後.パスワード.length >= 32, "パスワード保存値が変更前とは異なるハッシュ値になる").toBe(true);
  });
  // 後始末: 次の 023 を流せるよう、特徴のそろった E2E のメンバーを消す（合否には使わない）
  try { await 長いログインIDのメンバーを片付ける(browser, "IT-M11-02-025 の後始末"); note("後始末: ログインID「A」×255のメンバーを消した"); }
  catch (e) { note(`後始末ができなかった: ${(e as Error).message}`); }
});
