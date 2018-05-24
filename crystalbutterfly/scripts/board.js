alchemy.board = (function() {
    var settings,
        items,
        cols,
        rows,
        baseScore,
        numItemTypes;

    function randomItem() {
        return Math.floor(Math.random() * numItemTypes);
    }

    function getItem(x, y) {
        if (x < 0 || x > cols-1 || y < 0 || y > rows-1) {
            return -1;
        } else {
            return items[x][y];
        }
    }

    function fillBoard() {
        var x, y,
            type;
        items = [];
        for (x = 0; x < cols; x++) {
            items[x] = [];
            for (y = 0; y < rows; y++) {
                type = randomItem();
                while ((type === getItem(x-1, y) &&
                    type === getItem(x-2, y)) ||
                    (type === getItem(x, y-1) &&
                        type === getItem(x, y-2))) {
                    type = randomItem();
                }
                items[x][y] = type;
            }
        }
        // recursive fill if new board has no moves
        if (!hasMoves()) {
            fillBoard();
        }
    }

    // returns the number items in the longest chain
    // that includes (x,y)
    function checkChain(x, y) {
        var type = getItem(x, y),
            left = 0, right = 0,
            down = 0, up = 0;

        // look right
        while (type === getItem(x + right + 1, y)) {
            right++;
        }

        // look left
        while (type === getItem(x - left - 1, y)) {
            left++;
        }

        // look up
        while (type === getItem(x, y + up + 1)) {
            up++;
        }

        // look down
        while (type === getItem(x, y - down - 1)) {
            down++;
        }

        return Math.max(left + 1 + right, up + 1 + down);
    }

    // returns true if (x1,y1) can be swapped with (x2,y2)
    // to form a new match
    function canSwap(x1, y1, x2, y2) {
        var type1 = getItem(x1,y1),
            type2 = getItem(x2,y2),
            chain;

        if (!isAdjacent(x1, y1, x2, y2)) {
            return false;
        }

        // temporarily swap items
        items[x1][y1] = type2;
        items[x2][y2] = type1;

        chain = (checkChain(x2, y2) > 2
            || checkChain(x1, y1) > 2);

        // swap back
        items[x1][y1] = type1;
        items[x2][y2] = type2;

        return chain;
    }

    // returns true if (x1,y1) is adjacent to (x2,y2)
    function isAdjacent(x1, y1, x2, y2) {
        var dx = Math.abs(x1 - x2),
            dy = Math.abs(y1 - y2);
        return (dx + dy === 1);
    }

    // returns a two-dimensional map of chain-lengths
    function getChains() {
        var x, y,
            chains = [];

        for (x = 0; x < cols; x++) {
            chains[x] = [];
            for (y = 0; y < rows; y++) {
                chains[x][y] = checkChain(x, y);
            }
        }
        return chains;
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


    // returns true if at least one match can be made
    function hasMoves() {
        for (var x = 0; x < cols; x++) {
            for (var y = 0; y < rows; y++) {
                if (canItemMove(x, y)) {
                    return true;
                }
            }
        }
        return false;
    }

    function check(events) {
        var chains = getChains(),
            hadChains = false, score = 0,
            removed = [], moved = [], gaps = [];

        for (var x = 0; x < cols; x++) {
            gaps[x] = 0;
            for (var y = rows-1; y >= 0; y--) {
                if (chains[x][y] > 2) {
                    hadChains = true;
                    gaps[x]++;
                    removed.push({
                        x : x, y : y,
                        type : getItem(x, y)
                    });

                    // add points to score
                    score += baseScore
                        * Math.pow(2, (chains[x][y] - 3));

                } else if (gaps[x] > 0) {
                    moved.push({
                        toX : x, toY : y + gaps[x],
                        fromX : x, fromY : y,
                        type : getItem(x, y)
                    });
                    items[x][y + gaps[x]] = getItem(x, y);
                }
            }

            // fill from top
            for (y = 0; y < gaps[x]; y++) {
                items[x][y] = randomItem();
                moved.push({
                    toX : x, toY : y,
                    fromX : x, fromY : y - gaps[x],
                    type : items[x][y]
                });
            }
        }

        events = events || [];

        if (hadChains) {
            events.push({
                type : "remove",
                data : removed
            }, {
                type : "score",
                data : score
            }, {
                type : "move",
                data : moved
            });

            // refill if no more moves
            if (!hasMoves()) {
                fillBoard();
                events.push({
                    type : "refill",
                    data : getBoard()
                });
            }

            return check(events);
        } else {
            return events;
        }

    }

    // returns true if (x,y) is a valid position and if 
    // the item at (x,y) can be swapped with a neighbor
    function canItemMove(x, y) {
        return ((x > 0 && canSwap(x, y, x-1 , y)) ||
            (x < cols-1 && canSwap(x, y, x+1 , y)) ||
            (y > 0 && canSwap(x, y, x , y-1)) ||
            (y < rows-1 && canSwap(x, y, x , y+1)));
    }

    // if possible, swaps (x1,y1) and (x2,y2) and
    // calls the callback function with list of board events
    function swap(x1, y1, x2, y2, callback) {
        var tmp, swap1, swap2,
            events = [];
        swap1 = {
            type : "move",
            data : [{
                type : getItem(x1, y1),
                fromX : x1, fromY : y1, toX : x2, toY : y2
            },{
                type : getItem(x2, y2),
                fromX : x2, fromY : y2, toX : x1, toY : y1
            }]
        };
        swap2 = {
            type : "move",
            data : [{
                type : getItem(x2, y2),
                fromX : x1, fromY : y1, toX : x2, toY : y2
            },{
                type : getItem(x1, y1),
                fromX : x2, fromY : y2, toX : x1, toY : y1
            }]
        };
        if (isAdjacent(x1, y1, x2, y2)) {
            events.push(swap1);
            if (canSwap(x1, y1, x2, y2)) {
                tmp = getItem(x1, y1);
                items[x1][y1] = getItem(x2, y2);
                items[x2][y2] = tmp;
                events = events.concat(check());
            } else {
                events.push(swap2, {type : "badswap"});
            }
            callback(events);
        }
    }

    function initialize(startItems, callback) {
        settings = alchemy.settings;
        numItemTypes = settings[settings.difficulty].numItemTypes;
        baseScore = settings[settings.difficulty].baseScore;
        cols = settings.cols;
        rows = settings.rows;
        if (startItems) {
            items = startItems;
        } else {
            fillBoard();
        }
        callback();
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
        canSwap : canSwap,
        getBoard : getBoard,
        print : print
    };

})();
