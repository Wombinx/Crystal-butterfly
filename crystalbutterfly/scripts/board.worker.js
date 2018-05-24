var alchemy = {};

importScripts("board.js");


addEventListener("message", function(event) {
    var board = alchemy.board,
        message = event.data;

    switch (message.command) {
        case "initialize" :
            var data = message.data;
            alchemy.settings = data.settings;
            board.initialize(data.startItems, callback);
            break;
        case "swap" :
            board.swap(
                message.data.x1,
                message.data.y1,
                message.data.x2,
                message.data.y2,
                callback
            );
            break;
    }

    function callback(data) {
        postMessage({
            id : message.id,
            data : data,
            items : board.getBoard()
        });
    }

}, false);
