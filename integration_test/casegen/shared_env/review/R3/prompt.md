# 敵対レビュー R3（最終・範囲を絞る）

ファイルは読むだけ。前回 R2 の指摘（`integration_test/casegen/shared_env/review/R2/out.txt` の末尾）に対する処置を確かめる。
判定の規則は `integration_test/casegen/shared_env/work/BRIEF.md`（末尾の追記まで）、判定表は `integration_test/casegen/shared_env/decisions.tsv`、
書き足した文はシード表 `integration_test/casegen/cases/<機能ID>_seed_data.tsv` の投入方法の末尾（「／〔共有の設定〕」以降）。

## 反映したもの（文がシードの内容と合っているか確かめる）
S-F06-18-PC-ENV（手元だけを追加）、S-F06-26-MAIL（手元だけを追加）、S-M03-26-SMAREGI-ENV（戻すを追加）、S-F04-04-SPLINKS-ENV（戻すを追加・設定済みの設定名を直した）、S-F05-06-PD-ENV（戻すを追加）

## 受け入れなかったもの（理由が誤りなら指摘する）
- F09-03・M13-11・M08-12・F07-02-NOFORMAT-046・A17-01-NONE-005 の削除: このケース専用の名前（F0903-002-F、ページング大会、新規GroupＡ、フォーマット未設定確認）や固定の識別子（903001、WP投稿ID 999999005）で絞った削除で、共有の設定やほかの人の業務データには当たらないため「変えない」のまま。
- S-M05-02-CSV-COLS・S-M05-04-COLS: 共有のCSV出力項目の定義（種別・項目名）をDBで直接書き換え・追加するため、R1 の指摘どおり「手元だけ」のまま。
- S-F05-02-ENV: 本店IDは既に「設定済み」の設定名（本店IDとユニサーチ検索・サジェストの接続先）に含まれる。

## 出力
新しい事実の誤りが無ければ `NONE` の1語。あれば `シードID / 今の判定 / 正しい判定 / 根拠`。前回と同じ主張の再提示は書かない。
