/**
 * M08-12 顧客グループ管理。正本: cases/M08-12_test_cases.tsv
 * 実装しないケース（記録 review/M08-12_progress_*.md）: シードがDBで準備されるもの、メール受信を確かめるもの、
 * 手順の画面（チーム情報変更・大会デッキ登録）がアプリの画面として特定できない035。
 * 削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」を「OK」として押す。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 顧客グループの件数, 名称の顧客グループの件数 } from "../../db/m08_12";
import { M08CustomerGroupPage } from "../../pages/admin/m08_customer_group";
import { LoginPage } from "../../pages/front/f06_03_login";
import { M0812_ADMIN, 名称, PW047, PW048 } from "../../seeds/m08-12";
import { mailOf } from "../../seeds/m08-common";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const MODAL注記 = "削除の確認は、ブラウザの確認ダイアログではなく画面内のモーダルが出る。そのモーダルの「削除」ボタンを「OK」として押した";
const GROUP_PATH = "/admin/customer/customer_group";

caseTest("IT-M08-12-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  await step(1, async () => { await g.open(); });
  await expected(async () => {
    expect.soft(await g.新規追加の状態か(), "入力フォームが新規追加の状態（顧客グループIDがアドレスに無く、名称が空）").toBe(true);
    expect.soft(await g.percentage.inputValue(), "ポイント還元率が空").toBe("");
    expect.soft(await page.locator(".card-title").first().innerText(), "入力欄の見出し").toContain("新規");
  });
});

caseTest("IT-M08-12-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  await step(1, async () => { await g.open(); });
  await step(2, async () => { await g.入れる({ 名称: "新規遷移確認グループ", 還元率: "10" }); });
  let sent = false;
  await step(3, async () => { sent = (await g.登録する()).sent; });
  await expected(async () => {
    expect.soft(sent, "登録ボタンで送信された").toBe(true);
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面").toBe(GROUP_PATH);
    expect.soft(await g.新規追加の状態か(), "入力フォームが新規追加の状態").toBe(true);
  });
});

caseTest("IT-M08-12-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M0812_ADMIN);
  const g = new M08CustomerGroupPage(page);
  let r: { sent: boolean; status: number | null } = { sent: false, status: null };
  await step(1, async () => { await g.open(); });
  await step(2, async () => { await g.入れる({ 名称: "", 還元率: "" }); });
  await step(3, async () => {
    r = await g.登録する();
    if (!r.sent) note("ブラウザの入力チェックが送信を止めた（登録の要求は送られていない）");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面のまま").toMatch(/^\/admin\/customer\/customer_group/);
    expect.soft(await page.locator("table tbody tr").count(), "顧客グループの一覧の行数（一覧を伴って表示されている）").toBeGreaterThan(0);
    expect.soft(r.sent, "入力チェックのためサーバーへ送信されて画面が再表示された").toBe(true);
  });
});

// ---- 削除 ----
function 削除(k: string, db確認: "消える" | "残る" | "なし", 行: "消える" | "残る" | "確認しない") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const id = notes.get(`〔顧客グループID-M0812-${k}〕`);
    await step(1, async () => { await g.open(); });
    await step(2, async () => { await g.削除ボタンを押す(id); });
    await step(3, async () => { note(MODAL注記); await g.モーダルで削除する(id); });
    let n = -1;
    if (db確認 !== "なし") await step(4, async () => { n = 顧客グループの件数(id); });
    await expected(async () => {
      if (db確認 === "消える") expect.soft(n, `顧客グループID ${id} の件数（削除済みのレコードとしても残らない）`).toBe(0);
      if (db確認 === "残る") expect.soft(n, `顧客グループID ${id} の件数（削除されずDBに残る）`).toBe(1);
      if (行 !== "確認しない") {
        expect.soft(new URL(page.url()).pathname, "顧客グループ管理画面へ遷移").toBe(GROUP_PATH);
        expect.soft(await g.rowById(id).count(), `一覧の顧客グループID ${id} の行`).toBe(行 === "消える" ? 0 : 1);
      }
    });
  };
}
caseTest("IT-M08-12-023", 削除("023", "消える", "確認しない"));
caseTest("IT-M08-12-024", 削除("024", "なし", "消える"));
caseTest("IT-M08-12-025", 削除("025", "残る", "確認しない"));
caseTest("IT-M08-12-026", 削除("026", "なし", "残る"));

// ---- なりすまし対策トークン ----
function 登録トークン不正(db: boolean) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    let status: number | null = null;
    await step(1, async () => { await g.open(); });
    await step(2, async () => { await g.入れる({ 名称: "トークン不正追加", 還元率: "10" }); });
    await step(3, async () => { await page.locator('[name="admin_customer_group[_token]"]').evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
    await step(4, async () => { status = (await g.登録する()).status; });
    let n = -1;
    await step(5, async () => { note("開発者ツールのネットワーク情報の代わりに、登録要求の応答（HTTPステータス）を記録して確かめた"); if (db) n = 名称の顧客グループの件数("トークン不正追加"); });
    await expected(async () => {
      if (!db) expect.soft(status, "登録要求のHTTP応答ステータス").toBe(403);
      else expect.soft(n, "名称が「トークン不正追加」の顧客グループの件数（追加されない）").toBe(0);
    });
  };
}
caseTest("IT-M08-12-027", 登録トークン不正(false));
caseTest("IT-M08-12-028", 登録トークン不正(true));

function 削除トークン不正(db: boolean) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0812_ADMIN);
    const g = new M08CustomerGroupPage(page);
    const k = db ? "032" : "031";
    const id = notes.get(`〔顧客グループID-M0812-${k}〕`);
    let status: number | null = null;
    await step(1, async () => { await g.open(); });
    await step(2, async () => {
      await g.削除ボタンを押す(id);
      await page.locator(`#delete_${id} a.btn-ec-delete`).evaluate((e) => e.setAttribute("token-for-anchor", "invalid-token"));
    });
    await step(3, async () => { note(MODAL注記); status = await g.モーダルで削除する(id); });
    let n = -1;
    await step(4, async () => {
      if (db) n = 顧客グループの件数(id);
      else note("開発者ツールのネットワーク情報の代わりに、削除要求の応答（HTTPステータス）を記録して確かめた");
    });
    await expected(async () => {
      if (!db) expect.soft(status, "削除要求のHTTP応答ステータス").toBe(403);
      else expect.soft(n, `顧客グループID ${id} の件数（削除されずDBに残る）`).toBe(1);
    });
  };
}
caseTest("IT-M08-12-031", 削除トークン不正(false));
caseTest("IT-M08-12-032", 削除トークン不正(true));

caseTest("IT-M08-12-034", async ({ page, browser, notes, step, expected }) => {
  const id = notes.get("〔顧客グループID-M0812-034〕");
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB: Page = await ctxB.newPage();
    const a = new M08CustomerGroupPage(page), b = new M08CustomerGroupPage(pageB);
    await loginAdmin(page, M0812_ADMIN);
    await loginAdmin(pageB, M0812_ADMIN);
    let status: number | null = null;
    await step(1, async () => { await a.open(); await b.open(); });
    await step(2, async () => { note(MODAL注記); await b.削除ボタンを押す(id); await b.モーダルで削除する(id); });
    await step(3, async () => { note(MODAL注記); await a.削除ボタンを押す(id); status = await a.モーダルで削除する(id); });
    await expected(async () => {
      expect.soft(status, "ブラウザAの削除要求のHTTP応答ステータス").toBe(404);
      expect.soft(await a.name.count(), "顧客グループ管理画面の入力フォームが表示されない").toBe(0);
      expect.soft(await page.locator("table tbody tr").count(), "顧客グループの一覧が表示されない").toBe(0);
    });
  } finally {
    await ctxB.close();
  }
});

// ---- 店内注文専用でないアカウントのマイページ系画面 ----
function マイページ系(メール前半: string, pw: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = new LoginPage(page);
    const メール = mailOf(メール前半);
    const 画面 = [
      ["購入履歴画面", "/ja/mypage/shopping_history"], ["ポイント履歴画面", "/ja/mypage/point_history"], ["ネット買取履歴画面", "/ja/mypage/purchase_history"],
      ["予約済み大会一覧画面", "/ja/mypage/event_history"], ["お問い合わせ画面", "/ja/contact"], ["お問い合わせ履歴画面", "/ja/contact/history"],
    ] as const;
    const 結果: { 名前: string; status: number; path: string; エラー: boolean }[] = [];
    await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(メール, pw); });
    for (let i = 0; i < 画面.length; i++) {
      await step(i + 2, async () => {
        const tab = await page.context().newPage();
        try {
          const res = await tab.goto(`${BASE_URL}${画面[i][1]}`, { timeout: 60_000 });
          await tab.waitForLoadState("load");
          const text = await tab.locator("body").innerText();
          結果.push({ 名前: 画面[i][0], status: res?.status() ?? 0, path: new URL(tab.url()).pathname, エラー: /システムエラー/.test(text) });
        } finally { await tab.close(); }
      });
    }
    await expected(async () => {
      for (let i = 0; i < 画面.length; i++) {
        const r = 結果[i];
        expect.soft(r?.status ?? 0, `${画面[i][0]}の応答のHTTPステータス`).toBeLessThan(400);
        expect.soft(r?.path ?? "", `${画面[i][0]}のアドレス（対象のマイページ系画面のまま）`).toBe(画面[i][1]);
        expect.soft(r?.エラー ?? true, `${画面[i][0]}にシステムエラーが表示されている`).toBe(false);
      }
    });
  };
}
caseTest("IT-M08-12-047", マイページ系("cbm0812-047", PW047));
caseTest("IT-M08-12-048", マイページ系("cbm0812-048", PW048));
void 名称;
