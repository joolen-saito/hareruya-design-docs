# m05-06_admin_order_order_bulk_manual_mail — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| テンプレ選択 | 必須 | 選択式（フォームの文字長上限は該当しない） | プレースホルダ相当の空選択または GET で渡したテンプレ | `MailTemplateType`。候補は `mt.file_name` が `Mail/sell_order.twig`、`Mail/sell_order.en.twig`、`Mail/no_base.twig` のものに限定。変更時は同一画面を別 `templateId` で GET し直す |
| 件名 | 必須 | フォームに `Length` 制約は無い | 選択テンプレの `mail_subject`。確認・送信時は hidden で再送 | 送信時に `sendManualMailForBulk` の件名として使われ、履歴の件名にもなる。マスタ側 `mail_subject` 列は255だが、入力値の検証はこのフォームでは255に切らない |
| ヘッダー | 必須 | フォームに `Length` 制約は無い（DB上メールテンプレの `header` 列は TEXT） | 選択テンプレのヘッダ | `replaceBody` が本文プレビュー内に `name="mail[header]"` の textarea を埋め込む。`getBody` に渡る置換後文字列として本文生成に使われる |
| フッター | 必須 | 同上 | 選択テンプレのフッター | `name="mail[footer]"` の textarea。本文生成に使われる |

テンプレ未確定の間、確認ボタンは `disabled` である。

---

## ログと秘匿情報

メール本文・宛先は画面と履歴テーブルに残る。CSRFトークン値やパスワードを本書に記さない。一覧から GET で遷移するとき、一括フォーム内の他 hidden が URL に含まれうるため、ブックマーク共有時の注意は利用者オペレーションに委ねる。

---
