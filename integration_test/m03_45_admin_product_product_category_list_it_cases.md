# m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-45_admin_product_product_category_list.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-16 | ファイル選択 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	英語名・各種拡張列を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で英語名・各種拡張列の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_category に統合（category_name_en・front_search_hide_flg・branch_hide_flg・banner_image・icon_image・html_ja・html_…であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-002	IT-15	未認証	P1	未認証の結合確認	兄弟の並び順キーを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で兄弟の並び順キーの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_category.sort_no（降順であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-003	IT-15	対象データ	P1	対象データの結合確認	ナビから「カテゴリ登録/編集」を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でナビから「カテゴリ登録/編集」の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ルート直下の一行ずつリストと右ツリーが現れるであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	リストまたはツリーで親を開くを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でリストまたはツリーで親を開くの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	親の直下のリストと、親向け入力カードが出るであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-005	IT-20	識別子	P1	識別子の結合確認	「カテゴリ作成」または更新ボタンを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で「カテゴリ作成」または更新ボタンの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証後に保存しフラッシュ後、親コンテキストに応じた一覧へリダイレクトすること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	並べ替え確定ドラッグ、上下矢印確定を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で並べ替え確定ドラッグ、上下矢印確定の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	確認ダイアログを承認したときだけ送られるであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	「CSV出力項目設定」を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で「CSV出力項目設定」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「CSV出力項目設定」を確認する
3. 画面表示と後続状態を確認する"	カテゴリCSV項目のオンオフ順序画面へ遷移するテンプレート上のリンクであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	削除モーダル完了を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除モーダル完了の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除モーダル完了
3. 画面表示と後続状態を確認する"	削除完了もしくは外部キーエラー等のメッセージの後に、親コンテキストの一覧へ戻すであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-009	IT-25	URL	P2	URLの操作結果確認	表示要素を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	タイトル帯は「商品管理」／「カテゴリ一覧」であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	JS 挙動を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	M03-45-MSG-001を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でM03-45-MSG-001の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-45-MSG-001を確認する
3. 画面表示と後続状態を確認する"	子カテゴリ・商品カテゴリ紐付けが無いカテゴリ行の削除アイコンを押下し、DeleteModal が表示されたとき（shown.bs.modal で当該行の data-message を本文へ差し込む）であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M03-45-MSG-002を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M03-45-MSG-002を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	カテゴリ名（日）を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. カテゴリ名（日）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	支店非表示フラグを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 支店非表示フラグを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	最新セット用バナー画像を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 最新セット用バナー画像を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	無効な parent_idを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 無効な parent_idを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	ルートのみの画面を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ルートのみの画面を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-019	IT-22	部分入力	P2	部分入力の入力検証	子または商品との紐づけがあるときの削除を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で子または商品との紐づけがあるときの削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 子または商品との紐づけがあるときの削除
3. 画面表示と後続状態を確認する"	モーダル起点の削除ボタンは disabled クラス付与で視覚的に押せなくするが、コンソール等から送信したときは Doctrine の外部キーエラーに相当する例外によりエラーメッセージのフラッシュとともに親一覧へであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-020	IT-23	検索条件	P2	検索時の検索条件確認	一覧は空を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-021	IT-23	検索条件	P2	検索時の検索条件確認	Ajax 並べ替え成功後応答のみを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-022	IT-23	検索条件	P2	検索時の検索条件確認	一覧結果とクエリキャッシュを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-023	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-024	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-025	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-026	IT-23	検索条件	P2	検索時の検索条件確認	dtb_categoryを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-027	IT-23	検索条件	P2	検索時の検索条件確認	dtb_categoryを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-028	IT-23	検索条件	P2	検索時の検索条件確認	バナー・アイコン画像ファイルを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でバナー・アイコン画像ファイルの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-029	IT-23	検索条件	P2	検索時の検索条件確認	編集送信成功を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で編集送信成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-030	IT-23	検索条件	P2	検索時の検索条件確認	削除成功および失敗両方ともを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除成功および失敗両方ともの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-031	IT-23	検索条件	P2	検索時の検索条件確認	CSVおよび設定ボタンを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でCSVおよび設定ボタンの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-032	IT-23	検索条件	P2	検索時の検索条件確認	保存成功フラッシュを積むを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で保存成功フラッシュを積むの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-033	IT-23	検索条件	P2	検索時の検索条件確認	フォーム入力検証を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でフォーム入力検証の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-034	IT-23	実行結果	P2	検索時の実行結果確認	階層が eccube_category_nest_level を超える保存試行を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で階層が eccube_category_nest_level を超える保存試行の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-035	IT-23	実行結果	P2	検索時の実行結果確認	画像アップロードのあらゆる種類の異常・ディレクトリ不可を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で画像アップロードのあらゆる種類の異常・ディレクトリ不可の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-036	IT-23	実行結果	P2	検索時の実行結果確認	保存開始および完了ログを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で保存開始および完了ログの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-037	IT-23	実行結果	P2	検索時の実行結果確認	削除開始、完了および例外を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除開始、完了および例外の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-038	IT-26	登録内容	P1	登録時の登録内容確認	CSVを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でCSVの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-039	IT-26	登録内容	P1	登録時の登録内容確認	英語名・各種拡張列を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で英語名・各種拡張列の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-040	IT-26	登録内容	P1	登録時の登録内容確認	兄弟の並び順キーを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で兄弟の並び順キーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-041	IT-26	登録内容	P1	登録時の登録内容確認	ナビから「カテゴリ登録/編集」を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でナビから「カテゴリ登録/編集」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ルート直下の一行ずつリストと右ツリーが現れるであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-042	IT-26	登録内容	P1	登録時の登録内容確認	リストまたはツリーで親を開くを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でリストまたはツリーで親を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-043	IT-26	登録内容	P1	登録時の登録内容確認	「カテゴリ作成」または更新ボタンを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-044	IT-26	登録内容	P1	登録時の登録内容確認	並べ替え確定ドラッグ、上下矢印確定を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-045	IT-26	登録内容	P1	登録時の登録内容確認	「CSV出力項目設定」を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-046	IT-26	登録内容	P1	登録時の登録内容確認	削除モーダル完了を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-047	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-048	IT-26	実行結果	P1	登録時の実行結果確認	JS 挙動を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でJS 挙動の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-049	IT-23	実行結果	P1	登録時の実行結果確認	モーダル・ポップアップを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	並べ替えもしくは上下移動前のウィンドウ confirmであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-050	IT-26	更新内容	P1	更新時の更新内容確認	M03-45-MSG-001を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でM03-45-MSG-001の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-051	IT-26	更新内容	P1	更新時の更新内容確認	M03-45-MSG-002を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でM03-45-MSG-002の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-052	IT-26	更新内容	P1	更新時の更新内容確認	カテゴリ名（日）を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でカテゴリ名（日）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-053	IT-26	更新内容	P1	更新時の更新内容確認	支店非表示フラグを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で支店非表示フラグの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_category.branch_hide_flgであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-054	IT-26	更新内容	P1	更新時の更新内容確認	最新セット用バナー画像を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で最新セット用バナー画像の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-055	IT-26	更新内容	P1	更新時の更新内容確認	無効な parent_idを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-056	IT-26	更新内容	P1	更新時の更新内容確認	ルートのみの画面を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-057	IT-26	更新内容	P1	更新時の更新内容確認	子または商品との紐づけがあるときの削除を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-058	IT-26	更新内容	P1	更新時の更新内容確認	一覧は空を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-059	IT-26	更新内容	P1	更新時の更新内容確認	Ajax 並べ替え成功後応答のみを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でAjax 並べ替え成功後応答のみの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-060	IT-05	実行結果	P1	更新時の実行結果確認	一覧結果とクエリキャッシュを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で一覧結果とクエリキャッシュの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-061	IT-05	実行結果	P1	更新時の実行結果確認	成功時出力を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTML 一覧画面、削除や保存後 HTTP 302 リダイレクトおよび成功フラッシュであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-062	IT-05	削除条件	P1	削除時の削除条件確認	失敗時出力を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証失敗により同一 Twigであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-063	IT-05	削除条件	P1	削除時の削除条件確認	副作用を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	Doctrine永続およびキャッシュ削除であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-064	IT-05	削除条件	P1	削除時の削除条件確認	dtb_categoryを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画像表示用の相対ファイルキーを保存すること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-065	IT-05	削除条件	P1	削除時の削除条件確認	dtb_categoryを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	複数行・長文入力であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-066	IT-05	削除条件	P1	削除時の削除条件確認	バナー・アイコン画像ファイルを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でバナー・アイコン画像ファイルの確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-067	IT-05	実行結果	P1	削除時の実行結果確認	編集送信成功を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で編集送信成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-068	IT-05	実行結果	P1	削除時の実行結果確認	削除成功および失敗両方ともを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除成功および失敗両方ともの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP 302 で親コンテキストの show もしくはトップ一覧であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-069	IT-05	実行結果	P1	削除時の実行結果確認	CSVおよび設定ボタンを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でCSVおよび設定ボタンの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-070	IT-05	実行結果	P1	削除時の実行結果確認	保存成功フラッシュを積むを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で保存成功フラッシュを積むの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET先は最新DBを読んだ一覧となること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-071	IT-02	初期行数	P2	初期行数の結合確認	フォーム入力検証を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でフォーム入力検証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォーム入力検証
3. 画面表示と後続状態を確認する"	同一 Twig 200 としエラー一覧をSymfonyが描画すること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-072	IT-02	表示順	P2	表示順の結合確認	階層が eccube_category_nest_level を超える保存試行を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で階層が eccube_category_nest_level を超える保存試行の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 階層が eccube_category_nest_level を超える保存試行
3. 画面表示と後続状態を確認する"	HTTP 400であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-073	IT-25	更新抑止	P1	更新抑止の結合確認	画像アップロードのあらゆる種類の異常・ディレクトリ不可を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で画像アップロードのあらゆる種類の異常・ディレクトリ不可の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信フォーム側に共通アップロードエラー文言のエントリをセットし再描画であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-074	IT-12	内部情報	P1	内部情報の結合確認	保存開始および完了ログを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で保存開始および完了ログの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	メッセージとカテゴリ id が配列入りで記録関数へ渡される日本語短文であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-075	IT-15	機密情報	P1	機密情報の結合確認	削除開始、完了および例外を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除開始、完了および例外の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	開始と終了ログ、例外時ログに対象 id を含めるであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-076	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	CSVを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でCSVの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSVを確認する
3. 画面表示と後続状態を確認する"	ログにファイル名のメタのみであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-077	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	英語名・各種拡張列を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で英語名・各種拡張列の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 英語名・各種拡張列を確認する
3. 画面表示と後続状態を確認する"	dtb_category に統合（category_name_en・front_search_hide_flg・branch_hide_flg・banner_image・icon_image・html_ja・html_…であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-078	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	兄弟の並び順キーを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で兄弟の並び順キーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 兄弟の並び順キーを確認する
3. 画面表示と後続状態を確認する"	dtb_category.sort_no（降順であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-079	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ナビから「カテゴリ登録/編集」を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でナビから「カテゴリ登録/編集」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビから「カテゴリ登録/編集」を確認する
3. 画面表示と後続状態を確認する"	ルート直下の一行ずつリストと右ツリーが現れるであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	リストまたはツリーで親を開くを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でリストまたはツリーで親を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. リストまたはツリーで親を開く
3. 画面表示と後続状態を確認する"	親の直下のリストと、親向け入力カードが出るであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-081	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	「カテゴリ作成」または更新ボタンを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で「カテゴリ作成」または更新ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「カテゴリ作成」または更新ボタンを確認する
3. 画面表示と後続状態を確認する"	検証後に保存しフラッシュ後、親コンテキストに応じた一覧へリダイレクトすること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	並べ替え確定ドラッグ、上下矢印確定を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で並べ替え確定ドラッグ、上下矢印確定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 並べ替え確定ドラッグ、上下矢印確定を確認する
3. 画面表示と後続状態を確認する"	確認ダイアログを承認したときだけ送られるであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-083	IT-12	画面表示データ	P2	画面表示データの結合確認	削除モーダル完了を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で削除モーダル完了の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除モーダル完了
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-084	IT-12	画面表示データ	P2	画面表示データの結合確認	JS 挙動を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-085	IT-25	画面表示データ	P2	画面表示データの結合確認	モーダル・ポップアップを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	並べ替えもしくは上下移動前のウィンドウ confirmであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-086	IT-16	ファイル選択	P2	ファイル選択の結合確認	M03-45-MSG-002を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でM03-45-MSG-002の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-45-MSG-002を確認する
3. 画面表示と後続状態を確認する"	削除ボタン押下で削除確認モーダルを表示するとき（data-messageをJSでモーダル本文へ挿入 category.twig:120-127）であること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-087	IT-12	非同期更新	P1	非同期更新の結合確認	カテゴリ名（日）を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でカテゴリ名（日）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. カテゴリ名（日）を確認する
3. 画面表示と後続状態を確認する"	dtb_category.category_nameであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-088	IT-12	エラー継続	P3	エラー継続の結合確認	支店非表示フラグを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で支店非表示フラグの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 支店非表示フラグを確認する
3. 画面表示と後続状態を確認する"	dtb_category.branch_hide_flgであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-089	IT-25	件数上限	P2	件数上限の結合確認	最新セット用バナー画像を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で最新セット用バナー画像の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 最新セット用バナー画像を確認する
3. 画面表示と後続状態を確認する"	banner_image、banner_image_file はアップロード用にマップされ無いときは処理スキップであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-090	IT-25	欠損値	P2	欠損値の結合確認	無効な parent_idを試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）で無効な parent_idの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 無効な parent_idを確認する
3. 画面表示と後続状態を確認する"	404 とし HTML エラーであること。
m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）	IT-M03-45-ADMIN-PRODUCT-PRODUCT-CATEGORY-LIST-091	IT-25	データなし	P2	データなしの結合確認	ルートのみの画面を試験できる状態である	m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）（m03_45_admin_product_product_category_list）でルートのみの画面の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ルートのみの画面を確認する
3. 画面表示と後続状態を確認する"	画面上部入力カードおよび画像ドロップゾーン関連スクリプトは表示されず、リストとツリーと CSV だけであること。
```

## テスト層による母集合除外（結合テスト対象外）

結合テスト観点マスタは各観点に「テスト層」を付与し、**結合層のみ**を機能×観点のクロス積対象とする。以下の層は本結合テストの母集合から除外し、それぞれの行き先で担保する（除外の根拠はマスタ `integration_test/integration-test-viewpoints.md` のテスト層列）。

| テスト層 | 除外観点数 | 行き先 |
|---|---:|---|
| UT | 108 | 単体テスト粒度（単項目境界値・単機能ロジック）→単体テストで担保。表内に保持しマーク。 |
| 委譲 | 143 | 期待値を設計書へ委譲（「記載通り」）→機能別チェックリストへ降格。per機能で設計書の具体値を引用してケース化。 |
| e2e | 33 | 見た目／ブラウザ挙動→e2e（Playwright）＋手動で担保。 |
| 非機能 | 5 | 方式／性能／基盤（ロック方式・リトライ間隔・MQクラスタ・レート制限等）→非機能・障害試験へ分離。 |
| 対象外 | 1 | 合否オラクルを持たない管理・スコーピング指示→テスト観点ではないため除外。 |
| 統合 | 6 | 他観点に統合吸収済み（冗長削除）。統合先が同一バグクラスを検出するため重複クロス積を回避。行は監査用に保持しクロス積からのみ除外（codex+fable5承認）。 |

## 対象外観点（結合層のうち本機能に非該当）

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 増加処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 減少処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 実数反映（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 按分処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 更新履歴（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 算出値表示（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 調整 / 減少理由（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 通知 / 復活通知（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動開始（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動完了（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 例外処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 区分変更（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 結合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / バッチ / 正常終了（IT-09） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / バッチ / 異常終了（IT-10） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / フロント / 外部キャッシュ（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / フロント / 外部取得（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 抽出条件（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 正常応答（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 認証・認可（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 決済連携 / 外部決済（IT-10） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 決済連携 / 二重実行（IT-08） | 本機能はバッチ処理を起動しないため |
| ウェブアプリケーション / 決済連携 / 状態表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 決済連携 / 金額整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / Webhook・外部通知（IT-10, IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 下流転送（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| データベースアクセス / 在庫引当 / 状態遷移（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 在庫引当 / 競合（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 注文・決済・在庫 / 原子性（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 状態遷移 / 遷移可否（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 買取・査定 / 状態遷移（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額計算 / 税・端数（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| バッチアプリケーション / 時刻境界 / 日時切替（IT-30） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / 冪等・再処理 / 冪等キー（IT-08） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / ポイント / ライフサイクル（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| その他 | 同種の対象外観点 3 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 7件 — No.109, No.110, No.111, No.346, No.357, No.381, No.416。上限緩和または個別ケース化で収載可能。
