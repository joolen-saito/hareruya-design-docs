主張: `店頭買取/step_map.tsv:72-73` は工程 R164「買取商品入庫」を UKA-09 が通るとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:82` は「在庫変更CSVを登録し、買取商品の入庫を行う」。一方、`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭買取/scenario_list.md:26` の UKA-09 は「買取詳細の入庫済みボタンで入庫済みになり」で、CSV登録を通さない。
判定: 偽の○
修正案: R164 から UKA-09 の対応を外し、在庫変更CSV登録の工程を抜けとして示す。

主張: `店頭買取/step_map.tsv:71` は工程 R159「在庫インポート用CSVの作成」を UKA-09 が通るとし、備考では「作成自体は手順に無い」と記す。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:80` は「棚戻し業務用CSVから在庫インポート用CSVの作成を行う」。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭買取/scenario_list.md:26` の UKA-09 は入庫済みボタンと戻しリストを扱い、このCSV作成を行わない。
判定: 偽の○
修正案: R159→UKA-09 の対応を削除し、CSV作成工程の未対応を表示する。

主張: `ネット買取/factors.tsv:22-23` は値 B8-1「価格が付く」と B8-2「価格が付くかもしれない」を、表計算での仕分けとして「適用外」にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:58` はこの二種類の「商品を査定に通す」、同:59 は「MTGバイヤーを使いカードの査定作業をおこなう」とする。二つの値はシステムを使う査定へ進む条件である。
判定: 偽の対象外
修正案: B8-1・B8-2 を対象に戻し、各値を通るシナリオが無ければ抜けとして示す。

主張: `ネット買取/factors.tsv:25-26` は B9-1「スタンダード範囲」と B9-2「スタンダード範囲外」を、工程2-3の表計算による仕分けとして「適用外」にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:59` の工程2-4は「MTGバイヤーを使いカードの査定作業をおこなう」、同:60 は「ここで、カードをスタンダード範囲か範囲外か仕分けをおこなっている」とする。出典の仕分けは工程2-3ではない。
判定: 偽の対象外
修正案: B9-1・B9-2 を対象に戻し、MTGバイヤーでの査定に照らして対応または抜けを判定する。

主張: `イベント管理/step_map.tsv:16` は工程 R53「イベントバナー設定」の UTH-04 対応に「バナーは登録しない」という C1 の行を引用している。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:35` の R53 は「アップロードした画像のリンクを設定する」工程。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/UTH-04_デッキ登録からイベント開催まで/UTH-04_デッキ登録からイベント開催まで.md:85` では、その設定を行うのは C2「登録する」の水準である。
判定: 偽の○
修正案: R53 の引用を UTH-04 の C2 にあるバナー設定操作へ差し替える。

主張: `イベント管理/factors.tsv:70,73` は D14-2「親イベントの参加費を引き継ぐ」と D15-2「親イベントの定員を引き継ぐ」を「他層」にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/イベント登録から開催まで/UEH-01_有料イベントを登録し会員が申し込み決済しデッキを登録して開催する.md:30` は、日程登録で「定員・参加費・公開状態は触らない」と操作し、「初期値が親イベントの値（8・1,000円・公開）」と確認する。
判定: 偽の対象外
修正案: D14-2・D15-2 を対象に戻し、UEH-01 の日程登録手順に対応付ける。

主張: `イベント管理/cond_map.tsv:57-58` は C3-2「定員到達」と C3-3「事前予約期間外」を、同じ UEV-03 の引用でそれぞれ通過済みにしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/イベント管理/matrix_UEV-03/fl_table.tsv:3` の水準 A2 は「受付期間外・定員到達」を一つにまとめ、同 `matrix.md:15-16` の T03・T04 もその同じ水準を使う。各値を個別に設定した行は示されていない。
判定: 偽の○
修正案: C3-2・C3-3 を個別に通した根拠が示せない限り、それぞれの○を外して抜けとして表示する。

主張: `ネット買取/cond_map.tsv:21` は B10-1「職業・生年月日の両方が未登録」の根拠に「職業だけ未登録」を引用している。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-01/matrix.md:15` は「職業だけ未登録（職業欄だけ出る）」、同:16 は別水準として「職業・生年月日の両方が未登録（両方の欄が出る）」を記す。
判定: 事実の誤り
修正案: B10-1 の引用を、両方が未登録の水準を実際に通す T04 の行へ差し替える。
