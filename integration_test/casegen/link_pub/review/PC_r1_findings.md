### 指摘1（重大度: Major）対象: IT-F06-18-PC001
主張: 会員検索一覧に会員名の姓・名と、ハイフンを除いた電話番号が表示される。
実際: 下流の項目定義は「会員名」1欄と、電話番号を「-で結合」する表示を定める。姓・名の別欄や数字だけの電話番号は定めていない。`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1274-1275`、`integration_test/casegen/link_pub/cases/PC_test_cases.tsv:2`
判定: 期待結果の捏造
修正案: 会員名の姓・名を別欄として照合する記述と、数字だけの電話番号の照合を削除する。

### 指摘2（重大度: Major）対象: IT-F06-18-PC002、IT-F06-20-PC002〜004、IT-F06-01-PC001
主張: 公開側の1欄の郵便番号・電話番号が、管理画面の分割欄に指定の桁で入り、電話番号の3欄を続けると入力値になる。海外の郵便番号は「海外用郵便番号」欄に入る。
実際: 公開側は郵便番号・電話番号を各1欄とし、管理画面は郵便番号を2欄、電話番号を3欄に分けるが、両者の分割・格納規則は示していない。著者の報告も規則の不在を認めている。`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3745`、`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1736-1737,1745-1747,2493-2497`、`integration_test/casegen/link_pub/gen_PC/report.md:69`
判定: 推測による接続
修正案: 分割後の各値と海外用郵便番号欄の同値照合を期待結果から外す。対応規則が設計書に定まってから追加する。

### 指摘3（重大度: Major）対象: IT-F06-18-PC003
主張: 会員登録/編集画面のお届け先住所欄に、配送先氏名の姓・名、都道府県、会社名などが表示される。
実際: 手順は M08-04 の会員登録/編集画面で止まる。同画面のお届け先欄の項目定義は「名前・住所・電話番号」のみで、詳しい配送先項目を定めるのは M08-09 の一覧である。`integration_test/casegen/link_pub/cases/PC_test_cases.tsv:4`、`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1808-1810`、`functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md:9-11`
判定: 期待結果の捏造
修正案: 手順で M08-09 の配送先一覧を開き、そこで表示対象と定められた項目を確認するよう書き直す。

### 指摘4（重大度: Major）対象: F06-18・F06-20・F06-13 の会員シード、および IT-F06-18-PC002〜004・IT-F06-20-PC001〜003
主張: 公開側の郵便番号欄へ「100-0001」「150-0002」などハイフン付きの値を入力して登録・変更できる。
実際: 公開側の郵便番号欄は「数値（整数）」で、会員登録には数字以外を拒否する記述もある。シード作成と手順の入力がこの定義に合わない。`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1225,3745,4039`、`functions/pf-eccube3/f06-01_front_member_customer_entry.md:54`、`integration_test/casegen/link_pub/cases/PC_seed_data.tsv:4-7,10-13,20-21`
判定: 前提不成立
修正案: 公開側の入力値を数字だけに直し、各シードを画面から作れる状態にする。

### 指摘5（重大度: Major）対象: F06-18-PC001〜004、F06-20-PC001〜004
主張: 記載した入力を保存すると、会員情報変更・配送先登録が完了する。
実際: F06-18 は氏名・電話番号・住所がブラックリストに一致すると変更できない。F06-20 の確認画面にもブラックリストによる登録拒否がある。一方、これらのケースの事前準備には、使用する値がブラックリストに無い状態が記されていない。`functions/pf-eccube3/f06-18_front_member_mypage_customer_edit.md:59-62`、`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4097`、`integration_test/casegen/link_pub/cases/PC_test_cases.tsv:2-9`
判定: 前提不成立
修正案: 各ケースの氏名・電話番号・住所について、不一致となるブラックリスト状態を専用データの準備に明記する。

### 指摘6（重大度: Major）対象: IT-F06-01-PC001
主張: 海外住所の項目を増やせば、会員登録から M08-04 への同値確認を新規ケースにできる。
実際: 既存の IT-F06-01-055 は、公開側で会員登録し、同じ M08-04 の会員登録/編集画面で登録値を照合する。今回の差は照合項目と海外住所の入力値であり、依頼文は同じ判定を項目違いで増やさないと定める。`integration_test/casegen/all_test_cases.tsv:2319`、`integration_test/casegen/link_pub/gen_PC/prompt.md:83`、`integration_test/casegen/link_pub/cases/PC_test_cases.tsv:12`
判定: 重複
修正案: PC001 を削除する。

### 指摘7（重大度: Major）対象: IT-F06-13-PC001
主張: 申請した画像が本人確認ポップアップの4枠に出れば IT-0332 を満たす。
実際: IT-0332 は登録対象が管理画面の一覧と詳細・編集画面で参照対象になる判定である。M08-10 の設計は4つの画像枠を持つモーダルの表示を定めるが、申請画像の一覧画面は定めていない。`integration_test/casegen/link_pub/gen_PC/prompt.md:54`、`functions/pf-eccube3/m08-10_admin_customer_customer_online_identification.md:14-21`、`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:2601-2604`
判定: 範囲外
修正案: IT-0332 のケースから外す。

### 指摘8（重大度: Major）対象: 群 PC（F06-01→M08-09）
主張: F06-01 の管理画面連携は、既存の会員検索・会員編集ケースで足りる。
実際: F06-01 は会員登録時に既定のお届け先を別に作る。M08-09 は会員に紐づく配送先を一覧表示し、既定の配送先も扱う。既存の IT-F06-01-053〜056 は M08-01・M08-04 の確認で、この組を確認しない。`functions/pf-eccube3/f06-01_front_member_customer_entry.md:19-27`、`functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md:5-11`、`integration_test/casegen/all_test_cases.tsv:2317-2320`
判定: 取りこぼし
修正案: 公開側の会員登録後、管理画面の配送先一覧で作成された既定のお届け先を確認する IT-0355 ケースを追加する。

### 指摘9（重大度: Major）対象: 群 PC（F06-18→M08-10）
主張: M08-10 は画像・有効期限しか表示せず、F06-18 の更新と対応しない。
実際: M08-10 の項目定義には、お名前、フリガナ、国、郵便番号、住所1〜3がある。F06-18 は会員の氏名・住所等を更新する。この下流画面を「画像・有効期限のみ」として除いた評価は設計書に反する。`integration_test/casegen/link_pub/gen_PC/report.md:18`、`excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:2561,2590-2598`、`functions/pf-eccube3/f06-18_front_member_mypage_customer_edit.md:21-25,48-54`
判定: 取りこぼし
修正案: 会員情報変更後に M08-10 のポップアップを開き、設計書で対応を確認できる表示項目を照合するケースを追加する。

### 指摘10（重大度: Minor）対象: IT-F06-20-PC004
主張: 海外住所の項目が異なるため、PC002 とは別の IT-0333 登録ケースにする。
実際: PC002 と PC004 はともに F06-20 で配送先を新規登録し、同じ M08-09 の配送先編集画面で同値を判定する。依頼文は登録・表示の組を原則1件とし、項目違いで同じ判定を増やさない。`integration_test/casegen/link_pub/cases/PC_test_cases.tsv:7,9`、`integration_test/casegen/link_pub/gen_PC/prompt.md:82-83`
判定: 重複
修正案: PC004 を削除する。
