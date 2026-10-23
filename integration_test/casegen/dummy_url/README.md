# 実在しない試験用URLの置き換え（2026-10-21〜）

依頼者（2026-10-21）: 「結合テストケースにおいて、既存画像URLに https://example.test から始まるURLが記載されているが、これが実在しない。また、このURLを記載しておかないとテスト実施できないのでしょうか。実施可能なら余計な情報なので削除したい」

## 調べた結果

- URLの値そのものは消せない。例: IT-M14-04-029 は「既存の画像URLを持つ画像の行が、編集保存で消えない」（0208 業務ロジック「画像の行の扱い」）を確かめるケースで、
  カード登録CSVの「画像URL(英語)」は行ごとの必須項目（ec-cube-enterprise `CardCsv.php` の `getRequiredCsvHeaderKeys`・`checkRequiredHeaders`。空は取込エラー）。
- 実在は要らない。取込は文字列を保存するだけで、URLの形式チェックも画像の取得もしない。カード検索APIも保存値をそのまま返す（`MtbCardRepository.php` の `ci.url AS image_url`）。
- example.test のURL（メールアドレスを除く）は一覧の122件（15機能）にあった。カード画像が39件、それ以外が83件。

## 依頼者決定（2026-10-21）

| 対象 | 置き換え先 | 根拠 |
| --- | --- | --- |
| カード画像のURL（カード登録CSVの画像URL、DBに直接入れるカード画像、APIが返すカード画像URL）。A14-01・A14-03・A15-12・F06-16・F06-17・M14-01・M14-04・M15-06 | 設計書の記入例と同じ形の相対パス `img/goods/<元のパス>`。M14-04 の既存画像URLだけ `img/m1404/029-1.jpg`（同じシードの2行目 `img/m1404/029-2.jpg` に揃える） | 依頼者「1で統一して」（設計書の記入例の形に置き換える案） |
| それ以外（バナーの画像URL・リンク先URL、帯URL、GOOGLE MAP URL、デッキの出典URL・引用元URL、記事URL、サイトマップの配信の基点など） | 検証用ドメイン `https://replace-dev.hareruyamtg.com:8443`。サブドメインはパスの先頭へ移す（`https://cdn.example.test/x.png` → `https://replace-dev.hareruyamtg.com:8443/cdn/x.png`）。スキームはそのまま | 依頼者「https://replace-dev.hareruyamtg.com:8443/が検証用ドメインです」（設計書の記入例が本番ドメインのフルURLで、GOOGLE MAP URL はフルURL以外を入力チェックで弾くため） |
| 文字数の境界値（「https://example.test/」に a を N 文字連結して合計 M 文字） | 接頭が41文字（20文字増）になる分、a を20文字減らす。合計 M は変えない | M03-31・M03-33（帯URL 128/129字）、M13-14・M16-01（255/256字） |
| 変えないもの | スマレジの接続先（`smaregi-*.example.test`。外部システム）、メールアドレス（`…@example.test`）、example.test 以外の架空ドメイン（example.com・example.invalid・before.example など） | |

置き換え後の値は、どれも保存先の列の長さに収まる（帯URL 128字に対し最長56字、カード画像URL 128字に対し最長39字、バナー 255字に対し最長80字）。

## 仕組み

| ファイル | 役割 |
| --- | --- |
| `urlmap.py` | 置き換えの規則 `N(text)`。何度当てても同じ |
| `apply.py` | cases/ のケース表・シード表、外したケースの表（excluded_open・hold・scope）、precond の oracle_changes・step_changes に `N` を当てる。当てた列に example.test のURLが残っていれば誤りで止まる |
| `review/` | codex のレビュー |

- 前段の書き直し（seed_screen/apply.py・裁定・product_csv/apply.py・runnable/apply.py）は置き換え前の文で書かれているので、
  `datapattern/conflicts/apply_rulings.py` が最後に `apply.py` を呼ぶ。前段の照合は `N` を両側に当ててから比べる（流し直しで「上流で変わった」にならない）。
- 基線（precond/baseline/）は書き換えない。`precond/gate_precond.py` は用語の置き換え（terms.py）と同じく、基線に `N` を当ててから照合する。
  URLの置き換えだけでは oracle_changes・step_changes の宣言は要らない。
- 外したケースの表の「除外理由」「未確定の内容」と precond/open_preconditions.tsv は当てない（runnable が前提のキーをその文から作るため）。

## 流す順

merge → `seed_screen/apply.py` → `datapattern/conflicts/apply_rulings.py`（product_csv/apply.py・runnable/apply.py・これを呼ぶ）→ `exclude_open.py` → `exclude_scope.py` → `build_all_test_cases.py` → `precond/gate_precond.py --all`・`datapattern/gate_dp.py`。

2026-10-21: ケース164セル・シード219セル・外したケースの表127セル・宣言9セルを置き換えた。seed_screen から2回流して同じ結果に収束し、
変更前との差分がすべて `N` で説明できること、gate_precond・gate_dp の合格を確かめた。
codex のレビュー1巡（`review/R1_prompt.md` → `review/R1_out.txt`）は NONE。記事URL（A14-01-008）は保存先が64字で、置き換え後は59字に収まることも codex が確かめている。
