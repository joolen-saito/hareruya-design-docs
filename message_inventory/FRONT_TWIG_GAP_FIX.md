# フロント twig 直描画メッセージの調査漏れ是正（2026-07-25）

## 背景（ユーザー指摘）
「フロント機能についてメッセージが少ない。調査漏れないか」。

## 原因（構造的抽出漏れ）
抽出器 `extract_messages.py` は **flash / Form制約 / JS(alert・confirm・data-*)** のみ走査し、
twig本文の `{{ 'front.x.error'|trans }}` による**直接描画メッセージ**を取りこぼしていた。
管理画面は flash 中心のため捕捉できていたが、**フロントは twig直描画が主流**のため大量に漏れていた。

## 実測
| 指標 | 件数 |
|---|---|
| フロントtwigの `\|trans` キー | 1,417 |
| うち値が文＝メッセージ性 | 約329 |
| 既収録・ラベル/本文を除いた新規メッセージ候補 | 287 |
| codex 判定 = message（運用メッセージ） | 98 |
| 　└ content(規約/プライバシー/SEO/案内本文) 除外 | 156 |
| 　└ label(見出し/ボタン/ナビ) 除外 | 18+ |

## パイプライン（捏造ゼロ）
1. `extract_front_twig_trans.py`: template/default/**.twig の `|trans` を決定的抽出（文言は yaml 逐語）。
2. `codex_front_twig_driver.py`: codex が message/content/label 判定＋F系機能割当＋種別/表示条件/後続処理を実ソースから確定。
3. `merge_front_twig_msgs.py`: message のみ正本へ統合（新ID採番、機能未確定は EE-FRONT）。
4. `codex_front_review_driver.py`: 追加行を批判的レビュー（fabrication/wrong_fid/not_message/wrong_meta）。
5. レビュー是正: **not_message 15件除外・wrong_fid 8件再割当・種別3件・表示条件5件**。en「欠落」指摘4件は
   レビュー用切詰め(70字)による偽陽性で、実en値は messages.en.yaml に逐語一致を確認。

## 結果
- フロントメッセージ: **23件 → 99件**（35機能に拡充。F06-01=15, F03-08=6, F05-05=6, F06-20=4 など）。
- 正本 `validate_messages.py`: 1399行 / 非在0 = PASS（全 ja/en が実ソース逐語）。
- `MESSAGE_LIST.tsv`(1142) / `MESSAGE_LIST.md`(機能170) に反映。

## 設計書への埋込（完了）
6. `embed_front_msgs_doc.py`: 新規73行を機能docの『表示メッセージ』表へ埋込（30機能）。
   - 正典フォーマット `メッセージID｜表示位置｜画面上の文言｜画面上の文言(英語)｜表示条件｜後続処理`
     に統一（既存 `append_doc_rows.py` は英語列が無い旧仕様で6列表を破壊するため専用化）。
   - 節に正典表があれば末尾追記／無ければ節末に新表／`## 表示メッセージ`節が無い4機能
     (f03-02, f06-05, f06-06, f06-08) は `## 業務ルール・計算` 直前に節新設。
   - 既存の手書き表・他フォーマット表は非改変。
7. 検証:
   - 埋込89行を正本TSVと逐語照合 → **不一致0**（どこに/文言/英訳/表示条件/後続すべて一致）。
   - 全30docの正典表 → **列数不整合0**（6列厳守）。
   - HTML再生成 `convert_function_spec_html.py` → 30doc 成功（fail 0）。
   - codex 批判レビュー（新設4節）→ **OK**（誤配置/捏造なし。yaml出典行も提示され逐語確認）。
