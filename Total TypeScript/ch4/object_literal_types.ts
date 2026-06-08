const talkToAnimal0 = (animal: { name: string; type: string; age: number }) => {
    // rest of function body
};



const talkToAnimal = (animal: { name: string; type: string; age?: number }) => {
    // rest of function body
};



const concatName = (user: { first: string; last?: string }) => {
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
