/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：注文印刷_印刷情報をプリンタへ送信
課題カテゴリ：実装漏れ
課題：GetRequest 成功時に印刷情報XMLのログファイルが書き出されない
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. A05-01 の印刷対象条件を満たす受注を用意する
2. ec-cube-enterprise の注文印刷 API で ConnectionType=GetRequest の印刷情報を取得する（例: POST http://localhost:8080/api/order/prints/direct/{base_info_id} に ConnectionType=GetRequest を指定）
3. レスポンスの印刷情報 XML が空でないことを確認し、var/log/print_logs/ 配下に print_*.xml が作成されるか確認する

# 期待される挙動【必須】
- GetRequest で生成した印刷情報 XML が空でない場合、ログ保存ディレクトリ var/log/print_logs/ 配下へ XML ファイルを書き出す
- ログ保存ディレクトリが存在しない場合は作成する
- ファイル名はタイムスタンプと一意名を含む print_*.xml とする

# 現在の挙動【必須】
- ec-cube-enterprise では、GetRequest で印刷情報 XML を生成した後のログファイル書き出し処理が `// TODO :後ほど対応` としてコメントアウトされている。`mkdir()` と `file_put_contents()` はコメント内にあり、実行されない。

ec-cube-enterprise ログファイル書き出し処理は TODO コメントアウト: `ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:48-67`
```php
        if ($connectionType === 'GetRequest') {
            // 印刷データ送信処理
            $uri = $request->getUriForPath('/');

            $xmlData = $this->orderDirectPrintAction->handle(new OrderDirectPrintInput(
                uri: $uri,
                base_info_id: $base_info_id,
            ));

            // TODO :後ほど対応
            /* 印刷不具合検証のためXMLデータをファイル出力する
            if (!empty($xmlData)) {
                $dir = '/var/www/html/ec-cube/var/log/print_logs/';
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }
                $filename = $dir . 'print_' . date('Ymd_His') . '_' . uniqid() . '.xml';;
                file_put_contents($filename, $xmlData);
            }
            */
```
- ベース実装(pf-api)では、GetRequest で生成した XML が空でない場合に print_logs ディレクトリを作成し、`print_YYYYmmdd_HHMMSS_<uniqid>.xml` に `file_put_contents()` で書き出している。

ベース実装 pf-api は print_logs ディレクトリ作成と XML 書き出しを実行する: `pf-api/src/Controller/Admin/OrderController.php:34-48`
```php
        if ($connectionType === 'GetRequest') {
            // 印刷データ送信処理
            $uri = $request->getUriForPath('/');
            $xmlData = $this->sendXmlData($uri);

            // 印刷不具合検証のためXMLデータをファイル出力する
            if (!empty($xmlData)) {
                $dir = '/var/www/html/api/var/log/print_logs/';
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }
                $filename = $dir . 'print_' . date('Ymd_His') . '_' . uniqid() . '.xml';;
                // ステータスがピック中だが未印刷という不具合再現待ちで停止
                file_put_contents($filename, $xmlData);
            }
```

# 根拠
- 設計：
  - A05-01 は印刷情報 XML ログファイル書き出しを扱う: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1019-1020`
  - GetRequest で印刷情報が空でない場合にログファイルへ書き出す: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1043-1044`
  - ログ保存ディレクトリとファイル名要件: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1095`
  - ログ監査でも GetRequest の XML ログ書き出しを定義: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1119`
- ec-cube-enterprise：
  - ログファイル書き出し処理がコメントアウトされ実行されない: `ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:48-67`
- ベース実装：
  - XML が空でない場合に print_logs へ書き出す: `pf-api/src/Controller/Admin/OrderController.php:34-48`

# 確認メモ
- 確認コマンド: `rg -n "印刷ログ|print_logs|ログファイル|file_put_contents|mkdir|TODO|後ほど対応|GetRequest|OrderDirectPrintAction" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html pf-api/src/Controller/Admin/OrderController.php ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php`
- 確認コマンド: `rg -n "print_logs|file_put_contents|mkdir|TODO|後ほど対応" ec-cube-enterprise/src/Eccube pf-api/src`
- 確認コマンド: `nl -ba pf-api/src/Controller/Admin/OrderController.php | sed -n '28,48p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php | sed -n '43,72p'`
- 設計HTMLは GetRequest で生成した印刷情報XMLが空でない場合の print_logs 書き出しを要求している。
- pf-api はディレクトリ作成と file_put_contents を実行している。
- ec-cube-enterprise は同等処理が TODO コメントアウト内にあり、実行経路に乗っていない。
