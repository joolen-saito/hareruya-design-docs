# 敵対レビュー R3：シナリオパターンのマトリクス（店頭受取受注管理・店頭買取・ネット買取）

あなたはレビュアー。著者（別のエージェント）が作った「業務条件×シナリオ」のマトリクスに、事実の誤りと抜けが無いかを調べる。ファイルは書き換えない（read-only）。

## 成果物（レビュー対象）
リポジトリ: /home/y-saito/Developments/hareruya-design-docs
業務ごとに scenario_test/coverage/scenario_pattern_matrix/<業務名>/ の下に次がある。対象の業務: 店頭受取受注管理・店頭買取・ネット買取
- factors.tsv … 業務条件と値。扱い（対象／適用外／他業務／他層／判断待ち）と出典の引用
- mapping.tsv … シナリオ（○）またはテストケース（△）が通る値と根拠の引用
- matrix.md … 上の2つから機械で作った表（判定：通っている／テストケースだけ／抜け／判断待ち／他層／適用外／他業務）
引用が出典・シナリオ・テストケースの行に文字どおりあることは scenario_test/tools/build_pattern_matrix.py で機械確認済み。引用の存在そのものは指摘しなくてよい。
基準は scenario_test/coverage/scenario_pattern_matrix/README.md。

## 正本（判断の根拠）
- 店頭受取受注管理: 業務フロー scenario_test/markdown/05_店頭受取受注管理.md／設計書 excel_to_html/output/ の 0203 受注管理機能・0304 フロント_注文・0505 API_受注管理・0405 バッチ_受注管理・0306 フロント_会員
- 店頭買取: 業務フロー scenario_test/markdown/06_店頭買取.md・07_店頭買取_tobe.md／設計書 excel_to_html/output/ の 0205 店頭買取・0601 その他_MTGバイヤー・0308 フロント・0506 API_店頭買取・0406 バッチ_店頭買取・0202 在庫管理
- ネット買取: 業務フロー scenario_test/markdown/14_ネット買取.md／設計書 excel_to_html/output/ の 0206 ネット買取・0305 フロント・0507 API_ネット買取・0601 その他_MTGバイヤー・0306 フロント_会員
- シナリオ: scenario_test/scenario/<接頭辞>*.md、テストケース: scenario_test/test_items/STI-…_test_items.md（コードブロック内のTSV。列は 機能名/テストID/I/FID/テスト観点/優先度/テスト項目名/前提条件/入力データ/操作手順/期待結果/確認対象）
- フェーズ2見送り: functions/phase2_candidates.tsv、integration_test/casegen/excluded_scope_cases.tsv。廃止: functions/superseded_candidates.tsv
- 結合テスト（他層の確認先）: integration_test/casegen/cases/<機能ID>_test_cases.tsv
- 通販受注管理の依頼者裁定: scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md（R0 支払はSPLINKSのクレジットカードだけ、は通販の裁定。店頭受取の店頭支払に及ぶかは未決＝判断待ち）

## 決まり（指摘の対象外）
- ○＝シナリオ本体で通る。△＝テストケースの一部で確かめる。
- 準備の定型文（前提条件の列、【準備確認】）、業務フローの原文をなぞっただけの文、「外した」と書かれた値、計算で当てはめた値、対象のデータを用意していないケースは、その値を通したことにしない。似た別の項目の取り違えも誤り（例：会員の都道府県≠配送先の国）。
- この成果物は抜けを示すまで。抜けを埋めるシナリオを足していないことは指摘しない。
- 業務フロー・設計書・裁定に根拠が無い条件（休日・繁忙期・業務量など）を足せという指摘はしない。
- 1画面・1機能の中の入力の違い（桁数・必須・形式・CSVの文字コード・空行）や画面内の自動切り替え・再計算は条件の抜けとして出さない。
- 物理名（テーブル名・カラム名・ルート名）を使えという指摘はしない。

## 前の巡の扱い
前の巡の指摘とその扱いは scenario_test/coverage/scenario_pattern_matrix/_review/groupA/dispositions_R1.md・scenario_test/coverage/scenario_pattern_matrix/_review/groupA/dispositions_R2.md にある。却下したものを新しい根拠なしに再び出さない。直した箇所が正しく直っているかは確かめてよい。新しい事実の指摘だけを出す。
今回は最終巡。まだ出ていない事実の誤りだけを出す。

## 重点観点
1. 条件の抜け：業務フローと設計書のうち、その業務の結果（状態・帳票・メール・在庫・金額・外部連携・経路）を変える条件・値で、factors.tsv に無いもの（根拠の file:line を必ず示す）。
2. 扱いの誤り：「適用外」「他業務」「他層」「判断待ち」が根拠どおりか（他層は備考の結合テストのケースが本当にその値を確かめているか）。逆に「対象」のうち成り立たないもの。
3. 対応の誤り（偽の○・△）：mapping.tsv の根拠を前後の文脈ごと読み、本当にその値を条件として通しているか。
4. 偽の抜け：matrix.md で「抜け」「テストケースだけ」の値のうち、実はシナリオ本体やテストケースで通しているもの（シナリオID・テストIDと引用を示す）。
5. シナリオそのものが、フェーズ2見送り・廃止・裁定で成り立たない値を前提にしていないか。

## 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（空行で区切る）。最大15件。重要な順。
業務: （業務名）
主張: （成果物のどこが、何と言っているか。値ID・シナリオID・テストIDで）
実際: （正本の file:line と、その文の引用）
判定: 事実の誤り／条件の抜け／偽の抜け／扱いの誤り／シナリオの前提の誤り のどれか
修正案: （factors.tsv / mapping.tsv をどう直すか）
