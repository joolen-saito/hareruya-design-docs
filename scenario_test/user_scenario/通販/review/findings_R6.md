主張: `通販/scenario_list.md:31-32,75-78` の UTS-16・17 は、入金前に UTS-21 で出荷準備を済ませた受注も扱うとしているが、通る状態と遷移表には「出荷指示→入金済み」がない。
実際: `scenario_test/markdown/16_通販受注管理.md:58` は「出荷準備は入金が無くても進めており」とする。設計書 `excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3576` は対象受注を「出荷指示」に更新すると定め、新実装 `app/config/eccube/packages/order_state_machine.php:107-120` は出荷指示から入金済みへの変更を許す。コンビニ入金通知も `app/Plugin/SlnPayment42/Controller/PaymentController.php:1313-1316` で受注を入金済みにする。
判定: 事実の欠落
修正案: UTS-21のあとに入金した場合の「出荷指示→入金済み」と、その後の出荷手順をUTS-16・17および遷移表に加える。

主張: `通販/scenario_list.md:33,35-36` の UTS-18・20 は、未入金の受注を「入金待ち／注文受領」に限っており、UTS-21で出荷指示になった未入金受注を扱わない。
実際: `scenario_test/markdown/16_通販受注管理.md:58,129-130` は入金前の出荷準備と、受注5日後の準キャンセル・1週間後のキャンセルを定める。新実装 `app/config/eccube/packages/order_state_machine.php:200-212` も出荷指示からキャンセルへの変更を許す。
判定: 事実の欠落
修正案: 出荷指示になっても未入金の受注を、UTS-18・20の対象と状態の遷移に加える。

主張: `通販/matrix/exceptions.tsv:17` の E16 はコンビニ決済の30万円境界を差し込むが、`matrix.md:33,72` の差し込み先 T21 は商品金額が送料無料金額以上・Small packet上限以下で、ポイントも一部使用する行になっている。
実際: 現行実装 `pf-eccube3/app/Plugin/HareruyaEc/Entity/MtbOption.php:113-114` の上限初期値は50,000円。設計書 `excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1210` は送料無料金額以上を送料無料とし、新実装 `src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:42-61` は送料を0にする。DBダンプの `dtb_payment` はコンビニ決済の手数料0円・上限299,999円。T21では上限超過を起こせない。
判定: 事実の誤り
修正案: E16は30万円以上の商品金額を持つコンビニ決済の行へ差し込み、ポイント使用前後で上限の両側を確かめる。
