# バッチ 商品管理 — 入荷通知キャンセル 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/b02-02_batch_product_product_arrival_notification_cancel.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-05 | 削除条件、実行結果 |
| IT-30 | コマンド、入力データ、実行結果、終了ステータス |
| IT-12 | JSON形式、エラー、レスポンス、入力データ、実行結果、終了ステータス |
| IT-16 | 実行結果 |
| IT-27 | 実行結果 |
| IT-26 | 更新順序 |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |
| IT-11 | 実行結果 |
| IT-28 | エラー、ヘッダ、件名、実行結果、本文 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-001	IT-05	削除条件	P1	削除時の削除条件確認	商品規格の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	有効な値が削除条件に指定された場合、期待したレコードが削除対象となること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-002	IT-05	削除条件	P1	削除時の削除条件確認	商品の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	無効な値が削除条件に指定された場合、レコードが削除対象とならないこと。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-003	IT-05	削除条件	P1	削除時の削除条件確認	論理削除を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で論理削除の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	値が削除条件に指定されなかった場合、期待される結果となること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-004	IT-05	削除条件	P1	削除時の削除条件確認	コンソールのバッチコマンドを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	有効な値の組み合わせが削除条件に指定された場合、期待したレコードが削除対象となること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-005	IT-05	削除条件	P1	削除時の削除条件確認	対象を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	無効な値の組み合わせが削除条件に指定された場合、レコードが削除対象とならないこと。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-006	IT-05	削除条件	P1	削除時の削除条件確認	削除条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-007	IT-05	実行結果	P1	削除時の実行結果確認	反映を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で反映の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-008	IT-05	実行結果	P1	削除時の実行結果確認	実行条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行条件の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	論理削除対象のテーブルに削除するレコードがない場合、期待される結果となること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-009	IT-05	実行結果	P1	削除時の実行結果確認	成功結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功結果の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	期待したレコード件数を論理削除できること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-010	IT-05	実行結果	P1	削除時の実行結果確認	失敗結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗結果の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-011	IT-05	実行結果	P1	削除時の実行結果確認	再実行時を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で再実行時の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	物理削除対象のテーブルに削除するレコードがない場合、期待される結果となること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-012	IT-05	実行結果	P1	削除時の実行結果確認	成功時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	期待したレコード件数を物理削除できること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-013	IT-30	実行結果	P1	実行結果の結合確認	失敗時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-014	IT-30	実行結果	P1	実行結果の結合確認	副作用を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で副作用の確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-015	IT-30	実行結果	P1	実行結果の結合確認	多重実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で多重実行の確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-016	IT-12	実行結果	P1	実行結果の結合確認	途中失敗・再実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で途中失敗・再実行の確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果でエラーが表示され、対象処理が完了しないこと。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-017	IT-30	実行結果	P1	実行結果の結合確認	参照時点を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で参照時点の確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-018	IT-30	実行結果	P1	実行結果の結合確認	dtb_product_requestを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_requestの確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-019	IT-30	実行結果	P1	実行結果の結合確認	dtb_product_classを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_classの確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-020	IT-30	実行結果	P1	実行結果の結合確認	登録/更新を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で登録/更新の確認に必要な条件を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-021	IT-30	入力データ	P1	入力データの結合確認	対象なしを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で対象なしの確認に必要な条件を指定する	"1. 入力データの対象ジョブを実行する
2. 実行結果と副作用を確認する"	入力データのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-022	IT-12	入力データ	P1	入力データの結合確認	一括更新時の例外を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で一括更新時の例外の確認に必要な条件を指定する	"1. 入力データの対象ジョブを実行する
2. 実行結果と副作用を確認する"	入力データのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-023	IT-30	入力データ	P1	入力データの結合確認	開始・完了を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で開始・完了の確認に必要な条件を指定する	"1. 入力データの対象ジョブを実行する
2. 実行結果と副作用を確認する"	入力データのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-024	IT-30	終了ステータス	P1	終了ステータスの結合確認	商品規格の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で商品規格の削除表現の確認に必要な条件を指定する	"1. 終了ステータスの対象ジョブを実行する
2. 実行結果と副作用を確認する"	終了ステータスのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-025	IT-30	終了ステータス	P1	終了ステータスの結合確認	商品の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で商品の削除表現の確認に必要な条件を指定する	"1. 終了ステータスの対象ジョブを実行する
2. 実行結果と副作用を確認する"	終了ステータスのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-026	IT-12	終了ステータス	P1	終了ステータスの結合確認	論理削除を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で論理削除の確認に必要な条件を指定する	"1. 終了ステータスの対象ジョブを実行する
2. 実行結果と副作用を確認する"	終了ステータスのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-027	IT-12	エラー	P1	エラーの結合確認	コンソールのバッチコマンドを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でコンソールのバッチコマンドの確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-028	IT-12	エラー	P1	エラーの入力検証	対象を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で対象の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-029	IT-12	エラー	P1	エラーの入力検証	削除条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-030	IT-12	エラー	P1	エラーの入力検証	反映を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で反映の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-031	IT-12	エラー	P1	エラーの入力検証	実行条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行条件の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-032	IT-12	エラー	P1	エラーの入力検証	成功結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功結果の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-033	IT-12	エラー	P1	エラーの入力検証	失敗結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗結果の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-034	IT-12	エラー	P1	エラーの結合確認	再実行時を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で再実行時の確認に必要な条件を指定する	"1. エラーの対象ジョブを実行する
2. 実行結果と副作用を確認する"	エラーのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-035	IT-16	実行結果	P1	実行結果の結合確認	成功時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行結果で対象条件に該当しない値を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-036	IT-27	実行結果	P1	実行結果の結合確認	失敗時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行結果で対象条件に該当しない値を指定する	"1. 実行結果の対象ジョブを実行する
2. 実行結果と副作用を確認する"	実行結果のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-037	IT-30	コマンド	P1	コマンドの結合確認	副作用を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で副作用の確認に必要な条件を指定する	"1. コマンドの対象ジョブを実行する
2. 実行結果と副作用を確認する"	入荷通知リクエストの論理削除であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-038	IT-12	JSON形式	P1	JSON形式の結合確認	多重実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で多重実行の確認に必要な条件を指定する	"1. JSON形式の対象ジョブを実行する
2. 実行結果と副作用を確認する"	JSON形式のジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-039	IT-12	レスポンス	P1	レスポンスの結合確認	途中失敗・再実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で途中失敗・再実行の確認に必要な条件を指定する	"1. レスポンスの対象ジョブを実行する
2. 実行結果と副作用を確認する"	レスポンスのジョブ終了状態と処理件数が実行結果に記録されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-040	IT-26	更新順序	P1	更新順序の結合確認	参照時点を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で参照時点の確認に必要な条件を指定する	"1. 更新順序の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	複数テーブルに対し、登録、更新、削除を行う場合、処理されるテーブルの順序が期待される結果であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-041	IT-07	排他制御	P1	排他制御の結合確認	dtb_product_requestを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_requestの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録、更新、削除の実行時に楽観的ロックができること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-042	IT-07	排他制御	P1	排他制御の結合確認	dtb_product_classを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_classの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録、更新、削除の実行時に悲観的ロックができること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-043	IT-06	ロールバック	P3	ロールバックの結合確認	登録/更新を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で登録/更新の確認に必要な条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーが発生した場合、ロールバックされること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-044	IT-11	実行結果	P2	実行結果の結合確認	対象なしを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で対象なしの確認に必要な条件を指定する	"1. 実行結果の対象機能を実行する
2. 実行結果を確認する"	指定した宛先（メールアドレス）への送信、転送が正常終了すること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-045	IT-28	実行結果	P2	実行結果の結合確認	一括更新時の例外を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行結果の対象項目に最大長の値を指定する	"1. 実行結果の対象機能を実行する
2. 実行結果を確認する"	宛先（メールアドレス）に最大長がセットされた場合、送信、転送が正常終了すること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-046	IT-28	実行結果	P2	実行結果の結合確認	開始・完了を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行結果の対象項目に最大長の値を指定する	"1. 実行結果の対象機能を実行する
2. 実行結果を確認する"	件名に最大長がセットされた場合、送信、転送が正常終了すること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-047	IT-28	実行結果	P2	実行結果の結合確認	商品規格の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で商品規格の削除表現の確認に必要な条件を指定する	"1. 実行結果の対象機能を実行する
2. 実行結果を確認する"	"件名に改行・タブ・メタキャラクタ（ ""，&．<，>，',\ ）が含まれていた場合、送信、転送が正常終了すること。"
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-048	IT-28	実行結果	P2	実行結果の結合確認	商品の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で商品の削除表現の確認に必要な条件を指定する	"1. 実行結果の対象機能を実行する
2. 実行結果を確認する"	"本文に改行・タブ・メタキャラクタ（ ""，&．<，>，',\ ）が含まれていた場合、送信、転送が正常終了すること。"
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-049	IT-28	エラー	P2	エラーの結合確認	論理削除を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で論理削除の確認に必要な条件を指定する	"1. エラーの対象機能を実行する
2. 実行結果を確認する"	エラーが発生した場合、メールの送信結果が期待される結果であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-050	IT-28	ヘッダ	P2	ヘッダの結合確認	コンソールのバッチコマンドを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でコンソールのバッチコマンドの確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダの宛先（To）に［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-051	IT-28	ヘッダ	P2	ヘッダの結合確認	対象を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で対象の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダの宛先（Cc）に［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-052	IT-28	ヘッダ	P2	ヘッダの結合確認	削除条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で削除条件の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダの宛先（Bcc）に［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-053	IT-28	ヘッダ	P2	ヘッダの結合確認	反映を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で反映の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダの送信元（From）に［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-054	IT-28	ヘッダ	P2	ヘッダの結合確認	実行条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行条件の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダの返信先（Reply-to）に［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-055	IT-28	ヘッダ	P2	ヘッダの結合確認	成功結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功結果の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダの差戻し先（Retuern-path）に［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-056	IT-28	ヘッダ	P2	ヘッダの結合確認	失敗結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗結果の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダのContent-Typeに［メール設計書の記載通りの値］が設定されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-057	IT-28	ヘッダ	P2	ヘッダの結合確認	再実行時を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で再実行時の確認に必要な条件を指定する	"1. ヘッダの対象機能を実行する
2. 実行結果を確認する"	ヘッダがエンコードされること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-058	IT-28	件名	P2	件名の結合確認	成功時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功時出力の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	件名が固定の文言の場合、件名に設定された文言が［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-059	IT-28	件名	P2	件名の結合確認	失敗時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗時出力の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	件名に埋め込み項目を使用する場合、件名に設定された値が［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-060	IT-28	件名	P2	件名の結合確認	副作用を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で件名の対象項目を未入力にする	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-061	IT-28	件名	P2	件名の結合確認	多重実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で件名の対象項目を未入力にする	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	件名でエラーが表示されず、対象処理を継続できること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-062	IT-28	件名	P2	件名の結合確認	途中失敗・再実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で途中失敗・再実行の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値を変換する設計となっている場合、件名に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-063	IT-28	件名	P2	件名の結合確認	参照時点を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で参照時点の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値を編集する処理が分岐する設計となっている場合、件名に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-064	IT-28	件名	P2	件名の結合確認	dtb_product_requestを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_requestの確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	ループ処理によって、取得した値の編集を繰り返す設計となっている場合、件名に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-065	IT-28	件名	P2	件名の結合確認	dtb_product_classを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_classの確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値を使用して計算する設計となっている場合、件名に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-066	IT-28	件名	P2	件名の結合確認	登録/更新を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で登録/更新の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値を連結する設計となっている場合、件名に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-067	IT-28	件名	P2	件名の結合確認	対象なしを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で対象なしの確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値を暗号化する設計となっている場合、件名に設定された値が暗号化されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-068	IT-28	件名	P2	件名の結合確認	一括更新時の例外を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で一括更新時の例外の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値をマスキングする設計となっている場合、件名に設定された値がマスキングされること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-069	IT-28	件名	P2	件名の結合確認	開始・完了を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で開始・完了の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	取得した値に改行、タブ、メタキャラクタが含まれる場合、件名に設定された値がエンコーディング、サニタイジングされること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-070	IT-28	件名	P2	件名の結合確認	商品規格の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で商品規格の削除表現の確認に必要な条件を指定する	"1. 件名の対象機能を実行する
2. 実行結果を確認する"	埋め込み項目の編集仕様が［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-071	IT-28	本文	P2	本文の結合確認	商品の削除表現を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で商品の削除表現の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	本文が固定の文言の場合、本文に設定された文言が［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-072	IT-28	本文	P2	本文の結合確認	論理削除を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で論理削除の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	本文に埋め込み項目を使用する場合、本文に設定された値が［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-073	IT-28	本文	P2	本文の結合確認	コンソールのバッチコマンドを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でコンソールのバッチコマンドの確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	本文のデザインが［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-074	IT-28	本文	P2	本文の結合確認	対象を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で本文の対象項目を未入力にする	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-075	IT-28	本文	P2	本文の結合確認	削除条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で本文の対象項目を未入力にする	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	本文でエラーが表示されず、対象処理を継続できること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-076	IT-28	本文	P2	本文の結合確認	反映を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で反映の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	本文にエラーメッセージを出力する場合、本文に出力されたメッセージが［システム機能設計書/共通コンポーネント設計書/メール設計書/メッセージ設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-077	IT-28	本文	P2	本文の結合確認	実行条件を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で実行条件の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値を変換する設計となっている場合、本文に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-078	IT-28	本文	P2	本文の結合確認	成功結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功結果の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値を編集する処理が分岐する設計となっている場合、本文に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-079	IT-28	本文	P2	本文の結合確認	失敗結果を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗結果の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	ループ処理によって、取得した値の編集を繰り返す設計となっている場合、本文に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-080	IT-28	本文	P2	本文の結合確認	再実行時を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で再実行時の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値を使用して計算する設計となっている場合、本文に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-081	IT-28	本文	P2	本文の結合確認	成功時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で成功時出力の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値を連結する設計となっている場合、本文に設定された値が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-082	IT-28	本文	P2	本文の結合確認	失敗時出力を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で失敗時出力の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値を暗号化する設計となっている場合、本文に設定された値が暗号化されること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-083	IT-28	本文	P2	本文の結合確認	副作用を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で副作用の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値をマスキングする設計となっている場合、本文に設定された値がマスキングされること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-084	IT-28	本文	P2	本文の結合確認	多重実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で多重実行の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	取得した値に改行、タブ、メタキャラクタが含まれる場合、本文に設定された値がエンコーディング、サニタイジングされること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-085	IT-28	本文	P2	本文の結合確認	途中失敗・再実行を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で途中失敗・再実行の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	埋め込み項目の編集仕様が［メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-086	IT-28	本文	P2	本文の結合確認	参照時点を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で参照時点の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	1通のメールに埋め込み項目などを複数件繰り返し出力し、その最大件数が決まっている場合、最大件数分の値を出力した結果が期待される結果であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-087	IT-28	本文	P2	本文の結合確認	dtb_product_requestを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_requestの確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	1通のメールに埋め込み項目などを複数件繰り返し出力し、その最大件数が決まっている場合、最大件数＋1件分の値を出力した結果が期待される結果であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-088	IT-28	本文	P2	本文の結合確認	dtb_product_classを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）でdtb_product_classの確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	1通のメールに埋め込み項目などを複数件繰り返し出力する処理で、出力対象が0件の場合、期待される結果となること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-089	IT-28	本文	P2	本文の結合確認	登録/更新を試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で登録/更新の確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	1通のメールに埋め込み項目などを複数件繰り返し出力する設計の場合、ソート順が［システム機能設計書/共通コンポーネント設計書/メール設計書の記載通り］であること。
バッチ 商品管理 — 入荷通知キャンセル	IT-B02-02-BATCH-PRODUCT-PRODUCT-ARRIVAL-NOTIFICATION-CANCEL-090	IT-28	本文	P2	本文の結合確認	対象なしを試験できる状態である	バッチ 商品管理 — 入荷通知キャンセル（b02_02_batch_product_product_arrival_notification_cancel）で対象なしの確認に必要な条件を指定する	"1. 本文の対象機能を実行する
2. 実行結果を確認する"	ファイルを添付する場合、指定したファイルが添付されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 本機能に入力検証対象がないため |
| バリデーション / バリデーション / 相関バリデーション（IT-22） | 本機能に入力検証対象がないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 本機能に入力検証対象がないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 本機能に更新処理がないため |
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
| データベースアクセス / バッチ / DB影響（IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はファイル入出力を扱わないため |
| 電文処理 / 受信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 受信処理 / バリデーション（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ログ出力 / ログ出力 / ログ編集（IT-20） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面表示 / 表示結果（IT-12, IT-14, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / イベント実行結果（IT-01, IT-12, IT-14, IT-16, IT-21, IT-25, IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / 遷移結果（IT-03, IT-13, IT-25） | 本機能に該当する画面操作起点がないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 本機能に更新処理がないため |
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
| ウェブアプリケーション / フロント / リンク（IT-25） | 本機能に該当する画面操作起点がないため |
| ウェブアプリケーション / 管理画面-公開側 / 反映（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 管理画面 / 初期表示（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 管理画面 / セキュリティ（IT-15） | 本機能はファイル入出力を扱わないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-19, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 連携エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / バッチ / 正常終了（IT-09） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / バッチ / 異常終了（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / フロント / 外部キャッシュ（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 18 件は上記分類と同じ理由で対象外 |
