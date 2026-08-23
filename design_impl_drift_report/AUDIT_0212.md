# 実装乖離監査 — 0212_基本設計仕様書(デッキ管理).html

- 正本: `excel_to_html/output/0212_基本設計仕様書(デッキ管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **708要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 1 | ○ |
| 実装違い | 実装はあるが設計と違う | 25 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 2 | — |
| 設計どおり | 設計どおり実装されている | 515 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 164 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 1 | — |
| **合計** | | **708** | |

## 不具合 15件（P1 0 / P2 2 / P3 13）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 8件は重複として代表へ折り畳んだ（判定そのものは 23件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-11-R055 | アーキタイプ編集 | 実装違い | ふるまい | P2 | 紐づくデッキが0件のアーキタイプを削除したとき、削除日時が設定されて以後表示対象から外れるだけで、データそのものは残る。 |
| sheet-12-R036 | アーキタイプ登録CSVアップロード | 実装違い | ふるまい | P2 | 「色」に並べた色名のうち一部しか色として解決できないときも取込は中止せず、解決できた色だけをアーキタイプの色として設定する。 |
| sheet-11-R048 | アーキタイプ編集 | 実装違い | IO | P3 | 入力エラーで登録・編集画面を再表示したとき、直前に選択した代表カードの画像とカード名が引き続き表示される。 |
| sheet-12-R014 | アーキタイプ登録CSVアップロード | 未実装 | ふるまい | P3 | 拡張子がTSVのファイルをアップロードしたときは、取込を行わずエラーとして画面に知らせる。 |
| sheet-12-R031 | アーキタイプ登録CSVアップロード | 実装違い | ふるまい | P3 | 1行目のヘッダが期待する項目名と並び順に完全一致しないときは、ヘッダの形式が違うと知らせて取込を中止する。 |
| sheet-12-R038 | アーキタイプ登録CSVアップロード | 実装違い | ふるまい | P3 | 取込前に、値に混じったゼロ幅スペースとBOMを取り除いてから突合する。 |
| sheet-12-R045 | アーキタイプ登録CSVアップロード | 実装違い | ふるまい | P3 | 「色」がカンマだけのときは色を設定せず、既存アーキタイプの色をそのまま残す。 |
| sheet-3-R025 | デッキ一覧(検索入力) | 実装違い | IO | P3 | 検索項目「デッキID」は50文字までを受け付け、50文字を超える入力は入力エラーとして扱われ検索は行われない。 |
| sheet-3-R035 | デッキ一覧(検索入力) | 実装違い | IO | P3 | イベント開催日の検索項目には「イベント開催日」というラベルが表示され、開始日の初期値として3か月前の日付が入っている。 |
| sheet-3-R075 | デッキ一覧(検索入力) | 実装違い | IO | P3 | 検索条件の選択肢は、フォーマットが表示順（表示順が同じときは登録の古い順）、開催店舗と最終更新者が表示順に並び、アーキタイプの選択肢はアーキタイプ名にそのフォーマット名を添えた文言で示される。 |
| sheet-5-R024 | デッキ編集 | 実装違い | IO | P3 | 1枚あたり4枚までのカードが5枚以上入力されたとき、行番号とカード名を挙げて「5枚以上登録されています」という警告文を表示する |
| sheet-5-R135 | デッキ編集 | 実装違い | ふるまい | P3 | 指定回数が空のまま複製保存を押したときは、複製せずに入力が必要である旨のエラーを表示する |
| sheet-5-R164 | デッキ編集 | 実装違い | IO | P3 | CSV出力の応答には本文の文字集合の表記を添え、文字コードの設定がSJIS-winのときはwindows-31jと示す |
| sheet-8-R007 | デッキタグ一覧 | 実装違い | ふるまい | P3 | デッキタグの表示順に他のデッキタグと同じ値を入れたときは登録も更新もされず、1未満または999999を超える値も受け付けられない。日本語名・英語名は32文字を超えると保存されない。 |
| sheet-9-R023 | アーキタイプ管理(検索入力) | 実装違い | ふるまい | P3 | 初期表示のあとに検索したときは、保持していた表示件数が捨てられているため既定の10件で一覧が出る。 |

### sheet-11-R055 アーキタイプ編集 — 実装違い／ふるまい／P2

- 正本: sheet-11（アーキタイプ編集） HTML行 2139 付近
- 正本引用: 「紐づくデッキが0件のときだけ削除する。削除は論理削除とし、削除日時を設定する。物理削除は行わない」
- 設計期待値: 紐づくデッキが0件のアーキタイプを削除したとき、削除日時が設定されて以後表示対象から外れるだけで、データそのものは残る。
- 実装参照: `src/Eccube/Service/EntityManager/ArchetypeEntityManager.php:82-89;src/Eccube/Entity/DtbArchetype.php:29-32;src/Eccube/Entity/DtbArchetype.php:87-88`
- 実装実態: 削除は対象を永続化対象から取り除く指示だけを行っており、削除日時を設定する扱いに変換する指定がエンティティに無いため、行そのものが消える。
- 同じ実装実態でまとまる要求: sheet-11-R078（アーキタイプ編集 / 実装参照 `src/Eccube/Service/EntityManager/ArchetypeEntityManager.php:82-89;src/Eccube/Entity/DtbArchetype.php:87-88`）
- 判定根拠: 削除日時の列とその設定関数は存在するが削除処理では使われず、論理削除に変換する指定もエンティティに付いていない。紐づくデッキ0件の判定自体は実装されている（src/Eccube/Service/Admin/Archetype/ArchetypeDeleteAction.php:36-46）。
- 確信度: high

### sheet-12-R036 アーキタイプ登録CSVアップロード — 実装違い／ふるまい／P2

- 正本: sheet-12（アーキタイプ登録CSVアップロード） HTML行 2238 付近
- 正本引用: 「一部だけ解決できたときはエラーとせず、解決できた色だけを設定する」
- 設計期待値: 「色」に並べた色名のうち一部しか色として解決できないときも取込は中止せず、解決できた色だけをアーキタイプの色として設定する。
- 画像確認: sheet-12_img1.png を確認。レイアウト図では「CSV,TSVファイル選択」「CSV,TSVファイルのアップロード」「アーキタイプ登録CSV,TSVファイルフォーマット」のTSV表記と、表の「旧アーキタイプID」列が赤線で削除指定されている。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ArchetypeUpdateImportHandler.php:114-125`
- 実装実態: 色名を1つでも解決できないと、その行で未定義データエラーを立てて取込全体を打ち切っている（src/Eccube/Service/Csv/Importer/Event/ArchetypeUpdateImportHandler.php:118-124）。解決できた色だけを採る扱いは無く、1件も解決できない場合と一部だけ解決できない場合が同じ結果（取込中止・全件取り消し）になる。
- 判定根拠: ArchetypeUpdateImportHandler::onValidateRow（src/Eccube/Service/Csv/Importer/Event/ArchetypeUpdateImportHandler.php:114-125）で、色名の解決に1件でも失敗すると打ち切りに入る。登録側（同:177-185）にも解決できた分だけを採る分岐は無い。打ち切りは全件取り消しにつながる（src/Eccube/Service/Csv/Importer/CsvImporter.php:270-275）。
- 確信度: high

### sheet-11-R048 アーキタイプ編集 — 実装違い／IO／P3

- 正本: sheet-11（アーキタイプ編集） HTML行 2132 付近
- 正本引用: 「代表カードの解決結果は、保存するときと、エラーで画面を再表示するときの双方に使う。」
- 設計期待値: 入力エラーで登録・編集画面を再表示したとき、直前に選択した代表カードの画像とカード名が引き続き表示される。
- 画像確認: 画像 sheet-11_img1.png を確認。
- 実装参照: `src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:286-290;src/Eccube/Resource/template/admin/Archetype/edit.twig:229-237`
- 実装実態: 再表示時の代表カード画像とカード名は保存済みのアーキタイプが持つ代表カードだけを参照して描画される。選択した画像IDは送信値として保持されるが、画像とカード名は表示されない（新規登録では非表示のまま）。
- 判定根拠: 再表示のデータに代表カードの解決結果が含まれず、テンプレートも保存済みの値しか参照していないため、エラー再表示で選択済み代表カードの表示が失われる。
- 確信度: med

### sheet-12-R014 アーキタイプ登録CSVアップロード — 未実装／ふるまい／P3

- 正本: sheet-12（アーキタイプ登録CSVアップロード） HTML行 2210 付近
- 正本引用: 「・ファイル拡張子「TSV」をエラー扱いにする処理を追加」
- 設計期待値: 拡張子がTSVのファイルをアップロードしたときは、取込を行わずエラーとして画面に知らせる。
- 画像確認: sheet-12_img1.png を確認。レイアウト図では「CSV,TSVファイル選択」「CSV,TSVファイルのアップロード」「アーキタイプ登録CSV,TSVファイルフォーマット」のTSV表記と、表の「旧アーキタイプID」列が赤線で削除指定されている。
- 実装参照: `src/Eccube/Controller/Admin/Archetype/ArchetypeCsvController.php:49-108`
- 実装実態: アーキタイプ登録CSVの取込に拡張子の判定が無い。アップロードされたファイルは拡張子を問わずそのまま取込へ渡され、拡張子が tsv のときは区切り文字がタブとして解釈されるため（src/Eccube/Service/Csv/Importer/CsvImporter.php:172-175）、TSVファイルはエラーにならず取り込まれてしまう。同種のデッキ登録CSVには拡張子判定がある（src/Eccube/Controller/Admin/Deck/DeckCsvController.php:100-103）。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実関係は確認できた（CONFIRMED相当）。ArchetypeCsvController.php:49-108 に拡張子・種別の判定は無く、CsvImportType.php:52-57 の制約も NotBlank と最大サイズのみ、twig:84 の accept は選択ダイアログの絞り込みにすぎない。CsvImporter.php:172-175 で拡張子 tsv のときは区切り文字がタブ ArchetypeCsvController.php:49-108 を通読し、拡張子・MIME種別を見る分岐が無いことを確認した。フォーム側の制約も NotBlank と最大サイズだけで種別を見ていない（src/Eccube/Form/Type/Admin/CsvImportType.php:52-57）。画面の accept 属性（src/Eccube/Resource/template/admin/Archetype/csv_import.twig:84）はファイル選択ダイアログの絞り込みにすぎず、送信されたファイルの拒否にはならない。
- 確信度: high

### sheet-12-R031 アーキタイプ登録CSVアップロード — 実装違い／ふるまい／P3

- 正本: sheet-12（アーキタイプ登録CSVアップロード） HTML行 2233 付近
- 正本引用: 「1行目が期待するヘッダと並び順も含めて完全一致するか 一致しないときはヘッダ形式エラーとして取込を中止する」
- 設計期待値: 1行目のヘッダが期待する項目名と並び順に完全一致しないときは、ヘッダの形式が違うと知らせて取込を中止する。
- 画像確認: sheet-12_img1.png を確認。レイアウト図では「CSV,TSVファイル選択」「CSV,TSVファイルのアップロード」「アーキタイプ登録CSV,TSVファイルフォーマット」のTSV表記と、表の「旧アーキタイプID」列が赤線で削除指定されている。
- 実装参照: `src/Eccube/Service/Csv/Importer/CsvImporter.php:185-208`
- 実装実態: 1行目については行が読めるかどうかだけを見ており、期待する項目名や並び順との突合はしていない（src/Eccube/Service/Csv/Importer/CsvImporter.php:189-194）。各行の値はヘッダの項目名で引くため（src/Eccube/Service/Csv/Importer/Model/CsvRow.php:96-107）、列の並び順が期待と違っていてもヘッダ形式エラーにならず、そのまま取り込まれて完了する。項目名が欠けている場合だけ、ヘッダ形式ではなく行番号付きの列不在エラーになる（src/Eccube/Service/Csv/Importer/Event/BaseCsvImportHandler.php:84-91）。
- 判定根拠: CsvImporter::validateBeforeImport（src/Eccube/Service/Csv/Importer/CsvImporter.php:185-208）と BaseCsvImportHandler::onValidateRow（src/Eccube/Service/Csv/Importer/Event/BaseCsvImportHandler.php:65-113）を通読し、期待するヘッダ並びとの突合が無いことを確認した。値の引き当てが項目名基準であることは src/Eccube/Service/Csv/Importer/Model/CsvRow.php:96-107 と同:124-140 で確認。
- 確信度: med

### sheet-12-R038 アーキタイプ登録CSVアップロード — 実装違い／ふるまい／P3

- 正本: sheet-12（アーキタイプ登録CSVアップロード） HTML行 2240 付近
- 正本引用: 「取込前に文字コードと改行を正規化し、ゼロ幅スペースとBOMを取り除く。」
- 設計期待値: 取込前に、値に混じったゼロ幅スペースとBOMを取り除いてから突合する。
- 画像確認: sheet-12_img1.png を確認。レイアウト図では「CSV,TSVファイル選択」「CSV,TSVファイルのアップロード」「アーキタイプ登録CSV,TSVファイルフォーマット」のTSV表記と、表の「旧アーキタイプID」列が赤線で削除指定されている。
- 実装参照: `src/Eccube/Service/CsvImportService.php:97-108`
- 実装実態: 文字コードと改行の正規化は行われる（src/Eccube/Service/CsvImportService.php:97-108、src/Eccube/Stream/Filter/ConvertLineFeedFilter.php:26-35）が、ゼロ幅スペースを取り除く処理はこの取込経路に無い。BOMの除去も1行目の項目名だけが対象で（src/Eccube/Service/CsvImportService.php:178-179）、データ行の値は対象外。ゼロ幅スペースが混じった名前はマスタ突合に失敗し、未登録エラーで取込が中止される。ゼロ幅スペースを取り除く実装は別系統のCSVサービスにはある（src/Eccube/Service/Csv/AbstractCsvService.php:405-409）が、本経路からは使われていない。
- 判定根拠: 取込ファイルの前処理は src/Eccube/Service/CsvImportService.php:97-108 のフィルタ適用と同:178-179 のBOM除去だけである。ゼロ幅スペースを取り除く記述を実装全体で検索したが、この取込経路には存在しない（該当は src/Eccube/Service/Csv/AbstractCsvService.php:405-409 のみで、本経路とは別系統）。
- 確信度: med

### sheet-12-R045 アーキタイプ登録CSVアップロード — 実装違い／ふるまい／P3

- 正本: sheet-12（アーキタイプ登録CSVアップロード） HTML行 2248 付近
- 正本引用: 「「色」が空またはカンマだけのときは設定を行わないため、既存の色が残る」
- 設計期待値: 「色」がカンマだけのときは色を設定せず、既存アーキタイプの色をそのまま残す。
- 画像確認: sheet-12_img1.png を確認。レイアウト図では「CSV,TSVファイル選択」「CSV,TSVファイルのアップロード」「アーキタイプ登録CSV,TSVファイルフォーマット」のTSV表記と、表の「旧アーキタイプID」列が赤線で削除指定されている。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/ArchetypeUpdateImportHandler.php:177-185`
- 実装実態: 空判定が「カンマを除いた結果」ではなく前後の空白を落とした文字列そのままで行われている（src/Eccube/Service/Csv/Importer/Event/ArchetypeUpdateImportHandler.php:135、同:177）。値が「,」のように区切りだけの場合は空とみなされず、色名の分解結果が0件のまま色の集合を丸ごと置き換えるため（同:177-184、分解は同:215-221）、既存アーキタイプの色が消える。
- 判定根拠: 色列の空判定は src/Eccube/Service/Csv/Importer/Event/ArchetypeUpdateImportHandler.php:135 と同:177 のみで、カンマを除いた結果で判定していない。分解処理（同:215-221）は空要素を落とすため「,」は0件になり、同:177-184 の置き換えで色が空のまま設定される。
- 確信度: high

### sheet-3-R025 デッキ一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（デッキ一覧(検索入力)） HTML行 1114 付近
- 正本引用: 「3 デッキID 数値、スペース、カンマ - 50文字 4 旧デッキID 文字列 - ※カスタマイズ対応、項目を除去する」
- 設計期待値: 検索項目「デッキID」は50文字までを受け付け、50文字を超える入力は入力エラーとして扱われ検索は行われない。
- 画像確認: sheet-3_img1.png のレイアウト図を確認。検索フォームの全項目（デッキID/フォーマット/カラー/アーキタイプ/公開状態/デッキリスト公開状態/イベント開催日/イベント名/日付クリア/順位/成績/デッキ名/プレイヤー名/タグ/カード名/イベント詳細ID/開催店舗/最終更新者/検索条件をクリア/検索する）が図中にあり、旧デッキID・DCIナンバー・イベントIDには赤の取り消し線が引かれている。img2 は空白画像。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchDeckType.php:47-54`
- 実装実態: SearchDeckType は検索テキスト項目の文字数上限に eccube_stext_len を渡しており、その値は 255 である（app/config/eccube/packages/eccube.yaml:141）。そのため 50 文字を超える入力もエラーにならずそのまま検索が実行される。現行(pf-eccube3)の同名設定値は 50 であった。
- 同じ実装実態でまとまる要求: sheet-3-R037（デッキ一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchDeckType.php:125-131`）、sheet-3-R041（デッキ一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchDeckType.php:142-148`）、sheet-3-R048（デッキ一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchDeckType.php:55-61`）、sheet-3-R050（デッキ一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchDeckType.php:149-155`）、sheet-3-R054（デッキ一覧(検索入力) / 実装参照 `src/Eccube/Form/Type/Admin/SearchDeckType.php:171-178`）
- 判定根拠: 項目表の最大値欄は50文字だが、実装の上限は255文字。50文字を超える語を入れても検索が実行される。現行 pf-eccube3 の stext_len は 50 で、設計の50文字と一致していた（src/Eccube/Form/Type/Admin/SearchDeckType.php:47-54）。
- 確信度: high

### sheet-3-R035 デッキ一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（デッキ一覧(検索入力)） HTML行 1124 付近
- 正本引用: 「10 イベント開催日(From) 文字列(yyyy/mm/dd) - 3か月前の日付 カレンダー選択　初期値として3か月前の日付が入力されている」
- 設計期待値: イベント開催日の検索項目には「イベント開催日」というラベルが表示され、開始日の初期値として3か月前の日付が入っている。
- 画像確認: sheet-3_img1.png のレイアウト図を確認。検索フォームの全項目（デッキID/フォーマット/カラー/アーキタイプ/公開状態/デッキリスト公開状態/イベント開催日/イベント名/日付クリア/順位/成績/デッキ名/プレイヤー名/タグ/カード名/イベント詳細ID/開催店舗/最終更新者/検索条件をクリア/検索する）が図中にあり、旧デッキID・DCIナンバー・イベントIDには赤の取り消し線が引かれている。img2 は空白画像。
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:4373;src/Eccube/Form/Type/Admin/SearchDeckType.php:110-117`
- 実装実態: 開始日の初期値は3か月前で設計どおりだが、画面に出るラベルは「開催日」である（src/Eccube/Resource/locale/messages.ja.yaml:4373）。
- 同じ実装実態でまとまる要求: sheet-3-R055（デッキ一覧(検索入力) / 実装参照 `src/Eccube/Resource/locale/messages.ja.yaml:4388;src/Eccube/Form/Type/Admin/SearchDeckType.php:179-185`）
- 判定根拠: 項目表のラベルは「イベント開催日(From)」、レイアウト図も「イベント開催日」。現行(pf-eccube3)のform.deck.event_date.label も「イベント開催日」だった。実装の文言は「開催日」（src/Eccube/Resource/locale/messages.ja.yaml:4373）。初期値3か月前は実装済み（src/Eccube/Form/Type/Admin/SearchDeckType.php:110-117）。
- 確信度: high

### sheet-3-R075 デッキ一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（デッキ一覧(検索入力)） HTML行 1168 付近
- 正本引用: 「フォーマットは表示順、表示順が同じときは登録の古い順に並べる。開催店舗と最終更新者は表示順に並べる。アーキタイプは、アーキタイプ名にそのフォーマット名を添えて示す。」
- 設計期待値: 検索条件の選択肢は、フォーマットが表示順（表示順が同じときは登録の古い順）、開催店舗と最終更新者が表示順に並び、アーキタイプの選択肢はアーキタイプ名にそのフォーマット名を添えた文言で示される。
- 画像確認: sheet-3_img1.png のレイアウト図を確認。検索フォームの全項目（デッキID/フォーマット/カラー/アーキタイプ/公開状態/デッキリスト公開状態/イベント開催日/イベント名/日付クリア/順位/成績/デッキ名/プレイヤー名/タグ/カード名/イベント詳細ID/開催店舗/最終更新者/検索条件をクリア/検索する）が図中にあり、旧デッキID・DCIナンバー・イベントIDには赤の取り消し線が引かれている。img2 は空白画像。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchDeckType.php:84-91;src/Eccube/Form/Type/Admin/SearchDeckType.php:179-185`
- 実装実態: アーキタイプの選択肢はアーキタイプ名だけでフォーマット名が添えられない。開催店舗の選択肢は並び順の指定が無く、表示順に並ばない。フォーマットと最終更新者の並びは設計どおり。
- 判定根拠: アーキタイプの選択肢文言はアーキタイプ名のみ（src/Eccube/Form/Type/Admin/SearchDeckType.php:84-91）。フォーマット名を添えるsrc/Eccube/Entity/DtbArchetype.php:309-312 は用意されているが検索フォームからは使われていない。開催店舗の選択肢には並び順の指定が無い（src/Eccube/Form/Type/Admin/SearchDeckType.php:179-185）。現行(pf-eccube3)はアーキタイプにフォーマット名を添え、店舗を表示順で並べていた。
- 確信度: high

### sheet-5-R024 デッキ編集 — 実装違い／IO／P3

- 正本: sheet-5（デッキ編集） HTML行 1427 付近
- 正本引用: 「4枚制限ルールのあるカードが5枚以上入力されている場合「 n 行目の {カード名} が5枚以上登録されています」」
- 設計期待値: 1枚あたり4枚までのカードが5枚以上入力されたとき、行番号とカード名を挙げて「5枚以上登録されています」という警告文を表示する
- 画像確認: 該当の図に判定を変える記述は無い
- 実装参照: `src/Eccube/Resource/locale/messages.ja.yaml:4431;src/Eccube/Service/Deck/DeckValidationService.php:256-261`
- 実装実態: 同じ条件（5枚以上）で警告は出るが、文言が「%row% 行目の %name% が%count%枚を超えて登録されています」（%count%=4）で、画面表示は「…が4枚を超えて登録されています」になる（src/Eccube/Resource/locale/messages.ja.yaml:4431、src/Eccube/Service/Deck/DeckValidationService.php:256-261）
- 判定根拠: 検出条件は count>4 で設計と一致（src/Eccube/Service/Deck/DeckValidationService.php:256）。差は表示文言のみ
- 確信度: med

### sheet-5-R135 デッキ編集 — 実装違い／ふるまい／P3

- 正本: sheet-5（デッキ編集） HTML行 1566 付近
- 正本引用: 「識別ID:2「複製保存」押下時は必須」
- 設計期待値: 指定回数が空のまま複製保存を押したときは、複製せずに入力が必要である旨のエラーを表示する
- 画像確認: img5の指定回数欄は未入力のプレースホルダ表示
- 実装参照: `src/Eccube/Form/Type/Admin/DeckCopyType.php:31-38;src/Eccube/Controller/Admin/Deck/DeckController.php:444-473`
- 実装実態: 指定回数は任意項目で、空のときの検証が無い（src/Eccube/Form/Type/Admin/DeckCopyType.php:31-38。値が空なら比較の制約は評価されない）。空で複製保存すると検証を通り、複製回数0で1件も複製しないまま完了メッセージ「保存しました」を表示して編集画面へ戻る（src/Eccube/Controller/Admin/Deck/DeckController.php:444-473、src/Eccube/Service/Admin/Deck/DeckCopyAction.php:41-87）
- 判定根拠: 画面側にも入力必須の指定は無い（src/Eccube/Resource/template/admin/Deck/edit.twig:335-339、初期値1のみ）。図の指定回数欄も未入力のプレースホルダ表示で、空で押せる経路がある
- 確信度: med

### sheet-5-R164 デッキ編集 — 実装違い／IO／P3

- 正本: sheet-5（デッキ編集） HTML行 1599 付近
- 正本引用: 「文字コードの設定が SJIS-win のときは、応答の文字集合の表記だけを windows-31j に読み替える。」
- 設計期待値: CSV出力の応答には本文の文字集合の表記を添え、文字コードの設定がSJIS-winのときはwindows-31jと示す
- 画像確認: 該当の図に判定を変える記述は無い
- 実装参照: `src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:86-87`
- 実装実態: 応答の内容の種別を application/octet-stream 固定にしており、文字集合の表記そのものを持たないため読み替えも起きない（src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:86-87）
- 同じ実装実態でまとまる要求: sheet-5-R166（デッキ編集）
- 判定根拠: 文字集合を示す箇所が実装に無い。R166と同一の欠陥
- 確信度: med

### sheet-8-R007 デッキタグ一覧 — 実装違い／ふるまい／P3

- 正本: sheet-8（デッキタグ一覧） HTML行 1842 付近
- 正本引用: 「表示順は必須で1以上999999以下とし、他のデッキタグと同じ表示順は登録・更新できない。」
- 設計期待値: デッキタグの表示順に他のデッキタグと同じ値を入れたときは登録も更新もされず、1未満または999999を超える値も受け付けられない。日本語名・英語名は32文字を超えると保存されない。
- 画像確認: sheet-8 は画像0枚。レイアウト図が無く、本文（概要・現行仕様・表示メッセージ表）のみで判定した。
- 実装参照: `src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:51-87; src/Eccube/Service/EntityManager/MtgMasterDataEntityManager.php:62-66`
- 実装実態: デッキタグの保存では表示順が数値かどうかだけを見ており、他の行と同じ表示順でもそのまま保存される。1未満・999999超も通る。日本語名・英語名は入力欄側にも保存側にも長さの検査が無く、32文字超は保存直前まで進んで格納先の桁あふれとして中断され、画面には整形されていないエラー文が出る。表示順の一意性を担保する仕組みも無い（mtb_deck_tag に表示順の一意制約は作られていない）。
- 判定根拠: 必須・桁数・範囲・重複の4つのうち、実装が持つのは数値かどうかの判定だけ。表示順の重複はリニューアル後の仕様（表示メッセージ表）でも検証対象として残っているため、踏襲対象と判断した。
- 確信度: high

### sheet-9-R023 アーキタイプ管理(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-9（アーキタイプ管理(検索入力)） HTML行 1921 付近
- 正本引用: 「初期表示では、保持していた検索条件・ページ番号・表示件数を破棄し、条件が空で一覧を持たない状態から始める。」
- 設計期待値: 初期表示のあとに検索したときは、保持していた表示件数が捨てられているため既定の10件で一覧が出る。
- 画像確認: sheet-9_img1.png を確認。初期表示の画面には表示件数の指定部品が描かれておらず、初期表示時点の保持値がそのまま次の検索に効く作りである。
- 実装参照: `src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:108-118`
- 実装実態: 初期表示では検索条件とページ番号は捨てられるが、表示件数は捨てるのではなく100件が書き込まれる（src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:108-112）。その後の検索は保持された値を優先するため（src/Eccube/Controller/Admin/SearchControllerTrait.php:155-160）、既定の10件ではなく1ページ100件で一覧が出る。100件は表示件数の選択肢に含まれるため既定へ戻す分岐にも掛からない（app/DoctrineMigrations/Version20260527100000.php:34-40）。
- 判定根拠: ArchetypeController::index の初期表示分岐（src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:108-118）で、検索条件とページ番号は初期化されるのに表示件数だけ 100 が書き込まれている。検索側は保持値を優先し（src/Eccube/Controller/Admin/SearchControllerTrait.php:154-160）、100 は選択肢に存在するため既定へ戻す分岐にも掛からない（app/DoctrineMigrations/Version20260527100000.php:34-40）。結果として初期表示直後の検索は1ページ100件で表示される。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 2件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 3件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0212/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 9 | 0 | 0 | 0 | 9 |
| sheet-2 | 目次 | 23 | 0 | 0 | 0 | 23 |
| sheet-3 | デッキ一覧(検索入力) | 104 | 0 | 9 | 2 | 93 |
| sheet-4 | デッキ一覧(検索結果) | 59 | 0 | 0 | 0 | 59 |
| sheet-5 | デッキ編集 | 171 | 0 | 4 | 0 | 167 |
| sheet-6 | デッキ登録CSVアップロード | 36 | 0 | 0 | 0 | 36 |
| sheet-7 | デッキ登録CSV | 29 | 0 | 0 | 0 | 29 |
| sheet-8 | デッキタグ一覧 | 21 | 0 | 4 | 0 | 17 |
| sheet-9 | アーキタイプ管理(検索入力) | 46 | 0 | 1 | 0 | 45 |
| sheet-10 | アーキタイプ管理(検索結果) | 25 | 0 | 0 | 0 | 25 |
| sheet-11 | アーキタイプ編集 | 86 | 0 | 3 | 0 | 83 |
| sheet-12 | アーキタイプ登録CSVアップロード | 49 | 1 | 4 | 0 | 44 |
| sheet-13 | アーキタイプ登録CSV | 10 | 0 | 0 | 0 | 10 |
| sheet-14 | 直近の大会管理 | 40 | 0 | 0 | 0 | 40 |

