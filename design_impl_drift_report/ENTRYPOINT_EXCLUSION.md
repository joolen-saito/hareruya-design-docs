# 「利用者視点の入口」指摘の除外

`利用者視点の入口` と明記された指摘を除外リストへ移した。
URLパス・ルート名・HTTPメソッド・コンソールコマンド名といった
「その機能にどう辿り着くか」の契約不一致で、実装の挙動そのものへの指摘ではない。

| | 件数 | codex工数 |
|---|---:|---:|
| 抽出（1034件中） | 22 | 15.65人日 |
| うち重複除外で既に落ちている行 | 2 | — |
| **今回の除外** | **20** | **14.40人日** |

- 除外リスト: `drift_findings_excluded_entrypoint.tsv`（20件）
- 残りリストの組み立ては `build_remaining_list.py`（`EXCLUSION_SUMMARY.md`）。
- 抽出22件のトリアージ区分: 要修正-移植漏れ(設計書追記も要) 22件。優先度: P3 16件 / P4 6件。

## 対象

| drift行 | 機能No | 機能名 | 優先度 | 工数 | 入口の内容 |
|---:|---|---|---|---:|---|
| 73 | A06-04 | A06-04 店頭買取情報コメント更新 | P3 | 0.25 | 店頭買取受注のコメント更新は拡張子なし別名 PUT /admin/otcBuyOrder/{id}/freeComment でも、拡張子あり |
| 77 | A06-05 | A06-05 店頭買取情報ステータス更新 | P3 | 0.25 | 利用者視点の入口として、PUT /admin/otcBuyOrder/{id}/status の拡張子なし別名も /status.json  |
| 182 | B05-03 | B05-03 店頭注文番号初期化 | P3 | 0.75 | コンソールのバッチコマンド `order:batch truncateWaitingNumber` で店頭注文番号初期化を実行し、コマンド名 |
| 186 | B05-05 | B05-05 スマレジ商品削除 | P3 | 0.75 | コンソールのバッチコマンドは order:batch deleteSmaregiProduct で実行し、手続きが完了した店頭注文をスマレジ |
| 189 | B05-06 | B05-06 ポイント二重登録チェック | P3 | 0.75 | コンソールのバッチコマンドは `order:batch checkDuplicatePoint` として実行する。 |
| 191 | B05-07 | B05-07 ポイント利用未反映チェック | P3 | 0.75 | コンソールのバッチコマンドは `order:batch checkNotReflectedPointUsage` でポイント利用未反映チェッ |
| 197 | B05-09 | B05-09 スマレジ取引連携エラー再連携 | P3 | 3.0 | スマレジ取引連携エラー再連携は、コンソールのバッチコマンド `smaregi:batch checkSmaregiTransaction`  |
| 213 | B08-03 | B08-03 ポイント有効期限通知 | P3 | 0.75 | コンソールのバッチコマンドは `customer:batch pointExpireNotification` として実行でき、コマンド名が |
| 306 | F06-12 | F06-12 買取履歴詳細 | P3 | 1.25 | 買取履歴詳細は GET /{_locale}/mypage/purchase_history/detail/{id}、「承諾確定」ボタン押下 |
| 375 | M03-09 | M03-09 商品規格登録編集 | P4 | 0.75 | 利用者視点の入口 URL は、規格一覧 /{admin_route}/product/product/{id}/class/list、新規  |
| 386 | M03-16 | M03-16 略称タグCSVアップロード | P3 | 0.15 | 略称タグ管理の「CSV入力」は GET /{admin_route}/product/storage_code/import でCSV取込フ |
| 629 | M08-02 | M08-02 メール一括送信 | P3 | 0.5 | 確認画面・送信実行・完了画面はそれぞれ POST /{admin_route}/customer/mail_confirm、POST /{a |
| 680 | M08-12 | M08-12 顧客グループ管理 | P3 | 1.0 | 利用者視点の入口は、GET /{admin_route}/customer_group/{id}、POST /{admin_route}/c |
| 832 | M13-04 | M13-04 繰返日程追加 | P3 | 0.5 | 利用者視点の入口は、GET /{admin_route}/event/repeatschedule/{eventId}/new で入力フォー |
| 864 | M13-12 | M13-12 イベント新規申込登録 | P3 | 0.75 | 利用者視点の入口は、登録先選択 GET /%eccube_admin_route%/entry/select、新規申込入力 GET /%ec |
| 890 | M13-14 | M13-14 バナー設定 | P4 | 0.5 | 利用者視点の入口は GET /{admin_route}/banner/event、GET /{admin_route}/banner/ev |
| 1012 | M16-02 | M16-02 画像設定 | P3 | 0.5 | 利用者視点の入口は GET/POST /{admin_route}/banner/top、店舗絞り込みは /{admin_route}/ba |
| 1019 | M16-06 | M16-06 買取価格対応表(一覧) | P4 | 0.5 | 利用者視点の入口は、一覧が GET /{admin_route}/buy_price_list、一覧の金額セルが GET /{admin_r |
| 1024 | M16-07 | M16-07 買取価格対応表(編集) | P4 | 0.5 | 利用者視点の入口は GET /{admin_route}/buy_price_list/{id} と POST /{admin_route} |
| 1028 | M16-08 | M16-08 買取減額率一覧 | P4 | 0.25 | 利用者視点の入口およびHTTPルートは、ナビまたは直接GETで `GET /{admin_route}/buy_discount` に到達し |

## 注意（重複除外との関係）

次の行は重複クラスタの代表として残していたものなので、クラスタごと消える。

| 代表行 | 同時に消えるクラスタ内の行 |
|---:|---|
| 386 | 387 |
| 629 | 631, 633 |

次の行は既に重複除外済みで、統合先の行が残っている。
統合先は同じ入口契約の指摘だが本文に『利用者視点の入口』の語が無く、
今回の抽出条件（語の明記）では拾えていない。**扱いの判断が要る。**

| 入口として抽出された行 | 統合先として残っている行 |
|---:|---:|
| 799（除外済み） | **802（残っている）** |
| 881（除外済み） | **871（残っている）** |

