"""(tobe) つきの業務フローのシートの組で、どちらのシートを元にするか（人が読む Excel に出す範囲）。

2026-11-26 依頼者「（tobe）があるシートを優先して、(tobe)シートがなければ、ついていないシートを元にシナリオを書く」（店頭買取と
店頭買取 (tobe) が重複していると指摘）。在庫に関連する_業務一覧_業務フロー.xlsx の (tobe) つきの4組は、(tobe) の無い方のシートの
3行目の注記に合わせる（依頼者が選んだ）：
  店頭買取「※tobeではなくこちらを新フローとして記載しています。」・在庫管理「※asis→tobeの形式ではなく、新規に業務フローを起こしている
  （このファイルを新業務に修正）。」→ (tobe) の無い方を元にする。
  商品登録・編集（注記「※商品登録・編集 (tobe)シートに4.6.7の業務について在庫に関するtobeを記載」）・通販受注管理（注記「※すでにある
  tobeで問題ないので変更なし」）→ (tobe) を元にする。
元にしないシートからは、元にしたシートに無いパターンだけ出す。

使う道具：build_step_table.py（紐づけの2ファイル）・build_flow_proof.py（証明用の対応表）・build_route_table.py（業務パターンと
シナリオの対応表）。照合（verify_flow_coverage.py）と各道具の確かめは両方のシートを全部見る。ここで決めるのは Excel に出す範囲だけ。
"""
import bisect
import csv
from collections import defaultdict
from pathlib import Path

DEST = Path(__file__).resolve().parents[1] / "業務フローとの照合"

OTHER = {  # 元にしないシートの番号: (元にするシートの番号, 元にするシートにもあるので出さないパターンの＃, それでも出す工程 {R: 理由})
    "07": ("06", {"1", "2"}, {}),
    "09": ("10", {str(i) for i in range(1, 9)},
           {142: "2026-11-05 依頼者の決定：部門更新CSV登録は、この 4-6 の工程として試験する（商品登録・編集 (tobe) では不要とされている）"}),
    "13": ("12", {str(i) for i in range(1, 14)}, {}),  # 7〜13 は図に工程が無い。14 別部署からの発送依頼処理 は在庫管理に無いので出す
    "16": ("17", {"4"}, {}),
}
BASE_NOTE = {"06": "※tobeではなくこちらを新フローとして記載しています。",
             "12": "※asis→tobeの形式ではなく、新規に業務フローを起こしている（このファイルを新業務に修正）。"}
REST = {"07": "店頭買取 (tobe) にだけあるパターンは無いので、出さない",
        "09": "商品登録・編集にだけあるパターンは無い。2026-11-05 の依頼者の決定で試験する 4-6 部門更新だけを、工程として出す（紐づけの表・証明用の対応表）",
        "13": "在庫管理 (tobe) にだけある 14 別部署からの発送依頼処理（※商品在庫移動依頼に限る）だけを出す",
        "16": "通販受注管理（tobe）に無いパターン（4 発送業務 以外の 1〜3・5〜12）を出す"}


def _tsv(name):
    with open(DEST / name, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def pattern_of(st):
    """工程の行 → パターンの＃（＃の先頭。「（番号なし）」の工程は前の工程のパターン）"""
    cur, out = "", {}
    for x in sorted(st):
        n = st[x]["#"]
        if n and n != "（番号なし）":
            cur = n.split("-")[0]
        out[x] = cur
    return out


def kept_rows(no, st, errors=None):
    """そのシートで出す工程の行（03_工程.tsv の R）。元にしないシート（OTHER）は、元にするシートに無いパターンの工程と、
    決定で出す工程（とその見出し）だけ"""
    if no not in OTHER:
        return set(st)
    base, drop, exc = OTHER[no]
    if errors is not None:
        plist = defaultdict(set)
        for r in _tsv("02_パターン.tsv"):
            plist[r["業務フロー"][:2]].add(r["番号"])
        for n in sorted(drop - plist[no]) + sorted(drop - plist[base]):
            errors.append(f"業務フロー {no}：出さないパターン ＃{n} が {no} か {base} のパターンの一覧に無い")
        for x in exc:
            if x not in st or st[x]["扱い"] == "見出し":
                errors.append(f"業務フロー {no} R{x}：決定で出す工程が 03_工程.tsv に無い")
    pat = pattern_of(st)
    exc_pat = {pat[x] for x in exc if x in pat}
    return {x for x in st if pat[x] not in drop or x in exc or (pat[x] in exc_pat and st[x]["扱い"] == "見出し")}


_cache = {}


def _steps():
    if "steps" not in _cache:
        steps = defaultdict(dict)
        for r in _tsv("03_工程.tsv"):
            steps[r["業務フロー"][:2]][int(r["R"][1:])] = r
        _cache["steps"] = steps
        _cache["kept"] = {no: kept_rows(no, st) for no, st in steps.items()}
        _cache["keys"] = {no: sorted(st) for no, st in steps.items()}
    return _cache


def reset():
    """03_工程.tsv を書き直したあと（照合を流し直したあと）に呼ぶ"""
    _cache.clear()


def keep_pattern(no, num):
    """パターンの行（＃）を出すか。決定で出す工程があっても、パターンの行は元にするシートの方に出す"""
    return no not in OTHER or num not in OTHER[no][1]


def keep_row(no, r):
    """Excel の行（工程・判断の図形・条件の文の R）を出すか。その行を含む工程（＃の行）で決める"""
    if no not in OTHER:
        return True
    c = _steps()
    keys = c["keys"].get(no, [])
    i = bisect.bisect_right(keys, r)
    return bool(i) and keys[i - 1] in c["kept"][no]


def lines():
    """見方に書く文（(tobe) の組ごとの扱い）"""
    import flow_from_xlsx as fx
    out = []
    for o, (b, _, _) in OTHER.items():
        why = f"注記「{BASE_NOTE[b]}」" if b in BASE_NOTE else "(tobe) を優先"
        out.append(f"　・{fx.md_source(b)[1]}を元にする（{why}）。{fx.md_source(o)[1]}：{REST[o]}")
    return out
