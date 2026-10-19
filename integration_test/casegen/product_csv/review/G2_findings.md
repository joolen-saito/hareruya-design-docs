### 指摘1（重大度: Major）対象: F04-02 S-F04-02-ADDRESS-DOMESTIC-043、S-F04-02-POINT-059、S-F04-02-ITEMS-083、S-F04-02-CONFIRM-AMT-088、S-F04-02-CONFIRM-TAX-089
主張: 元の税込1100円を CSV の基準価格・販売価格1000円に、ITEMS-083 の税込550円を500円に換算している。
実際: 価格は税込で登録する扱いであり、F04-02 は商品金額合計に送料・手数料を足し、その合計から内税を算出する（[F04-02/design.txt](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/F04-02/design.txt:320)、[ProductClass.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:106)）。ケースも商品金額1100円、ITEMS-083 の2商品は税込1100円・550円を要求する（[F04-02_test_cases.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/F04-02_test_cases.tsv:73)）。
判定: 再現しない
修正案: 該当する CSV 行の基準価格・販売価格を1100円、ITEMS-083 の2商品目を550円にする。

### 指摘2（重大度: Major）対象: M05-01 以下の136シードID

S-M05-01-SOURCE-001、S-M05-01-SOURCE-002、S-M05-01-SOURCE-003、S-M05-01-STATUS-005、S-M05-01-DISPLAY-008、S-M05-01-DISPLAY-009、S-M05-01-DISPLAY-010、S-M05-01-DISPLAY-011、S-M05-01-PAGING-013、S-M05-01-PAGING-014、S-M05-01-PAGING-015、S-M05-01-CSV-017、S-M05-01-CSV-018、S-M05-01-CSV-020、S-M05-01-CSV-021、
S-M05-01-CSV-022、S-M05-01-CSV-023、S-M05-01-CSV-024、S-M05-01-CSV-025、S-M05-01-CSV-026、S-M05-01-CSV-027、S-M05-01-PAGING-028、S-M05-01-CSV-029、S-M05-01-STACK-030、S-M05-01-CSV-031、S-M05-01-CSV-032、S-M05-01-CSV-033、S-M05-01-INVOICE-034、S-M05-01-INVOICE-035、S-M05-01-INVOICE-036、
S-M05-01-INVOICE-037、S-M05-01-DISPLAY-038、S-M05-01-DISPLAY-039、S-M05-01-DISPLAY-040、S-M05-01-DEL-NONMEM-041、S-M05-01-DEL-NONMEM-042、S-M05-01-DEL-MEMBER-043、S-M05-01-DEL-LAST-044、S-M05-01-DEL-FIRSTBUY-045、S-M05-01-DEL-NONMEM-046、S-M05-01-DEL-NONMEM-047、S-M05-01-DEL-CONCURRENT-048、S-M05-01-PATAFTER-053、S-M05-01-PATLINK-057、S-M05-01-PATRELOAD-059、
S-M05-01-PATALL-060、S-M05-01-PATSTAR-061、S-M05-01-PATDUP-062、S-M05-01-PATCACHE-063、S-M05-01-PATSESSION-066、S-M05-01-PATPAGE1-067、S-M05-01-PATPERPAGE-068、S-M05-01-VALCOUNT-070、S-M05-01-NOCOND-072、S-M05-01-INITVIEW-073、S-M05-01-INITPAGE-074、S-M05-01-NOUPDATE-075、S-M05-01-PERPAGEOPT-076、S-M05-01-CLEAR-077、S-M05-01-CANCELOUT-078、
S-M05-01-STOREOR-079、S-M05-01-STOREALLPLUS-080、S-M05-01-STORECLOSED-081、S-M05-01-PREVNO-082、S-M05-01-BUYERFREE-083、S-M05-01-BUYERAND-084、S-M05-01-TOGGLE1-085、S-M05-01-TOGGLE2-086、S-M05-01-STATUSOPT-087、S-M05-01-STATUSFILTER-088、S-M05-01-MASTEROPT-089、S-M05-01-PAYFILTER-090、S-M05-01-PAYOPT-091、S-M05-01-NOTEYES-092、S-M05-01-NOTEBOTH-093、
S-M05-01-BUYERMAIL-094、S-M05-01-BUYERNAME-095、S-M05-01-BUYERKANA-096、S-M05-01-BUYERTEL-097、S-M05-01-GENDER-098、S-M05-01-PERIODMULTI-099、S-M05-01-PERIOD-100、S-M05-01-PERIOD-101、S-M05-01-PERIOD-102、S-M05-01-PERIOD-103、S-M05-01-PERIODEDGE-104、S-M05-01-RELDAY-105、S-M05-01-RELDAY-106、S-M05-01-RELDAY-107、S-M05-01-RELDAY-108、
S-M05-01-RELDAY-109、S-M05-01-RELDAY-110、S-M05-01-RELDAY-111、S-M05-01-STATEBOTH-114、S-M05-01-AMOUNT-115、S-M05-01-PRODNAMEAND-116、S-M05-01-PRODNAMEOR-117、S-M05-01-PRODCODE-118、S-M05-01-SHIPFREE-119、S-M05-01-SHIPAND-120、S-M05-01-SHIPNAME-121、S-M05-01-SHIPKANA-122、S-M05-01-SHIPZIP-123、S-M05-01-SHIPTEL-124、S-M05-01-SHIPCOUNTRY-125、
S-M05-01-SHIPPREF-126、S-M05-01-SHOPNO-127、S-M05-01-FREE1-129、S-M05-01-FREE1AND-130、S-M05-01-DLVFILTER-131、S-M05-01-GRPFILTER-132、S-M05-01-PAYOPT-135、S-M05-01-PATNONEKEEP-136、S-M05-01-STORECLOSEDPLUS-137、S-M05-01-PATSAVEDMSG-139、S-M05-01-NOTENO-140、S-M05-01-BUYERKANAHIRA-141、S-M05-01-SHIPKANAHIRA-142、S-M05-01-SHIPTELFULL-143、S-M05-01-SHIPTELHYPHEN-144、
S-M05-01-SHIPPREFPART-145、S-M05-01-EDGE1-146、S-M05-01-EDGE2-147、S-M05-01-EDGE3-148、S-M05-01-EDGE4-149、S-M05-01-EDGE5-150、S-M05-01-EDGE6-151、S-M05-01-BOTH1-152、S-M05-01-BOTH2-153、S-M05-01-BOTH3-154、S-M05-01-BOTH4-155、S-M05-01-BOTH5-156、S-M05-01-BOTH6-157、S-M05-01-CANCELIN-158、S-M05-01-LISTCOUNT-159、S-M05-01-PATCACHE-160

主張: CSV で作った規格を商品規格登録編集画面で開き、「在庫無制限にチェック」を入れて登録する（[out/M05-01.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/out/M05-01.tsv:2)）。
実際: M03-09 の Excel 由来の画面項目に在庫無制限の操作欄はなく、在庫数も編集不可である（[M03-09/design.txt](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/M03-09/design.txt:95)、同ファイル L0122〜L0172）。現行の編集テンプレートも在庫数を表示するだけで、チェック欄を描画していない（[edit.twig](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:356)）。CSV 取込直後の在庫は0である（[M03-27/design.txt](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/M03-27/design.txt:130)）。
判定: 手順不備
修正案: このチェック操作を前提にせず、各ケースで必要な購入数量を満たす在庫を、在庫変更用の画面・CSVで用意する。無制限という状態自体が必要なら、画面で作れるという判定を見直す。

### 指摘3（重大度: Minor）対象: F04-02 S-F04-02-ZERO-TOTAL-103
主張: CSV の必須列「基準価格」「販売価格」に「販売価格・送料・手数料の合計が1400円となる額」を入れ、送料・手数料は後のご注文方法指定画面の表示に合わせて求める（[out/F04-02.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/out/F04-02.tsv:91)）。
実際: 基準価格と販売価格は CSV 取込時の必須列である（[M03-27/design.txt](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern/units/M03-27/design.txt:225)）。指定されたご注文方法指定画面には、商品を取り込んでカートに入れた後でしか進めない。ケースはポイント差引前注文金額1400円を要求する（[F04-02_test_cases.tsv](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/cases/F04-02_test_cases.tsv:92)）。
判定: 手順不備
修正案: 取込前に送料・手数料を確認できる手順と、そこから算出した具体的な税込販売価格を示す。
