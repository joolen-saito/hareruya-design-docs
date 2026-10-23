#!/usr/bin/env python3
"""GEN_PROMPT.md に機能ごとの値を差し込んで prompts/<機能ID>.md を作る。 mk_prompt.py [機能ID...]（省略時は targets.tsv の全機能）

関わる機能 = FP の割り当てで処理を共有する機能 ＋ 対になる機能（重複登録）＋ 同じシートに対応する機能 ＋ 機能シート対応表の根拠が「ケースは X のファイル」と書く機能。
"""
import csv, pathlib, re, sys, collections

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
ROOT = CG.parents[1]
SCRATCH = "/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/0cb4fbfd-4cc2-4418-b2cd-85fafbbd5b3a/scratchpad/"
KINDNOTE = {
    "少ない": "### この機能について（目安より少ない）\n\n既存ケースが確かめていない定めを探す。外したケース（excluded.tsv）が多い機能では、先にその理由を読み、同じ理由で外れるケースを作らない。"
              "ケースが関わる機能のファイルに入っていることがある（機能シート対応表でシートが別の機能に付いている）ので、関わる機能のケースを必ず読む。",
    "ケース0件": "### この機能について（ケースが0件）\n\n有効なケースは0件（外したケースだけがある機能もある）。外したケースの観点のうち、「用意しない前提」を使わずに確かめられるものは作ってよい。"
                "そのときは外したケースのテストIDを使わず、元の除外理由に当たる前提（未確定のシード・中継・時刻固定・障害・他のケースの隔離）を使わない。",
    "重複登録": "### この機能について（重複登録）\n\n機能一覧でこの機能は **{TWIN}** と同一エンドポイント（同じ ee の処理）。{TWIN} のケースが確かめている定めは「既存ケースで確認済み」にする。"
               "この機能の設計書にだけある定め（呼び出し元・入出力・エラー時の扱いの違い）だけをケースにする。両方の設計書の定めが食い違うときは「ケースにしない」（結果が決まらない）にして、両方の行を理由に引く。",
}


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def main(args):
    T = {r["機能ID"]: r for r in rd(P / "targets.tsv")}
    sheets = collections.defaultdict(set)
    by_sheet = collections.defaultdict(set)
    notes = {}
    for r in rd(ROOT / "functions/function-sheet-map.tsv"):
        notes.setdefault(r["機能No"], r["一致根拠"])
        if r["状態"] in ("確定", "候補") and r["シートID"]:
            sheets[r["機能No"]].add((r["ブック"], r["シートID"]))
            by_sheet[(r["ブック"], r["シートID"])].add(r["機能No"])
    tpl = (P / "GEN_PROMPT.md").read_text(encoding="utf-8")
    (P / "prompts").mkdir(exist_ok=True)
    for f in (args or list(T)):
        t = T[f]
        procs = rd(P / f"units/{f}/processes.tsv")
        rel = set()
        for pr in procs:
            rel |= {x.strip() for x in pr["割り当てた機能ID"].split(",") if x.strip()}
        if t["対になる機能"]:
            rel.add(t["対になる機能"])
        for s in sheets.get(f, ()):
            rel |= by_sheet[s]
        rel |= set(re.findall(r"ケースは ([A-Z]\d\d-\d\d) のファイル", notes.get(f, "")))
        rel.discard(f)
        rel = sorted(x for x in rel if (CG / f"cases/{x}_test_cases.tsv").exists())
        related = "、".join(f"`integration_test/casegen/cases/{x}_test_cases.tsv`" for x in rel) or "（無い）"
        kind = t["種類"]
        s = tpl
        rep = {"{KINDNOTE}": KINDNOTE[kind].replace("{TWIN}", t["対になる機能"]), "{TWINNOTE}": f"（{t['対になる機能']} と同一エンドポイント）" if t["対になる機能"] else "",
               "{FID}": f, "{FNAME}": t["機能名"], "{KIND}": kind, "{FP}": t["FP"], "{NPROC}": t["処理単位数"], "{P25}": t["目安P25"], "{MID}": t["目安中央"],
               "{NOW}": t["いまのケース数"], "{START}": t["開始番号"], "{RELATED}": related, "{SCRATCH}": SCRATCH,
               "{FIDC}": f.replace("-", ""), "{FIDL}": f.replace("-", "").lower()}
        for k, v in rep.items():
            s = s.replace(k, v)
        assert "{" not in re.sub(r"\{\d|\{_|\{3,\}", "", s.replace("{3,}", "")), (f, re.findall(r"\{[A-Z]+\}", s))
        (P / f"prompts/{f}.md").write_text(s, encoding="utf-8")
        print(f, kind, "関わる機能", rel)


if __name__ == "__main__":
    main(sys.argv[1:])
