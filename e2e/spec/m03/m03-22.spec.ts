/** M03-22 購入グループ管理。正本: cases/M03-22_test_cases.tsv */
import { BrowserContext, expect, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 購入グループ, 保存された購入グループ } from "../../db/m03_22_purchase_group";
import { CaseCtx, caseTest } from "../../lib/case";
import { Account, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { tamperToken } from "../../pages/admin/devtools";
import { openProductEdit } from "../../pages/admin/product_edit";
import { purchaseGroupChoices } from "../../pages/admin/m03_22_product";
import {
  DeleteResult, PendingDelete, PurchaseGroupPage, SubmitResult, pathOf, purchaseGroupIndexPath, topMessages,
} from "../../pages/admin/m03_22_purchase_group";
import { M0322_ADMIN, M0322L_ADMIN } from "../../seeds/m03-22";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 正本の事前準備①「新しいブラウザセッションで、M03-22試験管理者として商品管理へログインしている」 */
async function signIn(page: Page, account: Account = M0322_ADMIN): Promise<PurchaseGroupPage> {
  await loginAdmin(page, account);
  return new PurchaseGroupPage(page);
}

/** 正本の事前準備①の「ブラウザB」。ブラウザA（ケースのページ）とは別のセッションで、同じ試験管理者としてログインする */
async function openBrowserB(ctx: CaseCtx): Promise<{ contextB: BrowserContext; grpB: PurchaseGroupPage }> {
  const contextB = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(contextB);
  const grpB = await signIn(await contextB.newPage());
  return { contextB, grpB };
}

/** 登録ボタンの結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult, who = ""): void {
  if (r.sent) note(`${who}登録ボタンを押したあとの応答: 登録の要求 ${r.status}・移った画面 ${r.移った画面 ?? "不明"}`);
  else note(`${who}登録ボタンを押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

function noteDelete(r: DeleteResult, who = ""): void {
  note(`${who}削除確認モーダルの削除ボタンを押したあとの応答: 削除の要求 ${r.要求}・移った画面 ${r.移った画面 ?? "不明"}`);
}

/** 画面上部に出たメッセージと、いまの画面のアドレスを注記に残す */
async function noteMessages(page: Page, when: string): Promise<void> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  note(`${when}の画面（${pathOf(page.url())}）の上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}`);
}

/**
 * 期待結果「購入グループ管理画面が表示されること」のうち、画面の見出しが「購入グループ管理」であり、
 * 購入グループの一覧がある（設計書の画面は入力欄と一覧が同じ画面にある）こと。表示された画面の応答が200であることは呼ぶ側で確かめる。
 */
async function expectPurchaseGroupScreen(page: Page, who: string): Promise<void> {
  const grp = new PurchaseGroupPage(page);
  await expect.soft(grp.見出し, `${who}に表示された画面の見出し`).toHaveText(/^\s*購入グループ管理\s*$/);
  await expect.soft(grp.一覧, `${who}に表示された画面の購入グループの一覧`).toBeVisible();
}

/**
 * ブラウザBで購入グループ管理画面を開き、行の削除ボタンと削除確認モーダルの削除ボタンで削除する（020・021・029 の手順2）。
 * 削除できていないと手順3の前提が無い（ブラウザAの操作がふつうの更新・削除になる）ので、削除の完了の表示と、一覧から行が消えたことまで確かめる。
 */
async function deleteInBrowserB(grpB: PurchaseGroupPage, id: string): Promise<void> {
  await grpB.openNew();
  const pending = await grpB.pressDeleteButton(grpB.rowById(id));
  note(`ブラウザB: 削除確認モーダルの文「${pending.message}」`);
  const r = await grpB.confirmDelete(pending);
  noteDelete(r, "ブラウザB: ");
  await noteMessages(grpB.page, "ブラウザBで削除したあと");
  await expect(grpB.page.locator(".alert-success"), "ブラウザB: 削除の完了の表示").toContainText("削除しました");
  await expect(grpB.rowById(id), `ブラウザB: 一覧から購入グループID ${id} の行が消えた`).toHaveCount(0);
}

// ---- 削除のあとの保存・削除（ブラウザ2つ） ----

/** ブラウザAで編集の状態を開き、ブラウザBで削除し、ブラウザAで名称（日）を変えて登録する（020・021 の手順1〜3） */
async function saveAfterDelete(ctx: CaseCtx, idLabel: string): Promise<SubmitResult> {
  const { page, notes, step } = ctx;
  const id = notes.get(idLabel);
  const grpA = await signIn(page);
  const { contextB, grpB } = await openBrowserB(ctx);
  try {
    let r!: SubmitResult;
    await step(1, async () => { await grpA.openEdit(id); });
    await step(2, async () => { await deleteInBrowserB(grpB, id); });
    await step(3, async () => {
      await grpA.fill({ 名称日: "削除後更新" });
      r = await grpA.pressRegister();
      noteSubmit(r, "ブラウザA: ");
      if (r.sent) await noteMessages(page, "ブラウザAで登録ボタンを押したあと");
    });
    return r;
  } finally {
    await contextB.close();
  }
}

caseTest("IT-M03-22-020", async (ctx) => {
  const r = await saveAfterDelete(ctx, "〔購入グループID-M0322-020〕");
  await ctx.expected(async () => {
    expect(r.sent, "ブラウザAの登録の要求が送られた").toBe(true);
    expect.soft(r.sent ? r.移った画面 : null, "ブラウザAに表示された画面の応答").toBe(200);
    await expectPurchaseGroupScreen(ctx.page, "ブラウザA");
  });
});

caseTest("IT-M03-22-021", async (ctx) => {
  const id = ctx.notes.get("〔購入グループID-M0322-021〕");
  await saveAfterDelete(ctx, "〔購入グループID-M0322-021〕");
  let saved: 保存された購入グループ | null = null;
  await ctx.step(4, async () => { saved = 購入グループ(id); });
  await ctx.expected(async () => {
    const got = saved as 保存された購入グループ | null;
    expect(got, `購入グループID ${id} の行`).not.toBeNull();
    expect.soft(got?.名称日, `購入グループID ${id} の名称（日）（更新されない）`).toBe("競合確認購入グループ-021");
    expect.soft(got?.削除日時 ?? null, `購入グループID ${id} の削除日時`).not.toBeNull();
  });
});

caseTest("IT-M03-22-029", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔購入グループID-M0322-029〕");
  const grpA = await signIn(page);
  const { contextB, grpB } = await openBrowserB(ctx);
  try {
    let r!: DeleteResult;
    await step(1, async () => { await grpA.openNew(); });
    await step(2, async () => { await deleteInBrowserB(grpB, id); });
    await step(3, async () => {
      // ブラウザAの一覧は、手順1で開いたまま（ブラウザBの削除の前の表示）
      const pending = await grpA.pressDeleteButton(grpA.rowById(id));
      note(`ブラウザA: 削除確認モーダルの文「${pending.message}」`);
      r = await grpA.confirmDelete(pending);
      noteDelete(r, "ブラウザA: ");
      await noteMessages(page, "ブラウザAで削除したあと");
    });
    await expected(async () => {
      expect.soft(r.移った画面, "ブラウザAに表示された画面の応答").toBe(200);
      await expectPurchaseGroupScreen(page, "ブラウザA");
    });
  } finally {
    await contextB.close();
  }
});

// ---- なりすまし対策トークン ----

caseTest("IT-M03-22-022", async ({ page, notes, step, expected }) => {
  const grp = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await grp.openEdit(notes.get("〔購入グループID-M0322-022〕")); });
  await step(2, async () => { await grp.fill({ 名称日: "トークン改ざん更新" }); });
  await step(3, async () => { await tamperToken(grp.form, "invalid-token"); });
  await step(4, async () => {
    r = await grp.pressRegister();
    noteSubmit(r);
    if (r.sent) await noteMessages(page, "登録ボタンを押したあと");
  });
  await expected(async () => {
    expect(r.sent ? r.移った画面 : "（要求が送られていない）", "登録ボタンを押したあとに表示された画面の応答").toBe(403);
  });
});

caseTest("IT-M03-22-023", async ({ page, notes, step, expected }) => {
  const grp = await signIn(page);
  const id = notes.get("〔購入グループID-M0322-023〕");
  let pending!: PendingDelete;
  let r!: DeleteResult;
  await step(1, async () => { await grp.openNew(); });
  await step(2, async () => { pending = await grp.pressDeleteButton(grp.rowById(id)); note(`削除確認モーダルの文「${pending.message}」`); });
  await step(3, async () => { await grp.replaceDeleteToken(pending, "invalid-token"); });
  await step(4, async () => { r = await grp.confirmDelete(pending); noteDelete(r); });
  await expected(async () => {
    expect(r.移った画面, "削除確認モーダルの削除ボタンを押したあとに表示された画面の応答").toBe(403);
  });
});

// ---- 削除 ----

/** 購入グループ管理画面を開き、行の削除ボタンを押して削除確認モーダルを開く（手順1・2） */
async function openDeleteModal(ctx: CaseCtx, idLabel: string): Promise<{ grp: PurchaseGroupPage; id: string; pending: PendingDelete }> {
  const { page, notes, step } = ctx;
  const grp = await signIn(page);
  const id = notes.get(idLabel);
  let pending!: PendingDelete;
  await step(1, async () => { await grp.openNew(); });
  await step(2, async () => { pending = await grp.pressDeleteButton(grp.rowById(id)); note(`削除確認モーダルの文「${pending.message}」`); });
  return { grp, id, pending };
}

/** 削除確認モーダルの削除ボタンを押す（手順3） */
async function confirmInModal(ctx: CaseCtx, grp: PurchaseGroupPage, pending: PendingDelete): Promise<DeleteResult> {
  let r!: DeleteResult;
  await ctx.step(3, async () => {
    r = await grp.confirmDelete(pending);
    noteDelete(r);
    await noteMessages(ctx.page, "削除確認モーダルの削除ボタンを押したあと");
  });
  return r;
}

caseTest("IT-M03-22-024", async (ctx) => {
  const { grp, id, pending } = await openDeleteModal(ctx, "〔購入グループID-M0322-024〕");
  const before = pathOf(ctx.page.url());
  await ctx.step(3, async () => { await grp.cancelDelete(pending); });
  await ctx.expected(async () => {
    await expect.soft(grp.削除確認モーダル, "削除確認モーダル（閉じる）").toBeHidden();
    expect.soft(pathOf(ctx.page.url()), "キャンセルのあとの画面（購入グループ管理画面のまま）").toBe(before);
    await expect.soft(grp.rowById(id), `一覧の購入グループID ${id} の行`).toHaveCount(1);
    await expect.soft(grp.rowById(id), `一覧の購入グループID ${id} の行（表示されている）`).toBeVisible();
  });
});

caseTest("IT-M03-22-025", async (ctx) => {
  const { grp, id, pending } = await openDeleteModal(ctx, "〔購入グループID-M0322-025〕");
  await confirmInModal(ctx, grp, pending);
  let saved: 保存された購入グループ | null = null;
  await ctx.step(4, async () => { saved = 購入グループ(id); });
  await ctx.expected(async () => {
    const got = saved as 保存された購入グループ | null;
    expect(got, `購入グループID ${id} の行（DBに残る）`).not.toBeNull();
    expect(got?.削除日時 ?? null, `購入グループID ${id} の削除日時`).not.toBeNull();
  });
});

caseTest("IT-M03-22-026", async (ctx) => {
  const { grp, pending } = await openDeleteModal(ctx, "〔購入グループID-M0322-026〕");
  const r = await confirmInModal(ctx, grp, pending);
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page.url()), "移った画面（購入グループ管理画面の一覧）").toBe(purchaseGroupIndexPath());
    expect.soft(r.移った画面, "移った画面の応答").toBe(200);
    await expectPurchaseGroupScreen(ctx.page, "移った画面");
  });
});

caseTest("IT-M03-22-027", async (ctx) => {
  const id = ctx.notes.get("〔購入グループID-M0322-027〕");
  // 「削除前の状態」は、削除ボタンを押す前のDBの行と比べる
  const before = 購入グループ(id);
  if (!before) throw new Error(`購入グループID ${id} の行がDBに無い（事前準備の不足）`);
  note(`削除前の行: ${JSON.stringify(before)}`);
  const { grp, pending } = await openDeleteModal(ctx, "〔購入グループID-M0322-027〕");
  await confirmInModal(ctx, grp, pending);
  let saved: 保存された購入グループ | null = null;
  await ctx.step(4, async () => { saved = 購入グループ(id); });
  await ctx.expected(async () => {
    const got = saved as 保存された購入グループ | null;
    expect(got, `購入グループID ${id} の行`).not.toBeNull();
    expect.soft(got?.削除日時 ?? null, `購入グループID ${id} の削除日時（設定されない）`).toBeNull();
    expect.soft(got, `購入グループID ${id} の行（削除前の状態のまま）`).toEqual(before);
  });
});

caseTest("IT-M03-22-028", async (ctx) => {
  const { grp, id, pending } = await openDeleteModal(ctx, "〔購入グループID-M0322-028〕");
  await confirmInModal(ctx, grp, pending);
  await ctx.expected(async () => {
    expect.soft(pathOf(ctx.page.url()), "移った画面（購入グループ管理画面の一覧）").toBe(purchaseGroupIndexPath());
    await expect.soft(grp.rowById(id), `一覧の購入グループID ${id} の行`).toHaveCount(1);
    await expect.soft(grp.rowById(id), `一覧の購入グループID ${id} の行（表示されている）`).toBeVisible();
  });
});

// ---- 連携（商品登録編集画面の購入グループ欄） ----

caseTest("IT-M03-22-031", async ({ page, notes, step, expected }) => {
  const name = "L001M0322n031連携購入グループ";
  const grp = new PurchaseGroupPage(page);
  // 手順2で登録した購入グループの購入グループID（登録後に移った編集の状態の画面のアドレス末尾から読む）。
  // 購入グループ欄は削除された購入グループも並べ、シードは前の実行の同じ名称の行を画面の削除（削除日時を入れるだけ）で片付けるので、
  // 名称だけで探すと前の実行の行の選択肢に当たる。手順2で登録した行の選択肢であることを購入グループIDで確かめる。
  let registeredId = "";
  let choices: { 購入グループID: string; 名称: string }[] = [];
  await step(1, async () => { await loginAdmin(page, M0322L_ADMIN); });
  await step(2, async () => {
    await grp.openNew();
    // 予約商品フラグは初期値0のまま、メモ・支払方法・配送方法は未入力・未選択のまま
    expect(await grp.inputValues(), "新規登録の状態の入力欄").toEqual({ 名称日: "", 名称英: "", 予約商品フラグ: false, メモ: "" });
    expect([...await grp.checkedLabels(grp.支払方法), ...await grp.checkedLabels(grp.配送方法)], "選ばれている支払方法・配送方法").toEqual([]);
    await grp.fill({ 名称日: name, 名称英: name });
    const r = await grp.pressRegister();
    noteSubmit(r);
    if (r.sent) {
      await grp.ready();
      const m = pathOf(page.url()).match(/\/product\/sell_group\/(\d+)$/);
      if (m) registeredId = m[1];
      note(m ? `登録後に移った画面: 購入グループID ${m[1]} の編集の状態（${pathOf(page.url())}）`
        : `登録後に移った画面のアドレス（${pathOf(page.url())}）から購入グループIDを読めない`);
    }
  });
  await step(3, async () => {
    await expect(page.locator(".alert-success"), "画面上部の完了の表示").toContainText("保存しました");
    const rows = await grp.rowsByName(name).count();
    note(`一覧の「${name}」の行: ${rows} 件`);
    expect(rows, `一覧の「${name}」の行`).toBeGreaterThan(0);
    expect(registeredId, "手順2で登録した購入グループの購入グループID（登録後に移った編集の状態の画面のアドレス末尾）").not.toBe("");
    await expect(grp.rowById(registeredId), `一覧の購入グループID ${registeredId} の行`).toHaveCount(1);
    expect((await grp.readRow(grp.rowById(registeredId))).名称日, `一覧の購入グループID ${registeredId} の行の名称（日）`).toBe(name);
  });
  await step(4, async () => { await openProductEdit(page, notes.get("〔商品ID-M0322-031〕")); });
  await step(5, async () => { choices = await purchaseGroupChoices(page); });
  await expected(async () => {
    const sameName = choices.filter((c) => c.名称 === name).map((c) => c.購入グループID);
    note(`購入グループ欄の「${name}」の選択肢: ${sameName.length ? `購入グループID ${sameName.join("、")}` : "なし"}（手順2で登録したのは購入グループID ${registeredId}）`);
    expect(choices, `購入グループ欄の選択肢（手順2で登録した購入グループID ${registeredId}・表示名「${name}」）`)
      .toContainEqual({ 購入グループID: registeredId, 名称: name });
  });
});

caseTest("IT-M03-22-032", async ({ page, notes, step, expected }) => {
  const name = "L002M0322n032削除購入グループ";
  const productId = notes.get("〔商品ID-M0322-032〕");
  const groupId = notes.get("〔購入グループID-M0322-032〕");
  const grp = new PurchaseGroupPage(page);
  let pending!: PendingDelete;
  let options: string[] = [];
  /** 購入グループ欄の、表示名が name の選択肢の購入グループID */
  const idsNamed = (choices: { 購入グループID: string; 名称: string }[]) =>
    choices.filter((c) => c.名称 === name).map((c) => c.購入グループID);
  await step(1, async () => { await loginAdmin(page, M0322L_ADMIN); });
  await step(2, async () => {
    await openProductEdit(page, productId);
    // 購入グループ欄は削除された購入グループも並べ、前の実行で削除した同じ名称の行の選択肢が残る。
    // 表示名だけで見ると、シードが登録した購入グループが欄に出ていなくても通るので、控えた購入グループIDと表示名の組で確かめる（031 と同じ）
    const before = await purchaseGroupChoices(page);
    const same = idsNamed(before);
    note(`削除前の購入グループ欄の「${name}」の選択肢: ${same.length ? `購入グループID ${same.join("、")}` : "なし"}（シードが登録したのは購入グループID ${groupId}）`);
    expect(before, `削除前の購入グループ欄の選択肢（控えた購入グループID ${groupId}・表示名「${name}」）`)
      .toContainEqual({ 購入グループID: groupId, 名称: name });
  });
  await step(3, async () => {
    await grp.openNew();
    expect(await grp.idsOfName(name), `一覧の名称（日）「${name}」の行（控えた購入グループIDの1行）`).toEqual([groupId]);
    pending = await grp.pressDeleteButton(grp.rowsByName(name));
  });
  await step(4, async () => {
    const want = `この操作はあとから取り消すことができません。「${name}」を削除してよろしいですか？`;
    note(`削除確認モーダルの文: ${pending.message}（正本の文と${pending.message === want ? "同じ" : "違う"}）`);
    noteDelete(await grp.confirmDelete(pending));
  });
  await step(5, async () => {
    await noteMessages(page, "削除したあと");
    await expect(page.locator(".alert-success"), "画面上部の削除の表示").toContainText("削除しました");
  });
  await step(6, async () => {
    await openProductEdit(page, productId);
    const after = await purchaseGroupChoices(page);
    const same = idsNamed(after);
    note(`削除したあとの購入グループ欄の「${name}」の選択肢: ${same.length ? `購入グループID ${same.join("、")}` : "なし"}（手順4で削除したのは購入グループID ${groupId}）`);
    options = after.map((c) => c.名称);
  });
  await expected(async () => {
    expect(options, "購入グループ欄の選択肢").not.toContain(name);
  });
});
