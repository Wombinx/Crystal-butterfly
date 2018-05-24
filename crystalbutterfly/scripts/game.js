alchemy.game = (function() {

    /* hide the active screen (if any) and show the screen
     * with the specified id */
    function showScreen(screenId) {
        var $activeScreen = $("#game .screen.active"),
            $screen = $("#" + screenId);
        if ($activeScreen) {
            $activeScreen.removeClass("active");
        }

        // extract screen parameters from arguments
        var args = Array.prototype.slice.call(arguments, 1);
        // run the screen module
        alchemy.screens[screenId].run.apply(
            alchemy.screens[screenId], args
        );

        // display the screen html
        $screen.addClass("active");
    }

    // create background pattern
    function createBackground() {
        if (!Modernizr.canvas) return;

        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            $background = $("#game .background"),
            gradient,
            i;

        canvas.width = $background.width();
        canvas.height = $background.height();

        ctx.scale($background.width(), $background.height());

        gradient = ctx.createRadialGradient(
            0.25, 0.15, 0.5,
            0.25, 0.15, 1
        );
        gradient.addColorStop(0, "rgb(45,123,149)");
        gradient.addColorStop(1, "rgb(27,62,79)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 1);

        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 0.008;
        ctx.beginPath();
        for (i=0;i<2;i+=0.020) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i - 1, 1);
        }
        ctx.stroke();
        $background.append(canvas);
    }

    function setup() {
        // disable native touchmove behavior to
        // prevent overscroll
        $(document).bind("touchmove", function(event) {
            event.preventDefault();
        });
        // hide the address bar on Android devices
        if (/Android/.test(navigator.userAgent)) {
            $("html").css('height', '200%');
            setTimeout(function() {
                window.scrollTo(0, 1);
            }, 0);
        }

        createBackground();
    }

    // expose public methods
    return {
        setup : setup,
        showScreen : showScreen
    };
})();
