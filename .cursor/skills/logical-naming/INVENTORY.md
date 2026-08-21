# 論理名規約 既存混入の棚卸し

[[logical-naming]] の規約は新規・改修分に適用し、ここに集計した既存分は
`baseline.tsv` で棚卸し済みとして扱う（監査は新規増加分だけを落とす）。
このファイルは監査スクリプトの `--summary` で再生成する。

- 総ヒット: 39845件 / 対象ファイル: 2469件

## 種別別

| 種別 | 件数 |
| --- | ---: |
| DB物理名 | 29467 |
| 内部識別子 | 10378 |

## 領域別

| 領域 | 件数 |
| --- | ---: |
| integration_test | 35014 |
| e2e | 2890 |
| functions | 1771 |
| scenario_test | 170 |

## 物理名 上位20

| 物理名 | 件数 |
| --- | ---: |
| `dtb_product_class` | 1124 |
| `dtb_order` | 1110 |
| `dtb_base_info` | 1078 |
| `dtb_product` | 863 |
| `dtb_csv` | 675 |
| `dtb_deck` | 609 |
| `dtb_player` | 582 |
| `dtb_member` | 579 |
| `dtb_customer` | 551 |
| `admin.register.complete` | 422 |
| `dtb_help` | 419 |
| `dtb_shipping` | 409 |
| `dtb_stock_move_transfer` | 406 |
| `dtb_otc_buy_order` | 397 |
| `dtb_stock_move_instruction` | 380 |
| `dtb_csv_import_history` | 359 |
| `dtb_product_sub` | 334 |
| `dtb_shipping_standby` | 320 |
| `dtb_deck_card` | 317 |
| `mtb_option` | 311 |

## ファイル 上位20

| ファイル | 件数 |
| --- | ---: |
| `integration_test/all_it_cases.tsv` | 2780 |
| `integration_test/e2e/exec/_drafts/f04-01_front_cart_cart_index_executable_draft.md` | 289 |
| `integration_test/e2e/exec/tsv/f04-01_front_cart_cart_index_concretized.tsv` | 268 |
| `integration_test/_generated/m04_15.md` | 219 |
| `integration_test/_gen2_m03-36.md` | 183 |
| `integration_test/_generated/m03_36.md` | 183 |
| `integration_test/_gen2_m10-10.md` | 180 |
| `integration_test/_generated/m10_10.md` | 180 |
| `integration_test/_gen2_m04-24.md` | 174 |
| `integration_test/_generated/m04_24.md` | 174 |
| `integration_test/_generated/m04_26.md` | 168 |
| `integration_test/_gen2_m04-22.md` | 165 |
| `integration_test/_generated/m04_22.md` | 165 |
| `integration_test/_gen2_m04-04.md` | 156 |
| `integration_test/_generated/m04_04.md` | 156 |
| `integration_test/NEW_BUG_CANDIDATES.md` | 153 |
| `integration_test/e2e/exec/all_concretized.tsv` | 152 |
| `integration_test/_generated/m15_11.md` | 150 |
| `integration_test/e2e/exec/_drafts/f04-02_front_cart_shopping_order_method_executable_draft.md` | 138 |
| `integration_test/_gen2_m04-02.md` | 134 |
