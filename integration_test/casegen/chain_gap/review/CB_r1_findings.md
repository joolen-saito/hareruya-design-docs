### 指摘1（重大度: Major）対象: CH-0137
主張: モーダルを閉じる操作方法が不明なので「作れない」。
実際: 出典は、完全削除の成功後に完了操作をすると商品一覧へ遷移すると定める（[0204 HTML:1643](</home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:1643>)）。実装にも「完了」ボタンと、その押下による遷移処理がある（[product.twig:75](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product.twig:75)、[product_js.twig:251](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product_js.twig:251)）。既存の IT-M03-02-043 は削除を起こすが、期待結果はDB上の削除だけで画面遷移を確認しない（[M03-02_test_cases.tsv:39](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M03-02_test_cases.tsv:39)）。
判定: 判定の誤り
修正案: 「作成」に変更する。専用商品を画面から準備し、編集画面で削除、成功後にモーダルの「完了」を押し、商品一覧画面への遷移を確認するケースを追加する。失敗時は遷移を期待しない。

### 指摘2（重大度: Minor）対象: CH-0142
主張: 検索条件・表示件数の引継ぎは設計書に定めがない。
実際: 遷移先の設計書は、検索条件・ページ番号・表示件数を画面をまたいで保持すると明記する（[m03-01設計書:27](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m03-01_admin_product_product_search_list.md:27)）。出力元も、要求したページの商品一覧へ戻ると定める（[m03-05設計書:39](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md:39)）。IT-M03-05-011 は契機と2ページ目への復帰を確認するが、検索条件と表示件数は期待結果で確認していない（[M03-05_test_cases.tsv:7](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M03-05_test_cases.tsv:7)）。著者の記述は[判定表:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/chain_gap/gen_CB/chain_judgement.tsv:6)にある。
判定: 推測
修正案: 「既存で確認済み」は画面遷移について維持し、「引継ぎの定めなし」を訂正する。IT-M03-05-011 の期待結果に、商品名の検索条件と表示件数10件が復帰後も保持される確認を加える。
