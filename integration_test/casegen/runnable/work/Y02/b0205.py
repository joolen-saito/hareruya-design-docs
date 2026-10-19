import re
R = re.compile(r'管理画面の商品登録画面で商品名\(日\)に(?P<ja>.+?)、商品名\(英\)に(?P<en>.+?)を入れ、公開状態を「公開」にし、そのほかの必須項目に入力チェックを通る任意の値を入れ、割引率を販売割引率に登録済みのものから選んで「商品を登録」ボタンを押し、商品登録画面に表示された商品IDを控える（(?P<lab>〔商品ID-[^〕]+〕)）。(?P=lab)の商品規格一覧画面で新規登録を押し、商品規格登録画面で言語に(?P<lang>「[^」]+」(?:か「[^」]+」のどちらか)?)を選び、セールフラグ(?P<sale>にチェックを入れ|のチェックを外し)、そのほかの必須項目に入力チェックを通る任意の値を入れて「商品規格を登録」ボタンを押す。')
if __name__=='__main__':
    rs=[l.rstrip('\n').split('\t') for l in open('fix3/in/B02-05.tsv',encoding='utf-8')][1:]
    for c in rs:
        t=c[4]
        ms=list(R.finditer(t))
        print(c[2],len(ms),[ (m['ja'],m['en'],m['lab'][-6:],m['lang'],m['sale'][:4]) for m in ms])
        rest=R.sub('<<P>>',t)
        for m in re.finditer(r'[^。]*(商品登録|商品規格|カード指定)[^。]*。',rest):
            if '<<P>>' not in m.group(0): print('   LEFT:',m.group(0)[:200])
