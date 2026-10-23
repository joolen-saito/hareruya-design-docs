#!/usr/bin/env python3
"""戻すケース（revive/cases・11列）の機械検査。 verify_rv.py [機能ID [担当]]（省略時は parts.tsv の全部）

- 担当の範囲の外したケースすべてに処置が1行ずつあること。戻すケースは行があり、戻さないケースは行が無いこと。
- テストIDは担当の範囲の外したケースのもので、要求ID・観点ID・出典・連鎖IDは元のまま。
- 本文に中継を書かない。使用シードに用意しない前提のシード（中継）を入れない。使うシードはどれも作り方が決まっている（未確定・未整備が無い）。
- 物理名・禁止語・「〜こと」・空欄・事前準備のシードID。
期待結果の正しさは codex レビューで見る。
"""
import csv, glob, re, sys, pathlib, collections

R = pathlib.Path(__file__).resolve().parent
CG = R.parent
csv.field_size_limit(10**9)
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
DHDR = ["テストID", "処置", "理由"]
KEEP = ("そのまま戻す", "直して戻す")
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD|設計どおり|設計書どおり|仕様どおり|正しいこと|正しく")
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+|api/v1/")
NOUSE = re.compile(r"-RELAY\b|^S-B16-09-ENV$")
UNS = re.compile(r"未確定|未整備")


def read(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


def hdr(p):
    return open(p, encoding="utf-8").readline().rstrip("\n").split("\t")


def seeds_of(s):
    return [x.strip() for x in re.split(r"[,、]", s) if x.strip() and x.strip() != "—"]


def main(args):
    parts = read(R / "parts.tsv")
    if args:
        parts = [p for p in parts if p["機能ID"] == args[0] and (len(args) < 2 or p["担当"] == args[1])]
    # どの機能のシードでも引けるようにする（他の機能の共有可シードを使うケースがある）
    known = {}
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        for r in read(p):
            known.setdefault(r["シードID"], r)
    for r in read(CG / "excluded_open_seeds.tsv"):
        known.setdefault(r["シードID"], r)
    for p in glob.glob(str(R / "cases/*_rv_shared_seeds.tsv")) + glob.glob(str(R / "cases/*_rv_seed_data.tsv")):
        for r in read(p):
            known[r["シードID"]] = r      # 差し替え後の中身で判定する
    bad = total = 0
    for pt in parts:
        fid, part, lo, hi = pt["機能ID"], pt["担当"], int(pt["開始"]), int(pt["終了"])
        err = []
        ex = {r["テストID"]: r for r in read(R / f"units/{fid}/excluded_cases.tsv")
              if lo <= int(r["テストID"].rsplit("-", 1)[1]) <= hi}
        base = R / f"cases/{fid}_{part}_rv"
        ps = {k: pathlib.Path(f"{base}_{k}.tsv") for k in ("test_cases", "seed_data", "dispositions")}
        miss = [k for k, p in ps.items() if not p.exists()]
        if miss:
            print(f"{fid} {part}: ファイルが無い {miss}"); bad += 1; continue
        for k, h in (("test_cases", HDR), ("seed_data", SHDR), ("dispositions", DHDR)):
            if hdr(ps[k]) != h:
                err.append(("形式", k, "ヘッダが規定と違う"))
        if err:
            print(f"{fid} {part}: 不合格"); [print("   ", *e) for e in err]; bad += 1; continue
        C, S, D = read(ps["test_cases"]), read(ps["seed_data"]), read(ps["dispositions"])
        dmap = collections.defaultdict(list)
        for r in D:
            dmap[r["テストID"]].append(r)
        for t in ex:
            if len(dmap[t]) != 1:
                err.append(("処置", t, f"処置が{len(dmap[t])}行（1行であること）"))
        for t in dmap:
            if t not in ex:
                err.append(("処置", t, "担当の範囲の外したケースでない"))
        cids = [x["テストID"] for x in C]
        if cids != sorted(cids) or len(cids) != len(set(cids)):
            err.append(("形式", "", "テストIDの順に重複なく並べる"))
        for t, rs in dmap.items():
            how = rs[0]["処置"]
            if how not in KEEP + ("戻さない",):
                err.append(("処置", t, f"処置が不正: {how!r}"))
            if not (rs[0]["理由"] or "").strip() and how != "そのまま戻す":
                err.append(("処置", t, "理由が無い"))
            if (how in KEEP) != (t in cids):
                err.append(("処置", t, "戻すならケースの行が要り、戻さないなら行を書かない"))
        sid = {r["シードID"]: r for r in S}
        for s, r in sid.items():
            if not s.startswith(f"S-{fid}-"):
                err.append(("シード", s, f"S-{fid}- で始まっていない"))
            if (r.get("共有") or "").strip() not in ("共有可", "ケース専用"):
                err.append(("シード", s, "共有 列が不正"))
            if NOUSE.search(s):
                err.append(("シード", s, "用意しない前提のシードを書かない"))
        for x in C:
            t = x["テストID"]
            if None in x or any(v is None for v in x.values()):
                err.append(("形式", t, "列数が合わない")); continue
            o = ex.get(t)
            if not o:
                err.append(("ID", t, "担当の範囲の外したケースでない")); continue
            for c in ("要求ID", "連鎖ID", "観点ID", "出典"):
                if x[c] != o[c]:
                    err.append(("元のまま", t, f"{c} を変えている"))
            if x["優先度"] not in ("P1", "P2", "P3"):
                err.append(("優先度", t, x["優先度"]))
            if x["実行区分"] not in ("ブラウザのみ", "ブラウザ+DB確認"):
                err.append(("実行区分", t, x["実行区分"]))
            for c in ("事前準備", "手順", "期待結果", "使用シード"):
                if not x[c].strip() or x[c].strip() == "—":
                    err.append(("空欄", t, c))
            if '"' in "".join(x.values()):
                err.append(("形式", t, "ダブルクォートを含む"))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            body = " ".join(x[c] for c in ("事前準備", "手順", "期待結果"))
            if "中継" in body:
                err.append(("中継", t, "本文に中継がある"))
            m = BAN.search(body)
            if m:
                err.append(("禁止語", t, m.group(0)))
            for m in PHYS.finditer(re.sub(r"[\w.\-]+@[\w.\-]+|[\w\-{}〔〕]+\.(?:csv|tsv|txt|pdf|png|jpg|bin|json|zip|xml|html|config)|https?://\S+|[A-Za-z]:\\\S+", " ", body)):
                err.append(("物理名", t, m.group(0)))
            for s in seeds_of(x["使用シード"]):
                if NOUSE.search(s):
                    err.append(("シード", t, f"用意しない前提のシードを使っている: {s}"))
                elif s not in known:
                    err.append(("シード", t, f"どこにも無いシード: {s}"))
                elif UNS.search(known[s].get("投入方法") or ""):
                    err.append(("シード", t, f"作り方が未確定・未整備のシード: {s}"))
                if s not in x["事前準備"]:
                    err.append(("シード", t, f"事前準備にシードIDが無い: {s}"))
        used = {s for x in C for s in seeds_of(x["使用シード"])}
        for s in sid:
            if s not in used:
                err.append(("シード", s, "どの戻すケースも使わない"))
        k = collections.Counter(rs[0]["処置"] for rs in dmap.values())
        total += len(C); bad += bool(err)
        print(f"{fid} {part}: 範囲 {len(ex)}件 戻す {len(C)}（{dict(k)}） " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:50]:
            print("   ", *e)
    print(f"計 戻す {total}件 / 不合格 {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)
