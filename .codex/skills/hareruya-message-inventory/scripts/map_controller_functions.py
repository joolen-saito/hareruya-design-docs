#!/usr/bin/env python3
"""フラッシュ/フォーム由来メッセージ(EE-* 非JS)の機能候補を決定的に算出する。

推測ではなく実装の参照だけを辿る:
  A) Controller: メッセージ行を含むメソッドの #[Route(name:)] → 機能インベントリ → 機能ID
  B) FormType  : そのFormTypeを使う Controller を探し、A) と同じ経路で解決
  C) Service/Action: それを呼ぶ Controller を探し、A) と同じ経路で解決

出力は「候補」であり正ではない。確定は codex/fable5 が実ソースで検証する（捏造ゼロ）。
候補が0/複数のものは候補なしとして残し、推測で埋めない。

使い方:
  python3 map_controller_functions.py            # 候補一覧
  python3 map_controller_functions.py --write    # 機能候補(要検証)列へ反映
"""
from __future__ import annotations

import argparse
import csv
import re
import subprocess
from collections import defaultdict
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
INV = L.DOC_ROOT / "endpoint_reports" / "ec_enterprise_source_function_inventory.tsv"

ROUTE_ATTR = re.compile(r"#\[\s*Route\((?:[^)]*?)name:\s*['\"]([^'\"]+)['\"]", re.S)
ROUTE_ATTR_FULL = re.compile(r"#\[\s*Route\((?P<body>[^)]*?)\)", re.S)
PATH_IN_ROUTE = re.compile(r"path:\s*['\"]([^'\"]+)['\"]")
CLASS_USE = re.compile(r"(\w+)::class")


def doc_index() -> list[tuple[str, str]]:
    """(機能ID, 設計書本文) の一覧。URLパス照合に使う。"""
    out = []
    for md in sorted((L.DOC_ROOT / "functions").rglob("*.md")):
        m = re.match(r"([a-z]\d{2}-\d{2})_", md.name)
        if m:
            out.append((m.group(1), md.read_text(encoding="utf-8", errors="replace")))
    return out


def fids_by_path(url_path: str, docs: list[tuple[str, str]]) -> set[str]:
    """ルートのURLパス断片が本文に出てくる設計書を候補にする。

    '/%eccube_admin_route%/data/holiday/{id}/delete' → 'data/holiday' で照合。
    可変部・admin接頭辞は環境依存なので落とす。
    """
    p = re.sub(r"%[^%]+%", "", url_path)
    p = re.sub(r"\{[^}]*\}", "", p).strip("/")
    segs = [s for s in p.split("/") if s and not s.isdigit()]
    if len(segs) < 2:
        return set()
    frag = "/".join(segs[:2])
    return {fid for fid, text in docs if frag in text}


def build_route_to_fid() -> dict[str, set[str]]:
    out: dict[str, set[str]] = defaultdict(set)
    with INV.open(encoding="utf-8") as fh:
        for r in csv.DictReader(fh, delimiter="\t"):
            for rt in (r.get("source_routes") or "").split(","):
                rt = rt.strip()
                if rt:
                    out[rt].add(r["id"])
    return out


def routes_by_line(php: Path) -> list[tuple[int, str, str]]:
    """(行番号, ルート名, URLパス) を昇順で返す。属性はメソッド直上に置かれる。"""
    text = php.read_text(encoding="utf-8", errors="replace")
    out = []
    for m in ROUTE_ATTR.finditer(text):
        line = text.count("\n", 0, m.start()) + 1
        tail = text[m.start():m.start() + 400]
        pm = PATH_IN_ROUTE.search(tail)
        out.append((line, m.group(1), pm.group(1) if pm else ""))
    return sorted(out)


def route_for_line(routes, line: int):
    """当該行を含むメソッドのルート＝直上で最も近いルート属性。(名前, パス)"""
    cand = [(r, p) for ln, r, p in routes if ln <= line]
    return cand[-1] if cand else (None, None)


def referencing_controllers(target: Path) -> list[Path]:
    """FormType/Service を参照している Controller を探す。"""
    stem = target.stem
    r = subprocess.run(
        ["grep", "-rl", "--include=*.php", "-e", f"{stem}::class", "-e", f"\\b{stem}\\b",
         str(EE / "src/Eccube/Controller"), str(EE / "app")],
        capture_output=True, text=True,
    )
    return [Path(p) for p in r.stdout.split() if p and Path(p) != target]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    route2fid = build_route_to_fid()
    docs = doc_index()
    routes_cache: dict[Path, list[tuple[int, str]]] = {}

    def routes_of(p: Path) -> list[tuple[int, str]]:
        if p not in routes_cache:
            routes_cache[p] = routes_by_line(p) if p.exists() else []
        return routes_cache[p]

    lines = TSV.read_text(encoding="utf-8").splitlines()
    hdr = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}

    stats = defaultdict(int)
    out_rows = []
    updated = 0
    for i, line in enumerate(lines[1:], 1):
        f = line.split("\t")
        mid = f[0]
        if not mid.startswith("EE-") or mid.startswith("EE-JS"):
            continue
        ev = f[ic["根拠(file:line)"]]
        m = re.match(r"(.*?\.php):(\d+)", ev.strip())
        if not m:
            stats["根拠不明"] += 1
            continue
        rel, ln = m.group(1), int(m.group(2))
        php = EE.parent / rel
        fids: set[str] = set()
        how = ""
        rt, rpath = route_for_line(routes_of(php), ln)
        if rt:
            fids = set(route2fid.get(rt, set()))
            how = "route"
        if not fids and rpath:
            fids = fids_by_path(rpath, docs)
            if fids:
                how = "url-path"
        if not fids:
            # FormType/Service → 参照元 Controller のルート（全メソッド）
            for ctrl in referencing_controllers(php)[:6]:
                for _l, r, _p in routes_of(ctrl):
                    fids |= route2fid.get(r, set())
            if fids:
                how = "via-controller"
        # 導出経路の強度を明示する。route/url-path は実装参照で強い。
        # via-controller は参照元controllerの全ルートの和＝弱い手がかりに過ぎない。
        if how == "via-controller" and len(fids) > 6:
            fids, how = set(), ""   # 候補が広すぎるものはノイズなので出さない
        cand = ",".join(sorted(fids))
        if cand and how == "via-controller":
            cand += "（弱い候補:参照元controller由来・要検証）"
        stats["候補あり" if cand else "候補なし"] += 1
        stats[f"経路:{how or 'なし'}"] += 1
        out_rows.append((mid, rel.split("/")[-1], str(ln), rt or "", how, cand[:70]))
        if args.write and cand:
            f[ic["機能候補(要検証)"]] = cand
            lines[i] = "\t".join(f)
            updated += 1

    print("メッセージID\tファイル\t行\tルート\t経路\t機能候補(要検証)")
    for r in out_rows[:40]:
        print("\t".join(r))
    print(f"\n# 対象={len(out_rows)}")
    for k, v in sorted(stats.items()):
        print(f"#   {k}: {v}")
    if args.write:
        TSV.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"# wrote {updated} rows -> {TSV.name}")


if __name__ == "__main__":
    main()
