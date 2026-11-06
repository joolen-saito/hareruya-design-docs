主張: 通販/step_scope.tsv:43-44 は、16のR445・R484（10-7・11-7）を「システムの外」としている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:185-186,200-201 では、両工程とも集荷に続けて「出荷インポートを行い出荷処理を完了」とある。
判定: 偽の対象外
修正案: R445・R484を対象に戻し、出荷インポートを通るシナリオとの対応を確認する。

主張: 通販/step_map.tsv:36 は、16のR417（10-2「受注データ確認作業」）にUTS-06の「対応する予約受注を検索して出力する」で○を付けている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:177-178 は「配送用のCSVの全項目をダウンロード」「受注時のコメントやショップ用メモ」を確認する工程。/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:21 のUTS-06は予約受注の検索・出力までしか記していない。
判定: 偽の○
修正案: R417からUTS-06の対応を外し、この確認作業を通す記述がなければ抜けとする。

主張: 通販/cond_map.tsv:68 は、D14-1「スマレジへのポイント連携：成功」にUTS-14で○を付けている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:29 のUTS-14は「ポイント加算が失敗し、再連携で直す」シナリオで、起点も「スマレジ連携エラーが出る」。再連携後の成功はD14-2の失敗経路に当たる。
判定: 偽の○
修正案: D14-1からUTS-14の対応を外し、初回の連携成功を通るシナリオで判定する。

主張: 店頭受取受注管理/cond_map.tsv:18-19 は、B7-1「本店の表示・削除」とB7-2「支店の登録・削除」の全体にUOR-06で○を付けている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/scenario_list.md:21 のUOR-06はピック完了時の番号表示・登録まで。削除は同:22 のUOR-07（引き渡し後）と同:23 のUOR-08（キャンセル後）に記されている。
判定: 偽の○
修正案: B7の値を表示・登録と削除の経路に分け、各経路を通るシナリオに対応付ける。

主張: 店頭受取受注管理/factors.tsv:16,22,29 は、B5-3「1日間」、B9-2「一部支店では自動印刷されない」、D3-2「店頭PCアカウントの商品名」の出典をいずれもR13の支払方法の裁定としている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md:20 のR13は支払方法の決定である。各値の根拠は、順に /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:124「注文日を含めて1日間」、同:112「一部支店では自動印刷されない」、/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1135「店頭PCアカウントの場合: 『店頭注文: 店頭注文番号 のご注文』」にある。
判定: 事実の誤り
修正案: 3値の出典と引用を、それぞれの値を定める業務フロー・設計書の記述に直す。
