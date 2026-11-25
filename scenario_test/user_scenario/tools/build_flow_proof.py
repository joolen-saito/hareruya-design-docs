"""業務フローの Excel の要素を1行ずつ、通すシナリオ・テストか、対象外の理由と決めた人に結び付けた、証明用の対応表を作る。

2026-11-24 依頼者「シナリオと業務フローをマッピングして抜け漏れがないことを証明したい」。

段（Excel の要素 → 結び付け先）
  業務一覧        02 業務一覧の BO業務の行 → シナリオのフォルダ（業務フローとの照合/business_list_map.tsv）
  パターン・工程・分かれ道・条件の文
                  verify_flow_coverage.py が書く 02〜05 の TSV（Excel を直接読んだ照合）
  画面マトリクス  01 業務フロー画面マトリクスの〇（業務×画面）→ その業務の流れを通るシナリオが、その画面を使う文
                  （業務フローとの照合/screen_rows.tsv：画面マトリクスの行 → 業務フローの流れ、screen_map.tsv：〇ごとの判定）

止まる条件（check・xlsx とも、終了コード1）
  - 照合（verify_flow_coverage.py）に抜けか書き起こしの不一致がある
  - Excel の要素に結び付けの行が無い・余分な行がある
  - 「通る」の行にシナリオが無い・実在しない、画面マトリクスの引用がそのシナリオの文に無い、そのシナリオがその業務の流れを通らない
  - 「対象外」の行に区分・理由・決めた人が無い
  - 判定が「通る」「対象外」以外（抜け・要確認・判断待ち）

使い方（scenario_test/user_scenario で）
  python3 -I tools/build_flow_proof.py check
  python3 -I tools/build_flow_proof.py screens            画面マトリクスの対応だけを確かめる（照合は流し直さない）
  uv run --with openpyxl python -I tools/build_flow_proof.py xlsx 業務フローとの照合/業務フローとシナリオの対応表.xlsx
      止まる条件に当たると Excel を書かない。--draft を付けると、抜けを残したまま「下書き」と書いた Excel を書く（依頼者に抜けを見せるとき）
"""
import csv
import re
import subprocess
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow_from_xlsx as fx  # noqa: E402
import verify_flow_coverage as vf  # noqa: E402
from build_coverage_matrix import BIZ, US, norm, read, scenario_index  # noqa: E402

DEST = US / "業務フローとの照合"
SID = re.compile(r"U[A-Z]{2}-\d+")
VAL = re.compile(r"(" + "|".join(map(re.escape, sorted(BIZ, key=len, reverse=True))) + r")/([A-Z]+\d*-[A-Z]?\d+):([^・]+)")
HEAD = ["No", "段", "業務フロー（シート）", "行", "番号・画面", "内容", "判定", "通すシナリオ", "通すテスト", "根拠", "対象外の区分", "対象外の理由", "決めた人"]

# 対象外の区分 → 決めた人（2026-11-24 依頼者の決定。依頼者の決定で外した値は値ごとの日付も足す）
DECIDER = {
    "システムを触らない": "依頼者 2026-11-24「システムを触らないなら足さなくて良い」",
    "刷新後に使わない運用": "依頼者 2026-11-24「外したままで良い」",
    "フェーズ2見送り": "設計書のフェーズ2見送り・依頼者 2026-11-24「外したままで良い」",
    "依頼者の決定で外した値": "依頼者（{date}の決定）・2026-11-24「外したままで良い」",
    "見出し（作業ではない）": "照合の決まり（見出しの行はパターンの段で照合する）",
    "分かれ道でない（説明・注記）": "こちらの判定（codex 3巡で確かめた 2026-11-20）",
}
# 画面マトリクスだけの区分（決めた人は screen_map.tsv の行に書く）。2026-11-24 依頼者「良い」で抜け55件の扱いを決めたときに3つ足した
SCREEN_CATS = set(DECIDER) | {"廃止と決まった画面", "その移動では使えない画面", "業務フローに流れが無い業務", "画面マトリクスの書き誤り"}


def nz(s):
    """画面名の比べ方：空白・改行・「・」「/」を除く"""
    return re.sub(r"[\s・/／　]", "", s or "")


def tsv(name):
    return read(DEST / name)


def decision_dates(memo):
    """メモの「2026-11-09 依頼者決定」「11/07 依頼者決定」から日付（2026-MM-DD にそろえる）"""
    out = set()
    for d in re.findall(r"(20\d\d-\d\d-\d\d|\d\d/\d\d) ?依頼者決定", memo or ""):
        out.add(d if d.startswith("20") else "2026-" + d.replace("/", "-"))
    return sorted(out)


def decider_for(cat, memo="", errors=None, where=""):
    d = DECIDER[cat]
    if "{date}" in d:
        dates = decision_dates(memo)
        if not dates and errors is not None:
            errors.append(f"{where}：依頼者の決定で外した値なのに、メモに決定の日付が無い")
        d = d.format(date="・".join(dates) or "日付不明")
    return d


# ---- テスト単位の〇（値 → テストID）
def value_tests():
    import build_test_pattern_matrix as t
    from build_pattern_matrix import strict_index
    tests, by_sid, mdirs = t.load_tests()
    sidx = strict_index(scenario_index())
    out = defaultdict(set)
    for biz in BIZ:
        _, marks, _, _ = t.build_marks(biz, sidx, tests, by_sid, mdirs)
        for tid, vs in marks.items():
            if tid in t.UNSELECTED:
                continue
            for v in vs:
                out[(biz, v)].add(tid)
    return out


def parse_vals(s):
    return [(m.group(1), m.group(2), m.group(3)) for m in VAL.finditer(s or "")]


def tests_for(vals, scen, vt):
    sids = set(SID.findall(scen or ""))
    out = set()
    for b, v, how in vals:
        if how == "対象":
            out |= {t for t in vt.get((b, v), ()) if t.split("/")[0] in sids}
    return sorted(out)


def val_text(vals, ftext):
    return "／".join(f"{b}/{v}「{ftext.get((b, v), '')[:60]}」" for b, v, how in vals if how == "対象")


# ---- 対象外の区分
def cat_cond(r):
    m, how = r["メモ"], r["工程の扱い"]
    if how == "見出し":
        return "見出し（作業ではない）"
    if how == "範囲外":
        return "刷新後に使わない運用"
    if how in ("システムの外", "（番号なし）"):
        return "システムを触らない"
    if "フェーズ2" in m:
        return "フェーズ2見送り"
    if "依頼者決定" in m or "他層" in m:
        return "依頼者の決定で外した値"
    if "システムを触らない" in m or "人の判定：システムの外" in m:
        return "システムを触らない"
    if "画面の操作の違い" in m:
        return "依頼者の決定で外した値"
    if "分かれ道でない" in m:
        return "分かれ道でない（説明・注記）"
    return None


def cat_step(r):
    return {"見出し": "見出し（作業ではない）", "システムの外": "システムを触らない", "範囲外": "刷新後に使わない運用",
            "（番号なし）": "システムを触らない"}.get(r["扱い"])


def cat_branch(r):
    m = r["メモ"]
    if "フェーズ2" in m:
        return "フェーズ2見送り"
    if "asis" in m:
        return "刷新後に使わない運用"
    return None


def cat_pattern(r):
    return "システムを触らない" if "システムを触らない" in r["メモ"] else None


# ---- Excel の読み取り（業務一覧・画面マトリクス）
def sheet_cells(no):
    src, sheet = fx.md_source(no)
    z = zipfile.ZipFile(fx.XLSX[src])
    return sheet, fx._cells(z, fx._sheet_paths(z)[sheet], fx._shared(z))


def business_rows():
    sheet, cells = sheet_cells("02")
    hr = next(r for (r, c), v in cells.items() if v == "BO業務")
    cols = {v: c for (r, c), v in cells.items() if r == hr}
    out, dept, sub = [], "", ""
    for r in sorted({r for r, _ in cells if r > hr}):
        no = cells.get((r, cols["＃"]), "")
        if not re.fullmatch(r"\d+", no):
            continue
        dept = cells.get((r, cols["部署"]), dept)
        sub = cells.get((r, cols["サブグループ"]), sub)
        g = lambda k: cells.get((r, cols[k]), "")  # noqa: E731
        out.append(dict(R=r, no=no, dept=dept, sub=sub, biz=g("BO業務"), func=g("該当機能"), about=g("業務概要"), note=g("業務補足")))
    return sheet, out


def screen_cells():
    sheet, cells = sheet_cells("01")
    hr = next(r for (r, c), v in cells.items() if v == "在庫検索一覧")
    screens = {c: v for (r, c), v in cells.items() if r == hr}
    out = []
    for r in sorted({r for r, _ in cells if r > hr + 1}):
        line = {c: v for (rr, c), v in cells.items() if rr == r}
        first = min(line)
        if first in screens:
            continue
        texts = [line[c] for c in sorted(line) if c not in screens]
        for c in sorted(line):
            if c in screens and line[c] == "〇":
                out.append(dict(R=f"R{r}", no=texts[0], work=" ".join(texts[1:2]), screen=re.sub(r"\s+", " ", screens[c])))
    return sheet, out


def flow_walkers(spec, smap):
    """「12:R48・13:R37」→ その流れ（見出しの工程から次の見出しの手前まで）の工程を通るシナリオ"""
    out, bad = set(), []
    for part in [p for p in spec.split("・") if p]:
        no, start = part.split(":R")
        sec = [s for s in vf.sections_of(no) if s[0] == int(start)]
        if not sec:
            bad.append(part)
            continue
        out |= vf.walked_in(vf.md_name(no), sec, smap)
    return out, bad


# ---- 段ごとの行
def rows_business(idx, errors):
    sheet, brs = business_rows()
    m = {r["#"]: r for r in tsv("business_list_map.tsv")}
    out = []
    for b in brs:
        mp = m.pop(b["no"], None)
        content = f"{b['dept']}／{b['sub']}／{b['biz']}（該当機能：{b['func'].replace(chr(10), ' ')}）{b['about']}"
        if not mp:
            errors.append(f"業務一覧 #{b['no']} {b['biz']}：business_list_map.tsv に行が無い")
            out.append(["業務一覧", sheet, f"R{b['R']}", b["no"], content, "抜け", "", "", "", "", "", ""])
            continue
        if mp["BO業務"] != b["biz"]:
            errors.append(f"業務一覧 #{b['no']}：BO業務が Excel（{b['biz']}）と違う（{mp['BO業務']}）")
        sids = []
        for fold in [f for f in mp["シナリオのフォルダ"].split("、") if f]:  # フォルダ名に「・」があるので「、」で区切る
            got = sorted(s for s, (f, _) in idx.items() if f == fold)
            if not got:
                errors.append(f"業務一覧 #{b['no']}：シナリオのフォルダ {fold} にシナリオが無い")
            sids += got
        flows = [f for f in mp["業務フロー"].split("・") if f]
        for f in flows:
            if f not in fx.FLOW_MD:
                errors.append(f"業務一覧 #{b['no']}：業務フロー {f} が照合の対象（{fx.FLOW_MD}）に無い")
        why = (f"業務フロー {'・'.join(flows)} のパターン・工程・分かれ道・条件の文は、この表のそれぞれの段で1つずつ照合"
               if flows else "業務フローの図は無い（業務補足に「業務フローは無し」）。シナリオは設計書から作った")
        out.append(["業務一覧", sheet, f"R{b['R']}", b["no"], content, "通る" if sids else "抜け", "・".join(sids), "",
                    f"シナリオのフォルダ {mp['シナリオのフォルダ']}（{len(sids)}本）。{why}。{mp.get('備考', '')}".rstrip("。") + "。", "", "", ""])
    for k in m:
        errors.append(f"business_list_map.tsv #{k}：Excel の業務一覧に無い行")
    return out


def rows_pattern(errors):
    out = []
    for r in tsv("02_パターン.tsv"):
        cat = cat_pattern(r) if r["判定"] == "対象外" else None
        # 図に工程が描かれていないパターン（通販 tobe 17 の13）は、表のシナリオと人の判定で通す
        scen = r["流れの工程を通るシナリオ"] or (r["表のシナリオ"] if r["判定"] == "通る" and "人の判定" in r["メモ"] else "")
        out.append(["パターン", r["業務フロー"], "", r["番号"], f"{r['パターン']}（図の流れ：{r['図の流れ'] or '図に工程が無い'}）", r["判定"],
                    scen, "",
                    f"パターンの表（各業務の scenario_list.md「業務フローパターンの網羅」）のシナリオ：{r['表のシナリオ']}。{r['メモ']}" if r["判定"] == "通る" else "",
                    cat or "", r["メモ"] if r["判定"] == "対象外" else "", decider_for(cat, r["メモ"]) if cat else ""])
    return out


def rows_step(smap, errors):
    out = []
    for r in tsv("03_工程.tsv"):
        cat = cat_step(r) if r["判定"] == "対象外" else None
        quotes = "／".join(f"{s}「{q[:80]}」" for s, q in smap.get((r["業務フロー"], r["R"]), []))
        out.append(["工程", r["業務フロー"], r["R"], r["#"], "｜".join(x for x in (r["作業概要"], r["作業内容（先頭）"]) if x), r["判定"], r["シナリオ"], "",
                    (f"工程の対応表（網羅マトリクス/<業務>/step_map.tsv）の引用：{quotes}" if quotes else f"人の判定：{r['メモ']}") if r["判定"] == "通る" else "",
                    cat or "", (r["理由"] or r["メモ"]) if r["判定"] == "対象外" else "", decider_for(cat) if cat else ""])
    return out


def rows_branch(vt, ftext, errors):
    out, last = [], {}
    for r in tsv("04_分かれ道.tsv"):
        cat = cat_branch(r) if r["判定"] == "対象外" else None
        if r["判定"] == "対象外" and not cat and r["メモ"].startswith("同上"):
            cat = last.get((r["業務フロー"], r["判断の行"]))  # 「同上」は同じ判断の前の矢印と同じ区分
        last[(r["業務フロー"], r["判断の行"])] = cat
        vals = parse_vals(r["業務条件の値"])
        scen = r["流れの中で値を通るシナリオ"]
        why = f"業務条件の値 {val_text(vals, ftext)} が、この判断のある流れを通るシナリオで〇（〇表）" if vals and scen else f"人の対応：{r['メモ']}"
        out.append(["分かれ道", r["業務フロー"], r["判断の行"], r["判断"], f"{r['判断']} → {r['行き先']}（{r['行き先のレーン']}）", r["判定"],
                    scen, "・".join(tests_for(vals, scen, vt)), why if r["判定"] == "通る" else "",
                    cat or "", r["メモ"] if r["判定"] == "対象外" else "", decider_for(cat) if cat else ""])
    return out


def rows_cond(vt, ftext, errors):
    out = []
    rows = tsv("05_条件の文.tsv")
    memo_of = {(r["業務フロー"][:2], r["R"]): r["メモ"] for r in rows}
    for r in rows:
        cat = cat_cond(r) if r["判定"] == "対象外" else None
        memo = r["メモ"]
        m = re.search(r"(?:(\d\d) )?(R\d+) と同じ", memo)
        if cat == "依頼者の決定で外した値" and not decision_dates(memo) and m:  # 「06 R93 と同じ」は指す行の決定の日付を使う
            memo += "／" + memo_of.get((m.group(1) or r["業務フロー"][:2], m.group(2)), "")
        vals = parse_vals(r["引用する業務条件の値"])
        scen = r["流れの中で値を通るシナリオ"]
        why = f"業務条件の値 {val_text(vals, ftext)} が、この文のある流れを通るシナリオで〇（〇表）" if vals and scen else r["メモ"]
        out.append(["条件の文", r["業務フロー"], r["R"], f"工程 {r['工程']}", r["文"], r["判定"], scen, "・".join(tests_for(vals, scen, vt)),
                    why if r["判定"] == "通る" else "", cat or "", r["メモ"] if r["判定"] == "対象外" else "",
                    decider_for(cat, memo, errors, f"条件の文 {r['業務フロー']} {r['R']}") if cat else ""])
    return out


def rows_screen(idx, smap, errors):
    sheet, cells = screen_cells()
    srows = {r["行"]: r for r in tsv("screen_rows.tsv")}
    smaps = defaultdict(list)
    for r in tsv("screen_map.tsv"):
        smaps[(r["行"], nz(r["画面"]))].append(r)
    out, seen = [], set()
    for c in cells:
        key = (c["R"], nz(c["screen"]))
        seen.add(key)
        sr = srows.get(c["R"])
        if not sr:
            errors.append(f"画面マトリクス {c['R']}：screen_rows.tsv に行が無い")
            continue
        content = f"{sr['業務フロー対応番号']} {sr['業務']}"
        ms = smaps.get(key, [])
        if len(ms) != 1:
            errors.append(f"画面マトリクス {c['R']} {c['screen']}：screen_map.tsv の行が {len(ms)} 件")
            out.append(["画面マトリクス", sheet, c["R"], c["screen"], content, "抜け", "", "", "", "", "", ""])
            continue
        m = ms[0]
        verdict, sid, q = m["判定"], m["シナリオID"].strip(), m["引用"].strip()
        if verdict == "通る":
            walkers, bad = flow_walkers(sr["業務フローの流れ"], smap)
            if bad:
                errors.append(f"画面マトリクス {c['R']}：screen_rows.tsv の流れ {bad} が業務フローの見出しに無い")
            if sid not in idx:
                errors.append(f"画面マトリクス {c['R']} {c['screen']}：シナリオ {sid} が無い")
            elif not q or norm(q) not in norm(idx[sid][1]):
                errors.append(f"画面マトリクス {c['R']} {c['screen']}：引用が {sid} の文に無い「{q[:40]}」")
            if sr["業務フローの流れ"] and sid not in walkers:
                errors.append(f"画面マトリクス {c['R']} {c['screen']}：{sid} はこの業務の流れ（{sr['業務フローの流れ']}）を通らない（通るのは {sorted(walkers)}）")
            out.append(["画面マトリクス", sheet, c["R"], c["screen"], content, "通る", sid, "",
                        f"{sid}「{q}」。{m.get('備考', '')}".rstrip("。") + "。", "", "", ""])
        elif verdict == "対象外":
            if m["対象外の区分"] not in SCREEN_CATS:
                errors.append(f"画面マトリクス {c['R']} {c['screen']}：対象外の区分「{m['対象外の区分']}」が決まりに無い（{sorted(SCREEN_CATS)}）")
            if not m["理由"].strip() or not m["決めた人"].strip():
                errors.append(f"画面マトリクス {c['R']} {c['screen']}：対象外の理由か決めた人が空")
            out.append(["画面マトリクス", sheet, c["R"], c["screen"], content, "対象外", "", "", "", m["対象外の区分"], m["理由"], m["決めた人"]])
        else:
            out.append(["画面マトリクス", sheet, c["R"], c["screen"], content, verdict, "", "", "", "", m["理由"], ""])
    for key in set(smaps) - seen:
        errors.append(f"screen_map.tsv {key}：Excel の画面マトリクスに〇が無い")
    return out


def build(rerun=True, only_screens=False):
    errors = []
    if rerun and not only_screens:
        p = subprocess.run([sys.executable, "-I", str(US / "tools" / "verify_flow_coverage.py")], cwd=US, capture_output=True, text=True)
        if p.returncode != 0:
            errors.append("照合（verify_flow_coverage.py）が止まった：\n" + p.stdout[-2000:] + p.stderr[-2000:])
    idx = scenario_index()
    _, smap, facs, _ = vf.load_maps()
    if only_screens:
        return rows_screen(idx, smap, errors), errors
    ftext = {(f["業務"], f["値ID"]): f["値"] for f in facs}
    vt = value_tests()
    rows = (rows_business(idx, errors) + rows_pattern(errors) + rows_step(smap, errors) + rows_branch(vt, ftext, errors)
            + rows_cond(vt, ftext, errors) + rows_screen(idx, smap, errors))
    for r in rows:
        where = f"{r[0]} {r[1]} {r[2]} {r[3]}"
        if r[5] not in ("通る", "対象外"):
            errors.append(f"{where}：判定が「{r[5]}」")
        elif r[5] == "通る":
            bad = [s for s in SID.findall(r[6]) if s not in idx]
            if not SID.findall(r[6]) or bad:
                errors.append(f"{where}：通すシナリオが無い・実在しない {bad}")
        elif not (r[9] and r[10] and r[11]):
            errors.append(f"{where}：対象外の区分・理由・決めた人のどれかが空")
    return [[i + 1] + r for i, r in enumerate(rows)], errors


def summary(rows):
    c = Counter((r[1], r[6]) for r in rows)
    k = Counter((r[1], r[10], r[12]) for r in rows if r[6] == "対象外")
    return c, k


def report(rows, errors):
    c, k = summary(rows)
    for s in ["業務一覧", "パターン", "工程", "分かれ道", "条件の文", "画面マトリクス"]:
        print(f"{s}: " + "・".join(f"{v}{c[(s, v)]}" for v in ("通る", "対象外", "抜け") if c[(s, v)]))
    for e in errors:
        print("NG", e)
    print("OK" if not errors else f"NG {len(errors)}件")


def cmd_xlsx(path, rows, errors, draft=False):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
    head = PatternFill("solid", fgColor="DDEBF7")
    wb = Workbook()
    ws0 = wb.active
    ws0.title = "見方"
    c, k = summary(rows)
    lines = [
        ["業務フローとシナリオの対応表" + (f"（下書き：抜け・結び付いていない要素が {len(errors)} 件ある。証明はまだ済んでいない）" if errors else "")],
        ["何の表か", "業務フローの Excel（在庫に関連する_業務一覧_業務フロー.xlsx・02_業務一覧_業務フロー.xlsx）の要素を1行ずつ、通すシナリオ・テストか、対象外の理由と決めた人に結び付けた表。Excel の要素が1つでも結び付いていなければ、作る道具（tools/build_flow_proof.py）が止まる"],
        ["段", "業務一覧（BO業務の行）／パターン（業務フローパターンの表と図の流れ）／工程（# の行）／分かれ道（判断の図形から出る矢印1本ずつ）／条件の文（「〜の場合」などの文）／画面マトリクス（業務×画面の〇）"],
        ["通る", "そのシナリオがその流れを通る（工程の対応表の引用がシナリオの文にそのままある）。分かれ道・条件の文は、当てはまる業務条件の値が全部、その流れを通るシナリオで〇。画面マトリクスは、その業務の流れを通るシナリオの文にその画面を使うところがある"],
        ["対象外", "業務フローにあってシナリオで通していないもの。区分ごとに依頼者が決めた（2026-11-24）。理由は「対象外の理由」の列"],
        ["通すテスト", "組み合わせ表の行（<シナリオID>/T01）と例外（/E1）。〇表（網羅マトリクス/パターン×テスト.xlsx）と同じ"],
        ["根拠のファイル", "scenario_test/user_scenario/業務フローとの照合/（照合結果.md・01〜05_*.tsv・branch_map.tsv・judgements.tsv・business_list_map.tsv・screen_rows.tsv・screen_map.tsv）、網羅マトリクス/<業務>/"],
        [],
        ["段", "通る", "対象外", "抜け", "合計"],
    ]
    for s in ["業務一覧", "パターン", "工程", "分かれ道", "条件の文", "画面マトリクス"]:
        n = sum(v for (ss, _), v in c.items() if ss == s)
        lines.append([s, c[(s, "通る")], c[(s, "対象外")], n - c[(s, "通る")] - c[(s, "対象外")], n])
    lines += [[], ["対象外の区分", "段", "数", "決めた人"]]
    for (s, cat, who), n in sorted(k.items(), key=lambda x: (x[0][1], x[0][0])):
        lines.append([cat, s, n, who])
    for ln in lines:
        ws0.append(ln)
    ws0["A1"].font = Font(bold=True, size=14)
    for r in ws0.iter_rows():
        for cell in r:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
    ws0.column_dimensions["A"].width = 26
    ws0.column_dimensions["B"].width = 90
    for col in "CDE":
        ws0.column_dimensions[col].width = 30
    ws = wb.create_sheet("対応表")
    ws.append(HEAD)
    for cell in ws[1]:
        cell.fill = head
        cell.font = Font(bold=True)
    for r in rows:
        ws.append(r)
    widths = [6, 10, 22, 7, 16, 50, 8, 26, 26, 60, 18, 50, 34]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for r in ws.iter_rows(min_row=2):
        for cell in r:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(HEAD))}{ws.max_row}"
    wb.save(path)
    print(f"{path} を作った（{len(rows)}行）")


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("check", "screens", "xlsx"):
        sys.exit(__doc__)
    cmd = sys.argv[1]
    rows, errors = build(only_screens=(cmd == "screens"))
    if cmd == "screens":
        rows = [[i + 1] + r for i, r in enumerate(rows)]
    report(rows, errors)
    if cmd == "xlsx":
        if len(sys.argv) < 3:
            sys.exit(__doc__)
        draft = "--draft" in sys.argv[3:]
        if errors and not draft:
            print("止まる条件に当たったので Excel は書かない（抜けを見せる下書きは --draft）")
        else:
            cmd_xlsx(sys.argv[2], rows, errors, draft)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
