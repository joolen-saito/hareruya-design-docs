/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：会員情報変更
課題カテゴリ：実装漏れ
課題：国と都道府県の組み合わせ不整合を国項目エラーとして拒否しない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. ログイン済み会員で `http://localhost:8080/ja/mypage/change` を表示する
2. リクエスト改変などで、国=日本かつ都道府県=海外、または国=海外かつ都道府県=国内の組み合わせを送信する
3. 更新されず、国の項目直下に組み合わせ不整合エラーが表示されるか確認する

# 期待される挙動【必須】
- 国が日本かつ都道府県が海外、または国が海外かつ都道府県が国内の場合、フォーム送信後の検証で更新しない
- 組み合わせ不整合エラーを国項目に付与し、国の項目直下へ表示する

# 現在の挙動【必須】
- ec-cube-enterprise の `EntryType` は、国が海外の場合に都道府県を `Pref::PREF_ABROAD` へ強制上書きし、国が日本の場合は郵便番号必須だけを確認している。国=日本かつ都道府県=海外、国=海外かつ都道府県=国内という組み合わせ自体を判定して `form.country` にエラーを付与する処理はない。

ec-cube-enterprise 国が海外の場合は都道府県を国外へ強制設定するだけ: `ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php:197-207`
```php
            if ($Customer->getCountry() === null || $Customer->getCountry()->isJapan()) {
                if (empty($form->get('postalCode')->get('postalCode01')->getData()) || empty($form->get('postalCode')->get('postalCode02')->getData())) {
                    $form->get('postalCode')->addError(new FormError(trans('front.entry.error.postal_code_required')));
                }
            } else {
                if (empty($form->get('abroadPostalCode')->getData())) {
                    $form['abroadPostalCode']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
                }
                // 海外の場合、都道府県 = 国外を固定で設定
                $Customer->setPref($this->prefRepository->find(Pref::PREF_ABROAD));
            }
```

ec-cube-enterprise 日本時は都道府県未選択だけをaddress.prefへエラー付与: `ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php:219-229`
```php
            if ($Customer->getCountry() === null || $Customer->getCountry()->isJapan()) {
                if ($Customer->getPref() === null) {
                    $form['address']['pref']->addError(new FormError(trans('front.entry.error.pref_required')));
                }
                if (empty($Customer->getAddr01()) || empty($Customer->getAddr02())) {
                    $form->get('address')->addError(new FormError(trans('front.entry.error.address_required')));
                }
            } else {
                if (empty($Customer->getAddr01())) {
                    $form->get('address')->addError(new FormError(trans('front.entry.error.address_required')));
                }
```

ec-cube-enterprise テンプレートは国項目エラー表示枠を持つがEntryTypeが不整合エラーを付与しない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig:366-381`
```twig
                        <div class="p-hareruya-form-group">
                            {# 国 #}
                            <div class="p-hareruya-form-block p-hareruya-entry__country">
                                <div class="p-hareruya-form-block__label-wrap">
                                    <label class="p-hareruya-form-block__label c-hareruya-heading--lev4" for="{{ form.country.vars.id }}">{{ 'common.country'|trans }}</label>
                                    <span class="c-hareruya-label--required">{{ 'common.required'|trans }}</span>
                                </div>
                                <div class="p-hareruya-form-block__form-list">
                                    <div class="c-hareruya-select">
                                        {{ form_widget(form.country, { attr: {
                                            class: 'c-hareruya-select__field' ~ (has_errors(form.country) ? ' is-error' : ''),
                                            'data-entry-role': 'country'
                                        }}) }}<i class="icon-hareruya-arrow-down c-hareruya-icon--xs" aria-hidden="true"></i>
                                    </div>
                                    {{ form_errors(form.country) }}
                                </div>
```
- ベース実装 pf-eccube3 の `EntryTypeExtension` には、国が日本で都道府県が `Pref::PREF_ABROAD`、または国が日本以外で都道府県が `Pref::PREF_ABROAD` 以外の場合に、`country` フィールドへ `form.country.error.invalid` を付与する検証がある。enterprise ではこの組み合わせ検証が移植されていない。

ベース実装 pf-eccube3 国・都道府県の不整合をcountryへエラー付与: `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/EntryTypeExtension.php:149-163`
```php
            ->addEventListener(FormEvents::SUBMIT, function ($event) use ($app) {
                $data = $event->getData();
                $form = $event->getForm();

                $countryCodeJp = $app['config']['HareruyaEc']['const']['country']['japan']['code'];

                if (is_null($data->getCountry()) || is_null($data->getPref())) {
                    return;
                }

                if (($data->getCountry()->getId() === $countryCodeJp && $data->getPref()->getId() === Pref::PREF_ABROAD)
                    || ($data->getCountry()->getId() !== $countryCodeJp && $data->getPref()->getId() !== Pref::PREF_ABROAD)) {
                    $form->get('country')->addError(new FormError($app->trans('form.country.error.invalid')));
                }
            });
```

ベース実装 pf-eccube3 海外時はprefを国外固定のhidden属性付きフィールドとして送信: `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/EntryTypeExtension.php:165-198`
```php
            // フォームから送られてきた国コードが空でなく、その値が日本の場合
            if (isset($options['countryCode']) && (int)$options['countryCode'] === $countryCodeJp) {
                return;
            }
            if (
                (isset($options['countryCode']) && (int)$options['countryCode'] !== $countryCodeJp)
                // フォームから送られてきた国コードが空かつ、すでに国が登録されており、その値が日本でない場合
                || (is_null($options['countryCode']) && !is_null($data->getCountry()) && $data->getCountry()->getId() !== $countryCodeJp)
                // フォームから送られてきた国コードが空かつ、国データが未登録かつ、ページ言語が日本語以外の場合
                || (is_null($options['countryCode']) && is_null($data->getCountry()) && $app['locale'] !== 'ja')
            ) {
                $builder
                    ->add(
                        'zipcode',
                        'text',
                        [
                            'required' => true,
                            'max_length' => $app['config']['HareruyaEc']['const']['customer_address']['length']['zipcode'],
                            'constraints' => [
                                new Assert\Length([
                                    'max' => $app['config']['HareruyaEc']['const']['customer_address']['length']['zipcode'],
                                    'maxMessage' => 'form.zipcode.max_length',
                                ]),
                            ],
                        ]
                    )
                    ->add(
                        'pref',
                        'pref',
                        [
                            'required' => false,
                            'data' => $app['orm.em']->getRepository('\Eccube\Entity\Master\Pref')->find(Pref::PREF_ABROAD),
                            'attr' => [
                                'hidden' => 'hidden',
```

# 根拠
- 設計：
  - 国と都道府県の不整合時は国項目直下にエラー表示: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5271-5277`
  - 業務ルールでも送信後検証で拒否と規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5279-5280`
- ec-cube-enterprise：
  - 海外時はPref::PREF_ABROADへ上書きし、日本時は郵便番号チェックのみ: `ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php:197-207`
  - 日本時の都道府県検証は未選択チェックのみで国への不整合エラーではない: `ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php:219-229`
- ベース実装：
  - pf-eccube3 は同不整合をcountryへエラー付与していた: `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/EntryTypeExtension.php:149-163`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json#f06-18_0306_sheet-15_sheet-conformance-bd970d339b75'`
- 確認コマンド: `rg -n "bd970d339b75|国と都道府県|組み合わせ|不整合|Pref::PREF_ABROAD|country|pref|PREF_ABROAD|国内|海外" design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "PREF_ABROAD|Pref::PREF_ABROAD|country|Country|pref|Pref|addError|国|都道府県|abroadPostalCode|postalCode|isJapan|isAbroad" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml`
- 確認コマンド: `rg -n "PREF_ABROAD|Pref::PREF_ABROAD|country|pref|addError|国|都道府県|abroad|isJapan|isAbroad|EntryType" pf-eccube3/app/Plugin/HareruyaEc/Form pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php pf-eccube3/src/Eccube/Form pf-eccube3/src/Eccube/Controller/Mypage/ChangeController.php ec-cube/src/Eccube/Form/Type/Front/EntryType.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '5268,5280p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php | sed -n '188,232p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig | sed -n '360,382p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/EntryTypeExtension.php | sed -n '145,198p'`
