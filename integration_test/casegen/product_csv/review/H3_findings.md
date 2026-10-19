### 指摘1（重大度: Major）対象: M04-17 S-M04-17-TEXT-002
主張: 書き直しでは、TEXT-CODE-002 の商品コードを「TEXT-M0417-002-CODE」でCSV登録し、元のシードにあった「針M0417」を含むコードへの変更を省いている（`integration_test/casegen/product_csv/out/M04-17.tsv:2`）。
実際: 元のシードは商品コードを「TEXT-M0417-002-CODE 針M0417」に設定する。ケースは「針M0417」で商品コードを部分一致検索し、TEXT-CODE-002 も表示されることを期待している（`integration_test/casegen/product_csv/in/M04-17.tsv:2`、`integration_test/casegen/cases/M04-17_test_cases.tsv:2`、`integration_test/casegen/datapattern/units/M04-17/design.txt:L0104-L0105`）。
判定: 再現しない
修正案: CSV登録後、元のシードどおり対象規格の商品コードに「針M0417」を含めてから在庫履歴を作る。
