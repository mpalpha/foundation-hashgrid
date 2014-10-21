##foundation-hashgrid

a tool that inserts a layout grid in web pages using Zurbs Foundation 5 framework, allows you to hold it in place, and toggle between displaying it in the foreground or background.

###Usage

####The basic #grid setup looks like this
    $(document).hashgrid();
####But there are a whole bunch of additional options you can set
    $(document).hashgrid({
       id: 'mygrid',            // set a custom id for the grid container
       modifierKey: 'alt',      // optional 'ctrl', 'alt' or 'shift'
       showGridKey: 's',        // key to show the grid
       holdGridKey: 'enter',    // key to hold the grid in place
       foregroundKey: 'f',      // key to toggle foreground/background
       jumpGridsKey: 'd',       // key to cycle through the grid classes
       numberOfGrids: 2,        // number of grid classes used
       classPrefix: 'myclass',  // prefix for the grid classes
       cookiePrefix: 'mygrid'   // prefix for the cookie name
    });
