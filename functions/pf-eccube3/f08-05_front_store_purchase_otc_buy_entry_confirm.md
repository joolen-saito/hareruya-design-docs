# フロント 店頭買取管理 — 店頭買取査定申込確認

## 業務ロジック

### 確認画面の表示項目の出し分け

確認画面は申込フォーム画面と同じ入力項目を、値を変更できない表示で並べる。返却希望サプライは、申込フォーム画面の送信時に選んだ選択肢と自由入力を「・」で連結して一つの値にしてあり、確認画面はその値を表示する。次の項目は条件を満たすときだけ出す。

| 項目 | 出す条件 | 表示内容 |
| --- | --- | --- |
| 会員登録の入力欄（メールアドレス・メールアドレス（確認用）・パスワード・パスワード（確認用）） | 未ログインで、メールアドレスの入力値があるとき | メールアドレスは入力値をそのまま表示する。パスワードとパスワード（確認用）は、画面上は入力値を出さず「********」と表示する。実際の値は再送信用として応答に含める |
| 登録番号 | 適格請求書発行事業者の登録番号が入力されているとき | 適格請求書発行事業者の設問の回答欄に続けて「登録番号:」と入力値を表示する |
| 郵便番号 | 国が日本のとき | 前半と後半の2欄を「-」でつないで表示する |
| 郵便番号 | 国が日本以外のとき | 1欄で表示する |
| 都道府県 | 国が日本のとき | 表示する |
| 都道府県 | 国が日本以外のとき | 入力欄は隠す。国を変える前に選んだ都道府県が残っているときは、その名称が表示に残る |

確認画面を表示した時点で、国による上記の出し分けを行う。

英語表示の確認画面では、氏名は名・姓の順に並べ、氏名フリガナの欄を持たない。住所は住所2・住所1・都道府県の順に並べ、都道府県が日本国外のときは都道府県を表示しない。

### 確認画面の操作

「戻る」は確認画面の入力値を添えて申込フォーム画面へ移る。

送信するとき、国が日本の場合は、郵便番号の前半と後半をつないだ値を郵便番号として送る。国が日本以外の場合は、入力された郵便番号をそのまま送る。

### 確認画面の入力時間

確認画面は入力時間を数えない。残り時間の表示も、時間切れによる入力内容の消去とエントリーへの戻しも行わない。入力時間の制限は申込フォーム画面と会員登録フォーム画面にだけある（F08-02）。

### 入力データの併合の優先順位

確認と登録に使う入力データは、保持している入力データと今回送信された入力データを項目ごとに併合する。同じ項目が両方にあるときは保持している入力データの値を使う。

申込フォーム画面から会員登録フォーム画面へ進んだ時点で、申込フォームの入力データと適格請求書発行事業者の入力データを保持する。店頭買取のエントリーを開始するたびに、保持している申込フォームの入力データは空に戻る。適格請求書発行事業者の保持データはエントリーを開始しても消えず、残っているときは今回の送信値より優先される。

### 入力の検証結果の扱い

確認画面の表示と申込みの登録は、申込入力の必須・形式の検証結果では分岐しない。確認画面から送られる送信確認用の値の欠落や不一致も、確認表示・申込み登録の分岐に使わない。

### 会員登録の内容

会員登録は、メールアドレスが入力済みの状態で確認画面から送信したときに、申込みの登録より先に行う。ブラックリストと一致したときは、会員・住所帳・プレイヤーのいずれも作成せず、支店システムへの連携も確認メールの送信も行わない。

登録する会員は、申込入力のメールアドレス・パスワード・国・氏名・氏名フリガナ・郵便番号・都道府県・住所1・住所2・電話番号・生年月日・職業を持つ。パスワードは暗号化して保存する。

会員の住所帳に1件を登録する。名称は「会員情報住所 / Membership Information Address」とし、既定の住所とする。住所帳の内容は会員の登録内容を写す。国が日本以外のときは、住所帳の郵便番号に申込入力の郵便番号を設定する。

プレイヤーには、申込入力のメールアドレス、姓、名を設定する。デッキユーザーIDは8桁の英数字をランダムに生成し、既存のプレイヤーと重複しない値にする。

確認メールの種類は表示言語で決め、日本語表示なら日本語、それ以外なら英語のメールテンプレートを使う。

| 項目 | 内容 |
| --- | --- |
| 宛先 | 登録した会員のメールアドレス |
| 送信元 | 基本情報のメールアドレス（店舗名を併記） |
| Bcc | 送信元と同じ基本情報のメールアドレス |
| 返信先 | 基本情報の返信受付メールアドレス |
| 送信エラーの戻り先 | 基本情報の送信エラー受付メールアドレス |
| 本文の差し込み | 申込者の氏名と、会員登録を完了させるURL |
| 履歴 | 送信した件名・本文・送信日時を、その会員のメール配信履歴として保存する。使用したメールテンプレートを紐づける |

### 申込み登録の補足

申込みの登録に入る時点で、申込開始の状態を解除する。登録が途中で失敗しても、申込開始の状態には戻らない。

査定番号の採番から申込みの保存までの間は、申込みの登録を他の処理と同時に行わせない。申込みを保存した後に、状態履歴を1件登録する。状態履歴の状態は完了前の状態とし、操作した管理者は設定しない。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 確認画面から送信される入力値、保持している入力データ、送信モード |
| 成功時出力 | 確認画面の表示。または、会員登録を選んだ場合のみ会員登録を行い、申込み登録後に完了画面へ移動 |
| 失敗時出力 | ブラックリストに一致したときは、会員を作らずに申込みだけを登録して完了画面へ移る |

## 表示メッセージ

この機能は固有の表示メッセージを持たない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:77 |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:164-167 |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:170-214 |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_confirm_js.twig:7-30 |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:src/Eccube/Resource/template/default/Form/form_layout.twig:109-121 |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_order_js.twig:121-132 |
| 確認画面の表示項目の出し分け | P1 | pf-eccube3:src/Eccube/Resource/template/default/Form/form_layout.twig:78-85 |
| 確認画面の表示項目の出し分け | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.en.twig:38-80 |
| 確認画面の操作 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:226-235 |
| 確認画面の操作 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_confirm_js.twig:52-57 |
| 確認画面の操作 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:252-256 |
| 確認画面の入力時間 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/confirm.twig:16 |
| 確認画面の入力時間 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_confirm_js.twig:3-59 |
| 入力データの併合の優先順位 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:189-194 |
| 入力データの併合の優先順位 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:162-163 |
| 入力データの併合の優先順位 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:54-55 |
| 入力の検証結果の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:196-213 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:346-377 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:386-424 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:432-440 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mail/entry_confirm.twig:1-6 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mail/entry_confirm.en.twig:1-5 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:227-259 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1799-1824 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbPlayer.php:952-962 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:151 |
| 会員登録の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:344-345 |
| 申込み登録の補足 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:258 |
| 申込み登録の補足 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/OtcBuyController.php:285-296 |
| 申込み登録の補足 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:24-41 |
