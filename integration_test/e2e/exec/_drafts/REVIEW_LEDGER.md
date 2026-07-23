# 具体化先行 候補（_drafts/）codexレビュー台帳

> 各機能候補のcodex敵対レビュー回次・指摘・是正・最終判定の記録（監査証跡）。
> 状態は「候補（candidate・D6前）」＝O5合格/承認済み草案/正式化/O6/聖域は未主張（三段会計）。
> レビューはcodex単独（プロジェクト規約）。レビュー全文は scratchpad の各 `codex_*_output.txt`。

| # | fid | 区分 | 母集合 | 会計(bound/TBD/excluded) | codexレビュー回次 | 最終判定 | レビュー全文 |
|---|---|---|---|---|---|---|---|
| W0 | m09-01_admin_content_content_news | 標準 | 88 | 62/2/24（補完18） | R1要修正(Blocker3)→R2部分→R3妥当 | **妥当（候補確定）** | codex_w0_review_output/…_r2_…/…_r3_… |
| W1 | m05-16_admin_order_order_shop_memo | 標準 | 59 | 52/1/6（補完1） | R1要修正(Major2)→R2妥当 | **妥当（候補確定）** | codex_w1_m0516_output/…_r2_… |
| W1 | m10-11_admin_base_setting_setting_shop_order_status | 標準 | 81 | 49/0/32（補完7） | R1要修正(Major4)→R2 6件閉＋数字修正(41→42) | **妥当（候補確定）** | codex_w1_m1011_output/…_r2_… |
| W2 | m03-11_admin_product_product_category_register_edit | カスタマイズ(excel-primary) | 78 | 59/1/18（補完10） | R1要修正(Blocker2)＋方針裁定(A)→R2妥当 | **妥当（候補確定）** | codex_w2_m0311_output/…_r2_… |

## 判定の意味（三段会計での位置）
- 「妥当（候補確定）」＝**候補グレードとして採用可**（D6前・O5未確定）。**承認済み草案への昇格・正式化はM0機械（D5/D6/D14/lineage_gate）完成後**（`CONCRETIZATION_FIRST_PLAN.md`）。
- ＝現時点で「codex承認済み**候補**」は4本。「承認済み草案」「具体化完了（正式）」は0本（M0前のため）。

## 各候補ファイル冒頭ヘッダの更新規約
各 `*_executable_draft.md` の冒頭に、本台帳の最終判定行（回次・判定）を反映する。改訂で会計が変わった場合は本台帳の会計列も同時更新する（md ⇔ 台帳の同期）。

## 品質規律（W0-W2でcodexが確立・全機能展開の受入基準）
1. bindは母集合の**観点ラベルでなく期待テキスト**で判定（極性も期待テキストで）。
2. 文書は**自己完結**（参照候補を本文§4に全載）。
3. excluded/TBDは各母集合test_idを**実引き**で正当化（過剰生成除外も一次資料根拠必須・**偽陰性禁止**）。
4. func_scope_check（機能スコープ自己検査・正式O6でない）差分0。
5. 候補規律（O5非主張・source_class暫定・@TBD-D5・_drafts隔離）。
6. カスタマイズはee実ソースをL1出典にしない（照合補助のみ）。Excel空欄制約はpf現行回帰の踏襲値でbound（ユーザー方針A）。
