/** M03-11 カテゴリ登録/編集。正本: cases/M03-11_test_cases.tsv */
import { Dialog, expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { CaseBody, caseTest } from "../../lib/case";
import { カテゴリ, 名称のカテゴリ } from "../../db/category";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { CategoryPage } from "../../pages/admin/category";
import { M0311_ADMIN } from "../../seeds/m03-11";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const editUrl = (id: string) => adminUrl(`/product/category/${id}/edit`);
const listUrl = (parentId: string) => adminUrl(`/product/category/${parentId}`);

/** 正本の「新しいブラウザセッションで、m0311_admin としてログインしている」 */
async function signIn(page: Page): Promise<CategoryPage> {
  await loginAdmin(page, M0311_ADMIN);
  return new CategoryPage(page);
}

/** 画面URLの中のカテゴリIDを置き換えて開き、応答の状態を返す */
async function openReplaced(page: Page, from: string, to: string, path: (id: string) => string): Promise<number> {
  const url = page.url();
  const want = path(from);
  if (url !== want) throw new Error(`表示中の画面URLが ${want} ではない（${url}）`);
  const res = await page.goto(path(to));
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

// ---- 表示 ----

caseTest("IT-M03-11-001", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  let crumbs: string[] = [];
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-001C〕")));
  await step(2, async () => { crumbs = await category.breadcrumb(); });
  await expected(async () => {
    note(`パンくずの表示: ${crumbs.join(" ＞ ")}（先頭の「すべてのカテゴリ」は最上位の一覧へのリンク）`);
    expect(crumbs.filter((c) => c !== "すべてのカテゴリ").join("＞"), "最上位から編集中のカテゴリまでの階層").toBe("全商品＞カード＞編集前カテゴリ-001");
  });
});

/** カテゴリツリーに見えていないカテゴリ（「ID:n 名称」） */
async function missingInTree(category: CategoryPage, items: [string, string][]): Promise<string[]> {
  const tree = await category.visibleTree();
  return items.filter(([id, name]) => !tree.some((t) => t.id === id && t.name === name)).map(([id, name]) => `ID:${id} ${name}`);
}

caseTest("IT-M03-11-002", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-002C〕")));
  await step(2, async () => { await category.visibleTree(); });
  await expected(async () => {
    expect(await missingInTree(category, [
      [notes.get("〔カテゴリID-M0311-002A〕"), "全商品-002"],
      [notes.get("〔カテゴリID-M0311-002B〕"), "カード-002"],
      [notes.get("〔カテゴリID-M0311-002C〕"), "編集前カテゴリ-002"],
      [notes.get("〔カテゴリID-M0311-002D〕"), "サブカテゴリA"],
    ]), "カテゴリツリーに見えていない、編集中のカテゴリまでの階層と子カテゴリ").toEqual([]);
  });
});

caseTest("IT-M03-11-003", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-003B〕");
  await step(1, () => category.openTop());
  await step(2, () => category.selectInTree(b));
  await expected(async () => {
    expect(page.url(), "ID 003B を選んだカテゴリ登録/編集画面").toBe(listUrl(b));
    await expect(category.nameJp, "子カテゴリのカテゴリ名(日)の入力欄").toBeVisible();
    await expect(category.submit, "子カテゴリ作成ボタン").toHaveText(/^\s*子カテゴリ作成\s*$/);
    expect(new URL(await category.form.getAttribute("action") ?? "", BASE_URL).href, "入力欄の登録先は ID 003B を親とする子カテゴリ").toBe(listUrl(b));
  });
});

caseTest("IT-M03-11-004", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-004B〕");
  let status = 0;
  await step(1, () => category.openChildrenOf(b));
  await step(2, async () => { status = await openReplaced(page, b, "999999", listUrl); });
  await expected(async () => {
    note(`親カテゴリID 999999 の画面URLの応答: ${status}`);
    expect(await category.categoryScreenParts(), "親カテゴリID 999999 のカテゴリ登録/編集画面（ツリー・入力欄）").toEqual([]);
  });
});

caseTest("IT-M03-11-005", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-005C〕")));
  await expected(async () => {
    await expect.soft(category.nameJp, "カテゴリ名(日)").toHaveValue("編集前カテゴリ-005");
    await expect.soft(category.nameEn, "カテゴリ名(英)").toHaveValue("BeforeCategory-005");
    await expect.soft(category.frontHide, "フロント非表示フラグ").not.toBeChecked();
    await expect.soft(category.branchHide, "支店非表示フラグ").not.toBeChecked();
    await expect.soft(category.htmlJa, "埋め込みHTML(日)").toHaveValue("<p>更新前JP</p>");
    await expect.soft(category.htmlEn, "埋め込みHTML(英)").toHaveValue("<p>Before EN</p>");
    await expect.soft(category.searchParameters, "検索パラメータ").toHaveValue("rarity=old");
  });
});

caseTest("IT-M03-11-006", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const c = notes.get("〔カテゴリID-M0311-006C〕");
  let status = 0;
  await step(1, () => category.openEdit(c));
  await step(2, async () => { status = await openReplaced(page, c, "999999", editUrl); });
  await expected(async () => {
    note(`カテゴリID 999999 の編集画面URLの応答: ${status}`);
    expect(await category.categoryScreenParts(), "カテゴリID 999999 のカテゴリ編集画面（ツリー・入力欄）").toEqual([]);
  });
});

caseTest("IT-M03-11-007", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openChildrenOf(notes.get("〔カテゴリID-M0311-007D〕")));
  await expected(async () => {
    await expect(category.nameJp, "カテゴリ入力欄").toBeVisible();
    await expect(category.submit, "子カテゴリ作成ボタン").toHaveText(/^\s*子カテゴリ作成\s*$/);
  });
});

caseTest("IT-M03-11-008", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-008E〕")));
  await expected(async () => {
    await expect(category.form, "カテゴリ入力欄").toHaveCount(0);
    await expect(category.nameJp, "カテゴリ名(日)の入力欄").toHaveCount(0);
    await expect(page.getByRole("button", { name: /カテゴリ更新|子カテゴリ作成/ }), "保存ボタン・子カテゴリ作成ボタン").toHaveCount(0);
  });
});

caseTest("IT-M03-11-009", async ({ page, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openTop());
  await expected(async () => {
    await expect(category.form, "ルート直下へ登録する入力欄").toHaveCount(0);
    await expect(category.nameJp, "カテゴリ名(日)の入力欄").toHaveCount(0);
    await expect(page.getByRole("button", { name: /カテゴリ更新|子カテゴリ作成/ }), "保存ボタン").toHaveCount(0);
  });
});

caseTest("IT-M03-11-010", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-010B〕");
  let row: Locator | null = null;
  await step(1, () => category.openEdit(b));
  await step(2, async () => {
    row = category.rowById(b);
    await expect(row, "兄弟カテゴリ一覧の ID 010B の行").toHaveCount(1);
  });
  await expected(async () => {
    const r = (await category.rowValues()).find((v) => v.id === b);
    expect(r?.editing, "ID 010B の行は編集中").toBe(true);
    expect(r?.editHref ?? null, "ペンアイコン（編集画面への入口）").toBeNull();
    await expect(row!.locator(`a[href$="/product/category/${b}/edit"]:visible`), "ID 010B の行の、編集画面へのリンク").toHaveCount(0);
  });
});

caseTest("IT-M03-11-011", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-011B〕");
  await step(1, () => category.openChildrenOf(notes.get("〔カテゴリID-M0311-011A〕")));
  await step(2, async () => {
    const link = category.rowById(b).locator(".flex-grow-1 > a").first();
    await expect(link, "サブカテゴリ名「編集前カテゴリ-011」のリンク").toHaveText("編集前カテゴリ-011");
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect(page.url(), "ID 011B のカテゴリ編集画面").toBe(editUrl(b));
    await expect(category.submit, "カテゴリ編集画面の「カテゴリ更新」").toHaveText(/^\s*カテゴリ更新\s*$/);
  });
});

caseTest("IT-M03-11-012", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-012B〕");
  await step(1, () => category.openChildrenOf(notes.get("〔カテゴリID-M0311-012A〕")));
  await step(2, async () => {
    const pen = category.row("編集前カテゴリ-012").locator("a.action-edit");
    await expect(pen, "「編集前カテゴリ-012」のペンアイコン").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), pen.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect(page.url(), "ID 012B のカテゴリ編集画面").toBe(editUrl(b));
    await expect(category.submit, "カテゴリ編集画面の「カテゴリ更新」").toHaveText(/^\s*カテゴリ更新\s*$/);
    await expect(category.nameJp, "編集対象のカテゴリ名(日)").toHaveValue("編集前カテゴリ-012");
  });
});

caseTest("IT-M03-11-013", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  let text = "";
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-013B〕")));
  await step(2, async () => {
    await expect(category.form, "カテゴリ編集画面の入力欄").toBeVisible();
    text = `${await category.form.innerText()}\n${await page.locator(".c-conversionArea").innerText()}`;
  });
  await expected(async () => {
    for (const item of ["サイドメニューjson出力", "サイドメニュー表示フラグ", "サイドメニュー表示用子カテゴリ", "サイドメニュー", "商品コード"]) {
      expect.soft(text.includes(item), `入力項目・操作ボタンに「${item}」が無い`).toBe(false);
    }
  });
});

caseTest("IT-M03-11-014", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-014B〕")));
  await expected(async () => {
    await expect.soft(category.htmlJa, "埋め込みHTML(日)").toBeVisible();
    await expect.soft(category.htmlEn, "埋め込みHTML(英)").toBeVisible();
    await expect.soft(category.branchHide, "支店非表示フラグ").toBeVisible();
    await expect.soft(category.searchParameters, "検索パラメータ").toBeVisible();
  });
});

// ---- 登録・更新 ----

caseTest("IT-M03-11-017", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-017B〕");
  let saved: ReturnType<typeof 名称のカテゴリ> = [];
  await step(1, () => category.openChildrenOf(b));
  await step(2, () => category.fill({
    nameJp: "新規カテゴリA1", nameEn: "NewCategory-A1", frontHide: false, branchHide: false,
    htmlJa: "<p>新規JP</p>", htmlEn: "<p>New EN</p>", searchParameters: "rarity=R1&lang=en",
  }));
  await step(3, () => category.submitAndWait());
  await step(4, async () => { saved = 名称のカテゴリ("新規カテゴリA1"); });
  await expected(async () => {
    expect(saved.length, "「新規カテゴリA1」のカテゴリは1件").toBe(1);
    const r = saved[0];
    expect.soft(r.親カテゴリID, "親カテゴリは ID 017B").toBe(b);
    expect.soft(r.英名, "カテゴリ名(英)").toBe("NewCategory-A1");
    expect.soft(r.フロント非表示, "フロント非表示フラグ").toBe(false);
    expect.soft(r.支店非表示, "支店非表示フラグ").toBe(false);
    expect.soft(r.埋め込みHTML日, "埋め込みHTML(日)").toBe("<p>新規JP</p>");
    expect.soft(r.埋め込みHTML英, "埋め込みHTML(英)").toBe("<p>New EN</p>");
    expect.soft(r.検索パラメータ, "検索パラメータ").toBe("rarity=R1&lang=en");
  });
});

caseTest("IT-M03-11-018", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-018B〕");
  let saved: ReturnType<typeof カテゴリ> = null;
  await step(1, () => category.openEdit(b));
  await step(2, () => category.fill({
    nameJp: "更新カテゴリB2", nameEn: "UpdatedCategory-B2", frontHide: true, branchHide: true,
    htmlJa: "<p>更新JP</p>", htmlEn: "<p>Updated EN</p>", searchParameters: "rarity=R2&type=card",
  }));
  await step(3, () => category.submitAndWait());
  await step(4, async () => { saved = カテゴリ(b); });
  await expected(async () => {
    expect(saved, "ID 018B のカテゴリ").not.toBeNull();
    const r = saved!;
    expect.soft(r.名称, "カテゴリ名(日)").toBe("更新カテゴリB2");
    expect.soft(r.英名, "カテゴリ名(英)").toBe("UpdatedCategory-B2");
    expect.soft(r.フロント非表示, "フロント非表示フラグ").toBe(true);
    expect.soft(r.支店非表示, "支店非表示フラグ").toBe(true);
    expect.soft(r.埋め込みHTML日, "埋め込みHTML(日)").toBe("<p>更新JP</p>");
    expect.soft(r.埋め込みHTML英, "埋め込みHTML(英)").toBe("<p>Updated EN</p>");
    expect.soft(r.検索パラメータ, "検索パラメータ").toBe("rarity=R2&type=card");
  });
});

/** 保存ボタンを押したあとの画面の案内（成功・入力エラー）を注記に残す */
async function noteMessages(page: Page, what: string): Promise<void> {
  const texts = (await page.locator(".alert-success, .alert-danger, .invalid-feedback, .form-error-message").allInnerTexts())
    .map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && t !== "デバッグモードが有効になっています。");
  note(`${what}: ${texts.length ? texts.join(" / ") : "案内の表示なし"}（URL ${page.url()}）`);
}

caseTest("IT-M03-11-019", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-019B〕");
  let saved: ReturnType<typeof カテゴリ> = null;
  await step(1, () => category.openEdit(b));
  await step(2, () => category.fill({ nameJp: "保存されない名称", searchParameters: "レアリティ＝Ｒ" }));
  await step(3, async () => {
    await category.submitAndWait();
    await noteMessages(page, "保存ボタンを押したあと");
  });
  await step(4, async () => { saved = カテゴリ(b); });
  await expected(async () => {
    expect(saved, "ID 019B のカテゴリ").not.toBeNull();
    expect.soft(saved!.名称, "カテゴリ名(日)は更新されない").toBe("編集前カテゴリ-019");
    expect.soft(saved!.検索パラメータ, "検索パラメータは更新されない").toBe("rarity=old");
  });
});

caseTest("IT-M03-11-020", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-020B〕");
  await step(1, () => category.openEdit(b));
  await step(2, () => category.fill({ searchParameters: "レアリティ＝Ｒ" }));
  await step(3, async () => {
    await category.submitAndWait();
    await noteMessages(page, "保存ボタンを押したあと");
  });
  await expected(async () => {
    expect(page.url(), "ID 020B のカテゴリ編集画面に留まる").toBe(editUrl(b));
    await expect(category.submit, "カテゴリ編集画面の「カテゴリ更新」").toHaveText(/^\s*カテゴリ更新\s*$/);
  });
});

caseTest("IT-M03-11-021", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const d = notes.get("〔カテゴリID-M0311-021D〕");
  const e = notes.get("〔カテゴリID-M0311-021E〕");
  let saved: ReturnType<typeof 名称のカテゴリ> = [];
  await step(1, () => category.openChildrenOf(d));
  await step(2, () => category.fill({ nameJp: "階層6試験カテゴリ", nameEn: "Level6Category" }));
  await step(3, async () => {
    // 開発者ツールでフォームの送信先を書き換えるのと同じ操作
    const before = await category.form.getAttribute("action") ?? "";
    if (new URL(before, BASE_URL).href !== listUrl(d)) throw new Error(`フォームの送信先が ID 021D を親とする登録ではない（${before}）`);
    await category.form.evaluate((f, url) => f.setAttribute("action", url), new URL(listUrl(e)).pathname);
    note(`フォームの送信先を ${before} から ${new URL(listUrl(e)).pathname} へ変更した`);
  });
  await step(4, async () => {
    const [res] = await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), category.submit.click()]);
    await page.waitForLoadState("load");
    note(`子カテゴリ作成ボタンを押したあとの応答: ${res?.status() ?? "不明"}（URL ${page.url()}）`);
  });
  await step(5, async () => { saved = 名称のカテゴリ("階層6試験カテゴリ"); });
  await expected(async () => {
    expect(saved.map((r) => `${r.カテゴリID}(階層${r.階層})`), "「階層6試験カテゴリ」は登録されない").toEqual([]);
  });
});

caseTest("IT-M03-11-022", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const a = notes.get("〔カテゴリID-M0311-022A〕");
  const b = notes.get("〔カテゴリID-M0311-022B〕");
  const c = notes.get("〔カテゴリID-M0311-022C〕");
  const before = { a: カテゴリ(a)?.表示順, b: カテゴリ(b)?.表示順, c: カテゴリ(c)?.表示順 };
  note(`保存前の表示順: ID 022A=${before.a}・ID 022B=${before.b}・ID 022C=${before.c}`);
  let added: ReturnType<typeof 名称のカテゴリ> = [];
  let after: { b?: string; c?: string } = {};
  await step(1, () => category.openChildrenOf(a));
  await step(2, () => category.fill({ nameJp: "挿入順カテゴリ", nameEn: "InsertedCategory" }));
  await step(3, () => category.submitAndWait());
  await step(4, async () => {
    added = 名称のカテゴリ("挿入順カテゴリ");
    after = { b: カテゴリ(b)?.表示順, c: カテゴリ(c)?.表示順 };
  });
  await expected(async () => {
    expect(before, "保存前の表示順はシードどおり 30・31・40").toEqual({ a: "30", b: "31", c: "40" });
    expect(added.length, "「挿入順カテゴリ」は1件登録される").toBe(1);
    note(`保存後の表示順: 新規カテゴリ=${added[0]?.表示順}・ID 022B=${after.b}・ID 022C=${after.c}`);
    // 「親カテゴリIDに応じて設定」は、親がID 022A で、表示順が設定されていることとして確かめる（解釈）
    expect.soft(added[0]?.親カテゴリID, "新規カテゴリの親は ID 022A").toBe(a);
    expect.soft(/^\d+$/.test(added[0]?.表示順 ?? ""), "新規カテゴリに表示順が設定されている").toBe(true);
    expect.soft(Number(after.b), "保存前に31だった ID 022B は、より大きい表示順へ").toBeGreaterThan(31);
    expect.soft(Number(after.c), "保存前に40だった ID 022C は、より大きい表示順へ").toBeGreaterThan(40);
  });
});

// ---- 並び替え ----

/**
 * 一覧の行を、三点リーダーの位置からつかんで、別の行の下へドラッグして放す。放すと確認のポップアップが出る。
 * ポップアップは閉じずに返す（押すのは次の手順）。
 */
async function dragBelow(page: Page, category: CategoryPage, from: string, below: string): Promise<{ dialog: Dialog; released: Promise<void> }> {
  const handle = category.row(from).locator(".fa-bars");
  const target = category.row(below);
  await expect(handle, `「${from}」の三点リーダー`).toBeVisible();
  // 座標は画面に見えている範囲で測る（画面の外の行を測ると、つかむ位置がずれて文字の選択になる）
  await target.scrollIntoViewIfNeeded();
  await handle.scrollIntoViewIfNeeded();
  const h = (await handle.boundingBox())!;
  const t = (await target.boundingBox())!;
  const shown = page.waitForEvent("dialog", { timeout: 10_000 });
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 + 5, { steps: 5 });
  await page.mouse.move(h.x + h.width / 2, t.y + t.height + 5, { steps: 20 });
  // 放す操作は、ポップアップが閉じるまで終わらない
  const released = page.mouse.up();
  const dialog = await shown.catch(() => { throw new Error("ドラッグして放したが、並び替えの確認のポップアップが出ない"); });
  return { dialog, released };
}

/** 023・024: 兄弟カテゴリをドラッグで並び替え、確認のポップアップで OK／キャンセルを押して、再読み込み後の並びを見る */
function sortCase(no: string, nameA: string, nameB: string, accept: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const category = await signIn(page);
    const parent = notes.get(`〔カテゴリID-M0311-${no}A〕`);
    let drag: Awaited<ReturnType<typeof dragBelow>> | null = null;
    let order: string[] = [];
    await step(1, () => category.openChildrenOf(parent));
    await step(2, async () => { drag = await dragBelow(page, category, nameA, nameB); });
    await step(3, async () => {
      const { dialog, released } = drag!;
      note(`ポップアップ「${dialog.message()}」で「${accept ? "OK" : "キャンセル"}」を押した`);
      if (accept) {
        const moved = page.waitForResponse((r) => r.url().includes("/product/category/sort_no/move"));
        await dialog.accept();
        await released;
        note(`並び替えの保存の応答: ${(await moved).status()}`);
      } else {
        await dialog.dismiss();
        await released;
      }
    });
    await step(4, async () => {
      await page.reload();
      await page.waitForLoadState("load");
      order = (await category.rowValues()).map((r) => r.nameJp);
    });
    await expected(async () => {
      expect(order, "兄弟カテゴリの表示順").toEqual(accept ? [nameB, nameA] : [nameA, nameB]);
    });
  };
}

caseTest("IT-M03-11-023", sortCase("023", "並び替えカテゴリA-023", "並び替えカテゴリB-023", true));
caseTest("IT-M03-11-024", sortCase("024", "並び替えカテゴリA", "並び替えカテゴリB", false));

// ---- 遷移 ----

caseTest("IT-M03-11-033", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-033B〕");
  await step(1, () => category.openChildrenOf(b));
  await step(2, () => category.fill({
    nameJp: "新規遷移カテゴリ", nameEn: "NewTransitionCategory", htmlJa: "<p>新規遷移</p>", htmlEn: "<p>New transition</p>", searchParameters: "type=new",
  }));
  await step(3, () => category.submitAndWait());
  await expected(async () => {
    expect(page.url(), "カテゴリ一覧画面（ID 033B を親とする一覧）").toBe(listUrl(b));
    expect(await category.subTitle(), "画面名").toBe("カテゴリ一覧");
    await expect(category.row("新規遷移カテゴリ"), "一覧に登録したカテゴリが並ぶ").toHaveCount(1);
  });
});

caseTest("IT-M03-11-034", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const a = notes.get("〔カテゴリID-M0311-034A〕");
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-034B〕")));
  await step(2, () => category.fill({ nameJp: "更新遷移カテゴリ" }));
  await step(3, () => category.submitAndWait());
  await expected(async () => {
    expect(page.url(), "カテゴリ一覧画面（ID 034A を親とする一覧）").toBe(listUrl(a));
    expect(await category.subTitle(), "画面名").toBe("カテゴリ一覧");
    await expect(category.row("更新遷移カテゴリ"), "一覧に更新したカテゴリが並ぶ").toHaveCount(1);
  });
});

// ---- 削除 ----

/** 削除の確認のポップアップで確定する。正本は「OK」、画面のボタン名は「削除」 */
async function confirmDeleteWithNote(category: CategoryPage, modal: Locator): Promise<void> {
  const label = (await modal.locator("a.btn-ec-delete").innerText()).trim();
  note(`削除の確認のポップアップの確定ボタンは「${label}」（正本の「OK」にあたるボタンとして押した）`);
  await category.confirmDelete(modal);
}

caseTest("IT-M03-11-035", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-035B〕");
  let modal: Locator | null = null;
  await step(1, () => category.openChildrenOf(notes.get("〔カテゴリID-M0311-035A〕")));
  await step(2, async () => { modal = await category.openDelete("未使用削除カテゴリ-035"); });
  await step(3, () => confirmDeleteWithNote(category, modal!));
  await expected(async () => {
    expect(await category.subTitle(), "カテゴリ一覧画面").toBe("カテゴリ一覧");
    await expect(category.rowById(b), "ID 035B の行").toHaveCount(0);
    await expect(category.row("未使用削除カテゴリ-035"), "「未使用削除カテゴリ-035」の行").toHaveCount(0);
  });
});

caseTest("IT-M03-11-036", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const b = notes.get("〔カテゴリID-M0311-036B〕");
  let modal: Locator | null = null;
  let 削除を確定した = false;
  await step(1, () => category.openChildrenOf(notes.get("〔カテゴリID-M0311-036A〕")));
  await step(2, async () => {
    const row = category.row("関連カテゴリ-036");
    await expect(row, "「関連カテゴリ-036」の行").toHaveCount(1);
    const icon = row.locator('a[data-bs-target="#DeleteModal"]');
    if (await icon.evaluate((e) => e.classList.contains("disabled"))) {
      // 押せない状態の×アイコンを、利用者が押したのと同じに、その位置で押す
      note("「関連カテゴリ-036」の×アイコンは押せない状態で表示された。利用者が押したのと同じに、その位置を押した");
      await icon.click({ force: true });
    } else {
      await icon.click();
    }
    const m = page.locator("#DeleteModal");
    if (await m.waitFor({ state: "visible", timeout: 3_000 }).then(() => true, () => false)) modal = m;
    else note("×アイコンを押しても、削除の確認のポップアップが出なかった");
  });
  await step(3, async () => {
    if (!modal) { note("ポップアップが出ないので、「OK」を押せない"); return; }
    const res = page.waitForResponse((r) => r.url().includes(`/product/category/${b}/delete`));
    await confirmDeleteWithNote(category, modal);
    await noteMessages(page, `削除を確定したあと（削除の応答 ${(await res).status()}）`);
    削除を確定した = true;
  });
  await expected(async () => {
    note(`期待結果を見た時点の一覧の「関連カテゴリ-036」の行: ${await category.rowById(b).count()} 件（URL ${page.url()}）`);
    // 削除を試みずに元の一覧を見て合格にしない（HANDOFF 2章。期待結果は削除を試みた結果を見るもの）
    expect(削除を確定した, "×アイコンから削除を確定した（×アイコンが押せず、ポップアップが出ないと、削除を試みられない）").toBe(true);
    expect(await category.subTitle(), "カテゴリ一覧画面").toBe("カテゴリ一覧");
    await expect(category.rowById(b), "ID 036B の行").toHaveCount(1);
    await expect(category.row("関連カテゴリ-036"), "「関連カテゴリ-036」の行").toHaveCount(1);
  });
});

caseTest("IT-M03-11-037", async ({ page, browser, notes, step, expected }) => {
  const a = notes.get("〔カテゴリID-M0311-037A〕");
  const b = notes.get("〔カテゴリID-M0311-037B〕");
  const categoryA = await signIn(page);
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    const categoryB = await signIn(pageB);
    await step(1, async () => {
      await categoryA.openChildrenOf(a);
      await categoryB.openChildrenOf(a);
    });
    await step(2, async () => confirmDeleteWithNote(categoryA, await categoryA.openDelete("同時削除カテゴリ-037")));
    let status = 0;
    await step(3, async () => {
      const modal = await categoryB.openDelete("同時削除カテゴリ-037");
      const res = pageB.waitForResponse((r) => r.url().includes(`/product/category/${b}/delete`));
      await confirmDeleteWithNote(categoryB, modal);
      status = (await res).status();
      await noteMessages(pageB, `ブラウザBで削除したあと（削除の応答 ${status}）`);
    });
    await expected(async () => {
      for (const [name, c] of [["ブラウザA", categoryA], ["ブラウザB", categoryB]] as const) {
        expect.soft(await c.subTitle(), `${name}: カテゴリ一覧画面`).toBe("カテゴリ一覧");
        await expect.soft(c.rowById(b), `${name}: ID 037B の行`).toHaveCount(0);
        await expect.soft(c.row("同時削除カテゴリ-037"), `${name}: 「同時削除カテゴリ-037」の行`).toHaveCount(0);
      }
    });
  } finally {
    await contextB.close();
  }
});

// ---- CSV出力項目設定 ----

caseTest("IT-M03-11-039", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-039B〕")));
  await step(2, async () => {
    // ボタンのアイコンが名前に混ざるので、表示の文字で探す
    const button = page.locator("a.btn", { has: page.getByText("CSV出力項目設定", { exact: true }) });
    await expect(button, "「CSV出力項目設定」ボタン").toHaveCount(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), button.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect(await page.locator(".c-pageTitle__title").first().innerText(), "CSV出力項目設定画面").toContain("CSV出力項目設定");
    await expect(page.locator("#csv-type option:checked"), "対象のCSV").toHaveText("カテゴリCSV");
  });
});

// ---- 階層 ----

caseTest("IT-M03-11-046", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  const d = notes.get("〔カテゴリID-M0311-046D〕");
  let saved: ReturnType<typeof 名称のカテゴリ> = [];
  await step(1, () => category.openChildrenOf(d));
  await step(2, () => category.fill({ nameJp: "階層5試験カテゴリ-M0311-046", nameEn: "Level5Category-M0311-046" }));
  await step(3, () => category.submitAndWait());
  await step(4, async () => { saved = 名称のカテゴリ("階層5試験カテゴリ-M0311-046"); });
  await expected(async () => {
    expect(saved.length, "「階層5試験カテゴリ-M0311-046」は1件").toBe(1);
    expect.soft(saved[0].親カテゴリID, "親カテゴリは ID 046D").toBe(d);
    expect.soft(saved[0].階層, "階層").toBe("5");
  });
});

caseTest("IT-M03-11-047", async ({ page, notes, step, expected }) => {
  const category = await signIn(page);
  await step(1, () => category.openEdit(notes.get("〔カテゴリID-M0311-047C〕")));
  await step(2, async () => { await category.visibleTree(); });
  await expected(async () => {
    expect(await missingInTree(category, [
      [notes.get("〔カテゴリID-M0311-047A〕"), "全商品-M0311-047"],
      [notes.get("〔カテゴリID-M0311-047B〕"), "カード-M0311-047"],
      [notes.get("〔カテゴリID-M0311-047C〕"), "編集前カテゴリ-M0311-047"],
      [notes.get("〔カテゴリID-M0311-047D〕"), "サブカテゴリA-M0311-047"],
      [notes.get("〔カテゴリID-M0311-047E〕"), "サブカテゴリB-M0311-047"],
      [notes.get("〔カテゴリID-M0311-047F〕"), "サブカテゴリC-M0311-047"],
    ]), "カテゴリツリーに見えていない、編集中のカテゴリまでの階層と子カテゴリ").toEqual([]);
  });
});
