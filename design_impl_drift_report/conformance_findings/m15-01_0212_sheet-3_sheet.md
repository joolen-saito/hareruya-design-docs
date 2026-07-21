■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索フォームの送信先は常に page_no=1 の POST /{admin_route}/deck/search/1 とし、検索ルート名は m15-01_admin_deck_deck_search、page_no は 1 以上の整数に制限する。
　検索フォームは admin_deck_list へ POST し、検索ルート名は admin_deck_search、page_no 制約は \d+。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1060,1147 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:230; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:74）

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索フォームは CSRF をかけない。
　SearchDeckType は csrf_protection を true に設定している。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1060,1111 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:206）

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）初期表示時の page_count は default_page_count を使用する。
　初期GET時に eccube.admin.deck.search.page_count を 100 でセッション保存している。設定上の eccube_default_page_count は 10。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1067,1069 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:114; /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:142）

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）フォーマットまたは色の変更時、アーキタイプ選択肢をフォーマットID・色クラスでフィルタし、対象外 option を無効化する。
　select2 初期化はあるが、formats/color の change による archetypes option フィルタ処理は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1063 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:51-218, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:62-90））

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）カード名欄は ul.cardNameList、deck_card.js、data-list URL によりカード候補を参照する。
　カード名欄は通常の form_widget(searchForm.card) のみ。cardNameList、deck_card.js、data-list 属性は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1063 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:346-357, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube））

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSV出力は対象デッキ未選択時に JavaScript alert を表示し、送信しない。
　画面側に未選択 alert はなく、サーバ側で admin.deck.csv_export_no_selection を flash に積んで検索画面へリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1063,1175 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:204; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:693）

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索結果のボタン群には CSV出力、旧サイトCSV、一括削除、一括編集を表示する。
　表示される操作は CSV出力、一括削除、一括編集のみで、旧サイトCSVのボタン・ルート・翻訳キーを確認できない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1063 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:397-406, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale））

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「CSV,TSV取り込み」はデッキ登録CSV, TSVアップロード画面へ遷移する。
　導線は CSV登録のみで、アップロード accept は text/csv,.csv、Controller は拡張子 csv 以外をエラーにする。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:962 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:226; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:94; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckCsvController.php:90）

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一括削除は POST /{admin_route}/deck/delete、ルート名 m15-03_admin_deck_deck_bulk_delete を使い、検索結果 form のデフォルト action は一括編集、削除ボタンの formaction で一括削除へ送信する。
　一括削除ルートは /deck/bulk_delete・admin_deck_bulk_delete。検索結果 form のデフォルト action が一括削除で、削除ボタンに formaction はない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1171,1172 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:139; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:397）

■管理-M15-01 デッキ一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一括削除は CSRF不正時HTTP403、記事使用中は Referer へ戻し、成功時メッセージは admin.delete.complete とする。
　CSRF不正時は admin.common.csrf_invalid をflashして admin_deck_list へリダイレクト。記事使用中は admin_deck_search へ戻す。成功メッセージは admin.common.delete_complete。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-3:1180,1205,1215 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:142; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:166; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:177）
