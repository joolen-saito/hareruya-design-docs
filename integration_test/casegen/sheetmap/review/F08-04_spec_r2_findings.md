### 指摘1（確認用入力の不一致）
- 主張: 「メールアドレスとパスワードの形式や、確認用との一致は、確認へ進めるかどうかの判定には用いない。」
- 実際: Excelは、メールアドレスまたはパスワードが確認用入力と一致しない場合をエラーとし、入力値に問題がない場合だけ確認画面へ遷移すると定めている（F08-04_sheet.txt:35-38）。
- 判定: Excelとの重複・矛盾
- 修正案: この一文を削除する。現行ソースが不一致でも確認画面へ進めることは、Excelが定めた条件と異なるため「現行仕様」には記載しない。

### 指摘2（メールアドレス形式エラー時の遷移）
- 主張: 「これらの形式エラーは入力欄ごとに記録されるが、確認画面への遷移は止めない。」
- 実際: メールアドレス欄はブラウザのメールアドレス入力部品として生成され、フォームにはブラウザ検証を無効化する指定がない。そのため、ブラウザが不正と判定するメールアドレスは送信前に止まり、確認画面へ遷移しない（pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/OtcBuy/OtcBuyRepeatedEmailType.php:14-16、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:24,32,45,109）。
- 判定: 事実の誤り
- 修正案: メールアドレスの形式エラーが一律に確認画面へ持ち越される、という記述を改める。ブラウザ検証を通過し、サーバー側だけで検出されるエラーに限って確認画面への遷移を止めない。

### 指摘3（確認用入力の不一致メッセージ）
- 主張: 「表示メッセージ」には、メールアドレスおよびパスワードの確認用入力が一致しない場合の文言がない。
- 実際: 不一致時の文言は、日本語では「同じメールアドレスを入力してください。」「同じパスワードを入力してください。」、英語では「Please enter the same mail address.」「Please enter the same password.」と定義され、確認画面の確認用入力欄直下で表示される（pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/OtcBuy/OtcBuyRepeatedEmailType.php:16、OtcBuyRepeatedPasswordType.php:23、Resource/locale/message.ja.yml:712-717、message.en.yml:671-676、Resource/template/default/OtcBuy/confirm.twig:184-210、confirm.en.twig:171-197）。
- 判定: 取りこぼし
- 修正案: Excelが定めていない具体的な日英のエラー文言と表示位置を「表示メッセージ」に追加する。確認用との一致条件そのものはExcelを正とし、現行ソースとの差は記載しない。

### 指摘4（入力欄のプレースホルダー）
- 主張: 「表示メッセージ」には各入力欄の補助文言はあるが、入力欄内に表示される例示がない。
- 実際: 日本語画面ではメールアドレス欄に「(例)info@hareruyamtg.com」、パスワード欄に「(例)password」を表示し、英語画面ではそれぞれ「info@hareruyamtg.com」「password」を表示する。確認用入力欄も同じ例示を持つ（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:32,45,55,69、register_customer.en.twig:32,45,55,69）。
- 判定: 取りこぼし
- 修正案: 日英それぞれの入力例を「表示メッセージ」または「入出力」に追加する。
