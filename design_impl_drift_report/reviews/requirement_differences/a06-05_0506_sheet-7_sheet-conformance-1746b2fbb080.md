# a06-05_0506_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-05_0506_sheet-7_sheet.json#a06-05_0506_sheet-7_sheet-conformance-1746b2fbb080`
- 機能: A06-05 A06-05 店頭買取情報ステータス更新
- 観点: ⑦要求網羅・実装違い

## 要旨
他担当者査定中エラー文言に、設計が要求する担当者名を囲む鉤括弧と末尾句点が無い。

## 判定理由
設計は査定中占有時に「この受注は「（査定担当者名）」が査定中です。」を返すよう要求している（処理フロー6・レスポンス失敗表・エラー処理表）。実装 UpdateStatusAction::handle は101行で InvalidStatusTransitionException("この受注は{$input->OtcBuyOrder->getMember()->getName()}が査定中です") を投げており、担当者名を囲む「」鉤括弧と末尾の句点。が欠落している。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1874-1874` — 設計要求

```html
          <ol><li><code>jwt-token</code>ヘッダのトークンを検証し、管理者会員を特定する。検証できない場合は認証拒否（HTTP 401）とする。</li><li>パスの受注IDで店頭買取受注を1件取得する。該当が無い場合は該当なし（HTTP 404）とする。</li><li>更新前のステータスを保持する。</li><li>リクエストのステータスID（<code>status</code>）で店頭買取ステータスマスタを引く。該当が無い場合は入力不正（HTTP 400）とし「正しい店頭買取ステータスIDを入力してください」を返す。</li><li>更新前ステータスが査定終了に該当する場合は更新不可とし、入力不正（HTTP 400）を返す。指定ステータスが査定中・査定再開のときは「この査定はすでに終了しているため開くことができません。」、それ以外は「この査定はすでに終了しているためステータスの更新に失敗しました。」を返す。</li><li>更新前ステータスが査定中・査定再開で、かつ指定ステータスも査定中・査定再開で、その受注の査定担当者が認証した管理者会員と異なる場合は、入力不正（HTTP 400）とし「この受注は「（査定担当者名）」が査定中です。」を返す。</li><li>更新前ステータスと指定ステータスが異なる場合のみ、受注のステータス・査定担当者・更新日時を更新し、ステータス変更履歴を1件登録する。更新前後が同じステータスのときは更新も履歴登録も行わない。</li><li>コード200のJSONを返す。</li></ol>
```

## ec-cube-enterprise 実装
鉤括弧・句点なし
`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:101-101` — 実装

```php
            throw new InvalidStatusTransitionException("この受注は{$input->OtcBuyOrder->getMember()->getName()}が査定中です");
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計(1874-6項/1887行/1915行)は査定中占有時に「この受注は「（査定担当者名）」が査定中です。」(担当者名を「」で囲み末尾。付き)を要求。当機能対象の OtcBuyOrder/UpdateStatusAction.php:101 は "この受注は{...getName()}が査定中です" と実装され「」鉤括弧・末尾句点。が欠落、設計と不一致を実ファイルで確認。別実装反証として rg 'この受注は'/'が査定中です' を全src横断したところ、設計どおり「」+。を満たす文言は BuyOrder(ネット買取) UpdateStatusAction.php:96 にのみ存在し、店頭買取(OTC)側の当該行は満たさない。引用行番号・コード内容とも正確。設計側除外注記なし。指摘は維持。
