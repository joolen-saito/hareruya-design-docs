#!/usr/bin/env python3
"""Backlog: カテゴリ「不具合（バグ）」かつ状態が未対応／処理中の課題を取る。

読み取りのみ。既存スナップショット backlog_wip/issues_bug_all.json は上書きせず、
別ファイル backlog_wip/issues_bug_open.json に落とす。
"""
import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_backlog import BacklogClient, pick_by_name  # noqa: E402

PROJECT = "ECCUBE_HARERUYA"
CATEGORY = "不具合（バグ）"
WANT = ("未対応", "処理中")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "backlog_wip", "issues_bug_open.json")


def main() -> int:
    c = BacklogClient.from_environment()
    proj = c.get_project(PROJECT)
    cats = c.get(f"/projects/{PROJECT}/categories")
    cat = pick_by_name(cats, CATEGORY, label="カテゴリ")
    sts = c.get_statuses(PROJECT)
    print(f"project={PROJECT} id={proj['id']} category={cat['id']} {cat['name']}")
    print("状態マスタ: " + " / ".join(f"{s['id']}:{s['name']}" for s in sts))

    want = [s for s in sts if s["name"] in WANT]
    missing = set(WANT) - {s["name"] for s in want}
    if missing:
        print(f"状態が見つからない: {missing}", file=sys.stderr)
        return 1

    got, off = [], 0
    while True:
        b = c.get("/issues", {"projectId[]": [proj["id"]],
                              "categoryId[]": [cat["id"]],
                              "statusId[]": [s["id"] for s in want],
                              "count": 100, "offset": off,
                              "sort": "created", "order": "asc"}) or []
        got += b
        if len(b) < 100:
            break
        off += len(b)

    print(f"取得 {len(got)}件")
    for k, v in Counter(i["status"]["name"] for i in got).most_common():
        print(f"  {k}: {v}")
    json.dump(got, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"保存: {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
