alchemy.screens["game-screen"] = (function() {
    var settings = alchemy.settings,
        storage = alchemy.storage,
        board = alchemy.board,
        display = alchemy.display,
        input = alchemy.input,
        audio = alchemy.audio,
        cursor,
        firstRun = true,
        levelUp = false,
        paused = false,
        pauseTime,
        runningGame;

    function startGame() {
        gameState = {
            level : 0,
            score : 0,
            timer : 0, // setTimeout reference
            startTime : 0, // time at start of level
            endTime : 0, // time to game over
            difficulty: settings.difficulty
        };
        cursor = {
            x : 0,
            y : 0,
            selected : false
        };
        runningGame = true;

        var activeGame = storage.get("activeGameData"), useActiveGame, startItems;

        if (activeGame) {
            useActiveGame = window.confirm("Do you want to continue your previous game?");
            if (useActiveGame) {
                gameState.level = activeGame.level;
                gameState.score = activeGame.score;
                gameState.difficulty = activeGame.difficulty;
                startItems = activeGame.items;
            }
        }

        $('#game-screen .alert-overlay').removeClass("active-alert").removeClass("alert-fade");

        board.initialize(startItems,
            function() {
                display.initialize(function() {
                    display.redraw(board.getBoard(), function() {
                        audio.initialize();
                        if (useActiveGame) {
                            setLevelTimer(true, activeGame.time);
                            updateGameInfo();
                        } else {
                            advanceLevel();
                        }
                    });
                });
            }
        );
    }

    function announce(str, fadeType, stayDisplay) {
        if(typeof fadeType == "undefined"){
            fadeType = "fadeout";
        }

        if(typeof stayDisplay == "undefined"){
            stayDisplay = false;
        }

        var $element = $("#game-screen .announcement");
        $element.html(str);
        if (Modernizr.cssanimations) {
            $element.removeClass("fadeout");
            $element.removeClass("fadein");

            setTimeout(function() {
                $element.addClass(fadeType);
                if(stayDisplay) {
                    $element.addClass("active");
                }
                else {
                    $element.removeClass("active");
                }
            }, 1);
        } else {
            $element.addClass("active");
            if(!stayDisplay) {
                setTimeout(function() {
                    $element.removeClass("active");
                }, 1000);
            }
        }
    }

    function updateGameInfo() {
        $("#game-screen .score span").html(gameState.score);
        $("#game-screen .level span").html(gameState.level);
        $("#game-screen .difficulty span").html(gameState.difficulty);
    }

    function advanceLevel() {
        levelUp = true;

        timeout = (gameState.level == 0) ? 0 : 800;
        setTimeout(function(){
            gameState.level++;
            announce("Level " + gameState.level);
            audio.play("levelup");

            updateGameInfo();
            gameState.startTime = (new Date()).getTime();
            gameState.endTime = settings[gameState.difficulty].baseLevelTimer *
                Math.pow(gameState.level, -0.05 * gameState.level);
            setLevelTimer(true);
            display.levelUp();
            levelUp = false;
        }, timeout);
    }


    function addScore(points) {
        var nextLevelAt = Math.pow(
            settings[gameState.difficulty].baseLevelScore,
            Math.pow(settings[gameState.difficulty].baseLevelExp, gameState.level-1)
        );
        gameState.score += points;
        gameState.endTime +=  points * settings[gameState.difficulty].baseTimerBoost;

        if (gameState.score >= nextLevelAt) {
            advanceLevel();
        }
        updateGameInfo();
    }


    function setLevelTimer(reset) {
        if (gameState.timer) {
            clearTimeout(gameState.timer);
            gameState.timer = 0;
        }
        if (reset) {
            $("#game-screen .time .indicator").removeClass('alert');
            gameState.startTime = (new Date()).getTime();
            gameState.endTime =
                settings[gameState.difficulty].baseLevelTimer *
                    Math.pow(gameState.level,
                        -0.05 * gameState.level);
        }
        var delta = gameState.startTime +
                gameState.endTime - (new Date()).getTime(),
            percent = (delta / gameState.endTime) * 100,
            $progress = $("#game-screen .time .indicator");
        if (delta < 0) {
            if(!levelUp) {
                gameOver();
            }
        } else {
            $progress.css('width', percent + "%");
            if(percent < 10){
                $progress.addClass('alert');

                if(parseInt(percent) % 3 == 0){
                    var $element = $('#game-screen .alert-overlay');
                    if (Modernizr.cssanimations) {
                        $element.removeClass("active-alert").removeClass("alert-fade");

                        setTimeout(function() {
                            $element.addClass("alert-fade");
                        }, 1);
                    } else {
                        $element.addClass("active-alert");
                        setTimeout(function() {
                            $element.removeClass("active-alert");
                        }, 1000);
                    }
                }
            }
            else {
                $progress.removeClass('alert');
            }

            gameState.timer = setTimeout(function() {
                setLevelTimer(false);
            }, 30);
        }
    }

    function gameOver() {
        stopGame();
        storage.set("activeGameData", null);
        announce("Game over", "fadein", true);
        audio.play("gameover");
        display.gameOver(function() {
            setTimeout(function() {
                alchemy.game.showScreen("hiscore", gameState.score, gameState.difficulty);
            }, 1000);
        });
    }

    function run() {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        startGame();
    }

    function setCursor(x, y, select) {
        cursor.x = x;
        cursor.y = y;
        cursor.selected = select;
        display.setCursor(x, y, select);
    }

    function selectItem(x, y) {
        if(runningGame) {
            if (arguments.length == 0) {
                selectItem(cursor.x, cursor.y);
                return;
            }
            if (cursor.selected) {
                var dx = Math.abs(x - cursor.x),
                    dy = Math.abs(y - cursor.y),
                    cx = cursor.x,
                    cy = cursor.y,
                    dist = dx + dy;

                if (dist == 0) {
                    // deselected the selected item
                    setCursor(x, y, false);
                } else if (dist == 1) {
                    // selected an adjacent item
                    setCursor(x, y, false);
                    board.swap(cx, cy,
                        x, y, playBoardEvents);
                } else {
                    // selected a different item
                    setCursor(x, y, true);
                }
            } else {
                setCursor(x, y, true);
            }
        }
    }

    function playBoardEvents(events) {

        if (events.length > 0) {
            var boardEvent = events.shift(),
                next = function() {
                    playBoardEvents(events);
                };
            switch (boardEvent.type) {
                case "move" :
                    display.moveItems(boardEvent.data, next);
                    break;
                case "remove" :
                    audio.play("match");
                    display.removeItems(boardEvent.data, next);
                    break;
                case "refill" :
                    announce("No moves!");
                    display.refill(boardEvent.data, next);
                    break;
                case "score" :
                    addScore(boardEvent.data);
                    next();
                    break;
                case "badswap" :
                    audio.play("badswap");
                    display.renderCursor(true);
                    break;
                default :
                    next();
                    break;
            }
        } else {
            display.redraw(board.getBoard(), function() {
                // good to go again
            });
        }
    }

    function moveCursor(x, y) {
        if (cursor.selected) {
            x += cursor.x;
            y += cursor.y;
            if (x >= 0 && x < settings.cols
                && y >= 0 && y < settings.rows) {
                selectItem(x, y);
            }
        } else {
            x = (cursor.x + x + settings.cols) % settings.cols;
            y = (cursor.y + y + settings.rows) % settings.rows;
            setCursor(x, y, false);
        }
    }

    function moveUp() {
        moveCursor(0, -1);
    }

    function moveDown() {
        moveCursor(0, 1);
    }

    function moveLeft() {
        moveCursor(-1, 0);
    }

    function moveRight() {
        moveCursor(1, 0);
    }

    function stopGame() {
        runningGame = false;
        clearTimeout(gameState.timer);
    }

    function saveGameData() {
        storage.set("activeGameData", {
            level : gameState.level,
            score : gameState.score,
            time : (new Date()).getTime() - gameState.startTime,
            items : board.getBoard(),
            difficulty: gameState.difficulty
        });
    }

    function togglePause(enable) {
        if (enable == paused) return; // no change

        var $overlay = $("#game-screen .pause-overlay");
        paused = enable;
        $overlay.css('display', paused ? "block" : "none");

        if (paused) {
            clearTimeout(gameState.timer);
            gameState.timer = 0;
            pauseTime = (new Date()).getTime();
        } else {
            gameState.startTime += (new Date()).getTime() - pauseTime;
            setLevelTimer(false);
        }
    }

    function setup() {
        input.initialize();
        input.bind("selectItem", selectItem);
        input.bind("moveUp", moveUp);
        input.bind("moveDown", moveDown);
        input.bind("moveLeft", moveLeft);
        input.bind("moveRight", moveRight);

        $("#game-screen button[name=exit]").bind("click",
            function() {
                togglePause(true);
                var exitGame = window.confirm("Do you want to return to the main menu?");
                togglePause(false);
                if (exitGame) {
                    saveGameData();
                    stopGame();
                    alchemy.game.showScreen("main-menu")
                }
            }
        );
    }

    return {
        run : run
    };
})();
