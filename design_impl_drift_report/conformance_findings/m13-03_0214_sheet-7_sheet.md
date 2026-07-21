■管理-M13-03 日程登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「日程追加」は GET /{admin_route}/event/{eventId}/schedule/new で日程入力画面（admin_schedule_new）へ遷移し、「登録」ボタンは POST /{admin_route}/event/{eventId}/schedule/create で登録する。
　実装は admin_schedule_new / /schedule/new を持たず、GET/POST とも admin_schedule_create / /schedule/create に集約している。イベント編集画面の日程追加リンクも admin_schedule_create を参照している。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-7:2162,2197 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/ScheduleController.php:45, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/edit.twig:492）

■管理-M13-03 日程登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）メンバーが権限を保持している店舗のイベントのみ日程追加が可能にする。
　実装はテンプレート上の保存ボタンを isEditableBaseInfo で disabled にするが、create/edit の保存処理前に編集権限NGを拒否するサーバ側ガードがない。create は form valid なら ScheduleStoreAction を実行し、その後に isEditableBaseInfo を画面へ渡している。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-7:2047-2048 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/ScheduleController.php:55, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/ScheduleController.php:70, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:258）

■管理-M13-03 日程登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デッキ登録締め切りは、デッキ登録ありの値に応じて表示/非表示を切り替え、デッキ登録ありの場合必須。
　実装は deckRegistDeadline を required=false の任意 DateTimeType として定義し、JSでは表示/disabled切替のみ行う。deckRegistFlg がオンでも deckRegistDeadline を必須にするサーバ側バリデーションや required 付与がない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-7:2070-2071 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:131, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:35）

■管理-M13-03 日程登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受付ありの初期値はオン、定員の初期値は10、参加費の初期値は0、公開状態の初期値は公開。
　受付あり（offlineEntryFlg）は mapped=false で hasStoreEntried() の結果を初期値にしており、新規日程では entryStartDate/entryEndDate が空のためオフになる。定員・参加費・公開状態は DtbEventDetail コンストラクタで親イベントの capacity/entryFee/disp をコピーしており、固定値 10/0/公開ではない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-7:2067,2076-2078 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:181, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php:129）

■管理-M13-03 日程登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ボタンは新規日程登録時のみ「登録」を表示し、既存の日程更新時のみ「更新」を表示する。
　実装は新規・既存の分岐自体はあるが、どちらの submit ボタンも admin.common.save を表示するため、日本語表示は「保存」になる。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-7:2081-2082 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:247, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Schedule/edit.twig:258, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1441）
