/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：配送先の新規登録_確認
課題カテゴリ：実装漏れ
課題：国と都道府県の組み合わせ不整合時に国項目へエラーを表示しない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. ログインした状態で商品をカートに入れ、http://localhost:8080/ja/shopping に進む
2. 配送先の新規登録・変更画面で、国と都道府県の組み合わせが不整合になる入力（例: 国=日本、都道府県=国外）を送信する
3. 確認画面へ進まず編集画面が再表示され、国の項目直下に不整合エラーが表示されるか確認する

# 期待される挙動【必須】
- 国が日本で都道府県が国外、または国が日本以外で都道府県が国外でない場合は不整合として扱う
- 不整合時は国の項目にエラーを付与し、編集画面を再表示する
- エラー文言は `form.country.error.invalid` の `The combination of country and region is incorrect.` を国の項目直下に表示する

# 現在の挙動【必須】
- ec-cube-enterprise の注文中配送先フォームは `ShoppingShippingType` が `CustomerAddressType` を親にするが、`ShoppingShippingType` 自体には国・都道府県の整合検証がない。親の `CustomerAddressType` の `POST_SUBMIT` も郵便番号必須チェックと、国が日本以外の場合に `Pref::PREF_ABROAD` をセットする片方向の補正のみで、国=日本かつ都道府県=国外、または国!=日本かつ都道府県!=国外を国項目エラーにする処理がない。

ec-cube-enterprise ShoppingShippingType は CustomerAddressType を親にするだけ: `ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingShippingType.php:21-51`
```php
class ShoppingShippingType extends AbstractType
{
    /**
     * {@inheritdoc}
     *
     * @param array<string, mixed> $options
     */
    #[\Override]
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
    }

    /**
     * {@inheritdoc}
     */
    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => CustomerAddress::class,
        ]);
    }

    /**
     * {@inheritdoc}
     */
    #[\Override]
    public function getParent(): ?string
    {
        return CustomerAddressType::class;
    }
```

ec-cube-enterprise CustomerAddressType は海外時に都道府県を国外へ補正するだけ: `ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:160-181`
```php
        $builder->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event): void {
            $form = $event->getForm();
            /** @var CustomerAddress $CustomerAddress */
            $CustomerAddress = $event->getData();

            if ($CustomerAddress->getCountry()->isJapan()) {
                if (empty($form->get('postalCode')->get('postalCode01')->getData())) {
                    $form['postalCode']['postalCode01']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
                }

                if (empty($form->get('postalCode')->get('postalCode02')->getData())) {
                    $form['postalCode']['postalCode02']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
                }
            } else {
                if (empty($form->get('abroadPostalCode')->getData())) {
                    $form['abroadPostalCode']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
                }

                // 海外の場合、都道府県 = 国外を固定で設定
                $CustomerAddress->setPref($this->prefRepository->find(Pref::PREF_ABROAD));
            }
        });
```

ec-cube-enterprise PrefType は都道府県の選択肢を絞り込まない: `ec-cube-enterprise/src/Eccube/Form/Type/Master/PrefType.php:30-35`
```php
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'class' => Pref::class,
            'placeholder' => 'common.select__pref',
        ]);
```
- ベース実装 pf-eccube3 では、配送先登録フォーム生成時に `FormEvents::SUBMIT` の検証を追加し、国=日本かつ都道府県=国外、または国!=日本かつ都道府県!=国外の場合に `form.country.error.invalid` を国項目へ `FormError` として追加している。日本語・英語ロケールにも対応文言が定義されている。

ベース実装 pf-eccube3 国・都道府県不整合を国項目エラーにする: `pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php:42-62`
```php
        $builder = $app['form.factory']
            ->createBuilder('customer_address', $customerAddress, [
                'countryCode' => $request->get('customer_address')['country'],
                'isChange' => $request->get('isChange')
            ])
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
            })
            ;
```

ベース実装 pf-eccube3 英語エラー文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.en.yml:659-662`
```yaml
    country:
        empty_value: Select
        error:
            invalid: The combination of country and region is incorrect.
```

ベース実装 pf-eccube3 日本語エラー文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:700-703`
```yaml
    country:
        empty_value: 選択してください
        error:
            invalid: 国と都道府県の組み合わせが正しくありません。
```

# 根拠
- 設計：
  - 国・都道府県の整合検証とエラー表示: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2080-2084`
  - 不整合時は編集画面を再表示: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2089`
- ec-cube-enterprise：
  - CustomerAddressType は不整合エラーではなく海外時補正のみ: `ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:160-181`
- ベース実装：
  - pf-eccube3 は国項目に form.country.error.invalid を追加: `pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php:47-60`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-6_sheet.json#f04-03_0304_sheet-6_sheet-conformance-c95aecfc90e2'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for form.country.error.invalid, The combination of country and region is incorrect, 国と都道府県 ... PY`
- 確認コマンド: `rg -n "form\.country\.error\.invalid|combination of country|PREF_ABROAD|国と都道府県|country.*pref|pref.*country|POST_SUBMIT|addError\(new FormError|ShoppingShippingType|CustomerAddressType|PrefType" ec-cube-enterprise/src/Eccube pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "form\.country\.error\.invalid|The combination of country and region is incorrect|country:|invalid:" ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.en.yml`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php | sed -n '130,185p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingShippingType.php | sed -n '1,55p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php | sed -n '35,62p'`
