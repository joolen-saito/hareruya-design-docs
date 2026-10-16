### 指摘1（重大度: Major）対象: IT-M13-13-RI001
主張: CSVに「スタンダード」「初心者歓迎」「公開」を指定すれば、イベントと日程が登録され、申込登録検索に表示される。
実際: 取込時はフォーマット・ルール適用度・公開状態を名称に対応するマスタから引き、対応する値がなければ取込エラーとなる（`functions/pf-eccube3/m13-13_admin_event_event_entry_csv_import.md:35,83`）。しかし、ケースの事前準備と使用シードにはこれらのマスタが存在する状態がない（`integration_test/casegen/link_flow/cases/RI_test_cases.tsv:10`、`integration_test/casegen/link_flow/cases/RI_seed_data.tsv:16-18`）。既存のM13-13ケースは取込用マスタを別シードで明示している（`integration_test/casegen/cases/M13-13_seed_data.tsv:3`）。
判定: 前提不成立
修正案: 3つの値を持つマスタの存在と画面からの準備方法をシード・事前準備に追加する。画面で作れない値があれば、その理由と投入方法を明記する。

### 指摘2（重大度: Minor）対象: RI
主張: 報告書では M13-02→M13-10 を不採用とし、作成数を M13-02が3件・M13-12が2件、シードを16行としている。
実際: 前巡の裁定で M13-02→M13-10 の RI004 を追加し、M13-12 の RI002 を削除している（`integration_test/casegen/link_flow/review/RI_r1_dispositions.tsv:3-4`）。現行ケースは M13-02が4件・M13-12が1件（`integration_test/casegen/link_flow/cases/RI_test_cases.tsv:2-10`）、シードは17件（`integration_test/casegen/link_flow/cases/RI_seed_data.tsv:2-18`）。報告書の評価表・対応表・作成数は旧状態のままで、末尾の反映記録とも矛盾する（`integration_test/casegen/link_flow/gen_RI/report.md:4,23,25-35,58-61`）。
判定: 規約違反
修正案: 報告書の作成数と評価表を現行ケースに合わせ、RI004の対応・重複確認・到達可能性を各表へ追加する。
