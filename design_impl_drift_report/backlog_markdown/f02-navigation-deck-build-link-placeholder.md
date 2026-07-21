/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントグローバルナビ
機能：PC版ナビゲーション／スマホ版ナビゲーション
課題カテゴリ：実装漏れ
課題：デッキ構築リンクがデッキ構築TOPへ遷移しない
設計書：0302_基本設計仕様書(フロント_グローバルナビ).xlsx

# 再現手順【必須】
1. フロント画面のPC版グローバルナビ、またはスマホ版メニューを表示する
2. 「デッキ構築」リンクを押下する
3. デッキ構築TOPへ遷移するか確認する

# 期待される挙動【必須】
- PC版ナビゲーションの「デッキ構築」押下時、デッキTOP画面へ遷移する
- スマホ版ナビゲーションの「デッキ構築」押下時、デッキTOP画面へ遷移する
- ベース実装のdeck-builderと同様に、/decks 配下のデッキ構築TOPへ遷移する

# 現在の挙動【必須】
- ec-cube-enterpriseでは、デッキ検索リンクはdeck_indexに接続されている一方、デッキ構築リンクはTODOコメント付きでhref="#"のままになっており、デッキ構築TOPへ遷移しない。

ec-cube-enterprise PCナビのデッキ構築リンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:87-92`
```twig
                    <li class="p-hareruya-header__nav-item u-hareruya-dsp-pc{% if currentRoute starts with 'deck_' %} is-active{% endif %}">
                        <a class="p-hareruya-header__nav-link" href="{{ url('deck_index') }}">{{ 'front.nav.deck_search'|trans }}</a>
                    </li>
                    {# TODO: ECCUBE_HARERUYA-XXX デッキ構築 TOP ルート実装後に href を差し替え #}
                    <li class="p-hareruya-header__nav-item u-hareruya-dsp-pc">
                        <a class="p-hareruya-header__nav-link" href="#">{{ 'front.nav.deck_build'|trans }}</a>
```

ec-cube-enterprise メガメニューのデッキ構築リンク: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/mega_menu.twig:37-45`
```twig
                <a class="p-hareruya-header__menu-link" href="{{ url('deck_index') }}">
                    <i class="icon-hareruya-deck-shosai c-hareruya-icon"></i>
                    <span class="p-hareruya-header__menu-text">{{ 'front.nav.menu.deck_search'|trans }}</span>
                </a>
            </li>
            {# TODO: ECCUBE_HARERUYA-XXX デッキ構築 TOP ルート実装後に href を差し替え #}
            <li class="p-hareruya-header__menu-item">
                <a class="p-hareruya-header__menu-link" href="#">
                    <i class="icon-hareruya-deck-new c-hareruya-icon"></i>
```

ec-cube-enterprise デッキ検索ルート: `ec-cube-enterprise/src/Eccube/Controller/Front/Deck/DeckController.php:75-76`
```php
    #[Route(path: '/deck/', name: 'deck_index', methods: ['GET'])]
    #[Template(template: 'Deck/index.twig')]
```
- ベース実装側のdeck-builderはNext.jsのbasePathを/decksに設定し、ヘッダーの「デッキ構築」導線をrouter.basePath + HOMEへ向けているため、デッキ構築TOPへ遷移する導線が存在する。

ベース実装 deck-builder のbasePath: `deck-builder/next.config.js:28-32`
```javascript
            defaultLocale: 'jp',
            localeDetection: false,
        },
        basePath: '/decks',
        assetPrefix: '/decks',
```

ベース実装 deck-builder ヘッダー導線: `deck-builder/components/layouts/Header.tsx:64-70`
```typescript
    const mainMenus = [
        { icon: images.ICON_MENU_SHOP, url: routes.EXTERNAL.EC_ONLINE_SHOPING, label: trans.web_menu.ec_online_shoping },
        { icon: images.ICON_MENU_BUY, url: routes.EXTERNAL.EC_PURCHASE, label: trans.web_menu.ec_purchase },
        { icon: images.ICON_MENU_REPORT, url: routes.EXTERNAL.EC_ARTICLE, label: trans.web_menu.ec_article },
        { icon: images.ICON_MENU_SEARCH, url: routes.EXTERNAL.EC_SEARCH, label: trans.web_menu.ec_search },
        { icon: images.ICON_MENU_DECK, url: router.basePath + routes.CLIENT.HOME.href, label: trans.web_menu.ec_deck },
        { icon: images.ICON_MENU_PLAYER_LIST, url: routes.EXTERNAL.EC_HARERUYA_PROS, label: trans.web_menu.ec_hareruya_pros },
```

# 根拠
- 設計：
  - PC版ナビゲーションのデッキ構築遷移要求: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:1018-1022`
  - スマホ版ナビゲーションのデッキ構築遷移要求: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:1903-1907`
- ec-cube-enterprise：
  - PCナビのデッキ構築リンクがプレースホルダ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:87-92`
  - メガメニューのデッキ構築リンクがプレースホルダ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/mega_menu.twig:37-45`
- ベース実装：
  - デッキ構築アプリの/decks basePath: `deck-builder/next.config.js:28-32`
  - ヘッダーのデッキ構築導線: `deck-builder/components/layouts/Header.tsx:64-70`

# 確認メモ
- 確認コマンド: `rg -n "デッキ構築|デッキTOP|deck_index|href=\"#\"|front.nav.deck_search|front.footer.sitemap.deck_search" hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html ec-cube-enterprise/src/Eccube/Resource/template/default/Block/mega_menu.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer_sitemap.twig`
- 確認コマンド: `rg -n "DECK|deckbuilder|デッキ構築|/decks" deck-builder`
- 確認コマンド: `nl -ba deck-builder/next.config.js | sed -n '28,34p'`
- 確認コマンド: `nl -ba deck-builder/components/layouts/Header.tsx | sed -n '64,72p'`
- ec-cube-enterpriseでは同じナビ領域のデッキ検索はdeck_indexへ接続済みだが、デッキ構築だけがhref="#"のプレースホルダになっている。
- deck-builder側は/decksをbasePathとするデッキ構築アプリで、ヘッダーのデッキ構築メニューはbasePath直下へ遷移する。
