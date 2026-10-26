/** M03-38 商品公開CSV登録。正本: cases/M03-38_test_cases.tsv */
import { test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import {
  CsvUploadResult, describeCsvUpload, FrontDetail, openFrontProductDetail, ProductCsvUploadScreen, 商品公開CSV登録,
} from "../../pages/admin/m03_38_product_status_csv";
import { M0338_ADMIN, M0338L_ADMIN, productNameOf, SHOP_PATH, statusCsvFile } from "../../seeds/m03-38";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 合否が正本の外の補いの上に成り立つことを、報告に分けて出す（記録で「条件付き合格」に分ける） */
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 雛形の見出し（設計書 M03-38 の商品公開CSVフォーマット 識別ID 1〜3。L0125〜L0127） */
const TEMPLATE_HEADERS = ["商品ID", "商品公開ステータス", "支店の商品公開ステータス"];
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

// ---- 004 雛形ファイルダウンロード ----

caseTest("IT-M03-38-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M0338_ADMIN);
  const csv = new ProductCsvUploadScreen(page, 商品公開CSV登録);
  let file: { fileName: string; bytes: Buffer } | null = null;
  let descriptions: string[] = [];
  let text = "";
  await step(1, async () => {
    await csv.open();
    descriptions = (await csv.itemDescriptions()).map((d) => d.説明).filter(Boolean);
    note(`画面の雛形ファイル項目説明の説明文: ${JSON.stringify(descriptions)}`);
  });
  await step(2, async () => { file = await csv.downloadTemplate(); });
  await step(3, async () => {
    if (!file) throw new Error("雛形ファイルをダウンロードしていない");
    const f: { fileName: string; bytes: Buffer } = file;
    await test.info().attach(`ダウンロードしたファイル ${f.fileName}`, { body: f.bytes, contentType: "text/csv" });
    text = new TextDecoder("utf-8").decode(f.bytes.subarray(f.bytes.subarray(0, 3).equals(BOM) ? 3 : 0));
    note(`ダウンロードしたファイル名: ${f.fileName}。内容（BOMを除く）: ${JSON.stringify(text)}`);
  });
  await expected(async () => {
    const f = file as unknown as { fileName: string; bytes: Buffer };
    expect.soft(f.fileName, "ダウンロードしたファイルの名称").toBe("product_status.csv");
    expect.soft(f.bytes.subarray(0, 3).equals(BOM), "先頭にBOM（EF BB BF）がある").toBe(true);
    const lines = text.split(/\r\n|\n|\r/).filter((l, i, a) => !(i === a.length - 1 && l === ""));
    expect.soft(lines.length, "行は見出し行の1行だけ").toBe(1);
    expect.soft(lines[0], "見出し行は設定値のカンマで区切られた3項目").toBe(TEMPLATE_HEADERS.join(","));
    expect.soft(parseCsv(text)[0], "見出し行の項目").toEqual(TEMPLATE_HEADERS);
    for (const d of descriptions) expect.soft(text.includes(d), `画面の項目説明文「${d}」をファイルに含まない`).toBe(false);
  });
});

// ---- 034〜037・046・047 公開側の表示との連携 ----

type FrontCheck = { 店: keyof typeof SHOP_PATH; 表示: boolean };

/**
 * 正本の手順: 1 商品公開CSV登録画面でCSVを選び、アップロードを押して確認モーダルを確定する／2 画面上部に「登録が完了しました。」と
 * 表示されることを確かめる／3（・4）公開側の商品詳細画面で商品IDを指定して開く。期待結果: 各店の画面に商品詳細が表示される・されない。
 */
function publishLink(file: string, label: string, checks: FrontCheck[]): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    const id = notes.get(label);
    const name = productNameOf(label);
    await loginAdmin(page, M0338L_ADMIN);
    const csv = new ProductCsvUploadScreen(page, 商品公開CSV登録);
    let r: CsvUploadResult | null = null;
    await step(1, async () => {
      const f = statusCsvFile(file);
      await test.info().attach(`アップロードしたファイル ${file}`, { body: f.bytes, contentType: "text/csv" });
      note(`${file} の内容: ${JSON.stringify(f.内容)}`);
      await csv.open();
      r = await csv.upload(f);
      note(`${file} のアップロードの結果: ${describeCsvUpload(r)}`);
      if (!r.確認モーダル) {
        supplement("「CSVファイルのアップロード」を押しても確認モーダルが出ず（画面に無い）、確定の操作はできなかった。送信はそのまま進み、取込の結果の画面を確かめて続けた");
      }
      expect(r.送信した, "アップロードが送信された").toBe(true);
    });
    await step(2, async () => {
      const got = r as unknown as CsvUploadResult;
      expect.soft(got.上部の成功, "画面上部に「登録が完了しました。」が表示される").toContain("登録が完了しました。");
      expect.soft(got.上部のエラー, "画面上部にエラーが無い").toEqual([]);
    });
    const seen: Record<string, FrontDetail> = {};
    for (const [i, c] of checks.entries()) {
      await step(3 + i, async () => {
        seen[c.店] = await openFrontProductDetail(browser, SHOP_PATH[c.店], id, name);
        note(`${c.店}（${SHOP_PATH[c.店]}/）の商品詳細画面: ${JSON.stringify(seen[c.店])}`);
      });
    }
    supplement("公開側の商品詳細画面は、管理画面にログインしていない新しいブラウザセッションで開いた（管理画面にログインしたセッションでは、アプリは公開状態にかかわらず商品詳細を表示するため）");
    await expected(async () => {
      for (const c of checks) {
        const d = seen[c.店];
        if (c.表示) {
          expect.soft(d.応答, `${c.店}の商品詳細画面の応答が200`).toBe(200);
          expect.soft(d.商品名が見える, `「${name}」の商品詳細が${c.店}の画面に表示される`).toBe(true);
        } else {
          expect.soft(d.応答, `${c.店}の商品詳細画面がシステムエラーではない（応答 ${d.応答}）`).toBeLessThan(500);
          expect.soft(d.商品名が見える, `「${name}」の商品詳細が${c.店}の画面に表示されない（応答 ${d.応答}）`).toBe(false);
        }
      }
    });
  };
}

caseTest("IT-M03-38-034", publishLink("公開確認-L001.csv", "〔商品ID-M0338-034〕", [{ 店: "本店", 表示: false }]));
caseTest("IT-M03-38-035", publishLink("公開確認-L002.csv", "〔商品ID-M0338-035〕", [{ 店: "TC大阪支店", 表示: true }]));
caseTest("IT-M03-38-036", publishLink("公開確認-L003.csv", "〔商品ID-M0338-036〕", [{ 店: "TC大阪支店", 表示: false }]));
caseTest("IT-M03-38-037", publishLink("公開確認-L004.csv", "〔商品ID-M0338-037〕", [{ 店: "TC大阪支店", 表示: false }]));
caseTest("IT-M03-38-046", publishLink("cbm0338-046.csv", "〔商品ID-M0338-046〕", [{ 店: "本店", 表示: false }, { 店: "TC大阪支店", 表示: false }]));
caseTest("IT-M03-38-047", publishLink("cbm0338-047.csv", "〔商品ID-M0338-047〕", [{ 店: "本店", 表示: true }, { 店: "TC大阪支店", 表示: true }]));
