### 指摘1（重大度: Major）対象: M03-10 S-M03-10-SMAREGI-038、S-M03-10-SMAREGI-039
主張: 書き直しでは「カード指定 >」でカードを選び、商品カテゴリを単体カードへ変更する（[out/M03-10.tsv:34](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/out/M03-10.tsv:34)、[35](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/out/M03-10.tsv:35)）。
実際: 元のシードはカードを指定しないグッズ商品で、両ケースも「シングルカード以外（グッズ）」を前提とする（[in/M03-10.tsv:34](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/in/M03-10.tsv:34)、[35](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/in/M03-10.tsv:35)、[ケース:34](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M03-10_test_cases.tsv:34)、[35](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M03-10_test_cases.tsv:35)）。
判定: 再現しない
修正案: カード指定と単体カードへのカテゴリ変更を削除し、グッズ商品のまま必要な割引率などを編集する。

### 指摘2（重大度: Major）対象: F01-02 S-F01-02-CASE-062、S-F01-02-L-SET-071
主張: 書き直しではカードを指定した後、同じ商品編集画面で目的のカードセットを選ぶ（[out/F01-02.tsv:45](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/out/F01-02.tsv:45)、[48](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/out/F01-02.tsv:48)）。
実際: 設計書はシングルカードのカードセットを参照のみとし、編集不可としている（[M03-02/design.txt:60](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/M03-02/design.txt:60)、[74](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/M03-02/design.txt:74)）。両ケースは商品が指定のカードセットに所属することを前提とする（[ケース:58](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/F01-02_test_cases.tsv:58)、[65](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/F01-02_test_cases.tsv:65)）。
判定: 手順不備
修正案: 取込時にグッズ商品CSVの「カードセット(ID)」列へ目的のIDを入れ、カード指定後にカードセットを編集する手順を削除する（[M03-27/design.txt:225](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/M03-27/design.txt:225)）。
