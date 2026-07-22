#!/usr/bin/env python3
"""上限なし・適用述語ありの再計算 vs 既存 all_it_cases.tsv の実行キー差分=0 を検証。

promotion/unexpanded パイプラインの代替。差分が出たら母集合の欠落・余剰を示す。
"""
import sys, csv, importlib.util
from pathlib import Path

def main() -> int:
    repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    gp = repo / ".codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py"
    spec = importlib.util.spec_from_file_location("gen", gp)
    gen = importlib.util.module_from_spec(spec); sys.modules["gen"] = gen
    spec.loader.exec_module(gen)
    vps = gen.read_viewpoints(repo / "integration_test/integration-test-viewpoints.md")
    gen.load_applicability(repo)
    recomputed = set()
    for h in gen.discover_html(repo):
        doc = gen.read_html(h)
        rows, _, _ = gen.make_rows(doc, vps, 0, {"結合"})
        for r in rows:
            recomputed.add(r[1])  # testID
    existing = set()
    with (repo / "integration_test/all_it_cases.tsv").open(encoding="utf-8") as f:
        r = csv.reader(f, delimiter="\t"); next(r, None)
        for row in r:
            if len(row) >= 2:
                existing.add(row[1])
    missing = existing - recomputed
    extra = recomputed - existing
    print(f"既存 {len(existing)} / 再計算 {len(recomputed)} / 不足 {len(missing)} / 余剰 {len(extra)}")
    if missing or extra:
        print("NG: 母集合に差分。generate_it_cases --overwrite で再生成が必要。")
        return 1
    print("OK: 実行キー完全一致。unexpanded昇格対象なし。")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
