### 指摘1（重大度: Minor）対象: IT-M06-04-RF002
主張: 販売金額の対応は設計書から確定できないため、期待結果から外した（`integration_test/casegen/link_flow/gen_RF/report.md:56,62`）。
実際: ケースの手順4には「販売金額を確認する」が残っている（`integration_test/casegen/link_flow/cases/RF_test_cases.tsv:6`）。著者の対応表も、期待結果の項目として販売金額を挙げたままである（`integration_test/casegen/link_flow/gen_RF/report.md:25,33`）。個別入力商品の画面入力は「基準価格」と記されている（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:88`）。
判定: 手順不備
修正案: RF002の手順4から「販売金額」を削り、対応表も現在の期待結果で確認する項目だけに直す。
