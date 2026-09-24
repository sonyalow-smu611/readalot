import { createRouter, createWebHistory } from "vue-router";

import BookDetailsView from "../views/BookDetailsView.vue";
import DiscoverBooksView from "../views/DiscoverBooksView.vue";
import DiscoverPeopleView from "../views/DiscoverPeopleView.vue";
import MoodView from "../views/MoodView.vue";
import MyRoomView from "../views/MyRoomView.vue";
import ReaderRoomView from "../views/ReaderRoomView.vue";
import ScanBookView from "../views/ScanBookView.vue";

const routes = [
  { path: "/", name: "room", component: MyRoomView },
  { path: "/mood", name: "mood", component: MoodView },
  { path: "/discover", name: "discover-books", component: DiscoverBooksView },
  { path: "/people", name: "discover-people", component: DiscoverPeopleView },
  { path: "/people/:id", name: "reader-room", component: ReaderRoomView },
  { path: "/scan", name: "scan-book", component: ScanBookView },
  { path: "/books/:id", name: "book-details", component: BookDetailsView }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
