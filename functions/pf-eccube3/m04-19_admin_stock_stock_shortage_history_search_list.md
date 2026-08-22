# 在庫管理 — 欠品履歴検索/一覧

## 業務ロジック

### 初期表示

初期表示では検索条件を持たず、一覧は空とする。

検索の実行時に、送信された検索条件も保持済みの検索条件も無い場合は、検索を行わず初期表示に戻す。

### 検索条件

| 項目名 | 必須／任意 | 書式 | 初期値 | 扱い |
|--------|------------|------|--------|------|
| 日付（開始） | 任意 | 年月日（年-月-日） | 空 | 登録日の下限とする。 |
| 日付（終了） | 任意 | 年月日（年-月-日） | 空 | 登録日の上限とする。終了日当日を含める。 |

### 日付の検索対象

日付（開始）を指定した場合は、指定日の0時以降を対象とする。日付（終了）を指定した場合は、指定日を含めるため翌日の0時未満までを対象とする。いずれも、指定が無い場合はその側の絞り込みを行わない。

### 状態の表示

状態は、規格拡張のメモがある場合はメモを表示し、メモが無い場合は状態名を表示する。

### 検索条件の保持

検索条件・ページ番号・表示件数・並び順は画面をまたいで保持し、ページ送りと表示件数の変更で再利用する。初期表示では検索条件・ページ番号・表示件数を破棄する。

表示件数は、指定された値が表示件数マスタに存在する場合に限り採用し、以後の検索にも保持する。指定が無い場合、または存在しない値が指定された場合は、保持済みの値を用い、保持済みの値も無い場合は既定の件数を用いる。

### ページ送り

ページ送りで指定したページに表示対象が無くなっている場合は、1つ前のページを表示する。

### 並び順が不正な場合

並び順に昇順・降順以外が指定された場合は、エラーを表示して初期表示に戻す。

### 計算

欠品履歴の集計と再計算は行わない。表示は履歴に記録済みの値をそのまま用いる。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索条件（日付帯）、ページ番号、表示件数 |
| 成功時出力 | 欠品履歴の一覧、件数、ページ送り |
| 失敗時出力 | 並び順が不正な場合のエラー表示と初期表示への復帰 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M04-19-MSG-002 | 管理画面上部 | 保存しました | 欠品理由を保存したとき | 欠品履歴検索/一覧画面に遷移する |
| M04-19-MSG-001 | 管理画面上部 | 保存に失敗しました | 欠品理由の保存中にエラーが起きたとき | 欠品履歴検索/一覧画面に遷移する |
| — | 一覧の見出し | 検索結果 N 件 が該当しました | 件数が1件以上のとき | 一覧を表示する |
| — | 一覧の見出し | 検索条件に該当するデータがありませんでした。 | 件数が0件のとき | 一覧を表示しない |
| — | 管理画面上部 | 並び順に関するエラー | 並び順に昇順・降順以外が指定されたとき | 初期表示に戻る |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:49-75 |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:161-173 |
| 検索条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Product/StockoutHistoryType.php:33-48 |
| 日付の検索対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockoutHistoryRepository.php:64-77 |
| 状態の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/stockout_historylist.twig:110 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:145-196 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:56-59 |
| ページ送り | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:186-189 |
| 並び順が不正な場合 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140-143 |
| 計算 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockoutHistoryRepository.php:36-80 |
