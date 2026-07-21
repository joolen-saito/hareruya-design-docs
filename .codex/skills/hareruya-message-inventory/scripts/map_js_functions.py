#!/usr/bin/env python3
"""JS由来メッセージ（EE-JS-*）の機能候補を決定的に算出する。

推測ではなく実ソースの参照グラフだけを辿る:
  テンプレ → (#[Template] / render() / include・embed 親テンプレ) → コントローラ動作
          → #[Route(name:)] → 機能インベントリ source_routes → 機能ID

出力は「候補」であり正ではない。確定は codex/fable5 が実ソースで検証する（捏造ゼロ）。
候補が0/複数のものは候補なしとして残し、推測で埋めない。

使い方:
  python3 map_js_functions.py                 # 候補一覧をTSVで標準出力
  python3 map_js_functions.py --write         # message_inventory.tsv の 機能候補(要検証) 列へ反映
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
CTRL_DIRS = ["src/Eccube/Controller", "app"]

# #[Template(template: '…')] と #[Template('…')]（位置引数）の両形式
TEMPLATE_ATTR = re.compile(r"#\[Template\(\s*(?:template:\s*)?['\"]([^'\"]+\.twig)['\"]")
# 属性は #[Route(...)] のほか #[\n  Route(...),\n  Template(...)\n] のグループ形式もある
ROUTE_NAME = re.compile(r"#\[\s*Route\((?:[^)]*?)name:\s*['\"]([^'\"]+)['\"]", re.S)
RENDER_CALL = re.compile(r"->render(?:View)?\(\s*['\"]([^'\"]+\.twig)['\"]")
INCLUDE_RE = re.compile(r"(?:include|embed|extends)\s*\(?\s*['\"]([^'\"]+\.twig)['\"]")


def norm_tpl(t: str) -> str:
    """テンプレ参照を実ファイル相対パス（admin/… default/… install/…）へ正規化する。

    EE には複数の書式がある:
      '@admin/Product/x.twig' … admin 名前空間
      'Deck/show.twig'        … フロントは default/ 接頭辞を省略する
    """
    t = t.lstrip("@")
    for pre in ("admin/", "default/", "install/", "Block/"):
        if t.startswith(pre):
            return t
    # 接頭辞なし＝フロント既定テーマ
    return "default/" + t


def tpl_key(path: str) -> str:
    """根拠file → テンプレ相対名（template/ 以降）。"""
    for marker in ("Resource/template/", "html/template/"):
        if marker in path:
            return path.split(marker, 1)[1]
    return Path(path).name


TPL2CTRL: dict[str, set[str]] = defaultdict(set)  # テンプレ名 → それを描画するcontroller相対パス


def build_route_index() -> dict[str, set[str]]:
    """テンプレ名 → ルート名集合（#[Template] と render() の両方）。"""
    idx: dict[str, set[str]] = defaultdict(set)
    for d in CTRL_DIRS:
        base = EE / d
        if not base.exists():
            continue
        for php in base.rglob("*.php"):
            text = php.read_text(encoding="utf-8", errors="replace")
            if "#[Route" not in text:
                continue
            # ルート属性の位置を先に集める
            routes = [(m.start(), m.group(1)) for m in ROUTE_NAME.finditer(text)]
            if not routes:
                continue

            def route_after(pos: int) -> str | None:
                """pos に最も近いルート名。

                #[Template] と #[Route] の記述順は両方あり（Route が後ろのファイルもある）ため
                前後どちらも見る。ただし別メソッドの Route を拾わないよう距離で足切りする。
                """
                best, bestd = None, 4000
                for p, r in routes:
                    d = abs(p - pos)
                    if d < bestd:
                        best, bestd = r, d
                return best

            try:
                crel = str(php.relative_to(EE.parent))
            except ValueError:
                crel = str(php)
            for rx in (TEMPLATE_ATTR, RENDER_CALL):
                for m in rx.finditer(text):
                    tpl = norm_tpl(m.group(1))
                    TPL2CTRL[tpl].add(crel)
                    r = route_after(m.start())
                    if r:
                        idx[tpl].add(r)
    return idx


def build_parent_index() -> dict[str, set[str]]:
    """子テンプレ → それを include/embed/extends している親テンプレ集合。"""
    idx: dict[str, set[str]] = defaultdict(set)
    for d in (EE / "src/Eccube/Resource/template", EE / "app"):
        if not d.exists():
            continue
        for tw in d.rglob("*.twig"):
            parent = tpl_key(str(tw))
            for m in INCLUDE_RE.finditer(tw.read_text(encoding="utf-8", errors="replace")):
                idx[norm_tpl(m.group(1))].add(norm_tpl(parent))
    return idx


def build_route_to_fid() -> dict[str, set[str]]:
    out: dict[str, set[str]] = defaultdict(set)
    with INV.open(encoding="utf-8") as fh:
        for r in csv.DictReader(fh, delimiter="\t"):
            for rt in (r.get("source_routes") or "").split(","):
                rt = rt.strip()
                if rt:
                    out[rt].add(r["id"])
    return out


def js_referrers(js_rel: str) -> set[str]:
    """html/.../x.js を読み込んでいる twig を探す（script src 参照）。"""
    name = Path(js_rel).name
    r = subprocess.run(
        ["grep", "-rl", "--include=*.twig", "--", name,
         str(EE / "src/Eccube/Resource/template"), str(EE / "app")],
        capture_output=True, text=True,
    )
    return {norm_tpl(tpl_key(p)) for p in r.stdout.split() if p}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    tpl2routes = build_route_index()
    child2parents = build_parent_index()
    route2fid = build_route_to_fid()
    file2fid, _r2f, _meta = L.load_function_map()

    rows = TSV.read_text(encoding="utf-8").splitlines()
    hdr = rows[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}

    def resolve(tpl: str, depth: int = 0) -> tuple[set[str], str]:
        """テンプレ→ルート集合。直接無ければ親テンプレを2段まで辿る。"""
        if tpl in tpl2routes:
            return tpl2routes[tpl], "direct"
        if depth >= 2:
            return set(), ""
        acc: set[str] = set()
        for p in child2parents.get(tpl, ()):
            r, _ = resolve(p, depth + 1)
            acc |= r
        return acc, f"via-parent({depth + 1})" if acc else ""

    out_lines = []
    updated = 0
    for i, line in enumerate(rows[1:], 1):
        f = line.split("\t")
        if not f[0].startswith("EE-JS-"):
            continue
        src = f[ic["根拠(file:line)"]].rsplit(":", 1)[0]
        tpl = norm_tpl(tpl_key(src))
        if src.endswith(".js"):
            routes: set[str] = set()
            how = "js-referrer"
            for parent in js_referrers(src):
                r, _ = resolve(parent)
                routes |= r
        else:
            routes, how = resolve(tpl)
        fids: set[str] = set()
        for rt in routes:
            fids |= route2fid.get(rt, set())
        if not fids:
            # インベントリの source_routes が空の機能があるため、描画元controllerでも引く
            for ctrl in TPL2CTRL.get(tpl, ()):
                fids |= file2fid.get(ctrl, set())
            if fids:
                how = (how + "+ctrl").lstrip("+")
        cand = ",".join(sorted(fids))
        out_lines.append((f[0], tpl, how, ",".join(sorted(routes))[:80], cand))
        if args.write and cand:
            f[ic["機能候補(要検証)"]] = cand
            rows[i] = "\t".join(f)
            updated += 1

    print("メッセージID\tテンプレ\t経路\tルート\t機能候補(要検証)")
    for r in out_lines:
        print("\t".join(r))
    n_with = sum(1 for r in out_lines if r[4])
    print(f"\n# EE-JS行={len(out_lines)}  候補あり={n_with}  候補なし={len(out_lines) - n_with}")
    if args.write:
        TSV.write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(f"# wrote 機能候補(要検証) for {updated} rows -> {TSV.name}")


if __name__ == "__main__":
    main()
