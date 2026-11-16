/**
 * M14-04 カード詳細(登録・編集・削除) の、商品・デッキに紐づくカードのシード（2026-11-12 に足した。正本: cases/M14-04_seed_data.tsv）。
 *
 * 作り方（シード表の投入方法のとおり画面で）:
 * - カード: カード詳細(登録)画面で登録する（seeds/m14-04.ts の 画面でカードを作る。詳細情報は試験レアリティ・試験レイアウト・試験プロモ・Foil なし・フレーム 通常）。
 *   カード名(日)・(英)には実行の印を付ける（前の実行のカードと取り違えないため。ケースは控えた番号で開く）。
 * - 商品: グッズ商品CSV登録で1件作り（商品コードに実行の印）、商品登録編集の「カード指定 >」でカード詳細を選んで「商品を登録」する。
 * - デッキ: デッキ登録画面（新規）で、メインボードにカード名(英)の行を入れて登録する。デッキ明細IDは画面に出ないので、保存されたデータを参照して控える。
 *
 * 読み替え（シードの注記に残す）:
 * - シード表の「商品サブID（61404010 など）は DB へ直接設定する」は行わない。アプリに商品サブの規格行のデータが無い（商品はカード詳細の指定で紐づく）。
 *   削除できるかどうかは、商品のカード詳細の指定で決まる（アプリの作り）。
 * - 商品カテゴリは、グッズの既存の子カテゴリで取り込み、カード指定のあとも変えていない（紐づきの確かめに関わらない）。
 *
 * 足したデータ: 実行の印つきのカード・商品・デッキ・アーキタイプ（E2E のもの）。共有の既存の行は書き換えない・消さない。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { publishClass } from "../pages/admin/f03_06_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { アーキタイプを登録する, デッキを登録する } from "../pages/admin/m12_deck_seed";
import { ensureFormatByName } from "../pages/admin/m14_card";
import { ProductSearchPage } from "../pages/admin/product_search";
import { 該当件数 } from "../pages/admin/m03_04_x";
import { カードに紐づく商品の数, デッキの明細 } from "../db/m14_04_card";
import { 画面でカードを作る } from "./m14-04";
import { ensureAnalysisAdmin } from "./m12-common";

type Issue = (m: string) => void;
const MASTER = ["S-M14-04-MASTER"];
const 商品サブの読み替え = "シード表の「商品サブID は画面で指定できないため DB へ直接設定する」は行っていない。アプリに商品サブの規格行のデータが無く、商品とカードは商品のカード詳細の指定（「カード指定 >」）で紐づく";

/** グッズ商品CSV登録で商品を1件作り、商品登録編集の「カード指定 >」でカード詳細を選んで登録する。商品IDを返す */
async function 商品を作ってカードを指定する(
  page: Page, v: { コード: string; 名日: string; 名英: string; カード名日: string; 詳細ID: string; 価格?: string; 買取価格?: string }, what: string, issue: Issue,
): Promise<string> {
  const categoryId = await readExistingGoodsChildCategoryId(page);
  const 価格 = v.価格 ?? "100";
  await registerGoodsCsv(page, {
    what: `${what} のグッズ商品CSV登録`, fileName: `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, categoryId,
    lines: [{ code: v.コード, nameJp: v.名日, nameEn: v.名英, values: { "基準価格": 価格, "販売価格": 価格, "買取価格": v.買取価格 ?? "10", "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0" } }],
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
    uploadWaitMs: 120_000,
  });
  const id = await openProductEditByCode(page, v.コード);
  await assignCardOnProductEdit(page, { productId: id, cardNameJp: v.カード名日, cardDetailId: v.詳細ID, productNameJp: v.名日, productNameEn: v.名英 }, (m) => issue(`${what}: ${m}`));
  return id;
}

// ---- 商品に紐づくカード（010・036・037） ----
for (const n of ["010", "036", "037"]) {
  defineSeed(`S-M14-04-PRODUCT-LINKED-${n}`, { needs: MASTER }, async ({ browser, notes, seed }) => {
    const issue: Issue = (m) => reportSeedIssue(seed.シードID, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const 日 = rc(`商品紐づきカード-${n}`), 英 = rc(`ProductLinkedCard-${n}`);
      const c = await 画面でカードを作る(page, { 日, 英, 詳細数: 1 }, seed.シードID);
      if (c.詳細IDs.length !== 1) throw new Error(`${seed.シードID}: カード詳細IDを1つに決められない（${c.詳細IDs.join("・")}）`);
      const 商品ID = await 商品を作ってカードを指定する(page, { コード: rc(`M1404-PL${n}`), 名日: `商品紐づき商品-${n}`, 名英: `ProductLinked-${n}`, カード名日: 日, 詳細ID: c.詳細IDs[0] }, seed.シードID, issue);
      if (カードに紐づく商品の数(c.カードID) !== 1) throw new Error(`${seed.シードID}: カードID ${c.カードID} に紐づく商品が1件でない`);
      notes.set(`〔カードID-M1404-${n}〕`, c.カードID);
      notes.set(`〔カード詳細ID-M1404-${n}〕`, c.詳細IDs[0]);
      notes.set(`〔商品ID-M1404-${n}〕`, 商品ID);
      issue(`カード名(日)・(英)・商品コードは実行の印つき（${日}・${英}・${rc(`M1404-PL${n}`)}）`);
      issue(商品サブの読み替え);
    });
  });
}

// ---- 1件目の詳細だけ商品に紐づくカード（063） ----
defineSeed("S-M14-04-MIXED-LINK-063", { needs: MASTER }, async ({ browser, notes, seed }) => {
  const issue: Issue = (m) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 日 = rc("M1404-063-カード"), 英 = rc("M1404-063-Card");
    const c = await 画面でカードを作る(page, { 日, 英, 詳細数: 2 }, seed.シードID);
    if (c.詳細IDs.length !== 2) throw new Error(`${seed.シードID}: カード詳細IDが2つでない（${c.詳細IDs.join("・")}）`);
    const [a, b] = c.詳細IDs;
    const 商品ID = await 商品を作ってカードを指定する(page, { コード: rc("M1404-ML063"), 名日: "M1404-063-商品", 名英: "M1404-063-Product", カード名日: 日, 詳細ID: a }, seed.シードID, issue);
    notes.set("〔カードID-M1404-063〕", c.カードID);
    notes.set("〔カード詳細ID-M1404-063A〕", a);
    notes.set("〔カード詳細ID-M1404-063B〕", b);
    notes.set("〔商品ID-M1404-063〕", 商品ID);
    issue(`カード詳細ID は、カード詳細(編集・削除)画面の表示順の1件目を A（${a}）、2件目を B（${b}）として控えた。カード名・商品コードは実行の印つき`);
    issue(商品サブの読み替え);
  });
});

// ---- デッキに紐づくカード（038・039） ----
for (const n of ["038", "039"]) {
  defineSeed(`S-M14-04-DECK-LINKED-${n}`, { needs: MASTER }, async ({ browser, notes, seed }) => {
    const issue: Issue = (m) => reportSeedIssue(seed.シードID, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      // デッキの登録はメインボードの行をカード名(英)で引く。部品（デッキを登録する）がカード名に実行の印を付けるので、正本の英名を渡す
      const 英の正本 = `DeckLinkedCard-${n}`;
      const 日 = rc(`デッキ紐づきカード-${n}`), 英 = rc(英の正本);
      const c = await 画面でカードを作る(page, { 日, 英, 詳細数: 1 }, seed.シードID);
      const アーキタイプ = await アーキタイプを登録する(page, { 名日: `M1404-${n}-アーキタイプ`, 名英: `M1404-${n}-Archetype`, フォーマット: "FMT-STD" }, issue);
      const デッキID = await デッキを登録する(page, {
        デッキタイプ: "ユーザーデッキ", フォーマット: "FMT-STD", アーキタイプ名: アーキタイプ, 公開: "非公開",
        イベント名日: `M1404-${n}-Deck`, イベント名英: `M1404-${n}-Deck`, 開催日: "2026/01/01 00:00", メイン: [{ 枚数: 1, カード名: 英の正本 }],
      }, issue);
      const 明細 = デッキの明細(デッキID).filter((r) => r.カードID === c.カードID);
      if (明細.length !== 1) throw new Error(`${seed.シードID}: デッキID ${デッキID} に、カードID ${c.カードID} のデッキ明細が1件でない（${明細.length}件）`);
      if (カードに紐づく商品の数(c.カードID) !== 0) throw new Error(`${seed.シードID}: カードID ${c.カードID} に商品が紐づいている`);
      notes.set(`〔カードID-M1404-${n}〕`, c.カードID);
      notes.set(`〔カード詳細ID-M1404-${n}〕`, c.詳細IDs[0]);
      notes.set(`〔デッキID-M1404-${n}〕`, デッキID);
      notes.set(`〔デッキ明細ID-M1404-${n}〕`, 明細[0].明細ID);
      issue(`デッキはデッキ登録画面で、デッキ種別 user・フォーマット FMT-STD・公開状態 非公開、メインボード「1 ${英}」で登録した。` +
        `デッキ名はデッキ登録画面の名前の欄（イベント名の欄）に実行の印つきの「${rc(`M1404-${n}-Deck`)}」を入れた。開催日はシード表に無いので 2026/01/01 00:00 にした`);
      issue(`アーキタイプは「登録済みのアーキタイプ1件」の代わりに、フォーマット FMT-STD の実行の印つきのアーキタイプ「${アーキタイプ}」を登録して選んだ（共有の既存の行を使わないため）`);
      issue(`デッキ明細ID ${明細[0].明細ID} は画面に出ないので、保存されたデータを参照して控えた。カード名は実行の印つき（${日}・${英}）`);
    });
  });
}

// ---- 商品詳細のカード情報（059） ----
export const M1404_QL_ADMIN: Account = { loginId: "m1404ql_admin", password: "Passw0rd-M1404QL" };
defineSeed("S-M14-04-QL-ADM", async ({ browser, seed }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-04QL試験管理者", account: M1404_QL_ADMIN, メール: "m1404ql_admin@example.test" });
  reportSeedIssue(seed.シードID, "カード管理・商品管理の権限は、それを含む「システム管理者」の権限で付けた");
});
defineSeed("S-M14-04-QL-ENV", { needs: MASTER }, async ({ seed }) => {
  reportSeedIssue(seed.シードID, "マスタ値（レアリティ・レイアウト・プロモ種別など）は DB シードでなく、カード入力用試験マスター（S-M14-04-MASTER）が画面で登録したもの（試験レアリティ・試験レイアウト・試験プロモ）と、画面の既存の選択肢（Foil・フレーム・カードの言語）を使う。本店の日本語ページは環境の標準設定のまま");
});
defineSeed("S-M14-04-QL-CARDPROD-059", { needs: MASTER }, async ({ browser, notes, seed }) => {
  const issue: Issue = (m) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const フォーマットID = await ensureFormatByName(page, { 名日: "カード連携フォーマット-M1404QL001", 名英: "CardLinkFmt-M1404QL001", コード: "", 並び順: "5101" }, seed.シードID, issue);
    const 名 = "更新前カード-M1404QL001", 味 = "更新前フレーバー-M1404QL001";
    const c = await 画面でカードを作る(page, {
      日: 名, 英: 名, 詳細数: 1,
      リーガリティ: [{ フォーマット: "カード連携フォーマット-M1404QL001", リーガリティ: "使用可" }],
      詳細ごと: [{ フレーバー日: 味, フレーバー英: 味 }],
    }, seed.シードID);
    const 商品ID = await 商品を作ってカードを指定する(page, { コード: rc("M1404QL-001"), 名日: "連携カード商品-M1404QL001", 名英: "連携カード商品-M1404QL001", カード名日: 名, 詳細ID: c.詳細IDs[0], 価格: "1500", 買取価格: "100" }, seed.シードID, issue);
    await publishClass(page, 商品ID, { sale: "1500" }, `${seed.シードID}: 商品規格`, issue);
    notes.set("〔フォーマットID-M1404-001〕", フォーマットID);
    notes.set("〔カードID-M1404-001〕", c.カードID);
    notes.set("〔カード詳細ID-M1404-001〕", c.詳細IDs[0]);
    notes.set("〔商品ID-M1404-001〕", 商品ID);
    issue("フォーマットは「あれば使い、無ければ登録する」（同じ名前のフォーマットが前の実行で作られていればそれを使う）");
    issue("カードセット・レアリティ・レイアウト・プロモ種別は試験マスターの値、Foil・フレームは既定の選択（なし・通常）。表示面・カードの言語は画面の初期値のまま");
    issue(`商品コードは実行の印つき（${rc("M1404QL-001")}）。商品規格は取り込みで作られたニアミント・日本語の1件を、販売価格1500で公開にした（在庫は0のまま）`);
  });
});

// ---- 商品マスターのカード名の検索（066） ----
export const M1404_RJ_ADMIN: Account = { loginId: "m1404rj-adm", password: "Passw0rd-M1404RJ" };
defineSeed("S-M14-04-RJ-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-04RJ試験管理者", account: M1404_RJ_ADMIN, メール: "m1404rj-adm@example.test" });
});
/** 066 の名前（正本の名前に実行の印を付けたもの。前の実行で名前を変えたカードと取り違えないため） */
export const RJ名 = { 旧名: () => rc("RJ1404-001-旧名"), 新名: () => rc("RJ1404-001-新名"), 英名: () => rc("RJ1404-001-CardEn"), 商品名: () => rc("RJ1404-001-商品"), コード: () => rc("M1404RJ-001") };
defineSeed("S-M14-04-RJ-CARD-066", { needs: MASTER }, async ({ browser, notes, seed }) => {
  const issue: Issue = (m) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 登録の前に、カード名に「RJ1404-001-」（実行の印つき）を含む商品が無いことを確かめる
    const s = new ProductSearchPage(page);
    await s.open();
    await s.ensureDetailVisible();
    await s.field("card_name").fill(rc("RJ1404-001-"));
    await s.submitAndWaitForResult();
    if ((await 該当件数(page)) !== 0) throw new Error(`${seed.シードID}: カード名に「${rc("RJ1404-001-")}」を含む商品が既にある`);
    const c = await 画面でカードを作る(page, { 日: RJ名.旧名(), 英: RJ名.英名(), 詳細数: 1 }, seed.シードID);
    const 商品ID = await 商品を作ってカードを指定する(page, { コード: RJ名.コード(), 名日: RJ名.商品名(), 名英: RJ名.商品名(), カード名日: RJ名.旧名(), 詳細ID: c.詳細IDs[0] }, seed.シードID, issue);
    notes.set("〔商品ID-M1404-RJ001〕", 商品ID);
    issue(`カード名(日)「${RJ名.旧名()}」・カード名(英)「${RJ名.英名()}」・商品名「${RJ名.商品名()}」・商品コード「${RJ名.コード()}」は、正本の値に実行の印を付けた（前の実行で名前を変えたカードがカード名の検索に当たらないため。ケースもこの値で検索する）`);
    issue("カードは、カード登録CSVアップロード（カード詳細ID 9140401・カードセット Aether Revolt・レアリティ Uncommon・レイアウト Normal）の代わりに、カード詳細(登録)画面で" +
      "試験マスターの値（試験カードセットなし・試験レアリティ・試験レイアウト・試験プロモ）で登録した。固定のカード詳細IDは、前の実行のカードが商品に紐づいたまま残り、消せないので使わない");
  });
});
