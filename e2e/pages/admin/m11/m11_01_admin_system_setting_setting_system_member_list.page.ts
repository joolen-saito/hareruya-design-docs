import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 システム設定 > メンバー管理一覧 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m11_01_admin_system_setting_setting_system_member_list_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m11-01_..._member_list.md／観点表／基本設計）由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。pf-eccube3 設計と刷新先 ec-cube-enterprise の乖離はケース表「付帯表4」に記録し、
 * テストは仕様どおりに書く（実装が違えば落ちて検出する）。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。
 *
 * 由来（@admin/Setting/System/member.twig・@admin/default_frame.twig・@admin/alert.twig）:
 *  - route admin_setting_system_member = GET/PUT /%admin_route%/setting/system/member（MemberController.php:58）
 *  - ページ見出し DOM: h2.c-pageTitle__title / span.c-pageTitle__subTitle（default_frame.twig:196 ← member.twig:15-16 block title/sub_title）。
 *    期待値は正典 line5（タイトルブロック=システム設定／サブタイトル=メンバー管理）由来。刷新実装はこの割当が逆＝付帯表4#7。
 *  - 新規登録ボタン a.btn-ec-regular trans admin.common.registration__new「新規登録」（member.twig:110 / messages.ja.yaml:1437）
 *  - 所属フィルタ #filter_department（member.twig:115）/ 権限フィルタ #filter_authority（member.twig:122）
 *  - 列見出し 名前/所属（member.twig:137,140）・権限 admin.common.authority（member.twig:144 / messages.ja.yaml:1649）
 *  - メンバー行 tr#ex-member-{id}（member.twig:164）data-department-id / data-authority-id
 *  - 行内 編集 a.action-edit（member.twig:223）/ 上へ a.action-up（member.twig:232）/ 下へ a.action-down（member.twig:242）
 *  - 削除 a.action-delete（member.twig:254/262）→ 確認モーダル #member_delete_{id}（member.twig:268）内 a.btn-ec-delete（member.twig:288）/ キャンセル button.btn-ec-sub（member.twig:286）
 *  - 成功フラッシュ .alert-success（alert.twig:22）/ 失敗フラッシュ .alert-danger（alert.twig:32）
 *  - ソート列ヘッダ th.sortable[data-sort=department|authority]（member.twig:139,143）
 */
export class SystemSettingSettingSystemMemberListPage {
  readonly page: Page;
  readonly url: string;

  readonly pageTitle: Locator; // h2.c-pageTitle__title「メンバー管理」
  readonly subTitle: Locator; // span.c-pageTitle__subTitle「システム設定」
  readonly newButton: Locator; // a.btn-ec-regular「新規登録」(member.twig:110)
  readonly filterDepartment: Locator; // #filter_department (member.twig:115)
  readonly filterAuthority: Locator; // #filter_authority (member.twig:122)
  readonly memberRows: Locator; // tr[id^=ex-member-] (member.twig:164)
  readonly sortDepartmentHeader: Locator; // th.sortable[data-sort=department] (member.twig:139)
  readonly sortAuthorityHeader: Locator; // th.sortable[data-sort=authority] (member.twig:143)
  readonly alertSuccess: Locator; // .alert-success (alert.twig:22)
  readonly alertDanger: Locator; // .alert-danger (alert.twig:32)

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/system/member`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.subTitle = page.locator("span.c-pageTitle__subTitle");
    this.newButton = page.getByRole("link", { name: "新規登録" });
    this.filterDepartment = page.locator("#filter_department");
    this.filterAuthority = page.locator("#filter_authority");
    this.memberRows = page.locator('tr[id^="ex-member-"]');
    this.sortDepartmentHeader = page.locator('th.sortable[data-sort="department"]');
    this.sortAuthorityHeader = page.locator('th.sortable[data-sort="authority"]');
    this.alertSuccess = page.locator(".alert-success");
    this.alertDanger = page.locator(".alert-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 指定メンバーIDの行。 */
  row(memberId: number | string): Locator {
    return this.page.locator(`#ex-member-${memberId}`);
  }

  /** 指定行の編集アイコン（a.action-edit）。 */
  editLink(memberId: number | string): Locator {
    return this.row(memberId).locator("a.action-edit");
  }

  /** 指定行の削除アイコン（a.action-delete）。 */
  deleteLink(memberId: number | string): Locator {
    return this.row(memberId).locator("a.action-delete");
  }

  /** 指定行の「上へ」アイコン（a.action-up）。 */
  upLink(memberId: number | string): Locator {
    return this.row(memberId).locator("a.action-up");
  }

  /** 指定行の「下へ」アイコン（a.action-down）。 */
  downLink(memberId: number | string): Locator {
    return this.row(memberId).locator("a.action-down");
  }

  /** 削除確認モーダル #member_delete_{id}（member.twig:268）。 */
  deleteModal(memberId: number | string): Locator {
    return this.page.locator(`#member_delete_${memberId}`);
  }

  /** 一覧画面の主要UI部品が仕様どおり表示されること（見出し・列・新規登録）。 */
  async seeListPage() {
    // 期待値は正典 line5「ページタイトルブロックは『システム設定』、サブタイトルおよび一覧ボックス見出しは『メンバー管理』」由来。
    // 刷新実装は block title=メンバー管理 / sub_title=システム設定 と逆に割り当てる（付帯表4#7の乖離）。
    // テストは仕様どおりに書き、実装が違えば落ちて検出する（実装文言へオラクルを寄せない）。
    await expect(this.pageTitle).toContainText("システム設定");
    await expect(this.subTitle).toContainText("メンバー管理");
    await expect(this.newButton).toBeVisible();
  }

  /** 列見出しが表示され、メンバー行が1件以上あること。 */
  async seeColumnsAndRows() {
    const thead = this.page.locator("#form1 table thead");
    await expect(thead).toContainText("名前");
    await expect(thead).toContainText("所属");
    await expect(thead).toContainText("権限");
    // 正典 line54/79: 一覧列は 名前/所属/権限/稼働。刷新実装は「稼働」列を持たない（付帯表4#5）。
    // テストは仕様どおり「稼働」列を期待し、実装が違えば落ちて検出する。
    await expect(thead).toContainText("稼働");
    expect(await this.memberRows.count()).toBeGreaterThan(0);
  }

  /** 新規登録ボタンを押下する。 */
  async clickNew() {
    await this.newButton.click();
  }

  /** 所属フィルタで絞り込む（option value=Department.id）。 */
  async filterByDepartment(departmentId: string) {
    await this.filterDepartment.selectOption(departmentId);
  }

  /** 権限フィルタで絞り込む（option value=Authority.id）。 */
  async filterByAuthority(authorityId: string) {
    await this.filterAuthority.selectOption(authorityId);
  }

  /** 削除確認モーダルを開き、モーダル内の削除を実行する（破壊的）。 */
  async confirmDelete(memberId: number | string) {
    await this.deleteLink(memberId).click();
    const modal = this.deleteModal(memberId);
    await expect(modal).toBeVisible();
    await modal.locator("a.btn-ec-delete").click();
  }

  /** 削除確認モーダルを開いてキャンセルで閉じる（非破壊）。 */
  async openDeleteModalAndCancel(memberId: number | string) {
    await this.deleteLink(memberId).click();
    const modal = this.deleteModal(memberId);
    await expect(modal).toBeVisible();
    await modal.locator("button.btn-ec-sub").click();
  }

  /** 一覧に表示中（非表示でない）のメンバーID配列を取得する。 */
  async visibleMemberIds(): Promise<string[]> {
    const ids = await this.memberRows.evaluateAll((rows) =>
      rows
        .filter((r) => (r as HTMLElement).offsetParent !== null)
        .map((r) => r.id.replace("ex-member-", ""))
    );
    return ids;
  }

  /** 全メンバー行のID配列（表示順）。 */
  async allMemberIds(): Promise<string[]> {
    return this.memberRows.evaluateAll((rows) =>
      rows.map((r) => r.id.replace("ex-member-", ""))
    );
  }

  /** 全メンバー行の所属名（data-department-name）配列（DOM表示順）。ソート結果の照合用。 */
  async memberDepartmentNames(): Promise<string[]> {
    return this.memberRows.evaluateAll((rows) =>
      rows.map((r) => r.getAttribute("data-department-name") || "")
    );
  }

  /** 全メンバー行の {id, 所属ID, 表示中か} 配列（フィルタ結果の照合用）。 */
  async memberRowVisibilityByDepartment(): Promise<
    { departmentId: string; visible: boolean }[]
  > {
    return this.memberRows.evaluateAll((rows) =>
      rows.map((r) => ({
        departmentId: r.getAttribute("data-department-id") || "",
        visible: (r as HTMLElement).offsetParent !== null,
      }))
    );
  }

  /** 全メンバー行の {権限ID, 表示中か} 配列（フィルタ結果の照合用）。 */
  async memberRowVisibilityByAuthority(): Promise<
    { authorityId: string; visible: boolean }[]
  > {
    return this.memberRows.evaluateAll((rows) =>
      rows.map((r) => ({
        authorityId: r.getAttribute("data-authority-id") || "",
        visible: (r as HTMLElement).offsetParent !== null,
      }))
    );
  }
}
