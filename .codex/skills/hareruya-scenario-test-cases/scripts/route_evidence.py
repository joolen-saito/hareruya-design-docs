"""Source-scoped route corrections. Every supplement requires literal source evidence.

These are not topic-triggered edge-case templates: a record is scoped to an adopted
source file, parent pattern and quoted paragraph. Missing evidence aborts generation.
"""
from __future__ import annotations

from dataclasses import replace


def supplement_routes(business, pattern, routes, g):
    # 元Excelの作業内容セルが番号の直前行に配置された3箇所。
    # 前工程への機械連結を修復し、出典上の該当工程へ戻す。
    from pathlib import Path
    source_name=Path(pattern.source_path).name
    repairs={
        ('12_在庫管理.md','7'):[('423','428','在庫移動指示を作成する')],
        ('12_在庫管理.md','2'):[('271','277','商品を入荷したら、解体作業を行い段ボールに入っているピッキングリストをもとに 内容の確認を行う')],
        ('11_価格管理.md','2'):[('77','82','価格変更の共有および、EC-CUBEに価格変更を反映させる')],
    }
    for start,end,phrase in repairs.get((source_name,pattern.number),[]):
        a=next((r for r in pattern.rows if g.row_r_number(r)==start),None)
        b=next((r for r in pattern.rows if g.row_r_number(r)==end),None)
        if a is None or b is None or phrase not in g.full_text(a):
            continue
        mapping={a:g.full_text(a).replace(phrase,'').strip(),b:g.full_text(b)+' '+phrase}
        for old,new in mapping.items():
            key=g.primary_text(old)
            g.ROW_SUMMARY[new]=g.ROW_SUMMARY.get(key,g.row_title(old))
            g.ROW_WORK_KIND[new]=g.row_work_kind(old)
            if key in pattern.row_nodes:pattern.row_nodes[new]=pattern.row_nodes[key]
            if key in pattern.row_lanes:pattern.row_lanes[new]=pattern.row_lanes[key]
        pattern.rows=[mapping.get(r,r) for r in pattern.rows]
        routes=[replace(r,rows=tuple(mapping.get(row,row) for row in r.rows),
                        final_state=g.final_state_from_rows(pattern,[mapping.get(row,row) for row in r.rows]) if r.rows and r.rows[-1] in mapping else r.final_state) for r in routes]
    rows = g.normal_flow_rows(pattern)
    text = " ".join(g.full_text(r) for r in pattern.rows) + " " + " ".join(n.text for n in pattern.nodes.values())
    source = pattern.source_path.rsplit("/", 1)[-1]
    number = pattern.number

    def require(quote):
        if quote not in text:
            raise ValueError(f"route evidence changed: {source} #{number}: {quote}")

    def select(*rnums, exclude=()):
        chosen = set(map(str, rnums))
        rejected = set(map(str, exclude))
        selected = [r for r in rows if (not chosen or g.row_r_number(r) in chosen) and g.row_r_number(r) not in rejected]
        if rnums:
            order={str(number):idx for idx,number in enumerate(rnums)}
            selected.sort(key=lambda row:order[g.row_r_number(row)])
        return tuple(selected)

    def rewrite(values, rnum, detail):
        result = []
        for old in values:
            if g.row_r_number(old) != str(rnum):
                result.append(old)
                continue
            key = g.primary_text(old)
            title = g.ROW_SUMMARY.get(key, g.row_title(old))
            new = f"- R{rnum}: {g.row_leading_number(old)} {title} {detail}"
            g.ROW_SUMMARY[new] = title
            g.ROW_WORK_KIND[new] = g.row_work_kind(old)
            if key in pattern.row_nodes:
                pattern.row_nodes[new] = pattern.row_nodes[key]
            if key in pattern.row_lanes:
                pattern.row_lanes[new] = pattern.row_lanes[key]
            result.append(new)
        return tuple(result)

    def route(title, condition, route_rows, expected, inputs, preparation, refs, quote, *, index=None, kind="主要代替"):
        require(quote)
        evidence = f"原典本文 {source} {refs}「{quote}」"
        condition = f"{condition}（{evidence}）"
        result = expected.rstrip("。")
        if not result.endswith("確認できること"):
            result += "ことを確認できること"
        result += "。"
        anchor = next((r for r in pattern.rows if quote in g.full_text(r)), rows[0])
        edge = g.EdgeCase("E" if kind == "業務異常" else "A", condition, result, expected, anchor)
        if index is None:
            rid = f"R{len(routes)+1:02d}"
        else:
            rid = routes[index].route_id
            kind = routes[index].kind
        item = g.BusinessRoute(rid, kind, f"{pattern.name}（{title}）", condition, result, tuple(route_rows),
                               () if kind == "正常代表" else (edge,), preparation, tuple(inputs.items()), evidence)
        if index is None:
            routes.append(item)
        else:
            routes[index] = item

    if source == "12_在庫管理.md" and number == "2":
        details=[
            ('数量一致で入庫','出荷指示数量=3、ピック数量=3、受入数量=3、商品状態の差異なし',{'出荷指示数量':'3','ピック数量':'3','受入数量':'3','商品状態差異':'なし'}),
            ('出荷時の欠品を登録して入庫','出荷指示数量=3、ピック数量=2、受入数量=2、商品状態の差異なし',{'出荷指示数量':'3','ピック数量':'2','受入数量':'2','欠品数量':'1','商品状態差異':'なし'}),
            ('受入数量の差異を修正して入庫','移動数量=3、受入現物数量=2、商品状態の差異なし',{'移動数量':'3','受入現物数量':'2','修正後数量':'2','商品状態差異':'なし'}),
            ('入庫後に商品状態差異を振り替える','数量=3で一致、登録状態=NM、受入現物状態=SP',{'移動数量':'3','受入数量':'3','移動商品状態':'NM','受入現物状態':'SP'}),
        ]
        for idx,(title,condition,inputs) in enumerate(details):
            rr=routes[idx].rows if idx==3 else tuple(row for row in routes[idx].rows if g.row_r_number(row)!='303')
            final='同じ移動IDの受入数量が現物と一致し、承認者による入庫完了と移動先在庫の加算履歴を照合できた' if idx<3 else '同じ移動IDで入庫した3枚を現物のSP商品へ振り替え、NMの減算3枚とSPの加算3枚が在庫履歴に記録された'
            route(title,condition,rr,final,inputs,'同じ移動IDと商品コードについて指定の指示数・ピック数・受入数を準備し、送り元と承認者の双方の操作記録を保存する。状態差異は入庫してから振替を実施する。',
                  'R256–305','移動で編集できるのは数量のみで、商品の振替は不可のため、入庫してから振替を行う',index=idx)

    if source == "06_店頭買取.md" and number == "1":
        # 査定のやり直しは循環するため集合差では工程を切り分けられない。
        # 承諾/一部キャンセル/全キャンセルは図形#8/#9/#11とR46–69を根拠に固定する。
        cases = [
            ("査定承諾・経理振込・通販商品", "全品の査定承諾、経理対応が必要、商品登録済み、日英NM", (52,78,99,103,109), {"査定回答":"全品承諾","支払方法":"経理振込","レジ残金":"0円","商品状態":"日本語NM"}),
            ("一部キャンセル後の再査定・承諾", "査定商品の一部キャンセル後、再査定結果を承諾", (52,78,99,103,109), {"査定回答":"3枚中1枚キャンセル、残り2枚を承諾","支払方法":"経理振込","商品状態":"日本語NM"}),
            ("査定承諾・レジ出金", "全品の査定承諾、経理対応は不要", (52,78,99,103,109), {"査定回答":"全品承諾","支払方法":"レジ出金","レジ残金":"5,000円","査定金額":"1,200円","商品状態":"日本語NM"}),
            ("未登録商品の実在庫登録後に入庫", "査定承諾、買取商品の一部が商品未登録", (52,99,103,109), {"査定回答":"全品承諾","商品登録":"3枚中1枚の商品未登録","支払方法":"経理振込","商品状態":"日本語NM"}),
            ("査定承諾・店頭商品を陳列", "査定承諾、店頭商品に該当", (52,78,115), {"査定回答":"全品承諾","商品状態":"日本語SP","買取価格":"500円","支払方法":"経理振込"}),
        ]
        for idx,(title,condition,exclude,inputs) in enumerate(cases):
            rr=select(exclude=exclude)
            if idx==1:
                rr=rewrite(rr,46,"査定3枚のうち1枚のキャンセルを受け付け、残り2枚をMTGバイヤーで再査定し、査定結果を顧客と確認して承諾を得る")
            else:
                rr=rewrite(rr,46,"査定結果を顧客と確認し、全品の買取承諾を得る")
            rr=rewrite(rr,59,"経理対応を行わず、レジから査定金額1,200円を出金する" if idx==2 else "経理払い出し待ちとし、経理へ振込を依頼する。経理担当が振込後、買取詳細で買取成立にする")
            route(title,condition,rr,"同じ買取受付の承諾明細・支払金額・入庫数量を照合し、店頭陳列まで完了した" if idx==4 else "同じ買取受付の承諾明細・支払金額・入庫数量を照合し、仕入れ作業へ引き渡した",inputs,
                  "査定前の買取受付と身分証の控え、指定の査定回答・商品登録状態・支払条件を用意する。自動入庫は業務時計を15時に進めて実施結果を確認する。",
                  "R46–115,図形#8/#9/#11", "査定結果をお客様と確認する", index=idx)
        rr=rewrite(select(22,28,34,40,46,52),46,"査定結果を顧客と確認し、全品キャンセルの回答を受ける")
        route("全品キャンセルで終了","査定回答=全品キャンセル",rr,"同じ買取受付が買取キャンセルとなり、出金・買取成立・入庫へ進まない",
              {"査定回答":"全品キャンセル","査定対象枚数":"3"},"査定済みの3枚を用意し、顧客から全品キャンセルと回答する。出金と在庫の実施前後記録を保存する。",
              "R46–52,図形#11", "買取一覧のステータスを「買取キャンセル」に更新される")

    if source == "08_イベント管理.md" and number == "2":
        # R119/R125 are the campaign refund sequence. Their loose connector
        # must never leak into the cancellation branch or the no-campaign branch.
        choices = [
            ("キャンセルなし・キャンペーン対象外",(59,65,71,107),{"キャンセル希望":"なし","キャンペーン対象":"対象外"},"申込を継続し、キャンセル・返金を行わずイベント受付へ進む"),
            ("キャンセル申込・返金完了",(59,65,71,77,95,83,89,101),{"キャンセル希望":"あり","参加費":"1,000円"},"同じイベント申込がキャンセルされ、返金依頼から返金完了・顧客連絡まで追跡できる"),
            ("キャンペーン対象・問い合わせ後に返金",(59,65,71,107,113,119,125,131),{"キャンセル希望":"なし","キャンペーン対象":"対象","参加費":"1,000円"},"同じイベント申込についてキャンペーンの問い合わせ・返金依頼・返金完了連絡を追跡できる"),
        ]
        for idx,(title,rnums,inputs,end) in enumerate(choices):
            route(title,"、".join(f"{k}={v}" for k,v in inputs.items()), select(*rnums),end,inputs,
                  "参加費支払済みのテスト申込を用意し、該当イベントのキャンペーン条件に対する対象/対象外を事前に確定する。",
                  "R71–131,図形#17/#29", "キャンセル申込", index=idx)

    if source == "14_ネット買取.md" and number == "1":
        for idx,item in enumerate(routes):
            present={g.row_r_number(row) for row in item.rows}
            required=[row for row in rows if g.row_r_number(row) in {'50','55'} and g.row_r_number(row) not in present]
            if required:
                combined=list(item.rows)+required
                combined.sort(key=lambda row:int(g.row_r_number(row)))
                routes[idx]=replace(item,rows=tuple(combined))

    if source == "14_ネット買取.md" and number == "2":
        # The payout/return tails are disjoint. Text-to-shape name differences
        # previously left unmatched rows from both branches in both routes.
        for idx, sale in enumerate((False, True)):
            rr = select(exclude=(181,189) if sale else (159,163,167,172,177))
            rr = rewrite(rr,134,"買取履歴で査定金額を確認し、売却するを選択する" if sale else "買取履歴で査定金額を確認し、売却しないを選択する")
            rr = rewrite(rr,154,"売却する選択を確認し、振込手続きを進める" if sale else "売却しない選択を確認し、着払いによる返送処理を行う")
            route("売却承諾・振込後に入庫待ちへ引継ぎ" if sale else "売却拒否・着払い返送完了", "査定回答=売却する" if sale else "査定回答=売却しない", rr,
                  "同じネット買取申込の振込結果と査定承諾額1,200円が一致し、全商品の実在庫登録済みを確認して入庫待ちへ遷移し、カード仕入れ業務へ引き渡した" if sale else "同じネット買取申込のカードを着払いで返送し、顧客が返送カードを受領した",
                  {"査定回答":"売却する" if sale else "売却しない", "査定金額":"1,200円", "返送方法":"対象外" if sale else "着払い"},
                  "同じ申込番号で査定済み・実在庫登録済みのカード3枚と査定結果1,200円を用意し、顧客が指定の回答を選択する。",
                  "R134–155,R159–189", "売却しない場合は着払いによる返送処理を行う", index=idx)

    if source == "14_ネット買取.md" and number == "3":
        route("本人確認未確認・1万円以上で簡易書留", "本人確認=未確認、買取価格=12,000円", rows,
              "追跡番号で簡易書留の顧客受領を確認し、本人確認状態が簡易書留確認済みとなり、振込依頼作業へ進んだ",
              {"本人確認状態":"未確認", "査定金額":"12,000円", "簡易書留追跡番号":"テスト用配達完了記録と一致する番号"},
              "査定結果まで完了した本人確認未確認の申込を用意する。テスト用簡易書留を発送し、受領を追跡できる環境を使う。",
              "R198–227", "買取価格が１万以上でかつ本人確認未確認か判定する", index=0)
        for label, status, amount in (("本人確認済み", "確認済み", "12,000円"), ("1万円未満", "未確認", "9,000円")):
            rr = rewrite(select(193,198,227),198,"本人確認が確認済みまたは買取価格1万円未満であることを確認し、簡易書留による本人確認を省略する")
            route(f"{label}・簡易書留省略", f"本人確認={status}、買取価格={amount}", rr,
                  "簡易書留の発送を行わず、同じ申込を振込依頼作業へ引き渡した",
                  {"本人確認状態":status,"査定金額":amount}, "査定結果まで完了した申込に、指定の本人確認状態と査定金額を設定する。",
                  "R198–201,R227", "簡易書留による本人確認を行わない")

    if source == "08_イベント管理.md" and number == "3":
        for idx, registered in enumerate((True,False)):
            rr = rewrite(routes[idx].rows,161,"会員登録済みであることを確認する" if registered else "未登録の顧客に登録を促し、登録に同意したことを確認する")
            route("既存会員として参加" if registered else "会員登録に同意して参加", "会員登録=登録済み" if registered else "会員登録=未登録、登録意思=同意", rr,
                  "会員番号に紐づく参加者へのポイント付与と当日のイベント売上登録が完了した",
                  {"会員登録":"登録済み" if registered else "未登録", "登録意思":"登録済み" if registered else "同意"},
                  "テスト参加者の会員登録状態を指定し、イベント受付後に会員番号と付与履歴を照合する。",
                  "R161–186", "会員登録されていない場合は、会員登録を促す", index=idx)
        rr = rewrite(select(143,149,155,161),161,"未登録の顧客が会員登録を拒否したことを記録し、ポイントなどの受取拒否として終了する")
        route("会員登録拒否による終了", "会員登録=未登録、登録意思=拒否", rr,
              "顧客の会員登録拒否が記録され、当該顧客の新規会員登録・デッキ登録・ポイント付与へ進まず終了した",
              {"会員登録":"未登録", "登録意思":"拒否", "参加者識別":"テスト参加者（会員番号なし）"},
              "会員未登録のテスト参加者を用意し、会員登録の案内に対して拒否と回答する。付与前後の参加者記録を保存する。",
              "R161–162", "拒否された場合はポイントなどの受取拒否とみなして、終了する")

    if source == "16_通販受注管理.md" and number == "8":
        for idx, failed in enumerate((False, True)):
            rr = rewrite(rows,348,"依頼者に減額不能を報告し、その後の返金処理を依頼元の部署へ引き継ぐ" if failed else "依頼者へ減額処理の対応完了と金額を報告する")
            route("減額不能・依頼元部署へ返金引き継ぎ" if failed else "減額完了・依頼者へ報告", "SPLINKS減額結果=不能" if failed else "SPLINKS減額結果=成功", rr,
                  "減額が未実施のままであることと、同じ依頼番号・返金対象金額・不能結果を依頼者へ報告し、その後の返金処理を依頼元部署へ引き継いだ" if failed else "依頼額1,000円の減額結果がSPLINKSの処理記録と一致し、依頼者への完了報告に同じ対象と金額が記載された",
                  {"決済金額":"3,000円","返金対象金額":"1,000円","SPLINKS減額結果":"不能" if failed else "成功", "減額後金額":"3,000円（減額未実施）" if failed else "2,000円", "依頼元部署":"テスト店舗大会担当"},
                  "テスト決済3,000円の取引番号を返金依頼フォームに記載し、減額額1,000円を依頼する。SPLINKS検証環境の応答を指定の成功/不能に設定し、応答と報告を保存する。不能理由の種類は原典に規定がないため実エラーコードを業務条件に追加しない。",
                  "R337–349", "減額が対応できない場合は報告のみでその後の返金処理は各部署の対応に委譲", index=0 if idx==0 else None)

    if source == "16_通販受注管理.md" and number == "3":
        for idx, after in enumerate((False,True)):
            rr = select() if after else select(156,172,183,204)
            rr = rewrite(rr,183,"確認時刻が15時以降のためコンビニとSPLINKSの確認を行う" if after else "確認時刻が15時より前のため銀行振込・郵便振替の確認で終了する")
            route("15時以降・コンビニ決済とSPLINKSの照合" if after else "15時前・銀行と郵便の入金確認", "業務確認日時=2026-10-13 16:00（Asia/Tokyo）" if after else "業務確認日時=2026-10-13 14:00（Asia/Tokyo）", rr,
                  "同じ受注番号と決済コードでコンビニ・SPLINKS・EC-CUBEの決済状況を照合し、発送管理台帳の入金日を更新して不正利用確認まで完了した" if after else "銀行と郵便の入金記録を同じ受注の台帳に反映し、コンビニ・SPLINKSの追加確認を行わず終了した",
                  {"業務確認日時":"2026-10-13 16:00 Asia/Tokyo" if after else "2026-10-13 14:00 Asia/Tokyo", "入金日":"2026-10-13", "入金額":"3,000円", "決済コード":"テスト取引と同じコンビニ決済コード"},
                  "業務時刻は担当者の作業条件として判定する。指定時刻に確認するかテスト用の業務時計を指定時刻に固定し、操作開始時刻を記録する。銀行・郵便と、15時以降用にはコンビニ・SPLINKSの同日入金記録を各受注番号で準備する。",
                  "R156–204", "15時以降の確認場合、コンビニとSPLINKSの確認も行う", index=idx)

    if source == "16_通販受注管理.md" and number == "9":
        route("振込で返金", "返金方法=振込", select(exclude=(395,)),
              "同じ受注の返金額1,000円の振込完了、返金処理記録更新、お客様への完了案内が確認された",
              {"返金方法":"振込","返金対象金額":"1,000円"}, "返金先口座と返金対象1,000円を顧客に確認し、経理担当への振込依頼メールを準備する。",
              "R358–400", "振込による返金", index=0)
        for full in (False, True):
            route("全額ポイント使用受注のポイント返金" if full else "顧客希望によるポイント返金", "元決済=全額ポイント使用、返金方法=ポイント" if full else "返金方法の顧客希望=ポイント", select(exclude=(368,375,380,386)),
                  "同じ顧客のポイント付与履歴と付与前後の残高差が返金ポイント数に一致し、お客様への完了案内が確認された",
                  {"返金方法":"ポイント", "元決済":"全額ポイント" if full else "銀行振込", "返金ポイント数":"1,000", "付与前残高":"200", "付与後残高":"1,200"},
                  "ポイント履歴が追跡できる顧客を用意し、返金ポイント数1,000と付与前残高200を控える。",
                  "R358–359,R395–400", "全額ポイント使用の場合での返金はポイント付与以外では行わない" if full else "ポイント付与による返金")

    if source == "10_商品登録・編集_tobe.md" and number == "4":
        # Both diamond decisions ask the same business fact; do not combine
        # “deck” at the first and “non-deck” at the second.
        while len(routes) > 2:
            routes.pop()
        for idx, deck in enumerate((False,True)):
            rr = select(exclude=(172,176,181,195,201,206) if deck else (155,172,176,181,190))
            rr = tuple(sorted(rr,key=lambda r:int(g.row_r_number(r) or "0")))
            route("デッキセット作成" if deck else "既製品登録", "商品種別=デッキセット" if deck else "商品種別=既製品", rr,
                  "作成したデッキリストを商品へ反映し、結合によるデッキセット在庫を登録して公開した" if deck else "登録商品の在庫CSVを作成・取り込みし、在庫数を反映して商品を公開した",
                  {"商品種別":"デッキセット" if deck else "既製品", "公開状態":"非公開"},
                  "未登録の商品と画像を用意する。デッキセットの場合は構成商品の在庫とデッキリストを準備し、既製品の場合は入庫数量を在庫CSVへ記載する。",
                  "R145–211,図形#66", "デッキセットの在庫については結合で作成する", index=idx)

    if source == "18_デッキ登録.md" and number == "1":
        combinations=((False,False),(True,False),(False,True),(True,True))
        for idx,(tag,archetype) in enumerate(combinations):
            excluded=([29] if tag else [])+([35] if archetype else [])
            inputs={"デッキタグ":"登録済み" if tag else "未登録","アーキタイプ":"登録済み" if archetype else "未登録"}
            route("・".join(f"{k}{v}" for k,v in inputs.items()),"、".join(f"{k}={v}" for k,v in inputs.items()),select(exclude=excluded),
                  "不足するタグとアーキタイプだけを登録し、同じデッキへ指定したタグ・アーキタイプが紐付いた",inputs,
                  "デッキ内容と指定のタグ・アーキタイプを用意する。登録済みの場合は実在IDを控え、未登録の場合は既存一覧にないテスト名称を使う。",
                  "R29–41","登録しようとしているデッキに該当するタグが無い場合、登録する",index=0 if idx==0 else None)

    if source == "18_デッキ登録.md" and number == "2":
        rr=rewrite(rows,53,"入賞者のデッキ更新で誤りを確認したら、顧客へ正しい内容を問い合わせ、回答に基づいて訂正して更新する")
        route("登録内容の誤りを顧客確認して訂正","デッキ登録内容に誤りがあり、顧客から訂正内容を確認できる",rr,
              "同じデッキIDの公開内容が顧客回答による訂正内容と一致した",
              {"登録内容":"テスト顧客の正しいデッキ内容とカード1件が異なる","顧客回答":"誤った1件の正しいカード名・枚数"},
              "入賞者の正しいデッキ内容の控えと、1件が異なるオンライン登録データを用意し、顧客役が訂正内容を回答できるようにする。",
              "R47–54","更新時にエラーがある場合は、可能ならお客様に聞くなどして修正する")

    if source == "08_イベント管理.md" and number == "3":
        base=routes[0]
        for competitive in (False,True):
            rr=base.rows if competitive else tuple(r for r in base.rows if g.row_r_number(r)!="143")
            rr=rewrite(rr,149,"出力済み申込リストと参加者を照会する" if competitive else "オンライン受付を行わないイベントとして受付時に参加費1,000円を徴収する")
            if competitive:
                rr=rewrite(rr,143,"競技イベントの申込一覧CSVと登録済みデッキを参加者全員分PDF出力する")
                rr=rewrite(rr,155,"イベントを実施し、参加者全員の登録デッキを確認する")
                rr=tuple(r for r in rr if g.row_r_number(r)!="174")
            route("競技イベント・登録済みデッキ照合" if competitive else "当日受付・参加費徴収", "オンライン受付=あり、競技イベント、デッキ登録=完了済み" if competitive else "オンライン受付=なし、既存会員",rr,
                  "申込一覧・全員分のデッキPDF・参加者を照合し、重ねてデッキ登録をせずポイント付与と売上登録を完了した" if competitive else "受付時の参加費1,000円の徴収記録が当日のスマレジイベント売上に含まれ、参加者へのポイント付与が完了した",
                  {"オンライン受付":"あり" if competitive else "なし","イベント区分":"競技" if competitive else "通常","参加費":"1,000円","会員登録":"登録済み","デッキ登録":"オンライン受付時に完了" if competitive else "未登録"},
                  "申込番号・会員番号で参加者を特定する。競技イベントは全員分の登録デッキを用意し、当日受付は参加費未徴収として開始する。",
                  "R143–186","競技イベントの場合は、デッキ登録されたデッキを全員分PDFで出力する" if competitive else "オンライン受付でない場合、参加費も徴収する")

    if source == "12_在庫管理.md" and number == "8" and pattern.name=="欠品対応":
        rr=rewrite(select(493,499,503,510),510,"17:30以降の通販受注について商品管理チームに欠品捜索を依頼し、翌日対応として引き継ぐ")
        route("17:30以降・通販等は翌日対応","依頼日時=2026-10-13 18:00、依頼区分=通販",rr,
              "同じ欠品商品と受注番号の捜索依頼を商品管理チームへ引き継ぎ、翌日対応として受け付けられた",
              {"業務確認日時":"2026-10-13 18:00 Asia/Tokyo","依頼区分":"通販","捜索担当":"商品管理チーム"},
              "欠品商品の現物が見つからない受注を用意し、17:30以降の業務時計で依頼を記録する。",
              "R510–515","通販、大口、社内移動は翌日対応となる")
        rr=rewrite(select(493,499,503,510,516,521),510,"17:30以降の店内注文について商品管理チームへ迅速に捜索依頼を出し、当日対応を依頼する")
        route("17:30以降・店内注文は当日対応","依頼日時=2026-10-13 18:00、依頼区分=店内注文",rr,
              "同じ欠品商品の捜索依頼が当日対応として引き継がれ、捜索結果が依頼元へ戻された",
              {"業務確認日時":"2026-10-13 18:00 Asia/Tokyo","依頼区分":"店内注文","捜索結果":"補填カードあり"},
              "欠品商品と同一商品を補填用在庫に用意し、17:30以降の店内注文として捜索を依頼する。",
              "R510–521","店内注文もしくは事前の場合は迅速に捜索依頼をだす")
        route("捜索でカード発見・補填","捜索結果=同一商品を発見",select(exclude=(528,)),
              "捜索で発見した同一商品の種類と数量が欠品依頼と一致し、補填できるため最終欠品の顧客対応・返金へ進まない",
              {"捜索結果":"対象カード3枚を発見","欠品数量":"3"},
              "商品コード・状態・言語・数量が欠品依頼と一致するカードを捜索場所へ用意する。",
              "R499–528","カードが見つからなかった場合は、最終欠品となり")

    if source == "16_通販受注管理.md" and number == "8":
        rr=rewrite(rows,343,"依頼内容に不備がないことを確認し、SPLINKSで請求のキャンセルを行う")
        rr=rewrite(rr,348,"同じ取引の請求キャンセルが完了したことを依頼者へ報告する")
        route("請求キャンセル・依頼者へ報告","依頼内容=請求キャンセル",rr,
              "同じ取引番号の請求キャンセル結果と依頼者への完了報告が一致した",
              {"決済金額":"3,000円","依頼内容":"請求キャンセル","返金対象金額":"3,000円"},
              "キャンセル可能な検証用取引を準備し、その取引番号と全額3,000円の請求キャンセルを依頼する。",
              "R337–348","決済の減額か請求のキャンセルが必要")

    if source == "05_店頭受取受注管理.md":
        for idx,r in enumerate(routes):
            expired=idx==1
            inputs={"注文日":"2026-10-01","受取期限":"2026-10-07（注文日を含む7日間）", "業務確認日時":"2026-10-09 10:00 Asia/Tokyo" if expired else "2026-10-05 10:00 Asia/Tokyo"}
            routes[idx]=replace(r,inputs=tuple(inputs.items()),preparation="注文日を含めて7日間の受取期限になるテスト注文を用意する。担当者の業務時計を指定日時に設定し、期限内/期限超過を判定して同じ受注の引渡しまたはキャンセル結果を確認する。")

    if source == "12_在庫管理.md" and number == "1":
        cases=[
            ("未登録の新商品入荷",(49,55,58,62),"商品未登録の新商品を入荷する","承認した原価と数量が同じ商品コードの在庫へ反映された","新商品入荷（商品未登録の場合）"),
            ("BOXから既知のパックへ分割",(69,75,84),"分割元=BOX、分割先=登録済みパック","分割元BOXの出庫数量と承認した分割先パックの入庫数量が分割記録と一致した","ボックスをパックに分割"),
            ("パック開封後にカードを特定して分割",(94,100,108,114,122,128),"分割元=新品パック、登録時の分割先=未指定","開封後のカードを同じ分割データへCSVで紐付け、承認後のカード在庫が開封結果と一致した","新品パックを開封してシングルカードとして登録"),
            ("オリパ・福袋を結合して作成",(137,144,150,159),"結合元=構成商品、結合先=新規オリパ","結合元商品の出庫数量と承認後のオリパ入庫数量が同じ結合データで追跡できた","オリパ、福袋の作成"),
        ]
        for idx,(title,rnums,condition,end,quote) in enumerate(cases):
            route(title,condition,select(*rnums),end,{"入荷・加工区分":title,"原価":"500円","処理数量":"3"},
                  "対象商品コードと加工前の在庫数量を記録する。分割・結合では構成商品の対応と数量をテストマスタに登録し、登録時と承認後の双方で元/先在庫を照合する。",
                  f"R{min(rnums)}–{max(rnums)}",quote,index=0 if idx==0 else None)
        # 原典の図形#81–84が既存の工程を明示的に再利用している。
        extra=[
            ("デッキセット等の固定構成商品を結合",(137,144,150,159),"結合データ作成の流れは1-④オリパの作成（ランダム商品の作成）と同様となる", "商品種別=固定構成デッキセット", "固定構成の商品のみを選択して結合し、構成数量とセット入庫数量を照合した"),
            ("オリパ・福袋を開封して分割",(94,100,108,114,122,128),"分割データ作成の流れは1-③新品パックを開封してシングルカードとして登録（分割先がわからない）と同様となる", "商品種別=オリパ・福袋、分割先=開封後に確定", "分割先を未指定で登録し、開封結果をCSVで同じ分割記録へ紐付けて入庫した"),
            ("デッキセット等の固定構成商品を分割",(69,75,84),"分割データ作成の流れは1-②ボックスをパックに分割（分割先があらかじめわかっている）と同様となる", "商品種別=固定構成デッキセット、分割先=登録済み構成商品", "固定構成の分割先と数量を登録し、承認後に構成商品の在庫へ反映した"),
            ("既存商品の入荷",(55,58,62),"既存商品入荷の流れは新商品入荷の1-①-2以降と同様となる", "商品登録=既存", "既存商品を新規登録せず、原価と数量を入れた在庫CSVを取り込み、承認後の在庫へ反映した"),
        ]
        for title,rnums,quote,condition,end in extra:
            rr=select(*rnums)
            if "結合" in title:
                rr=rewrite(rr,137,"結合先の固定構成デッキセット商品を登録する")
                rr=rewrite(rr,144,"デッキセットの構成に含まれる商品のみを結合元に選択する")
                rr=rewrite(rr,150,"結合先のデッキセットと構成数量を登録し、結合元の在庫を出庫する")
                rr=rewrite(rr,159,"承認者が固定構成と数量を照合し、デッキセットを入庫済みにする")
            elif "開封" in title:
                rr=rewrite(rr,94,"分割元のオリパ・福袋を選択し、分割先を未指定で分割登録する")
                rr=rewrite(rr,108,"オリパ・福袋を開封し、内容の商品をソート・打ち込み・Wチェックする")
                rr=rewrite(rr,122,"開封結果のCSVを同じオリパ・福袋の分割データへ紐づけ、入庫待ちにする")
                rr=rewrite(rr,128,"承認者が開封結果と数量を照合し、分割先商品を入庫済みにする")
            elif "分割" in title:
                rr=rewrite(rr,69,"分割元の固定構成デッキセットを選択する")
                rr=rewrite(rr,75,"分割先として固定構成の商品と数量を選択し、分割元を出庫する")
                rr=rewrite(rr,84,"承認者が固定構成と数量を照合し、分割先商品を入庫済みにする")
            route(title,condition,rr,end,{"入荷・加工区分":title,"処理数量":"3"},
                  "元商品の在庫と構成商品・数量を準備し、同じ分割/結合番号で登録時の出庫と承認後の入庫を照合する。既存入荷では実在の商品コードの開始在庫を記録する。",
                  "R168–189,図形#81–84",quote)

    if source == "12_在庫管理.md" and number == "10":
        for idx,low in enumerate((True,False)):
            rr=select(621,625,630,636,642) if low else select(645,649,655)
            route("低額棚卸" if low else "低額以外の棚卸","棚卸区分=低額" if low else "棚卸区分=低額以外",rr,
                  "同じ棚卸計画の対象商品と実数を承認者が反映し、対象在庫の数量と履歴が棚卸結果に一致した",
                  {"棚卸区分":"低額" if low else "低額以外","台帳数量":"3","実数":"2"},
                  "棚卸対象商品と対象外商品を用意し、実数2枚・台帳3枚の棚卸結果を同じ計画へ取り込む。対象外在庫も反映前後を記録する。",
                  "R620–655","低額棚卸作業" if low else "低額以外棚卸作業",index=0 if idx==0 else None)
        rr=rewrite(select(621,625,630,636,642),630,"TCチームと通販チームで未処理ピックの確認が困難なため、商品管理チームが棚卸対象カードとの重複を照合する")
        route("未処理ピックが多い場合の棚卸範囲照合","未処理ピック件数が多くTC・通販側で照合困難",rr,
              "商品管理チームが未処理ピックと棚卸範囲の重複を照合した後、同じ棚卸計画の実数が反映された",
              {"棚卸区分":"低額","未処理ピック":"確認困難と判定した一覧","棚卸範囲照合担当":"商品管理チーム"},
              "棚卸範囲の商品コードを含む未処理ピック一覧を用意し、商品管理チームが照合結果を返せるようにする。",
              "R630–632","手つかずピックの量が多く確認が困難な場合は、商品管理チームにて")

    if source == "14_ネット買取.md" and number == "2":
        rr=rewrite(select(98,102,107,112,118,123,129),129,"査定が未完了の申込を査定内容連絡済みに変更できないことを確認する")
        rr=rewrite(rr,123,"MTGバイヤーの一部査定結果を確認し、査定未完了の状態を維持する")
        route("査定未完了で連絡済みへ進めない","MTGバイヤーの査定=未完了",rr,
              "同じ申込のステータスが査定内容連絡済みに変わらず、顧客の査定回答・振込・返送へ進まない",
              {"査定状態":"未完了","ネット買取ステータス":"査定中"},
              "MTGバイヤーの査定完了を行わず、未完了の申込で査定内容連絡済みへの変更を試みる。",
              "R129–131","査定が未完了の場合、査定内容連絡済みにステータス変更できない",kind="業務異常")

    if source == "08_イベント管理.md" and number == "2":
        rr=tuple(r for r in routes[0].rows if g.row_r_number(r)!="65")
        route("デッキ登録なしのイベント申込","イベント設定=デッキ登録なし、キャンセルなし、キャンペーン対象外",rr,
              "同じイベント申込を登録し、デッキ登録へ進まずイベント受付へ引き渡した",
              {"オンライン受付":"あり","デッキ登録設定":"なし"},"オンライン受付あり・デッキ登録なしのイベント日程を用意して顧客が申し込む。",
              "R59–66","デッキ登録ありでイベント作成されている場合")

    if source == "09_商品登録・編集.md" and number == "8":
        for idx,card in enumerate((True,False)):
            rr=rewrite(rows,226,"カード商品CSV登録へ公開ステータス変更CSVをアップロードする" if card else "グッズ商品CSV登録へ公開ステータス変更CSVをアップロードする")
            route("カード商品の公開切替" if card else "グッズ商品の公開切替","商品種別=カード" if card else "商品種別=グッズ",rr,
                  "同じ商品コード群の公開ステータスが指定した公開/非公開へ変わり、対象外の商品は変更されない",
                  {"商品種別":"カード" if card else "グッズ","切替前":"非公開","切替後":"公開"},
                  "対象商品コード2件と対象外商品1件を用意し、対象2件だけをCSVに記載する。商品種別に対応した登録画面を使う。",
                  "R216–227","カード商品の場合は、「カード商品CSV登録」",index=0 if idx==0 else None)

    if source == "12_在庫管理.md" and number == "8" and pattern.name=="安価カード在庫補充作業":
        for idx,r in enumerate(routes[:2]):
            price=idx==1
            routes[idx]=replace(r, inputs=(("価格・在庫管理","価格あり・管理済み" if price else "価格なし"),("補充数量","3")),
                preparation="同じ商品コード3枚の補充を準備する。価格ありは地下2F在庫、価格なしは在庫変更用データを使い、補充前後の在庫を記録する。")
        rr=rewrite(routes[0].rows,540,"パターン2として並び順ファイルを用いて並び順を充て、バックヤード残数ファイルから各カードの残数を補充用ファイルへ反映する")
        route("補充用ファイルのパターン2","補充ファイル作成方法=パターン2、補充商品=価格なし",rr,
              "同じ商品コードの並び順とバックヤード残数が補充用ファイルへ反映され、必要数量の補充と在庫変更結果を照合できた",
              {"補充ファイル作成方法":"パターン2","補充数量":"3","バックヤード残数":"10"},
              "対象カード3枚の補充に対し、並び順ファイルと残数10枚のバックヤード残数ファイルを用意する。商品コードで補充用ファイルへの反映を照合する。",
              "R540–548","パターン2の場合は")

    if source == "14_ネット買取.md" and number == "2":
        rr=rewrite(routes[1].rows,123,"MTGバイヤーからまとめて買い取りのカード情報を取り込み、まとめて買い取り欄の商品・数量・金額を照合して査定完了とする")
        route("まとめて買取明細から振込","査定方式=まとめて買取、売却回答=承諾",rr,
              "まとめて買取欄の明細数量・査定金額が同じ申込の顧客回答と振込金額へ引き継がれ、全商品の実在庫登録済みを確認して入庫待ちへ遷移した",
              {"査定方式":"まとめて買取","対象枚数":"3","査定金額":"1,200円","査定回答":"売却する"},
              "MTGバイヤーでまとめて買取3枚・1,200円を査定し、全商品の実在庫登録を済ませ、同じ申込のまとめて買取欄と顧客回答を照合する。",
              "R123–126","まとめて買い取りがある場合は、まとめて買い取りの欄に")

    if source == "16_通販受注管理.md" and number == "11":
        rr=rewrite(rows,449,"シングルカードの出荷指示に不要な予約が多く含まれるため、未開封製品と同じく受注マスター検索から納品書とラベルデータを取り出す")
        route("不要な予約を含む出荷指示の代替出力","シングルカードの出荷指示に不要な予約が多数含まれる",rr,
              "受注マスターで選んだ予約受注の納品書とラベルデータだけが後続のピック・出荷へ渡り、不要な予約受注が混入しない",
              {"予約種別":"シングルカード","出荷対象":"発売対象の受注2件","対象外":"別発売日の予約受注1件"},
              "同じ出荷指示に対象2件と対象外1件が含まれる予約データを用意し、受注マスター検索で対象2件だけを絞り込む。",
              "R449–453","未開封製品と同じく受注マスター検索から納品書印刷とラベルデータを取り出す場合もある")

    if source == "12_在庫管理.md" and number == "11":
        for label,condition in (("補填カードがないため通販在庫を捜索","補填用カード=なし"),("在庫変動に欠品原因の手掛かりがある","直近の在庫変動=欠品原因を特定できる手掛かりあり")):
            rr=rewrite(rows,666,"通販在庫スペースで対象カードを捜索し、同じ商品コードの直近在庫変動と受注記録を照合する")
            route(label,condition,rr,"同じ商品コードの通販在庫捜索結果を欠品依頼と結び付け、ラインワークスで依頼元に共有した",
                  {"欠品商品":"テスト用の同一商品コード","捜索条件":condition},
                  "欠品依頼と直近在庫変動の記録を用意し、条件に応じて補填カードを置かない、または原因が追跡できる在庫変動を記録する。",
                  "R666–670","補填用のカードが無いor直近の在庫変動から欠品理由が特定できそうな場合")

    return routes


def supplement_data_patterns(s, seed, patterns, g):
    """Concrete business data variations; mechanical validation stays delegated.

    Each rule names an adopted source and actual row. Only a route containing
    that row gets the variation. Independent business endings are handled above.
    """
    source=s.pattern.source_path.rsplit('/',1)[-1]
    indexed={g.row_r_number(row):(idx,row) for idx,row in enumerate(s.route.rows,1)}
    parent=s.pattern.number
    rules=[]

    def add(rnum,title,values,expect,quote,prepare=""):
        if str(rnum) not in indexed:
            return
        original=" ".join(g.full_text(r) for r in s.pattern.rows)
        if quote not in original:
            raise ValueError(f"data evidence changed: {source} R{rnum}: {quote}")
        rules.append((str(rnum),title,values,expect,quote,prepare))

    if source=='06_店頭買取.md' and parent=='1':
        for member in (True,False):
            add(22,'会員受付' if member else '非会員受付',f"会員状態={'登録済み' if member else '未登録'} / 身分証=同じ氏名のテスト身分証 / 買取カード=3枚",
                "登録済み顧客はログイン、未登録顧客は会員情報入力により買取受付が作成され、同じ顧客情報・カード3枚が査定前の受付へ引き継がれること。",
                '会員の場合はログイン、会員でない場合は会員情報を入力してもらう')
        if dict(s.route.inputs).get('商品状態')=='日本語SP':
            for price,dest in ((200,'ストレージ'),(500,'ショーケース')):
                add(86,f'プレイド{price}円の陳列先',f"状態=SP / 買取価格={price}円 / 数量=3 / 陳列先={dest}",f"同じ商品コード3枚の陳列先が{dest}になり、元の買取記録と現物を照合できること。",
                    '買取価格が1円～250円以下のプレイドは、ストレージ等に入庫')

    if source=='14_ネット買取.md' and parent=='1':
        for pc in (True,False):
            add(39,'PCからスマートフォンへ本人確認を引き継ぐ' if pc else 'スマートフォンで本人確認',
                f"開始端末={'PC' if pc else 'スマートフォン'} / 撮影端末=スマートフォン / 身分証=同じテスト会員の身分証",
                "同じ会員の本人確認フォームへ到達し、撮影した本人確認画像が対象会員の確認担当者へ渡ること。",
                'PCの場合マイページ内のオンライン本人確認画面よりQRコードが',
                'PC開始時は表示されたQRコードをスマートフォンで読み取り、スマートフォン開始時は本人確認フォームから撮影する。')

    if source=='15_仕入れ業務.md':
        if parent=='1':
            for price,dest in ((5000,'金庫（赤）'),(1000,'キャビネット（橙）'),(500,'通販棚')):
                add(29,f'価格帯による{dest}への仕分け',f"状態=NM / 更新後価格={price}円 / 数量=3 / 戻し先={dest}",
                    f"同じカード3枚の仕入ファイルと現物が{dest}向けに仕分けされ、後工程へ同じ商品・枚数が渡ること。",'金庫（赤）4800円以上')
            add(29,'低価格プレイドを通販リストから除く','状態=SP / 更新後価格=80円 / 数量=3 / 対照商品=NM・500円・3枚',
                'SP・80円の商品が通販用リストから除かれ、対照のNM商品が残ることを商品コードと枚数で照合できること。',
                'SP・MP・HPのカードは更新後の価格が100円以下の場合は')
        if parent=='2':
            add(47,'統合仕入れ前日の17:30以降に引き継ぐ','統合仕入日=2026-10-14 / 作業日時=2026-10-13 18:00 Asia/Tokyo / ファイル名=20261014 価格ソート用',
                '前日17:30以降に価格ソート用ファイルが指定名でトレードチームのフォルダーへ保存され、翌日の担当者が同じファイルを取得できること。',
                '統合仕入れ前日17:30以降','業務時計と作業記録を指定日時に合わせ、翌日担当者の読み取り権限を用意する。')
        if parent=='3':
            add(130,'16時以降に在庫を投入する','在庫投入日時=2026-10-14 16:30 Asia/Tokyo / 対象商品=3枚',
                '16時以降の取込記録と同じ商品コードの在庫増分3枚、戻しリストの商品・番号札を照合できること。',
                '必ず16時以降に行う','指定日時の業務時計でインポートし、取込日時と対象ファイルを証跡へ記録する。')

    if source=='16_通販受注管理.md' and parent=='1':
        direct=s.route.route_id=='R01'
        for method in (('クレジットカード','代金引換') if direct else ('銀行振込','郵便振替','コンビニ決済')):
            add(48,method+'で購入',f"支払方法={method} / 注文商品=3点 / 支払額=注文確定画面に表示された総額",
                ('同じ受注の注文完了を確認し、振込・入金手続きへ進まないこと。' if direct else '同じ受注番号の支払情報に従って入金し、支払額が注文の支払総額に一致すること。') + ('コンビニ決済では別送された支払方法メールの決済コードと入金記録を照合できること。' if method=='コンビニ決済' else ''),
                'クレジットカード・代金引換以外の場合',
                '指定の支払方法が選択できるテスト注文を用意する。支払方法に応じて決済検証環境・銀行/郵便の入金記録を準備し、実受注番号を採番後に控える。')

    if source=='16_通販受注管理.md' and parent=='7':
        add(299,'複数配送先をメールで依頼','依頼方法=メール / 配送先=2件 / 各配送先の商品数量=3点と2点',
            '通販チームが同じ依頼メールを受領し、2件の配送先・商品・数量を取り違えず発送管理台帳と発送ラベルへ引き継げること。',
            '複数先に配送する場合や、件数が多い場合はメールにて受けつけている')

    if source=='16_通販受注管理.md' and parent=='8':
        amount='請求取消額=3,000円' if dict(s.route.inputs).get('依頼内容')=='請求キャンセル' else '減額額=1,000円'
        for channel,department in (('ラインワークス','通販チーム'),('Gメール','TC東京の通販受注担当'),('依頼フォーム','店舗大会担当')):
            add(337,f'{department}から{channel}で返金依頼',f"依頼元={department} / 依頼チャネル={channel} / 取引番号=同じ検証用決済 / {amount}",
                '通販担当が指定チャネルの依頼を受領し、同じ取引番号・対象金額の処理結果を依頼者へ返せること。減額不能の場合は元の部署へ返金処理を引き継ぐこと。',
                '通販チームはラインワークス、TC東京はGメール、各店舗の大会は依頼フォーム')

    if source=='10_商品登録・編集_tobe.md' and parent=='9':
        for card in (True,False):
            add(312,'カード商品のカテゴリー変更' if card else 'グッズ商品のカテゴリー変更',f"商品種別={'カード' if card else 'グッズ'} / 変更対象カテゴリー=スタンダード→モダン / 維持対象カテゴリー=元の別カテゴリーID",
                '変更対象の親カテゴリーIDだけが差し替わり、その他のカテゴリーIDが維持され、商品種別に対応するCSV登録から同じ商品へ反映されること。',
                'カード商品の場合は、「カード商品CSV登録」')

    if source=='12_在庫管理.md':
        if parent=='9':
            add(604,'別担当者の打ち込み誤りを訂正','元ファイル数量=3 / 別担当者の入力数量=2 / 現物数量=3',
                '差分チェックで同じ商品コードの枚数差1枚を検出し、現物3枚に合わせて訂正したファイルが仕入れ確定の後工程へ渡ること。',
                '誤りがある場合は修正し枚数が会っていることを確認')
        if parent=='8' and s.pattern.name=='欠品対応':
            add(503,'欠品商品の通販在庫を承認して0にする','対象カードの通販在庫=3 / 現物=0 / 変更後数量=0 / 承認者=トレード承認者',
                '同じ欠品商品コードの通販在庫を0へ変更し、承認記録と在庫履歴で理由と処理者を追跡でき、現物がない商品が販売されないこと。',
                '対象カードの通販在庫がある場合は在庫を一時的に0にし')

    if source=='05_店頭受取受注管理.md':
        cancel_row={'1':51,'2':120,'3':180}.get(parent)
        if cancel_row:
            add(cancel_row,'キャンセル後に来店した顧客へ説明','注文日=2026-10-01 / キャンセル日=2026-10-09 / 来店日=2026-10-10 / 来店者=同じ注文の顧客',
                '同じ注文番号のキャンセル状態を確認し、来店した顧客へキャンセル済みと伝え、商品を引き渡さないこと。',
                '受取に来られた場合にキャンセルになった旨を伝える',
                '期限超過でキャンセルした注文を用意し、キャンセル後の来店を担当者間で再現する。事前の取消通知は原典上行わない。')

    if source=='16_通販受注管理.md' and parent=='3' and '188' in indexed:
        add(183,'15時ちょうどから追加の入金確認を行う','業務確認日時=2026-10-14 15:00 Asia/Tokyo / コンビニ入金=1,200円 / SPLINKS取引=同じ対象受注',
            '15:00の作業記録に続いてコンビニ・SPLINKSの確認を実施し、対象受注番号・決済取引番号・入金額を照合できること。',
            '15時以降の確認場合、コンビニとSPLINKSの確認も行う','業務時計を15:00に設定して開始し、15時以降側の経路を最後まで実施する。')

    if source=='10_商品登録・編集_tobe.md' and parent=='4':
        if dict(s.route.inputs).get('商品種別')!='デッキセット':
            add(145,'オリパの商品画像をデザインチームへ依頼','商品種別=オリパ / 商品コード=今回作成対象 / 画像担当=デザインチーム',
                'デザインチームが同じ商品用の画像を作成し、商品コードと対応する画像を後続のCSV商品登録へ渡せること。',
                'オリパ作成時のみデザインチームに画像作成を依頼する')
        add(211,'既に公開されている商品を確認','変更前公開状態=公開 / 商品コード=今回処理対象',
            '同じ商品コードが公開のまま維持され、不要な公開状態変更を行わず在庫登録結果と公開状態を照合できること。',
            '非公開商品だった場合公開設定に変更する')

    if source=='16_通販受注管理.md' and parent=='5':
        for title,values,expect in (
            ('準キャンセル案内','注文日=2026-10-01 / 対応日=2026-10-06 / 未入金', '受注5日後に準キャンセルのテンプレートを使った案内を同じ顧客へ送信し、送信履歴と配送管理台帳を照合できること。'),
            ('一週間後のキャンセル','注文日=2026-10-01 / 対応日=2026-10-08 / 未入金', '一週間後の同じ受注がキャンセルへ変更され、取消案内の送信履歴と配送管理台帳に反映されること。'),
            ('予約入金完了の案内','予約注文=同じ対象受注 / 入金状態=入金完了 / 入金額=受注総額', '同じ予約受注の入金完了後に予約入金メールが送信され、受注番号・宛先・入金額を照合できること。')):
            add(277,title,values,expect,'準キャンセルは受注の5日後キャンセル期限の2日前のタイミングに対応','指定日に業務時計を合わせ、同じ受注に対して対応するメールテンプレートを選択する。')

    if source=='15_仕入れ業務.md' and parent in ('2','3'):
        for price,team,dest in ((500,'各担当チーム','戻し棚'),(1000,'トレードチーム','キャビネット')):
            add(81 if parent=='2' else 145,f'{price}円の商品を担当チームへ戻す',f'商品価格={price}円 / 数量=3 / 戻し担当={team} / 戻し先={dest}',
                f'同じ商品コード3枚の戻し先が{dest}であることを確認し、{team}へ引き継いだ記録と現物枚数を照合できること。',
                'キャビネットへの戻しはトレードが対応')

    if source=='12_在庫管理.md' and parent=='8' and s.pattern.name=='欠品対応':
        for rarity,team in (('スタンダード範囲のR・買取価格あり','トレードチーム'),('スタンダード範囲外のC・買取価格なし・トレード保管なし','商品管理チーム')):
            add(516,team+'へ捜索を依頼',f'対象カード={rarity} / 欠品数量=1 / 依頼先={team}',
                f'同じ欠品商品コードと数量1枚の捜索依頼が{team}へ渡り、依頼番号または連絡記録で結果を追跡できること。',
                'トレードチーム：スタン範囲のR以上、買取価格の付くカード')

    next_num=max([int(p.pattern_id[4:]) for p in patterns if p.pattern_id.startswith('DP-N')]+[1])+1
    for rnum,title,values,expect,quote,prepare in rules:
        pid=f'DP-N{next_num:03d}';next_num+=1
        idx,_row=indexed[rnum]
        evidence=f'原典本文 {source} R{rnum}「{quote}」'
        patterns.append(g.DataPattern(pid,'正常系 業務データ差分',f'正常系#{idx}',title+'（'+evidence+'）',
            prepare or 'この経路と同じ開始状態の対象を別IDで用意し、入力欄の業務条件を設定する。対象の工程を経路内の前後工程と通して確認する。',
            f'{g.primary_target(seed)}-{pid} / {values}',expect))
    return patterns
