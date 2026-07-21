#!/usr/bin/env python3
"""design-impl-conformance-audit ワークフローの差分デルタを findings.json へ upsert する。

`.codex/drift_conformance_audit.js` が conformance_findings/_deltas/<functionId>.json に
書いた「確定 未実装／実装違い」を、design_impl_drift_report/findings.json の該当機能へ
CONFIRMED 所見として取り込む。取り込み後に audit_harness.py を再実行すると、
implementationGap 判定・comparisonRows・要求トレースのカバー反映まで既存ロジックで行われる。

使い方:
    python3 apply_conformance_findings.py            # 取り込みのみ
    python3 apply_conformance_findings.py --reaudit  # 取り込み後に audit_harness.main() を実行
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "findings.json"
DELTA_DIR = ROOT / "conformance_findings" / "_deltas"

CATEGORY_DIMENSION = {
    "未実装": "⑦要求網羅・未実装",
    "実装違い": "⑦要求網羅・実装違い",
}


def clean_design_ref(ref):
    """workflow が designRef に混ぜた説明文を落とし、path#anchor(:line) だけにする。

    harness の設計スニペット解決・レポート表示が壊れないようにする。
    例: 'excel_to_html/.../x.html#sheet-10（『…』, materialGapRows row84）' -> '...x.html#sheet-10'
    """
    if not ref:
        return ref
    ref = ref.strip().strip("`")
    m = re.match(r"^(.+?\.html#[A-Za-z0-9_\-]+(?::[\d,\-]+)?)", ref)
    if m:
        return m.group(1)
    # html アンカー形でない場合は、全角括弧・引用符・読点などの説明開始で切る。
    return re.split(r"[（(『「、]|\s—|\s-\s", ref)[0].strip() or ref


def stable_finding_id(function_id, finding):
    # designExpectation(要求文)＋implRef＋mismatchReason まで含め、同一シート内の複数所見が
    # 衝突しないようにする（安定＝同一デルタなら同一ID＝再実行で冪等）。
    key = ":".join([
        function_id,
        str(finding.get("dimension") or ""),
        str(finding.get("designExpectation") or ""),
        str(finding.get("implRef") or ""),
        str(finding.get("mismatchReason") or ""),
    ])
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]
    return f"{function_id}-conformance-{digest}"


def to_finding(function_id, raw):
    category = raw.get("category") or "未実装"
    dimension = raw.get("dimension") or CATEGORY_DIMENSION.get(category, "⑦要求網羅・未実装")
    design_ref = clean_design_ref(raw.get("designRef"))
    impl_ref = raw.get("implRef") or ("不在" if category == "未実装" else "")
    impl_actual = raw.get("implementationActual") or ""
    # 未実装は implementation_gap_type() が拾えるよう不在系の語を確実に残す。
    if category == "未実装" and not any(k in (impl_actual + impl_ref + str(raw.get("mismatchReason"))) for k in ["未実装", "不在", "存在しない", "見当たらない", "未検出"]):
        impl_actual = (impl_actual + " 設計要求に対応する実装が見当たらない（未実装）。").strip()
    finding = {
        "id": raw.get("id") or None,
        "dimension": dimension,
        "severity": raw.get("severity") or "med",
        "designRef": design_ref,
        "designRefDetail": raw.get("designRef") if raw.get("designRef") != design_ref else None,
        "designExpectation": raw.get("designExpectation") or raw.get("designRequirement"),
        "designQuote": raw.get("designExpectation") or raw.get("designRequirement"),
        "implRef": impl_ref,
        "implementationActual": impl_actual,
        "difference": raw.get("mismatchReason") or impl_actual,
        "mismatchReason": raw.get("mismatchReason"),
        "comparisonRows": raw.get("comparisonRows") or [],
        "verdict": "CONFIRMED",
        "confidence": "CONFIRMED",
        "source": "design_impl_conformance_audit",
        "functionId": function_id,
    }
    if not finding["id"]:
        finding["id"] = stable_finding_id(function_id, finding)
    return finding


def upsert(function_entry, finding):
    # id は functionId+cleanRef+designExpectation から導く安定キー。これのみで一致判定する
    # （dimension+designRef だと同一シートの複数所見が誤って畳まれるため使わない）。
    for existing in function_entry.setdefault("findings", []):
        if existing.get("id") == finding["id"]:
            existing.update(finding)
            return "updated"
    function_entry["findings"].append(finding)
    return "added"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reaudit", action="store_true", help="取り込み後に audit_harness.py を再実行する")
    args = parser.parse_args()

    if not DELTA_DIR.exists():
        print(f"デルタが無い: {DELTA_DIR}（先に .codex/drift_conformance_audit.js を実行）", file=sys.stderr)
        return 1
    data = json.loads(DATA.read_text(encoding="utf-8"))
    by_id = {fn["functionId"]: fn for fn in data["functions"]}

    # 再実行を冪等にする: 既存の本監査由来の所見を一旦除去してから入れ直す。
    removed = 0
    for fn in data["functions"]:
        kept = [f for f in fn.get("findings", []) if f.get("source") != "design_impl_conformance_audit"]
        removed += len(fn.get("findings", [])) - len(kept)
        fn["findings"] = kept
    if removed:
        print(f"既存の本監査所見 {removed} 件を除去して入れ直す（冪等化）")

    added = updated = files = skipped = 0
    for delta_path in sorted(DELTA_DIR.glob("*.json")):
        files += 1
        delta = json.loads(delta_path.read_text(encoding="utf-8"))
        fid = delta.get("functionId")
        fn = by_id.get(fid)
        if not fn:
            print(f"  未知の functionId をスキップ: {fid} ({delta_path.name})", file=sys.stderr)
            skipped += 1
            continue
        for raw in delta.get("findings", []):
            result = upsert(fn, to_finding(fid, raw))
            if result == "added":
                added += 1
            else:
                updated += 1

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"デルタ {files} ファイル取り込み: 追加 {added} / 更新 {updated} / スキップ {skipped}")

    if args.reaudit:
        print("audit_harness.py を再実行して所見を enrich …")
        subprocess.run([sys.executable, str(ROOT / "audit_harness.py")], check=True)
        print("build_report.py で index.html を再生成してください。")
    else:
        print("次: python3 audit_harness.py && python3 build_report.py で反映")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
