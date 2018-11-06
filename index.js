const glob = require('glob')
const fs = require('fs')
const path = require('path')
const gql = require('graphql-tag').default
const express = require('express')
const debug = require('debug')

const debugError = debug('gqlend:error')
const debugInfo = debug('gqlend:info')

const defaultGqlPath = '/graphql'
const defaultPattern = '**/*'
const defaultOptions = {
  nodir: true,
  cwd: path.resolve(process.cwd(), 'src/endpoints')
}

const safeJSON = str => {
  if (!str) {
    return
  }

  try {
    return JSON.parse(str)
  } catch (E) {
  }
}

const createRouterByEntries = (app, gqlpath, entries) => {
  const router = new express.Router()

  router.use((req, res, next) => {
    const query = entries[req.path]
    if (query) {
      if (req.method === 'POST' && req.body) {
        req.body.query = query
      } else {
        req.method = 'POST'
        req.body = {
          query,
          variables: safeJSON(req.query['_JSON']) || req.query
        }
      }
      req.url = req.originalUrl = gqlpath
      return app.handle(req, res, next)
    }
    next()
  })

  return router
}

const getEndpoints = (gqlpath = defaultGqlPath, pattern = defaultPattern, options = defaultOptions) => {
  let loaded = 0
  let errors = 0
  const entries = {}

  debugInfo('Start to load endpoints by pattern "%s", options = %o', pattern, options)
  glob.sync(pattern, options).forEach(file => {
    const query = fs.readFileSync(path.resolve(options.cwd || process.cwd(), file), 'utf8')
    const name = `/${path.parse(file).name}`
    try {
      gql(query)
      entries[name] = query
    } catch (E) {
      errors++
      return debugError('The graphql query inside file "%s" is invalid: %s', file, E.message)
    }
    loaded++
    debugInfo('graphql endpoint: %s is ready.', name)
  })
  debugInfo('All %d graphql entries loaded correctly, %d error files found', loaded, errors)
  return { errors, entries }
}

const GraphQLEndpoint = (app, gqlpath = defaultGqlPath, pattern = defaultPattern, options = defaultOptions) => {
  const { entries } = getEndpoints(gqlpath, pattern, options)
  app.use(createRouterByEntries(app, gqlpath, entries))
}

module.exports = {
  getEndpoints,
  GraphQLEndpoint
}
