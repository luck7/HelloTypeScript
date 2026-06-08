"use strict";
const audioElement = document.createElement("audio");
audioElement.play();
document.addEventListener("play", () => {
    audioElement.play();
});
const acceptsObj = (obj) => { };
acceptsObj({
    foo: "",
    bar: 0,
    baz: false
});
const a = null;
// a.toString(); // This will throw an error because you cannot call toString on null
const obj = {};
const album = {
    artist: "Television",
    title: "Marquee Moon",
    year: 1977,
};
const logUserJobTitle = (user) => {
    console.log(user.job.title);
};
const exampleUser = {
    job: {
        title: "123",
    },
};
logUserJobTitle(exampleUser);
/**
 * Logs the values of an object to the console.
 *
 * @param obj - The object to log.
 *
 * @example
 * ```ts
 * logValues({ a: 1, b: 2 });
 * // Output:
 * // a: 1
 * // b: 2
 * ```
 */
const logValues = (obj) => {
    for (const key in obj) {
        console.log(`${key}: ${obj[key]}`);
    }
};
/**
 * Adds two numbers together.
 * @example
 * myFunction(1, 2);
 * // Will return 3
 */
const myFunction = (a, b) => {
    return a + b;
};
// const triangle = new Triangle();
const func = () => {
    const randomPercentage = getRandomPercentage();
    console.log(randomPercentage);
};
function getRandomPercentage() {
    return `${(Math.random() * 100).toFixed(2)}%`;
}
