import { Hono } from "hono";
import { Bindings } from "../index";
import siteDataRoutes from "../models/siteData/siteData.routes";
import socialsRoutes from "../models/socials/socials.routes";
import menuRoutes from "../models/menus/menus.routes";
import usersRoutes from "../models/users/users.routes";
import rolesRoutes from "../models/roles/roles.routes";
import categoriesRoutes from "../models/categories/categories.routes";
import subCategoriesRoutes from "../models/subCategories/subCategories.routes";
import brandsRoutes from "../models/brands/brands.routes";
import productsRoutes from "../models/products/products.routes";
import discountsRoutes from "../models/discounts/discounts.routes";
import addressRoutes from "../models/addresses/address.routes";
import cartRoutes from "../models/cart/cart.routes";
import wishlistRoutes from "../models/wishlist/wishlist.routes";
import ordersRoutes from "../models/orders/orders.routes";

const routes = new Hono<{ Bindings: Bindings }>();

routes.route("/site-data", siteDataRoutes);
routes.route("/socials", socialsRoutes);
routes.route("/menus", menuRoutes);
routes.route("/users", usersRoutes);
routes.route("/roles", rolesRoutes);
routes.route("/categories", categoriesRoutes);
routes.route("/sub-categories", subCategoriesRoutes);
routes.route("/brands", brandsRoutes);
routes.route("/products", productsRoutes);
routes.route("/discounts", discountsRoutes);
routes.route("/addresses", addressRoutes);
routes.route("/cart", cartRoutes);
routes.route("/wishlist", wishlistRoutes);
routes.route("/orders", ordersRoutes);

export default routes;