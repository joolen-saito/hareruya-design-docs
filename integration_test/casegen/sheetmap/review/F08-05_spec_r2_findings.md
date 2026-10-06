### 指摘1（パスワードの応答内容）
- 主張: 「パスワードとパスワード（確認用）は、入力値を出さず『********』と表示する」
- 実際: 画面上は「********」だが、実際のパスワード値も再送信用の非表示項目としてHTML応答に含まれる（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:198-210、pf-eccube3/src/Eccube/Resource/template/default/Form/form_layout.twig:78-85）。
- 判定: 事実の誤り
- 修正案: 「画面上は入力値を表示せず『********』と表示する。実際の値は再送信用としてHTML応答に含める」とする。

### 指摘2（返却希望サプライの表示形式）
- 主張: 「確認画面は申込フォーム画面と同じ入力項目を、値を変更できない表示で並べる」
- 実際: 返却希望サプライは、選択項目と自由入力値を「・」で連結した一つの値に整形され、確認画面に表示される（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_order_js.twig:121-132、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:131-137）。
- 判定: 取りこぼし
- 修正案: 返却希望サプライは、選択値と自由入力値を「・」で連結して一つの値として表示すると追記する。

### 指摘3（送信確認用の値が不正な場合）
- 主張: 「確認画面の表示と申込みの登録は、申込入力の必須・形式の検証結果では分岐しない」
- 実際: 確認画面には送信確認用の値が含まれるが、その欠落・不一致を含む申込フォーム全体の検証結果は判定されず、適格請求書発行事業者の登録番号だけを個別に検証した後、確認表示または登録へ進む（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:18、pf-eccube3/app/Plugin/HareruyaEc/Controller/OtcBuyController.php:196-213、235-304）。
- 判定: 取りこぼし
- 修正案: 必須・形式だけでなく、送信確認用の値の検証結果も確認表示・申込み登録の分岐に使用しないと追記する。

### 指摘4（会員登録なしの成功経路）
- 主張: 「成功時出力 | 確認画面の表示。または会員登録と申込みの登録を行ったうえでの完了画面への移動」
- 実際: 会員登録は会員登録ありの送信時だけ実行される。会員登録なしの場合も申込みを登録して完了画面へ移る（pf-eccube3/app/Plugin/HareruyaEc/Controller/OtcBuyController.php:252-256、258-304）。
- 判定: 事実の誤り
- 修正案: 「確認画面の表示。または、会員登録を選んだ場合のみ会員登録を行い、申込み登録後に完了画面へ移動」とする。

### 指摘5（確認メールの送信条件）
- 主張: 「確認メールは、基本情報の仮会員設定が有効なときだけ送る。」
- 実際: この条件はExcel基本設計に既に「基本情報設定で仮会員設定が有効な場合は、確認メールを送信する」と定められている（hareruya-design-docs/integration_test/casegen/sheetmap/materials/F08-05_sheet.txt:47）。
- 判定: Excelとの重複・矛盾
- 修正案: この一文は削除し、Excelにない表示言語によるメールテンプレートの選択条件だけを残す。
