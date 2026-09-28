# F06-16（大会デッキ登録編集）

## 業務ロジック

### 登録できる条件

会員ログインを要求し、ログイン会員に紐づく選手情報を特定する。選手情報が無いときは画面を表示しない。未ログインのときは会員ログインへ誘導する。

イベント詳細が存在し、デッキ登録フラグが有効で、登録締切を過ぎていないときだけ登録できる。いずれかを満たさないときは画面を表示しない。

### 登録済みデッキの初期表示

選択中のフォーマットに登録済みのデッキがあれば、その内容をメインボードとサイドボードの初期値にする。登録済みの内容はフォーマットごとに別々に保持し、フォーマットを切り替えると入力欄の内容も切り替わる。

### カード名のサジェスト

サジェストの候補は、フォーマットごとに用意されたカード名一覧を参照する。イベントで選べるフォーマットの数だけ候補一覧を切り替える。

### マイデッキの取り込み

マイデッキを指定したときは、そのデッキの内容で入力を上書きする。上書きするのは選択中のフォーマットの入力欄だけとする。マイデッキのフォーマットがそのイベントで選べるものなら、選択フォーマットをそのデッキのフォーマットに合わせる。

デッキの取得が成功し、かつそのデッキの所有者がログイン中の選手本人であるときだけ上書きする。本人のデッキでないときは上書きしない。

取り込むカード名は、日本語名があれば日本語名を、無ければ英語名を用いる。統率領域のボードに置かれたカードは、メインボードの先頭に足して取り込む。

マイデッキ一覧は、本人が作成したデッキを作成日の降順で並べる。

### インポートの取り込み

インポートは、貼り付けたテキストを改行で行に分け、「枚数 カード名 (セット略号) コレクター番号」または「枚数 カード名」の書式に行頭が一致する行を読み取る（例:「4 Lightning Bolt (LEA) 161」「4 Lightning Bolt」）。読み取った行は「枚数 カード名」の形にして、メインボードとサイドボードの入力欄をその内容で置き換える。

- 先頭行が「Deck」または「デッキ」のときは、その行を読み飛ばす。
- 「Sideboard」または「サイドボード」の行より後の行は、サイドボードへ入れる。
- 「Companion」または「相棒」の行と、その次の行は読み飛ばす。
- 行頭がどちらの書式にも一致しない行は取り込まず、エラーも表示しない。

### 大会デッキ登録ご利用ガイドの遷移先

大会デッキ登録ご利用ガイドの遷移先は、イベントのヘルプページ（/ja/user_data/help_event）の #block5 の位置とする。遷移先へ引き継ぐ情報は無い。

### 入力の解釈

メインボードとサイドボードの入力は、アリーナ表記のカード名を実カード名に置き換えたうえで解釈し、置き換えた後のテキストを保存する。

解釈では次のように扱う。

- 空行は読み飛ばす。
- 同じカードが複数行にあるときは、枚数を合算して1件にまとめる。
- カード名を囲む二重山括弧は取り除く。分割カードの区切りは、二重スラッシュ・全角プラス・前後に半角スペースを置いたスラッシュのいずれで書かれていても同じ区切りとして扱う。

### 書式の誤りの扱い

書式の判定はメインボードとサイドボードで別々に行い、それぞれ最初に誤りが見つかった行で打ち切る。誤りがあったときは、入力した内容と、どちらのボードで誤ったかが保持される。

### 提出の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | なりすまし対策トークンが正当か | 不正なら受け付けない |
| 2 | 選手情報が特定できるか | できないなら画面を表示しない |
| 3 | 選択フォーマットが確定できるか | できないなら画面を表示しない |
| 4 | イベント詳細が登録可（存在・登録フラグ有効・締切前）か | 不可なら画面を表示しない |
| 5 | メイン・サイドの書式が正しいか | 誤りなら登録せず、入力を保持する |

フォーマットが送られてこないときは、そのイベントで選べるフォーマットの先頭を選択フォーマットとする。送られてきた値がそのイベントで選べるフォーマットに無いときは確定できないものとして扱う。

### 上書きするデッキの同定

イベント詳細・選手情報・フォーマットの3つが一致する登録済みデッキを上書きする。一致するものが無いときは新しく作る。上書きのときは、そのデッキに登録済みのカードをいったん取り除いてから登録し直す。

### 新規に作るときのプレイヤー名

選手情報の英字の姓名を半角スペースでつないだものをプレイヤー名とする。英字の姓名がいずれも空のときは、会員の住所地が海外なら会員の氏名を、そうでなければ会員の氏名カナを用いる。

英字の姓・名の一方だけが空のときは、空の側を空文字として半角スペースでつなぐ。姓だけが空なら先頭に、名だけが空なら末尾に半角スペースが残る（例: 「 TARO」「YAMADA 」）。

### デッキを構成するカードとして保存しないもの

カード名が現行のカード情報と一致しない行は、入力テキストとしては保存するが、デッキを構成するカードとしては保存しない。

### 完了メールの扱い

デッキ登録完了メールの送信結果は画面表示に反映しない。送信できなくても登録は成立する。

### 編集を取りやめたとき

キャンセルを選んだときは、入力中の内容を登録せずにイベント一覧へ戻る。

### 他機能との境界

枚数の下限・上限、禁止カード、制限カードの判定はデッキ確認画面で行う。本機能が登録の可否を決めるのは行の書式だけである。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 選択フォーマット、メインボード、サイドボード、なりすまし対策トークン、マイデッキ取り込み時の対象デッキ。 |
| 成功時出力 | 登録済みデッキの上書き、または新規登録。 |
| 失敗時出力 | 書式エラー時は入力とエラー箇所を保持した編集画面。選手情報なし・登録不可・フォーマット未確定のときは画面を表示しない。 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| デッキの登録 | イベント詳細・選手情報・フォーマットが一致する登録済みデッキが無い状態での提出 |
| デッキの更新（登録済みカードの削除と再登録） | イベント詳細・選手情報・フォーマットが一致する登録済みデッキがある状態での提出 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| F06-16-MSG-001 | マイデッキ取得モーダル本文 | マイデッキがありません。 | マイデッキ取得モーダルを開いた時、ログイン会員のユーザー作成デッキ一覧MyDecksが空 | 画面にとどまる（取得対象のデッキなし） |
| — | 入力形式の注意事項 | 半角数字 + 半角スペース + カード名 の形式でご入力いただく仕様となっております。 | 編集画面の表示時に常時 | 画面に留まる |
| — | 入力形式の注意事項 | When typing the cards in manually please use: amount - space - name formatting | 編集画面の表示時に常時（英語表示） | 画面に留まる |
| — | 入力形式の注意事項 | 全角数字、全角スペースは使用できません | 編集画面の表示時に常時。英語表示に対応する注意文は無い | 画面に留まる |
| — | 入力形式の注意事項 | カード名は日本語・英語のどちらかをご入力ください | 編集画面の表示時に常時 | 画面に留まる |
| — | 入力形式の注意事項 | Card names can only be entered in English or Japanese. | 編集画面の表示時に常時（英語表示） | 画面に留まる |
| — | メインボードの入力欄の上 | メインボードの入力形式に誤りがあります。以下の入力形式に関する注意事項をご確認の上、再度デッキリストをご提出ください。 | 提出時にメインボードの書式に誤りがあり編集画面へ戻ったとき | 入力を保持したまま編集画面に留まる |
| — | メインボードの入力欄の上 | There is an error in the input format of the main board. Please check the notes on the following input format and submit the deck list again. | 提出時にメインボードの書式に誤りがあり編集画面へ戻ったとき（英語表示） | 入力を保持したまま編集画面に留まる |
| — | サイドボードの入力欄の上 | サイドボードの入力形式に誤りがあります。以下の入力形式に関する注意事項をご確認の上、再度デッキリストをご提出ください。 | 提出時にサイドボードの書式に誤りがあり編集画面へ戻ったとき | 入力を保持したまま編集画面に留まる |
| — | サイドボードの入力欄の上 | There is an error in the input format of the sideboard. Please check the notes on the following input format and submit the deck list again. | 提出時にサイドボードの書式に誤りがあり編集画面へ戻ったとき（英語表示） | 入力を保持したまま編集画面に留まる |
| — | カード名入力欄付近 | カード名が入力されていません。 | カード選択でカード名が空のままのとき | 画面に留まる |
| — | カード名入力欄付近 | No Cardname is set. | カード選択でカード名が空のままのとき（英語表示） | 画面に留まる |
| — | カード名入力欄付近 | 枚数は半角数字で指定して下さい(0枚にはできません) | カード選択で枚数が不正なとき | 画面に留まる |
| — | カード名入力欄付近 | Card amount is not set 1 or greater number. | カード選択で枚数が不正なとき（英語表示） | 画面に留まる |

カード単位の検証メッセージ（存在しない・禁止カード・制限カード・範囲外・5枚以上・枚数過多／過少）はデッキ確認画面で表示する。文言はデッキ確認機能を正とする。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 登録できる条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:353-369 |
| 登録できる条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:44-47 |
| 登録できる条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:322-323 |
| 登録済みデッキの初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:54-66 |
| 登録済みデッキの初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:134-141 |
| 登録済みデッキの初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_regist.js:40-56 |
| カード名のサジェスト | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:78-83 |
| マイデッキの取り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:100-119 |
| マイデッキの取り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:431-441 |
| マイデッキの取り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:94 |
| マイデッキの取り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:136-141 |
| 入力の解釈 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:171-172 |
| 入力の解釈 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CardUtil.php:44-88 |
| 入力の解釈 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CardUtil.php:372-383 |
| 入力の解釈 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CardUtil.php:519-533 |
| 書式の誤りの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:176-184 |
| 書式の誤りの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:186-197 |
| 書式の誤りの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CardUtil.php:53-56 |
| 提出の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:151-168 |
| 提出の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:379-394 |
| 上書きするデッキの同定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:199-216 |
| 新規に作るときのプレイヤー名 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:218-224 |
| デッキを構成するカードとして保存しないもの | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CardUtil.php:80-87 |
| デッキを構成するカードとして保存しないもの | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/CardUtil.php:103-119 |
| デッキを構成するカードとして保存しないもの | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:208-209 |
| 完了メールの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:250-252 |
| 編集を取りやめたとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:166-168 |
| 他機能との境界 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:289-318 |
| 他機能との境界 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:326-332 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:199-247 |
| インポートの取り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_regist.js:61-94 |
| 大会デッキ登録ご利用ガイドの遷移先 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:32 |
| 新規に作るときのプレイヤー名 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/DeckentryController.php:219-222 |
