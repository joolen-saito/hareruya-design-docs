#!/usr/bin/env python3
"""論理名対応表（e2e/config/logical-names.tsv）を既存台帳から決定的に生成する。

翻訳キー（物理名）→ メッセージID・画面上の文言（論理名）は、
`message_inventory/` の3ファイルの結合だけで決まる。推測で論理名を作らない。

  raw_messages.jsonl : 抽出した1メッセージ = 翻訳キー + file:line
  id_map.tsv         : file:line → メッセージID
  MESSAGE_LIST.tsv   : メッセージID → 機能ID・画面上の文言

セッションキー・ルート名・DB物理名は、この結合では決まらないため自動生成しない。
必要になった時点で `出典` 付きの行を人手（またはレビュー済みの調査結果）で追記する。
生成器は既存の手書き行を保持し、翻訳キー由来の行だけを再生成する。

  python3 .cursor/skills/logical-naming/scripts/build_logical_name_map.py --repo .
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HEADER = ["物理名", "種別", "論理名", "機能ID", "出典", "状態"]
# 翻訳キーの形（英小文字の名前空間をドットで連ねたもの）。
# 抽出元には生の文言（"This value should not be blank."）も混ざるため、形で弾く。
KEY_RE = re.compile(r"^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+$")
KIND_MESSAGE = "メッセージキー"
LEDGER_RELPATH = Path("e2e/config/logical-names.tsv")
NOTE = (
    "# 物理名→論理名の対応表。[[logical-naming]] の正本データ。\n"
    "# メッセージキー行は build_logical_name_map.py が message_inventory から再生成する（手編集しない）。\n"
    "# セッションキー・ルート名・DB物理名の行は出典付きで追記する（状態=要確認 のまま使わない）。\n"
)


def load_message_rows(repo: Path) -> list[list[str]]:
    inventory = repo / "message_inventory"
    raw_path = inventory / "raw_messages.jsonl"
    id_map_path = inventory / "id_map.tsv"
    list_path = inventory / "MESSAGE_LIST.tsv"
    for path in (raw_path, id_map_path, list_path):
        if not path.exists():
            raise SystemExit(f"入力が無い: {path}")

    # file:line → メッセージID
    id_by_pos: dict[tuple[str, int], str] = {}
    for line in id_map_path.read_text(encoding="utf-8").splitlines():
        if not line:
            continue
        key, msg_id = line.split("\t")
        parts = key.split("|")
        id_by_pos[(parts[1], int(parts[2]))] = msg_id

    # メッセージID → (機能ID, 画面上の文言)
    detail_by_id: dict[str, tuple[str, str]] = {}
    lines = list_path.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    idx_id = header.index("メッセージID")
    idx_fid = header.index("機能ID")
    idx_text = header.index("画面上の文言")
    for line in lines[1:]:
        cells = line.split("\t")
        if len(cells) <= max(idx_id, idx_fid, idx_text):
            continue
        detail_by_id[cells[idx_id]] = (cells[idx_fid], cells[idx_text])

    rows: dict[tuple[str, str], list[str]] = {}
    for line in raw_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        entry = json.loads(line)
        key = entry.get("key")
        if not key or not KEY_RE.match(key):
            continue
        msg_id = id_by_pos.get((entry.get("file", ""), int(entry.get("line", 0))))
        if not msg_id:
            continue
        fid, text = detail_by_id.get(msg_id, ("", entry.get("resolved") or ""))
        text = " ".join(text.split())
        if not text:
            # 文言が取れないものは論理名を作れない。捏造せず落とす。
            continue
        if KEY_RE.match(text):
            # 画面上の文言が翻訳キーのまま＝キー未定義。論理名に物理名を混ぜず、要確認で出す。
            logical = f"{msg_id}（表示文言が未定義・要実機確認）"
            status = "要確認"
        else:
            logical = f"{msg_id}「{text}」"
            status = "確定"
        evidence = f"{entry.get('file', '')}:{entry.get('line', '')}"
        rows[(key, msg_id)] = [key, KIND_MESSAGE, logical, fid, evidence, status]
    return [rows[k] for k in sorted(rows)]


LOCALE_RELPATH = "src/Eccube/Resource/locale/messages.ja.yaml"
# 翻訳キーが使われている資産。ここに出てくるキーだけを対応表へ載せる（全5千件は載せない）。
KEY_SCAN_ROOTS = ("functions", "integration_test", "scenario_test", "e2e")
KEY_SCAN_SUFFIXES = {".md", ".tsv", ".ts", ".json"}
KEY_IN_TEXT_RE = re.compile(
    r"(?<![0-9A-Za-z_.\-/])(?:eccube|admin|front|api|plg|mypage|shopping)"
    r"(?:\.[a-z0-9_]+){2,}(?![0-9A-Za-z_.\-/])"
)


def load_locale_rows(repo: Path, ee_root: Path) -> list[list[str]]:
    """messages.ja.yaml から「使われている翻訳キー→表示文言」の行を作る。

    messages.ja.yaml はドット付きキーが1行1件で並ぶ平坦な構造なので、
    キーと行番号（出典）が決定的に取れる。文言は原本のまま写す。
    """
    locale_path = ee_root / LOCALE_RELPATH
    if not locale_path.exists():
        print(f"警告: 翻訳ファイルが無いのでロケール行を作らない: {locale_path}")
        return []
    catalog: dict[str, tuple[str, int]] = {}
    for lineno, raw in enumerate(locale_path.read_text(encoding="utf-8").splitlines(), start=1):
        m = re.match(r"^([A-Za-z0-9_.]+):\s*(.+)$", raw)
        if m:
            catalog[m.group(1)] = (m.group(2).strip().strip("\"'"), lineno)

    used: set[str] = set()
    for root in KEY_SCAN_ROOTS:
        base = repo / root
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix not in KEY_SCAN_SUFFIXES:
                continue
            if {"node_modules", "test-results", "playwright-report"} & set(path.parts):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            used.update(KEY_IN_TEXT_RE.findall(text))

    rows: list[list[str]] = []
    evidence_base = ee_root.name + "/" + LOCALE_RELPATH
    for key in sorted(used & set(catalog)):
        text, lineno = catalog[key]
        text = " ".join(text.split())
        rows.append([key, KIND_MESSAGE, f"「{text}」", "", f"{evidence_base}:{lineno}", "確定"])
    return rows


def load_manual_rows(path: Path) -> list[list[str]]:
    """既存表から、生成対象でない行（＝メッセージキー以外）を拾う。"""
    if not path.exists():
        return []
    manual: list[list[str]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        cells = line.split("\t")
        if cells == HEADER:
            continue
        if len(cells) == len(HEADER) and cells[1] != KIND_MESSAGE:
            manual.append(cells)
    return manual


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--out", type=Path, help=f"出力先。既定 {LEDGER_RELPATH.as_posix()}")
    parser.add_argument(
        "--ee-root",
        type=Path,
        default=Path("/home/y-saito/Developments/ec-cube-enterprise"),
        help="ec-cube-enterprise の場所（messages.ja.yaml の参照元）",
    )
    args = parser.parse_args()

    repo = args.repo.resolve()
    out = (args.out or (repo / LEDGER_RELPATH)).resolve()
    generated = load_message_rows(repo)
    locale = load_locale_rows(repo, args.ee_root)
    seen = {(row[0], row[2], row[4]) for row in generated}
    locale = [row for row in locale if (row[0], row[2], row[4]) not in seen]
    manual = load_manual_rows(out)
    rows = sorted(manual + generated + locale, key=lambda r: (r[1], r[0], r[3]))

    out.parent.mkdir(parents=True, exist_ok=True)
    body = "\n".join("\t".join(row) for row in rows)
    out.write_text(NOTE + "\t".join(HEADER) + "\n" + body + "\n", encoding="utf-8")
    print(
        f"論理名対応表: {out} （メッセージID付き {len(generated)}行 / "
        f"翻訳ファイル由来 {len(locale)}行 / 手書き保持 {len(manual)}行）"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
