/**
 * M07（ネット買取管理）のシードが共通で使う操作。
 * - 会員はフロントの会員登録（本登録のメールを手元の受け口で読む。依頼者決定 2026-10-31）で作る。
 * - 買取の申込はその会員でフロントにログインして行い、申込のたびに管理画面の買取検索一覧の先頭行から買取番号を控える（正本の作り方）。
 *   完了画面に出る買取番号と同じであることも確かめる。
 * - 決め打ちの識別の値（会員のメールの前半など）には実行ごとの印を付ける（run_marker）。ただしケースが画面の検索欄へそのまま入れる注文者名は正本の値のまま使い、
 *   前の実行の残りは、シード表のとおり管理画面の一覧から削除してから始める。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { RUN_MARK } from "../lib/run_marker";
import { Account, adminUrl } from "../lib/session";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 申込む, 買取する商品を選ぶ, ログインする, 買取会員 } from "../pages/front/m07_net_buy";
import { registerFrontMember } from "../pages/front/member_entry";

export type 試験会員 = 買取会員 & { 姓: string; 名: string };

/** 管理画面の試験管理者（メンバー管理で登録。ネット買取管理を操作できる権限） */
export async function 試験管理者を用意する(browser: Browser, account: Account, 名前: string): Promise<void> {
  await ensureM05Admin(browser, { 名前, account, メール: `${account.loginId}@example.test` });
}

let seq = 0;

/** フロントの会員登録で会員を作る（本登録まで）。メールは実行の印つき、お名前(名)・フリガナは他のケースの検索条件に一致しない値 */
export async function 会員を作る(browser: Browser, 姓: string, ラベル: string): Promise<試験会員> {
  const メール = `m07-${ラベル.replace(/[^a-zA-Z0-9]/g, "") || "u"}-${++seq}-${RUN_MARK}@example.test`.toLowerCase();
  const パスワード = "Passw0rd!M07Seed";
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓, 名: "シード", セイ: "シケン", メイ: "シード", メール, パスワード });
  } finally {
    await context.close();
  }
  return { 姓, 名: "シード", メール, パスワード };
}

/** 管理画面の会員登録編集で本人確認ステータスを選んで登録する */
export async function 本人確認を設定する(browser: Browser, 会員: 試験会員, 状態: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl("/customer"));
    await page.waitForLoadState("load");
    await page.locator('[name="admin_search_customer[multi]"]').fill(会員.メール);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click()]);
    await page.waitForLoadState("load");
    const row = page.locator('tr[id^="ex-customer-"]').first();
    const id = /ex-customer-(\d+)/.exec((await row.getAttribute("id")) ?? "")?.[1];
    if (!id) throw new Error(`会員 ${会員.メール} が会員一覧に無い`);
    await page.goto(adminUrl(`/customer/${id}/edit`));
    await page.waitForLoadState("load");
    const radios = page.locator('input[name="admin_customer[Player][IdentityConfirmStatus]"]');
    const names = await radios.evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    const idx = names.indexOf(状態);
    if (idx < 0) throw new Error(`本人確認ステータスに「${状態}」が無い（ある選択肢: ${names.join("、")}）`);
    await radios.nth(idx).check();
    page.on("dialog", (d) => void d.accept());
    await Promise.all([page.waitForLoadState("load"), page.locator("#register_btn").click()]);
    await page.waitForLoadState("load");
    const ng = await page.locator(".alert-danger, .invalid-feedback").allInnerTexts();
    if (ng.map((t) => t.trim()).filter((t) => t && !t.includes("デバッグモードが有効")).length) throw new Error(`会員の本人確認ステータスを登録できない: ${ng.join(" / ")}`);
  });
}

/** 管理画面の一覧で注文者名を検索し、先頭行（いちばん新しい買取）の買取番号（数字）を返す */
export async function 先頭の買取番号(page: Page, 注文者名: string): Promise<string> {
  const list = new BuyListPage(page);
  await list.open();
  await list.注文者名を入れる(注文者名);
  await list.検索する();
  const rows = await list.行();
  if (rows.length === 0) throw new Error(`注文者名「${注文者名}」の買取が一覧に無い`);
  return rows[0].番号;
}

/**
 * 会員でフロントにログインして買取の申込みを n 回行い、申込みのたびに一覧の先頭行から買取番号を控える。
 * 買取番号（数字）を申込の順に返す。
 */
export async function 申込みを行う(browser: Browser, 会員: 試験会員, 回数: number, 申込後?: (回: number, 番号: string, adminPage: Page) => Promise<void>, 照合: "毎回" | "最初と最後だけ" = "毎回"): Promise<string[]> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  const out: string[] = [];
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await ログインする(page, 会員);
    const 商品ID = await 買取する商品を選ぶ(page);
    for (let i = 1; i <= 回数; i++) {
      const done = await 申込む(page, 商品ID);
      if (照合 === "最初と最後だけ" && i !== 1 && i !== 回数) { out.push(done); continue; }
      const 番号 = await withAdminSession(browser, SETUP_ADMIN, async (a) => {
        a.setDefaultTimeout(60_000);
        const first = await 先頭の買取番号(a, 会員.姓);
        if (first !== done) throw new Error(`申込完了の買取番号 ${done} と、一覧の先頭行 ${first} が違う`);
        if (申込後) await 申込後(i, first, a);
        return first;
      });
      out.push(番号);
    }
  } finally {
    await context.close();
  }
  return out;
}

/** 管理画面で、買取情報編集を開いて買取状況を変えて保存する（シードの作り方） */
export async function 買取状況を設定する(browser: Browser, 買取番号と状況: [string, string][], 代えた?: (m: string) => void): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [番号, 状況] of 買取番号と状況) {
      const list = new BuyListPage(page);
      await list.open();
      await list.買取番号を入れる(String(Number(番号)));
      await list.検索する();
      await list.編集画面を開く(番号);
      const 選んだ = await new BuyEditPage(page).買取状況を変えて保存する(状況);
      if (選んだ !== 状況 && 代えた) 代えた(`買取状況の選択肢に「${状況}」が無いので、「${選んだ}」を選んだ`);
    }
  });
}

/** 注文者名で検索し、残す買取番号以外の行を、三点リーダーの「削除」（確認はOK）で削除する（前の実行の残りを片付ける） */
export async function 注文者名の残りを削除する(browser: Browser, 注文者名: string, 残す番号: string[]): Promise<number> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let removed = 0;
    for (let round = 0; round < 200; round++) {
      const list = new BuyListPage(page);
      await list.open();
      await list.注文者名を入れる(注文者名);
      await list.検索する();
      const rows = (await list.行()).filter((r) => !残す番号.includes(r.番号));
      if (rows.length === 0) return removed;
      await list.削除する(rows[0].番号, "OK");
      removed++;
    }
    throw new Error(`注文者名「${注文者名}」の残りが片付かない`);
  });
}

/** 注文者名で検索し、全行を削除する（シード表が「すべての行を削除」と定める場合） */
export async function 注文者名の買取をすべて削除する(browser: Browser, 注文者名: string): Promise<number> {
  return 注文者名の残りを削除する(browser, 注文者名, []);
}

/** 管理画面で、買取情報編集の「査定編集」で買取明細すべての売却を選び、「査定確定」「保存」を押す（シードの作り方） */
export async function 売却を設定する(browser: Browser, 買取番号: string, 売却: string): Promise<number> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new BuyListPage(page);
    await list.open();
    await list.買取番号を入れる(String(Number(買取番号)));
    await list.検索する();
    await list.編集画面を開く(買取番号);
    const edit = new BuyEditPage(page);
    await edit.査定編集を始める();
    const n = await edit.売却をすべて選ぶ(売却);
    await edit.査定確定する();
    await edit.保存する(`買取番号 ${買取番号} の買取明細の売却を「${売却}」にする`);
    return n;
  });
}

/** 注文者名で検索し、番号が [下限, 上限] の外の行を削除する（前の実行の残りを片付ける。件数が多いときは1ページずつ） */
export async function 注文者名の範囲外を削除する(browser: Browser, 注文者名: string, 下限: string, 上限: string): Promise<number> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let removed = 0;
    for (let round = 0; round < 400; round++) {
      const list = new BuyListPage(page);
      await list.open();
      await list.注文者名を入れる(注文者名);
      await list.検索する();
      // 古い順に並べて、範囲の下側の残りが1ページ目に出るようにする
      await page.goto(adminUrl("/purchase/page/1?sort=default&order=ASC"), { timeout: 60_000 });
      await page.waitForLoadState("load");
      const rows = (await list.行()).filter((r) => Number(r.番号) < Number(下限) || Number(r.番号) > Number(上限));
      if (rows.length === 0) return removed;
      await list.削除する(rows[0].番号, "OK");
      removed++;
    }
    throw new Error(`注文者名「${注文者名}」の範囲外の行が片付かない`);
  });
}
