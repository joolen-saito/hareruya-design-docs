■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸在庫確認画面で、棚卸商品の在庫数量を登録する。画面には商品名、商品コード、言語、店舗、状態、作成時在庫数、作成時間、在庫差異、在庫数量、棚卸数量、メモ、商品画像、直近1週間の在庫変動履歴、在庫確認登録履歴を表示・入力する。
　DtbInventoryPlan/DtbInventoryPlanDetail/DtbInventoryPlanDetailEditHistory の Entity/Repository は存在するが、棚卸在庫確認画面の Controller、Twig、FormType、ルート、画面表示処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15363,15377,15461 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, src/Eccube/Service, src/Eccube/Repository, src/Eccube/Resource/locale/messages.ja.yaml, html。検索語: 棚卸在庫確認, inventory_plan_detail, InventoryPlanDetailType, admin_inventory_plan, 在庫確認登録履歴, 直近1週間の在庫変動履歴））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）画面表示時は「棚卸数量」入力欄にフォーカスが当たり、カーソル位置が数値の末尾に設定される。
　棚卸数量入力欄の画面実装、初期フォーカス制御、カーソル末尾設定処理はいずれも確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15431 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/admin, html, src/Eccube/Controller, src/Eccube/Form。検索語: 棚卸数量, focus, selectionStart, setSelectionRange, actualStock, inventory_plan_detail））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「在庫数量へ最新数量を反映」ボタンを押すと、その時点の理論在庫数が「在庫数量」入力欄に反映される。棚卸数量は登録されない。
　在庫数量へ最新在庫を反映するボタン、押下用ルート、理論在庫数取得・フォーム反映処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15432,15472 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, src/Eccube/Service, html。検索語: 在庫数量へ最新数量を反映, 在庫数量へ最新在庫を反映, theoreticalStock, latest stock, actualStock））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「登録/更新」（初回登録後は「登録」から「更新」に文言が変わる）を行ったら、入力フォームの内容を保存し、「在庫確認登録履歴」を追加する。初期文言は「登録」、棚卸数量入力後は「更新」。
　DtbInventoryPlanDetailEditHistory Entity と関連は存在するが、登録/更新ボタン、文言切替、入力保存、履歴追加処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15434,15476,15485 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, src/Eccube/Service, src/Eccube/Repository。検索語: 在庫確認登録履歴, DtbInventoryPlanDetailEditHistory, addEditHistory, 登録/更新, actualStock））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）在庫反映済みの場合はエラーメッセージを表示し、保存不可。
　stockReflectionedDate フィールドは存在するが、在庫反映済み判定によるエラーメッセージ表示・保存ブロック処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15433,15435 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, src/Eccube/Service。検索語: stockReflectionedDate, stock_reflectioned_date, 在庫反映済み, 保存不可, addError, flash））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「登録」後は、棚卸計画に登録されている次の商品の在庫確認画面へ遷移する。次の商品がない場合は棚卸計画編集画面へ遷移する。
　登録後に次の商品を探索して在庫確認画面または棚卸計画編集画面へ遷移する処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15436 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Repository, src/Eccube/Resource/template/admin。検索語: next, nextDetail, 次の商品, redirectToRoute, admin_inventory_plan, InventoryPlanDetail））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「更新」後は、棚卸計画編集画面へ遷移する。当該商品を選択した時のページ位置を保持すること。
　更新後に棚卸計画編集画面へ戻し、元ページ位置を保持する Controller/Twig/Form hidden パラメータは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15437 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form。検索語: page, pageno, page_no, scroll, return_page, redirectToRoute, 更新））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「差異確認＆完了」ボタンは在庫差異があるときのみ表示される。押下すると差異確認完了フラグが入り、次の差異未確認商品へ遷移する。「差異確認＆完了」を確認後、棚卸数量および在庫数量を変更できないようにする。
　DtbInventoryPlanDetail::stockDifferenceConfirmed フィールドは存在するが、差異確認＆完了ボタン、差異時のみの表示、押下処理、次の差異未確認商品への遷移、確認後の入力不可制御は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15438,15439,15477 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, src/Eccube/Service, src/Eccube/Repository。検索語: 差異確認, stockDifferenceConfirmed, setStockDifferenceConfirmed, stock_difference_confirmed, disabled, readonly））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸計画作成後に在庫履歴の変動が行われた場合、画面上部にアラートを表示し、直近1週間の在庫変動履歴の一覧において作成日より新しい在庫変動をハイライトする。
　在庫履歴一覧自体の汎用機能は存在するが、棚卸在庫確認画面上で直近1週間の在庫変動履歴を表示し、棚卸詳細作成日以降の変動をアラート・ハイライトする実装は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15440,15441,15442,15478,15491 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Service/Admin/Stock, src/Eccube/Repository。検索語: 直近1週間, 在庫履歴変動, ハイライト, DtbStockHistory, stock history, createDate, alert））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）表示項目として識別ID:4「店舗」を追加し、棚卸計画で指定された店舗の在庫のみ処理対象にする。権限のない店舗の登録は不可能にする。
　棚卸在庫確認画面で店舗を表示し、棚卸計画指定店舗に処理対象を限定し、権限外店舗登録を拒否する実装は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15444,15446,15447,15464 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Form, src/Eccube/Service, src/Eccube/Resource/template/admin, src/Eccube/Repository。検索語: 店舗, inventory_plan, stockLocation, shop, permission, 権限のない店舗））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「詳細へ戻る」リンクは棚卸計画編集画面へ遷移し、詳細画面へ戻る際は元いたページ数を保持したまま戻る。在庫数量を複数商品更新しても、元いたページに戻る。
　詳細へ戻るリンク、棚卸計画編集画面へのリンク生成、元ページ番号保持処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15448,15449,15450,15474 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form。検索語: 詳細へ戻る, return, back, page, pageno, inventory_plan_edit））

■管理-M04-35 棚卸在庫確認
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「1つ前の商品に戻る」リンクは、登録または更新して遷移してきた場合、前の登録または更新した商品に戻る。商品更新時、更新した商品のコードを保持し、保持されたコードがある場合にリンクを出す。
　前回更新商品の商品コード保持、保持コードがある場合のみ表示するリンク、前の商品への遷移処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-42:15451,15452,15453,15475 ／ 実装: 不在（探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, html。検索語: 一つ前の商品に戻る, 1つ前の商品, previous, prev, product_code, 商品コードを保持, session））
