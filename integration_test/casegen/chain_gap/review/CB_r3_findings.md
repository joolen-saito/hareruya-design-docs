### 指摘1（重大度: Major）対象: IT-M03-05-CB001
主張: グッズ商品CSVで11件を登録し、2ページ目から未登録の商品IDを指定できる。
実際: シードの言語、価格、商品カテゴリ、購入グループなどが「取り込める値」のままで、投入値が決まらない（`integration_test/casegen/chain_gap/cases/CB_seed_data.tsv:4`）。CSV取込には列ごとの検証と価格の整合判定があり（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:21-30,50-72`）、事前準備は値付きで書く規約である（`integration_test/casegen/precond/README.md:27`）。前巡の価格条件の修正後も、11件を再現する入力は確定していない。
判定: 前提不成立
修正案: 11行に共通する言語・価格・カテゴリ・購入グループ等の投入値を具体化し、取込後に検索結果11件を確認する手順へ書き直す。

### 指摘2（重大度: Minor）対象: IT-M03-05-CB001
主張: 参照マスター・店舗はDBシードで準備する。
実際: 投入方法は「DBシードで…登録する」だけで、画面から作れない理由がない（`integration_test/casegen/chain_gap/cases/CB_seed_data.tsv:3`）。依頼文は、DBへの直接投入を画面で作れない理由を添えた場合に限る（`integration_test/casegen/chain_gap/gen_CB/prompt.md:97-99`）。
判定: 規約違反
修正案: 画面で作る項目は画面と操作を記し、DB投入が必要な項目には画面で作れない理由を添える。

### 指摘3（重大度: Minor）対象: IT-M03-05-CB001
主張: 報告書の作成件数は0件で、CH-0142は「既存で確認済み」。
実際: 報告書の冒頭は0件・ヘッダのみと記し、判定表もCH-0142を「既存で確認済み」とする（`integration_test/casegen/chain_gap/gen_CB/report.md:5-9,19`）。現在の判定表は「作成」で、ケースファイルにはIT-M03-05-CB001が1件ある（`integration_test/casegen/chain_gap/gen_CB/chain_judgement.tsv:6`、`integration_test/casegen/chain_gap/cases/CB_test_cases.tsv:2`）。報告書後半の追記とも矛盾する。
判定: 規約違反
修正案: 報告書の冒頭の件数、連鎖判定、対応表・重複確認・到達可能性を現行の1件に合わせて更新する。
