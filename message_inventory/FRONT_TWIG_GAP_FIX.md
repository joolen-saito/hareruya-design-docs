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
- 残: 各フロント設計書『表示メッセージ』表への行埋込＋HTML再生成（次段）。
