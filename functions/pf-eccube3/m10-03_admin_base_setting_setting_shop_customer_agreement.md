# 店舗設定／利用規約（ヘルプ情報の本文編集）

## 業務ロジック

### 編集対象

編集の対象は、既定の識別子で読み込んだヘルプ情報1件だけとする。画面を開いたときに当該ヘルプ情報を読み込み、利用規約の入力欄へ載せる。

既定の識別子のヘルプ情報が無いときも、エラーの表示や別の画面への遷移は行わず、利用規約の入力欄が空欄の編集画面を表示する。

保存で書き換えるのは利用規約の本文だけであり、同じヘルプ情報が持つ他の項目（特定商取引法の表記など）は、この画面の保存では変更しない。

### 保存の判定順序

| 順序 | 判定・処理 | 内容 |
|------|------|------|
| 1 | なりすまし対策の検証値と送信の妥当性 | 不正なときは送信済みとして扱わない、またはエラーとして扱う |
| 2 | 利用規約の項目の検証 | 外れたときは保存せず、同一画面を再描画して該当項目にエラーを表示する。成功メッセージは表示しない |
| 3 | 保存 | 検証を通ったときだけヘルプ情報を保存する |
| 4 | 更新日時 | 保存の直前に、更新日時を持つときは現在日時で更新する |
| 5 | 遷移 | 同じ編集画面へ戻る |

利用規約の本文が空のときは検証に外れる。検証に外れたときはデータを更新しない。

利用規約の本文には、最大文字数と文字種の制約は無い。空でなければ、どの文字数・文字種でも検証に外れない。

## 入出力

| 種類 | 内容 |
|------|------|
| 成功時出力 | 同じ編集画面への遷移と、登録完了のメッセージ。 |
| 失敗時出力 | 同一画面の再描画と、項目ごとのエラー。 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 利用規約を編集して保存したとき。更新日時もあわせて更新する |

### 入出力: 登録した本文の表示先

登録した本文は、購入者向けの利用規約ページに表示する。入力した改行は改行として表示し、本文に書いたタグはそのまま解釈されるため、装飾を含む本文をそのまま載せられる。

## 表示メッセージ

登録完了のメッセージを管理画面上部に表示する。文言は共通の登録完了メッセージを用いる。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 編集対象 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/CustomerAgreementController.php:42 |
| 編集対象 | P1 | pf-eccube3:src/Eccube/Form/Type/Admin/CustomerAgreementType.php:45-52 |
| 編集対象 | P1 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/TradelawController.php:43 |
| 編集対象 | P2 | pf-eccube3:src/Eccube/Repository/HelpRepository.php:44-47 |
| 保存の判定順序 | P2 | pf-eccube3:src/Eccube/Form/Type/Admin/CustomerAgreementType.php:46 |
| 保存の判定順序 | P2 | pf-eccube3:src/Eccube/Form/Type/Admin/CustomerAgreementType.php:44-48 |
| 保存の判定順序 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/CustomerAgreementController.php:58-78 |
| 入出力: 永続化 | P2 | pf-eccube3:src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:72 |
| 入出力: 登録した本文の表示先 | P2 | pf-eccube3:src/Eccube/Resource/template/default/Help/agreement.twig:34 |
