'use strict'

const AWS = require('aws-sdk')

let kmsCache = {}

const getKms = module.exports._getKms = (config) => {
  var kms = kmsCache[config.kmsKeyId]
  if (!kms) {
    let credentials = (config.profile)
      ? new AWS.SharedIniFileCredentials({ profile: config.profile })
      : undefined
    kms = kmsCache[config.kmsKeyId] = new AWS.KMS({
      apiVersion: '2014-11-01',
      region: config.region,
      credentials: credentials,
      params: {
        KeyId: config.kmsKeyId
      }
    })
  }
  return kms
}

// Wrapper for kms.decrypt
const decrypt = (encryptedText, config) => {
  return new Promise((resolve, reject) => {
    let blob = Buffer.from(encryptedText, 'base64')
    getKms(config).decrypt({ CiphertextBlob: blob }, (error, data) => {
      if (error) {
        reject(error)
      } else {
        let text = data.Plaintext.toString('utf-8')
        resolve(text)
      }
    })
  })
}

// Wrapper for kms.encrypt
const encrypt = (text, config) => {
  return new Promise((resolve, reject) => {
    getKms(config).encrypt({ Plaintext: text }, (error, data) => {
      if (error) {
        reject(error)
      } else {
        let encryptedText = data.CiphertextBlob.toString('base64')
        resolve(encryptedText)
      }
    })
  })
}

// Helper to decrypt environment variables
module.exports.decryptEnvVars = (envVars, config) => {
  return Promise.all(envVars.map(envVar =>
    envVar.encrypted
      ? decrypt(envVar.value, config).then(value => Object.assign({}, envVar, { value }))
      : Promise.resolve(envVar)
  ))
}

// Helper to encrypt environment variables
module.exports.encryptEnvVars = (envVars, config) => {
  return Promise.all(envVars.map(envVar =>
    envVar.encrypted
      ? decrypt(envVar.value, config).then(value => Object.assign({}, envVar, { value }))
      : Promise.resolve(envVar)
  ))
}
