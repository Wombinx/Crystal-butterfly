alchemy.screens["main-menu"] = (function() {
    var game = alchemy.game,
        firstRun = true;

    function setup() {
        $("#main-menu ul.menu").bind("click", function(e) {
            if (e.target.nodeName.toLowerCase() === "button") {
                var action = e.target.getAttribute("name");
                game.showScreen(action);
            }
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
