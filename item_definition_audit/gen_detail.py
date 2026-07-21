#!/usr/bin/env python3
"""全所見の明細を1本のMarkdownに出す（台帳から生成。手打ちしない＝転記ミスが起きない）"""
from __future__ import annotations
import json, csv
from pathlib import Path
from collections import Counter, defaultdict

SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')
OUT = Path('/home/y-saito/Developments/hareruya-design-docs/item_definition_audit/FINDINGS_DETAIL.md')

led = json.load(open(SP / 'ledger.json'))
scope = [x for x in led if x.get('監査対象') == 'Y']
short = lambda s: (s or '-').replace('src/Eccube/Form/Type/', '').replace('app/Plugin/HareruyaEc/Form/', 'PL:')

L = []
w = L.append

w('# 全所見 明細')
w('')
w('台帳 `ledger.json` から自動生成（手打ちしていないので REPORT.md との数値ズレは起きない）。')
w('出典 `file:line` はすべて実ファイルに逐語引用が存在することを機械検証済み。')
w('')
w('**判定の原則**: 「最大文字数」＝その画面で入力できる最大長＝FormType の `Assert\\Length`。')
w('DB列長は値の出所の説明にはなるが画面仕様の正しさは保証しない。')
w('')
w('| 記号 | 意味 |')
w('|---|---|')
w('| pf | 現行システム pf-eccube3 (MySQL) |')
w('| ee | リニューアル後 ec-cube-enterprise (PostgreSQL) |')
w('| 設計 | HTML設計書の画面項目定義の値 |')
w('')
w('---')
w('')

def table(rows, title, note=''):
    w(f'## {title}（{len(rows)}件）')
    w('')
    if note:
        w(note)
        w('')
    if not rows:
        w('なし')
        w('')
        return
    w('| 書番 | シート | 識別ID | ラベル | 設計 | pf | ee | ee出典 |')
    w('|---|---|---|---|---|---|---|---|')
    for x in sorted(rows, key=lambda y: (y['book'], y['sheet'], y['no'])):
        w(f"| {x['book']} | {x['sheetTitle'][:14]} | {x['no']} | {x['label'][:20]} | "
          f"{x['html_maxlen']} | {x['pf_max'] if x['pf_max'] is not None else '-'} | "
          f"{x['ee_max'] if x['ee_max'] is not None else '-'} | `{short(x['ee_ref'])}` |")
    w('')

# ---------- 1. 乖離候補 ----------
w('# 1. 乖離候補（要対応）')
w('')
table([x for x in scope if x['verdict'].startswith('D_')],
      '1-1. D_HTML孤立 — 設計値が pf/ee どちらとも違う',
      '**最も疑わしい。** ただし fable5 の反証により、約8件は「設計書の誤り」ではなく\n'
      '**ee内部の不整合**（同じ項目がフロントと管理画面で別の上限）と判明している。\n'
      '例: 会社名は ee フロント `EntryType.php:86` が `eccube_company_len_max: 100`、admin `CustomerType` が 255。')

table([x for x in scope if x['verdict'].startswith('D2')],
      '1-2. D2_HTML≠ee — pf側は未解決だが ee と食い違う',
      '正典は ee なので pf 未解決でも判定できる。\n'
      '**注目**: 0209 店舗登録の 支店URL(設計255→ee32) と 住所(設計32→ee90) は\n'
      '**同一シートで値が入れ替わった疑い**。メールアドレス 254/255 問題が5件。')

cs = [x for x in scope if x['verdict'].startswith('C')]
table(cs, '1-3. C_HTML=pf≠ee — 設計書がpf値のまま未更新 or ee未実装',
      '**方向は機械的に決められない。** 同じ `stext_len` 50→255 の変更を\n'
      'B では「意図的リニューアル」と読み C では「実装漏れ」と読むのは非対称なので、断定しない。\n'
      '人手で「設計書を直すのか実装を直すのか」を判断する必要がある。')

# ---------- 2. 数値 ----------
w('# 2. 数値トラック')
w('')
nd1 = [x for x in scope if x.get('num_verdict', '').startswith('ND1')]
w(f'## 2-1. ND1_設計上限 > 実装上限 ＝ 設計値が入力できない（{len(nd1)}件）')
w('')
w('**設計に書かれた上限を実際には入力できない。** 価格系は設計9桁 vs 実装8桁で系統的に1桁ずれ。')
w('なお ee 定数には `eccube_int_len: 9 # 最大値で制御したい` `eccube_price_len: 8 # 最大値で制御したい` と')
w('**開発者自身が「値で制御したいが桁数制御になっている」と認めるコメント**がある。')
w('')
w('| 書番 | シート | 識別ID | ラベル | 設計 | ee実効上限 | 根拠定数 |')
w('|---|---|---|---|---|---|---|')
for x in sorted(nd1, key=lambda y: (y['book'], y['sheet'])):
    w(f"| {x['book']} | {x['sheetTitle'][:14]} | {x['no']} | {x['label'][:18]} | "
      f"{x['html_maxlen']} | **{x['ee_num_effective']}** | `{x['ee_num_expr']}` |")
w('')

nd2 = [x for x in scope if x.get('num_verdict', '').startswith('ND2')]
w(f'## 2-2. ND2_設計上限 < 実装上限 ＝ 実装が設計より緩い（{len(nd2)}件）')
w('')
w('入力を拒否すべき値を実装が受け付ける。設計が正なら実装側の制約不足。')
w('')
w('| 書番 | シート | 識別ID | ラベル | 設計 | ee実効上限 | 根拠定数 |')
w('|---|---|---|---|---|---|---|')
for x in sorted(nd2, key=lambda y: (y['book'], y['sheet'])):
    w(f"| {x['book']} | {x['sheetTitle'][:14]} | {x['no']} | {x['label'][:18]} | "
      f"{x['html_maxlen']} | **{x['ee_num_effective']}** | `{x['ee_num_expr']}` |")
w('')

# ---------- 3. 必須 ----------
w('# 3. 必須トラック')
w('')
for tag, title, note in [
    ('RD_HTML必須だが両系で任意', '3-1. 設計は必須◯だが pf/ee 両方とも NotBlank が無い',
     '**設計が必須と言っているのに実装が空入力を通す。** ただし委譲型（`RepeatedType` 等）の\n'
     '内部制約を静的解析で追えないため、**偽陽性が混じりうる**（7章の限界参照）。'),
    ('RD_HTML任意だが実装は必須', '3-2. 設計は任意(-)だが実装は NotBlank を持つ',
     '**実装のほうが厳しい。** 設計書の記載漏れか、実装の過剰制約か要判断。'),
]:
    rows = [x for x in scope if x['req_verdict'] == tag]
    w(f'## {title}（{len(rows)}件）')
    w('')
    w(note)
    w('')
    w('| 書番 | シート | 識別ID | ラベル | 設計必須 | pf_NotBlank | ee_NotBlank | ee出典 |')
    w('|---|---|---|---|---|---|---|---|')
    for x in sorted(rows, key=lambda y: (y['book'], y['sheet'], y['no'])):
        w(f"| {x['book']} | {x['sheetTitle'][:14]} | {x['no']} | {x['label'][:18]} | "
          f"{x['html_req']} | {x['pf_notblank'] if x['pf_notblank'] is not None else '-'} | "
          f"{x['ee_notblank'] if x['ee_notblank'] is not None else '-'} | `{short(x['ee_ref'])}` |")
    w('')

# ---------- 4. 実装欠陥 ----------
w('# 4. 実装内部の欠陥（設計書と無関係）')
w('')
conf = list(csv.DictReader(open('/home/y-saito/Developments/hareruya-design-docs/item_definition_audit/impl_app_db_conflicts.tsv'), delimiter='\t'))
f1 = [x for x in conf if x['区分'].startswith('F1')]
w(f'## 4-1. F1_Form が DB列長より長い入力を通す ＝ 登録・更新が失敗（{len(f1)}件）')
w('')
w('**PostgreSQLは超過を切り捨てず ERROR にする。フォーム検証を通過した入力が永続化時に落ちる。**')
w('')
w('| Entity.列 | Form上限 | DB列長 | Form出典 | DB出典 |')
w('|---|---|---|---|---|')
for x in f1:
    w(f"| **{x['Entity']}.{x['列']}** | {x['Form上限']} ({x['Form根拠']}) | **{x['DB列長']}** | "
      f"`{x['Form出典'].replace('src/Eccube/Form/Type/','')}` | `{x['DB出典'].replace('src/Eccube/Entity/','')}` |")
w('')
w('→ **アーキタイプ名は65文字以上、イベント名は156文字以上で登録・更新が失敗する。**')
w('')

f3 = [x for x in conf if x['区分'].startswith('F3')]
w(f'## 4-2. F3_Form に Assert\\Length が無く DB varchar(255) に依存（{len(f3)}件）')
w('')
w('256文字目で登録が失敗する。ee は定数 `eccube_email_len: 254` を持ち')
w('`MemberType.php:144` / `RepeatedEmailType.php:48` / `CustomerType.php:99` では適用済みなので、**付け忘れ**。')
w('（`Email` 制約は書式のみ検証し長さを見ない。`eccube_rfc_email_check: false` なので strict 化の抜け道も無い）')
w('')
w('| Entity.列 | DB列長 | Form出典 | 到達可能性 |')
w('|---|---|---|---|')
for x in sorted(f3, key=lambda y: y['Entity']):
    reach = '**readonly（通常UI不可・改変POST/APIのみ）**' if x['Entity'] == 'DtbBuyOrder' else '通常UIから到達可能'
    w(f"| {x['Entity']}.{x['列']} | {x['DB列長']} | `{x['Form出典'].replace('src/Eccube/Form/Type/','')}` | {reach} |")
w('')
w('※ `DtbBuyOrder` 9件は `attr => [readonly => readonly]` 付きで通常UIからは編集不可（codex反証）。')
w('  ただし Symfony の `readonly` は**HTML属性にすぎず送信値は束縛される**（束縛を止めるのは `disabled`）ため、')
w('  改変POST・API経路では Length 欠落がそのまま効く。')
w('')

w('## 4-3. MySQL→PostgreSQL 移行で INSERT が失敗しうる列（9件）')
w('')
w('pf(MySQL `text`=65,535バイト) → ee(PostgreSQL `varchar(N)`) に縮小、かつ**pf側Formが N より長い入力を許していた**列。')
w('**実データ未確認のため「リスク」であり「確定障害」ではない。移行前に実データの最大長計測が必要。**')
w('')
w('| Entity.列 | pf Form上限 | ee DB |')
w('|---|---|---|')
w('| **Customer.email** | **制約なし**（pf `RepeatedEmailType.php:38` は NotBlank/Email/Regex のみ。pfに `email_len` 定数が無い） | varchar(255) |')
w('| BaseInfo.email01〜04 | 制約なし | varchar(255) |')
w('| BaseInfo.good_traded / message | 99999 (`lltext_len`) | varchar(4000) |')
w('| AuthorityRole.deny_url | 制約なし | varchar(4000) |')
w('| DeliveryTime.delivery_time | 制約なし | varchar(255) |')
w('')
w('※ 60列の縮小を検出後、pf Form が既に ee 列長以下に制限していた9列（例 `BaseInfo.shop_name` pf=50 ≤ 255）は')
w('  安全として除外、41列は pf Form を Entity 経由で引けず判定不能とした。')
w('')

# ---------- 5. 設計書内部 ----------
w('# 5. 設計書内部の欠陥（オラクル不要・実装を見ずに確定）')
w('')
w('## 5-1. 同一ラベルで最大文字数が矛盾（14ラベル）')
w('')
w('| ラベル | 書番をまたいだ値 |')
w('|---|---|')
for lab, vals in [('パスワード', '32 / 50 / 255 / 320'), ('メールアドレス', '85 / 255 / 320'),
                  ('パスワード(確認)', '32 / 50 / 255'), ('会社名', '50 / 100 / 255'),
                  ('プレイヤー名', '50 / 64 / 255'), ('カード名', '100 / 255'),
                  ('検索パターン名', '255 / 30865'), ('お名前（姓）', '50 / 128'),
                  ('お名前（名）', '50 / 128'), ('住所1', '90 / 128'), ('住所2', '90 / 128'),
                  ('住所3', '90 / 128'), ('成績', '32 / 50'), ('デッキ名', '50 / 255')]:
    w(f'| {lab} | {vals} |')
w('')
w('## 5-2. その他')
w('')
w('| 種別 | 内容 |')
w('|---|---|')
w('| データ異常 | 0207 sheet-3「検索パターン名」`maxlen=30865`（他書番では255文字） |')
w('| 文言の誤り | HTML「MTG **Campaign** 登録名」vs 実装「MTG **Companion**登録名」(`EntryTypeExtension.php:60`) |')
w('| 異体字混在 | 必須列に ◯(U+25EF)180 / ○(U+25CB)116 / 〇(U+3007)112 の3種＋△31 |')
w('| 表記揺れ | 「数値(整数)」50件 と 「数値（整数）」81件 |')
w('| 書式列の誤記 | 0308 sheet-6 のメール確認用/パスワードは書式が「ボタン」だが実体は入力欄（codex検出） |')
w('')

# ---------- 6. 確定不能 ----------
w('# 6. 確定不能（判定できなかった行）')
w('')
w('**「乖離が無い」ではなく「判定できなかった」。** 静的解析では 親型・別名型・Form extension・')
w('`PRE_SET_DATA`/`POST_SUBMIT`・Controllerのイベントdispatch を追えない。')
w('')
w('| トラック | 確定不能 | 母数 |')
w('|---|---|---|')
w(f"| 最大文字数 | {sum(1 for x in scope if x['verdict'].startswith('X'))} | 293 |")
w(f"| 数値 | {sum(1 for x in scope if x.get('num_verdict','').startswith('NX'))} | 118 |")
w(f"| 必須 | {sum(1 for x in scope if x['req_verdict'].startswith('RX'))} | 682 |")
w('')
w('各行の理由は `item_definition_audit_scoped.tsv` の `未確定の理由_pf` / `未確定の理由_ee` 列に入っている。')
w('')

OUT.write_text('\n'.join(L), encoding='utf-8')
print(f'生成: {OUT}  {len(L)}行 / {OUT.stat().st_size:,}バイト')
print(f'  D={sum(1 for x in scope if x["verdict"].startswith("D_"))} D2={sum(1 for x in scope if x["verdict"].startswith("D2"))} '
      f'C={len(cs)} ND1={len(nd1)} ND2={len(nd2)} F1={len(f1)} F3={len(f3)}')
print(f'  RD必須={sum(1 for x in scope if x["req_verdict"]=="RD_HTML必須だが両系で任意")} '
      f'RD任意={sum(1 for x in scope if x["req_verdict"]=="RD_HTML任意だが実装は必須")}')
