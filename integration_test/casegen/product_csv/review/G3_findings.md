### 指摘1（重大度: Major）対象: A01-01 S-A01-01-SALE-002、S-A01-01-SALE-003、S-A01-01-RETURN-004、S-A01-01-OUTBOUND-012、S-A01-01-OUTBOUND-013、S-A01-01-OUTBOUND-014、S-A01-01-MOVE-015、S-A01-01-MOVE-016、S-A01-01-MOVE-017、S-A01-01-MOVE-018、S-A01-01-PACK-019、S-A01-01-PACK-020、S-A01-01-BULK-RELATIVE-026、S-A01-01-HISTSALE-037、S-A01-01-HISTCOSTSALE-038、S-A01-01-HISTRET-039、S-A01-01-HISTRETCOST-040、S-A01-01-HISTRETPRICE-041、S-A01-01-PICKRET-043、S-A01-01-PICKMIX-044、S-A01-01-PICKMIX-045、S-A01-01-SALE-047、S-A01-01-RETURN-048、S-A01-01-SALEMULTI-049、S-A01-01-OUTBULKNON-050、S-A01-01-CSVNON-051、S-A01-01-MOVE2-053、S-A01-01-SALEALL-054、S-A01-01-LIMITMAX-055、S-A01-01-LIMITMIN-056、S-A01-01-SALETWICE-057、S-A01-01-CSVTWICE-058、S-A01-01-CSVIN-061  
主張: CSV取込後、商品規格登録編集画面のスマレジ商品コードに「SMA-…」という文字列を入れて登録する（`integration_test/casegen/product_csv/out/A01-01.tsv:2`〜`:34`）。  
実際: 同項目の書式は数値と指定されている（`integration_test/casegen/datapattern/units/M03-09/design.txt:L0127`）。元のシードにも同じ文字列があるが、書き直し後の手順でも規格を登録できず、必要な商品を作れない。  
判定: 前提不成立  
修正案: 数値のスマレジ商品コードでケースの対象を再現できるか確認する。ケースが「SMA-…」を必須とする行は「直せない」として個別に扱う。

### 指摘2（重大度: Major）対象: F10-02 S-F10-02-ORDER-017  
主張: 2つ目の規格を「新規作成」し、商品コード・販売価格・部門・公開ステータスを入れて登録する（`integration_test/casegen/product_csv/out/F10-02.tsv:15`）。  
実際: 商品規格登録編集画面では、基準価格と買取価格も必須で、いずれも新規登録時の初期値は指定されていない（`integration_test/casegen/datapattern/units/M03-09/design.txt:L0144`〜`L0155`）。記述された入力だけでは2つ目の規格を登録できず、ケースが要する2規格を作れない（`integration_test/casegen/cases/F10-02_test_cases.tsv:18`）。  
判定: 手順不備  
修正案: 2つ目の規格に基準価格500と、販売価格500以下の買取価格を明記する。
