# 会員 — 買取履歴詳細

## 業務ロジック

### 対象の限定

買取番号（買取注文の識別子）と会員の両方が一致する買取注文だけを表示する。買取番号の指定が無いとき、他人の注文のとき、存在しない注文のときは、存在しない（HTTP404）として扱う。未ログインでのアクセスは会員ログインへ誘導する（会員ログイン機能を正とする）。削除済みの商品・商品規格を含む明細も表示する。

### 承諾方法の表示

買取の承諾方法は、自動承諾・手動承諾のいずれかを表示する。

### 日付の表示

買取依頼日・査定日・承諾日・振込日は「YYYY年MM月DD日」の形式で表示する。査定日・承諾日・振込日は、対応する状態の履歴がまだ記録されていないときは空欄にする。

### 売却可否の操作可否

売却可否は、処理状態が査定内容連絡済みのときだけ操作できる。それ以外の処理状態では選択を変更できない状態にして、現在の選択内容を表示する。価格下限未満のカードをすべて売却するかどうかの選択も同様に、査定内容連絡済みのときだけ操作できる。

### 金額の表示

査定価格が未確定の明細は、金額の代わりに「査定中」と表示する。小計は査定価格×数量で表示する。

### 商品名からの遷移

えらんで買取・まとめて買取の明細は、商品規格が特定できる明細に限り、商品名からネット買取商品詳細を別ウィンドウで開く。商品規格が特定できない明細と個別入力商品は、商品名を文字のまま表示する。

### まとめて買取の個別表示

まとめて買取の一覧に個別に並べるのは、査定価格が個別表示の価格下限以上の明細だけである。

### まとめて買取の表示有無

まとめて買取に該当する明細が1件も無いときは、まとめて買取の一覧、価格下限未満のカードの一覧、および価格下限未満のカードをすべて売却するかどうかの選択を表示しない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 買取番号（買取注文の識別子） |
| 成功時出力 | 買取履歴詳細の画面表示 |
| 失敗時出力 | 買取番号なし・他人の注文・存在しない注文は存在しない（HTTP404）。未ログインは会員ログインへ誘導する |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F06-15-MSG-001 | 画面上部 | 査定内容を承諾しました。 | 連絡済みの買取査定を承諾したとき | 買取履歴詳細画面に遷移する |
| — | 承諾フォーム上部 | 承諾前に査定結果をご確認ください。キャンセルを希望される場合は売却しないを選択してください。 | 処理状態が連絡済みで承諾フォームを表示するとき | — |
| — | 明細の査定価格欄 | 査定中 | 明細の査定価格が未確定のとき | — |
| — | 各明細の売却可否セレクト | 売却する／売却しない | 明細一覧の表示時 | — |

MSG-001 に英訳は無い。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象の限定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/PurchaseController.php:63-88 |
| 対象の限定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:326-328 |
| 売却可否の操作可否 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:170 |
| 売却可否の操作可否 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:368 |
| 金額の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:154 |
| まとめて買取の個別表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:209 |
| 承諾方法の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:71 |
| 日付の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:53 |
| 商品名からの遷移 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:129 |
| まとめて買取の表示有無 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:195 |
