# 会員 — 退会（退会手続き）

## 業務ロジック

### ログイン状態と画面の開閉

退会前画面・退会確認画面は会員ログインを要求し、未ログインのときは会員ログインへ誘導する（会員ログイン機能を正とする）。退会完了画面は退会でログアウトした直後に表示するため、ログインしていなくても開ける。

### 画面のふるまい

送信は通常のフォーム送信で、非同期取得や動的な表示切替は行わない。本画面専用のモーダルは無い。日本語と英語のロケールに対応する。

「戻る」で退会を中止したときは、会員データを変更しない。

### なりすまし対策の照合

「退会手続きへ」「退会する」を押したときに、なりすまし対策のための照合値が欠けている・一致しないときは、退会手続きを進めず、メッセージも出さずに退会前画面を表示する。

### 退会で削除する会員以外のデータ

退会を確定したとき、会員に紐づく選手情報も削除する。スマレジ連携に失敗して退会を中止したときは、選手情報も削除しない。

### 退会後の再ログイン

退会した会員は、退会前のメールアドレスではログインできない。

## 入出力

### 入出力: 退会完了メール

宛先は退会前のメールアドレスで、運営アドレスをBCCに含む。日本語ロケールと英語ロケールで別のメールテンプレートを使う。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 削除 | 退会確定時に、会員に紐づく選手情報を削除する |
| 登録 | 退会完了メールの送信内容を、会員のメール送信履歴として残す |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F06-21-MSG-001 | 入力項目直下 | パスワードに誤りがあります。 | 退会手続きで、パスワードが未入力または正しくないとき | 退会確認画面に留まる |
| F06-21-MSG-001 | 入力項目直下（英語表示時） | The password is incorrect. | 退会手続きで、パスワードが未入力または正しくないとき | 退会確認画面に留まる |
| F06-21-MSG-001 | 入力項目直下（英語表示時） | Password contains an error. | 退会確定時に入力パスワードが現在のパスワードと一致しないとき（英語文言の別の確認値） | 退会は行わず退会確認画面を再表示する |
| F06-21-MSG-002 | 入力項目直下 | 退会処理の途中でエラーが発生しました。 | 退会手続きを完了しようとしたときに、退会処理でエラーが起きたとき | 退会確認画面に留まる |
| F06-21-MSG-002 | 入力項目直下（英語表示時） | An error occurred during the withdrawal process. | 退会手続きを完了しようとしたときに、退会処理でエラーが起きたとき | 退会確認画面に留まる |
| — | 退会前画面 | 退会 | 退会前画面の表示時 | 退会前画面に留まる |
| — | 退会前画面（英語表示時） | Hareruya Membership is canceled | 退会前画面の表示時 | 退会前画面に留まる |
| — | 退会前画面 | 退会手続きの前に、ご確認ください。<br>会員を退会された場合、現在保存されている購入履歴や個人情報はすべて削除されますが、よろしいでしょうか？ | 退会前画面の表示時 | 「退会手続きへ」で退会確認画面へ進む |
| — | 退会前画面（英語表示時） | Before proceeding to cancel your account, please confirm that if your account is canceled, all your personal information and your purchase history will be deleted. | 退会前画面の表示時 | 「退会手続きへ」で退会確認画面へ進む |
| — | 退会確認画面 | 退会手続き | 退会確認画面の表示時 | 退会確認画面に留まる |
| — | 退会確認画面（英語表示時） | Cancel Procedure | 退会確認画面の表示時 | 退会確認画面に留まる |
| — | 退会確認画面 | 退会手続きを実行してもよろしいでしょうか。 | 退会確認画面の表示時 | 退会確認画面に留まる |
| — | 退会確認画面（英語表示時） | May we proceed to cancel your account? | 退会確認画面の表示時 | 退会確認画面に留まる |
| — | 退会確認画面 | [注意事項]<br>退会手続きが完了しますと、現在保存されている購入履歴や個人情報はすべて削除されます。 | 退会確認画面の表示時 | 退会確認画面に留まる |
| — | 退会確認画面（英語表示時） | [Warning]<br>When we complete canceling your account, all your personal information and your purchase history will be deleted. | 退会確認画面の表示時 | 退会確認画面に留まる |
| — | 退会確認画面のパスワード欄 | 現在のパスワードを入力し、「退会する」ボタンを押してください。 | 退会確認画面の表示時 | 「退会する」で退会を確定する |
| — | 退会確認画面のパスワード欄（英語表示時） | Please enter your current password, then click Cancel account. | 退会確認画面の表示時 | 「退会する」で退会を確定する |
| — | 退会完了画面 | 退会完了 | 退会完了画面の表示時 | 退会完了画面に留まる |
| — | 退会完了画面（英語表示時） | Withdrawal Complete | 退会完了画面の表示時 | 退会完了画面に留まる |
| — | 退会完了画面 | 退会を完了いたしました。<br>ご利用ありがとうございました。またのご利用をお待ちしております。 | 退会完了画面の表示時 | 「ホームへ戻る」でトップページへ戻る |
| — | 退会完了画面（英語表示時） | Withdrawal procedure from membership is completed.<br>Thank you for your use. We look forward to serving you again soon. | 退会完了画面の表示時 | 「ホームへ戻る」でトップページへ戻る |

本機能はこれ以外の通知を生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| ログイン状態と画面の開閉 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:309-316 |
| 画面のふるまい | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/withdraw_confirm.twig:32-51 |
| なりすまし対策の照合 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:45-126 |
| 退会で削除する会員以外のデータ | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:75-95 |
| 退会後の再ログイン | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:93-94 |
| 入出力: 退会完了メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:307-333 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:87-95 |
