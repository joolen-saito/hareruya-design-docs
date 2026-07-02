/**
 * 管理画面 受注対応状況の変更（M05-14）E2E。納品ケース表
 * integration_test/e2e/m05_14_admin_order_order_status_change_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機/破壊的な保存系は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約・実装表示文言を期待値へ流用しない。
 * 本機能は ec-cube-enterprise を正典（標準機能）とし、刷新先に受注編集(admin_order_edit)が実在する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05_* も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（ECCUBE_ADMIN_USER/PASS）。
 * 受注編集は既存受注データに依存するため、一覧に受注が無い場合は test.skip でガードする（要シード SEED-M05-14-ORDER）。
 *
 * データ汚染の注意（要確認: 後始末の実装は未着手）:
 *  010/012 等の保存系は dtb_order.order_status_id・各日時・ポイント・外部連携を確定する破壊的副作用を持つ。
 *  本spec は表示・ダイアログ・異常系（変更が永続化されない経路）を中心に自動化し、保存成立の正常系は
 *  使い捨て/専用 SEED-M05-14-ORDER に限定すべきため fixme で残す（ケース表 付帯表3 参照）。
 *  030(不可遷移強制送信)はトランザクションを巻き戻し永続化しないため非破壊として実装する。
 *  031(同一ステータス送信)は変更なしのため非破壊として実装する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderStatusChangePage } from "../../../pages/admin/m05/m05_14_admin_order_order_status_change.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// シードが与える受注ステータスID（オラクルを設計書由来に保つための前提値。源は SEED-M05-14-ORDER）。
//  - FORBIDDEN_STATUS_ID: 当該受注の現在ステータスからは許可されない「実在の」遷移先ID（030の不可遷移強制送信用）。
//    任意IDを総当りで選ぶと、現在ステータスID（=同一扱い）や非実在ID（別検証）に当たり
//    「%from% から %to% にはステータス変更できません」のオラクルへ到達しないため、シードで確定する。
//  - CURRENT_STATUS_ID: 当該受注の現在ステータスID（032の同一ステータス送信用）。
//    プルダウンは現在ステータスを選択肢に含まないため、画面の select.value からは取得できない（先頭の遷移先になる）。
const FORBIDDEN_STATUS_ID = process.env.M05_14_FORBIDDEN_STATUS_ID || "";
const CURRENT_STATUS_ID = process.env.M05_14_CURRENT_STATUS_ID || "";

// 設計書(正本 m05-14_….md:62)由来の受注ステータス照合値。表示名はマスタ設定に依存するため、
// 取消の特定は表示名一致ではなく照合値（CANCEL=3）で行う（オラクル独立性・データ/表示名非依存）。
const CANCEL_STATUS_ID = "3"; // CANCEL=3

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order/\\d+/edit(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SAVE_COMPLETE = "保存しました"; // :2414 admin.order.save.complete（取消以外の成立時）
const CANCEL_COMPLETE = "全キャンセルが完了しました。"; // :2412 admin.order.cancel.complete（取消成立時）
// %from% から %to% にはステータス変更できません（:2409 admin.order.failed_to_change_status__short）
const ERR_STATUS_CHANGE = "にはステータス変更できません";

/** 管理ログインして一覧の先頭受注の編集画面を開く。受注が無ければ null。 */
async function loginAndOpenOrderEdit(
  page: Page
): Promise<OrderOrderStatusChangePage | null> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const sc = new OrderOrderStatusChangePage(page);
  const ok = await sc.openFirstOrderEdit();
  return ok ? sc : null;
}

test.describe(
  "管理画面 > 受注管理 > 受注対応状況の変更",
  { tag: ["@admin", "@order"] },
  () => {
    // ===== 権限・認可（認証不要・非破壊） =====

    test("E2E-M05-14-040 未ログインで受注編集URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可/利用者視点の入口: 未認証は管理用ファイアウォールで到達不可＝ログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-14-041 未ログインで受注一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 受注編集の到達口（一覧）も管理側URL＝未認証はログインへ誘導。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 新規受注登録画面（ログインのみ・非破壊） =====

    test("E2E-M05-14-003 新規受注登録画面では対応状況プルダウン・変更操作を表示しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const sc = new OrderOrderStatusChangePage(page);
      await sc.gotoNew();
      // 仕様 利用者視点の入口/フロント挙動: 新規受注では対応状況プルダウンと変更ボタンを描画しない（Order.id なし）。
      await expect(sc.orderStatusSelect).toHaveCount(0);
      await expect(sc.changeStatusButton).toHaveCount(0);
    });

    // ===== 受注編集（詳細）画面の表示（ログイン＋既存受注。非破壊） =====

    test("E2E-M05-14-001 受注編集に「現在のステータス」表示と対応状況プルダウン・変更ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const sc = await loginAndOpenOrderEdit(page);
      test.skip(sc === null, "受注が無く受注編集を開けない（要シード SEED-M05-14-ORDER）");
      // 仕様 フロント挙動(表示要素): 受注情報領域に現在のステータスと対応状況プルダウンを表示する。
      await sc!.seeStatusChangeUi();
    });

    test("E2E-M05-14-002 対応状況プルダウンは単一選択で現在のステータス自身を選択肢に含まない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const sc = await loginAndOpenOrderEdit(page);
      test.skip(sc === null, "受注が無く受注編集を開けない（要シード SEED-M05-14-ORDER）");
      // 仕様 フロント挙動(対応状況プルダウン)/業務ルール(遷移先の絞り込み): 選択肢は遷移可能な遷移先のみで、
      // 現在のステータス自身は含まない（単一選択）。
      await expect(sc!.orderStatusSelect).not.toHaveAttribute("multiple", /.*/);
      const current = await sc!.currentStatusText();
      const labels = (await sc!.statusOptions()).map((o) => o.label);
      expect(labels).not.toContain(current);
    });

    test("E2E-M05-14-004 対応状況プルダウンに不可遷移ステータス（許可されない遷移先）を含まない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const sc = await loginAndOpenOrderEdit(page);
      test.skip(sc === null, "受注が無く受注編集を開けない（要シード SEED-M05-14-ORDER）");
      // 仕様 フロント挙動(対応状況プルダウン)/業務ルール(遷移先の絞り込み 正本:84,98,174): 選択肢は受注ステータス遷移の
      // 許可規則で絞り込まれ、到達できないステータスは選択肢から除外する。「実在するが当該受注からは許可されない遷移先ID」
      // をシードで確定し、その value が option 集合に出ないことを確認する（任意IDは現在ステータス＝同一扱いや非実在に当たり
      // 所望オラクルへ到達しないため、シードで確定する。オラクル独立性）。
      test.skip(
        !FORBIDDEN_STATUS_ID,
        "M05_14_FORBIDDEN_STATUS_ID 未設定（要シード SEED-M05-14-ORDER: 実在かつ不可遷移の遷移先ID）"
      );
      const values = (await sc!.statusOptions()).map((o) => o.value);
      expect(values).not.toContain(FORBIDDEN_STATUS_ID);
    });

    // ===== 確認ダイアログ（取消への変更。非破壊：ダイアログを取り消す） =====

    test("E2E-M05-14-021 取消へ変更時の確認ダイアログでキャンセルすると送信を中止し画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const sc = await loginAndOpenOrderEdit(page);
      test.skip(sc === null, "受注が無く受注編集を開けない（要シード SEED-M05-14-ORDER）");
      // 仕様 フロント挙動(JS挙動による確認ダイアログ): 取消への変更は確認ダイアログを表示し、
      // 取り消すと送信しない（受注編集画面に留まり変更なし）。取消ステータスが選択肢に無い場合は skip。
      // 取消の特定は表示名一致ではなく設計書由来の照合値 CANCEL=3 で行う（オラクル独立性）。
      const cancelOpt = (await sc!.statusOptions()).find(
        (o) => o.value === CANCEL_STATUS_ID
      );
      test.skip(
        !cancelOpt,
        "現在のステータスから取消(CANCEL=3)への遷移が選択肢に無い（要シード: 取消へ遷移可能な受注）"
      );
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss(); // キャンセル＝送信中止（非破壊）
      });
      await sc!.changeStatusTo(cancelOpt!.value);
      expect(dialogShown).toBe(true);
      await expect(page).toHaveURL(EDIT_RE); // 画面に留まる（リダイレクトしない）
    });

    // ===== 異常系・分岐（送信するが永続化されない経路。非破壊） =====

    test("E2E-M05-14-030 許可されない遷移先を強制送信→ステータス変更不可エラーで滞留し変更されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const sc = await loginAndOpenOrderEdit(page);
      test.skip(sc === null, "受注が無く受注編集を開けない（要シード SEED-M05-14-ORDER）");
      // 仕様 エラー処理/バリデーション(遷移可否): 許可されない遷移を強制送信すると受注ステータス検証で
      // 「%from% から %to% にはステータス変更できません」を表示し、確定処理側でも遷移適用が失敗して巻き戻す。
      // 「実在するが当該受注の現在ステータスからは許可されない遷移先ID」をシードで確定して強制送信する
      // （任意ID総当りは現在ステータスID＝同一扱いや非実在ID＝別検証に当たり、上記オラクルへ到達しないため）。
      test.skip(
        !FORBIDDEN_STATUS_ID,
        "M05_14_FORBIDDEN_STATUS_ID 未設定（要シード SEED-M05-14-ORDER: 実在かつ不可遷移の遷移先ID）"
      );
      await sc!.forceSelectAndSubmit(FORBIDDEN_STATUS_ID);
      await sc!.seeText(ERR_STATUS_CHANGE); // 仕様の項目エラー文言
      await expect(page).toHaveURL(EDIT_RE); // 受注編集（詳細）画面を再表示
    });

    test("E2E-M05-14-032 変更前後が同一ステータスはメッセージなしで受注編集画面を再表示し変更されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const sc = await loginAndOpenOrderEdit(page);
      test.skip(sc === null, "受注が無く受注編集を開けない（要シード SEED-M05-14-ORDER）");
      // 仕様 エッジケース/画面遷移: 変更前後が同一ステータスのとき、何も変更せず受注編集画面へリダイレクトし
      // 専用メッセージは出さない。プルダウンは現在ステータスを含まない（select.value は先頭の遷移先になる）ため、
      // 現在ステータスIDはシードから受け取り、同一IDを option 追加して強制的に同一送信する。
      test.skip(
        !CURRENT_STATUS_ID,
        "M05_14_CURRENT_STATUS_ID 未設定（要シード SEED-M05-14-ORDER: 当該受注の現在ステータスID）"
      );
      const before = await sc!.currentStatusText();
      await sc!.forceSelectAndSubmit(CURRENT_STATUS_ID);
      await expect(page).toHaveURL(EDIT_RE); // 同画面を再表示
      // 成功/取消フラッシュは出ない（変更が成立しないため）。
      await expect(page.getByText(SAVE_COMPLETE)).toHaveCount(0);
      await expect(page.getByText(CANCEL_COMPLETE)).toHaveCount(0);
      // 現在のステータス表示は変わらない（変更なし）。
      await expect(sc!.currentStatusValue).toContainText(before);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外/破壊的保存系はケース表で全量管理） =====
    // 注: 以下の fixme は「自動化予定だが未実行（破壊的保存・専用シード待ち）」であり、実行済みカバレッジには含めない。
    //     テストID採番はケース表TSV（010=保存フラッシュ/011=リダイレクト/012=現在ステータス更新/013=取消完了）と一致させる。

    test.fixme(
      "E2E-M05-14-010 遷移可能なステータス（取消以外）へ変更→「保存しました」表示（破壊的保存：要使い捨て SEED-M05-14-ORDER-MUT＋復元）",
      async () => {
        // 期待は仕様(処理フロー#12/表示メッセージ admin.order.save.complete)由来。
        // dtb_order.order_status_id 等を確定変更するため、専用受注＋afterEach復元の整備後に実装する。
      }
    );

    test.fixme(
      "E2E-M05-14-011 対応状況変更が成立すると同じ受注編集画面（/order/{id}/edit）へリダイレクトする（破壊的保存）",
      async () => {
        // 期待は仕様(処理フロー#12/画面遷移)由来。010の保存成立に伴う同画面リダイレクトを確認する。
      }
    );

    test.fixme(
      "E2E-M05-14-012 変更成立後に「現在のステータス」表示が変更後の表示名へ更新される（破壊的保存：DB間接確認）",
      async () => {
        // 期待は仕様(データ整合性/一覧との整合)由来。010の保存成立後の再表示で現在ステータスが更新されること。
      }
    );

    test.fixme(
      "E2E-M05-14-013 取消へ変更し確認ダイアログを承認→「全キャンセルが完了しました。」表示（破壊的保存：在庫/ポイント変動）",
      async () => {
        // 期待は仕様(表示メッセージ admin.order.cancel.complete/処理フロー)由来。
        // 在庫・ポイント・外部連携の副作用が大きいため、隔離された使い捨て受注 SEED-M05-14-CANCELABLE でのみ実行する。
      }
    );

    test.fixme(
      "E2E-M05-14-020 取消へ変更時（取消日未設定）に全キャンセルの在庫変動説明ダイアログ文言が表示される（要: SEED-M05-14-CANCELABLE）",
      async () => {
        // 期待は仕様(確認ダイアログ #2「全キャンセル時、在庫数等は以下のように変動します。…」正本:158)由来。
        // 021でダイアログ表示自体は確認済。文言厳密照合は取消日未設定の取消遷移可能シード整備後に実装する。
      }
    );

    test.fixme(
      "E2E-M05-14-022 取消へ変更時（取消日設定済み）に「過去にキャンセル…」確認ダイアログ文言が表示される（要: 取消日設定済みシード）",
      async () => {
        // 期待は仕様(確認ダイアログ #1「過去にキャンセルされているため、在庫数やポイントの変動はありません。…」正本:157)由来。
        // 取消日(cancel_date)が既に設定済みの受注が必要なため専用シード整備後に実装する。
      }
    );

    test.fixme(
      "E2E-M05-14-023 取消から他ステータスへ変更時に「キャンセルからステータスを変更…在庫の減算操作を行ってください。」確認ダイアログ文言が表示される（要: 現在ステータス=取消のシード）",
      async () => {
        // 期待は仕様(確認ダイアログ #3「キャンセルからステータスを変更する場合は、在庫の変動はありません。…」正本:159)由来。
        // 現在ステータスが取消(CANCEL=3)かつ他ステータスへ遷移可能な受注が必要なため専用シード整備後に実装する。
      }
    );

    test.fixme(
      "E2E-M05-14-033 対応状況を未選択（空送信）で強制送信→検証エラーで変更されず再表示（要確認: 設計書は空送信=検証エラーのみで文言未記載）",
      async () => {
        // 期待は仕様(入力項目「未選択は不可。空送信は受注フォームの受注ステータス項目の検証で弾く」正本:185,267)由来。
        // DOM で空value option を強制選択して送信する準E2E。表示される具体的なエラー文言は設計書に未記載のため
        // オラクルは「成功フラッシュなし＋受注編集画面再表示＋変更なし」までとし、文言厳密照合は要確認。
      }
    );
  }
);
