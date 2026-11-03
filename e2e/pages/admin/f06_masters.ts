/** F06 フロント会員の準備に使う管理画面の操作（職業マスタの追加・ブラックリスト管理・仮会員機能の設定）。画面から作る・消すだけ */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { ShopBasicPage } from "./m10_01_shop";
import { 行に入れる, 職業の行を読む, 職業マスタを開く, 保存する } from "./m11_05_master";

/** 職業マスタに、名称の行が無ければ空いた行へ未使用の番号で足す（あるものは変えない・消さない）。足したときだけ true */
export async function ensureJob(page: Page, 名称: string): Promise<boolean> {
  await 職業マスタを開く(page);
  const rows = await 職業の行を読む(page);
  if (rows.some((r) => r.name === 名称)) return false;
  const blank = rows.find((r) => r.id === "" && r.name === "");
  if (!blank) throw new Error(`職業マスタに「${名称}」を足す空欄の行が無い`);
  const used = new Set(rows.map((r) => r.id).filter(Boolean));
  let n = 9200;
  while (used.has(String(n))) n++;
  await 行に入れる(page, blank.index, String(n), 名称);
  await 保存する(page, `職業マスタに「${名称}」を足す`);
  return true;
}

export type 拒否種別 = "氏名" | "電話番号" | "住所";

async function openBlacklist(page: Page): Promise<void> {
  await page.goto(adminUrl("/customer/blacklist"));
  await page.waitForLoadState("load");
  await expect(page.locator("form#blacklist-form"), "ブラックリスト管理の画面").toBeVisible({ timeout: 30_000 });
}

/** ブラックリストの行（種別・キーワード）を読む */
export async function blacklistRows(page: Page): Promise<{ 種別: string; キーワード: string; id: string }[]> {
  await openBlacklist(page);
  const out: { 種別: string; キーワード: string; id: string }[] = [];
  for (const r of await page.locator("tr.blacklist-row").all()) {
    const sel = r.locator("select").first();
    const del = await r.locator('button[form^="blacklist-delete-"]').getAttribute("form");
    out.push({
      種別: ((await sel.locator("option:checked").innerText()) ?? "").trim(),
      キーワード: await r.locator('input[type=text]').first().inputValue(),
      id: (del ?? "").replace("blacklist-delete-", ""),
    });
  }
  return out;
}

/** 項目・キーワードの行が無ければ、新規登録の欄に入れて「登録」を押す。足したときだけ true */
export async function ensureBlacklist(page: Page, 種別: 拒否種別, キーワード: string): Promise<boolean> {
  if ((await blacklistRows(page)).some((r) => r.種別 === 種別 && r.キーワード === キーワード)) return false;
  await page.locator('[name$="[new_blacklist_tag]"]').selectOption({ label: 種別 }, { timeout: 20_000 });
  await page.locator('[name$="[new_keyword]"]').fill(キーワード, { timeout: 20_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("form#blacklist-form button.btn-ec-conversion[type=submit]").click({ timeout: 20_000 })]);
  await expectSaved(page, `ブラックリストに${種別}「${キーワード}」を登録`);
  const after = await blacklistRows(page);
  expect(after.some((r) => r.種別 === 種別 && r.キーワード === キーワード), `ブラックリストに${種別}「${キーワード}」の行が表示される`).toBe(true);
  return true;
}

/** 項目・キーワードの行があれば、その行の削除ボタンを押して消す。消したときだけ true */
export async function removeBlacklist(page: Page, 種別: 拒否種別, キーワード: string): Promise<boolean> {
  const hit = (await blacklistRows(page)).find((r) => r.種別 === 種別 && r.キーワード === キーワード);
  if (!hit) return false;
  page.once("dialog", (d) => { void d.accept(); });
  const btn = page.locator(`button[form="blacklist-delete-${hit.id}"]`);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), btn.click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
  // 確認のモーダルが出る作りなら、その確定ボタンを押す
  expect((await blacklistRows(page)).some((r) => r.種別 === 種別 && r.キーワード === キーワード), `ブラックリストから${種別}「${キーワード}」の行が消える`).toBe(false);
  return true;
}

/** 店舗基本設定の仮会員機能を有効／無効にして登録する（変えたときだけ true） */
export async function setTempMember(page: Page, 有効: boolean): Promise<boolean> {
  const p = new ShopBasicPage(page);
  await p.open();
  if ((await p.有効か("仮会員")) === 有効) return false;
  await p.トグルを("仮会員", 有効);
  await p.押して保存を確かめる(`店舗基本設定の仮会員機能を${有効 ? "有効" : "無効"}にする`);
  return true;
}
export async function readTempMember(page: Page): Promise<boolean> {
  const p = new ShopBasicPage(page);
  await p.open();
  return p.有効か("仮会員");
}

import { ensureMember } from "./member";

/** 会員管理を操作できる管理者（システム管理者の権限・利用できる店舗の先頭）。あれば内容を確かめて使い、無ければ登録する */
export async function ensureMemberAdmin(page: Page, 名前: string, ログインID: string, パスワード: string): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
    .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
  if (stores.length === 0) throw new Error(`${名前}: メンバーに割り当てられる店舗が画面に無い`);
  await ensureMember(page, {
    名前, 所属店舗: stores[0], ログインID, メールアドレス: `${ログインID.replace(/[^0-9a-z]/gi, "")}@example.test`,
    パスワード, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
  });
}

/** 店舗基本設定のログイン状態の保持（自動ログイン）を有効／無効にして登録する（変えたときだけ true） */
export async function setRememberMe(page: Page, 有効: boolean): Promise<boolean> {
  const p = new ShopBasicPage(page);
  await p.open();
  if ((await p.有効か("自動ログイン")) === 有効) return false;
  await p.トグルを("自動ログイン", 有効);
  await p.押して保存を確かめる(`店舗基本設定のログイン状態の保持を${有効 ? "有効" : "無効"}にする`);
  return true;
}
export async function readRememberMe(page: Page): Promise<boolean> {
  const p = new ShopBasicPage(page);
  await p.open();
  return p.有効か("自動ログイン");
}
