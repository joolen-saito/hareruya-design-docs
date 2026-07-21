/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：お問い合わせ履歴詳細
課題カテゴリ：実装違い
課題：お問い合わせ履歴詳細の戻るがブラウザ履歴ではなく一覧URLへGET遷移する
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. ログイン済み会員で `http://localhost:8080/ja/contact/history` を表示する
2. 任意のお問い合わせ履歴の詳細画面へ遷移する
3. 詳細画面下部の「戻る」を押下し、ブラウザ履歴戻りではなく `/ja/contact/history` への通常GET遷移になっていないか確認する

# 期待される挙動【必須】
- 詳細の「戻る」は `history.go(-1)` 相当でブラウザ履歴を1つ戻る
- 戻る押下時にサーバへのリクエストを発生させない

# 現在の挙動【必須】
- ec-cube-enterprise のお問い合わせ履歴詳細テンプレートは、「戻る」を `href="{{ url('contact_history') }}"` の通常リンクとして実装している。押下時は `GET /contact/history` が発生し、設計が求める `history.go(-1)` によるブラウザ履歴戻りではない。

ec-cube-enterprise お問い合わせ履歴詳細の戻るはcontact_history固定リンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/history_detail.twig:44-51`
```twig
                    </div>
                </div>
            </div>
            <div class="p-hareruya-history-detail__btn">
                <a class="c-hareruya-btn c-hareruya-btn--lg u-hareruya-w-full" href="{{ url('contact_history') }}">
                    <span class="c-hareruya-btn__text">{{ 'common.back'|trans }}</span>
                </a>
            </div>
```

ec-cube-enterprise お問い合わせ履歴一覧はGETルート: `ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:202-212`
```php
    #[Route(path: '/contact/history', name: 'contact_history', methods: ['GET'])]
    #[Template(template: 'Contact/history.twig')]
    public function history(): array
    {
        /** @var Customer $user */
        $user = $this->getUser();

        $contactHistories = $this->dtbContactRepository->findBy(['Customer' => $user], ['id' => 'DESC']);

        return [
            'contactHistories' => $contactHistories,
```
- ベース実装 pf-eccube3 のお問い合わせ履歴詳細テンプレートは、同じ「戻る」を `href="javascript:history.go(-1);"` で実装している。これは設計の『ブラウザ履歴を1つ戻る、サーバへのリクエストは発生しない』という要求に対応する実装である。

ベース実装 pf-eccube3 お問い合わせ履歴詳細の戻るはhistory.go(-1): `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:31-38`
```twig
                </div>
            </div>
            <div class="submit-button-wrapper">
                <div class="submit-button-container">
                    <a href="javascript:history.go(-1);" class="submit-button submit-button-back">
                        戻る
                    </a>
                </div>
```

# 根拠
- 設計：
  - 詳細の戻るはhistory.go(-1)でサーバリクエストなし: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6729-6734`
  - 画面遷移でもブラウザ履歴戻りを指定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6777-6778`
- ec-cube-enterprise：
  - 実装はcontact_historyへの通常リンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/history_detail.twig:44-51`
- ベース実装：
  - pf-eccube3 はhistory.go(-1): `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:31-38`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-23_0306_sheet-19_sheet.json#f06-23_0306_sheet-19_sheet-conformance-36b6634f820e'`
- 確認コマンド: `rg -n "36b6634f820e|戻る|history\.go|history\.back|ブラウザ履歴|サーバへのリクエスト|contact_history" design_impl_drift_report/findings/f06-23_0306_sheet-19_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "history\.go|history\.back|window\.history|contact_history|url\('contact_history'\)|path\('contact_history'\)|common.back|戻る" ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/history_detail.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/history_detail.en.twig ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js ec-cube-enterprise/html/template/default/assets/js`
- 確認コマンド: `rg -n "history\.go|history\.back|window\.history|contact_history|url\('contact_history'\)|path\('contact_history'\)|common.back|戻る" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.en.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php ec-cube/src/Eccube/Resource/template/default/Contact ec-cube/src/Eccube/Controller/ContactController.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '6729,6735p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '6777,6779p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/history_detail.twig | sed -n '44,51p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig | sed -n '31,38p'`
