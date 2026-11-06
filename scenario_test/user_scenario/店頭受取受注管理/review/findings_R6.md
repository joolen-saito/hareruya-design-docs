主張: `scenario_list.md:25` の UOR-10 は引き渡し後の返品を扱うが、L3 は店頭受取注文の返品だけを挙げ、UOR-07 で引き渡した店頭PC注文の返品がない。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1535-1538` は店頭PC購入の会員・非会員とついで買いの有無を購入パターンに挙げ、同ファイル`:1557-1559` は返品時に「対象の受注データのステータスを「キャンセル」にする」と定める。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4553` も「店頭受取注文を含まないスマレジ決済」の全返品を認める。  
判定: 事実の欠落  
修正案: UOR-10 の L3 に、店頭PC注文の返品を会員・非会員、ついで買いの有無とともに加える。

主張: `scenario_list.md:27` の UOR-12 はお客様の依頼による受け取り前のキャンセルを店頭受取・スムーズ店頭受取に限り、店頭PC注文は UOR-08 の期限超過キャンセルでしか扱っていない。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:10` は「キャンセル時の戻し」は通常の通販業務と同じとし、同ファイル`:107-110` は店頭PC注文も受注として生成すると記す。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:2701` の受注編集は、キャンセル時に「在庫・使用ポイント・付与ポイントを戻す」と定め、店頭PC注文を除外していない。  
判定: 事実の欠落  
修正案: UOR-12 に店頭PC注文の受け取り前キャンセルを加え、店頭注文番号の表示解除も確認対象にする。
