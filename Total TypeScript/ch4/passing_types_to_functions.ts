const formats0 = new Set(["CD", "DVD"]);

const formats = new Set<string>();

formats.add("Digital");
// formats.add(8);


// const audioElement = document.getElementById("player");
// const audioElement = document.getElementById<HTMLAudioElement>("player");
const audioElement = document.querySelector<HTMLAudioElement>("#player");


const parsedData0 = JSON.parse('{"name": "Alice", "age": 30}');

const parsedData: {
  name: string;
  age: number;
} = JSON.parse('{"name": "Alice", "age": 30}');

