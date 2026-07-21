■管理-M03-18 部門登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）登録ボタンは画面下部に表示し、編集モードの際はボタン名が「編集」に変わる。
　画面下部の送信ボタンは編集モード判定をせず、常に admin.common.registration を表示する。日本語は messages.ja.yaml:1443 の「登録」。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-32:7449 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:154）

■管理-M03-18 部門登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）部門コードは書式・制限が「数字」、必須、最大値128である。
　部門コードは TextType で、NotBlank と Length(max=128) のみ。数字制約の Regex、NumberType、is_numeric/ctype_digit 相当の検証は ProductDepartmentType/SectionController/MtbSection 周辺に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-32:7451 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductDepartmentType.php:51）

■管理-M03-18 部門登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ部門連携の新規登録では、別添資料の部門連携項目として「軽減税率ID（画面では税設定）」に null を連携する。
　スマレジ部門新規登録 payload は categoryCode、categoryName、displayFlag、taxDivision、pointNotApplicable のみで、軽減税率IDを null 連携する項目が無い。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-32:7428 / excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-64:13812 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php:77）
