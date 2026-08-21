# ネット買取管理 — 買取検索一覧

## 業務ロジック

### 初期表示と再検索

初期表示では、空または既定値のみの検索フォームを返し、一覧とページ送りを載せない。

| 場面 | 扱い |
|------|------|
| 初期表示 | 保持していた検索条件・ページ番号・表示件数を破棄する。検索したあとに一覧画面へ入り直すと前回の条件は残らない |
| 検索の実行 | 送信された条件で検索し、一覧を表示する。検索フォームはなりすまし対策トークンを持たず、トークンの欠落では拒否しない |
| ページ繰り | 送信された条件が無いため、保持した検索条件を復元して同じ条件で再検索する |
| 保持した検索条件が無いとき | 初期表示と同じ一覧無しの状態を返す |
| 最終ページが空になるとき | 1ページ戻したうえで再表示する |
| 一覧からの削除のあと | 保持しているページ番号の一覧へ戻る。保持が無いときは1ページ目へ戻る |

検索した条件・ページ番号・並び順・表示件数は保持し、次回の表示に用いる。

氏名から再検索したときは買取状況の選択だけが解除され、入力済みの日付などは送信時点の値のまま再検索に使われる。

### 検索結果に出す内容

| 表示 | 内容 |
|------|------|
| 検索結果と出力の操作 | 該当件数が1件以上のときだけ表示する。0件のときは該当データなしのメッセージだけを示し、出力の操作は出さない |
| 出力の操作 | 買取情報を1件も選んでいないときは警告を出し、送信を中断する |
| 表示件数の指定 | 件数を変えたときは1ページ目から表示し直す |
| 買取番号の表示 | 7桁に満たない番号は先頭を0で埋めて表示する |
| 買取依頼日の表示 | 日付だけでなく時刻（秒まで）を添えて表示する |

### 一覧の件数と表示値

| 項目 | 内容 |
|------|------|
| 総件数 | 結合により同一の買取注文が二重に数えられることがある。重複を除く指定は行わない |
| キャンセル含有 | 買取明細または個別入力商品に売却しないものが1件でもあるとき、キャンセルを含む旨を示す |
| 利用回数・本人確認のラベル | 会員ごとに買取注文の件数と本人確認の名称を集約して求める。件数は検索条件で絞る前の全買取注文を数える |

### 並び順と表示件数

| 項目 | 扱い |
|------|------|
| 並び順のキー | 既定は買取番号。注文日を指定したときは注文日で並べる |
| 並び順の方向 | 既定は降順 |
| 表示件数 | 保持した値または既定値（10件）を起点とし、選択肢に無い値を指定しても変わらない |

### 検索フォームの初期値

| 項目 | 初期値 |
|------|--------|
| 買取状況 | 未選択。選択肢は買取状況マスタの表示順の昇順で並ぶ |
| AND／OR検索 | どちらも未選択。未選択のまま検索するとAND検索として扱う |
| 本人確認 | すべて未選択 |

### 検索条件

| 条件 | 絞り込み |
|------|------|
| 買取状況（複数選択） | 選択した買取状況のいずれかに該当する買取注文だけを残す |
| 進捗日付の期間 | 買取状況ごとに開始・終了が指定されたときだけ、当該状況になった履歴を結合して絞り込む。下限は開始日の0時0分0秒以上、上限は終了日の23時59分59秒未満とする。両方未指定の状況は条件にしない |
| 買取番号 | 入力があるときは買取番号への完全一致。数値として解釈できない文字だけのときは0として扱う |
| 注文者名 | 空白と半角コンマで分割し、各語について姓・名・姓カナ・名カナのいずれかへの部分一致をORで束ね、語どうしをANDで繋ぐ。ワイルドカード文字はエスケープする |
| 商品名（複数欄） | 「AND検索」のときは入力のある欄ごとに商品名または英語名の部分一致をORで束ね、欄どうしをANDで繋ぐ。「OR検索」のときは入力のある各欄の条件をすべてORで繋ぐ |
| 本人確認（複数選択） | 未選択のときは条件にしない。選択したときは、選択した状態に該当する選手情報を持つ会員の買取注文だけを残す |
| 利用回数の範囲 | 会員ごとの買取注文の件数を求め、下限・上限が指定された側だけを条件にする。空欄側は適用しない |

### 一覧に出す値

| 項目 | 内容 |
|------|------|
| 申込時買取金額合計 | 買取明細のカードごとに、申込単価が1件のときはその単価に枚数を掛け、複数のときはカード状態がNMの申込単価に枚数を掛けて合計する。該当が無いときは加算しない。申込時点の価格の合算であり、査定後の確定価格や在庫反映後の金額ではない |
| 箱数 | 値が未設定のときは空欄で表示する |
| 買取詳細の並び | 選んで買取のカードだけを並べる。まとめて買取の商品を先頭に置き、続いて単価の降順、カード状態の昇順で並べる。単価が未設定のときは0とみなす。個別入力の商品はこの欄に出さない |

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 並び順の方向が昇順・降順のいずれでもないとき | ソートエラーを表示し、初期表示相当の一覧なしの画面を返す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 初期表示は入力なし。検索は検索フォームの各項目。ページ繰りはページ番号・表示件数・並び順 |
| 成功時出力 | 買取検索一覧の画面 |
| 失敗時出力 | ソート不正のときはエラー表示と初期画面 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M07-01-MSG-001 | 管理画面上部 | 削除しました | 買取情報の削除が完了したとき | 削除し、買取検索一覧画面に遷移する |
| M07-01-MSG-002 | 確認モーダル | 買取番号%id% を削除してもよろしいですか？ | 買取一覧で削除を選択したとき（削除前の確認） | OKでモーダルを閉じて買取検索一覧画面に遷移、キャンセルでモーダルを閉じる |
| M07-01-MSG-003 | 本文テキスト | 検索条件に該当するデータがありませんでした。 | ネット買取一覧の検索後、該当件数が0件のとき | 同一の検索結果画面に0件通知を表示する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示と再検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:57 |
| 初期表示と再検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:187 |
| 初期表示と再検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Purchase/PurchaseListType.php:27 |
| 初期表示と再検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Purchase/PurchaseController.php:315 |
| 初期表示と再検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/purchase.js:24 |
| 検索結果に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Purchase/purchaselist.twig:128 |
| 検索結果に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/purchase.js:13 |
| 検索結果に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Purchase/purchaselist.twig:206 |
| 検索結果に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Purchase/purchaselist.twig:211 |
| 一覧の件数と表示値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:196 |
| 一覧の件数と表示値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:210 |
| 一覧の件数と表示値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:257 |
| 並び順と表示件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:32 |
| 並び順と表示件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:31 |
| 並び順と表示件数 | P3 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:242 |
| 検索フォームの初期値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Purchase/PurchaseListType.php:38 |
| 検索条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:51 |
| 検索条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:91 |
| 検索条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:98 |
| 一覧に出す値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbBuyOrder.php:259 |
| 一覧に出す値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbBuyOrder.php:1446 |
| 一覧に出す値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Purchase/purchaselist.twig:241 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:141 |
