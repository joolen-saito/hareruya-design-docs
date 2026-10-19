import re,sys
sys.path.insert(0,'work/B14')
from gen33 import rows,P_RE,C_RE
CAT='サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）'
QCCAT='QC連携カテゴリのID（カテゴリ登録/編集画面の一覧でその行のID欄に表示された値）'
UPL='グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する'
QP=re.compile(r'^管理画面の商品管理＞商品登録で、商品名\(日\)と商品名\(英\)に「(.+?)」、商品カテゴリに「QC連携カテゴリ」、購入グループに「QC連携購入グループ」を選び、サイズ1、重量1、販売制限数5を入れ、割引率に「割引率A」を選び、商品公開ステータスに公開、支店の商品公開ステータスに公開を選んで「商品を登録」ボタンを押す$')
Q2=re.compile(r'^登録後の画面の「商品ID」に表示された番号を控える（(〔.+?〕)）$')
Q3=re.compile(r'^その商品の「規格設定」ボタンから商品規格一覧を開いて「新規登録」を押し、商品規格登録編集画面で商品コードに「(.+?)」、言語に日本語、状態にNM、販売種別に「販売種別A」、高額商品コードに「(.+?)」、セールフラグ(は?チェックなし|にチェックを入れ)、基準価格\(円\)に「(\d+)」、販売価格\(円\)に「(\d+)」、買取価格\(円\)に「(\d+)」、スマレジ連携フラグは既定の「連携しない」のまま、部門に「ショーケース」、公開状態に「公開」を選んで「商品規格を登録」ボタンを押す$')
def csv_sentence(code,name,tag,base,buy,extra='',cat=CAT,group='既存の購入グループの名称'):
    t='・タグ(ID)は1（タグ登録の「取込前タグ」のID）' if tag else ''
    return (f'{UPL}（商品IDは空・商品コードは「{code}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「{name}」・商品名(英)は「{name}」・サイズ1・重量1・商品カテゴリ(ID)は{cat}・購入グループ名称は{group}{t}{extra}・基準価格{base}・販売価格{base}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）')
def search(code,lp):
    return f'グッズ商品は状態ニアミントの規格が1件作られる。商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（{lp}）'
OPEN='商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で'
def edit(m,code_to_set=None):
    d=m.groupdict()
    s=OPEN
    if code_to_set: s+=f'商品コードに{code_to_set}、'
    s+='セールフラグにチェックを入れ、' if d['sale']=='入れ' else 'セールフラグにチェックを入れず、'
    s+=f"基準価格(円)に{d['base']}、販売価格(円)に{d['sell']}、買取価格(円)に{d['buy']}を入れ、"
    if d['belt']: s+=f"帯URLに{d['belt']}を入れ、"
    s+='高額商品コードに商品コードと同じ値を入れ、' if d['hpc'].startswith('に') else '高額商品コードは空のままにし、'
    s+=f"スマレジ連携フラグは「連携しない」のまま、部門は選択肢の先頭を選び、公開ステータスは「公開」のままにして「商品規格を登録」ボタンを押し、登録後の商品規格登録画面に表示された商品規格IDを控える（{d['lc']}）"
    return s
def second(m):
    d=m.groupdict()
    s=f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態にSPを選び、商品コードに{d['code']}、"
    s+=f"基準価格に{d['base']}、販売価格に{d['sell']}、買取価格に{d['buy']}"
    s+=f"、帯URLに{d['belt']}を入れ、" if d['belt'] else 'を入れ、'
    s+='高額商品コードに商品コードと同じ値を入れ、' if d['hpc'].startswith('に') else '高額商品コードは空のままにし、'
    s+='セールフラグにチェックを入れ、' if d['sale']=='入れ' else 'セールフラグにチェックを入れず、'
    s+=f"スマレジ連携フラグで「連携しない」を選び、部門は選択肢の先頭を選び、公開ステータスで「公開」を選んで「商品規格を登録」ボタンを押し、登録後の商品規格登録画面に表示された商品規格IDを控える（{d['lc']}）"
    return s
BASIS='M03-27 L0092 L0119 L0123 L0124 L0134 L0194-L0238、M03-09 L0123-L0172、M03-02 L0075-L0077'
out=[]
for r in rows:
    sid=r[0]; ss=r[5].split('。'); new=[]; used=set(); pend=None; changed=False; notes=[]
    is_qc = any(QP.match(s) for s in ss)
    if is_qc:
        i=0
        while i<len(ss):
            m=QP.match(ss[i])
            if m:
                name=m.group(1)
                m2=Q2.match(ss[i+1]); m3=Q3.match(ss[i+2]); assert m2 and m3, sid
                code,hpc,sale,base,sell,buy=m3.groups()
                new.append(csv_sentence(code,name,False,base,buy,'・販売制限数5',QCCAT,'「QC連携購入グループ」'))
                new.append(search(code,m2.group(1)))
                new.append('商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、割引率に「割引率A」を選んで「商品を登録」ボタンを押す')
                new.append('商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く')
                sl='セールフラグにチェックを入れ、' if sale=='にチェックを入れ' else 'セールフラグはチェックなしのまま、'
                new.append(f'商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で販売種別に「販売種別A」、高額商品コードに「{hpc}」、{sl}基準価格(円)に「{base}」、販売価格(円)に「{sell}」、買取価格(円)に「{buy}」を入れ、スマレジ連携フラグは「連携しない」のまま、部門に「ショーケース」、公開状態に「公開」を選んで「商品規格を登録」ボタンを押す')
                i+=3; changed=True; continue
            new.append(ss[i]); i+=1
        out.append((sid,'直す','。'.join(new),'',BASIS+'、M03-27 L0224',
          '元は商品登録画面で商品を作っていたので、グッズ商品CSV登録で作り、割引率「割引率A」は取り込み後に商品登録編集画面で選ぶ（グッズ商品CSVに割引率の列が無く、編集の必須項目）。CSVの基準価格・販売価格は元の基準価格に揃え（セール無効で作られる）、元の販売価格は規格の編集画面で入れ直す。商品カテゴリ(ID)は元の「QC連携カテゴリ」（サプライ・グッズの子。S-M03-30-QC-MASTERSで作成）。'))
        continue
    for s in ss:
        mp=P_RE.match(s); mc=C_RE.match(s)
        if mp:
            assert pend is None
            pend=mp; continue
        if mc:
            d=mc.groupdict(); code=d['code']
            if pend is not None:
                csvcode=code if code not in used else code+'-2'
                used.add(code)
                name=pend.group('n1') or pend.group('n2')
                tag=pend.group('tag').startswith('タグで')
                new.append(csv_sentence(csvcode,name,tag,d['base'],d['buy']))
                new.append(search(csvcode,pend.group('lp')))
                new.append(edit(mc, code if csvcode!=code else None))
                if csvcode!=code: notes.append(f'商品コード{code}の重複は、CSVでは別の商品コード「{csvcode}」で作り、取り込み後に規格の編集画面で{code}に書き換えて作る（規格の編集画面の商品コードに一意の検査が無いことを ec-cube-enterprise の ProductClassType で確認）。')
                pend=None; changed=True
            else:
                new.append(second(mc)); changed=True
                notes.append('同じ商品の2件目の規格は商品規格一覧の「新規作成」で足す。元に状態の指定が無いので、CSVが作るニアミントとは別の状態SP（日本語）にした。')
            continue
        new.append(s)
    assert pend is None,sid
    if not changed:
        out.append((sid,'直さない','','','','商品を新しく作る操作が無い（'+('商品の検索と、あれば削除だけ' if 'TARGETS-041' in sid or 'NOMSG' in sid else '')+'）。'))
        continue
    notes_s=''.join(notes)
    reason='元は商品登録画面で商品と規格を作っていたので、グッズ商品CSV登録で作り、取り込んだニアミント日本語の規格を編集画面で元の値（基準価格・販売価格・買取価格・セールフラグ・帯URL・高額商品コード）に直す。CSVの基準価格・販売価格は元の基準価格に揃える（CSVは常にセール無効で作る。セールフラグの有効化と販売価格は編集画面で入れる M03-09 L0117-L0119）。元は言語・公開ステータス・部門が未指定だったので、日本語・公開・部門は先頭とした。商品名は元の例の値を使い、高額商品コードは「商品コードと同じ値」にした。'+notes_s
    out.append((sid,'直す','。'.join(new),'',BASIS+('、M03-27 L0221' if '・タグ(ID)' in '。'.join(new) else ''),reason))
# fixups for non-changed
fix={}
for k,(sid,*rest) in enumerate(out): fix[sid]=k
def setrow(sid,kind,why,basis=''):
    out[fix[sid]]=(sid,kind,'','',basis,why)
setrow('S-M03-33-TARGETS-041','直さない','商品を新しく作る操作が無い。存在しない商品コードを検索して0件を確かめるだけ（該当があれば商品登録編集画面で削除する）。')
setrow('S-M03-33-NOMSG-057','直さない','商品を新しく作る操作が無い。存在しない商品コードを検索して0件を確かめるだけ。')
setrow('S-M03-30-QC-MASTERS','直さない','商品を作らない。カテゴリ・購入グループの作成と、言語・部門・販売種別・割引率が選べることの確認だけ。')
setrow('S-M03-33-RB-DATA-070','直さない','すでにグッズ商品CSV登録で商品を作っている。商品登録画面での商品の新規登録は無い。')
setrow('S-M03-33-RB-DATA-071','直さない','すでにグッズ商品CSV登録で商品を作っている。商品登録画面での商品の新規登録は無い。')
rowsout=[("シードID","判定","新しい投入方法","新しい状態・属性","根拠","理由")]+out
# order check
assert [x[0] for x in out]==[r[0] for r in rows]
with open('out/M03-33.tsv','w',encoding='utf-8') as f:
    for x in rowsout:
        for c in x: assert '\t' not in c and '\n' not in c
        f.write('\t'.join(x)+'\n')
