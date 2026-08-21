#!/usr/bin/env python3
"""現行システムと ec-cube-enterprise の URL 対応表（管理画面・API）を作る。

フロント（本店）は人が作った対応表がある（`url_map_front_honten.csv`）。管理画面とAPIは
無いので、各リポのルート定義から機械抽出して突合する。

  現行: pf-eccube3（Silex の `$app->match(...)->bind('name')`）
        pf-api / deck-api（Symfony の `config/routes.yaml`）
  移行後: ec-cube-enterprise（`ec_enterprise_route_inventory.tsv`＝既存の抽出結果）

判定は次の4つだけで、機械が決めてよいのは「URL が一致するか」までとする。
「廃止候補」は移行後に対応が見つからなかったという事実であり、廃止の裁定ではない
（裁定は [[superseded-spec]] の台帳で行う）。

  存続       現行と移行後で正規化後のURLが同一
  URL変更    ルート名は同じだがURLが違う
  廃止候補   現行にあるが移行後に見つからない
  新規       移行後にあるが現行に無い

  python3 endpoint_reports/build_url_migration_map.py
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "endpoint_reports"
EE_INVENTORY = REPORTS / "ec_enterprise_route_inventory.tsv"
PF_ECCUBE = Path("/home/y-saito/Developments/pf-eccube3")
PF_API = Path("/home/y-saito/Developments/pf-api")
DECK_API = Path("/home/y-saito/Developments/deck-api")

HEADER = [
    "画面名",
    "現行リポ",
    "現行ルート名",
    "現行URLパターン",
    "移行後ルート名",
    "移行後URLパターン",
    "判定",
    "現行の根拠",
    "移行後の根拠",
]
VERDICT_SAME = "存続"
VERDICT_CHANGED = "URL変更"
VERDICT_GONE = "廃止候補"
VERDICT_NEW = "新規"

# Silex: $app->match('/' . $app['config']['admin_route'] . '/order/{id}', ...)
SILEX_CALL_RE = re.compile(
    r"\$app->(?:match|get|post|put|delete|patch)\(\s*"
    r"(?P<path>(?:'[^']*'|\s|\.|\$app\[[^\]]*\](?:\[[^\]]*\])*)+?)\s*,\s*'",
    re.S,
)
# EC-CUBE 3 のコア側は ControllerCollection へ相対パスで登録する
# （`$c->match('/product', ...)->bind('admin_product')`）。マウント先の接頭辞は
# ファイル（AdminControllerProvider / FrontControllerProvider）で決まる。
COLLECTION_CALL_RE = re.compile(
    r"\$(?:c|controllers)->(?:match|get|post|put|delete|patch)\(\s*'(?P<path>[^']*)'"
)
PROVIDER_PREFIX = {
    "AdminControllerProvider.php": "/{admin}",
    "FrontControllerProvider.php": "",
    "InstallControllerProvider.php": "/install",
}
BIND_RE = re.compile(r"->bind\('([^']+)'\)")
# Symfony routes.yaml: `name:` の下に `path: /foo/{id}`
YAML_ROUTE_RE = re.compile(r"^(?P<name>[A-Za-z0-9_.]+):\s*$")
YAML_PATH_RE = re.compile(r"^\s+path:\s*(?P<path>\S+)\s*$")


def normalize_path(path: str) -> str:
    """比較用にURLを正規化する（管理画面プレフィックス・パラメータ・ロケールを吸収）。"""
    path = path.strip().strip("'\"")
    if not path or path in {"-", "−", "—"}:
        return ""
    path = re.sub(r"%eccube_admin_route%|\{admin_route\}|admin_route", "{admin}", path)
    path = re.sub(r"\{[^}]*locale[^}]*\}/?", "", path)
    path = re.sub(r"^/(?:ja|en)/", "/", path)
    path = re.sub(r"\{[^}]+\}", "{}", path)
    path = re.sub(r"/+", "/", path)
    path = path.rstrip("/")
    return path or "/"


def silex_path_expression(expr: str) -> str:
    """`'/' . $app['config']['admin_route'] . '/order'` を `/{admin}/order` にする。"""
    has_admin = "admin_route" in expr
    # `$app['config']['admin_route']` の中の引用符を literal と誤読しないよう先に潰す。
    cleaned = re.sub(r"\$app\[[^\]]*\](?:\[[^\]]*\])*", "", expr)
    joined = "".join(re.findall(r"'([^']*)'", cleaned))
    if has_admin:
        # 連結の途中に管理画面プレフィックスが入る。最初のスラッシュの後ろへ差し込む。
        joined = re.sub(r"^/", "/{admin}/", joined, count=1)
    return re.sub(r"/+", "/", joined)


def collect_pf_eccube() -> list[dict]:
    """pf-eccube3（Silex）のルートを集める。"""
    routes: list[dict] = []
    for base in (PF_ECCUBE / "app", PF_ECCUBE / "src"):
        if not base.exists():
            continue
        for php in sorted(base.rglob("*.php")):
            try:
                text = php.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            if "->bind(" not in text:
                continue
            lines = text.splitlines()
            prefix = PROVIDER_PREFIX.get(php.name)
            if prefix is not None:
                for match in COLLECTION_CALL_RE.finditer(text):
                    lineno = text[: match.start()].count("\n") + 1
                    window = "\n".join(lines[lineno - 1 : lineno + 8])
                    bind = BIND_RE.search(window)
                    if not bind:
                        continue
                    path = re.sub(r"/+", "/", prefix + "/" + match.group("path").lstrip("/"))
                    routes.append(
                        {
                            "repo": "pf-eccube3",
                            "name": bind.group(1),
                            "path": path,
                            "evidence": f"{php.relative_to(PF_ECCUBE.parent)}:{lineno}",
                        }
                    )
            for match in SILEX_CALL_RE.finditer(text):
                lineno = text[: match.start()].count("\n") + 1
                # 直後の数行から bind 名を拾う（assert などが挟まる）
                window = "\n".join(lines[lineno - 1 : lineno + 8])
                bind = BIND_RE.search(window)
                if not bind:
                    continue
                path = silex_path_expression(match.group("path"))
                if not path.startswith("/"):
                    continue
                routes.append(
                    {
                        "repo": "pf-eccube3",
                        "name": bind.group(1),
                        "path": path,
                        "evidence": f"{php.relative_to(PF_ECCUBE.parent)}:{lineno}",
                    }
                )
    return routes


def collect_symfony_yaml(repo: Path, label: str) -> list[dict]:
    """pf-api / deck-api（Symfony の routes.yaml）のルートを集める。"""
    routes: list[dict] = []
    for yaml_path in sorted((repo / "config").rglob("routes*.y*ml")):
        name = ""
        for lineno, line in enumerate(yaml_path.read_text(encoding="utf-8").splitlines(), 1):
            name_match = YAML_ROUTE_RE.match(line)
            if name_match:
                name = name_match.group("name")
                continue
            path_match = YAML_PATH_RE.match(line)
            if path_match and name:
                routes.append(
                    {
                        "repo": label,
                        "name": name,
                        "path": path_match.group("path"),
                        "evidence": f"{yaml_path.relative_to(repo.parent)}:{lineno}",
                    }
                )
                name = ""
    return routes


EE_ROOT = Path("/home/y-saito/Developments/ec-cube-enterprise")
# `#[Route(...)]` は path/name の順序も改行位置も一定でないので、属性全体を取ってから
# path と name を個別に拾う。
EE_ROUTE_ATTR_RE = re.compile(r"#\[Route\((?P<body>.*?)\)\]", re.S)
EE_PATH_RE = re.compile(r"path:\s*'([^']+)'")
# `#[Route('/%eccube_admin_route%/archetype', name: '...')]` のように、パスを第1引数へ
# 位置指定する書き方も多い（実測: この形を落とすとee側が100件以上欠ける）。
EE_POSITIONAL_PATH_RE = re.compile(r"^\s*'([^']+)'")
EE_NAME_RE = re.compile(r"name:\s*'([^']+)'")


def collect_ee_source() -> list[dict]:
    """ec-cube-enterprise のルートを実装（`#[Route(...)]`）から直接集める。

    `ec_enterprise_route_inventory.tsv` の path 列はコントローラ単位で全ルートを連結して
    いるため、1ルート＝1パスの突合には使えない。属性から取り直す。
    """
    routes: list[dict] = []
    base = EE_ROOT / "src"
    if not base.exists():
        return routes
    for php in sorted(base.rglob("*.php")):
        try:
            text = php.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if "#[Route(" not in text:
            continue
        for match in EE_ROUTE_ATTR_RE.finditer(text):
            body = match.group("body")
            path_match = EE_PATH_RE.search(body) or EE_POSITIONAL_PATH_RE.match(body)
            name_match = EE_NAME_RE.search(body)
            if not path_match:
                continue
            lineno = text[: match.start()].count("\n") + 1
            routes.append(
                {
                    "repo": "ec-cube-enterprise",
                    "name": name_match.group(1) if name_match else "",
                    "path": path_match.group(1),
                    "evidence": f"{php.relative_to(EE_ROOT.parent)}:{lineno}",
                }
            )
    return routes


def collect_ee() -> list[dict]:
    """ec-cube-enterprise のルート（既存の抽出結果を読む＝ソースが無いときの控え）。"""
    routes: list[dict] = []
    lines = EE_INVENTORY.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    idx_route, idx_path, idx_src = (header.index(k) for k in ("route", "path", "source_file"))
    for line in lines[1:]:
        cells = line.split("\t")
        if len(cells) <= max(idx_route, idx_path, idx_src):
            continue
        for path in cells[idx_path].split(","):
            if not path.strip():
                continue
            routes.append(
                {
                    "repo": "ec-cube-enterprise",
                    "name": cells[idx_route],
                    "path": path.strip(),
                    "evidence": cells[idx_src],
                }
            )
    return routes


def classify(path: str, name: str) -> str:
    """URLの区分。APIを先に見る（管理画面向けのAPIはAPIとして扱う）。"""
    if ".json" in path or re.search(r"api_v\d+_route|%eccube_api|/api/|^/api\b", path) or name.startswith("api_"):
        return "API"
    if re.search(r"%eccube_admin_route%|\{admin\}|admin_route", path):
        return "管理画面"
    return "フロント"


def compare_key(path: str) -> str:
    """表記ゆれ（ハイフンとアンダースコア）とパラメータを吸収した比較キー。"""
    key = normalize_path(path).lower()
    return re.sub(r"[-_]", "", key)


def token_key(path: str) -> str:
    """語順の違いを吸収する比較キー（`analysis/format_sales` ↔ `format_sales/analysis`）。"""
    segments = [s for s in compare_key(path).split("/") if s and s != "{}"]
    return "|".join(sorted(segments))


def build(current: list[dict], ee: list[dict], scope: str) -> list[list[str]]:
    ee_by_path: dict[str, dict] = {}
    ee_by_key: dict[str, dict] = {}
    ee_by_tokens: dict[str, dict] = {}
    ee_by_name: dict[str, dict] = {}
    for route in ee:
        ee_by_path.setdefault(normalize_path(route["path"]), route)
        ee_by_key.setdefault(compare_key(route["path"]), route)
        ee_by_tokens.setdefault(token_key(route["path"]), route)
        ee_by_name.setdefault(route["name"], route)

    rows: list[list[str]] = []
    matched_ee: set[str] = set()
    for route in current:
        kind = classify(route["path"], route["name"])
        if kind != scope:
            continue
        norm = normalize_path(route["path"])
        target = ee_by_path.get(norm)
        verdict = VERDICT_SAME
        if target is None:
            # ハイフン／アンダースコア差、語順違い、ルート名一致の順に緩めて探す。
            target = (
                ee_by_key.get(compare_key(route["path"]))
                or ee_by_tokens.get(token_key(route["path"]))
                or ee_by_name.get(route["name"])
            )
            verdict = VERDICT_CHANGED if target else VERDICT_GONE
        if target is not None:
            matched_ee.add(target["name"] + "|" + normalize_path(target["path"]))
        rows.append(
            [
                kind,
                route["repo"],
                route["name"],
                norm,
                target["name"] if target else "-",
                normalize_path(target["path"]) if target else "-",
                verdict,
                route["evidence"],
                target["evidence"] if target else "-",
            ]
        )

    seen_new: set[str] = set()
    for route in ee:
        kind = classify(route["path"], route["name"])
        if kind != scope:
            continue
        key = route["name"] + "|" + normalize_path(route["path"])
        if key in matched_ee or key in seen_new:
            continue
        seen_new.add(key)
        rows.append(
            [kind, "-", "-", "-", route["name"], normalize_path(route["path"]),
             VERDICT_NEW, "-", route["evidence"]]
        )
    return rows


def concrete_to_pattern(path: str) -> str:
    """実URL（`/admin/order/123/edit`）を突合用のパターン（`/{}/order/{}/edit`）へ。"""
    path = path.split("?")[0].split("#")[0]
    segments = [s for s in path.split("/") if s]
    if not segments:
        return "/"
    out = ["{}"]  # 先頭は管理画面プレフィックス
    for segment in segments[1:]:
        out.append("{}" if re.fullmatch(r"\d+|[0-9a-f]{8}-[0-9a-f-]+", segment) else segment)
    return "/" + "/".join(out)


def load_reachable(path: Path) -> set[str]:
    """巡回結果（crawl-admin-screens.mjs の出力）から到達できた画面のパターン集合を作る。"""
    patterns: set[str] = set()
    for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if lineno == 1 or not line.strip():
            continue
        cells = line.split("\t")
        if len(cells) < 2 or cells[1] != "200":
            continue
        patterns.add(concrete_to_pattern(cells[0]))
    return patterns


def build_admin_from_crawl(
    crawl_path: Path, current: list[dict], ee: list[dict]
) -> list[list[str]]:
    """実機で辿れた管理画面を1行1画面で並べ、現行URLを突き合わせる。

    ルート定義を起点にすると、実機にあるのに一覧へ出ない画面が残る（実測76件）。
    ユーザー指定は「/admin/ から辿れる画面のみ」なので、巡回結果を起点にする。
    """
    ee_by_pattern: dict[str, dict] = {}
    for route in ee:
        ee_by_pattern.setdefault(normalize_path(route["path"]), route)

    cur_by_path: dict[str, dict] = {}
    cur_by_key: dict[str, dict] = {}
    cur_by_tokens: dict[str, dict] = {}
    cur_by_name: dict[str, dict] = {}
    for route in current:
        cur_by_path.setdefault(normalize_path(route["path"]), route)
        cur_by_key.setdefault(compare_key(route["path"]), route)
        cur_by_tokens.setdefault(token_key(route["path"]), route)
        cur_by_name.setdefault(route["name"], route)

    rows: list[list[str]] = []
    for lineno, line in enumerate(crawl_path.read_text(encoding="utf-8").splitlines(), 1):
        if lineno == 1 or not line.strip():
            continue
        cells = line.split("\t")
        if len(cells) < 3 or cells[1] != "200":
            continue
        concrete, _status, title = cells[0], cells[1], cells[2]
        heading = cells[3] if len(cells) > 3 else ""
        pattern = concrete_to_pattern(concrete)
        ee_route = ee_by_pattern.get(pattern)
        current_route = (
            cur_by_path.get(pattern)
            or cur_by_key.get(compare_key(pattern))
            or cur_by_tokens.get(token_key(pattern))
            or (cur_by_name.get(ee_route["name"]) if ee_route else None)
        )
        if current_route is None:
            verdict = VERDICT_NEW
        elif normalize_path(current_route["path"]) == pattern:
            verdict = VERDICT_SAME
        else:
            verdict = VERDICT_CHANGED
        rows.append(
            [
                heading or title,
                current_route["repo"] if current_route else "-",
                current_route["name"] if current_route else "-",
                normalize_path(current_route["path"]) if current_route else "-",
                ee_route["name"] if ee_route else "-",
                pattern,
                verdict,
                current_route["evidence"] if current_route else "-",
                ee_route["evidence"] if ee_route else f"実機到達 {concrete}",
            ]
        )
    return rows


def write(path: Path, rows: list[list[str]]) -> None:
    body = "\n".join("\t".join(row) for row in sorted(rows, key=lambda r: (r[6], r[3], r[5])))
    path.write_text("\t".join(HEADER) + "\n" + body + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out-dir", type=Path, default=REPORTS)
    parser.add_argument(
        "--reachable",
        type=Path,
        default=REPORTS / "admin_reachable_screens.tsv",
        help="管理画面の巡回結果。/admin/ から辿れた画面だけに絞る",
    )
    parser.add_argument(
        "--emit-gone",
        action="store_true",
        help="廃止候補も出力する（既定は出力しない＝2026-08-14 ユーザー決定）",
    )
    args = parser.parse_args()

    ee = collect_ee_source()
    if ee:
        print(f"移行後ルートの取得元: {EE_ROOT}/src の #[Route] 属性")
    elif EE_INVENTORY.exists():
        ee = collect_ee()
        print(f"移行後ルートの取得元: {EE_INVENTORY.name}（コントローラ単位の連結。精度は落ちる）")
    else:
        print(f"移行後のルートが取れない: {EE_ROOT} も {EE_INVENTORY} も無い", file=sys.stderr)
        return 1
    current = collect_pf_eccube() + collect_symfony_yaml(PF_API, "pf-api") + collect_symfony_yaml(
        DECK_API, "deck-api"
    )
    print(f"現行ルート: {len(current)}件（pf-eccube3 / pf-api / deck-api）")
    print(f"移行後ルート: {len(ee)}件（ec-cube-enterprise）")

    reachable: set[str] = set()
    if args.reachable and args.reachable.exists():
        reachable = load_reachable(args.reachable)
        print(f"管理画面の到達済み画面: {len(reachable)}パターン（{args.reachable.name}）")

    if args.reachable and args.reachable.exists():
        admin_rows = build_admin_from_crawl(args.reachable, current, ee)
        out = args.out_dir / "url_map_admin.tsv"
        write(out, admin_rows)
        counts = {v: sum(1 for r in admin_rows if r[6] == v) for v in
                  (VERDICT_SAME, VERDICT_CHANGED, VERDICT_NEW)}
        print(f"管理画面: {out.name} {len(admin_rows)}行（1行1画面・実機到達分のみ） "
              + " / ".join(f"{k} {v}" for k, v in counts.items()))

    for scope, filename in (("API", "url_map_api.tsv"),):
        rows = build(current, ee, scope)
        dropped_gone = 0
        dropped_unreachable = 0
        kept: list[list[str]] = []
        for row in rows:
            if row[6] == VERDICT_GONE and not args.emit_gone:
                dropped_gone += 1
                continue
            kept.append(row)
        out = args.out_dir / filename
        write(out, kept)
        counts = {v: sum(1 for r in kept if r[6] == v) for v in
                  (VERDICT_SAME, VERDICT_CHANGED, VERDICT_NEW)}
        note = f"（廃止候補 {dropped_gone}件は非出力"
        note += f" / 到達しない {dropped_unreachable}件を除外）" if dropped_unreachable else "）"
        print(f"{scope}: {out.name} {len(kept)}行 " + " / ".join(f"{k} {v}" for k, v in counts.items()) + note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
