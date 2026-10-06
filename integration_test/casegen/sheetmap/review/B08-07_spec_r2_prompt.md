# 敵対レビュー依頼：B08-07（身分証有効期限切れ通知）の機能設計書

あなたはレビュアーである。著者とは別人として、下の機能設計書を現行ソースと突き合わせ、誤りを指摘せよ。ファイルは変更しない。出力は日本語。事実確認に限る。
`hareruya-design-docs/integration_test/casegen/sheetmap/review/` にある他のファイルは読まない。

## 対象

`hareruya-design-docs/functions/pf-eccube3/b08-07_batch_customer_id_expire_notification.md`

現行踏襲のバッチ「身分証有効期限切れ通知」の現行仕様を、現行ソース（`/home/y-saito/Developments/pf-eccube3`）から起こしたもの。HTML設計書の 0408「身分証有効期限切れ通知」シートに「現行仕様」として埋め込む。

## 正（突き合わせる相手）

- 現行ソース: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/IdExpireNotification.php`、`Repository/DtbPlayerRepository.php`（findCustomersForNotificationIdExpire）、`Service/MailService.php`（sendIdExpireNotificationMailToCustomer・sendIdExpireNotificationMailToAdmin・saveUserMailHistory）、`Command/CustomerBatch.php`、`config.yml`（days_before_expiration_warning）、`Form/Type/Admin/ConfigType.php`（設定の画面ラベル）、`Resource/template/default/Mail/id_expire_notification.twig`、メールテンプレート登録のマイグレーション。
- Excel基本設計の内容: `hareruya-design-docs/integration_test/casegen/sheetmap/materials/B08-07_sheet.txt`。

## 書き方の規約（これに従っている箇所は指摘しない）

- 書くのは、Excel基本設計が定めていない、画面・応答・ファイル・メール・DBに現れる入出力とふるまいだけ。Excel が値・条件まで定めていることは、同じでも違っても書かない（Excel が正）。Excel が上位概念や項目名だけ書いていて細部が無いものは書く。
- クラス名・メソッド名・DB物理名・設定キー名などの実装用語は書かない（業務上の呼び名で書く）。
- 節は「業務ロジック」「入出力」「表示メッセージ」と末尾の「出典」。
- たとえば次は意図的に書いていない: 事前通知日数の値（Excel が2週間と定める）、本人確認ステータスを何に更新するか（Excel が定める。現行ソースとは値・条件が違う）、該当者0件で終えること（Excel が定める）、メールの件名・本文の文面（Excel が定める）、送信元。

## 経緯

これは2巡目である。1巡目の指摘7件（打ち切り条件と送信0通の扱い、管理者宛の返信先・戻り先、配信履歴の保存内容、追加引数、出力文言、出典2件）はすべて反映した。直した箇所が現行ソースの事実に合っているかと、直しで入った誤りを見よ。1巡目に挙げなかった新しい指摘は、事実の明白な誤りに限る。

## 重点観点

1. 設計書の各文が、現行ソースで実際にそうなるか（基準日時の計算と比較、対象の絞り込みの有無、会員ごとの更新確定と送信の順、エラー時に打ち切られ管理者宛が送られないこと、言語の出し分けが無いこと、差し込みが無いこと、返信先・戻り先、配信履歴の保存、管理者宛の宛先設定が空のとき・複数のとき、氏名の組み立て、バッチ名の引数、出力メッセージ）。
2. 現行ソースにあって、Excel が定めておらず、設計書にも無い、外から見えるふるまい（取りこぼし）。
3. 規約違反（Excel が定めていることの重複、実装用語、推測）。
4. 出典の行（ファイルと行番号）が、その小見出しの内容の根拠になっているか。

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で書く。最大12件。確信の持てないものは挙げない。

```
### 指摘N（小見出し）
- 主張: 設計書の記述（引用）
- 実際: 現行ソースの事実（file:line）または Excel の記述（sheet.txt の行）
- 判定: 事実の誤り／取りこぼし／Excelとの重複・矛盾／実装用語／出典の誤り
- 修正案: 結論を先に置いた1〜2文
```
