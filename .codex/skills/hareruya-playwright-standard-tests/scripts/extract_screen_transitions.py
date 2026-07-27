#!/usr/bin/env python3
"""設計書（正本md）から画面到達に関する「事実」を決定的に抽出する。

抽出対象は次の3節のみ。いずれも設計書に実在する表であり、本スクリプトは
セル内容を逐語で写すだけで、分類・推測・補完を行わない（捏造ゼロ）。

  1. `## 利用者視点の入口`        … 入口 / URLエンドポイント / 期待されるふるまい
  2. `## 画面遷移`                … 条件 / 遷移先
  3. `### 遷移時に引き継ぐ状態`   … 起点 / 遷移前の処理 / 遷移後の初期状態

出力（すべて根拠 file:line 付き）:
  - e2e/reports/screen-transitions.tsv        : 抽出した事実行（EVID付き）
  - e2e/reports/screen-reachability-suggested.tsv
        : 到達クラスの「候補」。**確定値ではない**。
          `e2e/config/screen-reachability.tsv`（正式台帳）へ人手/codexが
          根拠EVIDを引用して転記して初めて確定する。

使い方:
  python3 .codex/skills/hareruya-playwright-standard-tests/scripts/extract_screen_transitions.py --repo .
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
from dataclasses import dataclass, field
from pathlib import Path

DOC_GLOBS = ("functions/pf-eccube3/*.md", "functions/pf-api/*.md")

H_ENTRY = "## 利用者視点の入口"
H_TRANSITION = "## 画面遷移"
H_CARRYOVER = "### 遷移時に引き継ぐ状態"

FID_IN_NAME = re.compile(r"^([a-z]\d{2}-\d{2})_")
FID_REF = re.compile(r"\b([A-Z]\d{2}-\d{2})\b")
VERB = r"(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)"
# 設計書は `GET|POST /path` のようにメソッドを並記することがある（例 f02-01:76）。
# 単一メソッドしか拾わないと GET を取りこぼして送信系と誤判定するため、メソッド集合で捉える。
HTTP_PATH = re.compile(rf"\b({VERB}(?:\s*[|/、,]\s*{VERB})*)\s+(/[A-Za-z0-9_\-{{}}./]*)")
BARE_PATH = re.compile(r"`([^`]*?)`")
PATH_TOKEN = re.compile(r"(/[A-Za-z0-9_\-{}./]+)")
ROUTE_NAME = re.compile(r"`((?:admin|front)_[a-z0-9_]+)`")

# 「直アクセスでは正規表示されない」ことを設計書が明示する語（逐語一致のみ採る）。
# 判定に使うのではなく、候補提示の根拠語として記録する。
CARRY_MARKERS = (
    "リダイレクトで到達",
    "遷移で到達",
    "からのリダイレクト",
    "を経て表示",
    "経由でのみ",
)
GUARD_MARKERS = (
    "無い場合",
    "なし",
    "不正",
    "存在しない",
    "未完了",
    "直接アクセス",
)


@dataclass
class Fact:
    evid: str
    fid: str
    doc: str
    line: int
    section: str
    col1: str
    col2: str
    col3: str
    paths: str = ""
    routes: str = ""
    fid_refs: str = ""


@dataclass
class Suggestion:
    fid: str
    path: str
    suggested_class: str
    basis_evids: list[str] = field(default_factory=list)
    basis_text: list[str] = field(default_factory=list)


def norm_path(raw: str) -> str:
    """URLパスを比較用に正規化する。ロケール/店舗プレフィックスと末尾スラッシュのみ落とす。"""
    p = raw.strip().strip("。、）)（(").rstrip("/")
    p = p.replace("/{_locale}", "").replace("/{locale}", "")
    if not p.startswith("/"):
        return ""
    if p in ("/",):
        return "/"
    return p


def extract_paths(cell: str) -> list[str]:
    return list(extract_paths_with_method(cell).keys())


def extract_paths_with_method(cell: str) -> dict[str, set[str]]:
    """パス→HTTPメソッド集合の対応を返す。メソッド未記載は空集合。

    同じパスが複数行・複数記法で現れることがあるため、メソッドは上書きせず和で持つ。
    """
    found: dict[str, set[str]] = {}
    for methods, path in HTTP_PATH.findall(cell):
        n = norm_path(path)
        if not n:
            continue
        ms = {m.strip().upper() for m in re.split(r"[|/、,\s]+", methods) if m.strip()}
        found.setdefault(n, set()).update(ms)
    for code in BARE_PATH.findall(cell):
        for tok in PATH_TOKEN.findall(code):
            n = norm_path(tok)
            if n:
                found.setdefault(n, set())
    return found


def split_row(line: str) -> list[str]:
    """Markdown表の行をセルへ分解する。

    設計書は `GET|POST /path` のようにコードスパン内に `|` を書く（例 f02-01:76）。
    素朴な split("|") はここでセルを割ってしまい、メソッドとパスが別セルへ散る。
    バッククォート内の `|` は区切りとして扱わない。
    """
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    cells: list[str] = []
    buf: list[str] = []
    in_code = False
    for ch in s:
        if ch == "`":
            in_code = not in_code
            buf.append(ch)
        elif ch == "|" and not in_code:
            cells.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    cells.append("".join(buf).strip())
    return cells


def is_separator(line: str) -> bool:
    return bool(re.match(r"^\|[\s:\-|]+\|$", line.strip()))


def read_table(lines: list[str], start: int) -> tuple[list[tuple[int, list[str]]], int]:
    """見出し行 start の直後にある最初の表を読む。(行番号1始まり, セル) のリストを返す。"""
    i = start + 1
    while i < len(lines) and not lines[i].startswith("|"):
        if lines[i].startswith("#"):
            return [], i
        i += 1
    if i >= len(lines):
        return [], i
    i += 1  # ヘッダ行
    if i < len(lines) and is_separator(lines[i]):
        i += 1
    rows: list[tuple[int, list[str]]] = []
    while i < len(lines) and lines[i].startswith("|"):
        rows.append((i + 1, split_row(lines[i])))
        i += 1
    return rows, i


def section_text(lines: list[str], start: int, end: int) -> str:
    return "\n".join(lines[start:end])


def evid_of(doc: str, line: int, section: str) -> str:
    h = hashlib.sha1(f"{doc}:{line}:{section}".encode("utf-8")).hexdigest()[:8]
    return f"EV-{h}"


def collect(repo: Path) -> tuple[list[Fact], list[Suggestion]]:
    facts: list[Fact] = []
    suggestions: list[Suggestion] = []

    docs: list[Path] = []
    for g in DOC_GLOBS:
        docs.extend(sorted(repo.glob(g)))

    for doc in docs:
        m = FID_IN_NAME.match(doc.name)
        if not m:
            continue
        fid = m.group(1).upper()
        rel = str(doc.relative_to(repo))
        lines = doc.read_text(encoding="utf-8").splitlines()

        entry_rows: list[tuple[int, list[str]]] = []
        trans_rows: list[tuple[int, list[str]]] = []
        carry_rows: list[tuple[int, list[str]]] = []
        entry_prose = ""

        for idx, line in enumerate(lines):
            s = line.strip()
            # 同名節が複数回現れる設計書があるため、上書きせず累積する。
            if s == H_ENTRY:
                rows_, after = read_table(lines, idx)
                entry_rows += rows_
                nxt = next(
                    (k for k in range(after, len(lines)) if lines[k].startswith("#")),
                    len(lines),
                )
                entry_prose += "\n" + section_text(lines, after, nxt)
            elif s == H_TRANSITION:
                rows_, _ = read_table(lines, idx)
                trans_rows += rows_
            elif s == H_CARRYOVER:
                rows_, _ = read_table(lines, idx)
                carry_rows += rows_

        def add(section: str, ln: int, cells: list[str]) -> Fact:
            c = (cells + ["", "", ""])[:3]
            joined = " ".join(cells)
            f = Fact(
                evid=evid_of(rel, ln, section),
                fid=fid,
                doc=rel,
                line=ln,
                section=section,
                col1=c[0],
                col2=c[1],
                col3=c[2],
                paths=";".join(dict.fromkeys(extract_paths(joined))),
                routes=";".join(dict.fromkeys(ROUTE_NAME.findall(joined))),
                fid_refs=";".join(dict.fromkeys(FID_REF.findall(joined))),
            )
            facts.append(f)
            return f

        entry_facts = [add("利用者視点の入口", ln, c) for ln, c in entry_rows]
        trans_facts = [add("画面遷移", ln, c) for ln, c in trans_rows]
        carry_facts = [add("遷移時に引き継ぐ状態", ln, c) for ln, c in carry_rows]

        # --- 到達クラス「候補」の提示（確定ではない） ---
        for ef in entry_facts:
            methods = extract_paths_with_method(" ".join([ef.col1, ef.col2, ef.col3]))
            for path in (ef.paths.split(";") if ef.paths else []):
                if not path:
                    continue
                ms = methods.get(path, set())

                # 画面を持たない機能（API/バッチ）は画面到達の対象外。
                if fid[0] in ("A", "B"):
                    suggestions.append(
                        Suggestion(fid=fid, path=path, suggested_class="非画面(API/バッチ)")
                    )
                    continue

                # 送信系エンドポイントは「画面」ではなく操作。到達クラスの対象外。
                # ただしGETが並記されていれば画面入口でもある（`GET|POST /...`）。
                if ms and "GET" not in ms:
                    suggestions.append(
                        Suggestion(
                            fid=fid,
                            path=path,
                            suggested_class="action-endpoint",
                            basis_evids=[ef.evid],
                            basis_text=[f"入口が送信系: {ef.col2}"],
                        )
                    )
                    continue

                basis_evids: list[str] = []
                basis_text: list[str] = []

                # (b) 入口節の地の文に「リダイレクトで到達」等の逐語がある
                for marker in CARRY_MARKERS:
                    if marker in entry_prose:
                        basis_evids.append(ef.evid)
                        basis_text.append(f"入口節地の文: …{marker}…")
                        break

                # (c) 引き継ぎ状態表が存在する（遷移前処理が到達条件）
                for cf in carry_facts:
                    if path in cf.paths.split(";") or any(
                        tok and tok in cf.col3 for tok in [path.rsplit("/", 1)[-1]]
                    ):
                        basis_evids.append(cf.evid)
                        basis_text.append(f"引き継ぎ状態: {cf.col1} / {cf.col2}")
                        break

                # (d) 画面遷移表に、当該画面へ「リダイレクト」で入る行がある
                for tf in trans_facts:
                    if path in tf.paths.split(";") and (
                        "リダイレクト" in tf.col2 or "遷移" in tf.col2
                    ):
                        basis_evids.append(tf.evid)
                        basis_text.append(f"画面遷移: {tf.col1} → {tf.col2}")
                        break

                # (e) 画面遷移表に、状態欠落時に別画面へ戻すガード行がある。
                #     ガード行は当該パスを名指ししないことが多く単独では決め手にならない。
                #     強い根拠(b)(c)(d)の補強、または「要確認」の材料としてのみ使う。
                weak_evids: list[str] = []
                weak_text: list[str] = []
                for tf in trans_facts:
                    if any(g in tf.col1 for g in GUARD_MARKERS):
                        weak_evids.append(tf.evid)
                        weak_text.append(f"ガード(弱): {tf.col1} → {tf.col2}")
                        break

                if basis_evids:
                    suggested = "transition-only?"
                    basis_evids += weak_evids
                    basis_text += weak_text
                elif weak_evids:
                    suggested = "要確認(ガードあり)"
                    basis_evids, basis_text = weak_evids, weak_text
                else:
                    suggested = "entry-direct?"
                suggestions.append(
                    Suggestion(
                        fid=fid,
                        path=path,
                        suggested_class=suggested,
                        basis_evids=list(dict.fromkeys(basis_evids)),
                        basis_text=basis_text,
                    )
                )

    return facts, suggestions


def write_tsv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, delimiter="\t", lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)


def selftest() -> None:
    """抽出の回帰テスト（設計書の実記法で壊れないこと）。"""
    # コードスパン内の `|` はセル区切りではない（f02-01:76 の `GET|POST /...`）。
    row = "| ナビ単体 | `GET|POST /{_locale}/block/ec_navigator` | 部分テンプレを返す。 |"
    cells = split_row(row)
    assert len(cells) == 3, cells
    assert cells[1] == "`GET|POST /{_locale}/block/ec_navigator`", cells

    # メソッド並記はメソッド集合として取り、GETを取りこぼさない。
    got = extract_paths_with_method(cells[1])
    assert got == {"/block/ec_navigator": {"GET", "POST"}}, got

    # 単一メソッドと、メソッド未記載のコードスパンパス。
    assert extract_paths_with_method("`POST /{_locale}/cart/add`") == {"/cart/add": {"POST"}}
    assert extract_paths_with_method("`/shopping/complete`") == {"/shopping/complete": set()}

    # ロケールプレフィックスの正規化と、パスでないものを拾わないこと。
    assert norm_path("/{_locale}/shopping/complete") == "/shopping/complete"
    assert norm_path("Shopping/complete.twig") == ""

    # 通常の表は素直に3セルへ割れる。
    assert split_row("| a | b | c |") == ["a", "b", "c"]

    print("selftest: ok")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    ap.add_argument("--selftest", action="store_true", help="抽出の回帰テストのみ実行する")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return
    repo = Path(args.repo).resolve()

    facts, suggestions = collect(repo)

    write_tsv(
        repo / "e2e" / "reports" / "screen-transitions.tsv",
        ["EVID", "機能ID", "根拠doc", "行", "節", "列1", "列2", "列3", "抽出パス", "抽出ルート名", "参照機能ID"],
        [
            [f.evid, f.fid, f.doc, str(f.line), f.section, f.col1, f.col2, f.col3, f.paths, f.routes, f.fid_refs]
            for f in facts
        ],
    )

    write_tsv(
        repo / "e2e" / "reports" / "screen-reachability-suggested.tsv",
        ["機能ID", "パス", "候補クラス(未確定)", "根拠EVID", "根拠要約"],
        [
            [s.fid, s.path, s.suggested_class, ";".join(s.basis_evids), " / ".join(s.basis_text)]
            for s in suggestions
        ],
    )

    n_fid = len({f.fid for f in facts})
    tally: dict[str, int] = {}
    for s in suggestions:
        tally[s.suggested_class] = tally.get(s.suggested_class, 0) + 1
    breakdown = " ".join(f"{k}={v}" for k, v in sorted(tally.items()))
    print(f"facts={len(facts)} functions={n_fid} rows={len(suggestions)} / {breakdown}")
    print("out: e2e/reports/screen-transitions.tsv")
    print("out: e2e/reports/screen-reachability-suggested.tsv （候補・未確定）")


if __name__ == "__main__":
    main()
