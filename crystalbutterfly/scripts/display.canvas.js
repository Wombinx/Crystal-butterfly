alchemy.display = (function() {
    var canvas, ctx,
        cols, rows,
        itemSize,
        items,
        firstRun = true,
        cursor,
        oldCursor,
        previousCycle,
        animations = [];

    function createBackground() {
        var background = document.createElement("canvas"),
            bgctx = background.getContext("2d");

        $(background).addClass("background");
        background.width = cols * itemSize;
        background.height = rows * itemSize;

        bgctx.fillStyle = "rgba(225,235,255,0.15)";
        for (var x=0;x<cols;x++) {
            for (var y=0;y<cols;y++) {
                if ((x+y) % 2) {
                    bgctx.fillRect(
                        x * itemSize, y * itemSize,
                        itemSize, itemSize
                    );
                }
            }
        }
        return background;
    }

    function setup() {
        var $boardElement = $("#game-screen .game-board");

        cols = alchemy.settings.cols;
        rows = alchemy.settings.rows;
        itemSize = alchemy.settings.itemSize;

        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        $(canvas).addClass("board");
        canvas.width = cols * itemSize;
        canvas.height = rows * itemSize;
        ctx.scale(itemSize, itemSize);

        $boardElement.append(canvas);
        $boardElement.append(createBackground());

        previousCycle = (new Date()).getTime();
        requestAnimationFrame(cycle);
    }

    function addAnimation(runTime, fncs) {
        var anim = {
            runTime : runTime,
            startTime : (new Date()).getTime(),
            pos : 0,
            fncs : fncs
        };
        animations.push(anim);
    }

    function renderAnimations(lastTime) {
        var anims = animations.slice(0), // copy list
            n = anims.length,
            animTime,
            anim,
            i;

        // call before() function
        for (i=0;i<n;i++) {
            anim = anims[i];
            if (anim.fncs.before) {
                anim.fncs.before(anim.pos);
            }
            anim.lastPos = anim.pos;
            animTime = (lastTime - anim.startTime);
            anim.pos = animTime / anim.runTime;
            anim.pos = Math.max(0, Math.min(1, anim.pos));
        }

        animations = []; // reset animation list

        for (i=0;i<n;i++) {
            anim = anims[i];
            anim.fncs.render(anim.pos, anim.pos - anim.lastPos);
            if (anim.pos == 1) {
                if (anim.fncs.done) {
                    anim.fncs.done();
                }
            } else {
                animations.push(anim);
            }
        }
    }

    function drawItem(type, x, y, scale, rot) {
        var image = alchemy.images["images/sprites/items" +
            itemSize + ".png"];

        ctx.save();
        if (typeof scale !== "undefined" && scale > 0) {
            ctx.beginPath();
            ctx.rect(x,y,1,1);
            ctx.clip();
            ctx.translate(x + 0.5, y + 0.5);
            ctx.scale(scale, scale);
            if (rot) {
                ctx.rotate(rot);
            }
            ctx.translate(-x - 0.5, -y - 0.5);
        }

        ctx.drawImage(image,
            type * itemSize, 0, itemSize, itemSize,
            x, y, 1, 1
        );
        ctx.restore();
    }

    function refill(newItems, callback) {
        var lastItem = 0;
        addAnimation(1000, {
            render : function(pos) {
                var thisItem = Math.floor(pos * cols * rows),
                    i, x, y;
                for (i = lastItem; i < thisItem; i++) {
                    x = i % cols;
                    y = Math.floor(i / cols);
                    clearItem(x, y);
                    drawItem(newItems[x][y], x, y);
                }
                lastItem = thisItem;
                canvas.style.webkitTransform =
                    "rotateX(" + (360 * pos) + "deg)";
            },
            done : function() {
                canvas.style.webkitTransform = "";
                callback();
            }
        });
    }

    function redraw(newItems, callback) {
        var x, y;
        items = newItems;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                drawItem(items[x][y], x, y);
            }
        }
        callback();
        if(oldCursor){
            cursor = oldCursor;
            oldCursor = null;
        }
        renderCursor((new Date()).getTime());
    }

    function clearItem(x, y) {
        ctx.clearRect(x, y, 1, 1);
    }

    function clearCursor() {
        if (cursor) {
            var x = cursor.x,
                y = cursor.y;
            clearItem(x, y);
            drawItem(items[x][y], x, y);
        }
    }

    function setCursor(x, y, selected) {
        clearCursor();
        if (arguments.length > 0) {
            cursor = {
                x : x,
                y : y,
                selected : selected
            };
        } else {
            cursor = null;
        }
        renderCursor((new Date()).getTime());
    }

    function moveItems(movedItems, callback) {
        var n = movedItems.length;

        if(cursor != null) {
            oldCursor = cursor;
            cursor = null;
        }
        movedItems.forEach(function(e) {
            var x = e.fromX, y = e.fromY,
                dx = e.toX - e.fromX,
                dy = e.toY - e.fromY,
                dist = Math.abs(dx) + Math.abs(dy);
            addAnimation(200 * dist, {
                before : function(pos) {
                    pos = Math.sin(pos * Math.PI / 2);
                    clearItem(x + dx * pos, y + dy * pos);
                },
                render : function(pos) {
                    pos = Math.sin(pos * Math.PI / 2);
                    drawItem(
                        e.type,
                        x + dx * pos, y + dy * pos
                    );
                },
                done : function() {
                    if (--n == 0) {
                        callback();
                    }
                }
            });
        });
    }

    function removeItems(removedItems, callback) {
        var n = removedItems.length;
        removedItems.forEach(function(e) {
            addAnimation(400, {
                before : function() {
                    clearItem(e.x, e.y);
                },
                render : function(pos) {
                    ctx.save();
                    ctx.globalAlpha = 1 - pos;
                    drawItem(
                        e.type, e.x, e.y,
                        1 - pos, pos * Math.PI * 2
                    );
                    ctx.restore();
                },
                done : function() {
                    if (--n == 0) {
                        callback();
                    }
                }
            });
        });
    }

    function levelUp(callback) {
        addAnimation(1000, {
            before : function(pos) {
                var j = Math.floor(pos * rows * 2),
                    x, y;
                for (y=0,x=j;y<rows;y++,x--) {
                    if (x >= 0 && x < cols) { // boundary check
                        clearItem(x, y);
                        drawItem(items[x][y], x, y);
                    }
                }
            },
            render : function(pos) {
                var j = Math.floor(pos * rows * 2),
                    x, y;
                ctx.save(); // remember to save state
                ctx.globalCompositeOperation = "lighter";
                for (y=0,x=j;y<rows;y++,x--) {
                    if (x >= 0 && x < cols) { // boundary check
                        drawItem(items[x][y], x, y, 1.1);
                    }
                }
                ctx.restore();
            },
            done : callback
        });
    }

    // real explode pieces
    function explodePieces(pieces, pos, delta) {
        var piece, i;
        for (i=0;i<pieces.length;i++) {
            piece = pieces[i];

            piece.vel.y += 50 * delta;
            piece.pos.y += piece.vel.y * delta;
            piece.pos.x += piece.vel.x * delta;

            if (piece.pos.x < 0 || piece.pos.x > cols) {
                piece.pos.x = Math.max(0, piece.pos.x);
                piece.pos.x = Math.min(cols, piece.pos.x);
                piece.vel.x *= -1;
            }

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.translate(piece.pos.x, piece.pos.y);
            ctx.rotate(piece.rot * pos * Math.PI * 4);
            ctx.translate(-piece.pos.x, -piece.pos.y);
            drawItem(piece.type,
                piece.pos.x - 0.5,
                piece.pos.y - 0.5
            );
            ctx.restore();
        }
    }

    // Real explode
    function explode(callback) {
        var pieces = [],
            piece,
            x, y;
        for (x=0;x<cols;x++) {
            for (y=0;y<rows;y++) {
                piece = {
                    type : items[x][y],
                    pos : {
                        x : x + 0.5,
                        y : y + 0.5
                    },
                    vel : {
                        x : (Math.random() - 0.5) * 20,
                        y : -Math.random() * 10
                    },
                    rot : (Math.random() - 0.5) * 3
                };
                pieces.push(piece);
            }
        }

        addAnimation(2000, {
            before : function(pos) {
                ctx.clearRect(0,0,cols,rows);
            },
            render : function(pos, delta) {
                explodePieces(pieces, pos, delta);
            },
            done : callback
        });
    }

    //real game over
    function gameOver(callback) {
        cursor = null;
        addAnimation(1000, {
            render : function(pos) {
                canvas.style.left =
                    0.2 * pos * (Math.random() - 0.5) + "em";
                canvas.style.top =
                    0.2 * pos * (Math.random() - 0.5) + "em";
            },
            done : function() {
                canvas.style.left = "0";
                canvas.style.top = "0";
                explode(callback);
            }
        });
    }

    function renderCursor(time) {
        if(typeof time == "boolean"){
            cursor = oldCursor;
            time = (new Date()).getTime();
        }
        if (!cursor) {
            return;
        }
        var x = cursor.x,
            y = cursor.y,
            t1 = (Math.sin(time / 200) + 1) / 2,
            t2 = (Math.sin(time / 400) + 1) / 2;

        clearCursor();

        if (cursor.selected) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.8 * t1;
            drawItem(items[x][y], x, y);
            ctx.restore();
        }
        ctx.save();
        ctx.lineWidth = 0.05;
        ctx.strokeStyle =
            "rgba(250,250,150," + (0.5 + 0.5 * t2) + ")";
        ctx.strokeRect(x+0.05,y+0.05,0.9,0.9);
        ctx.restore();
    }

    function cycle() {
        var time = (new Date()).getTime();
        renderCursor(time);
        renderAnimations(previousCycle);
        previousCycle = time;
        requestAnimationFrame(cycle);
    }

    function initialize(callback) {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        callback();
    }

    return {
        initialize : initialize,
        redraw : redraw,
        setCursor : setCursor,
        moveItems : moveItems,
        removeItems : removeItems,
        refill : refill,
        levelUp : levelUp,
        gameOver : gameOver,
        renderCursor: renderCursor
    }
})();
