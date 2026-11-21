/**
 * M06-02 古物台帳入力用CSV出力（追加分）。正本: cases/M06-02_test_cases.tsv（003）
 *
 * シードは seeds/m06-02-e.ts。作り方・読み替えは spec/m06/m06-02.spec.ts と同じ（買取店舗Aで代える・査定IDは画面が振った値）。
 */
import { Download, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";
import { CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { loginAdmin } from "../../lib/session";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { STORE_A } from "../../seeds/m06-01";
import { M0602_ADMIN } from "../../seeds/m06-02";
import "../../seeds/m06-02-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = { 見出し: string[]; 行: Record<string, string>[] };

async function csvを読む(file: Download): Promise<CSV> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const text = decodeCsvBytes(Buffer.concat(chunks));
  const 見出し = (text.split(/\r?\n/)[0] ?? "").split(",").map((t) => t.replace(/^"|"$/g, ""));
  return { 見出し, 行: csvRecords(text) };
}

caseTest("IT-M06-02-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0602_ADMIN);
  const list = new OtcListPage(page);
  const id = notes.get("〔査定ID-M0602-003〕");
  let csv: CSV = { 見出し: [], 行: [] };
  // 事前準備③: 査定ID・買取店舗・査定申込日時(From・To)=空欄・ステータス=未指定で検索して、この注文が検索結果に表示されている
  await step(1, async () => {
    await list.open();
    await list.査定IDを入れる(id);
    // 申込日時を過去へ移した買取と査定IDが重なることがあるので（査定IDは「その日・その店舗の件数＋1」）、申込者名（実行の印つきの姓）でも絞る
    await list.申込者名を入れる(notes.get("〔申込者の姓-M0602-003〕"));
    await list.買取店舗を選ぶ(STORE_A.店名);
    await list.日時を空にする();
    await list.検索する();
  });
  await step(2, async () => { await list.対象にする(id); });
  await step(3, async () => {
    const r = await list.ダウンロードを押す("古物台帳入力用CSV");
    expect(r.file, "古物台帳入力用CSVがダウンロードされる").not.toBeNull();
    csv = await csvを読む(r.file!);
    await list.ダウンロードの選択肢を閉じる();
    await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${r.file!.suggestedFilename()}`, 行: [csv.見出し, ...csv.行.map((x) => csv.見出し.map((k) => x[k] ?? ""))] }]);
  });
  await step(4, async () => { expect(csv.行.length, "CSVのデータ行").toBeGreaterThan(0); });
  await expected(async () => {
    const i = csv.行.findIndex((r) => r["査定ID"] === id);
    await expect.soft(CSVの枠のセル(page, 0, i, "査定ID"), "CSVの査定ID").toHaveText(id);
    await expect.soft(CSVの枠のセル(page, 0, i, "代金"), "CSVの代金").toHaveText("12500");
    await expect.soft(CSVの枠のセル(page, 0, i, "職業"), "CSVの職業").toHaveText("会社員");
    await expect.soft(CSVの枠のセル(page, 0, i, "事業者番号"), "CSVの事業者番号").toHaveText("T1234567890003");
  });
  note("店舗ID 1（共有の店舗）は、買取店舗A（使い回す試験用の店舗。店名は店舗のいまの値）で代えた。査定ID（正本の AS-M0602-001-003）は画面が振った値に読み替えた。ケースの事前準備の検索は、手順1（画面を開く）の中で行った。同じ査定IDの買取が複数あることがあるので、申込者名（実行の印つきの姓）でも絞った");
});
