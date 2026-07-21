■管理-M15-08 アーキタイプ管理(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーマット・色変更時、deck-search.js の archetypeFilter が #admin_search_deck_archetypes に allowClear: true 付き select2 を付与し、format_id_{id}/color_id_{id} クラスで option を disabled/有効化・並び替え・再初期化する。
　デッキ一覧テンプレートは select2.min.js を読み込み、.select2-select に width と placeholder のみで select2 を初期化している。SearchDeckType の archetypes は class=select2-select のみで、format_id_* / color_id_* option class 生成もない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-9:3150,3156 ／ 実装: src/Eccube/Resource/template/admin/Deck/index.twig:52,57,62,64 / src/Eccube/Form/Type/Admin/SearchDeckType.php:84）

■管理-M15-08 アーキタイプ管理(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーマット・色を変えてアーキタイプを選び検索する入口は POST /{admin_route}/deck/search/1 で、フォーム action は page_no=1 固定。コード探索上の検索ルート page_no は正の整数 assert ^[1-9][0-9]*$。
　検索フォーム action は url('admin_deck_list') で POST /{admin_route}/deck に送信する。検索ルートは name='admin_deck_search'、requirements は '\d+' で 0 も許容する。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-9:3147,3227 ／ 実装: src/Eccube/Resource/template/admin/Deck/index.twig:230 / src/Eccube/Controller/Admin/Deck/DeckController.php:74,75）

■管理-M15-08 アーキタイプ管理(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーム admin_search_deck がリクエストを取り込む。CSRF はこのフォーム型では無効である。
　SearchDeckType の configureOptions は csrf_protection => true を設定している。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-9:3154 ／ 実装: src/Eccube/Form/Type/Admin/SearchDeckType.php:206）

■管理-M15-08 アーキタイプ管理(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索ビューデータはセッションキー admin.deck.search に保存され、ページ・ソートは admin.deck.search.page_no、admin.deck.sort、admin.deck.order、admin.deck.search.page_count が更新される。
　SearchControllerTrait は eccube.admin.deck.search、eccube.admin.deck.search.page_no、eccube.admin.deck.sort、eccube.admin.deck.order、eccube.admin.deck.search.page_count を使用する。DeckController の POST 前処理では deck、deck.page_no も別途保存する。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-9:3154,3168,3212 ／ 実装: src/Eccube/Controller/Admin/SearchControllerTrait.php:109 / src/Eccube/Controller/Admin/Deck/DeckController.php:97）

■管理-M15-08 アーキタイプ管理(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）アーキタイプ選択肢ラベルは、日本語名とフォーマット日本語名を組み合わせた文字列（エンティティの getNameWithFormatNameJp）として表示される。
　SearchDeckType の archetypes は choice_label => 'nameJp' で、日本語名のみを選択肢ラベルにしている。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-9:3165 ／ 実装: src/Eccube/Form/Type/Admin/SearchDeckType.php:84）
