import vue from '@vitejs/plugin-vue'
import vike from 'vike/plugin'
import { vikePlugins } from '../../../../src/vite/plugin'
import { UserConfig } from 'vite'

const config: UserConfig = {
  plugins: [
    vue(), 
    vike(),
    vikePlugins({ dir: 'plugins/' })
  ]
}

export default config
