主張: `matrix_UAN-12/exceptions.tsv:4` の例外E3は、部門未設定の通知を差し込む条件を A1（集計対象の状態）だけにしている。
実際: `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:992-1029` は部門未設定商品の取得条件に買取状態を含めず、買取成立日で抽出する。`BatchAggregateSummaryAction.php:47-49` は取得結果があれば通知するため、成立後に管理者取消となった A2 でも通知される。
判定: 事実の欠落
修正案: A2でも部門未設定通知を確認し、集計画面にはその買取を出さない条件を追加する。

主張: `scenario_list.md:29` の UAN-12 と `matrix_UAN-12/README.md:12` は、毎日3時に前日分を集計する経路だけを扱っている。
実際: `excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1087` は「集計対象日はバッチの引数があれば引数の日付、なければバッチ実行日の前日」と定める。`ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:53-74` にも指定日の実行経路がある。
判定: 事実の欠落
修正案: 指定日を再集計し、その日の画面・CSVが更新される経路を追加する。
