#!/usr/bin/env python3
"""シナリオ工程の実施可否を、現在の資料で机上判定する。

SCNの実使用機能、source_contracts.jsonの保留条件と別業務参照、未解決の
実装乖離台帳、STIの実在IDを照合する。別業務参照は子工程の保留・指摘を
親へ継承する。旧09の「設計なし」文言は固定語で再適用しない。

出力はexec/feasibility/feasibility_by_step.tsvとfeasibility_by_scenario.tsv。
「実行可」は台帳上の指摘がないという意味で、実機合格を意味しない。
"""
from __future__ import annotations

import csv
import glob
import json
import os
import re
import sys
from collections import Counter, OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".codex/skills/hareruya-scenario-test-cases/scripts"))
import execution_repairs
SCN_DIR = ROOT / "scenario_test/scenario"
ITEMS = ROOT / "scenario_test/test_items/all_scenario_test_items.tsv"
GAP_DOC = ROOT / "scenario_test/scenario/09_設計ギャップ差し戻しリスト.md"
DRIFT = ROOT / "design_impl_drift_report/drift_findings_list_open.tsv"
OUT_DIR = ROOT / "scenario_test/exec/feasibility"

# SCNメインフローの「利用画面・機能」が機能Noを持たないときのラベル→区分。
# 原典が明示している文言だけを見る（推測で分類しない）。
LABEL_KINDS = [
    ("別業務フロー参照", "業務参照"),
    ("専用の機能設計書なし", "実行手段未特定"),
    ("現場作業", "システム外（現場）"),
    ("外部システム/ツール作業", "システム外（外部）"),
    ("非EC-CUBE作業", "システム外（外部）"),
    ("業務判断", "業務判断"),
]

# 過去の09の分類を固定文言で再適用しない。現在のSCNとHTML補完結果を判定元にする。

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
EXPECTED_SCN = 129
# execution_repairs/step_count_changes.json: 承認等11工程追加、誤った3工程を整理。
EXPECTED_STEPS = 830


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
            key = "要確認" if any(w in " ".join(c[5:7]) for w in ("未定義", "要確認", "未特定")) else ("終端" if v.startswith("終端") else "実行可能")
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
        return V_UNK, "現在のSCNで実行手段未特定。source_contracts.jsonの調査記録と残件を参照（設計書不在とは断定しない）"
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

    parsed = {value["sid"]: value for value in (parse_scn(path) for path in paths)}
    contracts = execution_repairs.contracts(ROOT)

    def reference_verdict(scenario, step, seen=None):
        seen = set() if seen is None else seen
        identity = (scenario["sid"], step["no"])
        if identity in seen:
            return V_UNK, "業務参照の循環を解消する必要がある", []
        seen = seen | {identity}
        features, category = classify(step["screen"])
        if "実施保留条件:" in step["result"]:
            return V_UNK, step["result"].split("実施保留条件:", 1)[1].strip(), features
        if category != "業務参照":
            verdict, reason = step_verdict(category, [drift[f] for f in features if f in drift], step["action"])
            return verdict, reason, features
        contract = next((c for c in contracts if c["business"] == scenario["biz"] and (c["source_action"] == step["action"] or step["action"].startswith(c["source_action"] + " "))), None)
        if not contract:
            return V_UNK, "別業務参照の根拠契約を特定できない", []
        results = []
        for target in contract.get("subflow_targets", []):
            other = parsed.get(target["scenario_id"])
            if not other:
                return V_UNK, "参照先シナリオが存在しない: " + target["scenario_id"], []
            for number in target["target_steps"]:
                child = next((r for r in other["steps"] if r["no"] == str(number)), None)
                if not child:
                    return V_UNK, "参照先工程が存在しない: " + target["scenario_id"] + "#" + str(number), []
                results.append(reference_verdict(other, child, seen))
        if not results:
            return V_UNK, "別業務参照の対象工程が未確定", []
        rank = {v: n for n, v in enumerate(VERDICT_RANK + [V_OUT])}
        worst = min(results, key=lambda r: rank.get(r[0], 0))
        all_features = sorted({f for r in results for f in r[2]})
        return worst[0], "参照先工程の判定を継承: " + worst[1], all_features

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
            if kind == "業務参照":
                verdict, reason, nos = reference_verdict(s, st)
                d = [drift[n] for n in nos if n in drift]
            if "実施保留条件:" in st["result"]:
                verdict, reason = V_UNK, st["result"].split("実施保留条件:", 1)[1].strip()
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

        sys_steps = counts["システム操作"] + counts["業務参照"]
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
