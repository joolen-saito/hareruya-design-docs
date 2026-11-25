"""業務フローの Excel とシナリオを突き合わせ、業務フローの全パターンがシナリオで通っているかを確かめる。

2026-11-20 依頼者「シナリオと比較して、業務フローのすべてのパターンが通っていることを検証してほしい」。
業務フローは Excel を直接読む（tools/flow_from_xlsx.py。書き起こしの md とは別に読む）。

確かめる4段
  0 書き起こし   Excel のパターン・工程・判断の分かれ道が、書き起こし（markdown/NN_*.md）と工程の表（網羅マトリクス/<業務>/steps.tsv）に全部あるか
  1 パターン     業務フローパターン（各シートの冒頭の表）ごとに、シナリオ一覧の「業務フローパターンの網羅」にシナリオか対象外の理由があるか。
                 シナリオがあるなら、そのシナリオが工程の対応表（step_map.tsv）でそのパターンの工程を1つ以上通っているか
  2 工程         工程（# の行）ごとに、通すシナリオ（step_map.tsv）か対象外の扱いと理由（step_scope.tsv）があるか。
                 対象外のうち「見出し」はパターン名の行か、「システムの外」はその行の帯にシステムのレーンの図形が無いかを機械で見る
  3 分かれ道     図形の「判断」から出る矢印1本ずつ（判断→行き先）に、それを表す業務条件の値（factors.tsv の引用が判断と行き先の文字を含む）か、
                 branch_map.tsv（人）の対応があり、その値・工程を通るシナリオがあるか

判定：通る／対象外（扱いと理由がある）／要確認（機械では決められない。人が見る）／抜け
出力：業務フローとの照合/01〜04_*.tsv と 照合結果.md

使い方
  python3 -I tools/verify_flow_coverage.py            全部を確かめて出力する（抜け・要確認があっても出力する。終了コードは抜けがあれば1）
"""
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow_from_xlsx as F  # noqa: E402
from build_coverage_matrix import BIZ, MD, OUT, US, read, scenario_index, test_level_marks  # noqa: E402
from build_pattern_matrix import strict_index  # noqa: E402
from check_pattern_coverage import SOURCES, table_rows  # noqa: E402

DEST = US / "業務フローとの照合"
SID = re.compile(r"U[A-Z]{2}-\d+")
SYSTEM_LANES = {"EC-CUBE（本店）", "EC-CUBE（支店）", "MTGバイヤー", "スマレジシステム", "デッキシステム", "Wordpress", "GMO", "ポイントグランター"}
# 線や囲みだけの図形（文字が無い・枠）は数えない
NOT_NODE = {"line", "straightConnector1", "rect", "roundRect", ""}


def norm(s):
    return re.sub(r"[\s　]+", "", s or "")


# 書き起こし（markdown/）は Excel の「GMO」をすべて「SPLINKS」に置き換えている（14シート。注記なし・2026-07-02 の取り込みから）。
# シナリオも SPLINKS で書いているので、Excel の文字はこの置き換えをしてから比べる（照合結果.md に書く）
RENAME = [("GMO", "SPLINKS")]


def xnorm(s):
    s = norm(s)
    for a, b in RENAME:
        s = s.replace(a, b)
    return s


def md_name(no):
    return next(MD.glob(f"{no}_*.md")).name


# ---------------------------------------------------------------- 書き起こしの側
def md_patterns(no):
    out, on = [], False
    for line in (MD / md_name(no)).read_text(encoding="utf-8").splitlines():
        if "業務フローパターン" in line:
            on = True
            continue
        if on and ("参考マニュアル" in line or "アクター" in line):
            break
        m = re.match(r"^- \*\*R\d+\*\*: (\d+)　｜　(.+)$", line) if on else None
        if m:
            out.append((m.group(1), m.group(2).strip()))
    return out


def md_decisions(no):
    """md の図形の表の「判断」と、そこから出る実線の矢印の行き先（文字）"""
    text = (MD / md_name(no)).read_text(encoding="utf-8")
    nodes = {}
    for m in re.finditer(r"^\| (\d+) \| [^|]* \| [^|]* \| ([^|]*) \| ([^|]*) \| \((\d+),(\d+)\) \|", text, re.M):
        nodes[m.group(1)] = (m.group(2).strip(), m.group(3).strip(), int(m.group(4)) + 1)
    edges = re.findall(r"^- \[業務フロー線[^\]]*\] #(\d+) .+? → (?:#(\d+) .+|\(自由端\))$", text, re.M)
    out = []
    for k, (kind, t, row) in nodes.items():
        if kind not in ("判断", "diamond"):  # 書き起こしはひし形を「diamond」のまま載せている
            continue
        outs = sorted(norm(nodes[e][1]) if e else "(自由端)" for s, e in edges if s == k)
        out.append((row, norm(t), outs))
    return sorted(out)


def md_node_ids(no):
    """md の図形の表：(Excel の行, 文字) → [(図形番号, 列)]。行は md の位置(0始まり)+1"""
    text = (MD / md_name(no)).read_text(encoding="utf-8")
    out = defaultdict(list)
    for m in re.finditer(r"^\| (\d+) \| [^|]* \| [^|]* \| ([^|]*) \| ([^|]*) \| \((\d+),(\d+)\) \|", text, re.M):
        out[(int(m.group(4)) + 1, norm(m.group(3)))].append((m.group(1), int(m.group(5)) + 1))
    return out


def node_id(ids, row, text, col):
    c = ids.get((row, xnorm(text))) or ids.get((row, norm(text))) or []
    if len(c) == 1:
        return c[0][0]
    hit = [i for i, cc in c if cc == col]
    return hit[0] if len(hit) == 1 else None


def steps_table():
    """網羅マトリクスの steps.tsv：(md名, R) → 行"""
    out = {}
    for biz in BIZ:
        p = OUT / biz / "steps.tsv"
        if p.exists():
            for r in read(p):
                out[(r["業務フロー"], r["R"])] = dict(r, 業務=biz)
    return out


# ---------------------------------------------------------------- 対応の側
def load_maps():
    scope, smap, facs, vmarks = {}, defaultdict(list), [], defaultdict(set)
    for biz in BIZ:
        d = OUT / biz
        for r in read(d / "step_scope.tsv"):
            scope[(r["業務フロー"], r["R"])] = r
        for r in read(d / "step_map.tsv"):
            smap[(r["業務フロー"], r["R"])].append((r["シナリオID"].strip(), r["引用"]))
        for f in read(d / "factors.tsv"):
            facs.append(dict(f, 業務=biz))
        for r in read(d / "cond_map.tsv") + read(d / "pattern_map.tsv"):
            vmarks[(biz, r["値ID"])].add(r["シナリオID"].strip())
        for vid, sids in test_level_marks(biz).items():
            vmarks[(biz, vid)] |= set(sids)
    return scope, smap, facs, vmarks


def pattern_tables():
    """シナリオ一覧の「業務フローパターンの網羅」の表：(md番号, パターン番号, 名前) → [(表の業務, シナリオID…, 理由)]"""
    out = defaultdict(list)
    for biz, nos in SOURCES.items():
        f = US / biz / "scenario_list.md"
        rows = table_rows(f.read_text(encoding="utf-8"), "## 業務フローパターンの網羅") or []
        for cells in rows:
            if len(cells) < 5:
                continue
            no = re.match(r"\d+", cells[0])
            out[(no.group(0) if no else cells[0], cells[1], norm(cells[2]))].append((biz, SID.findall(cells[3]), cells[3], cells[4]))
    return out


# ---------------------------------------------------------------- 照合
def bands(steps):
    """工程の行 → 帯（その行から次の工程の行の手前まで）。最後の工程は図の下端まで"""
    rows = [r for r, _ in steps]
    out = []
    for i, (r, s) in enumerate(steps):
        end = rows[i + 1] - 1 if i + 1 < len(rows) else 10 ** 6
        out.append((r, end, s))
    return out


def band_of(row, bs):
    for r, end, s in bs:
        if r <= row <= end:
            return r
    return None


PAIR = {"07": "06", "10": "09", "13": "12", "17": "16"}  # tobe → 現状版
HEAD = re.compile(r"^\d+(?:-[①-⑳])?$")


def pname_norm(s):
    return xnorm(re.sub(r"^【[^】]*】", "", (s or "").strip()))


def sections_of(no):
    """図の流れ：# が「数字」か「数字-丸数字」の工程を見出しにし、次の見出しの手前までを1つの流れにする。
    (見出しの行, #, 名前, 終わりの行)"""
    fl = F.read_flow(no)
    st = {(r["R"]): r for r in read_steps(md_name(no))}
    heads = [(r, s, st.get(f"R{r}", {}).get("作業概要", "")) for r, s in fl["steps"] if HEAD.fullmatch(s)]
    out = []
    for i, (r, s, nm) in enumerate(heads):
        end = heads[i + 1][0] - 1 if i + 1 < len(heads) else 10 ** 6
        out.append((r, s, nm, end))
    return out


_STEPS = {}


def read_steps(mdname):
    if not _STEPS:
        for biz in BIZ:
            p = OUT / biz / "steps.tsv"
            if p.exists():
                for r in read(p):
                    _STEPS.setdefault(r["業務フロー"], []).append(r)
    return _STEPS.get(mdname, [])


def assign(n, pname, secs, used, by_number=True):
    """パターン（番号・名前）に当たる図の流れを選ぶ。名前の一致 → 番号の一致 → 枝番（n-①…）の順"""
    want = pname_norm(pname)
    same = [x for x in secs if pname_norm(x[2]) == want and x[0] not in used]
    if same:
        pick = next((x for x in same if x[1] == n), same[0])
        used.add(pick[0])
        return [pick], "名前の一致"
    if by_number:
        num = [x for x in secs if x[1] == n and x[0] not in used]
        if num:
            used.add(num[0][0])
            return [num[0]], "番号の一致（名前は違う）"
        sub = [x for x in secs if x[1].startswith(f"{n}-") and x[0] not in used]
        if sub:
            used.update(x[0] for x in sub)
            return sub, "枝番の流れ"
    return [], ""


def walked_in(mdname, secs, smap):
    out = set()
    for (mdn, R), lst in smap.items():
        if mdn != mdname:
            continue
        rr = int(R[1:])
        if any(a <= rr <= b for a, _, _, b in secs):
            out |= {s for s, _ in lst}
    return out


def main():
    DEST.mkdir(exist_ok=True)
    idx = strict_index(scenario_index())
    live = set(idx)
    scope, smap, facs, vmarks = load_maps()
    st = steps_table()
    ptab = pattern_tables()
    judg = {}
    if (DEST / "judgements.tsv").exists():
        for r in read(DEST / "judgements.tsv"):
            judg[(r["段"], r["業務フロー"], r["行"])] = r
    bmap = {}
    bm_path = DEST / "branch_map.tsv"
    if bm_path.exists():
        for r in read(bm_path):
            bmap[(r["業務フロー"], r["判断の行"], xnorm(r["行き先"]), r.get("行き先のレーン", ""))] = r

    r0, r1, r2, r3 = [], [], [], []
    for no in F.FLOW_MD:
        fl = F.read_flow(no)
        name = md_name(no)
        # ---- 0 書き起こし
        xp = [(n, xnorm(t)) for n, t in fl["patterns"]]
        mp = [(n, norm(t)) for n, t in md_patterns(no)]
        r0.append([name, "パターン", len(xp), len(mp), "一致" if xp == mp else "不一致",
                   "／".join(f"{n}:{t}" for n, t in sorted(set(xp) ^ set(mp)))])
        xs = [(f"R{r}", norm(s)) for r, s in fl["steps"]]
        ms = [(k[1], norm(v["#"])) for k, v in st.items() if k[0] == name]
        r0.append([name, "工程", len(xs), len(ms), "一致" if sorted(xs) == sorted(ms) else "不一致",
                   "／".join(f"{a}:{b}" for a, b in sorted(set(xs) ^ set(ms)))])
        xd = sorted((d["row"], xnorm(d["text"]), sorted(xnorm(o) if o != "(自由端)" else o for o in d["outs"])) for d in fl["decisions"])
        md_ = md_decisions(no)
        r0.append([name, "判断の分かれ道", sum(len(d[2]) for d in xd), sum(len(d[2]) for d in md_),
                   "一致" if [(a, b, c) for a, b, c in xd] == md_ else "不一致",
                   "／".join(str(x) for x in sorted(set(map(str, xd)) ^ set(map(str, md_))))])

        bs = bands(fl["steps"])
        # 帯ごとのシステムのレーンの図形
        sysnodes = defaultdict(list)
        scrnodes = defaultdict(list)  # 画面（定義済み処理）と、システムのレーンの DB の図形
        for sid, (prst, text, row, col) in fl["shapes"].items():
            lane = fl["lanes"].get(col, "")
            b = band_of(row, bs)
            if not b or not text or re.fullmatch(r"\d+", text):
                continue
            if lane in SYSTEM_LANES and prst not in NOT_NODE:
                sysnodes[b].append(f"{lane}:{text}")
            if prst == "flowChartPredefinedProcess":
                scrnodes[b].append(f"画面:{text}")
            elif prst == "flowChartMagneticDisk" and lane in SYSTEM_LANES:
                scrnodes[b].append(f"DB:{text}（{lane}）")

        # ---- 1 パターン：パターン一覧の行 ↔ 図の流れ（見出しの工程から次の見出しの手前まで）。assign_sections を見る
        secs = sections_of(no)
        used = set()
        for n, pname in fl["patterns"]:
            key = (no, n, xnorm(pname))
            entries = ptab.get(key, [])
            claimed = sorted({s for e in entries for s in e[1]})
            dead = [s for s in claimed if s not in live]
            got, how = assign(n, pname, secs, used)
            where = name
            if not got and no in PAIR:  # tobe のシートに描かれていないパターンは、対の現状版のシートの同じ名前の流れで見る
                got, how = assign(n, pname, sections_of(PAIR[no]), set(), by_number=False)
                where = md_name(PAIR[no]) if got else name
                how = f"対のシート {where} の{how}" if got else how
            walked = walked_in(where, got, smap)
            ok_claim = [s for s in claimed if s in walked]
            if not entries:
                verdict, note = "抜け", "シナリオ一覧の表に行が無い"
            elif not claimed:
                reason = "／".join(e[3] for e in entries)
                verdict, note = ("対象外" if reason.strip("-— ") else "抜け"), reason
            elif dead:
                verdict, note = "要確認", f"対象外・欠番のシナリオ {dead}"
            elif not got:
                verdict, note = "要確認", "図にこのパターンの流れ（工程）が描かれていない。表のシナリオだけで確かめる"
            elif not ok_claim:
                verdict, note = "要確認", f"表のシナリオ {claimed} が、工程の対応表でこのパターンの工程を1つも通っていない（通っているのは {sorted(walked) or 'なし'}）"
            else:
                verdict, note = "通る", ""
            jm = judg.get(("パターン", name, n))
            if verdict == "要確認" and jm:
                bad = [x for x in SID.findall(jm.get("シナリオID", "")) if x not in live]
                verdict = jm["判定"] if not bad else "要確認"
                note = f"{note}／人の判定：{jm['理由']}" + (f"（欠番 {bad}）" if bad else "")
            r1.append([name, n, pname, "／".join(f"{x[1]} {x[2]}" for x in got) + (f"（{how}）" if got else ""),
                       "・".join(claimed), "・".join(ok_claim), "・".join(sorted(walked)), verdict, note,
                       "／".join(f"{e[0]}" for e in entries)])
        # パターン一覧に無い図の流れ
        for sec in secs:
            if sec[0] in used:
                continue
            walked = walked_in(name, [sec], smap)
            band = [(r, x) for r, x in fl["steps"] if sec[0] <= r <= sec[3]]
            scs = [scope.get((name, f"R{r}"), {}).get("扱い", "対象") for r, _ in band]
            if walked:
                verdict, note = "通る", ""
            elif all(x != "対象" for x in scs):
                verdict, note = "対象外", "流れの工程が全部対象外（03_工程.tsv の理由）"
            else:
                verdict, note = "抜け", "流れの工程を通るシナリオが無い"
            r1.append([name, "（一覧に無い）", sec[2], f"{sec[1]} {sec[2]}（R{sec[0]}〜）", "", "", "・".join(sorted(walked)), verdict,
                       "パターン一覧に無い図の流れ。" + note, ""])

        # ---- 2 工程
        pat_names = {n: xnorm(t) for n, t in fl["patterns"]}
        for r, s in fl["steps"]:
            R = f"R{r}"
            row = st.get((name, R), {})
            sc = scope.get((name, R), {})
            how = sc.get("扱い", "対象")
            sids = sorted({x for x, _ in smap.get((name, R), [])})
            dead = [x for x in sids if x not in live]
            sysn = sysnodes.get(r, [])
            flag = ""
            if how == "対象":
                if not sids:
                    verdict = "抜け"
                elif dead:
                    verdict, flag = "要確認", f"対象外・欠番のシナリオ {dead}"
                else:
                    verdict = "通る"
            elif how == "見出し":
                pnames = {pname_norm(t) for _, t in fl["patterns"]}
                is_head = bool(HEAD.fullmatch(s)) and (not row.get("作業内容", "").strip() or pname_norm(row.get("作業概要", "")) in pnames)
                verdict = "対象外" if is_head else "要確認"
                flag = "" if is_head else "見出しとしたが、見出しの形（# が数字か数字-丸数字で作業内容が空）でない"
            elif how == "システムの外":
                scr = scrnodes.get(r, [])
                verdict = "要確認" if scr else "対象外"
                flag = ("この工程の行の帯に画面かシステムのDBの図形がある：" + "／".join(scr)) if scr else ""
            else:
                verdict = "対象外" if sc.get("理由") else "要確認"
            jm = judg.get(("工程", name, R))
            if verdict == "要確認" and jm:
                verdict = jm["判定"]
                flag = f"{flag}／人の判定：{jm['理由']}"
                if jm.get("シナリオID"):
                    sids = sorted(set(sids) | set(SID.findall(jm["シナリオID"])))
            r2.append([name, R, s, row.get("作業概要", ""), row.get("作業内容", "")[:120], how, "・".join(sids),
                       sc.get("理由", ""), verdict, flag])

        # ---- 2b 番号の無い工程：見出しの下に # のある工程が1つも無い流れは、作業概要の行を工程として照合する（codex R3。在庫管理 tobe の 14）
        steprows = [r for r, _ in fl["steps"]]
        gai = {}
        for line in (MD / name).read_text(encoding="utf-8").splitlines():
            m = re.match(r"^- \*\*R(\d+)\*\*: (.*)$", line)
            if m and "[作業概要]" in m.group(2) and "[＃]" not in m.group(2):
                gai[int(m.group(1))] = re.sub(r"\*\*\[[^\]]+\]\*\*\s*", "", m.group(2))
        for a_, s_, nm_, b_ in secs:
            if any(a_ < x <= b_ for x in steprows):
                continue
            for rr in sorted(x for x in gai if a_ < x <= b_):
                jm = judg.get(("工程（番号なし）", name, f"R{rr}"))
                txt = gai[rr]
                if jm:
                    sids = sorted(SID.findall(jm.get("シナリオID", "")))
                    bad = [x for x in sids if x not in live]
                    verdict = jm["判定"] if not bad else "要確認"
                    flag = f"番号の無い工程（{s_} {nm_[:20]} の中）／人の判定：{jm['理由']}" + (f"（欠番 {bad}）" if bad else "")
                else:
                    sids, verdict, flag = [], "要確認", f"番号の無い工程（{s_} {nm_[:20]} の中）。judgements.tsv に人が書く"
                parts = txt.split("｜")
                r2.append([name, f"R{rr}", "（番号なし）", parts[0].strip(), parts[-1].strip()[:120] if len(parts) > 1 else "",
                           "（番号なし）", "・".join(sids), "", verdict, flag])

        # ---- 3 分かれ道
        def flow_walkers(row):
            """判断のある図の流れ（見出しから次の見出しの手前まで）の工程を通るシナリオ"""
            sec = [x for x in secs if x[0] <= row <= x[3]]
            return walked_in(name, sec, smap) if sec else set()

        def judge_values(vals, walkers):
            """挙げた対象の値が全部、判断のある流れを通るシナリオで〇のときだけ inflow を返す（codex R2：どれか1つでは逆の値で通ってしまう）"""
            sids = sorted({sx for b, v, how in vals if how == "対象" for sx in vmarks.get((b, v), ())})
            per = [set(vmarks.get((b, v), ())) & walkers for b, v, how in vals if how == "対象"]
            inflow = sorted(set().union(*per)) if per and all(per) else []
            return sids, inflow

        used_bm = set()
        nids = md_node_ids(no)
        for d in fl["decisions"]:
            dstep = band_of(d["row"], bs)
            walkers = flow_walkers(d["row"])
            for o in d["out_shapes"] or [dict(text="(行き先なし)", row=0, col=0)]:
                tgt = o["text"]
                tstep = band_of(o["row"], bs) if o["row"] else None
                tkey = f"{tgt}@R{o['row']}" if o["row"] else tgt
                lane = fl["lanes"].get(o["col"], "") if o["row"] else ""
                # 業務条件の値の候補：引用が書き起こしの図形番号で判断と行き先を両方指す（同じ文字の判断が複数あるので番号で結ぶ。codex R1）。
                # 番号の無い引用は、判断と行き先の文字を両方含むものだけ
                did = node_id(nids, d["row"], d["text"], d["col"])
                tid = node_id(nids, o["row"], tgt, o["col"]) if o["row"] else None
                cands = []
                if tgt != "(自由端)":
                    for f in facs:
                        q = f.get("引用") or ""
                        qids = set(re.findall(r"#(\d+)\s", q + " "))
                        if qids:
                            if (f.get("出典") or "").endswith(name) and did and tid and {did, tid} <= qids:
                                cands.append(f)
                        elif xnorm(d["text"]) in norm(q) and xnorm(tgt) in norm(q):
                            cands.append(f)
                bkey = (name, f"R{d['row']}", xnorm(tkey), lane)
                man = bmap.get(bkey)
                if man:
                    used_bm.add(bkey)
                vals = [(f["業務"], f["値ID"], f["扱い"]) for f in cands]
                if man and man.get("値ID"):
                    vals = []  # 人の対応があればそちらだけを見る（まとめ先の値）
                    for v in re.findall(r"[A-Z]+\d*-\d+", man["値ID"]):
                        f = next((f for f in facs if f["業務"] == man["業務"] and f["値ID"] == v), None)
                        vals.append((man["業務"], v, f["扱い"] if f else "（factors に無い）"))
                vals = sorted(set(vals))
                sids, inflow = judge_values(vals, walkers)
                if man and man.get("判定") in ("対象外", "判断待ち"):
                    verdict, note = man["判定"], man.get("理由", "")
                elif man and man.get("判定") == "通る" and not man.get("値ID"):
                    inflow = sorted(SID.findall(man.get("シナリオID", "")))
                    bad = [x for x in inflow if x not in live]
                    verdict, note = ("通る", man.get("理由", "")) if inflow and not bad else ("要確認", f"branch_map のシナリオが無い・欠番 {bad}")
                elif inflow:
                    verdict, note = "通る", (man or {}).get("理由", "")
                elif sids:
                    verdict, note = "要確認", f"値は通るが、この判断のある流れを通るシナリオ（{sorted(walkers) or 'なし'}）では通っていない"
                elif vals and any(how == "対象" for _, _, how in vals):
                    verdict, note = "抜け", "対象の値に〇が無い"
                elif vals:
                    verdict, note = "要確認", "候補の値が全部適用外。まとめ先の値か対象外の理由を branch_map.tsv に書く"
                else:
                    verdict, note = "要確認", "分かれ道を表す業務条件の値が見つからない（branch_map.tsv に人が書く）"
                both = []
                if dstep and tstep:
                    a = {x for x, _ in smap.get((name, f"R{dstep}"), [])}
                    b = {x for x, _ in smap.get((name, f"R{tstep}"), [])}
                    both = sorted(a & b)
                r3.append([name, f"R{d['row']}", d["text"], "／".join(d["ins"]), tkey, lane,
                           f"R{dstep}" if dstep else "", f"R{tstep}" if tstep else "",
                           "・".join(f"{b}/{v}:{how}" for b, v, how in vals), "・".join(inflow), "・".join(sids),
                           "・".join(sorted(walkers)), "人" if man else "機械", verdict, note])
        # 図に矢印の無い枝（判断のそばのラベルだけ。branch_map.tsv に人が書いたもの）
        for bkey, man in bmap.items():
            if bkey[0] != name or bkey in used_bm:
                continue
            drow = int(man["判断の行"][1:])
            d = next((x for x in fl["decisions"] if x["row"] == drow), None)
            walkers = flow_walkers(drow)
            vals = []
            for v in re.findall(r"[A-Z]+\d*-\d+", man.get("値ID", "")):
                f = next((f for f in facs if f["業務"] == man["業務"] and f["値ID"] == v), None)
                vals.append((man["業務"], v, f["扱い"] if f else "（factors に無い）"))
            sids, inflow = judge_values(vals, walkers)
            if not d:
                verdict, note = "要確認", "branch_map の判断の行に判断の図形が無い"
            elif man.get("判定") == "対象外":
                verdict, note = "対象外", man.get("理由", "")
            elif inflow:
                verdict, note = "通る", man.get("理由", "")
            elif sids:
                verdict, note = "要確認", f"値は通るが、この判断のある流れを通るシナリオ（{sorted(walkers) or 'なし'}）では通っていない"
            else:
                verdict, note = "抜け", "対象の値に〇が無い"
            r3.append([name, man["判断の行"], d["text"] if d else "", "", man["行き先"], man.get("行き先のレーン", ""),
                       f"R{band_of(drow, bs)}", "", "・".join(f"{b}/{v}:{how}" for b, v, how in vals), "・".join(inflow),
                       "・".join(sids), "・".join(sorted(walkers)), "人（図に矢印の無い枝）", verdict, note])

    # ---- 3b 条件の文：作業内容・作業概要に条件の言い回しがある行（判断の図形になっていない分かれ道）
    r4 = []
    COND = re.compile(r"場合|あれば|なければ|以外|か判定|分岐|かどうか|時は|ときは|有無|もしくは|または|によって|によっては|に応じ|ごとに|次第|以上|以下|未満|より高い|のみ|なれば|なったら")  # 以上〜のみは codex R2（価格の境目・「のみ」）  # によって等は codex R1 の指摘（16 R201）で足した
    for no in F.FLOW_MD:
        name = md_name(no)
        fl = F.read_flow(no)
        bs = bands(fl["steps"])
        secs = sections_of(no)
        for line in (MD / name).read_text(encoding="utf-8").splitlines():
            m = re.match(r"^- \*\*R(\d+)\*\*: (.*)$", line)
            if not m or not ("[作業内容]" in m.group(2) or "[作業概要]" in m.group(2)) or not COND.search(m.group(2)):
                continue
            row = int(m.group(1))
            text = re.sub(r"\*\*\[[^\]]+\]\*\*\s*", "", m.group(2))
            body = norm(text.split("｜")[-1]) if "｜" in text else norm(text)
            st_r = band_of(row, bs)
            how = scope.get((name, f"R{st_r}"), {}).get("扱い", "対象") if st_r else "（工程の外）"
            hits = []
            for f in facs:
                q = norm(f.get("引用"))
                if len(q) >= 6 and (q in norm(text) or (len(body) >= 6 and body in q)):
                    hits.append((f["業務"], f["値ID"], f["扱い"]))
            hits = sorted(set(hits))
            sec = [x for x in secs if x[0] <= row <= x[3]]
            walkers = walked_in(name, sec, smap) if sec else set()
            sids = sorted({sx for b, v, h in hits if h == "対象" for sx in vmarks.get((b, v), ())})
            per = [set(vmarks.get((b, v), ())) & walkers for b, v, h in hits if h == "対象"]
            inflow = sorted(set().union(*per)) if per and all(per) else []
            jm = judg.get(("条件の文", name, f"R{row}"))
            if how != "対象" and inflow:  # 工程はシステムの外などでも、値はこの流れを通るシナリオで〇（2026-11-24 対象外と数えていた11件）
                verdict, note = "通る", f"工程は「{how}」だが、引用する値はこの流れを通るシナリオで〇"
            elif how != "対象":
                verdict, note = "対象外", f"工程が「{how}」（03_工程.tsv の理由）"
            elif inflow:
                verdict, note = "通る", ""
            elif hits and all(h != "対象" for _, _, h in hits):
                fx = [f for f in facs if (f["業務"], f["値ID"]) in {(b, v) for b, v, _ in hits}]
                merged = any("重なり" in (f.get("備考") or "") for f in fx)
                verdict = "要確認" if merged else "対象外"
                note = ("引用する値が全部対象外（重なりのまとめ先を見る）：" if merged else "引用する値が全部対象外（決定どおり）：") + \
                    "／".join(f"{f['値ID']}（{f['扱い']}）{f.get('備考', '')[:80]}" for f in fx)
            elif sids:
                verdict, note = "要確認", f"値は通るが、この流れを通るシナリオ（{sorted(walkers) or 'なし'}）では通っていない"
            else:
                verdict, note = "要確認", "この文を引用する業務条件の値が無い"
            if jm and (verdict == "要確認" or jm.get("値ID") or jm.get("判定")):  # 人の判定は機械の判定より優先（codex R3）
                if jm.get("値ID"):  # 人が値を指したら、その値が流れの中で通るかを道具が確かめる
                    hits = []
                    for v in re.findall(r"[A-Z]+\d*-[A-Z]?\d+", jm["値ID"]):
                        f = next((f for f in facs if f["業務"] == jm.get("業務") and f["値ID"] == v), None)
                        hits.append((jm.get("業務"), v, f["扱い"] if f else "（factors に無い）"))
                    sids = sorted({sx for b, v, h in hits if h == "対象" for sx in vmarks.get((b, v), ())})
                    per = [set(vmarks.get((b, v), ())) & walkers for b, v, h in hits if h == "対象"]
                    inflow = sorted(set().union(*per)) if per and all(per) else []
                    if inflow:
                        verdict = "通る"
                    elif any(h == "（factors に無い）" for _, _, h in hits):
                        verdict = "要確認"
                    elif sids:
                        verdict = "要確認"
                        note = f"人の値は通るが、この流れを通るシナリオ（{sorted(walkers) or 'なし'}）では通っていない"
                    elif all(h != "対象" for _, _, h in hits):
                        verdict = jm["判定"] or "対象外"
                    else:
                        verdict = "抜け"
                    note = f"{note}／人の判定：{jm['理由']}"
                else:
                    verdict, note = jm["判定"], f"{note}／人の判定：{jm['理由']}"
                    if jm.get("シナリオID"):
                        inflow = sorted(set(inflow) | set(SID.findall(jm["シナリオID"])))
            r4.append([name, f"R{row}", f"R{st_r}" if st_r else "", how, text[:160], "・".join(f"{b}/{v}:{h}" for b, v, h in hits),
                       "・".join(inflow), verdict, note])

    def w(fn, head, rows):
        with (DEST / fn).open("w", encoding="utf-8", newline="") as fh:
            wr = csv.writer(fh, delimiter="\t", lineterminator="\n")
            wr.writerow(head)
            wr.writerows(rows)

    w("05_条件の文.tsv", ["業務フロー", "R", "工程", "工程の扱い", "文", "引用する業務条件の値", "流れの中で値を通るシナリオ", "判定", "メモ"], r4)
    w("01_書き起こしの照合.tsv", ["業務フロー", "種類", "Excel", "書き起こし", "結果", "差"], r0)
    w("02_パターン.tsv", ["業務フロー", "番号", "パターン", "図の流れ", "表のシナリオ", "工程も通るシナリオ", "流れの工程を通るシナリオ", "判定", "メモ", "表のある業務"], r1)
    w("03_工程.tsv", ["業務フロー", "R", "#", "作業概要", "作業内容（先頭）", "扱い", "シナリオ", "理由", "判定", "メモ"], r2)
    w("04_分かれ道.tsv", ["業務フロー", "判断の行", "判断", "入る矢印", "行き先", "行き先のレーン", "判断の工程", "行き先の工程", "業務条件の値",
                       "流れの中で値を通るシナリオ", "値を通るシナリオ（全部）", "判断のある流れを通るシナリオ", "対応の付け方", "判定", "メモ"], r3)

    def cnt(rows, col):
        c = defaultdict(int)
        for r in rows:
            c[r[col]] += 1
        return dict(c)

    summary = {
        "書き起こし": cnt(r0, 4), "パターン": cnt(r1, 7), "工程": cnt(r2, 8), "分かれ道": cnt(r3, 13), "条件の文": cnt(r4, 7),
    }
    for k, v in summary.items():
        print(f"{k}: {v}")
    sys.exit(1 if any(v.get("抜け") for v in summary.values()) or summary["書き起こし"].get("不一致") else 0)


if __name__ == "__main__":
    main()
