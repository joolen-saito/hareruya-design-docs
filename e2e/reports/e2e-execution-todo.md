# E2E実行TODO

生成日: 2026-07-06

運用ルール:
- 各E2Eテストは実行前にユーザー許可を取る。
- 許可されたテストだけ実行する。
- 実行後、対応する `integration_test/e2e/*_e2e_cases.md` の `結果` に成功は `〇`、失敗は `×` を入れる。
- 失敗時は `失敗理由` に原因を具体的に書く。例: セレクタ不一致、タイムアウト、HTTPステータス不一致、デバッグツールバー遮蔽、シード不足、認証/API 401。
- skip/fixme は自動実行結果としてはケース結果を更新せず、必要なら失敗理由に「未実施: シード/実機依存」等を明記するか確認する。

## A01-01

- 状態: 未許可
- spec数: 2
- E2E ID数: 37

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/a01/a01_01_api_stock_smaregi_stock_sync.spec.ts` | 7 | 実行前に許可確認 |
| 未許可 | `e2e/spec/api/a01/a01_01_api_stock_smaregi_stock_sync.api.spec.ts` | 30 | 実行前に許可確認 |

## A01-02

- 状態: 未許可
- spec数: 2
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/a01/a01_02_api_stock_smaregi_webhook_error_retry.spec.ts` | 4 | 実行前に許可確認 |
| 未許可 | `e2e/spec/api/a01/a01_02_api_stock_smaregi_webhook_error_retry.api.spec.ts` | 24 | 実行前に許可確認 |

## A02-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a02/a02_01_api_product_popup_product.api.spec.ts` | 22 | 実行前に許可確認 |

## A02-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a02/a02_02_api_product_popup_card.api.spec.ts` | 23 | 実行前に許可確認 |

## A02-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a02/a02_03_api_product_popup_product_old.api.spec.ts` | 18 | 実行前に許可確認 |

## A02-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a02/a02_04_api_product_popup_card_old.api.spec.ts` | 17 | 実行前に許可確認 |

## A02-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a02/a02_05_api_product_updated_product_class.api.spec.ts` | 18 | 実行前に許可確認 |

## A05-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 36

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a05/a05_01_api_order_print_direct.api.spec.ts` | 36 | 実行前に許可確認 |

## A05-02

- 状態: 未許可
- spec数: 2
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/a05/a05_02_api_order_print_direct.spec.ts` | 4 | 実行前に許可確認 |
| 未許可 | `e2e/spec/api/a05/a05_02_api_order_print_direct.api.spec.ts` | 18 | 実行前に許可確認 |

## A05-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a05/a05_03_api_order_order_store_call_number.api.spec.ts` | 21 | 実行前に許可確認 |

## A05-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 34

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a05/a05_04_api_order_order_smaregi_receive.api.spec.ts` | 34 | 実行前に許可確認 |

## A06-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_01_api_store_purchase_admin_login.api.spec.ts` | 20 | 実行前に許可確認 |

## A06-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 33

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_02_api_store_purchase_otc_buy_order_list.api.spec.ts` | 33 | 実行前に許可確認 |

## A06-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 44

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_03_api_store_purchase_otc_buy_order_update.api.spec.ts` | 44 | 実行前に許可確認 |

## A06-04

- 状態: 未許可
- spec数: 2
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/a06/a06_04_api_store_purchase_otc_buy_order_free_comment.spec.ts` | 2 | 実行前に許可確認 |
| 未許可 | `e2e/spec/api/a06/a06_04_api_store_purchase_otc_buy_order_free_comment.api.spec.ts` | 23 | 実行前に許可確認 |

## A06-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 30

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_05_api_store_purchase_otc_buy_order_status.api.spec.ts` | 30 | 実行前に許可確認 |

## A06-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_06_api_buying_products_by_detail.api.spec.ts` | 22 | 実行前に許可確認 |

## A06-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_07_api_buying_products_by_ids.api.spec.ts` | 21 | 実行前に許可確認 |

## A06-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_08_api_store_purchase_buying_products_search.api.spec.ts` | 25 | 実行前に許可確認 |

## A06-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_09_api_product_search_by_name.api.spec.ts` | 21 | 実行前に許可確認 |

## A06-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_10_api_buying_products_by_ids.api.spec.ts` | 23 | 実行前に許可確認 |

## A06-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_11_api_store_purchase_section_list.api.spec.ts` | 17 | 実行前に許可確認 |

## A06-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 8

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_12_api_store_purchase_fixed_price_section.api.spec.ts` | 8 | 実行前に許可確認 |

## A06-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_13_api_store_purchase_otc_buy_order_identification.api.spec.ts` | 22 | 実行前に許可確認 |

## A06-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_15_api_store_purchase_otc_buy_order_same_store_members.api.spec.ts` | 17 | 実行前に許可確認 |

## A06-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 29

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_16_api_store_purchase_otc_buy_order_double_check_member_update.api.spec.ts` | 29 | 実行前に許可確認 |

## A06-17

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_17_api_buying_products_by_detail.api.spec.ts` | 22 | 実行前に許可確認 |

## A06-18

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a06/a06_18_api_buying_products_by_ids.api.spec.ts` | 23 | 実行前に許可確認 |

## A07-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a07/a07_01_api_online_purchase_bulk_purchase_id.api.spec.ts` | 17 | 実行前に許可確認 |

## A07-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a07/a07_02_api_online_purchase_buy_order_list.api.spec.ts` | 26 | 実行前に許可確認 |

## A07-03

- 状態: 未許可
- spec数: 2
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/a07/a07_03_api_online_purchase_buy_order_free_comment.spec.ts` | 2 | 実行前に許可確認 |
| 未許可 | `e2e/spec/api/a07/a07_03_api_online_purchase_buy_order_free_comment.api.spec.ts` | 23 | 実行前に許可確認 |

## A07-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 35

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a07/a07_04_api_online_purchase_buy_order_status.api.spec.ts` | 35 | 実行前に許可確認 |

## A07-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 37

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a07/a07_05_api_online_purchase_buy_order_end.api.spec.ts` | 37 | 実行前に許可確認 |

## A07-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a07/a07_06_api_online_purchase_buy_main_card.api.spec.ts` | 23 | 実行前に許可確認 |

## A07-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a07/a07_07_api_online_purchase_buy_order_indivisual_input_product.api.spec.ts` | 25 | 実行前に許可確認 |

## A08-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a08/a08_01_api_top_banner_get.api.spec.ts` | 19 | 実行前に許可確認 |

## A08-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a08/a08_02_api_top_banner_list.api.spec.ts` | 18 | 実行前に許可確認 |

## A14-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a14/a14_01_api_card_card_get.api.spec.ts` | 20 | 実行前に許可確認 |

## A14-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a14/a14_02_api_card_card_detail_get.api.spec.ts` | 23 | 実行前に許可確認 |

## A14-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a14/a14_03_api_card_card_search_single.api.spec.ts` | 19 | 実行前に許可確認 |

## A15-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_01_api_deck_builder_deck_login.api.spec.ts` | 25 | 実行前に許可確認 |

## A15-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_02_api_deck_builder_deck_logout.api.spec.ts` | 20 | 実行前に許可確認 |

## A15-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_03_api_deck_builder_deck_user_get.api.spec.ts` | 21 | 実行前に許可確認 |

## A15-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_04_api_deck_builder_deck_user_other_get.api.spec.ts` | 19 | 実行前に許可確認 |

## A15-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_05_api_deck_builder_deck_user_update.api.spec.ts` | 23 | 実行前に許可確認 |

## A15-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_06_api_deck_builder_deck_master.api.spec.ts` | 19 | 実行前に許可確認 |

## A15-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_07_api_deck_builder_deck_archetype_search.api.spec.ts` | 19 | 実行前に許可確認 |

## A15-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 38

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_08_api_deck_builder_deck_card_search.api.spec.ts` | 38 | 実行前に許可確認 |

## A15-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 35

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_09_api_deck_builder_deck_register.api.spec.ts` | 35 | 実行前に許可確認 |

## A15-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 32

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_10_api_deck_builder_deck_update.api.spec.ts` | 32 | 実行前に許可確認 |

## A15-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_11_api_deck_builder_deck_delete.api.spec.ts` | 20 | 実行前に許可確認 |

## A15-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 24

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_12_api_deck_builder_deck_get.api.spec.ts` | 24 | 実行前に許可確認 |

## A15-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_13_api_deck_builder_deck_search.api.spec.ts` | 28 | 実行前に許可確認 |

## A15-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_14_api_deck_builder_deck_metagame.api.spec.ts` | 25 | 実行前に許可確認 |

## A15-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 29

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_15_api_deck_builder_deck_usage_card.api.spec.ts` | 29 | 実行前に許可確認 |

## A15-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_16_api_deck_builder_deck_recent_event.api.spec.ts` | 19 | 実行前に許可確認 |

## A15-17

- 状態: 未許可
- spec数: 1
- E2E ID数: 31

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_17_api_deck_builder_deck_import_register.api.spec.ts` | 31 | 実行前に許可確認 |

## A15-18

- 状態: 未許可
- spec数: 1
- E2E ID数: 35

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a15/a15_18_api_deck_builder_deck_import_update.api.spec.ts` | 35 | 実行前に許可確認 |

## A16-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a16/a16_01_api_top_banner_get.api.spec.ts` | 20 | 実行前に許可確認 |

## A16-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a16/a16_02_api_top_banner_list.api.spec.ts` | 20 | 実行前に許可確認 |

## A17-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a17/a17_01_api_other_article_search_single.api.spec.ts` | 25 | 実行前に許可確認 |

## A17-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a17/a17_02_api_other_article_related.api.spec.ts` | 23 | 実行前に許可確認 |

## A17-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a17/a17_03_api_other_point_granter.api.spec.ts` | 26 | 実行前に許可確認 |

## A17-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a17/a17_04_api_other_product_detail.api.spec.ts` | 26 | 実行前に許可確認 |

## A17-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/a17/a17_05_api_product_search_by_name.api.spec.ts` | 20 | 実行前に許可確認 |

## ABC-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_13_admin_order_order_tracking_number.spec.ts` | 17 | 実行前に許可確認 |

## B02-01

- 状態: 未許可
- spec数: 2
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/b02/b02_01_batch_product_product_sales_period_summary.spec.ts` | 2 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b02/b02_01_batch_product_product_sales_period_summary.batch.spec.ts` | 14 | 実行前に許可確認 |

## B02-02

- 状態: 未許可
- spec数: 2
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/b02/b02_02_batch_product_product_arrival_notification_cancel.spec.ts` | 1 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b02/b02_02_batch_product_product_arrival_notification_cancel.batch.spec.ts` | 15 | 実行前に許可確認 |

## B02-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b02/b02_03_batch_product_product_storage_period_summary.batch.spec.ts` | 19 | 実行前に許可確認 |

## B02-04

- 状態: 未許可
- spec数: 2
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/b02/b02_04_batch_product_product_no_section_check.spec.ts` | 2 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b02/b02_04_batch_product_product_no_section_check.batch.spec.ts` | 8 | 実行前に許可確認 |

## B02-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b02/b02_05_batch_product_product_favorite_sale_notification.batch.spec.ts` | 12 | 実行前に許可確認 |

## B02-06

- 状態: 未許可
- spec数: 2
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/b02/b02_06_batch_product_product_stock_initialize.spec.ts` | 5 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b02/b02_06_batch_product_product_stock_initialize.batch.spec.ts` | 7 | 実行前に許可確認 |

## B02-07

- 状態: 未許可
- spec数: 2
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/b02/b02_07_batch_product_product_weekly_stock_history_update.spec.ts` | 1 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b02/b02_07_batch_product_product_weekly_stock_history_update.batch.spec.ts` | 14 | 実行前に許可確認 |

## B05-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_01_batch_order_order_copy_order_number.batch.spec.ts` | 14 | 実行前に許可確認 |

## B05-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_02_batch_order_order_resend_mail.batch.spec.ts` | 13 | 実行前に許可確認 |

## B05-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_03_batch_order_order_store_call_number_initialize.batch.spec.ts` | 13 | 実行前に許可確認 |

## B05-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_04_batch_order_order_resend_smaregi_product.batch.spec.ts` | 17 | 実行前に許可確認 |

## B05-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_05_batch_order_order_delete_smaregi_product.batch.spec.ts` | 18 | 実行前に許可確認 |

## B05-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_06_batch_order_order_check_duplicate_point.batch.spec.ts` | 10 | 実行前に許可確認 |

## B05-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_07_batch_order_order_check_not_reflected_point.batch.spec.ts` | 15 | 実行前に許可確認 |

## B05-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_08_batch_order_smaregi_check_error_order.batch.spec.ts` | 9 | 実行前に許可確認 |

## B05-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b05/b05_09_batch_order_smaregi_check_transaction.batch.spec.ts` | 10 | 実行前に許可確認 |

## B06-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b06/b06_01_batch_purchase_purchase_auto_stock.batch.spec.ts` | 17 | 実行前に許可確認 |

## B06-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b06/b06_02_batch_purchase_purchase_summary.batch.spec.ts` | 19 | 実行前に許可確認 |

## B08-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b08/b08_01_batch_customer_customer_send_account_migration.batch.spec.ts` | 13 | 実行前に許可確認 |

## B08-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b08/b08_02_batch_customer_customer_lost_points.batch.spec.ts` | 17 | 実行前に許可確認 |

## B08-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b08/b08_03_batch_customer_customer_point_expire_notification.batch.spec.ts` | 15 | 実行前に許可確認 |

## B08-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b08/b08_04_batch_customer_customer_check_blank_required.batch.spec.ts` | 9 | 実行前に許可確認 |

## B08-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b08/b08_05_batch_customer_customer_adjust_point_variance.batch.spec.ts` | 14 | 実行前に許可確認 |

## B08-06

- 状態: 未許可
- spec数: 2
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/b08/b08_06_batch_customer_smaregi_update_point.spec.ts` | 1 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b08/b08_06_batch_customer_smaregi_update_point.batch.spec.ts` | 9 | 実行前に許可確認 |

## B13-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b13/b13_01_batch_event_event_check_processing_payment.batch.spec.ts` | 15 | 実行前に許可確認 |

## B13-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b13/b13_02_batch_event_event_check_cvs_payment.batch.spec.ts` | 15 | 実行前に許可確認 |

## B16-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b16/b16_06_batch_infra_monthly_product_info_snapshot.batch.spec.ts` | 17 | 実行前に許可確認 |

## B16-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b16/b16_09_batch_infra_sitemap_generate.batch.spec.ts` | 10 | 実行前に許可確認 |

## B16-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b16/b16_10_batch_infra_staging_database_maintenance.batch.spec.ts` | 9 | 実行前に許可確認 |

## B16-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 8

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b16/b16_11_batch_infra_s3_image_size_check.batch.spec.ts` | 8 | 実行前に許可確認 |

## B17-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/batch/b17/b17_01_batch_other_create_latest_article_list.batch.spec.ts` | 17 | 実行前に許可確認 |

## F01-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f01/f01_01_front_top_home_main.spec.ts` | 11 | 実行前に許可確認 |

## F01-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 7

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f01/f01_02_front_top_home_branch.spec.ts` | 7 | 実行前に許可確認 |

## F02-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 7

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f02/f02_01_front_global_nav_global_nav_pc.spec.ts` | 7 | 実行前に許可確認 |

## F02-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 6

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f02/f02_02_front_global_nav_global_nav_sp.spec.ts` | 6 | 実行前に許可確認 |

## F02-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f02/f02_03_front_global_nav_branch_global_nav_pc.spec.ts` | 9 | 実行前に許可確認 |

## F02-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f02/f02_04_front_global_nav_branch_global_nav_sp.spec.ts` | 9 | 実行前に許可確認 |

## F03-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_01_front_product_product_search_list.spec.ts` | 18 | 実行前に許可確認 |

## F03-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_02_front_product_product_detail.spec.ts` | 15 | 実行前に許可確認 |

## F03-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_03_front_product_product_detail_search.spec.ts` | 16 | 実行前に許可確認 |

## F03-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_04_front_product_product_category_list.spec.ts` | 20 | 実行前に許可確認 |

## F03-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_05_front_product_block_recommend.spec.ts` | 17 | 実行前に許可確認 |

## F03-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_06_front_product_product_recently_viewed.spec.ts` | 13 | 実行前に許可確認 |

## F03-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_07_front_product_product_arrival_notification.spec.ts` | 9 | 実行前に許可確認 |

## F03-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f03/f03_08_front_product_product_favorite.spec.ts` | 15 | 実行前に許可確認 |

## F04-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f04/f04_01_front_cart_cart_index.spec.ts` | 23 | 実行前に許可確認 |

## F04-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f04/f04_02_front_cart_shopping_order_method.spec.ts` | 20 | 実行前に許可確認 |

## F04-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 24

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f04/f04_03_front_cart_shopping_delivery_edit.spec.ts` | 24 | 実行前に許可確認 |

## F04-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f04/f04_04_front_cart_shopping_complete.spec.ts` | 14 | 実行前に許可確認 |

## F05-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f05/f05_01_front_online_purchase_buy_top.spec.ts` | 17 | 実行前に許可確認 |

## F05-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f05/f05_02_front_online_purchase_buy_product_search.spec.ts` | 18 | 実行前に許可確認 |

## F05-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f05/f05_03_front_online_purchase_buy_product_list.spec.ts` | 15 | 実行前に許可確認 |

## F05-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f05/f05_04_front_online_purchase_buy_product_detail.spec.ts` | 17 | 実行前に許可確認 |

## F05-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f05/f05_05_front_online_purchase_buy_cart.spec.ts` | 20 | 実行前に許可確認 |

## F05-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f05/f05_06_front_online_purchase_buy_shopping_complete.spec.ts` | 19 | 実行前に許可確認 |

## F06-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_01_front_member_customer_entry.spec.ts` | 22 | 実行前に許可確認 |

## F06-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_02_front_member_entry_activate.spec.ts` | 11 | 実行前に許可確認 |

## F06-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_03_front_member_customer_login.spec.ts` | 19 | 実行前に許可確認 |

## F06-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_04_front_member_forgot_password_reset.spec.ts` | 20 | 実行前に許可確認 |

## F06-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_05_front_member_mypage_index.spec.ts` | 10 | 実行前に許可確認 |

## F06-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 24

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_06_front_member_mypage_order_history.spec.ts` | 24 | 実行前に許可確認 |

## F06-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_07_front_member_mypage_order_history_detail.spec.ts` | 15 | 実行前に許可確認 |

## F06-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_08_front_member_mypage_arrival_notification.spec.ts` | 16 | 実行前に許可確認 |

## F06-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_09_front_member_mypage_favorite_product.spec.ts` | 14 | 実行前に許可確認 |

## F06-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_10_front_member_mypage_point_history.spec.ts` | 21 | 実行前に許可確認 |

## F06-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_11_front_member_mypage_buy_history.spec.ts` | 18 | 実行前に許可確認 |

## F06-12

- 状態: 未許可
- spec数: 2
- E2E ID数: 37

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_12_front_member_mypage_bulk_purchase_result.spec.ts` | 14 | 実行前に許可確認 |
| 未許可 | `e2e/spec/front/f06/f06_12_front_member_mypage_buy_history_detail.spec.ts` | 23 | 実行前に許可確認 |

## F06-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_13_front_member_mypage_online_identification.spec.ts` | 18 | 実行前に許可確認 |

## F06-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_14_front_member_mypage_event_reserved_list.spec.ts` | 12 | 実行前に許可確認 |

## F06-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_16_front_member_mypage_event_deck_edit.spec.ts` | 18 | 実行前に許可確認 |

## F06-17

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_17_front_member_mypage_event_deck_complete.spec.ts` | 14 | 実行前に許可確認 |

## F06-18

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_18_front_member_mypage_customer_edit.spec.ts` | 14 | 実行前に許可確認 |

## F06-19

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_19_front_member_mypage_credit_card.spec.ts` | 11 | 実行前に許可確認 |

## F06-20

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_20_front_member_mypage_delivery_edit.spec.ts` | 16 | 実行前に許可確認 |

## F06-21

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_21_front_member_mypage_withdraw.spec.ts` | 18 | 実行前に許可確認 |

## F06-22

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_22_front_member_mypage_contact.spec.ts` | 14 | 実行前に許可確認 |

## F06-23

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_23_front_contact_history.spec.ts` | 14 | 実行前に許可確認 |

## F06-24

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_24_front_contact_history.spec.ts` | 14 | 実行前に許可確認 |

## F06-25

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_25_front_member_store_order_call_number.spec.ts` | 11 | 実行前に許可確認 |

## F06-26

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f06/f06_26_front_member_store_pc_account_control.spec.ts` | 11 | 実行前に許可確認 |

## F07-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f07/f07_01_front_event_event_top.spec.ts` | 21 | 実行前に許可確認 |

## F07-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f07/f07_02_front_event_event_search.spec.ts` | 25 | 実行前に許可確認 |

## F07-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f07/f07_03_front_event_event_detail.spec.ts` | 16 | 実行前に許可確認 |

## F07-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f07/f07_04_front_event_event_entry_complete.spec.ts` | 28 | 実行前に許可確認 |

## F08-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f08/f08_01_front_store_purchase_otc_buy_entry_login.spec.ts` | 13 | 実行前に許可確認 |

## F08-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f08/f08_02_front_store_purchase_otc_buy_entry_input.spec.ts` | 27 | 実行前に許可確認 |

## F08-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/front/f08/f08_03_front_store_purchase_otc_buy_entry_complete.spec.ts` | 23 | 実行前に許可確認 |

## M01-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/login.spec.ts` | 23 | 実行前に許可確認 |

## M01-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/two_factor_auth.spec.ts` | 28 | 実行前に許可確認 |

## M02-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m02/m02_01_admin_home_home_order_status.spec.ts` | 16 | 実行前に許可確認 |

## M02-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m02/m02_02_admin_home_home_sales_status.spec.ts` | 14 | 実行前に許可確認 |

## M02-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m02/m02_03_admin_home_home_sales_chart.spec.ts` | 13 | 実行前に許可確認 |

## M02-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m02/m02_04_admin_home_home_shop_status.spec.ts` | 14 | 実行前に許可確認 |

## M02-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 7

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m02/m02_05_admin_home_home_ec_cube_news.spec.ts` | 7 | 実行前に許可確認 |

## M02-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m02/m02_06_admin_home_home_recommend_plugins.spec.ts` | 9 | 実行前に許可確認 |

## M03-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_01_admin_product_product_search_list.spec.ts` | 22 | 実行前に許可確認 |

## M03-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_02_admin_product_product_edit.spec.ts` | 26 | 実行前に許可確認 |

## M03-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_03_admin_product_product_card_csv_export.spec.ts` | 21 | 実行前に許可確認 |

## M03-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_04_admin_product_product_goods_csv_export.spec.ts` | 19 | 実行前に許可確認 |

## M03-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_05_admin_product_product_sale_price_csv_export.spec.ts` | 14 | 実行前に許可確認 |

## M03-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_06_admin_product_product_custom_csv_export.spec.ts` | 14 | 実行前に許可確認 |

## M03-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_08_admin_product_product_product_class_list.spec.ts` | 22 | 実行前に許可確認 |

## M03-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 32

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_09_admin_product_product_class_edit.spec.ts` | 32 | 実行前に許可確認 |

## M03-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_10_admin_product_product_bulk_buy_standard_price_edit.spec.ts` | 20 | 実行前に許可確認 |

## M03-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_11_admin_product_product_category_register_edit.spec.ts` | 27 | 実行前に許可確認 |

## M03-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_12_admin_product_product_category_csv_export.spec.ts` | 10 | 実行前に許可確認 |

## M03-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 37

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_13_admin_product_product_tag.spec.ts` | 37 | 実行前に許可確認 |

## M03-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 33

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_14_admin_product_product_abbreviation_tag_register_edit.spec.ts` | 33 | 実行前に許可確認 |

## M03-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 5

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_15_admin_product_product_storage_code_export.spec.ts` | 5 | 実行前に許可確認 |

## M03-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_16_admin_product_product_storage_code_import.spec.ts` | 16 | 実行前に許可確認 |

## M03-17

- 状態: 未許可
- spec数: 1
- E2E ID数: 35

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_17_admin_product_product_sales_analysis_management.spec.ts` | 35 | 実行前に許可確認 |

## M03-18

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_18_admin_product_product_section.spec.ts` | 28 | 実行前に許可確認 |

## M03-19

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_19_admin_product_product_section_csv_export.spec.ts` | 12 | 実行前に許可確認 |

## M03-20

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_20_admin_product_product_department_csv_import.spec.ts` | 21 | 実行前に許可確認 |

## M03-21

- 状態: 未許可
- spec数: 1
- E2E ID数: 33

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_21_admin_product_product_shelf_number_register_edit.spec.ts` | 33 | 実行前に許可確認 |

## M03-22

- 状態: 未許可
- spec数: 1
- E2E ID数: 34

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_22_admin_product_product_sell_group.spec.ts` | 34 | 実行前に許可確認 |

## M03-23

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_23_admin_product_product_buy_sale_price_history.spec.ts` | 23 | 実行前に許可確認 |

## M03-24

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_24_admin_product_product_buy_sale_price_history_csv_export.spec.ts` | 14 | 実行前に許可確認 |

## M03-25

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_25_admin_product_product_duplicate_product_code_check.spec.ts` | 22 | 実行前に許可確認 |

## M03-26

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_26_admin_product_product_card_csv_import.spec.ts` | 23 | 実行前に許可確認 |

## M03-27

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_27_admin_product_product_goods_csv_import.spec.ts` | 25 | 実行前に許可確認 |

## M03-28

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_28_admin_product_product_product_tag_csv_import.spec.ts` | 21 | 実行前に許可確認 |

## M03-29

- 状態: 未許可
- spec数: 1
- E2E ID数: 31

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_29_admin_product_product_tag_sales_analysis_csv_import.spec.ts` | 31 | 実行前に許可確認 |

## M03-30

- 状態: 未許可
- spec数: 1
- E2E ID数: 24

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_30_admin_product_product_product_price_csv_import.spec.ts` | 24 | 実行前に許可確認 |

## M03-31

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_31_admin_product_product_sale_price_csv_import.spec.ts` | 18 | 実行前に許可確認 |

## M03-32

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_32_admin_product_product_simple_high_price_csv_import.spec.ts` | 27 | 実行前に許可確認 |

## M03-33

- 状態: 未許可
- spec数: 1
- E2E ID数: 34

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_33_admin_product_product_sale_high_price_csv_import.spec.ts` | 34 | 実行前に許可確認 |

## M03-34

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_34_admin_product_product_discount_csv_import.spec.ts` | 23 | 実行前に許可確認 |

## M03-35

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_35_admin_product_product_section_csv_import.spec.ts` | 25 | 実行前に許可確認 |

## M03-36

- 状態: 未許可
- spec数: 1
- E2E ID数: 39

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_36_admin_product_product_buy_discount_csv_import.spec.ts` | 39 | 実行前に許可確認 |

## M03-37

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_37_admin_product_product_storage_code_csv_import.spec.ts` | 25 | 実行前に許可確認 |

## M03-38

- 状態: 未許可
- spec数: 1
- E2E ID数: 32

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_38_admin_product_product_status_csv.spec.ts` | 32 | 実行前に許可確認 |

## M03-40

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_40_admin_product_product_shelf_number_csv_import.spec.ts` | 27 | 実行前に許可確認 |

## M03-41

- 状態: 未許可
- spec数: 1
- E2E ID数: 31

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_41_admin_product_product_category_csv_import.spec.ts` | 31 | 実行前に許可確認 |

## M03-44

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_44_admin_product_product_simple_low_price_csv_import.spec.ts` | 22 | 実行前に許可確認 |

## M03-45

- 状態: 未許可
- spec数: 1
- E2E ID数: 33

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m03/m03_45_admin_product_product_category_list.spec.ts` | 33 | 実行前に許可確認 |

## M04-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 35

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_01_admin_stock_stock_search_list.spec.ts` | 35 | 実行前に許可確認 |

## M04-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 29

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_02_admin_stock_stock_edit.spec.ts` | 29 | 実行前に許可確認 |

## M04-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_03_admin_stock_stock_bulk_edit.spec.ts` | 15 | 実行前に許可確認 |

## M04-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_04_admin_stock_stock_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M04-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_05_admin_stock_product_stock_custom_csv_export.spec.ts` | 15 | 実行前に許可確認 |

## M04-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 30

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_08_admin_stock_stock_move_transfer_search_list.spec.ts` | 30 | 実行前に許可確認 |

## M04-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_09_admin_stock_stock_move_transfer_register_edit.spec.ts` | 28 | 実行前に許可確認 |

## M04-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_10_admin_stock_stock_move_transfer_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M04-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_11_admin_stock_product_stock_history_csv_export.spec.ts` | 9 | 実行前に許可確認 |

## M04-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_12_admin_stock_stock_split_join_search_list.spec.ts` | 21 | 実行前に許可確認 |

## M04-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_13_admin_stock_stock_split_join_register_edit.spec.ts` | 19 | 実行前に許可確認 |

## M04-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_14_admin_stock_stock_split_join_csv_export.spec.ts` | 10 | 実行前に許可確認 |

## M04-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_15_admin_stock_stock_split_join_custom_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M04-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 8

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_16_admin_stock_product_stock_recommend_csv_export.spec.ts` | 8 | 実行前に許可確認 |

## M04-17

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_17_admin_stock_stock_history_search_list.spec.ts` | 15 | 実行前に許可確認 |

## M04-18

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_18_admin_stock_stock_history_csv_export.spec.ts` | 10 | 実行前に許可確認 |

## M04-19

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_19_admin_stock_stock_shortage_history_search_list.spec.ts` | 19 | 実行前に許可確認 |

## M04-20

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_20_admin_stock_stock_shortage_history_csv_export.spec.ts` | 14 | 実行前に許可確認 |

## M04-21

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_21_admin_stock_stock_csv_import.spec.ts` | 14 | 実行前に許可確認 |

## M04-22

- 状態: 未許可
- spec数: 1
- E2E ID数: 31

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_22_admin_stock_stock_move_transfer_csv_import.spec.ts` | 31 | 実行前に許可確認 |

## M04-23

- 状態: 未許可
- spec数: 1
- E2E ID数: 37

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_23_admin_stock_stock_split_join_csv_import.spec.ts` | 37 | 実行前に許可確認 |

## M04-24

- 状態: 未許可
- spec数: 1
- E2E ID数: 47

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_24_admin_stock_stock_move_instruction_search_create.spec.ts` | 47 | 実行前に許可確認 |

## M04-25

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_25_admin_stock_stock_move_instruction_export.spec.ts` | 17 | 実行前に許可確認 |

## M04-26

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_26_admin_stock_stock_move_instruction_picking_list_print.spec.ts` | 10 | 実行前に許可確認 |

## M04-27

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_27_admin_stock_stock_move_result_csv_export.spec.ts` | 12 | 実行前に許可確認 |

## M04-28

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_28_admin_stock_stock_invoice_csv_export.spec.ts` | 13 | 実行前に許可確認 |

## M04-29

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_29_admin_stock_stock_move_result_csv_import.spec.ts` | 23 | 実行前に許可確認 |

## M04-30

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_30_admin_stock_stock_barcode_replacement_list_csv_export.spec.ts` | 19 | 実行前に許可確認 |

## M04-31

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_31_admin_stock_stock_inventory_plan.spec.ts` | 22 | 実行前に許可確認 |

## M04-32

- 状態: 未許可
- spec数: 1
- E2E ID数: 29

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_32_admin_stock_stock_approval_list.spec.ts` | 29 | 実行前に許可確認 |

## M04-33

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_33_admin_stock_stock_move_return_list_csv_export.spec.ts` | 19 | 実行前に許可確認 |

## M04-34

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m04/m04_34_admin_stock_stock_move_return_list_pdf_export.spec.ts` | 13 | 実行前に許可確認 |

## M05-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 30

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_01_admin_order_order_search_list.spec.ts` | 30 | 実行前に許可確認 |

## M05-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_02_admin_order_order_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M05-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_03_admin_order_order_custom_csv_export.spec.ts` | 15 | 実行前に許可確認 |

## M05-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_04_admin_order_order_shipping_csv_export.spec.ts` | 12 | 実行前に許可確認 |

## M05-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_05_admin_order_order_shipping_custom_csv_export.spec.ts` | 14 | 実行前に許可確認 |

## M05-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 24

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_06_admin_order_order_bulk_manual_mail.spec.ts` | 24 | 実行前に許可確認 |

## M05-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_07_admin_order_order_labels_csv_export.spec.ts` | 13 | 実行前に許可確認 |

## M05-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_08_admin_order_order_stack_paper_print.spec.ts` | 13 | 実行前に許可確認 |

## M05-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.spec.ts` | 10 | 実行前に許可確認 |

## M05-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.spec.ts` | 12 | 実行前に許可確認 |

## M05-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_11_admin_order_order_edit.spec.ts` | 20 | 実行前に許可確認 |

## M05-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_12_admin_order_order_bulk_status_change.spec.ts` | 23 | 実行前に許可確認 |

## M05-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_14_admin_order_order_status_change.spec.ts` | 17 | 実行前に許可確認 |

## M05-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_15_admin_order_order_mail.spec.ts` | 18 | 実行前に許可確認 |

## M05-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_16_admin_order_order_shop_memo.spec.ts` | 14 | 実行前に許可確認 |

## M05-17

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_17_admin_order_order_shipping_memo.spec.ts` | 19 | 実行前に許可確認 |

## M05-18

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_18_admin_order_order_shipping_standby_list_create.spec.ts` | 14 | 実行前に許可確認 |

## M05-19

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_19_admin_order_order_shipping_standby_list_search.spec.ts` | 13 | 実行前に許可確認 |

## M05-20

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_20_admin_order_order_shipping_standby_detail_edit_delete.spec.ts` | 22 | 実行前に許可確認 |

## M05-21

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_21_admin_order_order_shipping_standby_picking_list_print.spec.ts` | 13 | 実行前に許可確認 |

## M05-22

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja.spec.ts` | 11 | 実行前に許可確認 |

## M05-23

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_23_admin_order_order_shipping_standby_print_delivery_slips_en.spec.ts` | 21 | 実行前に許可確認 |

## M05-24

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_24_admin_order_order_shipping_export_for_import.spec.ts` | 14 | 実行前に許可確認 |

## M05-26

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_26_admin_order_order_shipping_result_csv_import.spec.ts` | 22 | 実行前に許可確認 |

## M05-27

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m05/m05_27_admin_order_order_waiting_tag.spec.ts` | 22 | 実行前に許可確認 |

## M06-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_01_admin_store_purchase_purchase_store_search_list.spec.ts` | 20 | 実行前に許可確認 |

## M06-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.spec.ts` | 15 | 実行前に許可確認 |

## M06-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 34

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_03_admin_store_purchase_purchase_store_otc_buy_info_edit.spec.ts` | 34 | 実行前に許可確認 |

## M06-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_04_admin_store_purchase_purchase_store_status_change.spec.ts` | 18 | 実行前に許可確認 |

## M06-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_05_admin_store_purchase_purchase_store_history.spec.ts` | 21 | 実行前に許可確認 |

## M06-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_06_admin_store_purchase_purchase_store_history_csv_export_all.spec.ts` | 13 | 実行前に許可確認 |

## M06-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_07_admin_store_purchase_purchase_store_history_select_csv_export.spec.ts` | 15 | 実行前に許可確認 |

## M06-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_08_admin_store_purchase_purchase_store_summary.spec.ts` | 20 | 実行前に許可確認 |

## M06-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_09_admin_store_purchase_otc_buy_order_summary_csv_export.spec.ts` | 13 | 実行前に許可確認 |

## M06-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_10_admin_store_purchase_purchase_store_return_list_csv_export.spec.ts` | 17 | 実行前に許可確認 |

## M06-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_11_admin_store_purchase_purchase_store_return_list_pdf_export.spec.ts` | 16 | 実行前に許可確認 |

## M06-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m06/m06_12_admin_store_purchase_purchase_store_product_list_csv_export.spec.ts` | 12 | 実行前に許可確認 |

## M07-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_01_admin_online_purchase_purchase_online_search_list.spec.ts` | 23 | 実行前に許可確認 |

## M07-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.spec.ts` | 16 | 実行前に許可確認 |

## M07-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_03_admin_online_purchase_purchase_online_buy_order_edit.spec.ts` | 27 | 実行前に許可確認 |

## M07-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_04_admin_online_purchase_purchase_manual_mail.spec.ts` | 18 | 実行前に許可確認 |

## M07-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_05_admin_online_purchase_purchase_csv_export_deposit.spec.ts` | 18 | 実行前に許可確認 |

## M07-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_06_admin_online_purchase_purchase_online_product_list_csv_export.spec.ts` | 16 | 実行前に許可確認 |

## M07-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_07_admin_online_purchase_purchase_online_product_cancel_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M07-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_08_admin_online_purchase_purchase_online_return_list_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M07-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m07/m07_09_admin_online_purchase_purchase_online_return_list_pdf_export.spec.ts` | 15 | 実行前に許可確認 |

## M08-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_01_admin_customer_customer_search_list.spec.ts` | 27 | 実行前に許可確認 |

## M08-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_02_admin_customer_customer_mail_all.spec.ts` | 13 | 実行前に許可確認 |

## M08-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_03_admin_customer_customer_csv_export.spec.ts` | 10 | 実行前に許可確認 |

## M08-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_04_admin_customer_customer_edit.spec.ts` | 27 | 実行前に許可確認 |

## M08-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_05_admin_customer_point.spec.ts` | 18 | 実行前に許可確認 |

## M08-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_06_admin_customer_point.spec.ts` | 19 | 実行前に許可確認 |

## M08-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_07_admin_customer_customer_mail_history.spec.ts` | 17 | 実行前に許可確認 |

## M08-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_08_admin_customer_customer_manual_mail.spec.ts` | 17 | 実行前に許可確認 |

## M08-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_09_admin_customer_customer_delivery.spec.ts` | 21 | 実行前に許可確認 |

## M08-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_10_admin_customer_customer_online_identification.spec.ts` | 18 | 実行前に許可確認 |

## M08-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_12_admin_customer_customer_group.spec.ts` | 16 | 実行前に許可確認 |

## M08-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_13_admin_customer_customer_blacklist.spec.ts` | 15 | 実行前に許可確認 |

## M08-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m08/m08_14_admin_customer_customer_resend_provisional_mail.spec.ts` | 10 | 実行前に許可確認 |

## M09-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 37

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_01_admin_content_content_news.spec.ts` | 37 | 実行前に許可確認 |

## M09-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 47

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_02_admin_content_content_file.spec.ts` | 47 | 実行前に許可確認 |

## M09-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 33

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_03_admin_content_content_layout.spec.ts` | 33 | 実行前に許可確認 |

## M09-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_04_admin_content_content_page.spec.ts` | 28 | 実行前に許可確認 |

## M09-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_05_admin_content_content_css.spec.ts` | 16 | 実行前に許可確認 |

## M09-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_06_admin_content_content_js.spec.ts` | 19 | 実行前に許可確認 |

## M09-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 29

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_07_admin_content_content_block.spec.ts` | 29 | 実行前に許可確認 |

## M09-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_08_admin_content_content_cache.spec.ts` | 12 | 実行前に許可確認 |

## M09-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_09_admin_content_content_maintenance.spec.ts` | 21 | 実行前に許可確認 |

## M09-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m09/m09_10_admin_content_content_branch_top_page.spec.ts` | 17 | 実行前に許可確認 |

## M10-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_01_admin_shop_setting_setting_shop.spec.ts` | 19 | 実行前に許可確認 |

## M10-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_02_admin_base_setting_setting_shop_tradelaw.spec.ts` | 14 | 実行前に許可確認 |

## M10-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_04_admin_base_setting_setting_shop_payment.spec.ts` | 27 | 実行前に許可確認 |

## M10-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_05_admin_base_setting_setting_shop_delivery_free_conditions.spec.ts` | 12 | 実行前に許可確認 |

## M10-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 33

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_06_admin_base_setting_setting_shop_delivery.spec.ts` | 33 | 実行前に許可確認 |

## M10-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_07_admin_base_setting_setting_shop_tax.spec.ts` | 23 | 実行前に許可確認 |

## M10-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_08_admin_base_setting_setting_shop_auto_mail.spec.ts` | 18 | 実行前に許可確認 |

## M10-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_09_admin_base_setting_setting_shop_mail.spec.ts` | 23 | 実行前に許可確認 |

## M10-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 27

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_10_admin_base_setting_setting_shop_csv.spec.ts` | 27 | 実行前に許可確認 |

## M10-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_11_admin_base_setting_setting_shop_order_status.spec.ts` | 26 | 実行前に許可確認 |

## M10-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 34

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_12_admin_base_setting_setting_shop_calendar.spec.ts` | 34 | 実行前に許可確認 |

## M10-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 30

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_13_admin_base_setting_setting_shop_csv_custom.spec.ts` | 30 | 実行前に許可確認 |

## M10-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_14_admin_base_setting_setting_shop_mall_shop_list.spec.ts` | 25 | 実行前に許可確認 |

## M10-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_15_admin_base_setting_setting_shop_register.spec.ts` | 20 | 実行前に許可確認 |

## M10-16

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_16_admin_base_setting_setting_shop_additional_system.spec.ts` | 16 | 実行前に許可確認 |

## M11-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m11/m11_01_admin_system_setting_setting_system_member_list.spec.ts` | 21 | 実行前に許可確認 |

## M11-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m11/m11_02_admin_system_setting_setting_system_member_edit.spec.ts` | 26 | 実行前に許可確認 |

## M11-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m11/m11_03_admin_system_setting_setting_system_authority.spec.ts` | 14 | 実行前に許可確認 |

## M11-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 32

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m11/m11_04_admin_system_setting_setting_system_login_history.spec.ts` | 32 | 実行前に許可確認 |

## M11-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m11/m11_05_admin_system_setting_setting_system_masterdata.spec.ts` | 22 | 実行前に許可確認 |

## M11-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m11/m11_06_admin_system_setting_setting_system_system_info.spec.ts` | 23 | 実行前に許可確認 |

## M12-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_01_admin_analytics_sales_daily_monthly_summary.spec.ts` | 25 | 実行前に許可確認 |

## M12-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 8

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_02_admin_analytics_sales_daily_monthly_csv_export.spec.ts` | 8 | 実行前に許可確認 |

## M12-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_03_admin_analytics_sales_order_analysis_summary.spec.ts` | 18 | 実行前に許可確認 |

## M12-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_04_admin_analytics_sales_order_analysis_csv_export.spec.ts` | 9 | 実行前に許可確認 |

## M12-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_05_admin_analytics_sales_arrival_notification_search_list.spec.ts` | 19 | 実行前に許可確認 |

## M12-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_06_admin_analytics_sales_arrival_notification_csv_export.spec.ts` | 15 | 実行前に許可確認 |

## M12-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_07_admin_analytics_sales_format_analysis_summary.spec.ts` | 11 | 実行前に許可確認 |

## M12-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 9

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_08_admin_analytics_sales_format_analysis_csv_export.spec.ts` | 9 | 実行前に許可確認 |

## M12-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_09_admin_analysis_used_card.spec.ts` | 10 | 実行前に許可確認 |

## M12-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m12/m12_10_admin_analysis_used_card.spec.ts` | 11 | 実行前に許可確認 |

## M13-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 31

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_01_admin_event_event_search_list.spec.ts` | 31 | 実行前に許可確認 |

## M13-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_02_admin_event_event_edit_delete.spec.ts` | 18 | 実行前に許可確認 |

## M13-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_03_admin_event_event_schedule_add.spec.ts` | 12 | 実行前に許可確認 |

## M13-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_04_admin_event_event_repeat_schedule.spec.ts` | 12 | 実行前に許可確認 |

## M13-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_05_admin_event_event_duplicate_register.spec.ts` | 15 | 実行前に許可確認 |

## M13-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_06_admin_event_event_entry_management_search.spec.ts` | 21 | 実行前に許可確認 |

## M13-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_07_admin_event_event_entry_bulk_update.spec.ts` | 16 | 実行前に許可確認 |

## M13-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_08_admin_event_event_deck_view.spec.ts` | 11 | 実行前に許可確認 |

## M13-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_09_admin_event_event_csv_export.spec.ts` | 11 | 実行前に許可確認 |

## M13-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 20

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_10_admin_event_event_entry_edit.spec.ts` | 20 | 実行前に許可確認 |

## M13-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_11_admin_event_event_entry_search.spec.ts` | 19 | 実行前に許可確認 |

## M13-12

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_12_admin_event_event_entry_register.spec.ts` | 21 | 実行前に許可確認 |

## M13-13

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_13_admin_event_event_entry_csv_import.spec.ts` | 18 | 実行前に許可確認 |

## M13-14

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_14_admin_event_event_banner.spec.ts` | 26 | 実行前に許可確認 |

## M13-15

- 状態: 未許可
- spec数: 1
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m13/m13_15_admin_event_event_image_setting.spec.ts` | 16 | 実行前に許可確認 |

## M14-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_01_admin_card_card_search.spec.ts` | 23 | 実行前に許可確認 |

## M14-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 15

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_02_admin_card_card_csv_export.spec.ts` | 15 | 実行前に許可確認 |

## M14-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_03_admin_card_card_bulk_delete.spec.ts` | 14 | 実行前に許可確認 |

## M14-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_04_admin_card_card_register_update_delete.spec.ts` | 25 | 実行前に許可確認 |

## M14-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_05_admin_card_card_csv_import.spec.ts` | 17 | 実行前に許可確認 |

## M14-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 34

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_06_admin_card_cardset_list.spec.ts` | 34 | 実行前に許可確認 |

## M14-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 19

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_07_admin_card_cardset_image_download.spec.ts` | 19 | 実行前に許可確認 |

## M14-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 22

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_08_admin_card_cardset_register_update_delete.spec.ts` | 22 | 実行前に許可確認 |

## M14-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 17

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_09_admin_card_format_list.spec.ts` | 17 | 実行前に許可確認 |

## M14-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 32

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m14/m14_10_admin_card_card_format_register_edit_delete.spec.ts` | 32 | 実行前に許可確認 |

## M15-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 26

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_01_admin_deck_deck_search.spec.ts` | 26 | 実行前に許可確認 |

## M15-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 12

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_02_admin_deck_deck_csv_export.spec.ts` | 12 | 実行前に許可確認 |

## M15-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 13

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_03_admin_deck_deck_bulk_delete.spec.ts` | 13 | 実行前に許可確認 |

## M15-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_04_admin_deck_deck_bulk_update.spec.ts` | 21 | 実行前に許可確認 |

## M15-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 30

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_05_admin_deck_deck_edit.spec.ts` | 30 | 実行前に許可確認 |

## M15-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_06_admin_deck_deck_csv_import.spec.ts` | 28 | 実行前に許可確認 |

## M15-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 7

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_07_admin_deck_deck_tag_list.spec.ts` | 7 | 実行前に許可確認 |

## M15-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_08_admin_deck_deck_archetype_search.spec.ts` | 23 | 実行前に許可確認 |

## M15-09

- 状態: 未許可
- spec数: 1
- E2E ID数: 39

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_09_admin_deck_deck_archetype_crud.spec.ts` | 39 | 実行前に許可確認 |

## M15-10

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_10_admin_deck_archetype_csv_import.spec.ts` | 21 | 実行前に許可確認 |

## M15-11

- 状態: 未許可
- spec数: 1
- E2E ID数: 21

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m15/m15_11_admin_deck_deck_latest_event.spec.ts` | 21 | 実行前に許可確認 |

## M16-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 25

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_01_admin_data_top_banner.spec.ts` | 25 | 実行前に許可確認 |

## M16-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 24

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_02_admin_data_data_top_banner.spec.ts` | 24 | 実行前に許可確認 |

## M16-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_03_admin_data_data_holiday_add_delete.spec.ts` | 23 | 実行前に許可確認 |

## M16-04

- 状態: 未許可
- spec数: 1
- E2E ID数: 28

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_04_admin_data_hareruya_mtg_masterdata.spec.ts` | 28 | 実行前に許可確認 |

## M16-05

- 状態: 未許可
- spec数: 1
- E2E ID数: 10

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_05_admin_data_data_sale_discount_list.spec.ts` | 10 | 実行前に許可確認 |

## M16-06

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_06_admin_data_data_buy_price_list.spec.ts` | 14 | 実行前に許可確認 |

## M16-07

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_07_admin_data_data_buy_price_list_edit.spec.ts` | 18 | 実行前に許可確認 |

## M16-08

- 状態: 未許可
- spec数: 1
- E2E ID数: 14

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m16/m16_08_admin_data_data_buy_discount_list.spec.ts` | 14 | 実行前に許可確認 |

## O01-01

- 状態: 未許可
- spec数: 1
- E2E ID数: 23

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/o01/o01_01_other_mtg_buyer_mtg_buyer_store_purchase.spec.ts` | 23 | 実行前に許可確認 |

## O01-02

- 状態: 未許可
- spec数: 1
- E2E ID数: 18

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/o01/o01_02_other_mtg_buyer_mtg_buyer_online_purchase.spec.ts` | 18 | 実行前に許可確認 |

## O01-03

- 状態: 未許可
- spec数: 1
- E2E ID数: 11

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/api/o01/o01_03_other_mtg_buyer_mtg_buyer_stock_inbound.spec.ts` | 11 | 実行前に許可確認 |

## UNKNOWN

- 状態: 未許可
- spec数: 2
- E2E ID数: 16

| 状態 | spec | E2E ID数 | 次アクション |
|---|---:|---:|---|
| 未許可 | `e2e/spec/admin/m10/m10_03_admin_base_setting_setting_shop_customer_agreement.spec.ts` | 10 | 実行前に許可確認 |
| 未許可 | `e2e/spec/batch/b16/batch_s3_file_sync.batch.spec.ts` | 6 | 実行前に許可確認 |

