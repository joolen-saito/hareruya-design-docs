### 指摘1（重大度: Major）対象: M03-03 S-M03-03-PAGING-011
主張: CSVで11商品を作り、各商品のカテゴリを編集して「商品を登録」を押す（integration_test/casegen/product_csv/out/M03-03.tsv:9）。
実際: 編集画面では割引率の選択が必須だが、この手順には選択操作がない。グッズ商品CSVにも割引率の列はない（integration_test/casegen/datapattern/units/M03-02/design.txt:147、integration_test/casegen/datapattern/units/M03-27/design.txt:194）。
判定: 手順不備
修正案: 11商品の編集時に、登録済みの販売割引率を選んでから保存する。

### 指摘2（重大度: Major）対象: M03-03 S-M03-03-PAGING-012
主張: CSVで11商品を作り、各商品のカテゴリを編集して「商品を登録」を押す（integration_test/casegen/product_csv/out/M03-03.tsv:10）。
実際: 同じく割引率の選択がなく、編集画面の必須項目を満たす手順になっていない（integration_test/casegen/datapattern/units/M03-02/design.txt:147、integration_test/casegen/datapattern/units/M03-27/design.txt:194）。
判定: 手順不備
修正案: 11商品の編集時に、登録済みの販売割引率を選んでから保存する。
