### 指摘1（重大度: Major）対象: 群 QN
主張: M16-04 の編集値を表示する公開画面は特定できず、ケース化しない（[report.md:21](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QN/report.md:21)）。
実際: M16-04 はデッキタグを編集対象とし、既存行の値を更新できる（[M16-04機能設計書:7](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md:7)、[同:46](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md:46)）。F09-02 はデッキに紐づくタグの名称を一覧に、F09-06 はデッキタグの名称を詳細に表示する（[F09-02機能設計書:50](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/f09-02_front_deck_deck_result.md:50)、[F09-06機能設計書:44](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/f09-06_front_deck_deck_show.md:44)）。既存の表示ケースはタグを事前準備で用意しており、管理画面での更新を手順に含まない（[all_test_cases.tsv:3583](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/all_test_cases.tsv:3583)、[同:3777](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/all_test_cases.tsv:3777)）。
判定: 取りこぼし
修正案: タグが紐づく公開済み大会デッキを準備し、M16-04 で既存タグの名称を変更する。変更前後に F09-02 の一覧と F09-06 の詳細をそれぞれ開き、表示名の変化を確かめるケースを各1件追加する。

### 指摘2（重大度: Major）対象: IT-M16-03-QN001・IT-M16-03-QN002
主張: 記載した管理者と投入方法で、ケース専用の店舗・イベントを画面から準備できる（[QN_seed_data.tsv:2](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_seed_data.tsv:2)）。
実際: 管理者シードにあるのはデータ管理とイベント管理の操作権限だけだが、店舗シードは店舗登録画面から作る（[QN_seed_data.tsv:3](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_seed_data.tsv:3)、[同:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_seed_data.tsv:6)）。さらにイベント登録では、選んだ店舗が管理者の編集可能店舗でないと登録画面に留まる（[M13-02機能設計書:101](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m13-02_admin_event_event_edit_delete.md:101)）。新規店舗の登録権限と、その店舗を編集可能にする準備が記載されていない。
判定: 前提不成立
修正案: 店舗登録に使う権限付き管理者と投入手順を明記し、イベントを登録する管理者の編集可能店舗に各ケース専用店舗を含める。

### 指摘3（重大度: Minor）対象: IT-M16-03-QN001・IT-M16-03-QN002
主張: IT-0150 の期待結果で、操作前後の公開側表示の変化を判定できる（[QN_test_cases.tsv:2](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_test_cases.tsv:2)、[同:3](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QN_test_cases.tsv:3)）。
実際: 両ケースの期待結果欄は操作後の色だけを述べる。群の規則は、**期待結果**から操作前後の表示変化が分かる形を求めている（[prompt.md:61](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QN/prompt.md:61)）。
判定: 規約違反
修正案: QN001 は「手順4では対象日が赤色でなく、追加後の手順10では赤色になること」、QN002 は「手順4では赤色で、削除後の手順10では赤色でなくなること」と、各期待結果を前後の照合に書き直す。
