# a06-05_0506_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-05_0506_sheet-7_sheet.json#a06-05_0506_sheet-7_sheet-conformance-2db6ee35f99c`
- 機能: A06-05 A06-05 店頭買取情報ステータス更新
- 観点: ⑦要求網羅・実装違い

## 要旨
ステータスID不正時の返却文言が設計指定の「正しい店頭買取ステータスIDを入力してください」と異なる。

## 判定理由
設計は status のマスタ不存在／不正時に「正しい店頭買取ステータスIDを入力してください」を HTTP 400 で返すことを固定要求している（処理フロー・レスポンス失敗表・バリデーション・エラー処理の各節）。実装 OtcBuyOrderController::updateStatus は status 欠落・空・非数値時に MissingRequiredParameterException('ステータスが不正です')（198-201行）、店頭買取ステータスマスタ未存在時に InvalidParameterException('ステータスが見つかりません')（204-206行）を投げ、いずれも設計指定文言と異なる。同一ファイル内・関連 Action を確認したが設計文言を返す経路は無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1874-1874` — 設計要求

```html
          <ol><li><code>jwt-token</code>ヘッダのトークンを検証し、管理者会員を特定する。検証できない場合は認証拒否（HTTP 401）とする。</li><li>パスの受注IDで店頭買取受注を1件取得する。該当が無い場合は該当なし（HTTP 404）とする。</li><li>更新前のステータスを保持する。</li><li>リクエストのステータスID（<code>status</code>）で店頭買取ステータスマスタを引く。該当が無い場合は入力不正（HTTP 400）とし「正しい店頭買取ステータスIDを入力してください」を返す。</li><li>更新前ステータスが査定終了に該当する場合は更新不可とし、入力不正（HTTP 400）を返す。指定ステータスが査定中・査定再開のときは「この査定はすでに終了しているため開くことができません。」、それ以外は「この査定はすでに終了しているためステータスの更新に失敗しました。」を返す。</li><li>更新前ステータスが査定中・査定再開で、かつ指定ステータスも査定中・査定再開で、その受注の査定担当者が認証した管理者会員と異なる場合は、入力不正（HTTP 400）とし「この受注は「（査定担当者名）」が査定中です。」を返す。</li><li>更新前ステータスと指定ステータスが異なる場合のみ、受注のステータス・査定担当者・更新日時を更新し、ステータス変更履歴を1件登録する。更新前後が同じステータスのときは更新も履歴登録も行わない。</li><li>コード200のJSONを返す。</li></ol>
```

## ec-cube-enterprise 実装
設計指定文言を返さない最寄り実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:198-207` — 実装（不正/欠落時文言）

```php
        $raw = $request->request->get('status');
        if ($raw === null || $raw === '' || !ctype_digit((string) $raw)) {
            throw new MissingRequiredParameterException('ステータスが不正です');
        }
        $statusId = (int) $raw;

        $Status = $this->entityManager->find(MtbOtcBuyOrderStatus::class, $statusId);
        if (!$Status instanceof MtbOtcBuyOrderStatus) {
            throw new InvalidParameterException('ステータスが見つかりません');
        }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計(1874/1887/1898/1915行)はステータスマスタ不存在時に「正しい店頭買取ステータスIDを入力してください」をHTTP400で返すことを4節で固定要求。当機能(A06-05, sheet-7)の対象エンドポイントは /admin/otcBuyOrder/{id}/status.json = OtcBuyOrderController::updateStatus であることを設計1865行で確認。実装(OtcBuyOrderController.php:199-201はstatus欠落/空/非数値で'ステータスが不正です'、:205-206はマスタ未存在で'ステータスが見つかりません')はいずれも設計文言と不一致。別実装反証として rg '正しい.*ステータスIDを入力' を全src横断したが、設計文言はネット買取側 BuyOrderController.php:137,143 にしか存在せず、店頭買取(OTC)経路には皆無。locale/翻訳キー経由でもない(直値throw)。設計側にPh2/対象外/現行踏襲/実装しない等の除外注記は sheet-7(1747-1927行)に無し(『本文を持たない』が2件あるのみで別要求)。指摘は維持。
