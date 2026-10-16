### 指摘1（重大度: Minor）対象: IT-M05-11-RE003
変更: A（2巡目の反映）  
主張: 変更前の累計注文金額をシード・事前準備に明記した。  
実際: 事前準備は「注文確定後に画面へ表示される値」とするだけで、金額を定めていない。シードも手順中に控えるとしており、期待結果はその値との大小比較に依存する（`integration_test/casegen/link_flow/cases/RE_test_cases.tsv:9`、`integration_test/casegen/link_flow/cases/RE_seed_data.tsv:25`）。操作前の値を事前準備で決める規則を満たさない（`integration_test/casegen/link_flow/gen_RE/prompt.md:66`、`integration_test/casegen/precond/README.md:28`）。  
判定: 反映不備  
修正案: シード作成の最後に累計注文金額の実額を確認・記録し、その数値を事前準備に記す。手順2では記録した数値との一致を確認してから数量を変更する。
