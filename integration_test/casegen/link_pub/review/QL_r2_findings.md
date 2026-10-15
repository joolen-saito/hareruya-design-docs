### 指摘1（重大度: Major）対象: IT-M14-08-QL001
主張: 事前準備でカードセットXとWを登録し、Wのリリース日を更新できる。
実際: Xの登録後、「同じ画面で」Wの値を入力して登録するとしている（`integration_test/casegen/link_pub/cases/QL_seed_data.tsv:7`）。設計書では、保存後は登録したカードセットの**編集画面**へ戻り、既存カードセットの保存は項目を上書きすると定める（`functions/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.md:16-18`）。記載どおりではXがWの値に更新され、2件を用意できない。
判定: 前提不成立
修正案: Xの登録後、カードセット管理から「新規登録」を改めて開いてWを登録する手順に直す。

### 指摘2（重大度: Major）対象: IT-M14-10-QL005・IT-M14-10-QL006
主張: フォーマット名(日)だけを変更すると、公開側の見出し・題名が指定した日本語名に変わる。
実際: 両シードの日英名は異なり、手順では日本語名だけを更新する（`integration_test/casegen/link_pub/cases/QL_seed_data.tsv:14-15`、`integration_test/casegen/link_pub/cases/QL_test_cases.tsv:8-9`）。下流設計書は見出しと題名に「フォーマット名」を使うと記すが、日英どちらの項目かは定めていない（`functions/pf-eccube3/f09-01_front_deck_deck_index.md:118`、`functions/pf-eccube3/f09-02_front_deck_deck_result.md:59-61`）。期待する表示値を設計書から確定できない。
判定: 期待結果の捏造
修正案: 両ケースとも操作前の日英名を同値にし、手順で日英名を同じ新値へ更新する。

### 指摘3（重大度: Minor）対象: IT-M14-10-QL001・IT-M14-10-QL002
主張: フォーマットの名称変更と並び順変更を、別々のIT-0150ケースで商品詳細画面に対して判定する。
実際: どちらもM14-10のフォーマット編集からF03-02の商品詳細画面への反映を確認している（`integration_test/casegen/link_pub/cases/QL_test_cases.tsv:4-5`）。依頼文は、同じ上流機能と下流画面の組で項目違いの同じ判定を増やさず、複数項目を一つの期待結果で確認すると定める（`integration_test/casegen/link_pub/gen_QL/prompt.md:90-91`）。
判定: 重複
修正案: 1件に統合し、同じ編集操作で名称と並び順を変更して、商品詳細で両方の変化を確認する。

### 指摘4（重大度: Minor）対象: IT-M14-10-QL004
主張: イベント登録時の必須項目「ルール適用度」は「選択肢の先頭の値」で準備できる。
実際: シードは選ぶ値を記していない（`integration_test/casegen/link_pub/cases/QL_seed_data.tsv:13`）。設計書ではルール適用度は必須で、選択肢はマスタを参照する（`excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1439`）。「先頭」は固定の値ではなく、事前準備を値付きで記す規約を満たさない（`integration_test/casegen/precond/README.md:27`）。
判定: 規約違反
修正案: 使用するルール適用度の具体的な名称をシードの状態と投入方法に記す。
