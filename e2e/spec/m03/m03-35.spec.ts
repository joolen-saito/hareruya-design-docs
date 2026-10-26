/**
 * M03-35 部門更新CSV登録。正本: cases/M03-35_test_cases.tsv
 *
 * 正本の「部門更新CSV登録画面」（「部門更新CSV取込画面」とも書く）は、アプリのメニュー「商品管理」→「商品CSV管理」の
 * 「部門登録CSVアップロード」で開く画面（商品コードと部門コードで商品規格の部門を更新する取込。pages/admin/m03_35_section_update_csv.ts）。
 * 取込ファイルは、シード（seeds/m03-35.ts）が試験端末に作ったもの（または e2e/fixtures/m03-35/ のもの）を選ぶ。
 *
 * 実装したケース: 008・009・019・021・023・027・045・046。
 * 実装していないケース: 部門31〜33のシード（S-M03-35-SECTIONS）がスマレジ試験用部門IDをDBへ直接設定するもの、
 * 取込履歴をDBフィクスチャで入れるもの（004〜007）ほか。理由は e2e/review/M03-35_progress_2026-10-21.md。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { Account, loginAdmin } from "../../lib/session";
import { DepartmentPage } from "../../pages/admin/m03_18_department";
import { SectionUpdateCsvPage, sectionUpdateCsvPath, UploadResult } from "../../pages/admin/m03_35_section_update_csv";
import { M0335_ADMIN, M0335L_ADMIN, m0335File } from "../../seeds/m03-35";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page, account: Account = M0335_ADMIN): Promise<SectionUpdateCsvPage> {
  await loginAdmin(page, account);
  return new SectionUpdateCsvPage(page);
}

/** アップロードボタンを押した結果（応答・戻った画面・画面上部の帯）を注記に残す */
async function noteUpload(u: SectionUpdateCsvPage, r: UploadResult, when: string): Promise<void> {
  if (!r.sent) {
    note(`${when}: ブラウザの入力チェックが送信を止めた（取込の要求は送られていない）: ${r.止めた項目.join(" / ")}`);
    return;
  }
  const m = await u.messages();
  note(`${when}: 取込の要求の応答 ${r.応答}、戻った画面 ${r.戻った画面}。画面上部の成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}`);
}

/** ファイルを選び、アップロードボタンを押す（画面は開いてある） */
async function chooseAndUpload(u: SectionUpdateCsvPage, fileName: string, when: string): Promise<UploadResult> {
  const f = m0335File(fileName);
  await u.choose(f);
  note(`${when}: ${f.name}（${f.buffer.length} バイト・送る形式種別 ${f.mimeType}）を選んだ`);
  const r = await u.pressUpload();
  await noteUpload(u, r, `${when}のアップロードのあと`);
  return r;
}

/**
 * 「部門更新CSV登録画面が再表示されること」: 取込の要求が送られ、応答のあと部門更新CSV登録画面（取込ファイルの欄とアップロードボタン）に戻ったこと。
 * どのケースもエラーで終わる取込（ファイルなし・形式違い・大きさ超過・構造の誤り）なので、取込が成功して戻ったのではないこと（成功の帯が無いこと）も見る。
 */
async function expectRedisplayed(u: SectionUpdateCsvPage, r: UploadResult, what: string): Promise<void> {
  if (!r.sent) return;
  expect.soft(r.戻った画面, `${what}: 取込の要求のあと戻った画面`).toBe(sectionUpdateCsvPath());
  await expect.soft(u.取込ファイル, `${what}: 戻った画面の取込ファイルの欄`).toHaveCount(1);
  await expect.soft(u.アップロードボタン, `${what}: 戻った画面のアップロードボタン`).toBeVisible();
  const m = await u.messages();
  expect.soft(m.成功, `${what}: 取込が成功した帯が出ていない（エラーで終わった取込の再表示）`).toEqual([]);
}

// ---- 雛形 ----

caseTest("IT-M03-35-008", async ({ page, step, expected }) => {
  const u = await signIn(page);
  let file: { fileName: string; bytes: Buffer } = { fileName: "", bytes: Buffer.alloc(0) };
  await step(1, async () => { await u.open(); });
  await step(2, async () => { file = await u.downloadTemplate(); note(`ダウンロードしたファイル: ${file.fileName}（${file.bytes.length} バイト）`); });
  await expected(async () => {
    expect(file.fileName, "ダウンロードしたファイルの名前").toBe("product_section_update.csv");
  });
});

caseTest("IT-M03-35-009", async ({ page, step, expected }) => {
  const u = await signIn(page);
  let file: { fileName: string; bytes: Buffer } = { fileName: "", bytes: Buffer.alloc(0) };
  let rows: string[][] = [];
  await step(1, async () => { await u.open(); });
  await step(2, async () => { file = await u.downloadTemplate(); });
  await step(3, async () => {
    const text = decodeCsvBytes(file.bytes);
    rows = parseCsv(text);
    note(`ダウンロードしたファイル ${file.fileName}（${file.bytes.length} バイト）の中身: ${JSON.stringify(text)}`);
  });
  await expected(async () => {
    expect.soft(rows[0], "見出し行（左から順）").toEqual(["商品コード", "部門コード(ID)"]);
    expect.soft(rows.length, "行の数（見出し行だけでデータ行が無い）").toBe(1);
  });
});

// ---- 取込の前の確認で止まるもの ----

caseTest("IT-M03-35-019", async ({ page, step, expected }) => {
  const u = await signIn(page);
  let r: UploadResult = { sent: false, 止めた項目: [] };
  await step(1, async () => { await u.open(); });
  await step(2, async () => { r = await u.pressUpload(); await noteUpload(u, r, "ファイルを選ばずにアップロードボタンを押したあと"); });
  await expected(async () => {
    expect.soft(r.sent, "ファイル未選択のアップロード: アップロードボタンで取込の要求が送られる（ブラウザの入力チェックで止まらない）").toBe(true);
    await expectRedisplayed(u, r, "ファイル未選択のアップロード");
  });
});

/** 正本の手順1〜2（画面を開く／ファイルを選んでアップロードボタンを押す）と期待結果「部門更新CSV登録画面が再表示されること」 */
function rejected(fileName: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const u = await signIn(page);
    let r: UploadResult = { sent: false, 止めた項目: [] };
    await step(1, async () => { await u.open(); });
    await step(2, async () => { r = await chooseAndUpload(u, fileName, fileName); });
    await expected(async () => {
      expect.soft(r.sent, `${fileName} のアップロード: アップロードボタンで取込の要求が送られる（ブラウザの入力チェックで止まらない）`).toBe(true);
      await expectRedisplayed(u, r, `${fileName} のアップロード`);
    });
  };
}

caseTest("IT-M03-35-021", rejected("m0335_invalid-021.png"));
caseTest("IT-M03-35-023", rejected("m0335_oversize-023.csv"));

caseTest("IT-M03-35-027", async ({ page, step, expected }) => {
  const u = await signIn(page);
  const files = ["m0335_empty-027.csv", "m0335_header_only-027.csv", "m0335_three_columns-027.csv"];
  /** 各アップロードのあとの画面（次のアップロードで画面を開き直す前に読んでおき、期待結果でファイルごとに判定する） */
  const seen: { name: string; r: UploadResult; path: string; 取込ファイルの欄: number; ボタン: boolean; 成功: string[] }[] = [];
  for (const [i, name] of files.entries()) {
    await step(i + 1, async () => {
      await u.open();
      const r = await chooseAndUpload(u, name, name);
      seen.push({
        name, r, path: u.path(), 取込ファイルの欄: await u.取込ファイル.count(),
        ボタン: await u.アップロードボタン.isVisible(), 成功: (await u.messages()).成功,
      });
    });
  }
  await expected(async () => {
    expect(seen.map((x) => x.name), "3つのファイルをアップロードした").toEqual(files);
    for (const x of seen) {
      expect.soft(x.r.sent, `${x.name}: アップロードボタンで取込の要求が送られる`).toBe(true);
      if (!x.r.sent) continue;
      expect.soft(x.path, `${x.name}: 取込の要求のあと戻った画面`).toBe(sectionUpdateCsvPath());
      expect.soft(x.取込ファイルの欄, `${x.name}: 戻った画面の取込ファイルの欄`).toBe(1);
      expect.soft(x.ボタン, `${x.name}: 戻った画面のアップロードボタン`).toBe(true);
      expect.soft(x.成功, `${x.name}: 取込が成功した帯が出ていない（エラーで終わった取込の再表示）`).toEqual([]);
    }
  });
});

// ---- 部門登録/編集との連携（045・046） ----

/**
 * 正本の手順1〜5: 部門更新CSV登録画面で取込ファイルをアップロードし、部門登録/編集画面を開き、部門一覧の行の削除ボタンを押して、
 * 対象部門名を示す確認ダイアログを承諾する。承諾のあとに移った画面の部門一覧を返す。
 */
async function assignThenDelete(ctx: CaseCtx, fileName: string, 削除する部門名: string): Promise<DepartmentPage> {
  const { page, step } = ctx;
  const u = await signIn(page, M0335L_ADMIN);
  const s = new DepartmentPage(page);
  await step(1, async () => { await u.open(); });
  await step(2, async () => {
    const r = await chooseAndUpload(u, fileName, fileName);
    if (!r.sent) throw new Error(`${fileName}: ブラウザの入力チェックで送信が止まった`);
  });
  await step(3, async () => { await s.openNew(); });
  let shown: Promise<import("@playwright/test").Dialog> | null = null;
  let clicked: Promise<void> | null = null;
  await step(4, async () => {
    const row = s.rowsByName(削除する部門名);
    await expect(row, `部門一覧の「${削除する部門名}」の行`).toHaveCount(1);
    await page.waitForLoadState("load");
    shown = page.waitForEvent("dialog", { timeout: 10_000 });
    clicked = row.getByRole("link", { name: "削除", exact: true }).click();
    await shown.catch(() => { throw new Error("削除ボタンを押したが、確認ダイアログが出ない"); });
  });
  await step(5, async () => {
    const dialog = await shown!;
    const message = dialog.message();
    note(`確認ダイアログの文: 「${message}」`);
    if (!message.includes(削除する部門名)) note(`確認ダイアログの文に対象の部門名「${削除する部門名}」が無い（手順の「対象部門名を示す確認ダイアログ」と違う）`);
    const nav = page.waitForNavigation({ waitUntil: "load" });
    await dialog.accept();
    await clicked;
    const res = await nav;
    await s.ready();
    const m = await u.messages();
    note(`削除の要求のあと: 応答 ${res?.status() ?? "なし"}・移った画面 ${new URL(page.url()).pathname}。成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}`);
  });
  return s;
}

caseTest("IT-M03-35-045", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0335-045A〕");
  const s = await assignThenDelete(ctx, "m0335l_assign-001.csv", "連携削除確認部門-001");
  await ctx.expected(async () => {
    const rows = (await s.allRows()).filter((r) => r.部門名 === "連携削除確認部門-001");
    expect(rows.map((r) => r.ID), "遷移後の部門一覧の「連携削除確認部門-001」の行（削除されず残る）").toEqual([id]);
  });
});

caseTest("IT-M03-35-046", async (ctx) => {
  const idA = ctx.notes.get("〔部門ID-M0335-046A〕");
  const idB = ctx.notes.get("〔部門ID-M0335-046B〕");
  const s = await assignThenDelete(ctx, "m0335l_assign-002.csv", "連携解放部門-002");
  await ctx.expected(async () => {
    const rows = await s.allRows();
    expect.soft(rows.filter((r) => r.部門名 === "連携解放部門-002" || r.ID === idA).map((r) => `${r.ID}:${r.部門名}`), "遷移後の部門一覧に「連携解放部門-002」が無い").toEqual([]);
    expect.soft(rows.filter((r) => r.部門名 === "連携移行先部門-002").map((r) => r.ID), "遷移後の部門一覧に「連携移行先部門-002」が残る").toEqual([idB]);
  });
});
