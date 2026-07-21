# b16-04_0408_sheet-6_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b16-04_0408_sheet-6_sheet.json#b16-04_0408_sheet-6_sheet-conformance-5b04b931e119`
- 機能: B16-04 B16-04 必須項目が空欄の会員発生通知
- 観点: ⑦要求網羅・実装違い

## 要旨
ユーザー情報抜粋データのCONCATで電話番号(1列目) c.tel01 のラベルが ':tel02:' になっており、設計が要求する 'tel01:' ラベルが出力されない。

## 判定理由
設計書 sheet-6 の取得例(1440行)およびメール本文例(1468行)は tel01:[電話番号(1列目)]:tel02:[電話番号(2列目)]:tel03:[電話番号(3列目)] を要求している。実装 CustomerRepository::getBlankRequiredItemCustomers() の CONCAT(649-650行)では c.tel01 の直前ラベルが ':tel02:' で、続く c.tel02 も ':tel02:' となっているため、tel01 ラベルが欠落し tel02 ラベルが2回出現する。grep で tel01/tel02 ラベルを確認し、この関数が該当バッチのユーザー情報抜粋データ生成箇所であることを確認した(WHERE条件も設計の必須項目チェックと一致)。設計例(1列目=tel01)と実装(1列目=tel02ラベル)が一致しないため実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1440-1468` — 設計要求(取得例・本文例)

```html
            <p class="doc-p" style="--lv:1">contory:[国名]:pref:[都道府県名]:name01:[名前(姓)]:name02:[名前(姓)]:tel01:[電話番号(1列目)]:tel02:[電話番号(2列目)]:tel03:[電話番号(3列目)]:email:[メールアドレス]:addr01:[住所1]:addr02:[住所2] :addr03:[住所3]:postal_code:[郵便番号]</p>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">※</span><span>未設定項目がある箇所には、'null'という文字列に置き換わる</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">※</span><span>「国名」および「都道府県名」は各マスターデータから名称を取得した上で表示される</span></div>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ検索条件</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">項目名　条件　備考</h3>
            <p class="doc-p" style="--lv:0">会員データ.国ID　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.都道府県ID　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.名前(姓)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.名前(名)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.電話番号(1列目)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.電話番号(2列目)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.メールアドレス　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.住所1　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.住所2　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.住所3　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.郵便番号1(上3桁)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.郵便番号2(上4桁)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.郵便番号(ハイフン無し7桁)　未設定(NULL)</p>
            <p class="doc-p" style="--lv:0">会員データ.退会者フラグ　無効　退会者を除く</p>
            <h3 class="doc-h doc-h-section" style="--lv:0">実行結果詳細  ※主にDBの登録・更新結果について記載</h3>
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">・</span><span>「入力データ詳細」で取得した一覧からユーザー毎に以下の処理を行う</span></div>
            <p class="doc-p" style="--lv:1">「会員ID」・「ユーザー情報抜粋データ」を改行で区切りながら、該当ユーザー分を繰り返しながらメール本文を作成する</p>
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">・</span><span>全ユーザー分の処理が完了し、必須項目の未設定ユーザーが存在した場合は晴れる屋システム管理者のメールアドレスに送信する</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>メール送信先は[it_common@hareruyamtg.com]に送信する</span></div>
            <p class="doc-p" style="--lv:2">(メールの宛先はmtb_optionテーブルのcheck_bric_mail_addressカラムに設定されているメールアドレス)</p>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>メール送信元は本店IDを指定して取得</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>件名:　必須項目が空欄である会員の存在を通知するメール</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>本文(例)</span></div>
            <p class="doc-p" style="--lv:2">会員ID<br>11111<br>contory:日本:pref:東京都:name01:テスト:name02:ユーザー:tel01:000:tel02:0000:tel03:0000:email:test@test.com:addr01:新宿区:addr02:高田馬場3-12-2 :addr03:null:postal_code:null<br>22222<br>contory:日本:pref:東京都:name01:テスト:name02:ユーザー2:tel01:000:tel02:0000:tel03:0000:email:null:addr01:新宿区:addr02:高田馬場3-12-2 :addr03:OCビル2F:zip01:null :zip02:null :zipcode:null .<br>.<br>.<br>(以下略)</p>
```

## ec-cube-enterprise 実装
c.tel01 の直前ラベルが ':tel02:' になっており tel01 ラベルが欠落。tel02 ラベルが2回出現する。
`ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:649-650` — 実装(CONCAT のラベル誤り)

```php
                "CONCAT('contory:', COALESCE(co.name, 'null'), ':pref:', COALESCE(p.name, 'null'), ':name01:', COALESCE(c.name01, 'null'),
                ':name02:', COALESCE(c.name02, 'null'), ':tel02:', COALESCE(c.tel01, 'null'), ':tel02:', COALESCE(c.tel02, 'null'), ':tel03:', COALESCE(c.tel03, 'null'),
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証4観点すべて不成立。(1)別実装なし: rg "':tel01:'" を src/ 全体で実行したが該当ゼロ。ユーザー情報抜粋データを生成するのは CustomerRepository::getBlankRequiredItemCustomers() のみで、呼び出し元は CheckBlankRequiredItemCustomerAction::handle() の1箇所。同 Action は $customer['info'] を無加工で MailService::sendBlankRequiredItemCustomerAlertMail() に渡し、同メソッド(MailService.php:1282-1288)も $blankRequiredItemCustomer['info'] を implode で本文に直挿入するだけで、tel02→tel01 のリマップは一切ない。よって代替ルートで tel01 ラベルが出力される可能性はない。(2)引用正確: 実装 CustomerRepository.php:650 は実際に "':name02:', COALESCE(c.name02, 'null'), ':tel02:', COALESCE(c.tel01, 'null'), ':tel02:', COALESCE(c.tel02, 'null'), ':tel03:'" であり、c.tel01 の直前ラベルが ':tel02:'、tel02 ラベルが2回出現、tel01 ラベル欠落を実ファイルで確認。設計側も 1440行『…:name02:[名前(姓)]:tel01:[電話番号(1列目)]:tel02:[電話番号(2列目)]:tel03:…』、1468行本文例『…:name02:ユーザー:tel01:000:tel02:0000:tel03:0000…』で tel01 ラベルを明確に要求。(3)設計除外なし: 近傍(1438-1470行)に Ph2/対象外/現行踏襲の注記なし。(4)読み違いなし: 対象バッチのメール本文生成箇所で画面/API混同なし。指摘は完全に維持。
