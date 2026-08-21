# 商品管理 — 買取/販売価格履歴（検索・一覧・CSV出力）

## 業務ロジック

### 初期表示

空の検索フォームだけを表示し、一覧は表示しない。初期表示を開いた時点で、保持していた検索条件・ページ番号・表示件数は破棄される。表示件数は設定の既定値で始まる。

### 検索の対象

価格履歴の1件を1行として検索する。画面上で価格を再計算せず、保持している履歴の値をそのまま表示する。履歴は変わった側の価格だけを持ち、買取価格だけが変わったときは販売価格の変更前・変更後が空、販売価格だけが変わったときは買取価格の変更前・変更後が空になる。

### 複合キーワードの扱い

入力値を半角空白・全角空白・カンマで語に分割する。語はすべて満たす必要があり（語どうしはAND）、1つの語は検索対象の各項目への部分一致のORで判定する。語に含まれる「%」「_」はワイルドカードとして扱わず、文字そのものとして検索する。

### 金額範囲条件の掛かり方

販売価格・買取価格の範囲条件は変更後の値にだけ掛かる。変更後の値が空の履歴（もう一方の価格だけが変わった履歴）は、範囲を指定した検索の結果から落ちる。

### 期間条件の掛かり方

日付の範囲は履歴の登録日時に掛かる。日付（to）は指定した日の当日分までを含む。

### 選択条件の掛かり方

カテゴリは、選んだカテゴリとその配下のカテゴリに属する商品を対象とする。言語は3つすべてを選ぶと条件として掛からない。Foil・プロモはそれぞれ選択が1つのときだけ条件として掛かり、両方を選ぶと条件として掛からない。

### 他画面から遷移したときの検索

商品マスターの一覧から価格履歴を開くと、URLで渡された商品と、NM指定の導線では加えて状態のコードを検索条件にする。この経路では画面の検索条件を使わず、URLで渡された条件だけで検索し、登録日時の降順・同じ日時では状態の昇順で並べる。

### 検索条件の引き継ぎ

送信が無いときは、保持している検索条件を復元して検索する。復元する検索条件も無いときは初期表示に戻る。検索後はページ番号・並び順・表示件数・検索条件を保持する。並び順の指定は保持するが、一覧の検索には反映されず、画面から検索した一覧は商品規格と登録日時の降順で並ぶ。

### ページ番号の補正

表示ページが最終ページで、総件数の境界により行が無くなったときは、1つ前のページ番号で取り直す。

### CSV出力

CSVダウンロードの導線は、検索結果が1件以上あるときだけ画面に出る。ファイル名は「product_buy_sale_price_history_」に実行時刻（年月日時分秒）と拡張子「.csv」を連結したものとする。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|-------|
| 並び順の指定が昇順・降順のいずれでもない | 並び順のエラーを表示し、初期表示に戻す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索フォームの各項目、ページ番号、表示件数、URLで渡される商品と状態のコード |
| 成功時出力 | 価格履歴の一覧、またはCSVファイルのダウンロード |
| 失敗時出力 | 並び順が不正なときはエラーを表示して初期表示に戻す |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-23-MSG-001 | 管理画面上部 | 検索条件を指定してからCSVをダウンロードしてください。 | 商品検索をせずにCSVをダウンロードしようとしたとき | 買取/販売価格履歴画面に遷移する |
| M03-23-MSG-002 | 入力項目付近 | 終了日時は、開始日時より大きく設定してください | 該当する実装なし | 該当する実装なし |
| M03-23-MSG-003 | 画面上部 | 検索条件に該当するデータがありません。 | 買取/販売価格履歴画面で検索条件に該当するデータがないとき | 検索結果なしのまま買取/販売価格履歴画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:56 |
| 検索の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:245 |
| 検索の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:45 |
| 複合キーワードの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:176 |
| 複合キーワードの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:98 |
| 金額範囲条件の掛かり方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:306 |
| 期間条件の掛かり方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:263 |
| 選択条件の掛かり方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:191 |
| 選択条件の掛かり方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:220 |
| 選択条件の掛かり方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:247 |
| 選択条件の掛かり方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:255 |
| 他画面から遷移したときの検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/BuySalePriceHistoryController.php:64 |
| 他画面から遷移したときの検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:276 |
| 他画面から遷移したときの検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/index.twig:418 |
| 他画面から遷移したときの検索 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/index.twig:419 |
| 検索条件の引き継ぎ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:161 |
| 検索条件の引き継ぎ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:20 |
| 検索条件の引き継ぎ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:279 |
| ページ番号の補正 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:186 |
| CSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/HistoryCsv.php:67 |
| CSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/buy_sale_price_history.twig:149 |
| エラー時の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140 |
