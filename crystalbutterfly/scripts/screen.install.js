alchemy.screens["install-screen"] = (function() {
    var game = alchemy.game;

    function updateTimer(){
        var timer = $("#timer").html();
        setTimeout(function(){
            var newTimer = timer -1;
            var copy = (newTimer == 1) ? " second" : " seconds";
            $("#timer").html(newTimer);
            $("#metrics").html(copy);
            if(newTimer == 0) {
                game.showScreen("main-menu");
            }
            else {
                updateTimer();
            }
        }, 1000);
    }

    function run(){
        updateTimer()
    }

    return {
        run : run
    };
})();

