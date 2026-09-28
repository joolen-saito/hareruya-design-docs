# 分析集計 — デッキ採用枚数集計（出力条件変更・特集タグ編集用CSVダウンロード）

## 業務ロジック

### 出力条件の指定

| 場面 | 扱い |
|------|------|
| 初期表示 | 保持していた出力条件を消去し、検索フォームだけを表示する |
| 検索 | 受け取った出力条件を保持し、集計結果を表示する |
| CSV出力 | 保持した出力条件を取り出し、検索したときと同じ条件で集計する |

### CSVの出力

指定された出力形式に応じて、集計方法と出力する列を切り替える。特集タグ編集用などの形式ごとに、その形式のヘッダと各行を出力する。出力したときのファイル名には出力形式と日時を含める。

集計の対象は、指定したフォーマットの公開中のデッキのうち、イベント日付が集計日(From)の0時0分0秒から集計日(To)の23時59分59秒までのものとする。集計日(To)が空のときは出力した日を集計日(To)とする。

採用枚数は、対象のデッキに入っているそのカードの枚数の合計とする。

特集タグ編集用の形式は、イベントのデッキだけを対象にする。カードごとに代表の商品を1件選んで商品の情報を結び付け、商品ごとに1行を出力する。代表の商品が無いカードは出力しない。

採用枚数略式の形式は、デッキの種類で絞り込まず、カード名と採用枚数の2列をカードごとに1行出力する。

基本土地を含めない指定のときは、特殊タイプとして基本だけが紐付くカードを集計から除く。

行は採用枚数の多い順に並べる。

集計結果が0件のときも、ヘッダ行だけのCSVファイルを出力する。

ファイル名は「used_card_」、出力形式、「_」、出力日時を区切りなしで並べた年月日時分秒の14桁、「.csv」をつないだものとする。出力形式は、特集タグ編集用がproduct、採用枚数略式がsimpleである。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 認証・権限が不足しているとき | アクセスできない |

出力条件の指定とCSVの出力では、なりすまし対策トークンを検証しない。トークンが無いときや値が異なるときも、エラーにせず通常どおり集計する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 出力条件、CSVの出力形式 |
| 成功時出力 | 集計結果の表示、または指定形式のCSVファイル |
| 失敗時出力 | 認証・権限が不足しているときはアクセス不可 |

## 表示メッセージ

本機能は利用者向けの通知メッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| CSVの出力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:16-69 |
| CSVの出力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:123-126 |
| CSVの出力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbCardRepository.php:356-396 |
| CSVの出力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbCardRepository.php:402-481 |
| CSVの出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:129-139 |
| CSVの出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:144 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/UsedCardType.php:17-23 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:122-125 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/Admin/AnalysisServiceProvider.php:67-71 |
