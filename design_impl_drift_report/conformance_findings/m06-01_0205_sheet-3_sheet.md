■管理-M06-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）査定申込日時(From)>査定申込日時(To)の場合エラー
　査定申込日時 From/To の入力欄と form_errors 表示枠はあるが、From > To を検出してフォームエラーにする処理がない。Repository は applyDate >= From と applyDate <= To をそのまま AND 条件で付与するだけで、エラー化しない。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-3:948 ／ 実装: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:155; src/Eccube/Repository/DtbOtcBuyOrderRepository.php:124; src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:101）

■管理-M06-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取日時(From)>買取日時(To)の場合エラー
　買取日時 From/To に相当する complete_date_from/complete_date_to の入力欄と form_errors 表示枠はあるが、From > To を検出してフォームエラーにする処理がない。Repository はキャンセル時 cancelDate、それ以外 completeDate に対して From/To 条件をそのまま付与する。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-3:950 ／ 実装: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:96; src/Eccube/Repository/DtbOtcBuyOrderRepository.php:142; src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:112）

■管理-M06-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取日時(From)に3か月前の日付の0時を初期表示する
　complete_date_from は DateTimeType として定義されているが、application_date_from のような data 初期値指定がなく、3か月前0時を初期表示しない。確認お願いします。（設計根拠: excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-3:950 ／ 実装: src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:96）
