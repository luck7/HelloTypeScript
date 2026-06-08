const logAlbumInfo = (
  title: string,
  trackCount: number,
  isReleased: boolean,
  releaseDate?: string,
) => {
  // rest of function body
};


logAlbumInfo("Midnights", 13, true, "2022-10-21");
logAlbumInfo("American Beauty", 10, true);


const logAlbumInfo1 = (
  title: string,
  trackCount: number,
  isReleased: boolean,
  format: string = "CD",
) => {
  // rest of function body
};


const logAlbumInfo2 = (
  title: string,
  trackCount: number,
  isReleased: boolean,
): string => {
  return "Some string";
};


type Album = {
  artist: string;
  title: string;
  year: number;
};

function getAlbumFormats(album: Album, ...formats: string[]) {
  return `${album.title} is available in the following formats: ${formats.join(
    ", ",
  )}`;
}

getAlbumFormats(
  { artist: "Radiohead", title: "OK Computer", year: 1997 },
  "CD",
  "LP",
  "Cassette",
);

const albumFormats = ["CD", "LP", "Cassette"];

getAlbumFormats(
  { artist: "Radiohead", title: "OK Computer", year: 1997 },
  ...albumFormats,
);



type Mapper = (item: string) => number;
const mapOverItems0 = (items: string[], map: Mapper) => {
  return items.map(map);
};

const mapOverItems = (items: string[], map: (item: string) => number) => {
  return items.map(map);
};


const arrayOfNumbers = mapOverItems(["1", "2", "3"], (item) => {
  return parseInt(item) * 100;
});


// Optional parameters
type WithOptional = (index?: number) => number;

// Rest parameters
type WithRest = (...rest: string[]) => number;

// Multiple parameters
type WithMultiple = (first: string, second: string) => number;


const logResult = console.log("Hello!");


type User = {
  id: string;
  name: string;
  email: string;
};
const getUser0 = (id: string): User => {
  // function body
  return {
    id,
    name: "John Doe",
    email: "john.doe@example.com",
  };
};


// const getUser = async (id: string): Promise<User> => {
//   const user = await db.users.get(id);
//   return user;
// };

