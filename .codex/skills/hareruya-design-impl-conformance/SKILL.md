---
name: hareruya-design-impl-conformance
description: Audit whether every requirement written in the Hareruya HTML design spec actually exists in the ec-cube-enterprise implementation, so unimplemented / mis-implemented spec items (e.g. a missing help-page link) are never silently dropped. Use when checking design-vs-implementation drift, hunting 未実装/実装違い, or when asked to make the drift audit lose no checks.
---

# Hareruya Design → Implementation Conformance Audit

## なぜ（背景）

HTML設計書に書かれた機能が**未実装**でも、従来は監査から静かに漏れていた。
`design_impl_drift_report/` は要求を抽出していたが、既存の確定所見にマッチしない要求を
**判定せず件数に数えるだけで捨てて**いた（実測: 抽出30,862要求のうち29,622が判定も表示もされず消失）。
本スキルはその穴を塞ぎ、**設計書の全要求に判定を付け（判定漏れ0）**、未実装/実装違いを指摘票にする。

## 判定漏れ0の不変条件（最重要）

`audit_harness.py` は抽出した**全要求**を次のいずれかへ必ず分類する:
- **実装済み** … 確定所見でカバー済み。
- **要確認** … 実装候補はある/機能入口はあるが要求粒度で未照合。
- **未実装候補** … 実装ソースに痕跡なし。特に *element-level*（リンク/ボタン/文言/画面遷移など利用者が直接見る要素）を優先。
- **対象外** … Ph2/設計上非実装（理由付き）。

`requirementConformanceAudit.coverageComplete == True` かつ `unverdictedCount == 0` を機械保証
（違反時は `build_requirement_conformance_audit` が RuntimeError で停止＝静かに続行しない）。
集計は `scope.requirementConformanceUnverdicted`（0必須）で監視。

## 二重の網羅ネット

1. **決定的ネット**（ハーネス）: 抽出した全要求を必ず判定。ヒューリスティック検索なので誤検知は許容し、候補キューを作る。
2. **LLMネット**（codex監査+codex反証）: codex が設計シートから material 要求を**独立再列挙**して抽出器の取りこぼしを補い、実コードを読んで **実装済/未実装/実装違い** 候補を抽出。別フェーズの codex 反証で誤検知を落とす。

両者が揃って初めて「設計書に在って実装に無い」が確実に指摘へ上がる。

## パイプライン

1. **ハーネス**（全要求を判定）:
   ```bash
   cd design_impl_drift_report && python3 audit_harness.py
   ```
   出力: `findings/<functionId>.json` の `requirementConformanceAudit`（`rows` 全件＋`materialGapRows`）。
2. **レポート**（未実装候補/要確認を可視化）:
   ```bash
   python3 build_report.py   # index.html に「個別要求 網羅監査（全要求の判定）」節と「判定漏れ(0必須)」カード
   ```
3. **codex監査+codex反証レビュー**（未実装/実装違いを確定・指摘票化）: `.codex/drift_conformance_audit.js` を Workflow 実行。
   - 既定対象は**フロント一式(f01〜f08, kind=front)**。`args` に `{functions:[…]}` を渡せば任意機能へ展開（全407へ段階展開）。
   - 出力: 指摘票 `conformance_findings/<functionId>.md`＋差分デルタ `conformance_findings/_deltas/<functionId>.json`。
4. **反映**（指摘を既存レポートへ統合）:
   ```bash
   python3 apply_conformance_findings.py --reaudit   # デルタを findings.json へ upsert し再 enrich
   python3 build_report.py                            # index.html へ反映
   ```

## 指摘票の様式

```
■フロント-<機能名>
【指摘カテゴリ】
　未実装            ← 実装違いなら「実装違い」
【指摘内容】
　（仕様）<設計書の要求文>
　<実装での欠落/差異>。確認お願いします。（設計根拠: <file#sheet:line> ／ 実装: <file:line または 不在>）
```

## オラクル独立性

- 判定の正は**HTML設計書**。実装の現挙動を仕様と取り違えない（実装違いは設計を正として指摘する）。
- セレクタ/根拠は file:line の実在のみ。取れなければ `要実機確認`（指摘には出さず summary に残す）。
- 弱いキーワード一致だけで未実装と断定しない。日本語要求はルート名/翻訳キー(messages.ja.yaml)/Twigブロック/FormType/JS へ翻案して探索する。

## 主要ファイル

- `design_impl_drift_report/audit_harness.py`
  - `build_requirement_conformance_audit` … 全要求判定（判定漏れ0）。`MATERIAL_REQUIREMENT_PATTERN` / `ELEMENT_LEVEL_REQUIREMENT_PATTERN` / `CONFORMANCE_VERDICT_BUCKET`。
  - `apply_requirement_trace_gate` から呼ばれる。集計は `main()` の `scope.requirementConformance*`。
- `design_impl_drift_report/build_report.py` … 「個別要求 網羅監査（全要求の判定）」節・サマリカード。
- `.codex/drift_conformance_audit.js` … codex監査+codex反証 網羅監査ワークフロー。
- `design_impl_drift_report/apply_conformance_findings.py` … デルタ→findings.json upsert。
