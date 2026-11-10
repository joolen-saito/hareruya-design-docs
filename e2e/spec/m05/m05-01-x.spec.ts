/**
 * M05-01 受注情報検索 一覧の続き（-x）。実施不可の見直しで流せる見込みになったケースのうち、検索のまとめ方が期待結果に関わらない12件。
 * 正本: cases/M05-01_test_cases.tsv。振り分けは review/M05-01_progress_2026-11-10_dev.md。
 *
 * 正本の手順の注文番号（「M0501-CSV-029」など、複数の受注の共通の先頭）は、画面が振る注文番号では作れない（購入時に振られ、管理画面でも書き換えられない）。
 * 受注が1件のケースはその注文番号で、複数のケースは1件目の注文番号で検索する（類型T4の読み替え。注記「正本の外の補い」）。
 * 期待結果が検索で出る受注の組に依らないケース（受注を選ばずに押す・画面の開き直し・表示件数の選択肢・クリア・「*」）だけを実装した。
 * ログインは本店を店舗Aとする「M05-01試験管理者（本店）」（seeds/m05-01-x.ts の解釈）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 会員の購入実績, 会員の集計対象の受注数 } from "../../db/m05_01_x";
import { OrderListPage } from "../../pages/admin/m05_01_order_list_x";
import { M0501HQ_ADMIN, 受注の, 店舗Aの店名, 表示件数 } from "../../seeds/m05-01-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function signIn(page: Page): Promise<OrderListPage> {
  await loginAdmin(page, M0501HQ_ADMIN);
  supplement("事前準備①のログインは、店舗A＝本店をデフォルト検索表示店舗にした「M05-01試験管理者（本店）」で行った（シードでの解釈。既存の M05-01試験管理者のデフォルト検索表示店舗は試験店舗A（M05-01）で、フロントで購入した本店の受注が検索に出ない）");
  return new OrderListPage(page);
}
/** 正本の注文番号（共通の先頭）の代わりに使う、画面が振った注文番号 */
function 読み替え(seedId: string, 正本の値: string, 何件目 = 0): string {
  const r = 受注の(seedId);
  const no = r.注文番号[何件目];
  supplement(`手順の注文番号「${正本の値}」は、画面が振る注文番号では作れない（購入時に振られ、管理画面でも書き換えられない）。`
    + (r.注文番号.length > 1 ? `${r.注文番号.length}受注の共通の先頭が作れないので、${何件目 + 1}件目の注文番号「${no}」で検索した（期待結果は検索で出る受注の組に依らない）` : `その受注の注文番号「${no}」で検索した`));
  return no;
}
async function showDetail(p: OrderListPage): Promise<void> {
  if (await p.showDetail()) note("詳細検索条件が閉じていたので、開閉ボタンを押して表示した");
}

// ---- 受注を選ばずに一括の操作を押す ----
function 選ばずに押す(番号: string, seedId: string, 操作: "メール一括送信" | "スタック用紙印刷" | "送り状CSV") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const p = await signIn(page);
    let r!: Awaited<ReturnType<OrderListPage["一括の操作を押す"]>>;
    await step(1, async () => { await p.open(); await p.orderNumber.fill(読み替え(seedId, `M0501-CSV-${番号}`)); });
    await step(2, async () => { await p.clickSearch(); await expect(p.resultTable, "検索結果の表").toBeVisible(); });
    await step(3, async () => {
      expect(await page.locator('input[id^="check_"]:checked').count(), "受注を選んでいない").toBe(0);
      r = await p.一括の操作を押す(操作);
      note(`押した結果: 確認の窓=${r.警告の文.join(" / ") || "出ない"}・移った先=${r.移った先 || "移らない"}・新しい窓=${r.新しい窓が開いた ? "開いた" : "開かない"}・ダウンロード=${r.ダウンロードが始まった ? "始まった" : "始まらない"}`);
    });
    await expected(async () => {
      expect.soft(r.警告の文.join(" / "), "エラー（選んでいないことの知らせ）が表示される").not.toBe("");
      expect.soft(r.移った先, "画面が移らない（受注一覧に留まる）").toBe("");
      await expect.soft(p.resultTable, "受注一覧（検索結果）が表示されたまま").toBeVisible();
      if (操作 === "メール一括送信") expect.soft(page.url(), "手動メール通知画面へ移らない").not.toMatch(/manual_mail/);
      if (操作 === "スタック用紙印刷") expect.soft(r.新しい窓が開いた, "印刷の窓が開かない（印刷対象が更新されない）").toBe(false);
      if (操作 === "送り状CSV") expect.soft(r.ダウンロードが始まった, "CSVファイルがダウンロードされない").toBe(false);
    });
  };
}
caseTest("IT-M05-01-029", 選ばずに押す("029", "S-M05-01-CSV-029", "メール一括送信"));
caseTest("IT-M05-01-031", 選ばずに押す("031", "S-M05-01-CSV-031", "スタック用紙印刷"));
caseTest("IT-M05-01-033", 選ばずに押す("033", "S-M05-01-CSV-033", "送り状CSV"));

// ---- 最後の集計対象の受注を削除する ----
caseTest("IT-M05-01-044", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const A = notes.get("〔注文番号-M0501-044A〕");
  const 会員ID = notes.get("〔会員ID-M0501-044〕");
  const 前 = 会員の購入実績(会員ID);
  note(`削除の前の購入実績（画面の購入とキャンセルで入った値。正本は初回・最終 2026-07-01 10:00:00・1回・100円）: 初回=${前.初回購入日時 ?? "なし"}・最終=${前.最終購入日時 ?? "なし"}・回数=${前.購入回数}・金額=${前.購入金額}・集計対象の受注=${会員の集計対象の受注数(会員ID)}件`);
  let 後!: ReturnType<typeof 会員の購入実績>; let 件数 = -1;
  await step(1, async () => { await p.open(); await p.orderNumber.fill(A); });
  await step(2, async () => { await p.clickSearch(); });
  let dialogs: string[] = [];
  await step(3, async () => { await expect(p.結果の行(A), `注文番号「${A}」の行`).toHaveCount(1); });
  await step(4, async () => { dialogs = await p.行を削除する(A); note(`確認の窓: ${dialogs.join(" / ") || "出ない"}`); });
  await step(5, async () => { 後 = 会員の購入実績(会員ID); 件数 = 会員の集計対象の受注数(会員ID); });
  await expected(async () => {
    expect.soft(件数, "集計対象の受注（削除されておらずキャンセルでない受注）").toBe(0);
    expect.soft(後.初回購入日時, "初回購入日時（消去される）").toBe(null);
    expect.soft(後.最終購入日時, "最終購入日時（消去される）").toBe(null);
    expect.soft(後.購入回数, "購入回数").toBe(0);
    expect.soft(後.購入金額, "購入金額").toBe(0);
  });
});

// ---- 検索パターンの該当件数欄の「*」 ----
caseTest("IT-M05-01-061", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-061-PAT");
  let text = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await expect(p.patternItem(name), `検索パターン「${name}」`).toHaveCount(1); text = await p.countText(name); });
  await expected(async () => {
    expect.soft(text, "リロードアイコン・全件更新を押す前の該当件数欄").toBe("*");
  });
});

// ---- 画面の開き直し ----
caseTest("IT-M05-01-073", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(読み替え("S-M05-01-INITVIEW-073", "M0501-073")); await p.clickSearch(); });
  await step(3, async () => { await expect(p.resultTable, "検索結果が表示された").toBeVisible(); });
  await step(4, async () => { await p.メニューから開く(); });
  await expected(async () => {
    await expect.soft(p.resultTable, "検索結果が表示されない").toHaveCount(0);
    await expect.soft(p.orderNumber, "注文番号の入力欄が空").toHaveValue("");
  });
});

// ---- 表示件数の選択肢 ----
caseTest("IT-M05-01-076", async ({ page, step, expected }) => {
  const p = await signIn(page);
  let opts: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(読み替え("S-M05-01-PERPAGEOPT-076", "M0501-076")); });
  await step(3, async () => { await p.clickSearch(); });
  await step(4, async () => { opts = await p.表示件数の選択肢(); });
  await expected(async () => {
    expect.soft(opts, "件数の選択肢（9つだけ）").toEqual(表示件数.map((n) => `${n}件`));
  });
});

// ---- 検索条件クリア ----
caseTest("IT-M05-01-077", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await showDetail(p); });
  await step(3, async () => {
    await p.orderNumber.fill("M0501-077"); await p.name.fill("M0501-077-NAME"); await p.purchaseFrom.fill("1000");
    await expect(p.orderNumber, "入れた注文番号").toHaveValue("M0501-077");
  });
  await step(4, async () => { await p.検索条件をクリアする(); });
  await expected(async () => {
    await expect.soft(p.orderNumber, "注文番号が空").toHaveValue("");
    await expect.soft(p.name, "お名前が空").toHaveValue("");
    await expect.soft(p.purchaseFrom, "購入金額（From）が空").toHaveValue("");
  });
});

// ---- 店舗と対応状況の組合せ ----
function 全店と店舗Aで(番号: string, seedId: string, 状態: string) {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    const p = await signIn(page);
    const shop = await 店舗Aの店名(browser);
    let rows: string[] = []; let A = "";
    await step(1, async () => { await p.open(); });
    await step(2, async () => { const sel = await p.店舗を選ぶ(["全店", shop]); note(`店舗の選択: ${sel.join("・")}（店舗A＝本店「${shop}」）`); });
    await step(3, async () => { await showDetail(p); });
    await step(4, async () => { A = 読み替え(seedId, `M0501-CB${番号}`); await p.orderNumber.fill(A); });
    await step(5, async () => { await p.対応状況だけを選ぶ([状態]); });
    await step(6, async () => { await p.clickSearch(); rows = await p.結果の注文番号(); });
    await expected(async () => {
      expect.soft(rows.includes(A), `店舗Aの${状態}の受注（${A}）が検索結果に表示される`).toBe(true);
    });
  };
}
caseTest("IT-M05-01-168", 全店と店舗Aで("168", "S-M05-01-CBALLPLUSOK-168", "注文受領"));
caseTest("IT-M05-01-171", 全店と店舗Aで("171", "S-M05-01-CBALLCANCELONLY-171", "キャンセル"));

// ---- 注文番号の赤字と警告の文言 ----
function 警告が無い(番号: string, seedId: string) {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    const p = await signIn(page);
    const shop = await 店舗Aの店名(browser);
    let A = ""; let color = ""; let cell = "";
    await step(1, async () => { await p.open(); });
    await step(2, async () => {
      note(`初期表示の店舗: ${(await p.選ばれている店舗()).join("・") || "なし"}（店舗A＝本店「${shop}」）`);
      A = 読み替え(seedId, `M0501-CB${番号}`); await p.orderNumber.fill(A);
    });
    await step(3, async () => { await p.clickSearch(); });
    await step(4, async () => {
      await expect(p.結果の行(A), `注文番号「${A}」の行`).toHaveCount(1);
      color = await p.注文番号の色(A);
      cell = ((await p.注文番号の欄(A).innerText()) ?? "").replace(/\s+/g, " ").trim();
      note(`注文番号の文字色: ${color}・注文番号の欄の文字: ${cell}`);
    });
    await expected(async () => {
      await expect.soft(p.結果の行(A), `受注（${A}）が表示される`).toHaveCount(1);
      expect.soft(/^rgba?\(\s*(2[0-5]\d|1[6-9]\d)\s*,\s*([0-5]?\d)\s*,\s*([0-5]?\d)/.test(color), `注文番号が赤字でない（文字色 ${color}）`).toBe(false);
      expect.soft(cell, "注文番号の下に警告の文言が無い（欄は注文番号だけ）").toBe(A);
    });
  };
}
caseTest("IT-M05-01-176", 警告が無い("176", "S-M05-01-CBWARNNONE-176"));
caseTest("IT-M05-01-177", 警告が無い("177", "S-M05-01-CBWARNDATEONLY-177"));
