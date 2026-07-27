# excel-preprocess — T2 Excel前処理ツール

正典: `integration_test/T2_EXCEL_PREPROCESS_SPEC.md`(全7章)。本READMEはその実装に対する
操作マニュアルであり、仕様と矛盾する場合は正典が優先する。

目的: 選定済みExcel機能ブロックの**全セル・書式・行番号を差分0**で
`excel_blocks/<fid>.json` へ固定し、元 `.xlsx` と機械比較する。

## 0. セットアップ

```bash
# openpyxl が必要(reconstructモードの書き戻しのみに使用。読み取りは一切使わない)
pip install -r excel_preprocess/requirements.txt
# もしくはリポジトリ内の既存venv(openpyxl 3.1.5導入済み)を使う
excel_to_html/.venv/bin/python3 -m excel_preprocess --help
```

## 1. スキーマ(`excel_blocks/<fid>.json`)

`T2_EXCEL_PREPROCESS_SPEC.md` §1 の最低スキーマに準拠。トップレベルキー:

| キー | 内容 |
|---|---|
| `schema_version` | `"1.0"` 固定 |
| `fid` / `function_no` | 対象機能の識別子(fid_kubun.tsv由来。golden専用の合成fidは例外、後述) |
| `source` | `workbook_file`/`workbook_no`/`sha256`/`sheet_name`/`sheet_index`/`sheet_state`/`sheet_part` |
| `block` | `row_start`/`row_end`/`col_start`/`col_end`/`boundary_evidence`(絶対参照の配列) |
| `rows` | 行番号(文字列key)→`{height, hidden, outline_level, custom_height, present_in_xml}` |
| `columns` | 列文字(key)→`{width, hidden, outline_level, custom_width}` |
| `cells` | **ブロック矩形の全アドレス**(空セル・書式のみセルも省略しない)→セル情報 |
| `merged_ranges` | ブロックと交差する結合(境界を跨ぐ場合は抽出自体が失敗する) |
| `styles` | fingerprint→`normalized_xf`(font/fill/border/alignment/numFmt/protection/quotePrefix) |
| `drawing_residuals` | 図形/画像アンカーの**存在のみ**記録(内容は再構成しない・未保証要素) |
| `conditional_formatting_residuals` | 条件付き書式の範囲・ルール種別のみ記録(未保証要素) |
| `integrity` | `model_sha256`(canonical modelのハッシュ)・関連パートのSHA-256 |

セルの `rich_text_runs` は run 単位で `text`/`space_preserve`/`explicit_bold`/
`explicit_strike`/`effective_bold`/`effective_strike`/`strike_from_cell`/`bold_from_cell`
を保持する。`explicit_*` が `None` の場合は run に明示的な書式指定が無く、セルの
書式へ継承されることを示す(仕様§3.2手順6)。

## 2. CLI

```bash
# (1) 境界検出(人手承認の材料。正本ではない。全39ブックを走査するため約1〜1.5分/回)
python -m excel_preprocess detect --fid m03-11 --input-dir excel_to_html/input \
  --out /tmp/detect_m03-11.json

# (2) 人手承認してmanifestへ追加(--approved-by は必須。検出レポートのアドレスのみを根拠にする)
python -m excel_preprocess manifest-add --from-detection /tmp/detect_m03-11.json \
  --fid-map integration_test/fid_kubun.tsv --block-manifest excel_blocks/manifest.json \
  --approved-by "<承認者名>"

# (3) 抽出(承認済みmanifestが無い、またはブックSHAが不一致ならexit1)
python -m excel_preprocess extract --fid m03-11 \
  --fid-map integration_test/fid_kubun.tsv --input-dir excel_to_html/input \
  --block-manifest excel_blocks/manifest.json --output-dir excel_blocks

# (4) 差分0検証(3モード)
python -m excel_preprocess verify --block excel_blocks/m03-11....json \
  --mode source --source excel_to_html/input/0204_....xlsx
python -m excel_preprocess verify --block excel_blocks/m03-11....json --mode reconstruct
python -m excel_preprocess verify --block excel_blocks/m03-11....json \
  --mode golden --golden-expected excel_preprocess/golden/expected/m03-11-category-strike.json
# --mode all で source+reconstruct をまとめて実行(+ --golden-expected があればgoldenも)

# (5) 305/306集合照合
python -m excel_preprocess fid-report --fid-map integration_test/fid_kubun.tsv \
  --rollout-plan integration_test/CONCRETIZATION_ROLLOUT_PLAN.md
```

### 終了コード

| コード | 意味 |
|---|---|
| 0 | 成功(差分0 / 境界一意 / 集合整合) |
| 1 | 差分あり・境界曖昧(`AMBIGUOUS_BLOCK_BOUNDARY`)・manifest未承認・集合不整合 |
| 2 | CLI引数不正・内部例外(スタックトレースをstderrへ出力) |

## 3. block-manifest.json 更新手順

1. `detect --fid <fid>` を実行し、検出レポート(JSON)を得る。これは**正本ではない**
   (仕様§2.3)。`AMBIGUOUS_BLOCK_BOUNDARY` になった場合、以下のいずれかが原因:
   - 同一「機能No」ラベルに複数の一致値がある
   - 同一fidが複数ブック/シートで検出される(例: `M03-30`は2シートに実在)
   - manifestの原本SHAと現在のブックSHAが異なる
   このとき自動検出を諦め、人手でシート・行範囲を確定し、`manifest-add` を使わず
   `excel_preprocess.manifest.ManifestEntry` を直接構成して `save_manifest()` する
   (`m03-30-format-sheet` の golden エントリがこのパターンの実例)。
2. 検出レポートのアドレス(`boundary_evidence` のセル参照)だけを根拠に、人手が
   `manifest-add --approved-by <名前>` で承認する。sheet名・行番号をコード側へ
   ハードコードしてはならない(仕様§2.3)。
3. `manifest-add` は fid_kubun.tsv に存在するfidのみを解決できる。golden corpus等
   T2本番集合に含まれない合成fidを登録する場合は、`ManifestEntry` を直接構成し
   `function_no` をmanifest側に明示する(extract側は fid_kubun.tsv に見つからない
   fidに対して manifest の `function_no` へフォールバックする)。
4. ブックが更新された場合、manifest の `workbook_sha256` が古いままだと
   `extract` は `ManifestApprovalError`(exit1)になる。再承認が必要。

## 4. golden corpus 更新手順(D2)

```text
excel_preprocess/golden/
  manifest.json              # 6ケースの台帳(実データ有無・fid・ブロック・レビューへのリンク)
  sources/<sha256>/<original.xlsx>
  expected/<case-id>.json          # 独立ダンプの出力(検証対象の正)
  expected/<case-id>.review.md     # 確認セル・根拠・確認者・日時
```

**expected/*.json はツール出力(`excel_blocks/<fid>.json`)をコピーして作らない。**
`excel_preprocess/golden/independent_dump.py` という、抽出器
(`excel_preprocess/ooxml.py`/`canonical.py`)とは**別実装**のスクリプトで生成する
(dataclass不使用・素の dict・走査順序も別)。これは「抽出器の出力を期待値として
そのままコピーする自己承認」を避けるためである(仕様§5)。

更新手順:

```bash
python3 excel_preprocess/golden/independent_dump.py \
  --xlsx excel_to_html/input/0204_....xlsx --sheet-index 25 \
  --row-start 1 --row-end 949 --col-start 1 --col-end 65 \
  --fid m03-11_... --function-no M03-11 \
  --evidence "カテゴリ登録:A4" --evidence "カテゴリ登録:D4" \
  --out excel_preprocess/golden/expected/m03-11-category-strike.json

python -m excel_preprocess verify --block excel_blocks/m03-11_....json \
  --mode golden --golden-expected excel_preprocess/golden/expected/m03-11-category-strike.json
```

`expected/*.review.md` に、原本変更理由・二者(またはそれに相当する独立ダンプ突合)
レビューの確認セル・確認者・日時を記録すること(仕様§5「golden の期待JSON更新には、
原本変更理由と二者レビューを必須とする」)。

### 現状(2026-07-24時点、codex D2敵対レビュー Blocker①②是正後)

| case-id | status |
|---|---|
| `m03-11-category-strike` | real-data-verified (exit0: extract→verify --mode all --golden-expected) |
| `a06-08-store-stock-retraction` | real-data-verified |
| `rich-text-run-strike` | real-data-verified(golden専用の合成fid。詳細はreview.md) |
| `multi-sheet-same-book` | real-data-verified(2パート構成) |
| `merged-and-empty-rows` | real-data-verified(m03-11-category-strikeと同一実体を再利用) |
| `multi-function-contiguous` | **NOT_FOUND_IN_CORPUS**(全39ブック・643シート網羅走査でdistinct-FID/sheet最大値=1・該当0件を数値確定。`expected/multi-function-contiguous.GAP_REPORT.md` 参照。境界分割ロジック自体は `golden/synthetic_multi_function_unit_test.py`(合成最小xlsx・goldenの代替ではない)で単体テスト済み) |

独立性の証跡(import文の実差分)は `golden/expected/INDEPENDENCE_EVIDENCE.md` に集約した。

### `verify.py` の比較網羅性(codex D2レビュー Blocker①是正)

`compare_models()` は以下を含め、比較不能要素を黙って除外しない:
`source.sheet_part`/`sheet_state`、`integrity.source_parts_sha256`、
`drawing_residuals`/`conditional_formatting_residuals`(存在・アンカーの集合比較)、
行の`custom_height`・列の`custom_width`、run単位の`explicit_bold`/`explicit_strike`/
`explicit_italic`/`explicit_underline`/`strike_from_cell`/`bold_from_cell`、
`formula_type`。

`reconstruct`モードのみ、openpyxlのAPI制約に起因する少数の項目を対象外とするが、
**`VerifyResult.notes`(=diffsとは別リスト、exit codeに影響しない)として必ず可視化**
し、黙って除外しない:
- `custom_height`/`custom_width`: `openpyxl.worksheet.dimensions.RowDimension.customHeight`/
  `ColumnDimension.customWidth` は読み取り専用の計算プロパティ(setter無し)。
- `drawing_residuals`/`conditional_formatting_residuals`: `reconstruct.py` は図形・条件付き
  書式そのものを一時xlsxへ書き戻さない(仕様冒頭の明示的非目標)。
- run の `explicit_*`(bold/strike/italic/underline)が `None`→`False` になるケースのみ:
  `openpyxl.cell.rich_text.TextBlock.to_tree()` は複数run構成の全runへ`<rPr>`を必ず
  出力する(rPr自体を省略する手段が無い)ため、「元々rPr自体が無い(完全継承)」runが
  「空だが存在するrPr」として再構成される。`effective_bold`/`effective_strike`は
  全モードで厳密に比較しており、この項目に起因する実質的な意味論のズレは別途検出する。

陰性テスト(各項目を1つずつ改竄→exit1で検出)は `README.md` 本項執筆時点で
9項目全て実施・確認済み(sheet_part / sheet_state / source_parts_sha256 /
drawing_residuals / conditional_formatting_residuals / row custom_height /
column custom_width / run explicit_italic / run explicit_underline)。

## 5. openpyxlの位置づけ(仕様§3.2・§6の線引き)

- **読み取り側(抽出・source検証)は openpyxl を一切使わない。** `zipfile` +
  `xml.etree.ElementTree` の直接読取(`excel_preprocess/ooxml.py`)のみ。
- **openpyxl は `reconstruct.py` の書き戻し(JSON→一時xlsx)にのみ使用する。**
  書き戻し後は同じ直接XML読取で再読込し、比較する。
- `convert.py` から流用したのは列/アドレス変換・結合セルの考え方のみ。
  `apply_forced_strikes()`・`trim_text_runs()`・`data_only=True`・表示sheet限定・
  空行/空列削除は一切流用していない(該当箇所はゼロから実装)。

## 6. 既知の限界・要確認事項

- `detect` は全39ブックを走査するため1回あたり約1〜1.5分かかる(extract自体は
  manifestが承認済みであれば1〜2秒)。T2の305機能を一括detectする運用では
  この所要時間を織り込む必要がある。
- 隠しシート「機能A」(`F06-10`という同一プレースホルダを21ブックが共有)は、
  block_finderのAMBIGUOUS判定により誤って個別機能として抽出されることはないが、
  T2本番のfid探索が「機能A」を候補として毎回引っかけ続ける点は運用上のノイズに
  なりうる。除外リスト化などはcodexレビュー後に判断する。
- `block_finder.detect_block_for_fid` の「同一シート内複数マーカー」分岐(idx>0)は、
  実データの全39ブック・643シートには該当例が無いため実データでは一度も実行された
  ことがない。合成最小xlsxの単体テスト(`golden/synthetic_multi_function_unit_test.py`)
  で初めて実行し、境界計算の実インデックスバグ(`markers[idx-1].row+1`が正しくは
  `markers[idx].row`)を発見・修正した(2026-07-24。実データの抽出結果には影響しない
  ことを確認済み)。将来ブックが追加されこの分岐が実データで踏まれる場合は、
  当該fidのD2相当の再検証を推奨する。
- `multi-function-contiguous` ゴールデンケースは実データに存在しない
  (`expected/multi-function-contiguous.GAP_REPORT.md`)。
