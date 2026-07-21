■管理-M06-05 買取商品履歴(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索結果は買取日時の降順、査定申込日時の降順に並ぶ。CSVの出力順も検索結果と同仕様。
　一覧検索のQueryBuilderは obo.completeDate DESC, obosh.createDate DESC で並べ、CSV出力用QueryBuilderも obo.completeDate DESC, obosh.createDate DESC で並べている。査定申込日時に相当する DtbOtcBuyOrder.applyDate はエンティティに存在するが、この履歴一覧/CSVのソートには使われていない。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-13:3650-3651 ／ 実装: src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:283, src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:343, src/Eccube/Entity/DtbOtcBuyOrder.php:107）
