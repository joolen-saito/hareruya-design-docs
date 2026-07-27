#!/usr/bin/env python3
"""画面遷移の到達経路を検査する（結合テストの前提: 単体URL直アクセスで済ませない）。

検査は2系統。

  A. コード検査（e2e/pages/**.page.ts・e2e/spec/**.spec.ts）
     遷移必須画面（到達クラス=transition-only）へ `page.goto()` で直接入っていないか。
     直アクセスそのものが観点の場合のみ許可し、その宣言（@direct-access）を要求する。

  B. ケース表検査（integration_test/e2e/exec/tsv/*.tsv・integration_test/e2e/*_e2e_cases.md）
     遷移必須画面を対象にする行が、起点画面からの遷移鎖で書かれているか。
     入力データ列が単体リクエストだけで終わっていないか。

到達クラスの正は `e2e/config/screen-reachability.tsv`（根拠 file:line 付きの確定台帳）。
台帳に無いパスは判定しない（未登録として計上する）。推測で判定しない。
台帳の作り方は extract_screen_transitions.py の出力（候補）を根拠付きで確定させる。

使い方:
  python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_transition_paths.py --repo .
  python3 ... --strict     # error が1件でもあれば exit 1
"""

from __future__ import annotations

import argparse
import csv
import io
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REGISTRY = Path("e2e/config/screen-reachability.tsv")
REPORT_MD = Path("e2e/reports/transition-path-audit.md")
REPORT_TSV = Path("e2e/reports/transition-path-audit.tsv")

TSV_FENCE_RE = re.compile(r"```tsv\n(.*?)\n```", re.S)
GOTO_RE = re.compile(r"(?:this\.page|page)\.goto\(\s*([^)]*?)\s*\)")
ASSIGN_RE = re.compile(r"this\.(\w+)\s*=\s*(`[^`]*`|\"[^\"]*\"|'[^']*')\s*;")
STRING_RE = re.compile(r"^(`[^`]*`|\"[^\"]*\"|'[^']*')$")
THIS_MEMBER_RE = re.compile(r"^this\.(\w+)")
PATH_IN_TEXT = re.compile(r"(/[A-Za-z0-9_\-{}$./]+)")
HTTP_REQ = re.compile(r"\b(GET|POST|PUT|PATCH|DELETE)\s+(/[A-Za-z0-9_\-{}./]*)")

DIRECT_ACCESS_MARK = "@direct-access"
NEW_PAGE_RE = re.compile(
    r"newContext\(|newPage\(|launchPersistentContext\(|waitForEvent\(\s*[\"']page[\"']"
)
# 名前空間 import（`import * as pw from "@playwright/test"`）経由の base test 取り込み。
NS_TEST_IMPORT_RE = re.compile(r"import\s+\*\s+as\s+\w+\s+from\s*[\"']@playwright/test[\"']")
# `import { test, expect } from "@playwright/test"` のように base の test を取り込む記述。
# フィクスチャを import していても base test を併用すれば強制は効かない。
BASE_TEST_IMPORT_RE = re.compile(
    r"import\s*\{([^}]*)\}\s*from\s*[\"']@playwright/test[\"']", re.S
)

# 観点列（「未認証」等）は母集合生成器由来の汎用ラベルで、直アクセス試験であることを意味しない。
# 観点列で除外すると本来必要な経路要求まで消えるため、判定には使わない。
# 直アクセス意図は手順/入力データの本文に現れる逐語だけを採る（推測しない）。
# 「直アクセスであること自体が試験内容」を示す逐語だけを採る（推測しない）。
DIRECT_ACCESS_STEP_MARKERS = (
    "直接アクセス",
    "直アクセス",
    "直接開く",
    "のまま開く",
    "URLへ直接",
    "URLに直接",
    "直接URL",
)


@dataclass
class Finding:
    severity: str
    check: str
    location: str
    path: str
    detail: str


def norm_path(raw: str) -> str:
    p = raw.strip().strip("。、）)（(`\"'")
    p = re.sub(r"\$\{[^}]*\}", "{}", p)
    if p.startswith("{}"):
        # `${this.localePrefix}/cart` のように変数が先頭に来る書き方。
        p = "/" + p
    p = p.replace("/{_locale}", "").replace("/{locale}", "")
    p = p.rstrip("/")
    if not p.startswith("/"):
        return ""
    return p or "/"


def path_regex(registry_path: str) -> re.Pattern[str]:
    esc = re.escape(registry_path)
    esc = re.sub(r"\\\{[^}]*\\\}", r"[^/]+", esc)
    return re.compile(rf"^{esc}$")


@dataclass
class RegEntry:
    fid: str
    path: str
    klass: str
    route: str
    direct_expect: str
    evidence: str
    status: str
    matcher: re.Pattern[str]


def load_registry(repo: Path) -> list[RegEntry]:
    f = repo / REGISTRY
    if not f.exists():
        raise SystemExit(f"registry not found: {REGISTRY}")
    out: list[RegEntry] = []
    with f.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh, delimiter="\t"):
            p = norm_path(row["パス"])
            if not p:
                continue
            out.append(
                RegEntry(
                    fid=row["機能ID"].strip(),
                    path=p,
                    klass=row["到達クラス"].strip(),
                    route=row["正規到達経路"].strip(),
                    direct_expect=row["直アクセス時の期待"].strip(),
                    evidence=row["根拠(file:line)"].strip(),
                    status=row["確定状態"].strip(),
                    matcher=path_regex(p),
                )
            )
    # 長いパスを先に評価する（/shopping より /shopping/complete を優先）。
    out.sort(key=lambda e: len(e.path), reverse=True)
    return out


def path_variants(path: str) -> list[str]:
    """先頭のプレフィックス変数（localePrefix・管理画面ルート等）を剥がした候補を返す。

    Page Object は `${this.localePrefix}/shopping/complete` のように書くため、
    正規化後は `/{}/shopping/complete` になる。台帳のパスはサイトルート相対なので、
    先頭の `{}` セグメントを順に落とした形も照合対象にする。
    """
    out = [path]
    cur = path
    while cur.startswith("/{}"):
        cur = cur[3:] or "/"
        if not cur.startswith("/"):
            cur = "/" + cur
        out.append(cur)
    return out


def lookup(registry: list[RegEntry], path: str) -> RegEntry | None:
    for cand in path_variants(path):
        for e in registry:
            if e.matcher.match(cand):
                return e
    return None


def literal_path(expr: str) -> str:
    if STRING_RE.match(expr):
        return norm_path(expr[1:-1])
    return ""


# ---------------------------------------------------------------- A: コード検査


FID_IN_FILE = re.compile(r"([a-z]\d{2})_(\d{2})_")


def fid_of_file(rel: str) -> str:
    m = FID_IN_FILE.search(Path(rel).name)
    return f"{m.group(1).upper()}-{m.group(2)}" if m else ""


def in_scope(fid: str, scope: set[str]) -> bool:
    if not scope:
        return False
    return bool(fid) and (fid in scope or fid.split("-")[0] in scope)


def scan_code(
    repo: Path, registry: list[RegEntry], scope: set[str]
) -> tuple[list[Finding], dict[str, int]]:
    findings: list[Finding] = []
    stats = {
        "goto": 0,
        "resolved": 0,
        "unregistered": 0,
        "direct_access_declared": 0,
        "fixture_missing": 0,
    }

    files = sorted((repo / "e2e" / "pages").rglob("*.ts")) + sorted(
        (repo / "e2e" / "spec").rglob("*.ts")
    )
    for f in files:
        text = f.read_text(encoding="utf-8")
        lines = text.splitlines()
        rel0 = str(f.relative_to(repo))
        scoped0 = in_scope(fid_of_file(rel0), scope)

        # 実行時強制の適用漏れ検査。
        if rel0.startswith("e2e/spec/") and "_harness/" not in rel0:
            uses_fixture = "fixtures/reachability.fixture" in text
            base_test_imported = bool(NS_TEST_IMPORT_RE.search(text)) or any(
                "test" in [t.strip().split(" as ")[0] for t in m.group(1).split(",")]
                for m in BASE_TEST_IMPORT_RE.finditer(text)
            )
            # 直接 navigate する spec（error 相当）と、Page Object 経由の可能性がある spec
            # （偽陽性がありうるので常に warn）を分ける。
            navigates_directly = "page.goto(" in text or "helpers/navigation" in text
            navigates_maybe = "/pages/" in text

            if (navigates_directly or navigates_maybe) and not uses_fixture:
                stats["fixture_missing"] += 1
                findings.append(
                    Finding(
                        "error" if (scoped0 and navigates_directly) else "warn",
                        "A-fixture未適用",
                        f"{rel0}:1",
                        "-",
                        "画面へ遷移する spec が fixtures/reachability.fixture の test を使っていない"
                        "（実行時の到達強制が効かない）"
                        + ("" if navigates_directly else "。Page Object 経由の可能性のみのため warn"),
                    )
                )
            elif uses_fixture and base_test_imported:
                findings.append(
                    Finding(
                        "error" if scoped0 else "warn",
                        "A-base_test併用",
                        f"{rel0}:1",
                        "-",
                        "fixture を import しているが @playwright/test の test も取り込んでいる。"
                        "base の test で書かれたケースは強制の外に出る",
                    )
                )

        # Page 生成はどのレイヤでも強制の外に出るため spec/Page Object の双方を見る。
        if "_harness/" not in rel0 and NEW_PAGE_RE.search(text):
            if "guardPage(" not in text and "guardContext(" not in text:
                findings.append(
                    Finding(
                        "error" if scoped0 else "warn",
                        "A-fixture外Page",
                        f"{rel0}:1",
                        "-",
                        "フィクスチャ外で Page/Context を生成している（newContext / newPage / "
                        "launchPersistentContext / "
                        'waitForEvent("page")）。guardPage() か guardContext() を適用する',
                    )
                )
            else:
                # guard 呼び出しが同一ファイルにあるだけでは、生成した Page に当たっている
                # 保証はない（変数単位の追跡は AST が要る）。黙って免除せず目視対象として出す。
                findings.append(
                    Finding(
                        "warn",
                        "A-guard手動適用(要目視)",
                        f"{rel0}:1",
                        "-",
                        "Page/Context を生成し guardPage()/guardContext() も呼んでいるが、"
                        "生成した対象に適用されているかは静的には確認していない",
                    )
                )
        members = {m.group(1): literal_path(m.group(2)) for m in ASSIGN_RE.finditer(text)}
        rel = str(f.relative_to(repo))

        for i, line in enumerate(lines, start=1):
            m = GOTO_RE.search(line)
            if not m:
                continue
            stats["goto"] += 1
            expr = m.group(1)
            path = literal_path(expr)
            if not path:
                tm = THIS_MEMBER_RE.match(expr)
                if tm:
                    path = members.get(tm.group(1), "")
                if not path:
                    # `${this.localePrefix}/shopping/complete` のような直書き
                    cand = [norm_path(p) for p in PATH_IN_TEXT.findall(expr)]
                    cand = [c for c in cand if c]
                    path = cand[-1] if cand else ""
            if not path:
                continue
            stats["resolved"] += 1

            entry = lookup(registry, path)
            if entry is None:
                stats["unregistered"] += 1
                scoped = in_scope(fid_of_file(rel), scope)
                findings.append(
                    Finding(
                        "error" if scoped else "warn",
                        "A-未登録(対象内)" if scoped else "A-未登録",
                        f"{rel}:{i}",
                        path,
                        "到達クラスが台帳に無い。screen-reachability.tsv へ根拠付きで登録するまで到達妥当性を判定できない"
                        + ("（--scope 指定の量産対象内のため error）" if scoped else ""),
                    )
                )
                continue
            if entry.klass == "要確認":  # noqa: E501
                findings.append(
                    Finding(
                        "warn",
                        "A-要確認",
                        f"{rel}:{i}",
                        path,
                        f"到達クラスが未確定の画面（{entry.fid}）。設計書だけでは直アクセス可否を断定できない"
                        f"（{entry.evidence}）。実機確認等で確定するまで到達妥当性を判定しない",
                    )
                )
                continue
            if entry.klass not in ("transition-only", "action-endpoint"):
                continue

            # 直アクセス観点の宣言があるか（直前8行のコメント／test タイトル／tag）
            window = "\n".join(lines[max(0, i - 9) : i + 1])
            if DIRECT_ACCESS_MARK in window:
                stats["direct_access_declared"] += 1
                continue

            if entry.klass == "action-endpoint":
                findings.append(
                    Finding(
                        "error",
                        "A-送信系へGET",
                        f"{rel}:{i}",
                        path,
                        f"送信系エンドポイント（画面ではない）へ page.goto している。"
                        f"当該操作は画面上の操作で発火させる／根拠={entry.evidence}",
                    )
                )
                continue

            findings.append(
                Finding(
                    "error",
                    "A-直アクセス",
                    f"{rel}:{i}",
                    path,
                    f"遷移必須画面へ page.goto で直接到達している。正規経路={entry.route}／根拠={entry.evidence}。"
                    f"直アクセス自体が観点なら直前に {DIRECT_ACCESS_MARK}: 理由 を書く",
                )
            )
    return findings, stats


# ------------------------------------------------------------ B: ケース表検査

CASE_COLS = ("入力データ/リクエスト内容", "操作手順/実行方法", "テスト観点", "テストID")

IT_HEADER = [
    "機能名", "テストID", "I/FID", "テスト観点", "優先度", "テスト項目名",
    "前提条件", "入力データ/リクエスト内容", "操作手順/実行方法", "期待結果／レスポンス",
]
EXEC_TSV_HEADER = IT_HEADER + ["実行方法"]
E2E_MD_HEADER = IT_HEADER + ["実施者", "実施日", "結果", "失敗理由"]


def iter_case_rows(repo: Path, broken: list[Finding] | None = None):
    """ケース表の行を巡回する。列数不整合（TSV破損）は broken へ積む。

    手順列の編集で引用符を欠くと行が割れて静かに列が壊れる。実際に一度起きたため、
    到達検査の前段で必ず検出する。
    """

    def walk(src: str, text: str, expected_header: list[str]):
        try:
            rows = list(csv.reader(io.StringIO(text), delimiter="\t", strict=True))
        except csv.Error as exc:
            if broken is not None:
                broken.append(
                    Finding("error", "B-TSV破損", f"{src}:1", "-", f"TSVとして読めない: {exc}")
                )
            return
        if not rows:
            if broken is not None:
                broken.append(Finding("error", "B-TSV破損", f"{src}:1", "-", "表が空"))
            return
        header = rows[0]
        if header != expected_header:
            if broken is not None:
                missing = [c for c in expected_header if c not in header]
                extra = [c for c in header if c not in expected_header]
                broken.append(
                    Finding(
                        "error",
                        "B-TSVヘッダ不一致",
                        f"{src}:1",
                        "-",
                        f"ヘッダが規定と異なる（列数 {len(header)}!={len(expected_header)}"
                        f"／欠落={missing}／余分={extra}）",
                    )
                )
            return
        if len(set(header)) != len(header):
            if broken is not None:
                broken.append(
                    Finding("error", "B-TSVヘッダ不一致", f"{src}:1", "-", "ヘッダに重複列がある")
                )
            return
        for n, row in enumerate(rows[1:], start=2):
            if len(row) != len(header):
                if broken is not None:
                    broken.append(
                        Finding(
                            "error",
                            "B-TSV破損",
                            f"{src}:{n}",
                            "-",
                            f"列数がヘッダと不一致（{len(row)} != {len(header)}）。"
                            f"改行を含むセルは引用符で囲む",
                        )
                    )
                continue
            yield src, n, dict(zip(header, row))

    for tsv in sorted((repo / "integration_test" / "e2e" / "exec" / "tsv").glob("*.tsv")):
        yield from walk(
            str(tsv.relative_to(repo)), tsv.read_text(encoding="utf-8"), EXEC_TSV_HEADER
        )
    for md in sorted((repo / "integration_test" / "e2e").glob("*_e2e_cases.md")):
        rel = str(md.relative_to(repo))
        fences = TSV_FENCE_RE.findall(md.read_text(encoding="utf-8"))
        if not fences:
            if broken is not None:
                broken.append(
                    Finding("error", "B-TSV破損", f"{rel}:1", "-", "```tsv フェンスが無い")
                )
            continue
        # 納品ケース表は1本目のフェンスが正。2本目以降は付帯表なので検査対象外だが、
        # 存在自体は記録する（誤って2本目にケースを書いた事故を見えるようにする）。
        if len(fences) > 1 and broken is not None:
            broken.append(
                Finding(
                    "warn",
                    "B-TSVフェンス複数",
                    f"{rel}:1",
                    "-",
                    f"```tsv フェンスが {len(fences)} 本ある。ケース表は1本目のみを検査する",
                )
            )
        yield from walk(rel, fences[0], E2E_MD_HEADER)


def route_origin(route: str) -> str:
    """正規到達経路の先頭パス（起点画面）を返す。"""
    for tok in PATH_IN_TEXT.findall(route):
        n = norm_path(tok)
        if n:
            return n
    return ""


def route_tokens(route: str) -> list[tuple[str, str]]:
    """正規到達経路を順序付きトークンへ分解する。

    `/cart >「購入手続きへ」> /shopping >「注文する」> /shopping/complete`
      → [("path","/cart"), ("label","購入手続きへ"), ("path","/shopping"), ...]
    """
    tokens: list[tuple[str, str]] = []
    for raw in route.split(">"):
        t = raw.strip()
        if not t:
            continue
        label = re.findall(r"「([^」]+)」", t)
        if label:
            tokens.append(("label", label[0]))
            continue
        paths = [norm_path(p) for p in PATH_IN_TEXT.findall(t)]
        paths = [p for p in paths if p]
        if paths:
            tokens.append(("path", paths[0]))
    return tokens


def ordered_match(tokens: list[tuple[str, str]], text: str) -> list[tuple[str, str]]:
    """トークンが text に順序どおり現れるか調べ、欠落トークンを返す。"""
    missing: list[tuple[str, str]] = []
    cursor = 0
    for kind, value in tokens:
        pos = text.find(value, cursor)
        if pos < 0:
            missing.append((kind, value))
            continue
        cursor = pos + len(value)
    return missing


def scan_cases(repo: Path, registry: list[RegEntry]) -> tuple[list[Finding], dict[str, int]]:
    findings: list[Finding] = []
    stats = {"rows": 0, "transition_rows": 0, "ok": 0}

    for src, lineno, row in iter_case_rows(repo, findings):
        if not all(c in row for c in CASE_COLS):
            continue
        stats["rows"] += 1
        inp = row.get("入力データ/リクエスト内容") or ""
        steps = row.get("操作手順/実行方法") or ""
        case_id = row.get("テストID") or f"line{lineno}"

        # 対象画面は入力データ列だけでなく操作手順にも書かれる（入力データが単体URLでも
        # 手順に目的画面が現れるケースがある）。両方から集めないと検査対象を取りこぼす。
        paths: list[str] = []
        for source in (inp, steps):
            for _, p in HTTP_REQ.findall(source):
                n = norm_path(p)
                if n and n not in paths:
                    paths.append(n)
            for p in PATH_IN_TEXT.findall(source):
                n = norm_path(p)
                if n and n not in paths:
                    paths.append(n)

        targets = []
        for p in paths:
            e = lookup(registry, p)
            if not e:
                continue
            if e.klass == "要確認":
                findings.append(
                    Finding(
                        "warn",
                        "B-要確認",
                        f"{src}:{lineno} {case_id}",
                        p,
                        f"到達クラスが未確定の画面（{e.fid}）を対象にしている。"
                        f"確定するまで経路要件を判定しない（{e.evidence}）",
                    )
                )
            elif e.klass == "transition-only":
                targets.append((p, e))
        if not targets:
            continue
        stats["transition_rows"] += 1

        body = f"{inp}\n{steps}"
        is_direct_case = any(m in body for m in DIRECT_ACCESS_STEP_MARKERS)
        if is_direct_case:
            # 直アクセスそのものが試験内容の行。経路は要求しないが、免除を黙って通さない
            # （免除自体を warn として出し、人手で妥当性を確認できるようにする）。
            expected = row.get("期待結果／レスポンス") or ""
            hit_markers = [m for m in DIRECT_ACCESS_STEP_MARKERS if m in body]
            for p, e in targets:
                findings.append(
                    Finding(
                        "warn",
                        "B-直アクセス免除",
                        f"{src}:{lineno} {case_id}",
                        p,
                        f"遷移必須画面だが手順の逐語「{'・'.join(hit_markers)}」により"
                        f"直アクセス試験とみなして経路要件を免除した。免除の妥当性は人手で確認する",
                    )
                )
            for p, e in targets:
                if not e.direct_expect or e.direct_expect.startswith("未確定"):
                    continue
                # 設計書が複数のガード（状態欠落→戻し先）を定める画面がある。
                # 台帳は `;` 区切りで並記し、いずれか1つと噛み合えば合格とする。
                alts = [a.strip() for a in e.direct_expect.split(";") if a.strip()]
                hit = False
                for alt in alts:
                    key = re.split(r"[（(・]", alt)[0].strip()
                    if key and key[:6] in expected:
                        hit = True
                        break
                if not hit:
                    findings.append(
                        Finding(
                            "warn",
                            "B-直アクセス期待の不一致",
                            f"{src}:{lineno} {case_id}",
                            p,
                            f"直アクセス試験だが期待結果が台帳の直アクセス時の期待"
                            f"「{e.direct_expect}」と噛み合っていない／根拠={e.evidence}",
                        )
                    )
            continue

        for p, e in targets:
            origin = route_origin(e.route)
            tokens = route_tokens(e.route)
            if not tokens:
                findings.append(
                    Finding(
                        "error",
                        "B-台帳の経路未定義",
                        f"{src}:{lineno} {case_id}",
                        p,
                        f"遷移必須画面（{e.fid}）だが台帳の正規到達経路が分解できない: {e.route!r}",
                    )
                )
                continue

            # 台帳の経路（起点・各遷移トリガ・目的画面）が手順に順序どおり現れるかを見る。
            missing = ordered_match(tokens, steps)
            if missing:
                shortfall = "・".join(
                    f"{'画面' if k == 'path' else '操作'}「{v}」" for k, v in missing
                )
                findings.append(
                    Finding(
                        "error",
                        "B-経路欠落",
                        f"{src}:{lineno} {case_id}",
                        p,
                        f"操作手順が台帳の正規到達経路を順序どおり満たしていない。"
                        f"欠落={shortfall}／正規経路={e.route}",
                    )
                )
                continue

            origin_in_input = bool(origin) and origin in inp
            if not origin_in_input:
                findings.append(
                    Finding(
                        "warn",
                        "B-入力データが単体リクエスト",
                        f"{src}:{lineno} {case_id}",
                        p,
                        f"操作手順は経路を書いているが入力データ列は単体リクエストのみ。"
                        f"起点（{origin}）と遷移トリガを入力データ列にも書く",
                    )
                )
            else:
                stats["ok"] += 1
    return findings, stats


# ------------------------------------------------------------------- レポート


def render(repo: Path, findings: list[Finding], code_stats: dict, case_stats: dict) -> None:
    errors = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]

    (repo / REPORT_TSV).parent.mkdir(parents=True, exist_ok=True)
    with (repo / REPORT_TSV).open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, delimiter="\t", lineterminator="\n")
        w.writerow(["severity", "check", "location", "path", "detail"])
        for f in findings:
            w.writerow([f.severity, f.check, f.location, f.path, f.detail])

    lines = [
        "# 画面遷移 到達経路 監査",
        "",
        "到達クラスの正: `e2e/config/screen-reachability.tsv`（根拠 file:line 付き確定台帳）。",
        "台帳に無いパスは判定せず未登録として計上する（推測で判定しない）。",
        "",
        "## 集計",
        "",
        f"- コード: page.goto 検出 {code_stats['goto']} / パス解決 {code_stats['resolved']} / "
        f"未登録 {code_stats['unregistered']} / 直アクセス宣言済み {code_stats['direct_access_declared']}",
        f"- **到達台帳カバレッジ: {code_stats['resolved'] - code_stats['unregistered']}"
        f"/{code_stats['resolved']} ({code_stats['coverage']:.1f}%)** "
        f"— 未登録のパスは判定していない（error 0 は「違反なし」ではなく「大半が未判定」を含む）",
        f"- パス解決できなかった goto: {code_stats['goto'] - code_stats['resolved']}"
        f"（動的URL等。監査の死角として計上する）",
        f"- ケース表: 判定対象行 {case_stats['rows']} / 遷移必須画面を含む行 {case_stats['transition_rows']} / "
        f"経路記述あり {case_stats['ok']}",
        f"- error {len(errors)} / warn {len(warns)}",
        "",
        "## error（遷移必須画面への直アクセス・経路欠落）",
        "",
    ]
    if errors:
        lines += ["| check | 箇所 | パス | 内容 |", "|---|---|---|---|"]
        lines += [f"| {f.check} | `{f.location}` | `{f.path}` | {f.detail} |" for f in errors]
    else:
        lines.append("なし")
    lines += ["", "## warn", ""]
    if warns:
        lines += ["| check | 箇所 | パス | 内容 |", "|---|---|---|---|"]
        lines += [f"| {f.check} | `{f.location}` | `{f.path}` | {f.detail} |" for f in warns[:400]]
        if len(warns) > 400:
            lines.append(f"| … | （残り {len(warns) - 400} 件は TSV を参照） | | |")
    else:
        lines.append("なし")
    (repo / REPORT_MD).write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    ap.add_argument("--strict", action="store_true", help="error が1件でもあれば exit 1")
    ap.add_argument(
        "--scope",
        default="",
        help="量産対象の機能ID/接頭辞をカンマ区切りで指定（例 F04 または F04-04）。"
        "対象内の未登録パスは warn ではなく error にする",
    )
    ap.add_argument(
        "--require-registry-coverage",
        action="store_true",
        help="解決できたパスがすべて台帳に登録されていなければ exit 2（未判定を合格に見せない）",
    )
    args = ap.parse_args()
    repo = Path(args.repo).resolve()
    scope = {s.strip().upper() for s in args.scope.split(",") if s.strip()}

    registry = load_registry(repo)
    code_findings, code_stats = scan_code(repo, registry, scope)
    case_findings, case_stats = scan_cases(repo, registry)
    findings = code_findings + case_findings

    resolved = code_stats["resolved"]
    registered = resolved - code_stats["unregistered"]
    code_stats["coverage"] = (registered / resolved * 100) if resolved else 0.0
    render(repo, findings, code_stats, case_stats)

    n_err = len([f for f in findings if f.severity == "error"])
    n_warn = len(findings) - n_err
    print(
        f"registry={len(registry)} scope={sorted(scope) or '-'} "
        f"error={n_err} warn={n_warn} "
        f"到達台帳カバレッジ={registered}/{resolved} ({code_stats['coverage']:.1f}%)"
    )
    print(f"out: {REPORT_MD}")
    print(f"out: {REPORT_TSV}")
    if args.strict and n_err:
        sys.exit(1)
    if args.require_registry_coverage and code_stats["unregistered"]:
        print(
            f"NG: 未登録 {code_stats['unregistered']} 件。台帳へ根拠付きで登録するまで到達性は未判定",
            file=sys.stderr,
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
