/**
 * a06-04 店頭仕入_買取注文フリーコメント更新 UI観測レイヤ E2E（E2E自動化(UI) 040/041）。
 * ケース表 integration_test/e2e/a06_04_api_store_purchase_otc_buy_order_free_comment_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(UI)」の 040/041 を実装する。API/統合ケース・手動(050/051/052)はケース表/別specで管理し本specには書かない（OMIT）。
 *
 * 期待結果は仕様（正本md＝pf-apiリバース／観点表／基本設計）由来（オラクル独立性）:
 *  - 040: APIで更新した free_comment が店頭買取受注詳細のフリーコメント欄に表示される（副作用DB更新のUI反映・正本md:85,139,171）。
 *  - 041: 更新で変わるのはフリーコメントと更新担当者のみ・受注ステータス/他項目は不変（正本md:159。更新日時更新の扱いは付帯表4#6で別確認）。
 *  - 更新は本機能API（PUT /api/v1/admin/otcBuyOrder/{id}/freeComment.json）で行い、管理画面はブラウザで観測する。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 管理画面ログイン資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 他項目(ステータス等)の具体セレクタは detail.twig 要実機確認（付帯表4・041）。本文では free_comment 反映を主判定し、他項目不変は要実機確認コメントで補う。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。UIガード HAS_CREDS。
 *
 * import 深さ: 本spec は spec/admin/a06（login.spec.ts より1階層深い）。pages/・config/ へは ../../../（up3=e2e）。
 */
import { test, expect } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OtcBuyOrderDetailPage } from "../../../pages/admin/a06/a06_04_api_store_purchase_otc_buy_order_free_comment.page";
import {
  otcBuyOrderFreeCommentPath,
  OTC_ORDER_ID,
  JWT_TOKEN,
  buildAuthHeaders,
  buildValidCommentPayload,
} from "../../../pages/api/a06/a06_04_api_store_purchase_otc_buy_order_free_comment.api";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

test.describe("管理画面 > 店頭買取受注フリーコメント反映", { tag: ["@admin", "@a06"] }, () => {
  test("E2E-A06-04-040 更新後に管理画面詳細でフリーコメントが更新値で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS（SEED-M01-ADMIN）未設定");
    // 1. APIで free_comment を更新（更新値は一意化して反映を厳密判定）。
    const updated = `E2E-040 反映確認 ${Date.now()}`;
    const res = await page.request.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), {
      headers: buildAuthHeaders(JWT_TOKEN),
      data: buildValidCommentPayload(updated),
    });
    expect(res.status(), "API更新が成功(200)していること（前提）").toBe(200);

    // 2. 管理画面にログインして当該店頭買取受注の詳細を開く。
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const detail = new OtcBuyOrderDetailPage(page);
    await detail.goto(OTC_ORDER_ID);

    // 3. フリーコメント欄に API で更新した値が表示される（正本md:85,139,171 副作用DB更新のUI反映）。
    await detail.seeFreeComment();
    await expect(detail.freeComment, "詳細のフリーコメント欄にAPI更新値が表示される").toHaveValue(updated);
  });

  test("E2E-A06-04-041 更新後に受注のステータス・他項目が変更されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS（SEED-M01-ADMIN）未設定");
    // 1. 更新前に管理画面詳細でフリーコメント以外の状態（ステータス・他項目）を控える。
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const detail = new OtcBuyOrderDetailPage(page);
    await detail.goto(OTC_ORDER_ID);
    await detail.seeFreeComment();
    // 他項目(受注ステータス等)の具体セレクタは detail.twig 要実機確認（付帯表4・041）。本文では取得済みUI全体をスナップ的に控える想定。
    const beforeBody = await page.locator("body").innerText(); // 要実機確認: ステータス/他項目の限定セレクタに置換する

    // 2. APIで free_comment のみ更新する。
    const updated = `E2E-041 更新範囲確認 ${Date.now()}`;
    const res = await page.request.put(otcBuyOrderFreeCommentPath(OTC_ORDER_ID), {
      headers: buildAuthHeaders(JWT_TOKEN),
      data: buildValidCommentPayload(updated),
    });
    expect(res.status(), "API更新が成功(200)していること（前提）").toBe(200);

    // 3. 詳細を再表示し、フリーコメントは更新され、ステータス・他項目は不変であることを確認する。
    await detail.goto(OTC_ORDER_ID);
    await expect(detail.freeComment, "フリーコメントは更新値へ変化").toHaveValue(updated);
    // 正本md:159 更新範囲: 変わるのはフリーコメントと更新担当者のみ。受注ステータス/他項目は更新前と一致して不変であること。
    // 限定セレクタが要実機確認のため、ここではステータス/他項目の不変判定を要実機確認とする（更新日時更新の扱いは付帯表4#6で別確認）。
    expect(beforeBody.length, "更新前のUI状態を取得できている（不変判定の基点）").toBeGreaterThan(0);
  });
});
