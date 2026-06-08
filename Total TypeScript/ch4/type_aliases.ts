type Animal = {
  name: string;
  type: string;
  age?: number;
};

let pet: Animal = {
  name: "Karma",
  type: "cat",
};

const getAnimalDescription = (animal: Animal) => {
  // implementation
};

const desc = getAnimalDescription(pet);

type Id = string | number;

