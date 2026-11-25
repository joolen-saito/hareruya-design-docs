"""業務パターン×テストの〇表を作る（1行＝1回ずつ流すテスト1本）。

IPA「高信頼化ソフトウェアのための開発手法ガイドブック」6.3.1（表6-9〜6-11）の組み合わせ表の1行が1本のテスト、
6.3.2 の例外は行に1つずつ差し込んで別のテスト、という単位に合わせる。

テスト
  - 組み合わせ表を持つシナリオ：matrix.tsv の行（<シナリオID>/T01…）と、matrix.md の例外の差し込み（<シナリオID>/E1…。差し込む元の行の値を引き継ぐ）
  - 組み合わせ表を持たないシナリオ：シナリオ1本が1テスト（<シナリオID>）

〇の元（網羅マトリクス/<業務>/）
  level_map.tsv  マトリクス・因子・水準・値ID・備考   組み合わせ表の水準 → 〇表の値。その水準を持つ全部の行に〇
  exc_map.tsv    マトリクス・例外ID・値ID・備考        例外 → 〇表の値。その例外のテストだけに〇
  test_map.tsv   テストID・値ID・引用・備考            テストIDがシナリオIDなら、そのシナリオの全テストに〇（シナリオで1つに決まっている値）。
                                                        <シナリオID>/T01 なら、その1本だけ。引用はそのテスト（行）かシナリオ自身の本文から
  組み合わせ表のフォルダに selected.tsv（列：テストID・理由）があれば、載っているテストだけを実施するテストとして数える（通しシナリオを絞るため。2026-11-12 依頼者決定）。
  ほかに、factors.tsv の「シナリオのマトリクス」の値（出典が matrix の fl_table.tsv、引用が水準の文）は、道具が自動で対応を付ける。
  マトリクスは「通販/matrix」「店頭買取/matrix_UKA-01」のように user_scenario からの相対パスで書く。

ゲート
  - 1本のテストで、同じ業務条件（条件ID）に〇が2つ以上付いたら止める（1本のテストは条件ごとに値が1つ）
  - 引用・水準・例外が実在すること、値が factors にあり扱いが対象であること
  - シナリオ単位の〇（cond_map・pattern_map）と食い違わないこと：シナリオ単位で〇のある値は、そのシナリオのどれかのテストにも〇がある

使い方
  python3 tools/build_test_pattern_matrix.py tests [シナリオID]     テストの一覧（行の中身）を出す
  python3 tools/build_test_pattern_matrix.py check [業務 ...]
  uv run --with openpyxl python -I tools/build_test_pattern_matrix.py xlsx <出力.xlsx> [業務 ...]
"""
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_coverage_matrix import BIZ, OUT, US, norm, read, scenario_index  # noqa: E402
from build_pattern_matrix import ORDER, cid, columns, own_ids, shown_cols, strict_index, titles  # noqa: E402


# 1本のテストに複数の〇があってよい分類（選択肢ではない条件）
#   業務フローパターン：1本のテストが続けて通る流れの区切り（購入→発送準備→発送 など）
#   法令の表示：1回の購入で全部を確かめるチェック項目（最終確認画面の表示事項など）
# ほかに pattern_cols.tsv の「1本に複数」列が「可」の条件（理由は同じ行の備考に書く）
MULTI_OK_CLASSES = {"業務フローパターン", "法令の表示"}


def matrix_dirs():
    """マトリクスのフォルダ（user_scenario からの相対）→ シナリオID"""
    out = {}
    for d in sorted(US.rglob("matrix*")):
        if not d.is_dir() or "review" in d.parts or not (d / "matrix.tsv").exists():
            continue
        rel = str(d.relative_to(US))
        m = re.match(r"matrix_(U[A-Z]{2}-\d+)$", d.name)
        if m:
            out[rel] = m.group(1)
        elif rel == "通販/matrix":
            out[rel] = "UTS-01"
    return out


UNSELECTED = set()  # selected.tsv で実施しないとしたテスト


def load_tests():
    """テストID → dict(sid, kind, matrix, row{因子:水準}, text, base)"""
    tests = {}
    by_sid = defaultdict(list)
    mdirs = matrix_dirs()
    for rel, sid in mdirs.items():
        d = US / rel
        rows = list(csv.DictReader((d / "matrix.tsv").open(encoding="utf-8"), delimiter="\t"))
        lines = {l.split("\t", 1)[0]: l for l in (d / "matrix.tsv").read_text(encoding="utf-8").splitlines()[1:]}
        for r in rows:
            no = r.get("No.") or r.get("No")
            tid = f"{sid}/{no}"
            tests[tid] = dict(sid=sid, kind="行", matrix=rel, row={k: v for k, v in r.items() if k not in ("No.", "No", "水準ID")},
                              text=lines.get(no, ""), base=None)
            by_sid[sid].append(tid)
        exc = {e["例外ID"]: e for e in read(d / "exceptions.tsv")}
        md = (d / "matrix.md").read_text(encoding="utf-8") if (d / "matrix.md").exists() else ""
        for m in re.finditer(r"^\| ((?!T\d)[A-Z]+\d+) \| (T\d+) \|(.*)$", md, flags=re.M):
            eid, base = m.group(1), m.group(2)
            tid = f"{sid}/{eid}"
            btid = f"{sid}/{base}"
            e = exc.get(eid, {})
            tests[tid] = dict(sid=sid, kind="例外", matrix=rel, row=dict(tests.get(btid, {}).get("row", {})),
                              text="\t".join(e.values()) if e else m.group(0), base=btid)
            by_sid[sid].append(tid)
        # 実施するテストを絞った組み合わせ表（selected.tsv の「テストID」列。T01・E3 など）。
        # 載っていないテストは「実施しない」（行の水準は例外の引き継ぎにだけ使う）
        sel = d / "selected.tsv"
        if sel.exists():
            keep = {r["テストID"].strip() for r in read(sel)}
            for tid in by_sid[sid]:
                if tests[tid]["matrix"] == rel and tid.split("/")[1] not in keep:
                    UNSELECTED.add(tid)
    return tests, by_sid, mdirs


def all_sids(idx):
    return list(idx)


def fl_levels(rel):
    out = defaultdict(set)
    for r in read(US / rel / "fl_table.tsv"):
        out[r["因子"].strip()].add(r["水準"].strip())
    return out


def build_marks(biz, idx, tests, by_sid, mdirs):
    """(テストID, 値ID) の〇と、エラーを返す"""
    d = OUT / biz
    fac = {r["値ID"]: r for r in read(d / "factors.tsv")}
    errors = []
    marks = defaultdict(set)  # テストID → {値ID}
    why = {}

    def ok_value(vid, name):
        if vid not in fac:
            errors.append(f"{biz}/{name}: factors に無い値ID {vid}")
            return False
        if fac[vid]["扱い"] != "対象":
            errors.append(f"{biz}/{name}: 扱いが「{fac[vid]['扱い']}」の値に〇がある {vid}")
            return False
        return True

    level_rows = []
    # factors の「シナリオのマトリクス」の値は自動で対応を付ける
    for f in fac.values():
        src = (f.get("出典") or "").strip()
        m = re.search(r"scenario_test/user_scenario/(.+?)/fl_table\.tsv", src)
        if f["区分"] == "シナリオのマトリクス" and m and f["扱い"] == "対象":
            rel = m.group(1)
            fls = read(US / rel / "fl_table.tsv")
            lv = (f.get("引用") or f["値"]).strip()
            hit = [r for r in fls if r["水準"].strip() == lv]
            same = [r for r in hit if r["因子"].strip() == f["業務条件"].strip()]
            hit = same or (hit if len({r["因子"] for r in hit}) == 1 else [])
            if hit:
                level_rows.append(dict(マトリクス=rel, 因子=hit[0]["因子"].strip(), 水準=lv, 値ID=f["値ID"], 備考="自動"))
    level_rows += read(d / "level_map.tsv")
    for r in level_rows:
        rel, fa, lv, vid = r["マトリクス"].strip(), r["因子"].strip(), r["水準"].strip(), r["値ID"].strip()
        if rel not in mdirs:
            errors.append(f"{biz}/level_map: マトリクスが無い {rel}")
            continue
        if lv not in fl_levels(rel).get(fa, set()):
            errors.append(f"{biz}/level_map: {rel} の因子「{fa}」に水準「{lv}」が無い")
            continue
        if not ok_value(vid, "level_map"):
            continue
        sid = mdirs[rel]
        for tid in by_sid[sid]:
            t = tests[tid]
            if t["matrix"] == rel and t["row"].get(fa, "").strip() == lv:
                marks[tid].add(vid)
                why[(tid, vid)] = f"水準「{lv}」"
    for r in read(d / "exc_map.tsv"):
        rel, eid, vid = r["マトリクス"].strip(), r["例外ID"].strip(), r["値ID"].strip()
        if rel not in mdirs:
            errors.append(f"{biz}/exc_map: マトリクスが無い {rel}")
            continue
        tid = f"{mdirs[rel]}/{eid}"
        if tid not in tests:
            errors.append(f"{biz}/exc_map: 例外が無い {tid}")
            continue
        if ok_value(vid, "exc_map"):
            marks[tid].add(vid)
            why[(tid, vid)] = f"例外 {eid}"
    for r in read(d / "test_map.tsv"):
        tid, vid, q = r["テストID"].strip(), r["値ID"].strip(), (r.get("引用") or "").strip()
        sid = tid.split("/")[0]
        if sid not in idx:
            errors.append(f"{biz}/test_map: 実在しないシナリオ {sid}")
            continue
        if not ok_value(vid, "test_map"):
            continue
        if not q:
            errors.append(f"{biz}/test_map: 引用が空 {tid} {vid}")
            continue
        if "/" in tid:
            if tid not in tests:
                errors.append(f"{biz}/test_map: テストが無い {tid}")
                continue
            t = tests[tid]
            text = t["text"] + "\n" + (tests[t["base"]]["text"] if t["base"] else "") + "\n" + idx[sid][1]
            targets = [tid]
        else:
            text = idx[sid][1]
            targets = by_sid.get(sid) or [sid]
        if norm(q) not in norm(text):
            errors.append(f"{biz}/test_map: 引用が {tid} の本文に無い「{q[:40]}」")
            continue
        for t in targets:
            marks[t].add(vid)
            why[(t, vid)] = "共通" if "/" not in tid else "このテスト"
    # 例外のテストは、差し込む元の行の〇を引き継ぐ（行の水準は同じ）。例外そのものの〇は exc_map
    for tid, t in tests.items():
        if t["kind"] == "例外" and t["base"] in marks:
            for vid in marks[t["base"]]:
                if why.get((t["base"], vid), "").startswith("水準") or why.get((t["base"], vid)) == "共通":
                    marks[tid].add(vid)
    for tid in list(marks):  # 実施しないテストの〇は数えない
        if tid in UNSELECTED:
            del marks[tid]
    # 1本のテストで同じ条件に2つ以上の〇（選択肢の条件だけ。複数可の条件は除く）
    cls = {r["条件ID"].strip(): r for r in read(d / "pattern_cols.tsv")}
    multi = {c for c, r in cls.items()
             if r.get("分類", "").strip() in MULTI_OK_CLASSES or (r.get("1本に複数") or "").strip() == "可"}
    for tid, vs in marks.items():
        per = defaultdict(list)
        for v in vs:
            per[cid(fac[v])].append(v)
        for c, lst in per.items():
            if len(lst) > 1 and c not in multi:
                errors.append(f"{biz}: {tid} で条件 {c}（{fac[lst[0]]['業務条件']}）に〇が {len(lst)} つ {sorted(lst)}")
    # シナリオ単位の〇との食い違い
    l2 = defaultdict(set)
    for name in ("cond_map.tsv", "pattern_map.tsv"):
        for r in read(d / name):
            l2[r["シナリオID"].strip()].add(r["値ID"].strip())
    for sid, vs in l2.items():
        got = set()
        for t in by_sid.get(sid) or [sid]:
            got |= marks.get(t, set())
        for v in sorted(vs - got):
            if v in fac and fac[v]["扱い"] == "対象":
                errors.append(f"{biz}: シナリオ単位では {sid} に {v} の〇があるが、どのテストにも〇が無い")
    return fac, marks, why, errors


def scope_tests(biz, tests, by_sid, marks):
    mine = own_ids(biz)
    rows = []
    for sid in mine:
        rows += [t for t in (by_sid.get(sid) or [sid]) if t not in UNSELECTED]
    others = sorted({t for t in marks if t.split("/")[0] not in mine}, key=lambda t: (t.split("/")[0], t))
    return rows, others


def sort_key(t):
    m = re.match(r"(.+?)(?:/([A-Z]+)(\d+))?$", t)
    return (m.group(1), 0 if m.group(2) in ("T", None) else 1, m.group(2) or "", int(m.group(3) or 0))


def cmd_tests(sid=None):
    tests, by_sid, _ = load_tests()
    for tid in sorted(tests, key=sort_key):
        if sid and not tid.startswith(sid + "/"):
            continue
        t = tests[tid]
        mark = "実施しない" if tid in UNSELECTED else t["kind"]
        print(f"{tid}\t{mark}\t{t['matrix']}\t" + "｜".join(f"{k}={v}" for k, v in t["row"].items()))


def cmd_check(bizs):
    idx = strict_index(scenario_index())
    tests, by_sid, mdirs = load_tests()
    errors = []
    for biz in bizs:
        errors += build_marks(biz, idx, tests, by_sid, mdirs)[3]
    print("\n".join(errors) if errors else "OK")
    return errors


def cmd_xlsx(path, bizs):
    idx = strict_index(scenario_index())
    names = titles()
    tests, by_sid, mdirs = load_tests()
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    green = PatternFill("solid", fgColor="B6D7A8")
    red = PatternFill("solid", fgColor="F4CCCC")
    headfill = PatternFill("solid", fgColor="DDE5F0")
    thin = Side(style="thin", color="BBBBBB")
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(vertical="center", wrap_text=True)
    bold = Font(bold=True)

    wb = Workbook()
    guide = wb.active
    guide.title = "見方"
    for line in [
        ["業務パターン×テスト（〇表）"],
        [],
        ["行", "1回ずつ流すテスト1本。<シナリオID>/T01 は組み合わせ表の行、/E1 は例外を差し込んだテスト、シナリオIDだけのものは組み合わせ表の無いシナリオ1本。〇が1つも無いテストは出さない（テストの一覧は各シナリオの matrix_<シナリオID>/matrix.tsv）"],
        ["列", "業務条件の値。上から 分類（数量・金額・決済・キャンセル・返品など）→ 業務条件 → 値"],
        ["〇", "そのテストがその値で流れる。1本のテストでは、1つの業務条件に〇は1つだけ（道具が確かめる）。ただし選択肢でない条件（法令の表示＝毎回全部確かめる項目、ほか pattern_cols.tsv で「1本に複数」を可にした条件）は複数付く"],
        ["空欄", "そのテストでは通らない"],
        ["〇の数（最下行）", "0 の列は赤＝どのテストでも通していない抜け"],
        ["業務フローの流れ", "業務フローの Excel のパターン（起点から終点までの流れ）と、それをどのテストで通すかは、業務フローとの照合/業務パターンとシナリオの対応表.xlsx の「通すテスト」で見る（この表にはパターンの列を出さない）"],
        ["対象外の値", "対象外にした値（列）はこの表に出さない。理由は 網羅マトリクス/<業務>/factors.tsv の扱い・備考に残す"],
        ["フォルダの列", "そのテストがあるフォルダ。その業務のシナリオが上に、ほかのフォルダのテスト（通しシナリオなど）が下に並ぶ。どれも実施するテスト（1回流せば、どのシートの〇も確かめたことになる）"],
        ["根拠", "網羅マトリクス/<業務>/level_map.tsv（組み合わせ表の水準）・exc_map.tsv（例外）・test_map.tsv（シナリオで決まっている値）"],
        ["考え方", "IPA「高信頼化ソフトウェアのための開発手法ガイドブック」6.3.1 表6-9〜6-11（組み合わせ表の1行が1本のテスト）・6.3.2（例外は1つずつ差し込んで別のテスト）"],
    ]:
        guide.append(line)
    guide["A1"].font = Font(bold=True, size=14)
    guide.column_dimensions["A"].width = 18
    guide.column_dimensions["B"].width = 110
    total_gaps = 0
    for biz in bizs:
        fac, marks, why, errors = build_marks(biz, idx, tests, by_sid, mdirs)
        if errors:
            print("\n".join(errors[:50]))
            sys.exit(f"{biz}: ゲートで止まった（{len(errors)} 件）")
        cls = {r["条件ID"].strip(): r["分類"].strip() for r in read(OUT / biz / "pattern_cols.tsv")}
        facs = read(OUT / biz / "factors.tsv")
        cols = shown_cols(facs, cls)
        shown = {f["値ID"] for f in cols}
        mine, others = scope_tests(biz, tests, by_sid, marks)
        # 〇が1つも無い行は出さない（2026-11-25 依頼者「ノイズになる列と行は削除」）
        dropped = [t for t in mine + others if not (marks.get(t, set()) & shown)]
        mine = [t for t in mine if marks.get(t, set()) & shown]
        others = [t for t in others if marks.get(t, set()) & shown]
        ws = wb.create_sheet(biz)
        H = 3  # 見出しの行数：分類・業務条件・値（値ID・シナリオID・〇の数の列は出さない：2026-11-25）
        ws.cell(1, 1, "分類").font = bold
        ws.cell(2, 1, "業務条件").font = bold
        for c_, v in enumerate(["テストID", "フォルダ", "シナリオ"], 1):
            ws.cell(3, c_, v).font = bold
        C0 = 4
        for j, f in enumerate(cols):
            c = C0 + j
            ws.cell(1, c, cls.get(cid(f), "その他"))
            ws.cell(2, c, f["業務条件"])
            ws.cell(3, c, f["値"])
        keys = {1: [cls.get(cid(f), "その他") for f in cols], 2: [(cls.get(cid(f), "その他"), cid(f)) for f in cols]}
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
        for tid in sorted(mine, key=sort_key) + others:
            sid = tid.split("/")[0]
            ws.cell(r, 1, tid)
            ws.cell(r, 2, idx[sid][0] if sid in idx else "")
            ws.cell(r, 3, names.get(sid, ""))
            for j, f in enumerate(cols):
                cell = ws.cell(r, C0 + j)
                if f["値ID"] in marks.get(tid, ()):
                    cell.value = "〇"
                    cell.fill = green
                    counts[j] += 1
                cell.alignment = center
                cell.border = box
            for k in (1, 2, 3):
                ws.cell(r, k).border = box  # 色は付けない（灰色は削除の意味に取られる）
            ws.cell(r, 2).alignment = left
            ws.cell(r, 3).alignment = left
            r += 1
        ws.cell(r, 1, "〇の数").font = bold
        ws.cell(r, 3, "0 の列（赤）は抜け").font = bold
        gaps = 0
        for j, f in enumerate(cols):
            cell = ws.cell(r, C0 + j, counts[j])
            cell.alignment = center
            cell.border = box
            cell.font = bold
            if counts[j] == 0:
                cell.fill = red
                ws.cell(3, C0 + j).fill = red
                gaps += 1
        total_gaps += gaps
        for row in range(1, H + 1):
            for j in range(len(cols)):
                cell = ws.cell(row, C0 + j)
                if cell.fill != red:
                    cell.fill = headfill
                cell.alignment = center
                cell.border = box
                cell.font = Font(bold=row <= 2, size=9 if row >= 3 else 10)
        ws.row_dimensions[3].height = 90
        for k, w in zip("ABC", (14, 22, 34)):
            ws.column_dimensions[k].width = w
        for j in range(len(cols)):
            ws.column_dimensions[get_column_letter(C0 + j)].width = 9
        ws.freeze_panes = ws.cell(H + 1, C0)
        print(f"{biz}: テスト {len(mine)}本（他フォルダ {len(others)}本）・列 {len(cols)}・抜け {gaps}"
              + (f"・〇の無い行を出さない {len(dropped)}本（{' '.join(dropped[:40])}{' …' if len(dropped) > 40 else ''}）" if dropped else ""))
    wb.save(path)
    print(f"{path} を作った（抜け {total_gaps} 列）")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    if cmd == "tests":
        cmd_tests(sys.argv[2] if len(sys.argv) > 2 else None)
    elif cmd == "check":
        sys.exit(1 if cmd_check(sys.argv[2:] or list(BIZ)) else 0)
    elif cmd == "xlsx":
        cmd_xlsx(sys.argv[2], sys.argv[3:] or list(BIZ))


if __name__ == "__main__":
    main()
