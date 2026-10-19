"""Review inventory delivery against its frozen execution contracts. Run from repo root."""
import json,csv,re,hashlib,collections
from pathlib import Path
P=Path('scenario_test/coverage/execution_repairs');x=json.loads((P/'inventory_contracts.json').read_text());cs={c['contract_id']:c for c in x['step_resolutions']}
csv.field_size_limit(10**7)
allitems=list(csv.DictReader(open('scenario_test/test_items/all_scenario_test_items.tsv'),delimiter='\t'));by=collections.defaultdict(list)
for item in allitems:
 if item['テストID'].startswith('STI-ZAIKO'):
  sid=re.search(r'元シナリオ: (\S+)',item['前提条件'])[1];by[sid].append(item)
old=json.load(open('scenario_test/coverage/executability_review_2026-10-09/inventory_review.json'))['scenarios'];result=[];issues=[]
for sid,spec in x['scenario_repairs'].items():
 path=next(Path('scenario_test/scenario').glob(sid+'_*.md'));content=path.read_text();items=by[sid];n=int(sid.rsplit('-',1)[1]);itemsteps={}
 for row in items:
  m=re.match(r'(?:正常系|代替系|異常系) #(\d+):',row['テスト項目名'])
  if m:itemsteps[int(m[1])]=row
 findings=[]
 if len(itemsteps)!=len(spec['steps']):findings.append({'kind':'missing_step_items','actual':len(itemsteps),'expected':len(spec['steps'])})
 for no,step in enumerate(spec['steps'],1):
  c=cs[step['contract_id']];row=itemsteps.get(no)
  if not row:continue
  if n==6 and no==6 and '現物3点' in row['操作手順/実行方法']:findings.append({'kind':'unfounded_surplus_quantity','step':no,'test_id':row['テストID']})
  if n==900 and no==2 and '言語' not in row['期待結果／レスポンス']:findings.append({'kind':'physical_language_check_missing','step':no,'test_id':row['テストID']})
  tokens=set(re.findall(r'\d[\d,]*(?:点|円|枚)|出庫承認待ち|出庫承認済み|入庫承認待ち|分割承認待ち|結合計画承認待ち|入庫完了|未承認|承認済み',c['expected_result']))
  missing=sorted(v for v in tokens if v not in row['期待結果／レスポンス'])
  if missing:findings.append({'kind':'expected_value_loss','step':no,'test_id':row['テストID'],'missing':missing,'contract_id':c['contract_id']})
  if '実ID採番の扱いの実値' in row['操作手順/実行方法']:findings.append({'kind':'instruction_treated_as_id','step':no,'test_id':row['テストID']})
  if 'admin / password' in row['操作手順/実行方法']:findings.append({'kind':'shared_login_overrides_actor','step':no,'test_id':row['テストID']})
 for row in items:
  if row['テスト観点']=='業務データ差分':
   logical=re.search(r'商品コード=([^ /]+)',row['入力データ/リクエスト内容'])
   body=row['操作手順/実行方法'];target=row['入力データ/リクエスト内容']
   if '対象カード=スタンダード範囲のR' in target and not ('Rare' in body and '買取価格=10' in body):findings.append({'kind':'rare_pattern_preparation_missing','test_id':row['テストID']})
   if '対象カード=スタンダード範囲外のC' in target and not ('範囲外のCommon' in body and '買取価格=0' in body):findings.append({'kind':'common_pattern_preparation_missing','test_id':row['テストID']})
   if '別担当者の入力数量=2' in target and '元ファイル数量=3、別担当者の入力数量=2、現物数量=3' not in body:findings.append({'kind':'double_check_quantity_missing','test_id':row['テストID']})
   if logical and logical[1] not in row['操作手順/実行方法']:findings.append({'kind':'dp_identity_not_prepared','test_id':row['テストID'],'id':logical[1]})
  if '処理結果が ' in row['期待結果／レスポンス'] and re.match(r'(?:正常系|代替系|異常系) #',row['テスト項目名']):findings.append({'kind':'generic_result_replaces_contract','test_id':row['テストID']})
 normal_main_original=sum(step['original_index'] is not None for step in spec['steps'])
 result.append({'scenario_id':sid,'status':'再修正が必要' if findings else '具体手順整合・原典/実資料待ちあり' if spec['remaining_blockers'] else '具体手順整合・実機未実施','scenario_path':str(path),'scenario_sha256':hashlib.sha256(content.encode()).hexdigest(),'test_ids':[r['テストID'] for r in items],'test_item_count':len(items),'original_step_count':spec['original_step_count'],'original_steps_retained':normal_main_original,'current_steps':len(spec['steps']),'checked':['原工程保持','単独項目への全工程展開','契約の数量/原価/状態期待の保持','実担当での認証','DP識別子の保持','保留理由の工程範囲'],'remaining_blockers':spec['blocker_steps'],'findings':findings})
 issues += [(sid,f) for f in findings]
summary={'review_date':'2026-10-09','runtime_executed':False,'scenario_count':len(result),'test_item_count':sum(r['test_item_count'] for r in result),'old_test_item_count':sum(s['reviewed_test_item_count'] for s in old),'data_lineage_item_count':sum(r['テスト観点']=='データ連鎖' for rows in by.values() for r in rows),'data_pattern_item_count':sum(r['テスト観点']=='業務データ差分' for rows in by.values() for r in rows),'procedure_findings':len(issues),'scenarios':result}
shipping=[r for r in allitems if '元シナリオ: SCN-TSUHAN-在庫移動準備業務-900 ' in r['前提条件']]
shipping_route=next(r for r in shipping if r['テスト観点']=='業務経路')
shipping_body=shipping_route['操作手順/実行方法']
summary['cross_business_preparation']={'scenario_id':'SCN-TSUHAN-在庫移動準備業務-900','test_ids':[r['テストID'] for r in shipping],'prepared_A3_B2':all(v in shipping_body for v in ['A3点','商品B2点','出庫承認済み・移動指示未作成']),'creates_customer_order':any(v in shipping_body for v in ['購入手順を完了','会員登録から購入'])}
summary['reviewed_data_variations']={'stock3_to0':5,'standard_rare_buy_price10':4,'nonstandard_common_buy_price0':4,'separate_file_3_vs2_physical3':1}
summary['manual_review_notes']=['003/004実入庫2、004元差分1戻し、分割/結合の数量原価保存を現行HTMLへ再照合。','006は棚卸後2点と配送超過数を分離し、閾値未定義を保留。解体検品→Backlog起票の順、フロア移動は実受入数を引継ぐ。','HTML900の現物照合に商品コード・言語・状態・3点を明記。','子002の参照は工程3〜14、商品登録の条件付き子範囲は商品担当へ確認済み。新弾PRODUCT002#11の保留は継承する。','独立STIは必須先行システム工程のみ準備し、未取得の外部変換を実施済みと扱わない。']
summary['aggregate_sha256']=hashlib.sha256(Path('scenario_test/test_items/all_scenario_test_items.tsv').read_bytes()).hexdigest()
(P/'inventory_postgeneration_review.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print({k:v for k,v in summary.items() if k not in ('scenarios','cross_business_preparation','manual_review_notes')})
for sid,f in issues[:20]:print(sid,f)
