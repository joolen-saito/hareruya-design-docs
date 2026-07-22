#!/usr/bin/env python3
"""codexが付けた機能割当を決定的に裏取りする（fable5レビューの代替ガード）。

各割当行について、根拠(file:line)のメソッドの #[Route(name:, path:)] を実ソースから取り、
割当先設計書の本文に「ルート名」または「URLパス断片」が現れるかを確認する。
どちらも現れない割当は根拠が弱い誤割当候補として --apply で未割当へ差し戻す。

これは m02-06(ホームのおすすめプラグイン) に PluginController(/store/plugin) の
メッセージが誤マップされる類の誤りを機械的に捕捉するためのもの。

使い方:
  python3 verify_assign.py --slices ee            # slices/ee/*.resolved.tsv を検査
  python3 verify_assign.py --slices ee --apply     # 弱い割当を未割当へ差し戻す
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
FUNCTIONS = L.DOC_ROOT / "functions"
FID_RE = re.compile(r"^[a-z]\d{2}-\d{2}$")
# methods:['GET'] 等の ] が本体に混じるため、#[Route( を起点に後続窓から name/path を拾う
ROUTE_START = re.compile(r"#\[\s*Route\(")
NAME_IN = re.compile(r"name:\s*['\"]([^'\"]+)['\"]")
PATH_IN = re.compile(r"path:\s*['\"]([^'\"]+)['\"]")


def routes_of(php: Path):
    """(行番号, name, path) 昇順。"""
    if not php.exists():
        return []
    text = php.read_text(encoding="utf-8", errors="replace")
    out = []
    for m in ROUTE_START.finditer(text):
        line = text.count("\n", 0, m.start()) + 1
        win = text[m.start():m.start() + 400]
        nm = NAME_IN.search(win)
        pm = PATH_IN.search(win)
        out.append((line, nm.group(1) if nm else "", pm.group(1) if pm else ""))
    return sorted(out)


def route_for(routes, line):
    cand = [(n, p) for ln, n, p in routes if ln <= line]
    return cand[-1] if cand else ("", "")


def path_fragments(url: str) -> list[str]:
    p = re.sub(r"%[^%]+%", "", url)
    p = re.sub(r"\{[^}]*\}", "", p).strip("/")
    segs = [s for s in p.split("/") if s and not s.isdigit()]
    frags = []
    for n in (3, 2):
        if len(segs) >= n:
            frags.append("/".join(segs[:n]))
    return frags


def doc_text(fid: str) -> str:
    for md in FUNCTIONS.rglob(f"{fid}_*.md"):
        return md.read_text(encoding="utf-8", errors="replace")
    return ""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--slices", default="ee")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    sdir = L.DOC_ROOT / "message_inventory" / "slices" / args.slices

    routes_cache: dict[Path, list] = {}

    def rts(p: Path):
        if p not in routes_cache:
            routes_cache[p] = routes_of(p)
        return routes_cache[p]

    total = weak = ok = novalidate = 0
    weak_rows = []
    for sp in sorted(sdir.glob("*.resolved.tsv")):
        lines = sp.read_text(encoding="utf-8").splitlines()
        ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
        changed = False
        for i, l in enumerate(lines[1:], 1):
            f = l.split("\t")
            cand = f[ic["機能候補(要検証)"]].strip() if len(f) > ic["機能候補(要検証)"] else ""
            fid = cand if FID_RE.match(cand) else ""
            if not fid:
                continue
            total += 1
            ev = f[ic["根拠(file:line)"]]
            m = re.match(r"(.*?\.php):(\d+)", ev.strip())
            if not m:
                novalidate += 1
                continue
            php = EE.parent / m.group(1)
            name, path = route_for(rts(php), int(m.group(2)))
            if not name and not path:
                novalidate += 1
                continue
            dt = doc_text(fid)
            hit = (name and name in dt) or any(fr in dt for fr in path_fragments(path))
            if hit:
                ok += 1
            else:
                weak += 1
                weak_rows.append((sp.name, f[0], fid, name or path))
                if args.apply:
                    f[ic["機能候補(要検証)"]] = f"未割当（割当 {fid} は設計書にルート/URL({name or path})の裏付けなし・要再検証）"
                    f[ic["画面"]] = re.sub(r"^" + re.escape(fid) + r"\s+.*", "[要機能紐付け]", f[ic["画面"]])
                    lines[i] = "\t".join(f)
                    changed = True
        if changed and args.apply:
            sp.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"割当検査: 総={total}  裏付けOK={ok}  裏付けなし(弱)={weak}  ルート特定不可={novalidate}")
    from collections import Counter
    byfid = Counter(w[2] for w in weak_rows)
    print("弱い割当先 上位:", byfid.most_common(10))
    for w in weak_rows[:15]:
        print("  弱:", w)
    if args.apply:
        print(f"\n{weak}件を未割当へ差し戻し(--apply)")


if __name__ == "__main__":
    main()
