■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）admin_deck_list は GET /{admin_route}/deck の初期表示、m15-01_admin_deck_deck_search は GET/POST /{admin_route}/deck/search/{page_no}（page_no は ^[1-9][0-9]*$）として検索実行・ページ送り・表示件数変更を扱う。
　admin_deck_list が GET/POST /deck を受け、検索フォームも admin_deck_list へPOSTする。検索ルート名は admin_deck_search、page_no 制約は \d+。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1746 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:74）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索一覧を開く GET admin_deck_list では admin.deck.search、admin.deck.search.page_no、admin.deck.search.page_count を削除し、admin.deck.sort と admin.deck.order は削除しない。
　初期GET分岐で検索セッションを削除せず、deck、deck.page_no を set し、eccube.admin.deck.search.page_count に 100 を set している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1733 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:110）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索フォームは CSRF 保護を無効にしている。サーバ側はフォーム制約により、桁・形式エラー時は検索処理に進まずフォームエラーとなる。
　SearchDeckType::configureOptions で csrf_protection が true。DeckController は createForm(SearchDeckType::class) をオプション上書きなしで生成する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1684 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:206）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索入力として勝ち数・負け数・引き分け数の下限／上限（win_count_from/to、loss_count_from/to、draw_count_from/to）を持ち、Symfony integer として扱う。
　SearchDeckType と Deck/index.twig に勝敗引き分け検索項目がなく、DtbDeckRepository も当該検索条件を構築しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1682 ／ 実装: 不在（探索範囲: src/Eccube/Form/Type/Admin/SearchDeckType.php, src/Eccube/Resource/template/admin/Deck/index.twig, src/Eccube/Repository/DtbDeckRepository.php。検索語: win_count_from, loss_count_from, draw_count_from, winCount, lossCount, drawCount, 勝ち数, 負け数, 引き分け数））

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）プライベートはフォームキー private、イベント ID はフォームキー event_id で、イベント詳細側のイベント ID に対して IN 検索する。
　プライベートは private_flg、イベントは event_detail_id として実装され、検索も ed.id に対して行われる。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1682 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:100）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）カード名欄は入力補助用 data-list URL を持ち、ul.cardNameList と deck_card.js（パブリック資産経由）でカード名候補を参照する。
　カード欄は通常の TextType と form_widget のみで、data-list 属性、ul.cardNameList、deck_card.js 読み込みがない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1679 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:164）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）フォーマットまたは色変更時、アーキタイプ選択肢をフォーマット ID・色クラスでフィルタし、無効オプションを切り替える。
　select2 初期化はあるが、format/color の change を契機に archetypes の option を絞る処理がない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1679 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/admin/Deck/index.twig, src/Eccube/Form/Type/Admin/SearchDeckType.php, html/template/admin/assets/js, html/template/default/assets/js。検索語: archetype change, formats change, color change, disabled option, deck-search.js））

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSV 出力ボタンは未選択時に alert で中断する。
　CSVボタン押下時の未選択alertはなく、フォーム送信後に DeckController::csvExport が flash error を積んでリダイレクトする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1679 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:204）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除完了後は、セッション admin.deck.search.page_no があればそのページへ、なければ admin_deck_list へリダイレクトする。ページ番号は削除結果に応じてトレイト側で減算されうる。
　一括削除はセッション page_no の admin_deck_search へ戻るが、行メニューの個別削除は常に admin_deck_list へ戻る。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1718 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:371）

■管理-M15-01 デッキ一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ソートキーが不正、または並び順パラメータ不正の場合、admin.error.sort を表示し、admin_deck_list と同じ処理で検索条件・ページ関連セッションのみ削除した初期画面を返す。
　order は正規表現チェック後に index($request, ...) を同じリクエストで呼ぶだけで、検索条件・ページ関連セッション削除はない。sortKey は DtbDeckRepository 側で不正時に default へ黙ってフォールバックする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-4:1721 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:142）
