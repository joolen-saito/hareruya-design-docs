■管理-M15-08 アーキタイプ管理(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）deck-search.js が #admin_search_deck_archetypes に select2（allowClear: true）を付与し、#admin_search_deck_formats の変更および #admin_search_deck_color 内チェック変更時に、アーキタイプ選択肢を disabled 化・format_id_{id}/color_id_{id} クラスで絞り込み・有効オプションを先頭移動・select2 再設定・再有効化する。
　管理デッキ一覧では $('.select2-select') に width/placeholder のみで select2 を初期化しており、allowClear 指定、format/color 変更時の #admin_search_deck_archetypes option disabled 制御、format_id_{id}/color_id_{id} クラスによる絞り込み処理が存在しない。SearchDeckType の archetypes も class='select2-select' のみで、選択肢にフィルタ用 class を付与していない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-10:3150 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:57, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:84）

■管理-M15-08 アーキタイプ管理(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）各アーキタイプは「日本語名とフォーマット日本語名を組み合わせた文字列」（エンティティの getNameWithFormatNameJp）として表示される。
　admin_search_deck[archetypes][] の EntityType は choice_label に 'nameJp' を指定しており、フォーマット日本語名を含めない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-10:3165 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:84）

■管理-M15-08 アーキタイプ管理(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）m15-01_admin_deck_deck_search … GET, POST … /{admin_route}/deck/search/{page_no}（page_no は正の整数（ルートの assert ^[1-9][0-9]*$）。検索実行・一覧・ソート・ページ送り・表示件数変更、GET によるセッションからの検索条件復元。フォームの action は page_no=1 固定。）
　admin_deck_search の Route requirements は ['page_no' => '\d+'] で、0 もルートマッチする。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-10:3227 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:75）
