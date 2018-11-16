import * as OvercookedMDP from "./js/mdp.es6";

if (typeof(window) === 'undefined') {
    module.exports = {OvercookedMDP};
}
else {
    window.Overcooked = {OvercookedMDP};
}