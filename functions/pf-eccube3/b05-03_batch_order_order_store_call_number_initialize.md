# バッチ 受注管理 — 店頭注文番号初期化

## 業務ロジック

### 対象が0件のときと再実行

対象が0件のときも、削除と採番カウンタの初期化を実行する。結果は、店頭注文番号が無い状態と、初期化済みの採番カウンタだけになる。

何度実行したときも結果は同じになる。冪等である。

### 実行の影響

このバッチは破壊的である。店頭注文番号と紐づく受注の対応は、いずれの場合もすべて失われる。実行した後は、過去に提示済みの整理番号から受注を引けなくなる。

失われるのは店頭注文番号だけである。受注そのものは残り、金額の再計算や集計は、いずれの場合も行わない。

### 起動できなかったときの扱い

コマンド名が未指定のとき、および対応するバッチが無い名前を指定したときは、初期化を行わずに終了する。店頭注文番号と採番カウンタは、いずれも変わらない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | コマンド名。引数は使わない。実行条件は特に無く、対象が0件でも実行できる。 |
| 成功時出力 | 正常に終わったときは、実行結果の通知を出さない。 |

## 表示メッセージ

この機能は、いずれの場合も画面のメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象が0件のときと再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/TruncateWaitingNumber.php:29-32 |
| 対象が0件のときと再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php:15-20 |
| 実行の影響 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php:18 |
| 実行の影響 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbWaitingNumber.dcm.yml:16-23 |
| 起動できなかったときの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/OrderBatch.php:45-49 |
