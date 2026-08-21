# API 商品管理 — ポップアップ用カード情報取得

## 業務ロジック

### 取得の対象

指定されたカードIDに紐づく商品規格のうち、商品と商品規格がいずれも削除されておらず、かつ商品の公開状態が公開であるものだけを対象とする。対象を後述の優先順で並べ、先頭の1件だけを返す。

### 並び順の優先順位

対象が複数あるときにどの1件を返すかは、次の順で決める。上の条件で並びが決まらないときに、次の条件へ移る。

| 順位 | 適用する場面 | 並び |
| --- | --- | --- |
| 1 | フォイル有無の指定があるとき | フォイル区分。指定が真値なら降順、偽値なら昇順 |
| 2 | 価格の並び指定があるとき | 販売価格。`high` なら降順、それ以外の値なら昇順 |
| 3 | 常に | 特殊なカードセットでないものを優先 |
| 4 | 常に | プロモーションでないものを優先 |
| 5 | 常に | カードセットの発売日が新しいものを優先 |
| 6 | フォイル有無の指定が無いとき | 非フォイルを優先 |
| 7 | 常に | 在庫数が1以上のものを優先 |
| 8 | 常に | 指定された言語コードと一致する言語のものを優先 |
| 9 | 常に | カードの状態の昇順 |
| 10 | 常に | 商品規格に結び付いた画像に定められた順序の昇順 |
| 11 | 常に | サブ画像のファイル名を持つものを優先 |

フォイル有無の指定があるときは、その指定が特殊セット・プロモーション・発売日より優先される。指定が無いときの非フォイル優先はそれらより後に効く。

### 週間販売数の求め方

週間販売数は、取得した商品規格と同じ商品かつ同じ言語コードを持つ商品規格すべての1週間販売数を合計した値を返す。取得した1件分だけの値ではない。

### 応答の値の扱い

取得時点の値をそのまま返し、金額・在庫数の再計算や丸めは行わない。

### 該当が無いときの応答本文

該当する商品規格が1件も無いとき、応答本文はコードとメッセージだけを持つJSONになり、メッセージは `Not Found` を返す。商品情報のフィールドは含まない。

## 入出力

### 入出力: クエリパラメータ

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
| --- | --- | --- | --- | --- |
| `foil_flg` | クエリ | string | 任意 | フォイル有無の指定。指定があるときだけ並び順の第1優先に使う |
| `price` | クエリ | string | 任意 | 価格の並び指定。指定があるときだけ販売価格を並び順に使う |

### 入出力: 値を持たないことがあるフィールド

| フィールド | 値が無いときの応答 |
| --- | --- |
| `subFileName` | null |
| `fileName` | null |
| `beltUrl` | null。帯リンクのURLで、応答には常に含める |

### 入出力: 永続化

本機能はデータを更新しない。

## 表示メッセージ

この機能は画面を持たないためメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取得の対象 | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:106-109 |
| 取得の対象 | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:149-151 |
| 並び順の優先順位 | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:110-127 |
| 並び順の優先順位 | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:144-146 |
| 週間販売数の求め方 | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:153-156 |
| 週間販売数の求め方 | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:227-242 |
| 応答の値の扱い | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:129-147 |
| 該当が無いときの応答本文 | P2 | pf-api:src/Controller/ProductController.php:95-102 |
| 入出力: クエリパラメータ | P2 | pf-api:src/Controller/ProductController.php:89-93 |
| 入出力: 値を持たないことがあるフィールド | P3 | pf-api:src/Repository/DtbProductSubClassRepository.php:103-105 |
| 入出力: 値を持たないことがあるフィールド | P3 | pf-api:src/Resources/config/doctrine/DtbProductSubClass.orm.yml:45-52 |
| 入出力: 永続化 | P3 | pf-api:src/Controller/ProductController.php:87-105 |
