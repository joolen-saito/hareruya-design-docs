■管理-M06-05 買取商品履歴(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）申込者名検索は、空白が含まれている場合（姓と名の間に空白等）空白で区切ったいずれかの入力が一致していれば検索結果に出力する。
　申込者名を空白・カンマで分割した後、各キーワードごとに andWhere(...) を追加しているため、分割後キーワード間は AND 条件になる。各キーワード内では姓・名・姓カナ・名カナへの OR 部分一致。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-12:3395-3397 ／ 実装: src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:105）

■管理-M06-05 買取商品履歴(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）買取日時(From)>買取日時(To)の場合エラーにする。
　complete_date_from / complete_date_to は DateTimeType の単一テキスト入力として定義されるが、From と To の大小関係を検証する Callback/Constraint/Controller 判定/JS 判定がない。Repository は From 条件と To 条件を独立に追加するだけで、From > To の場合もエラーにせず検索条件として実行する。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-12:3429 ／ 実装: 不在（探索範囲: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php, src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php, src/Eccube/Controller/Admin/SearchControllerTrait.php, src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php, html/template/admin/assets/js/OtcBuyOrder/otc-buy-order-history.js, src/Eccube/Resource/locale））
