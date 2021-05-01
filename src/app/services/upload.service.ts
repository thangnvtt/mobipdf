import { Config, dependency } from '@foal/core'
import * as fs from 'fs'
import * as path from 'path'
import { Utils } from '../utils'
import { Cache } from './cache.service'

const FOLDER_UPLOAD = Config.get('settings.disk.upload.path')

export class Upload {
    @dependency
    cacheService: Cache

    @dependency
    utils: Utils

    upload(folderName: string, fileName: string, buffer: Buffer): void {
        const fPath = path.join(FOLDER_UPLOAD, folderName)
        this.utils.createFolder(fPath)
        const file = path.join(fPath, fileName)
        fs.writeFileSync(file, buffer)
        this.cacheService.set(folderName, fileName)
    }


    getFileByFolder(folder: string): string {
        let fileName = this.cacheService.get(folder)
        if (!fileName) {
            fileName = this.getFirstFileOnFolder(folder)
        }
        return fileName
    }

    private getFirstFileOnFolder(folderName: string): string {
        const fPath = path.join(FOLDER_UPLOAD, folderName)
        const files = fs.readdirSync(fPath)
        return String(files.pop())
    }
}
