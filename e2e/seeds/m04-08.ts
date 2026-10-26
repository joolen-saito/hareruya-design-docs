/**
 * M04-08 在庫移動・振替検索一覧 の画面シード。正本: cases/M04-08_seed_data.tsv
 *
 * 作り方は M04-09 のシード（seeds/m04-09.ts の runScenario）と同じ画面操作で、在庫移動・在庫振替を画面から登録する。
 * 管理者「M04-09作業者」「M04-09承認者」「M04-09入庫担当者」と試験店舗A・B・試験所属A・B は M04-09 のシードと同じものを使う
 * （M04-08 のシード表の S-M04-08-OP-A は M04-09 の S-M04-09-OP-A と同じログインID・パスワード）。
 *
 * 正本の外で補ったもの（記録 e2e/review/M04-08_progress_2026-10-21.md の「注記」）:
 * - 商品と在庫: シード表は「店舗・在庫区分に在庫数1以上の商品在庫を1件選択する」とし、商品と在庫の作り方を書かない。
 *   試験店舗A・B には在庫が無いので、実行のたびに新しい商品コードの商品をグッズ商品CSV登録で作り、在庫編集で入庫して承認する
 *   （M04-09 のシードと同じ値: 基準価格1000・入庫10点・仕入単価100）。
 * - 承認する管理者「M04-09承認者」: M04-08 のシード表に作り方が無いので、M04-09 のシード表（S-M04-09-APP-A）のとおりに作る。
 * - 第三の店舗（S-M04-08-INSTRUCTION-INVALID-010）: 「入庫先店舗の選択肢にある任意の1店舗」を、在庫検索一覧の店舗の選択肢
 *   （開店中の店舗）のうち、試験店舗A・B 以外で店名が重ならない先頭の店舗にする。
 */
import { Page } from "@playwright/test";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl } from "../lib/session";
import { 所属B, 入庫担当者名, 在庫区分, 店A, 店B } from "../pages/admin/m04_09_move";
import { ensureApprover, ensureOperator, ensureReceiver, M0409_OP, Op, runScenario, session } from "./m04-09";

const RUN = Date.now().toString(36).toUpperCase();
const code = (n: string, k: number) => `M0408X${n}-${RUN}-${k}`;

defineSeed("S-M04-08-OP-A", async ({ browser, seed }) => { await ensureOperator(browser, seed.シードID); });

/** 補った商品（グッズ商品CSV）と入庫（在庫編集と承認） */
function goods(n: string, ins: { k: number; store: typeof 店A | typeof 店B; zone: 在庫区分 }[]): Op[] {
  const ks = [...new Set(ins.map((i) => i.k))];
  return [
    { op: "goods", items: ks.map((k) => ({ code: code(n, k) })), free: true },
    { op: "in", items: ins.map((i) => ({ code: code(n, i.k), store: i.store, zone: i.zone, qty: 10, unit: 100 })), free: true },
  ];
}

async function run(ctx: SeedCtx, ops: Op[], receiver = false): Promise<void> {
  await ensureOperator(ctx.browser, "S-M04-08-OP-A");
  await ensureApprover(ctx.browser, "S-M04-09-APP-A");
  if (receiver) await ensureReceiver(ctx.browser, "S-M04-09-APP-B");
  reportSeedIssue(ctx.seed.シードID, "シード表に商品と在庫の作り方が無いので、新しい商品コードの商品をグッズ商品CSV登録で作り、入庫して承認した（正本の外の補い）");
  await runScenario(ctx, ops);
}

const EC = "EC-CUBE" as const;
const SM = "スマレジ" as const;

defineSeed("S-M04-08-OUTPUT", { needs: ["S-M04-08-OP-A"] }, async (ctx) => {
  await run(ctx, [
    ...goods("OUT", [{ k: 1, store: 店A, zone: EC }, { k: 2, store: 店A, zone: EC }, { k: 1, store: 店A, zone: SM }]),
    {
      op: "move", label: "〔在庫移動・振替ID-M0408-共有出力A〕", from: { store: 店A, zone: EC }, to: { store: 店A, zone: SM }, lines: [{ code: code("OUT", 1), qty: 1 }], until: "instore",
      mention: ["〔在庫移動・振替ID-M0408-共有出力A〕", "入庫先店舗に試験店舗A、入庫先在庫区分にスマレジ、移動点数に1", "店舗内入庫確定ボタンを押し"],
    },
    {
      op: "transfer", label: "〔在庫移動・振替ID-M0408-共有出力B〕", store: 店A, zone: EC, lines: [{ code: code("OUT", 1), dest: code("OUT", 2), qty: 1 }], until: "wait",
      mention: ["〔在庫移動・振替ID-M0408-共有出力B〕", "振替点数に1を入れ"],
    },
    {
      op: "move", label: "〔在庫移動・振替ID-M0408-共有出力C〕", from: { store: 店A, zone: SM }, to: { store: 店A, zone: EC }, lines: [{ code: code("OUT", 1), qty: 1 }], until: "new",
      mention: ["〔在庫移動・振替ID-M0408-共有出力C〕", "入庫先店舗に試験店舗A、入庫先在庫区分にEC-CUBE、移動点数に1"],
    },
  ]);
});

defineSeed("S-M04-08-INSTRUCTION-VALID-009", { needs: ["S-M04-08-OP-A"] }, async (ctx) => {
  const m = (label: string) => ["〔在庫移動・振替ID-M0408-" + label + "〕", "入庫先店舗に試験店舗B、入庫先在庫区分にEC-CUBE、移動点数に1"];
  await run(ctx, [
    ...goods("009", [{ k: 1, store: 店A, zone: EC }, { k: 1, store: 店A, zone: SM }]),
    { op: "move", label: "〔在庫移動・振替ID-M0408-009A〕", from: { store: 店A, zone: EC }, to: { store: 店B, zone: EC }, lines: [{ code: code("009", 1), qty: 1 }], until: "outapproved", mention: m("009A") },
    { op: "move", label: "〔在庫移動・振替ID-M0408-009B〕", from: { store: 店A, zone: SM }, to: { store: 店B, zone: EC }, lines: [{ code: code("009", 1), qty: 1 }], until: "outapproved", mention: m("009B") },
  ]);
});

/** 在庫検索一覧の店舗の選択肢（開店中の店舗）のうち、試験店舗A・B 以外で店名が重ならない先頭の店舗 */
async function thirdStore(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/stock"));
  const names = (await page.locator("#admin_search_stock_list_base_info option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  const hit = names.find((n) => n !== 店A && n !== 店B && names.filter((x) => x === n).length === 1);
  if (!hit) throw new Error("在庫検索一覧の店舗の選択肢に、試験店舗A・B 以外で店名が重ならない店舗が無い");
  return hit;
}

defineSeed("S-M04-08-INSTRUCTION-INVALID-010", { needs: ["S-M04-08-OP-A"] }, async (ctx) => {
  const third = await session(ctx.browser, M0409_OP, thirdStore);
  reportSeedIssue(ctx.seed.シードID, `第三の店舗は「${third}」（在庫検索一覧の店舗の選択肢のうち、試験店舗A・B 以外で店名が重ならない先頭の店舗）`);
  const A = { store: 店A, zone: EC } as const;
  const B = { store: 店B, zone: EC } as const;
  const c = code("010", 1);
  const label = (x: string) => `〔在庫移動・振替ID-M0408-010${x}〕`;
  await run(ctx, [
    ...goods("010", [{ k: 1, store: 店A, zone: EC }, { k: 2, store: 店A, zone: EC }, { k: 1, store: 店B, zone: EC }]),
    { op: "transfer", label: label("A"), store: 店A, zone: EC, lines: [{ code: c, dest: code("010", 2), qty: 1 }], until: "wait", mention: [label("A"), "振替点数に1を入れ"] },
    { op: "move", label: label("B"), from: A, to: { store: third, zone: EC }, lines: [{ code: c, qty: 1 }], until: "outapproved", mention: [label("B"), "入庫先店舗に第三の店舗"] },
    // 試験店舗Bの在庫編集権限を持つ管理者（M04-09承認者）が登録し、試験店舗Bに所属し承認権限を持つ別の管理者（M04-09入庫担当者）が承認する
    {
      op: "move", label: label("C"), from: B, to: { store: third, zone: EC }, lines: [{ code: c, qty: 1 }], until: "outapproved", by: "承認者",
      notify: { 所属: 所属B, メンバー: 入庫担当者名 }, approver: "入庫担当者", mention: [label("C"), "試験店舗Bに所属し承認権限を持つ、登録者と別の管理者"],
    },
    { op: "move", label: label("D"), from: A, to: B, lines: [{ code: c, qty: 1 }], until: "outapproved", mention: [label("D")] },
    { op: "move", label: label("E"), from: A, to: { store: third, zone: EC }, lines: [{ code: c, qty: 1 }], until: "outapproved", mention: [label("E")] },
    { op: "move", label: label("F"), from: A, to: B, lines: [{ code: c, qty: 1 }], until: "outwait", mention: [label("F")] },
    { op: "move", label: label("G"), from: A, to: B, lines: [{ code: c, qty: 1 }], until: "outapproved", mention: [label("G")] },
    { op: "instruction", label: label("G") },
  ], true);
});
