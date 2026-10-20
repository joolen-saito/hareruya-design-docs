/**
 * M04-19 欠品履歴検索一覧のシード。正本: cases/M04-19_seed_data.tsv
 *
 * 欠品の在庫変動履歴は、画面では次のどちらかでしか作れない。正本の投入方法もこの2通りで書かれている。
 * - 受注の欠品: グッズ商品CSV登録 → 在庫変更CSV登録（入庫）→ 別のメンバーが在庫編集承認一覧で承認 →
 *   フロントの本店のサイトで購入 → 受注情報編集で欠品登録して「受注情報を登録」（欠品減算(受注)の履歴ができる）
 * - 移動の欠品: 入庫までは同じ → 在庫検索一覧から在庫移動登録 → ピック・出庫承認申請で欠品登録して承認申請 →
 *   別のメンバーが出庫承認（欠品減算(移動)の履歴ができる）→ 在庫移動指示作成 → 送状No.の登録（移動中になる）
 *
 * 登場するメンバー（正本のシード S-M04-19-ADM・S-M04-19-MASTER）:
 * - M04-19試験管理者（ケースの操作と、在庫・出庫の承認をする）
 * - M04-19登録者（データを登録する: 商品・在庫変更CSV・受注の欠品登録・在庫移動）。承認は登録した者と別のメンバーでないとできない
 * - M04-19更新者（このファイルで実装したケースでは使わない。正本のマスターの状態どおり作る）
 * 正本の「メンバーID 419900001」などの固定の番号と、店舗の「本店ID10・試験支店ID20・スマレジ実店頭ID30」の番号は、画面では指定できない。
 * 本店は、アプリが本店として扱う店舗ID 1（親店舗。フロントの本店のサイトの店舗）を使い、店名は画面から読む。
 * 試験支店は店舗登録の画面で「試験支店」の名前で作り、画面が振る番号を使う。
 * スマレジ実店頭は作らない（スマレジ（外部サービス）との連携が要り、使うケース 003 はDBでの準備が要るので実装していない）。
 *
 * 購入する会員: 正本は「購入できる会員」とだけ定める。管理画面には会員を登録する画面が無く、M04-19 用の試験会員を作るには
 * フロントの新規会員登録画面で登録し、本登録のメールを手元のメールの受け口で読む必要がある（M13-02 の申込の会員と同じ作り方）。
 * 依頼者の決まり「メールが要るシードを使うケースは実装しない」により、判断が出るまでメールでの登録はしない。
 * 試験会員が本会員としてすでにいればそれを使い、いなければ商品を作る前に止める（下の「購入会員をメールで登録する」）。
 *
 * 商品コードの固定の値で作るシードは、正本に清掃の手順が無い。同じ商品コードの商品が残っていたら作らずに止める（流し直さない）。
 * グッズ商品CSV登録の「アップロード後の確認モーダルでの確定」は、いまの画面には確認モーダルが無いので、そのまま進める
 * （e2e/pages/admin/m03_01_goods_csv.ts の uploadGoodsCsv と同じ。依頼者の判断待ち）。
 *
 * 実装しないシード（使うケースも実装しない）: DBでの準備が要るもの（FILTER-003・FILTER-004・SORT-005・DATE-016・DATE-017・
 * PAGING-025 は使うケースの手順がDBの書き換え）、画面で指定できない日時をDBへ直接設定するもの（DISPLAY-006・EDIT-012・EDIT-013・EDIT-037）。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, ENV_NAME, SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerStateByEmail } from "../pages/admin/customer";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import {
  classMemo, ensurePageCounts, goodsCategoryIdForCsv, idsByExactCode, openClassEdit, productRowsByCode, setClassMemo, setClassPrices, stockEditValue,
  storeNameById,
} from "../pages/admin/m04_19_masters";
import { addToCart, checkout, clearCart, frontLogin, openOrderEditByProductCode, registerShortages, 購入会員 } from "../pages/admin/m04_19_order_shortage";
import { ShortageHistoryPage } from "../pages/admin/m04_19_shortage_history";
import { 語を含む欠品履歴の数 } from "../db/m04_19_shortage";
import { available as dbAvailable } from "../lib/db";
import { registerStockChangeCsv } from "../pages/admin/m04_19_stock_change_csv";
import { approveOutbound, createMoveInstruction, registerStockMove, registerTrackingNo, requestOutboundApproval } from "../pages/admin/m04_19_stock_move";
import { ensureMember, MemberInput } from "../pages/admin/member";
import { StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";
import { ensureTenant } from "../pages/admin/tenant";
import { FrontMember, registerFrontMember } from "../pages/front/member_entry";

/** M04-19試験管理者（正本 S-M04-19-ADM のログインID・パスワード） */
export const M0419_ADMIN: Account = { loginId: "m0419_admin", password: "Passw0rd!M0419" };
export const M0419_ADMIN_NAME = "M04-19試験管理者";
/** M04-19登録者・M04-19更新者（正本はメンバーIDだけを定める。ログインID・パスワードはこちらで決めた） */
const REGISTRANT: Account = { loginId: "m0419_registrant", password: "Passw0rd!M0419R" };
const REGISTRANT_NAME = "M04-19登録者";
const UPDATER: Account = { loginId: "m0419_updater", password: "Passw0rd!M0419U" };
const UPDATER_NAME = "M04-19更新者";

/** アプリが本店（親店舗）として扱う店舗ID */
const MAIN_SHOP_ID = "1";
/** 店名英語は半角英字とスペースだけ（店舗登録の画面の入力チェック。数字を入れると登録できない） */
const BRANCH = { 店名: "試験支店", 店名カナ: "シケンシテン", 店名英語: "Shiken Branch", 支店URL: "m0419branch", 店名略称3文字: "試支店", ショップ名略称: "試験支店" };

const BUYER: FrontMember = {
  姓: "試験会員", 名: "欠品購入", セイ: "シケンカイイン", メイ: "ケッピンコウニュウ",
  メール: "e2e-m0419-buyer@example.test", パスワード: "Passw0rd!E2EM0419",
};
/**
 * 購入する試験会員がいないとき、フロントの新規会員登録（本登録のメールを読む）で作るかどうか。
 * 依頼者の決まり「メールが要るシードを使うケースは実装しない」により、判断が出るまで作らない（false）。
 * 判断が出たら、メールでの登録を認めるならここを true に、既存の本会員を使うなら BUYER をその会員の資格情報に変える。
 */
const 購入会員をメールで登録する = false;

/** 支払方法: 銀行振込以外で、決済代行（外部の画面）へ移らないもの。上から順に、ご注文手続きの画面にあるものを選ぶ */
const PAYMENTS = ["代金引換", "郵便振替", "現金書留"];

/** 在庫変更CSVの入庫の値（正本: 在庫変動区分に入庫の区分・在庫変動理由「M04-19試験データ」・仕入単価100） */
const STOCK_IN = { 在庫変動区分: "入庫/その他", 在庫変動理由: "M04-19試験データ", 仕入単価: "100" };

let mainShop: string | null = null;
/** 本店の店名（画面から読む。ワーカーの中で覚える） */
export async function mainShopName(browser: Browser): Promise<string> {
  if (!mainShop) mainShop = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, MAIN_SHOP_ID));
  return mainShop;
}

/** システム管理者の権限・所属店舗と編集可能店舗とデフォルト検索表示店舗は本店（在庫管理を操作でき、本店の在庫を承認できる） */
const member = (名前: string, a: Account, shop: string): MemberInput => ({
  名前, 所属店舗: shop, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
  権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
});

// ---- 共有のシード ----

defineSeed("S-M04-19-ADM", async ({ browser }) => {
  const shop = await mainShopName(browser);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, member(M0419_ADMIN_NAME, M0419_ADMIN, shop)));
  // ログインでき、在庫管理（在庫履歴一覧）を操作できること
  await withAdminSession(browser, M0419_ADMIN, async (page) => {
    const h = new ShortageHistoryPage(page);
    await h.openFromMenu();
    expect(await h.見出し(), "M04-19試験管理者で在庫履歴検索一覧を開ける").toBe("在庫履歴一覧");
  });
});

defineSeed("S-M04-19-MASTER", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const shop = await mainShopName(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureTenant(page, BRANCH, issue);
    await ensureMember(page, member(REGISTRANT_NAME, REGISTRANT, shop));
    await ensureMember(page, member(UPDATER_NAME, UPDATER, shop));
  });
  // 在庫区分・在庫変動区分・言語・状態・Foil は、アプリが固定で持つマスターで、画面で登録するものではない。検索欄の選択肢にあることを確かめる
  await withAdminSession(browser, REGISTRANT, async (page) => {
    const h = new ShortageHistoryPage(page);
    await h.openFromMenu();
    const c = await h.検索欄の選択肢();
    for (const v of ["EC-CUBE", "スマレジ"]) if (!c.在庫区分.includes(v)) throw new Error(`在庫区分に「${v}」が無い（${c.在庫区分.join("、")}）`);
    if (!c.言語.includes("日本語")) throw new Error(`言語に「日本語」が無い（${c.言語.join("、")}）`);
    if (!c.状態.includes("NM")) throw new Error(`状態に「NM」が無い（${c.状態.join("、")}）`);
    if (!c.Foil.includes("通常")) throw new Error(`Foil に「通常」が無い（${c.Foil.join("、")}）`);
    const 全角を半角 = (s: string) => s.replace(/（/g, "(").replace(/）/g, ")");
    for (const want of [{ 親: "廃棄", 子: "欠品減算(受注)" }, { 親: "廃棄", 子: "欠品減算(移動)" }, { 親: "廃棄", 子: "廃棄(破損)" }]) {
      const hit = c.在庫変動区分.filter((t) => 全角を半角(t.子) === want.子);
      if (hit.length === 0) throw new Error(`在庫変動区分に「${want.子}」が無い`);
      if (!hit.some((t) => t.親 === want.親)) {
        issue(`正本の在庫変動区分「${want.親}/${want.子}」は、画面では親区分が「${hit.map((t) => t.親).join("・")}」（${hit.map((t) => `${t.親} / ${t.子}`).join("、")}）`);
      }
    }
  });
});

defineSeed("S-M04-19-PAGE-SETTING", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const names = await withAdminSession(browser, SETUP_ADMIN, (page) => ensurePageCounts(page, ["10", "50"], issue));
  // 表示件数マスタは全管理画面の一覧で共有する。ほかの機能のシードが使う件数（12000件など）があるので、10件・50件以外を消さない
  const extra = names.filter((n) => n !== "10" && n !== "50");
  if (extra.length) {
    issue(`表示件数マスタには10件・50件のほかに ${extra.join("・")}件もある（全管理画面で共有するマスタで、ほかの機能のシードが使うので消していない）`);
  }
  // 既定値50件はアプリの設定の値で、管理画面で設定する項目が無い。新しいセッションの一覧で50件が選ばれることは、ケースの期待結果で確かめる
});

// ---- 作り方の部品 ----

type 商品 = { 商品コード: string; 商品名: string; 価格: string; 入庫数: number };
type 受注の欠品 = { 商品コード: string; 注文数: number; 欠品数: number };

const issueOf = (seedId: string) => (m: string) => reportSeedIssue(seedId, m);
let fileSeq = 0;
/** 在庫変更CSVのファイル名（同じ名前を1か月以内に登録すると登録されないので、毎回変える） */
const stockCsvName = (seedId: string) => `${seedId.toLowerCase()}-${Date.now()}-${++fileSeq}.csv`;

/** 商品マスターで、商品コードに語を含む商品が無いことを確かめる（正本に清掃の手順が無いので、残っていたら作らずに止める） */
async function expectNoProducts(browser: Browser, seedId: string, 語: string): Promise<void> {
  const rows = await withAdminSession(browser, REGISTRANT, (page) => productRowsByCode(page, 語));
  if (rows.length) {
    throw new Error(`${seedId}: 商品コードに「${語}」を含む商品が残っている（${rows.map((r) => `${r.商品コード}＝商品ID ${r.商品ID}`).join("、")}）。` +
      "正本に清掃の手順が無いので、同じDBでは流し直さない");
  }
}

/**
 * グッズ商品CSV登録で商品を作り（M04-19登録者）、商品コードごとの商品IDを返す。
 * 商品カテゴリ(ID)の「登録済みの値」は、最上位の「サプライ・グッズ」のID（空から作ったDBでは下のカテゴリが無いことがあるため）。
 */
async function createGoods(browser: Browser, seedId: string, 語: string, items: 商品[]): Promise<Map<string, string>> {
  return withAdminSession(browser, REGISTRANT, async (page) => {
    const categoryId = await goodsCategoryIdForCsv(page, issueOf(seedId));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録（${items.length}行）`, fileName: `${seedId.toLowerCase()}-goods.csv`, categoryId,
      lines: items.map((p) => ({ code: p.商品コード, nameJp: p.商品名, nameEn: p.商品名, values: { "基準価格": p.価格, "販売価格": p.価格 } })),
      onWarning: issueOf(seedId), uploadWaitMs: 600_000,
    });
    return idsByExactCode(await productRowsByCode(page, 語), items.map((p) => p.商品コード));
  });
}

/** 在庫変更CSV登録で本店・EC-CUBEに入庫し（M04-19登録者）、M04-19試験管理者が在庫編集承認一覧で承認する */
async function stockIn(browser: Browser, seedId: string, items: 商品[]): Promise<void> {
  const shop = await mainShopName(browser);
  const issue = issueOf(seedId);
  await withAdminSession(browser, REGISTRANT, (page) => registerStockChangeCsv(page, {
    店舗: shop, 在庫区分: "EC-CUBE", 在庫変動区分: STOCK_IN.在庫変動区分, 在庫変動理由: STOCK_IN.在庫変動理由, 承認者: M0419_ADMIN_NAME,
    行: items.map((p) => ({ 商品コード: p.商品コード, 在庫増減数: String(p.入庫数), 仕入単価: STOCK_IN.仕入単価 })),
    ファイル名: stockCsvName(seedId),
  }, `${seedId} の在庫変更CSV登録（${items.length}行）`, issue));
  const total = String(items.reduce((s, p) => s + p.入庫数, 0));
  await withAdminSession(browser, M0419_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === REGISTRANT_NAME
      && r.shop.startsWith(shop) && r.changeType.endsWith(STOCK_IN.在庫変動区分) && r.quantity === total);
    if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、M04-19登録者の在庫変更CSV登録（合計 ${total}）の未承認の行が無い`);
    if (rows.length > 1) issue(`在庫編集承認一覧に、合計 ${total} の未承認の行が ${rows.length} 件あり、一覧の先頭を承認した`);
    await list.approve([rows[0].id], `${seedId} の在庫変更CSV登録の承認`, issue);
  });
}

let buyerReady = false;
/** 購入する会員（本会員としていればそれを使う。いなければ止める。メールでの登録は「購入会員をメールで登録する」が真のときだけ） */
async function ensureBuyer(browser: Browser): Promise<購入会員> {
  if (!buyerReady) {
    const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, BUYER.メール));
    if (state === "仮会員") throw new Error(`購入する試験会員 ${BUYER.メール} が仮会員のまま。本登録のメールのURLを開いて本会員にしてから流す`);
    if (state === null) {
      if (!購入会員をメールで登録する) {
        throw new Error(`購入する試験会員 ${BUYER.メール} がいない。会員の登録には本登録のメールを読む必要があり、` +
          "依頼者の決まり（メールが要るシードを使うケースは実装しない）により登録しない。既存の本会員を使うか、メールでの登録を認めるかの判断待ち");
      }
      if (ENV_NAME !== "local") throw new Error(`E2E_ENV=${ENV_NAME} では購入する試験会員を登録できない（本登録のメールを読めない）`);
      const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(context);
        await registerFrontMember(await context.newPage(), BUYER);
      } finally {
        await context.close();
      }
      const after = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, BUYER.メール));
      if (after !== "本会員") throw new Error(`購入する試験会員 ${BUYER.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
    }
    buyerReady = true;
  }
  return { メール: BUYER.メール, パスワード: BUYER.パスワード };
}

/** フロントの本店のサイトに会員でログインし、商品ごとに商品詳細画面で数量をカートに入れて、注文を確定する。注文番号を返す */
async function frontOrder(browser: Browser, seedId: string, items: { 商品ID: string; 商品コード: string; 数量: number }[]): Promise<string> {
  const buyer = await ensureBuyer(browser);
  const issue = issueOf(seedId);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await frontLogin(page, buyer);
    await clearCart(page, (m) => issue(`カートに前の実行の商品が残っていたので、カート一括削除のダイアログを受け入れた: ${m}`));
    for (const it of items) await addToCart(page, it.商品ID, it.数量, `${seedId} の「${it.商品コード}」をカートに入れる`);
    const { 注文番号, 支払方法 } = await checkout(page, PAYMENTS, `${seedId} の注文`);
    if (支払方法 !== PAYMENTS[0]) issue(`支払方法に「${PAYMENTS[0]}」が無く、「${支払方法}」を選んだ`);
    return 注文番号;
  } finally {
    await context.close();
  }
}

/** M04-19登録者で、受注情報検索 一覧から受注情報編集画面を開き、商品ごとに欠品数量を入れて「受注情報を登録」を押す */
async function registerOrderShortage(browser: Browser, seedId: string, 注文番号: string, items: 受注の欠品[]): Promise<{ 受注ID: string; 注文番号: string }> {
  const shop = await mainShopName(browser);
  return withAdminSession(browser, REGISTRANT, async (page) => {
    const ids = await openOrderEditByProductCode(page, items[0].商品コード, shop, `${seedId} の受注`);
    if (ids.注文番号 !== 注文番号) throw new Error(`${seedId}: 受注情報検索で開いた受注の注文番号 ${ids.注文番号} が、フロントで確定した注文番号 ${注文番号} と違う`);
    await registerShortages(page, items.map((i) => ({ 商品コード: i.商品コード, 欠品数量: i.欠品数 })), `${seedId} の欠品登録`, issueOf(seedId));
    return ids;
  });
}

/**
 * 受注の欠品の履歴を作る（商品の登録から欠品登録まで）。受注IDと注文番号を返す。
 * 購入する会員が用意できるかを、固定の商品コードの商品を作る前に確かめる（用意できずに止まると、商品だけが残って流し直せなくなるため）。
 */
async function orderShortage(browser: Browser, seedId: string, 語: string, items: (商品 & 受注の欠品)[]): Promise<{ 受注ID: string; 注文番号: string }> {
  await ensureBuyer(browser);
  await expectNoProducts(browser, seedId, 語);
  const ids = await createGoods(browser, seedId, 語, items);
  await stockIn(browser, seedId, items);
  const 注文番号 = await frontOrder(browser, seedId, items.map((i) => ({ 商品ID: ids.get(i.商品コード)!, 商品コード: i.商品コード, 数量: i.注文数 })));
  return registerOrderShortage(browser, seedId, 注文番号, items);
}

/** 移動の欠品の履歴を作る（商品の登録から、出庫承認・在庫移動指示作成・送状No.の登録まで）。在庫移動・振替IDを返す */
async function moveShortage(browser: Browser, seedId: string, 語: string, item: 商品 & { 移動点数: number; 欠品点数: number; 送状No: string }): Promise<string> {
  const issue = issueOf(seedId);
  const shop = await mainShopName(browser);
  await expectNoProducts(browser, seedId, 語);
  await createGoods(browser, seedId, 語, [item]);
  await stockIn(browser, seedId, [item]);
  const moveId = await withAdminSession(browser, REGISTRANT, async (page) => {
    const id = await registerStockMove(page, { 商品コード: item.商品コード, 出庫元店舗: shop, 入庫先店舗: BRANCH.店名, 在庫区分: "EC-CUBE", 移動点数: item.移動点数 },
      `${seedId} の在庫移動`, issue);
    await requestOutboundApproval(page, id, { 欠品点数: item.欠品点数, 承認者: M0419_ADMIN_NAME }, `${seedId} の在庫移動`, issue);
    return id;
  });
  const shown = await withAdminSession(browser, M0419_ADMIN, (page) => approveOutbound(page, moveId, `${seedId} の在庫移動`, issue));
  if (shown !== moveId) throw new Error(`${seedId}: 出庫承認の画面に表示された在庫移動・振替ID ${shown} が、登録した在庫移動 ${moveId} と違う`);
  await withAdminSession(browser, REGISTRANT, async (page) => {
    await createMoveInstruction(page, moveId, `${seedId} の在庫移動`, issue);
    await registerTrackingNo(page, moveId, item.送状No, { 出庫元店舗: shop, 入庫先店舗: BRANCH.店名 }, `${seedId} の在庫移動`, issue);
  });
  return shown;
}

/** 欠品履歴検索一覧(検索結果)で商品コードの行の、欠品理由の編集フォームに埋め込まれた履歴の番号 */
async function readHistoryId(browser: Browser, 商品コード: string): Promise<string> {
  return withAdminSession(browser, REGISTRANT, async (page) => {
    const h = new ShortageHistoryPage(page);
    await h.searchShortage(商品コード);
    return h.historyIdOf(h.rowByCode(商品コード));
  });
}

/** 在庫履歴検索一覧(検索入力)画面で欠品検索にチェックを付け、語を入れて検索し、欠品履歴が n 件だけ表示されることを確かめる */
async function expectShortageCount(browser: Browser, seedId: string, 語: string, n: number): Promise<void> {
  await withAdminSession(browser, REGISTRANT, async (page) => {
    const h = new ShortageHistoryPage(page);
    await h.openFromMenu();
    await h.checkShortageList();
    await h.fillKeyword(語);
    await h.search();
    const count = await h.件数();
    if (count !== n) throw new Error(`${seedId}: 欠品検索で「${語}」の欠品履歴が ${count ?? "（件数の表示なし）"} 件（${n} 件のはず）`);
  });
}

const noteOrder = (notes: Notes, n: string, ids: { 受注ID: string; 注文番号: string }) => {
  notes.set(`〔受注ID-M0419-${n}〕`, ids.受注ID);
  notes.set(`〔注文番号-M0419-${n}〕`, ids.注文番号);
};

const NEEDS = ["S-M04-19-ADM", "S-M04-19-MASTER"];

// ---- 受注の欠品 ----

defineSeed("S-M04-19-FILTER-002", { needs: NEEDS }, async ({ browser, seed }) => {
  await orderShortage(browser, seed.シードID, "FILTER-HQ-002", [
    { 商品コード: "FILTER-HQ-002", 商品名: "M04-19試験商品(002)", 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
  ]);
});

defineSeed("S-M04-19-DISPLAY-007", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  noteOrder(notes, "007", await orderShortage(browser, seed.シードID, "M419-DISPLAY-007", [
    { 商品コード: "M419-DISPLAY-007", 商品名: "M04-19試験商品(007)", 価格: "1980", 入庫数: 3, 注文数: 3, 欠品数: 2 },
  ]));
});

defineSeed("S-M04-19-DISPLAY-009", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const code = "M419-DISPLAY-009";
  noteOrder(notes, "009", await orderShortage(browser, seed.シードID, code, [
    { 商品コード: code, 商品名: "欠品表示商品", 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
  ]));
  // 在庫検索一覧で商品コードを検索し、本店・EC-CUBEの行の商品名を押して在庫編集画面を開き、商品ID・商品規格ID・在庫IDを控える
  const shop = await mainShopName(browser);
  await withAdminSession(browser, REGISTRANT, async (page) => {
    const stock = new StockListPage(page);
    await stock.searchByProductCode(code);
    await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
    notes.set("〔商品ID-M0419-009〕", await stockEditValue(page, "商品ID"));
    notes.set("〔商品規格ID-M0419-009〕", await stockEditValue(page, "商品規格ID"));
    notes.set("〔在庫ID-M0419-009〕", await stockEditValue(page, "在庫ID"));
  });
});

defineSeed("S-M04-19-DISPLAY-010", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const code = "M419-DISPLAY-010";
  noteOrder(notes, "010", await orderShortage(browser, seed.シードID, code, [
    { 商品コード: code, 商品名: "M04-19試験商品(010)", 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
  ]));
  notes.set("〔履歴ID-M0419-010〕", await readHistoryId(browser, code));
});

defineSeed("S-M04-19-STATE-014", { needs: NEEDS }, async ({ browser, seed }) => {
  const code = "M419-STATE-MEMO-014";
  await orderShortage(browser, seed.シードID, code, [
    { 商品コード: code, 商品名: "M04-19試験商品(014)", 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
  ]);
  // 商品規格一覧でその商品の規格を選び、商品規格登録編集画面で状態別称に「サイン入り」を入れて登録する（規格拡張メモになる）
  await withAdminSession(browser, REGISTRANT, async (page) => {
    const id = idsByExactCode(await productRowsByCode(page, code), [code]).get(code)!;
    await openClassEdit(page, id, code);
    await setClassMemo(page, "サイン入り", `${seed.シードID} の状態別称`, issueOf(seed.シードID));
  });
});

defineSeed("S-M04-19-STATE-015", { needs: NEEDS }, async ({ browser, seed }) => {
  const code = "M419-STATE-NOMEMO-015";
  await orderShortage(browser, seed.シードID, code, [
    { 商品コード: code, 商品名: "M04-19試験商品(015)", 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
  ]);
  // 商品規格一覧でその商品の規格を選び、商品規格登録編集画面で状態別称が空であることを確かめる（規格拡張メモなし）
  await withAdminSession(browser, REGISTRANT, async (page) => {
    const id = idsByExactCode(await productRowsByCode(page, code), [code]).get(code)!;
    await openClassEdit(page, id, code);
    await expect(classMemo(page), `${seed.シードID}: 状態別称が空`).toHaveValue("");
  });
});

defineSeed("S-M04-19-CALC-027", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const code = "M419-CALC-027";
  await orderShortage(browser, seed.シードID, code, [
    { 商品コード: code, 商品名: "M04-19試験商品(027)", 価格: "1300", 入庫数: 13, 注文数: 3, 欠品数: 2 },
  ]);
  // 商品規格の販売価格と基準価格を2000にする（現在販売価格2000。入庫13から注文3を引いて現在在庫数は10）
  await withAdminSession(browser, REGISTRANT, async (page) => {
    const id = idsByExactCode(await productRowsByCode(page, code), [code]).get(code)!;
    await openClassEdit(page, id, code);
    await setClassPrices(page, "2000", `${seed.シードID} の販売価格と基準価格`, issueOf(seed.シードID));
  });
  notes.set("〔履歴ID-M0419-027〕", await readHistoryId(browser, code));
});

defineSeed("S-M04-19-DISPLAY-028", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const code = "M419-DISPLAY-028";
  noteOrder(notes, "028", await orderShortage(browser, seed.シードID, code, [
    { 商品コード: code, 商品名: "M04-19試験商品(028)", 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
  ]));
  notes.set("〔履歴ID-M0419-028〕", await readHistoryId(browser, code));
  await expectShortageCount(browser, seed.シードID, code, 1);
});

/** 033・034・035: 商品コード「M0419-0NN-A」の受注の欠品1件。語「M0419-0NN」の欠品履歴が1件だけ */
function defineSingleShortageSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: NEEDS }, async ({ browser, seed }) => {
    await orderShortage(browser, seed.シードID, `M0419-${n}`, [
      { 商品コード: `M0419-${n}-A`, 商品名: `M04-19試験商品(${n})`, 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 },
    ]);
    await expectShortageCount(browser, seed.シードID, `M0419-${n}`, 1);
  });
}
defineSingleShortageSeed("S-M04-19-NOCOND-033", "033");
defineSingleShortageSeed("S-M04-19-BADSORT-A-034", "034");
defineSingleShortageSeed("S-M04-19-BADSORT-B-035", "035");

/** 019〜024・026: 商品コード M419-PAGE-0NN-001〜051 の51商品を1回の注文で買い、51行それぞれ欠品1。語「M419-PAGE-0NN」の欠品履歴が51件だけ */
function definePagingSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: NEEDS }, async ({ browser, seed }) => {
    const 語 = `M419-PAGE-${n}`;
    const items = Array.from({ length: 51 }, (_, i) => {
      const code = `${語}-${String(i + 1).padStart(3, "0")}`;
      return { 商品コード: code, 商品名: code, 価格: "1000", 入庫数: 2, 注文数: 2, 欠品数: 1 };
    });
    await orderShortage(browser, seed.シードID, 語, items);
    await expectShortageCount(browser, seed.シードID, 語, 51);
  });
}
definePagingSeed("S-M04-19-PAGING-019", "019");
definePagingSeed("S-M04-19-PAGING-020", "020");
definePagingSeed("S-M04-19-PAGING-021", "021");
definePagingSeed("S-M04-19-PAGING-022", "022");
definePagingSeed("S-M04-19-PAGING-023", "023");
definePagingSeed("S-M04-19-PAGING-024", "024");
definePagingSeed("S-M04-19-PAGING-026", "026");

// ---- 移動の欠品 ----

defineSeed("S-M04-19-MOVE-008", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  notes.set("〔在庫移動振替ID-M0419-008〕", await moveShortage(browser, seed.シードID, "M419-MOVE-008", {
    商品コード: "M419-MOVE-008", 商品名: "M04-19試験商品(008)", 価格: "2500", 入庫数: 3, 移動点数: 3, 欠品点数: 2, 送状No: "M0419008",
  }));
});

defineSeed("S-M04-19-MOVE-011", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const code = "M419-MOVE-011";
  notes.set("〔在庫移動振替ID-M0419-011〕", await moveShortage(browser, seed.シードID, code, {
    商品コード: code, 商品名: "M04-19試験商品(011)", 価格: "1000", 入庫数: 2, 移動点数: 2, 欠品点数: 1, 送状No: "M0419011",
  }));
  notes.set("〔履歴ID-M0419-011〕", await readHistoryId(browser, code));
});

defineSeed("S-M04-19-MIX-036", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  // 購入する会員が用意できることと、語「M0419-MIX-036」を含む商品が無いことを先に確かめる（2つの商品のどちらかが残っていれば止める）
  await ensureBuyer(browser);
  await expectNoProducts(browser, seed.シードID, "M0419-MIX-036");
  noteOrder(notes, "036", await orderShortage(browser, seed.シードID, "M0419-MIX-036-ORD", [
    { 商品コード: "M0419-MIX-036-ORD", 商品名: "M04-19試験商品(036-ORD)", 価格: "1980", 入庫数: 3, 注文数: 3, 欠品数: 2 },
  ]));
  notes.set("〔在庫移動振替ID-M0419-036M〕", await moveShortage(browser, seed.シードID, "M0419-MIX-036-MOV", {
    商品コード: "M0419-MIX-036-MOV", 商品名: "M04-19試験商品(036-MOV)", 価格: "2500", 入庫数: 3, 移動点数: 3, 欠品点数: 2, 送状No: "M0419036",
  }));
});

// ---- 不存在 ----

defineSeed("S-M04-19-ABSENT-018", async ({ browser, seed }) => {
  // 正本は「DBで確認し、存在する場合は関連する試験データを削除する」。DBは参照だけにし、削除はしない。
  // 商品名(日)・商品名(英)・カード名・商品コードのいずれかに NO-HISTORY-M419 を含む商品の欠品の在庫変動履歴が0件であることを、
  // DBの参照で確かめる（廃止の商品・表示しない規格も数える。商品マスターの検索はそれらを対象から外すので使わない）。0件でなければ消さずに止める。
  const 語 = "NO-HISTORY-M419";
  if (dbAvailable) {
    const n = 語を含む欠品履歴の数(語);
    if (n !== 0) throw new Error(`${seed.シードID}: 「${語}」を含む商品の欠品の在庫変動履歴がDBに ${n} 件ある（0件のはず。消さずに止める）`);
    return;
  }
  // DB確認の接続先が無いときは、在庫履歴一覧の欠品検索（条件をクリアし、語で検索）で0件を確かめる。ケースと同じ検索なので、前提の確かめとしては弱い
  reportSeedIssue(seed.シードID, `DB確認の接続先が無いので、「${語}」の欠品履歴が0件であることは在庫履歴一覧の欠品検索だけで確かめた`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const h = new ShortageHistoryPage(page);
    await h.searchShortage(語);
    const n = await h.件数();
    if (n !== 0) throw new Error(`${seed.シードID}: 在庫履歴一覧の欠品検索で「${語}」の欠品履歴が ${n ?? "（件数の表示なし）"} 件（0件のはず。消さずに止める）`);
  });
});
