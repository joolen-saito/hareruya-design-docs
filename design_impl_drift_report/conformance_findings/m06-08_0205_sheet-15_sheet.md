■管理-M06-08 買取集計データ(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）集計日(From)・集計日(To)は日付(yyyy/mm/dd)形式の必須入力とする。
　summary_date_from / summary_date_to は DateType single_text の必須項目として実装されているが、日付ピッカーの表示形式は YYYY-MM-DD である。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-15:4033,4034 ／ 実装: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:58, src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:63, html/template/admin/assets/js/OtcBuyOrder/otc-buy-order-summary.js:4）

■管理-M06-08 買取集計データ(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）部門は単一選択(セレクトボックス)とし、リスト内容は部門マスタから全部門を取得する。
　section は EntityType / MtbSection として実装されているが、multiple => true の複数選択である。Twig は searchForm.section をそのまま描画し、JS は select2 を付与するだけで単一選択へ変更していない。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-15:4035 ／ 実装: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:75）

■管理-M06-08 買取集計データ(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取店舗は単一選択(セレクトボックス)とし、リスト内容は店舗マスタから取得し、初期表示時はログインしているメンバーのデフォルト検索表示店舗を選択状態にする。
　shop は EntityType / BaseInfo として実装され、ログインメンバーの defaultSearchBaseInfo があれば初期値に入るが、multiple => true の複数選択である。Twig は searchForm.shop をそのまま描画し、JS は select2 を付与するだけで単一選択へ変更していない。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-15:4036 ／ 実装: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:68）
