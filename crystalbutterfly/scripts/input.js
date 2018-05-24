alchemy.input = (function() {
    var settings = alchemy.settings,
        inputHandlers;

    var keys = {
        37 : "KEY_LEFT",
        38 : "KEY_UP",
        39 : "KEY_RIGHT",
        40 : "KEY_DOWN",
        13 : "KEY_ENTER",
        32 : "KEY_SPACE",
        65 : "KEY_A",
        66 : "KEY_B",
        67 : "KEY_C",
        // alpha keys 68 - 87
        88 : "KEY_X",
        89 : "KEY_Y",
        90 : "KEY_Z"
    };
        
    function handleClick(event, control, click) {
        // is any action bound to this input control?
        var action = settings.controls[control];
        if (!action) {
            return;
        }
        
        var board = $("#game-screen .game-board")[0],
            rect = board.getBoundingClientRect(),
            relX, relY,
            itemX, itemY;

        // click position relative to board
        relX = click.clientX - rect.left;
        relY = click.clientY - rect.top;
        // jewel coordinates
        itemX = Math.floor(relX / rect.width * settings.cols);
        itemY = Math.floor(relY / rect.height * settings.rows);
        // trigger functions bound to action
        trigger(action, itemX, itemY);
        // prevent default click behavior
        event.preventDefault();
    }

    function initialize() {
        inputHandlers = {};
        var $board = $("#game-screen .game-board");

        $board.bind("mousedown", function(event) {
            handleClick(event, "CLICK", event);
        });

        $board.bind("touchstart", function(event) {
            handleClick(event, "TOUCH", event.targetTouches[0]);
        });

        $(document).bind("keydown", function(event) {
            var keyName = keys[event.keyCode];
            if (keyName && settings.controls[keyName]) {
                event.preventDefault();
                trigger(settings.controls[keyName]);
            }
        });

    }


    function bind(action, handler) {
        if (!inputHandlers[action]) {
            inputHandlers[action] = [];
        }
        inputHandlers[action].push(handler);
    }

    function trigger(action) {
        var handlers = inputHandlers[action],
            args = Array.prototype.slice.call(arguments, 1);

        if (handlers) {
            for (var i=0;i<handlers.length;i++) {
                handlers[i].apply(null, args);
            }
        }
    }

    return {
        initialize : initialize,
        bind : bind
    };
})();
