# 会員 — お問い合わせ送信

## 業務ロジック

### 画面の構成

| 区分 | 内容 |
|------|------|
| 必須表示 | 必須項目には必須マークを表示する |
| 電話番号欄 | 日本語ページのときは3分割の欄、海外言語ページのときは1欄（数値）とする |
| 内容・アンケート欄 | 複数行入力とする |

### 選択肢の取得

| 対象 | 取得の条件 |
| --- | --- |
| 件名 | 表示中のページの言語で名称が設定されている件名だけを選択肢にする（英語ページでは英語の名称が無い件名を出さない） |
| 店舗・イベント実施店舗 | 店舗の表示順の昇順で並べる |

### 初期表示

| 条件 | 初期値 |
| --- | --- |
| クエリでイベント詳細を指定し、対象のイベント詳細が表示中のとき | 件名・お問い合わせ詳細・イベント名・開催日・開始時間・実施店舗に初期値を設定する |

### 件名による表示切替

付帯情報欄の表示有無とラベル、店舗欄の表示有無は、件名ごとの設定に従う。

### イベントキャンセルの内容転記

お問い合わせ詳細がイベントキャンセルのとき、お問い合わせ詳細・イベント名・実施店舗・開催日・開始時間・キャンセル理由・その他理由・アンケートの入力値を、それぞれの項目名を付けて内容へ転記して送信する。

イベントキャンセル以外で送信したときは、イベント関連の入力値を消してから送信する。

### 会員の特定と保存

| 処理 | 内容 |
| --- | --- |
| 会員の特定 | ログイン会員のときはその会員とする。未ログインのときは入力メールアドレスと一致する会員のうち、未削除・本会員を優先して1件を特定する。特定できないときは会員の紐づけを行わない |
| 保存 | 件名・お問い合わせ詳細区分・付帯情報・氏名・電話番号・メール・店舗・内容を保存し、特定できた会員を紐づける |

### お問い合わせメールの宛先

| 区分 | 宛先 |
| --- | --- |
| 問い合わせ者 | 入力されたメールアドレス宛にも同じ内容を送る |
| 受付側 | 店舗が選ばれていないか、選ばれた店舗に受付アドレスが無いときは、件名ごとに設定した受付アドレス。それも無いときはショップ基本情報の受付アドレスへ送る |

### エラー時の扱い

| 事象 | 扱い |
|------------|------|
| 入力の検証に外れたとき | 各項目直下にエラーを表示し、入力画面を再表示する。画面上部へのまとめ表示は行わない |
| イベントキャンセルで必須欄が未入力のとき | 送信を止め、アラートで警告する |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 画面で入力した各項目の値。確認と送信の区別。クエリのイベント詳細ID。 |
| 成功時出力 | お問い合わせ内容の保存。 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | お問い合わせを送信したとき。特定できた会員を紐づける |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | 画面見出し | お問い合わせ | お問い合わせ画面の表示時 | 入力画面に留まる |
| — | 画面見出し（英語ページ） | Contact Us (send Inquiry) | お問い合わせ画面の表示時 | 入力画面に留まる |
| — | 案内 | 当店へのご要望は、下記フォームにご記入のうえ送信してください。 | お問い合わせ画面・確認画面の表示時 | 入力画面・確認画面に留まる |
| — | 案内（英語ページ） | To contact the shop, please fill out the form below. | お問い合わせ画面・確認画面の表示時 | 入力画面・確認画面に留まる |
| — | キャンセル期限案内 | イベントのキャンセル期限はイベント開催日の前日23時59分までになります。 | お問い合わせ詳細がイベントキャンセルのとき | 入力画面に留まる |
| — | キャンセル期限案内（英語ページ） | Event Cancellation deadline is 23:59pm the day before the event date. | お問い合わせ詳細がイベントキャンセルのとき | 入力画面に留まる |
| — | ブラウザのアラート | イベントキャンセル申込で必須項目が未入力である旨の警告 | イベントキャンセル送信時に必須欄が未入力のとき | 送信を中止して入力を促す（クライアント側）。アラート文言は項目ごとに組み立てる |
| F06-22-MSG-001 | 画面中央(ダイアログ) | 必須項目が入力されていません。 | イベントキャンセルに関するお問い合わせで、必須項目が未入力のまま送信したとき | 送信せず現在の画面に留まる |
| F06-22-MSG-001 | 画面中央(ダイアログ)（英語ページ） | Required fields are missing. | イベントキャンセルに関するお問い合わせで、必須項目が未入力のまま送信したとき | 送信せず現在の画面に留まる |
| F06-22-MSG-002 | 完了画面本文 | お問い合わせが完了いたしました。<br>ご利用ありがとうございました。 | お問い合わせを送信して保存が完了したとき | お問い合わせ完了画面へ遷移して本文を表示する。 |
| F06-22-MSG-002 | 完了画面本文（英語ページ） | Thank you very much for your time.<br>We have successfully received your inquiry.<br>A representative from the shop will be in touch with you shortly. | お問い合わせを送信して保存が完了したとき | お問い合わせ完了画面へ遷移して本文を表示する。 |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:37 |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:21 |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:183 |
| 選択肢の取得 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Front/ContactTypeExtension.php:34 |
| 選択肢の取得 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Front/ContactTypeExtension.php:75 |
| 選択肢の取得 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Front/ContactTypeExtension.php:90 |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:23 |
| 件名による表示切替 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/contact_js.twig:66 |
| イベントキャンセルの内容転記 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/contact_js.twig:35 |
| イベントキャンセルの内容転記 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/contact_js.twig:48 |
| 会員の特定と保存 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:82 |
| 会員の特定と保存 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/CustomerRepository.php:26 |
| 会員の特定と保存 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:89 |
| お問い合わせメールの宛先 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:361 |
| お問い合わせメールの宛先 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:366 |
| お問い合わせメールの宛先 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:411 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:67 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/contact_js.twig:29 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ContactController.php:104 |
