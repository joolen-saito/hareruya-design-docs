/**
 * 管理画面 イベント管理 — 日程追加 E2E（納品ケース表
 * integration_test/e2e/m13_03_admin_event_event_schedule_add_e2e_cases.md に対応）。
 * 本specには「E2E自動化」のうち非破壊で実行可能（表示・検証失敗・404・未認証誘導・検証エラー時の入力値保持）なものを実装し、
 * DBへ日程を登録する成功系（010/011）・要日時相関入力（021）・文字列長/数値境界（022/023）は
 * test.fixme（理由付き）で残す。手動/間接・対象外（90観点中58件）はケース表で全量管理しspecに残さない。
 * 期待結果は仕様(functions/pf-eccube3/m13-03_admin_event_event_schedule_add.md / 観点表)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/m03 等）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と対象イベントid（EVENT_ID）が無いと走らないよう test.skip でガード。
 * 表示・検証失敗・404 は副作用を残さない（保存は検証で弾かれる）。成功系は使い捨てイベント＋作成日程の後始末が要るため fixme。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M13-03-ADMIN : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（イベント管理URLを許可する管理者・2FA OFF）
 *  - SEED-M13-03-EVENT : EVENT_ID（日程を追加できる既存イベントのid。表示・検証失敗で参照する／非破壊）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventScheduleAddPage } from "../../../pages/admin/m13/m13_03_admin_event_event_schedule_add.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const EVENT_ID = process.env.EVENT_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
const NEW_RE = /\/event\/\d+\/schedule\/new(\?|$)/; // 設計書のフォーム表示URL（admin_schedule_new）
const CREATE_RE = /\/event\/\d+\/schedule\/create(\?|$)/; // POST送信先＝検証失敗時の滞留URL（admin_schedule_create）
const SCHEDULE_FORM_RE = /\/event\/\d+\/schedule\/(new|create)(\?|$)/; // 日程入力フォーム（表示/再表示いずれか）

// オラクル独立性: 表示文言（"必須"/"保存しました" 等）は実装i18n(messages.ja.yaml)由来のため期待値に固定しない。
// 設計書が正典化するのは構造的事実＝
//  - フォーム検証NG→日程入力画面を再表示（処理フロー#4 functions:84 / エラー処理 functions:174）
//  - 登録成功→日程登録後の画面へ遷移（画面遷移 functions:163 / 処理フロー#5 functions:85）
//  - イベントなし→404（エラー処理 functions:173）
// 判定はフィールドエラー要素の表示有無・同一フォーム滞留（未送信）／遷移・HTTPステータスで行う。

/** 管理者でログインし、ログイン画面から遷移するまで。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("管理画面 > イベント管理 日程追加", { tag: ["@admin", "@event"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M13-03-050 未ログインで日程追加フォームURL→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(権限・認可 未ログイン=アクセス不可 functions:153 / URL直接アクセス)由来。
    // 設計書のフォーム表示URL（/schedule/new）へ直接アクセス（実装ルート/createへ寄せない）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/1/schedule/new`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり・非破壊（表示／検証失敗／404。資格情報があるときのみ実行） =====

  test("E2E-M13-03-001 日程追加フォームに入力欄・対象イベント名・送信ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !EVENT_ID, "ECCUBE_ADMIN_USER/PASS または EVENT_ID 未設定（SEED-M13-03-ADMIN/EVENT）");
    await login(page);
    const sc = new EventEventScheduleAddPage(page);
    await sc.gotoForm(EVENT_ID);
    await expect(page).toHaveURL(NEW_RE); // 設計書の表示URL/schedule/new（実装統合との乖離は付帯表4#1で検出）
    await sc.seeForm(); // 日程入力フォーム＋対象イベント名領域(#scheduleInfo)＋送信ボタン（functions:71）
    await expect(sc.scheduleInfo).toBeVisible(); // 対象イベント名を含む日程情報領域＝表示要素(対象イベント名 functions:71)
    await expect(sc.cardTitle).toBeVisible(); // 日程情報カード＝対象イベントの日程入力フォーム
    // 要確認: 対象イベント名の値テキストは id 無し＋シード値依存のため厳密照合は実機確認（付帯表1注）。
  });

  test("E2E-M13-03-002 開始時間に必須表示があり定員・参加費・公開状態の各入力欄が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !EVENT_ID, "ECCUBE_ADMIN_USER/PASS または EVENT_ID 未設定");
    await login(page);
    const sc = new EventEventScheduleAddPage(page);
    await sc.gotoForm(EVENT_ID);
    // 期待は仕様(入力項目 日程＝必須 functions:100 / フロント挙動 表示要素 functions:71)由来。必須バッジ文言は固定しない。
    await expect(sc.startDate).toBeVisible();
    await expect(sc.requiredBadge.first()).toBeVisible(); // 必須表示（バッジ）の存在＝構造(.badge.bg-primary)で確認・文言固定なし
    await expect(sc.capacity).toBeVisible();
    await expect(sc.entryFee).toBeVisible();
    await expect(sc.disp).toBeVisible();
  });

  test("E2E-M13-03-052 存在しないイベントidの日程追加URLは404", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 期待は仕様(エラー処理 イベントが存在しない→404 functions:173 / 画面遷移 functions:165)由来。
    // 要確認: NONEXISTENT_EVENT_ID は環境に存在しないことを保証する値を供給する（既定の桁上限値は環境依存・低）。
    const nonexistentId = process.env.NONEXISTENT_EVENT_ID || "99999999";
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/${nonexistentId}/schedule/new`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M13-03-020 必須(開始時間)未入力で送信→検証エラーが表示され日程入力画面に滞留(保存されない)", async ({ page }) => {
    test.skip(!HAS_CREDS || !EVENT_ID, "ECCUBE_ADMIN_USER/PASS または EVENT_ID 未設定");
    await login(page);
    const sc = new EventEventScheduleAddPage(page);
    await sc.gotoForm(EVENT_ID);
    await sc.submit(); // 何も入力せず送信＝必須未入力（開始時間ほか必須項目が未充足）
    // 期待は仕様(処理フロー#4 検証失敗→日程入力画面を再表示 functions:84 / 入力項目 必須 functions:100)由来。文言は固定しない。
    // 滞留は POST先 /schedule/create での再表示（フォーム action は admin_schedule_create）。
    // 要確認: 開始時間「単独」の必須は別ケースで分離検証が望ましい（本ケースは複数必須に依存）。
    //         また client側 required で送信前に止まる場合は .invalid-feedback でなく滞留(非送信)で判定する（実機確認）。
    await expect(sc.fieldError.first()).toBeVisible(); // フィールドエラー表示（server再表示時）
    await expect(page).toHaveURL(CREATE_RE); // POST先に滞留＝登録されていない
    await expect(sc.saveButton).toBeVisible();
  });

  test("E2E-M13-03-024 検証エラー時に入力した任意項目の値が再表示フォームに保持される(保存されない)", async ({ page }) => {
    test.skip(!HAS_CREDS || !EVENT_ID, "ECCUBE_ADMIN_USER/PASS または EVENT_ID 未設定（SEED-M13-03-ADMIN/EVENT）");
    await login(page);
    const sc = new EventEventScheduleAddPage(page);
    await sc.gotoForm(EVENT_ID);
    // 任意項目に識別可能な値を入力し、必須(開始時間)は未入力のまま送信＝検証失敗（保存されない＝非破壊）。
    // 識別値はテスト入力の往復確認であり、実装i18n文言のオラクル化ではない。
    const marker = "E2E-RETAIN-0001";
    await sc.prizeJp.fill(marker);
    await sc.submit();
    // 期待は仕様(データ整合性「再表示」: 検証エラーで確定しない入力値は再表示画面のフォーム値に留まる functions:109
    //  / 処理フロー#4 検証失敗→日程入力画面を再表示 functions:84)由来。
    // 要確認: client側 required で送信前に止まる場合も「同一フォームに留まり入力値保持」で観測（URLは new/create いずれか）。
    await expect(page).toHaveURL(SCHEDULE_FORM_RE); // 日程入力画面に滞留＝登録されていない
    await expect(sc.prizeJp).toHaveValue(marker); // 確定しない入力値が再表示フォームに保持される
  });

  // ===== 保留（破壊的＝DB登録 / 要日時・境界入力。要シード・後始末。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M13-03-010 全必須を正しく入力して登録→日程登録後の画面へ遷移し保存完了が示される（要: 使い捨てイベントシード＋作成日程の後始末）",
    async () => {
      // 期待は仕様(処理フロー#5 検証成功→日程を新規作成して保存 functions:85 / 画面遷移 登録成功→日程登録後の画面 functions:163)由来。
      // 判定は「日程登録後の画面へ遷移」＋成功フラッシュ領域(.alert-success)の表示で行い、文言（保存しました等）は固定しない。
    }
  );
  test.fixme(
    "E2E-M13-03-011 登録した日程がイベント編集画面の日程一覧に表示される（DB追加の間接確認・要後始末）",
    async () => {
      // 期待は仕様(入出力 副作用=日程の作成 functions:127 / データ整合性 保存後はDB確定値を基準 functions:109)由来。
    }
  );
  test.fixme(
    "E2E-M13-03-021 受付終了時間≦開始時間など日時の前後関係違反で送信→相関エラーが表示され日程入力画面に滞留（要: 日時相関の入力手順・要実機確認）",
    async () => {
      // 期待は仕様(IT-22 相関バリデーション / データ整合性 検証通過分のみ登録 functions:108)由来。非保存・滞留で判定。
    }
  );
  test.fixme(
    "E2E-M13-03-022 賞品(日)を最大長超過で送信→文字列長エラーが表示され保存されない（要: 上限桁数の実機確認）",
    async () => {
      // 期待は仕様(IT-22 文字列長バリデーション 最大長+1→エラー)由来。上限値は設計簡略のため実機確認後に確定。
    }
  );
  test.fixme(
    "E2E-M13-03-023 定員/参加費を範囲外(負数等)で送信→数値範囲エラーが表示され保存されない（要: 範囲境界の実機確認）",
    async () => {
      // 期待は仕様(IT-22 数値バリデーション 範囲外→エラー)由来。境界値は設計簡略のため実機確認後に確定。
    }
  );
});
