/** M03-18 部門登録/編集。正本: cases/M03-18_test_cases.tsv */
import { expect, Page, test } from "@playwright/test";
import { 保存された部門, 部門, 部門コードが前方一致する部門, 部門コードの部門, 部門名の部門 } from "../../db/m03_18_department";
import { CaseCtx, caseTest } from "../../lib/case";
import { csvRecords, parseCsv } from "../../lib/csv";
import { Account, loginAdmin } from "../../lib/session";
import { tamperToken } from "../../pages/admin/devtools";
import { BuySummarySearchPage } from "../../pages/admin/m03_18_buy_summary";
import {
  DepartmentCsvUploadPage, DepartmentFormValues, DepartmentInput, DepartmentPage, DepartmentRow, SubmitResult,
  departmentCsvUploadPath, departmentEditPath, departmentEditUrl, departmentNewPath, departmentStorePath, 行数確認ファイル,
} from "../../pages/admin/m03_18_department";
import { M0318_ADMIN, M0318L_ADMIN } from "../../seeds/m03-18";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 正本の事前準備①「商品管理を操作できる管理者m0318_adminでログインしている」 */
async function signIn(page: Page, account: Account = M0318_ADMIN): Promise<DepartmentPage> {
  await loginAdmin(page, account);
  return new DepartmentPage(page);
}

/** 登録・編集ボタンの結果を注記に残す（ブラウザの入力チェックで止まったとき・応答の状態） */
function noteSubmit(r: SubmitResult): void {
  if (r.sent) note(`登録・編集ボタンを押したあとの応答: ${r.status}`);
  else note(`登録・編集ボタンを押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残す */
async function noteMessages(page: Page, when: string): Promise<void> {
  const texts = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  note(`${when}の画面上部のメッセージ: ${texts.length ? texts.join(" / ") : "なし"}`);
}

/** 入力欄の直下のエラーを注記に残す */
async function noteFieldErrors(s: DepartmentPage, when: string): Promise<void> {
  const e = await s.fieldErrors();
  const all = [...e.部門名.map((t) => `部門名: ${t}`), ...e.部門コード.map((t) => `部門コード: ${t}`), ...e.免税区分.map((t) => `免税区分: ${t}`)];
  note(`${when}の入力欄の直下のエラー: ${all.length ? all.join(" / ") : "なし"}`);
}

/** 免税区分を未選択にする手順。選択肢に未選択が無ければ、選択欄を変えずに注記を残す */
async function unselectTaxFree(s: DepartmentPage): Promise<void> {
  if (await s.unselectTaxFree()) return;
  const labels = (await s.taxFreeChoices()).map((c) => c.label).join("・");
  note(`免税区分の選択欄に未選択の選択肢が無く（選択肢は ${labels}）、利用者の操作では未選択にできない。選択欄は「${(await s.inputValues()).免税区分}」のまま進めた`);
}

const path = (page: Page) => new URL(page.url()).pathname;
const form = (部門名: string, 部門コード: string, 免税区分: string, MTGBuyer表示フラグ: boolean): DepartmentFormValues => ({ 部門名, 部門コード, 免税区分, MTGBuyer表示フラグ });

/** 部門登録/編集画面を開き、一覧の行の編集ボタンでその部門の編集モードを開く */
async function openEdit(s: DepartmentPage, id: string): Promise<void> {
  await s.openNew();
  await s.pressEdit(id);
}

/** 編集モードであること（その部門の編集画面・入力欄の見出し「編集」・ボタン名「編集」） */
async function expectEditMode(s: DepartmentPage, id: string, what: string): Promise<void> {
  expect.soft(path(s.page), `${what}の画面`).toBe(departmentEditPath(id));
  await expect.soft(s.入力欄の見出し, `${what}の入力欄の見出し（編集モード）`).toHaveText(/^\s*編集\s*$/);
  await expect.soft(s.登録ボタン, `${what}の画面下部のボタン名（編集モード）`).toHaveText(/^\s*編集\s*$/);
}

// ---- 表示 ----

caseTest("IT-M03-18-002", async ({ page, notes, step, expected }) => {
  const s = await signIn(page);
  const id = notes.get("〔部門ID-M0318-002〕");
  let row: DepartmentRow | null = null;
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => {
    await expect(s.rowById(id), `一覧にID ${id} の行が1件`).toHaveCount(1);
    row = await s.readRow(s.rowById(id));
  });
  await expected(async () => {
    expect(row, `ID ${id} の一覧行の ID・部門名・部門コード・免税区分・MTGBuyer表示フラグ`)
      .toEqual({ ID: id, 部門名: "編集前部門-002", 部門コード: "61", 免税区分: "対象外", MTGBuyer表示フラグ: "表示する" });
  });
});

caseTest("IT-M03-18-003", async ({ page, notes, step, expected }) => {
  const s = await signIn(page);
  const id = notes.get("〔部門ID-M0318-003〕");
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => { await s.pressEdit(id); });
  await expected(async () => {
    await expectEditMode(s, id, "編集ボタンで開いた");
    expect.soft(await s.inputValues(), "入力欄に設定された値").toEqual(form("編集前部門-003", "62", "対象外", true));
  });
});

caseTest("IT-M03-18-004", async ({ page, notes, step, expected }) => {
  const s = await signIn(page);
  const id = notes.get("〔部門ID-M0318-004〕");
  const loaded: Record<string, { path: string; 見出し: string; values: DepartmentFormValues } | undefined> = {};
  const read = async (列: string) => {
    loaded[列] = { path: path(page), 見出し: ((await s.入力欄の見出し.textContent()) ?? "").trim(), values: await s.inputValues() };
  };
  /** 一覧の列のリンクを押す。リンクが無いときは押せないことを注記し、その導線は開けなかったものとして扱う */
  const pressColumn = async (列: "ID" | "部門名" | "部門コード") => {
    if ((await s.columnLink(id, 列).count()) === 0) {
      note(`一覧のID ${id} の行の${列}の列はリンクになっておらず、押しても編集モードへ移らない（手順を画面で実行できない）`);
      loaded[列] = undefined;
      return;
    }
    await s.pressColumnLink(id, 列);
    await read(列);
  };
  const backToScreen = async () => {
    note("「部門登録/編集画面へ戻る」は、部門登録/編集画面（編集対象を指定しない画面）を開き直す操作として行った");
    await s.openNew();
  };
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => { await pressColumn("ID"); });
  await step(3, async () => { await backToScreen(); });
  await step(4, async () => { await pressColumn("部門名"); });
  await step(5, async () => { await backToScreen(); });
  await step(6, async () => { await pressColumn("部門コード"); });
  await expected(async () => {
    for (const 列 of ["ID", "部門名", "部門コード"]) {
      const got = loaded[列];
      expect.soft(got, `${列}の導線で編集モードを開けた`).toBeDefined();
      if (!got) continue;
      expect.soft(got.path, `${列}の導線で開いた画面`).toBe(departmentEditPath(id));
      expect.soft(got.見出し, `${列}の導線で開いた入力欄の見出し（編集モード）`).toBe("編集");
      expect.soft(got.values, `${列}の導線で入力欄へ入った値`).toEqual(form("編集前部門-004", "63", "対象外", true));
    }
  });
});

caseTest("IT-M03-18-005", async ({ page, notes, step, expected }) => {
  const s = await signIn(page);
  let pressed = false;
  await step(1, async () => { await openEdit(s, notes.get("〔部門ID-M0318-005〕")); });
  await step(2, async () => {
    if ((await s.新規登録はこちら.count()) > 0) {
      await Promise.all([page.waitForURL((u) => u.pathname === departmentNewPath()), s.新規登録はこちら.first().click()]);
      await s.ready();
      pressed = true;
      return;
    }
    // 名前の違うボタンを代わりに押さない。押せなかったものとして、期待結果で落とす（元の画面を見て合格にしない）
    const other = (await s.新規登録へ戻る.count()) > 0 ? "。名前の違う「新規登録へ戻る」はあるが、代わりには押していない" : "";
    note(`編集モードの画面に「新規登録はこちら」という名前のボタンが無く、押せない（手順を画面で実行できない）${other}`);
  });
  await expected(async () => {
    expect(pressed ? "押せた" : "ボタンが無く押せない", "新規登録はこちらボタンを押して新規登録モードを開けた").toBe("押せた");
    expect.soft(path(page), "移った画面（新規登録モード）").toBe(departmentNewPath());
    await expect.soft(s.入力欄の見出し, "入力欄の見出し（新規登録モード）").toHaveText(/^\s*新規追加\s*$/);
    await expect.soft(s.登録ボタン, "画面下部のボタン名（新規登録モード）").toHaveText(/^\s*登録\s*$/);
    const v = await s.inputValues();
    expect.soft({ 部門名: v.部門名, 部門コード: v.部門コード }, "部門登録フォームの部門名・部門コード（新規登録なので空）").toEqual({ 部門名: "", 部門コード: "" });
  });
});

caseTest("IT-M03-18-006", async ({ page, step, expected }) => {
  const s = await signIn(page);
  let checked: boolean | null = null;
  await step(1, async () => {
    await s.openNew();
    await expect(s.入力欄の見出し, "入力欄の見出し（新規登録モード）").toHaveText(/^\s*新規追加\s*$/);
  });
  await step(2, async () => {
    await expect(s.MTGBuyer表示フラグ, "MTGBuyer表示フラグのチェック欄").toBeVisible();
    checked = await s.MTGBuyer表示フラグ.isChecked();
  });
  await expected(async () => {
    expect(checked, "MTGBuyer表示フラグのチェック").toBe(true);
  });
});

// ---- CSV出力・CSV入力 ----

caseTest("IT-M03-18-007", async ({ page, step, expected }) => {
  const s = await signIn(page);
  let text = "";
  let header: string[] = [];
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => { const csv = await s.downloadCsv(); text = csv.text; note(`ダウンロードしたファイル: ${csv.fileName}`); });
  await step(3, async () => { header = parseCsv(text)[0] ?? []; });
  await expected(async () => {
    expect(header, "CSVの見出し（左から順）").toEqual(["ID", "部門名", "部門コード", "免税区分", "MTGBuyer表示フラグ"]);
  });
});

caseTest("IT-M03-18-008", async ({ page, notes, step, expected }) => {
  const s = await signIn(page);
  const id = notes.get("〔部門ID-M0318-008〕");
  let text = "";
  let rows: Record<string, string>[] = [];
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => { const csv = await s.downloadCsv(); text = csv.text; note(`ダウンロードしたファイル: ${csv.fileName}`); });
  await step(3, async () => { rows = csvRecords(text).filter((r) => r["ID"] === id); });
  await expected(async () => {
    expect(rows.map((r) => ({ ID: r["ID"], 部門名: r["部門名"], 部門コード: r["部門コード"], 免税区分: r["免税区分"] })), `CSVのID ${id} の行`)
      .toEqual([{ ID: id, 部門名: "CSV確認部門-008", 部門コード: "67", 免税区分: "1" }]);
  });
});

caseTest("IT-M03-18-009", async ({ page, step, expected }) => {
  const s = await signIn(page);
  const upload = new DepartmentCsvUploadPage(page);
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => { await s.pressCsvInput(); });
  await expected(async () => {
    expect.soft(path(page), "移った画面").toBe(departmentCsvUploadPath());
    await expect.soft(upload.小見出し, "移った画面の名前").toHaveText(/^\s*部門登録CSVアップロード\s*$/);
  });
});

// ---- 入力の誤り ----

/** 編集モードで入力を変えて編集ボタンを押し、DBでその部門を読む（手順1〜4） */
async function editAndRead(ctx: CaseCtx, idLabel: string, change: (s: DepartmentPage) => Promise<void>): Promise<保存された部門 | null> {
  const { page, notes, step } = ctx;
  const s = await signIn(page);
  const id = notes.get(idLabel);
  let saved: 保存された部門 | null = null;
  await step(1, async () => { await openEdit(s, id); });
  await step(2, async () => { await change(s); });
  await step(3, async () => {
    const r = await s.pressRegister();
    noteSubmit(r);
    if (r.sent) { await noteMessages(page, "編集ボタンを押したあと"); await noteFieldErrors(s, "編集ボタンを押したあと"); }
  });
  await step(4, async () => { saved = 部門(id); });
  return saved;
}

const pick = (d: 保存された部門 | null, ...keys: (keyof 保存された部門)[]) => (d ? Object.fromEntries(keys.map((k) => [k, d[k]])) : null);

caseTest("IT-M03-18-017", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-017〕", async (s) => {
    await s.fill({ 部門名: "", 部門コード: "" });
    await unselectTaxFree(s);
  });
  await ctx.expected(async () => {
    expect(pick(saved, "部門名", "部門コード", "免税区分"), "ID 017 の部門名・部門コード・免税区分（更新されない）")
      .toEqual({ 部門名: "編集前部門-017", 部門コード: "76", 免税区分: "0" });
  });
});

caseTest("IT-M03-18-018", async ({ page, step, expected }) => {
  const s = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => {
    await s.fill({ 部門名: "", 部門コード: "" });
    await unselectTaxFree(s);
  });
  await step(3, async () => {
    r = await s.pressRegister();
    noteSubmit(r);
    if (r.sent) { await s.ready(); await noteMessages(page, "登録ボタンを押したあと"); await noteFieldErrors(s, "登録ボタンを押したあと"); }
  });
  await expected(async () => {
    // ブラウザの入力チェックが送信を止めたときは、画面は再表示されていない（元の画面を見て合格にしない）
    expect(r.sent ? "再表示された" : "ブラウザの入力チェックで送信が止まり、再表示されていない", "登録ボタンを押したあとの部門登録/編集画面").toBe("再表示された");
    expect.soft(path(page), "再表示された画面（登録の送信先）").toMatch(departmentStorePath);
    await expect.soft(s.入力欄の見出し, "再表示された入力欄の見出し（新規登録モード）").toHaveText(/^\s*新規追加\s*$/);
    const e = await s.fieldErrors();
    expect.soft(e.部門名.length, "部門名の直下の必須入力のエラー").toBeGreaterThan(0);
    expect.soft(e.部門コード.length, "部門コードの直下の必須入力のエラー").toBeGreaterThan(0);
  });
});

caseTest("IT-M03-18-020", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-020〕", async (s) => {
    await s.fill({ 部門名: "あ".repeat(129) });
    const n = (await s.部門名.inputValue()).length;
    if (n !== 129) note(`部門名の欄に入った文字数は ${n}（129文字を入れたが、画面が入力を切り詰めた）`);
  });
  await ctx.expected(async () => {
    expect(saved?.部門名, "ID 020 の部門名（更新されない）").toBe("編集前部門-020");
  });
});

caseTest("IT-M03-18-022", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-022〕", (s) => s.fill({ 部門コード: "129" }));
  await ctx.expected(async () => {
    expect(saved?.部門コード, "ID 022 の部門コード（81から更新されない）").toBe("81");
  });
});

caseTest("IT-M03-18-023", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-023〕", (s) => s.fill({ 部門コード: "12A" }));
  await ctx.expected(async () => {
    expect(saved?.部門コード, "ID 023 の部門コード（82から更新されない）").toBe("82");
  });
});

caseTest("IT-M03-18-024", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-024〕", (s) => s.addTaxFreeChoiceAndSelect("3"));
  await ctx.expected(async () => {
    expect(saved?.免税区分, "ID 024 の免税区分（0から更新されない）").toBe("0");
  });
});

// ---- 重複 ----

/** 新規登録モードで入力して登録ボタンを押す（手順1〜3） */
async function registerNew(ctx: CaseCtx, v: DepartmentInput): Promise<DepartmentPage> {
  const { page, step } = ctx;
  const s = await signIn(page);
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => {
    note("MTGBuyer表示フラグは手順に無いので、新規登録の初期表示のまま触っていない");
    await s.fill({ 部門名: v.部門名, 部門コード: v.部門コード, 免税区分: v.免税区分 });
  });
  await step(3, async () => {
    const r = await s.pressRegister();
    noteSubmit(r);
    if (r.sent) { await noteMessages(page, "登録ボタンを押したあと"); await noteFieldErrors(s, "登録ボタンを押したあと"); }
  });
  return s;
}

const 重複の入力 = (部門名: string, 部門コード: string): DepartmentInput => ({ 部門名, 部門コード, 免税区分: "対象外", MTGBuyer表示フラグ: true });

caseTest("IT-M03-18-025", async (ctx) => {
  await registerNew(ctx, 重複の入力("重複部門", "55"));
  let found: 保存された部門[] = [];
  await ctx.step(4, async () => { found = 部門コードの部門("55"); });
  await ctx.expected(async () => {
    expect(found, "部門コード55の部門（追加されない）").toEqual([]);
  });
});

caseTest("IT-M03-18-026", async (ctx) => {
  await registerNew(ctx, 重複の入力("新規重複コード部門", "40"));
  let found: 保存された部門[] = [];
  await ctx.step(4, async () => { found = 部門名の部門("新規重複コード部門"); });
  await ctx.expected(async () => {
    expect(found, "部門名「新規重複コード部門」の部門（追加されない）").toEqual([]);
  });
});

caseTest("IT-M03-18-027", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-027〕", (s) => s.fill({ 部門名: "重複部門" }));
  await ctx.expected(async () => {
    expect(saved?.部門名, "ID 027 の部門名（更新されない）").toBe("編集前部門-027");
  });
});

caseTest("IT-M03-18-028", async (ctx) => {
  const saved = await editAndRead(ctx, "〔部門ID-M0318-028〕", (s) => s.fill({ 部門コード: "40" }));
  await ctx.expected(async () => {
    expect(saved?.部門コード, "ID 028 の部門コード（87から更新されない）").toBe("87");
  });
});

caseTest("IT-M03-18-029", async (ctx) => {
  const s = await registerNew(ctx, 重複の入力("重複部門", "40"));
  await ctx.expected(async () => {
    const page = ctx.page;
    expect.soft(path(page), "再表示された画面（登録の送信先。一覧へ移っていない）").toMatch(departmentStorePath);
    await expect.soft(s.入力欄の見出し, "再表示された入力欄の見出し（新規登録モード）").toHaveText(/^\s*新規追加\s*$/);
    const e = await s.fieldErrors();
    const duplicate = [...e.部門名, ...e.部門コード].filter((t) => /既に登録|重複/.test(t));
    expect.soft(duplicate, "入力欄の直下の、値の重複を示すエラー").not.toEqual([]);
  });
});

// ---- なりすまし対策トークン ----

/** 編集モードで部門名を変え、なりすまし対策トークンを消すか変えて編集ボタンを押す（手順1〜4） */
async function tamperedUpdate(ctx: CaseCtx, idLabel: string, 部門名: string, token: "なし" | string): Promise<SubmitResult> {
  const { page, notes, step } = ctx;
  const s = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await openEdit(s, notes.get(idLabel)); });
  await step(2, async () => { await s.fill({ 部門名 }); });
  await step(3, async () => { await tamperToken(s.form, token); });
  await step(4, async () => { r = await s.pressRegister(); noteSubmit(r); await noteMessages(page, "編集ボタンを押したあと"); });
  return r;
}

caseTest("IT-M03-18-030", async (ctx) => {
  const r = await tamperedUpdate(ctx, "〔部門ID-M0318-030〕", "トークン欠落部門", "なし");
  let status: number | string = "";
  await ctx.step(5, async () => { status = r.sent ? r.status : "（要求が送られていない）"; });
  await ctx.expected(async () => {
    expect(status, "編集ボタンを押したあとの応答").toBe(403);
  });
});

caseTest("IT-M03-18-031", async (ctx) => {
  const r = await tamperedUpdate(ctx, "〔部門ID-M0318-031〕", "トークン改ざん部門", "invalid-token");
  let status: number | string = "";
  await ctx.step(5, async () => { status = r.sent ? r.status : "（要求が送られていない）"; });
  await ctx.expected(async () => {
    expect(status, "編集ボタンを押したあとの応答").toBe(403);
  });
});

caseTest("IT-M03-18-032", async (ctx) => {
  await tamperedUpdate(ctx, "〔部門ID-M0318-032〕", "保存不可トークン部門", "invalid-token");
  const id = ctx.notes.get("〔部門ID-M0318-032〕");
  let name: string | undefined;
  await ctx.step(5, async () => { name = 部門(id)?.部門名; });
  await ctx.expected(async () => {
    expect(name, "ID 032 の部門名（更新されない）").toBe("編集前部門-032");
  });
});

// ---- 存在しない部門 ----

caseTest("IT-M03-18-033", async ({ page, notes, step, expected }) => {
  const s = await signIn(page);
  const id = notes.get("〔部門ID-M0318-033〕");
  let status = 0;
  await step(1, async () => { await openEdit(s, id); });
  await step(2, async () => {
    const shown = page.url();
    expect(new URL(shown).pathname, "表示された編集画面のURL").toBe(departmentEditPath(id));
    const res = await page.goto(shown.replace(new RegExp(`/product/section/${id}(?=$|[?#])`), "/product/section/999999"));
    expect(path(page), "開いたURL").toBe(new URL(departmentEditUrl("999999")).pathname);
    status = res?.status() ?? 0;
  });
  await step(3, async () => { note(`部門ID 999999 の編集画面のURLの応答: ${status}`); });
  await expected(async () => {
    expect(status, "部門ID 999999 の編集画面のURLの応答").toBe(404);
  });
});

// ---- 機能間の連携（買取集計データ） ----

caseTest("IT-M03-18-045", async ({ page, step, expected }) => {
  const name = "リンク新設部門001";
  const s = new DepartmentPage(page);
  const summary = new BuySummarySearchPage(page);
  let choices: string[] = [];
  await step(1, async () => { await loginAdmin(page, M0318L_ADMIN); await s.openNew(); });
  await step(2, async () => {
    await s.fill({ 部門名: name, 部門コード: "9031801", 免税区分: "一般品" });
    note(`MTGBuyer表示フラグは初期表示のまま触っていない（チェック: ${(await s.MTGBuyer表示フラグ.isChecked()) ? "あり" : "なし"}）。免税区分「1:一般品」は選択肢「一般品」（値1）を選んだ`);
    const r = await s.pressRegister();
    noteSubmit(r);
    if (r.sent) await noteMessages(page, "登録ボタンを押したあと");
  });
  await step(3, async () => {
    await s.ready();
    await expect(s.rowsByName(name), `部門一覧の「${name}」の行`).toHaveCount(1);
  });
  await step(4, async () => { await summary.open(); });
  await step(5, async () => { choices = await summary.departmentChoices(); });
  await expected(async () => {
    expect(choices, "部門のセレクトボックスの選択肢").toContain(name);
  });
});

caseTest("IT-M03-18-046", async ({ page, notes, step, expected }) => {
  const name = "リンク削除部門002";
  const id = notes.get("〔部門ID-M0318-046〕");
  const s = new DepartmentPage(page);
  const summary = new BuySummarySearchPage(page);
  let choices: string[] = [];
  await step(1, async () => { await loginAdmin(page, M0318L_ADMIN); await summary.open(); });
  await step(2, async () => {
    expect(await summary.departmentChoices(), "削除前の部門のセレクトボックスの選択肢").toContain(name);
  });
  await step(3, async () => { await s.openNew(); });
  await step(4, async () => {
    const row = s.rowsByName(name);
    await expect(row, `部門一覧の部門名「${name}」の行`).toHaveCount(1);
    expect((await s.readRow(row)).ID, `部門名「${name}」の行のID`).toBe(id);
    const { dialog, response } = await s.pressDelete(row, true);
    note(`確認ダイアログ「${dialog}」で承諾した。削除の要求のあとに移った画面の応答: ${response?.status() ?? "不明"}`);
    expect.soft(dialog, "確認ダイアログに対象の部門名が示されている").toContain(name);
    await s.ready();
    await noteMessages(page, "削除のあと");
  });
  await step(5, async () => {
    await expect(s.rowsByName(name), `部門一覧の「${name}」の行`).toHaveCount(0);
  });
  await step(6, async () => { await summary.open(); });
  await step(7, async () => { choices = await summary.departmentChoices(); });
  await expected(async () => {
    expect(choices, "部門のセレクトボックスの選択肢").not.toContain(name);
  });
});

// ---- 新規登録モードのボタン ----

caseTest("IT-M03-18-047", async ({ page, step, expected }) => {
  const s = await signIn(page);
  let buttons: string[] = [];
  await step(1, async () => {
    await s.openNew();
    expect(path(page), "開いた画面（編集対象を指定しない画面）").toBe(departmentNewPath());
  });
  await step(2, async () => {
    buttons = await s.buttonsAroundForm();
    note(`部門登録フォームの周辺に表示されているボタン: ${buttons.join("、") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(buttons, "新規登録はこちらボタン").not.toContain("新規登録はこちら");
    // 設計書の現行仕様の節は、同じ導線を「新規登録へ戻る導線」と書き、編集モードのときだけ出すと定める。画面ではこの名前のボタンなので、
    // 名前だけで見ると必ず通る。こちらも出ないことを確かめる（005 では、名前が違うのでこのボタンを代わりに押さない）
    expect.soft(buttons, "同じ役割のボタン「新規登録へ戻る」").not.toContain("新規登録へ戻る");
  });
});

// ---- CSV取込の行数の上限 ----

/** 部門登録CSVアップロード画面を開き、行数確認ファイルを選んでアップロードする（手順1〜4） */
async function uploadRows(ctx: CaseCtx, 番号: string): Promise<{ status: number; path: string }> {
  const { page, step } = ctx;
  const s = await signIn(page);
  const upload = new DepartmentCsvUploadPage(page);
  const file = 行数確認ファイル(番号, 5009);
  let result = { status: 0, path: "" };
  await step(1, async () => { await s.openNew(); });
  await step(2, async () => { await s.pressCsvInput(); });
  await step(3, async () => { await upload.choose(file); note(`${file.name}（見出し行を含め ${file.行数} 行）を選んだ`); });
  await step(4, async () => {
    result = await upload.upload();
    note(`アップロードの要求の応答: ${result.status}。移った画面: ${result.path}`);
    await noteMessages(page, "アップロードのあと");
  });
  return result;
}

caseTest("IT-M03-18-050", async (ctx) => {
  const result = await uploadRows(ctx, "050");
  const upload = new DepartmentCsvUploadPage(ctx.page);
  await ctx.expected(async () => {
    note("正本の「部門マスタCSVアップロード画面」は、部門登録CSVアップロード画面（同じ画面）と解釈した");
    expect.soft(result.path, "アップロードのあとに移った画面").toBe(departmentCsvUploadPath());
    await expect.soft(upload.小見出し, "移った画面の名前").toHaveText(/^\s*部門登録CSVアップロード\s*$/);
  });
});

caseTest("IT-M03-18-051", async (ctx) => {
  await uploadRows(ctx, "051");
  const codes = new Set(行数確認ファイル("051", 5009).部門コード);
  let found: string[] = [];
  await ctx.step(5, async () => { found = 部門コードが前方一致する部門("M0318-051-").map((d) => d.部門コード).filter((c) => codes.has(c)); });
  await ctx.expected(async () => {
    expect(found, "部門コードM0318-051-0001〜M0318-051-5009の部門（1件も登録されない）").toEqual([]);
  });
});
