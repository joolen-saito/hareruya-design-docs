/**
 * M08-10 オンライン本人確認。正本: cases/M08-10_test_cases.tsv
 * 実装した: 001〜003・011〜020・024・026・028
 * 実装しない:
 * - 005〜010・025: 身分証画像（本人の顔写真・身分証明書の表裏斜め）を持つ会員が要る。画像の情報を DB で足し、同じキーの試験画像を本人確認画像の保管先へ入れる作りで、保管先へ入れる手段が無い。
 *   006・010 は、あわせて本人確認画像を閲覧できない権限の管理者が要る（権限を新しく作る）。
 * - 023・027: フロントのネット買取の申込みで作る買取情報が要る（023 は買取依頼日の DB 書き換えも）。
 * - 029: 本人確認ステータスのマスタ（全員が使う共有の表）の1件を消す手順。
 * 補い:
 * - 身分証有効期限は日付の入力欄なので、「2028/05/31」は「2028-05-31」の形で入れる（画面の表記は 2028/05/31）。
 * - 会員のメールアドレスの前半には実行の印が付く（正本は m0810-… と書く）。
 * - 「開発者ツールで…を変更する」は、画面の要素をスクリプトで変えて表した。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 会員の保存内容 } from "../../db/m08_04";
import { 選手情報を消す } from "../../db/m08_10";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { M0810IdentificationPage } from "../../pages/admin/m08_10_identification";
import { ChangePage, 会員としてログインする } from "../../pages/front/f06_18_change";
import { M0810_VIEW, M0810_QH_ADMIN } from "../../seeds/m08-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 編集画面のパス = (id: string) => new URL(adminUrl(`/customer/${id}/edit`)).pathname;

/** 管理者でログインし、会員の編集画面を開いて、オンライン本人確認ボタンを押せる状態にする（手順1） */
async function 編集画面を開く(page: import("@playwright/test").Page, 会員ID: string): Promise<M0810IdentificationPage> {
  const e = new M0810IdentificationPage(page);
  const status = await e.open(会員ID);
  expect(status, `会員ID ${会員ID} の会員編集画面の応答`).toBe(200);
  return e;
}

caseTest("IT-M08-10-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有A〕")); });
  await step(2, async () => { await e.オンライン本人確認ボタン.click(); });
  await expected(async () => {
    await expect(e.オンライン本人確認ポップアップ, "オンライン本人確認モーダルが表示されている").toBeVisible();
  });
});

caseTest("IT-M08-10-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  await step(1, async () => {
    e = new M0810IdentificationPage(page);
    expect(await e.新規登録を開く(), "会員登録画面（新規）の応答").toBe(200);
  });
  await step(2, async () => { await page.locator("#register_btn").scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect(await e.オンライン本人確認ボタン.count(), "オンライン本人確認ボタンの数").toBe(0);
    expect(await e.オンライン本人確認ポップアップ.count(), "オンライン本人確認モーダルの数").toBe(0);
  });
});

caseTest("IT-M08-10-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  let rows: { 見出し: string; 値: string }[] = [];
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有A〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { rows = await e.モーダルの会員情報(); note(`モーダルの会員情報: ${rows.map((r) => `${r.見出し || "（見出しなし）"}=${r.値}`).join(" / ")}`); });
  await expected(async () => {
    const v = (i: number) => rows[i]?.値 ?? "";
    expect.soft(v(0), "お名前").toBe("結合 太郎");
    expect.soft(v(1), "お名前（フリガナ）").toBe("ケツゴウ タロウ");
    expect.soft(v(2), "国").toBe("日本");
    expect.soft(v(3), "郵便番号").toBe("100-0001");
    expect.soft(v(4), "海外用郵便番号").toBe("AB-810");
    expect.soft(v(5), "都道府県").toBe("東京都");
    expect.soft(v(6), "住所1").toBe("千代田区千代田");
    expect.soft(v(7), "住所2").toBe("結合ビル810");
    expect.soft(v(9), "生年月日（1990年5月6日）").toMatch(/^1990年0?5月0?6日$/);
    expect.soft(v(10), "職業").toBe("会社員");
  });
});

caseTest("IT-M08-10-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有A〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { note(`身分証有効期限の入力欄の値: ${await e.期限の値()}`); });
  await expected(async () => {
    expect(await e.期限の値(), "身分証有効期限の初期値（2027年4月30日）").toBe("2027-04-30");
  });
});

caseTest("IT-M08-10-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有D〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { note(`身分証有効期限の入力欄の値: 「${await e.期限の値()}」`); });
  await expected(async () => {
    expect(await e.期限の値(), "身分証有効期限（空欄）").toBe("");
  });
});

caseTest("IT-M08-10-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-共有A〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await e.取消ボタン.click(); });
  await expected(async () => {
    await expect(e.オンライン本人確認ポップアップ, "オンライン本人確認モーダルが閉じている").toBeHidden();
    expect(new URL(page.url()).pathname, "会員編集画面のアドレス").toBe(編集画面のパス(id));
  });
});

caseTest("IT-M08-10-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-014〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await e.期限を入れる("2028-05-31"); });
  await step(4, async () => { await e.取消ボタン.click(); });
  await step(5, async () => {
    const r = await e.登録する();
    note(`会員情報を登録: 確認のダイアログ ${r.ダイアログ ?? "なし"}・上部の表示 ${(await e.上部の表示()).join(" / ") || "なし"}`);
  });
  let 保存: Awaited<ReturnType<typeof 会員の保存内容>> | undefined;
  await step(6, async () => { 保存 = 会員の保存内容(id); });
  await expected(async () => {
    expect(保存?.身分証有効期限, "身分証有効期限（2027年4月30日から更新されない）").toBe("2027-04-30");
  });
});

caseTest("IT-M08-10-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-015〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await e.期限を入れる("2028-05-31"); });
  await step(4, async () => { await e.確認済に変更するを押す(); });
  let 保存: Awaited<ReturnType<typeof 会員の保存内容>> | undefined;
  await step(5, async () => { 保存 = 会員の保存内容(id); });
  await expected(async () => {
    expect.soft(保存?.本人確認ステータス, "本人確認ステータス").toBe("オンライン本人確認済み");
    expect.soft(保存?.身分証有効期限, "身分証有効期限（2028年5月31日）").toBe("2028-05-31");
  });
});

caseTest("IT-M08-10-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-016〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await e.期限を入れる("2028-05-31"); });
  await step(4, async () => { await e.確認済に変更するを押す(); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "保存後の画面（会員編集画面）のアドレス").toBe(編集画面のパス(id));
  });
});

caseTest("IT-M08-10-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-017〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await e.期限を入れる(""); });
  await step(4, async () => { await e.確認済に変更するを押す(); });
  let 保存: Awaited<ReturnType<typeof 会員の保存内容>> | undefined;
  await step(5, async () => { 保存 = 会員の保存内容(id); });
  await expected(async () => {
    expect.soft(保存?.本人確認ステータス, "本人確認ステータス").toBe("オンライン本人確認済み");
    expect.soft(保存?.身分証有効期限 ?? null, "身分証有効期限（未設定）").toBeNull();
  });
});

/** 018・019 の手順3: 期限の入力要素を文字入力できる形に変え、日付でない値を入れる */
async function 日付でない値を入れる(e: M0810IdentificationPage): Promise<void> {
  await e.期限を文字入力に変えて入れる("not-a-date");
  note(`期限の入力欄の値: ${await e.期限の値()}`);
}
async function 確認済に変更して表示を残す(e: M0810IdentificationPage): Promise<void> {
  await e.確認済に変更するを押す();
  note(`押したあとの上部の表示: ${(await e.上部の表示()).join(" / ") || "なし"}`);
}

caseTest("IT-M08-10-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-共有A〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await 日付でない値を入れる(e); });
  await step(4, async () => { await 確認済に変更して表示を残す(e); });
  let 保存: Awaited<ReturnType<typeof 会員の保存内容>> | undefined;
  await step(5, async () => { 保存 = 会員の保存内容(id); });
  await expected(async () => {
    expect.soft(保存?.本人確認ステータス, "本人確認ステータス（未確認のまま）").toBe("未確認");
    expect.soft(保存?.身分証有効期限, "身分証有効期限（2027年4月30日のまま）").toBe("2027-04-30");
  });
});

caseTest("IT-M08-10-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-共有A〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await 日付でない値を入れる(e); });
  await step(4, async () => { await 確認済に変更して表示を残す(e); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "戻った画面（会員編集画面）のアドレス").toBe(編集画面のパス(id));
  });
});

caseTest("IT-M08-10-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-020〕");
  let e!: M0810IdentificationPage;
  let 要求: { アドレス: string; 送信内容: string | null } = { アドレス: "", 送信内容: null };
  let 応答 = 0;
  await step(1, async () => { e = await 編集画面を開く(page, id); await e.モーダルを開く(); });
  await step(2, async () => {
    // 事前準備④の要求（確認済に変更する）と同じ操作をここで行い、送られた要求を捕まえて複製の元にする（同じ期限 2027-04-30 なので会員の状態は変わらない）
    await e.期限を入れる("2027-04-30");
    要求 = await e.確認済に変更するを押して要求を捕まえる();
    note(`複製した要求: POST ${要求.アドレス}・送信内容 ${要求.送信内容}`);
  });
  await step(3, async () => {
    const url = 要求.アドレス.replace(`/customer/${id}/`, "/customer/");
    note(`会員ID部分を削除した要求のアドレス: ${url}`);
    const res = await page.request.post(url, { headers: { "content-type": "application/x-www-form-urlencoded" }, data: 要求.送信内容 ?? "", maxRedirects: 0 });
    応答 = res.status();
  });
  await step(4, async () => { note(`応答のHTTPステータス: ${応答}`); });
  await expected(async () => {
    expect(応答, "HTTPステータス").toBe(404);
  });
});

caseTest("IT-M08-10-024", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0810-QH001〕");
  const メール = String(会員の保存内容(id)?.メールアドレス ?? "");
  note(`会員ログインに使うメールアドレス: ${メール}（正本の qh0810-001@example.test に実行の印が付いたもの）`);
  const 前 = page; // ブラウザA（会員）
  const browser = page.context().browser()!;
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    let c!: ChangePage;
    let 更新前 = "";
    let 更新後 = "";
    await step(1, async () => { await 会員としてログインする(前, メール, "Passw0rd-QH0810-001"); });
    await step(2, async () => { c = new ChangePage(前); await c.開いて待つ(); 更新前 = await c.本人確認状況(); expect.soft(更新前, "更新前の本人確認状況ステータス").toContain("未確認"); });
    await step(3, async () => { await loginAdmin(pageB, M0810_QH_ADMIN); });
    let eB!: M0810IdentificationPage;
    await step(4, async () => { eB = await 編集画面を開く(pageB, id); await eB.モーダルを開く(); });
    await step(5, async () => { await eB.期限を入れる("2028-05-31"); await eB.確認済に変更するを押す(); });
    await step(6, async () => { expect.soft((await eB.成功メッセージ()) ?? "", "ブラウザBの「保存しました」の表示").toContain("保存しました"); });
    await step(7, async () => { await c.開いて待つ(); 更新後 = await c.本人確認状況(); });
    await expected(async () => {
      expect.soft(更新後, `会員情報変更画面の本人確認状況ステータス（更新前は「${更新前}」）`).toContain("オンライン本人確認済み");
    });
  } finally { await ctxB.close(); }
});

caseTest("IT-M08-10-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-026〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await e.期限を入れる("2028-05-31"); });
  await step(4, async () => { await e.確認済に変更するを押す(); });
  let 保存: Awaited<ReturnType<typeof 会員の保存内容>> | undefined;
  await step(5, async () => { 保存 = 会員の保存内容(id); });
  await expected(async () => {
    expect.soft(保存?.本人確認ステータス, "本人確認ステータス（オンライン本人確認済みのまま）").toBe("オンライン本人確認済み");
    expect.soft(保存?.身分証有効期限, "身分証有効期限（2027-04-30 から 2028-05-31 へ）").toBe("2028-05-31");
  });
});

caseTest("IT-M08-10-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  const id = notes.get("〔会員ID-M0810-CB028〕");
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, id); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { 選手情報を消す(id); note("DBで、この会員（実行の印つき）の選手情報を削除した"); });
  await step(4, async () => { await e.期限を入れる("2028-05-31"); });
  await step(5, async () => { await e.確認済に変更するを押す(); });
  let 表示: string[] = [];
  await step(6, async () => { 表示 = await e.上部の表示(); note(`画面上部の表示: ${表示.join(" / ") || "なし"}・いまのアドレス: ${page.url()}`); });
  await expected(async () => {
    expect(表示.join(" / "), "画面上部の表示").toContain("システムエラーが発生しました");
  });
});
