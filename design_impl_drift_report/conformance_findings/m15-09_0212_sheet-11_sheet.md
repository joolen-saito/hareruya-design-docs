■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）新規登録送信・編集表示・更新送信・削除実行は、設計のHTTPルート名とURL/メソッドで到達する。
　実装は新規登録を admin_archetype_new の GET/POST /archetype/new、編集/更新を admin_archetype_edit の GET/POST /archetype/{id}/edit、削除を admin_archetype_delete の POST /archetype/{id}/delete で処理している。POST /archetype は一覧検索の admin_archetype_list 側に割り当てられている。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3368,3456 ／ 実装: src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:64,137,165,179; src/Eccube/Resource/template/admin/Archetype/edit.twig:337）

■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）代表カードモーダルは search/main_card/html, search/main_card/html/{page_no}, search/main_card/id のXHRエンドポイントとセッションキー admin.archetype.main_card.search / .page_no で検索・ページング・ID解決を行う。
　実装は admin_archetype_search_card_image / POST /archetype/search_card_image の単一JSON APIで items/totalCount/page/totalPages を返し、Twig内のインラインJSが結果表・ページング・選択時のhidden/画像/名称更新を行う。検索条件・ページ番号を admin.archetype.main_card.* セッションへ保存する処理は無い。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3368,3426,3441,3456 ／ 実装: src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:253,316; src/Eccube/Resource/template/admin/Archetype/edit.twig:124,158,165）

■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）入力検証に失敗した場合、詳細テンプレートを再表示し、送信値 card_image_id が解決できれば代表カード画像エンティティを表示する。
　POST検証失敗時は form/Archetype/isNew をそのまま返す。cardImageId の解決は form が valid の場合に ArchetypeStoreAction 内でのみ行われ、Twigのプレビューは Archetype.CardImage だけを参照する。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3377 ／ 実装: src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:215,221,243; src/Eccube/Resource/template/admin/Archetype/edit.twig:229）

■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）登録成功時は成功フラッシュに登録完了メッセージキー admin.register.complete を積み、編集URLへリダイレクトする。更新も新規送信と同様の保存・フラッシュ・リダイレクトを行う。
　保存成功時は新規・更新とも admin.common.save_complete をフラッシュに積み、admin_archetype_edit へリダイレクトする。admin.register.complete は翻訳定義に存在するが、この保存処理では使われていない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3377,3424 ／ 実装: src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:231,232,234; src/Eccube/Resource/locale/messages.ja.yaml:1559,1934）

■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除確認文言は一覧では admin.confirm.delete（名称埋め込み）、詳細では admin.confirm.archetype_delete を用い、アンカーの data-message で確認ダイアログ文言を渡す。
　一覧は form onsubmit の confirm('{{ admin.archetype.delete_confirm }}')、詳細は #btn_delete click の confirm('{{ admin.archetype.delete_confirm }}') を使う。data-message アンカーではなく、一覧・詳細とも同じ翻訳キーを使っている。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3371,3400 ／ 実装: src/Eccube/Resource/template/admin/Archetype/index.twig:193; src/Eccube/Resource/template/admin/Archetype/edit.twig:63）

■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除時は関連デッキありなら admin.archetype.delete.failed を積んで admin_archetype_search の1ページ目へ、成功時は admin.delete.complete を積み、セッション admin.archetype.search.page_no があれば当該検索ページへ戻る。CSRF不正はHTTP403相当。
　CSRF不正時は admin.common.csrf_invalid を積んで admin_archetype_list へリダイレクトする。関連デッキありは admin.archetype.delete_error_deck_exists を投げ、編集画面へ戻る。成功時は admin.common.delete_complete を積み、常に admin_archetype_list へ戻る。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3383,3424,3429,3441 ／ 実装: src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:182,185,190,193,201,203; src/Eccube/Service/Admin/Archetype/ArchetypeDeleteAction.php:44）

■管理-M15-09 アーキタイプ編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除はソフトデリータブル設定により dtb_archetype.deleted_at が立つ論理削除として扱い、物理削除SQLではない。
　削除実装は entityManager->remove($Archetype) を呼ぶ。DtbArchetype には deleted_at 列はあるが、確認したクラス定義には Gedmo SoftDeleteable 属性が無く、remove を deleted_at 更新に変換する設定が見当たらない。確認お願いします。（設計根拠: excel_to_html/output/0212_基本設計仕様書(デッキ管理).html#sheet-11:3383,3459 ／ 実装: src/Eccube/Service/EntityManager/ArchetypeEntityManager.php:82; src/Eccube/Service/EntityManager/ArchetypeEntityManager.php:88; src/Eccube/Entity/DtbArchetype.php:29; src/Eccube/Entity/DtbArchetype.php:87）
