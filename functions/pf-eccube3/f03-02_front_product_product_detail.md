# F03-02（商品詳細）

## 業務ロジック

### 初期表示の決定

| 対象 | 決め方 |
|------|--------|
| ロケール | 取り扱い外のロケールで開かれたときは日本語として扱う |
| 初期言語 | 指定された言語を最優先とする。指定が無ければロケールが日本語のとき`JP`、それ以外は`EN`。該当する言語の商品が無ければ先頭の言語とする |
| 初期規格 | 指定された規格が該当規格にあればそれ。無ければ初期言語の先頭規格とする |
| 代表価格・総在庫 | 良品の日本語の価格を代表価格とする。日本語の良品が無いとき、および日本語の良品の価格が0円のときは、良品の英語の価格・在庫を用いる。同じ言語に良品が複数あるときは最も高い価格を代表価格とする。総在庫は代表価格に用いた言語の全規格の在庫を合計する。価格は桁区切りで表示する |

### 英語版ページの案内

日本語ページでは、商品の販売制限に英語向けの表示が含まれるときだけ、検索エンジン向けに英語版ページの対応付けを出力する。含まれないときは出力しない。

### お気に入りの登録状態の判定

ログイン済みの会員であっても、会員に選手情報が紐づいていないときは、すべての言語で未登録として扱う。

### 入荷通知の依頼と取消

入荷通知の依頼と取消は、確認で了承したときだけ送信する。了承しなかったときは送信せず、依頼の状態を変えない。依頼に成功すると、その商品規格の入荷通知依頼が登録され、入荷通知の表示を「通知待ち」に切り替える。取消に成功すると、入荷通知の表示を「入荷時に通知」に切り替える。

### 買取の詳細への導線を出さない場合

買取の詳細への導線の判定では、高額商品コードが登録されている規格を対象から外す。買取価格の条件を満たす良品の規格が、高額商品コードの付いたものだけのときは導線を表示しない。

### 旧商品コードからの転送

旧商品コードで来訪したときは、対応する新しい商品コードを引き当て、その商品の商品詳細へ商品IDと言語を指定して転送する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 商品が存在しない | 404とする |
| 旧商品コードに対応がない／対応する商品が見つからない | トップへ転送する |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 商品ID、任意の言語・規格の指定。旧コード転送では旧商品コード |
| 成功時出力 | 商品詳細の画面 |
| 失敗時出力 | 商品が存在しないときは404、旧コードに対応がないときはトップへの転送 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 商品詳細の表示時に、閲覧履歴の先頭へ当該商品IDを追加する。既に履歴にある商品IDは重複させず先頭へ移す。保持するのは新しい順に18件までとし、超えた分は古いものから捨てる |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| F03-02-MSG-001 | 商品詳細画面内の同名商品一覧 | 読み込みに失敗しました。 | 商品情報の読み込みに失敗したとき | 商品情報を追加表示せず、同じ商品詳細画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示の決定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:248 |
| 英語版ページの案内 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:297-303 |
| 英語版ページの案内 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:38-45 |
| 買取の詳細への導線を出さない場合 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:209-217 |
| 買取の詳細への導線を出さない場合 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:306 |
| お気に入りの登録状態の判定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:308 |
| 旧商品コードからの転送 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:346 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:196 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:450 |
| 入荷通知の依頼と取消 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:184-205 |
| 入荷通知の依頼と取消 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:278-296 |
| 入荷通知の依頼と取消 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/CartController.php:162-171 |
| 入荷通知の依頼と取消 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1496-1502 |
