### 指摘1（重大度: Major）対象: IT-M03-11-QD001
主張: 事前準備で商品登録編集画面から新規商品を作り、公開状態にできる。
実際: シードは商品を同画面で新規登録する手順を指定している（`integration_test/casegen/link_pub/cases/QD_seed_data.tsv:3`）。刷新仕様は商品新規登録へのアクセスを禁止し、404を返す（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1550-1552`）。このままでは公開側を確認する前に事前準備が止まる。
判定: 前提不成立
修正案: 新規登録可能な画面で商品を作るシードに変更し、登録から公開までの手順を記す。

### 指摘2（重大度: Major）対象: IT-M03-13-QD002
主張: 優先表示商品を C・A・B の順に入力し直すと、本店TOPにも必ず C・A・B の順に表示される。
実際: 上流は入力の先頭ほど大きい順位を保存する（`functions/pf-eccube3/m03-13_admin_product_product_tag.md:31-35`）。下流は「優先表示商品の並び順」とだけ定め、順位値をどちら向きに表示するかは書いていない（`excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:1297`）。著者も入力順という正解を既存ケースから補ったと記している（`integration_test/casegen/link_pub/gen_QD/report.md:72`）。
判定: 期待結果の捏造
修正案: 下流の表示方向を設計書で確定する。確定できるまでは具体的な C・A・B の順序を期待結果に置かない。

### 指摘3（重大度: Major）対象: IT-M03-13-QD001、IT-M03-13-QD002、IT-M03-22-QD001
主張: グッズ商品CSVの「そのほかの必須列に有効な値」を入れれば、各ケースの専用商品を作れる。
実際: 各シードは必須列の値を指定していない（`integration_test/casegen/link_pub/cases/QD_seed_data.tsv:5-6,8`）。グッズ商品CSVには英語名、サイズ、重量、購入グループ名称、各価格などの必須列があり、価格の整合も検証される（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:24-30,50-72`）。事前準備の値を記す規約にも反する（`integration_test/casegen/precond/README.md:27`）。
判定: 規約違反
修正案: 各CSVの必須列と価格を具体値で記し、参照する購入グループやカテゴリの作成手順もシードに含める。

### 指摘4（重大度: Major）対象: IT-M03-41-QD002
主張: CSVの「表示ランク」を A=10・B=20 に変えると、公開側の「表示順」により B・A と並ぶ。
実際: 上流のCSV項目は「表示ランク」（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:7322`）、下流の並びの定義は「表示順の降順」（`functions/pf-eccube3/f03-04_front_product_product_category_list.md:5-7`）。提示された出典には両項目の対応規則がない。著者は既存シードを根拠に同一視している（`integration_test/casegen/link_pub/gen_QD/report.md:39`）。
判定: 推測による接続
修正案: 設計書に「表示ランク」が公開側の「表示順」に対応する記述を示す。示せなければ、この並びの期待結果を削除する。

### 指摘5（重大度: Major）対象: IT-M03-45-QD002
主張: 事前準備後の管理画面では A・B の順で、B の「上移動」により公開側が B・A になる。
実際: シードはCSVで A=30・B=20 を設定するが、管理画面での初期並びを確認しない（`integration_test/casegen/link_pub/cases/QD_seed_data.tsv:14`）。上流設計は並べ替え確定後に「画面の並びどおり」表示順を割り当てると定めるだけで、取込後の一覧がどちらの順で開くかは定めていない（`functions/pf-eccube3/m03-45_admin_product_product_category_list.md:23-27`）。著者もこの欠落を報告している（`integration_test/casegen/link_pub/gen_QD/report.md:71`）。
判定: 前提不成立
修正案: 操作前に管理画面で A・B の順を確認できる作成手順を定める。確保できなければ、上移動を前提とするケースを外す。

### 指摘6（重大度: Minor）対象: IT-M03-11-QD001、IT-M03-13-QD001
主張: 事前準備に公開側の `/ja/` を記してよい。
実際: 両ケースの事前準備にルート名 `/ja/` がある（`integration_test/casegen/link_pub/cases/QD_test_cases.tsv:2-3`）。依頼文はルート名などの物理名を禁止している（`integration_test/casegen/link_pub/gen_QD/prompt.md:101`）。
判定: 規約違反
修正案: 「本店の日本語ページを公開している」に書き換える。
