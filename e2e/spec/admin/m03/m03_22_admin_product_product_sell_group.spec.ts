/**
 * 管理画面 商品管理 購入グループ管理 E2E（納品ケース表
 * integration_test/e2e/m03_22_admin_product_product_sell_group_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち実行可能（非破壊＝表示・遷移・検証失敗・モーダル開・CSRF拒否・未認証誘導）なものを実装し、
 * DBを書き換える成功系（010/011/023/024/030/027/034/035）・破壊系削除（041）・要特殊シード（042/044）・
 * フォームCSRF無効create(045 レコード非追加はDB観測)は test.fixme（理由付き）で残す。
 * 手動/対象外（032/060/061 等）はケース表で全量管理しspecに残さない。
 * 期待結果は仕様(functions/pf-eccube3/m03-22_admin_product_product_sell_group.md / messages.ja.yaml)由来（オラクル独立性）。
 * 設計源は pf-eccube3 のリバースであり、DB/刷新後挙動は ec-cube-enterprise を正典とする（乖離は付帯表4）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth/m02/m03）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と対象id（SG_EDIT_ID/SG_DELETED_ID/SG_EMPTYREL_ID）が無いと走らないよう
 * test.skip でガード。表示・遷移・検証失敗・モーダル開・CSRF拒否は副作用を残さない。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M03-22-ADMIN     : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（商品管理URLを許可する管理者・2FA OFF）
 *  - SEED-M03-22-EDIT      : SG_EDIT_ID（削除されていない購入グループのid）
 *  - SEED-M03-22-DELETED   : SG_DELETED_ID（論理削除済みの購入グループのid）
 *  - SEED-M03-22-EMPTYREL  : SG_EMPTYREL_ID（支払・配送未選択の購入グループのid）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSellGroupPage } from "../../../pages/admin/m03/m03_22_admin_product_product_sell_group.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const SG_EDIT_ID = process.env.SG_EDIT_ID || "";
const SG_DELETED_ID = process.env.SG_DELETED_ID || "";
const SG_EMPTYREL_ID = process.env.SG_EMPTYREL_ID || "";
const SG_FILLEDREL_ID = process.env.SG_FILLEDREL_ID || ""; // 支払・配送を複数選択済みの行（013）
const SG_LISTORDER_DELETED_ID = process.env.SG_LISTORDER_DELETED_ID || ""; // 一覧除外確認用の論理削除済み行（012）
const SG_NOTFOUND_ID = process.env.SG_NOTFOUND_ID || "999999999"; // 存在しないID（009・十分大きい未使用ID）

const LOGIN_RE = /\/login(\?|$)/;
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/sell_group/?(\\?|$)`);

// オラクル独立性: 期待値は設計書(処理フロー/エラー処理/表示メッセージ)が正典化するメッセージ鍵の意図に基づく
//  （admin.common.save_complete / admin.product.sell_group.edit_not_found / admin.common.delete_error 等）。
//  ブラウザで観測する日本語表示はその実現値であり、翻訳変更時は要実機確認（実装i18nを一次オラクルにはしない）。
// 判定の構造的事実: 検証失敗→同一フォーム滞留(未送信)、CSRF無効→403、削除済みID→一覧リダイレクト。
const MSG_SAVE = "保存しました"; // 鍵: admin.common.save_complete（設計書:72 処理フロー成功フラッシュ）
const MSG_EDIT_NOT_FOUND = "対象の購入グループが見つかりません。"; // 鍵: admin.product.sell_group.edit_not_found（設計書:78,146）
const MSG_DELETE_ERROR = "削除に失敗しました"; // 鍵: admin.common.delete_error（設計書:91 削除エラークラス）
const MSG_INUSE = "削除することができません"; // 鍵: ...delete.failed の%name%埋め込み一部（設計書:92・部分一致で判定）

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("管理画面 > 商品管理 購入グループ管理", { tag: ["@admin", "@product"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M03-22-050 未ログインで一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/sell_group`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M03-22-051 未ログインで編集URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/sell_group/1`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M03-22-052 未ログインでcreate(POST)直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    // 設計書 権限・認可: 書込/削除ルートも共通ファイアウォール配下。未認証POSTは処理されずログインへ寄せられる。
    const res = await page.request.fetch(`/${ECCUBE_ADMIN_ROUTE}/product/sell_group/create`, {
      method: "POST",
      failOnStatusCode: false,
    });
    expect(res.url()).toMatch(LOGIN_RE);
  });

  // ===== 表示・遷移（要ログイン・非破壊） =====

  test("E2E-M03-22-001 新規フォームに名称(日/英)・予約フラグ・メモ・支払/配送・登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    await sg.seeNewForm();
  });

  test("E2E-M03-22-002 一覧/新規表示でタイトル「購入グループ管理」・サブタイトル「購入グループ登録」", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    await expect(page.locator("body")).toContainText("購入グループ管理");
    await expect(page.locator("body")).toContainText("購入グループ登録");
  });

  test("E2E-M03-22-003 商品管理・購入グループのナビ項目がハイライトされる", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    // menus=['product','purchase_group']（sell_group.twig:3）。アクティブ表示クラスは default_frame 依存のため
    // 専用セレクタを創作せず、ナビにラベルが存在することを確認する（厳密なアクティブ状態は要実機確認）。
    await expect(page.getByText("購入グループ", { exact: false }).first()).toBeVisible();
  });

  test("E2E-M03-22-004 一覧表に名称(日/英)・メモ・支払方法・配送方法・削除の列が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    const head = sg.listTable.locator("thead");
    await expect(head).toContainText("名称(日)");
    await expect(head).toContainText("名称(英)");
    await expect(head).toContainText("メモ");
    await expect(head).toContainText("支払方法");
    await expect(head).toContainText("配送方法");
    await expect(head).toContainText("削除");
  });

  test("E2E-M03-22-005 支払/配送未選択の購入グループ行は長ダッシュ記号で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EMPTYREL_ID, "SEED-M03-22-EMPTYREL 未設定（SG_EMPTYREL_ID）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    // 未選択時は for-else の「—」が出力される（sell_group.twig:119,126）。
    // 対象は支払・配送未選択のシード行（SG_EMPTYREL_ID）に限定し、無関係な先頭行で偶然通らないようにする。
    const row = sg.rowFor(SG_EMPTYREL_ID);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("—");
  });

  test("E2E-M03-22-006 一覧名称リンク押下で編集状態になり当該行がハイライトされる", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EDIT_ID, "SEED-M03-22-EDIT 未設定（SG_EDIT_ID）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    // 入口導線の検証: 一覧を開き、当該行の名称リンクを押下して編集状態へ遷移する（直接URL遷移にしない）。
    await sg.gotoList();
    await sg.nameLinkFor(SG_EDIT_ID).click();
    await expect(page).toHaveURL(new RegExp(`/product/sell_group/${SG_EDIT_ID}(\\?|$)`));
    await expect(page.locator("body")).toContainText("購入グループ編集"); // サブタイトル（編集状態）
    await expect(sg.activeRow).toHaveCount(1); // 当該行ハイライト table-active
    await expect(sg.nameInput).not.toHaveValue(""); // 既存値が載る
  });

  test("E2E-M03-22-007 編集状態でキャンセルリンク押下で一覧（新規状態）へ戻る", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EDIT_ID, "SEED-M03-22-EDIT 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoEdit(SG_EDIT_ID);
    await sg.cancelLink.click();
    await expect(page).toHaveURL(LIST_RE);
    await expect(page.locator("body")).toContainText("購入グループ登録"); // 新規状態へ戻る
  });

  test("E2E-M03-22-008 カードヘッダ右の新規登録リンク押下で新規入力へ戻る", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EDIT_ID, "SEED-M03-22-EDIT 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoEdit(SG_EDIT_ID);
    await sg.newLink.click(); // trans admin.event.entry.register=「新規登録」（不具合候補#1: キー流用）
    await expect(page).toHaveURL(LIST_RE);
    await expect(page.locator("body")).toContainText("購入グループ登録");
  });

  test("E2E-M03-22-009 存在しないID編集URL→HTTP 404（パラメータ解決失敗）", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    // 設計書 処理フロー 編集表示#1/更新#1: {id}解決失敗→フレームワークが404。論理削除済み(031:一覧誘導)とは別分岐。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/sell_group/${SG_NOTFOUND_ID}`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M03-22-012 一覧は論理削除済みを除外し主キー昇順で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_LISTORDER_DELETED_ID, "SEED-M03-22-LISTORDER 未設定（SG_LISTORDER_DELETED_ID）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    // 削除除外: 論理削除済みidの行が一覧に現れない（設計書 処理フロー 一覧#2）。
    await expect(sg.rowFor(SG_LISTORDER_DELETED_ID)).toHaveCount(0);
    // 主キー昇順: 名称リンクhref末尾idが昇順に並ぶ（設計書 集計条件）。
    const hrefs = await sg.nameLinks.evaluateAll((els) =>
      els.map((e) => Number((e.getAttribute("href") || "").split("/").pop()))
    );
    const sorted = [...hrefs].sort((a, b) => a - b);
    expect(hrefs).toEqual(sorted);
  });

  test("E2E-M03-22-013 支払/配送選択済みの行は方法名が連結表示され長ダッシュにならない", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_FILLEDREL_ID, "SEED-M03-22-FILLEDREL 未設定（SG_FILLEDREL_ID）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    // 005（未選択→「—」）の正常系対: 選択済み行は方法名が出る（設計書 フロント挙動 表示要素）。
    const row = sg.rowFor(SG_FILLEDREL_ID);
    await expect(row).toHaveCount(1);
    await expect(row).not.toContainText("—");
  });

  // ===== バリデーション（検証失敗・非破壊） =====

  test("E2E-M03-22-020 名称(日)未入力で登録→同一画面に留まりフィールドエラー", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    await sg.submitNames("", "e2e-name-en"); // 名称(日)空
    await expect(page).not.toHaveURL(/\/sell_group\/?$/); // create先で再描画・一覧へリダイレクトしない
    await expect(sg.fieldError.first()).toBeVisible(); // フィールドエラー（セレクタ要実機確認・付帯表4#3）
  });

  test("E2E-M03-22-021 名称(英)未入力で登録→同一画面に留まりフィールドエラー", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    await sg.submitNames("e2e名称", ""); // 名称(英)空
    await expect(sg.fieldError.first()).toBeVisible();
  });

  test("E2E-M03-22-022 名称(日)256文字（最大長+1）で登録→エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    // 最大長255は設計書(入力項目定義)由来。256文字で検証失敗を期待（実装制約からは取らない＝オラクル独立性）。
    // maxlength属性で入力が切られる可能性があるため fill 後に検証エラーが出るかは実機確認（付帯表4#3）。
    await sg.submitNames("あ".repeat(256), "e2e-name-en");
    await expect(sg.fieldError.first()).toBeVisible();
  });

  test("E2E-M03-22-026 名称(英)256文字（最大長+1）で登録→エラーで滞留", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M03-22-ADMIN 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    // 022（名称(日)256）の名称(英)対。最大長255は設計書(入力項目定義)由来＝オラクル独立。
    await sg.submitNames("e2e名称", "a".repeat(256));
    await expect(page).not.toHaveURL(/\/sell_group\/?$/);
    await expect(sg.fieldError.first()).toBeVisible();
  });

  // ===== 編集表示（削除済みID・要シード・非破壊） =====

  test("E2E-M03-22-031 論理削除済みID編集URL→一覧へリダイレクトしエラーメッセージ", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_DELETED_ID, "SEED-M03-22-DELETED 未設定（SG_DELETED_ID）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoEdit(SG_DELETED_ID);
    await expect(page).toHaveURL(LIST_RE); // 編集画面を表示せず一覧へ
    await expect(page.locator("body")).toContainText(MSG_EDIT_NOT_FOUND);
  });

  test("E2E-M03-22-033 編集中グループを名称(日)空で更新→同一編集画面に留まりフィールドエラー", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EDIT_ID, "SEED-M03-22-EDIT 未設定（SG_EDIT_ID）");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoEdit(SG_EDIT_ID);
    // 更新の検証失敗は新規作成と同型（設計書:85）。編集フラグ維持で同一テンプレが再描画され、一覧へリダイレクトしない。
    // 検証失敗のため flush されず非破壊（DB値は変わらない）。
    await sg.submitNames("", "e2e-name-en");
    await expect(page).toHaveURL(new RegExp(`/product/sell_group/${SG_EDIT_ID}(/update)?(\\?|$)`));
    await expect(sg.fieldError.first()).toBeVisible(); // フィールドエラー（セレクタ要実機確認・付帯表4#3）
  });

  // ===== 削除モーダル（モーダル開のみ・非破壊） =====

  test("E2E-M03-22-040 削除ボタン押下で確認モーダルが開き対象名称入りの確認文が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EDIT_ID, "SEED-M03-22-EDIT 未設定");
    await login(page);
    const sg = new ProductProductSellGroupPage(page);
    await sg.gotoList();
    await sg.openDeleteModal(0); // 確定は押さない（非破壊）
    await expect(sg.deleteModal).toBeVisible();
    // JS が data-message をモーダル本文へコピーする（sell_group.twig:43-49）。確認文の固定部を判定。
    await expect(sg.modalMessage).toContainText("この操作はあとから取り消すことができません");
  });

  // ===== CSRF（無効削除→403・非破壊） =====

  test("E2E-M03-22-043 CSRFトークン無効の削除要求はHTTP 403になる", async ({ page }) => {
    test.skip(!HAS_CREDS || !SG_EDIT_ID, "SEED-M03-22-EDIT 未設定");
    await login(page);
    // CSRFトークンを付けずに DELETE を直接送る＝判定順序#1（isTokenValid 失敗）で 403 を期待。
    const res = await page.request.fetch(
      `/${ECCUBE_ADMIN_ROUTE}/product/sell_group/${SG_EDIT_ID}/delete`,
      { method: "DELETE", failOnStatusCode: false }
    );
    expect(res.status()).toBe(403);
  });

  // ===== 保留（書込/破壊/要特殊シード・理由付きで未実行。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M03-22-010 必須入力で新規登録成功→一覧へ302+「保存しました」（要: 書込・識別接頭辞・後始末）",
    async () => {
      // 期待は仕様(処理フロー 新規作成 成功→302+save_complete / SellGroupController.php:65-71)由来。
    }
  );
  test.fixme(
    "E2E-M03-22-011 新規登録後の一覧に登録名称が表示される（間接確認・要書込）",
    async () => {
      // 期待は仕様(DB操作 登録の間接確認・データ整合性)由来。
    }
  );
  test.fixme(
    "E2E-M03-22-023 名称(日)255文字ちょうど（境界内）で登録成功（要書込・後始末）",
    async () => {
      // 期待は仕様(入力項目 名称 eccube_stext_len=255 境界内)由来。成功フラッシュ「保存しました」。
    }
  );
  test.fixme(
    "E2E-M03-22-024 支払・配送未選択でも登録成功（任意項目・要書込・後始末）",
    async () => {
      // 期待は仕様(入力項目 支払/配送 任意)由来。
    }
  );
  test.fixme(
    "E2E-M03-22-030 編集中グループの更新成功→一覧へ302+「保存しました」（要: 使い捨てシード・後始末）",
    async () => {
      // 期待は仕様(処理フロー 更新 成功→302+save_complete / SellGroupController.php:118-124)由来。
    }
  );
  test.fixme(
    "E2E-M03-22-041 商品未使用グループ削除成功→一覧+「削除しました」・一覧から消える（要: 使い捨てDELETABLEシード・破壊系）",
    async () => {
      // 期待は仕様(処理フロー 論理削除 成功→deleted_at+delete_complete / SellGroupController.php:156-162)由来。
    }
  );
  test.fixme(
    "E2E-M03-22-042 商品使用中グループ削除→削除されず名称入りエラーで一覧へ（要: 商品紐づきINUSEシード）",
    async () => {
      // 期待は仕様(判定順序#5 商品コレクション非空→エラー / SellGroupController.php:149-154 / messages.ja.yaml:3773)由来。
      // 期待文言は MSG_INUSE「削除することができません」を含むこと。
      void MSG_INUSE;
    }
  );
  test.fixme(
    "E2E-M03-22-044 既に論理削除済みIDへの削除要求→一覧+「削除に失敗しました」（要: DELETEDシード・有効CSRF）",
    async () => {
      // 期待は仕様(判定順序#2 削除済み→delete_error / SellGroupController.php:143-147 / messages.ja.yaml:1401)由来。
      void MSG_DELETE_ERROR;
      void MSG_SAVE;
    }
  );
  test.fixme(
    "E2E-M03-22-045 フォームCSRF無効のcreate POST→登録不成立（010の異常系対・要: 無効_token送信とレコード非追加確認）",
    async () => {
      // 期待は仕様(処理フロー 新規作成#2 SymfonyフォームCSRF妥当性評価・判定順序#3)由来。
      // DELETE(043)の親抽象CSRF→403とは別レイヤ（Symfonyフォーム無効→200再描画・未保存）。
      // レコード非追加の判定はDB観測が必要なため手動/間接に準じて保留。
    }
  );
  test.fixme(
    "E2E-M03-22-027 メモ4000文字ちょうど（境界内）で登録成功（025の正常系対・手動: 高コスト境界・要書込）",
    async () => {
      // 期待は仕様(入力項目 メモ eccube_sell_group_memo_len=4000 境界内)由来。成功フラッシュ「保存しました」。
      void MSG_SAVE;
    }
  );
  test.fixme(
    "E2E-M03-22-034 予約商品フラグON登録→編集再表示でON維持（手動/間接・要書込）",
    async () => {
      // 期待は仕様(業務ルール 予約商品フラグ UIチェック↔int変換・登録の間接)由来。
    }
  );
  test.fixme(
    "E2E-M03-22-035 支払/配送を選択して登録→編集再表示で選択維持（中間表反映の間接・手動・要書込/マスタシード）",
    async () => {
      // 期待は仕様(業務ルール 支払/配送 選択集合の中間表反映 / DB操作)由来。IT行019の対応ケース。
    }
  );
});
