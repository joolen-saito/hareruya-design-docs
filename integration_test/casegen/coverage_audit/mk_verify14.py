#!/usr/bin/env python3
"""1巡目の「抜け」「一部抜け」に指摘IDを振り、codex への反証依頼を束で作る。 mk_verify.py

findings14.tsv          ケースを作った14機能の単位を、合流後に監査し直した分の指摘（指摘ID は H）
verify/V<nn>_prompt.md  1束およそ60件（単位を割らない）
"""
import csv, pathlib
A = pathlib.Path(__file__).resolve().parent
SKIP = {f"0309_f09-0{i}" for i in range(1, 9)} | {"0515_a15-02", "0515_a15-03", "0515_a15-04", "0515_a15-08", "0515_a15-12", "0417_b17-01"}
rows = list(csv.reader(open(A / "gaps.tsv", encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))[1:]
out, n = [], 0
for r in rows:
    u = f"{r[0]}_{r[1]}"
    if u not in SKIP:
        continue
    n += 1
    out.append([f"H{n:04d}", u] + r[2:])
with open(A / "findings14.tsv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
    w.writerow(["指摘ID", "単位", "シート名", "機能", "行", "記述", "判定", "テストID", "理由"]); w.writerows(out)
bundles, cur, last = [], [], None
for r in out:
    if len(cur) >= 60 and r[1] != last:
        bundles.append(cur); cur = []
    cur.append(r); last = r[1]
if cur:
    bundles.append(cur)
for i, b in enumerate(bundles, 1):
    units = list(dict.fromkeys(x[1] for x in b))
    lst = "\n".join("\t".join([x[0], x[1], x[3] or "なし", x[4], x[6], x[7], x[5], x[8]]) for x in b)
    t = f"""# 反証依頼：結合テストケースの「抜け」指摘（束 W{i:02d}・{len(b)}件）

あなたはレビュアーである。別の担当が「HTML設計書のこの記述を確かめる結合テストケースが無い（抜け）／一部しか確かめていない（一部抜け）」と指摘した。
1件ずつ、**指摘を反証できないか**を自分でファイルを読んで確かめよ。ファイルは変更しない。スクリプトやコマンドは読むだけで実行しない（grep・cat 等の閲覧は可）。出力は日本語。

## 読むもの（/home/y-saito/Developments/hareruya-design-docs/ 配下）

| 何 | パス |
| --- | --- |
| 設計書（シートを文字に起こしたもの。行頭 L0001 が行番号） | `integration_test/casegen/coverage_audit/units/<単位>/sheet.txt` |
| その単位に対応する機能のケース（実行区分=保留除外 は正解が無くテストから外したケース） | `integration_test/casegen/coverage_audit/units/<単位>/cases.tsv` |
| 全ケース（他機能のケースで確かめている場合の検索用） | `integration_test/casegen/all_test_cases.tsv` |
| 保留で除外したケース | `integration_test/casegen/excluded_hold_cases.tsv` |
| 結合テストの範囲 | `integration_test/SCOPE.md` |

今回の単位: {", ".join(units)}
`coverage_audit/` の他のファイル（judgement.tsv、verify/ の他の束、*_out.txt）は読まない。

## 判定（1件につき1つ）

| 判定 | 意味 |
| --- | --- |
| 妥当 | 設計書にその定めがあり、結合テストの範囲で、確かめるケースが全ケースを探しても無い |
| 確認済み | 手順と期待結果を読むと、その定めを実際に確かめているケースがある（テストIDを挙げる。題が近いだけでは不可） |
| 保留除外済み | 保留で除外したケースが該当する（テストIDを挙げる） |
| 対象外 | SCOPE.md の基準で結合テストの担当でない（単体・e2e・性能、文言の逐語照合、レイアウト）。または設計書自身が廃止・フェーズ2・Ph1では実装しないとしている。根拠を書く |
| 正解未定 | 定めはあるが、期待結果が設計書から一意に決まらない（記述の矛盾・不足）。ケースにできない |
| 読み違い | 設計書にその定めが無い、または指摘が設計書を読み違えている |

確信が持てないときは「妥当」にせず、分かったところまでを根拠に書いて最も近い判定を選ぶ。

## 指摘（タブ区切り: 指摘ID / 単位 / 機能 / 行 / 1巡目の判定 / 1巡目が挙げたテストID / 設計書の記述の要約 / 指摘の理由）

```
{lst}
```

## 出力形式

最終回答は、次のTSV（タブ区切り）をコードブロック1つで。全{len(b)}件を漏らさず、指摘IDの順に。前置きや総括は書かない。

```
指摘ID	判定	テストID	根拠
H0001	確認済み	IT-M05-01-012	手順2で開始日＞終了日を入力し、期待結果が検索拒否
H0002	妥当		全ケースを「〜」で検索したが該当なし
```
"""
    (A / f"verify/W{i:02d}_prompt.md").write_text(t, encoding="utf-8")
print(len(out), "件", len(bundles), "束")
