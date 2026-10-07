#!/bin/bash
# usage: mk_cur.sh <機能ID> <書番> <シート名> <機能名>  現行仕様でのケース見直しのレビュー依頼文を作って codex に掛ける
python3 - "$@" <<'PY'
import pathlib,re,sys
fid,book,sheet,name=sys.argv[1:5]
s=pathlib.Path('B08-07_cur_prompt.md').read_text(encoding='utf-8')
head,rest=s.split('## 今回の範囲',1); _,tail=rest.split('## 意図的であり指摘対象外のもの',1)
head=head.replace('B08-07（身分証有効期限切れ通知）',f'{fid}（{name}）').replace('「0408 身分証有効期限切れ通知」',f'「{book} {sheet}」').replace('0408_*.html',f'{book}_*.html').replace('B08-07',fid)
mid=f'''## 今回の範囲

これは、HTML設計書に新しく載った「現行仕様」での見直しのレビューである。{fid} には機能設計書が無く、既存のケースは Excel由来の本文だけから作り、codex レビュー2巡を経ている。機能設計書を起こして埋め込んだので、`{fid}_sheet.txt` の「Source:」の行より後ろに現行仕様が載った。著者はそれを1文ずつ仕分け、ケースを足し、既存ケースの一部の出典・前提・期待結果を直した。仕分けは `sheetmap/review/{fid}_cur_dispositions.md`、依頼文は `sheetmap/CUR_SPEC_BRIEF.md`。
依頼元の裁定が `sheetmap/FIX_R1_BRIEF.md`（A〜L、C'）と `FIX_R2_BRIEF.md`（M〜O）にある。裁定に従っている箇所は指摘しない（とくに B: 「観点内で確定」の判定単位は適用条件が設計書から言えれば使える／C': 受ける判定単位が無いものは IT-0156、出力項目の構成・並びは IT-0348、レコードの並び順は IT-0349、通知メールの件名・送信元・本文の構成は IT-0350／H・L: 作り方が分からない前提は投入方法「未確定」で残す）。要求表に行が無い現行仕様の記述は、出典欄に「現行仕様 <小見出し>」と書く決まりである。
**現行仕様と Excel由来の本文が同じ事柄について食い違うときは Excel由来を採る**（`integration_test/SCOPE.md`）。Excel由来が項目名や上位の言い方しか書いておらず細部が無いときは、現行仕様で細部を決めてよい。
見るのは、(1) 現行仕様の各文の仕分けが妥当か（既存で確認済みとしたものが本当に確かめられているか、ケースにしないとしたものが実は期待結果を決められないか）、(2) 足したケースの期待結果が現行仕様の原文から一意に出るか・Excel由来の本文と矛盾しないか・前提と手順で到達できるか・判定IDが合うか、(3) 現行仕様を根拠に直した既存ケースが Excel由来の本文と矛盾していないか、(4) 現行仕様と矛盾する既存ケースが無いか、の4点である。スクリプトやコマンドは読むだけで実行しない。秘密情報・個別の会員の識別子は出力に書かない。指摘は最大15件。

'''
pathlib.Path(f'{fid}_cur_prompt.md').write_text(head+mid+'## 意図的であり指摘対象外のもの'+tail,encoding='utf-8')
PY
nohup bash "$(dirname "$0")/run_codex.sh" "$1_cur_prompt.md" "$1_cur_out.txt" >/dev/null 2>&1 &
