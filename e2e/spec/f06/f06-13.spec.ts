/**
 * F06-13 オンライン本人確認（PC版・PCとスマホを両方使うケース）。正本: cases/F06-13_test_cases.tsv
 * このファイルの page は PC 版ブラウザ。スマートフォン版が要るときは、iPhone の端末の印のブラウザを別に開く。
 * スマートフォン版だけのケースは f06-13-sp.spec.ts。
 *
 * 実装しないケース（スキップ候補）:
 * - 002: 表示された QR コードをスマートフォンで読み取る操作は試験のブラウザでは行えない
 *   （QR 画像は画面のリンクと同じ宛先を指すが、読み取りを別の操作に代えない）。
 * - 023・026: 保存先のオブジェクトストレージを確認する手段が E2E に無い。
 * - 025: メールの Reply-To・Bcc を読む手段が無い（開発環境のメールの受け口は宛先と本文しか読めない）うえ、共有の設定（買取専用メールアドレス）を書き換える必要がある。
 */
import { Browser, BrowserContext, Page, test } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { caseTest, expect } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { openEditFromResult, searchCustomer } from "../../pages/admin/f06_customer";
import { M08CustomerEditPage } from "../../pages/admin/m08_customer_edit";
import { メニュー } from "../../pages/front/f06_05_mypage";
import { IdentificationPage, スマホ端末, テスト用カメラを用意する, 全撮影枠 } from "../../pages/front/f06_13_identification";
import { 会員 } from "../../seeds/f06-13";
import "../../seeds/f06-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const opened: BrowserContext[] = [];
test.afterEach(async () => { for (const c of opened.splice(0)) await c.close().catch(() => undefined); });

async function PCでログインする(page: Page, n: string): Promise<IdentificationPage> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
  note(`ログインに使う会員のメールアドレスは、正本の値の末尾に実行の印を付けたもの（${会員(n).メール}）`);
  return new IdentificationPage(page);
}

/** スマートフォン版ブラウザ（iPhone の端末の印）で会員としてログインする */
async function スマホでログインする(browser: Browser, n: string): Promise<IdentificationPage> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, ...スマホ端末 });
  opened.push(context);
  await hideDebugToolbar(context);
  await テスト用カメラを用意する(context);
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
  return new IdentificationPage(page);
}

const 状況 = async (p: IdentificationPage): Promise<string> => (await p.本人確認状況.innerText()).replace(/\s+/g, " ").trim();

// ---- 001: PC版の表示 ----
caseTest("IT-F06-13-001", async ({ page, step, expected }) => {
  const p = await PCでログインする(page, "001");
  await step(1, async () => { await p.開く(); await expect(p.本人確認状況).toBeVisible(); });
  await step(2, async () => { await expect(p.QRコード.first()).toBeVisible(); });
  await expected(async () => {
    await expect.soft(p.QRコード.first(), "QRコード").toBeVisible();
    expect.soft(await p.種類の選択欄.count(), "身分証明書の種類の選択欄の数").toBe(0);
    expect.soft(await p.撮影画面へボタン.count(), "「撮影画面へ」ボタンの数").toBe(0);
  });
});

// ---- 009〜012: 本人確認状況の表示（PC版とスマートフォン版） ----
type Ctx = Parameters<Parameters<typeof caseTest>[1]>[0];
async function 状況を両方で読む({ page, browser, step }: Ctx, n: string): Promise<{ pc状況: string; sp状況: string }> {
  const pc = await PCでログインする(page, n);
  let pc状況 = "", sp状況 = "";
  await step(1, async () => { await pc.開く(); await expect(pc.本人確認状況).toBeVisible(); pc状況 = await 状況(pc); });
  await step(2, async () => {
    const sp = await スマホでログインする(browser, n);
    await sp.開く();
    await expect(sp.本人確認状況).toBeVisible();
    sp状況 = await 状況(sp);
  });
  return { pc状況, sp状況 };
}
caseTest("IT-F06-13-009", async (c) => {
  const r = await 状況を両方で読む(c, "009");
  await c.expected(async () => {
    expect.soft(r.pc状況, "PC版の本人確認状況").toBe("未確認");
    expect.soft(r.sp状況, "スマートフォン版の本人確認状況").toBe("未確認");
  });
});
caseTest("IT-F06-13-010", async (c) => {
  const r = await 状況を両方で読む(c, "010");
  await c.expected(async () => {
    expect.soft(r.pc状況, "PC版の本人確認状況").toBe("現在、確認中です");
    expect.soft(r.sp状況, "スマートフォン版の本人確認状況").toBe("現在、確認中です");
  });
});
caseTest("IT-F06-13-011", async (c) => {
  const r = await 状況を両方で読む(c, "011");
  await c.expected(async () => {
    expect.soft(r.pc状況, "PC版の本人確認状況").toBe("オンラインで本人確認済み");
    expect.soft(r.sp状況, "スマートフォン版の本人確認状況").toBe("オンラインで本人確認済み");
  });
});
caseTest("IT-F06-13-012", async (c) => {
  const r = await 状況を両方で読む(c, "012");
  await c.expected(async () => {
    expect.soft(r.pc状況, "PC版の本人確認状況").toBe("簡易書留で本人確認済み");
    expect.soft(r.sp状況, "スマートフォン版の本人確認状況").toBe("簡易書留で本人確認済み");
  });
});

// ---- 013: ログアウト後のアクセス制御 ----
caseTest("IT-F06-13-013", async ({ page, step, expected }) => {
  const p = await PCでログインする(page, "013");
  const 表示された: Record<string, boolean> = {};
  const 開いて確かめる = async (名: string, path: string): Promise<void> => {
    const status = await p.goto(`${BASE_URL}/ja${path}`);
    const pathOk = new RegExp(`${path.replace(/\//g, "\\/")}\\/?$`).test(p.path);
    const body = await page.locator(".p-hareruya-identification, .p-hareruya-identification-photograph, .p-hareruya-identification-complete").count();
    表示された[名] = status < 400 && pathOk && body > 0;
  };
  await step(1, async () => { await p.ログアウトする(); });
  await step(2, async () => { await 開いて確かめる("オンライン本人確認画面", "/mypage/identification"); });
  await step(3, async () => { await 開いて確かめる("撮影画面", "/mypage/identification/photograph"); });
  await step(4, async () => { await 開いて確かめる("申請完了画面", "/mypage/identification/complete"); });
  await expected(async () => {
    for (const k of ["オンライン本人確認画面", "撮影画面", "申請完了画面"]) expect.soft(表示された[k], `${k}が表示されたか`).toBe(false);
  });
});

// ---- 031・032: PC版の導線 ----
caseTest("IT-F06-13-031", async ({ page, step, expected }) => {
  const p = await PCでログインする(page, "031");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.押して移動する(p.ホームアイコン); });
  await expected(async () => { expect.soft(p.本店ECTOPか, `遷移先（本店ECTOP）。実際: ${p.path}`).toBe(true); });
});

caseTest("IT-F06-13-032", async ({ page, step, expected }) => {
  const p = await PCでログインする(page, "032");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.押して移動する(p.マイページボタン); });
  await expected(async () => { expect.soft(p.マイページか, `遷移先（マイページ）。実際: ${p.path}`).toBe(true); });
});

// ---- 040: パンくずリスト（PC・スマホ・撮影画面・申請完了画面） ----
caseTest("IT-F06-13-040", async ({ page, browser, step, expected }) => {
  const pc = await PCでログインする(page, "040");
  const 結果: Record<string, { 名前: string; リンク: boolean }> = {};
  await step(1, async () => { await pc.開く(); 結果["PC版のオンライン本人確認画面"] = await pc.パンくずの現在のページがリンクでないか(); });
  let sp!: IdentificationPage;
  await step(2, async () => { sp = await スマホでログインする(browser, "040"); await sp.開く(); 結果["スマートフォン版のオンライン本人確認画面"] = await sp.パンくずの現在のページがリンクでないか(); });
  await step(3, async () => {
    await sp.種類を選ぶ("自動車運転免許証");
    await sp.撮影画面へ();
    結果["撮影画面"] = await sp.パンくずの現在のページがリンクでないか();
  });
  await step(4, async () => {
    for (const 枠 of 全撮影枠) await sp.撮影する(枠);
    await sp.同意する();
    await sp.確定を押す();
    結果["申請完了画面"] = await sp.パンくずの現在のページがリンクでないか();
  });
  await expected(async () => {
    for (const [k, v] of Object.entries(結果)) {
      expect.soft(v.名前.length > 0, `${k}の現在表示中のページ名（${v.名前}）が出ている`).toBe(true);
      expect.soft(v.リンク, `${k}の現在表示中のページ名「${v.名前}」がリンクになっているか`).toBe(false);
    }
    expect.soft(Object.keys(結果).length, "確かめた画面の数").toBe(4);
  });
});

// ---- 041: マイページからの導線 ----
caseTest("IT-F06-13-041", async ({ page, step, expected }) => {
  const p = await PCでログインする(page, "041");
  await step(1, async () => { await page.goto(`${BASE_URL}/ja/mypage`, { timeout: 60_000 }); await page.waitForLoadState("load"); });
  await step(2, async () => { await p.押して移動する(page.locator(`${メニュー.オンライン本人確認}:visible`).first()); });
  await expected(async () => { expect.soft(p.スタート画面か, `遷移先（オンライン本人確認画面）。実際: ${p.path}`).toBe(true); });
});

// ---- 046・047: スマホで申請 → 管理画面で確認（PC版の会員。管理者は全権限の管理者で代える） ----
/** ブラウザB（管理画面用の別のブラウザ） */
async function 管理画面のブラウザを開く(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  opened.push(context);
  await hideDebugToolbar(context);
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  return page;
}

async function スマホで申請する(browser: Browser, n: string, step: (i: number, f: () => Promise<void>) => Promise<void>): Promise<void> {
  let sp!: IdentificationPage;
  await step(1, async () => { sp = await スマホでログインする(browser, n); });
  await step(2, async () => { await sp.開く(); await sp.種類を選ぶ("自動車運転免許証"); await sp.撮影画面へ(); });
  await step(3, async () => { for (const 枠 of 全撮影枠) await sp.撮影する(枠); });
  await step(4, async () => {
    await sp.同意する();
    await sp.確定を押す();
    await expect(sp.申請完了の本人確認状況, "申請完了画面").toBeVisible();
  });
}

caseTest("IT-F06-13-046", async ({ browser, step, expected }) => {
  test.setTimeout(900_000);
  await スマホで申請する(browser, "PC001", step);
  const result = { 枠の数: 0, 表示された画像: 0, 登録データなし: 0, 閲覧不可: 0 };
  {
    const page = await 管理画面のブラウザを開く(browser);
    await step(5, async () => { await loginAdmin(page, SETUP_ADMIN); });
    await step(6, async () => { await searchCustomer(page, 会員("PC001").メール); });
    await step(7, async () => { await openEditFromResult(page, 会員("PC001").メール); });
    await step(8, async () => {
      const ed = new M08CustomerEditPage(page);
      await ed.オンライン本人確認ボタン.click();
      const pop = ed.オンライン本人確認ポップアップ;
      await expect(pop).toBeVisible();
      await page.waitForTimeout(3_000);
      const imgs = pop.locator("img.expand-image");
      result.枠の数 = 4;
      result.表示された画像 = await imgs.evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0).length);
      const t = await pop.innerText();
      result.登録データなし = (t.match(/登録データなし/g) ?? []).length;
      result.閲覧不可 = (t.match(/閲覧不可/g) ?? []).length;
    });
    await expected(async () => {
      expect.soft(result.表示された画像, "画像が表示された枠の数（本人の顔写真・身分証の表・裏・斜め）").toBe(result.枠の数);
      expect.soft(result.登録データなし, "「登録データなし」の文言の数").toBe(0);
      expect.soft(result.閲覧不可, "「閲覧不可」の文言の数").toBe(0);
    });
  }
});

caseTest("IT-F06-13-047", async ({ browser, step, expected }) => {
  test.setTimeout(900_000);
  await スマホで申請する(browser, "PC002", step);
  let 選択中 = "";
  {
    const page = await 管理画面のブラウザを開く(browser);
    await step(5, async () => { await loginAdmin(page, SETUP_ADMIN); });
    await step(6, async () => { await searchCustomer(page, 会員("PC002").メール); });
    await step(7, async () => { await openEditFromResult(page, 会員("PC002").メール); });
    await step(8, async () => { 選択中 = await new M08CustomerEditPage(page).ラジオ選択中("Player][IdentityConfirmStatus"); });
    await expected(async () => { expect.soft(選択中, "本人確認ステータスで選択されている項目").toBe("確認中"); });
  }
});
