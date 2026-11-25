"""業務フローの図を「起点から終点までの道筋」ごとに文章にした業務パターンと、通すシナリオ・テストの対応表を作る。

2026-11-24 依頼者「わかりにくいね。人間にとっては。業務パターンを業務フローExcelから言語化して、それとマッピングするのはどうかね」→「よい」。
まず店頭受取受注管理（業務フロー05）で試作する。

人が書くもの：業務フローとの照合/routes/<業務フロー>.tsv（業務フローのシートごと。1行＝道筋1本。業務パターンの文、分かれ目、業務条件の値、通すシナリオ、Excel の行（通る順）、図の読み替え）
機械が足すもの：通すテスト（道筋の業務条件の値を全部持つテスト）、図の画面・データ（引いた工程の帯にある図形）、システムを触らない工程

止まる条件（終了コード1。routes/ に道筋がある業務フローごとに見る）
  取りこぼし
  - Excel の工程（見出し以外）・判断の矢印・条件の文（見出し以外）で、どの道筋にも入っていないものがある。11/20 の照合で通るの工程を、通るの道筋が1本も引いていない
  - パターン一覧のパターンに道筋が1本も無い
  道筋のつながり（図の矢印はレーンをまたぐところで途切れているので、矢印だけでは見ない）
  - 道筋の工程が上から下への順に並んでいない（図に上へ戻る矢印があるところは戻ってよい）。図の矢印の向きと道筋での順が逆（輪になる戻りの矢印は1周目の順でよい）。パターンの外の工程を引いている
  - 判断のある工程を引いた道筋が、その判断の行き先を引いていない（判断のすぐあとに引いた行き先を選んだ側とする。合流先は後で引いてよい。
    判断で終わる道筋は、その判断の条件の文（「拒否された場合は…終了する」など）とその値を引く）
  - 選ばなかった判断の側の工程を引いている（前の工程から図の矢印で来る合流はよい。1つの帯に別の工程の文と判断が入っているときは
    「飛ばす工程」に「帯R番号：理由」）。判断の矢印の値を持つのに、その行き先の工程を引いていない（行き先が範囲外の行ならよい）
  - 判断の帯と行き先を引くのに、その判断の値を持たない（通らない判断なら「飛ばす工程」に「判断R番号：理由」）
  - パターンの工程のうち道筋が引かないもの（最初の工程・最後の工程も含む）に理由が無い。理由になるのは
    (a) 選ばなかった判断の行き先の側の工程（判断の帯より下の行き先を上から並べ次の行き先の手前まで。いちばん下の行き先は、どの行き先の道筋も通る合流の工程の手前まで。
        どの矢印を通るかは道筋の業務条件の値で決める。判断の帯が最後の工程で、その判断の帯の条件の文と値を引く道筋は、判断で終わる）
    (b) その工程の前提の条件（工程の行そのものの条件の文と「〜のみ」の条件の文）と同じ業務条件の別の値を、道筋が持っている
    (c) 図形につながっていない矢印（全キャンセルなど）を選んだ道筋の、最後に引いた工程より下の工程。判断で終わる道筋の、判断より下の工程
    (d) 範囲外の工程（現状の区間の対象外の道筋が引く。どれかの道筋が引くことは取りこぼしで見る）
    (e) routes/*.tsv の「飛ばす工程」に「R番号：理由（根拠の R 番号）」を書いた
  値とシナリオ
  - 道筋の「Excel の行」が、その業務フローの工程の行・条件の文の行に無い
  - 1本の道筋が同じ業務条件の値を2つ持つ（B1-1 と B1-2 など）。業務パターンの文・分かれ目が空
  - 前提の条件（※支店のみ など）のある工程を引いた道筋が、同じ業務条件の別の値を持っている（本店の道筋に支店だけの工程）
  - 判断の矢印を引いた道筋が、その矢印の業務条件の値を持っていない。条件の文を引いた道筋が、その文の業務条件の値を持っていない
  - 「通る」の道筋のシナリオが実在しない。引いた工程・矢印・条件の文を通すシナリオ（11/20 の照合の 03〜05_*.tsv）が、道筋のシナリオに1つも無い
    （判断のある工程は、道筋の側の矢印を通すシナリオで見る）
  - 「通る」の道筋のシナリオの「→」の順が、工程を上から通す順と合わない
  - 道筋のシナリオに、テストが1つも付かない（分かれ目の値が〇のテストにも、「前後のテスト」の選び方にも当たらない）。前後のテストの選び方がマトリクスの列に無い
  - 「飛ばす工程」が「R番号：理由」の形でない・理由が根拠の Excel の行（R番号）を引いていない・選んだ矢印の行き先を外している
  - 「対象外」の道筋に区分・理由・決めた人が無い。判定が「通る」「対象外」以外

図の矢印の行き先の読み替え：routes/arrow_fix.tsv（業務フロー・判断の行・行き先・元の行き先の工程・読み替える行き先の工程・根拠）。
  図形が上の工程の帯の最後の行にかかって描かれ、04 の行き先の工程が1つ上の帯になっているときに、根拠つきで直す（04 は直さない）。
合流の位置は道筋から決める（いちばん下の行き先の工程から下で、どの行き先を選んだ道筋も通る最初の工程）。ある判断の片側の道筋が全部、
  同じ工程を落とすと見落とすので、codex のレビューで見る

使い方（scenario_test/user_scenario で）
  python3 -I tools/build_route_table.py check [06 07 ...]   シートの番号を付けると、そのシートの道筋だけ確かめる
  uv run --with openpyxl python -I tools/build_route_table.py xlsx 業務フローとの照合/業務パターンとシナリオの対応表.xlsx
"""
import bisect
import csv
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow_from_xlsx as fx  # noqa: E402
import verify_flow_coverage as vf  # noqa: E402
from build_coverage_matrix import US, scenario_index  # noqa: E402
from build_flow_proof import value_tests  # noqa: E402

DEST = US / "業務フローとの照合"
SID = re.compile(r"U[A-Z]{2}-\d+")
ROWS = re.compile(r"R(\d+)")
VALID = re.compile(r"/([A-Z]+\d*-[A-Z]?\d+):対象")
HEAD = ["道筋", "業務", "パターン（業務フローの番号・名前）", "業務パターン（業務フローの流れ）", "分かれ目", "判定",
        "通すシナリオ", "通すテスト", "Excel とシナリオの違い", "図の画面・データ", "システムを触らない工程", "業務条件の値", "業務フローの＃・作業概要",
        "対象外の区分", "対象外の理由", "決めた人", "業務フローのシート"]
# 2026-11-25 依頼者「店頭受取受注管理シートの＃の番号と関連付けができるとどのシナリオがどの業務に紐づいているのかわかる」：
#   Excel の行の番号（R23 など）の列を、業務フローの Excel の「＃」「作業概要」の列の言葉に置き換えた（行の番号は routes/*.tsv に残す）


def tsv(name):
    with open(DEST / name, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def sids(s):
    return set(SID.findall(s or ""))


def sheet_cells(no):
    src, sheet = fx.md_source(no)
    z = zipfile.ZipFile(fx.XLSX[src])
    return sheet, fx._cells(z, fx._sheet_paths(z)[sheet], fx._shared(z))


def step_titles(no, st):
    """工程の行 → 「＃ 作業概要」（業務フローの Excel の「＃」「作業概要」の列のまま）。作業概要を2行に分けて書いた工程
    （「対応状況更新」「ピック完了」・「スマレジ受注」「情報削除」）があるので、＃ の無い次の行の作業概要も続けて読む"""
    _, cells = sheet_cells(no)
    one = lambda v: re.sub(r"\s+", " ", str(v or "")).strip()  # noqa: E731
    out = {}
    for x, s in st.items():
        parts, y = [one(cells.get((x, 2))) or s["作業概要"]], x + 1
        while not one(cells.get((y, 1))) and one(cells.get((y, 2))) and y not in st:
            parts.append(one(cells[(y, 2)]))
            y += 1
        out[x] = f"{s['#']} {' '.join(parts)}".strip()
    return out


def step_of(keys, x):
    """Excel の行 → その行を含む工程の行（工程の行か、その帯の条件の文の行）"""
    i = bisect.bisect_right(keys, x)
    return keys[i - 1] if i else None


def hidden_cols(no):
    """シートの隠し列（<col hidden="1">）。図形が隠し列から始まるときは、次に見える列のレーンに置かれて見える"""
    src, sheet = fx.md_source(no)
    z = zipfile.ZipFile(fx.XLSX[src])
    x = z.read(fx._sheet_paths(z)[sheet]).decode("utf-8")
    out = set()
    for m in re.finditer(r"<col ([^>]*)/>", x):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        if a.get("hidden") == "1":
            out |= set(range(int(a["min"]), int(a["max"]) + 1))
    return out


def figure(no, step_rows=None):
    """図を読む。(工程の行 → 帯の画面・データの図形, 帯から帯への矢印)。
    画面・処理＝定義済み処理（二重線の箱）を、置かれたレーン（使う人）つきで。データ＝システムのレーンの DB の図形、処理＝システムのレーンの処理の図形。
    紙（帳票・スタック用紙）や人の作業の図形は入れない。
    レーンは図形の左端の列から隠し列を飛ばした最初の見える列で決める（flow_from_xlsx の列は左端の列のまま。05 では
    14列目・16〜19列目が隠し列で、左端の列のままだとスマレジのデータが MTGバイヤー、スタック用紙がデッキシステムに見える）"""
    fl = fx.read_flow(no)
    # 帯は照合の工程の行（03_工程.tsv。番号の無い工程しかない流れ＝13 の 14 の作業概要の行も含む）で決める
    bs = vf.bands(step_rows) if step_rows else vf.bands(fl["steps"])
    hid = hidden_cols(no)
    nodes = defaultdict(list)
    for _, (prst, text, row, col) in sorted(fl["shapes"].items(), key=lambda kv: (kv[1][2], kv[1][3])):
        while col in hid:
            col += 1
        lane = fl["lanes"].get(col, "")
        b = vf.band_of(row, bs)
        if not b or not text or re.fullmatch(r"\d+", text):
            continue
        text = re.sub(r"\*\d+$", "", re.sub(r"\s+", "", text))
        if prst == "flowChartPredefinedProcess":
            item = f"{text}（{lane}）"
        elif lane in vf.SYSTEM_LANES and prst == "flowChartMagneticDisk":
            item = f"{text}（{lane}のデータ）"
        elif lane in vf.SYSTEM_LANES and prst == "flowChartProcess":
            item = f"{text}（{lane}の処理）"
        else:
            continue
        if item not in nodes[b]:
            nodes[b].append(item)
    sh = fl["shapes"]
    edges = set()
    for s, e, dash in fl["conns"]:
        if s in sh and e in sh and dash == "solid":
            a, b = vf.band_of(sh[s][2], bs), vf.band_of(sh[e][2], bs)
            if a and b and a != b:
                edges.add((a, b))
    return nodes, edges


def conflicts(cvals, rvals):
    """条件の文の値 cvals と道筋の値 rvals が食い違う＝同じ業務条件（B7 など）の別の値を道筋が持ち、cvals のどれも持たない。
    同じ業務条件の値を道筋が持たないとき（例：キャンセルの工程の注記「キャンセル後に来店したら」B6-1）は食い違いでない"""
    rv = set(rvals)
    if not cvals or cvals & rv:
        return False
    rf = {v.rsplit("-", 1)[0] for v in rv}
    return any(c.rsplit("-", 1)[0] in rf for c in cvals)


def scen_groups(s):
    """「UOR-01 → UOR-02 → UOR-09、UXB-09」→ ([{UOR-01}, {UOR-02}, {UOR-09}], {UXB-09})。「、」のあとは順に入らない別の目のシナリオ"""
    main, _, extra = (s or "").partition("、")
    return [sids(g) for g in main.split("→") if sids(g)], sids(extra)


def side_tests(spec, idx, rid, errors):
    """前後のテスト「UOR-01：受取店舗=本店・配送方法=店頭受取／UOR-09：…=キャンセル／UXB-09」→ シナリオ → テスト。
    マトリクス（<業務>/matrix_<ID>/matrix.tsv）の列の値が = の右の文字と同じか、その文字に「（」「：」が続く行を選ぶ（「店頭受取」は「スムーズ店頭受取」に当たらない）。マトリクスの無いシナリオはIDだけ書く"""
    out = {}
    for ent in [e.strip() for e in (spec or "").split("／") if e.strip()]:
        sid, _, cond = ent.partition("：")
        sid = sid.strip()
        if "/" in sid:   # 例外などを直に「UEV-06/EX1」と書く
            s0, tid = sid.split("/", 1)
            d0 = US / idx[s0][0] / f"matrix_{s0}" if s0 in idx else None
            if s0 == "UTS-01" and d0 is not None and not d0.exists():
                d0 = US / idx[s0][0] / "matrix"
            known = set()
            for name, col in (("matrix.tsv", "No."), ("exceptions.tsv", "例外ID")):
                if d0 and (d0 / name).exists():
                    with open(d0 / name, encoding="utf-8") as fh:
                        known |= {m.get(col, "") for m in csv.DictReader(fh, delimiter="\t")}
            if tid not in known:
                errors.append(f"{rid}：前後のテスト {sid} が {s0} のマトリクス・例外に無い")
            else:
                out.setdefault(s0, []).append(sid)
            continue
        if sid not in idx:
            errors.append(f"{rid}：前後のテストのシナリオ {sid} が無い")
            continue
        mp = US / idx[sid][0] / f"matrix_{sid}" / "matrix.tsv"
        if sid == "UTS-01" and not mp.exists():   # 通販の UTS-01 の表は 通販/matrix/（build_coverage_matrix.scenario_index と同じ）
            mp = US / idx[sid][0] / "matrix" / "matrix.tsv"
        if not mp.exists():
            if cond.strip():
                errors.append(f"{rid}：前後のテスト {sid} はマトリクスが無いのに条件がある")
            out[sid] = [sid]
            continue
        with open(mp, encoding="utf-8") as fh:
            mrows = list(csv.DictReader(fh, delimiter="\t"))
        cols = sorted((k for k in mrows[0] if k not in ("No.", "水準ID")), key=len, reverse=True)
        conds, rest = [], cond.strip()
        while rest:
            col = next((k for k in cols if rest.startswith(k + "=")), None)
            if not col:
                conds.append([rest])
                break
            rest = rest[len(col) + 1:]
            nxt = min([i for i in (rest.find("・" + k + "=") for k in cols) if i >= 0], default=-1)
            conds.append([col, rest if nxt < 0 else rest[:nxt]])
            rest = "" if nxt < 0 else rest[nxt + 1:]
        for c in conds:
            if len(c) != 2 or c[0] not in mrows[0]:
                errors.append(f"{rid}：前後のテスト {sid} の条件「{'='.join(c)}」がマトリクスの列に無い")
        def match(cell, want):
            cell = (cell or "").strip()
            return cell == want or cell.startswith(want + "（") or cell.startswith(want + "：")
        hit = [m["No."] for m in mrows if all(len(c) == 2 and match(m.get(c[0]), c[1]) for c in conds)]
        if not hit:
            errors.append(f"{rid}：前後のテスト {sid} の条件に当たるテストが無い")
        out[sid] = [f"{sid}/{h}" for h in hit]
    return out


def route_tests(biz, vals, scen, vt):
    """道筋の業務条件の値を全部持つテスト → そのテストが持つこの道筋の値。シナリオごとに、そのシナリオのテストにある値だけで見る
    （例：本店の店頭PCの期限内＝B4-1・B7-1。UOR-06 は B7-1 のテスト、UOR-07 は B4-1 と B7-1 の両方を持つテスト）"""
    per = defaultdict(lambda: defaultdict(set))  # シナリオ → テスト → 値
    for v in vals:
        for t in vt.get((biz, v), ()):
            s = t.split("/")[0]
            if s in scen:
                per[s][t].add(v)
    out = {}
    for s, tv in per.items():
        have = set().union(*tv.values())
        out.update({t: vs for t, vs in tv.items() if vs >= have})
    return out


def load_routes():
    """routes/<業務フロー>.tsv を全部読む（ファイル名と「業務フロー」の列が合うこと）"""
    out = []
    for p in sorted(q for q in (DEST / "routes").glob("*.tsv") if q.name != "arrow_fix.tsv"):
        rows = tsv(f"routes/{p.name}")
        for r in rows:
            r["_file"] = p.name
        out += rows
    return out


def build(only=None):
    errors = []
    routes = load_routes()
    p_fix = DEST / "routes" / "arrow_fix.tsv"
    arrow_fix = tsv("routes/arrow_fix.tsv") if p_fix.exists() else []
    for x in arrow_fix:
        if len(x.get("根拠", "").strip()) < 20:
            errors.append(f"arrow_fix.tsv の {x['業務フロー']} {x['判断の行']}→{x['行き先']}：根拠が短い")
    for rt in routes:
        if rt["業務フロー"] != rt["_file"][:-4] + ".md":
            errors.append(f"{rt['道筋']}：業務フロー「{rt['業務フロー']}」がファイル名 {rt['_file']} と合わない")
    if only:
        routes = [rt for rt in routes if rt["業務フロー"][:2] in only]
    steps = defaultdict(dict)   # 業務フロー → R → 工程の行
    for r in tsv("03_工程.tsv"):
        if r["扱い"] == "（番号なし）":   # 番号の無い工程しかない流れ（13 の 14）：判定の列で扱いを決める
            r["扱い"] = "対象" if r["判定"] == "通る" else "システムの外"
        steps[r["業務フロー"]][int(r["R"][1:])] = r
    arrows = defaultdict(list)
    for r in tsv("04_分かれ道.tsv"):
        arrows[r["業務フロー"]].append(r)
    conds = defaultdict(dict)
    for r in tsv("05_条件の文.tsv"):
        conds[r["業務フロー"]][int(r["R"][1:])] = r
    pats = defaultdict(list)
    for r in tsv("02_パターン.tsv"):
        pats[r["業務フロー"]].append(r)
    idx = scenario_index()
    vt = value_tests()

    by_flow = defaultdict(list)
    for rt in routes:
        by_flow[rt["業務フロー"]].append(rt)
    out, titles_by_no = [], {}
    for flow, rts in by_flow.items():
        st, cd, ar = steps.get(flow, {}), conds.get(flow, {}), arrows.get(flow, [])
        if not st:
            errors.append(f"{flow}：03_工程.tsv に工程が無い")
            continue
        no = flow[:2]
        biz = next((p["表のある業務"].split("／")[0] for p in pats.get(flow, []) if p.get("表のある業務")), "")
        titles = titles_by_no[no] = step_titles(no, st)
        skeys = sorted(st)
        bs_steps = [(x, st[x]["#"]) for x in sorted(st)]
        nodes, edges = figure(no, bs_steps)
        my_bands = vf.bands(bs_steps)
        succ = defaultdict(set)
        for a_, b_ in edges:
            succ[a_].add(b_)

        def reach(s, g):
            seen, todo = {s}, [s]
            while todo:
                for n_ in succ[todo.pop()]:
                    if n_ == g:
                        return True
                    if n_ not in seen:
                        seen.add(n_)
                        todo.append(n_)
            return False
        sec_list = vf.sections_of(no)
        nz_ = lambda s: re.sub(r"[\s　]+", "", s or "")

        def sec_of(pno, pname):
            """区間を番号で引く。同じ番号が2つある（12 の「8 欠品対応」と「8 安価カード在庫補充作業」）ときは名前で引く"""
            cs = [(h, e, n) for h, s, n, e in sec_list if s == pno]
            if len(cs) > 1:
                cs = [c for c in cs if nz_(c[2]).startswith(nz_(pname)) or nz_(pname).startswith(nz_(c[2]))] or cs[:0]
            return (cs[0][0], cs[0][1]) if cs else (None, None)
        # 判断：判断の図形（04 の「判断の行」）ごとに、置かれた工程の帯と矢印（行き先の工程・値・通すシナリオ）。
        # 行き先の工程は空（図形につながっていない矢印）・判断の帯そのもの・同じ帯への2本もある（06・07）ので、道筋がどの矢印を通るかは値で決める
        fixes = {(x["判断の行"], x["行き先"]): x for x in arrow_fix if x["業務フロー"] == flow}
        decs = {}
        for a in ar:
            fx_ = fixes.pop((a["判断の行"], a["行き先"]), None)
            if fx_:
                if a["行き先の工程"] != fx_["元の行き先の工程"]:
                    errors.append(f"{flow}：arrow_fix.tsv の {a['判断の行']}→{a['行き先']} の元の行き先 {fx_['元の行き先の工程']} が 04 の {a['行き先の工程']} と合わない")
                a = dict(a, 行き先の工程=fx_["読み替える行き先の工程"])
            # 帯は図形の行から、照合の工程の行で決め直す（04 は # の行だけで帯を作るので、13 の 14 では見出しの行 R303 に潰れている）
            band0 = vf.band_of(int(a["判断の行"][1:]), my_bands) or int(a["判断の工程"][1:])
            if a["行き先の工程"] and "@R" in a["行き先"] and not fx_:
                b_ = vf.band_of(int(a["行き先"].rsplit("@R", 1)[1]), my_bands)
                if b_:
                    a = dict(a, 行き先の工程=f"R{b_}")
            d = decs.setdefault(a["判断の行"], dict(id=a["判断の行"], band=band0, name=a["判断"], arrows=[]))
            d["arrows"].append(dict(tgt=int(a["行き先の工程"][1:]) if a["行き先の工程"] else None,
                                    vals=set(re.findall(r"/([A-Z]+\d*-[A-Z]?\d+):", a["業務条件の値"])),
                                    need=set(VALID.findall(a["業務条件の値"])), scen=sids(a["流れの中で値を通るシナリオ"]),
                                    label=f"{a['判断の行']}「{a['判断']}」→{a['行き先の工程'] or a['行き先']}"))
        for k in fixes:
            errors.append(f"{flow}：arrow_fix.tsv の {k} が 04 の矢印に無い")
        bands = {d["band"] for d in decs.values()}
        conds_of_step = defaultdict(list)   # 工程の行 → (条件の文の行, 文, 値)
        for x, c in cd.items():
            if c["工程"] and c["工程の扱い"] != "見出し":
                conds_of_step[int(c["工程"][1:])].append((x, c, set(VALID.findall(c["引用する業務条件の値"]))))
        cited_all = set()
        pat_routes = defaultdict(int)
        info = []
        for rt in rts:
            rid = rt["道筋"]
            rows = [int(x) for x in ROWS.findall(rt["Excelの行"])]
            vals = [v.strip() for v in rt["業務条件の値"].split("・") if v.strip()]
            scen = sids(rt["通すシナリオ"])
            verdict = rt["判定"]
            pno = rt["パターン"].split()[0]
            pat_routes[pno] += 1
            for x in rows:
                if x not in st and x not in cd:
                    errors.append(f"{rid}：R{x} は {flow} の工程の行・条件の文の行に無い")
            fac = defaultdict(list)
            for v in vals:
                fac[v.rsplit("-", 1)[0]].append(v)
            for k, vs in fac.items():
                if len(vs) > 1:
                    errors.append(f"{rid}：同じ業務条件 {k} の値を2つ持っている {vs}（1本の道筋は1つの値だけ）")
            if len(rt["業務パターン"].strip()) < 20 or not rt["分かれ目"].strip():
                errors.append(f"{rid}：業務パターンの文か分かれ目が空（短すぎる）")
            cited = set(rows)
            cited_all |= cited
            if verdict not in ("通る", "対象外"):
                errors.append(f"{rid}：判定が「{verdict}」")
            # ---- 道筋のつながり
            seq = [x for x in rows if x in st and st[x]["扱い"] != "見出し"]
            head, end = sec_of(pno, rt["パターン"].split(None, 1)[1] if len(rt["パターン"].split(None, 1)) > 1 else "")
            # 区間の見出しの行も、照合で工程（扱いが見出し以外）なら区間の最初の工程に入れる（12 の 1-⑤〜1-⑧、13 の 14）
            sec_steps = [x for x in sorted(st) if head is not None and head <= x <= end and st[x]["扱い"] != "見出し"]
            flowless = [p for p in pats.get(flow, []) if p["番号"] == pno and not (p["図の流れ"] or "").strip()]
            if flowless:
                # 図に流れが無いパターン（パターン一覧にだけある）：Excel の行は引かず、表のシナリオで通す
                if rows:
                    errors.append(f"{rid}：パターン {pno} は図に流れが無いので Excel の行は引かない（パターン一覧の行だけ）")
                if verdict == "通る" and not (scen & sids(flowless[0]["表のシナリオ"])):
                    errors.append(f"{rid}：図に流れが無いパターン {pno} は、パターン一覧のシナリオ {flowless[0]['表のシナリオ']} で通す")
            elif not sec_steps:
                errors.append(f"{rid}：パターン {pno} の流れが図に無い")
            else:
                if [x for x in seq if x not in sec_steps]:
                    errors.append(f"{rid}：パターン {pno} の外の工程を引いている {[x for x in seq if x not in sec_steps]}")
                # 順番：上から下へ。下から上へ戻るのは、図にその矢印があるときだけ（08 の 2-5→2-6 など）
                for a, b2 in zip(seq, seq[1:]):
                    if not (b2 > a or (a, b2) in edges):
                        errors.append(f"{rid}：R{a} から R{b2} へ上に戻っているが、図にその矢印が無い")
                pos = {x: i for i, x in enumerate(seq)}
                for u, v in edges:
                    # 図の矢印 u→v の向きと、道筋での順が逆。ただし輪になる戻りの矢印（v から矢印をたどって u に着く：再申請・再査定など）は1周目の順でよい
                    if u in pos and v in pos and pos[u] > pos[v] and not (u in bands and v < u) and not reach(v, u):
                        errors.append(f"{rid}：図の矢印は R{u}→R{v} の向きだが、道筋では R{v} が R{u} より前にある")
                if len(set(seq)) != len(seq):
                    errors.append(f"{rid}：同じ工程を2度引いている")
            told_dec = {m.group(1) for m in re.finditer(r"判断(R\d+)：", rt.get("飛ばす工程", ""))}
            # 判断の通り方：道筋がその矢印の値を持てば、その矢印を通る（行き先の工程があれば引くこと）。
            # 値の無い矢印（現状の区間など）は、判断の帯と行き先を引けば通る。
            # 判断で終わる道筋：判断の帯が最後の工程で、その判断の帯の条件の文（「拒否された場合は…終了する」など）とその値を引く
            taken, ended = {}, set()
            for did, d in decs.items():
                if head is None or not (head <= d["band"] <= end):
                    continue   # ほかの区間の判断（同じ値が別の区間の判断にも付いている：12 の D21・D23 など）は見ない
                # 対象の値（04 の「:対象」）を持つ矢印は、その値を道筋が持てば通る。値が無いか適用外の値だけの矢印は、その値を道筋が持つか、
                # 判断の帯と行き先を引けば通る（どの矢印にも対象の値が無い判断＝現状の区間などは、図形につながっていない矢印も通る）
                ta = [a for a in d["arrows"] if (a["need"] & set(vals)) or (not a["need"] and a["vals"] & set(vals))]
                if not ta and d["band"] in cited:
                    if all(not a["need"] for a in d["arrows"]):
                        ta = [a for a in d["arrows"] if a["tgt"] is None or a["tgt"] in cited]
                    else:
                        ta = [a for a in d["arrows"] if not a["need"] and a["tgt"] is not None and a["tgt"] in cited]
                if ta:
                    taken[did] = ta
                    for a in ta:
                        if a["tgt"] is not None and a["tgt"] not in cited and verdict == "通る" and st.get(a["tgt"], {}).get("扱い") != "範囲外":
                            errors.append(f"{rid}：矢印 {a['label']} の値を持つが、行き先の工程 R{a['tgt']} を引いていない")
                elif seq and seq[-1] == d["band"] and any(c["工程"] == f"R{d['band']}" and c["R"] != c["工程"] and x in cited
                                                         and set(VALID.findall(c["引用する業務条件の値"])) & set(vals) for x, c in cd.items()):
                    ended.add(did)
                elif d["band"] in cited and any(a["tgt"] in cited and a["tgt"] != d["band"] for a in d["arrows"]) and did not in told_dec and verdict == "通る":
                    errors.append(f"{rid}：判断 {did}「{d['name']}」を通る（帯 R{d['band']} と行き先を引く）が、その矢印の値 {sorted(set().union(*[a['need'] for a in d['arrows']]))} を持たない"
                                  f"（通らないなら「飛ばす工程」に「判断{did}：理由」）")
            taken_bands = {decs[did]["band"] for did in taken}
            if verdict == "通る":
                out_of = [x for x in rows if x in st and st[x]["扱い"] == "範囲外"]
                if out_of:
                    errors.append(f"{rid}：通るの道筋が範囲外の工程 {out_of} を引いている（範囲外の区間は対象外の道筋にする）")
                bad = sorted(s for s in scen if s not in idx)
                if not scen or bad:
                    errors.append(f"{rid}：通すシナリオが無い・実在しない {bad}")
                for did, ta in taken.items():
                    for a in ta:
                        if a["scen"] and not (a["scen"] & scen):
                            errors.append(f"{rid}：矢印 {a['label']} を通すシナリオ {sorted(a['scen'])} が道筋のシナリオに無い")
                for x in rows:
                    s = st.get(x)
                    # 判断のある工程は、この道筋の側の矢印を通すシナリオで見る（工程の対応表は判断の工程を片側のシナリオにだけ結ぶことがある）
                    if s and s["扱い"] == "対象" and x not in taken_bands and not (sids(s["シナリオ"]) & scen):
                        errors.append(f"{rid}：工程 R{x}（{s['作業概要']}）を通すシナリオ {s['シナリオ']} が道筋のシナリオに無い")
                    c = cd.get(x)
                    if c and c["判定"] == "通る" and not (sids(c["流れの中で値を通るシナリオ"]) & scen):
                        errors.append(f"{rid}：条件の文 R{x} を通すシナリオ {c['流れの中で値を通るシナリオ']} が道筋のシナリオに無い")
                # シナリオの順：工程を上から見て、それを通すシナリオの「→」の位置が戻らないこと
                groups, extras = scen_groups(rt["通すシナリオ"])
                g = 0
                for x in seq:
                    if x in taken_bands:
                        cover = set().union(*[a["scen"] for did, ta in taken.items() if decs[did]["band"] == x for a in ta])
                    elif st[x]["扱い"] == "対象":
                        cover = sids(st[x]["シナリオ"])
                    else:
                        continue
                    if not cover:
                        continue
                    ahead = [k for k in range(g, len(groups)) if groups[k] & cover]
                    if ahead:
                        g = ahead[0]
                    elif not (extras & cover):
                        errors.append(f"{rid}：工程 R{x}（{st[x]['作業概要']}）を通すシナリオ {sorted(cover)} が、通すシナリオの「→」の順で前の方にしか無い（順が業務の順と合わない）")
            elif not (rt["対象外の区分"].strip() and rt["理由"].strip() and rt["決めた人"].strip()):
                errors.append(f"{rid}：対象外の区分・理由・決めた人のどれかが空")
            # 業務条件の値：引いた条件の文の値を持つこと（判断の帯の条件の文は、判断を値で通るか判断で終わるなら見ない）
            ended_bands = {decs[did]["band"] for did in ended}
            for x in rows:
                c = cd.get(x)
                alt = x in st and any(y != x and vs2 & set(vals) for y, c2, vs2 in conds_of_step.get(x, []))
                if c and x not in ended_bands and not (x in bands and x in taken_bands) and not alt:
                    need = VALID.findall(c["引用する業務条件の値"])
                    if need and not set(need) & set(vals):
                        errors.append(f"{rid}：条件の文 R{x} の値 {need} を道筋の業務条件の値 {vals} が持たない")
            info.append(dict(rt=rt, rid=rid, rows=rows, seq=seq, sec=sec_steps, taken=taken, ended=ended, pno=pno, vals=vals, scen=scen,
                             verdict=verdict, tests=route_tests(biz, vals, scen, vt) if verdict == "通る" else {},
                             side=side_tests(rt.get("前後のテスト", ""), idx, rid, errors) if verdict == "通る" else {}))
        # ---- 飛ばした工程の理由：(a) 道筋が選ばなかった判断の行き先の側の工程 (b) その工程の前提の条件と同じ業務条件の別の値を道筋が持つ
        #      (c) routes/*.tsv の「飛ばす工程」に理由を書いた。パターンの最初から最後までの工程を全部見る（途中から始まる・途中で終わる道筋も止まる）
        md_rows = {int(y) for y in re.findall(r"\*\*R(\d+)\*\*", (US.parent / "markdown" / flow).read_text(encoding="utf-8"))}
        # 工程の前提の条件：工程の行そのものの条件の文（判断の帯を除く）と、「〜のみ」の条件の文。
        # それ以外の注記（「※競技イベントの場合は…も出力する」「キャンセル後に来られた場合は…伝える」）は工程の中の分かれで、前提にしない
        # 同じ工程の中に、同じ業務条件の別の値の条件の文があるとき（4-1 の「突発的な事象で」と「希少なカードを仕入れた場合」）は、工程の中の分かれで前提にしない
        pre_of = defaultdict(list)   # 工程の行 → 前提の条件の値の組
        fac_of = lambda vs: {v.rsplit("-", 1)[0] for v in vs}
        for sx, cs in conds_of_step.items():
            for x, c, vs in cs:
                if not ((c["R"] == c["工程"] and sx not in bands) or re.fullmatch(r"※?\s*\S{1,12}のみ", c["文"].strip())):
                    continue
                if any(y != x and fac_of(vs2) & fac_of(vs) and vs2 - vs for y, c2, vs2 in cs):
                    continue
                pre_of[sx].append(vs)
        # 行き先の側の工程：行き先を上から並べ、次の行き先の手前まで。いちばん下の行き先は、どの行き先を選んだ道筋も通る工程（合流）の手前まで
        all_steps = sorted(x for x in st if st[x]["扱い"] != "見出し")
        side = {}                    # (判断, 行き先の工程) → その側の工程
        chosen = lambda o, did: {a["tgt"] for a in o["taken"].get(did, [])}
        for did, d in decs.items():
            # 判断の帯から下の行き先で作る（上へ戻る矢印＝一部キャンセルで査定に戻る などは側を作らない）。
            # 帯そのものへの行き先（同じ帯の中の図形へ）の側は、帯より下で次の行き先の手前まで
            ts = sorted({a["tgt"] for a in d["arrows"] if a["tgt"] is not None and a["tgt"] >= d["band"]})
            for k, tg in enumerate(ts):
                if tg == d["band"]:
                    nxt = ts[k + 1] if k + 1 < len(ts) else 10 ** 9
                    side[(did, tg)] = {x for x in all_steps if tg < x < nxt}
                elif k + 1 < len(ts):
                    side[(did, tg)] = {x for x in all_steps if tg <= x < ts[k + 1]}
                else:
                    by_t = {t2: [set(o["seq"]) for o in info if t2 in chosen(o, did)] for t2 in ts}
                    merge = next((x for x in all_steps if x >= tg and all(any(x in s for s in by_t[t2]) for t2 in ts)), None)
                    end = merge if merge is not None else 10 ** 9
                    sec_of_d = next((s for s in (o["sec"] for o in info) if d["band"] in s), all_steps)
                    side[(did, tg)] = {x for x in sec_of_d if tg <= x < end}
        for r in info:
            if not r["sec"]:
                continue
            told = set()
            for ent in [e.strip() for e in r["rt"].get("飛ばす工程", "").split("／") if e.strip()]:
                m = re.match(r"(判断|帯)?R(\d+)：(.+)$", ent)
                refs = [int(y) for y in ROWS.findall(m.group(3))] if m else []
                if not m or len(m.group(3).strip()) < 20:
                    errors.append(f"{r['rid']}：飛ばす工程「{ent[:30]}」が「R番号：理由」「判断R番号：理由」の形でないか、理由が短すぎる")
                    continue
                if not [y for y in refs if y != int(m.group(2)) and y in md_rows]:
                    errors.append(f"{r['rid']}：飛ばす工程 {m.group(1) or ''}R{m.group(2)} の理由が、根拠にする Excel の行（R番号）を引いていない")
                    continue
                if m.group(1) == "判断":
                    if f"R{m.group(2)}" not in decs:
                        errors.append(f"{r['rid']}：飛ばす工程の 判断R{m.group(2)} は判断の図形の行でない")
                    continue
                if m.group(1) == "帯":
                    if int(m.group(2)) not in r["seq"]:
                        errors.append(f"{r['rid']}：飛ばす工程の 帯R{m.group(2)} を道筋が引いていない")
                    continue
                told.add(int(m.group(2)))
            nonchosen = []
            for did, d in decs.items():
                alltg = {a["tgt"] for a in d["arrows"] if a["tgt"] is not None and a["tgt"] >= d["band"]}
                if did in r["ended"]:
                    nonchosen += [(did, tg) for tg in alltg]
                elif did in r["taken"]:
                    nonchosen += [(did, tg) for tg in alltg - chosen(r, did)]
            for x in r["sec"]:
                if x in r["seq"] or x in told:
                    continue
                by_dec = any(x in side.get(k, set()) for k in nonchosen) or any(x > decs[did]["band"] for did in r["ended"])
                # 図形につながっていない矢印（全キャンセルなど）を選んだ道筋は、最後に引いた工程で終わる
                by_dec = by_dec or (any(a["tgt"] is None for ta in r["taken"].values() for a in ta) and r["seq"] and x > r["seq"][-1])
                # 範囲外の工程（tobe のシートの現状の区間など）は、現状の区間の対象外の道筋が引く（どれかの道筋が引くことは取りこぼしで見る）
                by_dec = by_dec or st[x]["扱い"] == "範囲外"
                by_cond = any(conflicts(vs, r["vals"]) for vs in pre_of.get(x, []))
                if not (by_dec or by_cond):
                    errors.append(f"{r['rid']}：工程 R{x}（{st[x]['#']} {st[x]['作業概要']}）を通らないが、選ばなかった判断の側の工程でも、道筋と同じ業務条件の別の値（※支店のみ など）の工程でもない（理由を書くなら「飛ばす工程」の列へ）")
            # 選ばなかった側の工程を引いていないか（前の工程から図の矢印で来る合流は除く）
            shared = {int(m.group(1)) for m in re.finditer(r"帯R(\d+)：", r["rt"].get("飛ばす工程", ""))}
            for i, x in enumerate(r["seq"]):
                prev = r["seq"][i - 1] if i else None
                for (did, tg) in nonchosen:
                    band = decs[did]["band"]
                    if any(c is not None and c < band for c in chosen(r, did)):
                        continue   # 上へ戻る矢印（一部キャンセルで査定に戻る など）を選んだ道筋は、2周目にほかの側を通る
                    merge_ok = prev is not None and (prev, x) in edges and (prev != band or band in chosen(r, did))
                    if x in side.get((did, tg), set()) and not any(x in side.get((did, t2), set()) for t2 in chosen(r, did)) \
                            and not merge_ok and x not in shared:
                        errors.append(f"{r['rid']}：工程 R{x} は判断 {did}「{decs[did]['name']}」の選ばなかった側（行き先 R{tg}）の工程")
            for x in r["seq"]:
                if x in shared:
                    continue
                bad_pre = [sorted(vs) for vs in pre_of.get(x, []) if conflicts(vs, r["vals"])]
                if bad_pre:
                    errors.append(f"{r['rid']}：工程 R{x}（{st[x]['#']} {st[x]['作業概要']}）は条件の文の値 {bad_pre} のときの工程だが、道筋の値 {r['vals']} が当たらない")
            for x in told - set(r["sec"]):
                errors.append(f"{r['rid']}：「飛ばす工程」の R{x} はこのパターンの工程でない")
            for x in told & set(r["seq"]):
                errors.append(f"{r['rid']}：「飛ばす工程」の R{x} を道筋が引いている")
            for did, ta in r["taken"].items():
                for a in ta:
                    if a["tgt"] in told:
                        errors.append(f"{r['rid']}：選んだ矢印 {a['label']} の行き先 R{a['tgt']} を「飛ばす工程」で外している（行き先は引く。違う側なら値を見直す）")
        # 判断の矢印の取りこぼし：どの道筋も通らない矢印
        for did, d in decs.items():
            for a in d["arrows"]:
                if not any(a in o["taken"].get(did, []) for o in info):
                    errors.append(f"{flow}：矢印 {a['label']}（値 {sorted(a['vals'])}）を通る道筋が無い")
        # ---- 通すテスト：値がもっと細かい道筋があれば、そちらに寄せる（キャンセル＋キャンセル後の来店のテストは、来店の道筋へ）
        for r in info:
            for t, have in list(r["tests"].items()):
                if any(o is not r and t in o["tests"] and o["tests"][t] > have for o in info):
                    del r["tests"][t]
        for r in info:
            if r["verdict"] != "通る":
                r["test_text"] = ""
                continue
            groups, extras = scen_groups(r["rt"]["通すシナリオ"])
            parts = []
            for s in [x for gset in groups for x in sorted(gset)] + sorted(extras):
                # 前後のテストでこのシナリオを名指ししたときは、名指ししたテストだけ（分かれ目の値では区別できないテストを外せる）
                ts = sorted(set(r["side"][s])) if s in r["side"] else sorted({t for t in r["tests"] if t.split("/")[0] == s})
                if not ts:
                    errors.append(f"{r['rid']}：通すシナリオ {s} のテストが無い（分かれ目の値にも、前後のテストにも当たらない）")
                    continue
                parts.append(ts[0] if ts == [s] else f"{s}：" + "・".join(t.split("/")[1] for t in ts))
            for s in r["side"]:
                if s not in r["scen"]:
                    errors.append(f"{r['rid']}：前後のテストの {s} が通すシナリオに無い")
            main = " → ".join(parts[:sum(len(gset) for gset in groups)])
            rest = "、".join(parts[sum(len(gset) for gset in groups):])
            r["test_text"] = main + (f"、{rest}" if rest else "")
        for r in info:
            rt, rows = r["rt"], r["rows"]
            figs = []
            for x in rows:
                for n in nodes.get(x, []):
                    if n not in figs:
                        figs.append(n)
            swap = rt.get("図の読み替え", "").strip()
            if swap:
                m = re.match(r"(.+?)→(.+?)／根拠：(.+)$", swap)
                if not m:
                    errors.append(f"{r['rid']}：図の読み替え「{swap}」が「A→B／根拠：…」の形でない")
                elif not any(m.group(1) in x for x in figs):
                    errors.append(f"{r['rid']}：図の読み替えの「{m.group(1)}」が図の画面・データに無い")
                else:
                    figs = [x.replace(m.group(1), m.group(2)) for x in figs]
                    figs.append(f"※図の {m.group(1)} を {m.group(2)} と読む（{m.group(3)}）")
            outside = [titles[x] for x in rows if x in st and st[x]["扱い"] == "システムの外"]
            # 業務フローの＃・作業概要：道筋が引く Excel の行を、その行を含む工程に直して通る順に並べる（パターンの見出しはパターンの列にある）
            picked = []
            for x in rows:
                k = step_of(skeys, x)
                if k is not None and k not in picked and not (st[k]["扱い"] == "見出し" and st[k]["#"] == r["pno"]):
                    picked.append(k)
            lines = [titles[k] for k in picked]
            for part in [q.strip() for q in rt.get("飛ばす工程", "").split("／") if q.strip()]:
                m = re.match(r"(帯)?R(\d+)：(.*)$", part, re.S)
                k = step_of(skeys, int(m.group(2))) if m else None
                if k is None:
                    lines.append(f"※飛ばす工程 {part}")
                elif m.group(1):
                    lines.append(f"※引かない文（{titles[k]} の帯）：{m.group(3)}")
                else:
                    lines.append(f"※飛ばす工程 {titles[k]}：{m.group(3)}")
            out.append([r["rid"], biz, rt["パターン"], rt["業務パターン"], rt["分かれ目"], r["verdict"], rt["通すシナリオ"],
                        r["test_text"], rt.get("Excelとシナリオの違い", "").replace("／", "\n"), "・".join(figs), "・".join(outside),
                        "・".join(r["vals"]), "\n".join(lines),
                        rt["対象外の区分"], rt["理由"], rt["決めた人"], fx.md_source(no)[1]])
        # ---- 取りこぼし
        cited_pass = set().union(*[set(r["rows"]) for r in info if r["verdict"] == "通る"]) if info else set()
        for x, s in sorted(st.items()):
            if s["扱い"] != "見出し" and x not in cited_all:
                errors.append(f"{flow}：工程 R{x}（{s['#']} {s['作業概要']}）がどの道筋にも入っていない")
            elif s["判定"] == "通る" and x not in cited_pass:
                errors.append(f"{flow}：工程 R{x}（{s['#']} {s['作業概要']}）は 11/20 の照合で通るのに、通るの道筋が1本も引いていない（対象外の道筋だけ）")
        for x, c in sorted(cd.items()):
            if c["工程の扱い"] != "見出し" and x not in cited_all:
                errors.append(f"{flow}：条件の文 R{x}「{c['文'][:30]}」がどの道筋にも入っていない")

    # ---- パターンの網羅：パターン一覧の行（と一覧に無い図の流れ）の「図の流れ」の番号に、道筋があること。図が対のシートにあるときはそのシートの道筋
    nzp = lambda s: re.sub(r"[\s　]+", "", s or "")
    routed = {(rt["業務フロー"], rt["パターン"].split()[0]) for rt in routes}
    routed_named = {(rt["業務フロー"], rt["パターン"].split()[0], nzp(rt["パターン"].split(None, 1)[1] if len(rt["パターン"].split(None, 1)) > 1 else "")) for rt in routes}
    flows_in = {rt["業務フロー"] for rt in routes}
    for flow in flows_in:
        for p in pats.get(flow, []):
            if not (p["図の流れ"] or "").strip():
                if not any(rt["業務フロー"] == flow and rt["パターン"].split()[0] == p["番号"] for rt in routes):
                    errors.append(f"{flow}：パターン {p['番号']} {p['パターン']}（図に流れが無い）に道筋が無い")
                continue
            m = re.match(r"(\S+)\s", p["図の流れ"] or "")
            if not m:
                errors.append(f"{flow}：パターン {p['番号']} {p['パターン']} の図の流れが分からない（{p['図の流れ']}）")
                continue
            pair = re.search(r"対のシート (\S+\.md)", p["図の流れ"])
            target = pair.group(1) if pair else flow
            dup = sum(1 for _, s, _, _ in vf.sections_of(target[:2]) if s == m.group(1)) > 1
            pname = nzp(re.split(r"（", p["図の流れ"][len(m.group(0)):])[0])
            hit = any(k[0] == target and k[1] == m.group(1) and (k[2].startswith(pname) or pname.startswith(k[2])) for k in routed_named) if dup else (target, m.group(1)) in routed
            if not hit:
                errors.append(f"{flow}：パターン {p['番号']} {p['パターン']}（図の流れ {m.group(1)}{'・' + target if pair else ''}）に道筋が無い")
    # ---- 業務フローに無いシナリオ（その業務のフォルダのシナリオで、どの道筋にも出ないもの）
    used = set()
    for rt in routes:
        used |= sids(rt["通すシナリオ"])
    bizs = {r[1] for r in out}
    extra = []
    for sid, (folder, _) in sorted(idx.items()):
        if folder in bizs and sid not in used:
            walked = []
            for flow, st in steps.items():
                for x, s in sorted(st.items()):
                    if sid in sids(s["シナリオ"]):
                        t = titles_by_no.get(flow[:2], {}).get(x) or f"{s['#']} {s['作業概要']}"
                        walked.append(f"{fx.md_source(flow[:2])[1]} {t}")
            extra.append([sid, folder, scenario_name(folder, sid), "\n".join(walked)])
    return out, extra, errors


def scenario_name(folder, sid):
    p = US / folder / "scenario_list.md"
    for ln in p.read_text(encoding="utf-8").splitlines():
        if ln.startswith(f"| {sid} |"):
            return ln.split("|")[2].strip()
    return ""


def report(out, extra, errors):
    n = defaultdict(int)
    for r in out:
        n[r[5]] += 1
    print(f"道筋 {len(out)}（" + "・".join(f"{k}{v}" for k, v in n.items()) + f"）、業務フローに無いシナリオ {len(extra)}")
    for e in errors:
        print("NG", e)
    print("OK" if not errors else f"NG {len(errors)} 件")


def cmd_xlsx(path, out, extra):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    wb = Workbook()
    ws = wb.active
    ws.title = "見方"
    bizs = list(dict.fromkeys(r[1] for r in out))   # 業務フローのシートの順（05→18）
    n = defaultdict(int)
    for r in out:
        n[r[5]] += 1
    lines = [
        ("業務パターンとシナリオの対応表（" + "・".join(bizs) + "）", True),
        ("", False),
        ("業務フローの Excel の図を、起点から終点までの道筋ごとに文章にした（1行＝道筋1本。業務ごとにシートを分けた）。道筋ごとに、通すシナリオと、その分かれ目を確かめるテストを並べた。", False),
        ("・業務パターン：Excel の工程の文から作った。Excel に無いことを補ったところは、その旨を文の中に書いた", False),
        ("・業務フローの＃・作業概要：道筋が通る工程を、業務フローの Excel の「＃」「作業概要」の列の言葉で通る順に並べた（システムを触らない工程も入る）。"
         "業務フローの Excel の同じ＃の行と見比べられる。「※飛ばす工程」は、パターンの中で通らない工程とその理由。Excel の行の番号（R23 など）は routes/*.tsv に残す", False),
        ("・業務フローのシート：業務フローの Excel のシートの名前。今のシートと tobe のシートを1つにまとめた業務（店頭買取・商品登録・編集・在庫管理・通販）にだけ出す", False),
        ("・分かれ目：その道筋に進む条件（Excel の判断の図形と、条件の文）", False),
        ("・通すシナリオ：その道筋を最初から最後まで通すシナリオを、通る順に「→」でつないだ（業務フローの範囲を分けて持つシナリオが続く）。「、」のあとは同じ道筋を別の目で確かめるシナリオ", False),
        ("・通すテスト：通すシナリオの順に、シナリオごとのテスト番号を並べた（マトリクスの無いシナリオはシナリオIDだけ）。分かれ目のシナリオは、道筋の業務条件の値を全部持つテスト"
         "（値がもっと細かい道筋があるテストは、そちらにだけ出す）。前後のシナリオ（注文〜ピック・夜間削除など）は、マトリクスの列の値で選んだテスト（routes/*.tsv の「前後のテスト」）", False),
        ("・Excel とシナリオの違い：Excel の流れと、新しいシステム・シナリオ・テストの違い（状態の名前、テストでの印刷のしかた、支払方法ごとの違い など）。根拠の文書を書いた", False),
        ("・システムを触らない工程：道筋の中で、システムの外の作業（ピッキング・商品戻し・メールなど）", False),
        ("・対象外の区分・理由・決めた人：通していない道筋だけに書く。対象外の道筋が無い業務のシートには、この3列を出さない", False),
        ("", False),
        ("抜けが無いことの確かめ方（道具 tools/build_route_table.py。1つでも外れると表を作らない）", True),
        ("・Excel の工程（見出し以外）・判断の矢印・条件の文が、どれか1本の道筋に入っている", False),
        ("・道筋はパターンの最初の工程から始まり、最後の工程（か、先へ出る矢印の無い工程）で終わる。判断では行き先をちょうど1つ選ぶ。途中で飛ばした工程は、判断の別の側の工程か、道筋の値に当たらない条件（※支店のみ など）の工程か、理由を書いたもの（routes/*.tsv の「飛ばす工程」）だけ", False),
        ("・道筋のシナリオが、11/20 の照合でその工程・矢印・条件の文を通すと分かっているシナリオと合い、「→」の順が工程の順と合う。道筋のどのシナリオにもテストが付く", False),
        ("・道具が見るのは道筋が引く工程の行と、値・シナリオ・テストの結び付き。業務パターンの文が Excel の文と合っているかは、業務ごとに codex のレビューで見た", False),
        ("・「→」でつないだテストは、シナリオごとに別々に流す（前のシナリオのテストの注文を、次のシナリオのテストが引き継ぐとは限らない）", False),
        ("・要素ごとの裏付け（図の画面・データごとの対応を含む）は「業務フローとシナリオの対応表.xlsx」。道筋ごとの業務条件の値の番号は routes/*.tsv に残す", False),
        ("・業務フローの Excel の＃（工程）ごと・画面マトリクスごとに通すシナリオを見るときは「業務フローの＃とシナリオの紐づけ.xlsx」", False),
        ("", False),
        (f"道筋 {len(out)} 本：" + "・".join(f"{k} {v}" for k, v in n.items()) + "。抜け 0", True),
        *[(f"・{b}：道筋 {sum(1 for r in out if r[1] == b)} 本（"
           + "・".join(f"{k} {v}" for k, v in sorted({k: sum(1 for r in out if r[1] == b and r[5] == k) for k in ('通る', '対象外')}.items(), reverse=True) if v)
           + "）", False) for b in bizs],
        (f"業務フローに無いシナリオ {len(extra)} 本（別シート。Excel の流れに無い場面を足したもの）", False),
    ]
    for i, (t, b) in enumerate(lines, 1):
        c = ws.cell(row=i, column=1, value=t)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        if b:
            c.font = Font(bold=True)
    ws.column_dimensions["A"].width = 120
    fill = PatternFill("solid", fgColor="DDEBF7")

    def table(title, head, rows, widths):
        s = wb.create_sheet(title)
        s.append(head)
        for c in s[1]:
            c.font = Font(bold=True)
            c.fill = fill
            c.alignment = Alignment(wrap_text=True, vertical="top")
        for r in rows:
            s.append(r)
        for row in s.iter_rows(min_row=2):
            for c in row:
                c.alignment = Alignment(wrap_text=True, vertical="top")
        for i, w in enumerate(widths, 1):
            s.column_dimensions[s.cell(row=1, column=i).column_letter].width = w
        s.freeze_panes = "B2"
        s.auto_filter.ref = s.dimensions

    # 人が見るうえでノイズになる列は出さない（2026-11-25 依頼者「ノイズになる列と行は削除してほしい」）：
    #   業務（シート名と同じ）・図の画面・データ（図形の機械的な一覧。要素ごとの表にある）・業務条件の値（番号。言葉は「分かれ目」）、
    #   対象外の3列はそのシートに対象外の道筋が無いとき
    #   業務フローのシートは、そのシートの道筋が1つの業務フローのシートだけのとき（シート名で分かる）
    drop = {"業務", "図の画面・データ", "業務条件の値"}
    optional = {"対象外の区分", "対象外の理由", "決めた人"}
    widths = dict(zip(HEAD, [9, 14, 20, 70, 24, 8, 26, 30, 40, 30, 22, 12, 36, 14, 30, 20, 14]))
    #   業務フローの＃・作業概要は、業務フローの Excel と見比べる列なので、パターンのすぐ右に置く
    mid = [h for h in HEAD[2:-1] if h != "業務フローの＃・作業概要"]
    mid.insert(1, "業務フローの＃・作業概要")
    order = [HEAD.index(h) for h in HEAD[:2] + ["業務フローのシート"] + mid]
    for b in bizs:
        rows = [r for r in out if r[1] == b]
        keep = [i for i in order
                if HEAD[i] not in drop and not (HEAD[i] in optional and not any(r[i] for r in rows))
                and not (HEAD[i] == "業務フローのシート" and len({r[i] for r in rows}) < 2)]
        table(b[:31], [HEAD[i] for i in keep], [[r[i] for i in keep] for r in rows], [widths[HEAD[i]] for i in keep])
    table("業務フローに無いシナリオ", ["シナリオ", "業務", "シナリオの名前", "11/20 の照合でこのシナリオが通す工程（業務フローのシート・＃・作業概要）"], extra, [10, 16, 60, 60])
    wb.save(path)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    only = set(sys.argv[2:]) if cmd == "check" and len(sys.argv) > 2 else None
    out, extra, errors = build(only)
    report(out, extra, errors)
    if cmd == "xlsx":
        if errors:
            sys.exit("止まる条件に当たったので Excel を書かない")
        cmd_xlsx(sys.argv[2], out, extra)
        print(f"{sys.argv[2]} を作った（{len(out)}行）")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
