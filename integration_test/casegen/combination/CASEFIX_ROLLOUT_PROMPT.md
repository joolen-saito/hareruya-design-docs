# 依頼: 要因の組合せのケースを、codex のレビューの指摘と前提条件の検査で直す（{ROUND}巡目・束 {BUNDLE}）

リポジトリは `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。git の変更操作（add・commit・push）をしない。
受け持ち: **{TARGETS}**（この順に1つずつ。`機能ID:組の範囲` とあるものは、その範囲の部だけ）

あなたは、別の著者が書いたケースを直す担当である。ケースの書き方・前提条件の決まりは著者と同じ。

## 読むもの

- 作り方の決まり: `integration_test/casegen/combination/GEN_PROMPT.md`（最初に全部読む。`{FID}` などの差し込みは受け持ちの機能に読み替える）
- codex の指摘: `integration_test/casegen/combination/review/R{ROUND}_{BUNDLE}_findings.md`。見出しは `### 指摘（<機能ID> / <テストID または 組ID>）`。指摘が `NONE` だけのこともある
- 前提条件の検査の不合格（ある機能だけ）: `integration_test/casegen/combination/review/<機能ID>_gate.txt`。合流したときに検査が出す不合格の行で、今回足したケース・シードに当たるものだけを集めてある
- 依頼元の決まり（下の「依頼元の追記」）
- 機能ごとのファイル: `integration_test/casegen/combination/cases/` の `<機能ID>_cb_test_cases<部>.tsv`・`_cb_seed_data<部>.tsv`・`_cb_dispositions<部>.tsv`、試す値の組 `combos/<機能ID>.tsv`、要因表 `factors/<機能ID>_*.tsv`、設計書 `units/<機能ID>/design.txt`、既存のケースとシード `integration_test/casegen/cases/<機能ID>_test_cases.tsv`・`_seed_data.tsv`

**部のある機能**（`cases/<機能ID>_cb_test_cases.p1.tsv` があるもの）は、部のファイル（`.p1.tsv`・`.p2.tsv` …）を直す。つないだファイル（部の無い名前）は直さない。直したら `python3 integration_test/casegen/combination/combine_parts.py <機能ID>` でつなぎ直す。テストIDの範囲は部ごとに決まっている（その部の最初の番号から、次の部の最初の番号の手前まで）。

## やること（機能ごと）

1. 指摘を1件ずつ、**設計書と既存ケースを自分で読んで確かめる**。指摘をそのまま反映しない（レビュアーも誤る）。修正案の語もそのまま採らず、設計書の表記を使う。
2. 正しい指摘だけ直す。直し方は次のどれか。
   - 期待結果に、欠けていた要因の結果を足す（確かめる所が同じものだけ）／設計書に無い期待を外す／値・計算を直す
   - 事前準備・手順を、組の値で処理が動く形に直す
   - 組が作れない・結果が決まらないと分かったら「ケースにしない」へ変える（ケースとそのケース専用シードを消し、dispositions の理由に設計書の原文を引く。テストIDは欠番のままでよい。番号を詰めない）
   - 「既存ケースで確認済み」が当たらないときは、ケースを書く（テストIDは受け持ちの範囲で、いま使っている最大の番号の次）か、「ケースにしない」にする
   - 「ケースにしない」が誤りで期待結果が一意に決まるときは、ケースを書く
3. 誤り・範囲外・決まりに反する指摘は却下し、理由を書く。
4. `_gate.txt` の不合格を直す。よく出るもの:
   - **G5 識別子が他のケース専用シードと重なる／他ケースの専用データを使っている**: ケース専用データの識別子（コード・名称・メール・ファイル名・パスワード・サイズの値など、字句 `[A-Za-z0-9][A-Za-z0-9_.@\-]{3,}`）が、別のシード・別のケースの文に出ている。識別子をシードごとに一意な値へ変える（例: 末尾にケース番号を付ける）。サイズ・画素数などの値が重なるだけなら、表記を「250 kB」のように字句に当たらない形にするか、値を変える。既存のケース（今回足していないもの）は直さない。今回足したものの側を直す
   - **G3 期待結果の変化前の値が事前準備に無い**: 期待結果の「AからB」「Aのまま」の A を、事前準備に同じ表記で書く
   - そのほか: 行の文言を読んで、前提条件の決まり（GEN_PROMPT.md の「前提条件」）に合わせる
5. `python3 integration_test/casegen/combination/verify_cb.py <機能ID>`（部のある機能は `<機能ID>:p<n>` を部ごとに）が合格するまで直す。
6. 処置を `integration_test/casegen/combination/review/<機能ID>_R{ROUND}_dispositions<部>.tsv` に書く（タブ区切り・4列・見出し行あり: `指摘	処置	理由	直した所`。指摘は見出しのテストIDか組ID、検査の行は `gate:<テストIDかシードID>`。処置は `採用`／`一部採用`／`却下`）。指摘も検査の不合格も無い機能は `-	直しなし	指摘なし	` の1行。

書いてよいのは受け持ちの機能の `combination/cases/<機能ID>_cb_*` と、その `review/<機能ID>_R{ROUND}_dispositions*.tsv`、スクラッチパッド（`/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/7ac77140-f212-4eb4-b04c-5cbd0cc6fcfa/scratchpad/` の下、名前に機能IDと `R{ROUND}` を入れる）だけ。要因表（`factors/`）・`combos/`・`units/`・既存の `integration_test/casegen/cases/` は書き換えない。ほかの検査（gate_dry.sh など）は流さない。

## 依頼元の追記（2026-10-20）

{NOTES}

## 返答

機能ごとに1行: 機能ID: 採用・一部採用・却下の件数、検査の不合格を直した数、verify の結果。最後に、迷った点（あれば機能IDつきで1つずつ）。
