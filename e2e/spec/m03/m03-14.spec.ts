/** M03-14 略称タグ登録/編集。正本: cases/M03-14_test_cases.tsv */
import { expect, Page, test } from "@playwright/test";
import { 名称の略称タグ, 略称タグ, 略称タグIDの最大値, 略称タグの件数 } from "../../db/short_tag";
import { CaseCtx, caseTest } from "../../lib/case";
import { csvRecords } from "../../lib/csv";
import { サーバーの時刻, アプリの時刻帯 } from "../../lib/app_config";
import { Account, loginAdmin } from "../../lib/session";
import { tamperToken } from "../../pages/admin/devtools";
import { openProductEdit, shortTagOptions } from "../../pages/admin/product_edit";
import { ShortTagInput, ShortTagPage, SubmitResult, shortTagDeletePath, shortTagEditUrl, shortTagNewUrl } from "../../pages/admin/short_tag";
import { M0314_ADMIN, M0314L_ADMIN } from "../../seeds/m03-14";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/**
 * 正本の事前準備①「新しいブラウザセッションで m0314_admin としてログインし、略称タグ一覧の表示ページを1、表示件数を12000件にする」。
 * 表示ページ・表示件数を定めないケース（ログインしているだけ）は list を false にする。
 */
async function signIn(page: Page, list = true, account: Account = M0314_ADMIN): Promise<ShortTagPage> {
  await loginAdmin(page, account);
  const tag = new ShortTagPage(page);
  if (list) await tag.showFirstPageWith("12000");
  return tag;
}

/** 登録ボタンの結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`登録ボタンを押したあとの応答: ${r.status}`);
  else note(`登録ボタンを押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残す */
async function noteMessages(page: Page, when: string): Promise<void> {
  const texts = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  note(`${when}の画面上部のメッセージ: ${texts.length ? texts.join(" / ") : "なし"}`);
}

const values = (名称: string, 並び順: string, アルファベット順: boolean): ShortTagInput => ({ 名称, 並び順, アルファベット順 });
const path = (page: Page) => new URL(page.url()).pathname;
const newPath = new URL(shortTagNewUrl()).pathname;
const editPath = (id: string) => new URL(shortTagEditUrl(id)).pathname;

// ---- 表示 ----

caseTest("IT-M03-14-001", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await expected(async () => {
    await expect(tag.入力欄の見出し, "入力欄の見出し（新規入力欄）").toHaveText(/^\s*新規追加\s*$/);
    expect(await tag.inputValues(), "新規入力欄の値").toEqual(values("", "", false));
  });
});

caseTest("IT-M03-14-002", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔略称タグID-M0314-002〕");
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.pressEdit(id); });
  await expected(async () => {
    expect(await tag.inputValues(), `ID ${id} の入力欄に読み込まれた値`).toEqual(values("使用中略称-002", "20", true));
    note("正本の「新規入力欄へ戻るボタン」は、画面の「新規登録へ戻る」ボタンとして確かめた（名称の違い）");
    await expect(tag.新規登録へ戻る, "新規入力欄へ戻るボタン").toBeVisible();
  });
});

caseTest("IT-M03-14-003", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔略称タグID-M0314-003〕");
  const loaded: Record<string, { path: string; values: ShortTagInput }> = {};
  const read = async (列: string) => { loaded[列] = { path: path(page), values: await tag.inputValues() }; };
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.pressColumnLink(id, "ID"); await read("ID"); });
  await step(3, async () => { await tag.openNew(); await tag.pressColumnLink(id, "名称"); await read("名称"); });
  await step(4, async () => { await tag.openNew(); await tag.pressColumnLink(id, "並び順"); await read("並び順"); });
  await expected(async () => {
    for (const 列 of ["ID", "名称", "並び順"]) {
      expect.soft(loaded[列]?.path, `${列}のリンクで開いた画面`).toBe(editPath(id));
      expect.soft(loaded[列]?.values, `${列}のリンクで入力欄へ読み込まれた値`).toEqual(values("編集前略称-003", "10", false));
    }
  });
});

caseTest("IT-M03-14-004", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(notes.get("〔略称タグID-M0314-004〕")); });
  await step(2, async () => { await tag.pressBackToNew(); });
  await expected(async () => {
    expect(path(page), "新規入力欄の画面").toBe(newPath);
    await expect(tag.入力欄の見出し, "入力欄の見出し（新規入力欄）").toHaveText(/^\s*新規追加\s*$/);
    expect(await tag.inputValues(), "新規入力欄の値").toEqual(values("", "", false));
  });
});

caseTest("IT-M03-14-005", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔略称タグID-M0314-005〕");
  let status = 0;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.pressEdit(id); });
  await step(3, async () => {
    expect(path(page), "表示された編集画面のURL").toBe(editPath(id));
    const res = await page.goto(shortTagEditUrl("999999"));
    status = res?.status() ?? 0;
  });
  await expected(async () => {
    expect(status, "略称タグID 999999 の編集画面URLの応答").toBe(404);
  });
});

caseTest("IT-M03-14-006", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const ids = ["共有A", "共有B", "共有C"].map((k) => notes.get(`〔略称タグID-M0314-${k}〕`));
  const rows: { 名称: string; 並び順: string }[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    for (const id of ids) {
      await expect(tag.rowById(id), `一覧にID ${id} の行が1件`).toHaveCount(1);
      const r = await tag.readRow(tag.rowById(id));
      rows.push({ 名称: r.名称, 並び順: r.並び順 });
    }
  });
  await expected(async () => {
    expect(rows, "ID 共有A・共有B・共有C の行の名称と並び順").toEqual([
      { 名称: "編集前略称-006", 並び順: "10" }, { 名称: "使用中略称-006", 並び順: "20" }, { 名称: "重複先略称-006", 並び順: "30" },
    ]);
  });
});

/** 一覧で、対象のIDの行だけを上から順に並べる */
async function orderOf(tag: ShortTagPage, ids: string[]): Promise<string[]> {
  const shown = (await tag.allRows()).map((r) => r.ID).filter((id) => ids.includes(id));
  if (shown.length !== ids.length) throw new Error(`一覧に対象の行が ${shown.length} 件しかない（${ids.length} 件のはず）`);
  return shown;
}

caseTest("IT-M03-14-007", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const [a, b, c] = ["共有A", "共有B", "共有C"].map((k) => notes.get(`〔略称タグID-M0314-${k}〕`));
  let order: string[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { order = await orderOf(tag, [a, b, c]); });
  await expected(async () => {
    expect(order, "上からの順（並び順10・20・30）").toEqual([a, b, c]);
  });
});

caseTest("IT-M03-14-008", async ({ page, step, expected }) => {
  const tag = await signIn(page, false);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    await Promise.all([page.waitForURL((u) => u.pathname.endsWith("/product/storage_code/csv")), tag.CSV入力.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    await expect(page.locator("h3.c-primaryCol__title"), "移った画面の見出し").toHaveText(/^\s*略称タグ登録CSVアップロード\s*$/);
  });
});

caseTest("IT-M03-14-009", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.chooseCount("10"); });
  await step(3, async () => { await tag.choosePage(2); });
  await expected(async () => {
    expect(path(page), "略称タグ一覧の2ページ目の画面").toBe(new URL(shortTagNewUrl()).pathname + "/page/2");
    expect(await tag.currentPage(), "ページングのいまのページ").toBe("2");
    expect((await tag.allRows()).length, "2ページ目の行数（表示件数10件）").toBeGreaterThan(0);
  });
});

// ---- 登録・更新 ----

caseTest("IT-M03-14-010", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  let saved: ReturnType<typeof 名称の略称タグ> = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values("新規略称A", "40", true)); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); });
  await step(4, async () => { saved = 名称の略称タグ("新規略称A"); });
  await expected(async () => {
    expect(saved.map((t) => ({ 名称: t.名称, 並び順: t.並び順, アルファベット順: t.アルファベット順 })), "名称「新規略称A」の略称タグ")
      .toEqual([{ 名称: "新規略称A", 並び順: "40", アルファベット順: true }]);
  });
});

caseTest("IT-M03-14-011", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values("遷移確認略称", "41", true)); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await tag.ready(); });
  await expected(async () => {
    expect(path(page), "移った画面（保存した略称タグの編集欄）").toMatch(/\/product\/storage\/\d+$/);
    await expect(tag.入力欄の見出し, "入力欄の見出し（編集欄）").toHaveText(/^\s*編集\s*$/);
    expect(await tag.inputValues(), "入力欄に読み込まれた値").toEqual(values("遷移確認略称", "41", true));
  });
});

caseTest("IT-M03-14-012", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  let saved: ReturnType<typeof 名称の略称タグ> = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values("任意項目空略称", "42", false)); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); });
  await step(4, async () => { saved = 名称の略称タグ("任意項目空略称"); });
  await expected(async () => {
    expect(saved.map((t) => ({ 名称: t.名称, 並び順: t.並び順, アルファベット順: t.アルファベット順 })), "名称「任意項目空略称」の略称タグ")
      .toEqual([{ 名称: "任意項目空略称", 並び順: "42", アルファベット順: false }]);
  });
});

/** 編集ボタンで開いた編集欄に入力して登録し、DBでその略称タグを確かめる形 */
async function editAndCheck(
  ctx: CaseCtx, idLabel: string, input: Partial<ShortTagInput>,
): Promise<ReturnType<typeof 略称タグ>> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(idLabel);
  let saved: ReturnType<typeof 略称タグ> = null;
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(id); });
  await step(2, async () => { await tag.fill(input); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); if (path(page) !== editPath(id)) await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { saved = 略称タグ(id); });
  return saved;
}

caseTest("IT-M03-14-013", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-013〕", values("編集後略称", "25", true));
  await ctx.expected(async () => {
    expect(saved && { 名称: saved.名称, 並び順: saved.並び順, アルファベット順: saved.アルファベット順 }, "ID 013 の略称タグ")
      .toEqual({ 名称: "編集後略称", 並び順: "25", アルファベット順: true });
  });
});

caseTest("IT-M03-14-014", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  const before = { 件数: 略称タグの件数(), 最大ID: 略称タグIDの最大値() };
  let after = before;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { noteSubmit(await tag.pressRegister()); });
  await step(3, async () => { after = { 件数: 略称タグの件数(), 最大ID: 略称タグIDの最大値() }; });
  await expected(async () => {
    expect(after, "略称タグの件数と最大のID（登録ボタンを押す前と同じ）").toEqual(before);
  });
});

caseTest("IT-M03-14-015", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-015〕", { 名称: "", 並び順: "" });
  await ctx.expected(async () => {
    expect(saved && { 名称: saved.名称, 並び順: saved.並び順, アルファベット順: saved.アルファベット順 }, "ID 015 の略称タグ（更新されない）")
      .toEqual({ 名称: "編集前略称-015", 並び順: "10", アルファベット順: false });
  });
});

caseTest("IT-M03-14-016", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(notes.get("〔略称タグID-M0314-016〕")); });
  await step(2, async () => { await tag.fill({ 名称: "", 並び順: "123", アルファベット順: true }); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect(path(page), "戻った画面（新規入力欄）").toBe(newPath);
    await expect(tag.入力欄の見出し, "入力欄の見出し（新規入力欄）").toHaveText(/^\s*新規追加\s*$/);
    const v = await tag.inputValues();
    expect.soft(v.並び順, "並び順（123が復元されない）").not.toBe("123");
    expect.soft(v.アルファベット順, "アルファベット順ソートフラグ（ONが復元されない）").toBe(false);
    await expect.soft(tag.form.locator(".invalid-feedback, .form-error-message").filter({ hasText: /\S/ }), "入力欄の直下のエラー").toHaveCount(0);
  });
});

caseTest("IT-M03-14-017", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔略称タグID-M0314-017〕");
  let ids: string[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill({ 名称: "重複先略称", 並び順: "40" }); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { ids = 名称の略称タグ("重複先略称").map((t) => t.略称タグID); });
  await expected(async () => {
    expect(ids, "名称「重複先略称」の略称タグ").toEqual([id]);
  });
});

caseTest("IT-M03-14-018", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-018A〕", { 名称: "重複先略称" });
  await ctx.expected(async () => {
    expect(saved?.名称, "ID 018A の名称（更新されない）").toBe("編集前略称-018");
  });
});

caseTest("IT-M03-14-019", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(notes.get("〔略称タグID-M0314-019A〕")); });
  await step(2, async () => { await tag.fill({ 名称: "重複先略称" }); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect(path(page), "戻った画面（新規入力欄）").toBe(newPath);
    await expect(tag.入力欄の見出し, "入力欄の見出し（新規入力欄）").toHaveText(/^\s*新規追加\s*$/);
  });
});

caseTest("IT-M03-14-020", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const [a, b] = ["020A", "020B"].map((k) => notes.get(`〔略称タグID-M0314-${k}〕`));
  let ranks: (string | undefined)[] = [];
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(a); });
  await step(2, async () => { await tag.fill({ 並び順: "30" }); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); });
  await step(4, async () => { ranks = [略称タグ(a)?.並び順, 略称タグ(b)?.並び順]; });
  await expected(async () => {
    expect(ranks, "ID 020A と 020B の並び順").toEqual(["30", "30"]);
  });
});

caseTest("IT-M03-14-021", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-021〕", { 並び順: "0" });
  await ctx.expected(async () => { expect(saved?.並び順, "ID 021 の並び順").toBe("0"); });
});

caseTest("IT-M03-14-022", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-022〕", { 並び順: "32767" });
  await ctx.expected(async () => { expect(saved?.並び順, "ID 022 の並び順").toBe("32767"); });
});

caseTest("IT-M03-14-023", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-023〕", { 並び順: "-1" });
  await ctx.expected(async () => { expect(saved?.並び順, "ID 023 の並び順（10から更新されない）").toBe("10"); });
});

caseTest("IT-M03-14-024", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔略称タグID-M0314-024〕", { 並び順: "32768" });
  await ctx.expected(async () => { expect(saved?.並び順, "ID 024 の並び順（10から更新されない）").toBe("10"); });
});

caseTest("IT-M03-14-025", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(notes.get("〔略称タグID-M0314-025〕")); });
  await step(2, async () => { await tag.fill({ 並び順: "-1" }); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    note("正本の「略称タグ一覧画面」は、略称タグの一覧がある略称タグ登録/編集画面（編集対象を指定しない画面）と解釈した");
    expect(path(page), "移った画面").toBe(newPath);
    expect((await tag.allRows()).length, "略称タグの一覧の行").toBeGreaterThan(0);
  });
});

// ---- なりすまし対策トークン ----

/** 編集欄で名称を変え、なりすまし対策トークンを「invalid-token」へ変えて登録ボタンを押す（手順1〜4） */
async function tamperedUpdate(ctx: CaseCtx, idLabel: string): Promise<SubmitResult> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await tag.openNew(); await tag.pressEdit(notes.get(idLabel)); });
  await step(2, async () => { await tag.fill({ 名称: "トークン改ざん更新" }); });
  await step(3, async () => { await tamperToken(tag.form, "invalid-token"); });
  await step(4, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(page, "登録ボタンを押したあと"); });
  return r;
}

caseTest("IT-M03-14-026", async (ctx) => {
  const r = await tamperedUpdate(ctx, "〔略称タグID-M0314-026〕");
  await ctx.expected(async () => {
    expect(r.sent ? r.status : "（要求が送られていない）", "登録ボタンを押したあとの応答").toBe(403);
  });
});

caseTest("IT-M03-14-027", async (ctx) => {
  await tamperedUpdate(ctx, "〔略称タグID-M0314-027〕");
  const id = ctx.notes.get("〔略称タグID-M0314-027〕");
  let name: string | undefined;
  await ctx.step(5, async () => { name = 略称タグ(id)?.名称; });
  await ctx.expected(async () => { expect(name, "ID 027 の名称（更新されない）").toBe("編集前略称-027"); });
});

/** 削除の要求から、なりすまし対策トークンを除く（開発者ツールで要求を書き換えるのと同じ） */
async function stripDeleteToken(page: Page, id: string): Promise<void> {
  await page.route(`**${shortTagDeletePath(id)}`, async (route) => {
    const form = new URLSearchParams(route.request().postData() ?? "");
    if (!form.has("_token")) throw new Error("削除の要求に、なりすまし対策トークンが無い");
    form.delete("_token");
    await route.continue({ postData: form.toString() });
  });
}

/** トークンを除いた削除の要求を、削除ボタンと確認ダイアログの承認で送る（手順1〜3）。応答の状態を返す */
async function deleteWithoutToken(ctx: CaseCtx, idLabel: string): Promise<number> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(idLabel);
  let status = 0;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await stripDeleteToken(page, id); });
  await step(3, async () => {
    const { dialog, response } = await tag.pressDelete(tag.rowById(id), true);
    status = response?.status() ?? 0;
    note(`確認ダイアログ「${dialog}」で承認した。削除の要求の応答: ${status}`);
  });
  return status;
}

caseTest("IT-M03-14-028", async (ctx) => {
  const status = await deleteWithoutToken(ctx, "〔略称タグID-M0314-028〕");
  await ctx.expected(async () => { expect(status, "削除の要求の応答").toBe(403); });
});

caseTest("IT-M03-14-029", async (ctx) => {
  await deleteWithoutToken(ctx, "〔略称タグID-M0314-029〕");
  const id = ctx.notes.get("〔略称タグID-M0314-029〕");
  let left: ReturnType<typeof 略称タグ> = null;
  await ctx.step(4, async () => { left = 略称タグ(id); });
  await ctx.expected(async () => { expect(left?.略称タグID, "ID 029 の略称タグ（削除されずに残る）").toBe(id); });
});

// ---- 削除 ----

/** 削除ボタンを押し、確認ダイアログで承認する（手順1〜2） */
async function deleteByButton(ctx: CaseCtx, idLabel: string): Promise<ShortTagPage> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(idLabel);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    const { dialog, response, landed } = await tag.pressDelete(tag.rowById(id), true);
    note(`確認ダイアログ「${dialog}」で承認した。削除の要求の応答: ${response?.status() ?? "不明"}・移った画面の応答: ${landed?.status() ?? "不明"}`);
    await tag.ready();
    await noteMessages(page, "削除のあと");
  });
  return tag;
}

caseTest("IT-M03-14-030", async (ctx) => {
  await deleteByButton(ctx, "〔略称タグID-M0314-030〕");
  const id = ctx.notes.get("〔略称タグID-M0314-030〕");
  let left: ReturnType<typeof 略称タグ> = null;
  await ctx.step(3, async () => { left = 略称タグ(id); });
  await ctx.expected(async () => { expect(left, "ID 030 の略称タグ（DBから削除される）").toBeNull(); });
});

caseTest("IT-M03-14-031", async (ctx) => {
  const tag = await deleteByButton(ctx, "〔略称タグID-M0314-031〕");
  await ctx.expected(async () => {
    expect(path(ctx.page), "削除後に移った画面").toBe(newPath);
    await expect(tag.入力欄の見出し, "略称タグ登録/編集画面の入力欄の見出し").toHaveText(/^\s*新規追加\s*$/);
  });
});

caseTest("IT-M03-14-032", async (ctx) => {
  await deleteByButton(ctx, "〔略称タグID-M0314-032〕");
  const id = ctx.notes.get("〔略称タグID-M0314-032〕");
  let left: ReturnType<typeof 略称タグ> = null;
  await ctx.step(3, async () => { left = 略称タグ(id); });
  await ctx.expected(async () => { expect(left?.略称タグID, "ID 032 の略称タグ（削除されずに残る）").toBe(id); });
});

caseTest("IT-M03-14-033", async (ctx) => {
  const tag = await deleteByButton(ctx, "〔略称タグID-M0314-033〕");
  const id = ctx.notes.get("〔略称タグID-M0314-033〕");
  await ctx.expected(async () => {
    expect(path(ctx.page), "削除を中止したあとに移った画面").toBe(newPath);
    await expect(tag.入力欄の見出し, "略称タグ登録/編集画面の入力欄の見出し").toHaveText(/^\s*新規追加\s*$/);
    await expect(tag.rowById(id), "削除を中止した略称タグの行が一覧に残る").toHaveCount(1);
  });
});

caseTest("IT-M03-14-034", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔略称タグID-M0314-034〕");
  let status = 0;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    const link = tag.rowById(id).getByRole("link", { name: "削除", exact: true });
    await expect(link, `ID ${id} の行の削除ボタン`).toHaveCount(1);
    const href = (await link.getAttribute("href")) ?? "";
    if (!href.endsWith(shortTagDeletePath(id))) throw new Error(`ID ${id} の削除先URLが想定と違う: ${href}`);
    await link.evaluate((a, to) => a.setAttribute("href", to), href.replace(shortTagDeletePath(id), shortTagDeletePath("999999")));
  });
  await step(3, async () => {
    const { dialog, response } = await tag.pressDelete(tag.rowById(id), true);
    status = response?.status() ?? 0;
    note(`確認ダイアログ「${dialog}」で承認した。削除の要求の応答: ${status}`);
  });
  await expected(async () => { expect(status, "略称タグID 999999 の削除の要求の応答").toBe(404); });
});

// ---- CSV出力 ----

/** 日時（UNIX 時刻の秒）を、時刻帯の年月日時分秒14桁にする */
function ymdHis(epochSeconds: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(epochSeconds * 1000));
  const p = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return `${p("year")}${p("month")}${p("day")}${p("hour")}${p("minute")}${p("second")}`;
}

caseTest("IT-M03-14-037", async ({ page, step, expected }) => {
  const tag = await signIn(page, false);
  const timeZone = アプリの時刻帯();
  let fileName = "", before = "", after = "", where = "";
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    before = ymdHis(サーバーの時刻(), timeZone);
    ({ fileName } = await tag.downloadCsv());
    after = ymdHis(サーバーの時刻(), timeZone);
  });
  await step(3, async () => { where = path(page); note(`ダウンロードしたファイルの名前: ${fileName}（押す前後のサーバーの時刻 ${before}〜${after}、時刻帯 ${timeZone}）`); });
  await expected(async () => {
    expect(where, "CSV出力を押したあとの画面（遷移しない）").toBe(newPath);
    const m = fileName.match(/^storage_code_(\d{14})\.csv$/);
    expect(m, "ファイルの名前（storage_code_ ＋ 年月日時分秒14桁 ＋ .csv）").not.toBeNull();
    expect(m![1] >= before && m![1] <= after, `ファイルの名前の時刻 ${m![1]} が、押す前後のサーバーの時刻 ${before}〜${after} の間`).toBe(true);
  });
});

// ---- 機能間の連携 ----

/** 一覧の表示中のページに名称の行が無ければ、件数欄で12000件を選んで探す（正本は表示件数を定めない） */
async function findInList(tag: ShortTagPage, 名称: string): Promise<number> {
  if ((await tag.rowsByName(名称).count()) === 0 && (await tag.件数.inputValue()) !== "12000") {
    note(`一覧の表示中のページに「${名称}」の行が無いので、件数欄で12000件を選んで一覧の全件から探した`);
    await tag.chooseCount("12000");
  }
  return tag.rowsByName(名称).count();
}

caseTest("IT-M03-14-041", async ({ page, notes, step, expected }) => {
  const name = "L001M0314n041連携略称タグ";
  const tag = new ShortTagPage(page);
  let options: string[] = [];
  await step(1, async () => { await loginAdmin(page, M0314L_ADMIN); });
  await step(2, async () => { await tag.openNew(); await tag.fill({ 名称: name, 並び順: "10" }); noteSubmit(await tag.pressRegister()); });
  await step(3, async () => {
    await expect(page.locator(".alert-success"), "画面上部の完了の表示").toContainText("登録が完了しました。");
    expect(await findInList(tag, name), `一覧の「${name}」の行`).toBe(1);
  });
  await step(4, async () => { await openProductEdit(page, notes.get("〔商品ID-M0314-041〕")); });
  await step(5, async () => { options = await shortTagOptions(page); });
  await expected(async () => {
    expect(options, "略称タグ欄（単一選択）の選択肢").toContain(name);
  });
});

caseTest("IT-M03-14-042", async ({ page, notes, step, expected }) => {
  const name = "L002M0314n042削除略称タグ";
  const productId = notes.get("〔商品ID-M0314-042〕");
  const tag = new ShortTagPage(page);
  let options: string[] = [];
  await step(1, async () => { await loginAdmin(page, M0314L_ADMIN); });
  await step(2, async () => {
    await openProductEdit(page, productId);
    expect(await shortTagOptions(page), "削除前の略称タグ欄の選択肢").toContain(name);
  });
  await step(3, async () => {
    await tag.openNew();
    expect(await findInList(tag, name), `一覧の「${name}」の行`).toBe(1);
    const { dialog } = await tag.pressDelete(tag.rowsByName(name), true);
    note(`確認ダイアログ「${dialog}」で承認した`);
    await tag.ready();
  });
  await step(4, async () => {
    await expect(page.locator(".alert-success"), "画面上部の削除の表示").toContainText("削除しました");
    expect(await findInList(tag, name), `一覧の「${name}」の行`).toBe(0);
  });
  await step(5, async () => { await openProductEdit(page, productId); });
  await step(6, async () => { options = await shortTagOptions(page); });
  await expected(async () => {
    expect(options, "略称タグ欄の選択肢").not.toContain(name);
  });
});

caseTest("IT-M03-14-043", async ({ page, step, expected }) => {
  const name = "連携登録略称-L001M0314n043";
  const tag = await signIn(page, false, M0314L_ADMIN);
  let id = "";
  let rows: Record<string, string>[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values(name, "7001", false)); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await tag.ready(); });
  await step(4, async () => {
    expect(await findInList(tag, name), `一覧の「${name}」の行`).toBe(1);
    id = (await tag.readRow(tag.rowsByName(name))).ID;
  });
  await step(5, async () => { const csv = await tag.downloadCsv(); note(`ダウンロードしたファイル: ${csv.fileName}`); rows = csvRecords(csv.text); });
  await step(6, async () => { rows = rows.filter((r) => r["ID"] === id); });
  await expected(async () => {
    expect(rows, `CSVのID ${id} の行`).toEqual([{ ID: id, 名称: name, 並び順: "7001" }]);
  });
});

caseTest("IT-M03-14-046", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const [a, b, c] = ["046-A", "046-B", "046-C"].map((k) => notes.get(`〔略称タグID-M0314-${k}〕`));
  let order: string[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { order = await orderOf(tag, [a, b, c]); });
  await expected(async () => {
    expect(order, "上からの順（並び順10・20・30）").toEqual([c, b, a]);
  });
});
