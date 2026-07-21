■管理-M15-07 デッキタグ一覧
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）admin_decktag_list_disabled / admin_decktag_sort / admin_decktag_update / admin_decktag_delete の /{admin_route}/deckTag 系ルートで、既定表示、ページ・表示件数・sortKey 変更、モーダル POST、CSRF 付き DELETE を扱う。
　側メニューの「デッキタグ一覧」は専用 /deckTag ルートではなく、汎用 MTG マスターデータ画面 admin_data_mtg_master_data に entity=deck_tag を渡している。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-8:2751 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: DeckTagController, admin_decktag_list_disabled, admin_decktag_sort, admin_decktag_update, admin_decktag_delete, deckTag.twig, deck-tag.js））

■管理-M15-07 デッキタグ一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示件数ドロップダウン（10〜100）、並び順ドロップダウン（日本語名・英語名・表示順）、ページネーション、一覧表の編集ボタン・削除リンク、末尾行の新規ボタン、Bootstrap モーダル #editModal と deck-tag.js による編集/新規作成を提供する。
　汎用 MTG マスターデータ画面は entity 選択セレクト、全行インライン入力テーブル、新規用の最終行、画面下部の登録ボタンだけを表示する。ページング、表示件数、sortKey UI、編集/新規モーダル、行ごとの編集ボタン・削除リンクはない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-8:2748 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:48）

■管理-M15-07 デッキタグ一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）日本語名・英語名は NotBlank と最大長 32、表示順は 1〜999999 かつ自分以外の同一順位をカスタム制約でエラーにし、入力不備または表示順重複時は同一一覧テンプレートを返してモーダル再表示で翻訳メッセージを見せる。
　汎用保存は int について数値性だけを確認して (int) キャストし、文字列はそのまま setter に渡す。新規行の必須文字列が空なら登録をスキップするだけで、NotBlank/Length/1〜999999/重複チェックのフォームエラーとして同一画面に返さない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-8:2768 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MtgMasterDataEntityManager.php:62）

■管理-M15-07 デッキタグ一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）DELETE 時、関連するデッキまたはアーキタイプ初期値側の関連が 0 でない場合は削除せず、デッキ用またはアーキタイプ用のエラーフラッシュを出して admin_decktag_list へリダイレクトする。
　汎用保存では既存行の全カラムが空の場合、固定行でなければ entityManager->remove($Entity) を実行する。MtbDeckTag の Decks / archetypes 関連数を確認してメッセージを出し分ける処理はない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-8:2755 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:75）
