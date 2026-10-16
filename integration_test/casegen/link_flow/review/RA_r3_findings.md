### 指摘1（重大度: Major）対象: IT-M03-09-RA005
変更: 追加ケース  
主張: グッズ商品CSVで作った査定用商品を、MTGバイヤーでカード名検索して買取明細に追加し、入庫待ちの店頭買取を用意できる。  
実際: シードの投入方法はグッズ商品CSV登録だけで、商品画像やカード詳細・カード・レアリティとの関連付けがない（`integration_test/casegen/link_flow/cases/RA_seed_data.tsv:16`）。カード名検索APIは、これらのいずれかが結び付いていない商品規格を応答に含めない（`functions/pf-api/a06-08_api_store_purchase_buying_products_search.md:9-15`）。検索結果がなければ査定表に行を追加できない（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:91-95`）。  
判定: 前提不成立  
修正案: `S-M03-09-RA-BUYORDER-005`を、商品画像とカード詳細・カード・レアリティを関連付け、カード名検索で取得できるカード商品として作る投入方法に書き直す。
