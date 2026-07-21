■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）イベント一覧は GET /%admin_route%/event/list、POST/GET /%admin_route%/event/search/{page_no}、GET /%admin_route%/event/page/{page_no} を使い、フォーム名は admin_event_list、CSRFなしで検索する。
　実装は /%eccube_admin_route%/event を admin_event_index、/%eccube_admin_route%/event/page/{page_no} を admin_event_index_page として GET/POST 両方で処理し、検索フォームは admin_event_index に POST する。フォーム block prefix は admin_search_event で、Twig は _token を描画している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1008,1040,1076,1094 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:63; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:64; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:39; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:40; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:140; 不在（探索範囲: Controller/Admin/Event, Resource/template/admin/Event, Form/Type/Admin; 検索語: admin_event_list, admin_event_search, admin_event_page, /event/list, /event/search））

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）初期表示では検索条件セッション admin.event.search、admin.event.search.page_no、admin.event.search.page_count を削除し、検索/ページングでは admin.event.search、admin.event.search.page_no、admin.event.sort、admin.event.order、admin.event.search.page_count を保持する。
　実装のセッションキーは eccube.admin.event.search、eccube.admin.event.search.page_no、eccube.admin.event.search.page_count。初期表示相当の分岐でも session->set により検索条件とページ番号を保存し、sort/orderの独立セッションキーは存在しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1015,1019,1034,1076 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:44; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:46; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:48; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:105; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:106; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:188; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:189; 不在（探索範囲: EventController.php; 検索語: session->remove, admin.event.sort, admin.event.order））

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索条件はイベント名、開催日時From/To、会場、フォーマット、関連種別であり、会場は venue/MtbVenue/dtb_event.venue_id を使う。店舗項目はフォームにあるが画面表示せず検索にも使わない。
　実装は base_info を検索フォームに表示し、BaseInfo を複数選択検索条件として e.BaseInfo に適用する。ログインメンバーのデフォルト店舗も検索条件に入れる。MtbVenue/venue/venue_id の検索条件は見つからない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:984,1012,1026,1028 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:70; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:95; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:84; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:122; 不在（探索範囲: SearchEventType.php, DtbEventRepository.php, Resource/template/admin/Event/index.twig, Entity/DtbEvent.php; 検索語: MtbVenue, venue, venue_id））

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）イベント名検索は全角スペースを半角に正規化し、半角/全角スペース/カンマで分割した各単語をAND条件、各単語内では name_jp、name_en、short_name_jp、short_name_en のOR条件で検索する。
　実装は nameJp/nameEn のみを検索対象にし、分割語と検索対象カラムの全条件を1つの OR 条件にまとめている。DtbEvent にイベント短縮名カラムは見つからない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1026 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:67; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:72; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:79; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:87; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbEvent.php:46; 不在（探索範囲: Entity/DtbEvent.php, Repository/DtbEventRepository.php; 検索語: short_name, shortName））

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開催日時From/Toは yyyy-MM-dd の日付入力で、From/To逆転時も範囲整合性バリデーションは行わず、AND条件により検索結果0件として扱う。
　実装は start_date_from/start_date_to に Range 制約を付与し、POST_SUBMIT で From が To より大きい場合に admin.common.date_range_error を追加する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1031,1050 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:44; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:62; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:115; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:122）

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ソートは request の sort/order を優先し、order は ASC/DESC を使う。不正な order は admin.error.sort を出して初期表示へ戻す。
　実装は hidden の sortkey/sorttype と画面プルダウン値 default/eventName、a/d を使う。Repository は不明な sortkey を e.id にフォールバックし、sorttype が a 以外なら DESC にする。admin.error.sort を出す処理は見つからない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1017,1026,1031,1067 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:24; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:126; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:107; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:111; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:133; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:137; 不在（探索範囲: EventController.php, SearchEventType.php, DtbEventRepository.php; 検索語: admin.error.sort, order, ASC, DESC））

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧の表示項目は開催店舗ラベルを表示し、検索結果文言は「検索結果 N件が該当しました」、0件時は「検索条件に該当するデータがありませんでした。」を表示する。
　実装の開催店舗列は admin.event.base_info を使い、翻訳は「店舗」。検索結果文言は「検索結果：%count%件が該当しました」。0件時は「検索条件に合致するデータが見つかりませんでした」と追加案内文を表示する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1012,1065,1169 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:103; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:146; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:156; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:209; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:213; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1694; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1698; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1699; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5940）

■管理-M13-01 イベント一覧(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）イベント一覧画面の専用CSSとして eventlist.css を使用する。
　イベント一覧テンプレートおよび公開html配下に eventlist.css の読込・配置は確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-4:1012 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: eventlist.css, eventlist））
