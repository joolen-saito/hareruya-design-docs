"""受注・店頭受取・買取の原典照合済み実施手順補正。

金額・期限はテスト入力であり業務ルールを追加しない。外部アカウントや
マクロを存在したことにせず、原本の準備・観測を開始条件として残す。
"""
from __future__ import annotations

import json
import re
from dataclasses import replace
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DATA: dict = {}
BUSINESSES = {"通販受注管理", "店頭受取受注管理", "ネット買取", "店頭買取"}


def configure(repo, g=None):
    global ROOT, DATA
    ROOT = Path(repo)
    path = ROOT / "scenario_test/coverage/execution_repairs/orders_contracts.json"
    DATA = json.loads(path.read_text()) if path.exists() else {}


def _business(s):
    return getattr(s, "business_title", getattr(s, "business", ""))


def _order(s):
    return int(s.sid.rsplit("-", 1)[-1])


def pickup_dates(sid, as_of="2026-10-09"):
    """業務時計を操作せず、実施日に対して注文日を準備する。"""
    current = date.fromisoformat(as_of)
    days = 14 if "スムーズ" in sid else 1 if "店内PC" in sid else 7
    expired = int(sid.rsplit("-",1)[-1]) in (2,4,6,8)
    ordered = current - timedelta(days=days) if expired else current
    return {"注文日": ordered.isoformat(), "受取期限": (ordered+timedelta(days=days-1)).isoformat()+f"（注文日を含む{days}日間）", "業務確認日時": current.isoformat()+" 10:00 Asia/Tokyo"}


def prepare_scenario(s, g):
    if _business(s) not in BUSINESSES:
        return s
    # キャンセル経路は一度削除した番号札を入金後として再削除しない。
    if s.sid == "SCN-ORDER-店頭支払店内PC支店-008":
        rows = tuple(row for row in s.route.rows if "入金済みにした店頭注文番号" not in g.full_text(row))
        s.route = replace(s.route, rows=rows)
    if _business(s) == "店頭受取受注管理":
        updates = pickup_dates(s.sid)
        inputs = dict(s.route.inputs)
        inputs.update(updates)
        preparation = "実施日の業務日付と同じ受注の注文日を比較する。試験データの注文日はprepare_orders_order_date.pyで当該受注IDのみ補正し、M05-11の注文日を再表示して確認する。OS時刻は変更しない。"
        s.route = replace(s.route, inputs=tuple(inputs.items()), preparation=preparation)
    # 補完SCNの契約は元レコードの追加後に差し替える。
    import source_contract_adapter as adapter
    import supplemental_scenarios as supplemental
    record = supplemental.RECORDS.get(s.sid)
    overrides = DATA.get("supplemental_steps", {}).get(s.sid, {})
    if record and overrides:
        for number, fields in overrides.items():
            step = record["steps"][int(number) - 1]
            oldrow = g.normal_flow_rows(g.scenario_route_pattern(s))[int(number) - 1]
            action = g.business_action_from_row(oldrow, s.pattern.name)
            step.update(fields)
            found = next((c for c in adapter.CONTRACTS if c.get("business") == s.business_title and c.get("source_action") == action), None)
            if found:
                found.update(fields)
    # 追加した実使用画面を出典・STI機能表へも反映する。
    pattern = g.scenario_route_pattern(s)
    for row in g.normal_flow_rows(pattern):
        c = adapter.find(s.business_title, pattern, row, g.business_action_from_row(row, pattern.name))
        if c:
            for feature in c.get("function_ids", []):
                doc = g.FEATURE_DOC.get(feature)
                if doc and all(d.feature_no != feature for d in s.docs):
                    s.docs.append(doc)
    return s


def seed(s, values, g=None):
    values = dict(values)
    b, n = _business(s), _order(s)
    if b not in BUSINESSES:
        return values
    if s.sid == "SCN-TSUHAN-在庫移動準備業務-900":
        # 名称上は通販に属するが実際の対象は在庫移動。在庫モジュールが準備する。
        return values
    values.setdefault("顧客氏名", "試験 太郎")
    values.setdefault("顧客フリガナ", "シケン タロウ")
    values.setdefault("顧客区分", "登録会員")
    values.setdefault("顧客メール", f"scenario-{s.sid.lower().split('-')[-1]}@example.test")
    values.setdefault("言語", "日本語")
    values.setdefault("商品状態", "NM")
    values.setdefault("出力ID対応", "登録画面で採番した実IDを論理IDと対応付け、同じ対象を全工程で引き継ぐ")
    if b == "店頭受取受注管理":
        days = 14 if "スムーズ" in s.sid else 1 if "店内PC" in s.sid else 7
        values.update({**pickup_dates(s.sid), "注文開始状態": "未注文・未採番", "受注ステータス": "未作成（注文完了後に注文受領）", "決済状態": "未決済（購入前）",
                       "販売単価": "1,000円", "商品代金": "3,000円", "受取方法": "スムーズ店頭受取" if "スムーズ" in s.sid else "店頭受取",
                       "支払方法": "クレジットカード" if "スムーズ" in s.sid else "店頭支払"})
        if "店内PC" in s.sid:
            values["顧客区分"] = "店内PCの店舗アカウント（当該支店に紐づく実アカウント）"
            values["店頭注文番号札"] = "STTESTPC" + ("A" if n == 7 else "B")
    if b == "店頭買取":
        values.update({"職業": "会社員", "生年月日": "1990-01-01", "適格請求書発行事業者": "該当しない", "本人確認書類": "試験 太郎のテスト用本人確認見本（有効期限内）", "実在庫登録状態": "全商品登録済み"})
        if n in (1,2,3,4,5,8):
            values["買取ステータス"] = "未受付（申込完了後に査定前）"
            values["査定ID"] = "受付/査定開始後の実IDを記録（開始前は未採番）"
        if n == 6:
            values.update({"買取ステータス": "入庫済み", "棚戻し済み": "いいえ", "開始データ取得": "SCN-KAITORI-店頭買取本店支店とも-003を自動入庫完了まで実施した同一査定IDを引き継ぐ"})
        if n == 4:
            values["実在庫登録状態"] = "個別入力商品1件が未登録"
        if n == 2:
            values.update({"査定受付数量": "3", "初回査定金額": "1,200円", "買取成立数量": "2", "査定金額": "800円", "入庫数量": "2"})
        if n == 5:
            values.update({"査定単価": "500円", "査定金額": "1,500円"})
        values["支払経路"] = "レジ出金" if n in (3,7) else "経理振込"
        values.setdefault("査定単価", "400円")
        values.setdefault("処理前在庫数", "10")
        values.setdefault("処理前総原価", "4,000円")
        if n == 7:
            values.update({"買取ステータス": "入庫待ち", "査定ID": "前提の店頭買取受付と成立操作で採番済みの同一実IDを記録", "開始データ取得": "店頭買取003をレジ出金・買取成立まで実施し、自動入庫前の同一査定を引き継ぐ", "入庫方法": "M06-03入庫済みボタンによる1回入庫（CSV入庫は行わない）", "業務確認日時": "2026-10-09 10:00 Asia/Tokyo"})
    if b == "ネット買取":
        values.setdefault("職業", "会社員")
        values.setdefault("生年月日", "1990-01-01")
        values.setdefault("自動承諾", "利用しない")
        values.setdefault("個口数", "1")
        values.setdefault("査定金額", "1,200円")
        values["査定額"] = values["査定金額"]
        values["買取額"] = values["査定金額"]
        values.setdefault("送料", "0円")
        if "お客様" in s.sid:
            values.update({"ネット買取ステータス": "未申込（F05-06確定後に注文）", "本人確認状態": "未申請", "査定ID": "申込完了後の実買取IDを記録（開始前は未採番）"})
            values["本人確認見本"] = "氏名/住所/生年月日が登録会員と一致する有効な見本"
            if n == 2:
                values["初回本人確認見本"] = "会員の住所は東京都新宿区試験町1-1、初回見本の住所は東京都新宿区試験町2-2（住所のみ不一致）"
                values["再申請本人確認見本"] = "東京都新宿区試験町1-1へ訂正した同じ氏名/生年月日の見本"
        else:
            values.setdefault("ネット買取ステータス", "注文（顧客のF05-06申込済み）")
        values.setdefault("振込先確認", "買取情報に登録した試験用受取人口座と、経理が使用する銀行テスト環境の登録口座を照合し実値を記録する")
    if b == "通販受注管理":
        values.setdefault("販売単価", "1,000円")
        values.setdefault("商品代金", "3,000円")
        if n in (901, 921):
            values["商品代金"] = "2,000円"
        # 921 は 901 から入金の工程を除いた購入→国内出荷の連鎖（観点の当てはめ契約 VPR-TSUHAN-01-01-01）。
        if "お客様EC購入" in s.sid or n in (901, 921):
            values.update({"決済状態": "未決済（購入前）", "受注ステータス": "未作成（購入完了後に記録）", "注文開始状態": "未注文・未採番", "顧客区分": "登録会員", "支払方法": "銀行振込" if n in (2, 901) else "クレジットカード"})
            # 16_通販受注管理.md: 決済方法確認→購入完了の実線は「クレジットカード決済代金引換の場合」、
            # →決済処理を行うの実線は「コンビニ決済・郵便振替・銀行振込の場合」（R53）。以前は 001/002 が逆だった。
            values.setdefault("会員番号", "ST-MEMBER-TSUHAN-901")
        if n in (18,19):
            values.update({"返金対象金額": "1,000円", "返金ポイント": "1,000", "返金前ポイント": "200", "返金後ポイント": "1,200", "返金理由": "シナリオ試験・受注取消による返金", "ポイント処理日": "2026-10-09"})
        if n in (7,13,14,15,20):
            values["出荷前状態"] = "会員受注・発送日未設定・配送方法の出荷指示除外フラグ0・購入処理中/キャンセル以外"
            values["発売日"] = "2026-10-16"
            values["出荷日"] = "2026-10-16 17:00:00"
            values["出荷CSVヘッダ"] = "注文番号,出荷日,送り状No."
    return values


def data_patterns(s, values, g):
    if _business(s) not in BUSINESSES:
        return values
    current = seed(s, g.execution_seed(s), g)
    result = []
    for pattern in values:
        text = pattern.input_data
        # 代表入力は補正済みseedを一度だけ掲載。日付の旧重複値を保持しない。
        if pattern.pattern_id in ("DP-N001", "DP-A001", "DP-E001"):
            text = " / ".join(f"{key}={value}" for key,value in current.items())
        preparation = pattern.precondition_delta
        if _business(s) == "店頭買取" and ("非会員" in pattern.purpose or "非会員" in text):
            text = re.sub(r"会員番号=[^/]+/?", "", text)
            text = re.sub(r"顧客区分=[^/]+/?", "", text)
            # 差分は代表seedへmergeされるので、単に削除すると登録会員が復活する。
            text = text.rstrip(" /") + " / 顧客区分=非会員（開始時に会員レコードなし） / 会員番号=未登録（受付後の実顧客IDだけを記録）"
            preparation = "会員の事前登録・ログインを行わず、ブラウザのログインセッションを終了する。F08-01の「アカウントをお持ちでない方はこちら」からF08-02へ進み、試験 太郎・フリガナ・住所・電話・1990-01-01・会社員を入力する。登録後に作成された顧客ID/査定IDを記録する。"
        result.append(replace(pattern, input_data=text, precondition_delta=preparation))
    return result


def repair_text(s, text, g=None):
    if _business(s) not in BUSINESSES:
        return text
    values = getattr(s, "seed", None)
    if values is None:
        values = g.execution_seed(s) if g is not None else seed(s, dict(s.route.inputs))
    for key, value in values.items():
        text = text.replace("{{"+key+"}}", str(value))
    return text


def preparation(s, row_no=None, route=False):
    """実行開始前の業務データ取得。存在確認を成功と偽るfixtureは使わない。"""
    b = _business(s)
    if b not in BUSINESSES:
        return []
    if s.sid == "SCN-TSUHAN-在庫移動準備業務-900":
        return []
    v = getattr(s, "seed", None)
    if v is None:
        v = seed(s, dict(getattr(getattr(s,"route",None),"inputs",())))
    instructions = [
        "試験環境のURL、使用店舗の実店舗ID、各担当者の実ログインIDと編集可能店舗を実行記録へ記入する。別担当の工程では該当担当へ切り替え、同じ論理ID→実ID対応表を使う。",
        f"商品検索から商品コード {v.get('商品コード','実行用テストデータの商品コード')} を開き、商品規格ID・言語={v.get('言語','日本語')}・状態={v.get('商品状態','NM')}・販売/買取単価・数量を記録する。未登録ならカード/グッズの該当CSV登録で作成して採番IDを控える。",
    ]
    if b in ("通販受注管理","店頭受取受注管理"):
        instructions += ["フロントの会員登録から氏名=試験 太郎・フリガナ=シケン タロウ・生年月日=1990-01-01・職業=会社員・住所=東京都新宿区試験町1-1・連絡可能な試験用メール/電話を入力し確認→完了まで進む。既存試験会員を使う場合は会員検索でこれらを照合し、実会員IDを記録する。",
                         f"F03-02の商品詳細で対象規格と数量{v.get('数量','3')}を選びカートへ追加、F04-01→F04-02で会員・配送先・配送方法・支払方法・合計を確認する。注文を開始する工程が本体にある場合は購入確定を本体で一度だけ行い、準備中に注文を作らない。"]
        if "店内PC" in s.sid:
            instructions[-2] = "店内PCは当該支店に紐づく店舗アカウントでログインする。通常会員の新規登録で代用しない。店舗ID、注文者、受取店舗の一致とスタック印字先を確認する。"
        if b == "店頭受取受注管理":
            instructions += [f"配送方法={v['受取方法']}、支払方法={v['支払方法']}で購入し、採番した受注番号/内部IDとスタック用紙・スマレジ商品コードを記録する。期限判定前に、リポジトリ直下で python3 scenario_test/tools/prepare_orders_order_date.py --scenario {s.sid} --order-id 実内部ID --order-no 実受注番号 --as-of 実施日(YYYY-MM-DD) を実行しSQLを生成する。出力された変更前SELECT→dbal:run-sql --force-fetchの1件限定UPDATE→変更後SELECTを指定試験コンテナで実行し、変更前日時・restore_sql・各結果とM05-11の注文日を保存する。採番済みの同一受注IDと受注番号の両一致だけを対象にし、注文日以外は変更しない。期限判定の証跡保存後はrestore_sqlを同じ試験DBで実行し、戻り値1件とSELECTで元日時への復元を確認する。記載値は2026-10-09実施例であり、実施日が違う場合は同ツールが計算した注文日と期限を使用する。"]
        elif not ("お客様EC購入" in s.sid or _order(s) in (901, 921)):
            # 通販の支払は SPLINKS のクレジットカード決済だけ（review/通販受注管理/rulings.md R0）。店頭受取は未裁定のため元の文のまま。
            refund = "SPLINKSのクレジットカード取引" if b == "通販受注管理" else "SPLINKS取引/銀行入金記録"
            instructions += [f"先行の購入工程を実施して取得した会員受注をM05-01で検索し、M05-11で受注番号・会員・明細・配送・決済・処理状態をケース入力と照合する。出荷ケースは出荷日未設定の受注を使う。返金ケースは売上確定済みの同じ受注と{refund}の対応を記録する。"]
        if _order(s) in (7,13,14,15,20) and b=="通販受注管理":
            # 同梱はクレジットカードだけの注文では選択肢に出ない（review/通販受注管理/rulings.md R0・R11）。
            instructions += ["対象受注を用途別に分ける。予約対象は商品名に「予約」を含む対象商品・発売日2026-10-16、当日対象と取消済み比較受注を各1件用意する。国内/EMS/smallpacketは配送先と配送方法の異なる受注を各々購入し、全受注番号・顧客ID・指示ID・送り状を別行で記録する。予約品は発売日前日まで出荷しない。"]
    elif b == "店頭買取":
        instructions += ["店頭買取の受付前は査定IDを要求しない。登録会員DPだけF08-01で対象会員としてログインする。非会員DPは事前の会員作成とログインをせず『アカウントをお持ちでない方はこちら』から進む。F08-02→F08-03を実施した時点の顧客ID・査定ID・受付番号を記録する。MTGBuyer・スマレジ・経理は試験環境の同一店舗・同一査定を使用する。",
                         "査定表と本人確認見本を印刷し、同一査定の商品/数量/単価/合計をダブルチェックする。MTGBuyerで『印刷済み』にチェックし、適格請求書発行事業者=該当しないを確認する。レジ出金時は実際の試験出金取引IDを登録する。"]
        if _order(s)==6:
            instructions += ["独立実施の開始データは、店頭買取003の受付→レジ出金→入庫済みまで完了した同一査定を引き継ぐ。棚戻し済み=いいえ、編集可能店舗一致をM06-01で確認し、査定中の別データを作らない。"]
        if _order(s)==2:
            instructions += ["受付・初回査定表は3点×400円=1,200円で作成する。顧客が1点をキャンセルした時点でその1点を返却し、再査定表は2点×400円=800円として再印刷・ダブルチェック・印刷済みチェックを行う。以後の振込・入庫は承諾済み2点/800円のみを対象とし、受付数量3を入庫数量に使わない。"]
        if _order(s)==7:
            instructions += ["手動入庫の開始データは003の受付→MTGBuyer査定3点×400円→査定表印刷/ダブルチェック/印刷済み→顧客承諾→スマレジで試験出金1,200円（実取引ID記録）→買取成立までを先に行って作成する。M06-03で同一査定ID・全実在庫登録済み・入庫待ちを確認し、次の自動入庫前に本体を実施する。既に入庫済みならそのデータを再入庫せず、新しい受付から準備し直す。手動ボタン前の対象商品在庫10・総原価4,000円をM04-01で記録し、承認CSVは投入しない。"]
    else:
        instructions += ["F05-03/04で買取対象を3点カートへ追加し、登録会員でログイン。F05-06で職業=会社員、生年月日=1990-01-01、自動承諾=利用しない、箱数1、試験用金融機関/支店/口座種別/口座番号/全角カナ名義を入力し確認→確定する。申込工程が本体にある場合は確定を本体へ残し、準備で重複申込しない。",
                         "顧客の実買取IDと会員IDを対応付ける。振込先は使用する銀行試験環境で受付可能な口座を経理担当が用意し、申込内容と一致することを確認して実値を保存する。実口座への送金は試験操作に含めない。"]
        if "お客様" not in s.sid:
            instructions += ["独立実施は顧客申込済みの実買取IDから必要な先行工程を完了させる。査定はMTGBuyerで同じ商品/数量を査定し、完了後にM07-03で金額・実在庫登録状態を照合する。簡易書留経路は本人確認と査定額を当該経路条件へ合わせ、別申込で代用しない。"]
        if "お客様" in s.sid and _order(s)==2:
            instructions += [v["初回本人確認見本"]+"を使い否認メールまで進める。再申請では"+v["再申請本人確認見本"]+"をF06-13の本人確認書類種別・表裏写真・同意チェックを入力して送信する。"]
    number = re.search(r"\d+", str(row_no or ""))
    if number and int(number[0]) > 1 and not route:
        instructions.append(f"工程{number[0]}を単独で実施するときは、この経路の工程1〜{int(number[0])-1}を同じデータで先に完了し、直前工程の状態・残高・CSV・実IDを保存して引き継ぐ。継続実施では登録/購入/出金を繰り返さない。")
    if b == "通販受注管理" and _order(s) == 16:
        instructions.append("実施保留: SPLINKS管理画面で減額不能になる試験取引の取得/作成方法が未提供。原典16 R349の『減額が対応できない場合』を再現する外部試験取引と画面操作を担当者が提示してから実施する。ECのAPIエラーを任意に作り、この外部業務分岐の成功と扱わない。")
    selected = list(getattr(s, "normal_rows", []))
    if number and not route:
        # 独立項目は先行工程も実行するため、そこに必要な未取得資材も継承する。
        selected = [r for r in selected if int(r["#"]) <= int(number[0])]
    operation_text = " ".join(str(r) for r in selected)
    for terms, material in (
        (("並び順ファイル", "価格ソート"), "並び順ファイルの実テンプレート・作成元・商品コードとの列対応"),
        (("バーコード作成マクロ",), "バーコード作成マクロ本体・入力CSVサンプル・出力ラベルの照合規則"),
        (("打ち込みファイル",), "打ち込みファイルの実原本・列定義・作成/更新方法"),
        (("返金処理記録",), "返金処理記録Excel原本・受注/依頼/振込受付番号の対応列"),
        (("銀行振込情報取得", "郵便振替情報取得"), "銀行/ゆうちょの試験明細・取得画面・受注との対応規則"),
        (("マクロ", "発送管理台帳", "海外発送管理アプリ"), "該当する業務マクロ/発送管理台帳/海外発送アプリの実原本・試験環境・列対応"),
    ):
        if any(term in operation_text for term in terms):
            instructions.append(f"実施保留: {material}がリポジトリ内で未取得。実資材を担当者が提示し、同じ実受注/商品/金額の入力・出力を対応付けてから当該工程を実施する。架空列や代用品のファイルを成功証跡にしない。")
    return instructions


def resolve_link_identity(artifact, producer, business):
    for record in DATA.get("lineage_resolutions", []):
        if business == record["business"] and record["artifact"] in artifact:
            return tuple(record[key] for key in ("identity","values","instruction","evidence"))
    return None


def resolve_link_origin(artifact, producer, business):
    """原典の切れた矢印とは別に、入力の実際の取得元を特定する。"""
    for record in DATA.get("lineage_resolutions", []):
        if business == record["business"] and record["artifact"] in artifact:
            return record["instruction"] + " 出典: " + record["evidence"]
    return None


def branch_operations(s, branch_id, pattern):
    """そのSCNの経路と一致する分岐だけ、具体操作を展開する。"""
    if _business(s) not in BUSINESSES or getattr(s, "route_kind", "正常代表") == "正常代表":
        return None
    row = next((r for r in s.branch_rows if r.get("分岐ID") == branch_id), None)
    if row is None:
        return None
    if s.sid == "SCN-ONLINE-KAITORI-ネット買取処理カード-007" and branch_id == "E1":
        return [
            "申込者・実買取ID・商品3点を記録し、MTGBuyerで1点を査定未完了として保存する。査定完了処理は行わない。",
            "M07-01のネット買取一覧で同じ実買取IDを検索し、M07-03の買取情報編集を開く。MTGBuyer査定未完了・状態=査定中を確認する。",
            "M07-03で状態を査定内容連絡済みへ変更しようとし、更新できない結果を確認する。変更操作の結果、現在状態、履歴、顧客の受信箱を保存する。",
            "状態が査定内容連絡済みに変わらず、顧客の承諾・振込依頼・返送へ進まないことを確認して終了する。",
        ]
    condition = re.sub(r"\s+", "", s.route_condition)
    candidate = re.sub(r"\s+", "", str(getattr(pattern, "purpose", "")) + str(row))
    # 同じ分岐IDというだけでは正常経路や別条件を呼ばない。
    if condition and condition not in candidate:
        return None
    result = [f"経路{s.route_id}の条件を入力値と照合する。{s.route_condition}"]
    for row in s.normal_rows:
        operation = row["操作"]
        if "外部システム/ツール上" in operation:
            from generate_test_items import action_from_operation, normalize_action, named_location
            action = normalize_action(action_from_operation(operation), s)
            operation = f"{named_location(action, row.get('確認対象', ''))}で「{action}」を実施する"
        result.append(f"工程{row['#']}：{row['担当者']}が{operation} 対象：{row['入力/対象']}。操作後に{row['期待結果']}")
        # 子フロー参照も実操作へ展開する。親seed/実IDを再作成しない。
        if "SCN-" in operation:
            from generate_test_items import expand_subflow
            expanded, blocked, _refs = expand_subflow(s, operation)
            result.extend(expanded)
            if blocked:
                result.extend("開始条件未成立: " + message for message in blocked)
    result.append("経路の最終状態を確認する。" + s.final_state)
    return result
