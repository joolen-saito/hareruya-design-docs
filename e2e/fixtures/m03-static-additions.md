# M03 静的入力の追加監査

対象は M03-16・M03-20・M03-21・M03-32・M03-37・M03-40。既存の作成済みファイル以外に、各シードの状態・属性と投入方法から列名・行・符号化形式を確定できる次の 5 件を追加した。バイト列は `node e2e/tools/verify-m03-static-additions.mjs` で照合する。改行形式が指定されていない 2 件は、既存 fixture と同じ LF・末尾改行 1 個で保存した。正本のデータ値は補っていない。

| 入力ファイル | 正本出典 | 判断根拠 |
| --- | --- | --- |
| [`m03-16/header_only-028.csv`](m03-16/header_only-028.csv) | `integration_test/casegen/cases/M03-16_seed_data.tsv:31` | UTF-8・LF、見出し「ID・名称・並び順」のみ、データ行なし |
| [`m03-16/header_only-029.csv`](m03-16/header_only-029.csv) | `integration_test/casegen/cases/M03-16_seed_data.tsv:32` | UTF-8・LF、同じ見出しのみ、データ行なし |
| [`m03-16/order_empty-020.csv`](m03-16/order_empty-020.csv) | `integration_test/casegen/cases/M03-16_seed_data.tsv:23` | UTF-8・LF、見出し「名称・並び順・ID」と明細全列、並び順だけ空 |
| [`m03-20/no_id_header.csv`](m03-20/no_id_header.csv) | `integration_test/casegen/cases/M03-20_seed_data.tsv:8` | ID 列を除いた見出しと 4 つの明細値、UTF-8・カンマ区切り |
| [`m03-40/m0340-bad-header-033.csv`](m03-40/m0340-bad-header-033.csv) | `integration_test/casegen/cases/M03-40_seed_data.tsv:34` | 不正見出しと明細の文字列、3 ファイル共通の UTF-8 CSV 指定 |

## 今回は静的ファイルにしないもの

- M03-16: 残る入力の多くは見出しまたは ID・並び順などの明細列が未指定。更新系には登録後の ID を要するものがある。`header_only-028.csv` のシードにはデータを DB で置き換える手順もあるが、今回作成したのは入力ファイルだけであり、その DB 操作は実施していない。
- M03-20: `header_only.csv` は「定義済みの 5 見出し」と記すが当該シード行は列名を列挙しない。ほかの候補にも見出しや明細の一部が足りないものがある。`dept_text.xls` は「Unicode 変換形式の 8 ビット符号化」だけでは具体的なバイト列を定められない。
- M03-21: 残る取込用 CSV 2 件は画面で採番された棚番号 ID が必要（`S-M03-21-CSV-046`・`049`）。`shelf_number_YYYYMMDDHHmmss.csv` は出力ファイル名の記述であり、静的入力にしない。
- M03-32: `normal-014.csv`・`normal-015.csv`・`no_data-019.csv`・`bad_header-020.csv` は明細または見出しがあっても符号化形式が未指定。`limit-ok-025.csv` などは行数が指定されていても見出しの値が当該シードにない。その他は明細だけ・値の範囲だけ・画像形式だけの指定が残る。
- M03-37: `m0337_header_only-018.csv` は見出しが明示されるが、符号化形式・改行形式は未指定。多数の取込ファイルは画面採番の商品 ID・略称タグ ID または一部列の不足がある。画像と容量境界ファイルもバイト列が決まらない。
- M03-40: `S-M03-40-DATA-033` のほかの 2 ファイルは「正規見出し」や「追加列」としか書かれず、同じシードだけでは列名・明細が定まらない。通常取込や行数境界の候補も符号化形式または見出し・データが不足する。画像・容量境界ファイルは内容指定がない。

以上は未判定または実行時生成候補であり、完成扱いにしない。Playwright・DB 書込・正本 TSV の変更は行っていない。
