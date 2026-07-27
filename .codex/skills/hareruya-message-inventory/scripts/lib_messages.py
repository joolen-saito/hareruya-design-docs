#!/usr/bin/env python3
"""共通ライブラリ: 翻訳解決・機能マッピング。

捏造ゼロの原則:
- 文言は必ず ec-cube-enterprise の実ソース（翻訳YAML/生文字列/Twig）由来のみ。
- 解決できないキー・変数キーは resolved=None のまま残し、後段(codex/fable5)で
  実ソースを読んで確定する。ここで推測して埋めない。
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

EE_ROOT = Path("/home/y-saito/Developments/ec-cube-enterprise")
DOC_ROOT = Path("/home/y-saito/Developments/hareruya-design-docs")
LOCALE_DIR = EE_ROOT / "src/Eccube/Resource/locale"


# ---------------------------------------------------------------------------
# 翻訳YAML（messages.ja.yaml / validators.ja.yaml）をフラットな dotted key に展開
# ---------------------------------------------------------------------------
_KV_RE = re.compile(r"^(?P<indent>\s*)(?P<key>[A-Za-z][\w]*(?:\.[\w]+)*):(?P<rest>.*)$")


def _strip_quotes(v: str) -> str:
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ("'", '"'):
        inner = v[1:-1]
        if v[0] == '"':
            inner = inner.replace('\\n', '\n').replace('\\"', '"')
        else:
            inner = inner.replace("''", "'")
        return inner
    return v


def load_translations(locale: str = "ja") -> dict[str, str]:
    """Symfony翻訳YAMLを寛容にパースしフラットな dotted key -> 文言 に。

    PyYAMLはEC-CUBEの未クォートコロン値で失敗するため、Symfony準拠の
    ライン単位パーサで解決する（フラットdottedキー主体、ブロックスカラー対応）。
    ネスト（インデント階層）にも対応し、親キーをドットで連結する。
    locale で 'ja' / 'en' を切り替え（messages.<locale>.yaml / validators.<locale>.yaml）。
    """
    flat: dict[str, str] = {}
    for name in (f"messages.{locale}.yaml", f"validators.{locale}.yaml"):
        path = LOCALE_DIR / name
        if not path.exists():
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        stack: list[tuple[int, str]] = []  # (indent, key-segment)
        i = 0
        while i < len(lines):
            line = lines[i]
            i += 1
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            m = _KV_RE.match(line)
            if not m:
                continue
            indent = len(m.group("indent"))
            key = m.group("key")
            rest = m.group("rest")
            # 階層スタックを現在インデントまで巻き戻す
            while stack and stack[-1][0] >= indent:
                stack.pop()
            prefix = ".".join(seg for _, seg in stack)
            full = f"{prefix}.{key}" if prefix else key
            body = rest.strip()
            if body in ("|", ">", "|-", ">-", "|+", ">+"):
                # ブロックスカラー: 後続の深インデント行を収集
                block: list[str] = []
                base = None
                while i < len(lines):
                    nxt = lines[i]
                    if not nxt.strip():
                        block.append("")
                        i += 1
                        continue
                    ind = len(nxt) - len(nxt.lstrip())
                    if ind <= indent:
                        break
                    if base is None:
                        base = ind
                    block.append(nxt[base:])
                    i += 1
                sep = "" if body.startswith(">") else "\n"
                flat[full] = sep.join(block).strip("\n")
            elif body == "":
                # 子を持つマッピング → スタックに積む
                stack.append((indent, key))
            else:
                flat[full] = _strip_quotes(body)
    return flat


KEY_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$")


def looks_like_key(s: str) -> bool:
    """翻訳キーらしい文字列か（日本語を含まずドット区切り）。"""
    return bool(KEY_RE.match(s)) and not re.search(r"[぀-ヿ一-鿿]", s)


def resolve_text(raw: str, trans: dict[str, str]) -> tuple[str | None, str]:
    """raw引数を (解決文言 or None, 解決方法) に変換。

    kind:
      literal_ja  … 生の日本語文字列（そのまま文言）
      key         … 翻訳キー→YAML解決
      key_unknown … 翻訳キーだがYAMLに無い（要確認）
      other       … 変数・連結など未解決（要確認, codexで確定）
    """
    raw = raw.strip()
    if not raw:
        return None, "other"
    if looks_like_key(raw):
        if raw in trans:
            return trans[raw], "key"
        return None, "key_unknown"
    # 生文字列（日本語 or 記号のみ）
    if re.search(r"[぀-ヿ一-鿿]", raw):
        return raw, "literal_ja"
    return None, "other"


# ---------------------------------------------------------------------------
# 種別マッピング（フラッシュメソッド → 一覧の「種別」語彙）
# ---------------------------------------------------------------------------
FLASH_KIND = {
    "addSuccess": "インフォ(成功)",
    "addSuccessOnce": "インフォ(成功)",
    "addInfo": "インフォ",
    "addInfoOnce": "インフォ",
    "addWarning": "警告",
    "addWarningOnce": "警告",
    "addError": "エラー",
    "addErrorOnce": "エラー",
    "addDanger": "エラー",
    "addDangerOnce": "エラー",
}


# ---------------------------------------------------------------------------
# 機能マッピング: source_file / route -> 機能ID
# ---------------------------------------------------------------------------
def load_function_map() -> tuple[dict[str, list[str]], dict[str, list[str]], dict[str, dict]]:
    """(file_to_fids, route_to_fids, fid_meta) を返す。

    file_to_fids:  'ec-cube-enterprise/src/Eccube/Controller/...php' -> [機能ID...]
    route_to_fids: route名 -> [機能ID...]
    fid_meta:      機能ID -> {title, doc_path, layer, domain}
    """
    inv = DOC_ROOT / "endpoint_reports/ec_enterprise_source_function_inventory.tsv"
    file_to_fids: dict[str, list[str]] = {}
    route_to_fids: dict[str, list[str]] = {}
    fid_meta: dict[str, dict] = {}
    with inv.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        for row in reader:
            fid = row["id"].strip()
            if not fid:
                continue
            fid_meta[fid] = {
                "title": row.get("title", "").strip(),
                "doc_path": row.get("doc_path", "").strip(),
                "layer": row.get("layer", "").strip(),
                "domain": row.get("domain", "").strip(),
            }
            for f in (row.get("source_files") or "").split(","):
                f = f.strip()
                if f:
                    file_to_fids.setdefault(f, []).append(fid)
            for r in (row.get("source_routes") or "").split(","):
                r = r.strip()
                if r:
                    route_to_fids.setdefault(r, []).append(fid)
    return file_to_fids, route_to_fids, fid_meta


def rel_ee(path: Path) -> str:
    """絶対パスを 'ec-cube-enterprise/...' 形式（inventory準拠）に。"""
    return "ec-cube-enterprise/" + str(path.relative_to(EE_ROOT))


def controller_area(rel: str) -> str:
    """未割当メッセージ用の安定エリア（クラス名由来）。"""
    m = re.search(r"/(\w+?)(Controller|Type)\.php$", rel)
    if m:
        return "EE-" + m.group(1).upper()
    return "EE-MISC"


_DOC_TOKENS: dict[str, set[str]] | None = None


def _doc_token_index() -> dict[str, set[str]]:
    """機能ID -> 設計書basename由来トークン集合。"""
    global _DOC_TOKENS
    if _DOC_TOKENS is not None:
        return _DOC_TOKENS
    idx: dict[str, set[str]] = {}
    for sub in ("ec-cube-enterprise", "pf-eccube3", "pf-api"):
        for p in (DOC_ROOT / "functions" / sub).glob("*.md"):
            m = re.match(r"([a-z]\d+-\d+)_(.+)", p.stem)
            if not m:
                continue
            toks = {t for t in re.split(r"[_-]", m.group(2)) if len(t) > 2}
            idx[m.group(1)] = toks
    _DOC_TOKENS = idx
    return idx


def heuristic_fid(rel: str) -> str:
    """controllerパスのトークンと設計書basenameの共有トークンで機能を推定。

    あくまで **候補ヒント**（codex/fable5が実ソースで検証・確定する）。
    共有トークン2未満は空（推測しない）。
    """
    m = re.search(r"Controller/(.+)Controller\.php$", rel)
    if not m:
        return ""
    snake = re.sub(r"(?<!^)(?=[A-Z])", "_", m.group(1)).lower()
    ct = {t for t in re.split(r"[/_]", snake) if len(t) > 2}
    if not ct:
        return ""
    best_fid, best_score = "", 0.0
    for fid, dt in _doc_token_index().items():
        inter = len(ct & dt)
        if inter < 2:
            continue
        score = inter + (inter / len(ct | dt) if (ct | dt) else 0)
        if score > best_score:
            best_score, best_fid = score, fid
    return best_fid


if __name__ == "__main__":
    trans = load_translations()
    print(f"translations loaded: {len(trans)} keys")
    for probe in ("admin.common.save_complete", "admin.common.delete_complete"):
        print(f"  {probe} = {trans.get(probe)!r}")
    f2f, r2f, meta = load_function_map()
    print(f"file_to_fids: {len(f2f)} files, route_to_fids: {len(r2f)} routes, fids: {len(meta)}")


def read_master_rows(path: Path | None = None) -> list[dict[str, str]]:
    """正本 message_inventory.tsv を dict のリストで返す。

    正本は `"\\t".join(cells)` で書かれた**生のタブ区切り**であり RFC4180 ではない。
    `csv.DictReader` を使うと `"admin.hareruyamtg.com" is not allowed.` のように
    `"` で始まる値の引用符が食われ、検証系が実データと違う文字列を見てしまう
    （2026-07-27 に5セルで実害を確認）。必ず本関数で読むこと。
    """
    p = path or (DOC_ROOT / "message_inventory" / "message_inventory.tsv")
    lines = p.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    out = []
    for line in lines[1:]:
        if not line.strip():
            continue
        cells = line.split("\t")
        cells += [""] * (len(header) - len(cells))
        out.append(dict(zip(header, cells)))
    return out
