/**
 * M03-30 基準価格変更CSV登録。正本: cases/M03-30_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる5件（014・032・037・055・059）。ほかのケースを実装しない理由は seeds/m03-30.ts の冒頭と
 * e2e/review/M03-30_progress_2026-10-21.md。
 *
 * 正本の「基準価格変更CSVアップロード画面」は、メニュー「商品管理」→「CSV管理」の画面（見出し「基準価格変更CSVアップロード」）。
 * 正本の「CSVファイルのアップロードボタン」は、画面の「CSVファイルをアップロード」ボタン（文言の違い）。
 */
import fs from "node:fs";
import path from "node:path";
import { Page, test } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import * as price from "../../db/m03_30_price";
import {
  PriceCsvUploadPage, priceCsvUploadPath, SubmitResult, 画面上部のメッセージ, 画面の見出し,
} from "../../pages/admin/m03_30_price_csv";
import { M0330_ADMIN, m0330FilePath } from "../../seeds/m03-30";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<PriceCsvUploadPage> {
  await loginAdmin(page, M0330_ADMIN);
  return new PriceCsvUploadPage(page, "基準価格変更");
}

/** 送信の結果と画面上部のメッセージを注記に残す */
async function noteSubmit(page: Page, r: SubmitResult): Promise<void> {
  if (!r.sent) {
    note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
    return;
  }
  note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}。移った画面: ${new URL(page.url()).pathname}`);
  const m = await 画面上部のメッセージ(page);
  note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」/ エラー「${m.エラー.join("」「") || "なし"}」/ 警告「${m.警告.join("」「") || "なし"}」`);
}

/** ファイルを選んでアップロードする（手順「…を選択する」「CSVファイルのアップロードボタンを押す」）。送信が止まったら手順を実行できなかったとして落とす */
async function uploadChosen(page: Page, upload: PriceCsvUploadPage): Promise<void> {
  const r = await upload.submit();
  await noteSubmit(page, r);
  expect(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた（送られないと手順を実行できない）").toBe(true);
}

// ---- 014: 商品が無い行を含むファイル ----

caseTest("IT-M03-30-014", async ({ page, step, expected }) => {
  expect(price.取込履歴の件数("基準価格変更", "missing_product.tsv"), "事前準備: missing_product.tsv の取込履歴が0件").toBe(0);
  const upload = await signIn(page);
  let after = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(m0330FilePath("014", "missing_product.tsv")); });
  await step(3, async () => { await uploadChosen(page, upload); });
  await step(4, async () => {
    after = price.取込履歴の件数("基準価格変更", "missing_product.tsv");
    note(`DBの本機能の取込履歴のうち、ファイル名 missing_product.tsv の件数: ${after}`);
  });
  await expected(async () => {
    expect(after, "missing_product.tsv の取込履歴が追加されない（0件のまま）").toBe(0);
  });
});

// ---- 032: ファイルを選ばずにアップロード ----

caseTest("IT-M03-30-032", async ({ page, step, expected }) => {
  const upload = await signIn(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    expect(await upload.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    r = await upload.submit();
    await noteSubmit(page, r);
  });
  await expected(async () => {
    // 遷移したことを見る期待結果なので、送信が止まって元の画面にいるときは合格にしない
    expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
    expect.soft(new URL(page.url()).pathname, "送信のあとの画面がセール用価格変更CSVアップロード画面").toBe(priceCsvUploadPath("セール用価格変更"));
    await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(new RegExp(`^\\s*${画面の見出し("セール用価格変更")}\\s*$`));
  });
});

// ---- 037: 雛形ファイル ----

caseTest("IT-M03-30-037", async ({ page, step, expected }) => {
  const dir = path.join(STATE_DIR, "m03-30", "downloads-037");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { force: true });
  const upload = await signIn(page);
  let suggested = "";
  let bytes = Buffer.alloc(0);
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    const download = await upload.downloadTemplate();
    suggested = download.suggestedFilename();
    await download.saveAs(path.join(dir, path.basename(suggested)));
  });
  await step(3, async () => {
    bytes = fs.readFileSync(path.join(dir, path.basename(suggested)));
    note(`ダウンロードしたファイルの名前は「${suggested}」。先頭の3バイトは「${bytes.subarray(0, 3).toString("hex")}」、全体は ${bytes.length} バイト。中身: ${JSON.stringify(decodeCsvBytes(bytes))}`);
  });
  await expected(async () => {
    expect.soft(suggested, "ファイル名").toBe("simple_price.csv");
    expect.soft(bytes.subarray(0, 3).toString("hex"), "先頭にバイト順マーク（UTF-8 の EF BB BF）").toBe("efbbbf");
    const text = decodeCsvBytes(bytes);
    const lines = text.replace(/(\r\n|\n|\r)$/, "").split(/\r\n|\n|\r/);
    expect.soft(lines.length, "見出し行だけ（1行）").toBe(1);
    expect.soft(parseCsv(text), "見出し行の列（商品ID・言語ID・基準価格・買取価格・原価単価）").toEqual([["商品ID", "言語ID", "基準価格", "買取価格", "原価単価"]]);
  });
});

// ---- 055・059: スマレジ連携フラグが変わらないこと ----

function smaregiUnchangedCase(caseNo: "055" | "059", file: string, before: string, after: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const classId = notes.get(`〔商品規格ID-M0330-${caseNo}〕`);
    const pre = price.商品規格(classId);
    expect(pre, `事前準備: 商品規格ID ${classId} がある`).not.toBeNull();
    expect(pre!.基準価格, "事前準備: 基準価格").toBe(before);
    expect(pre!.スマレジ連携フラグ, "事前準備: スマレジ連携フラグが無効").toBe(false);
    note(`取込の前の商品規格: ${JSON.stringify(pre)}`);
    const upload = await signIn(page);
    let got: price.商品規格の状態 | null = null;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(m0330FilePath(caseNo, file)); });
    await step(3, async () => { await uploadChosen(page, upload); });
    await step(4, async () => {
      got = price.商品規格(classId);
      note(`取込のあとの商品規格: ${JSON.stringify(got)}`);
    });
    await expected(async () => {
      expect(got, `商品規格ID ${classId} がある`).not.toBeNull();
      expect.soft(got!.基準価格, `基準価格が ${before} から ${after} に更新された`).toBe(after);
      expect.soft(got!.スマレジ連携フラグ, "スマレジ連携フラグが無効のまま").toBe(false);
    });
  };
}

caseTest("IT-M03-30-055", smaregiUnchangedCase("055", "smaregi-055.tsv", "200", "1000"));
caseTest("IT-M03-30-059", smaregiUnchangedCase("059", "smaregi-059.tsv", "200", "500"));
