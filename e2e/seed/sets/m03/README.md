# SEED-M03-*（商品/価格 CSV取込の裏付けシード）— 拡張枠

m03 の商品(goods)/価格 CSV取込テストの成功系が参照する商品・価格・在庫を用意する枠。

現状の稼働DBには基盤fixtureの商品が3件（`dtb_product`）/ 規格14件（`dtb_product_class`）ある。
`dtb_product_class` は NOT NULL 列が多い（price02, visible, sale_flg, order_quantity_01..08 等）ため、
最小の商品を新規に作るより **既存商品コードを取込対象にする**方が堅い。

## 実装手順（拡張時）
1. `GoodsCsvController` / `ProductPriceCsvController` と対応 Service で「取込のキー列（商品コード等）」と必須列を確認。
2. 既存 or 帯ID(900000901〜)の商品/規格/在庫を UPSERT する SEED-M03-GOODS.sql / SEED-M03-PRICE.sql を作成
   （card/m05 と同じ UPSERT＋seed_resync＋.down.sql 規約）。
3. `../../../fixtures/csv/product_goods_csv_import/` と `product_price_csv_import/` に、その必須列で valid/異常系CSVを生成。
4. manifest.json に SEED-M03-* を追記（envVars で商品コード等を spec に渡す）。

> パイロットでは m05（受注）と m14（カードCSV）をフル網羅で実装済み。m03 はこの規約に沿って同型に拡張する。
