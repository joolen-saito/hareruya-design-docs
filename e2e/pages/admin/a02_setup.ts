/**
 * A02-01（ポップアップ用商品情報取得）・A02-03（同・旧商品ID）のシードが使う、管理画面の操作。セレクタはここ（と流用する部品）だけに書く。
 *
 * シード表は「カードセット・カード詳細を画面で登録し、カード商品CSV登録で取り込む」と定めるが、カードのマスタは全員が使うので新しく作らない。
 * 代わりに、グッズ商品CSV登録（スマレジ連携は0。外部のスマレジへ送らない）で商品を作り、商品登録編集の「カード指定」で
 * 開発環境に既にある、商品の付いていないカード詳細を紐付ける（M04-03 と同じ）。商品規格の追加・削除・入庫は A17-05 の部品を使う。
 */
import { expect, Page } from "@playwright/test";
import { 商品があるか } from "../../db/a02_popup";
import { adminUrl } from "../../lib/session";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { downloadGoodsCsvTemplate } from "./m03_01_goods_csv";
import { readGoodsRootCategoryId, readLanguageIds } from "./m03_23_seed_products";
import { assignCardOnProductEdit } from "./product_card_assign";
import { Issue, 取込の商品と規格を読む } from "./a17_05_setup";

export type 取込の商品 = {
  商品コード: string; 商品名日: string; 商品名英: string; 価格: string;
  /** 取込で作る1件目の商品規格の言語（状態は NM になる） */
  言語: "日本語" | "英語";
  非公開?: boolean;
};

/**
 * グッズ商品CSV登録で1商品・1商品規格を取り込み、商品IDと取込の商品規格IDを返す。
 * 各行共通の値は A17-05 と同じ（グッズのカテゴリ・購入グループ「通常商品」・買取価格0・原価単価0・地域別販売制限0・スマレジ連携0）。
 */
export async function 商品を取り込む(page: Page, seedId: string, v: 取込の商品, issue: Issue): Promise<{ 商品ID: string; 規格ID: string }> {
  const categoryId = await readGoodsRootCategoryId(page);
  const template = await downloadGoodsCsvTemplate(page);
  const zeros = Object.fromEntries(template.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
  const lang: Record<string, string> = v.言語 === "英語" ? { "言語(ID)": (await readLanguageIds(page)).英語 } : {};
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
    common: { "購入グループ名称": "通常商品", "買取価格": "0", "原価単価": "0", ...zeros },
    lines: [{
      code: v.商品コード, nameJp: v.商品名日, nameEn: v.商品名英, productStatus: v.非公開 ? "非公開" : undefined,
      values: { "基準価格": v.価格, "販売価格": v.価格, ...lang },
    }],
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
  });
  return 取込の商品と規格を読む(page, v.商品コード, issue);
}

/** 商品登録編集の「カード指定」で、既にあるカード詳細を商品に紐付けて「商品を登録」する（商品名は取込の値に入れ直す） */
export async function カードを紐付ける(page: Page, 商品ID: string, v: { 商品名日: string; 商品名英: string }, カード: { カード詳細ID: string; カード名: string }, issue: Issue): Promise<void> {
  await assignCardOnProductEdit(page, {
    productId: 商品ID, cardNameJp: カード.カード名, cardDetailId: カード.カード詳細ID, productNameJp: v.商品名日, productNameEn: v.商品名英,
  }, issue);
}

/** 商品登録編集の「削除」→ 確認の「削除」で商品を消し（E2E がこの実行で作った商品だけ）、DB から無くなったことを確かめる */
export async function 商品を削除する(page: Page, 商品ID: string, what: string): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  await page.locator('button[data-bs-target="#deleteModal"]').first().click();
  const modal = page.locator("#deleteModal");
  await expect(modal, `${what}: 削除の確認`).toBeVisible();
  const res = page.waitForResponse((r) => r.request().method() === "DELETE" && new URL(r.url()).pathname.endsWith(`/product/product/${商品ID}/delete`), { timeout: 120_000 });
  await modal.locator("#delete").click();
  const r = await res;
  const body = await r.json().catch(() => null) as { success?: boolean; message?: string } | null;
  if (r.status() !== 200 || body?.success === false) throw new Error(`${what}: 商品の削除の応答 ${r.status()}・${JSON.stringify(body)}`);
  await expect.poll(() => 商品があるか(商品ID), `${what}: 商品ID ${商品ID} が DB から無くなった`).toBe(false);
}
