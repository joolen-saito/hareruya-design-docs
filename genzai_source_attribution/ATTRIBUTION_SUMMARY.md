# Stage 0: 現行踏襲・カスタマイズ機能の参照元帰属台帳

対象 **317 機能**（現行踏襲・カスタマイズ）。抽出アンカー 3174 種を 7 リポジトリで literal 検索した結果。

参照元は現行ソース。`ec-cube-enterprise` は構築中の新実装なので**帰属先には選ばない**。列 `ee固有` は「現行ソースのどこにも無く新実装にだけ在る」アンカーの重み和で、既存設計書が新実装を見て書かれていないかの検出用。

## 判定内訳

| 判定 | 件数 |
|---|---|
| 確定 | 166 |
| 要判定 | 114 |
| 根拠なし(TBD) | 37 |

## 参照元別

| 参照元 | 役割 | 件数 |
|---|---|---|
| pf-eccube3 | 本店 | 179 |
| pf-eccube3／ec-cube | 本店／支店 | 39 |
| ec-cube／pf-eccube3 | 支店／本店 | 23 |
| pf-api | API | 14 |
| ec-cube | 支店 | 12 |
| deck-api／pf-api | デッキAPI／API | 7 |
| pf-api／pf-eccube3 | API／本店 | 7 |
| pf-api／pf-article | API／記事(WordPress) | 7 |
| deck-api／pf-api／pf-eccube3 | デッキAPI／API／本店 | 6 |
| deck-api | デッキAPI | 5 |
| deck-api／deck-builder | デッキAPI／デッキビルダー画面 | 5 |
| ec-cube／pf-api | 支店／API | 2 |
| pf-api／pf-eccube3／deck-api | API／本店／デッキAPI | 2 |
| deck-api／deck-builder／pf-eccube3 | デッキAPI／デッキビルダー画面／本店 | 2 |
| deck-api／ec-cube／pf-api／pf-eccube3 | デッキAPI／支店／API／本店 | 2 |
| pf-eccube3／deck-api／pf-api | 本店／デッキAPI／API | 1 |
| pf-api／pf-eccube3／deck-builder | API／本店／デッキビルダー画面 | 1 |
| deck-api／pf-api／pf-article／pf-eccube3 | デッキAPI／API／記事(WordPress)／本店 | 1 |
| deck-api／pf-eccube3 | デッキAPI／本店 | 1 |
| ec-cube／pf-article／pf-eccube3 | 支店／記事(WordPress)／本店 | 1 |

## 要判定・根拠なし（151 件）

これらは推測で埋めない。Stage 1 に進める前に人手で参照元を確定させる。

| 機能No | 機能名 | 判定 | 参照元候補 | 根拠 |
|---|---|---|---|---|
| A02-05 | 更新商品規格取得 | 要判定 | ec-cube | ec-cube=7.5 次点=1.5（事前候補 pf-api／pf-article と不一致） |
| A05-01 | 注文印刷_印刷情報をプリンタへ送信 | 要判定 | ec-cube／pf-api | ec-cube=18.5 次点=18.5（複数リポジトリで拮抗） |
| A05-02 | 注文印刷_該当受注のステータスを印刷済みに変更 | 要判定 | ec-cube／pf-api | ec-cube=18.5 次点=18.5（複数リポジトリで拮抗） |
| A05-03 | 店頭注文番号取得 | 要判定 | pf-eccube3 | pf-eccube3=9.0 次点=0.0（事前候補 pf-api／pf-article と不一致） |
| A05-04 | スマレジ受信処理 | 要判定 | ec-cube／pf-eccube3 | ec-cube=6.0 次点=6.0（複数リポジトリで拮抗） |
| A06-01 | 買取アプリ用ログイン | 要判定 | pf-eccube3／deck-api／pf-api | pf-eccube3=9.0 次点=5.5 ee固有=4.0（複数リポジトリで拮抗） |
| A06-02 | 店頭買取受注一覧取得 | 要判定 | deck-api／pf-api | deck-api=6.5 次点=6.5（複数リポジトリで拮抗） |
| A06-03 | 店頭買取受注詳細更新 | 要判定 | pf-api／pf-eccube3／deck-api | pf-api=9.5 次点=8.5 ee固有=4.0（複数リポジトリで拮抗） |
| A06-04 | 店頭買取受注コメント更新 | 要判定 | deck-api／pf-api | deck-api=6.0 次点=6.0（複数リポジトリで拮抗） |
| A06-05 | 店頭買取受注ステータス更新 | 要判定 | deck-api／pf-api／pf-eccube3 | deck-api=6.5 次点=6.5 ee固有=4.0（複数リポジトリで拮抗） |
| A06-06 | カード詳細IDから買取用商品情報を取得 | 要判定 | pf-api／pf-eccube3／deck-builder | pf-api=9.0 次点=6.0（複数リポジトリで拮抗） |
| A06-07 | 商品IDリストから買取用商品情報を取得 | 要判定 | pf-api／pf-eccube3 | pf-api=9.0 次点=5.0（複数リポジトリで拮抗） |
| A06-08 | カード名から買取用商品情報を取得 | 要判定 | pf-eccube3 | pf-eccube3=5.8 次点=1.8（事前候補 pf-api／pf-article と不一致） |
| A06-09 | 商品名から商品詳細の情報を取得 | 要判定 | pf-api／pf-eccube3 | pf-api=4.5 次点=4.5（複数リポジトリで拮抗） |
| A06-11 | 部門一覧を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A06-12 | 固定価格部門を部門情報を取得 | 要判定 | pf-api／pf-eccube3 | pf-api=1.5 次点=1.5（複数リポジトリで拮抗） |
| A06-13 | 本人確認更新 | 要判定 | deck-api／pf-api／pf-eccube3 | deck-api=8.0 次点=8.0 ee固有=2.0（複数リポジトリで拮抗） |
| A07-05 | ネット買取注文の査定終了処理 | 要判定 | pf-api／pf-eccube3 | pf-api=18.4 次点=9.9 ee固有=2.0（複数リポジトリで拮抗） |
| A07-06 | 複数ネット買取IDからネット買取受注の商品一覧を取得 | 要判定 | pf-eccube3 | pf-eccube3=33.5 次点=12.0（事前候補 pf-api／pf-article と不一致） |
| A08-01 | トップバナーIDのトップバナー情報を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A08-02 | 指定言語の設定済みトップバナー一覧を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A14-02 | カード詳細IDからカード詳細情報を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A14-03 | 検索クエリに一致するカード情報1件を取得 | 要判定 | deck-api／pf-api／pf-article／pf-eccube3 | deck-api=0.5 次点=0.5（複数リポジトリで拮抗） |
| A15-03 | ユーザー情報参照 | 要判定 | deck-api／pf-api | deck-api=3.67 次点=2.0（複数リポジトリで拮抗） |
| A15-04 | 他ユーザー情報参照 | 要判定 | deck-api／pf-api | deck-api=3.67 次点=2.0（複数リポジトリで拮抗） |
| A15-05 | ユーザー情報変更 | 要判定 | deck-api／pf-api | deck-api=2.67 次点=2.0（複数リポジトリで拮抗） |
| A15-06 | マスタ検索 | 要判定 | deck-api／pf-api／pf-eccube3 | deck-api=11.67 次点=11.67（複数リポジトリで拮抗） |
| A15-08 | カード検索 | 要判定 | deck-api／deck-builder | deck-api=6.13 次点=4.13（複数リポジトリで拮抗） |
| A15-09 | デッキ情報登録 | 要判定 | deck-api／deck-builder | deck-api=9.1 次点=7.1（複数リポジトリで拮抗） |
| A15-10 | デッキ情報登更新 | 要判定 | deck-api／deck-builder／pf-eccube3 | deck-api=15.43 次点=8.93（複数リポジトリで拮抗） |
| A15-11 | デッキ情報削除 | 要判定 | deck-api／pf-eccube3 | deck-api=6.5 次点=5.0（複数リポジトリで拮抗） |
| A15-12 | デッキ情報参照 | 要判定 | deck-api／deck-builder／pf-eccube3 | deck-api=35.0 次点=28.5（複数リポジトリで拮抗） |
| A15-13 | デッキ情報検索 | 要判定 | deck-api／deck-builder | deck-api=43.97 次点=41.97（複数リポジトリで拮抗） |
| A15-14 | メタゲーム情報参照 | 要判定 | deck-api／deck-builder | deck-api=5.57 次点=3.57（複数リポジトリで拮抗） |
| A15-16 | 直近大会情報取得 | 要判定 | deck-api／pf-api／pf-eccube3 | deck-api=3.5 次点=2.5（複数リポジトリで拮抗） |
| A15-18 | デッキ更新インポート | 要判定 | deck-api／deck-builder | deck-api=10.1 次点=8.1（複数リポジトリで拮抗） |
| A16-01 | トップバナーIDのトップバナー情報を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A16-02 | 指定言語の設定済みトップバナー一覧を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A17-01 | 検索クエリに一致する記事情報1件を取得 | 根拠なし(TBD) | pf-api／pf-article | 識別力のあるアンカーが1本も当たらない |
| A17-03 | PointGranterAPI連携 | 要判定 | pf-eccube3 | pf-eccube3=4.5 次点=1.5 ee固有=3.0（事前候補 pf-api／pf-article と不一致） |
| A17-04 | [任意門]商品IDに紐づく商品詳細の情報を取得 | 要判定 | pf-api／pf-eccube3 | pf-api=13.9 次点=9.9 ee固有=2.0（複数リポジトリで拮抗） |
| A17-05 | [任意門]商品名から商品詳細の情報を取得 | 要判定 | pf-api／pf-eccube3 | pf-api=4.5 次点=4.5（複数リポジトリで拮抗） |
| B02-01 | 期間別販売数集計 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B02-02 | 入荷通知キャンセル | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B02-03 | 期間別入庫数集計 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B02-04 | 商品部門未設定チェック | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B02-05 | お気に入り商品セール通知 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B02-06 | 在庫初期化 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-01 | 注文番号登録 | 要判定 | deck-api／ec-cube／pf-api／pf-eccube3 | deck-api=0.5 次点=0.5（複数リポジトリで拮抗） |
| B05-02 | 購入完了手続き再処理 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-03 | 店頭注文番号初期化 | 要判定 | pf-api／pf-eccube3 | pf-api=1.5 次点=1.5（複数リポジトリで拮抗） |
| B05-04 | スマレジ商品再連携 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-05 | スマレジ商品削除 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-06 | ポイント二重登録チェック | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-07 | ポイント利用未反映チェック | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-08 | スマレジEC受注連携エラー再連携 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B05-09 | スマレジ取引連携エラー再連携 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B06-02 | 買取集計バッチ | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B08-01 | リニューアル時パスワードリセットメール送信 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B08-02 | ポイント失効 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B08-03 | ポイント有効期限通知 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B08-04 | 必須項目が空欄の会員発生通知 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B08-05 | ポイント差分発生通知 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B08-06 | スマレジ使用ポイント連携 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B13-01 | 決済処理中チェックバッチ | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B13-02 | コンビニ支払チェックバッチ | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| B17-01 | 最新記事jsonファイル作成 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| F01-02 | 支店ECTOP | 要判定 | pf-eccube3 | pf-eccube3=9.0 次点=0.0（事前候補 ec-cube と不一致） |
| F02-01 | PC版ナビゲーション | 要判定 | ec-cube／pf-eccube3 | ec-cube=1.5 次点=1.5（複数リポジトリで拮抗） |
| F02-02 | スマホ版ナビゲーション | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| F02-03 | 支店PC版ナビゲーション | 根拠なし(TBD) | ec-cube | 識別力のあるアンカーが1本も当たらない |
| F02-04 | 支店スマホ版ナビゲーション | 根拠なし(TBD) | ec-cube | 識別力のあるアンカーが1本も当たらない |
| F03-03 | 商品詳細検索 | 要判定 | ec-cube／pf-eccube3 | ec-cube=1.5 次点=1.5（複数リポジトリで拮抗） |
| F03-04 | カテゴリ一覧 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| F04-02 | ご注文方法指定 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=91.0 次点=47.0（複数リポジトリで拮抗） |
| F06-03 | ログイン | 要判定 | pf-eccube3／ec-cube | pf-eccube3=22.33 次点=19.83（複数リポジトリで拮抗） |
| F06-06 | 購入履歴一覧 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=9.5 次点=7.5（複数リポジトリで拮抗） |
| F06-07 | 購入履歴詳細 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| F06-12 | まとめて買取査定結果 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| F06-26 | 店頭PC用アカウント制御 | 要判定 | ec-cube／pf-eccube3 | ec-cube=1.5 次点=1.5 ee固有=3.0（複数リポジトリで拮抗） |
| F08-01 | 店頭買取査定申込前ログイン | 要判定 | ec-cube／pf-article／pf-eccube3 | ec-cube=2.0 次点=2.0（複数リポジトリで拮抗） |
| M03-01 | 商品検索/一覧 | 要判定 | ec-cube／pf-eccube3 | ec-cube=73.17 次点=51.17（複数リポジトリで拮抗） |
| M03-03 | カード商品CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=18.33 次点=11.33 ee固有=3.0（複数リポジトリで拮抗） |
| M03-04 | グッズ商品CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=19.83 次点=18.83 ee固有=6.0（複数リポジトリで拮抗） |
| M03-05 | セール用価格変更CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=30.33 次点=29.33（複数リポジトリで拮抗） |
| M03-06 | 商品情報カスタムCSV出力 | 要判定 | ec-cube／pf-eccube3 | ec-cube=26.83 次点=15.33 ee固有=2.0（複数リポジトリで拮抗） |
| M03-08 | 商品規格一覧 | 要判定 | ec-cube／pf-eccube3 | ec-cube=17.5 次点=17.5（複数リポジトリで拮抗） |
| M03-09 | 商品規格登録/編集 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=37.5 次点=19.5（複数リポジトリで拮抗） |
| M03-11 | カテゴリ登録/編集 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=36.57 次点=34.07 ee固有=10.0（複数リポジトリで拮抗） |
| M03-12 | カテゴリCSV出力 | 要判定 | ec-cube | ec-cube=15.4 次点=3.4（事前候補 pf-eccube3 と不一致） |
| M03-14 | 略称タグ登録/編集 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=50.67 次点=25.67 ee固有=11.0（複数リポジトリで拮抗） |
| M03-15 | 略称タグCSV出力 | 根拠なし(TBD) | pf-eccube3 | 識別力のあるアンカーが1本も当たらない |
| M03-16 | 略称タグCSV入力 | 要判定 | ec-cube／pf-eccube3 | ec-cube=1.5 次点=1.5（複数リポジトリで拮抗） |
| M03-19 | 部門CSV出力 | 要判定 | ec-cube | ec-cube=6.0 次点=0.0（事前候補 pf-eccube3 と不一致） |
| M03-20 | 部門CSV入力 | 要判定 | ec-cube／pf-eccube3 | ec-cube=41.57 次点=31.57 ee固有=9.0（複数リポジトリで拮抗） |
| M03-21 | 棚番登録/編集 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=138.67 次点=71.67 ee固有=12.0（複数リポジトリで拮抗） |
| M03-22 | 購入グループ管理 | 要判定 | ec-cube／pf-eccube3 | ec-cube=43.5 次点=34.83 ee固有=9.0（複数リポジトリで拮抗） |
| M03-23 | 買取/販売価格履歴検索/一覧 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=24.57 次点=16.57 ee固有=9.0（複数リポジトリで拮抗） |
| M03-26 | カード商品CSV登録 | 要判定 | ec-cube／pf-eccube3 | ec-cube=35.67 次点=33.67 ee固有=7.0（複数リポジトリで拮抗） |
| M03-27 | グッズ商品CSV登録 | 要判定 | ec-cube／pf-eccube3 | ec-cube=44.17 次点=42.17 ee固有=9.0（複数リポジトリで拮抗） |
| M03-28 | 商品タグ更新CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=44.67 次点=31.67 ee固有=11.0（複数リポジトリで拮抗） |
| M03-29 | 売上分析タグ更新CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=32.67 次点=27.67 ee固有=12.0（複数リポジトリで拮抗） |
| M03-30 | 価格変更CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=33.57 次点=22.57 ee固有=15.0（複数リポジトリで拮抗） |
| M03-32 | 高額商品価格変更CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=51.4 次点=35.4 ee固有=10.0（複数リポジトリで拮抗） |
| M03-33 | セール用高額商品価格変更CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=34.57 次点=26.57 ee固有=17.0（複数リポジトリで拮抗） |
| M03-35 | 部門更新CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=47.07 次点=23.57 ee固有=6.0（複数リポジトリで拮抗） |
| M03-37 | 略称タグ更新CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=54.0 次点=42.0 ee固有=3.0（複数リポジトリで拮抗） |
| M03-38 | 商品公開CSV登録 | 要判定 | ec-cube／pf-eccube3 | ec-cube=40.67 次点=40.67 ee固有=13.0（複数リポジトリで拮抗） |
| M03-40 | 棚番号更新CSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=39.57 次点=23.57 ee固有=9.0（複数リポジトリで拮抗） |
| M03-41 | カテゴリCSV登録 | 要判定 | ec-cube／pf-eccube3 | ec-cube=69.9 次点=39.57 ee固有=4.0（複数リポジトリで拮抗） |
| M03-45 | カテゴリー一覧 | 要判定 | ec-cube | ec-cube=30.33 次点=12.33 ee固有=3.0（事前候補 pf-eccube3 と不一致） |
| M04-19 | 欠品履歴検索/一覧 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=23.5 次点=17.5（複数リポジトリで拮抗） |
| M05-01 | 受注情報検索/一覧 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=42.17 次点=37.83 ee固有=13.0（複数リポジトリで拮抗） |
| M05-02 | 受注情報CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=25.0 次点=21.0 ee固有=3.0（複数リポジトリで拮抗） |
| M05-03 | 受注情報カスタムCSV出力 | 要判定 | ec-cube／pf-eccube3 | ec-cube=20.5 次点=14.5（複数リポジトリで拮抗） |
| M05-04 | 配送CSV出力 | 要判定 | ec-cube | ec-cube=21.0 次点=9.0（事前候補 pf-eccube3 と不一致） |
| M05-05 | 配送カスタムCSV出力 | 要判定 | ec-cube | ec-cube=17.0 次点=8.0 ee固有=3.0（事前候補 pf-eccube3 と不一致） |
| M05-06 | メール一括送信機能 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=68.17 次点=36.5 ee固有=3.0（複数リポジトリで拮抗） |
| M05-07 | 送り状CSV出力 | 要判定 | deck-api／ec-cube／pf-api／pf-eccube3 | deck-api=0.5 次点=0.5 ee固有=1.0（複数リポジトリで拮抗） |
| M05-09 | 納品書印刷（日本語） | 要判定 | ec-cube／pf-eccube3 | ec-cube=2.0 次点=2.0 ee固有=1.0（複数リポジトリで拮抗） |
| M05-11 | 受注情報編集 | 要判定 | ec-cube／pf-eccube3 | ec-cube=60.0 次点=59.0 ee固有=4.0（複数リポジトリで拮抗） |
| M05-18 | 出荷指示リスト作成 | 要判定 | ec-cube／pf-eccube3 | ec-cube=34.83 次点=23.83（複数リポジトリで拮抗） |
| M05-19 | 出荷指示リスト検索 | 要判定 | ec-cube／pf-eccube3 | ec-cube=29.67 次点=26.0 ee固有=2.0（複数リポジトリで拮抗） |
| M05-24 | 出荷実績入力用CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=38.0 次点=28.0（複数リポジトリで拮抗） |
| M05-26 | 出荷実績インポート登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=14.5 次点=7.5（複数リポジトリで拮抗） |
| M06-02 | 古物台帳入力用CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=11.5 次点=7.5 ee固有=6.0（複数リポジトリで拮抗） |
| M06-03 | 買取情報編集 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=35.3 次点=18.3 ee固有=13.0（複数リポジトリで拮抗） |
| M06-05 | 買取商品履歴検索/一覧 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=29.57 次点=14.9 ee固有=9.0（複数リポジトリで拮抗） |
| M06-06 | 買取商品履歴全件CSV出力 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=11.9 次点=8.9 ee固有=1.0（複数リポジトリで拮抗） |
| M06-07 | 買取商品履歴選択CSV出力 | 要判定 | ec-cube／pf-eccube3 | ec-cube=6.0 次点=6.0（複数リポジトリで拮抗） |
| M06-09 | 買取集計データCSV出力 | 要判定 | ec-cube | ec-cube=6.67 次点=3.0 ee固有=3.0（事前候補 pf-eccube3 と不一致） |
| M07-06 | 買取商品一覧CSV | 要判定 | ec-cube／pf-eccube3 | ec-cube=9.33 次点=6.33 ee固有=6.0（複数リポジトリで拮抗） |
| M08-02 | メール一括送信 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=12.5 次点=8.5（複数リポジトリで拮抗） |
| M08-04 | 会員登録/編集 | 要判定 | ec-cube／pf-eccube3 | ec-cube=24.0 次点=21.0 ee固有=4.0（複数リポジトリで拮抗） |
| M08-07 | メール送信履歴 | 要判定 | ec-cube／pf-eccube3 | ec-cube=4.5 次点=4.5（複数リポジトリで拮抗） |
| M09-04 | ページ管理 | 要判定 | ec-cube | ec-cube=34.9 次点=10.9（事前候補 pf-eccube3 と不一致） |
| M10-01 | 基本設定(旧ショップマスター) | 要判定 | pf-eccube3／ec-cube | pf-eccube3=30.0 次点=15.67（複数リポジトリで拮抗） |
| M10-02 | 特定商取引に関する法律 | 要判定 | deck-api／pf-api | deck-api=24.73 次点=24.73（複数リポジトリで拮抗） |
| M10-03 | 会員規約設定 | 要判定 | deck-api／pf-api | deck-api=2.4 次点=2.4（複数リポジトリで拮抗） |
| M10-04 | 支払い方法/手数料設定 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=77.67 次点=41.0（複数リポジトリで拮抗） |
| M10-07 | 税率設定 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=27.37 次点=16.7（複数リポジトリで拮抗） |
| M10-09 | メール設定 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=6.4 次点=4.07（複数リポジトリで拮抗） |
| M10-13 | カスタムCSV出力設定 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=29.33 次点=23.0（複数リポジトリで拮抗） |
| M11-01 | メンバー管理一覧 | 要判定 | ec-cube | ec-cube=82.5 次点=14.17 ee固有=15.0（事前候補 pf-eccube3 と不一致） |
| M11-03 | 権限管理 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=26.0 次点=20.33（複数リポジトリで拮抗） |
| M12-02 | 日別/月別集計 CSVダウンロード | 要判定 | pf-eccube3／ec-cube | pf-eccube3=9.5 次点=5.5 ee固有=4.0（複数リポジトリで拮抗） |
| M12-03 | 受注/売上分析 集計一覧表示 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=33.63 次点=21.63（複数リポジトリで拮抗） |
| M14-05 | カードCSV登録 | 要判定 | pf-eccube3／ec-cube | pf-eccube3=65.67 次点=42.67（複数リポジトリで拮抗） |
| O01-01 | 店頭買取 | 要判定 | deck-api／pf-api／pf-eccube3 | deck-api=1.0 次点=1.0（複数リポジトリで拮抗） |
| O01-02 | ネット買取 | 要判定 | pf-api／pf-eccube3／deck-api | pf-api=11.5 次点=11.5（複数リポジトリで拮抗） |
| O01-03 | 入庫モード | 要判定 | deck-api／pf-api／pf-eccube3 | deck-api=1.0 次点=1.0（複数リポジトリで拮抗） |

## ee 優位（既存記述が新実装由来の疑い・3 件）

現行踏襲/カスタマイズなのに、アンカーが現行ソースより `ec-cube-enterprise` に多く一致する。既存本文が新実装の逆生成になっている可能性が高く、Stage 1 で現行ソースから書き直す優先対象。

```
F06-26, M04-16, M05-07
```

## 再生成

```bash
S=.cursor/skills/genzai-source-attribution/scripts/build_source_attribution.py
python3 "$S" build    # 台帳を生成
python3 "$S" verify   # 台帳が現状と一致するか検査
```
