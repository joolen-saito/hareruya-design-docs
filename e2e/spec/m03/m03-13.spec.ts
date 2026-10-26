/** M03-13 タグ登録/編集。正本: cases/M03-13_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { 保存されたタグ, 優先表示の行, 優先表示順, 名称のタグ, タグ } from "../../db/m03_13_tag";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { Account, loginAdmin } from "../../lib/session";
import { tamperToken } from "../../pages/admin/devtools";
import { pressTagChooser, tagCandidateButton, tagCandidates } from "../../pages/admin/m03_13_product";
import {
  SubmitResult, TagInput, TagPage, tagEditPath, tagNewPath, tagRegisterRequestPath, その他の設定の項目, 項目の表示名,
} from "../../pages/admin/m03_13_tag";
import { openProductEdit } from "../../pages/admin/product_edit";
import { M0313_ADMIN, M0313L_ADMIN } from "../../seeds/m03-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 正本の事前準備①「新しいブラウザセッションで、試験管理者で管理画面にログインしている」 */
async function signIn(page: Page, account: Account = M0313_ADMIN): Promise<TagPage> {
  await loginAdmin(page, account);
  return new TagPage(page);
}

/** 登録ボタンの結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`登録ボタンを押したあとの応答: ${r.status}`);
  else note(`登録ボタンを押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残す */
async function noteMessages(tag: TagPage, when: string): Promise<void> {
  const texts = await tag.messages();
  note(`${when}の画面上部のメッセージ: ${texts.length ? texts.join(" / ") : "なし"}`);
}

const label = (n: string) => `〔タグID-M0313-${n}〕`;
const path = (page: Page) => new URL(page.url()).pathname;
/** タグ本体の、名称(日)・名称(英)・並び順 */
const basics = (t: 保存されたタグ | null) => t && { 名称日: t.名称日, 名称英: t.名称英, 並び順: t.並び順 };
const 編集前 = { 名称日: "編集前タグ", 名称英: "BeforeTag", 並び順: "10" };
/** 「その他の設定」の各項目を空にする入力 */
const その他を空に: TagInput = Object.fromEntries(その他の設定の項目.map((k) => [k, ""]));

// ---- 表示 ----

caseTest("IT-M03-13-001", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.openOtherSettings(); });
  await expected(async () => {
    await expect.soft(tag.優先表示商品のみを表示.filter({ visible: true }), "「優先表示商品のみを表示」の入力欄").toHaveCount(0);
    await expect.soft(tag.優先表示商品のみを表示の項目名.filter({ visible: true }), "「優先表示商品のみを表示」の項目名").toHaveCount(0);
  });
});

caseTest("IT-M03-13-003", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.openOtherSettings(); });
  await expected(async () => {
    for (const k of その他の設定の項目) {
      await expect.soft(tag.欄[k], `${項目の表示名[k]}の入力欄`).toBeVisible();
      expect.soft(await tag.labelOf(k), `${項目の表示名[k]}の入力欄の項目名`).toBe(項目の表示名[k]);
    }
  });
});

caseTest("IT-M03-13-004", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  await step(1, async () => { await tag.openNew(); });
  await expected(async () => {
    expect.soft(path(page), "開いた画面のアドレス（編集対象のIDの指定なし）").toBe(tagNewPath());
    await expect.soft(tag.入力欄の見出し, "入力欄の見出し（新規登録）").toHaveText(/^\s*新規追加\s*$/);
    expect.soft(await tag.editingId(), "入力欄が編集しているタグID（新規登録では無い）").toBe("");
    for (const k of ["名称日", "名称英", "並び順"] as const) await expect.soft(tag.欄[k], `${項目の表示名[k]}の入力欄`).toBeVisible();
    const empty = Object.fromEntries(Object.keys(tag.欄).map((k) => [k, ""]));
    expect.soft(await tag.inputValues(), "名称(日)・名称(英)・並び順と「その他の設定」内の入力欄の値").toEqual(empty);
  });
});

// ---- 更新（編集画面で入力して登録し、DBでそのタグを確かめる） ----

/** ID の編集画面を開き（手順1）、入力して（手順2）、登録ボタンを押し（手順3）、DBでそのタグを読む（手順4） */
async function editAndCheck(ctx: CaseCtx, n: string, input: (tag: TagPage) => Promise<void>): Promise<保存されたタグ | null> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(label(n));
  let saved: 保存されたタグ | null = null;
  await step(1, async () => { await tag.openEdit(id); });
  await step(2, async () => { await input(tag); });
  await step(3, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(4, async () => { saved = タグ(id); });
  return saved;
}

caseTest("IT-M03-13-007", async (ctx) => {
  const saved = await editAndCheck(ctx, "007", (tag) => tag.fill({ 名称日: "", 名称英: "", 並び順: "" }));
  await ctx.expected(async () => {
    expect(basics(saved), "ID 007 の名称(日)・名称(英)・並び順（更新されない）").toEqual(編集前);
  });
});

caseTest("IT-M03-13-008", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("008"));
  let r!: SubmitResult;
  await step(1, async () => { await tag.openEdit(id); });
  await step(2, async () => { await tag.fill({ 名称日: "", 名称英: "", 並び順: "" }); });
  await step(3, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(tag, "登録ボタンを押したあと"); });
  await expected(async () => {
    // 期待結果は、登録の処理が入力の不備で同じ画面を返したあとの画面（出典: 登録できなかった旨の表示の後続処理）。
    // ブラウザの入力チェックで要求が送られないと、登録の処理を通らず、手順1で開いた画面をそのまま見ることになるので、合格にしない
    expect(r.sent, "登録の要求が送られた（ブラウザの入力チェックで止まると、登録の処理を通らず手順の結果を確かめられない）").toBe(true);
    const where = path(page);
    // 入力の不備で同じ画面を返すときは、登録の要求のアドレスのまま同じ画面が表示される（設計書 保存の処理順序 順序1）
    expect.soft([tagEditPath(id), tagRegisterRequestPath(id)], `登録ボタンを押したあとの画面のアドレス（${where}）`).toContain(where);
    await expect.soft(tag.入力欄の見出し, "入力欄の見出し（編集）").toHaveText(/^\s*編集\s*$/);
    expect.soft(await tag.editingId(), "入力欄が編集しているタグID").toBe(id);
    expect.soft((await tag.allRows()).length, "タグの一覧の行").toBeGreaterThan(0);
  });
});

caseTest("IT-M03-13-009", async (ctx) => {
  const saved = await editAndCheck(ctx, "009", (tag) => tag.fill({ 名称日: "あ".repeat(255), 名称英: "A".repeat(255), 並び順: "10" }));
  await ctx.expected(async () => {
    expect.soft(saved?.名称日, "ID 009 の名称(日)（「あ」255文字）").toBe("あ".repeat(255));
    expect.soft(saved?.名称英, "ID 009 の名称(英)（「A」255文字）").toBe("A".repeat(255));
  });
});

caseTest("IT-M03-13-010", async (ctx) => {
  const saved = await editAndCheck(ctx, "010", (tag) => tag.fill({ 名称日: "あ".repeat(256), 名称英: "A".repeat(256), 並び順: "10" }));
  await ctx.expected(async () => {
    expect.soft(saved?.名称日, "ID 010 の名称(日)（更新されない）").toBe("編集前タグ");
    expect.soft(saved?.名称英, "ID 010 の名称(英)（更新されない）").toBe("BeforeTag");
  });
});

caseTest("IT-M03-13-011", async (ctx) => {
  const saved = await editAndCheck(ctx, "011", (tag) => tag.fill({ 名称日: "タグTag1", 名称英: "Tag-1", 並び順: "10" }));
  await ctx.expected(async () => {
    expect.soft(saved?.名称日, "ID 011 の名称(日)（全角・半角を含む）").toBe("タグTag1");
    expect.soft(saved?.名称英, "ID 011 の名称(英)（半角）").toBe("Tag-1");
  });
});

caseTest("IT-M03-13-012", async (ctx) => {
  const saved = await editAndCheck(ctx, "012", (tag) => tag.fill({ 名称日: "文字種タグ", 名称英: "ＴＡＧ", 並び順: "10" }));
  await ctx.expected(async () => {
    expect(saved?.名称英, "ID 012 の名称(英)（全角文字では更新されない）").toBe("BeforeTag");
  });
});

caseTest("IT-M03-13-013", async (ctx) => {
  const saved = await editAndCheck(ctx, "013", (tag) => tag.fill({ 並び順: "0" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 013 の並び順（下限値0）").toBe("0"); });
});

caseTest("IT-M03-13-014", async (ctx) => {
  const saved = await editAndCheck(ctx, "014", (tag) => tag.fill({ 並び順: "32767" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 014 の並び順（上限値32767）").toBe("32767"); });
});

caseTest("IT-M03-13-015", async (ctx) => {
  const saved = await editAndCheck(ctx, "015", (tag) => tag.fill({ 並び順: "-1" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 015 の並び順（10から更新されない）").toBe("10"); });
});

caseTest("IT-M03-13-016", async (ctx) => {
  const saved = await editAndCheck(ctx, "016", (tag) => tag.fill({ 並び順: "32768" }));
  await ctx.expected(async () => { expect(saved?.並び順, "ID 016 の並び順（10から更新されない）").toBe("10"); });
});

caseTest("IT-M03-13-017", async (ctx) => {
  const saved = await editAndCheck(ctx, "017", async (tag) => {
    const typed = await tag.並び順に文字を書く("abc");
    note(`並び順は数値の欄で、画面のとおりに「abc」を打つと欄の値は「${typed}」になった。M13-02 の024と同じく、開発者ツールで行うのと同じに欄を文字の欄に変えて「abc」を書いた`);
  });
  await ctx.expected(async () => { expect(saved?.並び順, "ID 017 の並び順（10から更新されない）").toBe("10"); });
});

// ---- 新規登録 ----

caseTest("IT-M03-13-018", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  let saved: 保存されたタグ[] = [];
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill({ 名称日: "任意空タグ", 名称英: "OptionalEmptyTag", 並び順: "30" }); });
  await step(3, async () => {
    note("「その他の設定」の項目は閉じた見出しの中にあるので、見出しを押して開いてから各項目を空にした");
    await tag.openOtherSettings();
    await tag.fill(その他を空に);
  });
  await step(4, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(5, async () => { saved = 名称のタグ("任意空タグ"); });
  await expected(async () => {
    expect(saved.map(basics), "名称(日)「任意空タグ」のタグ（登録前は0件）").toEqual([{ 名称日: "任意空タグ", 名称英: "OptionalEmptyTag", 並び順: "30" }]);
    for (const k of その他の設定の項目) expect.soft(saved[0]?.[k] ?? "", `${項目の表示名[k]}（入力していない任意項目）`).toBe("");
  });
});

caseTest("IT-M03-13-019", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  let saved: 保存されたタグ[] = [];
  let rows: 優先表示の行[] | null = null;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill({ 名称日: "優先空タグ", 名称英: "NoPriorityTag", 並び順: "31" }); });
  await step(3, async () => {
    note("優先表示商品は閉じた「その他の設定」の中にあるので、見出しを押して開いてから空にした");
    await tag.openOtherSettings();
    await tag.fill({ 優先表示商品: "" });
  });
  await step(4, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(5, async () => {
    saved = 名称のタグ("優先空タグ");
    if (saved.length === 1) rows = 優先表示順(saved[0].タグID);
  });
  await expected(async () => {
    expect(saved.length, "名称(日)「優先空タグ」の登録されたタグ（登録前は0件）").toBe(1);
    expect(rows, `登録された「優先空タグ」（タグID ${saved[0]?.タグID}）の優先表示順`).toEqual([]);
  });
});

caseTest("IT-M03-13-029", async ({ page, step, expected }) => {
  const tag = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => { await tag.fill({ 名称日: "遷移確認タグ", 名称英: "TransitionTag", 並び順: "30" }); });
  await step(3, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(tag, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect(r.sent, "登録の要求が送られ、画面が移った").toBe(true);
    const m = path(page).match(/\/product\/tag\/(\d+)$/);
    expect(m, `移った画面のアドレス（${path(page)}）がタグの編集画面`).not.toBeNull();
    const id = m![1];
    await expect.soft(tag.入力欄の見出し, "入力欄の見出し（編集）").toHaveText(/^\s*編集\s*$/);
    expect.soft(await tag.editingId(), "入力欄が編集しているタグID（アドレスのタグID）").toBe(id);
    const v = await tag.inputValues();
    // 登録前は名称(日)「遷移確認タグ」・名称(英)「TransitionTag」のタグが0件（シード）なので、この値のタグは新しく保存されたもの
    expect.soft({ 名称日: v.名称日, 名称英: v.名称英, 並び順: v.並び順 }, `タグID ${id} の編集画面に読み込まれた値`)
      .toEqual({ 名称日: "遷移確認タグ", 名称英: "TransitionTag", 並び順: "30" });
  });
});

// ---- なりすまし対策トークン ----

/** 編集画面で名称(日)を変え、なりすまし対策トークンを消すか変えて登録し（手順1〜4）、DBでそのタグを読む（手順5） */
async function tokenCase(ctx: CaseCtx, n: string, 名称日: string, token: "なし" | string): Promise<保存されたタグ | null> {
  const { page, notes, step } = ctx;
  const tag = await signIn(page);
  const id = notes.get(label(n));
  let saved: 保存されたタグ | null = null;
  await step(1, async () => { await tag.openEdit(id); });
  await step(2, async () => { await tag.fill({ 名称日 }); });
  await step(3, async () => { await tamperToken(tag.form, token); });
  await step(4, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(5, async () => { saved = タグ(id); });
  return saved;
}

caseTest("IT-M03-13-037", async (ctx) => {
  const saved = await tokenCase(ctx, "037", "トークン欠落更新", "なし");
  await ctx.expected(async () => { expect(saved?.名称日, "ID 037 の名称(日)（更新されない）").toBe("編集前タグ"); });
});

caseTest("IT-M03-13-038", async (ctx) => {
  const saved = await tokenCase(ctx, "038", "トークン改ざん更新", "invalid-token");
  await ctx.expected(async () => { expect(saved?.名称日, "ID 038 の名称(日)（更新されない）").toBe("編集前タグ"); });
});

// ---- 優先表示商品 ----

caseTest("IT-M03-13-052", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("052"));
  let saved: 保存されたタグ | null = null;
  let rows: 優先表示の行[] = [];
  await step(1, async () => { await tag.openEdit(id); });
  await step(2, async () => { await tag.fill({ 名称日: "優先表示解除後タグ-M0313-052" }); });
  await step(3, async () => {
    await tag.openOtherSettings();
    note(`優先表示商品の入力欄の、空にする前の値: 「${await tag.欄.優先表示商品.inputValue()}」`);
    await tag.fill({ 優先表示商品: "" });
  });
  await step(4, async () => { noteSubmit(await tag.pressRegister()); await noteMessages(tag, "登録ボタンを押したあと"); });
  await step(5, async () => { saved = タグ(id); rows = 優先表示順(id); });
  await expected(async () => {
    expect.soft(saved?.名称日, "ID 052 の名称(日)").toBe("優先表示解除後タグ-M0313-052");
    expect.soft(rows, "ID 052 の優先表示順").toEqual([]);
  });
});

// ---- 保存後の遷移 ----

caseTest("IT-M03-13-054", async ({ page, notes, step, expected }) => {
  const tag = await signIn(page);
  const id = notes.get(label("054"));
  let r!: SubmitResult;
  await step(1, async () => { await tag.openEdit(id); });
  await step(2, async () => { await tag.fill({ 名称日: "更新後遷移後タグ-M0313-054" }); });
  await step(3, async () => { r = await tag.pressRegister(); noteSubmit(r); await noteMessages(tag, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect(r.sent, "登録の要求が送られ、画面が移った").toBe(true);
    expect.soft(path(page), "移った画面のアドレス").toBe(tagEditPath(id));
    await expect.soft(tag.入力欄の見出し, "入力欄の見出し（編集）").toHaveText(/^\s*編集\s*$/);
    expect.soft(await tag.editingId(), "入力欄が編集しているタグID").toBe(id);
  });
});

// ---- 機能間の連携 ----

caseTest("IT-M03-13-044", async ({ page, notes, step, expected }) => {
  const name = "LinkTagL001";
  const tag = await signIn(page, M0313L_ADMIN);
  await step(1, async () => { await tag.openNew(); });
  await step(2, async () => {
    await tag.fill({ 名称日: name, 名称英: name, 並び順: "40" });
    note("「その他の設定」と優先表示商品は触らず、空のままにした");
  });
  await step(3, async () => {
    const r = await tag.pressRegister();
    noteSubmit(r);
    if (!r.sent) throw new Error("登録ボタンを押したが、ブラウザの入力チェックで送信が止まった");
    await expect(tag.成功の表示, "画面上部の完了の表示").toContainText("登録が完了しました。");
  });
  await step(4, async () => { await openProductEdit(page, notes.get("〔商品ID-M0313-連携共有〕")); });
  await step(5, async () => {
    const shown = await pressTagChooser(page);
    if (shown !== "タグを選択") {
      note(`タグ欄の、登録済みのタグの一覧を開く操作の表示は「${shown}」（正本と設計書 0204 商品登録編集 識別ID 29 は「タグを選択」）。同じ位置づけの操作として押した（名称の違い）`);
    }
  });
  await expected(async () => {
    expect(await tagCandidates(page), "タグ欄の登録済みのタグの一覧").toContain(name);
    await expect.soft(tagCandidateButton(page, name), `一覧の「${name}」が選べる`).toBeEnabled();
  });
});
