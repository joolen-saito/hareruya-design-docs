■管理-M03-21 棚番登録 編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧の「並び順」は、押下すると該当行の情報を名称(3)と並び順(4)に反映する。
　一覧の並び順セルは `{{ shelfNumber.sortNo }}` のテキスト表示のみ。ID、名称、編集は編集ルートへのリンクだが、並び順にはリンクやクリック処理がない。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-36:8203 ／ 実装: src/Eccube/Resource/template/admin/Product/shelf_number.twig:134）

■管理-M03-21 棚番登録 編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目「並び順」は必須で、最大値は 0〜32767 とする。
　`sortNo` は `IntegerType` かつ `NotBlank()` のみで、0〜32767 の `Range` 制約や最大値属性はない。DBカラムも unsigned integer で、32767 上限は定義されていない。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-36:8198 ／ 実装: src/Eccube/Form/Type/Admin/ShelfNumberType.php:46; src/Eccube/Entity/DtbShelfNumber.php:37）

■管理-M03-21 棚番登録 編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSV取込の名称は、画面の正規表現相当の検証をCSVハンドラでは行わず、DBのユニーク制約・長さ制約に依存する。CSVでは画面の形式に合わない名称も保存され得る。
　CSV名称列に `RegexValidator('/^[A-Z][-][0-9]{3}$/')` が設定され、形式不一致時はCSV取込バリデーションエラーになる。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-36:8275 ／ 実装: src/Eccube/Service/Csv/Importer/Event/ShelfNumberMasterImportHandler.php:45; src/Eccube/Service/Csv/Importer/Validator/RegexValidator.php:40）
