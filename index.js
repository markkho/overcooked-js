import * as OvercookedMDP from "./js/mdp.es6";
import * as OvercookedGame from "./js/task.es6"

if (typeof(window) === 'undefined') {
    module.exports = {OvercookedMDP, OvercookedGame};
}
else {
    window.Overcooked = {OvercookedMDP, OvercookedGame};
}