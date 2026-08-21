#!/usr/bin/env python3
"""Stage 0: 現行踏襲・カスタマイズ機能の「参照元リポジトリ」帰属台帳を作る。

現行踏襲/カスタマイズ機能の仕様具体化は **現行ソース** を参照元とする。
  本店 → pf-eccube3 / 支店 → ec-cube / API → pf-api・pf-article /
  デッキビルダー → deck-api・deck-builder
ec-cube-enterprise は構築中の新実装なので参照元にしない（そこから引くと循環する）。
ただし「既存の設計書がeeを見て書かれてしまっている」検出のためにスキャン対象には含め、
`ee_score` として記録するだけで帰属先には決して選ばない。

帰属は推測せず**実在の一致**で決める。各設計書から機械抽出したアンカー
（翻訳キー / クラス名 / twigパス / snake_case識別子 / 画面文言）を各リポジトリで
literal 検索し、当たった本数を重み付けして score にする。
  - 1リポジトリが他を圧倒（2倍以上）し、かつ命名規則からの事前候補と一致 → 確定
  - 証拠はあるが割れる / 事前候補と食い違う                             → 要判定
  - どのリポジトリにも1本も当たらない                                   → 根拠なし(TBD)
判定できないものは TBD に倒す。誤った帰属で317機能分の調査が空振りする方が高くつく。

サブコマンド:
  build   台帳 (attribution.tsv / anchors.tsv / ATTRIBUTION_SUMMARY.md) を生成
  verify  台帳を再計算して現物と一致するか・不変条件を満たすかを検査（差異があれば exit 1）
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TODO_LIST = ROOT / "functions" / "todo-list.md"
OUT_DIR = ROOT / "genzai_source_attribution"
LEDGER = OUT_DIR / "attribution.tsv"
ANCHOR_LEDGER = OUT_DIR / "anchors.tsv"
SUMMARY = OUT_DIR / "ATTRIBUTION_SUMMARY.md"

DEV_ROOT = Path("/home/y-saito/Developments")

# name -> (絶対パス, 役割). ee は帰属先にしない（参照禁止）が、汚染検出のため走査する。
REPOS: dict[str, tuple[Path, str]] = {
    "pf-eccube3": (DEV_ROOT / "pf-eccube3", "本店"),
    "ec-cube": (DEV_ROOT / "ec-cube", "支店"),
    "pf-api": (DEV_ROOT / "pf-api", "API"),
    "pf-article": (DEV_ROOT / "pf-article", "記事(WordPress)"),
    "deck-api": (DEV_ROOT / "deck-api", "デッキAPI"),
    "deck-builder": (DEV_ROOT / "deck-builder", "デッキビルダー画面"),
    "ec-cube-enterprise": (DEV_ROOT / "ec-cube-enterprise", "新実装（参照元にしない）"),
}
FORBIDDEN_REPO = "ec-cube-enterprise"
LEGACY_REPOS = [name for name in REPOS if name != FORBIDDEN_REPO]

# 本店(EC-CUBE 3系)と支店(EC-CUBE 4系)は素の EC-CUBE 語彙を共有するので、コアへの一致では
# どちらの機能か決まらない。晴れる屋独自の実装が置かれている領域に当たったときだけ決め手になる。
# 全リポジトリに定義する（EC-CUBE系にだけ加点すると API/デッキ側が構造的に不利になる）。
CUSTOM_SCOPES: dict[str, list[str]] = {
    "pf-eccube3": ["app/Plugin/HareruyaEc"],
    "ec-cube": ["app/Customize", "app/template", "app/config"],
    "pf-api": ["src", "templates", "config"],
    "pf-article": ["wp-content"],
    "deck-api": ["src", "templates", "config"],
    "deck-builder": ["components", "pages", "utils", "redux", "interfaces"],
}
CUSTOM_BONUS = 2.0

SCAN_GLOBS = [
    "*.php", "*.twig", "*.yaml", "*.yml", "*.ts", "*.tsx",
    "*.js", "*.jsx", "*.vue", "*.json", "*.xlf", "*.html",
]
SCAN_EXCLUDES = ["vendor", "node_modules", "var/cache", ".git", "tests", "wp-includes"]

TARGET_KINDS = ("現行踏襲", "カスタマイズ")

# アンカー種別 -> (抽出正規表現, 重み)
ANCHOR_PATTERNS: dict[str, tuple[re.Pattern[str], int]] = {
    "key": (re.compile(r"`([a-z][a-z0-9_]*(?:\.[a-z0-9_]+){1,6})`"), 3),
    "sym": (
        re.compile(
            r"`([A-Z][A-Za-z0-9]{4,}"
            r"(?:Controller|Repository|Type|Service|Input|Handler|Command|Extension|Subscriber))"
        ),
        3,
    ),
    "twig": (re.compile(r"([A-Za-z0-9_/]+\.twig)"), 2),
    "snake": (re.compile(r"`([a-z][a-z0-9]*(?:_[a-z0-9]+){1,4})`"), 1),
    "path": (re.compile(r"(/[a-z][a-z0-9_\-]{2,}(?:/[a-z0-9_\-{}]+){1,5})"), 3),
}
#: URL パスに見えるが実体はファイル名や書式指定のもの（`/m/d`・`/banner/top_001.png` 等）を除く。
PATH_REJECT_RE = re.compile(r"\.(?:png|jpe?g|gif|svg|twig|ya?ml|dist|json|csv|pdf|js|css)$")
MESSAGE_WEIGHT = 2
JP_RE = re.compile(r"[぀-ヿ一-鿿]")
MESSAGE_HEADING_RE = re.compile(r"^#{2,4}\s*.*メッセージ.*$", re.M)
NEXT_HEADING_RE = re.compile(r"^#{2,4}\s+", re.M)
MD_LINK_RE = re.compile(r"\[md\]\(([^)]+)\)")
FEATURE_NO_RE = re.compile(r"[A-Z]\d{2}-")

# 事前候補（命名規則だけで決まる分。証拠と食い違えば「要判定」にする）
def prior_repos(feature_no: str, category: str, name: str) -> list[str]:
    if "支店" in name:
        return ["ec-cube"]
    if category == "デッキビルダー" or feature_no.startswith("A15"):
        return ["deck-api", "deck-builder"]
    if feature_no.startswith("A"):
        return ["pf-api", "pf-article"]
    return ["pf-eccube3"]


class Target:
    __slots__ = ("no", "category", "name", "kind", "path", "anchors")

    def __init__(self, no, category, name, kind, path):
        self.no = no
        self.category = category
        self.name = name
        self.kind = kind
        self.path = path
        self.anchors: dict[str, set[str]] = {}


def load_targets() -> list[Target]:
    targets: list[Target] = []
    for line in TODO_LIST.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.split("|")]
        # [1]=TODO [2]=区分 [3]=分類 [4]=機能名 [5]=機能No [6]=カスタマイズ区分 [7]=機能内容 [8]=詳細設計書
        if len(cells) < 9 or not FEATURE_NO_RE.match(cells[5]):
            continue
        if cells[6] not in TARGET_KINDS:
            continue
        link = MD_LINK_RE.search(cells[8])
        if not link:
            continue
        path = ROOT / "functions" / link.group(1)
        if not path.exists():
            continue
        targets.append(Target(cells[5], cells[3], cells[4], cells[6], path))
    return targets


def extract_messages(text: str) -> set[str]:
    """表示メッセージ表の中の、そのまま検索できる日本語文言だけを拾う。

    プレースホルダ(%x%)や複数文言をまとめた行(／区切り)は literal 検索できないので採らない。
    """
    found: set[str] = set()
    for heading in MESSAGE_HEADING_RE.finditer(text):
        rest = text[heading.end():]
        nxt = NEXT_HEADING_RE.search(rest)
        body = rest[: nxt.start()] if nxt else rest
        for line in body.splitlines():
            if not line.startswith("|"):
                continue
            for cell in (c.strip() for c in line.split("|")):
                if not 6 <= len(cell) <= 40:
                    continue
                if not JP_RE.search(cell):
                    continue
                if "%" in cell or "／" in cell or "`" in cell:
                    continue
                found.add(cell)
    return found


def extract_anchors(target: Target) -> None:
    text = target.path.read_text(encoding="utf-8")
    for kind, (pattern, _weight) in ANCHOR_PATTERNS.items():
        found = set(pattern.findall(text))
        if kind == "path":
            found = {v for v in found if not PATH_REJECT_RE.search(v)}
        target.anchors[kind] = found
    target.anchors["msg"] = extract_messages(text)


def anchor_weight(kind: str) -> int:
    if kind == "msg":
        return MESSAGE_WEIGHT
    return ANCHOR_PATTERNS[kind][1]


def scan_repo(repo: str, anchors: list[str], scoped: bool = False) -> set[str]:
    """リポジトリ内に literal で存在するアンカーの集合を返す（rg 1回）。

    scoped=True のときは CUSTOM_SCOPES に挙げたカスタマイズ領域だけを見る。
    """
    path, _role = REPOS[repo]
    if not path.exists():
        return set()
    if scoped:
        roots = [path / scope for scope in CUSTOM_SCOPES.get(repo, [])]
        roots = [r for r in roots if r.exists()]
        if not roots:
            return set()
    else:
        roots = [path]
    cmd = ["rg", "--no-filename", "--no-line-number", "-o", "-F", "-I", "-f", "-"]
    for glob in SCAN_GLOBS:
        cmd += ["-g", glob]
    for exclude in SCAN_EXCLUDES:
        cmd += ["-g", f"!**/{exclude}/**"]
    cmd += [str(r) for r in roots]
    proc = subprocess.run(
        cmd, input="\n".join(anchors), capture_output=True, text=True, errors="replace"
    )
    if proc.returncode not in (0, 1):
        raise RuntimeError(f"rg failed for {repo}: {proc.stderr[:400]}")
    # rg はファイル単位のエラー（open too many files 等）を stderr に出しつつ 0 で終わる。
    # 黙って取りこぼすと台帳が再現しなくなるので、警告が出たら失敗させる。
    if proc.stderr.strip():
        raise RuntimeError(f"rg reported problems for {repo}: {proc.stderr[:400]}")
    return set(proc.stdout.splitlines())


#: 同一入力でも rg が稀に取りこぼす（実測: ec-cube の全体走査が数回に1回だけ少なく返る）。
#: 揺れた結果をそのまま台帳に焼き込むと再現しなくなるので、一致するまで引き直す。
SCAN_ATTEMPTS = 6


def scan_repo_stable(repo: str, anchors: list[str], scoped: bool = False) -> set[str]:
    """同じ結果が2回連続で得られるまで走査し直す。得られなければ失敗させる。"""
    label = f"{repo}{'(カスタマイズ領域)' if scoped else ''}"
    previous: set[str] | None = None
    for attempt in range(SCAN_ATTEMPTS):
        current = scan_repo(repo, anchors, scoped)
        if previous is not None and current == previous:
            if attempt > 1:
                print(f"  warn: {label} の走査が揺れたため引き直しました（{attempt + 1}回目で安定）")
            return current
        previous = current
    raise RuntimeError(
        f"{label} の走査結果が {SCAN_ATTEMPTS} 回試しても安定しません。"
        "台帳が再現しないため中止します。"
    )


#: 現行ソースのうち何本に当たったら「どこにでもある語」とみなして捨てるか。
UBIQUITOUS_REPO_COUNT = 4
#: 「確定」を名乗るのに最低限必要な得点（重み3のアンカー1本＝リポジトリ固有の翻訳キー/クラス名 相当）。
MIN_DECISIVE_SCORE = 3.0


def anchor_specificity(value: str, present: dict[str, set[str]]) -> float:
    """アンカーの識別力。現行ソース n 本に共通で存在する語は 1/n しか効かせない。

    `product_id` のように EC-CUBE 系すべてに出る語で帰属を決めてはいけない。
    逆に1リポジトリにしか無い翻訳キーやクラス名は、そのまま決め手になる。
    """
    matched = sum(1 for repo in LEGACY_REPOS if value in present[repo])
    if matched == 0 or matched >= UBIQUITOUS_REPO_COUNT:
        return 0.0
    return 1.0 / matched


def custom_specificity(value: str, custom: dict[str, set[str]]) -> float:
    """カスタマイズ領域だけで見た識別力。素の EC-CUBE 語彙はここに現れない。"""
    matched = sum(1 for repo in CUSTOM_SCOPES if value in custom.get(repo, set()))
    if matched == 0:
        return 0.0
    return 1.0 / matched


def score_target(
    target: Target, present: dict[str, set[str]], custom: dict[str, set[str]]
) -> tuple[dict[str, float], float]:
    """Return (現行ソース別スコア, ee固有スコア).

    ee固有スコアは「現行ソースのどこにも無く ec-cube-enterprise にだけ在る」アンカーだけを数える。
    現行踏襲/カスタマイズなのにこれが立つ設計書は、本文が新実装の逆生成になっている疑いが濃い。
    """
    scores: dict[str, float] = {}
    for repo in LEGACY_REPOS:
        total = 0.0
        for kind, values in target.anchors.items():
            weight = anchor_weight(kind)
            for value in values:
                if value in present[repo]:
                    total += weight * anchor_specificity(value, present)
                if value in custom.get(repo, set()):
                    total += weight * CUSTOM_BONUS * custom_specificity(value, custom)
        scores[repo] = round(total, 2)

    ee_only = 0.0
    for kind, values in target.anchors.items():
        weight = anchor_weight(kind)
        for value in values:
            if value in present[FORBIDDEN_REPO] and not any(
                value in present[repo] for repo in LEGACY_REPOS
            ):
                ee_only += weight
    return scores, round(ee_only, 2)


def decide(target: Target, scores: dict[str, float], ee_only: float) -> tuple[str, str, str]:
    """Return (判定, 参照元, 根拠メモ)."""
    priors = prior_repos(target.no, target.category, target.name)
    legacy = sorted(((scores[r], r) for r in LEGACY_REPOS), key=lambda x: (-x[0], x[1]))
    top_score, top_repo = legacy[0]
    second_score = legacy[1][0]
    ee_note = f" ee固有={ee_only}" if ee_only else ""

    if top_score == 0:
        return "根拠なし(TBD)", "／".join(priors), "識別力のあるアンカーが1本も当たらない" + ee_note

    note = f"{top_repo}={top_score} 次点={second_score}{ee_note}"
    dominant = second_score == 0 or top_score >= 2 * second_score
    if dominant and top_repo in priors:
        if top_score < MIN_DECISIVE_SCORE:
            return "要判定", top_repo, note + f"（事前候補と一致するが証拠が弱い<{MIN_DECISIVE_SCORE}）"
        return "確定", top_repo, note
    if dominant:
        return "要判定", top_repo, note + f"（事前候補 {'／'.join(priors)} と不一致）"
    tied = [r for s, r in legacy if s > 0 and s >= top_score / 2]
    return "要判定", "／".join(tied), note + "（複数リポジトリで拮抗）"


def build(argv_check_only: bool = False) -> tuple[str, str, str]:
    targets = load_targets()
    if not targets:
        raise SystemExit("対象機能が0件です（todo-list.md の書式を確認してください）")
    for target in targets:
        extract_anchors(target)

    all_anchors = sorted({v for t in targets for values in t.anchors.values() for v in values})
    # 逐次実行する。rg を並列に走らせると取りこぼしが起きて台帳が再現しなくなる
    # （実測: 同一入力で ec-cube のカスタマイズ領域一致が 392 → 355 に揺れた）。
    present = {repo: scan_repo_stable(repo, all_anchors) for repo in REPOS}
    custom = {repo: scan_repo_stable(repo, all_anchors, True) for repo in CUSTOM_SCOPES}

    rows: list[list[str]] = []
    anchor_rows: list[list[str]] = []
    status_count: Counter[str] = Counter()
    repo_count: Counter[str] = Counter()
    contaminated: list[str] = []

    for target in sorted(targets, key=lambda t: t.no):
        scores, ee_only = score_target(target, present, custom)
        status, assigned, note = decide(target, scores, ee_only)
        status_count[status] += 1
        repo_count[assigned] += 1
        suspect = ee_only > max(scores[r] for r in LEGACY_REPOS)
        if suspect:
            contaminated.append(target.no)
        rows.append([
            target.no, target.name, target.category, target.kind,
            target.path.relative_to(ROOT).as_posix(),
            status, assigned,
            *(f"{scores[r]:g}" for r in LEGACY_REPOS),
            f"{ee_only:g}",
            "ee優位" if suspect else "",
            note,
        ])
        for kind, values in sorted(target.anchors.items()):
            for value in sorted(values):
                hits = [r for r in REPOS if value in present[r]]
                custom_hits = [r for r in CUSTOM_SCOPES if value in custom.get(r, set())]
                anchor_rows.append([
                    target.no, kind, str(anchor_weight(kind)), value,
                    f"{anchor_specificity(value, present):g}",
                    ",".join(hits) if hits else "-",
                    ",".join(custom_hits) if custom_hits else "-",
                ])

    header = [
        "機能No", "機能名", "分類", "カスタマイズ区分", "設計書",
        "判定", "参照元", *LEGACY_REPOS, "ee固有", "汚染", "根拠",
    ]
    ledger = "\n".join("\t".join(r) for r in [header] + rows) + "\n"
    anchor_header = [
        "機能No", "種別", "重み", "アンカー", "識別力", "一致リポジトリ", "カスタマイズ領域一致",
    ]
    anchors_tsv = "\n".join("\t".join(r) for r in [anchor_header] + anchor_rows) + "\n"
    summary = render_summary(targets, rows, status_count, repo_count, contaminated, all_anchors)
    return ledger, anchors_tsv, summary


def render_summary(targets, rows, status_count, repo_count, contaminated, all_anchors) -> str:
    total = len(targets)
    lines: list[str] = []
    lines.append("# Stage 0: 現行踏襲・カスタマイズ機能の参照元帰属台帳")
    lines.append("")
    lines.append(
        f"対象 **{total} 機能**（現行踏襲・カスタマイズ）。"
        f"抽出アンカー {len(all_anchors)} 種を {len(REPOS)} リポジトリで literal 検索した結果。"
    )
    lines.append("")
    lines.append(
        "参照元は現行ソース。`ec-cube-enterprise` は構築中の新実装なので**帰属先には選ばない**。"
        "列 `ee固有` は「現行ソースのどこにも無く新実装にだけ在る」アンカーの重み和で、"
        "既存設計書が新実装を見て書かれていないかの検出用。"
    )
    lines.append("")
    lines.append("## 判定内訳")
    lines.append("")
    lines.append("| 判定 | 件数 |")
    lines.append("|---|---|")
    for status in ("確定", "要判定", "根拠なし(TBD)"):
        lines.append(f"| {status} | {status_count.get(status, 0)} |")
    lines.append("")
    lines.append("## 参照元別")
    lines.append("")
    lines.append("| 参照元 | 役割 | 件数 |")
    lines.append("|---|---|---|")
    for repo, count in repo_count.most_common():
        role = "／".join(REPOS[r][1] for r in repo.split("／") if r in REPOS)
        lines.append(f"| {repo} | {role} | {count} |")
    lines.append("")

    unresolved = [r for r in rows if r[5] != "確定"]
    lines.append(f"## 要判定・根拠なし（{len(unresolved)} 件）")
    lines.append("")
    lines.append("これらは推測で埋めない。Stage 1 に進める前に人手で参照元を確定させる。")
    lines.append("")
    lines.append("| 機能No | 機能名 | 判定 | 参照元候補 | 根拠 |")
    lines.append("|---|---|---|---|---|")
    for row in unresolved:
        lines.append(f"| {row[0]} | {row[1]} | {row[5]} | {row[6]} | {row[-1]} |")
    lines.append("")

    lines.append(f"## ee 優位（既存記述が新実装由来の疑い・{len(contaminated)} 件）")
    lines.append("")
    if contaminated:
        lines.append(
            "現行踏襲/カスタマイズなのに、アンカーが現行ソースより `ec-cube-enterprise` に多く一致する。"
            "既存本文が新実装の逆生成になっている可能性が高く、Stage 1 で現行ソースから書き直す優先対象。"
        )
        lines.append("")
        lines.append("```")
        lines.append(", ".join(contaminated))
        lines.append("```")
    else:
        lines.append("該当なし。")
    lines.append("")
    lines.append("## 再生成")
    lines.append("")
    lines.append("```bash")
    lines.append("S=.cursor/skills/genzai-source-attribution/scripts/build_source_attribution.py")
    lines.append('python3 "$S" build    # 台帳を生成')
    lines.append('python3 "$S" verify   # 台帳が現状と一致するか検査')
    lines.append("```")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("mode", choices=("build", "verify"))
    args = parser.parse_args()

    ledger, anchors_tsv, summary = build()

    if args.mode == "build":
        OUT_DIR.mkdir(exist_ok=True)
        LEDGER.write_text(ledger, encoding="utf-8")
        ANCHOR_LEDGER.write_text(anchors_tsv, encoding="utf-8")
        SUMMARY.write_text(summary, encoding="utf-8")
        rows = ledger.rstrip("\n").split("\n")[1:]
        counted = Counter(r.split("\t")[5] for r in rows)
        print(f"build: {len(rows)} 機能")
        for status, count in counted.most_common():
            print(f"  {status}: {count}")
        print(f"  -> {LEDGER.relative_to(ROOT)} / {ANCHOR_LEDGER.relative_to(ROOT)} / {SUMMARY.relative_to(ROOT)}")
        return 0

    failures: list[str] = []
    for path, expected in ((LEDGER, ledger), (ANCHOR_LEDGER, anchors_tsv), (SUMMARY, summary)):
        if not path.exists():
            failures.append(f"{path.relative_to(ROOT)} が存在しません")
        elif path.read_text(encoding="utf-8") != expected:
            failures.append(f"{path.relative_to(ROOT)} が再計算結果と一致しません（build し直してください）")
    for row in ledger.rstrip("\n").split("\n")[1:]:
        cells = row.split("\t")
        if FORBIDDEN_REPO in cells[6]:
            failures.append(f"{cells[0]}: 参照元に {FORBIDDEN_REPO} が入っています（循環）")
    if failures:
        for failure in failures:
            print(f"NG: {failure}", file=sys.stderr)
        return 1
    print("OK: 帰属台帳は現状と一致し、参照元に新実装リポジトリを含みません")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
