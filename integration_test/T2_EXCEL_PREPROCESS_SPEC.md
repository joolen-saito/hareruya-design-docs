# T2 Excel前処理ツール 設計仕様書（codex立案・2026-07-24）

> 立案=codex（役割分担: 戦略/立案=codex・実装=sonnet著者・敵対レビュー=codex）。
> 目的: T2 excel-primary 305/306機能の候補グレード具体化の前提=Excel機能ブロックを全セル・書式・行番号を差分0で固化。
> D2受入ゲート合格までB1（T2量産）着手禁止（ROLLOUT_PLAN §6.4）。
>
> **【重大な訂正・2026-07-24／ツール実装＋codex D2レビューで確定】** 既存ドラフト/PoC/本仕様初版が用いた「ブック番号:行」引用（例 `0204:6182-6480`・`0204:6285,6287`・`0506:L2707/L2708`）は **`excel_to_html` のHTML出力の行番号であり、実XLSXのセル座標ではない**（0204実最大行=949〔sheet26〕・0506=1001〔sheet10〕で、6182等は物理的に不在。XML直読で確定）。**T2の正典引用は本ツールが確定する実XLSX座標（列文字+行番号）に統一する**。実座標の対応: m03-11「カテゴリ登録」= `0204` sheet26・ブロック行1-949・機能Noラベル `0204:A4`→値 `0204:D4`・取り消し線 `0204:D142`/`0204:D144`（旧HTML行6285,6287）／a06-08 = `0506` sheet10・取り消し線 `0506:E17`/`0506:E44`・生存 `0506:E18`/`0506:E45`（旧HTML行L2707/L2708等）。**影響: m03-11（確定済みW2候補）・a06-08はじめ `_poc2_*.md` 群のExcel引用は実座標へ移行する再点検が必要**（B0の標準機能はee実ソースをnl -ba引用のため無関係）。**方針（2026-07-24ユーザー決定）: T2ツールのD2受入合格後に、m03-11・`_poc2`群の引用をツール確定の実座標へ一括移行し、codex再レビューで確定する**（ツールが座標マッピングを提供）。以下本文中の旧HTML行番号例（JSONスキーマ例の6182/L6285等）は**書式説明用の図示であり実座標ではない**。

---

## T2 Excel前処理ツール 設計仕様書

このツールが差分0を保証する対象は、選定済み機能ブロックのセル座標・空行を含む行位置・セル内容（数式を含む）・結合範囲・セル／リッチテキスト run の書式・行列属性を、元 `.xlsx` の SpreadsheetML と意味等価に `excel_blocks/<fid>.json` へ固定し、元ブックと機械比較する範囲である。図形、画像、グラフ、条件付き書式、印刷設定、VBA、計算結果の再計算表示など、セル仕様として再構成不能または実機表示を要する範囲は保証しない。これらはブロックから捨てず「存在・アンカー・未保証」を記録し、仕様解釈は実機／人手確認へ渡す。

> 確認事項: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md` は T2 を305機能と記載する一方、現行 `integration_test/fid_kubun.tsv` ヘッダは `excel_pf=306` と記録している。本ツールの対象集合は件数をコードへ固定せず、実行時の `fid_kubun.tsv` から抽出し、計画側との集合差分を exit 1 とする。305/306 の正本化は開始前に要確認。

## 1. I/O契約

### 入力

```text
excel-preprocess extract \
  --fid m03-11 \
  --fid-map integration_test/fid_kubun.tsv \
  --input-dir excel_to_html/input \
  --block-manifest excel_blocks/manifest.json \
  --output-dir excel_blocks
```

入力は以下である。

- 原本 `.xlsx`。ブック番号はファイル名先頭4桁を用いる（例: `0204`）。
- `fid` または機能No（大小文字を正規化した `M03-11`）。
- `fid_kubun.tsv`。`source_class許可=excel-primary+pf-fallback` を T2候補として抽出する。ただし、TSV単独でブック・シート・範囲を推定しない。
- 承認済み `block-manifest.json`。自動検出結果を人手レビューして固定する境界台帳であり、`fid → workbook SHA-256, sheet, start_row, end_row, 根拠セル` を持つ。

`load_workbook(..., data_only=True)` は禁止する。既存 `convert.py:140` はこの指定のため数式式そのものを保持しない。抽出器は `data_only=False` を使い、値取得の補助に限定する。

### 出力

出力は `excel_blocks/<fid>.json` とする。HTMLではなくJSONを採用する。理由は、HTMLはセル型・未存在セル・数式・style table・rich-text run・結合被覆セルを曖昧にし、行番号を表示上の番号へ変換しうるためである。

最低スキーマは次のとおりとする。JSONは UTF-8、キー順固定、XML由来の日時／数値は表示用文字列ではなく lexical value と型を保存する。

```json
{
  "schema_version": "1.0",
  "fid": "m03-11",
  "function_no": "M03-11",
  "source": {
    "workbook_file": "0204_基本設計仕様書(商品管理).xlsx",
    "workbook_no": "0204",
    "sha256": "<source workbook sha256>",
    "sheet_name": "カテゴリ登録",
    "sheet_index": 25,
    "sheet_part": "xl/worksheets/sheetN.xml"
  },
  "block": {
    "row_start": 6182,
    "row_end": 6480,
    "col_start": 1,
    "col_end": 54,
    "boundary_evidence": ["0204:<機能Noラベルセル>", "0204:<M03-11値セル>"]
  },
  "rows": {
    "6182": {"height": 15.0, "hidden": false, "outline_level": 0},
    "6183": {"height": null, "hidden": false, "outline_level": 0}
  },
  "columns": {
    "A": {"width": 8.43, "hidden": false, "outline_level": 0}
  },
  "cells": {
    "L6285": {
      "address": "L6285",
      "present_in_xml": true,
      "type": "s",
      "value_lexical": "…",
      "formula": null,
      "style": {"xf_id": 42, "fingerprint": "<sha256>"},
      "format_classes": ["cell-strike"],
      "rich_text_runs": [
        {"text": "※この画面からの画像アップロードは実施しない。", "strike": true}
      ]
    },
    "L6286": {
      "address": "L6286",
      "present_in_xml": false,
      "type": "blank",
      "value_lexical": null,
      "style": null,
      "format_classes": []
    }
  },
  "merged_ranges": ["A6182:D6182"],
  "styles": {"<fingerprint>": {"normalized_xf": {}}},
  "drawing_residuals": [],
  "integrity": {
    "model_sha256": "<canonical block model hash>",
    "source_parts_sha256": {"xl/styles.xml": "<hash>", "xl/sharedStrings.xml": "<hash>"}
  }
}
```

- `cells` は選択範囲の矩形を**全アドレス**で保持する。空行、未存在セル、書式だけがある空セルも省かない。
- L1が引用する絶対参照は `0204:L6285` 形式とする。仕様文中で列が不要な行参照は `0204:6285` を併記してよいが、ツールの主キーは必ず列＋行である。
- `merged_ranges` はブロックと交差する結合を省略しない。ブロック境界が結合範囲を横切る場合は自動抽出を失敗させ、結合全体を含むよう manifest を修正する。
- `format_classes` は解釈用の派生値、`styles` と `rich_text_runs` は差分0検証用の原データである。派生クラスだけで書式を保存してはならない。

## 2. 機能ブロック特定アルゴリズム

### 2.1 ブック候補の決定

1. `fid_kubun.tsv` から対象の機能No・fid・機能名を読む。
2. 全39ブックを走査し、非表示シートを含めて「機能No」ラベル候補を探す。既存HTML変換器は表示シートのみ対象である（`convert.py:141-142`）ため、その仕様を継承しない。
3. ラベル文字列は前後空白・全半角・改行を正規化して `機能No` と比較する。
4. ラベルセルと同じ行の右側、結合セルのアンカー、次行／次列の近傍にある値を正規化し、完全一致する機能No（例 `M03-11`）を候補とする。
5. 候補ごとに `book SHA-256 / sheet名 / label address / value address / 周辺行` を検出レポートへ出す。

単なる本文内の `M03-11` 文字列は候補にしない。ラベルと値の構造的対応が必須である。

### 2.2 範囲決定

- 同一シートの機能No候補を行順に並べる。
- 各候補について、見出しヘッダを含む直前の機能開始行から、次機能の開始直前までを候補範囲とする。
- 「開始行」は、機能No行を含むメタデータ群（更新日、機能No、機能名等）の直前まで遡り、直前機能との間の区切り行／見出し様式の変更／空白帯を検出する。
- 「終了行」は次候補の開始行の直前とし、最後の候補はシートの最終 materialized row までとする。
- 結合セル、行高、非空セル、罫線・塗りだけのセルが範囲に連続する場合、それらを開始／終了判定から除外しない。

実例として、`m03-11`「カテゴリ登録」の実ブロックは `0204` sheet26・行1-949（1シート=1機能ゆえシート全域）・機能Noラベル `0204:A4`→値 `0204:D4` である（旧草案の `6182–6480`/`0204:6195` はHTML出力行番号＝上部の重大訂正参照）。この実座標範囲を D2 corpus の固定例にする。

### 2.3 曖昧時の扱い

自動境界は便利機能であり、正本ではない。以下は `AMBIGUOUS_BLOCK_BOUNDARY` として exit 1 にする。

- 同一「機能No」ラベルに複数の一致値がある。
- 同一fidが複数ブック／シートで検出される。
- 前後機能との境界に結合セルが跨る。
- 開始／終了候補の間に、機能ヘッダではない同形の表があり一意に分割できない。
- manifest の原本SHAと現在のブックSHAが異なる。

人手は検出レポートのアドレスだけを根拠に `manifest.json` を承認・更新する。sheet名や行番号をプログラム内へハードコードして黙って通してはならない。

## 3. 書式、特に strike の堅牢検出

### 3.1 問題の確認

既存 `convert.py` は `load_workbook(..., rich_text=True)`（140行目）、`CellRichText`／`TextBlock` を run ごとに判定する `cell_text_runs()`（3264行目以降）と、`cell.font.strike` を使う。しかし、最後に特定ブック・特定sheet・文言だけを置換する `apply_forced_strikes()`（1392行目以降）を適用している。これは `0202_基本設計仕様書(在庫管理機能)` の「共通処理」だけを対象とする文言ハードコードであり、openpyxl経由の検出が完全ではないことの現物根拠である。

したがって、`apply_forced_strikes()` は本ツールへ流用しない。

### 3.2 正本抽出方式

openpyxlはブック／シート／結合などの補助に使う。ただし書式とリッチテキストの正本は `.xlsx` を `zipfile` + `xml.etree.ElementTree` で直接読む。

1. `xl/workbook.xml` と `xl/_rels/workbook.xml.rels` から、シート名・順序・relationship・worksheet part を解決する。
2. `xl/worksheets/sheetN.xml` の各 `<c r="L6285" s="…">` を読む。
3. `xl/styles.xml` の `cellXfs/xf → fontId → fonts/font` を解決し、セル書式の `<strike/>`、太字 `<b/>`、塗り (`fills`)、罫線、配置、数値書式、保護を正規化する。
4. `t="s"` の共有文字列は `xl/sharedStrings.xml` の該当 `<si>` を読み、各 `<r><rPr><strike/>…</rPr><t>…</t></r>` を run 単位で保存する。
5. `inlineStr` の `<is>` も同じく run 単位で扱う。
6. run に `strike` がなくても、セル書式の strike は全runへ継承する。runの明示書式があれば、そのrunを優先し、セル継承の有無を別フィールドに保存する。
7. `<t>` の先頭／末尾空白は `xml:space="preserve"` を含めて保持する。HTML向けの `.strip()` は禁止する。既存 `trim_text_runs()`（3315行目以降）は可読化目的なので流用不可である。

### 3.3 意味クラス

`format_classes` は次の決定的ルールで生成する。

- `cell-strike`: セル書式または少なくとも一つの rich-text run が strike。
- `cell-bold`: セル／run の太字。
- `cell-fill:<normalized-color>`: 実効塗り。
- `customization-marker`: セルのテキストに `★` が含まれる。これは文字内容に基づく補助クラスであり、書式の代替ではない。
- `merged-anchor` / `merged-covered`。

`cell-strike` は「削除／撤回」として L1 が解釈できるよう、run単位の位置と文字列を必ず残す。ただしツール自身が「strike は常に撤回」と一般化して仕様判断してはならない。解釈は L1 側が行う。

根拠例は次の通りである。

- `m03-11` では `0204:D142`/`0204:D144`（旧HTML行6285,6287）の取り消し線が旧要求で、非取り消しの後続文が有効要求である。
- `a06-08` では `0506:E17`/`0506:E44`（旧HTML行L2707等）の「本店EC在庫」run が取り消し線で撤回、`0506:E18`/`0506:E45` の「所属店舗EC在庫」は生存している（XML直読で確定）。

## 4. 差分0検証器

`excel-preprocess verify --block excel_blocks/<fid>.json --source <xlsx>` を提供する。成功は exit 0、差分・読み取り不能・境界曖昧は exit 1、CLI／内部例外は exit 2 とする。

検証器は出力JSONと原本から、それぞれ同じ canonical block model を生成して比較する。比較対象は以下である。

- `source` のブックSHA・sheet relationship・シート順。
- block の開始／終了行、開始／終了列、全アドレス集合。欠落した空行・空セルも差分。
- 各セルの存在有無、セル型、数式文字列、cached value の有無と lexical value、エラー値、shared／inline rich-text run列。
- 各runの文字列、空白保存属性、strike／bold 等の run property。
- 実効書式の正規化値（font、fill、border、alignment、number format、protection、quotePrefix 等）。
- 行高・非表示・outline、列幅・非表示・outline。
- 結合範囲およびアンカー／被覆セル。
- ブロックと交差する drawing／conditional formatting 等の「未保証要素」の存在とアンカー一覧。

「再構成」は、JSONから一時 `.xlsx` ブロックを生成し、再読込して canonical model がJSONと一致することも確認する。ただしOOXMLの `styleId`、relationship ID、XML属性順は実装により変わりうるため、バイト一致を要求しない。上記の意味等価canonical model一致を「差分0」と定義する。

差分レポートは例えば `CELL_STYLE_MISMATCH 0204:L6285 expected=cell-strike actual=[]` のように絶対参照、期待値、実値を出す。比較不能な要素を黙って除外して exit 0 にしてはならない。

## 5. D2 golden corpus仕様

D2受入は `CONCRETIZATION_ROLLOUT_PLAN.md:190-196` の通り、「複数sheet・複数出現・`cell-strike` を含む実Excel断片」に対する全セル・書式・行番号の差分0、exit 0 である。不合格時に手動成果物を量産開始の代替根拠にしてはならない。

### corpus構成

```text
excel_preprocess/golden/
  manifest.json
  sources/<sha256>/<original.xlsxまたは許諾済み最小断片.xlsx>
  expected/<case-id>.json
  expected/<case-id>.review.md
```

- `expected/*.json` はツール出力をコピーして作らない。XML直読ダンプとExcel実機の人手二者確認で作成し、確認者・日時・確認セルを `review.md` に記録する。
- 最小断片化しても、対象セルの shared string、style、merged range、行列設定、シートrelationshipを壊さない。切出しで再保存したExcelを正本代替にしない。権限上原本を置けない場合は、原本SHA・part hash・canonical expected を保管する。
- golden の期待JSON更新には、原本変更理由と二者レビューを必須とする。

### 必須代表ケース（codex D2裁定・2026-07-24改訂＝案B採用）

D2は、実データに存在する代表パターンを real-data golden で検証し、現行コーパスに実例が存在しない分岐は、その不在を数値で記録した上で合成最小xlsxの必須単体テストで検証する。合成データを real-data golden の正本として扱ってはならない。

| case-id | 実データと確認観点 |
|---|---|
| `m03-11-category-strike` | `0204` sheet26「カテゴリ登録」、ブロック行1-949、機能Noラベル `0204:A4`→値 `0204:D4`。`0204:D142,D144` の strike run と後続の生存文、結合、長大sheet中のブロックを確認。 |
| `a06-08-store-stock-retraction` | `0506` sheet10。`0506:E17,E44` の strike run と `0506:E18,E45` の非strike、`★カスタマイズ` を確認。撤回と生存記述が隣接するケース。 |
| `multi-sheet-same-book` | 1ブックの別sheetにある2機能。sheet relationship、表示／非表示状態、ブック番号引用を確認。 |
| `rich-text-run-strike` | 一つのセル内に strike run と非strike run が共存する実セル。セル全体strikeだけの検査では不足であることを固定する。 |
| `merged-and-empty-rows` | 結合セル、書式のみの空セル、連続空行、カスタム行高を含む実ブロック。行番号を詰めないことを確認。 |
| `multi-function-contiguous-unit` | 現行39ブック・643シート（非表示を含む）の `find_function_markers_in_sheet` 全数走査で、同一sheet内の distinct FID 数が2以上のsheetは0件（最大1件、分布 `{0:196,1:447}`）であるため、実Excel golden を要求しない。`golden/synthetic_multi_function_unit_test.py` を必須D2単体テストとし、同一sheet内2機能について、先頭ブロックの終了が次機能マーカー直前、後続ブロックの開始が自身のマーカー行、行の欠落・重複・次機能混入がないことを検証する。これはgoldenの代替正本ではない。コーパス追加・原本更新時は全数走査を再実行し、実例が見つかった場合は real-data golden ケースへ戻す。 |

D2合格条件は、real-data golden の全ケースについて `extract → verify source → reconstruct → verify reconstructed → verify golden` が連続して exit 0 かつ expected JSONとの差分0であること、ならびに `multi-function-contiguous-unit` が exit 0 であることとする。これを満たすまで B1開始禁止である。

**【D2受入合格・2026-07-24】** codex D2最終レビューで受入合格。real-data golden 5ケース（m03-11/a06-08/multi-sheet-same-book=m03-45/rich-text-run-strike=m03-30/merged-and-empty-rows）が `--mode all`+golden で各exit0（コーディネーター独立再実行）、検証器の偽合格経路9項目を陰性テストで閉塞（sheet_state/source_parts_sha256/strike消失等がexit1・独立確認）、`multi-function-contiguous-unit` の合成単体テストで境界分割の実バグ（off-by-one）を発見・修正。**B1（T2量産305機能）着手可**。

## 6. 非目標／アンチパターン

以下は禁止する。

- 空行・空列を省いて行番号を詰めること。
- 図・画像・遷移図をHTML/SVGとして再構成して原本セル情報の代替とすること。
- 可読性を理由に値、空白、rich-text run、結合被覆セル、書式を正規化・削除すること。
- `apply_forced_strikes()` のようなブック名／sheet名／文言による取り消し線上書き。
- HTMLの表示上の行番号、HTMLの `<span class="cell-strike">`、ブラウザ見えを正本にすること。
- `data_only=True` の値だけを保存して、式・共有文字列・リッチテキスト構造を失うこと。
- 1件の検出成功を根拠に、曖昧な機能境界を推測して量産すること。

`convert.py` から流用可能なのは、openpyxlでのブック読込補助、結合セルマップの考え方（`build_merged_maps()`、3240行目付近）、列番号／Excelアドレス変換である。流用不可なのは、HTML render全般、表示sheetのみへの限定、空行／空列削除、`format_cell_value()` による表示値化、`trim_text_runs()`、図形の再構成、`apply_forced_strikes()` である。READMEの「内容のない行・列はまるごと省く」「グラフ・条件付き書式を完全再現しない」という明記も、この線引きの根拠である。

## 7. 実装受入基準（DoD）と Codex敵対レビュー観点

### sonnet著者向けDoD

- Python実装であり、`openpyxl` と標準 `zipfile/xml.etree.ElementTree` だけで、原本 `.xlsx` からJSONを生成できる。
- `fid_kubun.tsv` の現行対象集合を機械抽出し、計画上のT2集合との差分を報告できる。
- ブック／シート／行範囲を検出し、曖昧なら exit 1。承認manifestなしの推測量産をしない。
- 全アドレス、空行、書式のみセル、結合、行列属性、数式、rich-text run、style正規化をJSONへ保存する。
- `styles.xml` と `sharedStrings.xml`／inline stringを直接読んで strike を検出する。`apply_forced_strikes()` 相当の例外表は存在しない。
- source比較・再構成比較・golden比較の全てをCLIで実行でき、D2 golden corpus全件が exit 0。
- 失敗時の差分は fid、ブック番号、sheet、絶対アドレス、項目種別を含む。
- README、スキーマ、manifest更新手順、golden更新手順、exit codeを実装と同時に提供する。

### Codex敵対レビュー

- `cell.font.strike` が偽でも、`sharedStrings.xml` の `<rPr><strike/>` を持つrunを取りこぼしていないか。
- `inlineStr`、セル全体strike、混在run、空白保存runを別々に試験しているか。
- `data_only=True`、`.strip()`、空行フィルタ、表示sheetフィルタが混入していないか。
- `0506:L2707` が strike、`L2708` が非strikeという隣接セルの極性を正しく出力するか。
- `0204:6285,6287` を単なるテキストとして保存して、runのstrikeを失っていないか。
- 結合範囲の被覆セル、行高、隠し行、書式のみセル、最後尾空行を欠落させていないか。
- 次機能の先頭行を前機能へ混入、または先行メタデータを切落としていないか。
- golden expected を実装出力から自動生成して自己承認していないか。
- 305/306不整合を固定値で握り潰していないか。
- 差分を「未対応」と表示するだけで exit 0 にしていないか。
