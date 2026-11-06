主張: `matrix_USH-03/prohibitions.tsv:10-11` の禁則X9・X10は、本店・支店では「カードの区分は空にならない」として、空の区分D5との組を禁じている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:110-112` は、基準価格が空なら閾値の判定より先に `return '';` とする。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:285-286` でも基準価格は `nullable: true`。本店・支店でも空の区分が起こりうる。
判定: 禁則の誤り
修正案: X9・X10を外し、D5に「基準価格が空のカード」を加えて本店・支店との組もテストする。
