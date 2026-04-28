import type { PageContext } from "vike/types";

export default async (pageContext: PageContext) => {
  const { app } = pageContext;
  if (!app) {
    throw new Error(
      "[vike-nuxt-ui] No Vue app instance found in pageContext. " +
      "Make sure vike-vue is installed and configured correctly.",
    );
  }






};