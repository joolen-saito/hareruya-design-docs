"""Research notes for unresolved data contracts, not inferred output schemas."""
import re

from source_contract_lookup import _load


FLOW_FILES = {
    "店頭買取": "06_店頭買取.md", "ネット買取": "14_ネット買取.md",
    "イベント管理": "08_イベント管理.md", "商品登録・編集": "09_商品登録・編集.md",
    "価格管理": "11_価格管理.md", "在庫管理": "12_在庫管理.md",
    "店頭受取受注管理": "05_店頭受取受注管理.md", "仕入れ業務": "15_仕入れ業務.md",
    "通販受注管理": "16_通販受注管理.md",
}


def unresolved_lineage_evidence(s, link, unknown_key, origin):
    artifact = re.sub(r"^#\d+\s*", "", link.get("産出データ/帳票", ""))
    endpoints = [re.sub(r"^#\d+\s*", "", link.get(name, "")) for name in ("産出工程", "消費工程")]
    sources = [f"{s.path} データ連鎖 {link.get('連鎖ID')}"]
    flow = FLOW_FILES.get(s.business)
    if flow:
        sources.append("scenario_test/markdown/" + flow + " 本文・原典ノード/接続表")
    contract_path = s.repo / "scenario_test/coverage/source_contracts.json"
    if contract_path.is_file():
        for contract in _load(str(contract_path), contract_path.stat().st_mtime_ns):
            if contract.get("business") == s.business and any(
                label and (contract.get("source_action", "").startswith(label + "として") or contract.get("screen") == label)
                for label in endpoints if "記載なし" not in label
            ):
                sources.append(f"scenario_test/coverage/source_contracts.json {contract['contract_id']}")
                for ref in contract.get("source_evidence", []) + contract.get("design_evidence", []):
                    if ref.get("file"):
                        sources.append(ref["file"] + " " + str(ref.get("source_row", ref.get("sheet", ""))))
    reasons, decisions = [], []
    if unknown_key:
        if any(word in artifact for word in ("並び順", "打ち込み", "統合仕入れ", "リコメンドファイル", "バーコード作成マクロ", "カード登録作業ファイル", "バックヤード管理表", "トリガーファイル", "価格変更共有", "セール品対応", "価格ソート用")):
            reasons.append("原典は外部作業ファイルの作成・利用を記載するが、実ファイルの列定義・一意キー・変換規則を含まない。リポジトリ内に同名の実テンプレートはない")
            decisions.append("業務担当が実テンプレートと入出力サンプルを提示し、商品/店舗等の照合列、集計・ソート・価格/数量変換規則、ファイル版を確定する")
        elif "フォーム" in artifact:
            reasons.append("原典は返金依頼フォームへの入力を記載するが、外部フォームの項目・受付ID・保存先を定義していない")
            decisions.append("経理/イベント担当が実フォームのURL・必須項目・受付記録を提示し、申込IDと返金先/額の対応を確定する")
        elif artifact == "売上":
            reasons.append("原典はイベント金額をスマレジへ登録する旨を記載するが、イベント申込とスマレジ取引の対応項目を定義していない")
            decisions.append("イベント担当がイベント単位/参加者単位の登録粒度とスマレジの商品・取引記録の対応を確定する")
        elif artifact in {"銀行サイト", "ゆうちょ銀行"}:
            reasons.append("図では閲覧先サービスをデータノードとして扱っており、振込明細の取得形式・取引識別子・受注との対応項目を定義していない")
            decisions.append("経理が試験用の振込明細サンプルと取得方法を提示し、入金名義・金額・日付・受注照合を確定する")
        elif "返金処理記録" in artifact:
            reasons.append("原典R386は返金処理記録Excelの更新のみを記載し、実Excelの識別列と更新対象列を定義していない")
            decisions.append("経理/通販担当が返金記録Excelの実テンプレートと受注・依頼・振込受付番号の対応列を確定する")
        elif "インポート用CSV" in artifact:
            reasons.append("在庫検索から作成するCSVの図示はあるが、在庫情報CSV・カスタムCSV・在庫変更CSVのどの形式を使いどの加工を行うか一意に指定されていない")
            sources.append("excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-8/#sheet-9/#sheet-27")
            decisions.append("在庫担当が使用する出力形式と加工後の取込先を指定し、実ヘッダと店舗/在庫区分/商品コードの対応を確定する")
        else:
            reasons.append("参照した原典と関連HTMLから、この成果物を業務対象へ一意に対応付ける項目が確定できない")
            decisions.append("業務担当が対象成果物の実サンプル・一意キー・対応する元データを提示する")
    if origin:
        reasons.append("原典グラフで産出元の接続がなく、この経路だけでは生成から受渡しまでを立証できない")
        decisions.append("上流の作成工程または既存入力を取得する手順と版/取得時点を特定し、消費時点の入力原本を保存する。連鎖完了とは別に入力受領の判定範囲を確定する")
    return "。".join(reasons) + "。", list(dict.fromkeys(sources)), "。".join(decisions) + "。"
