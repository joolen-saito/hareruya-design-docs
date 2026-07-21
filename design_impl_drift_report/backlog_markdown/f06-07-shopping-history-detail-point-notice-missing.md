/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：注文購入履歴詳細
課題カテゴリ：実装漏れ
課題：購入履歴詳細に獲得ポイントの有効化タイミング注記が表示されない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. 注文履歴を持つ会員で `http://localhost:8080/ja/mypage/shopping_history` を表示する
2. 任意の注文の詳細リンクから `http://localhost:8080/ja/mypage/shopping_history_detail/{order_id}` に遷移する
3. 金額内訳の「ポイント発生」付近に「※獲得ポイントは商品出荷時に有効になります。」が表示されるか確認する

# 期待される挙動【必須】
- 購入履歴詳細の表示時に、ポイント注記「※獲得ポイントは商品出荷時に有効になります。」を常時表示する
- 注記は獲得ポイント/ポイント発生の説明として表示する

# 現在の挙動【必須】
- ec-cube-enterprise の購入履歴詳細 `shopping_history_detail.twig` は、`front.mypage.shopping_history.col.point_generated` のラベルと `Order.gained_points` の値を表示するだけで、その直後にポイント注記を描画していない。`front.shopping.notice.point` の翻訳キーは存在するが、使用箇所は購入確認画面 `Shopping/index.twig` であり、購入履歴詳細テンプレートでは参照されていない。Controller も `Order` と `stockOrder` だけを返しており、注記用の値やメッセージを渡していない。

ec-cube-enterprise 購入履歴詳細のポイント発生表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:222-228`
```twig
                                            {# 店頭受取 の場合非表示 #}
                                            {% if not Order.isOtcAwaitingPickup %}
                                                <div class="p-hareruya-order-list__summary-item">
                                                    <span class="p-hareruya-order-list__summary-item-label">{{ 'front.mypage.shopping_history.col.point_generated'|trans }}</span>
                                                    <span class="p-hareruya-order-list__summary-item-value">{{ Order.gained_points }}{{ 'front.block.point.unit'|trans }}</span>
                                                </div>
                                            {% endif %}
```

ec-cube-enterprise 注記キーは購入確認画面でのみ使用: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:755-757`
```twig
                            <div class="p-hareruya-shipping__summary-notice" role="note">
                                <p class="p-hareruya-shipping__summary-notice-text"><strong class="u-hareruya-font-bold">{{ 'front.shopping.notice.point'|trans }}</strong></p>
                                <p class="p-hareruya-shipping__summary-notice-text">{{ 'front.shopping.notice.stock'|trans }}</p>
```

ec-cube-enterprise 注記文言の翻訳キー: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1421-1428`
```yaml
front.shopping.order_summary_title: ご注文内容の確認
front.shopping.remarks.confirm: 上記、ご注文内容で注文を確定します。
front.shopping.remarks.request: ご注文内容に関してのご要望がございましたら下記備考欄にご記入ください。
front.shopping.remarks.combined_note: 配送方法【同梱】をお選びいただいた場合は同梱先の「注文番号」をご記入ください。
front.shopping.remarks.other_notes_prefix: その他の注意事項は
front.shopping.remarks.other_notes_link: こちら
front.shopping.notice.point: ※獲得ポイントは商品出荷時に有効になります。
front.shopping.notice.stock: ※在庫状況や諸事情により、ご希望に添えない場合がございます。
```

ec-cube-enterprise 詳細Controllerは注記値を渡していない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:482-514`
```php
    #[Route(path: '/mypage/shopping_history_detail/{order_id}', requirements: ['order_id' => '\d+'], name: 'mypage_shopping_history_detail', methods: ['GET'])]
    #[Template(template: 'Mypage/shopping_history_detail.twig')]
    public function shoppingHistoryDetail(Request $request, int $order_id): array
    {
        $this->entityManager->getFilters()
            ->enable('incomplete_order_status_hidden');
        $Order = $this->orderRepository->findOneBy(
            [
                'id' => $order_id,
                'Customer' => $this->getUser(),
            ]
        );

        if ($Order === null) {
            throw new NotFoundHttpException();
        }

        // 購入履歴判定用: 他受注の next_order_id 逆引き結果を Order にセット
        $this->orderRepository->applyPredecessorFlagsToOrders([$Order]);

        $stockOrder = true;
        foreach ($Order->getOrderItems() as $orderItem) {
            if ($orderItem->isProduct() && $orderItem->getQuantity() < 0) {
                $stockOrder = false;
                break;
            }
        }

        return [
            'Order' => $Order,
            'stockOrder' => $stockOrder,
        ];
    }
```
- ベース実装 pf-eccube3 の購入履歴詳細は、ポイント発生行の直後に `※獲得ポイントは商品出荷時に有効になります。` を `<span class="small_">` で表示している。設計の注記はこのベース実装の表示を踏襲する要求として確認できる。

ベース実装 pf-eccube3 ポイント発生と注記: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:105-111`
```twig
                                        <tr>
                                            <th>ポイント発生</th>
                                            <td>{% if orderSub is not null and orderSub.gainedPoints != 0 %}{{ orderSub.gainedPoints|number_format }}{% else %}0{% endif %} ポイント</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" class="nocell_"><span class="small_">※獲得ポイントは商品出荷時に有効になります。</span></td>
                                        </tr>
```

# 根拠
- 設計：
  - フロント挙動で獲得ポイント注記の表示を要求: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:3290-3292`
  - 表示メッセージ表で詳細画面表示時の常時表示として定義: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:3304-3306`
- ec-cube-enterprise：
  - 購入履歴詳細はポイント発生値のみで注記を出力しない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:222-228`
- ベース実装：
  - pf-eccube3はポイント発生の直後に注記を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:105-111`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-07_0304_sheet-9_sheet.json#f06-07_0304_sheet-9_sheet-conformance-201244ef1a45'`
- 確認コマンド: `rg -n "獲得ポイント|商品出荷時|有効になります|ポイント発生|point_generated|front\.shopping\.notice\.point|notice\.point" hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html | sed -n '3288,3308p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig | sed -n '200,232p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig | sed -n '752,758p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '1418,1430p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php | sed -n '482,522p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig | sed -n '88,116p'`
