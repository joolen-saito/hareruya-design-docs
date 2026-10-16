### 指摘1（重大度: Major）対象: IT-M03-05-CB001
主張: 「連鎖カテゴリ」を画面から作り、そのカテゴリを指定したグッズ商品11件を準備できる。
実際: シードは「カテゴリ登録の最上位」での作成を指示するが、カテゴリ登録画面はルート直下への新規登録を提供しない（`integration_test/casegen/chain_gap/cases/CB_seed_data.tsv:3`、`functions/pf-eccube3/m03-11_admin_product_product_category_register_edit.md:18`）。親カテゴリも準備されていない。さらにグッズ商品CSV取込で選べるのはサプライ・グッズ・予約グッズ・情報商材のカテゴリに限られ、「連鎖カテゴリ」が該当する根拠がない（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:38`）。
判定: 前提不成立
修正案: 利用可能な親カテゴリと、その配下に作る対象カテゴリをシードに明記する。対象カテゴリがグッズ商品CSV取込で選べることまで確認できる投入方法に書き直す。

### 指摘2（重大度: Minor）対象: IT-M03-05-CB001
主張: 指定した11行のCSVをアップロードすれば、検索対象の商品11件を準備できる。
実際: シードは買取価格を「任意の金額」とし、販売価格との大小関係を定めていない（`integration_test/casegen/chain_gap/cases/CB_seed_data.tsv:4`）。買取価格が販売価格を上回る行は取込エラーになる（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:30`）。また、取込にはヘッダ行とデータ行が必要だが、シードにはヘッダの作り方が書かれていない（同シード:4、同設計書:9,23）。
判定: 手順不備
修正案: 画面からダウンロードした雛形の見出しを使って11データ行を作り、各行の買取価格を販売価格以下の具体値に指定する。
