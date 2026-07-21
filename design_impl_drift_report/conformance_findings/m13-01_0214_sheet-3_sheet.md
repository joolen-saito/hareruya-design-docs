■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）イベント一覧の入口は GET /%admin_route%/event/list、検索は /event/search/{page_no}、ページ送りは /event/page/{page_no}、新規登録は /event/new、bind名は admin_event_list/admin_event_search/admin_event_page とする。
　一覧は /%eccube_admin_route%/event の admin_event_index、ページ送りは admin_event_index_page、新規登録は /event/create の admin_event_create。フォームも admin_event_index へPOSTする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1008,1009,1094 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:63,64,204; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:39,56; 不在（探索範囲: src/Eccube, html; admin_event_list/admin_event_search/admin_event_page, /event/list, /event/search/{page_no}, /event/new））

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索フォームはフォーム名 admin_event_list、CSRF保護なしで生成・POSTする。
　フォームprefixは admin_search_event。Twigで searchForm._token を描画しており、SearchEventType に csrf_protection=false 指定はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1016,1040 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:140; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:39,40; 不在（探索範囲: src/Eccube/Form/Type/Admin/SearchEventType.php; csrf_protection false））

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索条件・表示件数・ソートキー・並び順・ページ番号は admin.event 系セッションに保存し、/event/list 初期表示では検索条件セッションを削除する。
　セッションキーは eccube.admin.event.search 系。初期表示では検索条件とページ番号を削除せず set する。検索時も sort/order 用の admin.event.sort/admin.event.order は保存しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1016,1018,1058,1076 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:44,46,48,90,105,106,185,188,189）

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ソートはリクエストの sort/order（ASC/DESC）を優先し、不正な並び順は admin.error.sort の並び順エラーを表示して初期表示へ戻す。
　実装は hidden の sortkey/sorttype をPOSTし、値は default/eventName と a/d。Repository は不正sortkeyをid降順へフォールバックし、sorttypeがa以外ならDESCにする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1018,1020,1050,1067 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:24,28,29,130,132,133; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:133,134,135,136,139）

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索ボックスに会場セレクトを表示し、検索条件キー venue（MtbVenue、dtb_event.venue_id / e.venue）で会場検索する。店舗欄 shop はフォーム定義に存在しても一覧画面では表示・利用しない。
　実装は BaseInfo の base_info 複数選択を店舗として表示し、IDENTITY(e.BaseInfo) IN (:baseInfoIds) で検索する。MtbVenue/venue_id/venue 条件は見つからない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1012,1026,1028,1029,1044 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:95,96,99,103; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:84,85; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:122,123,128; 不在（探索範囲: src/Eccube, html; MtbVenue, venue_id, searchData['venue']））

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）イベント名、略称は最大50文字で、入力語ごとにイベント名（日/英）・略称（日/英）4列の部分一致ORを作り、語ごとの条件をANDで結ぶ。
　multi はLength制約なしのTextType。検索対象列は nameJp/nameEn の2列のみで、全語・全列を1つのOR条件にしている。DtbEvent実体にもイベント略称列はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:940,1001,1026,1028,1050 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:40,41,42,43; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:72,73,74,83,89; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbEvent.php:46,49; 不在（探索範囲: src/Eccube/Entity/DtbEvent.php, src/Eccube/Repository/DtbEventRepository.php; shortNameJp/shortNameEn の実稼働検索））

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示メッセージは、1件以上で「検索結果 N件が該当しました」、0件で「検索条件に該当するデータがありませんでした。」を表示する。
　件数表示は「検索結果：%count%件が該当しました」。0件表示は「検索条件に合致するデータが見つかりませんでした」と補助文「検索条件を変えて、再度検索をお試しください」。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1012,1065 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:102,103,209,211,212; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1699,1703,1704）

■管理-M13-01 イベント一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）deleted_at による論理削除レコードはイベント一覧検索の対象外にする。
　DtbEvent には deleted_at/deletedAt があるが、イベント一覧検索の getQueryBuilderBySearchData は e.Details/e.Formats のleftJoinだけで deletedAt 条件を追加していない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-3:1001,1044,1047 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:62,63,64; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbEvent.php:135,136; 不在（探索範囲: src/Eccube/Repository/DtbEventRepository.php:getQueryBuilderBySearchData; e.deletedAt IS NULL / deleted_at IS NULL））
