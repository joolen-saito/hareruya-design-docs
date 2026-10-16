### 指摘1（重大度: Major）対象: S-M14-04-RJ-CARD-001
変更: A（2巡目の反映）  
主張: 初回カード登録CSVの見出しとデータ行を37列で具体化し、「Foilフラグ」「プロモフラグ」も含めている（integration_test/casegen/link_flow/cases/RJ_seed_data.tsv:12）。  
実際: HTML設計書は両項目を除去すると定める（excel_to_html/output/0208_基本設計仕様書(カード管理).html:1833, :1836）。取込は見出しの一致を要求する（functions/pf-eccube3/m14-05_admin_card_card_csv_import.md:11）。このCSVでは事前準備のカード登録が成立しない。  
判定: 反映による新たな誤り  
修正案: 見出しとデータ行から「Foilフラグ」「プロモフラグ」の2列を削除し、35列のCSVとして記載する。

### 指摘2（重大度: Major）対象: S-M14-05-RJ-CARD-001
変更: A（2巡目の反映）  
主張: 初回登録用と更新用の両CSVを37列で具体化し、いずれにも「Foilフラグ」「プロモフラグ」を含めている（integration_test/casegen/link_flow/cases/RJ_seed_data.tsv:14）。  
実際: 両項目は設計上の除去対象であり、取込は見出しの一致を要求する（excel_to_html/output/0208_基本設計仕様書(カード管理).html:1833, :1836、functions/pf-eccube3/m14-05_admin_card_card_csv_import.md:11）。初回登録と手順中の更新の双方が成立しない。  
判定: 反映による新たな誤り  
修正案: 初回登録用・更新用の両方について、見出しとデータ行から該当2列を削除する。
