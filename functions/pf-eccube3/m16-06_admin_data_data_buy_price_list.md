# データ管理 — 買取価格対応表（一覧）

## 業務ロジック

### 一覧の対象と並び

登録されている買取価格を全件表示する。絞り込みの指定を受け取らず、ページ送りも行わない。

行はNM買取価格ごとに1行を置く。行にも列にも並び替えの指定を持たないため、読み出した順のまま表示する。

買取価格が1件も登録されていないときも一覧画面を表示する。このとき列の見出しだけを表示し、データ行は出さない。一覧が空であることを知らせるメッセージは表示しない。

### 買取価格が登録されていない組み合わせ

各行には、そのNM買取価格に対して買取価格が登録されている特別区分とカード状態の組み合わせだけを並べる。登録の無い組み合わせに空欄のセルは置かない。

セルは登録されている分だけを左から順に詰めて置くため、組み合わせに欠けがあると、以降の金額が見出しと対応しない位置に表示される。

### 金額の表示書式

金額は通貨記号「¥」と半角空白を先頭に付け、3桁ごとにカンマで区切って表示する。小数は表示しない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 入力項目を持たない。絞り込みの指定も受け取らない。 |
| 成功時出力 | 買取価格対応表の一覧。 |
| 失敗時出力 | 管理画面共通のエラー経路に従う。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

一覧画面は利用者向けのメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧の対象と並び | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BuyPriceListController.php:19-33 |
| 一覧の対象と並び | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/BuyPriceList/buy_price_list.twig:35-44 |
| 一覧の対象と並び | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BuyPriceListController.php:24 |
| 一覧の対象と並び | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/BuyPriceList/buy_price_list.twig:35 |
| 買取価格が登録されていない組み合わせ | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BuyPriceListController.php:24-27 |
| 買取価格が登録されていない組み合わせ | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/BuyPriceList/buy_price_list.twig:35-44 |
| 金額の表示書式 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/BuyPriceList/buy_price_list.twig:37-40 |
| 金額の表示書式 | P3 | pf-eccube3:src/Eccube/Twig/Extension/EccubeExtension.php:282-287 |
