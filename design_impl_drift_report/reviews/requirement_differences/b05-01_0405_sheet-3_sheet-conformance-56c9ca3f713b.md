# b05-01_0405_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-01_0405_sheet-3_sheet.json#b05-01_0405_sheet-3_sheet-conformance-56c9ca3f713b`
- 機能: B05-01 B05-01 注文番号登録
- 観点: ⑦要求網羅・実装違い

## 要旨
スマレジ連携対象の注文日時条件が設計と逆方向で、30分前以降ではなく30分前より古い注文を抽出している。

## 判定理由
設計はスマレジ連携対象を『バッチ起動から30分前以降の注文』（注文日時 = バッチ駆動時間から30分前まで、すなわち直近30分の注文 order_date >= now-30min）と定めている（design line 945, 984, 991）。実装では OtcOrderSmaregiPostCommand が now->modify('-30 minutes') を targetDateTime として渡し（Command line 48-51）、OrderRepository::findTargetOrdersForSmaregiPost が `o.order_date < :targetDateTime` で抽出する（Repository line 1862）。これは『30分前より古い注文』を選ぶ条件であり、設計の『30分前以降』とは対象期間が逆。下限も無いため直近30分の窓ではなく古い未連携注文全体が対象になる。設計意図（line 942-944: 再連携バッチ不要化のため直近注文を対象化）とも矛盾する。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:984-991` — 設計要求

```html
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>バッチ起動から30分前以降の注文</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>スマレジ店舗IDとスマレジ店舗コードが指定済みの店舗の注文</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>スマレジ連携済みフラグが立っていない</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>スマレジ在庫連携済みフラグが立っていない</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">★</span><span>注文ステータスが「注文受領」「入金待ち」「入金済み」「ピック中」「ピック済み」</span></div>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ検索条件</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">項目名　条件　備考</h3>
            <p class="doc-p" style="--lv:0">注文データ.注文日時　バッチ駆動時間からバッチ駆動時間より30分前</p>
```

## ec-cube-enterprise 実装
now-30分をtargetDateTimeとして渡す
`ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:47-51` — 実装(コマンド)

```php
            // 現在時刻から30分前の時刻を取得
            $now = new \DateTime();
            $thirtyMinutesAgo = $now->modify('-30 minutes');

            $this->smaregiOtcOrderPostAction->handle($thirtyMinutesAgo);
```

order_dateが30分前より古い注文を抽出
`ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1858-1862` — 実装(抽出クエリ)

```php
    public function findTargetOrdersForSmaregiPost(\DateTime $targetDateTime): array
    {
        $qb = $this->createQueryBuilder('o');
        $qb->select('o, bi')
            ->where('o.order_date < :targetDateTime')
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗、指摘維持。OrderRepository.php:1862 は確かに `o.order_date < :targetDateTime` であり、docblock 1847 も『注文日時 = 指定日時以前』と明記。Command.php:48-51 で targetDateTime = now->modify('-30 minutes')。よって抽出は order_date < (now-30分) = 30分より古い注文。設計 line 945/984『30分前以降の注文』および line 991『バッチ駆動時間からバッチ駆動時間より30分前』は order_date >= now-30分（直近30分窓）を要求しており条件は真逆。別実装の探索(rg findTargetOrdersForSmaregiPost / OtcOrderSmaregiPost / 30 minutes)でも該当パスは Command→PostAction→Repository の1本のみで代替ルートなし。設計側にPh2/対象外/現行踏襲の除外注記もなし（line 942-944 はむしろ直近注文対象化の意図を補強）。
