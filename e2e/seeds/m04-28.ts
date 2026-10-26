/**
 * M04-28 送り状CSV出力の画面シード。正本: cases/M04-28_seed_data.tsv
 * 店舗・承認する管理者・在庫移動指示の作り方は M04-25 のシード（seeds/m04-25.ts）と同じものを使う。
 *
 * - S-M04-28-STORES: 東京店（株式会社送り元）・大阪店（株式会社送り先）。M04-25 のシードの東京店・大阪店と同じ2店（会社名・住所などは
 *   このシード表の値。東京店には M04-25 のシード表の高額商品閾値1=10000 も入っている。送り状CSVには閾値の列は無い）。
 *   店名「東京店」「大阪店」の店舗が2つずつになると、店名で店舗を選ぶ画面で取り違えるため（HANDOFF 4章の27）。
 *   シード表のほかの必須項目（店名(英語表記)・支店URL など）は、ほかの店舗と重ならない値にした。管理者情報のログインIDとパスワードは、
 *   店舗登録画面に入れる欄が無いので入れていない（M04-24 の店舗の部品と同じ）。
 * - S-M04-28-ADM: 「M04-28試験管理者」（ログインID m0428_admin）。所属店舗・デフォルト検索表示店舗は東京店、編集可能店舗は東京店・大阪店、
 *   権限は「システム管理者」。管理者ID 42890001 は画面が振るので指定できない（ケースの手順・期待結果には出てこない）。
 * - DATA-001・003〜007: 正本の作り方のとおり、基準価格3500（007 は 4500 も）の商品の東京店・EC-CUBEの在庫行を在庫検索一覧で選んで
 *   「在庫移動登録」→ ピック・出庫承認申請 → 出庫承認 → 在庫移動指示作成 → 移動指示リストIDを控える。在庫が足りないときは在庫編集で入庫して承認する。
 * - DP-DATA-009〜011: グッズ商品CSV登録 → 在庫変更CSV登録と承認 → 在庫移動CSV登録 → 出庫承認 → 在庫移動指示作成。
 * - DP-STORE-010・011、DP-MEMBER-010・011: 店舗と、その店舗の管理者2人（a は在庫管理を操作でき、b は承認用）。
 *
 * 正本の外で補ったもの（記録 e2e/review/M04-28_progress_2026-10-21.md の「シード・手順の解釈」）:
 * - 基準価格3500・4500の商品: シード表は「無ければ商品規格の登録画面で…登録する」とするが、商品登録画面は権限の設定で開けない（HANDOFF 3章）。
 *   グッズ商品CSV登録で、商品コード M0428-STD3500・M0428-STD4500（基準価格・販売価格 3500・4500）の商品を作る（あれば使う）。
 * - 承認者・承認用管理者（DATA-001〜007・DP-DATA-009）: シード表は「登録者とは別の、東京店を編集可能で承認権限を持つメンバー」を使うが
 *   作り方が無い。M04-25 のシードと同じ「M04-25東京店承認者」を使う（無ければ作る）。HANDOFF 4章の9 と同じ種類の補い。
 * - 007 の在庫: シード表は1件目の前に「在庫数が1未満なら1入庫」とするだけで、2件目（移動点数2）の前の入庫が無い。
 *   各在庫移動の前に、在庫が移動点数に足りなければ、足りない数だけ在庫編集で入庫して承認する。
 * - 在庫移動指示検索で行を見る・在庫移動指示IDを控える検索: 画面が必須にしている出庫元店舗・入庫先店舗も選ぶ（シード表は在庫移動IDだけ）。
 * - グッズ商品CSV登録をする人: シード表に指定の無いところは全権限の管理者（初期管理者）にした。在庫変更CSV・在庫編集の登録は、
 *   指定の無いところは M04-28試験管理者にした。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { InstructionRow } from "../pages/admin/m04_24_move_instruction";
import { openStockApprovalListForStore, searchStock, stockOf } from "../pages/admin/m04_24_stock_move";
import { ensureStoreWithThresholds, ThresholdStoreInput } from "../pages/admin/m04_25_move_chain";
import { registerStockEdit } from "../pages/admin/stock_edit";
import {
  Actor, buildInstruction, guard, ensureActor, ensureApprover, ensureGoods, Goods, sharedStoreId, stockInByCsv, TOKYO_APPROVER,
} from "./m04-25";

export const M0428_ADMIN: Account = { loginId: "m0428_admin", password: "Passw0rd!M0428" };
const M0428_ADMIN_ACTOR: Actor = { 名前: "M04-28試験管理者", account: M0428_ADMIN };

defineSeed("S-M04-28-STORES", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-M0428-共有A〕", await sharedStoreId(browser, "東京店", seed.シードID));
  notes.set("〔店舗ID-M0428-共有B〕", await sharedStoreId(browser, "大阪店", seed.シードID));
});

defineSeed("S-M04-28-ADM", { needs: ["S-M04-28-STORES"] }, async ({ browser, notes }) => {
  const a = notes.get("〔店舗ID-M0428-共有A〕");
  const b = notes.get("〔店舗ID-M0428-共有B〕");
  await ensureActor(browser, M0428_ADMIN_ACTOR, { 所属店舗ID: a, 編集可能店舗ID: [a, b], email: "m0428_admin@example.test" });
});

// ---------------------------------------------------------------- DATA-001・003〜007

const STD: Record<"3500" | "4500", Goods> = {
  "3500": { 商品コード: "M0428-STD3500", 基準価格: 3500, 販売価格: 3500 },
  "4500": { 商品コード: "M0428-STD4500", 基準価格: 4500, 販売価格: 4500 },
};

/** 東京店・EC-CUBE の在庫が need 点以上あるようにする（足りなければ在庫編集で入庫し、承認者が承認する） */
async function ensureStockByEdit(browser: Browser, seedId: string, tokyo: string, code: string, need: number, approver: Actor): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const read = () => withAdminSession(browser, M0428_ADMIN, async (page) => {
    guard(page);
    const list = await searchStock(page, code, tokyo);
    return stockOf(list.row(code, "東京店", "EC-CUBE"));
  });
  const stock = await read();
  if (stock >= need) return;
  const add = need - stock;
  await withAdminSession(browser, M0428_ADMIN, async (page) => {
    guard(page);
    const list = await searchStock(page, code, tokyo);
    await list.openEdit(list.row(code, "東京店", "EC-CUBE"));
    await registerStockEdit(page, { changeType: "入庫/その他", reason: "M04-28試験用", quantity: String(add), purchasePrice: "100", approverName: approver.名前 },
      `${seedId}: 東京店の ${code} の在庫編集（入庫 ${add}）`, issue);
  });
  await withAdminSession(browser, approver.account, async (page) => {
    guard(page);
    const approvals = await openStockApprovalListForStore(page, tokyo);
    const rows = (await approvals.rowValues()).filter((r) => r.status === "未承認" && r.registrant === M0428_ADMIN_ACTOR.名前
      && r.shop.startsWith("東京店") && r.changeType.endsWith("入庫/その他") && r.quantity === String(add));
    if (rows.length === 0) throw new Error(`${seedId}: 東京店の在庫編集（入庫 ${add}）の未承認の行が在庫編集承認一覧に無い`);
    if (rows.length > 1) issue(`東京店の在庫編集（入庫 ${add}）の未承認の行が${rows.length}件あり、一覧の先頭を承認した`);
    await approvals.approve([rows[0].id], `${seedId}: 東京店の在庫編集の承認`, issue);
  });
  const after = await read();
  if (after < need) throw new Error(`${seedId}: 入庫を承認したあとも東京店の ${code} の在庫が ${after}（${need} 点以上が要る）`);
}

/** 在庫移動指示検索の行がシード表の「…であることを見る」と合うか（違う点を返す） */
const rowCheck = (基準価格合計: number) => (row: InstructionRow): string[] => {
  const diff: string[] = [];
  if (Number(row.基準価格合計.replace(/[¥,\s]/g, "")) !== 基準価格合計) diff.push(`基準価格合計「${row.基準価格合計}」（シード表は ${基準価格合計}）`);
  if (row.送り状No !== "") diff.push(`送状No.「${row.送り状No}」（シード表は空）`);
  if (row.発送状況 !== "未") diff.push(`発送状況「${row.発送状況}」（シード表は「未」）`);
  return diff;
};

/** 基準価格 std の商品を東京店→大阪店へ qty 点移動する在庫移動指示を1件作る（在庫検索一覧から） */
async function stdInstruction(ctx: SeedCtx, std: "3500" | "4500", qty: number, k: string): Promise<void> {
  const { browser, notes, seed } = ctx;
  const seedId = seed.シードID;
  if (!seed.投入方法.includes(`基準価格(円)が${std}の商品を用意する`)) throw new Error(`${seedId}: シード表に「基準価格(円)が${std}の商品」が無い`);
  const tokyo = notes.get("〔店舗ID-M0428-共有A〕");
  const osaka = notes.get("〔店舗ID-M0428-共有B〕");
  const approver = await ensureApprover(browser, TOKYO_APPROVER, tokyo);
  reportSeedIssue(seedId, `基準価格${std}の商品は、商品登録画面が開けないので、グッズ商品CSV登録で商品コード ${STD[std].商品コード} の商品を作って（あれば使って）用意した`);
  await ensureGoods(browser, SETUP_ADMIN, seedId, [STD[std]]);
  await ensureStockByEdit(browser, seedId, tokyo, STD[std].商品コード, qty, approver);
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: tokyo, 店名: "東京店" }, 入庫先: { 店舗ID: osaka }, operator: M0428_ADMIN_ACTOR, approver,
    moves: [{ 方法: "list", 行: [{ 商品コード: STD[std].商品コード, 移動点数: qty }], 呼び名: `〔在庫移動ID-M0428-${k}〕` }],
    呼び名: `〔移動指示ID-M0428-${k}〕`, 確かめる行: rowCheck(Number(std) * qty),
  });
}

const DATA_NEEDS = ["S-M04-28-ADM", "S-M04-28-STORES"];
defineSeed("S-M04-28-DATA-001", { needs: DATA_NEEDS }, (ctx) => stdInstruction(ctx, "3500", 1, "001"));
defineSeed("S-M04-28-DATA-003", { needs: DATA_NEEDS }, (ctx) => stdInstruction(ctx, "3500", 1, "003"));
defineSeed("S-M04-28-DATA-004", { needs: DATA_NEEDS }, (ctx) => stdInstruction(ctx, "3500", 1, "004"));
defineSeed("S-M04-28-DATA-005", { needs: DATA_NEEDS }, (ctx) => stdInstruction(ctx, "3500", 1, "005"));
defineSeed("S-M04-28-DATA-006", { needs: DATA_NEEDS }, (ctx) => stdInstruction(ctx, "3500", 1, "006"));
defineSeed("S-M04-28-DATA-007", { needs: DATA_NEEDS }, async (ctx) => {
  // 在庫移動指示は在庫移動1件ごとに別々に作る（A: 3500×1、B: 3500×2、C: 4500×2）
  await stdInstruction(ctx, "3500", 1, "007A");
  await stdInstruction(ctx, "3500", 2, "007B");
  await stdInstruction(ctx, "4500", 2, "007C");
});

// ---------------------------------------------------------------- DP-DATA-009

defineSeed("S-M04-28-DP-DATA-009", { needs: DATA_NEEDS }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const tokyo = notes.get("〔店舗ID-M0428-共有A〕");
  const osaka = notes.get("〔店舗ID-M0428-共有B〕");
  const goods: Goods[] = [
    { 商品コード: "M0428-009-G1", 基準価格: 3500, 販売価格: 3500 },
    { 商品コード: "M0428-009-G2", 基準価格: 1200, 販売価格: 1200 },
    { 商品コード: "M0428-009-G3", 基準価格: 800, 販売価格: 800 },
    { 商品コード: "M0428-009-G4", 基準価格: 2500, 販売価格: 2500 },
  ];
  for (const g of goods) if (!seed.投入方法.includes(`「${g.商品コード}」は基準価格${g.基準価格}`)) throw new Error(`${seed.シードID}: シード表の ${g.商品コード} の基準価格がテストの値と違う`);
  const approver = await ensureApprover(browser, TOKYO_APPROVER, tokyo);
  await ensureGoods(browser, M0428_ADMIN, seed.シードID, goods);
  await stockInByCsv(browser, seed.シードID, { registrant: M0428_ADMIN_ACTOR, approver, 店舗ID: tokyo, 店名: "東京店", 行: goods.map((g) => ({ 商品コード: g.商品コード, 在庫増減数: 1, 仕入単価: 100 })) });
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: tokyo, 店名: "東京店" }, 入庫先: { 店舗ID: osaka }, operator: M0428_ADMIN_ACTOR, approver,
    moves: [
      { 方法: "csv", 行: [{ 商品コード: goods[0].商品コード, 移動点数: 1 }, { 商品コード: goods[1].商品コード, 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0428-009A〕" },
      { 方法: "csv", 行: [{ 商品コード: goods[2].商品コード, 移動点数: 1 }, { 商品コード: goods[3].商品コード, 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0428-009B〕" },
    ],
    呼び名: "〔移動指示ID-M0428-009〕",
  });
});

// ---------------------------------------------------------------- 010・011（店舗を足すケース）

const STORE_010: ThresholdStoreInput = {
  店名: "元店M0428-010", 店名カナ: "モトテン", 店名英語: "Mototen", 支店URL: "m0428moto010", 店名略称3文字: "Q8M", ショップ名略称: "元店M0428-010",
  会社名: "株式会社M0428-010", 会社名カナ: "カブシキガイシャテスト", 郵便番号: "1600023", 都道府県: "東京都",
  住所1: "新宿区西新宿M0428-010", 住所2: "", 電話番号: "0355550100", 高額商品閾値: ["", "", ""],
};
const STORE_011: ThresholdStoreInput = {
  店名: "先店M0428-011", 店名カナ: "サキテン", 店名英語: "Sakiten", 支店URL: "m0428saki011", 店名略称3文字: "Q8S", ショップ名略称: "先店M0428-011",
  会社名: "株式会社M0428-011", 会社名カナ: "カブシキガイシャサキ", 郵便番号: "4600001", 都道府県: "愛知県",
  住所1: "名古屋市中区M0428-011", 住所2: "", 電話番号: "0525550110", 高額商品閾値: ["", "", ""],
};
export const M0428_010_A: Actor = { 名前: "m0428-010-a", account: { loginId: "m0428-010-a", password: "Passw0rd-M0428010" } };
const M0428_010_B: Actor = { 名前: "m0428-010-b", account: { loginId: "m0428-010-b", password: "Passw0rd-M0428010" } };
export const M0428_011_A: Actor = { 名前: "m0428-011-a", account: { loginId: "m0428-011-a", password: "Passw0rd-M0428011" } };
const M0428_011_B: Actor = { 名前: "m0428-011-b", account: { loginId: "m0428-011-b", password: "Passw0rd-M0428011" } };

defineSeed("S-M04-28-DP-STORE-010", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-M0428-010〕", await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStoreWithThresholds(page, STORE_010, (m) => reportSeedIssue(seed.シードID, m))));
});
defineSeed("S-M04-28-DP-STORE-011", async ({ browser, notes, seed }) => {
  notes.set("〔店舗ID-M0428-011〕", await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStoreWithThresholds(page, STORE_011, (m) => reportSeedIssue(seed.シードID, m))));
});

defineSeed("S-M04-28-DP-MEMBER-010", { needs: ["S-M04-28-DP-STORE-010", "S-M04-28-STORES"] }, async ({ browser, notes }) => {
  const s = notes.get("〔店舗ID-M0428-010〕");
  const b = notes.get("〔店舗ID-M0428-共有B〕");
  await ensureActor(browser, M0428_010_A, { 所属店舗ID: s, 編集可能店舗ID: [s, b], email: "dpm0428-010-a@example.test" });
  await ensureActor(browser, M0428_010_B, { 所属店舗ID: s, 編集可能店舗ID: [s], email: "dpm0428-010-b@example.test" });
});
defineSeed("S-M04-28-DP-MEMBER-011", { needs: ["S-M04-28-DP-STORE-011", "S-M04-28-STORES"] }, async ({ browser, notes }) => {
  const s = notes.get("〔店舗ID-M0428-011〕");
  const a = notes.get("〔店舗ID-M0428-共有A〕");
  await ensureActor(browser, M0428_011_A, { 所属店舗ID: a, 編集可能店舗ID: [s, a], email: "dpm0428-011-a@example.test" });
  await ensureActor(browser, M0428_011_B, { 所属店舗ID: a, 編集可能店舗ID: [a], email: "dpm0428-011-b@example.test" });
});

defineSeed("S-M04-28-DP-DATA-010", { needs: ["S-M04-28-DP-MEMBER-010", "S-M04-28-DP-STORE-010", "S-M04-28-STORES"] }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const from = notes.get("〔店舗ID-M0428-010〕");
  const to = notes.get("〔店舗ID-M0428-共有B〕");
  const g: Goods = { 商品コード: "M0428-010-G1", 基準価格: 3500, 販売価格: 3500 };
  if (!seed.投入方法.includes("商品コード「M0428-010-G1」・基準価格3500")) throw new Error(`${seed.シードID}: シード表の商品・基準価格がテストの値と違う`);
  await ensureGoods(browser, M0428_010_A.account, seed.シードID, [g]);
  await stockInByCsv(browser, seed.シードID, { registrant: M0428_010_A, approver: M0428_010_B, 店舗ID: from, 店名: STORE_010.店名, 行: [{ 商品コード: g.商品コード, 在庫増減数: 1, 仕入単価: 100 }] });
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: from, 店名: STORE_010.店名 }, 入庫先: { 店舗ID: to }, operator: M0428_010_A, approver: M0428_010_B,
    moves: [{ 方法: "csv", 行: [{ 商品コード: g.商品コード, 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0428-010〕" }],
    呼び名: "〔移動指示ID-M0428-010〕",
  });
});

defineSeed("S-M04-28-DP-DATA-011", { needs: ["S-M04-28-DP-MEMBER-011", "S-M04-28-DP-STORE-011", "S-M04-28-STORES"] }, async (ctx) => {
  const { browser, notes, seed } = ctx;
  const from = notes.get("〔店舗ID-M0428-共有A〕");
  const to = notes.get("〔店舗ID-M0428-011〕");
  const g: Goods = { 商品コード: "M0428-011-G1", 基準価格: 3500, 販売価格: 3500 };
  if (!seed.投入方法.includes("商品コード「M0428-011-G1」・基準価格3500")) throw new Error(`${seed.シードID}: シード表の商品・基準価格がテストの値と違う`);
  await ensureGoods(browser, M0428_011_A.account, seed.シードID, [g]);
  await stockInByCsv(browser, seed.シードID, { registrant: M0428_011_A, approver: M0428_011_B, 店舗ID: from, 店名: "東京店", 行: [{ 商品コード: g.商品コード, 在庫増減数: 1, 仕入単価: 100 }] });
  await buildInstruction(ctx, {
    出庫元: { 店舗ID: from, 店名: "東京店" }, 入庫先: { 店舗ID: to }, operator: M0428_011_A, approver: M0428_011_B,
    moves: [{ 方法: "csv", 行: [{ 商品コード: g.商品コード, 移動点数: 1 }], 呼び名: "〔在庫移動ID-M0428-011〕" }],
    呼び名: "〔移動指示ID-M0428-011〕",
  });
});
