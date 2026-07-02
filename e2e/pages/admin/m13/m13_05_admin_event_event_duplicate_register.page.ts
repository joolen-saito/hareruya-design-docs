import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント複製新規（M13-05）Page Object。
 * 納品ケース表 integration_test/e2e/m13_05_admin_event_event_duplicate_register_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-05_admin_event_event_duplicate_register.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * セレクタは ec-cube-enterprise の Twig＋Symfony Form の getBlockPrefix=`admin_event`(EventType.php:319-322) 由来の位置情報のみ。
 * 必須/最大長/検証などの制約はフォーム定義から期待値へ流用しない（制約の正は設計書/M13-02）。
 *
 * 仕様乖離(付帯表4): 設計書の複製ルートは `admin_event_duplicate` `GET /event/{duplicateId}/duplicate`。
 * 刷新先 ec-cube-enterprise は `admin_event_copy` `GET /event/{id}/copy`(EventController.php:195, defaults isCopy=true)。
 * パス/ルート名が相違するため URL は実装ルート(/copy)で組み立て、相違は不具合候補に記録する。
 *
 * DOM/セレクタ根拠（ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/edit.twig、複製新規も同テンプレート）:
 *  - フォーム #event_form（edit.twig:57。action は isNew(複製/新規)→admin_event_create、編集→admin_event_edit：edit.twig:57-60）
 *  - イベント名(日) #admin_event_nameJp（form.nameJp：edit.twig:81 / EventType.php:76）
 *  - イベント名(英) #admin_event_nameEn（form.nameEn：edit.twig:91 / EventType.php:82）
 *  - 定員 #admin_event_capacity（form.capacity：edit.twig:188近傍 / EventType.php:149）
 *  - 参加費 #admin_event_entryFee（form.entryFee：EventType.php:170）
 *  - イベント情報カード見出し 'admin.event.event_info'＝「イベント情報」（card-title：edit.twig:69）
 *  - 送信ボタン 'admin.common.registration'＝「登録」（type=submit form=event_form：edit.twig:499）
 *    ※設計書は送信ボタン文言「イベント登録」を要求（フロント挙動節）→ 実装は「登録」。不具合候補#2。
 *  - 複製新規リンク 'admin.event.copy'＝「複製新規」（編集画面のみ表示：edit.twig:497、{% if not isNew %}：edit.twig:491）
 *  - 日程一覧/日程操作ブロックは {% if not isNew %}（edit.twig:392）＝複製新規(isNew=true)では非表示
 *  - フィールドエラー form_errors(...)（edit.twig:82 ほか。Bootstrapテーマの出力クラスは要実機確認）
 */
export class EventEventDuplicateRegisterPage {
  readonly page: Page;

  readonly nameJp: Locator; // edit.twig:81 form.nameJp → #admin_event_nameJp
  readonly nameEn: Locator; // edit.twig:91 form.nameEn → #admin_event_nameEn
  readonly capacity: Locator; // EventType.php:149 form.capacity → #admin_event_capacity
  readonly entryFee: Locator; // EventType.php:170 form.entryFee → #admin_event_entryFee
  readonly form: Locator; // edit.twig:57 #event_form
  readonly registerButton: Locator; // edit.twig:499 trans admin.common.registration「登録」
  readonly copyLink: Locator; // edit.twig:497 trans admin.event.copy「複製新規」（編集画面側）
  readonly eventInfoCardTitle: Locator; // edit.twig:69 trans admin.event.event_info「イベント情報」
  readonly scheduleAddButton: Locator; // edit.twig:492 「日程追加」相当（not isNew のみ）
  // フィールドエラー領域。Bootstrapテーマの form_errors 出力クラスは要実機確認のため広めに取る。
  readonly fieldError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameJp = page.locator("#admin_event_nameJp");
    this.nameEn = page.locator("#admin_event_nameEn");
    this.capacity = page.locator("#admin_event_capacity");
    this.entryFee = page.locator("#admin_event_entryFee");
    this.form = page.locator("#event_form");
    this.registerButton = page.locator(
      'button[type="submit"][form="event_form"]'
    );
    this.copyLink = page.getByRole("link", { name: "複製新規" });
    this.eventInfoCardTitle = page.locator(".card-title", {
      hasText: "イベント情報",
    });
    this.scheduleAddButton = page.getByRole("link", { name: "日程追加" });
    this.fieldError = page.locator(".invalid-feedback, .text-danger");
  }

  /** 複製新規画面を直接開く（実装ルート admin_event_copy）。 */
  async gotoCopy(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/${id}/copy`);
  }

  /** イベント編集画面を開く（複製新規リンクの起点）。 */
  async gotoEdit(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/${id}/edit`);
  }

  /** 編集画面の複製新規リンクを押下する。 */
  async clickCopyLink() {
    await this.copyLink.click();
  }

  /** 入力を変更せず送信（複製元と同じ値で保存）。 */
  async submit() {
    await this.registerButton.click();
  }

  /** 複製新規画面が新規登録と同一のイベント情報フォームを表示していること。 */
  async seeDuplicateForm() {
    await expect(this.form).toBeVisible();
    await expect(this.eventInfoCardTitle).toBeVisible();
    await expect(this.nameJp).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** イベント名(日)の初期値を読む（複製元の値が載っているかの確認用）。 */
  async readNameJp(): Promise<string> {
    return (await this.nameJp.inputValue()).trim();
  }

  /**
   * 複製対象の代表複数項目（仕様: 業務ルール「複製する項目」＝イベント名(日/英)・定員・参加費）の
   * 初期値を読む。値はハードコードせず複製元⇔複製新規の同値比較に使う。
   * 画面に存在する入力のみ対象（テンプレ差異で欠ける項目は比較対象外）とし、両画面で同じ集合を読む。
   */
  async readCopiedFieldValues(): Promise<Record<string, string>> {
    const fields: Record<string, Locator> = {
      nameJp: this.nameJp,
      nameEn: this.nameEn,
      capacity: this.capacity,
      entryFee: this.entryFee,
    };
    const out: Record<string, string> = {};
    for (const [key, loc] of Object.entries(fields)) {
      if ((await loc.count()) > 0) {
        out[key] = (await loc.inputValue()).trim();
      }
    }
    return out;
  }
}
