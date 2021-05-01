import * as ZIP from 'zip-dir'
import * as fs from 'fs'
import * as Path from 'path'
import { Config, dependency } from '@foal/core'
import { Utils } from '../utils'
import { Convert } from './convert.service'
const FOLDER_ZIP = Config.get('settings.disk.zip.path')

export class Zip {
    @dependency
    utils: Utils

    @dependency
    convertService: Convert

    zipDownloadAll(listFile, session, outputName) {
        const zipPath = Path.join(FOLDER_ZIP, session)
        const isExists = fs.existsSync(zipPath)
        if (!isExists) fs.mkdirSync(zipPath)
        const orders = listFile.split(',')
        for (const fid of orders) {
            const folder = this.utils.getFolderBySessionAndFid(session, fid)
            const convertName = this.convertService.getConvertFile(session, fid)
            const fConvert = this.utils.getConvertFile(folder, convertName)
            fs.copyFileSync(fConvert, Path.join(zipPath, convertName))
        }
        const outputFile = Path.join(zipPath, outputName)
        return new Promise((resolve, reject) => {
            ZIP(zipPath, outputFile, (err, result) => {
                if (err) return reject(err)
                resolve(result)
            })
        })
    }
}
