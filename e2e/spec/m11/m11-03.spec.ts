/**
 * M11-03 権限管理（開発環境で作れる 028・036）。ケースの正本: integration_test/casegen/cases/M11-03_test_cases.tsv
 * 034・035・041・023 は、E2E が足した試験用の権限グループ（拒否URLだけ DB で足したもの。seeds/m11-03.ts）で作った管理者で確かめる。
 * ほかのケースは、権限URLマスターを全件消して置き換える前提・身分証画像を使う前提・アプリに無い画面（/product/list）や
 * 左ナビの項目（「商品管理閲覧」「商品登録・編集」）の有無で確かめる前提なので作っていない（review/recheck_not_buildable_M11-03.tsv・
 * review/M11-03_progress_2026-11-11_dev.md）。
 * どちらのケースも、ケースのブラウザは管理画面にログインしていない（新しいブラウザのセッション）ことで「管理画面からログアウトした状態」を作る。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 権限管理画面のURLを開く, 開いた結果, 左ナビの第1階層, 管理画面のパスを開く, アドレスを開いた結果 } from "../../pages/admin/m11_03_authority";
import { LoginPage } from "../../pages/front/f06_03_login";
import { M1103_036, M1103_036のメール, M1103のアカウント } from "../../seeds/m11-03";

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

// ---- 権限グループ・拒否設定（E2E が足した権限）----

/** 拒否の確かめ: 画面が表示されない＝応答が成功でない、またはログイン画面へ移った */
const 表示されない = (r: アドレスを開いた結果 | null): boolean => !!r && (r.応答 >= 400 || r.ログイン画面か);

caseTest("IT-M11-03-034", async ({ page, step, expected }) => {
  let r: アドレスを開いた結果 | null = null;
  let 実在の画面: アドレスを開いた結果 | null = null;
  await step(1, async () => { await loginAdmin(page, M1103のアカウント("S-M11-03-PREFIX-034")); });
  await step(2, async () => {
    r = await 管理画面のパスを開く(page, "/product/list");
    note(`「/product/list」の応答: ${r.応答}・移った先 ${r.パス}`);
    // 参考（合否に使わない）: 拒否URL「/product」の配下の実在の画面（商品一覧は /product）も拒否されているか
    実在の画面 = await 管理画面のパスを開く(page, "/product");
    note(`参考: 拒否URL配下の実在の画面「/product」（商品一覧）の応答: ${実在の画面.応答}・移った先 ${実在の画面.パス}。「/product/list」はアプリに無い画面なので、拒否によるのか画面が無いのかは、この参考の結果で見る`);
  });
  await expected(async () => {
    expect.soft(表示されない(r), "拒否URL「/product」の配下の「/product/list」が表示されない").toBe(true);
  });
});

caseTest("IT-M11-03-035", async ({ page, step, expected }) => {
  let r: アドレスを開いた結果 | null = null;
  await step(1, async () => { await loginAdmin(page, M1103のアカウント("S-M11-03-CASE-035")); });
  await step(2, async () => {
    r = await 管理画面のパスを開く(page, "/product/list");
    note(`小文字の「/product/list」の応答: ${r.応答}・移った先 ${r.パス}。この画面はアプリに無く、拒否によるのか画面が無いのかは、この結果だけでは分からない`);
  });
  await expected(async () => {
    expect.soft(表示されない(r), "拒否URL「/PRODUCT/LIST」と大文字小文字が違う「/product/list」が表示されない").toBe(true);
  });
});

caseTest("IT-M11-03-023", async ({ page, step, expected }) => {
  let r: アドレスを開いた結果 | null = null;
  await step(1, async () => { await loginAdmin(page, M1103のアカウント("S-M11-03-VIEW-ONLY-023")); });
  await step(2, async () => {
    r = await 管理画面のパスを開く(page, "/product/list");
    note(`「/product/list」の応答: ${r.応答}・移った先 ${r.パス}`);
  });
  await expected(async () => {
    expect.soft(r?.応答, "商品管理閲覧画面「/product/list」が表示される（応答が成功）").toBe(200);
    expect.soft(r?.ログイン画面か, "ログイン画面へ移らない").toBe(false);
  });
});

caseTest("IT-M11-03-041", async ({ page, step, expected }) => {
  let 見出し: string[] = [];
  await step(1, async () => { await loginAdmin(page, M1103のアカウント("S-M11-03-DPNAV-041")); });
  await step(2, async () => {
    見出し = await 左ナビの第1階層(page);
    note(`左ナビゲーションの第1階層: ${見出し.join("、")}`);
  });
  await expected(async () => {
    expect.soft(見出し.includes("商品管理"), "拒否URL「/product」に当たる「商品管理」が表示されない（表示されている＝true）").toBe(false);
    expect.soft(見出し.includes("受注管理"), "拒否URLに当たらない「受注管理」が表示される").toBe(true);
    expect.soft(見出し.includes("イベント管理"), "拒否URLに当たらない「イベント管理」が表示される").toBe(true);
  });
});
