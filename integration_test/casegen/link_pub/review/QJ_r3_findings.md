### 指摘1（重大度: Major）対象: IT-M10-06-QJ001
変更: A（2巡目の反映）
主張: 東京都でサイズ空の送料行を1件だけにすれば、その行を100円から250円へ変更した結果が注文画面に表示される。
実際: ケースはサイズ空の行を指定したが、商品がその行の対象になる条件は加えていない（`integration_test/casegen/link_pub/cases/QJ_test_cases.tsv:7`、`QJ_seed_data.tsv:12`）。設計書は送料行にサイズ欄を定める一方、空欄をどの商品に適用するかは定めていない（`excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:1604`、`functions/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.md:17`）。著者の報告も、この前提が未確認と認めている（`integration_test/casegen/link_pub/gen_QJ/report.md:87`）。
判定: 期待結果の捏造
修正案: サイズ空の行と商品の適用関係を設計書で確定できるまで、このケースを削除する。

### 指摘2（重大度: Minor）対象: S-M10-15-QJ-SHOP-001（同002〜004）
変更: A（2巡目の反映）
主張: 店名略称が使用済みなら、当該店舗の略称を未使用の別の3文字に変えて登録する。
実際: 投入方法はその分岐を記した直後にも、入力値を固定の「Q01」と指示している（`integration_test/casegen/link_pub/cases/QJ_seed_data.tsv:5`）。002〜004も同じ食い違いがある（同`:6`〜`:8`）。設計書では、他店舗と重複する略称は保存できない（`functions/pf-eccube3/m10-15_admin_base_setting_setting_shop_register.md:11`〜`:13`）。
判定: 反映不備
修正案: 各シードの投入方法を「店名略称には、状態・属性で定めた未使用の3文字を入力する」に直し、衝突時に選んだ値を状態・属性と投入方法の双方へ記録する。
