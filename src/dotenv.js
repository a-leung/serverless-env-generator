'use strict'

const dotenv = require('dotenv')
const fs = require('fs-extra')

module.exports.read = (filePath) => {
  return fs.readFile(filePath, 'utf-8').then(fileBody => {
    let dict = dotenv.parse(fileBody)
    return Object.keys(dict).map(attribute => ({
      attribute: attribute,
      value: dict[attribute],
      encrypted: false
    }))
  })
}

module.exports.write = (filePath, envVars) => {
  var lines = envVars.map(envVar => `${envVar.attribute}=${envVar.value}`)
  return fs.writeFile(filePath, lines.join('\n'))
}
