# m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、一覧、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |

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
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	編集テーブルで「登録」（保存）を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集テーブルで「登録」（保存）を送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集テーブルで「登録」（保存）を送信
3. 画面表示と後続状態を確認する"	検証に成功すると永続化処理が走り、続いて選択中マスタの一覧表示入口へリダイレクトされるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	非管理者・未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	管理画面の認証要件に従い利用できないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-009	IT-25	URL	P2	URLの操作結果確認	店舗側権種で許可されたログイン状態（確認テスト）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側権種で許可されたログイン状態（確認テスト）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗側権種で許可されたログイン状態（確認テスト）を確認する
3. 画面表示と後続状態を確認する"	マスタデータ管理への GET が HTTP 403 となる確認があること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	表示要素を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	JS 挙動を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能ではモーダルや確認ダイアログを出さないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力項目を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M11-05-MSG-002を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M11-05-MSG-002を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示順を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示順を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	更新行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 更新行を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	削除行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 削除行
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	説明文を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 説明文を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-019	IT-22	部分入力	P2	部分入力の入力検証	行 IDを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 IDの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行 IDを確認する
3. 画面表示と後続状態を確認する"	エンティティの主キーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-020	IT-23	検索条件	P2	検索時の検索条件確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-021	IT-23	検索条件	P2	検索時の検索条件確認	同一送信内で同じ ID が複数行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-022	IT-23	検索条件	P2	検索時の検索条件確認	主キーとして 0 を使うを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-023	IT-23	検索条件	P2	検索時の検索条件確認	flush が例外を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-024	IT-23	検索条件	P2	検索時の検索条件確認	無効なマスタキーでパス引数だけ開くを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-025	IT-23	検索条件	P2	検索時の検索条件確認	プルダウンでは選べない除外マスタを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-026	IT-23	検索条件	P2	検索時の検索条件確認	具象マスタの追加列を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-027	IT-23	検索条件	P2	検索時の検索条件確認	一覧と DBを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-028	IT-23	検索条件	P2	検索時の検索条件確認	参照整合性を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で参照整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-029	IT-23	検索条件	P2	検索時の検索条件確認	同時更新を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で同時更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-030	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-031	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で失敗時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-032	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で副作用の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-033	IT-23	検索条件	P2	検索時の検索条件確認	選択中のマスタに対応するテーブルを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で選択中のマスタに対応するテーブルの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-034	IT-23	実行結果	P2	検索時の実行結果確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行名称の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-035	IT-23	実行結果	P2	検索時の実行結果確認	行 ID（集合）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 ID（集合）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-036	IT-23	実行結果	P2	検索時の実行結果確認	未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で未認証の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-037	IT-23	実行結果	P2	検索時の実行結果確認	システム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でシステム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-038	IT-26	登録内容	P1	登録時の登録内容確認	店舗側の権種（確認テストでは tenant_owner でログイン）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側の権種（確認テストでは tenant_owner でログイン）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-039	IT-26	登録内容	P1	登録時の登録内容確認	保存の POST が成功を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で保存の POST が成功の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-040	IT-26	登録内容	P1	登録時の登録内容確認	検証失敗を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検証失敗の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-041	IT-26	登録内容	P1	登録時の登録内容確認	マスタキーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタキーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	プルダウンおよび hidden 項目に用いる、FQCN をハイフン区切りにした識別子（例: Eccube-Entity-Master-Sex）であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-042	IT-26	登録内容	P1	登録時の登録内容確認	編集コレクションを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集コレクションの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-043	IT-26	登録内容	P1	登録時の登録内容確認	行キーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-044	IT-26	登録内容	P1	登録時の登録内容確認	マスタデータ管理を開く（マスタ未選択）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-045	IT-26	登録内容	P1	登録時の登録内容確認	プルダウンでマスタを選び「選択」を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-046	IT-26	登録内容	P1	登録時の登録内容確認	既にマスタが選ばれた状態の入口へ遷移を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-047	IT-26	登録内容	P1	登録時の登録内容確認	編集テーブルで「登録」（保存）を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集テーブルで「登録」（保存）を送信の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-048	IT-26	実行結果	P1	登録時の実行結果確認	非管理者・未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で非管理者・未認証の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-049	IT-23	実行結果	P1	登録時の実行結果確認	店舗側権種で許可されたログイン状態（確認テスト）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側権種で許可されたログイン状態（確認テスト）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	マスタデータ管理への GET が HTTP 403 となる確認があること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-050	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-051	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でJS 挙動の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-052	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-053	IT-26	更新内容	P1	更新時の更新内容確認	入力項目を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で入力項目の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	マスタ選択: 単一選択 selectであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-054	IT-26	更新内容	P1	更新時の更新内容確認	M11-05-MSG-002を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でM11-05-MSG-002の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-055	IT-26	更新内容	P1	更新時の更新内容確認	表示順を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-056	IT-26	更新内容	P1	更新時の更新内容確認	更新行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-057	IT-26	更新内容	P1	更新時の更新内容確認	削除行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-058	IT-26	更新内容	P1	更新時の更新内容確認	説明文を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-059	IT-26	更新内容	P1	更新時の更新内容確認	行 IDを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 IDの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-060	IT-05	実行結果	P1	更新時の実行結果確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行名称の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-061	IT-05	実行結果	P1	更新時の実行結果確認	同一送信内で同じ ID が複数行を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で同一送信内で同じ ID が複数行の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	各行の ID フィールドに重複エラーが付くであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-062	IT-05	削除条件	P1	削除時の削除条件確認	主キーとして 0 を使うを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	自動テスト上、名称を伴う 0 の保存や、ID 0 行の削除が確認されていること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-063	IT-05	削除条件	P1	削除時の削除条件確認	flush が例外を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーフラッシュを積み、リダイレクトは同様に行うこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-064	IT-05	削除条件	P1	削除時の削除条件確認	無効なマスタキーでパス引数だけ開くを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	マッピング例外を握り潰し、編集表が出ない状態に寄せ得るであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-065	IT-05	削除条件	P1	削除時の削除条件確認	プルダウンでは選べない除外マスタを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存処理は hidden のマスタキー文字列を解釈するため、リクエストを構築できれば当該クラスを対象に保存し得るであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-066	IT-05	削除条件	P1	削除時の削除条件確認	具象マスタの追加列を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で具象マスタの追加列の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-067	IT-05	実行結果	P1	削除時の実行結果確認	一覧と DBを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で一覧と DBの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-068	IT-05	実行結果	P1	削除時の実行結果確認	参照整合性を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で参照整合性の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除は remove と flush に依存し、参照先が残ると例外となりエラーフラッシュに落ちるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-069	IT-05	実行結果	P1	削除時の実行結果確認	同時更新を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で同時更新の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-070	IT-05	実行結果	P1	削除時の実行結果確認	成功時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTML 画面であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-071	IT-02	初期行数	P2	初期行数の結合確認	失敗時出力を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	検証エラーは同一レスポンスでフィールドエラーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-072	IT-02	表示順	P2	表示順の結合確認	副作用を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	対象マスタテーブルの行の追加・更新・削除・sort_no 更新であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-073	IT-25	更新抑止	P1	更新抑止の結合確認	選択中のマスタに対応するテーブルを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で選択中のマスタに対応するテーブルの確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	保存完了時に画面上の行順へ 0 起算で振り直すであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-074	IT-12	内部情報	P1	内部情報の結合確認	行名称を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行名称の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	任意であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-075	IT-15	機密情報	P1	機密情報の結合確認	行 ID（集合）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行 ID（集合）の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	POST_SUBMIT で ID の重複を検査し、重複分にフォームエラーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-076	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	未認証を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未認証を確認する
3. 画面表示と後続状態を確認する"	利用不可であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-077	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	システム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でシステム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. システム管理者・モール系管理者など、本 URL パターンを拒否リストに載せてい…を確認する
3. 画面表示と後続状態を確認する"	画面表示および送信が許可される実装になっていること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-078	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	店舗側の権種（確認テストでは tenant_owner でログイン）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で店舗側の権種（確認テストでは tenant_owner でログイン）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗側の権種（確認テストでは tenant_owner でログイン）を確認する
3. 画面表示と後続状態を確認する"	Enterprise_Mall グループの PHPUnit で、マスタデータ管理への GET が HTTP 403 となることを確認すること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-079	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	保存の POST が成功を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で保存の POST が成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存の POST が成功
3. 画面表示と後続状態を確認する"	同上であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	検証失敗を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で検証失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検証失敗を確認する
3. 画面表示と後続状態を確認する"	同一画面を 200 で再表示であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-081	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	マスタキーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタキーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. マスタキーを確認する
3. 画面表示と後続状態を確認する"	プルダウンおよび hidden 項目に用いる、FQCN をハイフン区切りにした識別子（例: Eccube-Entity-Master-Sex）であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	編集コレクションを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で編集コレクションの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集コレクションを確認する
3. 画面表示と後続状態を確認する"	保存用フォームの data 配列であること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-083	IT-25	一覧	P2	一覧の結合確認	行キーを試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で行キーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行キーを確認する
3. 画面表示と後続状態を確認する"	編集コレクションの配列キーであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-084	IT-12	画面表示データ	P2	画面表示データの結合確認	マスタデータ管理を開く（マスタ未選択）を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でマスタデータ管理を開く（マスタ未選択）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. マスタデータ管理を開く（マスタ未選択）
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-085	IT-25	画面表示データ	P2	画面表示データの結合確認	プルダウンでマスタを選び「選択」を送信を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でプルダウンでマスタを選び「選択」を送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. プルダウンでマスタを選び「選択」を送信
3. 画面表示と後続状態を確認する"	検証に成功すると、同一機能の別入口へリダイレクトされ、選択したマスタの行一覧と空の追加行が表示されるであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-086	IT-12	画面表示データ	P2	画面表示データの結合確認	既にマスタが選ばれた状態の入口へ遷移を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で既にマスタが選ばれた状態の入口へ遷移の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 既にマスタが選ばれた状態の入口へ遷移を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-087	IT-12	非同期更新	P1	非同期更新の結合確認	表示要素を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	第1カードにマスタ選択の select と「選択」ボタンであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-088	IT-12	エラー継続	P3	エラー継続の結合確認	JS 挙動を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	本テンプレートは専用の追加・削除用スクリプトを持たないこと。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-089	IT-25	欠損値	P2	欠損値の結合確認	入力項目を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	マスタ選択: 単一選択 selectであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-090	IT-25	データなし	P2	データなしの結合確認	M11-05-MSG-002を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）でM11-05-MSG-002の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M11-05-MSG-002を確認する
3. 画面表示と後続状態を確認する"	編集フォームが有効で、マスタデータ保存処理のtryブロックで例外が発生したときであること。
m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）	IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-091	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	表示順を試験できる状態である	m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）（m11_05_admin_system_setting_setting_system_masterdata）で表示順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示順を確認する
3. 画面表示と後続状態を確認する"	一覧読込は sort_no 昇順であること。
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 7件 — No.109, No.110, No.111, No.359, No.381, No.382, No.412。上限緩和または個別ケース化で収載可能。
