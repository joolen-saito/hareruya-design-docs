/** M03-38 商品公開CSV登録。正本: cases/M03-38_test_cases.tsv */
import { test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import {
  CsvUploadResult, describeCsvUpload, FrontDetail, openFrontProductDetail, ProductCsvUploadScreen, 商品公開CSV登録,
} from "../../pages/admin/m03_38_product_status_csv";
import { M0338_ADMIN, M0338L_ADMIN, productNameOf, SHOP_PATH, statusCsvFile } from "../../seeds/m03-38";
import { 商品の公開状態, 商品公開CSVの取込履歴件数, 公開状態 } from "../../db/m03_38_w";
import { tamperToken } from "../../pages/admin/devtools";

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

// ---- 2026-11-20 追加: 商品公開CSVの取込（005・008〜011・015〜018・020・023・029〜031・039・040） ----
// 正本の「商品公開CSV履歴0件」は全員の取込履歴を全件削除することになるので行わず、取込の前後の履歴の件数（このファイル名のもの）を比べる。
// 公開状態は、アプリの値（1=公開・2=非公開・3=廃止）を正本の読み方（公開=1・それ以外=0）にして比べる。
const 読み替えの補い = "公開状態は、アプリの値（1=公開・2=非公開・3=廃止）を正本の読み方（公開=1・それ以外=0）にして比べた。商品公開CSV履歴0件は全員の履歴を消すことになるので行わず、取込の前後の履歴の件数（このファイル名のもの）が増えないこと／増えることで確かめた";

type 取込の状態 = { ids: string[]; 状態: 公開状態[]; 履歴: number };
const 状態を読む = (ids: string[], file: string): 取込の状態 => ({ ids, 状態: ids.map(商品の公開状態), 履歴: 商品公開CSVの取込履歴件数(file) });

async function 画面を開く(page: import("@playwright/test").Page): Promise<ProductCsvUploadScreen> {
  const csv = new ProductCsvUploadScreen(page, 商品公開CSV登録);
  await csv.open();
  return csv;
}
async function 取込のファイル(file: string) {
  const f = statusCsvFile(file);
  await test.info().attach(`アップロードしたファイル ${file}`, { body: f.bytes, contentType: "text/csv" });
  note(`${file} の内容: ${JSON.stringify(f.内容)}`);
  return f;
}
function 結果の注記(r: CsvUploadResult): void { note(`アップロードの結果: ${describeCsvUpload(r)}`); }

type 確かめ = { 種類: "更新"; 期待: number[][] } | { 種類: "変わらない"; 対象: string } | { 種類: "画面"; 画面名: string };
const 値 = (s: 公開状態) => [s.商品公開ステータス, s.支店の商品公開ステータス];

/** 手順1 画面を開く／2 ファイルを選ぶ／3 アップロードを押す／4 確認モーダルのOK／（5 DBで確認） */
function 取込を流す(file: string, labels: string[], m: 確かめ): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M0338_ADMIN);
    const ids = labels.map((l) => (l === "999999" ? "999999" : notes.get(l)));
    const 実在 = ids.filter((i) => i !== "999999");
    const f = await 取込のファイル(file);
    const before = 状態を読む(実在, file);
    note(`取込の前: ${JSON.stringify(before)}`);
    let csv!: ProductCsvUploadScreen; let r!: CsvUploadResult; let after = before;
    await step(1, async () => { csv = await 画面を開く(page); });
    await step(2, async () => { await csv.choose(f); });
    await step(3, async () => { r = await csv.pressUpload(); 結果の注記(r); });
    await step(4, async () => { note(`確認モーダル: ${r.確認モーダル ? "出て、確定した" : "出なかった"}`); });
    if (m.種類 !== "画面") await step(5, async () => { after = 状態を読む(実在, file); note(`取込の後: ${JSON.stringify(after)}`); });
    supplement(読み替えの補い);
    await expected(async () => {
      if (m.種類 === "更新") {
        expect.soft(r.上部のエラー, "画面上部にエラーが無い").toEqual([]);
        m.期待.forEach((v, i) => expect.soft(値(after.状態[i]), `商品ID ${labels[i]} の商品公開ステータス・支店の商品公開ステータスが ${v.join("・")} に更新される`).toEqual(v));
      } else if (m.種類 === "変わらない") {
        expect.soft(after.状態, `${m.対象}の2種類の公開ステータスが取込前から変わらない`).toEqual(before.状態);
        expect.soft(after.履歴, "取込履歴が追加されない（このファイル名の履歴の件数）").toBe(before.履歴);
      } else {
        note(`アップロードのあとの画面: ${r.移った画面}`);
        expect.soft(new URL(r.移った画面).pathname.endsWith(商品公開CSV登録.画面), `${m.画面名}へ遷移する`).toBe(true);
      }
    });
  };
}
const A = (n: string) => `〔商品ID-M0338-${n}〕`;
caseTest("IT-M03-38-005", 取込を流す("m03-38-valid-005.csv", [A("005A"), A("005B")], { 種類: "更新", 期待: [[1, 1], [0, 0]] }));
caseTest("IT-M03-38-009", 取込を流す("m03-38-shiftjis-009.csv", [A("009")], { 種類: "更新", 期待: [[1, 1]] }));
caseTest("IT-M03-38-010", 取込を流す("m03-38-valid-010.tsv", [A("010")], { 種類: "更新", 期待: [[1, 0]] }));
caseTest("IT-M03-38-011", 取込を流す("m03-38-bom-zwsp-011.csv", [A("011")], { 種類: "更新", 期待: [[0, 1]] }));
caseTest("IT-M03-38-015", 取込を流す("m03-38-size-max-015.csv", [A("015")], { 種類: "更新", 期待: [[1, 1]] }));
caseTest("IT-M03-38-016", 取込を流す("m03-38-size-over-016.csv", [A("016")], { 種類: "変わらない", 対象: "商品ID 〔…016〕" }));
caseTest("IT-M03-38-030", 取込を流す("m03-38-deleted-product-030.csv", [A("030")], { 種類: "変わらない", 対象: "商品ID 〔…030〕" }));
caseTest("IT-M03-38-029", 取込を流す("m03-38-unknown-product-029.csv", [A("029A"), A("029B")], { 種類: "変わらない", 対象: "商品ID 〔…029A〕と〔…029B〕" }));
caseTest("IT-M03-38-031", 取込を流す("m03-38-rollback-031.csv", [A("031A"), A("031B")], { 種類: "変わらない", 対象: "商品ID 〔…031A〕と〔…031B〕" }));
caseTest("IT-M03-38-039", 取込を流す("m03-38-later-required-039.csv", [A("039A"), A("039B"), A("039C")], { 種類: "変わらない", 対象: "商品ID 〔…039A〕〔…039B〕〔…039C〕" }));
caseTest("IT-M03-38-040", 取込を流す("m03-38-later-choice-040.csv", [A("040A"), A("040B"), A("040C")], { 種類: "変わらない", 対象: "商品ID 〔…040A〕〔…040B〕〔…040C〕" }));
caseTest("IT-M03-38-008", 取込を流す("m03-38-valid-008.csv", [A("008A"), A("008B")], { 種類: "画面", 画面名: "商品公開CSV登録画面" }));
caseTest("IT-M03-38-023", 取込を流す("m03-38-bad-header-023.csv", [A("023A"), A("023B")], { 種類: "画面", 画面名: "商品公開CSV取込画面" }));

// 020: ファイルを選ばずに押す
caseTest("IT-M03-38-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M0338_ADMIN);
  let csv!: ProductCsvUploadScreen; let r!: CsvUploadResult;
  await step(1, async () => { csv = await 画面を開く(page); });
  // ケースの手順は3つ（2. CSVファイルを選択せずアップロードを押す／3. 確認モーダルの「OK」を押す）。2026-11-21 手順の数をケースに合わせた
  await step(2, async () => { note("CSVファイルは選ばない"); r = await csv.pressUpload(); 結果の注記(r); });
  await step(3, async () => { note(`確認モーダル: ${r.確認モーダル ? "出て、確定した" : "出なかった・押す対象が無い"}`); });
  await expected(async () => {
    expect.soft(await csv.isOnScreen(), "商品公開CSV登録画面へ遷移する（画面のまま）").toBe(true);
  });
});

// 018: トークンを invalid-token にして取り込む
caseTest("IT-M03-38-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0338_ADMIN);
  const f = await 取込のファイル("m03-38-valid-018.csv");
  let csv!: ProductCsvUploadScreen; let r!: CsvUploadResult;
  await step(1, async () => { csv = await 画面を開く(page); await csv.choose(f); });
  await step(2, async () => { await tamperToken(csv.form, "invalid-token"); });
  await step(3, async () => { r = await csv.pressUpload(); 結果の注記(r); });
  await step(4, async () => { note(`確認モーダル: ${r.確認モーダル ? "出て、確定した" : "出なかった"}`); });
  void notes;
  await expected(async () => {
    note(`アップロードのあとの画面: ${r.移った画面}（応答 ${r.応答}）`);
    expect.soft(new URL(r.移った画面).pathname.endsWith(商品公開CSV登録.画面), "商品公開CSV取込画面（商品公開CSV登録画面）へ遷移する").toBe(true);
  });
});

// 017: トークンなし・不正・未対応の項目の3回の送信
caseTest("IT-M03-38-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0338_ADMIN);
  const file = "m03-38-valid-017.csv";
  const f = await 取込のファイル(file);
  const ids = ["〔商品ID-M0338-017A〕", "〔商品ID-M0338-017B〕"].map((l) => notes.get(l));
  const before = 状態を読む(ids, file); note(`取込の前: ${JSON.stringify(before)}`);
  let csv!: ProductCsvUploadScreen; let r!: CsvUploadResult; let after = before;
  const 送る = async (改ざん: () => Promise<void>) => { await 改ざん(); r = await csv.pressUpload(); 結果の注記(r); };
  await step(1, async () => { csv = await 画面を開く(page); await csv.choose(f); });
  await step(2, async () => { await 送る(() => tamperToken(csv.form, "なし")); });
  await step(3, async () => { csv = await 画面を開く(page); await csv.choose(f); });
  await step(4, async () => { await 送る(() => tamperToken(csv.form, "invalid-token")); });
  await step(5, async () => { csv = await 画面を開く(page); await csv.choose(f); });
  await step(6, async () => { await 送る(() => csv.form.evaluate((fm) => { const i = document.createElement("input"); i.type = "hidden"; i.name = "unsupported"; i.value = "1"; fm.appendChild(i); })); });
  await step(7, async () => { after = 状態を読む(ids, file); note(`取込の後: ${JSON.stringify(after)}`); });
  supplement(読み替えの補い);
  await expected(async () => {
    expect.soft(after.状態, "商品ID 〔…017A〕と〔…017B〕の2種類の公開ステータスが取込前から変わらない").toEqual(before.状態);
    expect.soft(after.履歴, "取込履歴が追加されない（このファイル名の履歴の件数）").toBe(before.履歴);
  });
});
