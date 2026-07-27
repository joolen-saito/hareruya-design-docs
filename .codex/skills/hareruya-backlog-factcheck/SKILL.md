---
name: hareruya-backlog-factcheck
description: Fact-check Hareruya Backlog issues that report design-vs-implementation drift, by fetching the issue over the Backlog API, resolving the cited design spec to the canonical HTML sheet, verifying every source citation, and deciding 誤検出 (false positive) or 真の乖離. Use when asked whether a Backlog drift ticket is a false positive, when closing 未実装・実装乖離リスト tickets, or when a drift report needs verification before it is acted on.
---

# Hareruya Backlog 事実確認

`hareruya-backlog-drift-export` が所見を Backlog 起票用 Markdown に**出す**側なのに対し、本スキルは起票済みチケットを**取り込んで検証する**側。

## 判定の軸

判定するのは常に「**このチケットは誤検出か**」という命題。

| 判定 | 意味 | Backlog への反映 |
|---|---|---|
| `FALSE_POSITIVE` | 誤検出であることを確証できた | 状態=完了、不具合解析結果=誤検出（起票ミス）、根拠コメント |
| `SUSPECT` | 誤検出と言い切れない（真の乖離らしい／確証が持てない） | 状態=処理中、偽である根拠コメント |

**疑わしきは偽**。`FALSE_POSITIVE` は「設計書のどこに何と書いてあるか」を引用できて初めて出せる。実装を読んで「たぶん合っている」では足りない。判断に迷ったら `SUSPECT`。誤って完了にする損害のほうが、処理中に留める損害より大きい。

## 手順

```bash
cd /home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report
python3 backlog_factcheck_harness.py meta                     # 種別/状態/カスタム属性のID解決（初回のみ）
python3 backlog_factcheck_harness.py fetch                    # 未実装・実装乖離リスト × 未処理 を取得
python3 backlog_factcheck_harness.py show --issue <ISSUE-KEY> # 節分解・設計書解決・引用検証
```

`show` が出すもの:
- **設計書の解決** … 正本HTMLのパスと、機能名に一致するシート候補
- **引用の検証** … `実在` / `不在` / `範囲外` / `対象外`
- **起票後のコミット** … 引用の鮮度ヒント

読み方:
- `範囲外` … 起票後に実装が動いた強いシグナル。引用が古い可能性を疑う。
- `不在` … 引用の壊れとは限らない。「そのファイルが無い」こと自体が未実装指摘の裏付けである場合がある。
- `不在` も `範囲外` も、それだけでは誤検出の証明にならない。設計要求そのものを読むこと。

次に設計要求を読む。**巨大HTML（最大67MB）を直接 Read してはいけない**。必ずハーネス経由で該当シートだけを取り出す。

```bash
python3 backlog_factcheck_harness.py sheet --book 0212 --list
python3 backlog_factcheck_harness.py sheet --book 0212 --sheet-name "デッキ登録CSVアップロード"
python3 backlog_factcheck_harness.py sheet --book 0204 --grep "最大数を超える" --context 2
```

判定が固まったらコメント本文をファイルに書いて登録し、反映は dry-run で確認してから行う。

```bash
python3 backlog_factcheck_harness.py record --issue <KEY> --verdict FALSE_POSITIVE --comment-file /tmp/c.md
python3 backlog_factcheck_harness.py plan                    # 反映予定の確認（書き込まない）
python3 backlog_factcheck_harness.py apply --apply           # ここで初めて Backlog へ書き込む
```

`--apply` を付けない限り書き込みは起きない。`apply` の前に必ず利用者へ反映内容を提示して承認を得ること。

## 探索範囲の不変条件（最重要）

設計根拠は次の3系統がある。**A を必ず第一に当たる。**

| 系統 | 所在 | 性質 |
|---|---|---|
| **A（正本）** | `hareruya-design-docs/excel_to_html/output/<設計書名>.html` | 44冊。正本xlsx由来。**別添資料シートも全て含む** |
| B | `ec-cube-enterprise/.cursor/design/html/excel/{0203,0204}/sheets/*.html` | シート分割版。2冊のみ |
| C | `ec-cube-enterprise/.cursor/docs/MDfile/*.md` | Markdown要約版 |

**C だけを見て「資料が存在しない」と結論してはならない。** 過去に、設計書が参照する『商品スマレジ連携.xlsx』を C 配下でしか探さず「本監査の設計資料に存在しない」として判定不能にした誤答がある。同資料は A の `0204_基本設計仕様書(商品管理).html` に別添資料シートとして収録されていた。

設計本文に `〜.xlsx を参照のこと` とあれば、その別添資料シートを A から必ず引く。`sheet --list` で収録シート名を眺めれば「別添資料__」で始まるシートが見える。

## 設計文の読み方

1. **★ と無印** … 処理概要の `★` はカスタマイズ項目、無印は現行踏襲。**無印も要求である**。「★が付いていないから対象外」は誤り。
2. **要求の強度** … 「エラー」なのか「警告」なのか。既存の類似ロジックが警告扱いなら、それを呼ぶだけでは「エラーとする」要求を満たさない。
3. **表の列を見る** … 機能別の更新項目表などは、どの列に〇が付くかで結論が変わる。`sheet` は列をタブで保持するので、`商品編集` 列が空欄かどうかを必ず確認する。
4. **同じ要求の粒度違い** … 同一書籍に粗い記述と細かい記述が併存する。細かいほう（例:「商品名が更新された場合に」）が優先。粗いほう（例:「商品の更新処理がされたタイミングで」）を字義通りに取って乖離と断じない。

## 反証

`SUSPECT`（＝真の乖離らしい）と言う前に、実装が**別経路に存在しない**ことを確認する。ルート名・翻訳キー（`messages.ja.yaml`）・Twigブロック・FormType・EventSubscriber・Service・Command・JS・バッチ・CSV/PDF を横断検索する。日本語の要求はそのままでは grep できないので、ルート名／メソッド名／定数／カラム名へ翻案して探す。

逆に `FALSE_POSITIVE` と言う前には、チケットが指摘している具体的な条件分岐を実際に読む。「実装されている」ではなく「**設計が要求している条件と実装の発火条件が一致している**」ことを示す。

## コメント本文の様式

```markdown
【事実確認結果】誤検出（起票ミス）

■結論
<1〜2行>

■設計上の根拠
> <設計書からの引用>
（<設計書名> / <シート名> / <sheet-N>）

■実装との対応
- <実装の該当箇所 path:line> … <設計のどの条件と一致するか>

■判定
<なぜ乖離ではないか。指摘された事象自体は事実だが設計どおりである、等>

■付記
<本uidの対象外だが別途確認が必要な点があれば>
```

`SUSPECT` の場合は見出しを「【事実確認結果】誤検出とは判断できず」にし、`■偽である根拠` に「設計のこの記述を満たす実装が見つからない」「反証として検索した範囲」を書く。

## 主要ファイル

- `design_impl_drift_report/backlog_factcheck_harness.py` … CLI 本体
- `design_impl_drift_report/lib_backlog.py` … Backlog API v2 クライアント。書き込みは `allow_write=True` のときだけ
- `design_impl_drift_report/lib_design_doc.py` … 正本HTMLの解決・シート抽出・表を保持したテキスト化
- `design_impl_drift_report/factcheck_inbox/` … 取得した課題（`raw/` は gitignore）
- `design_impl_drift_report/factcheck_verdicts/` … 判定とコメント本文
- `references/PITFALLS.md` … 過去に判定を誤らせた具体例

## 認証

`~/.config/backlog/credentials`（`BACKLOG_SPACE` / `BACKLOG_API_KEY`、パーミッション600）を読む。環境変数があればそちらを優先。**キーをリポジトリに置かない。コマンドラインに平文で書かない。**
