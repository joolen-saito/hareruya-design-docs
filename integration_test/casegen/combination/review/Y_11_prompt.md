# 反証の依頼: 機能 F05-05・F05-06・F06-01・F06-02・F06-03・F06-04・F06-05・F06-06・F06-07・F06-08・F06-09 の要因表の見直し（3つの決定の当て方）

あなたは独立したレビュアーである。別の担当が、依頼者の3つの決定に合わせて**要因表を直した**。その直しが設計書と食い違っていないかを確かめる。直さない。読むだけ。
リポジトリは `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。

## 背景

結合テストで、1回の処理の結果を左右する要因が2つ以上あるとき、効き合う要因は値の組合せを全部、関係しない要因はどの2つの要因の値の組もどこかで1回試すケースを足す。
要因表（`integration_test/casegen/combination/factors/<機能ID>_*.tsv`）から機械が組を並べる。要因表はすでに codex の反証を1巡受けて直してある。
そのあと依頼者が次の3つを決め（2026-10-20）、担当が要因表を直した。今回確かめるのは**この直しだけ**。

| 決定 | 中身 |
| --- | --- |
| 1 打ち切り側は1回でよい | その値（または値の組）になると処理がそこで打ち切られ、ほかの要因の値が結果に効かないとき、constraints.tsv に種別 `打ち切り` で書く。機械はその条件を1回だけ通し、ほかの要因との組は埋めない。打ち切られても一部の要因の値がまだ結果に効くときは、その要因の値も組に入れて書く |
| 2 列ごとに独立して決まる値は組にしない | 出力の列・表示項目ごとに独立して決まる値（CSV の空欄・書式・文言の変換 など）は要因にしない。ほかの要因と効き合う（その値で、ほかの要因の結果や、行を出す・出さないが変わる）ときだけ残す。外して要因が1つになった処理は処理ごと外す |
| 3 結果が同じ値はまとめる | 設計書が別々の条件として書いていても、結果が同じ値は1つにまとめる |

## 読むもの

- 直した所: 機能ごとに `git -C /home/y-saito/Developments/hareruya-design-docs diff eddb12cb -- integration_test/casegen/combination/factors/<機能ID>_processes.tsv integration_test/casegen/combination/factors/<機能ID>_factors.tsv integration_test/casegen/combination/factors/<機能ID>_interactions.tsv integration_test/casegen/combination/factors/<機能ID>_constraints.tsv integration_test/casegen/combination/factors/<機能ID>_existing.tsv`（eddb12cb が直す前）
- 担当の処置: `integration_test/casegen/combination/review/<機能ID>_factors_s_dispositions.tsv`
- 設計書: `integration_test/casegen/combination/units/<機能ID>/design.txt`（行頭の `L0001` は行番号）、他の機能は `units/<機能ID>/design.txt`
- 作り方の決まり: `integration_test/casegen/combination/FACTOR_PROMPT.md`

設計書の中で記述が食い違うときは、Excel 由来の本文 ＞ 埋め込みの「表示メッセージ」節 ＞ 埋め込みの「現行仕様」節・機能設計書 の順に採る。

## 確かめること（事実だけ。差分に出ている所だけ）

| 種類 | 何を見るか |
| --- | --- |
| G 打ち切りの誤り | 打ち切りとした値で、設計書は処理を打ち切っていない。または打ち切ったあとも「効かない」とされた要因の値で結果が変わると設計書が定める（その要因の値も組に入れるべき） |
| H 外しすぎ | 決定2で外した要因・処理が、列・表示項目ごとに独立して決まるだけではない（ほかの要因の結果、行や対象を出す・出さない、更新先・更新内容を変えると設計書が定める） |
| I まとめすぎ | 決定3でまとめた値どうしで、結果が違うと設計書が定める |
| J 付け替えの誤り | 要因ID・値の振り直しで、interactions・constraints・existing の値が合っていない、既存ケースの値を取り違えた |

次は指摘しない: 書き方・言い回し、差分に出ていない所（1巡目で済み）、決定そのものへの異論、境界値・数量1/複数。

## 出力

指摘が無ければ `NONE` の1語だけ。あれば1件ずつ、次の形で。

```
### <番号>
- 機能: <機能ID>
- 種類: <G〜J>
- 対象: <ファイル名> <要因ID・処理ID・組>
- 主張: <直した後の表に書かれていること>
- 実際: <設計書の記述（ファイル:行 を必ず添える）>
- 修正案: <どう直すか。1文>
```
