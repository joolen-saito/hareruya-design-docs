主張: `matrix_UOR-01/prohibitions.tsv:12` の禁則X11は、本店の店頭受取×全額ポイント支払いを不可としている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1637,1655,1757` は、ポイント非表示を「支店の場合」とし、本店ECでは「ポイント使用」を表示し、支払額以上の使用時は「全額ポイント支払い」だけを選択肢にすると定める。新実装の非表示は同設計書との食い違いである。  
判定: 禁則の誤り  
修正案: X11を外して本店の店頭受取×全額ポイント支払いを網羅対象に戻し、新実装で実行できない点を食い違いとして記録する。  

主張: `scenario_list.md:20` のUOR-05は、全額ポイント支払いもL3に含めながら、通る状態を「ピック完了（入金済みのまま）→キャンセル」としている。  
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:45-51` は、銀行振込以外の購入確定時に注文受領の状態を設定する。全額ポイント支払いについては `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:31` も「注文受領」と確認している。  
判定: 事実の誤り  
修正案: UOR-05の通る状態を、カード決済は「入金済み」、全額ポイント支払いは「注文受領」からそれぞれキャンセルへ進む形に直す。  

主張: `scenario_list.md:25` のUOR-10は、全額ポイント支払いの引き渡し後返品について、使用ポイントが戻るかを「同じ取り込みの処理による」としている。  
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointReverter.php:33-36,80-88` は、スマレジ取引に紐付くポイント履歴だけを差し戻し、EC購入時のポイント履歴は対象外とする。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2150` は「注文を確定した時点で使用ポイントを消費する」と定める。  
判定: 事実の欠落  
修正案: スマレジの返品取込だけではEC注文時に使用したポイントが戻らないことを記録し、全額ポイント支払いの返還処理をUOR-10の判断待ちに加える。
