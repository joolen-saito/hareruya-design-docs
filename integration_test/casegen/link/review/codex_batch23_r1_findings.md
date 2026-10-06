設計書を正本として照合し、実装コードは M03-36 のシード表現確認にのみ補助利用した。

### 指摘1（重大度: Major）対象: IT-B06-02-L002
主張: IT-0334（バッチ→参照画面）として、バッチ集計値がCSVに出力されることを確認する。

実際: IT-0334の下流は「参照画面」に限定される（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:335`）。本ケースの下流・期待結果はCSV出力である（`integration_test/casegen/link/cases/B06-02_link_test_cases.tsv:3`）。CSV値の同値確認はIT-0071・IT-0083の担当である（同`:72,84`）。パイロットでも同じ裁定をしている（`integration_test/casegen/link/review/pilot_r1_dispositions.md:17`）。

判定: 前提不成立

修正案: IT-0334から削除し、CSVの取得元との同値確認としてIT-0071、数量・金額の画面／DBとの一致まで見るならIT-0083へ付け替える。

### 指摘2（重大度: Major）対象: IT-M03-14-L001〜L006、IT-M03-16-L001〜L005、IT-M03-17-L002・L003・L005・L006、IT-M03-20-L001・L002
主張: マスタ登録・更新・削除後のCSV出力、CSV取込、マスタ一覧、表の列見出し、項目の初期選択値もIT-0335／IT-0336で確認できる。

実際: IT-0335／IT-0336は、参照側機能の「選択肢」への追加・変更・除外だけを判定する（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:336-337`）。対象ケースはそれぞれCSV出力・取込、一覧表示、表の列、取込結果であり、選択肢を確認していない（`integration_test/casegen/link/cases/M03-14_link_test_cases.tsv:2-7`、`M03-16_link_test_cases.tsv:2-6`、`M03-17_link_test_cases.tsv:3-4,6-7`、`M03-20_link_test_cases.tsv:2-3`）。

判定: 前提不成立

修正案:

- M03-14-L001・L002、M03-16-L003、M03-20-L002はIT-0071／IT-0083へ付け替える。
- M03-14-L003〜L006、M03-16-L001・L002・L004・L005、M03-17-L003・L006、M03-20-L001は本連携ケースから削除する。
- M03-17-L002・L005は現行文では削除する。動的な表見出しも対象にしたい場合だけ、依頼者判断でIT-0335／IT-0336を「選択肢、または当該マスタから動的生成すると設計書に明記された表の列見出し」まで拡張する。
- 現行文で残せるのはM03-17-L001・L004、M03-18-L001・L002、M03-20-L003である。

### 指摘3（重大度: Major）対象: IT-M03-02-L001〜L004、IT-M03-29-L001・L002、IT-M03-35-L001〜L003、IT-M03-36-L001・L002、IT-M03-37-L001・L002、IT-M03-38-L001〜L004
主張: 商品1件の属性、商品とマスタの紐付け、公開状態、買取減額率の割当も「設定値」としてIT-0337を適用できる。

実際: IT-0337は「設定値を変更した場合、その設定を参照する別機能の挙動」の判定である（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:338`）。対象ケースの上流は、商品編集、商品―タグ／部門／略称タグの紐付け、商品への買取減額率割当、商品の公開状態であり、システム・業務設定値ではない（`integration_test/casegen/link/cases/M03-02_link_test_cases.tsv:2-5`、`M03-29_link_test_cases.tsv:2-3`、`M03-35_link_test_cases.tsv:2-4`、`M03-36_link_test_cases.tsv:2-3`、`M03-37_link_test_cases.tsv:2-3`、`M03-38_link_test_cases.tsv:2-5`）。

判定: 前提不成立

修正案:

- M03-02-L001・L002はIT-0071／IT-0083へ、L003・L004は管理画面更新の公開側反映であるIT-0150へ付け替える（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:151`）。
- M03-29-L001、M03-35-L001、M03-37-L001は削除拒否のIT-0035へ、各L002は削除成功のIT-0034へ付け替える（同`:35-36`）。
- M03-35-L003は個別商品の紐付け→別バッチ→メールであり、本4判定から削除する。
- M03-36-L001・L002は本4判定から削除する。
- M03-38-L001〜L004はIT-0150へ付け替える。
- 個別業務データまで受けたい場合は、IT-0337を書き換えるより「業務データの属性・紐付け変更→別機能の挙動切替」を新しい判定単位として追加する。既存IT-0337を書き換えるなら「設定値または他機能の判定条件として設計書に明示された業務データの属性・紐付けを変更した場合…」となるが、適用範囲が大幅に広がる。

### 指摘4（重大度: Major）対象: M03-14、M03-16
主張: M03-14は6件、M03-16は5件を作成しており、選択肢連携の対象を網羅した。

実際: 商品編集の略称タグ欄は「略称タグ一覧を選択肢にセットする」と明記されている（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1585`）。M03-14は略称タグを追加・更新する（`functions/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.md:54-58`）、M03-16もCSVから略称タグを追加・更新する（`functions/pf-eccube3/m03-16_admin_product_product_storage_code_import.md:31-35,53-58`）。しかし両成果物はM03-02の商品編集画面を下流候補として評価せず、選択肢を1件も確認していない。

判定: 取りこぼし

修正案:

- M03-14に、略称タグ登録後にM03-02の商品編集を開き、その名称が選択肢に追加されるIT-0335を1件追加する。
- M03-14に、未使用略称タグ削除後に同選択肢から除外されるIT-0336を1件追加する。
- M03-16に、CSVで略称タグを追加または改名後、商品編集の選択肢へ反映されるIT-0335を1件追加する。登録と更新は同一判定なので一方でよい。
- 指摘2の範囲外ケースとの置換とする。

### 指摘5（重大度: Major）対象: IT-M03-36-L001・L002
主張: 買取減額率を「SP=70%・MP=50%・HP=30%」としてDB投入すれば、3500・2500・1500という期待値を実行可能な形で確認できる。

実際: 上流設計はCSVで買取減額率IDを商品へ設定することしか定めず、率の格納表現を定めていない（`functions/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.md:25-38`）。下流設計は率を掛けて100円単位で切り上げる規則だけを定める（`functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md:23-29`）。報告自身も百分率か小数か不明と認めている（`integration_test/casegen/link/gen_M03-36/report.md:40-43`）一方、シードはDB投入なのに「70%」としか書いていない（`integration_test/casegen/link/cases/M03-36_link_seed_data.tsv:5,8`）。参考に現実装の初期データは0.95、0.9等の小数である（`/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260514000000.php:91-98`）。

判定: 前提不成立

修正案: 別判定単位で残す場合でも、シードを「SP=0.70（業務上70%）・MP=0.50・HP=0.30」のように実行可能な値へ直し、その表現を設計または補助資料で根拠付ける。根拠を確定できない間はケースを削除する。

### 指摘6（重大度: Minor）対象: IT-B08-03-L001・L002
主張: 日本語会員と英語会員で2件のIT-0334が必要である。

実際: 両ケースは同じバッチが登録したメール送信履歴を、同じM08-07の件名・本文で確認しており、相違は言語とデータ値だけである（`integration_test/casegen/link/cases/B08-03_link_test_cases.tsv:2-3`）。IT-0334の判定内容は言語分岐ではなく、バッチ更新データの参照画面への受け渡しである（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:335`）。言語分岐自体は上流機能の既存ケースの担当である。

判定: 重複

修正案: どちらか1件を削除するか、B08-01と同様に日本語・英語の2会員を1ケースへまとめ、メール履歴への受け渡し判定は1件にする。

### 指摘7（重大度: Minor）対象: IT-M03-29-L001・L002、IT-M03-35-L001・L002
主張: 結合ケースの期待結果で「商品で使用されているため…削除することができません」「削除しました」等を逐語照合する。

実際: 対象ケースは期待結果にメッセージ全文を記載している（`integration_test/casegen/link/cases/M03-29_link_test_cases.tsv:2-3`、`M03-35_link_test_cases.tsv:2-3`）。画面表示文言の照合はe2e・手動の担当である（`integration_test/SCOPE.md:64-65`）。依頼文も逐語照合を禁止している（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:63`）。

判定: 手順不備

修正案: 期待結果を「削除が拒否され対象が残る」「削除が成功し対象が存在しない」に限定する。メッセージ文言は削除する。

### 指摘8（重大度: Minor）対象: M03-29
主張: M03-02商品編集は「0204 識別ID26」により機能全体が廃止されているため下流候補から外す。

実際: M03-29報告はこの理由でM03-02を除外している（`integration_test/casegen/link/gen_M03-29/report.md:31-34`）。HTML設計書で廃止されるのは識別ID26の「複製」ボタンだけである（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1554,1598`）。同画面の売上分析タグ選択肢は現存する（同`:1586`）。したがって、M03-17がM03-02を選択肢確認の下流として採用した判断が正しい（`integration_test/casegen/link/gen_M03-17/report.md:9,13`）。機能設計書側の「機能全体を廃止」という要約もHTML原文を誤読している（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:5-6`）。

判定: 型の欠陥

修正案: M03-29の報告を「複製ボタンのみ廃止」に訂正する。現行IT-0337ではM03-29→M03-02も対象外だが、今後の候補探索でM03-02全体を除外してはならない。

### 指摘9（重大度: Major）対象: GEN_LINK_PROMPT_TEMPLATE.md・AGENT_BRIEF.md・link_targets.tsv・build_link_targets.py・verify_link.py
主張: 現在の依頼文・台帳・検査で、IT-0334〜IT-0337の適用範囲を十分に制限できる。

実際: テンプレートは下流を「取得・表示・選択肢化・検索条件化」等と一括して広く許可しており、判定ID別の対象制限がない（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:37-55`）。BriefにはCSV・メール・バッチを除外するとあるが（`integration_test/casegen/link/AGENT_BRIEF.md:11`）、実成果物では無視されている。台帳生成は`mtb_`更新だけでマスタ・設定上流と認定する（`integration_test/casegen/link/build_link_targets.py:51-64`）ため、読取専用M02-01、商品編集M03-02、紐付け更新M03-29／35／37、個別商品更新M03-34／36／38、在庫取引M04-03まで混入している（`integration_test/casegen/link/link_targets.tsv:28-41`）。検査は台帳に判定IDがあるかしか見ない（`integration_test/casegen/link/verify_link.py:67-72`）。

判定: 型の欠陥

修正案:

- テンプレート本文に判定ID別のハードゲートを追加する。
  - IT-0334: 下流は参照画面のみ。CSV出力・CSV取込・メール・別バッチは禁止。
  - IT-0335／0336: 上流は再利用されるマスタ、期待対象は下流の選択肢だけ。
  - IT-0337: 上流操作はシステム／業務設定値の変更。商品・受注・在庫等の個別データと紐付け行を除外。
- 台帳に「上流種別」「下流媒体」「期待対象」「適用可否・理由」を追加し、`mtb_`は候補抽出にだけ使う。判定IDの付与はレビュー済み分類表／allowlistで行う。
- `verify_link.py`でも判定IDと上流種別・下流媒体・期待対象の不整合をエラーにする。
- M03-17-L002／L005の表列を残したい場合のみ、IT-0335／0336を「選択肢またはマスタから動的生成すると明記された表の列見出し」へ拡張する。
- M04-03の在庫編集→承認一覧・在庫履歴は価値があるが、現行4判定には入らない（`integration_test/casegen/link/gen_M04-03/report.md:15,25`）。IT-0334を無理に広げず、「管理画面更新→別の参照画面」の新判定単位を設ける。

### 指摘10（重大度: Minor）対象: B05-02・成果物件数
主張: B05-02は2件で、対象成果物は計65件である。

実際: 現在のB05-02ケースファイルにはL001〜L003の3件があり（`integration_test/casegen/link/cases/B05-02_link_test_cases.tsv:2-4`）、報告書も3件と明記する（`integration_test/casegen/link/gen_B05-02/report.md:3-5`）。指定33機能の現ファイルを合計すると66件である。追加されたL003自体は、上流の履歴値と画面項目の対応が設計書にある（`functions/pf-eccube3/b05-02_batch_order_order_resend_mail.md:9-23`）ため削除理由はない。

判定: 型の欠陥

修正案: 対象一覧を「B05-02（3）、計66件」に更新する。

0件の8機能（B05-03・B05-04・B05-05・B05-06・B13-02・M02-01・M03-34・M04-03）については、現行IT-0334〜IT-0337の範囲内で追加すべき取りこぼしは確認できなかった。
