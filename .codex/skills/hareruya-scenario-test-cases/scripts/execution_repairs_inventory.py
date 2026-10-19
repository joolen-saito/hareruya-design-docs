"""Evidence-backed inventory execution repairs; no generated artifact mutation.

Hook protocol: configure(repo, g=None), prepare_scenario(s,g), seed(s,values,g),
data_patterns(s,values,g), repair_text(s,text,g), resolve_link_identity(a,p,b).
Contracts are loaded by the shared source-contract adapter, not appended here.
"""
from __future__ import annotations
import copy
import json
import re
from dataclasses import replace
from pathlib import Path

ROOT: Path | None = None
DATA: dict = {}

def configure(repo, g=None):
    global ROOT, DATA
    ROOT = Path(repo)
    path = ROOT / 'scenario_test/coverage/execution_repairs/inventory_contracts.json'
    DATA = json.loads(path.read_text()) if path.exists() else {}

def _record(s):
    return DATA.get('scenario_repairs', {}).get(s.sid)

def prepare_scenario(s, g):
    spec = _record(s)
    if not spec or getattr(s, '_inventory_repaired', False):
        return s
    original = g.normal_flow_rows(g.scenario_route_pattern(s))
    if len(original) != spec['original_step_count']:
        raise ValueError(f'Inventory source steps changed: {s.sid}: {len(original)} != {spec["original_step_count"]}')
    s.pattern = copy.deepcopy(s.pattern)
    rows = []
    for step in spec['steps']:
        row = step['row']
        index = step.get('original_index')
        if index:
            old = original[index - 1]
            key, newkey = g.primary_text(old), g.primary_text(row)
            if key in s.pattern.row_nodes:
                s.pattern.row_nodes[newkey] = s.pattern.row_nodes[key]
            if key in s.pattern.row_lanes:
                s.pattern.row_lanes[newkey] = s.pattern.row_lanes[key]
        g.ROW_WORK_KIND[g.primary_text(row)] = g.WORK_ECCUBE if step['kind'] in ('system','mixed') else g.WORK_EXTERNAL if step['kind']=='external' else g.WORK_PHYSICAL
        rows.append(row)
    s.route = replace(s.route, rows=tuple(rows), final_state=spec.get('final_state') or s.route.final_state,
                      condition=spec.get('condition') or s.route.condition,
                      inputs=tuple((key, spec['seed'].get(key, value)) for key, value in s.route.inputs),
                      preparation=' '.join(spec['preparation']),
                      # Keep the original quoted route discriminator intact;
                      # each operation's HTML evidence belongs to its contract.
                      evidence=s.route.evidence or spec['evidence'])
    features = sorted({f for step in spec['steps'] for f in step['function_ids']})
    s.docs = [g.FEATURE_DOC[f] for f in features if f in g.FEATURE_DOC]
    s.coverage = g.coverage_for(s.business_title, g.scenario_route_pattern(s), s.docs, s.route)
    s._inventory_repaired = True
    return s

def seed(s, values, g):
    spec = _record(s)
    if not spec:
        return values
    result = dict(values)
    result.update(spec['seed'])
    result['実行準備手順'] = 'scenario_test/coverage/execution_repairs/inventory_preparation.md#' + s.sid
    result['採番記録手順'] = '事前に値を発明しない。画面登録で採番した実IDを実行記録へ控え、以後の工程/単独項目で同じIDを使用する。'
    return result

def data_patterns(s, values, g):
    spec = _record(s)
    if not spec:
        return values
    result=[]
    for p in values:
        if p.pattern_id=='DP-N001':
            result.append(replace(p,precondition_delta=' '.join(spec['preparation']),input_data=' / '.join(f'{k}={v}' for k,v in spec['seed'].items()),observation=spec['final_state']))
        else:
            # Preserve all original DP branches; their condition remains independently testable.
            result.append(p)
    return result

def repair_text(s, text, g):
    spec=_record(s)
    if not spec:
        return text
    note='\n## 実行準備・原典補正の根拠\n\n'
    note+='- 準備手順: `scenario_test/coverage/execution_repairs/inventory_preparation.md#'+s.sid+'`\n'
    note+='- 単独STIでは、同じ商品・店舗・処理IDについて対象工程の直前までを一度だけ準備する。経路を通して実施中は既に採番したID/現物/CSVを引き継ぎ、各STIの準備を繰り返して状態を巻き戻さない。\n'
    for value in spec.get('notes',[]):note+='- '+value+'\n'
    for value in spec.get('remaining_blockers',[]):note+='- 実施保留条件: '+value+'\n'
    return text+note

def resolve_link_identity(artifact, producer, business):
    if business!='在庫管理': return None
    for item in DATA.get('lineage_overrides',[]):
        if re.sub(r'^#\d+\s*','',artifact).strip() in item['artifacts']:
            return tuple(item[k] for k in ('identity','values','instruction','evidence'))
    return None

def prerequisite_steps(s, row_no):
    """Exact prior steps needed by an independently prepared system item.

    Workbook transformations remain test cases in their own right. The route
    test executes them; isolated downstream items use the explicit inventory
    inputs, rather than pretending the unavailable workbook has been tested.
    """
    if getattr(s, 'business', getattr(s, 'business_title', '')) != '在庫管理':
        return None
    n = int(s.sid.rsplit('-', 1)[1])
    prior = list(range(1, int(row_no)))
    if n in (2, 3, 4, 5) and int(row_no) >= 3:
        return [i for i in prior if i >= 3]
    if n in (19, 38, 39) and int(row_no) in (2, 3, 4, 5):
        return [i for i in prior if i >= 2]
    if n == 6 and int(row_no) in (2, 3):
        return [i for i in prior if i >= 2]
    if n in (28, 31) and int(row_no) >= 4:
        return [i for i in prior if i != 3]
    return None

def preparation(s, row_no=None, route=False, g=None):
    """Mandatory STI setup. Never creates or invents an application fixture ID."""
    if getattr(s, 'sid', '') == 'SCN-TSUHAN-在庫移動準備業務-900':
        return [
            '在庫移動準備の開始状態を作る。店舗検索で出庫元=テスト本店3F、入庫先=テスト支店（本店以外）の実店舗IDを取得し、両方EC-CUBE在庫区分を使う。元店舗の編集担当と、その登録者とは別の出庫承認者・通知先所属/メンバーを用意する。',
            '専用商品A/Bの実規格ID/商品コードを商品一覧で取得する。元店舗の在庫編集M04-02→別担当M04-32承認でA10点/1000円・B10点/1000円、先店舗A/B各0点/0円を準備し記録する。',
            '在庫検索M04-01から在庫移動登録M04-09へ進み、同じ元/先店舗とEC-CUBE区分でA3点を登録する。採番移動ID-Aを保存し、ピック画面で現物3/欠品0を照合、通知先所属/メンバーを指定して出庫承認申請する。別の出庫承認者で同じID-Aを開き承認する。',
            '同様に商品B2点を別移動ID-Bで登録し、現物2/欠品0を確認して別担当が出庫承認する。元在庫A7点/700円・B8点/800円、先A/B0のままで、2件とも出庫承認済み・移動指示未作成であることをM04-08で確認する。',
            '工程1はこの実移動ID-A/Bを選択して指示を作る。準備で移動指示を先に作成しない。根拠: 0202在庫管理HTML:2666〜2671、2723、2850、2968〜2975、2399〜2404。'
        ]
    if getattr(s, 'business', getattr(s, 'business_title', '')) != '在庫管理':
        return []
    if not DATA:
        configure(getattr(s, 'repo', Path(__file__).resolve().parents[4]), g)
    spec = DATA.get('scenario_repairs', {}).get(s.sid)
    if not spec:
        return []
    effective = {**spec['seed'], **getattr(s, 'seed', {})}
    result=list(spec['preparation'])
    for key, old in spec['seed'].items():
        new = effective.get(key, old)
        if str(old).startswith('ST-') and new != old:
            result = [line.replace(str(old), str(new)) for line in result]
    target_card = effective.get('対象カード', '')
    if target_card:
        result.append('このデータ差分の対象カード条件は「'+target_card+'」。M14-01のカード詳細と商品カテゴリ/基準価格編集で対象に一致する実カードを選び、商品コード対応表へ条件を記録する。依頼先='+effective.get('依頼先','対象カード条件で判断')+'。')
        if '買取価格あり' in target_card:
            result = [line.replace('Plains等', '現行スタンダード対象のRareカード').replace('買取価格=0', '買取価格=10') for line in result]
        elif 'スタンダード範囲外' in target_card:
            result = [line.replace('Plains等', '現行スタンダード範囲外のCommonカード') for line in result]
    if '別担当者の入力数量' in effective:
        result.append('Wチェック用に同じ実商品コードの元ファイル数量='+effective['元ファイル数量']+'、別担当者の入力数量='+effective['別担当者の入力数量']+'、現物数量='+effective['現物数量']+'を用意する。元とコピーの別ファイル名・同一商品行・差分値を記録する。')
    if row_no is not None and not route and prerequisite_steps(s, row_no) is not None:
        result.append('単独工程の開始データはこの準備表の明示数量/原価で用意する。未取得の外部ファイル変換を完了したとは扱わず、実施対象とした後続の画面処理だけを判定する。経路全体の試験では外部工程も別途必要である。')
    result.append('開始前に次の値を同じ商品規格ID/実店舗IDへ設定し、在庫検索の実値を保存する: ' + ' / '.join(f'{k}={v}' for k,v in effective.items()))
    result.append('CSVを使う工程は、本文に記載した実ヘッダと値で作成してファイル名/保存先/ハッシュを実行記録へ残す。商品コードに合致する規格IDを検索してから登録する。採番IDを文字列の「実ID」のまま入力しない。')
    result.append('外部作業は本番の連絡先へ送らず、既存様式の実行用コピー/許可済みテスト宛先を使う。親の引継ぎで開始する場合は親のCSV/現物/実IDをそのまま受け取り再作成しない。')
    # A missing workbook blocks its own transformation, not an independently
    # prepared stock approval. The route case still records every prerequisite.
    if route or row_no is None:
        blockers = spec.get('remaining_blockers', [])
    else:
        blockers = [entry['reason'] for entry in spec.get('blocker_steps', [])
                    if int(row_no) in entry['steps']]
    result += ['実施保留条件: '+x for x in blockers]
    return result
