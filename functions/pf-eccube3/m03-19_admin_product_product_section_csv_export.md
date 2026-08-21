# 商品管理 — 部門 CSV 出力

## 業務ロジック

### 出力する対象と並び

部門マスタを条件なしで全件出力する。一覧の検索条件や編集中のフォーム値は、画面で指定されたときも出力には渡らない。対象は常に全件である。

出力する列は固定で、店舗設定のCSV出力項目の設定を変えたときも増減しない。1行目には固定の見出し行を書き、2行目以降がデータ行となる。部門が0件のときは見出し行だけを書き、データ行が無いファイルとなる。

データ行の並び順は指定しない。一覧画面に出る並びと一致するとは限らない。

表示フラグの列には、画面に出る「表示」「非表示」のラベルではなく、部門が保持している値をそのまま書く。

### 出力ファイル

ファイル名は`section_YYYYMMDDhhmmss.csv`（末尾は出力時刻）とし、画面遷移を伴わないダウンロードとして応答する。

文字コードはUTF-8で、先頭にBOMを書く。CSV出力の文字コード設定は本機能には効かず、設定を変えても出力はUTF-8のままとなる。フィールドの区切り文字はCSV出力の区切り文字設定（既定はカンマ）に従う。

件数が多いときも実行時間の上限は解除しない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 未ログイン・権限不足のとき | 管理画面共通のログイン案内や拒否に従う |
| 出力の途中で例外が発生したとき | 利用者向けの専用メッセージの分岐は無い |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 無し。一覧の検索条件や編集中のフォーム値は渡らない |
| 成功時出力 | CSVファイル。1行目は見出し、2行目以降がデータ |
| 失敗時出力 | 本処理に完了メッセージや遷移の分岐は無い。認可失敗やサーバ例外は管理画面共通の扱いに従う |

### 入出力: 永続化

本機能はデータを更新しない。

## 表示メッセージ

本機能は画面メッセージを表示しない。

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力する対象と並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/SectionController.php:150-171 |
| 出力する対象と並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/section.twig:94 |
| 出力ファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/SectionController.php:172-178 |
| 出力ファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:360-370 |
| 出力ファイル | P3 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:249 |
| エラー時の扱い | P1 | pf-eccube3:src/Eccube/Application.php:541-546 |
| エラー時の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/SectionController.php:150-178 |
| 入出力: 永続化 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/SectionController.php:150-178 |
