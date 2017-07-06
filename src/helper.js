'use strict'

const dotenv = require('./dotenv')
const kms = require('./kms')
const yaml = require('./yaml')

// Reads multiple environment files
const readEnvFiles = (yamlPaths, localDotEnvPath, stage) => {
  var promises = yamlPaths.map(path =>
    yaml.readEnv(path, stage).then(vars => (
      { path, vars }
    ))
  )
  if (localDotEnvPath) {
    let promise = dotenv.read(localDotEnvPath)
      .catch(error => (error.code === 'ENONET') ? {} : error)
      .then(vars => ({ vars, path: localDotEnvPath }))
    promises.push(promise)
  }
  return Promise.all(promises)
}

// Helper to filter env-vars by attribute
const filterEnvVars = (envFiles, attribute) => {
  envFiles.forEach(envFile => {
    envFile.vars = envFile.vars.filter(_ => _.attribute === attribute)
  })
  return envFiles.filter(_ => _.vars.length > 0)
}

// Helper to decrypt multiple environment files
const decryptEnvFiles = (envFiles, config) => {
  envFiles.forEach(envFile => {
}

// Returns all env-files with the env-vars
// The optional attribute allows you to limit the returned env-vars to a single attribute
module.exports.getEnvFiles = (attribute, isLocal, decrypt, config) => {
  return readEnvFiles(config.yamlPaths, isLocal ? config.localDotEnvPath : undefined, config.stage).then(
    envFiles => (attribute) ? filterEnvVars(envFiles, attribute) : envFiles
  )/*.then(
    envFiles => (decrypt) ? decryptEnvFiles(envFiles, config) : envFiles
  )*/
}

// Returns all env-vars
// The optional attribute allows you to limit the returned env-vars to a single attribute
module.exports.getEnvVars = (isLocal, decrypt, config) => {
  let localDotEnvPath = isLocal ? config.localDotEnvPath : undefined
  return readEnvFiles(config.yamlPaths, localDotEnvPath, config.stage).then(envFiles => {
    var envVarsDict = {}
    envFiles.forEach(envFile => {
      envFile.vars.forEach(envVar => {
        envVarsDict[envVar.attribute] = envVar
      })
    })
    return Object.keys(envVarsDict).map(key => envVarsDict[key])
  }).then(envVars => {
    return (decrypt) ? kms.encryptEnvVars(envVars, config) : envVars
  })
}

// Sets the env variable
module.exports.setEnvVar = (attribute, value, encrypt, config) => {
  let filePath = config.yamlPaths[0]
  if (!filePath) {
    return Promise.reject(new Error('No environment files specified in serverless.yml'))
  }
  return Promise.all([
    yaml.read(filePath).catch(error => error.code === 'ENOENT' ? {} : Promise.reject(error)),
    (encrypt) ? kms.encrypt(value, config) : Promise.resolve(value)
  ]).then(args => {
    let doc = Object.assign({}, args[0])
    let value = args[1]
    doc[config.stage] = Object.assign({}, doc[config.stage])
    doc[config.stage][attribute] = (encrypt) ? `${ENCRYPT_PREFIX}${value}` : value
    return yaml.write(filePath, doc)
  })
}
