/**
 * M04-25 在庫移動指示詳細の画面シード。正本: cases/M04-25_seed_data.tsv
 * M04-28 送り状CSV出力のシード（seeds/m04-28.ts）も、ここの店舗・承認する管理者・在庫移動指示の作り方を使う。
 *
 * 作るシード（画面だけで準備できるケース 006〜010・014〜017・020・026・029〜034 が使うもの）:
 * - S-M04-25-STORES: 東京店（高額商品閾値1=10000）・大阪店（閾値は空）。シード表はほかの必須項目を「任意の有効な値」とする。
 *   M04-28 のシード表（S-M04-28-STORES）は同じ店名「東京店」「大阪店」の店舗に会社名・住所などを定めるので、両機能で同じ2店を使う
 *   （会社名・住所などは M04-28 の値、閾値は M04-25 の値）。同じ店名の店舗が2つあると、店名で店舗を選ぶ画面（在庫変更CSV登録など）で
 *   取り違えるため（HANDOFF 4章の27）。店名・会社名・開店で探し、あれば内容を確かめて使い、無ければ店舗登録画面で登録する。
 *   手元のDBには M04-24 のシードの「大阪店」（会社名「株式会社晴れる屋」）もある。店舗を選ぶところは、どれも控えた店舗IDで選ぶ。
 * - S-M04-25-ADM: 「M04-25試験管理者」（ログインID m0425_admin）。所属店舗・デフォルト検索表示店舗は東京店、編集可能店舗は東京店・大阪店、
 *   権限は「システム管理者」（在庫管理を操作できる）。管理者ID 42590003 は画面が振るので指定できない（ケースの手順・期待結果には出てこない）。
 * - S-M04-25-SEED-MEMBER: 「m0425_seed」。所属店舗は東京店、編集可能店舗は東京店・大阪店、権限は「システム管理者」。
 *   登録後のメンバー編集画面のアドレスの番号を〔メンバーID-M0425-共有〕に控える。
 * - 在庫移動指示を作るケース専用のシード: 正本の作り方のとおり、グッズ商品CSV登録 → 在庫変更CSV登録と承認 → 在庫移動の登録
 *   （在庫検索一覧の「在庫移動登録」または在庫移動CSV登録）→ ピック・出庫承認申請 → 出庫承認 → 在庫移動指示作成 → 在庫移動指示検索で
 *   在庫移動指示IDを控える → （送り状No.の登録）→（詳細画面で備考の登録）→（入庫承認申請・入庫承認）の順に画面で作る。
 * - S-M04-25-DP-STORE-030・DP-MEMBER-030・DP-MOVE-030: M0425-030-出庫店（閾値 5000・10000）と、その店舗の管理者2人と、3商品の在庫移動指示。
 *
 * 正本の外で補ったもの（記録 e2e/review/M04-25_progress_2026-10-21.md の「シード・手順の解釈」。HANDOFF 4章の9 と同じ種類の補い）:
 * - 承認用管理者・入庫承認用管理者: シード表は「登録者とは別の、所属店舗と編集可能店舗が東京店（大阪店）で承認権限を持つ管理者」を使うが、
 *   作り方が無い。「M04-25東京店承認者」「M04-25大阪店入庫承認者」（システム管理者）をメンバー管理で作る（あれば使う）。
 * - 在庫変更CSV登録・在庫移動の登録・入庫承認申請をする管理者: シード表に無いところは M04-25試験管理者（m0425_admin）にした。
 *   グッズ商品CSV登録はシード表に人の指定が無いので、全権限の管理者（初期管理者）で行う。
 * - 在庫移動指示検索の検索（在庫移動指示IDを控える・送り状No.の登録・詳細画面を開く）: シード表は在庫移動IDだけを入れて検索するが、
 *   画面は出庫元店舗・入庫先店舗を必須にしている（入れないとブラウザの入力チェックが検索を止める）。出庫元・入庫先の店舗も選んで検索する。
 * - 固定の商品コードの商品: 正本に片付けの手順が無い。同じDBで流し直したときにシードが止まらないよう、同じ商品コードの商品があれば
 *   グッズ商品CSV登録を飛ばしてその商品を使う（シードの報告に注記する）。在庫は毎回、在庫変更CSVで入庫して承認する。
 * DBでの準備が要るシード（DISPLAY-001・004・005・UNSHIPPED-002・EDIT-003・DELETE-A-018・DELETE-B-019）は作らない。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue, SeedBuilder, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { countProductsByCode, readGoodsRootCategoryId } from "../pages/admin/m04_13_setup";
import { registerStockChangeCsv } from "../pages/admin/m04_19_stock_change_csv";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { InstructionRow } from "../pages/admin/m04_24_move_instruction";
import {
  approveOutbound, MoveTransferListPage, openStockApprovalListForStore, registerMove, requestOutboundApproval, searchStock,
} from "../pages/admin/m04_24_stock_move";
import { adminUrl } from "../lib/session";
import {
  approveInbound, ensureStoreWithThresholds, registerMoveByCsv, requestInboundApproval, saveMemoFromSearch, searchInstructionById,
  searchInstructionByMoveId, ThresholdStoreInput,
} from "../pages/admin/m04_25_move_chain";
import { expectSaved } from "../pages/admin/common";

export type Actor = { 名前: string; account: Account };

/** 待ちの上限（設定ファイルは操作・画面の移動の待ちに上限を置いていないので、止まったときに30分待たないようにする） */
export function guard(page: Page): void {
  page.setDefaultTimeout(180_000);
  page.setDefaultNavigationTimeout(180_000);
}

export const M0425_ADMIN: Account = { loginId: "m0425_admin", password: "Passw0rd!M0425" };
export const M0425_ADMIN_ACTOR: Actor = { 名前: "M04-25試験管理者", account: M0425_ADMIN };
const SEED_MEMBER: Actor = { 名前: "m0425_seed", account: { loginId: "m0425_seed", password: "Passw0rd!M0425seed" } };

// ---------------------------------------------------------------- 店舗（M04-25・M04-28 で共有）

export type SharedStore = "東京店" | "大阪店";
const SHARED_STORES: Record<SharedStore, ThresholdStoreInput> = {
  東京店: {
    店名: "東京店", 店名カナ: "トウキョウテン", 店名英語: "Tokyo", 支店URL: "m0425tokyo", 店名略称3文字: "Q5T", ショップ名略称: "東京店",
    会社名: "株式会社送り元", 会社名カナ: "カブシキガイシャオクリモト", 郵便番号: "1000001", 都道府県: "東京都",
    住所1: "千代田区千代田1-1", 住所2: "送り元ビル1F", 電話番号: "0311112222", 高額商品閾値: ["10000", "", ""],
  },
  大阪店: {
    店名: "大阪店", 店名カナ: "オオサカテン", 店名英語: "Osaka", 支店URL: "m0425osaka", 店名略称3文字: "Q5O", ショップ名略称: "大阪店",
    会社名: "株式会社送り先", 会社名カナ: "カブシキガイシャオクリサキ", 郵便番号: "5300001", 都道府県: "大阪府",
    住所1: "大阪市北区梅田2-2", 住所2: "送り先ビル2F", 電話番号: "0666667777", 高額商品閾値: ["", "", ""],
  },
};

const sharedStoreIds = new Map<SharedStore, string>();
/** 東京店・大阪店の店舗ID（あれば内容を確かめて使い、無ければ登録する。ワーカーの中で覚える） */
export async function sharedStoreId(browser: Browser, 店名: SharedStore, seedId: string): Promise<string> {
  const known = sharedStoreIds.get(店名);
  if (known) return known;
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStoreWithThresholds(page, SHARED_STORES[店名], (m) => reportSeedIssue(seedId, m)));
  sharedStoreIds.set(店名, id);
  return id;
}

defineSeed("S-M04-25-STORES", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-M0425-共有A〕", await sharedStoreId(browser, "東京店", seed.シードID));
  notes.set("〔店舗ID-M0425-共有B〕", await sharedStoreId(browser, "大阪店", seed.シードID));
});

// ---------------------------------------------------------------- 管理者

/** メンバー管理で、あれば内容を確かめて使い、無ければ登録する。管理者IDを返す */
export async function ensureActor(browser: Browser, a: Actor, v: { 所属店舗ID: string; 編集可能店舗ID: string[]; email: string }): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: a.名前, ログインID: a.account.loginId, メールアドレス: v.email, パスワード: a.account.password,
    権限: "システム管理者", 所属店舗ID: v.所属店舗ID, デフォルト検索表示店舗ID: v.所属店舗ID, 編集可能店舗ID: v.編集可能店舗ID,
  }));
  await withAdminSession(browser, a.account, async () => undefined); // ログインできる（ロックされていない）こと
  return id;
}

defineSeed("S-M04-25-ADM", { needs: ["S-M04-25-STORES"] }, async ({ browser, notes }) => {
  const a = notes.get("〔店舗ID-M0425-共有A〕");
  const b = notes.get("〔店舗ID-M0425-共有B〕");
  await ensureActor(browser, M0425_ADMIN_ACTOR, { 所属店舗ID: a, 編集可能店舗ID: [a, b], email: "m0425_admin@example.test" });
});

defineSeed("S-M04-25-SEED-MEMBER", { needs: ["S-M04-25-STORES"] }, async ({ browser, notes }) => {
  const a = notes.get("〔店舗ID-M0425-共有A〕");
  const b = notes.get("〔店舗ID-M0425-共有B〕");
  notes.set("〔メンバーID-M0425-共有〕", await ensureActor(browser, SEED_MEMBER, { 所属店舗ID: a, 編集可能店舗ID: [a, b], email: "m0425_seed@example.test" }));
});

/** 正本の外で補う承認する管理者（シード表の「承認用管理者」「入庫承認用管理者」。作り方がシード表に無い） */
export const TOKYO_APPROVER: Actor = { 名前: "M04-25東京店承認者", account: { loginId: "m0425-apr-tokyo", password: "Passw0rd!M0425apr" } };
export const OSAKA_APPROVER: Actor = { 名前: "M04-25大阪店入庫承認者", account: { loginId: "m0425-apr-osaka", password: "Passw0rd!M0425apr" } };
const approverReady = new Set<string>();
export async function ensureApprover(browser: Browser, a: Actor, 店舗ID: string): Promise<Actor> {
  if (!approverReady.has(a.account.loginId)) {
    await ensureActor(browser, a, { 所属店舗ID: 店舗ID, 編集可能店舗ID: [店舗ID], email: `${a.account.loginId}@example.test` });
    approverReady.add(a.account.loginId);
  }
  return a;
}

// ---------------------------------------------------------------- 在庫移動指示の作り方

export type Goods = { 商品コード: string; 基準価格: number; 販売価格: number };

/** グッズ商品CSV登録。同じ商品コードの商品がすべてあれば登録を飛ばして使い、一部だけあれば止める */
export async function ensureGoods(browser: Browser, by: Account, seedId: string, goods: Goods[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, by, async (page) => {
    guard(page);
    const counts: number[] = [];
    for (const g of goods) counts.push(await countProductsByCode(page, g.商品コード));
    if (counts.every((n) => n === 1)) {
      issue(`商品コード ${goods.map((g) => g.商品コード).join("・")} の商品は登録済み（前の実行で作ったもの）だったので、グッズ商品CSV登録を飛ばしてそれを使った`);
      return;
    }
    if (counts.some((n) => n > 0)) throw new Error(`${seedId}: 商品コード ${goods.map((g, i) => `${g.商品コード}=${counts[i]}件`).join("・")}。一部だけ登録済みで、どう作るか決められない`);
    await registerGoodsCsv(page, {
      what: `${seedId}: グッズ商品CSV登録（${goods.length}行）`, fileName: `${seedId.toLowerCase()}-goods-${Date.now()}.csv`,
      categoryId: await readGoodsRootCategoryId(page), onWarning: issue,
      lines: goods.map((g) => ({ code: g.商品コード, nameJp: g.商品コード, nameEn: g.商品コード, values: { 基準価格: String(g.基準価格), 販売価格: String(g.販売価格) } })),
    });
    issue("グッズ商品CSVのアップロードのあと、確認モーダルは出ず、そのまま取り込まれた（設計書 M03-27 L0092 は確認モーダルでの確定を定める。依頼者の判断待ち）");
  });
}

/** 在庫変更CSV登録で入庫し（registrant）、承認する管理者（approver）が在庫編集承認一覧で承認する */
export async function stockInByCsv(browser: Browser, seedId: string, v: {
  registrant: Actor; approver: Actor; 店舗ID: string; 店名: string; 行: { 商品コード: string; 在庫増減数: number; 仕入単価: number }[];
}): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const reason = `${seedId}試験用`;
  await withAdminSession(browser, v.registrant.account, (page) => registerStockChangeCsv(page, {
    店舗: v.店名, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: reason, 承認者: v.approver.名前,
    行: v.行.map((r) => ({ 商品コード: r.商品コード, 在庫増減数: String(r.在庫増減数), 仕入単価: String(r.仕入単価) })),
    ファイル名: `${seedId.toLowerCase()}-stock-${Date.now()}.csv`,
  }, `${seedId}: 在庫変更CSV登録（${v.行.length}行）`, issue));
  const total = String(v.行.reduce((s, r) => s + r.在庫増減数, 0));
  await withAdminSession(browser, v.approver.account, async (page) => {
    guard(page);
    const list = await openStockApprovalListForStore(page, v.店舗ID);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === v.registrant.名前
      && r.shop.startsWith(v.店名) && r.changeType.endsWith("入庫/その他") && r.quantity === total);
    if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、${v.registrant.名前} の在庫変更CSV登録（合計 ${total}）の未承認の行が無い`);
    if (rows.length > 1) issue(`在庫編集承認一覧に、合計 ${total} の未承認の行が ${rows.length} 件あり、一覧の先頭を承認した`);
    await list.approve([rows[0].id], `${seedId}: 在庫変更CSV登録の承認`, issue);
  });
}

export type MoveSpec = {
  /** list: 在庫検索一覧の「在庫移動登録」（1商品） / csv: 在庫移動CSV登録 */
  方法: "list" | "csv";
  行: { 商品コード: string; 移動点数: number }[];
  /** 控える在庫移動IDの呼び名 */
  呼び名: string;
};

export type InstructionSpec = {
  出庫元: { 店舗ID: string; 店名: string };
  入庫先: { 店舗ID: string };
  /** 在庫移動を登録し、在庫移動指示を作る管理者 */
  operator: Actor;
  /** 出庫承認をする管理者 */
  approver: Actor;
  moves: MoveSpec[];
  /** 控える在庫移動指示IDの呼び名 */
  呼び名: string;
  送り状No?: string;
  備考?: string;
  /** 入庫承認申請まで（申請）・入庫承認まで（承認） */
  入庫?: { 段: "申請" | "承認"; approver: Actor };
  /** 在庫移動指示検索の行で確かめる値（M04-28 のシード表の「…であることを見る」） */
  確かめる行?: (row: InstructionRow) => string[];
};

/** 在庫移動・振替検索一覧で在庫移動の行のステータスを読み、求めるものでなければ止める */
async function expectMoveStatus(moves: MoveTransferListPage, id: string, want: string, what: string): Promise<void> {
  await moves.searchById(id);
  const s = await moves.rowState(id);
  if (s.ステータス !== want) throw new Error(`${what}: 在庫移動 ${id} のステータスが「${s.ステータス}」（${want}のはず）`);
}

/** 在庫移動を登録して出庫承認まで進め、在庫移動指示を作って控える（送り状No.・備考・入庫は spec のとおり） */
export async function buildInstruction({ browser, notes, seed }: SeedCtx, spec: InstructionSpec): Promise<string> {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const fromId = spec.出庫元.店舗ID;
  const toId = spec.入庫先.店舗ID;

  // 在庫移動の登録と承認申請
  const moveIds: string[] = [];
  for (const [i, m] of spec.moves.entries()) {
    const id = await withAdminSession(browser, spec.operator.account, async (page) => {
    guard(page);
      let moveId: string;
      if (m.方法 === "list") {
        if (m.行.length !== 1) throw new Error(`${seedId}: 在庫検索一覧からの在庫移動は1商品だけ`);
        const list = await searchStock(page, m.行[0].商品コード, fromId);
        moveId = await registerMove(page, list.row(m.行[0].商品コード, spec.出庫元.店名, "EC-CUBE"),
          { 入庫先店舗ID: toId, 入庫先在庫区分: "EC-CUBE", 移動点数: String(m.行[0].移動点数) }, `${seedId}: 在庫移動の登録（${i + 1}件目）`);
      } else {
        moveId = await registerMoveByCsv(page, {
          出庫元店舗ID: fromId, 入庫先店舗ID: toId, 出庫元在庫区分: "EC-CUBE", 入庫先在庫区分: "EC-CUBE", 行: m.行,
          ファイル名: `${seedId.toLowerCase()}-move${i + 1}-${Date.now()}.csv`,
        }, `${seedId}: 在庫移動CSV登録（${i + 1}件目）`);
      }
      await requestOutboundApproval(page, moveId, spec.approver.名前, `${seedId}: 在庫移動 ${moveId} の承認申請`);
      return moveId;
    });
    moveIds.push(id);
  }

  // 出庫承認
  await withAdminSession(browser, spec.approver.account, async (page) => {
    guard(page);
    const moves = new MoveTransferListPage(page);
    for (const id of moveIds) {
      await expectMoveStatus(moves, id, "出庫承認待ち", `${seedId}: 承認申請のあと`);
      await moves.openFromRow(id);
      await approveOutbound(page, id, `${seedId}: 在庫移動 ${id} の出庫承認`);
    }
  });

  // 在庫移動・振替IDを控え、在庫移動指示を作り、在庫移動指示検索で在庫移動指示IDを控える
  const instructionId = await withAdminSession(browser, spec.operator.account, async (page) => {
    guard(page);
    const moves = new MoveTransferListPage(page);
    for (const [i, id] of moveIds.entries()) {
      await expectMoveStatus(moves, id, "出庫承認済み", `${seedId}: 出庫承認のあと`);
      notes.set(spec.moves[i].呼び名, id);
    }
    if (moveIds.length === 1) {
      await moves.searchById(moveIds[0]);
    } else {
      // 複数の在庫移動を1つの在庫移動指示にまとめる: 出庫元店舗で検索し、一覧に全部の行があることを確かめて選ぶ
      await page.goto(adminUrl("/product/stock/move_transfer"));
      await page.waitForLoadState("load");
      // 出庫元店舗は複数選べる選択欄（select2 で飾られている）。中身の選択欄の値を切り替えて画面のスクリプトに知らせる
      const from = page.locator("#admin_search_stock_move_transfer_move_from_base_info");
      await expect(from.locator(`option[value="${fromId}"]`), `${seedId}: 在庫移動・振替検索一覧の出庫元店舗に店舗ID ${fromId}`).toHaveCount(1);
      await from.evaluate((n, v) => {
        const sel = n as HTMLSelectElement;
        for (const o of Array.from(sel.options)) o.selected = o.value === v;
        const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
        if (w.jQuery) w.jQuery(sel).trigger("change"); else sel.dispatchEvent(new Event("change", { bubbles: true }));
      }, fromId);
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), moves.form.locator('button[type="submit"]').first().click()]);
      for (const id of moveIds) await expect(moves.row(id), `${seedId}: 在庫移動・振替検索一覧に在庫移動 ${id} の行`).toHaveCount(1);
    }
    await moves.createInstruction(moveIds, `${seedId}: 在庫移動 ${moveIds.join("・")} の在庫移動指示作成`);
    issue("在庫移動指示検索の検索は、画面が必須にしている出庫元店舗・入庫先店舗も選んだ（シード表は在庫移動IDだけを入れる）");
    const search = await searchInstructionByMoveId(page, { 出庫元店舗ID: fromId, 入庫先店舗ID: toId, 在庫移動ID: moveIds[0] });
    const rows = await search.listedRows();
    if (rows.length !== 1 || !/^\d+$/.test(rows[0].移動指示ID)) {
      throw new Error(`${seedId}: 在庫移動指示検索で在庫移動 ${moveIds[0]} の行が1件でない（${rows.map((r) => r.移動指示ID).join("・") || "なし"}）`);
    }
    const iid = rows[0].移動指示ID;
    for (const id of moveIds) {
      await moves.searchById(id);
      const s = await moves.rowState(id);
      if (s.移動指示リストID !== iid) throw new Error(`${seedId}: 在庫移動 ${id} の行の移動指示リストIDが「${s.移動指示リストID}」（在庫移動指示検索では ${iid}）`);
    }
    notes.set(spec.呼び名, iid);
    if (spec.確かめる行) {
      const search2 = await searchInstructionById(page, { 出庫元店舗ID: fromId, 入庫先店舗ID: toId, 在庫移動指示ID: iid });
      const row = (await search2.listedRows()).find((r) => r.移動指示ID === iid);
      if (!row) throw new Error(`${seedId}: 在庫移動指示検索に移動指示ID ${iid} の行が無い`);
      const diff = spec.確かめる行(row);
      if (diff.length) throw new Error(`${seedId}: 在庫移動指示検索の移動指示ID ${iid} の行がシード表と違う: ${diff.join(" / ")}`);
    }

    if (spec.送り状No) {
      const s = await searchInstructionById(page, { 出庫元店舗ID: fromId, 入庫先店舗ID: toId, 在庫移動指示ID: iid });
      await s.pressTrackingRegister(iid);
      await expect(s.送り状No登録モーダル, `${seedId}: 送り状No.登録モーダル`).toBeVisible();
      const t = await s.submitTracking(iid, spec.送り状No);
      if (!t.sent) throw new Error(`${seedId}: 送り状No.の登録が、ブラウザの入力チェックで止まった: ${t.止めた項目.join(" / ")}`);
      await expectSaved(page, `${seedId}: 在庫移動指示 ${iid} の送り状No.「${spec.送り状No}」の登録`);
      for (const id of moveIds) await expectMoveStatus(moves, id, "移動中", `${seedId}: 送り状No.の登録のあと`);
    }
    if (spec.備考 !== undefined) {
      const s = await searchInstructionById(page, { 出庫元店舗ID: fromId, 入庫先店舗ID: toId, 在庫移動指示ID: iid });
      await saveMemoFromSearch(page, s, iid, spec.備考, `${seedId}: 在庫移動指示 ${iid} の備考「${spec.備考}」の登録`);
    }
    if (spec.入庫) {
      for (const id of moveIds) {
        await moves.searchById(id);
        await moves.openFromRow(id);
        await requestInboundApproval(page, id, spec.入庫.approver.名前, `${seedId}: 在庫移動 ${id} の入庫承認申請`);
        // シード表の状態は、入庫承認申請のあとも在庫移動がこの在庫移動指示に紐づいていること。
        // アプリは入庫承認申請の保存で在庫移動の移動指示リストIDを空にする（StockMoveInboundApprovalRequestUpdateAction の save の呼び出しに
        // 移動指示リストIDが無い）ので、紐づきが外れたら、正本の状態を作れないとして止める（ケースの合否は出さない）
        await moves.searchById(id);
        const s = await moves.rowState(id);
        if (s.移動指示リストID !== iid) {
          throw new Error(`${seedId}: 入庫承認申請のあと、在庫移動 ${id} の移動指示リストIDが「${s.移動指示リストID}」になり、在庫移動指示 ${iid} との紐づきが外れた。` +
            "シード表の状態（入庫承認申請・入庫承認のあとも紐づいている在庫移動）をアプリの画面の操作で作れない");
        }
      }
    }
    return iid;
  });

  if (spec.入庫?.段 === "承認") {
    await withAdminSession(browser, spec.入庫.approver.account, async (page) => {
    guard(page);
      const moves = new MoveTransferListPage(page);
      for (const id of moveIds) {
        await moves.searchById(id);
        await moves.openFromRow(id);
        await approveInbound(page, id, `${seedId}: 在庫移動 ${id} の入庫承認`);
        // シード表の「入庫完了」は、アプリのステータスの名前では「入庫済み」（入庫承認のあとの最後のステータス。ステータスのマスタの名前）
        await expectMoveStatus(moves, id, "入庫済み", `${seedId}: 入庫承認のあと`);
        issue(`入庫承認のあと、在庫移動 ${id} のステータスは「入庫済み」（シード表の「入庫完了」にあたる、入庫承認のあとの最後のステータス）`);
      }
    });
  }
  return instructionId;
}

// ---------------------------------------------------------------- M04-25 のケース専用のシード

const ADM_NEEDS = ["S-M04-25-ADM", "S-M04-25-STORES"];

/** 東京店→大阪店の在庫移動指示（1商品・1点・在庫検索一覧から）。送り状No.・備考・入庫は opt のとおり */
function simpleInstruction(n: string, opt: { 送り状No?: string; 備考?: string; 入庫?: "申請" | "承認" }): SeedBuilder {
  return async (ctx) => {
    const { browser, notes, seed } = ctx;
    const seedId = seed.シードID;
    const tokyo = notes.get("〔店舗ID-M0425-共有A〕");
    const osaka = notes.get("〔店舗ID-M0425-共有B〕");
    const code = `M0425-${n}-G1`;
    if (!seed.投入方法.includes(`商品コード「${code}」`)) throw new Error(`${seedId}: シード表に商品コード「${code}」が無い`);
    for (const v of [opt.送り状No, opt.備考]) {
      if (v !== undefined && !seed.投入方法.includes(`「${v}」`)) throw new Error(`${seedId}: シード表に「${v}」が無い`);
    }
    const approver = await ensureApprover(browser, TOKYO_APPROVER, tokyo);
    const inbound = opt.入庫 ? await ensureApprover(browser, OSAKA_APPROVER, osaka) : undefined;
    // 基準価格と販売価格は「任意の金額」
    await ensureGoods(browser, SETUP_ADMIN, seedId, [{ 商品コード: code, 基準価格: 1000, 販売価格: 1000 }]);
    await stockInByCsv(browser, seedId, { registrant: M0425_ADMIN_ACTOR, approver, 店舗ID: tokyo, 店名: "東京店", 行: [{ 商品コード: code, 在庫増減数: 1, 仕入単価: 100 }] });
    const k = n;
    await buildInstruction(ctx, {
      出庫元: { 店舗ID: tokyo, 店名: "東京店" }, 入庫先: { 店舗ID: osaka }, operator: M0425_ADMIN_ACTOR, approver,
      moves: [{ 方法: "list", 行: [{ 商品コード: code, 移動点数: 1 }], 呼び名: `〔在庫移動ID-M0425-${k}〕` }],
      呼び名: `〔在庫移動指示ID-M0425-${k}〕`, 送り状No: opt.送り状No, 備考: opt.備考,
      入庫: opt.入庫 && inbound ? { 段: opt.入庫, approver: inbound } : undefined,
    });
  };
}

defineSeed("S-M04-25-EDIT-007", { needs: ADM_NEEDS }, simpleInstruction("007", { 送り状No: "TRACK-BEFORE-007", 備考: "変更前備考" }));
defineSeed("S-M04-25-EDIT-008", { needs: ADM_NEEDS }, simpleInstruction("008", { 送り状No: "TRACK-BEFORE-008", 備考: "変更前備考" }));
defineSeed("S-M04-25-EDIT-009", { needs: ADM_NEEDS }, simpleInstruction("009", { 送り状No: "TRACK-BEFORE-009", 備考: "変更前備考" }));
defineSeed("S-M04-25-EDIT-010", { needs: ADM_NEEDS }, simpleInstruction("010", { 送り状No: "TRACK-BEFORE-010", 備考: "変更前備考" }));
defineSeed("S-M04-25-EDIT-014", { needs: ADM_NEEDS }, simpleInstruction("014", { 送り状No: "TRACK-BEFORE-014", 備考: "変更前備考" }));
defineSeed("S-M04-25-UNSHIPPED-015", { needs: ADM_NEEDS }, simpleInstruction("015", { 備考: "変更前備考" }));
defineSeed("S-M04-25-EDIT-016", { needs: ADM_NEEDS }, simpleInstruction("016", { 送り状No: "TRACK-BEFORE-016", 備考: "変更前備考" }));
defineSeed("S-M04-25-COMPLETE-017", { needs: ADM_NEEDS }, simpleInstruction("017", { 送り状No: "TRACK-42501704", 備考: "完了時備考", 入庫: "承認" }));
defineSeed("S-M04-25-DELETE-NG-020", { needs: ADM_NEEDS }, simpleInstruction("020", { 送り状No: "TRACK-42502007", 備考: "変更前備考" }));
defineSeed("S-M04-25-GFEDIT-026", { needs: ADM_NEEDS }, simpleInstruction("026", { 送り状No: "M0425-026-BEFORE-TRACK", 備考: "M0425-026-BEFORE-MEMO" }));
defineSeed("S-M04-25-DP-NOTRACK-031", { needs: ADM_NEEDS }, simpleInstruction("031", {}));
defineSeed("S-M04-25-CBEDIT-032", { needs: ADM_NEEDS }, simpleInstruction("CB032", { 送り状No: "M0425-CB032-BEFORE-TRACK", 備考: "M0425-CB032-BEFORE-MEMO", 入庫: "申請" }));
defineSeed("S-M04-25-CBEDIT-033", { needs: ADM_NEEDS }, simpleInstruction("CB033", { 送り状No: "M0425-CB033-BEFORE-TRACK", 備考: "M0425-CB033-BEFORE-MEMO", 入庫: "承認" }));
defineSeed("S-M04-25-CBEDIT-034", { needs: ADM_NEEDS }, simpleInstruction("CB034", { 送り状No: "M0425-CB034-BEFORE-TRACK", 備考: "M0425-CB034-BEFORE-MEMO" }));

/** 006: 4商品・在庫移動2件（在庫移動CSV登録）・送り状No.登録まで */
defineSeed("S-M04-25-DISPLAY-006", { needs: ADM_NEEDS }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const tokyo = notes.get("〔店舗ID-M0425-共有A〕");
  const osaka = notes.get("〔店舗ID-M0425-共有B〕");
  const codes = ["M0425-006-G1", "M0425-006-G2", "M0425-006-G3", "M0425-006-G4"];
  for (const c of codes) if (!seed.投入方法.includes(`「${c}」`)) throw new Error(`${seed.シードID}: シード表に商品コード「${c}」が無い`);
  const approver = await ensureApprover(browser, TOKYO_APPROVER, tokyo);
  await ensureGoods(browser, SETUP_ADMIN, seed.シードID, codes.map((c) => ({ 商品コード: c, 基準価格: 1000, 販売価格: 1000 })));
  await stockInByCsv(browser, seed.シードID, { registrant: M0425_ADMIN_ACTOR, approver, 店舗ID: tokyo, 店名: "東京店", 行: codes.map((c) => ({ 商品コード: c, 在庫増減数: 1, 仕入単価: 100 })) });
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: tokyo, 店名: "東京店" }, 入庫先: { 店舗ID: osaka }, operator: M0425_ADMIN_ACTOR, approver,
    moves: [
      { 方法: "csv", 行: [{ 商品コード: codes[0], 移動点数: 1 }, { 商品コード: codes[1], 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0425-006A〕" },
      { 方法: "csv", 行: [{ 商品コード: codes[2], 移動点数: 1 }, { 商品コード: codes[3], 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0425-006B〕" },
    ],
    呼び名: "〔在庫移動指示ID-M0425-006〕", 送り状No: "TRACK-42500601",
  });
});

/** 029: 1商品（基準価格12000・販売価格15000・仕入単価9000）・在庫移動CSV登録は表示用更新者 m0425_seed */
defineSeed("S-M04-25-DP-SINGLE-029", { needs: [...ADM_NEEDS, "S-M04-25-SEED-MEMBER"] }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const tokyo = notes.get("〔店舗ID-M0425-共有A〕");
  const osaka = notes.get("〔店舗ID-M0425-共有B〕");
  const code = "M0425-029-G1";
  if (!seed.投入方法.includes("商品コード「M0425-029-G1」・基準価格12000・販売価格15000") || !seed.投入方法.includes("仕入単価9000")) {
    throw new Error(`${seed.シードID}: シード表の商品・価格がテストの値と違う`);
  }
  const approver = await ensureApprover(browser, TOKYO_APPROVER, tokyo);
  await ensureGoods(browser, SETUP_ADMIN, seed.シードID, [{ 商品コード: code, 基準価格: 12000, 販売価格: 15000 }]);
  await stockInByCsv(browser, seed.シードID, { registrant: M0425_ADMIN_ACTOR, approver, 店舗ID: tokyo, 店名: "東京店", 行: [{ 商品コード: code, 在庫増減数: 1, 仕入単価: 9000 }] });
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: tokyo, 店名: "東京店" }, 入庫先: { 店舗ID: osaka }, operator: SEED_MEMBER, approver,
    moves: [{ 方法: "csv", 行: [{ 商品コード: code, 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0425-029〕" }],
    呼び名: "〔在庫移動指示ID-M0425-029〕",
  });
});

// ---- 030: 高額商品閾値が2つの出庫元店舗 ----

const STORE_030: ThresholdStoreInput = {
  店名: "M0425-030-出庫店", 店名カナ: "シュッコテン", 店名英語: "Shukko", 支店URL: "m0425shukko030", 店名略称3文字: "Q5S", ショップ名略称: "M0425-030-出庫店",
  会社名: "M04-25試験会社", 会社名カナ: "エムゼロヨンニジュウゴシケンガイシャ", 郵便番号: "1600023", 都道府県: "東京都",
  住所1: "新宿区西新宿4-25-1", 住所2: "試験ビル", 電話番号: "0304250030", 高額商品閾値: ["5000", "10000", ""],
};
export const M0425_030_A: Actor = { 名前: "m0425-030-a", account: { loginId: "m0425-030-a", password: "Passw0rd-M0425030" } };
const M0425_030_B: Actor = { 名前: "m0425-030-b", account: { loginId: "m0425-030-b", password: "Passw0rd-M0425030" } };

defineSeed("S-M04-25-DP-STORE-030", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-M0425-030〕", await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStoreWithThresholds(page, STORE_030, (m) => reportSeedIssue(seed.シードID, m))));
});

defineSeed("S-M04-25-DP-MEMBER-030", { needs: ["S-M04-25-DP-STORE-030", "S-M04-25-STORES"] }, async ({ browser, notes }) => {
  const s030 = notes.get("〔店舗ID-M0425-030〕");
  const osaka = notes.get("〔店舗ID-M0425-共有B〕");
  await ensureActor(browser, M0425_030_A, { 所属店舗ID: s030, 編集可能店舗ID: [s030, osaka], email: "dpm0425-030-a@example.test" });
  await ensureActor(browser, M0425_030_B, { 所属店舗ID: s030, 編集可能店舗ID: [s030], email: "dpm0425-030-b@example.test" });
});

defineSeed("S-M04-25-DP-MOVE-030", { needs: ["S-M04-25-DP-MEMBER-030", "S-M04-25-DP-STORE-030", "S-M04-25-STORES"] }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const s030 = notes.get("〔店舗ID-M0425-030〕");
  const osaka = notes.get("〔店舗ID-M0425-共有B〕");
  const goods: (Goods & { 仕入単価: number })[] = [
    { 商品コード: "M0425-030-G1", 基準価格: 12000, 販売価格: 15000, 仕入単価: 9000 },
    { 商品コード: "M0425-030-G2", 基準価格: 7000, 販売価格: 9000, 仕入単価: 5000 },
    { 商品コード: "M0425-030-G3", 基準価格: 3000, 販売価格: 4000, 仕入単価: 2000 },
  ];
  for (const g of goods) {
    if (!seed.投入方法.includes(`「${g.商品コード}」は基準価格${g.基準価格}・販売価格${g.販売価格}`)) throw new Error(`${seed.シードID}: シード表の ${g.商品コード} の価格がテストの値と違う`);
  }
  await ensureGoods(browser, SETUP_ADMIN, seed.シードID, goods);
  await stockInByCsv(browser, seed.シードID, {
    registrant: M0425_030_A, approver: M0425_030_B, 店舗ID: s030, 店名: STORE_030.店名,
    行: goods.map((g) => ({ 商品コード: g.商品コード, 在庫増減数: 1, 仕入単価: g.仕入単価 })),
  });
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: s030, 店名: STORE_030.店名 }, 入庫先: { 店舗ID: osaka }, operator: M0425_030_A, approver: M0425_030_B,
    moves: [{ 方法: "csv", 行: goods.map((g) => ({ 商品コード: g.商品コード, 移動点数: 1 })), 呼び名: "〔在庫移動ID-M0425-030〕" }],
    呼び名: "〔在庫移動指示ID-M0425-030〕",
  });
});
