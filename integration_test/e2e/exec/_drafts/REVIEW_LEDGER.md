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
| B0 | m01-02_admin_login_two_factor_auth | 標準 | 81 | 56/0/25（補完7） | R1要修正(Major1=既知500行C-040欠落)→R2妥当 | **妥当（候補確定）** | codex_b0_m0102_output/…_r2_… |
| B0 | m01-01_admin_login_login | 標準 | 59 | 58/1/0（補完6） | R1要修正(Major2=IT-049過剰bound/BC波及)→R2妥当 | **妥当（候補確定）** | codex_b0_m0101_output/…_r2_… |
| B0 | m02-01_admin_home_home_order_status | 標準 | 80 | 55/0/25（補完1） | R1要修正(Blocker1=L1-017過大/Major3)→R2妥当 | **妥当（候補確定）** | codex_b0_m0201_output/…_r2_… |
| B0 | m02-02_admin_home_home_sales_status | 標準 | 59 | 38/1/20（補完5） | R1要修正(Blocker2=read-only根拠/マスタ観測)→R2妥当 | **妥当（候補確定）** | codex_b0_m0202_output/…_r2_… |
| B0 | m02-03_admin_home_home_sales_chart | 標準 | 59 | 38/1/20（補完6） | R1要修正(Blocker=now時点)→R2未閉→R3論理閉＋JSON文言当方修正 | **妥当（候補確定）** | codex_b0_m0203_output/…_r2_/…_r3_ |
| B0 | m02-04_admin_home_home_shop_status | 標準 | 81 | 57/1/23（補完3） | R1要修正(Major)→R2未閉→R3妥当 | **妥当（候補確定）** | codex_b0_m0204_output/…_r3_ |
| B0 | m02-05_admin_home_home_ec_cube_news | 標準(外部連携) | 35 | 27/0/8（補完2・成分分離bind3） | R1要修正(Major=EX-Cアプリ成分)→R2妥当 | **妥当（候補確定）** | codex_b0_m0205_output/…_r2_ |
| B0 | m02-06_admin_home_home_recommend_plugins | 標準(外部連携) | 68 | 54/0/14（補完5） | R1要修正(Blocker+Major2)→R2閉＋行数修正(31→32)当方 | **妥当（候補確定）** | codex_b0_m0206_output/…_r2_ |
| B0 | m05-12_admin_order_order_bulk_status_change | 標準(破壊系) | 90 | 61/0/29（補完1・削除GUI17→26行BC印） | R1要修正(Blocker=遷移マトリクス/Major2)→R2妥当 | **妥当（候補確定）** | codex_b0_m0512_output/…_r2_ |
| B0 | m05-13_admin_order_order_tracking_number | 標準(破壊系) | 89 | 68/0/21（補完1・033同時更新bound化） | R1要修正(Blocker=033偽陰性/Major3)→R2妥当 | **妥当（候補確定）** | codex_b0_m0513_output/…_r2_ |

## 判定の意味（三段会計での位置）
- 「妥当（候補確定）」＝**候補グレードとして採用可**（D6前・O5未確定）。**承認済み草案への昇格・正式化はM0機械（D5/D6/D14/lineage_gate）完成後**（`CONCRETIZATION_FIRST_PLAN.md`）。
- ＝現時点で「codex承認済み**候補**」は**14本**（W0-W2の4＋B0の10）。B0内訳: m01-01/m01-02/m02-01/m02-02/m02-03/m02-04/m02-05/m02-06（M01系2・M02系6＝完了）。「承認済み草案」「具体化完了（正式）」は0本（M0前のため）。※B0全体は標準残25が対象・進行中（10/25完了=40%・M05系2/5）。

## 各候補ファイル冒頭ヘッダの更新規約
各 `*_executable_draft.md` の冒頭に、本台帳の最終判定行（回次・判定）を反映する。改訂で会計が変わった場合は本台帳の会計列も同時更新する（md ⇔ 台帳の同期）。

## 品質規律（W0-W2でcodexが確立・全機能展開の受入基準）
1. bindは母集合の**観点ラベルでなく期待テキスト**で判定（極性も期待テキストで）。
2. 文書は**自己完結**（参照候補を本文§4に全載）。
3. excluded/TBDは各母集合test_idを**実引き**で正当化（過剰生成除外も一次資料根拠必須・**偽陰性禁止**）。
4. func_scope_check（機能スコープ自己検査・正式O6でない）差分0。
5. 候補規律（O5非主張・source_class暫定・@TBD-D5・_drafts隔離）。
6. カスタマイズはee実ソースをL1出典にしない（照合補助のみ）。Excel空欄制約はpf現行回帰の踏襲値でbound（ユーザー方針A）。
