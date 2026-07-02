/**
 * 管理画面 システム設定 > メンバー管理一覧 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m11_01_admin_system_setting_setting_system_member_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 削除(DELETE)・上下移動(PUT)・要既知sort_noシード・自身行特定・CSRF改ざん・404確認は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m11-01_..._member_list.md／観点表／基本設計）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（削除モーダル・404・ROLE_SYSTEMゲート・絞り込み追加・
 * 稼働列廃止・フラッシュ文言・タイトル/サブタイトル割当の逆転#7・上下Ajaxのフラッシュ非表示#8・上下CSRFトークン欠落#9）は
 * ケース表「付帯表4」に出し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m10系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 表示・遷移（GET）・クライアント側フィルタ/ソート・モーダル開閉キャンセルは DB を変更せず安全に実行できる。
 *  - 削除(020)・上下移動(021/022)・sort_no降順の厳密確認(012)・自身行削除非活性(006)・404(030)・CSRF(040)は
 *    破壊的/要シード/要改ざんのため test.fixme。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。操作系は ROLE_SYSTEM 相当を推奨（付帯表4#3）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SystemSettingSettingSystemMemberListPage } from "../../../pages/admin/m11/m11_01_admin_system_setting_setting_system_member_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member/new(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member/\\d+/edit(\\?|$)`);

/** 管理ログインしてからメンバー一覧画面を開く。 */
async function gotoListAsAdmin(
  page: Page
): Promise<SystemSettingSettingSystemMemberListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const list = new SystemSettingSettingSystemMemberListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > システム設定 > メンバー管理一覧",
  { tag: ["@admin", "@system", "@setting"] },
  () => {
    // ===== 表示・遷移（GET・非破壊） =====

    test("E2E-M11-01-001 一覧画面が開きタイトルブロック「システム設定」/サブ「メンバー管理」が表示される（正典line5）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.seeListPage();
    });

    test("E2E-M11-01-002 一覧テーブルに名前/所属/権限/稼働の列見出しとメンバー行が表示される（正典line54/79）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.seeColumnsAndRows();
    });

    test("E2E-M11-01-003 画面に新規登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await expect(list.newButton).toBeVisible();
    });

    test("E2E-M11-01-004 新規登録ボタン押下でメンバー登録画面（新規）へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      await list.clickNew();
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M11-01-005 行の編集アイコン押下でメンバー編集画面（既存）へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（操作は ROLE_SYSTEM 前提・付帯表4#3）");
      const list = await gotoListAsAdmin(page);
      const editLink = page.locator("a.action-edit:not(.disabled)").first();
      await expect(editLink, "活性な編集リンク（ROLE_SYSTEM・自分以外の行）が必要").toBeVisible();
      await editLink.click();
      await expect(page).toHaveURL(EDIT_RE); // /member/{id}/edit
    });

    test("E2E-M11-01-009 所属フィルタで非該当の所属の行が一覧から隠れる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 先頭の有効な所属option（value!=''）で絞り込み、表示行がその所属のみになることを確認。
      const optionValue = await list.filterDepartment
        .locator('option[value]:not([value=""])')
        .first()
        .getAttribute("value");
      test.skip(!optionValue, "所属マスタが空（SEED-M11-01-MEMBERS 未投入）");
      await list.filterByDepartment(optionValue!);
      // 仕様（選択した所属の行のみ表示・非該当は非表示）どおり、各行の「表示中か」が
      // 「所属が選択値と一致するか」と一致することを検証する（0件でも非該当が隠れたことを担保）。
      const rows = await list.memberRowVisibilityByDepartment();
      for (const r of rows) {
        expect(
          r.visible,
          `所属一致行のみ表示されること（dep=${r.departmentId} / 選択=${optionValue}）`
        ).toBe(r.departmentId === optionValue);
      }
    });

    test("E2E-M11-01-010 権限フィルタで非該当の権限の行が一覧から隠れる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      const optionValue = await list.filterAuthority
        .locator('option[value]:not([value=""])')
        .first()
        .getAttribute("value");
      test.skip(!optionValue, "権限マスタが空（SEED-M11-01-MEMBERS 未投入）");
      await list.filterByAuthority(optionValue!);
      // 仕様（選択した権限の行のみ表示・非該当は非表示）どおり、各行の「表示中か」が
      // 「権限が選択値と一致するか」と一致することを検証する。
      const rows = await list.memberRowVisibilityByAuthority();
      for (const r of rows) {
        expect(
          r.visible,
          `権限一致行のみ表示されること（auth=${r.authorityId} / 選択=${optionValue}）`
        ).toBe(r.authorityId === optionValue);
      }
    });

    test("E2E-M11-01-011 所属列ヘッダ押下で行の並び替えができる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      const before = await list.allMemberIds();
      test.skip(before.length < 2, "2件以上のメンバーが必要（SEED-M11-01-MEMBERS）");
      await list.sortDepartmentHeader.click();
      // 仕様「所属の値で行が並び替わる（クライアント側ソート）」を検証する。
      // 昇順/降順いずれかの方向は実装挙動なので固定せず、所属名でソート済みであることのみを確認する。
      const names = await list.memberDepartmentNames();
      const asc = [...names].sort((a, b) => a.localeCompare(b, "ja"));
      const desc = [...asc].reverse();
      const key = (xs: string[]) => xs.join("");
      const isSorted = key(names) === key(asc) || key(names) === key(desc);
      expect(
        isSorted,
        `所属列ヘッダ押下で行が所属名でソートされること（実際: ${names.join(",")}）`
      ).toBeTruthy();
    });

    test("E2E-M11-01-023 削除アイコン押下で確認モーダルが開きキャンセルで閉じられる（非破壊）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（削除モーダルは ROLE_SYSTEM・自分以外の行で表示）");
      const list = await gotoListAsAdmin(page);
      const deleteLink = page
        .locator('a.action-delete[data-bs-toggle="modal"]')
        .first();
      await expect(
        deleteLink,
        "モーダル起動の削除リンク（ROLE_SYSTEM・自分以外の行）が必要"
      ).toBeVisible();
      const target = await deleteLink.getAttribute("data-bs-target"); // #member_delete_{id}
      const modal = page.locator(target!);
      await deleteLink.click();
      await expect(modal).toBeVisible();
      await modal.locator("button.btn-ec-sub").click(); // キャンセル
      await expect(modal).toBeHidden();
    });

    test("E2E-M11-01-015 一覧に件数表示・ページングが無い（正典line65/95）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await gotoListAsAdmin(page);
      // 期待は仕様（利用者視点の入口 line65「件数表示・ページングはない」／集計 line95「件数集計・ページング処理は行わない」）由来。
      // ページネーション要素が存在しないことを確認する（セレクタは要実機確認。共通ページャの一般的クラスで不在を確認）。
      await expect(list.memberRows.first()).toBeVisible();
      expect(await page.locator(".pagination, nav[aria-label='pagination'], .c-pager").count()).toBe(0);
    });

    test("E2E-M11-01-007 一覧先頭行では「上へ」が非活性で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（操作は ROLE_SYSTEM 前提）");
      const list = await gotoListAsAdmin(page);
      const upLinks = page.locator("a.action-up");
      test.skip((await upLinks.count()) < 1, "上へリンクが無い（ROLE_SYSTEM・2件以上が必要）");
      await expect(upLinks.first()).toHaveClass(/disabled/);
    });

    test("E2E-M11-01-008 一覧末尾行では「下へ」が非活性で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（操作は ROLE_SYSTEM 前提）");
      const list = await gotoListAsAdmin(page);
      const downLinks = page.locator("a.action-down");
      test.skip((await downLinks.count()) < 1, "下へリンクが無い（ROLE_SYSTEM・2件以上が必要）");
      await expect(downLinks.last()).toHaveClass(/disabled/);
    });

    // ===== 未ログインガード（資格情報不要） =====

    test("E2E-M11-01-013 未ログインで一覧URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/member`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（破壊的/要シード/要改ざん。理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M11-01-006 ログイン中メンバー自身の行では削除リンクが非活性（要: ログイン中メンバーIDの特定）",
      async () => {
        // 期待は仕様（フロント挙動・表示条件付き要素）由来。app.user.id の行を特定する手段を実機確認後に実装。
        // 刷新先は member.twig:253 で「自身 or not ROLE_SYSTEM」で削除を disabled（付帯表4#3）。
      }
    );

    test.fixme(
      "E2E-M11-01-012 一覧の初期並びが sort_no 降順（要: SEED-M11-01-ORDER 既知sort_no）",
      async () => {
        // 期待は仕様（集計条件: sort_no 降順）由来。既知 sort_no のシード投入後、行順を厳密照合する。
      }
    );

    test.fixme(
      "E2E-M11-01-014 稼働条件で絞り込まず非稼働メンバーも一覧に表示される（要: SEED-M11-01-WORK 稼働/非稼働）",
      async () => {
        // 期待は仕様（データ整合性 line172／集計条件 line123: 一覧は稼働条件なし取得＝非稼働メンバーも表示）由来。
        // 刷新先一覧に稼働判定列が無い（付帯表4#5）ため、SEED で投入した非稼働メンバーの行 #ex-member-{id} が
        // 稼働メンバーと同様に表示されることを確認する。手動の保存失敗系（031削除失敗・032移動失敗・033上下404）は
        // 破壊試行/直接リクエストが必要なためケース表のみで管理（spec に fixme を増やさない）。
      }
    );

    test.fixme(
      "E2E-M11-01-020 他行の削除で成功フラッシュ表示＋当該行が一覧から消える（要: SEED-M11-01-DELETE 使い捨て・破壊的）",
      async () => {
        // 期待は仕様（処理フロー: 削除成功→削除完了メッセージ＋一覧）由来。
        // 観測は .alert-success の表示＋当該 #ex-member-{id} の消滅で判定（フラッシュ文言の相違は付帯表4#6）。
      }
    );

    test.fixme(
      "E2E-M11-01-021 「上へ」実行で隣接行と表示順入替＋成功フラッシュ（要: SEED-M11-01-ORDER 使い捨て・破壊的）",
      async () => {
        // 期待は仕様（処理フロー: 上へ成功→移動完了＋一覧）由来。.alert-success＋行順入替で判定。
        // 刷新実装は Ajax で DOM のみ入替し再読込/フラッシュをしない（付帯表4#8）、かつ up アンカーに
        // csrf_token_for_anchor() が無く isTokenValid() で拒否され得る（付帯表4#9）。テストは仕様どおりに書き乖離を検出する。
      }
    );

    test.fixme(
      "E2E-M11-01-022 「下へ」実行で隣接行と表示順入替＋成功フラッシュ（要: SEED-M11-01-ORDER 使い捨て・破壊的）",
      async () => {
        // 期待は仕様（処理フロー: 下へ成功→移動完了＋一覧）由来。.alert-success＋行順入替で判定。
        // 刷新実装の乖離（Ajax DOM 入替=フラッシュ非表示=付帯表4#8 / down アンカーの CSRF トークン欠落=付帯表4#9）は仕様どおりに書き検出する。
      }
    );

    test.fixme(
      "E2E-M11-01-030 存在しないIDで削除→仕様は削除警告＋一覧（刷新先は404＝付帯表4#2／要: CSRFトークン抽出＋DELETE手動発行）",
      async () => {
        // 期待は仕様（判定順序#3: 削除対象不在は警告フラッシュ・404にしない）由来。
        // 刷新先 ParamConverter は不在IDで404を返すため、テストは仕様どおりに書き乖離を検出する。
      }
    );

    test.fixme(
      "E2E-M11-01-040 トークン不正な削除/上下はアクセス拒否（要: CSRFトークン改ざん）",
      async () => {
        // 期待は仕様（判定順序#1: トークン不正＝アクセス拒否）由来。CSRFはSymfony内部完結のため手動補足。
      }
    );
  }
);
