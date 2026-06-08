"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const talkToAnimal0 = (animal) => {
    // rest of function body
};
const talkToAnimal = (animal) => {
    // rest of function body
};
const concatName = (user) => {
    return `${user.first} ${user.last}`;
};
it("should return the full name", () => {
    const result = concatName({
        first: "John",
        last: "Doe",
    });
    // type test = Expect<Equal<typeof result, string>>;
    expect(result).toEqual("John Doe");
});
//# sourceMappingURL=object_literal_types.js.map