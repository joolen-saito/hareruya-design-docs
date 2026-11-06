主張: `matrix_UNK-04/README.md:16` は、オンライン本人確認済みと簡易書留確認済みを因子Dの同じ水準にまとめ、「検査でも画面でも同じ扱い」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:1463` は入金CSVの「オンライン本人確認区分」に両者を別の値として定める。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:470` も状態名をCSV用に取得する。UNK-04の終点に含むCSVの期待値が変わる。
判定: 事実の誤り
修正案: 因子Dの確認済み2種類を分け、入金CSVの値をそれぞれ確かめる。

主張: `scenario_list.md:29` のUNK-14は、期限切れバッチの対象と遷移をオンライン本人確認済み・簡易書留確認済みの2種類だけとしている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:150-153` は「身分証有効期限日が対象日以前」だけで抽出する。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/IdentificationUpdateAction.php:75-79` は再申請時に状態を確認中へ変え、有効期限を消さない。したがって期限が残る確認中の会員も対象となり、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/IdExpireNotificationAction.php:55-62` により未確認へ変わる。
判定: 事実の欠落
修正案: UNK-14に、再申請後の確認中→未確認の分岐を加える。

主張: `scenario_list.md:102` は、オンライン本人確認の撮影・同意による提出が無いと「買取の身分証明書も登録されないので振込依頼済みにできない」とする。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:240-246` では買取情報の身分証明書を管理画面で独立して選べる。`同:381-385` の振込依頼済みの検査はその欄が未登録かだけを見る。オンライン申請が無くても、この欄を登録すれば金額1万円未満の検査は通る（`同:388-392`）。
判定: 事実の誤り
修正案: 提出が無い場合の申請停止と、買取情報の身分証明書欄の登録可否を別の結論として書く。

主張: `scenario_list.md:101` は、登録情報と身分証が合わない場合の参照先を「UNK-02のC3」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-02/fl_table.tsv:7` では、R5で問題ありをC2にまとめており、C3は存在しない。
判定: 事実の誤り
修正案: 参照先をC2に直す。
