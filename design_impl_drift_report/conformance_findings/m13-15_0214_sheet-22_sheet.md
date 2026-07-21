■管理-M13-15 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画像設定の利用者視点入口は GET/POST /%eccube_admin_route%/banner/event、GET/POST /%eccube_admin_route%/banner/event/{html_class}、DELETE /%eccube_admin_route%/banner/event/delete、DELETE /%eccube_admin_route%/banner/event/delete/{html_class} とし、アップロードとバナー設定は同一URLへPOSTしてファイル送信の有無で振り分ける。
　実装は /%eccube_admin_route%/event/banner 系で、設定POSTは /event/banner/settings、画像アップロードPOSTは /event/banner/image/upload に分離されている。削除は /event/banner/delete だけで、店舗絞り込みはパスセグメントではなく htmlClass クエリで渡している。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5659; excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5660 ／ 実装: src/Eccube/Controller/Admin/Event/BannerController.php:57; src/Eccube/Controller/Admin/Event/BannerController.php:71; src/Eccube/Controller/Admin/Event/BannerController.php:91; src/Eccube/Controller/Admin/Event/BannerController.php:121; src/Eccube/Resource/template/admin/Event/banner.twig:148; src/Eccube/Resource/template/admin/Event/banner.twig:151; src/Eccube/Resource/template/admin/Event/banner.twig:327）

■管理-M13-15 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画像ストレージは店舗未指定なら banner/、店舗指定なら banner/{店舗HTMLクラス名}/ 配下を参照・保管し、一覧・削除もこの保管先を参照する。
　実装のS3プレフィックスは常に banner/event/ で、店舗指定時は banner/event/{htmlClass}/ にアップロード・一覧取得する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5670; excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5675; excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5684 ／ 実装: src/Eccube/Service/Admin/Event/EventBannerStorageService.php:26; src/Eccube/Service/Admin/Event/EventBannerStorageService.php:41; src/Eccube/Service/Admin/Event/EventBannerStorageService.php:92; src/Eccube/Service/Admin/Event/EventBannerStorageService.php:172）

■管理-M13-15 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）アップロードフォームの店舗は保管ディレクトリ決定に使用し、フォームキー shops を持つ。店舗未指定なら banner/、店舗指定なら banner/{店舗HTMLクラス名}/ へ保管する。
　実装のフォーム項目は file と baseInfos。baseInfos は required=true かつ NotBlank で、未指定時は admin.event.banner.upload_shops_required を返すため、店舗未指定アップロードはできない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5670; excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5678 ／ 実装: src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:38; src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:42; src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:48; src/Eccube/Form/Type/Admin/Event/EventBannerUploadType.php:52; src/Eccube/Controller/Admin/Event/BannerController.php:100; src/Eccube/Service/Admin/Event/EventBannerStorageService.php:67）

■管理-M13-15 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）アップロード失敗時は「ファイルが選択されていません。」「ファイルサイズは（上限）バイト以下にしてください。」「ファイルがGIF・JPG・PNGではありません。」をアップロード欄付近に表示し、削除リンク押下時は「一度削除したデータは元に戻せません。削除してもよろしいですか？」を確認表示する。
　イベントバナー用の表示文言は「ファイルを選択してください。」「ファイルサイズが大きすぎます（最大 %max% バイト）。」「画像ファイル（JPEG/PNG/GIF）を指定してください。」「この画像を削除します。よろしいですか？」である。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5704; excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-22:5706 ／ 実装: src/Eccube/Service/Admin/Event/EventBannerStorageService.php:64; src/Eccube/Service/Admin/Event/EventBannerStorageService.php:79; src/Eccube/Service/Admin/Event/EventBannerStorageService.php:87; src/Eccube/Resource/locale/messages.ja.yaml:5924; src/Eccube/Resource/locale/messages.ja.yaml:5925; src/Eccube/Resource/locale/messages.ja.yaml:5926; src/Eccube/Resource/locale/messages.ja.yaml:5933; src/Eccube/Resource/template/admin/Event/banner.twig:327）
