jQuery.noConflict();

(function($) {
    "use strict";

    /*一覧画面上にボタンを設置、クリック時にダイアログを表示しレコード登録するプログラム*/
    kintone.events.on("app.record.index.show", function() {
      
        if (document.getElementById('my_index_butto') !== null) {
            return;
        }
    
        var myIndexButton = document.createElement('button');
        myIndexButton.id = 'my_index_butto';
        myIndexButton.innerText = '簡易登録';
        myIndexButton.setAttribute('class','kintoneplugin-button-normal');
        var myHeaderSpace = kintone.app.getHeaderMenuSpaceElement();
        myHeaderSpace.appendChild(myIndexButton);
        var title;

        var createDialogContent = function() {
          
            var dialog =
                $('<dialog id="dialog">'+ 
                '<div>'+
                '<label class = "label">登録内容</label><br>'+
                '<div class="kintoneplugin-select-outer">'+
                '<div class="kintoneplugin-select">'+
                '<select id ="status">'+
                '<option value = "1">外出する</option>'+
                '<option value = "2">在宅勤務</option>'+
                '<option value = "3">休み</option>'+
                '</select>'+
                '</div>'+
            　　'</div>'+
                '</div>'+
                '<input class="kintoneplugin-input-text" id="full_name" type="text" size="30" placeholder="氏名"></input><br>'+
                '<label class = "label">外出時刻</label>'+
                '<label class = "label">帰所予定時刻</label><br>'+
                '<input type = "time" name ="time" step="900" min="08:00" max="19:00" id = "out_time"></input>'+
                '<input type = "text" id = "comeback_time" size = "7"></input><br>'+
                '<div id = "text">'+
                '<input class="kintoneplugin-input-text" id="destination" type="text" size="40" placeholder="行先等"></input><br>'+
                '</div>'+
                '<label class = "label">使用車両</label><br>'+
                '<div class="kintoneplugin-select-outer">'+
                '<div class="kintoneplugin-select">'+
                '<select id ="drop_car">'+
                '<option value = "">-</option>'+
                '<option value = "車両１">車両１</option>'+
                '<option value = "車両２">車両２</option>'+
                '<option value = "車両３">車両３</option>'+
                '<option value = "車両４">車両４</option>'+
                '<option value = "車両５">車両５</option>'+
                '</select><br>'+
                '</div>'+
                '</div>'+
                '<div>'+
                '<button id = "post" class="kintoneplugin-button-normal">登録する</button>'+
                '<button id = "cancel" class="kintoneplugin-button-normal">キャンセル</button>'+
                '</div>'+
                '</dialog>');
            $(myHeaderSpace).append(dialog);
        };

        createDialogContent(); 
        
        $("#dialog").hide();

        myIndexButton.onclick = function() {
            $("#dialog").show();

            var now = moment().format('HH:mm');
            $("#out_time").val(now);
            
            $("#status").blur(function() {
              
                var t_status = $("#status").val();
              
                switch(t_status) {
                    case '2' : 
                        title = moment().add('days',1).format('MM/DD') + " 在宅勤務";
                        $("#destination").val(title);
                    break;
                    case '3' :
                        title = moment().add('days',1).format('MM/DD') + " 休み";
                        $("#destination").val(title);
                    break;
                }
            });
        }

        $("#cancel").on("click", function() {
            $("#dialog").hide();
        });

        $("#post").on("click",function() {
    
            title = $('#destination').val();
            var drop_car = $('#drop_car').val();
            var out_time = $('#out_time').val();
            var comeback_time = $('#comeback_time').val();
            var status = $("#status").val();
          　var full_name = $("#full_name").val();
            var body;
            
            switch(status) {
            
                case '1': 
                    body = {
                        "app":appID,
                        "record": {
                            "外出時刻": {
                            "value":out_time
                            },
                            "帰所予定時刻":{
                            "value":comeback_time
                            },
                            "氏名":{
                            "value":full_name
                            },
                            "行先等":{
                            "value":title
                            },
                            "車両":{
                            "value":drop_car
                            },
                            "status":{
                            "value":'外出中'
                            }
                        }
                    };
                break;
                case '2' :
                    body = {
                        "app":appID,
                        "record": {
                            "氏名":{
                                "value":full_name
                            },
                            "行先等":{
                                "value":title
                            },
                            "車両":{
                                "value":drop_car
                            },
                            "status":{
                                "value":'在宅勤務'
                            }
                        }
                    };
                break;
                case '3' :
                    body = {
                        "app":appID,
                        "record": {
                            "氏名":{
                            "value":full_name
                            },
                            "行先等":{
                            "value":title
                            },
                            "車両":{
                            "value":drop_car
                            },
                            "status":{
                            "value":'休み'
                            }
                        }
                    };
                break;
            }

            kintone.api(kintone.api.url('/k/v1/record', true), 'POST', body, function(resp) {
                console.log(resp);
                location.reload(true);
            }, function(error) {
                console.log(error);
            });
        });
    });

    /*カスタマイズビューに表示する */
    kintone.events.on('app.record.index.show',async(event)=> {

        //カスタマイズビューでなければreturnする
        if(event.viewId !== viewID){
        return;
        }
        var re_no,re_name,re_de,re_time,re_retime,re_car;
        var body = {
            "app": appID,
            "query" : 'status not in ("在席")',
            "fields" : ['氏名','行先等','外出時刻','帰所予定時刻','車両','レコード番号'],
            "totalCount": true
        }

        //APIリクエスト
        const resp = await kintone.api('/k/v1/records','GET',body);
    
  　    //取得できたレコードの件数が0件だったら全員在席中と表示
        if(resp.totalCount == '0') {
            $("#t_body").html("全員在席中");
        }
    
        //取得できたレコードの件数だけループ処理
        for(var i = 0 ; i < resp.totalCount ; i++) {
    
            //変数に取得したレコードの各フィールドの値を代入、nullの場合は空欄を入力する(一覧画面にnullと表示されるため)
            re_no = resp.records[i].レコード番号.value || '';
            re_name = resp.records[i].氏名.value || '';
            re_de = resp.records[i].行先等.value || '';
            re_time = resp.records[i].外出時刻.value || '';
            re_retime = resp.records[i].帰所予定時刻.value || '';
            re_car = resp.records[i].車両.value || '';
            
            //変数にhtml要素を入れる(レコード情報を含む)
            var html =  '<tr><td class="kintoneplugin-table-td-operation"><button class = "remove c_button">'+re_no+'</button></td>'+
                        '<td class="c_name">'+re_name+'</td>'+
                        '<td class="c_destination">'+re_de+'</td>'+
                        '<td class="c_out_time">'+re_time+'</td>'+
                        '<td class ="c_comeback_time">'+re_retime+'</td>'+
                        '<td class="c_car">'+re_car+'</td></tr>';
            $('#t_body').append(html);
        }
      
        //帰所登録
        $(".c_button").on("click",function() {
      
            //変数(id)にボタンのテキスト(レコード番号)を追加する
            var id =  $(this).text();
            var g_body = {
                "app":appID,
                "id":id
            };
            //APIリクエスト
            kintone.api(kintone.api.url('/k/v1/record', true), 'GET', g_body, function(g_res) {
                
                //レコード更新するリクエストボディ定義
                var p_body = {
                    "app":appID,
                    "id":id,
                    "record":{
                        "status":{
                        "value":'在席'
                        },
                        "帰所時刻":{
                        "value":moment().format("HH:MM")
                        }
                    }
                };
                //APIリクエスト(更新)
                kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', p_body, function(p_res) {
                console.log(p_res);
                });
                location.reload();
            });
        });
    });
})(jQuery);
