import Vue from 'vue'
import { AbsAudioPlayer } from './AbsAudioPlayer'
import { AbsDownloader } from './AbsDownloader'
import { AbsFileSystem } from './AbsFileSystem'
import { AbsDatabase } from './AbsDatabase'
import { AbsLogger } from './AbsLogger'

Vue.prototype.$platform = 'webos'
document.documentElement.dataset.platform = 'webos'

export { AbsAudioPlayer, AbsDownloader, AbsFileSystem, AbsLogger, AbsDatabase }