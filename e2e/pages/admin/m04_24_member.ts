/**
 * M04-24 の試験管理者・承認する管理者のメンバー登録（メニュー「システム設定」→「メンバー管理」）。
 * 共通の部品（member.ts の createMember・expectMember）は店舗を店名で選ぶ。手元のDBには同じ店名の閉店の店舗
 * （福岡店・札幌店・名古屋店・仙台店）があり、店名では選べないので、店舗IDで選ぶ局所の部品にした。
 * - デフォルト検索表示店舗の選択肢は、画面のスクリプトが所属店舗の選択に合わせて作り直す（所属店舗と同じ店舗だけが選べる）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { findMemberId } from "./member";

export type M0424MemberInput = {
  名前: string; ログインID: string; メールアドレス: string; パスワード: string; 権限: string;
  所属店舗ID: string; デフォルト検索表示店舗ID: string; 編集可能店舗ID: string[];
};

const f = (page: Page, name: string) => page.locator(`[name="admin_member[${name}]"]`);
const editable = (page: Page) => page.locator('[name="admin_member[editableBaseInfos][]"]');

/** 選択欄に、値（店舗ID）の選択肢がすべてあること */
async function expectOptions(page: Page, selector: string, ids: string[], what: string): Promise<void> {
  const values = await page.locator(`${selector} option`).evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  const missing = ids.filter((id) => !values.includes(id));
  if (missing.length) throw new Error(`${what}に店舗ID ${missing.join("・")} の選択肢が無い`);
}

/** メンバー登録画面で登録する。遷移したメンバー編集画面のアドレスから管理者IDを読んで返す */
export async function createMemberByStoreIds(page: Page, v: M0424MemberInput): Promise<string> {
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  await page.waitForLoadState("load");
  await f(page, "name").fill(v.名前);
  await expectOptions(page, '[name="admin_member[baseInfo]"]', [v.所属店舗ID], "所属店舗");
  await f(page, "baseInfo").selectOption(v.所属店舗ID);
  await f(page, "department").selectOption({ index: 1 });
  await f(page, "login_id").fill(v.ログインID);
  await f(page, "email").fill(v.メールアドレス);
  await page.locator('[name="admin_member[plain_password][first]"]').fill(v.パスワード);
  await page.locator('[name="admin_member[plain_password][second]"]').fill(v.パスワード);
  await chooseByLabel(f(page, "Authority"), v.権限);
  await expectOptions(page, '[name="admin_member[editableBaseInfos][]"]', v.編集可能店舗ID, "編集可能店舗");
  await editable(page).selectOption(v.編集可能店舗ID);
  await expectOptions(page, '[name="admin_member[defaultSearchBaseInfo]"]', [v.デフォルト検索表示店舗ID], "デフォルト検索表示店舗");
  await f(page, "defaultSearchBaseInfo").selectOption(v.デフォルト検索表示店舗ID);
  await page.getByLabel("稼働", { exact: true }).check();
  await page.getByRole("button", { name: "登録", exact: true }).click();
  const warnings = await expectSaved(page, `メンバー「${v.名前}」の登録`);
  if (warnings.length) console.warn(`メンバー「${v.名前}」の登録時の警告: ${warnings.join(" / ")}`);
  const m = /\/member\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`メンバー「${v.名前}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/** 登録済みのメンバーが求める内容と同じかを、メンバー編集画面で店舗IDまで確かめる。違えば、違う項目を挙げて止める */
export async function expectMemberByStoreIds(page: Page, 管理者ID: string, v: M0424MemberInput): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${管理者ID}/edit`));
  await page.waitForLoadState("load");
  await expect(f(page, "name"), `メンバー編集画面（管理者ID ${管理者ID}）`).toBeVisible();
  const selectedValues = async (selector: string) => (await page.locator(selector).evaluate((n) =>
    Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value))).sort().join("・");
  const got: Record<string, string> = {
    名前: await f(page, "name").inputValue(),
    ログインID: await f(page, "login_id").inputValue(),
    権限: ((await f(page, "Authority").locator("option:checked").textContent()) ?? "").trim(),
    所属店舗ID: await selectedValues('[name="admin_member[baseInfo]"]'),
    デフォルト検索表示店舗ID: await selectedValues('[name="admin_member[defaultSearchBaseInfo]"]'),
    編集可能店舗ID: await selectedValues('[name="admin_member[editableBaseInfos][]"]'),
    稼働: (await page.getByLabel("稼働", { exact: true }).isChecked()) ? "稼働" : "非稼働",
  };
  const want: Record<string, string> = {
    名前: v.名前, ログインID: v.ログインID, 権限: v.権限, 所属店舗ID: v.所属店舗ID, デフォルト検索表示店舗ID: v.デフォルト検索表示店舗ID,
    編集可能店舗ID: [...v.編集可能店舗ID].sort().join("・"), 稼働: "稼働",
  };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`メンバー「${v.名前}」（管理者ID ${管理者ID}）は登録済みだが、内容が違う: ${diff.join(" / ")}`);
}

/** あれば内容を確かめて使い、無ければ登録する。管理者IDを返す */
export async function ensureMemberByStoreIds(page: Page, v: M0424MemberInput): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (!found) return createMemberByStoreIds(page, v);
  await expectMemberByStoreIds(page, found, v);
  return found;
}
