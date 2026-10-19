#!/usr/bin/env bash
# シナリオテスト（SCN → STI → 実行用TSV → 可否台帳 → 監査）を全業務で再生成する。
#
#   bash scenario_test/tools/run_regeneration.sh
#
# - ハッシュの種を固定する（集合の並びで出力の順序が揺れるため）。
# - --only は使わない（--prune-obsolete と併用すると他業務の SCN/STI が消える）。
# - 次は 2026-10-09 の凍結記録・手作業文書を上書きするので流さない:
#   build_executability_review.py / export_lineage_gaps.py → build_sendback_list.py / build_flow_supplement_list.py
# - 件数を意図して変えたときは、build_feasibility_ledger.py の EXPECTED_SCN・EXPECTED_STEPS と
#   emit_scenario_concretized_tsv.py の EXPECTED_TOTAL・業務別件数を、内容を確認してから直す。
set -euo pipefail
export PYTHONHASHSEED=0
cd "$(dirname "$0")/../.."
C=.codex/skills/hareruya-scenario-test-cases/scripts
I=.codex/skills/hareruya-scenario-test-items/scripts
T=scenario_test/tools

step() { echo "== $*"; "$@"; }

step python3 $C/generate_scenarios.py --repo . --overwrite --prune-obsolete --archive-legacy-manual
step python3 $C/validate_scenarios.py --repo . --generated-only
step python3 $C/generate_scenario_tsv.py --repo .
step python3 $T/build_feasibility_ledger.py
step python3 $I/generate_test_items.py --repo . --overwrite --prune-obsolete
step python3 $T/build_feasibility_ledger.py
before=$(sha256sum scenario_test/test_items/all_scenario_test_items.tsv | cut -d' ' -f1)
step python3 $I/generate_test_items.py --repo . --overwrite --prune-obsolete
after=$(sha256sum scenario_test/test_items/all_scenario_test_items.tsv | cut -d' ' -f1)
[ "$before" = "$after" ] || { echo "テスト項目が収束しない（可否台帳との往復で集約TSVが変わった）" >&2; exit 1; }
step python3 $I/validate_test_items.py --repo .
step python3 $T/emit_scenario_concretized_tsv.py
step python3 $T/audit_execution_repairs.py
step python3 $T/audit_route_acceptance.py
step python3 $C/review_execution_repairs_inventory.py
step python3 $T/build_detail_supplement_list.py
step python3 $T/audit_scenario_delivery.py
echo "== 完了"
