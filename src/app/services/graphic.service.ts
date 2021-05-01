import { Config, dependency } from '@foal/core'
import * as GM from 'gm'
import { Utils } from '../utils'
import { Cache } from './cache.service'

const WIDTH = Config.get('graphic.width')
const HEIGHT = Config.get('graphic.height')
const QUALITY = Config.get('graphic.quality')
const FOLDER_THUMB = Config.get('settings.disk.graphic.path')
const TYPE = {
    PDF: 'pdf',
    PNG: 'png'
}

export class Graphic {
    @dependency
    utils: Utils

    @dependency
    cache: Cache

    async genThumb(folder: string, convertFile: string): Promise<string> {
        const fConvert = this.utils.getConvertFile(folder, convertFile)
        const thumbName = this.utils.getOutputFileName(convertFile, TYPE.PNG)
        const fThumb = this.utils.getThumbFile(folder, thumbName)

        return new Promise((resolve, reject) => {
            GM(fConvert).thumb(WIDTH, HEIGHT, fThumb, QUALITY, err => {
                if (err) return reject(err)
                this.setThumb(folder, fThumb)
                resolve(fThumb)
            })
        })
    }

    setThumb(folder: string, fileName: string): void {
        this.cache.set(`${folder}:thumb`, fileName)
    }

    getThumb(sessionID: string, fileID: string): string {
        const folder = this.utils.getFolderBySessionAndFid(sessionID, fileID)
        const fThumb = this.cache.get(`${folder}:thumb`)
        if (!fThumb) {
            const thumbName = this.utils.getFirstFileOnFolder(FOLDER_THUMB, folder)
            return thumbName ? this.utils.getThumbFile(folder, thumbName) : ''
        }
        return fThumb.replace('public/', '')
    }
}
