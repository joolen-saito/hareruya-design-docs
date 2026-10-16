### 指摘1（重大度: Minor）対象: S-M04-22-RD-STOCK-002
変更: A（2巡目の反映）  
主張: 振り直しに合わせ、シードのCSV名と商品コードを002に改めた。  
実際: CSV名・商品コード・用途は002だが、論理名だけ「移動元商品とCSV(003)」のままで、同じシードを異なる番号で指している（integration_test/casegen/link_flow/cases/RD_seed_data.tsv:24）。  
判定: 反映不備  
修正案: 論理名を「移動CSV登録→在庫検索一覧用の移動元商品とCSV(002)」に直す。

### 指摘2（重大度: Minor）対象: IT-M04-09-RD007
変更: 追加ケース  
主張: 入庫先の在庫移動履歴が操作前にはなく、承認後には総原価0→300の履歴が表示される。  
実際: 事前準備とシードの状態欄には、操作前の入庫先履歴がないことと、300の根拠となる登録時出庫総原価が書かれていない（integration_test/casegen/link_flow/cases/RD_test_cases.tsv:8、integration_test/casegen/link_flow/cases/RD_seed_data.tsv:12）。設計書は入庫先の仕入総原価に登録時出庫総原価を使うと定める（excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:3242）。操作前の期待値は事前準備に置く規約にも合わない（integration_test/casegen/precond/README.md:27-28）。  
判定: 規約違反  
修正案: シードの状態欄とケースの事前準備に「店舗Bに本商品の在庫移動履歴なし」「登録時出庫総原価300」を明記する。
