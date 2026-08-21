# 受注管理 — 納品書印刷（日本語）

## 業務ロジック

### 納品書に出る受注と明細

選んだ受注のうち、次をすべて満たす受注だけが納品書に出る。満たさない受注は、選んでいても納品書に出ない。

- 会員情報とプレイヤー情報を持つ
- 配送先を持ち、その配送先に配送方法が設定されている
- 注文者の都道府県が設定されている

国内配送か海外配送かは、受注に紐づく配送方法へ設定された区分だけで決まる。受注や配送先の国では変わらない。配送方法にその区分が設定されていない受注は、日本語の納品書にも英語の納品書にも出ない。

明細のうち、商品・商品規格・商品サブ情報・商品規格サブ情報のいずれかを持たないものは納品書に出ない。

配送先の都道府県または国が設定されていないときは納品書に出て、その欄だけが空になる。

同じ受注を複数回選んだときも、納品書は 1 回だけ出す。配送先を複数持つ受注でも、数量の合計は受注単位で 1 つにまとめる。

受注一覧から実行したときは、選んだ受注が 1 件も存在しなければ納品書を作らず未検出として応答する。出荷指示リストから実行したときは、指定した出荷指示リストが存在しなければ未検出として応答する。

### 差出人・届け先の表示

| 条件 | 表示 |
| --- | --- |
| 都道府県が海外のとき | 国・地域名を郵便番号の上の行に出し、郵便番号の後ろに都道府県を出さない |
| 都道府県が海外以外のとき | 国・地域名を出さず、郵便番号の後ろに都道府県を出す |
| 会員番号の欄 | スマレジ会員IDを出す |
| 配送方法がスムーズ店頭受取のとき | 受取人署名の欄を見出しの右に出す |
| 配送方法がスムーズ店頭受取以外のとき | 受取人署名の欄を出さない |

会社の欄に出す会社名・郵便番号・住所・建物名・電話番号・URL・メールアドレスは、受注の内容によって変わらない。

郵便番号は、上 3 桁と下 4 桁がどちらも登録されているときだけ `-` でつなぐ。どちらかが欠けているときは、登録されている郵便番号をそのまま使う。電話番号は 3 つの電話番号値を区切り文字なしで連結する。氏名は姓と名の間に空白を 1 個入れ、後ろに敬称「様」を付ける。

### 金額と明細の表示

消費税額は、受注の小計に送料と手数料を足し、値引きを引いた金額から算出する。

ポイント使用の欄には受注の値引き額を出し、単位として「ポイント」を付ける。ポイント数として計算した値ではない。値引きが 0 のときも 0 と出す。

明細行の合計は、価格に数量を掛けた金額とする。商品情報には受注したときの商品名を出す。受注のあとに商品名を変えたときも、納品書に出る商品名は変わらない。

金額は通貨記号「¥」を前に付け、3 桁ごとに区切って出す。ポイント使用の欄だけは、どちらも付けない。

### 改ページ

改ページしたあとのページの先頭では、見出し・注文番号・受取人署名・お届け先・送り主・会社情報・金額の欄を出し直す。

## 入出力

### 出力: 納品書

受注一覧・出荷指示リストのどちらから実行したときも、対象に選ばれた受注の納品書を、実行元の画面とは別のウィンドウに出力する。対象の受注が複数のときは、受注ごとに納品書を続けて出す。

## 表示メッセージ

本機能は画面メッセージを持たない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 納品書に出る受注と明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:210-260 |
| 納品書に出る受注と明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/OrderController.php:282-292 |
| 納品書に出る受注と明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:299-311 |
| 差出人・届け先の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:31-79 |
| 差出人・届け先の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:68-79 |
| 差出人・届け先の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:243-272 |
| 金額と明細の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:81-142 |
| 金額と明細の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:305-312 |
| 改ページ | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:20-128 |
| 出力: 納品書 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Block/js/order_index_js.twig:139-147 |
| 出力: 納品書 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:299-315 |
| 出力: 納品書 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/shipping-standby.js:1-7 |
