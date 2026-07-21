■管理-M14-08 カードセット詳細（登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）新規／編集の送信は POST admin_cardset_update（/{admin_route}/cardset/edit）に card_set フォームを送り、hidden の id で更新判別し、成功時は admin.register.complete を積んで GET /{admin_route}/cardset/{id}/edit へリダイレクトする。編集入口の送信ボタンは「更新」。
　実装は admin_cardset_update / /cardset/edit を持たず、新規は /cardset/new、編集は /cardset/{id}/edit に直接 POST する。フォーム prefix は admin_cardset、hidden id はなく、成功フラッシュは admin.common.save_complete、ボタン文言は常に「登録」。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-12:3379,3390,3397,3398 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:116; src/Eccube/Controller/Admin/Card/CardsetController.php:148; src/Eccube/Controller/Admin/Card/CardsetController.php:129; src/Eccube/Controller/Admin/Card/CardsetController.php:163; app/template/admin/Cardset/edit.twig:26; app/template/admin/Cardset/edit.twig:164; src/Eccube/Form/Type/Admin/CardsetType.php:176; 不在（探索範囲: src/Eccube/Controller/Admin/Card, src/Eccube/Form/Type/Admin, app/template/admin/Cardset; admin_cardset_update, /cardset/edit, card_set, hidden id））

■管理-M14-08 カードセット詳細（登録・編集・削除)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）Symfony フォーム isValid が偽の場合、admin.register.failed をエラーフラッシュに積み、同テンプレートを再描画する。
　new/edit とも isSubmitted && isValid の成功分岐だけを処理し、検証失敗時は addError せずフォームを返す。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-12:3390,3407 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:125; src/Eccube/Controller/Admin/Card/CardsetController.php:159; 不在（探索範囲: src/Eccube/Controller/Admin/Card/CardsetController.php, src/Eccube/Resource/locale/messages.ja.yaml; admin.register.failed, addError））

■管理-M14-08 カードセット詳細（登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除は DELETE /{admin_route}/cardset/{id}/delete で実行し、削除リンクは固定文言「このカードセットを削除してもよろしいですか？」のポップアップを表示し、その後「実行」で削除する。
　削除ルートは /{admin_route}/product/cardset/{id}/delete。確認は共通モーダルで admin.common.delete_modal__message を使い、実行ボタン文言は「削除」。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-12:3314,3379,3427 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:186; src/Eccube/Controller/Admin/Card/CardsetController.php:187; app/template/admin/Cardset/edit.twig:154; app/template/admin/Cardset/edit.twig:155; app/template/admin/Cardset/delete_modal.twig:21; app/template/admin/Cardset/delete_modal.twig:23; src/Eccube/Resource/locale/messages.ja.yaml:1754）

■管理-M14-08 カードセット詳細（登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除時は cardDetails コレクション件数を事前判定し、1 件以上なら admin.cardset.delete.failed（第1引数に日本語セット名）をエラーフラッシュに積んで Referer へ戻す。成功時は admin.delete.complete を積み、セッションの eccube.admin.cardset.page_no（既定1）の一覧ページへ戻す。
　実装は cardDetails 件数を事前判定せず、シンボル画像を削除してから repository->delete() を試み、外部キー制約例外で admin.card.cardset.error.delete_has_cards 相当の文言を積む。成功・失敗とも最後は admin_cardset_list へ戻る。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-12:3392,3395,3404,3407,3422 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:198; src/Eccube/Controller/Admin/Card/CardsetController.php:208; src/Eccube/Controller/Admin/Card/CardsetController.php:211; src/Eccube/Controller/Admin/Card/CardsetController.php:213; src/Eccube/Controller/Admin/Card/CardsetController.php:216; src/Eccube/Controller/Admin/Card/CardsetController.php:224; src/Eccube/Resource/locale/messages.ja.yaml:1561; src/Eccube/Resource/locale/messages.ja.yaml:4473; 不在（探索範囲: src/Eccube/Controller/Admin/Card/CardsetController.php; getCardDetails/count, admin.cardset.delete.failed, Referer））

■管理-M14-08 カードセット詳細（登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）編集時のみ収録カードリストを表示し、各リンクは admin_card_edit を新規タブで開く。
　収録カードリスト自体は表示されるが、リンクは <a href="..."> のみで target="_blank" 等がない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-12:3313,3382 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:168; src/Eccube/Controller/Admin/Card/CardsetController.php:169; app/template/admin/Cardset/edit.twig:132; app/template/admin/Cardset/edit.twig:135）

■管理-M14-08 カードセット詳細（登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フッタ「検索画面に戻る」は GET /{admin_route}/cardset/{page_no}?resume=1 へ遷移し、一覧がセッション保持の件数・並びで再表示される。
　戻るリンクは pageNo > 1 の場合 /cardset/page/{pageNo}、それ以外は /cardset へ遷移し、resume=1 は付与しない。一覧側は eccube.admin.cardset.search.page_count、sort/order、page_no をセッション利用する。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-12:3261,3379,3404,3416 ／ 実装: app/template/admin/Cardset/edit.twig:151; src/Eccube/Controller/Admin/Card/CardsetController.php:49; src/Eccube/Controller/Admin/Card/CardsetController.php:50; src/Eccube/Controller/Admin/Card/CardsetController.php:77; src/Eccube/Controller/Admin/Card/CardsetController.php:99）
