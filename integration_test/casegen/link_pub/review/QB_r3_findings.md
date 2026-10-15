### 指摘1（重大度: Major）対象: IT-M03-26-QB002、IT-M03-27-QB003、IT-M03-28-QB001・QB002、IT-M03-38-QB001・QB002
変更: A（2巡目の反映）  
主張: 「最新入荷アイテム」の行を一覧で見つけ、そのタグIDを控えれば、本店TOPが参照する固定タグを指定できる。  
実際: 4つのマスタシードはいずれも名称で行を選び、「環境の既存の値」を控えるとしている。固定IDとの照合手順はない（`integration_test/casegen/link_pub/cases/QB_seed_data.tsv:4,11,20,32`）。本店TOPの設計書はブロック内でタグIDを指定して取得すると定める（`excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:1277`）。実装でも日本語版は固定ID 1を使う（`ec-cube-enterprise/src/Eccube/Entity/Tag.php:55`、`ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:60-70`）。名称が同じでも別IDの行なら、CSV更新後の掲載を確認できない。  
判定: 反映不備  
修正案: 各マスタシードで、本店TOPが参照する固定ID 1のタグ行を確認し、その行の名称を「最新入荷アイテム」に揃えてからIDを控える。行がなければ、その固定IDで登録する。

### 指摘2（重大度: Major）対象: IT-M03-28-QB003・QB004、IT-M03-38-QB003・QB004
変更: 手直し  
主張: 業務名「固定セールタグ」で支店TOPが参照するタグを特定できる。  
実際: シードは「固定セールタグの行」を一覧で確かめるとするが、その行を識別する値を示していない（`integration_test/casegen/link_pub/cases/QB_seed_data.tsv:20,32`）。設計書はタグの名称が時期によって変わるとする（`excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html:2287-2288`）。実装が参照するのは固定ID 8である（`ec-cube-enterprise/src/Eccube/Entity/Tag.php:68`、`ec-cube-enterprise/src/Eccube/Service/Block/SaleBlockPayloadBuilder.php:52`）。名称が変わる環境では、投入する商品タグが支店TOPの参照先と一致する保証がない。  
判定: 前提不成立  
修正案: M03-28・M03-38のマスタシードで固定ID 8の行を確認し、そのIDを〔タグID-…-セール〕として控える手順に戻す。商品とCSVには控えたIDを使う。
