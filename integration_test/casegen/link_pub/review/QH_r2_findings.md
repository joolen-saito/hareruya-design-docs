### 指摘1（重大度: Minor）対象: IT-M08-05-QH001
主張: ポイント履歴画面で、操作前の「1000」「+1000」を確認し、付与後は「1300」と表示される。
実際: F06-10 は画面に出すポイント数をすべて桁区切りで表示すると定める（`functions/pf-eccube3/f06-10_front_member_mypage_point_history.md:10`）。ケースの手順と期待結果は区切りのない値で記載されている（`integration_test/casegen/link_pub/cases/QH_test_cases.tsv:4`）。
判定: 期待結果の捏造
修正案: 画面上の値を「1,000」「+1,000」「1,300」に直す。

### 指摘2（重大度: Minor）対象: 群 QH
主張: ポイント種別と本人確認ステータスをDBで用意する。
実際: 両シードの投入方法はDB直接投入とだけ書き、画面から作れない理由がない（`integration_test/casegen/link_pub/cases/QH_seed_data.tsv:7`、`同:17`）。依頼文は、DB直接投入を画面で作れない理由を添えた場合に限る（`integration_test/casegen/link_pub/gen_QH/prompt.md:108-110`）。
判定: 規約違反
修正案: 画面で作れるなら投入方法を画面操作に直す。作れないなら、各シードにその理由を明記する。

### 指摘3（重大度: Minor）対象: 群 QH
主張: 報告書の作成数・評価表・対応表は、現行10件の結果を示している。
実際: 現行ケースは M08-04 が2件、M08-09 が4件で、F04-03 の QH004 を含む（`integration_test/casegen/link_pub/cases/QH_test_cases.tsv:2-3`、`同:7-10`）。報告書はなお M08-04 を3件、M08-09 を3件とし、削除済みの M08-04→F06-20 を採用、追加済みの M08-09→F04-03 を不採用と記す。対応表にも QH004 がない（`integration_test/casegen/link_pub/gen_QH/report.md:5-6`、`同:13-15`、`同:27-39`）。
判定: 規約違反
修正案: 現行ケースに合わせて件数・評価表・対応表・重複確認・到達可能性を更新する。
