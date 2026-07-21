■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸計画編集画面を表示し、棚卸名・店舗・商品数・計上済み商品数・差異あり商品数・備考・操作ボタン・棚卸対象商品一覧・ページングを提供する。
　DtbInventoryPlan/DtbInventoryPlanDetail の Entity と空の Repository、およびメニュー翻訳 admin.product.inventory のみ存在する。棚卸計画編集用のController、Route、Twig、FormType、一覧取得Repositoryメソッドは存在しない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15165-15231 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Stock, src/Eccube/Resource/template/admin/Stock, src/Eccube/Form/Type/Admin, src/Eccube/Service, html/template/admin。git ls-files でも InventoryPlan 系は Entity/Repository のみ））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸計画編集では店舗表示を追加し、棚卸計画で指定された店舗の在庫のみ処理対象にし、権限のない店舗の編集を不可能にする。
　DtbInventoryPlan には店舗/在庫区分を保持するフィールドや関連がなく、権限チェックや店舗スコープ条件を行うController/Service/Repository実装も存在しない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15166-15169,15204 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Form/Type/Admin, src/Eccube/Repository, src/Eccube/Resource/template/admin, src/Eccube/Entity/DtbInventoryPlan.php, src/Eccube/Entity/DtbInventoryPlanDetail.php））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）CSV出力ボタンで棚卸計画に登録されている棚卸商品全てを、棚卸詳細CSV出力シートの形式で、ファイル名【棚卸名】.csvとして出力する。差異あり商品のみ表示がチェックされている場合は差異が0でない商品のみ出力し、並び順は明細ID昇順とする。
　棚卸詳細CSV出力用のController action、CSVサービス、Exporter、テンプレートボタン、ルートが存在しない。汎用/他機能のCSV出力はあるが InventoryPlan/DtbInventoryPlanDetail を対象にしたCSV出力はない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15170-15173,15216; #sheet-41:15333-15356 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Service/Csv, src/Eccube/Service/Csv/Exporter, src/Eccube/Repository, src/Eccube/Resource/template/admin, html/template/admin））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）商品登録ボタンで棚卸商品CSV登録モーダルを表示し、商品コードCSVにより棚卸詳細（商品）データを登録する。在庫反映済みは登録不可、2万件上限、CSV内重複または既存データはエラーとする。
　棚卸商品CSV登録用のモーダルTwig、アップロードフォーム、CSV importer、登録Controller action、重複/既存データ検証、2万件制限、反映済みチェックが存在しない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15176-15182,15214,15228-15229; #sheet-40:15294-15305 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Form/Type/Admin, src/Eccube/Service/Csv/Importer, src/Eccube/Service/Csv, src/Eccube/Repository, src/Eccube/Resource/template/admin, html/template/admin））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）数量登録ボタンで棚卸商品数量CSV登録モーダルを表示し、商品コード・棚卸数量CSVにより棚卸数量を一括登録する。在庫反映済みは登録不可、2万件上限、CSV内同一商品はエラーとする。
　棚卸数量CSV登録用のモーダルTwig、アップロードフォーム、CSV importer、棚卸数量更新Controller action、重複検証、2万件制限、反映済みチェックが存在しない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15183-15188,15215,15230-15231; #sheet-40:15306-15312 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Form/Type/Admin, src/Eccube/Service/Csv/Importer, src/Eccube/Service/Csv, src/Eccube/Repository, src/Eccube/Resource/template/admin, html/template/admin））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）登録/更新ボタンで棚卸名と備考を保存し、在庫反映済みの場合はエラーメッセージを表示して保存不可にする。一覧に戻るボタンは棚卸計画一覧へ遷移する。
　DtbInventoryPlan は name/memo/stockReflectionedDate を持つが、編集フォーム、POST保存処理、反映済み保存不可エラー、一覧へ戻る遷移が存在しない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15174-15175,15203,15208-15211 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Form/Type/Admin, src/Eccube/Resource/template/admin, src/Eccube/Repository））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸対象商品一覧で「差異ありのみ表示」チェック時は在庫差異があるデータのみ表示し、商品名リンクは棚卸在庫確認画面へ遷移し、差異確認完了フラグが確認済みなら「済」を表示する。
　DtbInventoryPlanDetail は theoreticalStock/actualStock/stockDifferenceConfirmed を持つが、一覧表示、差異フィルタ、商品名リンク、差異確認「済」表示、ページングUIは存在しない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15189-15190,15212-15213,15218,15223-15227 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Resource/template/admin, src/Eccube/Repository, src/Eccube/Form/Type/Admin））

■管理-M04-35 棚卸計画編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）「棚卸結果の在庫反映」ボタンで棚卸結果在庫反映画面へ遷移する。ただし商品数0、計上済み商品数0、商品数と計上済み商品数不一致、在庫差異があり差異確認未実施の商品がある場合は押下不可能にする。
　棚卸在庫反映画面へのRoute/Controller/Twig、棚卸結果の在庫反映ボタン、押下可否判定が存在しない。Entity には商品数系フィールドと差異確認フラグはあるが、それらを画面制御に使う実装がない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-39:15191-15195,15210 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin, src/Eccube/Resource/template/admin, src/Eccube/Repository, src/Eccube/Form/Type/Admin））
