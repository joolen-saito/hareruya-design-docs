主張: `scenario_list.md:21` の UAN-04 は「受注：キャンセル以外を数える」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能).html:1744` は「キャンセル日を選んだときは除かない」とする。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:237-243` も、キャンセル日で検索するとキャンセル受注を対象にする。
判定: 事実の誤り
修正案: UAN-04 の対象を「キャンセル日以外ではキャンセル受注を除き、キャンセル日では含める」と明記する。

主張: `matrix_UAN-03/prohibitions.tsv:2` の X1 は、出荷前の取り消し A4 と日付指定の再集計 D2 を禁じている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/DailySummaryAggregateCommand.php:36-37,84-95` は「指定日のみを集計する」とし、指定日の集計を実行する。取り消しが集計値を変えないことは、この組が実行不能である根拠にならない。
判定: 禁則の誤り
修正案: X1 を削除し、A4・D2 では再集計後も値が変わらないことを確認する。

主張: `matrix_UAN-02/matrix.md:17` の T05 は、ネット買取を「まだ確定していない」状態にしながら、同じ集計日に「承諾も済む」と組み合わせている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:213-218` は、ネット買取を「査定承諾済み」のときに限り集計すると定める。承諾前という B2 と、承諾済みという D1 の条件は同時に成立しない。
判定: 禁則の誤り
修正案: 確定前には承諾日を適用しない水準を設け、T05 を成立する組に作り直す。

主張: `matrix_UAN-10/matrix.md:26` の T14 は、ログインしていない利用者がお気に入り一覧・入荷通知一覧を開いて確認する行になっている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:149-173` はお気に入り一覧でログイン利用者を取得してその会員情報を参照し、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/NotifylistController.php:56-71` も入荷通知一覧で同様に参照する。ログインしていない状態では、T14 が前提とする一覧を表示できない。
判定: 禁則の誤り
修正案: A5 と未ログイン B2 の組を除き、T14 を実行できる画面・ログイン状態の組に置き換える。

主張: `matrix_UAN-01/fl_table.tsv:13` の C7 は、スマレジだけの店頭購入を「ECの受注なし」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1539-1540` は、店頭購入の会員・非会員の両パターンで「取引に対応する受注データをECCUBEに新規登録する」とする。
判定: 事実の誤り
修正案: C7 を「購入前にEC受注はなく、スマレジ受信後に対応する受注が新規登録される」と直す。
