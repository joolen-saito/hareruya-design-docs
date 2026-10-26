/** M03-21 棚番登録/編集。正本: cases/M03-21_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { すべての棚番号, 名称の棚番号, 棚番号, 保存された棚番号 } from "../../db/m03_21_shelf_number";
import { expect, CaseBody, CaseCtx, caseTest } from "../../lib/case";
import { csvRecords, parseCsv } from "../../lib/csv";
import { Notes } from "../../lib/notes";
import { loginAdmin } from "../../lib/session";
import {
  pathOf, PendingDelete, ShelfCsvUploadPage, shelfCsvUploadPath, shelfDeletePath, shelfEditPath, shelfEditUrl, ShelfInput,
  ShelfNumberPage, shelfNewPath, SubmitResult, topMessages,
} from "../../pages/admin/m03_21_shelf_number";
import { M0321_ADMIN, m0321CsvPath } from "../../seeds/m03-21";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/**
 * 試験管理者でログインする（事前準備①）。list が true のケースは、正本の事前準備②（S-M03-21-LIST-STATE）の
 * 「棚番号一覧を1ページ目・10件表示に設定する」を、自分のセッションで行う（表示件数とページはセッションが覚えるため）。
 */
async function signIn(page: Page, list: boolean): Promise<ShelfNumberPage> {
  await loginAdmin(page, M0321_ADMIN);
  const shelf = new ShelfNumberPage(page);
  if (list) await shelf.showFirstPageWith("10");
  return shelf;
}

/** 登録ボタン・CSV登録の送信の結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult, what = "登録ボタン"): void {
  if (r.sent) note(`${what}を押したあとの応答: ${r.status}`);
  else note(`${what}を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残し、返す */
async function noteMessages(page: Page, when: string): Promise<{ 成功: string[]; エラー: string[] }> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  note(`${when}の画面上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}`);
  return m;
}

const path = (page: Page) => pathOf(page.url());
const shelfOf = (棚番号ID: string, 名称: string, 並び順: string): 保存された棚番号 => ({ 棚番号ID, 名称, 並び順 });
const nameAndSort = (rows: 保存された棚番号[]) => rows.map((r) => ({ 名称: r.名称, 並び順: r.並び順 }));
const NEW_HEADING = /^\s*新規追加\s*$/;
const EDIT_HEADING = /^\s*編集\s*$/;

/** 一覧の編集ボタンで、その棚番号の編集画面を開く（新規登録の状態の画面から） */
async function openEdit(shelf: ShelfNumberPage, id: string): Promise<void> {
  await shelf.openNew();
  await shelf.pressEdit(id);
}

/**
 * 共有のシードが作った棚番号が、前のケースのシード（ほかの行を削除する形）で消されずに残っていること。
 * 共有のシードはワーカーの中で1回だけ作られるので、使うケースは spec の中で続けて並べてある。崩れていれば、ケースの前提が無いので止める。
 */
async function expectSharedShelves(page: Page, want: [string, ShelfInput][]): Promise<void> {
  const shelf = new ShelfNumberPage(page);
  for (const [id, v] of want) {
    const res = await page.goto(shelfEditUrl(id));
    await shelf.ready().catch(() => undefined);
    const got = res?.status() === 200 ? await shelf.inputValues() : null;
    if (!got || got.名称 !== v.名称 || got.並び順 !== v.並び順) {
      throw new Error(`共有のシードの棚番号ID ${id}（${v.名称}・${v.並び順}）が残っていない（応答 ${res?.status()}、${JSON.stringify(got)}）。前のケースのシードがほかの行を削除した`);
    }
  }
}

const exportOrder = (notes: Notes): [string, ShelfInput][] => [
  [notes.get("〔棚番号ID-M0321-共有A〕"), { 名称: "B-100", 並び順: "10" }],
  [notes.get("〔棚番号ID-M0321-共有B〕"), { 名称: "C-200", 並び順: "20" }],
  [notes.get("〔棚番号ID-M0321-共有C〕"), { 名称: "A-300", 並び順: "30" }],
];
const dupShelf = (notes: Notes): [string, ShelfInput][] => [[notes.get("〔棚番号ID-M0321-共有D〕"), { 名称: "B-020", 並び順: "20" }]];

// ---- 表示 ----

caseTest("IT-M03-21-001", async ({ page, step, expected }) => {
  const shelf = await signIn(page, false);
  await step(1, async () => { await shelf.openNew(); });
  await expected(async () => {
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（新規登録の状態）").toHaveText(NEW_HEADING);
    expect.soft(await shelf.inputValues(), "名称と並び順").toEqual({ 名称: "", 並び順: "" });
  });
});

caseTest("IT-M03-21-002", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  const [a, b, c, d] = ["002A", "002B", "002C", "002D"].map((k) => notes.get(`〔棚番号ID-M0321-${k}〕`));
  const loaded: Record<string, ShelfInput> = {};
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.pressColumnLink(a, "ID"); loaded.ID = await shelf.inputValues(); });
  await step(3, async () => { await shelf.pressColumnLink(b, "名称"); loaded.名称 = await shelf.inputValues(); });
  await step(4, async () => { await shelf.pressColumnLink(c, "並び順"); loaded.並び順 = await shelf.inputValues(); });
  await step(5, async () => { await shelf.pressEdit(d); loaded.編集 = await shelf.inputValues(); });
  await expected(async () => {
    expect.soft(loaded.ID, `ID ${a} のIDを押したあとの名称と並び順`).toEqual({ 名称: "A-802", 並び順: "10" });
    expect.soft(loaded.名称, `ID ${b} の名称を押したあとの名称と並び順`).toEqual({ 名称: "B-802", 並び順: "20" });
    expect.soft(loaded.並び順, `ID ${c} の並び順を押したあとの名称と並び順`).toEqual({ 名称: "C-802", 並び順: "30" });
    expect.soft(loaded.編集, `ID ${d} の編集ボタンを押したあとの名称と並び順`).toEqual({ 名称: "D-802", 並び順: "40" });
  });
});

caseTest("IT-M03-21-003", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  await step(1, async () => { await openEdit(shelf, notes.get("〔棚番号ID-M0321-003〕")); });
  await step(2, async () => {
    note("正本の「新規登録」は、編集中の画面にある「新規登録へ戻る」ボタンとして押した（名称の違い）");
    await shelf.pressBackToNew();
  });
  await expected(async () => {
    expect.soft(path(page), "切り替わった画面（編集対象を指定しない画面）").toBe(shelfNewPath());
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（新規登録の状態）").toHaveText(NEW_HEADING);
    expect.soft(await shelf.inputValues(), "名称と並び順").toEqual({ 名称: "", 並び順: "" });
  });
});

caseTest("IT-M03-21-004", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  const id = notes.get("〔棚番号ID-M0321-004〕");
  let status = 0;
  await step(1, async () => { await openEdit(shelf, id); });
  await step(2, async () => {
    const url = page.url();
    expect(path(page), "表示された編集画面のURL").toBe(shelfEditPath(id));
    const to = url.replace(new RegExp(`/product/shelf_number/${id}$`), "/product/shelf_number/329004");
    const res = await page.goto(to);
    status = res?.status() ?? 0;
    note(`開いたURL: ${to}`);
  });
  await expected(async () => {
    expect(status, "棚番号ID 329004 の編集画面URLの応答").toBe(404);
  });
});

/** 一覧に表示された行（上から順） */
async function listed(shelf: ShelfNumberPage): Promise<{ ID: string; 名称: string; 並び順: string }[]> {
  const rows = await shelf.allRows();
  note(`一覧の行（上から）: ${rows.map((r) => `${r.ID}=${r.名称}・${r.並び順}`).join(" / ") || "なし"}`);
  return rows;
}

caseTest("IT-M03-21-005", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  await expectSharedShelves(page, exportOrder(notes));
  const [a, b, c] = exportOrder(notes).map(([id]) => id);
  let rows: { ID: string; 並び順: string }[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { rows = (await listed(shelf)).map((r) => ({ ID: r.ID, 並び順: r.並び順 })); });
  await expected(async () => {
    expect(rows, "一覧の上からの順（並び順10・20・30）").toEqual([{ ID: a, 並び順: "10" }, { ID: b, 並び順: "20" }, { ID: c, 並び順: "30" }]);
  });
});

// 共有のシード S-M03-21-EXPORT-ORDER を使う 005・035・036 は、ほかの行を削除するシードが間に入らないよう続けて並べる

/** CSV出力を押し、ダウンロードしたCSVの明細（見出しの列名→値）を返す */
async function downloadRecords(shelf: ShelfNumberPage): Promise<Record<string, string>[]> {
  const csv = await shelf.downloadCsv();
  note(`ダウンロードしたファイル: ${csv.fileName}`);
  return csvRecords(csv.text);
}

caseTest("IT-M03-21-035", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  await expectSharedShelves(page, exportOrder(notes));
  const want = exportOrder(notes);
  let records: Record<string, string>[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { records = await downloadRecords(shelf); });
  await step(3, async () => { note(`CSVの明細: ${records.map((r) => `${r["ID"]},${r["名称"]},${r["並び順"]}`).join(" / ")}`); });
  await expected(async () => {
    for (const [id, v] of want) {
      expect.soft(records.filter((r) => r["ID"] === id), `CSVのID ${id} の行`).toEqual([{ ID: id, 名称: v.名称, 並び順: v.並び順 }]);
    }
  });
});

caseTest("IT-M03-21-036", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  await expectSharedShelves(page, exportOrder(notes));
  const ids = exportOrder(notes).map(([id]) => id);
  let order: string[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { order = (await downloadRecords(shelf)).map((r) => r["ID"]); });
  await step(3, async () => { note(`CSVの明細のIDの順: ${order.join(" / ")}`); });
  await expected(async () => {
    expect(order, "CSVの明細の順（並び順10・20・30）").toEqual(ids);
  });
});

caseTest("IT-M03-21-006", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  const id = notes.get("〔棚番号ID-M0321-006〕");
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => {
    await expect(shelf.rowById(id), `一覧にID ${id} の行が1件`).toHaveCount(1);
    const controls = (await shelf.rowById(id).locator("a, button").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    note(`ID ${id} の行の操作部: ${controls.join("、")}`);
  });
  await expected(async () => {
    const drag = shelf.一覧.locator([
      '[draggable="true"]', ".ui-sortable", ".ui-sortable-handle", ".sortable-item", ".sortable-container",
      ".fa-bars", ".fa-arrows-alt", ".fa-arrows-v", ".fa-grip-vertical", ".fa-grip-lines",
    ].join(", "));
    await expect(drag, "一覧の行をドラッグして並べ替える操作部").toHaveCount(0);
  });
});

// ---- 登録・更新 ----

caseTest("IT-M03-21-007", async ({ page, step, expected }) => {
  const shelf = await signIn(page, false);
  let saved: 保存された棚番号[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.fill({ 名称: "Z-901", 並び順: "30" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); });
  await step(4, async () => { saved = 名称の棚番号("Z-901"); });
  await expected(async () => {
    expect(nameAndSort(saved), "名称「Z-901」の棚番号").toEqual([{ 名称: "Z-901", 並び順: "30" }]);
  });
});

caseTest("IT-M03-21-008", async ({ page, step, expected }) => {
  const shelf = await signIn(page, false);
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.fill({ 名称: "Z-901", 並び順: "30" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    const m = path(page).match(/\/product\/shelf_number\/(\d+)$/);
    expect(m, `移った画面（棚番号の編集画面。いまは ${path(page)}）`).not.toBeNull();
    const id = m![1];
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（編集）").toHaveText(EDIT_HEADING);
    expect.soft(await shelf.inputValues(), "入力欄に読み込まれた値").toEqual({ 名称: "Z-901", 並び順: "30" });
    await expect.soft(shelf.rowById(id).locator("td:nth-child(2)"), `一覧のID ${id} の行の名称（編集対象）`).toHaveText(/^\s*Z-901\s*$/);
  });
});

/** 編集ボタンで開いた編集欄に入力して登録し、DBでその棚番号を確かめる形（手順1〜4、018は1〜5） */
function editAndCheck(idLabel: string, input: Partial<ShelfInput>, want: ShelfInput, text = false): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const shelf = await signIn(page, false);
    const id = notes.get(idLabel);
    let saved: 保存された棚番号 | null = null;
    let n = 0;
    await step(++n, async () => { await openEdit(shelf, id); });
    if (text) await step(++n, async () => { await shelf.allowTextInSortOrder(); });
    await step(++n, async () => { await shelf.fill(input); });
    await step(++n, async () => {
      noteSubmit(await shelf.pressRegister());
      await noteMessages(page, "登録ボタンを押したあと");
      const errors = (await shelf.form.locator(".invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
      if (errors.length) note(`入力欄の下のエラー: ${errors.join(" / ")}`);
    });
    await step(++n, async () => { saved = 棚番号(id); });
    await expected(async () => {
      expect(saved, `ID ${id} の棚番号`).toEqual(shelfOf(id, want.名称, want.並び順));
    });
  };
}

caseTest("IT-M03-21-009", editAndCheck("〔棚番号ID-M0321-009〕", { 名称: "Y-902", 並び順: "15" }, { 名称: "Y-902", 並び順: "15" }));

caseTest("IT-M03-21-010", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  const id = notes.get("〔棚番号ID-M0321-010〕");
  await step(1, async () => { await openEdit(shelf, id); });
  await step(2, async () => { await shelf.fill({ 名称: "Y-902", 並び順: "15" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect.soft(path(page), "移った画面").toBe(shelfEditPath(id));
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（編集）").toHaveText(EDIT_HEADING);
    expect.soft(await shelf.inputValues(), "入力欄に読み込まれた値").toEqual({ 名称: "Y-902", 並び順: "15" });
  });
});

caseTest("IT-M03-21-011", editAndCheck("〔棚番号ID-M0321-011〕", { 名称: "", 並び順: "" }, { 名称: "A-811", 並び順: "10" }));

caseTest("IT-M03-21-012", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  const id = notes.get("〔棚番号ID-M0321-012〕");
  let r!: SubmitResult;
  await step(1, async () => { await openEdit(shelf, id); });
  await step(2, async () => { await shelf.fill({ 名称: "", 並び順: "" }); });
  await step(3, async () => {
    r = await shelf.pressRegister();
    noteSubmit(r);
    if (r.sent) await noteMessages(page, "登録ボタンを押したあと");
  });
  await expected(async () => {
    // 設計書（登録・更新の判定順序の1）は、入力の検証に通らないとき、登録できなかった旨を表示して一覧を伴う同じ画面を返すと定める。
    // ブラウザの入力チェックが送信を止めたときは、画面は返されておらず、ボタンを押す前の画面が残っているだけなので合格にしない。
    expect(r.sent ? "登録の要求が送られ、画面が返された" : "ブラウザの入力チェックで送信が止まり、登録の要求が送られていない", "登録ボタンを押したあとの棚番号登録/編集画面")
      .toBe("登録の要求が送られ、画面が返された");
    note(`登録ボタンを押したあとの画面のURL: ${path(page)}`);
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（編集）").toHaveText(EDIT_HEADING);
    expect.soft(await shelf.form.getAttribute("action"), "入力欄の送り先（編集対象）").toMatch(new RegExp(`/product/shelf_number/store/${id}$`));
    await expect.soft(shelf.rowById(id), `一覧のID ${id} の行（棚番号一覧を伴う）`).toHaveCount(1);
  });
});

caseTest("IT-M03-21-013", editAndCheck("〔棚番号ID-M0321-013〕", { 名称: "x-099" }, { 名称: "A-813", 並び順: "10" }));
caseTest("IT-M03-21-014", editAndCheck("〔棚番号ID-M0321-014〕", { 並び順: "0" }, { 名称: "A-814", 並び順: "0" }));
caseTest("IT-M03-21-015", editAndCheck("〔棚番号ID-M0321-015〕", { 並び順: "32767" }, { 名称: "A-815", 並び順: "32767" }));
caseTest("IT-M03-21-016", editAndCheck("〔棚番号ID-M0321-016〕", { 並び順: "-1" }, { 名称: "A-816", 並び順: "10" }));
caseTest("IT-M03-21-017", editAndCheck("〔棚番号ID-M0321-017〕", { 並び順: "32768" }, { 名称: "A-817", 並び順: "10" }));
caseTest("IT-M03-21-018", editAndCheck("〔棚番号ID-M0321-018〕", { 並び順: "abc" }, { 名称: "A-818", 並び順: "10" }, true));

caseTest("IT-M03-21-019", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  await expectSharedShelves(page, dupShelf(notes));
  const dup = notes.get("〔棚番号ID-M0321-共有D〕");
  let ids: string[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.fill({ 名称: "B-020", 並び順: "99" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { ids = 名称の棚番号("B-020").map((r) => r.棚番号ID); });
  await expected(async () => {
    expect(ids, "名称「B-020」の棚番号").toEqual([dup]);
  });
});

caseTest("IT-M03-21-020", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  await expectSharedShelves(page, dupShelf(notes));
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.fill({ 名称: "B-020", 並び順: "99" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect.soft(path(page), "移った画面（編集対象を指定しない棚番号一覧）").toBe(shelfNewPath());
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（編集対象を指定しない）").toHaveText(NEW_HEADING);
  });
});

caseTest("IT-M03-21-021", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  await expectSharedShelves(page, dupShelf(notes));
  const id = notes.get("〔棚番号ID-M0321-021〕");
  const dup = notes.get("〔棚番号ID-M0321-共有D〕");
  let names: (string | undefined)[] = [];
  await step(1, async () => { await openEdit(shelf, id); });
  await step(2, async () => { await shelf.fill({ 名称: "B-020" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await step(4, async () => { names = [棚番号(id)?.名称, 棚番号(dup)?.名称]; });
  await expected(async () => {
    expect(names, `ID ${id} と ID ${dup} の名称`).toEqual(["A-821", "B-020"]);
  });
});

caseTest("IT-M03-21-022", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, false);
  await expectSharedShelves(page, dupShelf(notes));
  await step(1, async () => { await openEdit(shelf, notes.get("〔棚番号ID-M0321-022〕")); });
  await step(2, async () => { await shelf.fill({ 名称: "B-020" }); });
  await step(3, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "登録ボタンを押したあと"); });
  await expected(async () => {
    expect.soft(path(page), "移った画面（編集対象を指定しない棚番号一覧）").toBe(shelfNewPath());
    await expect.soft(shelf.入力欄の見出し, "入力欄の見出し（編集対象を指定しない）").toHaveText(NEW_HEADING);
  });
});

caseTest("IT-M03-21-072", async ({ page, step, expected }) => {
  const shelf = await signIn(page, false);
  let firstId = "";
  let saved: 保存された棚番号[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.fill({ 名称: "Z-872", 並び順: "10" }); });
  await step(3, async () => {
    const r = await shelf.pressRegister();
    noteSubmit(r);
    expect(r.sent, "1回目の登録の要求が送られた").toBe(true);
    await expect(page.locator(".alert-success"), "1回目の登録の完了の表示").toContainText("登録が完了しました。");
    const m = path(page).match(/\/product\/shelf_number\/(\d+)$/);
    expect(m, `1回目の登録のあとの画面（棚番号の編集画面。いまは ${path(page)}）`).not.toBeNull();
    firstId = m![1];
  });
  await step(4, async () => { await shelf.pressBackToNew(); });
  await step(5, async () => { await shelf.fill({ 名称: "Z-872", 並び順: "20" }); });
  await step(6, async () => { noteSubmit(await shelf.pressRegister()); await noteMessages(page, "2回目の登録ボタンを押したあと"); });
  await step(7, async () => { saved = 名称の棚番号("Z-872"); });
  await expected(async () => {
    expect(saved, "名称「Z-872」の棚番号（1回目に登録した並び順10の1件だけ）").toEqual([shelfOf(firstId, "Z-872", "10")]);
  });
});

// ---- 削除 ----

/** 削除の要求から、なりすまし対策トークンを除く（開発者ツールで要求を書き換えるのと同じ） */
async function stripDeleteToken(page: Page, id: string): Promise<void> {
  await page.route(`**${shelfDeletePath(id)}`, async (route) => {
    const form = new URLSearchParams(route.request().postData() ?? "");
    if (!form.has("_token")) throw new Error("削除の要求に、なりすまし対策トークンが無い");
    form.delete("_token");
    await route.continue({ postData: form.toString() });
  });
}

/** 削除ボタンを押して確認ダイアログで承認し、確認の文と応答を注記に残す。応答の状態を返す */
async function deleteConfirmed(shelf: ShelfNumberPage, id: string): Promise<number> {
  const { dialog, response } = await shelf.pressDelete(shelf.rowById(id), true);
  const status = response?.status() ?? 0;
  note(`確認ダイアログ「${dialog}」で承認した。削除の要求の応答: ${status}`);
  return status;
}

caseTest("IT-M03-21-023", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  const id = notes.get("〔棚番号ID-M0321-023〕");
  let left: 保存された棚番号 | null = null;
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await stripDeleteToken(page, id); });
  await step(3, async () => { await deleteConfirmed(shelf, id); });
  await step(4, async () => { left = 棚番号(id); });
  await expected(async () => {
    expect(left, `ID ${id} の棚番号（削除されない）`).toEqual(shelfOf(id, "V-823", "200"));
  });
});

caseTest("IT-M03-21-024", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  const id = notes.get("〔棚番号ID-M0321-024〕");
  let left: 保存された棚番号 | null = null;
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.replaceDeleteToken(shelf.rowById(id), "invalid-token"); });
  await step(3, async () => { await deleteConfirmed(shelf, id); });
  await step(4, async () => { left = 棚番号(id); });
  await expected(async () => {
    expect(left, `ID ${id} の棚番号（削除されない）`).toEqual(shelfOf(id, "V-824", "200"));
  });
});

caseTest("IT-M03-21-025", async ({ page, notes, step, expected }) => {
  const shelf = await signIn(page, true);
  const id = notes.get("〔棚番号ID-M0321-025〕");
  let status = 0;
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.retargetDelete(shelf.rowById(id), "329025"); });
  await step(3, async () => { status = await deleteConfirmed(shelf, id); });
  await expected(async () => {
    expect(status, "棚番号ID 329025 の削除の要求の応答").toBe(404);
  });
});

/**
 * 削除ボタンを押し（手順2）、確認ダイアログで確定またはキャンセルする（手順3）。手順1は棚番号登録/編集画面を開く。
 * 確定したときは削除の要求の応答を、キャンセルしたときは、キャンセルの前後で画面が移ったかを注記に残す。
 */
async function deleteByDialog(ctx: CaseCtx, idLabel: string, accept: boolean): Promise<{ shelf: ShelfNumberPage; before: string }> {
  const { page, notes, step } = ctx;
  const shelf = await signIn(page, true);
  const id = notes.get(idLabel);
  let before = "";
  let pending!: PendingDelete;
  await step(1, async () => { await shelf.openNew(); before = page.url(); });
  await step(2, async () => { pending = await shelf.pressDeleteButton(shelf.rowById(id)); note(`確認ダイアログの文: ${pending.message}`); });
  await step(3, async () => {
    if (accept) {
      const res = await shelf.answerDelete(pending, true);
      note(`確認ダイアログで確定した。削除の要求の応答: ${res?.status() ?? "不明"}`);
      await shelf.ready();
      await noteMessages(page, "削除のあと");
      return;
    }
    const navigated = page.waitForEvent("framenavigated", { predicate: (f) => f === page.mainFrame(), timeout: 3_000 }).then(() => true, () => false);
    await shelf.answerDelete(pending, false);
    note(`確認ダイアログでキャンセルした。${(await navigated) ? "キャンセルのあと、画面が移った" : "キャンセルのあと、画面は移らなかった"}`);
  });
  return { shelf, before };
}

caseTest("IT-M03-21-026", async (ctx) => {
  const id = ctx.notes.get("〔棚番号ID-M0321-026〕");
  note(`商品規格ID ${ctx.notes.get("〔商品規格ID-M0321-026〕")} が、この棚番号を使っている（シード）`);
  await deleteByDialog(ctx, "〔棚番号ID-M0321-026〕", true);
  let left: 保存された棚番号 | null = null;
  await ctx.step(4, async () => { left = 棚番号(id); });
  await ctx.expected(async () => {
    expect(left, `ID ${id} の棚番号（商品規格で使用中のため削除されない）`).toEqual(shelfOf(id, "U-826", "100"));
  });
});

caseTest("IT-M03-21-027", async (ctx) => {
  const id = ctx.notes.get("〔棚番号ID-M0321-027〕");
  note(`商品規格ID ${ctx.notes.get("〔商品規格ID-M0321-027〕")} が、この棚番号を使っている（シード）`);
  const { shelf } = await deleteByDialog(ctx, "〔棚番号ID-M0321-027〕", true);
  await ctx.expected(async () => {
    expect.soft(path(ctx.page), "削除のあとに移った画面（棚番号一覧）").toBe(shelfNewPath());
    await expect.soft(shelf.rowById(id), `一覧のID ${id} の行`).toHaveCount(1);
  });
});

caseTest("IT-M03-21-028", async (ctx) => {
  const id = ctx.notes.get("〔棚番号ID-M0321-028〕");
  await deleteByDialog(ctx, "〔棚番号ID-M0321-028〕", true);
  let left: 保存された棚番号 | null = shelfOf(id, "", "");
  await ctx.step(4, async () => { left = 棚番号(id); });
  await ctx.expected(async () => {
    expect(left, `ID ${id} の棚番号（DBから削除される）`).toBeNull();
  });
});

caseTest("IT-M03-21-029", async (ctx) => {
  const id = ctx.notes.get("〔棚番号ID-M0321-029〕");
  const { shelf } = await deleteByDialog(ctx, "〔棚番号ID-M0321-029〕", true);
  await ctx.expected(async () => {
    expect.soft(path(ctx.page), "削除のあとに移った画面（棚番号一覧）").toBe(shelfNewPath());
    await expect.soft(shelf.rowById(id), `一覧のID ${id} の行`).toHaveCount(0);
  });
});

caseTest("IT-M03-21-030", async (ctx) => {
  const id = ctx.notes.get("〔棚番号ID-M0321-030〕");
  await deleteByDialog(ctx, "〔棚番号ID-M0321-030〕", false);
  let left: 保存された棚番号 | null = null;
  await ctx.step(4, async () => { left = 棚番号(id); });
  await ctx.expected(async () => {
    expect(left, `ID ${id} の棚番号（DBに残る）`).toEqual(shelfOf(id, "V-830", "200"));
  });
});

caseTest("IT-M03-21-031", async (ctx) => {
  const id = ctx.notes.get("〔棚番号ID-M0321-031〕");
  const { shelf, before } = await deleteByDialog(ctx, "〔棚番号ID-M0321-031〕", false);
  await ctx.expected(async () => {
    expect.soft(ctx.page.url(), "キャンセルのあとの画面のURL（変わらない）").toBe(before);
    await expect.soft(shelf.名称, "棚番号登録/編集画面の名称の欄").toBeVisible();
    await expect.soft(shelf.rowById(id), `一覧のID ${id} の行`).toHaveCount(1);
  });
});

// ---- CSV出力・CSV入力の画面 ----

caseTest("IT-M03-21-032", async ({ page, step, expected }) => {
  const shelf = await signIn(page, true);
  let fileName = "";
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { ({ fileName } = await shelf.downloadCsv()); });
  await step(3, async () => { note(`ダウンロードしたファイルの名前: ${fileName}`); });
  await expected(async () => {
    const m = fileName.match(/^shelf_number_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.csv$/);
    expect(m, "ファイルの名前（shelf_number_ ＋ 年月日時分秒14桁 ＋ .csv）").not.toBeNull();
    const [y, mo, d, h, mi, s] = m!.slice(1).map(Number);
    const t = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
    const valid = t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
      && t.getUTCHours() === h && t.getUTCMinutes() === mi && t.getUTCSeconds() === s;
    expect(valid, `ファイルの名前の14桁 ${m!.slice(1).join("")} が、実在する年月日時分秒`).toBe(true);
  });
});

caseTest("IT-M03-21-033", async ({ page, step, expected }) => {
  const shelf = await signIn(page, true);
  let text = "";
  let header: string[] = [];
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { ({ text } = await shelf.downloadCsv()); });
  await step(3, async () => { header = parseCsv(text)[0] ?? []; note(`見出し行: ${header.join(",")}`); });
  await expected(async () => {
    expect(header, "CSVの見出し").toEqual(["ID", "名称", "並び順"]);
  });
});

caseTest("IT-M03-21-034", async ({ page, step, expected }) => {
  const shelf = await signIn(page, false);
  let bytes: Buffer = Buffer.alloc(0);
  await step(1, async () => { await shelf.openNew(); ({ bytes } = await shelf.downloadCsv()); });
  await step(2, async () => { note(`ファイルの先頭16バイト: ${bytes.subarray(0, 16).toString("hex").replace(/(..)/g, "$1 ").trim()}`); });
  await expected(async () => {
    expect([...bytes.subarray(0, 3)], "ファイルの先頭3バイト").toEqual([0xef, 0xbb, 0xbf]);
    const firstLine = new TextDecoder("utf-8").decode(bytes.subarray(3)).split(/\r?\n/)[0];
    expect(firstLine, "先頭3バイトの直後から始まる行（見出し行）").toBe("ID,名称,並び順");
  });
});

caseTest("IT-M03-21-037", async ({ page, step, expected }) => {
  const shelf = await signIn(page, false);
  const upload = new ShelfCsvUploadPage(page);
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => {
    await expect(shelf.CSV入力, "CSV入力ボタン").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), shelf.CSV入力.click()]);
  });
  await expected(async () => {
    expect.soft(path(page), "移った画面").toBe(shelfCsvUploadPath());
    await expect.soft(upload.見出し, "移った画面の見出し").toHaveText(/^\s*棚番号登録CSVアップロード\s*$/);
  });
});

caseTest("IT-M03-21-057", async ({ page, step, expected }) => {
  const shelf = await signIn(page, true);
  await step(1, async () => { await shelf.openNew(); });
  await step(2, async () => { await shelf.chooseCount("10"); });
  await step(3, async () => { await shelf.choosePage(2); });
  await expected(async () => {
    expect.soft(path(page), "棚番号一覧の2ページ目の画面").toBe(`${shelfNewPath()}/page/2`);
    expect.soft(await shelf.currentPage(), "ページングのいまのページ").toBe("2");
  });
});

// ---- 名称の形式（編集画面） ----

caseTest("IT-M03-21-060", editAndCheck("〔棚番号ID-M0321-060〕", { 名称: "T-60" }, { 名称: "A-860", 並び順: "10" }));
caseTest("IT-M03-21-061", editAndCheck("〔棚番号ID-M0321-061〕", { 名称: "T-1061" }, { 名称: "A-861", 並び順: "10" }));
caseTest("IT-M03-21-062", editAndCheck("〔棚番号ID-M0321-062〕", { 名称: "T062" }, { 名称: "A-862", 並び順: "10" }));

// ---- CSV取込 ----

/** CSV入力ボタンから棚番号登録CSVアップロード画面を開き（手順1）、取込ファイルを指定して（手順2）、CSV登録を送信する（手順3） */
async function importFromCsvButton(ctx: CaseCtx, file: string | null): Promise<SubmitResult> {
  const { page, step } = ctx;
  const shelf = await signIn(page, false);
  let upload!: ShelfCsvUploadPage;
  let r!: SubmitResult;
  await step(1, async () => { await shelf.openNew(); upload = await shelf.pressCsvInput(); });
  await step(2, async () => {
    if (file) await upload.choose(m0321CsvPath(file));
    const chosen = await upload.取込ファイル.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0);
    expect(chosen, "取込ファイルに指定したファイルの数").toBe(file ? 1 : 0);
  });
  await step(3, async () => { r = await upload.submit(); noteSubmit(r, "CSV登録の送信"); await noteMessages(page, "CSV登録を送信したあと"); });
  return r;
}

/** CSV入力ボタンから開いた棚番号登録CSVアップロード画面でCSV登録を送信し、エラーが表示された同じ画面へ戻ること（038・039） */
function uploadRejected(file: string): CaseBody {
  return async (ctx) => {
    const r = await importFromCsvButton(ctx, file);
    await ctx.expected(async () => {
      const upload = new ShelfCsvUploadPage(ctx.page);
      expect.soft(r.sent, "CSV登録の要求が送られた").toBe(true);
      expect.soft(path(ctx.page), "戻った画面").toBe(shelfCsvUploadPath());
      await expect.soft(upload.見出し, "戻った画面の見出し").toHaveText(/^\s*棚番号登録CSVアップロード\s*$/);
      expect.soft((await topMessages(ctx.page)).エラー.length, "画面上部のエラーの表示").toBeGreaterThan(0);
    });
  };
}

caseTest("IT-M03-21-038", uploadRejected("m03-21-bad-header-038.csv"));
caseTest("IT-M03-21-039", uploadRejected("m03-21-no-data-039.csv"));

caseTest("IT-M03-21-064", async (ctx) => {
  const r = await importFromCsvButton(ctx, null);
  await ctx.expected(async () => {
    const upload = new ShelfCsvUploadPage(ctx.page);
    expect.soft(r.sent, "CSV登録の要求が送られた").toBe(true);
    expect.soft(path(ctx.page), "戻った画面").toBe(shelfCsvUploadPath());
    await expect.soft(upload.見出し, "戻った画面の見出し").toHaveText(/^\s*棚番号登録CSVアップロード\s*$/);
    const errors = (await topMessages(ctx.page)).エラー;
    expect.soft(errors.some((t) => t.includes("CSVのフォーマットが一致しません")), `画面上部の「CSVのフォーマットが一致しません」の表示（表示: ${errors.join(" / ") || "なし"}）`).toBe(true);
  });
});

/** 棚番号登録CSVアップロード画面を開き（手順1）、取込ファイルを指定して（手順2）、CSV登録を送信する（手順3） */
async function importCsv(ctx: CaseCtx, file: string): Promise<SubmitResult> {
  const { page, step } = ctx;
  await loginAdmin(page, M0321_ADMIN);
  const upload = new ShelfCsvUploadPage(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(m0321CsvPath(file)); });
  await step(3, async () => { r = await upload.submit(); noteSubmit(r, "CSV登録の送信"); await noteMessages(page, "CSV登録を送信したあと"); });
  return r;
}

/** 取込のあと、棚番号がシードで登録した2件（並び順40・50）のまま、追加も更新もされていないこと */
function unchangedAfterImport(n: string, file: string, a: string, b: string): CaseBody {
  return async (ctx) => {
    const { notes, step, expected } = ctx;
    const [idA, idB] = [notes.get(`〔棚番号ID-M0321-${n}A〕`), notes.get(`〔棚番号ID-M0321-${n}B〕`)];
    await importCsv(ctx, file);
    let rows: 保存された棚番号[] = [];
    await step(4, async () => { rows = すべての棚番号(); });
    await expected(async () => {
      expect(rows, "すべての棚番号（シードで登録した2件のまま）").toEqual([shelfOf(idA, a, "40"), shelfOf(idB, b, "50")]);
    });
  };
}

caseTest("IT-M03-21-040", unchangedAfterImport("040", "m03-21-column-count-040.csv", "C-840", "D-840"));
caseTest("IT-M03-21-041", unchangedAfterImport("041", "m03-21-required-empty-041.csv", "C-841", "D-841"));
caseTest("IT-M03-21-042", unchangedAfterImport("042", "m03-21-bad-name-042.csv", "C-842", "D-842"));
caseTest("IT-M03-21-043", unchangedAfterImport("043", "m03-21-missing-id-043.csv", "C-843", "D-843"));
caseTest("IT-M03-21-052", unchangedAfterImport("052", "m03-21-sort-under-052.csv", "C-852", "D-852"));
caseTest("IT-M03-21-053", unchangedAfterImport("053", "m03-21-sort-over-053.csv", "C-853", "D-853"));
caseTest("IT-M03-21-054", unchangedAfterImport("054", "m03-21-sort-type-054.csv", "C-854", "D-854"));
caseTest("IT-M03-21-055", unchangedAfterImport("055", "m03-21-id-type-055.csv", "C-855", "D-855"));
caseTest("IT-M03-21-065", unchangedAfterImport("065", "m03-21-name-empty-065.csv", "C-865", "D-865"));
caseTest("IT-M03-21-066", unchangedAfterImport("066", "m03-21-sort-empty-066.csv", "C-866", "D-866"));
caseTest("IT-M03-21-067", unchangedAfterImport("067", "m03-21-name-2digit-067.csv", "C-867", "D-867"));
caseTest("IT-M03-21-068", unchangedAfterImport("068", "m03-21-name-4digit-068.csv", "C-868", "D-868"));
caseTest("IT-M03-21-069", unchangedAfterImport("069", "m03-21-name-nohyphen-069.csv", "C-869", "D-869"));

caseTest("IT-M03-21-044", async (ctx) => {
  const idB = ctx.notes.get("〔棚番号ID-M0321-044B〕");
  await importCsv(ctx, "m03-21-duplicate-044.csv");
  let ids: string[] = [];
  await ctx.step(4, async () => { ids = 名称の棚番号("D-844").map((r) => r.棚番号ID); });
  await ctx.expected(async () => {
    expect(ids, "名称「D-844」の棚番号").toEqual([idB]);
  });
});

caseTest("IT-M03-21-045", async (ctx) => {
  const r = await importCsv(ctx, "m03-21-row-error-045.csv");
  await ctx.expected(async () => {
    expect.soft(r.sent, "CSV登録の要求が送られた").toBe(true);
    const errors = (await topMessages(ctx.page)).エラー;
    note("正本の「2件目の明細行」は、見出しを1行目と数えたファイルの3行目と解釈した（取込のエラーは「n 行目のデータを確認してください」の形でファイルの行を数える）");
    expect.soft(errors.some((t) => /(^|\D)3\s*行目/.test(t) && t.includes("名称")), `名称形式が不正な2件目の明細行（3行目）を示すエラー（表示: ${errors.join(" / ") || "なし"}）`).toBe(true);
  });
});

caseTest("IT-M03-21-046", async (ctx) => {
  const idA = ctx.notes.get("〔棚番号ID-M0321-046A〕");
  await importCsv(ctx, "m03-21-atomic-046.csv");
  let a: 保存された棚番号 | null = null;
  let added: 保存された棚番号[] = [];
  await ctx.step(4, async () => { a = 棚番号(idA); added = 名称の棚番号("N-112"); });
  await ctx.expected(async () => {
    expect.soft(a, `ID ${idA} の棚番号（名称C-400・並び順40のまま）`).toEqual(shelfOf(idA, "C-400", "40"));
    expect.soft(added, "名称「N-112」の棚番号（追加されない）").toEqual([]);
  });
});

/** 取込のあと、名称の棚番号が1件、指定の並び順で追加されていること */
function addedAfterImport(file: string, 名称: string, 並び順: string): CaseBody {
  return async (ctx) => {
    const { step, expected } = ctx;
    await importCsv(ctx, file);
    let rows: 保存された棚番号[] = [];
    await step(4, async () => { rows = 名称の棚番号(名称); });
    await expected(async () => {
      expect(nameAndSort(rows), `名称「${名称}」の棚番号`).toEqual([{ 名称, 並び順 }]);
    });
  };
}

caseTest("IT-M03-21-047", addedAfterImport("m03-21-new-empty-id-047.csv", "E-101", "101"));
caseTest("IT-M03-21-048", addedAfterImport("m03-21-new-zero-id-048.csv", "F-102", "102"));
caseTest("IT-M03-21-050", addedAfterImport("m03-21-sort-low-050.csv", "O-114", "0"));
caseTest("IT-M03-21-051", addedAfterImport("m03-21-sort-high-051.csv", "P-115", "32767"));

caseTest("IT-M03-21-049", async (ctx) => {
  const idA = ctx.notes.get("〔棚番号ID-M0321-049A〕");
  await importCsv(ctx, "m03-21-update-049.csv");
  let a: 保存された棚番号 | null = null;
  await ctx.step(4, async () => { a = 棚番号(idA); });
  await ctx.expected(async () => {
    expect(a, `ID ${idA} の棚番号`).toEqual(shelfOf(idA, "G-401", "41"));
  });
});

caseTest("IT-M03-21-056", async (ctx) => {
  const r = await importCsv(ctx, "m03-21-new-empty-id-056.csv");
  await ctx.expected(async () => {
    const upload = new ShelfCsvUploadPage(ctx.page);
    expect.soft(r.sent, "CSV登録の要求が送られた").toBe(true);
    expect.soft(path(ctx.page), "戻った画面").toBe(shelfCsvUploadPath());
    await expect.soft(upload.見出し, "戻った画面の見出し").toHaveText(/^\s*棚番号登録CSVアップロード\s*$/);
  });
});

caseTest("IT-M03-21-070", async (ctx) => {
  await importCsv(ctx, "m03-21-bulk-new-070.csv");
  let rows: 保存された棚番号[] = [];
  await ctx.step(4, async () => { rows = すべての棚番号(); });
  await ctx.expected(async () => {
    const got = nameAndSort(rows).sort((x, y) => x.名称.localeCompare(y.名称));
    expect(got, "すべての棚番号（計3件）").toEqual([
      { 名称: "E-870", 並び順: "101" }, { 名称: "F-870", 並び順: "102" }, { 名称: "G-870", 並び順: "103" },
    ]);
  });
});

caseTest("IT-M03-21-071", async (ctx) => {
  const idA = ctx.notes.get("〔棚番号ID-M0321-071A〕");
  await importCsv(ctx, "m03-21-mixed-071.csv");
  let a: 保存された棚番号 | null = null;
  let added: 保存された棚番号[] = [];
  await ctx.step(4, async () => { a = 棚番号(idA); added = 名称の棚番号("H-871"); });
  await ctx.expected(async () => {
    expect.soft(a, `ID ${idA} の棚番号`).toEqual(shelfOf(idA, "G-871", "41"));
    expect.soft(nameAndSort(added), "名称「H-871」の棚番号").toEqual([{ 名称: "H-871", 並び順: "102" }]);
  });
});

caseTest("IT-M03-21-073", async ({ page, step, expected }) => {
  await loginAdmin(page, M0321_ADMIN);
  const upload = new ShelfCsvUploadPage(page);
  const file = m0321CsvPath("m03-21-again-073.csv");
  let first: 保存された棚番号[] = [];
  let second!: SubmitResult;
  let errors: string[] = [];
  let rows: 保存された棚番号[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(file); });
  await step(3, async () => {
    const r = await upload.submit();
    noteSubmit(r, "1回目のCSV登録の送信");
    expect(r.sent, "1回目のCSV登録の要求が送られた").toBe(true);
    await expect(page.locator(".alert-success"), "1回目のCSV登録の完了の表示").toContainText("登録が完了しました。");
    first = 名称の棚番号("J-873");
    note(`1回目の取込のあとの名称「J-873」の棚番号: ${JSON.stringify(first)}`);
  });
  await step(4, async () => { await upload.ready(); await upload.choose(file); });
  await step(5, async () => {
    second = await upload.submit();
    noteSubmit(second, "2回目のCSV登録の送信");
    errors = (await noteMessages(page, "2回目のCSV登録を送信したあと")).エラー;
  });
  await step(6, async () => { rows = 名称の棚番号("J-873"); });
  await expected(async () => {
    expect.soft(second.sent, "2回目のCSV登録の要求が送られた").toBe(true);
    expect.soft(errors.some((t) => /名称/.test(t) && /(すでに登録|既に登録|重複)/.test(t)), `2回目の取込が名称重複で中止されたことを示すエラー（表示: ${errors.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(nameAndSort(first), "1回目に追加した名称「J-873」の棚番号").toEqual([{ 名称: "J-873", 並び順: "103" }]);
    expect.soft(rows, "名称「J-873」の棚番号（1回目に追加した1件のまま）").toEqual(first);
  });
});
