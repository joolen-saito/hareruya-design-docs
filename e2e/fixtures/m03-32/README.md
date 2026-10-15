# M03-32 の入力ファイル

正本 `integration_test/casegen/cases/M03-32_seed_data.tsv` の「状態・属性」と「投入方法」で、見出し・データ・符号化形式・区切りが揃う 25 件だけを置く。対象シードは `S-M03-32-DATA-004`〜`011`、`013`、`021`、`028`、`S-M03-32-LINKONP-049`〜`GOODSON-062` のうち CSV/TSV の内容が明示されたもの。CSV は 24 件、TSV は `valid.tsv` 1 件。別途、正本にない商品 ID・商品規格 ID は CSV 内に入れない。

`node e2e/tools/verify-m03-32-fixtures.mjs` が各ファイルのバイト列を正本の見出し・データと照合する。`--write` で正本から不足分を作成できる（既存ファイルが違えば上書きせず失敗）。正本は各行末の改行種別を指定していないため、リポジトリ内の静的 CSV/TSV と同じ LF・末尾改行 1 個で保存する。この選択はデータ値の補完ではない。

次はこの生成対象から外す。

- `normal-014.csv`、`normal-015.csv`、`bad_header-020.csv`、`no_data-019.csv` は、文字コードの指定がなく、`no_data-019.csv` は見出しのみ。実行時に形式を確認して作る。
- `limit-ok-025.csv`、`limit-over-026.csv`、`limit-over-027.csv` は行数・末尾改行まで書かれているが、見出しの値が正本に書かれていない。
- `zero-032.csv` などの「データ」だけを指定したファイルは、見出しの有無や値が確定しない。
- `invalid.png` は有効な 1 ピクセル PNG という条件だけで、画像のバイト列は定まらない。

残りの入力候補は [`../named-file-references.tsv`](../named-file-references.tsv) の M03-32 行を参照する。未判定を完成扱いしない。
