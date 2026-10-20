# 依頼: 要因表を、codex の反証の指摘と決まりの直しで見直す（全機能の展開）

リポジトリは `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。git の変更操作（add・commit・push）をしない。
受け持ちの機能: **F03-02・F03-04・F03-05・F03-06**（この順に1つずつ。1つ終えて gate が合格してから次へ）

## 読むもの

- 作り方の決まり: `integration_test/casegen/combination/FACTOR_PROMPT.md`（最初に全部読み直す。決まりは途中で足した）
- 足した決まりの要点: `integration_test/casegen/combination/review/notes/rules_1020b.md`（AND・OR の絞り込み条件どうしは「関係しない」、優先順位で順に比べる所は「どの段で決まるか」の1要因）
- 要因表: `integration_test/casegen/combination/factors/<機能ID>_*.tsv`
- codex の指摘: `integration_test/casegen/combination/review/Y_09_out.txt` の末尾（最後の `codex` の行より後ろ。途中に出てくる文は codex の作業の記録で、指摘ではない。同じ指摘が2回続けて出ていることがある。1回分だけ処置する）。指摘は `- 機能: <機能ID>` で機能ごとに分かれている。受け持ちの機能の指摘だけを処置する。指摘が `NONE` だけ、または受け持ちの機能の指摘が無いこともある。

## やること（機能ごと）

1. 受け持ちの機能の指摘を1件ずつ、**設計書とケースを自分で読んで確かめる**。指摘をそのまま反映しない（レビュアーも誤る）。修正案の語もそのまま採らず、設計書の表記を使う。
2. 正しい指摘だけ要因表を直す。誤り・範囲外・決まりに反する指摘は却下し、理由を書く。
3. この指摘は、依頼者の3つの決定（`integration_test/casegen/combination/SWEEP_PROMPT.md` の表。打ち切り側は1回でよい／列ごとに独立して決まる値は組にしない／結果が同じ値はまとめる）の当て方についてのもの。決定そのものは変えない。担当の処置 `review/<機能ID>_factors_s_dispositions.tsv` を読み、設計書で確かめて、当て方が誤っている所だけ直す。決まりの見直しはしない。
4. `python3 integration_test/casegen/combination/gate_factors.py <機能ID>` が合格するまで直す。
5. 処置を `integration_test/casegen/combination/review/<機能ID>_factors_y_dispositions.tsv` に書く（タブ区切り・4列: `番号	処置	理由	直した所`。番号は指摘の見出しの番号。決まりの見直しは `決まり` の番号で書く。処置は `採用`／`一部採用`／`却下`／`直しなし`）。指摘も見直しも無い機能は、`決まり	直しなし	当たる所なし	` の1行だけ書く。

書いてよいのは受け持ちの機能の `factors/<機能ID>_*.tsv` とその dispositions、スクラッチパッド（`/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/7ac77140-f212-4eb4-b04c-5cbd0cc6fcfa/scratchpad/` の下、名前に機能IDを入れる）だけ。`combos/` は gate が作り直す。
**まだケースを書いていない機能なので、要因ID・値の振り直しはしてよい**（gate は組を並べ直す）。

## 返答

機能ごとに1行: 機能ID: 採用・一部採用・却下の件数、決まりの見直しで直したか、gate の行の数（前→後）。最後に、迷った点（あれば機能IDつきで1つずつ）。
