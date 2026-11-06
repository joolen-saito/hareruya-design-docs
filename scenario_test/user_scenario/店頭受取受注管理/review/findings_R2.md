主張: `matrix_UOR-01/matrix.md:14,19,21-22` のT02・T07・T09・T10は、スムーズ店頭受取を受注一覧から手動印刷して「ピック完了」まで進む行になっている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:2313` は「受注のステータスが注文受領である場合はピック中に変更」とする。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:1023` も「注文受領」だけを更新対象とし、手動印刷後の印刷結果でも `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:99-106` はピック中に更新しない。これらの行は入金済みからピック中を通れない。  
判定: 事実の誤り  
修正案: スムーズ店頭受取の手動印刷行を、実際に通る状態と終点に合わせて見直す。

主張: `matrix_UOR-01/exceptions.tsv:6` のE5は、プリンタの印刷失敗をJ1「自動で印刷する」にだけ差し込む。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:2311` は手動印刷でも「スタック印刷APIで印刷の対象となる」とし、`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1185,1233` はブラウザ印刷指定の受注を印刷対象に含め、プリンタのエラーコードを記録すると定める。J2でも印刷失敗は起こりうる。  
判定: 事実の欠落  
修正案: E5をJ2の行にも差し込める条件に直す。

主張: `scenario_list.md:25,62` のUOR-10は、返品時に「引き渡し済み」の**新しい受注**がキャンセルへ遷移すると書く。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1518-1519` は「新規データは出荷完了で登録する」「既存受注データは…引き渡し済みにする」と区別し、同ファイル`:1558-1559` は返品対象の受注を「キャンセル」にすると定める。「引き渡し済み」は元の受注の状態である。  
判定: 事実の誤り  
修正案: UOR-10の返品対象を出荷完了の新しい受注として記し、元の受注の状態と区別する。
