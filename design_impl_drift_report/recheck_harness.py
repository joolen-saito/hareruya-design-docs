#!/usr/bin/env python3
"""HTML設計書 再生成後の「② 不具合再調査」ハーネス。

目的:
  再生成した正本HTML設計書を**正**として、`ec-cube-enterprise`(ee) 実装との乖離を
  設計書別に再判定する。判定結果は**新規の**MD/TSVへ出力し、既存の
  `drift_findings_list_remaining.tsv` は一切書き換えない（読み取り専用・sha256で担保）。

絶対規約:
  1. 入力TSV(`drift_findings_list_remaining.tsv`)は read-only。build 完了時に sha256 を再検証する。
  2. **正本HTMLに書かれていないことは指摘に含めない。**
     judgments の各行は、そのHTMLに実在する逐語引用(`設計書根拠_引用`)を必須とし、
     harness が該当シート本文へ正規化部分一致で機械照合する。不一致は RuntimeError で落とす。
     引用がレイアウト画像(base64 `image-layer-img`)にしかない場合のみ `引用種別=IMAGE` を許し、
     その場合は当該シートに画像が実在することを機械確認する（人の目視確認は `画像確認メモ` に残す）。
  3. 実装参照(`現実装_参照`)は ee リポジトリ内に実在するファイル:行のみ許可。
     存在しないパス・ファイル行数超過は RuntimeError。
  4. 「設計書に記述が無い」ことを理由に指摘を残すことはできない（判定 NOT_IN_DESIGN は取り下げ扱い）。

使い方:
  python3 recheck_harness.py prepare --doc 0203
      → recheck/<doc>/queue.tsv と evidence/*.txt（現HTMLでの引用解決結果）を出力
  python3 recheck_harness.py build   --doc 0203
      → recheck/<doc>/judgments.tsv を検証し、
        RECHECK_<doc>.md / recheck_findings_<doc>.tsv を出力
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib_design_doc as L  # noqa: E402

ROOT = Path(__file__).resolve().parent
DOCS_ROOT = ROOT.parent
WORKSPACE = DOCS_ROOT.parent
IMPL_ROOT = WORKSPACE / "ec-cube-enterprise"
SOURCE_TSV = ROOT / "drift_findings_list_remaining.tsv"
RECHECK_DIR = ROOT / "recheck"

# judgments.tsv の列（著者が埋める）
JUDGMENT_COLUMNS = [
    "通番",              # queue.tsv と対応（機械キー）
    "機能No",
    "再調査判定",         # UPHELD / RESOLVED / NOT_IN_DESIGN / DESIGN_ISSUE / RESTATED
    "再調査後_指摘区分",   # 未実装 / 実装違い / -（取り下げ時）
    "再調査後_重要度",     # high / med / low / -
    "引用種別",           # TEXT / IMAGE
    "設計書根拠_シート",   # sheet-N
    "設計書根拠_引用",     # 正本HTMLからの逐語引用（機械照合対象）
    "設計書根拠_行",       # 現HTMLの行番号（参考）
    "設計書期待値",        # 引用から導かれる期待挙動（引用の言い換え）
    "現実装_参照",         # ee の path:line（; 区切り・実在検証対象）
    "現実装_実態",         # 実装がどうなっているか
    "判定根拠",            # なぜ乖離/非乖離か
    "画像確認メモ",        # 引用種別=IMAGE のとき必須
    "確信度",             # high / med / low
]

VALID_VERDICTS = {
    "UPHELD",        # 乖離は現HEADでも再現する（指摘を維持）
    "RESOLVED",      # 実装済み/解消済み（指摘を取り下げ）
    "NOT_IN_DESIGN", # 正本HTMLに根拠が無い（指摘を取り下げ）
    "DESIGN_ISSUE",  # 正本HTML内部が矛盾しており設計裁定待ち（乖離として起票しない）
    "RESTATED",      # 乖離は残るが内容/範囲を訂正した上で維持
}
KEPT_VERDICTS = {"UPHELD", "RESTATED"}
# 正本に根拠が要る判定（NOT_IN_DESIGN は「根拠が無いこと」が結論なので免除）
QUOTE_REQUIRED_VERDICTS = {"UPHELD", "RESTATED", "RESOLVED", "DESIGN_ISSUE"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm(text: str) -> str:
    """引用照合用の正規化。全半角・空白・改行・タブ・引用符ゆれを吸収する。"""
    t = unicodedata.normalize("NFKC", text or "")
    t = t.replace("　", "")
    t = re.sub(r"[\s]+", "", t)
    t = t.replace("｢", "「").replace("｣", "」")
    t = re.sub(r"[\"'`´’‘“”]", "", t)
    return t


def load_source_rows() -> list[dict]:
    with SOURCE_TSV.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh, delimiter="\t"))


def rows_for_doc(rows: list[dict], doc_key: str) -> list[dict]:
    """設計書割当は build_html_regen_checklist.py と同じ優先順（設計書参照 > 設計書対象 > 正本根拠）。"""
    out = []
    for r in rows:
        for col in ("設計書参照", "設計書対象", "正本根拠"):
            if doc_key in (r.get(col) or ""):
                out.append(r)
                break
    return out


_REF_RE = re.compile(r"#(sheet-\d+):([\d,\-\s]+)")


def parse_design_ref(ref: str) -> list[tuple[str, list[int]]]:
    """`...html#sheet-3:1012,1013` → [("sheet-3", [1012, 1013])]"""
    out = []
    for m in _REF_RE.finditer(ref or ""):
        lines: list[int] = []
        for part in m.group(2).split(","):
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                a, _, b = part.partition("-")
                if a.strip().isdigit() and b.strip().isdigit():
                    lines.extend(range(int(a), int(b) + 1))
            elif part.isdigit():
                lines.append(int(part))
        out.append((m.group(1), lines))
    return out


class Book:
    """再生成後の正本HTML（1冊）へのアクセス。行番号・シート・画像の機械照合に使う。"""

    def __init__(self, doc_key: str):
        self.path = L.resolve_book(doc_key)
        self.raw = self.path.read_text(encoding="utf-8", errors="ignore")
        self.lines = self.raw.splitlines()
        self.sheets = L.sheet_index(self.path)
        self._line_offsets = []
        pos = 0
        for line in self.lines:
            self._line_offsets.append(pos)
            pos += len(line) + 1
        self._sheet_text: dict[str, str] = {}
        self._sheet_norm: dict[str, str] = {}

    def sheet_of_line(self, lineno: int) -> str:
        if not (1 <= lineno <= len(self.lines)):
            return ""
        off = self._line_offsets[lineno - 1]
        for s in self.sheets:
            if s.start <= off < s.end:
                return s.sheet_id
        return ""

    def sheet(self, sheet_id: str):
        for s in self.sheets:
            if s.sheet_id == sheet_id:
                return s
        raise RuntimeError(f"{self.path.name} に {sheet_id} が無い")

    def sheet_text(self, sheet_id: str) -> str:
        if sheet_id not in self._sheet_text:
            self._sheet_text[sheet_id] = L.sheet_text(self.path, self.sheet(sheet_id))
        return self._sheet_text[sheet_id]

    def sheet_norm(self, sheet_id: str) -> str:
        if sheet_id not in self._sheet_norm:
            self._sheet_norm[sheet_id] = norm(self.sheet_text(sheet_id))
        return self._sheet_norm[sheet_id]

    def sheet_line_range(self, sheet_id: str) -> tuple[int, int]:
        s = self.sheet(sheet_id)
        lo = hi = 0
        for i, off in enumerate(self._line_offsets, start=1):
            if lo == 0 and off >= s.start:
                lo = i
            if off < s.end:
                hi = i
        return lo, hi

    def image_count(self, sheet_id: str) -> int:
        s = self.sheet(sheet_id)
        return self.raw[s.start:s.end].count('class="image-layer-img')

    def line_text(self, lineno: int) -> str:
        if not (1 <= lineno <= len(self.lines)):
            return ""
        return L.to_text(self.lines[lineno - 1]).replace("\n", " / ")[:600]


def cmd_prepare(doc_key: str) -> None:
    book = Book(doc_key)
    rows = rows_for_doc(load_source_rows(), doc_key)
    if not rows:
        raise RuntimeError(f"{doc_key} に紐づく残指摘が0件。設計書キーを確認すること")

    outdir = RECHECK_DIR / doc_key
    (outdir / "evidence").mkdir(parents=True, exist_ok=True)

    qcols = [
        "通番", "機能No", "機能名", "指摘区分", "重要度", "観点",
        "旧_設計期待値", "旧_実装実態", "旧_実装参照", "旧_設計書参照", "旧_再確認HEAD",
        "旧_トリアージ区分", "旧_設計書作業",
        "現HTML_シート", "現HTML_シート名", "現HTML_行範囲", "現HTML_画像数",
        "旧行の現内容", "引用陳腐化",
    ]
    with (outdir / "queue.tsv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=qcols, delimiter="\t", lineterminator="\n")
        w.writeheader()
        for i, r in enumerate(rows, start=1):
            seq = f"{doc_key}-{i:03d}"
            refs = parse_design_ref(r.get("設計書参照") or "")
            sheet_ids, cur_lines, stale = [], [], []
            for sheet_id, linenos in refs:
                sheet_ids.append(sheet_id)
                for ln in linenos:
                    actual_sheet = book.sheet_of_line(ln)
                    cur_lines.append(f"{ln}:{actual_sheet or 'OUT_OF_RANGE'}")
                    if actual_sheet != sheet_id:
                        stale.append(str(ln))
            sid = sheet_ids[0] if sheet_ids else ""
            sname = book.sheet(sid).title if sid else ""
            lo, hi = book.sheet_line_range(sid) if sid else (0, 0)
            w.writerow({
                "通番": seq,
                "機能No": r.get("機能No", ""),
                "機能名": r.get("機能名", ""),
                "指摘区分": r.get("指摘区分", ""),
                "重要度": r.get("重要度", ""),
                "観点": r.get("観点", ""),
                "旧_設計期待値": r.get("設計期待値", ""),
                "旧_実装実態": r.get("実装実態", ""),
                "旧_実装参照": r.get("実装参照", ""),
                "旧_設計書参照": r.get("設計書参照", ""),
                "旧_再確認HEAD": r.get("再確認HEAD", ""),
                "旧_トリアージ区分": r.get("トリアージ区分", ""),
                "旧_設計書作業": r.get("設計書作業", ""),
                "現HTML_シート": sid,
                "現HTML_シート名": sname,
                "現HTML_行範囲": f"{lo}-{hi}" if sid else "",
                "現HTML_画像数": str(book.image_count(sid)) if sid else "",
                "旧行の現内容": " || ".join(book.line_text(int(x.split(":")[0])) for x in cur_lines)[:800],
                "引用陳腐化": "STALE:" + ",".join(stale) if stale else "OK",
            })

            ev = outdir / "evidence" / f"{seq}.txt"
            body = [
                f"# {seq} {r.get('機能No','')} {r.get('機能名','')}",
                f"設計書: {book.path.name}",
                f"旧設計書参照: {r.get('設計書参照','')}",
                f"シート: {sid} {sname} (行 {lo}-{hi}, 画像 {book.image_count(sid) if sid else 0}枚)",
                "",
                "## 旧指摘",
                f"指摘区分: {r.get('指摘区分','')} / 重要度: {r.get('重要度','')} / 観点: {r.get('観点','')}",
                f"設計期待値: {r.get('設計期待値','')}",
                f"実装実態: {r.get('実装実態','')}",
                f"実装参照: {r.get('実装参照','')}",
                "",
                "## 再生成後HTML 該当シート本文",
                book.sheet_text(sid) if sid else "(シート未解決)",
            ]
            ev.write_text("\n".join(body), encoding="utf-8")

    print(f"prepare 完了: {outdir/'queue.tsv'} ({len(rows)}件) / evidence {len(rows)}本")
    print(f"source sha256: {sha256(SOURCE_TSV)}")


def impl_head() -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(IMPL_ROOT), "rev-parse", "--short=10", "HEAD"],
            capture_output=True, text=True, check=True).stdout.strip()
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"ee の HEAD が取得できない: {exc}") from exc


_IMPL_REF_RE = re.compile(r"^([\w./\-]+\.[A-Za-z0-9]+)(?::(\d+)(?:-(\d+))?)?$")


def verify_impl_ref(ref: str) -> list[str]:
    """`path:line` 群の実在検証。壊れている参照だけを返す。"""
    bad = []
    for part in re.split(r"[;、]", ref or ""):
        part = part.strip()
        if not part:
            continue
        m = _IMPL_REF_RE.match(part)
        if not m:
            bad.append(f"{part}(書式不正)")
            continue
        path = IMPL_ROOT / m.group(1)
        if not path.is_file():
            bad.append(f"{part}(ファイル無し)")
            continue
        if m.group(2):
            total = sum(1 for _ in path.open(encoding="utf-8", errors="ignore"))
            end = int(m.group(3) or m.group(2))
            if end > total:
                bad.append(f"{part}(行数超過: 実{total}行)")
    return bad


def cmd_build(doc_key: str) -> None:
    before = sha256(SOURCE_TSV)
    book = Book(doc_key)
    outdir = RECHECK_DIR / doc_key
    qpath = outdir / "queue.tsv"
    jpath = outdir / "judgments.tsv"
    if not qpath.is_file():
        raise RuntimeError(f"先に prepare を実行すること: {qpath} が無い")
    if not jpath.is_file():
        raise RuntimeError(f"判定TSVが無い: {jpath}")

    with qpath.open(encoding="utf-8") as fh:
        queue = {r["通番"]: r for r in csv.DictReader(fh, delimiter="\t")}
    with jpath.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        missing_cols = [c for c in JUDGMENT_COLUMNS if c not in (reader.fieldnames or [])]
        if missing_cols:
            raise RuntimeError(f"judgments.tsv の列不足: {missing_cols}")
        judgments = list(reader)

    errors: list[str] = []
    seen = set()
    for j in judgments:
        seq = (j.get("通番") or "").strip()
        if seq not in queue:
            errors.append(f"{seq}: queue.tsv に存在しない通番")
            continue
        if seq in seen:
            errors.append(f"{seq}: 重複行")
        seen.add(seq)
        q = queue[seq]
        if (j.get("機能No") or "").strip() != q["機能No"]:
            errors.append(f"{seq}: 機能No不一致 ({j.get('機能No')} != {q['機能No']})")

        verdict = (j.get("再調査判定") or "").strip()
        if verdict not in VALID_VERDICTS:
            errors.append(f"{seq}: 再調査判定が不正 {verdict!r} (許可: {sorted(VALID_VERDICTS)})")
            continue

        quote = (j.get("設計書根拠_引用") or "").strip()
        sheet_id = (j.get("設計書根拠_シート") or "").strip()
        qtype = (j.get("引用種別") or "").strip().upper()

        if verdict in QUOTE_REQUIRED_VERDICTS:
            if not sheet_id:
                errors.append(f"{seq}: 設計書根拠_シート が空（{verdict} には正本の所在が必須）")
            if not quote:
                errors.append(f"{seq}: 設計書根拠_引用 が空（{verdict} には正本の逐語引用が必須）")
            if sheet_id and quote:
                if qtype == "TEXT":
                    if norm(quote) not in book.sheet_norm(sheet_id):
                        errors.append(
                            f"{seq}: 引用が {sheet_id} 本文に存在しない（捏造ゲート）: {quote[:60]!r}")
                elif qtype == "IMAGE":
                    n = book.image_count(sheet_id)
                    if n == 0:
                        errors.append(f"{seq}: 引用種別=IMAGE だが {sheet_id} に画像が0枚")
                    if not (j.get("画像確認メモ") or "").strip():
                        errors.append(f"{seq}: 引用種別=IMAGE には 画像確認メモ が必須")
                else:
                    errors.append(f"{seq}: 引用種別は TEXT / IMAGE のみ（{qtype!r}）")
        if verdict == "NOT_IN_DESIGN" and quote:
            errors.append(f"{seq}: NOT_IN_DESIGN に正本引用が付いている（矛盾）")

        if verdict in KEPT_VERDICTS:
            impl = (j.get("現実装_参照") or "").strip()
            if not impl:
                errors.append(f"{seq}: 維持判定には 現実装_参照 が必須")
            else:
                bad = verify_impl_ref(impl)
                if bad:
                    errors.append(f"{seq}: 実装参照が実在しない: {', '.join(bad)}")
            if (j.get("再調査後_指摘区分") or "").strip() not in ("未実装", "実装違い"):
                errors.append(f"{seq}: 維持判定の 再調査後_指摘区分 は 未実装/実装違い のみ")
            if (j.get("再調査後_重要度") or "").strip() not in ("high", "med", "low"):
                errors.append(f"{seq}: 維持判定の 再調査後_重要度 は high/med/low")
        if not (j.get("判定根拠") or "").strip():
            errors.append(f"{seq}: 判定根拠 が空")
        if (j.get("確信度") or "").strip() not in ("high", "med", "low"):
            errors.append(f"{seq}: 確信度 は high/med/low")

    unjudged = sorted(set(queue) - seen)
    if unjudged:
        errors.append(f"未判定が残っている（全件再判定が完了条件）: {unjudged}")

    if errors:
        raise RuntimeError("再調査ゲート違反 %d件:\n  - %s" % (len(errors), "\n  - ".join(errors)))

    head = impl_head()
    outcols = [
        "通番", "機能No", "機能名", "再調査判定", "再調査後_指摘区分", "再調査後_重要度",
        "設計書", "設計書根拠_シート", "設計書根拠_シート名", "引用種別",
        "設計書根拠_引用", "設計書根拠_行", "設計書期待値",
        "現実装_参照", "現実装_実態", "判定根拠", "画像確認メモ", "確信度",
        "ee_HEAD", "旧_指摘区分", "旧_重要度", "旧_トリアージ区分", "旧_設計書参照", "旧_再確認HEAD",
    ]
    tsv_out = ROOT / f"recheck_findings_{doc_key}.tsv"
    with tsv_out.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=outcols, delimiter="\t", lineterminator="\n")
        w.writeheader()
        for j in sorted(judgments, key=lambda x: x["通番"]):
            q = queue[j["通番"]]
            sid = (j.get("設計書根拠_シート") or "").strip()
            w.writerow({
                "通番": j["通番"], "機能No": j["機能No"], "機能名": q["機能名"],
                "再調査判定": j["再調査判定"],
                "再調査後_指摘区分": j.get("再調査後_指摘区分", ""),
                "再調査後_重要度": j.get("再調査後_重要度", ""),
                "設計書": book.path.name,
                "設計書根拠_シート": sid,
                "設計書根拠_シート名": book.sheet(sid).title if sid else "",
                "引用種別": j.get("引用種別", ""),
                "設計書根拠_引用": j.get("設計書根拠_引用", ""),
                "設計書根拠_行": j.get("設計書根拠_行", ""),
                "設計書期待値": j.get("設計書期待値", ""),
                "現実装_参照": j.get("現実装_参照", ""),
                "現実装_実態": j.get("現実装_実態", ""),
                "判定根拠": j.get("判定根拠", ""),
                "画像確認メモ": j.get("画像確認メモ", ""),
                "確信度": j.get("確信度", ""),
                "ee_HEAD": head,
                "旧_指摘区分": q["指摘区分"], "旧_重要度": q["重要度"],
                "旧_トリアージ区分": q["旧_トリアージ区分"],
                "旧_設計書参照": q["旧_設計書参照"], "旧_再確認HEAD": q["旧_再確認HEAD"],
            })

    md_out = ROOT / f"RECHECK_{doc_key}.md"
    write_markdown(md_out, doc_key, book, queue, judgments, head)

    after = sha256(SOURCE_TSV)
    if before != after:
        raise RuntimeError("drift_findings_list_remaining.tsv が変更された（read-only規約違反）")

    print(f"build 完了: {tsv_out}")
    print(f"           {md_out}")
    print(f"source tsv 無改変を確認: sha256={after}")


def write_markdown(path: Path, doc_key: str, book: Book, queue: dict, judgments: list[dict], head: str) -> None:
    by_verdict: dict[str, list[dict]] = {}
    for j in judgments:
        by_verdict.setdefault(j["再調査判定"], []).append(j)
    kept = [j for j in judgments if j["再調査判定"] in KEPT_VERDICTS]

    A = []
    a = A.append
    a(f"# 再調査結果 — {book.path.name}")
    a("")
    a(f"- 対象: `excel_to_html/output/{book.path.name}`（再生成後の正本HTML）")
    a(f"- 実装: `ec-cube-enterprise` HEAD `{head}`")
    a(f"- 母数: {len(queue)}件（`drift_findings_list_remaining.tsv` の当該設計書分／**同ファイルは無改変**）")
    a(f"- 出力: `design_impl_drift_report/recheck_findings_{doc_key}.tsv`（本MDと同一データ）")
    a("- 判定規約: 正本HTMLに逐語で存在する記述のみを根拠に採る。"
      "HTMLに書かれていないことは指摘に含めない（harness が引用の実在を機械照合し、"
      "不一致なら build を失敗させる）")
    a("")
    a("## 判定サマリ")
    a("")
    a("| 再調査判定 | 意味 | 件数 |")
    a("| --- | --- | ---: |")
    meaning = {
        "UPHELD": "正本に根拠あり・現HEADでも乖離が再現（指摘維持）",
        "RESTATED": "乖離は残るが指摘内容・範囲を訂正して維持",
        "RESOLVED": "現HEADでは実装済み／解消済み（取り下げ）",
        "NOT_IN_DESIGN": "正本HTMLに根拠が無い（取り下げ）",
        "DESIGN_ISSUE": "正本HTML内部が矛盾。設計裁定待ちで乖離としては起票しない",
    }
    for v in ("UPHELD", "RESTATED", "RESOLVED", "NOT_IN_DESIGN", "DESIGN_ISSUE"):
        a(f"| {v} | {meaning[v]} | {len(by_verdict.get(v, []))} |")
    a(f"| **合計** | | **{len(judgments)}** |")
    a("")
    a(f"**維持（要修正）: {len(kept)}件**")
    a("")
    if kept:
        a("| 通番 | 機能No | 区分 | 重要度 | 概要 |")
        a("| --- | --- | --- | --- | --- |")
        for j in sorted(kept, key=lambda x: x["通番"]):
            summary = (j.get("設計書期待値") or "").replace("|", "／").replace("\n", " ")
            a(f"| {j['通番']} | {j['機能No']} | {j.get('再調査後_指摘区分','')} | "
              f"{j.get('再調査後_重要度','')} | {summary[:90]} |")
        a("")

    a("## 個別判定")
    a("")
    for j in sorted(judgments, key=lambda x: x["通番"]):
        q = queue[j["通番"]]
        sid = (j.get("設計書根拠_シート") or "").strip()
        name = q["機能名"]
        if name.startswith(j["機能No"]):
            name = name[len(j["機能No"]):].strip()
        a(f"### {j['通番']} {j['機能No']} {name} — **{j['再調査判定']}**")
        a("")
        if sid:
            a(f"- 正本: `{book.path.name}` {sid}（{book.sheet(sid).title}）"
              f" 行 {j.get('設計書根拠_行','-')} / 引用種別 {j.get('引用種別','')}")
            a(f"- 正本引用: 「{j.get('設計書根拠_引用','')}」")
            a(f"- 設計期待値: {j.get('設計書期待値','')}")
        else:
            a("- 正本根拠: なし")
        if j.get("画像確認メモ"):
            a(f"- 画像確認: {j['画像確認メモ']}")
        if j.get("現実装_参照"):
            a(f"- 現実装: `{j['現実装_参照']}`")
        if j.get("現実装_実態"):
            a(f"- 実装実態: {j['現実装_実態']}")
        a(f"- 判定根拠: {j.get('判定根拠','')}")
        a(f"- 確信度: {j.get('確信度','')} / 旧判定: {q['指摘区分']}・{q['旧_トリアージ区分']}")
        a("")
    path.write_text("\n".join(A) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["prepare", "build"])
    ap.add_argument("--doc", required=True, help="設計書キー（例: 0203）")
    args = ap.parse_args()
    if args.command == "prepare":
        cmd_prepare(args.doc)
    else:
        cmd_build(args.doc)


if __name__ == "__main__":
    main()
