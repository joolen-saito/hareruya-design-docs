/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：マイページ
課題カテゴリ：実装違い
課題：マイページの会員バーコードが各会員のスマレジ会員コードではなく固定値で表示される
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. スマレジIDを持つ会員で `http://localhost:8080/ja/mypage` にログインする
2. マイページ上部のバーコード表示を確認する
3. 別のスマレジIDを持つ会員でも同じ画面を表示し、生成されるバーコード値が会員ごとに変わるか確認する

# 期待される挙動【必須】
- マイページのバーコードは、店頭POSで会員本人を識別できる値を表示する
- 店頭受取注文時にバーコードを読み取ると、スマレジと連携して会員の注文履歴登録とポイント付与に利用できる
- バーコード値は各会員のスマレジ会員コードから生成する

# 現在の挙動【必須】
- ec-cube-enterprise のマイページは `Mypage/index.twig` で `Block/js/point_barcode_js.twig` を読み込み、同JSでバーコードを生成する。しかし `Customer.getSmaregiMemberCode` を使う行は Twig コメントアウトされ、実際には全会員共通の固定値 `2900065596792` を `jquery-barcode` に渡している。`Customer::getSmaregiMemberCode()` にはスマレジIDからEAN13の会員コードを生成する実装があるが、バーコード描画では使われていない。

ec-cube-enterprise マイページでバーコードJSを読み込む: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:17-23`
```twig
{% block javascript %}
<script src="{{ asset('assets/js/vendor/jquery.simple.timer.js') }}"></script>
<script src="{{ asset('assets/js/vendor/jquery-barcode.min.js') }}"></script>
{# TODO: ECCUBE_HARERUYA-164 マイページ 別紙「0303_基本設計仕様書(フロント_商品)」のシート「商品リコメンド」実装時に追加する #}
{#{% include 'Block/js/recommend_js.twig' with {'recommend_type': 'mypage'} %}#}
{% include 'Block/js/point_barcode_js.twig' %}
{% include 'Block/_top_page_scripts.twig' %}
```

ec-cube-enterprise バーコード値が固定値: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:21-24`
```twig
    $(function() {
        {#$("#js-ec_point_barcode").barcode('{{ Customer.getSmaregiMemberCode }}', "ean13", { barWidth:2, fontSize:14 });#}
        $("#js-ec_point_barcode").barcode('2900065596792', "ean13", { barWidth:2, fontSize:14 });
    });
```

ec-cube-enterprise Customerにはスマレジ会員コード生成メソッドがある: `ec-cube-enterprise/src/Eccube/Entity/Customer.php:1069-1088`
```php
        /**
         * スマレジ会員コード(EAN13)を生成して返す.
         *
         * 固定番号(29) + ゼロ埋めした smaregi_id + チェックデジット の13桁文字列.
         * smaregi_id が未設定の場合は生成できないため空文字を返す.
         */
        public function getSmaregiMemberCode(): string
        {
            $Player = $this->getPlayer();
            if ($Player === null) {
                return '';
            }

            $smaregiId = $Player->getSmaregiId();
            if ($smaregiId === null || $smaregiId === '') {
                return '';
            }

            return self::buildSmaregiMemberCode($smaregiId);
        }
```

ec-cube-enterprise DtbPlayer側のスマレジ会員コード生成は空文字返却: `ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:532-545`
```php
    public function getSmaregiMemberCode(): string
    {
        // $app = \Eccube\Application::getInstance();

        // $fixNo = $app['config']['HareruyaEc']['const']['smaregi']['customer_code']['fix_no'];
        // $customerCodeLength = $app['config']['HareruyaEc']['const']['smaregi']['customer_code']['length'];
        // $zeroPaddingLength = $customerCodeLength - count(str_split($fixNo)) - 1;

        // $strNum = $fixNo . sprintf("%0{$zeroPaddingLength}d", $this->getSmaregiId());

        // return $strNum . StringUtil::calcCheckDigit($strNum);

        return '';
    }
```
- ベース実装 pf-eccube3 では、マイページに `js-ec_point_barcode` の表示領域を置き、`Block/js/point_barcode_js.twig` で `player.getSmaregiMemberCode` を `jquery-barcode` に渡している。`DtbPlayer::getSmaregiMemberCode()` は固定番号、ゼロ埋めした `smaregiId`、チェックデジットから会員ごとのEAN13を返す。

ベース実装 pf-eccube3 マイページのバーコード表示領域: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:26-31`
```twig
            <div class="ec-transPoint-barcode">
                <div class="ec-transPoint-barcode__numberWrapper"><span class="ec-transPoint-barcode__number">会員番号 {{ player.smaregiId }}</span></div>
                <div class="ec-transPoint-barcode__inner">
                    <div id="js-ec_point_timer" class="ec-transPoint-barcode__inner__time" data-minutes-left="5"></div>
                    <div id="js-ec_point_barcode" class="ec-transPoint-barcode__inner__barcode"></div>
                    <div class="ec-transPoint-barcode__inner__notice">※ バーコードは<span>画面を明るくして</span>ご提示ください</div>
```

ベース実装 pf-eccube3 会員ごとのスマレジ会員コードをバーコード化: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/point_barcode_js.twig:11-13`
```twig
    $(function() {
        $("#js-ec_point_barcode").barcode('{{ player.getSmaregiMemberCode }}', "ean13", { barWidth:2, fontSize:14 });
    });
```

ベース実装 pf-eccube3 スマレジ会員コード生成: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbPlayer.php:934-945`
```php
    public function getSmaregiMemberCode()
    {
        $app = \Eccube\Application::getInstance();

        $fixNo = $app['config']['HareruyaEc']['const']['smaregi']['customer_code']['fix_no'];
        $customerCodeLength = $app['config']['HareruyaEc']['const']['smaregi']['customer_code']['length'];
        $zeroPaddingLength = $customerCodeLength - count(str_split($fixNo)) - 1;

        $strNum = $fixNo . sprintf("%0{$zeroPaddingLength}d", $this->getSmaregiId());

        return $strNum . StringUtil::calcCheckDigit($strNum);
    }
```

# 根拠
- 設計：
  - バーコードを店頭読み取りしスマレジ連携・注文履歴登録・ポイント付与に使う: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2653-2655`
  - 画面部品5はバーコードとして定義される: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2660-2670`
- ec-cube-enterprise：
  - 会員コード生成呼び出しはコメントアウトされ、固定値を描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:21-24`
  - CustomerにはスマレジIDから会員コードを生成するメソッドがある: `ec-cube-enterprise/src/Eccube/Entity/Customer.php:1075-1087`
- ベース実装：
  - pf-eccube3は会員ごとのスマレジ会員コードをバーコード化する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/point_barcode_js.twig:11-13`
  - pf-eccube3はsmaregiIdからチェックデジット付き会員コードを生成する: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbPlayer.php:934-945`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-05_0306_sheet-7_sheet.json#f06-05_0306_sheet-7_sheet-conformance-9c3c441601cf'`
- 確認コマンド: `rg -n "バーコード|スマレジ会員コード|SmaregiMemberCode|smaregi_member_code|2900065596792|barcode\(" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube ec-cube-enterprise/html pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "2900065596792|barcode\(|getSmaregiMemberCode|SmaregiMemberCode|スマレジ会員" ec-cube-enterprise/src/Eccube/Resource/template ec-cube-enterprise/src/Eccube/Entity ec-cube-enterprise/src/Eccube/Controller ec-cube-enterprise/src/Eccube/Service pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '2640,2672p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig | sed -n '1,70p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig | sed -n '1,35p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/Customer.php | sed -n '1068,1115p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php | sed -n '532,550p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig | sed -n '20,35p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/point_barcode_js.twig | sed -n '1,20p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbPlayer.php | sed -n '934,950p'`
