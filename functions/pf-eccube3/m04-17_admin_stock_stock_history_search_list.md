# 在庫管理 — 在庫履歴検索/一覧

## 業務ロジック

### 一覧の構成

現行画面は、1つの検索フォームの条件で価格変更履歴の一覧と在庫変更履歴の一覧を同じ画面に並べて表示する。件数の見出しとページ送りは一覧ごとに別に持つ。

### 他画面から渡された条件

商品・状態コード・言語が他画面から渡された場合は、その条件だけで在庫履歴を絞り込み、検索フォームの条件は使わない。商品を指定した場合は登録日の降順、状態の昇順で並べる。

### 状態の表示

状態は商品規格に登録されたメモがあればメモを表示し、無ければ状態コードを表示する。

### 検索条件の保持

検索条件・ページ番号・表示件数・並び順は保持し、ページ送りと表示件数の変更で再利用する。初期表示では検索条件・ページ番号・表示件数を破棄する。

表示件数は、指定した値が表示件数の選択肢に存在する場合だけ保持する。存在しない場合は保持済みの値を用い、保持していなければ既定の件数を用いる。

### ページ送りの補正

指定したページに表示するデータが無くなっている場合（該当件数が前ページまでの件数と一致する場合）は、1つ前のページを表示する。

### 並び順が不正な場合

並び順に昇順・降順以外が指定された場合は、エラーを表示して初期表示に戻す。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 他画面から渡された商品・状態コード・言語 |
| 失敗時出力 | 並び順が不正な場合のエラー表示と初期表示への復帰 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M04-17-MSG-001 | 一覧の上部 | 保存に失敗しました | 在庫履歴の変動理由を変更して保存できなかったとき | 在庫履歴検索/一覧画面に留まる |
| — | 一覧の見出し | 検索結果 N 件 が該当しました | 一覧の件数が1件以上のとき | 一覧を表示する |
| — | 一覧の見出し | 検索条件に該当するデータがありませんでした。 | 一覧の件数が0件のとき | 一覧を表示しない |
| — | 管理画面上部 | 並び順に関するエラー | 並び順に昇順・降順以外が指定されたとき | 初期表示に戻る |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/historylist.twig:151-231 |
| 他画面から渡された条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:131-157 |
| 状態の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/historylist.twig:276 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:57-59 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:153-196 |
| ページ送りの補正 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:187 |
| 並び順が不正な場合 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140-143 |
