#!/usr/bin/env python3
"""FINDINGS_DETAIL.md の全表を 1 枚のフラット TSV に変換する。

- 表ごとに列構成が違うので、共通スキーマに射影する
- 元の値は改変しない（改行はセル内で全角スペース区切りに畳むのみ）
- 行数は各見出しの「（N件）」と突き合わせて検証する
"""
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent / "FINDINGS_DETAIL.md"
DST = Path(__file__).resolve().parent / "FINDINGS_DETAIL.tsv"

COLUMNS = [
    "セクション",
    "見出し",
    "書番",
    "シート",
    "識別ID",
    "項目",
    "設計値",
    "pf値",
    "ee値",
    "出典",
    "備考",
]

# セクションごとの、元表の列 -> 共通スキーマの列 への射影
MAPPING = {
    "1-1": ["書番", "シート", "識別ID", "項目", "設計値", "pf値", "ee値", "出典", "備考"],
    "1-2": ["書番", "シート", "識別ID", "項目", "設計値", "pf値", "ee値", "出典", "備考"],
    "1-3": ["書番", "シート", "識別ID", "項目", "設計値", "pf値", "ee値", "出典", "備考"],
    # 設計 / ee実効上限 / 根拠定数
    "2-1": ["書番", "シート", "識別ID", "項目", "設計値", "ee値", "出典"],
    "2-2": ["書番", "シート", "識別ID", "項目", "設計値", "ee値", "出典"],
    # 設計必須 / pf_NotBlank / ee_NotBlank / ee出典
    "3-1": ["書番", "シート", "識別ID", "項目", "設計値", "pf値", "ee値", "出典"],
    "3-2": ["書番", "シート", "識別ID", "項目", "設計値", "pf値", "ee値", "出典"],
    # Entity.列 / Form上限 / DB列長 / Form出典 / DB出典
    "4-1": ["項目", "pf値", "ee値", "出典", "備考"],
    # Entity.列 / DB列長 / Form出典 / 到達可能性
    "4-2": ["項目", "ee値", "出典", "備考"],
    # Entity.列 / pf Form上限 / ee DB
    "4-3": ["項目", "pf値", "ee値"],
    # ラベル / 書番をまたいだ値
    "5-1": ["項目", "設計値"],
    # 種別 / 内容
    "5-2": ["項目", "備考"],
    # トラック / 確定不能 / 母数
    "6": ["項目", "pf値", "ee値"],
}

# 共通スキーマ上の各列が、そのセクションで実際に何を指すか（凡例用）
SEMANTICS = {
    "2-1": "ee値=ee実効上限 / 出典=根拠定数",
    "2-2": "ee値=ee実効上限 / 出典=根拠定数",
    "3-1": "設計値=設計必須 / pf値=pf_NotBlank / ee値=ee_NotBlank",
    "3-2": "設計値=設計必須 / pf値=pf_NotBlank / ee値=ee_NotBlank",
    "4-1": "項目=Entity.列 / pf値=Form上限 / ee値=DB列長 / 出典=Form出典 / 備考=DB出典",
    "4-2": "項目=Entity.列 / ee値=DB列長 / 出典=Form出典 / 備考=到達可能性",
    "4-3": "項目=Entity.列 / pf値=pf Form上限 / ee値=ee DB",
    "5-1": "項目=ラベル / 設計値=書番をまたいだ値",
    "5-2": "項目=種別 / 備考=内容",
    "6": "項目=トラック / pf値=確定不能 / ee値=母数",
}


def split_row(line):
    """マークダウンの行をセルに分解する。最後の `|` の後ろの注記も 1 セルとして拾う。"""
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    cells = [c.strip() for c in s.split("|")]
    while cells and cells[-1] == "":
        cells.pop()
    return cells


def clean(cell):
    cell = cell.replace("**", "").replace("`", "").strip()
    cell = cell.replace("　", " ").strip()  # 注記直前の全角スペース
    return cell


def main():
    lines = SRC.read_text(encoding="utf-8").splitlines()

    # 表内で折り返された行を直前の行に連結する
    joined = []
    in_table = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|"):
            in_table = True
            joined.append(line)
            continue
        if in_table and stripped and not stripped.startswith("#"):
            joined[-1] = joined[-1].rstrip() + " " + stripped
            continue
        in_table = False
        joined.append(line)

    rows = []
    counts = {}
    section = heading = None
    expected = None
    state = "idle"  # idle -> header -> sep -> body

    head_re = re.compile(r"^#{1,3}\s+(\d+(?:-\d+)?)\.\s*(.+?)\s*$")

    for line in joined:
        stripped = line.strip()
        m = head_re.match(stripped)
        if m:
            section, heading = m.group(1), m.group(2)
            state = "idle"
            n = re.search(r"（(\d+)\s*(?:件|ラベル)）", heading)
            expected = int(n.group(1)) if n else None
            if expected is not None:
                counts[section] = [expected, 0]
            continue

        if not stripped.startswith("|"):
            if state == "body":
                state = "idle"
            continue

        if section not in MAPPING:
            continue

        if state == "idle":
            state = "header"  # 見出し行は捨てる（共通スキーマに射影するため）
            continue
        if state == "header":
            state = "body"  # 区切り行
            continue

        cells = [clean(c) for c in split_row(line)]
        target = MAPPING[section]
        rec = {c: "" for c in COLUMNS}
        rec["セクション"] = section
        rec["見出し"] = heading
        for i, col in enumerate(target):
            if i < len(cells) and cells[i]:
                rec[col] = (rec[col] + " / " + cells[i]) if rec[col] else cells[i]
        # 射影しきれない余りのセルは備考に退避（取りこぼし防止）
        if len(cells) > len(target):
            extra = " / ".join(c for c in cells[len(target):] if c)
            if extra:
                rec["備考"] = (rec["備考"] + " / " + extra) if rec["備考"] else extra
        rows.append([rec[c] for c in COLUMNS])
        if section in counts:
            counts[section][1] += 1

    for cell_row in rows:
        for cell in cell_row:
            if "\t" in cell or "\n" in cell:
                sys.exit(f"タブ/改行が残っている: {cell!r}")

    out = ["\t".join(COLUMNS)]
    out += ["\t".join(r) for r in rows]
    DST.write_text("\n".join(out) + "\n", encoding="utf-8")

    # 元表が複数列をまとめ書きしている箇所（行数 != 件数）
    condensed = {"4-3": (5, "BaseInfo.email01〜04=4列, good_traded/message=2列 をまとめ書き")}

    ng = False
    for sec, (exp, got) in sorted(counts.items()):
        if sec in condensed and got == condensed[sec][0]:
            print(f"OK {sec}: 見出し={exp}件 出力={got}行（{condensed[sec][1]}）")
            continue
        mark = "OK " if exp == got else "NG "
        if exp != got:
            ng = True
        print(f"{mark}{sec}: 見出し={exp} 出力={got}")
    for sec in ("4-3", "5-2", "6"):
        got = sum(1 for r in rows if r[0] == sec)
        print(f"--  {sec}: 出力={got}（件数明記なし）")
    print(f"合計 {len(rows)} 行 -> {DST}")
    print("凡例:")
    for sec, note in SEMANTICS.items():
        print(f"  {sec}: {note}")
    sys.exit(1 if ng else 0)


if __name__ == "__main__":
    main()
