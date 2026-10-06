# フロント 店頭買取管理 — 会員登録フォーム

## 業務ロジック

### 画面を開く条件と入力の保持

経路に含まれる店舗識別名から店舗を特定できないときは、ページが見つからない扱い（404）とする。

店舗を特定できても、エントリー開始済みかつ申込フォーム送信済みの場合だけ画面を表示し、いずれか一方でも満たさなければエントリーへ戻す。

画面を表示する時点で、申込フォームの入力内容と適格請求書発行事業者の入力内容を保持する。保持した内容は、この画面から確認へ進むときに併合される。

### メールアドレスとパスワードの入力の形

メールアドレスとメールアドレス(確認用)は、前後の空白を除いて受け付ける。メールアドレスの形式は厳格に確かめ、半角の表示可能な文字と空白だけで構成されているかも検証する。

パスワードとパスワード(確認用)も、半角の表示可能な文字と空白だけで構成されているかを検証する。

メールアドレス欄はメールアドレス専用の入力部品で、ブラウザの検証が無効化されていないため、ブラウザが不正と判定する値は送信前に止まる。ブラウザの検証を通過し、サーバー側だけで見つかった形式エラーは、既登録・同一の判定に該当しない限り確認画面への遷移を止めず、確認画面に表示する。

メールアドレスとパスワードの入力欄はいずれも、入力が空であること自体は形式の検証では誤りとしない。

画面には、メールアドレス欄の下に、「.@」（@の前にドット）と「..」（ドット2つ）を含むメールアドレスは利用できない旨の注記を表示する。

### 次のページへ進むときの入力確認

| 操作 | 条件 | 結果 |
| --- | --- | --- |
| 次のページへ進む | メールアドレス・メールアドレス(確認用)・パスワード・パスワード(確認用)のうち1つでも未入力 | 送信せず、「会員登録される方はメールアドレス、パスワードも入力してください。」を知らせて、この画面に留まる |

4つの未入力チェックを通過すると、通常のフォーム送信に進む。送信するときの動作の種別は確認とする。

### 会員登録をスキップするとき

| 操作 | 条件 | 結果 |
| --- | --- | --- |
| 会員登録をスキップする | メールアドレス・メールアドレス(確認用)・パスワード・パスワード(確認用)のうち1つでも入力されている | 送信せず、「会員登録される方は「次のページへ進む」を押してください。」を知らせて、この画面に留まる |

4つとも空のときは、そのまま確認へ送信する。送信するときの動作の種別は、次のページへ進むときと同じ確認とする。

### 確認へ進む前の判定

確認へ送信されたとき、メールアドレスが入力されている場合に限り、次の2つを判定する。メールアドレスが入力されていないときは、どちらも判定しない。

| 判定 | 内容 |
| --- | --- |
| メールアドレスの既登録 | 入力したメールアドレスで登録済みの会員がいるか |
| メールアドレスとパスワードの同一 | メールアドレスとパスワードが完全に一致するか（大文字小文字も区別して比較する） |

どちらか一方でも該当すれば、確認へは進まず、会員登録フォームを再表示する。両方に該当するときは、両方のメッセージを同時に表示する。該当したメッセージは、既登録ならメールアドレス欄の下に、同一ならパスワード欄の下に表示する。再表示では、4つの入力欄は送信した値が保持され、利用規約への同意欄は未チェックに戻る。

どちらにも該当しなければ、確認画面へ進む。

### 入力時間が切れたとき

入力時間が切れたとき、この画面に表示中の入力欄の値を初期化してエントリーへ戻す。戻り先は、英語表示の画面でも日本語表示のエントリーとする。保持済みの適格請求書発行事業者の入力は、この時点では消去しない。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 申込フォームと適格請求書発行事業者の保持済みの入力 |
| 成功時出力 | 確認への送信（動作の種別は確認） |
| 失敗時出力 | 店舗が無いときの404、エントリーへの戻し、既登録・同一による会員登録フォームの再表示、未入力・入力済みのダイアログ表示 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F08-04-MSG-001 | メールアドレス欄直下 | 既に利用されているメールアドレスです。 | 入力したメールアドレスで登録済みの会員がいるとき | 会員登録フォームを再表示し、確認へ進まない |
| F08-04-MSG-001 | メールアドレス欄直下（英語表示時） | It is already used email address. | 入力したメールアドレスで登録済みの会員がいるとき | 会員登録フォームを再表示し、確認へ進まない |
| F08-04-MSG-002 | パスワード欄直下 | メールアドレスとパスワードは異なる文字列を使用してください。 | メールアドレスとパスワードが完全に一致するとき | 会員登録フォームを再表示し、確認へ進まない |
| F08-04-MSG-002 | パスワード欄直下（英語表示時） | Please use different character string for E-mail and Password. | メールアドレスとパスワードが完全に一致するとき | 会員登録フォームを再表示し、確認へ進まない |
| F08-04-MSG-003 | 画面中央(ダイアログ) | 会員登録される方はメールアドレス、パスワードも入力してください。 | 「次のページへ進む」を押したとき、メールアドレス・メールアドレス(確認用)・パスワード・パスワード(確認用)のいずれかが未入力 | 送信せず、この画面に留まる |
| F08-04-MSG-003 | 画面中央(ダイアログ)（英語表示時） | If you have a Hareruya Account, please enter your email address and your password. | 「次のページへ進む」を押したとき、メールアドレス・メールアドレス(確認用)・パスワード・パスワード(確認用)のいずれかが未入力 | 送信せず、この画面に留まる |
| F08-04-MSG-004 | 画面中央(ダイアログ) | 会員登録される方は「次のページへ進む」を押してください。 | 「会員登録をスキップする」を押したとき、4つの入力欄のいずれかに入力がある | 送信せず、この画面に留まる |
| F08-04-MSG-004 | 画面中央(ダイアログ)（英語表示時） | If you are registering a membership, please click the ”Next Page” button. | 「会員登録をスキップする」を押したとき、4つの入力欄のいずれかに入力がある | 送信せず、この画面に留まる |
| — | メールアドレス欄の下 | ※「.@ (@の前にドット)」、「.. (ドット2つ)」を含むメールアドレスはご利用いただけません | 会員登録フォームを表示したとき | 注記を表示する |
| — | メールアドレス(確認用)欄の下 | メールアドレス確認のため再度入力をお願いします | 会員登録フォームを表示したとき | 補助文言を表示する |
| — | メールアドレス(確認用)欄の下（英語表示時） | Please type in your email address again to confirm. | 会員登録フォームを表示したとき | 補助文言を表示する |
| — | パスワード(確認用)欄の下 | (確認のためもう一度入力してください) | 会員登録フォームを表示したとき | 補助文言を表示する |
| — | パスワード(確認用)欄の下（英語表示時） | Please type in your password again. | 会員登録フォームを表示したとき | 補助文言を表示する |
| — | メールアドレス欄の下（英語表示時） | Emails that contain  “period before the at sign”, “two period in a row” are not able to use. | 会員登録フォームを表示したとき | 注記を表示する |
| — | 確認画面のメールアドレス欄付近 | 同じメールアドレスを入力してください。 | メールアドレスが確認用の入力と一致しないとき | 確認画面にエラーを表示する |
| — | 確認画面のメールアドレス欄付近（英語表示時） | Please enter the same mail address. | メールアドレスが確認用の入力と一致しないとき | 確認画面にエラーを表示する |
| — | 確認画面のパスワード欄付近 | 同じパスワードを入力してください。 | パスワードが確認用の入力と一致しないとき | 確認画面にエラーを表示する |
| — | 確認画面のパスワード欄付近（英語表示時） | Please enter the same password. | パスワードが確認用の入力と一致しないとき | 確認画面にエラーを表示する |
| — | メールアドレス・メールアドレス(確認用)欄の入力例 | (例)info@hareruyamtg.com | 会員登録フォームを表示したとき | 入力例を表示する |
| — | メールアドレス・メールアドレス(確認用)欄の入力例（英語表示時） | info@hareruyamtg.com | 会員登録フォームを表示したとき | 入力例を表示する |
| — | パスワード・パスワード(確認用)欄の入力例 | (例)password | 会員登録フォームを表示したとき | 入力例を表示する |
| — | パスワード・パスワード(確認用)欄の入力例（英語表示時） | password | 会員登録フォームを表示したとき | 入力例を表示する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 画面を開く条件と入力の保持 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:144-153 |
| 画面を開く条件と入力の保持 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:149-153 |
| 画面を開く条件と入力の保持 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:162-163 |
| 画面を開く条件と入力の保持 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:189-194 |
| メールアドレスとパスワードの入力の形 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/OtcBuy/OtcBuyRepeatedEmailType.php:15-32 |
| メールアドレスとパスワードの入力の形 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/OtcBuy/OtcBuyRepeatedPasswordType.php:20-34 |
| メールアドレスとパスワードの入力の形 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:33 |
| メールアドレスとパスワードの入力の形 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:180-210 |
| メールアドレスとパスワードの入力の形 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:226-235 |
| メールアドレスとパスワードの入力の形 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:24 |
| 次のページへ進むときの入力確認 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_register_customer_js.twig:31-46 |
| 次のページへ進むときの入力確認 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:108 |
| 会員登録をスキップするとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_register_customer_js.twig:21-29 |
| 会員登録をスキップするとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:117 |
| 確認へ進む前の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:215-233 |
| 確認へ進む前の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:98-103 |
| 確認へ進む前の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:35-37 |
| 確認へ進む前の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:58-60 |
| 入力時間が切れたとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_register_customer_js.twig:48-53 |
| 入力時間が切れたとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:54-55 |
| 次のページへ進むときの入力確認 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1536-1537 |
| 会員登録をスキップするとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.en.yml:1106-1107 |
| 入力時間が切れたとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:45-47 |
| 入力時間が切れたとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:69-71 |
| 入力時間が切れたとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/register_customer.twig:32 |
| 入力時間が切れたとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:712-717 |
| 入力時間が切れたとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.en.yml:671-676 |
