"""シナリオIDの参照が実在するかを確かめる。

使い方: python check_refs.py <ファイル> [--all]
  ファイルに出てくるシナリオID（UXX-数字）が、どこかの業務の scenario_list.md のシナリオ一覧にあるかを確かめる。
  --all を付けると、全業務の全シナリオIDがそのファイルに1回以上出てくるかも確かめる（業務周期の表など）。
"""
import re
import sys
from pathlib import Path

US = Path(__file__).resolve().parents[1]
ID = re.compile(r"\bU[A-Z]{2}-\d+\b")


def all_ids():
    ids = {}
    for f in list(US.glob("*/scenario_list.md")) + list(US.glob("通しシナリオ/*/scenario_list.md")):
        for m in re.finditer(r"^\| (U[A-Z]{2}-\d+) \|", f.read_text(encoding="utf-8"), flags=re.M):
            ids[m.group(1)] = f.parent.name
    return ids


def main():
    path = Path(sys.argv[1])
    ids = all_ids()
    text = path.read_text(encoding="utf-8")
    refs = set(ID.findall(text))
    bad = sorted(r for r in refs if r not in ids)
    print(f"参照 {len(refs)} 件・実在しない {len(bad)} 件")
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
