■管理-M03-17 売上分析タグ登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）並び順は必須で、最大値は0〜32767。
　rank は IntegerType で required=true だが、HTML属性 min=1/max=65535、Range(min=1,max=65535) として実装されている。Entity も unsigned SMALLINT の rank として宣言されている（src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:56）。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-16:4091 ／ 実装: src/Eccube/Form/Type/Admin/TagSalesAnalysisType.php:49）
