### 1
- 機能: F04-02
- 種類: B
- 対象: F04-02_processes.tsv 初期表示時の受注作成
- 主張: 初期表示で受注を作る処理は、要因表の対象にない。
- 実際: 会員・登録済み非会員・未登録者で受注作成またはログイン誘導が分かれ、複数配送の設定と配送先の数でも結果が分かれる（`integration_test/casegen/combination/units/F04-02/design.txt:L0308`）。
- 修正案: 初期表示時の受注作成を処理に加え、結果を分ける状態と設定を要因化する。

### 2
- 機能: F04-02
- 種類: B
- 対象: F04-02_factors.tsv P1・P2 F03・F08
- 主張: 支払方法に影響する配送方法の要因は、同梱かどうかで足りる。
- 実際: 選んだ配送方法に紐づく「お支払い方法」を表示し、配送方法設定には支払方法の設定項目がある（`integration_test/casegen/combination/units/F04-02/design.txt:L0186-L0189`、`integration_test/casegen/combination/units/M10-06/design.txt:L0059-L0060`）。
- 修正案: 配送方法に紐づく支払方法の設定を、P1・P2 の要因に加える。

### 3
- 機能: F04-02
- 種類: B
- 対象: F04-02_factors.tsv P1
- 主張: 支払方法ごとの結果には手数料の設定値が登場するが、設定値自体は要因にない。
- 実際: 選んだ支払方法の手数料を受注へ設定し、その手数料は別機能で設定する（`integration_test/casegen/combination/units/F04-02/design.txt:L0314`、`integration_test/casegen/combination/units/M10-04/design.txt:L0048`）。
- 修正案: P1 に支払方法の手数料設定値を要因として加える。

### 4
- 機能: F04-02
- 種類: B
- 対象: F04-02_factors.tsv P5
- 主張: お届け先を選び直す処理の住所要因は、配送先の国だけである。
- 実際: 選び直した後に配送料を設定し直し、送料は配送方法の地域別設定値である（`integration_test/casegen/combination/units/F04-02/design.txt:L0317`、`integration_test/casegen/combination/units/M10-06/design.txt:L0063-L0066`）。
- 修正案: P5 に新しいお届け先の地域と、その地域の送料設定値を加える。

### 5
- 機能: F04-02
- 種類: A
- 対象: F04-02_factors.tsv F05「ポイントで全額支払う」
- 主張: 全額ポイント使用時の支払方法は「全額ポイント支払い」だけになる。
- 実際: 優先する Excel 由来の本文は EC の支払方法を6種と定め、全額ポイント使用時の既存ケースも6種を期待している（`integration_test/casegen/combination/units/F04-02/design.txt:L0249-L0250`、`integration_test/casegen/cases/F04-02_test_cases.tsv:44`）。「全額ポイント支払いだけ」は下位の現行仕様の記述である（`integration_test/casegen/combination/units/F04-02/design.txt:L0315`）。
- 修正案: F05 の全額ポイント使用時の結果を、Excel 本文に合わせて直す。

### 6
- 機能: F04-02
- 種類: A
- 対象: F04-02_factors.tsv F12「なし｜あり」
- 主張: 変更前のポイント使用量0と使用量ありを、P4・P5 の別の値として扱う。
- 実際: 配送方法を変えた場合も、お届け先を選び直した場合も、変更前の量によらずポイント使用量を0で再登録する（`integration_test/casegen/combination/units/F04-02/design.txt:L0312,L0317`）。
- 修正案: 結果が同じになる F12 の2値を統合し、P4・P5 の要因から外す。

### 7
- 機能: F04-02
- 種類: C
- 対象: F04-02_interactions.tsv P2 F05+F08
- 主張: 同梱と全額ポイント使用が重なったときの支払方法は、設計書が決めていない。
- 実際: 優先する Excel 本文は EC の支払方法を6種とし、同梱を選んだときは郵便振替・銀行振込だけに絞る（`integration_test/casegen/combination/units/F04-02/design.txt:L0249-L0250,L0204`）。
- 修正案: 下位の現行仕様に基づく「設計書が決めていない」判定を見直す。

### 8
- 機能: F04-02
- 種類: D
- 対象: F04-02_constraints.tsv P1 F04=各EC支払方法&F05=ポイントで全額支払う、P2 F05=ポイントで全額支払う&F08=同梱
- 主張: これらの組は「正解未定」である。
- 実際: Excel 本文は EC の支払方法6種を示し、同梱時はそのうち郵便振替・銀行振込に絞る（`integration_test/casegen/combination/units/F04-02/design.txt:L0249-L0250,L0204`）。全額ポイント使用後にコンビニ決済を選んで注文するケースもある（`integration_test/casegen/cases/F04-02_test_cases.tsv:92`）。
- 修正案: 全額ポイント使用を理由とする「正解未定」の制約を削除する。

### 9
- 機能: F04-02
- 種類: D
- 対象: F04-02_constraints.tsv P1・P2 F05=ポイントをためる
- 主張: 支店または店内アカウントと「ポイントをためる」の組は、作れる組として残る。
- 実際: 支店ではポイントを表示せず、店内アカウントではポイント系の項目を非表示にするため、その選択肢を操作できない（`integration_test/casegen/combination/units/F04-02/design.txt:L0240,L0243,L0257-L0260`）。
- 修正案: 該当組を「作れない」にするか、操作できない状態も表せる値に改める。

### 10
- 機能: F04-02
- 種類: C
- 対象: F04-02_interactions.tsv P6 F17+F18
- 主張: 30分超過と支払方法不一致が重なった場合の遷移先は決まらない。
- 実際: 優先する Excel 本文は、注文ボタン押下時に30分を経過していればカート画面へ遷移すると定める（`integration_test/casegen/combination/units/F04-02/design.txt:L0286-L0287`）。不一致時の注文エラーは下位の現行仕様にある（同 `L0327`）。
- 修正案: F17+F18 を、30分超過時はカート画面となる判定に直す。

### 11
- 機能: F04-02
- 種類: D
- 対象: F04-02_constraints.tsv P6 F17=30分を超える&F18=不一致
- 主張: 遷移先は「正解未定」である。
- 実際: 注文ボタン押下時に30分を経過していればカート画面へ遷移する（`integration_test/casegen/combination/units/F04-02/design.txt:L0286-L0287`）。
- 修正案: この「正解未定」制約を削除する。
