/**
 * M04-24 在庫移動指示検索・作成の画面シード。正本: cases/M04-24_seed_data.tsv
 *
 * 作るシード（画面だけで準備できるケースが使うもの）:
 * - S-M04-24-STORES: 試験店舗6店（本店・大阪店・名古屋店・福岡店・札幌店・仙台店）。あれば内容を確かめて使い、無ければ店舗登録画面で登録する。
 *   手元のDBには同じ店名の閉店の店舗（会社名「株式会社 晴れる屋」）があるので、店名・会社名「株式会社晴れる屋」・開店の行を試験店舗とみなす。
 *   名古屋店〜仙台店は、正本が「そのほかの必須項目に任意の有効な値」とするので、会社名・会社名(カナ)は本店と同じにし、住所・電話番号は店ごとの値にした。
 *   店名(カナ)は正本に無いので、本店「ホンテン」・大阪店「オオサカテン」とした（ケース 028 の期待結果の「…ホンテン」「…オオサカテン」と合う）。
 * - S-M04-24-ADM: M04-24試験管理者。メンバー管理で登録し、所属店舗とデフォルト検索表示店舗を本店、編集可能店舗を6店、権限をシステム管理者にする。
 *   管理者IDは画面が振るので、正本の 42700001 にはならない（ケースの手順・期待結果には出てこない）。
 * - S-M04-24-LIST-CONFIG: 在庫移動指示一覧の初期表示件数は、管理画面に設定の項目が無いアプリの設定値。書き換えず、既定値の50であることだけを確かめる。
 * - 在庫移動・在庫移動指示を作るケース専用のシード（009・012・021〜027・033・036・037）: 正本の作り方のとおり、
 *   在庫検索一覧 →「在庫移動登録」→ 在庫移動・振替登録 → ピック・出庫承認申請（承認申請）→ 別の管理者の出庫承認 →
 *   在庫移動・振替検索一覧の「在庫移動指示作成」→ 一覧の行の移動指示リストIDを控える、の順に画面で作る。
 * - CSV のシード（033・036・037）は、作った移動指示IDを書いたCSVファイルを、試験者のPCの代わりに e2e/.state/m04-24 に作る。
 *   043 の見出し違いのCSVは e2e/fixtures/m04-24 にある（tools/verify-m04-24-fixtures.mjs が中身を照合する）。
 *
 * 正本の外で補ったもの（記録 e2e/review/M04-24_progress_2026-10-20.md に書いた）:
 * - 承認する管理者: 正本は「本店（名古屋店）の承認権限を持つ別の管理者」を求めるが、シード表に無い。承認通知先に選べるのは出庫元店舗に所属する
 *   メンバーだけで、承認できるのは登録者と別の、出庫元店舗を編集できる管理者なので、店舗ごとに「M04-24本店承認者」「M04-24名古屋店承認者」を作る。
 * - 在庫: 正本は「本店（名古屋店）に在庫が1点以上ある商品」があることを前提にするが、新しく作った店舗には在庫が無い。
 *   グッズ商品CSV登録で商品「M04-24在庫移動用商品」（商品コード M0424-STOCK-001）を1件作り（あれば使う）、在庫が足りなければ
 *   在庫編集（入庫/その他・20点）を登録して承認する管理者が承認する。商品カテゴリはサプライ・グッズ（カテゴリ登録/編集画面の最上位の行のID）。
 * - 送り状No.を登録するシード（SEARCH-024・025）の検索: シード表は在庫移動指示IDだけを入れるが、画面が必須にしている出庫元・入庫先の店舗も選ぶ。
 * この補いは HANDOFF 4章の9（M03-01 の026・053。正本の外で承認する管理者を作るかの判断待ちで未実装のまま止めている）と同じ種類で、
 * 判断を待たずに作って流した。在庫移動を作るケース（009・012・021〜027・033・036・037）の合否は、どれもこの補いがあって成り立つ（記録の裁定案6）。
 * 補った商品（固定の商品コード）は、正本に清掃の手順が無く、在庫編集の記録があるので画面から完全には消せない。
 *
 * DBでの準備が要るシード（CREATE-003〜008・EMPTY-018・SEARCH-019・PAGING-020・OUTPUT-028・CSV-041・SEARCH-046・DPS-047〜049・RD-*）は作らない。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Browser, expect, Page } from "@playwright/test";
import { APP_CONTAINER, ENV_NAME, REPO_ROOT, SETUP_ADMIN, SHARED_ENV, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { MoveInstructionSearchPage } from "../pages/admin/m04_24_move_instruction";
import {
  approveOutbound, MoveTransferListPage, openStockApprovalListForStore, registerMove, requestOutboundApproval, searchStock, stockOf,
} from "../pages/admin/m04_24_stock_move";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { goodsRootCategoryLink } from "../pages/admin/product_masters";
import { ProductSearchPage } from "../pages/admin/product_search";
import { registerStockEdit } from "../pages/admin/stock_edit";

export const M0424_ADMIN: Account = { loginId: "m0424_admin", password: "Passw0rd!M0424" };
const ADMIN_NAME = "M04-24試験管理者";

// ---- 店舗 ----

export type StoreName = "本店" | "大阪店" | "名古屋店" | "福岡店" | "札幌店" | "仙台店";

const COMPANY = "株式会社晴れる屋";
const COMPANY_KANA = "カブシキガイシャハレルヤ";
const store = (店名: StoreName, 店名カナ: string, 店名英語: string, key: string, 略称: string,
  郵便番号: string, 都道府県: string, 住所1: string, 住所2: string, 電話番号: string): M0424StoreInput => ({
  店名, 店名カナ, 店名英語, 支店URL: `m0424${key}`, 店名略称3文字: 略称, ショップ名略称: 店名,
  会社名: COMPANY, 会社名カナ: COMPANY_KANA, 郵便番号, 都道府県, 住所1, 住所2, 電話番号,
});

/** 試験店舗と、控える呼び名（シード表の状態・属性の順） */
const STORES: { 呼び名: string; input: M0424StoreInput }[] = [
  { 呼び名: "〔店舗ID-M0424-共有A〕", input: store("本店", "ホンテン", "Honten", "honten", "Q4A", "160-0023", "東京都", "新宿区西新宿1-1-1", "晴ビル1F", "03-1111-1111") },
  { 呼び名: "〔店舗ID-M0424-共有B〕", input: store("大阪店", "オオサカテン", "Osaka", "osaka", "Q4B", "530-0001", "大阪府", "大阪市北区梅田1-1-1", "晴ビル2F", "06-2222-2222") },
  { 呼び名: "〔店舗ID-M0424-共有C〕", input: store("名古屋店", "ナゴヤテン", "Nagoya", "nagoya", "Q4C", "460-0008", "愛知県", "名古屋市中区栄1-1-1", "晴ビル3F", "052-333-3333") },
  { 呼び名: "〔店舗ID-M0424-共有D〕", input: store("福岡店", "フクオカテン", "Fukuoka", "fukuoka", "Q4D", "810-0001", "福岡県", "福岡市中央区天神1-1-1", "晴ビル4F", "092-444-4444") },
  { 呼び名: "〔店舗ID-M0424-共有E〕", input: store("札幌店", "サッポロテン", "Sapporo", "sapporo", "Q4E", "060-0001", "北海道", "札幌市中央区北一条西1-1-1", "晴ビル5F", "011-555-5555") },
  { 呼び名: "〔店舗ID-M0424-共有F〕", input: store("仙台店", "センダイテン", "Sendai", "sendai", "Q4F", "980-0001", "宮城県", "仙台市青葉区中央1-1-1", "晴ビル6F", "022-666-6666") },
];

/** 試験店舗の店舗ID（S-M04-24-STORES が控えたもの） */
export function storeIdOf(notes: Notes, 店名: StoreName): string {
  const s = STORES.find((x) => x.input.店名 === 店名);
  if (!s) throw new Error(`試験店舗に「${店名}」は無い`);
  return notes.get(s.呼び名);
}

defineSeed("S-M04-24-STORES", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const s of STORES) notes.set(s.呼び名, await ensureStore(page, s.input, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

// ---- 管理者 ----

defineSeed("S-M04-24-ADM", { needs: ["S-M04-24-STORES"] }, async ({ browser, notes }) => {
  const honten = storeIdOf(notes, "本店");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: ADMIN_NAME, ログインID: M0424_ADMIN.loginId, メールアドレス: "m0424_admin@example.test", パスワード: M0424_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: honten, デフォルト検索表示店舗ID: honten, 編集可能店舗ID: STORES.map((s) => notes.get(s.呼び名)),
  }));
  // ログインでき（ロックされていない）、在庫移動指示検索画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0424_ADMIN, async (page) => {
    await new MoveInstructionSearchPage(page).open();
  });
});

/** 出庫元店舗ごとの、承認する管理者（正本の「登録した管理者とは別の、出庫元店舗の承認権限を持つ管理者」。シード表に無いので補う） */
type FromStore = "本店" | "名古屋店";
const APPROVERS: Record<FromStore, { 名前: string; account: Account; email: string }> = {
  本店: { 名前: "M04-24本店承認者", account: { loginId: "m0424-apr-honten", password: "Passw0rd!M0424apr" }, email: "m0424-apr-honten@example.test" },
  名古屋店: { 名前: "M04-24名古屋店承認者", account: { loginId: "m0424-apr-nagoya", password: "Passw0rd!M0424apr" }, email: "m0424-apr-nagoya@example.test" },
};
const approverReady = new Set<FromStore>();

/** 承認する管理者があれば内容を確かめて使い、無ければ登録する（所属店舗・デフォルト検索表示店舗・編集可能店舗を出庫元店舗に、権限をシステム管理者に） */
async function ensureApprover(browser: Browser, notes: Notes, from: FromStore): Promise<{ 名前: string; account: Account }> {
  const a = APPROVERS[from];
  if (!approverReady.has(from)) {
    const id = storeIdOf(notes, from);
    await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
      名前: a.名前, ログインID: a.account.loginId, メールアドレス: a.email, パスワード: a.account.password,
      権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: id, 編集可能店舗ID: [id],
    }));
    await withAdminSession(browser, a.account, async () => undefined); // ログインできること
    approverReady.add(from);
  }
  return { 名前: a.名前, account: a.account };
}

// ---- 一覧設定 ----

/**
 * 在庫移動指示一覧の初期表示件数（アプリの設定値）。手元の環境でだけ、アプリのコンテナで設定値を表示するコマンドを流して読む（読み取りだけ）。
 * 共通の部品（lib/app_config.ts）にこの設定を読む関数が無いので、ここに置いた（要望として報告した）。
 * 設定値の名前をここに書くのは、論理名の規約（物理名は SQL とセレクタの文字列の中にだけ書く）からの一時的な逸脱である。
 * 共通の部品に関数が足されたら、この関数をそれに置き換えて逸脱を無くす（記録 e2e/review/M04-24_progress_2026-10-20.md の「共通の部品への要望」）。
 */
function 在庫移動指示一覧の初期表示件数(): number {
  if (ENV_NAME !== "local" || SHARED_ENV) throw new Error(`E2E_ENV=${ENV_NAME} ではアプリの設定値を読めない。環境の担当者に値を確かめてもらう`);
  const name = "eccube_admin_stock_move_instruction_list_page_count";
  const out = execFileSync("docker", ["exec", APP_CONTAINER, "php", "bin/console", "debug:container", `--parameter=${name}`, "--format=json"],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  const json = JSON.parse(out) as Record<string, unknown>;
  if (!(name in json)) throw new Error("在庫移動指示一覧の初期表示件数の設定値が無い");
  return Number(json[name]);
}

defineSeed("S-M04-24-LIST-CONFIG", async () => {
  // 管理画面に設定の項目が無い。設定を書き換えず、値がシード表の状態（アプリの既定値の50）であることだけを確かめる（違えば止める）
  const n = 在庫移動指示一覧の初期表示件数();
  if (n !== 50) throw new Error(`S-M04-24-LIST-CONFIG: 在庫移動指示一覧の初期表示件数が ${n}（シード表は50）。設定を直してアプリのキャッシュを作り直してから流す`);
});

// ---- 在庫（正本の前提「在庫が1点以上ある商品」を画面で用意する） ----

const STOCK_PRODUCT = { 商品コード: "M0424-STOCK-001", 商品名: "M04-24在庫移動用商品", 英語名: "M0424 Stock Move Product" };
const STOCK_LOCATION = "EC-CUBE";
const TOP_UP = 20;

/** カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID */
async function readGoodsRootCategoryId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  const link = goodsRootCategoryLink(page);
  await expect(link, "カテゴリ登録/編集画面の最上位の「サプライ・グッズ」の行は1件").toHaveCount(1);
  const m = /^ID:(\d+)\s/.exec(((await link.textContent()) ?? "").trim());
  if (!m) throw new Error("サプライ・グッズのカテゴリIDを画面から読めない");
  return m[1];
}

/** 商品マスターで商品コードが一致する商品の件数 */
async function countProductsByCode(page: Page, code: string): Promise<number> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  const codes = await page.locator('tr[id^="ex-product-"] td:nth-child(4)').allInnerTexts();
  return codes.filter((c) => c.trim() === code).length;
}

/** 出庫元店舗の、在庫検索一覧の在庫移動用商品の在庫数。行が無ければ null */
async function readStock(browser: Browser, storeId: string, 店名: StoreName): Promise<number | null> {
  return withAdminSession(browser, M0424_ADMIN, async (page) => {
    const list = await searchStock(page, STOCK_PRODUCT.商品コード, storeId);
    const row = list.row(STOCK_PRODUCT.商品コード, 店名, STOCK_LOCATION);
    if ((await row.count()) === 0) return null;
    return stockOf(row);
  });
}

/** 出庫元店舗に在庫移動用商品の在庫が need 点以上あるようにする（無ければ商品を作り、足りなければ入庫して承認する） */
async function ensureStock(browser: Browser, notes: Notes, seedId: string, from: FromStore, need: number): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const storeId = storeIdOf(notes, from);
  const approver = await ensureApprover(browser, notes, from);
  let stock = await readStock(browser, storeId, from);
  if (stock === null) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      if (await countProductsByCode(page, STOCK_PRODUCT.商品コード) > 0) {
        throw new Error(`${seedId}: 商品コード ${STOCK_PRODUCT.商品コード} の商品はあるが、${from}・${STOCK_LOCATION} の在庫の行が無い（店舗より先に商品が作られている）`);
      }
      await registerGoodsCsv(page, {
        what: `${seedId}: 在庫移動用商品のグッズ商品CSV登録`, fileName: "m04-24-stock-product.csv", categoryId: await readGoodsRootCategoryId(page),
        lines: [{ code: STOCK_PRODUCT.商品コード, nameJp: STOCK_PRODUCT.商品名, nameEn: STOCK_PRODUCT.英語名 }], onWarning: issue,
      });
      issue("在庫移動用商品のグッズ商品CSVのアップロードのあと、確認モーダルは出ず、そのまま取り込まれた（設計書 M03-27 L0092 は確認モーダルでの確定を定める。依頼者の判断待ち）");
    });
    stock = await readStock(browser, storeId, from);
    if (stock === null) throw new Error(`${seedId}: グッズ商品CSVで在庫移動用商品を作ったが、在庫検索一覧に ${from}・${STOCK_LOCATION} の行が出ない`);
  }
  if (stock >= need) return;
  await withAdminSession(browser, M0424_ADMIN, async (page) => {
    const list = await searchStock(page, STOCK_PRODUCT.商品コード, storeId);
    await list.openEdit(list.row(STOCK_PRODUCT.商品コード, from, STOCK_LOCATION));
    await registerStockEdit(page, {
      changeType: "入庫/その他", reason: "M04-24結合テスト", quantity: String(TOP_UP), purchasePrice: "100", approverName: approver.名前,
    }, `${seedId}: ${from} の在庫編集（入庫 ${TOP_UP}）`, issue);
  });
  await withAdminSession(browser, approver.account, async (page) => {
    const approvals = await openStockApprovalListForStore(page, storeId);
    const rows = (await approvals.rowValues()).filter((r) => r.status === "未承認" && r.registrant === ADMIN_NAME
      && r.shop.startsWith(from) && r.changeType.endsWith("入庫/その他") && r.quantity === String(TOP_UP));
    if (rows.length === 0) throw new Error(`${seedId}: ${from} の在庫編集（入庫 ${TOP_UP}）の未承認の行が在庫編集承認一覧に無い`);
    if (rows.length > 1) issue(`${from} の在庫編集（入庫 ${TOP_UP}）の未承認の行が${rows.length}件あり、一覧の先頭を承認した`);
    await approvals.approve([rows[0].id], `${seedId}: ${from} の在庫編集の承認`, issue);
  });
  const after = await readStock(browser, storeId, from);
  if (after === null || after < need) throw new Error(`${seedId}: 入庫を承認したあとも ${from} の在庫が ${after}（${need} 点以上が要る）`);
}

// ---- 在庫移動と在庫移動指示 ----

type MoveSpec = {
  出庫元: FromStore; 入庫先: StoreName; 移動点数: number;
  /** 控える呼び名 */
  移動ID: string; 移動指示ID: string;
  /** 送り状No.を登録するときだけ */
  送り状No?: string;
};

/**
 * 正本の作り方: 在庫一覧で出庫元店舗に在庫がある商品の行を選んで「在庫移動登録」→ 入庫先店舗・入庫先在庫区分（任意の区分。出庫元と同じ EC-CUBE）・
 * 移動点数を入れて「登録」→確認の「登録」→ ピック・出庫承認申請画面で在庫移動・振替IDを控え、承認通知先に承認する管理者を選んで「承認申請」→
 * 承認する管理者でログインし、出庫承認画面で「承認」→「承認する」→ 在庫移動・振替検索一覧で行を選んで「在庫移動指示作成」→ 行の移動指示IDを控える。
 * 送り状No. を渡したときは、続けて在庫移動指示検索画面で検索し、行の「登録」から送り状No.を登録する。
 */
async function buildMoveInstruction({ browser, notes, seed }: SeedCtx, spec: MoveSpec): Promise<void> {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const fromId = storeIdOf(notes, spec.出庫元);
  const toId = storeIdOf(notes, spec.入庫先);
  const approver = await ensureApprover(browser, notes, spec.出庫元);
  await ensureStock(browser, notes, seedId, spec.出庫元, spec.移動点数);

  const moveId = await withAdminSession(browser, M0424_ADMIN, async (page) => {
    const list = await searchStock(page, STOCK_PRODUCT.商品コード, fromId);
    const id = await registerMove(page, list.row(STOCK_PRODUCT.商品コード, spec.出庫元, STOCK_LOCATION),
      { 入庫先店舗ID: toId, 入庫先在庫区分: STOCK_LOCATION, 移動点数: String(spec.移動点数) }, `${seedId}: 在庫移動の登録`);
    notes.set(spec.移動ID, id);
    await requestOutboundApproval(page, id, approver.名前, `${seedId}: 在庫移動 ${id} の承認申請`);
    return id;
  });

  await withAdminSession(browser, approver.account, async (page) => {
    const moves = new MoveTransferListPage(page);
    await moves.searchById(moveId);
    const s = await moves.rowState(moveId);
    if (s.ステータス !== "出庫承認待ち") throw new Error(`${seedId}: 承認申請のあと、在庫移動 ${moveId} のステータスが「${s.ステータス}」（出庫承認待ちのはず）`);
    await moves.openFromRow(moveId);
    await approveOutbound(page, moveId, `${seedId}: 在庫移動 ${moveId} の出庫承認`);
  });

  await withAdminSession(browser, M0424_ADMIN, async (page) => {
    const moves = new MoveTransferListPage(page);
    await moves.searchById(moveId);
    const before = await moves.rowState(moveId);
    if (before.ステータス !== "出庫承認済み") throw new Error(`${seedId}: 出庫承認のあと、在庫移動 ${moveId} のステータスが「${before.ステータス}」（出庫承認済みのはず）`);
    await moves.createInstruction([moveId], `${seedId}: 在庫移動 ${moveId} の在庫移動指示作成`);
    await moves.searchById(moveId);
    const after = await moves.rowState(moveId);
    if (!/^\d+$/.test(after.移動指示リストID)) throw new Error(`${seedId}: 在庫移動指示作成のあと、在庫移動 ${moveId} の行の移動指示リストIDが「${after.移動指示リストID}」`);
    const instructionId = after.移動指示リストID;
    notes.set(spec.移動指示ID, instructionId);

    if (spec.送り状No) {
      const search = new MoveInstructionSearchPage(page);
      await search.open();
      issue("正本の作り方は在庫移動指示IDだけを入れて検索するが、画面は出庫元店舗・入庫先店舗を必須にしている（入れないとブラウザの入力チェックが検索を止める）。出庫元・入庫先の店舗も選んで検索した");
      const r = await search.searchById(instructionId, { 出庫元店舗ID: fromId, 入庫先店舗ID: toId });
      if (!r.sent) throw new Error(`${seedId}: 在庫移動指示検索画面の検索が、ブラウザの入力チェックで止まった: ${r.止めた項目.join(" / ")}`);
      await search.pressTrackingRegister(instructionId);
      await expect(search.送り状No登録モーダル, `${seedId}: 送り状No.登録モーダル`).toBeVisible();
      const t = await search.submitTracking(instructionId, spec.送り状No);
      if (!t.sent) throw new Error(`${seedId}: 送り状No.の登録が、ブラウザの入力チェックで止まった: ${t.止めた項目.join(" / ")}`);
      await expectSaved(page, `${seedId}: 在庫移動指示 ${instructionId} の送り状No.「${spec.送り状No}」の登録`);
      await moves.searchById(moveId);
      const s = await moves.rowState(moveId);
      if (s.ステータス !== "移動中") throw new Error(`${seedId}: 送り状No.の登録のあと、在庫移動 ${moveId} のステータスが「${s.ステータス}」（移動中のはず）`);
    }
  });
}

const MOVE_NEEDS = ["S-M04-24-ADM", "S-M04-24-STORES"];
function defineMoveSeed(seedId: string, spec: MoveSpec, after?: (ctx: SeedCtx) => void): void {
  defineSeed(seedId, { needs: MOVE_NEEDS }, async (ctx) => {
    await buildMoveInstruction(ctx, spec);
    after?.(ctx);
  });
}

const 本店から大阪店 = (n: string): MoveSpec => ({ 出庫元: "本店", 入庫先: "大阪店", 移動点数: 1, 移動ID: `〔移動ID-M0424-${n}〕`, 移動指示ID: `〔移動指示ID-M0424-${n}〕` });
const 名古屋店から福岡店 = (n: string, 送り状No?: string): MoveSpec => ({ 出庫元: "名古屋店", 入庫先: "福岡店", 移動点数: 1, 移動ID: `〔移動ID-M0424-${n}〕`, 移動指示ID: `〔移動指示ID-M0424-${n}〕`, 送り状No });

defineMoveSeed("S-M04-24-SEARCH-009", 本店から大阪店("009"));
defineMoveSeed("S-M04-24-SEARCH-012", 名古屋店から福岡店("012"));
defineMoveSeed("S-M04-24-SEARCH-021", 本店から大阪店("021"));
defineMoveSeed("S-M04-24-TRACK-022", 本店から大阪店("022"));
defineMoveSeed("S-M04-24-TRACK-023", 本店から大阪店("023"));
defineMoveSeed("S-M04-24-SEARCH-024", 名古屋店から福岡店("024", "TRACK-42402402"));
defineMoveSeed("S-M04-24-SEARCH-025", 名古屋店から福岡店("025", "TRACK-1002"));
defineMoveSeed("S-M04-24-SEARCH-026", 本店から大阪店("026"));
defineMoveSeed("S-M04-24-SEARCH-027", 本店から大阪店("027"));

// ---- CSV ファイル ----

const CSV_HEADER = "移動指示ID,送り状No.";
const RUNTIME_DIR = path.join(STATE_DIR, "m04-24");
const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m04-24");
/** 正本のファイル名 → 置き場所（画面が振る番号を書くものは実行時に作る） */
const CSV_FILES: Record<string, string> = {
  "M04-24-duplicate-033.csv": RUNTIME_DIR,
  "M04-24-length-max-036.csv": RUNTIME_DIR,
  "M04-24-length-over-037.csv": RUNTIME_DIR,
  "M04-24-bad-header-043.csv": FIXTURE_DIR,
};

/** ケースが選ぶCSVファイルの場所（シードが用意したもの） */
export function m0424CsvPath(file: string): string {
  const dir = CSV_FILES[file];
  if (!dir) throw new Error(`${file} は M04-24 のシードが用意するCSVファイルでない`);
  return path.join(dir, file);
}

/** 1行目を「移動指示ID,送り状No.」、2行目以降を rows とした UTF-8 の CSV ファイルを作る。シード表にファイル名と1行目が書かれていること */
function writeCsv(seedId: string, file: string, rows: string[]): void {
  const s = getSeed(seedId);
  if (!(s["状態・属性"] + s.投入方法).includes(file)) throw new Error(`${seedId}: シード表にファイル名 ${file} が無い`);
  if (!s.投入方法.includes(`1行目を「${CSV_HEADER}」`)) throw new Error(`${seedId}: シード表の1行目が「${CSV_HEADER}」でない`);
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(m0424CsvPath(file), [CSV_HEADER, ...rows].join("\n") + "\n", "utf-8");
}

defineMoveSeed("S-M04-24-CSV-033", 本店から大阪店("033"), ({ seed, notes }) => {
  // 状態・属性: データ行=〔移動指示ID-M0424-033〕,TRACK-Aおよび〔移動指示ID-M0424-033〕,TRACK-B
  for (const row of ["〔移動指示ID-M0424-033〕,TRACK-A", "〔移動指示ID-M0424-033〕,TRACK-B"]) {
    if (!seed["状態・属性"].includes(row)) throw new Error(`${seed.シードID}: シード表の状態・属性に明細「${row}」が無い`);
  }
  const id = notes.get("〔移動指示ID-M0424-033〕");
  writeCsv(seed.シードID, "M04-24-duplicate-033.csv", [`${id},TRACK-A`, `${id},TRACK-B`]);
});

defineMoveSeed("S-M04-24-CSV-036", 本店から大阪店("036"), ({ seed, notes }) => {
  if (!seed.投入方法.includes("送り状No.=半角英字Aを65535文字")) throw new Error(`${seed.シードID}: シード表の送り状No.が「半角英字Aを65535文字」でない`);
  writeCsv(seed.シードID, "M04-24-length-max-036.csv", [`${notes.get("〔移動指示ID-M0424-036〕")},${"A".repeat(65535)}`]);
});

defineMoveSeed("S-M04-24-CSV-037", 本店から大阪店("037"), ({ seed, notes }) => {
  if (!seed.投入方法.includes("送り状No.=半角英字Aを65536文字")) throw new Error(`${seed.シードID}: シード表の送り状No.が「半角英字Aを65536文字」でない`);
  writeCsv(seed.シードID, "M04-24-length-over-037.csv", [`${notes.get("〔移動指示ID-M0424-037〕")},${"A".repeat(65536)}`]);
});

defineSeed("S-M04-24-FILE-043", async ({ seed }) => {
  // 画面が振る番号を書かないファイルなので、e2e/fixtures の中身をシード表と照合するだけ
  const file = m0424CsvPath("M04-24-bad-header-043.csv");
  if (!(seed["状態・属性"] + seed.投入方法).includes("M04-24-bad-header-043.csv")) throw new Error(`${seed.シードID}: シード表にファイル名が無い`);
  if (!seed["状態・属性"].includes("1行目=指示ID,伝票番号")) throw new Error(`${seed.シードID}: シード表の1行目が「指示ID,伝票番号」でない`);
  if (!fs.existsSync(file)) throw new Error(`${seed.シードID}: CSVファイル ${file} が無い`);
  if (fs.readFileSync(file, "utf-8") !== "指示ID,伝票番号\n") throw new Error(`${seed.シードID}: CSVファイル ${file} の中身がシード表と違う`);
});
