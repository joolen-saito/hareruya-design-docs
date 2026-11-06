主張: `scenario_list.md:148`、`matrix_UTH-01/exceptions.tsv:4,20`、`UTH-01_*.md:155`は、gzの送信失敗時に「この回のファイルは届かず」、doneの送信失敗時に「doneが無い」と断定している。
実際: `/home/y-saito/Developments/ec-cube-enterprise/vendor/phpseclib/phpseclib/phpseclib/Net/SFTP.php:2154-2158,2228-2269`では送信先のファイルを開いて書き込んだ後でも失敗し得る。同ファイル`:2269-2274`は失敗時に送信先のファイルを削除しない。したがって、不完全なgzやdoneが残り得る。
判定: 事実の誤り
修正案: gz・doneの送信失敗時はファイルの不在を断定せず、送信先で有無と内容を確認して記録する。

主張: `UTH-01_*.md:155`は、旧ファイルの削除で失敗した場合に「送信先は変わらない」としている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchSftpService.php:94-106`では、接頭辞が一致するファイルを順に削除し、途中の削除失敗で`return false`する。それまでに削除できたファイルは戻されない。`scenario_list.md:148`と`exceptions.tsv:4,20`も「削除できたぶんだけ減る」場合を記している。
判定: 事実の誤り
修正案: L4の期待値も「送信は始まらず、送信先は削除できた分だけ減る場合がある」に揃える。
