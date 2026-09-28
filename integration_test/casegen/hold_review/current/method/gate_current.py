#!/usr/bin/env python3
"""現行ソース調査の機械検査。網羅・形式・根拠の実在（file:line にそのコードがあるか）を見る。

使い方: python3 gate_current.py <S> <cNN> [...]
"""
import re, subprocess, sys, pathlib

S = pathlib.Path(sys.argv[1])
DEV = pathlib.Path("/home/y-saito/Developments")
REPOS = {"pf-eccube3", "pf-api", "pf-article", "deck-api", "deck-builder", "front-application", "ec-cube"}
COLS = ["論点ID", "機能ID", "現行の判定", "現行での答え", "根拠", "使えるか", "補足"]
V = {"現行で確定", "現行で一部", "現行に無し", "現行に無し（新規実装）"}
USE = {"可", "参考のみ", "不可"}
REF = re.compile(r"([\w.-]+?)(?:@([0-9a-f]{7,40}))?/(\S+?):(\d+)(?:-(\d+))?\s*「(.+?)」")
norm = lambda s: re.sub(r"\s+", "", s)


def fresh(path, a, z):
    """front-application の該当行が2026年以降のコミットで変わっていれば真。"""
    out = subprocess.run(["git", "-C", str(DEV / "front-application"), "blame", "--porcelain",
                          "-L", f"{a},{z}", "--", path], capture_output=True, text=True).stdout
    return any(int(t) >= 1767193200 for t in re.findall(r"^author-time (\d+)", out, re.M))  # 2026-01-01 JST


def check(b):
    errs = []
    brows = [l.split("\t") for l in (S / f"current/batch/{b}.tsv").read_text(encoding="utf-8").rstrip("\n").split("\n")[1:]]
    want = [r[0] for r in brows]
    cat = {r[0]: r[4] for r in brows}
    p = S / f"current/out/{b}.tsv"
    if not p.exists():
        return [f"{b}: 出力が無い"]
    ls = p.read_text(encoding="utf-8").rstrip("\n").split("\n")
    if ls[0].split("\t") != COLS:
        errs.append(f"{b}: ヘッダーが違う")
    rows = [l.split("\t") for l in ls[1:]]
    if [r[0] for r in rows] != want:
        errs.append(f"{b}: 論点の並びが入力と一致しない（入力{len(want)} 出力{len(rows)}）")
    for r in rows:
        if len(r) != 7:
            errs.append(f"{r[0]}: 列数 {len(r)}"); continue
        qid, fid, v, ans, ev, use, note = r
        if v not in V:
            errs.append(f"{qid}: 現行の判定 {v}"); continue
        if v in ("現行で確定", "現行で一部"):
            if use not in USE:
                errs.append(f"{qid}: 使えるか {use}")
            elif use == "可" and cat.get(qid) in ("矛盾", "異常の作り方"):
                errs.append(f"{qid}: 分類が{cat.get(qid)}の論点は「可」にできない（参考のみ）")
            if not ans.strip() or ans.strip() == "—":
                errs.append(f"{qid}: 現行での答えが空")
            refs = REF.findall(ev)
            if not refs:
                errs.append(f"{qid}: 根拠に file:line 「コード」が無い")
            for repo, rev, path, a, z, code in refs:
                if repo not in REPOS:
                    errs.append(f"{qid}: 参照できないリポジトリ {repo}"); continue
                if rev:
                    # 過去の版を引くのは front-application の刷新前の版だけ
                    r = subprocess.run(["git", "-C", str(DEV / repo), "show", f"{rev}:{path}"], capture_output=True)
                    t = subprocess.run(["git", "-C", str(DEV / repo), "log", "-1", "--format=%at", rev],
                                       capture_output=True, text=True).stdout.strip()
                    if repo != "front-application" or r.returncode or not t or int(t) >= 1767193200:
                        errs.append(f"{qid}: 版指定が不正 {repo}@{rev}/{path}（刷新前のfront-applicationのみ可）"); continue
                    lines = r.stdout.decode("utf-8", "ignore").split("\n")
                else:
                    f = DEV / repo / path
                    if not f.is_file():
                        errs.append(f"{qid}: ファイルが無い {repo}/{path}"); continue
                    lines = f.read_text(encoding="utf-8", errors="ignore").split("\n")
                a = int(a); z = int(z) if z else a
                win = norm("".join(lines[max(0, a - 3): z + 2]))
                if norm(code) not in win:
                    errs.append(f"{qid}: {repo}/{path}:{a} にそのコードが無い「{code[:40]}」")
                elif repo == "front-application" and not rev and fresh(path, a, z):
                    errs.append(f"{qid}: {repo}/{path}:{a} は2026年以降に変更された行（刷新に向けた改修で、現行の根拠にならない）")
        else:
            if use.strip() not in ("", "—"):
                errs.append(f"{qid}: 現行に無しで使えるか {use}")
            if not ev.strip():
                errs.append(f"{qid}: 探索の記録が空")
        if not note.strip():
            errs.append(f"{qid}: 補足が空")
    return errs


bad = 0
for b in sys.argv[2:]:
    e = check(b); bad += len(e)
    print(f"{b}: {'OK' if not e else f'NG {len(e)}件'}")
    for x in e[:60]:
        print("  " + x)
sys.exit(1 if bad else 0)
