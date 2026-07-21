# a05-02_0505_sheet-4_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a05-02_0505_sheet-4_sheet.json#a05-02_0505_sheet-4_sheet-conformance-4734c8af59f4`
- 機能: A05-02 A05-02 注文印刷_該当受注のステータスを印刷済みに変更
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は印刷結果XMLの各印刷結果要素の成功/失敗(success)と失敗理由code(EX_BADPORT等)を参照してログ追記するカスタマイズを要求するが、実装は個別要素の success/code を一切参照しない。

## 判定理由
設計は『プリンタ側でエラーがあった場合、レスポンスデータの中にエラーコードが返ってくるのでログに追記する』(HTML 1164行)『既存は基本書式不備等はログするが、印刷結果の詳細を参照してエラー有無を確認していない』(1165-1166行)とし、印刷結果XMLは success(true/false)と失敗時 code(EX_BADPORT/EX_TIMEOUT 等)を含む(1182-1183,1193-1194,1224-1225行)ため詳細参照が改善要求。実装 UpdatePrintedOrderStatusAction は XMLパース失敗時に本文と『XMLパースエラー』を、ServerDirectPrint==='false' または count(ePOSPrint)<1 の場合に本文をログ出力するのみ(48-59行)。各 ePOSPrint/PrintResponse/response の success 属性・code 属性を読まず、foreach で printjobid から受注IDを取り出してステータス更新へ進む(78-101行)。PrintResponse・EX_BADPORT・code 属性の参照処理は src/Eccube 全体に存在しない(rg で該当なし)。要求された詳細エラー参照・code ログ追記が未実装。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1164-1166` — 設計要求(エラーcode詳細参照・ログ追記)

```html
            <p class="doc-p" style="--lv:1">★ プリンタ側でエラーがあった場合、レスポンスデータの中にエラーコードが返ってくるので、ログに追記する</p>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">※</span><span>基本書式(XML)を満たしていない、印刷結果の情報がない等、根本的な問題があった場合はログに追記する仕組みは既存にもあるが、</span></div>
            <p class="doc-p" style="--lv:3">印刷結果の詳細を参照してエラーの有無を確認していない</p>
```

## ec-cube-enterprise 実装
ServerDirectPrint と件数のみ判定
`ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:48-59` — 根本問題のみログ・詳細参照なし

```php
        $xml = @simplexml_load_string($responseFile);
        if ($xml === false) {
            $this->logger->error($responseFile);
            $this->logger->error('XMLパースエラー');

            return;
        }
        if ((string) $xml->ServerDirectPrint === 'false' || count($xml->ePOSPrint) < 1) {
            $this->logger->error($responseFile);

            return;
        }
```

`ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:78-90` — 各要素の success/code を見ず更新へ進む

```php
            foreach ($xml->ePOSPrint as $print) {
                $orderId = explode('_', (string) $print->Parameter->printjobid)[0];

                $Order = $this->orderRepository->find($orderId);
                if (!$Order) {
                    $this->logger->error("ステータス更新エラー：受注ID{$orderId}が存在しません。");

                    continue;
                }
                if ($Order->isBrowserPrintFlg()) {
                    $Order->setBrowserPrintFlg(false);
                } else {
                    $Order->setOrderStatus($pickingStatus);
```

## 不在確認コマンド

- `rg -n 'PrintResponse|EX_BADPORT|EX_TIMEOUT' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube`
- `rg -n 'success|->code|PrintResponse|->response' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。実装 UpdatePrintedOrderStatusAction を全読。XMLパース失敗時に responseFile と 'XMLパースエラー' を、$xml->ServerDirectPrint==='false' または count($xml->ePOSPrint)<1 の場合に responseFile をログ出力するのみ(48-59行)。foreach($xml->ePOSPrint as $print)(78行)では printjobid から受注IDを抽出しステータス更新へ進むだけで、各要素の PrintResponse/response の success 属性や失敗理由 code 属性を一切読まない。rg で src/Eccube 全体に 'EX_BADPORT' も 'PrintResponse' も0件、Service/Admin/Order 配下にも success/code 参照処理なしと確認。設計Excel(HTML1159,1164 ★『レスポンスデータの中にエラーコードが返ってくるのでログに追記』、1165-1166『印刷結果の詳細を参照してエラーの有無を確認していない』の改善要求)に対し、印刷結果詳細参照・codeログ追記は未実装。別Subscriber/Service/Command での実装も無し。指摘は維持。
