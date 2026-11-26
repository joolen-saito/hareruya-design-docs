/**
 * M04-21 在庫変更CSV登録が公開側（本店の商品詳細・支店ECTOPのSALE中の商品）へ届くこと（051・052）。正本: cases/M04-21_test_cases.tsv
 *
 * - ブラウザA＝管理画面（ケースの page）、ブラウザB＝公開側（ケースの中で開く新しいブラウザ。日本語・PC・ログアウト）。
 * - 事前準備の店舗・所属・支店は、作らず既存で読み替える（シード S-M04-21-QE-DETAIL-051・QE-SALE-052 の注記と、ケースの「正本の外の補い」）。
 * - 051 の手順7「登録者（所属選択）に申請者の所属」は検索欄の所属で選ぶ。承認ステータスは「未承認」だけにチェックする。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { 別のブラウザの画面を撮る, scene } from "../../lib/evidence_other";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { checkAndOpenBulkApprove, confirmBulkApprove } from "../../pages/admin/m04_02_rc_stock";
import { searchApprovalList } from "../../pages/admin/m04_32_approval_list";
import { openStockChangeCsv } from "../../pages/admin/m04_21_stock_change_csv";
import { ファイルを選ぶ, 一括登録を押す, 入力する } from "../../pages/admin/m04_21_x_csv";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { FrontDetail, 店 } from "../../pages/front/f03_02_detail";
import { m0421QE051, m0421QE052, 試験所属 } from "../../seeds/m04-21-q";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 管理画面から出て入り直す(page: Page, account: { loginId: string; password: string }): Promise<void> {
  await page.goto(adminUrl("/logout"));
  await loginAdmin(page, account);
}

/** 公開側のブラウザ（日本語・PC・ログアウト状態）を新しく開く */
async function 公開側のブラウザ(browser: import("@playwright/test").Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  await hideDebugToolbar(context);
  return { context, page: await context.newPage() };
}

// ---- 051: 入庫の承認が本店の商品詳細の在庫・商品数・カートに追加へ届く ----
caseTest("IT-M04-21-051", async ({ page, browser, notes, step, expected }) => {
  const d = m0421QE051();
  const id = notes.get("〔商品ID-M0421-001〕");
  const b = await 公開側のブラウザ(browser);
  const detail = new FrontDetail(b.page);
  supplement("事前準備②の申請者・承認者の所属は「任意の有効な値（同じ所属）」なので、所属のマスタの既存の「" + 試験所属 + "」にした。商品コード・商品名・CSVのファイル名には実行の印が付く");
  type 表示 = { 在庫: string; 商品数の欄: number; カートに追加: number };
  const 読む = async (when: string): Promise<表示> => {
    const rows = await detail.行の文();
    note(`${when}: ブラウザBの商品詳細（商品ID ${id}）の価格・在庫の表: ${rows.map((r) => `${r.状態}・${r.価格}・在庫${r.在庫}`).join(" / ") || "（行が無い）"}`);
    const nm = rows.filter((r) => /^(NM|ニアミント)/.test(r.状態));
    return {
      在庫: (nm[0] ?? rows[0])?.在庫.replace(/[^0-9]/g, "") ?? "",
      商品数の欄: await detail.数量の欄.count(),
      カートに追加: await detail.カートに追加.count(),
    };
  };
  let 前: 表示 = { 在庫: "", 商品数の欄: -1, カートに追加: -1 };
  let 後: 表示 = { 在庫: "", 商品数の欄: -1, カートに追加: -1 };
  try {
    await step(1, async () => {
      const res = await detail.open(店.本店, id);
      expect(res?.status() ?? 0, "ブラウザBの商品詳細の応答").toBeLessThan(400);
      前 = await 読む("手順1");
    });
    await step(2, async () => { await loginAdmin(page, d.申請者.account); });
    await step(3, async () => { await openStockChangeCsv(page); });
    await step(4, async () => {
      await 入力する(page, {
        店舗: { ID: "1", 店名: d.本店名 }, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: "QE0421-001-CODE入庫", 所属: 試験所属, 承認者: [d.承認者.名前],
      });
    });
    await step(5, async () => {
      await ファイルを選ぶ(page, d.csvPath);
      const r = await 一括登録を押す(page);
      note(`「一括登録を実行」を押したあと: ${JSON.stringify(r)}`);
    });
    await step(6, async () => { await 管理画面から出て入り直す(page, d.承認者.account); });
    await step(7, async () => {
      await searchApprovalList(page, { 店舗: d.本店名, 承認ステータス: ["未承認"], 登録者所属: 試験所属, 登録者: [d.申請者.名前] });
    });
    await step(8, async () => { await checkAndOpenBulkApprove(page, "在庫変更CSV登録", "051 の承認対象「在庫変更CSV登録」"); });
    await step(9, async () => {
      note(`確認の文: ${await confirmBulkApprove(page, "051 の一括承認", (m) => note(m))}`);
    });
    await step(10, async () => {
      await detail.open(店.本店, id);
      後 = await 読む("手順10");
    });
    await expected(async () => {
      expect.soft(前.在庫, "手順1の商品詳細の在庫の項目（数字）").toBe("0");
      expect.soft(前.商品数の欄, "手順1で商品数の欄が表示されない（件数）").toBe(0);
      expect.soft(前.カートに追加, "手順1で「カートに追加」ボタンが表示されない（件数）").toBe(0);
      expect.soft(後.在庫, "手順10の商品詳細の在庫の項目（数字）").toBe("4");
      expect.soft(後.商品数の欄, "手順10で商品数の欄が表示される（件数）").toBeGreaterThan(0);
      expect.soft(後.カートに追加, "手順10で「カートに追加」ボタンが表示される（件数）").toBeGreaterThan(0);
    });
  } finally { await b.context.close(); }
});

// ---- 052: 廃棄の登録（承認前）が支店ECTOPのSALE中の商品から商品を外す ----
caseTest("IT-M04-21-052", async ({ page, browser, step, expected }) => {
  const d = m0421QE052();
  const b = await 公開側のブラウザ(browser);
  const top = new BranchTopPage(b.page);
  supplement(`事前準備②の支店「QE0421-002支店」（支店URL qe0421s002）は、店舗を作らない決まりのため、使い回しの試験支店「${d.支店名}」（支店URL ${d.支店URL}）で読んだ。所属は所属のマスタの既存の「${試験所属}」にした`);
  supplement("「この支店で在庫を持つ商品はこの1件だけ」は共有の試験支店では保てないので、「SALE中の商品」のうち商品名「QE0421-002-NAME」（実行の印つき）のカードだけを確かめた");
  const 読む = async (when: string): Promise<{ 件数: number; 在庫の文: string }> => {
    await top.開いている();
    // 前提の確かめ（正本の期待ではない）: アプリは「SALE中の商品」が0件だと区画ごと出さないため、区画の有無は失敗にしない。
    // 0件が描画の失敗でないことを、0件でも必ず出る支店のヘッダで確かめる。
    const ヘッダ = b.page.locator("header.p-hareruya-header--branch");
    await expect(ヘッダ.locator(".p-hareruya-header__branch-name").first(), `${when}: 支店ECTOPのヘッダの支店名（前提の確かめ・ページが読み込めている）`).toBeVisible({ timeout: 30_000 });
    const 区画 = await top.SALE中.count();
    note(`${when}: 前提の確かめ: 支店ECTOPのヘッダ（支店名）が表示されている。「SALE中の商品」の区画 ${区画} 件（商品0件のときアプリは区画ごと出さない）`);
    const cards = top.SALE中の商品(d.商品名);
    const 件数 = await cards.count();
    const 在庫の文 = 件数 > 0 ? ((await cards.first().locator(".p-hareruya-product-card__stock").first().textContent({ timeout: 10_000 }).catch(() => "")) ?? "").replace(/\s+/g, " ").trim() : "";
    note(`${when}: 「SALE中の商品」の商品名「${d.商品名}」のカード ${件数} 件・在庫の表示「${在庫の文}」`);
    await 別のブラウザの画面を撮る(b.page, scene.stepLabel(when === "手順1" ? 1 : 6, `ブラウザB（公開側）の支店ECTOP・${when}`));
    return { 件数, 在庫の文 };
  };
  let 前 = { 件数: -1, 在庫の文: "" };
  let 後 = { 件数: -1, 在庫の文: "" };
  try {
    await step(1, async () => {
      const st = await top.open(d.支店URL);
      expect(st, "ブラウザBの支店ECTOPの応答").toBeLessThan(400);
      前 = await 読む("手順1");
    });
    await step(2, async () => { await loginAdmin(page, d.申請者.account); });
    await step(3, async () => { await openStockChangeCsv(page); });
    await step(4, async () => {
      await 入力する(page, {
        店舗: { ID: d.支店ID, 店名: d.支店名 }, 在庫区分: "EC-CUBE", 在庫変動区分: "廃棄/廃棄(破損)", 在庫変動理由: "QE0421-002-CODE廃棄", 所属: 試験所属, 承認者: [d.承認者.名前],
      });
    });
    await step(5, async () => {
      await ファイルを選ぶ(page, d.csvPath);
      const r = await 一括登録を押す(page);
      note(`「一括登録を実行」を押したあと: ${JSON.stringify(r)}`);
    });
    await step(6, async () => {
      await top.open(d.支店URL);
      後 = await 読む("手順6");
    });
    await expected(async () => {
      expect.soft(前.件数, "手順1の「SALE中の商品」に商品名「QE0421-002-NAME」が表示される（件数）").toBe(1);
      expect.soft(前.在庫の文.replace(/[^0-9]/g, ""), "手順1の商品の在庫の項目（数字）").toBe("5");
      expect.soft(後.件数, "手順6（廃棄の登録後・承認前）の「SALE中の商品」に商品名「QE0421-002-NAME」が表示されない（件数）").toBe(0);
    });
  } finally { await b.context.close(); }
});
