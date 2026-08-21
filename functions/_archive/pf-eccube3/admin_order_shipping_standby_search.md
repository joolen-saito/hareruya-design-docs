# admin_order_shipping_standby_search — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 入力項目

ラベル文言は翻訳リソースを正とする。テンプレートでは一部ラベルがフィームの `label` とメッセージキーの連結で表示される。

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 出荷指示番号（画面上はラベル断片連結になりうる） | 任意 | 整数入力。Symfony の整数型ウィジェットの取りうる桁は実行環境整数範囲に従う。 | GET 初期は空 | キー `standby_id`。空でなけリスト主キー完全一致。送信後ビューデータはセッション `eccube.admin.shipping_standby.search`。 |
| 注文番号（同上） | 任意 | 同上 | 同上 | キー `order_id`。空でなけ受注 ID 完全一致で紐づくリストに限定。画面上の文言はテンプレートで「admin.common.order_number」との連結となる。 |
| 登録日（開始および終了。プレースホルダで日時形式を示唆） | 任意 | datetime シングルテキスト。実効的な許容フォーマットは Symfony の datetime ウィジェット解釈に従う。 | 同上 | キー `create_date_from` / `create_date_to`。それぞれ以上・以下。 |
| 最終更新日（開始および終了） | 任意 | 同上 | 同上 | キー `update_date_from` / `update_date_to`。それぞれ以上・以下。 |
| 注文区分（フォーム定義ではラベル「注文区分」） | 任意 | チェック複数選択 | 未選択 | キー `order_type`。`MtbOrderType` エンティティの ID 集合で `IDENTITY(s.OrderType)` を絞り込む。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| セッションに検索条件がある状態で単に `GET /standby/search` を開き直した | トレイトを経由しないため一覧は最初から伏せられ、入力欄も空フォームとなる。一覧を再び見るには POST 送信か、ページクエリ付き GET、`/standby/page/N` が必要。 |
| 並び順文字列が不正 | `admin.error.sort` を積み、初期状態に相当する応答になる。 |
| 表示件数 `select` だけ変更 | 本テンプレート単体には `change` ハンドラが無いので、ユーザー操作のみでは URL が変わらない。 |
| 「検索条件をクリア」クリックのみ | DOM の値はクリアされるが送信しない限りサーバ側のセッションは以前のまま。 |

---

---

## 副作用（設計書からは削除・2026-08-19）

### 副作用
| 種別 | 内容 |
|------|------|
| セッション | `eccube.admin.shipping_standby.search.page_count`、`eccube.admin.shipping_standby.search.page_no`、`eccube.admin.shipping_standby.search`、`eccube.admin.shipping_standby.sort`、`eccube.admin.shipping_standby.order` の読み書き。 |
| データベース | 検索処理は参照のみ。 |
| ログ | 検索専用の追加ログ出力は本経路では設けていない。 |
調査補助。リスト削除成功時のリダイレクトはセッションキー `admin.shipping_standby.search.page_no` を読む一方、トレイトは `eccube.admin.shipping_standby.search.page_no` を用いる。また遷移先ルート名に `admin_shipping_standby_search` が使われているが、ルート定義一覧に同名の `name` は無い。検索フォームのふるまい自体とは別だが、削除後の一覧復帰を追う際の実装差分として触れる。
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### データ整合性
- 一覧に出る ID・日付・区分は `dtb_shipping_standby` と関連マスタの読み取り時点の値である。同一セッション内で別タブが更新しても、再検索やページ移動まで画面は古い結果のままになりうる。
- 受注との紐づけは中間テーブル経由の多対多である。`order_id` 検索は「その受注を含むリスト」の存在で絞る。
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### 集計・判定・計算
