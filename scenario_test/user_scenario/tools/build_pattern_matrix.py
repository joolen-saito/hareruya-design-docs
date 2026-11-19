"""業務パターン×シナリオの〇表を作る。

行＝シナリオ、列＝業務パターン（数量・金額・決済・キャンセル・返品などの業務条件の値）。
そのシナリオがその値を通すなら〇、通さないなら空欄。〇が1つも無い列が抜け。

入力（網羅マトリクス/<業務>/）
  factors.tsv      業務条件の値（既存）
  cond_map.tsv     値ごとに通るシナリオ（既存。抜けの判定用に1本ずつ）。〇にも数える
  pattern_cols.tsv 列の並べ方：条件ID・分類（数量・金額・決済…）。ここに無い条件は「その他」
  pattern_map.tsv  値ID・シナリオID・引用・備考。cond_map に無い〇を全部足す
引用は、そのシナリオ自身の本文（scenario_list の自分の行・L4・matrix_<ID>/）にある文をそのまま写す。
ゲートは build_coverage_matrix.py と同じ。

使い方
  python3 tools/build_pattern_matrix.py dump <シナリオID>     そのシナリオ自身の本文を出す（引用を探す用）
  python3 tools/build_pattern_matrix.py check [業務 ...]
  uv run --with openpyxl python -I tools/build_pattern_matrix.py xlsx <出力.xlsx> [業務 ...]
"""
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_coverage_matrix import BIZ, OUT, US, check_quote, read, scenario_index  # noqa: E402

# 分類の並び（pattern_cols.tsv の分類はこの中から。無いものは最後）
ORDER = ["数量", "金額", "決済", "配送", "注文者・会員", "ポイント", "商品", "在庫・欠品", "キャンセル", "返品",
         "入金", "業務フローパターン", "業務フローの分岐", "エラー・例外", "画面の操作", "法令の表示", "その他"]


def titles():
    out = {}
    lists = list(US.glob("*/scenario_list.md")) + list(US.glob("通しシナリオ/*/scenario_list.md"))
    for f in lists:
        for m in re.finditer(r"^\| (U[A-Z]{2}-\d+) \| ([^|]+)\|", f.read_text(encoding="utf-8"), flags=re.M):
            out.setdefault(m.group(1), m.group(2).strip())
    return out


def own_ids(biz):
    f = US / biz / "scenario_list.md"
    return list(dict.fromkeys(re.findall(r"^\| (U[A-Z]{2}-\d+) \|", f.read_text(encoding="utf-8"), flags=re.M)))


ROW = re.compile(r"^\| (U[A-Z]{2}-\d+) \|")


def strict_index(idx):
    """〇の表では、ほかのシナリオの行（先頭の列が別のID）にある文を、そのシナリオの根拠にしない。"""
    out = {}
    for sid, (folder, text) in idx.items():
        lines = [l for l in text.splitlines() if not (ROW.match(l) and ROW.match(l).group(1) != sid)]
        out[sid] = (folder, "\n".join(lines))
    return out


def load(biz, idx):
    d = OUT / biz
    facs = read(d / "factors.tsv")
    fac = {r["値ID"]: r for r in facs}
    errors = []
    marks = defaultdict(set)  # 値ID → {シナリオID}
    for name in ("cond_map.tsv", "pattern_map.tsv"):
        for r in read(d / name):
            vid = r["値ID"].strip()
            if vid not in fac:
                errors.append(f"{biz}/{name}: factors に無い値ID {vid}")
                continue
            if fac[vid]["扱い"] != "対象":
                errors.append(f"{biz}/{name}: 扱いが「{fac[vid]['扱い']}」の値に〇がある {vid}")
            errors += check_quote(biz, name, r, idx)
            marks[vid].add(r["シナリオID"].strip())
    if not errors:  # テスト単位の〇表の〇も、そのシナリオの〇に数える
        from build_coverage_matrix import test_level_marks
        for vid, sids in test_level_marks(biz).items():
            if vid in fac and fac[vid]["扱い"] == "対象":
                marks[vid] |= sids
    cls = {r["条件ID"].strip(): r["分類"].strip() for r in read(d / "pattern_cols.tsv")}
    for k, v in cls.items():
        if v not in ORDER:
            errors.append(f"{biz}/pattern_cols: 分類「{v}」は ORDER に無い（{k}）")
    return facs, marks, cls, errors


def cid(f):
    return f.get("条件ID") or f["値ID"].rsplit("-", 1)[0]


def columns(facs, cls):
    first = {}
    for i, f in enumerate(facs):
        first.setdefault(cid(f), i)
    rank = {c: i for i, c in enumerate(ORDER)}
    return sorted(facs, key=lambda f: (rank.get(cls.get(cid(f), "その他"), len(ORDER)), first[cid(f)],
                                       facs.index(f)))


def cmd_check(bizs):
    idx = strict_index(scenario_index())
    errors = []
    for biz in bizs:
        errors += load(biz, idx)[3]
    print("\n".join(errors) if errors else "OK")
    return errors


def cmd_xlsx(path, bizs):
    idx = strict_index(scenario_index())
    names = titles()
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    green = PatternFill("solid", fgColor="B6D7A8")
    red = PatternFill("solid", fgColor="F4CCCC")
    grey = PatternFill("solid", fgColor="EEEEEE")
    headfill = PatternFill("solid", fgColor="DDE5F0")
    thin = Side(style="thin", color="BBBBBB")
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    vert = Alignment(horizontal="center", vertical="bottom", wrap_text=True, text_rotation=0)
    left = Alignment(vertical="center", wrap_text=True)
    bold = Font(bold=True)

    wb = Workbook()
    guide = wb.active
    guide.title = "見方"
    for line in [
        ["業務パターン×シナリオ（〇表）"],
        [],
        ["行", "シナリオ（業務の流れ1本）。上がその業務のシナリオ、下は通しシナリオなど他のフォルダのシナリオ（フォルダの列に書く。どれも実施する）"],
        ["列", "業務パターン。上から 分類（数量・金額・決済・キャンセル・返品など）→ 業務条件 → 値"],
        ["〇", "そのシナリオがその値を通す（シナリオ本文に根拠の文がある）"],
        ["空欄", "そのシナリオでは通さない"],
        ["〇の数（最下行）", "0 の列は赤＝どのシナリオでも通していない抜け"],
        ["対象外の列", "対象外にした値はこの表に出さず「対象外の列」シートに理由つきで並べる"],
        ["根拠", "〇の根拠の文は 網羅マトリクス/<業務>/pattern_map.tsv・cond_map.tsv の「引用」"],
    ]:
        guide.append(line)
    guide["A1"].font = Font(bold=True, size=14)
    guide.column_dimensions["A"].width = 18
    guide.column_dimensions["B"].width = 100

    total_gaps = 0
    excluded = []
    cls_all = {}
    for biz in bizs:
        facs, marks, cls, errors = load(biz, idx)
        if errors:
            print("\n".join(errors))
            sys.exit(f"{biz}: ゲートで止まった")
        cols = [f for f in columns(facs, cls) if f["扱い"] == "対象"]  # 対象外の列は「対象外の列」シートへ
        excluded += [(biz, f) for f in columns(facs, cls) if f["扱い"] != "対象"]
        cls_all.update({(biz, k): v for k, v in cls.items()})
        mine = own_ids(biz)
        others = sorted({s for v in marks.values() for s in v} - set(mine),
                        key=lambda s: (idx[s][0], s))
        ws = wb.create_sheet(f"{biz}")
        H = 4  # 見出しの行数：分類・業務条件・値・値ID
        ws.cell(1, 1, "分類").font = bold
        ws.cell(2, 1, "業務条件").font = bold
        ws.cell(3, 1, "値").font = bold
        ws.cell(4, 1, "シナリオID").font = bold
        ws.cell(4, 2, "フォルダ").font = bold
        ws.cell(4, 3, "シナリオ").font = bold
        ws.cell(4, 4, "〇の数").font = bold
        C0 = 5
        for j, f in enumerate(cols):
            c = C0 + j
            ws.cell(1, c, cls.get(cid(f), "その他"))
            ws.cell(2, c, f["業務条件"])
            ws.cell(3, c, f["値"] + ("（対象外）" if f["扱い"] != "対象" else ""))
            ws.cell(4, c, f["値ID"])
        # 分類・業務条件の結合
        keys = {1: [cls.get(cid(f), "その他") for f in cols],
                2: [(cls.get(cid(f), "その他"), cid(f)) for f in cols]}
        for row in (1, 2):
            k = keys[row]
            start = 0
            for j in range(1, len(cols) + 1):
                if j == len(cols) or k[j] != k[start]:
                    if j - 1 > start:
                        ws.merge_cells(start_row=row, start_column=C0 + start, end_row=row, end_column=C0 + j - 1)
                    start = j
        r = H + 1
        counts = defaultdict(int)
        band = None
        for sid in mine + others:
            if sid in others and band is None:
                band = r
            ws.cell(r, 1, sid)
            ws.cell(r, 2, idx[sid][0] if sid in idx else "")
            ws.cell(r, 3, names.get(sid, ""))
            n = 0
            for j, f in enumerate(cols):
                cell = ws.cell(r, C0 + j)
                if sid in marks.get(f["値ID"], ()):
                    cell.value = "〇"
                    cell.fill = green
                    counts[j] += 1
                    n += 1
                elif f["扱い"] != "対象":
                    cell.fill = grey
                cell.alignment = center
                cell.border = box
            ws.cell(r, 4, n).alignment = center
            for k in (1, 2, 3, 4):
                ws.cell(r, k).border = box  # 色は付けない（灰色は削除の意味に取られる）
            ws.cell(r, 2).alignment = left
            ws.cell(r, 3).alignment = left
            r += 1
        ws.cell(r, 1, "〇の数").font = bold
        ws.cell(r, 3, "0 の列（赤）は抜け").font = bold
        gaps = 0
        for j, f in enumerate(cols):
            cell = ws.cell(r, C0 + j, counts[j] if f["扱い"] == "対象" else "対象外")
            cell.alignment = center
            cell.border = box
            cell.font = bold
            if f["扱い"] != "対象":
                cell.fill = grey
            elif counts[j] == 0:
                cell.fill = red
                ws.cell(3, C0 + j).fill = red
                gaps += 1
        total_gaps += gaps
        for row in range(1, H + 1):
            for j in range(len(cols)):
                cell = ws.cell(row, C0 + j)
                if cell.fill != red:
                    cell.fill = grey if cols[j]["扱い"] != "対象" else headfill
                cell.alignment = center if row != 3 else vert
                cell.border = box
                cell.font = Font(bold=row <= 2, size=9 if row >= 3 else 10)
        ws.row_dimensions[3].height = 90
        ws.column_dimensions["A"].width = 10
        ws.column_dimensions["B"].width = 22
        ws.column_dimensions["C"].width = 42
        ws.column_dimensions["D"].width = 6
        for j in range(len(cols)):
            ws.column_dimensions[get_column_letter(C0 + j)].width = 9
        ws.freeze_panes = ws.cell(H + 1, C0)
        print(f"{biz}: シナリオ {len(mine)}本（他フォルダ {len(others)}本）・列 {len(cols)}・抜け {gaps}")
    wx = wb.create_sheet("対象外の列")
    wx.append(["業務", "分類", "業務条件", "値ID", "値", "扱い", "理由（備考）"])
    for biz, f in excluded:
        wx.append([biz, cls_all.get((biz, cid(f)), "その他"), f["業務条件"], f["値ID"], f["値"], f["扱い"], f.get("備考") or ""])
    for c in wx[1]:
        c.font = Font(bold=True)
    for row in wx.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    for col, w in zip("ABCDEFG", (16, 14, 30, 10, 40, 10, 90)):
        wx.column_dimensions[col].width = w
    wx.freeze_panes = "A2"
    wx.auto_filter.ref = wx.dimensions
    wb.save(path)
    print(f"{path} を作った（抜け {total_gaps} 列）")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    if cmd == "dump":
        idx = strict_index(scenario_index())
        sid = sys.argv[2]
        print(f"# {sid}（{idx[sid][0]}）\n{idx[sid][1]}")
    elif cmd == "check":
        sys.exit(1 if cmd_check(sys.argv[2:] or list(BIZ)) else 0)
    elif cmd == "xlsx":
        cmd_xlsx(sys.argv[2], sys.argv[3:] or list(BIZ))


if __name__ == "__main__":
    main()
