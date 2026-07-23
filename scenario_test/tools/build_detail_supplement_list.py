import sys, pathlib, collections
sys.path.insert(0,".codex/skills/hareruya-scenario-test-cases/scripts")
import generate_scenarios as g
scs=g.generate(pathlib.Path("."),None,6)
# FLOW_ONLY / DECISION 工程を収集（業務,作業概要,R番号,種別,トリアージ判定/理由）
rows={}
for s in scs:
    rp=g.scenario_route_pattern(s); frows=g.normal_flow_rows(rp)
    for idx,(a,ac,sc,fe,ex,ob) in enumerate(g.step_rows(s.business_title,rp,s.docs)):
        if sc in (g.FLOW_ONLY_SCREEN, g.DECISION_SCREEN) and idx<len(frows):
            rn=g.row_r_number(frows[idx])
            j,f,u=g.TRIAGE_REGISTER.get((s.business_title,rn),("(未収載)","","" ))
            kind="判断分岐" if sc==g.DECISION_SCREEN else "設計書不在"
            key=(s.business_title, rn, ac[:40])
            rows[key]=(kind, j, "要判断" if u else "")
out=[]
out.append("# テスト手順 詳細化依頼リスト（原資不足で画面レベル具体化できない工程）")
out.append("")
out.append("- 生成元: `generate_scenarios.py`（FLOW_ONLY/DECISION 工程を抽出）")
out.append("- 背景: 捏造ゼロを守るため、専用の機能設計書が無い工程・判断ノードは、業務フロー記載の操作＋")
out.append("  業務結果の観測で手順化している（要確認表現は使わない）。画面・入力・合否基準まで詳細化するには")
out.append("  設計側/業務側の情報が要る（codexレビュー指摘: 初見の実施者が再現可能な手順には未達）。")
out.append("- 依頼: 各行に **対象画面 / 入力 / 期待状態(合否)** を追記いただければ、再生成で画面レベルの手順に昇格する。")
out.append("")
out.append(f"## 対象工程（{len(rows)}件）")
out.append("")
out.append("| 業務 | R番号 | 工程(業務行動) | 種別 | トリアージ判定 | 対象画面(記入) | 入力(記入) | 期待状態/合否(記入) |")
out.append("|---|---|---|---|---|---|---|---|")
for (biz,rn,ac),(kind,j,u) in sorted(rows.items()):
    out.append(f"| {biz} | R{rn} | {ac} | {kind} | {j}{('/'+u) if u else ''} |  |  |  |")
pathlib.Path("scenario_test/scenario/14_テスト手順詳細化依頼リスト.md").write_text("\n".join(out)+"\n",encoding="utf-8")
print("wrote 14_テスト手順詳細化依頼リスト.md:", len(rows), "工程")
print("種別内訳:", collections.Counter(v[0] for v in rows.values()))
