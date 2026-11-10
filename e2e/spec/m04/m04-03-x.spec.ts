/**
 * M04-03 在庫一括編集の続き（-x）。正本: cases/M04-03_test_cases.tsv
 * 仕分け直しで流せる見込みになったケースのうち、所属のマスタ（在庫管理第一部・第二部）を使わないもの（記録 review/M04-03_progress_2026-11-11_dev.md）。
 * 事前準備の「ログインしている」は、手順1の前にその管理者でログインする。
 * 「在庫ID 〔…〕を対象に在庫一括編集画面を開く」は、在庫検索一覧でその規格の商品コード・店舗で検索し、行を選んで「在庫一括編集」を押す。
 */
import { Browser, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 在庫の, 規格の期間別販売数量, 在庫の変動履歴の金額 } from "../../db/m04_03_x";
import { 在庫の変動履歴 } from "../../db/m04_02_x";
import { checkAndOpenBulkApprove, confirmBulkApprove, searchApprovals } from "../../pages/admin/m04_02_rc_stock";
import {
  一括編集の画面, 一括編集の行, 一括編集を開く, 一括編集を登録する, 行の仕入単価, 行の位置, 行を入れる, 行を選ぶ, 在庫一括編集を押す, 在庫一覧リンク,
  在庫を検索する, 在庫変動区分の選択肢, 在庫変動区分を選ぶ, 承認通知先メンバーを選ぶ, 一覧の在庫ID,
} from "../../pages/admin/m04_03_bulk_x";
import { TC東京, 大阪店, 一括商品, 試験管理者, 商品コードの, 登録者の, 承認者の } from "../../seeds/m04-03-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const issue = (m: string) => note(`画面の警告: ${m}`);
const 共通の語 = (番号: string) => `-${番号}-${RUN_MARK}`;

/** 在庫ID（呼び名）を対象に在庫一括編集画面を開く: 商品コードと店舗で検索し、行を選んで「在庫一括編集」を押す */
async function 対象に開く(ctx: CaseCtx, 番号: string, 控え: string[], 店: string[] = [TC東京.店名]): Promise<void> {
  await 在庫を検索する(ctx.page, { 商品コード: 共通の語(番号), 店舗: 店 });
  await 一括編集を開く(ctx.page, 控え.map((k) => ctx.notes.get(`〔在庫ID-M0403-${k}〕`)));
}

// ---- 001・002・004: 在庫検索一覧から在庫一括編集へ ----
caseTest("IT-M04-03-001", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let パス = ""; let 規格: string[] = [];
  await step(1, async () => { await 在庫を検索する(page, { 商品コード: 共通の語("001"), 店舗: [TC東京.店名] }); note(`在庫検索一覧の在庫ID: ${(await 一覧の在庫ID(page)).join("、")}`); });
  await step(2, async () => { await 行を選ぶ(page, [notes.get("〔在庫ID-M0403-001A〕"), notes.get("〔在庫ID-M0403-001B〕")]); });
  await step(3, async () => {
    const r = await 在庫一括編集を押す(page); パス = r.パス;
    if (r.警告.length) note(`警告: ${r.警告.join(" / ")}`);
    if (await 一括編集の画面(page).count()) 規格 = (await 一括編集の行(page)).map((x) => x.商品規格ID);
  });
  await expected(async () => {
    expect.soft(パス, "在庫一括編集画面へ移った").toMatch(/\/product\/stock\/stock-bulk-approval\/new$/);
    expect.soft([...規格].sort(), "明細の行の商品規格ID（001A・001B の2行）").toEqual([notes.get("〔商品規格ID-M0403-001A〕"), notes.get("〔商品規格ID-M0403-001B〕")].sort());
  });
});

caseTest("IT-M04-03-002", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let r!: Awaited<ReturnType<typeof 在庫一括編集を押す>>;
  await step(1, async () => { await 在庫を検索する(page, { 商品コード: 共通の語("002"), 店舗: [TC東京.店名] }); });
  await step(2, async () => {
    r = await 在庫一括編集を押す(page);
    note(`「在庫一括編集」: ${r.押せた ? "押した" : "押せない（非活性）"}・移った先 ${r.パス}${r.警告.length ? `・警告 ${r.警告.join(" / ")}` : ""}`);
  });
  await expected(async () => {
    expect.soft(r.押せた, "商品を選ばずに「在庫一括編集」を押せる").toBe(true);
    expect.soft(r.パス, "在庫一覧画面（在庫検索一覧）").toMatch(/\/product\/stock\/?$/);
  });
});

caseTest("IT-M04-03-004", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let r!: Awaited<ReturnType<typeof 在庫一括編集を押す>>;
  supplement(`大阪店は、開発環境の同名の店舗が2つあり名前で決まらないので、E2E 用の「${大阪店.店名}」（ショップ名略称「大阪店」）を使った`);
  await step(1, async () => { await 在庫を検索する(page, { 商品コード: 共通の語("004"), 店舗: [TC東京.店名, 大阪店.店名] }); });
  await step(2, async () => { await 行を選ぶ(page, [notes.get("〔在庫ID-M0403-004A〕"), notes.get("〔在庫ID-M0403-004B〕")]); });
  await step(3, async () => { r = await 在庫一括編集を押す(page); note(`移った先 ${r.パス}・警告 ${r.警告.join(" / ") || "なし"}`); });
  await expected(async () => {
    expect.soft(r.パス, "在庫一覧画面（在庫検索一覧）").toMatch(/\/product\/stock\/?$/);
  });
});

// ---- 005: 明細の表示 ----
caseTest("IT-M04-03-005", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let rows: Awaited<ReturnType<typeof 一括編集の行>> = [];
  await step(1, async () => { await 対象に開く(ctx, "005", ["005A", "005B"]); });
  await step(2, async () => { rows = await 一括編集の行(page); note(`明細: ${JSON.stringify(rows)}`); });
  await expected(async () => {
    const 期待 = [
      { k: "005A", 商品名: 一括商品.A.商品名(), 商品コード: 商品コードの("BULK-A-005"), 言語: "日本語", 状態: "NM", Foil: "通常", 在庫数: "10", 原価単価: "¥1,000", 総原価: "¥10,000" },
      { k: "005B", 商品名: 一括商品.B.商品名(), 商品コード: 商品コードの("BULK-B-005"), 言語: "英語", 状態: "SP", Foil: "特殊", 在庫数: "20", 原価単価: "¥800", 総原価: "¥16,000" },
    ];
    for (const e of 期待) {
      const r = rows.find((x) => x.商品規格ID === notes.get(`〔商品規格ID-M0403-${e.k}〕`));
      expect.soft(!!r, `商品規格ID 〔${e.k}〕 の行がある`).toBe(true);
      if (!r) continue;
      expect.soft(r.画像, `〔${e.k}〕の代表画像が表示される`).not.toBe("");
      expect.soft(r.商品名, `〔${e.k}〕の商品名`).toBe(e.商品名);
      expect.soft(r.商品コード, `〔${e.k}〕の商品コード`).toBe(e.商品コード);
      expect.soft(r.言語, `〔${e.k}〕の言語`).toBe(e.言語);
      expect.soft(r.状態, `〔${e.k}〕の状態`).toBe(e.状態);
      expect.soft(r.Foil, `〔${e.k}〕の Foil`).toBe(e.Foil);
      expect.soft(r.店舗, `〔${e.k}〕の店舗`).toBe(TC東京.ショップ名略称);
      expect.soft(r.在庫区分, `〔${e.k}〕の在庫区分`).toBe("EC-CUBE");
      expect.soft(r.在庫数, `〔${e.k}〕の在庫数`).toBe(e.在庫数);
      expect.soft(r.原価単価.replace(/\s/g, ""), `〔${e.k}〕の原価単価`).toBe(e.原価単価);
      expect.soft(r.総原価.replace(/\s/g, ""), `〔${e.k}〕の総原価`).toBe(e.総原価);
    }
  });
});

// ---- 006・007: 検索の絞り込みが在庫一括編集の明細に効く ----
function 絞り込み(番号: string, 条件: { 言語?: string[]; 状態?: string[] }, 出る: string[]) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, notes, step, expected } = ctx;
    await loginAdmin(page, 試験管理者.account);
    let 規格: string[] = [];
    supplement(`在庫検索一覧には開発環境のほかの商品も出るので、商品名「${`絞込確認商品-${番号}`}」（実行の印つき）と店舗「TC東京」も検索の条件に入れた`);
    await step(1, async () => { await 在庫を検索する(page, { 商品名: `絞込確認商品-${番号}-${RUN_MARK}`, 店舗: [TC東京.店名], ...条件 }); });
    await step(2, async () => {
      const ids = await 一覧の在庫ID(page);
      note(`絞り込んだ在庫検索一覧の在庫ID: ${ids.join("、")}`);
      await 一括編集を開く(page, ids);
      規格 = (await 一括編集の行(page)).map((x) => x.商品規格ID);
    });
    await expected(async () => {
      expect.soft([...規格].sort(), `在庫一括編集の明細の商品規格ID（${出る.join("・")} だけ）`).toEqual(出る.map((k) => notes.get(`〔商品規格ID-M0403-${k}〕`)).sort());
    });
  };
}
caseTest("IT-M04-03-006", 絞り込み("006", { 言語: ["日本語"] }, ["006A", "006C"]));
caseTest("IT-M04-03-007", 絞り込み("007", { 状態: ["NM"] }, ["007A", "007B"]));

// ---- 009: 期間別販売数量 ----
caseTest("IT-M04-03-009", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let text = "";
  await step(1, async () => {
    note(`DB の期間別販売数量: ${JSON.stringify(規格の期間別販売数量(notes.get("〔商品規格ID-M0403-009〕")))}`);
    await 対象に開く(ctx, "009", ["009"]);
  });
  await step(2, async () => { text = (await 一括編集の画面(page).innerText()).replace(/\s+/g, " "); });
  await expected(async () => {
    for (const [名前, 数] of [["当日", 1], ["昨日", 2], ["3日間", 3], ["1週間", 4], ["1ヶ月", 5]] as const) {
      expect.soft(new RegExp(`${名前}[^0-9]{0,20}${数}`).test(text), `期間別販売数量「${名前}」に ${数} が表示される`).toBe(true);
    }
  });
});

// ---- 010: 在庫変動区分の選択肢 ----
caseTest("IT-M04-03-010", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let 選択肢: string[] = [];
  await step(1, async () => { await 対象に開く(ctx, "010", ["010"]); });
  await step(2, async () => { 選択肢 = await 在庫変動区分の選択肢(page); note(`在庫変動区分の選択肢: ${選択肢.join("、")}`); });
  await expected(async () => {
    const 期待 = ["入庫/問屋仕入", "入庫/他店仕入", "入庫/GOOD抜き", "入庫/発見", "入庫/その他", "廃棄/廃棄(破損)", "廃棄/廃棄(他事業移動)", "廃棄/廃棄(イベント商品)", "廃棄/廃棄(その他)", "廃棄/廃棄(欠品)"];
    expect.soft([...選択肢].sort(), "在庫変動区分の選択肢（手動の入庫5区分・廃棄5区分だけ）").toEqual([...期待].sort());
  });
});

// ---- 013: 在庫一覧リンクで検索条件が戻る ----
caseTest("IT-M04-03-013", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  supplement("在庫検索一覧には開発環境のほかの商品も出るので、商品名「絞込確認商品-013」（実行の印つき）と店舗「TC東京」も検索の条件に入れた");
  await step(1, async () => { await 在庫を検索する(page, { 商品名: `絞込確認商品-013-${RUN_MARK}`, 店舗: [TC東京.店名], 言語: ["日本語"], 状態: ["NM"] }); });
  await step(2, async () => { await 一括編集を開く(page, [notes.get("〔在庫ID-M0403-013A〕")]); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), 在庫一覧リンク(page).click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "在庫検索一覧画面へ移った").toMatch(/\/product\/stock\/?$/);
    const 言語 = await page.locator('input[name="admin_search_stock_list[language][]"]:checked').evaluateAll((ns) => ns.map((n) => document.querySelector(`label[for="${n.id}"]`)?.textContent?.trim() ?? ""));
    const 状態 = await page.locator('input[name="admin_search_stock_list[card_condition][]"]:checked').evaluateAll((ns) => ns.map((n) => document.querySelector(`label[for="${n.id}"]`)?.textContent?.trim() ?? ""));
    expect.soft(言語, "検索条件の言語（日本語）").toEqual(["日本語"]);
    expect.soft(状態.length === 1 && ["NM", "ニアミント"].includes(状態[0]), `検索条件の状態（NM）。実際: ${状態.join("、")}`).toBe(true);
  });
});

// ---- 014: 廃棄に変えると仕入単価が空・入力できない ----
caseTest("IT-M04-03-014", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  await step(1, async () => { await 対象に開く(ctx, "014", ["014"]); });
  await step(2, async () => { await 在庫変動区分を選ぶ(page, "入庫/問屋仕入"); });
  await step(3, async () => { await 行の仕入単価(page, 0).fill("500"); });
  await step(4, async () => { await 在庫変動区分を選ぶ(page, "廃棄/廃棄(破損)"); await page.waitForTimeout(500); });
  await expected(async () => {
    const f = 行の仕入単価(page, 0);
    expect.soft(await f.inputValue(), "仕入単価が空になる").toBe("");
    const 入力できる = await f.evaluate((el) => !(el as HTMLInputElement).disabled && !(el as HTMLInputElement).readOnly);
    expect.soft(入力できる, "仕入単価が入力できない状態").toBe(false);
  });
});

// ---- 054・055・056・061: 一括編集の入庫を承認すると在庫が更新される ----
async function ブラウザBを開く(browser: Browser, account: { loginId: string; password: string }) {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  await hideDebugToolbar(ctx);
  const page = await ctx.newPage();
  await loginAdmin(page, account);
  return { ctx, page };
}

type 確かめ = { 名前: string; 実際: unknown; 期待: unknown };

function 承認して確かめる(番号: string, 商品コード: string, 数量: number, 確かめる: (在庫ID: string) => 確かめ[]) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, browser, notes, step, expected } = ctx;
    const reg = 登録者の(番号), apr = 承認者の(番号);
    await loginAdmin(page, reg.account);
    const B = await ブラウザBを開く(browser, apr.account);
    try {
      await step(1, async () => {
        await 在庫を検索する(page, { 商品コード: 商品コードの(商品コード), 店舗: [TC東京.店名] });
        await 一括編集を開く(page, [notes.get(`〔在庫ID-M0403-${番号}〕`)]);
      });
      await step(2, async () => {
        await 在庫変動区分を選ぶ(page, "入庫/問屋仕入");
        await 承認通知先メンバーを選ぶ(page, [apr.名前]);
        await 行を入れる(page, await 行の位置(page, 商品コードの(商品コード)), { 在庫変動理由: `M0403-${番号}-入庫`, 在庫増減数: String(数量), 仕入単価: "900" });
      });
      await step(3, async () => { const r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
      await step(4, async () => {
        const res = await B.page.goto(adminUrl("/product/stock/approval_list"));
        expect(res?.status() ?? 0, "在庫編集承認一覧(検索入力)の応答").toBeLessThan(400);
        await expect(B.page.locator("form#form_search_stock_approval_list"), "在庫編集承認一覧(検索入力)").toBeVisible({ timeout: 30_000 });
      });
      await step(5, async () => { await searchApprovals(B.page, { 店舗: TC東京.店名, 登録者: reg.名前 }); });
      await step(6, async () => { const row = await checkAndOpenBulkApprove(B.page, "在庫一括編集", `M0403-${番号} の在庫一括編集の承認`); note(`承認した行: ${JSON.stringify(row)}`); });
      await step(7, async () => { const t = await confirmBulkApprove(B.page, `M0403-${番号} の一括承認`, issue); note(`確認の文: 「${t}」`); });
      await step(8, async () => { note(`承認のあとの在庫: ${JSON.stringify(在庫の(notes.get(`〔在庫ID-M0403-${番号}〕`)))}`); });
      await expected(async () => {
        for (const c of 確かめる(notes.get(`〔在庫ID-M0403-${番号}〕`))) expect.soft(c.実際, c.名前).toEqual(c.期待);
      });
    } finally { await B.ctx.close(); }
  };
}
caseTest("IT-M04-03-054", 承認して確かめる("054", "BULK-A-054", 1, (id) => [{ 名前: "在庫数（11）", 実際: 在庫の(id).在庫数, 期待: 11 }]));
caseTest("IT-M04-03-055", 承認して確かめる("055", "BULK-A-055", 1, (id) => [{ 名前: "総原価（10900）", 実際: 在庫の(id).総原価, 期待: 10900 }]));
function 履歴を確かめる(番号: string, e: { 変更後在庫: number; 増減数: number; 仕入総価格: number; 変更後総原価: number; 変更後原価単価: number }) {
  return (id: string): 確かめ[] => {
    const h = 在庫の変動履歴(id); const m = 在庫の変動履歴の金額(id);
    const x = h[0]; const y = m[0];
    return [
      { 名前: "在庫変動履歴の件数（1件）", 実際: h.length, 期待: 1 },
      { 名前: "在庫変動区分（問屋仕入）", 実際: /問屋仕入$/.test(x?.在庫変動区分 ?? ""), 期待: true },
      { 名前: "変更後在庫数", 実際: x?.変更後在庫, 期待: e.変更後在庫 },
      { 名前: "在庫増減数", 実際: x?.在庫増減数, 期待: e.増減数 },
      { 名前: "仕入総価格", 実際: y?.仕入総価格, 期待: e.仕入総価格 },
      { 名前: "変更前総原価", 実際: x?.変更前総原価, 期待: 10000 },
      { 名前: "変更後総原価", 実際: x?.変更後総原価, 期待: e.変更後総原価 },
      { 名前: "変更前原価単価", 実際: y?.変更前原価単価, 期待: 1000 },
      { 名前: "変更後原価単価", 実際: y?.変更後原価単価, 期待: e.変更後原価単価 },
      { 名前: "在庫変動理由", 実際: x?.在庫変動理由, 期待: `M0403-${番号}-入庫` },
      { 名前: "履歴登録元ID（空）", 実際: y?.履歴登録元ID ?? "", 期待: "" },
    ];
  };
}
caseTest("IT-M04-03-056", 承認して確かめる("056", "BULK-A-056", 1, 履歴を確かめる("056", { 変更後在庫: 11, 増減数: 1, 仕入総価格: 900, 変更後総原価: 10900, 変更後原価単価: 991 })));
caseTest("IT-M04-03-061", 承認して確かめる("061", "M0403-061-BULK", 3, 履歴を確かめる("061", { 変更後在庫: 13, 増減数: 3, 仕入総価格: 2700, 変更後総原価: 12700, 変更後原価単価: 977 })));
