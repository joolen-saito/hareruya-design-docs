■管理-M04-39 在庫移動指示リスト ピッキングリスト印刷
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）在庫移動指示リスト詳細画面から「ピッキングリスト作成」ボタンを押下し、選択した在庫移動の出庫対象商品をピッキングリスト（ピック表）として印刷用画面/PDF表示する。出庫処理対象のみを表示し、棚番・略称タグ必須、金額閾値別ページ振り分け、ページング、作成日時、行番号、棚番号、言語/状態、略称、色/R、数、商品名、価格、備考、ページ内個数小計、指定順ソート、印刷ボタンによる印刷ダイアログ表示を備える。
　StockMoveInstructionController の在庫移動指示詳細は表示・送り状No/備考更新・削除・送り状CSV/実績CSV系のみで、在庫移動指示詳細から起動するピッキングリスト作成ボタン、印刷/PDFルート、ピックリスト用Service/Formatter/Twigが存在しない。別機能として StockMoveController のピック・出庫承認申請画面にピック表PDF出力は存在するが、ルートは admin_stock_move_outbound_approval_request_pick_list_pdf_export であり、M04-39 が要求する在庫移動指示詳細からの印刷ではない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-34:14181 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php、src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig、src/Eccube/Service、src/Eccube/Repository、src/Eccube/Form、src/Eccube/Resource/locale/messages.ja.yaml、html 配下の関連 assets を除く実装検索））
