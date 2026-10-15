### 指摘1（重大度: Minor）対象: S-M16-04-QN-ADM
変更: B（置き換え）  
主張: 用途欄は2件のテストで使う管理者を示す。  
実際: `QN002` の置換により、用途欄の2件目が存在しないテストID「M1604QN002」になっている（`integration_test/casegen/link_pub/fix_idents_log.tsv:989`、`integration_test/casegen/link_pub/cases/QN_seed_data.tsv:10`）。実際のIDは `IT-M16-04-QN002`（`integration_test/casegen/link_pub/cases/QN_test_cases.tsv:5`）。  
判定: 置換の食い違い  
修正案: 用途欄を「IT-M16-04-QN001・IT-M16-04-QN002の管理画面操作とデッキの準備」に直す。
