#!/usr/bin/env python3
"""Backlog チケットの事実確認ハーネス。

役割分担:
- 本ハーネス（決定的）… 課題取得、本文の節分解、引用パス/行範囲の実在検証、
  設計書名から正本HTMLシートの解決、反映内容のプレビューと適用。
- LLM（判定）… 設計と実装を読み比べて 誤検出 / 真の乖離 を判定する。ここでは判定しない。

反映の既定は dry-run。--apply を明示したときだけ Backlog へ書き込む。

サブコマンド:
  meta     プロジェクトの種別/状態/カスタム属性を解決して表示・保存
  fetch    種別と状態で課題を取得して factcheck_inbox/ に保存
  show     1件の課題を節分解し、設計書解決と引用検証の結果を表示
  sheet    正本設計書HTMLからシートを抽出（一覧 / 抽出 / 検索）
  record   判定とコメント本文を factcheck_verdicts/ に保存
  plan     反映予定（状態遷移・カスタム属性・コメント）を一覧表示
  apply    Backlog へ反映（--apply 指定時のみ書き込み）
  status   進捗集計
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import lib_design_doc as design
from lib_backlog import BacklogClient, BacklogError, pick_by_name

REPORT_ROOT = Path(__file__).resolve().parent
DOCS_ROOT = REPORT_ROOT.parent
WORKSPACE_ROOT = DOCS_ROOT.parent

INBOX_DIR = REPORT_ROOT / "factcheck_inbox"
RAW_DIR = INBOX_DIR / "raw"
VERDICT_DIR = REPORT_ROOT / "factcheck_verdicts"
CONFIG_PATH = REPORT_ROOT / "factcheck_config.json"

DEFAULT_PROJECT = "ECCUBE_HARERUYA"
DEFAULT_ISSUE_TYPE = "未実装・実装乖離リスト"
# このプロジェクトの初期状態は「未対応」（id=1）。「未処理」という状態は存在しない。
DEFAULT_TARGET_STATUS = "未対応"
STATUS_FOR_FALSE_POSITIVE = "完了"
STATUS_FOR_SUSPECT = "処理中"
ANALYSIS_FIELD = "不具合解析結果"
ANALYSIS_VALUE_FALSE_POSITIVE = "誤検出（起票ミス）"

VERDICT_FALSE_POSITIVE = "FALSE_POSITIVE"
VERDICT_SUSPECT = "SUSPECT"
VERDICTS = (VERDICT_FALSE_POSITIVE, VERDICT_SUSPECT)

# 節見出しは既知のものだけを認識する。本文中の `# パスワード再発行` のような
# 行で誤分割しないため、行頭 # 全般では切らない。
SECTION_HEADINGS = (
    "基本情報",
    "再現手順",
    "期待される挙動",
    "現在の挙動",
    "根拠",
    "確認メモ",
    "補足情報",
    "備考",
)
_HEADING_RE = re.compile(
    r"^#{1,3}\s*(" + "|".join(map(re.escape, SECTION_HEADINGS)) + r")\s*(?:【[^】]*】)?\s*$"
)
_BASIC_FIELD_RE = re.compile(r"^\s*([^:：\s][^:：]{0,20})\s*[:：]\s*(.+?)\s*$")
_FENCE_RE = re.compile(r"^\s*```")

_SOURCE_EXT = (
    ".php", ".twig", ".yaml", ".yml", ".js", ".ts", ".json", ".md", ".html", ".csv", ".sql", ".py",
)
# 正規表現の選択肢は先頭一致優先なので長い拡張子を先に並べる。
# 逆順だと `.json` が `.js` にマッチして存在しないパスを作り出す。
_EXT_ALT = "|".join(re.escape(e) for e in sorted(_SOURCE_EXT, key=len, reverse=True))
_CITATION_RE = re.compile(
    r"(?<![\w/.-])((?:[\w.-]+/)+[\w.\-()（）]+?(?:" + _EXT_ALT + r"))"
    r"(?::(\d+)(?:\s*[-–~]\s*(\d+))?)?"
)
# ディレクトリを伴わない `M15_deck_management_basedesign.md:341` 形式。
# 行番号付きのときだけ拾う（無条件だと本文中の語をパスと誤認する）。
_BARE_CITATION_RE = re.compile(
    r"(?<![\w/.-])([\w.\-()（）]+?(?:" + _EXT_ALT + r")):(\d+)(?:\s*[-–~]\s*(\d+))?"
)
_BARE_SEARCH_DIRS = (
    "ec-cube-enterprise/.cursor/docs/MDfile",
    "hareruya-design-docs/excel_to_html/output",
)


# ---------------------------------------------------------------- utilities


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def norm(value: str) -> str:
    return unicodedata.normalize("NFKC", str(value or "")).replace(" ", "").replace("　", "")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def die(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


# ------------------------------------------------------------------ parsing


def split_sections(body: str) -> dict[str, str]:
    """課題本文を既知の節へ分解する。コードフェンス内の行は見出し扱いしない。"""
    sections: dict[str, list[str]] = {"_preamble": []}
    current = "_preamble"
    in_fence = False
    for line in (body or "").replace("\r\n", "\n").split("\n"):
        if _FENCE_RE.match(line):
            in_fence = not in_fence
            sections[current].append(line)
            continue
        if not in_fence:
            match = _HEADING_RE.match(line.strip())
            if match:
                current = match.group(1)
                sections.setdefault(current, [])
                continue
        sections[current].append(line)
    return {k: "\n".join(v).strip() for k, v in sections.items() if "\n".join(v).strip()}


def parse_basic_info(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for line in (text or "").splitlines():
        match = _BASIC_FIELD_RE.match(line)
        if match:
            fields[match.group(1).strip()] = match.group(2).strip()
    return fields


def _repo_roots() -> list[Path]:
    """パス解決の基点。ワークスペース直下のリポジトリを基準に書かれた引用に対応する。"""
    roots = [WORKSPACE_ROOT]
    for child in sorted(WORKSPACE_ROOT.iterdir()):
        if child.is_dir() and not child.name.startswith("."):
            roots.append(child)
    return roots


_REPO_ROOTS_CACHE: list[Path] | None = None


def safe_repo_path(raw: str) -> Path | None:
    """ワークスペース配下に収まる相対パスだけを許可する。

    入力は Backlog 本文（信頼できない）なので、絶対パスや脱出を弾く。
    実データの引用は基点が揺れる（ワークスペース基準・各リポジトリ基準・`../` 付き）ため
    既知の基点を順に試すが、解決結果は必ずワークスペース配下であることを検証する。
    存在しないパスを file_not_found と誤報すると判定を誤らせるので、ここは緩く探し
    「見つからない」は本当に見つからない場合だけにする。
    """
    global _REPO_ROOTS_CACHE
    if not raw or "://" in raw or Path(raw).is_absolute():
        return None
    stripped = re.sub(r"^(?:\.\./)+", "", raw)
    if re.match(r"^\d+/", stripped):  # `8080/api/...` のようなURL断片
        return None

    if _REPO_ROOTS_CACHE is None:
        _REPO_ROOTS_CACHE = _repo_roots()
    root = WORKSPACE_ROOT.resolve()

    for base in _REPO_ROOTS_CACHE:
        for candidate in dict.fromkeys([raw, stripped]):
            resolved = (base / candidate).resolve()
            try:
                resolved.relative_to(root)
            except ValueError:
                continue
            if resolved.is_file():
                return resolved

    # 実在しない場合は、脱出していない候補を返して file_not_found として扱う。
    resolved = (WORKSPACE_ROOT / stripped).resolve()
    try:
        resolved.relative_to(root)
    except ValueError:
        return None
    return resolved


def _locate_bare_file(name: str) -> str | None:
    """ディレクトリなしで書かれた設計資料名を既知のディレクトリから探す。"""
    for directory in _BARE_SEARCH_DIRS:
        candidate = WORKSPACE_ROOT / directory / name
        if candidate.is_file():
            return str(candidate.relative_to(WORKSPACE_ROOT))
    return None


def extract_citations(body: str) -> list[dict[str, Any]]:
    """本文中の `path:line` / `path:start-end` 参照を重複なく抽出する。"""
    seen: set[tuple[str, int | None, int | None]] = set()
    citations: list[dict[str, Any]] = []
    text = body or ""

    for match in _CITATION_RE.finditer(text):
        path = match.group(1)
        start = int(match.group(2)) if match.group(2) else None
        end = int(match.group(3)) if match.group(3) else start
        key = (path, start, end)
        if key in seen:
            continue
        seen.add(key)
        citations.append({"path": path, "start": start, "end": end})

    for match in _BARE_CITATION_RE.finditer(text):
        name = match.group(1)
        if "/" in name:
            continue
        located = _locate_bare_file(name)
        if not located:
            continue
        start = int(match.group(2))
        end = int(match.group(3)) if match.group(3) else start
        key = (located, start, end)
        if key in seen:
            continue
        seen.add(key)
        citations.append({"path": located, "start": start, "end": end, "resolvedFrom": name})

    return citations


def extract_code_blocks(body: str) -> list[str]:
    blocks: list[str] = []
    buffer: list[str] = []
    in_fence = False
    for line in (body or "").replace("\r\n", "\n").split("\n"):
        if _FENCE_RE.match(line):
            if in_fence:
                blocks.append("\n".join(buffer))
                buffer = []
            in_fence = not in_fence
            continue
        if in_fence:
            buffer.append(line)
    return [b for b in blocks if b.strip()]


def verify_citations(citations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """引用の実在・行範囲を機械検証する。判定はしない。"""
    results: list[dict[str, Any]] = []
    for citation in citations:
        record = dict(citation)
        resolved = safe_repo_path(citation["path"])
        if resolved is None:
            # URL断片や絶対パス。引用として扱わない（乖離の証拠にも反証にもならない）。
            record.update(ok=False, reason="not_a_repo_path")
            results.append(record)
            continue
        if not resolved.is_file():
            # 「このファイルが存在しない」こと自体が未実装指摘の裏付けである場合がある。
            # 引用の壊れとは限らないので、判定側で文脈と併せて読むこと。
            record.update(ok=False, reason="file_not_found")
            results.append(record)
            continue
        try:
            lines = resolved.read_text(encoding="utf-8", errors="ignore").splitlines()
        except OSError as exc:
            record.update(ok=False, reason=f"io_error: {exc}")
            results.append(record)
            continue
        record["fileLines"] = len(lines)
        start, end = citation.get("start"), citation.get("end")
        if start is None:
            record.update(ok=True, reason="file_exists_no_line")
        elif start < 1 or (end or start) > len(lines):
            record.update(ok=False, reason="line_out_of_range")
        else:
            record.update(ok=True, reason="in_range")
            record["excerpt"] = "\n".join(lines[start - 1 : (end or start)])[:800]
        results.append(record)
    return results


def verify_quotes(blocks: list[str], citations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """引用コードが今も対象ファイルに存在するかを緩く確認する。

    チケット本文はフェンスと参照パスの対応が構造化されていないため、
    「どこかの引用ファイルに残っているか」までしか機械判定しない。
    残っていない場合は起票後に実装が変わった可能性を示すシグナルとして扱う。
    """
    haystacks: list[tuple[str, str]] = []
    for citation in citations:
        resolved = safe_repo_path(citation["path"])
        if resolved and resolved.is_file():
            haystacks.append((citation["path"], resolved.read_text(encoding="utf-8", errors="ignore")))

    results: list[dict[str, Any]] = []
    for index, block in enumerate(blocks):
        needles = sorted(
            (line.strip() for line in block.splitlines() if len(line.strip()) >= 20),
            key=len,
            reverse=True,
        )[:3]
        if not needles:
            continue
        found_in: list[str] = []
        for path, text in haystacks:
            if any(needle in text for needle in needles):
                found_in.append(path)
        results.append(
            {
                "blockIndex": index,
                "probe": needles[0][:120],
                "foundIn": found_in,
                "ok": bool(found_in),
            }
        )
    return results


def git_activity(citations: list[dict[str, Any]], since: str | None) -> list[dict[str, Any]]:
    """引用ファイルの起票日以降のコミットを列挙する。

    これは「引用が古い可能性」のヒントであって、乖離の有無の証明ではない。
    コミットがあっても引用箇所が変わったとは限らず、無くても起票時点と同一とは限らない。
    """
    if not since:
        return []
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    for citation in citations:
        path = citation["path"]
        if path in seen:
            continue
        seen.add(path)
        resolved = safe_repo_path(path)
        if resolved is None or not resolved.is_file():
            continue
        repo = resolved.parent
        while repo != WORKSPACE_ROOT and repo.parent != repo:
            if (repo / ".git").exists():
                break
            repo = repo.parent
        if not (repo / ".git").exists():
            continue
        try:
            out = subprocess.run(
                ["git", "-C", str(repo), "log", f"--since={since}", "--oneline", "--",
                 str(resolved.relative_to(repo))],
                capture_output=True, text=True, timeout=30, check=False,
            )
        except (OSError, subprocess.SubprocessError):
            continue
        commits = [c for c in out.stdout.splitlines() if c.strip()]
        results.append({"path": path, "repo": repo.name, "commitsSince": commits})
    return results


def build_record(issue: dict, comments: list[dict]) -> dict:
    body = issue.get("description") or ""
    sections = split_sections(body)
    basic = parse_basic_info(sections.get("基本情報", ""))
    citations = extract_citations(body)
    blocks = extract_code_blocks(body)
    created = issue.get("created")

    record = {
        "issueKey": issue.get("issueKey"),
        "issueId": issue.get("id"),
        "summary": issue.get("summary"),
        "issueType": (issue.get("issueType") or {}).get("name"),
        "issueTypeId": (issue.get("issueType") or {}).get("id"),
        "status": (issue.get("status") or {}).get("name"),
        "statusId": (issue.get("status") or {}).get("id"),
        "created": created,
        "updated": issue.get("updated"),
        "url": None,
        "basicInfo": basic,
        "sections": sections,
        "designBook": basic.get("設計書"),
        "feature": basic.get("機能"),
        "classification": basic.get("分類"),
        "issueCategory": basic.get("課題カテゴリ"),
        "citations": verify_citations(citations),
        "quotedBlocks": verify_quotes(blocks, citations),
        "gitActivity": git_activity(citations, created),
        "commentCount": len(comments),
        "comments": [
            {
                "id": c.get("id"),
                "created": c.get("created"),
                "createdUser": (c.get("createdUser") or {}).get("name"),
                "content": c.get("content"),
            }
            for c in comments
        ],
        "fetchedAt": now_iso(),
    }
    record["designResolution"] = resolve_design(record)
    return record


def resolve_design(record: dict) -> dict:
    """設計書名から正本HTMLとシート候補を解決する。到達できなければ理由を残す。"""
    name = record.get("designBook") or ""
    result: dict[str, Any] = {"requested": name, "alternates": design.alternate_sources(name)}
    if not name:
        result["error"] = "基本情報に『設計書』が無い"
        return result
    try:
        book = design.resolve_book(name)
    except design.DesignDocError as exc:
        result["error"] = str(exc)
        return result

    result["book"] = str(book.relative_to(WORKSPACE_ROOT))
    try:
        sheets = design.sheet_index(book)
    except design.DesignDocError as exc:
        result["error"] = str(exc)
        return result

    result["sheetCount"] = len(sheets)
    feature = norm(record.get("feature") or "")
    candidates = []
    for sheet in sheets:
        title = norm(sheet.title)
        score = 0
        if feature and title == feature:
            score = 100
        elif feature and (feature in title or title in feature):
            score = 60
        if score:
            candidates.append({"sheetId": sheet.sheet_id, "title": sheet.title, "score": score})
    candidates.sort(key=lambda c: -c["score"])
    result["sheetCandidates"] = candidates[:10]
    result["allSheets"] = [{"sheetId": s.sheet_id, "title": s.title} for s in sheets]
    return result


# ------------------------------------------------------------------- config


def resolve_project_meta(client: BacklogClient, project_key: str) -> dict:
    project = client.get_project(project_key)
    issue_types = client.get_issue_types(project_key)
    statuses = client.get_statuses(project_key)
    custom_fields = client.get_custom_fields(project_key)
    return {
        "projectKey": project_key,
        "projectId": project.get("id"),
        "space": client.space,
        "issueTypes": [{"id": i["id"], "name": i["name"]} for i in issue_types],
        "statuses": [{"id": s["id"], "name": s["name"]} for s in statuses],
        "customFields": [
            {
                "id": f["id"],
                "name": f["name"],
                "typeId": f.get("typeId"),
                "items": [{"id": it["id"], "name": it["name"]} for it in (f.get("items") or [])],
            }
            for f in custom_fields
        ],
        "resolvedAt": now_iso(),
    }


def load_config() -> dict:
    if not CONFIG_PATH.is_file():
        die(f"{CONFIG_PATH.name} が無い。先に `meta` を実行すること")
    return read_json(CONFIG_PATH)


def find_status_id(config: dict, name: str) -> int:
    return pick_by_name(config["statuses"], name, label="状態")["id"]


def find_analysis_field(config: dict) -> dict:
    return pick_by_name(config["customFields"], ANALYSIS_FIELD, label="カスタム属性")


# ----------------------------------------------------------------- commands


def cmd_meta(args: argparse.Namespace) -> int:
    client = BacklogClient.from_environment()
    meta = resolve_project_meta(client, args.project)
    write_json(CONFIG_PATH, meta)
    print(f"space={meta['space']} project={meta['projectKey']} id={meta['projectId']}")
    print("\n[種別]")
    for item in meta["issueTypes"]:
        print(f"  {item['id']}\t{item['name']}")
    print("\n[状態]")
    for item in meta["statuses"]:
        print(f"  {item['id']}\t{item['name']}")
    print("\n[カスタム属性]")
    for field in meta["customFields"]:
        print(f"  {field['id']}\t{field['name']}\t(typeId={field['typeId']})")
        for item in field["items"]:
            print(f"      - {item['id']}\t{item['name']}")
    print(f"\n保存: {CONFIG_PATH}")
    return 0


def cmd_fetch(args: argparse.Namespace) -> int:
    config = load_config()
    client = BacklogClient.from_environment()

    issue_type = pick_by_name(config["issueTypes"], args.issue_type, label="種別")
    status = pick_by_name(config["statuses"], args.status, label="状態")
    print(f"種別={issue_type['name']}(id={issue_type['id']}) 状態={status['name']}(id={status['id']})")

    issues = client.list_issues(
        project_id=config["projectId"],
        issue_type_ids=[issue_type["id"]],
        status_ids=[status["id"]],
        limit=args.limit,
    )
    print(f"該当 {len(issues)} 件")

    for issue in issues:
        key = issue["issueKey"]
        detail = client.get_issue(key)
        comments = client.get_comments(key)
        write_json(RAW_DIR / f"{key}.json", {"issue": detail, "comments": comments})
        record = build_record(detail, comments)
        record["url"] = f"https://{client.space}/view/{key}"
        write_json(INBOX_DIR / f"{key}.json", record)
        design_state = record["designResolution"].get("book") or record["designResolution"].get("error", "")
        print(f"  {key}\t{issue.get('summary', '')[:60]}\t設計書={design_state}")
    return 0


def cmd_show(args: argparse.Namespace) -> int:
    path = INBOX_DIR / f"{args.issue}.json"
    if not path.is_file():
        die(f"{path} が無い。先に fetch すること")
    record = read_json(path)

    print(f"# {record['issueKey']} {record['summary']}")
    print(f"URL: {record.get('url')}")
    print(f"種別: {record.get('issueType')} / 状態: {record.get('status')} / 起票: {record.get('created')}")
    print("\n## 基本情報")
    for key, value in (record.get("basicInfo") or {}).items():
        print(f"  {key}: {value}")

    resolution = record.get("designResolution") or {}
    print("\n## 設計書の解決")
    if resolution.get("error"):
        print(f"  未解決: {resolution['error'][:400]}")
    else:
        print(f"  正本HTML: {resolution.get('book')}  (シート {resolution.get('sheetCount')} 件)")
        for candidate in resolution.get("sheetCandidates") or []:
            print(f"    候補 {candidate['sheetId']}\t{candidate['title']}\t score={candidate['score']}")
        if not resolution.get("sheetCandidates"):
            print("    機能名と一致するシート候補なし → sheet --list で目視選択すること")
    alternates = resolution.get("alternates") or {}
    print(f"  別系統: 分割シート {len(alternates.get('splitSheets') or [])} 件 / MD {len(alternates.get('markdown') or [])} 件")

    print("\n## 引用の検証")
    print("  ※ 不在 は引用の壊れとは限らない。『そのファイルが無い』こと自体が未実装指摘の")
    print("     裏付けである場合がある。範囲外 のみが起票後に実装が動いた強いシグナル。")
    citations = record.get("citations") or []
    if not citations:
        print("  引用なし")
    labels = {
        "in_range": "実在",
        "file_exists_no_line": "実在",
        "file_not_found": "不在",
        "line_out_of_range": "範囲外",
        "not_a_repo_path": "対象外",
    }
    for citation in citations:
        label = labels.get(citation.get("reason") or "", citation.get("reason") or "")
        span = f":{citation['start']}-{citation['end']}" if citation.get("start") else ""
        print(f"  [{label}]\t{citation['path']}{span}")

    quotes = record.get("quotedBlocks") or []
    if quotes:
        print("\n## 引用コードの残存")
        for quote in quotes:
            mark = "OK " if quote.get("ok") else "NG "
            print(f"  {mark}block#{quote['blockIndex']}\t{quote['probe'][:80]}")

    activity = [a for a in (record.get("gitActivity") or []) if a.get("commitsSince")]
    if activity:
        print("\n## 起票後のコミット（引用の鮮度ヒント。乖離の証明ではない）")
        for entry in activity:
            print(f"  {entry['path']} ({entry['repo']}): {len(entry['commitsSince'])} commits")
            for commit in entry["commitsSince"][:5]:
                print(f"      {commit}")

    print("\n## 本文")
    for name, text in (record.get("sections") or {}).items():
        if name == "_preamble" and not text.strip():
            continue
        print(f"\n### {name}")
        print(text)

    if record.get("comments"):
        print("\n## 既存コメント")
        for comment in record["comments"]:
            print(f"\n--- {comment['created']} {comment['createdUser']}")
            print(comment.get("content") or "")
    return 0


def cmd_sheet(args: argparse.Namespace) -> int:
    try:
        book = design.resolve_book(args.book)
    except design.DesignDocError as exc:
        die(str(exc))
        return 1

    if args.list:
        for sheet in design.sheet_index(book):
            print(f"{sheet.sheet_id}\t{sheet.title}")
        return 0

    if args.grep:
        hits = design.grep_book(book, args.grep, context=args.context)
        if not hits:
            print(f"該当なし: {args.grep!r} in {book.name}", file=sys.stderr)
            return 2
        for sheet, lines in hits:
            print(f"=== {sheet.sheet_id}\t{sheet.title}")
            for line in lines:
                print(f"  {line}")
        return 0

    try:
        sheet = design.find_sheet(book, sheet_id=args.sheet_id, title=args.sheet_name)
    except design.DesignDocError as exc:
        die(str(exc))
        return 1

    text = design.sheet_text(book, sheet)
    print(f"=== {book.name} / {sheet.sheet_id} / {sheet.title}")
    if args.max_chars and len(text) > args.max_chars:
        print(text[: args.max_chars])
        print(f"... [{len(text) - args.max_chars} 文字省略。--max-chars 0 で全文]", file=sys.stderr)
    else:
        print(text)
    return 0


def cmd_record(args: argparse.Namespace) -> int:
    inbox = INBOX_DIR / f"{args.issue}.json"
    if not inbox.is_file():
        die(f"{inbox} が無い。先に fetch すること")
    comment = Path(args.comment_file).read_text(encoding="utf-8").strip()
    if not comment:
        die("コメント本文が空")
    verdict = {
        "issueKey": args.issue,
        "verdict": args.verdict,
        "summary": args.summary,
        "comment": comment,
        "recordedAt": now_iso(),
        "applied": False,
    }
    write_json(VERDICT_DIR / f"{args.issue}.json", verdict)
    print(f"記録: {VERDICT_DIR / (args.issue + '.json')} verdict={args.verdict}")
    return 0


def planned_change(config: dict, verdict: dict) -> dict:
    if verdict["verdict"] == VERDICT_FALSE_POSITIVE:
        field = find_analysis_field(config)
        item = pick_by_name(field["items"], ANALYSIS_VALUE_FALSE_POSITIVE, label=f"{ANALYSIS_FIELD}の選択肢")
        return {
            "statusName": STATUS_FOR_FALSE_POSITIVE,
            "statusId": find_status_id(config, STATUS_FOR_FALSE_POSITIVE),
            "customFields": {field["id"]: item["id"]},
            "customFieldLabel": f"{field['name']}={item['name']}",
        }
    return {
        "statusName": STATUS_FOR_SUSPECT,
        "statusId": find_status_id(config, STATUS_FOR_SUSPECT),
        "customFields": {},
        "customFieldLabel": "(変更なし)",
    }


def load_verdicts(issue: str | None) -> list[dict]:
    if issue:
        path = VERDICT_DIR / f"{issue}.json"
        if not path.is_file():
            die(f"{path} が無い。先に record すること")
        return [read_json(path)]
    return [read_json(p) for p in sorted(VERDICT_DIR.glob("*.json"))]


def cmd_plan(args: argparse.Namespace) -> int:
    config = load_config()
    pending = [v for v in load_verdicts(args.issue) if not v.get("applied")]
    if not pending:
        print("反映待ちなし")
        return 0
    for verdict in pending:
        change = planned_change(config, verdict)
        print("=" * 72)
        print(f"{verdict['issueKey']}  判定={verdict['verdict']}")
        print(f"  状態: → {change['statusName']} (id={change['statusId']})")
        print(f"  カスタム属性: {change['customFieldLabel']}")
        print("  コメント:")
        for line in verdict["comment"].splitlines():
            print(f"    {line}")
    print("=" * 72)
    print(f"{len(pending)} 件が反映待ち。実際に反映するには apply --apply を指定すること。")
    return 0


def cmd_apply(args: argparse.Namespace) -> int:
    config = load_config()
    pending = [v for v in load_verdicts(args.issue) if not v.get("applied")]
    if not pending:
        print("反映待ちなし")
        return 0

    if not args.apply:
        print("dry-run（--apply 未指定のため書き込みは行わない）\n")
        return cmd_plan(args)

    client = BacklogClient.from_environment(allow_write=True)
    for verdict in pending:
        change = planned_change(config, verdict)
        key = verdict["issueKey"]
        print(f"反映: {key} → {change['statusName']} / {change['customFieldLabel']}")
        try:
            response = client.update_issue(
                key,
                status_id=change["statusId"],
                comment=verdict["comment"],
                custom_fields=change["customFields"] or None,
            )
        except (BacklogError, PermissionError) as exc:
            print(f"  失敗: {exc}", file=sys.stderr)
            continue
        verdict["applied"] = True
        verdict["appliedAt"] = now_iso()
        verdict["appliedStatus"] = (response or {}).get("status", {}).get("name")
        write_json(VERDICT_DIR / f"{key}.json", verdict)
        print(f"  完了: 状態={verdict['appliedStatus']}")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    inbox = sorted(INBOX_DIR.glob("*.json"))
    verdicts = {p.stem: read_json(p) for p in sorted(VERDICT_DIR.glob("*.json"))}
    print(f"取得済み: {len(inbox)} 件")
    counts = {"未判定": 0, VERDICT_FALSE_POSITIVE: 0, VERDICT_SUSPECT: 0, "反映済み": 0}
    for path in inbox:
        verdict = verdicts.get(path.stem)
        if not verdict:
            counts["未判定"] += 1
            continue
        counts[verdict["verdict"]] = counts.get(verdict["verdict"], 0) + 1
        if verdict.get("applied"):
            counts["反映済み"] += 1
    for key, value in counts.items():
        print(f"  {key}: {value}")
    for path in inbox:
        verdict = verdicts.get(path.stem)
        state = "未判定" if not verdict else (
            f"{verdict['verdict']}{'(反映済)' if verdict.get('applied') else ''}"
        )
        record = read_json(path)
        print(f"  {path.stem}\t{state}\t{(record.get('summary') or '')[:50]}")
    return 0


# -------------------------------------------------------------------- entry


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    meta = sub.add_parser("meta", help="プロジェクトの種別/状態/カスタム属性を解決")
    meta.add_argument("--project", default=DEFAULT_PROJECT)
    meta.set_defaults(func=cmd_meta)

    fetch = sub.add_parser("fetch", help="種別と状態で課題を取得")
    fetch.add_argument("--issue-type", default=DEFAULT_ISSUE_TYPE)
    fetch.add_argument("--status", default=DEFAULT_TARGET_STATUS)
    fetch.add_argument("--limit", type=int, default=None)
    fetch.set_defaults(func=cmd_fetch)

    show = sub.add_parser("show", help="1件の課題を節分解・引用検証つきで表示")
    show.add_argument("--issue", required=True)
    show.set_defaults(func=cmd_show)

    sheet = sub.add_parser("sheet", help="正本設計書HTMLのシート抽出")
    sheet.add_argument("--book", required=True, help="設計書名 or 書籍番号（例: 0212）")
    sheet.add_argument("--list", action="store_true", help="シート一覧")
    sheet.add_argument("--sheet-id", help="sheet-6 のようなID")
    sheet.add_argument("--sheet-name", help="シート見出し")
    sheet.add_argument("--grep", help="シート単位の正規表現検索")
    sheet.add_argument("--context", type=int, default=0)
    sheet.add_argument("--max-chars", type=int, default=20000, help="0 で無制限")
    sheet.set_defaults(func=cmd_sheet)

    record = sub.add_parser("record", help="判定とコメント本文を保存")
    record.add_argument("--issue", required=True)
    record.add_argument("--verdict", required=True, choices=VERDICTS)
    record.add_argument("--summary", default="")
    record.add_argument("--comment-file", required=True)
    record.set_defaults(func=cmd_record)

    plan = sub.add_parser("plan", help="反映予定を表示")
    plan.add_argument("--issue")
    plan.set_defaults(func=cmd_plan)

    apply_cmd = sub.add_parser("apply", help="Backlog へ反映")
    apply_cmd.add_argument("--issue")
    apply_cmd.add_argument("--apply", action="store_true", help="実際に書き込む（未指定なら dry-run）")
    apply_cmd.set_defaults(func=cmd_apply)

    status = sub.add_parser("status", help="進捗集計")
    status.set_defaults(func=cmd_status)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except (BacklogError, design.DesignDocError) as exc:
        die(str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
