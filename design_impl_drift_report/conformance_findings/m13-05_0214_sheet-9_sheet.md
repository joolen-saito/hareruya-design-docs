■管理-M13-05 複製新規
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）複製新規ボタンは GET /%admin_route%/event/{duplicateId}/duplicate（bind名 admin_event_duplicate）で複製元イベントの値を載せた新規登録フォームを表示し、duplicateId は1以上の整数のみ受け付ける。
　実装は admin_event_copy /%eccube_admin_route%/event/{id}/copy を定義し、画面の複製新規ボタンも admin_event_copy に遷移する。requirements は id='\d+'。admin_event_duplicate と /event/{duplicateId}/duplicate は不在。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-9:2763,2764,2834 ／ 実装: src/Eccube/Controller/Admin/Event/EventController.php:245; src/Eccube/Resource/template/admin/Event/edit.twig:497）

■管理-M13-05 複製新規
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗（識別ID1-3）は編集権限のある店舗のみ表示し、編集権限のない店舗が選択された場合はエラーとする。
　baseInfo は BaseInfo 全件を id 昇順で選択肢化している。POST_SUBMIT では Member::isEditableShop によるエラー付与が実装されている。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-9:2614,2615,2636 ／ 実装: src/Eccube/Form/Type/Admin/EventType.php:88; src/Eccube/Form/Type/Admin/EventType.php:90; src/Eccube/Form/Type/Admin/EventType.php:295）

■管理-M13-05 複製新規
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）識別ID1-4「会場」は単一選択・必須で、選択肢は全会場。複製時は会場（venue_id）を複製元の値として初期表示する。
　イベント登録・編集フォーム、DtbEvent エンティティ、保存処理、テンプレートに会場項目が存在しない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-9:2637,2779,2797 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Event/EventController.php, src/Eccube/Form/Type/Admin/EventType.php, src/Eccube/Resource/template/admin/Event/edit.twig, src/Eccube/Entity/DtbEvent.php, src/Eccube/Service/EntityManager/EventEntityManager.php, src/Eccube/Resource/locale/messages.ja.yaml; 検索語: venue, Venue, 会場, venue_id, admin.event.venue））

■管理-M13-05 複製新規
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）識別ID2-3「備考(日)」と識別ID2-4「備考(英)」は最大4096字の入力項目として表示し、複製時は複製元の値を初期表示する。
　イベントフォームには賞品とフリー入力エリア1-3はあるが、備考(日)・備考(英)としての入力欄、エンティティ項目、保存処理は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-9:2651,2652,2779,2781 ／ 実装: 不在（探索範囲: src/Eccube/Form/Type/Admin/EventType.php, src/Eccube/Resource/template/admin/Event/edit.twig, src/Eccube/Entity/DtbEvent.php, src/Eccube/Service/EntityManager/EventEntityManager.php, src/Eccube/Resource/locale/messages.ja.yaml; 検索語: 備考, remarks, note, detailJp, detailEn, admin.event.remarks））

■管理-M13-05 複製新規
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）複製元イベントを初期データとしてイベント登録フォーム（フォーム名 admin_event_detail）を生成する。
　Controller は EventType を生成し、EventType::getBlockPrefix() は admin_event を返す。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-9:2771 ／ 実装: src/Eccube/Controller/Admin/Event/EventController.php:214; src/Eccube/Controller/Admin/Event/EventController.php:253; src/Eccube/Form/Type/Admin/EventType.php:319; src/Eccube/Form/Type/Admin/EventType.php:321）

■管理-M13-05 複製新規
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID1-11「定員」は数値(整数)・必須・最大8字で入力する。
　capacity は IntegerType で Length max に eccube_int_len を使用し、eccube_int_len は 9 に設定されている。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-9:2644 ／ 実装: src/Eccube/Form/Type/Admin/EventType.php:149; src/Eccube/Form/Type/Admin/EventType.php:152; app/config/eccube/packages/eccube.yaml:111）
