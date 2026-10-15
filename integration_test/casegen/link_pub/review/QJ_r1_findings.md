### 指摘1（重大度: Major）対象: IT-M10-15-QJ003
主張: 公開・開店済みの支店で、管理画面の画像変更が公開側に反映される。
実際: 事前準備は公開・開店済みとするが、シードの登録手順は両項目を設定しない（`integration_test/casegen/link_pub/cases/QJ_test_cases.tsv:4`、`integration_test/casegen/link_pub/cases/QJ_seed_data.tsv:7`）。店舗登録画面の初期値は「非公開」「閉店」である（`excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:2276`、`:2277`）。このままでは手順1の支店サイトを開けない。
判定: 前提不成立
修正案: シードの画面登録手順で「公開」「開店」を選び、登録後の状態も確認する。

### 指摘2（重大度: Major）対象: IT-M10-04-QJ001、IT-M10-06-QJ001
主張: 設定変更の前後で送料100円を維持し、手数料または送料の変更値を注文画面で確認できる。
実際: 両シードは配送方法の東京都送料を100円にするが、配送料無料条件を設定していない（`integration_test/casegen/link_pub/cases/QJ_seed_data.tsv:11`、`:13`）。設計書では、金額または数量の条件を満たすと算出済みの送料を0円にする（`functions/pf-eccube3/m10-05_admin_base_setting_setting_shop_delivery_free_conditions.md:19`–`:25`）。その場合、手数料ケースの注文金額1400円→1550円、および送料ケースの100円→250円は成立しない（`integration_test/casegen/link_pub/cases/QJ_test_cases.tsv:7`、`:8`）。
判定: 前提不成立
修正案: 各シードで対象店舗の配送料無料条件を未設定、または注文金額・数量を超える値に画面から設定し、事前準備に明記する。

### 指摘3（重大度: Minor）対象: IT-M10-15-QJ001、IT-M10-15-QJ003
主張: 店舗情報の更新と画像の更新を、別々のIT-0150ケースとして置く。
実際: どちらも店舗登録画面で同じ支店PC版ナビゲーションへの更新反映を判定するケースである（`integration_test/casegen/link_pub/cases/QJ_test_cases.tsv:2`、`:4`）。依頼文は同じ判定を項目違いで増やさず、複数項目を一つの期待結果にまとめるよう定める（`integration_test/casegen/link_pub/gen_QJ/prompt.md:90`–`:91`）。
判定: 重複
修正案: QJ003の画像変更と確認をQJ001へ統合し、QJ003を削除する。
