/**
 * M03-38 商品公開CSV登録の「支店サイトのSALE中の商品へ届く」ケース（043・044）のシード。正本: cases/M03-38_seed_data.tsv
 *  - S-M03-38-QB-ADM: 商品管理を操作できる管理者 m0338qb-admin → 既存の連携試験の管理者（S-M03-38-L-ADM。商品公開CSV登録を開ける）で読み替える
 *  - S-M03-38-QB-ENV / QB-MASTER: 環境・マスタ（書き換えない。固定セールタグはアプリがセールに使うタグ番号8）
 *  - S-M03-38-QB-BRANCH: 支店URL qbbranchpub の支店 → 店舗は作らない決まりのため、既にある支店「TC大阪支店」（公開側 /ja/osaka/）で読み替える
 *  - S-M03-38-QB-PROD-043・044: セールの商品（固定セールタグのみ・セールフラグ1・販売価格500円・支店在庫5）。取り込んだあと、
 *      043 は本店=公開・支店=非公開、044 は本店=公開・支店=公開 にする（商品登録編集で保存）
 *  - S-M03-38-QB-CSV-043・044: 商品公開CSV（見出し行＋1行。043は 1,1・044は 1,0）
 * 商品名・商品コードには実行の印を付ける。在庫5は、支店の在庫編集（入庫/その他）を別の管理者が在庫編集承認一覧で承認して作る。
 */
import { SETUP_ADMIN } from "../config/env";
import { query } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 規格のセールを設定する, タグを付けて商品を登録する } from "../pages/admin/f01_02_setup";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { savePublishState, CsvFile } from "../pages/admin/m03_38_product_status_csv";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { expectNoProductCodes, readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import { 管理者を用意する, 人の, 入庫して承認する } from "./m04-21-q";
import "./m03-38";

const SALE_TAG_ID = "8";
export type 支店 = { ID: string; 店名: string; パス: string };
let 大阪: 支店 | null = null;
export function 大阪支店(): 支店 {
  if (!大阪) {
    const r = query(`select id::text as id, shop_name from dtb_base_info where html_class_name = 'osaka' order by id limit 2`);
    if (r.length !== 1) throw new Error(`支店URL osaka の店舗が ${r.length} 件ある（1件のはず）`);
    大阪 = { ID: String(r[0].id), 店名: String(r[0].shop_name), パス: "/ja/osaka" };
  }
  return 大阪;
}

type 定め = { n: string; 呼び名: string; 商品名の正本: string; 支店の状態: "公開" | "非公開"; csv: { file: string; 値: [string, string] } };
const 定め群: 定め[] = [
  { n: "043", 呼び名: "003", 商品名の正本: "公開更新連携セール商品-M0338QB003", 支店の状態: "非公開", csv: { file: "publish-update-qb003.csv", 値: ["1", "1"] } },
  { n: "044", 呼び名: "004", 商品名の正本: "公開更新連携セール商品-M0338QB004", 支店の状態: "公開", csv: { file: "publish-update-qb004.csv", 値: ["1", "0"] } },
];
export const 商品名の = (正本の名前: string): string => rc(正本の名前);

const 控え = new Map<string, { 商品ID: string; csv: CsvFile & { 内容: string }; 商品名: string }>();
export function qbの商品(n: string): { 商品ID: string; csv: CsvFile & { 内容: string }; 商品名: string } {
  const v = 控え.get(n);
  if (!v) throw new Error(`S-M03-38-QB-PROD-${n} をまだ作っていない`);
  return v;
}

defineSeed("S-M03-38-QB-ADM", { needs: ["S-M03-38-L-ADM"] }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "管理者 m0338qb-admin は作らず、連携試験の管理者（S-M03-38-L-ADM。商品公開CSV登録を開ける）で読み替えた");
});
defineSeed("S-M03-38-QB-ENV", async ({ seed }) => { reportSeedIssue(seed.シードID, "日本語版・JavaScript と Cookie は、ケースの新しいブラウザ（日本語）で満たす。環境の設定は書き換えない"); });
defineSeed("S-M03-38-QB-MASTER", async ({ browser, seed, notes }) => {
  // 共有のマスタ（足さない・書き換えない）。DB は読むだけ。名称が違えば直さずに止める
  const 最新 = query(`select id::text as id, name from dtb_tag where id = 1`);
  if (最新.length !== 1) throw new Error(`${seed.シードID}: タグID 1（本店TOPの最新入荷アイテム欄が使う固定のタグ）の行が無い。共有のマスタは足さない`);
  if (String(最新[0].name ?? "").trim() !== "最新入荷アイテム") throw new Error(`${seed.シードID}: タグID 1 の名称が「最新入荷アイテム」でない（実際: ${最新[0].name}）。共有のマスタは書き換えない`);
  const セール = query(`select id::text as id, name from dtb_tag where id = ${Number(SALE_TAG_ID)}`);
  if (セール.length !== 1) throw new Error(`${seed.シードID}: 固定セールタグ（タグID ${SALE_TAG_ID}）の行が無い。共有のマスタは足さない`);
  let カテゴリID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); カテゴリID = await readSupplyGoodsCategoryId(page); });
  notes.set("〔タグID-M0338-最新入荷〕", String(最新[0].id));
  notes.set("〔タグID-M0338-セール〕", String(セール[0].id));
  notes.set("〔カテゴリID-M0338-QB〕", カテゴリID);
  if (String(セール[0].id) !== SALE_TAG_ID) throw new Error(`${seed.シードID}: 控えたセールのタグID（${セール[0].id}）がこのシードの固定値 ${SALE_TAG_ID} と違う`);
  reportSeedIssue(seed.シードID, `タグ「最新入荷アイテム」（タグID ${最新[0].id}）・固定セールタグ（タグID ${セール[0].id}。名称「${セール[0].name ?? ""}」）・グッズ商品CSVのカテゴリ（カテゴリID ${カテゴリID}）を参照で確かめて控えた。共有のマスタは足さない・書き換えない`);
});
defineSeed("S-M03-38-QB-BRANCH", async ({ seed }) => {
  const b = 大阪支店();
  reportSeedIssue(seed.シードID, `支店URL qbbranchpub の支店は、店舗を作らない決まりのため、既にある支店「${b.店名}」（店舗ID ${b.ID}・公開側 ${b.パス}/）で読み替えた`);
});

for (const d of 定め群) {
  defineSeed(`S-M03-38-QB-PROD-${d.n}`, { needs: ["S-M03-38-L-ADM", "S-M03-38-QB-BRANCH"] }, async ({ browser, seed, notes }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const b = 大阪支店();
    const code = rc(`M0338QB-${d.呼び名}`), name = 商品名の(d.商品名の正本);
    const ap = 人の(`qm0338-${d.n}-ap`, `QM0338-${d.n}申請者`, `Passw0rd-QM0338${d.n}`);
    const ar = 人の(`qm0338-${d.n}-ar`, `QM0338-${d.n}承認者`, `Passw0rd-QM0338${d.n}`);
    let 商品ID = "";
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const p of [ap, ar]) await 管理者を用意する(page, p, b.ID);
      await expectNoProductCodes(page, [code], seed.シードID);
      await uploadGoodsLines(page, {
        what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `${seed.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId: await readSupplyGoodsCategoryId(page), onIssue: issue,
        lines: [{ 商品コード: code, 商品名: name, 基準価格: "500", 販売価格: "500", 買取価格: "1" }],
      });
      商品ID = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, 商品ID);
      if (rows.length !== 1) throw new Error(`${code} の取込直後の商品規格が1件でない`);
      await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, `${name} の取り込みで作られた規格`, issue);
      await タグを付けて商品を登録する(page, 商品ID, SALE_TAG_ID, null, `${seed.シードID}: ${code}`, issue);
      await 規格のセールを設定する(page, 商品ID, rows[0].商品規格ID, { フラグ: true, 販売価格: "500" }, `${seed.シードID}: ${code} のセール`, issue);
    });
    notes.set(`〔商品ID-M0338-${d.呼び名}〕`, 商品ID);
    for (const p of [ap, ar]) await withAdminSession(browser, p.account, async () => undefined);
    await 入庫して承認する(browser, seed.シードID, { 店名: b.店名, code, 数: 5, 単価: 1, 申請者: ap, 承認者: ar }, issue);
    // 本店=公開・支店=指定の状態（商品登録編集で保存。在庫を入れたあと）
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await savePublishState(page, 商品ID, { 商品公開ステータス: "公開", 支店の商品公開ステータス: d.支店の状態 }, issue);
    });
    const text = `商品ID,商品公開ステータス,支店の商品公開ステータス\n${商品ID},${d.csv.値[0]},${d.csv.値[1]}\n`;
    控え.set(d.n, { 商品ID, 商品名: name, csv: { name: d.csv.file, bytes: Buffer.from(text, "utf-8"), 内容: text } });
    issue(`商品名「${name}」・商品コード ${code} は正本の値に実行の印を付けた。固定セールタグ（タグID ${SALE_TAG_ID}）のみ・セールフラグ1・販売価格500円。${b.店名}（正本の支店 qbbranchpub の読み替え）の EC-CUBE 在庫5（別の管理者が承認）。本店=公開・支店=${d.支店の状態}`);
    issue(`商品公開CSV「${d.csv.file}」は、見出し行と1行（商品ID ${商品ID}・商品公開ステータス=${d.csv.値[0]}・支店の商品公開ステータス=${d.csv.値[1]}）の UTF-8・LF・BOM なしで作った（雛形の画面の項目説明は 1=公開・0=非公開）`);
  });
  defineSeed(`S-M03-38-QB-CSV-${d.n}`, { needs: [`S-M03-38-QB-PROD-${d.n}`] }, async ({ seed }) => {
    reportSeedIssue(seed.シードID, `商品公開CSV「${d.csv.file}」は、対応する商品のシード（S-M03-38-QB-PROD-${d.n}）が商品IDを控えたあとに作った`);
  });
}
