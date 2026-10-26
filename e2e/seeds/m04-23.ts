/**
 * M04-23 在庫分割結合CSV登録の画面シード。正本: cases/M04-23_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（001・002。モーダルが開くことを見るもの）が使う S-M04-23-AUTH だけ。
 * 正本の投入方法は「管理画面のメンバー管理と編集可能店舗設定で登録する」。正本の値のうち、画面で決められないものがある:
 * - 管理者ID 423000021・店舗ID 423000001（試験店舗A（M04-23））は画面が振る番号で、指定できない。
 *   試験店舗A（M04-23）は、店名「試験店舗A（M04-23）」の店舗を使う（あれば使い、無ければ店舗登録する。店名は裁定 E09 で機能IDを付けた名前で、
 *   M04-09 の「試験店舗A」・M04-13 の「試験店舗A（M04-13）」とは別の店舗）。
 * - パスワード「M0423共通管理者用」は、メンバー登録画面の入力規則（半角の英字・数字を含む半角の記号・英数字だけ。アプリの設定
 *   eccube_password_pattern）に合わない。まず正本の値で登録し、画面が拒んだら、拒んだ文を報告に出して、
 *   入力規則に合う代わりの値で登録する（正本の外の補い。記録の裁定案）。
 * - 権限は、在庫分割・結合を操作できるものとして「システム管理者」（M04-02・M04-17 などと同じ）。
 *   所属店舗・デフォルト検索表示店舗は試験店舗A（M04-23）（メンバー登録画面で必須）、所属は選択肢の先頭。試験店舗B（M04-23） は編集可能店舗に入れない。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { findMemberId } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";
import { expectMemberByStoreIds } from "../pages/admin/m04_24_member";

/** 正本の店名（裁定 E09） */
const 試験店舗A = "試験店舗A（M04-23）";
const NAME = "M04-23試験管理者";
const LOGIN_ID = "m0423_admin";
/** 正本のパスワード */
const CANON_PASSWORD = "M0423共通管理者用";
/** 正本のパスワードを画面が拒んだときに使う代わりの値（入力規則: 半角の英字と数字を含む、半角の記号・英数字） */
const SUBSTITUTE_PASSWORD = "M0423Admin!21";

/** 実際にログインに使えるアカウント。シードが決める（正本のパスワードで登録できなければ代わりの値） */
let account: Account | null = null;
export function m0423Admin(): Account {
  if (!account) throw new Error("S-M04-23-AUTH をまだ作っていない");
  return account;
}

/** メンバー登録画面で、パスワードを変えて登録を試みる。画面の結果（成功・拒否の文）を返す */
async function tryRegister(page: Page, storeId: string, password: string): Promise<{ ok: true; id: string } | { ok: false; errors: string }> {
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  await f("name").fill(NAME);
  await f("baseInfo").selectOption(storeId);
  await f("department").selectOption({ index: 1 });
  await f("login_id").fill(LOGIN_ID);
  await f("email").fill("m0423_admin@example.test");
  await page.locator('[name="admin_member[plain_password][first]"]').fill(password);
  await page.locator('[name="admin_member[plain_password][second]"]').fill(password);
  await chooseByLabel(f("Authority"), "システム管理者");
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption([storeId]);
  await f("defaultSearchBaseInfo").selectOption(storeId);
  await page.getByLabel("稼働", { exact: true }).check();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "登録", exact: true }).click()]);
  try {
    await expectSaved(page, `メンバー「${NAME}」の登録`);
  } catch (e) {
    return { ok: false, errors: (e as Error).message.split("\n")[0] };
  }
  const m = /\/member\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`メンバー「${NAME}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  return { ok: true, id: m[1] };
}

/** アプリのパスワードの入力規則（アプリの設定 eccube_password_pattern と同じ式） */
const PASSWORD_RULE = /^(?=.*?[a-z])(?=.*?\d)[!-~]+$/i;

defineSeed("S-M04-23-AUTH", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  // 今回登録したときは、登録できた値。登録済みを使うとき（流し直し）は、正本の値が入力規則に合えば正本の値、合わなければ代わりの値
  let password = PASSWORD_RULE.test(CANON_PASSWORD) ? CANON_PASSWORD : SUBSTITUTE_PASSWORD;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const storeId = await ensureTenant(page, {
      店名: 試験店舗A, 店名カナ: "シケンテンポエー", 店名英語: "Test Store A", 支店URL: "m0423a", 店名略称3文字: "Q3A", ショップ名略称: 試験店舗A,
    }, issue);
    issue(`正本の店舗ID 423000001・管理者ID 423000021 は画面で指定できない。店舗は店舗一覧の「${試験店舗A}」（店舗ID ${storeId}）を使った`);
    let id = await findMemberId(page, NAME);
    if (!id) {
      const first = await tryRegister(page, storeId, CANON_PASSWORD);
      if (first.ok) { id = first.id; password = CANON_PASSWORD; }
      else {
        issue(`正本のパスワード「${CANON_PASSWORD}」でのメンバー登録を画面が拒んだ（${first.errors}）。入力規則に合う代わりの値「${SUBSTITUTE_PASSWORD}」で登録した`);
        const second = await tryRegister(page, storeId, SUBSTITUTE_PASSWORD);
        if (!second.ok) throw new Error(`代わりのパスワードでもメンバー登録できない: ${second.errors}`);
        id = second.id;
        password = SUBSTITUTE_PASSWORD;
      }
    }
    await expectMemberByStoreIds(page, id, {
      名前: NAME, ログインID: LOGIN_ID, メールアドレス: "m0423_admin@example.test", パスワード: "", 権限: "システム管理者",
      所属店舗ID: storeId, デフォルト検索表示店舗ID: storeId, 編集可能店舗ID: [storeId],
    });
  });
  // ログインの失敗を重ねない（正本の「ログイン失敗回数0」を崩さない）よう、別の値での試しのログインはしない
  if (password !== CANON_PASSWORD) issue(`ケースのログインは代わりのパスワード「${SUBSTITUTE_PASSWORD}」で行う`);
  account = { loginId: LOGIN_ID, password };
  await withAdminSession(browser, account, async () => undefined);
});
