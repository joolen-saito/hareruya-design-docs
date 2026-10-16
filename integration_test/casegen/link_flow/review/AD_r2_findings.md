### 指摘1（重大度: Major）対象: IT-A05-02-AD001、IT-A05-02-AD002
主張: シードの投入方法では、商品登録編集画面で新規商品を登録し、その後に規格を設定して購入する。
実際: 刷新後の設計は商品新規登録画面へのアクセスを禁止し、404を返すと定めている（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1550-1552`）。両シードの手順では、この禁止された画面から商品を作ろうとしている（`integration_test/casegen/link_flow/cases/AD_seed_data.tsv:5-6`）。さらに、規格のない商品では公開ステータス欄を表示せず、規格登録前に公開へ変更できない（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:8-17`）。したがって、受注の事前準備まで到達しない。
判定: 前提不成立
修正案: 両シードの商品作成手順を書き直す。例えば管理画面のグッズ商品CSV登録で、必須列を満たすケース専用商品と規格を新規登録し、取込成功を確認してから在庫無制限を設定する（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:17-25,50-70`）。
