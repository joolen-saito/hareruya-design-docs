# m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション |
| IT-23 | 実行結果、検索条件、登録内容 |
| IT-26 | 登録内容 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-001	IT-15	CSRF	P1	CSRFの結合確認	マスタキーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタキーの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	プルダウンおよび hidden 項目に用いる、FQCN をハイフン区切りにした識別子（例: Eccube-Entity-Master-Sex）であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-002	IT-15	未認証	P1	未認証の結合確認	編集コレクションを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集コレクションの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	保存用フォームの data 配列であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-003	IT-15	対象データ	P1	対象データの結合確認	行キーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行キーの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	編集コレクションの配列キーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-004	IT-20	出力抑止	P1	出力抑止の結合確認	マスタデータ管理を開く（マスタ未選択）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタデータ管理を開く（マスタ未選択）の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	マスタ選択フォームとツールチップ付き見出しが表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-005	IT-20	識別子	P1	識別子の結合確認	プルダウンでマスタを選び「選択」を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でプルダウンでマスタを選び「選択」を送信の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証に成功すると、同一機能の別入口へリダイレクトされ、選択したマスタの行一覧と空の追加行が表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-006	IT-15	状態変化	P1	状態変化の結合確認	既にマスタが選ばれた状態の入口へ遷移を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で既にマスタが選ばれた状態の入口へ遷移の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	マスタ選択欄に当該マスタが入り、編集テーブルが表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-007	IT-25	UI部品	P3	UI部品の操作結果確認	編集テーブルで「登録」（保存）を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集テーブルで「登録」（保存）を送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集テーブルで「登録」（保存）を送信
3. 画面表示と後続状態を確認する"	検証に成功すると永続化処理が走り、続いて選択中マスタの一覧表示入口へリダイレクトされるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-008	IT-25	UI部品	P3	UI部品の操作結果確認	非管理者・未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	管理画面の認証要件に従い利用できないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-009	IT-25	操作起点	P1	操作起点の操作結果確認	店舗側権種で許可されたログイン状態（確認テスト）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側権種で許可されたログイン状態（確認テスト）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗側権種で許可されたログイン状態（確認テスト）を確認する
3. 画面表示と後続状態を確認する"	マスタデータ管理への GET が HTTP 403 となる確認があること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	第1カードにマスタ選択の select と「選択」ボタンであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	JS 挙動を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	本テンプレートは専用の追加・削除用スクリプトを持たないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	モーダル・ポップアップを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能ではモーダルや確認ダイアログを出さないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	入力項目を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	マスタ選択: 単一選択 selectであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-014	IT-03	外部画面	P2	外部画面の操作結果確認	表示順を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で表示順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示順を確認する
3. 画面表示と後続状態を確認する"	一覧読込は sort_no 昇順であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	更新行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で更新行の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 更新行を確認する
3. 画面表示と後続状態を確認する"	主キーが一致する既存行があれば、そのエンティティへ名称と sort_no を上書きすること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	削除行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で削除行の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除行
3. 画面表示と後続状態を確認する"	行の ID と名称が両方 null で、かつその行キーが「送信中の非空 ID 一覧」に含まれない場合、行キーを主キーとして find し、存在すれば削除すること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	説明文を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で説明文の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 説明文を確認する
3. 画面表示と後続状態を確認する"	日本語ロケールの確認値として、重複 ID 不可・空 ID は削除・設定誤りでサイトが動かなくなり得る旨がカード内に表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	行 IDを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 IDの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行 IDを確認する
3. 画面表示と後続状態を確認する"	エンティティの主キーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行名称の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行名称を確認する
3. 画面表示と後続状態を確認する"	name 列であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	同一送信内で同じ ID が複数行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で同一送信内で同じ ID が複数行の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同一送信内で同じ ID が複数行
3. 画面表示と後続状態を確認する"	各行の ID フィールドに重複エラーが付くであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	主キーとして 0 を使うを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で主キーとして 0 を使うの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 主キーとして 0 を使うを確認する
3. 画面表示と後続状態を確認する"	自動テスト上、名称を伴う 0 の保存や、ID 0 行の削除が確認されていること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	flush が例外を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でflush が例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. flush が例外を確認する
3. 画面表示と後続状態を確認する"	エラーフラッシュを積み、リダイレクトは同様に行うこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-023	IT-25	URL	P2	URLの操作結果確認	無効なマスタキーでパス引数だけ開くを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で無効なマスタキーでパス引数だけ開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 無効なマスタキーでパス引数だけ開く
3. 画面表示と後続状態を確認する"	マッピング例外を握り潰し、編集表が出ない状態に寄せ得るであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	プルダウンでは選べない除外マスタを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. プルダウンでは選べない除外マスタを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	具象マスタの追加列を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 具象マスタの追加列を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧と DBを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 一覧と DBを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	参照整合性を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 参照整合性を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	同時更新を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	成功時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	失敗時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	副作用を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	対象マスタテーブルの行の追加・更新・削除・sort_no 更新であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	選択中のマスタに対応するテーブルを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で選択中のマスタに対応するテーブルの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 選択中のマスタに対応するテーブル
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行名称の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行名称を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	行 ID（集合）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 ID（集合）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行 ID（集合）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 未認証を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	システム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. システム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	店舗側の権種（確認テストでは tenant_owner でログイン）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 店舗側の権種（確認テストでは tenant_owner でログイン）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	保存の POST が成功を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 保存の POST が成功
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検証失敗を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検証失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検証失敗を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	認可失敗を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で認可失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認可失敗を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	マスタキーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタキーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. マスタキーを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	編集コレクションを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 編集コレクションを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	行キーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 行キーを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	マスタデータ管理を開く（マスタ未選択）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. マスタデータ管理を開く（マスタ未選択）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	プルダウンでマスタを選び「選択」を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. プルダウンでマスタを選び「選択」を送信
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	既にマスタが選ばれた状態の入口へ遷移を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で既にマスタが選ばれた状態の入口へ遷移の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 既にマスタが選ばれた状態の入口へ遷移を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	編集テーブルで「登録」（保存）を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集テーブルで「登録」（保存）を送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集テーブルで「登録」（保存）を送信
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	非管理者・未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	店舗側権種で許可されたログイン状態（確認テスト）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 店舗側権種で許可されたログイン状態（確認テスト）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS 挙動を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力項目を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示順を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示順を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	更新行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 更新行を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	削除行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 削除行
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-056	IT-22	必須制御	P1	必須制御の入力検証	説明文を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 説明文を確認する
3. 画面表示と後続状態を確認する"	日本語ロケールの確認値として、重複 ID 不可・空 ID は削除・設定誤りでサイトが動かなくなり得る旨がカード内に表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-057	IT-23	検索条件	P2	検索時の検索条件確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-058	IT-23	検索条件	P2	検索時の検索条件確認	同一送信内で同じ ID が複数行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-059	IT-23	検索条件	P2	検索時の検索条件確認	主キーとして 0 を使うを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で主キーとして 0 を使うの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	自動テスト上、名称を伴う 0 の保存や、ID 0 行の削除が確認されていること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-060	IT-23	検索条件	P2	検索時の検索条件確認	flush が例外を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-061	IT-23	検索条件	P2	検索時の検索条件確認	無効なマスタキーでパス引数だけ開くを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-062	IT-23	検索条件	P2	検索時の検索条件確認	プルダウンでは選べない除外マスタを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-063	IT-23	検索条件	P2	検索時の検索条件確認	具象マスタの追加列を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-064	IT-23	検索条件	P2	検索時の検索条件確認	一覧と DBを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-065	IT-23	検索条件	P2	検索時の検索条件確認	参照整合性を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-066	IT-23	検索条件	P2	検索時の検索条件確認	同時更新を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で同時更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-067	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-068	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で失敗時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-069	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で副作用の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-070	IT-23	検索条件	P2	検索時の検索条件確認	選択中のマスタに対応するテーブルを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で選択中のマスタに対応するテーブルの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存完了時に画面上の行順へ 0 起算で振り直すであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-071	IT-23	検索条件	P2	検索時の検索条件確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行名称の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-072	IT-23	検索条件	P2	検索時の検索条件確認	行 ID（集合）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 ID（集合）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-073	IT-23	実行結果	P2	検索時の実行結果確認	未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で未認証の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-074	IT-23	実行結果	P2	検索時の実行結果確認	システム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でシステム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面表示および送信が許可される実装になっていること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-075	IT-23	実行結果	P2	検索時の実行結果確認	店舗側の権種（確認テストでは tenant_owner でログイン）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側の権種（確認テストでは tenant_owner でログイン）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-076	IT-23	実行結果	P2	検索時の実行結果確認	保存の POST が成功を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で保存の POST が成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-077	IT-23	実行結果	P2	検索時の実行結果確認	検証失敗を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検証失敗の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-078	IT-26	登録内容	P1	登録時の登録内容確認	認可失敗を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で認可失敗の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-079	IT-26	登録内容	P1	登録時の登録内容確認	マスタキーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタキーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-080	IT-26	登録内容	P1	登録時の登録内容確認	編集コレクションを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集コレクションの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-081	IT-26	登録内容	P1	登録時の登録内容確認	行キーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行キーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	編集コレクションの配列キーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-082	IT-26	登録内容	P1	登録時の登録内容確認	マスタデータ管理を開く（マスタ未選択）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタデータ管理を開く（マスタ未選択）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	マスタ選択フォームとツールチップ付き見出しが表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-083	IT-23	登録内容	P1	登録時の登録内容確認	プルダウンでマスタを選び「選択」を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でプルダウンでマスタを選び「選択」を送信の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証に成功すると、同一機能の別入口へリダイレクトされ、選択したマスタの行一覧と空の追加行が表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-084	IT-26	登録内容	P1	登録時の登録内容確認	既にマスタが選ばれた状態の入口へ遷移を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で既にマスタが選ばれた状態の入口へ遷移の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	マスタ選択欄に当該マスタが入り、編集テーブルが表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-085	IT-26	登録内容	P1	登録時の登録内容確認	編集テーブルで「登録」（保存）を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集テーブルで「登録」（保存）を送信の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証に成功すると永続化処理が走り、続いて選択中マスタの一覧表示入口へリダイレクトされるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-086	IT-26	登録内容	P1	登録時の登録内容確認	非管理者・未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で非管理者・未認証の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理画面の認証要件に従い利用できないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-087	IT-26	登録内容	P1	登録時の登録内容確認	店舗側権種で許可されたログイン状態（確認テスト）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側権種で許可されたログイン状態（確認テスト）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	マスタデータ管理への GET が HTTP 403 となる確認があること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-088	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	第1カードにマスタ選択の select と「選択」ボタンであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-089	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-090	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / 更新順序（IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / 排他制御（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / ロールバック（IT-06） | 元設計HTMLに該当する処理・I/Fがないため |
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
| データベースアクセス / 分割・結合 / 分割（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / バッチ / DB影響（IT-26） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル取込 / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-24, IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-18, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / 参照系機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 受信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 受信処理 / バリデーション（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ログ出力 / ログ出力 / ログ編集（IT-20） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面表示 / 表示結果（IT-12, IT-14, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / イベント実行結果（IT-01, IT-12, IT-14, IT-16, IT-21, IT-25, IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ログ出力 / ブラウザ（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 取消（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / フロント / 表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 管理画面-公開側 / 反映（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 管理画面 / 初期表示（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル取込 / 実行結果（IT-16） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル出力 / 実行結果（IT-27） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-19, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 19 件は上記分類と同じ理由で対象外 |
