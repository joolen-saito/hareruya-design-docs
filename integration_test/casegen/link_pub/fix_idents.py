#!/usr/bin/env python3
"""合流前に、前提条件のゲート G5（ケース専用データの識別子の全機能一意）に掛かる書き方を機械的に直す。

  fix_idents.py            何を置き換えるかを表示するだけ
  fix_idents.py --apply    cases/<群>_*.tsv を書き換え、fix_idents_log.tsv に記録する

置き換えは2種類だけ（precond/README.md P7 の改名の範囲。期待結果の値・数量・状態語は変えない）。
1. この群のシードで作るパスワード「Passw0rd!X」を「Passw0rd-X」にする。ゲートの字句の切り方では「!」で
   切れて「Passw0rd」単独が識別子になり、同じ機能の既存ケースの「Passw0rd」と重なる。
   既存のシード（../cases/）に同じ文字列があるもの（既存のアカウントを指しているもの）は変えない。
2. 群の番号だけの識別子（例「QB001」）に機能番号を前に付ける（例「M0326QB001」）。
   群の番号は機能ごとに001から振ったので、機能が違うと同じ形になる。行の機能はテストID・シードIDから決める。
"""
import glob, pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
IDENT = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.@\-]{3,}")   # gate_precond.py と同じ字句
PW = re.compile(r"Passw0rd!([A-Za-z0-9]+)")


def main(apply):
    existing = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        existing |= set(PW.findall(open(p, encoding="utf-8").read()))
    log = []
    for p in sorted(glob.glob(str(P / "cases/*_*.tsv"))):
        code = pathlib.Path(p).name.split("_")[0]
        lines = open(p, encoding="utf-8").read().split("\n")
        out = []
        for i, line in enumerate(lines):
            if i == 0 or not line:
                out.append(line); continue
            m = re.match(rf"^(?:IT|S)-([A-Z]\d\d-\d\d)-{code}", line)
            assert m, f"{p}:{i + 1} 行の機能が決まらない"
            fid = m.group(1)

            def pw(mm):
                if mm.group(1) in existing:
                    return mm.group(0)
                log.append([code, line.split("\t")[0], mm.group(0), f"Passw0rd-{mm.group(1)}"])
                return f"Passw0rd-{mm.group(1)}"
            new = PW.sub(pw, line)

            def num(mm):
                t = mm.group(0)
                t0 = t.rstrip(".-")
                if re.fullmatch(rf"{code}\d{{3}}", t0):
                    rep = fid.replace("-", "") + t0
                    log.append([code, line.split("\t")[0], t0, rep])
                    return rep + t[len(t0):]
                return t
            cols = new.split("\t")
            # テストID・シードID・使用シードの列は識別子の改名の対象にしない
            skip = {0}
            if p.endswith("_test_cases.tsv"):
                skip.add(9)   # 使用シード
            cols = [c if j in skip else IDENT.sub(num, c) for j, c in enumerate(cols)]
            out.append("\t".join(cols))
        if apply:
            open(p, "w", encoding="utf-8").write("\n".join(out))
    seen = {}
    for c, row, a, b in log:
        seen.setdefault((c, a, b), 0)
        seen[(c, a, b)] += 1
    for (c, a, b), n in sorted(seen.items()):
        print(c, a, "→", b, f"({n}行)")
    if apply:
        (P / "fix_idents_log.tsv").write_text(
            "\n".join("\t".join(r) for r in [["群", "行", "置換前", "置換後"]] + log) + "\n", encoding="utf-8")
        print("書き込んだ", len(log), "箇所")


if __name__ == "__main__":
    main("--apply" in sys.argv)
