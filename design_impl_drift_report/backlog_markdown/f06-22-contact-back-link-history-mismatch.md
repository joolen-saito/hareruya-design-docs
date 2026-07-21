/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：お問い合わせ
課題カテゴリ：実装違い
課題：お問い合わせ入力画面の戻るがブラウザ履歴ではなくホームへ遷移する
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 任意の画面から `http://localhost:8080/ja/contact` に遷移する
2. お問い合わせ入力画面下部の「戻る」を押下する
3. ブラウザ履歴の1つ前のページへ戻るか、ホームへ固定遷移するか確認する

# 期待される挙動【必須】
- (1-10)「戻る」押下時は、ブラウザの履歴から1つ前のページに遷移する

# 現在の挙動【必須】
- ec-cube-enterprise のお問い合わせ入力画面は、「戻る」を `href="{{ url('homepage') }}"` の通常リンクとして実装している。押下時は直前ページではなく `homepage` へ固定遷移し、`history.go(-1)` / `history.back()` 相当の処理ではない。

ec-cube-enterprise お問い合わせ入力画面の戻るはhomepage固定リンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig:381-389`
```twig
                <div class="p-hareruya-entry__form-footer">
                    <div class="p-hareruya-entry__form-actions">
                        <button type="submit" class="c-hareruya-btn c-hareruya-btn--primary c-hareruya-btn--lg" id="submitButton" name="mode" value="confirm">
                            <span>{{ 'front.contact.go_to_confirm'|trans }}</span>
                            <i class="icon-hareruya-arrow-right c-hareruya-icon--xs" aria-hidden="true"></i>
                        </button>
                        <a class="c-hareruya-btn c-hareruya-btn--lg" href="{{ url('homepage') }}">{{ 'common.back'|trans }}</a>
                    </div>
                </div>
```
- ベース実装 pf-eccube3 のお問い合わせ入力画面は、同じ戻るボタンを `href="javascript:history.go(-1);"` で実装している。確認画面の戻るも同様に `history.go(-1)` で、設計が求めるブラウザ履歴戻りの実装例が存在する。

ベース実装 pf-eccube3 お問い合わせ入力画面の戻るはhistory.go(-1): `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:189-198`
```twig
                <div class="submit-button-wrapper">
                    <div class="submit-button-container">
                        <input type="submit" name="order" tabindex="1" value="確認画面へ" id="submitButton" class="submit-button submit-button-forward">
                    </div>
                    <div class="submit-button-container">
                        <a href="javascript:history.go(-1);" class="submit-button submit-button-back">
                            戻る
                        </a>
                    </div>
                </div>
```

ベース実装 pf-eccube3 お問い合わせ確認画面の戻るもhistory.go(-1): `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/confirm.twig:162-170`
```twig
            <div class="submit-button-wrapper">
                <div class="submit-button-container">
                    <button type="submit" class="submit-button submit-button-forward" name="mode" value="complete">送信をする</button>
                </div>
                <div class="submit-button-container">
                    <a href="javascript:history.go(-1);" class="submit-button submit-button-back">
                        戻る
                    </a>
                </div>
```

# 根拠
- 設計：
  - (1-10)戻るはブラウザ履歴から1つ前へ遷移: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6312`
- ec-cube-enterprise：
  - 戻るがhomepage固定リンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig:381-389`
- ベース実装：
  - pf-eccube3 ではhistory.go(-1)リンク: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:189-198`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json#f06-22_0306_sheet-18_sheet-conformance-da1de78be63d'`
- 確認コマンド: `rg -n "da1de78be63d|戻る|ブラウザの履歴|history\.go|history\.back|homepage|お問い合わせ" design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "history\.go|history\.back|window\.history|戻る|homepage|url\('homepage'\)|common.back|contact" ec-cube-enterprise/src/Eccube/Resource/template/default/Contact ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js ec-cube-enterprise/html/template/default/assets/js ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml`
- 確認コマンド: `rg -n "history\.go|history\.back|window\.history|戻る|homepage|path\('homepage'\)|url\('homepage'\)|common.back|contact" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php pf-eccube3/src/Eccube/Resource/template/default/Contact pf-eccube3/src/Eccube/Controller/ContactController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js ec-cube/src/Eccube/Resource/template/default/Contact ec-cube/src/Eccube/Controller/ContactController.php`
- 確認コマンド: `rg -n "item-sheet-18-1-10|押下すると、ブラウザの履歴から1つ前" excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig | sed -n '381,389p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig | sed -n '189,198p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/confirm.twig | sed -n '162,170p'`
