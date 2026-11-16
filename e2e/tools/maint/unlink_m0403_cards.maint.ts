/**
 * 保守用（ケースではない）。2026-11-16 依頼者指示: M04-03 の流しの1つ目の回で、E2E の商品をほかの方の試験用カードに紐付けてしまった。
 * 商品登録編集の画面にはカードの指定を空に戻す手段が無い（指定し直しだけ）ので、E2E の商品の側から、実行の印つきの試験用カードへ
 * 指定し直して、ほかの方のカードとの紐付けを外す。ほかの方のカードの行には触らない。商品は E2E_UNLINK_PRODUCTS="商品ID:商品名,…" で渡す。
 */
import { test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { カードを登録する, カード詳細IDs } from "../../pages/admin/m14_card";
import { assignCardOnProductEditInSet } from "../../pages/admin/product_card_assign_set";

// 商品ID:商品名
const items = (process.env.E2E_UNLINK_PRODUCTS ?? "").split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
  const i = s.indexOf(":");
  return { id: s.slice(0, i), name: s.slice(i + 1) };
});

test("ほかの方のカードに紐付けた E2E の商品を、E2E の試験用カードへ指定し直す", async ({ browser }) => {
  if (!items.length) throw new Error("E2E_UNLINK_PRODUCTS に 商品ID:商品名 を , 区切りで与える");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 名 = rc("M0403-CARD-REPAIR2");
    await カードを登録する(page, { カード名日: 名, カード名英: 名, 点数で見たマナ: "0", 詳細: { Foil: "通常" } }, `試験用カード ${名} の登録`, (m) => console.log(m));
    const ids = await カード詳細IDs(page);
    if (ids.length !== 1) throw new Error(`試験用カード ${名} のカード詳細が ${ids.length} 件（1件のはず）`);
    console.log(`試験用カード「${名}」 カード詳細ID ${ids[0]}`);
    for (const it of items) {
      for (let t = 1; ; t++) {
        try {
          await assignCardOnProductEditInSet(page, { productId: it.id, cardNameJp: 名, cardDetailId: ids[0], productNameJp: it.name, productNameEn: it.name }, (m) => console.log(m));
          break;
        } catch (e) {
          if (t >= 3) throw e;
          console.log(`商品ID ${it.id}: ${t} 回目は画面が開ききる前に押して失敗したので開き直す`);
        }
      }
      console.log(`商品ID ${it.id}（${it.name}）を試験用カード詳細 ${ids[0]} へ指定し直した`);
    }
  });
});
