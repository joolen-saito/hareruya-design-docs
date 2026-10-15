### 指摘1（重大度: Major）対象: IT-M03-45-QD002
主張: 管理画面の2行目を上移動すれば、公開側の子カテゴリの並びが操作前の逆順になる。
実際: シードは公開側の表示順を A=30、B=20 とするが、管理画面の初期並びを定めていない（`integration_test/casegen/link_pub/cases/QD_seed_data.tsv:13`）。上流設計は確定時に「画面の並びどおり」表示順を割り当てると定め、下流は表示順の降順で表示する（`functions/pf-eccube3/m03-45_admin_product_product_category_list.md:23-27`、`functions/pf-eccube3/f03-04_front_product_product_category_list.md:5-7`）。管理画面が初めから B・A なら、2行目の上移動で公開側が A・B のままになる可能性がある（`integration_test/casegen/link_pub/cases/QD_test_cases.tsv:8`）。
判定: 前提不成立
修正案: 操作前に管理画面も A・B の順であることを確認し、その状態を作る手順をシードに記す。

### 指摘2（重大度: Major）対象: IT-M03-22-QD001
主張: 購入グループの予約商品フラグを0から1に変え、買取一覧から商品が消える確認を IT-0150 とする。
実際: ケースが確認するのは登録値そのものの表示ではなく、フラグを参照した検索結果の切替である（`integration_test/casegen/link_pub/cases/QD_test_cases.tsv:5`）。上流設計も「フラグが立っている購入グループの商品は表示させない」と定める（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:5294-5296`）。設定値を参照する別機能の挙動切替は IT-0337 の範囲であり、群の依頼文も IT-0150 から除いている（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:338`、`integration_test/casegen/link_pub/gen_QD/prompt.md:65-68`）。
判定: 範囲外
修正案: QD から外し、必要なら IT-0337 の連携ケースとして扱う。

### 指摘3（重大度: Major）対象: IT-M03-11-QD001、IT-M03-13-QD001・QD002、IT-M03-22-QD001
主張: 修正後のグッズ商品CSVシードには、作成に必要な値が具体的に揃っている。
実際: 4件とも必須の「商品名(英)」を「商品名(日)と同じ英数字の値」としており、投入する値が決まっていない。さらに既存カテゴリID `2,12,27,177` と購入グループ「通常商品」を参照するが、それらの状態・作成方法を使用シードに含めていない（`integration_test/casegen/link_pub/cases/QD_seed_data.tsv:3,5-6,8`）。商品名（日英）、商品カテゴリ、購入グループ名称はCSVの必須項目である（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:50-63`）。ケース単独で値付きの事前準備を整える規約も満たさない（`integration_test/casegen/precond/README.md:23-27`）。
判定: 規約違反
修正案: 各英語名を具体値で指定し、参照するカテゴリと購入グループを画面から用意するシード、または値と存在条件を明記した共有シードを追加する。

### 指摘4（重大度: Major）対象: 群 QD
主張: M03-13→F05-03 は、タグの「説明(日)」と買取一覧の「タグに登録された説明文」が同じ項目と言えないため不採用とする。
実際: 上流のタグ登録には「説明(日)」があり、下流の F05-03 はタグが1件指定された場合に「そのタグに登録された説明文」を一覧上部へ表示すると定める（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:4345`、`functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md:14-16`）。報告は、上流が商品検索ページでの用途も記すことだけを理由に、このタグ説明文の連携を落としている（`integration_test/casegen/link_pub/gen_QD/report.md:19`）。既存の IT-M03-13-032 は商品検索ページの説明文を確認するケースで、買取一覧は確認しない（`integration_test/casegen/all_test_cases.tsv:4377`）。
判定: 取りこぼし
修正案: 日本語のタグ説明文を管理画面で更新し、タグを1件指定したネット買取商品一覧の上部表示が操作前後で変わるケースを追加する。

### 指摘5（重大度: Minor）対象: 群 QD
主張: 報告書の作成数は8件で、M03-41には2件ある。
実際: 現行のケースファイルは7件で、M03-41 は QD001 の1件だけである（`integration_test/casegen/link_pub/cases/QD_test_cases.tsv:2-8`）。報告書には削除済みの M03-41-QD002 が件数表・評価表・対応表に残る（`integration_test/casegen/link_pub/gen_QD/report.md:5-10,24,39`）。
判定: 規約違反
修正案: 報告書の件数と各表を現行7件に合わせ、削除済みケースの記述を除く。
