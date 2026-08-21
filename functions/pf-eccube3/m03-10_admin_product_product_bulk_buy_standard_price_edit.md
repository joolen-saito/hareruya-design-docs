# 商品管理 — 買取・基準価格一括編集

## 業務ロジック

### 編集画面の対象

選択が空のときは編集画面を開かず、商品一覧へ戻る。戻り先は商品一覧で最後に表示していたページとする。

高額商品コードが設定された規格は、この画面の表示にも更新にも含めない。編集の行は、対象商品の商品IDと言語の組ごとに作る。行は商品IDの降順に並べ、同一商品の中では言語IDの昇順に並べる。

### 保存の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 送信済みかつ妥当か | 否なら1件も更新せず、編集画面を再表示してエラーを表示する |
| 2 | 行の良品（NM）規格が未指定または0 | 当該行を保存の対象から外す |
| 3 | 良品（NM）規格が実在するか | 無ければエラーを表示し、編集画面を再表示する |
| 4 | 商品に買取減額率が無く、入力買取が0以外かつ上限（10000）以下のとき、買取価格マスタに該当があるか | 無ければエラーを表示し、編集画面を再表示する |
| 5 | 上記を通過 | 価格履歴を追加し、同一商品・同一言語の通常規格すべての買取価格を更新する |

良品（NM）規格が実在しない行と、買取価格マスタに該当が無い行は、その行だけをエラーとして通知し、残りの行の処理は続ける。エラーにならなかった行の買取価格の更新と価格履歴の追加は、編集画面を再表示したあとも取り消されない。

### 買取価格の決め方

| 条件 | 買取価格 |
| --- | --- |
| 入力した買取価格(NM)が0 | 率による計算へ進む。率を掛けた結果を100円単位で切り上げるため、いずれの状態も0となる |
| 入力した買取価格(NM)が1以上かつ上限（10000）以下で、商品に買取減額率が無い | 買取価格マスタを、良品（NM）価格・状態・Foilやプロモに相当する区分で参照する。見つかればその価格、見つからなければ入力値を各規格の買取価格とする |
| 上記以外（高額帯、または買取減額率がある） | 入力値に状態ごとの率を掛け、100円単位で切り上げて各規格の買取価格とする。良品（NM）には率を掛けないため、入力値を100円単位で切り上げた額になる。率は商品の買取減額率を優先し、無ければ既定値を使う。既定値はFoilやプロモかどうかで別の値を持つが、買取減額率があるときはその区別なく同じ率を使う |

### 基準価格の更新

入力した基準価格が現在の値と同じ規格は、更新も価格履歴の追加も行わない。

### 価格履歴

買取価格の更新にあわせて、同一商品・同一言語の通常規格すべてについて価格履歴を追加する。この価格履歴には、販売価格の変更前後を記録しない。

### エラー時の扱い

| 事象 | 利用者へ見える結果 |
|------|---------------------|
| 検証に失敗 | 編集画面を再表示し、エラーを表示する |
| 良品（NM）規格が不正・削除済み | 編集画面を再表示し、規格が存在しない旨のエラーを表示する |
| 買取価格マスタに該当が無い（条件を満たす低額帯） | 編集画面を再表示し、買取価格が見つからない旨のエラーを表示する |
| 商品が未選択 | 商品一覧へ戻り、選択を促すメッセージを表示する |

エラーで編集画面を再表示するとき、入力した値は保持せず、登録済みの価格を表示する。

## 入出力

| 種類 | 内容 |
|------|------|
| 成功時出力 | 商品一覧へ戻り、完了のメッセージを表示する。一覧は直前の検索状態を引き継ぐ |
| 失敗時出力 | 編集画面の再表示とエラーメッセージ、または商品未選択のときは商品一覧へ戻りエラーメッセージ |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 保存を通過した商品について、同一商品・同一言語の通常規格すべての買取価格を更新する |
| 追加 | 同じ契機で価格履歴を追加する |

### 入出力: 外部連携

登録が完了したとき、対象商品の商品情報が更新されたことを支店システムへ通知する。通知に失敗しても画面の結果は完了のままとし、失敗した対象を連携エラーとして記録する。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-10-MSG-001 | 管理画面上部 | 1つ以上の商品を選択してください | 商品を選択せずに一括編集画面を開いたとき | 商品一覧画面に遷移する |
| M03-10-MSG-003 | 管理画面上部 | 登録が完了しました。 | 一括編集で価格を更新したとき | 商品一覧画面に遷移する |
| M03-10-MSG-002 | 管理画面上部 | ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。 ／ 整数で入力してください。 | 買取価格(NM)に基準価格(NM)を上回る金額を入力して「登録」ボタンを押下したとき | 登録処理を行わず、買取価格一括更新画面を再表示する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 編集画面の対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductController.php:859 |
| 編集画面の対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:519 |
| 編集画面の対象 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:559 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductClassController.php:788 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductClassController.php:830 |
| 保存の判定順序 | P1 | pf-eccube3:src/Eccube/EventListener/TransactionListener.php:107 |
| 買取価格の決め方 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1241 |
| 買取価格の決め方 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1283 |
| 基準価格の更新 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductClassController.php:739 |
| 価格履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:116 |
| 価格履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPriceHistoryRepository.php:135 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductClassController.php:812 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductClassController.php:819 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1244 |
| 入出力: 外部連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductClassController.php:849 |
| 入出力: 外部連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/BranchUpdateService.php:66 |
