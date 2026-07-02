/**
 * 管理画面 イベント管理 > イベント申込一括編集（M13-07）E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m13_07_admin_event_event_entry_bulk_update_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースを test() で実装する。
 * 申込ステータスを実際に更新する破壊系（010,011）・DB副作用の間接確認（012,013）・仕様乖離（030）は test.fixme（理由付き）で残す。
 * 手動/対象外（ログ出力抑止、同時更新、申込検索＝別機能委譲、文字列長/数値/文字種など本機能の入力に非該当の観点）は
 *   ケース表で全量管理しspecに残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m13-07_admin_event_event_entry_bulk_update.md／観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）であり、刷新先 ec-cube-enterprise との乖離（完了/失敗メッセージのロケールキー名・入口URLパス・
 *   非同期判定の有無）はケース表「付帯表4（不具合候補）」で管理し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11・m12系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 表示/モーダル/未選択アラート/検証失敗(400)は非破壊（申込ステータスを更新しない）ため test() で実装する。
 *    ただしモーダル・チェックボックスのレンダリングには編集可能店舗のイベント申込が1件以上必要（SEED-M13-07-ENTRY）。
 *  - 実更新（010）はステータスと申込履歴を破壊するため、専用イベント＋申込（使い捨て or 更新前へ復元）が必要＝test.fixme。
 *  - 結果は画面側で native alert() ＋ location.reload() で表示されるため、合否は JSON 応答(HTTP status)と dialog で観測する。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。2FA OFF のテスト用アカウント推奨。
 *  - SEED-M13-07-ENTRY : 編集可能店舗のイベント申込（複数件）＋申込ステータスマスタ（MtbEntryStatus）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventEntryBulkUpdatePage } from "../../../pages/admin/m13/m13_07_admin_event_event_entry_bulk_update.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/entry(\\?|$)`);
const BULK_UPDATE_RE = /\/event\/entry\/bulk_update(\?|$)/;

/** 管理ログインしてからイベント申込一覧を開く。 */
async function gotoListAsAdmin(page: Page): Promise<EventEventEntryBulkUpdatePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new EventEventEntryBulkUpdatePage(page);
  await target.goto();
  return target;
}

test.describe(
  "管理画面 > イベント管理 > イベント申込一括編集",
  { tag: ["@admin", "@event"] },
  () => {
    // ===== 権限・認可（未ログイン・非破壊・資格情報不要） =====

    test("E2E-M13-07-040 未ログインで申込一覧URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      // 期待は仕様（権限・認可: 未ログイン管理者はアクセス不可）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-07-041 未ログインで一括更新エンドポイントへ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      // 期待は仕様（権限・認可／URL直接アクセス）由来。一括更新は POST 専用だが、未ログインはルーティング前に
      // ファイアウォールで管理ログインへ誘導される（GET直アクセスで観測）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/bulk_update`);
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へ誘導される
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== UI部品（要 SEED-M13-07-ENTRY・非破壊） =====

    test("E2E-M13-07-001 申込一覧に「一括編集」の起点リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 要: 編集可能店舗のイベント申込が1件以上（SEED-M13-07-ENTRY）。一覧操作領域は該当データがある場合に表示される。
      const target = await gotoListAsAdmin(page);
      await expect(page).toHaveURL(LIST_RE);
      await expect(target.bulkEditLink).toBeVisible(); // 「一括編集」起点（フロント挙動: 複数選択し一括編集）
    });

    test("E2E-M13-07-002 一括編集起点から一括更新モーダル（申込ステータス選択・更新ボタン）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      await target.seeBulkUpdateModal(); // モーダル見出し・申込ステータス選択・更新ボタンの存在（見出し文言は実装ロケール由来のため存在のみ確認）
    });

    test("E2E-M13-07-003 一覧各行に選択チェックボックスと全選択チェックボックスが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoListAsAdmin(page);
      await expect(target.checkAll).toBeVisible(); // 全選択
      await expect(target.rowChecks.first()).toBeVisible(); // 行選択（対象申込の選択）
    });

    // ===== 異常系（検証失敗・非破壊：申込ステータスを更新しない） =====

    test("E2E-M13-07-020 対象申込を未選択で更新すると未選択エラーが表示され一括更新が実行されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様（入力項目: 対象申込は必須／エラー処理）由来。未選択時は画面側で警告が出て送信されない（処理されない）。
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      let dialogShown = false;
      let bulkRequested = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.accept();
      });
      page.on("request", (r) => {
        if (BULK_UPDATE_RE.test(r.url())) bulkRequested = true;
      });
      await target.clickUpdate(); // どの行も未選択のまま更新
      await page.waitForTimeout(500);
      expect(dialogShown).toBe(true); // 未選択である旨のエラーが表示される
      expect(bulkRequested).toBe(false); // 一括更新は実行されない（リクエストが飛ばない）
    });

    test("E2E-M13-07-021 申込ステータス未選択で更新すると検証失敗のエラーJSON(HTTP400)が返り処理されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様（入力項目: 申込ステータスは必須／検証失敗時はエラー内容のJSONを返す）由来。
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      expect(await target.selectRows(1)).toBe(1); // 対象申込を1件選択（前提：選択0件だと未選択エラーと混同するため独立確認）
      await target.clearStatus(); // 申込ステータスは未選択（プレースホルダ）
      const [resp] = await Promise.all([
        page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
        target.clickUpdate(),
      ]);
      expect(resp.status()).toBe(400); // 検証失敗＝エラーJSON（処理されない）
      expect(resp.headers()["content-type"]).toContain("json"); // 仕様: 検証失敗時はエラー内容のJSONを返す
    });

    test("E2E-M13-07-022 なりすまし対策トークン不正で更新すると検証失敗のエラーJSON(HTTP400)が返り処理されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様（CSRF: 不正リクエストは検証失敗でエラーJSON）由来。
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      expect(await target.selectRows(1)).toBe(1); // 対象申込を1件選択（前提：選択0件だと未選択エラーと混同するため独立確認）
      await target.selectStatusByIndex(1); // 有効な申込ステータス
      await target.tamperToken(); // なりすまし対策トークンを不正値へ
      const [resp] = await Promise.all([
        page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
        target.clickUpdate(),
      ]);
      expect(resp.status()).toBe(400); // 検証失敗＝エラーJSON（処理されない）
      expect(resp.headers()["content-type"]).toContain("json"); // 仕様: 検証失敗時はエラー内容のJSONを返す
    });

    test("E2E-M13-07-023 対象申込ID群が空のままサーバへ届くと検証失敗のエラーJSON(HTTP400)が返り処理されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様（入力項目: 対象申込は必須／エラー処理: 一括更新フォーム検証失敗→エラー内容のJSON）由来。
      // 020 は画面JSが空選択をalertで抑止する正常系の前段。本ケースは行の申込IDを非数値へ書き換え、
      //   サーバまでリクエストが到達したうえで対象申込ID群が空と判定される分岐（クライアント抑止のすり抜け）を観測する。
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      await target.selectStatusByIndex(1); // 有効な申込ステータス（ステータス未選択の021と独立させる）
      await target.tamperFirstRowEntryId("not-a-number"); // 送信される申込IDが空集合に縮退する
      const [resp] = await Promise.all([
        page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
        target.clickUpdate(),
      ]);
      expect(resp.status()).toBe(400); // 対象申込が無い＝エラーJSON（処理されない）
      expect(resp.headers()["content-type"]).toContain("json");
    });

    test("E2E-M13-07-024 存在しない申込IDを混入して更新すると失敗のエラーJSON(HTTP400)が返り処理されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様（処理フロー4: 指定された申込IDの申込を取得する／観点 IT-15 対象データ）由来。
      // 一覧チェックボックス由来の正常IDだけでなく、存在しない/削除済みの申込IDを送ったときに更新されないことを確認する。
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      await target.selectStatusByIndex(1);
      await target.tamperFirstRowEntryId("999999999"); // 実在しない申込ID
      const [resp] = await Promise.all([
        page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
        target.clickUpdate(),
      ]);
      expect(resp.status()).toBe(400); // 指定IDの申込が取得できない＝失敗JSON（処理されない）
      expect(resp.headers()["content-type"]).toContain("json");
    });

    test("E2E-M13-07-027 存在しない申込ステータスを送信すると検証失敗のエラーJSON(HTTP400)が返り処理されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 期待は仕様（入力項目: 申込ステータス／観点 IT-22 DBとの相関バリデーション）由来。
      // 021 は未選択の必須エラー。本ケースは選択肢制約に外れたマスタIDを送ったときの検証失敗を観測する（非破壊）。
      const target = await gotoListAsAdmin(page);
      await target.openBulkUpdateModal();
      expect(await target.selectRows(1)).toBe(1); // 対象申込を1件選択（未選択020と独立）
      await target.injectInvalidStatus(); // 選択肢に無い申込ステータスIDを注入して送信
      const [resp] = await Promise.all([
        page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
        target.clickUpdate(),
      ]);
      expect(resp.status()).toBe(400); // 選択肢外の値＝検証失敗エラーJSON（処理されない）
      expect(resp.headers()["content-type"]).toContain("json");
    });

    // ===== 保留（破壊系/DB間接/仕様乖離。抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-07-010 申込を選択しステータスを指定して一括更新すると完了メッセージのJSON(HTTP200)が返る（要 SEED-M13-07-ENTRY・破壊系）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様（処理フロー6: 完了メッセージのJSONを返す）由来。
        // 実更新は申込ステータス・申込履歴を破壊するため、使い捨て or 更新前へ復元できる専用申込シード投入後に有効化（fixme）。
        // 完了メッセージのロケールキーは設計書 admin.register.complete と実装 admin.event.entry.bulk_update.success が乖離（付帯表4#1）。
        //   合否は「完了メッセージのJSON(HTTP200)が返る」という抽象挙動で判定し、実装文言へオラクルを書き換えない。
        const target = await gotoListAsAdmin(page);
        await target.openBulkUpdateModal();
        expect(await target.selectRows(1)).toBe(1); // 対象申込を選択
        await target.selectStatusByIndex(1); // 有効な申込ステータス
        const [resp] = await Promise.all([
          page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
          target.clickUpdate(),
        ]);
        expect(resp.status()).toBe(200); // 一括更新完了
        expect(resp.headers()["content-type"]).toContain("json"); // 完了メッセージのJSONを返す
      }
    );

    test.fixme(
      "E2E-M13-07-011 一括更新は画面遷移せず非同期で結果を反映し一覧が再読込される（要 SEED-M13-07-ENTRY・破壊系）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様（画面遷移: 画面遷移せず非同期で結果を反映）由来。成功時 location.reload() で同一URLに留まることを観測。
        const target = await gotoListAsAdmin(page);
        await target.openBulkUpdateModal();
        expect(await target.selectRows(1)).toBe(1);
        await target.selectStatusByIndex(1);
        await Promise.all([
          page.waitForResponse((r) => BULK_UPDATE_RE.test(r.url())),
          target.clickUpdate(),
        ]);
        await expect(page).toHaveURL(LIST_RE); // 画面遷移せず（URLは申込一覧のまま）非同期で結果反映
      }
    );

    test.fixme(
      "E2E-M13-07-012 一括更新後、選択した申込の申込ステータスが指定値へ更新される（間接・要 SEED-M13-07-ENTRY）",
      async () => {
        // 期待は仕様（業務ルール: 一括変更／データ整合性: 再表示）由来。一覧に申込状況列が無いため再検索/編集画面で間接確認。手動/間接。
      }
    );

    test.fixme(
      "E2E-M13-07-013 一括更新ごとに申込履歴(dtb_entry_history)が記録される（間接・要 SEED-M13-07-ENTRY）",
      async () => {
        // 期待は仕様（ログ・監査: 申込履歴の記録／DBカラム）由来。履歴はブラウザ非表示のためDB/別画面で間接確認。手動/間接。
      }
    );

    test.fixme(
      "E2E-M13-07-030 非同期でないリクエストでは失敗メッセージのJSONを返す（仕様乖離・要確認）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様（エラー処理: 非同期でないリクエストは失敗メッセージのJSON）由来。
        // 実装(EntryController.php:300-335)に isXmlHttpRequest 判定が無く、非同期でなくても検証通過すれば成功し得る＝乖離（付帯表4#3）。
        // テストは仕様どおり「失敗JSON」を期待し、実装が違えば落ちて検出する（期待値を実装へ書き換えない）。
        const target = await gotoListAsAdmin(page);
        // page.request は X-Requested-With を付与しない＝非同期(XHR)でないリクエスト。
        const resp = await page.request.post(target.bulkUpdateUrl, { form: {} });
        // 仕様: 非同期でないリクエストは失敗メッセージのJSONを返す（実装乖離があれば落ちて検出する）。
        expect(resp.headers()["content-type"]).toContain("json");
        expect(resp.ok()).toBeFalsy();
      }
    );
  }
);
