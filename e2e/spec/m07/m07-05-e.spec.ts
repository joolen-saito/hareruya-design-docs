/**
 * M07-05 入金CSV出力 のうち、あとから足したケース（002）。正本: cases/M07-05_test_cases.tsv
 * 既存の spec/m07/m07-05.spec.ts は変えず、同じ部品で書き足した（シードは seeds/m07-05-e.ts）。
 * 実装していないケース（013・014）: CSV出力設定を共有の設定から区切り文字タブ・文字コード SJIS-win へ書き換えるケースのため（記録 review/M07_unwritten_2026-11-24_dev.md）。
 * CSV出力設定（UTF-8・カンマ・二重引用符）は書き換えず、いまの設定のまま読む。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { M0701ListPage } from "../../pages/admin/m07_01_list";
import { 検索して件数を確かめる } from "../../pages/admin/m07_02_csv";
import { M0705_ADMIN } from "../../seeds/m07-05";
import "../../seeds/m07-05-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 番 = (n: string) => String(Number(n));

caseTest("IT-M07-05-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0705_ADMIN);
  const l = new M0701ListPage(page);
  const id = notes.get("〔買取注文ID-M0705-002〕");
  // 事前準備⑥: 検索条件をクリアし、買取番号だけで検索して結果が1件であることを確かめる
  await 検索して件数を確かめる(l, { 買取番号: id }, 1);
  let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
  await step(1, async () => { await expect(l.結果の欄(), "買取一覧(検索結果)画面の結果").toBeVisible(); });
  await step(2, async () => { await l.対象にする(id); });
  await step(3, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    expect(r.file, `入金CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    csv = await CSVを読む(r.file!);
    await l.ダウンロードの選択肢を閉じる();
    await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${r.file!.suggestedFilename()}`, 行: CSVの全行(csv) }]);
  });
  let 行 = -1;
  await step(4, async () => { 行 = csv!.行.findIndex((x) => 番(x["受注番号"] ?? "") === 番(id)); });
  await expected(async () => {
    expect.soft(行, "CSVに買取番号の行がある").toBeGreaterThanOrEqual(0);
    const c = (列: string) => CSVの枠のセル(page, 0, 行, 列);
    await expect.soft(c("受注番号"), "受注番号").toHaveText(new RegExp(`^0*${番(id)}$`));
    await expect.soft(c("送料"), "送料（800）").toHaveText(/^800(\.0+)?$/);
    await expect.soft(c("査定額"), "査定額（受理合計価格 12000）").toHaveText(/^12000(\.0+)?$/);
    await expect.soft(c("銀行名"), "銀行名（銀行コード 0001）").toHaveText("0001");
    await expect.soft(c("支店名"), "支店名（支店コード 001）").toHaveText("001");
    await expect.soft(c("口座種別"), "口座種別（1）").toHaveText("1");
    await expect.soft(c("口座番号"), "口座番号（0012345）").toHaveText("0012345");
    await expect.soft(c("受取人口座名義"), "受取人口座名義").toHaveText("ﾊﾚﾙﾔ ﾀﾛｳ");
    await expect.soft(c("振込金額"), "振込金額（送料＋査定額 12800）").toHaveText(/^12800(\.0+)?$/);
    await expect.soft(c("オンライン本人確認区分"), "オンライン本人確認区分").toHaveText("オンライン本人確認済み");
  });
  note("送料・受理合計価格・明細金額・銀行口座の値は画面で決められないので、シードが、実行の印つきの買取・銀行口座にDBで書いた（買取番号は画面が振った番号）。CSV出力設定は共有の設定のため書き換えず、いまの設定（UTF-8・カンマ）のまま読んだ");
});
