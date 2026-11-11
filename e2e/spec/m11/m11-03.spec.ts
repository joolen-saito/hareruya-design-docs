/**
 * M11-03 権限管理（開発環境で作れる 028・036）。ケースの正本: integration_test/casegen/cases/M11-03_test_cases.tsv
 * ほかのケースは、全員が使う権限のマスタ（権限URLマスター・権限グループ・拒否設定）を消す・足す・書き換える前提なので作っていない
 * （review/recheck_not_buildable_M11-03.tsv）。
 * どちらのケースも、ケースのブラウザは管理画面にログインしていない（新しいブラウザのセッション）ことで「管理画面からログアウトした状態」を作る。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { 権限管理画面のURLを開く, 開いた結果 } from "../../pages/admin/m11_03_authority";
import { LoginPage } from "../../pages/front/f06_03_login";
import { M1103_036, M1103_036のメール } from "../../seeds/m11-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M11-03-028", async ({ page, step, expected }) => {
  let r: 開いた結果 | null = null;
  note("管理画面にログインしていない新しいブラウザのセッションで開いた（事前準備の「認証情報を持たない状態」）");
  await step(1, async () => { r = await 権限管理画面のURLを開く(page); });
  await expected(async () => {
    expect.soft(r?.権限管理の表があるか, "権限管理画面（権限の表）が表示されない").toBe(false);
    expect.soft(r?.ログイン画面か, "管理画面のログイン画面が表示される").toBe(true);
    expect.soft(r?.パス ?? "", "移った先は管理画面のログイン画面").toMatch(/\/login\/?$/);
  });
});

caseTest("IT-M11-03-036", async ({ page, step, expected }) => {
  let r: 開いた結果 | null = null;
  let ログイン後のパス = "";
  note("管理画面にログインしていない新しいブラウザのセッションで、フロントにだけログインした");
  await step(1, async () => {
    const l = new LoginPage(page);
    await l.ログイン画面を開く();
    await l.ログインする(M1103_036のメール(), M1103_036.パスワード);
    ログイン後のパス = l.path();
    expect(await l.ログイン画面である(), `フロントにログインできた（移った先 ${ログイン後のパス}）`).toBe(false);
  });
  await step(2, async () => { r = await 権限管理画面のURLを開く(page); });
  await expected(async () => {
    expect.soft(r?.権限管理の表があるか, "権限管理画面（権限の表）が表示されない").toBe(false);
    expect.soft(r?.ログイン画面か, "管理画面のログイン画面が表示される").toBe(true);
    expect.soft(r?.パス ?? "", "移った先は管理画面のログイン画面").toMatch(/\/login\/?$/);
  });
});
