/** M05-11 受注情報編集のシード（共有: 価格帯・Foil・フレーム・状態EX の5商品の受注）。型は seeds/m05-11-f.ts と同じ */
import { rc } from "../lib/run_marker";
import { 商品注文のシード } from "./m05-11-f";

const 入庫 = [{ 数量: 10, 仕入単価: "100" }];
const 商品 = [
  { code: "M0511-PRODUCT-1", name: "表示確認商品【日/NM】Foil", カード: { Foil: "通常" }, 入庫 },
  { code: "M0511-PRODUCT-2", name: "表示確認商品【日/NM】通常", カード: { Foil: "なし", フレーム: "通常" }, 入庫 },
  { code: "M0511-PRODUCT-3", name: "表示確認商品【日/NM】特殊Foil", カード: { Foil: "特殊" }, 入庫 },
  { code: "M0511-PRODUCT-4", name: "表示確認商品【日/NM】特殊フレーム", カード: { フレーム: "特殊" }, 入庫 },
  { code: "M0511-PRODUCT-5", name: "表示確認商品【日/EX】", 取込の規格は公開しない: true, 追加規格EX: { code: "M0511-PRODUCT-5-EX" }, 在庫コード: "M0511-PRODUCT-5-EX", 入庫 },
];
/** 受注の明細の商品コード（状態EXの商品は公開のEXの規格） */
export const 明細のコード = ["M0511-PRODUCT-1", "M0511-PRODUCT-2", "M0511-PRODUCT-3", "M0511-PRODUCT-4", "M0511-PRODUCT-5-EX"];
const 価格 = ["0", "979", "980", "4799", "4800"];

商品注文のシード("S-M05-11-PRODUCT-READ", {
  番号: "共有PRODUCT", メール前半: "m0511-shared-product", 商品,
  注文: 商品.map((p) => ({ code: p.code, 数量: 1 })),
  整える: async (_p, items) => {
    for (let i = 0; i < 明細のコード.length; i++) await items.明細に入れる(rc(明細のコード[i]), { 価格: 価格[i] });
  },
});
