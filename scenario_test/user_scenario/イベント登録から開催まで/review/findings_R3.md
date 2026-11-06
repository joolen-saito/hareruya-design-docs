主張: `scenario_list.md:35` の UEH-04 は、終点にデッキ登録・完了メール・マイイベントの表示・登録デッキ1件を無条件に書く。しかし `matrix_UEH-04/matrix.md:14,16` の T02・T04 は「デッキ登録なし」。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:2127-2130` は、デッキ登録ボタンの条件を「『デッキ登録あり』にチェック」とする。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3001-3002` の一覧対象は「会員が申込したイベント」「会員がデッキを登録したイベント」。T02・T04 はどちらにも該当しない。
判定: 事実の誤り
修正案: UEH-04 の終点と通る状態をデッキ登録ありの行に限定し、T02・T04 ではデッキ・メール・一覧行が生じないと書く。

主張: `UEH-01_*.md:21,91,94` と `UEH-02_*.md:21,68,71` は、デッキ登録締切を当日19:00、開始を20:00としたまま、B2 の行では開催日の工程3-6でデッキ登録すると書く。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:64,69` は「3-3 イベント実施」の後に「3-6 デッキ登録」を置く。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:2130` は登録ボタンの条件を「現在日時が『デッキ登録締め切り』の日時より以前」とする。記載された時刻のままでは B2 の当日登録を実行できない。
判定: 事実の欠落
修正案: B2 で当日登録する行には、工程3-6の実施時刻より後の締切を設定する手順を明記する。

主張: `matrix_UEH-02/fl_table.tsv:11` の E2（海外住所）は、設計書・引用をともに「同上」とし、直前の D2（表示言語）の根拠を参照している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:1941` の引用は「表示ブラウザの言語設定によって項目を出し分ける」で、会員住所によるメール言語を定めない。住所による言語選択を記す `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1285-1286` も、対象は注文メールの再送である。
判定: 事実の誤り
修正案: E2 の「同上」をやめ、デッキ登録完了メールについて確認した新実装と、設計書には定めがない旨を E2 自身に記す。
