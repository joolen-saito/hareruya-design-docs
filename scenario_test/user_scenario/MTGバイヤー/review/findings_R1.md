主張: `scenario_test/user_scenario/MTGバイヤー/scenario_list.md:16-82,97` に「業務フローパターンの網羅」表がなく、UMG-09 の業務フロー欄は「—」としている。
実際: `scenario_test/user_scenario/AUTHORING.md:42` はパターンを1行ずつ対応付けるよう定める。`scenario_test/markdown/07_店頭買取_tobe.md:168,174,230,237` には MTGバイヤーの「通販_支店システム用CSV」と、その受け渡しがある。
判定: 事実の欠落
修正案: 06・07・14の各パターンの対応表を追加し、07のCSVをUMG-09または実際に通る既存IDへ対応付ける。

主張: `scenario_test/user_scenario/MTGバイヤー/scenario_list.md:90-91` のUMG-02は査定開始、UMG-03は査定表への追加だけをそれぞれL2の終点にしている。
実際: `scenario_test/user_scenario/AUTHORING.md:11-12` は「起点の業務イベントから、業務として完了した状態になるまで」を1本と定める。`scenario_test/markdown/06_店頭買取.md:31-43` では査定開始から査定表印刷、結果確認、成立またはキャンセルへ続く。
判定: 切り方の誤り
修正案: UMG-02・03の確認内容を、業務完了まで通るUKA・UNKのシナリオのL3または連携確認点に組み込む。

主張: `scenario_test/user_scenario/MTGバイヤー/scenario_list.md:95` のUMG-07は「査定中断→査定再開」を一つのL2にしている。
実際: `scenario_test/user_scenario/AUTHORING.md:13` は後日の処理を待つ状態で別の1本にすると定める。`functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:171-186` は中断時に状態と査定途中のデータを保管し、後に受注を選んで復元すると記す。
判定: 切り方の誤り
修正案: 後日再開する場合は中断して保管するシナリオと、保管済みの査定を再開するシナリオに分ける。

主張: `scenario_test/user_scenario/MTGバイヤー/scenario_list.md:80-81,98` は部門フラグと追加システム設定の変更をUMG-10というL2にしている。
実際: `scenario_test/user_scenario/AUTHORING.md:16` は「前提データ（会員・商品・店舗などのマスタ）はシナリオから外す」と定める。`excel_to_html/output/0204_基本設計仕様書(商品管理).html:4735` は「部門登録」、`excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:2511-2512` は「追加システム設定」の項目として記載する。
判定: 切り方の誤り
修正案: UMG-10をL2から外し、各設定値による査定・一覧・通知の違いを該当シナリオの前提とL3に移す。

主張: `scenario_test/user_scenario/MTGバイヤー/matrix_UMG-04/matrix.md:21` の通常行T09は、申込カードを削除し、追加カード・まとめて買取・サプライ品がない組で査定完了まで通す。
実際: `functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:148-150` は削除済みの行を除いた査定明細を送る。`excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1519` は「明細の配列が空のとき」「1つ以上の商品を選んでください。」として入力不正で終了する。
判定: 禁則の誤り
修正案: T09を正常な査定完了行から外し、空明細の例外にするか、残る明細がある条件を明示する。

主張: `scenario_test/user_scenario/MTGバイヤー/matrix_UMG-03/exceptions.tsv:9` のE8は差し込み条件をX1（店頭買取）だけにしており、`matrix.md:36` では金額指定で足すT09へ差し込まれている。
実際: `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:88-89,225` は「買取価格が基準価格以上」の中止を「個別入力する」に定める。金額指定は基準価格を指定金額の10倍にする。
判定: 禁則の誤り
修正案: E8の条件を店頭買取かつ個別入力（X1・B3）に絞り、対応する行へ差し込む。

主張: `scenario_test/user_scenario/MTGバイヤー/matrix_UMG-04/exceptions.tsv:13` のE12は、まとめて買取の設定が無い例外をC2（申込にまとめて買取がある）へだけ差し込む。
実際: `functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:39-48` は受注一覧を取得した後、全受注についてまとめて買取の商品IDを取得する。`excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1085` は設定が無ければHTTP 500相当とする。
判定: 事実の欠落
修正案: E12をC1・C2の両方に成立する一覧取得の例外として差し込む。

主張: `scenario_test/user_scenario/MTGバイヤー/scenario_list.md:94` のUMG-06は失敗時に「EC の買取は変わらない」としながら、同じ行でメール送信失敗時は「ECは更新済み」としている。
実際: `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:95-100` は更新を`commit()`した後に経理メールを送る。メール送信で失敗しても確定済みの更新は残る。
判定: 事実の誤り
修正案: 更新前の失敗と、更新確定後のメール送信失敗を分け、後者のEC状態は更新済みと書く。

主張: `scenario_test/user_scenario/MTGバイヤー/matrix_UMG-04/exceptions.tsv:3` のE2は、別担当者が査定中の受注を選んで同じ状態を送る場合を「期待値が決まらない」とする。
実際: `excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1377` は同じ状態なら更新・履歴登録をせず「正常終了（HTTP 200）」と明記する。`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:71-73` も同じ状態ならそのまま戻る。
判定: 事実の誤り
修正案: E2の期待値を正常終了・状態と履歴は不変とし、同じ設計書のエラー判定表との食い違いは別に記録する。
