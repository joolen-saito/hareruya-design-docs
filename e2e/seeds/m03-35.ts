/**
 * M03-35 部門更新CSV登録の画面シード。正本: cases/M03-35_seed_data.tsv
 *
 * 作るシード（使うケースだけ）:
 * - S-M03-35-ADM・S-M03-35-L-ADM: メンバー管理で登録する（M03-20 と同じ作り方。正本は所属店舗を指定しないので、選べる店舗の先頭に
 *   所属させ、商品管理を操作できるシステム管理者の権限を付ける）。シード表の S-M03-35-ADM の「管理者ID=353500000」は、
 *   メンバー登録の画面では指定できない（画面が振る）。実装したケースは管理者IDを使わない。
 * - S-M03-35-CSV-CONFIG・S-M03-35-L-CSVCONF: 管理画面に設定項目が無い。設定を書き換えず、CSV取込の区切り文字がカンマ・
 *   ファイルサイズ上限が5MBであることだけを確かめる（違えば止める）。「受理できるデータ行数の上限=5009件」は設定値でなく
 *   アプリのコードの固定値（見出しを含めて5010行以上を拒む。`src/Eccube/Controller/AbstractController.php` 364行）なので、実行時には確かめない。
 * - S-M03-35-CASE-021・023・027: ケースが選ぶファイルを試験端末（e2e/.state/m03-35/）に作り、部門更新CSV登録画面の取込履歴に
 *   同名のファイルの行が無いことを確かめる（取込履歴を消す画面は無い。行があれば止める）。
 * - S-M03-35-L-*-045・046: 部門登録/編集画面で部門を登録し、グッズ商品CSV登録で商品を作る。
 *
 * ファイルの中身で、正本が決めていない部分（解釈。記録の注記に書く）:
 * - m0335_invalid-021.png: 「有効なPNGバイナリ」だけが指定。1×1画素の透明のPNG（68バイト）にした。
 * - m0335_oversize-023.csv: 「5MB+1バイト」だけが指定。5MB は 5×1024×1024 バイトと読み（M03-20 の022と同じ）、5,242,881 バイトにした。
 *   中身は部門更新CSVフォーマットの見出し行（S-M03-35-CASE-025 の見出しと同じ「商品コード,部門コード(ID)」）のあとを改行で埋めた。
 *   アプリの大きさの上限は 5,000,000 バイト（Symfony の「5M」）なので、どちらの読み方でも上限を超える。
 * - m0335_header_only-027.csv: 「正しい見出しのみ」。同じ機能の S-M03-35-CASE-025 が書く見出し「商品コード,部門コード(ID)」にした。
 * - m0335_three_columns-027.csv: データ行「UNUSED-027,32,EXTRA」だけが指定で、見出し行は指定が無い。上と同じ見出し行を足した。
 * - 改行は LF、末尾に改行1個、先頭の印（BOM）なし（e2e/fixtures/README.md の決まり）。
 * - m0335_empty-027.csv・m0335l_assign-001.csv・m0335l_assign-002.csv は e2e/fixtures/m03-35/ のもの（正本で中身が確定。照合は tools/verify-m03-35-fixtures.mjs）。
 *
 * 作らないシード（使うケースも実装しない）: S-M03-35-SECTIONS（スマレジ試験用部門IDをDBへ直接設定する）、S-M03-35-CASE-004〜007
 * （取込履歴をDBフィクスチャで入れる）、S-M03-35-SMAREGI（スマレジAPI呼出記録をDBフィクスチャで消す）ほか。
 */
import fs from "node:fs";
import path from "node:path";
import { Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import { openProductEditByCode, productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { onlyProductClassIdOf, SectionUpdateCsvPage, 取込ファイル } from "../pages/admin/m03_35_section_update_csv";
import { ensureMember } from "../pages/admin/member";

export const M0335_ADMIN: Account = { loginId: "m0335_admin", password: "Passw0rd!M0335" };
export const M0335L_ADMIN: Account = { loginId: "m0335l_admin", password: "Passw0rd!M0335L" };

// ---- ファイル ----

const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-35");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-35");
/** e2e/fixtures/m03-35/ にあるファイル（正本で中身が確定したもの） */
const FIXTURES = new Set(["m0335_empty-027.csv", "m0335l_assign-001.csv", "m0335l_assign-002.csv"]);
/** シードが用意したファイル（ケースが選んでよいもの） */
const PREPARED = new Set<string>();

/** 送るときの形式種別（ブラウザがファイルの拡張子から決めるものと同じ） */
const MIME: Record<string, string> = { csv: "text/csv", png: "image/png" };

/** 部門更新CSVフォーマットの見出し行（S-M03-35-CASE-025 の「商品コード,部門コード(ID)の見出しのみ」と同じ） */
const 見出し行 = "商品コード,部門コード(ID)";
/** 「5MB」の読み方（解釈）。5×1024×1024 バイト */
export const 五MB = 5 * 1024 * 1024;
/** 1×1画素の透明のPNG */
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/** ケースが選ぶファイル（シードが用意したもの） */
export function m0335File(name: string): 取込ファイル {
  if (!PREPARED.has(name)) throw new Error(`${name} は M03-35 のシードが用意したファイルでない（シードを作っていないか、名前の誤り）`);
  const file = FIXTURES.has(name) ? path.join(FIXTURE_DIR, name) : path.join(RUNTIME_DIR, name);
  if (!fs.existsSync(file)) throw new Error(`${name} が無い（${file}）`);
  const ext = name.split(".").pop() ?? "";
  const mimeType = MIME[ext];
  if (!mimeType) throw new Error(`${name}: 拡張子 ${ext} の形式種別を決めていない`);
  return { name, mimeType, buffer: fs.readFileSync(file) };
}

/** シード表の文に、ファイル名と正本の語が書かれていること（書き写しの誤りを止める） */
function expectInSeed(seedId: string, words: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  for (const w of words) if (!text.includes(w)) throw new Error(`${seedId}: シード表に「${w}」が無い（書き写しの誤り）`);
}

/** 試験端末にファイルを作り、読み戻して同じであることを確かめる */
function writeRuntime(seedId: string, name: string, bytes: Buffer): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const file = path.join(RUNTIME_DIR, name);
  fs.writeFileSync(file, bytes);
  if (!fs.readFileSync(file).equals(bytes)) throw new Error(`${seedId}: ${file} を書いた中身と読み戻した中身が違う`);
  PREPARED.add(name);
}

/** e2e/fixtures/m03-35/ のファイルがあり、0バイトと指定されたものは0バイトであること */
function useFixture(seedId: string, name: string, size?: number): void {
  const file = path.join(FIXTURE_DIR, name);
  if (!fs.existsSync(file)) throw new Error(`${seedId}: ${file} が無い`);
  if (size !== undefined && fs.statSync(file).size !== size) throw new Error(`${seedId}: ${file} が ${size} バイトでない`);
  PREPARED.add(name);
}

/** 部門更新CSV登録画面の取込履歴に、同名のファイルの行が無いことを確かめる（取込履歴を消す画面は無いので、あれば止める） */
async function expectNoHistory(page: Page, seedId: string, names: string[]): Promise<void> {
  const u = new SectionUpdateCsvPage(page);
  for (const name of names) {
    const n = await u.countHistoryNamed(name);
    if (n > 0) {
      throw new Error(`${seedId}: 部門更新CSV登録画面の取込履歴に「${name}」の行が ${n} 件残っている。取込履歴を消す画面が無く、DBでの準備になるので止めた`);
    }
  }
  reportSeedIssue(seedId, `取込履歴に「${names.join("」「")}」の行が無いことを、部門更新CSV登録画面の取込履歴（12000件表示）で確かめた（同名履歴の削除は、消すものが無かった）`);
}

// ---- 管理者・設定 ----

/** 正本は所属店舗を指定しない。選べる店舗の先頭に所属させ、商品管理を操作できるシステム管理者の権限を付ける（M03-20 と同じ作り方） */
async function createAdmin(page: Page, 名前: string, account: Account, email: string): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error(`${名前}: メンバーに割り当てられる店舗が画面に無い`);
  const store = stores[0];
  await ensureMember(page, {
    名前, 所属店舗: store, ログインID: account.loginId, メールアドレス: email,
    パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

/** ログインでき（稼働中）、部門更新CSV登録画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page): Promise<void> {
  await new SectionUpdateCsvPage(page).open();
}

defineSeed("S-M03-35-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-35試験管理者", M0335_ADMIN, "m0335_admin@example.test"));
  await withAdminSession(browser, M0335_ADMIN, (page) => expectCanOpen(page));
});

defineSeed("S-M03-35-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-35連携試験管理者", M0335L_ADMIN, "m0335l_admin@example.test"));
  await withAdminSession(browser, M0335L_ADMIN, async (page) => {
    await expectCanOpen(page);
    await new DepartmentPage(page).openNew();
  });
});

function expectCsvConfig(seedId: string): void {
  // 管理画面に設定項目が無い。設定を書き換えず、値がシード表の状態であることだけを確かめる（違えば止める）。
  const c = CSV入出力設定();
  if (c.アップロード上限MB !== 5 || c.取込区切り文字 !== ",") {
    throw new Error(`${seedId}: CSVアップロードのファイルサイズ上限が ${c.アップロード上限MB}MB、CSV取込の区切り文字が「${c.取込区切り文字}」`
      + "（シード表は 5MB・カンマ）。設定を直してアプリのキャッシュを作り直してから流す");
  }
}
defineSeed("S-M03-35-CSV-CONFIG", async ({ seed }) => { expectCsvConfig(seed.シードID); });
defineSeed("S-M03-35-L-CSVCONF", async ({ seed }) => { expectCsvConfig(seed.シードID); });

// ---- ケースが選ぶファイル ----

defineSeed("S-M03-35-CASE-021", async ({ browser, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0335_invalid-021.png", "有効なPNG"]);
  if (!PNG_1x1.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) throw new Error(`${id}: PNG の署名でない`);
  writeRuntime(id, "m0335_invalid-021.png", PNG_1x1);
  await withAdminSession(browser, SETUP_ADMIN, (page) => expectNoHistory(page, id, ["m0335_invalid-021.png"]));
});

defineSeed("S-M03-35-CASE-023", async ({ browser, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0335_oversize-023.csv", "5MB+1バイト"]);
  const head = `${見出し行}\n`;
  const size = 五MB + 1;
  const bytes = Buffer.from(head + "\n".repeat(size - Buffer.byteLength(head, "utf-8")), "utf-8");
  if (bytes.length !== size) throw new Error(`${id}: m0335_oversize-023.csv が ${size} バイトにならない（${bytes.length}）`);
  writeRuntime(id, "m0335_oversize-023.csv", bytes);
  await withAdminSession(browser, SETUP_ADMIN, (page) => expectNoHistory(page, id, ["m0335_oversize-023.csv"]));
});

defineSeed("S-M03-35-CASE-027", async ({ browser, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0335_empty-027.csv=0バイト", "m0335_header_only-027.csvは正しい見出しのみ", "m0335_three_columns-027.csvはデータ=UNUSED-027,32,EXTRA", "UTF-8"]);
  expectInSeed("S-M03-35-CASE-025", [`${見出し行}の見出しのみ`]);
  useFixture(id, "m0335_empty-027.csv", 0);
  writeRuntime(id, "m0335_header_only-027.csv", Buffer.from(`${見出し行}\n`, "utf-8"));
  writeRuntime(id, "m0335_three_columns-027.csv", Buffer.from(`${見出し行}\nUNUSED-027,32,EXTRA\n`, "utf-8"));
  await withAdminSession(browser, SETUP_ADMIN, (page) => expectNoHistory(page, id, ["m0335_empty-027.csv", "m0335_header_only-027.csv", "m0335_three_columns-027.csv"]));
});

// ---- 部門・商品（045・046） ----

type 部門の指定 = { label: string; 部門名: string; 部門コード: string };

/** 部門登録/編集画面で部門を登録し、一覧の部門名の行のID列の部門IDを控える。前の実行で同じ部門名・部門コードが残っていれば止める（正本に清掃の手順が無い） */
function defineDepartmentSeed(seedId: string, d: 部門の指定): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    expectInSeed(seed.シードID, [d.部門名, d.部門コード, "一般品", "MTGBuyer表示フラグを表示する"]);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const s = new DepartmentPage(page);
      await s.openNew();
      const left = (await s.rowsByName(d.部門名).count()) + (await s.rowsByCode(d.部門コード).count());
      if (left > 0) throw new Error(`${seedId}: 部門名「${d.部門名}」または部門コード ${d.部門コード} の部門が前の実行で残っている。正本に清掃の手順が無いので、同じDBでは流し直さない`);
      const id = await s.register({ 部門名: d.部門名, 部門コード: d.部門コード, 免税区分: "一般品", MTGBuyer表示フラグ: true }, `${seedId}: 部門「${d.部門名}」の登録`);
      notes.set(d.label, id);
    });
  });
}

defineDepartmentSeed("S-M03-35-L-DEPT-045", { label: "〔部門ID-M0335-045A〕", 部門名: "連携削除確認部門-001", 部門コード: "33510001" });
defineDepartmentSeed("S-M03-35-L-DEPTB-045", { label: "〔部門ID-M0335-045B〕", 部門名: "連携元部門-001", 部門コード: "33510002" });
defineDepartmentSeed("S-M03-35-L-DEPT-046", { label: "〔部門ID-M0335-046A〕", 部門名: "連携解放部門-002", 部門コード: "33520001" });
defineDepartmentSeed("S-M03-35-L-DEPTB-046", { label: "〔部門ID-M0335-046B〕", 部門名: "連携移行先部門-002", 部門コード: "33520002" });

/**
 * 商品一覧で商品コードを検索して0件を確かめ、グッズ商品CSV登録で商品を1件作る（部門IDは控えた部門ID・商品公開ステータスは公開・スマレジ連携フラグ0）。
 * 「そのほかの必須列に有効な値」は、M03-01 のグッズ商品シードと同じ共通の値（言語は日本語・支店の商品公開ステータスは公開・サイズ1・重量1・
 * 商品カテゴリはサプライ・グッズ・購入グループは既存の先頭・基準価格100・販売価格100・買取価格10・原価単価10）にした。
 * そのあと商品一覧で商品コードを検索して商品IDを、商品規格一覧から開いた商品規格の編集画面で商品規格IDを控える。
 */
function defineItemSeed(seedId: string, needs: string, n: string, code: string, 部門: string): void {
  defineSeed(seedId, { needs: [needs] }, async ({ browser, notes, seed }) => {
    expectInSeed(seed.シードID, [code, 部門, "商品公開ステータス=1（公開）", "スマレジ連携フラグ=0"]);
    const warn = (m: string) => reportSeedIssue(seedId, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const before = await productIdsByCode(page, code);
      if (before.length > 0) throw new Error(`${seedId}: 商品一覧で商品コード ${code} を検索すると ${before.length} 件ある（0件のはず）。正本に清掃の手順が無いので止めた`);
      const categoryId = await goodsCsvCategoryId(page, warn);
      await registerGoodsCsv(page, {
        what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId,
        lines: [{ code, nameJp: `M0335L商品-${n}`, nameEn: `M0335L product ${n}` }],
        common: { "部門ID": notes.get(部門), "スマレジ連携フラグ": "0" },
        onWarning: warn,
      });
      warn("グッズ商品CSV: そのほかの必須列は M03-01 のグッズ商品シードと同じ共通の値にした（商品名は「M0335L商品-" + n + "」）。商品公開ステータスは画面のCSV形式の説明で公開を表す値");
      const productId = await openProductEditByCode(page, code);
      notes.set(`〔商品ID-M0335-${n}〕`, productId);
      notes.set(`〔商品規格ID-M0335-${n}〕`, await onlyProductClassIdOf(page, productId, code));
    });
  });
}

defineItemSeed("S-M03-35-L-ITEM-045", "S-M03-35-L-DEPTB-045", "045", "M0335L-PC-001", "〔部門ID-M0335-045B〕");
defineItemSeed("S-M03-35-L-ITEM-046", "S-M03-35-L-DEPT-046", "046", "M0335L-PC-002", "〔部門ID-M0335-046A〕");

/** 取込ファイル（e2e/fixtures/m03-35/ の正本で確定したもの）を使えるようにし、取込履歴に同名の行が無いことを確かめる */
function defineAssignCsvSeed(seedId: string, name: string): void {
  defineSeed(seedId, async ({ browser, seed }) => {
    expectInSeed(seed.シードID, [name]);
    useFixture(seedId, name);
    await withAdminSession(browser, SETUP_ADMIN, (page) => expectNoHistory(page, seedId, [name]));
  });
}
defineAssignCsvSeed("S-M03-35-L-CSV-045", "m0335l_assign-001.csv");
defineAssignCsvSeed("S-M03-35-L-CSV-046", "m0335l_assign-002.csv");
