#!/usr/bin/env python3
"""シナリオパターンのマトリクス（業務条件×シナリオ）を作る。

入力（scenario_test/coverage/scenario_pattern_matrix/<業務>/）
  factors.tsv  業務条件と値。出典ファイルと引用を持つ
  mapping.tsv  シナリオ（またはテストケース）が通る値。根拠の引用を持つ

確かめること（1つでも外れたら出力せずに止まる）
  - 条件の引用が出典ファイルの1行の中にそのままある
  - 対応の引用が、シナリオ本体（印=○）またはそのテストケースの行（印=△）の中にそのままある
  - 対応の値IDが factors.tsv にある／扱いが「対象」の値だけに対応を付ける
  - テストケースの引用が「前提条件」列だけにある場合は認めない（準備の定型文で通したことにしない）

出力
  matrix.md / matrix.tsv / gaps.tsv
"""
import csv
import html
import io
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ST = ROOT / "scenario_test"


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


_line_cache = {}


def source_lines(rel):
    if rel not in _line_cache:
        raw = (ROOT / rel).read_text(encoding="utf-8").split("\n")
        if rel.endswith(".html"):
            raw = [html.unescape(re.sub(r"<[^>]+>", " ", l)) for l in raw]
        _line_cache[rel] = [norm(l) for l in raw]
    return _line_cache[rel]


def find_quote(rel, quote):
    q = norm(quote)
    return [i for i, l in enumerate(source_lines(rel), 1) if q in l]


def strip_prep(v):
    return re.sub(r"【準備確認】.*?(?=【操作】|$)", "", v, flags=re.S)


def read_tsv(p):
    with open(p, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def scenario_files(prefix):
    out = {}
    for p in sorted((ST / "scenario").glob(f"{prefix}*.md")):
        sid = p.name.split("_", 1)[0]
        out[sid] = p
    return out


def item_rows(scn_path):
    """シナリオに対応するテストケースの行を {テストID: {列: 値}} で返す。"""
    sid = scn_path.name.split("_", 1)[0]
    sti = "STI-" + sid[len("SCN-"):]
    cands = sorted((ST / "test_items").glob(f"{sti}_*_test_items.md"))
    if len(cands) != 1:
        raise SystemExit(f"テストケースのファイルが1つに決まらない: {sid} {cands}")
    text = cands[0].read_text(encoding="utf-8")
    m = re.search(r"```[a-z]*\n(.*?)```", text, re.S)
    rows = list(csv.reader(io.StringIO(m.group(1)), delimiter="\t"))
    head = rows[0]
    return {r[1]: dict(zip(head, r)) for r in rows[1:] if len(r) == len(head)}


def main(business, prefix):
    base = ST / "coverage" / "scenario_pattern_matrix" / business
    errors = []

    factors = read_tsv(base / "factors.tsv")
    order = ["業務フローパターン", "業務フローの分岐", "設計書の条件", "組合せ"]
    factors.sort(key=lambda f: order.index(f["区分"]) if f["区分"] in order else len(order))
    fmap = {}
    for f in factors:
        hits = find_quote(f["出典"], f["引用"])
        if not hits:
            errors.append(f"条件の引用が出典に無い: {f['値ID']} {f['出典']} 「{f['引用']}」")
        f["出典行"] = ",".join(map(str, hits[:3]))
        if f["値ID"] in fmap:
            errors.append(f"値IDの重複: {f['値ID']}")
        fmap[f["値ID"]] = f

    scns = scenario_files(prefix)
    items = {sid: item_rows(p) for sid, p in scns.items()}
    scn_text = {sid: norm(p.read_text(encoding="utf-8")) for sid, p in scns.items()}

    mapping = read_tsv(base / "mapping.tsv") if (base / "mapping.tsv").exists() else []
    cell = defaultdict(dict)  # 値ID -> シナリオID -> 印
    evid = defaultdict(list)
    for m in mapping:
        vid, sid, mark, tid, q = m["値ID"], m["シナリオID"], m["印"], m["テストID"], m["引用"]
        tag = f"{vid}/{sid}/{tid or '-'}"
        if vid not in fmap:
            errors.append(f"factors.tsv に無い値ID: {tag}")
            continue
        if fmap[vid]["扱い"] != "対象":
            errors.append(f"扱いが「{fmap[vid]['扱い']}」の値に対応を付けている: {tag}")
        if sid not in scns:
            errors.append(f"シナリオが無い: {tag}")
            continue
        if mark == "○":
            if norm(q) not in scn_text[sid]:
                errors.append(f"シナリオ本体に引用が無い: {tag} 「{q}」")
        elif mark == "△":
            row = items[sid].get(tid)
            if row is None:
                errors.append(f"テストIDが無い: {tag}")
                continue
            cols = [c for c, v in row.items() if norm(q) in norm(v)]
            # 操作手順の【準備確認】（定型の準備）は前提条件と同じ扱いにする
            ok = [c for c, v in row.items() if c != "前提条件" and norm(q) in norm(strip_prep(v) if c == "操作手順/実行方法" else v)]
            if not cols:
                errors.append(f"テストケースの行に引用が無い: {tag} 「{q}」")
            elif not ok:
                errors.append(f"引用が前提条件か【準備確認】にしか無い（準備の定型文の疑い）: {tag} 「{q}」")
        else:
            errors.append(f"印は○か△: {tag} {mark}")
            continue
        prev = cell[vid].get(sid)
        if prev != "○":
            cell[vid][sid] = mark
        evid[(vid, sid)].append(f"{tid or '本体'}「{q}」")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        raise SystemExit(f"NG: {len(errors)}件")

    sids = sorted(scns, key=lambda s: (int(s.rsplit("-", 1)[-1]), s))
    short = {s: s.rsplit("-", 1)[-1] for s in sids}

    def judge(f):
        if f["扱い"] != "対象":
            return f["扱い"]
        marks = cell[f["値ID"]].values()
        if "○" in marks:
            return "通っている"
        if "△" in marks:
            return "テストケースだけ"
        return "抜け"

    # matrix.tsv
    with open(base / "matrix.tsv", "w", encoding="utf-8", newline="") as fo:
        w = csv.writer(fo, delimiter="\t", lineterminator="\n")
        w.writerow(["区分", "業務条件", "値ID", "値", "判定"] + sids + ["出典", "出典行", "備考"])
        for f in factors:
            w.writerow([f["区分"], f["業務条件"], f["値ID"], f["値"], judge(f)]
                       + [cell[f["値ID"]].get(s, "") for s in sids]
                       + [f["出典"], f["出典行"], f["備考"]])

    # gaps.tsv
    gaps = [f for f in factors if judge(f) in ("抜け", "テストケースだけ")]
    with open(base / "gaps.tsv", "w", encoding="utf-8", newline="") as fo:
        w = csv.writer(fo, delimiter="\t", lineterminator="\n")
        w.writerow(["値ID", "業務条件", "値", "判定", "確かめているテストケース", "出典", "出典行"])
        for f in gaps:
            tids = sorted({e.split("「", 1)[0] for (v, s), es in evid.items() if v == f["値ID"] for e in es})
            w.writerow([f["値ID"], f["業務条件"], f["値"], judge(f), " / ".join(tids), f["出典"], f["出典行"]])

    # matrix.md
    cnt = defaultdict(int)
    for f in factors:
        cnt[judge(f)] += 1
    L = [f"# シナリオパターンのマトリクス：{business}（自動生成）", "",
         "業務条件の値ごとに、どのシナリオが通っているかを示す。生成元は `scenario_test/tools/build_pattern_matrix.py`。",
         "", "- ○ = シナリオの経路そのもの（経路条件・実行用テストデータ）で通る",
         "- △ = シナリオのテストケースの一部で確かめる（経路の代表データとは別の値）",
         "- 判定: 通っている（○あり）／テストケースだけ（△だけ）／抜け（どれも無し）／判断待ち（依頼者の決定待ち）／他層（結合テストで確かめる）／適用外・他業務（裁定や別業務で扱う）",
         "", "| 判定 | 件数 |", "|---|---:|"]
    for k in ["通っている", "テストケースだけ", "抜け", "判断待ち", "他層", "適用外", "他業務"]:
        L.append(f"| {k} | {cnt[k]} |")
    L += ["", "## シナリオの略号", "", "| 略号 | シナリオ |", "|---|---|"]
    for s in sids:
        L.append(f"| {short[s]} | {scns[s].stem} |")
    L += ["", "## マトリクス", "",
          "| 業務条件 | 値ID | 値 | 判定 | " + " | ".join(short[s] for s in sids) + " |",
          "|---|---|---|---|" + "---|" * len(sids)]
    for f in factors:
        L.append(f"| {f['業務条件']} | {f['値ID']} | {f['値']} | {judge(f)} | "
                 + " | ".join(cell[f['値ID']].get(s, "") for s in sids) + " |")
    L += ["", "## 抜けとテストケースだけの値", "", "| 値ID | 業務条件 | 値 | 判定 | 確かめているテストケース |", "|---|---|---|---|---|"]
    for f in gaps:
        tids = sorted({e.split("「", 1)[0] for (v, s), es in evid.items() if v == f["値ID"] for e in es})
        L.append(f"| {f['値ID']} | {f['業務条件']} | {f['値']} | {judge(f)} | {' / '.join(tids) or '-'} |")
    L += ["", "## 判断待ち・他層・適用外・他業務の値", "", "| 値ID | 業務条件 | 値 | 扱い | 理由 |", "|---|---|---|---|---|"]
    for f in factors:
        if f["扱い"] != "対象":
            L.append(f"| {f['値ID']} | {f['業務条件']} | {f['値']} | {f['扱い']} | {f['備考']} |")
    L += ["", "## 条件の出典", "", "| 値ID | 出典 | 行 | 引用 |", "|---|---|---|---|"]
    for f in factors:
        L.append(f"| {f['値ID']} | `{f['出典']}` | {f['出典行']} | {f['引用']} |")
    L += ["", "## 対応の根拠", "", "| 値ID | シナリオ | 印 | 根拠（テストIDと引用） |", "|---|---|---|---|"]
    for f in factors:
        for s in sids:
            if (f["値ID"], s) in evid:
                L.append(f"| {f['値ID']} | {short[s]} | {cell[f['値ID']][s]} | " + "<br>".join(evid[(f['値ID'], s)]).replace("|", "｜") + " |")
    (base / "matrix.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"OK: 条件 {len(factors)} 値 / 対応 {len(mapping)} 件 / シナリオ {len(sids)} 本 / "
          + " ".join(f"{k}={v}" for k, v in cnt.items()))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "通販受注管理",
         sys.argv[2] if len(sys.argv) > 2 else "SCN-TSUHAN-")
