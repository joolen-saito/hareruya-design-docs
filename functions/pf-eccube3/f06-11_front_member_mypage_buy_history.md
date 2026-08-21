# F06-11（買取一覧）

## 業務ロジック

### 一覧の対象とアクセス制御

ログイン会員自身の買取注文だけを対象とする。未ログインのときは会員ログインへ誘導する。

マイページからこの画面への入口は日本語版のマイページにだけ置き、英語版のマイページには表示しない。

ページ番号と1ページ表示件数はクエリ文字列で受け取る。ページ番号の指定が無いときは先頭ページを表示する。

### 買取依頼内容の表示

えらんで買取・まとめて買取の順に、売却対象で数量のある代表商品を1件だけ表示し、同じ区分の残りを「ほか○件」として示す。売却対象でない商品と、数量が0の商品は対象から除く。

代表商品は、その区分の商品を買取価格の高い順（同額のときは商品状態の定義順）に並べ、先頭から条件に合う最初の1件を選ぶ。まとめて買取の対象には個別入力商品も含める。

商品の言語があるときに限り、商品名の前に言語のコードを【】で囲んで表示する。状態（買取用コード）もあわせて持つ商品では、言語のコードに続けて「/」で区切り、同じ括弧の中に併記する。

### 表示の規則

会員名は姓と名を並べ、敬称を付けて表示する。

買取依頼日は年月日で表示する。

買取番号は7桁のゼロ詰めで表示する。

商品と規格が論理削除済みのときも一覧に表示する。

### 件数の表示

件数範囲と総件数は、一覧の上と下の2箇所に表示する。買取依頼が1件も無いときは件数範囲の開始を0として表示し、一覧には行を出さない。履歴が無いことを知らせるメッセージは表示しない。

### ページ送り

ページ送りは、件数と同じく一覧の上と下の2箇所に置く。現在のページ番号を挟み、前後それぞれ4ページ分までのページ番号リンクを並べる。前のページがあるときは「最初」、後のページがあるときは「最後」のリンクをあわせて表示する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 未ログインでのアクセス | 会員ログインへ誘導する |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | ページ番号と1ページ表示件数 |
| 成功時出力 | 買取履歴一覧の表示。会員名・件数範囲・総件数・ページ送りをあわせて表示する |
| 失敗時出力 | 未ログインのときは会員ログインへ誘導する |

本機能は参照だけを行い、データを更新しない。入力フォームを持たないため、送信に伴うメッセージも持たない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| F06-11-MSG-001 | 画面上部 | 買取履歴はありません。 | 買取履歴を開き、買取依頼の履歴がないとき | 買取履歴一覧画面に留まる |
| — | 件数表示 | （開始）~（終了）件 ／ （総件数）件あります | 一覧表示時に常時 | 買取履歴一覧画面に留まる |
| — | 買取区分ラベル | えらんで買取：／まとめて買取： | 各区分に該当する代表商品があるとき | 買取履歴一覧画面に留まる |
| — | ほか件数 | ほか（件数）件 | 同区分に他の対象商品があるとき | 買取履歴一覧画面に留まる |
| — | 画面見出し | 買取履歴一覧 | 一覧表示時に常時 | 買取履歴一覧画面に留まる |

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧の対象とアクセス制御 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:326 |
| 一覧の対象とアクセス制御 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/PurchaseController.php:30 |
| 一覧の対象とアクセス制御 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/PurchaseController.php:34 |
| 一覧の対象とアクセス制御 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:103 |
| 買取依頼内容の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:102 |
| 買取依頼内容の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:119 |
| 買取依頼内容の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbBuyOrder.php:1414 |
| 表示の規則 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:25 |
| 表示の規則 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:92 |
| 表示の規則 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:96 |
| 表示の規則 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/PurchaseController.php:37 |
| 件数の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:40 |
| ページ送り | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:54 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:326 |
