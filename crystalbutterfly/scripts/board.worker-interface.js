alchemy.board = (function() {
    var settings,
        worker,
        messageCount,
        callbacks;


    function post(command, data, callback) {
        callbacks[messageCount] = callback;
        worker.postMessage({
            id : messageCount,
            command : command,
            data : data
        });
        messageCount++;
    }

    function messageHandler(jQueryEvent) {
        event = jQueryEvent.originalEvent;

        // uncomment to log worker messages
//         console.log("Received: ", event.data);
        if(event){
            var message = event.data;

            items = message.items;

            if (callbacks[message.id]) {
                callbacks[message.id](message.data);
                delete callbacks[message.id];
            }
        }
    }

    function initialize(startItems, callback) {
        settings = alchemy.settings;
        rows = settings.rows;
        cols = settings.cols;
        messageCount = 0;
        callbacks = [];
        worker = new Worker("scripts/board.worker.js");
        $(worker).bind("message", messageHandler);
        var data = {
            settings : settings,
            startItems : startItems
        };
        post("initialize", data, callback);
    }


    function swap(x1, y1, x2, y2, callback) {
        post("swap", {
            x1 : x1,
            y1 : y1,
            x2 : x2,
            y2 : y2
        }, callback);
    }

    // creates a copy of the item board
    function getBoard() {
        var copy = [],
            x;
        for (x = 0; x < cols; x++) {
            copy[x] = items[x].slice(0);
        }
        return copy;
    }

    function getItem(x, y) {
        if (x < 0 || x > cols-1 || y < 0 || y > rows-1) {
            return -1;
        } else {
            return items[x][y];
        }
    }

    function print() {
        var str = "";
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                str += getItem(x, y) + " ";
            }
            str += "\r\n";
        }
//        console.log(str);
    }

    return {
        initialize : initialize,
        swap : swap,
        getBoard : getBoard,
        print : print
    };

})();
