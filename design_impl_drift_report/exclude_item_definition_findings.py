# -*- coding: utf-8 -*-
"""drift_findings_list.tsv から「画面項目定義（必須/任意・最大文字数）」に関わる指摘を除外する。

突合先:
  item_definition_audit/FINDINGS_DETAIL.tsv          … 画面項目定義監査の所見明細(226件)
  item_definition_audit/item_definition_audit_scoped.tsv … 監査対象682行(設計書に必須◯/△ or 最大文字数が明記)
  item_definition_audit/item_definition_audit.tsv    … 全件台帳4,655行(監査対象=N を含む)

判定は drift TSV の物理行番号キーの決定表(DECISIONS)で固定し、突合証跡は機械付与する。
出力:
  drift_findings_list_filtered.tsv               … 除外後の残件
  drift_findings_excluded_item_definition.tsv     … 除外/除外候補の台帳(理由・突合証跡つき)
  drift_findings_excluded_uncovered.tsv           … 除外したが監査台帳に対応行が無い＝欠落注意分
"""
import csv, re, sys, os, collections

BASE = '/home/y-saito/Developments/hareruya-design-docs'
DRIFT = os.path.join(BASE, 'design_impl_drift_report/drift_findings_list.tsv')
FULL = os.path.join(BASE, 'item_definition_audit/item_definition_audit.tsv')
SCOPED = os.path.join(BASE, 'item_definition_audit/item_definition_audit_scoped.tsv')
DETAIL = os.path.join(BASE, 'item_definition_audit/FINDINGS_DETAIL.tsv')
OUTDIR = os.path.join(BASE, 'design_impl_drift_report')

# 行番号(TSVの物理行番号: ヘッダ=1) -> (除外区分, 除外理由)
EX = '除外'
CAND = '除外候補(要判断)'
DECISIONS = {
    # ---- 確定除外: 画面項目定義表の「必須/任意」不一致 ----
    430:  (EX, '必須/任意: 住所2の必須◯ vs 実装addr02にNotBlank無し'),
    637:  (EX, '必須/任意: 承認通知先(6-1/6-2)の条件付き必須(△)の不一致'),
    693:  (EX, '必須/任意: 1-4 承認通知先(メンバー選択)の必須◯ vs サーバ側未検証'),
    909:  (EX, '必須/任意: 郵便番号の必須解除(任意) vs 実装は必須'),
    919:  (EX, '必須/任意: 備考は任意 vs 実装は必須'),
    929:  (EX, '必須/任意: 備考は任意 vs 実装は必須'),
    934:  (EX, '必須/任意: 備考は任意 vs 実装は必須'),
    1030: (EX, '必須/任意: テンプレ名称は任意 vs 実装は必須'),
    1057: (EX, '必須/任意: 経理部門メールアドレスは任意 vs 実装required=true'),
    1170: (EX, '必須/任意: デッキ登録締切の条件付き必須(△)がNotBlank未実装'),
    1176: (EX, '必須/任意: 受付/デッキ/オンライン各時刻の条件付き必須(△)が未実装'),
    # ---- 確定除外: 画面項目定義表の「最大文字数/最大値」不一致 ----
    470:  (EX, '最大文字数: パスワード上限32 vs 実装50(下限も含む長さ制約)'),
    515:  (EX, '最大値: 並び順 0〜32767 の範囲検証が未実装'),
    522:  (EX, '最大値: 並び順 0〜32767 vs 実装0拒否/32768〜65535許容'),
    530:  (EX, '最大値: 並び順 0〜32767 が未実装'),
    613:  (EX, '最大値: 移動点数 1〜1,000,000 vs 実装99,999,999'),
    643:  (EX, '最大文字数: 商品名/カード名/商品コード 255文字超過エラーが未実装'),
    711:  (EX, '最大文字数: 送状No. 65535byte vs 実装255'),
    715:  (EX, '最大文字数: 送状No. 65535byte vs 実装255'),
    873:  (EX, '最大文字数: 買取番号 50 vs 実装255'),
    922:  (EX, '最大値: ポイント増減量 999999999 の検証が未実装'),
    958:  (EX, '最大文字数: 海外用郵便番号 100 vs 実装10'),
    971:  (EX, '最大値: ポイント還元率 4294967295 の検証が未実装'),
    991:  (EX, '最大文字数: 追加metaタグ 99999(lltext_len) vs 実装3000(ltext_len)'),
    1010: (EX, '最大文字数: 取り扱い商品/メッセージ 99999 vs 実装3000'),
    1011: (EX, '最大文字数: 送料無料条件 8桁(price_len)のLength未実装'),
    1023: (EX, '最大値: 消費税率 0〜100 のフォーム制約未実装'),
    1184: (EX, '最大文字数: 定員 最大8字 vs 実装9字'),
    1186: (EX, '最大文字数: 支払番号64/プレイヤー名255のmaxlength未実装'),
    1190: (EX, '最大文字数: 支払番号64/プレイヤー名255のmaxlength未実装'),
    1309: (EX, '最大文字数/最大値: フォーマット名64/コード10/並び順10000/説明65535のLength・Range不足'),
    487:  (EX, '必須/最大文字数: 必須(NotBlank)およびLength max 9 が未実装'),
    # ---- 除外候補: CSVフォーマット表の必須/最大文字数（画面項目定義表ではない同種属性） ----
    521:  (CAND, 'CSVフォーマット表: ID/並び順の数値扱い・必須'),
    527:  (CAND, 'CSVフォーマット表: 免税区分の必須/最大値2・値域'),
    528:  (CAND, 'CSVフォーマット表: MTGBuyer表示フラグの最大値1・値域'),
    532:  (CAND, 'CSVフォーマット表: 並び順の必須/最大値0〜32767'),
    543:  (CAND, 'CSVフォーマット表: 原価単価の必須'),
    551:  (CAND, 'CSVフォーマット表: 原価単価の必須/最大999999999'),
    558:  (CAND, 'CSVフォーマット表: 商品コードの最大11'),
    559:  (CAND, 'CSVフォーマット表: 基準価格の最大11 vs 実装9桁'),
    668:  (CAND, 'CSVフォーマット表: 在庫増減数の範囲 -99999999〜99999999'),
    669:  (CAND, 'CSVフォーマット表: 仕入単価の任意/条件付き必須'),
    689:  (CAND, 'CSVフォーマット表: 移動点数の必須/範囲0〜999999999'),
    694:  (CAND, 'CSVフォーマット表: 振替点数の必須/最大値0〜999999999'),
    699:  (CAND, 'CSVフォーマット表: 分割数・分割在庫数の最大値0〜999999999'),
    706:  (CAND, 'CSVフォーマット表: 結合数・結合元在庫数の最大値1〜999999999'),
    979:  (CAND, 'CSVフォーマット表: 海外郵便番号の最大100 vs 実装10'),
    1271: (CAND, 'CSVフォーマット表: 最大文字数・数値制約の検証欠落'),
    # ---- 除外候補: 必須/最大文字数を含むが他要求と混在（分割しないと片方が落ちる） ----
    452:  (CAND, '混在: 入力欄の必須/最大50・最低12だが主因は専用画面(Controller/Form/Twig)不在'),
    635:  (CAND, '混在: 結合数の最大値1〜99999999 ＋ 在庫数超過エラー(業務ルール)'),
    695:  (CAND, '混在: 店舗の必須 ＋ M11-03編集可能店舗の権限制御'),
    696:  (CAND, '混在: 承認通知先の必須 ＋ 承認担当者へのメール通知'),
    765:  (CAND, '混在: 店舗選択の必須 ＋ 初期値/全店選択肢/OR条件'),
    910:  (CAND, '混在: 住所1・2の長さ上限だが判定基準がSJIS換算byte（監査は文字数Length基準）'),
    956:  (CAND, '混在: 件名の最大長が「メール作成フォームの確認値に準ずる」の相対参照'),
    1007: (CAND, '混在: 必須/任意の不一致 ＋ 郵便番号・電話の分割入力形状'),
    1029: (CAND, '混在: テンプレ選択の必須 ＋ 名称昇順の並び'),
    1038: (CAND, '混在: 最大値65536 ＋ 表示ラベル「本文」vs「テキスト」'),
    1054: (CAND, '混在: 任意/初期値15 ＋ 下限0以上（監査は最大値トラックのみ）'),
    1152: (CAND, '混在: イベント名・略称の最大50文字 ＋ 語ごとAND/略称4列OR検索ロジック'),
    1255: (CAND, '混在: 複合キーワードの最大長50 ＋ 空白/カンマ分割AND検索ロジック'),
    1362: (CAND, '混在: NotBlank/最大長32/表示順範囲だが主因は専用FormType・Controller不在'),
}


def read_tsv(p):
    with open(p, encoding='utf-8', newline='') as f:
        r = csv.DictReader(f, delimiter='\t')
        return r.fieldnames, list(r)

dfields, drift = read_tsv(DRIFT)
_, full = read_tsv(FULL)
_, detail = read_tsv(DETAIL)

# --- drift TSV の物理行番号（埋め込み改行があっても崩れないよう数え直す） ---
with open(DRIFT, encoding='utf-8', newline='') as f:
    rdr = csv.reader(f, delimiter='\t')
    line_nums = [rdr.line_num for _ in rdr]
rec_line = line_nums[1:]
assert len(rec_line) == len(drift), (len(rec_line), len(drift))

# --- 書番/シートID の抽出 ---
sho_pat = re.compile(r'(\d{4})_[^#\s]*?\.html(?:#sheet-(\d+))?')
def doc_of(r):
    for col in ('設計書参照', '設計期待値', '実装参照'):
        m = sho_pat.search(r.get(col) or '')
        if m:
            return m.group(1), ('sheet-' + m.group(2)) if m.group(2) else ''
    return '', ''

# --- ラベル照合（全角/括弧/区切りを畳んで正規化） ---
Z = str.maketrans('（）［］　〇◯／～', '()[] ○()~')
def norm(s):
    s = (s or '').translate(Z)
    return re.sub(r'[()\[\]\s・,、/|｜:：.。]+', '', s).lower()

def label_hit(label, text_n):
    ln = norm(label)
    if len(ln) < 2:
        return False
    if ln in text_n:
        return True
    # 長いラベルは前半一致も許容（設計書ラベルは複数項目の連結表記があるため）
    return len(ln) >= 8 and ln[:max(4, len(ln) // 2)] in text_n

full_by_doc, full_sheets = {}, set()
for r in full:
    full_by_doc.setdefault(r['書番'], []).append(r)
    full_sheets.add((r['書番'], r['シートID']))
detail_by_doc = {}
for r in detail:
    detail_by_doc.setdefault(r['書番'], []).append(r)

A_OK   = 'A_突合OK（監査対象Y＝監査済み）'
N_OUT  = 'N_台帳にあるが監査対象外（設計書の項目表に必須/最大の記載なし）'
C_ITEM = 'C_台帳に該当項目なし'
C_SHT  = 'C_台帳に該当シートなし'
C_DOC  = 'C_台帳に該当書番なし'

def match_evidence(r):
    doc, sheet = doc_of(r)
    text_n = norm(' '.join((r.get(c) or '') for c in ('設計期待値', '差分内容', '実装実態')))
    hits_y, hits_n, hits_d = [], [], []
    for a in full_by_doc.get(doc, []):
        if sheet and a['シートID'] != sheet:
            continue
        if not label_hit(a['ラベル'], text_n):
            continue
        s = '%s/%s/%s [必須=%s 最大=%s]' % (a['シートID'], a['識別ID'], a['ラベル'],
                                            a['必須'] or '-', a['最大文字数または最大値'] or '-')
        if a['監査対象'] == 'Y':
            hits_y.append(s + ' 判定必須=%s 判定最大=%s' % (a['判定_必須'], a['判定_最大文字数']))
        else:
            hits_n.append(s + ' 書式=%s' % (a['書式・制限'] or '-'))
    for d in detail_by_doc.get(doc, []):
        if label_hit(d['項目'], text_n):
            hits_d.append('%s/%s/%s [%s]' % (d['シート'] or '-', d['識別ID'], d['項目'], d['セクション']))
    if hits_y:
        state = A_OK
    elif hits_n:
        state = N_OUT
    elif not doc:
        state = C_DOC
    elif doc not in full_by_doc:
        state = C_DOC
    elif sheet and (doc, sheet) not in full_sheets:
        state = C_SHT
    else:
        state = C_ITEM
    return doc, sheet, state, hits_y, hits_n, hits_d

REQ_MARK = set('○◯〇')
def conflict_note(r, hits_y):
    """drift が読んだ設計値と監査台帳が読んだ設計値の食い違いを機械検出"""
    txt = r.get('設計期待値') or ''   # drift が「設計はこうだ」と読んだ内容のみを対象にする
    ledger_req = set()
    for h in hits_y:
        m = re.search(r'必須=(.)', h)
        if m:
            ledger_req.add(m.group(1))
    if not ledger_req:
        return '－'
    if ('任意' in txt) and (ledger_req & REQ_MARK) and '必須' not in txt:
        return '要確認: driftは設計「任意」、監査台帳は設計「必須○」と読んでいる（同一シート内の別表を見ている可能性）'
    if re.search(r'必須(と|で|の|化|◯|○|〇|検証|入力|項目とする|とする)', txt) and ledger_req == {'-'}:
        return '要確認: driftは設計「必須」、監査台帳は設計「任意(-)」と読んでいる'
    return '－'

# 除外レベル: strict=突合OKのみ / content=画面項目定義の内容で判定した全件 / all=CSV・混在も含む
LEVEL = (sys.argv[1] if len(sys.argv) > 1 else 'strict')
assert LEVEL in ('strict', 'content', 'all'), LEVEL
GRADE_OF = {'A': 'A_突合OK(監査台帳に判定済み項目あり)',
            'B': 'B_内容は画面項目定義だが監査台帳に判定行なし',
            'C': 'C_CSVフォーマット表/他要求と混在'}
DROP = {'strict': {'A'}, 'content': {'A', 'B'}, 'all': {'A', 'B', 'C'}}[LEVEL]

ex_rows, keep_rows, seen = [], [], set()
for idx, r in enumerate(drift):
    ln = rec_line[idx]
    dec = DECISIONS.get(ln)
    if dec:
        seen.add(ln)
        kind, reason = dec
        doc, sheet, state, hy, hn, hd = match_evidence(r)
        rec = dict(r)
        rec['除外区分'] = kind
        rec['除外理由'] = reason
        rec['突合状態'] = state
        rec['突合_書番/シート'] = ('%s %s' % (doc, sheet)).strip()
        rec['突合_監査済み項目(監査対象Y)'] = ' ; '.join(hy[:4]) or '－'
        rec['突合_監査対象外項目(N)'] = ' ; '.join(hn[:4]) or '－'
        rec['突合_FINDINGS_DETAIL'] = ' ; '.join(hd[:4]) or '－'
        rec['設計値の食い違い'] = conflict_note(r, hy)
        g = 'C' if kind == CAND else ('A' if state == A_OK else 'B')
        rec['除外グレード'] = GRADE_OF[g]
        rec['drift行番号'] = ln
        ex_rows.append(rec)
        if g in DROP:
            continue
    keep_rows.append(r)

missing = set(DECISIONS) - seen
if missing:
    print('WARN 決定表の未消化行:', sorted(missing), file=sys.stderr)

exfields = dfields + ['除外グレード', '除外区分', '除外理由', '突合状態', '突合_書番/シート',
                      '突合_監査済み項目(監査対象Y)', '突合_監査対象外項目(N)',
                      '突合_FINDINGS_DETAIL', '設計値の食い違い', 'drift行番号']

def write(path, fields, rows):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t',
                           quoting=csv.QUOTE_MINIMAL, lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

def g_of(r):
    return r['除外グレード'][0]

write(os.path.join(OUTDIR, 'drift_findings_list_filtered.tsv'), dfields, keep_rows)
write(os.path.join(OUTDIR, 'drift_findings_excluded_item_definition.tsv'), exfields, ex_rows)
write(os.path.join(OUTDIR, 'drift_findings_excluded_uncovered.tsv'), exfields,
      [r for r in ex_rows if g_of(r) == 'B'])

cnt = collections.Counter(g_of(r) for r in ex_rows)
print('除外レベル = %s  （除外グレード %s を除去）' % (LEVEL, ','.join(sorted(DROP))))
print('drift 全件    : %d' % len(drift))
for g in 'ABC':
    print('  %-42s %3d  %s' % (GRADE_OF[g], cnt[g], '→除外' if g in DROP else '→残置'))
print('filtered 残件 : %d' % len(keep_rows))
print('--- 突合状態の内訳 ---')
for g in 'ABC':
    for k, v in sorted(collections.Counter(r['突合状態'] for r in ex_rows if g_of(r) == g).items()):
        print('  %s | %-52s %d' % (g, k, v))
print('FINDINGS_DETAIL に対応所見あり: %d / %d'
      % (sum(1 for r in ex_rows if r['突合_FINDINGS_DETAIL'] != '－'), len(ex_rows)))
conf = [r for r in ex_rows if r['設計値の食い違い'] != '－']
print('--- 設計値の読みが両監査で食い違う行: %d ---' % len(conf))
for r in conf:
    print('  #%s %s %s | %s' % (r['drift行番号'], r['機能No'], r['突合_書番/シート'], r['設計値の食い違い']))
