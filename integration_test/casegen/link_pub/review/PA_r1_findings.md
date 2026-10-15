### 指摘1（重大度: Major）対象: IT-F04-04-PA001・IT-F04-04-PA002
主張: 公開側の注文を確定した後、出荷指示リストを生成でき、その検索・編集画面で注文を確認できる。
実際: 出荷指示リスト作成は、**受注サブ情報がない受注を対象外**とする（`functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md:14-19`）。注文側に明記される作成物は「明細サブ情報」である（`functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md:5-7`）。著者自身も両者の関係を読み取れないと報告している（`integration_test/casegen/link_pub/gen_PA/report.md:69`）。この前提のまま「保存しました」まで進むとは確定できない。
判定: 前提不成立
修正案: 注文で受注サブ情報が作られる設計上の根拠を特定し、必要な状態と作り方を事前準備に記す。根拠を得られなければ両ケースを削除する。

### 指摘2（重大度: Major）対象: IT-F04-04-PA001
主張: 出荷指示リスト検索の1行と、そのリストの編集画面にある注文番号で IT-0332 を判定する。
実際: IT-0332 は公開側で登録した実体が、その実体を扱う管理画面の一覧・詳細で参照できる判定である（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:333`）。このケースが一覧で開く対象は、管理画面の操作で新たに作った**出荷指示リスト**である（`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:9`、`functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md:30-34`）。注文の受注一覧・編集画面への到達は既存の IT-F04-02-080 が確認済みである（`integration_test/casegen/all_test_cases.tsv:1926`）。
判定: 範囲外
修正案: IT-0332 のケースとしては削除する。

### 指摘3（重大度: Major）対象: IT-F04-02-PA002・IT-F04-02-PA003・IT-F04-02-PA004
主張: 商品・金額、配送日時、ポイント・値引きを別々の IT-0333 ケースとする。
実際: 3件とも F04-02 で注文を確定し、M05-11 の受注情報編集画面で同値を判定する（`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:3-5`）。依頼文は同じ上流機能と下流画面の登録・表示を原則1件とし、**同じ判定を項目違いで増やさない**と明記する（`integration_test/casegen/link_pub/gen_PA/prompt.md:90-91`）。
判定: 重複
修正案: 有効なポイントと配送日時を設定した1件の注文にまとめ、設計書で対応が確認できる項目を一つの期待結果で照合する。

### 指摘4（重大度: Major）対象: 群 PA
主張: F04-03 から M05-11 への連携は、配送先の新規登録2件で扱った（`integration_test/casegen/link_pub/gen_PA/report.md:16`）。
実際: F04-03 は既存配送先の**変更**も登録確定時に保存し、その注文の配送先に反映すると定める（`functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md:37-43,60-64`）。M05-11 には変更対象の氏名・住所等の表示欄がある（`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3358-3372`）。既存の IT-F04-03-024 は配送先の更新をDBで見るケースで、注文後の受注情報編集画面は確認しない（`integration_test/casegen/all_test_cases.tsv:1958`）。
判定: 取りこぼし
修正案: 既存配送先の住所等を注文手続き中に変更・確定し、その注文を完了した後、受注情報編集画面のお届け先情報に変更後の値が表示されるケースを追加する。

### 指摘5（重大度: Minor）対象: IT-F04-02-PA002
主張: 商品明細は商品名と数量を確認し、言語は対応規則を決められないとして外した（`integration_test/casegen/link_pub/gen_PA/report.md:28,61`）。
実際: ご注文方法指定の商品欄には独立した「言語」項目があり、受注情報編集の受注商品情報にも独立した「言語」項目がある（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1496`、`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3143`）。報告が挙げる商品名中の表記を使う必要はない。
判定: 取りこぼし
修正案: シード商品の言語を指定し、PA002の受注商品情報の言語欄を期待結果に加える。

### 指摘6（重大度: Minor）対象: IT-F04-03-PA001・IT-F04-03-PA002
主張: 両ケースの開始時に「お届け先は登録済み1件だけ」とする。
実際: シードの投入方法には会員・商品・カートの作成はあるが、その1件の配送先を登録する操作と値がない（`integration_test/casegen/link_pub/cases/PA_seed_data.tsv:13-14`）。事前準備はその状態を前提にしている（`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:7-8`）。規約は使用シードの状態を値付きで記し、画面操作で作る状態は操作まで記すよう求める（`integration_test/casegen/precond/README.md:20-22`）。
判定: 規約違反
修正案: 配送先1件の名称・住所と画面での登録手順をシードに加える。1件を必要としないなら、開始時件数を実際の投入手順に合わせて書き直す。
