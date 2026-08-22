# F06-08（入荷待ち商品一覧）

## 業務ロジック

### 刷新後は実装しない（廃止）
- Excel基本設計 0306 入荷待ち商品一覧 識別ID:2 により廃止。刷新後は実装しない。

### 画面の構成

| 表示要素 | 表示する条件と内容 |
|------|------|
| 見出し | 入荷待ち商品一覧。入荷通知の登録が0件のときも表示する |
| 入荷通知の案内 | 対象商品が入荷したときに、登録メールアドレスへ通知する旨を案内する。入荷通知の登録が1件以上あるときだけ表示する |
| 商品画像 | 商品画像が登録されていない商品では、画像が無いことを示す代替画像を表示する |
| 画面下部のマイページリンク | 入荷通知の登録が0件のときも表示する |

### 一覧の取得

会員ログインを要求する。未ログインで開いたときは会員ログイン画面へ遷移させる。

| 観点 | 内容 |
| --- | --- |
| 集約 | 同一商品・同一言語・同一の高額商品コードでひとまとめにし、商品ごとに状態と価格の明細を束ねて表示する |
| 状態 | 規格に個別のメモがあるときはメモを表示し、無いときはカードの状態を表示する |
| 価格 | 商品規格の販売価格をそのまま桁区切りで表示する。集計や再計算は行わない |
| 0件のとき | 入荷待ち商品が無い旨を表示する |

### 一覧からの遷移

| 遷移元 | 遷移先 |
| --- | --- |
| 商品画像 | 商品の言語を指定して商品詳細を開く。高額商品コードを持つ規格では、あわせてその規格を指定する |
| 商品名 | 商品の言語を指定して商品詳細を開く |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 会員のログイン状態。 |
| 成功時出力 | 入荷待ち商品一覧の表示。 |
| 失敗時出力 | 未ログインのときは会員ログイン画面への遷移。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| F06-08-MSG-001 | 画面上部 | 入荷待ち商品はありません。 | 入荷待ち商品一覧を開き、登録済みの商品がないとき | 入荷待ち商品がない一覧画面に留まる |
| F06-08-MSG-001 | 画面上部（英語ページ） | No items waiting for restock. | 入荷待ち商品一覧を開き、登録済みの商品がないとき | 入荷待ち商品がない一覧画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:24 |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:29-38 |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:43-48 |
| 画面の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:84-90 |
| 一覧の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:98-104 |
| 一覧の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:325 |
| 一覧の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Util/LoginUtil.php:22 |
| 一覧の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:478-511 |
| 一覧の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:60-73 |
| 一覧からの遷移 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:42 |
| 一覧からの遷移 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:50 |
