### 指摘1（重大度: Major）対象: CH-0909
主張: 遷移先の記述が食い違い、時刻固定も未確定なので「作れない」。  
実際: 大会申込画面への遷移は「予約枠が0ではない場合」に限られる。一方、開催時間の押下で大会詳細画面へ遷移する記述があり、予約枠0人も定義されている（[0307 HTML:1384](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:1384)、[同:1387](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:1387)、[同:1392](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:1392)）。既存シードには画面から翌日の公開日程を作る方法があり、申込を登録する機能も定義されている（[F07-01_seed_data.tsv:18](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/F07-01_seed_data.tsv:18)、[F07-04機能設計書:38](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/f07-04_front_event_event_entry_complete.md:38)）。  
判定: 判定の誤り  
修正案: 予約枠を0人にした翌日の公開日程について、イベント開催時間を押し、当該イベント詳細IDの大会詳細画面を確認するケースとして「作成」に変更する。

### 指摘2（重大度: Major）対象: IT-F06-02-CD001
主張: スマレジの要求履歴を確認しなければ、既存の保留ケースと同じ前提で実行できる。  
実際: 本ケースもスマレジ試験環境で対象メールアドレスの会員が0件であることを前提にする（[CD_test_cases.tsv:3](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/chain_gap/cases/CD_test_cases.tsv:3)）。未確定前提の記録は、要求履歴だけでなく**会員の初期化と確認の具体的な方法**も確定できないとしている（[open_preconditions.tsv:186](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond/open_preconditions.tsv:186)）。シードにはローカル会員の削除しかなく、スマレジ側の会員を0件へ戻す方法がない（[CD_seed_data.tsv:5](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/chain_gap/cases/CD_seed_data.tsv:5)、[同:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/chain_gap/cases/CD_seed_data.tsv:6)）。  
判定: 前提不成立  
修正案: スマレジ側の会員を初期化・確認する具体的な方法が確定するまで、CH-0800 を「作れない」に戻し、このケースを外す。

### 指摘3（重大度: Minor）対象: IT-F02-04-CD001
主張: 店舗登録画面で店舗レコードID `202400901` の支店を用意できる。  
実際: シードの投入方法には、そのIDを指定する方法も、登録時に振られたIDを控える操作もない（[CD_seed_data.tsv:3](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/chain_gap/cases/CD_seed_data.tsv:3)）。画面が振る番号は固定値にせず控えた番号を使う規約である（[precond/README.md:45](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond/README.md:45)）。  
判定: 規約違反  
修正案: 使用しない固定の店舗レコードIDを事前準備とシードから削除する。IDが必要なら、店舗登録後に画面で確認して控える手順を書く。
