/** メンバー管理・メンバー登録（メニュー「システム設定」→「メンバー管理」） */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

export type MemberInput = {
  名前: string; 所属店舗: string; ログインID: string; メールアドレス: string; パスワード: string;
  権限: string; デフォルト検索表示店舗: string; 編集可能店舗: string[];
};

/** メンバー管理の一覧で、名前の行から管理者IDを読む。無ければ null */
export async function findMemberId(page: Page, 名前: string): Promise<string | null> {
  // 一覧が開けなかったとき（環境が遅く、時間切れの500になるなど）を「いない」と取り違えて二重に登録しない
  const res = await page.goto(adminUrl("/setting/system/member"));
  if (!res || !res.ok()) throw new Error(`メンバー一覧を開けない（応答 ${res?.status() ?? "なし"}）。名前「${名前}」のメンバーがいるかを確かめられない`);
  const rows = page.locator('tr[id^="ex-member-"]').filter({ has: page.locator("td").first().getByText(名前, { exact: true }) });
  const n = await rows.count();
  if (n === 0) return null;
  if (n > 1) throw new Error(`名前「${名前}」のメンバーが複数いる。どれを使うか決められない`);
  return ((await rows.first().getAttribute("id")) ?? "").replace("ex-member-", "");
}

/** メンバー登録画面で登録する。遷移したメンバー編集画面のアドレスから管理者IDを読んで返す */
export async function createMember(page: Page, v: MemberInput): Promise<string> {
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  await f("name").fill(v.名前);
  await chooseByLabel(f("baseInfo"), v.所属店舗);
  await f("department").selectOption({ index: 1 });
  await f("login_id").fill(v.ログインID);
  await f("email").fill(v.メールアドレス);
  await page.locator('[name="admin_member[plain_password][first]"]').fill(v.パスワード);
  await page.locator('[name="admin_member[plain_password][second]"]').fill(v.パスワード);
  await chooseByLabel(f("Authority"), v.権限);
  // デフォルト検索表示店舗の選択肢は、編集可能店舗の選択に連動して変わる
  await chooseByLabel(page.locator('[name="admin_member[editableBaseInfos][]"]'), v.編集可能店舗);
  await chooseByLabel(f("defaultSearchBaseInfo"), v.デフォルト検索表示店舗);
  await page.getByLabel("稼働", { exact: true }).check();
  await page.getByRole("button", { name: "登録", exact: true }).click();
  const warnings = await expectSaved(page, `メンバー「${v.名前}」の登録`);
  if (warnings.length) console.warn(`メンバー「${v.名前}」の登録時の警告: ${warnings.join(" / ")}`);
  const m = /\/member\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`メンバー「${v.名前}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/**
 * 登録済みのメンバーが、求める内容と同じかをメンバー編集画面で確かめる。違えば、違う項目を挙げて落とす
 * （同じ名前の別のメンバーを、黙って使わない）。パスワードは画面に出ないので、そのメンバーでログインするときに分かる。
 */
export async function expectMember(page: Page, 管理者ID: string, v: MemberInput): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${管理者ID}/edit`));
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  const sel = async (name: string) => (await page.locator(`[name="admin_member[${name}]"] option:checked`).allInnerTexts()).map((t) => t.trim()).sort().join("、");
  const got: Record<string, string> = {
    名前: await f("name").inputValue(), ログインID: await f("login_id").inputValue(), 所属店舗: await sel("baseInfo"), 権限: await sel("Authority"),
    デフォルト検索表示店舗: await sel("defaultSearchBaseInfo"), 編集可能店舗: await sel("editableBaseInfos]["),
    稼働: (await page.getByLabel("稼働", { exact: true }).isChecked()) ? "稼働" : "非稼働",
  };
  const want: Record<string, string> = {
    名前: v.名前, ログインID: v.ログインID, 所属店舗: v.所属店舗, 権限: v.権限, デフォルト検索表示店舗: v.デフォルト検索表示店舗,
    編集可能店舗: [...v.編集可能店舗].sort().join("、"), 稼働: "稼働",
  };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`メンバー「${v.名前}」（管理者ID ${管理者ID}）は登録済みだが、内容が違う: ${diff.join(" / ")}`);
}

/** あれば内容を確かめて使い、無ければ登録する */
export async function ensureMember(page: Page, v: MemberInput): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (!found) return createMember(page, v);
  await expectMember(page, found, v);
  return found;
}
