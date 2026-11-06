# レビュー依頼：通販のシナリオ一覧と、マトリクスへの追加（R1）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 成果物（レビュー対象）

1. `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md`：通販のシナリオ一覧（L2のUTS-01〜10）、対象外、受注ステータスの遷移の網羅、実装と設計書で確かめたこと、設計書との食い違い
2. `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/` のうち、今回足したもの
   - `fl_table.tsv` の因子S（支払方法 S1〜S3）
   - `prohibitions.tsv` の X19〜X22
   - `README.md` の「実装で確かめたこと（2026-11-03）」
   - `matrix.md`（`build_matrix.py` が作る。24テスト）
   matrix の他の部分はすでに3巡のレビューを終えている（`matrix/review/dispositions_R1〜R3.md`）。そこで扱った指摘は繰り返さない。

## シナリオの単位の決まり（成果物の制約）

- シナリオ1本は「起点の業務イベントから、業務として完了した状態になるまで」。担当者が替わっても切らない（お客様→通販チーム→外部システム→メール）。日をまたぐもの（予約の入荷待ちなど）は別の1本にする
- L1 業務領域 → L2 シナリオ → L3 バリエーション（組み合わせテストマトリクスで絞る）→ L4 ステップ
- 受注ステータスの遷移が、どれかのシナリオで必ず通るように割り振る
- 前提データ（会員・商品などのマスタ）はシナリオから外す
- 範囲：本店のオンラインショップの通販。非会員は買えない。支払はSPLINKSのクレジットカード決済と全額ポイント支払い（裁定R0と依頼者回答）。店頭受取・スムーズ店頭受取・支店・同梱は範囲外
- システムを触らない作業は「システムの外」として1行で書く
- 設計書の不備は報告に残すだけで、起票しない

## 正本（オラクル）

- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md`・`17_通販受注管理_tobe.md`
- 今のシナリオ（もとのシナリオ欄の照合用）：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-TSUHAN-*.md`
- 設計書HTML（Excel由来の部分を優先）：`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/` の `0203_基本設計仕様書(受注管理機能).html`・`0207_基本設計仕様書(会員管理機能).html`・`0304_基本設計仕様書(フロント_注文).html`・`0405_基本設計仕様書(バッチ_受注管理).html` ほか。巨大なので grep で引用文を探すこと
- 通販の裁定：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`
- 現行の実装：`/home/y-saito/Developments/pf-eccube3/`（`app/Plugin/HareruyaEc/`・`app/Plugin/SlnPayment/`）
- 新実装：`/home/y-saito/Developments/ec-cube-enterprise/`（`src/Eccube/`・`app/Plugin/SlnPayment42/`）
- 開発環境の設定：`/home/y-saito/Developments/ec-cube-enterprise/eccube_db_20260907.sql.gz`（PostgreSQLのダンプ。zcat と sed/grep で該当テーブルの COPY 部分だけ読む。決済代行の設定には認証情報が含まれるので、出力に書くのは必要な項目名と値（例: OperateId、cardOrderPreEnd）だけにし、ID・パスワード・鍵の値は絶対に出力しない）

## 重点観点

1. **シナリオの切り方**：上の決まりどおりか。担当者の替わり目で切っていないか。日をまたぐのに1本にしていないか。逆に、1本にすべきものを分けていないか
2. **抜け**：業務フロー16・17のパターン、今のSCN-TSUHAN-*、受注管理の設計書にある業務で、範囲内なのにどのシナリオにも入っていないもの
3. **受注ステータスの遷移**：遷移の網羅表が正本と合っているか。範囲内の遷移で、どのシナリオも通らないものは無いか。状態名が正本どおりか（裁定R4「出荷完了」など）
4. **「実装と設計書で確かめたこと」の結論**：クレジットカード決済の直後が入金済みであること、全額ポイント支払いの直後が注文受領であること、全額ポイントの取り消しで使用ポイントが戻ること、一部返金を会員管理のポイント付与で返すこと、Small packetを選べる販売制限、登録済みクレジットカード決済、International TA-Q-BIN／International ePacket の扱い。根拠のコード・設定・引用文が実在し、結論がそこから言えるか
5. **設計書との食い違い**：挙げた3件が本当に食い違いか。言い過ぎや取り違えは無いか
6. **因子Sと禁則X19〜X22**：正本どおりか。抜けている禁則（例：販売グループや会員の条件で支払方法が選べない組）は無いか。例外表（`exceptions.tsv`）の差し込み先の条件と矛盾しないか（クレジットカード決済が要る例外が全額ポイントの行に入っていないか）
7. **もとのシナリオ欄・業務フロー欄**：対応が正しいか

## 指摘しないもの

- 物理名（テーブル名・内部の識別子）を成果物に足す提案。成果物は論理名で書く規約
- 文体・言い回しの好み
- 範囲外の業務（店頭受取・支店・同梱・非会員・他の支払方法）
- matrix のレビュー済みの指摘の言い換え（入力欄ごとのエラー、絞り込み条件、カード言語の切り替えは却下済み）

## 出力形式

指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・シナリオID・因子ID/禁則ID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文。DBダンプは表名と該当行の必要な列だけ）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 / 切り方の誤り / 禁則の誤り のいずれか
修正案: 結論を先に1文で
