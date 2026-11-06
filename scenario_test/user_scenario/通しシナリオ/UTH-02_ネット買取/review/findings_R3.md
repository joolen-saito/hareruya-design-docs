主張: `scenario_list.md:18` は UTH-02 の終点までに、お客様が査定承諾メールを受けると記している。  
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:118` の「`sendBuyOrderAssessmentApprovalMail`」はお客様の承諾処理で呼ばれる。成果物の `UTH-02_ネット買取の申込から入庫まで通す.md:93` も、自動承諾では「査定承諾メールは届かない」とする。  
判定: 事実の誤り  
修正案: 終点のメール期待値を「お客様が承諾した行では査定承諾メールを受ける」と限定する。

主張: `matrix_UTH-02/fl_table.tsv:29-30` の因子Jは、職業・生年月日が「両方登録済み」か「両方未登録」の2水準だけである。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取機能).html:2202-2203` は、職業と生年月日の各欄について個別に「未登録の場合に表示する」と定める。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/fill.twig:192-211` も各欄を別々に表示判定する。片方だけ未登録なら表示と必須入力が変わる。  
判定: 事実の欠落  
修正案: 職業だけ未登録、生年月日だけ未登録の水準を加え、マトリクスに割り当てる。

主張: `UTH-02_ネット買取の申込から入庫まで通す.md:68` は、代表行T10の履歴に「未登録在庫あり」が残るとする。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:1803-1804` は、振込完了時に個別入力商品の実在庫がすべて登録済みなら「入庫待ち」、そうでなければ「未登録在庫あり」と定める。T10は個別入力商品なし（同L4:8）。  
判定: 事実の誤り  
修正案: T10の履歴から「未登録在庫あり」を外し、H2の行だけに期待する。

主張: `UTH-02_ネット買取の申込から入庫まで通す.md:49` は、買取商品一覧CSVを受ける「ネット買取仕入れ」を `USH-01` とする。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/scenario_list.md:34-35` は、パターン1「ネット買取仕入れ」を対象外とし、`USH-01` をパターン2「仕入れ統合作業（アルバイト）」に割り当てる。  
判定: 事実の誤り  
修正案: CSVを仕入れ業務へ渡す終点を記し、ネット買取仕入れの参照IDとしての `USH-01` は外す。
