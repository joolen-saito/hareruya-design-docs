/**
 * M10-08 自動送信メールテンプレート編集。正本: cases/M10-08_test_cases.tsv
 * 共有のテンプレートは書き換えない。検証用の自動送信メールのテンプレートを、E2E が作る行としてDBへ足し（seeds/m10-08.ts）、基盤がケースの終わりに必ず消す。
 * 実装: 001・002・004〜008・010〜012・015〜022・024〜032。実装しない: 009（削除済みの管理者を作れない）・013・014（本文の固定部分は雛形のファイルで決まり、シードで作れない）。
 * 手順の注記（アプリの作りに合わせた読み替え）:
 * - 画面は店舗で切り替えられない共有の画面。テンプレ選択の選択肢は自動送信メールだけ（自動送信ではない「D通常テンプレート」は選べない）。
 * - 新規作成の画面は無く、テンプレート未選択では「登録」ボタンが出ない。024・025 は件名の欄で Enter を押して送信を試み、026 はフォームを直接送る。
 * - 最終更新日の表示は「2026-08-01 09:10:11」の形。年月日と時分秒の数字がそろっているかで確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { 今との差, テンプレートの総数, テンプレートを読む, 管理者の番号 } from "../../db/m10_08_mail";
import { loginAdmin } from "../../lib/session";
import { AutoMailPage, 並べる, 日時の数字 } from "../../pages/admin/m10_08_automail";
import { M1008_ADMIN, M1008_太郎 } from "../../seeds/m10-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 設定ボタンを押し、送信が送られて応答の画面へ移ったことを確かめる（送られずに「更新されない」「戻る」では確かめにならない） */
async function 設定を送る(p: AutoMailPage): Promise<number> {
  const st = await p.設定を押して待つ();
  expect(st, "設定ボタンの送信が送られた（送信の応答がある）").not.toBeNull();
  return st ?? 0;
}
const 四項目 = ["最終更新者", "最終更新日", "本文上部", "本文下部"];

// ---- 表示 ----
caseTest("IT-M10-08-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  const 出ている: Record<string, boolean> = {};
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    出ている["テンプレ選択"] = await p.テンプレ選択.isVisible();
    出ている["テンプレ名称"] = await p.名称.isVisible();
    出ている["件名"] = await p.件名.isVisible();
    for (const k of 四項目) 出ている[k] = await p.項目がある(k);
  });
  await expected(async () => {
    for (const k of ["テンプレ選択", "テンプレ名称", "件名"]) expect.soft(出ている[k], `${k}が表示される`).toBe(true);
    for (const k of 四項目) expect.soft(出ている[k], `${k}は表示されない`).toBe(false);
  });
});

caseTest("IT-M10-08-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { 選択肢 = await p.選択肢(); });
  await expected(async () => {
    for (const n of ["A自動テンプレート", "B自動テンプレート", "C自動テンプレート", "D通常テンプレート"]) expect.soft(選択肢.includes(n), `選択肢に「${n}」が表示される`).toBe(true);
  });
});

caseTest("IT-M10-08-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  const 出ている: Record<string, boolean> = {};
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選ぶ("B自動テンプレート"); for (const k of 四項目) 出ている[k] = await p.項目がある(k); });
  await expected(async () => { for (const k of 四項目) expect.soft(出ている[k], `${k}が表示される`).toBe(true); });
});

caseTest("IT-M10-08-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  const 出ている: Record<string, boolean> = {};
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.選ぶ("D通常テンプレート"); for (const k of 四項目) 出ている[k] = await p.項目がある(k); });
  await expected(async () => { for (const k of 四項目) expect.soft(出ている[k], `「D通常テンプレート」の${k}が表示される`).toBe(true); });
});

caseTest("IT-M10-08-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let status = 0;
  await step(1, async () => { status = await p.開く(10801); });
  await expected(async () => {
    expect.soft(status, "識別子10801を指定した要求のHTTPステータス").toBe(200);
    expect.soft(await p.名称.inputValue(), "編集対象のテンプレ名称").toBe("B自動テンプレート");
  });
});

caseTest("IT-M10-08-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let status = 0;
  await step(1, async () => { status = await p.開く(999999); });
  await expected(async () => {
    expect.soft(status, "識別子999999を指定した要求のHTTPステータス").toBe(404);
    expect.soft(await p.名称.count(), "識別子999999の編集画面（テンプレ名称の欄）が表示されない").toBe(0);
  });
});

// ---- 最終更新者・最終更新日 ----
caseTest("IT-M10-08-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 更新者 = "";
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { 更新者 = await p.行の値("最終更新者"); });
  // 正本の「試験 太郎」は、名前が開発環境で重なるため決まった印を付けた「試験 太郎-E2E」で作っている（seeds/m10-08.ts）。表示名をその名前に読み替える
  await expected(async () => { expect.soft(更新者, `最終更新者が「${M1008_太郎}」（正本の「試験 太郎」）`).toBe(M1008_太郎); });
});

caseTest("IT-M10-08-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 欄 = false; let 値 = "";
  await p.開く();
  await step(1, async () => { await p.選ぶ("F更新者未記録テンプレート"); });
  await step(2, async () => { 欄 = await p.項目がある("最終更新者"); if (欄) 値 = await p.行の値("最終更新者"); });
  await expected(async () => {
    expect.soft(欄, "最終更新者欄が表示される").toBe(true);
    expect.soft(値, "管理者の名称は表示されない").toBe("");
  });
});

caseTest("IT-M10-08-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 日時 = "";
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { 日時 = await p.行の値("最終更新日"); note(`最終更新日の表示: ${日時}`); });
  await expected(async () => { expect.soft(日時の数字(日時), "最終更新日（2026年8月1日9時10分11秒）の年月日と時分秒").toEqual([2026, 8, 1, 9, 10, 11]); });
});

caseTest("IT-M10-08-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 欄 = false; let 日時 = "";
  await p.開く();
  await step(1, async () => { await p.選ぶ("G旧更新日テンプレート"); });
  await step(2, async () => { 欄 = await p.項目がある("最終更新日"); if (欄) 日時 = await p.行の値("最終更新日"); note(`最終更新日の表示: ${日時}`); });
  await expected(async () => {
    expect.soft(欄, "最終更新日欄が表示される").toBe(true);
    expect.soft(JSON.stringify(日時の数字(日時)) === JSON.stringify([2018, 12, 31, 23, 59, 59]), "2018年12月31日23時59分59秒の値は表示されない").toBe(false);
  });
});

// ---- 更新 ----
caseTest("IT-M10-08-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-015"); });
  await step(2, async () => { await p.入れる({ 名称: "更新後テンプレートＡ1", 件名: "更新後Subject123", 本文上部: "更新後本文上部123", 本文下部: "更新後本文下部123" }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => { r = テンプレートを読む(10801015); });
  await expected(async () => {
    expect.soft(r?.名称, "テンプレ名称").toBe("更新後テンプレートＡ1");
    expect.soft(r?.件名, "件名").toBe("更新後Subject123");
    expect.soft(r?.本文上部, "本文上部").toBe("更新後本文上部123");
    expect.soft(r?.本文下部, "本文下部").toBe("更新後本文下部123");
  });
});

caseTest("IT-M10-08-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-016"); });
  await step(2, async () => { await p.入れる({ 件名: "遷移確認件名" }); });
  await step(3, async () => { await 設定を送る(p); });
  await expected(async () => {
    expect.soft(p.パス.endsWith("/mall/auto_mail/10801016"), `識別子10801-016の編集画面へ戻る（${p.パス}）`).toBe(true);
    // 押す前も同じアドレスの画面なので、保存して戻った画面であることを「保存しました」で見る
    await expect.soft(p.成功の表示, "保存して戻った編集画面（保存しました）").toContainText("保存しました");
  });
});

caseTest("IT-M10-08-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-017"); });
  await step(2, async () => { await p.入れる({ 件名: "更新履歴確認件名" }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => { r = テンプレートを読む(10801017); });
  await expected(async () => {
    expect.soft(r?.更新者ID, `最終更新者がログイン中の管理者「${M1008_太郎}」（正本の「試験 太郎」）`).toBe(管理者の番号(M1008_ADMIN.loginId));
    expect.soft(r ? 今との差(r.更新日時) < 600 : false, `最終更新日が設定ボタンを押した現在日時に更新される（${r?.更新日時}）`).toBe(true);
  });
});

caseTest("IT-M10-08-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-018"); });
  await step(2, async () => { await p.入れる({ 名称: 並べる("あ", 255), 件名: 並べる("A", 255) }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => { r = テンプレートを読む(10801018); });
  await expected(async () => {
    expect.soft(r?.名称, "テンプレ名称（255文字）").toBe(並べる("あ", 255));
    expect.soft(r?.件名, "件名（255文字）").toBe(並べる("A", 255));
  });
});

caseTest("IT-M10-08-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { await p.入れる({ 名称: 並べる("あ", 256), 件名: 並べる("A", 256) }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => { r = テンプレートを読む(10801); });
  await expected(async () => {
    expect.soft(r?.名称, "テンプレ名称（更新されない）").toBe("B自動テンプレート");
    expect.soft(r?.件名, "件名（更新されない）").toBe("B更新前件名");
  });
});

caseTest("IT-M10-08-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 名称 = ""; let 件名 = ""; let 上部 = ""; let 下部 = "";
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { await p.入れる({ 名称: 並べる("あ", 256), 件名: 並べる("A", 256), 本文上部: "登録試行上部", 本文下部: "登録試行下部" }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => {
    名称 = await p.名称.inputValue(); 件名 = await p.件名.inputValue(); 上部 = await p.本文上部.inputValue(); 下部 = await p.本文下部.inputValue();
  });
  await expected(async () => {
    expect.soft(名称, "テンプレ名称は登録しようとした256文字の値").toBe(並べる("あ", 256));
    expect.soft(件名, "件名は登録しようとした256文字の値").toBe(並べる("A", 256));
    expect.soft(上部, "本文上部は保存済みの値").toBe("B保存済み上部");
    expect.soft(下部, "本文下部は保存済みの値").toBe("B保存済み下部");
  });
});

caseTest("IT-M10-08-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-021"); });
  await step(2, async () => { await p.入れる({ 本文上部: 並べる("あ", 32768), 本文下部: 並べる("A", 32768) }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => { r = テンプレートを読む(10801021); });
  await expected(async () => {
    expect.soft(r?.本文上部.length, "本文上部の文字数").toBe(32768);
    expect.soft(r?.本文下部.length, "本文下部の文字数").toBe(32768);
  });
});

caseTest("IT-M10-08-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { await p.入れる({ 本文上部: 並べる("あ", 32769), 本文下部: 並べる("A", 32769) }); });
  await step(3, async () => { await 設定を送る(p); });
  await step(4, async () => { r = テンプレートを読む(10801); });
  await expected(async () => {
    expect.soft(r?.本文上部, "本文上部（更新されない）").toBe("B保存済み上部");
    expect.soft(r?.本文下部, "本文下部（更新されない）").toBe("B保存済み下部");
  });
});

// ---- 新規作成の試み ----
caseTest("IT-M10-08-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let 前 = 0; let 後 = 0;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.入れる({ 名称: "新規作成試行", 件名: "新規作成試行件名" }); });
  await step(3, async () => {
    前 = テンプレートの総数();
    let 送った = 0;
    const on = (r: import("@playwright/test").Request) => { if (r.method() === "POST" && r.url().includes("/mall/auto_mail")) 送った++; };
    page.on("request", on);
    const 文 = await p.未選択で送信を試みる();
    page.off("request", on);
    note(`画面の警告: ${文 || "（出なかった）"}・送信 ${送った} 件`);
    // 送信を試みたこと（画面の送信の処理が動いて警告を出した、または送信が送られた）を見る。何も起きずに「増えない」では確かめにならない
    expect(文 !== "" || 送った > 0, "送信を試みた（画面の警告が出たか、送信が送られた）").toBe(true);
  });
  await step(4, async () => { 後 = テンプレートの総数(); });
  await expected(async () => { expect.soft(後, "メールテンプレートの件数（押す前から増えない）").toBe(前); });
});

caseTest("IT-M10-08-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r = { 送った: -1, 文: "" };
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.入れる({ 名称: "新規作成試行", 件名: "新規作成試行件名" }); });
  await step(3, async () => {
    r = await p.未選択で設定を押す();
    // 正本の期待結果は「送信されず、未選択の画面に留まる」だけ。警告の有無は確かめない（記録だけ残す）
    note(`設定ボタンを押したあとの送信（POST） ${r.送った} 件・画面の警告: ${r.文 || "（出なかった）"}`);
  });
  await expected(async () => {
    expect.soft(r.送った, "設定ボタンを押しても送信（POST）されない").toBe(0);
    expect.soft(p.パス, "テンプレート未選択の自動送信メールテンプレート編集画面（/mall/auto_mail）に留まる").toMatch(/\/mall\/auto_mail\/?$/);
    await expect.soft(p.テンプレ選択, "テンプレートは未選択のまま").toHaveValue("");
    await expect.soft(p.名称, "入力したテンプレ名称が残っている（画面が送られず留まった）").toHaveValue("新規作成試行");
  });
});

caseTest("IT-M10-08-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let status = 0;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.送信を止める処理を外す(); });
  await step(3, async () => { status = (await p.フォームを送る())?.status() ?? 0; });
  await expected(async () => { expect.soft(status, "HTTPステータス（500のエラー応答）").toBe(500); });
});

// ---- 更新者の記録・トークン ----
caseTest("IT-M10-08-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { await p.入れる({ 件名: "トークン欠落更新" }); });
  await step(3, async () => { await p.トークンを消す(); });
  await step(4, async () => { await 設定を送る(p); });
  await step(5, async () => { r = テンプレートを読む(10801); });
  await expected(async () => { expect.soft(r?.件名, "識別子10801の件名（更新されない）").toBe("B更新前件名"); });
});

caseTest("IT-M10-08-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { await p.入れる({ 件名: "トークン改ざん更新" }); });
  await step(3, async () => { await p.トークンを書き換える("invalid-token"); });
  await step(4, async () => { await 設定を送る(p); });
  await step(5, async () => { r = テンプレートを読む(10801); });
  await expected(async () => { expect.soft(r?.件名, "識別子10801の件名（更新されない）").toBe("B更新前件名"); });
});

caseTest("IT-M10-08-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let status = 0;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート"); });
  await step(2, async () => { await p.トークンを書き換える("invalid-token"); });
  await step(3, async () => { status = (await p.設定を押して応答を見る())?.status() ?? 0; });
  await expected(async () => { expect.soft(status, "アクセス拒否の応答（編集結果の画面ではない）のHTTPステータス").toBe(403); });
});

caseTest("IT-M10-08-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let status = 0;
  let 出た = { 名称: "", 件名: "" };
  await step(1, async () => {
    status = await p.開く(10801130);
    // 欄があるときだけ値を読む（404 の画面には欄が無い）。テンプレートの入っていない空の入力画面は、10801130 の編集画面ではない
    const 値 = async (l: import("@playwright/test").Locator) => ((await l.count()) ? await l.inputValue({ timeout: 10_000 }).catch(() => "") : "");
    出た = { 名称: await 値(p.名称), 件名: await 値(p.件名) };
    note(`開いた画面のテンプレ名称の欄「${出た.名称}」・件名の欄「${出た.件名}」`);
  });
  await expected(async () => {
    expect.soft(status, "識別子10801130を指定した要求のHTTPステータス").toBe(404);
    expect.soft(出た.名称.includes("D通常テンプレート-030") || 出た.件名.includes("D更新前件名-030"), "識別子10801130の編集画面（テンプレ名称「D通常テンプレート-030」・件名「D更新前件名-030」）が表示されない").toBe(false);
  });
});

caseTest("IT-M10-08-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-031"); });
  await step(2, async () => { await p.入れる({ 件名: "更新者確認件名-031" }); });
  await step(3, async () => { await 設定を送る(p); });
  let ログイン中の管理者ID = "";
  await step(4, async () => { ログイン中の管理者ID = 管理者の番号(M1008_ADMIN.loginId); r = テンプレートを読む(10801131); });
  await expected(async () => { expect.soft(r?.更新者ID, `最終更新者がログイン中の管理者「${M1008_太郎}」（正本の「試験 太郎」。管理者ID ${ログイン中の管理者ID}）`).toBe(ログイン中の管理者ID); });
});

caseTest("IT-M10-08-032", async ({ page, step, expected }) => {
  await loginAdmin(page, M1008_ADMIN);
  const p = new AutoMailPage(page);
  let r: ReturnType<typeof テンプレートを読む> = null;
  await p.開く();
  await step(1, async () => { await p.選ぶ("B自動テンプレート-032"); });
  await step(2, async () => { await p.入れる({ 件名: "更新者確認件名-032" }); });
  await step(3, async () => { await 設定を送る(p); });
  let ログイン中の管理者ID = "";
  await step(4, async () => { ログイン中の管理者ID = 管理者の番号(M1008_ADMIN.loginId); r = テンプレートを読む(10801132); });
  await expected(async () => { expect.soft(r?.更新者ID, `最終更新者がログイン中の管理者「${M1008_太郎}」（正本の「試験 太郎」。管理者ID ${ログイン中の管理者ID}）`).toBe(ログイン中の管理者ID); });
});
