■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）admin_card_list では検索関連キーを削除する。
　GET初期表示の分岐では検索関連キーを削除せず、空のフォームビューを取得して `card` と `card.page_no` を set している。SearchControllerTrait 側の `eccube.admin.card.search` / `eccube.admin.card.search.page_no` / `eccube.admin.card.search.page_count` / `eccube.admin.card.sort` / `eccube.admin.card.order` を remove する実装もない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1117 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:98）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索フォームは CSRF 保護を明示的に無効にした型定義である。
　`SearchCardType::configureOptions()` は `'csrf_protection' => true` を設定している。Twig も通常の `form_start(searchForm, ...)` で検索フォームを描画している。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1084 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCardType.php:210）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）複合キーワードは最大長50文字で、半角・全角スペースおよびカンマで分割した各トークンについて、和英カード名と和英ルールテキスト列への部分一致をORでつなぎ、トークン間をANDでつなぐ。
　フォームの `multi` は TextType だが Length/maxlength 制約がなく、Repository は入力文字列全体を1つの `%...%` として `name_jp OR name_en OR text_jp OR text_en` に適用している。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1071 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:224）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）マナコスト下限はフォームキー cmc_start で選択時は cmc 以上、マナコスト上限はフォームキー cmc_end で選択時は cmc 以下。
　検索フォームは `cmc_start` / `cmc_end` を持たず、単一の `cmc` TextType を表示する。Repository も `c.cmc = :cmc` の完全一致条件のみを実装している。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1071 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCardType.php:70）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）レガル表示チェックはフォームキー legalFlg のチェックボックスで、フォーマット条件があるときオフならレガルとレストリクションのみ、オンならバンも検索対象に含める。
　`legalFlg` は存在せず、`restriction` という MtbRestriction 複数選択チェックボックスを表示する。JS はフォーマット選択時に最初の restriction を自動チェックし、Repository は選択された restriction のみを `cf.Restriction IN (:restrictions)` で絞り込む。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1071 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCardType.php:161）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）色の複数選択は、選んだ色ごとに別結合として要求し、複数色は AND となる。
　色検索は `innerJoin('c.Colors', 'color')` の単一結合に対して `color IN (:colors)` を適用している。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1064 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:231）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）行のカード名または ID を押下するとカード編集（admin_card_edit）へ遷移する。
　一覧行のカードIDはプレーンテキスト、カード名もプレーンテキストで、`admin_card_edit` へのリンクは右端の鉛筆アイコンだけに付与されている。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1100 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:422）

■管理-M14-01 カード一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カード削除ボタンを押下すると、動的に「このカードを削除してもよろしいですか？」のポップアップを表示し、その後「実行」を選択すると削除を実行する。
　行削除は Bootstrap モーダル `#DeleteModal` を開き、文言は `admin.common.delete_modal__message` にカード名を差し込む。翻訳値は「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」で、設計文言とは異なる。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-4:1438 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:432）
