# 店舗設定 — 店舗基本設定（SHOPマスター/旧ショップマスター）

## 業務ロジック

### 初期表示

保存済みの店舗基本情報を読み、各入力欄に初期表示する。

### 保存の判定

| 判定 | 結果 |
|------|------|
| 入力の検証に成功したとき | 店舗基本情報を保存し、店舗基本設定画面を開き直す |
| 入力の検証に失敗したとき | 保存せず、同じ画面を再表示して該当項目の近傍にエラーを表示する |

入力の検証に失敗して再表示したときは、画面の見出しなどに出る店舗名は保存済みの内容のままで、入力中の値は反映されない。

### 郵便番号・住所の入力

住所の欄は、郵便番号・都道府県・市区町村名・番地・ビル名に分かれる。

| 欄 | 入力のふるまい |
|------|------|
| 郵便番号 | 3桁と4桁の2欄に分けて入力する。数字以外を入れたとき、または桁数が3桁・4桁でないときは保存しない |
| 都道府県 | 一覧から選ぶ |
| 市区町村名 | 32文字を超えると保存しない |
| 番地・ビル名 | 32文字を超えると保存しない |

郵便番号を入力すると、都道府県と市区町村名の欄が自動で埋まる。番地・ビル名の欄は埋まらない。

### 電話番号・FAX番号の入力

電話番号・FAX番号は、それぞれ3つの欄に分けて入力する。

| 条件 | 結果 |
|------|------|
| いずれかの欄に数字以外を入れたとき | 保存しない |
| いずれかの欄が5桁を超えるとき | 保存しない |
| 3つの欄のうち一部だけを入力したとき | 保存しない。3つとも入力するか、3つとも空にする |

全角で入力された英数字は半角に直してから判定する。

### フリガナの入力

会社名(フリガナ)・店名(フリガナ)は、入力されたひらがなをカタカナに直してから受け付ける。直したあとに全角カタカナ・半角カタカナ・長音記号以外の文字が残るときは保存しない。

### メールアドレスの入力

メールアドレスの各欄は、メールアドレスの形式でないときは保存しない。

### 地図設定の入力

| 項目 | 受け付ける範囲 |
|------|------|
| 緯度 | -90 から 90 まで。小数点以下は6桁まで |
| 経度 | -180 から 180 まで。小数点以下は6桁まで |

範囲や桁数を外れる値を入力したときは保存しない。

### 送料無料条件の入力

送料無料条件(金額)は数字だけを受け付け、8桁を超えると保存しない。画面には3桁ごとの区切りを付けて表示する。

送料無料条件(数量)も数字だけを受け付ける。

### 文字数の上限

| 項目 | 上限 |
|------|------|
| 会社名・会社名(フリガナ)・店名・店名(フリガナ)・店舗営業時間 | 50文字 |
| 店名(英語表記) | 200文字 |
| 取扱商品・メッセージ | 99999文字 |

上限を超える文字数を入力したときは保存しない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | なりすまし対策トークンと、画面の各欄に入力された店舗基本情報 |
| 出力 | 保存の可否に応じて店舗基本設定画面を再表示する |

### 入出力: 永続化

| 操作 | 契機 |
|------|------|
| 更新 | 入力の検証に成功したとき。店舗基本情報 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M10-01-MSG-001 | 管理画面上部 | 保存しました | 店舗基本設定を保存したとき | 店舗基本設定画面に遷移する |
| M10-01-MSG-002 | 入力項目直下 | 半角英数字で入力してください。 | 店名（英語表記）に使用できない文字を入力して保存したとき | 店舗基本設定画面に留まる |
| M10-01-MSG-003 | 入力項目直下 | 半角英数字で入力してください。 | 住所（英語表記）に使用できない文字を入力して保存したとき | 店舗基本設定画面に留まる |
| M10-01-MSG-004 | 入力項目直下 | 半角英数字で入力してください。 | ショップ名略称（英語表記）に使用できない文字を入力して保存したとき | 店舗基本設定画面に留まる |
| M10-01-MSG-005 | 入力項目直下 | 数字で入力してください。 | スマレジ店舗IDに数字以外を入力して保存したとき | 店舗基本設定画面に留まる |
| M10-01-MSG-006 | 入力項目直下 | 半角英数字で入力してください。 | スマレジ店舗コードに使用できない文字を入力して保存したとき | 店舗基本設定画面に留まる |
| M10-01-MSG-007 | 入力項目直下 | 数字で入力してください。 | 送料無料条件（数量）に数字以外を入力して保存したとき | 店舗基本設定画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P3 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:37 |
| 保存の判定 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:58 |
| 保存の判定 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:76 |
| 郵便番号・住所の入力 | P3 | pf-eccube3:src/Eccube/Form/Type/ZipType.php:95 |
| 郵便番号・住所の入力 | P3 | pf-eccube3:src/Eccube/Form/Type/AddressType.php:102 |
| 郵便番号・住所の入力 | P3 | pf-eccube3:src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:34 |
| 郵便番号・住所の入力 | P3 | pf-eccube3:src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:77 |
| 電話番号・FAX番号の入力 | P3 | pf-eccube3:src/Eccube/Form/Type/TelType.php:94 |
| 電話番号・FAX番号の入力 | P3 | pf-eccube3:src/Eccube/Form/Type/TelType.php:115 |
| 電話番号・FAX番号の入力 | P3 | pf-eccube3:src/Eccube/EventListener/ConvertKanaListener.php:11 |
| フリガナの入力 | P3 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:271 |
| フリガナの入力 | P3 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:288 |
| メールアドレスの入力 | P1 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:99 |
| 地図設定の入力 | P3 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:247 |
| 送料無料条件の入力 | P2 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:151 |
| 送料無料条件の入力 | P2 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:168 |
| 文字数の上限 | P3 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:47 |
| 文字数の上限 | P3 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:213 |
| 文字数の上限 | P3 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:131 |
| 文字数の上限 | P3 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:99 |
| 入出力: 永続化 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:59 |
