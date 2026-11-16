/**
 * F06-26 店頭PC用アカウント制御のシードが使う管理画面の操作（顧客グループ管理の「あれば使い、無ければ作る」・会員の顧客グループの付け替え）。
 * 画面の操作は M08 の部品（顧客グループ管理・会員登録/編集）を使う。セレクタはそちらにある。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { M08CustomerEditPage } from "./m08_customer_edit";
import { M08CustomerGroupPage } from "./m08_customer_group";

export type 顧客グループの区分 = { 店内注文専用: boolean; 支店店内注文専用: boolean };

/**
 * 顧客グループ管理で、名称の顧客グループがあれば区分を確かめて使い、無ければ登録する。
 * 名称を押して開いた編集画面のアドレスの末尾の顧客グループIDを返す。区分が違えば落とす（共有の顧客グループを書き換えない）。
 * 作ったか・あったものを使ったかを返す。
 */
export async function 顧客グループを用意する(page: Page, 名称: string, 区分: 顧客グループの区分, 還元率 = "0"): Promise<{ id: string; 作った: boolean }> {
  const g = new M08CustomerGroupPage(page);
  await g.open();
  const n = await g.rowByName(名称).count();
  if (n > 1) throw new Error(`顧客グループ管理の一覧に名称「${名称}」が ${n} 行ある（1つに定まらない）`);
  let 作った = false;
  if (n === 0) {
    await g.入れる({ 名称, 還元率, ...区分 });
    const r = await g.登録する();
    if (!r.sent) throw new Error(`顧客グループ「${名称}」の登録: ブラウザの入力チェックが送信を止めた`);
    await g.open();
    作った = true;
  }
  const id = await g.名称リンクを押してIDを読む(名称);
  const 店内 = await g.shopFront.isChecked();
  const 支店 = await g.branchFront.isChecked();
  if (店内 !== 区分.店内注文専用 || 支店 !== 区分.支店店内注文専用) {
    throw new Error(`顧客グループ「${名称}」（ID ${id}）の区分がシード表と違う（店内注文専用アカウント ${店内 ? "有" : "無"}・支店店内注文専用アカウント ${支店 ? "有" : "無"}）`);
  }
  return { id, 作った };
}

/** 会員登録/編集で顧客グループを選び（顧客グループIDで）、登録する。成功の表示にならなければ落とす */
export async function 会員の顧客グループを選ぶ(page: Page, 会員ID: string, 顧客グループID: string): Promise<void> {
  const ed = new M08CustomerEditPage(page);
  const s = await ed.open(会員ID);
  if (s !== 200) throw new Error(`会員ID ${会員ID} の会員登録/編集画面が開けない（応答 ${s}）`);
  await ed.値で選ぶ("Player][CustomerGroup", 顧客グループID);
  await ed.登録する();
  if (!(await ed.成功メッセージ())) throw new Error(`会員ID ${会員ID} の顧客グループの保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
}

// ---- 接続元IP（管理画面のログイン履歴から読む） ----

/**
 * 管理画面のログイン履歴をログインIDで検索し、いちばん新しい成功の行の接続元IPを返す（アプリが見た接続元のアドレス）。
 * 呼ぶ前に、そのログインIDで新しくログインしておく（withAdminSession が新しいログインをしなくても、同じ端末からのログインの行が読める）。
 */
export async function 接続元IPを読む(page: Page, ログインID: string): Promise<{ IP: string; 行: string }> {
  await page.goto(adminUrl("/setting/system/login_history"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_login_history[multi]"]').fill(ログインID);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.locator("form#search_form button[type=submit]").first().click({ noWaitAfter: true })]);
  // 検索語は部分一致（例: 「admin」は「m0419_admin」にも合う）で、一覧の初期の表示件数は10件。ほかの管理者のログインが新しい順の先頭を埋めると、自分の行が出ない。
  // 検索のあとに、ページ送りのアドレス（検索条件は画面が覚えている）へ表示件数（選択肢の 500）を付けて開き直す
  await page.goto(adminUrl("/setting/system/login_history/1?page_count=500"), { timeout: 120_000 });
  await page.waitForLoadState("load");
  const rows = await page.locator("table tbody tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim())));
  const ok = rows.filter((r) => r.length >= 5 && r[1] === ログインID && /成功/.test(r[4]) && r[2]).sort((a, b) => Number(b[0]) - Number(a[0]));
  if (ok.length === 0) throw new Error(`ログイン履歴に、ログインID ${ログインID} の成功の行が無い（${rows.length} 行）`);
  return { IP: ok[0][2], 行: ok[0].join(" / ") };
}

// ---- 店舗登録（モール設定）の店頭用アカウントIPアドレス（本店は共有の設定。書き換える前に全項目を控え、画面で戻す） ----

const TENANT_FORM = "form#point_form";
const IP_FIELD = '[name="mall_tenant_shop_master[global_ip_address]"]';
export type 店舗登録の控え = Record<string, string | boolean>;

export async function 店舗登録を開く(page: Page, 店舗ID: string): Promise<void> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${店舗ID}`), { timeout: 60_000 });
  if ((res?.status() ?? 0) >= 400) throw new Error(`店舗ID ${店舗ID} の店舗登録画面が開けない（応答 ${res?.status()}）`);
  await page.waitForLoadState("load");
  await expect(page.locator(IP_FIELD), `店舗ID ${店舗ID} の店舗登録画面の「店頭用アカウントIPアドレス」の欄`).toBeVisible({ timeout: 60_000 });
}

/** 店舗登録画面の編集できる全項目（送信の印・隠し欄・ファイルの欄・無効の欄を除く） */
export async function 店舗登録を全部読む(page: Page, 店舗ID: string): Promise<店舗登録の控え> {
  await 店舗登録を開く(page, 店舗ID);
  return page.locator(TENANT_FORM).evaluate((form) => {
    const out: Record<string, string | boolean> = {};
    const 除く = new Set(["hidden", "submit", "button", "reset", "image", "file"]);
    for (const e of Array.from(form.querySelectorAll<HTMLInputElement>("input, select, textarea"))) {
      if (!e.name || e.name.endsWith("[_token]") || e.disabled || e.readOnly || 除く.has(e.type)) continue;
      if (e.type === "radio") { if (e.checked) out[e.name] = e.value; else if (!(e.name in out)) out[e.name] = ""; continue; }
      out[e.name] = e.type === "checkbox" ? e.checked : e.value;
    }
    return out;
  });
}

async function 店舗登録の登録を押す(page: Page, what: string): Promise<void> {
  const btn = page.locator(TENANT_FORM).locator("button[type=submit]", { hasText: /^\s*登録\s*$/ }).first();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), btn.click({ noWaitAfter: true })]);
  await expectSaved(page, what);
}

/** 控えた全項目へ戻して登録する（いまの値と違う項目だけ入れ直す） */
export async function 店舗登録を控えへ戻す(page: Page, 店舗ID: string, 控え: 店舗登録の控え, what: string): Promise<void> {
  const 今 = await 店舗登録を全部読む(page, 店舗ID);
  const form = page.locator(TENANT_FORM);
  for (const [name, v] of Object.entries(控え)) {
    if (今[name] === v) continue;
    const l = form.locator(`[name="${name}"]`);
    if (typeof v === "boolean") await l.first().setChecked(v);
    else if ((await l.first().evaluate((n) => (n as HTMLInputElement).type)) === "radio") { if (v) await form.locator(`[name="${name}"][value="${v}"]`).check(); }
    else if ((await l.first().evaluate((n) => n.tagName)) === "SELECT") await l.first().selectOption(v);
    else await l.first().fill(v);
  }
  await 店舗登録の登録を押す(page, what);
}

export async function 店頭用アカウントIPアドレスを読む(page: Page, 店舗ID: string): Promise<string> {
  await 店舗登録を開く(page, 店舗ID);
  return page.locator(IP_FIELD).inputValue();
}

/** 店舗登録画面の「店頭用アカウントIPアドレス( , 区切り)」に値を入れて登録し、開き直して値を確かめる */
export async function 店頭用アカウントIPアドレスを入れて登録する(page: Page, 店舗ID: string, 値: string): Promise<void> {
  await 店舗登録を開く(page, 店舗ID);
  await page.locator(IP_FIELD).fill(値);
  await 店舗登録の登録を押す(page, `店舗ID ${店舗ID} の店頭用アカウントIPアドレスを「${値}」にする`);
  expect(await 店頭用アカウントIPアドレスを読む(page, 店舗ID), `店舗ID ${店舗ID} の店頭用アカウントIPアドレス（開き直した値）`).toBe(値);
}

/** 開いている店舗登録画面の「公開」「開店」の選ばれている表示名 */
export async function 店舗の公開と開店を読む(page: Page): Promise<{ 公開: string; 開店: string }> {
  const 読む = (n: string) => page.locator(`input[type=radio][name="mall_tenant_shop_master[${n}]"]:checked`).first()
    .evaluate((e) => (e as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "").catch(() => "");
  return { 公開: await 読む("is_public_shop"), 開店: await 読む("is_open_shop") };
}
