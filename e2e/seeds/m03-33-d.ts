/**
 * M03-33 セール用高額商品価格変更CSV登録の画面シード（その4。1つの商品に規格2つ・同じ商品コードの商品2件）。正本: cases/M03-33_seed_data.tsv
 * 作り方は seeds/m03-33-b.ts・-c.ts と同じ（グッズ商品CSV登録で商品を作り、商品規格登録編集画面で正本の状態にする。商品コードには実行ごとの印）。
 * - MULTI-007・008: 商品（規格A: 商品コード HP-MULTI-A-<番号>・NM）を作ったあと、商品規格一覧の「新規作成」で規格B（HP-MULTI-B-<番号>・SP）を足す。
 *   商品タグは、グッズ商品CSVのタグ(ID)に 1 を入れて作る（共有のタグは書き換えない）。
 * - TARGETS-044: 商品A（DUP-001-044）と商品B（DUP-001-044-2 で作り、商品規格登録編集画面で商品コードを DUP-001-044 に直す）。
 *   商品コードの重複を止める検査・索引は無い（開発環境の商品規格にも同じ商品コードの組が既にある）ので画面で作れる。
 * 補い（正本の外）: 取込ファイルは画面の雛形の見出し行の下にデータ行を入れる。044 はシード表にデータ行が無いので、同じ機能の他のケース（041・042）と同じ
 * 「価格1200・700、セール1、帯URL空、タグ空、スマレジ連携0」にした。
 */
import { 商品のタグ } from "../db/m03_13_x";
import { 商品規格の状態 } from "../db/m03_32_high_price";
import { csvLine } from "../lib/csv";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { addClass, openClassEdit, openClassList } from "../pages/admin/m03_30_products";
import { createHighPriceGoods, expectNoSameNameHistory } from "./m03-32";
import { dataRowInSeed, expectInSeed, M0333_ADMIN, templateHeader, writeRuntime } from "./m03-33";
import "./m03-33-b"; // S-M03-33-TAGS（参照だけのタグのマスタ）はここで定める

const 空 = (row: string): string => row.replace(/空/g, "");
const csvRow = (header: string[], row: string): string => `${csvLine(header)}\n${row}\n`;
const NEED = ["S-M03-33-ADM", "S-M03-33-TAGS"];

function multiSeed(n: string, file: string): void {
  defineSeed(`S-M03-33-MULTI-${n}`, { needs: NEED }, async ({ browser, seed, notes }) => {
    const seedId = seed.シードID;
    const a = rc(`HP-MULTI-A-${n}`);
    const b = rc(`HP-MULTI-B-${n}`);
    expectInSeed(seedId, [`商品コード=HP-MULTI-A-${n}・HP-MULTI-B-${n}`, "両規格とも削除なし・高額商品コードあり・基準価格1500・販売価格1500・買取価格600・セール無効", "商品タグは取込前タグだけ"]);
    const row = 空(dataRowInSeed(seedId, file)).replace(`HP-MULTI-A-${n}`, a);
    await withAdminSession(browser, M0333_ADMIN, async (page) => {
      const header = await templateHeader(page, seedId);
      writeRuntime(file, csvRow(header, row));
      await expectNoSameNameHistory(page, "セール用高額商品価格変更", seedId, file);
      await createHighPriceGoods(page, seedId, {
        商品コード: a, 商品名: `M0333-${n}`, タグ: "1",
        CSV: { 基準価格: "1500", 販売価格: "1500", 買取価格: "600" },
        規格: { 高額商品コード: a, セール: false, 基準価格: "1500", 販売価格: "1500", 買取価格: "600" },
      }, { 商品ID: `〔商品ID-M0333-${n}〕`, 商品規格ID: `〔商品規格ID-M0333-${n}A〕` }, notes);
      const productId = notes.get(`〔商品ID-M0333-${n}〕`);
      await openClassList(page, productId);
      const idB = await addClass(page, productId, {
        言語: "日本語", 状態: "スライトリープレイド", 商品コード: b, 基準価格: "1500", 販売価格: "1500", 買取価格: "600", 高額商品コード: b,
      }, `${seedId}: 規格B 商品コード ${b}`, (m) => reportSeedIssue(seedId, m));
      notes.set(`〔商品規格ID-M0333-${n}B〕`, idB);
      // 作ったあと、規格Bとタグがシード表の状態になっていることをDBの参照で確かめる（違えばケースの前提が崩れるので止める）
      const s = 商品規格の状態(idB);
      const got = s && { 基準価格: s.基準価格, 販売価格: s.販売価格, 買取価格: s.買取価格, セール: s.セール, 高額商品コード: s.高額商品コード ?? "" };
      const want = { 基準価格: "1500", 販売価格: "1500", 買取価格: "600", セール: false, 高額商品コード: b };
      if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${seedId}: 登録した規格Bが ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）`);
      const tags = 商品のタグ(productId);
      if (JSON.stringify(tags) !== JSON.stringify(["1"])) throw new Error(`${seedId}: 商品のタグが ${tags.join(",") || "なし"}（シード表は取込前タグだけ＝タグID 1）`);
    });
    reportSeedIssue(seedId, `同名取込履歴0件: 画面のCSVインポート履歴に ${file} の行が無いことを確かめた。取込ファイルは画面の雛形の見出し行の下にシード表のデータ行を入れた`);
    reportSeedIssue(seedId, "規格Bは、商品規格一覧の「新規作成」で言語日本語・状態SPとして登録した（正本の手順どおり）。商品コードは実行の印つき");
  });
}
multiSeed("007", "tags_replace-007.csv");
multiSeed("008", "tags_empty-008.csv");

defineSeed("S-M03-33-TARGETS-044", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  const seedId = seed.シードID;
  const file = "duplicate_product_code-044.csv";
  const code = rc("DUP-001-044");
  const second = rc("DUP-001-044-2");
  expectInSeed(seedId, ["duplicate_product_code-044.csvは価格1200・700、セール1を指定", "2件とも商品コード=DUP-001-044"]);
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const header = await templateHeader(page, seedId);
    writeRuntime(file, csvRow(header, `${code},1200,700,1,,,0`));
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seedId, file);
    for (const [x, c] of [["A", code], ["B", second]] as const) {
      await createHighPriceGoods(page, seedId, {
        商品コード: c, 商品名: `M0333-044${x}`,
        CSV: { 基準価格: "1500", 販売価格: "1500", 買取価格: "600" },
        規格: { 高額商品コード: code, セール: false, 基準価格: "1500", 販売価格: "1500", 買取価格: "600" },
      }, { 商品ID: `〔商品ID-M0333-044${x}〕`, 商品規格ID: `〔商品規格ID-M0333-044${x}〕` }, notes);
    }
    // 商品B: 商品規格登録編集画面で商品コードを DUP-001-044 に直して登録する
    const productIdB = notes.get("〔商品ID-M0333-044B〕");
    const classIdB = notes.get("〔商品規格ID-M0333-044B〕");
    await openClassList(page, productIdB);
    await openClassEdit(page, productIdB, classIdB);
    await page.locator("form#form #admin_product_class_code").fill(code);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
    for (const w of await expectSaved(page, `${seedId}: 商品Bの商品コードの登録`)) reportSeedIssue(seedId, `商品Bの商品コードの登録で出た警告「${w}」`);
    // 2件とも同じ商品コードで、シード表の状態になっていること
    for (const [x, id] of [["A", notes.get("〔商品規格ID-M0333-044A〕")], ["B", classIdB]] as const) {
      const s = 商品規格の状態(id);
      const got = s && { 商品コード: s.商品コード, 基準価格: s.基準価格, 販売価格: s.販売価格, 買取価格: s.買取価格, セール: s.セール, 高額商品コード: s.高額商品コード ?? "" };
      const want = { 商品コード: code, 基準価格: "1500", 販売価格: "1500", 買取価格: "600", セール: false, 高額商品コード: code };
      if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${seedId}: 商品${x}の商品規格が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）`);
    }
  });
  reportSeedIssue(seedId, `同名取込履歴0件: 画面のCSVインポート履歴に ${file} の行が無いことを確かめた。商品Bは商品コード ${second} で作り、商品規格登録編集画面で ${code} に直した（正本の手順どおり）`);
  reportSeedIssue(seedId, "044 のデータ行はシード表に無いので、価格1200・700、セール1、帯URL・タグは空、スマレジ連携0とした（041・042 と同じ）");
});
