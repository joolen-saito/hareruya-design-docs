#!/usr/bin/env python3
"""Reviewed conditional paragraphs and decision inventory for adopted flow sources.

A changed/new conditional paragraph is a failing review item, never silently
counted as covered. The links identify review targets, not an execution result.
"""
from __future__ import annotations
import csv
import hashlib
import json
import re
from pathlib import Path
import generate_scenarios as g
import validate_scenarios as v

REPO=Path(__file__).resolve().parents[4]
DEST=REPO/'scenario_test/audit/2026-10-09_coverage'
CONDITION=re.compile('場合|ならば|以上|以下|以降|未満|以外|不要|不能|できない|拒否|必要に応じ|によって|により|ごとに')
# source prefix / R row / reviewed handling / precise scope or unresolved matter.
REVIEW='''18/29|経路分離|タグ有無とアーキタイプ有無の4組合せを独立化。
18/35|経路分離|タグ有無とアーキタイプ有無の4組合せを独立化。
18/47|経路分離|登録内容の誤りはR53の顧客確認・修正経路で確認。
18/53|経路分離・原典条件不足|連絡可能な顧客へ内容を確認して訂正。顧客に連絡できない場合の後続は未定義。
18/60|実施前提|直近の大会に該当する大会を対象に登録する業務。対象外を無理に登録する経路は作らない。
08/59|実施前提|オンライン受付ありのイベントを対象とする。店頭受付はパターン3の当日受付経路。
08/65|経路分離|デッキ登録あり/なしのイベント申込を分離。
08/77|経路分離|キャンセルあり/なしを分離し、キャンペーン返金と混在させない。
08/143|経路分離|競技イベントの全参加者デッキPDF出力と当日受付を分離。
08/149|経路分離|オンライン受付のリスト照会と当日受付の参加費徴収を分離。
08/155|経路分離|競技イベント経路で登録済みデッキと使用デッキを照合。
08/161|経路分離|登録済み/新規同意/新規拒否を分離。拒否は登録・デッキ・ポイント付与前に終了。
08/174|経路分離|競技イベントの登録済みデッキは再登録を省略。
06/22|業務データ差分|会員ログインと非会員情報入力を別DPにし同じ顧客へ査定を引き継ぐ。
06/59|経路分離|経理振込とレジ出金を分離。金額1200円と残金条件を固定。
06/78|経路分離|未登録商品ありの実在庫化を独立化。
06/82|実施前提|買取承諾経路の業務時計を15時に進め、自動入庫の記録を確認。
06/86|業務データ差分・原典条件競合|日英NMと店頭商品を分離。SP200円はストレージ、500円はショーケース。250円は以下/以上が重複し保留。0円は買取情報に残らない原文を保持。
06/146|独立した親パターン|自動入庫前の手動入庫はパターン3として独立。
14/24|他層参照|職業必須の単項目検証。実在する現行結合ケース参照と未特定観点は各SCNの委譲表で区別。
14/39|業務データ差分|PCのQRからスマートフォンへの引継ぎ/スマートフォン直接撮影を分離。
14/81|経路分離|身分証不備の通知と再提出経路。初回通知受領と会員照会はループ上流として両経路に維持。
14/123|経路分離|まとめて買取の明細・数量・金額の顧客回答から振込結果までを独立化。
14/129|経路分離|査定未完了では連絡済みへ進めない状態を独立化。
14/154|経路分離|売却承諾は振込・仕入へ、拒否は着払い返送・顧客受領で終了。振込後は現HTMLの入庫待ち/未登録在庫あり条件を採用。
14/198|経路分離|未確認12000円/確認済12000円/未確認9000円を分離。OR条件の両枝を確認。
14/227|参照サブフロー|振込依頼から仕入への引継ぎをsource_contractsの参照元・対象工程で接続。
05/51|業務データ差分|注文日含む7日期限超過を取消経路にし、取消後の来店時説明も独立DP。
05/120|業務データ差分|期限超過取消と返金の後、来店時説明を独立DP。
05/152|実施前提|支店注文の受付方式は独立した親パターン3。注文受領と連動バーコード印字を確認。
05/180|業務データ差分|期限超過取消の後、来店時説明を独立DP。
05/211|独立した親パターン|店内PCの支払を親パターン4で扱い、本店・支店の操作環境を明記。
11/40|業務判断|セール対象/割引率は担当者が作成した対象リストを入力根拠とする。原典は商品別の裁量例で一律率を定義していない。
11/107|実施前提|大会・新商品・禁止改定・トレンド等は同じイレギュラー価格調整業務の開始理由。対象カードと調整根拠を記録。
11/134|原典条件不足|通常作業用CSVの出力は具体化。追加で必要となる別データの名称・条件は原典未定義。
09/68|実施前提|NMのみ登録し、画像URLはAWS側の準備を前提とする。
09/81|実施前提|エキスパンションに対応する作業ファイルを準備し対象セットを同一に保つ。
10/145|業務データ差分|オリパはデザインチームへ依頼。既製品/デッキの画像準備はトレード担当。
10/151|経路分離|デッキセット/既製品の判定を後段の在庫登録と同じ値で固定。
10/195|経路分離|デッキセット以外の在庫CSV登録とデッキセットの結合作業を分離。
10/211|業務データ差分|非公開→公開と既公開維持の差分を確認。
10/227|経路分離|元カードデータあり/なしにより新規カード登録サブフローを分離。
09/226|経路分離|カード商品とグッズ商品のCSV登録を別経路で確認。
10/312|業務データ差分|カード/グッズの別と変更対象以外のカテゴリーID維持を具体化。
15/29|業務データ差分・原典条件不足|価格5000/1000/500円の3置場と低価格プレイド除外。971〜979円と4791〜4799円の原典価格帯は未定義で補間しない。
15/47|業務データ差分|統合仕入れ前日17:30以降のファイル名・場所・翌日引継ぎを具体化。
15/52|同一経路の継続工程|R47で設定した前日17:30以降の時計を保持してソート後ファイルを共有。
15/66|通常工程|ソートのフォーマットごとに仕分ける物理工程。対象商品と現物枚数を照合。
15/81|業務データ差分|低価格の戻し棚とキャビネット、各チーム/トレードの引継ぎを分離。
15/86|原典条件不足|規定数以上のストレージを選ぶが規定数そのものは原典未記載。対象日・担当者が準備した選定条件を記録して実施。
15/110|通常工程|4800円以上の高額品の現物数量を照合。R29の価格帯仕分けと接続。
15/130|業務データ差分|16時以降の16:30実行時計とインポート記録・在庫増分を照合。
15/145|業務データ差分|低価格の戻し棚とキャビネット、各チーム/トレードの引継ぎを分離。
16/44|業務データ差分|コンビニ支払では注文メールとは別の支払方法メールと決済コードを照合。
16/48|業務データ差分|カード/CODと銀行/郵便/コンビニの全5決済方法を対象経路のDPへ具体化。
16/53|業務データ差分|銀行/郵便/コンビニの入金額を同一受注に照合。
16/144|通常工程|配送先ごとの振分けは同一受注と配送先を照合する通常工程。
16/183|経路分離・業務データ差分|14:00/16:00経路と15:00ちょうどのDP。15時以降だけコンビニ/SPLINKS確認。
16/200|原典条件不足|高額初回・名義差異・エラー数による確認とショップメモは原典通り保持。高額/回数の閾値と不正判定後の後続は未定義。
17/18|通常工程|停止注文・期限切れ対応・ショップメモの確認を既存発送工程の操作/期待に保持。勝手な保留ステータスを追加しない。
16/277|業務データ差分|受注5日後の準取消案内、一週間後の取消、予約入金完了メールを別DP。
16/288|独立した親パターン|外部メーラー/電話の顧客対応を独立親パターンとして外部記録で観測。
16/299|業務データ差分|フォーム通常依頼と複数先へのメール依頼を分離し宛先/数量を追跡。
16/348|経路分離|減額不能は金額未変更・報告・依頼元部署への返金引継ぎで終了。減額成功や取消の終点と区別。
16/352|独立した親パターン|クレジットカード以外の返金は親パターン9。
16/395|経路分離|銀行返金/希望ポイント返金/全額ポイント支払のポイント返金。後二者に銀行工程を入れない。
16/449|経路分離|不要な予約が混在する場合の受注マスター経由の帳票/ラベル出力を分離。
16/459|通常工程|出荷指示ごとのコメント対応・印刷・ペアリング・保管を同一対象番号で照合。
16/488|独立した親パターン|外部依頼BOX発送は親パターン12として外部への引継ぎを扱う。
12/48|経路分離|未登録新商品入荷を8独立業務の一つとして分離。
12/49|参照サブフロー|新弾は商品登録1〜3、新弾以外は4の参照をsource_contractsで特定。
12/189|経路分離|既存商品入荷は元の1-①-2以降を再利用し、不要な商品登録を行わない。
12/197|実施前提|週次リコメンド、3F入庫先のEC-CUBE/スマレジ区分を対象移動の準備値と照合。
12/277|経路分離|受入数量差異を独立化し、棄却・数量修正・承認入庫を実施。
12/286|経路分離|数量差異修正と商品状態差異の振替を分離。振替は入庫後にのみ実施。
12/294|参照サブフロー|承認者の入庫操作を現HTMLで補完し、再移動は別の移動IDによるフロア間移動へ引継ぎ。
12/303|経路分離|数量一致/出荷不足/受入数量差異には商品振替を混在させず、状態差異NM→SPを別経路で確認。
12/343|参照サブフロー|ショーケース品のフロア間移動を対象範囲付きで接続。
12/393|実施前提・原典条件不足|成田から戻す必要のある商品の移動。原典スマレジ依頼に対し現HTMLの成田連携境界はsource_contractsで未確定箇所を保持。
12/414|実施前提|SP以下をショーケース品として本店へ移動する入力条件を通常工程に保持。
12/457|経路分離|数量差異があれば棄却・再登録の経路へ分離。
12/466|経路分離|棄却後の再登録までを最終確認。再登録後の再承認/指示は別の移動IDとして再開。
12/540|経路分離|補充ファイル方式1/2を分離。方式2のみ並び順/バックヤード残数を利用。
12/566|経路分離|価格ありの在庫管理済み商品と価格なし商品を具体入力で分離。
12/499|経路分離|カード発見時の補填と未発見時の継続捜索/最終欠品を分離。補填は承認者へ確認。
12/503|業務データ差分|通販在庫3だが現物0を用意し、承認で0へ変更して販売対象外を確認。
12/510|経路分離|17:30以降の店内注文は当日、通販等は翌日対応。日時と依頼先を準備。
12/516|業務データ差分|スタンダードR価格ありはトレード、範囲外C価格なし保管なしは商品管理へ依頼。
12/528|経路分離|発見時に最終欠品へ進ませない。未発見時は返金等の顧客対応への引継ぎ。
12/604|業務データ差分|別担当者の入力2と現物3の差分を検出して訂正したファイルを後工程へ渡す。
12/630|経路分離|未処理ピックが多いときに商品管理チームが照合する経路を分離。
12/644|経路分離|低額以外の棚卸を低額棚卸と混在させない。
12/666|経路分離|補填カードなし/在庫履歴の手掛かりありのOR条件を両経路で確認。
12/713|通常工程|廃棄理由で在庫変更を申請し承認者による減算と履歴を確認。任意の承認不要経路は作らない。
12/740|原典条件不足|借用時の販売除外を在庫移動で観測。ECCUBE貸出店（仮）の実店舗ID・運用は原典未確定。
'''


def write_tsv(name,header,rows):
    with (DEST/name).open('w',encoding='utf-8',newline='') as f:
        w=csv.writer(f,delimiter='\t');w.writerow(header);w.writerows(rows)


def main():
    review={}
    for line in REVIEW.splitlines():
        if line: k,status,note=line.split('|',2);review[k]=(status,note)
    generated={}
    for path in (REPO/'scenario_test/scenario').glob('SCN-*.md'):
        text=path.read_text();parent=v.bullet_value(text,'親業務フローパターン')
        sid=re.search(r'^# (SCN-\S+)',text,re.M).group(1)
        generated.setdefault(parent,[]).append((sid,text))
    g.reset_generation_state(); candidates=[]
    for path,title,business,text in g.discover_flows(REPO,None):
        for p in g.parse_patterns(text):
            p.source_path=str(path);candidates.append((path,title,business,text,p))
    paragraphs=[]; decisions=[]; unreviewed=[]; adopted=g.dedupe_patterns(candidates)
    for path,title,business,raw,p in adopted:
        parent=f'{business} / パターン{p.number} / {p.name}'
        scns=generated.get(parent,[])
        for row in p.rows:
            full=g.full_text(row)
            if not CONDITION.search(full):continue
            rnum=g.row_r_number(row);key=path.name[:2]+'/'+rnum
            if key not in review:unreviewed.append((str(path),rnum,full));continue
            status,note=review[key]
            dps=[]
            evidence_r='48' if path.name=='16_通販受注管理.md' and rnum in {'44','53'} else rnum
            for sid,text in scns:
                for dp in v.table_after(text,'## データパターン'):
                    if re.search(rf'{re.escape(path.name)} R{evidence_r}(?!\d)',dp.get('目的','')):
                        dps.append(sid+':'+dp['パターンID'])
            paragraphs.append([str(path.resolve().relative_to(REPO)),p.number,p.name,'R'+rnum,full,status,note,';'.join(x[0] for x in scns),';'.join(dps)])
        for decision in sorted((n for n in p.nodes.values() if n.kind in {'判断','diamond'}),key=lambda n:int(n.number)):
            numbers=list(dict.fromkeys(e.dst_no for e in p.flow_edges if e.src_no==decision.number and e.dst_no))
            targets=[p.nodes[n] for n in numbers if n in p.nodes]
            note='本文に条件がある場合は本文判定台帳を優先。ループ・自由端・同名判断は意味回帰で照合。'
            if len(targets)<2:
                note='図の出口だけでは分岐不足。本文の本人確認/金額のOR条件、または銀行/ポイントの返金手順を根拠に経路補完済み。'
            decisions.append([str(path.resolve().relative_to(REPO)),p.number,p.name,str(decision.number),decision.text,';'.join(f'{x.number}:{x.text}' for x in targets),';'.join(x[0] for x in scns),note])
    if unreviewed:raise SystemExit('UNREVIEWED conditional paragraphs: '+repr(unreviewed))
    expected=json.loads((Path(__file__).parent.parent/'references/route-condition-review-baseline.json').read_text())
    current={}
    for r in paragraphs:
        current['paragraph|'+r[0]+'|'+r[1]+'|'+r[3]]=hashlib.sha256(r[4].encode()).hexdigest()
    for r in decisions:
        current['decision|'+r[0]+'|'+r[1]+'|'+r[3]]=hashlib.sha256((r[4]+'|'+r[5]).encode()).hexdigest()
    changed=[key for key in current.keys()|expected.keys() if current.get(key)!=expected.get(key)]
    if changed:raise SystemExit('Source conditions changed; review required: '+repr(sorted(changed)))
    write_tsv('source_conditional_review.tsv',['出典','パターン','親パターン名','原典行','継続行込み原文','判定','確認範囲・限界','関連SCN（実行結果ではない）','明示データ差分'],paragraphs)
    write_tsv('source_decision_inventory.tsv',['出典','パターン','親パターン名','判断ノード','判断内容','実線の分岐先候補','関連SCN（実行結果ではない）','照合方針'],decisions)
    counts={}
    for row in paragraphs:counts[row[5]]=counts.get(row[5],0)+1
    summary={'adopted_source_patterns':len(adopted),'reviewed_conditional_paragraphs':len(paragraphs),'decision_nodes':len(decisions),'unreviewed_conditional_paragraphs':0,'dispositions':counts,'note':'本文条件と分岐図の設計レビュー。関連SCNの存在は全条件の実行済みを意味しない。原典条件不足/競合は13_業務フロー補記依頼リスト.mdを参照。'}
    (DEST/'source_branch_review_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary,ensure_ascii=False))

if __name__=='__main__':main()
