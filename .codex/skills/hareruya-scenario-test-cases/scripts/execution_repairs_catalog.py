"""商品・価格・イベント・デッキ・仕入れの原典照合済み実施手順補正。

実在IDは実行時に取得する。マクロ/外部フォームの未取得を仮データで隠さない。
生成物を直接書き換えず、同じ契約をSCN/STI生成器から参照する。
"""
from __future__ import annotations

import json
import re
from dataclasses import replace
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
DATA: dict = {}
DOMAINS = {"商品登録・編集", "価格管理", "仕入れ業務", "イベント管理", "デッキ登録"}


def configure(repo, g=None):
    global REPO, DATA
    REPO = Path(repo)
    DATA = json.loads((REPO / "scenario_test/coverage/execution_repairs/catalog_contracts.json").read_text())


def _data():
    if not DATA:
        configure(REPO)
    return DATA


def _id(s):
    return s.sid if hasattr(s, "sid") else s.get("scenario_id", s.get("sid", ""))


def _business(s):
    if hasattr(s, "business_title"):
        return s.business_title
    if hasattr(s, "business"):
        return s.business
    return s.get("business_title", s.get("business", ""))


def _number(s):
    return int(_id(s).rsplit("-", 1)[-1])


def prepare_scenario(s, g):
    if s.business_title not in DOMAINS or getattr(s, "catalog_repaired", False):
        return s
    data = _data()
    records = [c for c in data["step_resolutions"] if c.get("scenario_id") == s.sid]
    by_step = {c["original_step"]: c for c in records if not c.get("insert_after")}
    after = {c["original_step"]: c for c in records if c.get("insert_after")}
    change = data.get("route_changes", {}).get(s.sid, {})
    rows = []
    # 各route固有の辞書を作る。共有Patternを更新すると代替経路の担当者/ノードが混ざる。
    pat = replace(s.pattern, rows=list(s.pattern.rows), row_nodes=dict(s.pattern.row_nodes), row_lanes=dict(s.pattern.row_lanes))
    originals = g.normal_flow_rows(g.scenario_route_pattern(s))
    for i, row in enumerate(originals, 1):
        if i in change.get("drop_steps", []):
            continue
        c = by_step.get(i)
        replacement = c["replacement_row"] if c else row
        rows.append(replacement)
        if c:
            for mapping in (pat.row_nodes, pat.row_lanes):
                old_key = g.primary_text(row)
                if old_key in mapping:
                    mapping[g.primary_text(replacement)] = mapping[old_key]
        if i in after:
            rows.append(after[i]["replacement_row"])
    s.pattern = pat
    condition = s.route.condition
    if change.get("extra_condition"):
        condition += " / " + change["extra_condition"]
    final = change.get("final_state", s.route.final_state)
    if s.business_title == "価格管理" and _number(s) != 1:
        condition += " / 代表入力はセールフラグ0の通常価格変更。M03-30を使用する。"
        final = "同じ商品ID/言語IDの基準価格・販売価格1000→1200、買取価格300・数量3を維持し、更新後の商品一覧の値と照合すること。"
    s.route = replace(s.route, rows=tuple(rows), condition=condition, final_state=final)
    used = {f for c in records for f in c["function_ids"]}
    for fid in used:
        doc = g.FEATURE_DOC.get(fid)
        if doc and all(d.feature_no != fid for d in s.docs):
            s.docs.append(doc)
    # 補正前の候補(A15-10/M13-06等)をトレース済み機能として残さない。
    # 直接操作しないサブフローの機能は子SCNでトレースする。
    actual = {fid for step in g.step_rows(s.business_title, g.scenario_route_pattern(s), s.docs)
              for fid in step[3].split("・") if fid != "-"}
    s.docs = [doc for doc in s.docs if doc.feature_no in actual]
    s.coverage = g.coverage_for(s.business_title, g.scenario_route_pattern(s), s.docs, s.route)
    s.catalog_repaired = True
    return s


def seed(s, values, g=None):
    if _business(s) not in DOMAINS:
        return values
    values = dict(values)
    n = _number(s)
    b = _business(s)
    suffix = _id(s).split("-", 2)[-1]
    values["試験記録識別子"] = _id(s)
    values["実ID対応表"] = "未採番→登録後に実ID/取得画面/取得日時を記録。同じSCN内で再作成しない。"
    if b in {"商品登録・編集", "価格管理", "仕入れ業務"}:
        values.update({"商品名": "シナリオ試験商品 " + suffix, "言語": "日本語（実マスタIDを記録）", "商品状態": "NM", "販売価格": "1000円", "基準価格": "1000円", "買取価格": "300円", "仕入単価": "300円", "数量": "3", "在庫区分": "通販", "在庫編集承認ID": "未採番→在庫登録/変更申請後に記録"})
    if b == "商品登録・編集":
        values.update({"商品ID": "未採番→商品CSV登録後に記録（既存商品シナリオは準備時の実ID）", "購入グループ": "シナリオ予約商品" if n in (1, 2, 3) else "通常商品", "商品公開ステータス": "1（非公開）", "支店の商品公開ステータス": "0（非公開）", "カードセット名日本語": "シナリオ試験新弾", "カードセット名英語": "Scenario Test Expansion", "カードセット略称": "STEXP", "カード詳細ID": "既存カード検索またはカード登録後に取得する実ID", "略称タグ名": "STEXP", "カテゴリ": "商品種別に対応する既存の単体カード/予約シングル/グッズ配下の実カテゴリ", "販売制限数": "3", "入庫前在庫": "0", "承認後在庫": "3", "承認後総原価": "900円"})
        if n == 5:
            values.update({"編集対象項目": "商品名(日)", "変更前商品名": "シナリオ編集前", "変更後商品名": "シナリオ編集後"})
        if n in (8, 12):
            values.update({"公開変更": "商品公開ステータス 1→2、支店0を保持", "対象商品数": "2（商品コード末尾A/Bで別の実IDを作成）"})
        if n == 9:
            values.update({"カテゴリ変更": "スタンダード用の実カテゴリIDだけをモダン用実IDへ置換し、別の共通カテゴリIDは保持", "リーガリティ変更": "Standard=使用不可、Modern=使用可。その他フォーマットは取得時の値を保持"})
        if n == 10:
            values.update({"結合数量": "3", "構成表": "1セット=A2枚+B1枚。完成3セット、使用A6枚+B3枚", "結合元商品コード": "準備済みA/Bの実商品コード", "結合先商品コード": "工程の商品CSV登録後に取得する実商品コード", "結合元A規格ID": "構成商品Aの登録後に記録した実規格ID", "結合元B規格ID": "構成商品Bの登録後に記録した実規格ID", "結合先商品規格ID": "デッキセット商品登録後に記録する実規格ID", "結合ID": "未採番→結合初期登録後に実IDを記録", "結合元A数量": "6", "結合元B数量": "3", "結合元A原価単価": "100円", "結合元B原価単価": "100円"})
    elif b == "価格管理":
        values.update({"商品ID": "準備済み商品一覧で取得する実ID", "言語ID": "日本語の実ID", "セールフラグ": "0", "変更前価格": "1000円", "変更後価格": "1200円", "価格変更CSV列": "商品ID,言語(ID),基準価格,買取価格（M03-30の現画面雛形を使用）", "分析期間": "試験日の前日00:00～23:59（週次は直近7日）", "価格変更理由": "試験データの確認済み変更メモ:1000→1200", "出力項目": "商品ID・商品コード・言語コード・状態コード・在庫数・基準価格・販売価格・買取価格・前日販売数・1週間販売数"})
        if n == 1:
            values.update({"旧セール商品A": "基準1000/販売800/買取300/セール1/数量3", "新セール商品B": "基準1000/販売1000/買取300/セール0/数量3", "セール終了後A": "基準1000/販売1000/セール0", "セール開始後B": "基準1000/販売800/セール1", "変更後価格": "800円（新セール商品B）"})
    elif b == "仕入れ業務":
        values.update({"仕入数量": "3", "入庫前在庫": "0", "承認後在庫": "3", "承認後総原価": "900円", "CSV列": "商品コード,在庫増減数,仕入単価", "CSV試験行": "実商品コード,3,300", "価格帯確認用現物": "NM500円・NM1000円・NM5000円を各1枚、除外確認用SP100円を別の1枚", "価格ソート共有時刻": "仕入日の前日17:30以降", "在庫投入時刻": "仕入日16:00以降"})
    elif b == "イベント管理":
        values.update({"イベントID": "未採番→M13-02登録後に実IDを記録", "イベント開催日ID": "未採番→開催日追加後にイベントIDと別に記録", "イベント申込ID": "未採番→顧客の申込完了後に記録", "参加費": "1000円", "フォーマット": "Standard（実マスタを選択）", "ルール適用度": "競技" if n == 11 else "一般", "イベント公開状態": "公開", "イベント名英語": "Scenario Test Event", "定員": "8", "開催日時": "試験開始T+7日14:00（受付実施シナリオは実施当日14:00）", "オンライン受付期間": "T当日00:00～T+6日23:00（当日受付はなし）", "受付期間": "開催日13:00～13:50", "デッキ登録締切": "開催日13:50", "ポイント付与前": "0", "ポイント付与数": "10", "ポイント付与後": "10", "スマレジcustomerId": "試験会員に対応するテスト接続先の実customerIdを記録"})
        if n in (6, 7, 10):
            values["デッキ登録締切"] = "開催日23:59（大会終了後、当日中に登録する）"
        if n in (7, 9, 10):
            values["オンライン受付"] = "なし"
        if n in (7, 9):
            values.update({"会員番号": "未採番（未会員、工程の新規登録前に会員を作らない）", "受付番号": "TEST-WALKIN", "会員登録状態": "未登録", "対象者氏名": "試験 非会員"})
        if n == 8:
            values["デッキ登録設定"] = "なし"
        if n == 11:
            values["デッキ登録状態"] = "参加会員2名とも登録済み・各60枚"
    elif b == "デッキ登録":
        values.update({"デッキID": "未採番→デッキ登録完了後に記録", "大会ID": "外部大会は和英名+開催日時を記録、顧客申込経路は実開催日ID", "デッキ公開状態": "非公開→公開", "デッキ名": "シナリオ試験デッキ", "フォーマット": "Standard", "アーキタイプ名": "シナリオ試験アーキタイプ", "デッキタグ名": "シナリオ試験タグ", "大会名日本語": "試験大会", "大会名英語": "Scenario Test Tournament", "大会開催日時": "試験日前日14:00（申込からの登録は準備した開催日を使用）", "メインボード入力": "60 Plains", "サイドボード": "0枚", "プレイヤー名": "試験プレイヤー", "参加人数": "8", "顧客訂正前": "59 Plains / 1 Island", "顧客回答": "60 Plains / Islandなし"})
    return values


def preparation(s, row_no=None, route=False):
    b = _business(s)
    if b not in DOMAINS:
        return []
    n = _number(s)
    result = ["この試験専用の対象を用い、実ID対応表に論理名・実ID・取得画面・取得時刻を記録する。単独STIは同じSCNの前工程を順に実施して直前状態を再現し、採番済みIDを再利用する。完了済み登録を重複実行しない。"]
    if b in {"商品登録・編集", "価格管理", "仕入れ業務"}:
        result += ["管理者で商品一覧・カード一覧を開き、日本語言語マスタ、NM状態、該当商品種別のカテゴリ、割引なしの割引率、通常商品購入グループの実ID/名称を記録する。商品管理と本店テスト店舗/通販在庫の編集権限を持つ担当者と、別IDの在庫承認者を用意してログイン確認する。", "既存商品が必要なケースでは商品新規URLを使わず、M03-26（カード）またはM03-27（グッズ）の現画面雛形で作成する。必須列は契約の具体値で埋める。カードはM14-01で取得した実カード詳細IDを指定し、商品IDが採番された後に商品コード/規格IDを記録する。開始在庫3が必要ならM04-21の「商品コード,在庫増減数,仕入単価」に実コード,3,300を入れ、別担当者のM04-32承認まで完了してから開始する。入庫処理が本体のケースでは在庫0のまま開始する。"]
    if b == "商品登録・編集":
        result += ["画像は試験商品を撮影したJPEGを用い、原画像ファイル名と取込後の画像パスを商品ID対応表へ記録する。新規商品ケースは対象商品IDが未登録であることを商品一覧で確認し、準備で先に作成しない。", "予約ケースでは購入グループ管理 M03-22 で「シナリオ予約商品/Scenario Reservation」、予約商品フラグあり、支払/配送方法を指定して登録する。カードセット和英名・STEXP略称・発売日を先に登録する場合は工程本体と重複しない。新弾カード商品登録002の単独実施時はM14-08でカードセットを先に登録し、商品001を前工程に実施済みならその実カードセットID/英名を引き継ぐ。"]
        if n in (1, 2, 3):
            result += ["発売日を試験日基準で設定し、予約販売のケースは未来日、リリース切替ケースは試験当日を指定する。リリース切替前は予約グループの商品を1件作成し、既存商品ID入りカードCSVを出力して購入グループ名称だけを通常商品へ変更する。カード詳細ID・価格・カテゴリを保持する。"]
        if n in (8, 12):
            result += ["公開切替は末尾A/Bの2商品を非公開で作成し、カードケースはM03-03、グッズケースはM03-04で実ID入りCSVを出力する。商品公開ステータスのみ1→2とし、支店公開0・価格1000・数量3を保持する。"]
        if n == 9:
            result += ["カード商品の実IDに、スタンダード配下の試験カテゴリと保持確認用カテゴリの2つを登録する。カテゴリーCSV出力で元/先/保持カテゴリ実IDを記録し、対象のカードCSVも先に保存する。"]
        if n == 7:
            result += ["実施保留: 委託販売Googleフォームの実URL・必須項目・テスト受付先と契約書の現行版が原典/リポジトリに存在しない。試験用に取得し受付IDと商品実IDの対応を確定するまで送信/契約工程を実施済みにしない。"]
        if n == 10:
            result += ["構成用商品A/Bを同じ本店/通販区分に登録し、A6枚・B3枚・各原価単価100をM04-21→別担当者承認で入庫して実規格ID/コードを記録する。1セットA2枚+B1枚、完成3セットの構成表を作る。結合先は当SCNの登録工程で作成した商品規格IDを使い、参照先で別の商品を作らない。", "実施保留: 商品埋め込み用デッキ構築の画面/埋め込み出力手段は現HTML/API/実装から確定できない。別のデッキ検索画面や所有者限定更新APIで代用しない。"]
    elif b == "価格管理":
        result += ["通常価格変更はセール0・基準1000・販売1000・買取300・数量3の商品を用意する。セール管理だけは旧セールA=800/フラグ1、新セールB=1000/フラグ0の2商品を用意する。販売/買取価格の変更メモは試験入力値として作成し、市場相場の正当性を合否条件にしない。", "商品一覧のCSV出力設定で商品ID・商品コード・言語コード・状態コード・在庫数・基準価格・販売価格・買取価格・前日販売数・1週間販売数を指定した試験用設定を保存する。既存「通常作業用」の列と照合して必要列が揃う場合のみそれを使用する。支店/バックヤード残数はM04-01で別々に実店舗/区分を検索して記録する。"]
        if n == 2:
            result += ["売上分析は前日の実販売データが必要。商品A・単価1000・数量1の受注を作成し対象期間に売上計上したテスト受注IDを記録する。M12-03/M12-04で日付軸・対象日・店舗・通販/店頭の集計区分を確認しCSV1件の金額1000・数量1を照合する。該当売上がない環境で空CSVを正解にしない。"]
        if n == 6:
            result += ["実施保留: 原典指定「並び順ファイル」は業務資料一覧に名称のみ記載され、実体/商品照合列/並び順規則が取得できない。実ファイルを受領して版と列を記録するまでその変換工程を実行可にしない。"]
    elif b == "仕入れ業務":
        result += ["現物はNM500円・NM1000円・NM5000円を各1枚と、除外確認用SP100円1枚を別に用意する。赤(金庫)/橙(キャビネット)/通販棚の置場、スリーブ、状態シール、ストレージを準備する。主入庫CSVは対象1商品3枚・単価300とし、価格帯観測の4枚をこのCSVへ合算しない。", "LINE Worksのテスト共有先、依頼メールのテスト受信者、Backlogの試験課題を先に確認する。ファイルは原本・更新後・共有後を保存し、同じ実商品コードと数量を照合する。実施保留: 「打ち込みファイル」「仕入れ統合作成ファイル」マクロと工数/戻しシートの現行実体が未取得。規定数と列を仮定せず、実原本を取得するまでマクロ/シート処理を開始しない。"]
    elif b == "イベント管理":
        result += ["担当者の店舗編集権限を確認する。登録シナリオ以外ではM13-01→M13-02で和英名・店舗・Standard・一般/競技・公開・定員8・参加費1000を登録し、開催日追加で実開催日IDを別に記録する。オンライン申込は未来の開催日、受付実施は試験当日の開催日を使用する。", "オンライン申込を行う場合、会員の実メール/パスワードでログインできること、テスト決済接続で1000円を支払えること、受付期間内・定員未満であることを確認する。申込済み前提のSTIはF07-03から申込完了まで実施して実申込IDを記録する。", "デッキ登録がある場合は「デッキ登録あり」を選び「デッキ登録を終了する」を未選択にする。大会後に登録する006/007/010では締切を開催日23:59とし、同日14:00の大会終了後、締切前に登録する。他の経路は締切13:50前に登録する。M14-01でPlainsとIslandを検索し、登録可能な実カード詳細ID/英名を確認する。バナーは試験用JPEGをM13-15へアップロードし、コピーした実URLを同じイベントのバナー欄へ設定する。"]
        if n in (7, 9):
            result += ["対象参加者の会員fixtureは作成しない。氏名と受付番号TEST-WALKINで当日現金1000円受付を行う。登録同意ケースのみ新規会員登録工程で本登録完了/実会員ID取得へ進み、拒否ケースは会員/デッキ/ポイントを作らず終了する。"]
        if n in (6, 7, 10, 11):
            result += ["ポイント付与前にEC会員/プレイヤーとスマレジcustomerIdの対応を、テスト接続の会員照会で取得する。両側ポイント0を確認し、PointGranterの接続契約・トークン・送信ログを参照できる実行者を指定する。10ポイント1回の結果をEC履歴とスマレジ残高の双方で確認する。", "実施保留: 当日イベント売上のスマレジ商品/部門・1取引への集計粒度・オンライン決済分との二重計上防止規則は業務フローと実装では確定しない。実際のレジ操作手順とテスト取引を確認してから売上登録を行う。"]
        if n in (4, 5):
            result += ["実施保留: 外部返金依頼フォームのURL/必須列/受付IDと返金処理権限が未取得。キャンセルは同じ実申込ID・1000円決済の記録、キャンペーンは適用対象と割引額を示す現行規定が必要。支払1000円から返金額1000円を自動的に推定しない。"]
    elif b == "デッキ登録":
        result += ["M14-01でPlainsとIslandを検索し正しい英名/カード詳細IDを確認する。デッキ管理権限のある担当者を用意する。M15-08→M15-09でアーキタイプを作成し実IDを記録し、タグ管理でタグ実IDを記録する。新規作成を本体で検証するパターンのタグ/アーキタイプは、準備で作成しない。", "外部大会は氏名=試験プレイヤー・和英大会名・前日14:00・Standard・60 Plainsのテスト原稿を使う。大会ページに記載されていない実在選手の情報を補わない。"]
        if n in (2, 7):
            result += ["デッキ登録ありのイベント開催日と実会員を準備し、オンライン申込を完了させる。締切前にマイイベントの登録ボタンへ到達できることを確認する。登録後に実デッキIDを取得して管理画面の検索へ引き継ぐ。訂正ケースは顧客役の回答「60 Plains」を証跡に保存する。"]
    # 独立STIでは未取得原本を実際に使う工程だけを止める。
    # 経路通し試験(route=True)は上流保留を継承する。
    code = _id(s).split("-")[1]
    hold_steps = {
        ("PRODUCT", 2): {11}, ("PRODUCT", 7): {1, 2, 3}, ("PRODUCT", 10): {3},
        ("PRICE", 6): {2}, ("SHIIRE", 1): {2}, ("SHIIRE", 2): {3, 4, 8},
        ("SHIIRE", 3): {1, 4, 5, 8, 15}, ("EVENT", 4): {6, 7},
        ("EVENT", 5): {5, 6, 7}, ("EVENT", 6): {7}, ("EVENT", 7): {7},
        ("EVENT", 10): {6}, ("EVENT", 11): {6},
    }
    m = re.search(r"\d+", str(row_no)) if row_no is not None else None
    if m and not route and int(m.group()) not in hold_steps.get((code, n), set()):
        result = [line.split("実施保留:", 1)[0].strip() for line in result]
        result = [line for line in result if line]
    return result


def data_patterns(s, values, g):
    return values


def repair_text(s, text, g=None):
    if _business(s) == "デッキ登録":
        text = text.replace("デッキ公開状態=下書き", "デッキ公開状態=非公開")
    return text


def resolve_link_identity(artifact, producer, business):
    """実装/列定義で同定できる成果物だけを補う。外部原本未取得はNoneを返す。"""
    if business == "イベント管理" and artifact == "バナー画像":
        return ("イベントID・画像URL", "M13-15でコピーした実URLを同じイベントIDの和英バナー欄へ設定", "アップロード前原画像・生成URL・イベントIDの対応を保存し、イベント詳細の画像と照合する。", "excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1442,1443,3674,3676")
    if business == "イベント管理" and artifact == "デッキリスト":
        return ("イベント開催日ID・会員ID・デッキID", "登録済み実デッキIDと開催日/会員を対応させる", "M13-06で開催日を検索しデッキリスト→印刷/PDF保存。未会員の当日受付では未登録のため存在を期待しない。", "../ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:612,638,646")
    if business == "価格管理" and artifact in {"セール品対応", "価格変更共有用ファイル"}:
        return ("商品ID・言語ID", "画面から取得した実IDと変更前後の単価を試験記録で照合", "M03-30/M03-31の現画面雛形と共有用試験記録を同じ実商品ID・言語IDで結び、価格・対象件数・共有版を確認する。業務固有テンプレの列を推定しない。", "excel_to_html/output/0204_基本設計仕様書(商品管理).html:5839,5840,5841,5842,6082,6083,6084,6085,6086")
    if business == "仕入れ業務" and artifact.startswith("価格ソート用CSV"):
        return ("商品コード・言語コード・状態コード", "M03-06で実商品コードを抽出して取得するCSV", "原CSVとソート後CSVの実商品コード・言語・状態・価格・行数が一致することを確認する。", "excel_to_html/output/0204_基本設計仕様書(商品管理).html:1764,1765,1784,1806")
    return None


def resolve_link_origin(artifact, producer, business):
    """生成元・取得経路が原典で明記される場合だけ起点保留を解消する。"""
    if business == "イベント管理" and artifact == "バナー画像":
        return "デザイン室へ当イベントの和英名・開催日を添えて試験用画像の作成を依頼し、納品されたJPEGの原画像名と版をイベントID対応表へ記録する。M13-15で原画像をアップロードして表示URLをコピーする。原画像未受領時はその取得を終えてから実施する。出典: scenario_test/markdown/08_イベント管理.md:33-34（デザイン室に作成依頼）、excel_to_html/output/0214_基本設計仕様書(イベント管理).html:3674,3676（アップロード/URLコピー）。"
    if business == "イベント管理" and artifact == "デッキリスト":
        return "登録済み会員が同じ開催日のF07-03→F06-16→F06-17でデッキ登録を完了し、実会員ID・開催日ID・デッキIDを記録する。競技イベントの事前準備では参加者全員分を登録し、M13-06で同じ開催日を絞りデッキリスト→印刷→PDF保存する。当日未会員は登録前のデッキ存在を期待しない。出典: excel_to_html/output/0307_基本設計仕様書(イベント).html:2101-2104,2157、../ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:612,638,646。"
    if business == "仕入れ業務" and artifact.startswith("価格ソート用CSV"):
        return "商品一覧で対象の実商品コードを検索し、M03-06で商品ID・商品コード・言語コード・状態コード・販売価格を含むカスタムCSVを出力する。未作成の商品を仮IDで埋めない。取得時刻・設定名・原CSVを保存して価格ソートへ渡す。出典: scenario_test/markdown/19_資料一覧.md:16,17、excel_to_html/output/0204_基本設計仕様書(商品管理).html:1763-1765,1784,1806。"
    return None


def exclude_data_link(s, link):
    """未会員当日受付には事前デッキリストが存在しない（08 R150/R151）。"""
    return (_business(s) == "イベント管理" and _number(s) in (7, 9)
            and link.artifact_text == "デッキリスト")
