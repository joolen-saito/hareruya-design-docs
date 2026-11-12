/**
 * M06-01 買取一覧(検索入力・検索結果)。正本: cases/M06-01_test_cases.tsv（spec/m06/m06-01-db.spec.ts の続き）
 *
 * 実装したのは 002・054・081。シードは seeds/m06-01-card.ts（商品はカード商品CSV登録で作った印つきのカード商品）。
 *
 * 実装しないケースと理由（スキップ候補）:
 * - 015・020・022・024: 共有の開発環境にある他の買取（約33万件）を削除する・「ほかにその条件の買取がない」前提を作る必要がある
 * - 033: 12001件の大量データを残す
 * - 039: 削除済みのメンバーが履歴に残る状態は、外部キー制約のため作れない
 * - 045・082: 買取商品CSVの「部分キャンセルされた明細」を表す持ち方がアプリに無く、前提を作れない
 * - 047: 状態を持たない通常商品はグッズ商品（サプライ品）でしか作れず、グッズ商品CSVは使わない（ECCUBE_HARERUYA-3966）
 * - 049: 個別入力明細（状態なし）のDB書き込みの列が確認できない
 * - 053・080: 戻しリストの棚番ソートは本店（店舗ID 1）だけの挙動。正本の買取店舗Aは新しく作った店舗で、本店の高額商品閾値・棚番号は共有の設定
 *
 * 決め打ちの識別の値（申込者名・商品名）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { Download, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, csvRecords } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 戻しリストを読む } from "../../pages/admin/m07_buy";
import { M0601_ADMIN_ALL } from "../../seeds/m06-01";
import "../../seeds/m06-01-card";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function csvを読む(file: Download): Promise<Record<string, string>[]> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return csvRecords(decodeCsvBytes(Buffer.concat(chunks)));
}

const 棚の注記 = "棚番号は、共有のマスタに行を足さず、既存の棚番号のうち並び順の違う2つ（日本語=大きい方〔棚99の代わり〕、英語=小さい方〔棚1の代わり〕）を使った。買取店舗Bの金額閾値は共有の設定なので変えていない（2商品は同じ金額帯の300円）";

// 002: 既定表示件数
caseTest("IT-M06-01-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.日時を空にする(); await list.検索する(); });
  await expected(async () => {
    expect.soft(await list.表示件数の選択を読む(), "表示件数の選択（設定の既定値）").toBe("50件");
  });
  note("既定表示件数を50件に設定する事前準備は共有の設定なので行わず、アプリの現在の値を確かめた");
});

// 054: 支店の戻しリストCSVは棚番号で並べ替えない
caseTest("IT-M06-01-054", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-054〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  let records: Record<string, string>[] = [];
  await step(1, async () => { await list.open(); await list.査定IDを入れる(id); await list.日時を空にする(); await list.検索する(); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストCSV"); });
  await step(4, async () => { records = await csvを読む(r!.file!); });
  await expected(async () => {
    const 名 = records.map((x) => x["商品名"] ?? "");
    const 位置 = (n: string) => 名.findIndex((x) => x.includes(rc(n)));
    expect.soft(位置("RS-B01-054"), "CSVに出力された日本語商品（RS-B01-054）の位置").toBeGreaterThanOrEqual(0);
    expect.soft(位置("RS-B02-054"), "CSVに出力された英語商品（RS-B02-054）の位置").toBeGreaterThanOrEqual(0);
    expect.soft(位置("RS-B01-054"), "日本語商品が英語商品より先に出力される（支店の棚番号では並べ替えない）").toBeLessThan(位置("RS-B02-054"));
  });
  note(`商品名・申込者名は実行の印を付けた値。${棚の注記}`);
});

// 081: 支店の戻しリストPDFは棚番号で並べ替えない
caseTest("IT-M06-01-081", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0601_ADMIN_ALL);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0601-081〕");
  let r: Awaited<ReturnType<OtcListPage["ダウンロードを押す"]>> | undefined;
  let 商品名: string[] = [];
  await step(1, async () => { await list.open(); await list.査定IDを入れる(id); await list.日時を空にする(); await list.検索する(); });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => { r = await list.ダウンロードを押す("戻しリストPDF"); });
  await step(4, async () => {
    expect(r!.popup, "戻しリストPDFのページ（別ウィンドウ）が開いた").not.toBeNull();
    商品名 = (await 戻しリストを読む(r!.popup!)).行.map((x) => x.商品名.trim());
  });
  await expected(async () => {
    const 位置 = (n: string) => 商品名.findIndex((x) => x === rc(n));
    expect.soft(位置("M0601-CB081-A"), "PDFに出力された日本語商品（M0601-CB081-A）の位置").toBeGreaterThanOrEqual(0);
    expect.soft(位置("M0601-CB081-B"), "PDFに出力された英語商品（M0601-CB081-B）の位置").toBeGreaterThanOrEqual(0);
    expect.soft(位置("M0601-CB081-A"), "日本語商品が英語商品より先に出力される（支店の棚番号では並べ替えない）").toBeLessThan(位置("M0601-CB081-B"));
  });
  note(`商品名・申込者名は実行の印を付けた値。${棚の注記}`);
});
