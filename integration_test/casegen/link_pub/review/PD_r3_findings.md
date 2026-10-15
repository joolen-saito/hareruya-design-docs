### 指摘1（重大度: Major）対象: S-F05-06-PD-PRODUCT
変更: A（2巡目の反映）
主張: 3規格の部門に「選択肢の先頭の部門」を指定すれば登録できる。
実際: 商品規格の部門は必須だが、商品シードは部門の存在確認・作成を行わない（`integration_test/casegen/link_pub/cases/PD_seed_data.tsv:4`、`excel_to_html/output/0204_基本設計仕様書(商品管理).html:3584,3634`）。ケースの事前準備にも部門の値はなく、2件ともこの商品シードを使う（`integration_test/casegen/link_pub/cases/PD_test_cases.tsv:2-3`）。結合テストは専用DBへシードを投入して始める規約のため、選択できる部門があるとは限らない（`integration_test/casegen/precond/README.md:71`）。
判定: 反映不備
修正案: 商品シードで部門名・部門コード・免税区分を指定して部門登録画面から作成し、登録された部門を3規格に選択する。ケース2件の事前準備にもその部門の値を記載する。
