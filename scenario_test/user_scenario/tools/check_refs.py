"""シナリオIDの参照が実在するかを確かめる。

使い方: python check_refs.py <ファイル> [--all]
  ファイルに出てくるシナリオID（UXX-数字）が、どこかの業務の scenario_list.md のシナリオ一覧にあるかを確かめる。
  --all を付けると、全業務の全シナリオIDがそのファイルに1回以上出てくるかも確かめる（業務周期の表など）。
  対象外にしたシナリオ（scenario_list.md の対象外の節に「| UXX-NN（YYYY-MM-DD 対象外）…」の形で残したID）は欠番として実在に数え、
  --all の「載っていない」には数えない（2026-11-18 USM-03 を対象外にしたときに足した）。
"""
import re
import sys
from pathlib import Path

US = Path(__file__).resolve().parents[1]
ID = re.compile(r"\bU[A-Z]{2}-\d{2}\b")  # シナリオIDは数字2桁（「UTF-8」などを取り違えない。2026-11-27）


def all_ids():
    ids = {}
    for f in list(US.glob("*/scenario_list.md")) + list(US.glob("通しシナリオ/*/scenario_list.md")):
        for m in re.finditer(r"^\| (U[A-Z]{2}-\d+) \|", f.read_text(encoding="utf-8"), flags=re.M):
            ids[m.group(1)] = f.parent.name
    return ids


def retired_ids():
    out = {}
    for f in list(US.glob("*/scenario_list.md")) + list(US.glob("通しシナリオ/*/scenario_list.md")):
        for m in re.finditer(r"^\| (U[A-Z]{2}-\d+)（[^）\n]*対象外）", f.read_text(encoding="utf-8"), flags=re.M):
            out[m.group(1)] = f.parent.name
    return out


def main():
    path = Path(sys.argv[1])
    ids = all_ids()
    retired = {k: v for k, v in retired_ids().items() if k not in ids}
    text = path.read_text(encoding="utf-8")
    refs = set(ID.findall(text))
    bad = sorted(r for r in refs if r not in ids and r not in retired)
    old = sorted(r for r in refs if r in retired)
    print(f"参照 {len(refs)} 件・実在しない {len(bad)} 件" + (f"・対象外にしたID {len(old)} 件（{'・'.join(old)}）" if old else ""))
    for r in bad:
        print("  実在しない:", r)
    missing = []
    if "--all" in sys.argv:
        missing = sorted(i for i in ids if i not in refs)
        print(f"全シナリオ {len(ids)} 件のうち載っていない {len(missing)} 件")
        for i in missing:
            print(f"  載っていない: {i}（{ids[i]}）")
    sys.exit(1 if bad or missing else 0)


if __name__ == "__main__":
    main()
