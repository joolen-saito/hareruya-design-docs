主張: `scenario_list.md:14–108` はスマレジの記述を工程別に並べているが、指定された「業務フローパターンの網羅」表がない。
実際: `hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:42` は「tobe版のパターンも1行ずつ入れる」と定める。`hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:11–17` には「1 店頭受取（本店）」から「4 店頭支払（店内PC）」までのパターン表がある。
判定: 事実の欠落
修正案: スマレジが関わる業務フローパターンを番号・名称ごとに列挙し、通すIDまたは対象外の理由を対応付ける。

主張: `matrix_USM-01/prohibitions.tsv:2,6` のX1・X5は、スムーズ店頭受取のついで買い・複数受注を禁則にしている。
実際: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1545–1551` は複数受注を「ECCUBEにすでに存在する受注を複数同時に店頭に持ってきた時」とし、追加の「店舗内でのついで買い」も統合すると書く。`ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternResolver.php:39–45` はスムーズ店頭受取を、ついで買いの有無を判定せずパターン1へ振り分ける。扱いが未定であることは、組が起こりえない根拠にならない。
判定: 禁則の誤り
修正案: X1・X5を禁則から外し、成立時の期待値が未確定な組として判断待ちに残す。

主張: `scenario_list.md:114` のUSM-01は、スムーズ店頭受取を含む共通の終点に「取引から新しい受注が出荷完了で作られる」と書く。
実際: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1532` の購入パターン1は「取引に対応する受注データのステータスを出荷完了にする」のみ。`scenario_list.md:24` 自身も「新しい受注は作らない」としている。
判定: 事実の誤り
修正案: USM-01の終点をパターン別に書き分け、スムーズ店頭受取では既存受注だけを更新する。

主張: `scenario_list.md:114` のUSM-01は全パターン共通の終点として、マイページの購入履歴に「元の注文番号が出る」と書く。
実際: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1539–1540` のパターン8・9は、持ち込む受注のない店頭購入から受注を新規登録する。`hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2641` は購入履歴詳細を「未ログインなら会員ログインへ誘導する」と定めるため、非会員パターン9ではマイページ確認もできない。
判定: 事実の誤り
修正案: 元注文番号とマイページの期待値を該当する会員・購入パターンに限定する。

主張: `scenario_list.md:55,87` は、店頭受取を含まない返品①をUSM-02に割り当てるが、`scenario_list.md:115` のUSM-02のL3はレジ単独購入と店頭PCの「ついで買い分」に限る。
実際: `hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4553` は①を「店頭受取注文を含まないスマレジ決済」とする。`hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/scenario_list.md:25` のUOR-10は「店頭PC購入の会員／非会員、ついで買いなし／あり」も扱う。
判定: 事実の誤り
修正案: ①のうち店頭PC購入も通るIDを明記し、USM-02の対象を取引全体の返品として正確に書く。

主張: `scenario_list.md:116,155` のUSM-03は、在庫移動・分割結合・棚卸を含む全操作に「在庫編集承認：未承認→スマレジ連携中→承認済」を共通の状態遷移として置く。
実際: `hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:831–837` は在庫移動指示や棚卸を別の連携元として挙げる。`hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:2971` は在庫移動について「承認後、ステータスは出庫承認済みとなる」と定める。
判定: 事実の誤り
修正案: 在庫編集承認の遷移は該当操作だけに限定し、移動・分割結合・棚卸には各業務の状態名を使う。

主張: `scenario_list.md:119` のUSM-06は、注文時の登録失敗と、未連携のまま待った後の再連携を1本にしている。
実際: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1404–1406` は「スマレジ商品未連携もしくは、スマレジ在庫連携未連携」の注文を再連携対象とし、同`:1414` は起動を「10分ごと」と定める。`hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:13` は状態が後日の処理を待つものを別の1本にする。
判定: 切り方の誤り
修正案: 注文時の初回連携と、未連携状態から定期処理で回復するシナリオを分ける。

主張: `scenario_list.md:124` のUSM-11は、通販購入時のポイント連携と、連携エラーを残して待つ再処理を1本にしている。
実際: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1599` は送信失敗時に「処理失敗情報を保存する」とし、`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1721` は別の再連携を「5分ごと」に起動すると定める。`hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:13` は状態が後日の処理を待つものを別シナリオにする。
判定: 切り方の誤り
修正案: 購入時の使用ポイント連携と、連携エラー状態からの再連携を別のL2にする。

主張: `scenario_list.md:125` のUSM-12は、期限前の通知、期限後の失効、ポイント差分通知を一つの起点・終点にまとめている。
実際: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1149,1257,1490` は、それぞれ「毎日0:00」「毎日0:05」「毎日3:30」の独立した起動を定める。同`:1264` は期限通知を「30日 or 7日」前の残ポイントに対する処理とする。
判定: 切り方の誤り
修正案: 期限前通知、期限到来時の失効、差分検知を、それぞれの起点と確認できる終点を持つL2に分ける。

主張: `scenario_list.md:120–122` のUSM-07〜09は、商品・部門・会員の登録を起点にしながら、後の更新・廃止・退会まで同じ1本のL3に含める。
実際: `hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:7860,7871` は規格の連携フラグONによる登録と、廃止時の削除を別の操作として定める。`hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1489,3818,4328` も本会員登録、会員情報変更、退会時の削除を別々の契機として定める。
判定: 切り方の誤り
修正案: 登録後に独立して起きる変更・解除・退会は、それぞれの業務イベントから完了までのL2に分ける。
