#!/usr/bin/env python3
"""前提条件の書き直しの依頼文を機能ごとに作る。gen/<機能ID>/prompt.md

  make_prompts.py A01-02 [...]
  make_prompts.py --retry A01-02    ゲートの指摘を添えて書き直させる
"""
import csv, pathlib, subprocess, sys

PC = pathlib.Path(__file__).resolve().parent
ROOT = PC.parents[2]


def book_of(fid):
    for r in csv.DictReader((ROOT / "functions/function-sheet-map.tsv").open(encoding="utf-8"), delimiter="\t"):
        if r["機能No"].strip() == fid and r["状態"].strip() == "確定":
            return r["ブック"].strip(), r.get("機能名", "").strip()
    return "（対応シートなし。機能設計書を正とする）", ""


def main(argv):
    retry = argv[:1] == ["--retry"]
    fids = argv[1:] if retry else argv
    t = (PC / "PRECOND_PROMPT_TEMPLATE.md").read_text(encoding="utf-8")
    for fid in fids:
        book, name = book_of(fid)
        s = t
        for a, b in [("{FID}", fid), ("{fid}", fid.lower()), ("{BOOK}", book), ("{FNAME}", name)]:
            s = s.replace(a, b)
        d = PC / f"gen/{fid}"
        d.mkdir(parents=True, exist_ok=True)
        if retry:
            g = subprocess.run([sys.executable, str(PC / "gate_precond.py"), fid],
                               capture_output=True, text=True).stdout
            prev = (d / "out.txt").read_text(encoding="utf-8")[-60000:]
            # 完了判定の印（tokens used）を依頼文に入れない。入れると codex が依頼文を書き出した時点で完了と誤判定する
            prev = "\n".join(l for l in prev.split("\n") if "tokens used" not in l)
            s += ("\n\n## 前回の出力はゲートで落ちた\n\n前回の出力の末尾と、ゲートの指摘を示す。"
                  "指摘を全部直した5ブロックを、全量で出し直せ。\n\n### ゲートの指摘\n\n```\n" + g + "```\n\n"
                  "### 前回の出力（末尾）\n\n" + prev)
            k = 1
            while (d / f"out_r{k}.txt").exists():
                k += 1
            (d / "out.txt").rename(d / f"out_r{k}.txt")   # 前回出力は上書きしない
        (d / "prompt.md").write_text(s, encoding="utf-8")
    print(f"依頼文 {len(fids)} 本")


if __name__ == "__main__":
    main(sys.argv[1:])
