/**
 * M05 の各機能の試験管理者（メンバー管理で登録する。権限は受注管理を操作できる「システム管理者」）。
 * 正本は所属店舗を「本店」や「店舗ID 1」と定める機能と、「任意の店舗」と定める機能がある。本店は、アプリが本店として扱う店舗ID 1。
 * 画面の選択肢に店舗ID 1があればそれを、無ければ先頭の店舗を選ぶ。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { Account, adminUrl, withAdminSession } from "../../lib/session";
import { ensureMember } from "./member";

export type M05管理者 = { 名前: string; account: Account; メール: string };

/** 店舗ID 1（本店）の店名。画面のメンバー登録の所属店舗の選択肢から読む（無ければ先頭の店舗） */
export async function 本店の店名(browser: Browser): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/setting/system/member/new"));
    const opts = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })).filter((o) => o.v !== "" && o.t));
    if (opts.length === 0) throw new Error("メンバーに割り当てられる店舗が画面に無い");
    return (opts.find((o) => o.v === "1") ?? opts[0]).t;
  });
}

/** 試験管理者を、あれば内容を確かめて使い、無ければメンバー管理の画面で登録する */
export async function ensureM05Admin(browser: Browser, a: M05管理者): Promise<void> {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: a.メール,
      パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
}
