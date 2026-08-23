# 実装乖離監査 — 0213_基本設計仕様書(データ管理).html

- 正本: `excel_to_html/output/0213_基本設計仕様書(データ管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **368要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 0 | ○ |
| 実装違い | 実装はあるが設計と違う | 23 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 252 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 93 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **368** | |

## 不具合 9件（P1 0 / P2 1 / P3 8）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 11件は重複として代表へ折り畳んだ（判定そのものは 20件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-6-R060 | MTGマスターデータ | 未実装 | ふるまい | P2 | カードタイプの一覧では、行を識別するキーの値が14以下の行は並び順の列以外を編集できない（読み取り専用で表示され、保存しても値が変わらない）。 |
| sheet-3-R016 | バナー設定 | 実装違い | IO | P3 | アップロード済み画像の一覧は、保管先のファイル名（フォルダ名を含む）の降順に並び、先頭2000件までが表示される。 |
| sheet-3-R018 | バナー設定 | 実装違い | ふるまい | P3 | 店舗を指定して開いていたときは、バナー設定の保存後もその店舗で絞り込んだトップバナー管理画面に戻る。 |
| sheet-5-R025 | 祝日管理 | 実装違い | ふるまい | P3 | 手入力での追加で、操作の有効期限が切れた（なりすまし対策の値が不正な）要求は、追加せずアクセス拒否（HTTP403）の応答とする。 |
| sheet-6-R051 | MTGマスターデータ | 実装違い | ふるまい | P3 | 編集できる種別として妥当な種別が確定していないときは、マスターデータの一覧表と登録ボタンの領域を画面に出さない。 |
| sheet-6-R057 | MTGマスターデータ | 実装違い | ふるまい | P3 | 読み取り専用にする行は、行を識別するキーの値が種別ごとの境界値以下である行とする。 |
| sheet-6-R080 | MTGマスターデータ | 実装違い | ふるまい | P3 | 編集フォームの検証（なりすまし対策の値を含む）に失敗した保存要求は、保存せず「見つかりません」の応答（HTTP404）とし、成功・失敗メッセージも表示しない。 |
| sheet-7-R015 | 販売割引率一覧 | 実装違い | IO | P3 | カード状態と割引の組み合わせに割引率が登録されていないセルには「未定義」と表示される。 |
| sheet-8-R033 | 買取価格対応表(一覧) | 実装違い | IO | P3 | 一覧の金額は、通貨記号「¥」と半角空白に続けて3桁区切りの整数で表示される（例 ¥ 9,800）。小数は表示しない。 |

### sheet-6-R060 MTGマスターデータ — 未実装／ふるまい／P2

- 正本: sheet-6（MTGマスターデータ） HTML行 1423 付近
- 正本引用: 「種別ごとに編集ロックの境界値を持つ。行を識別するキーの値が境界値以下の行では、並び順の列以外を読み取り専用にする。ロック行では表示開始日時・表示終了日時も日時ピッカーを使わず読み取り専用のままとする。」
- 設計期待値: カードタイプの一覧では、行を識別するキーの値が14以下の行は並び順の列以外を編集できない（読み取り専用で表示され、保存しても値が変わらない）。
- 画像確認: sheet-6_img1.png を確認。上部に単一選択セレクトと「選択」ボタン、中段に注意書き4行、表の先頭列が sort_no、下部固定バーに「登録」、右上の別枠「登録」は赤線で消されている。
- 実装参照: `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:83、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`
- 実装実態: カードタイプには編集ロックの境界値が設定されておらず（設定値 -1）、全行の全項目が編集可能な入力欄として表示され、保存すると上書き・削除できる。
- 同じ実装実態でまとまる要求: sheet-6-R061（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:195、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）、sheet-6-R063（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:206、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）、sheet-6-R064（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:218、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）、sheet-6-R065（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:151、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）、sheet-6-R066（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:128、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）、sheet-6-R067（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:173、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）、sheet-6-R070（MTGマスターデータ / 実装参照 `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:94、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`）
- 判定根拠: src/Eccube/Controller/Admin/Data/MtgMasterDataController.php の種別定義で編集ロックの境界値を持つのはボード3・特殊タイプ7・ルール適用度5の3種別だけ（src/Eccube/Entity/Master/MtbBoard.php:29、src/Eccube/Entity/Master/MtbSpecialtype.php:30、src/Eccube/Entity/Master/MtbRel.php:29）。カードタイプは src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:83 で -1 が指定されており、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92 の読み取り専用判定が常に成立しない。設計の境界値表12種別のうち9種別でロックが無い。
- 確信度: high

### sheet-3-R016 バナー設定 — 実装違い／IO／P3

- 正本: sheet-3（バナー設定） HTML行 1070 付近
- 正本引用: 「画像一覧は、店舗の指定が無いときはバナー用フォルダ直下、指定があるときはその店舗別フォルダ配下のファイルを取得し、保管先のファイル名（フォルダ名を含む）の降順に並べて先頭2000件までを表示する。」
- 設計期待値: アップロード済み画像の一覧は、保管先のファイル名（フォルダ名を含む）の降順に並び、先頭2000件までが表示される。
- 画像確認: sheet-4_img1.png の一覧は1行目が2025/08/01 17:09:13、2行目が2025/08/01 18:15:28 で更新日時の降順になっておらず、ファイル名(66da…→666b…)の降順に並んでいる。設計側の並びはファイル名降順である。
- 実装参照: `src/Eccube/Service/Admin/Data/TopBannerFileListAction.php:61-68`
- 実装実態: 取得したファイルを更新日時の降順に並べ替えてから先頭2000件を返すため、ファイル名の降順にはならず、同じファイル名でも更新日時が新しいものが先に来る並びになる。
- 同じ実装実態でまとまる要求: sheet-4-R025（画像設定）
- 判定根拠: 取得対象フォルダ（直下／店舗別）と2000件の上限は一致するが（src/Eccube/Service/Admin/Data/TopBannerFileListAction.php:35-37,68）、並べ替えの基準が更新日時になっている（src/Eccube/Service/Admin/Data/TopBannerFileListAction.php:61-65）。画面側は取得順のまま描画する（src/Eccube/Resource/template/admin/Data/top_banner.twig:323-357）。
- 確信度: high

### sheet-3-R018 バナー設定 — 実装違い／ふるまい／P3

- 正本: sheet-3（バナー設定） HTML行 1072 付近
- 正本引用: 「保存後は完了メッセージを表示せずトップバナー管理画面へ戻る（店舗を指定して開いていたときは同じ店舗の画面へ戻る）。」
- 設計期待値: 店舗を指定して開いていたときは、バナー設定の保存後もその店舗で絞り込んだトップバナー管理画面に戻る。
- 画像確認: sheet-3_img1.png は店舗の絞り込みを描いていないため図からは判定できない。sheet-4_img1.png の店舗絞り込み（全て）が保存後に維持されるかが対象。
- 実装参照: `src/Eccube/Controller/Admin/Data/TopBannerController.php:167`
- 実装実態: 保存後の戻り先が店舗の指定を持たないトップバナー管理画面に固定されているため、店舗を指定して開いた画面から保存すると絞り込みのない画面に戻り、下部の画像一覧が全店舗表示に変わる。
- 同じ実装実態でまとまる要求: sheet-4-R030（画像設定 / 実装参照 `src/Eccube/Controller/Admin/Data/TopBannerController.php:140`）
- 判定根拠: 並び順の昇順連番割り当てと各項目の設定（src/Eccube/Service/Admin/Data/TopBannerStoreAction.php:39-77 / src/Eccube/Service/EntityManager/TopBannerEntityManager.php:43-51）、リンク未入力時の空文字（src/Eccube/Service/Admin/Data/TopBannerStoreAction.php:55）は一致する。戻り先だけが店舗の指定を落としている（src/Eccube/Controller/Admin/Data/TopBannerController.php:167。削除時は src/Eccube/Controller/Admin/Data/TopBannerController.php:215-219 で店舗を保っている）。なお「完了メッセージを表示せず」はリニューアル後のM16-01-MSG-004（保存しました）が優先されるため乖離として扱わない。
- 確信度: med

### sheet-5-R025 祝日管理 — 実装違い／ふるまい／P3

- 正本: sheet-5（祝日管理） HTML行 1279 付近
- 正本引用: 「1 操作の有効期限 不正なときは追加せず、アクセス拒否（HTTP403）とする」
- 設計期待値: 手入力での追加で、操作の有効期限が切れた（なりすまし対策の値が不正な）要求は、追加せずアクセス拒否（HTTP403）の応答とする。
- 画像確認: sheet-5_img1.png/_img2.png を確認。img1 は右上「新規登録」、開始日～終了日の日付欄と「上記の期間の休日をまとめて追加」帯、右に「決定」、下に名称／日付／削除の一覧。img2 は「新規登録」押下後で、右上が「戻る」に変わり「新規追加」枠（名称・日付・追加）が開く。
- 実装参照: `src/Eccube/Controller/Admin/Data/HolidayController.php:119-132`
- 実装実態: なりすまし対策の値が不正な追加要求は、追加はされないが、アクセス拒否ではなく一覧画面へ戻し「登録できませんでした。」を表示する応答になる。
- 同じ実装実態でまとまる要求: sheet-5-R048（祝日管理 / 実装参照 `src/Eccube/Controller/Admin/Data/HolidayController.php:119-132、src/Eccube/Controller/Admin/Data/HolidayController.php:164-174`）
- 判定根拠: 追加は src/Eccube/Controller/Admin/Data/HolidayController.php:120 の検証結果だけで分岐し、不正な値は他の入力不備と同じ経路で src/Eccube/Controller/Admin/Data/HolidayController.php:129-131 のエラー表示＋一覧へ戻る扱いになる。削除側は src/Eccube/Controller/Admin/Data/HolidayController.php:167 で src/Eccube/Controller/AbstractController.php:252-263 を呼びアクセス拒否（HTTP403）にしているが、追加側にその扱いは無い。
- 確信度: med

### sheet-6-R051 MTGマスターデータ — 実装違い／ふるまい／P3

- 正本: sheet-6（MTGマスターデータ） HTML行 1414 付近
- 正本引用: 「編集できるマスタ種別は、カードタイプ、サブタイプ、特殊タイプ、カラー、レアリティ、カードレイアウト、プロモーション、イラストレーター、リーガリティ、ボード、カードセットブロック、認定、言語、マナシンボル、ルール適用度、店舗、場所、お問い合わせ件名、デッキタグ、キャンペーンタグ、状態、色順、特殊サジェスト、特殊制限の24種別である。種別選択の送信内容が妥当なときにその種別を確定する。種別が未確定のときは一覧を組み立てない。一覧と登録ボタンの領域は、一覧が組み上がったときだけ画面に出す。」
- 設計期待値: 編集できる種別として妥当な種別が確定していないときは、マスターデータの一覧表と登録ボタンの領域を画面に出さない。
- 画像確認: sheet-6_img1.png を確認。上部に単一選択セレクトと「選択」ボタン、中段に注意書き4行、表の先頭列が sort_no、下部固定バーに「登録」、右上の別枠「登録」は赤線で消されている。
- 実装参照: `src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:70-152、src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:346-375`
- 実装実態: 種別の指定が一覧に無い値でも画面は同じ構成で描画され、列も行も無い空の表・注意書き・下部固定の登録ボタンがそのまま表示される。表と登録ボタンの表示を種別確定の有無で切り替える条件が無い。
- 判定根拠: src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:346 で該当種別が無い場合は columns と entityRows を空のまま返すだけで、src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:79-132 の表と src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:141-152 の登録ボタンは無条件に描画される。編集できる24種別（実装は店舗・場所を除いた22種別）に無い種別を指定して開くと、空表と登録ボタンだけの画面になる。
- 確信度: high

### sheet-6-R057 MTGマスターデータ — 実装違い／ふるまい／P3

- 正本: sheet-6（MTGマスターデータ） HTML行 1420 付近
- 正本引用: 「種別ごとに編集ロックの境界値を持つ。行を識別するキーの値が境界値以下の行では、並び順の列以外を読み取り専用にする。ロック行では表示開始日時・表示終了日時も日時ピッカーを使わず読み取り専用のままとする。」
- 設計期待値: 読み取り専用にする行は、行を識別するキーの値が種別ごとの境界値以下である行とする。
- 画像確認: sheet-6_img1.png を確認。上部に単一選択セレクトと「選択」ボタン、中段に注意書き4行、表の先頭列が sort_no、下部固定バーに「登録」、右上の別枠「登録」は赤線で消されている。
- 実装参照: `src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:41-47`
- 実装実態: 読み取り専用にする行を、一覧に並べた順で先頭から数えた位置が境界値以内かどうかで決めている。行のキーの値は見ていない。
- 判定根拠: src/Eccube/Resource/template/admin/Data/mtg_master_data.twig:92 は rowIndex+1 と境界値を比べており、src/Eccube/Service/Admin/Data/MtgMasterDataStoreAction.php:43 も並び順の先頭から境界値件を取り出してロック対象としている。並び順は画面から変更できるため、キーの値が境界値以下の行が編集可能になり、境界値より大きいキーの行が読み取り専用になることが起きる。読み取り専用にする範囲（並び順の列以外）は設計どおり。
- 確信度: med

### sheet-6-R080 MTGマスターデータ — 実装違い／ふるまい／P3

- 正本: sheet-6（MTGマスターデータ） HTML行 1445 付近
- 正本引用: 「編集フォームの検証失敗（なりすまし対策トークンを含む） HTTP 404 とする。共通の成功・失敗メッセージは表示しない」
- 設計期待値: 編集フォームの検証（なりすまし対策の値を含む）に失敗した保存要求は、保存せず「見つかりません」の応答（HTTP404）とし、成功・失敗メッセージも表示しない。
- 画像確認: sheet-6_img1.png を確認。上部に単一選択セレクトと「選択」ボタン、中段に注意書き4行、表の先頭列が sort_no、下部固定バーに「登録」、右上の別枠「登録」は赤線で消されている。
- 実装参照: `src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:377-406`
- 実装実態: 検証に失敗した保存要求は、保存されないまま同じ画面が通常の応答（HTTP200）で描画される。見つからない応答にはならない。
- 同じ実装実態でまとまる要求: sheet-6-R084（MTGマスターデータ）
- 判定根拠: src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:379 が検証成功時だけ保存へ進み、失敗時は分岐せずそのまま src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:411-419 の画面描画に落ちる。応答は200で、メッセージも出ない（メッセージ非表示の部分は設計どおり）。
- 確信度: med

### sheet-7-R015 販売割引率一覧 — 実装違い／IO／P3

- 正本: sheet-7（販売割引率一覧） HTML行 1516 付近
- 正本引用: 「当該組み合わせの割引率が登録されていないとき	「未定義」を表示する」
- 設計期待値: カード状態と割引の組み合わせに割引率が登録されていないセルには「未定義」と表示される。
- 画像確認: sheet-7_img1.png を確認。ヘッダ行は 名称/NM/SP/MP/HP の5列、明細は各割引1行（1〜55）で絞り込み欄・ページャは描かれていない。中央は「割引率一覧リスト(記載省略)」の省略枠。 図の省略枠外に見えるセルはすべて値が入っており、未登録セルの見え方は図では確認できないため本文の記述に依拠した。
- 実装参照: `src/Eccube/Resource/template/admin/Data/discount.twig:67`
- 実装実態: 割引率が無いセルには「未定義」ではなくハイフン1文字「-」が表示される（src/Eccube/Resource/template/admin/Data/discount.twig:66-68）。同じ作りの買取減額率一覧では src/Eccube/Resource/template/admin/Data/buy_discount.twig:67 が「未定義」と表示しており、販売割引率一覧だけ文言が異なる。
- 判定根拠: 設計は未登録セルの表示を「未定義」と定めているが、実装は「-」を出す。画面に出る文言の相違であり内部挙動ではない。
- 確信度: high

### sheet-8-R033 買取価格対応表(一覧) — 実装違い／IO／P3

- 正本: sheet-8（買取価格対応表(一覧)） HTML行 1619 付近
- 正本引用: 「金額は通貨記号「¥」と半角空白を先頭に付け、3桁ごとにカンマで区切って表示する。小数は表示しない。」
- 設計期待値: 一覧の金額は、通貨記号「¥」と半角空白に続けて3桁区切りの整数で表示される（例 ¥ 9,800）。小数は表示しない。
- 画像確認: sheet-8_img1.png・sheet-9_img1.png はいずれも「¥ 20」「¥ 9,800」「¥ 30」と半角の¥＋空白で描かれており、設計本文と一致する。
- 実装参照: `src/Eccube/Resource/template/admin/Data/buy_price_list.twig:73; src/Eccube/Twig/Extension/EccubeExtension.php:180-188`
- 実装実態: 金額は共通の金額書式で描画され、日本語ロケールの通貨書式のまま全角の「￥」に空白なしで数値が続く形（￥9,800）になる。3桁区切りと小数なしは一致するが、通貨記号の字体と半角空白が設計と異なる。
- 判定根拠: 一覧のNM価格と各買取価格は共通の金額フィルタを通して描画しており（src/Eccube/Resource/template/admin/Data/buy_price_list.twig:69 と src/Eccube/Resource/template/admin/Data/buy_price_list.twig:73）、そのフィルタは日本語ロケール・JPYの通貨書式をそのまま用いる（src/Eccube/Twig/Extension/EccubeExtension.php:180-188）。同ロケールの通貨書式は「￥9,800」で、先頭が全角の「￥」かつ半角空白を伴わない。3桁区切りと小数なしは一致する。
- 確信度: med

## 掲載しなかった判定

- 区分が「表示メッセージ」の指摘 3件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0213/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 12 | 0 | 0 | 0 | 12 |
| sheet-3 | バナー設定 | 58 | 0 | 2 | 0 | 56 |
| sheet-4 | 画像設定 | 36 | 0 | 2 | 0 | 34 |
| sheet-5 | 祝日管理 | 69 | 0 | 4 | 0 | 65 |
| sheet-6 | MTGマスターデータ | 89 | 0 | 12 | 0 | 77 |
| sheet-7 | 販売割引率一覧 | 22 | 0 | 2 | 0 | 20 |
| sheet-8 | 買取価格対応表(一覧) | 37 | 0 | 1 | 0 | 36 |
| sheet-9 | 買取価格対応表(編集) | 29 | 0 | 0 | 0 | 29 |
| sheet-10 | 買取減額率一覧 | 9 | 0 | 0 | 0 | 9 |

