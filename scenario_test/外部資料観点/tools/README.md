# 観点の体系の作り方と再生成の手順

`scenario_test/シナリオテスト観点.md` の第1部（観点の体系）は、このフォルダの `観点体系.md` を取り込んだもの。`観点体系.md` は `tools/spec.py`（観点の定義）と `candidates/*.tsv`（抽出した根拠行）から `tools/build.py` で生成する。第2部（作成済みテスト項目の観点）は `scenario_test/tools/audit_scenario_delivery.py` が集計し、`label_map.tsv` で第1部の観点に対応づける。

観点を直すときは spec.py を直して再生成する。Markdown を手で直さない。

## 再生成

```bash
python3 -I scenario_test/外部資料観点/tools/build.py scenario_test/外部資料観点/candidates scenario_test/外部資料観点
python3 scenario_test/tools/audit_scenario_delivery.py
```

1 本目で `観点体系.md`・`evidence.tsv`・`label_map.tsv` を作り、2 本目で `シナリオテスト観点.md` を作る。2 本目は他の生成物（`coverage/delivery_summary.json` など）も書き直す。
テスト項目に新しいテスト観点のラベルが増えたら、spec.py の `LABEL_MAP` に対応を足す。足していないと 2 本目が止まる。

## 構成

| パス | 中身 |
| --- | --- |
| `観点体系.md` | 第1部の本文（生成物） |
| `evidence.tsv` | 観点ごとの原文抜粋（生成物） |
| `label_map.tsv` | テスト項目の「テスト観点」ラベルと第1部の観点の対応（生成物） |
| `candidates/A〜H_*.tsv` | 資料ごとに抜き出した観点候補と除外候補（理由付き） |
| `candidates/X_images.tsv` | 画像だけの表を目視で書き起こした根拠行 |
| `candidates/Z_author.tsv` | 著者がレビュー対応・統合で追加した根拠行（Z11 はプロジェクト内資料） |
| `tools/spec.py` | 観点の定義と `LABEL_MAP`（正本）。refs は candidates の行ID（A12 = A_youken.tsv の 12 行目のデータ） |
| `tools/build.py` | spec.py と candidates から生成物を作る。存在しない行・除外候補・未定義の観点を参照すると止まる。`--refcheck` で観点と根拠の対照表 `_refcheck.txt` も出す |
| `tools/fragment_template.md` | `観点体系.md` の枠 |
| `tools/status.md`, `tools/review.md` | 第1部の状態とレビュー記録 |
| `tools/verify_quotes.py` | 候補の原文抜粋が、抽出テキストの指定ページに実在するかを照合する |
| `tools/pdf2txt.py`, `tools/pdf2txt_cid.py` | PDF をページ番号付きテキストにする。CID 版は ToUnicode の無い Adobe-Japan1 フォントを復号する（教訓集用） |
| `tools/render.py`, `tools/render_clip.py` | 画像だけの表を PNG に描き出す |
| `tools/extract_brief.md` | 候補を抜き出したときの共通指示 |
| `transcriptions/` | 画像だけの表の書き起こし |
| `review/` | codex レビューの依頼文と指摘 |

## 原文テキスト

資料の PDF と抽出テキストはリポジトリに入れていない（著作物で容量も大きい）。照合し直すときは、`シナリオテスト観点.md` の「6. 出典一覧」の URL から PDF を取得し、`pdf2txt.py`（教訓集は `pdf2txt_cid.py` と Adobe の `UniJIS-UTF32-H`）でテキスト化してから `verify_quotes.py <テキストのディレクトリ> candidates/*.tsv` を流す。
教訓集の個別教訓は https://www.ipa.go.jp/archive/digital/iot-en-ci/system/lesson.html の各 PDF、非機能要求グレードは ZIP 内の 01・03・04・05 の PDF を使った。Z11 の照合には、`scenario_test/システムテストの目的と完了基準.md` の先頭に `=====PAGE 1=====` を付けたテキストを `mokuteki_kanryo.txt` として置く。
