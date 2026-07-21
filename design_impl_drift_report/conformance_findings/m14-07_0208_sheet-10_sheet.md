■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）言語別ルートは admin_cardset_download_lang、POST /{admin_route}/cardset/download_lang として公開する。画面の「画像ダウンロード(言語別)」はこのルートへ送信する。
　実装は Route 名 admin_cardset_download_each_lang、パス /cardset/download_each_lang を公開し、Twig の formaction も admin_cardset_download_each_lang を参照している。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3070,3140 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:252 / app/template/admin/Cardset/index.twig:79）

■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）セット別で対象セットにカード詳細が 0 件なら admin.cardset.download.failed.set_not_exist_card を表示し、セッション eccube.admin.cardset.page_no のページへ admin_cardset_page にリダイレクトして終了する。
　カード詳細 0 件の場合は continue で次 ID へ進む。最終的に追加画像が 0 件なら admin.card.cardset.error.download_no_images を投げ、Controller は admin_cardset_list へリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3069,3114 ／ 実装: src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:96 / src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:98 / src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:173 / src/Eccube/Controller/Admin/Card/CardsetController.php:245）

■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）セット別でカード詳細はあるが画像取得に一切成功しない詳細がある場合、admin.download.card.not_found を表示しつつ処理は続行し得る。
　S3 取得失敗時は S3AccessService が null を返し、CardsetDownloadAction はそのカード詳細単位のフラッシュを積まない。翻訳キー admin.download.card.not_found も見当たらない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3069,3114 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Card/CardsetController.php, src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php, src/Eccube/Service/S3AccessService.php, src/Eccube/Resource/locale/messages.ja.yaml, app/template/admin/Cardset/index.twig。検索語: admin.download.card.not_found, not_found, downloadCardImageToDirectory, addError, addFlash））

■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）オブジェクトストレージからの保存成否に応じて mtb_card_image.dead_link_flg を更新する。セット別は即時更新し、言語別は最後にまとめて更新する。
　MtbCardImage エンティティには setDeadLinkFlg があるが、ダウンロード処理では呼び出されない。CardsetDownloadAction は ZIP 追加のみを行い、EntityManager の persist/flush も持たない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3069,3071,3086,3095,3098 ／ 実装: 不在（探索範囲: src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php, src/Eccube/Service/S3AccessService.php, src/Eccube/Repository/Master/MtbCardImageRepository.php, src/Eccube/Entity/Master/MtbCardImage.php。検索語: setDeadLinkFlg, dead_link_flg, deadLink, flush, persist））

■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ZIP 応答は Content-Type aplication/octet-stream; と Content-Disposition の RFC 5987 形式 filename* で ZIP ベース名を UTF-8 エンコードして返す。
　BinaryFileResponse を生成し、setContentDisposition(DISPOSITION_ATTACHMENT, 'card_image.zip') を呼ぶのみで、Content-Type の設計値や filename* の明示設定はない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3072,3095 ／ 実装: src/Eccube/Controller/Admin/Card/CardsetController.php:272）

■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）イベント eccube.event.controller.admin_cardset_download.finish をフックし、セット別ルートの処理完了後に download 配下の内容を再度すべて削除する。言語別ルート名に対応する finish イベントは event 定義に無い。
　Controller は deleteFileAfterSend(true) で送信後に ZIP ファイルのみ削除する。作業ディレクトリ内の展開画像は CardsetDownloadAction 開始時に remove されるだけで、finish イベント定義は見当たらない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3074,3095 ／ 実装: 不在（探索範囲: src/Eccube, app, html。検索語: eccube.event.controller.admin_cardset_download.finish, admin_cardset_download.finish, controller.admin_cardset_download, finish, event.yml, deleteFileAfterSend））

■管理-M14-07 画像ダウンロード(セット別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カードセット ID の実在性はループ内で個別に判定する。不正な ID が混ざった場合、実在しないものはダミープロモーション扱いの分岐に入り、カード詳細取得結果が空ならセット別ではエラーになる。
　ids が空の場合のみ [null] としてプロモ向けに解釈する。ids がある場合は filter_var で整数化し、0 以下を除外するため、不正値や 0 は対象リストから落ちる。正の不存在 ID は findWithImagesAndPromotionForDownload に渡されるが、カード詳細 0 件なら continue する。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-10:3103 ／ 実装: src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:84）
