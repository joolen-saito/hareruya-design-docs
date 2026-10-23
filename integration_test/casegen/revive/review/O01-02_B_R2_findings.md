### 指摘（O01-02 / IT-O01-02-050）
- 主張: 「選んで買取・まとめて買取・個別入力商品情報のいずれにも査定明細が表示されない」（[ケース9行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:9)）。
- 実際: 事前準備には「選んで買取」の申込カードが1枚ある。買取情報編集画面の「選んで買取」は、その申込カードを行として表示する（[画面実装332行](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:332)、[同397行](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:397)）。設計書も選んで買取の明細を表示対象としている（[M07-03設計書9行](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md:9)）。
- 判定: 期待結果の誤り
- 修正案: 「選んで買取」欄が空という期待を外す。「いいえ」で更新しないことは、既存の申込カードの値と買取状況が変わらない形で確かめる。

### 指摘（O01-02 / IT-O01-02-051）
- 主張: 処置は「戻さない」で、成功ダイアログと画面遷移は「042の期待結果に取り込んだ」とする（[処置11行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_dispositions.tsv:11)）。
- 実際: 修正後の042は管理画面とDBの査定結果だけを期待し、ダイアログと遷移を含まない（[ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:2)）。設計書は成功時のお客様選択画面への移動と、成功ダイアログの文言を定める（[O01-02設計書L0112](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:112)、[同L0170](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:170)）。
- 判定: 処置の誤り
- 修正案: 051を直して戻し、成功ダイアログと移動先をアプリ画面で確かめる。取得要求の回数確認は外す。

### 指摘（O01-02 / IT-O01-02-077）
- 主張: 管理画面の買取情報編集画面で「査定明細が0件」とする（[ケース23行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:23)）。
- 実際: 事前準備には「選んで買取」の申込カードが1枚ある。同画面の「選んで買取」は申込カードを行として表示する（[画面実装332行](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:332)、[同397行](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:397)）。
- 判定: 期待結果の誤り
- 修正案: 管理画面で明細0件という期待を外す。更新後も既存の申込カードが事前準備の値のままであることを確かめる。
