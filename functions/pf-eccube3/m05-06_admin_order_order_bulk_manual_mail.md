# 受注管理 — メール一括通知/手動メール一括

## 概要

管理画面の受注一覧から、チェックした配送行に対応する受注宛てに、指定したメールテンプレート（販売用注文メール日本語・英語・ベースなしの3系統）と任意編集した件名・ヘッダー・フッターを用いたplaintextメールを順次送る機能である。一覧上の文言はドロップダウンで「メール一括通知」と表示される（翻訳キーは無固定文字列）。画面見出し・サブタイトルでは「手動メール通知」「一括メール通知」など既存の受注メール用ラベルが使われる。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは `src/Eccube/Controller/Admin/Order/MailController.php`、`src/Eccube/Form/Type/Admin/OrderManualMailAllType.php`、`src/Eccube/Service/MailService.php`（`replaceBody`、`getBody`、`sendManualMailForBulk`）、`src/Eccube/Resource/template/admin/Order/index.twig`、`manual_mail_all.twig`、`manual_mail_all_confirm.twig`、`src/Eccube/Entity/MailTemplate.php`、`src/Eccube/Repository/OrderRepository.php`（`findForOrderMail`）、`src/Eccube/Util/OrderUtil.php` とする。

対象はブラウザ経由の管理画面に限定する。

本機能のカスタマイズ区分はカスタマイズである。現行挙動は pf-eccube3 のHareruyaEcプラグイン実装を参照し、リニューアル移行後の挙動とDBは ec-cube-enterprise を確認値とする。DB関連の記述は ec-cube-enterprise を正とする。

受注一覧の検索・セッションの詳細は別設計（`m05-01_admin_order_order_search_list`）を正とする。一覧の「メールを送信」ボタン（`bulkSendMail`）から開く出荷通知メールの一括確認モーダル・XHR送信、受注詳細からの単票手動メール（ルート `m05-15_admin_order_order_mail`）、メールテンプレートマスタの運用全般は本書の主題としない。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

メール一括送信は現行 pf-eccube3 では HareruyaEc プラグインで実装し、送信履歴を補助テーブル `dtb_user_mail_history`（主キー `send_id`）に保存する。移行先 ec-cube-enterprise では送信履歴を `dtb_mail_history`（主キー `id`）へ統合する。DB関連は ec-cube-enterprise を正とし、本書のテーブル・列名は移行先名で記す。

| 項目 | 現行 pf-eccube3（HareruyaEc） | 移行先 ec-cube-enterprise |
|------|-------------------------------|----------------------------|
| メール送信履歴テーブル | `dtb_user_mail_history`（主キー `send_id`） | `dtb_mail_history`（主キー `id`） |
| 履歴の紐付け | テンプレート・受注・顧客・買取注文・操作会員 | `template_id`, `order_id`, `customer_id`, `buy_order_id`, `creator_id`, `base_info_id` |
| 件名・本文 | 件名・本文を保持 | `mail_subject`, `mail_body`, `mail_html_body` |
| メールテンプレートマスタ | `dtb_mail_template` | `dtb_mail_template`（同一） |
| 一括送信の確認画面 | 確認画面なし。POST で直接フォーム検証し送信する（`manual_mail_all.twig` 単一画面、`MailController` のbulkメソッド） | 確認画面あり（`mode=confirm` で文面プレビュー → `mode=complete` で送信、`manual_mail_all_confirm.twig`） |
| 対象受注パラメータ | `order_ids[受注ID]` 形式 | `ids[]` 形式 |
| 送信成功フラッシュ | `admin.mail.send_success` | `admin.order.mail_send_complete` |
| 送信後リダイレクト | 遷移元（Referer）へ戻る | `admin_order` へ |

本書の副作用節・入力項目の保存先記述は移行先 ec-cube-enterprise の名称（`dtb_mail_history` 等）に合わせている。現行の補助テーブル名は上表で対応づける。

注: 本書の「利用者視点の入口」「処理フロー」「表示メッセージ」節は移行先 ec-cube-enterprise の確認画面フロー（`mode=confirm`／`complete`）を基準に記述している。現行 pf-eccube3（HareruyaEc）は確認画面を持たず、入力画面の送信で直接一括送信する点が上表のとおり異なる。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押す | `GET /{admin_route}/order/manual_mail/mail_all?ids[]=…`（`form_bulk` をmethod GETに切り替えて送信するため、他の隠し項目がクエリに載る場合がある） | テンプレート未選択の一括手動メール入力画面が開く。件名・確認ボタンはテンプレート選択まで無効扱い |
| 一覧で未チェックのまま「メール一括通知」を押す | （ブラウザが当ルートへ遷移しない） | `alert` で「チェックボックスが選択されていません」と表示し、遷移を止める |
| 入力画面でテンプレートプルダウンを変更する | `GET /{admin_route}/order/manual_mail/mail_all/{templateId}?ids[]=…` | 選択IDをクエリに付けたまま、本文プレビュー欄が再構築される（フルページ遷移） |
| 入力画面で「確認」を押す | `POST /{admin_route}/order/manual_mail/mail_all/{templateId}?ids[]=…`（`mode=confirm`） | 検証成功時、先頭受注を用いた文面プレビュー付き確認画面を返す |
| 確認画面で「送信」を押す | `POST` 同上（`mode=complete`） | 受注ごとにメールを送り、成功フラッシュのうえ `admin_order` へリダイレクトする |
| 確認画面で「手動メール通知画面に戻る」 | `GET /{admin_route}/order/manual_mail/mail_all/{templateId}?ids[]=…` | 入力画面に戻る |
| 入力画面で「受注一覧に戻る」 | `GET /{admin_route}/order/page/{page_no}` または相当（セッション `eccube.admin.order.search.page_no` の既定 1） | 一覧へ戻る。離脱確認メッセージは共通リンクラベル用翻訳に依存する |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 一覧は検索結果件数が正のときだけ一括用 `form_bulk` と「その他」ドロップダウンが描画される。一括手動メール画面は2カラムで、左にテンプレ選択・件名・本文プレビュー、右に送信先テーブル（注文番号・注文者名。複数配送を選んだ受注は注文番号セル内に複数 hidden `ids[]` を並べる）。確認画面ではテンプレ名・件名・本文を読み取り専用表示 |
| JS挙動 | テンプレ選択変更時、全 `ids_*` hidden の値を拾って `ids%5B%5D=` を連結し、ルート `admin_order_manual_mail_all` または `admin_order_manual_mail_all_edit` へ `location.href` する。一覧側は `#manualMailAll` クリックで未チェックなら `alert`、済なら `form_bulk` を GET にして送信 |
| CSS・レイアウト | `page_admin_order_manual_mail_all` 接頭の body id に対し、ページタイトル行の flex 調整用インラインスタイルがある |
| モーダル・ポップアップ | 確認は別テンプレートの画面遷移で行う（専用モーダルはない）。ただし確認画面の［送信］（`#send_mail`）押下時に `manual_mail.js` がブラウザ標準の confirm「お客様にメールを送信します。よろしいですか？」を表示し、キャンセルで送信を中断する（M05-06-MSG-010） |

---

## 処理フロー

### 一覧から当機能へ入る

1. 利用者が配送行のチェックボックスを1件以上オンにする。一覧の一括操作ラッパは `toggleBtnBulk` で表示される。
2. 「その他」内「メール一括通知」を押す。JavaScript が `form_bulk` の `method` を `GET`、`action` を `admin_order_manual_mail_all` にし、送信する。
3. サーバが `ids` 互換パラメータを配列として読む。空または非配列なら `NotFoundHttpException`（404）。
4. 配送リポジトリで `id IN ids` を検索する。
5. 見つからない配送IDがあるとき、欠けたIDごとに翻訳キー `admin.order.mail_all.error.missing` を渡したエラーフラッシュを積む（メッセージ文言は「注文ID」とあるが、実装で埋め込むのは欠落した配送ID。実装を確認値とする）。ここで `admin_order` へリダイレクトし、以降の手順は実行しない。
6. 配送から受注IDを取り出し `array_unique` する。受注IDごとに `findBy` した `Orders` を以降の画面と送信ループに使う。

### 入力画面を表示する（GET）

1. `templateId` 付き GET なら、ID とファイル名（上記3種のいずれか）でメールテンプレートを1件取得する。不一致なら 404。
2. テンプレートがある場合、Twigローダーからファイルソースを読み、`replaceBody` で `{{ include('Mail/order_content.twig'…)}}` 等を静的に展開し、`{{ header }}` / `{{ footer }}` をtextarea付きHTMLに置換した文字列を本文欄にraw出力する。
3. `OrderManualMailAllType` のフォームを作成し、テンプレ選択肢を上記ファイル名に限定する。テンプレがある場合は `template` と `subject` フィールドにそのテンプレを反映する。
4. 右カラムのテーブルで各受注の表示用注文番号は `OrderUtil::getOrderNumbers`（`Order#getOrderNo()`）を用いる。受注に紐づく配送のうち、当初選択に含まれる ID だけ hidden で再送する。

### 確認画面へ進む（POST `mode=confirm`）

1. フォームを `handleRequest` する。`template`、`subject`、`header`、`footer` はいずれも未入力不可（`NotBlank`）。
2. `header` / `footer` は入力画面ではSymfonyの `form_row` ではなく、`replaceBody` が埋め込んだ `mail[header]` / `mail[footer]` のtextareaと、テンプレ未選択時に空になるhiddenが同居しうる。送信時は同名フィールドの最終値がリクエスト解釈に使われる（ブラウザの一般的な挙動に依存。textareaが存在するケースではそちらが後段に配置される）。
3. 検証成功かつテンプレオブジェクト取得済みなら、ループ対象の「先頭」の受注に対し `createManualBody` を呼び、確認テンプレートへ `previewBody` として渡す。先頭受注が無ければプレビュー本文は空文字。
4. 確認テンプレートでは、送信後も POST できるよう `mail[template]` と `mail[subject]` を hidden にし、`header` / `footer` は非表示だが `form_widget` で載せる。

### 送信する（POST `mode=complete`）

1. フォーム検証とテンプレ存在を満たすとき、受注ユニーク集合の各要素について本文 `createManualBody` を組み立て、`sendManualMailForBulk` を呼ぶ。件名はリクエストの `mail[subject]`（確認画面 hidden 経由の連続 POST を想定）。
2. 各メールは `Email` の plaintext。From は基準店舗の問い合わせ用メール01と店名、To は受注のメールアドレス、Bcc はメール01、Reply-To はメール03、Return-Path はメール04。共通ユーティリティで本文 charset 等を設定したうえ送信する。
3. 送信のたびメール履歴を永続化し、その場で `flush` する。テンプレート参照・受注・顧客・ゲストIDを履歴に載せる実装である。
4. ループ後、成功フラッシュ `admin.order.mail_send_complete` を積み、`admin_order` へリダイレクトする。

### 本文 `createManualBody` の要点

1. `orderRepository->findForOrderMail(受注ID)` で受注・配送・明細・商品・配送方法をまとめて取得し直す（一覧行の受注よりメール用に結合が揃う）。
2. 小計・送料・手数料から値引を差し引いた額に対し `PriceUtil::taxCalculation` を適用した税額表示用値と、受注番号、基準店舗、置換後ヘッダー・フッター等を `getBody(テンプレファイル名, …)` に渡し、Twigを文字列テンプレートとしてレンダリングした結果を返す。

---

## 集計条件

本機能は売上集計を行わない。送信対象件数は「選択配送に紐づく受注IDを一意化した個数」に等しい。

---

## 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| テンプレ選択 | 必須 | 選択式（フォームの文字長上限は該当しない） | プレースホルダ相当の空選択または GET で渡したテンプレ | `MailTemplateType`。候補は `mt.file_name` が `Mail/sell_order.twig`、`Mail/sell_order.en.twig`、`Mail/no_base.twig` のものに限定。変更時は同一画面を別 `templateId` で GET し直す |
| 件名 | 必須 | フォームに `Length` 制約は無い | 選択テンプレの `mail_subject`。確認・送信時は hidden で再送 | 送信時に `sendManualMailForBulk` の件名として使われ、履歴の件名にもなる。マスタ側 `mail_subject` 列は255だが、入力値の検証はこのフォームでは255に切らない |
| ヘッダー | 必須 | フォームに `Length` 制約は無い（DB上メールテンプレの `header` 列は TEXT） | 選択テンプレのヘッダ | `replaceBody` が本文プレビュー内に `name="mail[header]"` の textarea を埋め込む。`getBody` に渡る置換後文字列として本文生成に使われる |
| フッター | 必須 | 同上 | 選択テンプレのフッター | `name="mail[footer]"` の textarea。本文生成に使われる |

テンプレ未確定の間、確認ボタンは `disabled` である。

---

## エッジケース

| 状況 | 結果 |
|------|------|
| `ids` が空・非配列 | 404 |
| 一部の配送IDがDBに存在しない | 欠落IDごとにエラーフラッシュ、`admin_order` へ戻る |
| 同一受注の複数配送を選択 | 受注は1件として扱い、メールは1通 |
| `templateId` が数値でない・許可外ファイル | 404 |
| 確認画面で先頭受注が無い（理論上、受注配列が空） | プレビュー本文は空。送信ループも回らない |
| 一覧の検索結果0件 | 一括フォーム自体が無いため、当入口からは操作できない |

---

## 業務ルール・計算

- 本機能の判定・集計・表示条件は既存実装のリポジトリ、サービス、フォーム定義を正とする。
- 金額・ポイント・数量・ステータス・日時は永続化済み値または既存サービスの計算結果を使用し、画面・API層で独自補正しない。
- 条件不一致、権限不足、検証エラー時は業務データを更新せず、既存のエラー形式または画面遷移に従う。

## データ整合性

一覧上の注文番号表示（`order_number`）と、本機能右カラム・履歴まわりで参照する `getOrderNo()` は別フィールドであり、同一値とは限らない。受注メール本文内の注文番号表記は `createManualBody` が `Order#getOrderNo()` を渡す実装に従う。

送信直後に一覧へ戻るため、当画面は一覧の最新検索状態を自動では再読込しない。検索セッションは既存の受注一覧仕様に従う。

---

## API／バッチ

本機能では扱わない。

---

## 副作用

| 種別 | 内容 |
|------|------|
| 外部メール | 受注ごとに1通ずつ SMTP 等へ送信する（ループ内順次）。Bcc で店舗のメール01も受け取る |
| DB | 送信のたび `dtb_mail_history` に行を追加し都度 `flush` する。履歴にメールテンプレ・受注・顧客・ゲストIDを紐付ける |
| セッション | 一覧のページ番号は戻りリンクで `eccube.admin.order.search.page_no` を参照する。当機能は検索条件自体は書き換えない |
| ログ | 本コントローラは送信ログを独自に追記しない（メーラー層のログに依存） |
| フラッシュ | 欠落配送ID時はエラー複数、送信完了時は成功1件 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 一覧から入口URLへ遷移成功 | 一括手動メール入力（テンプレ未選または選択済み） |
| 入力で確認POST成功 | 確認画面 |
| 確認で送信POST成功 | `admin_order`（受注一覧。クエリは付けない） |
| 配送ID欠落エラー | `admin_order` |
| `ids` 不正 | 404 |

---

## エラー処理

| 起き方 | 利用者への見え方 | 補足 |
|--------|------------------|------|
| `ids` 空・非配列 | 404ページ | 一覧側JSで未選択を弾くが、直リンクでは起きうる |
| 存在しない配送ID | フラッシュに欠番メッセージ（文言は翻訳ファイルの確認値） | 一覧へ戻る |
| 不正テンプレID | 404 | — |
| フォーム検証失敗 | 入力画面または確認POST時の再描画（Symfony標準のエラー表示に委ねる） | `mode` により分岐 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M05-06-MSG-003 | 管理画面上部 | メールを送信しました。 | メールを送信しました。 | メール一括送信を完了したとき | メールを送信し、受注情報編集画面に遷移する |
| M05-06-MSG-004 | 管理画面上部 | 注文ID %s の注文情報を取得できませんでした。 | 注文ID %s の注文情報を取得できませんでした。 | メール一括送信で、対象の注文情報を取得できないとき | エラーを表示し、受注情報検索・一覧画面に遷移する |
| M05-06-MSG-005 | 管理画面上部 | メールを送信しました。 | メールを送信しました。 | メール一括送信を完了したとき | メールを送信し、受注情報検索・一覧画面に遷移する |
| M05-06-MSG-010 | 画面中央(ダイアログ) | お客様にメールを送信します。よろしいですか？ | お客様にメールを送信します。よろしいですか？ | メール一括送信の実行ボタンを押したとき（送信前確認） | 送信せず確認画面に留まる |
| EE-JS-MSG-049 | 画面中央(ダイアログ) | チェックボックスが選択されていません | チェックボックスが選択されていません | 配送行のチェックボックスが0件の状態で押下したとき（preventIfNoCheckedBulkTargetがtrueを返す） | alert表示後にevent.preventDefault()し遷移・一括送信を中止する（return false） |
| M05-06-MSG-008 | 入力項目直下 | 入力されていません。 | 入力されていません。 | 必須項目が未入力のまま確認または送信したとき | 送信せず手動メール通知画面に留まる |
| M05-06-MSG-009 | 入力項目直下 | 入力されていません。 | 入力されていません。 | 必須項目が未入力のまま確認または送信したとき | 送信せず一括手動メール通知画面に留まる |
| M05-06-MSG-010 | 画面中央(ダイアログ) | お客様にメールを送信します。よろしいですか？ | お客様にメールを送信します。よろしいですか？ | メール一括送信の実行ボタンを押したとき（送信前確認） | 送信せず確認画面に留まる |

---

## ログと秘匿情報

メール本文・宛先は画面と履歴テーブルに残る。CSRFトークン値やパスワードを本書に記さない。一覧から GET で遷移するとき、一括フォーム内の他 hidden が URL に含まれうるため、ブックマーク共有時の注意は利用者オペレーションに委ねる。

---

## 調査補助（grep用）

- ルート定義属性: `MailController` の `manualMailAll`
- Twig: `@admin/Order/manual_mail_all.twig`、`manual_mail_all_confirm.twig`
- 一覧導線: `index.twig` の `#manualMailAll`、`#form_bulk`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_order_manual_mail_all` … `GET` … `/{admin_route}/order/manual_mail/mail_all`（クエリ `ids[]` に配送IDを渡し、テンプレート未選択の入力画面を返す。`ids` が空・非配列のとき 404）
- `admin_order_manual_mail_all_edit` … `GET` … `/{admin_route}/order/manual_mail/mail_all/{templateId}`（同上のうえ `templateId` でメールテンプレートを特定し、本文プレビュー用HTMLを組み立てた入力画面を返す。テンプレートが許可リスト外なら 404）

---

## 排他制御・トランザクション

| 観点 | 内容 |
|------|------|
| トランザクション境界 | 複数受注へのメール送信全体を包む明示トランザクションは持たない。送信ループ内で1通送るたびにメール履歴を永続化し、その場で`flush`する。 |
| ロック | 受注、配送、メール履歴に対する行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。送信中に受注や配送が更新された場合も、送信時に読み取った値で本文と履歴を作る。 |
| 例外時 | 途中の送信または履歴保存で例外が起きた場合、すでに送信済みのメールとflush済みのメール履歴は戻らない。未送信分だけが残る。 |
