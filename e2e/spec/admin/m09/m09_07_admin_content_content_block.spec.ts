/**
 * 管理画面 コンテンツ管理 ブロック管理（M09-07）E2E。納品ケース表
 * integration_test/e2e/m09_07_admin_content_content_block_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要シードは test.skip(!HAS_*) でガード、
 * 破壊的操作(登録/更新/削除)・ACEエディタ入力・仕様乖離(403/404・削除対象なし)は理由付き test.fixme で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m09-07_admin_content_content_block.md / 観点表)由来（オラクル独立性）。
 * フラッシュ文言(保存しました/削除しました/同じファイル名のデータが存在しています)は設計書が仕様として明記する範囲のみ判定に用いる。
 * pf-eccube3 由来設計だが刷新先 ec-cube-enterprise に同一画面(admin_content_block)が実在するためE2E化した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の login.spec.ts / m05・m06 spec も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報・シードが無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * シード/資格情報（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（SEED-M09-07-ADMIN）
 *  - BLOCK_DELETABLE_ID  : 削除可能（ユーザー作成）ブロックのID（SEED-M09-07-DELETABLE）
 *  - BLOCK_PROTECTED_ID  : 削除不可（初期投入）ブロックのID（SEED-M09-07-PROTECTED）
 *  - BLOCK_EXISTING_FILE : 既存ブロックのファイル名（重複検証用。SEED-M09-07-DELETABLE）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentBlockPage } from "../../../pages/admin/m09/m09_07_admin_content_content_block.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const BLOCK_DELETABLE_ID = process.env.BLOCK_DELETABLE_ID || "";
const BLOCK_PROTECTED_ID = process.env.BLOCK_PROTECTED_ID || "";

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/block(\\?|$)`);
const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/block/new(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/block/\\d+/edit(\\?|$)`);

// 仕様(設計書 表示メッセージ節)由来のフラッシュ文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_DONE = "保存しました"; // 登録/編集 保存成功
const DELETE_DONE = "削除しました"; // 削除成功
const FILE_DUP = "同じファイル名のデータが存在しています"; // ファイル名重複（先頭「※」は設計書のみ＝不具合候補#8）

/** 管理ログインしてブロック一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<ContentContentBlockPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const block = new ContentContentBlockPage(page);
  await block.gotoList();
  return block;
}

test.describe(
  "管理画面 > コンテンツ管理 > ブロック管理",
  { tag: ["@admin", "@content"] },
  () => {
    // ===== 認証不要・非破壊 =====

    test("E2E-M09-07-040 未ログインで一覧URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/block`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧（ログインのみ） =====

    test("E2E-M09-07-001 一覧: 新規作成ボタン・検索ボックス・ブロック名/ファイル名見出しが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      const block = await loginAndOpenList(page);
      await expect(page).toHaveURL(LIST_RE);
      await block.seeListUi();
    });

    test("E2E-M09-07-003 一覧: 新規作成リンク押下で新規作成フォームへ遷移", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const block = await loginAndOpenList(page);
      await block.newLink.first().click();
      await expect(page).toHaveURL(NEW_RE);
      await block.seeFormUi();
    });

    // ===== 新規作成フォーム（ログインのみ・バリデーション異常系は非破壊） =====
    // 013-016 はブロックデータ(block_html)を空のまま送信する。設計書では block_html は任意(フォーム制約なし)のため
    // これは仕様どおりで、検証失敗の主因は各ケースが意図する項目(ブロック名/ファイル名/文字種/長さ)になる。
    // 実装は block_html に NotBlank があり(不具合候補#5)、これが先に発火すると対象項目の検証可否を厳密に切り分けられない＝要確認。
    // 期待値は実装へ寄せない（block_html を埋めて回避しない）。主オラクルは「編集画面へ遷移しない＝登録不成立」で成立する。

    test("E2E-M09-07-010 新規作成フォーム: ブロック名・ファイル名・ブロックデータ欄・登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoNew();
      await expect(page).toHaveURL(NEW_RE);
      await block.seeFormUi();
    });

    test("E2E-M09-07-013 新規作成: ブロック名未入力で登録→検証エラーで新規フォームに滞留", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoNew();
      // ブロック名を空のまま送信。検証失敗で編集画面へリダイレクトせず新規フォームを再描画する（仕様: 検証失敗→同一フォーム再描画）。
      await block.fileName.fill("e2e_dummy_file");
      await block.submit();
      await expect(page).not.toHaveURL(EDIT_RE); // 登録成功なら編集画面へ遷移するため、滞留＝非登録の観測
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-07-014 新規作成: ファイル名未入力で登録→検証エラーで新規フォームに滞留", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoNew();
      await block.name.fill("E2Eダミーブロック");
      await block.submit(); // ファイル名空
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-07-015 新規作成: ファイル名に許可外文字(日本語)で登録→検証エラーで滞留", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoNew();
      await block.name.fill("E2Eダミーブロック");
      await block.fileName.fill("日本語ファイル名"); // 半角英数と _ / のみ許可（仕様）
      await block.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-07-016 新規作成: ブロック名255文字超で登録→検証エラーで滞留", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoNew();
      await block.name.fill("あ".repeat(256)); // 仕様: 最大255文字。256文字は境界外
      await block.fileName.fill("e2e_overlen_file");
      await block.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M09-07-018 新規作成: ファイル名255文字超で登録→検証エラーで滞留", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoNew();
      await block.name.fill("E2Eダミーブロック");
      await block.fileName.fill("a".repeat(256)); // 仕様: ファイル名 最大255文字。256文字は境界外（半角英数で文字種は適合）
      await block.submit();
      await expect(page).not.toHaveURL(EDIT_RE);
      await expect(page).toHaveURL(NEW_RE);
    });

    // ===== 一覧（要シード: 削除可否でUIが変わる） =====

    test("E2E-M09-07-005 一覧: 削除可能ブロックに編集リンクと削除アイコンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      test.skip(!BLOCK_DELETABLE_ID, "SEED-M09-07-DELETABLE 未設定（BLOCK_DELETABLE_ID）");
      const block = await loginAndOpenList(page);
      const row = page.locator(`#ex-block-${BLOCK_DELETABLE_ID}`);
      await expect(row.locator(`a[href*="/content/block/${BLOCK_DELETABLE_ID}/edit"]`)).toHaveCount(2); // 名称リンク＋編集アイコン
      await expect(row.locator(`a[data-bs-target="#confirmModal-${BLOCK_DELETABLE_ID}"]`)).toBeVisible();
    });

    test("E2E-M09-07-006 一覧: 削除不可ブロックは編集リンク・削除アイコンが表示されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      test.skip(!BLOCK_PROTECTED_ID, "SEED-M09-07-PROTECTED 未設定（BLOCK_PROTECTED_ID）");
      const block = await loginAndOpenList(page);
      const row = page.locator(`#ex-block-${BLOCK_PROTECTED_ID}`);
      await expect(row).toBeVisible();
      await expect(row.locator(`a[href*="/content/block/${BLOCK_PROTECTED_ID}/edit"]`)).toHaveCount(0);
      await expect(row.locator(`a[data-bs-target="#confirmModal-${BLOCK_PROTECTED_ID}"]`)).toHaveCount(0);
    });

    test("E2E-M09-07-007 一覧: 検索語入力で一致しないブロックが一覧に出ない（部分一致絞り込み）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      test.skip(!BLOCK_DELETABLE_ID, "SEED-M09-07-DELETABLE 未設定（一致行の存在が必要）");
      const block = await loginAndOpenList(page);
      // 期待は仕様(処理フロー: 検索語があるときブロック名・ファイル名を部分一致で絞り込む)由来。
      // 仕様の検索方式はGETの部分一致サーバ検索。実装はクライアントJS絞り込み＝不具合候補#6。
      // オラクルは方式に依らず観測可能な結果「一致しないブロックが一覧に表示されないこと」で判定する（実装の絞り込み機構を断定しない）。
      const before = await block.blockRows.evaluateAll(
        (els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).length
      );
      await block.searchBox.fill("zzz_no_match_zzz"); // どのブロック名・ファイル名にも一致しない語
      const after = await block.blockRows.evaluateAll(
        (els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).length
      );
      expect(after).toBeLessThan(before); // 一致しない行が一覧から外れる（仕様: 部分一致絞り込みの結果）
    });

    test("E2E-M09-07-008 一覧: 検索語に一致するブロックが一覧に残る（部分一致絞り込み 正常系）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      test.skip(!BLOCK_DELETABLE_ID, "SEED-M09-07-DELETABLE 未設定（一致行の存在が必要）");
      const block = await loginAndOpenList(page);
      // 期待は仕様(処理フロー: 検索語があるときブロック名・ファイル名を部分一致で絞り込む)由来の正常側。
      // SEED-M09-07-DELETABLE は file_name 接頭辞 e2e_block を持つ（付帯表3）。一致語で当該行が一覧に残ることを観測する。
      const row = page.locator(`#ex-block-${BLOCK_DELETABLE_ID}`);
      await expect(row).toBeVisible();
      await block.searchBox.fill("e2e_block"); // 当該ブロックのファイル名に一致する語
      await expect(row).toBeVisible(); // 一致するブロックは一覧に残る（仕様: 部分一致絞り込みの正常側）
    });

    test("E2E-M09-07-025 編集: ブロック名を空にして登録→検証エラーで編集フォームに滞留", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M09-07-ADMIN 未設定");
      test.skip(!BLOCK_DELETABLE_ID, "SEED-M09-07-DELETABLE 未設定（BLOCK_DELETABLE_ID）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const block = new ContentContentBlockPage(page);
      await block.gotoEdit(BLOCK_DELETABLE_ID);
      await expect(page).toHaveURL(EDIT_RE);
      await block.name.fill(""); // 現行ブロック名をクリアして送信（必須違反）
      await block.submit();
      // 仕様: 検証失敗→同一フォーム再描画。成功時の「保存しました」が出ない＝更新不成立を主オラクルとする（非破壊）。
      await expect(page).toHaveURL(EDIT_RE);
      await expect(page.locator("body")).not.toContainText(SAVE_DONE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M09-07-002 一覧がID降順で表示される（要: 既知ID順の複数ブロックシード。厳密順序は間接観測）",
      async () => {
        // 期待は仕様(処理フロー: ID降順取得)由来。SEED-M09-07-DELETABLE 複数件投入後に行のID順を検証する。
      }
    );

    test.fixme(
      "E2E-M09-07-004 削除可能ブロックの削除アイコン押下で削除確認が表示される（要実機確認: 実装はBootstrapモーダル＝不具合候補#2）",
      async () => {
        // 期待は仕様(確認ダイアログ「このブロックを削除してもよろしいですか？」)由来。実装は #confirmModal-{id}（admin.common.delete_modal__message）。
        // 文言乖離があり仕様どおりに書くと失敗で検出する。モーダル表示確認のセレクタを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M09-07-011 新規作成成功: 必須入力で登録し「保存しました」表示（要: ACEエディタ入力の実機確認＋破壊的登録）",
      async () => {
        // 期待は仕様(処理フロー: 登録→登録完了メッセージ)由来。ブロックデータ欄はACEエディタ(#editor)で
        // hidden #block_block_html への同期が要実機確認（不具合候補#4）。生成ブロックは識別接頭辞付きで後始末する。
        // 観測: SAVE_DONE("保存しました") 表示。
      }
    );

    test.fixme(
      "E2E-M09-07-012 新規作成成功後に登録ブロックの編集画面へ遷移（要: ACE入力＋破壊的登録）",
      async () => {
        // 期待は仕様(画面遷移: 新規作成保存成功→登録ブロックの編集画面)由来。遷移先 EDIT_RE を検証。
      }
    );

    test.fixme(
      "E2E-M09-07-017 既存ファイル名と重複で登録→「同じファイル名のデータが存在しています」（要: 既存ブロックシード＋ACE入力）",
      async () => {
        // 期待は仕様(エラー処理: ファイル名重複→重複エラー)由来。FILE_DUP を file_name 欄直下に確認。
        // 既存ブロックのファイル名(BLOCK_EXISTING_FILE)と同一端末種別(PC)で重複させる。
      }
    );

    test.fixme(
      "E2E-M09-07-026 ブロックデータ未入力でも登録成立（仕様: ブロックデータ任意。実装はNotBlank＝不具合候補#5。要: ACE入力＋破壊的登録）",
      async () => {
        // 期待は仕様(入力項目: ブロックデータは任意・フォーム制約なし)由来。ブロック名・ファイル名のみ入力し
        // block_html を空のまま登録→SAVE_DONE「保存しました」で登録成立を観測する。
        // 実装は #block_block_html に NotBlank+TwigLint があり空送信が弾かれる乖離。仕様(任意)どおり書き失敗で検出する。
      }
    );

    test.fixme(
      "E2E-M09-07-019 編集で他ブロックと同一ファイル名へ変更→「同じファイル名のデータが存在しています」（要: 2件シード＋ACE入力＋破壊的更新）",
      async () => {
        // 期待は仕様(業務ルール: ファイル名の一意性。編集時は自身のIDを除外して重複判定)由来。
        // 削除可能ブロックのファイル名を別の既存ブロックと同一へ変更し、FILE_DUP を file_name 欄直下に確認する。
        // 自身のファイル名を維持した更新は重複エラーにならない（自ID除外）ことを対で確認する。
      }
    );

    test.fixme(
      "E2E-M09-07-024 削除不可ブロックの編集更新POST→アクセス拒否で属性が更新されない（仕様HTTP403／実装404＝不具合候補#1。要: raw POST＋BLOCK_PROTECTED_ID）",
      async () => {
        // 期待は仕様(エッジケース/権限・認可: 削除不可ブロックの編集・更新はHTTP403アクセス拒否)由来。
        // /content/block/{削除不可ID}/edit へ POST し、当該ブロックの属性が更新されないこと（一覧で不変）を主オラクルとする。
        // 実装は NotFoundHttpException(404) で乖離。厳密403検証は乖離検出として要実機確認。CSRFトークンの取得を伴う raw POST。
      }
    );

    test.fixme(
      "E2E-M09-07-020 削除可能ブロックの編集リンク→編集フォームに現行ブロック名・ファイル名が表示（要: BLOCK_DELETABLE_ID）",
      async () => {
        // 期待は仕様(処理フロー: 編集フォーム表示)由来。/content/block/{id}/edit で #block_name に現行値が入る。
      }
    );

    test.fixme(
      "E2E-M09-07-021 編集成功: 内容更新で「保存しました」表示し同ブロックの編集画面へ（要: ACE入力＋破壊的更新）",
      async () => {
        // 期待は仕様(画面遷移: 編集保存成功→同ブロックの編集画面)由来。SAVE_DONE＋EDIT_RE を検証。
      }
    );

    test.fixme(
      "E2E-M09-07-022 削除不可ブロックの編集URL直接アクセス→アクセス拒否で編集フォーム非表示（仕様HTTP403／実装404＝不具合候補#1）",
      async () => {
        // 期待は仕様(権限・認可: 削除不可ブロックの編集はHTTP403アクセス拒否)由来。実装はNotFoundHttpException(404)で乖離。
        // 主観測「編集フォーム(#block_name)が表示されないこと」は両ステータスで成立。厳密403検証は乖離検出として要実機確認。
      }
    );

    test.fixme(
      "E2E-M09-07-023 存在しないIDの編集URL→見つからない(HTTP404)で編集フォーム非表示（要実機確認: ステータス）",
      async () => {
        // 期待は仕様(エラー処理: 対象ブロック無し→見つからない扱い)由来。編集フォーム非表示を観測。
      }
    );

    test.fixme(
      "E2E-M09-07-030 削除可能ブロックを削除→「削除しました」表示し一覧へ戻り行が消える（要: 破壊的削除＋使い捨てシード）",
      async () => {
        // 期待は仕様(処理フロー: 削除成功→削除完了メッセージ・一覧へ)由来。DELETE_DONE＋LIST_RE＋当該行消失を検証。
      }
    );

    test.fixme(
      "E2E-M09-07-031 削除対象が存在しないIDの削除→「削除に失敗しました」で一覧へ（仕様／実装は404＝不具合候補#7）",
      async () => {
        // 期待は仕様(エラー処理: 対象ブロック無し(削除)→削除対象なしメッセージで一覧へ)由来。
        // 実装はParamConverterでBlockをバインドし存在しないID時にNotFound(404)を返す乖離。仕様どおり書き失敗で検出。
      }
    );

    test.fixme(
      "E2E-M09-07-032 削除不可ブロックの削除リクエスト→レコード・ファイルとも削除されない（要: BLOCK_PROTECTED_ID＋破壊的削除検証）",
      async () => {
        // 期待は仕様(エッジケース: 削除不可ブロックの削除はレコード・ファイルとも削除しない)由来。
        // 一覧UIでは削除操作が非表示(006)のため、削除ルートへ直接リクエストし当該ブロックが一覧に残ることを観測する。
        // 実装の認可拒否ステータス(403/404)は不具合候補#1と同種の乖離として要実機確認。副作用なし（行が残る）を主オラクルとする。
      }
    );
  }
);
