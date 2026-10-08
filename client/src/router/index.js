import { createRouter, createWebHistory } from "vue-router";

import BookDetailsView from "../views/BookDetailsView.vue";
import DiscoverBooksView from "../views/DiscoverBooksView.vue";
import DiscoverPeopleView from "../views/DiscoverPeopleView.vue";
import GenreShelfView from "../views/GenreShelfView.vue";
import MyRoomView from "../views/MyRoomView.vue";
import ProfileView from "../views/ProfileView.vue";
import ReaderRoomView from "../views/ReaderRoomView.vue";
import ReaderShelfView from "../views/ReaderShelfView.vue";
import ScanBookView from "../views/ScanBookView.vue";
import SearchView from "../views/SearchView.vue";

const routes = [
  { path: "/", name: "room", component: MyRoomView },
  { path: "/discover", name: "discover-books", component: DiscoverBooksView },
  { path: "/discover/:genre", name: "genre-shelf", component: GenreShelfView },
  { path: "/search", name: "search", component: SearchView },
  { path: "/people", name: "discover-people", component: DiscoverPeopleView },
  { path: "/people/:id", name: "reader-room", component: ReaderRoomView },
  { path: "/people/:id/shelf", name: "reader-shelf", component: ReaderShelfView },
  { path: "/scan", name: "scan-book", component: ScanBookView },
  { path: "/profile", name: "profile", component: ProfileView },
  { path: "/books/:id", name: "book-details", component: BookDetailsView }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
