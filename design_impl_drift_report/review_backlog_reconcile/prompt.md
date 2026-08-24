# 敵対レビュー: 設計乖離の指摘862件が Backlog に登録済みかの突合

あなたは**突合の判定を反証する役**です。既定は疑う側に置いてください。

## 対象

- 指摘862件: /tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/daa20da2-4c71-4ce8-bca9-0f4802fa1423/scratchpad/findings_862.json
  各要素: 書 / 要求ID / シート名 / 判定 / 重要度 / 設計要件 / 実装実態 / 実装参照 / 根本原因
- Backlog課題395件: /tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/daa20da2-4c71-4ce8-bca9-0f4802fa1423/scratchpad/backlog_bugs.json
  各要素: key / summary / description / status / type
  （プロジェクト ECCUBE_HARERUYA、カテゴリ「不具合（バグ）」、状態が「完了」以外）

## 実装（判定の裏取りに使う）

/home/y-saito/Developments/ec-cube-enterprise （ee）

## やること

**指摘862件のうち、Backlog に同じ欠陥が登録済みのものを挙げてください。**

利用者の指示により、**一致も一部一致も除外**します。判定は次の3値です。

- `FULL_MATCH` … 同じ欠陥が登録済み
- `PARTIAL_MATCH` … 欠陥の一部が登録済み
- `NOT_REGISTERED` … Backlog に無い

**挙げるのは FULL_MATCH と PARTIAL_MATCH だけ**でかまいません。
NOT_REGISTERED は列挙不要です（数が多いため）。

## 突合のしかた

**件名だけで判断しないこと。** 集約チケットは件名が抽象的で、本文に個別の欠陥が並んでいます。
description を必ず読んでください（本文1,500字超の課題が123件あります）。

一致の根拠にできるもの:

- 実装ファイル名・クラス名・メソッド名が一致し、**同じ挙動の欠陥を述べている**
- 画面名・機能名と欠陥の内容（何がどうなる）が対応している
- 設計書の書番・シート名・要求IDが本文に書かれている

**一致と言えないもの:**

- 同じファイルを指すが**別の箇所・別の条件**の欠陥（例: 同じ一覧テンプレートの別の列）
- 同じ機能領域だが具体的な欠陥が違う
- Backlog側が「〜を確認する」という調査タスクで、欠陥の内容を特定していない

実装ファイル名で機械照合すると535件が候補になりますが、その大半は「同じファイルの別の欠陥」です。
**内容で判断してください。**

## 出力形式

一致が無ければ `NONE` の1語だけ。

一致ごとに次を書いてください。

```
要求ID:
判定: FULL_MATCH | PARTIAL_MATCH
課題キー: ECCUBE_HARERUYA-NNN（複数ならカンマ区切り）
根拠: 課題のどの記述と対応するか。**本文からの引用を含める**
```

**引用を伴わない一致は書かないでください。**
