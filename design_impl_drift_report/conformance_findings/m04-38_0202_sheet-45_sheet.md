■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示件数は初期値100件で、EC-CUBE標準の最大ページ表示に設定されている表示件数の選択肢を表示する。
　初期表示件数はセッション未設定時に eccube_default_page_count を使用し、設定値は10。選択肢自体は mtb_page_max から表示している。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16158 ／ 実装: src/Eccube/Controller/Admin/Stock/StockApprovalListController.php:105; app/config/eccube/packages/eccube.yaml:124）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）承認状態は「未承認,承認済,スマレジ連携中,スマレジ連携失敗,却下済」を表示し、未承認・スマレジ連携失敗はチェックボックス/承認操作対象にする。
　承認ステータス定数・表示ラベル・検索条件は 1:未承認、2:承認済、3:却下のみ。行の一括操作可否も未承認だけを対象にし、スマレジ連携失敗は TODO コメントだけがある。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16161; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16162; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16263 ／ 実装: src/Eccube/Entity/DtbStockApprovalList.php:28; src/Eccube/Form/Type/Admin/SearchStockApprovalListType.php:40; src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:90）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧は未承認/スマレジ連携中/スマレジ連携失敗を最上位に登録日古い順で表示し、承認済/却下済は承認日新しい順、同日なら在庫編集承認ID昇順で表示する。
　approvedDate DESC、registeredDate ASC、承認一覧ID a.id ASC で一律ソートしている。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16108 ／ 実装: src/Eccube/Repository/DtbStockApprovalListRepository.php:157）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）承認対象が「在庫編集」「在庫一括編集」「在庫変更CSV登録」の場合、承認対象リンク押下で紐づく在庫変動履歴を確認できる確認モーダルを表示する。
　確認モーダルを開くリンクは item.is_bulk_actionable の場合だけ。is_bulk_actionable でない在庫編集系行は approval_target_link 初期値の '#' へ通常リンク表示され、モーダルを開かない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16163 ／ 実装: src/Eccube/Resource/template/admin/Stock/approval_list.twig:499; src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:62）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）合計在庫増減数・合計総原価増減数・在庫変動区分は、承認対象が「在庫編集」「在庫一括編集」「在庫変更CSV登録」の場合だけ表示し、それ以外は「-」を表示する。
　在庫編集/一括編集/CSV登録に加えて、在庫分割(STOCK_SPLIT_EDIT)・在庫結合(STOCK_JOIN_EDIT)でも合計在庫増減数、合計総原価増減数、在庫変動区分を表示している。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16166 ／ 実装: src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:102）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）ステータス変更時は登録者のメールアドレスへ承認ステータス変更時用メールテンプレートで通知し、却下の場合は却下理由をメール本文に含める。
　却下理由は画面から hidden 送信されるが、Controller では取得処理が TODO コメントで無効化され、StockApprovalListUpdateInput は Member/ids/status だけを持つ。UpdateAction に MailService 呼び出しはなく、MailService には申請時の sendStockApprovalAlertMail だけがある。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16145; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16146; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16260 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Stock/StockApprovalListController.php, src/Eccube/Service/Admin/Stock/StockApprovalListUpdateAction.php, src/Eccube/Service/Admin/Stock/ActionInput/StockApprovalListUpdateInput.php, src/Eccube/Service/MailService.php, src/Eccube/Resource/template/default/Mail））

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）承認対象に在庫変更CSV登録の情報が含まれる場合、モーダルの識別ID5-1〜5-14には表示せず、CSVダウンロードでのみ参照できる。
　モーダル明細取得SQLが STOCK_CHANGE_CSV_IMPORT を含め、テンプレートは取得した明細を通常の5-1〜5-14相当テーブル行として表示する。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16223; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16242 ／ 実装: src/Eccube/Repository/DtbStockApprovalListRepository.php:345; src/Eccube/Resource/template/admin/Stock/approval_list_line_items.twig:29）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）確認モーダルの変更前/変更後在庫・仕入単価・総原価は、在庫変動区分の親区分と承認状態に応じて、一覧参照時の在庫数、承認ステータス変更時の値、在庫変動履歴の値、または「-」を出し分ける。
　モーダル明細SQLは dtb_stock_edit_approval_detail を中心に取得し、StockEditLineItemRowBuilder は before_edit_quantity + edit_quantity、purchase_unit_price、before_purchase_unit_price から常に在庫・単価・総原価を算出する。承認状態や廃棄時の「-」表示、在庫変動履歴値への切替はない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16249; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16250; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16252; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16254; excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16255 ／ 実装: src/Eccube/Repository/DtbStockApprovalListRepository.php:307; src/Eccube/Service/Admin/Stock/StockEditLineItemRowBuilder.php:49）

■管理-M04-38 在庫編集承認一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）確認モーダル明細の表示順は、第一ソートを承認情報単位で一覧の1-2に従い、第二ソートを在庫変動履歴ID降順または入庫承認待ち在庫ID降順とする。
　モーダル明細は sal.id ASC、sad.id ASC で並べ、外側でも sort_sal_id ASC、sort_sad_id ASC で並べる。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-45:16219 ／ 実装: src/Eccube/Repository/DtbStockApprovalListRepository.php:284; src/Eccube/Repository/DtbStockApprovalListRepository.php:353）
