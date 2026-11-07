/**
 * F06-20 お届け先（配送先） の続き（-b）。正本: cases/F06-20_test_cases.tsv
 * 既存の spec/f06/f06-20.spec.ts（029。流し終えたもの）は変えない。会員・配送先は、フロントの会員登録とマイページの配送先登録で作る（seeds/f06-20-b.ts）。
 * 実装しないケース: 005・007（シードの20件目をDBで直接設定する）、059・060（ブラックリストの登録。開発用の既存行が検証を妨げる。F06-01 と同じ）。
 * 記録 review/F06-20_progress_2026-11-07.md
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 配送先の件数, 配送先の記録, 配送先IDの件数 } from "../../db/f06_20";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { available } from "../../lib/db";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { openEditFromResult, searchCustomer } from "../../pages/admin/f06_customer";
import { 住所リンクを押す, 配送先編集の値 } from "../../pages/admin/f06_20_delivery";
import { LoginPage } from "../../pages/front/f06_03_login";
import { DeliveryPage } from "../../pages/front/f06_20_delivery";
import { mailOf, PC_ADMIN, PC_PW, PW } from "../../seeds/f06-20-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const digits = (s: string) => s.replace(/\D/g, "");
const compact = (s: string) => s.replace(/\s+/g, "");

/** 事前準備「新しいブラウザセッションで本店の日本語ページを開き、<メール>でログインする」 */
async function ログイン(page: Page, 前半: string, パスワード = PW): Promise<DeliveryPage> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), パスワード);
  return new DeliveryPage(page);
}

// ---------------------------------------------------------------- 一覧・編集画面の表示と遷移
caseTest("IT-F06-20-001", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-001");
  let 会員 = null as Awaited<ReturnType<DeliveryPage["会員情報住所の枠"]>> | null;
  let 配送先 = undefined as Awaited<ReturnType<DeliveryPage["一覧の配送先"]>>[number] | undefined;
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => {
    会員 = await d.会員情報住所の枠();
    配送先 = (await d.一覧の配送先()).find((x) => x.配送先ID === notes.get("〔配送先ID-F0620-001〕"));
  });
  await expected(async () => {
    expect.soft(compact(会員?.氏名 ?? ""), "会員情報の氏名（ユーザー名）").toContain("配送太郎");
    expect.soft(会員?.住所, "会員情報の住所").toContain("東京都千代田区丸の内1-1");
    expect.soft(digits(会員?.電話 ?? ""), "会員情報の電話番号").toBe("0311112222");
    expect.soft(会員?.会社, "会員情報の会社名").toContain("晴屋本社");
    expect.soft(配送先 !== undefined, "配送先ID 〔配送先ID-F0620-001〕 の枠が一覧にある").toBe(true);
    expect.soft(配送先?.氏名 ?? "", "配送先の氏名").toContain("山田 花子");
    expect.soft(`${配送先?.郵便番号 ?? ""} ${配送先?.住所 ?? ""}`, "配送先の郵便番号と住所").toContain("101-0021 東京都千代田区外神田1-1");
    expect.soft(digits(配送先?.電話 ?? ""), "配送先の電話番号").toBe("0312345678");
    expect.soft(配送先?.会社 ?? "", "配送先の会社名").toContain("晴屋商事");
    note("電話番号は画面ではハイフンなし（0311112222・0312345678）で表示される。数字の並びで確かめた");
  });
});

caseTest("IT-F06-20-002", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-002");
  let 一覧の前 = "", 一覧の後 = "", 編集の前 = "", 編集の後 = "", 一覧の文 = "", 編集の文 = "";
  await step(1, async () => {
    await d.一覧を開く(); 一覧の前 = d.path;
    一覧の文 = (await d.パンくずの現在地.innerText()).trim();
    await d.現在地を押す(); 一覧の後 = d.path;
  });
  await step(2, async () => {
    await d.編集を開く(notes.get("〔配送先ID-F0620-002〕")); 編集の前 = d.path;
    編集の文 = (await d.パンくずの現在地.innerText()).trim();
    await d.現在地を押す(); 編集の後 = d.path;
  });
  await expected(async () => {
    expect.soft(一覧の後, "配送先一覧画面で現在表示中ページを押したあとのアドレス（変わらない）").toBe(一覧の前);
    expect.soft(編集の後, "配送先の編集画面で現在表示中ページを押したあとのアドレス（変わらない）").toBe(編集の前);
    expect.soft(一覧の文, "一覧画面の現在表示中ページの表示名").toBe("配送先の新規登録・変更");
    expect.soft(編集の文, "編集画面の現在表示中ページの表示名").toBe("配送先の新規登録・変更");
  });
});

caseTest("IT-F06-20-003", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-003");
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => { await d.押して遷移する(d.パンくずのホーム); });
  await expected(async () => { expect.soft(d.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

caseTest("IT-F06-20-004", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-004");
  let 追加できた = false;
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => {
    追加できた = (await d.新しい住所を追加.count()) > 0;
    if (追加できた) await d.押して遷移する(d.新しい住所を追加);
    else note(`一覧に「新しい住所を追加」が無く押せない。一覧の上部: ${(await d.一覧の画面上部の文).slice(0, 100)}`);
  });
  await expected(async () => {
    expect.soft(追加できた, "「新しい住所を追加」が押せる").toBe(true);
    expect.soft(d.path, "遷移した画面（配送先の新規登録・変更）").toBe("/ja/mypage/delivery/new/edit");
    expect.soft(await d.入力の画面か, "配送先の入力画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-20-008", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-008");
  const id = notes.get("〔配送先ID-F0620-008〕");
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => { await d.押して遷移する(d.page.locator(`a[href$="/mypage/delivery/${id}/edit"]`)); });
  await expected(async () => {
    expect.soft(d.path, "遷移した画面（配送先の編集）").toBe(`/ja/mypage/delivery/${id}/edit`);
    expect.soft(await d.配送先名称欄.inputValue(), "配送先名称").toBe("勤務先-008");
    expect.soft(await d.姓欄.inputValue(), "配送先氏名（姓）").toBe("山田");
    expect.soft(await d.名欄.inputValue(), "配送先氏名（名）").toBe("花子");
    expect.soft(await d.セイ欄.inputValue(), "配送先氏名フリガナ（姓）").toBe("ヤマダ");
    expect.soft(await d.メイ欄.inputValue(), "配送先氏名フリガナ（名）").toBe("ハナコ");
    expect.soft(await d.選択中の国(), "国").toBe("Japan");
    expect.soft(`${await d.郵便番号3桁.inputValue()}-${await d.郵便番号4桁.inputValue()}`, "郵便番号").toBe("101-0021");
    expect.soft((await d.都道府県.locator("option:checked").innerText()).trim(), "住所（都道府県）").toBe("東京都");
    expect.soft(await d.住所1欄.inputValue(), "住所1").toBe("千代田区外神田");
    expect.soft(await d.住所2欄.inputValue(), "住所2").toBe("1-1");
    expect.soft(`${await d.電話1.inputValue()}-${await d.電話2.inputValue()}-${await d.電話3.inputValue()}`, "電話番号").toBe("03-1234-5678");
    expect.soft(await d.会社名欄.inputValue(), "会社名").toBe("晴屋商事");
  });
});

caseTest("IT-F06-20-009", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-009");
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => { await d.押して遷移する(d.マイページのボタン); });
  await expected(async () => { expect.soft(d.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});

caseTest("IT-F06-20-010", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-010");
  await step(1, async () => { await d.編集を開く(notes.get("〔配送先ID-F0620-010〕")); });
  await step(2, async () => { await d.配送先名称欄.fill("戻る確認住所", { timeout: 30_000 }); });
  await step(3, async () => { await d.押して遷移する(d.戻る); });
  await expected(async () => {
    expect.soft(d.path, "遷移した画面（配送先一覧）").toBe("/ja/mypage/delivery");
    expect.soft(await d.一覧の画面か, "配送先一覧画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-20-011", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-011");
  await step(1, async () => { await d.編集を開く(notes.get("〔配送先ID-F0620-011〕")); });
  await step(2, async () => { await d.押して遷移する(d.パンくずのホーム); });
  await expected(async () => { expect.soft(d.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

// ---------------------------------------------------------------- 新規入力画面の項目
caseTest("IT-F06-20-012", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-012");
  await step(1, async () => { await d.新規入力を開く(); });
  let 見出し: string[] = [];
  await step(2, async () => { 見出し = await d.見えている見出し(); });
  await expected(async () => {
    expect.soft(見出し.some((t) => t === "名前"), `「名前」の見出しの入力項目が表示されない（見出し: ${見出し.join(" / ")}）`).toBe(false);
    expect.soft(見出し.some((t) => t.startsWith("配送先名称")) && await d.見えている(d.配送先名称欄), "配送先名称の入力項目が表示される").toBe(true);
    expect.soft(見出し.some((t) => t.startsWith("配送先氏名")) && await d.見えている(d.姓欄) && await d.見えている(d.名欄), "配送先氏名（姓・名）の入力項目が表示される").toBe(true);
  });
});

caseTest("IT-F06-20-013", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-013");
  await step(1, async () => { await d.新規入力を開く(); });
  await expected(async () => { expect.soft(await d.選択中の国(), "国の初期値").toBe("Japan"); });
});

/** 入力欄の表示の状態（日本の郵便番号形式の欄・汎用の郵便番号欄・住所（都道府県）・住所3） */
const 入力欄の表示 = async (d: DeliveryPage) => ({
  日本の郵便番号: (await d.見えている(d.郵便番号3桁)) && (await d.見えている(d.郵便番号4桁)),
  汎用の郵便番号: await d.見えている(d.海外郵便番号),
  都道府県: await d.見えている(d.都道府県),
  住所3: await d.見えている(d.住所3欄),
});

caseTest("IT-F06-20-014", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-014");
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { await d.国を選ぶ("Japan"); });
  await expected(async () => {
    const v = await 入力欄の表示(d);
    expect.soft(v.日本の郵便番号, "日本の郵便番号形式の入力欄（3桁・4桁）が表示される").toBe(true);
    expect.soft(v.都道府県, "住所（都道府県）が表示される").toBe(true);
    expect.soft(v.住所3, "住所3が表示されない").toBe(false);
  });
});

caseTest("IT-F06-20-015", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-015");
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { await d.国を選ぶ("United States"); });
  await expected(async () => {
    const v = await 入力欄の表示(d);
    expect.soft(v.汎用の郵便番号, "汎用の郵便番号入力欄が表示される").toBe(true);
    expect.soft(v.住所3, "住所3が表示される").toBe(true);
    expect.soft(v.都道府県, "住所（都道府県）が表示されない").toBe(false);
  });
});

caseTest("IT-F06-20-016", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-016");
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { await d.国を選ぶ("United States"); });
  await step(3, async () => { await d.国を選ぶ("Japan"); });
  await expected(async () => {
    const v = await 入力欄の表示(d);
    expect.soft(v.日本の郵便番号, "日本の郵便番号形式の入力欄（3桁・4桁）が表示される").toBe(true);
    expect.soft(v.都道府県, "住所（都道府県）が表示される").toBe(true);
    expect.soft(v.住所3, "住所3が表示されない").toBe(false);
  });
});

caseTest("IT-F06-20-017", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-017");
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { await d.国を選ぶ("Japan"); });
  await step(3, async () => {
    await d.郵便番号3桁.pressSequentially("100", { delay: 80, timeout: 30_000 });
    await d.郵便番号4桁.pressSequentially("0001", { delay: 80, timeout: 30_000 });
    await d.住所2欄.focus({ timeout: 30_000 });
    // 郵便番号から住所を補う処理は外部の住所データを読む。補われるのを待つ
    await expect.poll(async () => d.住所1欄.inputValue(), { timeout: 20_000, message: "郵便番号に基づく住所1の補完" }).not.toBe("").catch(() => undefined);
  });
  await expected(async () => {
    expect.soft((await d.都道府県.locator("option:checked").innerText()).trim(), "住所（都道府県）が自動補完される").toBe("東京都");
    expect.soft(await d.住所1欄.inputValue(), "住所1が自動補完される").toContain("千代田区千代田");
  });
});

caseTest("IT-F06-20-018", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-018");
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { await expect(d.郵便番号3桁, "郵便番号欄").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await page.getByRole("button", { name: /郵便番号から自動入力/ }).count(), "「郵便番号から自動入力」ボタンの数").toBe(0);
    expect.soft(await page.getByText("郵便番号から自動入力").count(), "「郵便番号から自動入力」の表示の数").toBe(0);
  });
});

caseTest("IT-F06-20-019", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-019");
  let 日本語 = false, 英語 = false;
  await step(1, async () => {
    await d.新規入力を開く("ja");
    日本語 = (await d.見えている(d.セイ欄)) && (await d.見えている(d.メイ欄));
  });
  await step(2, async () => {
    await d.新規入力を開く("en");
    await expect(d.配送先名称欄, "英語ページの配送先名称欄").toBeVisible({ timeout: 30_000 });
    英語 = (await d.セイ欄.count()) + (await d.メイ欄.count()) > 0;
  });
  await expected(async () => {
    expect.soft(日本語, "日本語ページに配送先氏名フリガナ（姓）と（名）の入力欄が表示される").toBe(true);
    expect.soft(英語, "英語ページに配送先氏名フリガナの入力欄がある").toBe(false);
  });
});

caseTest("IT-F06-20-049", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-049");
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { await d.国を選ぶ("United States"); });
  await step(3, async () => {
    await d.海外郵便番号.pressSequentially("1000001", { delay: 60, timeout: 30_000 });
    await d.配送先名称欄.focus({ timeout: 30_000 });
    await page.waitForTimeout(4000);
  });
  let 住所1 = "?", 住所3 = "?";
  await step(4, async () => { 住所1 = await d.住所1欄.inputValue(); 住所3 = await d.住所3欄.inputValue(); });
  await expected(async () => {
    expect.soft(住所1, "住所1が空のまま").toBe("");
    expect.soft(住所3, "住所3が空のまま").toBe("");
  });
});

// ---------------------------------------------------------------- 他会員の配送先
caseTest("IT-F06-20-027", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-027");
  let 自分 = 0, 他会員 = 0;
  await step(1, async () => { 自分 = (await d.編集を開く(notes.get("〔配送先ID-F0620-027A〕"))) ?? 0; });
  await step(2, async () => { 他会員 = (await d.編集を開く(notes.get("〔配送先ID-F0620-027B〕"))) ?? 0; });
  await expected(async () => {
    expect.soft(自分, "自分の配送先の編集画面を開いた応答").toBe(200);
    expect.soft(他会員, "他会員所有の配送先IDで開いた応答（HTTP404）").toBe(404);
  });
});

caseTest("IT-F06-20-028", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-028");
  let 状態 = 0;
  await step(1, async () => {
    // 自分の配送先の入力画面から読んだ送信用の値を使い、配送先IDだけを他会員所有のものに変えて送る
    await d.編集を開く(notes.get("〔配送先ID-F0620-028A〕"));
    状態 = await d.確認画面を開く要求を送る(notes.get("〔配送先ID-F0620-028B〕"));
  });
  await expected(async () => { expect.soft(状態, "他会員所有の配送先IDで確認画面を開く要求の応答（HTTP404）").toBe(404); });
});

// ---------------------------------------------------------------- 削除
caseTest("IT-F06-20-030", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-030");
  const id = notes.get("〔配送先ID-F0620-030〕");
  await step(1, async () => { await d.一覧を開く(); });
  let 保留: Awaited<ReturnType<DeliveryPage["削除を押して確認を保留する"]>> | undefined;
  await step(2, async () => { 保留 = await d.削除を押して確認を保留する("勤務先-030"); });
  await step(3, async () => { await 保留!.答える(false); });
  let 記録 = null as ReturnType<typeof 配送先の記録>;
  await step(4, async () => { 記録 = 配送先の記録(id); });
  await expected(async () => {
    expect.soft(保留?.文() ?? "", "削除の確認の文").not.toBe("");
    expect.soft(記録?.削除済み, "配送先が削除済みに変更されない").toBe(false);
    expect.soft(記録?.配送先名称, "登録内容（配送先名称）が保持される").toBe("勤務先-030");
    expect.soft(`${記録?.姓}${記録?.名}`, "登録内容（氏名）が保持される").toBe("山田花子");
    expect.soft(await d.枠("勤務先-030").count(), "一覧に配送先の枠が残る").toBe(1);
  });
});

caseTest("IT-F06-20-031", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-031");
  const id = notes.get("〔配送先ID-F0620-031〕");
  await step(1, async () => { await d.一覧を開く(); });
  let 保留: Awaited<ReturnType<DeliveryPage["削除を押して確認を保留する"]>> | undefined;
  await step(2, async () => { 保留 = await d.削除を押して確認を保留する("勤務先-031"); });
  await step(3, async () => { await 保留!.答える(true); });
  let 記録 = null as ReturnType<typeof 配送先の記録>;
  await step(4, async () => { 記録 = 配送先の記録(id); });
  await expected(async () => {
    expect.soft(記録 !== null, "配送先の記録が物理削除されず残る").toBe(true);
    expect.soft(記録?.削除済み, "配送先の記録が削除済みになっている").toBe(true);
  });
});

caseTest("IT-F06-20-032", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-032");
  await step(1, async () => { await d.一覧を開く(); });
  let 保留: Awaited<ReturnType<DeliveryPage["削除を押して確認を保留する"]>> | undefined;
  await step(2, async () => { 保留 = await d.削除を押して確認を保留する("勤務先-032"); });
  await step(3, async () => { await 保留!.答える(true); });
  await expected(async () => {
    expect.soft(d.path, "削除処理後に表示された画面（配送先一覧）").toBe("/ja/mypage/delivery");
    expect.soft(await d.一覧の画面か, "配送先一覧画面が再読み込みされている").toBe(true);
    expect.soft(await d.枠("勤務先-032").count(), "削除した配送先の枠が一覧に出ない").toBe(0);
  });
});

/** 033・034: 確認を開いたまま照合値を書き換え（開発者ツールでの書き換え）、「OK」を押す（手順1〜5） */
async function 照合値を書き換えて削除(ctx: CaseCtx, 前半: string, 呼び名: string, 照合値: string | undefined): Promise<{ 確認の文: string; 記録: ReturnType<typeof 配送先の記録> }> {
  const { page, notes, step } = ctx;
  const d = await ログイン(page, 前半);
  const id = notes.get(`〔配送先ID-F0620-${呼び名}〕`);
  const 名称 = `勤務先-${呼び名}`;
  await step(1, async () => { await d.一覧を開く(); });
  let 保留: Awaited<ReturnType<DeliveryPage["削除を押して確認を保留する"]>> | undefined;
  await step(2, async () => { 保留 = await d.削除を押して確認を保留する(名称); });
  await step(3, async () => { await d.削除要求の照合値を書き換える(照合値); });
  await step(4, async () => { await 保留!.答える(true); });
  let 記録 = null as ReturnType<typeof 配送先の記録>;
  await step(5, async () => { 記録 = 配送先の記録(id); });
  return { 確認の文: 保留?.文() ?? "", 記録 };
}
caseTest("IT-F06-20-033", async (ctx) => {
  const r = await 照合値を書き換えて削除(ctx, "f06-20-033", "033", undefined);
  await ctx.expected(async () => {
    expect.soft(r.確認の文, "削除の確認の文").not.toBe("");
    expect.soft(r.記録?.削除済み, "配送先が削除済みに変更されない").toBe(false);
  });
});
caseTest("IT-F06-20-034", async (ctx) => {
  const r = await 照合値を書き換えて削除(ctx, "f06-20-034", "034", "invalid-token");
  await ctx.expected(async () => {
    expect.soft(r.確認の文, "削除の確認の文").not.toBe("");
    expect.soft(r.記録?.削除済み, "配送先が削除済みに変更されない").toBe(false);
  });
});

caseTest("IT-F06-20-035", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-035");
  let 状態 = 0;
  await step(1, async () => {
    await d.一覧を開く();
    状態 = await d.削除要求を送る("", await d.削除用の照合値());
  });
  await expected(async () => { expect.soft(状態, "配送先の識別子を除いた削除要求の応答（HTTP404）").toBe(404); });
});

caseTest("IT-F06-20-036", async ({ page, step, expected }) => {
  // シード表は配送先ID 999999 のデータがあれば削除して未登録にすると定める。DBへは書き込まないので、未登録であることを参照で確かめる
  supplement("シード表は「配送先ID 999999のデータがあれば削除して未登録にする」と定めるが、DBへは書き込まない決まりのため、未登録であることをDBの参照で確かめた");
  expect(配送先IDの件数("999999"), "配送先ID 999999 が全会員で未登録").toBe(0);
  const d = await ログイン(page, "f06-20-036");
  let 状態 = 0;
  await step(1, async () => {
    await d.一覧を開く();
    状態 = await d.削除要求を送る("999999", await d.削除用の照合値());
  });
  await expected(async () => { expect.soft(状態, "未登録の識別子999999での削除要求の応答（HTTP404）").toBe(404); });
});

caseTest("IT-F06-20-037", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-037");
  let 状態 = 0;
  await step(1, async () => {
    await d.一覧を開く();
    状態 = await d.削除要求を送る(notes.get("〔配送先ID-F0620-037B〕"), await d.削除用の照合値());
  });
  await expected(async () => { expect.soft(状態, "他会員所有の配送先IDでの削除要求の応答（HTTP404）").toBe(404); });
});

caseTest("IT-F06-20-055", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "f06-20-055");
  const a = notes.get("〔配送先ID-F0620-055-A〕"), b = notes.get("〔配送先ID-F0620-055-B〕");
  await step(1, async () => { await d.一覧を開く(); });
  let 保留: Awaited<ReturnType<DeliveryPage["削除を押して確認を保留する"]>> | undefined;
  await step(2, async () => { 保留 = await d.削除を押して確認を保留する("勤務先-F0620-055-A"); });
  await step(3, async () => { await 保留!.答える(true); });
  let A = null as ReturnType<typeof 配送先の記録>, B = null as ReturnType<typeof 配送先の記録>;
  await step(4, async () => { A = 配送先の記録(a); B = 配送先の記録(b); });
  await expected(async () => {
    expect.soft(A?.削除済み, "配送先ID 〔配送先ID-F0620-055-A〕 の記録が削除済み").toBe(true);
    expect.soft(B !== null && B.削除済み === false, "配送先ID 〔配送先ID-F0620-055-B〕 の記録が削除済みではない状態で残る").toBe(true);
  });
});

caseTest("IT-F06-20-056", async ({ page, step, expected }) => {
  const d = await ログイン(page, "f06-20-056");
  await step(1, async () => { await d.一覧を開く(); });
  let 保留: Awaited<ReturnType<DeliveryPage["削除を押して確認を保留する"]>> | undefined;
  await step(2, async () => { 保留 = await d.削除を押して確認を保留する("勤務先-F0620-056-A"); });
  await step(3, async () => { await 保留!.答える(true); });
  await step(4, async () => { await expect(d.枠("勤務先-F0620-056-B"), "再読み込み後の一覧に残る枠").toHaveCount(1, { timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await d.枠("勤務先-F0620-056-B").count(), "「勤務先-F0620-056-B」の枠が一覧に表示される").toBe(1);
    expect.soft(await d.枠("勤務先-F0620-056-A").count(), "「勤務先-F0620-056-A」の枠は表示されない").toBe(0);
  });
});

// ---------------------------------------------------------------- 上限
caseTest("IT-F06-20-057", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "cbf06-20-057");
  const id = notes.get("〔配送先ID-F0620-CB057-01〕");
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => { await d.押して遷移する(d.編集ボタン("住所01-F0620-CB057")); });
  await expected(async () => {
    expect.soft(d.path, "遷移した画面（配送先の編集）").toBe(`/ja/mypage/delivery/${id}/edit`);
    expect.soft(await d.配送先名称欄.inputValue(), "「住所01-F0620-CB057」の情報が設定されている（配送先名称）").toBe("住所01-F0620-CB057");
  });
});

caseTest("IT-F06-20-058", async ({ page, step, expected, notes }) => {
  const d = await ログイン(page, "cbf06-20-058");
  void notes;
  let 件数 = -1, エラー枠 = "";
  await step(1, async () => { await d.新規入力を開く(); });
  await step(2, async () => { エラー枠 = (await d.上限のエラー枠.allInnerTexts()).join(" "); });
  await step(3, async () => { 件数 = 配送先の件数(notes.get("〔会員ID-F0620-CB058〕")).既定を除く; });
  await expected(async () => {
    expect.soft(await d.入力の画面か, "入力画面が表示されない").toBe(false);
    expect.soft(d.path, "表示された画面（配送先一覧）").toBe("/ja/mypage/delivery");
    expect.soft(エラー枠, "配送先一覧画面の上部のエラー枠").toContain("お届け先登録数の上限を超えています。");
    expect.soft(件数, "DBの配送先（会員情報住所を除く）の件数").toBe(20);
  });
});

caseTest("IT-F06-20-061", async ({ page, notes, step, expected }) => {
  supplement("シード表の「ブラックリストは0件」は、開発用の既存の行を消さない決まりのため0件にしていない。この配送先の氏名・電話番号・住所と一致する行が無いことは、登録が通ることで確かめる");
  const d = await ログイン(page, "cbf06-20-061");
  const id = notes.get("〔配送先ID-F0620-CB061-01〕");
  await step(1, async () => { await d.一覧を開く(); });
  await step(2, async () => { await d.押して遷移する(d.編集ボタン("住所01-F0620-CB061")); });
  await step(3, async () => { await d.配送先名称欄.fill("更新住所-F0620-CB061", { timeout: 30_000 }); });
  await step(4, async () => { await d.確認画面へ進む(); });
  await step(5, async () => { await d.登録するを押す(); });
  let 名称 = "", 件数 = -1;
  await step(6, async () => { 名称 = 配送先の記録(id)?.配送先名称 ?? ""; 件数 = 配送先の件数(notes.get("〔会員ID-F0620-CB061〕")).既定を除く; });
  await expected(async () => {
    expect.soft(d.path, "遷移した画面（配送先一覧）").toBe("/ja/mypage/delivery");
    expect.soft(名称, "配送先の配送先名称が更新されている").toBe("更新住所-F0620-CB061");
    expect.soft(件数, "DBの配送先（会員情報住所を除く）が20件のまま").toBe(20);
  });
});

// ---------------------------------------------------------------- 会員管理の画面との連携（ブラウザA＝会員、ブラウザB＝管理者）
async function ブラウザB(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  return { page, close: () => context.close() };
}

type 登録の指定 = { 前半: string; 配送先名称?: string; 編集する?: string; 入力: Parameters<DeliveryPage["入力する"]>[0] };
/** 手順1〜4（ブラウザAで配送先を登録・変更）と手順5〜7（ブラウザBで管理者ログイン → 会員検索 → 会員編集画面） */
async function 連携(ctx: CaseCtx, v: 登録の指定, 検索語: string, 受け取る: (b: { page: Page; close: () => Promise<void> }) => void): Promise<void> {
  const { page, browser, step } = ctx;
  supplement("シード表の会員の電話番号・住所2・会社名・生年月日は、この試験会員の登録の部品に合わせた値（住所2=1-1・電話番号=0312345678。会社名は入れない・生年月日は1990-01-01）。ケースが確かめる値ではない");
  const b = await ブラウザB(browser);
  受け取る(b);
  const d = new DeliveryPage(page);
  await step(1, async () => {
    const l = new LoginPage(page);
    await l.ログイン画面を開く();
    await l.ログインする(mailOf(v.前半), PC_PW);
  });
  await step(2, async () => {
    await d.一覧を開く();
    if (v.編集する) await d.押して遷移する(d.編集ボタン(v.編集する));
    else await d.押して遷移する(d.新しい住所を追加);
  });
  await step(3, async () => {
    await d.入力する(v.入力);
    const r = await d.確認画面へ進む();
    if (!r.sent) note(`ブラウザの入力チェックが送信を止めた: ${r.入力エラー.join(" / ")}`);
  });
  await step(4, async () => {
    await d.登録するを押す();
    expect(d.path, "配送先の一覧画面が表示された").toBe("/ja/mypage/delivery");
  });
  await step(5, async () => { await loginAdmin(b.page, PC_ADMIN); });
  await step(6, async () => { await searchCustomer(b.page, 検索語); });
  await step(7, async () => { await openEditFromResult(b.page, 検索語); });
}

caseTest("IT-F06-20-052", async (ctx) => {
  let b: { page: Page; close: () => Promise<void> } | undefined;
  let 行 = 0, 値: Awaited<ReturnType<typeof 配送先編集の値>> | undefined;
  try {
    await 連携(ctx, {
      前半: "pc-f0620-001",
      入力: { 配送先名称: "実家F0620PC001", 姓: "配送", 名: "花子", セイ: "ハイソウ", メイ: "ハナコ", 郵便番号: "5300001", 都道府県: "大阪府", 住所1: "大阪市北区梅田", 住所2: "1丁目1番", 電話: "0663334444", 会社名: "配送実家商事F0620PC001" },
    }, mailOf("pc-f0620-001"), (x) => { b = x; });
    await ctx.step(8, async () => {
      行 = await b!.page.locator("#delivery tbody tr").filter({ hasText: "大阪市北区梅田" }).count();
      await 住所リンクを押す(b!.page, "大阪市北区梅田");
      値 = await 配送先編集の値(b!.page);
    });
    await ctx.expected(async () => {
      expect.soft(行, "お届け先住所欄の、住所に「大阪市北区梅田」を含む行の数").toBe(1);
      expect.soft(値?.配送先名称, "住所リンクから開いた配送先編集画面の配送先名称").toBe("実家F0620PC001");
    });
  } finally { await b?.close(); }
});

caseTest("IT-F06-20-053", async (ctx) => {
  let b: { page: Page; close: () => Promise<void> } | undefined;
  let 値: Awaited<ReturnType<typeof 配送先編集の値>> | undefined;
  try {
    await 連携(ctx, {
      前半: "pc-f0620-002",
      入力: { 配送先名称: "勤務先F0620PC002", 姓: "配送", 名: "次郎", セイ: "ハイソウ", メイ: "ジロウ", 郵便番号: "4600008", 都道府県: "愛知県", 住所1: "名古屋市中区栄", 住所2: "3丁目3番", 電話: "0522223333", 会社名: "配送勤務商事F0620PC002" },
    }, mailOf("pc-f0620-002"), (x) => { b = x; });
    await ctx.step(8, async () => { await 住所リンクを押す(b!.page, "名古屋市中区栄"); 値 = await 配送先編集の値(b!.page); });
    await ctx.expected(async () => {
      expect.soft(値?.配送先名称, "配送先名称").toBe("勤務先F0620PC002");
      expect.soft(値?.姓, "配送先氏名（姓）").toBe("配送");
      expect.soft(値?.名, "配送先氏名（名）").toBe("次郎");
      expect.soft(値?.カナ姓, "配送先氏名カナ（姓）").toBe("ハイソウ");
      expect.soft(値?.カナ名, "配送先氏名カナ（名）").toBe("ジロウ");
      expect.soft(値?.国, "国").toBe("Japan");
      expect.soft(値?.都道府県, "配送先都道府県").toBe("愛知県");
      expect.soft(値?.住所1, "配送先住所1").toBe("名古屋市中区栄");
      expect.soft(値?.住所2, "配送先住所2").toBe("3丁目3番");
      expect.soft(値?.会社名, "配送先会社名").toBe("配送勤務商事F0620PC002");
    });
  } finally { await b?.close(); }
});

caseTest("IT-F06-20-054", async (ctx) => {
  let b: { page: Page; close: () => Promise<void> } | undefined;
  let 値: Awaited<ReturnType<typeof 配送先編集の値>> | undefined;
  try {
    await 連携(ctx, {
      前半: "pc-f0620-003", 編集する: "実家F0620PC003",
      入力: { 名: "三郎", メイ: "サブロウ", 国: "Japan", 郵便番号: "5420076", 都道府県: "大阪府", 住所1: "大阪市中央区難波", 住所2: "5丁目5番", 電話: "0666667777", 会社名: "配送実家商事F0620PC003改" },
    }, mailOf("pc-f0620-003"), (x) => { b = x; });
    await ctx.step(8, async () => { await 住所リンクを押す(b!.page, "大阪市中央区難波"); 値 = await 配送先編集の値(b!.page); });
    await ctx.expected(async () => {
      expect.soft(値?.配送先名称, "配送先名称").toBe("実家F0620PC003");
      expect.soft(値?.姓, "配送先氏名（姓）").toBe("配送");
      expect.soft(値?.名, "配送先氏名（名）").toBe("三郎");
      expect.soft(値?.カナ名, "配送先氏名カナ（名）").toBe("サブロウ");
      expect.soft(値?.都道府県, "配送先都道府県").toBe("大阪府");
      expect.soft(値?.住所1, "配送先住所1").toBe("大阪市中央区難波");
      expect.soft(値?.住所2, "配送先住所2").toBe("5丁目5番");
      expect.soft(値?.会社名, "配送先会社名").toBe("配送実家商事F0620PC003改");
    });
  } finally { await b?.close(); }
});

void available;
