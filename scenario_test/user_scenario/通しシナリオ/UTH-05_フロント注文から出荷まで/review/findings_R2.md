主張: `matrix_UTH-05/matrix.md:38-47` の店頭受取系 T25〜T34 は、因子Eを「自社で梱包し、集荷に渡す」（E1）としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:60-75` は、店舗で「注文商品をピッキングする」「商品引き渡し」と定める。店頭受取系に集荷へ渡す工程はない。
判定: 事実の誤り
修正案: 店頭受取系には店舗でピックして引き渡す水準を設け、該当行のE1を置き換える。

主張: `matrix_UTH-05/matrix.md:40-47` の T27・T28・T30・T31 は、店頭受取系でポイントを一部または全額使う行になっている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:118-122` は店頭受取系をポイント利用不可と判定し、同:564-608 は利用欄の代わりに案内文を表示する。これらの行は新実装の注文画面から開始できない。設計書との差は成果物にも記録されているが、試験行の成立には反映されていない。
判定: 禁則の誤り
修正案: 店頭受取系のポイント使用行を実行可能な行から外し、設計書との食い違いとして残す。

主張: `matrix_UTH-05/exceptions.tsv:3-4` の EX2 は「S6 F3」、EX3 は「S4 F3」にだけ未入金の期限対応を差し込む。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:39-41` はコンビニ決済・郵便振替・銀行振込を入金手続きの対象とし、同:125-130 は支払方法や出荷指示の前後を限定せず「準キャンセルは受注の5日後」「キャンセルは受注1週間後」と定める。
判定: 事実の欠落
修正案: EX2・EX3 の差し込み条件を、未入金で期限を迎える三つの支払方法とF2・F3の該当行を覆うように直す。

主張: `matrix_UTH-05/exceptions.tsv:5,7` の EX4・EX6 は支払方法だけを条件にしながら、差し込む手順を「出荷指示を作ったあと」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3568` は出荷指示リストの対象を「出荷指示リスト除外フラグ」がオフの配送方法に限る。成果物の `matrix_UTH-05/README.md:19` も A7〜A9 は出荷指示の工程を通らないと定めるが、EX4の条件S1はA8、EX6の条件S3はA7・A8にも一致する。
判定: 事実の欠落
修正案: EX4・EX6 に宅配の配送方法を条件として加え、店頭受取系の取消はその経路に合う位置へ差し込む。

主張: `matrix_UTH-05/exceptions.tsv:13` の EX12 はA7だけが条件だが、`UTH-05_会員がフロントで注文し通販チームが受注を確認して在庫を引き当てピッキングし出荷して出荷完了メールが届きポイントがつく.md:72` はA8の代表行T29で印刷失敗時にEX12を参照する。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:80-106` は印刷失敗を記録して状態更新を飛ばし、成功時にピック中へ更新する。A8でも成立する例外だが、EX12の条件ではT29に差し込まれない。
判定: 事実の欠落
修正案: 自動印刷の失敗をA8にも差し込み、L4の参照と割当先を一致させる。

主張: `matrix_UTH-05/exceptions.tsv:13` の EX12 は、受注一覧からの手動印刷が失敗した場合も「対応状況は変わらず」「成功の結果でピック中」と期待している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:2313` は「受注のステータスが注文受領である場合はピック中に変更し」と定める。新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:51-58` も印刷予約時にピック中へ更新するため、後の印刷失敗で注文受領のままにはならない。
判定: 事実の誤り
修正案: EX12を自動印刷と手動印刷に分け、手動印刷では予約時の状態更新を期待値にする。

主張: `matrix_UTH-05/exceptions.tsv:15` の EX14 はA8 S1だけを条件にする一方、L4の `UTH-05_会員がフロントで注文し通販チームが受注を確認して在庫を引き当てピッキングし出荷して出荷完了メールが届きポイントがつく.md:74` は登録済みカード決済のT29でもEX14を参照する。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:65-70` はスムーズ店頭受取の取り置き期間を14日とし、超過後の返金・キャンセルを支払方法S1に限定していない。T29はS2なので、現在のEX14は差し込まれない。
判定: 事実の欠落
修正案: EX14を登録済みクレジットカード決済の行にも差し込める条件に直す。
