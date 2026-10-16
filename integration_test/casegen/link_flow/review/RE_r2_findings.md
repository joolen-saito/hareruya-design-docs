### 指摘1（重大度: Major）対象: IT-M05-26-RE002
主張: CSV取込後、受注情報編集画面の「送り状No.」に「52609002」が表示される。
実際: 取込先として明記されているのは**受注の**「送り状No.」である（[M05-26設計書:36](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:36)、[0203設計書:4716](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4716)）。下流の識別ID12-24は「お届け先情報」内の項目であり、受注側の値をそこへ渡す規則は確認できない（[0203設計書:3348](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3348)、[同:3381](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3381)）。シードは配送先を2件にしているため、確認する欄も特定されていない（[RE_seed_data.tsv:19](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_seed_data.tsv:19)）。
判定: 推測による接続
修正案: 送り状No.の画面照合を外し、受注の出荷日に絞る。送り状No.を残すなら、受注側の値と識別ID12-24の対応を設計書で確定し、確認する配送先を指定する。

### 指摘2（重大度: Minor）対象: IT-M05-11-RE003
主張: 数量変更後の累計注文金額を、手順2で控えた変更前の金額と比較できる。
実際: 事前準備とシードに変更前の**累計注文金額**がない（[RE_test_cases.tsv:9](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_test_cases.tsv:9)、[RE_seed_data.tsv:25](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_seed_data.tsv:25)）。操作前の値を事前準備で決める規則に合わない（[prompt.md:66](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RE/prompt.md:66)、[precond/README.md:28](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond/README.md:28)）。
判定: 規約違反
修正案: 会員の変更前累計注文金額をシードと事前準備に値付きで記し、手順2でその値を確認する。

### 指摘3（重大度: Minor）対象: IT-M05-11-RE001、IT-M05-11-RE002
主張: 用意した受注を「キャンセル」へ変更できる。
実際: 両ケースの事前準備・シードはキャンセル日が空であることを定めるが、**変更前の対応状況**を定めていない（[RE_test_cases.tsv:7](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_test_cases.tsv:7)、[同:8](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_test_cases.tsv:8)）。受注情報編集には、変更前後の状態によってステータス変更を拒否する規定がある（[M05-11設計書:130](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-11_admin_order_order_edit.md:130)）。現状の前提では手順6が成立するか判定できない。
判定: 前提不成立
修正案: 両シードにキャンセルへ変更可能な変更前の対応状況を明記し、事前準備で確認する。

### 指摘4（重大度: Minor）対象: 群
主張: 報告の評価表・対応表は反映後の採用ケースを示す。
実際: 報告は M05-26→M08-07 をなお「採用」とし、RE002 の対応表も削除済みのメール履歴ケースを説明している（[report.md:25](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RE/report.md:25)、[同:46](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RE/report.md:46)）。一方、裁定はこの組を削除し、実際の RE002 は M05-26→M05-11 である（[RE_r1_dispositions.tsv:2](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/review/RE_r1_dispositions.tsv:2)、[RE_test_cases.tsv:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RE_test_cases.tsv:6)）。
判定: 規約違反
修正案: 評価表で M05-26→M08-07 を不採用に改め、M05-26→M05-11 の評価と新 RE002 の対応根拠に差し替える。
