### 指摘1（重大度: Major）対象: IT-M09-07-QI001・IT-M09-07-QI002

主張: 「マイページ_ロングバナー掲載」で始まるブロックを登録・削除すれば、マイページのロングバナー欄に画像が表示・非表示になる（`integration_test/casegen/link_pub/cases/QI_test_cases.tsv:2`、`:3`）。

実際: マイページ設計はブロック管理からの追加・削除を指示するが、この接頭辞は「今までのブロック」の**参考情報**であり、新規ブロックを表示対象にする規則とは書いていない（`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2140`、`:2168`）。ブロック名は管理用名称とされる（`excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html:1453`）。レイアウト管理にはブロック配置を保存する処理があるが、両ケースにはマイページへの配置がない（`functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md:9`〜`:15`）。

判定: 推測による接続

修正案: マイページで参照するブロックの特定方法と必要な配置操作を設計書で確定し、手順・シードを書き直す。確定できなければ両ケースを削除する。

### 指摘2（重大度: Major）対象: IT-M09-10-QI001

主張: シードの画面操作で販売価格500円の2商品を用意でき、タイルタグ変更後の表示を確認できる（`integration_test/casegen/link_pub/cases/QI_seed_data.tsv:5`、`integration_test/casegen/link_pub/cases/QI_test_cases.tsv:4`）。

実際: シードの各「商品規格」登録手順は基準価格500円と買取価格300円を入力するが、**販売価格を入力しない**（`integration_test/casegen/link_pub/cases/QI_seed_data.tsv:5`）。商品規格登録編集の画面項目では販売価格と基準価格は別の必須項目である（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:3624`、`:3626`）。したがって、記載どおりでは商品規格の登録を完了できない。

判定: 前提不成立

修正案: 2商品の商品規格登録で販売価格500円も入力し、登録後に販売価格と支店在庫を確認する。

### 指摘3（重大度: Minor）対象: 群 QI

主張: 報告書は6件を作成し、バナー差し替えとおすすめ特集のケースを採用したと記載する（`integration_test/casegen/link_pub/gen_QI/report.md:7`〜`:21`）。

実際: 現行のケースファイルは3件で、内訳はロングバナー2件とタイル1件である（`integration_test/casegen/link_pub/cases/QI_test_cases.tsv:2`〜`:4`）。報告書の対応表・重複確認・到達可能性にも削除済みケースが残っている（`integration_test/casegen/link_pub/gen_QI/report.md:31`〜`:58`）。

判定: 規約違反

修正案: 報告書の作成数、組ごとの評価、対応表、重複確認、到達可能性を現行3件に合わせて更新する。
