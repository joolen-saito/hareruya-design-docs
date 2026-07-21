/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントグローバルナビ
機能：PC版ナビゲーション／スマホ版ナビゲーション
課題カテゴリ：実装漏れ
課題：フッターサイトマップのFAQリンクがFAQ画面へ遷移しない
設計書：0302_基本設計仕様書(フロント_グローバルナビ).xlsx

# 再現手順【必須】
1. 任意のフロント画面を表示し、フッターサイトマップまでスクロールする
2. 「FAQ」リンクを押下する
3. FAQ画面へ遷移するか確認する

# 期待される挙動【必須】
- PC版ナビゲーションのFAQリンク押下時、FAQ画面へ遷移する
- スマホ版ナビゲーションのFAQリンク押下時、FAQ画面へ遷移する
- ベース実装と同様に、FAQ導線は user_data/hareruya_faq 相当のFAQページを指す

# 現在の挙動【必須】
- ec-cube-enterpriseのフッターサイトマップでは、FAQリンクにTODOコメントが残り、hrefが「#」のままなのでFAQ画面へ遷移しない。

ec-cube-enterprise FAQリンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer_sitemap.twig:50-54`
```twig
            {# TODO: ECCUBE_HARERUYA-XXX FAQ ページ (user_data/hareruya_faq) 実装後に href を差し替え #}
            <li class="p-hareruya-footer__nav-item">
                <a class="p-hareruya-footer__nav-link" href="#">{{ 'front.footer.sitemap.faq'|trans }}</a>
            </li>
        </ul>
```
- ベース実装では、WordPressフッターおよびdeck-builderの定数でFAQ導線が user_data/hareruya_faq を指している。

ベース実装 pf-article FAQリンク: `pf-article/wp-content/themes/hareruyaEc/footer.php:14-18`
```php
                    <li><a href="https://www.hareruyamtg.com/ja/events/">イベント・大会</a></li>
                    <li><a href="https://www.hareruyamtg.com/ja/user_data/store_menu">店舗のご案内</a></li>
                    <li><a href="https://www.hareruyamtg.com/ja/contact">お問い合わせ</a></li>
                    <li><a href="https://www.hareruyamtg.com/ja/help/guide">ヘルプ</a></li>
                    <li><a href="https://www.hareruyamtg.com/ja/user_data/hareruya_faq">FAQ</a></li>
```

ベース実装 deck-builder FAQルート定数: `deck-builder/utils/constants/routes.ts:54-59`
```typescript
    EC_HARERUYA_PROS: 'https://pros.hareruyamtg.com/?_gl=',
    EC_STORE: `${baseUrl}user_data/store_menu`,
    EC_EVENT: `${baseUrl}events/`,
    EC_HELP: `${baseUrl}help/guide`,
    EC_FAQ: `${baseUrl}user_data/hareruya_faq`,
    EC_CONTACT: `${baseUrl}contact`,
```

# 根拠
- 設計：
  - PC版ナビゲーションのFAQ遷移要求: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:1276-1281`
  - スマホ版ナビゲーションのFAQ遷移要求: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:2049-2053`
- ec-cube-enterprise：
  - FAQリンクがプレースホルダ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer_sitemap.twig:50-54`
- ベース実装：
  - FAQリンクの遷移先: `pf-article/wp-content/themes/hareruyaEc/footer.php:14-18`
  - FAQルート定数: `deck-builder/utils/constants/routes.ts:54-59`

# 確認メモ
- 確認コマンド: `rg -n "FAQ|faq|hareruya_faq|front.footer.sitemap.faq" ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer_sitemap.twig pf-article/wp-content/themes/hareruyaEc/footer.php deck-builder/utils/constants/routes.ts`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html | sed -n '1276,1284p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html | sed -n '2049,2056p'`
- footer_sitemap.twigではヘルプ等の隣接リンクはurl()で遷移先を持つが、FAQのみhref="#"のプレースホルダになっている。
