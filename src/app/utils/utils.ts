import { Config } from '@foal/core'
import * as Path from 'path'
import * as fs from 'fs'

const FOLDER_CONVERT = Config.get('settings.disk.convert.path')
const FOLDER_UPLOAD = Config.get('settings.disk.upload.path')
const FOLDER_THUMB = Config.get('settings.disk.graphic.path')

export class Utils {
    getFolderBySessionAndFid(session: string, fid: string): string {
        return `${session}_${fid}`
    }

    getUploadFile(folder: string, file: string): string {
        return Path.join(FOLDER_UPLOAD, folder, file)
    }

    getConvertFile(folder: string, file: string): string {
        return Path.join(FOLDER_CONVERT, folder, file)
    }

    getThumbFile(folder: string, file: string): string {
        return Path.join(FOLDER_THUMB, folder, file)
    }

    getFirstFileOnFolder(originFolder: string, folderName: string): string {
        const fPath = Path.join(originFolder, folderName)
        const isExists = fs.existsSync(fPath)
        if (!isExists) return ''

        const files = fs.readdirSync(fPath)
        const first = files.pop()
        if (!first) return ''
        return first
    }

    createFolder(folderName: string): void {
        const isExist = fs.existsSync(folderName)
        if (!isExist) fs.mkdirSync(folderName)
    }

    getOutputFileName(inputPath: string, typeOutput: string): string {
        const splits = inputPath.split('.')
        splits[splits.length - 1] = typeOutput
        const outputName = splits.join('.')
        return outputName
    }
}
