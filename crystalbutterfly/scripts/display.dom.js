alchemy.display = (function() {
    var cols, rows,
        itemSize,
        firstRun = true,
        itemSprites,
        items,
        cursor,
        oldCursor;

    function createBackground() {
        var x, y, cell,
            background = document.createElement("div");
        for (x=0;x<cols;x++) {
            for (y=0;y<cols;y++) {
                if ((x+y) % 2) {
                    cell = document.createElement("div");
                    $(cell).css('left', x + 'em');
                    $(cell).css('top', y + 'em');
                    $(background).append(cell);
                }
            }
        }
        $(background).addClass("board-bg");
        return background;
    }

    function setup() {
        var $boardElement = $("#game-screen .game-board"),
            container = document.createElement("div"),
            sprite,
            x, y;

        cols = alchemy.settings.cols;
        rows = alchemy.settings.rows;
        itemSize = alchemy.settings.itemSize;
        itemSprites = [];

        for (x=0;x<cols;x++) {
            itemSprites[x] = [];
            for (y=0;y<cols;y++) {
                sprite = document.createElement("div");
                $(sprite).addClass("item");
                $(sprite).css('left', x + "em");
                $(sprite).css('top', y + "em");
                $(sprite).css('background-image',
                    "url(images/sprites/items" + itemSize + ".png)");
                $(sprite).css('background-repeat', "no-repeat");
                itemSprites[x][y] = sprite;
                $(container).append(sprite);
            }
        }
        $(container).addClass("dom-container");
        $boardElement.append(container);
        $boardElement.append(createBackground());
    }

    function initialize(callback) {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        callback();
    }

    function drawItem(type, x, y) {
        var sprite = itemSprites[x][y];
        $(sprite).css('background-position', "-"+ type + "em 0em" );
        $(sprite).css('display', 'block');
    }

    function redraw(newItems, callback) {
        var x, y;
        items = newItems;
        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                drawItem(items[x][y], x, y, 0, 0);
            }
        }
        callback();
        if(oldCursor){
            cursor = oldCursor;
            oldCursor = null;
        }
    }

    function refill(newItems, callback) {
        var refillOverlay = document.createElement("div");
        $(refillOverlay).css('background-color', "#6B0909");
        $(refillOverlay).css('width', "100%");
        $(refillOverlay).css('height', "100%");
        $('.game-board').append(refillOverlay);
        $(refillOverlay).fadeOut(500, function(){
            $(refillOverlay).remove();
        });

        redraw(newItems, callback);
    }

    function setCursor(x, y, selected) {
        clearCursor();

        if (arguments.length > 0) {
            oldCursor = cursor;
            cursor = {
                x : x,
                y : y,
                selected : selected
            };
        } else {
            cursor = null;
        }
        renderCursor();
    }

    function renderCursor(forceRendering) {
        if(typeof forceRendering != "undefined") {
            cursor = oldCursor;
        }
        if (!cursor) {
            return;
        }
        clearCursor();

        var sprite = itemSprites[cursor.x][cursor.y];
        $(sprite).css('border', '0.05em solid #FFCC00');
        $(sprite).css('width', '0.9em');
        $(sprite).css('height', '0.9em');
        $(sprite).css('background-position', '-'+items[cursor.x][cursor.y]+'.05em -0.05em');

        if (cursor.selected) {
            $(sprite).css('background-color', '#B99C24');
        }
    }

    function clearCursor() {
        if (!oldCursor) {
            return;
        }
        var sprite = itemSprites[oldCursor.x][oldCursor.y];
        $(sprite).css('border', 'none');
        $(sprite).css('background-color', '');
        $(sprite).css('width', '1em');
        $(sprite).css('height', '1em');
        $(sprite).css('background-position', '-'+items[oldCursor.x][oldCursor.y]+'em 0em');
    }

    function levelUp(callback) {
        var levelOverlay = document.createElement("div");
        $(levelOverlay).css('background-color', "#FFCC00");
        $(levelOverlay).css('width', "100%");
        $(levelOverlay).css('height', "100%");
        $('.game-board').append(levelOverlay);
        $(levelOverlay).fadeOut(1000, function(){
            $(levelOverlay).remove();
        });

        if(typeof callback != "undefined") {
            callback();
        }
    }

    function moveItems(movedItems, callback) {
        if(cursor != null) {
            oldCursor = cursor;
            cursor = null;
        }

        clearCursor();

        var eventOne = movedItems[0], eventTwo = movedItems[1];
        drawItem(eventOne.type, eventTwo.fromX, eventTwo.fromY);
        drawItem(eventTwo.type, eventOne.fromX, eventOne.fromY);

        setTimeout(function(){
            callback(); //do callback
        }, 500)
    }

    function removeItems(removedItems, callback) {
        removedItems.forEach(function(e) {
            var sprite = itemSprites[e.x][e.y];
            $(sprite).fadeOut();
        });

        setTimeout(function(){
            callback(); //do callback
        }, 500);
    }

    function gameOver(callback) {
        cursor = null;

        for (var x=0;x<cols;x++) {
            for (var y=0;y<cols;y++) {
                $(itemSprites[x][y]).fadeOut();
            }
        }

        setTimeout(function(){
            callback(); //do callback
        }, 500);
    }

    return {
        initialize : initialize,
        redraw : redraw,
        setCursor : setCursor,
        levelUp : levelUp,
        refill : refill,
        moveItems : moveItems,
        renderCursor: renderCursor,
        gameOver : gameOver,
        removeItems: removeItems
    };
})();
