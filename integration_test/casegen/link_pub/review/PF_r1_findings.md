### 指摘1（重大度: Major）対象: IT-F03-07-PF003
主張: 公開側で通知を取り消すと、管理画面の「削除」が1になる。
実際: 上流設計書は既存の依頼を「削除」とするだけで、取消履歴を論理削除として保持するとは定めていない（[F03-07:13](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/f03-07_front_product_product_arrival_notification.md:13)）。下流は論理削除済みの通知設定を検索対象とし、「削除」には全規格および商品IDについての条件を置く（[M12-05:14](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.md:14)、[0211・検索結果:2261](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能).html:2261)）。手順の取消がこの集計対象を残し、条件を満たすとは設計書から言えない。
判定: 推測による接続
修正案: 「削除が1」のケースを削除する。取消後に集計対象として残ることと集計条件が設計書で明確になってから作り直す。

### 指摘2（重大度: Major）対象: IT-F03-07-PF004
主張: シードの商品で「まとめて入荷通知」を操作できる。
実際: シードはグッズ商品CSV登録で商品を作る（[PF_seed_data.tsv:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/PF_seed_data.tsv:6)）。同画面の取込対象カテゴリはグッズ系である（[M03-27:38](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:38)）。一方、「まとめて入荷通知」はカード商品のみ表示される（[0303・商品詳細:1811](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1811)）。現行シードでは手順3のボタンに到達できない。
判定: 前提不成立
修正案: カード商品の登録画面で、必要なカード情報と規格を備えたケース専用商品を作るシードに直す。

### 指摘3（重大度: Major）対象: IT-F03-07-PF004
主張: 「まとめて入荷通知」を押した後、管理画面で商品単位の依頼を確認できる。
実際: 手順3はボタンを押すだけである（[PF_test_cases.tsv:5](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/PF_test_cases.tsv:5)）。設計書では、この押下でまず「まとめて入荷通知依頼確認」のポップアップを表示すると定める（[0303・商品詳細:1811](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1811)）。依頼を確定する操作が手順に無いため、期待結果まで通らない。
判定: 手順不備
修正案: 確認ポップアップで依頼を確定する操作を加え、登録処理の完了後に管理画面を検索する手順に直す。
