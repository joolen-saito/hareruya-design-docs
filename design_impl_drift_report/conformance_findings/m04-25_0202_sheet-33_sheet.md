■管理-M04-25 在庫移動指示詳細
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）0201_基本設計仕様書(システム設定).xlsxの権限制御シート（機能ID: M11-03）の「2.編集可能店舗処理」に応じた権限制御が行われる
　在庫移動指示一覧・詳細・更新・削除処理はログインメンバー取得のみで、移動元/移動先店舗がログインメンバーの編集可能店舗かを絞り込み・拒否する処理がない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-33:23-24 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php, src/Eccube/Repository/DtbStockMoveInstructionRepository.php, src/Eccube/Form/Type/Admin/SearchStockMoveInstructionType.php, src/Eccube/Service/Admin/Stock/StockMoveInstruction*, src/Eccube/Repository/MemberRepository.php; 検索語: canEdit/editable/編集可能店舗/BaseInfo/Member/memberRepository/権限））

■管理-M04-25 在庫移動指示詳細
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送状No.は全角・半角を許容し、最大値は65535byte
　詳細画面フォームは Assert\Length max 255、一覧モーダル input も maxlength="255"、Entity の tracking_no も length 255。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-33:122-128 ／ 実装: src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:34-40; src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:262-263; src/Eccube/Entity/DtbStockMoveInstruction.php:176）

■管理-M04-25 在庫移動指示詳細
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）備考情報の内容の登録は、まとめられている移動のステータスが出庫承認済みまたは移動中の時のみ可能。備考は入庫完了以外で入力可能。
　備考フォームは常に表示され、POSTがvalidならステータス確認なしに detailUpdateAction->handle() が呼ばれ flush される。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-33:32-34,162-168 ／ 実装: src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:79-83; src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:174-188; src/Eccube/Service/Admin/Stock/StockMoveInstructionDetailUpdateAction.php:34-55）

■管理-M04-25 在庫移動指示詳細
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送り状No.および備考の内容が変更された場合にのみ登録ボタンを活性化する
　詳細画面の登録ボタンは常に通常の submit button として描画され、初期表示時の disabled 属性や変更検知JSがない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-33:35-37 ／ 実装: src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:82-83; 不在（探索範囲: stock_move_instruction_detail.twig, stock_move_instruction_index.twig, html/template/default/assets/hareruya/js; 検索語: disabled/changed/change/trackingNo/memo/register））

■管理-M04-25 在庫移動指示詳細
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除は、発送済みでないかつ送り状No.が登録されていない在庫移動指示のみ削除可能。項目説明では出庫待ち状態の場合のみ削除可能。
　画面の削除ボタン/モーダル表示とサーバ側削除可否は trackingNo の有無だけで判定している。紐づく在庫移動のステータス確認はない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-33:42-45,178-184 ／ 実装: src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:84-87,144-159; src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:256-279,294-311）
