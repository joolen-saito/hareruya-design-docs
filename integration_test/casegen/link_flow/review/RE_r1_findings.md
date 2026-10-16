### 指摘1（重大度: Major）対象: IT-M05-26-RE002
主張: 出荷実績の取込後、対象会員のメール配信履歴に出荷完了メールが1件表示される。
実際: 上流設計が定めるのは、受注のメールアドレスへの送信と送信履歴への件名・本文の記録までである。履歴を注文者の**会員IDに紐づける**記述はない。一方、下流画面が表示するのは「当該会員」の履歴である。著者の報告も会員との紐づけが明記されていないと認めている。([m05-26設計書:54](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:54)、[m08-07設計書:21](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m08-07_admin_customer_customer_mail_history.md:21)、[report.md:25](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RE/report.md:25))
判定: 推測による接続
修正案: 会員IDへの紐づけを設計書で確認できるまで、このケースを削除する。

### 指摘2（重大度: Major）対象: IT-M05-11-RE003
主張: 数量変更後の購入履歴「購入金額」は受注編集画面の「合計」と一致し、累計注文金額は編集前後の「合計」の差額だけ増える。
実際: 上流設計は累計注文金額から「編集前の受注分」を差し引き「更新後の受注分」を加えると記すが、それが画面項目「合計」であるとは定めていない。受注編集画面には「合計」と「お支払合計」が別項目としてある。下流の購入履歴「購入金額」にも「合計」を表示するという対応規則はない。([RE_test_cases.tsv:9](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_test_cases.tsv:9)、[m05-11設計書:27](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-11_admin_order_order_edit.md:27)、[0203 HTML:3163](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3163)、[0207 HTML:1833](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1833))
判定: 期待結果の捏造
修正案: 「合計」との数値一致を期待結果から外す。金額の対応規則が設計書で確定するまでは、対応する購入履歴の金額照合もケースにしない。

### 指摘3（重大度: Major）対象: 群
主張: M05-26 の出荷実績取込から参照画面への候補は、報告で評価した組に尽きる。
実際: 取込は受注の「出荷日」と「送り状No.」を登録し、別機能の受注情報編集画面は同名の両項目を表示する。報告は M05-26→M05-01 を対応状況の名称不一致で退けているが、M05-26→M05-11 のこの組を評価していない。既存の IT-M05-26-002 は取込後のDB確認で、当該画面での前後比較ではない。([0203 HTML:4713](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4713)、[0203 HTML:3045](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3045)、[0203 HTML:3381](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3381)、[report.md:26](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RE/report.md:26)、[all_test_cases.tsv:7860](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/all_test_cases.tsv:7860))
判定: 取りこぼし
修正案: M05-26→M05-11 のケースを追加する。受注情報編集画面で両項目の空欄を確認し、出荷実績CSVを取り込み、同画面を開き直して取込値を確認する。

### 指摘4（重大度: Minor）対象: IT-M05-26-RE001、IT-M05-26-RE002
主張: 各ケースの受注を画面から作るシードで、単独実行できる。
実際: 両シードは商品を特定せず「販売中の商品1点」を購入する。商品・在庫の開始状態や、他ケースと共有してよい条件が定まらない。状態を変えるデータをケース専用にする規約にも合わない。([RE_seed_data.tsv:18](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_seed_data.tsv:18)、[RE_seed_data.tsv:19](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_seed_data.tsv:19)、[precond/README.md:24](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond/README.md:24))
判定: 規約違反
修正案: 各ケース固有の商品コード、在庫、購入数量をシードに定め、その商品で受注を作る。

### 指摘5（重大度: Minor）対象: IT-M05-26-RE001、IT-M05-26-RE002
主張: シードの投入方法は業務上の画面名・項目名で記述している。
実際: 両シードは受注IDの取得方法にURLの「`/edit` の直前」を指定している。依頼文はルート名などの内部識別子を禁じている。([RE_seed_data.tsv:18](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_seed_data.tsv:18)、[RE_seed_data.tsv:19](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_seed_data.tsv:19)、[prompt.md:115](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RE/prompt.md:115))
判定: 規約違反
修正案: URLからの取得指示を削除し、画面に表示される注文番号で対象を指定する。受注IDが準備に不可欠なら、取得方法を業務画面または許された試験データ投入方法で明記する。
