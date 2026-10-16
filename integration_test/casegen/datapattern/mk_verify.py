#!/usr/bin/env python3
"""監査の「抜け」を集め、codex への反証依頼を束で作る。 mk_verify.py <束の接頭字> <機能IDの正規表現> [束の件数=50]

監査が終わった機能から順に流せるよう、対象の機能を正規表現で選ぶ（束の接頭字は回ごとに変える。例 V: A・B・F・M01・M03、W: 残り）。
verify/<接頭字>_gaps.tsv         対象の機能の「抜け」（項目IDがそのまま指摘ID）
verify/<接頭字><nn>_prompt.md    1束およそ50件（機能を割らない）
"""
import csv, glob, pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
PFX, RX = sys.argv[1], re.compile(sys.argv[2])
SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 50
HDR = ["項目ID", "パターン", "定め", "根拠", "試すデータ", "結果", "確かめる所", "判定", "テストID", "理由"]
out = []
for p in sorted(glob.glob(str(P / "audit/*.tsv"))):
    if "_keylines" in p or not RX.fullmatch(pathlib.Path(p).stem):
        continue
    for l in pathlib.Path(p).read_text(encoding="utf-8").split("\n")[1:]:
        if not l.strip():
            continue
        r = dict(zip(HDR, l.split("\t")))
        if r["判定"] == "抜け":
            out.append(r)
(P / "verify").mkdir(exist_ok=True)
with open(P / f"verify/{PFX}_gaps.tsv", "w", encoding="utf-8", newline="") as f:
    f.write("\t".join(HDR) + "\n")
    for r in out:
        f.write("\t".join(r[k] for k in HDR) + "\n")
bundles, cur, last = [], [], None
for r in out:
    fid = r["項目ID"][3:9]
    if len(cur) >= SIZE and fid != last:
        bundles.append(cur); cur = []
    cur.append(r); last = fid
if cur:
    bundles.append(cur)
for i, b in enumerate(bundles, 1):
    fids = list(dict.fromkeys(x["項目ID"][3:9] for x in b))
    lst = "\n".join("\t".join(x[k] for k in ("項目ID", "パターン", "定め", "根拠", "試すデータ", "結果", "確かめる所", "理由")) for x in b)
    t = f"""# 反証依頼：データパターンの「抜け」指摘（束 {PFX}{i:02d}・{len(b)}件）

あなたはレビュアーである。別の担当が、機能ごとに設計書と結合テストケースを突き合わせ、
「設計書がデータの違い（数量1と複数、組合せ、有無、混在、状態・区分、端数、ちょうどの値、同じデータの重ね）で結果が変わると定めているのに、
そのデータで確かめるケースが無い（抜け）」と指摘した。
1件ずつ、**指摘を反証できないか**を自分でファイルを読んで確かめよ。ファイルは変更しない。スクリプトやコマンドは読むだけで実行しない（grep・cat 等の閲覧は可）。出力は日本語。

## 背景（依頼者決定 2026-10-15）

ケースは設計書の定め1件ごとに作られ、同じ定めをデータを変えて通す確認が無い（例: 注文後に在庫を確かめるケースはすべて1商品・数量3）。
依頼者は7種のデータパターンを全機能で網羅すると決めた。判定の単位は観点表 `integration_test/viewpoint_canonical/viewpoints_canonical.tsv` の IT-0356〜0363（判定単位の文と除外を読むこと）。

## 読むもの（/home/y-saito/Developments/hareruya-design-docs/ 配下）

| 何 | パス |
| --- | --- |
| 設計書（機能のシートを文字に起こしたもの。行頭 L0001 が行番号） | `integration_test/casegen/datapattern/units/<機能ID>/design.txt`（根拠が `_common/…` のものは `datapattern/units/_common/`） |
| 機能のケース・シード | `integration_test/casegen/cases/<機能ID>_test_cases.tsv`・`_seed_data.tsv` |
| テストから外したケース（保留＝正解なし、未確定＝作り方が決まらない） | `integration_test/casegen/datapattern/units/<機能ID>/excluded.tsv` |
| 全ケース（他機能のケースで確かめている場合の検索用） | `integration_test/casegen/all_test_cases.tsv` |
| 結合テストの範囲 | `integration_test/SCOPE.md` |
| 不機能仕様・フェーズ2見送り | `functions/dead-spec-register.tsv`・`functions/phase2_candidates.tsv` |

今回の機能: {", ".join(fids)}
`datapattern/audit/` と `datapattern/verify/` の他の束・*_out.txt は読まない。検索は grep を使う（rg は使わない）。

## 判定（1件につき1つ）

| 判定 | 意味 |
| --- | --- |
| 妥当 | 設計書がそのデータの違いで結果が変わると定め（または定めた処理から結果が一意に決まり）、結合テストの範囲で、そのデータで確かめるケースが全ケースを探しても無い |
| 確認済み | 事前準備・手順・期待結果を読むと、そのデータで操作して結果を確かめているケースがある（テストIDを挙げる。題が近いだけ・別の値で確かめているだけでは不可） |
| 除外済み | テストから外したケースが該当する（テストIDを挙げる） |
| 対象外 | 結合テストの担当でない（SCOPE.md: 単一ロジックの計算そのもの、同じ画面の中だけで完結する表示、e2e、性能）、観点表の除外に当たる（相関バリデーション、入力そのものの空・0件、文字数・桁数の境界、表示件数の上限、公開開始・販売終了ちょうど、状態遷移の許可・拒否、二重送信、失敗後の再実行、検索・削除条件の組合せ）、そのデータの違いで結果が変わらない、不機能仕様・フェーズ2。根拠を書く |
| 正解未定 | 期待結果が設計書から一意に決まらない（記述の矛盾・不足）。ケースにできない |
| 読み違い | 設計書にその定めが無い、または指摘が設計書を読み違えている（行番号の取り違えを含む） |

確信が持てないときは「妥当」にせず、分かったところまでを根拠に書いて最も近い判定を選ぶ。

## 指摘（タブ区切り: 項目ID / パターン / 定め / 根拠の行 / 試すデータ / 設計書から決まる結果 / 確かめる所 / 指摘の理由）

```
{lst}
```

## 出力形式

最終回答は、次のTSV（タブ区切り）をコードブロック1つで。全{len(b)}件を漏らさず、項目IDの順に。前置きや総括は書かない。

```
項目ID	判定	テストID	根拠
DP-F04-04-001	妥当		注文確定時の在庫減算（design.txt L0037）。全ケースを「数量1」「在庫」で検索したが数量1の注文で在庫を確かめるケースは無い
DP-F04-04-005	確認済み	IT-F04-04-020	事前準備で数量3を注文し、期待結果で在庫10→7を確かめている
```
"""
    (P / f"verify/{PFX}{i:02d}_prompt.md").write_text(t, encoding="utf-8")
print(len(out), "件", len(bundles), "束")
