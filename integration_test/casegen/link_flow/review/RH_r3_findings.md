### 指摘1（重大度: Major）対象: IT-M08-04-RH003
変更: A（2巡目の反映）  
主張: 必須項目を入力して店舗「M08-04 RH店舗」を登録できる。  
実際: シードは店名(英語表記)に「RH Store 0804」を入力する（`integration_test/casegen/link_flow/cases/RH_seed_data.tsv:9`）。設計書はこの項目を半角英字とスペースに限定しており、数字を許していない（`excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:2273`）。  
判定: 入力制約違反  
修正案: 店名(英語表記)を「RH Store」にする。

### 指摘2（重大度: Major）対象: IT-M08-08-RH001
変更: A（2巡目の反映）  
主張: 必須項目を入力して店舗「M0808RH店舗」を登録できる。  
実際: シードは店名(英語表記)に「RH Store 0808」を入力する（`integration_test/casegen/link_flow/cases/RH_seed_data.tsv:14`）。設計書が許す半角英字とスペース以外に数字が含まれる（`excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:2273`）。  
判定: 入力制約違反  
修正案: 店名(英語表記)を「RH Store」にする。
