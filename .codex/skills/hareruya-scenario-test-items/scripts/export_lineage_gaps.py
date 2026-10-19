#!/usr/bin/env python3
"""Export de-duplicated, source-researched lineage gaps after SCN generation."""
import argparse
import csv
import re
from pathlib import Path

from business_assertions import resolve_link_identity
from generate_test_items import data_link_items, parse_scenario
from lineage_gaps import unresolved_lineage_evidence


def export(repo: Path, output: Path):
    groups = {}
    for path in sorted((repo / "scenario_test/scenario").glob("SCN-*.md")):
        scenario = parse_scenario(path, repo)
        for link, item in zip(scenario.data_links, data_link_items(scenario, 1)):
            if "保留として記録" not in item.expected:
                continue
            artifact, producer, consumer = (link.get(k, "") for k in ("産出データ/帳票", "産出工程", "消費工程"))
            key = link.get("照合キー", "-")
            unknown = key in {"", "-"} or any(t in key for t in ("未定義", "自由端", "不明"))
            if resolve_link_identity(artifact, producer, scenario.business) or "在庫移動実績" in artifact:
                unknown = False
            origin = "起点" in link.get("判定", "") or "産出元" in producer
            reason, sources, decision = unresolved_lineage_evidence(scenario, link, unknown, origin)
            name = re.sub(r"^#\d+\s*", "", artifact)
            group_key = (scenario.business, name, producer, consumer)
            group = groups.setdefault(group_key, {"scenarios": [], "refs": [], "reason": reason, "decision": decision,
                                                   "kind": "産出元未記載" if origin and not unknown else "照合キー未確定＋産出元未記載" if origin else "照合キー未確定"})
            group["scenarios"].append(f"{scenario.sid}/{link['連鎖ID']}")
            group["refs"].extend(sources)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file, delimiter="\t", lineterminator="\n")
        writer.writerow(["業務", "成果物", "産出工程", "消費工程", "残件種別", "対象件数", "対象SCN/連鎖ID", "未確定理由", "調査出典", "必要な判断"])
        for key, value in groups.items():
            writer.writerow([*key, value["kind"], len(value["scenarios"]), " / ".join(value["scenarios"]), value["reason"],
                             " / ".join(dict.fromkeys(value["refs"])), value["decision"]])
    return len(groups), sum(len(value["scenarios"]) for value in groups.values())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--output", default="scenario_test/coverage/lineage_resolution_review.tsv")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    groups, occurrences = export(repo, repo / args.output)
    print(f"lineage gaps: {groups} unique / {occurrences} scenario occurrences")
