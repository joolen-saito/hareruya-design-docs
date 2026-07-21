/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：マイページ
課題カテゴリ：実装漏れ
課題：マイページのマイデッキリンクが遷移先未設定になっている
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 会員としてログインし、マイページ( http://localhost:8080/ja/mypage )を表示する
2. 「マイデッキ」ブロックを押下する
3. マイデッキ画面へ遷移するか確認する

# 期待される挙動【必須】
- マイページの「マイデッキ」リンク押下時、マイデッキ画面へ遷移する
- ベース実装と同様に、会員のdeckUserIdがある場合はユーザー別デッキ、ない場合はデッキTOPへ遷移する

# 現在の挙動【必須】
- ec-cube-enterpriseのマイページでは「マイデッキ」ブロック自体は表示されるが、aタグのhrefが空文字で、マイデッキ画面またはデッキTOPへ遷移するURLが設定されていない。

ec-cube-enterprise マイデッキブロック: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:173-177`
```twig
                        <div class="p-hareruya-mypage__menu-item">
                            <a class="p-hareruya-mypage__menu-link" href="">
                                <i class="icon-hareruya-my-decks c-hareruya-icon--xl" aria-hidden="true"></i>
                                <span class="p-hareruya-mypage__menu-text">{{ 'front.mypage.index.menu.my_deck'|trans }}</span>
                            </a>
```

ec-cube-enterprise デッキTOPルート: `ec-cube-enterprise/src/Eccube/Controller/Front/Deck/DeckController.php:75`
```php
    #[Route(path: '/deck/', name: 'deck_index', methods: ['GET'])]
```
- ベース実装(pf-eccube3)では、マイページの「マイデッキ」ブロックがdeckUserIdに応じて /decks/user/{deckUserId} または /decks へ遷移するよう実装されている。

ベース実装 pf-eccube3 マイデッキブロック: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:136-140`
```twig
                    <a class="mypage-block" href="{% if player.deckUserId is not null %}/decks/user/{{ player.deckUserId }}{% else %}/decks{% endif %}">
                        <div class="mypage-block__image-wrapper">
                            <img class="mypage-block__image" src="{{ path('assets', {path: 'img/mypageicon_deck_entry.jpg'}) }}" alt="大会デッキ登録">
                        </div>
                        <h2 class="mypage-block__title">マイデッキ</h2>
```

ベース実装 pf-eccube3 デッキTOPルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/Front/DeckControllerProvider.php:19-21`
```php
        // デッキTOP
        $c->get('', '\Plugin\HareruyaEc\Controller\DeckController::index')
            ->bind('deck_index');
```

# 根拠
- 設計：
  - マイページのマイデッキ遷移要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2679-2684`
- ec-cube-enterprise：
  - マイデッキリンクが空href: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:173-177`
  - 遷移先候補となるデッキTOPルートは存在: `ec-cube-enterprise/src/Eccube/Controller/Front/Deck/DeckController.php:75`
- ベース実装：
  - マイデッキブロックの遷移先: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:136-140`
  - デッキTOPルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/Front/DeckControllerProvider.php:19-21`

# 確認メモ
- 確認コマンド: `rg -n "マイデッキ|マイデッキ画面へ遷移する" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html`
- 確認コマンド: `rg -n "マイデッキ|my_deck|mydeck|MyDeck|deckentry_list|deck_list|デッキ一覧|デッキ情報" pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "mypage_deckentry_list|deckentry_list|my_deck|mydeck|mypage_deck" ec-cube-enterprise/src/Eccube/Controller/Front ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Resource/locale`
- 確認コマンド: `rg -n "deck_index|Route\\(.*deck|/decks|DeckController|decks/user" ec-cube-enterprise/src/Eccube/Controller ec-cube-enterprise/src/Eccube/Resource/template/default`
- ec-cube-enterpriseにはdeck_indexルート自体は存在するが、Mypage/index.twigのマイデッキブロックからそのルートへリンクしていない。
- 大会デッキ登録系の mypage_deckentry_edit/check は存在するが、マイページのマイデッキブロックの遷移先としては設定されていない。
