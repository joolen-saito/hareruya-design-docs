■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は、登録先選択 GET /%eccube_admin_route%/entry/select、新規申込入力 GET /%eccube_admin_route%/entry/{eventDetailId}/new、登録送信 POST /%eccube_admin_route%/entry/{eventDetailId}/create、プレイヤー検索 POST /%eccube_admin_route%/entry/search/player/html とする。
　実装は /entry_registration、/entry_registration/new/{eventDetailId}、/entry_registration/search_player を使用する。登録送信は create 専用パスではなく入力表示と同一パスの POST、プレイヤー検索は POST ではなく GET。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4929 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:64,148,203; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:214）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）権限を保持している店舗のイベントのみ登録可能とし、識別ID:3-1「イベント申込を登録」は権限を保持している店舗のイベントの申込のみ表示する。
　新規画面到達時は isEditableShop で 404 にするが、登録先一覧は全店舗選択肢を出し、検索条件が空なら権限店舗に絞らず、登録ボタンも各行へ無条件表示する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4774 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:72; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EntryRegisterSearchType.php:41; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:189; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:109; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:152）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）登録成功時は成功を表示し、登録した申込の編集画面（M13-10相当）へリダイレクトする。
　EntryRegistrationStoreAction の戻り値である登録済み DtbEventEntry を使わず、admin_event_entry_event_detail（イベント詳細ID指定の申込一覧）へ遷移する。編集画面 route admin_event_entry_edit は存在するが成功時に使っていない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4941 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:171; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:95; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:259）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）チーム人数分の参加者行を用意し、隠しフィールドのプレイヤー情報リスト（JSON、要素はプレイヤーID・確認フラグ・席順）で管理し、各要素を申込プレイヤーとして登録する。
　フォームは entryPlayer という単一プレイヤーIDの HiddenType のみ。画面行も player_id--1 の1行固定。登録処理も1件の DtbEntryPlayer だけを confirmFlg=false、seatOrder=1 で保存する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4934 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventEntryDetailType.php:60; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:34; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:269; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryRegistrationStoreAction.php:43; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/EntryPlayerEntityManager.php:30）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）参加プレイヤー情報は必須で、重複検証で同一プレイヤーの重複申込を弾き、参加者重複時は申込重複メッセージを表示し新規画面へリダイレクトする。
　検索モーダルでは isEntriedByPlayerIdExceptEntry の結果で登録済ボタンを disabled 表示するが、登録フォーム側の制約は NotBlank と Regex のみで、StoreAction は同一日程の重複申込を検査せず保存する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4965 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:262; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/search_player_modal_list.twig:26; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventEntryDetailType.php:63; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryRegistrationStoreAction.php:43）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）新規申込フォームはイベント名・店舗・会場・フォーマットを読み取り専用で表示し、識別ID1-3「会場」ラベルを持つ。
　edit.twig はイベント名、店舗、フォーマットを表示するが、会場のラベル・値を表示する行がない。DtbEvent/DtbEventDetail にも管理画面申込用の会場フィールドは見当たらない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4801 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbEvent.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php, messages.ja.yaml の 会場/venue/place 検索。近接表示: edit.twig:240,247,250））

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID3-1のボタンはラベル「登録」で表示し、入力されたフォームの値で登録する。
　新規申込画面の submit ボタンは admin.common.save を使用し、日本語表示は「保存」。admin.common.registration（登録）は存在するが未使用。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4815 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:357; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1595）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「戻る」は、前の画面名を表示する。戻るボタンは登録先選択画面へ遷移する。
　href は admin_entry_registration へ戻るが、表示文言は admin.event.entry.back = 「戻る」の固定文言。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4752 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/edit.twig:341; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5864）

■管理-M13-12 イベント新規申込登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画面上部フラッシュは、成功時「登録が完了しました。」、未送信失敗時「登録できませんでした。」、支払金額不正時「半角数字で金額を入力してください。」を表示する。
　成功時は admin.common.save_complete = 「保存しました」、例外時は admin.common.save_error = 「保存に失敗しました」を使う。設計文言に一致する admin.register.complete/failed は存在するが、この処理では使っていない。支払金額は disabled の IntegerType で、専用の「半角数字で金額を入力してください。」メッセージ分岐はない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-18:4970 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:168; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:180; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventEntryDetailType.php:109; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1559; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1934）
