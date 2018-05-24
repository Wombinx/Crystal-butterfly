alchemy.screens["hiscore"] = (function() {
    var game = alchemy.game,
        storage = alchemy.storage,
        numScores = 10,
        firstRun = true,
        difficultyDisplayed;

    function setup() {
        $("#hiscore footer button[name=back]").bind("click", function(e) {
            game.showScreen("main-menu");
        });
        selectDifficulty();
    }

    function run(score, difficulty) {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        populateList();
        if (typeof score != "undefined") {
            enterScore(score, difficulty);
        }
    }

    function getScores(difficulty) {
        return storage.get("hiscore-"+difficulty) || [];
    }

    function enterScore(score, difficulty) {
        var scores = getScores(difficulty),
            name, i, entry;
        for (i=0;i<=scores.length;i++) {
            if (i == scores.length || score > scores[i].score) {
                name = prompt("Please enter your name:");
                entry = {
                    name : name,
                    score : score
                };
                scores.splice(i, 0, entry);
                storage.set("hiscore-"+difficulty, scores.slice(0, numScores));
                populateList();
                return;
            }
        }
    }

    function populateList() {
        var scores = getScores(difficultyDisplayed),
            $list = $("#hiscore ol.score-list"),
            item, nameEl, scoreEl, i;

        // make sure the list is full
        for (var i=scores.length;i<numScores;i++) {
            scores.push({
                name : "---",
                score : 0
            });
        }

        $list.html("");

        for (i=0;i<scores.length;i++) {
                item = document.createElement("li");

                nameEl = document.createElement("span");
                $(nameEl).html(scores[i].name);

                scoreEl = document.createElement("span");
                $(scoreEl).html(scores[i].score);

                $(item).append(nameEl);
                $(item).append(scoreEl);
                $($list).append(item);
        }
    }

    function selectDifficulty(){
        difficultyDisplayed = "normal";
        $("#hiscore .difficulty button[name=easy]")
            .add("#hiscore .difficulty button[name=normal]")
            .add("#hiscore .difficulty button[name=hard]")
            .bind("click", function(e) {
                $(".mode").removeClass('active');
                $(this).addClass('active');
                difficultyDisplayed = $(this).attr("name");
                populateList()
        });
    }


    return {
        run : run
    };

})();
