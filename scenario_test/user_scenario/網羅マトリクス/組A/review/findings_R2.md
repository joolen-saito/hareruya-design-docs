主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/店頭受取受注管理/step_map.tsv:5-12,48-55` は、R29・R86・R158・R219「スタック用紙読込」に、印刷やピック完了を扱う UEX-14〜16・UOR-01 を対応付けている。
実際: `hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:30,58,87,113` の作業は「スタック用紙のQRコードをタブレットで読み込み、対象の受注情報を確認する」。`hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/scenario_list.md:135` も、QR読込による状態変更は設計書に記述がないと明記する。引用された印刷・ピック完了の文はQR読込操作を通さない。
判定: 偽の○
修正案: 4工程について印刷・ピック完了を根拠にした対応を外し、QR読込操作の抜けとして示す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/通販/step_map.tsv:12,17,50,68` は、R104・R195・R513 の台帳更新を UTS-16・UTS-17・UTS-08 が通るとしている。
実際: `hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:31` は「発送管理台帳の入金日の更新はシステムの外」、同`:23` は「発送管理台帳（システムの外）に委託の印を付ける」と明記する。これらの引用はシステム操作の対応根拠にならない。
判定: 偽の○
修正案: 台帳更新の対応を外し、該当工程をシステムの外として扱う。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/店頭受取受注管理/factors.tsv:39-40` は、D6-3「店頭受取・ついで買いあり」と D6-4「複数受注の統合」を「他層」としている。
実際: `hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:115` は USM-01 で「複数持ち込みは統合した1件」とし、ついで買いも購入パターンに含める。`hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/matrix_USM-01/matrix.md:19-20` には「パターン3：店頭受取・ついで買いあり」の試験行がある。
判定: 偽の対象外
修正案: D6-3・D6-4を対象に戻し、USM-01の該当行に対応付ける。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/店頭受取受注管理/factors.tsv:42-45` は、印刷対象 D7-1・D7-2 と印刷内容 D8-1・D8-2 を「他層」としている。
実際: `hareruya-design-docs/scenario_test/user_scenario/外部連携/scenario_list.md:127` の UEX-16 は、店頭受取・スムーズ店頭受取それぞれの印刷対象条件と「合計金額（スムーズ店頭受取は『スムーズ店頭受取』）」という印刷内容を確認対象にしている。
判定: 偽の対象外
修正案: D7-1・D7-2・D8-1・D8-2を対象に戻し、UEX-16へ対応付ける。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/店頭受取受注管理/factors.tsv:31` は、D4-2「スマレジ店舗IDまたは店舗コードが未登録で連携されない」を「他層」としている。
実際: `hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:120` の USM-06 は「店舗：スマレジ店舗IDと店舗コードが設定済み／未設定（連携しない）」をバリエーションに含めている。
判定: 偽の対象外
修正案: D4-2を対象に戻し、USM-06へ対応付ける。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/通販/factors.tsv:78` の B8-1「委託できる受注」は対象だが、`通販/cond_map.tsv` に対応がなく抜けになる。
実際: `hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:23` の UTS-08 は「委託できる予約受注のCSVを出力して委託先に渡し」と明記する。
判定: 事実の欠落
修正案: B8-1を UTS-08 に対応付ける。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/通販/factors.tsv:53` の D11-1「ピック時の欠品なし」は対象だが、`通販/cond_map.tsv` に対応がなく抜けになる。
実際: `hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/UTH-05_フロント注文から出荷まで/matrix_UTH-05/fl_table.tsv:36` は、ピックの結果 H1 を「予定の数がそろう」と定めている。
判定: 事実の欠落
修正案: D11-1を UTH-05 の H1 に対応付ける。
