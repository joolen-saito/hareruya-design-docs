### 指摘1（重大度: Major）対象: IT-A05-04-AA001〜AA005
主張: スマレジ試験環境にケース別の取引応答を登録し、開発者ツールから Webhook を送れば、下流画面まで確認できる。
実際: 5件とも同じ試験設定を使うが、その取引応答を切り替える実配線と、Webhook に必要な認証情報・一意なイベントIDの作り方は未確定と記録されている（`integration_test/casegen/link_flow/cases/AA_seed_data.tsv:8`、`integration_test/casegen/precond/open_preconditions.tsv:217`、同`:258`）。未確定の前提を使うケースは除外する規約である（`integration_test/casegen/precond/README.md:52`）。
判定: 前提不成立
修正案: 5件を除外する。試験環境の配線と認証付き送信手順が確定した後に戻す。

### 指摘2（重大度: Major）対象: IT-A05-04-AA001〜AA003
主張: スマレジ受信後、各画面のポイント残高が 0 から 60 または 100 に変わる。
実際: 上流は「会員の保有ポイント」を更新すると記す（`functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:13`）。管理画面の残高は「会員に紐づく選手情報」の残高、公開側も選手情報のポイントを表示する（`functions/pf-eccube3/m08-06_admin_customer_point.md:15`、`functions/pf-eccube3/f06-10_front_member_mypage_point_history.md:26`、`functions/pf-eccube3/f06-05_front_member_mypage_index.md:30`）。A05-04 がその選手情報を更新する対応は示されず、著者も未記載と認めている（`integration_test/casegen/link_flow/gen_AA/report.md:55`）。
判定: 推測による接続
修正案: 残高変化の期待を外し、設計書で対応するポイント履歴の表示に絞る。残高だけを判定する AA003 は、対応規則が設計書で確定するまで除外する。

### 指摘3（重大度: Major）対象: IT-A05-04-AA005
主張: API応答の「一般品免税額」300 が、受注情報編集画面の「免税額」に 300 と表示される。
実際: 上流の項目は「内税商品の一般品免税額」であり（`excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1641`）、下流は単に「免税額」を表示項目とする（`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:3159`）。両者を同値とする規則は示されず、著者の対応表も名称の近さによる対応としている（`integration_test/casegen/link_flow/gen_AA/report.md:37`）。
判定: 推測による接続
修正案: 免税額300の照合を期待結果から削る。対応規則が設計書に追加された場合に限り戻す。

### 指摘4（重大度: Minor）対象: IT-A01-01-AA001〜AA003
主張: 事前準備に Webhook の送信先 `/smaregi/stocks` を記す。
実際: 3件の事前準備と共通シードにルートの物理名がある（`integration_test/casegen/link_flow/cases/AA_test_cases.tsv:2`〜`:4`、`integration_test/casegen/link_flow/cases/AA_seed_data.tsv:2`）。依頼文はルート名を含む物理名を禁じている（`integration_test/casegen/link_flow/gen_AA/prompt.md`「縛り」7）。
判定: 規約違反
修正案: 「スマレジ在庫連携のWebhook送信先」など設計書の業務名で書き直す。
