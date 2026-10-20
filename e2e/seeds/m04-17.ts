/**
 * M04-17 在庫履歴検索一覧の画面シード。正本: cases/M04-17_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（017・020・023・026・031・036・037・055・012・016）が使うシードだけ。
 * - S-M04-17-ADM: 試験管理者。デフォルト検索表示店舗は「本店」。
 *   「本店」は S-M04-17-MASTER が店舗登録画面で登録する店舗で、ADM の作り方には店舗の用意が書かれていない。
 *   デフォルト検索表示店舗に選ぶには店舗が要るので、S-M04-17-MASTER と同じ操作（店舗登録。登録済みならそのまま使う）で「本店」を用意してから登録する。
 *   S-M04-17-MASTER そのもの（A店舗・支店A・スマレジ実店舗・カテゴリ・カードセット・所属・メンバー）は作らない。
 * - 商品・在庫変動履歴のシード: グッズ商品CSV登録で商品を作り、在庫検索一覧から在庫編集で入庫を登録し、
 *   登録したメンバーとは別の、承認権限のあるメンバーが在庫編集承認一覧で承認する。
 *   登録は試験管理者、承認は試験用の承認者（正本は名前を定めていない。「M04-17試験承認者」として、あれば使い無ければメンバー管理で登録する）。
 *   グッズ商品CSV登録は、雛形のダウンロードで列を確かめ、本店を含む開店中の店舗ごとに在庫区分「EC-CUBE」「スマレジ」の在庫が作られる。
 * - 商品コードは正本の固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば作らずに止める（流し直すかは依頼者が決める）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember, MemberInput } from "../pages/admin/member";
import { StockHistoryPage } from "../pages/admin/m04_17_stock_history";
import {
  approveRows, changeClassPrices, expectNoProductCodes, GoodsLine, pendingApprovalRows, PendingRow,
  readSupplyGoodsCategoryId, registerStockIn, uploadGoodsLines,
} from "../pages/admin/m04_17_seed_ops";
import { ensureTenant, TenantInput } from "../pages/admin/tenant";

export const M0417_ADMIN: Account = { loginId: "m0417_admin", password: "Passw0rd!M0417" };
const ADMIN_NAME = "M04-17試験管理者";
const APPROVER: Account = { loginId: "m0417_approver", password: "Passw0rd!M0417R" };
const APPROVER_NAME = "M04-17試験承認者";
/** 正本の「本店」。店舗登録画面で登録する店舗の名前 */
export const MAIN_SHOP = "本店";
const MAIN_SHOP_INPUT: TenantInput = {
  店名: MAIN_SHOP, 店名カナ: "ホンテン", 店名英語: "Main Store", 支店URL: "m0417honten", 店名略称3文字: "HNT", ショップ名略称: MAIN_SHOP,
};
const STOCK_IN_REASON = "M0417試験入庫";

/** 本店に所属し、本店を編集でき、デフォルト検索表示店舗が本店のシステム管理者（在庫編集・在庫編集承認ができる） */
const mainShopMember = (名前: string, account: Account, メールアドレス: string): MemberInput => ({
  名前, 所属店舗: MAIN_SHOP, ログインID: account.loginId, メールアドレス, パスワード: account.password,
  権限: "システム管理者", デフォルト検索表示店舗: MAIN_SHOP, 編集可能店舗: [MAIN_SHOP],
});

defineSeed("S-M04-17-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureTenant(page, MAIN_SHOP_INPUT, issue);
    await ensureMember(page, mainShopMember(ADMIN_NAME, M0417_ADMIN, "m0417_admin@example.test"));
  });
  // ログインでき、在庫履歴検索一覧の店舗の初期値がデフォルト検索表示店舗の「本店」であること
  await withAdminSession(browser, M0417_ADMIN, async (page) => {
    const history = new StockHistoryPage(page);
    await history.open();
    expect(await history.selectedShops(), "試験管理者の在庫履歴検索一覧の店舗の初期値（デフォルト検索表示店舗）").toEqual([MAIN_SHOP]);
  });
});

/** 承認する管理者は、ワーカーの中で1回だけ用意する */
let approverReady = false;
async function ensureApprover(browser: Browser): Promise<void> {
  if (approverReady) return;
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, mainShopMember(APPROVER_NAME, APPROVER, "m0417_approver@example.test")));
  approverReady = true;
}

/** 在庫編集の1件。承認する が false の行は承認・却下をしない（入庫承認待ちのまま） */
type StockIn = { 商品コード: string; 在庫変動理由?: string; 在庫増減数?: string; 承認する: boolean };

const goods = (商品コード: string, 商品名: string, 価格 = "100", 買取価格 = "10"): GoodsLine =>
  ({ 商品コード, 商品名, 基準価格: 価格, 販売価格: 価格, 買取価格 });
const approved = (商品コード: string, 在庫変動理由 = STOCK_IN_REASON): StockIn => ({ 商品コード, 在庫変動理由, 承認する: true });
const pending = (商品コード: string): StockIn => ({ 商品コード, 承認する: false });

/**
 * 正本の作り方の共通の形。
 * 1. 試験管理者で、商品コードの商品が残っていないことを確かめ、グッズ商品CSV登録で商品を作る。
 * 2. 在庫編集の登録を1件ずつ行い、そのたびに承認する管理者の在庫編集承認一覧（本店）で、未承認の行が1件増えたことを確かめて、その行を控える
 *    （一覧に商品コードの列が無いので、登録の前後の差で行を決める）。
 * 3. 承認する行だけを、承認する管理者がまとめて一括承認する。
 */
function defineHistorySeed(seedId: string, lines: GoodsLine[], entries: StockIn[],
  after?: (page: Page, issue: (m: string) => void) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M04-17-ADM"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await ensureApprover(browser);
    await withAdminSession(browser, M0417_ADMIN, async (adm) => {
      await withAdminSession(browser, APPROVER, async (approver) => {
        await expectNoProductCodes(adm, lines.map((l) => l.商品コード), seedId);
        const categoryId = await readSupplyGoodsCategoryId(adm);
        await uploadGoodsLines(adm, {
          what: `${seedId} のグッズ商品CSV登録（${lines.length}行）`, fileName: `${seedId}-goods.csv`, categoryId, lines, onIssue: issue,
        });

        const known = new Set((await pendingApprovalRows(approver, MAIN_SHOP)).map((r) => r.id));
        const toApprove: string[] = [];
        for (const e of entries) {
          const quantity = e.在庫増減数 ?? "1";
          await registerStockIn(adm, {
            商品コード: e.商品コード, 店舗: MAIN_SHOP, 在庫変動理由: e.在庫変動理由 ?? STOCK_IN_REASON, 在庫増減数: quantity, 仕入単価: "100",
            承認する管理者: APPROVER_NAME, onIssue: issue,
          });
          const fresh = (await pendingApprovalRows(approver, MAIN_SHOP)).filter((r) => !known.has(r.id));
          const row = expectOneNewRow(fresh, `${seedId}: ${e.商品コード} の在庫編集`, quantity);
          known.add(row.id);
          if (e.承認する) toApprove.push(row.id);
        }
        if (toApprove.length) {
          await pendingApprovalRows(approver, MAIN_SHOP);
          await approveRows(approver, toApprove, `${seedId} の在庫編集の承認（${toApprove.length}件）`, issue);
        }
        if (after) await after(adm, issue);
      });
    });
  });
}

/** 在庫編集の登録で増えた未承認の行が1件で、登録者・店舗・在庫変動区分・増減数が登録したとおりであること */
function expectOneNewRow(fresh: PendingRow[], what: string, quantity: string): PendingRow {
  if (fresh.length !== 1) throw new Error(`${what}: 登録のあと、在庫編集承認一覧の未承認の行が ${fresh.length} 件増えた（1件のはず）`);
  const r = fresh[0];
  const qty = Number(r.quantity.replace(/[^\d-]/g, ""));
  if (r.registrant !== ADMIN_NAME || !r.shop.startsWith(MAIN_SHOP) || !r.changeType.endsWith("入庫/問屋仕入") || qty !== Number(quantity)) {
    throw new Error(`${what}: 増えた未承認の行が登録の内容と違う（承認状態「${r.status}」・店舗/在庫区分「${r.shop}」・増減数「${r.quantity}」・` +
      `在庫変動区分「${r.changeType}」・登録者「${r.registrant}」）`);
  }
  return r;
}

// ---- 1商品の形 ----

defineHistorySeed("S-M04-17-MODE-020", [goods("STOCK-001-020", "STOCK-001-020")], [approved("STOCK-001-020")]);
defineHistorySeed("S-M04-17-BASE-023", [goods("BASE-001-023", "BASE-001-023")], [approved("BASE-001-023")]);
defineHistorySeed("S-M04-17-PENDING-031", [goods("PENDING-M0417-031", "PENDING-M0417-031")], [pending("PENDING-M0417-031")]);
defineHistorySeed("S-M04-17-BASE-037", [goods("BASE-001-037", "BASE-001-037")], [approved("BASE-001-037")]);

// 承認のあと、商品規格登録編集画面で基準価格と販売価格を1200に変える（履歴作成時の販売価格は1000のまま残る）
defineHistorySeed("S-M04-17-BASE-026", [goods("BASE-001-026", "BASE-001-026", "1000")], [approved("BASE-001-026")],
  (adm, issue) => changeClassPrices(adm, { 商品コード: "BASE-001-026", 商品名: "BASE-001-026", 価格: "1200", onIssue: issue }));

// ---- 複数の商品の形 ----

// 承認済み（N）と入庫承認待ち（P）。N だけを承認する
defineHistorySeed("S-M04-17-MIX-055",
  [goods("MIX-M0417-055-N", "MIX-M0417-055-N"), goods("MIX-M0417-055-P", "MIX-M0417-055-P")],
  [approved("MIX-M0417-055-N"), pending("MIX-M0417-055-P")]);

// 変更時販売価格 500・1000・2000・0（0 の商品は基準価格・販売価格・買取価格とも0）
defineHistorySeed("S-M04-17-RANGE-012", [
  goods("RANGE-M0417-012-01", "RANGE-01-012", "500"),
  goods("RANGE-M0417-012-02", "RANGE-02-012", "1000"),
  goods("RANGE-M0417-012-03", "RANGE-03-012", "2000"),
  goods("RANGE-M0417-012-NULL", "RANGE-NULL-012", "0", "0"),
], ["RANGE-M0417-012-01", "RANGE-M0417-012-02", "RANGE-M0417-012-03", "RANGE-M0417-012-NULL"].map((c) => approved(c)));

// 在庫変動理由に「境界理由」を含むのは 01・02 だけ
defineHistorySeed("S-M04-17-RANGE-016", [
  goods("RANGE-M0417-016-01", "RANGE-01-016"),
  goods("RANGE-M0417-016-02", "RANGE-02-016"),
  goods("RANGE-M0417-016-03", "RANGE-03-016"),
  goods("RANGE-M0417-016-NULL", "RANGE-NULL-016"),
], [
  approved("RANGE-M0417-016-01", "境界理由 01"),
  approved("RANGE-M0417-016-02", "02 境界理由"),
  approved("RANGE-M0417-016-03"),
  approved("RANGE-M0417-016-NULL"),
]);
