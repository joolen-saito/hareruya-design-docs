### 指摘1（重大度: Major）対象: S-F04-02-PA-ENV
変更: A（2巡目の反映）
主張: ゆうパックとEMSの配送方法設定で、商品種別「連携PA種別」を選択して登録する。同じ手順が S-F04-03-PA-ENV にもある。
実際: 両シードの投入方法は商品種別の選択を指示する（`integration_test/casegen/link_pub/cases/PA_seed_data.tsv:2-3`）。しかし配送方法設定画面の項目定義に商品種別の選択欄はなく（`excel_to_html/output/0209_基本設計仕様書(基本設定).html:1593-1608`）、新規配送方法の商品種別は表示順が昇順で最初の1件に自動設定される（`functions/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.md:13-15`）。「連携PA種別」を作るだけでは、両配送方法にそれが設定される保証もない。
判定: 前提不成立
修正案: 配送方法設定で商品種別を「選ぶ」という手順を削除する。既存の商品種別のうち自動設定される先頭の種別を確認し、各ケースの商品登録時の販売種別をその値に合わせる手順と状態に書き直す。

### 指摘2（重大度: Minor）対象: IT-F04-02-PA001
変更: A（2巡目の反映）
主張: 裁定は「全ケースの事前準備・商品の販売種別を連携PA種別に揃えた」とする。
実際: シードの商品には連携PA種別が設定されているが、IT-F04-02-PA001・PA002、IT-F04-03-PA001・PA003 の事前準備では、商品の販売種別が抜けている（`integration_test/casegen/link_pub/cases/PA_seed_data.tsv:6-7,9,11`、`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:2-3,5,7`）。使用シードの状態を値付きで事前準備に書く規約とも合わない（`integration_test/casegen/precond/README.md:27`）。
判定: 反映不備
修正案: 上記4ケースの事前準備に、商品の「販売種別=連携PA種別」を明記する。指摘1に従って種別を変更する場合は、その確定した値を記す。
