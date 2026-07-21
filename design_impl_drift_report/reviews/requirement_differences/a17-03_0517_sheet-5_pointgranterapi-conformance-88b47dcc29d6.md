# a17-03_0517_sheet-5_pointgranterapi 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a17-03_0517_sheet-5_pointgranterapi.json#a17-03_0517_sheet-5_pointgranterapi-conformance-88b47dcc29d6`
- 機能: A17-03 A17-03 PointGranterAPI連携
- 観点: ⑦要求網羅・実装違い

## 要旨
設計はスマレジ取引APIへの中継を要求するが、実装は中継処理がTODOのまま固定の成功レスポンスを返すだけで実際の中継を行っていない。

## 判定理由
設計は契約ID・アクセストークンを付与してスマレジ顧客連携サービスへ処理名とパラメータを渡し取引APIへ中継することを要求（詳細設計 処理フロー step2, 概要）。PointGranterController は $this->smaregiApiService->postRegisterTransaction() を呼ぶが、SmaregiApiService::postRegisterTransaction() は本体が『// TODO: スマレジAPIを実行する実装を追加』のみで固定の ['result'=>['status'=>'success']] を返す。別経路を探したが、SmaregiTransactionApiClient は getTransaction / listTransactions（いずれもGET）のみで取引登録POSTを持たない。他に postRegisterTransaction / transaction_upd 中継の別実装は無かった。よって取引API中継は未実装で、実装は設計と異なる固定応答を返す。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1785-1785` — 設計要求

```html
          <ol><li>リクエストヘッダの契約ID・アクセストークンと、本文の処理名・パラメータを受け取る。いずれかが欠落する場合は入力不正（HTTP 400）とし、空の本文を返す。</li><li>契約ID・アクセストークンを付与して、スマレジ顧客連携サービスへ処理名とパラメータを渡し、取引APIへ中継する。</li><li>中継結果に結果キーが含まれない場合は入力不正（HTTP 400）とし、結果をそのまま返す。</li><li>処理名が取引更新（<code>transaction_upd</code>）の場合、パラメータの先頭行から会員（スマレジ会員IDで特定）を引く。会員が見つからない場合はポイント付与を行わず、コード200で結果を返す。</li><li>会員が見つかった場合、会員ポイントに付与ポイントを加算し、ポイント履歴（会員・増減ポイント・メモ・発生日時・ポイント種別）を登録して保存する。</li><li>中継結果をコード200で返す。</li></ol>
```

## ec-cube-enterprise 実装
実装漏れ相当だが構造上メソッドは存在するため実装違いとして扱う。要求を満たす最寄りの実装。
`ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php:41-47` — 中継処理が固定レスポンスのスタブ

```php
        // TODO: スマレジAPIを実行する実装を追加
        // 未実装のため仮の固定レスポンスを返却
        return [
            'result' => [
                'status' => 'success',
            ],
        ];
```

`ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:62-67` — 呼び出し元コントローラ

```php
            $result = $this->smaregiApiService->postRegisterTransaction(
                $contractId,
                $accessToken,
                (string) $procName,
                (string) $params
            );
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず、指摘を維持。(1)引用の正しさ: SmaregiApiService::postRegisterTransaction (SmaregiApiService.php:35-48) は本体が `// TODO: スマレジAPIを実行する実装を追加 // 未実装のため仮の固定レスポンスを返却` のみで `['result'=>['status'=>'success']]` を返す。実装自身が『未実装』と明記。PointGranterController.php:62 が同メソッドを呼ぶことも確認。(2)別実装の探索: `rg postRegisterTransaction` はこの1メソッドとController呼出のみ。SmaregiTransactionApiClient は requestGet 経由の getTransaction / listTransactions（GET）のみで、pos/transactions への POST 中継メソッドは存在しない。registerTransaction/postTransaction/transaction_upd/proc_name の別中継実装も src 全体に無し。(3)設計側除外の検討: 設計の『本書で扱わないこと』(line 1761近傍) はスマレジ取引API『そのものの仕様・応答構造』を対象外とするだけで、『本書で扱うこと』(line 1761) は『連携先からの取引要求のスマレジ取引APIへの中継』を明示的に対象内としている。よって中継は要求範囲内かつ未実装。指摘成立。
