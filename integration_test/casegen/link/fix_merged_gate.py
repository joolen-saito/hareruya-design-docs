#!/usr/bin/env python3
"""合流させた連携ケースを、前提条件のゲート（precond/gate_precond.py）に通す。

G5（識別子の一意性）: 連携ケースが決めた識別子（名称・コード・メール・パスワードなど）が、他のケースの文や
他のケース専用シードと重なっているものを、連携ケースの側で改名する。既存のケースとシードは変えない。
改名は「元の識別子＋機能IDとケース番号」。その連携ケースの行（事前準備・手順・期待結果）と、
そのケースが使うケース専用シードの行にだけ当てる。改名は link/merged_renames.tsv に残す。
"""
import csv, pathlib, re, subprocess, sys, collections

CG = pathlib.Path(__file__).resolve().parents[1]
L = CG / "link"
B = r"[A-Za-z0-9_.@\-]"


def rd(p):
    r = list(csv.reader(p.open(encoding="utf-8"), delimiter="\t"))
    return r[0], [x for x in r[1:] if x]


def wr(p, h, rows):
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n"); w.writerow(h); w.writerows(rows)


def newname(tok, fid, n):
    suf = f"{fid.replace('-', '')}n{n}"
    if "@" in tok:
        a, b = tok.split("@", 1); return f"{a}-{suf.lower()}@{b}"
    m = re.match(r"(.+)\.(csv|tsv|txt|png|jpg|jpeg|gif|pdf|zip|html)$", tok, re.I)
    if m:
        return f"{m.group(1)}-{suf}.{m.group(2)}"
    return tok + suf


def main():
    new_ids = {r[1]: r for r in rd(L / "merged_map.tsv")[1]}
    log_p = L / "merged_renames.tsv"
    log = rd(log_p)[1] if log_p.exists() else []
    for it in range(8):
        fids = sorted({r[3] for r in new_ids.values()})
        out = subprocess.run([sys.executable, str(CG / "precond/gate_precond.py"), "--all"], capture_output=True, text=True).stdout
        bad = [l.split()[0] for l in out.splitlines() if re.match(r"[A-Z]\d\d-\d\d\s+.*G5=", l)]
        if not bad:
            print(f"G5 解消（{it}巡）"); break
        todo = collections.defaultdict(set)      # (fid, 新テストID) → 改名する識別子
        for fid in bad:
            det = subprocess.run([sys.executable, str(CG / "precond/gate_precond.py"), fid], capture_output=True, text=True).stdout
            ch, C = rd(CG / f"cases/{fid}_test_cases.tsv"); sh, S = rd(CG / f"cases/{fid}_seed_data.tsv")
            case_of_seed = collections.defaultdict(list)
            for c in C:
                for s in re.split(r"[,、]", c[6]):
                    case_of_seed[s.strip()].append(c[0])
            for l in det.splitlines():
                m = re.match(r"\s+G5 (\S+): 他ケースの専用データ (\S+?)（(\S+?)）を使っている", l)
                if m:
                    case, tok, seed = m.groups()
                    if "-L-" in seed:                      # 連携ケースのシードが決めた識別子 → その連携ケースを改名
                        owner_fid = re.match(r"S-(\w\d\d-\d\d)-", seed).group(1)
                        todo[(owner_fid, seed)].add(tok)
                    elif case in new_ids:                  # 連携ケースの文が既存の専用データを使っている
                        todo[(fid, "CASE:" + case)].add(tok)
                    continue
                m = re.match(r"\s+G5 (\S+): 識別子 (\S+) が他のケース専用シードと重なる: (.+)", l)
                if m:
                    seed, tok, others = m.groups()
                    cands = [(fid, seed)] + [tuple(o.split(":", 1)) for o in others.split(",")]
                    hit = [(f, s) for f, s in cands if "-L-" in s]
                    # 連携ケースどうしの重なりは、挙がった全部を改名する（それぞれ機能IDとケース番号が付くので一意になる）
                    for f, s in hit:
                        todo[(f, s)].add(tok)
        if not todo:
            print("改名できる G5 が残っていない"); print(out[-600:]); break
        n_ren = 0
        byfid = collections.defaultdict(list)
        for (fid, key), toks in todo.items():
            byfid[fid].append((key, toks))
        for fid, items in byfid.items():
            cp, sp = CG / f"cases/{fid}_test_cases.tsv", CG / f"cases/{fid}_seed_data.tsv"
            ch, C = rd(cp); sh, S = rd(sp)
            for key, toks in items:
                if key.startswith("CASE:"):
                    cases = [key[5:]]
                else:
                    cases = [c[0] for c in C if key in [s.strip() for s in re.split(r"[,、]", c[6])] and c[0] in new_ids]
                for case in cases:
                    n = case[-3:]
                    row = next(c for c in C if c[0] == case)
                    seeds = {s.strip() for s in re.split(r"[,、]", row[6])}
                    for tok in sorted(toks, key=len, reverse=True):
                        new = newname(tok, fid, n)
                        pat = re.compile(rf"(?<![A-Za-z0-9]){re.escape(tok)}(?!{B})")
                        hit = 0
                        for i in (7, 8, 9):
                            row[i], k = pat.subn(new, row[i]); hit += k
                        for s in S:
                            if s[0] in seeds and s[6].strip() == "ケース専用":
                                for i in (2, 3, 4, 5):
                                    s[i], k = pat.subn(new, s[i]); hit += k
                        if hit:
                            log.append([case, tok, new, str(hit)]); n_ren += 1
            wr(cp, ch, C); wr(sp, sh, S)
        print(f"{it + 1}巡目: 改名 {n_ren}")
        if not n_ren:
            print("進まない"); break
    wr(log_p, ["テストID", "旧", "新", "置換箇所数"], log)


if __name__ == "__main__":
    main()
