### 指摘1（重大度: Major）対象: M05-18 S-M05-18-BASE-001、S-M05-18-SHIPPING-DATE-003、S-M05-18-STATUS-004、S-M05-18-ORDER-NO-RANGE-005、S-M05-18-ORDER-NO-RANGE-006、S-M05-18-ORDER-DATE-RANGE-007、S-M05-18-ORDER-DATE-RANGE-008、S-M05-18-ORDER-SUB-009、S-M05-18-MULTI-SHIPPING-010、S-M05-18-BASE-012、S-M05-18-BASE-013、S-M05-18-BASE-014、S-M05-18-MISSING-TYPE-016、S-M05-18-L-ORD-018、S-M05-18-DP-MULTI-020、S-M05-18-DP-MIXED-021、S-M05-18-DP-MIXED-022、S-M05-18-RE-ORD-023
主張: 理由欄は、元の無制限在庫の代わりに100件を入庫して承認すると説明しているが、新しい投入方法には入庫・承認の手順がない（`integration_test/casegen/product_csv/out/M05-18.tsv:2`〜`:20`）。
実際: 元の各シードは商品登録時に在庫数無制限を指定し、その商品を購入して注文を作る。グッズ商品CSVで新規作成した規格の在庫は0件となる（`integration_test/casegen/product_csv/in/M05-18.tsv:2`〜`:20`、`integration_test/casegen/datapattern/units/M03-27/design.txt:L0129`、`integration_test/casegen/cases/M05-18_test_cases.tsv:2`）。
判定: 再現しない
修正案: 各商品の購入手順より前に、対象商品コードを本店のEC-CUBE在庫へ十分な数量入庫し、別の承認権限を持つメンバーが承認する手順を新しい投入方法に加える。
