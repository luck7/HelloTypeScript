"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logAlbumInfo = (title, trackCount, isReleased, releaseDate) => {
    // rest of function body
};
logAlbumInfo("Midnights", 13, true, "2022-10-21");
logAlbumInfo("American Beauty", 10, true);
const logAlbumInfo1 = (title, trackCount, isReleased, format = "CD") => {
    // rest of function body
};
const logAlbumInfo2 = (title, trackCount, isReleased) => {
    return "Some string";
};
function getAlbumFormats(album, ...formats) {
    return `${album.title} is available in the following formats: ${formats.join(", ")}`;
}
getAlbumFormats({ artist: "Radiohead", title: "OK Computer", year: 1997 }, "CD", "LP", "Cassette");
const albumFormats = ["CD", "LP", "Cassette"];
getAlbumFormats({ artist: "Radiohead", title: "OK Computer", year: 1997 }, ...albumFormats);
const mapOverItems0 = (items, map) => {
    return items.map(map);
};
const mapOverItems = (items, map) => {
    return items.map(map);
};
const arrayOfNumbers = mapOverItems(["1", "2", "3"], (item) => {
    return parseInt(item) * 100;
});
const logResult = console.log("Hello!");
const getUser0 = (id) => {
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
//# sourceMappingURL=typing_functions.js.map