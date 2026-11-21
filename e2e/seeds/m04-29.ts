/**
 * M04-29 在庫移動実績 インポートの画面シード。正本: cases/M04-29_seed_data.tsv
 * 実装するケースは 001・002・003・007（流せる見込みの4件）。
 *
 * 店舗の読み替え（正本の外の補い。依頼者決定 2026-11-13「店舗は作らない。2店は試験支店と本店」）:
 * - シード表の「M0429RD店舗A／B」「FGM0429店舗A／B」は、店舗を作らず、出庫元＝本店（店舗ID 1）・入庫先＝試験支店（店舗ID 1574）に読み替える。
 *   店舗・所属を作るシード（RD-STORES・FGSTORES）は何も作らず、2店があることだけを確かめる。所属（店舗に属する所属A）はDBで直接設定する作り方なので作らない。
 *   承認通知先の所属は、承認者が所属している所属をそのまま使う（在庫編集・出庫承認申請の部品が、承認者のいる所属を探して選ぶ）。
 * - 作業者・承認者（RD-OP・FGOP・RD-APR・FGAPR）は、権限の細かい作り（承認権限の有無だけが違う権限グループ）を作らず、
 *   M04-33・34 と同じく、本店・試験支店を編集できるシステム管理者を決まった名前で作る（作業者と承認者の2人。承認は登録者と別の人が行う）。
 *   ログインID・パスワードはシード表の値でなく、決まった印を付けた名前（ケースの手順1・2のログインIDも同じものを使う）。
 * - 商品はグッズ商品CSV登録で作る（商品コード・商品名には実行の印を付ける）。商品規格の公開ステータスを画面で変える手順は、取込の規格が公開で作られるので行わない。
 * - 在庫は、本店・EC-CUBEに在庫変更CSV登録（仕入単価100）で入庫して別のメンバーが承認する（在庫編集画面からの入庫と同じ在庫・原価になる）。
 * - 在庫移動は、在庫検索一覧からでなく在庫移動CSV登録で登録し（M04-33・34 と同じ部品）、承認申請・出庫承認・在庫移動指示作成を行う。送り状No.は登録しない。
 * - 取込ファイル（rd-result-001.csv など）は、実行のたびに e2e/.state/m04-29/<ケース番号>/ に作る（UTF-8・カンマ区切り・LF）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 範囲内に存在する在庫移動指示 } from "../db/m04_29";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ensureActorWithStores } from "../pages/admin/m04_33_actor";
import { 入庫して承認する } from "../pages/admin/m04_33_stock_in";
import { 試験支店の店舗ID } from "../pages/admin/reuse_store";
import { 試験支店ID } from "../pages/admin/test_store";
import { Actor } from "./m04-25";
import { buildInstructionFast } from "./m04-33-move";

const 出庫元 = "1";
const 入庫先 = 試験支店ID;

/** 在庫を登録する作業者と、承認する承認者（どちらも決まった印の名前で1度だけ作って使い回す） */
export const M0429_OP: Actor = { 名前: rcFixed("M04-29作業者"), account: { loginId: rcFixed("m0429_op").toLowerCase(), password: "Passw0rd!M0429op" } };
const M0429_APR: Actor = { 名前: rcFixed("M04-29承認者"), account: { loginId: rcFixed("m0429_apr").toLowerCase(), password: "Passw0rd!M0429apr" } };

const RUNTIME_DIR = path.join(STATE_DIR, "m04-29");
/** ケースが選ぶ取込ファイルの場所（シードが実行のたびに作る） */
export function m0429FilePath(caseNo: string, file: string): string {
  return path.join(RUNTIME_DIR, caseNo, file);
}
function writeCsv(caseNo: string, file: string, rows: string[][]): void {
  const dir = path.join(RUNTIME_DIR, caseNo);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), rows.map((r) => r.join(",")).join("\n") + "\n", "utf-8");
}

// ---- 店舗・管理者 ----
for (const id of ["S-M04-29-RD-STORES", "S-M04-29-FGSTORES"]) {
  defineSeed(id, async ({ seed }) => {
    if (試験支店の店舗ID() !== 入庫先) throw new Error(`入庫先（店舗ID ${入庫先}）が使い回す試験支店でない`);
    reportSeedIssue(seed.シードID, "店舗・所属は作らず、出庫元＝本店（店舗ID 1）・入庫先＝試験支店（店舗ID 1574）に読み替えた（依頼者決定 2026-11-13）。所属が属する店舗を DB で設定する作り方は行わない");
  });
}
let 管理者あり = false;
async function 管理者を用意する(browser: Browser): Promise<void> {
  if (管理者あり) return;
  for (const a of [M0429_OP, M0429_APR]) {
    await ensureActorWithStores(browser, a, { 所属店舗ID: 出庫元, 編集可能店舗ID: [出庫元, 入庫先], email: `${a.account.loginId}@example.test` });
  }
  管理者あり = true;
}
for (const id of ["S-M04-29-RD-OP", "S-M04-29-FGOP"]) {
  defineSeed(id, { needs: [id.replace(/OP$/, "STORES")] }, async ({ browser, seed }) => {
    await 管理者を用意する(browser);
    reportSeedIssue(seed.シードID, "作業者は、本店・試験支店を編集できるシステム管理者を決まった名前で作った（承認権限なしの権限グループは作らない。承認は別の承認者が行う）");
  });
}
for (const id of ["S-M04-29-RD-APR", "S-M04-29-FGAPR"]) {
  defineSeed(id, { needs: [id.replace(/APR$/, "STORES")] }, async ({ browser, seed }) => {
    await 管理者を用意する(browser);
    reportSeedIssue(seed.シードID, "承認者は、本店・試験支店を編集できるシステム管理者を決まった名前で作った");
  });
}

// ---- 商品・在庫・在庫移動指示 ----
type 移動 = { 呼び名の英字: string; 在庫移動の呼び名: string; 指示の呼び名: string };

/** 商品を1件作って本店に在庫10を入れ、在庫移動（本店→試験支店・移動点数3）ごとに在庫移動指示を作って控える。送り状No.は登録しない */
async function 在庫移動指示を作る(ctx: SeedCtx, v: { 商品コード: string; 商品名: string; 移動: 移動[] }): Promise<Map<string, { 在庫移動ID: string; 指示ID: string }>> {
  const { browser, seed } = ctx;
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理者を用意する(browser);
  const code = rc(v.商品コード);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(90_000);
    const categoryId = await readGoodsRootCategoryId(page);
    const template = await downloadGoodsCsvTemplate(page);
    const zeros = Object.fromEntries(template.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { ...zeros, "基準価格": "1000", "販売価格": "1000", "買取価格": "100", "原価単価": "10" },
      lines: [{ code, nameJp: rc(v.商品名), nameEn: `${rc(v.商品名)}-EN` }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
  });
  const 店名 = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, 出庫元));
  await 入庫して承認する(browser, seedId, { registrant: M0429_OP, approver: M0429_APR, 店舗ID: 出庫元, 店名, 行: [{ 商品コード: code, 在庫増減数: 10, 仕入単価: 100 }] });
  const out = new Map<string, { 在庫移動ID: string; 指示ID: string }>();
  for (const m of v.移動) {
    const local = new Notes();
    await buildInstructionFast({ browser, notes: local, seed }, {
      出庫元: { 店舗ID: 出庫元, 店名 }, 入庫先: { 店舗ID: 入庫先 }, operator: M0429_OP, approver: M0429_APR,
      moves: [{ 方法: "csv", 行: [{ 商品コード: code, 移動点数: 3 }], 呼び名: "〔在庫移動〕" }],
      呼び名: "〔在庫移動指示〕",
    });
    out.set(m.呼び名の英字, { 在庫移動ID: local.get("〔在庫移動〕"), 指示ID: local.get("〔在庫移動指示〕") });
  }
  issue("商品・在庫・在庫移動は、店舗を本店・試験支店に読み替え、在庫は在庫変更CSV登録、在庫移動は在庫移動CSV登録で作った（正本の外の補い）");
  return out;
}

defineSeed("S-M04-29-RD-MOVE-001", { needs: ["S-M04-29-RD-OP", "S-M04-29-RD-STORES", "S-M04-29-RD-APR"] }, async (ctx) => {
  const r = await 在庫移動指示を作る(ctx, { 商品コード: "M0429RD-001", 商品名: "M0429RD移動商品001", 移動: [{ 呼び名の英字: "RD", 在庫移動の呼び名: "〔在庫移動ID-M0429-RD001〕", 指示の呼び名: "〔在庫移動指示ID-M0429-RD001〕" }] });
  const x = r.get("RD")!;
  ctx.notes.set("〔在庫移動ID-M0429-RD001〕", x.在庫移動ID);
  ctx.notes.set("〔在庫移動指示ID-M0429-RD001〕", x.指示ID);
  writeCsv("001", "rd-result-001.csv", [["移動指示ID", "送り状No."], [x.指示ID, "M0429RD-TRK-001"]]);
});

defineSeed("S-M04-29-FGMULTI-002", { needs: ["S-M04-29-FGOP", "S-M04-29-FGSTORES", "S-M04-29-FGAPR"] }, async (ctx) => {
  const r = await 在庫移動指示を作る(ctx, {
    商品コード: "M0429-FG002-P", 商品名: "M0429FG002移動商品",
    移動: [{ 呼び名の英字: "P", 在庫移動の呼び名: "〔在庫移動ID-M0429-002P〕", 指示の呼び名: "〔在庫移動指示ID-M0429-002P〕" }, { 呼び名の英字: "Q", 在庫移動の呼び名: "〔在庫移動ID-M0429-002Q〕", 指示の呼び名: "〔在庫移動指示ID-M0429-002Q〕" }],
  });
  const p = r.get("P")!, q = r.get("Q")!;
  ctx.notes.set("〔在庫移動ID-M0429-002P〕", p.在庫移動ID);
  ctx.notes.set("〔在庫移動指示ID-M0429-002P〕", p.指示ID);
  ctx.notes.set("〔在庫移動ID-M0429-002Q〕", q.在庫移動ID);
  ctx.notes.set("〔在庫移動指示ID-M0429-002Q〕", q.指示ID);
  writeCsv("002", "fg002-result.csv", [["移動指示ID", "送り状No."], [p.指示ID, "M0429FG002-TRK-A"], [q.指示ID, "M0429FG002-TRK-B"]]);
});

defineSeed("S-M04-29-FGCOMMA-007", { needs: ["S-M04-29-FGOP", "S-M04-29-FGSTORES", "S-M04-29-FGAPR"] }, async (ctx) => {
  const r = await 在庫移動指示を作る(ctx, { 商品コード: "M0429-FG007-P", 商品名: "M0429FG007移動商品", 移動: [{ 呼び名の英字: "P", 在庫移動の呼び名: "〔在庫移動ID-M0429-007P〕", 指示の呼び名: "〔在庫移動指示ID-M0429-007P〕" }] });
  const x = r.get("P")!;
  ctx.notes.set("〔在庫移動ID-M0429-007P〕", x.在庫移動ID);
  ctx.notes.set("〔在庫移動指示ID-M0429-007P〕", x.指示ID);
  // 2行目: 移動指示IDのあとに、二重引用符で囲んだ送り状No.（カンマを含む）
  writeCsv("007", "fg007-multi-trk.csv", [["移動指示ID", "送り状No."], [x.指示ID, '"M0429FG007-TRK-A,M0429FG007-TRK-B"']]);
});

defineSeed("S-M04-29-FGCAP-003", { needs: ["S-M04-29-FGOP", "S-M04-29-FGSTORES", "S-M04-29-FGAPR"] }, async ({ seed }) => {
  const 在る = 範囲内に存在する在庫移動指示(42900301, 42900321);
  if (在る.length) throw new Error(`${seed.シードID}: 在庫移動指示ID 42900301〜42900321 に存在するものがある（${在る.join("・")}）。21件ともどれも存在しないはず`);
  const rows: string[][] = [["移動指示ID", "送り状No."]];
  for (let i = 42900301; i <= 42900321; i++) rows.push([String(i), "M0429FG003-TRK"]);
  writeCsv("003", "fg003-cap.csv", rows);
  reportSeedIssue(seed.シードID, "在庫移動指示ID 42900301〜42900321 がどれも存在しないことは、在庫移動指示検索で1件ずつ検索する代わりに、DB を参照して確かめた");
});
