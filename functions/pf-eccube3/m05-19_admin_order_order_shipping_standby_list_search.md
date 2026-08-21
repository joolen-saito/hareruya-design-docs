# 受注管理 — 出荷指示リスト検索

## 業務ロジック

### 検索条件の当て方

| 画面上の項目 | 絞り込み方 |
| --- | --- |
| 出荷指示番号 | 出荷指示リストの番号に一致するものだけに絞る |
| 注文番号 | その注文番号を持つ受注を含む出荷指示リストに限定する |
| 登録日（開始） | 指定した日の `00:00:00` 以上 |
| 登録日（終了） | 指定した日の `23:59:59` 以下 |
| 更新日（開始） | 指定した日の `00:00:00` 以上 |
| 更新日（終了） | 指定した日の `23:59:59` 以下 |
| 注文区分 | 選択したいずれかの注文区分に一致する |

いずれの条件も、値が空とみなされるときは条件が付かない。注文区分は選択が 1 件も無いときに条件が付かない。

注文番号は完全一致だけで、部分一致では絞り込めない。指定した注文番号を持つ受注が無いときは、該当なしになる。

検索条件は受注検索とは別に保持し、ページを送るあいだ維持する。

### 並び順

登録日の降順で並べ、同じ登録日のときは出荷指示番号の降順で並べる。一覧の列見出しに並び替えの操作は無く、画面から並び順を変える手段は無い。

要求に並び順の指定が付いていて、それが昇順・降順のいずれの表記にも一致しないときは、エラーを表示して初期表示に戻る。

### 初期表示

初期表示では、保持していた検索条件・ページ番号・表示件数を破棄し、空の検索フォームだけを表示する。一覧そのものを出さないので、件数も「該当なし」も表示しない。

### 検索の成立条件

検索フォームの検証結果は検索実行の可否に影響しない。検証エラーがあっても、フォームが受け取れた条件のまま検索する。

検索条件を受け取れないときは、保持していた前回の検索条件で検索する。保持していないときは検索せず初期表示に戻る。

### 表示件数とページ番号

表示件数は前回指定した値を引き継ぎ、指定が無いときは既定値を使う。指定した表示件数は、表示件数マスタに登録された値のいずれかと一致するときだけ採用する。一致しない値は無視する。

ページ番号が 2 以上で、かつ総件数が 1 つ前のページまでの表示件数の合計と厳密に一致するときだけ、ページ番号を 1 減らす。最終ページのデータが消えて表示対象が無くなったとき、1 つ前のページを表示する。

### 同じ画面に置く他の入力欄

出荷指示リストを作成する条件（注文番号の範囲・注文日の範囲）の入力欄を、検索条件の上に置く。初期状態では折りたたんであり、見出しを開くと現れる。作成そのものの仕様は出荷指示リスト作成の設計書を正とする。

## 入出力

### 検索結果が無いとき

検索した結果が 0 件のときは、件数の見出し・一覧・表示件数の選択・ページングをいずれも出さず、「検索条件に該当するデータがありませんでした。」だけを表示する。

## 表示メッセージ

採番されたメッセージを持たない。並び順の指定が正しくないときはエラーを表示するが、棚卸しに採番が無いため表に載せない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 検索条件の当て方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:50 |
| 並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:117 |
| 並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140 |
| 初期表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:49 |
| 初期表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/index.twig:99 |
| 検索の成立条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:108 |
| 表示件数とページ番号 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:153 |
| 表示件数とページ番号 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:187 |
| 同じ画面に置く他の入力欄 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/index.twig:19 |
| 検索結果が無いとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/index.twig:195 |
