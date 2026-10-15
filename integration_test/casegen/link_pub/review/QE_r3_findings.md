### 指摘1（重大度: Major）対象: S-M04-03-QE-LIST-002
変更: 追加ケース  
主張: 管理者2人をシードで登録し、IT-M04-03-QE002 の手順でログインする。  
実際: 投入方法にメールアドレスと稼働状態の指定がない（`integration_test/casegen/link_pub/cases/QE_seed_data.tsv:10`）。メンバー管理ではメールアドレスが必須で、稼働の初期値は「非稼働」（`excel_to_html/output/0201_基本設計仕様書(システム設定).html:1230`、同`:1236`）。停止中の管理者は認証されない（`functions/ec-cube-enterprise/m01-01_admin_login_login.md:21`）。  
判定: 前提不成立  
修正案: 2人それぞれにケース固有のメールアドレスを指定し、登録時に「稼働」を選ぶ。パスワード確認欄にも置換後のパスワードを入力すると明記する。

### 指摘2（重大度: Major）対象: IT-M04-03-QE002
変更: A（2巡目の反映）  
主張: 評価表の M04-03→F03-02 を「×h」とし、新しい型になるため作らない（`integration_test/casegen/link_pub/gen_QE/report.md:18`、同`:31`）。  
実際: 在庫一括編集は在庫編集の登録処理を参照し（`excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:1849`）、入庫承認は現在庫数を更新する（同`:8145`）。商品詳細には在庫項目と在庫による購入操作部の表示条件がある（`excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1804`、同`:1806`、同`:1809`）。「新しい型」やレビュー日程は、この組を除外する設計上の理由にならない。  
判定: 反映不備  
修正案: M04-03→F03-02 を評価表で採用し、ケース専用の商品を在庫0から入庫・承認して、商品詳細の在庫と購入操作部を前後で確認するケースを追加する。

### 指摘3（重大度: Minor）対象: IT-M04-03-QE002
変更: A（2巡目の反映）  
主張: 報告書はレビュー反映後の17件を記載したとしている（`integration_test/casegen/link_pub/gen_QE/report.md:3`、同`:97`）。  
実際: 新規の QE002 はケースに存在する（`integration_test/casegen/link_pub/cases/QE_test_cases.tsv:8`）が、機能別件数は M04-03 をなお「1件」とし（`integration_test/casegen/link_pub/gen_QE/report.md:8`）、採用ケースごとに必要な対応表にも QE002 がない（同`:35`–`:48`、`integration_test/casegen/link_pub/gen_QE/prompt.md:151`、同`:153`）。  
判定: 反映不備  
修正案: 件数表を現行17件の内訳に直し、QE002 の上流・下流の根拠と同じ在庫を指す理由を対応表に追加する。
