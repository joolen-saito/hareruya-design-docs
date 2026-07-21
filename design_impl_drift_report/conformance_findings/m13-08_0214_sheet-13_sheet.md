■管理-M13-08 デッキ表示
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デッキ表示ボタン（申込一覧）は GET /%admin_route%/entry/deckList を開き、bind名 admin_entry_decklist（GETデッキ表示）で登録する。
　実装は Route path '/%eccube_admin_route%/event/entry/decklist'、route name 'admin_event_entry_decklist' を定義し、申込一覧ボタンも path('admin_event_entry_decklist') を開いている。設計の '/entry/deckList' および 'admin_entry_decklist' は実装されていない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3764,3841 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:503, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:381）

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）権限を保持している店舗のイベントのデッキのみ表示を可能とする。
　deckList() は defaultBaseInfo を初期値にした検索フォームへセッション値を投入し、DtbDeckRepository は searchData['base_info'] があればそのIDで絞るだけで、ログイン管理者の保持店舗との照合を行わない。SearchEntryType の base_info 選択肢も BaseInfo 全件を orderBy している。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3804 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:507, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEntryType.php:68, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:752）

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デッキのプレイヤー名を前後空白除去して用いる。空の場合は会員のカナ姓・カナ名を半角空白で連結して表示する。
　resolvePlayerDisplayName() は会員カナを最優先で返し、次にプレイヤー姓名、最後に deck->getPlayerName() を返す。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3772,3778 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:338）

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）イベント名（英）を表示する。
　EntryDeckListDisplayBuilder は page.eventName に $eventDetail->getEvent()->getNameJp() を設定し、decklist.twig は Event 欄に page.eventName を表示している。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3768,3794 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:144, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:324）

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）メインカード一覧を1ページ40枚で分割し、デッキ単位でページを構成する。サイドボードは先頭ページにのみ表示する。
　buildPage() はデッキごとに1ページだけ返し、pageNo/totalPages 初期値は1である。その後 build() が全ページ件数を totalPages に設定している。array_chunk、40枚単位分割、サイドボード先頭ページ制御は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3772,3775,3778,3781 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry。関連実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php:71,127,140 および /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:333））

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）デッキごとのカードに、サイドボード見出しと枚数、サイドのカード一覧を表示する。メイン・サイドそれぞれの枚数を合計し、各見出しに表示する。
　EntryDeckListDisplayBuilder は resolveMainCards()/buildMainboard() のみを持ち、テンプレートも decklist-mainboard のみを描画する。text_side/getTextSide/BOARD_ID_SIDE を使ったサイドカード復号・枚数集計・見出し表示がない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3768,3778 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryDeckListDisplayBuilder.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig））

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デッキが0件の場合、デッキリストに何も表示しない（印刷ボタンのみ）。
　pages is empty の場合、印刷ボタンに加えて <p class="decklist-empty">{{ 'admin.common.search_no_result'|trans }}</p> を表示する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3781 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:299）

■管理-M13-08 デッキ表示
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デッキ表示時は申込一覧の検索条件セッション（admin.event_entry.search）を読み取り専用で参照する。
　実装の検索条件セッションキーは private const SESSION_KEY = 'eccube.enterprise.admin.entry.search' で、deckList() はこのキーからセッション値を読む。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-13:3761,3772,3824,3841 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:57,509）
