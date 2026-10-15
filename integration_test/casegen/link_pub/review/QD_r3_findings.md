### 指摘1（重大度: Major）対象: IT-M03-13-QD003
変更: 追加ケース
主張: シードの商品は「予約商品でない」ため、タグ指定のネット買取商品一覧に表示できる。
実際: 商品は購入グループ「通常商品」を参照するが、そのグループの予約商品フラグの値は共有シードにも投入方法にもない（`integration_test/casegen/link_pub/cases/QD_seed_data.tsv:11,13`）。買取一覧は予約商品でない商品に絞り、購入グループのフラグが立つ商品を表示しない（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1689`、`excel_to_html/output/0204_基本設計仕様書(商品管理).html:5310`）。手順1・4で一覧を開ける前提を作れていない（`integration_test/casegen/link_pub/cases/QD_test_cases.tsv:7`）。
判定: 前提不成立
修正案: S-M03-13-QD-GOODSMASTER に「購入グループ『通常商品』の予約商品フラグ=0」を加え、投入時にその値を設定・確認する。

### 指摘2（重大度: Minor）対象: IT-M03-13-QD003
変更: A（2巡目の反映）
主張: QD003を追加し、報告書の組ごとの評価にも採用として載せた。
実際: QD003は評価表にあるが、採用ケースごとに求められる対応表と到達可能性表から抜けている（`integration_test/casegen/link_pub/gen_QD/report.md:19,30-40,53-61`、`integration_test/casegen/link_pub/gen_QD/prompt.md:153-155`）。
判定: 反映不備
修正案: 対応表に「説明(日)」と買取一覧上部のタグ説明文の対応を、到達可能性表にQD003の表示条件・シードを追記する。
