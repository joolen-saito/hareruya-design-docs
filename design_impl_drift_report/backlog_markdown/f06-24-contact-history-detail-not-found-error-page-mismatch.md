/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：お問い合わせ履歴詳細
課題カテゴリ：実装違い
課題：存在しないID・他会員ID指定時に内容非表示ではなく404エラーページを表示する
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. ログイン済み会員で `http://localhost:8080/ja/contact/history/{id}/detail` を表示する
2. `{id}` に存在しないお問い合わせID、または他会員のお問い合わせIDを指定する
3. 当該お問い合わせ内容が表示されないだけで、404等の明示エラー画面にならないか確認する

# 期待される挙動【必須】
- 対象お問い合わせが存在しない、またはログイン会員に紐づかない場合、当該内容を表示しない
- 閲覧専用のため画面上の明示エラーは出さない

# 現在の挙動【必須】
- ec-cube-enterprise の `ContactController::detail()` はルート引数を `DtbContact $Contact` として受け取り、会員条件込みの `findOneBy(['id' => $Contact->getId(), 'Customer' => $user])` が `null` の場合に `throw $this->createNotFoundException();` を実行する。他会員IDではこの分岐で404エラー画面になり、存在しないIDは必須エンティティ引数の解決時点で404になるため、設計の『明示エラーは出さない』挙動と異なる。

ec-cube-enterprise お問い合わせ履歴詳細は対象なし時に404例外: `ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:222-236`
```php
    #[Route(path: '/contact/history/{id}/detail', name: 'contact_history_detail', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[Template(template: 'Contact/history_detail.twig')]
    public function detail(Request $request, DtbContact $Contact): array
    {
        /** @var Customer $user */
        $user = $this->getUser();

        $contact = $this->dtbContactRepository->findOneBy(['id' => $Contact->getId(), 'Customer' => $user], ['id' => 'DESC']);

        if ($contact === null) {
            throw $this->createNotFoundException();
        }

        return [
            'contact' => $contact,
```
- ベース実装 pf-eccube3 の `ContactController::detail($id)` は、同じ会員条件込みの検索結果を `$contact` としてテンプレートへ渡すだけで、`null` の場合に404例外やabortを実行しない。テンプレート側にも対象なし専用の明示エラー表示はなく、設計の『当該内容を表示しない』挙動に近い実装になっている。

ベース実装 pf-eccube3 は対象なしでもabortせずテンプレートへ渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php:148-162`
```php
     * @param Application $app
     * @param Request $request
     * @param integer $id
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function detail(Application $app, Request $request, $id)
    {
        $customer = LoginUtil::getLoginCustomer($app);
        $contact = $app['hareruya_ec.repository.contact']->findOneBy(['id' => $id, 'customer' => $customer], ['id' => 'DESC']);

        return $app->render('Contact/history_detail.twig', [
            'customer' => $customer,
            'contact' => $contact,
        ]);
    }
```

ベース実装 pf-eccube3 テンプレートはcontact項目を表示するのみ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:8-30`
```twig
{% block main %}
    <div class="event-main-middle-wrapper">
        <h1 class="common-headline">お問い合わせ履歴詳細</h1>
        <div class="contents customer">
            <div class="customer__status">
                <div class="customer__status__loginname">
                    {{ customer.name01 }} {{ customer.name02 }} 様
                </div>
            </div>
            <h2 class="contactdetail_title_">
                {{ contact.createDate|date('Y/m/d H:i') }}
                <span class="subject_">{{ contact.subject.subject }}</span>
                <span class="id_">(お問い合わせ番号 : {{ contact.id }})</span>
            </h2>
            <div class="contactlist_">
                <div class="contactlist_line_">
                    <div class="contactlist_head_">
                        <p class="name_">{{ contact.name01 }} {{ contact.name02 }} 様</p>
                        <p class="updt_">{{ contact.createDate|date('Y/m/d H:i') }}</p>
                    </div>
                    <div class="comment_">
                        {{ contact.body|nl2br }}
                    </div>
```

# 根拠
- 設計：
  - 存在しないID・他会員IDでは内容を表示しない: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6752-6763`
  - 画面上の明示エラーは出さない: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6780-6782`
- ec-cube-enterprise：
  - 対象なし時に404例外を投げる: `ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:222-236`
- ベース実装：
  - pf-eccube3 は対象なしでも404例外にせずテンプレートへ渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php:148-162`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-24_0306_sheet-20_sheet.json#f06-24_0306_sheet-20_sheet-conformance-4fe92fd44c30'`
- 確認コマンド: `rg -n "4fe92fd44c30|存在しないID|他会員|明示エラー|HTTP404|createNotFoundException|findOneBy|contact_history_detail|取得結果" design_impl_drift_report/findings/f06-24_0306_sheet-20_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "contact_history_detail|createNotFoundException|NotFound|findOneBy|history_detail|DtbContact|contact === null|throw" ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/history_detail.twig ec-cube-enterprise/src/Eccube/Repository/DtbContactRepository.php`
- 確認コマンド: `rg -n "contact_history_detail|abort\(404\)|NotFound|findOneBy|history_detail|contact is null|contact == null|return \$app->render" pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig pf-eccube3/app/Plugin/HareruyaEc/Repository ec-cube/src/Eccube/Controller/ContactController.php`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php | sed -n '222,236p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php | sed -n '148,162p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig | sed -n '8,30p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '6752,6763p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '6780,6782p'`
