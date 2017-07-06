'use strict'

const fs = require('fs-extra')
const yaml = require('js-yaml')

const ENCRYPT_PREFIX = 'encrypted:'

// Returns a promise to read YAML files
const read = module.exports.read = (filePath) => {
  return fs.readFile(filePath, 'utf-8').then(fileBody => {
    let doc = yaml.safeLoad(fileBody)
    if (!doc) {
      console.warn(`YAML-file ${filePath} seems to be empty or invalid`)
    }
    return doc || {}
  })
}

// Reads an environment YAML files and returns the env-vars for the specified stage
module.exports.readEnv = (filePath, stage) => {
  return read(filePath).then(doc => {
    return Object.keys(doc[stage] || {}).map(attribute => {
      var value = doc[stage][attribute]
      let encrypted = (typeof value === 'string' && value.indexOf(ENCRYPT_PREFIX) === 0)
      if (encrypted) value = value.substr(ENCRYPT_PREFIX.length)
      return { attribute, value, encrypted }
    })
  })
}

// Returns a promise to write YAML files
module.exports.write = (filePath, doc) => {
  let fileBody = yaml.safeDump(doc)
  return fs.writeFile(filePath, fileBody)
}
