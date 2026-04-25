import ui from "@nuxt/ui/vue-plugin";
import type { PageContext } from "vike/types";

export default async (pageContext: PageContext) => {
  const { app } = pageContext;
  if (!app) return;

  app.use(ui);
};