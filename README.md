A simple module for SOTK that adds a compendium with macros that allow you to edit token statuses and states without opening the token list.

This module was originally created for my GM to speed up and simplify some things for him, but I found them quite useful, so I'm publishing it for public access.

Everything in this module is vibecoding, as I don't know any JavaScript at all.

Everything was created and tested on the Tsubasa branch. In theory, everything interacts exclusively with the basic system parameters, so theoretically it should work easily in the Vani branch as well, but I can't guarantee it.

A short description of how it works, just in case:

**Triggers:**
**Tremor Burst** - Target a token (for example, by pressing the T key), then use the macro. A window will pop up with a choice of burst type depending on the amount of tremor you want to remove. Click the desired option, and everything happens according to the trigger description: "The target takes Stagger = their Tremor value."

**Blaze** - Select the tokens you want to burn by using Shift and clicking on each token, or by holding LMB and selecting enemies on the battle map. Next, use the macro. A window will appear for entering the burn amount on the target where the Blaze was triggered. Then, as in the trigger description: "When triggering Blaze against a target, Inflict 1+X Burn against all their allies with less Burn than them. Where X is every 5 Burn above. If they have no valid allies, inflict 1 Burn to the target instead." Not applicable for weighted attacks.

**Sinking Deluge** - Target a token (e.g., by pressing the T key), then use the macro. It will display a confirmation window. After confirmation, the trigger will behave as described: "Target takes Stagger = 3x their Sinking, then remove all Sinking. For every 3 Staggers beyond what is needed to reduce Stagger Resist to 0, the target takes 2 damage."

**Revival** - Target a token (e.g., by pressing the T key), then activate the macro. The trigger will behave as described: "Player character revives with 30 HP, half their maximum Stagger Resist, no active EGO passives (except for this, it does not interact with EGO in any way), and 3 Light."

**Useful Features:**
**Status Control** - Select a token and activate the macro. First, it will analyze the existing statuses in the token's list and add them to the list (including custom ones). A window will pop up where you first select the specific status you want to edit from the list above. Then, enter the value in the field manually or using the buttons, and then confirm.

**Sample+** - Currently effectively useless due to status control, but the sample was intended to be the basis for macros, each adding or subtracting an N-number of statuses. For each individual macro, it remains a gimmick.

**Heal and Damage** - Due to poor spelling, they were separated, but are needed to add or subtract HP and Stagger, as some Skill modules actually deal additional damage rather than adding values ​​to the die result.
