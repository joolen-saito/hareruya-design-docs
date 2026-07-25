# 管理画面 twig 直描画メッセージの調査漏れ是正

## 原因（フロントと同一の構造的漏れ）
既存 `extract_messages.py` は flash / Form制約 / JS(alert・confirm・data-*) のみ走査し、
twig本文の `{{ 'admin.x'|trans }}` 直接描画メッセージを取りこぼす。フロント同様、
管理画面にもこの描画で表示される運用メッセージ（削除不可通知・CSV取込エラー・検索0件・
確認モーダル等）が多数あり、未収録だった。

## 実測
| 指標 | 件数 |
|---|---|
| admin twig の `admin.*/common.*` trans キー | 2,313 |
| メッセージ性かつ正本未収録の候補 | 155 |
| codex 判定 = message | 74（content 56 / label 25 除外） |
| codexレビューで not_message として除外 | 11（静的ヘルプ/ツールチップ/空状態表示） |
| **正本へ確定収録（純増）** | **62**（M系割当 51 / EE-ADMIN 機能未確定 11） |

## パイプライン（捏造ゼロ・codexレビュー）
1. `extract_admin_twig_trans.py`: admin twig の `|trans` を決定的抽出（文言 yaml 逐語、正本既収録は除外）。
2. `codex_admin_twig_driver.py`: message/content/label 判定＋M系機能割当＋メタ確定。
3. `join_twig_verdicts.py` → `merge_twig_msgs.py`: message のみ正本へ統合（未確定は EE-ADMIN）。
4. `codex_twig_review_driver.py`（非切詰め）: 批判レビュー。**45指摘**を検出。
5. 是正: **not_message 11件削除**／`codex_admin_fix_driver.py` で **wrong_fid 20・wrong_meta 14（実30行）**を
   指摘根拠つきで再確定（例: shipping.twig系→M05-17、Customer/index→M08-01、ProductController→M03-01、
   Analysis/sales→M12-03。commented-out route 等は EE-ADMIN 据置）。

## 設計書反映
6. `renumber_msg_ids.py`: 是正で生じた欠番を M*/F* 全エリアで連番化（全参照同期）。
7. `generate_message_list.py`（新規・再現可能化）: 正本から `MESSAGE_LIST.tsv`(1193)/`MESSAGE_LIST.md`(178機能) を再生成。
8. `embed_front_msgs_doc.py --area-re 'M\d'`: M系51件を23設計書の『表示メッセージ』表へ埋込
   （正典6列表。7列変種表・手書き表は非改変。節が無い5機能は業務ルール節前に新設）＋HTML23件再生成。

## 検証（全数・決定的）
- 正本 `validate_messages.py`: 1461行 / 非在0 = PASS（全 ja/en 逐語）。
- 埋込1049行を正本と逐語照合 → **不一致0** ／ 正典表 列数不整合0 ／ md↔html ID集合 全23doc一致。
- `MESSAGE_LIST.tsv`(1193) = master∖EE-* と完全一致・M*/F*欠番0。
