alchemy.screens["settings"] = (function() {
    var game = alchemy.game,
        audio = alchemy.audio,
        storage = alchemy.storage,
        firstRun = true;

    function saveSettingsData() {
        storage.set("settingsData", {
            sound : audio.getStatus(),
            difficulty: alchemy.settings.difficulty
        });
    }

    function switchDifficulty() {
        var $difficultyButton = $("#settings button[name=difficulty]");
        var difficulty;

        $difficultyButton.bind("click", function(e) {
            if($difficultyButton.hasClass('normal')) {
                difficulty = 'hard';
                $difficultyButton.removeClass('normal').addClass('hard').html('HARD');
            }
            else if($difficultyButton.hasClass('hard')) {
                difficulty = 'easy';
                $difficultyButton.removeClass('hard').addClass('easy').html('EASY');
            }
            else if($difficultyButton.hasClass('easy')) {
                difficulty = 'normal';
                $difficultyButton.removeClass('easy').addClass('normal').html('NORMAL');
            }
            alchemy.settings.difficulty = difficulty;
            saveSettingsData();
        });

    }

    function soundToogle() {
        var $soundButton = $("#settings button[name=sound]");
        var soundStatus;

        $soundButton.bind("click", function(e) {
            if($soundButton.hasClass('on')) {
                soundStatus = false;
                $soundButton.removeClass('on').addClass('off').html('OFF');
            }
            else {
                $soundButton.removeClass('off').addClass('on').html('ON');
                soundStatus = true;
            }
            audio.setStatus(soundStatus);
            saveSettingsData();
        });
    }

    function setup() {
        var activeSettings = storage.get("settingsData");

        if (activeSettings) {
            var $soundButton = $("#settings button[name=sound]");
            if(!activeSettings.sound){
                $soundButton.removeClass('on').addClass('off').html('OFF');
            }
            else{
                $soundButton.removeClass('off').addClass('on').html('ON');
            }

            var $difficultyButton = $("#settings button[name=difficulty]");
            $difficultyButton.removeClass('normal').removeClass('easy').removeClass('hard').addClass(activeSettings.difficulty).html(activeSettings.difficulty.toUpperCase());
            alchemy.settings.difficulty = activeSettings.difficulty;
        }

        $("#settings footer button[name=back]").bind("click", function(e) {
            game.showScreen("main-menu");
        });

        soundToogle();
        switchDifficulty();
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
