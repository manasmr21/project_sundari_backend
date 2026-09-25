import { Hono } from "hono";
import { Bindings } from "../index";
import siteDataRoutes from "../models/siteData/siteData.routes";
import socialsRoutes from "../models/socials/socials.routes";
import menuRoutes from "../models/menus/menus.routes";
import usersRoutes from "../models/users/users.routes";
import rolesRoutes from "../models/roles/roles.routes";

const routes = new Hono<{ Bindings: Bindings }>();

routes.route("/site-data", siteDataRoutes);
routes.route("/socials", socialsRoutes);
routes.route("/menus", menuRoutes);
routes.route("/users", usersRoutes);
routes.route("/roles", rolesRoutes);

export default routes;