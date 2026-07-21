# a06-16_0506_sheet-15_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-16_0506_sheet-15_sheet.json#a06-16_0506_sheet-15_sheet-conformance-80fb486717f6`
- 機能: A06-16 A06-16 【新規】ダブルチェック者更新
- 観点: ⑦要求網羅・実装違い

## 要旨
設計はリクエスト項目名を member_id と規定するが、実装は double_check_member_id を必須として読み取る。

## 判定理由
設計書 sheet-15 はリクエストパラメータを member_id (数値(整数)・必須・入力例1000・メンバーID) と規定 (HTML:3854)。設計書の効力範囲規定では『APIリクエスト/レスポンスの詳細は、参照元Excel設計書の該当シートを正とする』(HTML:3810) とあり、実装を正とする明記対象は URL エンドポイントと DB カラムのみで、リクエスト項目名は Excel が正。実装 OtcBuyOrderController::updateDoubleCheckMember はリクエストボディから double_check_member_id を取得し (OtcBuyOrderController.php:239)、null なら MissingRequiredParameterException を投げる (同:241)。member_id は本 API で参照されない。反証として member_id / double_check_member_id を同コントローラで確認したが、この更新APIで member_id を受け付ける経路は存在しない。よって項目名の実装違いは事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3851-3854` — 設計要求(リクエストパラメータ member_id)

```html
          リクエストパラメータ
          項目名型必須最大文字数
          または最大値入力例備考
          member_id数値(整数)〇1000メンバーID
```

## ec-cube-enterprise 実装
member_id ではなく double_check_member_id を読み取る
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:239-241` — 実装(double_check_member_id を必須取得)

```php
        $raw = $request->request->get('double_check_member_id');
        if ($raw === null) {
            throw new MissingRequiredParameterException('ダブルチェック者を入力してください');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。(1)引用の正しさ: 実装 OtcBuyOrderController.php:239 は $request->request->get('double_check_member_id') を必須取得し、null で MissingRequiredParameterException(:241) を投げる。設計側 HTML:3854 は member_id を必須リクエストパラメータと規定。いずれも正確。(2)別実装の探索: rg 'double_check_member_id|doubleCheckMemberId' および 'doublecheck|doubleCheck' を src/ 全体で横断したが、この更新APIで member_id を受け付ける別ルート/別Controller/Form/DTOは存在せず、読取キーは double_check_member_id のみ。(3)設計側の除外: 実装を正とする明記は 3800/3810/3812 に限られ、対象は『URLエンドポイント・DBカラム・実処理順序』(3800) と『URLエンドポイントとDBカラム』(3810二番目) と『DB関連』(3812) のみ。逆に 3810 一番目は『APIリクエスト/レスポンスの詳細は…Excel設計書…を正とする』と明記し、リクエスト項目名 member_id は Excel が正。移行差テーブル (3813) は member_id→doubleCheckMemberId の差を記録するが、3812 が実装優先を与えるのは DB のみで、リクエスト項目には実装優先の明記がない。よって authoritative な要求は member_id のままで実装違いは事実。指摘維持。
