### 指摘1（重大度: Major）対象: 群 QM（M15-09→F09-01）
主張: アーキタイプ名の変更は F09-02 で確認できるため、F09-01 のケースは不要（`integration_test/casegen/link_pub/gen_QM/report.md:34`）。
実際: M15-09 はアーキタイプ名を更新する（`functions/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.md:71-76`）。F09-01 はアーキタイプの名称をメタゲーム上位の区画に表示する（`functions/pf-eccube3/f09-01_front_deck_deck_index.md:5-18,68-70`）。F09-02 とは別の下流画面であり、この操作から F09-01 を確かめる既存ケースはない。
判定: 取りこぼし
修正案: 集計期間内の公開大会デッキを用意し、F09-01 の旧名を確認する。管理画面でアーキタイプ名を変更し、集計キャッシュの保持時間経過後に F09-01 の新名を確認するケースを追加する。

### 指摘2（重大度: Major）対象: 群 QM（M15-03・M15-04・M15-06→F09-01）
主張: これらの操作から F09-01 への反映ケースは作成していない（`integration_test/casegen/link_pub/cases/QM_test_cases.tsv:2-21`）。
実際: 一括削除はデッキを削除し、一括編集はアーキタイプなどを更新し、CSV取込はデッキを新規登録・上書きする（`functions/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.md:9-15`、`functions/pf-eccube3/m15-04_admin_deck_deck_bulk_update.md:18-24`、`functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md:75-82`）。F09-01 は公開大会デッキをアーキタイプ別に集計してデッキ数を表示する（`functions/pf-eccube3/f09-01_front_deck_deck_index.md:5-18,117-119`）。
判定: 取りこぼし
修正案: それぞれの上流操作の前後で F09-01 の対象アーキタイプの件数を比較するケースを追加する。一括編集はアーキタイプ間の件数移動、CSV取込は件数増加、一括削除は件数減少を確認し、キャッシュの保持時間を待つ。

### 指摘3（重大度: Minor）対象: IT-M15-11-QM001・IT-M15-11-QM002
主張: F09-01 に大会の日本語名「QM1511-001-大会」「QM1511-002-大会」が表示される（`integration_test/casegen/link_pub/cases/QM_test_cases.tsv:20-21`）。
実際: 上流は大会名の日本語欄と英語欄を別々に保存する（`excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:2403-2404`）。下流は「大会名」を表示すると定めるが、表示に使う言語は指定していない（`functions/pf-eccube3/f09-01_front_deck_deck_index.md:25-27`）。両ケースの事前準備にも公開側の表示言語がない。
判定: 期待結果の捏造
修正案: 大会名の日英欄に同じ識別値を入れて表示値を照合するか、言語と表示項目の対応を設計書で確定してから期待結果を書く。

### 指摘4（重大度: Minor）対象: 群 QM
主張: シードの投入方法に、フォーマットIDを控える位置として URL の `format/` と `/edit` を記載している（`integration_test/casegen/link_pub/cases/QM_seed_data.tsv:8-10,24`）。
実際: 依頼文はルート名などの物理名をケースとシードに書かないと定める（`integration_test/casegen/link_pub/gen_QM/prompt.md:101`）。
判定: 規約違反
修正案: URL の断片を削り、「登録後に開くフォーマット編集画面のアドレス欄から、発番されたフォーマットIDを控える」と書く。

### 指摘5（重大度: Minor）対象: 群 QM
主張: 報告書の作成数は16件で、追加済みの4組を評価表では不採用としている（`integration_test/casegen/link_pub/gen_QM/report.md:5-15,25,29,32,34`）。
実際: ケースは20件あり、報告書自身も前巡で4件追加したと記す（`integration_test/casegen/link_pub/cases/QM_test_cases.tsv:2-21`、`integration_test/casegen/link_pub/gen_QM/report.md:85-97`）。依頼文は組ごとの採否と件数を報告書に記すよう求める（`integration_test/casegen/link_pub/gen_QM/prompt.md:149-153`）。
判定: 規約違反
修正案: 冒頭の件数、機能別内訳、組ごとの評価表、重複確認を20件の現行ケースに合わせて更新する。
