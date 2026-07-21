# a06-11_0506_sheet-11_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-11_0506_sheet-11_sheet.json#a06-11_0506_sheet-11_sheet-conformance-2de4a84f5f4a`
- 機能: A06-11 A06-11 部門一覧を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
部門一覧取得APIの成功レスポンスは設計では code/message/sections を持つJSONオブジェクトだが、実装は部門要素の裸配列をそのまま返しており、トップレベルの code・message・sections ラッパーが欠落している。

## 判定理由
設計HTMLはレスポンスデータ表(3044-3046)・詳細設計のレスポンス表(3113)・サンプル(3065,3118-3125)・処理フロー(3103 「コード（200）・メッセージ・部門一覧をJSONで返す」)で一貫して、成功レスポンスが code=200・message="get sections success"・sections 配列を持つJSONオブジェクトであると定義している。sections.json を処理するハンドラは ec-cube-enterprise 内で MTGBuyer の SectionController のみ(rg -ln 'sections.json' src/ で1件)。その getSections() は array_map で section_id/name/code だけを詰めた $payload を作り、new JsonResponse($payload) で裸配列を返している(40,42,49行)。トップレベルの code/message/sections ラッパーを付けていない。反証として 'get sections success' を全体検索したが0件。'sections' => は Admin/Product/SectionController.php と PDFビルダーにあるが、いずれも別機能(部門管理画面・PDF)のTwig用データでありAPI応答ではない。よって設計が要求するレスポンス構造と実装のレスポンス構造が異なる実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3044-3046` — 設計要求（成功レスポンスのフィールド定義）

```html
                <tr><td>code</td><td>文字列</td><td>レスポンスコード、必ず200が入る</td></tr>
                <tr><td>message</td><td>文字列</td><td>API実行結果、必ずget sections successが入る</td></tr>
                <tr><td>sections</td><td>配列</td><td>部門の配列</td></tr>
```

## ec-cube-enterprise 実装
array_map で section_id/name/code のみを詰めた $payload を new JsonResponse($payload) で返す。code/message/sections ラッパーなし。
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/SectionController.php:40-49` — 実装（裸配列を返している）

```php
        $payload = array_map(
            static fn (MtbSection $s) => [
                'section_id' => $s->getId(),
                'name' => $s->getName(),
                'code' => $s->getCode(),
            ],
            $Sections
        );

        return new JsonResponse($payload);
```

## 不在確認コマンド

- `rg -n 'get sections success' /home/y-saito/Developments/ec-cube-enterprise`
- `rg -ln 'sections.json' /home/y-saito/Developments/ec-cube-enterprise/src`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を複数試みたが実装違いは維持。(1)別実装: sections.json ルートは MTGBuyer/V1/Admin/SectionController.php の1本のみ(rg 'sections.json|api_admin_sections' src で1件)。他の SectionController は Admin/Product 用で別機能。JsonResponse をラップする kernel.view/kernel.response Subscriber/Listener も App/MTGBuyer 配下に存在せず(EventSubscriber ディレクトリ無し)、同ディレクトリの BuyingController 等も 'cards' などの裸配列を返すだけで code/message エンベロープ層は無い。'get sections success' は全リポで0件。(2)引用確認: implEvidence の SectionController.php:38-49 は記載通り。findBy(['visible'=>true],['code'=>'ASC']) 取得後、array_map で section_id/name/code のみ詰めた $payload を new JsonResponse($payload) で返しており code/message/sections ラッパー無し(49行)。designEvidence 3044-3046 も 'code=必ず200','message=必ずget sections successが入る','sections=部門の配列' と一致。図形サンプル(3065)・詳細設計レスポンス表(3113)・サンプル(3118-3125)・処理フロー(3103 コード200・メッセージ・部門一覧をJSONで返す)まで一貫してエンベロープを要求。(3)設計側除外: 『本書で扱わないこと』(3088-3090)は固定価格部門取得と部門管理のみで応答エンベロープは対象外。3095の『要確認』はフィールド名 section_id/name/code と並び順に限定され、トップレベル code/message/sections には掛からない。(4)決定的裏付け: SectionControllerTest.php:110 が空時の応答を json_encode([]) すなわち裸の [] と assertSame しており、もし後段でエンベロープ整形されるなら失敗する。正常系(80-83)も array_column($response,'code') とトップレベル配列前提。よってエンベロープ欠落は確実。指摘は維持。
