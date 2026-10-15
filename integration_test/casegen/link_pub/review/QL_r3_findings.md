### 指摘1（重大度: Minor）対象: S-M14-10-QL-DECK-002、S-M14-10-QL-EVENT-003、S-M14-10-QL-RANK-004、S-M14-10-QL-RESULT-005
変更: A（2巡目の反映）  
主張: 旧QL003〜006のシードIDをQL002〜005へ振り直した。  
実際: シードIDは振り直されているが、論理名の末尾はそれぞれ旧番号の「(003)」「(004)」「(005)」「(006)」のままで、同じ行のシードID・用途と食い違う（`integration_test/casegen/link_pub/review/QL_r2_dispositions.tsv:4`、`integration_test/casegen/link_pub/cases/QL_seed_data.tsv:11`〜`14`）。  
判定: 反映不備  
修正案: 4行の論理名の末尾を、シードIDに合わせて順に「(002)」「(003)」「(004)」「(005)」へ直す。
