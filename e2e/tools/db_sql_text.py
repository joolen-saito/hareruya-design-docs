"""シード表の文(と手順書の「画面で入れる値」)から、画面で作るはずの値を読む(tools/db_sql_run.py の試し用の行の出どころ)。
SQLの本文は読まない(SQLが引く名前を写して用意すると、名前の間違いを見逃すため)。生成側(tools/db_sql_handlers.py)とは別に書いてある。"""
import re

_EXCL = re.compile(r'^(?:S-|IT-|REQ-|[A-Z]\d\d-\d\d$|\d{4}[-/]\d{1,2}[-/]\d{1,2}|UTF-|EC-CUBE$|ECCUBE$|Shift_JIS$|SJIS$)')


def _ok(c):
    return bool(c) and bool(re.search(r'[0-9\-]', c)) and not _EXCL.search(c) and not re.search(r'\.(?:csv|tsv|txt|png|jpg)$', c, re.I)


def codes(text):
    """商品(規格)コード。①コードの見出し語のあと ②「…」の中の英数字の語 ③項目の頭の「X:」「X=」「Xは商品ID」"""
    out = []
    for m in re.finditer(r'(?<!スマレジ)(?<!高額)(?<!JAN)(?<!部門)(?<!スマレジ商品)(?:商品規格コード|規格コード|商品コード|コード)(?:は|が|に|を|=|＝|：|:)?「?([A-Za-z0-9][A-Za-z0-9\-_]*(?:[・、,][A-Za-z0-9][A-Za-z0-9\-_]*)*)', text):
        out += re.split(r'[・、,]', m.group(1))
    out += re.findall(r'「([A-Za-z0-9][A-Za-z0-9\-_]*)」', text)
    out += re.findall(r'(?:^|[／。\s】）、・])([A-Za-z0-9][A-Za-z0-9\-_]*\d[A-Za-z0-9\-_]*)(?=[:：]|=|＝|は商品ID|の規格)', text)
    return [c for c in dict.fromkeys(out) if _ok(c)]


def shops(text):
    """店舗名(「本店」だけのものは本店かつ公開の店舗として別に扱うので入れない)"""
    out = re.findall(r'(?<![一-龥ァ-ヶA-Za-z0-9])((?:試験)?店舗[A-Z](?:（[A-Z]\d\d-\d\d）)?|M\d\d-\d\d RD店舗[A-Z]|CSV店舗[A-Z]|[一-龥ァ-ヶ]{1,8}(?:本店|支店))', text)
    out += re.findall(r'店舗名(?:に|は|を|=|＝|「)?([A-Za-z0-9][A-Za-z0-9\-_]*)(?![A-Za-z0-9_])', text)
    return [s for s in dict.fromkeys(out)]


def plans(text):
    """棚卸計画の名前(「…」で、直前に「棚卸」がある)と、「…」で始まる棚卸名の前置き"""
    names, prefixes = [], []
    for m in re.finditer(r'「([^」]+)」', text):
        before = text[max(0, m.start() - 12):m.start()]
        if '棚卸' in before or re.search(r'「[^」]+」(?:・|、|と)$', before):
            if text[m.end():m.end() + 3] == 'で始ま':
                prefixes.append(m.group(1))
            elif re.search(r'\d', m.group(1)) and '棚卸' in text[max(0, m.start() - 40):m.start()]:
                names.append(m.group(1))
    prefixes += re.findall(r'棚卸名が「?([A-Za-z0-9][^」で「]*?)」?で始まる', text)
    return list(dict.fromkeys(names)), list(dict.fromkeys(prefixes))


def file_names(text):
    out = re.findall(r'「([^」]+?\.(?:csv|tsv))」', text)
    out += re.findall(r'(?<![A-Za-z0-9_\-\.])([A-Za-z0-9_][A-Za-z0-9_\-\.]*\.(?:csv|tsv))(?![A-Za-z0-9_])', text)
    return list(dict.fromkeys(out))


def labels(text):
    return list(dict.fromkeys(re.findall(r'〔[^〕]+〕', text)))


def token_in(lit, text):
    """lit が text に、前後で切れた完全な語として出てくるか"""
    jp = re.compile(r'[ぁ-んァ-ヶー一-龥々]')
    i = text.find(lit)
    while i >= 0:
        a = text[i - 1] if i > 0 else ''
        b = text[i + len(lit)] if i + len(lit) < len(text) else ''
        if all(ord(c) < 128 for c in lit):
            ok = not (a and re.match(r'[A-Za-z0-9_\-]', a)) and not (b and re.match(r'[A-Za-z0-9_]', b))
        else:
            ok = not (a and (re.match(r'[A-Za-z0-9]', a) or (jp.match(a) and a not in 'とのをはがにでもへや'))) and not (b and re.match(r'[A-Za-z0-9]', b))
        if ok:
            return True
        i = text.find(lit, i + 1)
    return False


# 取込種別の番号: 画面(コントローラ)が履歴の一覧を引き・書くときの定数(src/Eccube/Entity/Master/MtbCsvImportType.php とコントローラ)。マスタの名前では決めない
SCREEN_TYPE = {'M03-26': 1, 'M03-27': 2, 'M03-28': 3, 'M03-29': 4, 'M03-30': 5, 'M03-31': 6, 'M03-32': 7, 'M03-33': 8, 'M03-35': 11, 'M03-38': 14, 'M03-40': 15, 'M03-41': 16}


def screen_type(fid, name=''):
    """その機能の画面が取込履歴を書く番号。M04-22 は在庫移動CSVの取込が17、在庫振替CSVの取込が18(シードの論理名の「振替」で分ける)"""
    if fid == 'M04-22':
        return 18 if '振替' in name else 17
    return SCREEN_TYPE.get(fid)
