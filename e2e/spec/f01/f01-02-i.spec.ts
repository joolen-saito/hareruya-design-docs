/**
 * F01-02 支店ECTOP のうち、DBで整えたデータが要るケース（ピックアップ指定・週間販売数）。正本: cases/F01-02_test_cases.tsv
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: 画面で作った実行の印つきの商品の規格に、DBで支店在庫のピックアップ指定・
 * 本店の過去1週間の販売数（期間別販売数集計データ）を設定したシード（seeds/f01-02-tile.ts）で流す。
 *
 * 解釈:
 * - ピックアップ商品のタイルは、タイル4行をすべてピックアップ商品にした（正本の「ピックアップタイル-046」「ピックアップF0102-CBxxx」は、
 *   タイル名の入力欄が無い。ピックアップ商品のタイルの見出しは「ピックアップ商品」）。4つのタイルは同じ候補から選ぶので、先頭のタイルで確かめる。
 * - 今週の売れ筋商品の抽出は、商品にカード（カード詳細）が紐づくことを求めるアプリの作りなので、シードで既存のカードを商品に指定した。
 */
import { Locator, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";
import "../../seeds/f01-02-tile";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });

const ピックアップの注記 = "ピックアップ商品のタイルは4行すべてピックアップ商品にした。見出しはいずれも「ピックアップ商品」で、同じ候補から選ぶので、先頭のタイルで確かめた";

type カード表示 = { 言語: string; 状態: string; 価格: string };

async function カード表示を読む(cards: Locator): Promise<カード表示[]> {
  return cards.evaluateAll((ns) => ns.map((n) => ({
    言語: (n.querySelector(".p-hareruya-product-card__language-label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    状態: (n.querySelector(".p-hareruya-product-card__condition")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    価格: (n.querySelector(".p-hareruya-product-card__price")?.textContent ?? "").replace(/[¥,\s]/g, ""),
  })));
}

/** ピックアップ指定の規格が、商品ごとに1件に絞られて表示される（正本: 1. 支店ECTOPを開く／2. タイルの商品を確認する） */
function ピックアップの規格(n: string, 商品名: string, 残る: { 価格: string; 状態: string | RegExp; 日本語: boolean }): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const tile = () => top.タイル("ピックアップ商品").first();
    let 表示: カード表示[] = [];
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      await expect(tile(), "ピックアップ商品のタイル").toBeVisible({ timeout: 30_000 }).catch(() => note("ピックアップ商品のタイルが支店ECTOPに見つからなかった"));
      表示 = await カード表示を読む(tile().locator(".p-hareruya-product-card").filter({ hasText: rc(商品名) }));
    });
    await expected(async () => {
      expect.soft(表示.length, `「${商品名}」のカードの数（商品規格は1件に絞られる）`).toBe(1);
      expect.soft(表示.map((x) => x.価格), `「${商品名}」に表示された商品規格の販売価格`).toEqual([残る.価格]);
      if (表示.length === 1) {
        if (typeof 残る.状態 === "string") expect.soft(表示[0].状態, "残った商品規格のカード状態").toBe(残る.状態);
        else expect.soft(表示[0].状態, "残った商品規格のカード状態").toMatch(残る.状態);
        expect.soft(/EN|英/.test(表示[0].言語), `残った商品規格は${残る.日本語 ? "日本語" : "英語"}（言語の表示「${表示[0].言語}」）`).toBe(!残る.日本語);
      }
    });
    note(ピックアップの注記);
    note("支店在庫のピックアップ指定「あり」は、指定する画面が無いので、シードがDBで設定した");
  };
}
caseTest("IT-F01-02-098", ピックアップの規格("CB098", "タイル商品F0102-CB098", { 価格: "300", 状態: /^(?!NM$)/, 日本語: true }));
caseTest("IT-F01-02-099", ピックアップの規格("CB099", "タイル商品F0102-CB099", { 価格: "200", 状態: /MP/, 日本語: true }));
caseTest("IT-F01-02-103", ピックアップの規格("CB103", "タイル商品F0102-CB103", { 価格: "800", 状態: /NM/, 日本語: true }));

caseTest("IT-F01-02-046", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const tile = () => top.タイル("ピックアップ商品").first();
  const A = rc("ピックアップ指定商品-046");
  const B = rc("ピックアップ未指定商品-046");
  let a = -1; let b = -1;
  await step(1, async () => { await top.open(支店URL("046")); await top.開いている(); });
  await step(2, async () => {
    await expect(tile(), "ピックアップ商品のタイル").toBeVisible({ timeout: 30_000 }).catch(() => note("ピックアップ商品のタイルが支店ECTOPに見つからなかった"));
    a = await tile().locator(".p-hareruya-product-card").filter({ hasText: A }).count();
    b = await tile().locator(".p-hareruya-product-card").filter({ hasText: B }).count();
  });
  await expected(async () => {
    expect.soft(a > 0, "ピックアップ指定ありでタイルタグなしの「ピックアップ指定商品-046」の表示").toBe(true);
    expect.soft(b, "ピックアップ指定なしでタイルタグありの「ピックアップ未指定商品-046」の表示数").toBe(0);
  });
  note(ピックアップの注記);
  note("商品Aの支店在庫のピックアップ指定「あり」は、指定する画面が無いので、シードがDBで設定した");
});

// ---------------------------------------------------------------- 週間販売数

const 売れ筋の注記 = "過去1週間の本店販売数（期間別販売数集計データ）は、集計バッチが作るデータで画面から作れないので、シードがDBで設定した（集計バッチが走ると書き換わる）。売れ筋の抽出に要るカードは、シードで既存のカードを商品に指定した";

const 売れ筋の商品名 = async (top: BranchTopPage): Promise<string[]> =>
  top.今週の売れ筋.locator(".p-hareruya-product-card .p-hareruya-product-card__name-text").evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));

caseTest("IT-F01-02-007", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await top.open(支店URL("007")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.今週の売れ筋.first(), "今週の売れ筋商品の区画").toBeVisible({ timeout: 30_000 }).catch(() => note("今週の売れ筋商品の区画が見つからなかった"));
    並び = await 売れ筋の商品名(top);
  });
  await expected(async () => {
    // 販売数は 01 が 31 個 … 31 が 1 個。表示は上位30件なので、先頭から 01〜30 の順
    const 期待 = Array.from({ length: 30 }, (_, i) => rc(`週間商品${String(i + 1).padStart(2, "0")}-007`));
    expect.soft(並び.slice(0, 30), "今週の売れ筋商品の先頭から30件の商品名（販売数の多い順）").toEqual(期待);
  });
  note(売れ筋の注記);
});

caseTest("IT-F01-02-008", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await top.open(支店URL("008")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.今週の売れ筋.first(), "今週の売れ筋商品の区画").toBeVisible({ timeout: 30_000 }).catch(() => note("今週の売れ筋商品の区画が見つからなかった"));
    並び = await 売れ筋の商品名(top);
  });
  await expected(async () => {
    expect.soft(並び.length, "今週の売れ筋商品に表示された商品数（上限30）").toBe(30);
    expect.soft(並び.includes(rc("週間商品30-008")), "30位の「週間商品30-008」の表示").toBe(true);
    expect.soft(並び.includes(rc("週間商品31-008")), "31位の「週間商品31-008」の表示").toBe(false);
  });
  note(売れ筋の注記);
});

caseTest("IT-F01-02-010", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await top.open(支店URL("010")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.今週の売れ筋.first(), "今週の売れ筋商品の区画").toBeVisible({ timeout: 30_000 }).catch(() => note("今週の売れ筋商品の区画が見つからなかった"));
    並び = await 売れ筋の商品名(top);
  });
  await expected(async () => {
    expect.soft(並び.includes(rc("週間公開商品-010")), "支店の商品公開ステータスが「公開」の「週間公開商品-010」の表示").toBe(true);
    expect.soft(並び.includes(rc("週間非公開商品-010")), "支店の商品公開ステータスが「非公開」の「週間非公開商品-010」の表示").toBe(false);
  });
  note(売れ筋の注記);
});

caseTest("IT-F01-02-093", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await top.open(支店URL("CB093")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.今週の売れ筋.first(), "今週の売れ筋商品の区画").toBeVisible({ timeout: 30_000 }).catch(() => note("今週の売れ筋商品の区画が見つからなかった"));
    並び = await 売れ筋の商品名(top);
  });
  await expected(async () => {
    expect.soft(並び.includes(rc("売れ筋公開F0102-CB093")), "「売れ筋公開F0102-CB093」の表示").toBe(true);
  });
  note(売れ筋の注記);
});

caseTest("IT-F01-02-094", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await top.open(支店URL("CB094")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.今週の売れ筋.first(), "今週の売れ筋商品の区画").toBeVisible({ timeout: 30_000 }).catch(() => note("今週の売れ筋商品の区画が見つからなかった"));
    並び = await 売れ筋の商品名(top);
  });
  await expected(async () => {
    expect.soft(並び.includes(rc("売れ筋公開F0102-CB094")), "本店・支店とも「公開」の「売れ筋公開F0102-CB094」の表示").toBe(true);
    expect.soft(並び.includes(rc("売れ筋本店非公開F0102-CB094")), "本店が「非公開」の「売れ筋本店非公開F0102-CB094」の表示").toBe(false);
  });
  note(売れ筋の注記);
});

caseTest("IT-F01-02-027", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const 名 = rc("週間在庫なし商品-027");
  const card = () => page.locator(".p-hareruya-product-card").filter({ hasText: 名 }).first();
  let 数 = 0;
  const 見える = { 商品数: true, マイナス: true, プラス: true, カート: true };
  await step(1, async () => { await top.open(支店URL("027")); await top.開いている(); });
  await step(2, async () => {
    数 = await page.locator(".p-hareruya-product-card").filter({ hasText: 名 }).count();
    if (数 === 0) {
      note("在庫0の「週間在庫なし商品-027」のカードが支店ECTOPに見つからなかった（今週の売れ筋商品の抽出は、支店の在庫が1以上の商品だけを対象にするアプリの作り）");
      return;
    }
    const c = card();
    見える.商品数 = await c.locator("input.p-hareruya-product-card__quantity-input").first().isVisible();
    見える.マイナス = await c.locator("button.c-hareruya-btn-quantity").first().isVisible();
    見える.プラス = await c.locator("button.c-hareruya-btn-quantity").nth(1).isVisible();
    見える.カート = (await c.locator("button.add-cart").count()) > 0 && (await c.locator("button.add-cart").first().isVisible());
  });
  await expected(async () => {
    expect.soft(数 > 0, "在庫0の「週間在庫なし商品-027」のカードの表示（確認する対象）").toBe(true);
    expect.soft(見える.商品数, "商品数の入力欄の表示").toBe(false);
    expect.soft(見える.マイナス, "マイナスボタンの表示").toBe(false);
    expect.soft(見える.プラス, "プラスボタンの表示").toBe(false);
    expect.soft(見える.カート, "カートに入れるボタンの表示").toBe(false);
  });
  note(売れ筋の注記);
});

caseTest("IT-F01-02-053", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = rc("テストタイルA-053");
  const card = () => top.タイルの商品(タグ名, rc("テストタイル商品-053")).first();
  let 販売数 = "";
  await step(1, async () => { await top.open(支店URL("053")); await top.開いている(); });
  await step(2, async () => {
    await expect(card(), "「テストタイル商品-053」のカード").toBeVisible({ timeout: 30_000 }).catch(() => note("タイルに「テストタイル商品-053」が見つからなかった"));
    販売数 = ((await card().locator(".p-hareruya-product-card__sales-number").first().textContent({ timeout: 10_000 }).catch(() => "")) ?? "").trim();
  });
  await expected(async () => {
    expect.soft(販売数, "「テストタイル商品-053」に表示された週間販売数").toBe("7");
  });
  note("過去1週間の本店販売数7は、集計バッチが作るデータで画面から作れないので、シードがDBで設定した");
});
