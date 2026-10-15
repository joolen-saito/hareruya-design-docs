### 指摘1（重大度: Major）対象: IT-M16-04-QN001・IT-M16-04-QN002
主張: デッキタグの「日本語名」だけを変更すると、公開側のタグ表示が「QN001/002-タグ後」に変わる。
実際: 上流のデッキタグには日本語名と英語名が別々にある（[M15-07機能設計書:7](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m15-07_admin_deck_deck_tag_list.md:7)）。下流は「タグの名称」を表示すると定めるだけで、どちらの名称を使うか明記しない（[F09-02:50](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/f09-02_front_deck_deck_result.md:50)、[F09-06:44](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/f09-06_front_deck_deck_show.md:44)）。両ケースは日本語名だけを変更し、その値の表示を期待している（[QN_test_cases.tsv:4](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_test_cases.tsv:4)、[同:5](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_test_cases.tsv:5)）。
判定: 推測による接続
修正案: 下流が使う名称の対応を設計書で確定する。確定できるまでは、両名称を同じ変更前・変更後の値に設定して更新し、期待結果をその共通値との照合にする。

### 指摘2（重大度: Major）対象: IT-M16-04-QN001
主張: シード作成時に既存デッキを全件一括削除し、対象デッキだけがある状態を作れる。
実際: シードは他の全デッキを一括削除する（[QN_seed_data.tsv:11](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_seed_data.tsv:11)）。一括削除は記事に使われているデッキに当たると打ち切られる（[M15-03機能設計書:11](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.md:11)）。また、他ケースの専用デッキも削除し得るため、実行順にかかわらず各ケースが成立するという P1 に反する（[前提条件規約:23](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond/README.md:23)）。
判定: 前提不成立
修正案: 全件削除と「デッキは1件だけ」の前提を外す。公開側ではケース専用のプレイヤー名を検索条件に指定して対象行を特定する。

### 指摘3（重大度: Minor）対象: 群 QN
主張: 報告書の集計と組ごとの評価表が成果物を示している。
実際: ケースは4件ある（[QN_test_cases.tsv:2](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_test_cases.tsv:2)〜5）が、報告書の集計はM16-03の2件だけで、評価表にも採用したM16-04→F09-02・F09-06の行がない（[report.md:7](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QN/report.md:7)、[同:21](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QN/report.md:21)）。末尾では4件と記しており、報告書内でも食い違う（[同:64](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QN/report.md:64)）。
判定: 規約違反
修正案: 集計を4件に直し、採用した2つの組を評価表・対応表・重複確認・到達可能性に追記する。
