/**
 * M10-13 カスタムCSV出力設定 の残りのシード（IT-M10-13-006〜015・018・025・026・029・030・034・035・038〜041 が使うもの）。正本: cases/M10-13_seed_data.tsv
 *
 * 読み替え（依頼者方針 2026-11-10: 既存の項目・画面で作ったデータへの読み替えでよい）:
 * - 出力項目の名前: 正本の「CSV商品コード」などは、出力項目をDBで揃えるシード（FIELDS）が付ける名前で、画面には無い。
 *   画面にある同じ位置づけの項目に読み替える（共有のマスタに試験の項目は足さない）。
 *     CSV公開状態 → 公開ステータス名称、CSV商品コード → 商品コード、CSV商品名 → 商品名(日)、CSV商品ID → 商品ID、CSV在庫コード → 商品コード（在庫CSV）、
 *     受注検索CSV の CSV受注番号 → 注文番号（受注CSV）、配送検索CSV の CSV配送番号 → 出荷ID（配送CSV）。
 *   BASE-006 だけは、ケースが「有効・無効の両方が含まれる」ことを確かめるので、無効の項目「送料」を CSV公開状態の代わりにする。
 * - 定義の名称・商品コード・商品名は実行の印つき（rc）。流し直しても前の実行の分とぶつからない。
 * - 在庫移動・振替CSV・在庫分割結合CSV には出力項目が1件も無く、試験の項目を共有のマスタへ足さない方針なので、定義の出力項目は0件のまま作る（040・041。036・037 は実装しない）。
 * - 受注・配送の検索対象（受注ID 10139201 など）は、受注を作る手段が無く（受注CSVは明細ごとに1行）作らない。受注検索CSV・配送検索CSVの定義だけ作る（027・028・031 は実装しない）。
 * - 東京本店・在庫場所EC-CUBEの在庫明細（034・035）: グッズ商品CSV登録で作った印つきの商品の、本店・在庫場所EC-CUBEの在庫の行（在庫0）で代える。
 * - CSV文字コード・区切り文字（APP-CONFIG）: 共有の設定なので書き換えない。ケースがダウンロードしたCSVの実際で確かめる。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 商品IDを読む, 無効な出力項目名 } from "../db/m10_13";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { CustomCsvPage } from "../pages/admin/m10_13_custom_csv";
import { readSupplyGoodsCategoryId } from "../pages/admin/m04_17_seed_ops";
import { readLanguageId, uploadGoods } from "../pages/admin/m04_16_recommend_csv";
import { ensureAnalysisAdmin } from "./m12-common";
import "./m10-13";
import "./m10-13-b";

export const M1013L_ADMIN: Account = { loginId: "m1013l_admin", password: "Passw0rd!M1013L" };
const NEEDS = ["S-M10-13-ADM", "S-M10-13-MASTER"];

export const 既存商品名 = (n: string) => rc(`既存商品CSV-${n}`);
export const 商品検索CSV名 = () => rc("商品検索CSV");
export const 商品コードP = (n: "001" | "002") => rc(`CSV-P-${n}`);
export const 商品コード039 = (x: "A" | "B") => rc(`CSV-P-M1013-039${x}`);
export const 在庫商品コード = (n: "001" | "002") => rc(`M1013L-STK-${n}`);

const 読み替え = "出力項目は、正本の「CSV公開状態」「CSV商品コード」（出力項目をDBで揃えるシードが付ける名前で画面に無い）の代わりに、画面にある「公開ステータス名称」「商品コード」にした";

/** 画面の項目名から、画面の「CSV出力しない項目」に項目があることを確かめる（共有のマスタは触らない） */
async function 項目があることを確かめる(browser: Browser, seedId: string, 種別: string, 項目: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new CustomCsvPage(page);
    await p.open(種別);
    const all = [...(await p.出力しない項目名()), ...(await p.出力する項目名())];
    const missing = 項目.filter((x) => !all.includes(x));
    if (missing.length) throw new Error(`${seedId}: カスタムCSV出力設定（CSV種別ID ${種別}）の項目に ${missing.join("・")} が無い（ある項目: ${all.slice(0, 20).join("、")}…）`);
  });
}

defineSeed("S-M10-13-FIELDS", async ({ browser, seed }) => {
  await 項目があることを確かめる(browser, seed.シードID, "1", ["公開ステータス名称", "商品コード", "商品名(日)", "商品ID", "送料", "税率"]);
  await 項目があることを確かめる(browser, seed.シードID, "10", ["商品コード", "商品ID", "商品名"]);
  // 006 は「有効・無効の両方」を確かめる。無効の項目「送料」「税率」と有効の項目「商品コード」「商品ID」であることを、参照で確かめる
  const 無効 = 無効な出力項目名("1");
  for (const x of ["送料", "税率"]) if (!無効.includes(x)) throw new Error(`${seed.シードID}: 商品CSVの項目「${x}」が無効になっていない（006 の前提）`);
  for (const x of ["商品コード", "商品ID"]) if (無効.includes(x)) throw new Error(`${seed.シードID}: 商品CSVの項目「${x}」が無効になっている（006 の前提）`);
  await 項目があることを確かめる(browser, seed.シードID, "3", ["注文番号"]);
  await 項目があることを確かめる(browser, seed.シードID, "4", ["出荷ID"]);
  reportSeedIssue(seed.シードID, "出力項目はDBで揃える作り方だが、共有のマスタに試験の項目は足さず、画面にある項目（商品CSV: 公開ステータス名称・商品コード・商品名(日)・商品ID、在庫CSV: 商品コード・商品ID・商品名、受注CSV: 注文番号、配送CSV: 出荷ID）があることを確かめて読み替えた");
});

defineSeed("S-M10-13-APP-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "CSV文字コード・区切り文字は共有の設定なので書き換えない。ケースが、ダウンロードしたCSVの実際の文字コードと区切り文字で確かめる");
});

/** 定義を実行の印つきで作る（出力項目は渡した順） */
async function 定義を作る(browser: Browser, csvTypeId: string, 名前: string, 項目: string[], what: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return new CustomCsvPage(page).新規作成して設定する(csvTypeId, 名前, 項目, what);
  });
}

async function 商品を作る(browser: Browser, seedId: string, lines: { code: string; name: string }[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readSupplyGoodsCategoryId(page);
    const 言語ID = await readLanguageId(page, "日本語");
    await uploadGoods(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId, onIssue: (m) => reportSeedIssue(seedId, m),
      lines: lines.map((l) => ({ 商品コード: l.code, 商品名: l.name, 言語ID })),
    });
  });
}

// ---- 既存の定義（商品CSV）----
for (const n of ["006", "007", "008", "010", "011", "012", "013", "014", "015", "018", "025"]) {
  defineSeed(`S-M10-13-BASE-${n}`, { needs: NEEDS }, async ({ browser, notes, seed }) => {
    // 006 は「有効・無効の両方が出力する項目に含まれる」ことを確かめるので、無効の項目「送料」を CSV公開状態の代わりにする
    const 項目 = n === "006" ? ["送料", "商品コード"] : ["公開ステータス名称", "商品コード"];
    notes.set(`〔カスタム定義ID-M1013-${n}${n === "008" ? "A" : ""}〕`, await 定義を作る(browser, "1", 既存商品名(n), 項目, `${seed.シードID} の定義「${既存商品名(n)}」`));
    if (n === "008") {
      notes.set("〔カスタム定義ID-M1013-008B〕", await 定義を作る(browser, "1", rc("商品CSV予備-008"), [], `${seed.シードID} の定義「商品CSV予備-008」`));
    }
    reportSeedIssue(seed.シードID, n === "006"
      ? "出力順は、正本の「CSV公開状態」「CSV商品コード」の代わりに、画面にある無効の項目「送料」と有効の項目「商品コード」にした（ケースが有効・無効の両方を確かめるため）"
      : 読み替え);
  });
}

// ---- 事前に定義が要らないもの（名称は実行の印つきで、前の実行の分と重ならない）----
defineSeed("S-M10-13-BASE-009", { needs: NEEDS }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "在庫CSVの出力項目 CSV在庫コード（DBで設定）は、共有のマスタに足さず、画面にある在庫CSVの項目「商品コード」で代える。定義の名称「在庫CSV設定A1」は実行の印つきにするので、存在しない状態は作らなくてよい");
});
defineSeed("S-M10-13-RESAVE-038", { needs: NEEDS }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "定義の名称「再保存CSV-M1013-038」は実行の印つきにするので、存在しない状態は作らなくてよい。出力項目は画面にある「商品コード」「商品ID」で代える");
});

// ---- 商品検索CSV・商品（共有）----
defineSeed("S-M10-13-EXPORT", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  notes.set("〔カスタム定義ID-M1013-共有A〕", await 定義を作る(browser, "1", 商品検索CSV名(), ["商品コード", "商品名(日)"], `${seed.シードID} の商品検索CSV`));
  notes.set("〔カスタム定義ID-M1013-共有B〕", await 定義を作る(browser, "3", rc("受注検索CSV"), ["注文番号"], `${seed.シードID} の受注検索CSV`));
  notes.set("〔カスタム定義ID-M1013-共有C〕", await 定義を作る(browser, "4", rc("配送検索CSV"), ["出荷ID"], `${seed.シードID} の配送検索CSV`));
  await 商品を作る(browser, seed.シードID, [
    { code: 商品コードP("001"), name: "CSV出力確認商品A" },
    { code: 商品コードP("002"), name: "CSV出力確認商品B" },
  ]);
  notes.set("〔商品ID-M1013-共有A〕", 商品IDを読む(商品コードP("001")));
  notes.set("〔商品ID-M1013-共有B〕", 商品IDを読む(商品コードP("002")));
  reportSeedIssue(seed.シードID, "出力項目は、商品検索CSVは「商品コード」「商品名(日)」、受注検索CSVは「注文番号」、配送検索CSVは「出荷ID」にした。商品の規格の部門・公開ステータスの個別の設定はしていない（取り込みの結果のまま）");
  reportSeedIssue(seed.シードID, "受注ID 10139201・10139202 の受注と配送ID 10139301・10139302 の配送は作っていない（受注を作る手段が無く、受注CSVは明細ごとに1行出るため）。受注・配送を出力するケースは実装していない");
});

defineSeed("S-M10-13-MULTI-039", { needs: NEEDS }, async ({ browser, seed }) => {
  await 定義を作る(browser, "1", rc("複数件CSV-M1013-039"), ["商品コード"], `${seed.シードID} の定義`);
  await 商品を作る(browser, seed.シードID, [
    { code: 商品コード039("A"), name: "CSV出力複数件確認商品A" },
    { code: 商品コード039("B"), name: "CSV出力複数件確認商品B" },
  ]);
  reportSeedIssue(seed.シードID, "出力項目は、正本の「CSV商品コード」の代わりに、画面にある「商品コード」にした。商品の規格の部門・公開ステータスの個別の設定はしていない");
});

// ---- 在庫CSV（034・035）----
defineSeed("S-M10-13-L-ADM", async ({ browser, seed }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-13連携試験管理者", account: M1013L_ADMIN, メール: "m1013l_admin@example.test" });
  reportSeedIssue(seed.シードID, "権限はシステム管理者、所属店舗は本店にした（正本の「東京本店」は店舗の名前を書き換えないので本店で代える）");
});
defineSeed("S-M10-13-L-MASTER", async ({ browser, seed }) => {
  await 項目があることを確かめる(browser, seed.シードID, "10", ["商品ID", "商品名"]);
  reportSeedIssue(seed.シードID, "CSV種別の6種と在庫CSVの出力項目「商品ID」「商品名」は、共有のマスタを書き換えず、画面にあることを確かめた。東京本店は本店、在庫場所EC-CUBEは在庫の行の場所で代える");
});
defineSeed("S-M10-13-L-STOCK-034", { needs: ["S-M10-13-L-ADM", "S-M10-13-L-MASTER"] }, async ({ browser, seed }) => {
  await 商品を作る(browser, seed.シードID, [{ code: 在庫商品コード("001"), name: "連携在庫商品-001" }]);
  reportSeedIssue(seed.シードID, "在庫明細は、DBで商品ID 913001001 を作る代わりに、グッズ商品CSV登録で作った印つきの商品（商品コード・規格）の在庫の行（在庫0）で代えた");
});
defineSeed("S-M10-13-L-STOCK-035", { needs: ["S-M10-13-L-ADM", "S-M10-13-L-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, [{ code: 在庫商品コード("002"), name: "連携在庫商品-002" }]);
  notes.set("〔カスタム定義ID-M1013-035〕", await 定義を作る(browser, "10", rc("連携削除在庫CSV-002"), ["商品ID", "商品名"], `${seed.シードID} の定義`));
  reportSeedIssue(seed.シードID, "在庫明細は、DBで商品ID 913002001 を作る代わりに、グッズ商品CSV登録で作った印つきの商品の在庫の行（在庫0）で代えた");
});

// ---- 在庫移動・振替CSV／在庫分割結合CSV の選択肢（040・041）----
function 在庫系の定義(seedId: string, csvTypeId: string, base: string): void {
  defineSeed(seedId, { needs: NEEDS }, async ({ browser, seed }) => {
    const 名 = rc(base);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const p = new CustomCsvPage(page);
      // 前の実行の同じ試験の印つきの定義だけを消す。ほかの定義が1件でもあれば止める（他の人の定義は消さない・正本の「2つだけ」の前提が崩れる）
      const mine = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[0-9A-Z]+$`);
      await p.open(csvTypeId);
      for (let i = 0; i < 20; i++) {
        const names = (await p.定義名の一覧()).filter((x) => x !== "新規作成");
        const foreign = names.filter((x) => !mine.test(x));
        if (foreign.length) throw new Error(`${seed.シードID}: CSV種別ID ${csvTypeId} に試験の印の無い定義がある（${foreign.join("、")}）。他の人の定義は消さないので止めた`);
        if (names.length === 0) break;
        await p.定義を選ぶ(names[0]);
        await p.削除する();
      }
    });
    await 定義を作る(browser, csvTypeId, 名, [], `${seed.シードID} の定義「${名}」`);
    reportSeedIssue(seed.シードID, "この種別には出力項目が1件も無く、試験の項目を共有のマスタに足さないので、定義の出力項目は0件のまま作った。前の実行の印つきの同じ名前の定義があれば画面から消した");
  });
}
在庫系の定義("S-M10-13-INVMOVE-040", "11", "在庫移動・振替CSV選択確認-M1013-040");
在庫系の定義("S-M10-13-INVSPLIT-041", "12", "在庫分割結合CSV選択確認-M1013-041");
