■管理-M14-07 画像ダウンロード(言語別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）言語別ダウンロードのHTTPルートは admin_cardset_download_lang / POST /{admin_route}/cardset/download_lang とする。
　実装の言語別ルートは name='admin_cardset_download_each_lang'、path='/%eccube_admin_route%/cardset/download_each_lang'。一覧ボタンの formaction も admin_cardset_download_each_lang を参照している。admin_cardset_download_lang / cardset/download_lang は探索範囲内で不在。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-11:3058,3140 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:252; /home/y-saito/Developments/ec-cube-enterprise/app/template/admin/Cardset/index.twig:79）

■管理-M14-07 画像ダウンロード(言語別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）ダウンロード試行の結果で mtb_card_image.dead_link_flg を更新する。セット別は失敗/成功ごとに即時更新し、言語別はリストに溜めて全ID処理後にまとめて永続化する。
　MtbCardImage エンティティには dead_link_flg と setDeadLinkFlg() があるが、CardsetDownloadAction は S3 取得成功時に ZIP へ追加し、失敗時は何も更新しない。CardsetDownloadAction 内に setDeadLinkFlg()/isDeadLinkFlg()/flush()/persist($cardImage) の呼び出しが存在しない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-11:3055,3069,3071,3086,3089,3095,3135 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Cardset, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3AccessService.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardImageRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardImage.php））

■管理-M14-07 画像ダウンロード(言語別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）エラー時は admin.cardset.download.failed.set_not_exist_card、admin.download.card.not_found、admin.cardset.download.failed.image_not_exist を状況別に表示し、admin_cardset_page のセッションページへリダイレクトする。
　カード詳細0件は continue でスキップされ、ZIP追加件数が0件なら admin.card.cardset.error.download_no_images を throw する。コントローラは例外メッセージを addError し、admin_cardset_list へリダイレクトする。設計の3キーは探索範囲内で不在。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-11:3069,3073,3110,3112,3115,3127 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:97; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:168; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Cardset/CardsetDownloadAction.php:173; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:242; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:245; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:261; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:264; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4220）

■管理-M14-07 画像ダウンロード(言語別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）イベント eccube.event.controller.admin_cardset_download.finish がフックされており、セット別ルートの処理完了後に download 配下の内容を再度すべて削除する。言語別ルート名に対応する finish イベントは event 定義に無い。
　CardsetController::createZipResponse() は BinaryFileResponse に deleteFileAfterSend(true) を設定して ZIP ファイルのみ送信後削除する。CardsetDownloadAction は次回実行開始時に作業ディレクトリを削除するが、セット別 finish イベントで download 配下を掃除する実装は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-11:3074,3075,3095 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/app, /home/y-saito/Developments/ec-cube-enterprise/html））
