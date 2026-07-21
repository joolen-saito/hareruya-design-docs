/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：入荷待ち商品一覧
課題カテゴリ：実装漏れ
課題：入荷通知登録上限が拡張された旨の案内が表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 入荷通知登録がある会員で `http://localhost:8080/ja/mypage/notifylist` を表示し、一覧上部の案内文を確認する
2. 入荷通知登録がない会員でも同じURLを表示し、空表示時の案内文を確認する
3. いずれの場合も、入荷通知登録上限が拡張された旨の案内が表示されるか確認する

# 期待される挙動【必須】
- 入荷待ち商品一覧に、入荷時に登録メールアドレスへ通知する旨の案内を表示する
- 入荷通知登録の上限が拡張された旨の案内を表示する
- 上限拡張案内は、一覧がある場合・ない場合のいずれでも表示する

# 現在の挙動【必須】
- ec-cube-enterprise の `notifylist.twig` は、入荷通知登録がある場合に `front.mypage.notifylist.body` だけを表示し、登録がない場合に `front.mypage.notifylist.empty` だけを表示する。`messages.ja.yaml` の `front.mypage.notifylist.*` / `front.product_request.*` には通常案内、空表示、上限到達エラーはあるが、上限が拡張された旨の案内文言は存在しない。

ec-cube-enterprise notifylist の案内表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/notifylist.twig:24-33`
```twig
        <div class="p-hareruya-notifylist__title">
            <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.nav__notifylist'|trans }}</h1>
            {% if ProductRequests|length > 0 %}
                <p class="c-hareruya-text">{{ 'front.mypage.notifylist.body'|trans }}</p>
            {% else %}
                <div class="p-hareruya-message-box--info">
                    <p>{{ 'front.mypage.notifylist.empty'|trans }}</p>
                </div>
            {% endif %}
        </div>
```

ec-cube-enterprise notifylist/product_request locale: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:952-964`
```yaml
front.mypage.notifylist.body: 下記の商品が入荷した際、ご登録されているメールアドレスにお知らせをお送りいたします。
front.mypage.notifylist.empty: 入荷待ち商品はありません。
front.mypage.notifylist.notify_all_label: まとめて入荷通知
front.mypage.notifylist.notify_remove: 解除

front.product_request.success: 入荷通知を設定しました
front.product_request.cancel: 入荷通知を解除しました
front.product_request.failed: 入荷通知依頼に失敗しました
front.product_request.confirm.request.title: 入荷通知
front.product_request.confirm.request.message: 入荷通知依頼を行いますか?
front.product_request.confirm.cancel.title: 入荷通知をキャンセル
front.product_request.confirm.cancel.message: 入荷通知依頼をキャンセルしますか?
front.product_request.over_request_count.message: 入荷通知登録上限数に達してしまうため登録できません
```
- ベース実装 pf-eccube3 の `notify_request_list.twig` は、一覧がある場合も空の場合も、通常案内/空表示に続けて `NEW！もっと便利に。入荷通知の登録上限が20件から100件に増えました` を赤字で表示している。

ベース実装 pf-eccube3 一覧あり/なし両方の上限拡張案内: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:29-38`
```twig
        {% if list.count %}
            <p class="message_">下記の商品が入荷した際、ご登録されているメールアドレスにお知らせをお送りいたします。</p>
            <p class="message_" style="font-size: 14px; color: red">NEW！もっと便利に。入荷通知の登録上限が20件から100件に増えました</p>
            <div class="navipage_ top_">
                <span class="count_number">{{ list.count }}</span><span>件あります</span>
            </div>
        {% else %}
            <p class="message_">入荷待ち商品はありません。</p>
            <p class="message_" style="font-size: 14px; color: red">NEW！もっと便利に。入荷通知の登録上限が20件から100件に増えました</p>
        {% endif %}
```

ベース実装 pf-eccube3 notifylist ルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:123-124`
```php
        $c->match('/mypage/notifylist', '\Plugin\HareruyaEc\Controller\Mypage\MypageController::notifyList')
            ->bind('mypage_notifylist');
```

# 根拠
- 設計：
  - 表示要素として上限拡張案内を要求し、一覧あり/なし両方で表示すると規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3037-3039`
  - 業務ルールでも登録上限拡張案内を定義: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3048-3049`
- ec-cube-enterprise：
  - 一覧あり時は通常案内のみ、空時は空メッセージのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/notifylist.twig:24-33`
- ベース実装：
  - pf-eccube3は一覧あり/なし両方に上限拡張案内を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:29-38`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-08_0306_sheet-8_sheet.json#f06-08_0306_sheet-8_sheet-conformance-b70b98c3f6fb'`
- 確認コマンド: `rg -n "入荷通知|入荷待ち|上限|拡張|登録上限|通知登録|notifylist|over_request|product_request" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Controller/Front/Mypage pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml`
- 確認コマンド: `rg -n "登録上限が20件から100件|もっと便利|入荷通知の登録上限|入荷待ち商品一覧|notify_request_list|notifylist" pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider pf-eccube3/app/Plugin/HareruyaEc/Controller pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/notifylist.twig`
- 確認コマンド: `rg -n "入荷通知登録の上限|登録上限|20件から100件|もっと便利|上限が拡張|拡張された旨|入荷通知.*上限" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '3028,3051p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/notifylist.twig | sed -n '1,80p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '944,966p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig | sed -n '1,48p'`
