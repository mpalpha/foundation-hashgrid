/**
 * custom hashgrid for foundation inspired by http://github.com/dotjay/hashgrid
 * Usage
 *
 * // The basic #grid setup looks like this
 * $(document).hashgrid();
 *
 * // But there are a whole bunch of additional options you can set
 * $(document).hashgrid({
 *     id: 'mygrid',            // set a custom id for the grid container
 *     modifierKey: 'alt',      // optional 'ctrl', 'alt' or 'shift'
 *     showGridKey: 's',        // key to show the grid
 *     holdGridKey: 'enter',    // key to hold the grid in place
 *     foregroundKey: 'f',      // key to toggle foreground/background
 *     jumpGridsKey: 'd',       // key to cycle through the grid classes
 *     numberOfGrids: 2,        // number of grid classes used
 *     classPrefix: 'myclass',  // prefix for the grid classes
 *     cookiePrefix: 'mygrid'   // prefix for the cookie name
 * });
 */
if (typeof jQuery == "undefined") {
    alert("Hashgrid: jQuery not loaded. Make sure it's linked to your pages.");
}

(function($, window, document) {
    'use strict';
    /**
     * hashgrid overlay
     * @constructor
     */

    $.fn.hashgrid = function(options) {
        //set up default options
        var defaults = {
            id: 'grid', // id for the grid container
            modifierKey: null, // optional 'ctrl', 'alt' or 'shift'
            showGridKey: 'g', // key to show the grid
            holdGridKey: 'h', // key to hold the grid in place
            foregroundKey: 'f', // key to toggle foreground/background
            jumpGridsKey: 'j', // key to cycle through the grid classes
            numberOfGrids: 1, // number of grid classes used
            classPrefix: 'grid-', // prefix for the grid classes
            cookiePrefix: 'hashgrid' // prefix for the cookie name
        };
        var options = $.extend({}, defaults, options),
            alreadyDown,
            classNumber = 1,
            gridLines,
            i,
            line,
            lineHeight,
            numGridLines,
            overlay,
            overlayCookie,
            overlayEl,
            overlayOn = false,
            overlayVert,
            overlayZState = 'B',
            overlayZBackground = -1,
            overlayZForeground = 9999,
            pageHeight,
            setKey,
            state,
            sticky = false,
            top,
            gridLinesHoriz = '',
            gridLinesVert = '',
            numGridColumns = 0;

        // Remove any conflicting overlay
        $('#' + options.id).remove();

        // Override the default overlay height with the actual page height
        pageHeight = parseFloat($(document).height());

        // Create overlay, hidden before adding to DOM
        overlay = $('<div>', {
                id: options.id
            })
            .css({
                width: "100%",
                display: 'none',
                pointerEvents: 'none'
            })
            .prependTo('body')
            .height(pageHeight);

        // Unless a custom z-index is set, ensure the overlay will be behind everything
        if (overlay.css('z-index') == 'auto') overlay.css('z-index', overlayZBackground);

        // Build the Vertical grid lines based on number of styled columns
        function buildGridVert() {
            var i = 0,
                eW = 0,
                ceW = 1,
                colW = function(i) {
                    try {
                        var el = $('<div>', {
                                class: 'small-' + i + ' columns',
                                style: 'display:none'
                            })
                            .prependTo('body');
                        var isNew = (el.outerWidth() != ceW);
                        ceW = el.outerWidth();
                        el.remove();
                        return isNew;
                    } catch (e) {
                        return 0;
                    }
                };
            while (colW(i + 1)) {
                gridLinesVert += '<div class="small-1 columns vert"><span>&nbsp;</span></div>';
                i++;
            }
            numGridColumns = i;
        }
        buildGridVert();

        // Calculate the number of grid lines needed
        function getLineHeight() {
            try {
                var el = $('<p>', {
                        class: 'small-1 columns lineHightTest',
                        style: 'display:none;height:1em;font-size:1em;',
                        text: 'M'
                    })
                    .prependTo('body');
                var lH = el.height();
                el.remove();
                return lH;
            } catch (e) {
                return 0;
            }
        };
        lineHeight = getLineHeight();

        // Set grid lines
        numGridLines = Math.floor(pageHeight / lineHeight);

        // Build the Horizontal grid lines
        function buildGridHoriz() {
            for (i = numGridLines; i > 0; i--) {
                gridLinesHoriz += '<div class="small-' + numGridColumns + ' columns horiz"></div>';
            }
        }
        buildGridHoriz();

        // Add the horizontal grid to the dom
        line = $('<div>', {
                class: 'horiz-container'
            })
            .css({
                'position': 'absolute'
            })
            .appendTo(overlay)
            .append(gridLinesHoriz);

        // Add the vertical grid to the dom
        overlayVert = $('<div>', {
                class: 'vert-container row'
            })
            .appendTo(overlay)
            .css({
                top: 0
            })
            .append(gridLinesVert)
            .children().children('span')
            .height(pageHeight)
            .css({
                display: 'inline-block',
                width: '100%'
            });

        // Check for saved state
        overlayCookie = readCookie(options.cookiePrefix + options.id);
        if (typeof overlayCookie == 'string') {
            state = overlayCookie.split('-');
            state[2] = Number(state[2]);
            if ((typeof state[2] == 'number') && !isNaN(state[2])) {
                classNumber = state[2].toFixed(0);
                overlay.addClass(options.classPrefix + classNumber);
            }
            if (state[1] == 'F') {
                overlayZState = 'F';
                overlay.css('z-index', overlayZForeground);
            }
            if (state[0] == '1') {
                overlayOn = true;
                sticky = true;
                showOverlay();
            }
        } else {
            overlay.addClass(options.classPrefix + classNumber);
        }

        // bind Keyboard controls
        $(document)
            .on('keydown', keydownHandler)
            .on('keyup', keyupHandler);

        /**
         * Helpers
         */

        function getModifier(e) {
            if (options.modifierKey === null) return true; // Bypass by default
            var m = true;
            switch (options.modifierKey) {
                case 'ctrl':
                    m = (e.ctrlKey ? e.ctrlKey : false);
                    break;

                case 'alt':
                    m = (e.altKey ? e.altKey : false);
                    break;

                case 'shift':
                    m = (e.shiftKey ? e.shiftKey : false);
                    break;
            }
            return m;
        }

        function getKey(e) {
            var k = false,
                c = (e.keyCode ? e.keyCode : e.which);
            // Handle keywords
            if (c == 13) k = 'enter';
            // Handle letters
            else k = String.fromCharCode(c).toLowerCase();
            return k;
        }

        function saveState() {
            createCookie(options.cookiePrefix + options.id, (sticky ? '1' : '0') + '-' + overlayZState + '-' + classNumber, 1);
        }

        function showOverlay() {
            overlay.show();
            overlayVert
            // hide any vertical blocks that aren't at the top of the viewport
                .children('.vert').each(function() {
                var vCol = $(this);
                vCol.css('display', 'inline-block');
                if (vCol.offset().top > vCol.parent().offset().top) {
                    vCol.hide();
                }
            });
        }

        /**
         * Event handlers
         */

        alreadyDown = {};

        function keydownHandler(e) {
            var k = getKey(e) || null,
                m = getModifier(e) || null,
                source = e.target.tagName.toLowerCase();

            if ((source == 'input') || (source == 'textarea') || (source == 'select')) {
                return true;
            }

            if (!m || !k || alreadyDown[k]) return true;

            alreadyDown[k] = true;

            switch (k) {
                case options.showGridKey:
                    if (!overlayOn) {
                        showOverlay();
                        overlayOn = true;
                    } else if (sticky) {
                        overlay.hide();
                        overlayOn = false;
                        sticky = false;
                        saveState();
                    }
                    break;
                case options.holdGridKey:
                    if (overlayOn && !sticky) {
                        // Turn sticky overlay on
                        sticky = true;
                        saveState();
                    }
                    break;
                case options.foregroundKey:
                    if (overlayOn) {
                        // Toggle sticky overlay z-index
                        if (overlay.css('z-index') == overlayZForeground) {
                            overlay.css('z-index', overlayZBackground);
                            overlayZState = 'B';
                        } else {
                            overlay.css('z-index', overlayZForeground);
                            overlayZState = 'F';
                        }
                        saveState();
                    }
                    break;
                case options.jumpGridsKey:
                    if (overlayOn && (options.numberOfGrids > 1)) {
                        // Cycle through the available grids
                        overlay.removeClass(options.classPrefix + classNumber);
                        classNumber++;
                        if (classNumber > options.numberOfGrids) classNumber = 1;
                        overlay.addClass(options.classPrefix + classNumber);
                        showOverlay();
                        if (/webkit/.test(navigator.userAgent.toLowerCase())) {
                            forceRepaint();
                        }
                        saveState();
                    }
                    break;
            }

            return true;
        }

        function keyupHandler(e) {
            var k = getKey(e) || null,
                m = getModifier(e);

            if (!m) return true;

            alreadyDown[k] = false;

            if (k && (k == options.showGridKey) && !sticky) overlay.hide(0, function() {
                overlayOn = false;
            });

            return true;
        }

        /**
         * Cookie functions
         *
         * By Peter-Paul Koch:
         * http://www.quirksmode.org/js/cookies.html
         */
        function createCookie(name, value, days) {
            var date,
                expires = "";

            if (days) {
                date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            }

            document.cookie = name + "=" + value + expires + "; path=/";
        }

        function readCookie(name) {
            var c,
                ca = document.cookie.split(';'),
                i = 0,
                len = ca.length,
                nameEQ = name + "=";

            for (; i < len; i++) {
                c = ca[i];

                while (c.charAt(0) == ' ') c = c.substring(1, c.length);

                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        function eraseCookie(name) {
            createCookie(name, "", -1);
        }

        /**
         * Forces a repaint (because WebKit has issues)
         * http://www.sitepoint.com/forums/showthread.php?p=4538763
         * http://www.phpied.com/the-new-game-show-will-it-reflow/
         */
        function forceRepaint() {
            var ss = document.styleSheets[0];
            try {
                ss.addRule('.xxxxxx', 'position: relative');
                ss.removeRule(ss.rules.length - 1);
            } catch (e) {}
        }

        return {};
    };

})(jQuery, window, document);
