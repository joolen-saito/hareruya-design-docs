/**
 * M04-31 棚卸計画。正本: cases/M04-31_test_cases.tsv
 *
 * 画面だけで準備できるケース（使用シードに「DBへ直接設定」を含まないもの）のうち、次を実装した（記録 review/M04-31_progress_2026-10-22.md）。
 * - 一覧・新規作成: 007・019・021〜029・031・163・164
 * - 棚卸結果の在庫反映が他機能に届くこと（RC-*）: 160〜162
 * 実装しないもの:
 * - 020: 前提「営業中の店舗は店舗Aと店舗Bの2件だけ」を手元のDBで作れない（開店中の店舗が50店ほどある）。期待結果はこの前提に依る。
 * - 152: 公開側のブラウザ環境 S-M04-31-QE-ENV（ユニサーチ試験環境へ接続できる）が要る（外部サービス。M04-02 の062〜068 と同じ扱い）。
 * - そのほか: 使用シードがDBへ直接設定する。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 棚卸計画一覧の新規作成画面へのボタンの文言は「新規登録」（設計書 L0042 は「新規作成」）。正本の「新規作成ボタン」はこのボタンとして押し、注記に残す。
 * - 新規作成の棚卸名の入力欄はブラウザの必須の印（required）を持つ。空のまま「登録」を押すと、ブラウザが送信を止める。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { planCountAll, planCountByName, plansByName } from "../../db/m04_31_inventory_plan";
import { chooseHistoryShopAndZone, searchStockByCode, classStock, openClassListByName } from "../../pages/admin/m04_02_rc_stock";
import { HistoryRow, numberOf, StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import {
  headings, InventoryPlanEditPage, InventoryPlanListPage, InventoryPlanNewPage, PlanRow, pressReflectExecute, topMessages,
} from "../../pages/admin/m04_31_inventory_plan";
import {
  M0431_ADMIN, M0431_NOEDIT, RC160, RC160_PLAN, RC161, RC161_PLAN, RC162, RC162_PLAN, RcPlan,
} from "../../seeds/m04-31";
import { mainShopName } from "../../seeds/m04-02";

// 待ちの上限（誤ったセレクタや移らない画面でロックを長く持たないように。共通の設定は変えず、このファイルのテストだけに効かせる）
test.use({ actionTimeout: 90_000, navigationTimeout: 180_000 });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** 正本の「新規作成ボタンを押す」: 画面のボタンの文言が違えば注記に残す（補い） */
async function pressNew(page: Page): Promise<void> {
  const label = await new InventoryPlanListPage(page).pressNew();
  if (label !== "新規作成") note(`補い: 正本の「新規作成」ボタンは画面に無く、新規作成画面へのボタンの文言は「${label}」（設計書 0202 棚卸計画一覧 L0042 は「新規作成」）。このボタンを押した`);
}

/** 一覧を開いて店舗・在庫区分で検索し、行を返す（注記に行を残す） */
async function searchList(page: Page, 店舗: string, 在庫区分: string): Promise<PlanRow[]> {
  const list = new InventoryPlanListPage(page);
  await list.search({ 店舗, 在庫区分: [在庫区分] });
  const rows = await list.rows();
  note(`棚卸計画一覧（店舗 ${店舗}・在庫区分 ${在庫区分}）: 件数の表示「${(await list.resultCount().allInnerTexts()).map(norm).join("")}」・行 ${JSON.stringify(rows.map((r) => ({ 棚卸名: r.棚卸名.slice(0, 40), 店舗と在庫区分: r.店舗と在庫区分, 備考: r.備考.slice(0, 40) })))}`);
  return rows;
}

/** 「登録」を押す。ブラウザの入力チェックで止まったら注記に残す */
async function submitNew(page: Page): Promise<"送信" | "ブラウザが止めた"> {
  const form = new InventoryPlanNewPage(page);
  const r = await form.submit();
  if (r === "ブラウザが止めた") note(`「登録」を押したが、ブラウザの入力チェックが送信を止めた（${(await form.invalidFields()).join(" / ")}）`);
  else note(`「登録」のあとの画面: ${page.url()}・見出し ${JSON.stringify(await headings(page))}・上部のメッセージ ${JSON.stringify(await topMessages(page))}`);
  return r;
}

/** 期待結果「「棚卸計画を登録できませんでした。」が表示されて新規作成画面に留まり、一覧で「棚卸計画データがありません。」」 */
type FailedRegister = { 送信: "送信" | "ブラウザが止めた"; メッセージ: string[]; 見出し: string[]; 店舗欄: boolean };
async function captureAfterSubmit(page: Page, r: "送信" | "ブラウザが止めた"): Promise<FailedRegister> {
  const m = await topMessages(page);
  return {
    送信: r, メッセージ: [...m.エラー, ...m.成功], 見出し: await headings(page),
    店舗欄: await page.locator("#admin_stock_inventory_plan_BaseInfo").isVisible(),
  };
}

// ---- 007: 計画0件の一覧 ----

caseTest("IT-M04-31-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0431_ADMIN);
  const list = new InventoryPlanListPage(page);
  let rows: PlanRow[] = [];
  await step(1, () => list.open());
  await step(2, async () => { rows = await searchList(page, "店舗A", "EC-CUBE"); });
  await expected(async () => {
    await expect.soft(list.noDataHeading(), "「棚卸計画データがありません。」の見出しが表示される").toBeVisible();
    expect.soft(rows, "一覧が表示されない").toEqual([]);
    await expect.soft(list.resultCount(), "該当件数が表示されない").toHaveCount(0);
    await expect.soft(list.pager(), "ページングが表示されない").toHaveCount(0);
  });
});

// ---- 019: 新規作成の初期値 ----

caseTest("IT-M04-31-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M0431_ADMIN);
  const form = new InventoryPlanNewPage(page);
  await step(1, () => new InventoryPlanListPage(page).open());
  await step(2, () => pressNew(page));
  await expected(async () => {
    expect.soft(await form.selectedStore(), "店舗が「店舗A」に選択されている").toBe("店舗A");
    expect.soft(await form.selectedZone(), "在庫区分が「EC-CUBE」に選択されている").toEqual(["EC-CUBE"]);
  });
});

// ---- 021・023・163・164: 登録して一覧に出る ----

function registerAndList(no: string, v: { 棚卸名: string; 店舗: string; 在庫区分: string; 備考?: string }) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    await loginAdmin(page, M0431_ADMIN);
    let rows: PlanRow[] = [];
    await step(1, () => new InventoryPlanListPage(page).open());
    await step(2, () => pressNew(page));
    await step(3, async () => {
      await new InventoryPlanNewPage(page).fill(v);
      if ((await submitNew(page)) !== "送信") throw new Error(`${no}: 「登録」が送信されない`);
    });
    await step(4, () => new InventoryPlanListPage(page).open());
    await step(5, async () => { rows = await searchList(page, v.店舗, v.在庫区分); });
    await expected(async () => {
      const hit = rows.filter((r) => r.棚卸名 === v.棚卸名);
      expect(hit, `棚卸計画一覧に棚卸名「${v.棚卸名}」の行が1件`).toHaveLength(1);
      expect.soft(hit[0].店舗と在庫区分, `店舗名が「${v.店舗}」、在庫区分名が「${v.在庫区分}」`).toBe(`${v.店舗} ${v.在庫区分}`);
      if (v.備考 !== undefined) expect.soft(hit[0].備考, `備考が「${v.備考}」`).toBe(v.備考);
    });
  };
}

caseTest("IT-M04-31-021", registerAndList("021", { 棚卸名: "M0431-021-A", 店舗: "店舗A", 在庫区分: "EC-CUBE", 備考: "M0431-021-備考" }));
caseTest("IT-M04-31-023", registerAndList("023", { 棚卸名: "M0431-023-A", 店舗: "店舗B", 在庫区分: "スマレジ" }));
caseTest("IT-M04-31-163", registerAndList("163", { 棚卸名: "M0431-CB163-A", 店舗: "店舗A", 在庫区分: "スマレジ" }));
caseTest("IT-M04-31-164", registerAndList("164", { 棚卸名: "M0431-CB164-A", 店舗: "店舗B", 在庫区分: "EC-CUBE" }));

// ---- 022・025・027: 登録して編集画面へ移る ----

caseTest("IT-M04-31-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M0431_ADMIN);
  await step(1, () => new InventoryPlanListPage(page).open());
  await step(2, () => pressNew(page));
  await step(3, async () => {
    await new InventoryPlanNewPage(page).fill({ 棚卸名: "M0431-022-A", 店舗: "店舗A", 在庫区分: "EC-CUBE" });
    await submitNew(page);
  });
  await expected(async () => {
    const edit = new InventoryPlanEditPage(page);
    expect.soft((await topMessages(page)).成功, "「棚卸計画を登録しました。」が表示される").toContain("棚卸計画を登録しました。");
    expect.soft(edit.planIdInUrl(), "棚卸計画編集画面（アドレスが棚卸計画IDの編集画面）").not.toBeNull();
    expect.soft(await headings(page), "棚卸計画編集画面の見出し").toContain("棚卸計画編集");
    expect.soft(await edit.name(), "棚卸名「M0431-022-A」の棚卸計画編集画面").toBe("M0431-022-A");
  });
});

caseTest("IT-M04-31-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0431_ADMIN);
  await step(1, () => new InventoryPlanListPage(page).open());
  await step(2, () => pressNew(page));
  await step(3, async () => {
    const form = new InventoryPlanNewPage(page);
    note(`店舗と在庫区分は初期値のまま（店舗「${await form.selectedStore()}」・在庫区分「${(await form.selectedZone()).join("、")}」）`);
    expect(await form.memo().inputValue(), "備考は空欄").toBe("");
    await form.fill({ 棚卸名: "M0431-025-A" });
    await submitNew(page);
  });
  await expected(async () => {
    const edit = new InventoryPlanEditPage(page);
    expect.soft(edit.planIdInUrl(), "棚卸計画編集画面へ遷移する").not.toBeNull();
    expect.soft(await headings(page), "棚卸計画編集画面の見出し").toContain("棚卸計画編集");
    expect.soft(await edit.name(), "棚卸名が「M0431-025-A」").toBe("M0431-025-A");
    expect.soft(await edit.memo(), "備考が空").toBe("");
  });
});

caseTest("IT-M04-31-027", async ({ page, step, expected }) => {
  const name = `M0431-027-${"あ".repeat(245)}`;
  const memo = "あ".repeat(1024);
  expect(name.length, "棚卸名は合計255文字").toBe(255);
  await loginAdmin(page, M0431_ADMIN);
  await step(1, () => new InventoryPlanListPage(page).open());
  await step(2, () => pressNew(page));
  await step(3, async () => {
    const form = new InventoryPlanNewPage(page);
    await form.fill({ 棚卸名: name, 備考: memo });
    expect(await form.name().inputValue(), "棚卸名の欄に255文字が入った").toBe(name);
    expect(await form.memo().inputValue(), "備考の欄に1024文字が入った").toBe(memo);
    await submitNew(page);
  });
  await expected(async () => {
    const edit = new InventoryPlanEditPage(page);
    expect.soft(edit.planIdInUrl(), "棚卸計画編集画面へ遷移する").not.toBeNull();
    expect.soft(await headings(page), "棚卸計画編集画面の見出し").toContain("棚卸計画編集");
    const shownName = await edit.name();
    const shownMemo = await edit.memo();
    expect.soft(shownName, `棚卸名が入力した255文字と一致（表示 ${shownName.length} 文字）`).toBe(name);
    expect.soft(shownMemo, `備考が入力した1024文字と一致（表示 ${shownMemo.length} 文字）`).toBe(memo);
  });
});

// ---- 024: DBの永続化 ----

caseTest("IT-M04-31-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M0431_ADMIN);
  const before = planCountAll();
  note(`手順の前の棚卸計画の件数（DBの参照）: ${before}`);
  let after = 0;
  let saved: ReturnType<typeof plansByName> = [];
  await step(1, () => new InventoryPlanListPage(page).open());
  await step(2, () => pressNew(page));
  await step(3, async () => {
    await new InventoryPlanNewPage(page).fill({ 棚卸名: "M0431-024-A", 店舗: "店舗A", 在庫区分: "EC-CUBE", 備考: "M0431-024-備考" });
    await submitNew(page);
  });
  await step(4, async () => {
    after = planCountAll();
    saved = plansByName("M0431-024-A");
    note(`DBの棚卸計画: 件数 ${before} → ${after}・棚卸名「M0431-024-A」の行 ${JSON.stringify(saved)}`);
  });
  await expected(async () => {
    expect.soft(after - before, "棚卸計画が1件追加される").toBe(1);
    expect(saved, "棚卸名「M0431-024-A」の棚卸計画は1件").toHaveLength(1);
    expect.soft(saved[0].備考, "備考が「M0431-024-備考」").toBe("M0431-024-備考");
    expect.soft(saved[0].作業者のログインID, "作業者が管理者m0431_admin").toBe(M0431_ADMIN.loginId);
    expect.soft(saved[0].在庫反映日, "在庫反映日が空").toBeNull();
  });
});

// ---- 026・028・029: 登録できない（入力の誤り） ----

function registerFails(no: string, v: { 棚卸名: string; 備考?: string }) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    await loginAdmin(page, M0431_ADMIN);
    let after: FailedRegister | null = null;
    let rows: PlanRow[] = [];
    let noData = false;
    await step(1, () => new InventoryPlanListPage(page).open());
    await step(2, () => pressNew(page));
    await step(3, async () => {
      const form = new InventoryPlanNewPage(page);
      await form.fill({ 棚卸名: v.棚卸名, 店舗: "店舗A", 在庫区分: "EC-CUBE", 備考: v.備考 });
      expect(await form.name().inputValue(), `${no}: 棚卸名の欄の値`).toBe(v.棚卸名);
      if (v.備考 !== undefined) expect(await form.memo().inputValue(), `${no}: 備考の欄の値`).toBe(v.備考);
      after = await captureAfterSubmit(page, await submitNew(page));
      note(`「登録」のあと: ${JSON.stringify(after)}`);
    });
    await step(4, () => new InventoryPlanListPage(page).open());
    await step(5, async () => {
      rows = await searchList(page, "店舗A", "EC-CUBE");
      noData = await new InventoryPlanListPage(page).noDataHeading().isVisible();
    });
    await expected(async () => {
      const a = after!;
      expect.soft(a.送信, "「登録」が送信された（ブラウザの入力チェックで止まっていない）").toBe("送信");
      expect.soft(a.メッセージ, "「棚卸計画を登録できませんでした。」が表示される").toContain("棚卸計画を登録できませんでした。");
      expect.soft(a.見出し, "棚卸計画新規作成画面に留まる").toContain("棚卸計画新規作成");
      expect.soft(a.店舗欄, "新規作成の入力欄（店舗の選択）がある").toBe(true);
      expect.soft(noData, "棚卸計画一覧で「棚卸計画データがありません。」が表示される").toBe(true);
      expect.soft(rows, "棚卸計画一覧に行が無い（棚卸計画が登録されない）").toEqual([]);
    });
  };
}

caseTest("IT-M04-31-026", registerFails("026", { 棚卸名: "" }));
caseTest("IT-M04-31-028", registerFails("028", { 棚卸名: `M0431-028-${"あ".repeat(246)}` }));
caseTest("IT-M04-31-029", registerFails("029", { 棚卸名: "M0431-029-A", 備考: "あ".repeat(1025) }));

// ---- 031: 編集できない店舗を選んで登録 ----

caseTest("IT-M04-31-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M0431_NOEDIT);
  let after: FailedRegister | null = null;
  let pageText = "";
  let count = -1;
  await step(1, () => new InventoryPlanListPage(page).open());
  await step(2, () => pressNew(page));
  await step(3, async () => {
    await new InventoryPlanNewPage(page).fill({ 棚卸名: "M0431-031-A", 店舗: "店舗A", 在庫区分: "EC-CUBE" });
    after = await captureAfterSubmit(page, await submitNew(page));
    pageText = norm(await page.locator(".c-contentsArea").first().innerText());
    const fieldErrors = (await page.locator(".invalid-feedback, .form-error-message").allInnerTexts()).map(norm).filter(Boolean);
    note(`「登録」のあと: ${JSON.stringify(after)}・入力欄の下のエラー ${JSON.stringify(fieldErrors)}`);
  });
  await step(4, async () => {
    count = planCountByName("M0431-031-A");
    note(`DBの棚卸名「M0431-031-A」の棚卸計画: ${count} 件`);
  });
  await expected(async () => {
    expect.soft(after!.送信, "「登録」が送信された").toBe("送信");
    expect.soft(pageText, "「ユーザーの編集可能店舗を選択してください。」が表示される").toContain("ユーザーの編集可能店舗を選択してください。");
    expect.soft(after!.見出し, "棚卸計画新規作成画面に留まる").toContain("棚卸計画新規作成");
    expect.soft(after!.店舗欄, "新規作成の入力欄（店舗の選択）がある").toBe(true);
    expect.soft(count, "棚卸名「M0431-031-A」の棚卸計画が0件").toBe(0);
  });
});

// ---- 160〜162: 棚卸結果の在庫反映が他機能に届く ----

/** 一覧で店舗・EC-CUBE を検索し、棚卸名のリンクから編集画面を開く（手順3・4） */
async function openPlanFromList(page: Page, shop: string, plan: RcPlan, id: string): Promise<void> {
  const rows = await searchList(page, shop, "EC-CUBE");
  const hit = rows.filter((r) => r.棚卸名 === plan.棚卸名);
  expect(hit, `棚卸計画一覧に「${plan.棚卸名}」の行が1件`).toHaveLength(1);
  expect(hit[0].id, `一覧の行の棚卸計画ID（控えた ${id}）`).toBe(id);
  const link = page.locator(`#inventory_plan_list_main__item--${hit[0].id} a`).first();
  await Promise.all([page.waitForURL(new RegExp(`/product/stock/inventory_plan/${hit[0].id}$`), { waitUntil: "load", timeout: 60_000 }), link.click()]);
  expect(await new InventoryPlanEditPage(page).name(), "棚卸計画編集画面の棚卸名").toBe(plan.棚卸名);
}

async function reflect(page: Page): Promise<void> {
  const m = await pressReflectExecute(page);
  note(`「実行」のあと: ${page.url()}・上部のメッセージ ${JSON.stringify(m)}`);
  if (m.エラー.length) throw new Error(`棚卸在庫反映の実行でエラー: ${m.エラー.join(" / ")}`);
}

/** 在庫履歴検索一覧で、検索条件をクリアしてから、キーワード・店舗・在庫区分 EC-CUBE で検索した一覧の行 */
async function searchHistory(page: Page, code: string, shop: string): Promise<HistoryRow[]> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(code);
  await chooseHistoryShopAndZone(page, { 店舗: shop, 在庫区分: "EC-CUBE" });
  expect(await h.submit(), "在庫履歴検索一覧の検索の応答").toBe(200);
  expect(await h.resultCount(), "検索が実行された（件数の表示が出ている）").not.toBeNull();
  const rows = await h.rows();
  note(`在庫履歴検索一覧: ${JSON.stringify(rows.map((r) => ({
    商品コード: r["商品コード"], 店舗: r["店舗"], 在庫場所: r["在庫場所"], 登録元: r["登録元"], 登録元ID: r["登録元ID"], 在庫変動数: r["在庫変動数"],
    変更前在庫: r["変更前在庫"], 変更後在庫: r["変更後在庫"], 在庫変動理由: r["在庫変動理由"],
  })))}`);
  return rows;
}

caseTest("IT-M04-31-160", async ({ page, step, expected, notes }) => {
  const plan = RC160_PLAN;
  const shop = "RC0431-001支店";
  const id = notes.get(plan.呼び名);
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  await step(1, () => loginAdmin(page, RC160.承認者.account));
  await step(2, async () => {
    before = await searchHistory(page, plan.商品コード, shop);
    note("期待結果の「在庫増減数」は一覧の見出し「在庫変動数」、「在庫区分」は見出し「在庫場所」の列で見た");
    expect.soft(before.filter((r) => r["登録元"] === "在庫棚卸"), "手順2: 登録元が「在庫棚卸」の行が無い").toEqual([]);
  });
  await step(3, async () => { await new InventoryPlanListPage(page).open(); });
  await step(4, () => openPlanFromList(page, shop, plan, id));
  await step(5, () => new InventoryPlanEditPage(page).pressReflect());
  await step(6, () => reflect(page));
  await step(7, async () => { after = await searchHistory(page, plan.商品コード, shop); });
  await expected(async () => {
    expect.soft(before.filter((r) => r["登録元"] === "在庫棚卸"), "手順2では登録元「在庫棚卸」の行が表示されない").toEqual([]);
    const rows = after.filter((r) => r["商品コード"] === plan.商品コード && numberOf(r["在庫変動数"] ?? "") === -2);
    expect(rows, "手順7では商品コードRC0431001CODEの在庫増減数-2の行が1件表示される").toHaveLength(1);
    const r = rows[0];
    expect.soft(r["店舗"], "店舗").toBe(shop);
    expect.soft(r["在庫場所"], "在庫区分").toBe("EC-CUBE");
    expect.soft(r["登録元"], "登録元").toBe("在庫棚卸");
    expect.soft(r["登録元ID"], "登録元ID").toBe(id);
    expect.soft(numberOf(r["変更前在庫"] ?? ""), "変更前在庫").toBe(10);
    expect.soft(numberOf(r["変更後在庫"] ?? ""), "変更後在庫").toBe(8);
    expect.soft(r["在庫変動理由"] ?? "", "在庫変動理由に棚卸計画ID").toContain(id);
    expect.soft(r["在庫変動理由"] ?? "", "在庫変動理由に棚卸名").toContain(plan.棚卸名);
  });
});

/** 在庫検索一覧の行の在庫・原価単価・総原価 */
async function readStockRow(page: Page, code: string, shop: string): Promise<{ 在庫: number; 原価単価: number; 総原価: number }> {
  const list = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
  const row = list.row(code, shop, "EC-CUBE");
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  const num = async (l: ReturnType<Page["locator"]>) => Number((await l.innerText()).replace(/[,\s¥]/g, ""));
  const v = {
    在庫: await num(row.locator("td.col-stock > div").nth(0)),
    原価単価: await num(row.locator("td.col-price").nth(1).locator("> div").nth(1)),
    総原価: await num(row.locator("td.col-stock > div").nth(1)),
  };
  note(`在庫検索一覧の ${code}（${shop}・EC-CUBE）: ${JSON.stringify(v)}`);
  return v;
}

caseTest("IT-M04-31-161", async ({ page, step, expected, notes }) => {
  const plan = RC161_PLAN;
  const shop = "RC0431-002支店";
  const id = notes.get(plan.呼び名);
  let before = { 在庫: NaN, 原価単価: NaN, 総原価: NaN };
  let after = { 在庫: NaN, 原価単価: NaN, 総原価: NaN };
  await step(1, () => loginAdmin(page, RC161.承認者.account));
  await step(2, async () => { before = await readStockRow(page, plan.商品コード, shop); });
  await step(3, async () => { await new InventoryPlanListPage(page).open(); });
  await step(4, () => openPlanFromList(page, shop, plan, id));
  await step(5, () => new InventoryPlanEditPage(page).pressReflect());
  await step(6, () => reflect(page));
  await step(7, async () => { after = await readStockRow(page, plan.商品コード, shop); });
  await expected(async () => {
    expect.soft(before, "手順2: 在庫10・原価単価100・総原価1000").toEqual({ 在庫: 10, 原価単価: 100, 総原価: 1000 });
    expect.soft(after, "手順7: 在庫13・原価単価77・総原価1000").toEqual({ 在庫: 13, 原価単価: 77, 総原価: 1000 });
  });
});

caseTest("IT-M04-31-162", async ({ page, step, expected, notes }) => {
  const plan = RC162_PLAN;
  const id = notes.get(plan.呼び名);
  let before = NaN;
  let after = NaN;
  let shop = "";
  await step(1, async () => {
    await loginAdmin(page, RC162.承認者.account);
    shop = await mainShopName(page);
    note(`「本店」は店舗ID 1（親店舗）。手元の環境の店名は「${shop}」（在庫検索一覧の検索欄「店舗」の選択肢から読んだ）`);
  });
  await step(2, async () => {
    await openClassListByName(page, plan.商品名);
    before = await classStock(page, plan.商品コード);
    note(`手順2の商品規格一覧の在庫数: ${before}`);
  });
  await step(3, async () => { await new InventoryPlanListPage(page).open(); });
  await step(4, () => openPlanFromList(page, shop, plan, id));
  await step(5, () => new InventoryPlanEditPage(page).pressReflect());
  await step(6, () => reflect(page));
  await step(7, async () => {
    await openClassListByName(page, plan.商品名);
    after = await classStock(page, plan.商品コード);
    note(`手順7の商品規格一覧の在庫数: ${after}`);
  });
  await expected(async () => {
    expect.soft(before, "手順2（在庫反映前）の在庫数は10").toBe(10);
    expect.soft(after, "手順7（在庫反映後）の在庫数は13").toBe(13);
  });
});

