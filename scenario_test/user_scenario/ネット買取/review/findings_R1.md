主張: `hareruya-design-docs/scenario_test/user_scenario/ネット買取/scenario_list.md:33-34` のパターン2・3は、備考で工程を割り当てた UNK-09、UNK-03・UNK-04 を「シナリオ」欄から漏らしている。
実際: `hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:82` は2-17を「カード仕入れ業務へ」、同:86は3-1を「2-1から2-10までは同じ業務」とする。成果物自身も2-17をUNK-09、3-1をUNK-03・UNK-04の工程としている。
判定: 事実の欠落
修正案: パターン2にUNK-09、パターン3にUNK-03・UNK-04を加え、備考とシナリオ欄を一致させる。

主張: `hareruya-design-docs/scenario_test/user_scenario/ネット買取/scenario_list.md:33,41-42` は、2-4「カード査定作業開始」をシステムの外としている。
実際: `hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:58-60` は「MTGバイヤーを使いカードの査定作業をおこなう」と記す。`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1315` も「MTGBuyerで査定を開始したり、中断した際にステータス変更を行うAPI」とする。
判定: 事実の誤り
修正案: 2-4のMTGバイヤーによる査定開始はUNK-03のシステム操作に含め、システムの外とするのはカードの仕分けだけに直す。

主張: `hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-01/README.md:21` は、職業か生年月日の片方だけが未登録のケースを組み合わせに入れないとしている。
実際: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2202-2203` は、職業を「職業が未登録の場合に表示する」、生年月日を「生年月日が未登録の場合に表示する」と個別に定め、表示時は各欄を入力必須としている。
判定: 事実の欠落
修正案: UNK-01の職業・生年月日の因子に、片方だけ未登録の2水準を加える。

主張: `hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-04/matrix.md:15,24-26` のT03・T12〜T14は、まとめて買取を含まないB3と、まとめて買取の価格下限未満カードを選ぶF1・F2を組み合わせている。T12は例外E5の差し込み先にもなっている。
実際: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2645` は「まとめて買取に該当する明細が1件も無いときは、…価格下限未満のカードをすべて売却するかどうかの選択を表示しない」とする。
判定: 禁則の誤り
修正案: B3とF1・F2を禁則にして行を再生成し、E5を選択欄が表示される行へ差し込む。

主張: `hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-04/matrix.md:14` のT02は「全部の明細を売却する」C1と「価格下限未満のカードを売却しない」F2を同時に指定している。
実際: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2614` の選択欄は「500円未満のカードをすべて売却する」であり、成果物の `matrix_UNK-04/fl_table.tsv:16` はF2をそのカードを売却しない水準と定義している。
判定: 禁則の誤り
修正案: C1とF2を禁則に加え、全部売却の行では価格下限未満のカードも売却する条件にする。

主張: `hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-04/fl_table.tsv:4-6` の「明細の種類」B1〜B3には、まとめて買取だけの買取が無い。
実際: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1523` は「まとめて買取商品の詳細画面へ遷移する」とし、同:2232は申込の前提を「買取カートに商品があり」とする。えらんで買取商品の同時購入は条件にしていない。
判定: 事実の欠落
修正案: UNK-04の明細の種類に「まとめて買取だけ」を加え、承諾時の組み合わせを再生成する。
