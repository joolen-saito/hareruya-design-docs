# 分析集計 — デッキ採用枚数集計（出力条件変更・特集タグ編集用CSVダウンロード）

## 業務ロジック

### 出力条件の指定

集計対象のフォーマットは複数選択できる。

### 出力条件の保持

指定した出力条件は画面をまたいで保持し、CSVダウンロードはそのとき保持している出力条件で集計する。出力条件の指定画面を開き直すと、保持していた出力条件は破棄される。

### 出力条件を指定した後の画面

出力条件を指定した状態では、出力条件の入力欄は編集できない状態で表示され、CSVダウンロードの操作はこの状態でだけ行える。条件を入れ直すには出力条件の指定に戻す操作が必要で、戻した時点で保持していた条件は破棄される。

### ダウンロードするファイル

CSVは先頭にヘッダ行を1行出力し、続けて集計結果を1行ずつ出力する。文字コードの判別用に、先頭へUTF-8のバイト順マークを付ける。ファイル名には出力の種別と出力日時（年月日と時分秒）を含む。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 保持している出力条件 |
| 成功時出力 | ヘッダ行と集計結果からなるCSVファイル |

本機能は集計データを更新しない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

本機能固有の画面メッセージは無い。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力条件の指定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/UsedCardType.php:48-53 |
| 出力条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:102 |
| 出力条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:123 |
| 出力条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:80 |
| 出力条件を指定した後の画面 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/used_card.twig:50 |
| 出力条件を指定した後の画面 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/used_card.twig:77-98 |
| ダウンロードするファイル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:132-144 |
| ダウンロードするファイル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:369-370 |
