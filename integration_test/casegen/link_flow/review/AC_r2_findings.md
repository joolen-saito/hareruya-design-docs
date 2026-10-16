### 指摘1（重大度: Major）対象: 群AC

主張: 各ケースのシードは、ネット買取の申込みを画面から完了して受注を用意できる。

実際: 9ケースの受注シードは、いずれも「申込み」を押す手順に「ネット買取規約同意」のチェックを含めていない（`integration_test/casegen/link_flow/cases/AC_seed_data.tsv:14`〜`22`）。0305「ネット買取買取手続き～完了」は、チェックがなければ画面遷移せずエラーとなり、チェックがある場合に申込処理を行うと定める（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2169`〜`2170`）。

判定: 前提不成立

修正案: 各受注シードの投入方法に、申込み前に「ネット買取規約同意」をチェックする操作を加える。

### 指摘2（重大度: Major）対象: IT-A07-03-AC001

主張: API呼出し前の管理者用メモは未入力である。

実際: 専用シードはカード指定のないサプライ商品1点で買取申込みを行う（`integration_test/casegen/link_flow/cases/AC_seed_data.tsv:5`、`:14`）。F05-06は、サプライ品の「名称x数量」をメモに保存すると定める（`functions/pf-eccube3/f05-06_front_online_purchase_buy_shopping_complete.md:31`〜`33`）。申込処理とA07-03のAPIはいずれも受注の同じメモを更新する（`pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:334`〜`352`、`pf-api/src/Controller/Admin/BuyOrderFreeCommentController.php:43`〜`45`）。したがって、ケースが期待する操作前の空欄は成立しない（`integration_test/casegen/link_flow/cases/AC_test_cases.tsv:2`）。

判定: 前提不成立

修正案: 操作前のメモを「AC申込用サプライ03x1」として事前準備・期待結果を書き直し、API呼出し後に連携メモへ変わることを確かめる。

### 指摘3（重大度: Major）対象: IT-A07-05-AC005

主張: 商品規格ID・数量・買取金額などを送ると査定終了APIが成功し、買取履歴詳細の査定価格が1200になる。

実際: 手順4の明細には商品名がない（`integration_test/casegen/link_flow/cases/AC_test_cases.tsv:10`）。0507「ネット買取注文の査定終了処理」のリクエストパラメータでは、明細の`name`（商品名）が必須である（`excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1460`〜`1462`）。入力検証に失敗すると査定終了処理へ進まない（`functions/pf-api/a07-05_api_online_purchase_buy_order_end.md:5`〜`12`）。

判定: 手順不備

修正案: 手順4の明細に商品名「AC連携カードA0705005」を指定する。
