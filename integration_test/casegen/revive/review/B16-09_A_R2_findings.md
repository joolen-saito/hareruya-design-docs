### 指摘（B16-09 / IT-B16-09-005）
- 主張: [書き直したケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:3)は管理画面の入口のパスだけを探し、元ケースで確かめていた管理ページ配下の公開ページを対象から外した。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt:33) L0032は「以下のページおよびそれ以降のページは取得しない」、L0033は「管理ページ」と定める。入口の非掲載だけでは「それ以降」の非掲載を確かめられない。
- 判定: 処置の誤り
- 修正案: 管理ページ配下のURLも非掲載の確認対象に戻す。確認できる配下ページを用意できない場合は、元ケースの定めを検証できないとして処置を見直す。

### 指摘（B16-09 / IT-B16-09-006）
- 主張: [処置](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_dispositions.tsv:7)は「配下のページは生成の手段なので外した」とし、[ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:4)は商品検索ページ自体の非掲載だけを確かめる。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt:33) L0032は「以下のページおよびそれ以降のページは取得しない」、L0034は「商品検索ページ(日本語・英語)」と定める。「それ以降」も依頼文が採用する非掲載の定めである。
- 判定: 処置の誤り
- 修正案: 商品検索ページの先にあるページの非掲載も確かめる。確認できないなら、親ページだけの検証を元ケース全体の復帰として扱わない。

### 指摘（B16-09 / IT-B16-09-007）
- 主張: [処置](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_dispositions.tsv:8)は配下ページを生成の手段として外し、[ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:5)はカードリスト購入ページ自体だけを探す。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt:33) L0032の「以下のページおよびそれ以降のページ」は、L0035の「カードリスト購入ページ(日本語・英語)」にも掛かる。
- 判定: 処置の誤り
- 修正案: カードリスト購入ページの先にあるページの非掲載も確認する。確認できない場合は、元ケースを戻す処置を見直す。

### 指摘（B16-09 / IT-B16-09-008）
- 主張: [処置](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_dispositions.tsv:9)は、デッキ検索ページとデッキのトップページが同じか不明なので「どちらを採るかが決まらない」として戻さない。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt:37) L0036は「デッキ検索ページ(日本語・英語)」を非掲載対象とする。[依頼文](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/prompts/B16-09_A.md:38)は、L0089のデッキトップと同じURLで食い違う場合も「Excel由来を採る」と明記する。異なるURLであっても、デッキ検索ページ自体の非掲載は変わらない。
- 判定: 処置の誤り
- 修正案: デッキ検索ページを戻さない理由として、この同一性の不明さは使えない。対象URLの非掲載を確かめる形で復帰を検討する。

### 指摘（B16-09 / IT-B16-09-009）
- 主張: [処置](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_dispositions.tsv:10)は配下ページを生成の手段として外し、[ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:6)はイベント情報ページ自体の非掲載だけを確かめる。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt:33) L0032の「以下のページおよびそれ以降のページ」は、L0037の「イベント情報(日本語・英語)」にも掛かる。
- 判定: 処置の誤り
- 修正案: イベント情報ページの先にあるページの非掲載も確認する。確認できない場合は、元ケースを戻す処置を見直す。

### 指摘（B16-09 / IT-B16-09-034）
- 主張: [ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:16)は、管理画面のデッキ一覧にある「デッキID欄」から2件のIDを控える手順とする。
- 実際: [管理画面の一覧テンプレート](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:539)の列見出しは選択欄・デッキ詳細・操作欄であり、デッキID欄はない。IDは[編集画面へのリンク先](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:553)に使われている。
- 判定: 確かめる場所の誤り
- 修正案: 一覧のデッキ名から編集画面を開き、そのアドレスに含まれるIDを控える手順に直す。
