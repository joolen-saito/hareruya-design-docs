# B16-09 A の書き直したケースの直し（1巡目の指摘）

リポジトリ: `/home/y-saito/Developments/hareruya-design-docs/`。パスはここからの相対。出力はすべて日本語で書く。
あなたは B16-09 の書き直したケース（`integration_test/casegen/revive/cases/B16-09_A_rv_*.tsv`）の著者である。**git の変更操作（add・commit など）をしない。**
書いたときの依頼文は `integration_test/casegen/revive/prompts/B16-09_A.md`。決まり（線引き・直し方・シード）はそこにある。先に読み直す。

## 直すもの

codex のレビューの指摘: `integration_test/casegen/revive/review/B16-09_A_R1_findings.md`


## 指摘の捌き方

- **そのまま反映しない。** 1件ずつ設計書（`integration_test/casegen/fp_gap/units/B16-09/design.txt`）と、確かめる側の画面の設計書・既存ケース・実装（画面と項目が在るか）で確かめてから直す。レビュアーも誤る。
- 「期待結果の誤り」「設計書に無い期待」「確かめる場所の誤り」「用意しない前提が残る」「成立しない前提・手順」は、確かめて事実なら必ず直す。直せなければ、そのケースを「戻さない」に変えて理由を書く（ケースの行を消し、そのケースだけが使う書き直したシードも消す）。
- 「処置の誤り（戻せる）」は、決まりに当たらず設計書から期待結果が一意に決まるなら、ケースを戻す。
- 共通の環境シード（`revive/cases/B16-09_rv_shared_seeds.tsv`）への指摘は、直さずに処置の記録に「依頼元へ」と書く。
- 直した・外したことで、ケース・シード・処置の3ファイルが食い違わないようにする。

## 出力

- 3つのファイル（`B16-09_A_rv_test_cases.tsv`・`_rv_seed_data.tsv`・`_rv_dispositions.tsv`）を直す。
- 処置の記録 `integration_test/casegen/revive/review/B16-09_A_R1_dispositions.tsv`（タブ区切り・4列 `指摘	処置	理由	直したテストID`。処置は 採用／一部採用／却下）。指摘ごとに1行。
- 最後に `python3 integration_test/casegen/revive/verify_rv.py B16-09 A` を流し、合格するまで直す。ほかの検査は流さない。検査が誤っていると思ったら、言い換えで通さず返答で知らせる。
- ファイルの書き込みを拒否されたときは、回避せず、書くはずだった本文を返答に載せる。
- マシンの資源が少ない。リポジトリ全体や実装全体への grep・find はしない。

## 返答

4行以内。指摘の数と 採用／一部採用／却下 の数、戻すケースの増減（いまの件数）、verify の結果、却下の主な理由。
