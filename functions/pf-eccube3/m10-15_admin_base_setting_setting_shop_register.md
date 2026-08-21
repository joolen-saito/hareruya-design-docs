# 店舗の登録・編集

## 業務ロジック

### 登録と編集の切り替え

画面の先頭にある店舗の選択で登録済みの店舗を選ぶと、その店舗の内容を読み込んだ状態で開き直す。選ばないときは新しい店舗の登録として扱う。選択肢は表示順の昇順に並ぶ。選び直すと画面を開き直すため、入力途中の内容は残らない。

存在しない店舗を指定して画面を開いたときは、画面を表示せず見つからない旨の応答を返す。

### 店名略称の重複禁止

店名略称(3文字)には、ほかの店舗で登録済みの値を使えない。重複したときは保存せず、その値を使っている店舗のショップ名略称を示すエラーを表示する。編集中の店舗自身が持つ値は重複として扱わない。

### 保存できないときの扱い

入力の検証に通らないときは保存せず、同じ画面を再表示して項目ごとのエラーを表示する。ショップアイコンの画像を確定できないときも保存せず、画面上部にエラーを表示して同じ画面へ戻す。

### ショップアイコンの差し替え

画像を選んで保存すると、その店舗に設定されていた画像は消され、新しい画像へ差し替わる。画像を選ばずに保存したときは、設定済みの画像をそのまま残す。受け付ける画像は5メガバイトまでで、JPEG・GIF・PNGに限る。

### 登録完了時に作られるもの

新しい店舗を登録したときは、その店舗の注文番号と店頭注文番号の採番値を0で作る。

初期在庫は、その店舗の在庫がまだ1件も無いときに限って作る。すでに在庫がある店舗では作り直さない。

### 保存後の戻り先

保存できたときは、登録・更新した店舗を選んだ状態の画面へ戻す。新しく登録した店舗も、そのまま続けて編集できる状態になる。

### カナ項目の変換

会社名(カナ)・店名(カナ)は、ひらがなで入力しても全角カタカナへ直して保存する。濁点・半濁点は1文字にまとめる。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 店舗の入力項目、ショップアイコンの画像ファイル |
| 成功時出力 | 保存の完了メッセージと、保存した店舗を選んだ状態の画面 |
| 失敗時出力 | 同じ画面での項目エラー、またはショップアイコンのエラー |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 入力の検証を通った店舗情報の保存 |
| 追加 | 新しい店舗の登録時の、注文番号・店頭注文番号の採番値 |
| 追加 | 初期在庫（作成を指定し、その店舗の在庫が1件も無いとき） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 管理画面上部 | 保存しました | 入力の検証を通って保存できたとき | 保存した店舗を選んだ状態の画面へ戻る |
| — | 管理画面上部 | ショップアイコンファイルを指定してください。 | ショップアイコンの画像を確定できないとき | 同じ画面に留まる |
| — | 入力項目付近 | (登録済みの店舗のショップ名略称)にて登録済の略称です。 | 店名略称(3文字)がほかの店舗で登録済みのとき | 同じ画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 登録と編集の切り替え | P2 | ec-cube:app/Customize/Controller/Admin/Integration/BranchController.php:63-79 |
| 登録と編集の切り替え | P2 | ec-cube:app/Customize/Form/Type/Admin/Integration/BranchManagementType.php:54-62 |
| 登録と編集の切り替え | P2 | ec-cube:app/template/admin/Integration/branch_management.twig:33-38 |
| 店名略称の重複禁止 | P1 | ec-cube:app/Customize/Form/Type/Admin/Integration/ShopDigitDuplicateValidator.php:28-36 |
| 店名略称の重複禁止 | P1 | ec-cube:app/Customize/Form/Type/Admin/Integration/BranchManagementType.php:143-155 |
| 店名略称の重複禁止 | P1 | ec-cube:app/Customize/Resource/locale/messages.ja.yaml:190 |
| 保存できないときの扱い | P1 | ec-cube:app/Customize/Controller/Admin/Integration/BranchController.php:114-126 |
| 保存できないときの扱い | P1 | ec-cube:app/Customize/Resource/locale/messages.ja.yaml:201 |
| ショップアイコンの差し替え | P2 | ec-cube:app/Customize/Controller/Admin/Integration/BranchController.php:163-188 |
| ショップアイコンの差し替え | P2 | ec-cube:app/Customize/Form/Type/Admin/Integration/BranchManagementType.php:262-271 |
| ショップアイコンの差し替え | P2 | ec-cube:app/config/eccube/packages/branch_config.yaml:25-28 |
| 登録完了時に作られるもの | P1 | ec-cube:app/Customize/Controller/Admin/Integration/BranchController.php:136-150 |
| 登録完了時に作られるもの | P1 | ec-cube:app/Customize/Entity/DtbOrderNumber.php:18-23 |
| 登録完了時に作られるもの | P1 | ec-cube:app/Customize/Entity/DtbOrderNo.php:18-23 |
| 保存後の戻り先 | P3 | ec-cube:app/Customize/Controller/Admin/Integration/BranchController.php:152-154 |
| 保存後の戻り先 | P3 | ec-cube:src/Eccube/Resource/locale/messages.ja.yaml:401 |
| カナ項目の変換 | P3 | ec-cube:app/Customize/Form/Type/Admin/Integration/BranchManagementType.php:351-381 |
| 入出力: 永続化 | P1 | ec-cube:app/Customize/Controller/Admin/Integration/BranchController.php:130-150 |
