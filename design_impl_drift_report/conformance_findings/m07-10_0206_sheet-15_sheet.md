■管理-M07-10 【新規】買取商品履歴(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVダウンロード操作の画面項目名は「CSVダウンロード」とする。
　買取商品履歴(検索結果)のCSVメニュー見出しは history.twig で admin.common.download を表示しており、日本語表示は「ダウンロード」。同じ画面の選択肢「選択した商品履歴取得」「検索結果全件取得」とPOST先 admin_purchase_history_export は実装済み。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-15:3628 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:208, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:210, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1466）
