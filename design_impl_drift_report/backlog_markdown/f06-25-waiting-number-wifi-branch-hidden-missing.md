/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：店頭注文呼び出し番号表示
課題カテゴリ：実装漏れ
課題：支店の店頭注文呼び出し番号画面でもWiFiパスワードが表示される
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 支店URL `http://localhost:8080/ja/{支店名(英)}/waiting_number` を表示する
2. 画面下部のWiFiパスワード表示欄を確認する
3. 本店以外でも `hareruya{mm}{dd}` 形式のWiFiパスワードが表示されていないか確認する

# 期待される挙動【必須】
- WiFiパスワードは本店の店頭注文呼び出し番号画面にのみ表示する
- 支店の店頭注文呼び出し番号画面ではWiFiパスワードを非表示にする
- パスワード形式は本店表示時のみ `hareruya{mm}{dd}` とする

# 現在の挙動【必須】
- ec-cube-enterprise の `Waiting/waiting_number.twig` は `#wifi` セクションを店舗条件なしで常時描画している。直前コメントには『本店のみWifi表示するようにする』というTODOが残っており、`isMainShop` 等の条件分岐はWiFiブロックに適用されていない。

ec-cube-enterprise waiting_number.twig はWiFiブロックを無条件描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43-53`
```twig
            {# TODO: ECCUBE_HARERUYA-182 店頭注文呼び出し番号表示 店舗切り替えができるようになったら修正
               TODO: 本店のみWifi表示するようにする #}
            <section id="wifi" class="p-hareruya-waiting-number__wifi">
                <div class="p-hareruya-waiting-number__wifi-inner">
                    <div class="p-hareruya-waiting-number__wifi-left">
                        <img class="p-hareruya-waiting-number__wifi-icon" src="{{ asset('assets/hareruya/img/otc/icon-wifi.webp') }}" alt="">
                        <span class="p-hareruya-waiting-number__wifi-label">Wi-Fi Password</span>
                    </div>
                    <div class="p-hareruya-waiting-number__wifi-text wifiText"></div>
                </div>
            </section>
```

ec-cube-enterprise waiting_monitor.js はwifiTextへ無条件書き込み: `ec-cube-enterprise/html/template/default/assets/js/waiting_monitor.js:13-30`
```javascript
        // TODO: ECCUBE_HARERUYA-182 店頭注文呼び出し番号表示 店舗切り替えができるようになったら修正
        // TODO: 本店のみWifi表示するようにする
        const toDoubleDigits = function (num) {
            num += "";
            if (num.length === 1) {
                num = "0" + num;
            }
            return num;
        };

        const month = toDoubleDigits(now.getMonth() + 1);
        const day = toDoubleDigits(now.getDate());

        $(".wifiText").text("hareruya" + month + day);
	}

	setInterval(passUpdate, 10800000);
	passUpdate();
```

ec-cube-enterprise はisMainShopをTwigグローバルとして提供済み: `ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:67-69`
```php
        $shop = $this->baseInfoService->getByRequestShop();
        $this->twig->addGlobal('BaseInfo', $shop);
        $this->twig->addGlobal('isMainShop', $shop->isMainShop());
```
- ベース実装 pf-eccube3 は旧実装として `#wifi` と `.wifiText` を無条件表示・更新している。設計書はこの現行支店表示を除去するカスタマイズ要求を追加しているが、ec-cube-enterprise 側は同じ旧挙動のままTODO付きで残っている。

ベース実装 pf-eccube3 waiting_number.twig は旧実装としてWiFiブロックを無条件描画: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Waiting/waiting_number.twig:53-57`
```twig
        </section>
        <section id="wifi">
            <div class="wifiText"></div>
        </section>
    {% endblock main %}
```

ベース実装 pf-eccube3 waiting_monitor.js はwifiTextへ無条件書き込み: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/waiting_monitor.js:23-30`
```javascript
		var month = toDoubleDigits(now.getMonth() + 1);
		var day = toDoubleDigits(now.getDate());

		$(".wifiText").text("hareruya" + month + day);
	}

	setInterval(passUpdate, 10800000);
	passUpdate();
```

# 根拠
- 設計：
  - 本店では表示、支店では非表示: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7018-7021`
  - WiFiパスワードは本店のみ表示: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7030-7044`
  - 項目表でも本店のみ表示を指定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7066`
- ec-cube-enterprise：
  - WiFiセクションを無条件描画しTODOが残る: `ec-cube-enterprise/src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43-53`
  - JSがWiFiパスワードを無条件更新: `ec-cube-enterprise/html/template/default/assets/js/waiting_monitor.js:13-30`
- ベース実装：
  - pf-eccube3 は旧実装としてWiFiを無条件表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Waiting/waiting_number.twig:53-57`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json#f06-25_0306_sheet-21_sheet-conformance-fa0c06f76207'`
- 確認コマンド: `rg -n "fa0c06f76207|本店ではWiFi|支店ではWiFi|本店のみに表示|WiFiパスワード|赤枠|支店で表示" design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "wifi|WiFi|Wifi|wifiText|passUpdate|waiting_number|isMainShop|本店のみ|TODO|hareruya" ec-cube-enterprise/src/Eccube/Resource/template/default/Waiting/waiting_number.twig ec-cube-enterprise/html/template/default/assets/js/waiting_monitor.js ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php`
- 確認コマンド: `rg -n "wifi|WiFi|Wifi|wifiText|passUpdate|waiting_number|本店のみ|hareruya" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Waiting/waiting_number.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/waiting_monitor.js pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php ec-cube/app/template/default/Waiting/waiting_number.twig ec-cube/html/template/default/assets/js/waiting_monitor.js`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7018,7021p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7030,7044p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7066,7066p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Waiting/waiting_number.twig | sed -n '43,53p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/html/template/default/assets/js/waiting_monitor.js | sed -n '13,30p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Waiting/waiting_number.twig | sed -n '53,57p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/waiting_monitor.js | sed -n '23,30p'`
