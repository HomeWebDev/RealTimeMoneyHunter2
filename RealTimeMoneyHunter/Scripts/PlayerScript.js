/// <reference path="../Scripts/jquery-1.10.2.js" />
/// <reference path="../Scripts/jquery.signalR-2.0.0.js" />

$(function () {
    $body = $('body');
    $Textdemo = $("#Textdemo");
    $coinshape = $("#coinshape");
    $parent = $("#Container");
    $ScoreContainer = $("#ScoreContainer");
    $Coin = $("#coinshape");

    moveShapeHub = $.connection.moveShapeHub;
    // Send a maximum of 10 messages per second
    // (mouse movements trigger a lot of messages)
    messageFrequency = 20,
    // Determine how often to send messages in
    // time to abide by the messageFrequency
    updateRate = 1000 / messageFrequency,
    shapeModel = {
        left: 0,
        top: 0
    };
    Shapy = {
        ShapeId: -1,
        ShapeOwner: "none",
        PlayerId: "none"
    };
    coinModel = {
        left: 500,
        top: 250
    }
    var user;
    moved = false;
    coinCatchable = true;


    moveShapeHub.client.clientConnected = function (model) {
        var Shapy = model;
        //$("<div>hej</div").prependTo("body");
        $newplayer = $("<div id='" + Shapy.ShapeOwner + "'></div").prependTo($parent).addClass("PlayerShape");
        $newplayer.text("Player " + ": " + Shapy.ShapeId);
        $playerScore = $("<div id='" + Shapy.PlayerId + "'></div").prependTo($ScoreContainer).addClass("CoinScore");
        $playerScore.text("Player " + Shapy.ShapeId+" Score: "+Shapy.CoinScore);

        moveShapeHub.server.otherPlayer(Shapy);
    };

    moveShapeHub.client.updateScore = function (model) {
        $playerScore = $("#" + model.PlayerId);
        $playerScore.text("Player " + model.ShapeId+" Score: "+model.CoinScore);
    };

    moveShapeHub.client.winner = function (model)
    {
        alert("Player " + model.ShapeId + "\n wins!");
        moveShapeHub.server.clearScoreForAllUsers();
    }

    moveShapeHub.client.clearScoreForAllUsers = function()
    {
        $playerScores = $("div").filter(".CoinScore").each(function (i) {
            $(this).text(this.id + " Score: 0");
        });
        
    }

    $.connection.hub.start().done(function () {
        moveShapeHub.server.getUserN();
    });

    moveShapeHub.client.clientDisconnected = function (model) {
        var Shapy = model;
        $toremove = $("#" + Shapy.ShapeOwner);
        $toremove.remove();
        $ScoreToRemove = $("#" + Shapy.PlayerId);
        $ScoreToRemove.remove();
    };

    moveShapeHub.client.updateShape = function (model) {
        shapeModel = model;
        // Gradually move the shape towards the new location (interpolate)
        // The updateRate is used as the duration because by the time
        // we get to the next location we want to be at the "last" location
        // We also clear the animation queue so that we start a new
        // animation and don't lag behind.
        $("#"+shapeModel.ShapeOwner).animate(shapeModel, { duration: updateRate, queue: false });
        //$shape.css({ left: model.left, top: model.top }); //Use this if we want to update direct instead of animation
    };

    //Function to update position of coin
    moveShapeHub.client.updateCoinShape = function (model) {
        coinModel = model;
        coinModel = { left: model.left, top: model.top }
        coinModel.left = (($parent.width() -50) < model.left) ? $parent.width() -50 +$parent.offset().left : model.left;
        coinModel.top = ($parent.height() - 50 < model.top) ? $parent.height() - 50 +$parent.offset().top : model.top;
        coinModel.left = $parent.position().left > coinModel.left ? $parent.position().left : coinModel.left;
        coinModel.top = $parent.position().top > coinModel.top ? $parent.position().top : coinModel.top;

        document.getElementById("coinshape").style.left =  coinModel.left + "px";
        document.getElementById("coinshape").style.top = coinModel.top + "px";
    };

    moveShapeHub.client.otherPlayer = function (model) {
        var Shapy = model;
        if (Shapy.ShapeOwner != null) {
            if (!$("#" + Shapy.ShapeOwner).length) {
                $newPlayer = $("<div id='" + Shapy.ShapeOwner + "'></div").prependTo($parent).addClass("PlayerShape");
                $newPlayer.text("Player " + ": " + Shapy.ShapeId);
                $playerScore = $("<div id='" + Shapy.PlayerId + "'></div").prependTo($ScoreContainer).addClass("CoinScore");
                $playerScore.text("Player " + Shapy.ShapeId+" Score: "+Shapy.CoinScore);
                var t = 1;
            }
        }
    };

    moveShapeHub.client.getUserN = function (oo) {
        user = oo;
    };

    $('#form1').on('change', function () {
        //moveShapeHub.server.getUserN();
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
        $("#" + user).draggable({
            containment: "parent",
            drag: function () {
                shapeModel = $("#" + user).offset(),
                moved = true,
                shapeModel.ShapeOwner = user;
            }
        });

        //Check if money taken
        setInterval(checkIfMoneyTaken, updateRate);

        // Start the client side server update interval
        setInterval(updateServerModel, updateRate);
    });

    function updateServerModel() {
        // Only update server if we have a new movement
        if (moved) {
            moveShapeHub.server.updateModel(shapeModel);
            moved = false;
        }
    };

    function checkIfMoneyTaken() {

        // Only check for money if there is a new movement
        //if (moved) {

            moneyHit = false;

            //Check if shape is within area of coin
            squareOffset = 50;
            coinOffset = 25;
            distance = 75;
            if (shapeModel.left + squareOffset > coinModel.left + coinOffset - distance &
                shapeModel.left + squareOffset < coinModel.left + coinOffset + distance &
                shapeModel.top + squareOffset > coinModel.top + coinOffset - distance &
                shapeModel.top + squareOffset < coinModel.top + coinOffset + distance) {
                moneyHit = true;
            }

            //If shape was within area of coin update score and move coin
            if (moneyHit & coinCatchable) {
                //Move coin
                moveShapeHub.server.moveCoin(coinModel);
                //Update score
                moveShapeHub.server.updateScore(shapeModel);


                var myVar;

                myVar = setTimeout(alertFunc, 200);

                coinCatchable = false;
            }
        //}
    };

    function alertFunc() {
        //alert("Hello!");
        coinCatchable = true;
    };
});