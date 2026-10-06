#!/usr/bin/env python3
"""link_targets.tsv から機能ごとの生成依頼文を作る。 make_link_prompts.py [機能ID...]"""
import csv, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
L = ROOT / "integration_test/casegen/link"


def main(fids):
    inv = {r["id"].upper(): r["title"] for r in csv.DictReader(
        (ROOT / "endpoint_reports/function_dependency_inventory.tsv").open(encoding="utf-8"), delimiter="\t")}
    tpl = (L / "GEN_LINK_PROMPT_TEMPLATE.md").read_text(encoding="utf-8")
    rows = [r for r in csv.DictReader((L / "link_targets.tsv").open(encoding="utf-8"), delimiter="\t")
            if not fids or r["上流機能"] in fids]
    # 同じ上流機能が複数の方向に出るときは1本の依頼にまとめる
    by = {}
    for r in rows:
        by.setdefault(r["上流機能"], []).append(r)
    for fid, rs in by.items():
        t = (tpl.replace("{FID}", fid).replace("{FNAME}", inv.get(fid, ""))
             .replace("{DIRECTION}", " ／ ".join(r["方向"] for r in rs))
             .replace("{JUDGE_IDS}", " ／ ".join(f'{r["方向"]}={r["判定ID"]}' for r in rs))
             .replace("{CANDIDATES}", " ／ ".join(f'{r["方向"]}={r["下流候補"]}' for r in rs))
             .replace("{CHAINS}", ",".join(r["連鎖ID"] for r in rs if r["連鎖ID"]) or "なし"))
        d = L / f"gen_{fid}"
        d.mkdir(parents=True, exist_ok=True)
        (d / "prompt.md").write_text(t, encoding="utf-8")
    (L / "cases").mkdir(exist_ok=True)
    print(len(by), "本")


if __name__ == "__main__":
    main(sys.argv[1:])
