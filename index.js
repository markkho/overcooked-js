import * as Overcooked from "./js/mdp.es6";

if (typeof(window) === 'undefined') {
    module.exports = Overcooked;
}
else {
    window.Overcooked = Overcooked;
}