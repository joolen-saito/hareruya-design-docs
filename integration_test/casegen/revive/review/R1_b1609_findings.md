### 指摘（B16-09 / IT-B16-09-006）
- 主張: [書き直したケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:4)は、日本語・英語の商品検索ページのアドレスを、日本語のページのサイトマップだけで探し、両方が載らないと判定する。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt) L0055は「XML の中に出力する各URLにも、要求時の言語区分」を引き継ぐと定める。L0034は商品検索ページを「日本語・英語」とも載せないと定める。日本語のサイトマップだけでは英語側の非掲載を検証できない。
- 判定: 成立しない前提・手順
- 修正案: 英語のページのサイトマップも取得し、英語の商品検索ページのアドレスはそこで確かめる。

### 指摘（B16-09 / IT-B16-09-007）
- 主張: [書き直したケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:5)は、日本語・英語のカードリスト購入ページを、日本語のページのサイトマップだけで探す。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt) L0055は各URLに要求時の言語区分を引き継ぐと定め、L0035は両言語のカードリスト購入ページを載せないと定める。英語側は未検証になる。
- 判定: 成立しない前提・手順
- 修正案: 英語のページのサイトマップでも、英語のカードリスト購入ページの非掲載を確かめる。

### 指摘（B16-09 / IT-B16-09-009）
- 主張: [書き直したケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:6)は、日本語・英語のイベント情報を、日本語のページのサイトマップだけで探す。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt) L0055は各URLに要求時の言語区分を引き継ぐと定め、L0037は両言語のイベント情報を載せないと定める。英語側は未検証になる。
- 判定: 成立しない前提・手順
- 修正案: 英語のページのサイトマップでも、英語のイベント情報の非掲載を確かめる。

### 指摘（B16-09 / IT-B16-09-015）
- 主張: [書き直したケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:10)は、数字以外のページ番号を指定した応答に、特定商品の画像URLが「含まれないこと」を期待する。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt) L0064の定めは「数字以外のときは要求先に一致しない」であり、その応答本文に特定の画像URLが含まれるかは定めていない。
- 判定: 設計書に無い期待
- 修正案: 画像URLの不在を期待結果にしない。要求先の不一致を観測できない場合は、このケースを戻さない。

### 指摘（B16-09 / IT-B16-09-046）
- 主張: [書き直したケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_A_rv_test_cases.tsv:28)の期待結果には、商品のサイトマップへの掲載可否と、手順後に管理画面の設定が無効へ戻っていることが混在する。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt) L0080が定めるのは、在庫なし商品を隠す設定が有効なときの掲載条件である。設定を戻す操作は[共通環境シード](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_rv_shared_seeds.tsv:2)の環境復旧手順に当たる。
- 判定: 複数の期待結果
- 修正案: 設定を無効へ戻す手順は残し、期待結果はサイトマップでの掲載可否に限る。


### 指摘（B16-09 / IT-B16-09-065）
- 主張: [処置](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_B_rv_dispositions.tsv:19)は「直して戻す」とし、[ケース](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/B16-09_B_rv_test_cases.tsv:18)はDBの登録件数と更新日時が変わらないことを確かめる。
- 実際: [設計書](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/B16-09/design.txt) L0102の「データの登録も更新も行わない」を確かめるケースであり、[著者への依頼文](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/prompts/B16-09_B.md:36)が対象とする「サイトマップにどの情報が出力されるか」は確かめていない。
- 判定: 処置の誤り
- 修正案: 出力内容を確かめるケースへすり替えず、IT-B16-09-065は戻さない処置にする。
