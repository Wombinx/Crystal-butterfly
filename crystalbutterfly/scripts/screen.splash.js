alchemy.screens["splash-screen"] = (function() {
    var game = alchemy.game,
        firstRun = true;

    function setup(getLoadProgress) {
        function checkProgress() {
            var p = getLoadProgress() * 100;
            $("#splash-screen .indicator").css('width', p + '%');
            if (p == 100) {
                $("#splash-screen .continue").css('display', 'block');
                $("#splash-screen .progress").css('display', 'none');

                $("#splash-screen").bind("click", function() {
                    game.showScreen("main-menu");
                });
            } else {
                setTimeout(checkProgress, 30);
            }
        }
        checkProgress();
    }

    function run(getLoadProgress) {
        if (firstRun) {
            setup(getLoadProgress);
            firstRun = false;
        }
    }

    return {
        run : run
    };
})();


