### 指摘1（重大度: Major）対象: F04-04 S-F04-04-UNLIM-050
主張: 書き直しは在庫100を入庫した後、DBで在庫数を1にするが、在庫無制限は設定しない（`integration_test/casegen/product_csv/out/F04-04.tsv:33`）。
実際: 元のシードは在庫無制限を指定する（`integration_test/casegen/product_csv/in/F04-04.tsv:33`）。ケースは「在庫無制限・在庫数1」で数量3を注文し、在庫エラーにならないことを確かめる（`integration_test/casegen/cases/F04-04_test_cases.tsv:45`）。CSVと規格画面に在庫無制限を設定する項目はない（`integration_test/casegen/datapattern/units/M03-27/design.txt:L0194–L0238`、`M03-09/design.txt:L0138–L0155`）。
判定: 再現しない
修正案: この行は「直せない」とし、在庫無制限が必要なケースに影響することを理由に記す。
