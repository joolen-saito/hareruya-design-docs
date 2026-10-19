### 指摘1（重大度: Major）対象: M03-25 S-M03-25-UNIT-003、S-M03-25-UNIT-005、S-M03-25-NONE-006、S-M03-25-NONE-007、S-M03-25-UNIT-011

主張: グッズ商品CSVで作った商品を既存の商品の編集画面で開き、「この商品の規格を確認」を押して商品規格一覧へ進む（`integration_test/casegen/product_csv/out/M03-25.tsv:2`〜`:6`）。

実際: 商品登録編集画面から商品規格一覧へ進むボタンは「規格設定」（`integration_test/casegen/datapattern/units/M03-02/design.txt` L0116）。記載されたボタンでは手順を進められない。

判定: 手順不備

修正案: 5行とも「この商品の規格を確認」を「規格設定」に直す。
