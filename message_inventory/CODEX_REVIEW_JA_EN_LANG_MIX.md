# MESSAGE_LIST.tsv 言語取り違え・捏造の再調査＋codexレビュー結果

対象: `message_inventory/MESSAGE_LIST.tsv`（列: … / 画面上の文言 / 画面上の文言(英語) / … / 根拠(file:line)）
調査日: 2026-07-24 / レビュー: codex-cli 0.144.4 `codex exec --sandbox read-only`（独立再検証）

## 結論（Claude調査・codexレビュー ともに「事実」で一致）

ユーザー指摘は**事実**。MESSAGE_LIST.tsv の JA/EN 列はツールの「捏造ゼロ」ルールに違反している。

- **「画面上の文言」(JA)列に英語・未解決翻訳キーが混入**
- **「画面上の文言(英語)」(EN)列に日本語が混入（大半は JA 列の丸ごとコピー）**
- **コメントアウト行から抽出された非表示メッセージが混入**

## 件数（Claude / codex）

| 事象 | Claude(csv.DictReader, 1069行) | codex(1144行) |
|---|---|---|
| JA列に日本語なし（英語/キー、空・—除く） | 56 | 56 |
| └ 未解決翻訳キー(a.b.c形式) | 42（18種） | 42（18種） |
| └ 英語literal | 14 | 14 |
| EN列に日本語混入 | 552 | 526 |
| └ EN=JA 完全一致の日本語コピー | 540 | 514 |

※行数差はパース差（空行/ヘッダの扱い）。結論は同一。

## 決定的証拠（file:line）

- **EN列がJAコピーで、実英訳が存在する**（＝捏造の決定打）
  `M03-01-MSG-003`: TSVは JA=EN=`削除中...`。しかし実カタログに英訳が存在。
  - `messages.ja.yaml:2050` … `削除中...` / `messages.en.yaml:1929` … `Deleting...`
  - 本来 EN列は `Deleting...`。日本語コピーは誤り。
- **JA列に未解決キー（yaml非在）**
  `F08-02-MSG-001/002`: JA=EN=`front.otcbuy.error.assessment_only` 等。`| trans` 呼出はあるが messages.ja/en・validators.ja/en の4カタログに**定義0件**。
  - `Block/js/OtcBuy/otc_buy_register_customer_js.twig:24,39`
  `M04-13-MSG-016/018`: JA=`admin.stock.split_join.not_found`。4カタログ非在。
  - `Admin/Stock/StockSplitController.php:408,415`
  - JA列18種のキーは**全て4カタログで定義0件**＝「解決漏れ」ではなく「非在」。JA/ENとも「要ソース確認」にすべき。
- **コメントアウト行から抽出**
  `F06-25-MSG-001`: JA=EN=`waiting number get failed.`。
  - `Block/js/waiting_get_js.twig:180` は `// alert('waiting number get failed.');`＝実行されないコメント。画面文言として収録する根拠にならない。
- **英語literalの一部は実在（言語取り違え）**
  `M03-01-MSG-002`: `Failed` は `admin/Product/index.twig:175` に逐語存在。EN列としては妥当だが JA列に入れるのは言語取り違え。
- **EN=日本語コピーの例（英訳未確認）**
  `F06-13-MSG-001`: JA literal は `Block/js/identification_js.twig:132` に存在。英語ソース未確認なら EN列は「要ソース確認」とすべきで、日本語コピーは不可。

## 根本原因

- **EN列生成**: 英語カタログの探索・キー対応付けに失敗した際、**JA文言をフォールバックでコピー**している（`add_en_column.py` が読む `message_inventory.tsv` の `メッセージ内容(英語)` 列が、codex_en ドライバの解決失敗時に日本語で埋まっている）。messages.en.yaml は実在するため本来は英訳解決可能。
- **JA列生成**: `trans` キーをカタログ解決できないまま**キー生値**を採用（要ソース確認に落としていない）。
- **抽出**: コメント／無効コードを除外していない（`//`・Twig コメント）。

## 修正方針（codex提案＋本調査）

1. `trans` キーは ja/en カタログを厳密照合。**未定義なら JA・EN とも「要ソース確認」**（キー生値の混入を禁止）。
2. **EN列に日本語が出たらエラー扱い**。JAコピーを禁止し、英訳が取れなければ「要ソース確認」。実英訳は messages.en.yaml / validators.en.yaml / *.en.twig / JS英語literal から取得。
3. JS/Twig 抽出時に `//`・`/* */`・Twig コメント（`{# #}`）を除外。
4. 再生成後に検査（CI）: 「JA列に日本語なしの行」「EN列に日本語含有の行」「JA=EN の行」を検出したら fail（例外は明示許可制）。

---

## 是正結果（2026-07-24 完了 / codex 再レビュー済み）

### 根本原因の確定
翻訳ロードのパーサ（`lib_messages.load_translations`）が**スペース入り英語ソースキー**（`This value should not be blank.` 等）を読めず、EC-CUBE の yaml 上書き（`validators.ja.yaml:17 → 入力されていません。`）を取りこぼし、vendor xlf 値（`この値は空にできません。`）を誤採用していた。EN 逆引きも誤キーを拾っていた。

### 是正内容
- スペース入り英語キー対応のフルパーサでマップ再構築。`This value should not be blank.` → ja「入力されていません。」/ en「No value found.」を正しく解決。
- 単一候補: codex 特定の実キーで en を引き直し（**36件是正**）。
- ハードコード英語 alert（en 空欄）: en=ja を補完（**6件**）。
- codex 再レビュー（全24機能）の真の指摘を是正:
  - `M07-03-MSG-004/005/010`・`M04-08-MSG-012`（ハードコード日本語で英訳キー非在）: 捏造英語を除去し **「（英訳なし）」** へ。
  - `M07-03-MSG-015` 候補: `The field is empty.`→`No value found.`（誤キー form.type.select.notselect）、`Please enter with numbers.`→`Entry must be numbers.`（form_error.numeric_only）。
  - `M10-04-MSG-010`: `The field is empty.`→`No value found.`（NotBlank）。
- `sync_doc_tables.py` に英語列分岐（`if "英語" in h: return "メッセージ内容(英語)"`）を追加し、設計書表への ja 誤流入を防止。

### 最終検証（全成果物）
| 成果物 | EN列に日本語（英訳なし除く） |
|---|---|
| message_inventory.tsv（正本） | **0** |
| MESSAGE_LIST.tsv | **0** |
| MESSAGE_LIST.md | **0** |
| 設計書 functions/**/*.md（英語列） | **0** |

- JA列の純英語 **20件**は全て `alert('English')` のハードコード英語（twig/js 逐語）で、英語ロケールでも英語表示＝**正当（捏造ではない）**。en=ja とした。
- ハードコード日本語（英訳非在）は **「（英訳なし）」** と明示。日本語を英訳列に混入させず、かつ捏造もしない。
- `validate_messages.py`: 1316行 / 捏造検証1316件 / 非在0件 = **PASS**。
- codex 再レビュー（切詰め300字へ拡大し偽陽性排除後）: 真の言語混在・捏造 **残0**。

### 是正の分類方針（恒久ルール）
- 翻訳キー（英訳あり）→ en.yaml/xlf の**同一キーの英訳**（yaml 上書き優先）。
- ハードコード英語 → ja=en=英語（英語ロケールでも同一表示）。
- ハードコード日本語（英訳非在）→ en=**「（英訳なし）」**（英訳を創作しない）。
