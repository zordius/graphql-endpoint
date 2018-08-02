const { getEndpoints, GraphQLEndpoint } = require('.')
const mock = require('mock-fs')

describe('getEndpoints()', () => {
  afterEach(() => mock.restore())

  it('should response 0 errors', () => {
    expect(getEndpoints().errors).toEqual(0)
  })

  it('should response 1 error', () => {
    mock({
      'src/endpoints/test': 'bad graphql file'
    })
    expect(getEndpoints().errors).toEqual(1)
  })

  it('should receive correct graphql entry', () => {
    mock({
      'src/endpoints/goodend': '{ example(id: 123) { title, description } }'
    })
    expect(getEndpoints()).toEqual({
      errors: 0,
      entries: {
        '/goodend': '{ example(id: 123) { title, description } }'
      }
    })
  })
})
