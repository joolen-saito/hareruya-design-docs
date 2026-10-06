# バッチ インフラ — S3画像サイズチェック処理

## 業務ロジック

### 実行の前提

バケット名、結果表示用の公開URLの先頭部分、作業用の保存先は、設定で与える。設定が未設定のときも空のときも、あらかじめ決めた既定値が使われる。

オブジェクトストレージの接続先、リージョン、認証情報も設定で与える。接続先が空のときは、既定の接続先に接続する。

作業用の保存先が無いときは、実行の初めに作る。

一覧の取得、切り分け、判定、メール送信のいずれかで異常が起きたときは、その時点で打ち切って異常終了する。打ち切ったときはメールを送らない。メール件名の生成（文字コードの変換と日時の取得）の失敗は検出せず、メールの送信は続く。

この処理には、同時に複数実行したときの待機や排他が無い。同時に実行したものは、同じ作業用の一覧を共有する。

### ファイル一覧の取得

画像種別ごとに、対象のパスの配下を階層の深さによらずすべて辿り、ファイルのパスとサイズ（バイト数）の一覧を作る。ファイルのパスは、空白を含むとき最初の空白の手前までしか取れない。

商品サムネイルの3つの対象は1つの一覧にまとめる。ほかの画像種別は、それぞれ別の一覧にする。

Excelに無い対象として、設定で与えたバケットの img/goods/iwatatest/ の配下も一覧にする。この一覧は、ほかの画像種別とは別に作る。

各一覧は順に作り直す。途中で異常終了したときは、まだ作り直していない一覧には前回の内容が残り、作り直している最中の一覧は空か途中までの内容になる。実行の終了時に作業用の一覧は削除しない。

### 商品サムネイルとオリジナル画像の切り分け

商品サムネイルの対象のうち、オリジナル画像の対象の配下にあるファイルは、商品サムネイルの一覧にも含まれる。商品サムネイルの一覧から、オリジナル画像の一覧にある行（パスとサイズの両方が同じ行）を取り除く。取り除いたファイルは、商品サムネイルとしては判定せず、オリジナル画像の基準だけで判定する。

### 規定サイズの判定

基準のkBは、1kBを1024バイトとして数える。サイズはバイト数で比べる。

設定で与えたバケットの img/goods/iwatatest/ の配下は、512000バイト以上を超過とする。

超過したファイルは、パスとサイズ（バイト数を1024で割ったkB値）の1行にする。画像種別による区別は結果に残らない。

### 超過ファイルの一覧の作成

すべての画像種別の超過分を1つにまとめ、行の文字列の昇順に並べる。次に、各行に現れるバケットのパスの先頭部分（s3://とバケット名）を、行頭に限らずすべて結果表示用の公開URLの先頭部分に置き換える。

超過が1件も無いときは、この一覧が空になる。

### 通知の判定と送信

一覧が空でないとき、実行日時を「年月日-時:分:秒」の形（例 20250919-10:00:00）にして「<実行日時> :not empty」を出力する。一覧が空のときは「<実行日時> :empty」を出力し、メールを送らずに終える。

一覧が空でないときにメールを送るのは、送信可否の設定が小文字の true と完全に一致するときだけとする。ほかの値のとき、未設定のとき、空のときは、メールを送らず、「[MAIL_ENABLED=false] メール送信をスキップします。検出結果:」に続けて超過ファイルの一覧をそのまま出力する。

メールの差出人、宛先、CC、BCCは設定で与える。メールの文字コードはUTF-8の平文とする。送信元アドレスには差出人と同じものを使う。メールの送信に失敗したときは異常終了する。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | バケット名、公開URLの先頭部分、作業用の保存先、オブジェクトストレージの接続先・リージョン・認証情報、メールの送信可否と差出人・宛先・CC・BCCは設定で与える |
| 成功時出力 | 超過があるときは「<実行日時> :not empty」を出力する。送信可否の設定が小文字の true と一致するときは、通知メールを送る。超過が無いときは「<実行日時> :empty」を出力する |
| 失敗時出力 | 異常が起きたときは、メールを送らずに異常終了する。メールの送信に失敗したときも異常終了する |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 作成（上書き） | 実行のたびに、画像種別ごとのファイル一覧、切り分けや並べ替えのための中間の一覧、取り除き後の一覧、超過ファイルの一覧を作業用の保存先に作る。作り直した一覧は前回の内容を上書きし、実行後も削除しない |

## 表示メッセージ

この機能は、いずれの場合も画面のメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:4 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:11 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:13 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:16 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:17 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:20 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:22 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:26 |
| 実行の前提 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:29 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:14 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:16 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:17 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:18 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:20 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:22 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:24 |
| ファイル一覧の取得 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:26 |
| 商品サムネイルとオリジナル画像の切り分け | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:29 |
| 商品サムネイルとオリジナル画像の切り分け | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:31 |
| 規定サイズの判定 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:34 |
| 規定サイズの判定 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:36 |
| 規定サイズの判定 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:37 |
| 規定サイズの判定 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:40 |
| 超過ファイルの一覧の作成 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:82 |
| 超過ファイルの一覧の作成 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:83 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:86 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:87 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:91 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:93 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:94 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:95 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:96 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:97 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:98 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:108 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:110 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:111 |
| 通知の判定と送信 | P1 | ec-cube-enterprise:script/ops/imgcheck/bigfilefinder.sh:115 |
| 通知の判定と送信 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:32 |
| 通知の判定と送信 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:33 |
| 通知の判定と送信 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:34 |
| 通知の判定と送信 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:35 |
| 通知の判定と送信 | P2 | ec-cube-enterprise:script/ops/imgcheck/config.sh:36 |
