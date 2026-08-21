# データ管理 — 買取価格対応表（編集）

## 業務ロジック

### 編集画面の表示

指定した買取価格対応表の行が無いときは表示しない。

カード状態は名称ではなくコード（NM・SP・MP・HP）で表示する。

Foil or Promotion Card? は YES / NO の2値で表示する。

### 保存の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 指定した買取価格対応表の行が存在するか | 無ければ保存しない |
| 2 | 送信情報が正当か | 不正なら保存せず、アクセスを拒否する |
| 3 | 入力が妥当か | 妥当でなければ保存せず、同じ編集画面を再表示する。成功メッセージは出さない |

### 更新の範囲

NM価格帯や割合による自動の再計算は行わない。

NM価格・カード状態・Foil or Promotion Card? は本画面では更新しない。入力欄にも出さないため、送信によって上書きされない。

他の表への連鎖した更新は行わない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 対象の買取価格対応表の行。保存時は買取価格と送信情報。 |
| 失敗時出力 | 対象が存在しないとき、送信情報が不正なときは処理しない。入力が妥当でないときは編集画面を再表示する。 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 買取価格対応表の買取価格の更新 | 保存 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M16-07-MSG-001 | 管理画面上部 | 登録が完了しました。 | 買取価格を更新したとき | 買取価格対応表（一覧）画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 編集画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BuyPriceListController.php:41-54 |
| 編集画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/BuyPriceList/buy_price_list_detail.twig:26 |
| 編集画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/BuyPriceList/buy_price_list_detail.twig:24 |
| 編集画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbCardConditionRepository.php:16-33 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BuyPriceListController.php:62-84 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:18-49 |
| 更新の範囲 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/BuyPriceList/BuyPriceListType.php:25-32 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/BuyPriceListController.php:80-81 |
