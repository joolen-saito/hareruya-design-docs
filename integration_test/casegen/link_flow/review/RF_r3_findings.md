### 指摘1（重大度: Major）対象: S-M06-04-RF-ORDER-001、S-M06-04-RF-ORDER-002
変更: B（置き換え）  
主張: 申込者の姓「M0604RF」を「M06-04 RF」に置き換えた。  
実際: 両シードの投入方法は、空白を含む「M06-04 RF」を「お名前（姓）」へ入力する（`integration_test/casegen/link_flow/cases/RF_seed_data.tsv:10-11`）。設計書は氏名に空白文字を含む入力を受け付けない（`functions/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.md:32`）。この値では査定申込みを作れず、両ケースの前提が成立しない。  
判定: 入力制約違反  
修正案: 両シードの「お名前（姓）」を空白のない「RF買取」にし、状態・属性の申込者名もそれぞれ「RF買取 ORDER001」「RF買取 ORDER002」に合わせる。
