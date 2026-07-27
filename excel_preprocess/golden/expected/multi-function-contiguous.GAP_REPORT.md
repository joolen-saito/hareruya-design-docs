# golden gap report: multi-function-contiguous

- 記録者: y-saito (Claude実装エージェント)
- 記録日時: 2026-07-24(codex D2敵対レビュー Blocker②対応で更新)
- ステータス: **NOT_FOUND_IN_CORPUS**(D2 6ケース中、実データが存在しないため未整備)。
  網羅走査により数値で証明済み。境界分割ロジックは合成最小xlsxの単体テストで
  検証し、その過程で実装バグを1件発見・修正した。

## 仕様の要求

`T2_EXCEL_PREPROCESS_SPEC.md` §5:

> `multi-function-contiguous` | 同一sheetで機能Noラベルが複数連続する実ブックから、
> 前後2機能を選定。先頭／末尾の境界、空白帯、次機能混入なしを確認。対象ブック・範囲は
> 検出レポートを人手承認して manifest に固定する。

## 網羅走査の数値証拠(2026-07-24、実装コードで実行)

`excel_preprocess.block_finder.find_function_markers_in_sheet`(仕様§2.1の構造マッチ
ロジックそのもの、抽出器が実際に使うのと同一コード)を、**全39ブック・全643シート
(非表示シート含む)**へ機械的に適用した。スクリプト:
`/tmp (scratchpad)/scan_multifunc_authoritative.py`(再現可能。ロジックは
`block_finder.py` を直接import・実行するのみで独自ロジックの追加は無い)。

```
TOTAL sheets scanned: 643
MAX distinct-FID-per-sheet observed: 1
sheets with >=2 distinct FID (same-row structural match, block_finder logic): 0
sheets with same-row multi-value ambiguity (AmbiguousBlockBoundaryError): 0
distribution of distinct-FID-count-per-sheet: {0: 196, 1: 447}
```

- 643シート中、機能Noマーカーを持つシートは447件、持たないシート(表紙・目次・
  CSVフォーマット定義シート等)は196件。
- **1シートあたりのdistinct FID出現数の最大値は1**。2以上のシートは**0件**。
- 同一行内で複数のFID候補値が競合する「狭義の曖昧」(`AmbiguousBlockBoundaryError`)
  も**0件**。

前回報告(2026-07-24初版)は調査用の使い捨てスクリプトによる予備調査だったが、
本結果は `excel_preprocess.block_finder` の**実装コードそのもの**を全643シートへ
適用した一次データであり、数値も完全に整合する(同じ結論を独立した経路で再確認)。

補足事実(このコーパスが「1機能=1シート」で一貫していることの別角度の証拠):
`M03-30` が sheet43/sheet44 の**2つの異なるシート**に分かれて存在し
`AMBIGUOUS_BLOCK_BOUNDARY`(仕様§2.3「同一fidが複数ブック/シートで検出される」)を
正しく返した実例、`F06-10` が21ブックの隠しシート「機能A」に**同一プレースホルダ**
として重複していた実例(いずれも本ツールで実測・exit1を確認済み)。

## 境界分割ロジックの単体テスト(合成最小xlsx・codex提案の代替案を実装)

実データに「同一シート内複数機能」が存在しないため、`detect_block_for_fid` の
連続分割ロジック(仕様§2.2)はこれまで**実データでは1マーカー(idx=0)の分岐しか
実行されたことがなかった**。これを補うため、openpyxlで2機能(`T01-01`@行4,
`T02-01`@行41)を1シートに詰め込んだ最小合成xlsxを構築し、
`excel_preprocess/golden/synthetic_multi_function_unit_test.py` として単体テスト化した。

**このテストはD2 golden corpusの代替ではない**(仕様§5のgoldenは実ブック限定であり、
合成データはgoldenの正本になり得ない)。あくまで実データでは検証不能な分岐を
補う単体テストとして、golden corpusとは明確に別の成果物(`golden/synthetic_*`
という別名前空間)に位置づける。

### 単体テストが検出・修正した実バグ

初回実行で **`detect_block_for_fid` の境界計算に実インデックスバグ**を検出した:

```
row_start = markers[idx - 1].row + 1 if idx > 0 else 1   # 旧実装(誤り)
```

2機能目(`T02-01`, idx=1)のブロック開始行が `markers[0].row + 1 = 5` と誤算出され、
1機能目(`T01-01`, 行1-40)の本文行(5-40)と**重複**した。正しくは
`row_start = markers[idx].row`(そのマーカー自身の行)であるべきで、以下へ修正した:

```
row_start = markers[idx].row if idx > 0 else 1           # 新実装(正しい)
```

修正後、単体テストは以下を全てPASSした(2026-07-24実行):

```
PASS: find_function_markers_in_sheet found 2 markers in one sheet: [('T01-01', 4), ('T02-01', 41)]
PASS: T01-01 block = rows 1-40 (excludes T02-01's marker row 41)
PASS: T02-01 block = rows 41-79 (excludes T01-01's body, starts exactly at its own marker row)
PASS: boundary split is contiguous (no row gap, no row overlap, no next-function bleed)
PASS: querying a non-existent fid in this sheet raises AmbiguousBlockBoundaryError as expected
```

この修正は**実データ(39ブック・643シート)には一切影響しない**(全て idx=0 の
分岐のみを通るため、既存の `excel_blocks/*.json` の再抽出は不要と確認済み。
`m03-11` で idx=0 経路の出力が修正前後で同一であることを直接確認した)。

## 結論と対応方針

現行の39ブック・395機能・643シートのコーパスには、「同一シート内に複数機能が
連続する」実例が数値的に0件であることを確定した。捏造ゼロ方針に従い、この
シナリオを実データから作為的にでっち上げることはしない。境界分割ロジック自体は
合成最小xlsxの単体テストで検証済み(かつ実バグを1件発見・修正済み)であり、
「未実装」ではなく「実データで検証不可能」な状態であることを明記する。

## codexレビューへの申し送り事項(仕様改訂の裁定を仰ぐ)

1. 網羅走査の数値証拠(643シート中、distinct-FID/sheet最大値=1、該当0件)により、
   「同一シート内に複数機能が連続する実ブックが存在する」という仕様§5の前提は、
   このコーパスとは食い違うことが確定した。
2. 代替案(いずれかの採用をcodexへ諮りたい):
   - **案A**: `multi-function-contiguous` を `multi-sheet-same-book`(既に実データで
     exit0達成済み)で代替・統合し、D2必須6ケースを実質5ケース+統合1ケースに改訂する。
   - **案B**: `multi-function-contiguous` を「境界分割ロジックの単体テスト
     (`golden/synthetic_multi_function_unit_test.py`、実データではなく合成データ)」
     で代替することを明示的に許可し、D2受入基準の脚注として「本ケースのみ合成データ
     単体テストで代替可(実データ0件を643シート網羅走査で確認済みのため)」を追記する。
   - **案C**: 本ケースをD2必須から外し、T2ロールアウト中に将来ブックが追加された際の
     再走査タスクとして負債台帳へ繰り込む。
3. D2受入ゲート(`CONCRETIZATION_ROLLOUT_PLAN.md` §6.4)は「6ケース全てexit0」を
   要求しているため、上記いずれの案を採用するにせよ、B1着手可否の最終判断は
   codex裁定が必要(コーディネーターがcodexへ回付する)。
