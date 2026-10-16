### 指摘1（重大度: Major）対象: IT-M13-12-RI001、IT-M13-12-RI002、IT-M13-02-RI001
主張: 申込登録後にイベント申込詳細・編集画面へ遷移し、そこで申込IDを控えられる。
実際: 刷新側の画面遷移図は登録後の遷移先を「イベント申込登録」とする（`excel_to_html/output/0214_基本設計仕様書(イベント管理).html:3231-3238`）。機能設計書の刷新後メッセージもイベント申込検索画面への遷移を記す（`functions/pf-eccube3/m13-12_admin_event_event_entry_register.md:60`）。3件の番号取得手順は遷移先の前提が成立しない（`integration_test/casegen/link_flow/cases/RI_test_cases.tsv:8-9`、`integration_test/casegen/link_flow/cases/RI_seed_data.tsv:4`）。
判定: 手順不備
修正案: RI001・RI002の不要な申込ID取得を削る。M13-02-RI001のシードは、登録後にイベント申込検索で対象を探し、画面に表示された申込IDを控える手順に直す。

### 指摘2（重大度: Minor）対象: IT-M13-12-RI002
主張: RI001とは別に、申込登録後の一括削除用チェックボックスの変化を1ケースとする。
実際: RI001・RI002はともに「同じ日程へ申込を1件登録→イベント編集の日程一覧を再表示」の判定で、確認項目だけが申込人数とチェックボックスで異なる（`integration_test/casegen/link_flow/cases/RI_test_cases.tsv:8-9`）。依頼文は同じ組の登録・表示を原則1件とし、項目違いで増やさないと定める（`integration_test/casegen/link_flow/gen_RI/prompt.md:104-105`）。
判定: 重複
修正案: RI002を削除し、必要ならチェックボックスの確認をRI001の同じ表示判定にまとめる。

### 指摘3（重大度: Major）対象: RI
主張: M13-02→M13-10は申込検索と同種の表示なので、ケースを作らなかった。
実際: 報告自体が申込詳細・編集のイベント名表示を認めている（`integration_test/casegen/link_flow/gen_RI/report.md:23`）。イベント編集はイベント名を更新でき（`excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1434,1470`）、別責務のイベント申込詳細・編集には「イベント名」の表示項目がある（同`:2889,2904`）。`all_test_cases.tsv` にこの上流操作から同画面を確認する既存ケースはない。申込検索を採用した理由（`report.md:9`）とも整合しない。
判定: 取りこぼし
修正案: 既存申込の詳細画面でイベント名を確認し、M13-02でイベント名(日)を更新して詳細画面を開き直す1ケースを追加する。

### 指摘4（重大度: Minor）対象: IT-M13-13-RI001
主張: CSVは「取込設定に合わせた」区切り文字で作れば取り込める。
実際: `.csv` の区切り文字は設定値で決まる（`functions/pf-eccube3/m13-13_admin_event_event_entry_csv_import.md:23-25`）。このケースの事前準備とシードは設定値も設定操作も定めず、「取込設定に合わせる」とだけ記す（`integration_test/casegen/link_flow/cases/RI_test_cases.tsv:10`、`integration_test/casegen/link_flow/cases/RI_seed_data.tsv:17`）。既存のM13-13ケースは区切り文字をカンマに設定する前提を明記している（`integration_test/casegen/cases/M13-13_test_cases.tsv:33`）。
判定: 前提不成立
修正案: 事前準備で取込区切り文字をカンマに設定し、シードのCSVをカンマ区切りで作ると明記する。
