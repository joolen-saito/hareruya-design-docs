#!/usr/bin/env python3
"""シナリオテストどおりにシステムを動かしたとき、業務フローの各工程が実行できるかを机上で判定する。

出力:
  scenario_test/exec/feasibility/feasibility_by_step.tsv     工程単位（SCNメインフロー）
  scenario_test/exec/feasibility/feasibility_by_scenario.tsv シナリオ単位のロールアップ

判定材料（すべて実在ファイルからの機械読み取り。推測で埋めない）:
  1. scenario_test/scenario/SCN-*.md の `## メインフロー` — 工程ごとの「利用画面・機能」。
     機能No / 「専用の機能設計書なし」/「EC-CUBE操作なし」/「業務判断」が原典側で明示されている。
  2. design_impl_drift_report/drift_findings_list_open.tsv — 機能No単位の未解決乖離
     （指摘区分: 未実装 / 実装違い）。
  3. functions/**/*.md — 機能Noの設計書が実在するか。
  4. scenario_test/test_items/all_scenario_test_items.tsv — 工程に対応するテストID。

判定の意味（過大な断定をしないための区別）:
  - 実行不能(設計書が見つからない) : 09_設計ギャップ差し戻しリストで人手調査済みの工程。
                      機能設計書が見つからず、設計側の確定待ち。
  - 判定不能(実行手段が未特定)     : SCN側で「専用の機能設計書なし」と出ている工程のうち、
                      まだ人手調査されていないもの。生成器は08トリアージでUNKNOWN/未収載の工程に
                      このラベルを出す（generate_scenarios.py:1389）。「設計書が無い」ことの確認では
                      なく「どの機能で実行するか未特定」であり、断定はしない。
  - 要確認(未実装指摘あり) : 使用する機能に「未実装」指摘がある。指摘は機能単位なので、当該工程の
                      操作に当たるかは指摘内容を人が見て判断する（自動では断定しない）。
  - 要注意(実装違い指摘あり) : 使用する機能に「実装違い」指摘がある。動くが設計と挙動が異なりうる。
  - 実行可(乖離指摘なし)   : 使用する機能に未解決の乖離指摘が無い。
  - 対象外(システム外)     : 現場作業・外部システム作業・業務判断。EC-CUBEの実行可否とは無関係。

使い方: python3 scenario_test/tools/build_feasibility_ledger.py
"""
from __future__ import annotations

import csv
import glob
import os
import re
import sys
from collections import Counter, OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCN_DIR = ROOT / "scenario_test/scenario"
ITEMS = ROOT / "scenario_test/test_items/all_scenario_test_items.tsv"
GAP_DOC = ROOT / "scenario_test/scenario/09_設計ギャップ差し戻しリスト.md"
DRIFT = ROOT / "design_impl_drift_report/drift_findings_list_open.tsv"
OUT_DIR = ROOT / "scenario_test/exec/feasibility"

# SCNメインフローの「利用画面・機能」が機能Noを持たないときのラベル→区分。
# 原典が明示している文言だけを見る（推測で分類しない）。
LABEL_KINDS = [
    ("専用の機能設計書なし", "実行手段未特定"),
    ("現場作業", "システム外（現場）"),
    ("外部システム/ツール作業", "システム外（外部）"),
    ("非EC-CUBE作業", "システム外（外部）"),
    ("業務判断", "業務判断"),
]

# 09_設計ギャップ差し戻しリストで人手調査済みの工程を見分ける語（同文書の見出し・工程欄から採る）。
# ここに載る工程だけが「設計書が見つからない」と確認済み。それ以外は未調査＝判定不能に留める。
INVESTIGATED_GAPS = [
    ("出庫の承認", "G1 在庫移動の承認確定・入庫確定"),
    ("入庫済みへの変更", "G1 在庫移動の承認確定・入庫確定"),
    ("2F在庫へ入庫", "G1 在庫移動の承認確定・入庫確定"),
    ("着荷対応及び入庫対応", "G1 在庫移動の承認確定・入庫確定"),
    ("棚卸結果の反映", "G2 棚卸結果の在庫反映"),
    ("査定承諾メール", "G3 ネット買取の査定承諾処理・承諾メール送信"),
]

STEP_COLS = ["業務", "シナリオID", "経路種別", "工程#", "担当者", "業務行動", "利用画面・機能",
             "機能No", "区分", "判定", "根拠", "未実装指摘", "実装違い指摘", "重要度high",
             "指摘の観点（上位3件）", "対応テストID"]
SCN_COLS = ["業務", "シナリオID", "シナリオ名", "経路種別", "判定", "総工程", "システム工程",
            "実行不能", "判定不能", "未実装指摘あり", "実装違い指摘あり", "システム外", "業務判断",
            "ブロッカー", "データ連鎖(実行可能/要確認/終端)", "経路全体テストID"]

V_NG = "実行不能(設計書が見つからない)"
V_UNK = "判定不能(実行手段が未特定)"
V_CHK = "要確認(未実装指摘あり)"
V_WARN = "要注意(実装違い指摘あり)"
V_OK = "実行可(乖離指摘なし)"
V_OUT = "対象外(システム外)"
VERDICT_RANK = [V_NG, V_UNK, V_CHK, V_WARN, V_OK, "対象外(システム外のみ)"]


# 既知の規模。ここが動く＝SCN側が再生成されたということなので、意図した変化かを人が確認してから直す。
EXPECTED_SCN = 158
EXPECTED_STEPS = 878


class GateError(Exception):
    pass


def design_feature_nos() -> set[str]:
    """functions/ に設計書が実在する機能No。"""
    out = set()
    for p in glob.glob(str(ROOT / "functions/*/*.md")):
        m = re.match(r"([a-z]\d+-\d+)_", os.path.basename(p))
        if m:
            out.add(m.group(1).upper())
    if not out:
        raise GateError("functions/ から機能Noを1件も抽出できない")
    return out


def load_drift() -> dict[str, dict]:
    """機能No → {未実装, 実装違い, high, 観点[]}。"""
    agg: dict[str, dict] = defaultdict(lambda: {"未実装": 0, "実装違い": 0, "high": 0, "観点": Counter()})
    with DRIFT.open(encoding="utf-8", newline="") as fh:
        r = csv.reader(fh, delimiter="\t")
        h = next(r)
        i = {c: n for n, c in enumerate(h)}
        for row in r:
            fn = row[i["機能No"]].strip().upper()
            kind = row[i["指摘区分"]].strip()
            a = agg[fn]
            if kind in ("未実装", "実装違い"):
                a[kind] += 1
            if row[i["重要度"]].strip() == "high":
                a["high"] += 1
            a["観点"][row[i["観点"]].strip()] += 1
    return agg


def parse_scn(path: Path) -> dict:
    """SCN-*.md から メタ情報・メインフロー工程・データ連鎖判定 を取り出す。"""
    text = path.read_text(encoding="utf-8")
    sid = path.name.split("_")[0]

    def bullet(key: str, default: str = "-") -> str:
        m = re.search(r"^- \*\*" + re.escape(key) + r"\*\*: (.+)$", text, re.M)
        return m.group(1).strip() if m else default

    title = re.search(r"^# \S+ (.+)$", text, re.M)
    biz = bullet("親業務フローパターン").split(" / ")[0]

    steps = []
    m = re.search(r"## メインフロー[^\n]*\n(.*?)(?=\n## |\Z)", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            if not line.startswith("| ") or set(line) <= set("|- "):
                continue
            c = [x.strip() for x in line.split("|")[1:-1]]
            if len(c) != 5 or not c[0].isdigit():
                continue
            steps.append({"no": c[0], "actor": c[1], "action": c[2], "screen": c[3], "result": c[4]})

    chain = Counter()
    m = re.search(r"## データ連鎖[^\n]*\n(.*?)(?=\n## |\Z)", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            if not line.startswith("| DL-"):
                continue
            c = [x.strip() for x in line.split("|")[1:-1]]
            if len(c) < 7:
                continue
            v = c[6]
            key = "終端" if v.startswith("終端") else ("要確認" if "要確認" in v else "実行可能")
            chain[key] += 1

    return {"sid": sid, "title": title.group(1).strip() if title else sid, "biz": biz,
            "route_kind": bullet("経路種別"), "steps": steps, "chain": chain}


def classify(screen: str) -> tuple[list[str], str]:
    """『利用画面・機能』セルから (機能Noリスト, 区分) を決める。"""
    m = re.search(r"（([^（）]*)）$", screen)
    inner = m.group(1) if m else ""
    nos = re.findall(r"[A-Z]\d+-\d+", inner)
    if nos and re.fullmatch(r"[A-Z]\d+-\d+(?:・[A-Z]\d+-\d+)*", inner):
        return nos, "システム操作"
    for word, kind in LABEL_KINDS:
        if word in screen:
            return [], kind
    return [], "分類不能"


def step_verdict(kind: str, drift: list[dict], action: str) -> tuple[str, str]:
    """(判定, 根拠) を返す。断定できるのは人手調査済みの設計ギャップだけ。"""
    if kind == "実行手段未特定":
        for word, gap in INVESTIGATED_GAPS:
            if word in action:
                return V_NG, f"09_設計ギャップ差し戻しリスト {gap}（設計書が見つからないと調査済み）"
        return V_UNK, "SCNが「専用の機能設計書なし」と出力（08トリアージでUNKNOWN/未収載＝機能が未特定。設計書の不在を確認したものではない）"
    if kind != "システム操作":
        return V_OUT, f"{kind}（EC-CUBEの実行可否とは無関係）"
    un = sum(d["未実装"] for d in drift)
    vi = sum(d["実装違い"] for d in drift)
    if un:
        return V_CHK, f"使用機能に未実装指摘{un}件（drift_findings_list_open.tsv・機能単位のため当該工程に当たるかは要判断）"
    if vi:
        return V_WARN, f"使用機能に実装違い指摘{vi}件（drift_findings_list_open.tsv）"
    return V_OK, "使用機能に未解決の乖離指摘なし（drift_findings_list_open.tsv）"


def load_items() -> dict[tuple[str, str], list[str]]:
    """(SCN-ID, 工程#) → テストID。項目名の『#N』が メインフロー工程# に対応する。
    経路全体行は工程# を '経路全体' として持つ。"""
    out: dict[tuple[str, str], list[str]] = defaultdict(list)
    with ITEMS.open(encoding="utf-8", newline="") as fh:
        r = csv.reader(fh, delimiter="\t")
        h = next(r)
        i = {c: n for n, c in enumerate(h)}
        for row in r:
            scn = re.search(r"元シナリオ: (\S+)", row[i["前提条件"]])
            if not scn:
                raise GateError(f"元シナリオを取り出せない: {row[i['テストID']]}")
            name = row[i["テスト項目名"]]
            if "経路全体" in name:
                key = "経路全体"
            else:
                m = re.search(r"#(\d+):", name)
                key = m.group(1) if m else "-"
            out[(scn.group(1), key)].append(row[i["テストID"]])
    return out


def main() -> int:
    csv.field_size_limit(10 ** 7)
    exist = design_feature_nos()
    drift = load_drift()
    items = load_items()

    paths = sorted(SCN_DIR.glob("SCN-*.md"))
    if len(paths) != EXPECTED_SCN:
        print(f"NG SCN数が想定と違う: {len(paths)}（想定{EXPECTED_SCN}）")
        return 1

    step_rows, scn_rows = [], []
    tally = Counter()
    for path in paths:
        s = parse_scn(path)
        counts = Counter()
        blockers: "OrderedDict[str, None]" = OrderedDict()
        for st in s["steps"]:
            nos, kind = classify(st["screen"])
            unknown = [n for n in nos if n not in exist]
            if unknown:
                raise GateError(f"{s['sid']} #{st['no']}: 設計書に無い機能No {unknown}")
            d = [drift[n] for n in nos if n in drift]
            verdict, reason = step_verdict(kind, d, st["action"])
            counts[kind] += 1
            counts[verdict] += 1
            tally[verdict] += 1
            un = sum(x["未実装"] for x in d)
            vi = sum(x["実装違い"] for x in d)
            hi = sum(x["high"] for x in d)
            views = Counter()
            for x in d:
                views.update(x["観点"])
            if verdict in (V_NG, V_UNK, V_CHK):
                for n in (nos or [f"（機能未特定）{one_line(st['action'])[:26]}"]):
                    blockers[n] = None
            step_rows.append([
                s["biz"], s["sid"], s["route_kind"], st["no"], st["actor"],
                one_line(st["action"]), one_line(st["screen"]), ", ".join(nos) or "—",
                kind, verdict, reason, str(un) if nos else "—", str(vi) if nos else "—",
                str(hi) if nos else "—",
                ", ".join(f"{k}({v})" for k, v in views.most_common(3)) or "—",
                ", ".join(items.get((s["sid"], st["no"]), [])) or "—",
            ])

        sys_steps = counts["システム操作"]
        if counts[V_NG]:
            v = V_NG
        elif counts[V_UNK]:
            v = V_UNK
        elif counts[V_CHK]:
            v = V_CHK
        elif counts[V_WARN]:
            v = V_WARN
        elif sys_steps:
            v = V_OK
        else:
            v = "対象外(システム外のみ)"
        scn_rows.append([
            s["biz"], s["sid"], s["title"], s["route_kind"], v, str(len(s["steps"])),
            str(sys_steps), str(counts[V_NG]), str(counts[V_UNK]), str(counts[V_CHK]), str(counts[V_WARN]),
            str(counts["システム外（現場）"] + counts["システム外（外部）"]), str(counts["業務判断"]),
            ", ".join(blockers) or "—",
            f"{s['chain']['実行可能']}/{s['chain']['要確認']}/{s['chain']['終端']}",
            ", ".join(items.get((s["sid"], "経路全体"), [])) or "—",
        ])

    # ゲート: 工程行の総数・分類不能ゼロ・シナリオ数
    ki = STEP_COLS.index("区分")
    if any(r[ki] == "分類不能" for r in step_rows):
        bad = [r[1] + "#" + r[3] for r in step_rows if r[ki] == "分類不能"][:5]
        print(f"NG 区分を決められない工程がある: {bad}")
        return 1
    if len(scn_rows) != EXPECTED_SCN:
        print(f"NG シナリオ行数: {len(scn_rows)}")
        return 1
    if len(step_rows) != EXPECTED_STEPS:
        print(f"NG 工程行数: {len(step_rows)}（想定{EXPECTED_STEPS}。SCNを再生成したなら EXPECTED_STEPS を直す）")
        return 1
    if sum(tally.values()) != len(step_rows):
        print(f"NG 判定の合計{sum(tally.values())}が工程数{len(step_rows)}と一致しない")
        return 1
    # 「実行不能」と断定してよいのは09で人手調査済みの工程だけ。根拠が付いていない断定を弾く。
    vi = STEP_COLS.index("判定"); ri = STEP_COLS.index("根拠")
    for r in step_rows:
        if r[vi] == V_NG and "09_設計ギャップ差し戻しリスト" not in r[ri]:
            print(f"NG 根拠のない実行不能判定: {r[1]}#{r[3]}")
            return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, cols, rows in (("feasibility_by_step.tsv", STEP_COLS, step_rows),
                             ("feasibility_by_scenario.tsv", SCN_COLS, scn_rows)):
        with (OUT_DIR / name).open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, delimiter="\t", lineterminator="\n")
            w.writerow(cols)
            w.writerows(rows)
        print(f"出力: {(OUT_DIR / name).relative_to(ROOT)}  {len(rows)}行")

    print("\n■ 工程単位の判定")
    for k in [V_NG, V_UNK, V_CHK, V_WARN, V_OK, V_OUT]:
        print(f"  {k}: {tally[k]}")
    print("\n■ シナリオ単位の判定")
    sv = Counter(r[4] for r in scn_rows)
    for k in VERDICT_RANK:
        print(f"  {k}: {sv[k]}")
    return 0


def one_line(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GateError as e:
        print(f"NG {e}")
        sys.exit(1)
