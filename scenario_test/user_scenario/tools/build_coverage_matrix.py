"""抜け漏れを確かめる網羅マトリクス（業務フローの工程×シナリオ、業務条件×シナリオ）を作る。

使い方:
  python build_coverage_matrix.py steps            # 業務フローから工程の一覧（<業務>/steps.tsv）を作る（機械）
  python build_coverage_matrix.py check            # 対応表のゲートだけ流す
  python build_coverage_matrix.py xlsx <出力.xlsx> # ゲートを通したうえで Excel を作る（openpyxl が要る）

置き場所: scenario_test/user_scenario/網羅マトリクス/<業務>/
  steps.tsv       業務フローの工程（機械）。列: 業務フロー / R / # / 作業概要 / 作業内容
  step_scope.tsv  工程の扱い（人）。列: 業務フロー / R / 扱い（対象・システムの外・範囲外） / 理由
                  載っていない工程は「対象」とみなす
  step_map.tsv    工程を通るシナリオ（人）。列: 業務フロー / R / シナリオID / 引用 / 備考
  factors.tsv     業務条件と値（人）。列: 区分 / 条件ID / 業務条件 / 値ID / 値 / 扱い / 出典 / 引用 / 備考
                  扱いは 対象・適用外・他業務・他層・判断待ち
  cond_map.tsv    値を通るシナリオ（人）。列: 値ID / シナリオID / 引用 / 備考

ゲート（外れると止まる）:
  - steps.tsv の工程が業務フローの今の行と一致する（業務フローが変わったら steps を作り直す）
  - step_map・step_scope の (業務フロー, R) が steps にある
  - シナリオIDが実在し、引用がそのシナリオ自身のテキスト（scenario_list.md のそのIDの行、そのIDの L4、matrix_<ID>/、
    通しシナリオはフォルダ全体。業務フローパターンの網羅・対象外・判断待ち・食い違い・関係の節は数えない）の中にそのままある
  - 扱いが「対象」の値・工程にだけ対応を付ける
"""
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

US = Path(__file__).resolve().parents[1]
ST = US.parent
MD = ST / "markdown"
OUT = US / "網羅マトリクス"

# 業務 → 業務フローのファイル番号（check_pattern_coverage.py と同じ）
BIZ = {
    "通販": ["16", "17"],
    "店頭受取受注管理": ["05"],
    "店頭買取": ["06", "07"],
    "イベント管理": ["08"],
    "商品登録・編集": ["09", "10"],
    "価格管理": ["11"],
    "在庫管理": ["12", "13"],
    "ネット買取": ["14"],
    "仕入れ業務": ["15"],
    "デッキ登録": ["18"],
}

STEP = re.compile(r"^- \*\*R(\d+)\*\*: \*\*\[＃\]\*\* ([^｜]+?)(?:　｜　(.*))?$")
SID = re.compile(r"U[A-Z]{2}-\d+")


def flow_file(no):
    return next(MD.glob(f"{no}_*.md"))


def extract_steps(no):
    """[＃] のある行を全部工程にする（作業概要・作業内容が無い行、間にレーンの列がある行も拾う）。"""
    f = flow_file(no)
    out = []
    for line in f.read_text(encoding="utf-8").splitlines():
        m = STEP.match(line.strip())
        if not m:
            continue
        r, num, rest = m.groups()
        cells = (rest or "").split("　｜　")
        summary, body, other = "", "", []
        for c in cells:
            if c.startswith("**[作業概要]**"):
                summary = c.replace("**[作業概要]**", "").strip()
            elif c.startswith("**[作業内容]**"):
                body = c.replace("**[作業内容]**", "").strip()
            elif c.strip():
                other.append(re.sub(r"\*\*\[([^\]]+)\]\*\*", r"[\1]", c).strip())
        if not body and other:
            body = " ".join(other)
        out.append([f.name, "R" + r, num.strip(), summary, body[:200]])
    return out


def read(path):
    if not path.exists():
        return []
    return list(csv.DictReader(path.open(encoding="utf-8"), delimiter="\t"))


def write(path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    w = csv.writer(path.open("w", encoding="utf-8", newline=""), delimiter="\t", lineterminator="\n")
    w.writerow(header)
    w.writerows(rows)


EXCLUDE_SECTIONS = ("業務フローパターンの網羅", "対象外", "判断待ち", "食い違い", "今の成果物との関係",
                    "既存のシナリオ", "今のシナリオとの関係", "閉じたときに残ったもの")


def own_lines(path, sid=None):
    """ファイルの行のうち、除外する節（業務フローの写し・対象外・判断待ち・食い違い・関係）に無い行。
    sid を渡すと、その ID を含む行だけ。"""
    out, skip = [], False
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("## "):
            skip = any(k in line for k in EXCLUDE_SECTIONS)
            continue
        if skip:
            continue
        if sid is None or re.search(r"(?<![A-Z0-9-])" + re.escape(sid) + r"(?!\d)", line):
            out.append(line)
    return out


def scenario_index():
    """シナリオID → (フォルダ名, そのシナリオ自身のテキスト)

    そのシナリオ自身のテキスト＝
      - scenario_list.md・legal_check.md のうち、そのIDを含む行（除外する節を除く）
      - ファイル名がそのIDで始まる L4（例: UPM-01_*.md）
      - matrix_<ID>/ の中のファイル（通販の matrix/ は UTS-01、見本 US-TSUHAN-* は UTS-01）
      - 通しシナリオ（1フォルダ1本）は、フォルダの全ファイルの除外する節を除く行
    """
    idx = {}
    lists = list(US.glob("*/scenario_list.md")) + list(US.glob("通しシナリオ/*/scenario_list.md"))
    for f in lists:
        d = f.parent
        folder = str(d.relative_to(US))
        ids = re.findall(r"^\| (U[A-Z]{2}-\d+) \|", f.read_text(encoding="utf-8"), flags=re.M)
        files = [p for p in d.rglob("*") if p.is_file() and p.suffix in (".md", ".tsv") and "review" not in p.parts]
        for sid in ids:
            parts = []
            if folder.startswith("通しシナリオ"):
                for p in files:
                    parts += own_lines(p)
            else:
                for name in ("scenario_list.md", "legal_check.md"):
                    if (d / name).exists():
                        parts += own_lines(d / name, sid)
                for p in files:
                    rel = p.relative_to(d)
                    top = rel.parts[0]
                    if top.startswith(sid + "_") or top == f"matrix_{sid}" \
                            or (sid == "UTS-01" and (top == "matrix" or top.startswith("US-TSUHAN-"))):
                        parts.append(p.read_text(encoding="utf-8", errors="ignore"))
            idx[sid] = (folder, "\n".join(parts))
    return idx


def norm(s):
    return re.sub(r"\s+", "", s or "")


def gate():
    errors = []
    idx = scenario_index()
    for biz, nos in BIZ.items():
        d = OUT / biz
        cur = {(r[0], r[1]): r for no in nos for r in extract_steps(no)}
        saved = {(r["業務フロー"], r["R"]): r for r in read(d / "steps.tsv")}
        if set(cur) != set(saved):
            errors.append(f"{biz}: steps.tsv が業務フローと合わない（steps を作り直す）")
        for name in ("step_scope.tsv", "step_map.tsv"):
            for r in read(d / name):
                if (r["業務フロー"], r["R"]) not in cur:
                    errors.append(f"{biz}/{name}: 業務フローに無い工程 {r['業務フロー']} {r['R']}")
        scope = {(r["業務フロー"], r["R"]): r["扱い"] for r in read(d / "step_scope.tsv")}
        for r in read(d / "step_map.tsv"):
            key = (r["業務フロー"], r["R"])
            if scope.get(key, "対象") != "対象":
                errors.append(f"{biz}/step_map: 扱いが「{scope[key]}」の工程に対応がある {key}")
            errors += check_quote(biz, "step_map", r, idx)
        fac = {r["値ID"]: r for r in read(d / "factors.tsv")}
        for r in read(d / "cond_map.tsv"):
            if r["値ID"] not in fac:
                errors.append(f"{biz}/cond_map: factors に無い値ID {r['値ID']}")
                continue
            if fac[r["値ID"]]["扱い"] != "対象":
                errors.append(f"{biz}/cond_map: 扱いが「{fac[r['値ID']]['扱い']}」の値に対応がある {r['値ID']}")
            errors += check_quote(biz, "cond_map", r, idx)
    return errors, idx


def check_quote(biz, name, r, idx):
    sid = r["シナリオID"].strip()
    if sid not in idx:
        return [f"{biz}/{name}: 実在しないシナリオID {sid}"]
    q = r.get("引用", "").strip()
    if not q:
        return [f"{biz}/{name}: 引用が空 {sid}"]
    if norm(q) not in norm(idx[sid][1]):
        return [f"{biz}/{name}: 引用が {sid} 自身の行・L4・マトリクスに無い（{idx[sid][0]}）「{q[:40]}」"]
    return []


def cmd_steps():
    for biz, nos in BIZ.items():
        rows = [r for no in nos for r in extract_steps(no)]
        write(OUT / biz / "steps.tsv", ["業務フロー", "R", "#", "作業概要", "作業内容"], rows)
        print(f"{biz}: 工程 {len(rows)}")


def folder_of(sid, idx):
    return idx[sid][0]


def cmd_xlsx(path):
    errors, idx = gate()
    if errors:
        print("\n".join(errors))
        sys.exit("ゲートで止まった")
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    folders = sorted({v[0] for v in idx.values()}, key=lambda x: (x.startswith("通しシナリオ"), x))
    fill = {
        "通る": PatternFill("solid", fgColor="D9EAD3"),
        "抜け": PatternFill("solid", fgColor="F4CCCC"),
        "判断待ち": PatternFill("solid", fgColor="FFF2CC"),
        "other": PatternFill("solid", fgColor="EEEEEE"),
        "cell": PatternFill("solid", fgColor="B6D7A8"),
    }
    head = Font(bold=True)
    wrap = Alignment(wrap_text=True, vertical="top")
    wb = Workbook()
    summary = wb.active
    summary.title = "集計"
    summary.append(["業務", "工程（対象）", "工程 通る", "工程 抜け", "工程 システムの外・範囲外",
                    "条件の値（対象）", "値 通る", "値 抜け", "値 判断待ち", "値 適用外・他業務・他層"])
    gaps = []

    ws = wb.create_sheet("工程×シナリオ")
    ws.append(["業務", "業務フロー", "R", "#", "作業概要", "作業内容", "扱い", "判定"] + folders + ["理由・備考"])
    wc = wb.create_sheet("業務条件×シナリオ")
    wc.append(["業務", "区分", "業務条件", "値ID", "値", "扱い", "判定"] + folders + ["出典・備考"])
    for biz in BIZ:
        d = OUT / biz
        steps = read(d / "steps.tsv")
        scope = {(r["業務フロー"], r["R"]): r for r in read(d / "step_scope.tsv")}
        smap = defaultdict(list)
        for r in read(d / "step_map.tsv"):
            smap[(r["業務フロー"], r["R"])].append(r["シナリオID"].strip())
        st = defaultdict(int)
        for s in steps:
            key = (s["業務フロー"], s["R"])
            sc = scope.get(key, {}).get("扱い", "対象")
            ids = sorted(set(smap.get(key, [])))
            judge = "通る" if ids else ("抜け" if sc == "対象" else sc)
            st[judge] += 1
            cells = []
            for fo in folders:
                cells.append("・".join(i for i in ids if folder_of(i, idx) == fo))
            ws.append([biz, s["業務フロー"], s["R"], s["#"], s["作業概要"], s["作業内容"], sc, judge] + cells
                      + [scope.get(key, {}).get("理由", "")])
            if judge == "抜け":
                gaps.append(["工程", biz, f"{s['業務フロー']} {s['R']} {s['#']}", s["作業概要"]])
        facs = read(d / "factors.tsv")
        cmap = defaultdict(list)
        for r in read(d / "cond_map.tsv"):
            cmap[r["値ID"]].append(r["シナリオID"].strip())
        ct = defaultdict(int)
        for f in facs:
            ids = sorted(set(cmap.get(f["値ID"], [])))
            judge = "通る" if ids else ("抜け" if f["扱い"] == "対象" else f["扱い"])
            ct[judge] += 1
            cells = ["・".join(i for i in ids if folder_of(i, idx) == fo) for fo in folders]
            wc.append([biz, f["区分"], f["業務条件"], f["値ID"], f["値"], f["扱い"], judge] + cells
                      + [((f.get("出典") or "") + " " + (f.get("備考") or "")).strip()])
            if judge == "抜け":
                gaps.append(["業務条件", biz, f["値ID"], f"{f['業務条件']}：{f['値']}"])
        n_scope = sum(1 for s in steps if scope.get((s["業務フロー"], s["R"]), {}).get("扱い", "対象") == "対象")
        summary.append([biz, n_scope, st["通る"], st["抜け"], len(steps) - n_scope,
                        sum(1 for f in facs if f["扱い"] == "対象"), ct["通る"], ct["抜け"], ct["判断待ち"],
                        sum(v for k, v in ct.items() if k in ("適用外", "他業務", "他層"))])
    wg = wb.create_sheet("抜けの一覧")
    wg.append(["種類", "業務", "工程・値", "内容"])
    for g in gaps:
        wg.append(g)

    for sheet, judge_col, first_folder in ((ws, 8, 9), (wc, 7, 8)):
        for row in sheet.iter_rows(min_row=2):
            j = row[judge_col - 1].value
            row[judge_col - 1].fill = fill.get(j, fill["other"])
            for c in row[first_folder - 1:first_folder - 1 + len(folders)]:
                if c.value:
                    c.fill = fill["cell"]
            for c in row:
                c.alignment = wrap
        for c in sheet[1]:
            c.font = head
            c.alignment = Alignment(wrap_text=True, vertical="center")
        sheet.freeze_panes = sheet.cell(row=2, column=first_folder)
        sheet.auto_filter.ref = sheet.dimensions
        for i in range(1, sheet.max_column + 1):
            sheet.column_dimensions[get_column_letter(i)].width = 14
    for sheet in (summary, wg):
        for c in sheet[1]:
            c.font = head
        for i in range(1, sheet.max_column + 1):
            sheet.column_dimensions[get_column_letter(i)].width = 18
    wb.save(path)
    print(f"{path} を作った（抜け {len(gaps)} 件）")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    if cmd == "steps":
        cmd_steps()
    elif cmd == "check":
        errors, _ = gate()
        print("\n".join(errors) if errors else "OK")
        sys.exit(1 if errors else 0)
    elif cmd == "xlsx":
        cmd_xlsx(sys.argv[2])


if __name__ == "__main__":
    main()
