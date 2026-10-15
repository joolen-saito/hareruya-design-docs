### 指摘1（重大度: Major）対象: 群 PA
主張: F04-03で登録・変更した配送先は、受注情報編集画面での確認を対象とする。
実際: F04-03は確認画面からの送信で会員の配送先を登録・更新する（`functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md:37-43,60-64`）。M08-09はその配送先を会員別の一覧に表示し、編集画面で開ける（`functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md:5-17`）。現行PAはM05-11だけを下流にしている（`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:5-7`）。既存のIT-F04-03-024もDB確認のみである（`integration_test/casegen/all_test_cases.tsv:1958`）。
判定: 取りこぼし
修正案: F04-03で配送先を新規登録し、M08-09の一覧と編集画面で対象を確認するIT-0332を追加する。登録値と変更後の値を同画面で照合するIT-0333も追加する。

### 指摘2（重大度: Major）対象: 群 PA
主張: シードの「ゆうパック・EMSと、郵便振替・銀行振込が有効」という準備で、各ケースの配送方法と支払方法を選べる。
実際: 配送方法の保存には支払方法を1件以上選ぶ必要があり、保存時にその対応が作られる。新規配送方法の商品種別は先頭のものが初期設定される（`functions/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.md:13-30`）。PAの環境シードは、配送方法ごとに選ぶ支払方法も、ケース商品に合う商品種別も指定していない（`integration_test/casegen/link_pub/cases/PA_seed_data.tsv:2-3`）。このままでは注文手順で選択肢が揃う前提を確定できない。
判定: 前提不成立
修正案: ゆうパックと郵便振替、EMSと銀行振込の対応を配送方法設定で登録する手順と、各配送方法に紐づける商品種別をシード・事前準備に明記する。

### 指摘3（重大度: Major）対象: IT-F04-02-PA002
主張: 公開側で300ポイントを使うと、受注情報編集の「値引き」が300円になる。
実際: 公開側は「ポイント使用（値引き）」への反映を定める（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1727`）。管理画面には「値引き」と「ポイント使用」が別項目としてある（`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3160,3300`）。両項目が同じ300になる対応規則は、ケースの出典に挙げた記述から確認できない（`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:3`）。
判定: 推測による接続
修正案: 「値引きが300円」を期待結果から外し、根拠のある「ポイント使用が300」を残す。値引き欄も判定するなら、対応規則のある設計箇所を出典に加える。

### 指摘4（重大度: Minor）対象: 群 PA
主張: 報告書の集計と評価表は、PAの現行成果を示す。
実際: 冒頭は9件、IT-0332が1件、F04-04の出荷指示ケースを採用済みと記す（`integration_test/casegen/link_pub/gen_PA/report.md:3-20`）。末尾ではそれらを削除して6件・IT-0332は0件と記す（同`:72-78`）。現行ケースも6件である（`integration_test/casegen/link_pub/cases/PA_test_cases.tsv:2-7`）。
判定: 規約違反
修正案: 冒頭の件数・組ごとの評価表・対応表を現行6件に更新し、旧ケースの記述を除く。
