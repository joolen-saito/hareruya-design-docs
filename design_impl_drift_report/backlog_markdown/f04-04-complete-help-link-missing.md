/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：決済~購入完了
課題カテゴリ：実装漏れ
課題：購入完了画面にヘルプページへのリンクが表示されない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. 商品をカートに入れ、http://localhost:8080/ja/shopping から注文を完了する
2. 購入完了画面（/ja/shopping/complete）を表示する
3. 注文完了メールが届かない場合の案内または画面部品として、ヘルプページへ遷移するリンクが表示されるか確認する

# 期待される挙動【必須】
- 購入完了画面に「ヘルプページ」リンクを表示する
- ヘルプページリンクを押下するとヘルプ画面へ遷移する
- 注文完了メールが届かない場合は、ヘルプページを参照する案内を表示する

# 現在の挙動【必須】
- ec-cube-enterprise の購入完了画面は、通常注文時の本文として `front.shopping.complete_message__body` を表示するが、ロケール本文は「お問い合わせください」という案内のみで、ヘルプページへのリンクを含まない。テンプレートの操作領域にもヘルプページリンクはなく、表示されるリンクは TOP へ戻るボタンのみ。

ec-cube-enterprise 購入完了画面本文と操作領域: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig:109-127`
```twig
                {% if waitingNumber %}
                    <div class="p-hareruya-complete__text-wrap">
                        <p class="c-hareruya-text">{{ 'front.shopping.complete_message__waiting_number_message'|trans|nl2br }}</p>
                    </div>
                {% else %}
                    <div class="p-hareruya-complete__text-wrap">
                        <p class="c-hareruya-text">{{ 'front.shopping.complete_message__body'|trans|nl2br }}</p>
                    </div>
                {% endif %}
                {% if Order.complete_message is not empty %}
                    <div class="p-hareruya-complete__text-wrap">
                        {{ Order.complete_message|raw|purify }}
                    </div>
                {% endif %}
                <div class="p-hareruya-complete__actions">
                    <a class="c-hareruya-btn c-hareruya-btn--lg u-hareruya-w-full" href="{{ isOtcGroup and shopTopUrl ? shopTopUrl : url('homepage') }}">
                        <span class="c-hareruya-btn__text">{{ 'front.shopping.complete.go_to_top'|trans }}</span>
                    </a>
                </div>
```

ec-cube-enterprise 日本語完了本文はヘルプリンクなし: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1517-1520`
```yaml
front.shopping.complete_message__title: ご注文ありがとうございました
front.shopping.complete_message__body: |
  ただいま、ご注文の確認メールをお送りさせていただきました。
  万一、ご確認メールが届かない場合は、トラブルの可能性もありますので大変お手数ではございますがお問い合わせくださいますようお願いいたします。
```

ec-cube-enterprise 英語完了本文もヘルプリンクなし: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1319-1322`
```yaml
front.shopping.complete_message__title: Thank you for your order!
front.shopping.complete_message__body: |
  We have sent an order confirmation email.
  In case you do not receive it, please contact us as your order may have not been received.
```
- ベース実装 pf-eccube3 では、通常注文の購入完了メッセージ内に「ヘルプページ」リンクを直接表示し、`/ja/user_data/help_onlineshop#block20` へ遷移する。

ベース実装 pf-eccube3 購入完了画面のヘルプページリンク: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:49-53`
```twig
                    {% else %}
                    <p class="ec-cart__orderComplete__text ec-cart__orderComplete__text--net">
                        注文完了メールをお送りしました。
                        <br>届かない場合はお手数ですが当店の<a href="/ja/user_data/help_onlineshop#block20">ヘルプページ</a>を御覧ください。
                    </p>
```

# 根拠
- 設計：
  - ヘルプページリンク部品: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2462`
  - 注文完了メール未着時のヘルプページ案内: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2479`
- ec-cube-enterprise：
  - 完了本文と操作領域にヘルプリンクがない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig:109-127`
- ベース実装：
  - pf-eccube3ではヘルプページリンクを表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:49-53`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-04_0304_sheet-7_sheet.json#f04-04_0304_sheet-7_sheet-conformance-2a6eb290d271'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for ヘルプページ and ヘルプ画面 ... PY`
- 確認コマンド: `rg -n "ヘルプページ|ヘルプ|help_onlineshop|help|user_data/help|go_to_top|complete_message__body|complete_message" ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.en.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.en.yml`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig | sed -n '93,127p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '1517,1524p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig | sed -n '44,54p'`
