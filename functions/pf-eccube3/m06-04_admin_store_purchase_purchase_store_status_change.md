# 店頭買取管理 — 買取ステータス変更

## 業務ロジック

### ステータス変更画面

指定された店頭買取受注が無いときは404応答とする。変更後ステータスは初期選択を持たず、選ばれていない間は「ステータスを選択」と表示する。

変更後ステータスの選択肢には、その買取が現在持っているステータスを出さない。

保存に成功したときは店頭買取詳細へ遷移する。

### ステータス更新で行うこと

更新は一連の処理としてまとめて行い、途中で失敗したときは確定しない。

| 更新対象 | 内容 |
| --- | --- |
| ステータスに紐づく日付 | 現在と同じステータスへ変更したときは日付を書き換えない。買取成立日が既に入っているときは、再度買取成立へ変更しても買取成立日を上書きしない |
| 買取集計データ | 変更前と変更後で買取集計の対象に出入りがあったときだけ、買取成立日の当日分を作り直す（当日分を消したうえで、その日に買取が成立した明細と個別入力商品から、店舗・部門ごとの買取金額と販売金額を集計し直す）。同じ処理の中で行うため、作り直しに失敗したときはステータス変更も確定しない |

ステータス変更では、店頭買取受注の更新日時と担当者を書き換えない。金額の再計算や税計算も行わない。

### 更新できなかったときの扱い

| 内容 | 処理 |
| --- | --- |
| 対象の店頭買取受注が無いとき | 404応答とする |
| なりすまし対策トークンが一致しないとき | アクセス拒否として扱い、更新しない |
| 変更後ステータスが選ばれていないか、選択肢に無いとき | 更新せず、同じ店頭買取のステータス変更画面を開き直す。開き直すため、どの項目が不正かは画面に残らない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 店頭買取受注ID、変更後ステータス、なりすまし対策トークン、ログイン利用者 |
| 成功時出力 | 店頭買取詳細への遷移と完了メッセージ |
| 失敗時出力 | 存在しないIDは404応答、トークン不一致はアクセス拒否、選択が妥当でないときはステータス変更画面へ戻る |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | ステータス変更に伴う、ステータスに紐づく日付の記録 |
| 削除・追加 | 買取集計の対象に出入りがあったときの、買取成立日当日分の買取集計データの作り直し |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M06-04-MSG-001 | 管理画面上部 | この機能は管理者によって制限されています。 | 買取ステータス変更画面を開こうとしたが、利用権限がないとき | 買取情報編集画面に遷移する |
| M06-04-MSG-002 | 管理画面上部 | この機能は管理者によって制限されています。 | 買取ステータスを更新しようとしたが、利用権限がないとき | 買取情報編集画面に遷移する |
| M06-04-MSG-003 | 管理画面上部 | 保存しました | 買取ステータスの変更を保存したとき | 買取情報編集画面に遷移する |
| — | 管理画面上部 | 経理払出し待ちステータスの買取ではありません | 経理払出し済を実行したが、現在ステータスが経理払出し待ちでないとき | 更新せず、店頭買取詳細へ戻る |
| — | 変更後ステータスの選択欄 | ステータスを選択 | ステータス変更画面を表示したとき | 画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| ステータス変更画面 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderStatusController.php:27 |
| ステータス変更画面 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:46 |
| ステータス変更画面 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:575 |
| ステータス更新で行うこと | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbOtcBuyOrder.php:1255 |
| ステータス更新で行うこと | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderStatusController.php:70 |
| ステータス更新で行うこと | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderRepository.php:247 |
| 更新できなかったときの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:44 |
| 更新できなかったときの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderStatusController.php:59 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderSummaryRepository.php:92 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderSummaryRepository.php:46 |
