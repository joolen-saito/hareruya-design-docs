/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：会員情報変更
課題カテゴリ：実装違い
課題：会員情報変更画面・完了画面の戻るがECTOPではなくマイページへ遷移する
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. ログイン済み会員で `http://localhost:8080/ja/mypage/change` を表示する
2. 画面下部の「戻る」を押下し、遷移先がECTOP画面ではなくマイページになることを確認する
3. 再度 `http://localhost:8080/ja/mypage/change` から会員情報変更を完了し、`http://localhost:8080/ja/mypage/change_complete` を表示する
4. 完了画面の「戻る」を押下し、遷移先がECTOP画面ではなくマイページになることを確認する

# 期待される挙動【必須】
- 会員情報変更画面の No.1-28「戻る」は、押下するとECTOP画面へ遷移する
- 会員情報変更完了画面の No.2-2「戻る」は、押下するとECTOP画面へ遷移する

# 現在の挙動【必須】
- ec-cube-enterprise の会員情報変更画面 `change.twig` では、画面下部の「戻る」リンクが `href="{{ url('mypage') }}"` になっており、ECTOPではなくマイページへ遷移する。パンくずのホームアイコンには `url('homepage')` があるが、これは設計 No.1-28 の戻るボタンではない。

ec-cube-enterprise 入力画面の戻るはmypageリンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig:694-703`
```twig
                    <div class="p-hareruya-entry__form-footer">
                        <div class="p-hareruya-entry__form-actions">
                            <button class="c-hareruya-btn c-hareruya-btn--primary c-hareruya-btn--lg" id="submit_button" type="submit">
                                <span>{{ 'common.change_do'|trans }}</span>
                                <i class="icon-hareruya-arrow-right c-hareruya-icon--xs" aria-hidden="true"></i>
                            </button>
                            <a class="c-hareruya-btn c-hareruya-btn--lg" href="{{ url('mypage') }}">{{ 'common.back'|trans }}</a>
                        </div>
                    </div>
                </form>
```

ec-cube-enterprise 入力画面のパンくずホームはhomepageだが戻るボタンではない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig:48-60`
```twig
        <nav class="p-hareruya-breadcrumb" aria-label="{{ 'common.breadcrumb_navigation'|trans }}">
            <ol class="p-hareruya-breadcrumb__list" itemscope itemtype="https://schema.org/BreadcrumbList" data-js-breadcrumb>
                <li class="p-hareruya-breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <a class="p-hareruya-breadcrumb__link" href="{{ url('homepage') }}" itemprop="item" aria-label="{{ 'common.home'|trans }}">
                        <i class="icon-hareruya-home c-hareruya-icon--sm" aria-hidden="true"></i>
                        <span class="u-hareruya-dsp-visually-hidden" itemprop="name">{{ 'common.home'|trans }}</span>
                    </a>
                    <meta itemprop="position" content="1"/>
                </li>
                <li class="p-hareruya-breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <a class="p-hareruya-breadcrumb__link" href="{{ url('mypage') }}" itemprop="item">
                        <span itemprop="name">{{ 'front.mypage.title'|trans }}</span>
                    </a>
```
- ec-cube-enterprise の会員情報変更完了画面 `change_complete.twig` でも、画面下部の戻るリンクは `href="{{ url('mypage') }}"` で、設計のECTOP遷移ではない。`ChangeController` は更新成功後に `mypage_change_complete` へ遷移し、完了画面自体はテンプレートのリンクだけで遷移先を決めている。

ec-cube-enterprise 完了画面の戻るはmypageリンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change_complete.twig:41-49`
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

ec-cube-enterprise Controllerは完了画面を表示するだけ: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:190-222`
```php
                        'form' => $form,
                        'Customer' => $Customer,
                    ],
                    $request
                );
                $this->eventDispatcher->dispatch($event, EccubeEvents::FRONT_MYPAGE_CHANGE_INDEX_COMPLETE);

                return $this->redirectToRoute('mypage_change_complete');
            }

            // see https://github.com/EC-CUBE/ec-cube/issues/6103
            $this->entityManager->refresh($Customer);
        }

        $preEmail = $form->get('email')->getData();
        $this->session->set(self::SESSION_KEY_PRE_EMAIL, $preEmail);

        return [
            'form' => $form->createView(),
            'Player' => $Player,
        ];
    }

    /**
     * 会員情報編集完了画面.
     *
     * @return array<empty>
     */
    #[Route(path: '/mypage/change_complete', name: 'mypage_change_complete', methods: ['GET'])]
    #[Template(template: 'Mypage/change_complete.twig')]
    public function complete(): array
    {
        return [];
```
- ベース実装 pf-eccube3 でも入力画面の「変更しない」は `path('mypage')`、完了画面の「戻る」は `shop ? branch_path('mypage') : path('mypage')` で、どちらもマイページ戻りである。一方、標準 ec-cube の完了画面には `url('homepage')` の戻るリンクが存在する。今回の設計HTMLは No.1-28/No.2-2 とも ECTOP 遷移を明記しているため、enterprise は設計要求に対して遷移先が異なる。

ベース実装 pf-eccube3 入力画面はmypageへ戻る: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change.twig:328-337`
```twig
                    <div class="submit-button-container">
                        <button type="submit" class="submit-button submit-button-forward" id="submitButton">
                            変更する
                        </button>
                    </div>
                    <div class="submit-button-container">
                        <a href="{{ path('mypage') }}" class="submit-button submit-button-back">
                            変更しない
                        </a>
                    </div>
```

ベース実装 pf-eccube3 完了画面はmypageまたは支店mypageへ戻る: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change_complete.twig:14-20`
```twig
        <div class="submit-button-wrapper">
            <div class="submit-button-container">
                {% set shop = app.session.get(app['hareruya_ec.config.branch']['session_key']) %}
                <a href="{{ shop ? branch_path('mypage') : path('mypage') }}" class="submit-button submit-button-back">
                    戻る
                </a>
            </div>
```

標準ec-cube 完了画面はhomepageへ戻る: `ec-cube/src/Eccube/Resource/template/default/Mypage/change_complete.twig:34-37`
```twig
            <div class="ec-off4Grid">
                <div class="ec-off4Grid__cell">
                    <a class="ec-blockBtn--cancel" href="{{ url('homepage') }}">{{ 'common.back'|trans }}</a>
                </div>
```

# 根拠
- 設計：
  - 会員情報変更画面 No.1-28 戻る: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5108-5114`
  - 会員情報変更完了画面 No.2-2 戻る: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5130-5142`
- ec-cube-enterprise：
  - 入力画面の戻るリンクはmypage: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig:694-703`
  - 完了画面の戻るリンクはmypage: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change_complete.twig:41-49`
- ベース実装：
  - pf-eccube3 入力画面はmypageへ戻る: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change.twig:328-337`
  - pf-eccube3 完了画面はmypageへ戻る: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change_complete.twig:14-20`
  - 標準ec-cube 完了画面はhomepageへ戻る: `ec-cube/src/Eccube/Resource/template/default/Mypage/change_complete.twig:34-37`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json#f06-18_0306_sheet-15_sheet-conformance-dc7c7f4b4e31'`
- 確認コマンド: `rg -n --max-columns 300 "item-sheet-15-1-28|item-sheet-15-2-2|ECTOP画面へ遷移する" excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "url\('homepage'\)|url\('mypage'\)|戻る|common.back|back_to_mypage|mypage_change_complete" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change_complete.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php`
- 確認コマンド: `rg -n "url\('homepage'\)|url\('mypage'\)|path\('homepage'\)|path\('mypage'\)|branch_path\('mypage'\)|戻る|変更しない|common.back" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change_complete.twig ec-cube/src/Eccube/Resource/template/default/Mypage/change.twig ec-cube/src/Eccube/Resource/template/default/Mypage/change_complete.twig`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '5108,5114p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '5130,5142p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig | sed -n '48,60p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change.twig | sed -n '688,704p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/change_complete.twig | sed -n '20,50p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php | sed -n '190,222p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change.twig | sed -n '326,338p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/change_complete.twig | sed -n '10,22p'`
- 確認コマンド: `nl -ba ec-cube/src/Eccube/Resource/template/default/Mypage/change_complete.twig | sed -n '27,38p'`
