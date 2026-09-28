# カードセット管理 — 収録カード画像 ZIP ダウンロード（セット別／言語別）

## 業務ロジック

### 対象カード詳細の絞り込み

セット別・言語別のいずれも、カード画像を1件も持たないカード詳細と、プロモーションが設定されていないカード詳細は対象から外れる。

### 未選択のままの実行

カードセットを1件も選択せずにダウンロードを実行したときは、プロモーションカード分をダウンロードしてよいかの確認を求め、承諾したときだけ実行する。

### セット別の作成

| 判定 | 結果 |
|------|------|
| 対象のカード詳細が0件のとき | 対象セットにカードが無い旨を表示し、保持したページ番号（無いときは1）のカードセット一覧へ戻って終了する。複数のカードセットを選んでいても、その時点で中止し、それまでに集めた分もダウンロードされない |
| 画像の保存に成功したとき | 圧縮ファイルへ追加し、同一カード詳細の残りの画像は処理しない |
| いずれの画像も保存に至らなかったとき | 当該カード詳細のIDを埋め込んだ画像なしのメッセージを表示し、処理は続ける |

カード画像はカード詳細ごとに言語ID昇順で取得する。日本語のIDは英語のIDより小さいため、昇順では日本語側が先に列挙される。

同一カード詳細に複数言語の画像があっても、先に保存に成功した1枚だけが圧縮ファイルに載る。

画像なしのメッセージは、圧縮ファイルを返す応答と同じ要求では画面に表示しない。次に管理画面を表示したときに、その画面にエラーとして表示する。

### 言語別の作成

カード詳細が0件のカードセットIDがあってもエラーとせず、次のIDへ進む。

保存に成功した画像はすべて圧縮ファイルへ追加し、セット別のような1カード詳細1枚での打ち切りは行わない。

### 画像ファイルの名前

| 項目 | 内容 |
|------|------|
| ファイル名 | 「カード詳細ID + `.jpg`」。ホイル相当のときは先頭に `F` を付ける |
| 拡張子 | カード画像に登録された保存先の拡張子によらず `.jpg` で固定する |

### デッドリンクの更新

カード画像のデッドリンクは、画像の保存に成功しなかったときは真へ、成功して真だったときは偽へ更新する。セット別は画像ごとに即時反映し、言語別は全IDの処理後にまとめて反映する。言語別で同じ画像が複数回対象になったときは後の判定が残る。

### 画像の取得元

画像の実体は外部のオブジェクトストレージから取得する。取得に失敗したときは、そのカード画像は保存できなかったものとして扱う。

### 応答

圧縮ファイル`card_image.zip`が作られなかったときは、画像が存在しない旨を表示し、保持したページ番号のカードセット一覧へ戻る。作られたときはその本体を返す。`Content-Type`は`aplication/octet-stream;`（表記は現行のまま）、`Content-Disposition`はファイル名をUTF-8でエンコードした形式で付与する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | カードセットIDの配列（一覧のチェックボックスの選択値） |
| 成功時出力 | HTTP 200と`card_image.zip`の本体、前述の`Content-Type`と`Content-Disposition` |
| 失敗時出力 | エラーメッセージとカードセット一覧への遷移 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | カード画像のデッドリンク（セット別は画像ごとに即時、言語別は全ID処理後にまとめて） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象カード詳細の絞り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbCardDetailRepository.php:348 |
| 未選択のままの実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Cardset/card_set.twig:22 |
| セット別の作成 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:323 |
| セット別の作成 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:360 |
| セット別の作成 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:373-376 |
| セット別の作成 | P2 | pf-eccube3:src/Eccube/Application/ApplicationTrait.php:28 |
| 言語別の作成 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:424 |
| 画像ファイルの名前 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/S3AccessService.php:184 |
| デッドリンクの更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:343 |
| デッドリンクの更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:460 |
| 画像の取得元 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/S3AccessService.php:189 |
| 応答 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:366 |
