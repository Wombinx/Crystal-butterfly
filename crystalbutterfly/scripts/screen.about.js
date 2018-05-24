alchemy.screens["about"] = (function() {
    var game = alchemy.game, firstRun = true;

    function setup() {
        $("#about footer button[name=back]").bind("click", function(e) {
            game.showScreen("main-menu");
        });
    }

    function run() {
        if (firstRun) {
            setup();
            firstRun = false;
        }
    }

    return {
        run : run
    };

})();
