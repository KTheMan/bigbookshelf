import Vue from 'vue'
import { AbsAudioPlayer } from './AbsAudioPlayer'
import { AbsDownloader } from './AbsDownloader'
import { AbsFileSystem } from './AbsFileSystem'
import { AbsDatabase } from './AbsDatabase'
import { AbsLogger } from './AbsLogger'

Vue.prototype.$platform = 'webos'
document.documentElement.dataset.platform = 'webos'

const savedZoom = localStorage.getItem('webos-zoom')
if (savedZoom) document.documentElement.style.fontSize = (parseFloat(savedZoom) * 20) + 'px'

export { AbsAudioPlayer, AbsDownloader, AbsFileSystem, AbsLogger, AbsDatabase }