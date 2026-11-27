"""業務フローの＃とシナリオの紐づけ（Excel）を作る。

2026-11-25 依頼者「店頭受取受注管理シートの＃の番号と関連付けができるとどのシナリオがどの業務に紐づいているのかわかる」
→「新しいファイルを作って、そちらで紐づけがわかるようにして」。

続けて「まず、シナリオIDがどの業務の＃に紐づくのか一覧にしてほしい。これが大元の一覧。それを詳細化したのが今回のリスト」：
別のファイル「シナリオと業務の紐づけ（大元）.xlsx」（同日「別のファイルに分けて」）に、シナリオ1本＝1行で、業務一覧（02_業務一覧_業務フロー.xlsx の「業務一覧」の＃1〜13）の
どの業務に紐づくかを並べる。紐づけは2通り：(a) シナリオのフォルダがその業務のフォルダ（business_list_map.tsv）、
(b) その業務の業務フローのシートの工程・画面マトリクスの〇を通す（下の詳しいシートと同じ）。

業務フローの Excel（在庫に関連する_業務一覧_業務フロー.xlsx・02_業務一覧_業務フロー.xlsx）のシートごとに、Excel の左の
「＃」「作業概要」の列と同じ並びで 1行＝工程1つ にし、その工程を通すシナリオを並べる。業務フロー画面マトリクスは Excel と同じ
形（業務×画面）で、〇 の代わりに通すシナリオを書く。最後のシートはシナリオから見た表（シナリオ → 通す工程・画面マトリクスの〇）。

中身（どの工程・〇をどのシナリオが通すか、対象外の理由と決めた人）は証明用の対応表（tools/build_flow_proof.py の段「工程」
「画面マトリクス」）と同じで、並べ方だけ変える。道筋は 業務パターンとシナリオの対応表.xlsx の道筋（routes/*.tsv）。

2026-11-26 依頼者「店頭買取、店頭買取（tobe）が重複している。（tobe）があるシートを優先して、(tobe)シートがなければ、ついていないシートを
元にシナリオを書く」：(tobe) つきの4組は、元にするシートだけを出す（OTHER。店頭買取・在庫管理は3行目の注記に合わせて (tobe) の無い方）。
証明用の対応表は両方のシートを全部載せたまま。

使い方（scenario_test/user_scenario で）:
  uv run --with openpyxl python -I tools/build_step_table.py check
  uv run --with openpyxl python -I tools/build_step_table.py xlsx 業務フローとの照合/業務フローの＃とシナリオの紐づけ.xlsx 業務フローとの照合/シナリオと業務の紐づけ（大元）.xlsx

止まる条件（1つでも当たると Excel を書かない）:
  - 証明用の対応表の道具の確かめが止まる
  - 03_工程.tsv の工程（見出し以外）に、証明用の対応表の行が無い
  - 通る工程に通すシナリオが無い・シナリオの名前が scenario_list.md に無い
  - 画面マトリクスの業務フロー対応番号が Excel と screen_rows.tsv で違う・流れが業務フローの見出しに無い
  - 画面マトリクスの〇（証明用の対応表の行）が、表のどのセルにも入らない・Excel の〇に証明用の行が無い
  - 業務一覧の行が business_list_map.tsv と合わない（＃・BO業務）・業務フローの番号がどの業務にも無い
"""
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_flow_proof as bp  # noqa: E402
import flow_from_xlsx as fx  # noqa: E402
import verify_flow_coverage as vf  # noqa: E402
from build_coverage_matrix import US, scenario_index  # noqa: E402
from build_route_table import load_routes, scenario_name, sheet_cells, step_of, step_titles  # noqa: E402
import tobe_sheets as ts  # noqa: E402

DEST = US / "業務フローとの照合"
SID = re.compile(r"U[A-Z]{2}-\d+")
ROWS = re.compile(r"R(\d+)")
STEP_HEAD = ["＃", "作業概要", "判定", "通すシナリオ", "通すテスト", "道筋（業務パターンとシナリオの対応表）", "対象外の区分", "対象外の理由", "決めた人"]
# 通すテスト（2026-11-26 依頼者「シナリオが業務フローに基づいて抜け漏れなくテストできることがゴール」）：証明用の対応表の通すテストと同じ（その工程を引く通るの道筋のテストのうち、その工程を通すシナリオのもの。<シナリオID>/T01 は組み合わせ表の行、/EX1 は例外、IDだけはマトリクスの無いシナリオ）
BIZ_HEAD = ["シナリオ", "シナリオの名前", "フォルダ", "業務一覧の＃（02_業務一覧_業務フロー.xlsx のシート「業務一覧」）", "業務一覧の業務（＃ BO業務（部署））",
            "業務フローの Excel のファイル名 ／ シート名（通す工程の数）", "備考"]
# 2026-11-25 依頼者「Excelのファイル名とシート名を出力してほしい」：業務フローの Excel は2つあり、同じ名前のシート（店頭受取受注管理・
#   在庫管理など）が両方に入っている（中身が違うものもある）。どちらのファイルのどのシートかを書く
SCN_HEAD = ["シナリオ", "シナリオの名前", "フォルダ", "通す工程（業務フローのシート・＃・作業概要）", "画面マトリクスで通す〇（業務フロー対応番号・業務：画面）"]
# (tobe) つきのシートの組でどちらを元にするか（2026-11-26）は tobe_sheets.py（証明用の対応表・業務パターンとシナリオの対応表と同じ）
OTHER, BASE_NOTE = ts.OTHER, ts.BASE_NOTE


def sheet_note(no, kept, st, titles):
    """シートの1行目に足す：(tobe) の組のどちらを元にしたか"""
    pair = {b: o for o, (b, _, _) in OTHER.items()}
    if no in pair:
        why = f"3行目の注記「{BASE_NOTE[no]}」" if no in BASE_NOTE else "(tobe) のシートを優先"
        return f"（「{fx.md_source(pair[no])[1]}」との組。このシートを元にする。{why}）"
    if no in OTHER:
        base, _, exc = OTHER[no]
        heads = [titles[x] for x in sorted(kept) if st[x]["#"] not in ("", "（番号なし）") and "-" not in st[x]["#"]]  # パターンの先頭の行（見出しでないものもある：在庫管理 (tobe) の 14）
        what = "・".join(heads) if not exc else "・".join(titles[x] for x in sorted(exc)) + "（" + "。".join(exc.values()) + "）"
        return f"（このシートは元にしない。元にするのは「{fx.md_source(base)[1]}」。ここには、そちらに無い {what} だけを出す）"
    return ""


def tsv(name):
    with open(DEST / name, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def ordered(xs):
    return list(dict.fromkeys(xs))


def build():
    proof, errors = bp.build(rerun=False)
    proof = [r[1:] for r in proof]   # No を外す：段・業務フロー・行・番号/画面・内容・判定・通すシナリオ・通すテスト・根拠・区分・理由・決めた人
    idx = scenario_index()
    names = {}

    def label(sid):
        if sid not in names:
            names[sid] = scenario_name(idx[sid][0], sid) if sid in idx else ""
        return names[sid]

    pstep = {(r[1], int(r[2][1:])): r for r in proof if r[0] == "工程"}
    steps = defaultdict(dict)
    for r in tsv("03_工程.tsv"):
        steps[r["業務フロー"]][int(r["R"][1:])] = r

    # 道筋：routes/*.tsv の Excel の行を、その行を含む工程に直す
    route_at = defaultdict(list)
    for rt in load_routes():
        keys = sorted(steps.get(rt["業務フロー"], {}))
        for k in ordered(step_of(keys, int(x)) for x in ROWS.findall(rt["Excelの行"])):
            if k is not None:
                route_at[(rt["業務フロー"], k)].append(rt["道筋"] + ("（対象外）" if rt["判定"] == "対象外" else ""))

    by_sid = defaultdict(lambda: {"steps": [], "screens": [], "count": defaultdict(int), "flows": set()})
    sheets, titles_by_no, kept_by_no, dropped = [], {}, {}, defaultdict(list)
    for flow in sorted(steps):
        no = flow[:2]
        src, sheet = fx.md_source(no)
        book = fx.XLSX[src].name
        st = steps[flow]
        titles = titles_by_no[no] = step_titles(no, st)
        kept = kept_by_no[no] = ts.kept_rows(no, st, errors)
        for x in sorted(set(st) - kept):  # 元にしないので出さない工程を通すシナリオ（大元の備考に書く）
            p = pstep.get((flow, x))
            if p and p[5] == "通る":
                for sid in SID.findall(p[6]):
                    dropped[sid].append(f"{sheet} {titles[x]}")
        if not kept:
            continue
        keys = sorted(kept)
        rows = []
        for i, x in enumerate(keys):
            s = st[x]
            num = s["#"] if s["#"] != "（番号なし）" else ""
            title = titles[x][len(s["#"]):].strip() if titles[x].startswith(s["#"]) else titles[x]
            if s["扱い"] == "見出し":
                # 見出しの下の工程（次の、子でない見出しの手前まで）を通すシナリオをまとめて出す
                end = next((y for y in keys[i + 1:] if st[y]["扱い"] == "見出し" and not st[y]["#"].startswith(s["#"] + "-")), 10 ** 9)
                under = ordered(sid for y in keys if x < y < end and (flow, y) in pstep and pstep[(flow, y)][5] == "通る"
                                for sid in SID.findall(pstep[(flow, y)][6]))
                rows.append(dict(head=True, cells=[num, title, "見出し", "・".join(under), "", "", "", "", ""]))
                continue
            p = pstep.get((flow, x))
            if not p:
                errors.append(f"{sheet} R{x}（{s['#']} {title}）：証明用の対応表に工程の行が無い")
                continue
            verdict, scen = p[5], ordered(SID.findall(p[6]))
            if verdict == "通る":
                if not scen:
                    errors.append(f"{sheet} R{x}（{s['#']} {title}）：通るのに通すシナリオが無い")
                for sid in scen:
                    if not label(sid):
                        errors.append(f"{sheet} R{x}：シナリオ {sid} の名前が scenario_list.md に無い")
                    by_sid[sid]["steps"].append(f"{sheet} {titles[x]}")
                    by_sid[sid]["count"][(book, sheet)] += 1
                    by_sid[sid]["flows"].add(no)
            rows.append(dict(head=False, cells=[num, title, verdict, "\n".join(f"{sid} {label(sid)}" for sid in scen),
                                                "\n".join(p[7].split("・")) if verdict == "通る" else "",
                                                "・".join(route_at.get((flow, x), [])),
                                                p[9] if verdict == "対象外" else "", p[10] if verdict == "対象外" else "",
                                                p[11] if verdict == "対象外" else ""]))
        sheets.append((sheet, flow, rows, book, sheet_note(no, kept, st, titles)))

    # ---- 業務フロー画面マトリクス：Excel と同じ形（業務×画面）。〇 の代わりに通すシナリオ
    _, cells = sheet_cells("01")
    hr = next(r for (r, c), v in cells.items() if v == "在庫検索一覧")
    screens = [(c, re.sub(r"\s+", " ", v).strip()) for (r, c), v in sorted(cells.items()) if r == hr]
    pscr = {(r[2], bp.nz(r[3])): r for r in proof if r[0] == "画面マトリクス"}
    used = set()
    one = lambda v: "\n".join(t.strip() for t in str(v or "").strip().splitlines() if t.strip())  # noqa: E731
    mrows = []
    for sr in tsv("screen_rows.tsv"):
        R = int(sr["行"][1:])
        num, work = one(cells.get((R, 2))), one(cells.get((R, 3)))
        if re.sub(r"\s", "", num) != re.sub(r"\s", "", sr["業務フロー対応番号"]):
            errors.append(f"画面マトリクス {sr['行']}：業務フロー対応番号が Excel「{num}」と screen_rows.tsv「{sr['業務フロー対応番号']}」で違う")
        flows, shown = [], []
        for part in [q for q in sr["業務フローの流れ"].split("・") if q]:
            fno, start = part.split(":R")
            if fno in OTHER and int(start) not in kept_by_no.get(fno, set()):
                continue  # (tobe) の組の元にしないシートの流れは出さない
            shown.append(fno)
            sec = [t for t in vf.sections_of(fno) if t[0] == int(start)]
            if not sec:
                errors.append(f"画面マトリクス {sr['行']}：流れ {part} が業務フローの見出しに無い")
                continue
            h, sno, nm, _ = sec[0]
            flows.append(f"{fx.md_source(fno)[1]} {titles_by_no.get(fno, {}).get(h) or f'{sno} {nm}'}")
        line = [num, work, "\n".join(flows) or "（業務フローの図に流れが無い）"]
        for c, name in screens:
            if cells.get((R, c)) != "〇":
                line.append("")
                continue
            key = (sr["行"], bp.nz(name))
            p = pscr.get(key)
            if not p:
                errors.append(f"画面マトリクス {sr['行']} {name}：Excel の〇に証明用の対応表の行が無い")
                line.append("")
                continue
            used.add(key)
            if p[5] == "通る":
                sids = ordered(SID.findall(p[6]))
                line.append("・".join(sids))
                for sid in sids:
                    by_sid[sid]["screens"].append(f"{num} {sr['業務']}：{name}")
                    by_sid[sid]["flows"] |= set(shown)
            else:
                line.append(f"対象外：{p[9]}")
        mrows.append(line)
    for key in set(pscr) - used:
        errors.append(f"画面マトリクス {key}：証明用の対応表の行が表のどのセルにも入らない")

    # ---- シナリオから見る
    srows = []
    for sid in sorted(by_sid, key=lambda s: (idx.get(s, ("",))[0], s)):
        d = by_sid[sid]
        srows.append([sid, label(sid), idx.get(sid, ("",))[0], "\n".join(ordered(d["steps"])), "\n".join(ordered(d["screens"]))])
    unlinked = defaultdict(list)
    for sid, (folder, _) in idx.items():
        if sid not in by_sid:
            unlinked[folder].append(sid)

    # ---- シナリオと業務（大元）：業務一覧の＃1〜13
    _, brs = bp.business_rows()
    bmap = {r["#"]: r for r in tsv("business_list_map.tsv")}
    biz_of_flow, biz_of_folder, blabel = defaultdict(list), defaultdict(list), {}
    for b in brs:
        mp = bmap.get(b["no"])
        if not mp or mp["BO業務"] != b["biz"]:
            errors.append(f"業務一覧 #{b['no']} {b['biz']}：business_list_map.tsv の行が無いか BO業務が違う")
            continue
        blabel[b["no"]] = f"{b['no']} {b['biz']}（{b['dept']}）"
        for f in [q for q in mp["業務フロー"].split("・") if q]:
            biz_of_flow[f].append(b["no"])
        for fold in [q for q in mp["シナリオのフォルダ"].split("、") if q]:
            biz_of_folder[fold].append(b["no"])
    for d in by_sid.values():
        for f in d["flows"]:
            if f not in biz_of_flow and f != "01":
                errors.append(f"業務フロー {f}：業務一覧のどの業務にも無い")
    brows = []
    for sid in sorted(idx, key=lambda s: (idx[s][0], s)):
        folder = idx[sid][0]
        d = by_sid.get(sid)
        by_step = ordered(n for f in sorted(d["flows"]) for n in biz_of_flow.get(f, [])) if d else []
        nos = sorted(set(biz_of_folder.get(folder, [])) | set(by_step), key=int)
        if not nos:
            note = f"業務一覧に無い業務（{folder}）"
        elif not d and sid in dropped:
            note = ("通す工程は (tobe) の組の元にしないシートにだけある（" + "・".join(ordered(dropped[sid])) + "）。紐づけはフォルダだけ")
        elif not d:
            note = "業務フローの工程は通らない（業務フローに無い場面。紐づけはフォルダだけ）"
        else:
            note = ""
        cnt = "\n".join(f"{b} ／ {sh}（{v}）" for (b, sh), v in d["count"].items()) if d else ""
        if d and not d["count"]:
            cnt = "（画面マトリクスの〇だけ）"
        if nos and not d and all(not bmap[n]["業務フロー"] for n in nos):
            note = "業務一覧の業務補足に「業務フローは無し」（定常業務ではない）"
        brows.append([sid, label(sid), folder, "・".join(nos), "\n".join(blabel[n] for n in nos), cnt, note])
    return dict(sheets=sheets, screens=[n for _, n in screens], mrows=mrows, srows=srows, unlinked=unlinked, brows=brows,
                bcount={n: sum(1 for r in brows if n in r[3].split("・")) for n in blabel}, blabel=blabel), errors


def report(res, errors):
    for sheet, _, rows, _, _ in res["sheets"]:
        c = defaultdict(int)
        for r in rows:
            c[r["cells"][2]] += 1
        print(f"{sheet}: " + "・".join(f"{k}{v}" for k, v in c.items()))
    print("業務一覧：" + "・".join(f"#{n} {c}" for n, c in res["bcount"].items()) + f"・紐づく業務の無いシナリオ {sum(1 for r in res['brows'] if not r[3])}")
    print(f"画面マトリクス {len(res['mrows'])}行・シナリオから見る {len(res['srows'])}本・業務フローに紐づかないシナリオ {sum(map(len, res['unlinked'].values()))}本")
    for e in errors:
        print("NG", e)
    print("OK" if not errors else f"NG {len(errors)}件")


def write_book(path, lines, tables):
    """見方のシート（lines）と表のシート（tables：(名前, 見出し, 行, 幅, 太字の行, 固定の位置)）の Excel を書く"""
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    wb = Workbook()
    ws = wb.active
    ws.title = "見方"
    for i, (t, b) in enumerate(lines, 1):
        c = ws.cell(row=i, column=1, value=t)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        if b:
            c.font = Font(bold=True)
    ws.column_dimensions["A"].width = 120
    fill = PatternFill("solid", fgColor="DDEBF7")
    for title, head, rows, widths, bold_rows, freeze, *src in tables:
        s = wb.create_sheet(title[:31])
        top = 1
        if src and src[0]:
            s.append([src[0]])
            s["A1"].font = Font(bold=True)
            top = 2
            freeze = freeze[0] + str(int(freeze[1:]) + 1)
        s.append(head)
        for c in s[top]:
            c.font = Font(bold=True)
            c.fill = fill
            c.alignment = Alignment(wrap_text=True, vertical="top")
        for r in rows:
            s.append(r)
        for i, row in enumerate(s.iter_rows(min_row=top + 1)):
            for c in row:
                c.alignment = Alignment(wrap_text=True, vertical="top")
                if i in bold_rows:
                    c.font = Font(bold=True)
        for i, w in enumerate(widths, 1):
            s.column_dimensions[s.cell(row=1, column=i).column_letter].width = w
        s.freeze_panes = freeze
        s.auto_filter.ref = f"A{top}:{s.cell(row=1, column=s.max_column).column_letter}{s.max_row}"
    wb.save(path)


def cmd_master(path, res):
    """大元：シナリオ → 業務一覧の＃（別ファイル。2026-11-25 依頼者「別のファイルに分けて」）"""
    lines = [
        ("シナリオと業務の紐づけ（大元）", True),
        ("", False),
        ("業務フローの Excel の3つの段（業務一覧の＃ → 業務ごとの業務フローのシート → 工程の＃）のうち、いちばん上の業務一覧"
         "（02_業務一覧_業務フロー.xlsx の「業務一覧」シートの＃1〜13）に、シナリオを紐づけた。シナリオ1本＝1行。", False),
        ("・工程の＃まで詳しくしたものは「業務フローの＃とシナリオの紐づけ.xlsx」（業務フローのシートごとの工程の＃・画面マトリクス・シナリオから見る）", False),
        ("", False),
        ("シート「シナリオと業務」", True),
        ("・業務一覧の＃・業務：業務一覧の＃と BO業務。在庫管理（＃6 トレード・＃10 商品管理）と売上分析・顧客分析（＃11 店舗統括・＃12 顧客戦略）は、"
         "同じ業務の名前で部署が違う2行なので、部署を括弧に書いた。在庫管理の2行は業務フローのシートが同じ（在庫管理・在庫管理 (tobe)）なので、同じシナリオが両方に紐づく", False),
        ("・(tobe) のあるシートは (tobe) を優先し、(tobe) の無い方に新しいと注記のある店頭買取・在庫管理は (tobe) の無い方を元にした"
         "（「業務フローの＃とシナリオの紐づけ.xlsx」の見方と同じ）。元にしないシートは、元にしたシートに無いパターンを通すときだけ出る", False),
        ("・紐づけ方は2通り：(1) シナリオのフォルダがその業務のフォルダ（例：店頭受取受注管理のフォルダ → ＃1。MTGバイヤーのフォルダは査定を受け持つので ＃2 店頭買取・＃7 ネット買取）、"
         "(2) その業務の業務フローのシートの工程を通す（通しシナリオ・業務横断のシナリオは、通す工程のある業務すべてに紐づく）", False),
        ("・業務フローの Excel のファイル名 ／ シート名（通す工程の数）：シナリオが工程を通す業務フローの Excel のファイル名とシート名と、そのシートで通す工程の数。2つの Excel には同じ名前のシートが両方に入っているので、ファイル名も書いた。工程の＃は「業務フローの＃とシナリオの紐づけ.xlsx」の同じ名前のシートで見る", False),
        (f"・業務一覧に無い業務のシナリオ {sum(1 for r in res['brows'] if not r[3])} 本も1行ずつ載せ、備考に「業務一覧に無い業務（フォルダ）」と書いた："
         + "・".join(f"{k} {v}" for k, v in sorted(((k, sum(1 for r in res['brows'] if not r[3] and r[2] == k)) for k in {r[2] for r in res['brows'] if not r[3]}), key=lambda kv: -kv[1])), False),
        ("・" + "・".join(f"{res['blabel'][n]} {c} 本" for n, c in res["bcount"].items()), False),
        ("", False),
        ("・作り直し：tools/build_step_table.py（証明用の対応表の確かめが通らないと作らない）", False),
    ]
    write_book(path, lines, [("シナリオと業務", BIZ_HEAD, res["brows"], [10, 50, 22, 10, 30, 26, 36], set(), "C2")])


def tobe_lines():
    """見方：(tobe) つきの4組でどちらのシートを元にしたか"""
    out = [("(tobe) のあるシート（2026-11-26）", True),
           ("・(tobe) のあるシートは (tobe) を優先し、(tobe) が無ければ付いていないシートを元にする。ただし、(tobe) の無い方のシートの3行目に、"
            "そちらが新しいと注記のある2組（店頭買取・在庫管理）は、注記に合わせて (tobe) の無い方を元にする（依頼者が選んだ）", False),
           ("・元にしないシートからは、元にしたシートに無いパターンだけを出す。シートごとの扱いは、各シートの1行目にも書いた", False)]
    out += [(x, False) for x in ts.lines()]
    return out


def cmd_xlsx(path, res):
    n_steps = sum(1 for _, _, rows, _, _ in res["sheets"] for r in rows if not r["head"])
    n_pass = sum(1 for _, _, rows, _, _ in res["sheets"] for r in rows if r["cells"][2] == "通る")
    unl = res["unlinked"]
    lines = [
        ("業務フローの＃とシナリオの紐づけ", True),
        ("", False),
        ("業務フローの Excel の3つの段（業務一覧の＃ → 業務ごとの業務フローのシート → 工程の＃）のうち、業務フローのシートの工程の＃と画面マトリクスに、シナリオを紐づけた。", False),
        ("・大元（シナリオ → 業務一覧の＃1〜13）は別のファイル「シナリオと業務の紐づけ（大元）.xlsx」。このファイルはそれを工程の＃まで詳しくしたもの", False),
        ("・業務フローのシート（店頭受取受注管理〜デッキ登録）と業務フロー画面マトリクス：Excel の左の「＃」「作業概要」の列と同じ並びで1行＝工程1つにし、"
         "その工程を通すシナリオを並べた。業務フローの Excel を開いて、同じ＃の行を横に見比べられる", False),
        ("・シナリオから見る：シナリオの側から並べ直したもの（シナリオ → 通す工程の＃・画面マトリクスの〇）", False),
        ("", False),
        ("業務フローのシート（店頭受取受注管理〜デッキ登録）", True),
        ("・シートの名前は業務フローの Excel のシートの名前のまま。各シートの1行目に、もとにした業務フローの Excel のファイル名とシート名を書いた。"
         "2つの Excel には同じ名前のシート（店頭受取受注管理・在庫管理など）が両方に入っていて中身が違うものもあるので、下のファイルのシートを使った", False),
        *[(f"　・{sheet} ← {book} ／ シート「{sheet}」", False) for sheet, _, _, book, _ in res["sheets"]],
        ("・＃・作業概要：Excel の「＃」「作業概要」の列のまま（作業概要を2行に分けて書いた工程は、続けて1行にした。例「対応状況更新 ピック完了」）。"
         "Excel では同じ＃が2回出てくる所がある（在庫管理の 2-17 が「振替」と「フロア間移動」など）ので、作業概要で見分ける", False),
        ("・見出しの行（太字。業務フローパターンの番号と名前）：通すシナリオの列に、その下の工程を通すシナリオをまとめて書いた", False),
        ("・判定：通る＝通すシナリオがその工程を確かめる。対象外＝シナリオで確かめない工程（ピッキング・商品戻し・メールなどシステムを触らない作業、"
         "tobe のシートの今の運用の区間 など）。対象外の理由と決めた人を右の列に書いた", False),
        ("・通すシナリオ：その工程を通すシナリオのIDと名前（11/20 の照合で、シナリオの文が工程を通すと確かめたもの）", False),
        ("・通すテスト：その工程を確かめるテスト（<シナリオID>/T01 は組み合わせ表の行、/EX1 は例外、IDだけは組み合わせ表の無いシナリオ）。"
         "その工程を引く道筋（業務パターンとシナリオの対応表）のテストのうち、その工程を通すシナリオのもの。通る工程には必ず1つ以上付く（付かないと作る道具が止まる）", False),
        ("・道筋：その工程を通る、業務パターンとシナリオの対応表.xlsx の道筋（起点から終点までの流れ1本）。道筋ごとの通すテストはそちらにある", False),
        ("", False),
        *tobe_lines(),
        ("", False),
        ("業務フロー画面マトリクス", True),
        ("・在庫に関連する_業務一覧_業務フロー.xlsx の「業務フロー画面マトリクス」と同じ形（業務×画面）。〇 の所に、その業務でその画面を通すシナリオを書いた。"
         "〇 の無い所は空のまま", False),
        ("・「対象外：…」は、シナリオで通さない〇と、その区分（廃止と決まった画面・業務フローに流れが無い業務 など）。理由と決めた人は「業務フローとシナリオの対応表.xlsx」の段「画面マトリクス」", False),
        ("・業務フローのシート・＃・作業概要：その行の業務が描かれた業務フローのシートと見出しの＃。画面マトリクスの番号は図の＃と違うものがある"
         "（「8,12 欠品対応」は在庫管理の図の 8・11、「9 安価カード在庫補充作業」は図の 8 など）", False),
        ("", False),
        ("シナリオから見る", True),
        ("・シナリオごとに、通す工程（業務フローのシート・＃・作業概要）と、画面マトリクスで通す〇を並べた。業務フローのどこかに紐づくシナリオだけを載せた", False),
        (f"・業務フローに紐づかないシナリオ {sum(map(len, unl.values()))} 本は載せていない（業務フローの Excel に無い業務のシナリオ）："
         + "・".join(f"{k} {len(v)}" for k, v in sorted(unl.items(), key=lambda kv: -len(kv[1]))), False),
        ("", False),
        (f"工程 {n_steps}（通る {n_pass}・対象外 {n_steps - n_pass}）・画面マトリクス {len(res['mrows'])} 行・シナリオ {len(res['srows'])} 本", True),
        ("・中身は「業務フローとシナリオの対応表.xlsx」（証明用。段「工程」「画面マトリクス」）と同じで、並べ方だけ変えた。抜け 0。"
         "証明用の対応表は (tobe) の組の両方のシートを全部載せている（このファイルは元にするシートだけ）", False),
        ("・作り直し：tools/build_step_table.py（証明用の対応表の確かめが通らないと作らない）", False),
    ]
    tables = []
    widths = [9, 34, 8, 46, 22, 26, 18, 40, 24]
    for sheet, _, rows, book, note in res["sheets"]:
        keep = [i for i in range(len(STEP_HEAD)) if i < 6 or any(r["cells"][i] for r in rows)]
        tables.append((sheet, [STEP_HEAD[i] for i in keep], [[r["cells"][i] for i in keep] for r in rows], [widths[i] for i in keep],
                       {j for j, r in enumerate(rows) if r["head"]}, "C2", f"業務フローの Excel：{book} ／ シート「{sheet}」{note}"))
    tables.append(("業務フロー画面マトリクス", ["業務フロー対応番号", "業務内容", "業務フローのシート・＃・作業概要"] + res["screens"], res["mrows"],
                   [12, 34, 34] + [12] * len(res["screens"]), set(), "D2",
                   f"業務フローの Excel：{fx.XLSX[fx.md_source('01')[0]].name} ／ シート「{fx.md_source('01')[1]}」"))
    tables.append(("シナリオから見る", SCN_HEAD, res["srows"], [10, 40, 18, 50, 50], set(), "C2"))
    write_book(path, lines, tables)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    res, errors = build()
    report(res, errors)
    if cmd == "xlsx":
        if errors:
            sys.exit("止まる条件に当たったので Excel を書かない")
        cmd_xlsx(sys.argv[2], res)
        cmd_master(sys.argv[3], res)
        print(f"{sys.argv[2]} と {sys.argv[3]} を作った")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
