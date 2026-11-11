/**
 * M03-13 タグ登録/編集の続き（-x）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。正本: cases/M03-13_test_cases.tsv
 * シードは seeds/m03-13-x.ts（タグ一覧は退避しない読み替え・商品コードは実行の印つき）。記録: review/M03-13_progress_2026-11-11_dev.md
 */
import { Page, test } from "@playwright/test";
import { 優先表示の行, 優先表示順, 名称のタグ, タグ } from "../../db/m03_13_tag";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { SubmitResult, TagPage, tagEditPath, tagRegisterRequestPath } from "../../pages/admin/m03_13_tag";
import { M0313_ADMIN } from "../../seeds/m03-13";
import { ALL, 共有, 共有の規格コード, 未登録の規格コード, 旧の規格コード, 新規優先タグ } from "../../seeds/m03-13-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const label = (n: string) => `〔タグID-M0313-${n}〕`;
const path = (page: Page) => new URL(page.url()).pathname;
const 共 = (k: 共有) => 共有の規格コード[k];
const 行 = (規格コード: string, 順位: number): 優先表示の行 => ({ 規格コード, 順位: String(順位) });

async function signIn(page: Page): Promise<TagPage> {
  await loginAdmin(page, M0313_ADMIN);
  return new TagPage(page);
}

function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`登録ボタンを押したあとの応答: ${r.status}`);
  else note(`登録ボタンを押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}
async function noteMessages(tag: TagPage, when: string): Promise<void> {
  const texts = await tag.messages();
  note(`${when}の画面上部のメッセージ: ${texts.length ? texts.join(" / ") : "なし"}`);
}

/** タグ登録/編集画面を開く（一覧の全件を1ページに出す。開発環境のタグはほかの方のものも多く、既定の件数では行が次のページに出るため） */
async function openWithAll(tag: TagPage): Promise<void> {
  await tag.openNew();
  await tag.showFirstPageWith(ALL);
  note(`一覧の表示件数を${ALL}件にして開いた（ほかの方のタグも一覧に残っているため。正本の外の補い）`);
}

// ---- 表示（タグ一覧は記載のタグだけにしていない） ----

caseTest("IT-M03-13-002", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await openWithAll(tag); });
  let 削除の操作 = -1;
  await step(2, async () => {
    // 一覧と編集欄の操作部（主の領域の中のリンク・ボタン）に「削除」を含むものがあるか
    const main = page.locator(".c-contentsArea");
    await expect(main, "管理画面の主の領域").toBeVisible();
    削除の操作 = await main.locator("a, button, input[type=submit], input[type=button]").filter({ hasText: /削除/ }).filter({ visible: true }).count()
      + await main.locator('input[type=submit][value*="削除"], input[type=button][value*="削除"]').filter({ visible: true }).count();
    note(`主の領域の「削除」を含むリンク・ボタン: ${削除の操作}件`);
  });
  await expected(async () => {
    expect(削除の操作, "タグの削除ボタン（一覧と編集欄の操作部）").toBe(0);
  });
});

caseTest("IT-M03-13-005", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("005"));
  await step(1, async () => { await openWithAll(tag); });
  await step(2, async () => { await tag.pressEdit(id); });
  await expected(async () => {
    const v = await tag.inputValues();
    expect.soft(v.名称日, "名称(日)").toBe("編集前タグ");
    expect.soft(v.名称英, "名称(英)").toBe("BeforeTag");
    expect.soft(v.並び順, "並び順").toBe("10");
  });
});

caseTest("IT-M03-13-006", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("006"));
  let status = 0;
  let 開いたID = "";
  await step(1, async () => { await openWithAll(tag); });
  await step(2, async () => { await tag.pressEdit(id); });
  await step(3, async () => {
    const u = new URL(page.url());
    if (!u.pathname.endsWith(`/product/tag/${id}`)) throw new Error(`編集画面のアドレス（${page.url()}）の末尾にタグID ${id} が無い`);
    u.pathname = u.pathname.replace(new RegExp(`/${id}$`), "/999999");
    const res = await page.goto(u.toString());
    status = res?.status() ?? 0;
    await page.waitForLoadState("load");
    開いたID = await tag.editingId().catch(() => "");
    note(`タグID を 999999 へ置き換えて開いた: 応答 ${status}・画面のアドレス ${page.url()}・入力欄が編集しているタグID「${開いたID}」`);
  });
  await expected(async () => {
    expect(status === 200 && 開いたID === "999999", "タグID 999999 の編集画面が表示された").toBe(false);
  });
});

caseTest("IT-M03-13-034", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("034"));
  await step(1, async () => { await openWithAll(tag); });
  let rows: Awaited<ReturnType<TagPage["allRows"]>> = [];
  await step(2, async () => { rows = (await tag.allRows()).filter((r) => r.ID === id); });
  await expected(async () => {
    expect(rows, `一覧の ID ${id} の行`).toEqual([{ ID: id, 名称日: "編集前タグ", 名称英: "BeforeTag", 並び順: "10" }]);
  });
});

/** 一覧の編集ボタンで開き、「その他の設定」を押してフリーエリアを入れて登録し、DB でそのタグを読む（045・046） */
function freeArea(n: string, 項目: "フリーエリア日" | "フリーエリア英", 値: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const tag = await signIn(page);
    const id = notes.get(label(n));
    let saved: ReturnType<typeof タグ> = null;
    await step(1, async () => { await openWithAll(tag); });
    await step(2, async () => { await tag.pressEdit(id); });
    await step(3, async () => { await tag.openOtherSettings(); });
    await step(4, async () => { await tag.fill(項目 === "フリーエリア日" ? { フリーエリア日: 値 } : { フリーエリア英: 値 }); });
    await step(5, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
    await step(6, async () => { saved = タグ(id); });
    await expected(async () => {
      expect((saved as ReturnType<typeof タグ>)?.[項目] ?? null, `ID ${id} の${項目 === "フリーエリア日" ? "フリーエリア(日)" : "フリーエリア(英)"}`).toBe(値);
    });
  };
}
caseTest("IT-M03-13-045", freeArea("045", "フリーエリア日", "<p><b>M0313-045-A</b></p>"));
caseTest("IT-M03-13-046", freeArea("046", "フリーエリア英", "<p><b>M0313-046-A</b></p>"));

caseTest("IT-M03-13-047", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const ids = { A: notes.get(label("047A")), B: notes.get(label("047B")), C: notes.get(label("047C")) };
  await step(1, async () => { await openWithAll(tag); });
  let order: string[] = [];
  await step(2, async () => {
    order = (await tag.allRows()).map((r) => r.ID).filter((x) => Object.values(ids).includes(x));
    note(`一覧の中の3件の上からの並び: ${order.join("、")}（ほかの方のタグは除いた）`);
  });
  await expected(async () => {
    expect(order, "一覧の3件の上からの並び（B・C・A）").toEqual([ids.B, ids.C, ids.A]);
  });
});

// ---- 優先表示（編集画面で入力して登録し、DB でタグと優先表示順を確かめる） ----

type 入力 = { 名称日?: string; 優先表示商品?: string[] };
/** ID の編集画面を開き、名称(日)・優先表示商品を入れ（優先表示商品は「その他の設定」を開いてから）、登録ボタンを押す。手順の番号は正本に合わせて渡す */
async function editPriority(ctx: CaseCtx, n: string, v: 入力, 手順: { 名称?: number; 優先: number; 登録: number }): Promise<{ id: string; r: SubmitResult }> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(label(n));
  let r!: SubmitResult;
  await step(1, async () => { await tag.openEdit(id); });
  if (手順.名称 !== undefined) await step(手順.名称, async () => { await tag.fill({ 名称日: v.名称日 ?? "" }); });
  await step(手順.優先, async () => {
    await tag.openOtherSettings();
    await tag.fill({ 優先表示商品: (v.優先表示商品 ?? []).join("\n") });
  });
  await step(手順.登録, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(tag, "登録ボタンを押したあと"); });
  return { id, r };
}

caseTest("IT-M03-13-020", async (ctx) => {
  const { id } = await editPriority(ctx, "020", { 名称日: "優先表示更新タグ", 優先表示商品: [共("A"), 共("B"), 共("C")] }, { 名称: 2, 優先: 3, 登録: 4 });
  let t: ReturnType<typeof タグ> = null; let rows: 優先表示の行[] = [];
  await ctx.step(5, async () => { t = タグ(id); rows = 優先表示順(id); });
  await ctx.expected(async () => {
    expect.soft((t as ReturnType<typeof タグ>)?.名称日, `ID ${id} の名称(日)`).toBe("優先表示更新タグ");
    expect.soft(rows, `ID ${id} の優先表示順`).toEqual([行(共("A"), 3), 行(共("B"), 2), 行(共("C"), 1)]);
  });
});

caseTest("IT-M03-13-021", async (ctx) => {
  const { id } = await editPriority(ctx, "021", { 優先表示商品: [共("A"), "", 共("A"), 共("B")] }, { 優先: 2, 登録: 3 });
  let rows: 優先表示の行[] = [];
  await ctx.step(4, async () => { rows = 優先表示順(id); });
  await ctx.expected(async () => {
    expect(rows, `ID ${id} の優先表示順`).toEqual([行(共("A"), 2), 行(共("B"), -1)]);
  });
});

caseTest("IT-M03-13-022", async (ctx) => {
  const { id, r } = await editPriority(ctx, "022", { 名称日: "", 優先表示商品: [共("A"), 共("B")] }, { 名称: 2, 優先: 3, 登録: 4 });
  let rows: 優先表示の行[] = [];
  await ctx.step(5, async () => { rows = 優先表示順(id); });
  await ctx.expected(async () => {
    if (!r.sent) note("名称(日)が空のため、ブラウザの入力チェックで送信が止まった（入力値の検証で処理が中止された）");
    expect(rows, `ID ${id} の優先表示順（保存前のまま）`).toEqual([行(旧の規格コード("022"), 1)]);
  });
});

/** 名称(日)を変え、優先表示商品に解決できない規格コードを入れて登録し、名称(日)が更新されないことを DB で確かめる（023・026・027） */
function nameNotUpdated(n: string, 新しい名称: string, 規格コード: string, 元の名称: string) {
  return async (ctx: CaseCtx) => {
    const { id } = await editPriority(ctx, n, { 名称日: 新しい名称, 優先表示商品: [規格コード] }, { 名称: 2, 優先: 3, 登録: 4 });
    let t: ReturnType<typeof タグ> = null;
    await ctx.step(5, async () => { t = タグ(id); });
    await ctx.expected(async () => {
      expect((t as ReturnType<typeof タグ>)?.名称日, `ID ${id} の名称(日)（更新されない）`).toBe(元の名称);
    });
  };
}
caseTest("IT-M03-13-023", nameNotUpdated("023", "解決不能更新タグ", 未登録の規格コード, "優先表示試験タグ-023"));
caseTest("IT-M03-13-026", nameNotUpdated("026", "未紐付更新タグ", 共("D"), "優先表示試験タグ-026"));
caseTest("IT-M03-13-027", nameNotUpdated("027", "削除規格更新タグ", 共("E"), "優先表示試験タグ-027"));

caseTest("IT-M03-13-024", async (ctx) => {
  const { id } = await editPriority(ctx, "024", { 優先表示商品: [未登録の規格コード] }, { 優先: 2, 登録: 3 });
  let rows: 優先表示の行[] = [];
  await ctx.step(4, async () => { rows = 優先表示順(id); });
  await ctx.expected(async () => {
    expect(rows, `ID ${id} の優先表示順（0件）`).toEqual([]);
  });
});

caseTest("IT-M03-13-025", async (ctx) => {
  const { page } = ctx;
  const { id, r } = await editPriority(ctx, "025", { 優先表示商品: [未登録の規格コード] }, { 優先: 2, 登録: 3 });
  await ctx.expected(async () => {
    const tag = new TagPage(page);
    expect(r.sent, "登録の要求が送られた").toBe(true);
    const where = path(page);
    expect.soft([tagEditPath(id), tagRegisterRequestPath(id)], `登録ボタンを押したあとの画面のアドレス（${where}）`).toContain(where);
    expect.soft(await tag.editingId(), "入力欄が編集しているタグID").toBe(id);
    expect.soft((await tag.allRows()).length, "タグの一覧の行").toBeGreaterThan(0);
  });
});

caseTest("IT-M03-13-028", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  let r!: SubmitResult;
  let hit: ReturnType<typeof 名称のタグ> = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill({ 名称日: 新規優先タグ.名称日, 名称英: 新規優先タグ.名称英, 並び順: "40" }); });
  await step(3, async () => { await tag.openOtherSettings(); await tag.fill({ 優先表示商品: 共("A") }); });
  await step(4, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(5, async () => { hit = 名称のタグ(新規優先タグ.名称日); });
  await expected(async () => {
    expect(hit.map((t) => t.タグID), `名称(日)「${新規優先タグ.名称日}」のタグ（追加されない）`).toEqual([]);
  });
});

caseTest("IT-M03-13-042", async (ctx) => {
  const { id } = await editPriority(ctx, "042", { 優先表示商品: [共("C"), 共("A")] }, { 優先: 2, 登録: 3 });
  let rows: 優先表示の行[] = [];
  await ctx.step(4, async () => { rows = 優先表示順(id); });
  await ctx.expected(async () => {
    expect(rows, `ID ${id} の優先表示順（作り直される）`).toEqual([行(共("C"), 2), 行(共("A"), 1)]);
  });
});

caseTest("IT-M03-13-051", async (ctx) => {
  const { id } = await editPriority(ctx, "051", { 優先表示商品: [共("A")] }, { 優先: 2, 登録: 3 });
  let rows: 優先表示の行[] = [];
  await ctx.step(4, async () => { rows = 優先表示順(id); });
  await ctx.expected(async () => {
    expect(rows, `ID ${id} の優先表示順`).toEqual([行(共("A"), 1)]);
  });
});

caseTest("IT-M03-13-053", async (ctx) => {
  const { id } = await editPriority(ctx, "053", { 名称日: "混在コード更新後タグ-M0313-053", 優先表示商品: [共("A"), 未登録の規格コード] }, { 名称: 2, 優先: 3, 登録: 4 });
  let t: ReturnType<typeof タグ> = null; let rows: 優先表示の行[] = [];
  await ctx.step(5, async () => { t = タグ(id); rows = 優先表示順(id); });
  await ctx.expected(async () => {
    expect.soft((t as ReturnType<typeof タグ>)?.名称日, `ID ${id} の名称(日)（更新されない）`).toBe("混在コード更新前タグ-M0313-053");
    expect.soft(rows, `ID ${id} の優先表示順（0件）`).toEqual([]);
  });
});

caseTest("IT-M03-13-055", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("055"));
  let lines: string[] = [];
  let rows: 優先表示の行[] = [];
  await step(1, async () => { await tag.openEdit(id); });
  await step(2, async () => {
    await tag.openOtherSettings();
    lines = (await tag.inputValues()).優先表示商品.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    expect(lines, "優先表示商品の欄の行（TAG-A-001・TAG-A-002 の2行のまま）").toEqual([共("A"), 共("B")]);
  });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(4, async () => { rows = 優先表示順(id); });
  await expected(async () => {
    expect(rows, `ID ${id} の優先表示順（行が増えない）`).toEqual([行(共("A"), 2), 行(共("B"), 1)]);
  });
});

