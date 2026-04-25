import type { NuxtUIOptions } from "@nuxt/ui/vite";
import ui from "@nuxt/ui/vite";
import type { Plugin } from "vite";

export type VikeNuxtUIOptions = Omit<NuxtUIOptions, "router" | "inertia">;

export default (options: VikeNuxtUIOptions): Plugin[] => {
  return [
    ...(ui({ ...options, router: false }) as Plugin[]),
    {
      name: "vike-nuxt-ui:ssr-fix",
      config() {
        return {
          ssr: {
            noExternal: ["@nipakke/vike-nuxt-ui", "@nuxt/ui"],
          },
        };
      },
    },
  ];
};