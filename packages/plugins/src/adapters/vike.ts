import { defineUniversalPlugin } from '../core/definePlugin'
import type { PageContext } from 'vike/types'
import type { PluginFn, PluginStore } from '../core/types'
import type { CodecRegistry } from '../core/serializer'
import { getPageContext } from 'vike/getPageContext'
//needs to restart vike after changing this
export const VikePluginStoreKey = "__plugin_store_key__changeme_Before_release"

declare global {
  namespace Vike {
    interface PageContext {
      [VikePluginStoreKey]: PluginStore
    }
    interface PageContextServer {
      [VikePluginStoreKey]: PluginStore
    }
    interface PageContextClient {
      [VikePluginStoreKey]: PluginStore
    }
  }
}

export const defineVikeShared = <A>(
  key: string,
  def: PluginFn<A>,
  opts?: { serializers?: CodecRegistry[] }
) => {
  const plugin = defineUniversalPlugin(key, {
    fn: def,
    serializers: opts?.serializers,
  });

  const storeKey = VikePluginStoreKey
  // const storeKey = `__vikeShared_${key}`;

  function getStore(): PluginStore {
    const pageContext = getPageContext({ asyncHook: true });

    const store = pageContext?.[storeKey];
    if (!store) {
      throw new Error(
        `[defineVikeShared "${key}"] Store not found. Did you call hook() for this page?`
      );
    }
    return store;
  }

  const hook = async (pageContext: PageContext): Promise<void> => {
    /* if (pageContext[storeKey]) {
      throw new Error(`[defineVikeShared "${key}"] hook() called twice for the same page.`);
    } */

    console.log("HIHI", pageContext.isClientSide)

    const store = pageContext.isClientSide ? getStore() : plugin.createStore()

    pageContext[storeKey] = store;
    await plugin.run(store, { isServer: !pageContext.isClientSide });
  };

  const use = (): A => {
    return plugin.get(getStore());
  };

  return { hook, use };
};


// export const defineVikeShared = <A>(key: string, def: PluginFn<A>, opts?: {
//   serializers?: CodecRegistry[]
// }) => {
//   const plugin = defineUniversalPlugin(key, {
//     fn: def,
//     serializers: opts?.serializers
//   })

//   console.log("RUNNING THIS SHIT")

//   const storeMap = new WeakMap<PageContext, PluginStore>();


//   function getStore(pageContext: PageContext): PluginStore {
//     const store = storeMap.get(pageContext);
//     if (!store) {
//       throw new Error(
//         `[defineVikeShared "${key}"] Store not initialized for this page context. ` +
//         `Did you call hook(pageContext) before use()?`
//       );
//     }
//     return store;
//   }

//   function initStore(pageContext: PageContext): PluginStore {
//     if (storeMap.has(pageContext)) {
//       throw new Error(
//         `[defineVikeShared "${key}"] Store already initialized for this page context. ` +
//         `hook() must only be called once per request.`
//       );
//     }
//     const store = plugin.createStore();
//     storeMap.set(pageContext, store);
//     return store;
//   }

//   let savedPageContext: PageContext | null = null;
//   const getPageContext = () => {
//     //TODO: check if exists, throw if not
//     return savedPageContext!
//   }

//   function setPageContext(ctx: PageContext) {
//     //TODO: Check if already set
//     savedPageContext = ctx
//     injectStore()
//   }

//   const hook = async (pageCtx: PageContext) => {
//     setPageContext(pageCtx)
//     const store = getStore()
//     console.log("mi", store)
//     await plugin.run(store, { isServer: !pageCtx.isClientSide })
//   }

//   const use = (): A => {
//     const store = getStore()
//     return plugin.get(store)
//   }

//   return {
//     use,
//     hook
//   }
// }
