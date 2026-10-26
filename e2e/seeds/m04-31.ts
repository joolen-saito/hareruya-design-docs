/**
 * M04-31 棚卸計画の画面シード。正本: cases/M04-31_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（007・019・021〜029・031・160〜164）が使うシードだけ。
 * - 店舗A・店舗B（S-M04-31-BASES）: 店舗登録で登録する。手元のDBには M04-22 のシードが作った「店舗A」「店舗B」（会社名「M04-22試験会社」）があり、
 *   ほかの必須項目は「任意の値」なので、M04-22 と同じ値で探し、あれば内容を確かめて使う（M04-30 も同じ店舗を使う）。
 * - 店舗C（閉店）: 店舗登録で「閉店」を選んで登録する。あれば閉店であることを確かめて使う。
 * - 「営業中の店舗は店舗Aと店舗Bの2件だけ」は作らない（手元のDBは開店中の店舗が50店ほどあり、閉店にするとほかの担当の共有データを壊す）。
 *   この前提を使うケース（020）は実装しない。
 * - 「試験環境の時刻設定で日付を2026/10/19に固定する」は画面で行えない（環境の設定）。固定せずに実行日のまま流し、注記に残す（条件付き）。
 * - 管理者 m0431_admin・m0431_noedit（S-M04-31-ADM・ADM-NOEDIT）: メンバー管理で登録する。権限は「システム管理者」（在庫管理を操作できる）。
 *   所属は選択肢の先頭（シード表に指定が無い）。所属店舗はデフォルト検索表示店舗と同じ店舗（画面がデフォルト検索表示店舗を所属店舗の中からしか選ばせない）。
 * - 棚卸名の接頭辞で「…で始まる棚卸計画とその棚卸詳細を削除する」シード: 棚卸計画を削除する画面は無い（アプリに削除の機能が無い）。
 *   DBの参照で0件であることを確かめるだけにし、1件でもあれば止める（条件付き。M03-13 の018 などと同じ扱い）。
 * - 「全棚卸計画とその棚卸詳細を削除する」シード（007・026・028・029）: 削除の画面が無く、手元のDBには棚卸計画が300件以上ある。
 *   全件0件は作れないので、ケースが見る範囲（店舗A・EC-CUBE の棚卸計画）が0件であることをDBの参照で確かめるだけにする（条件付き）。
 * - RC-ORG-160〜162・RC-PLAN-160〜162: M04-02 の部品（申請者・承認者の登録、在庫編集の入庫と承認）を使い、棚卸計画の登録・
 *   棚卸商品CSV登録・棚卸商品数量CSV登録・差異確認を足す。商品は正本の固定の商品コードで、清掃の手順が無いので、残っていれば止める。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { openStoreCount, planCountAll, planCountByName, planCountByPrefix, planCountByStore } from "../db/m04_31_inventory_plan";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession as withAdminSessionRaw } from "../lib/session";
import {
  approveOne, fillStockEdit, searchApprovals, searchStockByCode, stockInRow, submitStockEdit,
} from "../pages/admin/m04_02_rc_stock";
import { expectNoProductCodes } from "../pages/admin/m04_17_seed_ops";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import {
  ensureClosedStore, InventoryPlanEditPage, InventoryPlanListPage, InventoryPlanNewPage, pressDiffConfirm, topMessages,
} from "../pages/admin/m04_31_inventory_plan";
import { createGoodsProduct } from "../pages/admin/m04_31_seed_ops";
import { defineRcOrg, rcOrg, RcOrg, RcStore, storeNameOf } from "./m04-02";

/** 共通の withAdminSession に、待ちの上限（操作120秒・画面の移動180秒）を付けたもの。誤ったセレクタでロックを長く持たないように（店舗登録の保存は30秒を超えることがある。2026-10-22 の104） */
function withAdminSession<T>(browser: Browser, account: Account, fn: (page: Page) => Promise<T>): Promise<T> {
  return withAdminSessionRaw(browser, account, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return fn(page);
  });
}

// ---- 店舗・管理者 ----

/** M04-22 のシードと同じ値（店名・会社名で探して、内容が同じなら使う） */
const storeLikeM0422 = (店名: string, 英語: string, url: string, digit: string): M0424StoreInput => ({
  店名, 店名カナ: "テンポ", 店名英語: 英語, 支店URL: url, 店名略称3文字: digit, ショップ名略称: 店名,
  会社名: "M04-22試験会社", 会社名カナ: "エムゼロヨンニジュウニシケンガイシャ", 郵便番号: "160-0022", 都道府県: "東京都",
  住所1: "新宿区新宿4-22-1", 住所2: "試験ビル", 電話番号: "03-0422-0001",
});
export const STORE_A = storeLikeM0422("店舗A", "Store A", "m0422a", "Q2A");
export const STORE_B = storeLikeM0422("店舗B", "Store B", "m0422b", "Q2B");
export const STORE_C: M0424StoreInput = {
  店名: "店舗C", 店名カナ: "テンポ", 店名英語: "Store C", 支店URL: "m0431c", 店名略称3文字: "Q3C", ショップ名略称: "店舗C",
  会社名: "M04-31試験会社", 会社名カナ: "エムゼロヨンサンジュウイチシケンガイシャ", 郵便番号: "160-0022", 都道府県: "東京都",
  住所1: "新宿区新宿4-31-1", 住所2: "試験ビル", 電話番号: "03-0431-0001",
};

export const M0431_ADMIN: Account = { loginId: "m0431_admin", password: "Passw0rd!M0431" };
export const M0431_NOEDIT: Account = { loginId: "m0431_noedit", password: "Passw0rd!M0431" };
export const ADMIN_NAME = "試験管理者A";
export const NOEDIT_NAME = "試験管理者B";

const storeIds = new Map<string, string>();
/** S-M04-31-BASES が確かめた店舗ID（店名で引く） */
export function storeIdOf(v: M0424StoreInput): string {
  const known = storeIds.get(v.店名);
  if (!known) throw new Error(`${v.店名} の店舗IDが未確定（S-M04-31-BASES を先に作る）`);
  return known;
}

defineSeed("S-M04-31-BASES", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    storeIds.set("店舗A", await ensureStore(page, STORE_A, issue));
    storeIds.set("店舗B", await ensureStore(page, STORE_B, issue));
    storeIds.set("店舗C", await ensureClosedStore(page, STORE_C, issue));
  });
  issue(`店舗A（店舗ID ${storeIds.get("店舗A")}）・店舗B（${storeIds.get("店舗B")}）は M04-22 のシードと同じ値の店舗を使った。店舗C（${storeIds.get("店舗C")}）は閉店で登録した`);
  const open = openStoreCount();
  issue(`補い: 「営業中の店舗は店舗Aと店舗Bの2件だけ」は作っていない（手元のDBの開店中の店舗は ${open} 店。ほかの店舗を閉店にするとほかの担当の共有データを壊す）`);
  issue("補い: 「試験環境の時刻設定で日付を2026/10/19に固定する」は画面で行えないので行っていない（実行日の日付のまま）");
});

defineSeed("S-M04-31-ADM", { needs: ["S-M04-31-BASES"] }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const a = storeIdOf(STORE_A);
  const b = storeIdOf(STORE_B);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMemberByStoreIds(page, {
      名前: ADMIN_NAME, ログインID: M0431_ADMIN.loginId, メールアドレス: "m0431_admin@example.test", パスワード: M0431_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a, b],
    });
  });
  await withAdminSession(browser, M0431_ADMIN, async () => undefined);
  issue("権限は「システム管理者」（在庫管理を操作できる）、所属は選択肢の先頭、所属店舗はデフォルト検索表示店舗と同じ店舗A");
});

defineSeed("S-M04-31-ADM-NOEDIT", { needs: ["S-M04-31-BASES"] }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const b = storeIdOf(STORE_B);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMemberByStoreIds(page, {
      名前: NOEDIT_NAME, ログインID: M0431_NOEDIT.loginId, メールアドレス: "m0431_noedit@example.test", パスワード: M0431_NOEDIT.password,
      権限: "システム管理者", 所属店舗ID: b, デフォルト検索表示店舗ID: b, 編集可能店舗ID: [b],
    });
  });
  await withAdminSession(browser, M0431_NOEDIT, async () => undefined);
  issue("権限は「システム管理者」（在庫管理を操作できる）、所属は選択肢の先頭、所属店舗とデフォルト検索表示店舗は店舗B（シード表にデフォルト検索表示店舗の指定は無いが画面で必須）");
});

// ---- 棚卸計画の「削除する」シード（削除の画面が無いので、0件であることを確かめるだけ） ----

function definePrefixZero(seedId: string, prefix: string): void {
  defineSeed(seedId, async () => {
    const n = planCountByPrefix(prefix);
    if (n > 0) throw new Error(`${seedId}: 棚卸名が ${prefix} で始まる棚卸計画が ${n} 件ある。削除の画面が無いので0件にできない（前の実行の残り。流し直すかは依頼者の判断が要る）`);
    reportSeedIssue(seedId, `補い: 棚卸計画を削除する画面が無いので、削除はせず、棚卸名が ${prefix} で始まる棚卸計画が0件であることをDBの参照で確かめた`);
  });
}

definePrefixZero("S-M04-31-NEWINIT-019", "M0431-019-");
definePrefixZero("S-M04-31-NEWOPT-020", "M0431-020-");
definePrefixZero("S-M04-31-REGOK-021", "M0431-021-");
definePrefixZero("S-M04-31-REGNAV-022", "M0431-022-");
definePrefixZero("S-M04-31-REGB-023", "M0431-023-");
definePrefixZero("S-M04-31-REGDB-024", "M0431-024-");
definePrefixZero("S-M04-31-REGNOMEMO-025", "M0431-025-");
definePrefixZero("S-M04-31-REGMAX-027", "M0431-027-");
definePrefixZero("S-M04-31-REGNOEDIT-031", "M0431-031-");
definePrefixZero("S-M04-31-CBREGAS-163", "M0431-CB163-");
definePrefixZero("S-M04-31-CBREGBE-164", "M0431-CB164-");

/** 「全棚卸計画が0件」: 作れないので、店舗A・EC-CUBE の棚卸計画が0件であることだけを確かめる */
function defineAllZero(seedId: string): void {
  defineSeed(seedId, { needs: ["S-M04-31-BASES"] }, async () => {
    const all = planCountAll();
    const inA = planCountByStore(storeIdOf(STORE_A), 1);
    if (inA > 0) throw new Error(`${seedId}: 店舗A・EC-CUBE の棚卸計画が ${inA} 件ある。削除の画面が無いので0件にできない`);
    reportSeedIssue(seedId, `補い: 全棚卸計画の削除は、削除の画面が無いので行っていない（手元のDBの棚卸計画は ${all} 件で、全件0件の状態は作れない）。` +
      `ケースが見る店舗A・EC-CUBE の棚卸計画が0件であることをDBの参照で確かめた`);
  });
}

defineAllZero("S-M04-31-EMPTY-007");
defineAllZero("S-M04-31-REGBLANK-026");
defineAllZero("S-M04-31-REGNAME256-028");
defineAllZero("S-M04-31-REGMEMO1025-029");

// ---- RC-*（棚卸結果の在庫反映が他機能へ届くケース） ----

export const RC160 = rcOrg("rc0431-001", "RC0431-001", "Passw0rd-RC0431001");
export const RC161 = rcOrg("rc0431-002", "RC0431-002", "Passw0rd-RC0431002");
export const RC162 = rcOrg("rc0431-003", "RC0431-003", "Passw0rd-RC0431003");

const branch = (no: string, digit: string): RcStore => ({
  支店: {
    店名: `RC0431-${no}支店`, 店名カナ: "アールシーシテン", 店名英語: "RC Branch", 支店URL: `rc0431s${no}`, 店名略称3文字: digit,
    ショップ名略称: `RC0431-${no}支店`, 会社名: "株式会社晴れる屋", 会社名カナ: "カブシキガイシャハレルヤ", 郵便番号: "160-0022",
    都道府県: "東京都", 住所1: "新宿区新宿2-2-2", 住所2: "晴ビル31F", 電話番号: "03-0431-0" + no,
  },
});
export const RC160_STORE = branch("001", "R31");
export const RC161_STORE = branch("002", "R32");
export const RC162_STORE: RcStore = { 本店: true };

defineRcOrg("S-M04-31-RC-ORG-160", RC160, RC160_STORE);
defineRcOrg("S-M04-31-RC-ORG-161", RC161, RC161_STORE);
defineRcOrg("S-M04-31-RC-ORG-162", RC162, RC162_STORE);

export type RcPlan = { 商品コード: string; 商品名: string; 棚卸名: string; 棚卸数量: string; 呼び名: string };
export const RC160_PLAN: RcPlan = { 商品コード: "RC0431001CODE", 商品名: "RC0431-001-NAME", 棚卸名: "RC0431-001-PLAN", 棚卸数量: "8", 呼び名: "〔棚卸計画ID-M0431-RC001〕" };
export const RC161_PLAN: RcPlan = { 商品コード: "RC0431002CODE", 商品名: "RC0431-002-NAME", 棚卸名: "RC0431-002-PLAN", 棚卸数量: "13", 呼び名: "〔棚卸計画ID-M0431-RC002〕" };
export const RC162_PLAN: RcPlan = { 商品コード: "RC0431003CODE", 商品名: "RC0431-003-NAME", 棚卸名: "RC0431-003-PLAN", 棚卸数量: "13", 呼び名: "〔棚卸計画ID-M0431-RC003〕" };

/**
 * 商品をグッズ商品CSV登録で作って規格を公開にし、申請者の在庫編集（入庫/その他・試験データ・10・仕入単価100）を承認者が承認して在庫10にする。
 * 承認者で棚卸計画（店舗・EC-CUBE）を登録して編集画面のアドレスの棚卸計画IDを控え、棚卸商品CSV登録で商品コード1行、
 * 棚卸商品数量CSV登録で棚卸数量を登録し、一覧の商品名のリンクから棚卸在庫確認を開いて差異確認のボタンを押す。在庫反映はしない。
 */
function defineRcPlan(seedId: string, orgSeedId: string, org: RcOrg, store: RcStore, plan: RcPlan): void {
  defineSeed(seedId, { needs: [orgSeedId] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const shop = await storeNameOf(browser, org.申請者.account, store);
    if (planCountByName(plan.棚卸名) > 0) {
      throw new Error(`${seedId}: 棚卸名 ${plan.棚卸名} の棚卸計画が前の実行から残っている。正本に清掃の手順が無いので止めた`);
    }
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await expectNoProductCodes(page, [plan.商品コード], seedId);
      await createGoodsProduct(page, {
        商品コード: plan.商品コード, 商品名: plan.商品名, 商品名英: `${plan.商品名}-EN`, 基準価格: "1", 販売価格: "1", 買取価格: "1", 原価単価: "1",
      }, seedId, issue);
    });
    await withAdminSession(browser, org.申請者.account, async (page) => {
      const list = await searchStockByCode(page, { 商品コード: plan.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      const row = list.row(plan.商品コード, shop, "EC-CUBE");
      expect(await stockInRow(row), `${seedId}: 入庫の前の ${shop}・EC-CUBE の在庫`).toBe(0);
      await list.openEdit(row);
      await fillStockEdit(page, { 在庫変動区分: "入庫/その他", 在庫変動理由: "試験データ", 在庫増減数: "10", 仕入単価: "100", 承認通知先: org.承認者.名前 });
      await submitStockEdit(page, `${seedId} の在庫編集（入庫10）`, issue);
    });
    await withAdminSession(browser, org.承認者.account, async (page) => {
      await searchApprovals(page, { 店舗: shop, 登録者: org.申請者.名前 });
      await approveOne(page, "在庫編集", `${seedId} の在庫編集の承認`, issue);
      const list = await searchStockByCode(page, { 商品コード: plan.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      expect(await stockInRow(list.row(plan.商品コード, shop, "EC-CUBE")), `${seedId}: 承認のあとの ${shop}・EC-CUBE の在庫は10`).toBe(10);

      // 棚卸計画の登録（承認者）
      const planList = new InventoryPlanListPage(page);
      await planList.open();
      const label = await planList.pressNew();
      if (label !== "新規作成") issue(`補い: シード表の「新規作成」ボタンは画面に無く、新規作成画面へのボタンの文言は「${label}」。このボタンを押した`);
      const form = new InventoryPlanNewPage(page);
      await form.fill({ 棚卸名: plan.棚卸名, 店舗: shop, 在庫区分: "EC-CUBE" });
      if ((await form.submit()) !== "送信") throw new Error(`${seedId}: 棚卸計画の登録がブラウザの入力チェックで止まった: ${(await form.invalidFields()).join(" / ")}`);
      const edit = new InventoryPlanEditPage(page);
      const id = edit.planIdInUrl();
      const m = await topMessages(page);
      if (!id || m.エラー.length) throw new Error(`${seedId}: 棚卸計画を登録できない（${page.url()}・${m.エラー.join(" / ")}）`);
      notes.set(plan.呼び名, id);
      await edit.uploadCsv("商品登録", { name: `${seedId}-items.csv`, body: `商品コード\n${plan.商品コード}\n` }, `${seedId} の棚卸商品CSV登録`, issue);
      await edit.uploadCsv("数量登録", { name: `${seedId}-qty.csv`, body: `商品コード,棚卸数量\n${plan.商品コード},${plan.棚卸数量}\n` }, `${seedId} の棚卸商品数量CSV登録`, issue);
      const before = await edit.detailRows();
      expect(before.map((r) => ({ 商品コード: r["商品コード"], 在庫数量: r["在庫数量"], 棚卸数量: r["棚卸数量"] })), `${seedId}: 棚卸詳細は1件`)
        .toEqual([{ 商品コード: plan.商品コード, 在庫数量: "10", 棚卸数量: plan.棚卸数量 }]);
      await edit.openDetail(plan.商品コード);
      const buttonLabel = await pressDiffConfirm(page, `${seedId} の差異確認`);
      if (buttonLabel !== "差異確認＆完了") issue(`補い: シード表の「差異確認＆完了」ボタンは画面に無く、棚卸在庫確認の差異確認のボタンの文言は「${buttonLabel}」。このボタンを押した`);
      await edit.openById(id);
      const after = await edit.detailRows();
      expect(after.map((r) => r["差異確認"]), `${seedId}: 差異確認が「済」`).toEqual(["済"]);
      issue(`棚卸計画「${plan.棚卸名}」（棚卸計画ID ${id}）を登録し、棚卸詳細 ${plan.商品コード}（在庫数量10・棚卸数量${plan.棚卸数量}・差異確認済み）を作った`);
    });
  });
}

defineRcPlan("S-M04-31-RC-PLAN-160", "S-M04-31-RC-ORG-160", RC160, RC160_STORE, RC160_PLAN);
defineRcPlan("S-M04-31-RC-PLAN-161", "S-M04-31-RC-ORG-161", RC161, RC161_STORE, RC161_PLAN);
defineRcPlan("S-M04-31-RC-PLAN-162", "S-M04-31-RC-ORG-162", RC162, RC162_STORE, RC162_PLAN);
