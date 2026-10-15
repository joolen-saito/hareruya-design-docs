### 指摘1（重大度: Major）対象: IT-M15-05-QM002
主張: 管理画面で登録したデッキの内容が、公開側のデッキリスト詳細に反映される。
実際: 手順は登録から始まり、公開側で操作前の表示を確認していない（`integration_test/casegen/link_pub/cases/QM_test_cases.tsv:3`）。IT-0150 の依頼文は、公開側の表示を操作前に確認し、操作後に開き直す順序を指定している（`integration_test/casegen/link_pub/gen_QM/prompt.md:61-62`）。
判定: 手順不備
修正案: 既存デッキをケース専用シードに用意し、詳細画面の旧値を確認してから管理画面で更新し、新値を確認するケースに書き直す。

### 指摘2（重大度: Minor）対象: IT-M15-11-QM001
主張: 直近の大会の開催日が「2026/09/01」、フォーマット名が日本語名で表示される。
実際: 下流設計は開催日とフォーマット名を表示すると定めるが、開催日の表示書式とフォーマット名の言語は定めていない（`functions/pf-eccube3/f09-01_front_deck_deck_index.md:25-27`）。期待結果はその形を指定している（`integration_test/casegen/link_pub/cases/QM_test_cases.tsv:16`）。
判定: 期待結果の捏造
修正案: 書式と言語の指定を外し、登録した開催日・フォーマットが表示対象に反映されたことを確認する文にする。

### 指摘3（重大度: Major）対象: 群 QM（M15-05→F09-01）
主張: メタゲーム上位は F09-03 と同じ集計なので、F09-01 のケースは不要（`integration_test/casegen/link_pub/gen_QM/report.md:25`）。
実際: F09-01 はランキング表示対象のフォーマットについてアーキタイプ別デッキ数の上位3件を公開画面に表示する（`functions/pf-eccube3/f09-01_front_deck_deck_index.md:5-18`）。F09-03 は別画面の一覧である（`functions/pf-eccube3/f09-03_front_deck_deck_metagame.md:38-45`）。依頼文の単位は上流機能×下流画面である（`integration_test/casegen/link_pub/gen_QM/prompt.md:90`）。既存ケースにも、この管理画面登録から F09-01 を確認するケースはない。
判定: 取りこぼし
修正案: 期間内の公開大会デッキを管理画面で追加し、キャッシュの保持時間後に F09-01 の対象アーキタイプのデッキ数が変わるケースを追加する。

### 指摘4（重大度: Major）対象: 群 QM（M15-04→F09-06）
主張: F09-02 と同じ更新項目なので、F09-06 は不要（`integration_test/casegen/link_pub/gen_QM/report.md:29`）。
実際: M15-04 はアーキタイプと大会名（日本語）を一括更新できる（`functions/pf-eccube3/m15-04_admin_deck_deck_bulk_update.md:18-24`）。F09-06 の詳細画面は、その両方を情報欄に表示する（`functions/pf-eccube3/f09-06_front_deck_deck_show.md:35-43`）。既存ケースにこの操作から詳細画面を確認するものはない。
判定: 取りこぼし
修正案: 一括編集の前後で、同じデッキの詳細画面にあるアーキタイプと大会名を比較するケースを追加する。

### 指摘5（重大度: Major）対象: 群 QM（M15-06→F09-06）
主張: 詳細画面にはメインリストが必要なので、CSV取込からのケースを作れない（`integration_test/casegen/link_pub/gen_QM/report.md:32`）。
実際: CSV取込はデッキリスト非公開ならメインリストの空欄を許す（`functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md:40`）。F09-06 も、その状態ではカードリストを空にして情報欄を表示すると定める（`functions/pf-eccube3/f09-06_front_deck_deck_show.md:14,35-47`）。
判定: 取りこぼし
修正案: 既存デッキをCSVで上書きし、詳細画面の大会名など情報欄の値を取込前後で比較するケースを追加する。

### 指摘6（重大度: Major）対象: 群 QM（M15-09→F09-03）
主張: アーキタイプ名の変更は F09-02 で確認済みなので、F09-03 は不要（`integration_test/casegen/link_pub/gen_QM/report.md:34`）。
実際: M15-09 はアーキタイプを編集・保存する（`functions/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.md:71-76`）。F09-03 はアーキタイプの日本語名を一覧に表示する別画面である（`functions/pf-eccube3/f09-03_front_deck_deck_metagame.md:22-28,38-45`）。既存ケースにこの更新から F09-03 を確認するものはない。
判定: 取りこぼし
修正案: 集計期間内の公開大会デッキを用意し、名称更新後、集計キャッシュの保持時間を過ぎて F09-03 の旧名が新名に変わるケースを追加する。
