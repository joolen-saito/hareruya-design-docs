/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントネット買取
機能：ネット買取商品一覧
課題カテゴリ：実装漏れ
課題：商品数が1の状態でマイナスボタンを押しても20に戻らない
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. http://localhost:8080/ja/purchase/search で買取商品一覧を表示する
2. 買取価格が500円以上の商品カードで商品数が1になっていることを確認する
3. マイナスボタンを押下し、商品数が20に変わるか確認する

# 期待される挙動【必須】
- マイナスボタン押下時、商品数を1つ減らす
- 商品数が1の場合にマイナスボタンを押下すると、商品数を20にする

# 現在の挙動【必須】
- ec-cube-enterprise の買取商品カードは `.purchase-detail-qty` に初期値1の hidden input と表示ラベルを持ち、マイナスボタンは `Block/js/Purchase/purchase_js.twig` のイベントで処理される。同イベントは `v > 1` の場合だけ減算し、コメントでも「1で止める」としているため、商品数1で押下しても20へ循環しない。

ec-cube-enterprise 買取商品カードの数量UI: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:42-52`
```twig
                {% if showQty %}
                    <div class="p-hareruya-product-card__quantity-controls purchase-detail-qty" data-stock="{{ purchaseCartMaxQtyPerLine|default(20) }}">
                        <button type="button" class="btn-minus c-hareruya-btn-quantity" aria-label="{{ 'front.product.decrease_qty'|trans }}">
                            <i class="icon-hareruya-minus c-hareruya-icon--xs" aria-hidden="true"></i>
                        </button>
                        <input type="hidden" class="qty-input" id="quantity_detail_{{ productClassId }}" value="1">
                        <span class="qty-label p-hareruya-product-card__quantity-input">1</span>
                        <button type="button" class="btn-plus c-hareruya-btn-quantity" aria-label="{{ 'front.product.increase_qty'|trans }}">
                            <i class="icon-hareruya-plus c-hareruya-icon--xs" aria-hidden="true"></i>
                        </button>
                    </div>
```

ec-cube-enterprise マイナスボタンは1で停止: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44-55`
```twig
    $(document).on('click', '.purchase_page .purchase-detail-qty .btn-minus', function () {
        const $c = $(this).closest('.purchase-detail-qty');
        const $inp = $c.find('.qty-input');
        const $lab = $c.find('.qty-label');
        let v = parseInt($inp.val(), 10) || 0;
        // 買取カートは1枚以上が前提のため、販売詳細の0下限とは合わせず1で止める
        if (v > 1) {
            v--;
            $inp.val(v);
            $lab.text(v);
        }
    });
```
- ベース実装 pf-eccube3 では、買取商品ブロックのマイナスボタンが `qty_spin(..., 'm', 20, 1)` を呼び出す。`qty_spin` は減算後に `qtyval < 1` かつ `min !== 0` の場合、`qtyval = max` とするため、1からマイナス押下で20へ循環する。

ベース実装 pf-eccube3 買取商品ブロックは qty_spin(..., 20, 1) を使用: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:24-33`
```twig
<div class="itemUserAct">
    {% if productSubClass.buyPrice >= app.config.HareruyaEc.const.purchase_min_price %}
        <div class="itemUserAct__number">
            <span class="itemUserAct__number__title">個数</span>
            <div class="itemUserAct__number__input">
                <button type="button" class="itemUserAct__number__input__button btn" onclick="qty_spin('qty[{{ productSubClass.productClass.id }}]','m',20,1);">－</button>
                <input type="text" id="quantity_{{ productSubClass.productClass.id }}" class="itemUserAct__number__input__amount form-control" stock_id="{{ productSubClass.productClass.id }}" min="0" max="20" value="1" name="qty[{{ productSubClass.productClass.id }}]">
                <button type="button" class="itemUserAct__number__input__button btn" onclick="qty_spin('qty[{{ productSubClass.productClass.id }}]','p',20,1);">+</button>
            </div>
        </div>
```

ベース実装 pf-eccube3 qty_spin は下限未満で max に戻す: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/ec.js:288-314`
```javascript
function qty_spin(qtyname, type, max = 999, min = 0) {
    var qtyval;
    qtyval = $('[name="'+qtyname+'"]').val();

    if (isNaN(qtyval)) {
        qtyval = 1;
    } else {
        qtyval = Math.floor(qtyval);
        if (type == 'p') {
            qtyval++;
        } else {
            qtyval--;
        }
    }

    if (qtyval < 1) {
        if (min === 0) {
            qtyval = 0;
        } else {
            qtyval = max;
        }
    } else if (qtyval > max) {
        qtyval = 1;
    }

    if (max === 0) {
        qtyval = 0;
```

# 根拠
- 設計：
  - 商品数が1の場合は20にする: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1838`
- ec-cube-enterprise：
  - 数量UIは20上限・1初期値: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:42-52`
  - マイナス処理は1で止める: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44-55`
- ベース実装：
  - pf-eccube3では qty_spin(..., 20, 1) を呼ぶ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:24-33`
  - pf-eccube3の qty_spin は下限未満で max に戻す: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/ec.js:288-314`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json#f05-03_0305_sheet-5_sheet-conformance-3737dafffede'`
- 確認コマンド: `rg -n "商品数が1|20にする|マイナス|btn-minus|purchase-detail-qty|qty_spin|1で止める|商品数を20|商品数を1つ減らす" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html ec-cube-enterprise/src/Eccube/Resource/template pf-eccube3/app/Plugin/HareruyaEc/Resource/template`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '1834,1840p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig | sed -n '39,53p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig | sed -n '28,55p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig | sed -n '24,33p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/ec.js | sed -n '288,314p'`
