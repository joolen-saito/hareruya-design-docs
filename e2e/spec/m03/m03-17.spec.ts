/** M03-17 売上分析タグ登録/編集。正本: cases/M03-17_test_cases.tsv */
import { BrowserContext, Page, Route, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 名称と並び順の売上分析タグ, 名称の売上分析タグ, 売上分析タグ } from "../../db/m03_17_sales_analysis_tag";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { Account, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { tamperToken } from "../../pages/admin/devtools";
import { openProductEdit } from "../../pages/admin/product_edit";
import { salesAnalysisTagOptions } from "../../pages/admin/m03_17_product";
import {
  DeleteResponses, PendingDelete, SalesAnalysisTagInput, SalesAnalysisTagPage, SubmitResult,
  salesAnalysisTagDeletePath, salesAnalysisTagEditUrl, salesAnalysisTagNewUrl, salesAnalysisTagStoreUrl,
} from "../../pages/admin/m03_17_sales_analysis_tag";
import { M0317_ADMIN, M0317L_ADMIN } from "../../seeds/m03-17";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const path = (page: Page) => new URL(page.url()).pathname;
const newPath = new URL(salesAnalysisTagNewUrl()).pathname;
const editPath = (id: string) => new URL(salesAnalysisTagEditUrl(id)).pathname;
const storePath = new URL(salesAnalysisTagStoreUrl()).pathname;
const values = (名称: string, 並び順: string): SalesAnalysisTagInput => ({ 名称, 並び順 });

/**
 * 正本の事前準備①②「新しいブラウザセッションで、売上分析タグ一覧の保持値をページ番号1・表示件数10にする」
 * 「m0317_admin でログインしている」。Playwright はケースごとに新しいブラウザのセッションを使う。
 * 保持値はログイン中のセッションが覚えるので、ログインしてから一覧の1ページ目を開き、件数欄を10件にする（S-M03-17-SESSION の用途）。
 */
async function signIn(page: Page, account: Account = M0317_ADMIN): Promise<SalesAnalysisTagPage> {
  await loginAdmin(page, account);
  const tag = new SalesAnalysisTagPage(page);
  await tag.showFirstPageWith("10");
  return tag;
}

/** 正本の事前準備の「ブラウザB」。ブラウザAとは別のセッションで同じ試験管理者としてログインし、保持値を同じにする */
async function openBrowserB(ctx: CaseCtx): Promise<{ contextB: BrowserContext; tagB: SalesAnalysisTagPage }> {
  const contextB = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(contextB);
  const tagB = await signIn(await contextB.newPage());
  return { contextB, tagB };
}

/** 登録ボタンの結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`登録ボタンを押したあとの応答: ${r.status}`);
  else note(`登録ボタンを押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/**
 * 削除の確認で承認したときの応答の注記。期待結果の「削除要求への応答」は、削除の要求そのものの応答で見る
 * （一覧へ転送するときは転送の状態。転送のあとに開いた一覧の画面の応答は、別に「移った画面の応答」として残す）
 */
function deleteResponsesNote(r: DeleteResponses): string {
  return `削除の要求の応答: ${r.要求}。移った画面の応答: ${r.移った画面 ?? "不明"}`;
}

/** 画面上部・入力欄の直下に出たメッセージを注記に残す */
async function noteMessages(page: Page, when: string): Promise<void> {
  const texts = (await page.locator(".alert, .invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  note(`${when}の画面のメッセージ: ${texts.length ? texts.join(" / ") : "なし"}`);
}

/**
 * 一覧の表示中のページ（表示件数10件）に対象の行が無ければ、件数欄で12000件を選んで一覧の全件を出す。
 * 正本の手順「一覧の行の…ボタンを押す」は、行が表示されていることが前提のため（ほかの売上分析タグが並び順の前に並ぶ）。
 * 並び順が同じ行の並びはページを移るたびに変わりうるので、ページングでは探さない（M03-14 の一覧の探し方と同じ）。
 */
async function showRow(tag: SalesAnalysisTagPage, id: string, who = ""): Promise<void> {
  if ((await tag.rowById(id).count()) > 0) return;
  if (await tag.showAllRows()) note(`${who}一覧の表示中のページ（表示件数10件）にID ${id} の行が無いので、件数欄で12000件を選んで一覧の全件を出した`);
}

/** 期待結果「一覧に残る／一覧から消える」を見るための、一覧の全件の行（表示件数が12000件でなければ、件数欄で12000件を選ぶ） */
async function wholeList(tag: SalesAnalysisTagPage): Promise<string[]> {
  if (await tag.showAllRows()) note("一覧の行が残るか・消えるかは、件数欄で12000件を選んで一覧の全件を出して確かめた");
  return (await tag.allRows()).map((r) => r.ID);
}

/** 正本の手順「ID … の編集画面を開く」。売上分析タグ登録/編集画面を開き、一覧の行の編集ボタンを押す */
async function openEdit(tag: SalesAnalysisTagPage, id: string, who = ""): Promise<void> {
  await tag.openNew();
  await showRow(tag, id, who);
  await tag.pressEdit(id);
}

/**
 * 期待結果「新規登録の入力欄」を見るための、入力欄の見出し・フォームの送り先・名称と並び順の欄の有無。
 * 新規登録の入力欄は、見出しが「新規追加」で、フォームが編集対象を指定しない保存の送り先を指す。
 */
async function formView(tag: SalesAnalysisTagPage): Promise<{ 見出し: string; 送り先: string; 名称の欄: number; 並び順の欄: number }> {
  return {
    見出し: (await tag.入力欄の見出し.count()) ? ((await tag.入力欄の見出し.first().textContent()) ?? "").trim() : "（入力欄の見出しが無い）",
    送り先: (await tag.form.count()) ? await tag.formActionPath() : "（入力欄のフォームが無い）",
    名称の欄: await tag.名称.count(),
    並び順の欄: await tag.並び順.count(),
  };
}
const NEW_FORM = { 見出し: "新規追加", 送り先: storePath, 名称の欄: 1, 並び順の欄: 1 };
const NEW_FORM_WHAT = "入力欄（新規登録の入力欄: 見出し「新規追加」・編集対象を指定しない保存の送り先・名称と並び順の欄）";

/** 期待結果「一覧」: 売上分析タグの一覧（ID・名称・並び順の列）に行が表示されている */
async function expectList(tag: SalesAnalysisTagPage): Promise<void> {
  await expect.soft(tag.一覧, "売上分析タグの一覧").toBeVisible();
  const headings = await tag.listHeadings();
  for (const h of ["ID", "名称", "並び順"]) expect.soft(headings, `一覧の見出しの「${h}」`).toContain(h);
  expect.soft((await tag.allRows()).length, "一覧の行").toBeGreaterThan(0);
}

/** 期待結果「入力内容が保持されず」: 入れた値が入力欄に残っていない（空を入れた項目は、新規登録の入力欄の空と見分けられないので注記） */
async function expectNotRetained(tag: SalesAnalysisTagPage, entered: Partial<SalesAnalysisTagInput>): Promise<void> {
  if ((await tag.名称.count()) === 0 || (await tag.並び順.count()) === 0) {
    expect.soft(false, "入力欄が画面に無い（入れた値が残らないかを見られない）").toBe(true);
    return;
  }
  const shown = await tag.inputValues();
  for (const k of ["名称", "並び順"] as const) {
    const v = entered[k];
    if (v === undefined) continue;
    if (v === "") { note(`${k}は空を入れたので、「保持されず」は新規登録の入力欄の確かめで足りるとした（入力欄の値: 「${shown[k]}」）`); continue; }
    expect.soft(shown[k], `${k}の入力欄（入れた値が残らない）`).not.toBe(v);
  }
}

// ---- 表示 ----

caseTest("IT-M03-17-001", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await expected(async () => {
    expect.soft(path(page), "開いた画面（編集対象を指定しない）").toBe(newPath);
    expect.soft(await formView(tag), NEW_FORM_WHAT).toEqual(NEW_FORM);
    expect.soft(await tag.inputValues(), "新規登録の入力欄の値").toEqual(values("", ""));
    await expectList(tag);
  });
});

caseTest("IT-M03-17-002", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔売上分析タグID-M0317-002〕");
  let row: Awaited<ReturnType<SalesAnalysisTagPage["readRow"]>> | null = null;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    await showRow(tag, id);
    await expect(tag.rowById(id), `一覧にID ${id} の行が1件`).toHaveCount(1);
    row = await tag.readRow(tag.rowById(id));
  });
  await expected(async () => {
    expect(row, `ID ${id} の一覧行の ID・名称・並び順`).toEqual({ ID: id, 名称: "編集前売上分析タグ-002", 並び順: "10" });
  });
});

caseTest("IT-M03-17-004", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔売上分析タグID-M0317-004〕");
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await showRow(tag, id); await tag.pressEdit(id); });
  await expected(async () => {
    expect(await tag.inputValues(), `ID ${id} の入力欄に読み込まれた値`).toEqual(values("編集前売上分析タグ-004", "10"));
  });
});

caseTest("IT-M03-17-005", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await openEdit(tag, notes.get("〔売上分析タグID-M0317-005〕")); });
  await step(2, async () => { await tag.pressBackToNew(); });
  await expected(async () => {
    note("正本の「新規登録の入力欄へ切り替える操作」は、画面の「新規登録へ戻る」ボタンとした");
    expect.soft(path(page), "移った画面（編集対象を指定しない）").toBe(newPath);
    expect.soft(await formView(tag), NEW_FORM_WHAT).toEqual(NEW_FORM);
    expect.soft(await tag.inputValues(), "新規登録の入力欄の値").toEqual(values("", ""));
    await expectList(tag);
  });
});

caseTest("IT-M03-17-006", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔売上分析タグID-M0317-006〕");
  let status = 0;
  await step(1, async () => { await openEdit(tag, id); });
  await step(2, async () => {
    expect(path(page), "表示された編集画面のURL").toBe(editPath(id));
    const replaced = page.url().replace(new RegExp(`/tag_sales_analysis/${id}(?=$|[/?#])`), "/tag_sales_analysis/999999");
    if (replaced === page.url()) throw new Error(`編集画面のURLの売上分析タグIDを置き換えられない: ${page.url()}`);
    const res = await page.goto(replaced);
    status = res?.status() ?? 0;
    note(`開いたURL: ${replaced}`);
  });
  await expected(async () => {
    expect(status, "売上分析タグID 999999 の編集画面への応答").toBe(404);
  });
});

caseTest("IT-M03-17-007", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔売上分析タグID-M0317-007〕");
  const tagA = await signIn(page);
  const { contextB, tagB } = await openBrowserB(ctx);
  try {
    let r!: SubmitResult;
    await step(1, async () => { await openEdit(tagA, id, "ブラウザA: "); });
    await step(2, async () => {
      await tagB.openNew();
      await showRow(tagB, id, "ブラウザB: ");
      const { dialog, 応答 } = await tagB.pressDeleteAndAccept(tagB.rowById(id));
      note(`ブラウザB: 確認ダイアログ「${dialog}」で削除を選んだ。${deleteResponsesNote(応答)}`);
      await noteMessages(tagB.page, "ブラウザBで削除したあと");
    });
    await step(3, async () => {
      await tagA.fill({ 名称: "削除後保存タグ" });
      r = await tagA.pressRegister();
      noteSubmit(r);
    });
    await expected(async () => {
      expect(r.sent ? r.status : "（要求が送られていない）", `ID ${id} の保存要求への応答`).toBe(404);
    });
  } finally {
    await contextB.close();
  }
});

caseTest("IT-M03-17-008", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔売上分析タグID-M0317-008〕");
  const tagA = await signIn(page);
  const { contextB, tagB } = await openBrowserB(ctx);
  try {
    let status = 0;
    await step(1, async () => {
      await tagA.openNew();
      // 手順3でブラウザAに残っている行の削除ボタンを押すため、ブラウザAの一覧には行を表示しておく
      await showRow(tagA, id, "ブラウザA: ");
      await tagB.openNew();
    });
    await step(2, async () => {
      await showRow(tagB, id, "ブラウザB: ");
      const { dialog, 応答 } = await tagB.pressDeleteAndAccept(tagB.rowById(id));
      note(`ブラウザB: 確認ダイアログ「${dialog}」で削除を選んだ。${deleteResponsesNote(応答)}`);
      await noteMessages(tagB.page, "ブラウザBで削除したあと");
    });
    await step(3, async () => {
      const { dialog, 応答 } = await tagA.pressDeleteAndAccept(tagA.rowById(id));
      status = 応答.要求;
      note(`ブラウザA: 確認ダイアログ「${dialog}」で削除を選んだ。${deleteResponsesNote(応答)}`);
    });
    await expected(async () => {
      expect(status, `ID ${id} の削除要求への応答`).toBe(404);
    });
  } finally {
    await contextB.close();
  }
});

// ---- 登録・更新 ----

/** 「ID … の編集画面を開く」「入力する」「登録ボタンを押す」「DBで確認する」の形（手順1〜4）。DBの売上分析タグを返す */
async function editAndCheck(
  ctx: CaseCtx, idLabel: string, input: (tag: SalesAnalysisTagPage) => Promise<void>,
): Promise<ReturnType<typeof 売上分析タグ>> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(idLabel);
  let saved: ReturnType<typeof 売上分析タグ> = null;
  await step(1, async () => { await openEdit(tag, id); });
  await step(2, async () => { await input(tag); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { saved = 売上分析タグ(id); });
  return saved;
}

const pick = (t: ReturnType<typeof 売上分析タグ>) => t && { 名称: t.名称, 並び順: t.並び順 };

caseTest("IT-M03-17-009", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-009〕", (tag) => tag.fill(values("", "")));
  await ctx.expected(async () => {
    expect(pick(saved), "ID 009 の名称と並び順（更新されない）").toEqual(values("編集前売上分析タグ-009", "10"));
  });
});

/** 「ID … の編集画面を開く」「入力する」「登録ボタンを押す」の形（手順1〜3） */
async function editAndSubmit(ctx: CaseCtx, idLabel: string, input: (tag: SalesAnalysisTagPage) => Promise<void>): Promise<SalesAnalysisTagPage> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  await step(1, async () => { await openEdit(tag, notes.get(idLabel)); });
  await step(2, async () => { await input(tag); });
  await step(3, async () => {
    const r = await tag.pressRegister();
    noteSubmit(r);
    if (r.sent) await tag.ready();
    await noteMessages(page, "登録ボタンを押したあと");
  });
  return tag;
}

caseTest("IT-M03-17-010", async (ctx) => {
  const tag = await editAndSubmit(ctx, "〔売上分析タグID-M0317-010〕", (t) => t.fill(values("", "")));
  await ctx.expected(async () => {
    await expectNotRetained(tag, values("", ""));
    expect.soft(await formView(tag), NEW_FORM_WHAT).toEqual(NEW_FORM);
    await expectList(tag);
  });
});

const a64 = "あ".repeat(64);
const a65 = "あ".repeat(65);

caseTest("IT-M03-17-011", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-011〕", (tag) => tag.fill(values(a64, "10")));
  await ctx.expected(async () => {
    expect.soft(saved?.名称, "ID 011 の名称（「あ」64文字）").toBe(a64);
    expect.soft(saved ? [...saved.名称].length : 0, "ID 011 の名称の文字数").toBe(64);
  });
});

/** 開発者ツールで名称の欄へ「あ」65文字を設定する（設定できたことを注記に残す） */
async function setName65(tag: SalesAnalysisTagPage): Promise<void> {
  const v = await tag.setNameByDevtools(a65);
  note(`開発者ツールで設定したあとの名称の欄の文字数: ${[...v].length}`);
  if (v !== a65) throw new Error("開発者ツールで名称の欄へ「あ」65文字を設定できない");
}

caseTest("IT-M03-17-012", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get("〔売上分析タグID-M0317-012〕");
  let saved: ReturnType<typeof 売上分析タグ> = null;
  await step(1, async () => { await openEdit(tag, id); });
  await step(2, async () => { await setName65(tag); });
  await step(3, async () => {
    await tag.fill({ 並び順: "10" });
    noteSubmit(await tag.pressRegister());
    await noteMessages(page, "登録ボタンを押したあと");
  });
  await step(4, async () => { saved = 売上分析タグ(id); });
  await expected(async () => {
    expect(saved?.名称, "ID 012 の名称（更新されない）").toBe("編集前売上分析タグ-012");
  });
});

caseTest("IT-M03-17-013", async (ctx) => {
  const tag = await editAndSubmit(ctx, "〔売上分析タグID-M0317-013〕", setName65);
  await ctx.expected(async () => {
    await expectNotRetained(tag, { 名称: a65 });
    expect.soft(await formView(tag), NEW_FORM_WHAT).toEqual(NEW_FORM);
    await expectList(tag);
  });
});

caseTest("IT-M03-17-014", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-014〕", (tag) => tag.fill({ 並び順: "0" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 014 の並び順（下限値0）").toBe("0"); });
});

caseTest("IT-M03-17-015", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-015〕", (tag) => tag.fill({ 並び順: "32767" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 015 の並び順（上限値32767）").toBe("32767"); });
});

caseTest("IT-M03-17-016", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-016〕", (tag) => tag.fill({ 並び順: "-1" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 016 の並び順（10から更新されない）").toBe("10"); });
});

caseTest("IT-M03-17-017", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-017〕", (tag) => tag.fill({ 並び順: "32768" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 017 の並び順（10から更新されない）").toBe("10"); });
});

caseTest("IT-M03-17-018", async (ctx) => {
  const tag = await editAndSubmit(ctx, "〔売上分析タグID-M0317-018〕", (t) => t.fill({ 並び順: "32768" }));
  await ctx.expected(async () => {
    await expectNotRetained(tag, { 並び順: "32768" });
    expect.soft(await formView(tag), NEW_FORM_WHAT).toEqual(NEW_FORM);
    await expectList(tag);
  });
});

caseTest("IT-M03-17-019", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  const before = 名称の売上分析タグ("新規売上分析タグ");
  let after = before;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values("新規売上分析タグ", "30")); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { after = 名称の売上分析タグ("新規売上分析タグ"); });
  await expected(async () => {
    const added = after.filter((t) => !before.some((b) => b.売上分析タグID === t.売上分析タグID));
    expect(added.map((t) => ({ 名称: t.名称, 並び順: t.並び順 })), "登録で増えた名称「新規売上分析タグ」の売上分析タグ").toEqual([values("新規売上分析タグ", "30")]);
    expect(after.length, "名称「新規売上分析タグ」の売上分析タグの件数（登録の前より1件多い）").toBe(before.length + 1);
  });
});

caseTest("IT-M03-17-020", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values("新規遷移分析タグ", "31")); });
  await step(3, async () => {
    const r = await tag.pressRegister();
    noteSubmit(r);
    if (r.sent) await tag.ready();
    await noteMessages(page, "登録ボタンを押したあと");
  });
  await expected(async () => {
    expect.soft(path(page), "移った画面（保存した売上分析タグの売上分析タグ登録/編集画面）").toMatch(/\/product\/tag_sales_analysis\/\d+$/);
    expect.soft(await tag.inputValues(), "入力欄に読み込まれた値").toEqual(values("新規遷移分析タグ", "31"));
  });
});

caseTest("IT-M03-17-021", async (ctx) => {
  const saved = await editAndCheck(ctx, "〔売上分析タグID-M0317-021〕", (tag) => tag.fill(values("編集後売上分析タグ", "11")));
  await ctx.expected(async () => {
    expect(pick(saved), "ID 021 の名称と並び順").toEqual(values("編集後売上分析タグ", "11"));
  });
});

caseTest("IT-M03-17-022", async (ctx) => {
  const id = ctx.notes.get("〔売上分析タグID-M0317-022〕");
  const tag = await editAndSubmit(ctx, "〔売上分析タグID-M0317-022〕", (t) => t.fill(values("編集遷移分析タグ", "12")));
  await ctx.expected(async () => {
    expect.soft(path(ctx.page), "移った画面（保存した売上分析タグの売上分析タグ登録/編集画面）").toBe(editPath(id));
    expect.soft(await tag.inputValues(), "入力欄に読み込まれた値").toEqual(values("編集遷移分析タグ", "12"));
  });
});

caseTest("IT-M03-17-023", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const shared = notes.get("〔売上分析タグID-M0317-共有〕");
  let ids: string[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(values("重複試験タグ", "20")); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { ids = 名称と並び順の売上分析タグ("重複試験タグ", "20").map((t) => t.売上分析タグID); });
  await expected(async () => {
    expect(ids, "名称「重複試験タグ」・並び順20の売上分析タグ（既存の1件だけ）").toEqual([shared]);
  });
});

caseTest("IT-M03-17-024", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  const entered = values("重複試験タグ", "20");
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill(entered); });
  await step(3, async () => {
    const r = await tag.pressRegister();
    noteSubmit(r);
    if (r.sent) await tag.ready();
    await noteMessages(page, "登録ボタンを押したあと");
  });
  await expected(async () => {
    await expectNotRetained(tag, entered);
    expect.soft(await formView(tag), NEW_FORM_WHAT).toEqual(NEW_FORM);
    await expectList(tag);
  });
});

// ---- 削除 ----

/** 売上分析タグ登録/編集画面を開き（手順1）、一覧の行の削除ボタンを押して確認ダイアログを出す（手順2） */
async function openAndPressDelete(ctx: CaseCtx, idLabel: string): Promise<{ tag: SalesAnalysisTagPage; id: string; pending: PendingDelete }> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(idLabel);
  let pending!: PendingDelete;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    await showRow(tag, id);
    pending = await tag.startDelete(tag.rowById(id));
    note(`確認ダイアログの文: ${pending.message}`);
  });
  return { tag, id, pending };
}

/** 削除確認で削除を選ぶ（手順3）。削除の要求の応答・移った画面の応答とメッセージを注記に残す */
async function acceptDelete(ctx: CaseCtx, tag: SalesAnalysisTagPage, pending: PendingDelete): Promise<void> {
  await ctx.step(3, async () => {
    const 応答 = await pending.accept();
    note(`削除確認で削除を選んだ。${deleteResponsesNote(応答)}（移った画面 ${path(ctx.page)}）`);
    await tag.ready();
    await noteMessages(ctx.page, "削除を選んだあと");
  });
}

caseTest("IT-M03-17-025", async (ctx) => {
  const { tag, id, pending } = await openAndPressDelete(ctx, "〔売上分析タグID-M0317-025〕");
  await acceptDelete(ctx, tag, pending);
  let left: ReturnType<typeof 売上分析タグ> = null;
  await ctx.step(4, async () => { left = 売上分析タグ(id); });
  await ctx.expected(async () => {
    expect(left?.売上分析タグID, "商品に紐づく ID 025 の売上分析タグ（削除されずに残る）").toBe(id);
  });
});

caseTest("IT-M03-17-026", async (ctx) => {
  const { tag, id, pending } = await openAndPressDelete(ctx, "〔売上分析タグID-M0317-026〕");
  await acceptDelete(ctx, tag, pending);
  await ctx.expected(async () => {
    expect.soft(path(ctx.page), "削除を選んだあとに移った画面（売上分析タグ登録/編集画面）").toBe(newPath);
    await expect.soft(tag.名称, "売上分析タグ登録/編集画面の入力欄").toBeVisible();
    const ids = await wholeList(tag);
    expect.soft(ids.filter((v) => v === id), `一覧の ID ${id} の行（残る）`).toEqual([id]);
  });
});

caseTest("IT-M03-17-029", async (ctx) => {
  const { tag, id, pending } = await openAndPressDelete(ctx, "〔売上分析タグID-M0317-029〕");
  await acceptDelete(ctx, tag, pending);
  let left: ReturnType<typeof 売上分析タグ> = null;
  await ctx.step(4, async () => { left = 売上分析タグ(id); });
  await ctx.expected(async () => {
    expect(left, "ID 029 の売上分析タグ（DBから削除される）").toBeNull();
  });
});

caseTest("IT-M03-17-030", async (ctx) => {
  const { tag, id, pending } = await openAndPressDelete(ctx, "〔売上分析タグID-M0317-030〕");
  await acceptDelete(ctx, tag, pending);
  await ctx.expected(async () => {
    expect.soft(path(ctx.page), "削除を選んだあとに移った画面（売上分析タグ登録/編集画面）").toBe(newPath);
    await expect.soft(tag.名称, "売上分析タグ登録/編集画面の入力欄").toBeVisible();
    const ids = await wholeList(tag);
    expect.soft(ids.length, "一覧の全件の行").toBeGreaterThan(0);
    expect.soft(ids.filter((v) => v === id), `一覧の ID ${id} の行（消える）`).toEqual([]);
  });
});

caseTest("IT-M03-17-031", async (ctx) => {
  const { tag, id, pending } = await openAndPressDelete(ctx, "〔売上分析タグID-M0317-031〕");
  const shownAt = ctx.page.url();
  await ctx.step(3, async () => { await pending.dismiss(); note("削除確認でキャンセルを選んだ"); });
  await ctx.expected(async () => {
    expect.soft(ctx.page.url(), "キャンセルのあとの画面（削除ボタンを押した画面に留まる）").toBe(shownAt);
    await expect.soft(tag.名称, "売上分析タグ登録/編集画面の入力欄").toBeVisible();
    await expect.soft(tag.rowById(id), `一覧の ID ${id} の行（残る）`).toHaveCount(1);
  });
});

// ---- なりすまし対策トークン ----

/** 編集の入力欄で名称を変え、なりすまし対策トークンの入力要素を削除して登録ボタンを押す（手順1〜4） */
async function updateWithoutToken(ctx: CaseCtx, idLabel: string): Promise<SubmitResult> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await openEdit(tag, notes.get(idLabel)); });
  await step(2, async () => { await tag.fill({ 名称: "トークン欠落更新タグ" }); });
  await step(3, async () => { await tamperToken(tag.form, "なし"); });
  await step(4, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(page, "登録ボタンを押したあと"); });
  return r;
}

caseTest("IT-M03-17-033", async (ctx) => {
  const r = await updateWithoutToken(ctx, "〔売上分析タグID-M0317-033〕");
  await ctx.expected(async () => {
    expect(r.sent ? r.status : "（要求が送られていない）", "保存要求への応答").toBe(403);
  });
});

caseTest("IT-M03-17-034", async (ctx) => {
  await updateWithoutToken(ctx, "〔売上分析タグID-M0317-034〕");
  const id = ctx.notes.get("〔売上分析タグID-M0317-034〕");
  let name: string | undefined;
  await ctx.step(5, async () => { name = 売上分析タグ(id)?.名称; });
  await ctx.expected(async () => { expect(name, "ID 034 の名称（更新されない）").toBe("編集前売上分析タグ-034"); });
});

/**
 * 削除ボタンを押して確認ダイアログを出し（手順1〜2）、開発者ツールで削除要求のなりすまし対策トークンを「invalid-token」に変え（手順3）、
 * 削除確認で削除を選ぶ（手順4）。削除要求の応答の状態を返す。
 * 削除の要求は、確認ダイアログで承認したあとに画面のスクリプトが作るので、要求のトークンを送る直前に書き換える
 * （書き換えの仕掛けは手順2の前に置き、手順3で書き換えを有効にする。確認ダイアログが開いている間は画面の操作ができないため）。
 */
async function deleteWithInvalidToken(ctx: CaseCtx, idLabel: string): Promise<number> {
  const id = ctx.notes.get(idLabel);
  let replaceWith: string | null = null;
  let sentToken: string | null = null;
  await ctx.page.route(`**${salesAnalysisTagDeletePath(id)}`, async (route: Route) => {
    const form = new URLSearchParams(route.request().postData() ?? "");
    if (replaceWith === null) { await route.continue(); return; }
    if (!form.has("_token")) throw new Error("削除の要求に、なりすまし対策トークンが無い");
    form.set("_token", replaceWith);
    sentToken = form.get("_token");
    await route.continue({ postData: form.toString() });
  });
  const { tag, pending } = await openAndPressDelete(ctx, idLabel);
  let status = 0;
  await ctx.step(3, async () => { replaceWith = "invalid-token"; });
  await ctx.step(4, async () => {
    const 応答 = await pending.accept();
    status = 応答.要求;
    note(`削除確認で削除を選んだ。送った削除要求のなりすまし対策トークン: ${sentToken ?? "（書き換えていない）"}。${deleteResponsesNote(応答)}`);
    await noteMessages(tag.page, "削除を選んだあと");
  });
  return status;
}

caseTest("IT-M03-17-035", async (ctx) => {
  const status = await deleteWithInvalidToken(ctx, "〔売上分析タグID-M0317-035〕");
  await ctx.expected(async () => { expect(status, "削除要求への応答").toBe(403); });
});

caseTest("IT-M03-17-036", async (ctx) => {
  await deleteWithInvalidToken(ctx, "〔売上分析タグID-M0317-036〕");
  const id = ctx.notes.get("〔売上分析タグID-M0317-036〕");
  let left: ReturnType<typeof 売上分析タグ> = null;
  await ctx.step(5, async () => { left = 売上分析タグ(id); });
  await ctx.expected(async () => { expect(left?.売上分析タグID, "ID 036 の売上分析タグ（DBに残る）").toBe(id); });
});

// ---- 機能間の連携 ----

/** 一覧の表示中のページに名称の行が無ければ、件数欄で12000件を選んで探す（正本は表示件数を定めない） */
async function findByName(tag: SalesAnalysisTagPage, 名称: string): Promise<number> {
  if ((await tag.rowsByName(名称).count()) === 0 && (await tag.showAllRows())) {
    note(`一覧の表示中のページに「${名称}」の行が無いので、件数欄で12000件を選んで一覧の全件から探した`);
  }
  return tag.rowsByName(名称).count();
}

caseTest("IT-M03-17-040", async ({ page, notes, step, expected }) => {
  const name = "L001M0317n040連携分析タグ";
  const tag = new SalesAnalysisTagPage(page);
  let options: string[] = [];
  await step(1, async () => { await loginAdmin(page, M0317L_ADMIN); });
  await step(2, async () => {
    await tag.openNew();
    await tag.fill(values(name, "10"));
    const r = await tag.pressRegister();
    noteSubmit(r);
    if (r.sent) await tag.ready();
    await expect(page.locator(".alert-success"), "画面上部の完了の表示").toContainText("登録が完了しました。");
    expect(await findByName(tag, name), `一覧の「${name}」の行`).toBe(1);
  });
  await step(3, async () => { await openProductEdit(page, notes.get("〔商品ID-M0317-040〕")); });
  await step(4, async () => { options = await salesAnalysisTagOptions(page); });
  await expected(async () => {
    expect(options, "売上分析タグ欄の選択肢").toContain(name);
  });
});

caseTest("IT-M03-17-041", async ({ page, notes, step, expected }) => {
  const name = "L004M0317n041削除分析タグ";
  const productId = notes.get("〔商品ID-M0317-041〕");
  const tag = new SalesAnalysisTagPage(page);
  let pending!: PendingDelete;
  let options: string[] = [];
  await step(1, async () => { await loginAdmin(page, M0317L_ADMIN); });
  await step(2, async () => {
    await openProductEdit(page, productId);
    expect(await salesAnalysisTagOptions(page), "削除前の売上分析タグ欄の選択肢").toContain(name);
  });
  await step(3, async () => {
    await tag.openNew();
    expect(await findByName(tag, name), `一覧の「${name}」の行`).toBe(1);
    pending = await tag.startDelete(tag.rowsByName(name));
  });
  await step(4, async () => {
    const want = `この操作はあとから取り消すことができません。「${name}」を削除してよろしいですか？`;
    note(`確認ダイアログの文: ${pending.message}（正本の文と${pending.message === want ? "同じ" : "違う"}）`);
    await pending.accept();
    await tag.ready();
  });
  await step(5, async () => {
    await expect(page.locator(".alert-success"), "画面上部の削除の表示").toContainText("削除しました");
  });
  await step(6, async () => {
    await openProductEdit(page, productId);
    options = await salesAnalysisTagOptions(page);
  });
  await expected(async () => {
    expect(options, "売上分析タグ欄の選択肢").not.toContain(name);
  });
});
