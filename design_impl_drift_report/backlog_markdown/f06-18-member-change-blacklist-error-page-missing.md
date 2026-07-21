/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：会員情報変更
課題カテゴリ：実装違い
課題：ブラックリスト該当時に会員情報更新エラー画面へ遷移せずフラッシュ付きで入力画面を再表示する
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. ブラックリスト管理に、変更後の会員氏名・住所・電話番号のいずれかに一致するキーワードを登録する
2. ログイン済み会員で `http://localhost:8080/ja/mypage/change` を表示する
3. ブラックリストに一致する氏名・住所・電話番号へ変更し、「変更する」を押下する
4. 会員情報更新エラー画面へ遷移するか、またフラッシュメッセージが生成されないか確認する

# 期待される挙動【必須】
- ブラックリストに該当する氏名・住所・電話番号へ変更して「変更する」を押下した場合、会員情報更新エラー画面へ遷移する
- 本機能ではフラッシュ・トーストを生成しない

# 現在の挙動【必須】
- ec-cube-enterprise の `ChangeController::index()` は、ブラックリスト該当時に `addFlash('error', 'front.mypage.change.error.blacklisted')` を積み、`change.twig` を同一再描画する配列を返す。専用の会員情報更新エラー画面へ `redirectToRoute()` する分岐ではない。

ec-cube-enterprise ブラックリスト該当時はaddFlashしてchange.twigを再描画: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:116-132`
```php
                $Blacklists = $this->blacklistRepository->FindBlacklistByCustomer($Customer);
                if (count($Blacklists) > 0) {
                    /** @var DtbBlacklist $Blacklist */
                    foreach ($Blacklists as $Blacklist) {
                        $message = trans('front.entry.blacklisted', [
                            '%name%' => $Blacklist->getBlacklistTag()->getName(),
                            '%keyword%' => $Blacklist->getKeyword(),
                        ]);
                        log_info($message);
                    }
                    log_info(trans('front.mypage.change.error.blacklisted'));
                    $this->addFlash('error', 'front.mypage.change.error.blacklisted');

                    return [
                        'form' => $form->createView(),
                        'Player' => $Player,
                    ];
```

ec-cube-enterprise change.twigはapp.flashesを画面上部に表示する: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig:75-84`
```twig
            <div class="p-hareruya-entry__content">
                {% for label, messages in app.flashes %}
                    {% for message in messages %}
                        <div class="ec-alertRole p-hareruya-entry__flash" role="alert">
                            <div class="alert alert-{{ label == 'error' ? 'danger' : label }} alert-dismissible fade show m-3" role="alert">
                                {{ message|trans }}
                                <button type="button" class="close" data-dismiss="alert" aria-label="{{ 'common.close'|trans }}">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
```

ec-cube-enterprise 会員情報変更系Mypageテンプレートに専用エラー画面はない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change_complete.twig:41-49`
```twig
        <div class="p-hareruya-entry-complete__inner">
            <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.change_complete.page_title'|trans }}</h1>
            <div class="p-hareruya-entry-complete__message">
                <p class="p-hareruya-entry-complete__message-text">{{ 'front.mypage.customer_complete_message__title'|trans }}</p>
                <p class="p-hareruya-entry-complete__message-text">{{ 'front.mypage.change_complete.message_line2'|trans }}</p>
            </div>
            <div class="p-hareruya-entry-complete__actions">
                <a class="c-hareruya-btn c-hareruya-btn--lg u-hareruya-w-full" href="{{ url('mypage') }}">{{ 'front.mypage.button.back_to_mypage'|trans }}</a>
            </div>
```
- ec-cube-enterprise には会員登録用の `entry_regist_error` ルートと `Entry/regist_error.twig` は存在し、会員登録のブラックリスト該当時はそこへリダイレクトしている。一方、会員情報変更のブラックリスト該当時はこの既存エラー画面にも専用の変更エラー画面にも遷移していない。

ec-cube-enterprise 会員登録はブラックリスト時にentry_regist_errorへリダイレクト: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:128-142`
```php
                case 'complete':
                    $Blacklists = $this->blacklistRepository->FindBlacklistByCustomer($Customer);
                    if (count($Blacklists) > 0) {
                        /** @var DtbBlacklist $Blacklist */
                        foreach ($Blacklists as $Blacklist) {
                            $message = trans('front.entry.blacklisted', [
                                '%name%' => $Blacklist->getBlacklistTag()->getName(),
                                '%keyword%' => $Blacklist->getKeyword(),
                            ]);
                            log_info($message);
                        }
                        log_info(trans('front.entry.blacklist_not_registered'));

                        return $this->redirectToRoute('entry_regist_error');
                    }
```

ec-cube-enterprise 会員登録エラー画面ルート: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:419-426`
```php
    #[Route(path: '/entry/regist_error', name: 'entry_regist_error', methods: ['GET'])]
    #[Template(template: 'Entry/regist_error.twig')]
    public function entryError(): array
    {
        return [
            'Page' => $this->pageRepository->getPageByRoute('entry_regist_error'),
        ];
    }
```

ec-cube-enterprise 会員登録エラー画面テンプレート: `ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/regist_error.twig:5-16`
```twig
{% block main %}
    <div class="p-hareruya-error">
        <div class="p-hareruya-error__inner">
            <div class="p-hareruya-error__img">
                <img src="{{ asset('assets/hareruya/img/share/normal-hareruyakun.webp') }}" alt="{{ 'common.brand_name'|trans }}" width="87" height="129" loading="lazy">
            </div>
            <div class="p-hareruya-error__body">
                <p class="c-hareruya-text u-hareruya-mt10">{{ 'front.entry.blacklist_error'|trans|nl2br }}</p>
            </div>
            <div class="p-hareruya-error__actions">
                <a class="c-hareruya-btn c-hareruya-btn--lg u-hareruya-w-full" href="{{ url('entry') }}">{{ 'front.entry.regist_error_back'|trans }}</a>
            </div>
```
- ベース実装 pf-eccube3 でも会員登録のブラックリスト該当時は `entry_regist_error` へリダイレクトし、専用の `Entry/regist_error.twig` を表示する。pf-eccube3 の会員情報変更コントローラは更新成功時に `mypage_change_complete` へ進む実装で、検索上 `findBlacklistByCustomer` / `entry_regist_error` の会員情報変更内分岐は存在しない。設計HTMLは会員情報変更にも同種のエラー画面遷移を要求しているが、enterprise はフラッシュ再描画に置き換わっている。

ベース実装 pf-eccube3 会員登録はブラックリスト時にentry_regist_errorへ遷移: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:103-112`
```php
                    // ブラックリストに登録されている場合はエラーページへ
                    $blacklists = $app['hareruya_ec.repository.blacklist']->findBlacklistByCustomer($Customer);
                    if (count($blacklists) > 0) {
                        foreach ($blacklists as $blacklist) {
                            $app['monolog.logger.hareruyaec']->info('ブラックリスト登録あり  ' . $blacklist->getBlacklistTag()->getName() . ' : ' . $blacklist->getKeyword());
                        }
                        $app['monolog.logger.hareruyaec']->info('ブラックリスト登録があるため会員登録不可');

                        return $app->redirect($app->path('entry_regist_error'));
                    }
```

ベース実装 pf-eccube3 会員登録エラー画面をrender: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:274-282`
```php
     * 登録エラー(ブラックリスト)画面
     * @param  Application $app
     * @param  Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function registError(Application $app, Request $request)
    {
        return $app->render('Entry/regist_error.twig', []);
    }
```

ベース実装 pf-eccube3 会員登録エラー画面テンプレート: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Entry/regist_error.twig:1-9`
```twig
{% extends 'default_frame.twig' %}

{% block main %}
    <div class="event-main-middle-wrapper">
        <div class="contents">
            ご入力いただいた内容は使用できません。<br>
            もう一度、登録ページへアクセスして登録情報の変更をお願いいたします。
        </div>
    </div>
```

ベース実装 pf-eccube3 会員情報変更は成功時に完了画面へ遷移: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php:184-197`
```php
            // 支店システムと連携
            $branchUpdate = new BranchUpdateService($app);
            $branchUpdate->noticeCustomerUpdate([$Customer['id']]);

            $event = new EventArgs(
                [
                    'form' => $form,
                    'Customer' => $Customer,
                ],
                $request
            );
            $app['eccube.event.dispatcher']->dispatch(EccubeEvents::FRONT_MYPAGE_CHANGE_INDEX_COMPLETE, $event);

            return $app->redirect($app->url('mypage_change_complete'));
```

# 根拠
- 設計：
  - 会員情報変更のブラックリスト該当時は会員情報更新エラー画面へ遷移: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5068-5073`
  - フラッシュ・トースト非生成: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5273-5277`
- ec-cube-enterprise：
  - ブラックリスト該当時にaddFlashして入力画面再表示: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:116-132`
  - 入力画面がapp.flashesを描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig:75-84`
- ベース実装：
  - pf-eccube3 会員登録はブラックリスト時に専用エラー画面へ遷移: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:103-112`
  - pf-eccube3 会員登録エラー画面: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Entry/regist_error.twig:1-9`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json#f06-18_0306_sheet-15_sheet-conformance-d6349ce21742'`
- 確認コマンド: `rg -n "d6349ce21742|ブラックリスト|会員情報更新エラー|エラー画面|フラッシュ|トースト|blacklist|blacklisted|change_error|entry_regist_error" design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "regist_error|blacklist|FindBlacklist|blacklist_not_registered|entry_regist_error|blacklisted|change.error.blacklisted|app\.flashes" ec-cube-enterprise/src/Eccube/Controller/Front ec-cube-enterprise/src/Eccube/Resource/template/default/Entry ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml`
- 確認コマンド: `rg -n "blacklist|FindBlacklist|regist_error|entry_regist_error|会員情報更新エラー|会員情報登録エラー|mypage_change_complete" pf-eccube3/app/Plugin/HareruyaEc/Controller pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default pf-eccube3/app/Plugin/HareruyaEc/Repository`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '5064,5074p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '5273,5278p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php | sed -n '108,132p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig | sed -n '72,84p'`
- 確認コマンド: `find ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage -maxdepth 1 -type f | sed 's#^ec-cube-enterprise/##' | sort | rg "change|error|regist"`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php | sed -n '124,144p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php | sed -n '419,426p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/regist_error.twig | sed -n '1,20p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php | sed -n '96,114p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php | sed -n '274,284p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Entry/regist_error.twig | sed -n '1,40p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php | sed -n '184,197p'`
