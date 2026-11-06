主張: [scenario_list.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/scenario_list.md:68) の UPT-01 は、会員の購入から出荷完了時の付与までを1本にしている。  
実際: [業務フロー16](/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:36) は「注文完了」を購入工程の終点とし、[同113行](/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:113) で後の「国内発送完了インポート作業」を扱う。[AUTHORING.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:13) は後日の処理を待つ場合、別の1本にすると定める。  
判定: 切り方の誤り  
修正案: UPT-01の起点を出荷処理に置き、購入時の付与予定は既存の購入シナリオから引き継ぐ。

主張: [scenario_list.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/scenario_list.md:70) の UPT-03 は、完了したレジ購入と「のちに」起きる取消・打消しを1本にしている。  
実際: [AUTHORING.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11) の単位は「起点の業務イベントから、業務として完了した状態になるまで」。新実装も[購入時の反映](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:29)と[取消時の差し戻し](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointReverter.php:26)を別の取引として処理する。  
判定: 切り方の誤り  
修正案: 完了済みの購入を取り消す経路は、取消・打消しを起点とする別のL2に分ける。

主張: [scenario_list.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/scenario_list.md:68) の UPT-01 は、通る状態を「入金済み／注文受領→出荷指示→出荷完了」に限っている。  
実際: [業務フロー16](/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:58) は「出荷準備は入金が無くても進めており」とする。新実装の[状態遷移](/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/order_state_machine.php:121) は入金待ちから出荷準備へ進め、[同161行](/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/order_state_machine.php:161) は出荷準備から出荷完了へ進める。  
判定: 事実の欠落  
修正案: 入金待ちから出荷指示を経て出荷完了になる経路を、UPT-01の通る状態とL3に加える。

主張: [scenario_list.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/scenario_list.md:29) の経路表はレジ購入、[同31行](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/scenario_list.md:31) は管理画面の手動増減、[同49行](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/scenario_list.md:49) はレジ購入の返品を載せるが、スマレジのポイント専用取引の増減とその取消・打消しを載せていない。  
実際: 新実装の[ポイント専用取引の処理](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:33) は「区分6: 付与ポイントを加算」「区分7: 使用ポイントを減算」し、[専用の差し戻し処理](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:26) はその「取消・打消し」で履歴と残高を戻す。UPT-03の例外E4は増減の取込みだけを記す。  
判定: 事実の欠落  
修正案: ポイント専用取引の加算・減算と各取消・打消しを、経路表でそれぞれ対応するシナリオに割り当てる。

主張: [matrix_UPT-01/exceptions.tsv](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-01/exceptions.tsv:5) の E4 は、CSVの途中で失敗しても先行行の付与・メール・スマレジ加算は「取り消されない」とする。  
実際: 新実装の[CSV取込処理](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:344) は全行の登録とポイント付与を同じトランザクションに入れ、[同360行](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:360) は失敗時にロールバックする。メール送信とスマレジ連携の送出は[確定後](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:377)である。  
判定: 事実の誤り  
修正案: E4に新実装では取込中の失敗で全行が戻ることを記し、設計書との食い違いとして明示する。

主張: [matrix_UPT-05/matrix.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-05/matrix.md:38) の E7 は「クレジットカード決済の途中離脱」を T11 に差し込むが、[T11](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-05/matrix.md:23) の支払方法はコンビニ決済である。  
実際: [0304の設計書](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2150) は「SPLINKS決済（コンビニ・クレジットカード）」の両方について、購入完了画面の表示時にポイントを消費すると定める。  
判定: 事実の誤り  
修正案: カード途中離脱の差し込み先をカード決済の行に直し、コンビニ決済の途中離脱も対象にする。

主張: [matrix_UPT-07/prohibitions.tsv](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-07/prohibitions.tsv:4) の X3 は、「一部の取り消し」×「付与ポイントを別の購入で使い切っている」を禁じる。  
実際: [0203の設計書](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3235) の一部キャンセル時の定めは「付与済みポイント：変動なし」であり、使い切った注文の一部を取り消せないとは定めていない。使い切った後でも一部キャンセルは起こりうる。  
判定: 禁則の誤り  
修正案: X3を削除し、一部キャンセルでも付与済みポイントを使い切った条件を行に残す。

主張: [matrix_UPT-07/matrix.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-07/matrix.md:26) の E1はポイント未使用のT01に「使用ポイントは戻る」を、[E3・E4](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-07/matrix.md:28) は一部取消のT05・T02に全キャンセル時の処理を差し込む。  
実際: [同マトリクスのT01・T02・T05](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-07/matrix.md:13) はそれぞれポイント未使用または一部取消。[0203の設計書](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3223) は履歴削除とスマレジ連携を「キャンセル日を新たに入れたときだけ」行い、[同3235行](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3235) は一部キャンセルの使用・付与済みポイントを「変動なし」とする。  
判定: 事実の誤り  
修正案: E1は使用ありの全取消行へ、E3・E4は全取消行へ差し込み直し、それぞれの成立条件に合う元行を選ぶ。

主張: [matrix_UPT-08/matrix.md](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-08/matrix.md:26) の E3 は「失効の日の翌日にもう一度実行」を、期限切れの付与が無いT01に差し込む。  
実際: [T01](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-08/matrix.md:13) は「付与はすべて183日以内」「使っていない」ため、前日に失効済みという条件を作れない。[0408の設計書](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1175) は残高が期限内の付与累計を上回る会員を失効対象とする。  
判定: 事実の誤り  
修正案: E3は期限切れの付与がある行で初回失効を実行し、その翌日の再実行を差し込む。

主張: [matrix_UPT-08/exceptions.tsv](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ポイント/matrix_UPT-08/exceptions.tsv:3) の E2 は、スマレジ連携が失敗するとECの残高・履歴も変えず翌日へ持ち越すと断定する。  
実際: [0408の設計書](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1196) は失敗会員の失効を「今回は行わず」とする。一方、新実装は[残高・履歴を確定](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:73)した後に[スマレジ連携メッセージを送出](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:119)するため、送出後の連携失敗ではEC側の失効は戻らない。  
判定: 事実の誤り  
修正案: E2の失敗時点を区別し、連携失敗時の新実装の結果と設計書との食い違いを記録する。
