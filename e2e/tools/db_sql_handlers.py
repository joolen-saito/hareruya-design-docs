"""文の形ごとにSQLを作る規則(db_sql.py が使う)。先に当たった規則が使われる。"""
import re
from db_sql_lib import *


# 商品規格の状態の選択肢(mtb_card_condition の code)。試し用DB eccubedb_sqltest(渡すダンプ)を SELECT して確かめた値(2026-10-23)
CARD_CONDITIONS = ('NM', 'SP', 'MP', 'HP', 'OT')


class Ctx:
    def __init__(self, fid, sid, name, state, how):
        self.fid, self.sid, self.name, self.state, self.how = fid, sid, name, state, how
        self.notes = []
        self.db_pos = {}   # place -> [DB文の位置]（直前のDB文からの区間を求めるため）

    def begin(self, place, sent, prev, text, pos=None):
        self.place, self.sent, self.prev, self.text = place, sent.strip(), prev, text
        # 先頭の丸数字(④ など)は規則の当たり判定から外す
        self.sent = re.sub(r'^[①-⑳\s]+', '', self.sent)
        self.pos = pos if pos is not None else max(0, text.find(sent))
        self.target_note = []
        self.enter_values = []   # シード表の文に完全な語としては無いが、文の指示から組み立てて画面で入れる値(手順書に書く)
        self.gap_hint = ''

    # --- 状態・属性から読む ---
    def plans(self):
        """棚卸計画の一覧(状態・属性と投入方法の「棚卸計画「名」」「棚卸名に「名」」)。属性(作成日・在庫反映日・最終更新日)は状態・属性の括弧から"""
        out = []
        pat_dt = r'(\d{4}/\d{1,2}/\d{1,2}(?: \d{1,2}:\d{2}(?::\d{2})?)?)'
        for text, only_attr in ((self.state, True), (self.how, False)):
            for m in re.finditer(r'棚卸計画「([^」]+)」(?:（([^）]*)）)?|棚卸名に「([^」]+)」', text):
                name = m.group(1) or m.group(3)
                if name.endswith('-') or 'M0431-' not in name and not re.search(r'\d', name):
                    continue
                attr = (m.group(2) or '') if only_attr else ''
                d = {'name': name, 'attr': attr}
                for key, pat in (('create', r'作成日時?' + pat_dt), ('reflect', r'在庫反映日' + pat_dt), ('update', r'最終更新日' + pat_dt)):
                    mm = re.search(pat, attr)
                    if mm:
                        d[key] = mm.group(1)
                old = next((p for p in out if p['name'] == name), None)
                if old is None:
                    out.append(d)
                else:
                    for k_, v_ in d.items():
                        if k_ not in old or (k_ == 'attr' and not old[k_]):
                            old[k_] = v_
        return out

    # --- 商品規格・店舗の特定 ---
    def known_codes(self):
        """このシードの商品(規格)コード。スマレジ商品コード・高額商品コード・JANコードなどは商品コードではないので拾わない"""
        t = self.state + '\n' + self.how
        out = []
        for m in re.finditer(r'(?<!スマレジ)(?<!高額)(?<!JAN)(?<!部門)(?:商品規格コード|規格コード|商品コード)(?:は|が|に|を|=|＝)?「?([A-Za-z0-9][A-Za-z0-9\-_]*(?:[・、,][A-Za-z0-9][A-Za-z0-9\-_]*)*)', t):
            for c in re.split(r'[・、,]', m.group(1)):
                # 数字もハイフンも無い語(「商品コードにCSVに書いた…」の CSV、「…・HP」の状態など)は、「…」で囲まれていなければ商品コードとして拾わない
                if c and not re.search(r'[0-9\-]', c) and ('「%s」' % c) not in t:
                    continue
                if c and c not in out and not re.search(r'\.(csv|tsv|txt)$', c):
                    out.append(c)
        return out

    def pc_labels(self, text=None):
        """商品規格の呼び名(〔商品規格ID-…〕〔規格ID-…〕)"""
        t = self.state if text is None else text
        out = []
        for l in LABEL.findall(t):
            if (l.startswith('〔商品規格ID-') or l.startswith('〔規格ID-')) and l not in out:
                out.append(l)
        return out

    def prod_labels(self, text=None):
        t = (self.state + self.how) if text is None else text
        out = []
        for l in LABEL.findall(t):
            if l.startswith('〔商品ID-') and l not in out:
                out.append(l)
        return out

    @staticmethod
    def _suffix(label):
        return re.sub(r'^〔[^-]+ID-', '', label).rstrip('〕')

    def _code_target(self, c):
        return (c, pc_by_code(c), "SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(c))

    def _prod_class_target(self, pl):
        """商品の呼び名 → その商品の規格。同じ末尾の規格の呼び名があればそれ、無ければ「その商品の規格が1件」と確かめて使う"""
        suf = self._suffix(pl)
        for cl in self.pc_labels(self.state + self.how):
            if self._suffix(cl) == suf:
                return (cl, cl, None)
        return (pl + 'の規格', "(SELECT id FROM dtb_product_class WHERE product_id = %s)" % pl, "SELECT count(*) FROM dtb_product_class WHERE product_id = %s" % pl)

    def _letter(self, L):
        """「商品A」の A → 規格の指定。呼び名の末尾・商品コードの区切りで1つに決まるものだけ"""
        allt = self.state + self.how
        cl = [l for l in self.pc_labels(allt) if re.search(r'(?<![A-Za-z])' + L + r'〕$', l)]
        if len(cl) == 1:
            return [(cl[0], cl[0], None)]
        pl = [l for l in self.prod_labels(allt) if re.search(r'(?<![A-Za-z])' + L + r'〕$', l)]
        if len(pl) == 1:
            return [self._prod_class_target(pl[0])]
        cs = [c for c in self.known_codes() if re.search(r'(?<![A-Za-z])' + L + r'(?![A-Za-z])', re.sub(r'^[A-Za-z]+(?=\d)', '', c))]
        if len(cs) == 1:
            return [self._code_target(cs[0])]
        return None

    def _mentions(self, seg):
        """区間の中の規格の指名(呼び名・商品コード)を出てきた順に"""
        known = self.known_codes()
        hits = []
        for m in LABEL.finditer(seg):
            l = m.group(0)
            if l.startswith('〔商品規格ID-') or l.startswith('〔規格ID-'):
                hits.append((m.start(), (l, l, None)))
            elif l.startswith('〔商品ID-'):
                hits.append((m.start(), self._prod_class_target(l)))
        for c in known:
            for m in re.finditer(r'(?<![A-Za-z0-9\-_])' + re.escape(c) + r'(?![A-Za-z0-9_]|-[A-Za-z0-9])', seg):
                hits.append((m.start(), self._code_target(c)))
        hits.sort(key=lambda x: x[0])
        return hits

    def section_subject(self):
        """文の前の節の見出し(【商品A】・「HIST-DISPLAY-001:」など)が指す規格。見出しが無い／対象を指さない見出しなら None"""
        before = self.text[:self.pos]
        known = self.known_codes()
        cands = [(m.start(), m.group(1)) for m in re.finditer(r'【([^】]+)】', before)]
        for m in re.finditer(r'(?:^|[。／\s）])([A-Za-z0-9][A-Za-z0-9\-_]*)[:：]', before):
            if m.group(1) in known:
                cands.append((m.start(1), m.group(1)))
        if not cands:
            return None
        pos, h = max(cands)
        if h in known:
            return [self._code_target(h)]
        mh = re.fullmatch(r'商品([A-Z])', h.strip())
        if mh:
            return self._letter(mh.group(1))
        return None

    def all_targets(self):
        labs = self.pc_labels()
        if labs:
            return [(l, l, None) for l in labs]
        pls = self.prod_labels(self.state)
        if pls:
            return [self._prod_class_target(p) for p in pls]
        known = self.known_codes()
        if known:
            return [self._code_target(c) for c in known]
        raise Unsupported('どの商品規格か決まらない: 文にも状態・属性にも、商品規格の呼び名(〔商品規格ID-…〕)や商品コードが無い')

    def remaining_class(self, tg):
        """節の中で「取り込みで作られた規格を削除し、新規作成の規格だけを残す」と書かれた商品は、商品コードで引くと削除済み(論理削除)の規格に当たる。
        その商品の、削除されていない(公開状態が廃止でない・表示する)規格を対象にする"""
        before = self.text[:self.pos]
        start = max([before.rfind(ch) for ch in '①②③④⑤⑥⑦⑧⑨⑩'] + [0])
        seg = before[start:]
        out = []
        for desc, expr, chk in tg:
            mc = re.match(r"^\(SELECT id FROM dtb_product_class WHERE product_code = '([^']+)'\)$", expr)
            ml = re.match(r"^\(SELECT id FROM dtb_product_class WHERE product_id = (〔商品ID-[^〕]+〕)\)$", expr)
            if not mc and not ml:
                out.append((desc, expr, chk))
                continue
            c = mc.group(1) if mc else ml.group(1)
            i = seg.rfind(c)
            rest = seg[i:] if i >= 0 else ''
            if not (i >= 0 and '新規作成' in rest and '商品規格を削除' in rest and rest.find('新規作成') < rest.find('商品規格を削除')):
                out.append((desc, expr, chk))
                continue
            prod = ("SELECT product_id FROM dtb_product_class WHERE product_code = %s" % qs(c)) if mc else c
            w = "c.product_id IN (%s) AND c.visible AND c.product_status_id IS DISTINCT FROM 3" % prod
            mcond = re.search(r'新規作成.*?状態に([A-Z]{2})', rest)
            if mcond and mc and not re.search(r'新規作成[^。]*商品コードは空のまま', rest):
                self.enter_values.append(c + '-' + mcond.group(1))
                self.target_note.append('新規作成の規格の商品コードは文に無いが画面で必須のため、「%s」を入れる（手順書で決めた値。SQLはこのコードでは引かない）' % (c + '-' + mcond.group(1)))
            what = ('商品コード%sの規格（取り込みで作られた規格）' % c) if mc else ('%sの商品の、取り込みで作られた規格' % c)
            self.target_note.append('節の手順で、%sは「商品規格を削除」で論理削除され（行と商品コードは残る）、新規作成の規格だけが残る。'
                                    'そのため%sの商品の、削除されていない（公開状態が廃止でない・表示する）規格を対象にし、それが1件に決まることを確かめる' % (what, ('商品コード%sの規格' % c) if mc else c))
            if mcond and mcond.group(1) not in CARD_CONDITIONS:
                self.target_note.append('文の状態「%s」は、アプリの状態の選択肢（%s。試し用DBの状態の表を SELECT で確かめた）に無い。画面ではその状態を選べない（設計と実装の差の候補として記録した）' % (mcond.group(1), '・'.join(CARD_CONDITIONS)))
                self.gap_hint = '状態の値がアプリの状態の選択肢に無い'
            out.append(('%sの商品の削除されていない規格' % (('商品コード%s' % c) if mc else c), "(SELECT c.id FROM dtb_product_class c WHERE %s)" % w, "SELECT count(*) FROM dtb_product_class c WHERE %s" % w))
        return out

    def targets(self, sent=None):
        tg, allf = self._targets(sent)
        return self.remaining_class(tg), allf

    def _targets(self, sent=None):
        """文が指す商品規格。戻り値 ([(説明, SQL式, 確認SQL|None)], 全部に当てたか)。
        決め方(先に当たったもの): ①文の規格の呼び名 ②文の商品の呼び名(〔商品ID-…〕の規格) ③文の商品コード ④文の「商品A」
        ⑤文の「両/各/全/それぞれ/N商品」=このシードの全部 ⑥節の見出し(【商品A】・「コード:」) ⑦このシードの規格が1つだけ
        ⑧直前のDB文からこの文までに出てきた最後の指名 ⑨決まらなければ全部(備考に書く)"""
        sent = sent or self.sent
        self.target_note = []
        out = [(l, l, None) for l in dict.fromkeys(LABEL.findall(sent)) if l.startswith('〔商品規格ID-') or l.startswith('〔規格ID-')]
        if out:
            return out, False
        pls = [l for l in dict.fromkeys(LABEL.findall(sent)) if l.startswith('〔商品ID-')]
        if pls:
            return [self._prod_class_target(p) for p in pls], False
        known = self.known_codes()
        hit = [c for c in known if re.search(r'(?<![A-Za-z0-9\-_])' + re.escape(c) + r'(?![A-Za-z0-9_]|-[A-Za-z0-9])', sent)]
        hit = [c for c in hit if not any(o != c and o.startswith(c + '-') and o in hit for o in hit)]
        if hit:
            return [self._code_target(c) for c in hit], False
        msuf = re.search(r'識別子に「([^」]+)」を付けた値', sent)
        if msuf:
            # 「商品コードは識別子に「-CSV」を付けた値」: 直前に「N件（識別子・識別子・…）」と挙げた識別子に、その語を付けたもの
            before = self.text[:self.pos]
            lists = list(re.finditer(r'(\d+)件（([A-Za-z0-9][A-Za-z0-9\-_]*(?:・[A-Za-z0-9][A-Za-z0-9\-_]*)+)）', before))
            if not lists:
                raise Unsupported('「識別子に「%s」を付けた値」の識別子の一覧が、文の前に無い' % msuf.group(1))
            ml = lists[-1]
            ids = ml.group(2).split('・')
            if int(ml.group(1)) != len(ids):
                raise Unsupported('識別子の一覧の件数（%s件）と並べた数（%d）が合わない' % (ml.group(1), len(ids)))
            codes = [x + msuf.group(1) for x in ids]
            self.enter_values += codes
            self.target_note.append('対象の商品コードは、文の前の「%s件（%s）」の識別子に「%s」を付けた %s（グッズ商品CSVの商品コード欄に入れる値）' % (ml.group(1), ml.group(2), msuf.group(1), '・'.join(codes)))
            return [self._code_target(c) for c in codes], False
        letters = re.findall(r'(?<!両)商品([A-Z])(?![A-Za-z0-9])', sent)
        if letters:
            res = []
            for L in dict.fromkeys(letters):
                t = self._letter(L)
                if not t:
                    raise Unsupported('文の「商品%s」がどの商品規格か、呼び名・商品コードから1つに決まらない' % L)
                res += t
            return res, False
        if re.search(r'両(?:商品|規格)|各(?:規格|商品)|全(?:規格|商品|ての)|すべての|それぞれ|\d+(?:商品|規格)(?:とも|の|それぞれ)|いずれも', sent):
            self.target_note.append('文が「両商品」「各規格」などと全部を指すため、このシードの全ての商品規格に対して行う')
            return self.all_targets(), False
        mcount = re.search(r'(\d+)件', sent)
        if mcount and int(mcount.group(1)) > 1:
            alls = self.all_targets()
            if len(alls) == int(mcount.group(1)):
                self.target_note.append('文の「%s件」がこのシードの商品規格の数（%d）と同じため、全部に対して行う' % (mcount.group(1), len(alls)))
                return alls, False
        sec = self.section_subject()
        if sec:
            self.target_note.append('対象は、この文が書かれた節の見出しが指す商品（%s）' % '・'.join(d for d, _, _ in sec))
            return sec, False
        alls = self.all_targets()
        if len(alls) == 1:
            return alls, False
        prev_db = max([p for p in self.db_pos.get(self.place, []) if p <= self.pos], default=0)
        ms = self._mentions(self.text[prev_db:self.pos])
        if ms and self.place == '投入方法':
            t = ms[-1][1]
            self.target_note.append('文が名指ししないため、対象は直前の手順で出てきた最後の商品（%s）とした（このシードの商品規格は複数）' % t[0])
            return [t], False
        self.target_note.append('文が対象を名指しせず、節の見出し・直前の手順からも決まらないため、このシードの全ての商品規格に対して行う（状態・属性の書き方から全部に当たると読んだ）')
        return alls, True

    def shops(self, sent=None):
        return []

    # --- 項目(商品規格)の並び: 状態・属性の記載順 ---
    def items(self):
        """このシードで状態・属性が並べる商品規格の目印を記載順に返す。[(トークン, 商品規格の呼び名 or None)]"""
        out = []
        for e in re.split(r'／', self.state):
            m = re.match(r'^([A-Za-z0-9][A-Za-z0-9\-_]*)は商品ID', e)
            if m:
                pcs = self.pc_labels(e)
                out.append((m.group(1), pcs[0] if pcs else None))
        if out:
            return out
        m = re.match(r'^([A-Za-z0-9][A-Za-z0-9\-_]+(?:[・、][A-Za-z0-9][A-Za-z0-9\-_]+)+)／', self.state)
        if m:
            return [(c, None) for c in re.split(r'[・、]', m.group(1))]
        labs = self.pc_labels()
        if labs:
            return [(None, l) for l in labs]
        return [(c, None) for c in self.known_codes()]

    def nth(self, key):
        self._counts = getattr(self, '_counts', {})
        self._counts[key] = self._counts.get(key, -1) + 1
        return self._counts[key]

    def item_target(self, idx=None, token=None):
        """items() から商品規格の指定(SQL式, 確認SQL)を返す。token(コード)で探し、無ければ idx 番目"""
        its = self.items()
        pick = None
        if token is not None:
            pick = next((it for it in its if it[0] == token), None)
        if pick is None and idx is not None and 0 <= idx < len(its):
            pick = its[idx]
        if pick is None:
            raise Unsupported('どの商品規格か、状態・属性の並びから決まらない')
        tok, lab = pick
        if lab:
            return lab, None
        return pc_by_code(tok), "SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(tok)

import json as _json, os as _os
_COUNTS = {}
try:
    _COUNTS = _json.load(open(_os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), 'review', 'db_dump_counts.json'), encoding='utf-8'))
except Exception:
    pass


def _all_delete_reason(items):
    """全件削除でしか書けない文。試し用DB(渡すダンプ直後と同じ状態)の件数で、操作が要るかを書く。items=[(論理名, 表)]"""
    parts = [(n, _COUNTS.get(t)) for n, t in items]
    if any(c is None for _, c in parts):
        return '全件削除でしか書けないため SQL は用意していない（ダンプ直後の件数は未確認）'
    if all(c == 0 for _, c in parts):
        return '全件削除: 渡したダンプを戻した直後は該当0件（' + '・'.join('%s0件' % n for n, _ in parts) + '）なので、この操作は要らない'
    return '全件削除: 渡したダンプを戻した直後の既存の行は ' + '・'.join('%s%d件' % (n, c) for n, c in parts) + '。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）'



HANDLERS = []


def _fallback_reason(s):
    if re.search(r'呼出履歴|呼び出し記録|API呼出', s):
        return _all_delete_reason([('スマレジ連携のAPI呼出履歴', 'dtb_smaregi_platform_api_call_log')]) + '（API呼出履歴の表に商品規格と結び付く列が無く、このシードの行だけには絞れない）'
    if re.search(r'最終採番値', s):
        return '連番の最終値の保存先が現行のコードからも設計書からも特定できず、設定先が決まらない'
    if re.search(r'(?:ID=|ID )\d+.*の登録は画面で指定できないためDBシードで登録|言語・状態は画面で登録できない|登録する画面が無い|固定のタグ', s):
        return '登録する行の中身(名称・階層・並び順・各項目の値)が文に書かれておらず、行を決められない'
    if re.search(r'削除済み', s):
        return PROD_DEL_REASON
    if re.search(r'所属が属する店舗|店舗・所属関係', s):
        return '現行のDBに「所属と店舗の関係」を持つ表・列が見つからない(DBの表の一覧に無い)ため、設定先が無い'
    if re.search(r'退避|復元', s):
        return '退避した行の保管先と復元の手順が文に書かれておらず、元に戻せる形で作れない(退避・復元は範囲を絞った消去だけでは足りない)'
    if re.search(r'販売数|入庫数|週前在庫|週間販売|月間販売|週間入庫|月間入庫', s):
        return '販売数・入庫数・週間在庫の保存先(販売数は販売場所の区分、入庫数は在庫区分で別の行)と、文の「通販+TC東京」「支店」などの対応が文に無く、行を決められない'
    if re.search(r'DBシード|投入する|登録する|登録し', s) and re.search(r'マスタ|マスター|各|指定の|記載値|記載した|記載のとおり', s):
        return '登録する行・値が「各マスタ」「記載値」などと書かれ、文では決まらない(別の手順書の値を引く形)'
    if re.search(r'在庫変動履歴|承認|分割|結合|移動|振替|ステータス', s):
        return '在庫の承認・移動・分割結合などの複数の表にまたがる状態で、文の値だけでは行を決められない'
    if re.search(r'画像', s):
        return '商品画像の行と画像ファイルの配置が一体で、ファイルの置き場(サーバー側)が文に無い'
    return '文の形が個別で、表・列・値を文から機械的に決められない'


def handler(pat, name=None):
    rx = re.compile(pat)

    def deco(fn):
        HANDLERS.append((name or fn.__name__, rx, fn))
        return fn
    return deco


def _guard_label_updates(sql):
    """「UPDATE 表 SET … WHERE id = 〔呼び名〕;」の前に、その番号の行が1件あることの確認を入れる(番号の書き間違いで0行のまま通らないように)"""
    out = []
    REF = {'product_class_id': 'dtb_product_class', 'product_id': 'dtb_product', 'product_stock_id': 'dtb_product_stock'}
    for x in sql:
        m = re.match(r'^UPDATE (\w+) SET .* WHERE id = (〔[^〕]+〕);$', x)
        md = re.match(r'^(?:UPDATE (\w+) SET .*|DELETE FROM (\w+)) WHERE (product_class_id|product_id|product_stock_id) = (〔[^〕]+〕)(?: AND .*)?;$', x)
        chk = None
        if m:
            chk = assert_one("SELECT count(*) FROM %s WHERE id = %s" % (m.group(1), m.group(2)), '%s の行が1件に決まらない（番号の置き換えを確かめる）' % m.group(2))
        elif md:
            chk = assert_one("SELECT count(*) FROM %s WHERE id = %s" % (REF[md.group(3)], md.group(4)), '%s の行が1件に決まらない（番号の置き換えを確かめる）' % md.group(4))
        if chk and chk not in out and not any(md and md.group(4) in y and y.startswith('DO $$') and REF.get(md.group(3), '') in y for y in out):
            out.append(chk)
        out.append(x)
    return out


def run(ctx):
    for name, rx, fn in HANDLERS:
        m = rx.search(ctx.sent)
        if m:
            out = fn(ctx, m)
            if out is not None:
                out.notes = list(out.notes)
                out.handler = name
                out.enter = list(dict.fromkeys(list(getattr(out, 'enter', []) or []) + ctx.enter_values))
                if not out.gap and ctx.gap_hint:
                    out.gap = ctx.gap_hint
                out.sql = _guard_label_updates(out.sql)
                out.sql = guard_updates(out.sql)   # 更新の前に、同じ表・同じ条件の行の数の確認(db_sql_lib.py)
                # やり直し・前回の残りを消す文は、画面で登録する前に流す(登録のあとに流すと、作った行まで消す)
                stm = [x for x in out.sql if not x.startswith('--') and not x.startswith('DO $$')]
                if stm and all(x.startswith('DELETE') for x in stm) and re.search(r'やり直し|前回の実行|残っているとき|残っている場合|が登録されているときは|行が残っている|試験開始前|ケース開始時|投入前', ctx.sent):
                    out.when = 'before'
                return out
    r = _fallback_reason(ctx.sent)
    raise Unsupported(r, gap=('現行のDBに設定先の表・列が無い' if ('削除済みとして行が残る' in r or '所属と店舗の関係' in r) else ''))


# ============ 価格履歴の値(取り込みでできた履歴の削除と、残した履歴の値) ============
# 取り込み(グッズ商品CSVの新規登録)でできる価格履歴は、変更前の3つの価格が 0 で書かれる(現行のコード: 商品CSV取込の新規登録で変更前価格に0を入れる)。
# 画面では「変更前価格が空」に見えるため、0 と空(NULL)のどちらも「空」として扱う。
IMPORT_HIST_COND = ' AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0'
IMPORT_HIST_NOTE = '「変更前価格が空」の履歴(取り込みでできたもの)だけを消す。取り込みは変更前の価格を0で書くため、0と空(NULL)のどちらも「空」として扱う'


@handler(r'取り込みでできた価格履歴（変更前価格が空のもの）はDBから直接削除し、規格の編集でできた価格履歴を1件だけ残して、その履歴の変更後基準価格を(\d+)、変更後販売価格を(\d+)、変更後買取価格を(\d+)に')
def price_hist_keep_edit(ctx, m):
    tg, allf = ctx.targets()
    if len(tg) != 1:
        raise Unsupported('どの商品規格の価格履歴か1つに決まらない')
    desc, e, chk = tg[0]
    sql = [assert_one(chk, '商品規格「%s」が1件に決まらない' % desc)] if chk else []
    sql += ["DELETE FROM dtb_price_history WHERE product_class_id = %s%s;" % (e, IMPORT_HIST_COND),
            assert_eq("SELECT count(*) FROM dtb_price_history WHERE product_class_id = %s" % e, 1, '%s の、規格の編集でできた価格履歴が1件に決まらない' % desc),
            "UPDATE dtb_price_history SET standard_price = %s, sell_price = %s, buy_price = %s WHERE product_class_id = %s;" % (m.group(1), m.group(2), m.group(3), e)]
    return Out(sql, _note_all(ctx, allf) + [IMPORT_HIST_NOTE, '残った履歴(規格の編集でできた1件)の変更後の3つの価格を文の値にする'], ['dtb_price_history', 'dtb_product_class'])


@handler(r'^この履歴の変更前基準価格(\d+)・変更前販売価格(\d+)・変更前買取価格(\d+)と登録日時(\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?)は')
def price_hist_old_values(ctx, m):
    tg, allf = ctx.targets()
    if len(tg) != 1:
        raise Unsupported('「この履歴」がどの商品規格の価格履歴か1つに決まらない')
    desc, e, chk = tg[0]
    sql = [assert_one(chk, '商品規格「%s」が1件に決まらない' % desc)] if chk else []
    sql += [assert_eq("SELECT count(*) FROM dtb_price_history WHERE product_class_id = %s" % e, 1, '%s の価格履歴が1件に決まらない(直前の文で1件だけ残したはず)' % desc),
            "UPDATE dtb_price_history SET old_standard_price = %s, old_sell_price = %s, old_buy_price = %s, create_date = %s WHERE product_class_id = %s;" % (m.group(1), m.group(2), m.group(3), ts(m.group(4)), e)]
    return Out(sql, _note_all(ctx, allf) + ['「この履歴」は直前の文で残した、この規格の価格履歴1件。日時は日本時間(+09)'], ['dtb_price_history', 'dtb_product_class'])


# ============ 削除済み(規格は論理削除で表せる。商品本体は表せない) ============
CLASS_DEL_NOTE = 'アプリの商品規格の削除は論理削除（公開状態を廃止(3)にし、表示しないにする。行は残る）。同じ形にする。スマレジ連携の削除の呼び出しはしない'
PROD_DEL_REASON = '商品本体の削除済み: アプリの商品削除は行そのものを消す動作で、「削除済みとして行が残る」状態を表す列が商品の表に無いため作れない（現行のDBに設定先の表・列が無い。設計と実装の差の候補）'


@handler(r'規格コード([A-Za-z0-9][A-Za-z0-9\-_]*)の規格の削除済み状態は画面で指定できない')
def class_logical_delete(ctx, m):
    c = m.group(1)
    return Out([assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(c), '商品コード%sの規格が1件に決まらない' % c),
                "UPDATE dtb_product_class SET product_status_id = 3, visible = false WHERE product_code = %s;" % qs(c)], [CLASS_DEL_NOTE], ['dtb_product_class'])


@handler(r'^商品コード([A-Za-z0-9][A-Za-z0-9\-_]*)の商品と商品規格を削除済みにすること')
def product_and_class_delete(ctx, m):
    c = m.group(1)
    return Out([assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(c), '商品コード%sの規格が1件に決まらない' % c),
                "UPDATE dtb_product_class SET product_status_id = 3, visible = false WHERE product_code = %s;" % qs(c)],
               [CLASS_DEL_NOTE + '。商品規格の削除済みだけを作る'], ['dtb_product_class'], unmade=[PROD_DEL_REASON], gap='現行のDBに設定先の表・列が無い')


@handler(r'^削除済みの商品ID (\d+)とその商品規格ID (\d+)（商品コード([^）]+)）、商品ID (\d+)と削除済みの商品規格ID (\d+)（商品コード([^）]+)）は画面で指定できない')
def deleted_product_and_class_ids(ctx, m):
    """削除済みの商品(作れない)と、削除済みの商品規格(論理削除で作れる)。商品規格は文の番号・商品コードで行ごと作る"""
    p1, c1, code1, p2, c2, code2 = m.groups()
    main = "(SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop)"
    sql = [assert_one("SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop", '本店（本店かつ公開の店舗）が1件に決まらない'),
           assert_eq("SELECT count(*) FROM dtb_product_class WHERE product_code = %s AND id <> %s" % (qs(code2), c2), 0, '商品コード%sの規格がほかの番号で既にある' % code2),
           "INSERT INTO dtb_product (id, base_info_id, name, product_status_id, create_date, update_date) VALUES (%s, %s, %s, 1, now(), now()) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, product_status_id = EXCLUDED.product_status_id;" % (p2, main, qs(code2)),
           "INSERT INTO dtb_product_class (id, product_id, base_info_id, product_code, price02, product_status_id, visible, create_date, update_date) VALUES (%s, %s, %s, %s, 0, 3, false, now(), now()) "
           "ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, product_code = EXCLUDED.product_code, product_status_id = 3, visible = false;" % (c2, p2, main, qs(code2))]
    notes = ['商品ID %s（削除されていない商品）と、その削除済みの商品規格ID %s（商品コード%s）を文の番号で作る。' % (p2, c2, code2) + CLASS_DEL_NOTE,
             '文に無い値を決めた: 商品の名前=商品コードと同じ「%s」・商品の公開状態=公開(1)・店舗=本店・規格の販売価格=0。言語・状態・在庫などは作らない（空のまま）' % code2]
    unmade = ['削除済みの商品ID %s とその商品規格ID %s（商品コード%s）: ' % (p1, c1, code1) + PROD_DEL_REASON]
    return Out(sql, notes, ['dtb_product', 'dtb_product_class', 'dtb_base_info'], unmade=unmade, gap='現行のDBに設定先の表・列が無い')


# ============ 棚卸計画 ============
@handler(r'棚卸名が「?([A-Za-z0-9][^」で]*?)」?で始まる棚卸計画が残っている')
def plan_delete_prefix(ctx, m):
    p = m.group(1)
    w = "name LIKE %s ESCAPE '\\'" % qs(like_escape(p) + '%')
    sql = ["-- 棚卸名が「%s」で始まる棚卸計画とその棚卸詳細(と詳細の編集履歴)だけを消す。ほかの棚卸計画は消さない" % p] + del_tree('dtb_inventory_plan', w)
    return Out(sql, ['何度流しても同じ。該当が無ければ何も消えない'], ['dtb_inventory_plan', 'dtb_inventory_plan_detail', 'dtb_inventory_plan_detail_edit_history'])


@handler(r'^棚卸計画を登録する前に、既にある棚卸計画と棚卸詳細を.*すべて削除')
def plan_delete_all(ctx, m):
    raise Unsupported(_all_delete_reason([('棚卸計画', 'dtb_inventory_plan'), ('棚卸詳細', 'dtb_inventory_plan_detail')]))


def _plan_where(names):
    if len(names) == 1:
        return "name = %s" % qs(names[0])
    return "name IN (%s)" % ', '.join(qs(n) for n in names)


def _plan_update(ctx, col, picks, what):
    """picks: [(計画名, 日時)] → 計画ごとにUPDATE。計画名が1つに決まることを確かめる"""
    sql = []
    for name, d in picks:
        sql.append(assert_one("SELECT count(*) FROM dtb_inventory_plan WHERE name = %s" % qs(name), '棚卸計画「%s」が1件に決まらない' % name))
        sql.append("UPDATE dtb_inventory_plan SET %s = %s WHERE name = %s;" % (col, ts(d), qs(name)))
    return Out(sql, ['日時は日本時間(+09)として書いた。何度流しても同じ'], ['dtb_inventory_plan'])


@handler(r'^棚卸計画の作成日(?:時)?（(?:\d{4}/\d{1,2}/\d{1,2}(?: \d{1,2}:\d{2}(?::\d{2})?)?)）(?:と最終更新日（(\d{4}/\d{1,2}/\d{1,2}(?: \d{1,2}:\d{2}(?::\d{2})?)?)）)?は')
def plan_create(ctx, m):
    mc = re.match(r'^棚卸計画の作成日(?:時)?（([^）]+)）', ctx.sent)
    d = mc.group(1)
    plans = ctx.plans()
    if not plans:
        raise Unsupported('状態・属性に棚卸計画の名前(「…」)が無く、どの棚卸計画か決まらない')
    picks = [(p['name'], d) for p in plans if p.get('create') in (None, d) and not (p.get('create') is None and len(plans) > 1 and False)]
    out = _plan_update(ctx, 'create_date', picks, '作成日')
    if m.group(1):
        o2 = _plan_update(ctx, 'update_date', [(p['name'], m.group(1)) for p in plans], '最終更新日')
        out.sql += [x for x in o2.sql if not x.startswith('DO $$')]
    if any(p.get('create') is None for p in plans):
        out.notes.append('状態・属性に作成日の指定が無い棚卸計画にも同じ日時を設定した（文は「棚卸計画の作成日」と書く）')
    return out


@handler(r'^棚卸計画の在庫反映日（(\d{4}/\d{1,2}/\d{1,2} \d{1,2}:\d{2}:\d{2})）は')
def plan_reflect(ctx, m):
    d = m.group(1)
    plans = [p for p in ctx.plans() if p.get('reflect') in (None, d)]
    if not plans:
        raise Unsupported('状態・属性に棚卸計画の名前が無い')
    return _plan_update(ctx, 'stock_reflectioned_date', [(p['name'], d) for p in plans], '在庫反映日')


@handler(r'^【作成日（DBへ直接）】棚卸計画「([^」]+)」の作成日を(\S+)へ')
def plan_create_named(ctx, m):
    return _plan_update(ctx, 'create_date', [(m.group(1), m.group(2))], '作成日')


@handler(r'^棚卸計画「([^」]+)」の在庫反映日（([^）]+)）は')
def plan_reflect_named(ctx, m):
    return _plan_update(ctx, 'stock_reflectioned_date', [(m.group(1), m.group(2))], '在庫反映日')


@handler(r'^棚卸計画の作成日（「([^」]+)」を(\d{4}/\d{1,2}/\d{1,2})とし、番号が(\d+)増えるごとに(\d+)日後')
def plan_create_series(ctx, m):
    first, d, step, days = m.group(1), m.group(2), int(m.group(3)), int(m.group(4))
    pre = re.match(r'^(.*?)(\d+)$', first)
    if not pre:
        raise Unsupported('番号の形を読めない')
    prefix, n0 = pre.group(1), int(pre.group(2))
    w = "name ~ %s" % qs('^' + re.escape(prefix) + r'[0-9]+$')
    sql = [assert_ge("SELECT count(*) FROM dtb_inventory_plan WHERE %s" % w, 1, '棚卸計画「%s…」が1件も無い' % prefix),
           "UPDATE dtb_inventory_plan SET create_date = %s + (((substring(name from '[0-9]+$'))::int - %d) / %d) * %d * interval '1 day' WHERE %s;" % (ts(d), n0, step, days, w)]
    return Out(sql, ['番号が%d増えるごとに%d日後(%s の番号%dが %s)。日時は日本時間(+09)'  % (step, days, prefix, n0, d)], ['dtb_inventory_plan'])


# ============ 共通の部品 ============
def _each(targets, builder):
    sql = []
    for desc, expr, chk in targets:
        if chk:
            sql.append(assert_one(chk, '商品規格「%s」が1件に決まらない' % desc))
        sql += builder(expr)
    return sql


def _note_all(ctx, all_flag, n=2):
    """対象の決め方の備考(targets() が残したもの)"""
    return list(getattr(ctx, 'target_note', []))


# ============ 価格履歴 ============
@handler(r'価格(?:変更)?履歴.*(?:削除|0件|N件)|価格履歴[=＝]?\d+件')
def price_hist_delete(ctx, m):
    s = ctx.sent
    if re.search(r'登録日時|変更日時|変更前|変更後', s) and not re.search(r'変更前価格が空', s):
        return None
    if '削除' not in s:
        return None
    tg, allf = ctx.targets()
    cond = ''
    if '変更前価格が空' in s:
        cond = IMPORT_HIST_COND
    sql = _each(tg, lambda e: ["DELETE FROM dtb_price_history WHERE product_class_id = %s%s;" % (e, cond)])
    notes = _note_all(ctx, allf, len(tg)) + ([IMPORT_HIST_NOTE] if cond else ['この規格の価格履歴だけを消す'])
    return Out(sql, notes, ['dtb_price_history', 'dtb_product_class'])


@handler(r'^価格変更日時は画面で指定できない.*価格変更履歴1件を「([^」]+)」にし')
def price_hist_date(ctx, m):
    d = m.group(1)
    lab = LABEL.findall(ctx.sent)
    if not lab:
        raise Unsupported('価格変更履歴の呼び名が文に無い')
    hl = lab[-1]
    entry = next((e for e in re.split(r'／', ctx.state) if hl in e), None)
    pcs = ctx.pc_labels(entry) if entry else []
    chk0 = None
    if len(pcs) == 1:
        pc = pcs[0]
    else:
        lab2 = hl.replace('価格変更履歴ID', '商品規格ID')
        if lab2 in ctx.state + ctx.how:
            pc = lab2
        else:
            # 呼び名の末尾の英字(A,B,…)が記載順の1件目・2件目…に対応する、または記載順の n 番目
            suf = re.search(r'-([A-Z])〕$', hl)
            idx = (ord(suf.group(1)) - 65) if suf else ctx.nth('pricehist')
            pc, chk0 = ctx.item_target(idx=idx)
    sql = ([assert_one(chk0, '商品規格が1件に決まらない')] if chk0 else []) + [assert_one("SELECT count(*) FROM dtb_price_history WHERE product_class_id = %s" % pc, '%s の価格履歴が1件に決まらない(登録時にできた1件だけのはず)' % hl),
           "UPDATE dtb_price_history SET create_date = %s WHERE product_class_id = %s;" % (ts(d), pc)]
    return Out(sql, ['履歴の呼び名 %s の番号は、このSQLを流したあとで画面から控える(流す前は決まらない)。日時は日本時間(+09)' % hl], ['dtb_price_history'])


# ============ 在庫 ============
def _stock_labels(s):
    return [l for l in LABEL.findall(s) if l.startswith('〔在庫ID-')]


SHOP_BODY = r'(?:試験)?店舗[A-Z](?:（[^）]+）)?|本店|[^・、の（）\s／「」【】]{2,16}?(?:本店|支店|店|2F)'
SHOP_RX = '(' + SHOP_BODY + ')'


def clean_shop(name):
    """店舗名の抜き出しで付いてくる文の断片を外す(「3件とも本店」→「本店」、「と大阪支店」→「大阪支店」)。〔…〕の呼び名はそのまま"""
    if name.startswith('〔'):
        return name
    n = re.sub(r'^.*?(?:\d+件とも|件とも|ともに|とも|それぞれ|いずれも|各)(?=.)', '', name)
    n = re.sub(r'^[とのをはがにでもへや、・\s]+', '', n)
    return n


def _shop_sql(name):
    name = clean_shop(name)
    if name.startswith('〔'):
        return name, "SELECT count(*) FROM dtb_base_info WHERE id = %s" % name
    if name == '本店':
        return "(SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop)", "SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop"
    return shop_by_name(name), "SELECT count(*) FROM dtb_base_info WHERE shop_name = %s" % qs(name)


def _stock_update(code, shop, loc, sets, extra_where=''):
    sh, shchk = _shop_sql(shop)
    chk = "SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = %s AND s.base_info_id = %s AND s.stock_location_id = %d" % (qs(code), sh, loc)
    sql = [assert_one(shchk, '店舗「%s」が1件に決まらない' % shop),
           assert_one(chk, '商品コード%s・店舗%s・在庫区分%dの在庫が1件に決まらない' % (code, shop, loc)),
           "UPDATE dtb_product_stock SET %s WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = %s AND s.base_info_id = %s AND s.stock_location_id = %d);" % (', '.join(sets), qs(code), sh, loc)]
    return sql


def _refs(text, known):
    """文中の「(商品コード)の(店舗)・(EC-CUBE|スマレジ)」の言及を、出てきた順に返す。[(code, shop, loc, 位置, 終位置)]"""
    out = []
    shop_alt = SHOP_BODY + r'|M\d{4}-[A-Za-z0-9\-]+'
    for mm in re.finditer(r'(?P<shop>' + shop_alt + r')・(?:在庫区分)?(?P<loc>EC-CUBE|ECCUBE|スマレジ)', text):
        shop = clean_shop(mm.group('shop'))
        # 直前の商品コード
        before = text[max(0, mm.start() - 90):mm.start()]
        code = None
        pos = -1
        for c in known:
            i = before.rfind(c)
            if i > pos:
                code, pos = c, i
        if code is None and len(known) == 1:
            code = known[0]
        out.append((code, shop, LOC[mm.group('loc')], mm.start(), mm.end()))
    return out


def _vals_after(text, start, end):
    seg = text[start:end]
    mq = re.search(r'在庫数[=＝]?\s*(-?\d+)', seg) or re.search(r'^[^\d]{0,4}の?在庫(-?\d+)', seg) or re.search(r'^(?:の)?在庫(-?\d+)', seg)
    mc = re.search(r'総原価[=＝]?\s*(-?\d+)', seg)
    return (mq.group(1) if mq else None, mc.group(1) if mc else None)


@handler(r'(?:在庫数|保持在庫数).{0,3}[=＝]?\s*-?\d+.*(?:画面で指定できない|DBへ直接)|在庫数-1は画面|在庫数と総原価|本店・EC-CUBEの在庫数|この在庫の在庫数|この在庫数|(?:EC-CUBE|スマレジ)の在庫-?\d+(?:と|は).*画面で指定できない|在庫を\d+にDBへ直接更新')
def stock_set(ctx, m):
    s = ctx.sent
    if '以外' in s or '削除' in s or '変更前' in s or '履歴' in s.split('は画面')[0] or re.search(r'在庫数\d+以上', s):
        return None
    known = ctx.known_codes()
    sets_of = lambda q, c: [x for x in (('stock = %s' % q) if q is not None else None, ('total_cost = %s' % c) if c is not None else None) if x]
    mq = re.search(r'(?:保持)?在庫数(?:を|[=＝])?\s*(-?\d+)', s) or re.search(r'の在庫(-?\d+)(?:と|は)', s) or re.search(r'在庫を(-?\d+)に', s)
    mc = re.search(r'総原価(?:を|[=＝])?\s*(-?\d+)', s)
    sq, sc = (mq.group(1) if mq else None), (mc.group(1) if mc else None)
    labs = _stock_labels(s)
    if labs and (sq or sc):
        return Out(["UPDATE dtb_product_stock SET %s WHERE id = %s;" % (', '.join(sets_of(sq, sc)), l) for l in labs], ['在庫の呼び名の番号に対して設定する'], ['dtb_product_stock'])
    if '各参照商品' in s:
        raise Unsupported('「各参照商品」の範囲(どの商品コード・店舗・在庫区分か)が文に無い')
    # (店舗は控えた〔店舗ID-…〕で指す) の形: <コード>の(EC-CUBE|スマレジ)在庫数N
    msl = re.search(r'(〔店舗ID-[^〕]+〕)で指す', s)
    if msl and (sq or sc):
        mloc = re.search(r'(EC-CUBE|ECCUBE|スマレジ)在庫', s)
        cs = [c for c in known if c in s]
        if mloc and cs:
            return Out(_stock_update(cs[0], msl.group(1), LOC[mloc.group(1)], sets_of(sq, sc)), ['店舗は呼び名の番号で指す(店舗の番号は画面で控えたもの)'], ['dtb_product_stock', 'dtb_product_class', 'dtb_base_info'])
    refs = _refs(s, known)
    note = []
    items = []
    if refs:
        for i, (code, shop, loc, st_, en_) in enumerate(refs):
            nxt = refs[i + 1][3] if i + 1 < len(refs) else len(s)
            q, c = _vals_after(s, en_, nxt)
            q = q if q is not None else sq
            c = c if c is not None else sc
            if code is None:
                raise Unsupported('在庫の商品コードが決まらない')
            items.append((code, shop, loc, q, c))
    else:
        # 前の文・状態・属性にある「<コード>の<店舗>・<区分>は在庫数N・総原価M」、または対象だけが書かれた言及
        idx = ctx.text.find(s)
        window = ctx.text[max(0, idx - 900):idx] if idx >= 0 else ctx.prev
        wr = _refs(window, known) or _refs(ctx.state, known)
        if not wr and (sq or sc):
            wl = _stock_labels(window)
            if wl:
                return Out(["UPDATE dtb_product_stock SET %s WHERE id = %s;" % (', '.join(sets_of(sq, sc)), wl[-1])], ['対象の在庫は、前の文までに控えた最後の在庫の呼び名 %s' % wl[-1]], ['dtb_product_stock'])
        if not wr:
            # 店舗Aの在庫場所スマレジで数量N(状態・属性の在庫の呼び名)
            cand = re.findall(r'(〔在庫ID-[^〕]+〕)が' + SHOP_RX + r'の在庫場所(EC-CUBE|スマレジ)で数量(-?\d+)', ctx.state)
            hit = [c for c in cand if sq is not None and c[3] == sq]
            if hit:
                return Out(["UPDATE dtb_product_stock SET %s WHERE id = %s;" % (', '.join(sets_of(sq, sc)), h[0]) for h in hit], ['状態・属性の「在庫ID が店舗の在庫場所で数量N」のうち、数量が同じ(%s)ものに設定する' % sq], ['dtb_product_stock'])
            raise Unsupported('在庫の呼び名(〔在庫ID-…〕)も、商品コード+店舗+在庫区分も、文・前の文・状態・属性のどこからも決まらない')
        if sq is None:
            # 「この在庫数と総原価」: 値は前の言及の直後に書かれている
            for code, shop, loc, st_, en_ in wr:
                nxt = min([r[3] for r in wr if r[3] > en_] + [len(window)])
                src = window if _refs(window, known) else ctx.state
                q, c = _vals_after(src, en_, nxt)
                if code is None:
                    raise Unsupported('在庫の商品コードが決まらない')
                items.append((code, shop, loc, q, c))
            note.append('「この在庫数と総原価」は、前の文または状態・属性に書かれた「商品コード・店舗・在庫区分と在庫数・総原価」の並びのとおり')
        else:
            code, shop, loc = wr[-1][0], wr[-1][1], wr[-1][2]
            if code is None:
                raise Unsupported('在庫の商品コードが決まらない')
            items.append((code, shop, loc, sq, sc))
            note.append('対象の在庫(商品コード・店舗・在庫区分)は、前の文または状態・属性の最後の言及のもの')
    sql = []
    for code, shop, loc, q, c in items:
        if q is None and c is None:
            raise Unsupported('在庫数・総原価の値が読めない')
        sql += _stock_update(code, shop, loc, sets_of(q, c))
    return Out(sql, note + ['在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する'], ['dtb_product_stock', 'dtb_product_class', 'dtb_base_info'])


def _stock_update_pc(pc, desc, shop, loc, sets):
    """商品規格(SQL式)+店舗+在庫区分 で在庫の行を1つに決めて更新する"""
    sh, shchk = _shop_sql(shop)
    w = "s.product_class_id = %s AND s.base_info_id = %s AND s.stock_location_id = %d" % (pc, sh, loc)
    return [assert_one(shchk, '店舗「%s」が1件に決まらない' % shop),
            assert_one("SELECT count(*) FROM dtb_product_stock s WHERE %s" % w, '商品規格%s・店舗%s・在庫区分%dの在庫が1件に決まらない' % (desc, shop, loc)),
            "UPDATE dtb_product_stock SET %s WHERE id = (SELECT s.id FROM dtb_product_stock s WHERE %s);" % (', '.join(sets), w)]


@handler(r'この商品規格のスマレジ商品ID\s*(\d+)と、(.+?)・(EC-CUBE|スマレジ)の在庫（在庫数(\d+)以上）')
def smaregi_and_stock_min(ctx, m):
    """「この商品規格」は文の節(【商品A】など)・直前の手順で決める(投入方法全体の最後の商品コードではない)"""
    val, shop, loc, mn = m.group(1), clean_shop(m.group(2)), LOC[m.group(3)], m.group(4)
    tg, allf = ctx.targets()
    if len(tg) != 1:
        raise Unsupported('「この商品規格」がどの商品規格か1つに決まらない')
    desc, e, chk = tg[0]
    sql = ([assert_one(chk, '商品規格「%s」が1件に決まらない' % desc)] if chk else []) + \
          ["UPDATE dtb_product_class SET smaregi_product_id = %s WHERE id = %s;" % (qs(val), e)]
    sql += _stock_update_pc(e, desc, shop, loc, ['stock = GREATEST(stock, %s)' % mn])
    return Out(sql, _note_all(ctx, allf) + ['在庫数は、%s未満のときだけ%sにする(%s以上ならそのまま)' % (mn, mn, mn)], ['dtb_product_class', 'dtb_product_stock', 'dtb_base_info'])


# ============ 販売価格 ============
@handler(r'販売価格[=＝]?\s*\d+.*(?:画面で指定できない|DBへ直接)')
def sale_price(ctx, m):
    s = ctx.sent
    if re.search(r'商品[A-Z]を\d+', s):
        raise Unsupported('商品ごとに別の値(商品Aを900、商品Bを1800)で、商品A・Bがどの規格かを文が決めていない')
    nums = re.findall(r'販売価格[=＝]?\s*(\d+)', s)
    if len(set(nums)) != 1:
        raise Unsupported('販売価格の値が1つに決まらない')
    tg, allf = ctx.targets()
    sql = _each(tg, lambda e: ["UPDATE dtb_product_class SET price02 = %s WHERE id = %s;" % (nums[0], e)])
    return Out(sql, _note_all(ctx, allf, len(tg)) + ['販売価格だけを変える(基準価格は変えない)'], ['dtb_product_class'])


# ============ スマレジ商品ID・商品コード ============
@handler(r'スマレジ商品(?:ID|コード)(?:は|=|＝).*(?:画面|表示のみ|入力欄)')
def smaregi_ids(ctx, m):
    s = ctx.sent
    col = 'smaregi_product_id' if re.search(r'スマレジ商品ID', s) else 'smaregi_product_code'
    label = 'スマレジ商品ID' if col == 'smaregi_product_id' else 'スマレジ商品コード'
    mv = re.search(r'（「([^」]+)」）', s) or re.search(r'スマレジ商品(?:ID|コード)[=＝]([A-Za-z0-9\-_]+)', s)
    if not mv:
        raise Unsupported('スマレジ商品IDの値が文に無い')
    val = mv.group(1)
    # 状態・属性で、この値を持つ1項目(／区切り)から商品規格を探す
    entry = None
    for e in re.split(r'／', ctx.state):
        if re.search(label + r'\s*' + re.escape(val) + r'(?![A-Za-z0-9\-_])', e):
            entry = e
            break
    tg = None
    if entry:
        pcs = ctx.pc_labels(entry)
        if len(pcs) == 1:
            tg = [(pcs[0], pcs[0], None)]
    if tg is None:
        its = ctx.items()
        try:
            e, chk = ctx.item_target(idx=ctx.nth('smaregi_' + col), token=val)
            mcd = re.search(r"product_code = '([^']+)'", chk or '')
            tg = [(mcd.group(1) if mcd else e, e, chk)]
        except Unsupported:
            tg = None
    if tg is None:
        t2, allf = ctx.targets()
        if len(t2) == 1:
            tg = t2
    if tg is None:
        raise Unsupported('値 %s がどの商品規格のものか決まらない' % val)
    sql = _each(tg, lambda e: ["UPDATE dtb_product_class SET %s = %s WHERE id = %s;" % (col, qs(val), e)])
    return Out(sql, ['%sの値は文の「%s」' % (label, val)], ['dtb_product_class'])


# ============ 規格の状態 ============
@handler(r'^(?:両)?規格の状態（(NM|SP|MP|HP|OT)）は画面で指定できない')
def card_condition(ctx, m):
    tg, allf = ctx.targets()
    code = m.group(1)
    sql = _each(tg, lambda e: ["UPDATE dtb_product_class SET card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = %s) WHERE id = %s;" % (qs(code), e)])
    return Out(sql, _note_all(ctx, allf, len(tg)) + ['状態の名前の表示用の列は変えない'], ['dtb_product_class', 'mtb_card_condition'])


# ============ 取込履歴 ============
# 取込種別の番号は、画面(コントローラ)が履歴の一覧を引き・履歴を書くときに使う定数(src/Eccube/Entity/Master/MtbCsvImportType.php)で決める。
# マスタ(mtb_csv_import_type)の名前で決めない: 5〜8 はマスタの名前と画面が食い違う(5=基準価格変更CSV の画面が使うが、マスタの名前は「セール用価格変更登録」など)。
#   5 PRODUCT_STANDARD_PRICE … 基準価格変更CSV(M03-30。ProductStandardPriceCsvController)
#   6 PRODUCT_PRICE          … セール用価格変更CSV(M03-31。ProductPriceCsvController)
#   7 SIMPLE_HIGH_PRICE      … 高額商品価格変更CSV(M03-32。ProductSimpleHighPriceCsvController)
#   8 HIGH_PRICE             … セール用高額商品価格変更CSV(M03-33。ProductSaleHighPriceCsvController)
# 9(在庫変更)・10(割引率変更)・12(略称タグ更新)・13(買取減額率変更) は、取込履歴を書く画面も履歴の一覧を出す画面も無い(定数を使うコントローラが無い)。
IMPORT_TYPES = [('セール用高額商品価格変更', 8), ('セール用価格変更', 6), ('高額商品価格変更', 7), ('基準価格変更', 5), ('売上分析タグ更新', 4), ('略称タグ更新', 12), ('商品タグ更新', 3), ('部門更新', 11), ('棚番号更新', 15), ('商品公開', 14), ('グッズ商品', 2), ('カード商品', 1), ('カテゴリ', 16), ('在庫移動', 17), ('在庫振替', 18), ('在庫変更', 9), ('割引率変更', 10), ('買取減額率', 13)]
FID_TYPE = {'M03-38': 14, 'M03-29': 4, 'M03-35': 11, 'M03-40': 15, 'M03-32': 7, 'M03-33': 8, 'M03-31': 6, 'M03-30': 5, 'M03-28': 3, 'M03-37': 12, 'M03-27': 2, 'M03-41': 16, 'M04-22': 17, 'M03-26': 1}
# 手順書に書く名前は画面の名前(と番号)。マスタの名前とずれるものは併せて書く
TYPE_NAME = {1: 'カード商品CSV（番号1）', 2: 'グッズ商品CSV（番号2）', 3: '商品タグ更新CSV（番号3）', 4: '売上分析タグ更新CSV（番号4）',
             5: '基準価格変更CSV（番号5。マスタの名前は「セール用価格変更登録」）', 6: 'セール用価格変更CSV（番号6。マスタの名前は「価格変更登録」）',
             7: '高額商品価格変更CSV（番号7。マスタの名前は「セール用高額商品価格変更登録」）', 8: 'セール用高額商品価格変更CSV（番号8。マスタの名前は「高額商品価格変更登録」）',
             9: '在庫変更（番号9）', 10: '割引率変更（番号10）', 11: '部門更新CSV（番号11）', 12: '略称タグ更新（番号12）', 13: '買取減額率変更（番号13）', 14: '商品公開変更CSV（番号14）',
             15: '棚番号更新CSV（番号15）', 16: 'カテゴリCSV（番号16）', 17: '在庫移動CSV（番号17）', 18: '在庫振替CSV（番号18）'}
TYPE_GAP = '取込種別のマスタの名前と画面が使う番号が食い違う'
TYPE_GAP_NOTE = '取込種別の番号は画面(コントローラ)が使う定数で決めた。マスタの名前は番号5〜8で画面と食い違う（5=基準価格変更CSVの画面が使うがマスタの名前は「セール用価格変更登録」、6=セール用価格変更CSV／「価格変更登録」、7=高額商品価格変更CSV／「セール用高額商品価格変更登録」、8=セール用高額商品価格変更CSV／「高額商品価格変更登録」）。設計と実装の差の候補として記録した'
NO_HISTORY_SCREEN = {9, 10, 12, 13}
NO_HISTORY_NOTE = '取込種別「%s」の取込履歴は、アプリのどの画面も書かず、一覧にも出さない（この番号を使うコントローラが無い。略称タグCSVの画面 csv_product_storage_code.twig に取込履歴の一覧が無く、取込でも履歴を書かない）。このSQLで入れた履歴は画面に出ない。設計と実装の差の候補として記録した'
NO_HISTORY_GAP = '取込履歴を書く画面・一覧の画面が無い'


def type_gap(t, notes):
    """取込種別の番号に結び付く設計と実装の差の候補(区分)と備考"""
    if t in (5, 6, 7, 8):
        notes.append(TYPE_GAP_NOTE)
        return TYPE_GAP
    if t in NO_HISTORY_SCREEN:
        notes.append(NO_HISTORY_NOTE % TYPE_NAME.get(t, t))
        return NO_HISTORY_GAP
    return ''


INT_MAX = 2147483647


def _import_type(ctx, s):
    for k, v in IMPORT_TYPES:
        if k in s:
            return v
    if ctx.fid == 'M04-22':
        # 在庫移動・振替CSV登録の画面は、在庫移動CSVの取込を 17、在庫振替CSVの取込を 18 で書く(StockMoveTransferController)。どちらの取込かはシードの論理名で決める
        return 18 if '振替' in ctx.name else 17
    return FID_TYPE.get(ctx.fid)


def _type_count(t):
    by = _COUNTS.get('csv_import_history_by_type') or {}
    return by.get(str(t))


def type_all_delete_reason(t, what=''):
    """取込種別ごとの全件削除の案内(SQLは作らない)。件数は渡したダンプを戻した直後のもの。what は前置き(「ほかの」など)"""
    n = _type_count(t)
    nm = '取込種別「%s」の%s取込履歴' % (TYPE_NAME.get(t, str(t)), what)
    if n is None:
        return '全件削除: %sを消す必要があるが、全件削除のため SQL は用意していない（ダンプ直後の件数は未確認）' % nm
    if n == 0:
        return '全件削除: 渡したダンプを戻した直後の%sは0件なので、消す操作は要らない（全件削除のため SQL は用意していない。ほかのケースなどで増えていれば、その行を消す必要がある）' % nm
    return '全件削除: 渡したダンプを戻した直後の%sは%d件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）' % (nm, n)


def file_names(text):
    """文の中のファイル名。「…」で囲まれたもの、または前後が英数字で切れた半角の語(xxx.csv)。文の断片(「…履歴にファイル名normal-004.csv」)を拾わない"""
    out = re.findall(r'「([^」]+?\.(?:csv|tsv))」', text)
    out += re.findall(r'(?<![A-Za-z0-9_\-\.])([A-Za-z0-9_][A-Za-z0-9_\-\.]*\.(?:csv|tsv))(?![A-Za-z0-9_])', text)
    return list(dict.fromkeys(out))


def _state_files(ctx):
    return file_names(ctx.state)


@handler(r'DBシードで(?:\d+商品|管理者)')
def hist_with_registration(ctx, m):
    """「DBシードで5009商品を登録して…履歴を0件に」「DBシードで管理者と取込履歴を登録し…」: 文の部分ごとに作れるかを決める(全部作れないなら作らない)"""
    s = ctx.sent
    reasons = []
    mp = re.search(r'(\d+)商品', s)
    if mp:
        bigs = [x for x in re.findall(r'(?<!\d)(\d{10,})(?!\d)', ctx.state) if int(x) > INT_MAX] if '商品ID' in ctx.state else []
        if bigs:
            err = Unsupported('商品%s件の登録: 状態・属性の商品ID（%s など）は、現行のDBの商品の番号の型（integer、上限2147483647）を超えるため入らない（番号の型の上限を超える。設計と実装の差の候補）。商品の行の中身（名前・規格・価格など）も文に無い' % (mp.group(1), '・'.join(bigs[:2])), gap='番号が現行のDBの型の上限を超える')
            reasons.append(str(err))
            gap = err.gap
        else:
            reasons.append('商品%s件の登録: 商品の行の中身（名前・規格・価格・在庫など）が文に無く、%s件の商品を作れない（商品の登録はグッズ商品CSVなど画面で行う）' % (mp.group(1), mp.group(1)))
            gap = ''
        if 'タグ' in s:
            reasons.append('タグとの紐付けの登録: 紐付ける商品が上の理由で作れないため作れない')
    else:
        gap = ''
    if '管理者' in s:
        reasons.append('管理者の登録: 管理者の行には所属・店舗・メールアドレス・ログインID・パスワードが要るが文に無く（パスワードは書かない決まり）、作れない。管理者の「削除済み」の表し方も文に無い')
        if '取込履歴' in s:
            reasons.append('取込履歴の登録: 履歴の作業者は管理者を外部キーで指すため、作業者の管理者が作れないと作れない')
    if re.search(r'履歴を(?:退避して)?0件|履歴を0件|既存の本取込種別の履歴を退避', s) or re.search(r'他の取込履歴=0件|履歴0件', ctx.state):
        t = _import_type(ctx, s) or _import_type(ctx, ctx.state)
        if t:
            reasons.append(type_all_delete_reason(t))
            _n = []
            gap = '／'.join(x for x in (gap, type_gap(t, _n)) if x)
            reasons += _n
    if not reasons:
        return None
    raise Unsupported('／'.join(reasons), gap=gap)


@handler(r'(?:取込履歴|インポート履歴|履歴).*(?:削除|消去|0件)')
def csv_hist_delete(ctx, m):
    """取込履歴を消す文。消すのはこのシードの行だけ(ファイル名で引く)。取込種別の全部を消す文は全件削除なので作らず、手順書に件数を書く"""
    s = ctx.sent
    if re.search(r'登録する|投入する|を登録|DBシード', s) and re.search(r'\d+件を登録|\d+件を投入|指定', s):
        return None   # 履歴の登録(INSERT)を含む文は別の規則
    if re.search(r'価格履歴|価格変更履歴|在庫変動履歴|ステータス変更履歴|欠品|在庫移動|在庫分割|呼出履歴|呼び出し', s):
        return None
    if not re.search(r'取込履歴|インポート履歴|取込種別|種別|履歴', s):
        return None
    t = _import_type(ctx, s)
    mf = file_names(s)
    how = '文に書かれたファイル名'
    if not mf and re.search(r'同名', s):
        mf = _state_files(ctx)
        how = '状態・属性に書かれたこのシードの取込ファイル名'
    if not mf:
        _n = []
        g = type_gap(t, _n) if t else ''
        raise Unsupported((type_all_delete_reason(t) if t else '全件削除: 取込種別が決まらず、範囲を絞れない（全件削除のため SQL は用意していない）') + ''.join('／' + x for x in _n), gap=g)
    sql = []
    tw = (" AND csv_import_type_id = %d" % t) if t else ''
    for f in mf:
        sql += del_tree('dtb_csv_import_history', "file_name = %s%s" % (qs(f), tw))
    notes = ['%s（%s）の取込履歴だけを消す%s。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す' % (how, '・'.join(mf), ('（取込種別「%s」に限る）' % TYPE_NAME.get(t, t)) if t else '')]
    unmade = []
    if '退避' in s:
        unmade.append('文は「退避して」と書くが、退避先と戻し方が文に無いため、退避はしていない（このシードのファイル名の行を消すだけ）')
    notes.append('消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「%s」をそのまま使う' % '」「'.join(mf))
    gap = type_gap(t, notes) if t else ''
    return Out(sql, notes, ['dtb_csv_import_history', 'dtb_csv_import_smaregi_job_link'], unmade=unmade, gap=gap)


# ============ 棚番号 ============
@handler(r'^棚番号（((?:棚番号ID=\d+・名称=[^、）]+(?:、)?)+)）は')
def shelf_insert(ctx, m):
    rows = re.findall(r'棚番号ID=(\d+)・名称=([^、）]+)', m.group(1))
    if not rows:
        raise Unsupported('棚番号の読み取り失敗')
    sql = ["INSERT INTO dtb_shelf_number (id, name, sort_no) VALUES (%s, %s, 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;" % (i, qs(n.replace('改行を含む「棚↵東」', '棚\n東'))) for i, n in rows]
    return Out(sql, ['並び順は文に無いので0にした。同じIDがあれば名称を上書きする(流し直しても壊れない)'], ['dtb_shelf_number'])


# ============ 店舗別在庫の削除 ============
SHOP_PAT = r'((?:試験)?店舗[A-Z](?:（[^）]+）)?|[^・、の（）\s／「」]{2,12}?(?:本店|支店|店))'


@handler(r'以外の店舗別在庫は画面で削除できない')
def stock_delete_others(ctx, m):
    s = ctx.sent
    if '全' in s and 'それぞれ' not in s:
        pass
    # 「<コード>の<店舗>・<区分>」の並び
    keeps = re.findall(r'(?:(?<=、)|(?<=と)|^|(?<=・))\s*([A-Za-z0-9][A-Za-z0-9\-_]*)の' + SHOP_PAT + r'・(EC-CUBE|ECCUBE|スマレジ)', s)
    codes = []
    if keeps:
        # 区切りが「…EC-CUBE、…」で、先頭に無い「別名の店舗・区分」（同じコードの続き）も拾う
        pass
    mm = re.match(r'^(.*?)以外の店舗別在庫', s)
    head = mm.group(1)
    # 例: A の東京本店・EC-CUBE、B の東京本店・EC-CUBE / A の東京本店・EC-CUBE、大阪支店・EC-CUBE
    parts = re.split(r'、(?=[A-Za-z0-9])|と(?=[A-Za-z0-9]+[-A-Za-z0-9_]*の)', head)
    items = []   # (コード, [(店舗, 区分)])
    for p in parts:
        mc = re.match(r'^(?:[^A-Za-z0-9]*?)([A-Za-z0-9][A-Za-z0-9\-_]*)の(.+)$', p)
        if not mc:
            continue
        sh = re.findall(SHOP_PAT + r'・(EC-CUBE|ECCUBE|スマレジ)', mc.group(2))
        if sh:
            items.append((mc.group(1), [(clean_shop(a), LOC[b]) for a, b in sh]))
    if not items:
        # 「3件それぞれの東京本店・EC-CUBE以外」「それぞれの…」: 対象コードはこのシードの全商品コード
        sh = re.findall(SHOP_PAT + r'・(EC-CUBE|ECCUBE|スマレジ)', head)
        known = ctx.known_codes()
        if sh and known and re.search(r'それぞれ|各|\d+件', head):
            items = [(c, [(clean_shop(a), LOC[b]) for a, b in sh]) for c in known]
            note_all = True
        else:
            raise Unsupported('残す(商品コード・店舗・在庫区分)の組を文から読み取れない')
    else:
        note_all = False
    sql = []
    for a in dict.fromkeys(a for _c, k_ in items for a, _l in k_):
        sql.append(assert_one(_shop_sql(a)[1], '残す店舗「%s」が1件に決まらない' % a))
    for code, keeps_ in items:
        sql.append(assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(code), '商品コード%sが1件に決まらない' % code))
        for a, l in keeps_:
            sql.append(assert_one("SELECT count(*) FROM dtb_product_stock WHERE product_class_id = %s AND base_info_id = %s AND stock_location_id = %d" % (pc_by_code(code), _shop_sql(a)[0], l), '残す在庫（商品コード%s・店舗%s・在庫区分%d）が1件に決まらない' % (code, a, l)))
        cond = ' OR '.join("(base_info_id = %s AND stock_location_id = %d)" % (_shop_sql(a)[0], l) for a, l in keeps_)
        w = "product_class_id = %s AND NOT (%s)" % (pc_by_code(code), cond)
        sql += del_tree('dtb_product_stock', w)
    notes = ['残す組(店舗・在庫区分)以外の、その商品コードの店舗別在庫だけを消す(ほかの商品の在庫は消さない)。店舗は店舗名で引き、残す店舗・残す在庫がそれぞれ1件に決まることを確かめる']
    if note_all:
        notes.append('「それぞれ」と書くだけで商品コードを挙げていないため、このシードの全ての商品コードに対して行う')
    return Out(sql, notes, ['dtb_product_stock', 'dtb_product_class', 'dtb_base_info'])


@handler(r'全件削除は画面で行えない|既存の在庫移動・振替情報.*全件削除')
def move_delete_all(ctx, m):
    items = [('在庫移動・振替', 'dtb_stock_move_transfer'), ('明細', 'dtb_stock_move_transfer_detail'), ('ステータス変更履歴', 'dtb_stock_move_transfer_status_history')]
    if '在庫移動指示の全件削除' in ctx.sent:
        items.append(('在庫移動指示', 'dtb_stock_move_instruction'))
    raise Unsupported(_all_delete_reason(items))


# ============ 購入グループ(mtb_sell_group) ============
@handler(r'^作成日時・更新日時（([^）]+)）は画面で指定できない')
def sell_group_dates(ctx, m):
    d = m.group(1)
    labs = [l for l in dict.fromkeys(LABEL.findall(ctx.state)) if l.startswith('〔購入グループID-')]
    if len(labs) != 1:
        raise Unsupported('どの購入グループか決まらない(購入グループの呼び名が1つに決まらない)')
    return Out(["UPDATE mtb_sell_group SET create_date = %s, update_date = %s WHERE id = %s;" % (ts(d), ts(d), labs[0])], ['日時は日本時間(+09)'], ['mtb_sell_group'])


@handler(r'^名称（日）「([^」]+)」の削除日時（([^）]+)）は画面で指定できない')
def sell_group_deleted(ctx, m):
    n, d = m.group(1), m.group(2)
    return Out([assert_one("SELECT count(*) FROM mtb_sell_group WHERE name = %s" % qs(n), '購入グループ「%s」が1件に決まらない' % n),
                "UPDATE mtb_sell_group SET deleted_at = %s WHERE name = %s;" % (ts(d), qs(n))], ['日時は日本時間(+09)'], ['mtb_sell_group'])


@handler(r'購入グループ.*行.*削除は画面で指定できない|購入グループID \d+の行が残っているときの行の削除')
def sell_group_delete(ctx, m):
    s = ctx.sent
    names = re.findall(r'名称（日）「([^」]+)」', s) + re.findall(r'名称（英）「([^」]+)」', s)
    mid = re.search(r'購入グループID (\d+)の行', s)
    conds = []
    if names:
        ja = re.findall(r'名称（日）「([^」]+)」', s)
        en = re.findall(r'名称（英）「([^」]+)」', s)
        conds += ["name IN (%s)" % ', '.join(qs(x) for x in ja)] if ja else []
        conds += ["name_en IN (%s)" % ', '.join(qs(x) for x in en)] if en else []
    if mid:
        conds.append("id = %s" % mid.group(1))
    if not conds:
        raise Unsupported('消す購入グループを文から決められない')
    w = ' OR '.join(conds)
    return Out(del_tree('mtb_sell_group', w), ['削除済みの行を含め、名称(または番号)が一致する購入グループだけを消す'], ['mtb_sell_group'])


# ============ 取込履歴の登録(連番) ============
import datetime as _dt


def _range_names(text):
    """'history01-003.csv〜history11-003.csv' → (前置き, 桁数, 始点, 終点, 後置き)"""
    m = re.search(r'([A-Za-z0-9_\-\.]*?)(\d+)([A-Za-z0-9_\-\.]*\.(?:csv|tsv))〜\1(\d+)\3', text)
    if not m:
        return None
    return m.group(1), len(m.group(2)), int(m.group(2)), int(m.group(4)), m.group(3)


def _pdt(d, t=None):
    """'2026-08-03 10:00:49' / ('2026-08-03', '10:00') → datetime"""
    s = (d + ' ' + t) if t else d
    for f in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            return _dt.datetime.strptime(s.strip(), f)
        except ValueError:
            pass
    raise Unsupported('日時の形を読めない: ' + s)


def _hist_times(st, n):
    """状態・属性から履歴 n 件の日時(番号順)を読む。戻り値 (日時のリスト, 説明)。読めなければ None"""
    D = r'(\d{4}-\d{2}-\d{2})'
    T = r'(\d{2}:\d{2}(?::\d{2})?)'
    # 区間ごとの指定(「001〜006の6件は全て2026-08-04 10:01:00」「007〜010は10:02〜10:05の1分間隔」)
    segs = list(re.finditer(r'(\d{3})〜(\d{3})(?:の\d+件)?は(全て)?(?:' + D + r' )?' + T + r'(?:（[^）]*）)?(?:〜' + T + r')?', st))
    if segs:
        day = re.search(D, st).group(1)
        out = [None] * n
        for sg in segs:
            a, b = int(sg.group(1)), int(sg.group(2))
            d = sg.group(4) or day
            t0 = _pdt(d, sg.group(5))
            t1 = _pdt(d, sg.group(6)) if sg.group(6) else t0
            k = b - a
            for i in range(a, b + 1):
                if 1 <= i <= n:
                    out[i - 1] = t0 + (t1 - t0) * ((i - a) / k if k else 0)
        if all(out):
            return out, '状態・属性の区間ごとの日時のとおり'
        return None
    mr = re.search(D + r' ' + T + r'(?:（[^）]*）)?(?:〜|から)(?:' + D + r' )?' + T + r'まで?', st) or re.search(D + r' ' + T + r'〜(?:' + D + r' )?' + T, st)
    if mr:
        t0 = _pdt(mr.group(1), mr.group(2))
        t1 = _pdt(mr.group(3) or mr.group(1), mr.group(4))
        if n == 1:
            return [t0], '%s' % t0
        step = (t1 - t0) / (n - 1)
        return [t0 + step * i for i in range(n)], '%s から %s まで等間隔（%s 間隔）' % (t0, t1, abs(step))
    m1 = re.search(D + r' ' + T, st)
    if m1:
        t0 = _pdt(m1.group(1), m1.group(2))
        older = bool(re.search(r'1分ずつ古く', st))
        unit = _dt.timedelta(seconds=1) if re.search(r'1秒間隔|1秒ずつ', st) else _dt.timedelta(minutes=1)
        sign = -1 if older else 1
        return [t0 + unit * sign * i for i in range(n)], '%s から%sずつ%s' % (t0, '1秒' if unit.seconds == 1 else '1分', '古くなる' if older else '新しくなる')
    return None


def _member_lookup(ctx, mid=None, name=None):
    """作業者の管理者。戻り値 (SQL式, 確認SQLのリスト, 備考, 作れない部分)"""
    if name:
        e = "(SELECT id FROM dtb_member WHERE name = %s)" % qs(name)
        return e, [assert_one("SELECT count(*) FROM dtb_member WHERE name = %s" % qs(name), '作業者の管理者「%s」が1件に決まらない' % name)], '作業者は管理者の名前「%s」で引く（1件に決まることを確かめる）' % name, None
    # 同じ機能の管理者シードに「管理者ID=N」とログインIDが書かれていれば、ログインIDで引く(画面の登録では番号を指定できないため)
    import csv as _csv, os as _os2
    path = _os2.path.join(_os2.path.dirname(_os2.path.dirname(_os2.path.dirname(_os2.path.abspath(__file__)))), 'integration_test', 'casegen', 'cases', '%s_seed_data.tsv' % ctx.fid)
    try:
        rows = list(_csv.reader(open(path, encoding='utf-8'), delimiter='\t'))[1:]
    except OSError:
        rows = []
    for r in rows:
        if r[0] != ctx.sid and '管理者' in r[1] and re.search(r'(?:管理者|利用者)ID[=＝]%s(?!\d)' % mid, r[3]):
            ml = re.search(r'ログインID[=＝]([A-Za-z0-9_\-\.]+)', r[3])
            if ml:
                e = "(SELECT id FROM dtb_member WHERE login_id = %s)" % qs(ml.group(1))
                return e, [assert_one("SELECT count(*) FROM dtb_member WHERE login_id = %s" % qs(ml.group(1)), '作業者の管理者（ログインID %s）が1件に決まらない' % ml.group(1))], \
                    '作業者の管理者ID=%s は、管理者シード %s が画面で登録する管理者（画面では番号を指定できない）。同じ管理者をログインID %s で引く' % (mid, r[0], ml.group(1)), None
    e = "(SELECT id FROM dtb_member WHERE id = %s)" % mid
    return e, [assert_one("SELECT count(*) FROM dtb_member WHERE id = %s" % mid, '作業者の管理者（番号%s）が1件に決まらない' % mid)], \
        '作業者は管理者の番号%sで引く（その番号の管理者が無ければ止まる）' % mid, \
        '作業者の管理者（番号%s）を作るシードが無く、画面では管理者の番号を指定できないため、その番号の管理者がいる状態を作れない（このSQLはその管理者が無いと確認で止まる）' % mid


def _hist_spec(st):
    """状態・属性から、取込履歴の行の仕様を読む。dict(ids, big, names, n)"""
    sp = {}
    ml = re.search(r'履歴ID[ =]?(\d{6,}(?:・\d{6,})+)', st)
    mr = re.search(r'(?:履歴ID|取込履歴ID|ID)[ =]?(\d{6,})〜(\d{6,})', st)
    if ml:
        sp['ids'] = [int(x) for x in ml.group(1).split('・')]
    elif mr:
        sp['ids'] = list(range(int(mr.group(1)), int(mr.group(2)) + 1)) if int(mr.group(2)) - int(mr.group(1)) < 100000 else None
        sp['idrange'] = (int(mr.group(1)), int(mr.group(2)))
    rn = _range_names(st)
    mg = re.search(r'専用履歴ID=([A-Za-z]+-)(\d+)(-\d+)〜\1(\d+)\3', st)
    mf = re.search(r'ファイル名[=＝]?([^／]+)', st)
    if rn:
        sp['names'] = ('range',) + rn
    elif mg:
        sp['names'] = ('range', mg.group(1), len(mg.group(2)), int(mg.group(2)), int(mg.group(4)), mg.group(3))
        sp['names_from_id'] = True
    elif mf and re.search(r'\.(?:csv|tsv)', mf.group(1)):
        lst = [x.strip() for x in re.split(r'[、,]', mf.group(1)) if x.strip()]
        if all(re.search(r'\.(?:csv|tsv)$', x) for x in lst):
            sp['names'] = ('list', lst)
    return sp


@handler(r'(?:履歴|取込履歴).*(?:\d+件|指定).*(?:登録|投入)|DBシードで.*履歴.*(?:登録|投入)')
def csv_hist_insert(ctx, m):
    """状態・属性に書かれた番号・ファイル名・日時・作業者の取込履歴を作る。先に消すのは、この番号・このファイル名の行(このシードの行)だけ。
    「この種別の履歴はこれだけ」にするための既存の行の削除は全件削除なので作らず、作れない部分として件数とともに書く"""
    s = ctx.sent
    if not re.search(r'登録する|投入する|登録した|投入し', s):
        return None
    if re.search(r'価格履歴|在庫変動履歴|欠品|在庫移動|在庫分割', s) and not re.search(r'取込履歴|CSV履歴|種別', s):
        return None
    st = ctx.state
    t = _import_type(ctx, s) or _import_type(ctx, st)
    if t is None:
        raise Unsupported('取込種別が決まらない')
    sp = _hist_spec(st)
    nm = sp.get('names')
    if nm is None:
        raise Unsupported('ファイル名の範囲・一覧を状態・属性から読めない')
    n = len(nm[1]) if nm[0] == 'list' else nm[4] - nm[3] + 1
    names = nm[1] if nm[0] == 'list' else ['%s%s%s' % (nm[1], str(nm[3] + i).zfill(nm[2]), nm[5]) for i in range(n)]
    notes, unmade = [], []
    gap = ''
    if sp.get('names_from_id'):
        notes.append('状態・属性の「専用履歴ID=%s…」は番号の形でない（履歴の番号は整数）ため、ファイル名に入れて区別した（%s など。文に無い決め方）。番号は表の連番' % (names[0], names[0] + '.csv'))
        names = [x + '.csv' for x in names]
    # 番号
    ids = sp.get('ids')
    rng = sp.get('idrange')
    if ids is not None and len(ids) != n:
        raise Unsupported('履歴の件数(%d)とファイル名の件数(%d)が合わない' % (len(ids), n))
    if rng and rng[1] - rng[0] + 1 != n:
        raise Unsupported('履歴の番号の範囲(%d件)とファイル名の件数(%d)が合わない' % (rng[1] - rng[0] + 1, n))
    big = bool(rng and rng[1] > INT_MAX) or bool(ids and max(ids) > INT_MAX)
    if big:
        gap = '番号が現行のDBの型の上限を超える'
        unmade.append('状態・属性の履歴の番号（%s〜）は、現行のDBの取込履歴の番号の型（integer、上限2147483647）を超えるため、その番号では作れない（番号の型の上限を超える。設計と実装の差の候補）。番号は表の連番にした' % (rng[0] if rng else ids[0]))
        id_expr = "nextval(pg_get_serial_sequence('dtb_csv_import_history', 'id'))"
    elif ids is not None or rng:
        id_expr = '%d + g' % rng[0] if (rng and ids is None) or (ids and ids == list(range(ids[0], ids[0] + n))) else '(ARRAY[%s])[g + 1]' % ','.join(str(x) for x in ids)
        if rng and ids is None:
            id_expr = '%d + g' % rng[0]
    else:
        id_expr = "nextval(pg_get_serial_sequence('dtb_csv_import_history', 'id'))"
        notes.append('番号は文に無いので、表の連番にした')
    # 日時
    tm = _hist_times(st, n)
    if tm is None:
        if re.search(r'1分ずつ昇順|日時は全件異なる|作成日時は番号順', st):
            base = _dt.datetime(2026, 8, 1, 0, 0)
            times = [base + _dt.timedelta(minutes=i) for i in range(n)]
            notes.append('日時の値は文に無い（「番号順に1分ずつ昇順」「全件異なる」とだけ書く）ので、2026-08-01 00:00（日本時間）から番号順に1分ずつにした（文に無い値）')
        else:
            raise Unsupported('取込日時を状態・属性から読めない')
    else:
        times, dnote = tm
        notes.append('日時は日本時間(+09)で、' + dnote)
    if n <= 200:
        date_expr = '(ARRAY[%s])[g + 1]' % ','.join(ts(x.strftime('%Y-%m-%d %H:%M:%S')) for x in times)
    else:
        step = (times[-1] - times[0]) / (n - 1)
        if any(abs((times[i] - times[0]) - step * i) > _dt.timedelta(microseconds=1) for i in range(0, n, max(1, n // 50))):
            raise Unsupported('件数が多く、日時が等間隔でない')
        date_expr = "%s + g * interval '%d seconds'" % (ts(times[0].strftime('%Y-%m-%d %H:%M:%S')), int(step.total_seconds()))
    # 作業者
    sql = []
    mem_default = 'NULL'
    special = {}
    mw = re.search(r'(\d{2}:\d{2})の履歴の作業者は管理者ID[=＝](\d+)・([^／]+)', st)
    mo = re.search(r'他\d+件の作業者は([^／]+)', st)
    mn = re.search(r'作業者[=＝]([^／]+)', st)
    mi = re.search(r'作業者(?:利用者)?ID[=＝]?(\d+)|担当者ID[=＝]?(\d+)', st)
    if mw:
        hm = mw.group(1)
        idx = [i for i, x in enumerate(times) if x.strftime('%H:%M') == hm]
        if len(idx) != 1:
            raise Unsupported('「%sの履歴」が1件に決まらない' % hm)
        e, chk, note, um = _member_lookup(ctx, mid=mw.group(2))
        sql += [assert_one("SELECT count(*) FROM dtb_member WHERE id = %s AND name = %s" % (mw.group(2), qs(mw.group(3).strip())), '作業者の管理者（番号%s・名前「%s」）が1件に決まらない' % (mw.group(2), mw.group(3).strip()))]
        special[idx[0]] = e
        notes.append('%sの履歴の作業者は管理者ID=%s・%s（番号と名前の両方が合う管理者が1件あることを確かめる）' % (hm, mw.group(2), mw.group(3).strip()))
        unmade.append('作業者の管理者（管理者ID=%s・%s・退会済）の登録: 管理者の行には所属・店舗・メールアドレス・ログインID・パスワードが要るが文に無く（パスワードは書かない決まり）、退会済の表し方も文に無いため作れない。画面では管理者の番号を指定できない。この管理者が無いと、このSQLは確認で止まる' % (mw.group(2), mw.group(3).strip()))
        if mo:
            e2, chk2, note2, um2 = _member_lookup(ctx, name=mo.group(1).strip())
            sql += chk2
            mem_default = e2
            notes.append('ほかの履歴の' + note2)
        else:
            notes.append('ほかの履歴の作業者は文に無いので空にした')
    elif mn and not re.match(r'^\d', mn.group(1)):
        e, chk, note, um = _member_lookup(ctx, name=mn.group(1).strip())
        sql += chk
        mem_default = e
        notes.append(note)
    elif mi:
        e, chk, note, um = _member_lookup(ctx, mid=mi.group(1) or mi.group(2))
        sql += chk
        mem_default = e
        notes.append(note)
        if um:
            unmade.append(um)
    mem_expr = mem_default
    if special:
        mem_expr = 'CASE %s ELSE %s END' % (' '.join('WHEN g = %d THEN %s' % (i, e) for i, e in special.items()), mem_default)
    # このシードの行(同じ番号・同じ種別の同じファイル名)だけを先に消す(流し直し)
    own = []
    if not big and (ids is not None or rng):
        own.append(("id BETWEEN %d AND %d" % (rng[0], rng[1])) if (rng and (ids is None or ids == list(range(rng[0], rng[1] + 1)))) else "id IN (%s)" % ','.join(str(x) for x in ids))
    if nm[0] == 'range' and not sp.get('names_from_id'):
        own.append("(csv_import_type_id = %d AND file_name ~ %s)" % (t, qs('^' + re.escape(nm[1]) + '[0-9]{%d}' % nm[2] + re.escape(nm[5]) + '$')))
    else:
        own.append("(csv_import_type_id = %d AND file_name IN (%s))" % (t, ','.join(qs(x) for x in names)) if n <= 200 else "(csv_import_type_id = %d AND file_name = ANY(ARRAY[%s]))" % (t, ','.join(qs(x) for x in names)))
    sql.append('-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない')
    sql += del_tree('dtb_csv_import_history', ' OR '.join(own))
    if nm[0] == 'range' and not sp.get('names_from_id'):
        name_expr = "%s || lpad((%d + g)::text, %d, '0') || %s" % (qs(nm[1]), nm[3], nm[2], qs(nm[5]))
    else:
        name_expr = '(ARRAY[%s])[g + 1]' % ','.join(qs(x) for x in names)
    sql.append("INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT %s, %d, %s, %s, %s FROM generate_series(0, %d) AS g;" % (id_expr, t, mem_expr, name_expr, date_expr, n - 1))
    notes.insert(0, '取込種別「%s」の履歴 %d 件（%s）を作る' % (TYPE_NAME.get(t, t), n, ('番号 %s〜' % (rng[0] if rng else ids[0])) if (rng or ids) and not big else '番号は表の連番'))
    # 全件削除(その種別の既存の行を消す)の部分
    if re.search(r'だけ|他(?:の)?(?:取込)?履歴[=＝]?0件|他の取込履歴|他履歴0件|の他の履歴=0件|既存|退避|0件にして|0件に', st + s):
        unmade.append(type_all_delete_reason(t, 'ほかの'))
    if re.search(r'他(?:の)?(?:取込|CSV)?種別の履歴(?:ID|は0件)|他CSV種別', st + s):
        if re.search(r'他CSV種別の履歴は0件|他CSV種別の履歴を0件', st + s):
            unmade.append('ほかの取込種別の履歴0件: 全件削除のため SQL は用意していない（渡したダンプの直後のほかの種別の取込履歴は合計%s件。この状態にするには既存の行を消す必要がある）' % (sum(v for k, v in (_COUNTS.get('csv_import_history_by_type') or {}).items() if int(k) != t)))
        else:
            unmade.append('ほかの取込種別の履歴の登録: どの取込種別か文に書かれていないため作っていない')
    if '退避' in s and '復元' in s:
        unmade.append('ケース終了後の退避分の復元: 退避先と戻し方が文に無く、退避もしていないため作っていない')
    if re.search(r'カード商品CSV取込履歴[=＝](\d+)件', st) and t != 1:
        k = int(re.search(r'カード商品CSV取込履歴[=＝](\d+)件', st).group(1))
        cn = ['%s-card-%d.csv' % (ctx.sid, i + 1) for i in range(k)]
        sql.append('-- カード商品CSV取込履歴%d件（文に件数だけ書かれている。ファイル名・日時は文に無いので決めた値）' % k)
        sql += del_tree('dtb_csv_import_history', "csv_import_type_id = 1 AND file_name IN (%s)" % ','.join(qs(x) for x in cn))
        sql.append("INSERT INTO dtb_csv_import_history (csv_import_type_id, member_id, file_name, create_date) SELECT 1, NULL, (ARRAY[%s])[g + 1], %s + g * interval '1 minute' FROM generate_series(0, %d) AS g;" % (','.join(qs(x) for x in cn), ts('2026-08-01 00:00'), k - 1))
        notes.append('カード商品CSV取込履歴%d件も作る（ファイル名 %s、日時 2026-08-01 00:00 から1分ずつ、作業者なし。いずれも文に無い値）' % (k, '・'.join(cn)))
        unmade.append(type_all_delete_reason(1, 'ほかの') + '（カード商品CSV取込履歴を%d件だけにするため）' % k)
    g2 = type_gap(t, notes)
    gap = '／'.join(x for x in (gap, g2) if x)
    return Out(sql, notes, ['dtb_csv_import_history', 'dtb_csv_import_smaregi_job_link', 'dtb_member'], unmade=unmade, gap=gap)


# ============ 会員と入荷通知依頼 ============
EMAIL = r'[A-Za-z0-9._\-]+@[A-Za-z0-9.\-]+[A-Za-z]'


def _notify_specs(ctx):
    """状態・属性から、会員ごとの(メールアドレス, 仮会員か, 商品コード)を読む。商品コードはメールアドレスより後ろで最初に出てくる「<コード>の(商品)規格」"""
    st = ctx.state
    out = []
    ems = list(re.finditer(EMAIL, st))
    for i, m in enumerate(ems):
        e = m.group(0)
        lo = ems[i - 1].end() if i > 0 else max(st.rfind('。', 0, m.start()), st.rfind('／', 0, m.start()), 0)
        hi_next = ems[i + 1].start() if i + 1 < len(ems) else len(st)
        around = st[lo:m.start()] + st[m.end():min(hi_next, m.end() + 20)]
        kari = '仮会員' in around
        mc = re.search(r'(?:商品)?([A-Za-z0-9][A-Za-z0-9\-_]*)の(?:商品)?規格に', st[m.end():])
        out.append((e, kari, mc.group(1) if mc else None))
    return out


@handler(r'入荷通知依頼')
def notify_request(ctx, m):
    """会員(メールアドレスごと)と、その会員の入荷通知依頼。会員の数・依頼の数・対象の規格は会員ごとに状態・属性から読む("会員2件"は会員の数で、依頼の数ではない)"""
    s = ctx.sent
    emails = list(dict.fromkeys(re.findall(EMAIL, s)))
    specs = _notify_specs(ctx)
    if not emails:
        emails = [e for e, _, _ in specs]
    if not emails:
        raise Unsupported('会員のメールアドレスが文にも状態・属性にも無い')
    spec_of = {e: (k, c) for e, k, c in specs}
    # 依頼の件数(会員1人あたり)
    mz = re.search(r'入荷通知依頼を(?:通知待ちで)?(\d+)件ずつ', ctx.state)
    mn = re.search(r'入荷通知依頼を(?:通知待ちで)?(\d+)件', ctx.state) or re.search(r'入荷通知依頼（[^）]*）(\d+)件', s) or re.search(r'入荷通知依頼を(?:通知待ちで)?(\d+)件', s)
    if mz:
        cnt = int(mz.group(1))
    elif mn:
        if len(emails) > 1:
            raise Unsupported('入荷通知依頼の件数が会員ごとか合計か、文・状態・属性から決まらない')
        cnt = int(mn.group(1))
    else:
        cnt = 1
    done = '通知済み' in s
    sql = []
    notes = []
    for e in emails:
        kari, code = spec_of.get(e, ('仮会員' in s, None))
        if code is None:
            codes = [c for c in ctx.known_codes() if c in s]
            code = codes[0] if len(codes) == 1 else None
        if code is None:
            raise Unsupported('メールアドレス %s の会員の入荷通知依頼の対象の商品規格(商品コード)が決まらない' % e)
        status = 1 if kari else 2
        sql += [
            assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(code), '商品コード%sが1件に決まらない' % code),
            "INSERT INTO dtb_customer (customer_status_id, name01, name02, email, password, secret_key, create_date, update_date) "
            "SELECT %d, '試験', '会員', %s, 'NO-LOGIN', md5(%s), now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_customer WHERE email = %s);" % (status, qs(e), qs(e), qs(e)),
            assert_one("SELECT count(*) FROM dtb_customer WHERE email = %s" % qs(e), '会員(メールアドレス %s)が1件に決まらない' % e),
            "UPDATE dtb_customer SET customer_status_id = %d WHERE email = %s;" % (status, qs(e)),
            "INSERT INTO dtb_player (customer_id, email, create_date, update_date) "
            "SELECT (SELECT id FROM dtb_customer WHERE email = %s), %s, now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_player WHERE email = %s);" % (qs(e), qs(e), qs(e)),
            assert_one("SELECT count(*) FROM dtb_player WHERE email = %s" % qs(e), '会員(メールアドレス %s)のプレイヤーが1件に決まらない' % e),
            "DELETE FROM dtb_product_request WHERE player_id = (SELECT id FROM dtb_player WHERE email = %s) AND product_class_id = %s;" % (qs(e), pc_by_code(code)),
            "INSERT INTO dtb_product_request (product_class_id, product_id, language_id, player_id, create_date, deleted_at) "
            "SELECT c.id, c.product_id, c.language_id, (SELECT id FROM dtb_player WHERE email = %s), now(), %s FROM dtb_product_class c, generate_series(1, %d) AS g WHERE c.product_code = %s;" % (qs(e), 'now()' if done else 'NULL', cnt, qs(code))]
        notes.append('%s: %s(顧客状態 %d)・依頼の対象は商品コード %s・%s%d件' % (e, '仮会員' if kari else '本会員（利用可能）', status, code, '通知済み' if done else '通知待ち', cnt))
    notes.append('会員の氏名・パスワードは文に無いので、ログインできない仮の値にした。同じ会員・規格の依頼は先に消してから作り直す（ほかの会員・規格の依頼は消さない）')
    return Out(sql, notes, ['dtb_customer', 'dtb_player', 'dtb_product_request', 'dtb_product_class'])


# ============ 部門(スマレジ連携先部門ID) ============
@handler(r'スマレジ連携先部門IDは登録時の連携で自動的に入り.*〔(部門ID-[^〕]+)〕の部門のスマレジ連携先部門IDを空にする')
def section_smaregi(ctx, m):
    return Out(["UPDATE mtb_section SET smaregi_category_id = NULL WHERE id = 〔%s〕;" % m.group(1)], [], ['mtb_section'])


# ============ 原価単価・発送日目安 ============
@handler(r'原価単価[=＝]\s*(\d+)は画面で指定できない')
def cost_unit(ctx, m):
    s = ctx.sent
    n = int(m.group(1))
    tg, allf = ctx.targets()
    main = "(SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop)"
    sql = [assert_one("SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop", '本店（本店かつ公開の店舗）が1件に決まらない')]

    def b(e):
        out = ["UPDATE dtb_product_stock SET stock = GREATEST(stock, 1), total_cost = %d * GREATEST(stock, 1) WHERE product_class_id = %s AND base_info_id = %s AND stock_location_id = 1;" % (n, e, main)]
        md = re.search(r'発送日目安ID[=＝]\s*(\d+)', s)
        if md:
            out.append(assert_one("SELECT count(*) FROM dtb_delivery_duration WHERE id = %s" % md.group(1), '発送日目安（番号%s）が1件に決まらない（先に発送日目安を登録しておく）' % md.group(1)))
            out.append("UPDATE dtb_product_class SET delivery_duration_id = %s WHERE id = %s;" % (md.group(1), e))
        return out
    sql += _each(tg, b)
    notes = ['原価単価は「本店・EC-CUBEの在庫の総原価÷在庫数」(アプリの定義)。在庫数が0のときは在庫1にして総原価%d、在庫があるときはその在庫数×%d にした' % (n, n)] + _note_all(ctx, allf, len(tg))
    if re.search(r'発送日目安ID', s):
        notes.append('発送日目安の番号は文のとおり。その番号の発送日目安の行が無ければ確認で止まる。{{作るシード:dtb_delivery_duration:%s}}' % re.search(r'発送日目安ID[=＝]\s*(\d+)', s).group(1))
    return Out(sql, notes, ['dtb_product_stock', 'dtb_product_class', 'dtb_base_info'])


@handler(r'^規格の発送日目安ID[=＝]\s*(\d+)は画面で指定できない')
def delivery_duration_only(ctx, m):
    tg, allf = ctx.targets()
    sql = [assert_one("SELECT count(*) FROM dtb_delivery_duration WHERE id = %s" % m.group(1), '発送日目安（番号%s）が1件に決まらない（先に発送日目安を登録しておく）' % m.group(1))]
    sql += _each(tg, lambda e: ["UPDATE dtb_product_class SET delivery_duration_id = %s WHERE id = %s;" % (m.group(1), e)])
    return Out(sql, _note_all(ctx, allf, len(tg)) + ['発送日目安の番号は文のとおり。その番号の発送日目安が無ければ確認で止まる。{{作るシード:dtb_delivery_duration:%s}}' % m.group(1)], ['dtb_product_class', 'dtb_delivery_duration'])


# ============ 販売割引率・買取減額率(マスタ) ============
COND = {'NM': 'NM', 'SP': 'SP', 'MP': 'MP', 'HP': 'HP'}


def _discount(kind, name, rid, rates):
    tb = 'mtb_discount' if kind == 'sell' else 'mtb_buy_discount'
    ct = 'dtb_discount_card_condition' if kind == 'sell' else 'dtb_buy_discount_card_condition'
    fk = 'discount_id' if kind == 'sell' else 'buy_discount_id'
    sql = []
    if rid:
        sql.append("INSERT INTO %s (id, name) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;" % (tb, rid, qs(name)))
    else:
        sql.append("INSERT INTO %s (name) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM %s WHERE name = %s);" % (tb, qs(name), tb, qs(name)))
    sql.append(assert_one("SELECT count(*) FROM %s WHERE name = %s" % (tb, qs(name)), '%s「%s」が1件に決まらない' % ('販売割引率' if kind == 'sell' else '買取減額率', name)))
    if rates:
        sql.append("DELETE FROM %s WHERE %s = (SELECT id FROM %s WHERE name = %s);" % (ct, fk, tb, qs(name)))
        for cond, pct in rates:
            sql.append("INSERT INTO %s (%s, card_condition_id, rate) SELECT d.id, c.id, %s FROM %s d, mtb_card_condition c WHERE d.name = %s AND c.code = %s;" % (ct, fk, ('%.2f' % (pct / 100.0)), tb, qs(name), qs(cond)))
    return sql, [tb, ct, 'mtb_card_condition']


@handler(r'(販売割引率|買取減額率)(?:「([^」]+)」|（ID (\d+)「([^」]+)」）)(?:（([^）]*(?:（[^）]*）)?[^）]*)）)?[^。]*(?:画面が無く|登録する画面が無い|画面で指定できない)')
def discount_master(ctx, m):
    s = ctx.sent
    sql, tabs, notes = [], [], []
    for mm in re.finditer(r'(販売割引率|買取減額率)(?:「([^」]+)」|（ID (\d+)「([^」]+)」）)(?:（((?:[^（）]|（[^）]*）)*)）)?', s):
        kind = 'sell' if mm.group(1) == '販売割引率' else 'buy'
        name = mm.group(2) or mm.group(4)
        rid = mm.group(3)
        attr = mm.group(5) or ''
        rates = [(c, int(p)) for c, p in re.findall(r'(NM|SP|MP|HP)の?率[=＝]?(\d+)%', attr)]
        if not rates:
            rates = [(c, int(p)) for c, p in re.findall(r'(?:カード状態)?(NM|SP|MP|HP)の率[=＝]?(\d+)%', attr)]
        if not rates and attr:
            raise Unsupported('率の書き方を読めない: ' + attr)
        a, t = _discount(kind, name, rid, rates)
        sql += a
        tabs += t
        if not rates:
            notes.append('「%s」: 文が率を書かないため、マスタの行だけ作った(カード状態ごとの率は作っていない)' % name)
        else:
            notes.append('「%s」: 書かれたカード状態(%s)の率だけを作った。率は%%を100で割った値(95%%→0.95)。書かれていない状態の率は作っていない' % (name, '・'.join(c for c, _ in rates)))
    if not sql:
        return None
    return Out(sql, notes, tabs)


# ============ 規格の更新日時 ============
@handler(r'^(?:【DB直接】)?(?:商品)?(?:規格(?:の)?)?(?:更新日時|更新日)(?:[=＝]|（)(\d{4}[-/]\d{2}[-/]\d{2}(?: \d{2}:\d{2}(?::\d{2})?)?)(?: JST)?）?は')
def class_update_date(ctx, m):
    tg, allf = ctx.targets()
    d = m.group(1)
    sql = _each(tg, lambda e: ["UPDATE dtb_product_class SET update_date = %s WHERE id = %s;" % (ts(d), e)])
    return Out(sql, _note_all(ctx, allf, len(tg)) + ['日時は日本時間(+09)'], ['dtb_product_class'])


@handler(r'所属が属する店舗|店舗・所属関係ID')
def dept_shop_missing(ctx, m):
    raise Unsupported(_fallback_reason(ctx.sent), gap='現行のDBに設定先の表・列が無い')


# ============ 発送日目安・部門未設定・規格の削除・棚番号の名称 ============
def _duration_days(name):
    if name == '翌日':
        return 1
    m = re.match(r'^(\d+)日後$', name)
    return int(m.group(1)) if m else None


@handler(r'^発送日目安（(?:商品コード)?.*(?:ID \d+・名称 [^、）]+).*）は画面で指定できない')
def delivery_duration_master(ctx, m):
    s = ctx.sent
    sql = [assert_one("SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop", '本店（本店かつ公開の店舗）が1件に決まらない')]
    notes = ['発送日目安の行の店舗は本店、日数(duration)は名称から読んだ(翌日=1、N日後=N)、並び順は番号と同じにした(文に無いため)']
    for mm in re.finditer(r'(?:([A-Za-z0-9][A-Za-z0-9\-_]*)の規格は)?ID (\d+)・名称 ([^、）]+)', s):
        code, did, nm = mm.group(1), mm.group(2), mm.group(3).strip()
        days = _duration_days(nm)
        if days is None:
            raise Unsupported('発送日目安の名称「%s」から日数を決められない' % nm)
        sql.append("INSERT INTO dtb_delivery_duration (id, base_info_id, name, duration, sort_no) VALUES (%s, (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop), %s, %d, %s) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, duration = EXCLUDED.duration;" % (did, qs(nm), days, did))
        tgt = code
        if tgt is None:
            tg, allf = ctx.targets()
            for desc, expr, chk in tg:
                if chk:
                    sql.append(assert_one(chk, '商品規格「%s」が1件に決まらない' % desc))
                sql.append("UPDATE dtb_product_class SET delivery_duration_id = %s WHERE id = %s;" % (did, expr))
        else:
            sql.append(assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(tgt), '商品コード%sが1件に決まらない' % tgt))
            sql.append("UPDATE dtb_product_class SET delivery_duration_id = %s WHERE product_code = %s;" % (did, qs(tgt)))
    return Out(sql, notes, ['dtb_delivery_duration', 'dtb_product_class', 'dtb_base_info'])


@handler(r'^商品コード([A-Za-z0-9][A-Za-z0-9\-_]*)の規格の部門未設定は画面で指定できない')
def section_null(ctx, m):
    c = m.group(1)
    return Out([assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(c), '商品コード%sが1件に決まらない' % c),
                "UPDATE dtb_product_class SET section_id = NULL WHERE product_code = %s;" % qs(c)], [], ['dtb_product_class'])


@handler(r'(?:規格コード|商品コード)([A-Za-z0-9][A-Za-z0-9\-_]*)の規格が登録されているときは、DBへ直接操作して削除する')
def class_delete_by_code(ctx, m):
    c = m.group(1)
    o = Out(['-- 商品コード %s の規格だけを消す(依存する行を先に消す)' % c] + del_tree('dtb_product_class', "product_code = %s" % qs(c)), ['該当が無ければ何も消えない'], ['dtb_product_class'])
    others = ctx.how.replace(ctx.sent, '')
    if c not in others and re.search(re.escape(c) + r'の規格は存在しない|' + re.escape(c) + r'.{0,6}(?:存在しない|無い|未登録)', ctx.state):
        o.not_own = '商品コード%sの規格' % c
    return o


@handler(r'^棚番号の名称((?:「[^」]+」)+)は画面で指定できない.*（棚番号ID (\d+)・(\d+)）')
def shelf_names(ctx, m):
    names = re.findall(r'「([^」]+)」', m.group(1))
    ids = [m.group(2), m.group(3)]
    if len(names) != len(ids):
        raise Unsupported('棚番号の名称の数と番号の数が合わない')
    sql = ["INSERT INTO dtb_shelf_number (id, name, sort_no) VALUES (%s, %s, 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;" % (i, qs(n)) for i, n in zip(ids, names)]
    return Out(sql, ['並び順は文に無いので0にした。同じ番号があれば名称を上書きする'], ['dtb_shelf_number'])


# ============ 在庫分割結合の登録日・承認日 ============
@handler(r'在庫分割結合ID-[^〕]+〕.*(?:登録日|=\d{4}/)')
def split_join_dates(ctx, m):
    s = ctx.sent
    if '承認日' in s and '承認者' not in s and '登録日' not in s:
        return None
    pairs = re.findall(r'(〔在庫分割結合ID-[^〕]+〕)(?:の登録日|=)\s*(\d{4}/\d{1,2}/\d{1,2}(?: \d{1,2}:\d{2})?)', s)
    sql = []
    if not pairs:
        mr = re.search(r'(〔在庫分割結合ID-([^〕]*?)(\d+)〕)の(\d{4}/\d{1,2}/\d{1,2} \d{1,2}:\d{2})から(〔在庫分割結合ID-[^〕]*?(\d+)〕)の(\d{4}/\d{1,2}/\d{1,2} \d{1,2}:\d{2})まで、登録した順に1分刻み', s)
        if not mr:
            return None
        pre, a_s, t0 = mr.group(2), mr.group(3), mr.group(4)
        a, b = int(a_s), int(mr.group(6))
        for k in range(a, b + 1):
            sql.append("UPDATE dtb_stock_split_join SET create_date = %s + interval '%d minute' WHERE id = 〔在庫分割結合ID-%s%s〕;" % (ts(t0), k - a, pre, str(k).zfill(len(a_s))))
        return Out(sql, ['番号順に1分刻みの登録日。日時は日本時間(+09)'], ['dtb_stock_split_join'])
    for lab, d in pairs:
        sql.append("UPDATE dtb_stock_split_join SET create_date = %s WHERE id = %s;" % (ts(d), lab))
    return Out(sql, ['登録日だけを変える。日時は日本時間(+09)'], ['dtb_stock_split_join'])


@handler(r'在庫分割結合ID-[^〕]+〕の(?:承認者=([^と]+)と)?承認日(\d{4}/\d{1,2}/\d{1,2}(?: \d{1,2}:\d{2})?)')
def split_join_approval(ctx, m):
    lab = re.search(r'〔在庫分割結合ID-[^〕]+〕', ctx.sent).group(0)
    who, d = m.group(1), m.group(2)
    sql = []
    sets = ["move_to_approval_at = %s" % ts(d)]
    if who:
        sql.append(assert_one("SELECT count(*) FROM dtb_member WHERE name = %s" % qs(who), '管理者「%s」が1件に決まらない' % who))
        sets.append("move_to_approval_member_id = (SELECT id FROM dtb_member WHERE name = %s)" % qs(who))
    sql.append("UPDATE dtb_stock_split_join SET %s WHERE id = %s;" % (', '.join(sets), lab))
    return Out(sql, ['承認日は日本時間(+09)'] + (['承認者は管理者の名前「%s」で引く' % who] if who else []), ['dtb_stock_split_join', 'dtb_member'])


@handler(r'^(\d+)商品の' + SHOP_RX + r'・(EC-CUBE|スマレジ)の在庫（在庫数(\d+)以上）')
def stock_min_all(ctx, m):
    n, shop, loc, mn = int(m.group(1)), m.group(2), LOC[m.group(3)], m.group(4)
    known = ctx.known_codes()
    if len(known) != n:
        raise Unsupported('「%d商品」に当たる商品コードが状態・属性・投入方法から%d件に決まらない(%d件見つかった)' % (n, n, len(known)))
    sql = []
    for c in known:
        sql += _stock_update(c, shop, loc, ['stock = GREATEST(stock, %s)' % mn])
    return Out(sql, ['在庫数は、%s未満のときだけ%sにする。対象の商品コード: %s' % (mn, mn, '・'.join(known))], ['dtb_product_stock', 'dtb_product_class', 'dtb_base_info'])


# ============ 棚卸詳細・棚卸計画の細かい値 ============
def _plan_asserts(plans):
    """棚卸計画の名前ごとに1件に決まることを確かめる"""
    return [assert_one("SELECT count(*) FROM dtb_inventory_plan WHERE name = %s" % qs(p['name']), '棚卸計画「%s」が1件に決まらない' % p['name']) for p in plans]


def _plan_ids_expr(plans):
    names = [p['name'] for p in plans]
    return "(SELECT id FROM dtb_inventory_plan WHERE name IN (%s))" % ', '.join(qs(n) for n in names)


@handler(r'^棚卸詳細の最終更新日（((?:[A-Za-z0-9]+は\d{4}[-/]\d{2}[-/]\d{2} \d{2}:\d{2}:\d{2}(?:、)?)+)）は画面で指定できない')
def plan_detail_update_by_code(ctx, m):
    plans = ctx.plans()
    if not plans:
        raise Unsupported('棚卸計画の名前が文にも状態・属性にも無い')
    sql = []
    for code, d in re.findall(r'([A-Za-z0-9]+)は(\d{4}[-/]\d{2}[-/]\d{2} \d{2}:\d{2}:\d{2})', m.group(1)):
        w = "inventory_plan_id IN %s AND product_stock_id IN (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = %s)" % (_plan_ids_expr(plans), qs(code))
        sql.append(assert_one("SELECT count(*) FROM dtb_inventory_plan_detail WHERE %s" % w, '棚卸計画「%s」の商品コード%sの棚卸詳細が1件に決まらない' % ('・'.join(p['name'] for p in plans), code)))
        sql.append("UPDATE dtb_inventory_plan_detail SET update_date = %s WHERE %s;" % (ts(d), w))
    sql = _plan_asserts(plans) + sql
    return Out(sql, ['棚卸詳細は 棚卸計画の名前+商品コード で引き、1件に決まることを確かめる。日時は日本時間(+09)'], ['dtb_inventory_plan_detail', 'dtb_inventory_plan', 'dtb_product_stock', 'dtb_product_class'])


@handler(r'^棚卸詳細(?:データ)?の(最終更新日|作成時間)（(\d{4}/\d{1,2}/\d{1,2}(?: \d{1,2}:\d{2})?)）は画面で指定できない')
def plan_detail_dates_all(ctx, m):
    plans = ctx.plans()
    if not plans:
        raise Unsupported('棚卸計画の名前が文にも状態・属性にも無い')
    col = 'update_date' if m.group(1) == '最終更新日' else 'create_date'
    return Out(_plan_asserts(plans) + [assert_ge("SELECT count(*) FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN %s" % _plan_ids_expr(plans), 1, '棚卸計画「%s」の棚卸詳細が1件も無い' % '・'.join(p['name'] for p in plans)),
                "UPDATE dtb_inventory_plan_detail SET %s = %s WHERE inventory_plan_id IN %s;" % (col, ts(m.group(2)), _plan_ids_expr(plans))],
               ['その棚卸計画の棚卸詳細すべてに設定する(商品の指名が文に無いため)。日時は日本時間(+09)'], ['dtb_inventory_plan_detail', 'dtb_inventory_plan'])


@handler(r'棚卸詳細\d+件のうち\d+件だけを在庫反映済みにする')
def plan_detail_reflected(ctx, m):
    spec = re.findall(r'「(M0431-[^」]+)」は[^「]*?(?:棚卸詳細\d+件のうち(\d+)件が在庫反映済み|在庫反映済みの棚卸詳細が0件)', ctx.state)
    if not spec:
        raise Unsupported('どの棚卸計画で何件を在庫反映済みにするかが状態・属性から読めない')
    sql = []
    for name, n in spec:
        sql.append(assert_one("SELECT count(*) FROM dtb_inventory_plan WHERE name = %s" % qs(name), '棚卸計画「%s」が1件に決まらない' % name))
        sql.append("UPDATE dtb_inventory_plan_detail SET stock_reflectioned_date = now() WHERE id IN (SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = %s) ORDER BY id LIMIT %d);" % (qs(name), int(n or 0)))
    return Out(sql, ['どの詳細を反映済みにするかは文に無いので、棚卸詳細の番号が小さいほうから指定件数にした。反映した日時は流した時刻(文に無い)。棚卸計画の在庫反映日は触らない'], ['dtb_inventory_plan_detail', 'dtb_inventory_plan'])


@handler(r'^棚卸計画「([^」]+)」だけを在庫反映の処理が実行中の状態にする')
def plan_reflecting(ctx, m):
    n = m.group(1)
    return Out([assert_one("SELECT count(*) FROM dtb_inventory_plan WHERE name = %s" % qs(n), '棚卸計画「%s」が1件に決まらない' % n),
                "UPDATE dtb_inventory_plan SET reflecting_flg = true WHERE name = %s;" % qs(n)], ['実行中の印(反映処理中のフラグ)をこの計画だけに付ける'], ['dtb_inventory_plan'])


@handler(r'^在庫反映済みの状態（棚卸計画の在庫反映日(\d{4}/\d{1,2}/\d{1,2} \d{1,2}:\d{2}:\d{2})と、棚卸詳細の在庫反映済み）')
def plan_reflected_all(ctx, m):
    plans = ctx.plans()
    if not plans:
        raise Unsupported('棚卸計画の名前が無い')
    d = m.group(1)
    sql = _plan_asserts(plans) + ["-- 計画の在庫反映日と、その棚卸詳細の在庫反映日を同じ日時にする"]
    sql.append("UPDATE dtb_inventory_plan SET stock_reflectioned_date = %s WHERE id IN %s;" % (ts(d), _plan_ids_expr(plans)))
    sql.append("UPDATE dtb_inventory_plan_detail SET stock_reflectioned_date = %s WHERE inventory_plan_id IN %s;" % (ts(d), _plan_ids_expr(plans)))
    return Out(sql, ['棚卸詳細の反映日も同じ日時にした(文は「棚卸詳細の在庫反映済み」とだけ書く)。日時は日本時間(+09)'], ['dtb_inventory_plan', 'dtb_inventory_plan_detail'])


# ============ 所属の並び順・棚番号(名称だけ)・部門 ============
@handler(r'並び順[\d・]+は画面で指定できない|所属ID \d+「[^」]+」・並び順\d+')
def dept_sort(ctx, m):
    s = ctx.sent
    sql = []
    ids = re.findall(r'所属ID (\d+)「([^」]+)」・並び順(\d+)', s)
    if ids:
        over = [i for i, nm, so in ids if int(i) > 32767]
        if over:
            raise Unsupported('所属ID %s は、現行のDBの所属の番号の型（smallint、上限32767）を超えるため、その番号の所属は作れず、番号で引く更新は常に0行になる（番号の型の上限を超える。設計と実装の差の候補）' % '・'.join(over), gap='番号が現行のDBの型の上限を超える')
        for i, nm, so in ids:
            sql.append(assert_one("SELECT count(*) FROM mtb_department WHERE id = %s AND name = %s" % (i, qs(nm)), '所属（番号%s・名前「%s」）が1件に決まらない' % (i, nm)))
            sql.append("UPDATE mtb_department SET sort_no = %s WHERE id = %s;" % (so, i))
        return Out(sql, ['所属の番号と名前の両方が合う行が1件あることを確かめてから、並び順だけを変える'], ['mtb_department'])
    mm = re.match(r'^(.+?)の並び順([\d・]+)は画面で指定できない', s)
    if not mm:
        return None
    names = [x for x in re.split(r'[・、と]', mm.group(1)) if x]
    vals = mm.group(2).split('・')
    if len(names) != len(vals):
        names = re.findall(r'所属[A-Z]', ctx.state)
        names = list(dict.fromkeys(names))
    if len(names) != len(vals):
        raise Unsupported('並び順を付ける所属の名前を文・状態・属性から読めない')
    for nm, so in zip(names, vals):
        sql.append(assert_one("SELECT count(*) FROM mtb_department WHERE name = %s" % qs(nm), '所属「%s」が1件に決まらない' % nm))
        sql.append("UPDATE mtb_department SET sort_no = %s WHERE name = %s;" % (so, qs(nm)))
    notes = ['所属は名前で引く（1件に決まることを確かめる）']
    over = [i for i in re.findall(r'所属ID[ =＝]?(\d+)', ctx.state + ctx.how) if int(i) > 32767]
    gap = ''
    if over:
        notes.append('状態・属性の所属ID %s は、現行のDBの所属の番号の型（smallint、上限32767）を超えるため、その番号では作れない（設計と実装の差の候補: 番号の型の上限を超える）。このSQLは所属を名前で引くので、番号が違っても動く' % '・'.join(dict.fromkeys(over)))
        gap = '番号が現行のDBの型の上限を超える'
    return Out(sql, notes, ['mtb_department'], gap=gap)


@handler(r'^棚番号=([^・／]+)(?:・([^・／（]+))?は画面で指定できない')
def shelf_by_names(ctx, m):
    names = [x for x in (m.group(1), m.group(2)) if x]
    sql = []
    mdel = re.search(r'名称に([A-Za-z0-9\-]+)を含むほかの棚番号があれば、あわせてDBで直接削除する', ctx.sent)
    if mdel:
        key = mdel.group(1)
        sql.append("UPDATE dtb_product_class SET shelf_number_id = NULL WHERE shelf_number_id IN (SELECT id FROM dtb_shelf_number WHERE name LIKE %s AND name NOT IN (%s));" % (qs('%' + key + '%'), ', '.join(qs(n) for n in names)))
        sql.append("DELETE FROM dtb_shelf_number WHERE name LIKE %s AND name NOT IN (%s);" % (qs('%' + key + '%'), ', '.join(qs(n) for n in names)))
    for n in names:
        sql.append("INSERT INTO dtb_shelf_number (name, sort_no) SELECT %s, 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = %s);" % (qs(n), qs(n)))
        sql.append(assert_one("SELECT count(*) FROM dtb_shelf_number WHERE name = %s" % qs(n), '棚番号「%s」が1件に決まらない' % n))
    notes = ['棚番号は名前で作る(同じ名前があれば作らない)。並び順は文に無いので0。作ったあと、名前ごとに棚番号が1件だけあることを確かめる']
    if mdel:
        notes.append('名称に「%s」を含むほかの棚番号を消す前に、その棚番号を使っている商品規格の棚番号を空にする（文には書かれていないが、商品規格が棚番号を外部キーで指すため、空にしないと消せない。文が残す2件の棚番号を使う商品規格は変えない）' % mdel.group(1))
    return Out(sql, notes, ['dtb_shelf_number', 'dtb_product_class'])


@handler(r'^棚番号（名称([A-Za-z0-9\-,、]+)）は')
def shelf_names_only(ctx, m):
    names = [x for x in re.split(r'[,、]', m.group(1)) if x]
    return Out(["INSERT INTO dtb_shelf_number (name, sort_no) SELECT %s, 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = %s);" % (qs(n), qs(n)) for n in names],
               ['棚番号は名前で作る(同じ名前があれば作らない)。並び順は文に無いので0'], ['dtb_shelf_number'])


@handler(r'^【DB 部門未設定】部門を未設定にすることは画面で指定できない')
def section_null_labels(ctx, m):
    tg, allf = ctx.targets()
    return Out(_each(tg, lambda e: ["UPDATE dtb_product_class SET section_id = NULL WHERE id = %s;" % e]), _note_all(ctx, allf, len(tg)), ['dtb_product_class'])


@handler(r'^言語は画面で空にできないためDBへ直接設定する（商品規格の言語を未設定にする）|^状態は画面で空にできないためDBへ直接設定する（商品規格の状態を未設定にする）')
def class_null_lang_cond(ctx, m):
    col = 'language_id' if ctx.sent.startswith('言語') else 'card_condition_id'
    tg, allf = ctx.targets()
    return Out(_each(tg, lambda e: ["UPDATE dtb_product_class SET %s = NULL WHERE id = %s;" % (col, e)]), _note_all(ctx, allf, len(tg)), ['dtb_product_class'])


@handler(r'^言語ID=1（日本語）の登録は画面で指定できない')
def language_jp(ctx, m):
    return Out(["INSERT INTO mtb_language (id, name_jp, name_en, code, sort_no) VALUES (1, '日本語', 'Japanease', 'JP', 1) ON CONFLICT (id) DO NOTHING;"],
               ['値は現在のDBの言語表の「日本語」の行(言語ID 1)と同じにした(DBから読んだ値)。既にあれば何もしない'], ['mtb_language'])


@handler(r'^言語ID (\d+)が未登録である状態は画面で指定できない')
def language_absent(ctx, m):
    return Out(['-- 言語ID %s の行だけを消す(依存する行を先に消す)' % m.group(1)] + del_tree('mtb_language', 'id = %s' % m.group(1)), ['該当が無ければ何も消えない'], ['mtb_language'])


@handler(r'^部門コードM0318-052-0001〜M0318-052-5008の部門が未登録')
def sections_range_delete(ctx, m):
    return Out(["DELETE FROM mtb_section WHERE code BETWEEN 'M0318-052-0001' AND 'M0318-052-5008';"], ['部門コードがこの範囲(桁をそろえた連番)の部門だけを消す。どこかから参照されている部門があれば、削除が失敗して全体が止まる(参照している行は消さない)'], ['mtb_section'])


@handler(r'^スマレジ試験用部門ID（((?:SMR-SECTION-\d+(?:、)?)+)）は画面で指定できない.*部門コード([\d、]+)の部門')
def section_smaregi_ids(ctx, m):
    ids = re.findall(r'SMR-SECTION-\d+', m.group(1))
    codes = [x for x in m.group(2).split('、') if x]
    if len(ids) != len(codes):
        raise Unsupported('部門IDと部門コードの数が合わない')
    sql = []
    for i, c in zip(ids, codes):
        sql.append(assert_one("SELECT count(*) FROM mtb_section WHERE code = %s" % qs(c), '部門コード%sが1件に決まらない' % c))
        sql.append("UPDATE mtb_section SET smaregi_category_id = %s WHERE code = %s;" % (qs(i), qs(c)))
    return Out(sql, ['スマレジ連携先の部門IDは部門コードで引いた部門に設定する'], ['mtb_section'])


# ============ 商品の公開状態 ============
@handler(r'^在庫を持ったままの(非公開|廃止)は画面で指定できない.*（([^）]*)）')
def status_with_stock(ctx, m):
    kind, body = m.group(1), m.group(2)
    st = 2 if kind == '非公開' else 3
    do_prod = ('商品の' in body) or ('商品と商品規格' in body)
    do_cls = ('商品規格の' in body) or ('商品と商品規格' in body)
    # 対象の規格: 状態・属性のうち、その状態を書いた項目
    ents = [e for e in re.split(r'／', ctx.state)]
    key = {('非公開', True, True): '商品と商品規格が非公開', ('廃止', True, False): '商品が廃止', ('廃止', False, True): '商品規格が廃止'}.get((kind, do_prod, do_cls))
    tgt = None
    if key:
        for e in ents:
            if key in e:
                pcs = ctx.pc_labels(e)
                if len(pcs) == 1:
                    tgt = pcs[0]
                    break
    if tgt is None:
        its = ctx.items()
        if len(its) == 1:
            e, chk = ctx.item_target(idx=0)
            tgt = e
            sql = [assert_one(chk, '商品規格が1件に決まらない')] if chk else []
    if tgt is None:
        t2, _ = ctx.targets()
        if len(t2) == 1:
            tgt = t2[0]
            sql = [assert_one(t2[0][2], '商品規格が1件に決まらない')] if t2[0][2] else []
            tgt = t2[0][1]
        else:
            raise Unsupported('どの商品規格か決まらない')
    else:
        sql = []
    if tgt.startswith('〔'):
        sql.append(assert_one("SELECT count(*) FROM dtb_product_class WHERE id = %s" % tgt, '%s の行が1件に決まらない（番号の置き換えを確かめる）' % tgt))
    if do_prod:
        sql.append("UPDATE dtb_product SET product_status_id = %d WHERE id = (SELECT product_id FROM dtb_product_class WHERE id = %s);" % (st, tgt))
    if do_cls:
        sql.append("UPDATE dtb_product_class SET product_status_id = %d WHERE id = %s;" % (st, tgt))
    return Out(sql, ['公開状態の値: 公開=1・非公開=2・廃止=3（アプリの定義）。' + ('商品' if do_prod else '') + ('と' if do_prod and do_cls else '') + ('商品規格' if do_cls else '') + 'の状態だけを変える'], ['dtb_product', 'dtb_product_class'])


# ============ 商品(コード範囲)の削除・規格の状態NMの削除 ============
_tmp_counter = [0]


def _del_products_by_class_cond(cond):
    _tmp_counter[0] += 1
    t = 'zz_seed_del_%d' % _tmp_counter[0]
    return ["DROP TABLE IF EXISTS %s;" % t, "CREATE TEMP TABLE %s ON COMMIT DROP AS SELECT DISTINCT product_id AS id FROM dtb_product_class WHERE %s;" % (t, cond)] + del_tree('dtb_product', "id IN (SELECT id FROM %s)" % t)


@handler(r'商品コードが(LIMIT-0001-043)〜(LIMIT-5009-043)の商品をDBへ直接削除する')
def products_code_range_delete(ctx, m):
    cond = "product_code ~ '^LIMIT-[0-9]{4}-043$' AND substring(product_code from 7 for 4)::int BETWEEN 1 AND 5009"
    return Out(['-- 商品コード LIMIT-0001-043〜LIMIT-5009-043 の商品だけを消す'] + _del_products_by_class_cond(cond), ['該当が無ければ何も消えない'], ['dtb_product', 'dtb_product_class'])


@handler(r'^状態NMの規格0件は画面で指定できない')
def nm_classes_delete(ctx, m):
    """対象の商品: 文の商品の呼び名 → 文の「商品A」 → 節の見出し(【商品A】) → このシードの商品が1つだけ。決まらなければ作らない"""
    labs = [l for l in dict.fromkeys(LABEL.findall(ctx.sent)) if l.startswith('〔商品ID-')]
    how = ''
    if not labs:
        ml = re.findall(r'(?<!両)商品([A-Z])(?![A-Za-z0-9])', ctx.sent)
        before = ctx.text[:ctx.pos]
        heads = re.findall(r'【商品([A-Z])】', before)
        L = ml[0] if ml else (heads[-1] if heads and before.rfind('【') == before.rfind('【商品' + heads[-1] + '】') else None)
        allp = ctx.prod_labels()
        if L:
            labs = [l for l in allp if re.search(r'(?<![A-Za-z])' + L + r'〕$', l)]
            how = '節の見出し【商品%s】の商品' % L if not ml else '文の「商品%s」' % L
        elif len(allp) == 1:
            labs = allp
            how = 'このシードの商品が1つだけ'
    if len(labs) != 1:
        raise Unsupported('どの商品の規格か決まらない(文・節の見出しから商品の呼び名が1つに決まらない)')
    lab = labs[0]
    w = "product_id = %s AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')" % lab
    sql = [assert_one("SELECT count(*) FROM dtb_product WHERE id = %s" % lab, '商品 %s が1件に決まらない' % lab),
           '-- 商品 %s の状態NMの規格と、その規格の在庫などだけを消す' % lab] + del_tree('dtb_product_class', w)
    return Out(sql, ['状態NM以外の規格は消さない'] + (['対象の商品は' + how] if how else []), ['dtb_product_class', 'mtb_card_condition'])


@handler(r'^商品規格を0件にすることは画面で指定できない')
def class_all_delete(ctx, m):
    labs = [l for l in dict.fromkeys(LABEL.findall(ctx.state)) if l.startswith('〔商品ID-')]
    if len(labs) != 1:
        raise Unsupported('どの商品の規格か決まらない')
    return Out(['-- 商品 %s の規格だけを消す' % labs[0]] + del_tree('dtb_product_class', "product_id = %s" % labs[0]), [], ['dtb_product_class'])


# ============ 商品・規格・価格履歴の日時(状態・属性の項目から) ============
DT_RX = r'\d{4}[-/]\d{2}[-/]\d{2}(?: \d{2}:\d{2}(?::\d{2})?)?'


@handler(r'^商品更新日時（.*）と商品規格更新日時（.*）は')
def product_class_update_dates(ctx, m):
    sql = []
    n = 0
    for e in re.split(r'／', ctx.state):
        mc = re.search(r'商品コード=([A-Za-z0-9\-_]+)', e)
        mp = re.search(r'商品更新日時=(' + DT_RX + ')', e)
        mk = re.search(r'商品規格更新日時=(' + DT_RX + ')', e)
        if mc and mp and mk:
            c = mc.group(1)
            sql.append(assert_one("SELECT count(*) FROM dtb_product_class WHERE product_code = %s" % qs(c), '商品コード%sが1件に決まらない' % c))
            sql.append("UPDATE dtb_product SET update_date = %s WHERE id = (SELECT product_id FROM dtb_product_class WHERE product_code = %s);" % (ts(mp.group(1)), qs(c)))
            sql.append("UPDATE dtb_product_class SET update_date = %s WHERE product_code = %s;" % (ts(mk.group(1)), qs(c)))
            n += 1
    if not n:
        raise Unsupported('商品ごとの更新日時が状態・属性の項目から読めない')
    return Out(sql, ['商品コードで引く。日時は日本時間(+09)'], ['dtb_product', 'dtb_product_class'])


@handler(r'^更新日時(' + DT_RX + r')（〔商品ID-[^〕]+〕）')
def product_update_dates(ctx, m):
    pairs = re.findall(r'更新日時(' + DT_RX + r')（(〔商品ID-[^〕]+〕)）', ctx.sent)
    return Out(["UPDATE dtb_product SET update_date = %s WHERE id = %s;" % (ts(d), l) for d, l in pairs], ['商品の更新日時だけを変える。日時は日本時間(+09)'], ['dtb_product'])


@handler(r'^規格更新日時（(' + DT_RX + r'(?:・' + DT_RX + r')*)）は画面で指定できない')
def class_update_dates_by_state(ctx, m):
    pairs = re.findall(r'(〔商品ID-[^〕]+〕)=[^／]*?規格更新日時(' + DT_RX + r')', ctx.state)
    dates = re.findall(DT_RX, m.group(1))
    if not pairs or len(pairs) != len(dates):
        raise Unsupported('規格更新日時と商品の呼び名の対応を状態・属性から読めない')
    return Out(["UPDATE dtb_product_class SET update_date = %s WHERE product_id = %s;" % (ts(d), l) for l, d in pairs], ['商品の呼び名で引いた商品の規格すべての更新日時を変える。日時は日本時間(+09)'], ['dtb_product_class'])


@handler(r'^価格履歴の登録日時（((?:[A-Za-z0-9\-]+=' + DT_RX + r'(?:、)?)+)）は画面で指定できない')
def price_hist_dates_by_code(ctx, m):
    sql = []
    for c, d in re.findall(r'([A-Za-z0-9\-]+)=(' + DT_RX + ')', m.group(1)):
        sql.append(assert_one("SELECT count(*) FROM dtb_price_history WHERE product_class_id = %s" % pc_by_code(c), '商品コード%sの価格履歴が1件に決まらない(商品規格1件・価格を変えていない前提)' % c))
        sql.append("UPDATE dtb_price_history SET create_date = %s WHERE product_class_id = %s;" % (ts(d), pc_by_code(c)))
    return Out(sql, ['商品コードで引いた規格の価格履歴(1件)の日時を変える。日時は日本時間(+09)'], ['dtb_price_history', 'dtb_product_class'])


@handler(r'^(〔商品ID-[^〕]+〕)の価格履歴の登録日時（((?:(?:NM|SP|MP|HP)=' + DT_RX + r'(?:、)?)+)）は画面で指定できない')
def price_hist_dates_by_cond(ctx, m):
    lab = m.group(1)
    sql = []
    sql.append(assert_one("SELECT count(*) FROM dtb_product WHERE id = %s" % lab, '%s の行が1件に決まらない（番号の置き換えを確かめる）' % lab))
    for cond, d in re.findall(r'(NM|SP|MP|HP)=(' + DT_RX + ')', m.group(2)):
        w = "product_id = %s AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = %s)" % (lab, qs(cond))
        sql.append(assert_one("SELECT count(*) FROM dtb_product_class WHERE %s" % w, '%s の状態%sの規格が1件に決まらない' % (lab, cond)))
        sql.append(assert_ge("SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE %s)" % w, 1, '%s の状態%sの規格に価格履歴が無い' % (lab, cond)))
        sql.append("UPDATE dtb_price_history SET create_date = %s WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = %s AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = %s));" % (ts(d), lab, qs(cond)))
    return Out(sql, ['商品の呼び名で引き、状態ごとの規格の価格履歴の日時を変える。状態ごとの規格が1件ずつあり、価格履歴が1件以上あることを先に確かめる（無ければ止まる。0行の更新で通らない）。日時は日本時間(+09)'], ['dtb_price_history', 'dtb_product_class', 'mtb_card_condition'])


# ============ 追加: 実行者名つきの在庫反映日・スマレジ商品IDを空にする・在庫移動指示の日付と合計 ============
@handler(r'^棚卸計画の在庫反映日（(' + DT_RX + r')）と在庫反映実行時の更新者名（「([^」]+)」）')
def plan_reflect_with_member(ctx, m):
    plans = ctx.plans()
    if not plans:
        raise Unsupported('棚卸計画の名前が無い')
    d, who = m.group(1), m.group(2)
    sql = _plan_asserts(plans) + [assert_one("SELECT count(*) FROM dtb_member WHERE name = %s" % qs(who), '管理者「%s」が1件に決まらない' % who)]
    sql.append("UPDATE dtb_inventory_plan SET stock_reflectioned_date = %s, member_id = (SELECT id FROM dtb_member WHERE name = %s) WHERE id IN %s;" % (ts(d), qs(who), _plan_ids_expr(plans)))
    return Out(sql, ['更新者は管理者の名前で引く。日時は日本時間(+09)。棚卸計画の担当の管理者の列に入れた'], ['dtb_inventory_plan', 'dtb_member'])


@handler(r'^スマレジ商品IDは画面で指定できないためDBへ直接設定する（空欄にする）')
def smaregi_id_null(ctx, m):
    e, chk = ctx.item_target(idx=ctx.nth('smaregi_null'))
    sql = ([assert_one(chk, '商品規格が1件に決まらない')] if chk else []) + ["UPDATE dtb_product_class SET smaregi_product_id = NULL WHERE id = %s;" % e]
    return Out(sql, ['状態・属性の記載順の対象に対して空にする'], ['dtb_product_class'])


def _instruction_label(ctx):
    labs = [l for l in dict.fromkeys(LABEL.findall(ctx.state + ctx.how)) if re.match(r'〔(?:在庫)?移動指示ID-', l)]
    if len(labs) != 1:
        raise Unsupported('在庫移動指示の呼び名が1つに決まらない')
    return labs[0]


@handler(r'^(?:⑩)?(?:在庫移動指示の)?登録日(' + DT_RX + r')と?(?:・)?更新日(' + DT_RX + r')は画面で指定できない|^登録日(' + DT_RX + r')・更新日(' + DT_RX + r')は画面で指定できない')
def instruction_dates(ctx, m):
    g = [x for x in m.groups() if x]
    lab = _instruction_label(ctx)
    return Out(["UPDATE dtb_stock_move_instruction SET create_date = %s, update_date = %s WHERE id = %s;" % (ts(g[0]), ts(g[1]), lab)], ['在庫移動指示の登録日と更新日。日時は日本時間(+09)'], ['dtb_stock_move_instruction'])


@handler(r'^基準価格合計(\d+)は画面で指定できない')
def instruction_total(ctx, m):
    lab = _instruction_label(ctx)
    return Out(["UPDATE dtb_stock_move_instruction SET standard_total_price = %s WHERE id = %s;" % (m.group(1), lab)], ['基準価格合計だけを設定する'], ['dtb_stock_move_instruction'])
