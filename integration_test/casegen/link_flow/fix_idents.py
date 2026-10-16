#!/usr/bin/env python3
"""合流前に、前提条件の検査 G5（ケース専用データの識別子の一意性）に掛かる書き方を機械的に直す。

  fix_idents.py <G5の出力>            何を置き換えるかを表示するだけ
  fix_idents.py <G5の出力> --apply    cases/<群>_*.tsv を書き換え、fix_idents_log.tsv に追記する

<G5の出力> は、合流を試した写しで `precond/gate_precond.py <機能ID>` を流したときの「G5 …」の行を集めたファイル。
../link_pub/fix_idents.py と同じ考え方で、置き換えは次だけ（precond/README.md P7 の改名の範囲。期待結果の数量・状態語は変えない）。
1. この群のシードで作るパスワード「Passw0rd!X」を「Passw0rd-X」にする。検査の字句は「!」で切れるので、
   「Passw0rd」と「X」が単独の識別子になって重なる。既存のシード（../cases/）に同じ文字列があるものは変えない。
2. G5 が挙げた語のうち「機能番号＋群」の形（A0603・M0409RD・A06-03AB）を、機能IDの形と群の文字に分ける
   （A06-03、M04-09 RD、A06-03 AB）。機能IDの形は検査が識別子に数えず、2文字の群は字句にならない。
3. 群 AC の共有の商品名「AC申込用サプライ03/04/05」を「…甲/乙/丙」にする（申込時に自動で保存されるメモの値「…04x1」も同じく変わる）。
置き換えるのは、テストID・シードID・使用シードの列以外のセル。語の途中（M0327RB-001 の M0327RB など）は変えない。
"""
import glob, pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
TOK = r"(?<![A-Za-z0-9_.@\-]){}(?![A-Za-z0-9_.@\-])"
PW = re.compile(r"Passw0rd!([A-Za-z0-9]+)")
SUPPLY = {"03": "甲", "04": "乙", "05": "丙"}


def split_token(t):
    for pat, rep in ((r"([A-Z])(\d\d)(\d\d)", r"\1\2-\3"),
                     (r"([A-Z])(\d\d)(\d\d)([A-Z]{1,3})", r"\1\2-\3 \4"),
                     (r"([A-Z])(\d\d)-(\d\d)([A-Z]{1,3})", r"\1\2-\3 \4")):
        if re.fullmatch(pat, t):
            return re.sub(pat, rep, t)
    return None


def main(g5, apply):
    existing = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        existing |= set(PW.findall(open(p, encoding="utf-8").read()))
    flagged = {}   # 機能ID → 語の集合
    for line in open(g5, encoding="utf-8"):
        m = re.search(r"G5 (?:IT|S)-([A-Z]\d\d-\d\d)-.*?(?:専用データ|識別子) (\S+?)(?:（| が)", line)
        if m:
            flagged.setdefault(m.group(1), set()).add(m.group(2))
    log, plan = [], {}
    for p in sorted(glob.glob(str(P / "cases/*_*.tsv"))):
        code = pathlib.Path(p).name.split("_")[0]
        lines = open(p, encoding="utf-8").read().split("\n")
        out = []
        for i, line in enumerate(lines):
            if i == 0 or not line:
                out.append(line); continue
            m = re.match(rf"^(?:IT|S)-([A-Z]\d\d-\d\d)-{code}", line)
            assert m, f"{p}:{i + 1} 行の機能が決まらない"
            fid, rid = m.group(1), line.split("\t")[0]
            skip = {0, 9} if p.endswith("_test_cases.tsv") else {0}
            cols = line.split("\t")
            for j, c in enumerate(cols):
                if j in skip:
                    continue
                new = c

                def pw(mm):
                    if mm.group(1) in existing:
                        return mm.group(0)
                    log.append([code, rid, mm.group(0), f"Passw0rd-{mm.group(1)}"])
                    return f"Passw0rd-{mm.group(1)}"
                new = PW.sub(pw, new)
                for t in sorted(flagged.get(fid, ()), key=len, reverse=True):
                    rep = split_token(t)
                    if rep:
                        new, n = re.subn(TOK.format(re.escape(t)), rep, new)
                        log += [[code, rid, t, rep]] * n
                if code == "AC":
                    for a, b in SUPPLY.items():
                        new, n = re.subn(f"AC申込用サプライ{a}", f"AC申込用サプライ{b}", new)
                        log += [[code, rid, f"AC申込用サプライ{a}", f"AC申込用サプライ{b}"]] * n
                cols[j] = new
            out.append("\t".join(cols))
        plan[p] = "\n".join(out)
    seen = {}
    for c, _, a, b in log:
        seen[(c, a, b)] = seen.get((c, a, b), 0) + 1
    for (c, a, b), n in sorted(seen.items()):
        print(c, a, "→", b, f"({n}箇所)")
    left = {f: [t for t in ts if not split_token(t) and not t.startswith("Passw0rd") and not re.fullmatch(r"0[345]x1", t)]
            for f, ts in flagged.items()}
    print("規則で直せない語:", {f: v for f, v in left.items() if v})
    if apply:
        for p, s in plan.items():
            open(p, "w", encoding="utf-8").write(s)
        lp = P / "fix_idents_log.tsv"
        old = lp.read_text(encoding="utf-8").rstrip("\n").split("\n")[1:] if lp.exists() else []
        lp.write_text("\n".join(["群\t行\t置換前\t置換後"] + old + ["\t".join(r) for r in log]) + "\n", encoding="utf-8")
        print("書き込んだ", len(log), "箇所")


if __name__ == "__main__":
    main(sys.argv[1], "--apply" in sys.argv)
