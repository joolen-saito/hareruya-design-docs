■管理-M03-11 カテゴリ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）新規のみバナー・アイコンの隠し file とドロップゾーン・プレビューを持ち、編集では登録済み画像があれば同一ラベル領域に読み取り専用で表示し、未登録なら文言のみ。入力項目としても最新セット用バナー画像・カテゴリアイコン画像は新規のみ file ありで、編集画面ではファイル入力なし／差し替え不可。
　編集GETも createCategoryForm を呼び、createCategoryForm は allow_banner_image_upload / allow_icon_image_upload を常に true にする。Twig は isCategoryEdit 時も FilePond の banner_image_file / icon_image_file と add/delete hidden を描画し、update 経路でも completeCategorySave が画像の削除・差し替えを処理する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-25:6235,6257,6260 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:101,172,195,207,228,240,630; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:129,136,214,372,390）

■管理-M03-11 カテゴリ登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）永続化失敗（新規）で画像だけ先に移動済みの場合、コントローラが移動済み絶対パス一覧を unlink してから例外を伝播する。
　completeCategorySave は wrapInTransaction 内で一時画像を本ディレクトリへ move してから categoryRepository->save を呼ぶが、保存失敗を捕捉して新規移動済み画像を削除する try/catch や移動済み新規画像リストがない。objectKeysToDelete は既存画像の削除要求または差し替え時の旧画像を成功後に削除する用途に限られる。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-25:6243,6260,6269 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:175-285,294-542; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/FileManager.php））

■管理-M03-11 カテゴリ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）支店非表示フラグが立っている場合は支店側のカテゴリ表示に表示させず検索対象からも除外し、フロント非表示フラグが立っている場合は支店側も含めて検索やフロントTOPのカテゴリ表示で非表示にする。
　TopCategoryListBuilder やカテゴリツリーAPIでは front_search_hide_flg / branch_hide_flg を見て表示除外する。一方、商品検索フォームは CategoryRepository->getList(null, true) の全カテゴリを choices にし、カテゴリID付きURLも request query へそのまま category_id を設定する。ProductRepository の商品検索は選択カテゴリと子孫で絞るだけで、front_search_hide_flg / branch_hide_flg 条件を付けない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-25:6129,6131,6132,6157,6158 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:99,102; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductType.php:68; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductBlockType.php:48; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:95; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:142; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:764）
