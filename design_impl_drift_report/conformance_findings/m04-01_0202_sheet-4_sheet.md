■管理-M04-01 在庫検索一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗検索条件の選択肢は、店舗管理に登録されており閉店となっていない店舗のみ取得する。
　base_info は BaseInfo::class の EntityType として定義されているが、閉店店舗を除外する query_builder が無く、TODO コメントで未対応とされている。BaseInfo には is_open_shop カラムが存在し、BaseInfoRepository::getOpenShops() では開店中条件が実装されている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-4:1205 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:123）

■管理-M04-01 在庫検索一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索パターン名を入力することで検索条件保存ボタンが活性化する。
　検索条件保存ボタンは初期表示から disabled 属性なしで描画され、JS も pattern_name 入力に応じた活性/非活性制御を持たない。未入力時は Controller 側で admin.common.save_pattern.error.name_empty を出してリダイレクトする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-4:1133 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:369）

■管理-M04-01 在庫検索一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索条件保存では、ボタン押下時に設定されている検索条件を保存する。ただし店舗は検索条件の保存に含めない。
　savePattern() は FormUtil::getViewData($searchForm) の結果を $dataToStore に入れ、_token だけ unset して serialize($dataToStore) している。base_info は除外されない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-4:1135 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:332）

■管理-M04-01 在庫検索一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）在庫移動・振替登録では、複数在庫区分の在庫が選択された場合、アラートを表示し遷移させない。
　一覧行チェックボックスには data-zone が出力されるが、在庫移動・振替ボタンのクリック処理は編集権限、複数店舗、在庫0のみを判定しており、選択行の data-zone が複数かどうかを判定する関数やアラートが無い。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-4:1392 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml））
