#!/usr/bin/env python3
"""
D1: fid_kubun.tsv を「対象の正典 it-target-functions.tsv × 区分の出典 todo-list.md」のjoinで
決定的に生成する（具体化先行W0の開始ゲート入力）。

対象集合の正 = integration_test/it-target-functions.tsv（id=機能No・ステータス）。
区分の出典     = functions/todo-list.md（機能No→カスタマイズ区分・詳細設計書md→fid）。

出力: integration_test/fid_kubun.tsv
  列: 機能No  fid  機能名  ステータス  カスタマイズ区分  設計書md  source_class許可  保留
区分→source_class許可（ORACLE_M0_PLAN source_class規約）:
  標準       → standard-src+design（ee実ソース直接可）
  新規実装   → excel-only（Excel設計書のみ・沈黙TBD・HUMAN_DECISION）
  現行踏襲   → excel-primary+pf-fallback（Excel優先・不足時のみpf現行回帰）
  カスタマイズ→ excel-primary+pf-fallback
  （空/不明/todo未載）→ 保留=HUMAN_DECISION（source_class未確定・W0開始前に解決必須）

再現性: 2入力のsha256と本スクリプトで一意。保留は「保留=1」で残し、W0開始ゲートで解決必須。
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "integration_test" / "it-target-functions.tsv"
TODO = ROOT / "functions" / "todo-list.md"
OUT = ROOT / "integration_test" / "fid_kubun.tsv"

KUBUN_TO_SRC = {
    "標準": "standard-src+design",
    "新規実装": "excel-only",
    "現行踏襲": "excel-primary+pf-fallback",
    "カスタマイズ": "excel-primary+pf-fallback",
}
MD_RE = re.compile(r"\[md\]\(([^)]+\.md)\)")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_todo(raw: str):
    """機能No -> (kubun, fid, md_path). 機能No空(バッチ等)は fid をキーに補助登録。"""
    by_no, by_fid = {}, {}
    for line in raw.splitlines():
        if not line.startswith("| - ["):
            continue
        cols = [c.strip() for c in line.split("|")]
        if len(cols) < 9:
            continue
        kino_no, kubun, design = cols[5], cols[6], cols[8]
        m = MD_RE.search(design)
        fid = Path(m.group(1)).stem if m else ""
        md = m.group(1) if m else ""
        if kino_no:
            by_no[kino_no] = (kubun, fid, md)
        elif fid:
            by_fid[fid] = (kubun, fid, md)
    return by_no, by_fid


def main() -> int:
    for p in (TARGET, TODO):
        if not p.exists():
            print(f"ERROR: {p} not found", file=sys.stderr)
            return 2
    target_sha, todo_sha = sha(TARGET), sha(TODO)
    by_no, _ = parse_todo(TODO.read_text(encoding="utf-8"))

    rows, held = [], 0
    tlines = TARGET.read_text(encoding="utf-8").splitlines()
    for line in tlines[1:]:
        c = line.split("\t")
        if len(c) < 3 or not c[0]:
            continue
        kino_no, kimei, status = c[0], c[1], c[2]
        hit = by_no.get(kino_no)
        if hit:
            kubun, fid, md = hit
        else:
            kubun, fid, md = "", "", ""
        if kubun in KUBUN_TO_SRC:
            src, hold = KUBUN_TO_SRC[kubun], "0"
        else:
            src, hold = "保留=HUMAN_DECISION", "1"
            held += 1
        rows.append((kino_no, fid, kimei, status, kubun or "(未載/空)", md, src, hold))

    rows.sort(key=lambda r: r[0])
    header = "機能No\tfid\t機能名\tステータス\tカスタマイズ区分\t設計書md\tsource_class許可\t保留"
    body = "\n".join("\t".join(r) for r in rows)
    content = (
        f"# fid_kubun.tsv (D1) = it-target-functions.tsv(対象) × todo-list.md(区分) join\n"
        f"# target_sha256={target_sha}\n"
        f"# todo_sha256={todo_sha}\n"
        f"# total={len(rows)} held={held} standard={sum(1 for r in rows if r[6]=='standard-src+design')} "
        f"excel_only={sum(1 for r in rows if r[6]=='excel-only')} "
        f"excel_pf={sum(1 for r in rows if r[6]=='excel-primary+pf-fallback')}\n"
        f"# 保留=区分不明/todo未載でsource_class未確定・W0開始前に解決必須\n"
        f"{header}\n{body}\n"
    )
    OUT.write_text(content, encoding="utf-8")
    print(f"wrote {OUT} rows={len(rows)} held={held}")
    print(f"output_sha256={hashlib.sha256(content.encode()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
