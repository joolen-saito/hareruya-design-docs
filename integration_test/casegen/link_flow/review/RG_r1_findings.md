### 指摘1（重大度: Major）対象: IT-M07-03-RG001、IT-M07-03-RG002
主張: 「入庫待ち・未入庫」を事前準備し、買取情報編集で「入庫済み」に変更した後の在庫・履歴を確認する（[RG_test_cases.tsv:2](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RG_test_cases.tsv:2)、[同:3](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RG_test_cases.tsv:3)）。
実際: 買取自動入庫バッチも「入庫待ち」のネット買取を取り込み、在庫登録と「入庫済み」への変更を行う。実行時刻は毎日15:00と定められている（[0406設計書:1034](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ機能).html:1034)、[同:1044](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ機能).html:1044)）。両シードは入庫待ちのままテスト開始を待つため（[RG_seed_data.tsv:5](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RG_seed_data.tsv:5)、[同:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RG_seed_data.tsv:6)）、バッチが先に処理すると操作前の表示も手動変更の手順も成立しない。
判定: 前提不成立
修正案: 両ケースの事前準備に、対象の試験DBで自動入庫バッチが割り込まない状態を設け、その状態で「入庫待ち・未入庫」を確認する手順を明記する。

### 指摘2（重大度: Minor）対象: IT-M07-03-RG003
主張: 「振込完了」に変更して保存すれば、買取商品履歴の表示を確認できる（[RG_test_cases.tsv:4](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RG_test_cases.tsv:4)）。
実際: この変更時には振込完了メールも自動送信する（[0206設計書:1800](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:1800)）。RG003のシードには配送先の試験設定がない（[RG_seed_data.tsv:7](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RG_seed_data.tsv:7)）。同じ操作を扱う既存ケース IT-M07-03-046 は、開始時に配送先をMailCatcherへ設定している（[M07-03_test_cases.tsv:47](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:47)）。
判定: 手順不備
修正案: RG003にも試験用メール配送先の設定をシードと事前準備に加え、振込完了への変更を試験環境内で完了できるようにする。
