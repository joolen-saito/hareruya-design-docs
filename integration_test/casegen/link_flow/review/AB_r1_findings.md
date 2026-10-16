### 指摘1（重大度: Major）対象: 群 AB の全9件
主張: 一覧で控えた「査定ID」を、更新APIのURLの受注IDとして使えば対象が更新される。
実際: シードは一覧の表示値を控える（`integration_test/casegen/link_flow/cases/AB_seed_data.tsv:8`）。設計書はAPIの対象を「受注ID」とする（`functions/pf-api/a06-03_api_store_purchase_otc_buy_order_update.md:7`）。実装でも一覧リンクの表示値は `assessment_id`、リンク先の識別子は `otcBuyOrderId` と別で、3 API は後者で受注を検索する（`/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/OtcBuyOrder/index.twig:162`、`/home/y-saito/Developments/pf-api/src/Controller/Admin/OtcBuyOrderController.php:64`、`/home/y-saito/Developments/pf-api/src/Controller/Admin/OtcBuyOrderFreeCommentController.php:25`、`/home/y-saito/Developments/pf-api/src/Controller/Admin/OtcBuyOrderStatusController.php:27`）。
判定: 前提不成立
修正案: 各シード作成時に買取詳細のリンク先から受注IDも控える。検索と表示対象の照合には査定IDを使い、APIのURLには受注IDを使う。

### 指摘2（重大度: Major）対象: 群 AB
主張: A06-05→F06-11 は表示名の食い違いで前後の変化を書けないため、作らなかった（`integration_test/casegen/link_flow/gen_AB/report.md:22`）。
実際: A06-05 は査定前から査定中への更新を定める（`excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1504`、`:1509`）。F06-11 の買取履歴一覧は店頭買取の査定前を「受付完了」、査定中を「査定中」とする表を持ち、処理状態を表示項目に定める（`excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2363`、`:2368`、`:2401`）。既存の `all_test_cases.tsv` に、このAPI操作から同画面を確かめるケースは無い。
判定: 取りこぼし
修正案: 会員が所有する店頭買取を査定前で用意し、買取履歴一覧の「受付完了」を確認する。A06-05で査定中へ更新して開き直し、「査定中」への変化を確かめるケースを追加する。

### 指摘3（重大度: Major）対象: IT-A06-04-AB002
主張: コメント更新APIが設定する「更新担当者」が、買取一覧の「最終更新者」として表示される。
実際: 上流設計は更新担当者への設定を定める（`functions/pf-api/a06-04_api_store_purchase_otc_buy_order_free_comment.md:12`）。下流設計の該当箇所は「最終更新者」という表示項目を定めるだけで、このAPIの更新担当者との対応を定めない（`excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:1297`）。著者も対応が明記されていないと認め、別機能 M06-03 の保存処理で補っている（`integration_test/casegen/link_flow/gen_AB/report.md:56`）。
判定: 推測による接続
修正案: A06-04の更新担当者をM06-01の最終更新者として取得する設計上の根拠を特定できなければ、このケースを削除する。

### 指摘4（重大度: Minor）対象: IT-A06-03-AB003
主張: 買取一覧の金額は「¥450」と表示される。
実際: 下流設計が指定するのは金額の前の「通貨記号」と3桁区切りであり、記号を「¥」とは指定していない（`functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md:43`）。ケースは記号を固定している（`integration_test/casegen/link_flow/cases/AB_test_cases.tsv:4`）。
判定: 期待結果の捏造
修正案: 「買取金額が通貨記号付きの450として表示されること」に直す。

### 指摘5（重大度: Minor）対象: IT-A06-04-AB001・AB002
主張: 操作前のコメントは新しいコメントではなく、操作前の最終更新者は試験担当者ではない。
実際: 両ケースの事前準備と専用受注シードは、操作前のフリーコメントと最終更新者の値を定めていない（`integration_test/casegen/link_flow/cases/AB_test_cases.tsv:7`、`:8`、`integration_test/casegen/link_flow/cases/AB_seed_data.tsv:17`、`:18`）。群の依頼文は操作前の値を事前準備で決めるよう求める（`integration_test/casegen/link_flow/gen_AB/prompt.md:66`）。
判定: 規約違反
修正案: 専用受注を作成した後の両項目の値を確認して事前準備に記載し、その値からAPI後の値への変化を手順と期待結果に書く。
