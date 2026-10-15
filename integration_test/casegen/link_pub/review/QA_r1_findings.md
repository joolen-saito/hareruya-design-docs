### 指摘1（重大度: Major）対象: 群 QA
主張: 各ケースの専用商品は、作成した最上位カテゴリ「QA群カテゴリ0302／0309／0310」を指定してグッズ商品CSV登録画面から投入できる。
実際: シードは任意の最上位カテゴリを作り、そのIDをCSVに指定している（`integration_test/casegen/link_pub/cases/QA_seed_data.tsv:4,7,9,13-22`）。グッズ商品CSV登録で選べるのは「サプライ・グッズ・予約グッズ・情報商材」のカテゴリに限られる（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:34-39`）。このカテゴリが許容範囲に属する前提がなく、専用商品を作れると確定しない。
判定: 前提不成立
修正案: 許容されるカテゴリ配下にケース専用カテゴリを画面から作り、その発番IDをCSVへ指定する。各シードの投入手順も合わせて直す。

### 指摘2（重大度: Major）対象: IT-M03-09-QA001、IT-M03-10-QA001
主張: グッズ商品CSVで作った商品の詳細画面で「状態NMの価格」を確認できる。
実際: 両シードはグッズ商品CSV登録で作る（`integration_test/casegen/link_pub/cases/QA_seed_data.tsv:19,22`）。販売の商品詳細では状態表示はカード商品に限る（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1746-1750,1802`）。ネット買取商品詳細でも状態はカード商品の表示項目とされる（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1847-1850,1872-1873`）。ケースの「状態NMの価格」という画面上の確認対象は、このシードでは成立しない。
判定: 前提不成立
修正案: NM表示を確認するならカード商品を画面から用意する。グッズ商品を使うなら、画面に表示される価格を確認する手順と期待結果に書き直す。

### 指摘3（重大度: Major）対象: 群 QA（M03-02→F03-01）
主張: 商品一覧への商品名の反映は、商品詳細のQA001で確認するため作らない（`integration_test/casegen/link_pub/gen_QA/report.md:18`）。
実際: M03-02は商品情報を更新する（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:22-31`）。F03-01の商品一覧には商品名の表示項目がある（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1352`）。商品詳細と商品一覧は別の下流画面であり、QA001は商品一覧への反映を判定しない（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:2`）。
判定: 取りこぼし
修正案: 商品名を管理画面で変更し、必要な索引更新を完了させ、商品一覧の表示が旧名から新名に変わるケースを追加する。

### 指摘4（重大度: Major）対象: 群 QA（M03-09→F03-01）
主張: 商品一覧はQA003のセールフラグ確認で扱うため、販売価格の反映ケースを作らない（`integration_test/casegen/link_pub/gen_QA/report.md:21-23`）。
実際: M03-09は販売価格を保存し、セールフラグが無効なら基準価格で販売価格を上書きする（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:3566-3572`）。F03-01は各商品の規格の販売価格を一覧に表示する（`functions/pf-eccube3/f03-01_front_product_product_search_list.md:17-19`）。QA003はSaleラベルだけを判定しており、販売価格を見ていない（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:10`）。
判定: 取りこぼし
修正案: 規格の販売価格を変更し、索引更新後に商品一覧の価格が操作前後で変わるケースを追加する。

### 指摘5（重大度: Minor）対象: 群 QA（M03-02の商品画像→F03-02）
主張: 商品画像は画面で同一性を言い切れないため作らない（`integration_test/casegen/link_pub/gen_QA/report.md:55`）。
実際: M03-02は追加画像を当該商品の画像として登録する（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:29,42-47`）。F03-02には当該商品の「商品画像」の表示項目がある（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1796`）。画像を1枚に限定すれば、複数画像の選択順を推測せずに反映を判定できる。
判定: 取りこぼし
修正案: 画像のない専用商品に識別できる画像を1枚追加して商品を更新し、商品詳細の画像表示が操作前後で変わるケースを追加する。

### 指摘6（重大度: Major）対象: 群 QA（M03-10→F05-01）
主張: F05-01は索引経由で、QA006と同型なので作らない（`integration_test/casegen/link_pub/gen_QA/report.md:27`）。
実際: M03-10は規格の買取価格を更新する（`functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md:16-29`）。F05-01の目玉買取商品には買取価格の表示項目があり、登録値を表示すると定める（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1302,1325`）。QA006が確認するのはM03-02のタグ追加による掲載であり、買取価格の更新ではない（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:7`）。
判定: 取りこぼし
修正案: 目玉買取商品として掲載される専用商品を用意し、M03-10で買取価格を更新する。反映処理とキャッシュの完了後、F05-01の価格が操作前後で変わるケースを追加する。

### 指摘7（重大度: Major）対象: 群 QA（M03-10→F05-05）
主張: 買取カートは商品詳細と同じ経路なので作らない（`integration_test/casegen/link_pub/gen_QA/report.md:27`）。
実際: F05-05は買取価格をカートに保持せず、画面表示のたびに現在の商品データを参照すると明記している（`functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md:5-9`）。M03-10の価格更新（`functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md:16-29`）が既存の買取カートに反映されるかは、F05-04のQA001では判定できない（`integration_test/casegen/link_pub/cases/QA_test_cases.tsv:11`）。
判定: 取りこぼし
修正案: 専用商品を買取カートに入れて旧価格を確認し、M03-10で買取価格を更新する。買取カートを開き直して新価格が表示されるケースを追加する。
