---
name: hareruya-e2e-backlog-register
description: 晴れる屋の結合テストを E2E（Playwright）で開発環境に流して不合格になったケースを、Backlog の「結合テスト課題」に起票する。不合格の洗い出し、既存の課題との重複・まとめの判定、未実装・実装乖離リストと同じ決まりの本文（設計・新アプリ・ベース実装の抜き書き）、キャプチャの添付と本文への表示、台帳での二重登録の防止、結合試験項目表の備考への課題キーの反映までを行う。E2E の不合格の起票、起票の下書き、登録、台帳の整理を頼まれたときに使う。
---

# 晴れる屋 E2E 不合格の Backlog 起票

開発環境で流した E2E の判定（`e2e/review/judgements/<機能ID>.tsv`）のうち、不合格を Backlog に起票する。
道具は `e2e/tools/backlog_e2e_register.py`（下書きの検査・登録・台帳）。項目表への反映は `e2e/tools/sheet_writeback.py`（台帳の課題キーを備考に書く）。

## 依頼者の決定（2026-11-10〜11）

| 項目 | 値 |
|---|---|
| 起票するもの | 不合格は全部（実装差異も、正本の問題・設計書の食い違い・条件付きの不合格も） |
| 種別 | 結合テスト課題 |
| カテゴリ | 結合テスト_Ph1 ＋ 不具合_XXXX（該当機能。Backlog のカテゴリ名から選ぶ） |
| カスタム属性 | 不具合解析結果・重要度（下の決め方） |
| 優先度 | 中 |
| 課題名・本文・キャプチャ | 「未実装・実装乖離リスト」の起票と同じ決まり（スキル hareruya-backlog-drift-export の Output Contract） |
| 確認 | 下書きが決まりどおりで検査を通れば、確認を待たずに登録してよい。登録したら件数と課題キーを依頼者に報告する |
| 完了済みの既存の課題と同じ不具合 | 開け直さず、新しい課題で起票し、「関連」に前の課題キーを添える |
| 未完了の既存の課題と同じ不具合 | 起票しない（重複として台帳に既存の課題キーを書く） |

不具合解析結果の決め方:
- アプリが正本と違う（実装差異）→ 実装バグ
- 設計書の中で記述が食い違う → 設計バグ
- ケースの期待結果やシードの誤り（正本の問題）→ テスト設計バグ
- 正本の外の補いの上で落ちた（条件付き）、または実装の誤りと言い切れない → 保留

重要度の決め方（既存の起票と同じ。メモリ backlog-severity-bulk-update）:
- P1: 認可の不備、金額・ポイント・在庫・原価の整合が崩れる、外部連携データが欠ける
- P2: 迂回すれば業務が回る、入力できない
- P3: 文言・並び順・表示

## 手順

1. **洗い出し**: 開発環境で判定した不合格のうち、台帳（`e2e/review/backlog_e2e_ledger.tsv`）・保留（`pending.tsv`）・重複（`duplicates.tsv`）に無いものを一覧にする。
   - 対象は、エビデンスの `result.json` が「環境 E2E_ENV=dev」で、判定の「対象の実施日時」がいまのエビデンスと同じものだけ。
   - 一覧は `e2e/review/backlog_e2e/queue*.tsv`（E2EのテストID・項目表のテストID・区分・理由・記録）。
   - 項目表のテストIDは `integration_test/casegen/all_test_cases_id_map.tsv` で引く（E2E の cases/ のIDと番号がずれる）。
2. **1件ずつ調べる**（ほかの件の結論を流用しない）:
   - E2E の記録とエビデンス（`e2e/evidence/<機能ID>/<テストID>/` の evidence.md・画像・result.json）
   - 正本のケース（`integration_test/casegen/cases/<機能ID>_test_cases.tsv`）
   - 設計書（`excel_to_html/output/*.html`。Excel 由来の部分を優先。メモリ design-source-precedence）
   - 新しいアプリの該当コード（`/home/y-saito/Developments/ec-cube-enterprise`。ファイルと行の範囲つきの抜き書き）
   - ベース実装（`/home/y-saito/Developments/pf-eccube3` など。参照元は `genzai_source_attribution/`。無ければ「現行に該当なし（新規）」と探した範囲）
   - 既存の課題の重複: Backlog を読むだけで調べる（`design_impl_drift_report/lib_backlog.py` の `BacklogClient.from_environment(allow_write=False)`）。乖離監査の起票（種別 未実装・実装乖離リスト）と、ほかの方の結合テストの起票（カテゴリ 結合テスト_Ph1）の両方を見る。
3. **下書き**: 1件1ファイル `e2e/review/backlog_e2e/<E2EのテストID>.md`（形式は道具の冒頭の説明）。
   - 同じ原因の不合格は1件にまとめ、`grouped.tsv`（E2EのテストID・代表のE2EのテストID）に書く。
   - 根拠がそろわないもの（E2E 側の確かめ方の誤りが疑わしいなど）は `pending.tsv` に書き、起票しない。
4. **検査**: `python3 e2e/tools/backlog_e2e_register.py --list` と `python3 design_impl_drift_report/citation_audit/check_ticket_terms.py --dir e2e/review/backlog_e2e` を通す。
5. **登録**: `cd e2e && python3 tools/backlog_e2e_register.py --apply`（台帳に無い下書きを全部登録）。最初に型を変えたときは `--apply --id <テストID>` で1件だけ登録し、Backlog の画面で見え方を確かめてから残りを流す。
6. **台帳を仕上げる**: まとめた分（テストID・代表の課題キー・「まとめ先 <代表>」）と重複の分（テストID・既存の課題キー・「既存の課題」）を台帳に足す。これで項目表の備考に課題キーが出る。
7. **項目表へ反映**: スキル hareruya-e2e-case-evidence の流れで `e2e/tools/sheet_writeback.py` を流す（書き込む直前に最新のファイルを取り直し、変わっていないことを確かめてから上書き）。
8. コミットは、台帳と下書き（`e2e/review/backlog_e2e/`・`e2e/review/backlog_e2e_ledger.tsv`）を自分のファイルだけ指定して行う。プッシュは依頼者に言われたときだけ。

## 課題名・本文の決まり

- 課題名の頭は【実装乖離】【未実装】【一部実装】【要確認】の4語のどれか。正本や設計書の側の問題は【要確認】。そのあとは「<区分（管理画面は機能群、フロントは フロント_<群>）>_<画面名>_<症状>」。
- 本文は「# 基本情報【必須】」から始める。**先頭に「/* 記入例: … */」の行を書かない**（依頼者指示。道具も落とす）。
- 見出しは Output Contract どおり: `# 基本情報【必須】`／`# 再現手順【必須】`／`# 期待される挙動【必須】`／`# 現在の挙動【必須】`／`# 根拠`、最後に `# 関連`。
- 現在の挙動には、新しいアプリとベース実装の抜き書きを付ける。根拠には 設計・ec-cube-enterprise・ベース実装 の3つ。
- 本文では項目表のテストIDを主に書き、E2E のテストIDを括弧で添える。
- **「関連」にエビデンスの場所の行（`- エビデンス: e2e/evidence/…`）を書かない**（依頼者指示。道具も落とす）。エビデンスはキャプチャで示す。
- **キャプチャは添付し、本文の中にも表示する**（依頼者指示 2026-11-11）。道具が「# 根拠」の前に `キャプチャ:` と `![ファイル名][ファイル名]`（Backlog の Markdown の添付画像の表示）を置く。症状が分かる画像だけを選ぶ（真っ白・無関係の画像は選ばない）。合う画像が無ければ添付も表示も無し。
- 物理名（テーブル名・カラム名）は課題名・再現手順・期待される挙動に書かない（コードの抜き書きの中はよい）。資格情報（ケースに書かれたパスワードを含む）を書き写さない。

## 落とし穴

- **台帳を消さない。** Backlog の API に冪等性は無い。消して流すと全件が二重登録になる。
- 保存系の API は毎分60回まで。道具は1.5秒ずつ空けて送る。
- 開発環境と手元で落ち方が違うことがある。手元の判定の結論を流用せず、開発環境のエビデンスで書く。
- 登録後に本文を直したくなったら、Backlog 側を `BacklogClient.update_issue` で直す（手元の下書きを直しても反映されない）。
- Backlog の API キーは `~/.config/backlog/credentials` か環境変数 `BACKLOG_API_KEY`。

関連: スキル hareruya-backlog-drift-export（本文の決まり）・hareruya-backlog-issue-register（乖離監査の起票）・hareruya-e2e-case-evidence（E2E の流しと判定・項目表への書き戻し）
