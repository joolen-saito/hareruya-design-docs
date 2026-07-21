#!/usr/bin/env python3
import html
import json
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "findings.json"
OUT = ROOT / "index.html"
REVIEW = ROOT / "codex_review.md"


def esc(value):
    return html.escape("" if value is None else str(value), quote=True)


def severity_label(severity):
    return {"high": "高", "med": "中", "low": "低"}.get(severity, severity)


def severity_class(severity):
    return {"high": "b-high", "med": "b-med", "low": "b-low"}.get(severity, "b-low")


def domain_label(domain):
    labels = {
        "a01": "API:在庫",
        "a05": "API:受注",
        "a06": "API:店頭買取",
        "admin_customer": "admin_customer",
        "admin_product": "admin_product",
        "m04": "管理:在庫",
        "m05": "管理:受注",
        "m06": "管理:店頭買取",
        "m07": "管理:ネット買取",
        "m08": "管理:会員",
        "m09": "管理:コンテンツ",
        "m10": "管理:店舗設定",
        "m11": "管理:システム設定",
    }
    return labels.get(domain, domain)


def audit_status_label(status):
    return {
        "AUDITED_WITH_FINDINGS": "差分あり",
        "AUDITED_NO_DRIFT_FOUND": "差分なし確認済",
        "AUDIT_INCOMPLETE_REQUIREMENT_TRACE": "要求未照合",
    }.get(status, status or "未監査")


def audit_status_class(status):
    return {
        "AUDITED_WITH_FINDINGS": "s-findings",
        "AUDITED_NO_DRIFT_FOUND": "s-ok",
        "AUDIT_INCOMPLETE_REQUIREMENT_TRACE": "s-pending",
    }.get(status, "s-pending")


def implementation_verdict_label(verdict):
    return {
        "CONFIRMED_IMPLEMENTATION_GAP": "実装漏れ所見あり",
        "NO_IMPLEMENTATION_ENTRY_FOUND": "実装入口未検出候補",
        "IMPLEMENTATION_ENTRY_FOUND": "実装入口候補あり（要求未照合）",
        "IMPLEMENTATION_CANDIDATE_FOUND": "弱い候補あり",
        "PHASE2_NONIMPLEMENTATION_EXPECTED": "Ph2未実装想定",
        "DESIGN_NONIMPLEMENTATION_EXPECTED": "設計上非実装",
        "NOT_AUDITED": "未照合",
    }.get(verdict, verdict or "未照合")


def implementation_verdict_class(verdict):
    return {
        "CONFIRMED_IMPLEMENTATION_GAP": "s-findings",
        "NO_IMPLEMENTATION_ENTRY_FOUND": "s-pending",
        "IMPLEMENTATION_ENTRY_FOUND": "s-pending",
        "IMPLEMENTATION_CANDIDATE_FOUND": "s-pending",
        "PHASE2_NONIMPLEMENTATION_EXPECTED": "s-ok",
        "DESIGN_NONIMPLEMENTATION_EXPECTED": "s-ok",
    }.get(verdict, "s-pending")


def conformance_bucket_class(bucket):
    return {
        "未実装候補": "s-findings",
        "要確認": "s-pending",
        "実装済み": "s-ok",
        "対象外": "s-ok",
    }.get(bucket, "s-pending")


def requirement_signal_label(verdict):
    return {
        "NO_SOURCE_SIGNAL_FOUND": "実装ソースヒットなし",
        "WEAK_SOURCE_SIGNAL_FOUND": "弱い実装候補のみ",
        "SOURCE_SIGNAL_FOUND_REQUIREMENT_UNTRACED": "候補あり・要求未照合",
        "COVERED_BY_FINDING": "所見でカバー済み",
        "PHASE2_NONIMPLEMENTATION_EXPECTED": "Ph2未実装想定",
        "DESIGN_NONIMPLEMENTATION_EXPECTED": "設計上非実装",
    }.get(verdict, verdict or "未照合")


def requirement_signal_class(verdict):
    return {
        "NO_SOURCE_SIGNAL_FOUND": "s-findings",
        "WEAK_SOURCE_SIGNAL_FOUND": "s-pending",
        "SOURCE_SIGNAL_FOUND_REQUIREMENT_UNTRACED": "s-pending",
        "COVERED_BY_FINDING": "s-ok",
        "PHASE2_NONIMPLEMENTATION_EXPECTED": "s-ok",
        "DESIGN_NONIMPLEMENTATION_EXPECTED": "s-ok",
    }.get(verdict, "s-pending")


def render_requirement_search_terms(row, limit=10):
    terms = row.get("searchTerms") or []
    if not terms:
        return ""
    return " ".join(f"<span class=\"tag\">{esc(term)}</span>" for term in terms[:limit])


def render_candidate_refs(candidates, limit=4):
    if not candidates:
        return ""
    rows = []
    for item in candidates[:limit]:
        rows.append(
            f"<li><span class=\"mono\">{esc(item.get('ref'))}</span> "
            f"<span class=\"tag\">{esc(item.get('role'))}</span> "
            f"<span class=\"tag\">{esc(item.get('termType'))}:{esc(item.get('term'))}</span>"
            f"<div class=\"quote\">{esc(item.get('snippet'))}</div></li>"
        )
    return "<ul class=\"refs\">" + "".join(rows) + "</ul>"


def render_design_terms(audit, limit=12):
    terms = []
    for values in audit.get("designDerivedTerms", {}).values():
        for value in values:
            if value not in terms:
                terms.append(value)
    if not terms:
        return ""
    return " / ".join(esc(t) for t in terms[:limit])


def phase2_verdict_label(verdict):
    return {
        "NOT_IMPLEMENTED_CONFIRMED": "未実装確認済",
        "IMPLEMENTED_PHASE_PLAN_MISMATCH": "Ph2実装あり",
        "PHASE2_NOTE_OR_PARTIAL_SCOPE_REVIEWED": "部分/備考確認済",
    }.get(verdict, "")


def phase2_verdict_class(verdict):
    return {
        "NOT_IMPLEMENTED_CONFIRMED": "s-ok",
        "IMPLEMENTED_PHASE_PLAN_MISMATCH": "s-findings",
        "PHASE2_NOTE_OR_PARTIAL_SCOPE_REVIEWED": "s-pending",
    }.get(verdict, "s-pending")


def render_ref_list(refs):
    if not refs:
        return ""
    items = []
    for ref in refs:
        items.append(f"<li><span class=\"mono\">{esc(ref)}</span></li>")
    return "<ul class=\"refs\">" + "".join(items) + "</ul>"


def render_code_snippets(snippets):
    if not snippets:
        return ""
    blocks = []
    for snippet in snippets:
        blocks.append(f"<pre class=\"code-snippet\">{esc(snippet)}</pre>")
    return "".join(blocks)


def render_comparison_rows(rows):
    if not rows:
        return ""
    parts = ["<div class=\"comparison\"><table><thead><tr><th>比較項目</th><th>設計書の値・要求</th><th>実装の値・挙動</th><th>乖離理由</th></tr></thead><tbody>"]
    for row in rows:
        parts.append("<tr>")
        parts.append(f"<td>{esc(row.get('item'))}</td>")
        parts.append(f"<td>{esc(row.get('design'))}</td>")
        parts.append(f"<td>{esc(row.get('implementation'))}</td>")
        parts.append(f"<td>{esc(row.get('mismatch'))}</td>")
        parts.append("</tr>")
    parts.append("</tbody></table></div>")
    return "".join(parts)


def load_reviews():
    if not REVIEW.exists():
        return {}
    text = REVIEW.read_text(encoding="utf-8")
    reviews = {}
    current = None
    buf = []
    for line in text.splitlines():
        if line.startswith("## "):
            if current:
                reviews[current] = "\n".join(buf).strip()
            current = line[3:].strip()
            buf = []
        elif current:
            buf.append(line)
    if current:
        reviews[current] = "\n".join(buf).strip()
    return reviews


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    functions = data.get("functions", [])
    scope = data.get("scope", {})
    findings = [f for fn in functions for f in fn.get("findings", [])]
    audited_with_findings_count = sum(1 for fn in functions if fn.get("auditStatus") == "AUDITED_WITH_FINDINGS")
    audited_no_drift_count = sum(1 for fn in functions if fn.get("auditStatus") == "AUDITED_NO_DRIFT_FOUND")
    pending_count = len(functions) - audited_with_findings_count - audited_no_drift_count
    by_sev = Counter(f.get("severity") for f in findings)
    by_dim = Counter(f.get("dimension") for f in findings)
    by_aspect = Counter(
        aspect
        for f in findings
        for aspect in f.get("auditAspects", [])
    )
    gap_findings = [f for f in findings if f.get("implementationGap")]
    gap_functions = {
        fn.get("functionId")
        for fn in functions
        if any(f.get("implementationGap") for f in fn.get("findings", []))
    }
    by_gap_type = Counter(f.get("implementationGapType") for f in gap_findings)
    implementation_audits = [
        fn.get("functionImplementationAudit", {})
        for fn in functions
        if fn.get("functionImplementationAudit")
    ]
    by_impl_verdict = Counter(audit.get("verdict") for audit in implementation_audits)
    requirement_difference_rows = []
    for fn in functions:
        for row in fn.get("requirementDifferenceAudit", {}).get("rows", []):
            requirement_difference_rows.append((fn, row))
    requirement_difference_rows.sort(key=lambda item: (
        0 if item[1].get("implementationGap") else 1,
        item[0].get("functionId") or "",
        item[1].get("findingId") or "",
        item[1].get("designRequirement") or "",
    ))
    by_requirement_diff_verdict = Counter(row.get("traceVerdict") for _fn, row in requirement_difference_rows)
    focused_untraced_rows = []
    for fn in functions:
        for row in fn.get("focusedUntracedRequirementAudit", {}).get("rows", []):
            focused_untraced_rows.append((fn, row))
    focused_untraced_rows.sort(key=lambda item: (
        item[0].get("functionId") or "",
        item[1].get("verdict") or "",
        item[1].get("designRequirement") or "",
    ))
    by_focused_untraced_verdict = Counter(row.get("verdict") for _fn, row in focused_untraced_rows)
    # 全要求の判定（判定漏れ0）。material な未実装候補・要確認を上位に出す。
    conformance_material_rows = []
    conformance_bucket_totals = Counter()
    conformance_unverdicted_total = 0
    for fn in functions:
        ca = fn.get("requirementConformanceAudit") or {}
        if not ca:
            continue
        conformance_unverdicted_total += ca.get("unverdictedCount", 0)
        for bucket, count in (ca.get("counts") or {}).items():
            conformance_bucket_totals[bucket] += count
        for row in ca.get("materialGapRows", []):
            conformance_material_rows.append((fn, row))
    _bucket_order = {"未実装候補": 0, "要確認": 1, "実装済み": 2, "対象外": 3}
    conformance_material_rows.sort(key=lambda item: (
        _bucket_order.get(item[1].get("conformanceBucket"), 9),
        item[0].get("functionId") or "",
        item[1].get("designRequirement") or "",
    ))
    by_domain = defaultdict(int)
    for fn in functions:
        if fn.get("findings"):
            by_domain[fn.get("domain")] += len(fn["findings"])
    reviews = load_reviews()

    parts = []
    parts.append("""<!doctype html><meta charset="utf-8">""")
    parts.append("""<title>設計書 vs ec-cube-enterprise 機能差分 監査レポート</title>""")
    parts.append("""<style>
:root{--bg:#fff;--fg:#1a1a1a;--muted:#666;--card:#f7f7f8;--border:#e2e2e5;--hi:#c0392b;--med:#c77c17;--low:#2d7d46;--accent:#2b5cb8;--code:#f0f0f3}
@media (prefers-color-scheme:dark){:root{--bg:#16171a;--fg:#e6e6e8;--muted:#9a9aa2;--card:#202126;--border:#33343a;--hi:#ff6b5e;--med:#e0a54a;--low:#5fce85;--accent:#7aa2f7;--code:#23242a}}
:root[data-theme=dark]{--bg:#16171a;--fg:#e6e6e8;--muted:#9a9aa2;--card:#202126;--border:#33343a;--hi:#ff6b5e;--med:#e0a54a;--low:#5fce85;--accent:#7aa2f7;--code:#23242a}
:root[data-theme=light]{--bg:#fff;--fg:#1a1a1a;--muted:#666;--card:#f7f7f8;--border:#e2e2e5;--hi:#c0392b;--med:#c77c17;--low:#2d7d46;--accent:#2b5cb8;--code:#f0f0f3}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;line-height:1.6;font-size:15px}
.wrap{max-width:1180px;margin:0 auto;padding:24px 20px 80px}
h1{font-size:24px;margin:0 0 4px} h2{font-size:19px;margin:38px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--border)}
.sub{color:var(--muted);font-size:13px;margin-bottom:20px}
.cards{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px;min-width:120px}
.card .n{font-size:26px;font-weight:700}.card .l{font-size:12px;color:var(--muted)}
.tocbox,.note{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px 18px;margin:16px 0}
.note{border-left:4px solid var(--accent);font-size:13px}
.tocbox a{color:var(--accent);text-decoration:none}.tocbox a:hover{text-decoration:underline}
.tocgrid{display:flex;flex-wrap:wrap;gap:6px 18px}
.badge{display:inline-block;padding:1px 8px;border-radius:20px;font-size:12px;font-weight:700;color:#fff}.b-high{background:var(--hi)}.b-med{background:var(--med)}.b-low{background:var(--low)}
.tag{display:inline-block;padding:1px 7px;border-radius:5px;font-size:11px;background:var(--code);color:var(--muted);border:1px solid var(--border)}
.status{display:inline-block;padding:1px 7px;border-radius:5px;font-size:11px;font-weight:700;border:1px solid var(--border);white-space:nowrap}.s-findings{color:var(--hi);background:var(--code)}.s-ok{color:var(--low);background:var(--code)}.s-pending{color:var(--med);background:var(--code)}
.gap-label{display:inline-block;padding:1px 8px;border-radius:5px;font-size:11px;font-weight:700;color:#fff;background:var(--hi)}
.tablewrap{overflow-x:auto;border:1px solid var(--border);border-radius:8px;margin:8px 0}
table{border-collapse:collapse;width:100%;min-width:900px;font-size:13.5px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:top}
th{background:var(--card);font-size:12px;color:var(--muted);white-space:nowrap}
td code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;background:var(--code);padding:1px 5px;border-radius:4px;word-break:break-all}
.quote{border-left:3px solid var(--border);padding-left:8px;font-size:12.5px;color:var(--muted)}
.fn-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:20px}.fn-h .fid{font-family:ui-monospace,monospace;font-size:14px;font-weight:700}.fn-h .ft{color:var(--muted);font-size:13px}
.vd{font-size:11px;font-weight:700}.vd-CONFIRMED{color:var(--low)}.vd-UNCERTAIN{color:var(--med)}
.finding{border:1px solid var(--border);border-radius:8px;margin:12px 0;background:var(--bg);overflow:hidden}
.finding-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;background:var(--card);border-bottom:1px solid var(--border)}
.finding-head .id{font-family:ui-monospace,monospace;font-size:11px;color:var(--muted)}
.finding-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;border-bottom:1px solid var(--border)}
.pane{padding:12px;border-right:1px solid var(--border)}.pane:last-child{border-right:0}
.pane h4,.detail h4{font-size:12px;margin:0 0 5px;color:var(--muted);font-weight:700}
.pane p,.detail p{margin:0 0 8px}
.detail{padding:12px;border-bottom:1px solid var(--border)}
.detail-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;padding:12px}
.comparison{padding:12px;border-bottom:1px solid var(--border)}
.comparison table{min-width:980px;font-size:13px}
.comparison th:nth-child(1){width:16%}.comparison th:nth-child(2){width:26%}.comparison th:nth-child(3){width:26%}.comparison th:nth-child(4){width:32%}
.refs{margin:4px 0 8px;padding-left:18px}.refs li{margin:2px 0}
.code-snippet{margin:6px 0 0;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--code);overflow-x:auto;white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:11.5px;line-height:1.45}
.compact-phase{font-size:12px;color:var(--muted)}
@media (max-width:760px){.finding-body,.detail-grid{grid-template-columns:1fr}.pane{border-right:0;border-bottom:1px solid var(--border)}}
.themebtn{position:fixed;top:14px;right:16px;background:var(--card);border:1px solid var(--border);color:var(--fg);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px}
details.codex{background:var(--card);border:1px solid var(--border);border-radius:8px;margin:6px 0 18px;font-size:13px}
details.codex summary{cursor:pointer;padding:8px 12px;font-weight:700;color:var(--accent)}
details.codex pre{margin:0;padding:10px 14px;border-top:1px solid var(--border);overflow-x:auto;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,monospace;font-size:12px;line-height:1.55}
details.ledger-accordion{background:var(--card);border:1px solid var(--border);border-radius:8px;margin:8px 0 20px}
details.ledger-accordion summary{cursor:pointer;padding:10px 14px;font-weight:700;color:var(--accent)}
details.ledger-accordion .tablewrap{border-left:0;border-right:0;border-bottom:0;border-radius:0 0 8px 8px;margin:0}
</style>""")
    parts.append("""<button class="themebtn" onclick="var r=document.documentElement;r.dataset.theme=r.dataset.theme==='dark'?'light':'dark'">◐ テーマ</button><div class="wrap">""")
    parts.append("<h1>設計書 vs ec-cube-enterprise 機能差分 監査レポート</h1>")
    scope_label = esc(scope.get("targetUnit", "Excel HTML visible sheets with regular featureNo"))
    parts.append(f"<div class=\"sub\">HTML設計書を<b>正</b>とし、ec-cube-enterprise 実装が機能的に異なる箇所を洗い出した監査結果。生成: {date.today().isoformat()} / 母数: {scope_label}</div>")
    parts.append("<div class=\"note\"><b>読み方</b>：母数は <b>excel_to_html/output の表示シートのうち正規の機能Noを持つ407シート</b>。全シートを監査対象として、差分あり監査済 / 差分なし確認済 / 未監査に区分する。</div>")
    parts.append("<div class=\"note\"><b>差分詳細の読み方</b>：各所見は、設計で要求されていること、実装で起きていること、なぜ乖離と判断したか、影響、修正対象、根拠ファイル/行、コード断片を分けて表示する。実装者はまず「乖離している具体的な理由」と「修正対象」を確認し、設計側の該当節と突き合わせる。</div>")
    parts.append("<div class=\"cards\">")
    parts.append(f"<div class=\"card\"><div class=\"n\">{len(findings)}</div><div class=\"l\">差分 総数</div></div>")
    parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{by_sev.get('high',0)}</div><div class=\"l\">高 severity</div></div>")
    parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--med)\">{by_sev.get('med',0)}</div><div class=\"l\">中 severity</div></div>")
    parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--low)\">{by_sev.get('low',0)}</div><div class=\"l\">低 severity</div></div>")
    parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{len(gap_findings)}</div><div class=\"l\">明確な実装漏れ 所見</div></div>")
    parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{len(gap_functions)}</div><div class=\"l\">実装漏れあり シート</div></div>")
    parts.append(f"<div class=\"card\"><div class=\"n\">{sum(1 for fn in functions if fn.get('findings'))}/{len(functions)}</div><div class=\"l\">差分あり/監査機能</div></div>")
    if scope:
        target_specs = scope.get("targetHtmlSpecs", len(functions))
        target_audited = scope.get("targetAuditedFunctions", len(functions))
        unique_feature_nos = scope.get("uniqueFeatureNos", 0)
        parts.append(f"<div class=\"card\"><div class=\"n\">{target_audited}/{target_specs}</div><div class=\"l\">Excel機能シート母数</div></div>")
        parts.append(f"<div class=\"card\"><div class=\"n\">{unique_feature_nos}</div><div class=\"l\">ユニーク機能No</div></div>")
        parts.append(f"<div class=\"card\"><div class=\"n\">{audited_with_findings_count}</div><div class=\"l\">差分あり監査済</div></div>")
        parts.append(f"<div class=\"card\"><div class=\"n\">{audited_no_drift_count}</div><div class=\"l\">差分なし確認済</div></div>")
        parts.append(f"<div class=\"card\"><div class=\"n\">{pending_count}</div><div class=\"l\">未監査</div></div>")
        parts.append(f"<div class=\"card\"><div class=\"n\">{scope.get('functionImplementationAuditFunctions', len(implementation_audits))}</div><div class=\"l\">機能入口照合済</div></div>")
        parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--med)\">{scope.get('functionImplementationNoEntryCandidates', by_impl_verdict.get('NO_IMPLEMENTATION_ENTRY_FOUND', 0))}</div><div class=\"l\">実装入口未検出候補</div></div>")
        if scope.get("requirementTraceGateFailures") is not None:
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--med)\">{esc(scope.get('requirementTraceGateFailures'))}</div><div class=\"l\">要求未照合</div></div>")
        if scope.get("requirementTraceGatePromotedFindings") is not None:
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{esc(scope.get('requirementTraceGatePromotedFindings'))}</div><div class=\"l\">明示要求から所見化</div></div>")
        if scope.get("requirementDifferenceRows") is not None:
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{esc(scope.get('requirementDifferenceRows'))}</div><div class=\"l\">個別要求 差分</div></div>")
        if scope.get("requirementDifferenceImplementationGapRows") is not None:
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{esc(scope.get('requirementDifferenceImplementationGapRows'))}</div><div class=\"l\">個別要求 実装漏れ</div></div>")
        if scope.get("focusedUntracedRequirementRows") is not None:
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--med)\">{esc(scope.get('focusedUntracedRequirementRows'))}</div><div class=\"l\">重点未照合要求</div></div>")
        if scope.get("requirementConformanceRequirements") is not None:
            unverdicted = scope.get("requirementConformanceUnverdicted", conformance_unverdicted_total)
            gate_color = "var(--low)" if not unverdicted else "var(--hi)"
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:{gate_color}\">{esc(unverdicted)}</div><div class=\"l\">要求 判定漏れ(0必須)</div></div>")
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--hi)\">{esc(scope.get('notImplementedCandidateRows', conformance_bucket_totals.get('未実装候補', 0)))}</div><div class=\"l\">未実装候補</div></div>")
            parts.append(f"<div class=\"card\"><div class=\"n\" style=\"color:var(--med)\">{esc(scope.get('needsCheckRows', conformance_bucket_totals.get('要確認', 0)))}</div><div class=\"l\">要確認 要求</div></div>")
    parts.append("</div>")
    if scope.get("requirementTracePolicy"):
        parts.append(f"<div class=\"note\"><b>要求トレースゲート</b>：{esc(scope.get('requirementTracePolicy'))}</div>")
    if scope.get("requirementTraceGateMode"):
        parts.append(f"<div class=\"note\"><b>要求トレースの漏れ防止</b>：{esc(scope.get('requirementTraceGateMode'))}</div>")
    if scope.get("functionImplementationAuditMode"):
        parts.append(f"<div class=\"note\"><b>機能単位 実装入口照合</b>：{esc(scope.get('functionImplementationAuditMode'))}</div>")
    if scope.get("requirementDifferenceAuditMode"):
        parts.append(f"<div class=\"note\"><b>個別要求 差分一覧</b>：{esc(scope.get('requirementDifferenceAuditMode'))}</div>")
    if scope.get("focusedUntracedRequirementMode"):
        parts.append(f"<div class=\"note\"><b>重点未照合要求</b>：{esc(scope.get('focusedUntracedRequirementMode'))}</div>")

    parts.append("<h2 id=\"summary\">観点別サマリ</h2><div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>観点</th><th>件数</th></tr></thead><tbody>")
    for dim, count in by_dim.most_common():
        parts.append(f"<tr><td>{esc(dim)}</td><td>{count}</td></tr>")
    parts.append("</tbody></table></div>")
    parts.append("<div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>標準監査観点</th><th>所見件数</th></tr></thead><tbody>")
    for aspect, count in by_aspect.most_common():
        parts.append(f"<tr><td>{esc(aspect)}</td><td>{count}</td></tr>")
    parts.append("</tbody></table></div>")

    parts.append("<h2 id=\"requirement-differences\">個別要求 未実装・実装違い</h2>")
    parts.append("<div class=\"note\">ここには、確定所見から逆引きできる個別要求の未実装・実装違いだけを表示する。検索ヒットなし・弱い候補のみ等の未確認候補は含めない。</div>")
    parts.append("<div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>判定</th><th>件数</th></tr></thead><tbody>")
    for verdict, count in by_requirement_diff_verdict.most_common():
        label = "未実装" if verdict == "NOT_FOUND" else "実装違い"
        css = "s-findings" if verdict in {"NOT_FOUND", "DRIFT"} else "s-pending"
        parts.append(f"<tr><td><span class=\"status {css}\">{esc(label)}</span></td><td>{count}</td></tr>")
    if not by_requirement_diff_verdict:
        parts.append("<tr><td>個別要求差分なし</td><td>0</td></tr>")
    parts.append("</tbody></table></div>")
    if requirement_difference_rows:
        parts.append("<details class=\"ledger-accordion\" open><summary>個別要求差分を表示</summary>")
        parts.append("<div class=\"tablewrap\"><table><thead><tr><th>判定</th><th>機能</th><th>所見</th><th>設計要求</th><th>実装の状態</th><th>乖離理由</th></tr></thead><tbody>")
        for fn, row in requirement_difference_rows:
            verdict = row.get("traceVerdict")
            label = "未実装" if verdict == "NOT_FOUND" else "実装違い"
            css = "s-findings" if verdict in {"NOT_FOUND", "DRIFT"} else "s-pending"
            link = f"#fn-{esc(fn.get('functionId'))}" if fn.get("findings") else f"#ledger-{esc(fn.get('functionId'))}"
            parts.append("<tr>")
            parts.append(f"<td><span class=\"status {css}\">{esc(label)}</span></td>")
            parts.append(f"<td><a href=\"{link}\"><span class=\"mono\">{esc(fn.get('functionId'))}</span></a><br>{esc(fn.get('title'))}</td>")
            parts.append(f"<td><a href=\"#finding-{esc(row.get('findingId'))}\">{esc(row.get('dimension'))}</a><br><span class=\"tag\">{esc(row.get('severity'))}</span></td>")
            parts.append(f"<td><span class=\"mono\">{esc(row.get('designRef'))}</span><div class=\"quote\">{esc(row.get('designRequirement'))}</div></td>")
            parts.append(f"<td>{esc(row.get('implementationActual'))}{render_ref_list(row.get('implementationRefs'))}</td>")
            parts.append(f"<td>{esc(row.get('mismatchReason'))}</td>")
            parts.append("</tr>")
        parts.append("</tbody></table></div></details>")

    parts.append("<h2 id=\"requirement-conformance\">個別要求 網羅監査（全要求の判定）</h2>")
    parts.append(
        "<div class=\"note\"><b>チェック漏れ防止の要</b>：設計書から抽出した"
        f"<b>全{esc(scope.get('requirementConformanceRequirements', conformance_bucket_totals and sum(conformance_bucket_totals.values()) or 0))}要求</b>に判定を付ける（判定漏れ"
        f"<b>{esc(scope.get('requirementConformanceUnverdicted', conformance_unverdicted_total))}</b>件）。"
        "実装済み / 要確認 / 未実装候補 / 対象外(理由付き) のいずれかへ必ず分類し、"
        "設計書に書かれた機能が未実装でも静かに監査から漏れないようにする。"
        "下表の <b>未実装候補</b>・<b>要確認</b>（利用者が直接見る要素＝material のみ）は、"
        "codex 批判的レビューと実機確認で <b>実装済/未実装/実装違い</b> を確定する候補。</div>"
    )
    parts.append("<div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>判定</th><th>件数</th></tr></thead><tbody>")
    for bucket in ["未実装候補", "要確認", "実装済み", "対象外"]:
        cnt = conformance_bucket_totals.get(bucket, 0)
        parts.append(f"<tr><td><span class=\"status {conformance_bucket_class(bucket)}\">{esc(bucket)}</span></td><td>{cnt}</td></tr>")
    parts.append("</tbody></table></div>")
    if conformance_material_rows:
        gap_ct = sum(1 for _fn, r in conformance_material_rows if r.get("conformanceBucket") == "未実装候補")
        # 全件はfindings JSON（機能別 requirementConformanceAudit.materialGapRows）にある。
        # ここは未実装候補を全件、要確認は上限までを優先表示し、超過分は明示的に注記する。
        CONF_ROW_CAP = 600
        rendered_rows = conformance_material_rows[:CONF_ROW_CAP]
        truncated = len(conformance_material_rows) - len(rendered_rows)
        parts.append(
            f"<details class=\"ledger-accordion\" open><summary>未実装候補・要確認（material）を表示：未実装候補 {gap_ct} / 全 {len(conformance_material_rows)} 件"
            + (f"（上位 {len(rendered_rows)} 件を表示・残り {truncated} 件は機能別JSONに収録）" if truncated > 0 else "")
            + "</summary>"
        )
        if truncated > 0:
            parts.append(f"<div class=\"note\">全 {len(conformance_material_rows)} 件のうち上位 {len(rendered_rows)} 件を表示。残り {truncated} 件は各機能の <span class=\"mono\">requirementConformanceAudit.materialGapRows</span>（findings JSON）に全件収録。判定漏れは 0 件。</div>")
        parts.append("<div class=\"tablewrap\"><table><thead><tr><th>判定</th><th>機能</th><th>設計要求（仕様）</th><th>実装シグナル</th><th>実装候補</th></tr></thead><tbody>")
        for fn, row in rendered_rows:
            bucket = row.get("conformanceBucket")
            link = f"#fn-{esc(fn.get('functionId'))}" if fn.get("findings") else f"#ledger-{esc(fn.get('functionId'))}"
            elem = "<span class=\"tag\">要素</span>" if row.get("elementLevel") else ""
            parts.append("<tr>")
            parts.append(f"<td><span class=\"status {conformance_bucket_class(bucket)}\">{esc(bucket)}</span> {elem}</td>")
            parts.append(f"<td><a href=\"{link}\"><span class=\"mono\">{esc(fn.get('featureNo') or fn.get('functionId'))}</span></a><br>{esc(fn.get('title'))}</td>")
            parts.append(f"<td><span class=\"mono\">{esc(row.get('designRef'))}</span><div class=\"quote\">{esc(row.get('designRequirement'))}</div></td>")
            parts.append(f"<td>{esc(requirement_signal_label(row.get('verdict')))}<div class=\"quote\">{esc(row.get('auditNote'))}</div></td>")
            parts.append(f"<td>{render_candidate_refs(row.get('candidateRefs'), limit=4)}</td>")
            parts.append("</tr>")
        parts.append("</tbody></table></div></details>")

    parts.append("<h2 id=\"focused-untraced-requirements\">重点未照合要求</h2>")
    parts.append("<div class=\"note\">ここには、未照合要求のうち、画面表示後の秒/分条件、自動遷移、タイムアウト遷移など、ルートやテンプレートの存在だけでは実装済みと判断できない要求を表示する。確定差分ではないため、個別要求差分件数・実装漏れ件数には含めない。</div>")
    parts.append("<div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>判定</th><th>件数</th></tr></thead><tbody>")
    for verdict, count in by_focused_untraced_verdict.most_common():
        parts.append(f"<tr><td><span class=\"status {requirement_signal_class(verdict)}\">{esc(requirement_signal_label(verdict))}</span></td><td>{count}</td></tr>")
    if not by_focused_untraced_verdict:
        parts.append("<tr><td>重点未照合要求なし</td><td>0</td></tr>")
    parts.append("</tbody></table></div>")
    if focused_untraced_rows:
        parts.append("<details class=\"ledger-accordion\"><summary>重点未照合要求を表示</summary>")
        parts.append("<div class=\"tablewrap\"><table><thead><tr><th>判定</th><th>機能</th><th>重点理由</th><th>設計要求</th><th>検索語</th><th>実装候補</th></tr></thead><tbody>")
        for fn, row in focused_untraced_rows:
            verdict = row.get("verdict")
            link = f"#fn-{esc(fn.get('functionId'))}" if fn.get("findings") else f"#ledger-{esc(fn.get('functionId'))}"
            parts.append("<tr>")
            parts.append(f"<td><span class=\"status {requirement_signal_class(verdict)}\">{esc(requirement_signal_label(verdict))}</span><br><span class=\"tag\">{esc(row.get('risk'))}</span></td>")
            parts.append(f"<td><a href=\"{link}\"><span class=\"mono\">{esc(fn.get('functionId'))}</span></a><br>{esc(fn.get('title'))}</td>")
            parts.append(f"<td>{esc(row.get('focusReason'))}<div class=\"quote\">{esc(row.get('auditNote'))}</div></td>")
            parts.append(f"<td><span class=\"mono\">{esc(row.get('designRef'))}</span><div class=\"quote\">{esc(row.get('designRequirement'))}</div></td>")
            parts.append(f"<td>{render_requirement_search_terms(row, limit=12)}</td>")
            parts.append(f"<td>{render_candidate_refs(row.get('candidateRefs'), limit=5)}</td>")
            parts.append("</tr>")
        parts.append("</tbody></table></div></details>")

    parts.append("<h2 id=\"implementation-gaps\">明確な実装漏れ 集計</h2>")
    parts.append("<div class=\"note\">ここでは、設計が要求する機能・ルート・入出力・DB更新・業務ロジックが実装側に存在しない、または近似実装では代替できないと確認できた所見を集計する。単なる値違い・文言違い・実装方式違いは含めない。</div>")
    parts.append("<div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>実装漏れ種別</th><th>件数</th></tr></thead><tbody>")
    for gap_type, count in by_gap_type.most_common():
        parts.append(f"<tr><td>{esc(gap_type)}</td><td>{count}</td></tr>")
    if not by_gap_type:
        parts.append("<tr><td>明確な実装漏れなし</td><td>0</td></tr>")
    parts.append("</tbody></table></div>")
    if gap_findings:
        parts.append("<div class=\"tablewrap\"><table><thead><tr><th>種別</th><th>機能</th><th>所見</th><th>severity</th></tr></thead><tbody>")
        for fn in functions:
            for f in fn.get("findings", []):
                if not f.get("implementationGap"):
                    continue
                parts.append("<tr>")
                parts.append(f"<td>{esc(f.get('implementationGapType'))}</td>")
                parts.append(f"<td><a href=\"#fn-{esc(fn.get('functionId'))}\"><span class=\"mono\">{esc(fn.get('functionId'))}</span></a><br>{esc(fn.get('title'))}</td>")
                parts.append(f"<td><a href=\"#finding-{esc(f.get('id'))}\">{esc(f.get('dimension'))}</a></td>")
                parts.append(f"<td><span class=\"badge {severity_class(f.get('severity'))}\">{severity_label(f.get('severity'))}</span></td>")
                parts.append("</tr>")
        parts.append("</tbody></table></div>")

    parts.append("<h2 id=\"function-implementation-audit\">機能単位 実装漏れ監査</h2>")
    parts.append("<div class=\"note\">この表は全407シートに対し、設計書から抽出したルート名・パス・翻訳キー・クラス名・主要業務語で実装ソースを横断照合した結果。<b>明確な実装漏れ</b>は所見化済みの確定差分、<b>実装入口未検出候補</b>は追加確認が必要な候補として扱う。<b>実装入口候補あり</b>はルート/クラス/パス等の入口が見つかったという意味であり、設計書の個別要求が実装済みであることを意味しない。</div>")
    parts.append("<div class=\"tablewrap\"><table style=\"min-width:auto\"><thead><tr><th>判定</th><th>件数</th></tr></thead><tbody>")
    for verdict, count in by_impl_verdict.most_common():
        parts.append(f"<tr><td><span class=\"status {implementation_verdict_class(verdict)}\">{esc(implementation_verdict_label(verdict))}</span></td><td>{count}</td></tr>")
    if not by_impl_verdict:
        parts.append("<tr><td>未照合</td><td>0</td></tr>")
    parts.append("</tbody></table></div>")
    flagged = [
        fn for fn in functions
        if fn.get("functionImplementationAudit", {}).get("verdict") in {
            "CONFIRMED_IMPLEMENTATION_GAP",
            "NO_IMPLEMENTATION_ENTRY_FOUND",
            "IMPLEMENTATION_CANDIDATE_FOUND",
        }
    ]
    if flagged:
        parts.append("<div class=\"tablewrap\"><table><thead><tr><th>判定</th><th>機能</th><th>候補数</th><th>照合メモ</th><th>設計抽出語/候補</th></tr></thead><tbody>")
        for fn in flagged:
            audit = fn.get("functionImplementationAudit", {})
            verdict = audit.get("verdict")
            link = f"#fn-{esc(fn.get('functionId'))}" if fn.get("findings") else f"#ledger-{esc(fn.get('functionId'))}"
            parts.append("<tr>")
            parts.append(f"<td><span class=\"status {implementation_verdict_class(verdict)}\">{esc(implementation_verdict_label(verdict))}</span></td>")
            parts.append(f"<td><a href=\"{link}\"><span class=\"mono\">{esc(fn.get('functionId'))}</span></a><br>{esc(fn.get('title'))}</td>")
            parts.append(f"<td>{esc(audit.get('candidateCount', 0))}</td>")
            parts.append(f"<td>{esc(audit.get('auditNote'))}</td>")
            parts.append(f"<td><details><summary>抽出語/候補を表示</summary><div class=\"quote\">{render_design_terms(audit)}</div>{render_candidate_refs(audit.get('candidateRefs', []), limit=3)}</details></td>")
            parts.append("</tr>")
        parts.append("</tbody></table></div>")

    parts.append("<h2 id=\"audit-ledger\">全407シート監査台帳</h2>")
    parts.append("<details class=\"ledger-accordion\"><summary>全407シート監査台帳を表示</summary>")
    parts.append("<div class=\"tablewrap\"><table><thead><tr><th>機能No</th><th>シート</th><th>ドメイン</th><th>監査状態</th><th>差分件数</th><th>個別要求差分</th><th>機能単位 実装判定</th><th>実装候補/未検出理由</th><th>標準監査対象観点</th><th>設計HTML</th></tr></thead><tbody>")
    for fn in functions:
        status = fn.get("auditStatus")
        audit = fn.get("functionImplementationAudit", {})
        req_diff = fn.get("requirementDifferenceAudit", {})
        verdict = audit.get("verdict", "NOT_AUDITED")
        parts.append(f"<tr id=\"ledger-{esc(fn.get('functionId'))}\">")
        parts.append(f"<td><span class=\"mono\">{esc(fn.get('featureNo'))}</span></td>")
        parts.append(f"<td>{esc(fn.get('sheetName') or fn.get('title'))}</td>")
        parts.append(f"<td>{esc(domain_label(fn.get('domain')))}</td>")
        parts.append(f"<td><span class=\"status {audit_status_class(status)}\">{esc(audit_status_label(status))}</span></td>")
        parts.append(f"<td>{len(fn.get('findings', []))}</td>")
        parts.append(
            f"<td><span class=\"tag\">差分 {esc(req_diff.get('confirmedDifferenceCount', 0))}</span> "
            f"<span class=\"tag\">実装漏れ {esc(req_diff.get('implementationGapRequirementCount', 0))}</span></td>"
        )
        parts.append(f"<td><span class=\"status {implementation_verdict_class(verdict)}\">{esc(implementation_verdict_label(verdict))}</span><br><span class=\"tag\">候補 {esc(audit.get('candidateCount', 0))}</span> <span class=\"tag\">強証跡 {esc(audit.get('strongSignalCount', 0))}</span></td>")
        parts.append(f"<td><details><summary>{esc(audit.get('auditNote', ''))}</summary><div class=\"quote\">設計抽出語: {render_design_terms(audit)}</div>{render_candidate_refs(audit.get('candidateRefs', []), limit=5)}</details></td>")
        parts.append(f"<td>{esc(fn.get('auditEvidence'))}</td>")
        parts.append(f"<td><span class=\"mono\">{esc(fn.get('designHtml'))}</span></td>")
        parts.append("</tr>")
    parts.append("</tbody></table></div></details>")

    parts.append("<div class=\"tocbox\"><b>ドメイン別 目次</b><div class=\"tocgrid\" style=\"margin-top:8px\">")
    for domain in sorted(by_domain):
        parts.append(f"<a href=\"#dom-{esc(domain)}\">{esc(domain_label(domain))} <span class=\"tag\">{by_domain[domain]}</span></a>")
    parts.append("</div></div>")

    grouped = defaultdict(list)
    for fn in functions:
        grouped[fn.get("domain")].append(fn)
    for domain in sorted(grouped):
        domain_findings = sum(len(fn.get("findings", [])) for fn in grouped[domain])
        if not domain_findings:
            continue
        parts.append(f"<h2 id=\"dom-{esc(domain)}\">{esc(domain_label(domain))} <span class=\"tag\">{esc(domain)}</span></h2>")
        for fn in grouped[domain]:
            rows = fn.get("findings", [])
            if not rows:
                continue
            parts.append(f"<div class=\"fn-h\" id=\"fn-{esc(fn.get('functionId'))}\"><span class=\"fid\">{esc(fn.get('functionId'))}</span><span class=\"ft\">{esc(fn.get('title'))}</span></div>")
            parts.append(f"<div class=\"sub\" style=\"margin:2px 0 6px\"><span class=\"mono\">{esc(fn.get('designHtml'))}</span></div>")
            for f in rows:
                verdict = f.get("verdict", "CONFIRMED")
                parts.append(f"<article class=\"finding\" id=\"finding-{esc(f.get('id'))}\">")
                parts.append("<div class=\"finding-head\">")
                parts.append(f"<span class=\"badge {severity_class(f.get('severity'))}\">{severity_label(f.get('severity'))}</span>")
                parts.append(f"<span class=\"status {audit_status_class('AUDITED_WITH_FINDINGS')}\">{esc(f.get('dimension'))}</span>")
                if f.get("implementationGap"):
                    parts.append(f"<span class=\"gap-label\">{esc(f.get('implementationGapLabel'))}: {esc(f.get('implementationGapType'))}</span>")
                for aspect in f.get("auditAspects", []):
                    parts.append(f"<span class=\"tag\">{esc(aspect)}</span>")
                parts.append(f"<span class=\"vd vd-{esc(verdict)}\">{esc(verdict)}</span>")
                parts.append(f"<span class=\"id\">{esc(f.get('id'))}</span>")
                parts.append("</div>")
                comparison = render_comparison_rows(f.get("comparisonRows"))
                if comparison:
                    parts.append(comparison)
                parts.append("<div class=\"finding-body\">")
                parts.append("<div class=\"pane\"><h4>設計で要求されていること</h4>")
                parts.append(f"<p>{esc(f.get('designExpectation') or f.get('designQuote'))}</p>")
                parts.append(f"<div><span class=\"mono\">{esc(f.get('designRef'))}</span></div>")
                if f.get("designQuote"):
                    parts.append(f"<div class=\"quote\" style=\"margin-top:5px\">{esc(f.get('designQuote'))}</div>")
                if f.get("designSnippet"):
                    parts.append(render_code_snippets([f.get("designSnippet")]))
                parts.append("</div>")
                parts.append("<div class=\"pane\"><h4>実装で起きていること</h4>")
                parts.append(f"<p>{esc(f.get('implementationActual') or f.get('difference'))}</p>")
                parts.append(render_ref_list(f.get("implementationRefs") or [f.get("implRef")]))
                if f.get("absenceConclusion"):
                    parts.append(f"<div class=\"quote\">{esc(f.get('absenceConclusion'))}</div>")
                parts.append("</div>")
                parts.append("</div>")
                parts.append("<div class=\"detail\"><h4>乖離している具体的な理由</h4>")
                parts.append(f"<p>{esc(f.get('mismatchReason') or f.get('difference'))}</p>")
                if f.get("comparisonSummary"):
                    parts.append(f"<div class=\"quote\">{esc(f.get('comparisonSummary'))}</div>")
                if f.get("evidence"):
                    parts.append(f"<div class=\"quote\">証跡: {esc(f.get('evidence'))}</div>")
                parts.append("</div>")
                parts.append("<div class=\"detail-grid\">")
                parts.append("<div><h4>影響</h4>")
                parts.append(f"<p>{esc(f.get('impact'))}</p></div>")
                parts.append("<div><h4>修正対象</h4>")
                parts.append(f"<p><span class=\"mono\">{esc(f.get('fixTarget') or f.get('implRef'))}</span></p>")
                if f.get("requiredChange"):
                    parts.append(f"<p>{esc(f.get('requiredChange'))}</p>")
                parts.append("</div>")
                parts.append("</div>")
                snippets = render_code_snippets(f.get("implementationSnippets"))
                if snippets:
                    parts.append("<div class=\"detail\"><h4>実装根拠コード断片</h4>")
                    parts.append(snippets)
                    parts.append("</div>")
                if f.get("implementationSearches"):
                    parts.append("<div class=\"detail\"><h4>実装検索証跡</h4>")
                    parts.append(render_code_snippets(["\n".join(f.get("implementationSearches"))]))
                    parts.append("</div>")
                parts.append("</article>")
            review = reviews.get(fn.get("functionId"))
            if review:
                parts.append(f"<details class=\"codex\"><summary>codex 批判的レビュー</summary><pre>{esc(review)}</pre></details>")
    parts.append("</div>")
    OUT.write_text("\n".join(parts), encoding="utf-8")


if __name__ == "__main__":
    main()
