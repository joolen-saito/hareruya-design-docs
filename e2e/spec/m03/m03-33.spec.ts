/**
 * M03-33 セール用高額商品価格変更CSV登録。正本: cases/M03-33_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる7件（006・019・029・030・046・047・048）。
 * ほかのケースは、シードがDBへの直接設定（タグID 1〜3の登録・取込履歴・価格履歴・在庫数・大量の商品など）を含むか、
 * 取込ファイルの値が正本で決まらない（7列のうち一部の値しか書かれていない）か、外部サービス・DBで登録するマスタを使うので実装しない
 * （記録 review/M03-33_progress_2026-10-21.md）。
 *
 * 正本の「セール用高額商品価格変更CSVアップロード画面」「…CSV登録画面」は、メニュー「商品管理」→「CSV管理」の画面
 * （見出し「セール用高額商品価格変更CSVアップロード」）。正本の「CSVファイルのアップロード」ボタンは、画面の「CSVファイルをアップロード」ボタン。
 */
import fs from "node:fs";
import path from "node:path";
import { Download, Page, test } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { 商品規格の状態, 取込履歴の件数, 取込種別 } from "../../db/m03_32_high_price";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { HighPriceCsvUploadPage, pathOf, SubmitResult, uploadPath } from "../../pages/admin/m03_32_high_price_csv";
import { M0333_ADMIN, m0333FilePath } from "../../seeds/m03-33";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const list = (xs: string[]) => xs.join(" / ") || "なし";
/**
 * 取込履歴の件数。アプリのセール用高額商品価格変更の画面は、CSV取込種別のマスタで「高額商品価格変更登録」の番号（8）で記録し、
 * 高額商品価格変更の画面は「セール用高額商品価格変更登録」の番号（7）で記録する（番号と名称が入れ違っている。記録の注記）。
 * どちらの番号で数えるかで結果が変わらないよう、両方の件数を見る（「増えない」は両方が増えないこと）。
 */
const 取込履歴の件数両方 = () => ({ 名称がセール用の種別: 取込履歴の件数(取込種別.セール用高額商品価格変更), 名称が高額商品価格変更の種別: 取込履歴の件数(取込種別.高額商品価格変更) });

async function signIn(page: Page): Promise<HighPriceCsvUploadPage> {
  await loginAdmin(page, M0333_ADMIN);
  return new HighPriceCsvUploadPage(page, "セール用高額商品価格変更");
}

async function noteSubmit(upload: HighPriceCsvUploadPage, r: SubmitResult, when = ""): Promise<void> {
  if (r.sent) note(`${when}「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
  else note(`${when}「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
  const m = await upload.messages();
  note(`${when}押したあとの画面上部のメッセージ: 成功「${list(m.成功)}」・警告「${list(m.警告)}」・エラー「${list(m.エラー)}」`);
}

/** 取込の要求が送られ、その結果としてセール用高額商品価格変更CSVアップロード画面にいること */
async function expectOnUploadScreen(page: Page, upload: HighPriceCsvUploadPage, r: SubmitResult, when = ""): Promise<void> {
  expect.soft(r.sent, `${when}「CSVファイルをアップロード」で取込の要求が送られた`).toBe(true);
  expect.soft(pathOf(page.url()), `${when}送信のあとの画面`).toBe(uploadPath("セール用高額商品価格変更"));
  await expect.soft(upload.見出し, `${when}送信のあとの画面の見出し`).toHaveText(/^\s*セール用高額商品価格変更CSVアップロード\s*$/);
}

async function chooseFile(upload: HighPriceCsvUploadPage, file: string): Promise<void> {
  await upload.choose(m0333FilePath(file));
  expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([file]);
}

/** 取込の前の商品規格と、種別の取込履歴の件数（DBの参照）。シード表の状態（基準1500・販売1500・買取600・セールなし）であることも確かめる */
function snapshot(classId: string, code: string) {
  const s = 商品規格の状態(classId);
  expect(s, `商品規格ID ${classId} の商品規格`).not.toBeNull();
  expect({ 商品コード: s!.商品コード, 基準価格: s!.基準価格, 販売価格: s!.販売価格, 買取価格: s!.買取価格, セール: s!.セール }, "取込前の商品規格がシード表の状態")
    .toEqual({ 商品コード: code, 基準価格: "1500", 販売価格: "1500", 買取価格: "600", セール: false });
  const 履歴 = 取込履歴の件数両方();
  note(`取込前（DBの参照）: 商品規格の販売価格 ${s!.販売価格}・買取価格 ${s!.買取価格}・セール ${s!.セール}・帯URL ${s!.帯URL ?? "なし"}・更新日時 ${s!.更新日時}。` +
    `取込履歴の件数（CSV取込種別の名称ごと） ${JSON.stringify(履歴)}`);
  return { 規格: s!, 履歴 };
}

/** 取込の後の商品規格と、取込の前から変わった項目・全項目が同じか・種別の取込履歴の件数（DBの参照） */
function afterImport(before: ReturnType<typeof snapshot>, classId: string) {
  const after = 商品規格の状態(classId)!;
  note(`取込後（DBの参照）: 商品規格の販売価格 ${after.販売価格}・買取価格 ${after.買取価格}・セール ${after.セール}・帯URL ${after.帯URL ?? "なし"}・更新日時 ${after.更新日時}`);
  const 変わった項目 = (["基準価格", "販売価格", "買取価格", "セール", "帯URL", "高額商品コード", "スマレジ連携", "更新日時"] as const)
    .filter((k) => after[k] !== before.規格[k]).map((k) => `${k}: ${before.規格[k]} → ${after[k]}`);
  return { 変わった項目, 全項目が同じ: after.全項目 === before.規格.全項目, 履歴: 取込履歴の件数両方() };
}

// ---- 帯URL ----

caseTest("IT-M03-33-006", async ({ page, notes, step, expected, db }) => {
  const classId = notes.get("〔商品規格ID-M0333-006〕");
  const before = 商品規格の状態(classId);
  note(`取込前の帯URL（DBの参照）: ${before?.帯URL ?? "なし"}`);
  const upload = await signIn(page);
  let after: ReturnType<typeof 商品規格の状態> = null;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    await chooseFile(upload, "belt_empty-006.csv");
    await noteSubmit(upload, await upload.submit());
  });
  await step(3, async () => {
    expect(db.available, "DB確認の接続先").toBe(true);
    after = 商品規格の状態(classId);
    note(`取込後の帯URL（DBの参照）: ${after?.帯URL === null ? "なし（未設定）" : JSON.stringify(after?.帯URL)}`);
  });
  await expected(async () => {
    expect(after, `商品規格ID ${classId} の商品規格`).not.toBeNull();
    expect.soft(after!.商品コード, "商品規格の商品コード").toBe("HP-OFF-01-006");
    expect.soft(after!.帯URL === null || after!.帯URL === "", `帯URLが未設定になる（取込後の値: ${JSON.stringify(after!.帯URL)}）`).toBe(true);
  });
});

// ---- 雛形 ----

caseTest("IT-M03-33-019", async ({ page, step, expected }) => {
  const dir = path.join(STATE_DIR, "m03-33", "downloads-019");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const upload = await signIn(page);
  const downloads: Download[] = [];
  let formatNames: string[] = [];
  await step(1, async () => {
    await upload.open();
    formatNames = await upload.formatItemNames();
  });
  await step(2, async () => {
    page.on("download", (d) => { downloads.push(d); });
    const first = await upload.downloadTemplate();
    if (!downloads.includes(first)) downloads.push(first);
    // 1回押したあと、ほかのダウンロードが始まらないことを少し待って確かめる
    await page.waitForTimeout(3_000);
    for (const d of downloads) await d.saveAs(path.join(dir, d.suggestedFilename()));
  });
  await expected(async () => {
    expect.soft(downloads.length, "ダウンロードされたファイルの数").toBe(1);
    const files = fs.readdirSync(dir);
    note(`ダウンロードしたファイル: ${files.join("・")}`);
    expect.soft(files.length, "ダウンロード先のファイルの数").toBe(1);
    if (files.length >= 1) {
      const rows = parseCsv(decodeCsvBytes(fs.readFileSync(path.join(dir, files[0]))));
      note(`雛形の中身: ${JSON.stringify(rows)}。画面のCSVのフォーマットの項目: ${formatNames.join("・")}`);
      // 登録CSVの雛形＝画面のセール用高額商品価格変更CSVファイルフォーマットの項目を見出しにした、見出し行だけのCSV（設計書 L0079・L0081）
      expect.soft(rows, "雛形は、画面のCSVのフォーマットの項目を並べた見出し行だけ").toEqual([formatNames]);
    }
  });
});

// ---- 取り込まないファイル ----

/** ファイルを選んでアップロードし、商品規格と取込履歴が変わらないことを確かめる（029・030） */
function noChangeCase(n: string, file: string) {
  return async ({ page, notes, step, expected, db }: CaseCtx) => {
    const classId = notes.get(`〔商品規格ID-M0333-${n}〕`);
    const before = snapshot(classId, `HP-OFF-01-${n}`);
    const upload = await signIn(page);
    await step(1, async () => {
      await upload.open();
      await chooseFile(upload, file);
      await noteSubmit(upload, await upload.submit());
    });
    await step(2, async () => { expect(db.available, "DB確認の接続先").toBe(true); });
    await expected(async () => {
      const a = afterImport(before, classId);
      expect.soft(a.変わった項目, "商品規格の項目が取込前から変わらない").toEqual([]);
      expect.soft(a.全項目が同じ, "商品規格の全項目が取込前と同じ").toBe(true);
      expect.soft(a.履歴, "取込履歴の件数が増えない（CSV取込種別のマスタの両方の番号）").toEqual(before.履歴);
    });
  };
}

caseTest("IT-M03-33-029", noChangeCase("029", "empty-029.csv"));
caseTest("IT-M03-33-030", noChangeCase("030", "header_only-030.csv"));

// ---- 送信の受付 ----

caseTest("IT-M03-33-046", async ({ page, notes, step, expected, db }) => {
  const classId = notes.get("〔商品規格ID-M0333-046〕");
  const before = snapshot(classId, "HP-OFF-01-046");
  const upload = await signIn(page);
  const results: { r: SubmitResult; エラー: string[]; 成功: string[]; path: string; 見出し: string }[] = [];
  const record = async (r: SubmitResult) => {
    const m = await upload.messages();
    results.push({ r, エラー: m.エラー, 成功: m.成功, path: pathOf(page.url()), 見出し: ((await upload.見出し.textContent()) ?? "").trim() });
  };
  await step(1, async () => {
    await upload.open();
    await chooseFile(upload, "off_on-046.csv");
  });
  await step(2, async () => {
    await upload.changeToken("なし");
    expect(await upload.tokenValues(), "フォームの中のなりすまし対策トークンを削除した").toEqual([]);
    const r = await upload.submit();
    await noteSubmit(upload, r, "1回目（照合値なし）: ");
    await record(r);
  });
  await step(3, async () => {
    await upload.open();
    // 開き直すと取込ファイルの欄は空になる。正本は選び直しを書いていないが、2回目も同じファイルを送るため選び直す（正本に無い操作の追加。注記）
    await chooseFile(upload, "off_on-046.csv");
    note("2回目: 開き直した画面で、取込ファイルの欄に off_on-046.csv を選び直した（正本に無い操作）");
    await upload.changeToken("invalid-token");
    expect(await upload.tokenValues(), "フォームの中のなりすまし対策トークン").toEqual(["invalid-token"]);
    const r = await upload.submit();
    await noteSubmit(upload, r, "2回目（照合値 invalid-token）: ");
    await record(r);
  });
  await step(4, async () => { expect(db.available, "DB確認の接続先").toBe(true); });
  await expected(async () => {
    expect(results.length, "送信の回数").toBe(2);
    results.forEach((x, i) => {
      const when = `${i + 1}回目: `;
      expect.soft(x.r.sent, `${when}取込の要求が送られた`).toBe(true);
      expect.soft(x.path, `${when}送信のあとの画面`).toBe(uploadPath("セール用高額商品価格変更"));
      expect.soft(x.見出し, `${when}送信のあとの画面の見出し`).toBe("セール用高額商品価格変更CSVアップロード");
      // 照合値が無効なときのエラー＝設計書 M03-33-MSG-001「CSRFトークンが無効です、再送信してください。」（取込を中止して画面へ戻る）
      expect.soft(x.エラー.some((t) => t.includes("CSRFトークンが無効です、再送信してください。")),
        `${when}画面上部のエラー「CSRFトークンが無効です、再送信してください。」（エラー: ${list(x.エラー)}）`).toBe(true);
      expect.soft(x.成功, `${when}完了のメッセージは出ない`).toEqual([]);
    });
    const a = afterImport(before, classId);
    expect.soft(a.変わった項目, "商品規格の項目が取込前から変わらない").toEqual([]);
    expect.soft(a.全項目が同じ, "商品規格の全項目が取込前と同じ").toBe(true);
    expect.soft(a.履歴, "取込履歴の件数が増えない（CSV取込種別のマスタの両方の番号）").toEqual(before.履歴);
  });
});

caseTest("IT-M03-33-047", async ({ page, notes, step, expected, db }) => {
  const classId = notes.get("〔商品規格ID-M0333-047〕");
  const before = snapshot(classId, "HP-OFF-01-047");
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => {
    await upload.open();
    await chooseFile(upload, "off_on-047.csv");
  });
  await step(2, async () => {
    const name = `${await upload.formName()}[unsupported_field]`;
    await upload.addField(name, "1");
    note(`送信フォームへ項目 ${name}=1 を足した（正本の「unsupported_field=1」を、このフォームの項目として足すと解釈した）`);
  });
  await step(3, async () => {
    r = await upload.submit();
    await noteSubmit(upload, r);
  });
  await step(4, async () => { expect(db.available, "DB確認の接続先").toBe(true); });
  await expected(async () => {
    await expectOnUploadScreen(page, upload, r);
    // 送信内容に未対応の項目が含まれるときのエラー＝設計書 M03-33-MSG-001（取込を中止し、アップロード画面に遷移する）。
    // 取込ファイルの中身の誤りで止まっても「変わらない」は満たすので、未対応の項目で止まったことをこの文で確かめる
    const m = await upload.messages();
    expect.soft(m.エラー.some((t) => t.includes("フィールドグループに追加のフィールドを含んではなりません。")),
      `画面上部のエラー「フィールドグループに追加のフィールドを含んではなりません。」（エラー: ${list(m.エラー)}）`).toBe(true);
    const a = afterImport(before, classId);
    expect.soft(a.変わった項目, "商品規格の項目が取込前から変わらない").toEqual([]);
    expect.soft(a.全項目が同じ, "商品規格の全項目が取込前と同じ").toBe(true);
    expect.soft(a.履歴, "取込履歴の件数が増えない（CSV取込種別のマスタの両方の番号）").toEqual(before.履歴);
  });
});

caseTest("IT-M03-33-048", async ({ page, notes, step, expected, db }) => {
  const classId = notes.get("〔商品規格ID-M0333-048〕");
  const before = snapshot(classId, "HP-OFF-01-048");
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => {
    await upload.open();
    await chooseFile(upload, "invalid-048.png");
  });
  await step(2, async () => {
    r = await upload.submit();
    await noteSubmit(upload, r);
  });
  await step(3, async () => { expect(db.available, "DB確認の接続先").toBe(true); });
  await expected(async () => {
    const a = afterImport(before, classId);
    expect.soft(a.変わった項目, "商品規格の項目が取込前から変わらない").toEqual([]);
    expect.soft(a.全項目が同じ, "商品規格の全項目が取込前と同じ").toBe(true);
    expect.soft(a.履歴, "取込履歴の件数が増えない（CSV取込種別のマスタの両方の番号）").toEqual(before.履歴);
    await expectOnUploadScreen(page, upload, r);
  });
});
