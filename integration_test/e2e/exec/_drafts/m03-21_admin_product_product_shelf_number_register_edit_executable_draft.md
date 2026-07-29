# 候補: m03-21 棚番号登録/編集 — 実行可能グレード候補（母集合89全量会計・更新系登録/編集）

> 2026-07-29 ／ **候補グレード（candidate・D6前）・excel-primary（区分=カスタマイズ・現行踏襲）**／
> 統治: `integration_test/CONCRETIZATION_GATES.md`（Gate A〜D・B1〜B15）を全適用。
> **著者=sonnet・レビュー=codex（著者≠レビュアー）。実装/実走なし・O5/O6/聖域/承認いずれも未主張。fixture_versionは全て @TBD-D5。**
>
> **会計（母集合89全数）: bound 39／TBD 10／excluded 40（=89・欠番0）**
>
> **codexレビューR1〜R5是正済み（挙動オラクル源は現行 pf-eccube3 の HareruyaEc プラグイン実装を file:line で確認・区分=カスタマイズ現行踏襲）**。要点:
> - **ページング/表示件数の分割・セッション更新は現行pf未実装**（ShelfNumberController.php:37 が `findBy([], ['sortNo'=>'ASC'])` で全件取得・twigにページャ/件数セレクト無し）。母集合085「表示件数で分割」・002/076「一覧（既定は最初のページ）表示」・004/005/078/079（ページ送り/表示件数のセッション更新）は**pf/Excelで動的挙動を裏付けられずeeのみ＝TBD**（R5 Major1）。C-001は「全件をsortNo昇順で表示」というpf実挙動のみをboundし分割は主張しない。sortNo昇順の並びはCSV全件出力（C-013）で検証。
> - **名称の一意制約は UniqueEntity フォームバリデーション**（DtbShelfNumber.dcm.yml:6）。既存名称の再送信は `form->isValid()` が偽となりフォーム項目下の一意エラーで再描画・非保存（ShelfNumberController.php:58）＝deterministicにbound（C-008・母集合017）。flush時の `UniqueConstraintViolationException`＋`admin.error.non_unique`は事前検証を両者通過する並行競合時のみの経路＝母集合086のTBD側でbindに使わない（R5 Major2）。
> - **検証失敗時は登録失敗のトップフラッシュを積まず**、同テンプレートを再描画してフォーム項目下エラーを出すのみ（ShelfNumberController.php:58-64）＝C-004/005/015/016の画面期待は「フィールド下エラー＋再描画＋非保存」に限定（トップフラッシュ・HTTPステータスは使わない・R3〜R5）。
> - **削除メッセージは実pf逐語**: 確認ダイアログ＝`admin.confirm.delete`「%s を削除してもよろしいですか？」（message.ja.yml:1036・棚番号名でformat）／削除成功＝`admin.delete.complete`「削除が完了しました。」（:85）／削除拒否＝`admin.shelf_number.delete.failed`（参照判定は pf: dtb_product_sub_class）。登録成功「登録が完了しました。」・名称正規表現「※名称は…」・NotBlank「入力されていません。」も実pfで一致確認しbound（R4/R5）。
> - **excel claim純度**: L1-005(excel)はExcel逐語（件数選択肢9値）のみ＝実装事実（pf未実装）は根拠から除去しTBD行の理由へ集約（R5 Major4）。
>
> **会計 before→after（R6→R7）: bound 36→39／TBD 10（不変）／excluded 43→40**。R6でC-014を「別機能M03-40へDELEG」としたが、実source（shelf_number.twig:16→ProductServiceProvider.php:371→ShelfNumberController::csv:153）で着地先が**本機能自身の同一コントローラの画面**と確定したためR7でbound復帰（067/070/082をboundへ戻す）。TBD10＝072,074,086,004,005,078,079,002,076,085。
>
> **R1〜R3で確定した設計判断（要約）**: 並び順の整数バリデーション（072/074）は数値入力欄で非整数を純UI送信できずTBD／登録失敗と編集失敗は別実行（新規=C-004/C-005・編集=C-015/C-016。名称最大長+1は「A-0000」で分離）／母集合086の並行競合はTBD・単一利用者の既存名称再送信はC-008でbound／089「規格側の自動再割当なし」はB9④でC-017 bound／CSVファイル名は逐語 `shelf_number_YYYYMMDDHHmmss.csv`。
>
> **M03-21 の姉妹機能（m03-14 略称タグ登録/編集）との差（bind の要点）**:
> - **名称に正規表現がある**: `^[A-Z][-][0-9]{3}$`（大文字英字1＋ハイフン＋数字3桁・例「X-099」＝Excel識別ID3・pf ShelfNumberType.php:30）。形式不一致でフォーム項目下に名称形式エラー（MSG-010）が出る＝**形式バリデーションが実在挙動として bound**（C-005/C-016）。名称は Symfony の長さ制約が無くDBは255・一意。正規表現が厳密5文字を強制するため「最大長+1（6文字以上）」は必ず形式不一致に収束し名称境界のTBDは無い。
> - **名称の一意制約は UniqueEntity フォームバリデーション**: `DtbShelfNumber` に `UniqueEntity: name`（dcm.yml:6）があり、**既存名称を再送信すると `form->isValid()` が偽となりフォーム項目下に一意エラーが出て再描画・非保存**（ShelfNumberController.php:58-64・FormValidHelper.php:22）＝deterministicにbound（C-008。エラー表示文言のリテラルは要実機のためbound期待に含めない）。flush時の `UniqueConstraintViolationException` 捕捉＋`admin.error.non_unique`（MSG-002）＋一覧リダイレクトは**事前検証を両者通過する並行競合時のみの経路**で単一実行では再現不能＝母集合086のTBD側（bindに使わない）。
> - **検証失敗はフラッシュを積まずフォーム再描画**: 現行pfのこの機能は検証失敗時に登録失敗のトップフラッシュを**積まず**、同テンプレートを再描画してフォーム項目下にフィールドエラー（MSG-010/011）を表示するのみ（ShelfNumberController.php:58-64）＝画面期待は「フィールド下エラー＋再描画＋非保存」に限定（トップフラッシュ・HTTPステータスは使わない）。検証失敗時のレスポンスにはPOST直後のフォーム状態が載る。
> - **削除ボタンは可視**: Excel識別ID11「削除」「削除ボタン。押下で確認ダイアログを表示」（0204:9039）＋pf twig の削除アンカー（`data-method="delete"`・data-message=`admin.confirm.delete`＝「%s を削除してもよろしいですか？」を棚番号名でformat・pf message.ja.yml:1036）＝削除は純UIで成立（C-010/011/012）。削除成功メッセージは `admin.delete.complete`「削除が完了しました。」（message.ja.yml:85）、削除拒否は `admin.shelf_number.delete.failed`（参照判定は pf: dtb_product_sub_class／DB正典ee: dtb_product_class 相当）。
> - **ページング/表示件数セレクトは現行pfに無い**: pf は一覧を `findBy([], ['sortNo'=>'ASC'])` で全件取得し（ShelfNumberController.php:37）twigにページャ/件数セレクトが無い。Excelは識別ID6(件数選択肢)・識別ID12(ページングリンク存在)を静的に規定するのみで、表示件数での分割やページ番号のセッション更新といった動的挙動は規定しない＝**pf/Excelとも動的挙動を裏付けずeeのみ＝母集合002/076/085/004/005/078/079はTBD**（eeをオラクルにしない規約）。C-001は「全件をsortNo昇順で表示する」というpf実挙動のみboundし分割は主張しない。sortNo昇順の並びはCSV全件出力（C-013・pf-backed）で検証する。
> - **CSV 出力・取込リンクは本画面の部品**: Excel識別ID1「CSV出力」ボタン（0204:9029）・識別ID2「CSV入力」＝棚番号登録CSV画面へ遷移（0204:9030）。「CSV出力」ボタンは本コントローラ自身のexportハンドラ（ShelfNumberController.php:116-141）でファイルをダウンロードする＝**bound（C-013）**。「CSV入力」リンク（admin_product_shelf_number_csv＝/product/shelf_number/import）は**本機能自身の ShelfNumberController::csv(:153)** が棚番号CSVアップロード画面を描画する＝同一コントローラの画面遷移で**bound（C-014・母集合067/070/082）**（R7で実source確定。M03-40は別URL/別コントローラの別機能）。取込のPOST処理本体（import アクション）は別扱い。
>
> **Gate B 自己監査済み（B1〜B15）要旨**:
> - **B1**: bound39行は1回の実行でpass/fail一意判定できる定言的挙動のみ。母集合の非定言（052/087「保存され得る」＝CSV別機能でexcluded・069「要ソース確認」＝admin.confirm.deleteに確定してC-012へbound・086「二名がほぼ同時/場合がある」＝並行競合で一意判定できずTBD・072/074「非整数入力」＝純UIで送信不能でTBD・002/076/085/004/005/078/079＝ページング/分割が現行pf未実装でTBD）を隔離。
> - **B2/B9/B10（純UI・画面優先）**: 登録/更新の内容は「画面入力→保存→編集画面再表示で保存値目視」を主検証（Playwright）。削除結果（行が消える/残る）は一覧で画面観測可（論理削除列なし＝物理削除だが観測は一覧）＝**DB直接照会は付さない**。編集失敗の永続値不変は失敗レスポンス内一覧では判定不能のため 自動検証(内部・DB) で確認（B9③）。
> - **B7/B15（機能種別非該当・スタブ→excluded）**: 検索機能なし(L1-031)→検索14(019-032)＋検索結果4(033-036)。項目間相関なし(L1-032)→相関4(012-015)＋DB相関016(重複しない名称は登録成功でC-003被覆)。※017はUniqueEntity検証失敗の実挙動としてC-008へbound。CSV取込処理は別画面(L1-033)→CSV処理スタブ(046,047,052,081,083,087)。矛盾/無関係/被覆済スタブ(010,037,038,039,041,049,050,051,053,058,073)。※089「規格側の自動再割当なし」はB9④更新対象外レコード不変としてC-017へbound（DB内部検証付き）。
> - **B4（en逐語）**: メッセージ ja は実pf逐語。**en は en一次資料の逐語で復旧**＝現行pfが本機能で実際に使うキーのうち en が在る MSG-003 admin.register.complete「Registration completed.」／MSG-011 NotBlank「No value found.」／MSG-012 IntegerType「Please enter an integer.」の**3件のみ LS=ja/en**。pf側キーに en一次資料が無い MSG-002/MSG-004/MSG-005(admin.delete.complete)/MSG-009(admin.confirm.delete) は（英訳なし）。eeの別キーのen値は本機能pf実装の文言と別物のため流用しない。B4「en文言はen一次資料の逐語のみ・無ければ英訳なし」を遵守（source_class は pf-fallback／excel のみ）。
> - **B8（観点補正）**: 母集合観点ラベルは節見出し×固定観点の直積で機械生成されノイズ。bindは期待テキスト実内容＋入力(列8)の整合で判定し、観点ラベルは文末`## 観点補正`表でemitが是正（母集合all_it_casesは不変・行1:1）。
>
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／更新系見本: `_drafts/m03-02_admin_product_product_edit_executable_draft.md`＋姉妹（同型タグ系）`_drafts/m03-14_admin_product_product_abbreviation_tag_register_edit_executable_draft.md`。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m03-21_admin_product_product_shelf_number_register_edit_oracle_draft.json`（正式パス直下には書かない）。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html` の **sheet-36=棚番登録 編集**（機能No **M03-21**＝0204:8983／機能名「棚番 登録／編集」＝0204:8984／概要「商品の棚番を登録・編集できる」＝0204:8985／作成者「大澤」更新者「堀部」＝0204:8977-8982）。
  - 画面項目一覧 識別ID1〜12（本文抽出＝0204:9029-9040）:
    - **識別ID1「CSV出力」CSV出力ボタン＝0204:9029**／**識別ID2「CSV入力」棚番号登録CSV画面に遷移＝0204:9030**。
    - **識別ID3「名称」書式=X-099・必須◯・説明「名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能」＝0204:9031**。
    - **識別ID4「並び順」必須◯・最大値「0〜32767」＝0204:9032**（後述の pf 食い違いあり）。
    - **識別ID5「登録」ボタン。入力内容をDBへ登録・更新＝0204:9033**／**識別ID6「件数」単一選択・選択肢 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件＝0204:9034**。
    - **識別ID10「編集」ボタン。押下で該当行の情報を(3)(4)に反映＝0204:9038**／**識別ID11「削除」ボタン。押下で確認ダイアログを表示＝0204:9039**／識別ID12「ページング」リンク＝0204:9040。
  - **後半（0204:9041以降の詳細設計書ブロック）は pf現行mdの埋込複製**（自己申告 `Source: functions/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.md`＝0204該当行）。当該範囲の引用元は **pf md の行**で表記。
- **挙動オラクルの正典＝現行pf実装（source_class=pf-fallback・R4で厳格化）**: 区分=カスタマイズ現行踏襲のため、挙動の正は**現行リポ pf-eccube3 の HareruyaEc プラグイン実装**とする。主要ファイル: `/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ShelfNumberController.php`・`Form/Type/Admin/Product/ShelfNumberType.php`・`Resource/template/admin/Product/shelf_number.twig`・メッセージ `Resource/locale/message.ja.yml`・NotBlank訳 `src/Eccube/Resource/locale/validator.ja.yml`（以下「pf-eccube3:file:行」）。※参考の `functions/pf-eccube3/…md`（pf-md）は ec-cube-enterprise を確認値として記述されており実pf挙動と食い違う箇所（一覧の分割/表示件数のセッション更新・検証失敗の登録失敗トップフラッシュ・削除完了/確認のメッセージキー等）があるため、**それらは実pf実装のfile:lineを正としてL1を是正**した。pf実装にもExcel設計にも無くeeのみの挙動はオラクル化せずTBD。DB関連の正典は ec-cube-enterprise。
- **共有インフラ（メッセージ照合のみ・EE値はL1に不使用）**: ee `src/Eccube/Resource/locale/messages.{ja,en}.yaml`。**鍵同定はpf md表ja文言との完全一致検索のみ**。M03-21のpf md表は**全メッセージのen列が（英訳なし）**であり、ee en.yamlに値が在るキー（admin.register.complete/failed・admin.error.non_unique・admin.common.delete_complete/delete_modal__message）も**pf-fallback claimへ混入させない**（en=（英訳なし）を採る・B4）。ee側の値の在処は§5の照合注記に限定。
- **名称の形式（境界判定の根拠・M03-21固有）**: 名称は**正規表現 `^[A-Z][-][0-9]{3}$`（厳密5文字・大文字英字1＋ハイフン＋数字3桁）に一致必須**（pf-md:135・Excel識別ID3=0204:9031）。Symfony `Length` 制約は無く（pf-md:144）永続先はDB 255・一意。**正規表現が厳密5文字を強制するため、名称の「最大長/最小長」の長さ境界は概念上存在せず**、6文字以上（最大長+1）は正規表現不一致で MSG-010、空（最小長-1）は NotBlank で MSG-011 に**必発収束**する（＝TBD化しない）。有効な形式値（例「A-001」）は保存成功。
- **並び順の範囲（Excel/pf 食い違い・§10で隔離）**: Excel識別ID4（0204:9032）は最大値「0〜32767」と記すが、**pf-md:136 は「フォーム種別には上下限や符号なし検証が無く」と明記**し、M03-21のメッセージ表（pf-md:302-313）に**範囲エラー用のメッセージが存在しない**。母集合に並び順の範囲境界を問う行は無いため（境界行042-045/054-057は名称=文字列長対象）、並び順の範囲挙動は**§10隔離（bind根拠に不使用）**とし、並び順は「必須・整数（非整数はMSG-012）」のみを bound する。
- 母集合: `integration_test/all_it_cases.tsv` の **IT-M03-21-ADMIN-PRODUCT-PRODUCT-SHELF-NUMBER-REGISTER-EDIT-001〜089（89行）**（欠番0・重複0）。実行方法内訳（母集合の列11観測値）: Playwright 多数／Playwright+手動確認／非UI 2（004,005）。
- **判定原則**: 観点ラベル・前提条件ラベルは節見出し×固定観点の巡回生成でノイズ。bindは各行の**「期待結果」実テキスト＋「入力データ」(列8)の整合**で判定する（入力が期待と矛盾/無関係な機械生成スタブは成功候補へrelabelせずexcluded）。

## §1 L1原子オラクル表

全34claim。**source_class列は excel／pf-fallback のみ**（standard-src/design/impl該当なし）。claim/quote/sourceは**現行pf(HareruyaEcプラグイン)実装のfile:line**を正典とする(区分=カスタマイズ現行踏襲)。**en文言はB4に従い en一次資料の逐語で復旧**＝現行pfが本機能で使うキーのうち en が在る MSG-003(Registration completed.)／MSG-011(No value found.)／MSG-012(Please enter an integer.) の3件のみ LS=ja/en。pf側キーに en一次資料が無い MSG-002／MSG-004／MSG-005(admin.delete.complete)／MSG-009(admin.confirm.delete) は（英訳なし）。

|oracle_id|claim_type|claim|逐語quote|根拠(file:line)|source_class|LS|
|---|---|---|---|---|---|---|
| L1-M0321-001 | screen_display | GET admin_product_shelf_number は上部に新規用フォーム(名称・並び順)と下部に棚番号一覧(各行 ID・名称・並び順・編集ボタン・削除ボタン)を表示する(pf HareruyaEcプラグイン実装＝一覧はページ分割せず全件を表示) | shelfNumbers…findBy([], ['sortNo' => 'ASC'])…for shelfNumber in shelfNumbers | pf-eccube3:ShelfNumberController.php:37,shelf_number.twig:78 | pf-fallback | ja |
| L1-M0321-002 | screen_display | ブロックタイトルは「商品管理」・メニューは menus=['product','shelf_number']・サブタイトルは「棚番号新規登録」(新規時)/「棚番号編集」(編集時)・フォームは名称と並び順の2欄 | block title 商品管理…set menus = ['product', 'shelf_number']…棚番号{{ id is not null ? '編集' : '新規登録' }} | pf-eccube3:shelf_number.twig:4,5,7 | pf-fallback | ja |
| L1-M0321-003 | list_order | 一覧は棚番号マスタ全件を sortNo 昇順(findBy sortNo ASC)で取得して表示する(pf実装は全件表示でページ分割・並べ替えUIなし) | findBy([], ['sortNo' => 'ASC']) | pf-eccube3:ShelfNumberController.php:37,60,120 | pf-fallback | ja |
| L1-M0321-005 | excel_delta | 識別ID6「件数」の表示件数セレクトの選択肢は 10/50/100/300/500/1000/2000/10000/12000 の9値である(Excel基本設計の画面部品定義) | 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件 | 0204.html:9034 | excel | ja |
| L1-M0321-006 | validation | 名称は必須(Assert\NotBlank)かつ正規表現^[A-Z][-][0-9]{3}$一致要(Assert\Regex)・並び順(sort_no)は必須の整数(IntegerType＋NotBlank・上下限検証なし)(pf ShelfNumberType) | new Assert\NotBlank() … new Assert\Regex(['pattern'=>'/^[A-Z][-][0-9]{3}$/'…]) … ->add('sort_no','integer',… 'constraints'=>[new Assert\NotBlank()]) | pf-eccube3:ShelfNumberType.php:27,28,34 | pf-fallback | ja |
| L1-M0321-007 | excel_delta | 識別ID5「登録」ボタンは入力内容をDBへ登録・更新する | 登録ボタン。入力内容をDBへ登録・更新 | 0204.html:9033 | excel | ja |
| L1-M0321-008 | save_success | 検証成功時はpersist/flushで保存しadmin.register.completeを積み admin_product_shelf_number(保存後idをパラメータに付与)へリダイレクトする(pf実装) | persist($shelfNumber); flush(); … addSuccess('admin.register.complete','admin'); return … redirect(… admin_product_shelf_number,['id'=>…]) | pf-eccube3:ShelfNumberController.php:67,68,75,77 | pf-fallback | ja |
| L1-M0321-009 | message | MSG-003 登録完了 admin.register.complete ja「登録が完了しました。」(pf core src/Eccube/Resource/locale/message.ja.yml:83)/en「Registration completed.」(ee messages.en.yaml:1676)表示位置=管理画面上部 | 登録が完了しました。 | pf-eccube3:src/Eccube/Resource/locale/message.ja.yml:83 | pf-fallback | ja/en |
| L1-M0321-010 | validation_fail | 検証失敗時(!isFormValid)はフラッシュを積まず同テンプレートshelf_number.twigを再描画するのみ(pf実装＝admin.register.failedのトップフラッシュは出さない)・フォーム項目下に form_errors のフィールドエラーが表示され保存(persist/flush)には進まない | if (!$this->isFormValid($app, $form)) { return $app->render('Product/shelf_number.twig', […]); } | pf-eccube3:ShelfNumberController.php:58,59,60,61,62,63,64 | pf-fallback | ja |
| L1-M0321-012 | message | MSG-011 未入力 NotBlank訳(pf core validator.ja.ymlがThis value should not be blank.を上書き)ja「入力されていません。」/en「No value found.」(ee validators.en.yaml:17)表示位置=フォーム項目下・名称/並び順の未入力時にフォーム項目下へ表示 | 入力されていません。 | pf-eccube3:src/Eccube/Resource/locale/validator.ja.yml:1 | pf-fallback | ja/en |
| L1-M0321-013 | regex_validation | 名称は Assert\Regex(pattern=/^[A-Z][-][0-9]{3}$/)で検証され、不一致(6文字以上・小文字・桁違い等)だと検証失敗経路(フラッシュなし・shelf_number.twig再描画)へ入りフォーム項目下にMSG-010が表示される | new Assert\Regex(['pattern' => '/^[A-Z][-][0-9]{3}$/', 'message' => …]) | pf-eccube3:ShelfNumberType.php:28,29,30,31 | pf-fallback | ja |
| L1-M0321-014 | message | MSG-010 名称形式 pf ShelfNumberType の Regex message にハードコードのリテラル(翻訳キーでない) ja「※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。」/en（英訳なし＝翻訳キーでなくen一次資料が存在しない）表示位置=フォーム項目下 | ※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。 | pf-eccube3:ShelfNumberType.php:30 | pf-fallback | ja |
| L1-M0321-015 | integer_validation | 並び順(IntegerType)に整数以外を入力するとフォーム項目下にMSG-012(整数エラー)を表示し検証失敗経路(フォーム再描画・非保存)へ入る | ->add('sort_no','integer',…) | pf-eccube3:ShelfNumberType.php:34 | pf-fallback | ja |
| L1-M0321-016 | message | MSG-012 整数入力 IntegerType既定 invalid_message ja「整数で入力してください。」(symfony form validators.ja.xlf)/en「Please enter an integer.」(vendor/symfony/form/Resources/translations/validators.en.xlf:66)表示位置=フォーム項目下 | 整数で入力してください。 | pf-eccube3:ShelfNumberType.php:34 | pf-fallback | ja/en |
| L1-M0321-017 | unique_validation | 名称はエンティティのUniqueEntity制約(dcm.yml)によりフォーム検証される。既存名称を再送信すると form->isValid() が偽となり検証失敗経路(フォーム項目下に一意エラー・再描画・非保存)へ入る＝単一実行で決定的。flush時のUniqueConstraintViolation捕捉＋admin.error.non_unique(L1-018)は事前検証を両者通過する並行競合時のみの経路 | UniqueEntity: name … return $form->isValid(); | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbShelfNumber.dcm.yml:6,app/Plugin/HareruyaEc/Controller/FormValidHelper.php:22 | pf-fallback | ja |
| L1-M0321-018 | message | MSG-002 値重複 admin.error.non_unique ja「値が重複しています。」(pf plugin HareruyaEc message.ja.yml:1190)/en（英訳なし）。※これはUniqueConstraintViolation捕捉時=並行競合の経路(母集合086 TBD側)で出るトップメッセージ。決定的な再送信(C-008)はUniqueEntity検証失敗のフィールドエラー経路のため本メッセージはbound期待に使わない | 値が重複しています。 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1190 | pf-fallback | ja |
| L1-M0321-019 | edit_display | 一覧のID/名称/並び順/編集ボタン(いずれも admin_product_shelf_number に id を付けたリンク)を押すと当該行の現行値(名称・並び順)が上部フォームに載る(pf twig) | path('admin_product_shelf_number', { 'id': shelfNumber.id }) … {{ form_widget(form.name) }} | pf-eccube3:shelf_number.twig:84,88,92,96 | pf-fallback | ja |
| L1-M0321-020 | screen_transition | 編集時はサブタイトルに「(admin.btn.new)はこちら」ボタンが出て、押下で admin_product_shelf_number(新規モード)へ戻る(保存はしない)(pf twig) | {% if id is not null %}<a href="{{ path('admin_product_shelf_number') }}">…{{ trans('admin.btn.new') }}はこちら</a> | pf-eccube3:shelf_number.twig:8,9,10,11 | pf-fallback | ja |
| L1-M0321-021 | delete_confirm | 一覧の削除ボタンは data-method="delete" と data-message(admin.confirm.delete を棚番号名でformat)を持つアンカーで、押下時に管理画面共通JSが確認ダイアログを表示・キャンセルで非送信で留まり承認でdeleteを送信する(pf twig) | data-method="delete" data-message="{{ trans('admin.confirm.delete')|format(shelfNumber.name) }}" | pf-eccube3:shelf_number.twig:98 | pf-fallback | ja |
| L1-M0321-022 | message | MSG-009 削除確認 admin.confirm.delete ja「%s を削除してもよろしいですか？」(pf plugin HareruyaEc message.ja.yml:1036・%sは棚番号名でformat＝例「A-001 を削除してもよろしいですか？」)/en（英訳なし＝pf側キーのen一次資料なし)表示位置=確認ダイアログ。pf twig の削除アンカー data-message で管理画面共通JSが表示 | %s を削除してもよろしいですか？ | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1036 | pf-fallback | ja |
| L1-M0321-023 | delete_reject | 削除実行時に当該棚番号を参照する商品規格サブ(dtb_product_sub_class)が存在すれば admin.shelf_number.delete.failed(棚番号名でsprintf)を積み admin_product_shelf_number へリダイレクトし削除しない(pf実装＝参照判定は dtb_product_sub_class。DB正典eeでは dtb_product_class に相当) | $productSubClass = …findOneByShelfNumberId($id); if (!empty($productSubClass)) { $app->addError(sprintf($app->trans('admin.shelf_number.delete.failed'), $shelfNumber->getName()), 'admin'); return …redirect(…); } | pf-eccube3:ShelfNumberController.php:95,97,98,99,100 | pf-fallback | ja |
| L1-M0321-024 | message | MSG-004 削除拒否 admin.shelf_number.delete.failed ja「商品で使用されているため、「%s」の棚番号は削除することができません。」(pf plugin HareruyaEc message.ja.yml:1353・%sは棚番号名でsprintf)/en（英訳なし＝ee messages.en.yamlに当キーのen値なし）表示位置=管理画面上部 | 商品で使用されているため、「%s」の棚番号は削除することができません。 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1353 | pf-fallback | ja |
| L1-M0321-025 | delete_success | 参照が無ければ remove/flush で物理削除し admin.delete.complete を積み admin_product_shelf_number へリダイレクトする・一覧から当該行が消える(pf実装。成功フラッシュキーは admin.delete.complete) | $app['orm.em']->remove($shelfNumber); $app['orm.em']->flush(); $app->addSuccess('admin.delete.complete', 'admin'); | pf-eccube3:ShelfNumberController.php:103,104,105 | pf-fallback | ja |
| L1-M0321-026 | message | MSG-005 削除完了 pf は admin.delete.complete を使用 ja「削除が完了しました。」(pf core src/Eccube/Resource/locale/message.ja.yml:85。eeのadmin.common.delete_complete「削除しました」とは別キー・別文言)/en（英訳なし＝pf側キーのen一次資料を確認できず）表示位置=管理画面上部 | 削除が完了しました。 | pf-eccube3:src/Eccube/Resource/locale/message.ja.yml:85 | pf-fallback | ja |
| L1-M0321-027 | csrf | 登録・削除は FormValidHelper::checkCsrfValid で共通CSRFトークンを検証し、isTokenValid が偽なら AccessDeniedHttpException で拒否する(pf) | if (!$app['form.csrf_provider']->isTokenValid(...)) { throw new AccessDeniedHttpException('CSRF token is invalid.'); } | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:39,44,45 | pf-fallback | ja |
| L1-M0321-028 | csv_export | 「CSV出力」ボタンで棚番号マスタ全件をsortNo昇順・ヘッダー['ID','名称','並び順']のCSVで出力しダウンロード・ファイル名は shelf_number_ + YmdHis + .csv(pf実装) | const EXPORT_HEADER = ['ID', '名称', '並び順']; … $filename = 'shelf_number_' . $now->format('YmdHis'). '.csv'; | pf-eccube3:ShelfNumberController.php:19,139 | pf-fallback | ja |
| L1-M0321-029 | csv_nav | サブタイトルの「CSV入力」リンク admin_product_shelf_number_csv（GET /{admin_route}/product/shelf_number/import）は本機能自身の ShelfNumberController::csv が棚番号CSVアップロード画面を描画する＝別機能でなくM03-21同一コントローラの画面遷移(bound可)。取込POST本体は同コントローラのimportアクション | admin_product_shelf_number_csv → ShelfNumberController::csv | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/shelf_number.twig:16,app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:371,app/Plugin/HareruyaEc/Controller/Admin/Product/ShelfNumberController.php:153 | pf-fallback | ja |
| L1-M0321-030 | db_effect | 登録/更新はdtb_shelf_numberを直接persist/flushで保存し不要な削除を含まない(pf) | $app['orm.em']->persist($shelfNumber); $app['orm.em']->flush(); | pf-eccube3:ShelfNumberController.php:67,68 | pf-fallback | ja |
| L1-M0321-031 | no_feature | 本機能に検索機能・検索条件入力は無く、一覧は棚番号マスタ全件をsortNo昇順で表示するのみ(検索・絞り込みUIなし) | findBy([], ['sortNo' => 'ASC']) …(検索条件フォームなし) | pf-eccube3:ShelfNumberController.php:37,shelf_number.twig:78 | pf-fallback | ja |
| L1-M0321-032 | no_feature | バリデーションは単項目制約のみ(名称=NotBlank+Regex+UniqueEntity、並び順=NotBlank+Integer)で項目間相関ルールは無い(pf ShelfNumberType/エンティティ制約) | new Assert\NotBlank(); new Assert\Regex(...) ; UniqueEntity: name | pf-eccube3:ShelfNumberType.php:27,28 | pf-fallback | ja |
| L1-M0321-033 | no_feature | 棚番号マスタCSV取込のPOST処理本体は本コントローラの import アクション(ShelfNumberController::import:172)で、CSVアップロード画面(csv:153)は本機能自身の画面。取込処理の詳細(ファイル検証・行数上限・MSG-006/007/008)を問う母集合行は非定言/汎用スタブでbound不可 | ShelfNumberController::csv/import | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ShelfNumberController.php:153,172 | pf-fallback | ja |
| L1-M0321-034 | auth | 認可は管理画面共通の認証・認可に従い、本コントローラに機能固有の権限アノテーションは無い(pf ShelfNumberController)。未認証は管理画面共通のログイン誘導に従う | ShelfNumberController(ルート単位の個別権限アノテーションなし) | pf-eccube3:ShelfNumberController.php:1 | pf-fallback | ja |
| L1-M0321-035 | excel_delta | 識別ID11「削除」ボタンは画面上に存在し押下で確認ダイアログを表示する(削除ボタン可視・UI操作可能) | 削除ボタン。押下で確認ダイアログを表示 | 0204.html:9039 | excel | ja |
| L1-M0321-036 | data_integrity | 棚番号の更新は dtb_shelf_number を persist/flush するのみで、参照する商品規格サブ(dtb_product_sub_class)側の付け替え・行追加削除は行わない(pf実装は棚番号エンティティのみ保存)・規格側はM03-09別機能で本画面に現れない | persist($shelfNumber); flush();(商品規格サブへの再割当処理なし) | pf-eccube3:ShelfNumberController.php:67,68 | pf-fallback | ja |

## §2 SEED（fixture）

全fixtureは `@TBD-D5`。SEEDコードは前提/入力から参照。**削除確認/拒否の文言に埋める固定名称を各SEEDに定義**（整形で消えない具体名称・名称は正規表現 `^[A-Z][-][0-9]{3}$` に一致する値）。

| SEED | 内容 | 用途(候補ケース) |
|------|------|------------------|
| SEED-M01-ADMIN | 管理画面の管理者ログインアカウント（拒否URL該当なしロール・共通認証） | 全bound（ログイン前提） |
| SEED-M0321-SN-1 | 既存棚番号3件・商品規格の参照0件。**投入順/採番id順と sort_no 昇順が一致しない固定値**で登録: (1)**名称=「A-001」/sort_no=100**（最初に投入＝id最小）(2)**名称=「A-002」/sort_no=50**(3)**名称=「A-003」/sort_no=150**。id/投入順は A-001→A-002→A-003 だが sort_no 昇順は **A-002(50)→A-001(100)→A-003(150)** で不一致＝並び順が sort_no 昇順であることを一意判定できる | C-001（一覧sort_no昇順表示）,C-007（A-001編集）,C-010（A-001削除成功）,C-012（A-001削除キャンセル）,C-013（CSV全件sort_no昇順）,C-004/C-005/C-015/C-016（登録/編集の検証。A-001対象） |
| SEED-M0321-SN-MANY | 一覧が複数ページに跨る件数の棚番号（sort_no昇順・51件以上・参照0件） | （TBD 004/005/078/079 のページング/表示件数を実機確認する際に使用。現行pfはページング未実装のためboundでは不使用） |
| SEED-M0321-SN-LINKED | **名称=「B-002」**の棚番号を参照する商品規格サブ（pf: dtb_product_sub_class／DB正典ee: dtb_product_class 相当）が1件以上存在（削除拒否条件・名称更新時の参照不変条件） | C-011（削除拒否）・C-017（規格側自動再割当なし） |
| SEED-M0321-SN-DUP | 既存棚番号 **名称=「C-003」**（一意制約違反の再送信対象） | C-008（一意制約違反） |

## §4 実行可能グレード14列TSV（候補・bound 15候補・自己完結）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `{admin_route}` は環境値（既定 `admin`）。
- テストIDは `E2E-M0321C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- 期待は画面で目視できる結果を主、目視できない内部状態は `／ 自動検証(内部): …` に分離（B6/B9）。操作手順は純UI操作のみ（B10）。削除結果(行が消える/残る)は一覧で画面確認できるためDB照会は付さない（物理削除だが観測は一覧＝B9）。
- 母集合39bound行はemitがC-ref突合で代表1件のみtsv出力（B12）。bind内訳は §8対応表・§9.1参照。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-001	IT-M0321	画面表示データ	P2	棚番号登録/編集画面の初期表示（新規フォーム＋一覧＋削除ボタン＋sort_no昇順）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1 が存在（A-001/50・A-002・A-003 の3件を投入順とsort_no昇順が異なる固定値で登録）	なし（棚番号登録/編集画面を開く）	1. ナビ「商品管理>棚番号登録/編集」を開く 2. タイトル・ナビ・フォーム・一覧の各要素と行の並び順を確認	ブロックタイトル「商品管理」が表示され、ナビは商品管理>棚番号がアクティブ、サブタイトルは「棚番号新規登録」、上部に新規用フォーム（名称・並び順）と、下部に棚番号一覧（各行に ID・名称・並び順・編集ボタン・削除ボタン。削除ボタンは可視）が全件表示される。一覧の行は sortNo 昇順に並び、上から A-002（並び順50）→ A-001（並び順100）→ A-003（並び順150）の順で表示される（投入順/id順の A-001→A-002→A-003 とは異なる順＝並び順キーが sortNo 昇順であることが確認できる。現行pfは一覧をページ分割せず全件表示する） [L1:L1-M0321-001,L1-M0321-002,L1-M0321-003,L1-M0321-035; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-003	IT-M0321	登録内容	P1	棚番号の新規登録の成功（保存＋完了メッセージ＋一覧追加＋再表示）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1 が存在	名称=D-100（正規表現^[A-Z][-][0-9]{3}$一致）／並び順=200	1. 新規フォームに上記を入力 2.「登録」ボタンを押下 3. メッセージ・遷移・フォーム・一覧を確認	「登録が完了しました。」が管理画面上部に表示され、pfは保存後の棚番号idをパラメータに付けて admin_product_shelf_number へリダイレクトする（生成URLに保存後idが付く）。idありのGETは当該行を編集モードでロードするため、遷移先の上部フォームには保存した D-100（名称=D-100・並び順=200）が編集状態で表示され、下部一覧にも D-100 が追加表示される。既存の棚番号 A-001 も一覧に残る（不要な削除は起きない） [L1:L1-M0321-006,L1-M0321-007,L1-M0321-008,L1-M0321-009,L1-M0321-019,L1-M0321-030; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-004	IT-M0321	必須バリデーション	P2	新規登録の必須未入力失敗（フィールド下エラー・再描画・非保存）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1 が存在	名称を空にする（NotBlank違反。並び順は有効値100）	1. 新規フォームの名称を空のまま「登録」ボタンを押下 2. フィールドエラー・フォーム状態・一覧を確認	名称が未入力のため検証に失敗し、同じ棚番号登録/編集画面が再描画されて名称欄のフォーム項目下に「入力されていません。」が表示される（現行pfは検証失敗時に管理画面上部の「登録できませんでした。」トップフラッシュは出さず、フォームを再描画するのみ）。棚番号は新規追加されず、一覧に新しい行は増えない ／ 自動検証(内部): dtb_shelf_number に当該新規行が作られていない（検証失敗で persist/flush に到達しない） [L1:L1-M0321-006,L1-M0321-010,L1-M0321-012; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-005	IT-M0321	バリデーション	P2	新規登録の名称形式（正規表現）不一致失敗（形式エラー・再描画・非保存）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1 が存在	名称=A-0000（正しい形式 A-000 より数字が1桁多い6文字＝最大長+1・正規表現^[A-Z][-][0-9]{3}$不一致）／並び順=100	1. 新規フォームの名称に A-0000 を入力し「登録」ボタンを押下 2. フィールドエラー・フォーム状態・一覧を確認	名称が正規表現に一致しないため検証に失敗し、同じ画面が再描画されて名称欄のフォーム項目下に「※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。」が表示される（現行pfは検証失敗時にトップフラッシュを出さずフォームを再描画するのみ）。棚番号は新規追加されず一覧に新しい行は増えない。正規表現が厳密5文字を強制するため6文字以上は同じ形式エラーになる ／ 自動検証(内部): dtb_shelf_number に当該新規行が作られていない（検証失敗で persist/flush に到達しない） [L1:L1-M0321-006,L1-M0321-010,L1-M0321-013,L1-M0321-014; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-007	IT-M0321	更新内容	P1	既存棚番号の編集更新（現行値ロード＋値変更が一覧・再表示に反映）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1	名称=A-005／並び順=300	1. 一覧の編集ボタンで当該棚番号をフォームに読み込む 2. 名称・並び順を有効形式で変更 3.「登録」ボタンを押下 4. 一覧と編集画面再表示で反映を確認	編集ボタン押下で当該行の現行値（名称=A-001・並び順=100）がフォームに載り、変更後「登録が完了しました。」が表示され、一覧へ遷移して該当行が名称=A-005・並び順=300 で表示され、その行の編集ボタンで再度開くと更新値がフォームに再表示される [L1:L1-M0321-019,L1-M0321-008,L1-M0321-009,L1-M0321-030; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-008	IT-M0321	バリデーション	P2	名称の一意制約（UniqueEntity）違反での登録失敗（既存名称の再送信→フォーム検証失敗・フィールド下エラー・再描画・非保存）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-DUP（名称=C-003 が既存）	名称=C-003（既存と重複・形式は有効）／並び順=400	1. 新規フォームに既存名称 C-003 を入力し「登録」ボタンを押下 2. フィールドエラー・フォーム状態・一覧を確認	名称がエンティティの UniqueEntity 制約に反するためフォーム検証（form->isValid()）が偽となり、同じ画面が再描画されて名称欄のフォーム項目下に UniqueEntity（名称一意）の検証エラーが表示される（エラーが出るという挙動は決定的。正確な表示文言は一次資料で確定できず要実機確認）。C-003 は重複追加されず一覧の C-003 は1行のみのまま（現行pfは検証失敗時にトップフラッシュを出さず再描画するのみ。flush時の UniqueConstraintViolation＋『値が重複しています。』＋一覧リダイレクトは事前検証を両者通過する並行競合時のみの経路で、本ケース（単一利用者の逐次再送信）はUniqueEntity検証で先に失敗するため到達しない） ／ 自動検証(内部): dtb_shelf_number の名称C-003は1件のまま・当該重複行は未保存 [L1:L1-M0321-006,L1-M0321-017; fixture:SEED-M0321-SN-DUP@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-009	IT-M0321	画面遷移	P3	編集モードから「新規登録へ戻る」	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1	なし（編集モードで「新規登録へ戻る」リンク）	1. 一覧の編集ボタンで当該棚番号を開く（編集モード） 2.「新規登録へ戻る」リンクを押下 3. 遷移先とフォーム状態を確認	編集モードで「新規登録へ戻る」リンクが表示され、押下で GET /{admin_route}/product/shelf_number（新規フォーム＋一覧）へ戻り、上部フォームが空の新規状態になる（保存は行われない） [L1:L1-M0321-020,L1-M0321-019; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-010	IT-M0321	削除	P1	棚番号の削除成功（規格参照なし→確認ダイアログ→削除メッセージ・一覧から消える）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1（名称=A-001・商品規格の参照0件）	なし（一覧の削除ボタン→確認ダイアログ承認）	1. A-001 の行の削除ボタンを押下 2. 確認ダイアログで承認 3. メッセージ・一覧を確認	削除ボタン（data-method=delete）押下で削除確認ダイアログ「A-001 を削除してもよろしいですか？」（admin.confirm.delete＝「%s を削除してもよろしいですか？」を棚番号名でformat）が表示され、承認するとdeleteが送信され「削除が完了しました。」が管理画面上部に表示され、棚番号登録/編集画面（一覧）へ戻り一覧から A-001 の行が消える（物理削除・一覧で目視。他の A-002/A-003 は残る） [L1:L1-M0321-021,L1-M0321-022,L1-M0321-025,L1-M0321-026,L1-M0321-035; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-011	IT-M0321	削除	P1	棚番号の削除拒否（商品規格で使用中→拒否メッセージ・一覧に残る）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-LINKED（名称=B-002・当該棚番号を参照する商品規格サブ dtb_product_sub_class が1件以上存在）	なし（一覧の削除ボタン→確認ダイアログ承認）	1. B-002 の行の削除ボタンを押下 2. 確認ダイアログで承認 3. メッセージ・一覧を確認	承認後、当該棚番号を参照する商品規格サブ（pf実装は dtb_product_sub_class を参照判定。DB正典eeでは商品規格 dtb_product_class に相当）が存在するため削除されず、「商品で使用されているため、「B-002」の棚番号は削除することができません。」が管理画面上部に表示され、棚番号登録/編集画面（一覧）へ戻り B-002 は一覧に残る [L1:L1-M0321-021,L1-M0321-023,L1-M0321-024,L1-M0321-035; fixture:SEED-M0321-SN-LINKED@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-012	IT-M0321	削除	P3	削除確認ダイアログのキャンセル（非送信・留まる）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1（名称=A-001）	なし（一覧の削除ボタン→確認ダイアログでキャンセル）	1. A-001 の行の削除ボタンを押下 2. 確認ダイアログでキャンセル 3. 画面状態を確認	削除ボタン（data-method=delete）押下で削除確認ダイアログ「A-001 を削除してもよろしいですか？」（admin.confirm.delete＝「%s を削除してもよろしいですか？」を棚番号名でformat）が表示され、キャンセルするとdeleteを送信せず同じ棚番号登録/編集画面に留まり、A-001 は一覧に残る（削除されない） [L1:L1-M0321-021,L1-M0321-022; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-013	IT-M0321	画面表示データ	P2	CSV出力（マスタ全件のCSVダウンロード）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1 が存在	なし（画面上部「CSV出力」ボタン）	1. 画面上部の「CSV出力」ボタンを押下 2. ダウンロードされるCSVの行順を確認	「CSV出力」ボタン押下でマスタ全件のCSVがダウンロードされ、先頭にヘッダー行「ID,名称,並び順」があり、続くデータ行は sort_no 昇順に並び **A-002（並び順50）→ A-001（並び順100）→ A-003（並び順150）** の順（投入順/id順とは異なる順＝全件が sort_no 昇順で出力されることが確認できる）。ファイル名は shelf_number_YYYYMMDDHHmmss.csv 形式で添付扱いになる（末尾 YYYYMMDDHHmmss は出力日時） [L1:L1-M0321-028; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-014	IT-M0321	画面遷移	P2	CSV取込画面への遷移（本コントローラのCSVアップロード画面表示）	ログイン済(SEED-M01-ADMIN)	なし（画面上部「CSV入力」リンク）	1. 画面上部の「CSV入力」リンクを押下 2. 遷移先画面を確認	「CSV入力」リンク（admin_product_shelf_number_csv＝GET /{admin_route}/product/shelf_number/import）押下で、本機能自身の ShelfNumberController::csv が棚番号CSVアップロード画面（admin_csv_import フォーム）を描画し表示する。この着地先は本機能と同一コントローラの画面であり別機能への遷移ではない（取込のPOST処理本体は同コントローラの import ハンドラの責務） [L1:L1-M0321-029; fixture:—]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-015	IT-M0321	必須バリデーション	P1	編集更新の必須未入力失敗（既存行の名称クリア→フィールド下エラー・再描画・値不変）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1（名称=A-001・並び順=100 が存在）	編集モードで名称を空にクリアする（NotBlank違反。並び順は現行値100のまま）	1. 一覧の編集ボタンで A-001 を読み込む 2. 名称欄を空にクリアして「登録」ボタンを押下 3. フィールドエラー・フォーム状態を確認	名称が未入力のため検証に失敗し、同じ編集画面が再描画されて名称欄のフォーム項目下に「入力されていません。」が表示される（現行pfは検証失敗時にトップフラッシュを出さずフォームを再描画するのみ）。レスポンスにはPOST直後のフォーム状態が載り、名称欄は送信した空のまま・並び順欄は100のまま再表示される ／ 自動検証(内部): dtb_shelf_number の A-001 の行は永続値が name=A-001・sort_no=100 のまま（検証失敗で persist/flush に到達せずUPDATEされない。失敗レスポンス内の一覧はメモリ上のダーティ値を含み得るため永続値の不変はDBで確認する） [L1:L1-M0321-006,L1-M0321-010,L1-M0321-012,L1-M0321-019; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-016	IT-M0321	バリデーション	P1	編集更新の名称形式（正規表現）不一致失敗（既存行を形式外へ変更→形式エラー・再描画・値不変）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-1（名称=A-001 が存在）	編集モードで名称=A-0000（正しい形式 A-000 より数字が1桁多い6文字＝最大長+1・正規表現不一致）／並び順は現行値100	1. 一覧の編集ボタンで A-001 を読み込む 2. 名称を A-0000 に変更して「登録」ボタンを押下 3. フィールドエラー・フォーム状態を確認	名称が正規表現に一致しないため検証に失敗し、同じ編集画面が再描画されて名称欄のフォーム項目下に「※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。」が表示される（現行pfは検証失敗時にトップフラッシュを出さずフォームを再描画するのみ）。レスポンスにはPOST直後のフォーム状態が載り、名称欄は送信した A-0000 のまま再表示される ／ 自動検証(内部): dtb_shelf_number の A-001 の行は永続値が name=A-001・sort_no=100 のまま（検証失敗で persist/flush に到達せずUPDATEされない。失敗レスポンス内の一覧はメモリ上のダーティ値を含み得るため永続値の不変はDBで確認する） [L1:L1-M0321-006,L1-M0321-010,L1-M0321-013,L1-M0321-014,L1-M0321-019; fixture:SEED-M0321-SN-1@TBD-D5]				
m03-21_admin_product_product_shelf_number_register_edit	E2E-M0321C-017	IT-M0321	データ整合性	P3	更新に伴う商品規格側の自動再割当なし（棚番号名称を更新しても参照する商品規格の割当行は不変）	ログイン済(SEED-M01-ADMIN)／SEED-M0321-SN-LINKED（名称=B-002・当該棚番号を参照する商品規格サブ dtb_product_sub_class が存在）	編集モードで名称=B-005（有効形式）へ変更／並び順は現行値	1. 一覧の編集ボタンで B-002 を読み込む 2. 名称を B-005 に変更して「登録」ボタンを押下 3. 一覧に当該行が新名称で表示されることを確認	「登録が完了しました。」が表示され、一覧の当該行が名称=B-005 で表示される（本画面の一覧には棚番号のみ表示され、商品規格側の割当は本画面に表示されない） ／ 自動検証(内部): 当該棚番号を参照する商品規格サブ（pf: dtb_product_sub_class／DB正典ee: dtb_product_class 相当）の割当行は更新前後で同一（行の追加・削除・付け替えなし。棚番号側の name のみ更新され規格側の再割当は起きない） [L1:L1-M0321-008,L1-M0321-019,L1-M0321-036; fixture:SEED-M0321-SN-LINKED@TBD-D5]				
```

## §5 メッセージ（画面文言・逐語。en は B4に従い en一次資料(ee)の逐語で復旧・無いキーは英訳なし）

| MSG | key | ja逐語 | en逐語（en一次資料の出典） | 出典・注記 |
|-----|-----|--------|----|---------------------------|
| MSG-002 | admin.error.non_unique | 値が重複しています。 | （英訳なし） | ja=pf message.ja.yml:1190（実pf）。※UniqueConstraintViolation捕捉時＝並行競合の経路(母集合086 TBD側)のトップメッセージ。決定的な再送信(C-008)はUniqueEntity検証失敗のフィールドエラー経路のため本メッセージはbound期待に不使用。L1-018 en欠 |
| MSG-003 | admin.register.complete | 登録が完了しました。 | Registration completed.（ee messages.en.yaml:1676） | ja=pf message.ja.yml:83（実pf・addSuccess実在）／en実在＝L1-009 LS=ja/en |
| MSG-004 | admin.shelf_number.delete.failed | 商品で使用されているため、「%s」の棚番号は削除することができません。 | （英訳なし） | ja=pf message.ja.yml:1353（実pf・%sは棚番号名でsprintf）／ee en値なし＝L1-024 en欠 |
| MSG-005 | admin.delete.complete（**pf は admin.delete.complete を使用**・eeの admin.common.delete_complete「削除しました」とは別キー別文言） | 削除が完了しました。 | （英訳なし＝pf側キーのen一次資料を確認できず） | ja=pf message.ja.yml:85（実pf・ShelfNumberController addSuccess('admin.delete.complete')）。L1-026 en欠 |
| MSG-009 | admin.confirm.delete（pf twig の data-message） | %s を削除してもよろしいですか？（%sは棚番号名でformat＝例「A-001 を削除してもよろしいですか？」） | （英訳なし＝pf側キーのen一次資料なし） | ja=pf message.ja.yml:1036（実pf逐語・確定）。pf shelf_number.twig:98 の data-message で管理画面共通JSが表示。eeの admin.common.delete_modal__message 文言は使わない。L1-022 en欠 |
| MSG-010 | （pf ShelfNumberType にハードコード・翻訳キーでない） | ※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。 | （英訳なし・非キー） | pf ShelfNumberType.php:30（Regex message 直書き。翻訳キーでないため en一次資料なし） |
| MSG-011 | This value should not be blank.（NotBlank・pf validator.ja.yml が上書き） | 入力されていません。 | No value found.（ee validators.en.yaml:17） | ja=pf validator.ja.yml:1（実pf）／en実在＝L1-012 LS=ja/en |
| MSG-012 | Please enter an integer.（IntegerType 既定 invalid_message） | 整数で入力してください。 | Please enter an integer.（vendor/symfony/form/Resources/translations/validators.en.xlf:66） | en実在＝L1-016 LS=ja/en。pf md脚注のMSG-014は同IntegerType invalidの別表記で本表MSG-012と同一挙動。※072/074（並び順整数検証）はinput[type=number]で純UI送信不能＝TBD |

- **MSG-005/MSG-009 の en**: 現行pfが使うキー（admin.delete.complete／admin.confirm.delete）は ee messages.en.yaml に当キーの en値が無く（英訳なし）。ee の別キー（admin.common.delete_complete=Deleted 等）の en は本機能のpf実装文言と別物のため流用しない（B4・source純度）。
- **登録失敗のトップフラッシュ（admin.register.failed「登録できませんでした。」）は本機能pfで未使用**: pf の検証失敗分岐はフラッシュを積まないため、この文言はboundの期待値に使わずL1化しない（画面期待はフィールド下エラー＝名称形式/NotBlank に忠実化）。
- **CSV取込側の可変文言 MSG-006/007/008**（CSVフォーマット不一致/行数上限/取込完了）は**別アップロード画面のPOST処理の文言**であり本register/edit画面の対象外（§8で該当母集合行をexcluded）。MSG-013 は表に定義が無い機械生成プレースホルダ（該当母集合行073をexcluded）。

## §6 要実機・注記（tsv出力から除去する内容）

- C-010/C-011/C-012 の確認ダイアログは pf twig の削除アンカー（`data-method="delete"` + `data-message`＝admin.confirm.delete を棚番号名でformat）による管理画面共通JSの確認で、Playwrightのダイアログ承認・キャンセル操作の具体セレクタは要実機（挙動・キーは pf shelf_number.twig:98 で確定）。
- C-004/C-005/C-015/C-016 のフォーム項目下エラー（MSG-011 NotBlank/MSG-010 Regex）は pf 実装が検証失敗時に shelf_number.twig を再描画したときの `form_errors` にインライン表示される（pf ShelfNumberController.php:58-64・shelf_number.twig の form_errors）。**現行pfは検証失敗時に登録失敗のトップフラッシュ（admin.register.failed）を積まない**ため画面期待は「フィールド下エラー＋フォーム再描画＋非保存」に限定（トップフラッシュ・HTTPステータスは使わない）。**検証失敗時のレスポンスにはPOST直後のフォーム状態が載る**ため、フォーム欄には送信した入力値が保持される（空/A-0000）。**編集失敗（C-015/C-016）の永続値不変は失敗レスポンス内の一覧では判定できない**（同一EntityManagerの一覧はメモリ上のダーティ値を含み得る）ため、値不変は 自動検証(内部・DB) で dtb_shelf_number の永続値を確認する（B9③）。
- C-008 の一意制約は**エンティティの UniqueEntity フォームバリデーション**（DtbShelfNumber.dcm.yml:6）。既存名称を再送信すると form->isValid() が偽となりフォーム項目下の一意エラーで再描画・非保存（ShelfNumberController.php:58）＝決定的にbound（母集合017・検証失敗の挙動を判定し、UniqueEntityエラーの正確な表示文言は要実機のためbound期待に含めない）。flush時の UniqueConstraintViolation＋『値が重複しています。』＋一覧リダイレクトは事前検証を両者通過する並行競合時のみの経路で、母集合086のTBD側（本ケースでは到達しない）。UniqueEntity 検証エラーが名称欄に出るという挙動は決定的だが、**その正確な表示文言は一次資料で確定できず（pfのUniqueEntity和訳を特定できない）要実機確認**とする（bound判定は『検証失敗→フィールドエラー→再描画→非保存』の挙動で足り、文言リテラルはbound期待に含めない）。
- C-013 のCSVダウンロード内容（ヘッダー・全件・ファイル名日時）は Playwright の download イベントで検証（pf ShelfNumberController.php:19,139）。ファイル名の YmdHis 部分は実行時可変（形式パターンのみ確定・逐語は括弧なしで保持）。
- C-017 の「規格側の自動再割当なし」は画面に現れない構造的事実のため 自動検証(内部・DB) で商品規格サブ（pf: dtb_product_sub_class／DB正典ee: dtb_product_class 相当）の参照割当行が更新前後で不変であることを照会（B9④・更新対象外レコード不変）。棚番号名称の更新自体は一覧で画面観測。
- 削除成功（C-010）の物理削除は一覧から行が消えることで画面観測（remove/flush・論理削除列なし）。DB照会は付さない（B9）。
- **TBD行（072/074/086/004/005/078/079）の要実機**: 072/074は並び順IntegerType＝`input[type=number]`で非整数がブラウザで保持されず純UIでMSG-012サーバ検証に到達不能＝要request改竄。086は「二名がほぼ同時」の並行競合で一意判定不能＝要仕様/実機確認。004/005/078/079はページング/表示件数のセッション更新挙動が現行pfに未実装(全件表示)でExcelも選択肢/リンクの存在のみ規定＝ee固有挙動でオラクル化できず要仕様/実機確認。

## §7 実行対象（bound=Playwright／TBD=手動）

- **Playwright(GUI)主体**: C-001, C-003, C-004, C-005, C-007〜C-017（C-002/C-006 を除く全15候補・全bound）。削除系C-010/C-011/C-012 も削除ボタン可視＝L1-035で純UI判定可（削除処理本体もM03-21自身の同一コントローラのため§10の根拠でbound）。CSV出力C-013はdownloadイベント、CSV入力C-014は本機能ShelfNumberController::csvのCSV画面への遷移で純UI（いずれも本機能自身のコントローラ・§10の根拠でbound）。
- **自動検証(内部・DB)**: C-015/C-016（編集失敗で当該行の永続値が更新されず不変＝検証失敗で persist/flush 未到達・B9③）・C-017（商品規格サブの参照割当行が更新前後で不変＝B9④更新対象外レコード不変）は画面に現れない構造的事実のためDB照会を付す。C-004/C-005（新規失敗）も「新規行が作られていない」をDBで確認（画面主検証＝フィールドエラー＋再描画）。C-008（一意違反で重複行が保存されない）は一覧の件数で画面観測可。
- **手動(TBD・要実機/期待固定不能)**: **10件**（072, 074, 086, 004, 005, 078, 079, 002, 076, 085）。072/074は並び順の整数バリデーション（非整数は input[type=number] で純UI送信できず＝要request改竄）／086は名称の並行競合（一次資料が「場合がある」で一意判定できず＝要仕様/実機確認）／004,005,078,079,002,076,085は一覧の分割/表示件数/ページ送りの動的挙動＝現行pfは全件表示で分割/ページング未実装、Excelも選択肢/リンクの静的規定のみ＝ee固有でオラクル化不能（要仕様/実機確認）。
- **対象外(excluded)**: 検索条件/検索結果・相関/DB相関(一意はC-008で被覆)・CSV取込処理(別画面)・矛盾/無関係/被覆済スタブ（tsv非出力）。

## §8 母集合89行 全数会計対応表

> 会計: bound 39／TBD 10／excluded 40（=89・欠番0）

| NNN | 区分 | マップ/理由 |
|-----|------|-------------|
| 001 | bound | C-011（期待「移行先は商品規格(dtb_product_class)の参照有無で判定」＝削除拒否の参照判定・L1-023。観点CSRFは誤=削除へ是正） |
| 002 | TBD | 期待「新規用フォームと一覧（既定は最初のページ）を表示」。フォーム＋一覧の表示自体はpf-backedだが期待が『最初のページ』＝分割/ページング前提で、現行pfは全件表示のため『ページ』概念が無く一意判定不能＝要仕様/実機確認（分割挙動はpf/Excel未裏付け） |
| 003 | bound | C-009（期待「新規モードに戻る」＝新規登録へ戻る・L1-020） |
| 004 | TBD | ページ送り（当該ページの一覧が返る）＝ページ番号のセッション更新。現行pf(HareruyaEcプラグイン)は一覧を全件表示し分割/ページ送り未実装(ShelfNumberController.php:37)、Excelも識別ID12のリンク存在のみ規定＝動的挙動をpf/Excelで裏付けられずee固有＝要仕様/実機確認 |
| 005 | TBD | 表示件数セレクト変更（N件で再描画・表示件数のセッション更新）。現行pfは件数セレクト/分割を未実装、Excelは識別ID6の選択肢存在のみ規定＝動的挙動をpf/Excelで裏付けられずee固有＝要仕様/実機確認 |
| 006 | bound | C-003（期待「検証成功時は保存し成功メッセージののちリダイレクト」＝登録成功・L1-008/009） |
| 007 | bound | C-010（期待「商品規格に参照が無ければ削除し成功メッセージ」＝削除成功・L1-025/026） |
| 008 | bound | C-013（期待「マスタ全件のCSVをダウンロード」＝CSV出力・L1-028） |
| 009 | bound | C-004（必須バリデーションでエラー表示・処理完了しない＝NotBlank失敗・L1-010/012） |
| 010 | excluded | 自己矛盾スタブ: 入力=対象項目を未入力にする なのに期待「エラー表示されず継続」（B15③・M03-21に任意項目なし＝未入力は必ずNotBlankエラー。成功継続はC-003で被覆） |
| 011 | bound | C-001（期待「タイトルは商品管理、サブタイトルは棚番号登録/編集」＝画面表示・L1-002。観点文字列長は誤=画面表示へ是正） |
| 012 | excluded | 相関バリデーション＝本機能に項目間相関なし(L1-032)・母集合テンプレ由来 |
| 013 | excluded | 相関バリデーション＝同上 |
| 014 | excluded | 相関バリデーション＝同上 |
| 015 | excluded | 相関バリデーション＝同上 |
| 016 | excluded | DB相関バリデーション「該当する値でエラーなし継続」＝重複しない名称は登録成功でC-003被覆・項目間相関チェックは本機能に無い(L1-032) |
| 017 | bound | C-008（DBとの相関バリデーションでエラー・処理完了しない＝名称の一意制約(UniqueEntity)違反でフォーム検証が失敗しフィールド下エラー・再描画・非保存＝決定的な既存名称再送信で被覆・L1-017。観点DB相関は誤=バリデーション(一意)へ是正） |
| 018 | bound | C-007（期待「GETは主にパスのidと一覧ページ指定」＝編集はパスのidで現行値をフォームにロード・L1-019。観点部分入力は誤=編集表示へ是正） |
| 019 | excluded | 検索条件＝本機能に検索機能なし(L1-031)・母集合テンプレ由来 |
| 020 | excluded | 検索条件＝同上 |
| 021 | excluded | 検索条件＝同上 |
| 022 | excluded | 検索条件＝同上 |
| 023 | excluded | 検索条件＝同上 |
| 024 | excluded | 検索条件＝同上 |
| 025 | excluded | 検索条件＝同上 |
| 026 | excluded | 検索条件＝同上 |
| 027 | excluded | 検索条件（col8=MSG-004）＝検索機能なし(L1-031)。MSG-004削除拒否の実挙動はC-011で被覆 |
| 028 | excluded | 検索条件（col8=MSG-005）＝検索機能なし。MSG-005削除完了の実挙動はC-010で被覆 |
| 029 | excluded | 検索条件（col8=MSG-006）＝検索機能なし。MSG-006はCSV取込別画面の文言(L1-033) |
| 030 | excluded | 検索条件（col8=MSG-007）＝検索機能なし。MSG-007はCSV取込別画面の文言(L1-033) |
| 031 | excluded | 検索条件（col8=MSG-008）＝検索機能なし。MSG-008はCSV取込別画面の文言(L1-033) |
| 032 | excluded | 検索条件（col8=MSG-009）＝検索機能なし。MSG-009削除確認の実挙動はC-012で被覆 |
| 033 | excluded | 検索結果スタブ「取得結果に含まれる」（col8=MSG-010）＝検索機能なし(L1-031)。MSG-010形式エラーの実挙動はC-005で被覆 |
| 034 | excluded | 検索結果スタブ（col8=MSG-011）＝同上。MSG-011未入力の実挙動はC-004で被覆 |
| 035 | excluded | 検索結果スタブ（col8=MSG-012）＝同上。MSG-012整数エラーの実挙動はC-006で被覆 |
| 036 | excluded | 検索結果スタブ（col8=MSG-013）＝同上。MSG-013はpf md表に無いプレースホルダ |
| 037 | excluded | 自己矛盾スタブ: 入力=MSG-014(整数エラー)前提なのに期待「追加される」（B15③・登録成功はC-003で被覆） |
| 038 | excluded | 無関係スタブ: 入力=削除時の参照判定 で期待「追加されない」（B15②・検証失敗はC-004/005/006で被覆） |
| 039 | excluded | 無関係スタブ: 入力=ナビ で期待「追加される」（B15②・登録成功はC-003で被覆） |
| 040 | bound | C-009（期待「新規モードに戻る」＝新規登録へ戻る・L1-020。観点登録内容は誤=画面遷移へ是正） |
| 041 | excluded | 無関係スタブ: 入力=一覧ページリンク で期待「追加される」（B15②・C-003で被覆） |
| 042 | bound | C-003（入力=登録内容の最大長の値。名称は正規表現で厳密5文字＝有効形式値は登録成功・L1-006/008。最小長044と同一形式値で代表C-003へ集約） |
| 043 | bound | C-005（入力=登録内容の最大長+1の値。名称6文字以上は正規表現不一致でMSG-010＝形式エラー・L1-013/014） |
| 044 | bound | C-003（入力=登録内容の最小長の値。名称有効形式値で登録成功・L1-006/008。042と同一＝代表C-003） |
| 045 | bound | C-004（入力=登録内容の最小長-1の値=空。名称空はNotBlank違反でMSG-011＝追加されない・L1-010/012） |
| 046 | excluded | CSV取込処理（入力=「CSV取込」）＝別アップロード画面のPOST処理(L1-033)・当register/edit画面の対象外 |
| 047 | excluded | CSV取込別URL（入力=別URL後方互換）＝別画面(L1-033)・対象外 |
| 048 | bound | C-001（期待「タイトルは商品管理、サブタイトルは棚番号登録/編集」＝画面表示・L1-002。観点実行結果は誤=画面表示へ是正） |
| 049 | excluded | 無関係スタブ: 入力=モーダル・ポップアップ で期待「変更される」（B15②・更新はC-007で被覆） |
| 050 | excluded | 無関係スタブ: 入力=一覧総件数 で期待「変更されない」（B15②・更新はC-007で被覆） |
| 051 | excluded | 自己矛盾スタブ: 入力=二名が同じ名称をほぼ同時に送信(一意競合) なのに期待「変更される」（B15③・一意違反では値は保存されない。一意の実挙動はC-008で被覆） |
| 052 | excluded | CSV取込処理＋非定言（入力=CSVで名称フォーマット規則外の文字列・期待「保存され得る」）＝別画面(L1-033)＋B1（保存され得る） |
| 053 | excluded | 無関係スタブ: 入力=削除時に規格から参照されている で期待「変更される」（B15②・更新はC-007で被覆） |
| 054 | bound | C-007（入力=更新内容の最大長の値。名称有効形式値で更新成功・L1-019/008。056と同一形式値＝代表C-007） |
| 055 | bound | C-016（入力=更新内容の最大長+1の値。編集で名称を A-0000（6文字）へ変更→正規表現不一致でMSG-010＝形式エラー・値不変・L1-013/014/019。register失敗C-005と別実行＝編集失敗へ分離） |
| 056 | bound | C-007（入力=更新内容の最小長の値。名称有効形式値で更新成功・L1-019/008。054と同一＝代表C-007） |
| 057 | bound | C-015（入力=更新内容の最小長-1の値=空。編集で名称を空にクリア→NotBlank違反でMSG-011＝変更されない・値不変・L1-010/012/019。register失敗C-004と別実行＝編集失敗へ分離） |
| 058 | excluded | 無関係スタブ: 入力=管理画面にログインし当ルートへ到達できる運用者(認可) で期待「変更される」（B15②・更新はC-007で被覆・認可は機能固有ルールなしL1-034） |
| 059 | bound | C-007（期待「実行結果の対象レコードの値が変更される」＋入力=POST検証成功＝更新成功・L1-008/019。観点実行結果は誤=更新内容へ是正） |
| 060 | bound | C-004（期待「同一URL…storeが再描画のためHTMLは一覧付きフォームパターン」＋入力=POST検証失敗＝検証失敗のフォーム再描画・L1-010。観点実行結果は誤=バリデーションへ是正） |
| 061 | bound | C-012（期待「棚番号登録/編集画面に留まる」＝削除確認ダイアログのキャンセルで非送信留まる・L1-021。観点削除条件は削除へ統一） |
| 062 | bound | C-010（期待「棚番号登録/編集画面に遷移」＝削除実行後の一覧リダイレクト・入力=削除条件非該当(参照なし=削除可)＝削除成功・L1-025） |
| 063 | bound | C-011（期待「棚番号登録/編集画面に遷移」＝削除拒否後の一覧リダイレクト・入力=削除条件該当(参照あり=削除不可)＝削除拒否・L1-023） |
| 064 | bound | C-010（期待「棚番号登録/編集画面に遷移」＋入力=削除条件非該当(参照なし=削除可)＝削除成功後リダイレクト・L1-025） |
| 065 | bound | C-011（期待「削除条件の対象レコードが削除状態にならない」＝規格参照ありで削除拒否・L1-023。観点削除条件を削除へ統一） |
| 066 | bound | C-010（期待「実行結果の対象レコードが削除状態になる」＝規格参照なしで削除成功・L1-025。観点実行結果は誤=削除へ是正） |
| 067 | bound | C-014（期待「棚番号登録CSVアップロード画面に遷移」＝本機能ShelfNumberController::csvのCSVアップロード画面への遷移・L1-029。観点実行結果は誤=画面遷移へ是正） |
| 068 | bound | C-010（期待「実行結果の対象レコードが削除状態になる」＝削除成功・L1-025。観点実行結果は誤=削除へ是正） |
| 069 | bound | C-012（入力=MSG-009＝削除確認ダイアログの文言。期待「要ソース確認」プレースホルダはpf md:310のMSG-009で確定＝確認ダイアログ表示・L1-021/022。観点実行結果は誤=削除へ是正） |
| 070 | bound | C-014（期待「棚番号登録CSVアップロード画面に遷移」＝本機能ShelfNumberController::csvのCSVアップロード画面への遷移・L1-029。観点初期行数は誤=画面遷移へ是正） |
| 071 | bound | C-010（期待「確認後に削除処理を実行し棚番号登録/編集画面に遷移」＝確認承認→削除→一覧リダイレクト・L1-021/025。観点表示順は誤=削除へ是正） |
| 072 | TBD | 並び順に整数以外を入力したときの整数バリデーション（「整数で入力してください。」表示）を確認する観点。並び順欄は数値入力欄のため非整数の文字をブラウザで入力・送信できず、通常のUI操作では当該サーバ検証に到達できない。非整数を送る操作手段（リクエスト改変等）が確定するまで期待値を実行可能に固定できないため保留 |
| 073 | excluded | プレースホルダ（入力=MSG-013・期待「留まる」）＝MSG-013はpf md表に定義なし。検証失敗留まりの実挙動はC-004/005/006で被覆 |
| 074 | TBD | 並び順に整数以外を入力したときの整数バリデーション（072と同一の整数エラー挙動）を確認する観点。072と同様に数値入力欄のため非整数を通常のUI操作で送信できず、当該サーバ検証に到達する操作手段が確定するまで保留 |
| 075 | bound | C-011（期待「移行先は商品規格(dtb_product_class)の参照有無で判定」＝削除拒否の参照判定・L1-023。観点画面レイアウトは誤=削除へ是正） |
| 076 | TBD | 期待「新規用フォームと一覧（既定は最初のページ）を表示」＝002と同型。分割/ページング前提のため現行pf全件表示では一意判定不能＝要仕様/実機確認 |
| 077 | bound | C-009（期待「新規モードに戻る」＝新規登録へ戻る・L1-020。観点画面レイアウトは誤=画面遷移へ是正） |
| 078 | TBD | ページ送り（当該ページの一覧が返る）＝ページ番号のセッション更新。現行pf未実装(全件表示)・Excel動的挙動未規定でee固有＝要仕様/実機確認（004と同型） |
| 079 | TBD | 表示件数セレクト変更（N件で再描画）＝表示件数のセッション更新。現行pf未実装・Excel動的挙動未規定でee固有＝要仕様/実機確認（005と同型） |
| 080 | bound | C-003（期待「検証成功時は保存し成功メッセージののちリダイレクト」＝登録成功・L1-008/009。観点画面レイアウトは誤=登録内容へ是正） |
| 081 | excluded | 汎用スタブ「エラー表示されず継続」（入力=CSV出力）＝内容空虚・CSV出力の実挙動はC-013で被覆 |
| 082 | bound | C-014（期待「マスタCSV用アップロード画面を表示」＝本機能ShelfNumberController::csvがCSVアップロード画面を描画・L1-029） |
| 083 | excluded | 汎用スタブ「エラー表示されず継続」（入力=別URL後方互換）＝内容空虚・CSV別URLは別画面(L1-033) |
| 084 | bound | C-010（期待「削除リンクはdata-method=deleteと確認メッセージ属性…確認後にDELETE」＝削除確認→DELETE機構・L1-021。観点フォーム送信は誤=削除へ是正） |
| 085 | TBD | 期待「全件をsort_no昇順で対象とし表示件数で分割」。sort_no昇順の並び自体はpf実挙動でCSV全件出力側で検証できるが、期待の必須成分『表示件数で分割』は現行pf未実装(全件表示)＝連言の一部が満たせず一意判定不能＝要仕様/実機確認 |
| 086 | TBD | 二名がほぼ同時に同じ名称を送信したときにDBの一意制約でどちらか一方が捕捉され「値が重複しています。」が表示される、という並行競合の観点。どちらが捕捉されるかは一次資料でも「場合がある」とされ楽観ロックも無いため、1回の実行で一意に判定できる期待値を固定できない。仕様確認または実機確認で期待挙動を確定するまで保留（単一利用者が既存名称を再送信する決定的な重複はバリデーション候補で別途確認する） |
| 087 | excluded | CSV取込処理＋非定言（入力=CSVで名称フォーマット規則外・期待「保存され得る」）＝別画面(L1-033)＋B1 |
| 088 | bound | C-011（期待「DBを削除しない」＋入力=削除時に規格から参照されている＝規格参照ありで削除拒否・L1-023。観点公開コンテンツは誤=削除へ是正） |
| 089 | bound | C-017（期待「マスタの更新・削除は規格側の自動再割当を行わない」＝棚番号名称の更新時に参照する商品規格dtb_product_classの割当行が不変＝B9④の更新対象外レコード不変・DB内部検証付きbound・L1-036/008/019。観点データ正当性はデータ整合性へ是正） |

### §8.1 観点是正対象（emitが concretized.tsv の観点列を是正・母集合all_it_casesは不変）

対象NNN（下記`## 観点補正`表と一致）: 001, 003, 008, 011, 017, 018, 040, 048, 059, 060, 061, 062, 063, 064, 065, 066, 067, 068, 069, 070, 071, 075, 077, 080, 084, 088, 089。

## §9 分類根拠（会計整合）

### §9.1 bound（39行・15候補）
C-001[011,048=2] / C-003[006,042,044,080=4] / C-004[009,045,060=3] / C-005[043=1] / C-007[018,054,056,059=4] / C-008[017=1] / C-009[003,040,077=3] / C-010[007,062,064,066,068,071,084=7] / C-011[001,063,065,075,088=5] / C-012[061,069=2] / C-013[008=1] / C-014[067,070,082=3] / C-015[057=1] / C-016[055=1] / C-017[089=1]。計 2+4+3+1+4+1+3+7+5+2+1+3+1+1+1=39。（C-002＝ページング/表示件数はR4で撤去しTBD。C-001は分割要求の002/076/085を外し011/048のみbound＝R5 Major1。C-014＝CSV入力リンクの着地先は本機能ShelfNumberController::csvの画面でR7 boundへ復帰）

### §9.2 TBD（10行）
072, 074, 086, 004, 005, 078, 079, 002, 076, 085。理由: 072/074は並び順の整数バリデーション（数値入力欄で非整数を純UI送信できず＝要request改竄）。086は名称の並行競合（一次資料が「場合がある」とし一意判定できず＝要仕様/実機確認。決定的な既存名称再送信はC-008＝母集合017でUniqueEntity検証失敗としてbound）。004/005/078/079はページ送り/表示件数のセッション更新、002/076は「既定は最初のページ」表示、085は「表示件数で分割」＝いずれも**現行pfに分割/ページング未実装**（ShelfNumberController.php:37で全件表示・twigにページャ/件数セレクト無し）でExcelも選択肢/リンクの静的規定のみ＝動的挙動をpf/Excelで裏付けられずee固有でオラクル化不能＝要仕様/実機確認（R5 Major1）。

### §9.3 excluded（40行）
001以外の内訳: 検索14(019-032)＋検索結果4(033-036)＝検索なし(L1-031)／相関4(012-015)＝相関なし(L1-032)＋DB相関 016(重複しない名称は登録成功でC-003被覆・017はUniqueEntity検証失敗でC-008へbound)＝1／CSV取込処理本体・後方互換URL・空虚スタブ6(046,047,052,081,083,087)＝本コントローラのimportアクションだが該当母集合行は非定言(保存され得る052/087)・汎用スタブ(継続081/083)・後方互換/無関係(046/047)でbound不可(L1-033・B1/B15)／矛盾・無関係・被覆済スタブ11(010,037,038,039,041,049,050,051,053,058,073)＝B15②③（具体挙動はC-003/C-004/C-007/C-008で被覆）。計 14+4+4+1+6+11=40。

## §10 隔離メモ（bind根拠に不使用）

- **並び順の範囲（Excel/pf 食い違い）**: Excel識別ID4（0204:9032）は並び順の最大値を「0〜32767」と記すが、現行pfの ShelfNumberType は sort_no に NotBlank のみで Range/上下限検証を付けない（範囲エラーメッセージも無い）。範囲外値の挙動は一次資料で一意固定できないが、**母集合に並び順の範囲境界を問う行が無い**（境界行042-045/054-057は名称対象）ため、L1化・bind根拠に不使用（並び順は「必須・整数（非整数はMSG-012）」のみboundで足りる）。
- **一意制約の2経路（決定的なUniqueEntity検証 vs 並行競合のDB例外）**: 名称一意は**エンティティの UniqueEntity 制約（DtbShelfNumber.dcm.yml:6）によるフォームバリデーション**で、単一利用者が既存名称を逐次再送信すると `form->isValid()` が偽となり ShelfNumberController.php:58 でフォーム項目下エラーを出して再描画・非保存する＝決定的＝**C-008でbound（母集合017に対応）**。一方、flush時の UniqueConstraintViolation 捕捉＋`admin.error.non_unique`（値が重複しています。）＋一覧リダイレクト（ShelfNumberController.php:69-72）は**事前のUniqueEntity検証を両者すり抜ける並行競合時のみの経路**で、逐次再送信では到達しない。母集合086「二名がほぼ同時／場合がある」はこの並行競合を問うが再現不能・楽観ロックなしで一意判定できず＝**母集合086はTBD（§9.2）**。C-008の決定的シナリオでは086を被覆できないため別扱い。
- **並び順の整数バリデーションの純UI不成立（母集合072/074）**: 並び順は IntegerType＝`input[type=number]`（ShelfNumberType）であり「abc」等の非整数はブラウザが値を保持できず、MSG-012（整数で入力してください。）のサーバ検証へ純UIで到達できない＝**072/074はTBD（要request改竄で非整数を送る操作手段の確定が必要・§9.2）**。整数検証の実在（L1-015/016）は隔離せず claim として保持するが、純UI boundにはしない（codex R1 Major1）。
- **成功後リダイレクトはid付きで編集モードへ**: pf ShelfNumberController.php:77 は登録/更新成功後 `admin_product_shelf_number` に保存後idをパラメータで付けてリダイレクトする。idありのGETは当該行を編集モードでフォームにロードするため（twigの id is not null 分岐）、C-003/C-007の遷移先は保存値が入った編集画面になる（新規状態には戻らない）。この挙動を実pf(Controller:77)としてbound期待に反映した。
- **削除処理をboundにする根拠（B2判断・R6）**: B2は「一覧/編集画面から起動する削除…の実際のPOST処理・DB副作用は**別導線DELEG(excluded)**」と規定するが、これは削除が別機能/別導線へ委譲される場合の規約である。M03-21では**削除POSTハンドラ `ShelfNumberController::delete` が本機能(register/edit)と同一コントローラ内**にあり、母集合 IT-M03-21-* に削除ケース(007/065/066/068/088/001/075/062-064/061/069/084)が実在し、**別の「棚番号削除」機能は it-target-functions に存在しない**（SHELF系のfidはM03-21 棚番登録/編集 と M03-40 棚番号更新CSV登録＝商品規格の棚番号を更新する別機能 の2つのみで、棚番号マスタの削除はM03-21が担う）。よって削除はM03-21自身が担う機能でありB2の(a)に該当＝C-010(削除成功)/C-011(削除拒否)/C-012(確認キャンセル)をboundで維持。削除結果(行が消える/残る)は一覧で画面観測し、DB副作用の直接照会は付さない(B9)。仮に削除をexcludeすると母集合の削除ケースが未試験(coverage gap)になるため、bound維持が規約と整合する。
- **CSV入力/出力リンクをboundにする根拠（B2判断・R7で是正）**: R6で「CSV入力の着地先=別機能M03-40」と誤判断したが、実sourceで確定＝shelf_number.twig:16 の `admin_product_shelf_number_csv` は ProductServiceProvider.php:371 で GET /{admin_route}/product/shelf_number/import にバインドされ**本機能自身の ShelfNumberController::csv(:153)** が棚番号CSVアップロード画面を描画する（M03-40は別URL /product/product_shelf_number_csv_import→ProductCsvController::csvShelfNumber:190 で商品規格の棚番号更新という別機能）。したがってCSV入力リンクの遷移先は本機能と同一コントローラの画面＝**別機能への委譲でなくM03-21自身の画面遷移でbound**（C-014・母集合067/070/082）。CSV出力(C-013)も本コントローラ自身のexportハンドラ(ShelfNumberController.php:116-141)でbound。取込のPOST処理本体(import ハンドラ:172)は同コントローラの別アクションだが母集合の当該行は画面遷移/表示を問うため遷移をboundで足りる。
- **CSRF削除の無効トークン→アクセス拒否**: pf の削除は FormValidHelper::checkCsrfValid（無効時 AccessDeniedHttpException）で検証される。無効トークンの拒否はUIから正常再現できず（要request改竄）、かつ**母集合に削除CSRFの無効トークン挙動を期待する行が無い**ため、L1-027は文脈記録に留めbound根拠・TBDのいずれにも使用しない。
- **ee の English 一次資料（B4で復旧・§5に出典明記）**: 現行pfが本機能で実際に使うキーのうち en一次資料が在るもの＝admin.register.complete=Registration completed.(messages.en.yaml:1676・MSG-003)／NotBlank=No value found.(validators.en.yaml:17・MSG-011)／IntegerType=Please enter an integer.(vendor symfony validators.en.xlf:66・MSG-012) を該当claimのenへ復旧（LS=ja/en）。**MSG-005(pf admin.delete.complete)・MSG-009(pf admin.confirm.delete)・MSG-002(admin.error.non_unique)・MSG-004(admin.shelf_number.delete.failed) は ee messages.en.yaml に当キーの en値が無く（英訳なし）**（eeの別キー admin.common.delete_complete=Deleted 等は本機能pf実装の文言と別物のため流用しない・B4）。登録失敗フラッシュ(admin.register.failed)は本機能pfで未使用のためL1化しない。source_class は日本語一次資料(実pf)に従い pf-fallback を維持。

## 観点補正

| 母集合末尾NNN | 正しい観点 | 根拠・バレNNN |
|---------------|-----------|----------------|
| 001 | 削除 | 期待「移行先は商品規格(dtb_product_class)の参照有無で判定」＝削除拒否の参照判定（ラベルCSRFは誤・pf-md:26）・001 |
| 003 | 画面遷移 | 期待「新規モードに戻る」＝編集時の新規登録へ戻る（ラベル対象データは誤・pf shelf_number.twig:8-11）・003 |
| 008 | 画面表示データ | 期待「マスタ全件のCSVをダウンロード」＝CSV出力（ラベルHTTPステータスは誤・pf ShelfNumberController.php:19,139）・008 |
| 011 | 画面表示データ | 期待「タイトルは商品管理、サブタイトルは棚番号登録/編集」＝画面表示（ラベル文字列長は誤）・011 |
| 017 | バリデーション | 期待「DBとの相関バリデーションでエラー・処理完了しない」＝名称の一意制約(UniqueEntity)違反でフォーム検証が失敗しフィールド下エラー・非保存（ラベルDB相関は誤・単項目相関は無いL1-032）・017 |
| 018 | 更新内容 | 期待「GETは主にパスのidと一覧ページ指定」＝編集はパスのidで現行値ロード（ラベル部分入力は誤・pf shelf_number.twig:84）・018 |
| 040 | 画面遷移 | 期待「新規モードに戻る」＝新規登録へ戻る（ラベル登録内容は誤）・040 |
| 048 | 画面表示データ | 期待「タイトルは商品管理、サブタイトルは棚番号登録/編集」＝画面表示（ラベル実行結果は誤）・048 |
| 059 | 更新内容 | 期待「対象レコードの値が変更される」＋入力POST検証成功＝更新成功（ラベル実行結果は誤）・059 |
| 060 | バリデーション | 期待「storeが再描画のためHTMLは一覧付きフォームパターン」＋入力POST検証失敗＝検証失敗のフォーム再描画（ラベル実行結果は誤）・060 |
| 061 | 削除 | 期待「棚番号登録/編集画面に留まる」＝削除確認ダイアログのキャンセル（ラベル削除条件を削除へ統一）・061 |
| 062 | 削除 | 期待「棚番号登録/編集画面に遷移」＋入力削除条件非該当（参照なし）＝削除成功後リダイレクト（ラベル削除条件を削除へ統一）・062 |
| 063 | 削除 | 期待「棚番号登録/編集画面に遷移」＋入力削除条件該当（参照あり）＝削除拒否後リダイレクト（ラベル削除条件を削除へ統一）・063 |
| 064 | 削除 | 期待「棚番号登録/編集画面に遷移」＋入力削除条件非該当（参照なし）＝削除成功後リダイレクト（ラベル削除条件を削除へ統一）・064 |
| 065 | 削除 | 期待「対象レコードが削除状態にならない」＝規格参照ありで削除拒否（ラベル削除条件を削除へ統一）・065 |
| 066 | 削除 | 期待「対象レコードが削除状態になる」＝規格参照なしで削除成功（ラベル実行結果は誤）・066 |
| 067 | 画面遷移 | 期待「棚番号登録CSVアップロード画面に遷移」＝本機能ShelfNumberController::csvのCSV画面への遷移（ラベル実行結果は誤）・067 |
| 070 | 画面遷移 | 期待「棚番号登録CSVアップロード画面に遷移」＝同上（ラベル初期行数は誤）・070 |
| 068 | 削除 | 期待「対象レコードが削除状態になる」＝削除成功（ラベル実行結果は誤）・068 |
| 069 | 削除 | 入力MSG-009＝削除確認ダイアログ文言（期待の要ソース確認はpf-md:310で確定）・削除確認（ラベル実行結果は誤）・069 |
| 071 | 削除 | 期待「確認後に削除処理を実行し棚番号登録/編集画面に遷移」＝確認承認→削除→リダイレクト（ラベル表示順は誤）・071 |
| 075 | 削除 | 期待「移行先は商品規格(dtb_product_class)の参照有無で判定」＝削除拒否の参照判定（ラベル画面レイアウトは誤）・075 |
| 077 | 画面遷移 | 期待「新規モードに戻る」＝新規登録へ戻る（ラベル画面レイアウトは誤）・077 |
| 080 | 登録内容 | 期待「検証成功時は保存し成功メッセージののちリダイレクト」＝登録成功（ラベル画面レイアウトは誤）・080 |
| 084 | 削除 | 期待「data-method=deleteと確認メッセージ属性…確認後にDELETE」＝削除確認機構（ラベルフォーム送信は誤）・084 |
| 088 | 削除 | 期待「DBを削除しない」＋入力規格から参照されている＝削除拒否（ラベル公開コンテンツは誤）・088 |
| 089 | データ整合性 | 期待「マスタの更新・削除は規格側の自動再割当を行わない」＝更新時の商品規格割当行不変（ラベルデータ正当性をデータ整合性へ・pf-md:162）・089 |
