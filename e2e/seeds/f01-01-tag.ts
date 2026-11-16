/**
 * F01-01 本店ECTOP の共有シード S-F01-01-TAG-PRODUCTS（固定タグの欄の商品群）。正本: cases/F01-01_seed_data.tsv
 *
 * 共有のものを書き換える。何を書き換えて、どう戻すか（lib/shared_restore.ts に登録し、ケースの終わりに成否によらず戻す）:
 *   - 固定タグ（最新入荷アイテム・Trending Now・セール・値下げ・補充しました）の対象の商品: pages/admin/f01_01_shared.ts の 共有タグの対象を空にする で、
 *     今の対象を全件控えてから外し、ケースの終わりに付け直して、対象と各商品の登録画面の全項目が控えと同じかを確かめる。
 *   - 固定タグの「優先表示商品」（タグ登録の「その他の設定」）: 書き換える前に元の値を控え、ケースの終わりに元の値で登録し直し、開き直して同じかを確かめる。
 *   - この E2E が作った商品群のタグ: ケースの終わりに、商品タグ更新CSV登録で、作った商品のタグを空にする（固定タグの対象の戻しより先に行う）。
 *
 * 作り方（シード表の投入方法の順。1回の起動で商品は1度だけ作り、ケースごとにタグと優先表示商品を付け直す）:
 *   - 商品: グッズ商品CSV登録で5群×31件（NEW-JA・NEW-EN・SALE・DOWN・RESTOCK の 01〜31）と、群ごとの除外商品3件
 *     （非公開「<群>-X-PRIVATE」・在庫0「<群>-X-NOSTOCK」・言語不一致「<群>-X-LANG」。シード表は件数と商品コードを定めないので群ごとに1件ずつ）を作る。
 *     言語は NEW-EN 群を英語、ほかを日本語（言語不一致の除外商品は逆）。各群の01は「カード指定」で既存のカードを指定してカード商品にする（F01-01 の既存のシードと同じ）。
 *   - 在庫: 在庫変更CSV登録（本店・EC-CUBE・入庫/その他）で NEW-JA-01 に3、在庫0の除外商品を除くほかの商品に1を入れ、全権限の管理者が在庫編集承認一覧で承認する。
 *     登録するのは本店を編集できる試験の管理者（全権限の管理者は在庫の店舗を選べない）。
 *   - タグ: 1回目はグッズ商品CSVのタグ(ID)の列で付ける。2回目からは、作った商品のタグを商品タグ更新CSV登録で付け直す。
 *   - 優先表示商品: 各タグの「その他の設定」の優先表示商品に、その群の 01〜31 の商品コードを改行区切りで入れて登録する。
 *   - 最後のタグの設定から31秒待つ（本店TOPの商品の欄の30秒のキャッシュ）。
 * シードで行わないこと（注記にも出す）:
 *   - 各群の01の週間販売数5（シード表が「DBへ直接設定する」とする）。DB は書かない。この週間販売数を確かめるケース（029）は実装していない。
 *   - 商品画像（この環境のアプリは商品画像の追加欄にファイルを渡しても取り込まない）。このシードを使う実装したケースは画像を確かめない。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { csvLine, decodeCsvBytes, parseCsv } from "../lib/csv";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { withAdminSession } from "../lib/session";
import { キャッシュの期限切れを待つ, 共有タグの対象を空にする, 固定タグ, 固定タグ名, タグの対象の商品 } from "../pages/admin/f01_01_shared";
import { 既存のカードを指定する } from "../pages/admin/f01_02_setup";
import { イベント登録者, イベント登録者を用意する } from "../pages/admin/f01_01_deck";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { TagPage } from "../pages/admin/m03_13_tag";
import { downloadedBytes } from "../pages/admin/m03_21_shelf_number";
import { openProductEditByCode, readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { ProductTagCsvUploadPage } from "../pages/admin/m03_28_product_tag_csv_upload";
import { registerStockChangeCsv } from "../pages/admin/m04_19_stock_change_csv";
import { loggedInMemberName, StockApprovalListPage } from "../pages/admin/stock_edit";
import { defineSeed } from "./current_seed";

type 群 = { 名: string; タグ: 固定タグ名; 英語: boolean };
export const 商品群: 群[] = [
  { 名: "NEW-JA", タグ: 固定タグ.最新入荷, 英語: false },
  { 名: "NEW-EN", タグ: 固定タグ.TrendingNow, 英語: true },
  { 名: "SALE", タグ: 固定タグ.セール, 英語: false },
  { 名: "DOWN", タグ: 固定タグ.値下げ, 英語: false },
  { 名: "RESTOCK", タグ: 固定タグ.補充, 英語: false },
];
/** 群の n 番目（1始まり）の正本の商品コード */
export const 群のコード = (群名: string, n: number): string => `${群名}-${String(n).padStart(2, "0")}`;
export const 除外の記号 = ["X-PRIVATE", "X-NOSTOCK", "X-LANG"] as const;

type 商品 = { コード: string; 群: 群; 公開: boolean; 英語: boolean; 在庫: number; カード: boolean };
const 全商品: 商品[] = 商品群.flatMap((g) => [
  ...Array.from({ length: 31 }, (_, i): 商品 => ({ コード: 群のコード(g.名, i + 1), 群: g, 公開: true, 英語: g.英語, 在庫: g.名 === "NEW-JA" && i === 0 ? 3 : 1, カード: i === 0 })),
  { コード: `${g.名}-X-PRIVATE`, 群: g, 公開: false, 英語: g.英語, 在庫: 1, カード: false },
  { コード: `${g.名}-X-NOSTOCK`, 群: g, 公開: true, 英語: g.英語, 在庫: 0, カード: false },
  { コード: `${g.名}-X-LANG`, 群: g, 公開: true, 英語: !g.英語, 在庫: 1, カード: false },
]);

/** 固定タグの名称 → タグID（このシードがタグ登録の一覧で確かめたもの） */
export const 固定タグのID: Record<string, string> = {};

for (const n of ["014", "015", "017", "018", "019", "021", "023", "027", "034", "036", "037", "050", "052", "053", "081", "082"]) {
  defineSeed(`S-F01-01-BROWSER-${n}`, async () => { /* ケースごとの新しいブラウザの画面で、ログアウト・カート0件から始まる */ });
}

/** このプロセスで作った商品（正本の商品コード → 商品ID）。1度目の作成のあとに入る */
export const 作った商品ID: Map<string, string> = new Map();

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 商品タグ更新CSV登録で、商品ID → タグID の並び（空なら外す）に置き換える。作った商品はこのシードの群のタグしか持たないので、置き換えてよい */
async function 作った商品のタグを置き換える(page: Page, seedId: string, rows: [string, string][]): Promise<void> {
  const upload = new ProductTagCsvUploadPage(page);
  await upload.open();
  const header = parseCsv(decodeCsvBytes(await downloadedBytes(await upload.downloadTemplate())));
  if (header.length !== 1) throw new Error(`${seedId}: 商品タグ更新CSVの雛形が見出し1行でない`);
  const dir = path.join(STATE_DIR, "f01-01-tag");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${seedId.toLowerCase()}-${RUN_MARK}-${Date.now()}.csv`);
  fs.writeFileSync(file, [header[0], ...rows.map(([id, tags]) => [id, tags])].map((r) => csvLine(r)).join("\n") + "\n", "utf-8");
  await upload.open();
  await upload.choose(file);
  const r = await upload.submit();
  if (!r.sent) throw new Error(`${seedId}: 商品タグ更新CSVの取込が、ブラウザの入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
  const errors = (await page.locator(".alert-danger").allInnerTexts()).map((t) => t.trim()).filter((t) => t && !/デバッグ|開発/.test(t));
  if (errors.length) throw new Error(`${seedId}: 商品タグ更新CSVの取込で誤り: ${errors.join(" / ")}`);
}

/** 1回目: 商品を作る（タグはグッズ商品CSVの列で付ける）・カードを指定する・在庫を入れて承認する・商品IDを控える */
async function 商品を作る(browser: Browser, seedId: string, tagIds: Record<string, string>, issue: (m: string) => void): Promise<void> {
  await 管理画面(browser, async (page) => {
    const lang = await readLanguageIds(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const headers = (await downloadGoodsCsvTemplate(page)).headers;
    const 付随 = Object.fromEntries(headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録（${全商品.length}件）`, fileName: `${seedId.toLowerCase()}-${RUN_MARK}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...付随 },
      lines: 全商品.map((p) => ({
        code: rc(p.コード), nameJp: rc(p.コード), nameEn: rc(p.コード), productStatus: p.公開 ? undefined : "非公開" as const,
        values: { "言語(ID)": p.英語 ? lang.英語 : lang.日本語, "タグ(ID)": tagIds[p.群.タグ] },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 600_000,
    });
    for (const p of 全商品.filter((x) => x.カード)) {
      const id = await openProductEditByCode(page, rc(p.コード));
      await 既存のカードを指定する(page, id, { Foil: false, 商品名: rc(p.コード) }, `${seedId}: ${rc(p.コード)}`, issue);
    }
    // 商品IDは、タグで絞った商品マスターの検索結果から読む（作った直後は、どのタグの対象もこのシードの商品だけ）
    for (const g of 商品群) {
      for (const h of await タグの対象の商品(page, tagIds[g.タグ])) {
        const p = 全商品.find((x) => rc(x.コード) === h.code);
        if (p) 作った商品ID.set(p.コード, h.id);
      }
    }
    const missing = 全商品.filter((p) => !作った商品ID.has(p.コード)).map((p) => p.コード);
    if (missing.length) throw new Error(`${seedId}: 作った商品の商品IDを読めない（${missing.slice(0, 5).join("・")} ほか ${missing.length} 件）`);
  });
  // 在庫: 本店を編集できる試験の管理者が在庫変更CSV登録で入庫し、全権限の管理者が承認する
  const shop = await イベント登録者を用意する(browser);
  const approver = await 管理画面(browser, (page) => loggedInMemberName(page));
  const 入庫 = 全商品.filter((p) => p.在庫 > 0);
  await withAdminSession(browser, イベント登録者.account, (page) => registerStockChangeCsv(page, {
    店舗: shop, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: "結合試験", 承認者: approver,
    行: 入庫.map((p) => ({ 商品コード: rc(p.コード), 在庫増減数: String(p.在庫), 仕入単価: "0" })),
    ファイル名: `${seedId.toLowerCase()}-stock-${RUN_MARK}.csv`,
  }, `${seedId}: 在庫変更CSV登録（${入庫.length}行）`, issue));
  await 管理画面(browser, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === イベント登録者.名前);
    if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、試験の管理者「${イベント登録者.名前}」の未承認の行が無い`);
    await list.approve(rows.map((r) => r.id), `${seedId}: 在庫変更CSVの承認`, issue);
  });
  issue(`在庫は、試験の管理者「${イベント登録者.名前}」が在庫変更CSV登録（本店・EC-CUBE・入庫/その他・理由「結合試験」・仕入単価0）で入れ、「${approver}」が承認した`);
}

defineSeed("S-F01-01-TAG-PRODUCTS", async ({ browser, seed, notes }) => {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const tagIds = await 共有タグの対象を空にする(browser, seedId, 商品群.map((g) => g.タグ), issue);
  Object.assign(固定タグのID, tagIds);
  // 作った商品のタグを外す戻し（固定タグの対象の戻しより先に動くよう、あとから登録する）
  registerRestore(
    "この E2E が作った商品群（S-F01-01-TAG-PRODUCTS）のタグ",
    { 作った商品の数: 全商品.length },
    async () => {
      if (作った商品ID.size === 0) return; // 作る途中で止まったときは、固定タグの対象の戻しが1件ずつ外す
      await 管理画面(browser, (page) => 作った商品のタグを置き換える(page, `${seedId} 戻す`, [...作った商品ID.values()].map((id) => [id, ""])));
    },
  );
  if (作った商品ID.size === 0) {
    await 商品を作る(browser, seedId, tagIds, issue);
  } else {
    await 管理画面(browser, (page) => 作った商品のタグを置き換える(page, seedId, 全商品.map((p) => [作った商品ID.get(p.コード)!, tagIds[p.群.タグ]])));
    issue("商品は、この起動の前のケースで作ったものを使い、商品タグ更新CSV登録でタグを付け直した");
  }
  // 優先表示商品（各タグの その他の設定）
  await 管理画面(browser, async (page) => {
    for (const g of 商品群) {
      const id = tagIds[g.タグ];
      const tag = new TagPage(page);
      await tag.openEdit(id);
      await tag.openOtherSettings();
      const 元 = (await tag.inputValues()).優先表示商品;
      registerRestore(`共有のタグ「${g.タグ}」(ID ${id})の優先表示商品`, { 元 },
        async () => 管理画面(browser, async (p) => { const t = new TagPage(p); await t.openEdit(id); await t.openOtherSettings(); await t.register({ 優先表示商品: 元 }, `タグID ${id} の優先表示商品を元に戻す`); }),
        async () => 管理画面(browser, async (p) => { const t = new TagPage(p); await t.openEdit(id); await t.openOtherSettings(); return (await t.inputValues()).優先表示商品 === 元; }));
      await tag.register({ 優先表示商品: Array.from({ length: 31 }, (_, i) => rc(群のコード(g.名, i + 1))).join("\n") }, `タグ「${g.タグ}」の優先表示商品に ${g.名}-01〜31 を入れる`);
    }
  });
  issue("各群の01の週間販売数5（シード表は DB へ直接設定する）は設定していない。商品画像は付けていない（このシードを使う実装したケースは確かめない）");
  issue(`除外商品は群ごとに「<群>-X-PRIVATE」（非公開）・「<群>-X-NOSTOCK」（在庫0）・「<群>-X-LANG」（言語不一致）の3件にした（シード表は件数と商品コードを定めない）`);
  await キャッシュの期限切れを待つ();
  notes.set("〔商品ID-F0101-共有-タグ〕", 全商品.filter((p) => !p.コード.includes("-X-")).map((p) => `${p.コード}=${作った商品ID.get(p.コード)}`).join(" "));
});
