### 指摘1（重大度: Major）対象: A06-03 S-A06-03-AB-PRODUCT
主張: 書き直しでは、CSV取込後の商品規格登録編集画面で「在庫無制限にチェック」して登録する（integration_test/casegen/product_csv/out/A06-03.tsv:45）。
実際: 元のシードは在庫数無制限を指定している（integration_test/casegen/product_csv/in/A06-03.tsv:45）。設計書のExcel由来の本文では、商品規格登録編集画面で在庫数を変更できず、在庫数は表示項目とされている。在庫無制限の入力項目も画面項目定義にない（integration_test/casegen/datapattern/units/M03-09/design.txt:L0072〜L0075、L0094〜L0097、L0138〜L0141）。
判定: 手順不備
修正案: 規格編集画面でチェックする手順を除き、元のシードの在庫無制限を設定できる手段で再現する。
