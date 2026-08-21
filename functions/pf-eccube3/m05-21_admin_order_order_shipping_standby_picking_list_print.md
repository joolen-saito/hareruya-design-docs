# 受注管理 — ピッキングリスト印刷

## 業務ロジック

### 印刷対象

指定した出荷指示リストで選択した受注だけを対象とする。指定した出荷指示リストが存在しないときは、ピッキングリストを作らず未検出として応答する。

対象になるのは、その出荷指示リストに属する受注だけである。出荷指示リストに含まれない受注を選んだときは、その受注の明細を出さない。受注を 1 件も選ばないときは、どのグループも空になる。

商品・商品規格・商品サブ情報・商品規格サブ情報・カテゴリのいずれかを持たない明細は出さない。

同じ商品規格で同じ商品名の明細は 1 行にまとめる。受注をまたいでもまとめるため、行数は選んだ受注の件数では決まらない。

### グループ分け

サプライ品として扱うのは、グッズと予約グッズのカテゴリの明細である。

価格帯の境目に使う 2 つの金額は受注一覧しきい値金額 1・2 の設定値である。設定を変えると明細の振り分けとグループ名の金額表記が変わる。しきい値 1 をしきい値 2 以上に設定したときは、どのグループにも当てはまらない価格が生じ、その明細はどのグループにも出ない。

グループ分けに使うのは受注明細の価格である。価格の欄に出すのは商品規格の販売価格なので、受注のあとに販売価格を変えたときは、価格の欄とグループが食い違う。

### 数量

明細の数量の合計を、色数とカテゴリ数で割った値をその明細の数量とする。色が紐づかない明細は色数を 1 として扱う。

### 商品名の整形

サプライ品は商品名を整形しない。サプライ品以外で、商品名に略称タグが含まれないときは、角括弧で囲まれた部分をすべて取り除く。

色とレアリティの取り出し方は、表記が現れる位置で切り替える。上から順に当てはめ、最初に一致した 1 つだけを適用する。

| 位置 | 取り出し方 |
| --- | --- |
| 商品名の末尾 | 一致した部分をそのまま取り出し、商品名から取り除く |
| 開き括弧の直前 | 括弧を除いた部分を取り出し、商品名では開き括弧だけを残す |
| 商品名の途中 | 前後の空白を除いた部分を取り出し、商品名では空白 1 個に置き換える |
| 角括弧の直前 | 角括弧を除いた部分を取り出し、商品名では角括弧だけを残す |

### 改ページ

グループごとに明細 30 行で改ページする。各ページに現在のページ番号と総ページ数を出す。ページの行数が 30 行に満たないときは、空行で埋めて高さを揃える。

## 入出力

### 出力: ピッキングリスト

数量が 1 でない行は、数を太字で出す。

サプライ品以外のグループでは、言語コードが前の行と変わる行の上端に太い罫線を引く。言語コードは変わらず状態コードだけが変わる行の上端には、細い罫線を引く。

サプライ品のグループでは、言語/状態の欄に「サプライ品」と出し、略称と色/R の欄を空にする。

## 表示メッセージ

本機能は画面メッセージを持たない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 印刷対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:199-208 |
| 印刷対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:173-190 |
| グループ分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:210-276 |
| グループ分け | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:161-172 |
| 数量 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:246 |
| 数量 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:157 |
| 商品名の整形 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:249-272 |
| 改ページ | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/picking_list.twig:1 |
| 出力: ピッキングリスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/picking_list.twig:44-59 |
| 出力: ピッキングリスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/picking_list.twig:294-304 |
