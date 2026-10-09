### 指摘（A05-02 / IT-A05-02-015）
- 主張: 手順1でPOSTし、手順2で「ResponseFileには…printjobidを設定する」。
- 実際: 0505_sheet-4 L0025-L0026 は印刷結果XMLをAPIアクセス時に送信すると定め、L0034-L0036 は印刷結果XMLを必須のResponseFile引数としている。
- 判定: 成立しない前提・手順
- 修正案: ResponseFileのXMLを先に組み立て、そのXMLを付けてPOSTする順序へ直す。

### 指摘（A05-02 / IT-A05-02-016）
- 主張: 「/order/prints/status/printed」へPOSTしてブラウザ印刷フラグを確認する。
- 実際: 0505_sheet-4 L0014-L0016 は刷新後のPOST先を「/api/order/print/direct/{店舗ID}」と定める。
- 判定: 成立しない前提・手順
- 修正案: 店舗IDを付けた刷新後エンドポイントへ、ResponseFileを設定してPOSTする手順へ変更する。
