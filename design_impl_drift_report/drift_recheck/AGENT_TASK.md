# 乖離指摘の再検証タスク

`drift_findings_list_filtered.tsv`（2026-07-06〜08 時点の設計vs実装 乖離監査結果）の各指摘について、
**ec-cube-enterprise の develop (da9c2ba276)** の実コードを読み、既に対応済みかを判定する。

## 入力
`drift_recheck/packets/<packetId>.json` の `findings[]`。各件のフィールド:
- `rowId` … 結果マージ用の安定ID（**必ずそのまま返すこと**）
- `設計期待値` / `実装実態` / `差分内容` … 監査時点で記録された乖離内容
- `実装参照` … 監査時点の実装該当箇所。`不在（探索範囲: ...）` の場合は未実装指摘で、探索範囲が示されている
- `設計書参照` … 正本設計書 HTML のパスとアンカー（`excel_to_html/output/...html#sheet-N:行番号`）

## 判定手順（各 finding ごと）
1. `実装参照` のファイルを **現在の develop で** 開き、監査時点の記述が今も存在するか確認する。
   行番号はズレている可能性があるため、行番号ではなくコード内容で追うこと。
2. `不在` 指摘の場合は、探索範囲のディレクトリを現在の develop で再探索し、
   該当機能の実装が新規に追加されていないか確認する（Grep/Glob を使う）。
3. 参照ファイル以外の場所で対応された可能性も必ず疑う。機能名・ルート名・翻訳キー・
   エンティティ名などで横断検索し、別クラス・別サービスへの実装移管がないか確認する。
4. 必要なら `設計書参照` の HTML を読み、設計期待値の原文を確認する。
   `python3 backlog_factcheck_harness.py sheet --book <4桁> --sheet-id sheet-N` が使える。

## 判定値（`status`）
- `対応済み` … 設計期待値を**完全に**満たす実装が現 develop に存在する。部分的な充足は含めない。
- `部分対応` … 一部は実装されたが、設計期待値の一部が依然未充足。
- `未対応` … 監査時点と実質同じ状態。

判断に迷う場合は `未対応` に倒す（取りこぼしより誤除外の方が有害なため）。

## 出力
`drift_recheck/results/<packetId>.json` に以下の形式で **Write ツールを使って書き込む**:

```json
{
  "packetId": "0202_01",
  "results": [
    {
      "rowId": 12,
      "status": "対応済み",
      "evidence": "`src/Eccube/Repository/DtbStockMoveTransferRepository.php:56` `->orderBy('s.id','DESC')` に是正済み。監査時点の `createDate DESC` 先行は削除されている。",
      "note": ""
    }
  ]
}
```

- `evidence` は **必ず `ファイルパス:行番号` と実際のコード引用**を含めること。引用のない判定は無効。
- `対応済み` と判定する場合は、設計期待値のどの要素がどのコードで満たされたかを具体的に書く。
- `未対応` の場合も、現 develop で該当コードが変わっていないことを1行で示す。
- `findings` の全件について結果を返すこと（欠落禁止）。

## 作業ディレクトリ（重要）
- 設計書リポジトリ: `/home/y-saito/Developments/hareruya-design-docs`
- **実装コード: `/tmp/claude-1000/-home-y-saito-Developments/7c5b906e-af70-4e7e-ae1c-8f982216692e/scratchpad/ee_develop_snapshot`**

実装の確認は **必ず上記のスナップショット配下** で行うこと。これは develop (da9c2ba276) を
`git archive` で展開した固定ツリーである。`.git` を持たないため、他の作業の git 操作で
消えたり内容が変わったりしない。

`git` コマンドによる履歴確認は不要。このスナップショットの中身が develop そのものである。
`git worktree` を新たに作らないこと（他のエージェントの作業ツリーを壊す）。

`/home/y-saito/Developments/ec-cube-enterprise` は **参照しないこと**。
そちらは利用者が作業中のチェックアウトで、develop とは別のブランチに切り替わっており、
src配下66ファイルが develop と相違する。ここを読むと develop に存在しない実装を
「対応済み」と誤判定する。

パケットの `実装参照` や `探索範囲` に `/home/y-saito/Developments/ec-cube-enterprise/...` という
絶対パスが書かれている場合は、先頭を上記スナップショットのパスに読み替えて開くこと。

### evidence に書くパス
スナップショットの絶対パスではなく **リポジトリ相対パス**（`src/Eccube/...` の形）で記載すること。
