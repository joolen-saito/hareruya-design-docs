# 受注管理 — 出荷指示：納品書印刷（日本語）

## 業務ロジック

### 納品書に出る受注と明細

指定した出荷指示リストが存在しないときは、納品書を作らず未検出として応答する。

出荷指示リストで選んだ受注のうち、次をすべて満たす受注だけが納品書に出る。満たさない受注は、選んでいても納品書に出ない。

- 会員情報とプレイヤー情報を持つ
- 配送先を持ち、その配送先に配送方法が設定されている
- 注文者の都道府県が設定されている

明細のうち、商品・商品規格・商品サブ情報・商品規格サブ情報のいずれかを持たないものは納品書に出ない。

配送先の都道府県または国が設定されていないときは納品書に出て、その欄だけが空になる。

国内配送か海外配送かは、配送先に設定された配送方法の区分だけで決まる。受注や配送先の国では変わらない。海外向けの区分を設定した配送方法の受注は英語の納品書だけに出る。配送方法にその区分が設定されていない受注は、日本語の納品書にも英語の納品書にも出ない。

出荷指示リストに含まれない受注を選択したときも、その受注の納品書を出す。選択した受注が出荷指示リストに属するかどうかは確かめない。

### 差出人・届け先の表示

| 条件 | 表示 |
| --- | --- |
| 都道府県が海外のとき | 国・地域名を郵便番号の上の行に出し、郵便番号の後ろに都道府県を出さない |
| 都道府県が海外以外のとき | 国・地域名を出さず、郵便番号の後ろに都道府県を出す |
| 会員番号の欄 | スマレジ会員IDを出す |
| 配送方法がスムーズ店頭受取のとき | 受取人署名の欄を見出しの右に出す |
| 配送方法がスムーズ店頭受取以外のとき | 受取人署名の欄を出さない |

郵便番号は、上 3 桁と下 4 桁がどちらも登録されているときだけ `-` でつなぐ。どちらかが欠けているときは、登録されている郵便番号をそのまま使う。電話番号は 3 つの電話番号値を区切り文字なしで連結する。氏名は姓と名の間に空白を 1 個入れ、後ろに敬称「様」を付ける。

会社の欄に出す情報は、受注の内容によって変わらない。

### 金額と明細の表示

お買上額の欄には受注の小計を出す。送料・手数料の欄には受注の送料と手数料を、発送方法の欄には配送方法の名称を出す。

消費税額は、受注の小計に送料と手数料を足し、値引きを引いた金額から算出する。

ポイント使用の欄には受注の値引き額を出し、単位として「ポイント」を付ける。ポイント数として計算した値ではない。値引きが 0 のときも 0 と出す。

明細行の合計は、価格に数量を掛けた金額とする。商品情報には受注したときの商品名を出す。受注のあとに商品名を変えたときも、納品書に出る商品名は変わらない。

金額は通貨記号「¥」を前に付け、3 桁ごとに区切って出す。ポイント使用の欄だけは、どちらも付けない。

### 改ページ

改ページしたあとのページの先頭では、見出し・ページ数・注文番号・受取人署名・お届け先・送り主・会社情報・金額の欄を出し直す。

## 入出力

### 出力: 納品書

出荷指示リスト編集画面で選んだ受注の日本語の納品書を、実行元の画面とは別のウィンドウに出力する。受注を複数選んだときは、受注ごとに納品書を続けて出す。

## 表示メッセージ

本機能は画面メッセージを持たない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 納品書に出る受注と明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:299-310 |
| 納品書に出る受注と明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:218-235 |
| 納品書に出る受注と明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:273-284 |
| 差出人・届け先の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:31-79 |
| 差出人・届け先の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:245-266 |
| 金額と明細の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:311-312 |
| 金額と明細の表示 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:92-141 |
| 金額と明細の表示 | P1 | pf-eccube3:src/Eccube/Twig/Extension/EccubeExtension.php:282-288 |
| 改ページ | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:20-129 |
| 出力: 納品書 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/edit.twig:57 |
| 出力: 納品書 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/shipping-standby.js:1-7 |
| 出力: 納品書 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:312-315 |
