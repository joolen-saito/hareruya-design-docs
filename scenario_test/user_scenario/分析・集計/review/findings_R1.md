主張: `scenario_list.md:28` の UAN-11 は「履歴が無い単位は更新されず前回の値が残る」とする。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:41-44` は、既存の集計を全削除してから取得した履歴分を登録する。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:101-105` も「集計用の既存行を削除する」と明記する。履歴が無い単位の前回値は残らない。
判定: 事実の誤り
修正案: UAN-11 の期待値を、履歴が無い単位の前回値は消えるという実装に合わせて直す。

主張: `matrix_UAN-03/README.md:25-26` は、日付指定で日別を洗い替えた後、「同じバッチの流れで月別も洗い替わる」とする。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/DailySummaryAggregateCommand.php:84-95` の日付指定実行は日次集計だけを呼ぶ。月次集計は別の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/MonthlySummaryAggregateCommand.php:33-41,86-96` で、指定月を別途処理する。
判定: 事実の誤り
修正案: 日付指定の流し直しでは、日次の後に対象月の月次集計も実行・確認する条件を UAN-03 に加える。

主張: `matrix_UAN-03/matrix.md:13,17,21-24` の T01・T05・T09・T10・T12 は、「バッチがまだ動いていない」時点の確認だけで終わる。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11` は「起点の業務イベントから、業務として完了した状態になるまで」を1本とする。`scenario_list.md:20` の UAN-03 の終点は、バッチ後に日別・月別集計が直ること。バッチ前の値は途中状態である。
判定: 切り方の誤り
修正案: バッチ前の確認を各行の途中の確認に置き、バッチ後に値が直るところまで通す。

主張: `scenario_list.md:29,70` は、0404「商品部門未設定チェック」（B02-04）を UAN-12 の買取集計バッチの結果確認に割り当てる。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1262` の概要は「商品の公開ステータスが公開なのに、部門が未設定の商品があった場合、管理者にメールで通知する」。同ファイル `:1276` は毎日4:00の独立した起動を定め、買取成立分を集計する条件はない。
判定: 切り方の誤り
修正案: B02-04 の独立した通知を UAN-12 の終点から外し、設計書の網羅表でも別の扱いにする。

主張: `matrix_UAN-09/README.md:14` と `scenario_list.md:84` は、複数お届け先を「新実装が複数配送を前提にしていない」として水準から外す。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0310_基本設計仕様書(フロント_アクセス解析).html:321` は「お届け先が複数ある場合も1件目だけを使う」、`:330` も「お届け先が複数あるとき」を明示する。一方、根拠に挙げた `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:77-78` の注記は日別集計で配送方法を1件に絞る処理についてで、購入完了時のアクセス解析の条件ではない。
判定: 事実の欠落
修正案: 複数お届け先で1件目の配送方法を積む条件を UAN-09 に含め、購入画面で実行できないなら0310との食い違いとして記録する。
