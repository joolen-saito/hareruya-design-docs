# product_goods_csv_import（m03-27 商品(goods) CSV取込）スケルトン

card_csv_import と同じ規約でシナリオ別ファイルを用意する。**実必須列・実ヘッダは実装を正**とする。

- 正典: `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php` と対応 `Service/Csv/*`。
  ルート・フォームフィールド・必須列・判定順序を実装から確認してから作成する（創作しない）。
- 成功系(valid.csv)が参照する商品/価格/在庫は `../../seed/sets/m03/`（SEED-M03-GOODS/-PRICE）で用意する。
- 揃えるシナリオ（card と同じ）: valid / header_mismatch / empty_data / column_count_mismatch /
  missing_required_* / master_not_found(該当あれば) / oversize / invalid_mime。

現状は雛形（未生成）。card_csv_import/lib/gen-card-fixtures.mjs を雛形に、goods用の HEADER と必須列で複製する。
