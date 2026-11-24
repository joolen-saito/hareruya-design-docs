#!/usr/bin/env python3
"""
開発環境で合格したケースを、判定の表（review/judgements/<機能ID>.tsv）に行として書く。
- 注記（正本の外の補い・シード作成時の読み替え）があれば「合格（条件付き）」、無ければ「合格」。
- 判定の表に行がすでにあるケースは書き直さない（ほかの人・前の判定の理由を消さない。2026-11-23 に書き直してしまった反省）。
- 書き戻しの道具は判定の表の行を見て書くので、注記の無い合格も行を書く（11/23 の 48 の指摘）。
使い方: python3 tools/kurino_takeover/judge_passes.py <記録のMD（リポジトリからの相対）> <機能ID>...（e2e/ で流す）
"""
import csv
import glob
import json
import os
import re
import subprocess
import sys

E = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/"


def main() -> None:
    rec = sys.argv[1]
    for f in sys.argv[2:]:
        jp = f"{E}review/judgements/{f}.tsv"
        done = {r[0] for r in csv.reader(open(jp), delimiter="\t") if r} if os.path.exists(jp) else set()
        for p in sorted(glob.glob(f"{E}evidence/{f}/IT-*/result.json")):
            r = json.load(open(p))
            if r.get("環境", {}).get("E2E_ENV") != "dev" or r.get("結果") != "合格":
                continue
            t = r["テストID"]
            if t in done:
                continue
            s = open(p.replace("result.json", "evidence.md"), encoding="utf-8").read()
            sup = [m.strip() for m in re.findall(r"正本の外の補い\**[:：]?\s*([^\n]{0,200})", s)]
            sup += [m.strip() for m in re.findall(r"シード作成時の問題\**[:：]?\s*[^:：\n]*[:：]\s*(読み替え[^\n]{0,160})", s)]
            if sup:
                why = "期待結果のとおり。" + "／".join(dict.fromkeys(x.rstrip("。") for x in sup))[:400] + "（補いの上での合格）"
                args = ["合格", "条件付き", why]
            else:
                args = ["合格", "", "期待結果のとおり"]
            out = subprocess.run(["python3", E + "tools/evidence_judgements.py", "set", f, t, *args, "--record", rec], capture_output=True, text=True, cwd=E)
            print((out.stdout + out.stderr).strip()[-70:])
        out = subprocess.run(["python3", E + "tools/evidence_judgements.py", "sync", f, "--apply"], capture_output=True, text=True, cwd=E)
        print(f, (out.stdout + out.stderr).strip()[-70:])


if __name__ == "__main__":
    main()
