#!/usr/bin/env python3
"""成果物マップ（サイドバー）を全HTML閲覧版で統一更新する。"""

from __future__ import annotations

import os
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]

ARTIFACT_CSS = """.artifact-map { margin: 0 0 20px; padding-bottom: 18px; border-bottom: 1px solid var(--line-soft, #EBE2D3); }
.artifact-map-root { margin: 0; padding: 0; border: none; }
.artifact-map-title { margin: 0 0 10px; padding: 0; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; border: none; }
.artifact-map-root:not([open]) > summary.artifact-map-title { margin-bottom: 0; }
.artifact-map-root > summary.artifact-map-title { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 7px; }
.artifact-map-root > summary.artifact-map-title::-webkit-details-marker { display: none; }
.artifact-map-rail { margin: 0; padding: 0 0 0 12px; border-left: 1px solid var(--line-soft, #EBE2D3); }
.artifact-map summary.artifact-map-title::before,
.artifact-map details > summary::before { content: ""; display: block; flex: none; width: 6px; height: 6px; background: var(--muted); clip-path: polygon(0 18%, 100% 50%, 0 82%); transform: rotate(0deg); transform-origin: center; transition: transform 0.15s ease; }
.artifact-map-root[open] > summary.artifact-map-title::before,
.artifact-map details[open] > summary::before { transform: rotate(90deg); }
.artifact-map-group { margin: 0 0 16px; padding: 0; border: none; }
.artifact-map-group:last-child { margin-bottom: 0; }
.artifact-map-label { margin: 0 0 4px; padding: 0; color: var(--text); font-size: 13px; font-weight: 600; line-height: 1.45; border: none; }
.artifact-map-body { margin: 0; padding: 0; border: none; }
.artifact-map-body > ul { margin: 0; padding: 0; list-style: none; }
.artifact-map-body li { margin: 6px 0; font-size: 13px; line-height: 1.45; }
.artifact-map-body > details { margin: 6px 0 0; padding: 0; border: none; }
.artifact-map details > summary { cursor: pointer; margin: 0 0 4px; padding: 0; color: var(--muted); font-size: 13px; font-weight: 500; list-style: none; display: flex; align-items: center; gap: 7px; }
.artifact-map details > summary::-webkit-details-marker { display: none; }
.artifact-map-body > details > ul { margin: 0; padding: 0 0 0 18px; list-style: none; }
.artifact-map details li { margin: 6px 0; }
.artifact-map a { display: block; position: relative; padding: 0; color: var(--muted); font-weight: 400; text-decoration: none; }
.artifact-map a:hover { color: var(--text); }
.artifact-map a[aria-current="page"] { color: var(--accent); font-weight: 600; }
.artifact-map-body > ul a[aria-current="page"]::before { content: ""; position: absolute; left: -13px; top: 0.15em; bottom: 0.15em; width: 2px; background: var(--accent); }
.artifact-map details ul a[aria-current="page"]::before { content: ""; position: absolute; left: -31px; top: 0.15em; bottom: 0.15em; width: 2px; background: var(--accent); }
.sidebar-title { margin: 0 0 14px; padding: 0; color: var(--text); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; }"""

DOCS: list[tuple[str, str]] = [
    ("アプリケーション基本設計書/アプリケーション基本設計書.html", "アプリケーション基本設計書"),
    ("機能間依存関係定義書.html", "機能間依存関係定義書"),
    ("機能仕様/機能仕様一覧.html", "機能仕様書"),
    ("機能仕様/ユーザー管理.html", "ユーザー管理"),
    ("UI/画面一覧.html", "画面設計書"),
    (
        "UI/画面項目定義/ユーザー管理/ユーザー一覧_画面項目定義.html",
        "ユーザー一覧",
    ),
    (
        "UI/画面項目定義/ユーザー管理/ユーザー登録_画面項目定義.html",
        "ユーザー登録",
    ),
    (
        "UI/画面項目定義/ユーザー管理/ユーザー詳細_画面項目定義.html",
        "ユーザー詳細",
    ),
    (
        "UI/画面項目定義/ユーザー管理/ユーザー編集_画面項目定義.html",
        "ユーザー編集",
    ),
    (
        "UI/画面項目定義/ユーザー管理/パスワード変更初期化_画面項目定義.html",
        "パスワード変更初期化",
    ),
    ("DB/データベース設計書.html", "データベース設計書"),
    ("DB/tables/アカウント.html", "アカウント"),
    ("API/swagger.html", "わりヨシ API"),
    (
        "API/外部インターフェース仕様書/外部インターフェース仕様書.html",
        "外部インターフェース仕様書",
    ),
    (
        "API/外部インターフェース仕様書/IF-USER-001_ユーザー情報同期.html",
        "ユーザー情報同期",
    ),
    ("アーキテクチャ/ロギング/ログ管理仕様書.html", "ログ管理仕様書"),
    ("帳票/帳票一覧.html", "帳票設計書"),
    (
        "帳票/ユーザー一覧帳票/ユーザー一覧帳票_帳票設計書.html",
        "ユーザー一覧帳票",
    ),
]

SCREEN_ITEMS = [d for d, _ in DOCS if "画面項目定義/" in d]
TABLE_DEFS = [d for d, _ in DOCS if "/tables/" in d]
FUNCTION_SPECS = ["機能仕様/ユーザー管理.html"]
EXTERNAL_IF_DEFS = [
    "API/外部インターフェース仕様書/IF-USER-001_ユーザー情報同期.html"
]
REPORT_DEFS = ["帳票/ユーザー一覧帳票/ユーザー一覧帳票_帳票設計書.html"]
DOC_BY_PATH = dict(DOCS)


def pick(*paths: str) -> list[tuple[str, str]]:
    return [(path, DOC_BY_PATH[path]) for path in paths]


def href(from_file: Path, to_rel: str) -> str:
    from_dir = from_file.parent
    target = ROOT / to_rel
    rel_posix = Path(os.path.relpath(target, start=from_dir)).as_posix()
    return "/".join(quote(part) for part in rel_posix.split("/"))


def link(from_file: Path, to_rel: str, label: str, current_rel: str) -> str:
    current = aria = ""
    if to_rel == current_rel:
        current = ' aria-current="page"'
    return f'<li><a href="{href(from_file, to_rel)}"{current}>{label}</a></li>'


def ul(from_file: Path, items: list[tuple[str, str]], current_rel: str) -> str:
    lines = [link(from_file, rel, label, current_rel) for rel, label in items]
    return "<ul>\n          " + "\n          ".join(lines) + "\n        </ul>"


def details(
    from_file: Path,
    summary: str,
    items: list[tuple[str, str]],
    current_rel: str,
    *,
    open_section: bool,
) -> str:
    open_attr = " open" if open_section else ""
    body = ul(from_file, items, current_rel).replace("<ul>", "<ul>", 1)
    return (
        f'        <details{open_attr}>\n'
        f"          <summary>{summary}</summary>\n"
        f"          {body}\n"
        f"        </details>"
    )


def group(label: str, body: str) -> str:
    return (
        f'        <div class="artifact-map-group">\n'
        f'          <p class="artifact-map-label">{label}</p>\n'
        f'          <div class="artifact-map-body">\n'
        f"{body}\n"
        f"          </div>\n"
        f"        </div>"
    )


def build_nav(from_file: Path, current_rel: str) -> str:
    sections: list[str] = []

    sections.append(
        group(
            "全体設計",
            ul(
                from_file,
                pick(
                    "アプリケーション基本設計書/アプリケーション基本設計書.html",
                    "機能間依存関係定義書.html",
                ),
                current_rel,
            ),
        )
    )

    function_body = ul(from_file, pick("機能仕様/機能仕様一覧.html"), current_rel)
    function_body += "\n" + details(
        from_file,
        "個別機能仕様",
        [(rel, label) for rel, label in DOCS if rel in FUNCTION_SPECS],
        current_rel,
        open_section=current_rel in FUNCTION_SPECS,
    )
    sections.append(group("機能仕様", function_body))

    screen_body = ul(from_file, pick("UI/画面一覧.html"), current_rel)
    screen_body += "\n" + details(
        from_file,
        "個別画面設計",
        [(rel, label) for rel, label in DOCS if rel in SCREEN_ITEMS],
        current_rel,
        open_section="画面項目定義/" in current_rel,
    )
    sections.append(group("画面設計", screen_body))

    db_body = ul(from_file, pick("DB/データベース設計書.html"), current_rel)
    db_body += "\n" + details(
        from_file,
        "テーブル定義",
        [(rel, label) for rel, label in DOCS if rel in TABLE_DEFS],
        current_rel,
        open_section="/tables/" in current_rel,
    )
    sections.append(group("DB設計", db_body))

    sections.append(
        group(
            "API",
            ul(from_file, pick("API/swagger.html"), current_rel),
        )
    )

    external_if_body = ul(
        from_file,
        pick("API/外部インターフェース仕様書/外部インターフェース仕様書.html"),
        current_rel,
    )
    external_if_body += "\n" + details(
        from_file,
        "個別外部IF",
        [(rel, label) for rel, label in DOCS if rel in EXTERNAL_IF_DEFS],
        current_rel,
        open_section=current_rel in EXTERNAL_IF_DEFS,
    )
    sections.append(group("外部IF", external_if_body))

    sections.append(
        group(
            "ログ管理",
            ul(from_file, pick("アーキテクチャ/ロギング/ログ管理仕様書.html"), current_rel),
        )
    )

    report_body = ul(from_file, pick("帳票/帳票一覧.html"), current_rel)
    report_body += "\n" + details(
        from_file,
        "個別帳票設計",
        [(rel, label) for rel, label in DOCS if rel in REPORT_DEFS],
        current_rel,
        open_section=current_rel in REPORT_DEFS,
    )
    sections.append(group("帳票設計", report_body))

    inner = "\n\n".join(sections)
    return (
        f'      <nav class="artifact-map" aria-label="わりヨシ基本設計">\n'
        f'        <details class="artifact-map-root" open>\n'
        f'          <summary class="artifact-map-title">わりヨシ基本設計</summary>\n'
        f'          <div class="artifact-map-rail">\n'
        f"{inner}\n"
        f"          </div>\n"
        f"        </details>\n"
        f"      </nav>"
    )


def replace_css(text: str) -> str:
    pattern = re.compile(
        r"\.artifact-map \{.*?\.sidebar-title \{.*?\}|"
        r"\.artifact-map \{.*?\.artifact-map a\[aria-current=\"page\"\].*?\}",
        re.S,
    )
    if not pattern.search(text):
        raise ValueError("artifact-map CSS block not found")
    return pattern.sub(ARTIFACT_CSS, text, count=1)


def replace_nav(text: str, nav: str) -> str:
    pattern = re.compile(
        r"<nav class=\"artifact-map\" aria-label=\"わりヨシ基本設計\">.*?</nav>",
        re.S,
    )
    if not pattern.search(text):
        raise ValueError("artifact-map nav not found")
    return pattern.sub(nav, text, count=1)


def main() -> None:
    html_files = sorted(ROOT.rglob("*.html"))
    for path in html_files:
        if "_scripts" in path.parts:
            continue
        current_rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8")
        text = replace_css(text)
        text = replace_nav(text, build_nav(path, current_rel))
        path.write_text(text, encoding="utf-8")
        print("updated", current_rel)


if __name__ == "__main__":
    main()