#!/usr/bin/env python3
"""現行仕様セクションの記述に、正典の出典が付いているかを機械検査する。

利用者決定（2026-08-21）: **P1・P2 の検証可能な事実には出典を付ける。P3 は機械が実在だけを見る。**

設計方針 — 出典ゲートと「粒度を細かくしない」を両立させるため、次を守る:
  1. 出典は **### 小見出し単位**に1つ以上。文単位で要求しない。
     文単位にすると、まとめて書けた挙動をわざわざ分割する動機が生まれる。粗く書くほど有利にする。
  2. **被覆率で評価しない。** 率にすると文を刻んで率を上げられる。P1/P2 の小見出しに
     出典があるか無いかの二値で見る。
  3. 機械は**出典先の実在**だけを見る。内容が一致しているかは見ない（それは人の点検の仕事）。
  4. P1/P2/P3 の判定は書き手が申告する。機械は申告そのものを検査しない
     （重要度は影響と迂回可否で決まり、機械には決められない）。

書き方 — Markdown の末尾に `## 出典` 節を置く。h2 が3種以外なので HTML には出力されない
（[[output-exclusion-policy]]）。本文に実装用語を書けない制約とも両立する。

    ## 出典
    | 小見出し | 重要度 | 出典 |
    | --- | --- | --- |
    | 承認と却下 | P1 | pf-eccube3:src/Eccube/Controller/.../StockApprovalController.php:139 |
    | 出力する列 | P3 | 0202:sheet-46 |

出典の書式:
    <リポジトリ>:<パス>[:<行>]     現行ソース・ee。リポジトリは pf-eccube3 / pf-api / ec-cube /
                                   deck-api / ec-cube-enterprise
    <書番>:<シートID>              Excel由来の正本HTML（例 0202:sheet-46）

検査:
  1. P1・P2 と申告した小見出しに出典が1つ以上あること。
  2. 出典が実在すること（ファイル・行・シートを実際に引く）。重要度によらず全件見る。
  3. `## 出典` に書かれた小見出しが本文に実在すること（申告先の取り違えを防ぐ）。

逆向きの失敗（出典の手間を避けて P1/P2 を書かない＝過小報告）は本ゲートでは捕まえられない。
`--report` で重要度の分布を出すので、P3 ばかりの文書を人が見つける手掛かりにする。

  python3 check_source_citation.py --docs functions/pf-eccube3/m05-01_*.md
  python3 check_source_citation.py --all --report
終了コードは違反があれば 1。
"""

from __future__ import annotations

import argparse
import collections
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
WORKSPACE = ROOT.parent
DESIGN_HTML = ROOT / "excel_to_html" / "output"

CITATION_SECTION = "出典"
SEVERITIES = ("P1", "P2", "P3")
NEED_CITATION = ("P1", "P2")

REPOS = {
    "pf-eccube3": WORKSPACE / "pf-eccube3",
    "pf-api": WORKSPACE / "pf-api",
    "ec-cube": WORKSPACE / "ec-cube",
    "deck-api": WORKSPACE / "deck-api",
    "ec-cube-enterprise": WORKSPACE / "ec-cube-enterprise",
}
SRC_RE = re.compile(r"^(?P<repo>[a-z0-9\-]+):(?P<path>[^\s:]+?)(?::(?P<line>\d+)(?:-(?P<end>\d+))?)?$")

# 現行システムはプラグインでコア実装を差し替えている。差し替えられた画面では
# コア側のクラスは実行されないため、コアを出典にすると「実際には動かないコード」を
# 根拠にしてしまう（2026-08-21 実測: 受注検索の出典が core の OrderController を指しており、
# 実体は app/Plugin/HareruyaEc/Controller/Admin/Order/OrderController.php だった。
# しかもコア側は検証NGで検索を止めるため、本文の記述と矛盾する出典になっていた）。
# **現行仕様の出典はプラグイン側の実体を見る。**
PLUGIN_DIRS = ("app/Plugin",)
CORE_DIRS = ("src/Eccube/", "data/class/")
SHEET_RE = re.compile(r"^(?P<book>\d{4}):(?P<sheet>sheet-\d+)$")


def sections(text: str) -> list[str]:
    """本文の ### 小見出し一覧（出典節の中は数えない）。"""
    out, in_citation = [], False
    for line in text.splitlines():
        m = re.match(r"^(#{2,3})\s+(.*)$", line)
        if not m:
            continue
        level, title = len(m.group(1)), m.group(2).strip()
        if level == 2:
            in_citation = title.startswith(CITATION_SECTION)
            continue
        if not in_citation:
            out.append(title)
    return out


def citation_rows(text: str) -> list[tuple[str, str, str]]:
    """`## 出典` 節の表から (小見出し, 重要度, 出典) を返す。"""
    rows, inside = [], False
    for line in text.splitlines():
        m = re.match(r"^(#{2,3})\s+(.*)$", line)
        if m:
            inside = len(m.group(1)) == 2 and m.group(2).strip().startswith(CITATION_SECTION)
            continue
        if not inside or not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3 or cells[0] in ("小見出し", "---") or set(cells[0]) <= {"-", ":"}:
            continue
        rows.append((cells[0], cells[1], cells[2]))
    return rows


def resolve(ref: str) -> str | None:
    """出典が実在しなければ理由を返す。実在すれば None。"""
    ref = ref.strip().strip("`")
    if not ref:
        return "空"
    m = SHEET_RE.match(ref)
    if m:
        hits = sorted(DESIGN_HTML.glob(f"{m.group('book')}_*.html"))
        if not hits:
            return f"設計書 {m.group('book')} が無い"
        text = hits[0].read_text(encoding="utf-8", errors="ignore")
        if f'id="{m.group("sheet")}"' not in text:
            return f"{hits[0].name} に {m.group('sheet')} が無い"
        return None
    m = SRC_RE.match(ref)
    if not m:
        return "書式不正（<リポジトリ>:<パス>[:<行>] か <書番>:<シートID>）"
    repo = REPOS.get(m.group("repo"))
    if repo is None:
        return f"未知のリポジトリ {m.group('repo')}（{'/'.join(REPOS)}）"
    path = repo / m.group("path")
    if not path.is_file():
        return f"ファイルが無い {m.group('repo')}:{m.group('path')}"
    if m.group("line"):
        total = sum(1 for _ in path.open(encoding="utf-8", errors="ignore"))
        last = int(m.group("end") or m.group("line"))
        if last > total:
            return f"行数超過 {last} > 実{total}行"
    override = plugin_override(repo, m.group("path"),
                               int(m.group("line")) if m.group("line") else None)
    if override:
        return (f"コア実装を指している。この機能はプラグインで差し替えられており、"
                f"実行されるのは {override}。プラグイン側の実体を出典にすること")
    return None


_FUNC_RE = re.compile(r"^\s*(?:public|protected|private|static|final|abstract|\s)*function\s+(\w+)",
                      re.M)


def _enclosing_function(path: Path, line_no: int) -> str | None:
    """指定行を含むメソッド名。行指定が無い・特定できないときは None。"""
    name = None
    for i, text in enumerate(path.open(encoding="utf-8", errors="ignore"), start=1):
        if i > line_no:
            break
        m = _FUNC_RE.match(text)
        if m:
            name = m.group(1)
    return name


def plugin_override(repo: Path, rel: str, line_no: int | None) -> str | None:
    """コアを指す出典が、実際にはプラグインで差し替えられているなら差し替え先を返す。

    プラグインのクラスはコアを継承していることが多い。**同名クラスがあるだけでは足りず、
    その行のメソッドがプラグイン側で上書きされているか**まで見る。
    上書きされていなければコア側が実行されるので、コアを出典にしてよい
    （2026-08-21: クラス名だけで判定して誤検出しかけた）。
    """
    if not any(rel.startswith(d) for d in CORE_DIRS):
        return None
    name = Path(rel).name
    for plugin_root in PLUGIN_DIRS:
        base = repo / plugin_root
        if not base.is_dir():
            continue
        for hit in base.glob(f"*/**/{name}"):
            if line_no is None:
                return hit.relative_to(repo).as_posix() + "（行指定が無いため要確認）"
            method = _enclosing_function(repo / rel, line_no)
            if method is None:
                return None
            body = hit.read_text(encoding="utf-8", errors="ignore")
            m = re.search(rf"function\s+{re.escape(method)}\s*\(", body)
            if m:
                ln = body[: m.start()].count("\n") + 1
                return f"{hit.relative_to(repo).as_posix()}:{ln}（{method} を上書き）"
            return None
    return None


def check(path: Path) -> tuple[list[str], collections.Counter]:
    text = path.read_text(encoding="utf-8")
    problems: list[str] = []
    body_sections = sections(text)
    rows = citation_rows(text)
    by_section: dict[str, list[tuple[str, str]]] = collections.defaultdict(list)
    sev = collections.Counter()

    for title, severity, ref in rows:
        sev[severity] += 1
        if severity not in SEVERITIES:
            problems.append(f"重要度が不正 {severity!r}（{'/'.join(SEVERITIES)}）: {title}")
        if title not in body_sections:
            problems.append(f"出典の小見出しが本文に無い: {title!r}")
        reason = resolve(ref)
        if reason:
            problems.append(f"出典が実在しない（{title}）: {ref} — {reason}")
        by_section[title].append((severity, ref))

    for title, entries in by_section.items():
        severities = {s for s, _ in entries}
        if severities & set(NEED_CITATION) and not any(r for _, r in entries):
            problems.append(f"P1/P2 なのに出典が空: {title}")
    return problems, sev


def collect(args) -> list[Path]:
    if args.docs:
        return [Path(d) if Path(d).is_absolute() else ROOT / d for d in args.docs]
    return sorted(p for p in (ROOT / "functions").glob("*/*.md")
                  if re.match(r"^[mbfa]\d{2}-\d{2}_", p.name))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--docs", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--report", action="store_true", help="重要度の分布を出す")
    args = ap.parse_args()

    paths = collect(args)
    ng = 0
    total = collections.Counter()
    no_citation: list[Path] = []
    for p in paths:
        problems, sev = check(p)
        total.update(sev)
        if not sev:
            no_citation.append(p)
        if problems:
            ng += 1
            try:
                shown = p.relative_to(ROOT)
            except ValueError:
                shown = p  # リポジトリ外のファイル（試験用）
            print(f"NG {shown}")
            for x in problems:
                print(f"   - {x}")
    print(f"\n合計 {len(paths)}本 / 合格 {len(paths) - ng} / 違反 {ng}")
    if args.report:
        print(f"出典の重要度分布: {dict(total)}")
        print(f"出典節を持たない文書: {len(no_citation)}本")
        print("  ※ P3ばかり・出典節なしの文書は、出典の手間を避けて P1/P2 を書かなかった"
              "可能性がある。率では捕まえられないので人が見ること")
    sys.exit(1 if ng else 0)


if __name__ == "__main__":
    main()
