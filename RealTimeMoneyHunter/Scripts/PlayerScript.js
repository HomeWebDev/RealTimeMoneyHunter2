/// <reference path="../Scripts/jquery-1.10.2.js" />
/// <reference path="../Scripts/jquery.signalR-2.0.0.js" />

$(function () {
    $body = $('body');
    $Textdemo = $("#Textdemo");
    $shape3 = $("#shape3");
    $shape2 = $("#shape2");
    $shape = $("#shape");
    moveShapeHub = $.connection.moveShapeHub;
    var user;
    Shapy = {
        ShapeId: -1,
        ShapeOwner: "none",
        PlayerId: "none"
    }

    moveShapeHub.client.clientConnected = function (model) {
        var Shapy = model;
        //$("<div>hej</div").prependTo("body");
        $newplayer = $("<div id='"+Shapy.ShapeOwner+"'></div").prependTo("body").addClass("PlayerShape");
        $newplayer.text(Shapy.ShapeOwner+": "+ Shapy.PlayerId);
        moveShapeHub.server.otherPlayer(Shapy);

    }

    moveShapeHub.client.clientDisconnected = function (model) {
        var Shapy = model;
        $toremove = $("#"+Shapy.ShapeOwner);
        $toremove.remove();
    }

    moveShapeHub.client.otherPlayer = function (model) {
        var Shapy = model;
        if (Shapy.ShapeOwner != null) {
            if (!$("#"+Shapy.ShapeOwner).length){
                $newPlayer = $("<div id='" + Shapy.ShapeOwner + "'></div").prependTo("body").addClass("PlayerShape");
                $newPlayer.text(Shapy.ShapeOwner+": "+ Shapy.PlayerId);
                var t = 1;
                }
        }
    }

    moveShapeHub.client.getUser = function (oo) {
        user = oo;
    };

    moveShapeHub.client.userChoose = function (model) {
        if (model.ShapeOwner != null) {
            var Shapy = model
            $Textdemo.text(Shapy.ShapeOwner);
        }
        val = Shapy.ShapeId;
        switch (val) {
            case 1:
                if ($Textdemo[0].textContent == user) {
                    $shape.draggable('enable');
                    }
                else
                {
                    $shape.draggable('disable' );
                }
                break;
            case 2:
                if ($Textdemo[0].textContent == user) {
                    $shape2.draggable('enable');
                    }
                else
                {
                    $shape2.draggable('disable' );
                }
                break;
            case 3:
                if ($Textdemo[0].textContent == user) {
                    $shape3.draggable('enable');
                    }
                else
                {
                    $shape3.draggable('disable' );
                }
                break;
            default:
        }
    };

    $('#form1').on('change', function () {
        moveShapeHub.server.getUser();
        var val = $('input[name=shapeOwner]:checked', '#form1').val();
        switch (val) {
            case "red":
                $("#" + user).css("background","#FF0000")
                break;
            case "blue":
                $("#" + user).css("background","#0000FF")
                break;
            case "green":
                $("#" + user).css("background","#00FF00")
                break;
            default:
                Shapy.ShapeId = 0;
        }
    });

    //$('#form1').on('change', function () {
    //    moveShapeHub.server.getUser();
    //    var val = $('input[name=shapeOwner]:checked', '#form1').val();
    //    switch (val) {
    //        case "red":
    //            Shapy.ShapeId = 1;
    //            break;
    //        case "blue":
    //            Shapy.ShapeId = 2;
    //            break;
    //        case "green":
    //            Shapy.ShapeId = 3;
    //            break;
    //        default:
    //            Shapy.ShapeId = 0;
    //    }
    //    moveShapeHub.server.userChoose(Shapy);
    //});

});