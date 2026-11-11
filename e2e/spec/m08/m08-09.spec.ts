/**
 * M08-09 配送先一覧表示/編集。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。正本: cases/M08-09_test_cases.tsv
 * 配送先一覧画面は、会員登録編集画面の「お届け先住所」欄（アプリに配送先だけの一覧の画面は無い。pages/admin/m08_09_delivery.ts）。
 * シード: seeds/m08-09.ts。記録: review/M08-09_progress_2026-11-11_dev.md
 */
import { Page, test } from "@playwright/test";
import { 配送先, 配送先の行 } from "../../db/m08_09";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { DeliveryEditPage, DeliveryListPage, 会員編集のパス, 配送先編集のパス } from "../../pages/admin/m08_09_delivery";
import { M0809_ADMIN, 国名, 海外 } from "../../seeds/m08-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (page: Page) => new URL(page.url()).pathname;
const 空か = (v: string | null | undefined) => v === null || v === undefined || v === "";

async function signIn(page: Page): Promise<void> { await loginAdmin(page, M0809_ADMIN); }

/** 配送先の行から、比べる項目だけを取り出す（更新日時などを除く） */
const 項目 = (r: 配送先の行 | null) => r && {
  配送先名称: r.配送先名称, 国: r.国, 姓: r.姓, 名: r.名, セイ: r.セイ, メイ: r.メイ, 会社名: r.会社名, 郵便番号: r.郵便番号, 海外用郵便番号: r.海外用郵便番号,
  都道府県: r.都道府県, 住所1: r.住所1, 住所2: r.住所2, 住所3: r.住所3, 電話1: r.電話1, 電話2: r.電話2, 電話3: r.電話3, 既定: r.既定, 削除の印: r.削除の印,
};

// ---- 配送先一覧の表示 ----

caseTest("IT-M08-09-001", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const list = new DeliveryListPage(page);
  const did = notes.get("〔配送先ID-M0809-001〕");
  let text = "";
  await step(1, async () => { await list.open(notes.get("〔会員ID-M0809-001〕")); });
  await step(2, async () => { text = await list.文(list.行(did)); note(`「国内配送先-001」の枠の表示: ${text}`); });
  await expected(async () => {
    for (const v of ["国内配送先-001", "100-0001", "東京都", "千代田区千代田", "1-1", "国内住所3", "配達 太郎", "ハイタツ タロウ", "03-1234-5678", "国内会社"]) {
      expect.soft(text, `「国内配送先-001」の枠に「${v}」が表示される`).toContain(v);
    }
  });
});

caseTest("IT-M08-09-007", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const list = new DeliveryListPage(page);
  let names: string[] = [];
  await step(1, async () => { await list.open(notes.get("〔会員ID-M0809-007A〕")); });
  await step(2, async () => { names = await list.名称一覧(); note(`一覧の配送先名称: ${names.join("、")}`); });
  await expected(async () => {
    expect(names, "会員Bにだけ紐づく「他会員配送先-007」").not.toContain("他会員配送先-007");
  });
});

caseTest("IT-M08-09-008", async ({ page, step, expected }) => {
  await signIn(page);
  let status = 0;
  await step(1, async () => { status = (await new DeliveryListPage(page).open("999999"))?.status() ?? 0; });
  await step(2, async () => { note(`会員ID 999999 の配送先一覧画面（会員登録編集画面）への要求の応答: ${status}`); });
  await expected(async () => { expect(status, "配送先一覧画面への要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M08-09-009", async ({ page, notes, step, expected }) => {
  await signIn(page);
  let status = 0;
  await step(1, async () => {
    // 配送先IDを指定しない編集画面のアドレス（/customer/{会員ID}/delivery/edit）。新規登録のアドレス（delivery/new）は使わない
    const res = await page.goto(adminUrl(`/customer/${notes.get("〔会員ID-M0809-009〕")}/delivery/edit`), { timeout: 60_000 });
    status = res?.status() ?? 0;
  });
  await step(2, async () => { note(`配送先IDを指定しない配送先編集画面への要求（${path(page)}）の応答: ${status}`); });
  await expected(async () => { expect(status, "配送先編集画面への要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M08-09-010", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new DeliveryEditPage(page);
  const 会員ID = notes.get("〔会員ID-M0809-010〕");
  let status = 0;
  await step(1, async () => { expect((await edit.open(会員ID, notes.get("〔配送先ID-M0809-010〕")))?.status(), "配送先編集画面の応答").toBe(200); });
  await step(2, async () => {
    const u = new URL(page.url());
    u.pathname = u.pathname.replace(/\/delivery\/\d+\/edit$/, "/delivery/999999/edit");
    status = (await page.goto(u.toString(), { timeout: 60_000 }))?.status() ?? 0;
  });
  await step(3, async () => { note(`配送先ID 999999 の編集画面への要求の応答: ${status}`); });
  await expected(async () => { expect(status, "配送先ID 999999 の編集画面への要求のHTTPステータス").toBe(404); });
});

caseTest("IT-M08-09-011", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new DeliveryEditPage(page);
  let n = -1;
  await step(1, async () => { await edit.open(notes.get("〔会員ID-M0809-011〕"), notes.get("〔配送先ID-M0809-011〕")); });
  await step(2, async () => { n = await edit.主の領域.getByRole("link", { name: /配送先一覧に戻る/ }).count(); });
  await expected(async () => { expect(n, "「配送先一覧に戻る」リンク").toBe(0); });
});

caseTest("IT-M08-09-012", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new DeliveryEditPage(page);
  const 会員ID = notes.get("〔会員ID-M0809-012〕");
  await step(1, async () => { await edit.open(会員ID, notes.get("〔配送先ID-M0809-012〕")); });
  await step(2, async () => {
    await expect(edit.会員登録のリンク, "会員登録ボタン").toHaveText(/会員登録/);
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), edit.会員登録のリンク.click()]);
  });
  await expected(async () => { expect(path(page), "移った先（会員編集画面）").toBe(会員編集のパス(会員ID)); });
});

// ---- 配送先の編集 ----

/** 編集画面を開き（手順1）、入力し（手順2）、登録ボタンを押す（手順3）。DB の確かめは呼ぶ側で（手順4） */
async function 編集して登録(ctx: CaseCtx, n: string, did呼び名: string, input: (e: DeliveryEditPage) => Promise<void>): Promise<{ 会員ID: string; did: string; edit: DeliveryEditPage; 移った先: string }> {
  const { page, notes, step } = ctx;
  await signIn(page);
  const edit = new DeliveryEditPage(page);
  const 会員ID = notes.get(`〔会員ID-M0809-${n}〕`);
  const did = notes.get(did呼び名);
  let 移った先 = "";
  await step(1, async () => { await edit.open(会員ID, did); });
  await step(2, async () => { await input(edit); });
  await step(3, async () => {
    移った先 = await edit.pressRegister();
    note(`登録ボタンを押したあとの画面: ${移った先}・メッセージ: ${(await edit.messages()).join(" / ") || "なし"}`);
  });
  return { 会員ID, did, edit, 移った先 };
}

caseTest("IT-M08-09-013", async (ctx) => {
  const { did } = await 編集して登録(ctx, "013", "〔配送先ID-M0809-013〕", (e) => e.fill({
    配送先名称: "更新後配送先A", 国: 国名.Japan, 姓: "更新姓A", 名: "更新名B", セイ: "コウシンA", メイ: "メイB", 電話: ["090", "1234", "5678"],
    郵便番号: ["150", "0001"], 都道府県: "東京都", 住所1: "渋谷区神宮前", 住所2: "1-2-3", 住所3: "海外住所用3A", 会社名: "更新会社A",
  }));
  let r: 配送先の行 | null = null;
  await ctx.step(4, async () => { r = 配送先(did); });
  await ctx.expected(async () => {
    const want = {
      配送先名称: "更新後配送先A", 国: 国名.Japan, 姓: "更新姓A", 名: "更新名B", セイ: "コウシンA", メイ: "メイB", 電話1: "090", 電話2: "1234", 電話3: "5678",
      郵便番号: "1500001", 都道府県: "東京都", 住所1: "渋谷区神宮前", 住所2: "1-2-3", 住所3: "海外住所用3A", 会社名: "更新会社A",
    };
    const got = 項目(r) as Record<string, string | null> | null;
    for (const [k, v] of Object.entries(want)) expect.soft(got?.[k], `配送先ID ${did} の${k}`).toBe(v);
  });
});

caseTest("IT-M08-09-014", async (ctx) => {
  const didB = ctx.notes.get("〔配送先ID-M0809-014B〕");
  const before = 項目(配送先(didB));
  await 編集して登録(ctx, "014", "〔配送先ID-M0809-014A〕", (e) => e.fill({ 会社名: "対象限定会社" }));
  let after: ReturnType<typeof 項目> = null;
  await ctx.step(4, async () => { after = 項目(配送先(didB)); });
  await ctx.expected(async () => {
    expect(before, `配送先ID ${didB} の始めの値`).not.toBeNull();
    expect(after, `表示していなかった配送先ID ${didB} の全項目（更新前のまま）`).toEqual(before);
  });
});

caseTest("IT-M08-09-015", async (ctx) => {
  const { 会員ID, did, 移った先 } = await 編集して登録(ctx, "015", "〔配送先ID-M0809-015〕", (e) => e.fill({ 会社名: "遷移確認会社" }));
  await ctx.expected(async () => {
    expect.soft(移った先, "登録後の画面（同じ配送先の編集画面）").toBe(配送先編集のパス(会員ID, did));
    expect.soft(移った先, "配送先一覧画面（会員登録編集画面）へ移らない").not.toBe(会員編集のパス(会員ID));
  });
});

caseTest("IT-M08-09-017", async (ctx) => {
  const { 会員ID, did, edit, 移った先 } = await 編集して登録(ctx, "017", "〔配送先ID-M0809-017〕", (e) => e.fill({ 配送先名称: "", 会社名: "入力保持会社" }));
  await ctx.expected(async () => {
    expect.soft(移った先, "登録後の画面（同じ配送先の編集画面）").toBe(配送先編集のパス(会員ID, did));
    expect.soft(await edit.配送先名称のエラー(), "配送先名称のエラー内容").not.toBe("");
    expect.soft(await edit.値("company_name"), "入力した配送先会社名").toBe("入力保持会社");
  });
});

caseTest("IT-M08-09-020", async (ctx) => {
  const { did } = await 編集して登録(ctx, "020", "〔配送先ID-M0809-020〕", (e) => e.fill({ 国: 国名.Japan, セイ: "", メイ: "", 海外用郵便番号: "", 住所3: "", 会社名: "" }));
  let r: 配送先の行 | null = null;
  await ctx.step(4, async () => { r = 配送先(did); note(`DB の値: ${JSON.stringify(項目(r))}`); });
  await ctx.expected(async () => {
    const got = r as 配送先の行 | null;
    expect(got, `配送先ID ${did}`).not.toBeNull();
    for (const k of ["セイ", "メイ", "海外用郵便番号", "住所3", "会社名"] as const) expect.soft(空か(got?.[k]), `配送先ID ${did} の${k}が空`).toBe(true);
  });
});

caseTest("IT-M08-09-021", async (ctx) => {
  const v = { 配送先名称: "名".repeat(128), 姓: "姓".repeat(16), 名: "名".repeat(16), セイ: "カ".repeat(25), メイ: "ナ".repeat(25), 住所1: "住".repeat(90), 住所2: "所".repeat(90), 会社名: "会".repeat(100) };
  const { did } = await 編集して登録(ctx, "021", "〔配送先ID-M0809-021〕", (e) => e.fill(v));
  let r: 配送先の行 | null = null;
  await ctx.step(4, async () => { r = 配送先(did); });
  await ctx.expected(async () => {
    const got = 項目(r) as Record<string, string | null> | null;
    for (const [k, want] of Object.entries(v)) expect.soft(got?.[k], `配送先ID ${did} の${k}（${want.length}文字）`).toBe(want);
  });
});

caseTest("IT-M08-09-023", async (ctx) => {
  const { did } = await 編集して登録(ctx, "023", "〔配送先ID-M0809-023〕", (e) => e.fill({ 国: 国名.Japan, 電話: ["12345", "23456", "34567"], 郵便番号: ["123", "4567"] }));
  let r: 配送先の行 | null = null;
  await ctx.step(4, async () => { r = 配送先(did); });
  await ctx.expected(async () => {
    const got = r as 配送先の行 | null;
    expect.soft([got?.電話1, got?.電話2, got?.電話3], `配送先ID ${did} の配送先電話番号1・2・3`).toEqual(["12345", "23456", "34567"]);
    expect.soft(got?.郵便番号, `配送先ID ${did} の配送先郵便番号（1・2 を続けたもの）`).toBe("1234567");
  });
});

caseTest("IT-M08-09-025", async (ctx) => {
  const 値 = "1".repeat(100);
  const { did } = await 編集して登録(ctx, "025", "〔配送先ID-M0809-025〕", async (e) => {
    await e.fill({ 国: 国名.米国, 都道府県: 海外, 郵便番号: ["", ""], 海外用郵便番号: 値 });
    note(`国「米国」は開発環境の「${国名.米国}」、都道府県「海外」は「${海外}」で読み替えた（国が Japan 以外のとき、画面は都道府県の欄を出さず日本国外で保存する）`);
  });
  let r: 配送先の行 | null = null;
  await ctx.step(4, async () => { r = 配送先(did); });
  await ctx.expected(async () => {
    expect((r as 配送先の行 | null)?.海外用郵便番号, `配送先ID ${did} の配送先海外用郵便番号（100文字）`).toBe(値);
  });
});

caseTest("IT-M08-09-043", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const edit = new DeliveryEditPage(page);
  const 会員ID = notes.get("〔会員ID-M0809-043〕");
  const did = notes.get("〔配送先ID-M0809-043〕");
  let r: 配送先の行 | null = null;
  await step(1, async () => { await edit.open(会員ID, did); });
  await step(2, async () => { await edit.fill({ 会社名: "1回目会社-M0809-043" }); });
  await step(3, async () => { expect(await edit.pressRegister(), "1回目の登録後の画面").toBe(配送先編集のパス(会員ID, did)); });
  await step(4, async () => { await edit.fill({ 会社名: "2回目会社-M0809-043" }); });
  await step(5, async () => { await edit.pressRegister(); note(`2回目の登録後の画面: ${path(page)}`); });
  await step(6, async () => { r = 配送先(did); });
  await expected(async () => { expect((r as 配送先の行 | null)?.会社名, `配送先ID ${did} の配送先会社名`).toBe("2回目会社-M0809-043"); });
});

// ---- 削除 ----

caseTest("IT-M08-09-030", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const list = new DeliveryListPage(page);
  const did = notes.get("〔配送先ID-M0809-030A〕");
  let r: 配送先の行 | null = null;
  await step(1, async () => { await list.open(notes.get("〔会員ID-M0809-030〕")); });
  let modal!: Awaited<ReturnType<DeliveryListPage["削除の操作を選ぶ"]>>;
  await step(2, async () => { modal = await list.削除の操作を選ぶ(did); });
  await step(3, async () => { await list.キャンセルする(modal); });
  await step(4, async () => { r = 配送先(did); });
  await expected(async () => {
    const got = r as 配送先の行 | null;
    expect.soft(got?.配送先ID, `配送先ID ${did}（削除されずに残る）`).toBe(did);
    expect.soft(got?.削除の印, `配送先ID ${did} の削除の印（付かない）`).toBe("0");
    expect.soft(got?.配送先名称, `配送先ID ${did} の配送先名称`).toBe("削除対象配送先-030");
  });
});

/** 一覧を開き（手順1）、削除の操作を選び（手順2）、確認ダイアログで了承する（手順3） */
async function 削除して了承(ctx: CaseCtx, n: string): Promise<{ 会員ID: string; 移った先: string; ダイアログの文: string }> {
  const { page, notes, step } = ctx;
  await signIn(page);
  const list = new DeliveryListPage(page);
  const 会員ID = notes.get(`〔会員ID-M0809-${n}〕`);
  let modal!: Awaited<ReturnType<DeliveryListPage["削除の操作を選ぶ"]>>;
  let 移った先 = "";
  let ダイアログの文 = "";
  await step(1, async () => { await list.open(会員ID); });
  await step(2, async () => { modal = await list.削除の操作を選ぶ(notes.get(`〔配送先ID-M0809-${n}A〕`)); ダイアログの文 = ((await modal.innerText()) ?? "").replace(/\s+/g, " ").trim(); });
  await step(3, async () => { 移った先 = await list.了承する(modal); note(`確認ダイアログの文: ${ダイアログの文}・了承したあとの画面: ${移った先}`); });
  return { 会員ID, 移った先, ダイアログの文 };
}

caseTest("IT-M08-09-031", async (ctx) => {
  const did = ctx.notes.get("〔配送先ID-M0809-031A〕");
  const { ダイアログの文 } = await 削除して了承(ctx, "031");
  let r: 配送先の行 | null = null;
  await ctx.step(4, async () => { r = 配送先(did); note(`DB の配送先ID ${did}: ${r ? `行あり（削除の印 ${(r as 配送先の行).削除の印}・配送先名称 ${(r as 配送先の行).配送先名称}）` : "行なし"}`); });
  await ctx.expected(async () => {
    expect.soft(ダイアログの文, "確認ダイアログに対象の配送先名称").toContain("削除対象配送先-031");
    const got = r as 配送先の行 | null;
    // アプリの削除は削除の印を付ける（行は残す）作り。行が無いか、削除の印が付いていれば「削除された」とみる
    expect.soft(got === null || got.削除の印 === "1", `配送先ID ${did} と配送先名称「削除対象配送先-031」が削除された`).toBe(true);
  });
});

caseTest("IT-M08-09-032", async (ctx) => {
  const didB = ctx.notes.get("〔配送先ID-M0809-032B〕");
  const before = 項目(配送先(didB));
  await 削除して了承(ctx, "032");
  let after: ReturnType<typeof 項目> = null;
  await ctx.step(4, async () => { after = 項目(配送先(didB)); });
  await ctx.expected(async () => {
    expect(before, `配送先ID ${didB} の始めの値`).not.toBeNull();
    expect(after, `削除対象ではない配送先ID ${didB} の全項目（そのまま）`).toEqual(before);
  });
});

caseTest("IT-M08-09-033", async (ctx) => {
  const { 会員ID, 移った先 } = await 削除して了承(ctx, "033");
  await ctx.expected(async () => { expect(移った先, "了承したあとの画面（会員情報編集画面）").toBe(会員編集のパス(会員ID)); });
});

// ---- 一覧の枠の表示 ----

caseTest("IT-M08-09-041", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const list = new DeliveryListPage(page);
  let 既定 = { 編集: -1, 削除: -1 }, 国内 = { 編集: -1, 削除: -1 };
  await step(1, async () => { await list.open(notes.get("〔会員ID-M0809-041〕")); });
  await step(2, async () => {
    const a = list.名称の行("既定配送先-M0809-041");
    await expect(a, "「既定配送先-M0809-041」の枠").toHaveCount(1);
    既定 = await list.操作(a);
    const b = list.行(notes.get("〔配送先ID-M0809-041B〕"));
    await expect(b, "「国内配送先-M0809-041」の枠").toHaveCount(1);
    国内 = await list.操作(b);
    note(`操作の数: 既定配送先 編集${既定.編集}・削除${既定.削除} / 国内配送先 編集${国内.編集}・削除${国内.削除}`);
  });
  await expected(async () => {
    expect.soft(既定, "「既定配送先-M0809-041」の枠の編集と削除の操作（表示されない）").toEqual({ 編集: 0, 削除: 0 });
    expect.soft(国内.編集 > 0 && 国内.削除 > 0, "「国内配送先-M0809-041」の枠の編集と削除の操作（表示される）").toBe(true);
  });
});

caseTest("IT-M08-09-042", async ({ page, notes, step, expected }) => {
  await signIn(page);
  const list = new DeliveryListPage(page);
  const t: Record<"A" | "B" | "C" | "D", string> = { A: "", B: "", C: "", D: "" };
  await step(1, async () => { await list.open(notes.get("〔会員ID-M0809-042〕")); });
  await step(2, async () => {
    for (const k of ["A", "B", "C", "D"] as const) t[k] = await list.文(list.行(notes.get(`〔配送先ID-M0809-042${k}〕`)));
    note(`枠の表示: ${Object.entries(t).map(([k, v]) => `(${k}) ${v}`).join(" / ")}`);
  });
  await expected(async () => {
    expect.soft(t.A, "国内配送先-M0809-042A の枠（郵便番号）").toContain("100-0001");
    expect.soft(t.A, "国内配送先-M0809-042A の枠（配送先都道府県）").toContain("東京都");
    for (const [k, 郵便] of [["B", "94105"], ["C", "10001"]] as const) {
      expect.soft(t[k], `(${k}) の枠（配送先海外用郵便番号）`).toContain(郵便);
      expect.soft(t[k], `(${k}) の枠（国名「米国」＝${国名.米国}）`).toContain(国名.米国);
      expect.soft(t[k], `(${k}) の枠に郵便番号（〒）が表示されない`).not.toContain("〒");
      expect.soft(t[k], `(${k}) の枠に配送先都道府県が表示されない`).not.toContain(海外);
    }
    expect.soft(t.D, "配送先名称が未登録の枠（名称未設定）").toContain("名称未設定");
    expect.soft(t.D, "配送先名称が未登録の枠（郵便番号）").toContain("100-0001");
    expect.soft(t.D, "配送先名称が未登録の枠（配送先都道府県）").toContain("東京都");
  });
});
