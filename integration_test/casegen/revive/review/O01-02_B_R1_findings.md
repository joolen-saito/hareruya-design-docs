### 指摘（O01-02 / IT-O01-02-042）
- 主張: 成功ダイアログと画面遷移、管理画面の買取状況と査定明細、DBの商品規格・言語・状態を一つの期待結果にしている（[ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:2)）。
- 実際: 設計書は査定明細の送信項目を定め（[設計書L0113〜L0123](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:113)）、成功後の画面遷移を別に定める（[同L0112](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:112)）。
- 判定: 複数の期待結果
- 修正案: ECCUBEに残る査定結果を主たる判定に絞り、アプリの成功表示・遷移を同じ期待結果へ混ぜない。

### 指摘（O01-02 / IT-O01-02-046）
- 主張: 商品規格に紐づかない「個別O0102-046」と「5円商品」が、管理画面の「まとめて買取の査定明細」2件として表示されるとしている（[ケース6行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:6)）。
- 実際: 査定終了APIの設計書は「商品規格IDが0の明細は個別入力商品として扱い」と定める（[A07-05設計書22行](/home/y-saito/Developments/hareruya-design-docs/functions/pf-api/a07-05_api_online_purchase_buy_order_end.md:22)）。買取情報編集画面は「選んで買取・まとめて買取・個別入力商品」を区別する（[M07-03設計書13行](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md:13)、[既存ケース13行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:13)）。
- 判定: 確かめる場所の誤り
- 修正案: 管理画面では個別入力商品情報の欄を確認する形に直す。「まとめて買取」の欄に2件出る期待は外す。

### 指摘（O01-02 / IT-O01-02-050）
- 主張: 査定画面にとどまることと、DBの受注状態・査定明細0件を一つの期待結果にしている（[ケース9行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:9)）。
- 実際: 設計書は「いいえ」の場合に「何もしない」と定める（[設計書L0108](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:108)）。買取状況は管理画面に表示される（[M07-03既存ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:2)）。
- 判定: 確かめる場所の誤り
- 修正案: 画面に出る買取状況は管理画面で確認する。DB確認は画面に出ない査定明細の副作用に限る。

### 指摘（O01-02 / IT-O01-02-059）
- 主張: アプリの成功ダイアログ・画面維持と、DBのフリーコメント更新を一つの期待結果にしている（[ケース12行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:12)）。
- 実際: 設計書はコメント更新後の画面維持を定め（[設計書L0103](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:103)）、更新成功時の文言を別に定める（[同L0172](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:172)）。
- 判定: 複数の期待結果
- 修正案: 保存されたコメントの判定と、アプリの成功表示・画面維持の判定を分けて整理する。

### 指摘（O01-02 / IT-O01-02-061）
- 主張: アプリのダイアログ・遷移と、DBの買取状況を一つの期待結果にしている（[ケース13行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:13)）。
- 実際: 設計書は中断時の移動先を「業務選択画面」とし（[設計書L0126〜L0129](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:126)）、買取状況は管理画面でも表示される（[M07-03既存ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:2)）。
- 判定: 複数の期待結果
- 修正案: アプリの表示とECCUBEに残る買取状況を別の判定として整理する。買取状況の確認先には管理画面を使う。

### 指摘（O01-02 / IT-O01-02-066）
- 主張: 業務選択画面への遷移、S3ファイルの不存在、DBの査定中断状態を一つの期待結果にしている（[ケース18行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:18)）。
- 実際: 設計書は、端末に査定途中データが無いときは「保管を行わず、成功として扱う」と定める（[設計書L0137](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:137)）。ケースはその結果をアプリ・S3・DBの三か所で別々に判定している。
- 判定: 複数の期待結果
- 修正案: このケースの判定を保管ファイルの不存在に絞り、画面遷移と買取状況を同じ期待結果に混ぜない。

### 指摘（O01-02 / IT-O01-02-067）
- 主張: お客様選択画面への遷移、DBの査定中断状態、S3ファイルの存在を一つの期待結果にしている（[ケース19行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:19)）。
- 実際: 設計書は「お客様切り替え」の移動先と、保管するデータ・状態更新を別に定める（[設計書L0126〜L0135](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:126)）。
- 判定: 複数の期待結果
- 修正案: 画面遷移、買取状況、保管ファイルの確認を一つの判定に混ぜない。

### 指摘（O01-02 / IT-O01-02-068）
- 主張: ログイン画面への遷移、DBの査定中断状態、S3ファイルの存在を一つの期待結果にしている（[ケース20行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:20)）。
- 実際: 設計書は「ログアウト」の移動先と、保管するデータ・状態更新を別に定める（[設計書L0126〜L0135](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:126)）。
- 判定: 複数の期待結果
- 修正案: 画面遷移、買取状況、保管ファイルの確認を一つの判定に混ぜない。

### 指摘（O01-02 / IT-O01-02-069）
- 主張: アプリの終了、DBの査定中断状態、S3ファイルの存在を一つの期待結果にしている（[ケース21行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:21)）。
- 実際: 設計書は「ウィンドウを閉じたとき」の移動先を「アプリを終了する」とし、保管するデータ・状態更新を別に定める（[設計書L0126〜L0135](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-02/design.txt:126)）。
- 判定: 複数の期待結果
- 修正案: アプリ終了、買取状況、保管ファイルの確認を一つの判定に混ぜない。

### 指摘（O01-02 / IT-O01-02-077）
- 主張: 買取状況「商品到着」をDBだけで確かめるとしている（[ケース23行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:23)）。
- 実際: 買取情報編集画面には「現在の買取状況」が表示される（[M07-03既存ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:2)）。
- 判定: 確かめる場所の誤り
- 修正案: 買取状況は管理画面で確認する。画面に出ない副作用の確認だけDBに残す。

### 指摘（O01-02 / IT-O01-02-082）
- 主張: 「査定中断」から「査定再開」への変化をDBだけで確かめるとしている（[ケース25行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:25)）。
- 実際: 買取情報編集画面には「現在の買取状況」が表示される（[M07-03既存ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:2)）。
- 判定: 確かめる場所の誤り
- 修正案: 買取状況「査定再開」は買取情報編集画面で確認する。

### 指摘（O01-02 / IT-O01-02-083）
- 主張: 「MTGBuyer査定完了」への変化をDBだけで確かめるとしている（[ケース26行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-02_B_rv_test_cases.tsv:26)）。
- 実際: 買取情報編集画面には「現在の買取状況」が表示される（[M07-03既存ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/M07-03_test_cases.tsv:2)）。
- 判定: 確かめる場所の誤り
- 修正案: 買取状況「MTGBuyer査定完了」は買取情報編集画面で確認する。
