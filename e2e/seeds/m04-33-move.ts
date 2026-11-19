/**
 * M04-33・M04-34 のシード専用の「在庫移動指示づくり」（seeds/m04-25.ts の buildInstruction を速くした写し・2026-11-20）。
 *
 * なぜ別にしたか: 開発環境の在庫移動・振替検索一覧は、開くのも検索を押すのも1回 65〜80 秒かかる。
 *   buildInstruction は在庫移動1件ごとに一覧を開き直して検索し（ステータスの確かめ・行のリンクを開く・移動指示リストIDの確かめ）、
 *   在庫移動1件ごとにログインし直すので、M04-33 の1件のシードが 12〜30 分かかり、30 分の時間切れに当たっていた（11/19 夜）。
 *   buildInstruction は M04-25・M04-28 も使うので、そちらの動き（とテストの指紋）を変えないよう、M04-33・34 からだけ呼ぶ写しにした。
 *
 * 変えたところ（作るもの・画面の操作の順は同じ）:
 * - 在庫移動の登録と承認申請は、操作する管理者の1回のログインでまとめて行う（在庫移動ごとにログインし直さない）。
 * - ステータス・移動指示リストIDの確かめは、DB を読んで行う（読むだけ。一覧を開き直さない）。
 * - 出庫承認の画面は、一覧で1件目の行のリンク先を読み、同じ形のリンク先を在庫移動・振替IDだけ替えて開く。
 * - 入庫・備考・在庫移動指示検索の行の確かめ（M04-33・34 は使わない）は扱わない。指定されたら止める。
 */
import { expect } from "@playwright/test";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl, withAdminSession } from "../lib/session";
import { selectAllStoresIfEmpty } from "../lib/required_stores";
import { 在庫移動振替 } from "../db/m04_09_move";
import { approveOutbound, MoveTransferListPage, registerMove, requestOutboundApproval, searchStock } from "../pages/admin/m04_24_stock_move";
import { expectSaved } from "../pages/admin/common";
import { registerMoveByCsv, searchInstructionById, searchInstructionByMoveId } from "../pages/admin/m04_25_move_chain";
import { guard, InstructionSpec } from "./m04-25";

/** DB で在庫移動のステータスを確かめる（画面の一覧のステータスの列と同じマスタの名前） */
function expectMoveStatusDb(id: string, want: string, what: string): void {
  const m = 在庫移動振替(id);
  if (!m) throw new Error(`${what}: 在庫移動 ${id} が DB に無い`);
  if (m.ステータス.trim() !== want) throw new Error(`${what}: 在庫移動 ${id} のステータスが「${m.ステータス}」（${want}のはず）`);
}

/** 在庫移動・振替検索一覧で1件を ID で検索し、その行のリンク先（出庫承認の画面など）を読む */
async function linkOf(moves: MoveTransferListPage, id: string): Promise<string> {
  await moves.searchById(id);
  const link = moves.row(id).locator("td").nth(1).locator(":scope > span").first().getByRole("link", { name: id, exact: true });
  await expect(link, `在庫移動・振替ID ${id} のリンク`).toHaveCount(1);
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`在庫移動・振替ID ${id} のリンク先が無い`);
  return new URL(href, moves.page.url()).toString();
}

/** 在庫移動を登録して出庫承認まで進め、在庫移動指示を作って控え、送り状No.を登録する（M04-33・34 のシードの形だけ） */
export async function buildInstructionFast({ browser, notes, seed }: SeedCtx, spec: InstructionSpec): Promise<string> {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  if (spec.入庫 || spec.備考 !== undefined || spec.確かめる行) throw new Error(`${seedId}: buildInstructionFast は入庫・備考・行の確かめを扱わない（seeds/m04-25.ts の buildInstruction を使う）`);
  const fromId = spec.出庫元.店舗ID;
  const toId = spec.入庫先.店舗ID;

  // 在庫移動の登録と承認申請（操作する管理者の1回のログインで）
  const moveIds = await withAdminSession(browser, spec.operator.account, async (page) => {
    guard(page);
    const ids: string[] = [];
    for (const [i, m] of spec.moves.entries()) {
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
      ids.push(moveId);
    }
    return ids;
  });
  for (const id of moveIds) expectMoveStatusDb(id, "出庫承認待ち", `${seedId}: 承認申請のあと`);

  // 出庫承認（承認する管理者の1回のログインで。出庫承認の画面は、1件目の行のリンク先と同じ形で開く）
  await withAdminSession(browser, spec.approver.account, async (page) => {
    guard(page);
    const moves = new MoveTransferListPage(page);
    const first = await linkOf(moves, moveIds[0]);
    if (!first.includes(`/${moveIds[0]}`)) throw new Error(`${seedId}: 在庫移動 ${moveIds[0]} の行のリンク先に ID が無い（${first}）`);
    for (const id of moveIds) {
      await page.goto(first.replace(new RegExp(`/${moveIds[0]}(?=$|[/?#])`), `/${id}`));
      await page.waitForLoadState("load");
      await approveOutbound(page, id, `${seedId}: 在庫移動 ${id} の出庫承認`);
    }
  });
  for (const id of moveIds) expectMoveStatusDb(id, "出庫承認済み", `${seedId}: 出庫承認のあと`);
  issue("シードの在庫移動のステータス・移動指示リストIDの確かめは、在庫移動・振替検索一覧を開き直さず DB を読んで行った（開発環境の一覧は1回 65〜80 秒かかり、シードが時間切れになっていたため）");

  // 在庫移動・振替IDを控え、在庫移動指示を作り、在庫移動指示検索で在庫移動指示IDを控える（操作する管理者の1回のログインで）
  return withAdminSession(browser, spec.operator.account, async (page) => {
    guard(page);
    const moves = new MoveTransferListPage(page);
    for (const [i, id] of moveIds.entries()) notes.set(spec.moves[i].呼び名, id);
    if (moveIds.length === 1) {
      await moves.searchById(moveIds[0]);
    } else {
      // 複数の在庫移動を1つの在庫移動指示にまとめる: 出庫元店舗で検索し、一覧に全部の行があることを確かめて選ぶ（buildInstruction と同じ）
      await page.goto(adminUrl("/product/stock/move_transfer"));
      await page.waitForLoadState("load");
      const from = page.locator("#admin_search_stock_move_transfer_move_from_base_info");
      await expect(from.locator(`option[value="${fromId}"]`), `${seedId}: 在庫移動・振替検索一覧の出庫元店舗に店舗ID ${fromId}`).toHaveCount(1);
      await from.evaluate((n, v) => {
        const sel = n as HTMLSelectElement;
        for (const o of Array.from(sel.options)) o.selected = o.value === v;
        const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
        if (w.jQuery) w.jQuery(sel).trigger("change"); else sel.dispatchEvent(new Event("change", { bubbles: true }));
      }, fromId);
      await selectAllStoresIfEmpty(moves.form, ["admin_search_stock_move_transfer_move_to_base_info"], "在庫移動・振替検索一覧");
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), moves.form.locator('button[type="submit"]').first().click()]);
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
      const got = 在庫移動振替(id)?.移動指示ID ?? "";
      if (got !== iid) throw new Error(`${seedId}: 在庫移動 ${id} の移動指示リストIDが「${got}」（在庫移動指示検索では ${iid}）`);
    }
    notes.set(spec.呼び名, iid);
    if (spec.送り状No) {
      const s = await searchInstructionById(page, { 出庫元店舗ID: fromId, 入庫先店舗ID: toId, 在庫移動指示ID: iid });
      await s.pressTrackingRegister(iid);
      await expect(s.送り状No登録モーダル, `${seedId}: 送り状No.登録モーダル`).toBeVisible();
      const t = await s.submitTracking(iid, spec.送り状No);
      if (!t.sent) throw new Error(`${seedId}: 送り状No.の登録が、ブラウザの入力チェックで止まった: ${t.止めた項目.join(" / ")}`);
      await expectSaved(page, `${seedId}: 在庫移動指示 ${iid} の送り状No.「${spec.送り状No}」の登録`);
      for (const id of moveIds) expectMoveStatusDb(id, "移動中", `${seedId}: 送り状No.の登録のあと`);
    }
    return iid;
  });
}

