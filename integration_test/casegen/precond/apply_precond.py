#!/usr/bin/env python3
"""著者の出力（gen/<機能ID>/out.txt）からケースとシードを組み立てる。

  apply_precond.py A01-02 [...]

期待結果は著者に書かせず、基線に改名を当てて作る。手順は新手順が空なら基線に改名を当てる。
組み立て後に gate_precond.py で検査する。
"""
import csv, io, pathlib, re, sys

PC = pathlib.Path(__file__).resolve().parent
CG = PC.parent
sys.path.insert(0, str(PC))
from gate_precond import apply, read  # noqa: E402

BLOCKS = [("シード表", "シードID"), ("ケース表", "テストID"), ("改名表", "テストID"), ("未確定の前提", "対象"),
          ("読み取り専用ケース", "テストID")]


def blocks(text):
    """最後に出たコードブロックを見出し行で振り分ける（codex の出力は途中経過も含む）"""
    found = {}
    (PC / "readonly_cases").mkdir(exist_ok=True)
    # codex の出力には入力した依頼文（書き直しでは前回の出力つき）も入る。最終回答だけを読む
    parts = re.split(r"\ncodex\n", text)
    if len(parts) < 2:
        return {}
    text = parts[-1]
    for body in re.findall(r"```[a-zA-Z]*\n(.*?)```", text, re.S):
        first = body.split("\n", 1)[0]
        for name, head in BLOCKS:
            if first.startswith(head + "\t") and (name != "改名表" or "\t旧\t" in first + "\t") \
                    and (name != "ケース表" or "事前準備" in first) \
                    and (name != "読み取り専用ケース" or "\t理由" in first) \
                    and (name not in ("ケース表", "改名表") or "\t理由" not in first):
                found[name] = body
    return {k: list(csv.DictReader(io.StringIO(v), delimiter="\t")) for k, v in found.items()}


def write(p, hdr, rows):
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(hdr)
        w.writerows(rows)


def main(fids):
    for fid in fids:
        out = PC / f"gen/{fid}/out.txt"
        B = blocks(out.read_text(encoding="utf-8"))
        miss = [n for n, _ in BLOCKS if n not in B]
        if miss:
            print(f"{fid}: ブロックが無い {miss}"); continue
        base = read(PC / f"baseline/{fid}_test_cases.tsv")
        hdr = list(base[0].keys())
        ren = {}
        for r in B["改名表"]:
            ren.setdefault(r["テストID"], []).append((r["旧"], r["新"]))
        new = {r["テストID"]: r for r in B["ケース表"]}
        chg, orc = [], []
        for b in base:
            if b["実行区分"] == "保留":
                continue
            t = b["テストID"]
            n = new.get(t)
            if not n:
                print(f"{fid}: {t} がケース表に無い（基線のまま残す）"); continue
            pairs = ren.get(t, [])
            b["使用シード"] = n["使用シード"].strip()
            b["事前準備"] = n["事前準備"].strip()
            if n.get("新手順", "").strip():
                b["手順"] = n["新手順"].strip()
                chg.append((t, n.get("手順変更種別", "").strip(), b["手順"], n.get("手順変更理由", "").strip()))
            else:
                b["手順"] = apply(b["手順"], pairs)
            if n.get("新期待結果", "").strip():
                b["期待結果"] = n["新期待結果"].strip()
                orc.append((t, b["期待結果"], n.get("期待結果変更理由", "").strip(),
                            "類型承認T1（外部発番値。T1該当はレビューで確認）"))
            else:
                b["期待結果"] = apply(b["期待結果"], pairs)
        write(CG / f"cases/{fid}_test_cases.tsv", hdr, ([r[h] for h in hdr] for r in base))
        sh = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
        write(CG / f"cases/{fid}_seed_data.tsv", sh, ([r.get(h, "") for h in sh] for r in B["シード表"]))
        write(PC / f"renames/{fid}.tsv", ["テストID", "旧", "新"],
              ([t, a, c] for t, ps in ren.items() for a, c in ps))
        write(PC / f"step_changes/{fid}.tsv", ["テストID", "種別", "新手順", "理由"], chg)
        write(PC / f"oracle_changes/{fid}.tsv", ["テストID", "新期待結果", "理由", "承認"], orc)
        write(PC / f"readonly_cases/{fid}.tsv", ["テストID", "理由"],
              ([r["テストID"], r.get("理由", "")] for r in B["読み取り専用ケース"]))
        # 未確定の前提は機能ごとに置き換える
        op = PC / "open_preconditions.tsv"
        rows = [r for r in read(op) if r["機能"] != fid]
        rows += [{"機能": fid, "対象": r["対象"], "未確定の内容": r["未確定の内容"], "影響ケース": r["影響ケース"],
                  "手がかり": r.get("手がかり", ""), "状態": "未確定"} for r in B["未確定の前提"]]
        oh = ["機能", "対象", "未確定の内容", "影響ケース", "手がかり", "状態"]
        write(op, oh, ([r[h] for h in oh] for r in rows))
        print(f"{fid}: ケース {len(new)} / シード {len(B['シード表'])} / 改名 {sum(map(len, ren.values()))} "
              f"/ 手順変更 {len(chg)} / 期待結果変更 {len(orc)} / 未確定 {len(B['未確定の前提'])}")


if __name__ == "__main__":
    main(sys.argv[1:])
