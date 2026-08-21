# 店舗設定／特定商取引法（ヘルプ情報の表記編集）

## 業務ロジック

### 編集の対象

画面を開いたときは、登録済みの表記1件を読み込み、各項目の初期表示にする。

### 保存の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | なりすまし対策の検証値 | 不正なときは保存せず、同一画面を再表示する |
| 2 | 各項目の入力検証 | いずれかが失敗したときは保存せず、同一画面を再表示して該当項目にエラーを表示する |
| 3 | 電話番号・FAX番号の3分割入力 | 3欄すべてに入力するか、3欄すべてを空にする。一部の欄だけを入力したときはエラーとする。FAXは必須ではないため全欄が空でもよい |
| 4 | 上記を通過 | 保存後、同一の編集画面へ戻る |

検証に失敗したときは保存せず、完了のメッセージも表示しない。
電話番号・FAX番号は、全角で入力された英数字を半角に直したうえで上記の検証を行う。

### 所在地の入力補助

郵便番号を入力すると、都道府県と住所の欄を自動で補う。

## 入出力

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 検証を通過した保存。あわせて更新日時を現在日時にする |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 管理画面上部 | 登録完了のメッセージ（文言は共通実装を正とする） | 検証を通過して保存したとき | 同一の編集画面へ戻る |
| — | 入力項目直下 | 入力検証のメッセージ（文言は共通実装を正とする） | 入力検証に失敗したとき | 保存せず同一画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 編集の対象 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/TradelawController.php:43 |
| 保存の判定順序 | P1 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/TradelawController.php:61-79 |
| 保存の判定順序 | P1 | pf-eccube3:src/Eccube/Form/Type/TelType.php:79-96 |
| 保存の判定順序 | P1 | pf-eccube3:src/Eccube/Form/Type/TelType.php:70 |
| 保存の判定順序 | P1 | pf-eccube3:src/Eccube/EventListener/ConvertKanaListener.php:24-34 |
| 所在地の入力補助 | P3 | pf-eccube3:src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:33 |
| 入出力: 永続化 | P1 | pf-eccube3:src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:77 |
