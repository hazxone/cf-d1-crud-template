import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test-page", "routes/test-page.tsx"),
  route("todo", "routes/todo.tsx"),
] satisfies RouteConfig;
