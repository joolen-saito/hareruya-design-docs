/** M05-11 受注情報編集のシード（配送商品ID・商品名の変更・店頭受取）。型は seeds/m05-11-f.ts と同じ */
import { expect } from "@playwright/test";
import { 受注明細ID } from "../db/m05_11";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { openProductEdit } from "../pages/admin/product_edit";
import { AB, 基本, 商品IDの控え, 商品注文のシード } from "./m05-11-f";
import { M0511_ADMIN_A } from "./m05-11";

// 配送商品ID（受注明細の識別）を控える
商品注文のシード("S-M05-11-BASE-048", {
  番号: "048", メール前半: "base-048", 商品: AB("048"), 注文: [{ code: "BASE-A-048", 数量: 2 }, { code: "BASE-B-048", 数量: 1 }],
  注文後: async (_b, _s, { 注文番号, notes }) => {
    const ids = 受注明細ID(注文番号);
    notes.set("〔配送商品ID-M0511-048A〕", ids[rc("BASE-A-048")]);
    notes.set("〔配送商品ID-M0511-048B〕", ids[rc("BASE-B-048")]);
  },
});

// 注文のあとに商品名を変える（受注明細の商品名は注文時のまま）
商品注文のシード("S-M05-11-DPNAME-216", {
  番号: "216", メール前半: "dpm0511-216", 商品: [基本("DPM0511-216-A", "受注時名称216")], 注文: [{ code: "DPM0511-216-A", 数量: 2 }],
  注文後: async (browser) => {
    await withAdminSession(browser, M0511_ADMIN_A, async (page) => {
      await openProductEdit(page, 商品IDの控え("DPM0511-216-A"));
      const form = page.locator("form#form1");
      await form.locator('[name="admin_product[name]"]').fill(rc("変更後名称216"), { timeout: 20_000 });
      const discount = form.locator('select[name="admin_product[Discount]"]');
      if (!(await discount.inputValue())) {
        const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((v) => v !== ""));
        if (first) await discount.selectOption(first);
      }
      await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), "販売制限が選ばれている").toHaveCount(1);
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click({ timeout: 20_000 })]);
      await expectSaved(page, "商品名の変更");
    });
  },
});

// 決済済みの店頭受取の注文（配送方法「店頭受取」・店頭で選べる支払方法→入金済み）
const 店頭支払 = ["店頭支払", "支払いなし", "店頭支払(店内PC)"];
商品注文のシード("S-M05-11-PICKUP-READ", {
  番号: "共有PICKUP", メール前半: "m0511-shared-pickup", 商品: [基本("PICK-A", "店頭受取商品A"), 基本("PICK-B", "店頭受取商品B")],
  注文: [{ code: "PICK-A", 数量: 1 }, { code: "PICK-B", 数量: 1 }], 配送: "店頭受取", 支払候補: 店頭支払, 状態: ["入金済み"],
});
商品注文のシード("S-M05-11-PICKUP-099", {
  番号: "099", メール前半: "m0511-099", 商品: [基本("PICK-A-099", "店頭受取商品A"), 基本("PICK-B-099", "店頭受取商品B")],
  注文: [{ code: "PICK-A-099", 数量: 1 }, { code: "PICK-B-099", 数量: 1 }], 配送: "店頭受取", 支払候補: 店頭支払, 状態: ["入金済み"],
});
