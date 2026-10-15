### 指摘1（重大度: Major）対象: 群 QA（M03-02→F03-01・F05-01）
主張: 本店の公開ステータス変更は、商品詳細と本店TOPのケースで確認できる。
実際: QA002は商品詳細、QA005は本店TOPの「最新入荷アイテム」を確認するだけである（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:3,6`）。商品一覧はM03-02の公開ステータスによる表示・非表示を明記し、ネット買取TOPも「公開」を掲載条件にする（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1305,1325`、`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1285-1288`）。
判定: 取りこぼし
修正案: 本店の公開ステータスを公開から非公開に変更し、索引更新とキャッシュの反映後、商品一覧およびネット買取TOPから対象商品が消えるケースを追加する。

### 指摘2（重大度: Minor）対象: 群 QA（M03-02→F03-01）
主張: 追加したQA008で、商品画像の公開側への反映を解消した。
実際: QA008の下流は商品詳細だけである（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:9`）。M03-02は画像を商品に登録し、商品一覧にも「商品画像」の表示項目がある（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:29`、`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1348`）。
判定: 取りこぼし
修正案: 画像のない専用商品の画像を1枚追加し、商品一覧の画像が操作前後で変わる確認をQA007にまとめるか、専用ケースを追加する。

### 指摘3（重大度: Major）対象: 群 QA（M03-09→F05-01・F05-03・F05-04・F05-05）
主張: M03-09からネット買取への買取価格反映は、M03-10側のケースで確認するため作らない（`integration_test/casegen/link_pub/gen_QA/report.md:25`）。
実際: M03-09自身が規格の買取価格を保存する（`functions/pf-eccube3/m03-09_admin_product_product_class_edit.md:13-19`）。ネット買取TOP・商品一覧・商品詳細・カートはいずれも登録済みまたは現在の商品データの買取価格を表示する（`functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md:9-11`、`functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md:35-37`、`functions/pf-eccube3/f05-04_front_online_purchase_buy_product_detail.md:25-29`、`functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md:5-7`）。M03-10の操作は別の上流操作である。
判定: 取りこぼし
修正案: M03-09で買取価格を変更し、各下流画面で旧価格から新価格への変化を確認するケースを追加する。検索画面には索引更新、TOPには掲載条件とキャッシュの待ちを入れる。

### 指摘4（重大度: Major）対象: 群 QA（M03-10→F05-03）
主張: ネット買取商品一覧は索引経由なので作らない（`integration_test/casegen/link_pub/gen_QA/report.md:27`）。
実際: M03-10は規格の買取価格を更新し、F05-03は各商品規格に登録済みの買取価格を表示すると明記する（`functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md:16-19`、`functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md:35-37`）。QA002が確認するのは別画面のネット買取TOPである（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:15`）。
判定: 取りこぼし
修正案: 一括編集で買取価格を変更し、必要な索引更新後、ネット買取商品一覧の価格が旧値から新値に変わるケースを追加する。

### 指摘5（重大度: Major）対象: 群 QA（M03-02→F05-03・F05-04・F05-05）
主張: ネット買取側の商品画面は、タグ追加のQA006とM03-10の価格ケースで扱えている（`integration_test/casegen/link_pub/gen_QA/report.md:20,27`）。
実際: M03-02は商品名を更新する（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:22-31`）。ネット買取商品一覧・詳細には商品名の表示項目があり、買取カートは表示時に現在の商品名を参照する（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1629,1870,2043`、`functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md:5-7`）。QA006はタグ追加、M03-10のケースは価格更新であり、商品名の更新を確認しない。
判定: 取りこぼし
修正案: M03-02で専用商品の商品名を変更し、索引反映後のネット買取商品一覧、商品詳細、既存の買取カートで表示の変化をそれぞれ確認する。

### 指摘6（重大度: Minor）対象: IT-M03-02-QA008
主張: 画像ファイルを選択して直ちに「商品を登録」を押せば、画像が登録される（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:9`）。
実際: 画像のアップロードは非同期で、受け付けた画像が商品に登録されるのは、その後の商品更新時である（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:42-47`）。手順にはアップロード受付の完了待ちがない。
判定: 手順不備
修正案: 画像アップロードの完了と受付結果を確認してから「商品を登録」を押す手順にする。

### 指摘7（重大度: Minor）対象: 群 QA
主張: 報告書は作成数を10件、採用ケースの重複確認を「全10件」と記す（`integration_test/casegen/link_pub/gen_QA/report.md:5-6,41-42`）。
実際: ケース表には15件あり、報告書末尾でも15件に増えたと記す（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:2-16`、`integration_test/casegen/link_pub/gen_QA/report.md:66-75`）。追加5件は組ごとの評価表・対応表・重複確認・到達可能性に反映されていない。
判定: 規約違反
修正案: 報告書の件数を15件に直し、追加5件を各評価表と確認結果に反映する。
