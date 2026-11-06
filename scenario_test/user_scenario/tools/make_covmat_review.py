"""網羅マトリクスの対応表のレビュー観点を、前の巡の観点から作る。使い方: python make_covmat_review.py <組> <巡>"""
import sys
from pathlib import Path
US = Path(__file__).resolve().parents[1]
g, n = sys.argv[1], int(sys.argv[2])
d = US / "網羅マトリクス" / g / "review"
t = (d / "prompt_R1.md").read_text(encoding="utf-8").replace("・R1）", f"・R{n}）")
ds = "・".join(f"`{p.name}`" for p in sorted(d.glob("dispositions_R*.md")))
prev = f"## 前の巡の扱い\n\n指摘と扱いは `{d}/` の {ds}。却下・一部採用の理由を確かめ、同じ指摘を繰り返さない。前の巡で直したところと、同じ型の誤り（偽の○・偽の対象外）がほかの行に残っていないかを特に確かめる。新しい事実の指摘だけを書く。{'今回が最後の巡。' if n >= 3 else ''}\n\n"
t = t.replace("## 正本", prev + "## 正本", 1)
(d / f"prompt_R{n}.md").write_text(t, encoding="utf-8")
print(d / f"prompt_R{n}.md")
