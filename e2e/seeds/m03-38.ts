/**
 * M03-38 商品公開CSV登録の画面シード。正本: cases/M03-38_seed_data.tsv
 *
 * 実装したのは、DBでの準備が要らないシードだけ（管理者2人・CSV取込設定・連携試験環境・公開側の確認に使う商品6件と取込ファイル6件）。
 * 商品公開CSVの取込履歴を0件にするシード（IMPORT-005〜031・DP-REPEAT-045 など）、履歴をDBで登録するシード、
 * 5009件の商品をDBで登録するシード、DBシードを含む公開側連携のシード（QB-ENV・QB-MASTER）は作らない（記録 e2e/review/M03-38_progress_2026-10-21.md）。
 *
 * 商品の作り方（L-PROD-034〜037・CBPUB-046・047。正本の投入方法の順）:
 * 1. グッズ商品CSV登録画面で1行のCSVを取り込む（商品IDは空、言語は日本語、公開状態と支店の商品公開ステータスは非公開を表す値、
 *    サイズ1・重量1、商品カテゴリはサプライ・グッズ、購入グループは登録済みのもの、各価格1500）。
 * 2. 商品マスターで商品名を入れて検索し、行の商品IDを控える。
 * 3. 在庫検索一覧で商品コードを入れて検索し、本店・在庫区分 EC-CUBE の行から在庫編集を開いて「入庫/その他」・理由「M03-38試験」・
 *    増減数2・仕入単価1500で登録する（登録者は M03-38連携試験管理者）。
 * 4. 登録者とは別の、承認権限を持つ管理者（シードを作る初期管理者）で、在庫編集承認一覧のその行を一括承認する。
 * 5. 正本が定めるときは、商品マスターの検索結果から商品登録編集画面を開き、公開状態と支店の商品公開ステータスを選び、割引率を選んで保存する。
 *
 * 正本の外で補ったこと（報告にも出す）:
 * - 公開状態の検索条件は初期値が「公開」だけで、非公開で取り込んだ商品が出ないので、「公開」「非公開」の両方にチェックを入れて検索する。
 * - 在庫を入れる店舗は正本に無いので、本店（店舗ID 1。店名は環境で違うので在庫検索一覧の検索欄「店舗」から読む）にする。
 * - 承認する管理者は正本に無いので、シードを作る初期管理者にする（M03-01 の057と同じ）。
 * - 商品カテゴリは「登録済みのグッズのカテゴリ」として、カテゴリ一覧の最上位の「サプライ・グッズ」を使う。
 * - 地域別販売制限は正本に値が無いので「0」（制限なし。同じ機能の QB-PROD のシードが書く値）にする。
 */
import { rc } from "../lib/run_marker";
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import {
  countProductsByName, CsvFile, findProductIdByName, frontTopStatus, goodsStatusValue, openFrontProductDetail, ProductCsvUploadScreen,
  PublishState, readPublishState, savePublishState, 商品公開CSV登録,
} from "../pages/admin/m03_38_product_status_csv";
import { goodsRootCategoryLink } from "../pages/admin/product_masters";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";
import { Page } from "@playwright/test";

export const M0338_ADMIN: Account = { loginId: "m0338_admin", password: "Passw0rd!M0338" };
export const M0338L_ADMIN: Account = { loginId: "m0338l_admin", password: "Passw0rd!M0338L" };

/** 本店（店舗ID 1）。アプリの親店舗。店名は在庫検索一覧の検索欄「店舗」から読む */
const MAIN_SHOP_ID = "1";

/** シード表 S-M03-38-L-ENV の本店・TC大阪支店の公開側のアドレス */
export const SHOP_PATH = { 本店: "/ja", TC大阪支店: "/ja/osaka" } as const;

// ---- 管理者・設定 ----

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗の先頭を選び、商品管理を操作できるシステム管理者の権限を付ける（M03-41 と同じ作り方） */
async function createAdmin(page: Page, 名前: string, account: Account, mail: string): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error(`${名前}: メンバーに割り当てられる店舗が画面に無い`);
  const store = stores[0];
  await ensureMember(page, {
    名前, 所属店舗: store, ログインID: account.loginId, メールアドレス: mail,
    パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

/** 作った管理者でログインでき（稼働中・ロックなし）、商品公開CSV登録画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpenStatusCsv(browser: Parameters<typeof withAdminSession>[0], account: Account, 名前: string): Promise<void> {
  await withAdminSession(browser, account, async (page) => {
    const csv = new ProductCsvUploadScreen(page, 商品公開CSV登録);
    await csv.open();
    await expect(csv.アップロードボタン, `${名前}で商品公開CSV登録画面を開けない`).toBeVisible();
  });
}

defineSeed("S-M03-38-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-38試験管理者", M0338_ADMIN, "m0338_admin@example.test"));
  await expectCanOpenStatusCsv(browser, M0338_ADMIN, "M03-38試験管理者");
});

defineSeed("S-M03-38-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-38連携試験管理者", M0338L_ADMIN, "m0338l_admin@example.test"));
  await expectCanOpenStatusCsv(browser, M0338L_ADMIN, "M03-38連携試験管理者");
});

/**
 * 正本: 各ケースが開始時に区切り文字をカンマ、CSVアップロードサイズ上限を5 MBに設定する。
 * 管理画面に設定項目が無いアプリの設定なので、書き換えず、値が正本どおり（取込の区切り文字・出力の区切り文字がカンマ、上限5MB）
 * であることだけを確かめる（違えば止める。M03-41 の S-M03-41-CONFIG と同じ形）。
 */
defineSeed("S-M03-38-CONFIG", async ({ seed }) => {
  const c = CSV入出力設定();
  const got = { 取込区切り文字: c.取込区切り文字, 出力区切り文字: c.出力区切り文字, アップロード上限MB: c.アップロード上限MB };
  const want = { 取込区切り文字: ",", 出力区切り文字: ",", アップロード上限MB: 5 };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`${seed.シードID}: CSVの設定が ${JSON.stringify(got)}（正本は ${JSON.stringify(want)}）。設定ファイルは書き換えない決まりなので止める`);
  }
});

/**
 * 正本: 管理画面の店舗設定で本店とTC大阪支店を公開中に設定する（共有可。状態を変えない）。
 * 本店（店舗ID 1）は店舗一覧に出ない作りなので、公開側の本店 /ja/ とTC大阪支店 /ja/osaka/ のトップ画面が、ログインしていない
 * セッションで開けること（応答200）で公開中であることを確かめる。開けなければ止める（店舗の設定は変えない）。
 */
defineSeed("S-M03-38-L-ENV", async ({ browser, seed }) => {
  for (const [name, path] of Object.entries(SHOP_PATH)) {
    const status = await frontTopStatus(browser, path);
    if (status !== 200) throw new Error(`${seed.シードID}: ${name}（${path}/）の公開側のトップ画面が開けない（応答 ${status}）`);
  }
  reportSeedIssue(seed.シードID, "本店・TC大阪支店は公開側のトップ画面が開けること（応答200）で公開中と確かめた。店舗設定は変えていない（本店は店舗一覧に出ない）");
});

// ---- 公開側の確認に使う商品 ----

type ProductSpec = {
  seedId: string;
  label: string;
  code: string;
  name: string;
  /** 在庫を入れたあとに商品登録編集画面で選ぶ公開状態。正本に商品登録編集の手順が無いときは undefined */
  finalState?: PublishState;
};

/** カテゴリ一覧の最上位の「サプライ・グッズ」の行のカテゴリID */
async function supplyGoodsCategoryId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  const link = goodsRootCategoryLink(page);
  await expect(link, "カテゴリ一覧の最上位の「サプライ・グッズ」は1件").toHaveCount(1);
  const m = /^ID:(\d+)\s/.exec(((await link.textContent()) ?? "").trim());
  if (!m) throw new Error("「サプライ・グッズ」のカテゴリIDを画面から読めない");
  return m[1];
}

async function buildProduct(browser: Parameters<typeof withAdminSession>[0], notes: Notes, p: ProductSpec): Promise<void> {
  const issue = (m: string) => reportSeedIssue(p.seedId, m);
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const mainShop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById(MAIN_SHOP_ID));

  const registrant = await withAdminSession(browser, M0338L_ADMIN, async (page) => {
    const me = await loggedInMemberName(page);
    if (me === approverName) throw new Error(`${p.seedId}: 在庫編集の登録者と承認者が同じ管理者になっている`);
    // 正本に片付けの手順が無い。前の実行の残り（同じ商品名）があれば、作らずに止める
    const left = await countProductsByName(page, p.name);
    if (left > 0) throw new Error(`${p.seedId}: 商品名「${p.name}」の商品が前の実行で ${left} 件残っている。正本に片付けの手順が無いので止める（扱いは依頼者の判断）`);

    // 1. グッズ商品CSV登録（公開状態・支店の商品公開ステータスは非公開を表す値。雛形の項目説明から読む）
    const template = await downloadGoodsCsvTemplate(page);
    const hide = {
      "商品公開ステータス": goodsStatusValue(template, "商品公開ステータス", "非公開"),
      "支店の商品公開ステータス": goodsStatusValue(template, "支店の商品公開ステータス", "非公開"),
    };
    issue(`グッズ商品CSVの非公開を表す値は、雛形の項目説明から 商品公開ステータス=${hide["商品公開ステータス"]}・支店の商品公開ステータス=${hide["支店の商品公開ステータス"]} とした`);
    const categoryId = await supplyGoodsCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${p.seedId} の1行グッズ商品CSV登録`, fileName: `${p.code}.csv`, categoryId,
      lines: [{ code: p.code, nameJp: p.name, nameEn: p.name }],
      // 地域別販売制限は正本に値が無い。空のまま取り込むと、商品登録編集画面の保存で必須の地域別販売制限が未選択になり保存できない
      // （2026-10-21 の034の1回目で止まった）。同じ機能の S-M03-38-QB-PROD-041 などが書く値「0」（制限なし）を入れる。
      common: { ...hide, "基準価格": "1500", "販売価格": "1500", "買取価格": "1500", "原価単価": "1500", "地域別販売制限": "0" },
      onWarning: issue,
    });
    issue("地域別販売制限は正本に値が無いので、同じ機能の S-M03-38-QB-PROD-041〜044 が書く値「0」（制限なし）を入れた（空では商品登録編集画面で保存できない）");
    issue("グッズ商品CSV登録画面に確認モーダルは無く、確定の操作はせずに取込の結果（成功の表示）を確かめた");

    // 2. 商品マスターで商品名を入れて検索し、商品IDを控える
    const id = await findProductIdByName(page, p.name, p.code);
    notes.set(p.label, id);

    // 3. 在庫検索一覧から在庫編集を開いて入庫する（本店・在庫区分 EC-CUBE の行）
    const stock = new StockListPage(page);
    await stock.searchByProductCode(p.code);
    await stock.openEdit(stock.row(p.code, mainShop, "EC-CUBE"));
    await registerStockEdit(page, {
      changeType: "入庫/その他", reason: "M03-38試験", quantity: "2", purchasePrice: "1500", approverName,
    }, `${p.code} の在庫編集（2）`, issue);
    return me;
  });

  // 4. 登録者とは別の、承認権限を持つ管理者で、この在庫編集の行を一括承認する
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(mainShop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant
      && r.shop.startsWith(mainShop) && r.changeType.endsWith("入庫/その他") && r.quantity === "2");
    if (rows.length !== 1) throw new Error(`${p.seedId}: ${p.code} の在庫編集（2）の未承認の行が ${rows.length} 件（1件のはず）`);
    await list.approve([rows[0].id], `${p.seedId} の在庫編集の承認`, issue);
  });

  // 5. 商品マスターの検索結果から商品登録編集画面を開き、公開状態を選んで保存する（正本が定めるときだけ）
  await withAdminSession(browser, M0338L_ADMIN, async (page) => {
    const id = notes.get(p.label);
    if (p.finalState) {
      await findProductIdByName(page, p.name, p.code);
      await savePublishState(page, id, p.finalState, issue);
    } else {
      // 取り込んだときの非公開のまま（正本の状態・属性どおりか確かめる）
      await expect(await readPublishState(page, id), `${p.seedId}: 取り込んだままの公開状態`).toEqual({ 商品公開ステータス: "非公開", 支店の商品公開ステータス: "非公開" });
    }
  });

  // 6. 公開状態が公開側の表示に効いていることを、ログインしていないセッションで確かめる（ケースの「表示されない」の確かめが、
  //    商品名の見つけ方の誤りで通ってしまわないように、取込の前の表示を見ておく）。食い違えば作れていないので止める。
  const state = p.finalState ?? { 商品公開ステータス: "非公開", 支店の商品公開ステータス: "非公開" };
  const want = { 本店: state.商品公開ステータス === "公開", TC大阪支店: state.商品公開ステータス === "公開" && state.支店の商品公開ステータス === "公開" };
  for (const shop of ["本店", "TC大阪支店"] as const) {
    const d = await openFrontProductDetail(browser, SHOP_PATH[shop], notes.get(p.label), p.name);
    issue(`取込の前の${shop}の商品詳細画面: 応答 ${d.応答}・商品名が${d.商品名が見える ? "見える" : "見えない"}`);
    const shown = d.応答 === 200 && d.商品名が見える;
    const hidden = d.応答 < 500 && !d.商品名が見える;
    if (want[shop] ? !shown : !hidden) {
      throw new Error(`${p.seedId}: 公開状態（${JSON.stringify(state)}）なのに、${shop}の商品詳細画面の表示が合わない（応答 ${d.応答}・商品名が${d.商品名が見える ? "見える" : "見えない"}）`);
    }
  }
}

const PRODUCTS: ProductSpec[] = [
  { seedId: "S-M03-38-L-PROD-034", label: "〔商品ID-M0338-034〕", code: rc("M0338L-034"), name: rc("CSV連携公開確認商品-L001M0338n034"), finalState: { 商品公開ステータス: "公開", 支店の商品公開ステータス: "公開" } },
  { seedId: "S-M03-38-L-PROD-035", label: "〔商品ID-M0338-035〕", code: rc("M0338L-035"), name: rc("CSV連携公開確認商品-L002M0338n035"), finalState: { 商品公開ステータス: "非公開", 支店の商品公開ステータス: "非公開" } },
  { seedId: "S-M03-38-L-PROD-036", label: "〔商品ID-M0338-036〕", code: rc("M0338L-036"), name: rc("CSV連携公開確認商品-L003M0338n036"), finalState: { 商品公開ステータス: "公開", 支店の商品公開ステータス: "公開" } },
  { seedId: "S-M03-38-L-PROD-037", label: "〔商品ID-M0338-037〕", code: rc("M0338L-037"), name: rc("CSV連携公開確認商品-L004M0338n037"), finalState: { 商品公開ステータス: "公開", 支店の商品公開ステータス: "公開" } },
  { seedId: "S-M03-38-CBPUB-046", label: "〔商品ID-M0338-046〕", code: rc("M0338-CB046"), name: rc("CB公開確認商品-M0338n046"), finalState: { 商品公開ステータス: "公開", 支店の商品公開ステータス: "公開" } },
  // 047 の正本は、在庫の承認のあとに商品登録編集の手順を持たない（取り込んだときの非公開・非公開のまま）
  { seedId: "S-M03-38-CBPUB-047", label: "〔商品ID-M0338-047〕", code: rc("M0338-CB047"), name: rc("CB公開確認商品-M0338n047") },
];

function productSpec(seedId: string): ProductSpec {
  const p = PRODUCTS.find((x) => x.seedId === seedId);
  if (!p) throw new Error(`${seedId} の商品の定義が無い`);
  return p;
}
defineSeed("S-M03-38-L-PROD-034", { needs: ["S-M03-38-L-ADM"] }, async ({ browser, notes }) => buildProduct(browser, notes, productSpec("S-M03-38-L-PROD-034")));
defineSeed("S-M03-38-L-PROD-035", { needs: ["S-M03-38-L-ADM"] }, async ({ browser, notes }) => buildProduct(browser, notes, productSpec("S-M03-38-L-PROD-035")));
defineSeed("S-M03-38-L-PROD-036", { needs: ["S-M03-38-L-ADM"] }, async ({ browser, notes }) => buildProduct(browser, notes, productSpec("S-M03-38-L-PROD-036")));
defineSeed("S-M03-38-L-PROD-037", { needs: ["S-M03-38-L-ADM"] }, async ({ browser, notes }) => buildProduct(browser, notes, productSpec("S-M03-38-L-PROD-037")));
defineSeed("S-M03-38-CBPUB-046", { needs: ["S-M03-38-L-ADM"] }, async ({ browser, notes }) => buildProduct(browser, notes, productSpec("S-M03-38-CBPUB-046")));
defineSeed("S-M03-38-CBPUB-047", { needs: ["S-M03-38-L-ADM"] }, async ({ browser, notes }) => buildProduct(browser, notes, productSpec("S-M03-38-CBPUB-047")));

/** 商品の呼び名から、正本の商品名を引く（ケースが公開側で探す名前） */
export function productNameOf(label: string): string {
  const p = PRODUCTS.find((x) => x.label === label);
  if (!p) throw new Error(`${label} の商品はこのシードに無い`);
  return p.name;
}

// ---- 商品公開CSV（取込ファイル） ----

const files = new Map<string, CsvFile & { 内容: string }>();

/** シードが作った取込ファイルを、正本のファイル名で引く */
export function statusCsvFile(name: string): CsvFile & { 内容: string } {
  const f = files.get(name);
  if (!f) throw new Error(`${name} はシードがまだ作っていない`);
  return f;
}

type CsvSpec = {
  seedId: string;
  file: string;
  label: string;
  /** 正本の 商品公開ステータス・支店の商品公開ステータス の値 */
  values: [string, string];
  /** シード表の状態・属性が書くデータ行の商品ID（ケースの事前準備と食い違うもの） */
  seedTableId?: string;
  /** 正本の中で値が食い違うときの注記 */
  note?: string;
};

/**
 * 見出し行（商品ID,商品公開ステータス,支店の商品公開ステータス）とデータ行1行の UTF-8・カンマ区切りのファイル。
 * 改行は正本に指定が無いので LF（末尾に改行1個。e2e/fixtures の既存の静的ファイルと同じ）、BOM は付けない。
 */
function buildStatusCsv(notes: Notes, s: CsvSpec): void {
  const id = notes.get(s.label);
  const text = `商品ID,商品公開ステータス,支店の商品公開ステータス\n${id},${s.values[0]},${s.values[1]}\n`;
  files.set(s.file, { name: s.file, bytes: Buffer.from(text, "utf-8"), 内容: text });
  if (s.seedTableId) {
    reportSeedIssue(s.seedId, `シード表の状態・属性はデータ行の商品IDを固定の ${s.seedTableId} と書くが、ケースの事前準備は「商品ID ${s.label} の1行」と書く。` +
      `${s.seedTableId} の商品はシードが作らないので、ケースの事前準備に従い控えた商品ID（${id}）を書いた`);
  }
  if (s.note) reportSeedIssue(s.seedId, s.note);
}

const CSVS: CsvSpec[] = [
  { seedId: "S-M03-38-L-CSV-034", file: "公開確認-L001.csv", label: "〔商品ID-M0338-034〕", values: ["0", "1"], seedTableId: "38038001" },
  { seedId: "S-M03-38-L-CSV-035", file: "公開確認-L002.csv", label: "〔商品ID-M0338-035〕", values: ["1", "1"], seedTableId: "38038002" },
  { seedId: "S-M03-38-L-CSV-036", file: "公開確認-L003.csv", label: "〔商品ID-M0338-036〕", values: ["1", "0"], seedTableId: "38038003" },
  { seedId: "S-M03-38-L-CSV-037", file: "公開確認-L004.csv", label: "〔商品ID-M0338-037〕", values: ["0", "1"], seedTableId: "38038004" },
  { seedId: "S-M03-38-CBCSV-046", file: "cbm0338-046.csv", label: "〔商品ID-M0338-046〕", values: ["0", "0"] },
  {
    seedId: "S-M03-38-CBCSV-047", file: "cbm0338-047.csv", label: "〔商品ID-M0338-047〕", values: ["1", "1"],
    note: "ケースの事前準備は商品公開ステータスを「2（公開）」と書くが、シード表の状態・属性は「〔商品ID-M0338-047〕,1,1」。" +
      "設計書の商品公開CSVフォーマット（識別ID 2: 0=非公開・1=公開）と手元の画面の項目説明（1=公開）もシード表と同じく1が公開なので、シード表の値（1）を書いた",
  },
];

function csvSpec(seedId: string): CsvSpec {
  const s = CSVS.find((x) => x.seedId === seedId);
  if (!s) throw new Error(`${seedId} の取込ファイルの定義が無い`);
  return s;
}
defineSeed("S-M03-38-L-CSV-034", { needs: ["S-M03-38-L-PROD-034"] }, async ({ notes }) => buildStatusCsv(notes, csvSpec("S-M03-38-L-CSV-034")));
defineSeed("S-M03-38-L-CSV-035", { needs: ["S-M03-38-L-PROD-035"] }, async ({ notes }) => buildStatusCsv(notes, csvSpec("S-M03-38-L-CSV-035")));
defineSeed("S-M03-38-L-CSV-036", { needs: ["S-M03-38-L-PROD-036"] }, async ({ notes }) => buildStatusCsv(notes, csvSpec("S-M03-38-L-CSV-036")));
defineSeed("S-M03-38-L-CSV-037", { needs: ["S-M03-38-L-PROD-037"] }, async ({ notes }) => buildStatusCsv(notes, csvSpec("S-M03-38-L-CSV-037")));
defineSeed("S-M03-38-CBCSV-046", { needs: ["S-M03-38-CBPUB-046"] }, async ({ notes }) => buildStatusCsv(notes, csvSpec("S-M03-38-CBCSV-046")));
defineSeed("S-M03-38-CBCSV-047", { needs: ["S-M03-38-CBPUB-047"] }, async ({ notes }) => buildStatusCsv(notes, csvSpec("S-M03-38-CBCSV-047")));
