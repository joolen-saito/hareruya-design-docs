/**
 * 前回の実行で残った商品を、管理画面の商品マスターから「完全に削除」する（依頼者決定 2026-10-26。DB は書き換えない）。
 * 消すのは、商品コードの検索結果の行がすべてその商品コードのときだけ（removeProductsMatchingCode）。
 * 共有の環境では流さない。
 */
import { test } from "@playwright/test";
import { SETUP_ADMIN, SHARED_ENV } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { removeProductsMatchingCode } from "../../pages/admin/m03_01_goods_list_seed";

const codes = (process.env.E2E_REMOVE_PRODUCT_CODES ?? "").split(",").map((s) => s.trim()).filter(Boolean);

test("残った商品を画面から消す", async ({ browser }) => {
  if (SHARED_ENV) throw new Error("共有の環境では残りの商品を消さない");
  if (!codes.length) throw new Error("E2E_REMOVE_PRODUCT_CODES に商品コードを , 区切りで与える");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const failed: string[] = [];
    for (const code of codes) {
      try {
        const ids = await removeProductsMatchingCode(page, code);
        console.log(`消した\t${code}\t${ids.length ? ids.join(" ") : "（残っていなかった）"}`);
      } catch (e) {
        // 消せない商品（在庫の記録がある など）があっても、ほかの商品コードは続ける
        failed.push(code);
        console.log(`消せなかった\t${code}\t${(e as Error).message.split("\n")[0]}`);
      }
    }
    if (failed.length) throw new Error(`消せなかった商品コード: ${failed.join(" ")}`);
  });
});
