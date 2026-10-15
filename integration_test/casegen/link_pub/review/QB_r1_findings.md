### 指摘1（重大度: Major）対象: 群QB（M03-26・M03-27）

主張: カード商品・グッズ商品CSVから本店TOPへの反映は、M03-28のケースと「同じデータの同じ反映」なので作らない（[report.md:28](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QB/report.md:28)）。

実際: M03-26とM03-27のCSVには、それぞれ商品タグを更新する列がある（[0204設計書:2255](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:2255)、[同:2657](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:2657)）。本店TOPの「最新入荷アイテム」はそのタグの商品を表示する（[0301設計書:1261](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:1261)）。M03-28とは**手順で行う上流操作が別**であり、`all_test_cases.tsv`にもM03-26・M03-27のCSV操作後にTOPを確認するケースは無い。

判定: 取りこぼし

修正案: M03-26→F01-01、M03-27→F01-01を各1件追加する。操作前に対象商品が「最新入荷アイテム」に載らない状態を作り、各CSVのタグ列を更新した後、キャッシュの満了を待って掲載を確認する。

### 指摘2（重大度: Major）対象: IT-M03-28-QB003・QB004、IT-M03-38-QB003・QB004

主張: 名称が「セール」のタグIDを控えて商品に付ければ、支店TOPの「SALE中の商品」への掲載を確認できる（[QB_seed_data.tsv:16](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QB_seed_data.tsv:16)、[同:28](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QB_seed_data.tsv:28)）。

実際: 支店TOPが使うのは**運用で名称を変更する固定のセールタグ**である（[0301設計書:2288](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:2288)）。「セール」という名称で見つけたタグがその固定タグと同一とは、シードから確定できない。著者自身も別物の可能性を記している（[report.md:64](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QB/report.md:64)）。

判定: 前提不成立

修正案: 試験環境で支店TOPが参照する固定セールタグをIDで特定し、そのIDを事前準備に記録して各商品のタグ指定に使う。特定方法を定められない間は、この4件を成立するケースとして扱わない。
