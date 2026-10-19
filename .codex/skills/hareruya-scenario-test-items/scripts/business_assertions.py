"""Source-grounded business assertions, kept separate from linguistic normalization.

Numbers below are reproducible test examples, not invented business rules. Source
references identify the HTML sheet or the scenario's original flow for each rule.
"""
from dataclasses import dataclass
import re


STOCK = "excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html"
ORDER = "excel_to_html/output/0203_基本設計仕様書(受注管理機能).html"
BUY = "excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html"
PRODUCT = "excel_to_html/output/0204_基本設計仕様書(商品管理).html"
CARD = "excel_to_html/output/0208_基本設計仕様書(カード管理).html"
OTC = "excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html"
DECK = "excel_to_html/output/0212_基本設計仕様書(デッキ管理).html"
OTC_API = "excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html"


@dataclass(frozen=True)
class Assertion:
    name: str
    viewpoint: str
    expected: str
    preparation: str
    check: str
    location: str
    source: str
    blocked: str = ""


def assertions_for(s, operation: str, ifid: str) -> list[Assertion]:
    quoted = (re.fullmatch(r"「(.+)」", operation, re.S)
              or re.fullmatch(r".+?(?:で|として)「(.+)」を(?:行う|実施する)(?:（[^\n]*）)?", operation, re.S))
    action = quoted.group(1) if quoted else operation
    label = action.split("として", 1)[0]
    source = f"{s.path} 実行手順 / {s.trace_source}"
    order = s.seed.get("受注番号", "実行用テストデータの受注番号")
    buy = s.seed.get("ネット買取申込番号", "実行用テストデータのネット買取申込番号")
    result = []
    features = set(re.findall(r"[MFABO]\d{2}-\d{2}", ifid))

    def add(name, viewpoint, expected, preparation, check, location, ref=source, blocked=""):
        result.append(Assertion(name, viewpoint, expected, preparation, check, location, ref, blocked))

    if "SPLINKS返金対応" in label:
        impossible = any(w in s.route_condition + s.title for w in ("減額不能", "減額不可", "減額できない", "減額対応不可"))
        if impossible:
            add("減額不能時の決済額維持", "金額整合",
                f"受注 {order} のSPLINKS決済金額が処理前の3,000円のままで、減額不能の結果を確認できること。",
                "試験用具体値: 決済済金額=3,000円、返金依頼額=1,000円。SPLINKSのテスト取引で減額不能となる取引状態を準備し、その理由を記録する。",
                "同一取引IDの処理前後の金額を比較し、減額不能の応答と取引履歴を保存する。", "SPLINKS取引詳細・応答・履歴")
        elif s.seed.get("依頼内容") == "請求キャンセル" or "請求キャンセル" in s.title:
            add("請求キャンセルの全額取消", "金額整合",
                f"受注 {order} に対応するSPLINKS取引の3,000円の請求が全額取り消され、請求残額が0円の状態であること。",
                "試験用具体値: 請求金額=3,000円、取消対象金額=3,000円、依頼種別=請求キャンセル。キャンセル可能な取引を用い、受注番号とSPLINKS取引IDの対応を記録する。",
                "SPLINKSの同一取引IDで全額3,000円の取消結果と請求残額0円を照合し、依頼者への完了報告と対応付ける。", "SPLINKS取引詳細・請求取消履歴・完了報告")
        else:
            add("減額額と決済残額", "金額整合",
                f"受注 {order} に対応するSPLINKS取引の処理後決済額が3,000円－1,000円＝2,000円であること。",
                "試験用具体値: 決済済金額=3,000円、返金依頼額=1,000円、依頼種別=一部減額。受注番号とSPLINKS取引IDの対応を記録する。",
                "SPLINKSの同一取引IDで処理前決済額3,000円、依頼額1,000円、処理後決済額2,000円を対比する。", "SPLINKS取引詳細・決済履歴")
    if "ネット買取" in s.business and label in {"振込依頼", "振込作業", "振込依頼ステータス変更"}:
        amount = int(re.sub(r"[^0-9]", "", s.seed.get("査定金額", "3,000円")))
        shipping = int(re.sub(r"[^0-9]", "", s.seed.get("送料", "500円")))
        add("査定額と送料から振込額を照合", "金額整合",
            f"申込 {buy} の振込依頼額が査定承諾額{amount:,}円＋送料{shipping:,}円＝{amount + shipping:,}円であること。",
            f"親経路で準備した査定承諾額={amount:,}円、送料={shipping:,}円の同じ申込を使用し、ここで金額や商品を作り直さない。受取人口座は試験用口座を用い、口座番号を依頼原本と照合する。",
            "買取詳細の査定承諾額と送料、入金CSVの受注番号・振込金額、振込依頼の金額を同一申込で照合する。振込作業では同じ依頼額と銀行の受付結果を照合する。",
            "ネット買取詳細・入金CSV・振込依頼・銀行受付結果", BUY + "#sheet-6（振込金額=送料+査定額）")
    if "ネット買取" in s.business and label == "振込完了ステータス変更":
        add("振込完了を起点とした在庫待ち判定", "状態遷移",
            f"申込 {buy} の個別入力商品に未登録在庫が無い場合、振込完了処理後の状態が「入庫待ち」であること。",
            "個別入力商品の実在庫登録を全件完了し、銀行の振込完了連絡を受領した同一申込を準備する。振込完了日・変更前状態を保存する。",
            "振込完了への変更直後に買取詳細を再表示し、最終状態=入庫待ち、振込完了日と状態変更履歴を記録する。",
            "ネット買取詳細・ステータス変更履歴", BUY + "#sheet-17（振込完了時の未登録在庫判定）")
    if "返金振込対応" in label:
        amount = s.seed.get("返金対象金額", "1,000円")
        add("返金依頼と銀行振込の金額一致", "金額整合",
            f"受注 {order} の返金依頼額 {amount} と同一受取人への銀行振込受付額が一致している状態であること。",
            f"返金依頼額={amount}、受注番号と銀行取引受付番号を対応付け、振込先と依頼者を依頼原本から記録する。",
            "返金依頼メールと銀行受付結果を同一受注・受取人・金額で照合し、振込受付番号を完了報告へ引き継ぐ。", "返金振込依頼メール・銀行受付結果・完了報告")
    if label in {"価格変更反映作業", "価格反映作業", "セール品情報更新作業"} or (features & {"M03-30", "M03-31"} and re.search(r"登録|アップロード|取込|反映", action)):
        buy_price = re.sub(r"[^0-9]", "", s.seed.get("買取価格", "500円"))
        if "セール" in label or "セール管理" in s.title:
            add("セール価格と基準価格の区別", "金額整合",
                "対象の商品ID・言語IDで、セールフラグ=1、販売価格=800円、基準価格=1,000円の状態であること。",
                f"試験用具体値: 更新前はセールフラグ=0、基準価格=販売価格=1,000円。セール用価格変更CSVに当該商品ID・言語ID、販売価格800円、買取価格{buy_price}円、セールフラグ1を設定する。",
                "セール用価格変更CSVと商品規格詳細を商品ID・言語IDで対比し、販売価格800円への更新と基準価格1,000円の保持を確認する。",
                "セール用価格変更CSV・商品規格詳細", PRODUCT + "#sheet-44（セールフラグ0→1）")
        else:
            add("基準価格変更の販売価格への反映", "金額整合",
                f"対象の商品ID・言語IDで、基準価格と販売価格がともに1,200円、買取価格が{buy_price}円の状態であること。",
                f"試験用具体値: セールフラグ=0、更新前基準価格=販売価格=1,000円。基準価格変更CSVに当該商品ID・言語ID、基準価格1,200円、買取価格{buy_price}円を設定する。",
                f"入力CSVと更新後の商品規格詳細を商品ID・言語IDで照合し、更新後価格を1,200円・1,200円・{buy_price}円の組と比較する。",
                "基準価格変更CSV・商品規格詳細", PRODUCT + "#sheet-42（セールフラグ無効時の基準/販売/買取価格更新）")
    if label == "在庫移動実績インポート" or ("M04-24" in features and any(w in action for w in ("取込", "インポート", "CSV登録"))):
        add("在庫移動実績CSVの送り状番号反映", "CSV/帳票",
            "在庫移動指示検索で、取り込んだ移動指示IDの送り状No.がCSVの値1234-5678と一致する状態であること。",
            "出庫承認済みの移動指示を1件作成し、実IDを記録する。ヘッダ「移動指示ID,送り状No.」、データ「実ID,1234-5678」のCSVを準備する。",
            "CSV原本と取込後の在庫移動指示詳細を移動指示IDで照合し、送り状No.を文字列比較する。",
            "在庫移動実績CSV・在庫移動指示検索/詳細", STOCK + "#sheet-32（移動指示ID・送り状No.）")
        add("在庫移動実績CSVの発送状態", "状態遷移",
            "CSVを取り込んだ移動指示の発送状況が「済」、紐づく在庫移動のステータスが「移動中」であること。",
            "移動指示IDに紐づく在庫移動IDと出庫承認済み状態を取込前に保存する。",
            "移動指示IDと在庫移動IDの対応を保ったまま、指示の発送状況と移動のステータスを照合する。",
            "在庫移動指示検索・在庫移動詳細", STOCK + "#sheet-32（送り状登録後の状態）")
    if label == "入庫" and "移動" in s.title:
        def count(key, fallback):
            value = s.seed.get(key)
            if value is None:
                match = re.search(re.escape(key) + r"=(\d+)", s.route_condition)
                value = match[1] if match else str(fallback)
            return int(re.search(r"\d+", str(value).replace(",", ""))[0])
        planned = count("移動数量", count("出荷指示数量", 3))
        picked = count("ピック数量", planned)
        actual = count("受入数量", picked)
        shortage = actual < picked
        unit = count("単位原価", 100)
        add("移動先の入庫数量と原価", "在庫整合",
            f"同一在庫移動IDの入庫先で、在庫が実入庫数{actual}点、総原価が{actual * unit}円増加する状態であること。",
            f"親経路の移動予定={planned}点、ピック={picked}点、実到着={actual}点、単位原価={unit}円を維持する。入庫承認前の移動先在庫と総原価を保存し、入庫承認者・移動ID・商品コード・両店舗を記録する。",
            f"移動IDに紐づく入庫履歴と前後在庫を比較し、移動先在庫の差分+{actual}点、総原価の差分+{actual * unit}円を確認する。",
            "在庫移動・振替登録/編集・在庫一覧・在庫履歴", STOCK + "#sheet-14（入庫承認時の在庫と原価）")
        if shortage:
            missing = picked - actual
            add(f"不足{missing}点の移動元戻し", "在庫整合",
                f"同一在庫移動IDの入庫時不足{missing}点に対して出庫元在庫が{missing}点・総原価{missing * unit}円増加し、履歴の在庫変動区分が「在庫移動(差分加算)」であること。",
                f"出庫済数量{picked}点、実到着{actual}点、不足{missing}点を同じ移動へ登録して承認する。出庫後・差分承認前の出庫元在庫と総原価を保存する。",
                f"差分承認前後の出庫元在庫・総原価の差を比較し、+{missing}点と+{missing * unit}円、同一移動IDの差分加算履歴を照合する。",
                "出庫元在庫一覧・在庫履歴", STOCK + "#sheet-14（不足時の3点300円→2点200円＋1点100円）")
    if "M05-26" in features or ("発送" in label and "インポート" in label) or label == "出荷インポート作業":
        actual_dispatch = "実出荷日" in action or "集荷完了" in action
        tracking = "集荷した荷物の実送り状No." if actual_dispatch else s.seed.get("送り状No.", "ST-SHIP-001")
        shipping_date = "集荷完了を記録した実出荷日時" if actual_dispatch else "2026/10/09 16:00"
        add("出荷実績の同一受注への反映", "CSV/帳票",
            f"受注 {order} の送り状No.が出荷実績CSVの{tracking}、全配送先の発送日がCSVの{shipping_date}と一致する状態であること。",
            f"試験用具体値: 取込前出荷日=空。注文番号は当該受注の実番号、送り状No.={tracking}、出荷日={shipping_date}の出荷実績CSVを用意する。実出荷の工程がある場合はその記録を再利用し、例示の日時や番号へ差し替えない。",
            "取込前CSVと取込後の受注詳細・配送先を実注文番号で照合する。送り状番号を文字列比較し、配送先ごとの発送日を比較する。",
            "出荷実績CSV・受注詳細・配送先", ORDER + "#sheet-24（出荷実績インポート登録）")
        add("出荷完了メールの宛先と履歴", "メール/通知",
            "出荷完了メールの宛先が当該受注のメールアドレス、控えが当該店舗の代表アドレスで、受信原本の件名・本文がメール送信履歴と一致する状態であること。",
            "受注メールアドレスと店舗代表アドレスを試験用受信箱に設定し、両アドレスを記録する。注文者都道府県=国内の受注を用い日本語定型文を対象とする。",
            "取込開始後の受信原本の宛先・受信日時・件名・本文と、受注のメール送信履歴を対比する。",
            "受信箱・受注メール送信履歴", ORDER + "#sheet-24（出荷完了メールの宛先・控え・言語）")
    # Handoff evidence is added only where the flow actually names a customer
    # message. Recipient or provider names are not guessed for internal notices.
    if "メール" in label and any(w in action for w in ("顧客", "お客様")):
        add(f"{label}の宛先と対象案件", "メール/通知",
            f"「{label}」のメール原本の宛先が当該顧客のメールアドレスと一致し、当該案件の内容を受信箱で確認できること。",
            "会員fixtureまたはゲスト注文時に登録した顧客emailを試験用受信箱へ対応付け、通知操作前の受信件数と時刻を記録する。本文に識別番号を含まない定型文は送信履歴の対象案件とMessage-IDを対応付ける。",
            "通知の契機となる操作の後、受信原本のTo・受信日時・件名・本文を保存する。宛先を顧客メールアドレスと比較し、本文または送信履歴から対象案件への対応を確認する。",
            f"{label}の受信原本・対象案件の通知履歴")
    if any(w in label for w in ("ピック", "梱包", "入荷作業", "Wチェック", "スリーブ入れ", "戻し作業")) and "商品コード" in s.seed:
        product = s.seed["商品コード"]
        add(f"{label}の現物と作業元明細の一致", "在庫整合",
            f"「{label}」で扱った商品 {product} の現物の商品識別・言語・状態・数量が、作業元明細の同じ商品の値と一致する状態であること。",
            f"{product} の作業元明細（操作に記載されたリスト・依頼書・入力ファイル）を原本保存し、商品識別・言語・状態・数量を記録する。差異を扱う経路では差異修正後の確定明細を比較基準にする。",
            "現物を商品ごとに数え、作業元明細と一行ずつ突合する。取り違え・過不足・状態相違を差分表に記録し、未解消差分が0件であることを確認する。",
            named_location(action) + "・商品別数量照合表")
    return result


def resolve_link_identity(artifact: str, producer: str, business: str = ""):
    """Recover only keys explicitly present in the canonical HTML schema.

    Returns key, compared fields, preparation, source. Custom business files with
    no declared schema deliberately remain unresolved.
    """
    if "バーコード貼替リストCSV" in artifact:
        return ("スマレジ商品ID（対象商品に紐づく実ID）", "スマレジ商品ID・スマレジ商品コード・スマレジバーコード",
                "対象商品コードとスマレジ商品IDの対応を保存し、CSVに載る実IDで識別する。", STOCK + "#sheet-36")
    if "グッズ・サプライ情報商材登録CSV" in artifact:
        return ("商品コード（実行用テストデータに対応する値）", "商品コード・言語(ID)・商品名",
                "新規登録CSVに対象の商品コードを設定し、取込後に採番された商品IDとの対応を記録する。", PRODUCT + "#sheet-13")
    if "カード登録CSV" in artifact:
        return ("カード詳細ID（登録対象の実ID）", "カード詳細ID・カード名(日本語)・カード名(英語)",
                "カード詳細IDとシード商品のカード詳細の対応を保存する。新規採番時はCSV行と登録後カード詳細IDの対応を保存する。", CARD + "#sheet-8")
    if "カード商品CSV" in artifact:
        return ("商品ID（更新時）またはカード詳細(ID)＋言語(ID)（新規登録時）", "カード詳細(ID)・言語(ID)・商品ID",
                "新規登録と更新を区別し、対象CSV行・採番された商品ID・カード詳細(ID)を対応付ける。", PRODUCT + "#sheet-10")
    if "部門更新CSV" in producer:
        return ("商品コード（実行用テストデータに対応する値）", "商品コード・部門コード(ID)",
                "対象商品の更新前部門コードと入力CSVの更新後部門コードを保存する。", PRODUCT + "#sheet-53")
    entity = re.sub(r"^#\d+\s*", "", artifact)
    entity = re.sub(r"\s+", " ", entity)
    if entity == "出金" and business == "店頭買取" and not any(word in producer for word in ("経理", "振込")):
        return ("買取ID＋端末取引ID（smaregi_transaction_id）", "買取ID・端末取引ID・出金コード",
                "スマレジの取引区分=出金の実取引IDを記録する。MTGBuyerへの端末取引ID入力と、PUT /api/admin/otcBuyOrder/{_otcBuyOrderId}.json のsmaregi_transaction_id、EC-CUBE買取詳細の出金コードを同一買取IDで対比する。",
                OTC_API + "#sheet-5 / excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html#sheet-3")
    if "査定確認メール" in entity and business == "ネット買取":
        return ("買取番号＋送信したメール原本のMessage-ID", "買取番号・宛先メールアドレス・件名・本文",
                "手動メール通知確認画面の買取番号・件名・本文と、買取詳細の依頼者メールアドレスを送信前に保存する。送信後のメール原本を買取番号と対応付け、To・件名・本文を比較する。メール本文に買取番号の記載を仮定しない。",
                BUY + "#sheet-12 / " + BUY + "#sheet-13")
    if entity in {"返金振込依頼メール", "返金対応完了メール", "ポイント付与完了メール"} and business == "通販受注管理":
        detail = {
            "返金振込依頼メール": ("R368-R375", "確認済みの返金先口座情報と返金対象金額を依頼原本から記録し、経理への送信原本と受信原本で口座情報・金額が一致することを確認する。"),
            "返金対応完了メール": ("R380-R386", "経理の振込完了連絡を原本保存し、それに対する返信が経理の同じ連絡元へ届き、返信元の振込依頼・完了連絡と対応することを確認する。"),
            "ポイント付与完了メール": ("R395-R400", "当該顧客のポイント付与結果の実数と付与履歴を保存し、同じ顧客への返信メールに記載された付与完了内容と照合する。金額からポイント数への換算率は推定しない。"),
        }[entity]
        return ("受注の実番号と対応付けたメール原本のMessage-ID", "受信宛先・件名・本文の依頼内容または完了内容",
                detail[1] + " 受注実番号・元依頼メールのMessage-ID・送信メールのMessage-IDを証跡上で対応付ける。本文に受注番号が記載されることを前提にしない。",
                "scenario_test/markdown/16_通販受注管理.md " + detail[0])
    if entity == "メール" and business == "イベント管理":
        if "キャンセル申込" in producer or "問い合わせ" in producer:
            note = "対象イベントの申込者が指定したキャンセル/問い合わせ内容を送信前に保存し、店舗が受信した同じメールの差出人・宛先・件名・本文と比較する。"
        elif "キャンセル完了連絡" in producer:
            note = "対象イベントの申込キャンセル結果を保存し、同じ申込者への完了メールの宛先とキャンセル内容を照合する。"
        else:
            return None
        return ("イベント申込IDと対応付けたメール原本のMessage-ID", "差出人・宛先・件名・本文の対象イベントと依頼/完了内容",
                note + "申込ID・申込者・送信原本Message-IDを証跡上で対応付ける。本文に申込ID列の存在を仮定しない。", "scenario_test/markdown/08_イベント管理.md R75-R120")
    if entity in {"AWS S3", "カード画像パス対応表"} and business == "商品登録・編集":
        return ("商品名＋S3画像パス", "商品名・S3画像パス・対応する画像内容",
                "元画像と商品名を対応付け、S3へアップロードした実画像パスを保存する。パス対応表とカード登録CSVの画像パスを文字列比較し、そのパスから取得した画像をアップロード原本と比較する。",
                "scenario_test/markdown/09_商品登録・編集.md R44-R51/R62-R70/R90-R91")
    if entity == "商品カテゴリ":
        return ("カテゴリID（登録後の実ID）", "カテゴリID・カテゴリ名・親カテゴリ・表示フラグ",
                "カテゴリ登録で入力した親カテゴリと名称を原本保存し、カテゴリCSVの採番IDと入力値を対応付ける。商品登録時に選択したカテゴリIDをこの実IDと比較する。", PRODUCT + "#sheet-25 / " + PRODUCT + "#sheet-26")
    if entity == "インポートCSV" and business == "在庫管理" and "インポートファイル作成" in producer:
        return ("在庫分割ID＋分割先商品コード", "商品コード・分割先分割在庫数",
                "原典の開封結果を紐づける分割CSVとして扱う。在庫分割IDと元パックを記録し、ヘッダ「商品コード,分割先分割在庫数」で開封結果のカードと実枚数を設定する。他の在庫変更CSVへ置き換えない。", STOCK + "#sheet-18 / scenario_test/markdown/12_在庫管理.md R114-R124")
    if re.fullmatch(r"商品(?:情報|規格)?(?:\*\d+)?", entity):
        return ("商品ID＋商品規格ID（商品コードとの実ID対応を保存）", "商品ID・商品規格ID・商品コード",
                "当該工程の登録または更新結果から実商品ID・商品規格IDを取得し、シードの商品コードとの対応を保存する。新規登録時は操作前の不存在と登録後の採番結果を記録する。", PRODUCT + "#sheet-22")
    if re.fullmatch(r"受注(?:\*\d+)?", entity):
        return ("受注番号（当該受注の実番号）", "受注番号・商品・数量・請求金額",
                "注文または取込で得た実受注番号をシード受注番号へ対応付け、出力対象の条件も保存する。", ORDER + "#sheet-15")
    if "カード一覧CSV" in artifact or re.fullmatch(r"カード情報(?:\*\d+)?", entity):
        return ("カード詳細ID", "カード詳細ID・カード名(日本語)・カード名(英語)",
                "シード商品から対応するカード詳細IDを記録し、カードCSVまたは詳細の同一IDの内容を保存する。", CARD + "#sheet-5")
    if "カードセット" in entity:
        return ("カードセット名英語＋略称（試験用の入力値）", "カードセット名日本語・カードセット名英語・略称・リリース日",
                "登録前に同じカードセット名英語・略称が存在しない試験値を準備し、入力原本と保存後の値を対比する。", CARD + "#sheet-12")
    if re.fullmatch(r"デッキ(?:管理)?(?:\*\d+)?", entity):
        return ("デッキID（登録後の実ID）", "デッキID・プレイヤー・イベント・デッキ内容",
                "登録結果のデッキIDを当該プレイヤー・イベントと対応付けて保存し、入力したデッキ内容と登録結果を比較する。", DECK + "#sheet-5")
    if "棚戻し" in artifact and any(t in artifact for t in ("CSV", "PDF")):
        pdf = "PDF" in artifact
        return ("出力時の買取ID＋原本の略称・商品名・言語/状態の組", "略称・商品名・言語/状態・数・基準価格",
                "出力対象の買取ID一覧とファイルを対応付ける。帳票に存在しない買取ID列を仮定せず、選択元明細の商品名・略称・言語/状態から表示用の組を作り、同じ組の数量を合算して比較する。", OTC + ("#sheet-9" if pdf else "#sheet-8"))
    if "ピッキングリスト" in artifact and business == "在庫管理":
        return ("選択した在庫移動ID＋原本の商品名・略称・言語/状態の組", "商品名・略称・言語/状態・数・基準価格",
                "出力対象の在庫移動IDとPDF原本を対応付ける。明細の商品名から略称・言語・状態・色・レアリティを取り除いた表示値と照合する。原本に商品コード列を仮定しない。", STOCK + "#sheet-34")
    if "送り状CSV" in artifact and business == "在庫管理":
        return ("オーダーID（在庫移動指示ID）", "オーダーID・注文者氏名・配送先氏名・注文金額合計",
                "CSVのオーダーIDを在庫移動指示IDに対応付け、注文者氏名は移動元店舗、配送先氏名は移動先店舗から照合する。", STOCK + "#sheet-35")
    return None


def named_location(operation: str, source_observation: str = "") -> str:
    """Return only objects actually named by the source, without inventing a UI."""
    names = []
    for pattern in (
        r"[\w一-龠ぁ-んァ-ヶー・]+(?:CSV|リスト|台帳|ファイル|メール|帳票|フォーム|チェック票)",
        r"SPLINKS|MTGバイヤー|MTGBuyer|スマレジ|Backlog|バックログ|Thunderbird|Gメール|ラインワークス|ゆうプリR",
        r"段ボール|現物|カード|商品|スリーブ|バーコード|棚",
    ):
        names.extend(re.findall(pattern, operation))
    if names:
        return "・".join(dict.fromkeys(names))
    return source_observation or "業務フローに記載された工程の成果物"
