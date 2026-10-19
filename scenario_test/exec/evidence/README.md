# シナリオテスト証跡

テスト実施時に、テストIDごとのディレクトリをこの配下へ作成する。

例: `scenario_test/exec/evidence/STI-DECK-004-002/`

最低限、次を保存する。

- `before.png`: 操作前の対象キーと初期状態
- `after.png`: 操作後の対象キーと判定対象
- `result.txt`: 実施日時、実施者、入力実値、観測実値、合否、不合格理由
- API、CSV、帳票、メール、ログ、現物を扱う場合は、その応答・原本・写真

論理ID（`ST-*`）とfixtureが返した実ID、受注番号、emailなどの対応は、
`scenario_test/exec/test_result_template.tsv` の `論理ID` と `実ID・実値` に記録する。

認証トークン、パスワード、個人情報は証跡へ保存しない。
