# API 受注管理 — 店頭注文番号取得

## 業務ロジック

### 配列内の並び順

ピック済みの受注に紐づく注文番号を先頭側に、店頭注文番号札管理で登録した番号札を末尾側に並べた1つの配列にする。どちらも登録の識別子の昇順で並べる。

### 欠番の補完

ピック済みの件数と登録済みの番号札の件数の合計が画面表示の最大件数（25件）を超えるときだけ、販売完了の受注の注文番号も取得して欠番を補う。直前に加えた番号の次から対象の注文番号の手前までの連番がすべて販売完了であれば、その間の番号も配列に加える。最大件数を超えないときは補完しない。

## 入出力

### 失敗時の応答

| 種類 | 内容 |
|------|------|
| 失敗時出力 | 店舗IDを指定せずに呼び出したときは、注文番号の配列を返さない |

### 入出力: 永続化

本APIは業務データを更新しない。

## 表示メッセージ

本APIは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 配列内の並び順 | P3 | ec-cube:app/Customize/Controller/WaitingNumberController.php:100 |
| 欠番の補完 | P2 | ec-cube:app/Customize/Controller/WaitingNumberController.php:71 |
| 欠番の補完 | P2 | ec-cube:app/config/eccube/packages/eccube.yaml:86 |
| 失敗時の応答 | P2 | ec-cube:app/Customize/Controller/WaitingNumberController.php:57 |
