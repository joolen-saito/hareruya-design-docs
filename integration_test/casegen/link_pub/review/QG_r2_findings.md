### 指摘1（重大度: Major）対象: IT-M07-03-QG003
主張: 商品追加モーダルで商品を「検索して選択する」手順で、追加した明細を編集できる。
実際: 商品追加モーダルは、商品コードを選択した後に「決定」ボタンを押して閉じる仕様である（`excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:1994`、`excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:2197-2200`）。ケースの手順4には「決定」がない（`integration_test/casegen/link_pub/cases/QG_test_cases.tsv:8`）。
判定: 手順不備
修正案: 手順4に、商品コードを選択して「決定」ボタンを押す操作を明記する。

### 指摘2（重大度: Major）対象: IT-M07-03-QG001〜QG006
主張: 各シードで銀行名・支店名・口座種別・口座番号・口座名義に「任意の値」を入れて買取を申し込む。
実際: 口座種別は定められた選択肢、口座番号は必須の整数で最大7桁など、入力条件がある（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2204-2210`）。6件のシードはいずれも口座情報を具体化しておらず、ケースごとに値付きで準備する規約も満たさない（`integration_test/casegen/link_pub/cases/QG_seed_data.tsv:11-16`、`integration_test/casegen/precond/README.md:27`）。
判定: 前提不成立
修正案: 各シードに、選択肢内の口座種別、7桁以内の数字の口座番号、銀行名・支店名・口座名義の具体値を記載する。

### 指摘3（重大度: Minor）対象: IT-M07-03-QG001
主張: 一括売却登録の公開側反映を、えらんで買取の明細だけで確認する。
実際: 一括売却登録は「すべて」の明細の売却状況を変更し、買取履歴詳細にはまとめて買取の売却する／しない欄もある（`excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:1824-1825`、`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2609`）。現ケースのシードと期待結果はえらんで買取の3明細だけを対象にしている（`integration_test/casegen/link_pub/cases/QG_seed_data.tsv:11`、`integration_test/casegen/link_pub/cases/QG_test_cases.tsv:6`）。
判定: 取りこぼし
修正案: QG001 のシードに表示条件を満たすまとめて買取の明細を加え、同じケースの期待結果でその売却選択の前後も確認する。

### 指摘4（重大度: Minor）対象: 群
主張: 報告書は全9件・シード14件とし、M07-03を5件としている。
実際: ケースは10件、シードは15件で、追加された QG006 が作成数・対応表・重複確認・到達可能性に反映されていない（`integration_test/casegen/link_pub/cases/QG_test_cases.tsv:11`、`integration_test/casegen/link_pub/cases/QG_seed_data.tsv:16`、`integration_test/casegen/link_pub/gen_QG/report.md:5-10`、同`:29-50`）。末尾だけが10件・15件と記している（同`:64-68`）。
判定: 規約違反
修正案: 報告書の件数を更新し、QG006 の出典対応・重複確認・到達可能性を各表へ追加する。
