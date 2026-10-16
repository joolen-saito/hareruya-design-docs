# 敵対レビュー依頼：既存の結合テストケースと設計書の食い違いの照合結果（束V3・22行）

あなたはレビュアーである。照合した者とは別人として、下の照合結果を原文と突き合わせ、誤りを指摘せよ。ファイルは変更しない。スクリプトは読むだけで実行しない（grep・sed・cat 等の閲覧は可。rg は使わない）。出力は日本語。
レビューは事実確認に限る。設計書に無い仕様を足す提案はしない。

## 背景

結合テストケースを足す作業の途中で、エージェントが「既存ケースと設計書の食い違い」「設計書の中の食い違い」を52件報告した（`integration_test/casegen/datapattern/existing_case_conflicts.txt`。論点ごとに分けたものが `conflicts/items.tsv`）。
照合担当が原文を照合し、分類・裁定案・直し方の文案を書いた。これを設計の裁定に回す前に、事実の誤りを除きたい。

## 読むもの（/home/y-saito/Developments/hareruya-design-docs/ 配下）

- 照合結果: `integration_test/casegen/datapattern/conflicts/merged.tsv`（1列目が束。あなたの担当は束 G7・G8 の行＝項目 C37-1 C37-2 C38a C38b C39-1 C39-2 C40 C41 C42 C43a C43b C43c C44 C45 C46-1 C46-2 C47 C48 C49 C50a C50b C51-1）
- 照合の依頼文（分類の定義と規則 R1・R2）: `integration_test/casegen/datapattern/conflicts/BRIEF.md`
- 出所つきの設計書の写し: `integration_test/casegen/datapattern/conflicts/prov/<機能ID>.tsv`（2列目が出所。`Excel`＝Excel由来の本文、`埋め込み …md`＝埋め込まれた機能設計書。行番号は報告が引く行番号と同じ）。正本は `excel_to_html/output/*.html`
- 既存ケース: `integration_test/casegen/cases/<機能ID>_test_cases.tsv`、外したケース `integration_test/casegen/excluded_open_cases.tsv`・`excluded_hold_cases.tsv`、重ね書き `integration_test/casegen/seed_screen/cases/<機能ID>.tsv`
- 2026-08-19 の依頼者決定: `.cursor/skills/output-exclusion-policy/SKILL.md` の 72 行目付近（埋め込みの機能設計書のうち「表示メッセージ」の節だけは現行仕様ではなくリニューアル後の仕様。HTML では末尾に「リニューアル後の仕様」の見出しで出る）

`integration_test/casegen/datapattern/conflicts/review/` の `*_out.txt` と、担当外の束の行は読まない。

## 確かめること（行ごと）

1. 引用した原文（行番号・出所）が prov と一致するか。前後の行や同じ冊子の別シートに、結論を変える記述（改訂日、「削除」「変更」「廃止」、条件の範囲）が落ちていないか
2. ケースの記述の引用が今の `cases/` と一致するか。「直し不要」としたケースが実際に採るべき側か
3. 分類が定義どおりか。R1（埋め込み対 Excel 由来）・R2（同じ出所の中の改訂前後）の当てはめが正しいか。「規則で決まる」としながら、実際は R1・R2 のどちらにも当たらない（埋め込みどうし、Excel どうし）ものは、どの規則にも当たらないことを指摘する。表示メッセージの節（リニューアル後の仕様）と現行仕様の節の食い違いを、照合者が R1 の拡張として決めた行がある。そう決めた行と、同じ型なのに設計裁定にした行があれば、型が同じであることを指摘する（どちらに揃えるかは依頼者が決める）
4. 直し方の文案に、設計書に無い値・ふるまいが入っていないか。数値（桁数、件数、金額、文字数）の計算が合っているか
5. 「設計裁定」の問いが、原文の食い違いを正しく言い表しているか。共通部分の文案が両方の記述と矛盾しないか

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で、項目の順に書く。確信の持てないものは挙げない。

```
### 指摘（<項目> / <機能ID>）
- 主張: 照合結果の記述（要点の引用）
- 実際: 原文の事実（prov の行番号・出所。原文を引く）／ケースの事実（テストID・列）
- 判定: 引用の誤り／見落とし／分類の誤り／規則の当てはめの誤り／同型で扱いが違う／文案に設計書に無い値／計算の誤り／問いの誤り
- 修正案: 結論を先に置いた1〜2文
```
