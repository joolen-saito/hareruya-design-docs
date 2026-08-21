# F06-06（購入履歴一覧）

## 業務ロジック

### 画面に出す内容

| 領域 | 内容 |
|------|------|
| 見出し | 画面の見出しに「購入履歴一覧」を出す |
| 件数 | 全件数と、現在のページが何件目から何件目までかを出す |
| 注文内容 | 注文明細の商品名を列挙する。明細が複数のときはすべて並べる |
| 各注文の操作 | この注文内容で再度購入する。押したときは、その注文の商品と数量をカートへ投入し、買い物かご画面へ遷移する |
| 処理状態からの遷移 | 処理状態の表示から注文購入履歴詳細へ遷移できる |
| レイアウト | PCで表示したときとスマートフォンで表示したときで、列の見せ方を切り替える |

### 一覧の抽出

会員ログインを要求する。未ログインのときは会員ログインへ誘導する（会員ログイン機能を正とする）。

| 項目 | 内容 |
|------|------|
| 抽出条件 | 当該会員の注文のうち、処理中のときは除外する |
| 並び順 | 新しい注文を先頭にする（注文IDの降順） |
| ページ番号 | 指定された値を用いる。指定が無いときは1ページ目とする |
| 注文金額合計 | 注文の保持値を表示する。集計の再計算は行わない |

### 再購入

注文IDを受け取り、ログイン会員と注文IDで注文を特定する。注文IDが無いとき、または該当する注文が無いときは不正要求（HTTP404）とする。特定できたときは、注文明細の商品と数量からカート投入用の内容を組み立てて返す。投入後の手続きはカート・購入機能を正とする。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 未ログインで表示したとき | 会員ログインへ誘導する（会員ログイン機能を正とする） |
| 再購入で注文IDが無いとき、または他会員の注文のとき | 不正要求（HTTP404）とする |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 会員ログイン状態、ページ番号・1ページ件数。再購入は注文ID |
| 成功時出力 | 購入履歴一覧の画面表示。再購入はカート投入用の内容 |
| 失敗時出力 | 未ログイン時の会員ログインへの誘導。再購入の不正要求（HTTP404） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| F06-06-MSG-001 | 画面上部 | ご注文履歴はありません。 | 購入履歴一覧を表示したとき、購入履歴がない場合 | 購入履歴一覧画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 画面に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:110-114 |
| 画面に出す内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:19-52 |
| 画面に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/repurchase_js.twig:4-36 |
| 画面に出す内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:126-131 |
| 一覧の抽出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:315 |
| 一覧の抽出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:282-296 |
| 一覧の抽出 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php:32-36 |
| 再購入 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php:124-155 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php:126-139 |
