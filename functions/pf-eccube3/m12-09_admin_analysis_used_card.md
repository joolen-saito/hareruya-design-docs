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

ファイル名は「used_card_」、出力の種別、「_」、出力日時を区切りなしで並べた年月日時分秒の14桁、「.csv」をつないだものとする。出力の種別は、特集タグ編集用がproduct、採用枚数略式がsimpleである。

### CSVの集計

出力条件そのもの（集計日・フォーマット・基本土地を含めるか）はCSVの列に出さない。

集計の対象は、指定したフォーマットの公開中のデッキのうち、イベント日付が集計日(From)の0時0分0秒から集計日(To)の23時59分59秒までのものとする。集計日(To)が空のときは出力した日を集計日(To)とする。

採用枚数は、対象のデッキに入っているそのカードの枚数の合計とする。

特集タグ編集用の形式は、イベントのデッキだけを対象にする。カードごとに代表の商品を1件選んで商品の情報を結び付け、商品ごとに1行を出力する。代表の商品が無いカードは出力しない。

採用枚数略式の形式は、デッキの種類で絞り込まず、カード名と採用枚数の2列をカードごとに1行出力する。

基本土地を含めない指定のときは、特殊タイプとして基本だけが紐付くカードを集計から除く。

行は採用枚数の多い順に並べる。

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
| ダウンロードするファイル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:144 |
| CSVの集計 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:16-69 |
| CSVの集計 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:123-126 |
| CSVの集計 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbCardRepository.php:356-396 |
| CSVの集計 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbCardRepository.php:402-481 |
