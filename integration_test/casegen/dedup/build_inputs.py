#!/usr/bin/env python3
"""類似・重複ケースの判定材料を作る（依頼者決定 2026-10-21）。 build_inputs.py

inputs/<機能ID>.md   その機能のケース全件（観点ID・出典・事前準備・手順・期待結果）と、残す側に固定する印
inputs/_cross.md     機能をまたいで手順と期待結果がよく似た組（文字の3つ組の重なり 0.7 以上）
protected.tsv        外さないケース（E2E のテストコードがある・Playwright の結果がある）
batches.tsv          著者1本ぶんの束（ケースの文字数で区切る）

印:
  [E2E] e2e/spec にテストIDが出てくる  [PW:合格] playwright_cases.tsv の結果
  [組 CB-…] 要因の組合せのケース（combination/cb_map.tsv）。組の値も載せる
  [DP] データパターン監査で足したケース（datapattern/dp_map.tsv）
何度流しても同じ。
"""
import csv, json, pathlib, re, collections, itertools

D = pathlib.Path(__file__).resolve().parent
CG = D.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)
CH = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
LIMIT = 110_000   # 1束のケースの文字数


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def load_cases():
    C = collections.defaultdict(list)
    for p in sorted(CG.glob("cases/*_test_cases.tsv")):
        ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
        if ls[0] != CH:
            raise SystemExit(f"{p.name}: 見出しが想定と違う")
        for r in ls[1:]:
            if len(r) == 11:
                C[p.name.split("_")[0]].append(dict(zip(CH, r)))
    return C


def e2e_ids():
    ids = set()
    for p in (ROOT / "e2e/spec").rglob("*"):
        if p.is_file():
            ids |= set(re.findall(r"IT-[A-Z]\d\d-\d\d-\d+", p.read_text(encoding="utf-8", errors="ignore")))
    return ids


def norm(r, t):
    """ケース番号・機能ID・シードの番号を伏せる（似た組を拾うためだけに使う）"""
    tid = r["テストID"]; fid = tid[3:9]; num = tid.split("-")[-1]
    t = re.sub(r"S-[A-Z]\d\d-\d\d(?:-[A-Za-z0-9]+)*", lambda m: re.sub(r"-\d+$", "", m.group(0)), t)
    if num.isdigit():
        t = re.sub(r"(?<![0-9])0*%d(?![0-9])" % int(num), "#", t)
    f = fid.replace("-", "")
    return t.replace(fid, "").replace(f, "").replace(f.lower(), "")


def grams(t, n=3):
    t = re.sub(r"[\s　]", "", t)
    return {t[i:i + n] for i in range(max(1, len(t) - n + 1))}


def block(r, marks):
    m = " ".join(marks.get(r["テストID"], []))
    return (f"### {r['テストID']} {m}\n- 観点ID: {r['観点ID']}\n- 出典: {r['出典']}\n"
            f"- 事前準備: {r['事前準備']}\n- 手順: {r['手順']}\n- 期待結果: {r['期待結果']}\n\n")


def main():
    C = load_cases()
    units = {r["機能ID"]: r for r in rd(CG / "combination/units.tsv")}
    e2e = e2e_ids()
    pw = {r["テストID"]: r["結果"] for r in rd(CG / "playwright_cases.tsv")}
    cb = {r["テストID"]: r["組ID"] for r in rd(CG / "combination/cb_map.tsv")}
    combo = {}
    for p in (CG / "combination/combos").glob("*.tsv"):
        if "_" in p.stem:
            continue
        for r in rd(p):
            combo[r["組ID"]] = r["組（読める形）"]
    dp = {r["テストID"] for r in rd(CG / "datapattern/dp_map.tsv")}
    marks = collections.defaultdict(list)
    prot = []
    for fid, L in C.items():
        for r in L:
            t = r["テストID"]
            if t in e2e:
                marks[t].append("[E2E]")
            if t in pw:
                marks[t].append(f"[PW:{pw[t]}]")
            if t in e2e or t in pw:
                prot.append([t, fid, "E2E" if t in e2e else "", pw.get(t, "")])
            if t in cb:
                marks[t].append(f"[組 {cb[t]}: {combo.get(cb[t], '')}]")
            if t in dp:
                marks[t].append("[DP]")
    (D / "protected.tsv").write_text("テストID\t機能ID\tE2E\tPlaywright\n" + "".join("\t".join(x) + "\n" for x in sorted(prot)), encoding="utf-8")

    sizes = {}
    for fid, L in sorted(C.items()):
        u = units.get(fid, {})
        fac = CG / f"combination/factors/{fid}_factors.tsv"
        head = (f"# {fid} {u.get('機能名', '')}（{len(L)}件）\n\n"
                f"- 設計書の写し: integration_test/casegen/combination/units/{fid}/design.txt（行頭 L0001…。シート: {u.get('シート', '')}）\n"
                f"- 共通シート: {u.get('共通シート', '') or 'なし'}（integration_test/casegen/combination/units/_common/）\n"
                f"- 要因表: {('integration_test/casegen/combination/factors/' + fid + '_factors.tsv') if fac.exists() else 'なし'}\n\n")
        body = "".join(block(r, marks) for r in L)
        (D / f"inputs/{fid}.md").write_text(head + body, encoding="utf-8")
        sizes[fid] = len(body)

    # 機能をまたぐ似た組
    allr = [r for L in C.values() for r in L]
    G = [(r, grams(norm(r, r["手順"]) + "|" + norm(r, r["期待結果"]))) for r in allr]
    df = collections.Counter(g for _, s in G for g in s)
    idx = collections.defaultdict(list)
    key = [sorted(s, key=lambda g: (df[g], g))[:12] for _, s in G]
    for i, ks in enumerate(key):
        for g in ks:
            idx[g].append(i)
    pairs = []
    for i, (a, s) in enumerate(G):
        cand = collections.Counter(j for g in key[i] for j in idx[g] if j > i and G[j][0]["テストID"][3:9] != a["テストID"][3:9])
        for j, c in cand.items():
            if c >= 3:
                s2 = G[j][1]
                js = len(s & s2) / len(s | s2)
                if js >= 0.7:
                    pairs.append((round(js, 3), a, G[j][0]))
    pairs.sort(key=lambda x: (-x[0], x[1]["テストID"], x[2]["テストID"]))
    head = f"# 機能をまたいで手順と期待結果がよく似た組（全{len(pairs)}組）\n\n設計書の写しは integration_test/casegen/combination/units/<機能ID>/design.txt。\n\n"
    out = []
    for k, (js, a, b) in enumerate(pairs, 1):
        ua, ub = units.get(a["テストID"][3:9], {}), units.get(b["テストID"][3:9], {})
        out.append(f"## 組{k:03d}（重なり {js}）{a['テストID']}（{ua.get('機能名', '')}）× {b['テストID']}（{ub.get('機能名', '')}）\n\n"
                   + block(a, marks) + block(b, marks))
    XN = 3   # 機能またぎは3束に分ける
    per = (len(out) + XN - 1) // XN
    for k in range(XN):
        (D / f"inputs/_cross_{k + 1}.md").write_text(head + "".join(out[k * per:(k + 1) * per]), encoding="utf-8")

    # 束: 機能順に詰める。大きい機能は1本で1機能
    B, cur, n = [], [], 0
    for fid in sorted(sizes):
        if cur and n + sizes[fid] > LIMIT:
            B.append(cur); cur, n = [], 0
        cur.append(fid); n += sizes[fid]
    if cur:
        B.append(cur)
    lines = ["束\t機能ID\tケース数\t文字数\n"]
    for k, fs in enumerate(B, 1):
        lines.append(f"D_{k:03d}\t{','.join(fs)}\t{sum(len(C[f]) for f in fs)}\t{sum(sizes[f] for f in fs)}\n")
    for k in range(XN):
        ch = out[k * per:(k + 1) * per]
        lines.append(f"X_{k + 1:03d}\t_cross_{k + 1}\t{len(ch)}組\t{len(''.join(ch))}\n")
    (D / "batches.tsv").write_text("".join(lines), encoding="utf-8")
    print(f"機能 {len(C)}・ケース {len(allr)}・外さない {len(prot)}・機能またぎの組 {len(pairs)}・束 {len(B)}+1")


if __name__ == "__main__":
    main()
