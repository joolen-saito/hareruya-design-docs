"""反映（cascade）の差分レビューの観点ファイルを作る。
使い方: python make_cascade_review.py <組の名前> <巡> <作業一覧のファイル> <写しのフォルダ> <フォルダ...>
差分は各フォルダの review/<記録名>.diff に書く。観点は 反映レビュー/<組>/review/prompt_R<n>.md。
"""
import subprocess, sys
from pathlib import Path
US = Path(__file__).resolve().parents[1]
DOCS = US.parents[1]
g, n, worklist, before = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
folders = sys.argv[5:]
tag = Path(worklist).stem.replace("cascade_worklist", "cascade")  # cascade_2
rec = "cascade2_2026-11-05"
lst = []
for f in folders:
    diff = subprocess.run(["diff", "-ruN", f"{before}/{f}", str(US / f), "--exclude=review", "--exclude=matrix.md", "--exclude=matrix.tsv", "--exclude=matrix_判断待ち禁則なし.md", "--exclude=matrix_判断待ち禁則なし.tsv"], capture_output=True, text=True).stdout
    (US / f / "review").mkdir(parents=True, exist_ok=True)
    (US / f / "review" / f"{rec}.diff").write_text(diff, encoding="utf-8")
    lst.append(f"- `{US}/{f}/`：変更の記録 `review/{rec}.md`、差分 `review/{rec}.diff`（{len(diff.splitlines())}行）")
prev = ""
if n > 1:
    ds = "・".join(f"`dispositions_R{i}.md`" for i in range(1, n))
    prev = f"\n## 前の巡の扱い\n\n指摘と扱いは `{US}/反映レビュー/{g}/review/` の {ds}。却下したものは繰り返さない。前の巡で直したところを特に確かめる。新しい事実の指摘だけを書く。{'今回がこの回の最後の巡。' if n >= 3 else ''}\n"
t = f"""# レビュー依頼：作業一覧2の反映（{g}・R{n}）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 背景
シナリオテスト（`{US}/`）で、依頼者の決定により次を今のシナリオに反映した。作業一覧は `{worklist}`（この組の表だけを見る）。
- 機能との突き合わせ（`{US}/機能との突き合わせ/README.md`）で見つかった抜け10件を足す
- 部門更新CSV登録（M03-35）を現状版の業務フローの工程としてスマレジ連携 USM-10 で試験する
- 通しシナリオ（`{US}/通しシナリオ/UTH-01〜05`。レビュー済み）の dispositions_R3.md「今のシナリオ（区間のL2）へ戻すべきこと」
{prev}
## 成果物（レビュー対象。今回の変更だけを見る）
{chr(10).join(lst)}

作り方の決まりは `{US}/AUTHORING.md`。各フォルダの以前のレビューの採否は `review/dispositions_R*.md`。

## 正本（オラクル）
- 業務フロー：`{DOCS}/scenario_test/markdown/`
- 設計書HTML（Excel由来を優先）：`{DOCS}/excel_to_html/output/*.html`（巨大なので grep で）
- 新実装：`/home/y-saito/Developments/ec-cube-enterprise/`、現行：`/home/y-saito/Developments/pf-eccube3/`・`/home/y-saito/Developments/front-application/MTGBuyer/`
- 開発環境の設定：`/home/y-saito/Developments/ec-cube-enterprise/eccube_db_20260907.sql.gz`（zcat と sed/grep で該当表だけ。認証情報・個人情報は出力に絶対に書かない）
- 依頼者の裁定：`{DOCS}/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`
- 通しシナリオ：`{US}/通しシナリオ/*/scenario_list.md`・`review/dispositions_R3.md`

## 重点観点
1. **反映の正しさ**：作業一覧の出どころ（通しシナリオ・突き合わせの確定した結論）と食い違う書き方をしていないか。参照したIDが本当にその内容か
2. **足した手順・期待値の根拠**：業務フロー・設計書・新実装から言えるか（書き過ぎ・捏造が無いか）。抜けとして足した機能の画面・CSVの名前と操作が設計書どおりか
3. **判断待ちの扱い**：判断待ちを期待値として断定していないか。逆に、正本で決まるのに判断待ちにしていないか
4. **マトリクス**：変えたマトリクスの禁則・例外の差し込む元の条件が成立に必要十分か
5. **反映漏れ**：この組の表の行で、反映されていないもの・理由が正しくないもの

## 指摘しないもの
- 物理名を足す提案、文体の好み、他フォルダの範囲、非機能・データ移行・現行との比較

## 出力形式
指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・シナリオID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 / 切り方の誤り / 禁則の誤り のいずれか
修正案: 結論を先に1文で
"""
out = US / "反映レビュー" / g / "review" / f"prompt_R{n}.md"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(t, encoding="utf-8")
print(out)
