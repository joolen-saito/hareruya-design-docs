#!/usr/bin/env python3
"""背景色・ページシェル（サイドバー位置）を全HTML閲覧版で統一する。"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

DOC_SHELL_CSS = """/* doc-shell */
*, *::before, *::after { box-sizing: border-box; }
.page { display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); gap: 30px; max-width: 1800px; margin: 0 auto; padding: 30px 28px 64px; }
.sidebar { position: sticky; top: 20px; align-self: start; max-height: calc(100vh - 40px); overflow-y: auto; overscroll-behavior: contain; padding: 0 12px 0 0; }
main.doc-content, .doc-content { min-width: 0; max-width: none; margin: 0; padding: 0; }
main:not(.doc-content) { max-width: none; margin: 0; padding: 0; }
@media (max-width: 900px) {
  .page { display: block; padding: 16px; }
  .sidebar { position: static; max-height: none; overflow: visible; margin-bottom: 16px; }
}"""

DOC_SHELL_PATTERN = re.compile(r"/\* doc-shell \*/.*?(?=\n(?:\.artifact-map|</style>))", re.S)

LEGACY_MAIN_RULE = re.compile(
    r"\n\s*main\s*\{\s*"
    r"(?:max-width:[^;]+;\s*)?"
    r"(?:margin:[^;]+;\s*)?"
    r"(?:padding:[^;]+;\s*)?"
    r"\}\s*",
    re.S,
)


def normalize_background(text: str) -> str:
    text = text.replace("--bg: #F4EFE6;", "--bg: #FFFFFF;")
    text = text.replace("--bg:#f4efe6;", "--bg:#ffffff;")
    return text


def inject_doc_shell(text: str) -> str:
    if DOC_SHELL_PATTERN.search(text):
        return DOC_SHELL_PATTERN.sub(DOC_SHELL_CSS + "\n", text, count=1)

    marker = "\n.artifact-map {"
    if marker in text:
        return text.replace(marker, "\n" + DOC_SHELL_CSS + marker, 1)

    return text.replace("</style>", DOC_SHELL_CSS + "\n  </style>", 1)


def update_text(text: str) -> tuple[str, bool]:
    original = text
    text = normalize_background(text)
    text = LEGACY_MAIN_RULE.sub("\n", text)
    text = inject_doc_shell(text)
    return text, text != original


def main() -> None:
    for path in sorted(ROOT.rglob("*.html")):
        if "_scripts" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        updated, changed = update_text(text)
        if changed:
            path.write_text(updated, encoding="utf-8")
            print("updated", path.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()