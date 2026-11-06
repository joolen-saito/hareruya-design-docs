主張: M03-35「部門更新CSV登録」を「範囲外」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/09_商品登録・編集.md:83` は「CSVをアップロードし部門更新を行う」と明記する。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:123` もUSM-10の操作に「部門更新CSV登録（tobe版では不要）」を含めている。
判定: 事実の誤り
修正案: 「範囲外」を外し、現状版の工程をUSM-10で通すか「抜け（要確認）」として扱う。

主張: M03-11「カテゴリ登録/編集」を「業務の流れに出ない」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/10_商品登録・編集_tobe.md:32` は「商品カテゴリーの新規登録を行う」と記す。一方、`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:18` のUPR-01はカテゴリの指定と登録後のCSV出力を記すが、カテゴリの新規登録を通していない。
判定: 事実の欠落
修正案: カテゴリ新規登録を「抜け（要確認）」に変更し、画面登録かCSV登録かを確定してUPR-01の前段に加える。

主張: M05-02「受注情報CSV出力」とM05-04「配送CSV出力」を、UTS-08で「通る」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:204` の委託工程は「カスタム受注CSV・カスタム配送CSVそれぞれ全項目をダウンロード」と指定する。`/home/y-saito/Developments/hareruya-design-docs/functions/todo-list.md:165`〜`168` は通常出力のM05-02・04とカスタム出力のM05-03・05を別機能としている。
判定: 事実の誤り
修正案: M05-02・04のUTS-08による「通る」を取り消し、同工程の出力はM05-03・05に対応させる。

主張: M06-06「買取商品履歴全件CSV出力」とM06-07「買取商品履歴選択CSV出力」を、UKA-06でともに「通る」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/UTH-03_店頭買取/UTH-03_店頭買取の持ち込みから査定_出金_入庫_店頭陳列と棚戻しまで.md:56` の手順25は「管理画面の買取一覧で、この買取にチェックを入れ、ダウンロードの『買取商品一覧CSV』を出す」。これは`/home/y-saito/Developments/hareruya-design-docs/functions/todo-list.md:202` のM06-12であり、買取商品履歴の全件・選択出力ではない。
判定: 事実の誤り
修正案: M06-06・07の「通る」を取り消し、履歴CSVを別途使う工程があるか再判定する。
