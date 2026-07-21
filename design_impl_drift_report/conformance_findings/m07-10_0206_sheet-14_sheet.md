■管理-M07-10 【新規】買取商品履歴(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）申込者名検索は、空白が含まれている場合（姓と名の間に空白等）空白で区切ったいずれかの入力が一致していれば検索結果に出力する。
　申込者名を空白・カンマで分割した後、各キーワードごとに andWhere(orX(...)) を追加しているため、複数キーワードはAND条件になる。各キーワード内では姓・名・姓カナ・名カナへのOR部分一致。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-14:3490-3492 ／ 実装: src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:89-107）

■管理-M07-10 【新規】買取商品履歴(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員IDの書式・制限は「半角数字(整数)」で、完全一致検索とする。
　会員IDフォームは TextType、DTOも ?string として受け取り、Repositoryで (int) $searchData->customerId にキャストして IDENTITY(bo.Customer) = :customerId の完全一致検索をしている。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-14:3487-3488,3511 ／ 実装: src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:60-63; src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:23-26; src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:81-86）

■管理-M07-10 【新規】買取商品履歴(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）振込完了日(From)/(To)の書式・制限は「日付(yyyy/mm/dd)」で、振込が完了した日を買取が成立した日とみなし検索項目とする。
　振込完了日は DateTimeType の single_text で実装され、画面JSは datetimepicker の format を 'YYYY-MM-DD HH:mm' にしている。Repositoryは振込完了ステータス履歴の MAX(createDate) に対して >= From / <= To のDateTime比較を行う。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-14:3496-3497,3517-3518 ／ 実装: src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:82-103; src/Eccube/Resource/template/admin/Purchase/history.twig:28-41; src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:123-145）
