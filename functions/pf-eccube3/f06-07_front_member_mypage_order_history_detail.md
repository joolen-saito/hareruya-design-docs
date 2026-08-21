# F06-07（購入履歴詳細）

## 業務ロジック

### 表示できる条件

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 会員ログイン済みか | 未ログインなら会員ログインへ誘導する |
| 2 | URLの注文IDが数字か | 数字でない・与えられていないなら見つからない（HTTP404） |
| 3 | 注文IDで注文を取得できるか | 取得できないなら見つからない（HTTP404） |
| 4 | 注文の会員がログイン会員と一致するか | 不一致なら見つからない（HTTP404） |
| 5 | 上記を通過 | 購入履歴詳細を表示する |

注文の存在有無と所有者不一致は、いずれも見つからない（HTTP404）として扱い、画面上で理由を区別しない。表示できるのはログイン会員自身の注文だけである。

### 金額とポイントの表示

金額の再集計は行わない。注文時に確定した金額をそのまま表示する。税額は、商品金額合計・送料・手数料の合計から割引を引いた額に対して計算し、注文金額合計（税込み）に内税額として併記する。

ポイント使用（値引き）とポイント発生は、注文が保持する値をそのまま表示し、0のときも「0 ポイント」と表示する。

### 日付の表示

注文日と出荷日は「YYYY年MM月DD日」の形式で表示する。出荷日が未設定のときは空欄にする。

### 送り主とお届け先の住所表示

送り主とお届け先は、都道府県が海外のときだけ表示を切り替える。海外のときは都道府県名の代わりに国名を表示し、郵便番号は区切り記号を付けずそのまま表示する。海外以外のときは、郵便番号を3桁と4桁のあいだにハイフンでつなぎ、先頭に〒を付けて表示する。

### お届け先欄の注文明細

お届け先の下にも注文明細を、商品名・数量・注文明細拡張の3列で表示する。商品名は、商品規格が紐づく明細だけ商品詳細へのリンクとし、その明細の言語区分に対応する商品詳細を別タブで開く。注文明細拡張の欄は現行では常に空欄で出力する。

### 領収書発行リンクの開き方

領収書発行リンクは、購入履歴詳細に留まったまま領収書を別ウィンドウで開く。

### 入力と他機能の境界

利用者が入力するフォームを持たず、本画面専用のモーダルも持たない。注文IDはURLで受け取る。未ログイン時の誘導先の挙動は会員ログイン機能を正とする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 会員ログイン状態、注文ID |
| 成功時出力 | 購入履歴詳細の表示 |
| 失敗時出力 | 未ログイン時は会員ログインへの誘導、それ以外は見つからない（HTTP404） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| F06-07-MSG-001 | 本文 | ※金額が変更されている商品があるため、再注文時はご注意ください。 | 購入履歴詳細を開き、注文時から商品価格が変更されているとき | 購入履歴詳細画面に留まる（再注文リンクは所定の注文種別のときだけ表示する） |
| — | 見出し | 購入履歴詳細 | 詳細画面の表示時 | — |
| — | 獲得ポイントの注記 | ※獲得ポイントは商品出荷時に有効になります。 | 詳細画面の表示時 | — |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 表示できる条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php:67-75 |
| 表示できる条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:246-247 |
| 表示できる条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:315 |
| 金額とポイントの表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php:93 |
| 金額とポイントの表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:96-108 |
| 日付の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:45-52 |
| 送り主とお届け先の住所表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:125-129 |
| 送り主とお届け先の住所表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:214-218 |
| お届け先欄の注文明細 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:222-241 |
| 領収書発行リンクの開き方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:37 |
| 領収書発行リンクの開き方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/assets/js/shopping_history_detail.js:3 |
| 入力と他機能の境界 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:246-248 |
