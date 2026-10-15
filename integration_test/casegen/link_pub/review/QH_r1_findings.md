### 指摘1（重大度: Major）対象: IT-M08-04-QH002
主張: 管理画面で会員の住所・会社名を編集すると、公開側の「会員情報住所」も新しい値になる。
実際: 上流設計書が会員住所への転記を定めるのは**新規登録時**で、編集時に既存の会員住所を更新する記述はない（[m08-04 機能設計書:40](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m08-04_admin_customer_customer_edit.md:40)、[同:53](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m08-04_admin_customer_customer_edit.md:53)）。下流は会員情報住所の表示を定めるが、この編集操作との接続は定めていない（[0306 HTML:3917](</home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3917>)）。ケースの期待結果はこの接続を前提にしている（[QH_test_cases.tsv:3](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QH_test_cases.tsv:3)）。
判定: 推測による接続
修正案: このケースを削除する。会員住所への反映を設計書で明示できる操作が見つかった場合に、その操作を上流として作り直す。

### 指摘2（重大度: Major）対象: 群 QH
主張: M08-09→F04-03 は選択状態に依存して結果が定まらないため、ケースにしなかった。
実際: 報告はこの理由で除外している（[report.md:23](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/gen_QH/report.md:23)）。設計書は、管理画面で配送先を更新すること（[0207 HTML:2480](</home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:2480>)）、ご注文方法指定で配送先を選ぶこと（[0304 HTML:1443](</home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1443>)）、F04-03 の初期表示に選択中の配送情報を設定すること（[同:1840](</home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1840>)）を定めている。選択操作を手順に入れれば確認対象を確定できる。
判定: 取りこぼし
修正案: 更新前に旧配送先を選んで F04-03 の初期値を確認し、管理画面で更新後、新配送先を選び直して F04-03 の初期値が変わるケースを追加する。

### 指摘3（重大度: Minor）対象: IT-M08-05-QH001〜003
主張: シード投入により、付与前のポイント残高・履歴とスマレジ側ポイントが1000になる。
実際: シードの投入方法は管理画面で1000ポイントを保存するところまでで、投入後に残高・履歴・連携先の値を確認する手順がない（[QH_seed_data.tsv:9](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QH_seed_data.tsv:9)、[同:11](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_pub/cases/QH_seed_data.tsv:11)）。P5 は、画面や外部システムの操作で作った状態について完了後の値の確認まで求めている（[precond/README.md:27](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond/README.md:27)）。
判定: 規約違反
修正案: 各シードの投入方法に、保存後のポイント残高1000、履歴の該当行、スマレジ側ポイント1000の確認を加える。
