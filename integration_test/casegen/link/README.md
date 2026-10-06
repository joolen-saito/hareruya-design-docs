# 機能間データ連携の結合テストケース

観点表の IT-0332〜IT-0340（`../../viewpoint_canonical/build_canonical.py` の `ADD_LINK`）に当たるケースを作った作業場所。

**ケースの正本は `../cases/<機能ID>_test_cases.tsv` である。** 2026-10-06 に、ここで作った142件を機能ごとのケースファイルへ合流させた
（依頼者決定）。全ケースの一覧は `../all_test_cases.tsv`（`../build_all_test_cases.py` で作る。8,467件）。

| ファイル | 内容 |
| --- | --- |
| `merged_map.tsv` | 合流前のテストID（`IT-<機能ID>-L001`）→ 合流後のテストID、判定ID、機能ID。**判定IDはここにしか無い**（ケースファイルは既存の11列に合わせたため） |
| `merged_renames.tsv` | 合流後に前提条件のゲート（識別子の一意性）を通すために改名した識別子 |
| `merge_into_cases.py`／`fix_merged_gate.py` | 合流と、合流後のゲート対応 |
| `cases/` | 合流前の作業用ファイル（12列・判定ID列あり）。**合流後は更新していない。**識別子の改名や要求IDの整理は正本にだけ入っている |
| `out_of_scope/` | レビューで外したケース（重複、推測による接続、設計書に根拠が無いもの）。理由と付け替え先の提案つき |
| `gen_<機能ID>/report.md` | 機能ごとの著者の報告（判定IDごとの評価、対応表、書かなかった連携、設計書の不備）。テストIDは合流前のもの |
| `review/*_dispositions.md` | codex レビューの指摘と裁定 |
| `link_targets.tsv`（`build_link_targets.py`） | 適用先の候補の台帳。下流候補は機械抽出で抜けがある |
| `GEN_LINK_PROMPT_TEMPLATE.md`／`AGENT_BRIEF.md`／`RESTORE_BRIEF.md`／`ADD_BRIEF.md` | 著者への依頼文。「判定IDごとの範囲」が範囲の正 |
| `verify_link.py` | 合流前のファイル（`cases/`）用の機械検査 |

## 合流後に知っておくこと

- 前提条件のゲート `../precond/gate_precond.py --all` は合格。足したテストIDは `../precond/added_cases.tsv` に載せた（基線は書き換えていない）。
- `../verify_cases.py` は、合流した142件のうち10件で「引用不一致」を出す。下流機能の設計書の文言（他機能のメッセージや画面部品の名前）と
  テストデータの名前を引いているためで、この検査が自機能の設計書しか読まないことによる。
- 実機では1件も流していない。
- 6機能（M01-01・M05-14・M10-04・M10-05・M10-06・M11-05）は、連携ケースだけを持つケースファイルを新設した。機能単体のケースは無い。
