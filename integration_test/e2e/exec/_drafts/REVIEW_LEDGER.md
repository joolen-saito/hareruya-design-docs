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
| B0 | m05-14_admin_order_order_status_change | 標準(破壊系) | 101 | 72/0/29 | R1要修正(Blocker2/Major)→R2閉＋BC-5引用行修正(93-95→108-113)当方 | **妥当（候補確定）** | codex_b0_m0514_output/…_r2_ |
| B0 | m05-15_admin_order_order_mail | 標準(メール送信) | 71 | 66/0/5（補完3） | R1要修正(Blocker+Major5)→R2閉＋送信SEED記述修正(ORDER→SENDABLE)当方 | **妥当（候補確定）** | codex_b0_m0515_output/…_r2_ |
| B0 | m05-17_admin_order_order_shipping_memo | 標準(破壊系) | 82 | 72/0/10（補完1） | R1要修正(Major4)→R2妥当 | **妥当（候補確定）** | codex_b0_m0517_output/…_r2_ |
| B0 | m09-02_admin_content_content_file | 標準(FS操作) | 111 | 93/0/18（読替bound5） | R1要修正(Major4=読替明記/BC要実機/vendor出典)→R2妥当 | **妥当（候補確定）** | codex_b0_m0902_output/…_r2_ |
| B0 | m09-05_admin_content_content_css | 標準(ファイル保存) | 59 | 56/0/3（読替bound4） | R1要修正(Blocker=fs.ts実行可能契約/Major2=L1-011行ずれ640-669/C-023誘発)→R2契約バグ2(removeCss ||true黙殺/親dir権限記録復元)→R3妥当 | **妥当（候補確定）** | codex_b0_m0905_output/…_r2_/…_r3_ |
| B0 | m09-03_admin_content_content_layout | 標準(破壊系・配置) | 88 | 62/0/4（読替16・partial6別掲） | R1要修正(Blocker2=C-032制御順序読違/S0全列復元・Major3=DOC断定/過大bind/読替別掲・Minor=FK断定)→R2妥当(機械集計62+16+6+4=88) | **妥当（候補確定）** | codex_b0_m0903_output/…_r2_ |
| B0 | m09-06_admin_content_content_js | 標準(ファイル保存) | 59 | 50/2/3（読替4・TBD=DOC別掲2） | R1要修正(Blocker=DOC-DRAFT-1をbound算入・Major=L1-002 HTTP200無条件断定)→R2妥当(機械集計50+4+2+3=59) | **妥当（候補確定）** | codex_b0_m0906_output/…_r2_ |
| B0 | m09-08_admin_content_content_cache | 標準(破壊系・キャッシュ削除) | 56 | 50/1/5（読替0） | R1要修正(Blocker=012/015救済先なき読替過剰→excluded・Major2=C-005 fresh分岐非決定/DOC-1片側断定)→R2実体3点閉(会計50+0+1+5=56・整合の旧値はヘッダ是正履歴＝m09-05先例と同じ意図的残置) | **妥当（候補確定）** | codex_b0_m0908_output/…_r2_ |
| B0 | m09-09_admin_content_content_maintenance | 標準(破壊系・.maintenance/env) | 56 | 45/1/7（TBD3・非env12+要実機33） | R1要修正(Blocker2=026/027/028逆極性bind/EX-D委譲先未実証・Major4=前面503過大/C-001引用/C-013捏造/§4行数)→R2(028分離/Cookie名)→R3会計重複除去→妥当。sonnet生成 | **妥当（候補確定）** | codex_b0_m0909_output/…_r2_/…_r3_ |
| B0 | m10-12_admin_base_setting_setting_shop_calendar | 標準(破壊系DB・相関バリ実在) | 87 | 70/0/17 | R1要修正(Blocker=更新側相関バリ過剰bound→BC-DRAFT-M1012-02〔編集時BaseInfo未渡し=重複チェック無効化疑い〕・Major3=§6虚偽/L1-003行/DB復元RLS)→R2(BC両論併記/日付範囲外トリガ/正式spec:353相互参照)→R3補完専用分類md↔JSON整合→妥当。sonnet生成 | **妥当（候補確定）** | codex_b0_m1012_output/…_r2_/…_r3_ |
| B0 | m10-14_admin_base_setting_setting_shop_mall_shop_list | 標準(破壊系・論理削除/モール) | 86 | 71/0/14（BC別管理1・読替14） | R1要修正(Blocker3=-054 bound根拠なし/-031 10桁SEED不成立/L1-004引用捏造・Major2=S0非実行可能/BC-01断定)→R2(L1全数照合で更に行ずれ3+4検出是正)→R3残L1-009対照行/C-019断定を当方是正→妥当。sonnet生成・エージェント停止分を当方完遂 | **妥当（候補確定）** | codex_b0_m1014_output/…_r2_/…_r3_ |
| B0 | m11-06_admin_system_setting_setting_system_system_info | 標準(読取系・動的値) | 61 | 35/1/25（読替6） | R1要修正(Blocker=C-017全テーブル無書込過剰・Major5=DOC断定/L1-001根拠/L1-018実行保証/SERVER_SOFTWARE非対称/C-016・Minor2)→R2全7点閉(期待を観測事実に縮小・SERVER_SOFTWARE分離L1-026新設) | **妥当（候補確定）** | codex_b0_m1106_output/…_r2_ |
| B0 | m11-04_admin_system_setting_setting_system_login_history | 標準(読取系・検索/ページング) | 87 | 56/2/29（読替018-035） | R1要修正(Blocker=DOC-DRAFTテンプレノイズ断定・Major=全経路無書込・引用ずれ5件)→R2(DOC未解決化/観測範囲限定/L1-026/003/017/027/029)→R2残(§10取残し/L1-008保存範囲/L1-009緩い比較==)→R3妥当 | **妥当（候補確定）** | codex_b0_m1104_output/…_r2_/…_r3_ |

## 判定の意味（三段会計での位置）
- 「妥当（候補確定）」＝**候補グレードとして採用可**（D6前・O5未確定）。**承認済み草案への昇格・正式化はM0機械（D5/D6/D14/lineage_gate）完成後**（`CONCRETIZATION_FIRST_PLAN.md`）。
- ＝現時点で「codex承認済み**候補**」は**27本**（W0-W2の4＋B0の23）。B0内訳: M01系2・M02系6・M05系5・M09系6・M10系2・M11系2（m11-04/m11-06）＝完了23。「承認済み草案」「具体化完了（正式）」は0本（M0前のため）。※B0全体は標準残25が対象・進行中（23/25完了=92%・M05系5/5・M09系6/6・M10系2/2・M11系2/3）。残: m11-05（生成中）/f06-19。
- ※読取系（m11-06/m11-04）でsonnet生成が繰り返した過剰主張パターン=「DB操作節のテンプレノイズ断定」「Controller単体grepで全経路無書込」「動的値のテスト側一致主張」「実行時フォールバック保証」。codexが毎回検出→是正で「期待を観測できる有限の事実に限定」へ収束。次の読取/表示系にはこの4点を予防注入する。
- ※fable5が利用上限に到達（2026-07-24）。以降の著者エージェントはsonnetに切替（レビューは引き続きcodex単独=規約）。sonnet生成分はfable比で実体指摘が増える傾向（m09-09で逆極性bind/委譲先未実証/引用捏造をcodexが検出）＝codex敵対レビューが品質関門として機能。

## 各候補ファイル冒頭ヘッダの更新規約
各 `*_executable_draft.md` の冒頭に、本台帳の最終判定行（回次・判定）を反映する。改訂で会計が変わった場合は本台帳の会計列も同時更新する（md ⇔ 台帳の同期）。

## 品質規律（W0-W2でcodexが確立・全機能展開の受入基準）
1. bindは母集合の**観点ラベルでなく期待テキスト**で判定（極性も期待テキストで）。
2. 文書は**自己完結**（参照候補を本文§4に全載）。
3. excluded/TBDは各母集合test_idを**実引き**で正当化（過剰生成除外も一次資料根拠必須・**偽陰性禁止**）。
4. func_scope_check（機能スコープ自己検査・正式O6でない）差分0。
5. 候補規律（O5非主張・source_class暫定・@TBD-D5・_drafts隔離）。
6. カスタマイズはee実ソースをL1出典にしない（照合補助のみ）。Excel空欄制約はpf現行回帰の踏襲値でbound（ユーザー方針A）。
