/**
 * M10-16 追加システム設定。正本: integration_test/casegen/cases/M10-16_test_cases.tsv
 * 実装するのは IT-M10-16-002 だけ。ほかは全店共通の追加システム設定の設定値を書き換える・設定行を揃える前提のため、
 * 共有の開発環境では実装しない（判断待ち）。
 * 読み替え: 手順の「データ管理」は、この画面のメニューに無い。追加システム設定は大項目「設定」の下の「基本設定」にある。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { AddSystemPage } from "../../pages/admin/m10_16_add_system";
import { M1016_ADMIN_A } from "../../seeds/m10-16";

caseTest("IT-M10-16-002", async ({ page, step, expected }) => {
  test.info().annotations.push({ type: "手順の注記", description: "サイドメニューに「データ管理」は無い。追加システム設定がある大項目「設定」（その下の「基本設定」）を開いて「追加システム設定」を押した" });
  await loginAdmin(page, M1016_ADMIN_A);
  const p = new AddSystemPage(page);
  await step(1, async () => { await p.大項目を開く(); });
  await step(2, async () => { await p.追加システム設定を押す(); });
  await expected(async () => {
    expect.soft(await p.開いているか(), "追加システム設定画面へ遷移した").toBe(true);
  });
});
