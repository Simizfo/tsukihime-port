# Port of the original Tsukihime story to React

Find how to start the project on your computer in [README.md](https://github.com/requinDr/tsukihime-port/blob/main/README.md)  
We welcome all contributions

## Guidelines
- The GUI should be updated to look and feel more modern (take the remake as a general example).
- The game should be fully responsive.
- Everything should be as simple and easy to use for the average player.
- The main browsers must be supported (Chromium-based browsers, Firefox, Safari) within the last 2 to 3 years updates.
- Every action done with a mouse should have an equivalent for touch screens.
- Actions shortcut can be changed to reflect common VNs shortcuts.
- The preprocess of the original script should be limited to what would apply to a maximum of Ponscript VN.
- The original game ressources shoudn't be touched (name, edit, format) as much as possible. Sprites are unfortunately an exception since they have no transparency.
- Exception to the rule above: the scripts can be modified to fix typos, grammar, etc.
- Remake assets are not to be used.

## Code
- indent is 2 spaces for `.tsx` files.
- layers are toggled using context. They are moved from back to front using CSS property `z-index`.
